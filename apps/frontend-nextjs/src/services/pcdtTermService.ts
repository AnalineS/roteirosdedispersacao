/**
 * PCDT Term Service
 * Loads and indexes clinical taxonomy data for search suggestions
 *
 * Data sources:
 * - clinical_taxonomy.json: Domains, categories, medications, populations
 * - dosing_protocols.json: Dosing regimens
 * - pharmacovigilance_guidelines.json: Adverse events
 */

import type {
  PCDTSuggestion,
  PCDTFilterCategory,
  MedicationType,
  PopulationType,
  DomainCode,
  SuggestionSource,
  ClinicalTaxonomyData,
} from '@/components/search/PCDTSearchTypes';

// Import structured data at build time
import clinicalTaxonomyData from '@/data/structured/clinical_taxonomy.json';

// Type assertion for imported data
const taxonomyData = clinicalTaxonomyData as ClinicalTaxonomyData;

// In-memory cache for processed terms
let termsCache: PCDTSuggestion[] | null = null;
let synonymsMap: Map<string, string[]> | null = null;

/**
 * Category mapping from taxonomy domains to filter categories
 */
const DOMAIN_TO_CATEGORY: Record<string, PCDTFilterCategory> = {
  clinical_protocols: 'dose',
  pharmacology: 'interaction',
  dispensing_workflow: 'protocol',
  safety_monitoring: 'effect',
  patient_education: 'education',
  regulatory_framework: 'protocol',
};

const SUBCATEGORY_TO_CATEGORY: Record<string, PCDTFilterCategory> = {
  dosing_regimens: 'dose',
  administration_guidelines: 'dose',
  monitoring_protocols: 'protocol',
  special_populations: 'population',
  mechanisms_of_action: 'medication',
  pharmacokinetics: 'medication',
  drug_interactions: 'interaction',
  contraindications: 'contraindication',
  adverse_events: 'effect',
  pharmacovigilance: 'effect',
  risk_mitigation: 'effect',
  emergency_protocols: 'protocol',
  initial_assessment: 'protocol',
  patient_counseling: 'education',
  post_dispensing_care: 'protocol',
  documentation: 'protocol',
  medication_education: 'education',
  adherence_strategies: 'education',
  lifestyle_modifications: 'education',
  self_care_practices: 'education',
  national_guidelines: 'protocol',
  regulatory_requirements: 'protocol',
  quality_standards: 'protocol',
  reporting_obligations: 'protocol',
};

/**
 * Build synonyms map from medication aliases
 */
function buildSynonymsMap(): Map<string, string[]> {
  if (synonymsMap) return synonymsMap;

  synonymsMap = new Map();
  const medications = taxonomyData.clinical_taxonomy.level_3_entities.medication_specific;

  // Add medication aliases
  Object.entries(medications).forEach(([medName, medData]) => {
    const allTerms = [medName, ...medData.aliases];
    allTerms.forEach(term => {
      synonymsMap!.set(term.toLowerCase(), allTerms.filter(t => t.toLowerCase() !== term.toLowerCase()));
    });
  });

  // Add common synonyms
  const commonSynonyms: Record<string, string[]> = {
    'dose': ['dosagem', 'posologia', 'quantidade'],
    'dosagem': ['dose', 'posologia', 'quantidade'],
    'efeito': ['reação', 'adverso', 'colateral'],
    'efeitos colaterais': ['reações adversas', 'eventos adversos'],
    'contraindicação': ['contraindicado', 'não usar', 'evitar'],
    'interação': ['interage', 'interações medicamentosas'],
    'gestante': ['grávida', 'gravidez', 'gestação'],
    'criança': ['pediátrico', 'infantil', 'pediatria'],
    'adulto': ['maior de idade', 'adultos'],
  };

  Object.entries(commonSynonyms).forEach(([term, synonyms]) => {
    synonymsMap!.set(term.toLowerCase(), synonyms);
  });

  return synonymsMap;
}

/**
 * Build searchable terms from taxonomy data
 */
