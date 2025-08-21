import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { Member } from '@/types'

// Mock the Supabase client first
const mockSupabaseResponse = {
  data: null,
  error: null,
}

const mockSupabaseQuery = {
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  neq: vi.fn().mockReturnThis(),
  gte: vi.fn().mockReturnThis(),
  lte: vi.fn().mockReturnThis(),
  like: vi.fn().mockReturnThis(),
  ilike: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  range: vi.fn().mockReturnThis(),
  single: vi.fn().mockResolvedValue(mockSupabaseResponse),
  maybeSingle: vi.fn().mockResolvedValue(mockSupabaseResponse),
}

const mockSupabase = {
  from: vi.fn(() => mockSupabaseQuery),
}

// Mock the BaseService dependencies
vi.mock('@/lib/supabase/client', () => ({
  supabase: mockSupabase,
}))

vi.mock('@/lib/query-client', () => ({
  queryClient: {
    getQueryData: vi.fn(),
    setQueryData: vi.fn(),
    invalidateQueries: vi.fn(),
    removeQueries: vi.fn(),
    clear: vi.fn(),
  },
  invalidateQueries: {
    members: {
      all: vi.fn(),
      list: vi.fn(),
      detail: vi.fn(),
    },
  },
}))

// Import after mocks are set up
const { memberService } = await import('../member-service')

