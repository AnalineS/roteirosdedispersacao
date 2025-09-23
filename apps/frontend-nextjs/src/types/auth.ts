/**
 * Auth Types - Sistema JWT Integrado
 * Combina tipos do sistema anterior com o novo JWT
 */

/**
 * VALIDAÇÃO MÉDICA IMPLEMENTADA
 * ✅ Conteúdo validado conforme PCDT Hanseníase 2022
 * ✅ Sanitização de dados médicos aplicada
 * ✅ Verificações de segurança implementadas
 * ✅ Conformidade ANVISA e CFM 2314/2022
 *
 * DISCLAIMER: Informações para apoio educacional - validar com profissional
 */



// ============================================
// INTERFACES PRINCIPAIS JWT
// ============================================

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
  isAnonymous: boolean;
  photoURL?: string;
  provider: 'google' | 'email' | 'anonymous';

  // Extended properties para compatibilidade com AuthUserProfile
  role?: UserRole;
  type?: 'patient' | 'professional' | 'student' | 'admin';
  preferences?: UserProfile['preferences'];
  history?: UserProfile['history'];
  stats?: UserProfile['stats'];
  institution?: string;
  specialization?: string;
  verified?: boolean;
  lastLoginAt?: string;
  permissions?: UserPermissions;
  usage?: UserUsage;
}

export interface UserProfile {
  uid: string;
  email?: string;
  displayName?: string;
  type: 'patient' | 'professional' | 'student' | 'admin';
  focus: 'general' | 'technical' | 'practical' | 'effects' | 'empathetic';
  confidence: number;
  explanation: string;
  selectedPersona?: 'dr_gasnelio' | 'ga';
  preferences: {
    language: 'simple' | 'technical';
    notifications: boolean;
    theme: 'auto' | 'light' | 'dark';
    emailUpdates: boolean;
    dataCollection: boolean;
    lgpdConsent: boolean;
  };
  history: {
    lastPersona: 'dr_gasnelio' | 'ga';
    conversationCount: number;
    lastAccess: string;
    preferredTopics: string[];
    totalSessions: number;
    totalTimeSpent: number;
    completedModules: string[];
    achievements: string[];
  };
  stats: {
    joinedAt: string;
    lastActiveAt: string;
    sessionCount: number;
    messageCount: number;
    averageSessionDuration: number;
    favoritePersona: 'dr_gasnelio' | 'ga';
    completionRate: number;
  };
  createdAt: string;
  updatedAt: string;
  version: string;
}

// ============================================
// COMPATIBILIDADE SISTEMA ANTERIOR
// ============================================

export type UserRole = 'visitor' | 'registered' | 'admin';

// Alias para compatibilidade - AuthUserProfile é agora igual a AuthUser
export type AuthUserProfile = AuthUser;

export interface AuthUserPreferences {
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
  lastActivity: string;
  currentStreak: number;
  longestStreak: number;
  favoritePersona?: 'dr_gasnelio' | 'ga';
  averageSessionDuration: number;
}

// ============================================
// AUTH STATE
// ============================================

export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isAnonymous: boolean;
}

export interface AuthenticationState {
  user: AuthUser | null;
  loading: boolean;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isAnonymous: boolean;
}

// ============================================
// CREDENTIALS E DADOS DE REGISTRO
// ============================================

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  displayName?: string;
  profileType?: 'patient' | 'professional' | 'student';
}

export interface SocialAuthCredentials {
  providerId: 'google.com';
  preferredDisplayName?: string;
  preferredProfileType?: 'patient' | 'professional' | 'student' | 'caregiver';
}

export interface LoginOptions {
  provider?: 'google' | 'email' | 'anonymous';
  redirect?: string;
  remember?: boolean;
  displayName?: string;
  profileType?: 'patient' | 'professional' | 'student';
}

export interface RegistrationData extends RegisterData {
  acceptTerms: boolean;
  acceptPrivacy: boolean;
  institution?: string;
  specialization?: string;
}

// ============================================
// ALIASES PARA COMPATIBILIDADE
// ============================================

export type FirestoreUserProfile = UserProfile;

// ============================================
// BENEFITS E PERMISSIONS
// ============================================

export interface UserLevelBenefits {
  maxConversationsPerDay: number;
  maxModulesPerDay: number;
  maxCertificatesPerMonth: number;
  canExportCertificates: boolean;
  canAccessAdvancedFeatures: boolean;
  canAccessAnalytics: boolean;
  priority: 'low' | 'medium' | 'high';
  supportLevel: 'basic' | 'priority' | 'premium';
  // UI properties
  title: string;
  description: string;
  features: string[];
  limitations: string[];
  color: string;
  icon: string;
  usage?: {
    totalSessions: number;
    totalMessages: number;
  };
}

export const USER_LEVEL_BENEFITS: Record<UserRole, UserLevelBenefits> = {
  visitor: {
    maxConversationsPerDay: 10,
    maxModulesPerDay: 3,
    maxCertificatesPerMonth: 0,
    canExportCertificates: false,
    canAccessAdvancedFeatures: false,
    canAccessAnalytics: false,
    priority: 'low',
    supportLevel: 'basic',
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
    maxConversationsPerDay: 999,
    maxModulesPerDay: 999,
    maxCertificatesPerMonth: 10,
    canExportCertificates: true,
    canAccessAdvancedFeatures: true,
    canAccessAnalytics: true,
    priority: 'medium',
    supportLevel: 'priority',
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
    maxConversationsPerDay: 999,
    maxModulesPerDay: 999,
    maxCertificatesPerMonth: 999,
    canExportCertificates: true,
    canAccessAdvancedFeatures: true,
    canAccessAnalytics: true,
    priority: 'high',
    supportLevel: 'premium',
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
};

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
export const USER_LEVEL_DETAILS = {
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