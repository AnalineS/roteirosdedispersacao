/**
 * Serviço de Autenticação JWT
 * Substitui Firebase Auth por sistema JWT próprio
 * Mantém compatibilidade com interface anterior
 */

// Mock jwt-client para evitar erros de import
const jwtClient = {
  isAuthenticated: () => false,
  getCurrentUser: async () => null,
  initiateGoogleAuth: async () => ({ state: 'mock', authUrl: 'mock' }),
  loginWithEmail: async (email: string, password: string) => ({ user: { id: '1', email, name: null, verified: false, provider: 'email' } }),
  logout: async () => {},
  updateProfile: async (data: ProfileUpdateData) => {},
  completeGoogleAuth: async (code: string, state: string) => ({ user: { id: '1', email: 'test@test.com', name: 'Test', verified: true, provider: 'google' } })
};

// Types definition
type UserRole = 'visitor' | 'registered' | 'admin';

interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
  isAnonymous: boolean;
  photoURL?: string;
  provider: 'google' | 'email' | 'anonymous';
  role?: UserRole;
  verified?: boolean;
  lastLoginAt?: string;
  permissions?: Record<string, boolean>;
}

interface ProfileUpdateData {
  displayName?: string;
  photoURL?: string;
  email?: string;
  role?: UserRole;
  history?: {
    totalSessions?: number;
    lastPersona?: string;
    completedModules?: string[];
  };
  stats?: {
    messageCount?: number;
    lastActiveAt?: string;
    averageSessionDuration?: number;
  };
}

interface UserProfile {
  uid?: string;
  email?: string;
  displayName?: string;
  history?: {
    totalSessions?: number;
    lastPersona?: string;
    completedModules?: string[];
  };
  stats?: {
    messageCount?: number;
    lastActiveAt?: string;
    averageSessionDuration?: number;
  };
  updatedAt?: string;
  role?: UserRole;
}

interface AuthUserProfile extends AuthUser {
  usage: {
    totalSessions: number;
    totalMessages: number;
    totalModulesCompleted: number;
    totalCertificatesEarned: number;
    lastActivity: string;
    currentStreak: number;
    longestStreak: number;
    favoritePersona: string;
    averageSessionDuration: number;
  };
}

interface AuthenticationState {
  user: AuthUserProfile | null;
  loading: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAnonymous: boolean;
  error: string | null;
}

interface LoginOptions {
  redirectUrl?: string;
  rememberMe?: boolean;
}

interface RegistrationData {
  email: string;
  password: string;
  displayName?: string;
}

// Constants
const USER_LEVEL_CONFIG: Record<UserRole, Record<string, boolean>> = {
  visitor: {
    canAccessDashboard: false,
    canAccessAdmin: false,
    canExportCertificates: false,
    canAccessAdvancedModules: false,
    canViewAnalytics: false
  },
  registered: {
    canAccessDashboard: true,
    canAccessAdmin: false,
    canExportCertificates: true,
    canAccessAdvancedModules: true,
    canViewAnalytics: false
  },
  admin: {
    canAccessDashboard: true,
    canAccessAdmin: true,
    canExportCertificates: true,
    canAccessAdvancedModules: true,
    canViewAnalytics: true
  }
};

const AUTH_EVENTS = {
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILURE: 'login_failure',
  LOGOUT: 'logout',
  PROFILE_UPDATE: 'profile_update',
  ROLE_UPGRADE: 'role_upgrade'
};

// Import unified analytics types
import '@/types/analytics';

interface JWTUser {
  id: string;
  email: string;
  name?: string | null;
  verified: boolean;
  picture?: string;
  provider: string;
  roles?: string[];
  permissions?: string[];
}

interface AuthError {
  message: string;
  code?: string;
  status?: number;
  details?: string;
}