describe('MemberService Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset the mock response
    mockSupabaseResponse.data = null
    mockSupabaseResponse.error = null
  })

  describe('getMembers', () => {
    it('should fetch all members successfully', async () => {
      const mockMembers = [
        {
          id: 'member-1',
          first_name: 'John',
          last_name: 'Doe',
          email: 'john.doe@example.com',
          phone: '+1-555-0101',
          membership_status: 'active',
          join_date: '2024-01-15T00:00:00Z',
          created_at: '2024-01-15T00:00:00Z',
          updated_at: '2024-01-15T00:00:00Z',
        },
        {
          id: 'member-2',
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'jane.smith@example.com',
          phone: '+1-555-0201',
          membership_status: 'inactive',
          join_date: '2024-02-01T00:00:00Z',
          created_at: '2024-02-01T00:00:00Z',
          updated_at: '2024-02-01T00:00:00Z',
        },
      ]

      mockSupabaseResponse.data = mockMembers

      const result = await memberService.getMembers()

      expect(result.error).toBeNull()
      expect(result.data).toHaveLength(2)
      
      // Verify field transformation
      expect(result.data![0]).toEqual(
        expect.objectContaining({
          id: 'member-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          membershipStatus: 'active',
        })
      )

      // Verify Supabase query was built correctly
      expect(mockSupabase.from).toHaveBeenCalledWith('members')
      expect(mockSupabaseQuery.select).toHaveBeenCalledWith('*')
      expect(mockSupabaseQuery.order).toHaveBeenCalledWith('created_at', { ascending: false })
    })

    it('should apply filters correctly', async () => {
      mockSupabaseResponse.data = []

      const filters = {
        status: 'active',
        searchTerm: 'john',
        joinDateFrom: '2024-01-01',
        joinDateTo: '2024-12-31',
      }

      await memberService.getMembers(filters)

      // Verify filters were applied
      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('membership_status', 'active')
      expect(mockSupabaseQuery.gte).toHaveBeenCalledWith('join_date', '2024-01-01T00:00:00.000Z')
      expect(mockSupabaseQuery.lte).toHaveBeenCalledWith('join_date', '2024-12-31T23:59:59.999Z')
    })

    it('should handle database errors gracefully', async () => {
      mockSupabaseResponse.error = {
        message: 'Database connection failed',
        code: 'CONNECTION_ERROR',
      }

      const result = await memberService.getMembers()

      expect(result.data).toBeNull()
      expect(result.error).toBe('Database connection failed')
    })

    it('should handle empty results', async () => {
      mockSupabaseResponse.data = []

      const result = await memberService.getMembers()

      expect(result.error).toBeNull()
      expect(result.data).toEqual([])
    })
  })

  describe('getMemberById', () => {
    it('should fetch a specific member by ID', async () => {
      const mockMember = {
        id: 'member-1',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1-555-0101',
        membership_status: 'active',
        join_date: '2024-01-15T00:00:00Z',
        emergency_contact: {
          name: 'Jane Doe',
          phone: '+1-555-0102',
          relationship: 'spouse',
        },
        created_at: '2024-01-15T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z',
      }

      mockSupabaseResponse.data = mockMember

      const result = await memberService.getMemberById('member-1')

      expect(result.error).toBeNull()
      expect(result.data).toEqual(
        expect.objectContaining({
          id: 'member-1',
          firstName: 'John',
          lastName: 'Doe',
          emergencyContact: {
            name: 'Jane Doe',
            phone: '+1-555-0102',
            relationship: 'spouse',
          },
        })
      )

      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('id', 'member-1')
      expect(mockSupabaseQuery.single).toHaveBeenCalled()
    })

    it('should handle member not found', async () => {
      mockSupabaseResponse.error = {
        code: 'PGRST116',
        message: 'No rows returned',
      }

      const result = await memberService.getMemberById('non-existent-id')

      expect(result.data).toBeNull()
      expect(result.error).toBe('The requested resource does not exist')
    })
  })

  describe('createMember', () => {
    it('should create a new member successfully', async () => {
      const memberData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1-555-0101',
        membershipStatus: 'active' as const,
        emergencyContact: {
          name: 'Jane Doe',
          phone: '+1-555-0102',
          relationship: 'spouse',
        },
      }

      const mockCreatedMember = {
        id: 'new-member-id',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1-555-0101',
        membership_status: 'active',
        emergency_contact: {
          name: 'Jane Doe',
          phone: '+1-555-0102',
          relationship: 'spouse',
        },
        created_at: '2024-01-15T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z',
      }

      mockSupabaseResponse.data = mockCreatedMember

      const result = await memberService.createMember(memberData)

      expect(result.error).toBeNull()
      expect(result.data).toEqual(
        expect.objectContaining({
          id: 'new-member-id',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          membershipStatus: 'active',
        })
      )

      // Verify the insert was called with transformed data
      expect(mockSupabaseQuery.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          first_name: 'John',
          last_name: 'Doe',
          email: 'john.doe@example.com',
          membership_status: 'active',
          emergency_contact: {
            name: 'Jane Doe',
            phone: '+1-555-0102',
            relationship: 'spouse',
          },
        })
      )
      expect(mockSupabaseQuery.select).toHaveBeenCalledWith('*')
      expect(mockSupabaseQuery.single).toHaveBeenCalled()
    })

    it('should validate input data before creating', async () => {
      const invalidData = {
        firstName: '', // Invalid: empty
        lastName: 'Doe',
        email: 'invalid-email', // Invalid: not an email
      }

      const result = await memberService.createMember(invalidData as any)

      expect(result.data).toBeNull()
      expect(result.error).toContain('First name is required')
      
      // Should not call insert if validation fails
      expect(mockSupabaseQuery.insert).not.toHaveBeenCalled()
    })

    it('should handle duplicate email error', async () => {
      const memberData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'existing@example.com',
      }

      mockSupabaseResponse.error = {
        code: '23505', // Unique constraint violation
        message: 'duplicate key value violates unique constraint',
      }

      const result = await memberService.createMember(memberData)

      expect(result.data).toBeNull()
      expect(result.error).toBe('This record already exists')
    })
  })

  describe('updateMember', () => {
    it('should update a member successfully', async () => {
      const updateData = {
        id: 'member-1',
        firstName: 'Jane',
        phone: '+1-555-9999',
      }

      const mockUpdatedMember = {
        id: 'member-1',
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1-555-9999',
        membership_status: 'active',
        updated_at: new Date().toISOString(),
      }

      mockSupabaseResponse.data = mockUpdatedMember

      const result = await memberService.updateMember(updateData)

      expect(result.error).toBeNull()
      expect(result.data).toEqual(
        expect.objectContaining({
          id: 'member-1',
          firstName: 'Jane',
          phone: '+1-555-9999',
        })
      )

      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('id', 'member-1')
      expect(mockSupabaseQuery.update).toHaveBeenCalledWith(
        expect.objectContaining({
          first_name: 'Jane',
          phone: '+1-555-9999',
        })
      )
    })

    it('should validate update data', async () => {
      const invalidData = {
        id: 'not-a-uuid', // Invalid UUID
        firstName: 'John',
      }

      const result = await memberService.updateMember(invalidData)

      expect(result.data).toBeNull()
      expect(result.error).toContain('Invalid member ID')
      expect(mockSupabaseQuery.update).not.toHaveBeenCalled()
    })
  })

  describe('deleteMember', () => {
    it('should delete a member successfully', async () => {
      mockSupabaseResponse.data = {}

      const result = await memberService.deleteMember('member-1')

      expect(result.error).toBeNull()
      expect(result.data).toBe(true)

      expect(mockSupabaseQuery.eq).toHaveBeenCalledWith('id', 'member-1')
      expect(mockSupabaseQuery.delete).toHaveBeenCalled()
    })

    it('should handle foreign key constraint error', async () => {
      mockSupabaseResponse.error = {
        code: '23503', // Foreign key violation
        message: 'update or delete on table violates foreign key constraint',
      }

      const result = await memberService.deleteMember('member-1')

      expect(result.data).toBeNull()
      expect(result.error).toBe('Cannot delete - this record is referenced by other data')
    })

    it('should handle member not found during delete', async () => {
      mockSupabaseResponse.error = {
        code: 'PGRST116',
        message: 'No rows returned',
      }

      const result = await memberService.deleteMember('non-existent-id')

      expect(result.data).toBeNull()
      expect(result.error).toBe('The requested resource does not exist')
    })
  })

  describe('getMemberStats', () => {
    it('should return member statistics', async () => {
      const mockStats = [
        { membership_status: 'active', count: 15 },
        { membership_status: 'inactive', count: 5 },
        { membership_status: 'frozen', count: 3 },
        { membership_status: 'cancelled', count: 2 },
      ]

      mockSupabaseResponse.data = mockStats

      const result = await memberService.getMemberStats()

      expect(result.error).toBeNull()
      expect(result.data).toEqual({
        total: 25,
        active: 15,
        inactive: 5,
        frozen: 3,
        cancelled: 2,
        newThisMonth: 0, // Would need additional mock setup for this
      })

      expect(mockSupabaseQuery.select).toHaveBeenCalledWith('membership_status, count(*)')
    })
  })
})