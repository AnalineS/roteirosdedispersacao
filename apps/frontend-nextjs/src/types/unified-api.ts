/**
 * Unified API Types System
 * Sistema unificado de tipos para todas as APIs do projeto
 * Resolve inconsistências snake_case ↔ camelCase e padroniza DTOs
 */

import { z } from 'zod';

// ============================================
// UTILITY TYPES AND CONVERTERS
// ============================================

/**
 * Converte string de snake_case para camelCase
 */
export function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Converte string de camelCase para snake_case
 */
export function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * Converte objeto de snake_case para camelCase recursivamente
 */
export function convertToCamelCase<T extends Record<string, any>>(obj: T): CamelCaseKeys<T> {
  if (Array.isArray(obj)) {
    return obj.map(convertToCamelCase) as any;
  }

  if (obj && typeof obj === 'object' && obj.constructor === Object) {
    const converted: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const camelKey = toCamelCase(key);
      converted[camelKey] = convertToCamelCase(value);
    }
    return converted;
  }

  return obj as any;
}

/**
 * Converte objeto de camelCase para snake_case recursivamente
 */
export function convertToSnakeCase<T extends Record<string, any>>(obj: T): SnakeCaseKeys<T> {
  if (Array.isArray(obj)) {
    return obj.map(convertToSnakeCase) as any;
  }

  if (obj && typeof obj === 'object' && obj.constructor === Object) {
    const converted: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const snakeKey = toSnakeCase(key);
      converted[snakeKey] = convertToSnakeCase(value);
    }
    return converted;
  }

  return obj as any;
}

/**
 * Utility types para conversão de keys
 */
type CamelCaseKeys<T> = {
  [K in keyof T as K extends string ? CamelCase<K> : K]: T[K] extends Record<string, any>
    ? CamelCaseKeys<T[K]>
    : T[K];
};

type SnakeCaseKeys<T> = {
  [K in keyof T as K extends string ? SnakeCase<K> : K]: T[K] extends Record<string, any>
    ? SnakeCaseKeys<T[K]>
    : T[K];
};

type CamelCase<S extends string> = S extends `${infer P1}_${infer P2}${infer P3}`
  ? `${P1}${Uppercase<P2>}${CamelCase<P3>}`
  : S;

type SnakeCase<S extends string> = S extends `${infer P1}${infer P2}`
  ? P2 extends Uncapitalize<P2>
    ? `${P1}${SnakeCase<P2>}`
    : `${P1}_${Uncapitalize<P2>}`
  : S;

// ============================================
// UNIFIED API RESPONSE WRAPPER
// ============================================

/**
 * Wrapper padrão para todas as respostas da API
 */
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  status?: number;
  timestamp: string;
  requestId?: string;
  metadata?: {
    requestDuration?: number;
    cacheHit?: boolean;
    warnings?: string[];
  };
}

/**
 * Schema Zod para validação de resposta da API
 */
export const APIResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
    message: z.string().optional(),
    timestamp: z.string(),
    requestId: z.string().optional(),
    metadata: z.object({
      requestDuration: z.number().optional(),
      cacheHit: z.boolean().optional(),
      warnings: z.array(z.string()).optional(),
    }).optional(),
  });

/**
 * Helper para criar resposta de sucesso tipada
 */
export function createSuccessResponse<T>(data: T, message?: string): APIResponse<T> {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Helper para criar resposta de erro tipada
 */
export function createErrorResponse(error: string, requestId?: string): APIResponse<never> {
  return {
    success: false,
    error,
    timestamp: new Date().toISOString(),
    requestId,
  };
}

// ============================================
// AUTHENTICATION DTÓS
// ============================================

/**
 * Schema para validação de credenciais de login
 */
export const LoginCredentialsSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

export type LoginCredentialsDTO = z.infer<typeof LoginCredentialsSchema>;

/**
 * Schema para dados de registro
 */
export const RegisterDataSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  displayName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').optional(),
  profileType: z.enum(['admin', 'professional', 'student', 'patient', 'caregiver']).optional(),
});

export type RegisterDataDTO = z.infer<typeof RegisterDataSchema>;

/**
 * Schema para usuário autenticado
 */
export const AuthUserSchema = z.object({
  uid: z.string(),
  email: z.string().email().optional(),
  displayName: z.string().optional(),
  photoURL: z.string().url().optional(),
  isAnonymous: z.boolean(),
  provider: z.string().optional(),
  providerData: z.array(z.object({
    providerId: z.string(),
    uid: z.string(),
    displayName: z.string().optional(),
    email: z.string().email().optional(),
    photoURL: z.string().url().optional(),
  })).optional(),
});

