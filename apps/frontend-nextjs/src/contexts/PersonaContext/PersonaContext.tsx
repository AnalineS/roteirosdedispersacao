'use client';

import React, { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react';
import { usePersonasEnhanced } from '@/hooks/usePersonasEnhanced';
import { useSafePersonaFromURL, type ValidPersonaId } from '@/hooks/useSafePersonaFromURL';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAnalytics } from '@/hooks/useAnalytics';
import { ErrorMonitorService } from '@/components/monitoring/ErrorMonitor';

import type {
  PersonaContextValue,
  PersonaProviderProps,
  PersonaHistoryEntryInternal,
  ValidPersonaId as ValidPersonaIdType,
  PersonaSource
} from './types';

import {
  getPersonaConfigWithFallback,
  createAvailablePersonasRecord,
  addToPersonaHistory,
  determineErrorState
} from './utils';

import {
  trackPersonasLoaded,
  trackPersonaResolved,
  trackActivePersonaDebug,
  trackLocalStorageError
} from './analytics';

import { usePersonaResolution } from './usePersonaResolution';
import { usePersonaActions } from './usePersonaActions';

// ============================================
// CONTEXTO E PROVIDER
// ============================================

const PersonaContext = createContext<PersonaContextValue | null>(null);

export function PersonaProvider({ children, config = {} }: PersonaProviderProps) {
  const {
    enableAnalytics = true,
    enableURLSync = true,
    enableLocalStorage = true,
    defaultPersona = 'ga',
    maxHistoryEntries = 50
  } = config;

  // Hooks de dados
  const { trackEvent } = useAnalytics();
  const { profile, getRecommendedPersona: getProfileRecommendation } = useUserProfile();

  // Hook de personas com funcionalidades avançadas
  const {
    personas,
    loading: personasLoading,
    isPersonaAvailable,
    getPersonaConfig: getPersonaConfigFromHook
  } = usePersonasEnhanced({
    includeFallback: true,
    useCache: true,
    autoRefreshInterval: 5 * 60 * 1000,
    onPersonasLoaded: (personas) => {
      trackPersonasLoaded(Object.keys(personas).length);
    }
  });

  // Hook de URL com funcionalidades completas
  const {
    personaFromURL,
    updatePersonaInURL,
    hasValidURLPersona,
    isLoading: urlLoading
  } = useSafePersonaFromURL({
    availablePersonas: personas,
    updateURL: enableURLSync,
    defaultPersona
  });

  // Estados locais
  const [currentPersona, setCurrentPersona] = useState<ValidPersonaIdType | null>(null);
  const [personaHistory, setPersonaHistory] = useState<PersonaHistoryEntryInternal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [explicitPersona, setExplicitPersona] = useState<ValidPersonaIdType | null>(null);
  const [sessionStartTime] = useState(Date.now());

  // Hook de resolução de persona
  const { resolvePersona } = usePersonaResolution({
    hasValidURLPersona,
    personaFromURL,
    explicitPersona,
    profileSelectedPersona: profile?.selectedPersona || null,
    isPersonaAvailable,
    getProfileRecommendation,
    personaHistory,
    defaultPersona,
    personas
  });

  // Função para obter configuração de persona
  const getPersonaConfig = useCallback((personaId: ValidPersonaIdType) => {
    return getPersonaConfigWithFallback(personaId, getPersonaConfigFromHook);
  }, [getPersonaConfigFromHook]);

  // Hook de ações de persona
  const { setPersona, clearPersona, refreshPersonas } = usePersonaActions({
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
  });

  // Estado derivado
  const error = useMemo(() => {
    return determineErrorState(isLoading, currentPersona, isPersonaAvailable);
  }, [isLoading, currentPersona, isPersonaAvailable]);

  // ============================================
  // EFEITO PRINCIPAL DE RESOLUÇÃO
  // ============================================

  useEffect(() => {
    const isLoadingData = personasLoading || urlLoading;

    if (isLoadingData) {
      setIsLoading(true);
      return;
    }

    const resolved = resolvePersona();
    const { persona: resolvedPersona, source, confidence } = resolved;

    if (resolvedPersona !== currentPersona) {
      trackPersonaResolved(resolvedPersona, source, confidence);

      setCurrentPersona(resolvedPersona);

      // Adicionar ao histórico
      if (resolvedPersona) {
        const sessionId = crypto.randomUUID();
        setPersonaHistory(prev =>
          addToPersonaHistory(prev, resolvedPersona, source, maxHistoryEntries, sessionId)
        );

        // Persistir mudança no localStorage se necessário
        if (enableLocalStorage && source !== 'localStorage') {
          try {
            localStorage.setItem('selectedPersona', resolvedPersona);
          } catch (error) {
            trackLocalStorageError('localstorage_save_error_initial', error);
            ErrorMonitorService.getInstance().logError(error as Error, {
              component: 'PersonaContext',
              severity: 'low',
              context: { action: 'localStorage.setItem', persona: resolvedPersona }
            });
          }
        }

        // Atualizar URL se necessário
        if (enableURLSync && source !== 'url') {
          updatePersonaInURL(resolvedPersona);
        }
      }
    }

    setIsLoading(false);
  }, [
    resolvePersona,
    personasLoading,
    urlLoading,
    currentPersona,
    maxHistoryEntries,
    enableLocalStorage,
    enableURLSync,
    updatePersonaInURL
  ]);

  // Log de mudanças de persona para debugging
  useEffect(() => {
    if (currentPersona) {
      trackActivePersonaDebug(currentPersona);
    }
  }, [currentPersona]);

  // Obter recomendação
  const getRecommendedPersona = useCallback((): ValidPersonaIdType | null => {
    const profileRec = getProfileRecommendation();
    return profileRec && profileRec in ['ga', 'dr_gasnelio'] ? profileRec as ValidPersonaIdType : 'ga';
  }, [getProfileRecommendation]);

  // ============================================
  // VALOR DO CONTEXTO
  // ============================================

  const contextValue: PersonaContextValue = useMemo(() => ({
    // Estado
    currentPersona,
    availablePersonas: createAvailablePersonasRecord(personas),
    history: personaHistory,
    isLoading,
    error,

    // Ações
    setPersona,
    clearPersona,
    getPersonaConfig,
    isPersonaAvailable,
    getRecommendedPersona,
    refreshPersonas
  }), [
    currentPersona,
    personas,
    personaHistory,
    isLoading,
    error,
    setPersona,
    clearPersona,
    getPersonaConfig,
    isPersonaAvailable,
    getRecommendedPersona,
    refreshPersonas
  ]);

  return (
    <PersonaContext.Provider value={contextValue}>
      {children}
    </PersonaContext.Provider>
  );
}

