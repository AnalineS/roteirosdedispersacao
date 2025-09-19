/**
 * useAuth Hook - Sistema JWT
 * Hook que usa o AuthContext com compatibilidade para o sistema anterior
 */

import { useAuth as useAuthContext, type UserProfile } from '@/contexts/AuthContext';
import { useCallback } from 'react';
import type {
  UserRole,
  UserLevelBenefits
} from '@/types/auth';
import { USER_LEVEL_BENEFITS } from '@/types/auth';

interface GoogleLoginOptions {
  prompt?: 'none' | 'consent' | 'select_account';
  includeGrantedScopes?: boolean;
  enableGranularConsent?: boolean;
  loginHint?: string;
  hd?: string;
  displayName?: string;
  profileType?: 'patient' | 'professional' | 'student';
}

interface RegistrationData {
  email: string;
  password: string;
  displayName?: string;
  type?: 'patient' | 'professional' | 'student';
  acceptTerms: boolean;
  acceptPrivacy: boolean;
  optInMarketing?: boolean;
}

type ProfileUpdates = Partial<UserProfile>;

// USER_LEVEL_BENEFITS imported from @/types/auth

export function useAuth() {
  const authContext = useAuthContext();

  // ============================================================================
  // COMPATIBILITY WRAPPERS
  // ============================================================================

  const getUserRole = useCallback((): UserRole => {
    if (authContext.isAdmin()) return 'admin';
    if (authContext.isAuthenticated) return 'registered';
    return 'visitor';
  }, [authContext]);

  const getUserBenefits = useCallback((): UserLevelBenefits => {
    return USER_LEVEL_BENEFITS[getUserRole()];
  }, [getUserRole]);

  const hasPermission = useCallback((permission: keyof UserLevelBenefits) => {
    const benefits = getUserBenefits();
    return benefits[permission] as boolean;
  }, [getUserBenefits]);

  const canAccessFeature = useCallback((feature: string) => {
    switch (feature) {
      case 'advanced':
        return authContext.isFeatureAvailable('advanced');
      case 'analytics':
        return authContext.isFeatureAvailable('analytics');
      case 'admin':
        return authContext.isFeatureAvailable('admin');
      case 'profiles':
        return authContext.isFeatureAvailable('profiles');
      case 'conversations':
        return authContext.isFeatureAvailable('conversations');
      default:
        return true;
    }
  }, [authContext]);

  const hasRole = useCallback((role: UserRole) => {
    return getUserRole() === role;
  }, [getUserRole]);

  const isVisitor = useCallback(() => {
    return getUserRole() === 'visitor';
  }, [getUserRole]);

  const isRegistered = useCallback(() => {
    const role = getUserRole();
    return role === 'registered' || role === 'admin';
  }, [getUserRole]);

  const isAdmin = useCallback(() => {
    return authContext.isAdmin();
  }, [authContext]);

  // ============================================================================
  // USAGE LIMITS
  // ============================================================================

  const checkUsageLimit = useCallback((action: 'conversation' | 'module' | 'certificate') => {
    const benefits = getUserBenefits();

    switch (action) {
      case 'conversation':
        return {
          canPerform: true, // Para simplicidade, sempre permitir
          remaining: benefits.maxConversationsPerDay,
          limit: benefits.maxConversationsPerDay,
          message: benefits.maxConversationsPerDay === 999 ? 'Ilimitado' : undefined,
        };

      case 'module':
        return {
          canPerform: true,
          remaining: benefits.maxModulesPerDay,
          limit: benefits.maxModulesPerDay,
          message: benefits.maxModulesPerDay === 999 ? 'Ilimitado' : undefined,
        };

      case 'certificate':
        return {
          canPerform: benefits.canExportCertificates,
          remaining: benefits.maxCertificatesPerMonth,
          limit: benefits.maxCertificatesPerMonth,
          message: benefits.maxCertificatesPerMonth === 999 ? 'Ilimitado' :
                  !benefits.canExportCertificates ? 'Cadastre-se para acessar certificados' : undefined,
        };

      default:
        return {
          canPerform: true,
          remaining: 999,
          limit: 999,
        };
    }
  }, [getUserBenefits]);

  // ============================================================================
  // SIMPLIFIED METHODS
  // ============================================================================

  const loginWithGoogle = useCallback(async (options?: GoogleLoginOptions) => {
    const result = await authContext.loginWithSocial({
      providerId: 'google.com',
      preferredDisplayName: options?.displayName,
      preferredProfileType: options?.profileType
    });

    if (!result.success) {
      throw new Error(result.error);
    }

    return authContext.user;
  }, [authContext]);

  const loginWithEmail = useCallback(async (email: string, password: string) => {
    const result = await authContext.login({ email, password });

    if (!result.success) {
      throw new Error(result.error);
    }

    return authContext.user;
  }, [authContext]);

  const register = useCallback(async (data: RegistrationData) => {
    const result = await authContext.register(data);

    if (!result.success) {
      throw new Error(result.error);
    }

    return authContext.user;
  }, [authContext]);

  const logout = useCallback(async () => {
    const result = await authContext.logout();

    if (!result.success) {
      throw new Error(result.error);
    }
  }, [authContext]);

  const updateProfile = useCallback(async (updates: ProfileUpdates) => {
    const result = await authContext.updateUserProfile(updates);

    if (!result.success) {
      throw new Error(result.error);
    }
  }, [authContext]);

  const upgradeRole = useCallback(async (newRole: UserRole) => {
    // Não implementado no novo sistema - usar upgrade de conta anônima
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'upgrade_role_not_implemented', {
        event_category: 'auth',
        event_label: 'jwt_system_limitation',
        custom_parameters: { targetRole: newRole }
      });
    }
  }, []);

  const clearError = useCallback(() => {
    authContext.clearError();
  }, [authContext]);

  return {
    // State - Mapeamento do contexto para compatibilidade
    user: authContext.user,
    isLoading: authContext.loading,
    isAuthenticated: authContext.isAuthenticated,
    error: authContext.error,

    // Actions - Compatibilidade com interface anterior
    loginWithGoogle,
    loginWithEmail,
    register,
    registerWithEmail: register,
    registerWithGoogle: loginWithGoogle,
    logout,
    updateProfile,
    upgradeRole,
    clearError,

    // Permissions - Mapeamento para novo sistema
    hasPermission,
    canAccessFeature,
    hasRole,
    isVisitor,
    isRegistered,
    isAdmin,

    // Usage - Mantido para compatibilidade
    checkUsageLimit,

    // Helpers - Mantido para compatibilidade
    getUserBenefits,
    getUserRole,

    // Context methods - Acesso direto ao contexto
    profile: authContext.profile,
    continueAsGuest: authContext.continueAsGuest,
    upgradeAnonymousAccount: authContext.upgradeAnonymousAccount,
    getAccessLevel: authContext.getAccessLevel,
    refreshAuth: authContext.refreshAuth,
    showAuthPrompt: authContext.showAuthPrompt,
    dismissAuthPrompt: authContext.dismissAuthPrompt,
    authPromptReason: authContext.authPromptReason
  };
}

// Hook específico para componentes que precisam de autenticação
export function useRequireAuth(requiredRole?: UserRole) {
  const auth = useAuth();

  if (!auth.isLoading && !auth.isAuthenticated && requiredRole && requiredRole !== 'visitor') {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'access_denied_role_required', {
        event_category: 'auth',
        event_label: 'role_check_failed',
        custom_parameters: { requiredRole }
      });
    }
  }

  return auth;
}

// Hook para verificar permissões específicas
export function usePermission(permission: keyof UserLevelBenefits) {
  const { hasPermission } = useAuth();
  return hasPermission(permission);
}

// Hook para limites de uso
export function useUsageLimit(action: 'conversation' | 'module' | 'certificate') {
  const { checkUsageLimit } = useAuth();
  return checkUsageLimit(action);
}

export default useAuth;