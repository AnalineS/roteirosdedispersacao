/**
 * usePCDTFilters Hook
 * Manages filter state for PCDT search with URL sync support
 *
 * Features:
 * - Multi-select category filters
 * - Medication and population filters
 * - URL query parameter sync (optional)
 * - Filter counts from search results
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import type {
  PCDTFilter,
  PCDTFilterCategory,
  PCDTFiltersState,
  MedicationType,
  PopulationType,
  UsePCDTFiltersReturn,
  DEFAULT_FILTER_CHIPS,
} from '../PCDTSearchTypes';

// Re-import the default filter chips
const FILTER_CHIPS: PCDTFilter[] = [
  {
    id: 'dose',
    label: 'Dosage',
    labelPt: 'Dosagem',
    category: 'dose',
    icon: 'Pill',
    color: '#EAB308',
    active: false,
  },
  {
    id: 'contraindication',
    label: 'Contraindications',
    labelPt: 'Contraindicações',
    category: 'contraindication',
    icon: 'AlertTriangle',
    color: '#EF4444',
    active: false,
  },
  {
    id: 'effect',
    label: 'Side Effects',
    labelPt: 'Efeitos Adversos',
    category: 'effect',
    icon: 'Activity',
    color: '#A855F7',
    active: false,
  },
  {
    id: 'interaction',
    label: 'Interactions',
    labelPt: 'Interações',
    category: 'interaction',
    icon: 'Link',
    color: '#F97316',
    active: false,
  },
  {
    id: 'population',
    label: 'Populations',
    labelPt: 'Populações',
    category: 'population',
    icon: 'Users',
    color: '#3B82F6',
    active: false,
  },
  {
    id: 'medication',
    label: 'Medications',
    labelPt: 'Medicamentos',
    category: 'medication',
    icon: 'Capsule',
    color: '#22C55E',
    active: false,
  },
];

interface UsePCDTFiltersOptions {
  syncWithUrl?: boolean;
  defaultCategories?: PCDTFilterCategory[];
  defaultMedications?: MedicationType[];
  defaultPopulations?: PopulationType[];
  onChange?: (filters: PCDTFiltersState) => void;
}

const INITIAL_STATE: PCDTFiltersState = {
  categories: [],
  medications: [],
  populations: [],
  searchQuery: '',
};

/**
 * Hook for managing PCDT filter state
 */
