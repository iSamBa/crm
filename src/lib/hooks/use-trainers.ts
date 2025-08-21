import { useState, useEffect, useCallback } from 'react';
import { trainerService } from '@/lib/services/trainer-service';
import { TrainerFilters } from '@/lib/schemas';
import { Trainer } from '@/types';

export function useTrainers(filters?: TrainerFilters) {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrainers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    const { data, error: fetchError } = await trainerService.getTrainers(filters);
    
    if (fetchError) {
      setError(fetchError);
    } else {
      setTrainers(data || []);
    }
    
    setIsLoading(false);
  }, [filters]);

  useEffect(() => {
    fetchTrainers();
  }, [fetchTrainers]);

  return {
    trainers,
    isLoading,
    error,
    refetch: fetchTrainers
  };
}

export function useTrainer(id: string) {
  const [trainer, setTrainer] = useState<Trainer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrainer = useCallback(async () => {
    if (!id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    
    const { data, error: fetchError } = await trainerService.getTrainerById(id);
    
    if (fetchError) {
      setError(fetchError);
    } else {
      setTrainer(data);
    }
    
    setIsLoading(false);
  }, [id]);

  useEffect(() => {
    fetchTrainer();
  }, [fetchTrainer]);

  return {
    trainer,
    isLoading,
    error,
    refetch: fetchTrainer
  };
}

export function useTrainerAvailability(trainerId: string, date: string) {
  const [availability, setAvailability] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkAvailability = useCallback(async () => {
    if (!trainerId || !date) {
      return;
    }

    setIsLoading(true);
    setError(null);
    
    // TODO: Implement getTrainerAvailability in service
    const { data, error: fetchError } = { data: null, error: 'Method not implemented' };
    
    if (fetchError) {
      setError(fetchError);
    } else {
      setAvailability(data || []);
    }
    
    setIsLoading(false);
  }, [trainerId, date]);

  useEffect(() => {
    checkAvailability();
  }, [checkAvailability]);

  return {
    availability,
    isLoading,
    error,
    refetch: checkAvailability
  };
}