import os
from groq import Groq
import logging
import json
import dotenv
from models import User, Upload, Quiz, db
from datetime import datetime

logger = logging.getLogger(__name__)
logging.basicConfig(filename='example.log', encoding='utf-8', level=logging.DEBUG)

class QuestionGenerator():
    # Maximum characters per chunk (~2500 tokens to stay well under Groq's 12k token limit)
    # Accounts for: input text + system prompt + expected output (~10 questions)
    MAX_CHUNK_CHARS = 10000
    # Target total questions across all chunks
    TARGET_TOTAL_QUESTIONS = 10

    def __init__(self, user:User, api_key=None, instructions_override = None):
        dotenv.load_dotenv()
        if not api_key:
            api_key = os.environ.get("GROQ_API_KEY")
        else:
            logger.debug("Overiding API key")
        if not instructions_override:
            self.instructions = ""
        else:
            logger.info(f"Using new instructions {instructions_override}")
            self.instructions = instructions_override
        self.client = Groq(api_key=api_key)
        self.user = user

    def chunk_text(self, text, max_chars=None):
        """Split text into chunks at paragraph boundaries.

        Args:
            text: The input text to chunk
            max_chars: Maximum characters per chunk (defaults to MAX_CHUNK_CHARS)

        Returns:
            List of text chunks
        """
        if max_chars is None:
            max_chars = self.MAX_CHUNK_CHARS

        # If text is small enough, return as single chunk
        if len(text) <= max_chars:
            return [text]

        # Split by paragraph (double newlines)
        paragraphs = text.split('\n\n')
        chunks = []
        current_chunk = ""

        for para in paragraphs:
            # If adding this paragraph would exceed limit
            if len(current_chunk) + len(para) + 2 > max_chars:
                # Save current chunk if it has content
                if current_chunk.strip():
                    chunks.append(current_chunk.strip())

                # If single paragraph is too large, split by sentences
                if len(para) > max_chars:
                    sentences = para.replace('. ', '.|').split('|')
                    current_chunk = ""
                    for sentence in sentences:
                        if len(current_chunk) + len(sentence) + 1 > max_chars:
                            if current_chunk.strip():
                                chunks.append(current_chunk.strip())
                            current_chunk = sentence + " "
                        else:
                            current_chunk += sentence + " "
                else:
                    current_chunk = para + "\n\n"
            else:
                current_chunk += para + "\n\n"

        # Don't forget the last chunk
        if current_chunk.strip():
            chunks.append(current_chunk.strip())

        logger.info(f"Split text into {len(chunks)} chunks")
        return chunks

    def request_quiz(self, input_text, quiz_name, model="llama-3.3-70b-versatile", temperature=0, instructions_override="", file_path="model_responses/"):
        """Generate a quiz from input text, with automatic chunking for large inputs.

        For texts larger than MAX_CHUNK_CHARS, the text is split into chunks and
        questions are generated from each chunk, then combined into a single quiz.

        Args:
            input_text: The source text to generate questions from
            quiz_name: Name for the quiz
            model: LLM model to use
            temperature: Generation temperature
            instructions_override: Custom instructions (overrides default)
            file_path: Base path for saving files

        Returns:
            List of question dictionaries
        """
        # Handle custom instructions override (maintains backward compatibility)
        if instructions_override:
            # Use old single-request behavior with custom instructions
            return self._request_quiz_single(input_text, quiz_name, model, temperature, instructions_override, file_path)

        # Chunk the input text
        chunks = self.chunk_text(input_text)
        num_chunks = len(chunks)

        logger.info(f"Processing {num_chunks} chunk(s) for quiz '{quiz_name}'")

        # Calculate questions per chunk
        # Distribute questions evenly, with any remainder going to earlier chunks
        base_questions = self.TARGET_TOTAL_QUESTIONS // num_chunks
        extra_questions = self.TARGET_TOTAL_QUESTIONS % num_chunks

        all_questions = []

        for i, chunk in enumerate(chunks):
            # Earlier chunks get extra questions if there's a remainder
            num_questions = base_questions + (1 if i < extra_questions else 0)

            # Ensure at least 1 question per chunk
            num_questions = max(1, num_questions)

            logger.info(f"Processing chunk {i+1}/{num_chunks} ({len(chunk)} chars, {num_questions} questions)")

            chunk_questions = self._request_quiz_chunk(chunk, num_questions, model, temperature)
            all_questions.extend(chunk_questions)

        logger.info(f"Generated {len(all_questions)} total questions from {num_chunks} chunks")

        # Save files and database records
        output_path = file_path + f"{self.user.id}/"
        output_filename = output_path + f"{quiz_name}_output.json"
        input_filename = output_path + f"{quiz_name}_input.txt"

        try:
            os.makedirs(output_path, exist_ok=True)
        except OSError as e:
            logger.error(f"Error creating directory {output_path}")

        with open(input_filename, mode="w") as f:
            f.write(input_text)

        with open(output_filename, mode="w") as f:
            f.write(json.dumps(all_questions, indent=2))

        # Save metadata to db
        input_upload = self.make_upload(input_filename)
        output_upload = self.make_upload(output_filename)

        db.session.add(input_upload)
        db.session.add(output_upload)
        db.session.commit()

        quiz = self.make_quiz(all_questions, output_filename)
        db.session.add(quiz)
        db.session.commit()

        return all_questions

    def _request_quiz_chunk(self, chunk_text, num_questions, model, temperature):
        """Generate quiz questions from a single chunk of text.

        Args:
            chunk_text: The text chunk to generate questions from
            num_questions: Number of questions to generate for this chunk
            model: The LLM model to use
            temperature: Temperature setting for generation

        Returns:
            List of question dictionaries
        """
        additional_instructions = f"""You are a study assistant tasked with generating accurate multiple-choice questions from a provided lecture transcript or textbook excerpt.
            Rules:
            Use only information explicitly stated in the provided text. Do not use outside knowledge.
            Generate a total of {num_questions} questions.
            Each question must test an important concept from the text.
            Each question must have exactly 4 options.
            Only one option may be correct.
            All incorrect options must be clearly wrong and not partially correct.
            Provide a verbatim citation from the text that supports the correct answer.
            Validation step (must be followed):
            Before outputting, verify that each correct answer is directly supported by its citation.
            If any question is ambiguous or unsupported, revise it.

            Output format:
            Output only valid JSON (no extra text).
            The JSON must be immediately parseable by json.load().
            [
                {{
                    "Question": "Question text here?",
                    "Options": ["Option A", "Option B", "Option C", "Option D"],
                    "Ans": 2,
                    "Citation": "Exact sentence from the text that proves the answer."
                }}
            ]
            """

        try:
            chat_completion = self.client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": self.instructions + additional_instructions
                    },
                    {
                        "role": "user",
                        "content": chunk_text
                    }
                ],
                temperature=temperature,
                model=model,
            )
        except Exception as e:
            logger.error(f"Groq API error for chunk: {e}")
            raise RuntimeError(f"Failed to generate questions from chunk: {e}")

        response_content = chat_completion.choices[0].message.content
        try:
            return json.loads(response_content)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse chunk response: {e}")
            logger.debug(f"Response content: {response_content}")
            return []

    def _request_quiz_single(self, input_text, quiz_name, model, temperature, instructions_override, file_path):
        """Original single-request quiz generation for backward compatibility with custom instructions."""
        chat_completion = self.client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": self.instructions + instructions_override
                },
                {
                    "role": "user",
                    "content": input_text
                }
            ],
            temperature=temperature,
            model=model,
        )

        output_path = file_path + f"{self.user.id}/"
        output_filename = output_path + f"{quiz_name}_output.json"
        input_filename = output_path + f"{quiz_name}_input.txt"

        try:
            os.makedirs(output_path, exist_ok=True)
        except OSError as e:
            logger.error(f"Error creating directory {output_path}")

        with open(input_filename, mode="w") as f:
            f.write(input_text)

        with open(output_filename, mode="w") as f:
            f.write(chat_completion.choices[0].message.content)

        f = open(output_filename)
        questions_raw = f.read()
        output_json = json.loads(questions_raw)

        # Save metadata to db
        input_upload = self.make_upload(input_filename)
        output_upload = self.make_upload(output_filename)

        db.session.add(input_upload)
        db.session.add(output_upload)
        db.session.commit()

        quiz = self.make_quiz(output_json, output_filename)
        db.session.add(quiz)
        db.session.commit()

        return output_json
    
    def request_feedback(self, input_text, model= "llama-3.3-70b-versatile", temperature = 0, additional_instructions = "", file_path = "feedback/"):
        if not additional_instructions:
            additional_instructions = """
            You are a study assistant generating feedback for incorrectly answered quiz questions.
            
            Rules:
            Use only information explicitly stated in the provided source text.
            Do not reference quiz options, answer numbers, or the student’s selected answer.
            Do not speculate or introduce new facts.
            Explain the correct concept clearly and briefly.
            If the source text does not contain enough information to explain the concept, state that.

            Task:
            For each incorrectly answered question:
            Provide a short explanation of the correct concept and reasoning, grounded in the source text.

            Validation step (must be followed):
            Verify that every statement is directly supported by the source text.
            Remove or revise any unsupported claims before outputting.

            Output format:
            Output only valid JSON (no extra text).
            The JSON must be immediately parseable by json.load().
            Output only valid JSON that conforms to the below format
            [
                {
                    "number": 1
                    "question": "<Question From Quiz>",
                    "feedback": "<Explanation for user answer being wrong, and correct answer being right>"
                }
            ],
            """
        chat_completion = self.client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": self.instructions + additional_instructions
                },
                {
                "role": "user",
                "content": input_text
                }
            ],
            temperature = temperature,
            model=model,
        )
        feedback = chat_completion.choices[0].message.content

        return feedback
    
    def make_upload(self, filename):
        return Upload(filename=filename, user_id=self.user.id, content = "output", created_at=datetime.now())
    
    def make_quiz(self, quiz_json, filename = None):
        #TODO at some point this should refactor to use ID rather than filename
        if filename:
            output_file = Upload.query.filter_by(filename=filename).first()
            return Quiz(user_id=self.user.id, content = quiz_json, upload_id = output_file.id, created_at=datetime.now())
        else:
            return Quiz(user_id=self.user.id, content = quiz_json, upload_id = None, created_at=datetime.now())