export type AuthUserDTO = z.infer<typeof AuthUserSchema>;

/**
 * Schema para estado de autenticação
 */
export const AuthStateSchema = z.object({
  user: AuthUserSchema.nullable(),
  loading: z.boolean(),
  error: z.string().nullable(),
  isAuthenticated: z.boolean(),
  isAnonymous: z.boolean(),
});

export type AuthStateDTO = z.infer<typeof AuthStateSchema>;

// ============================================
// USER PROFILE DTÓS
// ============================================

/**
 * Schema para preferências do usuário
 */
export const UserPreferencesSchema = z.object({
  language: z.enum(['simple', 'technical']),
  notifications: z.boolean(),
  theme: z.enum(['light', 'dark', 'auto']),
  emailUpdates: z.boolean(),
  dataCollection: z.boolean(),
  lgpdConsent: z.boolean(),
});

export type UserPreferencesDTO = z.infer<typeof UserPreferencesSchema>;

/**
 * Schema para histórico do usuário
 */
export const UserHistorySchema = z.object({
  lastPersona: z.string(),
  conversationCount: z.number().int().min(0),
  lastAccess: z.string(),
  preferredTopics: z.array(z.string()),
  totalSessions: z.number().int().min(0),
  totalTimeSpent: z.number().min(0),
  completedModules: z.array(z.string()),
  achievements: z.array(z.string()),
});

export type UserHistoryDTO = z.infer<typeof UserHistorySchema>;

/**
 * Schema para estatísticas do usuário
 */
export const UserStatsSchema = z.object({
  joinedAt: z.string(),
  lastActiveAt: z.string(),
  sessionCount: z.number().int().min(0),
  messageCount: z.number().int().min(0),
  averageSessionDuration: z.number().min(0),
  favoritePersona: z.string(),
  completionRate: z.number().min(0).max(100),
});

export type UserStatsDTO = z.infer<typeof UserStatsSchema>;

/**
 * Schema para perfil completo do usuário
 */
export const UserProfileSchema = z.object({
  uid: z.string(),
  email: z.string().email().optional(),
  displayName: z.string().optional(),
  type: z.enum(['admin', 'professional', 'student', 'patient', 'caregiver']),
  focus: z.enum(['technical', 'practical', 'effects', 'general', 'empathetic']),
  confidence: z.number().min(0).max(100),
  explanation: z.string(),
  selectedPersona: z.string().optional(),
  isAdmin: z.boolean().optional(),
  adminLevel: z.enum(['super', 'moderator', 'viewer']).optional(),
  preferences: UserPreferencesSchema,
  history: UserHistorySchema,
  stats: UserStatsSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
  version: z.string(),
  isAnonymous: z.boolean(),
  institutionId: z.string().optional(),
  institution: z.string().optional(),
  role: z.string().optional(),
  permissions: z.array(z.string()).optional(),
});

export type UserProfileDTO = z.infer<typeof UserProfileSchema>;

// ============================================
// CHAT AND MESSAGING DTÓS
// ============================================

/**
 * Schema para metadados de mensagem
 */
export const MessageMetadataSchema = z.object({
  isFallback: z.boolean().optional(),
  fallbackSource: z.enum(['cache', 'local_knowledge', 'emergency', 'generic']).optional(),
  confidence: z.number().min(0).max(100).optional(),
  suggestion: z.string().optional(),
  emergencyContact: z.string().optional(),
  sources: z.array(z.string()).optional(),
  processingTime: z.number().min(0).optional(),
  qaScore: z.number().min(0).max(100).optional(),
}).and(z.record(z.string(), z.any())); // Allow additional properties

export type MessageMetadataDTO = z.infer<typeof MessageMetadataSchema>;

/**
 * Schema para mensagem de chat
 */
export const ChatMessageSchema = z.object({
  id: z.string(),
  content: z.string(),
  role: z.enum(['user', 'assistant']),
  timestamp: z.string(),
  persona: z.string().optional(),
  metadata: MessageMetadataSchema.optional(),
});

export type ChatMessageDTO = z.infer<typeof ChatMessageSchema>;

/**
 * Schema para sessão de chat
 */
export const ChatSessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  messages: z.array(ChatMessageSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
  title: z.string().optional(),
});

export type ChatSessionDTO = z.infer<typeof ChatSessionSchema>;

/**
 * Schema para conversa do backend
 */
