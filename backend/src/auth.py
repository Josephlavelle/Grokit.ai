from flask import Blueprint, request, jsonify
from flask_login import login_user, logout_user, current_user
from firestore import User, get_signup_whitelist

auth = Blueprint("auth", __name__, url_prefix="/auth")

@auth.route("/signup", methods=["POST"])
def signup():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400

    # Check whitelist if enabled
    whitelist = get_signup_whitelist()
    if whitelist is not None and email.lower() not in whitelist:
        return jsonify({"error": "This app is not accepting new users at this time"}), 403

    if User.get_by_email(email):
        return jsonify({"error": "User already exists"}), 400

    user = User(email=email)
    user.set_password(password)
    user.save()

    login_user(user)
    return jsonify({"user": {"id": user.id, "email": user.email}})

@auth.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    user = User.get_by_email(email)
    if user and user.check_password(password):
        login_user(user)
        return jsonify({"user": {"id": user.id, "email": user.email}})

    return jsonify({"error": "Invalid credentials"}), 401

@auth.route("/logout")
def logout():
    logout_user()
    return jsonify({"message": "Logged out"})
