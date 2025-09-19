/**
 * Hook para gerenciar personas do backend
 * Conecta diretamente com as personas que usam prompts de IA
 */

import { useState, useEffect } from 'react';
import { getPersonaConfigs, type Persona, type PersonasResponse } from '@/services/api';
import { filterValidPersonas } from '@/constants/avatars';
import { PersonasCache } from '@/utils/apiCache';
import type { PersonaConfig } from '@/types/personas';

export function usePersonas() {
  const [personas, setPersonas] = useState<Record<string, PersonaConfig>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPersonas() {
      try {
        setLoading(true);
        setError(null);
        
        // Verificar cache primeiro
        const cachedPersonas = await PersonasCache.get('personas');
        if (cachedPersonas) {
          setPersonas(cachedPersonas as Record<string, PersonaConfig>);
          setLoading(false);
          return;
        }
        
        // Buscar do servidor se não há cache
        const personasData = await getPersonaConfigs();
        // Filtrar apenas personas com avatares configurados
        const validPersonas = filterValidPersonas(personasData);
        
        // Salvar no cache
        await PersonasCache.set('personas', validPersonas);
        setPersonas(validPersonas);
      } catch (err) {
        // Medical system error - explicit stderr + tracking
        const errorMessage = err instanceof Error ? err.message : String(err);
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
      }
    }

    loadPersonas();
  }, []);

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
    // Retorna contagem ou fallback para 2 (Dr. Gasnelio + Gá)
    return count > 0 ? count : 2;
  };

  return {
    personas,
    loading,
    error,
    getPersonaById,
    getPersonasList,
    getValidPersonasCount,
    refetch: async () => {
      try {
        setLoading(true);
        setError(null);
        const personasData = await getPersonaConfigs();
        const validPersonas = filterValidPersonas(personasData);
        setPersonas(validPersonas);
      } catch (err) {
        // Medical system error - explicit stderr + tracking
        const errorMessage = err instanceof Error ? err.message : String(err);
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
      }
    }
  };

}