export const ConversationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  personaId: z.string(),
  title: z.string(),
  messages: z.array(ChatMessageSchema),
  lastActivity: z.string(),
  createdAt: z.string(),
  messageCount: z.number().int().min(0),
  isArchived: z.boolean(),
  tags: z.array(z.string()).optional(),
  summary: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
  feedback: z.string().optional(),
  localStorageId: z.string().optional(),
  syncStatus: z.enum(['synced', 'pending', 'conflict', 'failed']),
});

export type ConversationDTO = z.infer<typeof ConversationSchema>;

// ============================================
// FEEDBACK AND ANALYTICS DTÓS
// ============================================

/**
 * Schema para contexto de feedback
 */
export const FeedbackContextSchema = z.object({
  page: z.string(),
  persona: z.string().optional(),
  conversationId: z.string().optional(),
  userAgent: z.string(),
});

export type FeedbackContextDTO = z.infer<typeof FeedbackContextSchema>;

/**
 * Schema para feedback
 */
export const FeedbackSchema = z.object({
  id: z.string(),
  userId: z.string().optional(),
  sessionId: z.string(),
  type: z.enum(['rating', 'bug', 'suggestion', 'general']),
  rating: z.number().min(1).max(5).optional(),
  message: z.string(),
  context: FeedbackContextSchema.optional(),
  createdAt: z.string(),
  status: z.enum(['pending', 'reviewed', 'resolved']),
  category: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  helpful: z.boolean().optional(),
  responseTime: z.number().min(0).optional(),
});

export type FeedbackDTO = z.infer<typeof FeedbackSchema>;

/**
 * Schema para interação de sessão
 */
export const SessionInteractionSchema = z.object({
  type: z.string(),
  target: z.string(),
  timestamp: z.string(),
});

export type SessionInteractionDTO = z.infer<typeof SessionInteractionSchema>;

/**
 * Schema para dados de sessão
 */
export const SessionDataSchema = z.object({
  id: z.string(),
  userId: z.string().optional(),
  startTime: z.string(),
  endTime: z.string().optional(),
  duration: z.number().min(0).optional(),
  pageViews: z.array(z.string()),
  interactions: z.array(SessionInteractionSchema),
  userAgent: z.string(),
  referrer: z.string().optional(),
  utmParams: z.record(z.string(), z.string()).optional(),
  loadTime: z.number().min(0).optional(),
  errorCount: z.number().int().min(0),
  completedActions: z.array(z.string()),
});

export type SessionDataDTO = z.infer<typeof SessionDataSchema>;

// ============================================
// EDUCATIONAL CONTENT DTÓS
// ============================================

/**
 * Schema para módulo educacional
 */
export const ModuleSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  content: z.string(),
  order: z.number().int().min(0),
  isCompleted: z.boolean().optional(),
});

export type ModuleDTO = z.infer<typeof ModuleSchema>;

/**
 * Schema para progresso de aprendizado
 */
export const LearningProgressSchema = z.object({
  userId: z.string(),
  moduleId: z.string(),
  status: z.enum(['not_started', 'in_progress', 'completed']),
  progressPercentage: z.number().min(0).max(100),
  timeSpent: z.number().min(0),
  lastAccessed: z.string(),
  completedAt: z.string().optional(),
  score: z.number().min(0).max(100).optional(),
  attempts: z.number().int().min(0),
});

export type LearningProgressDTO = z.infer<typeof LearningProgressSchema>;

// ============================================
// GAMIFICATION DTÓS
// ============================================

/**
 * Schema para conquista
 */
export const AchievementSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  earnedAt: z.string(),
});

export type AchievementDTO = z.infer<typeof AchievementSchema>;

/**
 * Schema para entrada do leaderboard
 */
export const LeaderboardEntrySchema = z.object({
  userId: z.string(),
  displayName: z.string(),
  totalPoints: z.number().int().min(0),
  achievements: z.number().int().min(0),
  streak: z.number().int().min(0),
  position: z.number().int().min(1),
});

export type LeaderboardEntryDTO = z.infer<typeof LeaderboardEntrySchema>;

/**
 * Schema para dados de progresso
 */
export const ProgressDataSchema = z.object({
  userId: z.string(),
  totalPoints: z.number().int().min(0),
  completedModules: z.number().int().min(0),
  certificatesEarned: z.number().int().min(0),
  streakDays: z.number().int().min(0),
  achievements: z.array(AchievementSchema),
  recentActivity: z.array(z.any()),
});

export type ProgressDataDTO = z.infer<typeof ProgressDataSchema>;

