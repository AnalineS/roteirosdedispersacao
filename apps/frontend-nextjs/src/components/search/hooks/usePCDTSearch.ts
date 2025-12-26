/**
 * usePCDTSearch Hook
 * Main search hook combining suggestions, filters, and results
 *
 * Features:
 * - Unified search interface
 * - Combines usePCDTSuggestions and usePCDTFilters
 * - RAG backend integration (optional)
 * - Result ranking and highlighting
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { usePCDTSuggestions } from './usePCDTSuggestions';
import { usePCDTFilters } from './usePCDTFilters';
import { pcdtTermService } from '@/services/pcdtTermService';
import type {
  PCDTSuggestion,
  PCDTSearchResult,
  PCDTFiltersState,
  PCDTFilterCategory,
  UsePCDTSearchReturn,
  PCDTSearchVariant,
} from '../PCDTSearchTypes';

interface UsePCDTSearchOptions {
  variant?: PCDTSearchVariant;
  maxSuggestions?: number;
  maxResults?: number;
  syncWithUrl?: boolean;
  useBackend?: boolean;
  onSearch?: (query: string, filters: PCDTFiltersState) => void;
  onResultSelect?: (result: PCDTSearchResult) => void;
}

// Variant-specific configurations
const VARIANT_CONFIG: Record<PCDTSearchVariant, { maxSuggestions: number; maxResults: number }> = {
  header: { maxSuggestions: 5, maxResults: 5 },
  chat: { maxSuggestions: 4, maxResults: 0 },
  page: { maxSuggestions: 8, maxResults: 20 },
};

/**
 * Convert suggestion to search result format
 */
function suggestionToResult(
  suggestion: PCDTSuggestion,
  query: string,
  index: number
): PCDTSearchResult {
  // Create highlighted version
  const highlightTerm = (text: string, searchQuery: string): string => {
    if (!searchQuery || searchQuery.length < 2) return text;

    const words = searchQuery.toLowerCase().split(/\s+/).filter(w => w.length >= 2);
    let highlighted = text;

    words.forEach(word => {
      const regex = new RegExp(`(${word})`, 'gi');
      highlighted = highlighted.replace(regex, '<mark>$1</mark>');
    });

    return highlighted;
  };

  // Build snippet from keywords
  const snippet = suggestion.keywords.slice(0, 3).join(' • ');

  return {
    id: suggestion.id,
    title: suggestion.term,
    snippet,
    highlightedTitle: highlightTerm(suggestion.term, query),
    highlightedSnippet: highlightTerm(snippet, query),
    category: suggestion.category,
    domainCode: suggestion.domainCode || 'CP',
    medication: suggestion.medication,
    population: suggestion.population,
    relevanceScore: suggestion.weight * (1 - index * 0.05), // Decay by position
    source: suggestion.source,
    keywords: suggestion.keywords,
  };
}

/**
 * Main PCDT search hook
 */
