import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const justVerified = searchParams.get('verified') === 'true';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResendSuccess('');
    setNeedsVerification(false);
    setLoading(true);

    try {
      await login(email, password);
      navigate('/upload');
    } catch (err) {
      setError(err.message);
      if (err.message.toLowerCase().includes('verify your email')) {
        setNeedsVerification(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResending(true);
    setError('');
    setResendSuccess('');

    try {
      const response = await fetch('/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend');
      }
      setResendSuccess('Verification email sent! Check your inbox.');
      setNeedsVerification(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="centered">
      <div className="container">
        <h1>Welcome Back</h1>
        <p>Sign in to continue to GroKit</p>

        {justVerified && (
          <div className="success-message" style={{ background: '#d4edda', color: '#155724', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
            Email verified! You can now sign in.
          </div>
        )}

        {error && (
          <div className="error-message">
            {error}
            {needsVerification && (
              <>
                {' '}
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); handleResendVerification(); }}
                  style={{ color: 'inherit', textDecoration: 'underline' }}
                >
                  {resending ? 'Sending...' : 'Resend'}
                </a>
              </>
            )}
          </div>
        )}

        {resendSuccess && (
          <div className="success-message">
            {resendSuccess}
          </div>
        )}

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
