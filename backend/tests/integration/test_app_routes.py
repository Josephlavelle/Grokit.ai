import pytest
import json
from io import BytesIO
from unittest.mock import MagicMock, patch, PropertyMock


class TestMeRoute:
    """Test /api/me route."""

    def test_me_unauthenticated(self, client):
        """Test me route when not authenticated."""
        response = client.get('/api/me')
        assert response.status_code == 200
        assert response.get_json()['user'] is None

    def test_me_authenticated(self, client, mock_user):
        """Test me route when authenticated."""
        # Mock current_user to be authenticated
        mock_user_obj = MagicMock()
        mock_user_obj.is_authenticated = True
        mock_user_obj.id = mock_user.id
        mock_user_obj.email = mock_user.email

        with patch('app.current_user', mock_user_obj):
            response = client.get('/api/me')
            assert response.status_code == 200
            data = response.get_json()
            assert data['user'] is not None
            assert data['user']['email'] == mock_user.email


class TestUploadRoute:
    """Test /api/upload route."""

    def test_upload_requires_auth(self, client):
        """Test that upload requires authentication."""
        response = client.post('/api/upload')
        assert response.status_code == 401


class TestQuizzesRoute:
    """Test /api/quizzes routes."""

    def test_get_quizzes_requires_auth(self, client):
        """Test that getting quizzes requires authentication."""
        response = client.get('/api/quizzes')
        assert response.status_code == 401


class TestQuestionsRoute:
    """Test /questions route."""

    def test_questions_get_requires_auth(self, client):
        """Test that questions GET requires authentication."""
        response = client.get('/questions')
        assert response.status_code == 401


class TestHomeRoute:
    """Test home route."""

    def test_home_returns_json_or_html(self, client):
        """Test home route returns appropriate response."""
        response = client.get('/')
        assert response.status_code == 200


class TestErrorHandlers:
    """Test error handlers."""

    def test_404_handler(self, client):
        """Test 404 error handler."""
        response = client.get('/nonexistent-path-12345')
        assert response.status_code in [200, 404]  # 200 if serving SPA, 404 otherwise
