import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render, createMockMember } from '../../../../tests/utils/test-utils'
import { MemberForm } from '../member-form'

// Mock the member service
const mockMemberService = {
  createMember: vi.fn(),
  updateMember: vi.fn(),
}

vi.mock('@/lib/services/member-service', () => ({
  memberService: mockMemberService,
}))

// Mock the custom hooks
vi.mock('@/lib/hooks/use-members-modern', () => ({
  useCreateMember: () => ({
    mutate: mockMemberService.createMember,
    isPending: false,
  }),
  useUpdateMember: () => ({
    mutate: mockMemberService.updateMember,
    isPending: false,
  }),
}))

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
          mode="create"
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      )

      // Check that all required fields are present
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/phone/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/membership status/i)).toBeInTheDocument()
      
      // Check buttons
      expect(screen.getByRole('button', { name: /create member/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    })

    it('should show validation errors for required fields', async () => {
      render(
        <MemberForm
          mode="create"
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      )

      const submitButton = screen.getByRole('button', { name: /create member/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/first name is required/i)).toBeInTheDocument()
        expect(screen.getByText(/last name is required/i)).toBeInTheDocument()
      })
    })

    it('should validate email format', async () => {
      render(
        <MemberForm
          mode="create"
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      )

      const emailInput = screen.getByLabelText(/email/i)
      await user.type(emailInput, 'invalid-email')
      
      const submitButton = screen.getByRole('button', { name: /create member/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/invalid email format/i)).toBeInTheDocument()
      })
    })

    it('should validate phone number format', async () => {
      render(
        <MemberForm
          mode="create"
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      )

      const phoneInput = screen.getByLabelText(/phone/i)
      await user.type(phoneInput, 'abc-def-ghij')
      
      const submitButton = screen.getByRole('button', { name: /create member/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/invalid phone number format/i)).toBeInTheDocument()
      })
    })

    it('should validate first name for invalid characters', async () => {
      render(
        <MemberForm
          mode="create"
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      )

      const firstNameInput = screen.getByLabelText(/first name/i)
      await user.type(firstNameInput, 'John123')
      
      const lastNameInput = screen.getByLabelText(/last name/i)
      await user.type(lastNameInput, 'Doe')
      
      const submitButton = screen.getByRole('button', { name: /create member/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/first name contains invalid characters/i)).toBeInTheDocument()
      })
    })

    it('should submit valid form data', async () => {
      mockMemberService.createMember.mockResolvedValue({
        data: createMockMember(),
        error: null,
      })

      render(
        <MemberForm
          mode="create"
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      )

      // Fill in the form
      await user.type(screen.getByLabelText(/first name/i), 'John')
      await user.type(screen.getByLabelText(/last name/i), 'Doe')
      await user.type(screen.getByLabelText(/email/i), 'john.doe@example.com')
      await user.type(screen.getByLabelText(/phone/i), '+1-555-0101')

      const submitButton = screen.getByRole('button', { name: /create member/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockMemberService.createMember).toHaveBeenCalledWith(
          expect.objectContaining({
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            phone: '+1-555-0101',
          })
        )
      })
    })

    it('should call onCancel when cancel button is clicked', async () => {
      render(
        <MemberForm
          mode="create"
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      )

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      expect(mockOnCancel).toHaveBeenCalledTimes(1)
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

    it('should pre-populate form fields with existing member data', () => {
      render(
        <MemberForm
          mode="edit"
          member={mockMember}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByDisplayValue('Jane')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Smith')).toBeInTheDocument()
      expect(screen.getByDisplayValue('jane.smith@example.com')).toBeInTheDocument()
      expect(screen.getByDisplayValue('+1-555-0202')).toBeInTheDocument()
      
      expect(screen.getByRole('button', { name: /update member/i })).toBeInTheDocument()
    })

    it('should submit updated member data', async () => {
      mockMemberService.updateMember.mockResolvedValue({
        data: { ...mockMember, firstName: 'Janet' },
        error: null,
      })

      render(
        <MemberForm
          mode="edit"
          member={mockMember}
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      )

      const firstNameInput = screen.getByDisplayValue('Jane')
      await user.clear(firstNameInput)
      await user.type(firstNameInput, 'Janet')

      const submitButton = screen.getByRole('button', { name: /update member/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockMemberService.updateMember).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'member-123',
            firstName: 'Janet',
            lastName: 'Smith',
            email: 'jane.smith@example.com',
            phone: '+1-555-0202',
          })
        )
      })
    })
  })

  describe('Emergency Contact Section', () => {
    it('should show emergency contact fields when expanded', async () => {
      render(
        <MemberForm
          mode="create"
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      )

      // Look for emergency contact toggle or section
      const emergencyContactSection = screen.getByText(/emergency contact/i)
      expect(emergencyContactSection).toBeInTheDocument()

      // If there's a toggle, click it to expand
      const toggleButton = screen.queryByRole('button', { name: /emergency contact/i })
      if (toggleButton) {
        await user.click(toggleButton)
      }

      // Check for emergency contact fields
      await waitFor(() => {
        expect(screen.getByLabelText(/contact name/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/contact phone/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/relationship/i)).toBeInTheDocument()
      })
    })

    it('should validate emergency contact fields when provided', async () => {
      render(
        <MemberForm
          mode="create"
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      )

      // Fill in required fields
      await user.type(screen.getByLabelText(/first name/i), 'John')
      await user.type(screen.getByLabelText(/last name/i), 'Doe')

      // Expand emergency contact if needed
      const toggleButton = screen.queryByRole('button', { name: /emergency contact/i })
      if (toggleButton) {
        await user.click(toggleButton)
      }

      // Fill in partial emergency contact (should trigger validation)
      const contactNameInput = screen.getByLabelText(/contact name/i)
      await user.type(contactNameInput, 'Jane Doe')
      // Leave phone and relationship empty

      const submitButton = screen.getByRole('button', { name: /create member/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/phone is required/i)).toBeInTheDocument()
        expect(screen.getByText(/relationship is required/i)).toBeInTheDocument()
      })
    })
  })

  describe('Membership Status', () => {
    it('should allow selection of different membership statuses', async () => {
      render(
        <MemberForm
          mode="create"
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      )

      const statusSelect = screen.getByLabelText(/membership status/i)
      await user.click(statusSelect)

      // Check that all status options are available
      await waitFor(() => {
        expect(screen.getByText('Active')).toBeInTheDocument()
        expect(screen.getByText('Inactive')).toBeInTheDocument()
        expect(screen.getByText('Frozen')).toBeInTheDocument()
        expect(screen.getByText('Cancelled')).toBeInTheDocument()
      })

      await user.click(screen.getByText('Frozen'))

      // Verify the selection
      expect(statusSelect).toHaveTextContent('Frozen')
    })
  })

  describe('Loading States', () => {
    it('should disable submit button when form is submitting', async () => {
      // Mock a pending state
      vi.mocked(require('@/lib/hooks/use-members-modern').useCreateMember).mockReturnValue({
        mutate: mockMemberService.createMember,
        isPending: true,
      })

      render(
        <MemberForm
          mode="create"
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      )

      const submitButton = screen.getByRole('button', { name: /create member/i })
      expect(submitButton).toBeDisabled()
    })

    it('should show loading indicator when form is submitting', () => {
      // Mock a pending state
      vi.mocked(require('@/lib/hooks/use-members-modern').useCreateMember).mockReturnValue({
        mutate: mockMemberService.createMember,
        isPending: true,
      })

      render(
        <MemberForm
          mode="create"
          onSuccess={mockOnSuccess}
          onCancel={mockOnCancel}
        />
      )

      // Look for loading indicator (spinner, text, etc.)
      expect(screen.getByText(/creating/i)).toBeInTheDocument()
    })
  })
})