from flask import Flask, request, session, jsonify, Blueprint
from flask_cors import CORS
from flask_login import LoginManager, login_required, current_user
import os
import dotenv
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
    mcq_data = client.make_request(input_text=text, quiz_name=name)
    session["questions_json"] = mcq_data

    return jsonify({
        "questions": mcq_data,
        "user": current_user.email
    })

@api.route("/quizzes")
@login_required
def get_quizzes():
    quizzes = Quiz.query.filter_by(user_id=current_user.id).all()
    return jsonify({
        "quizzes": [
            {"id": q.id, "name": q.upload.filename if q.upload else f"Quiz {q.id}", "created_at": q.created_at.isoformat()}
            for q in quizzes
        ]
    })

app.register_blueprint(api)

@app.route("/questions", methods=["GET", "POST"])
@login_required
def questions():
    questions_json = session.get("questions_json", [])

    if request.method == "POST":
        score = 0
        for i, q in enumerate(questions_json):
            user_answer = request.form.get(f"q{i}")
            if user_answer is not None and int(user_answer) == q["Ans"]:
                score += 1

        return jsonify({
            "score": score,
            "total": len(questions_json)
        })

    return jsonify({
        "questions": questions_json
    })


if __name__ == "__main__":
    app.run(debug=True, port=5050)
