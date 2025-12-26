/**
 * PCDTEmptyState Component
 * Contextual empty state for PCDT search
 *
 * Features:
 * - Initial state with search suggestions
 * - No results state with alternative queries
 * - Quick links to popular terms
 * - PCDT-specific examples
 */

'use client';

import React, { useCallback, useMemo } from 'react';
import {
  Search,
  Pill,
  AlertTriangle,
  Activity,
  Link,
  Users,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';
import { pcdtTermService } from '@/services/pcdtTermService';
import type { QuickLink, PCDTFilterCategory } from './PCDTSearchTypes';

// Icon mapping
const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Pill,
  AlertTriangle,
  Activity,
  Link,
  Users,
};

// Default quick links with PCDT examples
const DEFAULT_QUICK_LINKS: QuickLink[] = [
  {
    label: 'Dosagem rifampicina adulto',
    query: 'dosagem rifampicina adulto',
    category: 'dose',
    icon: 'Pill',
  },
  {
    label: 'Efeitos colaterais clofazimina',
    query: 'efeitos colaterais clofazimina',
    category: 'effect',
    icon: 'Activity',
  },
  {
    label: 'Contraindicação gestante',
    query: 'contraindicação gestante',
    category: 'contraindication',
    icon: 'AlertTriangle',
  },
  {
    label: 'Interações medicamentosas',
    query: 'interações medicamentosas',
    category: 'interaction',
    icon: 'Link',
  },
];

interface PCDTEmptyStateProps {
  type: 'initial' | 'no-results' | 'error';
  query?: string;
  onQuickSearch?: (query: string) => void;
  onFilterSelect?: (category: PCDTFilterCategory) => void;
  className?: string;
}

/**
 * Quick link button component
 */
const QuickLinkButton: React.FC<{
  link: QuickLink;
  onClick: () => void;
}> = ({ link, onClick }) => {
  const IconComponent = CATEGORY_ICONS[link.icon || 'Pill'] || Pill;

  return (
    <button
      type="button"
      onClick={onClick}
      className="
        group flex items-center gap-2 px-3 py-2 rounded-lg
        bg-white border border-gray-200
        hover:border-blue-300 hover:bg-blue-50
        dark:bg-gray-800 dark:border-gray-700
        dark:hover:border-blue-600 dark:hover:bg-blue-900/20
        transition-all duration-200
        text-left w-full
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
      "
    >
      <span className="
        p-1.5 rounded-md
        bg-gray-100 text-gray-600
        group-hover:bg-blue-100 group-hover:text-blue-600
        dark:bg-gray-700 dark:text-gray-400
        dark:group-hover:bg-blue-900/40 dark:group-hover:text-blue-400
        transition-colors duration-200
      ">
        <IconComponent className="w-4 h-4" />
      </span>
      <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">
        {link.label}
      </span>
      <ArrowRight className="
        w-4 h-4 text-gray-400
        opacity-0 group-hover:opacity-100
        transform translate-x-0 group-hover:translate-x-1
        transition-all duration-200
      " />
    </button>
  );
};

/**
 * Initial empty state - shown before user starts searching
 */
