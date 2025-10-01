'use client';

import React, { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react';
import { safeLocalStorage, isClientSide } from '@/hooks/useClientStorage';
import { usePersonasEnhanced } from '@/hooks/usePersonasEnhanced';
import { useSafePersonaFromURL, type ValidPersonaId, isValidPersonaId } from '@/hooks/useSafePersonaFromURL';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAnalytics } from '@/hooks/useAnalytics';
import type { PersonaConfig, PersonaSource } from '@/types/personas';

// Use global Window interface from types/analytics.ts

interface PersonaContextValue {
  currentPersona: ValidPersonaId | null;
  availablePersonas: Record<ValidPersonaId, PersonaConfig>;
  isLoading: boolean;
  error: string | null;
  setPersona: (personaId: ValidPersonaId, source?: PersonaSource) => Promise<void>;
  clearPersona: () => void;
  getPersonaConfig: (personaId: ValidPersonaId) => PersonaConfig | null;
  isPersonaAvailable: (personaId: ValidPersonaId) => boolean;
  getRecommendedPersona: () => ValidPersonaId | null;
  history: Array<{
    personaId: ValidPersonaId;
    source: PersonaSource;
    timestamp: Date;
    sessionId?: string;
  }>;
}

const PersonaContext = createContext<PersonaContextValue | null>(null);

export function PersonaProvider({ children }: { children: React.ReactNode }) {
  const { trackEvent } = useAnalytics();
  const { profile, getRecommendedPersona: getProfileRecommendation } = useUserProfile();
  
  // Hook de personas
  const { personas, loading: personasLoading, isPersonaAvailable, getPersonaConfig } = usePersonasEnhanced({
    includeFallback: true,
    useCache: true
  });

  // Hook de URL
  const { personaFromURL, updatePersonaInURL, hasValidURLPersona } = useSafePersonaFromURL({
    availablePersonas: personas,
    updateURL: true
  });

  // Estados
  const [currentPersona, setCurrentPersona] = useState<ValidPersonaId | null>(null);
  const [history, setHistory] = useState<Array<{
    personaId: ValidPersonaId;
    source: PersonaSource;
    timestamp: Date;
    sessionId?: string;
  }>>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [explicitPersona, setExplicitPersona] = useState<ValidPersonaId | null>(null);

  // Lógica de prioridade
  const resolvePersona = useCallback((): ValidPersonaId | null => {
    // 1. URL (prioridade mais alta)
    if (hasValidURLPersona && personaFromURL && isPersonaAvailable(personaFromURL)) {
      return personaFromURL;
    }

    // 2. Seleção explícita
    if (explicitPersona && isPersonaAvailable(explicitPersona)) {
      return explicitPersona;
    }

    // 3. Perfil do usuário
    if (profile?.selectedPersona && isValidPersonaId(profile.selectedPersona) && isPersonaAvailable(profile.selectedPersona)) {
      return profile.selectedPersona;
    }

    // 4. localStorage
    if (typeof window !== 'undefined') {
      try {
        const stored = safeLocalStorage()?.getItem('selectedPersona');
        if (stored && isValidPersonaId(stored) && isPersonaAvailable(stored)) {
          return stored;
        }
      } catch {
        // Ignore localStorage access errors in SSR or restricted environments
      }
    }

    // 5. Padrão
    return isPersonaAvailable('ga') ? 'ga' : (isPersonaAvailable('dr_gasnelio') ? 'dr_gasnelio' : null);
  }, [hasValidURLPersona, personaFromURL, explicitPersona, profile?.selectedPersona, isPersonaAvailable]);

  // Resolver persona quando dados mudarem
  useEffect(() => {
    if (personasLoading) {
      setIsLoading(true);
      return;
    }

    const resolved = resolvePersona();
    if (resolved !== currentPersona) {
      setCurrentPersona(resolved);
      
      // Adicionar ao histórico
      if (resolved) {
        setHistory(prev => [...prev, {
          personaId: resolved,
          source: hasValidURLPersona ? 'url' : (explicitPersona ? 'explicit' : 'default') as PersonaSource,
          timestamp: new Date(),
          sessionId: crypto.randomUUID()
        }].slice(-20));
      }
    }

    setIsLoading(false);
  }, [resolvePersona, personasLoading, currentPersona, hasValidURLPersona, explicitPersona]);

  // Função para alterar persona
  const setPersona = useCallback(async (personaId: ValidPersonaId, source: PersonaSource = 'explicit') => {
    if (!isPersonaAvailable(personaId)) {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'persona_unavailable', {
          event_category: 'persona_context_simple',
          event_label: 'validation_error',
          persona_context: 'persona_unavailable',
          persona_id: String(personaId)
        });
      }
      return;
    }

    setExplicitPersona(personaId);
    updatePersonaInURL(personaId);

    // Persistir no localStorage
    try {
      safeLocalStorage()?.setItem('selectedPersona', personaId);
    } catch {
      // Ignore localStorage write errors
    }

    // Track analytics
    if (trackEvent) {
      trackEvent('persona_change', {
        from: currentPersona,
        to: personaId,
        source,
        timestamp: Date.now()
      });
    }
  }, [isPersonaAvailable, updatePersonaInURL, currentPersona, trackEvent]);

  // Função para limpar
  const clearPersona = useCallback(() => {
    setExplicitPersona(null);
    try {
      safeLocalStorage()?.removeItem('selectedPersona');
    } catch {
      // Ignore localStorage remove errors
    }
  }, []);

  // Recomendação
  const getRecommendedPersona = useCallback((): ValidPersonaId | null => {
    const profileRec = getProfileRecommendation();
    return profileRec && isValidPersonaId(profileRec) ? profileRec : 'ga';
  }, [getProfileRecommendation]);

  const error = !isLoading && !currentPersona ? 'Nenhuma persona disponível' : null;

  const contextValue: PersonaContextValue = {
    currentPersona,
    availablePersonas: personas,
    isLoading,
    error,
    setPersona,
    clearPersona,
    getPersonaConfig,
    isPersonaAvailable,
    getRecommendedPersona,
    history
  };

  return (
    <PersonaContext.Provider value={contextValue}>
      {children}
    </PersonaContext.Provider>
  );
}

export function usePersonaContext(): PersonaContextValue {
  const context = useContext(PersonaContext);
  if (!context) {
    throw new Error('usePersonaContext deve ser usado dentro de PersonaProvider');
  }
  return context;
}

export function useCurrentPersona() {
  const { currentPersona, isLoading, getPersonaConfig } = usePersonaContext();
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
  
  const stats = {
    totalChanges: history.length,
    mostUsedPersona: (() => {
      if (history.length === 0) return null;
      
      const counts = history.reduce((acc, entry) => {
        acc[entry.personaId] = (acc[entry.personaId] || 0) + 1;
        return acc;
      }, {} as Record<ValidPersonaId, number>);
      
      const mostUsed = Object.entries(counts).sort(([,a], [,b]) => b - a)[0];
      return (mostUsed?.[0] as ValidPersonaId) || null;
    })(),
    sessionStartPersona: history[0]?.personaId || null
  };
  
  return { history, stats };
}

export default PersonaContext;