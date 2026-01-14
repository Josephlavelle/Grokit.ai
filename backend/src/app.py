from flask import Flask, request, session, jsonify, Blueprint
from flask_cors import CORS
from flask_login import LoginManager, login_required, current_user
import os
import dotenv
import json
from QuestionGenerator import QuestionGenerator
from models import db, User, Quiz

dotenv.load_dotenv()
app = Flask(__name__)

# CORS configuration for React frontend
CORS(app, supports_credentials=True, origins=["http://localhost:5173"])

api = Blueprint("api", __name__, url_prefix="/api")
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "model_responses")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["MAX_CONTENT_LENGTH"] = 1 * 1024 * 1024
app.secret_key = os.getenv("APP_SECRET_KEY")
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("SQLALCHEMY_DATABASE_URI")

# Import and register auth blueprint
from auth import auth
app.register_blueprint(auth)

# Init DB
db.init_app(app)

# Init Login Service
login_manager = LoginManager()
login_manager.login_view = "auth.login"
login_manager.init_app(app)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

@login_manager.unauthorized_handler
def unauthorized():
    return jsonify({"error": "Authentication required"}), 401

with app.app_context():
    db.create_all()

@app.route("/")
def home():
    return jsonify({"message": "Groker API"})

@api.route("/me")
def me():
    if current_user.is_authenticated:
        return jsonify({"user": {"id": current_user.id, "email": current_user.email}})
    return jsonify({"user": None})

@api.route("/upload", methods=["POST"])
@login_required
def upload():
    file = request.files.get("file")
    name = request.form.get("quiz_name")

    if not file or file.filename == "":
        return jsonify({"error": "No file selected"}), 400
    if not file.filename.endswith(".txt"):
        return jsonify({"error": "Only .txt files are allowed"}), 400

    # Generate response to session
    text = file.read().decode("utf-8")
    client = QuestionGenerator(user=current_user)
    mcq_data = client.request_quiz(input_text=text, quiz_name=name)
    session["questions_json"] = mcq_data

    return jsonify({
        "questions": mcq_data,
        "user": current_user.email
    })

@api.route("/quizzes")
@login_required
def get_quizzes():
    quizzes = Quiz.query.filter_by(user_id=current_user.id).order_by(Quiz.created_at.desc()).all()

    def get_quiz_name(quiz):
        if quiz.upload and quiz.upload.filename:
            # Extract name from filename like "quiz_name_output.json"
            name = quiz.upload.filename.split('/')[-1]  # Get just the filename
            if name.endswith('_output.json'):
                return name.replace('_output.json', '')
        return f"Quiz {quiz.id}"

    return jsonify({
        "quizzes": [
            {
                "id": q.id,
                "name": get_quiz_name(q),
                "created_at": q.created_at.isoformat(),
                "question_count": len(q.content) if q.content else 0
            }
            for q in quizzes
        ]
    })

@api.route("/quizzes/<int:quiz_id>")
@login_required
def get_quiz(quiz_id):
    quiz = Quiz.query.filter_by(id=quiz_id, user_id=current_user.id).first()

    if not quiz:
        return jsonify({"error": "Quiz not found"}), 404

    # Store in session so scoring works
    session["questions_json"] = quiz.content

    def get_quiz_name(quiz):
        if quiz.upload and quiz.upload.filename:
            name = quiz.upload.filename.split('/')[-1]
            if name.endswith('_output.json'):
                return name.replace('_output.json', '')
        return f"Quiz {quiz.id}"

    return jsonify({
        "id": quiz.id,
        "name": get_quiz_name(quiz),
        "questions": quiz.content,
        "created_at": quiz.created_at.isoformat()
    })

@api.route("/feedback", methods=["POST"])
@login_required
def get_feedback():
    """Generate feedback based on quiz results"""

    data = request.get_json()
    wrong_answers = data.get("wrong_answers", [])
    score = data.get("score", 0)
    total = data.get("total", 0)
    client = QuestionGenerator(user=current_user)
    feedback = client.request_feedback(input_text=str(wrong_answers))
    print(feedback)
    feedback_json = jsonify({
        "feedback": json.loads(feedback)
    })
    print(feedback_json)
    return feedback_json

app.register_blueprint(api)

@app.route("/questions", methods=["GET", "POST"])
@login_required
def questions():
    questions_json = session.get("questions_json", [])

    if request.method == "POST":
        score = 0
        wrong_answers = []

        for i, q in enumerate(questions_json):
            user_answer = request.form.get(f"q{i}")
            correct_answer = q["Ans"]

            if user_answer is not None:
                user_answer_int = int(user_answer)
                if user_answer_int == correct_answer:
                    score += 1
                else:
                    wrong_answers.append({
                        "question_number": i + 1,
                        "question": q["Question"],
                        "options": q["Options"],
                        "user_answer": user_answer_int,
                        "correct_answer": correct_answer
                    })

        return jsonify({
            "score": score,
            "total": len(questions_json),
            "wrong_answers": wrong_answers
        })

    return jsonify({
        "questions": questions_json
    })


if __name__ == "__main__":
    app.run(debug=True, port=5050)
