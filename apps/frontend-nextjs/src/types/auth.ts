/**
 * Types para sistema de autenticação 3 níveis
 */

export type UserRole = 'visitor' | 'registered' | 'admin';

export interface UserProfile {
  uid: string;
  role: UserRole;
  email?: string;
  displayName?: string;
  photoURL?: string;
  institution?: string;
  specialization?: string;
  verified: boolean;
  createdAt: Date;
  lastLoginAt: Date;
  preferences: UserPreferences;
  permissions: UserPermissions;
  usage: UserUsage;
}

export interface UserPreferences {
  preferredPersona: 'dr_gasnelio' | 'ga' | null;
  language: 'pt-BR' | 'en' | 'es';
  theme: 'light' | 'dark' | 'auto';
  notifications: {
    email: boolean;
    push: boolean;
    updates: boolean;
    certificates: boolean;
  };
  privacy: {
    analytics: boolean;
    shareProgress: boolean;
    publicProfile: boolean;
  };
}

export interface UserPermissions {
  // Níveis de acesso
  canAccessChat: boolean;
  canAccessModules: boolean;
  canAccessDashboard: boolean;
  canAccessAdmin: boolean;
  
  // Funcionalidades específicas
  canExportCertificates: boolean;
  canSaveConversations: boolean;
  canAccessAdvancedModules: boolean;
  canCreateContent: boolean;
  canManageUsers: boolean;
  canViewAnalytics: boolean;
  canModifySettings: boolean;
  
  // Limites
  maxConversationsPerDay: number;
  maxModulesPerDay: number;
  maxCertificatesPerMonth: number;
}

export interface UserUsage {
  totalSessions: number;
  totalMessages: number;
  totalModulesCompleted: number;
  totalCertificatesEarned: number;
  lastActivity: Date;
  currentStreak: number;
  longestStreak: number;
  favoritePersona?: 'dr_gasnelio' | 'ga';
  averageSessionDuration: number;
}

export interface AuthState {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

export interface LoginOptions {
  provider: 'google' | 'email' | 'anonymous';
  redirect?: string;
  remember?: boolean;
}

export interface RegistrationData {
  email: string;
  password?: string;
  displayName: string;
  institution?: string;
  specialization?: string;
  acceptTerms: boolean;
  acceptPrivacy: boolean;
}

// Configurações específicas por nível
export const USER_LEVEL_CONFIG: Record<UserRole, UserPermissions> = {
  visitor: {
    canAccessChat: true,
    canAccessModules: true,
    canAccessDashboard: false,
    canAccessAdmin: false,
    canExportCertificates: false,
    canSaveConversations: false,
    canAccessAdvancedModules: false,
    canCreateContent: false,
    canManageUsers: false,
    canViewAnalytics: false,
    canModifySettings: false,
    maxConversationsPerDay: 10,
    maxModulesPerDay: 3,
    maxCertificatesPerMonth: 0,
  },
  registered: {
    canAccessChat: true,
    canAccessModules: true,
    canAccessDashboard: true,
    canAccessAdmin: false,
    canExportCertificates: true,
    canSaveConversations: true,
    canAccessAdvancedModules: true,
    canCreateContent: false,
    canManageUsers: false,
    canViewAnalytics: false,
    canModifySettings: false,
    maxConversationsPerDay: 50,
    maxModulesPerDay: 10,
    maxCertificatesPerMonth: 5,
  },
  admin: {
    canAccessChat: true,
    canAccessModules: true,
    canAccessDashboard: true,
    canAccessAdmin: true,
    canExportCertificates: true,
    canSaveConversations: true,
    canAccessAdvancedModules: true,
    canCreateContent: true,
    canManageUsers: true,
    canViewAnalytics: true,
    canModifySettings: true,
    maxConversationsPerDay: 999,
    maxModulesPerDay: 999,
    maxCertificatesPerMonth: 999,
  },
};

// Benefícios específicos por nível
export const USER_LEVEL_BENEFITS = {
  visitor: {
    title: 'Visitante',
    description: 'Acesso básico às funcionalidades principais',
    features: [
      'Chat com Dr. Gasnelio e Gá',
      'Módulos educacionais básicos',
      'FAQ e glossário',
      'Calculadora de dose',
      'Até 10 conversas por dia',
    ],
    limitations: [
      'Não salva histórico de conversas',
      'Sem certificados',
      'Sem dashboard pessoal',
      'Sem módulos avançados',
    ],
    color: 'gray',
    icon: '👁️',
  },
  registered: {
    title: 'Usuário Cadastrado',
    description: 'Experiência completa com histórico e certificados',
    features: [
      'Todas as funcionalidades de visitante',
      'Histórico de conversas salvo',
      'Certificados de conclusão',
      'Dashboard pessoal de progresso',
      'Módulos educacionais avançados',
      'Personalização de preferências',
      'Até 50 conversas por dia',
      'Até 5 certificados por mês',
    ],
    limitations: [
      'Sem acesso a configurações administrativas',
      'Sem criação de conteúdo',
    ],
    color: 'blue',
    icon: '👤',
  },
  admin: {
    title: 'Administrador',
    description: 'Controle total do sistema educacional',
    features: [
      'Todas as funcionalidades de usuário cadastrado',
      'Dashboard administrativo completo',
      'Analytics e métricas de uso',
      'Gerenciamento de usuários',
      'Criação e edição de módulos',
      'Configurações do sistema',
      'Templates de certificados',
      'Conversas e certificados ilimitados',
    ],
    limitations: [],
    color: 'red',
    icon: '👑',
  },
} as const;

// Eventos de autenticação para analytics
export const AUTH_EVENTS = {
  LOGIN_ATTEMPT: 'login_attempt',
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILURE: 'login_failure',
  LOGOUT: 'logout',
  REGISTRATION_START: 'registration_start',
  REGISTRATION_COMPLETE: 'registration_complete',
  ROLE_UPGRADE: 'role_upgrade',
  PROFILE_UPDATE: 'profile_update',
  PERMISSION_DENIED: 'permission_denied',
} as const;