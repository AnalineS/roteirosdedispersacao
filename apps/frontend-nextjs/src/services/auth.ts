/**
 * Serviço de Autenticação 3 Níveis
 * Implementa login opcional com benefícios progressivos
 */

import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  User,
  AuthError,
  updateProfile,
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  increment,
} from 'firebase/firestore';
import { auth, db, FEATURES } from '@/lib/firebase/config';
import {
  AuthUserProfile,
  UserRole,
  AuthenticationState,
  LoginOptions,
  RegistrationData,
  USER_LEVEL_CONFIG,
  AUTH_EVENTS,
} from '@/types/auth';
import Analytics from './analytics';

// Provider do Google
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('email');
googleProvider.addScope('profile');

export class AuthService {
  private static instance: AuthService;
  private authStateCallbacks: ((authState: AuthenticationState) => void)[] = [];

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
    if (!auth) return;

    onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const userProfile = await this.loadAuthUserProfile(firebaseUser);
          this.notifyAuthStateChange({
            user: userProfile,
            isLoading: false,
            isAuthenticated: true,
            error: null,
          });
        } else {
          this.notifyAuthStateChange({
            user: null,
            isLoading: false,
            isAuthenticated: false,
            error: null,
          });
        }
      } catch (error) {
        console.error('[Auth] Error in auth state change:', error);
        
        // Capturar erro no sistema centralizado
        if (typeof window !== 'undefined') {
          const event = new CustomEvent('show-error-toast', {
            detail: {
              errorId: `auth_state_${Date.now()}`,
              severity: 'high',
              message: 'Erro na autenticação. Tente fazer login novamente.'
            }
          });
          window.dispatchEvent(event);
        }
        
        this.notifyAuthStateChange({
          user: null,
          isLoading: false,
          isAuthenticated: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });
  }

  onAuthStateChange(callback: (authState: AuthenticationState) => void) {
    this.authStateCallbacks.push(callback);
    return () => {
      this.authStateCallbacks = this.authStateCallbacks.filter(cb => cb !== callback);
    };
  }

  private notifyAuthStateChange(authState: AuthenticationState) {
    this.authStateCallbacks.forEach(callback => callback(authState));
  }

  // ============================================================================
  // USER PROFILE MANAGEMENT
  // ============================================================================

  private async loadAuthUserProfile(firebaseUser: User): Promise<AuthUserProfile> {
    if (!db) {
      throw new Error('Firestore não disponível');
    }

    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const data = userDoc.data();
      
      // Atualizar última atividade
      await updateDoc(userDocRef, {
        lastLoginAt: serverTimestamp(),
        'usage.totalSessions': increment(1),
      });

      return this.mapFirestoreToAuthUserProfile(firebaseUser.uid, data);
    } else {
      // Criar perfil inicial para novo usuário
      return await this.createAuthUserProfile(firebaseUser);
    }
  }

  private async createAuthUserProfile(firebaseUser: User): Promise<AuthUserProfile> {
    if (!db) {
      throw new Error('Firestore não disponível');
    }

    // Determinar role inicial
    const role: UserRole = this.determineInitialRole(firebaseUser.email);

    const userProfile: AuthUserProfile = {
      uid: firebaseUser.uid,
      role,
      email: firebaseUser.email || undefined,
      displayName: firebaseUser.displayName || undefined,
      photoURL: firebaseUser.photoURL || undefined,
      verified: firebaseUser.emailVerified,
      createdAt: new Date(),
      lastLoginAt: new Date(),
      preferences: this.getDefaultPreferences(),
      permissions: USER_LEVEL_CONFIG[role],
      usage: this.getDefaultUsage(),
    };

    // Salvar no Firestore
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    await setDoc(userDocRef, {
      ...userProfile,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    });

    // Track analytics
    Analytics.event('USER', 'signup', 'google');
    Analytics.user({
      userType: role as 'visitor' | 'registered' | 'admin',
      institution: userProfile.institution,
    });

    return userProfile;
  }

  private determineInitialRole(email?: string | null): UserRole {
    if (!email) return 'registered';

    // Emails de admin predefinidos
    const adminEmails = [
      'neeliogomes@hotmail.com',
      'sousa.analine@gmail.com',
      'roteirosdedispensacaounb@gmail.com',
      'neliogmoura@gmail.com',
      // Adicionar mais emails de admin conforme necessário
    ];

    if (adminEmails.includes(email.toLowerCase())) {
      return 'admin';
    }

    return 'registered';
  }

  private getDefaultPreferences() {
    return {
      preferredPersona: null,
      language: 'pt-BR' as const,
      theme: 'auto' as const,
      notifications: {
        email: true,
        push: false,
        updates: true,
        certificates: true,
      },
      privacy: {
        analytics: true,
        shareProgress: false,
        publicProfile: false,
      },
    };
  }

  private getDefaultUsage() {
    return {
      totalSessions: 0,
      totalMessages: 0,
      totalModulesCompleted: 0,
      totalCertificatesEarned: 0,
      lastActivity: new Date(),
      currentStreak: 0,
      longestStreak: 0,
      averageSessionDuration: 0,
    };
  }

  private mapFirestoreToAuthUserProfile(uid: string, data: any): AuthUserProfile {
    return {
      uid,
      role: data.role || 'registered',
      email: data.email,
      displayName: data.displayName,
      photoURL: data.photoURL,
      institution: data.institution,
      specialization: data.specialization,
      verified: data.verified || false,
      createdAt: data.createdAt?.toDate() || new Date(),
      lastLoginAt: data.lastLoginAt?.toDate() || new Date(),
      preferences: { ...this.getDefaultPreferences(), ...data.preferences },
      permissions: { ...USER_LEVEL_CONFIG[data.role as UserRole || 'registered'], ...data.permissions },
      usage: { ...this.getDefaultUsage(), ...data.usage },
    };
  }

  // ============================================================================
  // AUTHENTICATION METHODS
  // ============================================================================

  async loginWithGoogle(options: LoginOptions = { provider: 'google' }): Promise<AuthUserProfile> {
    if (!auth) {
      throw new Error('Firebase Auth não disponível');
    }

    try {
      Analytics.event('USER', 'login', 'google');
      
      const result = await signInWithPopup(auth, googleProvider);
      const userProfile = await this.loadAuthUserProfile(result.user);

      return userProfile;
    } catch (error) {
      const authError = error as AuthError;
      
      Analytics.exception(`Login Google falhou: ${authError.code}`, false);
      
      throw new Error(this.getAuthErrorMessage(authError.code));
    }
  }

  async loginWithEmail(email: string, password: string): Promise<AuthUserProfile> {
    if (!auth) {
      throw new Error('Firebase Auth não disponível');
    }

    try {
      Analytics.event('USER', 'login', 'email');
      
      const result = await signInWithEmailAndPassword(auth, email, password);
      const userProfile = await this.loadAuthUserProfile(result.user);

      return userProfile;
    } catch (error) {
      const authError = error as AuthError;
      
      Analytics.exception(`Login email falhou: ${authError.code}`, false);
      
      throw new Error(this.getAuthErrorMessage(authError.code));
    }
  }

  async registerWithEmail(data: RegistrationData): Promise<AuthUserProfile> {
    if (!auth || !data.password) {
      throw new Error('Firebase Auth não disponível ou senha ausente');
    }

    try {
      // Criar conta
      const result = await createUserWithEmailAndPassword(auth, data.email, data.password);
      
      // Atualizar perfil Firebase
      await updateProfile(result.user, {
        displayName: data.displayName,
      });

      // Criar perfil personalizado
      const userProfile = await this.createAuthUserProfile(result.user);
      
      // Atualizar com dados adicionais
      if (data.institution || data.specialization) {
        await this.updateAuthUserProfile(userProfile.uid, {
          institution: data.institution,
          specialization: data.specialization,
        });
      }

      Analytics.event('USER', 'signup', 'email');
      
      return userProfile;
    } catch (error) {
      const authError = error as AuthError;
      
      Analytics.exception(`Registro falhou: ${authError.code}`, false);
      
      throw new Error(this.getAuthErrorMessage(authError.code));
    }
  }

  async logout(): Promise<void> {
    if (!auth) {
      throw new Error('Firebase Auth não disponível');
    }

    try {
      Analytics.event('USER', 'logout');
      await signOut(auth);
    } catch (error) {
      console.error('[Auth] Logout error:', error);
      throw new Error('Erro ao fazer logout');
    }
  }

  // ============================================================================
  // USER MANAGEMENT
  // ============================================================================

  async updateAuthUserProfile(uid: string, updates: Partial<AuthUserProfile>): Promise<void> {
    if (!db) {
      throw new Error('Firestore não disponível');
    }

    const userDocRef = doc(db, 'users', uid);
    await updateDoc(userDocRef, {
      ...updates,
      lastUpdated: serverTimestamp(),
    });

    Analytics.event('USER', 'profile_update');
  }

  async upgradeUserRole(uid: string, newRole: UserRole): Promise<void> {
    if (!db) {
      throw new Error('Firestore não disponível');
    }

    const userDocRef = doc(db, 'users', uid);
    await updateDoc(userDocRef, {
      role: newRole,
      permissions: USER_LEVEL_CONFIG[newRole],
      lastUpdated: serverTimestamp(),
    });

    Analytics.event('USER', 'role_upgrade', newRole);
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  getCurrentUser(): User | null {
    return auth?.currentUser || null;
  }

  isAuthenticated(): boolean {
    return !!auth?.currentUser;
  }

  hasPermission(user: AuthUserProfile | null, permission: keyof AuthUserProfile['permissions']): boolean {
    if (!user) return false;
    return user.permissions[permission] as boolean;
  }

  canAccessFeature(user: AuthUserProfile | null, feature: string): boolean {
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
      default:
        return 'Erro de autenticação';
    }
  }
}

// Instância singleton
export const authService = AuthService.getInstance();
export default authService;