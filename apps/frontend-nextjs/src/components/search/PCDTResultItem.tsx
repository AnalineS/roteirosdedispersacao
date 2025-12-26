/**
 * PCDTResultItem Component
 * Individual search result with highlighting and metadata
 *
 * Features:
 * - Multi-term highlighting with synonym matching
 * - Category badge and medication indicator
 * - Relevance score indicator
 * - Source attribution
 */

'use client';

import React from 'react';
import {
  Pill,
  AlertTriangle,
  Activity,
  Link as LinkIcon,
  Users,
  Clock,
  TrendingUp,
  ExternalLink,
  Star,
} from 'lucide-react';
import type { PCDTSearchResult, PCDTFilterCategory } from './PCDTSearchTypes';

// Icon mapping for categories
const CATEGORY_ICONS: Record<PCDTFilterCategory, React.ComponentType<{ className?: string }>> = {
  dose: Pill,
  contraindication: AlertTriangle,
  effect: Activity,
  interaction: LinkIcon,
  population: Users,
  medication: Pill,
  protocol: Clock,
  education: TrendingUp,
};

// Color mapping for categories
const CATEGORY_COLORS: Record<PCDTFilterCategory, { bg: string; text: string; border: string }> = {
  dose: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    text: 'text-yellow-700 dark:text-yellow-400',
    border: 'border-yellow-200 dark:border-yellow-800',
  },
  contraindication: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    text: 'text-red-700 dark:text-red-400',
    border: 'border-red-200 dark:border-red-800',
  },
  effect: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    text: 'text-purple-700 dark:text-purple-400',
    border: 'border-purple-200 dark:border-purple-800',
  },
  interaction: {
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    text: 'text-orange-700 dark:text-orange-400',
    border: 'border-orange-200 dark:border-orange-800',
  },
  population: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-700 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
  },
  medication: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    text: 'text-green-700 dark:text-green-400',
    border: 'border-green-200 dark:border-green-800',
  },
  protocol: {
    bg: 'bg-gray-50 dark:bg-gray-800',
    text: 'text-gray-700 dark:text-gray-400',
    border: 'border-gray-200 dark:border-gray-700',
  },
  education: {
    bg: 'bg-teal-50 dark:bg-teal-900/20',
    text: 'text-teal-700 dark:text-teal-400',
    border: 'border-teal-200 dark:border-teal-800',
  },
};

// Category labels in Portuguese
const CATEGORY_LABELS: Record<PCDTFilterCategory, string> = {
  dose: 'Dosagem',
  contraindication: 'Contraindicação',
  effect: 'Efeito Adverso',
  interaction: 'Interação',
  population: 'População',
  medication: 'Medicamento',
  protocol: 'Protocolo',
  education: 'Educação',
};

// Source labels
const SOURCE_LABELS: Record<string, string> = {
  taxonomy: 'Taxonomia PCDT',
  protocol: 'Protocolo Clínico',
  pharmacovigilance: 'Farmacovigilância',
  mechanism: 'Farmacologia',
};

interface PCDTResultItemProps {
  result: PCDTSearchResult;
  onClick?: () => void;
  showRelevance?: boolean;
  showSource?: boolean;
  className?: string;
}

/**
 * Relevance indicator component
 */
const RelevanceIndicator: React.FC<{ score: number }> = ({ score }) => {
  const percentage = Math.round(score * 100);
  const stars = Math.round(score * 5);

  return (
    <div
      className="flex items-center gap-1"
      title={`Relevância: ${percentage}%`}
      aria-label={`Relevância ${percentage} por cento`}
    >
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`w-3 h-3 ${
            i <= stars
              ? 'text-yellow-400 fill-yellow-400'
              : 'text-gray-300 dark:text-gray-600'
          }`}
        />
      ))}
    </div>
  );
};

/**
 * Medication badge component
 */
const MedicationBadge: React.FC<{ medication: string }> = ({ medication }) => {
  const colors: Record<string, string> = {
    rifampicina: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    clofazimina: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    dapsona: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
        ${colors[medication] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'}
      `}
    >
      <Pill className="w-3 h-3" />
      {medication.charAt(0).toUpperCase() + medication.slice(1)}
    </span>
  );
};

/**
 * PCDTResultItem - Main component
 */
export const PCDTResultItem: React.FC<PCDTResultItemProps> = ({
  result,
  onClick,
  showRelevance = true,
  showSource = true,
  className = '',
}) => {
  const IconComponent = CATEGORY_ICONS[result.category] || Pill;
  const colors = CATEGORY_COLORS[result.category] || CATEGORY_COLORS.protocol;
  const categoryLabel = CATEGORY_LABELS[result.category] || 'Geral';
  const sourceLabel = SOURCE_LABELS[result.source] || result.source;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <article
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`
        group relative
        bg-white dark:bg-gray-900
        border ${colors.border}
        rounded-lg p-4
        transition-all duration-200
        ${onClick ? 'cursor-pointer hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600' : ''}
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${className}
      `}
      aria-label={`Resultado: ${result.title}`}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-2">
        {/* Category Icon */}
        <span className={`p-2 rounded-lg flex-shrink-0 ${colors.bg} ${colors.text}`}>
          <IconComponent className="w-5 h-5" />
        </span>

        {/* Title and badges */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h3
              className="font-semibold text-gray-900 dark:text-gray-100"
              dangerouslySetInnerHTML={{ __html: result.highlightedTitle }}
            />

            {/* Category badge */}
            <span className={`
              px-2 py-0.5 rounded-full text-xs font-medium
              ${colors.bg} ${colors.text}
            `}>
              {categoryLabel}
            </span>

            {/* Medication badge */}
            {result.medication && (
              <MedicationBadge medication={result.medication} />
            )}
          </div>

          {/* Snippet */}
          <p
            className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2"
            dangerouslySetInnerHTML={{ __html: result.highlightedSnippet }}
          />
        </div>

        {/* External link indicator */}
        {result.url && onClick && (
          <ExternalLink className="
            w-4 h-4 text-gray-400
            opacity-0 group-hover:opacity-100
            transition-opacity duration-200
            flex-shrink-0
          " />
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
        {/* Keywords */}
        <div className="flex items-center gap-2 flex-wrap">
          {result.keywords.slice(0, 3).map((keyword, index) => (
            <span
              key={index}
              className="
                px-2 py-0.5 rounded text-xs
                bg-gray-100 text-gray-600
                dark:bg-gray-800 dark:text-gray-400
              "
            >
              {keyword}
            </span>
          ))}
        </div>

        {/* Meta info */}
        <div className="flex items-center gap-4">
          {/* Source */}
          {showSource && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {sourceLabel}
            </span>
          )}

          {/* Relevance */}
          {showRelevance && (
            <RelevanceIndicator score={result.relevanceScore} />
          )}
        </div>
      </div>
    </article>
  );
};

export default PCDTResultItem;
