import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="centered">
      <div className="container">
        <h1>Welcome to Groker</h1>
        <p>Get your curated multiple choice study questions here!</p>
        <Link className="cta" to={user ? '/upload' : '/login'}>
          Get Started
        </Link>
        {!user && (
          <p>
            Don't have an account? <Link to="/signup">Sign up</Link>
          </p>
        )}
      </div>
    </div>
  );
}
