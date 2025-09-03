'use client';

import React, { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react';
import { usePersonasEnhanced } from '@/hooks/usePersonasEnhanced';
import { useSafePersonaFromURL, type ValidPersonaId, isValidPersonaId } from '@/hooks/useSafePersonaFromURL';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAnalytics } from '@/hooks/useAnalytics';
import type { 
  PersonaContextValue, 
  PersonaChangeEvent,
  PersonaSource,
  PersonaConfig
} from '@/types/personas';
import { STATIC_PERSONAS } from '@/data/personas';

// ============================================
// CONTEXTO E PROVIDER
// ============================================

const PersonaContext = createContext<PersonaContextValue | null>(null);

interface PersonaProviderProps {
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
  
  // Hook de personas com todas as funcionalidades avançadas
  const { 
    personas, 
    loading: personasLoading, 
    isPersonaAvailable, 
    getPersonaConfig: getPersonaConfigFromHook,
    stats: personaStats 
  } = usePersonasEnhanced({
    includeFallback: true,
    useCache: true,
    autoRefreshInterval: 5 * 60 * 1000, // 5 minutos
    onPersonasLoaded: (personas) => {
      console.log('[PersonaContext] Personas carregadas:', Object.keys(personas).length);
    }
  });

  // Hook de URL com funcionalidades completas
  const { personaFromURL, updatePersonaInURL, hasValidURLPersona, isLoading: urlLoading } = useSafePersonaFromURL({
    availablePersonas: personas,
    updateURL: enableURLSync,
    defaultPersona
  });

  // Estados locais expandidos
  const [currentPersona, setCurrentPersona] = useState<ValidPersonaId | null>(null);
  const [personaHistory, setPersonaHistory] = useState<Array<{
    personaId: ValidPersonaId;
    source: PersonaSource;
    timestamp: Date;
    sessionId: string;
  }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [explicitPersona, setExplicitPersona] = useState<ValidPersonaId | null>(null);
  const [sessionStartTime] = useState(Date.now());

  // ============================================
  // LÓGICA DE RESOLUÇÃO DE PERSONA AVANÇADA
  // ============================================

