import { supabase } from '@/lib/supabase/client';
import { queryClient, invalidateQueries } from '@/lib/query-client';
import { z } from 'zod';

export interface ServiceResponse<T> {
  data: T | null;
  error: string | null;
}

export interface ServiceResult {
  success: boolean;
  error: string | null;
}

export interface QueryOptions<T = unknown> {
  logQuery?: string;
  allowEmpty?: boolean;
  expectArray?: boolean;
  validate?: z.ZodSchema<T>;
  transform?: (data: unknown) => T;
}

export interface MutationOptions<T = unknown> {
  logOperation?: string;
  validate?: z.ZodSchema<T>;
  invalidateQueries?: (() => void)[];
  optimisticUpdate?: {
    queryKey: readonly string[];
    updater: (oldData: unknown) => unknown;
  };
  transform?: (data: unknown) => T;
}

export abstract class BaseService {
  /**
   * Enhanced error handling with detailed information
   */
  protected handleError(error: unknown, defaultMessage: string): string {
    // Type guard for error objects with code property
    const isErrorWithCode = (err: unknown): err is { code: string; message?: string } => {
      return err != null && typeof err === 'object' && 'code' in err;
    };

    // Type guard for error objects with message property
    const isErrorWithMessage = (err: unknown): err is { message: string } => {
      return err != null && typeof err === 'object' && 'message' in err;
    };

    // Type guard for error objects with name property
    const isErrorWithName = (err: unknown): err is { name: string } => {
      return err != null && typeof err === 'object' && 'name' in err;
    };

    // Supabase specific errors
    if (isErrorWithCode(error)) {
      switch (error.code) {
        case 'PGRST116':
          return 'The requested resource does not exist';
        case '23505':
          return 'This record already exists';
        case '23503':
          return 'Cannot delete - this record is referenced by other data';
        case '42501':
          return 'You do not have permission to perform this action';
        default:
          return error.message || defaultMessage;
      }
    }

    // Network errors
    if (isErrorWithName(error) && error.name === 'NetworkError') {
      return 'Network connection failed. Please check your internet connection.';
    }

    // Validation errors
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      return `${firstError.path.join('.')}: ${firstError.message}`;
    }

    if (isErrorWithMessage(error)) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return defaultMessage;
  }

  /**
   * Execute a Supabase query with modern patterns
   */
  protected async executeQuery<T>(
    queryFn: () => Promise<{ data: T; error: unknown }>,
    errorMessage: string,
    options: QueryOptions<T> = {}
  ): Promise<ServiceResponse<T>> {
    try {

      const result = await queryFn();
      let { data } = result;
      const { error } = result;


      if (error) {
        console.error(`[${this.constructor.name}] Error:`, error);
        return { 
          data: null, 
          error: this.handleError(error, errorMessage)
        };
      }

      // Handle empty data
      if (data === null || data === undefined) {
        if (options.allowEmpty) {
          // For array types, return empty array instead of null
          const emptyValue = options.expectArray ? [] : data;
          return { data: emptyValue as T, error: null };
        }
        return { 
          data: null, 
          error: 'No data returned' 
        };
      }

      // Apply transformation if provided
      if (options.transform) {
        data = options.transform(data);
      }

      // Validate data if schema provided
      if (options.validate) {
        try {
          data = options.validate.parse(data);
        } catch (validationError) {
          console.error(`[${this.constructor.name}] Validation error:`, validationError);
          return {
            data: null,
            error: this.handleError(validationError, 'Data validation failed')
          };
        }
      }

      return { data, error: null };
    } catch (error) {
      console.error(`[${this.constructor.name}] Unexpected error:`, error);
      return { 
        data: null, 
        error: this.handleError(error, errorMessage) 
      };
    }
  }

  /**
   * Execute a Supabase mutation with optimistic updates and cache invalidation
   */
  protected async executeMutation<T = unknown>(
    mutationFn: () => Promise<{ data?: T; error: unknown }>,
    errorMessage: string,
    options: MutationOptions<T> = {}
  ): Promise<ServiceResponse<T>> {
    let rollbackFn: (() => void) | null = null;

    try {

      // Apply optimistic update
      if (options.optimisticUpdate) {
        const { queryKey, updater } = options.optimisticUpdate;
        const previousData = queryClient.getQueryData(queryKey);
        
        queryClient.setQueryData(queryKey, updater);
        
        rollbackFn = () => {
          queryClient.setQueryData(queryKey, previousData);
        };
      }

      const result = await mutationFn();
      let { data } = result;
      const { error } = result;

      if (error) {
        console.error(`[${this.constructor.name}] Error:`, error);
        
        // Rollback optimistic update on error
        if (rollbackFn) {
          rollbackFn();
        }
        
        return { 
          data: null, 
          error: this.handleError(error, errorMessage)
        };
      }

      // Apply transformation if provided
      if (options.transform && data) {
        data = options.transform(data);
      }

      // Invalidate related queries on success
      if (options.invalidateQueries) {
        options.invalidateQueries.forEach(invalidate => invalidate());
      }

      return { data: data || null, error: null };
    } catch (error) {
      console.error(`[${this.constructor.name}] Unexpected error:`, error);
      
      // Rollback optimistic update on error
      if (rollbackFn) {
        rollbackFn();
      }
      
      return { 
        data: null, 
        error: this.handleError(error, errorMessage) 
      };
    }
  }

  /**
   * Transform database field names to frontend camelCase
   */
  protected transformFields<T = Record<string, unknown>>(dbData: Record<string, unknown> | null, fieldMap: Record<string, string>): T | null {
    if (!dbData) return null;

    const transformed: Record<string, unknown> = {};
    
    // Copy direct fields and transform mapped fields
    for (const [dbField, frontendField] of Object.entries(fieldMap)) {
      if (dbData[dbField] !== undefined) {
        transformed[frontendField] = dbData[dbField];
      }
    }

    // Copy unmapped fields as-is
    for (const [key, value] of Object.entries(dbData)) {
      if (!fieldMap[key] && !transformed[key]) {
        transformed[key] = value;
      }
    }

    return transformed as T;
  }

  /**
   * Transform frontend camelCase fields to database snake_case
   */
  protected transformToDbFields(frontendData: Record<string, unknown> | null, fieldMap: Record<string, string>): Record<string, unknown> | null {
    if (!frontendData) return null;

    const transformed: Record<string, unknown> = {};
    const reverseMap = Object.fromEntries(
      Object.entries(fieldMap).map(([db, frontend]) => [frontend, db])
    );

    // Transform mapped fields
    for (const [frontendField, dbField] of Object.entries(reverseMap)) {
      if (frontendData[frontendField] !== undefined) {
        transformed[dbField] = frontendData[frontendField];
      }
    }

    // Copy unmapped fields as-is
    for (const [key, value] of Object.entries(frontendData)) {
      if (!reverseMap[key] && !transformed[key]) {
        transformed[key] = value;
      }
    }

    return transformed;
  }

  /**
   * Validate input data with Zod schema
   */
  protected validateInput<T>(schema: z.ZodSchema<T>, data: unknown): ServiceResponse<T> {
    try {
      const validatedData = schema.parse(data);
      return { data: validatedData, error: null };
    } catch (error) {
      return {
        data: null,
        error: this.handleError(error, 'Invalid input data')
      };
    }
  }

  /**
   * Get Supabase client instance
   */
  protected get db() {
    return supabase;
  }

  /**
   * Get query client for cache operations
   */
  protected get cache() {
    return queryClient;
  }

  /**
   * Get invalidation helpers
   */
  protected get invalidate() {
    return invalidateQueries;
  }
}