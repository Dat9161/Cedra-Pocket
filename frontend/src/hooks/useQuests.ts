/**
 * Quests Hook
 * Fetches and manages quests from backend
 */

import { useState, useCallback, useEffect } from 'react';
import { backendAPI, BackendAPIError, BackendQuest } from '../services/backend-api.service';
import { useAppStore } from '../store/useAppStore';
import type { Quest } from '../models';

interface UseQuestsReturn {
  quests: Quest[];
  isLoading: boolean;
  error: string | null;
  fetchQuests: () => Promise<void>;
  verifyQuest: (questId: string) => Promise<{ success: boolean; message: string }>;
  refetch: () => Promise<void>;
}

export function useQuests(): UseQuestsReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { quests, setQuests, updateQuest } = useAppStore();

  /**
   * Fetch quests from backend
   */
  const fetchQuests = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let backendQuests: BackendQuest[];

      // Get quests from backend
      try {
        backendQuests = await backendAPI.getQuests();
      } catch (questError) {
        console.warn('Backend quests not available, using empty list:', questError);
        backendQuests = [];
      }

      // Convert to frontend format
      const frontendQuests = backendQuests.map((q) => backendAPI.backendQuestToQuest(q));
      setQuests(frontendQuests);
    } catch (err) {
      console.error('Failed to fetch quests:', err);
      
      if (err instanceof BackendAPIError) {
        setError(err.message);
      } else {
        setError('Failed to load quests');
      }
    } finally {
      setIsLoading(false);
    }
  }, [setQuests]);

  /**
   * Verify/complete a quest
   */
  const verifyQuest = useCallback(async (questId: string): Promise<{ success: boolean; message: string }> => {
    try {
      const result = await backendAPI.verifyQuest(Number(questId));

      if (result.success) {
        // Update quest status locally
        updateQuest(questId, {
          status: 'completed',
          progress: 100,
          currentValue: 1,
        });
      }

      return result;
    } catch (err) {
      console.error('Quest verification failed:', err);
      
      if (err instanceof BackendAPIError) {
        return { success: false, message: err.message };
      }
      
      return { success: false, message: 'Verification failed' };
    }
  }, [updateQuest]);

  /**
   * Refetch quests
   */
  const refetch = useCallback(async () => {
    await fetchQuests();
  }, [fetchQuests]);

  /**
   * Auto-fetch on mount
   */
  useEffect(() => {
    if (quests.length === 0) {
      fetchQuests();
    }
  }, [fetchQuests, quests.length]);

  return {
    quests,
    isLoading,
    error,
    fetchQuests,
    verifyQuest,
    refetch,
  };
}