function buildTermsIndex(): PCDTSuggestion[] {
  if (termsCache) return termsCache;

  const terms: PCDTSuggestion[] = [];
  const taxonomy = taxonomyData.clinical_taxonomy;
  let idCounter = 0;

  // Process Level 1 Domains
  Object.entries(taxonomy.level_1_domains).forEach(([domainKey, domain]) => {
    terms.push({
      id: `domain-${idCounter++}`,
      term: domain.title,
      category: DOMAIN_TO_CATEGORY[domainKey] || 'protocol',
      synonyms: [],
      keywords: domain.subcategories,
      source: 'taxonomy',
      domainCode: domain.code as DomainCode,
      weight: domain.priority === 'high' ? 1.0 : 0.8,
      complexity: 'standard',
    });
  });

  // Process Level 2 Categories
  Object.entries(taxonomy.level_2_categories).forEach(([categoryKey, category]) => {
    Object.entries(category.entities).forEach(([entityKey, entity]) => {
      terms.push({
        id: `category-${idCounter++}`,
        term: entityKey.replace(/_/g, ' '),
        category: SUBCATEGORY_TO_CATEGORY[categoryKey] || DOMAIN_TO_CATEGORY[category.parent] || 'protocol',
        synonyms: [],
        keywords: entity.keywords,
        source: 'taxonomy',
        weight: entity.weight,
        complexity: entity.complexity as 'simple' | 'standard' | 'complex',
      });

      // Also index individual keywords
      entity.keywords.forEach(keyword => {
        terms.push({
          id: `keyword-${idCounter++}`,
          term: keyword,
          category: SUBCATEGORY_TO_CATEGORY[categoryKey] || 'protocol',
          synonyms: [],
          keywords: [entityKey],
          source: 'taxonomy',
          weight: entity.weight * 0.9,
          complexity: 'simple',
        });
      });
    });
  });

  // Process Medications
  Object.entries(taxonomy.level_3_entities.medication_specific).forEach(([medName, medData]) => {
    terms.push({
      id: `med-${idCounter++}`,
      term: medName,
      category: 'medication',
      synonyms: medData.aliases,
      keywords: [...medData.semantic_tags, ...medData.contexts],
      source: 'taxonomy',
      medication: medName as MedicationType,
      weight: 1.0,
      complexity: 'standard',
    });

    // Add dosages as searchable terms
    medData.dosages.forEach(dose => {
      terms.push({
        id: `dose-${idCounter++}`,
        term: `${medName} ${dose}`,
        category: 'dose',
        synonyms: medData.aliases.map(a => `${a} ${dose}`),
        keywords: [medName, dose, 'dosagem'],
        source: 'protocol',
        medication: medName as MedicationType,
        weight: 0.95,
        complexity: 'standard',
      });
    });
  });

  // Process Populations
  Object.entries(taxonomy.level_3_entities.population_specific).forEach(([popKey, popData]) => {
    terms.push({
      id: `pop-${idCounter++}`,
      term: popData.weight_range,
      category: 'population',
      synonyms: [popData.age_range],
      keywords: [popKey, popData.weight_range, popData.age_range],
      source: 'taxonomy',
      population: popKey as PopulationType,
      weight: 0.9,
      complexity: popData.complexity as 'simple' | 'standard' | 'complex',
    });
  });

  // Process Clinical Conditions
  Object.entries(taxonomy.level_3_entities.clinical_conditions).forEach(([condKey, condData]) => {
    const category: PCDTFilterCategory =
      condKey.includes('pregnancy') || condKey.includes('breastfeeding')
        ? 'population'
        : 'protocol';

    terms.push({
      id: `cond-${idCounter++}`,
      term: condKey.replace(/_/g, ' '),
      category,
      synonyms: condData.considerations || [],
      keywords: [condKey, ...(condData.considerations || [])],
      source: 'taxonomy',
      weight: 0.85,
      complexity: condData.complexity as 'simple' | 'standard' | 'complex',
    });
  });

  // Process Semantic Relationships (causes = effects)
  taxonomy.semantic_relationships.associative.causes.forEach(rel => {
    const [med, effect] = rel.split(' causes ');
    if (med && effect) {
      terms.push({
        id: `effect-${idCounter++}`,
        term: effect,
        category: 'effect',
        synonyms: [],
        keywords: [med, 'efeito', 'causa'],
        source: 'taxonomy',
        medication: med as MedicationType,
        weight: 0.9,
        complexity: 'standard',
      });
    }
  });

  // Process Semantic Relationships (interacts_with = interactions)
  taxonomy.semantic_relationships.associative.interacts_with.forEach(rel => {
    const [med, other] = rel.split(' interacts_with ');
    if (med && other) {
      terms.push({
        id: `interaction-${idCounter++}`,
        term: `${med} e ${other}`,
        category: 'interaction',
        synonyms: [],
        keywords: [med, other, 'interação'],
        source: 'taxonomy',
        medication: med as MedicationType,
        weight: 0.85,
        complexity: 'standard',
      });
    }
  });

  termsCache = terms;
  return terms;
}

/**
 * Calculate match score for a term against query
 */
