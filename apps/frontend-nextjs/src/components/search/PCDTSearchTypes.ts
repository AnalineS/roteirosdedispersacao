/**
 * PCDT Search System Types
 * Type definitions for PCDT-aware search with medical taxonomy
 */

// Filter categories based on clinical_taxonomy.json domains
export type PCDTFilterCategory =
  | 'dose'            // CP - Clinical Protocols (dosing_regimens)
  | 'contraindication' // PH - Pharmacology (contraindications)
  | 'effect'          // SM - Safety Monitoring (adverse_events)
  | 'interaction'     // PH - Pharmacology (drug_interactions)
  | 'population'      // CP - Clinical Protocols (special_populations)
  | 'medication'      // Level 3 - medication_specific
  | 'protocol'        // DW - Dispensing Workflow
  | 'education';      // PE - Patient Education

// Medication types from clinical_taxonomy
export type MedicationType = 'rifampicina' | 'clofazimina' | 'dapsona';

// Population types from clinical_taxonomy
export type PopulationType =
  | 'adult_over_50kg'
  | 'weight_30_50kg'
  | 'pediatric_under_30kg'
  | 'pregnancy'
  | 'breastfeeding';

// Domain codes from clinical_taxonomy
export type DomainCode = 'CP' | 'PH' | 'DW' | 'SM' | 'PE' | 'RF';

// Suggestion data source
export type SuggestionSource =
  | 'taxonomy'          // clinical_taxonomy.json
  | 'protocol'          // dosing_protocols.json
  | 'pharmacovigilance' // pharmacovigilance_guidelines.json
  | 'mechanism';        // medications_mechanisms.json

// Single suggestion item
export interface PCDTSuggestion {
  id: string;
  term: string;
  category: PCDTFilterCategory;
  synonyms: string[];
  keywords: string[];
  source: SuggestionSource;
  domainCode?: DomainCode;
  medication?: MedicationType;
  population?: PopulationType;
  weight: number;
  complexity: 'simple' | 'standard' | 'complex';
}

// Filter chip configuration
export interface PCDTFilter {
  id: string;
  label: string;
  labelPt: string;
  category: PCDTFilterCategory;
  icon: string;
  color: string;
  active: boolean;
  count?: number;
}

// Active filters state
export interface PCDTFiltersState {
  categories: PCDTFilterCategory[];
  medications: MedicationType[];
  populations: PopulationType[];
  searchQuery: string;
}

// Search result item
export interface PCDTSearchResult {
  id: string;
  title: string;
  snippet: string;
  highlightedTitle: string;
  highlightedSnippet: string;
  category: PCDTFilterCategory;
  domainCode: DomainCode;
  medication?: MedicationType;
  population?: PopulationType;
  relevanceScore: number;
  source: SuggestionSource;
  url?: string;
  keywords: string[];
}

// Empty state configuration
export interface PCDTEmptyStateConfig {
  type: 'initial' | 'no-results' | 'error';
  suggestions: PCDTSuggestion[];
  quickLinks: QuickLink[];
}

export interface QuickLink {
  label: string;
  query: string;
  category: PCDTFilterCategory;
  icon?: string;
}

// Component variant props
export type PCDTSearchVariant = 'header' | 'chat' | 'page';

// Main component props
export interface PCDTSearchSystemProps {
  // Display variant
  variant: PCDTSearchVariant;

  // Feature flags
  enableFilterChips?: boolean;
  enableVoiceSearch?: boolean;
  enableKeyboardNav?: boolean;
  enableRecentSearches?: boolean;

  // Data options
  useBackendSuggestions?: boolean;
  useLocalData?: boolean;

  // Limits
  maxSuggestions?: number;
  maxResults?: number;

  // Callbacks
  onSearch?: (query: string, filters: PCDTFiltersState) => void;
  onSuggestionSelect?: (suggestion: PCDTSuggestion) => void;
  onResultSelect?: (result: PCDTSearchResult) => void;
  onFilterChange?: (filters: PCDTFiltersState) => void;

  // Integration context
  personaContext?: 'dr_gasnelio' | 'ga';

  // Styling
  className?: string;
  placeholder?: string;
}

// Hook return types
export interface UsePCDTSuggestionsReturn {
  suggestions: PCDTSuggestion[];
  isLoading: boolean;
  error: Error | null;
  search: (query: string) => void;
  clearSuggestions: () => void;
}

