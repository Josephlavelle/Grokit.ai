const API_BASE = '';

// Generate or retrieve session ID
function getSessionId() {
  let sessionId = localStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
}

// Event type constants
export const EventTypes = {
  LOGIN: 'login',
  SIGNUP: 'signup',
  QUIZ_CREATE: 'quiz_create',
  QUIZ_TAKE: 'quiz_take',
  FEEDBACK_REQUEST: 'feedback_request',
  SHARE_LINK_CLICKED: 'share_link_clicked',
};

// Track an analytics event
export async function trackEvent(eventType, metadata = {}) {
  try {
    await fetch(`${API_BASE}/api/analytics/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Analytics-Session-ID': getSessionId(),
      },
      credentials: 'include',
      body: JSON.stringify({
        event_type: eventType,
        metadata,
      }),
    });
  } catch (error) {
    // Silently fail - don't break the app for analytics
    console.debug('Analytics tracking failed:', error);
  }
}
