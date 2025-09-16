/**
 * Hook aprimorado para gerenciar personas com estado ativo
 * Integra com o novo sistema unificado de personas
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getPersonas, type Persona, type PersonasResponse } from '@/services/api';
import { filterValidPersonas } from '@/constants/avatars';
import { PersonasCache } from '@/utils/apiCache';
import { STATIC_PERSONAS } from '@/data/personas';
import type { ValidPersonaId, PersonaConfig, PersonaState } from '@/types/personas';
import { isValidPersonaId } from '@/types/personas';

interface UsePersonasEnhancedOptions {
  /** Se deve incluir fallback para personas estáticas */
  includeFallback?: boolean;
  /** Se deve tentar carregar do cache primeiro */
  useCache?: boolean;
  /** Intervalo para refresh automático (ms) */
  autoRefreshInterval?: number;
  /** Callback para quando personas são carregadas */
  onPersonasLoaded?: (personas: PersonasResponse) => void;
}

interface UsePersonasEnhancedReturn {
  /** Personas disponíveis */
  personas: PersonasResponse;
  /** Estado das personas com metadados */
  personaStates: Record<ValidPersonaId, PersonaState>;
  /** Se está carregando */
  loading: boolean;
  /** Erro se houver */
  error: string | null;
  /** Função para recarregar personas */
  refetch: () => Promise<void>;
  /** Obter persona por ID com fallback */
  getPersonaById: (id: ValidPersonaId) => Persona | null;
  /** Lista de personas como array */
  getPersonasList: () => Array<{ id: ValidPersonaId; persona: Persona }>;
  /** Contador de personas válidas */
  getValidPersonasCount: () => number;
  /** Verificar se persona está disponível */
  isPersonaAvailable: (id: ValidPersonaId) => boolean;
  /** Obter configuração completa de persona */
  getPersonaConfig: (id: ValidPersonaId) => PersonaConfig | null;
  /** Estatísticas das personas */
  stats: {
    totalPersonas: number;
    availablePersonas: number;
    fallbackPersonas: number;
    lastRefresh: Date | null;
  };
}

