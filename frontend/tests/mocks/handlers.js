import { http, HttpResponse } from 'msw'

export const handlers = [
  // Auth check - default: not authenticated
  http.get('/api/me', () => {
    return HttpResponse.json({ user: null })
  }),

  // Login
  http.post('/auth/login', async ({ request }) => {
    const body = await request.json()
    if (body.email === 'test@example.com' && body.password === 'password123') {
      return HttpResponse.json({
        user: { id: '123', email: 'test@example.com' }
      })
    }
    return HttpResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }),

  // Signup
  http.post('/auth/signup', async ({ request }) => {
    const body = await request.json()
    if (body.email && body.password) {
      return HttpResponse.json({
        user: { id: '456', email: body.email }
      })
    }
    return HttpResponse.json({ error: 'Email and password required' }, { status: 400 })
  }),

  // Logout
  http.get('/auth/logout', () => {
    return HttpResponse.json({ message: 'Logged out' })
  }),

  // Upload
  http.post('/api/upload', () => {
    return HttpResponse.json({
      questions: [
        {
          Question: 'Test question?',
          Options: ['A', 'B', 'C', 'D'],
          Ans: 0,
          Citation: 'Test citation'
        }
      ],
      user: 'test@example.com'
    })
  }),

  // Get quizzes
  http.get('/api/quizzes', () => {
    return HttpResponse.json({
      quizzes: [
        { id: '1', name: 'Test Quiz', question_count: 5, created_at: '2024-01-01T00:00:00Z' }
      ]
    })
  }),

  // Get single quiz
  http.get('/api/quizzes/:id', ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      name: 'Test Quiz',
      questions: [
        { Question: 'Q1?', Options: ['A', 'B', 'C', 'D'], Ans: 0, Citation: 'Citation' }
      ],
      created_at: '2024-01-01T00:00:00Z'
    })
  }),

  // Submit answers
  http.post('/questions', () => {
    return HttpResponse.json({
      score: 8,
      total: 10,
      wrong_answers: []
    })
  }),

  // Feedback
  http.post('/api/feedback', () => {
    return HttpResponse.json({
      feedback: [{ number: 1, question: 'Q1?', feedback: 'Explanation here' }]
    })
  }),
]
