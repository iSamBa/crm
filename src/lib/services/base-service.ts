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

export interface QueryOptions {
  logQuery?: string;
  allowEmpty?: boolean;
  validate?: z.ZodSchema<any>;
  transform?: (data: any) => any;
}

export interface MutationOptions {
  logOperation?: string;
  validate?: z.ZodSchema<any>;
  invalidateQueries?: (() => void)[];
  optimisticUpdate?: {
    queryKey: readonly string[];
    updater: (oldData: any) => any;
  };
  transform?: (data: any) => any;
}

export abstract class BaseService {
  /**
   * Enhanced error handling with detailed information
   */
  protected handleError(error: any, defaultMessage: string): string {
    // Supabase specific errors
    if (error?.code) {
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
    if (error?.name === 'NetworkError') {
      return 'Network connection failed. Please check your internet connection.';
    }

    // Validation errors
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      return `${firstError.path.join('.')}: ${firstError.message}`;
    }

    if (error?.message) {
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
    queryFn: () => Promise<{ data: T; error: any }>,
    errorMessage: string,
    options: QueryOptions = {}
  ): Promise<ServiceResponse<T>> {
    try {
      if (options.logQuery && process.env.NODE_ENV === 'development') {
        console.log(`[${this.constructor.name}] ${options.logQuery}`);
      }

      const result = await queryFn();
      let { data } = result;
      const { error } = result;

      if (options.logQuery && process.env.NODE_ENV === 'development') {
        console.log(`[${this.constructor.name}] Query result:`, { data, error });
      }

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
          return { data: data as T, error: null };
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
  protected async executeMutation<T = any>(
    mutationFn: () => Promise<{ data?: T; error: any }>,
    errorMessage: string,
    options: MutationOptions = {}
  ): Promise<ServiceResponse<T>> {
    let rollbackFn: (() => void) | null = null;

    try {
      if (options.logOperation && process.env.NODE_ENV === 'development') {
        console.log(`[${this.constructor.name}] ${options.logOperation}`);
      }

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
  protected transformFields(dbData: any, fieldMap: Record<string, string>): any {
    if (!dbData) return null;

    const transformed: any = {};
    
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

    return transformed;
  }

  /**
   * Transform frontend camelCase fields to database snake_case
   */
  protected transformToDbFields(frontendData: any, fieldMap: Record<string, string>): any {
    if (!frontendData) return null;

    const transformed: any = {};
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