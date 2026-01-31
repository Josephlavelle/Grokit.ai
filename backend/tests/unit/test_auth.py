import pytest
from unittest.mock import MagicMock, patch
from werkzeug.security import generate_password_hash


class TestSignup:
    """Test signup endpoint."""

    def test_signup_missing_fields(self, client):
        """Test signup with missing fields."""
        response = client.post('/auth/signup', json={'email': 'test@example.com'})
        assert response.status_code == 400
        assert 'error' in response.get_json()

    def test_signup_success(self, client, mock_db):
        """Test successful user signup."""
        with patch('auth.User') as MockUser, \
             patch('auth.get_signup_whitelist', return_value=None), \
             patch('auth.is_email_verification_required', return_value=False), \
             patch('auth.AnalyticsTracker'), \
             patch('auth.login_user'):
            # Mock User.get_by_email to return None (no existing user)
            MockUser.get_by_email.return_value = None

            # Mock user instance
            mock_user = MagicMock()
            mock_user.id = 'new-user-id'
            mock_user.email = 'newuser@example.com'
            MockUser.return_value = mock_user

            response = client.post('/auth/signup', json={
                'email': 'newuser@example.com',
                'password': 'SecurePass123!'
            })

            assert response.status_code == 200
            data = response.get_json()
            assert 'user' in data
            assert data['user']['email'] == 'newuser@example.com'

    def test_signup_existing_user(self, client, mock_user):
        """Test signup with existing email."""
        with patch('auth.User') as MockUser, \
             patch('auth.get_signup_whitelist', return_value=None):
            MockUser.get_by_email.return_value = mock_user

            response = client.post('/auth/signup', json={
                'email': 'test@example.com',
                'password': 'Password123!'
            })

            assert response.status_code == 400
            assert 'already exists' in response.get_json()['error'].lower()

    def test_signup_whitelist_blocked(self, client):
        """Test signup blocked by whitelist."""
        with patch('auth.User'), \
             patch('auth.get_signup_whitelist', return_value=['allowed@example.com']):

            response = client.post('/auth/signup', json={
                'email': 'blocked@example.com',
                'password': 'Password123!'
            })

            assert response.status_code == 403
            assert 'not accepting' in response.get_json()['error'].lower()


class TestLogin:
    """Test login endpoint."""

    def test_login_success(self, client, mock_user, sample_user):
        """Test successful login."""
        with patch('auth.User') as MockUser, \
             patch('auth.is_email_verification_required', return_value=False), \
             patch('auth.AnalyticsTracker'), \
             patch('auth.login_user'):
            MockUser.get_by_email.return_value = mock_user

            response = client.post('/auth/login', json={
                'email': sample_user['email'],
                'password': sample_user['password']
            })

            assert response.status_code == 200
            data = response.get_json()
            assert 'user' in data
            assert data['user']['email'] == sample_user['email']

    def test_login_invalid_credentials(self, client, mock_user, sample_user):
        """Test login with wrong password."""
        with patch('auth.User') as MockUser:
            MockUser.get_by_email.return_value = mock_user

            response = client.post('/auth/login', json={
                'email': sample_user['email'],
                'password': 'WrongPassword'
            })

            assert response.status_code == 401
            assert 'invalid' in response.get_json()['error'].lower()

    def test_login_user_not_found(self, client):
        """Test login with non-existent user."""
        with patch('auth.User') as MockUser:
            MockUser.get_by_email.return_value = None

            response = client.post('/auth/login', json={
                'email': 'nonexistent@example.com',
                'password': 'Password123!'
            })

            assert response.status_code == 401
            assert 'invalid' in response.get_json()['error'].lower()

    def test_login_unverified_email(self, client, sample_user):
        """Test login with unverified email when verification required."""
        from firestore import User
        unverified_user = User(
            id=sample_user['id'],
            email=sample_user['email'],
            password_hash=sample_user['password_hash'],
            email_verified=False
        )

        with patch('auth.User') as MockUser, \
             patch('auth.is_email_verification_required', return_value=True):
            MockUser.get_by_email.return_value = unverified_user

            response = client.post('/auth/login', json={
                'email': sample_user['email'],
                'password': sample_user['password']
            })

            assert response.status_code == 403
            assert 'verify' in response.get_json()['error'].lower()


class TestLogout:
    """Test logout endpoint."""

    def test_logout(self, client):
        """Test logout endpoint."""
        with patch('auth.logout_user'):
            response = client.get('/auth/logout')

            assert response.status_code == 200
            assert 'logged out' in response.get_json()['message'].lower()
