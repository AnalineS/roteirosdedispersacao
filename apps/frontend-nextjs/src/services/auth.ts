/**
 * Serviço de Autenticação 3 Níveis
 * Sistema baseado em JWT com armazenamento local
 */
import {
  UserProfile,
  UserRole,
  AuthState,
  AuthUser,
  LoginOptions,
  RegistrationData,
  USER_LEVEL_CONFIG,
  AUTH_EVENTS,
  LoginCredentials,
  SocialAuthCredentials,
} from '@/types/auth';
import Analytics from './analytics';
import { apiClient } from './api';

// Tipos para compatibilidade
type SocialCredentials = {
  provider: 'google' | 'facebook' | 'github';
  token: string;
  email?: string;
  displayName?: string;
};

export class AuthService {
  private static instance: AuthService;
  private authStateCallbacks: ((authState: AuthState) => void)[] = [];

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  constructor() {
    this.setupAuthListener();
  }

  // ============================================================================
  // AUTH STATE MANAGEMENT
  // ============================================================================

  private setupAuthListener() {
    // Verificar token no localStorage e validar
    this.checkStoredAuth();
  }

  private async checkStoredAuth() {
    try {
      const token = localStorage.getItem('auth_token');
      const userData = localStorage.getItem('user_data');

      if (token && userData) {
        const parsedUser = JSON.parse(userData) as AuthUser;

        // Validar token com backend
        const isValid = await this.validateToken(token);

        if (isValid) {
          this.notifyAuthStateChange({
            user: parsedUser,
            loading: false,
            isAuthenticated: true,
            error: null,
            isAnonymous: false,
          });
        } else {
          // Token inválido - limpar storage
          this.clearAuthStorage();
          this.notifyAuthStateChange({
            user: null,
            loading: false,
            isAuthenticated: false,
            error: null,
            isAnonymous: true,
          });
        }
      } else {
        // Usuário anônimo
        this.notifyAuthStateChange({
          user: null,
          loading: false,
          isAuthenticated: false,
          error: null,
          isAnonymous: true,
        });
      }
    } catch (error) {
      console.error('[Auth] Error checking stored auth:', error);
      this.clearAuthStorage();
      this.notifyAuthStateChange({
        user: null,
        loading: false,
        isAuthenticated: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        isAnonymous: true,
      });
    }
  }

