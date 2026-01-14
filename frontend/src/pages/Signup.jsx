import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signup(email, password);
      navigate('/upload');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="centered">
      <div className="container">
        <h1>Create Account</h1>
        <p>Start generating AI-powered study quizzes</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="upload-form">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <input
            type="password"
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            minLength={6}
          />

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? (
              <>
                Creating account
                <span className="spinner"></span>
              </>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <p style={{ marginTop: '24px', fontSize: '14px' }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </p>

        <Link to="/" className="btn btn-secondary back-link">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
