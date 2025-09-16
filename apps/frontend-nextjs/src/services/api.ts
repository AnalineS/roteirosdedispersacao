/**
 * API Client - Substituição dos serviços Firebase
 * Cliente centralizado para comunicação com backend JWT
 */

import { jwtClient } from '@/lib/auth/jwt-client';

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

export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  persona?: string;
  metadata?: {
    isFallback?: boolean;
    fallbackSource?: 'cache' | 'local_knowledge' | 'emergency' | 'generic';
    confidence?: number;
    suggestion?: string;
    emergency_contact?: string;
  };
}

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
  async post<T>(endpoint: string, data?: any): Promise<T> {
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
      console.log('[Personas] Carregadas do backend:', Object.keys(response.data).length);
      return response.data;
    } catch (error) {
      console.error('[Personas] Erro no backend, usando dados estáticos:', error);

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
   * Envia mensagem para o chat com fallback offline
   */
  async sendChatMessage(request: ChatRequest): Promise<ChatResponse> {
    try {
      const client = jwtClient.getAuthenticatedClient();
      const response = await client.post('/chat', request);
      return response.data;
    } catch (error) {
      console.error('[Chat] Erro no backend, usando resposta offline:', error);
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
    } catch (error: any) {
      console.error('Error sending message:', error);
      throw new Error(error.response?.data?.message || 'Failed to send message');
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
      console.error('Erro ao detectar escopo:', error);
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
    } catch (error: any) {
      console.error('Error getting sessions:', error);
      return [];
    }
  }

  async getSession(sessionId: string): Promise<ChatSession | null> {
    const client = jwtClient.getAuthenticatedClient();

    try {
      const response = await client.get(`/chat/sessions/${sessionId}`);
      return response.data.session;
    } catch (error: any) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    const client = jwtClient.getAuthenticatedClient();

    try {
      await client.delete(`/chat/sessions/${sessionId}`);
      return true;
    } catch (error: any) {
      console.error('Error deleting session:', error);
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
    } catch (error: any) {
      console.error('Error archiving session:', error);
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
    } catch (error: any) {
      console.error('Error getting user analytics:', error);
      return null;
    }
  }

  async recordActivity(activity: {
    type: 'message_sent' | 'session_started' | 'persona_changed' | 'feature_used';
    data?: any;
  }): Promise<boolean> {
    const client = jwtClient.getAuthenticatedClient();

    try {
      await client.post('/analytics/activity', {
        ...activity,
        timestamp: new Date().toISOString()
      });
      return true;
    } catch (error: any) {
      console.error('Error recording activity:', error);
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
    } catch (error: any) {
      console.error('Error submitting feedback:', error);
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
    } catch (error: any) {
      console.error('Error uploading file:', error);
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
      console.error('[API Health] Backend indisponível:', error);
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
    } catch (error: any) {
      console.error('Error searching knowledge base:', error);
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
export const getPersonas = () => apiClient.getPersonas();
export const sendChatMessage = (request: ChatRequest) => apiClient.sendChatMessage(request);
export const detectQuestionScope = (question: string) => apiClient.detectQuestionScope(question);
export const checkAPIHealth = () => apiClient.checkAPIHealth();

export default apiClient;