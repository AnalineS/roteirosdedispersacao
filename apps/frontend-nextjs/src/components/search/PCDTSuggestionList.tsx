/**
 * PCDTSuggestionList Component
 * Auto-suggestion dropdown for PCDT search
 *
 * ARIA Best Practices (React Aria / WAI-ARIA 1.2):
 * - role="listbox" on container
 * - role="option" on each item
 * - aria-activedescendant for keyboard navigation
 * - aria-selected for current selection
 */

'use client';

import React, { useCallback, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  Pill,
  AlertTriangle,
  Activity,
  Link,
  Users,
  Clock,
  TrendingUp,
} from 'lucide-react';
import type { PCDTSuggestion, PCDTFilterCategory } from './PCDTSearchTypes';

// Icon mapping for categories
const CATEGORY_ICONS: Record<PCDTFilterCategory, React.ComponentType<{ className?: string }>> = {
  dose: Pill,
  contraindication: AlertTriangle,
  effect: Activity,
  interaction: Link,
  population: Users,
  medication: Pill,
  protocol: Clock,
  education: TrendingUp,
};

// Color mapping for categories
const CATEGORY_COLORS: Record<PCDTFilterCategory, string> = {
  dose: 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30',
  contraindication: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30',
  effect: 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30',
  interaction: 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30',
  population: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30',
  medication: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30',
  protocol: 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-700',
  education: 'text-teal-600 bg-teal-100 dark:text-teal-400 dark:bg-teal-900/30',
};

// Category labels in Portuguese
const CATEGORY_LABELS: Record<PCDTFilterCategory, string> = {
  dose: 'Dosagem',
  contraindication: 'Contraindicação',
  effect: 'Efeito',
  interaction: 'Interação',
  population: 'População',
  medication: 'Medicamento',
  protocol: 'Protocolo',
  education: 'Educação',
};

interface PCDTSuggestionListProps {
  suggestions: PCDTSuggestion[];
  isLoading?: boolean;
  activeIndex?: number;
  onSelect: (suggestion: PCDTSuggestion) => void;
  onActiveIndexChange?: (index: number) => void;
  query?: string;
  id?: string;
  className?: string;
}

export interface PCDTSuggestionListRef {
  focusItem: (index: number) => void;
  getActiveDescendantId: () => string | undefined;
}

/**
 * Highlight matching text in suggestion
 */
const HighlightedText: React.FC<{
  text: string;
  query: string;
}> = ({ text, query }) => {
  if (!query || query.length < 2) {
    return <span>{text}</span>;
  }

  const words = query.toLowerCase().split(/\s+/).filter(w => w.length >= 2);
  const regex = new RegExp(`(${words.join('|')})`, 'gi');
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, index) => {
        const isMatch = words.some(w => part.toLowerCase() === w);
        return isMatch ? (
          <mark
            key={index}
            className="bg-yellow-200 dark:bg-yellow-700 text-inherit rounded px-0.5"
          >
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        );
      })}
    </span>
  );
};

/**
 * Individual suggestion item
 */
const SuggestionItem: React.FC<{
  suggestion: PCDTSuggestion;
  index: number;
  isActive: boolean;
  query: string;
  onSelect: () => void;
  onMouseEnter: () => void;
  id: string;
}> = ({ suggestion, index, isActive, query, onSelect, onMouseEnter, id }) => {
  const IconComponent = CATEGORY_ICONS[suggestion.category] || Pill;
  const colorClass = CATEGORY_COLORS[suggestion.category] || CATEGORY_COLORS.protocol;
  const categoryLabel = CATEGORY_LABELS[suggestion.category] || 'Geral';

  return (
    <li
      id={id}
      role="option"
      aria-selected={isActive}
      onClick={onSelect}
      onMouseEnter={onMouseEnter}
      className={`
        flex items-center gap-3 px-3 py-2.5 cursor-pointer
        transition-colors duration-150
        ${isActive
          ? 'bg-blue-50 dark:bg-blue-900/30'
          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
        }
      `}
    >
      {/* Category Icon */}
      <span className={`p-1.5 rounded-md flex-shrink-0 ${colorClass}`}>
        <IconComponent className="w-4 h-4" />
      </span>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 dark:text-gray-100 truncate">
            <HighlightedText text={suggestion.term} query={query} />
          </span>

          {/* Synonyms badge */}
          {suggestion.synonyms.length > 0 && (
            <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
              ({suggestion.synonyms[0]})
            </span>
          )}
        </div>

        {/* Keywords preview */}
        {suggestion.keywords.length > 0 && (
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
            {suggestion.keywords.slice(0, 3).join(' • ')}
          </p>
        )}
      </div>

      {/* Category Label */}
      <span className={`
        text-xs px-2 py-0.5 rounded-full flex-shrink-0
        ${colorClass}
      `}>
        {categoryLabel}
      </span>
    </li>
  );
};

