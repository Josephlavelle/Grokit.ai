import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user, logout } = useAuth();

  return (
    <div className="centered">
      <div className="container">
        <h1>GroKit</h1>
        <p>Transform your study materials into AI-powered quizzes instantly</p>

        <Link className="cta" to={user ? '/upload' : '/login'}>
          {user ? 'Create Quiz' : 'Get Started'}
        </Link>

        {user ? (
          <div style={{ marginTop: '24px' }}>
            <p style={{ fontSize: '14px', marginBottom: '16px' }}>
              Logged in as {user.email}
            </p>
            <div className="button-group" style={{ marginTop: '0' }}>
              <Link to="/library" className="btn btn-secondary">
                My Library
              </Link>
              <button onClick={logout} className="btn btn-secondary">
                Logout
              </button>
            </div>
          </div>
        ) : (
          <p style={{ marginTop: '24px', fontSize: '14px' }}>
            New here? <Link to="/signup">Create an account</Link>
          </p>
        )}
      </div>
    </div>
  );
}
