from flask import Flask, render_template, request, redirect, url_for, session
import os
import dotenv
from QuestionGenerator import QuestionGenerator
from flask import Flask
from flask_login import LoginManager, login_required, current_user
from models import db, User
from auth import auth

dotenv.load_dotenv()
app = Flask(__name__)

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "model_responses")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["MAX_CONTENT_LENGTH"] = 1 * 1024 * 1024
app.secret_key = os.getenv("APP_SECRET_KEY")
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("SQLALCHEMY_DATABASE_URI")
app.register_blueprint(auth)
#Init DB
db.init_app(app)
#Init Login Service
login_manager = LoginManager()
login_manager.login_view = "auth.login"
login_manager.init_app(app)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

with app.app_context():
    db.create_all()

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/upload", methods=["GET", "POST"])
@login_required
def upload():
    if request.method == "POST":
        file = request.files.get("file")
        name = request.form.get("quiz_name")
        if not file or file.filename == "":
            return "No file selected", 400
        if not file.filename.endswith(".txt"):
            return "Only .txt files are allowed", 400

        #Generate respone to session
        text = file.read().decode("utf-8")
        client = QuestionGenerator(user=current_user)
        mcq_data = client.make_request(input_text=text,quiz_name=name)
        session["questions_json"] = mcq_data

        return redirect(url_for("questions"))

    return render_template("upload.html")

@app.route("/questions", methods=["GET", "POST"])
@login_required
def questions():
    questions_json = session["questions_json"]
    if request.method == "POST":
        score = 0
        for i, q in enumerate(questions_json):
            user_answer = request.form.get(f"q{i}")
            if user_answer is not None and int(user_answer) == q["Ans"]:
                score += 1

        return render_template(
            "result.html",
            score=score,
            total=len(questions_json)
        )


    return render_template("questions.html", questions=questions_json)



if __name__ == "__main__":
    app.run(debug=True, port=5050)