/**
 * Loading skeleton
 */
const LoadingSkeleton: React.FC = () => (
  <div className="p-3 space-y-3">
    {[1, 2, 3].map(i => (
      <div key={i} className="flex items-center gap-3 animate-pulse">
        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-md" />
        <div className="flex-1 space-y-1">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2" />
        </div>
        <div className="w-16 h-5 bg-gray-100 dark:bg-gray-800 rounded-full" />
      </div>
    ))}
  </div>
);

/**
 * PCDTSuggestionList - Main component
 */
export const PCDTSuggestionList = forwardRef<PCDTSuggestionListRef, PCDTSuggestionListProps>(
  (
    {
      suggestions,
      isLoading = false,
      activeIndex = -1,
      onSelect,
      onActiveIndexChange,
      query = '',
      id = 'pcdt-suggestions',
      className = '',
    },
    ref
  ) => {
    const listRef = useRef<HTMLUListElement>(null);
    const itemRefs = useRef<Map<number, HTMLLIElement>>(new Map());

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      focusItem: (index: number) => {
        const item = itemRefs.current.get(index);
        if (item) {
          item.scrollIntoView({ block: 'nearest' });
        }
      },
      getActiveDescendantId: () => {
        if (activeIndex >= 0 && activeIndex < suggestions.length) {
          return `${id}-option-${activeIndex}`;
        }
        return undefined;
      },
    }));

    // Scroll active item into view
    useEffect(() => {
      if (activeIndex >= 0) {
        const item = listRef.current?.children[activeIndex] as HTMLElement;
        item?.scrollIntoView({ block: 'nearest' });
      }
    }, [activeIndex]);

    const handleSelect = useCallback(
      (suggestion: PCDTSuggestion) => {
        onSelect(suggestion);
      },
      [onSelect]
    );

    const handleMouseEnter = useCallback(
      (index: number) => {
        onActiveIndexChange?.(index);
      },
      [onActiveIndexChange]
    );

    // Don't render if no suggestions and not loading
    if (!isLoading && suggestions.length === 0) {
      return null;
    }

    return (
      <div
        className={`
          bg-white dark:bg-gray-900
          border border-gray-200 dark:border-gray-700
          rounded-lg shadow-lg
          overflow-hidden
          ${className}
        `}
      >
        {isLoading ? (
          <LoadingSkeleton />
        ) : (
          <>
            {/* Results count - screen reader only */}
            <div className="sr-only" role="status" aria-live="polite">
              {suggestions.length} sugestões encontradas
            </div>

            <ul
              ref={listRef}
              id={id}
              role="listbox"
              aria-label="Sugestões de busca"
              className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800"
            >
              {suggestions.map((suggestion, index) => (
                <SuggestionItem
                  key={suggestion.id}
                  suggestion={suggestion}
                  index={index}
                  isActive={index === activeIndex}
                  query={query}
                  onSelect={() => handleSelect(suggestion)}
                  onMouseEnter={() => handleMouseEnter(index)}
                  id={`${id}-option-${index}`}
                />
              ))}
            </ul>

            {/* Keyboard hint */}
            <div className="
              px-3 py-2 border-t border-gray-100 dark:border-gray-800
              text-xs text-gray-500 dark:text-gray-400
              flex items-center gap-4
            ">
              <span>
                <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">↑↓</kbd>
                {' '}para navegar
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">Enter</kbd>
                {' '}para selecionar
              </span>
              <span>
                <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">Esc</kbd>
                {' '}para fechar
              </span>
            </div>
          </>
        )}
      </div>
    );
  }
);

PCDTSuggestionList.displayName = 'PCDTSuggestionList';

export default PCDTSuggestionList;
