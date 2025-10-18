/**
 * Hook para consumir personas do Global Provider
 *
 * REFATORAÇÃO FINAL: Issue #221 - ERR_INSUFFICIENT_RESOURCES
 *
 * ANTES: Hook independente com API calls
 * → Cada componente criava instância separada
 * → 5 componentes = 5 API calls simultâneos
 *
 * DEPOIS: Wrapper do GlobalPersonasProvider
 * → Todos componentes compartilham mesma instância
 * → 1 API call global por página
 */

import { useGlobalPersonas } from '@/contexts/GlobalPersonasProvider';

/**
 * Hook simplificado que consome o provider global
 *
 * IMPORTANTE: Este hook agora é apenas um alias/wrapper
 * Toda lógica de carregamento está em GlobalPersonasProvider
 */
export function usePersonas() {
  // Simply re-export global context
  return useGlobalPersonas();
}
