/**
 * API Client - Substituição dos serviços Firebase
 * Cliente centralizado para comunicação com backend JWT
 */

import { jwtClient } from '@/lib/auth/jwt-client';
import type {
  ChatMessage,
  ChatMessageMetadata,
  ChatRequest as ChatRequestBase,
  ChatResponse as ChatResponseBase
} from '@/types/api';
import type { PersonaConfig, ValidPersonaId } from '@/types/personas';

// ============================================
// TYPES
// ============================================

export interface Persona {
  name: string;
  description: string;
  avatar: string;
  personality: string;
  expertise: string[];
  response_style: string;
  target_audience: string;
  system_prompt: string;
  capabilities: string[];
  example_questions: string[];
  limitations: string[];
  response_format: {
    technical: boolean;
    citations?: boolean;
    structured?: boolean;
    empathetic?: boolean;
  };
}

export interface PersonasResponse {
  [key: string]: Persona;
}

// ============================================
// MAPPING FUNCTIONS
// ============================================

/**
 * Converte Persona do backend para PersonaConfig do frontend
 * Mapeia propriedades diferentes entre backend e frontend
 */
export function mapPersonaToPersonaConfig(personaId: string, persona: Persona): PersonaConfig {
  // Mapear tone baseado no personaId direto
  const tone: PersonaConfig['tone'] = personaId === 'ga' ? 'empathetic' : 'professional';

  // Mapear responseStyle baseado no response_style
  const responseStyle: PersonaConfig['responseStyle'] =
    persona.response_style.toLowerCase().includes('detailed') ? 'detailed' :
    persona.response_style.toLowerCase().includes('concise') ? 'concise' : 'interactive';

  return {
    id: personaId as ValidPersonaId,
    name: persona.name,
    description: persona.description,
    avatar: persona.avatar,
    personality: persona.personality,
    expertise: persona.expertise,
    response_style: persona.response_style,
    target_audience: persona.target_audience,
    system_prompt: persona.system_prompt,
    capabilities: persona.capabilities,
    example_questions: persona.example_questions,
    limitations: persona.limitations,
    response_format: persona.response_format,
    // Frontend-specific mapped properties
    tone,
    specialties: persona.expertise, // Mapear expertise para specialties
    responseStyle,
    enabled: true // Assumir que todas as personas do backend estão habilitadas
  };
}

/**
 * Converte PersonasResponse para Record<string, PersonaConfig>
 * Para compatibilidade com componentes frontend
 */
export function mapPersonasResponseToConfigs(personas: PersonasResponse): Record<string, PersonaConfig> {
  const configs: Record<string, PersonaConfig> = {};

  for (const [personaId, persona] of Object.entries(personas)) {
    configs[personaId] = mapPersonaToPersonaConfig(personaId, persona);
  }

  return configs;
}

// ChatMessage agora importado de @/types/api

export interface ChatRequest {
  question: string;
  personality_id: string;
  conversation_history?: ChatMessage[];
  sentiment?: {
    category: string;
    score: number;
    magnitude: number;
  };
  knowledge_context?: {
    context: string;
    confidence: number;
    sources: string[];
  };
}

export interface ChatResponse {
  answer: string;
  persona: string;
  timestamp?: string;
  request_id: string;
  processing_time_ms?: number;
  confidence?: number;
  name?: string;
  api_version?: string;
  metadata?: {
    tokens_used?: number;
    model_used?: string;
    context_retrieved?: boolean;
    scope_detected?: string;
  };
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  persona: 'dr_gasnelio' | 'ga';
  createdAt: string;
  updatedAt: string;
  archived?: boolean;
}

export interface PersonaResponse {
  message: ChatMessage;
  session?: ChatSession;
  metadata: {
    confidence: number;
    sources: string[];
    processingTime: number;
    persona: 'dr_gasnelio' | 'ga';
  };
}

export interface UserAnalytics {
  userId: string;
  totalSessions: number;
  totalMessages: number;
  averageSessionDuration: number;
  favoritePersona: 'dr_gasnelio' | 'ga';
  topTopics: string[];
  completionRate: number;
  lastActivity: string;
}

export interface APIError {
  response?: {
    data?: {
      message?: string;
      error?: string;
    };
    status?: number;
    statusText?: string;
  };
  message?: string;
  code?: string;
}

