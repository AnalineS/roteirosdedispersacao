'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { STATIC_PERSONAS } from '@/data/personas';
import type { PersonasResponse } from '@/services/api';

// Re-export dos tipos da versão original
export type ValidPersonaId = 'dr_gasnelio' | 'ga';

export const isValidPersonaId = (personaId: string | null): personaId is ValidPersonaId => {
  return personaId === 'dr_gasnelio' || personaId === 'ga';
};

const normalizePersonaId = (personaId: string): ValidPersonaId | null => {
  const normalized = personaId.toLowerCase().trim();
  
  const aliases: Record<string, ValidPersonaId> = {
    'dr_gasnelio': 'dr_gasnelio',
    'gasnelio': 'dr_gasnelio',
    'dr.gasnelio': 'dr_gasnelio',
    'drgasnelio': 'dr_gasnelio',
    'technical': 'dr_gasnelio',
    'doctor': 'dr_gasnelio',
    'ga': 'ga',
    'empathetic': 'ga',
    'empathy': 'ga',
    'welcoming': 'ga'
  };
  
  return aliases[normalized] || null;
};

interface UsePersonaFromURLOptions {
  defaultPersona?: ValidPersonaId;
  updateURL?: boolean;
  availablePersonas?: PersonasResponse;
}

interface UsePersonaFromURLReturn {
  personaFromURL: ValidPersonaId | null;
  hasValidURLPersona: boolean;
  updatePersonaInURL: (personaId: ValidPersonaId | null) => void;
  clearPersonaFromURL: () => void;
  isPersonaAvailable: (personaId: ValidPersonaId) => boolean;
  getURLWithPersona: (personaId: ValidPersonaId) => string;
  isLoading: boolean;
}

/**
 * Versão segura do useSafePersonaFromURL que funciona com SSG
 * Não usa useSearchParams diretamente
 */
export function useSafePersonaFromURL(options: UsePersonaFromURLOptions = {}): UsePersonaFromURLReturn {
  const {
    defaultPersona = 'ga',
    updateURL = true,
    availablePersonas
  } = options;

  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [currentPersonaParam, setCurrentPersonaParam] = useState<ValidPersonaId | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Verificar se persona está disponível
  const isPersonaAvailable = useCallback((personaId: ValidPersonaId): boolean => {
    if (!availablePersonas) {
      return personaId in STATIC_PERSONAS;
    }
    return personaId in availablePersonas;
  }, [availablePersonas]);

  // Processar parâmetro da URL no client-side
  useEffect(() => {
    setIsClient(true);
    setIsLoading(true);
    
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlPersonaParam = urlParams.get('persona');
      let validPersonaId: ValidPersonaId | null = null;

      if (urlPersonaParam) {
        const normalized = normalizePersonaId(urlPersonaParam);
        
        if (normalized && isPersonaAvailable(normalized)) {
          validPersonaId = normalized;
        }
      }

      setCurrentPersonaParam(validPersonaId);
    }
    
    setIsLoading(false);
  }, [isPersonaAvailable]);

  // Função para atualizar persona na URL
  const updatePersonaInURL = useCallback((personaId: ValidPersonaId | null) => {
    if (!updateURL || !isClient) return;

    const params = new URLSearchParams(window.location.search);
    
    if (personaId && isPersonaAvailable(personaId)) {
      params.set('persona', personaId);
    } else {
      params.delete('persona');
    }

    const newURL = `${pathname}?${params.toString()}`;
    
    if (newURL !== window.location.pathname + window.location.search) {
      router.replace(newURL);
      setCurrentPersonaParam(personaId);
    }
  }, [pathname, router, updateURL, isPersonaAvailable, isClient]);

  // Função para limpar persona da URL
  const clearPersonaFromURL = useCallback(() => {
    updatePersonaInURL(null);
  }, [updatePersonaInURL]);

  // Função para obter URL com persona específica
  const getURLWithPersona = useCallback((personaId: ValidPersonaId): string => {
    const params = new URLSearchParams(isClient ? window.location.search : '');
    
    if (isPersonaAvailable(personaId)) {
      params.set('persona', personaId);
    } else {
      params.delete('persona');
    }

    return `${pathname}?${params.toString()}`;
  }, [pathname, isPersonaAvailable, isClient]);

  return {
    personaFromURL: currentPersonaParam,
    hasValidURLPersona: currentPersonaParam !== null,
    updatePersonaInURL,
    clearPersonaFromURL,
    isPersonaAvailable,
    getURLWithPersona,
    isLoading
  };
}

// Hook utilitário para sincronização de URL com outros sistemas
export function usePersonaURLSync(
  currentPersona: ValidPersonaId | null,
  onPersonaChange: (personaId: ValidPersonaId) => void
) {
  const { personaFromURL, updatePersonaInURL, hasValidURLPersona } = useSafePersonaFromURL();

  // Sincronizar mudanças de URL para estado local
  useEffect(() => {
    if (hasValidURLPersona && personaFromURL && personaFromURL !== currentPersona) {
      onPersonaChange(personaFromURL);
    }
  }, [personaFromURL, hasValidURLPersona, currentPersona, onPersonaChange]);

  // Sincronizar mudanças de estado local para URL
  useEffect(() => {
    if (currentPersona && currentPersona !== personaFromURL) {
      updatePersonaInURL(currentPersona);
    }
  }, [currentPersona, personaFromURL, updatePersonaInURL]);

  return { personaFromURL, updatePersonaInURL };
}

// Re-export das utilitários
export const personaValidation = {
  isValid: isValidPersonaId,
  normalize: normalizePersonaId,
  getDefault: (): ValidPersonaId => 'ga',
  getAllValid: (): ValidPersonaId[] => ['dr_gasnelio', 'ga']
};