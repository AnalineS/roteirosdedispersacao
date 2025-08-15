/**
 * useAuth Hook - Extended Authentication Utilities
 * Extensões específicas do sistema para o contexto de autenticação
 * Integra com os hooks existentes de perfil e conversas
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth as useAuthContext } from '@/contexts/AuthContext';
import { UserProfile } from './useUserProfile';
import { FEATURES } from '@/lib/firebase/config';

// ============================================
// EXTENDED AUTH UTILITIES
// ============================================

export interface ExtendedAuthUtils {
  // Persona recommendations
  getRecommendedPersona: () => string;
  canAccessPersona: (personaId: string) => boolean;
  
  // Feature access control
  canAccessAdvancedCalculator: () => boolean;
  canAccessConversationHistory: () => boolean;
  canAccessCertificates: () => boolean;
  canExportData: () => boolean;
  canAccessAnalytics: () => boolean;
  
  // Soft authentication prompts
  promptAuthForFeature: (feature: string, reason?: string) => void;
  shouldShowUpgradePrompt: (action: string) => boolean;
  
  // Migration utilities
  needsDataMigration: () => boolean;
  canMigrateData: () => boolean;
  
  // User experience
  getWelcomeMessage: () => string;
  getUserDisplayName: () => string;
  getSessionType: () => 'guest' | 'temporary' | 'registered' | 'premium';
  
  // Feature flags specific to user type
  features: {
    persistentConversations: boolean;
    cloudSync: boolean;
    advancedAnalytics: boolean;
    certificateGeneration: boolean;
    emailReports: boolean;
    customization: boolean;
    crossDeviceAccess: boolean;
  };
}

// ============================================
// MAIN HOOK
// ============================================

export function useAuth(): ReturnType<typeof useAuthContext> & ExtendedAuthUtils {
  const authContext = useAuthContext();
  const [hasLocalData, setHasLocalData] = useState(false);

  // Check for local data that can be migrated
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const localProfile = localStorage.getItem('userProfile');
      const localConversations = localStorage.getItem('conversation-history');
      setHasLocalData(!!(localProfile || localConversations));
    }
  }, []);

  // ============================================
  // PERSONA MANAGEMENT
  // ============================================

  const getRecommendedPersona = useCallback((): string => {
    // Se tem perfil Firebase, usar lógica avançada
    if (authContext.profile) {
      const { type, focus, history } = authContext.profile;
      
      if (history?.lastPersona && history.conversationCount > 2) {
        return history.lastPersona;
      }

      if (type === 'professional' || type === 'student') {
        return focus === 'technical' ? 'dr_gasnelio' : 'ga';
      } else {
        return focus === 'technical' ? 'dr_gasnelio' : 'ga';
      }
    }

    // Fallback para localStorage (compatibilidade)
    if (typeof window !== 'undefined') {
      const localProfile = localStorage.getItem('userProfile');
      if (localProfile) {
        try {
          const profile = JSON.parse(localProfile).profile as UserProfile;
          if (profile.type === 'professional' && profile.focus === 'technical') {
            return 'dr_gasnelio';
          }
        } catch (error) {
          console.warn('Erro ao ler perfil local:', error);
        }
      }
    }

    return 'ga'; // Default empático
  }, [authContext.profile]);

  const canAccessPersona = useCallback((personaId: string): boolean => {
    // Ambas as personas sempre disponíveis no sistema "soft auth"
    return personaId === 'dr_gasnelio' || personaId === 'ga';
  }, []);

  // ============================================
  // FEATURE ACCESS CONTROL
  // ============================================

  const canAccessAdvancedCalculator = useCallback((): boolean => {
    const accessLevel = authContext.getAccessLevel();
    // Calculadora básica sempre disponível, avançada para autenticados
    return accessLevel !== 'anonymous' || !FEATURES.AUTH_ENABLED;
  }, [authContext]);

  const canAccessConversationHistory = useCallback((): boolean => {
    // Histórico local sempre disponível, cloud apenas para autenticados
    return true;
  }, []);

  const canAccessCertificates = useCallback((): boolean => {
    const accessLevel = authContext.getAccessLevel();
    // Certificados apenas para usuários com perfil completo
    return accessLevel === 'premium' || !FEATURES.AUTH_ENABLED;
  }, [authContext]);

  const canExportData = useCallback((): boolean => {
    const accessLevel = authContext.getAccessLevel();
    // Export básico sempre, avançado para autenticados
    return accessLevel !== 'anonymous' || !FEATURES.AUTH_ENABLED;
  }, [authContext]);

  const canAccessAnalytics = useCallback((): boolean => {
    const accessLevel = authContext.getAccessLevel();
    // Analytics apenas para autenticados
    return accessLevel !== 'anonymous';
  }, [authContext]);

  // ============================================
  // SOFT AUTHENTICATION PROMPTS
  // ============================================

  const promptAuthForFeature = useCallback((feature: string, reason?: string): void => {
    if (!authContext.isAuthenticated && FEATURES.AUTH_ENABLED) {
      // Implementar lógica de prompt suave
      console.log(`Sugestão de login para: ${feature}`, reason);
      // Aqui pode ser implementado um modal ou toast
    }
  }, [authContext.isAuthenticated]);

  const shouldShowUpgradePrompt = useCallback((action: string): boolean => {
    if (!FEATURES.AUTH_ENABLED) return false;
    
    const accessLevel = authContext.getAccessLevel();
    
    // Definir ações que requerem upgrade
    const premiumActions = [
      'export_advanced_report',
      'access_analytics',
      'generate_certificate',
      'cloud_sync'
    ];
    
    return accessLevel === 'anonymous' && premiumActions.includes(action);
  }, [authContext]);

  // ============================================
  // MIGRATION UTILITIES
  // ============================================

  const needsDataMigration = useCallback((): boolean => {
    return authContext.isAuthenticated && hasLocalData && FEATURES.FIRESTORE_ENABLED;
  }, [authContext.isAuthenticated, hasLocalData]);

  const canMigrateData = useCallback((): boolean => {
    return authContext.isAuthenticated && hasLocalData && FEATURES.FIRESTORE_ENABLED;
  }, [authContext.isAuthenticated, hasLocalData]);

  // ============================================
  // USER EXPERIENCE
  // ============================================

  const getWelcomeMessage = useCallback((): string => {
    const displayName = getUserDisplayName();
    const accessLevel = authContext.getAccessLevel();

    switch (accessLevel) {
      case 'premium':
        return `Bem-vindo de volta, ${displayName}! 👨‍⚕️`;
      case 'authenticated':
        return `Olá, ${displayName}! 🎓`;
      case 'anonymous':
        return 'Bem-vindo à Plataforma Educacional! 📚';
      default:
        return 'Bem-vindo! 👋';
    }
  }, [authContext]);

  const getUserDisplayName = useCallback((): string => {
    if (authContext.profile?.displayName) {
      return authContext.profile.displayName;
    }
    
    if (authContext.user?.displayName) {
      return authContext.user.displayName;
    }

    if (authContext.user?.email) {
      return authContext.user.email.split('@')[0];
    }

    // Tentar localStorage como fallback
    if (typeof window !== 'undefined') {
      const localProfile = localStorage.getItem('userProfile');
      if (localProfile) {
        try {
          const profile = JSON.parse(localProfile).profile as UserProfile;
          if (profile.type === 'professional') return 'Dr.(a) Usuário';
          if (profile.type === 'student') return 'Estudante';
          if (profile.type === 'patient') return 'Paciente';
          if (profile.type === 'caregiver') return 'Cuidador';
        } catch (error) {
          console.warn('Erro ao ler perfil local para nome:', error);
        }
      }
    }

    return 'Visitante';
  }, [authContext.profile, authContext.user]);

  const getSessionType = useCallback((): 'guest' | 'temporary' | 'registered' | 'premium' => {
    const accessLevel = authContext.getAccessLevel();
    
    if (accessLevel === 'premium') return 'premium';
    if (accessLevel === 'authenticated') return 'registered';
    if (authContext.isAnonymous) return 'temporary';
    return 'guest';
  }, [authContext]);

  // ============================================
  // FEATURE FLAGS
  // ============================================

  const features = {
    persistentConversations: authContext.isFeatureAvailable('conversations'),
    cloudSync: authContext.isAuthenticated && FEATURES.FIRESTORE_ENABLED,
    advancedAnalytics: authContext.isFeatureAvailable('analytics'),
    certificateGeneration: canAccessCertificates(),
    emailReports: authContext.isAuthenticated && !!authContext.profile?.preferences?.emailUpdates,
    customization: authContext.isAuthenticated || !FEATURES.AUTH_ENABLED,
    crossDeviceAccess: authContext.isAuthenticated && FEATURES.FIRESTORE_ENABLED
  };

  // ============================================
  // RETURN EXTENDED CONTEXT
  // ============================================

  return {
    ...authContext,
    
    // Persona utilities
    getRecommendedPersona,
    canAccessPersona,
    
    // Feature access
    canAccessAdvancedCalculator,
    canAccessConversationHistory,
    canAccessCertificates,
    canExportData,
    canAccessAnalytics,
    
    // Soft auth
    promptAuthForFeature,
    shouldShowUpgradePrompt,
    
    // Migration
    needsDataMigration,
    canMigrateData,
    
    // UX
    getWelcomeMessage,
    getUserDisplayName,
    getSessionType,
    
    // Features
    features
  };
}

// ============================================
// UTILITY HOOKS
// ============================================

/**
 * Hook para verificar se uma funcionalidade específica está disponível
 */