  // Função para obter persona do localStorage com validação
  const getLocalStoragePersona = useCallback((): ValidPersonaId | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = localStorage.getItem('selectedPersona');
      return stored && isValidPersonaId(stored) && isPersonaAvailable(stored) ? stored : null;
    } catch {
      return null;
    }
  }, [isPersonaAvailable]);

  // Resolver persona com ordem de prioridade completa
  const resolvePersona = useCallback((): {
    persona: ValidPersonaId | null;
    source: PersonaSource;
    confidence: number;
  } => {
    // 1. URL (prioridade máxima) - Confiança: 1.0
    if (hasValidURLPersona && personaFromURL && isPersonaAvailable(personaFromURL)) {
      return { persona: personaFromURL, source: 'url', confidence: 1.0 };
    }

    // 2. Seleção explícita do usuário - Confiança: 0.95
    if (explicitPersona && isPersonaAvailable(explicitPersona)) {
      return { persona: explicitPersona, source: 'explicit', confidence: 0.95 };
    }

    // 3. Perfil do usuário salvo - Confiança: 0.8
    if (profile?.selectedPersona && isValidPersonaId(profile.selectedPersona) && isPersonaAvailable(profile.selectedPersona)) {
      return { persona: profile.selectedPersona, source: 'profile', confidence: 0.8 };
    }

    // 4. localStorage (compatibilidade) - Confiança: 0.6
    const localStoragePersona = getLocalStoragePersona();
    if (localStoragePersona) {
      return { persona: localStoragePersona, source: 'localStorage', confidence: 0.6 };
    }

    // 5. Recomendação baseada no perfil - Confiança: 0.7
    const profileRecommendation = getProfileRecommendation();
    if (profileRecommendation && isValidPersonaId(profileRecommendation) && isPersonaAvailable(profileRecommendation)) {
      return { persona: profileRecommendation, source: 'profile', confidence: 0.7 };
    }

    // 6. Padrão inteligente baseado no histórico - Confiança: 0.4
    if (personaHistory.length > 0) {
      const mostUsed = personaHistory
        .reduce((acc, entry) => {
          acc[entry.personaId] = (acc[entry.personaId] || 0) + 1;
          return acc;
        }, {} as Record<ValidPersonaId, number>);
      
      const mostUsedPersona = Object.entries(mostUsed)
        .sort(([,a], [,b]) => b - a)[0]?.[0] as ValidPersonaId;
      
      if (mostUsedPersona && isPersonaAvailable(mostUsedPersona)) {
        return { persona: mostUsedPersona, source: 'default', confidence: 0.4 };
      }
    }

    // 7. Fallback final - Confiança: 0.2
    if (isPersonaAvailable(defaultPersona)) {
      return { persona: defaultPersona, source: 'default', confidence: 0.2 };
    }

    // 8. Última tentativa - qualquer persona disponível
    const firstAvailable = Object.keys(personas).find(id => isValidPersonaId(id) && isPersonaAvailable(id as ValidPersonaId));
    if (firstAvailable) {
      return { persona: firstAvailable as ValidPersonaId, source: 'default', confidence: 0.1 };
    }

    return { persona: null, source: 'default', confidence: 0 };
  }, [
    hasValidURLPersona,
    personaFromURL,
    explicitPersona,
    profile?.selectedPersona,
    getLocalStoragePersona,
    getProfileRecommendation,
    personaHistory,
    defaultPersona,
    personas,
    isPersonaAvailable
  ]);

  // Estado derivado com informações completas
  const error = useMemo(() => {
    if (isLoading) return null;
    if (!currentPersona) return 'Nenhuma persona disponível';
    if (!isPersonaAvailable(currentPersona)) return 'Persona atual não está mais disponível';
    return null;
  }, [isLoading, currentPersona, isPersonaAvailable]);

  // ============================================
  // EFEITO PRINCIPAL DE RESOLUÇÃO
  // ============================================

  // Efeito para resolver persona com toda a lógica avançada
  useEffect(() => {
    const isLoadingData = personasLoading || urlLoading;
    
    if (isLoadingData) {
      setIsLoading(true);
      return;
    }

    const resolved = resolvePersona();
    const { persona: resolvedPersona, source, confidence } = resolved;
    
    if (resolvedPersona !== currentPersona) {
      console.log(`[PersonaContext] Persona resolved: ${resolvedPersona} (${source}, confidence: ${confidence})`);
      
      setCurrentPersona(resolvedPersona);
      
      // Adicionar ao histórico com metadados completos
      if (resolvedPersona) {
        const sessionId = crypto.randomUUID();
        setPersonaHistory(prev => {
          const newEntry = {
            personaId: resolvedPersona,
            source,
            timestamp: new Date(),
            sessionId
          };
          
          return [...prev, newEntry].slice(-maxHistoryEntries);
        });

        // Persistir mudança no localStorage se necessário
        if (enableLocalStorage && source !== 'localStorage') {
          try {
            localStorage.setItem('selectedPersona', resolvedPersona);
          } catch (error) {
            console.warn('[PersonaContext] Erro ao salvar no localStorage:', error);
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
    updatePersonaInURL,
    sessionStartTime
  ]);

  // ============================================
  // AÇÕES DO CONTEXTO AVANÇADAS
  // ============================================

  // Obter configuração de persona com fallback completo
  const getPersonaConfig = useCallback((personaId: ValidPersonaId): PersonaConfig | null => {
    // Usar hook avançado primeiro
    const configFromHook = getPersonaConfigFromHook(personaId);
    if (configFromHook) return configFromHook;

    // Fallback para personas estáticas
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
        response_format: staticPersona.response_format
      };
    }

    return null;
  }, [getPersonaConfigFromHook]);

  // Ação avançada para setPersona com analytics completas
  const setPersona = useCallback(async (personaId: ValidPersonaId, source: PersonaSource = 'explicit') => {
    const previousPersona = currentPersona;
    const startTime = Date.now();
    const sessionId = crypto.randomUUID();

    try {
      // Validação rigorosa
      if (!isPersonaAvailable(personaId)) {
        console.warn(`[PersonaContext] Persona ${personaId} não está disponível`);
        throw new Error(`Persona ${personaId} não está disponível`);
      }

      // Log detalhado da mudança
      console.log(`[PersonaContext] Changing persona: ${previousPersona} → ${personaId} (${source})`);

      // Definir persona explicitamente
      setExplicitPersona(personaId);

      // Analytics avançadas se habilitado
      if (enableAnalytics && trackEvent) {
        const sessionDuration = previousPersona ? Date.now() - sessionStartTime : 0;
        const config = getPersonaConfig(personaId);
        
        const changeEvent: PersonaChangeEvent = {
          type: 'persona_change',
          data: {
            from: previousPersona,
            to: personaId,
            source,
            timestamp: new Date(),
            duration: sessionDuration,
            sessionId,
            userProfile: {
              type: profile?.type || 'unknown',
              focus: profile?.focus || 'unknown'
            }
          }
        };

        // Track com dados completos
        await trackEvent('persona_change', {
          ...changeEvent.data,
          personaConfig: {
            name: config?.name,
            target_audience: config?.target_audience,
            expertise: config?.expertise
          },
          context: {
            totalPersonasAvailable: Object.keys(personas).length,
            historyLength: personaHistory.length,
            wasRecommended: getProfileRecommendation() === personaId,
            userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown'
          }
        });

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
          localStorage.setItem('selectedPersona', personaId);
          localStorage.setItem('personaLastChanged', new Date().toISOString());
        } catch (error) {
          console.warn('[PersonaContext] Erro ao salvar no localStorage:', error);
        }
      }

      // Atualizar URL se necessário
      if (enableURLSync && source !== 'url') {
        updatePersonaInURL(personaId);
      }

      console.log(`[PersonaContext] ✅ Persona successfully changed to ${personaId}`);

    } catch (error) {
      console.error(`[PersonaContext] ❌ Erro ao alterar persona:`, error);
      
      // Analytics de erro
      if (enableAnalytics && trackEvent) {
        await trackEvent('persona_change_error', {
          from: previousPersona,
          attemptedTo: personaId,
          source,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          timestamp: new Date()
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
    updatePersonaInURL
  ]);

  // Ação para limpar persona
  const clearPersona = useCallback(() => {
    const previousPersona = currentPersona;
    
    try {
      setExplicitPersona(null);
      
      // Limpar localStorage
      if (enableLocalStorage) {
        try {
          localStorage.removeItem('selectedPersona');
        } catch (error) {
          console.warn('[PersonaContext] Erro ao limpar localStorage:', error);
        }
      }
      
      // Track analytics
      if (enableAnalytics && trackEvent && previousPersona) {
        trackEvent('persona_cleared', {
          from: previousPersona,
          timestamp: new Date()
        });
      }

      console.log(`[PersonaContext] Persona cleared (was: ${previousPersona})`);
    } catch (error) {
      console.error(`[PersonaContext] Erro ao limpar persona:`, error);
      throw error;
    }
  }, [currentPersona, enableLocalStorage, enableAnalytics, trackEvent]);

  // Ação para refresh das personas
  const refreshPersonas = useCallback(async () => {
    try {
      // Esta seria a lógica para recarregar personas do servidor
      // Por enquanto, apenas log
      console.log('[PersonaContext] Refreshing personas...');
      
      // Em uma implementação real, você faria:
      // await refetchPersonas();
      
    } catch (error) {
      console.error('[PersonaContext] Erro ao atualizar personas:', error);
      throw error;
    }
  }, []);

  // ============================================
  // EFEITOS
  // ============================================

  // Log de mudanças de persona para debugging
  useEffect(() => {
    if (currentPersona) {
      console.log(`[PersonaContext] Active persona: ${currentPersona}`);
    }
  }, [currentPersona]);

  // Obter recomendação
  const getRecommendedPersona = useCallback((): ValidPersonaId | null => {
    const profileRec = getProfileRecommendation();
    return profileRec && isValidPersonaId(profileRec) ? profileRec : 'ga';
  }, [getProfileRecommendation]);

  // ============================================
  // VALOR DO CONTEXTO
  // ============================================

  const contextValue: PersonaContextValue = useMemo(() => ({
    // Estado
    currentPersona,
    availablePersonas: Object.fromEntries(
      Object.entries(personas || {})
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
    ) as Record<ValidPersonaId, PersonaConfig>,
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

// Hook para obter apenas a persona atual
export function useCurrentPersona(): {
  persona: ValidPersonaId | null;
  config: PersonaConfig | null;
  isLoading: boolean;
} {
  const { currentPersona, getPersonaConfig, isLoading } = usePersonaContext();
  
  return {
    persona: currentPersona,
    config: currentPersona ? getPersonaConfig(currentPersona) : null,
    isLoading
  };
}

// Hook para operações de persona
export function usePersonaActions(): {
  setPersona: (personaId: ValidPersonaId, source?: PersonaSource) => Promise<void>;
  clearPersona: () => void;
  isPersonaAvailable: (personaId: ValidPersonaId) => boolean;
  getRecommendedPersona: () => ValidPersonaId | null;
} {
  const { setPersona, clearPersona, isPersonaAvailable, getRecommendedPersona } = usePersonaContext();
  
  return {
    setPersona,
    clearPersona,
    isPersonaAvailable,
    getRecommendedPersona
  };
}

// Hook para analytics de persona
export function usePersonaAnalytics(): {
  history: Array<{
    personaId: ValidPersonaId;
    source: PersonaSource;
    timestamp: Date;
  }>;
  stats: {
    totalChanges: number;
    mostUsedPersona: ValidPersonaId | null;
    sessionStartPersona: ValidPersonaId | null;
  };
} {
  const { history } = usePersonaContext();
  
  // Calcular estatísticas do histórico
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

// ============================================
// EXPORTAÇÕES
// ============================================

export default PersonaContext;
export type { PersonaProviderProps };