import os
from groq import Groq
import logging
import json
import dotenv
from models import User

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
            self.instructions = """You are a study assistant tasked with helping prepare study content for the student
                using it. You will be given a text-based input that is either a lecture transcript or textbook exerpt. 
                Please generate a list of 10 multiple choice questions with 4 options, only one of which is correct. These questions
                should summarize key topics in the text input to help the studet understand the key topics. 
                Please include no text other than the JSON in the response and have it formetted such that it can 
                be immediately parsed using pythons json.load() function.
                Please output the questions occording the following example JSON:
                [
                    {
                        "Question": "What is the right Answer?"",
                        "Options":[ "Option 1", "Option 2", "Right Option", "Option 4"]
                        "Ans": 3
                    }
                ],
                etc...
                """
        else:
            logger.info(f"Using new instructions {instructions_override}")
            self.instructions = instructions_override
        self.client = Groq(api_key=api_key)
        self.user = user

    def make_request(self, input_text, model= "llama-3.3-70b-versatile", temperature = 0, additional_instructions = "", file_path = "model_responses/"):
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
        try:
            os.makedirs(output_path, exist_ok=True)
        except OSError as e:
            logger.error(f"Error creating directory {output_path}")
        
        with open(output_path+"input.txt", mode = "w") as f:
            f.write(input_text)

        with open(output_path + "output.json", mode = "w") as f:
            f.write(chat_completion.choices[0].message.content)

        f =  open(output_path + "output.json")
        questions_raw = f.read()
        output_json = json.loads(questions_raw)
        return output_json