  private async validateToken(token: string): Promise<boolean> {
    try {
      const response = await fetch('/api/auth/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private clearAuthStorage() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('refresh_token');
  }

  onAuthStateChange(callback: (authState: AuthState) => void) {
    this.authStateCallbacks.push(callback);
    return () => {
      this.authStateCallbacks = this.authStateCallbacks.filter(cb => cb !== callback);
    };
  }

  private notifyAuthStateChange(authState: AuthState) {
    this.authStateCallbacks.forEach(callback => callback(authState));
  }

  // ============================================================================
  // USER PROFILE MANAGEMENT
  // ============================================================================

  private async loadUserProfile(authData: AuthUser): Promise<AuthUser> {
    try {
      // Buscar perfil completo do backend
      const profile = await apiClient.get<AuthUser>(`/api/auth/profile/${authData.uid}`);
      return {
        ...authData,
        ...profile,
        lastLoginAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('[Auth] Error loading user profile:', error);
      return authData;
    }
  }

  private async createUserProfile(userData: Partial<AuthUser>): Promise<AuthUser> {
    const role: UserRole = this.determineInitialRole(userData.email);

    const userProfile: AuthUser = {
      uid: userData.uid || crypto.randomUUID(),
      email: userData.email || null,
      displayName: userData.displayName || null,
      emailVerified: userData.emailVerified || false,
      isAnonymous: false,
      photoURL: userData.photoURL,
      provider: userData.provider || 'email',
      role,
      type: 'professional',
      preferences: this.getDefaultUserPreferences(),
      permissions: USER_LEVEL_CONFIG[role],
      usage: this.getDefaultUsage(),
      lastLoginAt: new Date().toISOString(),
    };

    try {
      // Salvar no backend
      await apiClient.post('/api/auth/profile', userProfile as unknown as Record<string, unknown>);

      // Track analytics
      Analytics.event('USER', 'signup', userData.provider || 'email');
      Analytics.user({
        userType: role as 'visitor' | 'registered' | 'admin',
        institution: userData.institution,
      });

      return userProfile;
    } catch (error) {
      console.error('[Auth] Error creating user profile:', error);
      throw new Error('Erro ao criar perfil do usuário');
    }
  }

  private determineInitialRole(email?: string | null): UserRole {
    if (!email) return 'registered';

    // Emails de admin predefinidos
    const adminEmails = [
      'neeliogomes@hotmail.com',
      'sousa.analine@gmail.com',
      'roteirosdedispensacao@gmail.com',
      'neliogmoura@gmail.com',
      // Adicionar mais emails de admin conforme necessário
    ];

    if (adminEmails.includes(email.toLowerCase())) {
      return 'admin';
    }

    return 'registered';
  }

  private getDefaultUserPreferences() {
    return {
      language: 'simple' as const,
      notifications: true,
      theme: 'auto' as const,
      emailUpdates: true,
      dataCollection: true,
      lgpdConsent: false,
    };
  }

  private getDefaultUsage() {
    return {
      totalSessions: 0,
      totalMessages: 0,
      totalModulesCompleted: 0,
      totalCertificatesEarned: 0,
      lastActivity: new Date().toISOString(),
      currentStreak: 0,
      longestStreak: 0,
      averageSessionDuration: 0,
    };
  }

  private mapApiToAuthUser(uid: string, data: Record<string, unknown>): AuthUser {
    return {
      uid,
      email: typeof data.email === 'string' ? data.email : null,
      displayName: typeof data.displayName === 'string' ? data.displayName : null,
      emailVerified: Boolean(data.verified),
      isAnonymous: false,
      photoURL: typeof data.photoURL === 'string' ? data.photoURL : undefined,
      provider: (data.provider as 'google' | 'email' | 'anonymous') || 'email',
      role: (data.role as UserRole) || 'registered',
      type: (data.type as 'patient' | 'professional' | 'student' | 'admin') || 'professional',
      institution: typeof data.institution === 'string' ? data.institution : undefined,
      specialization: typeof data.specialization === 'string' ? data.specialization : undefined,
      preferences: {
        ...this.getDefaultUserPreferences(),
        ...(typeof data.preferences === 'object' && data.preferences ? data.preferences : {}),
      },
      permissions: {
        ...USER_LEVEL_CONFIG[(data.role as UserRole) || 'registered'],
        ...(typeof data.permissions === 'object' && data.permissions ? data.permissions : {}),
      },
      usage: {
        ...this.getDefaultUsage(),
        ...(typeof data.usage === 'object' && data.usage ? data.usage : {}),
      },
      lastLoginAt: typeof data.lastLoginAt === 'string' ? data.lastLoginAt : new Date().toISOString(),
    };
  }

  // ============================================================================
  // AUTHENTICATION METHODS
  // ============================================================================

  async loginWithGoogle(credentials: SocialCredentials): Promise<AuthUser> {
    try {
      Analytics.event('USER', 'login', 'google');

      const response = await apiClient.post<{ token: string; user: AuthUser }>('/api/auth/google', {
        provider: credentials.provider,
        token: credentials.token,
        email: credentials.email,
        displayName: credentials.displayName,
      });

      // Salvar token e dados do usuário
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('user_data', JSON.stringify(response.user));

      // Atualizar estado
      this.notifyAuthStateChange({
        user: response.user,
        loading: false,
        isAuthenticated: true,
        error: null,
        isAnonymous: false,
      });

      return response.user;
    } catch (error) {
      Analytics.exception(`Login Google falhou: ${error}`, false);
      throw new Error(this.getAuthErrorMessage('auth/google-signin-failed'));
    }
  }

  async loginWithEmail(credentials: LoginCredentials): Promise<AuthUser> {
    try {
      Analytics.event('USER', 'login', 'email');

      const response = await apiClient.post<{ token: string; user: AuthUser }>('/api/auth/login', {
        email: credentials.email,
        password: credentials.password,
      });

      // Salvar token e dados do usuário
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('user_data', JSON.stringify(response.user));

      // Atualizar estado
      this.notifyAuthStateChange({
        user: response.user,
        loading: false,
        isAuthenticated: true,
        error: null,
        isAnonymous: false,
      });

      return response.user;
    } catch (error) {
      Analytics.exception(`Login email falhou: ${error}`, false);
      throw new Error(this.getAuthErrorMessage('auth/invalid-email'));
    }
  }

  async registerWithEmail(data: RegistrationData): Promise<AuthUser> {
    try {
      const response = await apiClient.post<{ token: string; user: AuthUser }>('/api/auth/register', {
        email: data.email,
        password: data.password,
        displayName: data.displayName,
        institution: data.institution,
        specialization: data.specialization,
        acceptTerms: data.acceptTerms,
        acceptPrivacy: data.acceptPrivacy,
      });

      // Salvar token e dados do usuário
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('user_data', JSON.stringify(response.user));

      // Atualizar estado
      this.notifyAuthStateChange({
        user: response.user,
        loading: false,
        isAuthenticated: true,
        error: null,
        isAnonymous: false,
      });

      Analytics.event('USER', 'signup', 'email');

      return response.user;
    } catch (error) {
      Analytics.exception(`Registro falhou: ${error}`, false);
      throw new Error(this.getAuthErrorMessage('auth/email-already-in-use'));
    }
  }

  async logout(): Promise<void> {
    try {
      Analytics.event('USER', 'logout');

      // Limpar dados locais
      this.clearAuthStorage();

      // Notificar mudança de estado
      this.notifyAuthStateChange({
        user: null,
        loading: false,
        isAuthenticated: false,
        error: null,
        isAnonymous: true,
      });

      // Opcional: notificar backend sobre logout
      try {
        await apiClient.post('/api/auth/logout', {});
      } catch (error) {
        // Falha no logout do backend não deve impedir o logout local
        console.warn('[Auth] Backend logout failed:', error);
      }
    } catch (error) {
      console.error('[Auth] Logout error:', error);
      throw new Error('Erro ao fazer logout');
    }
  }

  // ============================================================================
  // USER MANAGEMENT
  // ============================================================================

  async updateUserProfile(uid: string, updates: Partial<AuthUser>): Promise<void> {
    try {
      await apiClient.post(`/api/auth/profile/${uid}`, {
        ...updates,
        lastUpdated: new Date().toISOString(),
      });

      // Atualizar dados locais se for o usuário atual
      const currentUserData = localStorage.getItem('user_data');
      if (currentUserData) {
        const currentUser = JSON.parse(currentUserData) as AuthUser;
        if (currentUser.uid === uid) {
          const updatedUser = { ...currentUser, ...updates };
          localStorage.setItem('user_data', JSON.stringify(updatedUser));

          // Notificar mudança de estado
          this.notifyAuthStateChange({
            user: updatedUser,
            loading: false,
            isAuthenticated: true,
            error: null,
            isAnonymous: false,
          });
        }
      }

      Analytics.event('USER', 'profile_update');
    } catch (error) {
      console.error('[Auth] Error updating user profile:', error);
      throw new Error('Erro ao atualizar perfil');
    }
  }

  async upgradeUserRole(uid: string, newRole: UserRole): Promise<void> {
    try {
      await apiClient.post(`/api/auth/role/${uid}`, {
        role: newRole,
        permissions: USER_LEVEL_CONFIG[newRole],
        lastUpdated: new Date().toISOString(),
      });

      // Atualizar dados locais se for o usuário atual
      const currentUserData = localStorage.getItem('user_data');
      if (currentUserData) {
        const currentUser = JSON.parse(currentUserData) as AuthUser;
        if (currentUser.uid === uid) {
          const updatedUser = {
            ...currentUser,
            role: newRole,
            permissions: USER_LEVEL_CONFIG[newRole],
          };
          localStorage.setItem('user_data', JSON.stringify(updatedUser));

          // Notificar mudança de estado
          this.notifyAuthStateChange({
            user: updatedUser,
            loading: false,
            isAuthenticated: true,
            error: null,
            isAnonymous: false,
          });
        }
      }

      Analytics.event('USER', 'role_upgrade', newRole);
    } catch (error) {
      console.error('[Auth] Error upgrading user role:', error);
      throw new Error('Erro ao atualizar role do usuário');
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  getCurrentUser(): AuthUser | null {
    try {
      const userData = localStorage.getItem('user_data');
      return userData ? JSON.parse(userData) as AuthUser : null;
    } catch {
      return null;
    }
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data');
    return !!(token && userData);
  }

  hasPermission(user: AuthUser | null, permission: keyof AuthUser['permissions']): boolean {
    if (!user || !user.permissions) return false;
    return user.permissions[permission] as boolean;
  }

  canAccessFeature(user: AuthUser | null, feature: string): boolean {
    if (!user) {
      // Visitantes têm acesso básico
      const basicFeatures = ['chat', 'modules', 'faq', 'calculator'];
      return basicFeatures.includes(feature);
    }

    return true; // Usuários autenticados têm acesso a tudo (baseado em permissions)
  }

  private getAuthErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'Usuário não encontrado';
      case 'auth/wrong-password':
        return 'Senha incorreta';
      case 'auth/email-already-in-use':
        return 'Email já está em uso';
      case 'auth/weak-password':
        return 'Senha muito fraca';
      case 'auth/invalid-email':
        return 'Email inválido';
      case 'auth/popup-closed-by-user':
        return 'Login cancelado pelo usuário';
      case 'auth/network-request-failed':
        return 'Erro de conexão';
      case 'auth/google-signin-failed':
        return 'Erro no login com Google';
      default:
        return 'Erro de autenticação';
    }
  }
}

// Instância singleton
export const authService = AuthService.getInstance();
export default authService;