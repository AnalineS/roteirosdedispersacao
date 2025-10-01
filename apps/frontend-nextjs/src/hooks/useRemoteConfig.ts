/**
 * Hook para API Backend Remote Config
 * Gerencia feature flags globais com cache e fallback
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { safeLocalStorage, isClientSide } from '@/hooks/useClientStorage';
import {
  FeatureFlagsConfig,
  DEFAULT_FLAGS,
  STORAGE_KEYS,
  getEnvironmentFlags,
  trackFeatureFlagUsage,
  validateFlagsConfig,
  debugFeatureFlags,
  isDevelopmentEnvironment
} from '@/utils/featureFlags';

// Interface para valores de remote config com método asBoolean
interface RemoteConfigValue {
  asBoolean(): boolean;
}

// Interface para o objeto de flags remotas
interface RemoteFlagsObject {
  [key: string]: RemoteConfigValue;
}

interface RemoteConfigState {
  flags: FeatureFlagsConfig;
  loading: boolean;
  error: string | null;
  lastFetch: number | null;
}

interface RemoteConfigOptions {
  cacheTimeout?: number; // em minutos
  enableABTesting?: boolean;
  fallbackToEnvironment?: boolean;
}

// API Backend Remote Config (substituído Firebase)
const mockRemoteConfig = {
  async fetchAndActivate(): Promise<boolean> {
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 100));
    return true;
  },
  
  getValue(key: string) {
    // Em desenvolvimento, usar flags de ambiente
    if (isDevelopmentEnvironment()) {
      const envFlags = getEnvironmentFlags();
      if (key in envFlags) {
        return { asBoolean: () => envFlags[key as keyof typeof envFlags] };
      }
    }
    
    // Valores padrão para simulação - ATIVADOS
    const defaults: Record<string, boolean> = {
      fast_access_bar: true,
      new_footer: true,
      urgency_badges: true,
      personalization_system: true,
      virtual_scrolling: true
    };
    
    return { 
      asBoolean: () => defaults[key] ?? DEFAULT_FLAGS[key as keyof FeatureFlagsConfig] 
    };
  },
  
  getAll() {
    const envFlags = getEnvironmentFlags();
    return {
      fast_access_bar: { asBoolean: () => envFlags.fast_access_bar ?? true },
      new_footer: { asBoolean: () => envFlags.new_footer ?? true },
      urgency_badges: { asBoolean: () => envFlags.urgency_badges ?? true },
      personalization_system: { asBoolean: () => envFlags.personalization_system ?? true },
      virtual_scrolling: { asBoolean: () => envFlags.virtual_scrolling ?? true }
    };
  }
};

// Função para gerar assignação de teste A/B
const generateABTestAssignment = (): 'A' | 'B' => {
  // Verificar se já existe assignação salva
  if (typeof window !== 'undefined') {
    const saved = sessionStorage.getItem(STORAGE_KEYS.AB_TEST_ASSIGNMENT);
    if (saved && ['A', 'B'].includes(saved)) {
      return saved as 'A' | 'B';
    }
    
    // Gerar nova assignação (50/50)
    const assignment = Math.random() < 0.5 ? 'A' : 'B';
    sessionStorage.setItem(STORAGE_KEYS.AB_TEST_ASSIGNMENT, assignment);
    
    // Track assignment
    trackFeatureFlagUsage('ab_test_variant', assignment === 'A', 'ab_test_generation');
    
    return assignment;
  }
  
  return 'A';
};

// Função para carregar flags da sessão
const loadSessionFlags = (): Partial<FeatureFlagsConfig> => {
  if (typeof window === 'undefined') return {};
  
  try {
    const saved = sessionStorage.getItem(STORAGE_KEYS.SESSION_FLAGS);
    const flags = saved ? JSON.parse(saved) : {};
    
    // Garantir que ab_test_variant está definido
    if (!flags.ab_test_variant) {
      flags.ab_test_variant = generateABTestAssignment();
    }
    
    return flags;
  } catch (error) {
    // Erro ao carregar flags de sessão
    if (typeof process !== 'undefined' && process.stderr) {
      process.stderr.write(`❌ ERRO - Falha ao carregar flags de sessão: ${error}\n`);
    }
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'remote_config_session_load_error', {
        event_category: 'medical_config_error',
        event_label: 'session_flags_load_failed',
        custom_parameters: {
          error_context: 'session_flags_loading',
          error_message: String(error)
        }
      });
    }
    return { ab_test_variant: generateABTestAssignment() };
  }
};

// Função para carregar flags do usuário (localStorage como fallback)
const loadUserFlags = (): Partial<FeatureFlagsConfig> => {
  if (typeof window === 'undefined') return {};
  
  try {
    const saved = safeLocalStorage()?.getItem(STORAGE_KEYS.USER_FLAGS);
    return saved ? JSON.parse(saved) : {};
  } catch (error) {
    // Erro ao carregar flags do usuário
    if (typeof process !== 'undefined' && process.stderr) {
      process.stderr.write(`❌ ERRO - Falha ao carregar flags do usuário: ${error}\n`);
    }
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'remote_config_user_load_error', {
        event_category: 'medical_config_error',
        event_label: 'user_flags_load_failed',
        custom_parameters: {
          error_context: 'user_flags_loading',
          error_message: String(error)
        }
      });
    }
    return {};
  }
};

// Função para salvar flags na sessão
const saveSessionFlags = (flags: Partial<FeatureFlagsConfig>) => {
  if (typeof window === 'undefined') return;
  
  try {
    const sessionFlags = { 
      ab_test_variant: flags.ab_test_variant,
      debug_mode: flags.debug_mode 
    };
    sessionStorage.setItem(STORAGE_KEYS.SESSION_FLAGS, JSON.stringify(sessionFlags));
  } catch (error) {
    // Erro ao salvar flags de sessão
    if (typeof process !== 'undefined' && process.stderr) {
      process.stderr.write(`❌ ERRO - Falha ao salvar flags de sessão: ${error}\n`);
    }
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'remote_config_session_save_error', {
        event_category: 'medical_config_error',
        event_label: 'session_flags_save_failed',
        custom_parameters: {
          error_context: 'session_flags_saving',
          error_message: String(error)
        }
      });
    }
  }
};

// Hook principal
export const useRemoteConfig = (options: RemoteConfigOptions = {}) => {
  const {
    cacheTimeout = 60, // 60 minutos por padrão
    enableABTesting = true,
    fallbackToEnvironment = true
  } = options;

  const [state, setState] = useState<RemoteConfigState>({
    flags: DEFAULT_FLAGS,
    loading: true,
    error: null,
    lastFetch: null
  });

  // Função para buscar configuração do Remote Config
  const fetchRemoteConfig = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      // Tentar buscar do cache primeiro
      const cached = safeLocalStorage()?.getItem(STORAGE_KEYS.REMOTE_CONFIG_CACHE);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          const isExpired = Date.now() - timestamp > cacheTimeout * 60 * 1000;
          
          if (!isExpired && validateFlagsConfig(data)) {
            const sessionFlags = loadSessionFlags();
            const userFlags = loadUserFlags();
            const envFlags = fallbackToEnvironment ? getEnvironmentFlags() : {};
            
            const finalFlags = {
              ...DEFAULT_FLAGS,
              ...envFlags,
              ...data,
              ...sessionFlags,
              ...userFlags
            };
            
            setState({
              flags: finalFlags,
              loading: false,
              error: null,
              lastFetch: timestamp
            });
            
            debugFeatureFlags(finalFlags);
            return;
          }
        }
      }
      
      // Buscar do API Backend Config
      const success = await mockRemoteConfig.fetchAndActivate();
      
      if (success) {
        const remoteFlags = mockRemoteConfig.getAll();
        const globalFlags: Partial<FeatureFlagsConfig> = {};
        
        // Extrair flags globais
        Object.keys(remoteFlags).forEach(key => {
          if (key in DEFAULT_FLAGS) {
            const remoteFlag = (remoteFlags as RemoteFlagsObject)[key];
            const value = remoteFlag.asBoolean();
            // Type-safe assignment using object spread
            Object.assign(globalFlags, { [key]: value });
          }
        });
        
        // Combinar com flags de outras fontes
        const sessionFlags = loadSessionFlags();
        const userFlags = loadUserFlags();
        const envFlags = fallbackToEnvironment ? getEnvironmentFlags() : {};
        
        const finalFlags: FeatureFlagsConfig = {
          ...DEFAULT_FLAGS,
          ...envFlags,
          ...globalFlags,
          ...sessionFlags,
          ...userFlags
        };
        
        // Validar e salvar cache
        if (validateFlagsConfig(finalFlags)) {
          const timestamp = Date.now();
          
          if (typeof window !== 'undefined') {
            safeLocalStorage()?.setItem(STORAGE_KEYS.REMOTE_CONFIG_CACHE, JSON.stringify({
              data: globalFlags,
              timestamp
            }));
          }
          
          setState({
            flags: finalFlags,
            loading: false,
            error: null,
            lastFetch: timestamp
          });
          
          // Track successful fetch
          trackFeatureFlagUsage('remote_config_fetch', true, 'api_backend');
          debugFeatureFlags(finalFlags);
        } else {
          throw new Error('Configuração inválida recebida do API Backend');
        }
      } else {
        throw new Error('Falha ao buscar API Backend Config');
      }
      
    } catch (error) {
      // Erro ao buscar API Backend Config
      if (typeof process !== 'undefined' && process.stderr) {
        process.stderr.write(`❌ ERRO - Falha ao buscar API Backend Config: ${error}\n`);
      }
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'remote_config_backend_error', {
          event_category: 'medical_config_error',
          event_label: 'backend_config_fetch_failed',
          custom_parameters: {
            error_context: 'backend_config_fetching',
            error_message: String(error)
          }
        });
      }
      
      // Fallback para flags de ambiente + cache local
      const sessionFlags = loadSessionFlags();
      const userFlags = loadUserFlags();
      const envFlags = fallbackToEnvironment ? getEnvironmentFlags() : {};
      
      const fallbackFlags = {
        ...DEFAULT_FLAGS,
        ...envFlags,
        ...sessionFlags,
        ...userFlags
      };
      
      setState({
        flags: fallbackFlags,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        lastFetch: null
      });
      
      trackFeatureFlagUsage('api_config_fallback', true, 'error');
    }
  }, [cacheTimeout, fallbackToEnvironment]);

  // Função para atualizar flag específica
  const updateFlag = useCallback((key: keyof FeatureFlagsConfig, value: boolean | 'A' | 'B') => {
    setState(prev => {
      const newFlags = { ...prev.flags, [key]: value };
      
      // Salvar no storage apropriado
      if (key === 'ab_test_variant' || key === 'debug_mode') {
        saveSessionFlags(newFlags);
      } else if (key === 'custom_shortcuts' || key === 'advanced_analytics') {
        if (typeof window !== 'undefined') {
          safeLocalStorage()?.setItem(STORAGE_KEYS.USER_FLAGS, JSON.stringify({
            custom_shortcuts: newFlags.custom_shortcuts,
            advanced_analytics: newFlags.advanced_analytics
          }));
        }
      }
      
      trackFeatureFlagUsage(key, Boolean(value), 'manual_update');
      
      return {
        ...prev,
        flags: newFlags
      };
    });
  }, []);

  // Função para forçar refresh
  const refresh = useCallback(() => {
    if (typeof window !== 'undefined') {
      safeLocalStorage()?.removeItem(STORAGE_KEYS.REMOTE_CONFIG_CACHE);
    }
    fetchRemoteConfig();
  }, [fetchRemoteConfig]);

  // Buscar configuração na inicialização
  useEffect(() => {
    fetchRemoteConfig();
  }, [fetchRemoteConfig]);

  // Auto-refresh baseado no timeout (opcional)
  useEffect(() => {
    if (!state.lastFetch) return;
    
    const refreshInterval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - state.lastFetch!;
      
      if (elapsed > cacheTimeout * 60 * 1000) {
        fetchRemoteConfig();
      }
    }, 5 * 60 * 1000); // Verificar a cada 5 minutos
    
    return () => clearInterval(refreshInterval);
  }, [state.lastFetch, cacheTimeout, fetchRemoteConfig]);

  return {
    flags: state.flags,
    loading: state.loading,
    error: state.error,
    lastFetch: state.lastFetch,
    updateFlag,
    refresh,
    
    // Utilitários
    isEnabled: (key: keyof FeatureFlagsConfig) => Boolean(state.flags[key]),
    getVariant: () => state.flags.ab_test_variant,
    isDebugMode: () => state.flags.debug_mode,
    
    // Métodos específicos para UX médico
    shouldShowFastAccessBar: () => state.flags.fast_access_bar,
    shouldUseNewFooter: () => state.flags.new_footer,
    shouldShowUrgencyBadges: () => state.flags.urgency_badges,
    shouldEnablePersonalization: () => state.flags.personalization_system,
    shouldUseVirtualScrolling: () => state.flags.virtual_scrolling
  };
};

export default useRemoteConfig;