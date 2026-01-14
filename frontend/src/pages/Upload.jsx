import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const API_BASE = '';

export default function Upload() {
  const [quizName, setQuizName] = useState('');
  const [fileName, setFileName] = useState('No file selected');
  const [preview, setPreview] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);

    if (file.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result.slice(0, 3000));
        setShowPreview(true);
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData();
    formData.append('file', fileInputRef.current.files[0]);
    formData.append('quiz_name', quizName);

    try {
      const response = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      // Navigate to questions page with the questions data
      navigate('/questions', { state: { questions: data.questions } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="centered">
      <div className="container">
        <h1>Upload a Text File</h1>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="upload-form">
          <input
            type="text"
            placeholder="Quiz Name"
            value={quizName}
            onChange={(e) => setQuizName(e.target.value)}
            required
          />

          <input
            type="file"
            ref={fileInputRef}
            accept=".txt"
            onChange={handleFileChange}
            required
            hidden
          />

          <label
            className="btn btn-secondary"
            onClick={() => fileInputRef.current.click()}
            style={{ cursor: 'pointer' }}
          >
            Choose File
          </label>

          <p className="file-name">{fileName}</p>

          {showPreview && (
            <div className="preview-container">
              <h3>Preview</h3>
              <pre>{preview}</pre>
            </div>
          )}

          <button className="btn btn-primary" type="submit" disabled={loading}>
            <span>{loading ? 'Generating...' : 'Generate Questions'}</span>
            {loading && <span className="spinner"></span>}
          </button>
        </form>

        <Link to="/" className="btn btn-secondary back-link">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
