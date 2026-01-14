import { useLocation, Link, Navigate } from 'react-router-dom';

export default function Results() {
  const location = useLocation();
  const { score, total } = location.state || {};

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

  return (
    <div className="centered">
      <div className="container">
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

        <p className="score-text" style={{ margin: '8px 0 32px' }}>
          You got <strong>{score}</strong> out of <strong>{total}</strong> questions correct
        </p>

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