// ============================================
// HOOK PARA USAR O CONTEXTO
// ============================================

export function usePersonaContext(): PersonaContextValue {
  const context = useContext(PersonaContext);

  if (!context) {
    throw new Error('usePersonaContext deve ser usado dentro de um PersonaProvider');
  }

  return context;
}

// ============================================
// HOOKS ESPECIALIZADOS
// ============================================

export function useCurrentPersona() {
  const { currentPersona, getPersonaConfig, isLoading } = usePersonaContext();

  return {
    persona: currentPersona,
    config: currentPersona ? getPersonaConfig(currentPersona) : null,
    isLoading
  };
}

export function usePersonaActions() {
  const { setPersona, clearPersona, isPersonaAvailable, getRecommendedPersona } = usePersonaContext();

  return {
    setPersona,
    clearPersona,
    isPersonaAvailable,
    getRecommendedPersona
  };
}

export function usePersonaAnalytics() {
  const { history } = usePersonaContext();

  // Calcular estatísticas do histórico
  const stats = {
    totalChanges: history.length,
    mostUsedPersona: (() => {
      if (history.length === 0) return null;

      const counts = history.reduce((acc, entry) => {
        acc[entry.personaId] = (acc[entry.personaId] || 0) + 1;
        return acc;
      }, {} as Record<ValidPersonaIdType, number>);

      const mostUsed = Object.entries(counts).sort(([,a], [,b]) => b - a)[0];
      return (mostUsed?.[0] as ValidPersonaIdType) || null;
    })(),
    sessionStartPersona: history[0]?.personaId || null
  };

  return { history, stats };
}

export default PersonaContext;