export function useFeatureAccess(feature: string): {
  isAvailable: boolean;
  reason?: string;
  canUpgrade: boolean;
} {
  const auth = useAuth();

  const getFeatureAccess = useCallback(() => {
    switch (feature) {
      case 'advanced_calculator':
        return {
          isAvailable: auth.canAccessAdvancedCalculator(),
          reason: !auth.isAuthenticated ? 'Faça login para acessar a calculadora avançada' : undefined,
          canUpgrade: !auth.isAuthenticated
        };
        
      case 'conversation_history':
        return {
          isAvailable: auth.canAccessConversationHistory(),
          reason: undefined,
          canUpgrade: false
        };
        
      case 'certificates':
        return {
          isAvailable: auth.canAccessCertificates(),
          reason: !auth.isAuthenticated ? 'Crie uma conta para gerar certificados' : undefined,
          canUpgrade: !auth.isAuthenticated
        };
        
      case 'analytics':
        return {
          isAvailable: auth.canAccessAnalytics(),
          reason: !auth.isAuthenticated ? 'Analytics disponível apenas para usuários registrados' : undefined,
          canUpgrade: !auth.isAuthenticated
        };
        
      default:
        return {
          isAvailable: true,
          canUpgrade: false
        };
    }
  }, [auth, feature]);

  return getFeatureAccess();
}

/**
 * Hook para gerenciar prompts de autenticação suave
 */
export function useSoftAuthPrompt() {
  const auth = useAuth();
  const [promptHistory, setPromptHistory] = useState<string[]>([]);

  const showPrompt = useCallback((feature: string, reason?: string) => {
    if (!promptHistory.includes(feature)) {
      auth.promptAuthForFeature(feature, reason);
      setPromptHistory(prev => [...prev, feature]);
    }
  }, [auth, promptHistory]);

  const resetPromptHistory = useCallback(() => {
    setPromptHistory([]);
  }, []);

  return {
    showPrompt,
    resetPromptHistory,
    hasShownPrompt: (feature: string) => promptHistory.includes(feature)
  };
}

export default useAuth;