from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Upload(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    filename = db.Column(db.String(255), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("user.id"),
        nullable=False
    )

    user = db.relationship("User", backref="uploads")

class Quiz(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    upload_id = db.Column(db.Integer, db.ForeignKey("upload.id"), nullable=True)
    content = db.Column(db.JSON, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False)

    user_id = db.Column(
        db.Integer,
        db.ForeignKey("user.id"),
        nullable=False
    )

    user = db.relationship("User", backref="quizzes")
    upload = db.relationship("Upload", backref="quizzes")