export function usePCDTFilters(
  options: UsePCDTFiltersOptions = {}
): UsePCDTFiltersReturn {
  const {
    syncWithUrl = false,
    defaultCategories = [],
    defaultMedications = [],
    defaultPopulations = [],
    onChange,
  } = options;

  // URL sync hooks (only used if syncWithUrl is true)
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Initialize state from URL or defaults
  const getInitialState = useCallback((): PCDTFiltersState => {
    if (syncWithUrl && searchParams) {
      const categoriesParam = searchParams.get('categories');
      const medicationsParam = searchParams.get('medications');
      const populationsParam = searchParams.get('populations');
      const queryParam = searchParams.get('q');

      return {
        categories: categoriesParam
          ? (categoriesParam.split(',') as PCDTFilterCategory[])
          : defaultCategories,
        medications: medicationsParam
          ? (medicationsParam.split(',') as MedicationType[])
          : defaultMedications,
        populations: populationsParam
          ? (populationsParam.split(',') as PopulationType[])
          : defaultPopulations,
        searchQuery: queryParam || '',
      };
    }

    return {
      ...INITIAL_STATE,
      categories: defaultCategories,
      medications: defaultMedications,
      populations: defaultPopulations,
    };
  }, [syncWithUrl, searchParams, defaultCategories, defaultMedications, defaultPopulations]);

  // State
  const [filters, setFilters] = useState<PCDTFiltersState>(getInitialState);
  const [filterCounts, setFilterCounts] = useState<Record<PCDTFilterCategory, number>>({
    dose: 0,
    contraindication: 0,
    effect: 0,
    interaction: 0,
    population: 0,
    medication: 0,
    protocol: 0,
    education: 0,
  });

  /**
   * Sync state to URL
   */
  const syncToUrl = useCallback(
    (newFilters: PCDTFiltersState) => {
      if (!syncWithUrl) return;

      const params = new URLSearchParams();

      if (newFilters.categories.length > 0) {
        params.set('categories', newFilters.categories.join(','));
      }
      if (newFilters.medications.length > 0) {
        params.set('medications', newFilters.medications.join(','));
      }
      if (newFilters.populations.length > 0) {
        params.set('populations', newFilters.populations.join(','));
      }
      if (newFilters.searchQuery) {
        params.set('q', newFilters.searchQuery);
      }

      const queryString = params.toString();
      const currentPath = pathname || '/';
      const newUrl = queryString ? `${currentPath}?${queryString}` : currentPath;

      router.replace(newUrl, { scroll: false });
    },
    [syncWithUrl, pathname, router]
  );

  /**
   * Update filters and trigger callbacks
   */
  const updateFilters = useCallback(
    (newFilters: PCDTFiltersState) => {
      setFilters(newFilters);
      syncToUrl(newFilters);
      onChange?.(newFilters);
    },
    [syncToUrl, onChange]
  );

  /**
   * Toggle a category filter
   */
  const toggleFilter = useCallback(
    (category: PCDTFilterCategory) => {
      setFilters(prev => {
        const isActive = prev.categories.includes(category);
        const newCategories = isActive
          ? prev.categories.filter(c => c !== category)
          : [...prev.categories, category];

        const newFilters = { ...prev, categories: newCategories };
        syncToUrl(newFilters);
        onChange?.(newFilters);
        return newFilters;
      });
    },
    [syncToUrl, onChange]
  );

  /**
   * Set medication filter
   */
  const setMedication = useCallback(
    (medication: MedicationType | null) => {
      setFilters(prev => {
        const newMedications = medication
          ? prev.medications.includes(medication)
            ? prev.medications.filter(m => m !== medication)
            : [...prev.medications, medication]
          : [];

        const newFilters = { ...prev, medications: newMedications };
        syncToUrl(newFilters);
        onChange?.(newFilters);
        return newFilters;
      });
    },
    [syncToUrl, onChange]
  );

  /**
   * Set population filter
   */
  const setPopulation = useCallback(
    (population: PopulationType | null) => {
      setFilters(prev => {
        const newPopulations = population
          ? prev.populations.includes(population)
            ? prev.populations.filter(p => p !== population)
            : [...prev.populations, population]
          : [];

        const newFilters = { ...prev, populations: newPopulations };
        syncToUrl(newFilters);
        onChange?.(newFilters);
        return newFilters;
      });
    },
    [syncToUrl, onChange]
  );

  /**
   * Set search query
   */
  const setSearchQuery = useCallback(
    (query: string) => {
      setFilters(prev => {
        const newFilters = { ...prev, searchQuery: query };
        syncToUrl(newFilters);
        onChange?.(newFilters);
        return newFilters;
      });
    },
    [syncToUrl, onChange]
  );

  /**
   * Clear all filters
   */
  const clearFilters = useCallback(() => {
    const clearedFilters = { ...INITIAL_STATE };
    updateFilters(clearedFilters);
  }, [updateFilters]);

  /**
   * Update filter counts from results
   */
  const updateFilterCounts = useCallback(
    (counts: Record<PCDTFilterCategory, number>) => {
      setFilterCounts(counts);
    },
    []
  );

  /**
   * Get active filters as PCDTFilter array
   */
  const activeFilters = useMemo((): PCDTFilter[] => {
    return FILTER_CHIPS.map(chip => ({
      ...chip,
      active: filters.categories.includes(chip.category),
      count: filterCounts[chip.category] || 0,
    }));
  }, [filters.categories, filterCounts]);

  /**
   * Check if any filters are active
   */
  const hasActiveFilters = useMemo(() => {
    return (
      filters.categories.length > 0 ||
      filters.medications.length > 0 ||
      filters.populations.length > 0
    );
  }, [filters]);

  // Sync from URL on mount and URL changes
  useEffect(() => {
    if (syncWithUrl) {
      const urlState = getInitialState();
      setFilters(urlState);
    }
  }, [syncWithUrl, searchParams, getInitialState]);

  return {
    filters,
    activeFilters,
    toggleFilter,
    setMedication,
    setPopulation,
    clearFilters,
    filterCounts,
    setSearchQuery,
    updateFilterCounts,
    hasActiveFilters,
  };
}

export default usePCDTFilters;
