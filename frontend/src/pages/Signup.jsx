import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const result = await signup(email, password);
      if (result.user) {
        // Auto-login (verification not required)
        navigate('/upload');
      } else if (result.message) {
        // Verification email sent
        setVerificationSent(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (verificationSent) {
    return (
      <div className="centered">
        <div className="container">
          <h1>Check Your Email</h1>
          <p>We've sent a verification link to <strong>{email}</strong></p>
          <p style={{ marginTop: '16px', color: '#666' }}>
            Click the link in the email to verify your account, then you can log in.
          </p>
          <p style={{ marginTop: '24px', fontSize: '14px' }}>
            Didn't receive the email? Check your spam folder or{' '}
            <Link to="/login">try logging in</Link> to resend.
          </p>
          <Link to="/login" className="btn btn-primary" style={{ marginTop: '24px' }}>
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

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
          <input
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
