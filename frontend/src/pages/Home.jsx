import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { trackEvent, EventTypes } from '../hooks/useAnalytics';

const API_BASE = '';

export default function Home() {
  const { user, logout } = useAuth();
  const [demo, setDemo] = useState(null);
  const [loadingDemo, setLoadingDemo] = useState(true);
  const [shareMessage, setShareMessage] = useState('');

  useEffect(() => {
    fetchDemo();
    checkShareReferral();
  }, []);

  const checkShareReferral = () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('ref') === 'share') {
      trackEvent(EventTypes.SHARE_LINK_CLICKED);
      // Clean up URL without reload
      window.history.replaceState({}, '', window.location.pathname);
    }
  };

  const fetchDemo = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/demo`);
      if (response.ok) {
        const data = await response.json();
        setDemo(data);
      }
    } catch (err) {
      console.debug('Failed to load demo:', err);
    } finally {
      setLoadingDemo(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}?ref=share`;
    const shareData = {
      title: 'GroKit - AI Study Quizzes',
      text: 'Transform your study materials into AI-powered quizzes instantly!',
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setShareMessage('Link copied!');
        setTimeout(() => setShareMessage(''), 2000);
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        // User didn't cancel, try clipboard fallback
        try {
          await navigator.clipboard.writeText(shareUrl);
          setShareMessage('Link copied!');
          setTimeout(() => setShareMessage(''), 2000);
        } catch {
          setShareMessage('Failed to share');
          setTimeout(() => setShareMessage(''), 2000);
        }
      }
    }
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
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
            <p style={{ marginTop: '24px', fontSize: '14px', marginBottom: '10px' }}>
              New here? <Link to="/signup">Create an account</Link>
            </p>
          )}
          <button onClick={handleShare} className="share-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            {shareMessage || 'Share'}
          </button>
        </div>
      </section>

      {/* About Section */}
      <section className="about-section">
        <div className="about-container">
          <h2>How It Works</h2>
          <p className="about-subtitle">
            Upload any text and watch it transform into an interactive quiz
          </p>

          {/* Demo Section */}
          <div className="demo-section">
            <div className="demo-panel">
              <h3>Your Study Material</h3>
              <div className="demo-content">
                {loadingDemo ? (
                  <div className="demo-loading">
                    <span className="spinner"></span>
                  </div>
                ) : demo?.input_text ? (
                  <pre>{demo.input_text}</pre>
                ) : (
                  <p className="demo-placeholder">Upload any .txt file with your notes, textbook excerpts, or study materials...</p>
                )}
              </div>
            </div>

            <div className="demo-arrow">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </div>

            <div className="demo-panel">
              <h3>Generated Quiz</h3>
              <div className="demo-content demo-quiz">
                {loadingDemo ? (
                  <div className="demo-loading">
                    <span className="spinner"></span>
                  </div>
                ) : demo?.quiz?.length > 0 ? (
                  <div className="demo-questions">
                    {demo.quiz.slice(0, 3).map((q, i) => (
                      <div key={i} className="demo-question">
                        <p className="demo-q-text">
                          <span className="demo-q-num">Q{i + 1}.</span> {q.Question}
                        </p>
                        <ul className="demo-options">
                          {q.Options.map((opt, j) => (
                            <li key={j} className={j === q.Ans ? 'correct' : ''}>
                              {opt}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                    {demo.quiz.length > 3 && (
                      <p className="demo-more">+ {demo.quiz.length - 3} more questions...</p>
                    )}
                  </div>
                ) : (
                  <p className="demo-placeholder">AI-generated multiple choice questions based on your content...</p>
                )}
              </div>
            </div>
          </div>

          <div className="about-features">
            <div className="feature">
              <div className="feature-icon">1</div>
              <h4>Upload</h4>
              <p>Drop in your study notes or textbook content</p>
            </div>
            <div className="feature">
              <div className="feature-icon">2</div>
              <h4>Generate</h4>
              <p>AI creates tailored quiz questions instantly</p>
            </div>
            <div className="feature">
              <div className="feature-icon">3</div>
              <h4>Learn</h4>
              <p>Test yourself and get feedback on wrong answers</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