// ============================================
// UTILITY SCHEMAS AND TYPES
// ============================================

/**
 * Schema para opções de paginação
 */
export const PaginationOptionsSchema = z.object({
  limit: z.number().int().min(1).max(100),
  offset: z.number().int().min(0).optional(),
  orderBy: z.string().optional(),
  orderDirection: z.enum(['asc', 'desc']).optional(),
});

export type PaginationOptionsDTO = z.infer<typeof PaginationOptionsSchema>;

/**
 * Schema para resultado de operação em lote
 */
export const BatchOperationResultSchema = z.object({
  successful: z.number().int().min(0),
  failed: z.number().int().min(0),
  errors: z.array(z.object({
    itemId: z.string(),
    error: z.string(),
  })),
});

export type BatchOperationResultDTO = z.infer<typeof BatchOperationResultSchema>;

/**
 * Schema para status de sincronização
 */
export const SyncStatusSchema = z.object({
  lastSync: z.string(),
  pendingUploads: z.number().int().min(0),
  pendingDownloads: z.number().int().min(0),
  conflicts: z.number().int().min(0),
  isOnline: z.boolean(),
  syncInProgress: z.boolean(),
});

export type SyncStatusDTO = z.infer<typeof SyncStatusSchema>;

// ============================================
// TYPE GUARDS
// ============================================

/**
 * Type guard para verificar se é uma resposta de API válida
 */
export function isAPIResponse(obj: any): obj is APIResponse {
  return obj && typeof obj === 'object' && typeof obj.success === 'boolean';
}

/**
 * Type guard para verificar se é um usuário autenticado
 */
export function isAuthUser(user: any): user is AuthUserDTO {
  try {
    AuthUserSchema.parse(user);
    return true;
  } catch {
    return false;
  }
}

/**
 * Type guard para verificar se é uma mensagem de chat
 */
export function isChatMessage(message: any): message is ChatMessageDTO {
  try {
    ChatMessageSchema.parse(message);
    return true;
  } catch {
    return false;
  }
}

/**
 * Type guard para verificar se é um perfil de usuário
 */
export function isUserProfile(profile: any): profile is UserProfileDTO {
  try {
    UserProfileSchema.parse(profile);
    return true;
  } catch {
    return false;
  }
}

/**
 * Type guard para verificar se é uma conversa
 */
export function isConversation(conv: any): conv is ConversationDTO {
  try {
    ConversationSchema.parse(conv);
    return true;
  } catch {
    return false;
  }
}

// ============================================
// VALIDATION UTILITIES
// ============================================

/**
 * Valida dados usando schema Zod com tratamento de erro amigável
 */
export function validateData<T extends z.ZodType>(
  schema: T,
  data: unknown,
  context?: string
): { success: true; data: z.infer<T> } | { success: false; errors: string[] } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map((err: z.ZodIssue) => {
        const path = err.path.join('.');
        const message = err.message;
        return context ? `${context}.${path}: ${message}` : `${path}: ${message}`;
      });
      return { success: false, errors };
    }

    const errorMessage = context
      ? `${context}: Erro de validação desconhecido`
      : 'Erro de validação desconhecido';
    return { success: false, errors: [errorMessage] };
  }
}

/**
 * Valida resposta da API
 */
export function validateAPIResponse<T extends z.ZodType>(
  schema: T,
  response: unknown
): APIResponse<z.infer<T>> {
  const responseSchema = APIResponseSchema(schema);
  const validation = validateData(responseSchema, response, 'API Response');

  if (!validation.success) {
    return createErrorResponse(`Resposta da API inválida: ${validation.errors.join(', ')}`);
  }

  return validation.data;
}

// ============================================
// API CLIENT UTILITIES
// ============================================

/**
 * Wrapper para requisições HTTP com validação automática
 */
export async function makeValidatedRequest<T extends z.ZodType>(
  url: string,
  options: RequestInit,
  responseSchema: T
): Promise<APIResponse<z.infer<T>>> {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();
    return validateAPIResponse(responseSchema, data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro de rede desconhecido';
    return createErrorResponse(`Erro na requisição: ${message}`);
  }
}

/**
 * Converte dados do backend (snake_case) para frontend (camelCase)
 */
export function transformBackendResponse<T>(data: any): T {
  return convertToCamelCase(data) as T;
}

/**
 * Converte dados do frontend (camelCase) para backend (snake_case)
 */
export function transformFrontendRequest<T>(data: T): any {
  return convertToSnakeCase(data as any);
}