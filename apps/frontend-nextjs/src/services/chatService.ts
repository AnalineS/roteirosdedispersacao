/**
 * Serviço de Chat Completo
 * Integra PersonaRAG, analytics, monitoramento e funcionalidades avançadas
 */

import { PersonaRAGIntegration, type PersonaResponse } from './personaRAGIntegration';
import { RAGIntegrationService } from './ragIntegrationService';
import { logEvent } from './analytics';
import { conversationCache } from './simpleCache';
import { generateSecureId } from '@/utils/secureRandom';

export interface ChatSession {
  id: string;
  userId?: string;
  persona: 'dr_gasnelio' | 'ga';
  startTime: number;
  lastActivity: number;
  messageCount: number;
  metadata?: Record<string, unknown>;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  persona: string;
  metadata?: {
    confidence?: number;
    ragSources?: string[];
    personaAdapted?: boolean;
    processingTime?: number;
    fallbackUsed?: boolean;
    analytics?: Record<string, unknown>;
    isFallback?: boolean;
    fallbackSource?: string;
    suggestion?: string;
    emergency_contact?: string;
  };
}

export interface ChatAnalytics {
  totalSessions: number;
  totalMessages: number;
  averageResponseTime: number;
  personaUsage: Record<string, number>;
  topTopics: Array<{ topic: string; count: number }>;
  userSatisfaction: number;
  systemHealth: {
    ragAvailable: boolean;
    responseRate: number;
    errorRate: number;
  };
}

export interface ChatPreferences {
  preferredPersona: 'dr_gasnelio' | 'ga';
  language: 'pt-BR';
  responseStyle: 'technical' | 'casual' | 'balanced';
  notifications: boolean;
  analytics: boolean;
}

export class ChatService {
  private static instance: ChatService;
  private personaRAG: PersonaRAGIntegration;
  private ragService: RAGIntegrationService;
  private cache = conversationCache;
  private activeSessions = new Map<string, ChatSession>();
  private analytics: ChatAnalytics;

  private constructor() {
    this.personaRAG = PersonaRAGIntegration.getInstance();
    this.ragService = RAGIntegrationService.getInstance();
    this.analytics = {
      totalSessions: 0,
      totalMessages: 0,
      averageResponseTime: 0,
      personaUsage: { dr_gasnelio: 0, ga: 0 },
      topTopics: [],
      userSatisfaction: 0,
      systemHealth: {
        ragAvailable: true,
        responseRate: 0,
        errorRate: 0
      }
    };

    // Carregar analytics do cache
    this.loadAnalytics();
  }

