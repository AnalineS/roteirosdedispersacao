/**
 * Serviço de Chat Completo
 * Integra PersonaRAG, analytics, monitoramento e funcionalidades avançadas
 */

import { PersonaRAGIntegration, type PersonaResponse } from './personaRAGIntegration';
import { RAGIntegrationService } from './ragIntegrationService';
import { logEvent } from './analytics';
import { conversationCache } from './simpleCache';

export interface ChatSession {
  id: string;
  userId?: string;
  persona: 'dr_gasnelio' | 'ga';
  startTime: number;
  lastActivity: number;
  messageCount: number;
  metadata?: Record<string, any>;
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
    analytics?: any;
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
    const sessionId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
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

    console.log(`🗣️ Nova sessão de chat iniciada: ${sessionId} (${persona})`);
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
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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

      console.log(`✅ Mensagem processada: ${processingTime}ms (conf: ${response.confidence})`);
      return assistantMessage;

    } catch (error) {
      console.error('Erro ao processar mensagem:', error);
      
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
      console.error('Erro ao buscar histórico:', error);
      return [];
    }
  }

  /**
   * Finaliza uma sessão de chat
   */
  async endSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    
    if (!session) {
      console.warn(`Sessão ${sessionId} não encontrada para finalização`);
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

    console.log(`🏁 Sessão finalizada: ${sessionId} (${sessionDuration}ms, ${session.messageCount} msgs)`);
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

    console.log(`🔄 Persona alterada: ${oldPersona} → ${newPersona} (sessão ${sessionId})`);
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
      console.error('Erro ao carregar analytics:', error);
    }
  }

  private async saveAnalytics(): Promise<void> {
    try {
      await this.cache.set('chat_analytics', this.analytics, 24 * 60 * 60 * 1000);
    } catch (error) {
      console.error('Erro ao salvar analytics:', error);
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