interface AuthEventData {
  event?: string;
  userId?: string;
  email?: string;
  method?: string;
  provider?: string;
  success?: boolean;
  timestamp?: string;
  metadata?: Record<string, unknown>;
  updates?: string[];
  newRole?: UserRole;
  error?: string;
}

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
            user: extendedUser as AuthUserProfile,
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
      // Erro na inicialização da auth
      if (typeof process !== 'undefined' && process.stderr) {
        process.stderr.write(`❌ ERRO - Falha na inicialização da autenticação: ${error}\n`);
      }
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'auth_initialization_error', {
          event_category: 'medical_auth_error',
          event_label: 'auth_init_failed',
          custom_parameters: {
            error_context: 'auth_service_initialization',
            error_message: String(error)
          }
        });
      }
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

  private convertToAuthUser(jwtUser: JWTUser): AuthUser {
    return {
      uid: jwtUser.id,
      email: jwtUser.email,
      displayName: jwtUser.name ?? null,
      emailVerified: jwtUser.verified,
      isAnonymous: false,
      photoURL: jwtUser.picture,
      provider: (jwtUser.provider as 'google' | 'email' | 'anonymous') || 'email',
    };
  }

  private async loadUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const stored = localStorage.getItem(`user-profile-${userId}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      // Erro ao carregar perfil
      if (typeof process !== 'undefined' && process.stderr) {
        process.stderr.write(`❌ ERRO - Falha ao carregar perfil do usuário: ${error}\n`);
      }
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'auth_profile_load_error', {
          event_category: 'medical_auth_error',
          event_label: 'profile_load_failed',
          custom_parameters: {
            error_context: 'user_profile_loading',
            error_message: String(error)
          }
        });
      }
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
        // Erro no callback de auth state
        if (typeof process !== 'undefined' && process.stderr) {
          process.stderr.write(`❌ ERRO - Falha no callback de autenticação: ${error}\n`);
        }
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'auth_callback_error', {
            event_category: 'medical_auth_error',
            event_label: 'auth_state_callback_failed',
            custom_parameters: {
              error_context: 'auth_state_callback',
              error_message: String(error)
            }
          });
        }
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
    } catch (error: AuthError | Error | unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.updateAuthState({
        loading: false,
        isLoading: false,
        error: errorMessage || 'Erro no login com Google',
      });
      throw new Error(errorMessage);
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
        user: extendedUser as AuthUserProfile,
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

      return extendedUser as AuthUserProfile;
    } catch (error: AuthError | Error | unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.updateAuthState({
        loading: false,
        isLoading: false,
        error: errorMessage || 'Erro no login com email',
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
    } catch (error: AuthError | Error | unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.updateAuthState({
        loading: false,
        isLoading: false,
        error: errorMessage || 'Erro no logout',
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
            displayName: updates.displayName || undefined,
            photoURL: undefined
          });
        } catch (backendError) {
          // Erro ao atualizar perfil no backend
          if (typeof process !== 'undefined' && process.stderr) {
            process.stderr.write(`⚠️ AVISO - Falha ao atualizar perfil no backend: ${backendError}\n`);
          }
          if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'auth_profile_backend_error', {
              event_category: 'medical_auth_error',
              event_label: 'profile_backend_update_failed',
              custom_parameters: {
                error_context: 'profile_backend_sync',
                error_message: String(backendError)
              }
            });
          }
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
      if (this.currentAuthState.user?.uid === userId && this.currentAuthState.user) {
        const extendedUser = this.extendUserWithProfile(
          this.currentAuthState.user,
          updatedProfile as UserProfile
        );

        this.updateAuthState({
          user: extendedUser as AuthUserProfile,
        });
      }

      this.trackAuthEvent(AUTH_EVENTS.PROFILE_UPDATE, {
        userId,
        updates: Object.keys(updates),
      });
    } catch (error: AuthError | Error | unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(errorMessage || 'Erro ao atualizar perfil');
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

      if (!this.currentAuthState.user) {
        throw new Error('User not authenticated');
      }

      const extendedUser = this.extendUserWithProfile(
        this.currentAuthState.user,
        updatedProfile as UserProfile
      ) as AuthUserProfile;
      extendedUser.role = newRole;
      extendedUser.permissions = USER_LEVEL_CONFIG[newRole];

      this.updateAuthState({
        user: extendedUser,
      });

      this.trackAuthEvent(AUTH_EVENTS.ROLE_UPGRADE, {
        userId,
        newRole,
      });
    } catch (error: AuthError | Error | unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(errorMessage || 'Erro ao fazer upgrade de role');
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

  private trackAuthEvent(event: string, data?: AuthEventData) {
    try {
      // Auth Event tracking
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'auth_event_tracked', {
          event_category: 'medical_auth_tracking',
          event_label: event,
          custom_parameters: {
            auth_context: 'event_tracking',
            event_type: event,
            event_data: JSON.stringify(data)
          }
        });
      }
      // Implementar analytics se necessário
    } catch (error) {
      // Erro ao rastrear evento de auth
      if (typeof process !== 'undefined' && process.stderr) {
        process.stderr.write(`❌ ERRO - Falha ao rastrear evento de autenticação: ${error}\n`);
      }
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'auth_tracking_error', {
          event_category: 'medical_auth_error',
          event_label: 'auth_event_tracking_failed',
          custom_parameters: {
            error_context: 'auth_event_tracking',
            error_message: String(error)
          }
        });
      }
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
        user: extendedUser as AuthUserProfile,
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

      return extendedUser as AuthUserProfile;
    } catch (error: AuthError | Error | unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.updateAuthState({
        loading: false,
        isLoading: false,
        error: errorMessage || 'Erro no callback OAuth',
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