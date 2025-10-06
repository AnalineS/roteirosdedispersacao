/**
 * Hook centralizado para gerenciar personas do backend
 *
 * REFATORAÇÃO: Adicionado guard contra chamadas concorrentes
 * CRITICAL FIX: Issue #221 - ERR_INSUFFICIENT_RESOURCES
 *
 * Anteriormente: Múltiplos componentes chamavam este hook independentemente,
 * causando 3+ requisições simultâneas ao /api/v1/personas
 *
 * Agora: Guard de concorrência + inicialização única previne overflow
 */

import { useState, useEffect, useRef } from 'react';
import { getPersonaConfigs, type Persona, type PersonasResponse } from '@/services/api';
import { filterValidPersonas } from '@/constants/avatars';
import { PersonasCache } from '@/utils/apiCache';
import type { PersonaConfig } from '@/types/personas';

export function usePersonas() {
  const [personas, setPersonas] = useState<Record<string, PersonaConfig>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // CRITICAL: Guards to prevent concurrent loads and infinite loops
  const isInitialized = useRef(false);
  const loadingRef = useRef(false);

  useEffect(() => {
    async function loadPersonas() {
      // Prevent re-initialization
      if (isInitialized.current) {
        console.log('[usePersonas] Already initialized, skipping load');
        return;
      }

      // Prevent concurrent API calls
      if (loadingRef.current) {
        console.log('[usePersonas] Load already in progress, skipping duplicate call');
        return;
      }

      try {
        loadingRef.current = true;
        isInitialized.current = true;
        setLoading(true);
        setError(null);

        console.log('[usePersonas] Starting persona load...');

        // Check cache first
        const cachedPersonas = await PersonasCache.get();
        if (cachedPersonas) {
          console.log('[usePersonas] Cache hit, personas count:', Object.keys(cachedPersonas).length);
          setPersonas(cachedPersonas as Record<string, PersonaConfig>);
          setLoading(false);
          loadingRef.current = false;
          return;
        }

        console.log('[usePersonas] No cache, fetching from server...');

        // Fetch from server
        const personasData = await getPersonaConfigs();
        console.log('[usePersonas] Raw data received, keys:', Object.keys(personasData));

        // Filter only personas with configured avatars
        const validPersonas = filterValidPersonas(personasData);
        console.log('[usePersonas] After filter, personas count:', Object.keys(validPersonas).length);
        console.log('[usePersonas] Valid persona IDs:', Object.keys(validPersonas));

        // Save to cache
        await PersonasCache.set(validPersonas);
        setPersonas(validPersonas as Record<string, PersonaConfig>);
        console.log('[usePersonas] Personas set successfully');

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error('[usePersonas] Error loading personas:', errorMessage);

        // Medical system error tracking
        if (typeof process !== 'undefined' && process.stderr) {
          process.stderr.write(`❌ ERRO - Falha ao carregar personas médicas:\n  Error: ${errorMessage}\n\n`);
        }

        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'medical_personas_load_error', {
            event_category: 'medical_error_critical',
            event_label: 'personas_loading_failed',
            custom_parameters: {
              medical_context: 'usePersonas_hook',
              error_type: 'load_failure',
              error_message: errorMessage
            }
          });
        }

        setError(errorMessage);
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    }

    loadPersonas();
  }, []); // Empty deps - run once on mount

  const getPersonaById = (personaId: string): PersonaConfig | null => {
    return personas[personaId] || null;
  };

  const getPersonasList = (): Array<{id: string; persona: PersonaConfig}> => {
    return Object.entries(personas).map(([id, persona]) => ({
      id,
      persona
    }));
  };

  const getValidPersonasCount = (): number => {
    const count = Object.keys(personas).length;
    // Return count or fallback to 2 (Dr. Gasnelio + Gá)
    return count > 0 ? count : 2;
  };

  const refetch = async () => {
    // Prevent concurrent refetch
    if (loadingRef.current) {
      console.log('[usePersonas] Refetch already in progress, skipping');
      return;
    }

    try {
      loadingRef.current = true;
      setLoading(true);
      setError(null);

      const personasData = await getPersonaConfigs();
      const validPersonas = filterValidPersonas(personasData);

      await PersonasCache.set(validPersonas);
      setPersonas(validPersonas as Record<string, PersonaConfig>);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);

      if (typeof process !== 'undefined' && process.stderr) {
        process.stderr.write(`❌ ERRO - Falha ao recarregar personas médicas:\n  Error: ${errorMessage}\n\n`);
      }

      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'medical_personas_load_error', {
          event_category: 'medical_error_critical',
          event_label: 'personas_refetch_failed',
          custom_parameters: {
            medical_context: 'usePersonas_refetch',
            error_type: 'refetch_failure',
            error_message: errorMessage
          }
        });
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  return {
    personas,
    loading,
    error,
    getPersonaById,
    getPersonasList,
    getValidPersonasCount,
    refetch
  };
}
