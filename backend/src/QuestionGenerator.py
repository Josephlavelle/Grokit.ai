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

    def request_quiz(self, input_text, quiz_name, model= "llama-3.3-70b-versatile", temperature = 0, instructions_override = "", file_path = "model_responses/"):
        if not instructions_override:
            additional_instructions = """You are a study assistant tasked with helping prepare study content for the student
                using it. You will be given a text-based input that is either a lecture transcript or textbook exerpt. 
                Please generate a list of 10 multiple choice questions with 4 options, only one of which is correct. These questions
                should summarize key topics in the text input to help the studet understand the key topics. 
                Please include no text other than the JSON in the response and have it formetted such that it can 
                be immediately parsed using pythons json.load() function.
                Please output the questions according the following example JSON:
                [
                    {
                        "Question": "What is the right Answer?",
                        "Options":[ "Option 1", "Option 2", "Right Option", "Option 4"]
                        "Ans": 3
                    }
                ],
                etc...
                """
        else:
            additional_instructions = instructions_override
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
        output_path = file_path+f"{self.user.id}/"
        output_filename = output_path + f"{quiz_name}_output.json" 
        input_filename = output_path+f"{quiz_name}_input.txt"
        try:
            os.makedirs(output_path, exist_ok=True)
        except OSError as e:
            logger.error(f"Error creating directory {output_path}")
        
        with open(input_filename, mode = "w") as f:
            f.write(input_text)

        with open(output_filename, mode = "w") as f:
            f.write(chat_completion.choices[0].message.content)

        f = open(output_filename)
        questions_raw = f.read()
        output_json = json.loads(questions_raw)

        #Save metadata to dbb
        input_upload = self.make_upload(input_filename)
        output_upload = self.make_upload(output_filename)
    
        db.session.add(input_upload)
        db.session.add(output_upload)
        db.session.commit()
        
        quiz = self.make_quiz(output_json,output_filename)
        db.session.add(quiz)
        db.session.commit()

        return output_json
    
    def request_feedback(self, input_text, model= "llama-3.3-70b-versatile", temperature = 0, additional_instructions = "", file_path = "feedback/"):
        if not additional_instructions:
            additional_instructions = """
                Given the below incorrectly answered quiz questions. Please generate a 
                brief response on why the chosen answers are incorrect and describe which answer is correct. I will leave to you to 
                determine the response length but please favour shorter answers so long as they convey 
                to the end user the correct reasoning and help them learn.

                Include no text other than the JSON in the response and have it formetted such that it can 
                be immediately parsed using pythons json.load() function.
                Please output the feedback according the following example JSON:
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