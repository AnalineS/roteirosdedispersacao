/**
 * Tipos TypeScript para sistema de personas unificado
 * Garante type safety em todo o sistema
 */

import { z } from 'zod';

// ============================================
// TIPOS BASE
// ============================================

interface PersonaPreferences {
  preferred_communication_style?: 'formal' | 'casual' | 'technical';
  response_detail_level?: 'brief' | 'detailed' | 'comprehensive';
  show_citations?: boolean;
  empathy_level?: 'low' | 'medium' | 'high';
  educational_focus?: string[];
  [key: string]: unknown;
}

interface GuardCheckObject {
  id?: unknown;
  name?: unknown;
  description?: unknown;
  personaId?: unknown;
  source?: unknown;
  timestamp?: unknown;
}

// Personas válidas - fonte única de verdade
export const VALID_PERSONA_IDS = ['dr_gasnelio', 'ga'] as const;
export type ValidPersonaId = typeof VALID_PERSONA_IDS[number];

// Schema de validação usando Zod
const PersonaIdSchemaInternal = z.enum(['dr_gasnelio', 'ga']);

// Validador runtime que integra com TypeScript
const isValidPersonaIdInternal = (value: unknown): value is ValidPersonaId => {
  return PersonaIdSchemaInternal.safeParse(value).success;
};

// ============================================
// TIPOS ESTENDIDOS
// ============================================

// Configuração de persona - unificada para frontend e backend
export interface PersonaConfig {
  id: ValidPersonaId;
  name: string;
  description: string;
  avatar: string;
  personality: string;
  expertise: string[];
  response_style: string;
  target_audience: string;
  system_prompt: string;
  capabilities: string[];
  example_questions: string[];
  limitations: string[];
  response_format: {
    technical: boolean;
    citations?: boolean;
    structured?: boolean;
    empathetic?: boolean;
  };
  // Frontend-specific properties para compatibilidade com useChat
  tone: 'formal' | 'casual' | 'empathetic' | 'professional' | 'technical';
  specialties: string[];
  responseStyle: 'detailed' | 'concise' | 'interactive';
  enabled: boolean;
  [key: string]: unknown;
}

// Estado de persona no sistema
export interface PersonaState {
  id: ValidPersonaId;
  config: PersonaConfig;
  isActive: boolean;
  isAvailable: boolean;
  lastUsed?: Date;
  usageCount: number;
  averageSessionTime?: number;
}

// Fonte de seleção de persona
const PersonaSourceSchemaInternal = z.enum(['url', 'explicit', 'profile', 'localStorage', 'default']);
export type PersonaSource = z.infer<typeof PersonaSourceSchemaInternal>;

// Histórico de mudanças de persona
export interface PersonaHistoryEntry {
  personaId: ValidPersonaId;
  source: PersonaSource;
  timestamp: Date;
  sessionId?: string;
  userAgent?: string;
}

// ============================================
// TIPOS DE VALIDAÇÃO
// ============================================

// Schema para parâmetros de URL
const URLPersonaSchemaInternal = z.object({
  persona: PersonaIdSchemaInternal.optional()
});

// Schema para localStorage
const LocalStoragePersonaSchemaInternal = z.object({
  selectedPersona: PersonaIdSchemaInternal,
  timestamp: z.string().optional(),
  version: z.string().optional()
});

// Schema para perfil de usuário (persona-related)
const UserProfilePersonaSchemaInternal = z.object({
  selectedPersona: PersonaIdSchemaInternal.optional(),
  lastPersona: PersonaIdSchemaInternal.optional(),
  personaPreferences: z.record(z.string(), z.unknown()).optional()
});

// ============================================
// TIPOS DE CONTEXTO/PROVIDER
// ============================================

// Estado do contexto de persona
export interface PersonaContextState {
  currentPersona: ValidPersonaId | null;
  availablePersonas: Record<ValidPersonaId, PersonaConfig>;
  history: PersonaHistoryEntry[];
  isLoading: boolean;
  error: string | null;
}

// Ações do contexto de persona
export interface PersonaContextActions {
  setPersona: (personaId: ValidPersonaId, source?: PersonaSource) => Promise<void>;
  clearPersona: () => void;
  getPersonaConfig: (personaId: ValidPersonaId) => PersonaConfig | null;
  isPersonaAvailable: (personaId: ValidPersonaId) => boolean;
  getRecommendedPersona: () => ValidPersonaId | null;
  refreshPersonas: () => Promise<void>;
}

