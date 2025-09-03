'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePersonaFromURL, type ValidPersonaId, isValidPersonaId } from './usePersonaFromURL';
import { usePersonasEnhanced } from './usePersonasEnhanced';
import { useUserProfile } from './useUserProfile';
import type { PersonasResponse } from '@/services/api';

// Ordem de prioridade para seleção de persona
enum PersonaPriority {
  URL = 1,           // Mais alta prioridade
  EXPLICIT = 2,      // Seleção explícita do usuário
  PROFILE = 3,       // Persona salva no perfil do usuário
  LOCAL_STORAGE = 4, // localStorage (compatibilidade)
  DEFAULT = 5        // Menor prioridade
}

interface PersonaSource {
  persona: ValidPersonaId;
  priority: PersonaPriority;
  source: 'url' | 'explicit' | 'profile' | 'localStorage' | 'default';
  timestamp?: number;
}

interface UsePersonaStateOptions {
  /** Persona padrão quando nenhuma fonte está disponível */
  defaultPersona?: ValidPersonaId;
  /** Se deve persistir mudanças no localStorage */
  persistToLocalStorage?: boolean;
  /** Se deve sincronizar com URL */
  syncWithURL?: boolean;
}

interface UsePersonaStateReturn {
  /** Persona atualmente ativa */
  currentPersona: ValidPersonaId | null;
  /** Todas as fontes de persona disponíveis */
  availablePersonas: PersonasResponse;
  /** Se está carregando dados */
  isLoading: boolean;
  /** Fonte atual da persona */
  currentSource: PersonaSource | null;
  /** Histórico de mudanças de persona */
  personaHistory: PersonaSource[];
  /** Alterar persona explicitamente */
  setPersona: (personaId: ValidPersonaId, source?: 'explicit' | 'profile') => void;
  /** Limpar persona (volta para padrão) */
  clearPersona: () => void;
  /** Verificar se persona está disponível */
  isPersonaAvailable: (personaId: ValidPersonaId) => boolean;
  /** Obter recomendação baseada no perfil do usuário */
  getRecommendedPersona: () => ValidPersonaId | null;
  /** Estatísticas de uso */
  stats: {
    totalChanges: number;
    mostUsedPersona: ValidPersonaId | null;
    sessionStartPersona: ValidPersonaId | null;
  };
}

const STORAGE_KEY = 'selectedPersona';

