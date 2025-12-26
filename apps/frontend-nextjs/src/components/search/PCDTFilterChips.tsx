/**
 * PCDTFilterChips Component
 * Medical filter chips for PCDT search
 *
 * Features:
 * - Category-based filtering with icons
 * - Active state with count badges
 * - Horizontal scrollable container
 * - Keyboard accessible
 *
 * ARIA: Uses role="group" with aria-label for filter group
 */

'use client';

import React, { useCallback, useRef } from 'react';
import {
  Pill,
  AlertTriangle,
  Activity,
  Link,
  Users,
  X,
} from 'lucide-react';
import type { PCDTFilter, PCDTFilterCategory } from './PCDTSearchTypes';

// Icon mapping for filter categories
const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Pill,
  AlertTriangle,
  Activity,
  Link,
  Users,
  Capsule: Pill, // Fallback to Pill for Capsule
};

interface PCDTFilterChipsProps {
  filters: PCDTFilter[];
  onToggle: (category: PCDTFilterCategory) => void;
  onClearAll?: () => void;
  showClearAll?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Individual filter chip component
 */
const FilterChip: React.FC<{
  filter: PCDTFilter;
  onToggle: () => void;
  size: 'sm' | 'md' | 'lg';
}> = ({ filter, onToggle, size }) => {
  const IconComponent = CATEGORY_ICONS[filter.icon] || Pill;

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs gap-1',
    md: 'px-3 py-1.5 text-sm gap-1.5',
    lg: 'px-4 py-2 text-base gap-2',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToggle();
    }
  };

  return (
    <button
      type="button"
      onClick={onToggle}
      onKeyDown={handleKeyDown}
      role="checkbox"
      aria-checked={filter.active}
      aria-label={`Filtrar por ${filter.labelPt}${filter.count ? ` (${filter.count} resultados)` : ''}`}
      className={`
        inline-flex items-center rounded-full font-medium
        transition-all duration-200 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-offset-2
        ${sizeClasses[size]}
        ${
          filter.active
            ? 'text-white shadow-md'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
        }
      `}
      style={
        filter.active
          ? { backgroundColor: filter.color, boxShadow: `0 2px 8px ${filter.color}40` }
          : undefined
      }
    >
      <IconComponent className={iconSizes[size]} />
      <span>{filter.labelPt}</span>
      {filter.count !== undefined && filter.count > 0 && (
        <span
          className={`
            ml-1 rounded-full px-1.5 py-0.5 text-xs font-semibold
            ${filter.active ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}
          `}
        >
          {filter.count}
        </span>
      )}
    </button>
  );
};

/**
 * Clear all button component
 */
const ClearAllButton: React.FC<{
  onClick: () => void;
  size: 'sm' | 'md' | 'lg';
  hasActiveFilters: boolean;
}> = ({ onClick, size, hasActiveFilters }) => {
  if (!hasActiveFilters) return null;

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Limpar todos os filtros"
      className={`
        inline-flex items-center gap-1 rounded-full
        bg-red-100 text-red-700 hover:bg-red-200
        dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50
        transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
        ${sizeClasses[size]}
      `}
    >
      <X className="w-3 h-3" />
      <span>Limpar</span>
    </button>
  );
};

/**
 * PCDTFilterChips - Horizontal scrollable filter chips
 */
export const PCDTFilterChips: React.FC<PCDTFilterChipsProps> = ({
  filters,
  onToggle,
  onClearAll,
  showClearAll = true,
  size = 'md',
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleToggle = useCallback(
    (category: PCDTFilterCategory) => {
      onToggle(category);
    },
    [onToggle]
  );

  const hasActiveFilters = filters.some(f => f.active);

  // Keyboard navigation within filter group
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!containerRef.current) return;

    const buttons = containerRef.current.querySelectorAll('button');
    const currentIndex = Array.from(buttons).findIndex(
      btn => btn === document.activeElement
    );

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % buttons.length;
      buttons[nextIndex]?.focus();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = (currentIndex - 1 + buttons.length) % buttons.length;
      buttons[prevIndex]?.focus();
    }
  };

  return (
    <div
      ref={containerRef}
      role="group"
      aria-label="Filtros de busca PCDT"
      onKeyDown={handleKeyDown}
      className={`
        flex items-center gap-2 overflow-x-auto
        scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent
        pb-1 -mb-1
        ${className}
      `}
    >
      {filters.map(filter => (
        <FilterChip
          key={filter.id}
          filter={filter}
          onToggle={() => handleToggle(filter.category)}
          size={size}
        />
      ))}

      {showClearAll && onClearAll && (
        <ClearAllButton
          onClick={onClearAll}
          size={size}
          hasActiveFilters={hasActiveFilters}
        />
      )}
    </div>
  );
};

export default PCDTFilterChips;
