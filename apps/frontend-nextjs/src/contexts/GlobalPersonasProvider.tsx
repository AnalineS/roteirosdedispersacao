'use client';

/**
 * Global Personas Provider - Single Source of Truth
 *
 * CRITICAL FIX: Issue #221 - ERR_INSUFFICIENT_RESOURCES
 *
 * PROBLEM: usePersonas() hook creates separate instances per component
 * → Each instance has its own useRef guards
 * → Guards don't prevent calls across different hook instances
 * → Result: 5 components = 5 simultaneous API calls
 *
 * SOLUTION: Global provider with shared state
 * → Single initialization for entire application
 * → All components consume same data via context
 * → Guaranteed single API call per page load
 */

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { getPersonaConfigs } from '@/services/api';
import { filterValidPersonas } from '@/constants/avatars';
import { PersonasCache } from '@/utils/apiCache';
import type { PersonaConfig } from '@/types/personas';

interface GlobalPersonasContextType {
  personas: Record<string, PersonaConfig>;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  getPersonaById: (personaId: string) => PersonaConfig | null;
  getPersonasList: () => Array<{ id: string; persona: PersonaConfig }>;
  getValidPersonasCount: () => number;
}

const GlobalPersonasContext = createContext<GlobalPersonasContextType | null>(null);

export function GlobalPersonasProvider({ children }: { children: ReactNode }) {
  const [personas, setPersonas] = useState<Record<string, PersonaConfig>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // CRITICAL: Global guards - shared across all consumers
  const isInitialized = useRef(false);
  const loadingRef = useRef(false);

  useEffect(() => {
    async function loadPersonas() {
      // Global initialization check
      if (isInitialized.current) {
        console.log('[GlobalPersonasProvider] Already initialized globally, skipping');
        return;
      }

      // Global concurrent call prevention
      if (loadingRef.current) {
        console.log('[GlobalPersonasProvider] Load in progress globally, skipping');
        return;
      }

      try {
        loadingRef.current = true;
        isInitialized.current = true;
        setLoading(true);
        setError(null);

        console.log('[GlobalPersonasProvider] 🚀 SINGLE global personas load starting...');

        // Check cache first
        const cachedPersonas = await PersonasCache.get();
        if (cachedPersonas) {
          console.log('[GlobalPersonasProvider] ✅ Cache hit, personas count:', Object.keys(cachedPersonas).length);
          setPersonas(cachedPersonas as Record<string, PersonaConfig>);
          setLoading(false);
          loadingRef.current = false;
          return;
        }

        console.log('[GlobalPersonasProvider] 📡 No cache, fetching from server (SINGLE CALL)...');

        // Fetch from server - THIS IS THE ONLY API CALL
        const personasData = await getPersonaConfigs();
        console.log('[GlobalPersonasProvider] 📦 Data received, keys:', Object.keys(personasData));

        // Filter valid personas
        const validPersonas = filterValidPersonas(personasData);
        console.log('[GlobalPersonasProvider] ✅ Filtered personas:', Object.keys(validPersonas).length);

        // Save to cache
        await PersonasCache.set(validPersonas);
        setPersonas(validPersonas as Record<string, PersonaConfig>);
        console.log('[GlobalPersonasProvider] 🎉 Global personas loaded successfully');

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error('[GlobalPersonasProvider] ❌ Error loading personas:', errorMessage);

        // Medical system error tracking
        if (typeof process !== 'undefined' && process.stderr) {
          process.stderr.write(`❌ ERRO GLOBAL - Falha ao carregar personas médicas:\n  Error: ${errorMessage}\n\n`);
        }

        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'medical_personas_load_error', {
            event_category: 'medical_error_critical',
            event_label: 'global_provider_failed',
            custom_parameters: {
              medical_context: 'GlobalPersonasProvider',
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
  }, []); // Empty deps - run once globally on mount

  const refetch = async () => {
    // Prevent concurrent refetch globally
    if (loadingRef.current) {
      console.log('[GlobalPersonasProvider] Refetch already in progress, skipping');
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
      console.log('[GlobalPersonasProvider] ✅ Personas refetched successfully');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('[GlobalPersonasProvider] ❌ Refetch error:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  const getPersonaById = (personaId: string): PersonaConfig | null => {
    return personas[personaId] || null;
  };

  const getPersonasList = (): Array<{ id: string; persona: PersonaConfig }> => {
    return Object.entries(personas).map(([id, persona]) => ({
      id,
      persona
    }));
  };

  const getValidPersonasCount = (): number => {
    const count = Object.keys(personas).length;
    return count > 0 ? count : 2; // Fallback to 2 (Dr. Gasnelio + Gá)
  };

  const contextValue: GlobalPersonasContextType = {
    personas,
    loading,
    error,
    refetch,
    getPersonaById,
    getPersonasList,
    getValidPersonasCount
  };

  return (
    <GlobalPersonasContext.Provider value={contextValue}>
      {children}
    </GlobalPersonasContext.Provider>
  );
}

/**
 * Hook to consume global personas context
 * MUST be used within GlobalPersonasProvider
 */
export function useGlobalPersonas(): GlobalPersonasContextType {
  const context = useContext(GlobalPersonasContext);

  if (!context) {
    throw new Error('useGlobalPersonas must be used within GlobalPersonasProvider');
  }

  return context;
}
