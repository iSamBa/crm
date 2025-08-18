import { useState, useEffect, useCallback } from 'react';
import { ServiceResponse } from '@/lib/services/base-service';

export interface UseQueryOptions {
  enabled?: boolean;
  refetchOnWindowFocus?: boolean;
  refetchInterval?: number;
  dependencies?: unknown[];
}

export interface UseQueryResult<TData> {
  data: TData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Generic query hook that eliminates boilerplate for data fetching
 */
export function useQuery<TData, TFilter = undefined>(
  queryFn: (filter?: TFilter) => Promise<ServiceResponse<TData>>,
  filter?: TFilter,
  options: UseQueryOptions = {}
): UseQueryResult<TData> {
  const [data, setData] = useState<TData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    enabled = true,
    refetchOnWindowFocus = false,
    refetchInterval,
    dependencies = []
  } = options;

  const fetchData = useCallback(async () => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await queryFn(filter);
      
      if (result && result.error) {
        setError(result.error);
        setData(null);
      } else if (result && result.data !== undefined) {
        setData(result.data);
        setError(null);
      } else {
        setError('Invalid response format');
        setData(null);
      }
    } catch (err) {
      console.error('[useQuery] Caught error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [queryFn, filter, enabled, ...dependencies]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Set up refetch interval
  useEffect(() => {
    if (!refetchInterval) return;

    const interval = setInterval(fetchData, refetchInterval);
    return () => clearInterval(interval);
  }, [fetchData, refetchInterval]);

  // Set up window focus refetch
  useEffect(() => {
    if (!refetchOnWindowFocus) return;

    const handleFocus = () => {
      if (!document.hidden) {
        fetchData();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [fetchData, refetchOnWindowFocus]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData
  };
}

export interface UseMutationResult<TVariables, TData> {
  mutate: (variables: TVariables) => Promise<ServiceResponse<TData>>;
  isLoading: boolean;
  error: string | null;
}

/**
 * Generic mutation hook for create/update/delete operations
 */
export function useMutation<TVariables, TData>(
  mutationFn: (variables: TVariables) => Promise<ServiceResponse<TData>>
): UseMutationResult<TVariables, TData> {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(async (variables: TVariables): Promise<ServiceResponse<TData>> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await mutationFn(variables);
      
      if (result.error) {
        setError(result.error);
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      return { data: null, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [mutationFn]);

  return {
    mutate,
    isLoading,
    error
  };
}