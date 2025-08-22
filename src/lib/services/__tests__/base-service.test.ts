import { describe, it, expect, vi, beforeEach } from 'vitest'
import { z } from 'zod'
import { BaseService, ServiceResponse } from '../base-service'

// Create a concrete implementation for testing
class TestService extends BaseService {
  async testExecuteQuery<T>(
    queryFn: () => Promise<{ data: T; error: unknown }>,
    errorMessage: string,
    options = {}
  ): Promise<ServiceResponse<T>> {
    return this.executeQuery(queryFn, errorMessage, options)
  }

  async testExecuteMutation<T>(
    mutationFn: () => Promise<{ data?: T; error: unknown }>,
    errorMessage: string,
    options = {}
  ): Promise<ServiceResponse<T>> {
    return this.executeMutation(mutationFn, errorMessage, options)
  }

  testHandleError(error: unknown, defaultMessage: string): string {
    return this.handleError(error, defaultMessage)
  }

  testTransformFields<T>(data: Record<string, unknown> | null, fieldMap: Record<string, string>): T | null {
    return this.transformFields<T>(data, fieldMap)
  }

  testValidateInput<T>(schema: z.ZodSchema<T>, data: unknown): ServiceResponse<T> {
    return this.validateInput(schema, data)
  }
}

describe('BaseService', () => {
  let service: TestService

  beforeEach(() => {
    service = new TestService()
    vi.clearAllMocks()
  })

  describe('handleError', () => {
    it('should handle Supabase PGRST116 error', () => {
      const error = { code: 'PGRST116', message: 'Original message' }
      const result = service.testHandleError(error, 'Default message')
      expect(result).toBe('The requested resource does not exist')
    })

    it('should handle Supabase 23505 error (duplicate)', () => {
      const error = { code: '23505' }
      const result = service.testHandleError(error, 'Default message')
      expect(result).toBe('This record already exists')
    })

    it('should handle Supabase 23503 error (foreign key)', () => {
      const error = { code: '23503' }
      const result = service.testHandleError(error, 'Default message')
      expect(result).toBe('Cannot delete - this record is referenced by other data')
    })

    it('should handle Supabase 42501 error (permission)', () => {
      const error = { code: '42501' }
      const result = service.testHandleError(error, 'Default message')
      expect(result).toBe('You do not have permission to perform this action')
    })

    it('should handle NetworkError', () => {
      const error = { name: 'NetworkError' }
      const result = service.testHandleError(error, 'Default message')
      expect(result).toBe('Network connection failed. Please check your internet connection.')
    })

    it('should handle Zod validation error', () => {
      const zodError = new z.ZodError([
        {
          code: 'invalid_type',
          expected: 'string',
          received: 'number',
          path: ['firstName'],
          message: 'Expected string, received number',
        } as any,
      ])
      const result = service.testHandleError(zodError, 'Default message')
      expect(result).toBe('firstName: Expected string, received number')
    })

    it('should handle error with message property', () => {
      const error = { message: 'Custom error message' }
      const result = service.testHandleError(error, 'Default message')
      expect(result).toBe('Custom error message')
    })

    it('should handle string error', () => {
      const error = 'String error message'
      const result = service.testHandleError(error, 'Default message')
      expect(result).toBe('String error message')
    })

    it('should use default message for unknown error types', () => {
      const error = { unknownProperty: 'value' }
      const result = service.testHandleError(error, 'Default message')
      expect(result).toBe('Default message')
    })
  })

  describe('executeQuery', () => {
    it('should return data when query succeeds', async () => {
      const mockData = { id: '1', name: 'Test' }
      const queryFn = vi.fn().mockResolvedValue({ data: mockData, error: null })

      const result = await service.testExecuteQuery(queryFn, 'Error message')

      expect(result).toEqual({
        data: mockData,
        error: null,
      })
      expect(queryFn).toHaveBeenCalledTimes(1)
    })

    it('should return error when query fails', async () => {
      const mockError = { message: 'Database error' }
      const queryFn = vi.fn().mockResolvedValue({ data: null, error: mockError })

      const result = await service.testExecuteQuery(queryFn, 'Default error')

      expect(result).toEqual({
        data: null,
        error: 'Database error',
      })
    })

    it('should handle null data with allowEmpty option', async () => {
      const queryFn = vi.fn().mockResolvedValue({ data: null, error: null })

      const result = await service.testExecuteQuery(queryFn, 'Error message', { 
        allowEmpty: true,
        expectArray: true 
      })

      expect(result).toEqual({
        data: [],
        error: null,
      })
    })

    it('should validate data with schema when provided', async () => {
      const mockData = { id: '1', name: 'Test' }
      const queryFn = vi.fn().mockResolvedValue({ data: mockData, error: null })
      const schema = z.object({
        id: z.string(),
        name: z.string(),
      })

      const result = await service.testExecuteQuery(queryFn, 'Error message', { 
        validate: schema 
      })

      expect(result).toEqual({
        data: mockData,
        error: null,
      })
    })

    it('should return validation error when schema validation fails', async () => {
      const mockData = { id: 123, name: 'Test' } // id should be string
      const queryFn = vi.fn().mockResolvedValue({ data: mockData, error: null })
      const schema = z.object({
        id: z.string(),
        name: z.string(),
      })

      const result = await service.testExecuteQuery(queryFn, 'Error message', { 
        validate: schema 
      })

      expect(result.data).toBeNull()
      expect(result.error).toContain('id:')
    })

    it('should apply transformation when provided', async () => {
      const mockData = { id: '1', name: 'test' }
      const queryFn = vi.fn().mockResolvedValue({ data: mockData, error: null })
      const transform = (data: any) => ({ ...data, name: data.name.toUpperCase() })

      const result = await service.testExecuteQuery(queryFn, 'Error message', { 
        transform 
      })

      expect(result).toEqual({
        data: { id: '1', name: 'TEST' },
        error: null,
      })
    })

    it('should handle unexpected exceptions', async () => {
      const queryFn = vi.fn().mockRejectedValue(new Error('Unexpected error'))

      const result = await service.testExecuteQuery(queryFn, 'Default error')

      expect(result).toEqual({
        data: null,
        error: 'Unexpected error',
      })
    })
  })

  describe('executeMutation', () => {
    it('should return data when mutation succeeds', async () => {
      const mockData = { id: '1', name: 'Created' }
      const mutationFn = vi.fn().mockResolvedValue({ data: mockData, error: null })

      const result = await service.testExecuteMutation(mutationFn, 'Error message')

      expect(result).toEqual({
        data: mockData,
        error: null,
      })
    })

    it('should return error when mutation fails', async () => {
      const mockError = { message: 'Mutation error' }
      const mutationFn = vi.fn().mockResolvedValue({ data: null, error: mockError })

      const result = await service.testExecuteMutation(mutationFn, 'Default error')

      expect(result).toEqual({
        data: null,
        error: 'Mutation error',
      })
    })

    it('should handle mutations without data', async () => {
      const mutationFn = vi.fn().mockResolvedValue({ error: null })

      const result = await service.testExecuteMutation(mutationFn, 'Error message')

      expect(result).toEqual({
        data: null,
        error: null,
      })
    })
  })

  describe('transformFields', () => {
    it('should transform database fields to frontend fields', () => {
      const dbData = {
        id: '1',
        first_name: 'John',
        last_name: 'Doe',
        email_address: 'john@example.com',
        created_at: '2024-01-01',
      }
      const fieldMap = {
        first_name: 'firstName',
        last_name: 'lastName',
        email_address: 'email',
        created_at: 'createdAt',
      }

      const result = service.testTransformFields(dbData, fieldMap)

      expect(result).toEqual({
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        createdAt: '2024-01-01',
      })
    })

    it('should return null for null input', () => {
      const result = service.testTransformFields(null, {})
      expect(result).toBeNull()
    })

    it('should handle empty field map', () => {
      const dbData = { id: '1', name: 'Test' }
      const result = service.testTransformFields(dbData, {})

      expect(result).toEqual({
        id: '1',
        name: 'Test',
      })
    })
  })

  describe('validateInput', () => {
    it('should return validated data for valid input', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      })
      const data = { name: 'John', age: 30 }

      const result = service.testValidateInput(schema, data)

      expect(result).toEqual({
        data: { name: 'John', age: 30 },
        error: null,
      })
    })

    it('should return error for invalid input', () => {
      const schema = z.object({
        name: z.string(),
        age: z.number(),
      })
      const data = { name: 'John', age: 'thirty' } // age should be number

      const result = service.testValidateInput(schema, data)

      expect(result.data).toBeNull()
      expect(result.error).toContain('age:')
    })
  })
})