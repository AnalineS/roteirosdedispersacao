/**
 * Firebase Types
 * Tipos TypeScript para todas as estruturas de dados Firebase
 */

import { User } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';

// ============================================
// AUTHENTICATION TYPES
// ============================================

export interface AuthUser extends User {
  // Campos customizados se necessário
}

export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  isAnonymous: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  displayName?: string;
  profileType?: UserProfileType;
}

export interface SocialAuthCredentials {
  providerId: 'google.com' | 'facebook.com' | 'apple.com';
  preferredDisplayName?: string;
  preferredProfileType?: UserProfileType;
}

// ============================================
// USER PROFILE TYPES
// ============================================

export type UserProfileType = 'professional' | 'student' | 'patient' | 'caregiver';
export type UserFocus = 'technical' | 'practical' | 'effects' | 'general';
export type LanguagePreference = 'simple' | 'technical';
export type ThemePreference = 'light' | 'dark' | 'auto';

export interface UserPreferences {
  language: LanguagePreference;
  notifications: boolean;
  theme: ThemePreference;
  emailUpdates?: boolean;
  dataCollection?: boolean;
  lgpdConsent?: boolean;
}

export interface UserHistory {
  lastPersona: string;
  conversationCount: number;
  lastAccess: string;
  preferredTopics: string[];
  totalSessions: number;
  totalTimeSpent: number; // em minutos
  completedModules: string[];
  achievements: string[];
}

export interface UserStats {
  joinedAt: Timestamp;
  lastActiveAt: Timestamp;
  sessionCount: number;
  messageCount: number;
  averageSessionDuration: number;
  favoritePersona: string;
  completionRate: number;
}

export interface FirestoreUserProfile {
  // Identificação
  uid: string;
  email?: string;
  displayName?: string;
  
  // Perfil básico (compatível com localStorage)
  type: UserProfileType;
  focus: UserFocus;
  confidence: number;
  explanation: string;
  selectedPersona?: string;
  
  // Configurações
  preferences: UserPreferences;
  history: UserHistory;
  stats: UserStats;
  
  // Metadados Firebase
  createdAt: Timestamp;
  updatedAt: Timestamp;
  version: string;
  isAnonymous: boolean;
  
  // Campos específicos da plataforma
  institutionId?: string;
  role?: string;
  permissions?: string[];
}

// ============================================
// CONVERSATION TYPES
// ============================================

export interface FirestoreMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  persona?: string;
  timestamp: Timestamp;
  metadata?: {
    confidence?: number;
    sources?: string[];
    processingTime?: number;
    qaScore?: number;
  };
}

export interface FirestoreConversation {
  id: string;
  userId: string;
  personaId: string;
  title: string;
  messages: FirestoreMessage[];
  lastActivity: Timestamp;
  createdAt: Timestamp;
  
  // Metadados
  messageCount: number;
  isArchived: boolean;
  tags?: string[];
  rating?: number;
  feedback?: string;
  
  // Sincronização
  localStorageId?: string; // Para migração
  syncStatus: 'synced' | 'pending' | 'conflict' | 'failed';
}

// ============================================
// FEEDBACK TYPES
// ============================================

export interface FirestoreFeedback {
  id: string;
  userId?: string;
  sessionId: string;
  
  // Conteúdo do feedback
  type: 'rating' | 'bug' | 'suggestion' | 'general';
  rating?: number;
  message: string;
  context?: {
    page: string;
    persona?: string;
    conversationId?: string;
    userAgent: string;
  };
  
  // Metadados
  createdAt: Timestamp;
  status: 'pending' | 'reviewed' | 'resolved';
  category?: string;
  priority?: 'low' | 'medium' | 'high';
  
  // Analytics
  helpful?: boolean;
  responseTime?: number;
}

// ============================================
// ANALYTICS TYPES
// ============================================

export interface SessionData {
  id: string;
  userId?: string;
  startTime: Timestamp;
  endTime?: Timestamp;
  duration?: number;
  
  // Atividade
  pageViews: string[];
  interactions: Array<{
    type: string;
    target: string;
    timestamp: Timestamp;
  }>;
  
  // Contexto
  userAgent: string;
  referrer?: string;
  utmParams?: Record<string, string>;
  
  // Performance
  loadTime?: number;
  errorCount: number;
  completedActions: string[];
}

export interface LearningProgress {
  userId: string;
  moduleId: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progressPercentage: number;
  timeSpent: number;
  lastAccessed: Timestamp;
  completedAt?: Timestamp;
  score?: number;
  attempts: number;
}

// ============================================
// SYNC TYPES
// ============================================

export interface SyncStatus {
  lastSync: Timestamp;
  pendingUploads: number;
  pendingDownloads: number;
  conflicts: number;
  isOnline: boolean;
  syncInProgress: boolean;
}

export interface DataMigration {
  id: string;
  userId: string;
  sourceType: 'localStorage' | 'sessionStorage';
  targetType: 'firestore';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  itemsTotal: number;
  itemsProcessed: number;
  startedAt: Timestamp;
  completedAt?: Timestamp;
  errors?: string[];
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface FirebaseApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Timestamp;
  requestId?: string;
}

export interface BatchOperationResult {
  successful: number;
  failed: number;
  errors: Array<{
    itemId: string;
    error: string;
  }>;
}

// ============================================
// UTILITY TYPES
// ============================================

export type FirestoreTimestamp = Timestamp;

export interface TimestampPair {
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface PaginationOptions {
  limit: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface QueryFilters {
  [key: string]: any;
}

// Type guards
export function isAuthUser(user: any): user is AuthUser {
  return user && typeof user.uid === 'string';
}

export function isFirestoreUserProfile(profile: any): profile is FirestoreUserProfile {
  return profile && 
         typeof profile.uid === 'string' && 
         typeof profile.type === 'string' &&
         profile.createdAt instanceof Timestamp;
}

export function isFirestoreConversation(conv: any): conv is FirestoreConversation {
  return conv &&
         typeof conv.id === 'string' &&
         typeof conv.userId === 'string' &&
         Array.isArray(conv.messages) &&
         conv.createdAt instanceof Timestamp;
}