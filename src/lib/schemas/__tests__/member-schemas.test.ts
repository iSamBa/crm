import { describe, it, expect } from 'vitest'
import { 
  CreateMemberSchema, 
  UpdateMemberSchema, 
  MemberFiltersSchema,
  validateMemberData,
  safeParse 
} from '../index'

describe('Member Schemas', () => {
  describe('CreateMemberSchema', () => {
    const validMemberData = {
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
      medicalConditions: 'None',
      fitnessGoals: 'Weight loss',
      preferredTrainingTimes: ['morning'],
      joinDate: '2024-01-15',
    }

    it('should validate valid member data', () => {
      const result = CreateMemberSchema.safeParse(validMemberData)
      expect(result.success).toBe(true)
      
      if (result.success) {
        expect(result.data.firstName).toBe('John')
        expect(result.data.lastName).toBe('Doe')
        expect(result.data.membershipStatus).toBe('active')
      }
    })

    it('should apply default values', () => {
      const minimalData = {
        firstName: 'John',
        lastName: 'Doe',
      }
      
      const result = CreateMemberSchema.safeParse(minimalData)
      expect(result.success).toBe(true)
      
      if (result.success) {
        expect(result.data.membershipStatus).toBe('active')
        expect(result.data.preferredTrainingTimes).toEqual([])
      }
    })

    it('should reject invalid first name', () => {
      const invalidData = {
        ...validMemberData,
        firstName: '', // Empty string
      }
      
      const result = CreateMemberSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('First name is required')
      }
    })

    it('should reject first name with invalid characters', () => {
      const invalidData = {
        ...validMemberData,
        firstName: 'John123', // Contains numbers
      }
      
      const result = CreateMemberSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('First name contains invalid characters')
      }
    })

    it('should accept valid names with hyphens and apostrophes', () => {
      const validData = {
        ...validMemberData,
        firstName: "Mary-Jane",
        lastName: "O'Connor",
      }
      
      const result = CreateMemberSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject first name that is too long', () => {
      const invalidData = {
        ...validMemberData,
        firstName: 'A'.repeat(51), // 51 characters
      }
      
      const result = CreateMemberSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('First name must be less than 50 characters')
      }
    })

    it('should reject invalid email format', () => {
      const invalidData = {
        ...validMemberData,
        email: 'not-an-email',
      }
      
      const result = CreateMemberSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid email format')
      }
    })

    it('should accept empty email', () => {
      const validData = {
        ...validMemberData,
        email: '',
      }
      
      const result = CreateMemberSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid phone format', () => {
      const invalidData = {
        ...validMemberData,
        phone: 'abc-def-ghij', // Contains letters
      }
      
      const result = CreateMemberSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid phone number format')
      }
    })

    it('should accept various valid phone formats', () => {
      const phoneFormats = [
        '+1-555-0101',
        '(555) 555-0101',
        '5555550101',
        '+1 555 555 0101',
        '+15550101',
      ]

      phoneFormats.forEach(phone => {
        const data = { ...validMemberData, phone }
        const result = CreateMemberSchema.safeParse(data)
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid membership status', () => {
      const invalidData = {
        ...validMemberData,
        membershipStatus: 'invalid-status',
      }
      
      const result = CreateMemberSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should validate emergency contact', () => {
      const dataWithInvalidEmergencyContact = {
        ...validMemberData,
        emergencyContact: {
          name: '', // Empty name
          phone: '+1-555-0102',
          relationship: 'spouse',
        },
      }
      
      const result = CreateMemberSchema.safeParse(dataWithInvalidEmergencyContact)
      expect(result.success).toBe(false)
      
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('emergencyContact')
        expect(result.error.issues[0].path).toContain('name')
      }
    })

    it('should accept optional emergency contact', () => {
      const dataWithoutEmergencyContact = {
        firstName: 'John',
        lastName: 'Doe',
      }
      
      const result = CreateMemberSchema.safeParse(dataWithoutEmergencyContact)
      expect(result.success).toBe(true)
    })

    it('should validate medical conditions length', () => {
      const invalidData = {
        ...validMemberData,
        medicalConditions: 'A'.repeat(501), // Too long
      }
      
      const result = CreateMemberSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Medical conditions must be less than 500 characters')
      }
    })

    it('should validate fitness goals length', () => {
      const invalidData = {
        ...validMemberData,
        fitnessGoals: 'A'.repeat(501), // Too long
      }
      
      const result = CreateMemberSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Fitness goals must be less than 500 characters')
      }
    })

    it('should validate join date format', () => {
      const invalidData = {
        ...validMemberData,
        joinDate: 'invalid-date',
      }
      
      const result = CreateMemberSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should accept ISO datetime for join date', () => {
      const validData = {
        ...validMemberData,
        joinDate: '2024-01-15T10:30:00Z',
      }
      
      const result = CreateMemberSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('UpdateMemberSchema', () => {
    it('should require id field', () => {
      const data = {
        firstName: 'John',
      }
      
      const result = UpdateMemberSchema.safeParse(data)
      expect(result.success).toBe(false)
      
      if (!result.success) {
        expect(result.error.issues[0].path).toContain('id')
      }
    })

    it('should validate UUID format for id', () => {
      const invalidData = {
        id: 'not-a-uuid',
        firstName: 'John',
      }
      
      const result = UpdateMemberSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
      
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid member ID')
      }
    })

    it('should allow partial updates', () => {
      const validData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        firstName: 'John',
      }
      
      const result = UpdateMemberSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('MemberFiltersSchema', () => {
    it('should accept valid filters', () => {
      const filters = {
        status: 'active',
        searchTerm: 'john',
        joinDateFrom: '2024-01-01',
        joinDateTo: '2024-12-31',
        hasEmergencyContact: true,
      }
      
      const result = MemberFiltersSchema.safeParse(filters)
      expect(result.success).toBe(true)
    })

    it('should accept empty filters', () => {
      const result = MemberFiltersSchema.safeParse({})
      expect(result.success).toBe(true)
    })

    it('should accept undefined', () => {
      const result = MemberFiltersSchema.safeParse(undefined)
      expect(result.success).toBe(true)
    })
  })

  describe('Validation Helper Functions', () => {
    describe('validateMemberData', () => {
      it('should validate correct data', () => {
        const validData = {
          firstName: 'John',
          lastName: 'Doe',
        }
        
        expect(() => validateMemberData(validData)).not.toThrow()
      })

      it('should throw for invalid data', () => {
        const invalidData = {
          firstName: '', // Empty
          lastName: 'Doe',
        }
        
        expect(() => validateMemberData(invalidData)).toThrow()
      })
    })

    describe('safeParse', () => {
      it('should return success for valid data', () => {
        const validData = {
          firstName: 'John',
          lastName: 'Doe',
        }
        
        const result = safeParse(CreateMemberSchema, validData)
        expect(result.success).toBe(true)
        
        if (result.success) {
          expect(result.data?.firstName).toBe('John')
        }
      })

      it('should return errors for invalid data', () => {
        const invalidData = {
          firstName: '', // Empty
          lastName: 'Doe',
        }
        
        const result = safeParse(CreateMemberSchema, invalidData)
        expect(result.success).toBe(false)
        
        if (!result.success) {
          expect(result.errors).toBeDefined()
          expect(result.errors?.[0]?.field).toBe('firstName')
          expect(result.errors?.[0]?.message).toBe('First name is required')
        }
      })
    })
  })
})