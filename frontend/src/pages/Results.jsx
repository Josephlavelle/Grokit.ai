import { useLocation, Link, Navigate } from 'react-router-dom';

export default function Results() {
  const location = useLocation();
  const { score, total } = location.state || {};

  // Redirect if no results data
  if (score === undefined || total === undefined) {
    return <Navigate to="/upload" replace />;
  }

  return (
    <div className="centered">
      <div className="container">
        <h1>Results</h1>

        <p className="score-text">
          You answered <strong>{score}</strong> out of <strong>{total}</strong>{' '}
          correctly.
        </p>

        <div className="button-group">
          <Link to="/questions" className="btn btn-primary">
            Try Again
          </Link>

          <Link to="/upload" className="btn btn-secondary">
            Try New Data
          </Link>
        </div>
      </div>
    </div>
  );
}
