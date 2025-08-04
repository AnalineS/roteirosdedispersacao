/**
 * Hook para gerenciar personas do backend
 * Conecta diretamente com as personas que usam prompts de IA
 */

import { useState, useEffect } from 'react';
import { getPersonas, type Persona, type PersonasResponse } from '@/services/api';

export function usePersonas() {
  const [personas, setPersonas] = useState<PersonasResponse>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPersonas() {
      try {
        setLoading(true);
        setError(null);
        const personasData = await getPersonas();
        setPersonas(personasData);
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

  return {
    personas,
    loading,
    error,
    getPersonaById,
    getPersonasList,
    refetch: () => {
      setLoading(true);
      loadPersonas();
    }
  };

  async function loadPersonas() {
    try {
      setLoading(true);
      setError(null);
      const personasData = await getPersonas();
      setPersonas(personasData);
    } catch (err) {
      console.error('Erro ao carregar personas:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }
}