export interface UsePCDTFiltersReturn {
  filters: PCDTFiltersState;
  activeFilters: PCDTFilter[];
  toggleFilter: (category: PCDTFilterCategory) => void;
  setMedication: (medication: MedicationType | null) => void;
  setPopulation: (population: PopulationType | null) => void;
  clearFilters: () => void;
  filterCounts: Record<PCDTFilterCategory, number>;
  setSearchQuery: (query: string) => void;
  updateFilterCounts: (counts: Record<PCDTFilterCategory, number>) => void;
  hasActiveFilters: boolean;
}

export interface UsePCDTSearchReturn {
  query: string;
  setQuery: (query: string) => void;
  results: PCDTSearchResult[];
  suggestions: PCDTSuggestion[];
  filters: PCDTFiltersState;
  activeFilters: PCDTFilter[];
  filterCounts: Record<PCDTFilterCategory, number>;
  hasActiveFilters: boolean;
  isLoading: boolean;
  isEmpty: boolean;
  hasNoResults: boolean;
  error: Error | null;
  search: (query: string) => void;
  selectSuggestion: (suggestion: PCDTSuggestion) => void;
  toggleFilter: (category: PCDTFilterCategory) => void;
  clearAll: () => void;
  clearSuggestions: () => void;
  clearFilters: () => void;
}

// Clinical taxonomy types (for data loading)
export interface ClinicalTaxonomyData {
  clinical_taxonomy: {
    metadata: {
      version: string;
      scope: string;
    };
    level_1_domains: Record<string, DomainDefinition>;
    level_2_categories: Record<string, CategoryDefinition>;
    level_3_entities: {
      medication_specific: Record<MedicationType, MedicationDefinition>;
      population_specific: Record<string, PopulationDefinition>;
      clinical_conditions: Record<string, ConditionDefinition>;
    };
    semantic_relationships: SemanticRelationships;
    query_patterns: QueryPatterns;
  };
}

export interface DomainDefinition {
  code: DomainCode;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  subcategories: string[];
}

export interface CategoryDefinition {
  parent: string;
  entities: Record<string, EntityDefinition>;
}

export interface EntityDefinition {
  keywords: string[];
  weight: number;
  complexity: 'simple' | 'standard' | 'complex';
}

export interface MedicationDefinition {
  aliases: string[];
  dosages: string[];
  routes: string[];
  contexts: string[];
  semantic_tags: string[];
}

export interface PopulationDefinition {
  weight_range: string;
  age_range: string;
  prescribers: string[];
  complexity: 'simple' | 'standard' | 'complex';
  special_considerations?: string[];
}

export interface ConditionDefinition {
  duration?: string;
  load?: string;
  considerations?: string[];
  complexity: 'simple' | 'standard' | 'complex';
}

export interface SemanticRelationships {
  hierarchical: {
    is_a: string[];
    part_of: string[];
  };
  associative: {
    treats: string[];
    causes: string[];
    interacts_with: string[];
  };
  temporal: {
    before: string[];
    during: string[];
    after: string[];
  };
}

export interface QueryPatterns {
  dosing_queries: QueryPatternDefinition;
  safety_queries: QueryPatternDefinition;
  procedure_queries: QueryPatternDefinition;
}

export interface QueryPatternDefinition {
  patterns: string[];
  intent: string;
  priority: 'high' | 'medium' | 'low';
}

// Default filter configurations
export const DEFAULT_FILTER_CHIPS: PCDTFilter[] = [
  {
    id: 'dose',
    label: 'Dosage',
    labelPt: 'Dosagem',
    category: 'dose',
    icon: 'Pill',
    color: '#EAB308', // yellow
    active: false,
  },
  {
    id: 'contraindication',
    label: 'Contraindications',
    labelPt: 'Contraindicações',
    category: 'contraindication',
    icon: 'AlertTriangle',
    color: '#EF4444', // red
    active: false,
  },
  {
    id: 'effect',
    label: 'Side Effects',
    labelPt: 'Efeitos Adversos',
    category: 'effect',
    icon: 'Activity',
    color: '#A855F7', // purple
    active: false,
  },
  {
    id: 'interaction',
    label: 'Interactions',
    labelPt: 'Interações',
    category: 'interaction',
    icon: 'Link',
    color: '#F97316', // orange
    active: false,
  },
  {
    id: 'population',
    label: 'Populations',
    labelPt: 'Populações',
    category: 'population',
    icon: 'Users',
    color: '#3B82F6', // blue
    active: false,
  },
  {
    id: 'medication',
    label: 'Medications',
    labelPt: 'Medicamentos',
    category: 'medication',
    icon: 'Capsule',
    color: '#22C55E', // green
    active: false,
  },
];

// Example search terms for empty state
export const EXAMPLE_SEARCH_TERMS: QuickLink[] = [
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
