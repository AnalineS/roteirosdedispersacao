/**
 * Hook de Autenticação para Sistema 3 Níveis
 */

import { useState, useEffect, useCallback } from 'react';
import { authService } from '@/services/auth';
import {
  UserProfile,
  UserRole,
  AuthState,
  LoginOptions,
  RegistrationData,
  USER_LEVEL_BENEFITS,
} from '@/types/auth';

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange(setAuthState);
    return unsubscribe;
  }, []);

  // ============================================================================
  // AUTHENTICATION ACTIONS
  // ============================================================================

  const loginWithGoogle = useCallback(async (options?: LoginOptions) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const user = await authService.loginWithGoogle(options);
      return user;
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erro no login',
      }));
      throw error;
    }
  }, []);

  const loginWithEmail = useCallback(async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const user = await authService.loginWithEmail(email, password);
      return user;
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erro no login',
      }));
      throw error;
    }
  }, []);

  const register = useCallback(async (data: RegistrationData) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const user = await authService.registerWithEmail(data);
      return user;
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erro no registro',
      }));
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      await authService.logout();
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Erro no logout',
      }));
      throw error;
    }
  }, []);

  // ============================================================================
  // USER MANAGEMENT
  // ============================================================================

  const updateProfile = useCallback(async (updates: Partial<UserProfile>) => {
    if (!authState.user) {
      throw new Error('Usuário não está logado');
    }

    try {
      await authService.updateUserProfile(authState.user.uid, updates);
    } catch (error) {
      throw error;
    }
  }, [authState.user]);

  const upgradeRole = useCallback(async (newRole: UserRole) => {
    if (!authState.user) {
      throw new Error('Usuário não está logado');
    }

    try {
      await authService.upgradeUserRole(authState.user.uid, newRole);
    } catch (error) {
      throw error;
    }
  }, [authState.user]);

  // ============================================================================
  // PERMISSION HELPERS
  // ============================================================================

  const hasPermission = useCallback((permission: keyof UserProfile['permissions']) => {
    return authService.hasPermission(authState.user, permission);
  }, [authState.user]);

  const canAccessFeature = useCallback((feature: string) => {
    return authService.canAccessFeature(authState.user, feature);
  }, [authState.user]);

  const hasRole = useCallback((role: UserRole) => {
    return authState.user?.role === role;
  }, [authState.user]);

  const isVisitor = useCallback(() => {
    return !authState.isAuthenticated || authState.user?.role === 'visitor';
  }, [authState.isAuthenticated, authState.user]);

  const isRegistered = useCallback(() => {
    return authState.user?.role === 'registered' || authState.user?.role === 'admin';
  }, [authState.user]);

  const isAdmin = useCallback(() => {
    return authState.user?.role === 'admin';
  }, [authState.user]);

  // ============================================================================
  // USAGE LIMITS
  // ============================================================================

  const checkUsageLimit = useCallback((action: 'conversation' | 'module' | 'certificate') => {
    if (!authState.user) {
      // Limites para visitantes
      return {
        canPerform: true, // Permitir ação mas com limitação
        remaining: 10,
        limit: 10,
        message: 'Cadastre-se para ter acesso ilimitado',
      };
    }

    const permissions = authState.user.permissions;
    const usage = authState.user.usage;

    switch (action) {
      case 'conversation':
        const dailyConversations = 0; // Buscar do histórico diário
        return {
          canPerform: dailyConversations < permissions.maxConversationsPerDay,
          remaining: permissions.maxConversationsPerDay - dailyConversations,
          limit: permissions.maxConversationsPerDay,
          message: permissions.maxConversationsPerDay === 999 ? 'Ilimitado' : undefined,
        };
      
      case 'module':
        const dailyModules = 0; // Buscar do histórico diário
        return {
          canPerform: dailyModules < permissions.maxModulesPerDay,
          remaining: permissions.maxModulesPerDay - dailyModules,
          limit: permissions.maxModulesPerDay,
          message: permissions.maxModulesPerDay === 999 ? 'Ilimitado' : undefined,
        };
      
      case 'certificate':
        const monthlyCertificates = 0; // Buscar do histórico mensal
        return {
          canPerform: permissions.canExportCertificates && 
                     monthlyCertificates < permissions.maxCertificatesPerMonth,
          remaining: permissions.maxCertificatesPerMonth - monthlyCertificates,
          limit: permissions.maxCertificatesPerMonth,
          message: permissions.maxCertificatesPerMonth === 999 ? 'Ilimitado' : 
                  !permissions.canExportCertificates ? 'Cadastre-se para acessar certificados' : undefined,
        };
      
      default:
        return {
          canPerform: true,
          remaining: 999,
          limit: 999,
        };
    }
  }, [authState.user]);

  // ============================================================================
  // CLEAR ERROR
  // ============================================================================

  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    // State
    user: authState.user,
    isLoading: authState.isLoading,
    isAuthenticated: authState.isAuthenticated,
    error: authState.error,
    
    // Actions
    loginWithGoogle,
    loginWithEmail,
    register,
    logout,
    updateProfile,
    upgradeRole,
    clearError,
    
    // Permissions
    hasPermission,
    canAccessFeature,
    hasRole,
    isVisitor,
    isRegistered,
    isAdmin,
    
    // Usage
    checkUsageLimit,
    
    // Helpers
    getUserBenefits: () => authState.user ? USER_LEVEL_BENEFITS[authState.user.role] : USER_LEVEL_BENEFITS.visitor,
    getUserRole: () => authState.user?.role || 'visitor',
  };
}

// Hook específico para componentes que precisam de autenticação
export function useRequireAuth(requiredRole?: UserRole) {
  const auth = useAuth();
  
  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated && requiredRole && requiredRole !== 'visitor') {
      // Redirecionar para login ou mostrar modal
      console.warn(`Acesso negado: requer role ${requiredRole}`);
    }
  }, [auth.isLoading, auth.isAuthenticated, requiredRole]);

  return auth;
}

// Hook para verificar permissões específicas
export function usePermission(permission: keyof UserProfile['permissions']) {
  const { hasPermission } = useAuth();
  return hasPermission(permission);
}

// Hook para limites de uso
export function useUsageLimit(action: 'conversation' | 'module' | 'certificate') {
  const { checkUsageLimit } = useAuth();
  return checkUsageLimit(action);
}