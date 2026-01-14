import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const API_BASE = '';

export default function Questions() {
  const location = useLocation();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState(location.state?.questions || []);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(!location.state?.questions);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // If no questions in state, fetch from API
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

    // Create form data
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
          <h1>Loading questions...</h1>
          <span className="spinner"></span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="centered">
        <div className="container">
          <h1>Error</h1>
          <div className="error-message">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="centered">
      <div className="container">
        <h1>Answer the Questions</h1>

        <form onSubmit={handleSubmit}>
          {questions.map((q, qIndex) => (
            <div key={qIndex} className="question-block">
              <p>
                <strong>
                  {qIndex + 1}. {q.Question}
                </strong>
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
                  {option}
                </label>
              ))}
            </div>
          ))}

          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? 'Checking...' : 'Check Answers'}
          </button>
        </form>
      </div>
    </div>
  );
}
