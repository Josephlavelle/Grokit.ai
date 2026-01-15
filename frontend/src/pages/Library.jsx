import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const API_BASE = '';

export default function Library() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingQuiz, setLoadingQuiz] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
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

  const handleQuizClick = (quiz) => {
    if (loadingQuiz || deleting) return;

    if (selectedQuiz?.id === quiz.id) {
      setSelectedQuiz(null);
    } else {
      setSelectedQuiz(quiz);
    }
  };

  const openQuiz = async () => {
    if (!selectedQuiz) return;

    setLoadingQuiz(selectedQuiz.id);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/api/quizzes/${selectedQuiz.id}`, {
        credentials: 'include',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load quiz');
      }

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

  const deleteQuiz = async () => {
    if (!selectedQuiz) return;

    if (!window.confirm(`Are you sure you want to delete "${selectedQuiz.name || `Quiz ${selectedQuiz.id}`}"? This cannot be undone.`)) {
      return;
    }

    setDeleting(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/api/quizzes/${selectedQuiz.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete quiz');
      }

      // Remove from local state
      setQuizzes(quizzes.filter(q => q.id !== selectedQuiz.id));
      setSelectedQuiz(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
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
          <>
            <ul className="quiz-list" style={{ marginBottom: '16px' }}>
              {quizzes.map((quiz) => {
                const isSelected = selectedQuiz?.id === quiz.id;
                return (
                  <li
                    key={quiz.id}
                    className="quiz-item"
                    onClick={() => handleQuizClick(quiz)}
                    style={{
                      cursor: loadingQuiz || deleting ? 'wait' : 'pointer',
                      opacity: (loadingQuiz || deleting) && !isSelected ? 0.5 : 1,
                      border: isSelected ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                      background: isSelected ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-secondary)',
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
                        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                          {quiz.created_at && formatDate(quiz.created_at)}
                        </span>
                        {isSelected ? (
                          <span style={{ color: 'var(--accent-primary)', fontSize: '16px' }}>✓</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>○</span>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Action buttons when quiz is selected */}
            {selectedQuiz && (
              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  marginBottom: '24px',
                }}
              >
                <button
                  onClick={deleteQuiz}
                  disabled={loadingQuiz || deleting}
                  className="btn btn-secondary"
                  style={{
                    flex: 1,
                    borderColor: 'var(--error)',
                    color: 'var(--error)',
                  }}
                >
                  {deleting ? (
                    <>
                      Deleting
                      <span className="spinner"></span>
                    </>
                  ) : (
                    'Delete Quiz'
                  )}
                </button>
                <button
                  onClick={openQuiz}
                  disabled={loadingQuiz || deleting}
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  {loadingQuiz ? (
                    <>
                      Loading
                      <span className="spinner"></span>
                    </>
                  ) : (
                    'Take Quiz'
                  )}
                </button>
              </div>
            )}

            {!selectedQuiz && (
              <p style={{
                fontSize: '13px',
                color: 'var(--text-muted)',
                marginBottom: '24px',
                fontStyle: 'italic'
              }}>
                Select a quiz to take or delete it
              </p>
            )}
          </>
        )}

        <div className="button-group">
        <Link to="/" className="btn btn-secondary">
            Back to Home
          </Link>
          <Link to="/upload" className="btn btn-primary">
            Create New Quiz
          </Link>
        </div>
      </div>
    </div>
  );
}
