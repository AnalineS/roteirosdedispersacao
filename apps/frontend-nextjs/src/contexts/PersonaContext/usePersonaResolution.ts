/**
 * Custom hook for persona resolution logic
 * Extracted from PersonaContext.tsx for better organization
 */

import { useCallback } from 'react';
import { isValidPersonaId } from '@/hooks/useSafePersonaFromURL';
import type { ValidPersonaId, PersonaSource, PersonaResolutionResult, PersonaHistoryEntryInternal } from './types';
import { getLocalStoragePersona, getMostUsedPersonaFromHistory, getFirstAvailablePersona } from './utils';

interface UsePersonaResolutionProps {
  hasValidURLPersona: boolean;
  personaFromURL: ValidPersonaId | null;
  explicitPersona: ValidPersonaId | null;
  profileSelectedPersona: ValidPersonaId | null;
  isPersonaAvailable: (personaId: ValidPersonaId) => boolean;
  getProfileRecommendation: () => ValidPersonaId | null;
  personaHistory: PersonaHistoryEntryInternal[];
  defaultPersona: ValidPersonaId;
  personas: Record<string, any>;
}

export function usePersonaResolution({
  hasValidURLPersona,
  personaFromURL,
  explicitPersona,
  profileSelectedPersona,
  isPersonaAvailable,
  getProfileRecommendation,
  personaHistory,
  defaultPersona,
  personas
}: UsePersonaResolutionProps) {

  const resolvePersona = useCallback((): PersonaResolutionResult => {
    // 1. URL (prioridade máxima) - Confiança: 1.0
    if (hasValidURLPersona && personaFromURL && isPersonaAvailable(personaFromURL)) {
      return { persona: personaFromURL, source: 'url', confidence: 1.0 };
    }

    // 2. Seleção explícita do usuário - Confiança: 0.95
    if (explicitPersona && isPersonaAvailable(explicitPersona)) {
      return { persona: explicitPersona, source: 'explicit', confidence: 0.95 };
    }

    // 3. Perfil do usuário salvo - Confiança: 0.8
    if (profileSelectedPersona && isValidPersonaId(profileSelectedPersona) && isPersonaAvailable(profileSelectedPersona)) {
      return { persona: profileSelectedPersona, source: 'profile', confidence: 0.8 };
    }

    // 4. localStorage (compatibilidade) - Confiança: 0.6
    const localStoragePersona = getLocalStoragePersona(isPersonaAvailable);
    if (localStoragePersona) {
      return { persona: localStoragePersona, source: 'localStorage', confidence: 0.6 };
    }

    // 5. Recomendação baseada no perfil - Confiança: 0.7
    const profileRecommendation = getProfileRecommendation();
    if (profileRecommendation && isValidPersonaId(profileRecommendation) && isPersonaAvailable(profileRecommendation)) {
      return { persona: profileRecommendation, source: 'profile', confidence: 0.7 };
    }

    // 6. Padrão inteligente baseado no histórico - Confiança: 0.4
    const mostUsedPersona = getMostUsedPersonaFromHistory(personaHistory, isPersonaAvailable);
    if (mostUsedPersona) {
      return { persona: mostUsedPersona, source: 'default', confidence: 0.4 };
    }

    // 7. Fallback final - Confiança: 0.2
    if (isPersonaAvailable(defaultPersona)) {
      return { persona: defaultPersona, source: 'default', confidence: 0.2 };
    }

    // 8. Última tentativa - qualquer persona disponível
    const firstAvailable = getFirstAvailablePersona(personas, isPersonaAvailable);
    if (firstAvailable) {
      return { persona: firstAvailable, source: 'default', confidence: 0.1 };
    }

    return { persona: null, source: 'default', confidence: 0 };
  }, [
    hasValidURLPersona,
    personaFromURL,
    explicitPersona,
    profileSelectedPersona,
    isPersonaAvailable,
    getProfileRecommendation,
    personaHistory,
    defaultPersona,
    personas
  ]);

  return { resolvePersona };
}