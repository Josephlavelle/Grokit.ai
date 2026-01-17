# GroKit
An AI-powered quiz generation application that creates multiple-choice questions from uploaded text content using the Groq LLM API.

## Features

- **Quiz Generation**: Upload text files and automatically generate multiple-choice questions
- **Quiz Library**: Save and retake previously generated quizzes
- **Results Review**: See detailed breakdown of incorrect answers after completing a quiz
- **AI Feedback**: Get personalized feedback on quiz performance
- **User Authentication**: Secure login/signup with session-based authentication

## Tech Stack

### Backend
- **Flask** - Python web framework
- **SQLAlchemy** - ORM for database operations
- **Flask-Login** - User session management
- **Groq API** - LLM for question generation and feedback

### Frontend
- **React** - UI library
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing

## Setup

### Prerequisites
- Python 3.8+
- Node.js 18+
- Groq API key

### Backend Setup

```bash
cd backend/src
pip install -r requirements.txt
```

Create a `.env` file:
```
APP_SECRET_KEY=your-secret-key
SQLALCHEMY_DATABASE_URI=sqlite:///app.db
GROQ_API_KEY=your-groq-api-key
```

Run the backend:
```bash
python app.py
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173` and proxies API requests to the backend on `http://localhost:5050`.

## Usage

1. Create an account or log in
2. Upload a `.txt` file with content you want to quiz on
3. Answer the generated multiple-choice questions
4. Review your results and get AI-powered feedback
5. Access your quiz library to retake previous quizzes

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/signup` | Create new user |
| POST | `/login` | User login |
| POST | `/logout` | User logout |
| GET | `/api/me` | Get current user |
| POST | `/api/upload` | Upload file and generate quiz |
| GET | `/api/quizzes` | List user quizzes |
| GET | `/api/quizzes/:id` | Get specific quiz |
| DELETE | `/api/quizzes/:id` | Delete quiz |
| GET/POST | `/questions` | Get questions / Submit answers |
| POST | `/api/feedback` | Get AI feedback on results |

Known Bugs:
1. LLM Generated quiz errors can sometimes be incorrect
2. LLM Generated quiz feedback can sometimes not align with supplied quiz - Need to provide LLM with full question context.

TODO:
1. Allow Combining of Quizzes into larger exams