const InitialState: React.FC<{
  quickLinks: QuickLink[];
  onQuickSearch: (query: string) => void;
}> = ({ quickLinks, onQuickSearch }) => {
  return (
    <div className="text-center py-8 px-4">
      <div className="
        inline-flex items-center justify-center
        w-16 h-16 rounded-full mb-4
        bg-blue-100 text-blue-600
        dark:bg-blue-900/30 dark:text-blue-400
      ">
        <Search className="w-8 h-8" />
      </div>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        Buscar no PCDT Hanseníase
      </h3>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
        Digite para buscar informações sobre dosagens, efeitos adversos,
        contraindicações e orientações do protocolo.
      </p>

      <div className="space-y-2 max-w-sm mx-auto">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
          Sugestões de busca
        </p>
        {quickLinks.map((link, index) => (
          <QuickLinkButton
            key={index}
            link={link}
            onClick={() => onQuickSearch(link.query)}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * No results state - shown when search returns empty
 */
const NoResultsState: React.FC<{
  query: string;
  quickLinks: QuickLink[];
  onQuickSearch: (query: string) => void;
}> = ({ query, quickLinks, onQuickSearch }) => {
  // Get alternative suggestions based on partial query
  const alternativeSuggestions = useMemo(() => {
    if (!query || query.length < 2) return [];

    // Get synonyms and related terms
    const expanded = pcdtTermService.expandQueryWithSynonyms(query);
    return expanded.slice(1, 4); // Skip original query
  }, [query]);

  return (
    <div className="text-center py-8 px-4">
      <div className="
        inline-flex items-center justify-center
        w-16 h-16 rounded-full mb-4
        bg-amber-100 text-amber-600
        dark:bg-amber-900/30 dark:text-amber-400
      ">
        <HelpCircle className="w-8 h-8" />
      </div>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        Nenhum resultado para "{query}"
      </h3>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
        Tente usar termos diferentes ou verifique a ortografia.
        A busca é limitada ao protocolo PQT-U de hanseníase.
      </p>

      {alternativeSuggestions.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
            Você quis dizer?
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {alternativeSuggestions.map((alt, index) => (
              <button
                key={index}
                type="button"
                onClick={() => onQuickSearch(alt)}
                className="
                  px-3 py-1.5 rounded-full text-sm
                  bg-blue-100 text-blue-700
                  hover:bg-blue-200
                  dark:bg-blue-900/30 dark:text-blue-400
                  dark:hover:bg-blue-900/50
                  transition-colors duration-200
                "
              >
                {alt}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2 max-w-sm mx-auto">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
          Buscas populares
        </p>
        {quickLinks.slice(0, 3).map((link, index) => (
          <QuickLinkButton
            key={index}
            link={link}
            onClick={() => onQuickSearch(link.query)}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * Error state - shown when search fails
 */
const ErrorState: React.FC<{
  onRetry?: () => void;
}> = ({ onRetry }) => {
  return (
    <div className="text-center py-8 px-4">
      <div className="
        inline-flex items-center justify-center
        w-16 h-16 rounded-full mb-4
        bg-red-100 text-red-600
        dark:bg-red-900/30 dark:text-red-400
      ">
        <AlertTriangle className="w-8 h-8" />
      </div>

      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        Erro na busca
      </h3>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
        Ocorreu um erro ao processar sua busca.
        Por favor, tente novamente.
      </p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="
            px-4 py-2 rounded-lg
            bg-blue-600 text-white
            hover:bg-blue-700
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            transition-colors duration-200
          "
        >
          Tentar novamente
        </button>
      )}
    </div>
  );
};

/**
 * PCDTEmptyState - Main component
 */
export const PCDTEmptyState: React.FC<PCDTEmptyStateProps> = ({
  type,
  query = '',
  onQuickSearch,
  className = '',
}) => {
  const handleQuickSearch = useCallback(
    (searchQuery: string) => {
      onQuickSearch?.(searchQuery);
    },
    [onQuickSearch]
  );

  // Get popular terms for suggestions
  const quickLinks = useMemo(() => {
    return DEFAULT_QUICK_LINKS;
  }, []);

  return (
    <div
      className={`
        bg-white dark:bg-gray-900
        border border-gray-200 dark:border-gray-700
        rounded-lg shadow-sm
        ${className}
      `}
      role="status"
      aria-live="polite"
    >
      {type === 'initial' && (
        <InitialState
          quickLinks={quickLinks}
          onQuickSearch={handleQuickSearch}
        />
      )}

      {type === 'no-results' && (
        <NoResultsState
          query={query}
          quickLinks={quickLinks}
          onQuickSearch={handleQuickSearch}
        />
      )}

      {type === 'error' && (
        <ErrorState onRetry={() => handleQuickSearch(query)} />
      )}
    </div>
  );
};

export default PCDTEmptyState;
