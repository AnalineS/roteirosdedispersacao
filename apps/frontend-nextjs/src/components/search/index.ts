/**
 * PCDT Search Components
 * Export all search-related components and types
 */

// Main component
export { PCDTSearchSystem } from './PCDTSearchSystem';

// Sub-components
export { PCDTFilterChips } from './PCDTFilterChips';
export { PCDTEmptyState } from './PCDTEmptyState';
export { PCDTSuggestionList } from './PCDTSuggestionList';
export { PCDTResultItem } from './PCDTResultItem';

// Hooks
export { usePCDTSearch, usePCDTSuggestions, usePCDTFilters } from './hooks';

// Types
export type {
  PCDTSearchSystemProps,
  PCDTSuggestion,
  PCDTSearchResult,
  PCDTFilter,
  PCDTFiltersState,
  PCDTFilterCategory,
  MedicationType,
  PopulationType,
  PCDTSearchVariant,
  UsePCDTSearchReturn,
  UsePCDTSuggestionsReturn,
  UsePCDTFiltersReturn,
} from './PCDTSearchTypes';

// Constants
export {
  DEFAULT_FILTER_CHIPS,
  EXAMPLE_SEARCH_TERMS,
} from './PCDTSearchTypes';
