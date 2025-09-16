/**
 * Serviço de Autenticação JWT
 * Substitui Firebase Auth por sistema JWT próprio
 * Mantém compatibilidade com interface anterior
 */

import { jwtClient } from '@/lib/auth/jwt-client';
import type {
  AuthUser,
  UserProfile,
  AuthUserProfile,
  UserRole,
  AuthenticationState,
  LoginOptions,
  RegistrationData,
} from '@/types/auth';
import {
  USER_LEVEL_CONFIG,
  AUTH_EVENTS,
} from '@/types/auth';

export class AuthService {
  private static instance: AuthService;
  private authStateCallbacks: ((authState: AuthenticationState) => void)[] = [];
  private currentAuthState: AuthenticationState = {
    user: null,
    loading: true,
    isLoading: true,
    isAuthenticated: false,
    isAnonymous: false,
    error: null,
  };

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  constructor() {
    this.initializeAuth();
  }

  private async initializeAuth() {
    try {
      // Verificar se há token válido
      if (jwtClient.isAuthenticated()) {
        const user = await jwtClient.getCurrentUser();
        if (user) {
          const authUser = this.convertToAuthUser(user);
          const profile = await this.loadUserProfile(authUser.uid);
          const extendedUser = this.extendUserWithProfile(authUser, profile);

          this.updateAuthState({
            user: extendedUser,
            loading: false,
            isLoading: false,
            isAuthenticated: true,
            isAnonymous: extendedUser.isAnonymous,
            error: null,
          });
          return;
        }
      }

      // Sem usuário autenticado
      this.updateAuthState({
        user: null,
        loading: false,
        isLoading: false,
        isAuthenticated: false,
        isAnonymous: false,
        error: null,
      });
    } catch (error) {
      console.error('Erro na inicialização da auth:', error);
      this.updateAuthState({
        user: null,
        loading: false,
        isLoading: false,
        isAuthenticated: false,
        isAnonymous: false,
        error: 'Erro na inicialização da autenticação',
      });
    }
  }

  private convertToAuthUser(jwtUser: any): AuthUser {
    return {
      uid: jwtUser.id,
      email: jwtUser.email,
      displayName: jwtUser.name,
      emailVerified: jwtUser.verified,
      isAnonymous: false,
      photoURL: jwtUser.picture,
      provider: jwtUser.provider,
    };
  }

