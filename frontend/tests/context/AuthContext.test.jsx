import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthProvider, useAuth } from '../../src/context/AuthContext'
import { server } from '../mocks/server'
import { http, HttpResponse } from 'msw'

// Test component that uses auth context
function TestComponent() {
  const { user, loading, login, logout, signup } = useAuth()

  if (loading) return <div>Loading...</div>

  return (
    <div>
      {user ? (
        <>
          <span data-testid="user-email">{user.email}</span>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <>
          <button onClick={() => login('test@example.com', 'password123')}>
            Login
          </button>
          <button onClick={() => signup('new@example.com', 'newpass123')}>
            Signup
          </button>
        </>
      )}
    </div>
  )
}

describe('AuthContext', () => {
  it('should start with null user when not authenticated', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })

    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
  })

  it('should login user successfully', async () => {
    const user = userEvent.setup()

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /login/i }))

    await waitFor(() => {
      expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com')
    })
  })

  it('should handle login failure', async () => {
    server.use(
      http.post('/auth/login', () => {
        return HttpResponse.json({ error: 'Invalid credentials' }, { status: 401 })
      })
    )

    const user = userEvent.setup()
    let loginError = null

    function ErrorTestComponent() {
      const { login, loading } = useAuth()

      if (loading) return <div>Loading...</div>

      const handleLogin = async () => {
        try {
          await login('wrong@email.com', 'wrongpassword')
        } catch (e) {
          loginError = e.message
        }
      }

      return <button onClick={handleLogin}>Login</button>
    }

    render(
      <AuthProvider>
        <ErrorTestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /login/i }))

    await waitFor(() => {
      expect(loginError).toBe('Invalid credentials')
    })
  })

  it('should signup user successfully', async () => {
    const user = userEvent.setup()

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /signup/i }))

    await waitFor(() => {
      expect(screen.getByTestId('user-email')).toHaveTextContent('new@example.com')
    })
  })

  it('should logout user', async () => {
    // Start with authenticated user
    server.use(
      http.get('/api/me', () => {
        return HttpResponse.json({ user: { id: '123', email: 'test@example.com' } })
      })
    )

    const user = userEvent.setup()

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('user-email')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: /logout/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
    })
  })

  it('should throw error when useAuth is used outside AuthProvider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    function InvalidComponent() {
      useAuth()
      return null
    }

    expect(() => render(<InvalidComponent />)).toThrow(
      'useAuth must be used within an AuthProvider'
    )

    consoleError.mockRestore()
  })
})
