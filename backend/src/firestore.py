import os
import json
import base64
import tempfile
from google.cloud import firestore
from google.cloud.firestore_v1.base_query import FieldFilter
from werkzeug.security import generate_password_hash, check_password_hash
from flask_login import UserMixin
from datetime import datetime

_db = None

def _setup_credentials():
    """Set up Firebase credentials from environment variable if provided."""
    creds_json = os.getenv("GOOGLE_APPLICATION_CREDENTIALS_JSON")
    if creds_json:
        # Decode base64 credentials and write to temp file
        creds_data = base64.b64decode(creds_json)
        temp_file = tempfile.NamedTemporaryFile(mode='wb', suffix='.json', delete=False)
        temp_file.write(creds_data)
        temp_file.close()
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = temp_file.name

# Set up credentials on module load
_setup_credentials()

def get_db():
    """Get or create Firestore client singleton."""
    global _db
    if _db is None:
        _db = firestore.Client()
    return _db


class User(UserMixin):
    """User model compatible with Flask-Login."""

    def __init__(self, id=None, email=None, password_hash=None):
        self.id = id
        self.email = email
        self.password_hash = password_hash

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def get_id(self):
        return str(self.id)

    def save(self):
        """Save user to Firestore."""
        db = get_db()
        users_ref = db.collection("users")

        if self.id is None:
            # New user - create document
            doc_ref = users_ref.document()
            self.id = doc_ref.id
            doc_ref.set({
                "email": self.email,
                "password_hash": self.password_hash,
                "created_at": datetime.now()
            })
        else:
            # Update existing user
            users_ref.document(str(self.id)).update({
                "email": self.email,
                "password_hash": self.password_hash
            })
        return self

    @staticmethod
    def get_by_id(user_id):
        """Get user by ID."""
        db = get_db()
        doc = db.collection("users").document(str(user_id)).get()
        if doc.exists:
            data = doc.to_dict()
            return User(id=doc.id, email=data["email"], password_hash=data["password_hash"])
        return None

    @staticmethod
    def get_by_email(email):
        """Get user by email."""
        db = get_db()
        docs = db.collection("users").where(filter=FieldFilter("email", "==", email)).limit(1).stream()
        for doc in docs:
            data = doc.to_dict()
            return User(id=doc.id, email=data["email"], password_hash=data["password_hash"])
        return None


class Upload:
    """Upload model for tracking file uploads."""

    def __init__(self, id=None, filename=None, content=None, created_at=None, user_id=None):
        self.id = id
        self.filename = filename
        self.content = content
        self.created_at = created_at or datetime.now()
        self.user_id = user_id

    def save(self):
        """Save upload to Firestore."""
        db = get_db()
        uploads_ref = db.collection("uploads")

        if self.id is None:
            doc_ref = uploads_ref.document()
            self.id = doc_ref.id
            doc_ref.set({
                "upload_id": self.id,
                "filename": self.filename,
                "content": self.content,
                "created_at": self.created_at,
                "user_id": self.user_id
            })
        else:
            uploads_ref.document(str(self.id)).update({
                "upload_id": self.id,
                "filename": self.filename,
                "content": self.content
            })
        return self

    @staticmethod
    def get_by_id(upload_id):
        """Get upload by ID."""
        db = get_db()
        doc = db.collection("uploads").document(str(upload_id)).get()
        if doc.exists:
            data = doc.to_dict()
            return Upload(
                id=doc.id,
                filename=data["filename"],
                content=data["content"],
                created_at=data.get("created_at"),
                user_id=data["user_id"]
            )
        return None

    @staticmethod
    def get_by_filename(filename):
        """Get upload by filename."""
        db = get_db()
        docs = db.collection("uploads").where(filter=FieldFilter("filename", "==", filename)).limit(1).stream()
        for doc in docs:
            data = doc.to_dict()
            return Upload(
                id=doc.id,
                filename=data["filename"],
                content=data["content"],
                created_at=data.get("created_at"),
                user_id=data["user_id"]
            )
        return None


class Quiz:
    """Quiz model for storing generated quizzes."""

    def __init__(self, id=None, upload_id=None, content=None, created_at=None,
                 status="created", user_id=None, upload=None):
        self.id = id
        self.upload_id = upload_id
        self.content = content
        self.created_at = created_at or datetime.now()
        self.status = status
        self.user_id = user_id
        self._upload = upload  # Cached upload object

    @property
    def upload(self):
        """Lazy load the associated upload."""
        if self._upload is None and self.upload_id:
            self._upload = Upload.get_by_id(self.upload_id)
        return self._upload

    def save(self):
        """Save quiz to Firestore."""
        db = get_db()
        quizzes_ref = db.collection("quizzes")

        if self.id is None:
            doc_ref = quizzes_ref.document()
            self.id = doc_ref.id
            doc_ref.set({
                "upload_id": self.upload_id,
                "content": self.content,
                "created_at": self.created_at,
                "status": self.status,
                "user_id": self.user_id
            })
        else:
            quizzes_ref.document(str(self.id)).update({
                "upload_id": self.upload_id,
                "content": self.content,
                "status": self.status
            })
        return self

    @staticmethod
    def get_by_id(quiz_id):
        """Get quiz by ID."""
        db = get_db()
        doc = db.collection("quizzes").document(str(quiz_id)).get()
        if doc.exists:
            data = doc.to_dict()
            return Quiz(
                id=doc.id,
                upload_id=data.get("upload_id"),
                content=data["content"],
                created_at=data.get("created_at"),
                status=data.get("status", "created"),
                user_id=data["user_id"]
            )
        return None

    @staticmethod
    def get_by_user(user_id, status="created"):
        """Get all quizzes for a user with given status, ordered by created_at desc."""
        db = get_db()
        query = db.collection("quizzes").where(filter=FieldFilter("user_id", "==", str(user_id)))
        if status:
            query = query.where(filter=FieldFilter("status", "==", status))
        query = query.order_by("created_at", direction=firestore.Query.DESCENDING)

        quizzes = []
        for doc in query.stream():
            data = doc.to_dict()
            quizzes.append(Quiz(
                id=doc.id,
                upload_id=data.get("upload_id"),
                content=data["content"],
                created_at=data.get("created_at"),
                status=data.get("status", "created"),
                user_id=data["user_id"]
            ))
        return quizzes

    @staticmethod
    def get_by_user_and_id(user_id, quiz_id, status=None):
        """Get a specific quiz by user and quiz ID."""
        quiz = Quiz.get_by_id(quiz_id)
        if quiz and quiz.user_id == str(user_id):
            if status is None or quiz.status == status:
                return quiz
        return None
