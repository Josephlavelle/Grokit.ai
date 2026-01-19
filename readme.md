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
- Docker and Docker Compose
- Groq API key

### Quick Start

1. Clone the repository and create a `.env` file in the project root:
```
GROQ_API_KEY=your-groq-api-key
APP_SECRET_KEY=your-secret-key
```

2. Build and run with Docker Compose:
```bash
docker-compose up --build
```

3. Access the app at `http://localhost:5050`

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | Yes | Your Groq API key |
| `APP_SECRET_KEY` | Yes | Flask session secret key |
| `GOOGLE_APPLICATION_CREDENTIALS_JSON` | Yes | Base64-encoded Firebase service account JSON |
| `S3_BUCKET` | Yes | S3 bucket name for file storage |
| `CORS_ORIGINS` | No | Allowed CORS origins (default: localhost) |

### Signup Whitelist

To restrict signups to specific emails, create a Firestore document:
- Collection: `config`
- Document ID: `signup_whitelist`
- Field: `emails` (array of allowed email strings)

If this document doesn't exist, signups are open to everyone.

### Docker Commands

```bash
# Start the app
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the app
docker-compose down

# Reset database (removes all data)
docker-compose down -v
docker-compose up --build
```

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

## Known Bugs
1. LLM generated quiz answers can sometimes be incorrect
2. LLM generated feedback can sometimes not align with the quiz - needs full question context

## TODO
1. ~~Dockerize~~ ✓
2. Deploy on AWS
    a. ~~read/write to S3~~
    b. Swap DB to use RDS
    c. Upload docker container to ECR
    d. Deploy on ECS
3. Get new domain
4. Allow combining quizzes into larger exams (low priority)
 
