"""Analytics tracking module for Firestore-based event tracking."""

import os
import uuid
import logging
from datetime import datetime
from google.cloud import firestore
from firestore import get_db
from flask import request, g

logger = logging.getLogger(__name__)

# Environment: "dev" or "prod" - defaults to "dev" for safety
ANALYTICS_ENV = os.getenv("DEPLOYED_ENV", "dev")


def get_events_collection():
    """Get the analytics events collection name based on environment."""
    return f"analytics_events_{ANALYTICS_ENV}"


def get_sessions_collection():
    """Get the analytics sessions collection name based on environment."""
    return f"analytics_sessions_{ANALYTICS_ENV}"


class EventTypes:
    """Event type constants for analytics tracking."""
    LOGIN = "login"
    SIGNUP = "signup"
    QUIZ_CREATE = "quiz_create"
    QUIZ_TAKE = "quiz_take"
    FEEDBACK_REQUEST = "feedback_request"
    SHARE_LINK_CLICKED = "share_link_clicked"


class AnalyticsEvent:
    """Analytics event model for tracking user activities."""

    def __init__(self, event_type, user_id=None, session_id=None,
                 is_authenticated=False, is_new_user=False, metadata=None):
        self.event_type = event_type
        self.user_id = user_id
        self.session_id = session_id
        self.is_authenticated = is_authenticated
        self.is_new_user = is_new_user
        self.metadata = metadata or {}
        self.timestamp = datetime.now()

    def to_dict(self):
        return {
            "event_type": self.event_type,
            "timestamp": self.timestamp,
            "user_id": self.user_id,
            "session_id": self.session_id,
            "is_authenticated": self.is_authenticated,
            "is_new_user": self.is_new_user,
            "metadata": self.metadata
        }

    def save(self):
        """Save event to Firestore."""
        db = get_db()
        db.collection(get_events_collection()).add(self.to_dict())
        return self


class AnalyticsTracker:
    """Helper class for tracking analytics events."""

    @staticmethod
    def get_session_id():
        """Get or create session ID from request context."""
        # Check if already set in request context
        if hasattr(g, 'analytics_session_id') and g.analytics_session_id:
            return g.analytics_session_id

        # Try to get from cookie or header
        session_id = request.cookies.get('analytics_session_id')
        if not session_id:
            session_id = request.headers.get('X-Analytics-Session-ID')
        if not session_id:
            session_id = str(uuid.uuid4())

        g.analytics_session_id = session_id
        return session_id

    @staticmethod
    def is_new_session(session_id):
        """Check if this is a new session (first-time visitor)."""
        db = get_db()
        session_doc = db.collection(get_sessions_collection()).document(session_id).get()
        return not session_doc.exists

    @staticmethod
    def update_session(session_id, user_id=None):
        """Update or create session record."""
        db = get_db()
        session_ref = db.collection(get_sessions_collection()).document(session_id)
        session_doc = session_ref.get()

        now = datetime.now()

        if session_doc.exists:
            update_data = {
                "last_seen": now,
                "events_count": firestore.Increment(1)
            }
            if user_id:
                update_data["user_id"] = user_id
            session_ref.update(update_data)
        else:
            session_ref.set({
                "first_seen": now,
                "last_seen": now,
                "user_id": user_id,
                "events_count": 1
            })

    @staticmethod
    def track(event_type, user=None, metadata=None):
        """Track an analytics event.

        Args:
            event_type: Type of event (use EventTypes constants)
            user: Current user object (or None for anonymous)
            metadata: Additional event-specific data
        """
        try:
            session_id = AnalyticsTracker.get_session_id()
            user_id = str(user.id) if user and hasattr(user, 'id') else None
            is_authenticated = user is not None and hasattr(user, 'is_authenticated') and user.is_authenticated

            # Check if new user (first time this session is seen)
            is_new_user = AnalyticsTracker.is_new_session(session_id)

            # Create event
            event = AnalyticsEvent(
                event_type=event_type,
                user_id=user_id,
                session_id=session_id,
                is_authenticated=is_authenticated,
                is_new_user=is_new_user,
                metadata=metadata or {}
            )

            # Save event and update session
            event.save()
            AnalyticsTracker.update_session(session_id, user_id)

        except Exception as e:
            # Log but don't fail the request
            logger.warning(f"Analytics tracking failed: {e}")
