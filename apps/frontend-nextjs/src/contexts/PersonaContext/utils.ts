/**
 * Utility functions for PersonaContext
 * Extracted from PersonaContext.tsx for better organization and reusability
 */

import { isValidPersonaId } from '@/hooks/useSafePersonaFromURL';
import { safeLocalStorage, isClientSide } from '@/hooks/useClientStorage';
import { STATIC_PERSONAS } from '@/data/personas';
import type {
  ValidPersonaId,
  PersonaSource,
  PersonaConfig,
  PersonaHistoryEntryInternal
} from './types';

/**
 * Get persona from localStorage with validation
 */
export function getLocalStoragePersona(
  isPersonaAvailable: (personaId: ValidPersonaId) => boolean
): ValidPersonaId | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = safeLocalStorage()?.getItem('selectedPersona');
    return stored && isValidPersonaId(stored) && isPersonaAvailable(stored) ? stored : null;
  } catch {
    return null;
  }
}

/**
 * Find most used persona from history
 */
export function getMostUsedPersonaFromHistory(
  history: PersonaHistoryEntryInternal[],
  isPersonaAvailable: (personaId: ValidPersonaId) => boolean
): ValidPersonaId | null {
  if (history.length === 0) return null;

  const mostUsed = history
    .reduce((acc, entry) => {
      acc[entry.personaId] = (acc[entry.personaId] || 0) + 1;
      return acc;
    }, {} as Record<ValidPersonaId, number>);

  const mostUsedPersona = Object.entries(mostUsed)
    .sort(([,a], [,b]) => b - a)[0]?.[0] as ValidPersonaId;

  return mostUsedPersona && isPersonaAvailable(mostUsedPersona) ? mostUsedPersona : null;
}

/**
 * Get first available persona from available personas list
 */
export function getFirstAvailablePersona(
  personas: Record<string, any>,
  isPersonaAvailable: (personaId: ValidPersonaId) => boolean
): ValidPersonaId | null {
  const firstAvailable = Object.keys(personas).find(id =>
    isValidPersonaId(id) && isPersonaAvailable(id as ValidPersonaId)
  );
  return firstAvailable ? firstAvailable as ValidPersonaId : null;
}

/**
 * Get persona config with fallback to static personas
 */
export function getPersonaConfigWithFallback(
  personaId: ValidPersonaId,
  getPersonaConfigFromHook: (personaId: ValidPersonaId) => PersonaConfig | null
): PersonaConfig | null {
  // Use hook first
  const configFromHook = getPersonaConfigFromHook(personaId);
  if (configFromHook) return configFromHook;

  // Fallback to static personas
  if (STATIC_PERSONAS[personaId]) {
    const staticPersona = STATIC_PERSONAS[personaId];
    return {
      id: personaId,
      name: staticPersona.name,
      description: staticPersona.description,
      avatar: staticPersona.avatar,
      personality: staticPersona.personality,
      expertise: staticPersona.expertise,
      response_style: staticPersona.response_style,
      target_audience: staticPersona.target_audience,
      system_prompt: staticPersona.system_prompt,
      capabilities: staticPersona.capabilities,
      example_questions: staticPersona.example_questions,
      limitations: staticPersona.limitations,
      response_format: staticPersona.response_format,
      tone: personaId === 'ga' ? 'empathetic' : 'professional',
      specialties: staticPersona.expertise,
      responseStyle: 'detailed' as 'detailed' | 'concise' | 'interactive',
      enabled: true
    };
  }

  return null;
}

/**
 * Create available personas record from raw personas data
 */
export function createAvailablePersonasRecord(
  personas: Record<string, any> | null
): Record<ValidPersonaId, PersonaConfig> {
  if (!personas) return {} as Record<ValidPersonaId, PersonaConfig>;

  return Object.fromEntries(
    Object.entries(personas)
      .filter(([id]) => isValidPersonaId(id))
      .map(([id, persona]) => [
        id as ValidPersonaId,
        {
          id: id as ValidPersonaId,
          name: persona.name,
          description: persona.description,
          avatar: persona.avatar,
          personality: persona.personality,
          expertise: persona.expertise,
          response_style: persona.response_style,
          target_audience: persona.target_audience,
          system_prompt: persona.system_prompt,
          capabilities: persona.capabilities,
          example_questions: persona.example_questions,
          limitations: persona.limitations,
          response_format: persona.response_format
        }
      ])
  ) as Record<ValidPersonaId, PersonaConfig>;
}

/**
 * Add entry to persona history with size limit
 */
export function addToPersonaHistory(
  currentHistory: PersonaHistoryEntryInternal[],
  personaId: ValidPersonaId,
  source: PersonaSource,
  maxEntries: number,
  sessionId?: string
): PersonaHistoryEntryInternal[] {
  const newEntry: PersonaHistoryEntryInternal = {
    personaId,
    source,
    timestamp: new Date(),
    sessionId: sessionId || crypto.randomUUID()
  };

  return [...currentHistory, newEntry].slice(-maxEntries);
}

/**
 * Calculate session duration for analytics
 */
export function calculateSessionDuration(
  sessionStartTime: number,
  previousPersona: ValidPersonaId | null
): number {
  return previousPersona ? Date.now() - sessionStartTime : 0;
}

/**
 * Determine error state based on loading and persona availability
 */
export function determineErrorState(
  isLoading: boolean,
  currentPersona: ValidPersonaId | null,
  isPersonaAvailable: (personaId: ValidPersonaId) => boolean
): string | null {
  if (isLoading) return null;
  if (!currentPersona) return 'Nenhuma persona disponível';
  if (!isPersonaAvailable(currentPersona)) return 'Persona atual não está mais disponível';
  return null;
}