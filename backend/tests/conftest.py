import os
import sys
import pytest
from unittest.mock import MagicMock, patch
from werkzeug.security import generate_password_hash

# Add src to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

# Set test environment variables before importing app
os.environ['APP_SECRET_KEY'] = 'test-secret-key'
os.environ['GROQ_API_KEY'] = 'test-groq-api-key'
os.environ['S3_BUCKET'] = 'test-bucket'
os.environ['DEPLOYED_ENV'] = 'test'


@pytest.fixture
def mock_db():
    """Mock Firestore database."""
    return MagicMock()


@pytest.fixture
def app(mock_db):
    """Create test Flask app."""
    with patch('firestore.get_db', return_value=mock_db), \
         patch('firestore.get_signup_whitelist', return_value=None), \
         patch('firestore.is_email_verification_required', return_value=False), \
         patch('s3.upload_file'), \
         patch('s3.get_file'), \
         patch('s3.delete_file'):
        from app import app as flask_app
        flask_app.config['TESTING'] = True
        flask_app.config['WTF_CSRF_ENABLED'] = False
        yield flask_app


@pytest.fixture
def client(app):
    """Create test client."""
    return app.test_client()


@pytest.fixture
def sample_user():
    """Sample user data."""
    return {
        'id': 'test-user-id',
        'email': 'test@example.com',
        'password': 'TestPassword123!',
        'password_hash': generate_password_hash('TestPassword123!')
    }


@pytest.fixture
def mock_user(sample_user):
    """Create a mock User object."""
    from firestore import User
    user = User(
        id=sample_user['id'],
        email=sample_user['email'],
        password_hash=sample_user['password_hash'],
        email_verified=True
    )
    return user


@pytest.fixture
def sample_questions():
    """Sample quiz questions."""
    return [
        {
            "Question": "What is 2 + 2?",
            "Options": ["3", "4", "5", "6"],
            "Ans": 1,
            "Citation": "Basic arithmetic"
        },
        {
            "Question": "What is the capital of France?",
            "Options": ["London", "Berlin", "Paris", "Madrid"],
            "Ans": 2,
            "Citation": "Geography"
        }
    ]


@pytest.fixture
def mock_question_generator(sample_questions):
    """Mock QuestionGenerator class."""
    with patch('app.QuestionGenerator') as mock_qg:
        mock_instance = MagicMock()
        mock_qg.return_value = mock_instance
        mock_instance.request_quiz.return_value = sample_questions
        mock_instance.request_feedback.return_value = '[{"number": 1, "question": "Q?", "feedback": "Explanation"}]'
        yield mock_instance
