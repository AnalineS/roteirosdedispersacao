/**
 * Progressive Disclosure System Types
 * 4 níveis: Paciente/Estudante/Profissional/Especialista
 * Integrado com sistema de personas existente
 */

export type UserLevel = 'paciente' | 'estudante' | 'profissional' | 'especialista';

export interface UserLevelConfig {
  id: UserLevel;
  name: string;
  description: string;
  complexity: number; // 1-4 (1 = mais simples)
  allowedContent: ContentType[];
  defaultExpanded: string[];
  terminology: 'simple' | 'mixed' | 'technical' | 'expert';
}

export type ContentType = 
  | 'basic_info'
  | 'dosage_simple' 
  | 'dosage_technical'
  | 'side_effects_common'
  | 'side_effects_rare'
  | 'contraindications'
  | 'drug_interactions'
  | 'mechanism_action'
  | 'pharmacokinetics'
  | 'clinical_studies'
  | 'expert_notes';

export interface DisclosureContent {
  id: string;
  title: string;
  level: UserLevel[];
  contentType: ContentType;
  priority: number; // 1-5 (1 = most important)
  summary: string;
  detailed: string;
  technical?: string;
  expert?: string;
  medicalTerms?: MedicalTerm[];
}

export interface MedicalTerm {
  term: string;
  simple: string;        // Popup inline (1-2 linhas)
  detailed: string;      // Modal - definição completa
  context?: string;      // Contexto clínico
  images?: string[];     // URLs para imagens no modal
  level: UserLevel[];    // Quais níveis podem ver este termo
  category: 'dosage' | 'symptom' | 'procedure' | 'anatomy' | 'drug' | 'condition';
}

export interface DisclosureState {
  currentLevel: UserLevel;
  expandedSections: string[];
  preferredTerminology: 'simple' | 'technical';
  showAllContent: boolean;
  resetOnPageChange: boolean;
}

// Configurações dos 4 níveis
export const USER_LEVELS: Record<UserLevel, UserLevelConfig> = {
  paciente: {
    id: 'paciente',
    name: 'Paciente',
    description: 'Informações essenciais e práticas para pessoas em tratamento',
    complexity: 1,
    allowedContent: [
      'basic_info',
      'dosage_simple', 
      'side_effects_common'
    ],
    defaultExpanded: ['basic_info', 'dosage_simple'],
    terminology: 'simple'
  },
  
  estudante: {
    id: 'estudante',
    name: 'Estudante',
    description: 'Conteúdo educacional com fundamentação científica',
    complexity: 2,
    allowedContent: [
      'basic_info',
      'dosage_simple',
      'dosage_technical',
      'side_effects_common',
      'side_effects_rare',
      'contraindications'
    ],
    defaultExpanded: ['basic_info'],
    terminology: 'mixed'
  },

  profissional: {
    id: 'profissional',
    name: 'Profissional de Saúde',
    description: 'Informações clínicas completas para prática assistencial',
    complexity: 3,
    allowedContent: [
      'basic_info',
      'dosage_simple',
      'dosage_technical', 
      'side_effects_common',
      'side_effects_rare',
      'contraindications',
      'drug_interactions',
      'mechanism_action'
    ],
    defaultExpanded: ['dosage_technical', 'contraindications'],
    terminology: 'technical'
  },

  especialista: {
    id: 'especialista',
    name: 'Especialista',
    description: 'Acesso completo incluindo pesquisas e casos complexos',
    complexity: 4,
    allowedContent: [
      'basic_info',
      'dosage_simple',
      'dosage_technical',
      'side_effects_common', 
      'side_effects_rare',
      'contraindications',
      'drug_interactions',
      'mechanism_action',
      'pharmacokinetics',
      'clinical_studies',
      'expert_notes'
    ],
    defaultExpanded: [],
    terminology: 'expert'
  }
};

// Mapeamento para personas existentes
export const PERSONA_TO_LEVEL: Record<string, UserLevel> = {
  'ga': 'paciente',           // Persona empática → nível paciente
  'dr-gasnelio': 'profissional', // Persona técnica → nível profissional
  'student': 'estudante',     // Se houver persona estudante
  'specialist': 'especialista' // Se houver persona especialista
};

// Content priority por nível
export const CONTENT_PRIORITY: Record<UserLevel, Record<ContentType, number>> = {
  paciente: {
    basic_info: 1,
    dosage_simple: 1,
    side_effects_common: 2,
    dosage_technical: 5,
    side_effects_rare: 5,
    contraindications: 4,
    drug_interactions: 5,
    mechanism_action: 5,
    pharmacokinetics: 5,
    clinical_studies: 5,
    expert_notes: 5
  },
  
  estudante: {
    basic_info: 1,
    dosage_simple: 2,
    dosage_technical: 1,
    side_effects_common: 1,
    side_effects_rare: 2,
    contraindications: 1,
    drug_interactions: 3,
    mechanism_action: 2,
    pharmacokinetics: 4,
    clinical_studies: 3,
    expert_notes: 5
  },

  profissional: {
    basic_info: 2,
    dosage_simple: 3,
    dosage_technical: 1,
    side_effects_common: 2,
    side_effects_rare: 1,
    contraindications: 1,
    drug_interactions: 1,
    mechanism_action: 2,
    pharmacokinetics: 3,
    clinical_studies: 3,
    expert_notes: 4
  },

  especialista: {
    basic_info: 3,
    dosage_simple: 4,
    dosage_technical: 2,
    side_effects_common: 3,
    side_effects_rare: 1,
    contraindications: 1,
    drug_interactions: 1,
    mechanism_action: 1,
    pharmacokinetics: 1,
    clinical_studies: 1,
    expert_notes: 1
  }
};

const DisclosureConfig = {
  USER_LEVELS,
  PERSONA_TO_LEVEL,
  CONTENT_PRIORITY
};

export default DisclosureConfig;