/**
 * usePCDTSuggestions Hook
 * Provides debounced PCDT term suggestions based on user input
 *
 * Features:
 * - 300ms debounce for performance
 * - Synonym expansion from clinical taxonomy
 * - Category-aware filtering
 * - Memory caching with TTL
 *
 * ARIA Best Practices (React Aria):
 * - Returns data for aria-activedescendant management
 * - Supports keyboard navigation state
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { pcdtTermService } from '@/services/pcdtTermService';
import type {
  PCDTSuggestion,
  PCDTFilterCategory,
  MedicationType,
  UsePCDTSuggestionsReturn,
} from '../PCDTSearchTypes';

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;
const DEFAULT_MAX_RESULTS = 8;

interface CacheEntry {
  suggestions: PCDTSuggestion[];
  timestamp: number;
}

interface UsePCDTSuggestionsOptions {
  maxResults?: number;
  categories?: PCDTFilterCategory[];
  medications?: MedicationType[];
  debounceMs?: number;
  enabled?: boolean;
}

/**
 * Hook for PCDT term suggestions with debouncing and caching
 */
export function usePCDTSuggestions(
  options: UsePCDTSuggestionsOptions = {}
): UsePCDTSuggestionsReturn {
  const {
    maxResults = DEFAULT_MAX_RESULTS,
    categories,
    medications,
    debounceMs = DEBOUNCE_MS,
    enabled = true,
  } = options;

  // State
  const [suggestions, setSuggestions] = useState<PCDTSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Refs for debouncing and caching
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map());
  const lastQueryRef = useRef<string>('');

  /**
   * Generate cache key from query and filters
   */
  const getCacheKey = useCallback(
    (query: string): string => {
      const filterKey = [
        categories?.join(',') || '',
        medications?.join(',') || '',
      ].join('|');
      return `${query.toLowerCase().trim()}::${filterKey}`;
    },
    [categories, medications]
  );

  /**
   * Check if cache entry is valid
   */
  const isCacheValid = useCallback((entry: CacheEntry | undefined): boolean => {
    if (!entry) return false;
    return Date.now() - entry.timestamp < CACHE_TTL;
  }, []);

  /**
   * Perform the actual search
   */
  const performSearch = useCallback(
    (query: string): PCDTSuggestion[] => {
      if (!query || query.length < MIN_QUERY_LENGTH) {
        return [];
      }

      try {
        return pcdtTermService.searchTerms(query, {
          maxResults,
          categories,
          medications,
        });
      } catch (err) {
        console.error('[usePCDTSuggestions] Search error:', err);
        throw err;
      }
    },
    [maxResults, categories, medications]
  );

  /**
   * Search with debouncing and caching
   */
  const search = useCallback(
    (query: string) => {
      if (!enabled) {
        setSuggestions([]);
        return;
      }

      // Clear previous debounce
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      // Update last query
      lastQueryRef.current = query;

      // Handle empty or short queries
      if (!query || query.length < MIN_QUERY_LENGTH) {
        setSuggestions([]);
        setIsLoading(false);
        setError(null);
        return;
      }

      // Check cache first
      const cacheKey = getCacheKey(query);
      const cached = cacheRef.current.get(cacheKey);

      if (isCacheValid(cached)) {
        setSuggestions(cached!.suggestions);
        setIsLoading(false);
        return;
      }

      // Set loading state
      setIsLoading(true);
      setError(null);

      // Debounce the search
      debounceRef.current = setTimeout(() => {
        try {
          // Double check query hasn't changed during debounce
          if (lastQueryRef.current !== query) {
            return;
          }

          const results = performSearch(query);

          // Cache results
          cacheRef.current.set(cacheKey, {
            suggestions: results,
            timestamp: Date.now(),
          });

          // Update state
          setSuggestions(results);
          setError(null);
        } catch (err) {
          setError(err instanceof Error ? err : new Error('Search failed'));
          setSuggestions([]);
        } finally {
          setIsLoading(false);
        }
      }, debounceMs);
    },
    [enabled, getCacheKey, isCacheValid, performSearch, debounceMs]
  );

  /**
   * Clear suggestions
   */
  const clearSuggestions = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    setSuggestions([]);
    setIsLoading(false);
    setError(null);
    lastQueryRef.current = '';
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  /**
   * Clear stale cache entries periodically
   */
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      cacheRef.current.forEach((entry, key) => {
        if (now - entry.timestamp > CACHE_TTL) {
          cacheRef.current.delete(key);
        }
      });
    }, CACHE_TTL);

    return () => clearInterval(cleanupInterval);
  }, []);

  return {
    suggestions,
    isLoading,
    error,
    search,
    clearSuggestions,
  };
}

export default usePCDTSuggestions;
