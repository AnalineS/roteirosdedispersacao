'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { STATIC_PERSONAS } from '@/data/personas';
import type { PersonasResponse } from '@/services/api';

// Tipos válidos de persona
export type ValidPersonaId = 'dr_gasnelio' | 'ga';

// Validação de persona ID
export const isValidPersonaId = (personaId: string | null): personaId is ValidPersonaId => {
  return personaId === 'dr_gasnelio' || personaId === 'ga';
};

// Normalização de persona ID (para compatibilidade)
const normalizePersonaId = (personaId: string): ValidPersonaId | null => {
  const normalized = personaId.toLowerCase().trim();
  
  // Mapeamentos para compatibilidade
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
  /** Persona padrão quando não há URL param válido */
  defaultPersona?: ValidPersonaId;
  /** Se deve atualizar URL quando persona muda */
  updateURL?: boolean;
  /** Personas disponíveis (usado para validação) */
  availablePersonas?: PersonasResponse;
}

interface UsePersonaFromURLReturn {
  /** Persona ID atual da URL */
  personaFromURL: ValidPersonaId | null;
  /** Se há um parâmetro de persona válido na URL */
  hasValidURLPersona: boolean;
  /** Atualizar persona na URL */
  updatePersonaInURL: (personaId: ValidPersonaId | null) => void;
  /** Limpar parâmetro persona da URL */
  clearPersonaFromURL: () => void;
  /** Verificar se persona está válida contra personas disponíveis */
  isPersonaAvailable: (personaId: ValidPersonaId) => boolean;
  /** Obter URL completa com persona */
  getURLWithPersona: (personaId: ValidPersonaId) => string;
  /** Estado de loading enquanto processa parâmetros */
  isLoading: boolean;
}

export function usePersonaFromURL(options: UsePersonaFromURLOptions = {}): UsePersonaFromURLReturn {
  const {
    defaultPersona = 'ga',
    updateURL = true,
    availablePersonas
  } = options;

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);

  // Estado para evitar loops de re-render
  const [currentPersonaParam, setCurrentPersonaParam] = useState<ValidPersonaId | null>(null);

  // Verificar se persona está disponível nas personas carregadas
  const isPersonaAvailable = useCallback((personaId: ValidPersonaId): boolean => {
    if (!availablePersonas) {
      // Fallback para personas estáticas se não há personas dinâmicas
      return personaId in STATIC_PERSONAS;
    }
    return personaId in availablePersonas;
  }, [availablePersonas]);

  // Processar parâmetro da URL
  useEffect(() => {
    setIsLoading(true);
    
    const urlPersonaParam = searchParams?.get('persona');
    let validPersonaId: ValidPersonaId | null = null;

    if (urlPersonaParam) {
      const normalized = normalizePersonaId(urlPersonaParam);
      
      if (normalized && isPersonaAvailable(normalized)) {
        validPersonaId = normalized;
      }
    }

    setCurrentPersonaParam(validPersonaId);
    setIsLoading(false);
  }, [searchParams, isPersonaAvailable]);

  // Função para atualizar persona na URL
  const updatePersonaInURL = useCallback((personaId: ValidPersonaId | null) => {
    if (!updateURL) return;

    const params = new URLSearchParams(searchParams || '');
    
    if (personaId && isPersonaAvailable(personaId)) {
      params.set('persona', personaId);
    } else {
      params.delete('persona');
    }

    // Construir URL sem causar navegação desnecessária
    const newURL = `${pathname}?${params.toString()}`;
    const currentURL = `${pathname}?${searchParams?.toString() || ''}`;
    
    if (newURL !== currentURL) {
      // Usar replace para não adicionar ao histórico
      router.replace(newURL);
      setCurrentPersonaParam(personaId);
    }
  }, [searchParams, pathname, router, updateURL, isPersonaAvailable]);

  // Função para limpar persona da URL
  const clearPersonaFromURL = useCallback(() => {
    updatePersonaInURL(null);
  }, [updatePersonaInURL]);

  // Função para obter URL com persona específica
  const getURLWithPersona = useCallback((personaId: ValidPersonaId): string => {
    const params = new URLSearchParams(searchParams || '');
    
    if (isPersonaAvailable(personaId)) {
      params.set('persona', personaId);
    } else {
      params.delete('persona');
    }

    return `${pathname}?${params.toString()}`;
  }, [searchParams, pathname, isPersonaAvailable]);

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
  const { personaFromURL, updatePersonaInURL, hasValidURLPersona } = usePersonaFromURL();

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

// Utilitários para validação em outros hooks
export const personaValidation = {
  isValid: isValidPersonaId,
  normalize: normalizePersonaId,
  getDefault: (): ValidPersonaId => 'ga',
  getAllValid: (): ValidPersonaId[] => ['dr_gasnelio', 'ga']
};