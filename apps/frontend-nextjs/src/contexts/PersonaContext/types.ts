/**
 * Internal types and interfaces for PersonaContext
 * Extracted from PersonaContext.tsx for better organization
 */

import type {
  PersonaContextValue,
  PersonaChangeEvent,
  PersonaSource,
  PersonaConfig,
  ValidPersonaId,
  PersonaHistoryEntry
} from '@/types/personas';

// Interface para gtag tracking (compatível com interface global)
export interface WindowWithGtag extends Window {
  gtag?: (
    command: 'event' | 'config',
    eventNameOrId: string,
    parameters?: Record<string, unknown>
  ) => void;
}

export interface PersonaProviderProps {
  children: React.ReactNode;
  /** Configurações opcionais */
  config?: {
    enableAnalytics?: boolean;
    enableURLSync?: boolean;
    enableLocalStorage?: boolean;
    defaultPersona?: ValidPersonaId;
    maxHistoryEntries?: number;
  };
}

export interface PersonaProviderConfig {
  enableAnalytics: boolean;
  enableURLSync: boolean;
  enableLocalStorage: boolean;
  defaultPersona: ValidPersonaId;
  maxHistoryEntries: number;
}

export interface PersonaResolutionResult {
  persona: ValidPersonaId | null;
  source: PersonaSource;
  confidence: number;
}

export interface PersonaHistoryEntryInternal {
  personaId: ValidPersonaId;
  source: PersonaSource;
  timestamp: Date;
  sessionId: string;
}

export interface PersonaSetterOptions {
  source?: PersonaSource;
  sessionId?: string;
  skipAnalytics?: boolean;
}

// Re-export commonly used types for convenience
export type {
  PersonaContextValue,
  PersonaChangeEvent,
  PersonaSource,
  PersonaConfig,
  ValidPersonaId,
  PersonaHistoryEntry
};