export interface ActivityData {
  messageId?: string;
  sessionId?: string;
  persona?: 'dr_gasnelio' | 'ga';
  feature?: string;
  duration?: number;
  metadata?: Record<string, string | number | boolean>;
}

export interface RequestData {
  [key: string]: unknown;
}

// ============================================
// CONFIGURAÇÃO DE URL
// ============================================

const getApiUrl = (): string => {
  // Prioridade para variável de ambiente
  const envUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (envUrl && envUrl.trim() !== '') {
    return envUrl.trim();
  }

  // Fallback baseado em ambiente
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;

    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5000';
    }

    if (hostname.includes('hml')) {
      return process.env.NEXT_PUBLIC_API_URL_STAGING || 'http://localhost:5000';
    }

    return process.env.NEXT_PUBLIC_API_URL_PRODUCTION || 'http://localhost:5000';
  }

  return 'http://localhost:5000';
};

const API_BASE_URL = getApiUrl();

// Import dados estáticos para fallback
import { STATIC_PERSONAS } from '@/data/personas';

// ============================================
// API CLIENT CLASS
// ============================================

class APIClient {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  /**
   * Generic GET method
   */
  async get<T>(endpoint: string): Promise<T> {
    const client = jwtClient.getAuthenticatedClient();
    const response = await client.get(endpoint);
    return response.data;
  }

  /**
   * Generic POST method
   */
  async post<T>(endpoint: string, data?: RequestData): Promise<T> {
    const client = jwtClient.getAuthenticatedClient();
    const response = await client.post(endpoint, data);
    return response.data;
  }