  private async loadUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const stored = localStorage.getItem(`user-profile-${userId}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    }
    return null;
  }

  private extendUserWithProfile(authUser: AuthUser, profile: UserProfile | null): AuthUser {
    const role = this.getUserRole(authUser);
    const permissions = USER_LEVEL_CONFIG[role];

    return {
      ...authUser,
      ...(profile || {}),
      // AuthUser properties
      emailVerified: authUser.emailVerified,
      isAnonymous: authUser.isAnonymous,
      provider: authUser.provider,
      // Extended properties
      role,
      verified: authUser.emailVerified,
      lastLoginAt: new Date().toISOString(),
      permissions,
      usage: {
        totalSessions: profile?.history?.totalSessions || 0,
        totalMessages: profile?.stats?.messageCount || 0,
        totalModulesCompleted: profile?.history?.completedModules?.length || 0,
        totalCertificatesEarned: 0,
        lastActivity: profile?.stats?.lastActiveAt || new Date().toISOString(),
        currentStreak: 0,
        longestStreak: 0,
        favoritePersona: profile?.history?.lastPersona || 'ga',
        averageSessionDuration: profile?.stats?.averageSessionDuration || 0,
      },
    } as AuthUserProfile;
  }

  private getUserRole(user: AuthUser): UserRole {
    if (!user || user.isAnonymous) return 'visitor';

    const adminEmails = [
      'neeliogomes@hotmail.com',
      'sousa.analine@gmail.com',
      'roteirosdedispensacaounb@gmail.com',
      'neliogmoura@gmail.com',
    ];

    if (user.email && adminEmails.includes(user.email.toLowerCase())) {
      return 'admin';
    }

    return 'registered';
  }

  private updateAuthState(newState: Partial<AuthenticationState>) {
    this.currentAuthState = { ...this.currentAuthState, ...newState };
    this.authStateCallbacks.forEach(callback => {
      try {
        callback(this.currentAuthState);
      } catch (error) {
        console.error('Erro no callback de auth state:', error);
      }
    });
  }

  // ============================================================================
  // PUBLIC AUTHENTICATION METHODS
  // ============================================================================

  async loginWithGoogle(options?: LoginOptions): Promise<AuthUserProfile> {
    try {
      this.updateAuthState({ loading: true, isLoading: true, error: null });

      // Iniciar fluxo OAuth Google via jwtClient
      const result = await jwtClient.initiateGoogleAuth();

      // Armazenar state para verificação
      sessionStorage.setItem('oauth_state', result.state);

      // Redirecionar para Google OAuth
      window.location.href = result.authUrl;

      // O resto será processado no callback OAuth
      throw new Error('Redirecting to Google OAuth');
    } catch (error: any) {
      this.updateAuthState({
        loading: false,
        isLoading: false,
        error: error.message || 'Erro no login com Google',
      });
      throw error;
    }
  }

  async loginWithEmail(email: string, password: string): Promise<AuthUserProfile> {
    try {
      this.updateAuthState({ loading: true, isLoading: true, error: null });

      const response = await jwtClient.loginWithEmail(email, password);
      const authUser = this.convertToAuthUser(response.user);
      const profile = await this.loadUserProfile(authUser.uid);
      const extendedUser = this.extendUserWithProfile(authUser, profile);

      this.updateAuthState({
        user: extendedUser,
        loading: false,
        isLoading: false,
        isAuthenticated: true,
        isAnonymous: extendedUser.isAnonymous,
        error: null,
      });

      this.trackAuthEvent(AUTH_EVENTS.LOGIN_SUCCESS, {
        provider: 'email',
        userId: extendedUser.uid,
      });

      return extendedUser;
    } catch (error: any) {
      const errorMessage = error.message || 'Erro no login com email';

      this.updateAuthState({
        loading: false,
        isLoading: false,
        error: errorMessage,
      });

      this.trackAuthEvent(AUTH_EVENTS.LOGIN_FAILURE, {
        provider: 'email',
        error: errorMessage,
      });

      throw new Error(errorMessage);
    }
  }

  async registerWithEmail(data: RegistrationData): Promise<AuthUserProfile> {
    // Email registration não implementado ainda no backend
    throw new Error('Registro com email ainda não implementado. Use login com Google.');
  }

  async logout(): Promise<void> {
    try {
      this.updateAuthState({ loading: true, isLoading: true, error: null });

      await jwtClient.logout();

      this.updateAuthState({
        user: null,
        loading: false,
        isLoading: false,
        isAuthenticated: false,
        isAnonymous: false,
        error: null,
      });

      this.trackAuthEvent(AUTH_EVENTS.LOGOUT, {
        userId: this.currentAuthState.user?.uid,
      });
    } catch (error: any) {
      const errorMessage = error.message || 'Erro no logout';
      this.updateAuthState({
        loading: false,
        isLoading: false,
        error: errorMessage,
      });
      throw new Error(errorMessage);
    }
  }

  // ============================================================================
  // USER PROFILE MANAGEMENT
  // ============================================================================

  async updateAuthUserProfile(userId: string, updates: Partial<AuthUser>): Promise<void> {
    try {
      // Atualizar no backend se usuário está autenticado
      if (this.currentAuthState.user && !this.currentAuthState.user.isAnonymous) {
        try {
          await jwtClient.updateProfile({
            name: updates.displayName || undefined,
            picture: undefined
          });
        } catch (backendError) {
          console.warn('Erro ao atualizar perfil no backend:', backendError);
        }
      }

      // Atualizar localmente
      const currentProfile = await this.loadUserProfile(userId);
      const updatedProfile = {
        ...currentProfile,
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      localStorage.setItem(`user-profile-${userId}`, JSON.stringify(updatedProfile));

      // Atualizar auth state se for o usuário atual
      if (this.currentAuthState.user?.uid === userId) {
        const extendedUser = this.extendUserWithProfile(
          this.currentAuthState.user as any,
          updatedProfile as UserProfile
        );

        this.updateAuthState({
          user: extendedUser,
        });
      }

      this.trackAuthEvent(AUTH_EVENTS.PROFILE_UPDATE, {
        userId,
        updates: Object.keys(updates),
      });
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao atualizar perfil');
    }
  }

  async upgradeUserRole(userId: string, newRole: UserRole): Promise<void> {
    try {
      if (!this.currentAuthState.user || this.currentAuthState.user.uid !== userId) {
        throw new Error('Usuário não autenticado');
      }

      const currentProfile = await this.loadUserProfile(userId);
      const updatedProfile = {
        ...currentProfile,
        role: newRole,
        updatedAt: new Date().toISOString(),
      };

      localStorage.setItem(`user-profile-${userId}`, JSON.stringify(updatedProfile));

      const extendedUser = this.extendUserWithProfile(
        this.currentAuthState.user as any,
        updatedProfile as UserProfile
      );
      extendedUser.role = newRole;
      extendedUser.permissions = USER_LEVEL_CONFIG[newRole];

      this.updateAuthState({
        user: extendedUser,
      });

      this.trackAuthEvent(AUTH_EVENTS.ROLE_UPGRADE, {
        userId,
        newRole,
      });
    } catch (error: any) {
      throw new Error(error.message || 'Erro ao fazer upgrade de role');
    }
  }

  // ============================================================================
  // PERMISSION HELPERS
  // ============================================================================

  hasPermission(user: AuthUser | null, permission: keyof NonNullable<AuthUser['permissions']>): boolean {
    if (!user || !user.permissions) return false;
    return Boolean(user.permissions[permission]);
  }

  canAccessFeature(user: AuthUser | null, feature: string): boolean {
    if (!user) return false;

    switch (feature) {
      case 'dashboard':
        return user.permissions?.canAccessDashboard || false;
      case 'admin':
        return user.permissions?.canAccessAdmin || false;
      case 'certificates':
        return user.permissions?.canExportCertificates || false;
      case 'advanced_modules':
        return user.permissions?.canAccessAdvancedModules || false;
      case 'analytics':
        return user.permissions?.canViewAnalytics || false;
      default:
        return true;
    }
  }

  // ============================================================================
  // AUTH STATE MANAGEMENT
  // ============================================================================

  onAuthStateChange(callback: (authState: AuthenticationState) => void): () => void {
    this.authStateCallbacks.push(callback);

    // Chamar imediatamente com o estado atual
    callback(this.currentAuthState);

    // Retornar função de cleanup
    return () => {
      const index = this.authStateCallbacks.indexOf(callback);
      if (index > -1) {
        this.authStateCallbacks.splice(index, 1);
      }
    };
  }

  getCurrentAuthState(): AuthenticationState {
    return this.currentAuthState;
  }

  // ============================================================================
  // ANALYTICS
  // ============================================================================

  private trackAuthEvent(event: string, data?: any) {
    try {
      console.log(`[Auth Event] ${event}`, data);
      // Implementar analytics se necessário
    } catch (error) {
      console.error('Erro ao rastrear evento de auth:', error);
    }
  }

  // ============================================================================
  // OAUTH CALLBACK HANDLING
  // ============================================================================

  async handleOAuthCallback(code: string, state: string): Promise<AuthUserProfile> {
    try {
      this.updateAuthState({ loading: true, isLoading: true, error: null });

      const response = await jwtClient.completeGoogleAuth(code, state);
      const authUser = this.convertToAuthUser(response.user);
      const profile = await this.loadUserProfile(authUser.uid);
      const extendedUser = this.extendUserWithProfile(authUser, profile);

      this.updateAuthState({
        user: extendedUser,
        loading: false,
        isLoading: false,
        isAuthenticated: true,
        isAnonymous: extendedUser.isAnonymous,
        error: null,
      });

      this.trackAuthEvent(AUTH_EVENTS.LOGIN_SUCCESS, {
        provider: 'google',
        userId: extendedUser.uid,
      });

      return extendedUser;
    } catch (error: any) {
      const errorMessage = error.message || 'Erro no callback OAuth';

      this.updateAuthState({
        loading: false,
        isLoading: false,
        error: errorMessage,
      });

      this.trackAuthEvent(AUTH_EVENTS.LOGIN_FAILURE, {
        provider: 'google',
        error: errorMessage,
      });

      throw new Error(errorMessage);
    }
  }
}

// Singleton instance
export const authService = AuthService.getInstance();
export default authService;