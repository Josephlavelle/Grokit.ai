import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
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
        <h1>Welcome Back</h1>
        <p>Sign in to continue to GroKit</p>

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
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? (
              <>
                Signing in
                <span className="spinner"></span>
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <p style={{ marginTop: '24px', fontSize: '14px' }}>
          Don't have an account? <Link to="/signup">Create one</Link>
        </p>

        <Link to="/" className="btn btn-secondary back-link">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
