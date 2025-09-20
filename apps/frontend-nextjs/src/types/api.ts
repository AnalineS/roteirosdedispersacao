// ============================================
// API TYPES - Substituição de any em APIs
// ============================================

// Base API types
export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  message: string;
  timestamp: number;
  success: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  status: number;
  details?: Record<string, unknown>;
  timestamp: number;
  path?: string;
  method?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiRequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  params?: Record<string, unknown>;
  timeout?: number;
  retries?: number;
  cache?: boolean;
}

// Authentication API
export interface AuthRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ResetPasswordRequest {
  email: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// User API
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'user' | 'moderator';
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  updatedAt: string;
  profile?: UserProfile;
}

export interface UserProfile {
  bio?: string;
  phone?: string;
  address?: Address;
  preferences: UserPreferences;
  statistics: UserStatistics;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
    inApp: boolean;
  };
  privacy: {
    profileVisible: boolean;
    dataCollection: boolean;
  };
}

export interface UserStatistics {
  loginCount: number;
  lastLogin: string;
  totalTimeSpent: number;
  modulesCompleted: number;
  achievements: string[];
}

export interface Address {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
}

// Content/Module API
export interface Module {
  id: string;
  title: string;
  description: string;
  content: ModuleContent[];
  duration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  tags: string[];
  prerequisites?: string[];
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  statistics: ModuleStatistics;
}

export interface ModuleContent {
  id: string;
  type: 'text' | 'video' | 'image' | 'quiz' | 'interactive';
  title: string;
  data: TextContent | VideoContent | ImageContent | QuizContent | InteractiveContent;
  order: number;
}

export interface TextContent {
  content: string;
  format: 'markdown' | 'html' | 'plain';
}

export interface VideoContent {
  url: string;
  duration: number;
  thumbnail?: string;
  captions?: string[];
}

export interface ImageContent {
  url: string;
  alt: string;
  caption?: string;
}

export interface QuizContent {
  questions: Question[];
  passingScore: number;
  timeLimit?: number;
}

export interface Question {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'open-ended';
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
}

export interface InteractiveContent {
  type: 'simulation' | 'calculator' | 'diagram';
  config: Record<string, unknown>;
  data: Record<string, unknown>;
}

export interface ModuleStatistics {
  views: number;
  completions: number;
  averageRating: number;
  totalRatings: number;
  averageTime: number;
}

// Progress API
export interface UserProgress {
  userId: string;
  moduleId: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progress: number; // 0-100
  timeSpent: number;
  startedAt?: string;
  completedAt?: string;
  currentSection?: string;
  scores?: Record<string, number>;
}

export interface ProgressUpdate {
  moduleId: string;
  progress: number;
  timeSpent: number;
  currentSection: string;
  completed?: boolean;
}

// Chat/Persona API
export interface ChatMessage {
  id?: string; // Optional para compatibilidade com services/api.ts
  content: string;
  role: 'user' | 'assistant';
  timestamp: string | number; // Flexível para compatibilidade
  persona?: string;
  metadata?: ChatMessageMetadata;
}

export interface ChatMessageMetadata {
  tokens?: number;
  model?: string;
  confidence?: number;
  sources?: string[];
  processingTime?: number;
  // Propriedades específicas de fallback do services/api.ts
  isFallback?: boolean;
  fallbackSource?: 'cache' | 'local_knowledge' | 'emergency' | 'generic';
  suggestion?: string;
  emergency_contact?: string;
}

export interface ChatRequest {
  message: string;
  persona?: string;
  context?: string[];
  sessionId?: string;
}

export interface ChatResponse {
  message: ChatMessage;
  suggestions?: string[];
  sources?: Reference[];
  confidence: number;
}

export interface Reference {
  title: string;
  url: string;
  excerpt: string;
  relevance: number;
}

// Analytics API
export interface AnalyticsEvent {
  eventType: string;
  userId?: string;
  sessionId: string;
  timestamp: string;
  properties: Record<string, unknown>;
  context: AnalyticsContext;
}

export interface AnalyticsContext {
  page: {
    url: string;
    title: string;
    referrer?: string;
  };
  device: {
    type: 'desktop' | 'mobile' | 'tablet';
    os: string;
    browser: string;
  };
  user?: {
    id: string;
    segment: string;
  };
}

export interface AnalyticsReport {
  metric: string;
  value: number;
  change: number;
  period: {
    start: string;
    end: string;
  };
  breakdown?: Array<{
    key: string;
    value: number;
    percentage: number;
  }>;
}

// File Upload API
export interface FileUploadResponse {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  hash: string;
}

export interface FileUploadRequest {
  file: File;
  directory?: string;
  public?: boolean;
  metadata?: Record<string, unknown>;
}

// Search API
export interface SearchQuery {
  q: string;
  filters?: SearchFilters;
  sort?: SearchSort;
  pagination?: {
    page: number;
    limit: number;
  };
}

export interface SearchFilters {
  category?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  tags?: string[];
  difficulty?: string[];
}

export interface SearchSort {
  field: string;
  direction: 'asc' | 'desc';
}

export interface SearchResult<T = unknown> {
  item: T;
  score: number;
  highlights: Record<string, string[]>;
}

export interface SearchResponse<T = unknown> {
  results: SearchResult<T>[];
  total: number;
  took: number;
  suggestions?: string[];
  facets?: Record<string, SearchFacet>;
}

export interface SearchFacet {
  name: string;
  values: Array<{
    value: string;
    count: number;
  }>;
}

// Generic API utilities
export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface RequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
  signal?: AbortSignal;
}

export type ApiEndpoint<TRequest = unknown, TResponse = unknown> = {
  method: ApiMethod;
  path: string;
  request?: TRequest;
  response: TResponse;
};

// Error handling
export class ApiErrorClass extends Error {
  constructor(
    public code: string,
    public status: number,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Utility types
export type ExtractApiResponse<T> = T extends ApiResponse<infer R> ? R : never;
export type ExtractApiRequest<T> = T extends ApiEndpoint<infer R, unknown> ? R : never;