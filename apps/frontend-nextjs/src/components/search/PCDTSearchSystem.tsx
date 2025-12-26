/**
 * PCDTSearchSystem Component
 * Main reusable PCDT search component with three variants
 *
 * Variants:
 * - header: Compact search for navigation bar
 * - chat: Suggestions for chat integration
 * - page: Full-featured search page
 *
 * ARIA Compliance:
 * - Combobox pattern with aria-expanded, aria-controls, aria-activedescendant
 * - Live region announcements for results
 * - Full keyboard navigation
 */

'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Search, X, Mic, MicOff, Loader2 } from 'lucide-react';
import { usePCDTSearch } from './hooks/usePCDTSearch';
import { PCDTFilterChips } from './PCDTFilterChips';
import { PCDTSuggestionList, type PCDTSuggestionListRef } from './PCDTSuggestionList';
import { PCDTEmptyState } from './PCDTEmptyState';
import { PCDTResultItem } from './PCDTResultItem';
import type {
  PCDTSearchSystemProps,
  PCDTSuggestion,
  PCDTSearchResult,
} from './PCDTSearchTypes';

/**
 * PCDTSearchSystem - Main component
 */
export const PCDTSearchSystem: React.FC<PCDTSearchSystemProps> = ({
  variant = 'page',
  enableFilterChips = true,
  enableVoiceSearch = false,
  enableKeyboardNav = true,
  enableRecentSearches = false,
  useBackendSuggestions = false,
  useLocalData = true,
  maxSuggestions,
  maxResults,
  onSearch,
  onSuggestionSelect,
  onResultSelect,
  onFilterChange,
  personaContext,
  className = '',
  placeholder,
}) => {
  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<PCDTSuggestionListRef>(null);

  // Local state
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isListening, setIsListening] = useState(false);

  // Use the main search hook
  const {
    query,
    setQuery,
    results,
    suggestions,
    filters,
    activeFilters,
    toggleFilter,
    filterCounts,
    hasActiveFilters,
    isLoading,
    isEmpty,
    hasNoResults,
    error,
    search,
    selectSuggestion,
    clearAll,
    clearSuggestions,
    clearFilters,
  } = usePCDTSearch({
    variant,
    maxSuggestions,
    maxResults,
    syncWithUrl: variant === 'page',
    useBackend: useBackendSuggestions,
    onSearch,
    onResultSelect,
  });

  // Placeholder text based on variant
  const placeholderText = placeholder || (
    variant === 'header'
      ? 'Buscar no PCDT...'
      : variant === 'chat'
      ? 'Digite para sugestões...'
      : 'Buscar dosagens, efeitos, contraindicações...'
  );

  /**
   * Handle input change
   */
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setQuery(value);
      setIsOpen(value.length >= 2);
      setActiveIndex(-1);
    },
    [setQuery]
  );

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (query.length >= 2) {
        search(query);
        setIsOpen(false);
        onSearch?.(query, filters);
      }
    },
    [query, search, filters, onSearch]
  );

  /**
   * Handle suggestion selection
   */
  const handleSuggestionSelect = useCallback(
    (suggestion: PCDTSuggestion) => {
      selectSuggestion(suggestion);
      setIsOpen(false);
      setActiveIndex(-1);
      onSuggestionSelect?.(suggestion);
    },
    [selectSuggestion, onSuggestionSelect]
  );

  /**
   * Handle result click
   */
  const handleResultClick = useCallback(
    (result: PCDTSearchResult) => {
      onResultSelect?.(result);
    },
    [onResultSelect]
  );

  /**
   * Handle quick search from empty state
   */
  const handleQuickSearch = useCallback(
    (searchQuery: string) => {
      setQuery(searchQuery);
      search(searchQuery);
      inputRef.current?.focus();
    },
    [setQuery, search]
  );

  /**
   * Clear input
   */
  const handleClear = useCallback(() => {
    clearAll();
    setIsOpen(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  }, [clearAll]);

  /**
   * Handle keyboard navigation
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!enableKeyboardNav) return;

      const suggestionCount = suggestions.length;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (!isOpen && query.length >= 2) {
            setIsOpen(true);
          }
          setActiveIndex(prev =>
            prev < suggestionCount - 1 ? prev + 1 : 0
          );
          break;

        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex(prev =>
            prev > 0 ? prev - 1 : suggestionCount - 1
          );
          break;

        case 'Enter':
          e.preventDefault();
          if (activeIndex >= 0 && activeIndex < suggestionCount) {
            handleSuggestionSelect(suggestions[activeIndex]);
          } else if (query.length >= 2) {
            handleSubmit(e);
          }
          break;

        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          setActiveIndex(-1);
          inputRef.current?.blur();
          break;

        case 'Tab':
          setIsOpen(false);
          break;
      }
    },
    [
      enableKeyboardNav,
      isOpen,
      query,
      suggestions,
      activeIndex,
      handleSuggestionSelect,
      handleSubmit,
    ]
  );

  /**
   * Handle click outside to close
   */
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * Focus item when active index changes
   */
  useEffect(() => {
    if (activeIndex >= 0) {
      suggestionsRef.current?.focusItem(activeIndex);
    }
  }, [activeIndex]);

  // Get aria-activedescendant value
  const activeDescendant = suggestionsRef.current?.getActiveDescendantId();

  // Variant-specific classes
  const variantClasses = {
    header: 'max-w-md',
    chat: 'max-w-full',
    page: 'max-w-2xl mx-auto',
  };

  return (
    <div
      ref={containerRef}
      className={`relative ${variantClasses[variant]} ${className}`}
    >
      {/* Search Form */}
      <form onSubmit={handleSubmit} role="search">
        <div className="relative">
          {/* Search Input */}
          <div className="relative flex items-center">
            {/* Search Icon */}
            <div className="absolute left-3 text-gray-400 pointer-events-none">
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
            </div>

            {/* Input */}
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => query.length >= 2 && setIsOpen(true)}
              placeholder={placeholderText}
              role="combobox"
              aria-expanded={isOpen}
              aria-controls="pcdt-suggestions"
              aria-activedescendant={activeDescendant}
              aria-autocomplete="list"
              aria-haspopup="listbox"
              aria-label="Buscar no PCDT"
              className={`
                w-full pl-10 pr-20 py-3
                bg-white dark:bg-gray-900
                border border-gray-300 dark:border-gray-700
                rounded-lg
                text-gray-900 dark:text-gray-100
                placeholder-gray-500 dark:placeholder-gray-400
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                transition-all duration-200
                ${variant === 'header' ? 'py-2 text-sm' : ''}
              `}
            />

            {/* Action buttons */}
            <div className="absolute right-2 flex items-center gap-1">
              {/* Voice search button */}
              {enableVoiceSearch && (
                <button
                  type="button"
                  onClick={() => setIsListening(!isListening)}
                  aria-label={isListening ? 'Parar gravação' : 'Busca por voz'}
                  className={`
                    p-1.5 rounded-md transition-colors
                    ${isListening
                      ? 'text-red-500 bg-red-100 dark:bg-red-900/30'
                      : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }
                  `}
                >
                  {isListening ? (
                    <MicOff className="w-4 h-4" />
                  ) : (
                    <Mic className="w-4 h-4" />
                  )}
                </button>
              )}

              {/* Clear button */}
              {query && (
                <button
                  type="button"
                  onClick={handleClear}
                  aria-label="Limpar busca"
                  className="
                    p-1.5 rounded-md
                    text-gray-400 hover:text-gray-600
                    hover:bg-gray-100 dark:hover:bg-gray-800
                    transition-colors
                  "
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </form>

      {/* Filter Chips - only for page variant */}
      {enableFilterChips && variant === 'page' && (
        <div className="mt-3">
          <PCDTFilterChips
            filters={activeFilters}
            onToggle={toggleFilter}
            onClearAll={clearFilters}
            showClearAll={hasActiveFilters}
            size="md"
          />
        </div>
      )}

      {/* Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1">
          <PCDTSuggestionList
            ref={suggestionsRef}
            suggestions={suggestions}
            isLoading={isLoading}
            activeIndex={activeIndex}
            onSelect={handleSuggestionSelect}
            onActiveIndexChange={setActiveIndex}
            query={query}
            id="pcdt-suggestions"
          />
        </div>
      )}

      {/* Results - only for page variant */}
      {variant === 'page' && (
        <div className="mt-6">
          {/* Loading state */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          )}

          {/* Empty state */}
          {!isLoading && isEmpty && (
            <PCDTEmptyState
              type="initial"
              onQuickSearch={handleQuickSearch}
            />
          )}

          {/* No results state */}
          {!isLoading && hasNoResults && (
            <PCDTEmptyState
              type="no-results"
              query={query}
              onQuickSearch={handleQuickSearch}
            />
          )}

          {/* Error state */}
          {error && (
            <PCDTEmptyState
              type="error"
              query={query}
              onQuickSearch={handleQuickSearch}
            />
          )}

          {/* Results list */}
          {!isLoading && results.length > 0 && (
            <div className="space-y-4">
              {/* Results count */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {results.length} resultado{results.length !== 1 ? 's' : ''} para "{query}"
                </p>
              </div>

              {/* Results */}
              {results.map(result => (
                <PCDTResultItem
                  key={result.id}
                  result={result}
                  onClick={() => handleResultClick(result)}
                  showRelevance
                  showSource
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Screen reader announcements */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {isLoading && 'Buscando...'}
        {!isLoading && suggestions.length > 0 && `${suggestions.length} sugestões disponíveis`}
        {!isLoading && results.length > 0 && `${results.length} resultados encontrados`}
        {hasNoResults && 'Nenhum resultado encontrado'}
      </div>
    </div>
  );
};

export default PCDTSearchSystem;