export function usePersonasEnhanced(options: UsePersonasEnhancedOptions = {}): UsePersonasEnhancedReturn {
  const {
    includeFallback = true,
    useCache = true,
    autoRefreshInterval,
    onPersonasLoaded
  } = options;

  // Estados
  const [personas, setPersonas] = useState<PersonasResponse>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Função para carregar personas
  const loadPersonas = useCallback(async (fromCache: boolean = true) => {
    try {
      setLoading(true);
      setError(null);
      
      let personasData: PersonasResponse = {};

      if (fromCache && useCache) {
        // Verificar cache primeiro
        const cachedPersonas = await PersonasCache.get('personas');
        if (cachedPersonas) {
          personasData = cachedPersonas as PersonasResponse;
          setPersonas(personasData);
          setLastRefresh(new Date());
          
          // Se tem cache, ainda tenta atualizar em background
          if (fromCache) {
            loadPersonas(false); // Reload sem cache em background
            setLoading(false);
            return;
          }
        }
      }

      if (Object.keys(personasData).length === 0) {
        // Buscar do servidor
        try {
          personasData = await getPersonas();
          // Filtrar apenas personas com avatares configurados
          const validPersonas = filterValidPersonas(personasData);
          
          // Salvar no cache
          if (useCache) {
            await PersonasCache.set('personas', validPersonas);
          }
          
          personasData = validPersonas;
        } catch (serverError) {
          console.warn('Erro ao carregar personas do servidor:', serverError);
          
          // Se falhou e deve incluir fallback, usar personas estáticas
          if (includeFallback) {
            console.log('Usando personas estáticas como fallback');
            personasData = STATIC_PERSONAS as PersonasResponse;
          } else {
            throw serverError;
          }
        }
      }

      setPersonas(personasData);
      setLastRefresh(new Date());
      
      // Callback de sucesso
      if (onPersonasLoaded) {
        onPersonasLoaded(personasData);
      }

    } catch (err) {
      console.error('Erro ao carregar personas:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      
      // Em caso de erro, usar personas estáticas se disponível
      if (includeFallback && Object.keys(personas).length === 0) {
        setPersonas(STATIC_PERSONAS as PersonasResponse);
        setError(null); // Limpar erro se fallback funcionou
      }
    } finally {
      setLoading(false);
    }
  }, [useCache, includeFallback, onPersonasLoaded]);

  // Efeito para carregar personas inicialmente
  useEffect(() => {
    loadPersonas();
  }, [loadPersonas]);

  // Efeito para auto-refresh
  useEffect(() => {
    if (!autoRefreshInterval) return;

    const interval = setInterval(() => {
      loadPersonas(false); // Sempre do servidor para refresh
    }, autoRefreshInterval);

    return () => clearInterval(interval);
  }, [autoRefreshInterval, loadPersonas]);

  // ============================================
  // FUNÇÕES DERIVADAS
  // ============================================

  const getPersonaById = useCallback((personaId: ValidPersonaId): Persona | null => {
    return personas[personaId] || null;
  }, [personas]);

  const getPersonasList = useCallback((): Array<{id: ValidPersonaId; persona: Persona}> => {
    return Object.entries(personas)
      .filter(([id]) => isValidPersonaId(id))
      .map(([id, persona]) => ({
        id: id as ValidPersonaId,
        persona
      }));
  }, [personas]);
  
  const getValidPersonasCount = useCallback((): number => {
    const count = Object.keys(personas).length;
    console.log('[usePersonasEnhanced] getValidPersonasCount:', { personas, count });
    return count > 0 ? count : 2; // Fallback para Dr. Gasnelio + Gá
  }, [personas]);

  const isPersonaAvailable = useCallback((personaId: ValidPersonaId): boolean => {
    return personaId in personas;
  }, [personas]);

  const getPersonaConfig = useCallback((personaId: ValidPersonaId): PersonaConfig | null => {
    const persona = personas[personaId];
    if (!persona) return null;

    return {
      id: personaId,
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
    };
  }, [personas]);

  // Estados das personas com metadados
  const personaStates = useMemo((): Record<ValidPersonaId, PersonaState> => {
    const states: Record<ValidPersonaId, PersonaState> = {} as any;
    
    Object.entries(personas).forEach(([id, persona]) => {
      if (isValidPersonaId(id)) {
        const config = getPersonaConfig(id);
        if (config) {
          states[id] = {
            id,
            config,
            isActive: false, // Seria determinado pelo contexto principal
            isAvailable: true,
            usageCount: 0, // Seria obtido de analytics
            lastUsed: undefined // Seria obtido do histórico
          };
        }
      }
    });

    return states;
  }, [personas, getPersonaConfig]);

  // Estatísticas
  const stats = useMemo(() => {
    const totalPersonas = Object.keys(personas).length;
    const availablePersonas = Object.values(personaStates).filter(s => s.isAvailable).length;
    const fallbackPersonas = includeFallback && totalPersonas === 2 ? 2 : 0; // Dr. Gasnelio + Gá

    return {
      totalPersonas,
      availablePersonas,
      fallbackPersonas,
      lastRefresh
    };
  }, [personas, personaStates, includeFallback, lastRefresh]);

  // Função de refetch
  const refetch = useCallback(async () => {
    await loadPersonas(false); // Sempre do servidor
  }, [loadPersonas]);

  return {
    personas,
    personaStates,
    loading,
    error,
    refetch,
    getPersonaById,
    getPersonasList,
    getValidPersonasCount,
    isPersonaAvailable,
    getPersonaConfig,
    stats
  };
}

// Hook compatível com o anterior (para não quebrar código existente)
export function usePersonas() {
  const enhanced = usePersonasEnhanced({ includeFallback: true, useCache: true });
  
  return {
    personas: enhanced.personas,
    loading: enhanced.loading,
    error: enhanced.error,
    getPersonaById: enhanced.getPersonaById,
    getPersonasList: enhanced.getPersonasList,
    getValidPersonasCount: enhanced.getValidPersonasCount,
    refetch: enhanced.refetch
  };
}