export function usePCDTSearch(options: UsePCDTSearchOptions = {}): UsePCDTSearchReturn {
  const {
    variant = 'page',
    maxSuggestions: customMaxSuggestions,
    maxResults: customMaxResults,
    syncWithUrl = false,
    useBackend = false,
    onSearch,
    onResultSelect,
  } = options;

  // Get variant-specific config
  const config = VARIANT_CONFIG[variant];
  const maxSuggestions = customMaxSuggestions ?? config.maxSuggestions;
  const maxResults = customMaxResults ?? config.maxResults;

  // State
  const [query, setQueryState] = useState('');
  const [results, setResults] = useState<PCDTSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Use child hooks
  const {
    suggestions,
    isLoading: isSuggestionsLoading,
    error: suggestionsError,
    search: searchSuggestions,
    clearSuggestions,
  } = usePCDTSuggestions({
    maxResults: maxSuggestions,
    enabled: true,
  });

  const {
    filters,
    activeFilters,
    toggleFilter,
    clearFilters,
    filterCounts,
    setSearchQuery,
    updateFilterCounts,
    hasActiveFilters,
  } = usePCDTFilters({
    syncWithUrl,
    onChange: (newFilters) => {
      // Re-search when filters change
      if (query) {
        performSearch(query, newFilters);
      }
    },
  });

  /**
   * Perform full search with results
   */
  const performSearch = useCallback(
    async (searchQuery: string, currentFilters?: PCDTFiltersState) => {
      const filtersToUse = currentFilters || filters;

      if (!searchQuery || searchQuery.length < 2) {
        setResults([]);
        return;
      }

      setIsSearching(true);

      try {
        // Get suggestions with filters applied
        const searchResults = pcdtTermService.searchTerms(searchQuery, {
          maxResults: maxResults,
          categories: filtersToUse.categories.length > 0 ? filtersToUse.categories : undefined,
          medications: filtersToUse.medications.length > 0 ? filtersToUse.medications : undefined,
        });

        // Convert to results format
        const formattedResults = searchResults.map((suggestion, index) =>
          suggestionToResult(suggestion, searchQuery, index)
        );

        setResults(formattedResults);

        // Calculate filter counts
        const counts: Record<PCDTFilterCategory, number> = {
          dose: 0,
          contraindication: 0,
          effect: 0,
          interaction: 0,
          population: 0,
          medication: 0,
          protocol: 0,
          education: 0,
        };

        searchResults.forEach(result => {
          if (counts[result.category] !== undefined) {
            counts[result.category]++;
          }
        });

        updateFilterCounts(counts);

        // Trigger callback
        onSearch?.(searchQuery, filtersToUse);
      } catch (error) {
        console.error('[usePCDTSearch] Search error:', error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    },
    [filters, maxResults, onSearch, updateFilterCounts]
  );

  /**
   * Set query and trigger search
   */
  const setQuery = useCallback(
    (newQuery: string) => {
      setQueryState(newQuery);
      setSearchQuery(newQuery);
      searchSuggestions(newQuery);

      // For page variant, also perform full search
      if (variant === 'page' && newQuery.length >= 2) {
        performSearch(newQuery);
      }
    },
    [variant, searchSuggestions, setSearchQuery, performSearch]
  );

  /**
   * Handle search submission
   */
  const search = useCallback(
    (searchQuery: string) => {
      setQueryState(searchQuery);
      setSearchQuery(searchQuery);
      clearSuggestions();
      performSearch(searchQuery);
    },
    [setSearchQuery, clearSuggestions, performSearch]
  );

  /**
   * Select a suggestion
   */
  const selectSuggestion = useCallback(
    (suggestion: PCDTSuggestion) => {
      setQueryState(suggestion.term);
      setSearchQuery(suggestion.term);
      clearSuggestions();

      // Convert to result and trigger callback
      const result = suggestionToResult(suggestion, suggestion.term, 0);
      onResultSelect?.(result);

      // Perform search with selected term
      if (variant === 'page') {
        performSearch(suggestion.term);
      }
    },
    [variant, setSearchQuery, clearSuggestions, onResultSelect, performSearch]
  );

  /**
   * Clear all search state
   */
  const clearAll = useCallback(() => {
    setQueryState('');
    setResults([]);
    clearSuggestions();
    clearFilters();
  }, [clearSuggestions, clearFilters]);

  /**
   * Check if search is empty (no query and no results)
   */
  const isEmpty = useMemo(() => {
    return query.length < 2 && results.length === 0 && suggestions.length === 0;
  }, [query, results, suggestions]);

  /**
   * Check if there are no results for current query
   */
  const hasNoResults = useMemo(() => {
    return query.length >= 2 && results.length === 0 && !isSearching && !isSuggestionsLoading;
  }, [query, results, isSearching, isSuggestionsLoading]);

  /**
   * Combined loading state
   */
  const isLoading = isSearching || isSuggestionsLoading;

  /**
   * Combined error state
   */
  const error = suggestionsError;

  return {
    // Query state
    query,
    setQuery,

    // Results
    results,
    suggestions,

    // Filters
    filters,
    activeFilters,
    toggleFilter,
    filterCounts,
    hasActiveFilters,

    // Status
    isLoading,
    isEmpty,
    hasNoResults,
    error,

    // Actions
    search,
    selectSuggestion,
    clearAll,
    clearSuggestions,
    clearFilters,
  };
}

export default usePCDTSearch;
