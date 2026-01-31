import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Upload from '../../src/pages/Upload'
import { server } from '../mocks/server'
import { http, HttpResponse } from 'msw'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

function renderUpload() {
  return render(
    <MemoryRouter>
      <Upload />
    </MemoryRouter>
  )
}

describe('Upload Page', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
  })

  it('should render upload form', () => {
    renderUpload()

    expect(screen.getByText('Create Quiz')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Give your quiz a name')).toBeInTheDocument()
    expect(screen.getByText(/drop your document here/i)).toBeInTheDocument()
  })

  it('should handle file selection', async () => {
    const user = userEvent.setup()
    renderUpload()

    const file = new File(['test content'], 'test.txt', { type: 'text/plain' })
    const input = document.querySelector('input[type="file"]')

    await user.upload(input, file)

    expect(screen.getByText('test.txt')).toBeInTheDocument()
  })

  it('should disable generate button without file', () => {
    renderUpload()

    const generateButton = screen.getByRole('button', { name: /generate quiz/i })
    expect(generateButton).toBeDisabled()
  })

  it('should show modal when generate is clicked', async () => {
    const user = userEvent.setup()
    renderUpload()

    // Fill form
    await user.type(screen.getByPlaceholderText('Give your quiz a name'), 'Test Quiz')

    const file = new File(['test content'], 'test.txt', { type: 'text/plain' })
    const input = document.querySelector('input[type="file"]')
    await user.upload(input, file)

    // Submit form
    await user.click(screen.getByRole('button', { name: /generate quiz/i }))

    // Modal should appear
    await waitFor(() => {
      expect(screen.getByText('Customize Your Quiz')).toBeInTheDocument()
    })
    expect(screen.getByText('How many questions would you like?')).toBeInTheDocument()
  })

  it('should close modal on cancel', async () => {
    const user = userEvent.setup()
    renderUpload()

    // Fill form
    await user.type(screen.getByPlaceholderText('Give your quiz a name'), 'Test Quiz')

    const file = new File(['test content'], 'test.txt', { type: 'text/plain' })
    const input = document.querySelector('input[type="file"]')
    await user.upload(input, file)

    // Submit form
    await user.click(screen.getByRole('button', { name: /generate quiz/i }))

    // Modal should appear
    await waitFor(() => {
      expect(screen.getByText('Customize Your Quiz')).toBeInTheDocument()
    })

    // Click cancel
    await user.click(screen.getByRole('button', { name: /cancel/i }))

    // Modal should close
    await waitFor(() => {
      expect(screen.queryByText('Customize Your Quiz')).not.toBeInTheDocument()
    })
  })

  it('should navigate to questions on successful upload', async () => {
    const user = userEvent.setup()
    renderUpload()

    // Fill form
    await user.type(screen.getByPlaceholderText('Give your quiz a name'), 'Test Quiz')

    const file = new File(['test content'], 'test.txt', { type: 'text/plain' })
    const input = document.querySelector('input[type="file"]')
    await user.upload(input, file)

    // Submit form
    await user.click(screen.getByRole('button', { name: /generate quiz/i }))

    // Click generate in modal
    await waitFor(() => {
      expect(screen.getByText('Customize Your Quiz')).toBeInTheDocument()
    })

    const modalGenerateButtons = screen.getAllByRole('button', { name: /generate quiz/i })
    await user.click(modalGenerateButtons[1])

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/questions', {
        state: {
          questions: expect.arrayContaining([
            expect.objectContaining({
              Question: 'Test question?',
              Options: ['A', 'B', 'C', 'D'],
              Ans: 0
            })
          ])
        }
      })
    })
  })

  it('should show error message on upload failure', async () => {
    server.use(
      http.post('/api/upload', () => {
        return HttpResponse.json(
          { error: 'Unsupported file type' },
          { status: 400 }
        )
      })
    )

    const user = userEvent.setup()
    renderUpload()

    // Fill form
    await user.type(screen.getByPlaceholderText('Give your quiz a name'), 'Test Quiz')

    const file = new File(['test'], 'test.txt', { type: 'text/plain' })
    const input = document.querySelector('input[type="file"]')
    await user.upload(input, file)

    // Submit form
    await user.click(screen.getByRole('button', { name: /generate quiz/i }))

    // Click generate in modal
    await waitFor(() => {
      expect(screen.getByText('Customize Your Quiz')).toBeInTheDocument()
    })

    const modalGenerateButtons = screen.getAllByRole('button', { name: /generate quiz/i })
    await user.click(modalGenerateButtons[1])

    await waitFor(() => {
      expect(screen.getByText('Unsupported file type')).toBeInTheDocument()
    })
  })

  it('should show preview for text files', async () => {
    const user = userEvent.setup()
    renderUpload()

    const fileContent = 'This is test content for preview'
    const file = new File([fileContent], 'test.txt', { type: 'text/plain' })
    const input = document.querySelector('input[type="file"]')

    await user.upload(input, file)

    await waitFor(() => {
      expect(screen.getByText('Preview')).toBeInTheDocument()
      expect(screen.getByText(fileContent)).toBeInTheDocument()
    })
  })

  it('should allow adjusting question count', async () => {
    const user = userEvent.setup()
    renderUpload()

    // Fill form
    await user.type(screen.getByPlaceholderText('Give your quiz a name'), 'Test Quiz')

    const file = new File(['test content'], 'test.txt', { type: 'text/plain' })
    const input = document.querySelector('input[type="file"]')
    await user.upload(input, file)

    // Submit form
    await user.click(screen.getByRole('button', { name: /generate quiz/i }))

    // Modal should appear
    await waitFor(() => {
      expect(screen.getByText('Customize Your Quiz')).toBeInTheDocument()
    })

    // Slider should be present with default value 10
    const slider = screen.getByRole('slider')
    expect(slider).toBeInTheDocument()
    expect(slider).toHaveValue('10')

    // Question count display should show 10
    const questionCount = document.querySelector('.question-count')
    expect(questionCount).toHaveTextContent('10')
  })
})
