// API Types
export interface ApiResponse<T> {
  data?: T
  error?: string
  error_code?: string
  request_id?: string
  timestamp?: string
}

// Persona Types
export interface Persona {
  id: string
  name: string
  description: string
  avatar: string
  greeting: string
  system_prompt: string
  role?: string
  audience?: string
  language_style?: string
  capabilities?: string[]
  example_questions?: string[]
  limitations?: PersonaLimitations
  response_format?: ResponseFormat
}

export interface PersonaLimitations {
  scope: string
  not_covered: string[]
  redirects_to: Record<string, string>
}

export interface ResponseFormat {
  structure: string[]
  tone: string
  citations?: string
  terminology?: string
  translations?: string
  support?: string
}

// Chat Types
export interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  persona?: string
  confidence?: number
  metadata?: MessageMetadata
}

export interface MessageMetadata {
  processing_time_ms?: number
  request_id?: string
  api_version?: string
  scope_analysis?: ScopeAnalysis
}

// Scope Types
export interface ScopeAnalysis {
  is_in_scope: boolean
  confidence_level: 'high' | 'medium' | 'low'
  category: string
  scope_score: number
  reasoning: string
  redirect_suggestion?: string
}

export interface ScopeInfo {
  knowledge_scope: {
    primary_focus: string
    source: string
    covered_topics: Record<string, string[]>
    explicitly_not_covered: string[]
  }
  confidence_levels: Record<string, string>
  metadata: ApiMetadata
}

// Feedback Types
export interface FeedbackData {
  question: string
  response: string
  rating: number
  comments?: string
}

// Stats Types
export interface SystemStats {
  rag_system: {
    total_feedback: number
    average_rating: number
    rating_distribution: Record<number, number>
    cache_stats: {
      cached_responses: number
      max_cache_size: number
    }
  }
  rate_limiter: {
    active_ips: number
    total_endpoints: number
    limits_configured: Record<string, any>
  }
  application: {
    api_version: string
    uptime_info: string
    available_personas: string[]
    knowledge_base_loaded: boolean
  }
}

// Common Types
export interface ApiMetadata {
  api_version: string
  last_updated: string
  request_id: string
  timestamp: string
}

// Theme Types
export type Theme = 'light' | 'dark' | 'system'

// Navigation Types
export interface NavItem {
  label: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
}

// Form Types
export interface ChatFormData {
  message: string
  persona: string
}

// Export Types
export type ExportFormat = 'pdf' | 'docx'

// Error Types
export interface ApiError {
  message: string
  code?: string
  details?: any
}

// Toast Types
export type ToastType = 'success' | 'error' | 'info' | 'warning'

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>
}