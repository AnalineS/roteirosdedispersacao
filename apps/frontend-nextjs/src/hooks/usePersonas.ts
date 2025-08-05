/**
 * Hook para gerenciar personas do backend
 * Conecta diretamente com as personas que usam prompts de IA
 */

import { useState, useEffect } from 'react';
import { getPersonas, type Persona, type PersonasResponse } from '@/services/api';
import { filterValidPersonas } from '@/constants/avatars';
import { PersonasCache } from '@/utils/apiCache';

export function usePersonas() {
  const [personas, setPersonas] = useState<PersonasResponse>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPersonas() {
      try {
        setLoading(true);
        setError(null);
        
        // Verificar cache primeiro
        const cachedPersonas = PersonasCache.get();
        if (cachedPersonas) {
          setPersonas(cachedPersonas);
          setLoading(false);
          return;
        }
        
        // Buscar do servidor se não há cache
        const personasData = await getPersonas();
        // Filtrar apenas personas com avatares configurados
        const validPersonas = filterValidPersonas(personasData);
        
        // Salvar no cache
        PersonasCache.set(validPersonas);
        setPersonas(validPersonas);
      } catch (err) {
        console.error('Erro ao carregar personas:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    }

    loadPersonas();
  }, []);

  const getPersonaById = (personaId: string): Persona | null => {
    return personas[personaId] || null;
  };

  const getPersonasList = (): Array<{id: string; persona: Persona}> => {
    return Object.entries(personas).map(([id, persona]) => ({
      id,
      persona
    }));
  };
  
  const getValidPersonasCount = (): number => {
    return Object.keys(personas).length;
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
        const personasData = await getPersonas();
        const validPersonas = filterValidPersonas(personasData);
        setPersonas(validPersonas);
      } catch (err) {
        console.error('Erro ao carregar personas:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    }
  };

}