import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const API_BASE = '';

export default function Library() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingQuiz, setLoadingQuiz] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/quizzes`, {
        credentials: 'include',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load quizzes');
      }

      setQuizzes(data.quizzes || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openQuiz = async (quizId) => {
    setLoadingQuiz(quizId);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/api/quizzes/${quizId}`, {
        credentials: 'include',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load quiz');
      }

      // Navigate to questions page with the quiz data
      navigate('/questions', {
        state: {
          questions: data.questions,
          quizName: data.name,
        },
      });
    } catch (err) {
      setError(err.message);
      setLoadingQuiz(null);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="centered">
        <div className="container">
          <div className="loading-container">
            <span className="spinner"></span>
            <p>Loading your quizzes...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="centered">
      <div className="container" style={{ maxWidth: '550px' }}>
        <h1>My Library</h1>
        <p>Your saved quizzes</p>

        {error && <div className="error-message">{error}</div>}

        {quizzes.length === 0 ? (
          <div
            style={{
              padding: '40px 20px',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed var(--border-color)',
              marginBottom: '24px',
            }}
          >
            <p style={{ fontSize: '32px', marginBottom: '12px' }}>📚</p>
            <p style={{ margin: '0', color: 'var(--text-secondary)' }}>
              No quizzes yet. Create your first one!
            </p>
          </div>
        ) : (
          <ul className="quiz-list" style={{ marginBottom: '24px' }}>
            {quizzes.map((quiz) => (
              <li
                key={quiz.id}
                className="quiz-item"
                onClick={() => !loadingQuiz && openQuiz(quiz.id)}
                style={{
                  cursor: loadingQuiz ? 'wait' : 'pointer',
                  opacity: loadingQuiz && loadingQuiz !== quiz.id ? 0.5 : 1,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ textAlign: 'left' }}>
                    <span style={{ fontWeight: '500', display: 'block' }}>
                      {quiz.name || `Quiz ${quiz.id}`}
                    </span>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                      {quiz.question_count} questions
                    </span>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {loadingQuiz === quiz.id ? (
                      <span className="spinner" style={{ margin: 0 }}></span>
                    ) : (
                      <>
                        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                          {quiz.created_at && formatDate(quiz.created_at)}
                        </span>
                        <span style={{ color: 'var(--accent-primary)', fontSize: '18px' }}>→</span>
                      </>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="button-group">
          <Link to="/upload" className="btn btn-primary">
            Create New Quiz
          </Link>
          <Link to="/" className="btn btn-secondary">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
