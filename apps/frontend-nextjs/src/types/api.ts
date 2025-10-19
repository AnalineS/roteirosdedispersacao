/**
 * Backend API Types (DEPRECATED)
 * Este arquivo está sendo migrado para o sistema unificado em unified-api.ts
 * Para novos projetos, use os tipos de unified-api.ts
 */

// Re-export dos tipos unificados para manter compatibilidade
import {
  AuthUserDTO as AuthUser,
  AuthStateDTO as AuthState,
  LoginCredentialsDTO as LoginCredentials,
  RegisterDataDTO as RegisterData,
  UserProfileDTO as BackendUserProfile,
  ChatMessageDTO as ChatMessage,
  ChatSessionDTO as ChatSession,
  ConversationDTO as BackendConversation,
  FeedbackDTO as BackendFeedback,
  SessionDataDTO as SessionData,
  LearningProgressDTO as LearningProgress,
  ModuleDTO as Module,
  AchievementDTO as Achievement,
  LeaderboardEntryDTO as LeaderboardEntry,
  ProgressDataDTO as ProgressData,
  PaginationOptionsDTO as PaginationOptions,
  BatchOperationResultDTO as BatchOperationResult,
  SyncStatusDTO as SyncStatus,
  APIResponse,
  // Type guards
  isAuthUser,
  isUserProfile as isBackendUserProfile,
  isChatMessage,
  isConversation as isBackendConversation,
  // Utilities
  validateData,
  makeValidatedRequest,
  transformBackendResponse,
  transformFrontendRequest
} from './unified-api';

// Export para manter compatibilidade com código existente
export type {
  AuthUser,
  AuthState,
  LoginCredentials,
  RegisterData,
  BackendUserProfile,
  ChatMessage,
  ChatSession,
  BackendConversation,
  BackendFeedback,
  SessionData,
  LearningProgress,
  Module,
  Achievement,
  LeaderboardEntry,
  ProgressData,
  PaginationOptions,
  BatchOperationResult,
  SyncStatus,
  APIResponse,
};

// Export functions separately
export {
  // Type guards
  isAuthUser,
  isBackendUserProfile,
  isChatMessage,
  isBackendConversation,
  // Utilities
  validateData,
  makeValidatedRequest,
  transformBackendResponse,
  transformFrontendRequest
};

// ============================================
// LEGACY TYPES (Maintained for compatibility)
// ============================================

// Note: Estes tipos são mantidos para compatibilidade com código legado
// Para novos desenvolvimentos, use os tipos de unified-api.ts

export interface SocialAuthCredentials {
  providerId: 'google.com';
  preferredDisplayName?: string;
  preferredProfileType?: UserProfileType;
}

// ============================================
// TYPE ALIASES (Maintained for compatibility)
// ============================================

export type UserProfileType = 'admin' | 'professional' | 'student' | 'patient' | 'caregiver';
export type UserFocus = 'technical' | 'practical' | 'effects' | 'general' | 'empathetic';
export type LanguagePreference = 'simple' | 'technical';
export type ThemePreference = 'light' | 'dark' | 'auto';

// Interfaces específicas mantidas para compatibilidade
export interface UserPreferences {
  language: LanguagePreference;
  notifications: boolean;
  theme: ThemePreference;
  emailUpdates: boolean;
  dataCollection: boolean;
  lgpdConsent: boolean;
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
  joinedAt: string;
  lastActiveAt: string;
  sessionCount: number;
  messageCount: number;
  averageSessionDuration: number;
  favoritePersona: string;
  completionRate: number;
}

// ============================================
// CONVERSATION TYPES (LEGACY)
// ============================================

// Note: Estes tipos são mantidos apenas para compatibilidade
// Use ChatMessageDTO e ConversationDTO do unified-api.ts para novos desenvolvimentos

export interface BackendMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  persona?: string;
  timestamp: string;
  metadata?: {
    confidence?: number;
    sources?: string[];
    processingTime?: number;
    qaScore?: number;
  };
}

// ============================================
// FEEDBACK TYPES (LEGACY)
// ============================================

// Note: Use FeedbackDTO do unified-api.ts para novos desenvolvimentos

// ============================================
// ANALYTICS TYPES (LEGACY)
// ============================================

// Note: Use SessionDataDTO e LearningProgressDTO do unified-api.ts para novos desenvolvimentos

// ============================================
// LEGACY INTERFACES (Maintained for compatibility)
// ============================================

// Interface simples para User mantida para compatibilidade
export interface User {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  isAnonymous: boolean;
  provider?: string;
}

export interface UserProgress {
  userId: string;
  completedModules: string[];
  totalXP: number;
  currentLevel: number;
  achievements: string[];
  lastActivity: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  code: string;
  message: string;
  status?: number;
  timestamp?: number;
  details?: Record<string, any>;
}

// ============================================
// GAMIFICATION TYPES (LEGACY)
// ============================================

// Note: Use AchievementDTO, LeaderboardEntryDTO e ProgressDataDTO do unified-api.ts

// ============================================
// API RESPONSE TYPES (LEGACY)
// ============================================

// Note: Use APIResponse e BatchOperationResultDTO do unified-api.ts

// ============================================
// SYNC TYPES (LEGACY)
// ============================================

// Note: Use SyncStatusDTO do unified-api.ts

// ============================================
// UTILITY TYPES
// ============================================

export interface QueryFilters {
  [key: string]: any;
}

// ============================================
// MIGRATION NOTICE
// ============================================

/**
 * AVISO DE MIGRAÇÃO
 *
 * Este arquivo está sendo gradualmente migrado para o novo sistema unificado
 * em unified-api.ts. Para novos desenvolvimentos:
 *
 * 1. Use os tipos do unified-api.ts que incluem:
 *    - Validação com Zod schemas
 *    - Conversão automática snake_case ↔ camelCase
 *    - Type guards robustos
 *    - Utilitários de API
 *
 * 2. Os tipos legados neste arquivo são mantidos apenas para compatibilidade
 *
 * 3. Migre gradualmente o código existente para usar unified-api.ts
 *
 * Exemplo de migração:
 * ```typescript
 * // Antigo
 * import { ChatMessage, APIResponse } from './api';
 *
 * // Novo
 * import { ChatMessageDTO, APIResponse } from './unified-api';
 * ```
 */