// Contexto completo
export type PersonaContextValue = PersonaContextState & PersonaContextActions;

// ============================================
// TIPOS UTILITÁRIOS
// ============================================

// Mapeamentos de alias para normalização
export const PERSONA_ALIASES: Record<string, ValidPersonaId> = {
  'dr_gasnelio': 'dr_gasnelio',
  'gasnelio': 'dr_gasnelio',
  'dr.gasnelio': 'dr_gasnelio',
  'drgasnelio': 'dr_gasnelio',
  'technical': 'dr_gasnelio',
  'doctor': 'dr_gasnelio',
  'professional': 'dr_gasnelio',
  'ga': 'ga',
  'empathetic': 'ga',
  'empathy': 'ga',
  'welcoming': 'ga',
  'friendly': 'ga',
  'patient': 'ga'
} as const;

// Função de normalização type-safe
const normalizePersonaIdInternal = (input: string): ValidPersonaId | null => {
  const normalized = input.toLowerCase().trim();
  const aliasResult = PERSONA_ALIASES[normalized];
  
  return aliasResult && isValidPersonaIdInternal(aliasResult) ? aliasResult : null;
};

// ============================================
// TIPOS PARA ANALYTICS
// ============================================

// Evento de mudança de persona
export interface PersonaChangeEvent {
  type: 'persona_change';
  data: {
    from: ValidPersonaId | null;
    to: ValidPersonaId;
    source: PersonaSource;
    timestamp: Date;
    duration?: number; // tempo na persona anterior
    sessionId: string;
    userProfile?: {
      type: string;
      focus: string;
    };
  };
}

// Estatísticas de uso de persona
export interface PersonaUsageStats {
  personaId: ValidPersonaId;
  totalSessions: number;
  totalTime: number;
  averageSessionTime: number;
  mostCommonSource: PersonaSource;
  userRetention: number;
  conversionRate: number; // de seleção para conversa
}

// ============================================
// TIPOS DE CONFIGURAÇÃO
// ============================================

// Opções de comportamento do sistema de personas
export interface PersonaSystemConfig {
  defaultPersona: ValidPersonaId;
  enableURLSync: boolean;
  enableLocalStorage: boolean;
  enableAnalytics: boolean;
  maxHistoryEntries: number;
  sessionTimeout: number; // ms
  fallbackBehavior: 'redirect' | 'default' | 'error';
  validationLevel: 'strict' | 'permissive';
}

// ============================================
// GUARD FUNCTIONS
// ============================================

// Type guards para runtime safety
export const isPersonaConfig = (obj: GuardCheckObject): obj is PersonaConfig => {
  return obj && 
         typeof obj === 'object' &&
         isValidPersonaId(obj.id) &&
         typeof obj.name === 'string' &&
         typeof obj.description === 'string';
};

export const isPersonaHistoryEntry = (obj: GuardCheckObject): obj is PersonaHistoryEntry => {
  return obj &&
         typeof obj === 'object' &&
         isValidPersonaId(obj.personaId) &&
         PersonaSourceSchema.safeParse(obj.source).success &&
         obj.timestamp instanceof Date;
};

// ============================================
// TIPOS PARA TESTES
// ============================================

// Mock de persona para testes
export interface MockPersonaSetup {
  availablePersonas: ValidPersonaId[];
  defaultPersona: ValidPersonaId;
  urlParam?: ValidPersonaId;
  localStorage?: ValidPersonaId;
  userProfile?: ValidPersonaId;
}

// Cenário de teste
export interface PersonaTestScenario {
  name: string;
  setup: MockPersonaSetup;
  expectedResult: ValidPersonaId;
  expectedSource: PersonaSource;
}

// ============================================
// EXPORTAÇÕES AGRUPADAS
// ============================================
// Note: Types are already exported above, no need to re-export

// Exportações públicas
export const PersonaIdSchema = PersonaIdSchemaInternal;
export const PersonaSourceSchema = PersonaSourceSchemaInternal;
export const URLPersonaSchema = URLPersonaSchemaInternal;
export const LocalStoragePersonaSchema = LocalStoragePersonaSchemaInternal;
export const UserProfilePersonaSchema = UserProfilePersonaSchemaInternal;
export const isValidPersonaId = isValidPersonaIdInternal;
export const normalizePersonaId = normalizePersonaIdInternal;