function calculateMatchScore(term: PCDTSuggestion, query: string, queryWords: string[]): number {
  const termLower = term.term.toLowerCase();
  const queryLower = query.toLowerCase();
  let score = 0;

  // Exact match bonus
  if (termLower === queryLower) {
    score += 100;
  }
  // Starts with query bonus
  else if (termLower.startsWith(queryLower)) {
    score += 80;
  }
  // Contains query
  else if (termLower.includes(queryLower)) {
    score += 50;
  }

  // Word matches
  queryWords.forEach(word => {
    if (termLower.includes(word)) {
      score += 20;
    }
    // Check keywords
    if (term.keywords.some(k => k.toLowerCase().includes(word))) {
      score += 15;
    }
    // Check synonyms
    if (term.synonyms.some(s => s.toLowerCase().includes(word))) {
      score += 10;
    }
  });

  // Apply term weight
  score *= term.weight;

  return score;
}

/**
 * Search for suggestions matching query
 */
export function searchTerms(
  query: string,
  options: {
    maxResults?: number;
    categories?: PCDTFilterCategory[];
    medications?: MedicationType[];
  } = {}
): PCDTSuggestion[] {
  const { maxResults = 10, categories, medications } = options;

  if (!query || query.length < 2) {
    return [];
  }

  const terms = buildTermsIndex();
  const queryLower = query.toLowerCase().trim();
  const queryWords = queryLower.split(/\s+/).filter(w => w.length >= 2);

  // Score and filter terms
  const scored = terms
    .filter(term => {
      // Category filter
      if (categories && categories.length > 0 && !categories.includes(term.category)) {
        return false;
      }
      // Medication filter
      if (medications && medications.length > 0 && term.medication && !medications.includes(term.medication)) {
        return false;
      }
      return true;
    })
    .map(term => ({
      term,
      score: calculateMatchScore(term, queryLower, queryWords),
    }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);

  return scored.map(item => item.term);
}

/**
 * Get synonyms for a term
 */
export function getSynonyms(term: string): string[] {
  const map = buildSynonymsMap();
  return map.get(term.toLowerCase()) || [];
}

/**
 * Get all medications with their data
 */
export function getMedications(): Array<{
  name: MedicationType;
  aliases: string[];
  dosages: string[];
}> {
  const medications = taxonomyData.clinical_taxonomy.level_3_entities.medication_specific;
  return Object.entries(medications).map(([name, data]) => ({
    name: name as MedicationType,
    aliases: data.aliases,
    dosages: data.dosages,
  }));
}

/**
 * Get all populations
 */
export function getPopulations(): Array<{
  key: PopulationType;
  weightRange: string;
  ageRange: string;
}> {
  const populations = taxonomyData.clinical_taxonomy.level_3_entities.population_specific;
  return Object.entries(populations).map(([key, data]) => ({
    key: key as PopulationType,
    weightRange: data.weight_range,
    ageRange: data.age_range,
  }));
}

/**
 * Get domain information
 */
export function getDomains(): Array<{
  code: DomainCode;
  title: string;
  description: string;
}> {
  const domains = taxonomyData.clinical_taxonomy.level_1_domains;
  return Object.values(domains).map(domain => ({
    code: domain.code as DomainCode,
    title: domain.title,
    description: domain.description,
  }));
}

/**
 * Expand query with synonyms
 */
export function expandQueryWithSynonyms(query: string): string[] {
  const words = query.toLowerCase().split(/\s+/);
  const expanded: Set<string> = new Set([query]);

  words.forEach(word => {
    const synonyms = getSynonyms(word);
    synonyms.forEach(syn => {
      expanded.add(query.replace(new RegExp(word, 'gi'), syn));
    });
  });

  return Array.from(expanded);
}

/**
 * Get popular search terms for empty state
 */
export function getPopularTerms(): PCDTSuggestion[] {
  const terms = buildTermsIndex();

  // Return high-weight terms from different categories
  const byCategory = new Map<PCDTFilterCategory, PCDTSuggestion[]>();

  terms.forEach(term => {
    if (!byCategory.has(term.category)) {
      byCategory.set(term.category, []);
    }
    byCategory.get(term.category)!.push(term);
  });

  const popular: PCDTSuggestion[] = [];

  // Get top 2 from each important category
  const priorityCategories: PCDTFilterCategory[] = ['dose', 'effect', 'contraindication', 'interaction'];

  priorityCategories.forEach(cat => {
    const catTerms = byCategory.get(cat) || [];
    const sorted = catTerms.sort((a, b) => b.weight - a.weight).slice(0, 2);
    popular.push(...sorted);
  });

  return popular.slice(0, 8);
}

/**
 * Preload and warm up the cache
 */
export function preloadTerms(): void {
  buildTermsIndex();
  buildSynonymsMap();
}

// Export singleton service
export const pcdtTermService = {
  searchTerms,
  getSynonyms,
  getMedications,
  getPopulations,
  getDomains,
  expandQueryWithSynonyms,
  getPopularTerms,
  preloadTerms,
};

export default pcdtTermService;
