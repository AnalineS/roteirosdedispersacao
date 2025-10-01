/**
 * Custom hook for persona actions (setPersona, clearPersona, etc.)
 * Extracted from PersonaContext.tsx for better organization
 */

import { useCallback } from 'react';
import { safeLocalStorage, isClientSide } from '@/hooks/useClientStorage';
import { ErrorMonitorService } from '@/components/monitoring/ErrorMonitor';
import type { ValidPersonaId, PersonaSource, PersonaConfig } from './types';
import {
  trackPersonaChangeStarted,
  trackPersonaChangeSuccess,
  trackPersonaChangeError,
  trackPersonaUnavailable,
  trackPersonaCleared,
  trackPersonaClearError,
  trackLocalStorageError,
  createPersonaChangeEventData
} from './analytics';
import { calculateSessionDuration } from './utils';

interface UsePersonaActionsProps {
  currentPersona: ValidPersonaId | null;
  isPersonaAvailable: (personaId: ValidPersonaId) => boolean;
  enableAnalytics: boolean;
  enableLocalStorage: boolean;
  enableURLSync: boolean;
  sessionStartTime: number;
  trackEvent: ((event: string, data: any) => Promise<void>) | null;
  getPersonaConfig: (personaId: ValidPersonaId) => PersonaConfig | null;
  profile: any;
  personas: Record<string, any>;
  personaHistory: any[];
  getProfileRecommendation: () => ValidPersonaId | null;
  updatePersonaInURL: (personaId: ValidPersonaId) => void;
  setExplicitPersona: (personaId: ValidPersonaId | null) => void;
}

export function usePersonaActions({
  currentPersona,
  isPersonaAvailable,
  enableAnalytics,
  enableLocalStorage,
  enableURLSync,
  sessionStartTime,
  trackEvent,
  getPersonaConfig,
  profile,
  personas,
  personaHistory,
  getProfileRecommendation,
  updatePersonaInURL,
  setExplicitPersona
}: UsePersonaActionsProps) {

  const setPersona = useCallback(async (personaId: ValidPersonaId, source: PersonaSource = 'explicit') => {
    const previousPersona = currentPersona;
    const sessionId = crypto.randomUUID();

    try {
      // Validação rigorosa
      if (!isPersonaAvailable(personaId)) {
        trackPersonaUnavailable(personaId);
        throw new Error(`Persona ${personaId} não está disponível`);
      }

      // Log detalhado da mudança
      trackPersonaChangeStarted(previousPersona, personaId, source);

      // Definir persona explicitamente
      setExplicitPersona(personaId);

      // Analytics avançadas se habilitado
      if (enableAnalytics && trackEvent) {
        const sessionDuration = calculateSessionDuration(sessionStartTime, previousPersona);
        const config = getPersonaConfig(personaId);

        const analyticsData = createPersonaChangeEventData(
          previousPersona,
          personaId,
          source,
          sessionDuration,
          sessionId,
          profile ? { type: profile.type || 'unknown', focus: profile.focus || 'unknown' } : undefined,
          config,
          personas,
          personaHistory.length,
          getProfileRecommendation() === personaId
        );

        // Track com dados completos
        await trackEvent('persona_change', analyticsData);

        // Track tempo de sessão da persona anterior se aplicável
        if (previousPersona && sessionDuration > 0) {
          await trackEvent('persona_session_duration', {
            personaId: previousPersona,
            duration: sessionDuration,
            sessionId,
            switchedTo: personaId
          });
        }
      }

      // Persistir mudanças se necessário
      if (enableLocalStorage) {
        try {
          safeLocalStorage()?.setItem('selectedPersona', personaId);
          safeLocalStorage()?.setItem('personaLastChanged', new Date().toISOString());
        } catch (error) {
          trackLocalStorageError('localstorage_save_error_setpersona', error);
          ErrorMonitorService.getInstance().logError(error as Error, {
            component: 'PersonaContext',
            severity: 'low',
            context: { action: 'localStorage.setItem', persona: personaId }
          });
        }
      }

      // Atualizar URL se necessário
      if (enableURLSync && source !== 'url') {
        updatePersonaInURL(personaId);
      }

      trackPersonaChangeSuccess(personaId);

    } catch (error) {
      trackPersonaChangeError(error);

      // Analytics de erro
      if (enableAnalytics && trackEvent) {
        await trackEvent('persona_change_error', {
          from: previousPersona,
          attemptedTo: personaId,
          source,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          timestamp: Date.now()
        });
      }

      throw error;
    }
  }, [
    currentPersona,
    isPersonaAvailable,
    enableAnalytics,
    trackEvent,
    sessionStartTime,
    getPersonaConfig,
    profile,
    personas,
    personaHistory,
    getProfileRecommendation,
    enableLocalStorage,
    enableURLSync,
    updatePersonaInURL,
    setExplicitPersona
  ]);

  const clearPersona = useCallback(() => {
    const previousPersona = currentPersona;

    try {
      setExplicitPersona(null);

      // Limpar localStorage
      if (enableLocalStorage) {
        try {
          safeLocalStorage()?.removeItem('selectedPersona');
        } catch (error) {
          trackLocalStorageError('localstorage_clear_error', error);
        }
      }

      // Track analytics
      if (enableAnalytics && trackEvent && previousPersona) {
        trackEvent('persona_cleared', {
          from: previousPersona,
          timestamp: Date.now()
        });
      }

      trackPersonaCleared(previousPersona);
    } catch (error) {
      trackPersonaClearError(error);
      throw error;
    }
  }, [currentPersona, enableLocalStorage, enableAnalytics, trackEvent, setExplicitPersona]);

  const refreshPersonas = useCallback(async () => {
    try {
      // Esta seria a lógica para recarregar personas do servidor
      // Por enquanto, apenas log
      // trackPersonasRefreshStarted(); // Comentado pois não está sendo usado no momento

      // Em uma implementação real, você faria:
      // await refetchPersonas();

    } catch (error) {
      // trackPersonasRefreshError(error); // Comentado pois não está sendo usado no momento
      throw error;
    }
  }, []);

  return {
    setPersona,
    clearPersona,
    refreshPersonas
  };
}