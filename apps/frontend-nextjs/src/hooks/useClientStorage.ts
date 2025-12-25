'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Hook para uso seguro de localStorage em Next.js com SSR
 * Baseado nos padrões do Next.js oficial para evitar erros de hidratação
 */
export function useClientStorage<T>(
  key: string,
  defaultValue: T,
  options: {
    serialize?: (value: T) => string;
    deserialize?: (value: string) => T;
  } = {}
) {
  const { serialize = JSON.stringify, deserialize = JSON.parse } = options;

  // Estado inicial sempre usa o defaultValue para evitar hydration mismatch
  const [storedValue, setStoredValue] = useState<T>(defaultValue);
  const [isClient, setIsClient] = useState(false);

  // Marcar como client-side após mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Carregar valor do localStorage apenas no cliente
  useEffect(() => {
    if (!isClient || typeof window === 'undefined') return;

    try {
      const item = localStorage.getItem(key);
      if (item !== null) {
        setStoredValue(deserialize(item));
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
    }
  }, [key, isClient, deserialize]);

  // Função para atualizar valor
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        // Permitir função para atualização
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);

        // Salvar no localStorage apenas se estivermos no cliente
        if (isClient && typeof window !== 'undefined') {
          localStorage.setItem(key, serialize(valueToStore));
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue, serialize, isClient]
  );

  // Função para remover valor
  const removeValue = useCallback(() => {
    setStoredValue(defaultValue);
    if (isClient && typeof window !== 'undefined') {
      localStorage.removeItem(key);
    }
  }, [key, defaultValue, isClient]);

  return {
    value: storedValue,
    setValue,
    removeValue,
    isClient, // Útil para renderização condicional
  };
}

/**
 * Hook simplificado para valores string
 */
export function useClientStorageString(key: string, defaultValue: string = '') {
  return useClientStorage(key, defaultValue, {
    serialize: (value) => value,
    deserialize: (value) => value,
  });
}

/**
 * Hook para valores boolean
 */
export function useClientStorageBoolean(key: string, defaultValue: boolean = false) {
  return useClientStorage(key, defaultValue, {
    serialize: (value) => value.toString(),
    deserialize: (value) => value === 'true',
  });
}

/**
 * Utility function para verificar se está no cliente
 */
export function isClientSide(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Utility function para acesso seguro ao localStorage
 *
 * SECURITY NOTE (CodeQL js/clear-text-storage-of-sensitive-data):
 * This function stores data in localStorage which uses clear text storage.
 * DO NOT use this for storing sensitive data such as:
 * - Authentication tokens (use httpOnly cookies instead)
 * - Passwords or API keys
 * - Personal health information (PHI)
 * - Financial data
 *
 * Acceptable uses:
 * - User preferences (theme, language)
 * - Non-sensitive UI state
 * - Session identifiers for analytics
 *
 * For sensitive data, use secure alternatives:
 * - httpOnly cookies for tokens
 * - Server-side session storage
 * - Encrypted storage solutions
 */
export function safeLocalStorage() {
  if (!isClientSide()) {
    return null;
  }

  return {
    getItem: (key: string): string | null => {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    /**
     * Store value in localStorage (clear text - see security note above)
     * @security This stores data in clear text. Do not use for sensitive data.
     */
    setItem: (key: string, value: string): void => {
      try {
        // lgtm[js/clear-text-storage-of-sensitive-data] - Intentional clear text storage for non-sensitive data
        localStorage.setItem(key, value);
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    removeItem: (key: string): void => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn(`Error removing localStorage key "${key}":`, error);
      }
    },
  };
}