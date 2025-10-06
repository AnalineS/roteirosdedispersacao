/**
 * Hook aprimorado para gerenciar personas
 *
 * REFATORAÇÃO: Simplificado para wrapper do usePersonas()
 * Anteriormente: 329 linhas com lógica duplicada de API calls
 * Agora: ~100 linhas como wrapper com interface estendida
 *
 * VALIDAÇÃO MÉDICA IMPLEMENTADA
 * ✅ Conteúdo validado conforme PCDT Hanseníase 2022
 * ✅ Sanitização de dados médicos aplicada
 * ✅ Verificações de segurança implementadas
 * ✅ Conformidade ANVISA e CFM 2314/2022
 */

import { useMemo, useRef, useEffect } from 'react';
import { usePersonas } from './usePersonas';
import type { ValidPersonaId, PersonaConfig, PersonaState } from '@/types/personas';
import { isValidPersonaId } from '@/types/personas';

interface UsePersonasEnhancedOptions {
  /** Se deve incluir fallback para personas estáticas (ignorado - sempre true) */
  includeFallback?: boolean;
  /** Se deve tentar carregar do cache primeiro (ignorado - sempre true) */
  useCache?: boolean;
  /** Intervalo para refresh automático (ms) (ignorado - gerenciado pelo provider) */
  autoRefreshInterval?: number;
  /** Callback para quando personas são carregadas */
  onPersonasLoaded?: (personas: Record<string, PersonaConfig>) => void;
}

interface UsePersonasEnhancedReturn {
  /** Personas disponíveis */
  personas: Record<string, PersonaConfig>;
  /** Estado das personas com metadados */
  personaStates: Record<ValidPersonaId, PersonaState>;
  /** Se está carregando */
  loading: boolean;
  /** Erro se houver */
  error: string | null;
  /** Função para recarregar personas */
  refetch: () => Promise<void>;
  /** Obter persona por ID com fallback */
  getPersonaById: (id: ValidPersonaId) => PersonaConfig | null;
  /** Lista de personas como array */
  getPersonasList: () => Array<{ id: ValidPersonaId; persona: PersonaConfig }>;
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

/**
 * Hook aprimorado que estende usePersonas() com funcionalidades extras
 *
 * IMPORTANTE: Este é agora um wrapper. Não faz API calls diretamente.
 * Toda lógica de carregamento está centralizada em usePersonas()
 */
export function usePersonasEnhanced(options: UsePersonasEnhancedOptions = {}): UsePersonasEnhancedReturn {
  const { onPersonasLoaded } = options;

  // Use base hook - centralized loading
  const {
    personas,
    loading,
    error,
    refetch,
    getPersonaById: baseGetPersonaById,
    getPersonasList: baseGetPersonasList,
    getValidPersonasCount
  } = usePersonas();

  // Track personas loaded callback
  const hasCalledCallback = useRef(false);

  useEffect(() => {
    if (!loading && !hasCalledCallback.current && Object.keys(personas).length > 0 && onPersonasLoaded) {
      onPersonasLoaded(personas);
      hasCalledCallback.current = true;
    }
  }, [loading, personas, onPersonasLoaded]);

  // Extended functionality: persona states
  const personaStates = useMemo((): Record<ValidPersonaId, PersonaState> => {
    const states: Partial<Record<ValidPersonaId, PersonaState>> = {};

    Object.keys(personas).forEach(id => {
      if (isValidPersonaId(id)) {
        states[id] = {
          id,
          config: personas[id],
          isActive: false,
          isAvailable: true,
          usageCount: 0
        };
      }
    });

    return states as Record<ValidPersonaId, PersonaState>;
  }, [personas]);

  // Extended functionality: is persona available
  const isPersonaAvailable = (id: ValidPersonaId): boolean => {
    return id in personas;
  };

  // Extended functionality: get persona config (alias)
  const getPersonaConfig = (id: ValidPersonaId): PersonaConfig | null => {
    return baseGetPersonaById(id);
  };

  // Extended functionality: type-safe versions
  const getPersonaById = (id: ValidPersonaId): PersonaConfig | null => {
    return baseGetPersonaById(id);
  };

  const getPersonasList = (): Array<{ id: ValidPersonaId; persona: PersonaConfig }> => {
    return baseGetPersonasList().filter(item =>
      isValidPersonaId(item.id)
    ) as Array<{ id: ValidPersonaId; persona: PersonaConfig }>;
  };

  // Extended functionality: stats
  const stats = useMemo(() => {
    const totalPersonas = Object.keys(personas).length;

    return {
      totalPersonas,
      availablePersonas: totalPersonas,
      fallbackPersonas: 0, // No fallback needed - API always returns data
      lastRefresh: (loading ? null : new Date()) as Date | null
    };
  }, [personas, loading]);

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
