from flask import Blueprint, request, jsonify
from flask_login import login_user, logout_user, current_user
from models import db, User

auth = Blueprint("auth", __name__, url_prefix="/auth")

@auth.route("/signup", methods=["POST"])
def signup():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "User already exists"}), 400

    user = User(email=email)
    user.set_password(password)

    db.session.add(user)
    db.session.commit()

    login_user(user)
    return jsonify({"user": {"id": user.id, "email": user.email}})

@auth.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    user = User.query.filter_by(email=email).first()
    if user and user.check_password(password):
        login_user(user)
        return jsonify({"user": {"id": user.id, "email": user.email}})

    return jsonify({"error": "Invalid credentials"}), 401

@auth.route("/logout")
def logout():
    logout_user()
    return jsonify({"message": "Logged out"})
