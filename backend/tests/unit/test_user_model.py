import pytest
from unittest.mock import MagicMock, patch
from datetime import datetime, timedelta


class TestUserModel:
    """Test User model."""

    def test_set_and_check_password(self, mock_db):
        """Test password hashing and verification."""
        from firestore import User

        user = User(email='test@example.com')
        user.set_password('MySecretPassword123')

        assert user.password_hash is not None
        assert user.password_hash != 'MySecretPassword123'
        assert user.check_password('MySecretPassword123') is True
        assert user.check_password('WrongPassword') is False

    def test_generate_verification_token(self, mock_db):
        """Test verification token generation."""
        from firestore import User

        user = User(email='test@example.com')
        token = user.generate_verification_token()

        assert token is not None
        assert len(token) > 20
        assert user.verification_token == token
        assert user.verification_token_expires > datetime.now()

    def test_verify_token_valid(self, mock_db):
        """Test valid token verification."""
        from firestore import User

        user = User(email='test@example.com')
        token = user.generate_verification_token()

        assert user.verify_token(token) is True

    def test_verify_token_expired(self, mock_db):
        """Test expired token verification."""
        from firestore import User

        user = User(email='test@example.com')
        user.verification_token = 'test-token'
        user.verification_token_expires = datetime.now() - timedelta(hours=1)

        assert user.verify_token('test-token') is False

    def test_verify_token_wrong_token(self, mock_db):
        """Test wrong token verification."""
        from firestore import User

        user = User(email='test@example.com')
        user.generate_verification_token()

        assert user.verify_token('wrong-token') is False

    def test_mark_verified(self, mock_db):
        """Test marking user as verified."""
        from firestore import User

        user = User(email='test@example.com')
        user.generate_verification_token()
        user.mark_verified()

        assert user.email_verified is True
        assert user.verification_token is None
        assert user.verification_token_expires is None

    def test_get_id(self, mock_db):
        """Test get_id for Flask-Login compatibility."""
        from firestore import User

        user = User(id='user-123', email='test@example.com')
        assert user.get_id() == 'user-123'
