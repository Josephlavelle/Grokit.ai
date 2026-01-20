import os
from flask import Blueprint, request, jsonify, redirect
from flask_login import login_user, logout_user, current_user
from firestore import User, get_signup_whitelist
import email_service

auth = Blueprint("auth", __name__, url_prefix="/auth")

APP_URL = os.getenv("APP_URL", "http://localhost:5050")

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
    token = user.generate_verification_token()
    user.save()

    # Send verification email
    if email_service.send_verification_email(email, token):
        return jsonify({
            "message": "Account created. Please check your email to verify your account.",
            "email": email
        })
    else:
        return jsonify({
            "message": "Account created but failed to send verification email. Please try resending.",
            "email": email
        })

@auth.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    user = User.get_by_email(email)
    if user and user.check_password(password):
        if not user.email_verified:
            return jsonify({"error": "Please verify your email before logging in"}), 403
        login_user(user)
        return jsonify({"user": {"id": user.id, "email": user.email}})

    return jsonify({"error": "Invalid credentials"}), 401

@auth.route("/verify")
def verify():
    token = request.args.get("token")

    if not token:
        return jsonify({"error": "Verification token required"}), 400

    user = User.get_by_verification_token(token)
    if not user:
        return jsonify({"error": "Invalid or expired verification token"}), 400

    if not user.verify_token(token):
        return jsonify({"error": "Verification token has expired"}), 400

    user.mark_verified()
    user.save()

    # Redirect to frontend login page
    return redirect(f"{APP_URL}/login?verified=true")

@auth.route("/resend-verification", methods=["POST"])
def resend_verification():
    data = request.get_json()
    email = data.get("email")

    if not email:
        return jsonify({"error": "Email required"}), 400

    user = User.get_by_email(email)
    if not user:
        return jsonify({"error": "User not found"}), 404

    if user.email_verified:
        return jsonify({"error": "Email already verified"}), 400

    token = user.generate_verification_token()
    user.save()

    if email_service.send_verification_email(email, token):
        return jsonify({"message": "Verification email sent"})
    else:
        return jsonify({"error": "Failed to send verification email"}), 500

@auth.route("/logout")
def logout():
    logout_user()
    return jsonify({"message": "Logged out"})
