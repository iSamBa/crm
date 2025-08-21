import { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi, expect } from 'vitest'

// Mock auth context
const mockAuthContext = {
  user: null,
  isLoading: false,
  isAdmin: false,
  isTrainer: false,
  signIn: vi.fn(),
  signOut: vi.fn(),
}

// Create a custom render function that includes providers
const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient
  initialAuthState?: Partial<typeof mockAuthContext>
}

const customRender = (
  ui: ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { queryClient = createTestQueryClient(), initialAuthState, ...renderOptions } = options

  // Mock the auth context
  const authContextValue = {
    ...mockAuthContext,
    ...initialAuthState,
  }

  // Mock the useAuth hook
  vi.doMock('@/lib/auth/auth-context', () => ({
    useAuth: () => authContextValue,
    AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  }))

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  }
}

// Re-export everything
export * from '@testing-library/react'
export { customRender as render }

// Helper functions for testing
export const createMockUser = (overrides = {}) => ({
  id: 'user-test-id',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'admin',
  createdAt: new Date().toISOString(),
  ...overrides,
})

export const createMockMember = (overrides = {}) => ({
  id: 'member-test-id',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '+1-555-0101',
  membershipStatus: 'active' as const,
  joinDate: '2024-01-15T00:00:00Z',
  emergencyContact: {
    name: 'Jane Doe',
    phone: '+1-555-0102',
    relationship: 'spouse',
  },
  medicalConditions: '',
  fitnessGoals: 'Weight loss',
  preferredTrainingTimes: ['morning'],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
})

export const createMockTrainer = (overrides = {}) => ({
  id: 'trainer-test-id',
  firstName: 'Alex',
  lastName: 'Thompson',
  email: 'alex.trainer@example.com',
  phone: '+1-555-1001',
  specializations: ['Weight Training', 'Cardio'],
  certifications: ['NASM-CPT'],
  hourlyRate: 75,
  isActive: true,
  availability: {
    monday: [{ start: '09:00', end: '17:00' }],
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
})

export const createMockSession = (overrides = {}) => ({
  id: 'session-test-id',
  memberId: 'member-test-id',
  trainerId: 'trainer-test-id',
  type: 'personal' as const,
  title: 'Test Session',
  description: 'Test session description',
  scheduledDate: '2024-08-22T10:00:00Z',
  duration: 60,
  cost: 75,
  status: 'scheduled' as const,
  sessionRoom: 'Room A',
  equipmentNeeded: ['Dumbbells'],
  sessionGoals: 'Test goals',
  preparationNotes: 'Test notes',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
})

export const createMockSubscriptionPlan = (overrides = {}) => ({
  id: 'plan-test-id',
  name: 'Test Plan',
  description: 'Test plan description',
  price: 49.99,
  duration: 'monthly' as const,
  features: ['Gym Access', 'Group Classes'],
  maxSessionsPerMonth: 0,
  includesPersonalTraining: false,
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
})

export const createMockSubscription = (overrides = {}) => ({
  id: 'subscription-test-id',
  memberId: 'member-test-id',
  planId: 'plan-test-id',
  status: 'active' as const,
  startDate: '2024-01-15T00:00:00Z',
  endDate: '2024-12-15T00:00:00Z',
  autoRenew: true,
  price: 49.99,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
})

// Test assertion helpers
export const expectToBeInTheDocument = (element: HTMLElement | null) => {
  expect(element).toBeInTheDocument()
}

export const expectNotToBeInTheDocument = (element: HTMLElement | null) => {
  expect(element).not.toBeInTheDocument()
}

export const waitForLoadingToFinish = async () => {
  const { waitForElementToBeRemoved } = await import('@testing-library/react')
  // Wait for any loading spinners to disappear
  const loadingElements = document.querySelectorAll('[data-testid="loading"]')
  if (loadingElements.length > 0) {
    await waitForElementToBeRemoved(() => document.querySelector('[data-testid="loading"]'))
  }
}