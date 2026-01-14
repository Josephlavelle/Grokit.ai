import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';

const API_BASE = '';

export default function Questions() {
  const location = useLocation();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState(location.state?.questions || []);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(!location.state?.questions);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = questions.length;

  useEffect(() => {
    if (!location.state?.questions) {
      fetchQuestions();
    }
  }, []);

  const fetchQuestions = async () => {
    try {
      const response = await fetch(`${API_BASE}/questions`, {
        credentials: 'include',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load questions');
      }

      setQuestions(data.questions);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionIndex, optionIndex) => {
    setAnswers((prev) => ({
      ...prev,
      [`q${questionIndex}`]: optionIndex,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const formData = new FormData();
    Object.entries(answers).forEach(([key, value]) => {
      formData.append(key, value);
    });

    try {
      const response = await fetch(`${API_BASE}/questions`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit answers');
      }

      navigate('/results', {
        state: { score: data.score, total: data.total },
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="centered">
        <div className="container">
          <div className="loading-container">
            <span className="spinner"></span>
            <p>Loading your quiz...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="centered">
        <div className="container">
          <h1>Something went wrong</h1>
          <div className="error-message">{error}</div>
          <Link to="/upload" className="btn btn-primary" style={{ marginTop: '20px' }}>
            Try Again
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="centered">
      <div className="container" style={{ maxWidth: '600px' }}>
        <h1>Quiz Time</h1>
        <p>
          Progress: {answeredCount} / {totalQuestions} answered
        </p>

        {/* Progress bar */}
        <div
          style={{
            width: '100%',
            height: '4px',
            background: 'var(--bg-secondary)',
            borderRadius: '2px',
            marginBottom: '32px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${(answeredCount / totalQuestions) * 100}%`,
              height: '100%',
              background: 'var(--accent-gradient)',
              borderRadius: '2px',
              transition: 'width 0.3s ease',
            }}
          />
        </div>

        <form onSubmit={handleSubmit}>
          {questions.map((q, qIndex) => (
            <div key={qIndex} className="question-block">
              <p>
                <span style={{ color: 'var(--accent-primary)', marginRight: '8px' }}>
                  Q{qIndex + 1}.
                </span>
                {q.Question}
              </p>

              {q.Options.map((option, optIndex) => (
                <label key={optIndex}>
                  <input
                    type="radio"
                    name={`q${qIndex}`}
                    value={optIndex}
                    onChange={() => handleAnswerChange(qIndex, optIndex)}
                    required
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
          ))}

          <button
            className="btn btn-primary"
            type="submit"
            disabled={submitting || answeredCount < totalQuestions}
            style={{ width: '100%', marginTop: '16px' }}
          >
            {submitting ? (
              <>
                Checking Answers
                <span className="spinner"></span>
              </>
            ) : answeredCount < totalQuestions ? (
              `Answer all questions (${totalQuestions - answeredCount} remaining)`
            ) : (
              'Submit Answers'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
