import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '../../src/context/AuthContext'
import ProtectedRoute from '../../src/components/ProtectedRoute'
import { server } from '../mocks/server'
import { http, HttpResponse } from 'msw'

function TestProtectedContent() {
  return <div data-testid="protected-content">Protected Content</div>
}

function renderWithAuth(ui, { authenticated = false, initialEntries = ['/'] } = {}) {
  if (authenticated) {
    server.use(
      http.get('/api/me', () => {
        return HttpResponse.json({ user: { id: '123', email: 'test@example.com' } })
      })
    )
  }

  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                {ui}
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  )
}

describe('ProtectedRoute', () => {
  it('should show loading state initially', () => {
    renderWithAuth(<TestProtectedContent />)

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('should redirect to login when not authenticated', async () => {
    renderWithAuth(<TestProtectedContent />, { authenticated: false })

    // Wait for redirect to login page
    await waitFor(() => {
      expect(screen.getByText('Login Page')).toBeInTheDocument()
    })

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument()
  })

  it('should render children when authenticated', async () => {
    renderWithAuth(<TestProtectedContent />, { authenticated: true })

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })

    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument()
  })
})
