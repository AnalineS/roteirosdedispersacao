import { useState, useCallback } from 'react';

interface RegenerateTrack {
  [messageId: string]: number;
}

const MAX_REGENERATE_ATTEMPTS = 3;

export function useRegenerateTracking() {
  const [regenerateCounts, setRegenerateCounts] = useState<RegenerateTrack>({});

  const getRegenerateCount = useCallback((messageId: string): number => {
    return regenerateCounts[messageId] || 0;
  }, [regenerateCounts]);

  const canRegenerate = useCallback((messageId: string): boolean => {
    const count = regenerateCounts[messageId] || 0;
    return count < MAX_REGENERATE_ATTEMPTS;
  }, [regenerateCounts]);

  const trackRegenerate = useCallback((messageId: string): boolean => {
    const currentCount = regenerateCounts[messageId] || 0;

    if (currentCount >= MAX_REGENERATE_ATTEMPTS) {
      return false; // Cannot regenerate - limit reached
    }

    setRegenerateCounts(prev => ({
      ...prev,
      [messageId]: currentCount + 1
    }));

    return true; // Regenerate allowed
  }, [regenerateCounts]);

  const resetRegenerateCount = useCallback((messageId: string) => {
    setRegenerateCounts(prev => {
      const newCounts = { ...prev };
      delete newCounts[messageId];
      return newCounts;
    });
  }, []);

  const clearAllCounts = useCallback(() => {
    setRegenerateCounts({});
  }, []);

  return {
    getRegenerateCount,
    canRegenerate,
    trackRegenerate,
    resetRegenerateCount,
    clearAllCounts,
    maxAttempts: MAX_REGENERATE_ATTEMPTS
  };
}
