import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const API_BASE = '';

export default function Library() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  if (loading) {
    return (
      <div className="centered">
        <div className="container">
          <h1>Loading...</h1>
          <span className="spinner"></span>
        </div>
      </div>
    );
  }

  return (
    <div className="centered">
      <div className="container">
        <h1>Quiz Library</h1>

        {error && <div className="error-message">{error}</div>}

        {quizzes.length === 0 ? (
          <p>No quizzes yet. Upload a file to create your first quiz!</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, textAlign: 'left' }}>
            {quizzes.map((quiz) => (
              <li
                key={quiz.id}
                style={{
                  padding: '10px',
                  marginBottom: '10px',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '6px',
                }}
              >
                {quiz.name || `Quiz ${quiz.id}`}
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
