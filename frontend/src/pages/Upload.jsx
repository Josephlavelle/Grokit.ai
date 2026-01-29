import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const API_BASE = '';

export default function Upload() {
  const [quizName, setQuizName] = useState('');
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [numQuestions, setNumQuestions] = useState(10);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleFile = (file) => {
    if (!file) return;

    setFileName(file.name);

    // Only show preview for plain text files
    if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result.slice(0, 3000));
        setShowPreview(true);
      };
      reader.readAsText(file);
    } else {
      // For PDF/DOCX, no client-side preview
      setShowPreview(false);
      setPreview('');
    }
  };

  const handleFileChange = (e) => {
    handleFile(e.target.files[0]);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      fileInputRef.current.files = e.dataTransfer.files;
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setShowModal(true);
  };

  const handleGenerateQuiz = async () => {
    setShowModal(false);
    setLoading(true);

    const formData = new FormData();
    formData.append('file', fileInputRef.current.files[0]);
    formData.append('quiz_name', quizName);
    formData.append('num_questions', numQuestions);

    try {
      const response = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      // Try to parse JSON, handle HTML error responses gracefully
      let data;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        // Got HTML or other non-JSON response
        if (!response.ok) {
          throw new Error('server_error');
        }
        throw new Error('Unexpected response format');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      navigate('/questions', { state: { questions: data.questions } });
    } catch (err) {
      // Show generic message for server errors or network issues
      if (err.message === 'server_error' || err.name === 'TypeError') {
        setError('Something went wrong. Please try again later.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="centered">
      <div className="container">
        <h1>Create Quiz</h1>
        <p>Upload your study material and let AI generate questions</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="upload-form">
          <input
            type="text"
            placeholder="Give your quiz a name"
            value={quizName}
            onChange={(e) => setQuizName(e.target.value)}
            required
          />

          <input
            type="file"
            ref={fileInputRef}
            accept=".txt,.pdf,.docx,.doc"
            onChange={handleFileChange}
            required
            hidden
          />

          <div
            className={`file-drop-zone ${dragActive ? 'active' : ''} ${fileName ? 'has-file' : ''}`}
            onClick={() => fileInputRef.current.click()}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            style={{
              width: '100%',
              maxWidth: '360px',
              padding: '32px 24px',
              border: `2px dashed ${dragActive ? 'var(--accent-primary)' : 'var(--border-color)'}`,
              borderRadius: 'var(--radius-md)',
              background: dragActive ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-secondary)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {fileName ? (
              <div style={{ color: 'var(--accent-secondary)' }}>
                <span style={{ fontSize: '24px', marginBottom: '8px', display: 'block' }}>
                  📄
                </span>
                <span style={{ fontWeight: '500' }}>{fileName}</span>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '8px 0 0' }}>
                  Click to change file
                </p>
              </div>
            ) : (
              <div style={{ color: 'var(--text-secondary)' }}>
                <span style={{ fontSize: '32px', marginBottom: '12px', display: 'block' }}>
                  📁
                </span>
                <span style={{ fontWeight: '500' }}>Drop your document here</span>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '8px 0 0' }}>
                  or click to browse
                </p>
                <p
                  style={{
                    fontSize: '12px',
                    color: 'var(--text-muted)',
                    margin: '4px 0 0',
                    position: 'relative',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  Supports: TXT, PDF, DOCX
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      background: 'var(--border-color)',
                      color: 'var(--text-secondary)',
                      fontSize: '11px',
                      fontWeight: '600',
                      cursor: 'help',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => { e.stopPropagation(); setShowTooltip(true); }}
                    onMouseLeave={(e) => { e.stopPropagation(); setShowTooltip(false); }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    ?
                    {showTooltip && (
                      <span
                        style={{
                          position: 'absolute',
                          bottom: '24px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          background: 'var(--bg-primary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-sm)',
                          padding: '8px 12px',
                          fontSize: '12px',
                          color: 'var(--text-primary)',
                          whiteSpace: 'nowrap',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          zIndex: 10
                        }}
                      >
                        Due to technical limitations, the document is currently limited to a 4,500 word limit
                      </span>
                    )}
                  </span>
                </p>
              </div>
            )}
          </div>

          {showPreview && (
            <div className="preview-container">
              <h3>Preview</h3>
              <pre>{preview}</pre>
            </div>
          )}

          <button
            className="btn btn-primary"
            type="submit"
            disabled={loading || !fileName}
            style={{ width: '100%', maxWidth: '360px' }}
          >
            {loading ? (
              <>
                Generating Quiz
                <span className="spinner"></span>
              </>
            ) : (
              'Generate Quiz'
            )}
          </button>
        </form>

        <Link to="/" className="btn btn-secondary back-link">
          Back to Home
        </Link>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Customize Your Quiz</h2>
            <p>How many questions would you like?</p>

            <div className="question-slider">
              <input
                type="range"
                min="1"
                max="10"
                value={numQuestions}
                onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                className="slider"
              />
              <div className="question-count">{numQuestions}</div>
            </div>

            <div className="slider-labels">
              <span>1</span>
              <span>10</span>
            </div>

            <div className="modal-buttons">
              <button
                className="btn btn-secondary"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleGenerateQuiz}
              >
                Generate Quiz
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