  /**
   * Busca personas do backend ou retorna dados estáticos em modo offline
   */
  async getPersonas(): Promise<PersonasResponse> {
    try {
      const client = jwtClient.getAuthenticatedClient();
      const response = await client.get('/personas');
      // Medical API success tracking
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'medical_api_personas_loaded', {
          event_category: 'medical_api_success',
          event_label: 'personas_backend_loaded',
          value: Object.keys(response.data).length,
          custom_parameters: {
            medical_context: 'api_personas_loading',
            personas_count: Object.keys(response.data).length,
            api_base_url: this.baseURL,
            load_source: 'backend'
          }
        });
      }
      return response.data;
    } catch (error) {
      // Medical API personas fallback - explicit stderr + tracking
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Explicit error to stderr for medical system visibility
      if (typeof process !== 'undefined' && process.stderr) {
        process.stderr.write(`❌ ERRO - Falha ao carregar personas médicas do backend:\n` +
          `  BackendURL: ${this.baseURL}\n` +
          `  Error: ${errorMessage}\n` +
          `  Fallback: Usando dados estáticos\n\n`);
      }

      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'medical_api_personas_backend_error', {
          event_category: 'medical_error_critical',
          event_label: 'personas_backend_failed_fallback_static',
          custom_parameters: {
            medical_context: 'api_personas_loading',
            api_base_url: this.baseURL,
            error_type: 'backend_unavailable',
            error_message: errorMessage,
            fallback_type: 'static_data'
          }
        });
      }

      // Mostrar toast de erro se disponível
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('show-error-toast', {
          detail: {
            errorId: `api_personas_${Date.now()}`,
            severity: 'medium',
            message: 'Conectando com servidor offline. Usando dados locais.'
          }
        });
        window.dispatchEvent(event);
      }

      return STATIC_PERSONAS;
    }
  }

  /**
   * Busca personas do backend e retorna como PersonaConfig para compatibilidade frontend
   */
  async getPersonaConfigs(): Promise<Record<string, PersonaConfig>> {
    const personas = await this.getPersonas();
    return mapPersonasResponseToConfigs(personas);
  }

  /**
   * Envia mensagem para o chat com fallback offline
   */
  async sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
    try {
      const client = jwtClient.getAuthenticatedClient();
      const response = await client.post('/chat', request);
      return response.data;
    } catch (error) {
      // Medical API chat fallback - explicit stderr + tracking
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Explicit error to stderr for medical system visibility
      if (typeof process !== 'undefined' && process.stderr) {
        process.stderr.write(`❌ ERRO - Falha no chat médico do backend:\n` +
          `  BackendURL: ${this.baseURL}\n` +
          `  PersonaID: ${request.personality_id}\n` +
          `  Error: ${errorMessage}\n` +
          `  Fallback: Resposta offline ativada\n\n`);
      }

      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'medical_api_chat_backend_error', {
          event_category: 'medical_error_critical',
          event_label: 'chat_backend_failed_fallback_offline',
          custom_parameters: {
            medical_context: 'api_chat_processing',
            api_base_url: this.baseURL,
            persona_id: request.personality_id,
            error_type: 'backend_unavailable',
            error_message: errorMessage,
            fallback_type: 'offline_response'
          }
        });
      }
      return this.generateOfflineResponse(request);
    }
  }

  /**
   * Chat com personas (novo endpoint)
   */
  async sendMessage(
    message: string,
    persona: 'dr_gasnelio' | 'ga',
    sessionId?: string
  ): Promise<PersonaResponse> {
    const client = jwtClient.getAuthenticatedClient();

    try {
      const response = await client.post('/chat', {
        message,
        persona,
        sessionId,
        includeHistory: true
      });

      return response.data;
    } catch (error: APIError | Error | unknown) {
      // Medical API message send error - explicit stderr + tracking
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Explicit error to stderr for medical system visibility
      if (typeof process !== 'undefined' && process.stderr) {
        process.stderr.write(`❌ ERRO CRÍTICO - Falha ao enviar mensagem médica:\n` +
          `  Persona: ${persona}\n` +
          `  SessionID: ${sessionId || 'none'}\n` +
          `  Error: ${errorMessage}\n\n`);
      }

      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'medical_api_send_message_error', {
          event_category: 'medical_error_critical',
          event_label: 'message_send_failed',
          custom_parameters: {
            medical_context: 'api_message_sending',
            persona_id: persona,
            session_id: sessionId || 'none',
            error_type: 'message_send_failure',
            error_message: errorMessage
          }
        });
      }
      const apiError = error as APIError;
      throw new Error(apiError.response?.data?.message || 'Failed to send message');
    }
  }

  /**
   * Detecta escopo da pergunta
   */
  async detectQuestionScope(question: string): Promise<{
    scope: string;
    confidence: number;
    details: string;
    category?: string;
    is_medical?: boolean;
    offline_mode?: boolean;
    offline_fallback?: boolean;
  }> {
    try {
      const client = jwtClient.getAuthenticatedClient();
      const response = await client.post('/scope', { question });
      return response.data;
    } catch (error) {
      // Medical API scope detection error - explicit stderr + tracking
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Explicit error to stderr for medical system visibility
      if (typeof process !== 'undefined' && process.stderr) {
        process.stderr.write(`❌ ERRO - Falha na detecção de escopo médico:\n` +
          `  Question: ${question.substring(0, 100)}...\n` +
          `  Error: ${errorMessage}\n` +
          `  Fallback: Escopo médico geral\n\n`);
      }

      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'medical_api_scope_detection_error', {
          event_category: 'medical_error_critical',
          event_label: 'scope_detection_failed',
          custom_parameters: {
            medical_context: 'api_scope_detection',
            question_length: question.length,
            error_type: 'scope_detection_failure',
            error_message: errorMessage,
            fallback_scope: 'medical_general'
          }
        });
      }
      // Fallback para escopo offline
      return {
        scope: 'medical_general',
        confidence: 0.6,
        details: 'Fallback para escopo médico geral após erro de rede',
        category: 'hanseniase',
        is_medical: true,
        offline_fallback: true
      };
    }
  }

  /**
   * Gerenciamento de sessões de chat
   */
  async getSessions(limit: number = 50, offset: number = 0): Promise<ChatSession[]> {
    const client = jwtClient.getAuthenticatedClient();

    try {
      const response = await client.get('/chat/sessions', {
        params: { limit, offset }
      });
      return response.data.sessions || [];
    } catch (error: APIError | Error | unknown) {
      // Medical API sessions retrieval error - explicit stderr + tracking
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Explicit error to stderr for medical system visibility
      if (typeof process !== 'undefined' && process.stderr) {
        process.stderr.write(`❌ ERRO - Falha ao buscar sessões médicas:\n` +
          `  Limit: ${limit}\n` +
          `  Offset: ${offset}\n` +
          `  Error: ${errorMessage}\n\n`);
      }

      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'medical_api_get_sessions_error', {
          event_category: 'medical_error_critical',
          event_label: 'sessions_retrieval_failed',
          custom_parameters: {
            medical_context: 'api_sessions_management',
            limit: limit,
            offset: offset,
            error_type: 'sessions_retrieval_failure',
            error_message: errorMessage
          }
        });
      }
      return [];
    }
  }

  async getSession(sessionId: string): Promise<ChatSession | null> {
    const client = jwtClient.getAuthenticatedClient();

    try {
      const response = await client.get(`/chat/sessions/${sessionId}`);
      return response.data.session;
    } catch (error: APIError | Error | unknown) {
      // Medical API session retrieval error - explicit stderr + tracking
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Explicit error to stderr for medical system visibility
      if (typeof process !== 'undefined' && process.stderr) {
        process.stderr.write(`❌ ERRO - Falha ao buscar sessão médica:\n` +
          `  SessionID: ${sessionId}\n` +
          `  Error: ${errorMessage}\n\n`);
      }

      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'medical_api_get_session_error', {
          event_category: 'medical_error_critical',
          event_label: 'session_retrieval_failed',
          custom_parameters: {
            medical_context: 'api_session_management',
            session_id: sessionId,
            error_type: 'session_retrieval_failure',
            error_message: errorMessage
          }
        });
      }
      return null;
    }
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    const client = jwtClient.getAuthenticatedClient();

    try {
      await client.delete(`/chat/sessions/${sessionId}`);
      return true;
    } catch (error: APIError | Error | unknown) {
      // Medical API session deletion error - explicit stderr + tracking
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Explicit error to stderr for medical system visibility
      if (typeof process !== 'undefined' && process.stderr) {
        process.stderr.write(`❌ ERRO - Falha ao excluir sessão médica:\n` +
          `  SessionID: ${sessionId}\n` +
          `  Error: ${errorMessage}\n\n`);
      }

      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'medical_api_delete_session_error', {
          event_category: 'medical_error_critical',
          event_label: 'session_deletion_failed',
          custom_parameters: {
            medical_context: 'api_session_management',
            session_id: sessionId,
            error_type: 'session_deletion_failure',
            error_message: errorMessage
          }
        });
      }
      return false;
    }
  }

  async archiveSession(sessionId: string): Promise<boolean> {
    const client = jwtClient.getAuthenticatedClient();

    try {
      await client.patch(`/chat/sessions/${sessionId}`, {
        archived: true
      });
      return true;
    } catch (error: APIError | Error | unknown) {
      // Medical API session archiving error - explicit stderr + tracking
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Explicit error to stderr for medical system visibility
      if (typeof process !== 'undefined' && process.stderr) {
        process.stderr.write(`❌ ERRO - Falha ao arquivar sessão médica:\n` +
          `  SessionID: ${sessionId}\n` +
          `  Error: ${errorMessage}\n\n`);
      }

      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'medical_api_archive_session_error', {
          event_category: 'medical_error_critical',
          event_label: 'session_archiving_failed',
          custom_parameters: {
            medical_context: 'api_session_management',
            session_id: sessionId,
            error_type: 'session_archiving_failure',
            error_message: errorMessage
          }
        });
      }
      return false;
    }
  }

  /**
   * Analytics e métricas
   */
  async getUserAnalytics(): Promise<UserAnalytics | null> {
    const client = jwtClient.getAuthenticatedClient();

    try {
      const response = await client.get('/analytics/user');
      return response.data.analytics;
    } catch (error: APIError | Error | unknown) {
      // Medical API user analytics error - explicit stderr + tracking
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Explicit error to stderr for medical system visibility
      if (typeof process !== 'undefined' && process.stderr) {
        process.stderr.write(`❌ ERRO - Falha ao buscar analytics médicos do usuário:\n` +
          `  Error: ${errorMessage}\n\n`);
      }

      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'medical_api_user_analytics_error', {
          event_category: 'medical_error_critical',
          event_label: 'user_analytics_retrieval_failed',
          custom_parameters: {
            medical_context: 'api_user_analytics',
            error_type: 'analytics_retrieval_failure',
            error_message: errorMessage
          }
        });
      }
      return null;
    }
  }

  async recordActivity(activity: {
    type: 'message_sent' | 'session_started' | 'persona_changed' | 'feature_used';
    data?: ActivityData;
  }): Promise<boolean> {
    const client = jwtClient.getAuthenticatedClient();

    try {
      await client.post('/analytics/activity', {
        ...activity,
        timestamp: new Date().toISOString()
      });
      return true;
    } catch (error: APIError | Error | unknown) {
      // Medical API activity recording error - explicit stderr + tracking
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Explicit error to stderr for medical system visibility
      if (typeof process !== 'undefined' && process.stderr) {
        process.stderr.write(`❌ ERRO - Falha ao registrar atividade médica:\n` +
          `  ActivityType: ${activity.type}\n` +
          `  Error: ${errorMessage}\n\n`);
      }

      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'medical_api_record_activity_error', {
          event_category: 'medical_error_critical',
          event_label: 'activity_recording_failed',
          custom_parameters: {
            medical_context: 'api_activity_tracking',
            activity_type: activity.type,
            error_type: 'activity_recording_failure',
            error_message: errorMessage
          }
        });
      }
      return false;
    }
  }

  /**
   * Feedback e avaliações
   */
  async submitFeedback(feedback: {
    messageId?: string;
    sessionId?: string;
    rating: number; // 1-5
    comment?: string;
    type: 'message' | 'session' | 'general';
  }): Promise<boolean> {
    const client = jwtClient.getAuthenticatedClient();

    try {
      await client.post('/feedback', feedback);
      return true;
    } catch (error: APIError | Error | unknown) {
      // Medical API feedback submission error - explicit stderr + tracking
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Explicit error to stderr for medical system visibility
      if (typeof process !== 'undefined' && process.stderr) {
        process.stderr.write(`❌ ERRO - Falha ao enviar feedback médico:\n` +
          `  Rating: ${feedback.rating}\n` +
          `  Type: ${feedback.type}\n` +
          `  Error: ${errorMessage}\n\n`);
      }

      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'medical_api_submit_feedback_error', {
          event_category: 'medical_error_critical',
          event_label: 'feedback_submission_failed',
          custom_parameters: {
            medical_context: 'api_feedback_system',
            feedback_rating: feedback.rating,
            feedback_type: feedback.type,
            error_type: 'feedback_submission_failure',
            error_message: errorMessage
          }
        });
      }
      return false;
    }
  }

  /**
   * Upload de arquivos (futuro)
   */
  async uploadFile(file: File, type: 'profile_picture' | 'document'): Promise<string | null> {
    const client = jwtClient.getAuthenticatedClient();

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const response = await client.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data.url;
    } catch (error: APIError | Error | unknown) {
      // Medical API file upload error - explicit stderr + tracking
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Explicit error to stderr for medical system visibility
      if (typeof process !== 'undefined' && process.stderr) {
        process.stderr.write(`❌ ERRO - Falha no upload de arquivo médico:\n` +
          `  FileType: ${type}\n` +
          `  FileName: ${file.name}\n` +
          `  FileSize: ${file.size} bytes\n` +
          `  Error: ${errorMessage}\n\n`);
      }

      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'medical_api_file_upload_error', {
          event_category: 'medical_error_critical',
          event_label: 'file_upload_failed',
          custom_parameters: {
            medical_context: 'api_file_upload',
            file_type: type,
            file_name: file.name,
            file_size_bytes: file.size,
            error_type: 'file_upload_failure',
            error_message: errorMessage
          }
        });
      }
      return null;
    }
  }

  /**
   * Verifica saúde da API
   */
  async checkAPIHealth(): Promise<{
    available: boolean;
    url: string | null;
    error?: string;
    fallbackActive: boolean;
  }> {
    try {
      const client = jwtClient.getAuthenticatedClient();
      const response = await client.get('/health');

      if (response.status === 200) {
        return {
          available: true,
          url: this.baseURL,
          fallbackActive: false
        };
      }

      throw new Error('Health check failed');
    } catch (error) {
      // Medical API health check error - explicit stderr + tracking
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Explicit error to stderr for medical system visibility
      if (typeof process !== 'undefined' && process.stderr) {
        process.stderr.write(`❌ ERRO CRÍTICO - Backend médico indisponível:\n` +
          `  BackendURL: ${this.baseURL}\n` +
          `  Error: ${errorMessage}\n` +
          `  Status: Fallback ativado\n\n`);
      }

      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'medical_api_health_check_failed', {
          event_category: 'medical_error_critical',
          event_label: 'backend_unavailable_fallback_active',
          custom_parameters: {
            medical_context: 'api_health_monitoring',
            api_base_url: this.baseURL,
            error_type: 'backend_unavailable',
            error_message: errorMessage,
            fallback_status: 'active'
          }
        });
      }
      return {
        available: false,
        url: this.baseURL,
        error: 'Backend indisponível - usando funcionalidades básicas',
        fallbackActive: true
      };
    }
  }

  /**
   * Busca no conhecimento base
   */
  async searchKnowledgeBase(query: string, filters?: {
    category?: string;
    confidence?: number;
  }): Promise<{
    results: Array<{
      content: string;
      source: string;
      confidence: number;
      category: string;
    }>;
    total: number;
  }> {
    const client = jwtClient.getAuthenticatedClient();

    try {
      const response = await client.post('/search', {
        query,
        filters
      });

      return response.data;
    } catch (error: APIError | Error | unknown) {
      // Medical API knowledge base search error - explicit stderr + tracking
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Explicit error to stderr for medical system visibility
      if (typeof process !== 'undefined' && process.stderr) {
        process.stderr.write(`❌ ERRO - Falha na busca da base de conhecimento médico:\n` +
          `  Query: ${query.substring(0, 100)}...\n` +
          `  Filters: ${JSON.stringify(filters || {})}\n` +
          `  Error: ${errorMessage}\n\n`);
      }

      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'medical_api_knowledge_search_error', {
          event_category: 'medical_error_critical',
          event_label: 'knowledge_base_search_failed',
          custom_parameters: {
            medical_context: 'api_knowledge_search',
            query_length: query.length,
            filters_applied: filters ? Object.keys(filters).length : 0,
            error_type: 'knowledge_search_failure',
            error_message: errorMessage
          }
        });
      }
      return { results: [], total: 0 };
    }
  }

  /**
   * Gera resposta offline quando backend indisponível
   */
  private generateOfflineResponse(request: ChatRequest): ChatResponse {
    const isGa = request.personality_id === 'ga';
    const persona = isGa ? 'Gá' : 'Dr. Gasnelio';
    const emoji = isGa ? '🤗' : '👨‍⚕️';

    const offlineMessage = isGa
      ? `${emoji} Oi! Sou o Gá e estou aqui para te ajudar com informações sobre hanseníase.

No momento, estou funcionando em modo offline, então minhas respostas podem ser mais limitadas.

Para sua pergunta sobre: "${request.question}"

📚 Recomendo que consulte:
• O material educativo disponível nesta plataforma
• Seu médico ou farmacêutico para orientações específicas
• A cartilha oficial do Ministério da Saúde sobre hanseníase

Lembre-se: é muito importante seguir corretamente o tratamento PQT-U e não interromper os medicamentos. O tratamento da hanseníase tem cura quando feito adequadamente! 💚`

      : `${emoji} Dr. Gasnelio aqui. Atualmente funcionando em modo offline.

Sua consulta: "${request.question}"

📋 **Informações gerais sobre PQT-U:**
• Duração: 6 meses para hanseníase paucibacilar
• Medicamentos: Rifampicina, Dapsona, Clofazimina
• Administração: Dose supervisionada mensal + autoadministração diária

⚠️ **Importante:** Para orientações específicas sobre dosagem, interações medicamentosas ou efeitos adversos, consulte sempre um profissional de saúde qualificado.

📖 Consulte o material técnico disponível nesta plataforma para informações detalhadas baseadas no PCDT Hanseníase 2022.`;

    return {
      answer: offlineMessage,
      persona: persona,
      request_id: `offline_${Date.now()}`,
      timestamp: new Date().toISOString(),
      processing_time_ms: 100,
      confidence: 0.8,
      name: persona,
      api_version: "offline_v1.0",
      metadata: {
        tokens_used: 0,
        model_used: "offline_fallback",
        context_retrieved: false,
        scope_detected: "offline_mode"
      }
    };
  }
}

// ============================================
// SINGLETON INSTANCE E EXPORTS
// ============================================

export const apiClient = new APIClient();

// Export das funções principais para compatibilidade
export const getPersonas = () => apiClient.getPersonaConfigs(); // Retorna PersonaConfig para compatibilidade frontend
export const getPersonasRaw = () => apiClient.getPersonas(); // Retorna Persona original do backend
export const getPersonaConfigs = () => apiClient.getPersonaConfigs(); // Alias explícito
export const sendChatMessage = (request: ChatRequest) => apiClient.sendChatMessage(request);
export const detectQuestionScope = (question: string) => apiClient.detectQuestionScope(question);
export const checkAPIHealth = () => apiClient.checkAPIHealth();

export default apiClient;