export function usePersonaState(options: UsePersonaStateOptions = {}): UsePersonaStateReturn {
  const {
    defaultPersona = 'ga',
    persistToLocalStorage = true,
    syncWithURL = true
  } = options;

  // Hooks de dados
  const { personas, loading: personasLoading } = usePersonasEnhanced();
  const { profile, getRecommendedPersona: getProfileRecommendation } = useUserProfile();
  const { personaFromURL, updatePersonaInURL, hasValidURLPersona } = usePersonaFromURL({
    availablePersonas: personas,
    updateURL: syncWithURL
  });

  // Estados
  const [currentPersona, setCurrentPersona] = useState<ValidPersonaId | null>(null);
  const [currentSource, setCurrentSource] = useState<PersonaSource | null>(null);
  const [personaHistory, setPersonaHistory] = useState<PersonaSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [explicitPersona, setExplicitPersona] = useState<ValidPersonaId | null>(null);

  // Verificar disponibilidade de persona
  const isPersonaAvailable = useCallback((personaId: ValidPersonaId): boolean => {
    return personas && personaId in personas;
  }, [personas]);

  // Obter persona do localStorage
  const getLocalStoragePersona = useCallback((): ValidPersonaId | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored && isValidPersonaId(stored) ? stored : null;
    } catch {
      return null;
    }
  }, []);

  // Resolver persona baseado na ordem de prioridade
  const resolvePersona = useCallback((): PersonaSource | null => {
    const now = Date.now();
    const sources: PersonaSource[] = [];

    // 1. URL (maior prioridade)
    if (hasValidURLPersona && personaFromURL && isPersonaAvailable(personaFromURL)) {
      sources.push({
        persona: personaFromURL,
        priority: PersonaPriority.URL,
        source: 'url',
        timestamp: now
      });
    }

    // 2. Seleção explícita do usuário
    if (explicitPersona && isPersonaAvailable(explicitPersona)) {
      sources.push({
        persona: explicitPersona,
        priority: PersonaPriority.EXPLICIT,
        source: 'explicit',
        timestamp: now
      });
    }

    // 3. Perfil do usuário
    if (profile?.selectedPersona && isValidPersonaId(profile.selectedPersona) && isPersonaAvailable(profile.selectedPersona)) {
      sources.push({
        persona: profile.selectedPersona,
        priority: PersonaPriority.PROFILE,
        source: 'profile',
        timestamp: now
      });
    }

    // 4. localStorage (compatibilidade)
    const localStoragePersona = getLocalStoragePersona();
    if (localStoragePersona && isPersonaAvailable(localStoragePersona)) {
      sources.push({
        persona: localStoragePersona,
        priority: PersonaPriority.LOCAL_STORAGE,
        source: 'localStorage',
        timestamp: now
      });
    }

    // 5. Padrão
    if (isPersonaAvailable(defaultPersona)) {
      sources.push({
        persona: defaultPersona,
        priority: PersonaPriority.DEFAULT,
        source: 'default',
        timestamp: now
      });
    }

    // Retornar fonte com maior prioridade
    return sources.sort((a, b) => a.priority - b.priority)[0] || null;
  }, [
    hasValidURLPersona,
    personaFromURL,
    explicitPersona,
    profile?.selectedPersona,
    getLocalStoragePersona,
    defaultPersona,
    isPersonaAvailable
  ]);

  // Efeito principal de resolução
  useEffect(() => {
    if (personasLoading) return;

    const resolved = resolvePersona();
    
    if (resolved) {
      setCurrentPersona(resolved.persona);
      setCurrentSource(resolved);
      
      // Adicionar ao histórico se for diferente da atual
      setPersonaHistory(prev => {
        const latest = prev[prev.length - 1];
        if (!latest || latest.persona !== resolved.persona || latest.source !== resolved.source) {
          return [...prev, resolved].slice(-10); // Manter últimas 10 mudanças
        }
        return prev;
      });
    }

    setIsLoading(false);
  }, [resolvePersona, personasLoading]);

  // Persistir mudanças
  useEffect(() => {
    if (!currentPersona || !persistToLocalStorage) return;

    try {
      localStorage.setItem(STORAGE_KEY, currentPersona);
    } catch (error) {
      console.warn('Erro ao salvar persona no localStorage:', error);
    }
  }, [currentPersona, persistToLocalStorage]);

  // Sincronizar com URL quando persona muda
  useEffect(() => {
    if (!currentPersona || !syncWithURL) return;

    // Apenas atualizar URL se a fonte atual não for URL (evitar loops)
    if (currentSource?.source !== 'url') {
      updatePersonaInURL(currentPersona);
    }
  }, [currentPersona, syncWithURL, updatePersonaInURL, currentSource]);

  // Função para alterar persona explicitamente
  const setPersona = useCallback((personaId: ValidPersonaId, source: 'explicit' | 'profile' = 'explicit') => {
    if (!isPersonaAvailable(personaId)) {
      console.warn(`Persona ${personaId} não está disponível`);
      return;
    }

    if (source === 'explicit') {
      setExplicitPersona(personaId);
    }

    // Atualizar URL se necessário
    if (syncWithURL) {
      updatePersonaInURL(personaId);
    }
  }, [isPersonaAvailable, syncWithURL, updatePersonaInURL]);

  // Função para limpar persona
  const clearPersona = useCallback(() => {
    setExplicitPersona(null);
    
    if (persistToLocalStorage) {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (error) {
        console.warn('Erro ao limpar persona do localStorage:', error);
      }
    }
  }, [persistToLocalStorage]);

  // Obter recomendação
  const getRecommendedPersona = useCallback((): ValidPersonaId | null => {
    const profileRecommendation = getProfileRecommendation();
    return profileRecommendation && isValidPersonaId(profileRecommendation) ? profileRecommendation : null;
  }, [getProfileRecommendation]);

  // Calcular estatísticas
  const stats = {
    totalChanges: personaHistory.length,
    mostUsedPersona: (() => {
      if (personaHistory.length === 0) return null;
      
      const counts = personaHistory.reduce((acc, curr) => {
        acc[curr.persona] = (acc[curr.persona] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const mostUsed = Object.entries(counts).sort(([,a], [,b]) => b - a)[0];
      return mostUsed?.[0] as ValidPersonaId || null;
    })(),
    sessionStartPersona: personaHistory[0]?.persona || null
  };

  return {
    currentPersona,
    availablePersonas: personas,
    isLoading,
    currentSource,
    personaHistory,
    setPersona,
    clearPersona,
    isPersonaAvailable,
    getRecommendedPersona,
    stats
  };
}