  static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  /**
   * Inicia uma nova sessão de chat
   */
  async startSession(
    userId?: string,
    persona: 'dr_gasnelio' | 'ga' = 'dr_gasnelio',
    preferences?: Partial<ChatPreferences>
  ): Promise<ChatSession> {
    const sessionId = `chat_${Date.now()}_${generateSecureId(9)}`;
    
    const session: ChatSession = {
      id: sessionId,
      userId,
      persona,
      startTime: Date.now(),
      lastActivity: Date.now(),
      messageCount: 0,
      metadata: {
        preferences: {
          preferredPersona: persona,
          language: 'pt-BR',
          responseStyle: 'balanced',
          notifications: true,
          analytics: true,
          ...preferences
        }
      }
    };

    this.activeSessions.set(sessionId, session);
    this.analytics.totalSessions++;

    // Salvar sessão no cache
    await this.cache.set(`session:${sessionId}`, session, 24 * 60 * 60 * 1000); // 24 horas

    // Analytics
    logEvent('CHAT', 'session_started', JSON.stringify({
      sessionId,
      persona,
      userId: userId || 'anonymous'
    }));

    // Medical chat session tracking
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'medical_chat_session_started', {
        event_category: 'medical_chat_critical',
        event_label: 'new_medical_chat_session',
        custom_parameters: {
          medical_context: 'chat_session_management',
          session_id: sessionId,
          persona_type: persona,
          user_type: userId ? 'authenticated' : 'anonymous',
          session_start_time: session.startTime,
          preferred_language: 'pt-BR'
        }
      });
    }
    return session;
  }

  /**
   * Processa uma mensagem do usuário
   */
  async processMessage(
    sessionId: string,
    message: string,
    conversationHistory?: ChatMessage[]
  ): Promise<ChatMessage> {
    const startTime = Date.now();
    const session = this.activeSessions.get(sessionId);
    
    if (!session) {
      throw new Error(`Sessão ${sessionId} não encontrada`);
    }

    try {
      // Atualizar atividade da sessão
      session.lastActivity = Date.now();
      session.messageCount++;

      // Processar com PersonaRAG
      const response: PersonaResponse = await this.personaRAG.queryWithPersona(
        message,
        session.persona,
        session.userId || sessionId,
        conversationHistory
      );

      const processingTime = Date.now() - startTime;

      // Criar mensagem de resposta
      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now()}_${generateSecureId(9)}`,
        sessionId,
        role: 'assistant',
        content: response.response,
        timestamp: Date.now(),
        persona: session.persona,
        metadata: {
          confidence: response.confidence,
          ragSources: response.ragSources,
          personaAdapted: response.personaAdapted,
          processingTime,
          fallbackUsed: response.fallbackUsed,
          analytics: response.analytics
        }
      };

      // Salvar mensagem no cache
      await this.cache.set(
        `message:${assistantMessage.id}`, 
        assistantMessage, 
        7 * 24 * 60 * 60 * 1000 // 7 dias
      );

      // Atualizar analytics
      this.updateAnalytics(session.persona, processingTime, response.confidence);

      // Analytics evento
      logEvent('CHAT', 'message_processed', JSON.stringify({
        sessionId,
        persona: session.persona,
        processingTime,
        confidence: response.confidence,
        ragUsed: response.ragSources && response.ragSources.length > 0,
        fallbackUsed: response.fallbackUsed
      }));

      // Medical message processing tracking
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'medical_message_processed_successfully', {
          event_category: 'medical_chat_critical',
          event_label: 'medical_response_generated',
          value: Math.round(processingTime),
          custom_parameters: {
            medical_context: 'chat_message_processing',
            session_id: sessionId,
            persona_type: session.persona,
            processing_time_ms: processingTime,
            confidence_score: Math.round((response.confidence || 0) * 100),
            rag_sources_count: response.ragSources?.length || 0,
            persona_adapted: response.personaAdapted || false,
            fallback_used: response.fallbackUsed || false
          }
        });
      }
      return assistantMessage;

    } catch (error) {
      // Critical medical error tracking + explicit stderr logging
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Explicit error to stderr for medical system visibility
      if (typeof process !== 'undefined' && process.stderr) {
        process.stderr.write(`❌ ERRO CRÍTICO - Processamento de mensagem médica falhou:\n` +
          `  SessionID: ${sessionId}\n` +
          `  Persona: ${session?.persona || 'unknown'}\n` +
          `  Error: ${errorMessage}\n` +
          `  ProcessingTime: ${Date.now() - startTime}ms\n\n`);
      }

      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'medical_chat_processing_error', {
          event_category: 'medical_error_critical',
          event_label: 'chat_message_processing_failed',
          custom_parameters: {
            medical_context: 'critical_chat_error',
            session_id: sessionId,
            persona_type: session?.persona || 'unknown',
            error_type: 'message_processing_failure',
            error_message: errorMessage,
            processing_time_ms: Date.now() - startTime
          }
        });
      }
      
      // Analytics erro
      logEvent('ERROR', 'chat_error', JSON.stringify({
        sessionId,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }));

      // Tentar resposta de emergência
      const emergencyMessage: ChatMessage = {
        id: `msg_emergency_${Date.now()}`,
        sessionId,
        role: 'assistant',
        content: 'Desculpe, tive um problema técnico. Poderia reformular sua pergunta? Se for uma emergência médica, procure atendimento imediato.',
        timestamp: Date.now(),
        persona: session.persona,
        metadata: {
          isFallback: true,
          fallbackSource: 'emergency',
          processingTime: Date.now() - startTime
        }
      };

      return emergencyMessage;
    }
  }

  /**
   * Obtém o histórico de uma sessão
   */
  async getSessionHistory(sessionId: string): Promise<ChatMessage[]> {
    try {
      const cacheKey = `session_history:${sessionId}`;
      const cached = await this.cache.get(cacheKey);
      
      if (cached) {
        return cached as ChatMessage[];
      }

      // Se não estiver em cache, retorna vazio
      // Em produção, aqui buscaria do Firestore
      return [];
    } catch (error) {
      // Medical history retrieval error - explicit stderr + tracking
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Explicit error to stderr for medical system visibility
      if (typeof process !== 'undefined' && process.stderr) {
        process.stderr.write(`❌ ERRO - Falha ao buscar histórico médico da sessão:\n` +
          `  SessionID: ${sessionId}\n` +
          `  Error: ${errorMessage}\n\n`);
      }

      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'medical_chat_history_error', {
          event_category: 'medical_error_critical',
          event_label: 'chat_history_retrieval_failed',
          custom_parameters: {
            medical_context: 'chat_history_management',
            session_id: sessionId,
            error_type: 'history_retrieval_failure',
            error_message: errorMessage
          }
        });
      }
      return [];
    }
  }

  /**
   * Finaliza uma sessão de chat
   */
  async endSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    
    if (!session) {
      // Medical session management warning - explicit stderr + tracking

      // Explicit warning to stderr for medical system visibility
      if (typeof process !== 'undefined' && process.stderr) {
        process.stderr.write(`⚠️ AVISO - Tentativa de finalizar sessão médica inexistente:\n` +
          `  SessionID: ${sessionId}\n` +
          `  Operation: endSession\n\n`);
      }

      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'medical_chat_session_not_found', {
          event_category: 'medical_warning',
          event_label: 'session_end_attempt_invalid',
          custom_parameters: {
            medical_context: 'chat_session_management',
            session_id: sessionId,
            operation: 'session_end_attempt',
            warning_type: 'session_not_found'
          }
        });
      }
      return;
    }

    const sessionDuration = Date.now() - session.startTime;

    // Analytics
    logEvent('CHAT', 'session_ended', JSON.stringify({
      sessionId,
      duration: sessionDuration,
      messageCount: session.messageCount,
      persona: session.persona
    }));

    // Remover da memória
    this.activeSessions.delete(sessionId);

    // Atualizar cache com dados finais
    session.metadata = {
      ...session.metadata,
      endTime: Date.now(),
      duration: sessionDuration
    };

    await this.cache.set(`session:${sessionId}`, session, 7 * 24 * 60 * 60 * 1000);

    // Medical session completion tracking
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'medical_chat_session_ended', {
        event_category: 'medical_chat_critical',
        event_label: 'medical_session_completed',
        value: Math.round(sessionDuration / 1000), // Duration in seconds
        custom_parameters: {
          medical_context: 'chat_session_management',
          session_id: sessionId,
          persona_type: session.persona,
          session_duration_ms: sessionDuration,
          message_count: session.messageCount,
          completion_type: 'normal_completion'
        }
      });
    }
  }

  /**
   * Troca a persona de uma sessão
   */
  async switchPersona(sessionId: string, newPersona: 'dr_gasnelio' | 'ga'): Promise<boolean> {
    const session = this.activeSessions.get(sessionId);
    
    if (!session) {
      return false;
    }

    const oldPersona = session.persona;
    session.persona = newPersona;
    session.lastActivity = Date.now();

    // Analytics
    logEvent('PERSONA', 'persona_switched', JSON.stringify({
      sessionId,
      fromPersona: oldPersona,
      toPersona: newPersona
    }));

    // Medical persona switch tracking
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'medical_persona_switched', {
        event_category: 'medical_chat_critical',
        event_label: 'persona_change_medical_chat',
        custom_parameters: {
          medical_context: 'persona_management',
          session_id: sessionId,
          from_persona: oldPersona,
          to_persona: newPersona,
          switch_timestamp: session.lastActivity
        }
      });
    }
    return true;
  }

  /**
   * Obtém preferências do usuário
   */
  async getUserPreferences(userId: string): Promise<ChatPreferences> {
    const cacheKey = `preferences:${userId}`;
    const cached = await this.cache.get(cacheKey);

    if (cached) {
      return cached as ChatPreferences;
    }

    // Preferências padrão
    const defaultPrefs: ChatPreferences = {
      preferredPersona: 'dr_gasnelio',
      language: 'pt-BR',
      responseStyle: 'balanced',
      notifications: true,
      analytics: true
    };

    return defaultPrefs;
  }

  /**
   * Atualiza preferências do usuário
   */
  async updateUserPreferences(userId: string, preferences: Partial<ChatPreferences>): Promise<void> {
    const current = await this.getUserPreferences(userId);
    const updated = { ...current, ...preferences };
    
    const cacheKey = `preferences:${userId}`;
    await this.cache.set(cacheKey, updated, 30 * 24 * 60 * 60 * 1000); // 30 dias

    logEvent('USER', 'preferences_updated', JSON.stringify({
      userId,
      preferences: Object.keys(preferences)
    }));
  }

  /**
   * Obtém analytics do chat
   */
  getAnalytics(): ChatAnalytics {
    return {
      ...this.analytics,
      systemHealth: {
        ...this.analytics.systemHealth,
        ragAvailable: true, // Verificar via health check se necessário
        responseRate: this.calculateResponseRate(),
        errorRate: this.calculateErrorRate()
      }
    };
  }

  /**
   * Obtém sessões ativas
   */
  getActiveSessions(): ChatSession[] {
    return Array.from(this.activeSessions.values());
  }

  /**
   * Verifica saúde do sistema
   */
  async checkSystemHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'critical';
    services: Record<string, boolean>;
    metrics: Record<string, number>;
  }> {
    const services = {
      personaRAG: true, // PersonaRAG sempre disponível
      ragIntegration: true, // RAG sempre disponível com fallbacks
      cache: await this.checkCacheHealth(),
      analytics: true
    };

    const healthyServices = Object.values(services).filter(Boolean).length;
    const totalServices = Object.keys(services).length;
    const healthScore = healthyServices / totalServices;

    let status: 'healthy' | 'degraded' | 'critical';
    if (healthScore >= 0.8) status = 'healthy';
    else if (healthScore >= 0.5) status = 'degraded';
    else status = 'critical';

    return {
      status,
      services,
      metrics: {
        healthScore,
        activeSessions: this.activeSessions.size,
        totalMessages: this.analytics.totalMessages,
        averageResponseTime: this.analytics.averageResponseTime
      }
    };
  }

  // Métodos privados
  private async loadAnalytics(): Promise<void> {
    try {
      const cached = await this.cache.get('chat_analytics');
      if (cached) {
        this.analytics = { ...this.analytics, ...cached };
      }
    } catch (error) {
      // Medical analytics loading error - explicit stderr + tracking
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Explicit error to stderr for medical system visibility
      if (typeof process !== 'undefined' && process.stderr) {
        process.stderr.write(`❌ ERRO - Falha ao carregar analytics do chat médico:\n` +
          `  Error: ${errorMessage}\n\n`);
      }

      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'medical_analytics_load_error', {
          event_category: 'medical_error_critical',
          event_label: 'chat_analytics_load_failed',
          custom_parameters: {
            medical_context: 'chat_analytics_management',
            error_type: 'analytics_load_failure',
            error_message: errorMessage
          }
        });
      }
    }
  }

  private async saveAnalytics(): Promise<void> {
    try {
      await this.cache.set('chat_analytics', this.analytics, 24 * 60 * 60 * 1000);
    } catch (error) {
      // Medical analytics save error - explicit stderr + tracking
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Explicit error to stderr for medical system visibility
      if (typeof process !== 'undefined' && process.stderr) {
        process.stderr.write(`❌ ERRO - Falha ao salvar analytics do chat médico:\n` +
          `  Error: ${errorMessage}\n` +
          `  TotalMessages: ${this.analytics.totalMessages}\n\n`);
      }

      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'medical_analytics_save_error', {
          event_category: 'medical_error_critical',
          event_label: 'chat_analytics_save_failed',
          custom_parameters: {
            medical_context: 'chat_analytics_management',
            error_type: 'analytics_save_failure',
            error_message: errorMessage,
            total_messages: this.analytics.totalMessages
          }
        });
      }
    }
  }

  private updateAnalytics(persona: 'dr_gasnelio' | 'ga', processingTime: number, confidence: number): void {
    this.analytics.totalMessages++;
    this.analytics.personaUsage[persona]++;
    
    // Média móvel simples para tempo de resposta
    const alpha = 0.1;
    this.analytics.averageResponseTime = 
      this.analytics.averageResponseTime * (1 - alpha) + processingTime * alpha;

    // Salvar periodicamente
    if (this.analytics.totalMessages % 10 === 0) {
      this.saveAnalytics();
    }
  }

  private calculateResponseRate(): number {
    // Implementação simplificada
    return this.analytics.totalMessages > 0 ? 0.95 : 1.0;
  }

  private calculateErrorRate(): number {
    // Implementação simplificada
    return 0.05;
  }

  private async checkCacheHealth(): Promise<boolean> {
    try {
      const testKey = 'health_check';
      const testValue = Date.now();
      await this.cache.set(testKey, testValue, 1000);
      const retrieved = await this.cache.get(testKey);
      return retrieved === testValue;
    } catch {
      return false;
    }
  }
}

export default ChatService;