/**
 * Sistema de Feature Flags baseado em API backend
 * Permite controle centralizado de funcionalidades com rollback instantâneo
 */

import { secureLogger } from '@/utils/secureLogger';

export interface FeatureFlag {
  key: string;
  defaultValue: boolean;
  description: string;
  scope: 'global' | 'session' | 'user';
}

export interface FeatureFlagsConfig {
  // Global flags (Remote Config)
  new_footer: boolean;
  fast_access_bar: boolean;
  urgency_badges: boolean;
  personalization_system: boolean;
  virtual_scrolling: boolean;
  
  // Session flags (SessionStorage)
  ab_test_variant: 'A' | 'B';
  debug_mode: boolean;
  
  // User flags (API backend preferences)
  custom_shortcuts: boolean;
  advanced_analytics: boolean;
}

// Definição das feature flags
export const FEATURE_FLAGS: Record<keyof FeatureFlagsConfig, FeatureFlag> = {
  // Global flags via Remote Config
  new_footer: {
    key: 'new_footer',
    defaultValue: false,
    description: 'Novo footer com 3 seções e tabs otimizadas',
    scope: 'global'
  },
  fast_access_bar: {
    key: 'fast_access_bar',
    defaultValue: false,
    description: 'Barra de acesso rápido para emergências médicas',
    scope: 'global'
  },
  urgency_badges: {
    key: 'urgency_badges',
    defaultValue: false,
    description: 'Badges de urgência médica na navegação',
    scope: 'global'
  },
  personalization_system: {
    key: 'personalization_system',
    defaultValue: false,
    description: 'Sistema de personalização por perfil médico',
    scope: 'global'
  },
  virtual_scrolling: {
    key: 'virtual_scrolling',
    defaultValue: false,
    description: 'Virtual scrolling para listas longas (>50 items)',
    scope: 'global'
  },
  
  // Session flags via SessionStorage
  ab_test_variant: {
    key: 'ab_test_variant',
    defaultValue: 'A' as 'A',
    description: 'Variante do teste A/B atual',
    scope: 'session'
  } as FeatureFlag & { defaultValue: 'A' | 'B' },
  debug_mode: {
    key: 'debug_mode',
    defaultValue: false,
    description: 'Modo debug para desenvolvimento',
    scope: 'session'
  },
  
  // User flags via API backend
  custom_shortcuts: {
    key: 'custom_shortcuts',
    defaultValue: false,
    description: 'Atalhos customizáveis pelo usuário',
    scope: 'user'
  },
  advanced_analytics: {
    key: 'advanced_analytics',
    defaultValue: false,
    description: 'Analytics avançado e tracking detalhado',
    scope: 'user'
  }
};

// Valores padrão para fallback
export const DEFAULT_FLAGS: FeatureFlagsConfig = {
  new_footer: false,
  fast_access_bar: false,
  urgency_badges: false,
  personalization_system: false,
  virtual_scrolling: false,
  ab_test_variant: 'A' as 'A',
  debug_mode: false,
  custom_shortcuts: false,
  advanced_analytics: false
};

// Storage keys
export const STORAGE_KEYS = {
  REMOTE_CONFIG_CACHE: 'api_remote_config_cache',
  SESSION_FLAGS: 'session_feature_flags',
  USER_FLAGS: 'user_feature_flags',
  AB_TEST_ASSIGNMENT: 'ab_test_assignment'
} as const;

// Utilitários para desenvolvimento e debug
export const FLAG_ENVIRONMENTS = {
  development: {
    fast_access_bar: true,
    debug_mode: true,
    advanced_analytics: true
  },
  staging: {
    fast_access_bar: true,
    new_footer: true,
    urgency_badges: true
  },
  production: {
    // Controlado via API backend
  }
} as const;

// Função para determinar se está em ambiente de desenvolvimento
export const isDevelopmentEnvironment = (): boolean => {
  return process.env.NODE_ENV === 'development' || 
         process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview' ||
         typeof window !== 'undefined' && window.location.hostname === 'localhost';
};

// Função para aplicar flags de ambiente
export const getEnvironmentFlags = (): Partial<FeatureFlagsConfig> => {
  if (isDevelopmentEnvironment()) {
    return FLAG_ENVIRONMENTS.development;
  }
  
  if (process.env.NEXT_PUBLIC_VERCEL_ENV === 'preview') {
    return FLAG_ENVIRONMENTS.staging;
  }
  
  return FLAG_ENVIRONMENTS.production;
};

// Analytics tracking para feature flags
export const trackFeatureFlagUsage = (flagKey: string, value: boolean, source: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'feature_flag_usage', {
      event_category: 'feature_flags',
      event_label: flagKey,
      custom_dimensions: {
        flag_value: value,
        flag_source: source,
        environment: process.env.NODE_ENV
      }
    });
  }
};

// Função para validar configuração de flags
export const validateFlagsConfig = (config: Partial<FeatureFlagsConfig>): boolean => {
  try {
    // Validar tipos
    Object.entries(config).forEach(([key, value]) => {
      const flagDef = FEATURE_FLAGS[key as keyof FeatureFlagsConfig];
      if (!flagDef) {
        secureLogger.warn('Feature flag desconhecida', { key, component: 'FeatureFlags' });
        return;
      }
      
      // Validar tipo específico para ab_test_variant
      if (key === 'ab_test_variant' && !['A', 'B'].includes(value as string)) {
        secureLogger.error('Valor inválido para ab_test_variant', undefined, { value, component: 'FeatureFlags' });
        return false;
      }
      
      // Validar tipos boolean
      if (typeof value !== 'boolean' && key !== 'ab_test_variant') {
        secureLogger.error('Tipo inválido para feature flag', undefined, { 
          key, 
          expectedType: 'boolean', 
          receivedType: typeof value,
          component: 'FeatureFlags'
        });
        return false;
      }
    });
    
    return true;
  } catch (error) {
    console.error('Erro ao validar configuração de feature flags:', error);
    return false;
  }
};

// Função para debug e logging
export const debugFeatureFlags = (flags: FeatureFlagsConfig) => {
  if (!isDevelopmentEnvironment()) return;
  
  console.group('🚩 Feature Flags Status');
  console.table(
    Object.entries(flags).map(([key, value]) => ({
      Flag: key,
      Value: value,
      Scope: FEATURE_FLAGS[key as keyof FeatureFlagsConfig]?.scope || 'unknown',
      Description: FEATURE_FLAGS[key as keyof FeatureFlagsConfig]?.description || 'N/A'
    }))
  );
  console.groupEnd();
};

export default FEATURE_FLAGS;