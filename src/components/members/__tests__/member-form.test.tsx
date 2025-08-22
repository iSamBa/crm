import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render, createMockMember } from '../../../../tests/utils/test-utils'
import { MemberForm } from '../member-form'

// Mock the member service
vi.mock('@/lib/services/member-service', () => ({
  memberService: {
    createMember: vi.fn(),
    updateMember: vi.fn(),
  },
}))

// Import the mocked service to get references to the mock functions
import { memberService } from '@/lib/services/member-service'
const mockCreateMember = vi.mocked(memberService.createMember)
const mockUpdateMember = vi.mocked(memberService.updateMember)

describe('MemberForm', () => {
  const user = userEvent.setup()
  const mockOnSuccess = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Create Mode', () => {
    it('should render form fields for creating a member', () => {
      render(
        <MemberForm
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      )

      // Check that all required fields are present
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/enter phone number/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/membership status/i)).toBeInTheDocument()
      
      // Check buttons
      expect(screen.getByRole('button', { name: /add member|create member|save/i })).toBeInTheDocument()
    })

    it('should not submit form with empty required fields', async () => {
      render(
        <MemberForm
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      )

      const submitButton = screen.getByRole('button', { name: /add member|create member|save/i })
      await user.click(submitButton)

      // Form should not submit without required fields, so service shouldn't be called
      expect(mockCreateMember).not.toHaveBeenCalled()
    })

    it('should handle service errors gracefully', async () => {
      mockCreateMember.mockResolvedValue({
        data: null,
        error: 'Email already exists',
      })

      render(
        <MemberForm
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      )

      // Fill in required fields
      await user.type(screen.getByLabelText(/first name/i), 'John')
      await user.type(screen.getByLabelText(/last name/i), 'Doe')

      const submitButton = screen.getByRole('button', { name: /add member|create member|save/i })
      await user.click(submitButton)

      // Service should be called with the data
      await waitFor(() => {
        expect(mockCreateMember).toHaveBeenCalled()
      })

      // onSuccess should not be called when there's an error
      expect(mockOnSuccess).not.toHaveBeenCalled()
    })

    it('should submit valid form data', async () => {
      mockCreateMember.mockResolvedValue({
        data: createMockMember(),
        error: null,
      })

      render(
        <MemberForm
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      )

      // Fill in the form
      await user.type(screen.getByLabelText(/first name/i), 'John')
      await user.type(screen.getByLabelText(/last name/i), 'Doe')
      await user.type(screen.getByLabelText(/email/i), 'john.doe@example.com')
      await user.type(screen.getByPlaceholderText(/enter phone number/i), '+1-555-0101')

      const submitButton = screen.getByRole('button', { name: /add member|create member|save/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockCreateMember).toHaveBeenCalledWith(
          expect.objectContaining({
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            phone: '+1-555-0101',
          })
        )
      })
    })

    it('should render form for creating members', () => {
      render(
        <MemberForm
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      )

      // Basic functionality test - form should render without errors
      expect(screen.getByRole('button', { name: /add member/i })).toBeInTheDocument()
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
    })
  })

  describe('Edit Mode', () => {
    const mockMember = createMockMember({
      id: 'member-123',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      phone: '+1-555-0202',
      membershipStatus: 'active',
    })

    it('should show update button when in edit mode', () => {
      render(
        <MemberForm
          member={mockMember}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      )

      // Check that update button is shown (instead of add member)
      expect(screen.getByRole('button', { name: /update member/i })).toBeInTheDocument()
    })

    it('should call update service when editing member', async () => {
      mockUpdateMember.mockResolvedValue({
        data: { ...mockMember, firstName: 'Janet' },
        error: null,
      })

      render(
        <MemberForm
          member={mockMember}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      )

      // Fill in required fields (since form may not pre-populate in test environment)
      await user.type(screen.getByLabelText(/first name/i), 'Janet')
      await user.type(screen.getByLabelText(/last name/i), 'Smith')

      const submitButton = screen.getByRole('button', { name: /update member/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockUpdateMember).toHaveBeenCalled()
        expect(mockOnSuccess).toHaveBeenCalled()
      })
    })
  })

  describe('Loading States', () => {
    it('should disable submit button and show loading text when form is submitting', async () => {
      // Mock a slow response to simulate loading state
      mockCreateMember.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ data: createMockMember(), error: null }), 100))
      )

      render(
        <MemberForm
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      )

      // Fill in required fields
      await user.type(screen.getByLabelText(/first name/i), 'John')
      await user.type(screen.getByLabelText(/last name/i), 'Doe')

      const submitButton = screen.getByRole('button', { name: /add member/i })
      
      // Submit the form
      await user.click(submitButton)

      // Check that button shows loading state immediately
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /saving/i })).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /saving/i })).toBeDisabled()
      })
    })
  })
})