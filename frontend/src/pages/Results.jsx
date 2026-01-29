import { useState } from 'react';
import { useLocation, Link, Navigate } from 'react-router-dom';

const API_BASE = '';

export default function Results() {
  const location = useLocation();
  const { score, total, wrongAnswers = [] } = location.state || {};
  const [showReview, setShowReview] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [feedbackError, setFeedbackError] = useState('');

  if (score === undefined || total === undefined) {
    return <Navigate to="/upload" replace />;
  }

  const percentage = Math.round((score / total) * 100);

  const getMessage = () => {
    if (percentage === 100) return { text: 'Perfect Score!', color: 'var(--success)' };
    if (percentage >= 80) return { text: 'Great job!', color: 'var(--accent-secondary)' };
    if (percentage >= 60) return { text: 'Good effort!', color: 'var(--accent-primary)' };
    if (percentage >= 40) return { text: 'Keep practicing!', color: 'var(--warning)' };
    return { text: 'Room for improvement', color: 'var(--error)' };
  };

  const message = getMessage();

  const getFeedback = async () => {
    setLoadingFeedback(true);
    setFeedbackError('');

    try {
      const response = await fetch(`${API_BASE}/api/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          score,
          total,
          wrong_answers: wrongAnswers,
        }),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('server_error');
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to get feedback');
      }

      const feedback_json = data.feedback
      var feedback_string = feedback_json.map(item => {
        return `
        ${item.number}: ${item.question}\n
        Feedback: ${item.feedback}
        `;
      }).join('\n');

      setFeedback(feedback_string);
    } catch (err) {
      if (err.message === 'server_error' || err.name === 'TypeError') {
        setFeedbackError('Something went wrong. Please try again later.');
      } else {
        setFeedbackError(err.message);
      }
    } finally {
      setLoadingFeedback(false);
    }
  };

  return (
    <div className="centered">
      <div className="container" style={{ maxWidth: wrongAnswers.length > 0 && showReview ? '650px' : '500px' }}>
        <h1>Quiz Complete</h1>

        {/* Score circle */}
        <div
          style={{
            width: '140px',
            height: '140px',
            borderRadius: '50%',
            background: `conic-gradient(${message.color} ${percentage * 3.6}deg, var(--bg-secondary) 0deg)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '24px auto',
            position: 'relative',
          }}
        >
          <div
            style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              background: 'var(--bg-card)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                fontSize: '2.5rem',
                fontWeight: '700',
                color: message.color,
                lineHeight: '1',
              }}
            >
              {percentage}%
            </span>
          </div>
        </div>

        <p style={{ color: message.color, fontWeight: '600', fontSize: '1.25rem', margin: '0 0 8px' }}>
          {message.text}
        </p>

        <p className="score-text" style={{ margin: '8px 0 24px' }}>
          You got <strong>{score}</strong> out of <strong>{total}</strong> questions correct
        </p>

        {/* Wrong answers review section */}
        {wrongAnswers.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <button
              onClick={() => setShowReview(!showReview)}
              className="btn btn-secondary"
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>
                Review {wrongAnswers.length} incorrect answer{wrongAnswers.length > 1 ? 's' : ''}
              </span>
              <span style={{ transform: showReview ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                ▼
              </span>
            </button>

            {showReview && (
              <div
                style={{
                  marginTop: '16px',
                  textAlign: 'left',
                }}
              >
                {wrongAnswers.map((item, index) => (
                  <div
                    key={index}
                    style={{
                      background: 'var(--bg-secondary)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-color)',
                      padding: '16px 20px',
                      marginBottom: '12px',
                    }}
                  >
                    <p
                      style={{
                        margin: '0 0 12px',
                        fontWeight: '500',
                        color: 'var(--text-primary)',
                        fontSize: '15px',
                      }}
                    >
                      <span style={{ color: 'var(--text-muted)', marginRight: '8px' }}>
                        Q{item.question_number}.
                      </span>
                      {item.question}
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {item.options.map((option, optIndex) => {
                        const isUserAnswer = optIndex === item.user_answer;
                        const isCorrectAnswer = optIndex === item.correct_answer;

                        let bgColor = 'var(--bg-input)';
                        let borderColor = 'transparent';
                        let textColor = 'var(--text-secondary)';

                        if (isCorrectAnswer) {
                          bgColor = 'rgba(16, 185, 129, 0.15)';
                          borderColor = 'var(--success)';
                          textColor = 'var(--success)';
                        } else if (isUserAnswer) {
                          bgColor = 'rgba(239, 68, 68, 0.15)';
                          borderColor = 'var(--error)';
                          textColor = 'var(--error)';
                        }

                        return (
                          <div
                            key={optIndex}
                            style={{
                              padding: '10px 14px',
                              borderRadius: 'var(--radius-sm)',
                              background: bgColor,
                              border: `1px solid ${borderColor}`,
                              color: textColor,
                              fontSize: '14px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <span>{option}</span>
                            {isCorrectAnswer && (
                              <span style={{ fontSize: '12px', fontWeight: '600' }}>
                                ✓ Correct
                              </span>
                            )}
                            {isUserAnswer && !isCorrectAnswer && (
                              <span style={{ fontSize: '12px', fontWeight: '600' }}>
                                ✗ Your answer
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Get Feedback section */}
        <div style={{ marginBottom: '24px' }}>
          {!feedback ? (
            <button
              onClick={getFeedback}
              disabled={loadingFeedback}
              className="btn btn-secondary"
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1))',
                borderColor: 'var(--accent-primary)',
              }}
            >
              {loadingFeedback ? (
                <>
                  Generating Feedback
                  <span className="spinner"></span>
                </>
              ) : (
                'Get AI Feedback'
              )}
            </button>
          ) : (
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1))',
                border: '1px solid var(--accent-primary)',
                borderRadius: 'var(--radius-md)',
                padding: '16px 20px',
                textAlign: 'left',
              }}
            >
              <p
                style={{
                  margin: '0 0 8px',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: 'var(--accent-primary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                AI Feedback
              </p>
              <p
                style={{
                  margin: 0,
                  color: 'var(--text-primary)',
                  fontSize: '15px',
                  lineHeight: '1.6',
                  whiteSpace: 'pre-line',
                }}
              >
                {feedback}
              </p>
            </div>
          )}

          {feedbackError && (
            <div className="error-message" style={{ marginTop: '12px' }}>
              {feedbackError}
            </div>
          )}
        </div>

        <div className="button-group">
          <Link to="/questions" className="btn btn-primary">
            Retry Quiz
          </Link>

          <Link to="/upload" className="btn btn-secondary">
            New Quiz
          </Link>
        </div>

        <Link to="/" className="btn btn-secondary back-link">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
