/**
 * Hook avançado para integração com ChatService
 * Substitui funcionalidades do useChat quando necessário
 */

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import ChatService, { 
  type ChatSession, 
  type ChatMessage, 
  type ChatAnalytics, 
  type ChatPreferences 
} from '@/services/chatService';
import { useSafeAuth } from '@/hooks/useSafeAuth';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { logEvent } from '@/services/analytics';

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    chat: boolean;
    personas: boolean;
    analytics: boolean;
    storage: boolean;
  };
  performance: {
    averageResponseTime: number;
    uptime: number;
    errorRate: number;
  };
  lastChecked: string;
}

export interface UseChatServiceOptions {
  autoStart?: boolean;
  defaultPersona?: 'dr_gasnelio' | 'ga';
  preferences?: Partial<ChatPreferences>;
  enableAnalytics?: boolean;
  onSessionStart?: (session: ChatSession) => void;
  onSessionEnd?: (session: ChatSession) => void;
  onMessageProcessed?: (message: ChatMessage) => void;
  onError?: (error: Error) => void;
}

export interface UseChatServiceReturn {
  // Estado da sessão
  session: ChatSession | null;
  isSessionActive: boolean;
  
  // Estado do chat
  loading: boolean;
  error: string | null;
  
  // Funcionalidades principais
  startSession: (persona?: 'dr_gasnelio' | 'ga', preferences?: Partial<ChatPreferences>) => Promise<void>;
  endSession: () => Promise<void>;
  sendMessage: (message: string) => Promise<ChatMessage | null>;
  switchPersona: (persona: 'dr_gasnelio' | 'ga') => Promise<boolean>;
  
  // Histórico e navegação
  getHistory: () => Promise<ChatMessage[]>;
  clearHistory: () => void;
  
  // Preferências do usuário
  preferences: ChatPreferences | null;
  updatePreferences: (preferences: Partial<ChatPreferences>) => Promise<void>;
  
  // Analytics e monitoramento
  analytics: ChatAnalytics;
  systemHealth: SystemHealth | null;
  refreshAnalytics: () => void;
  
  // Funcionalidades avançadas
  exportConversation: () => Promise<string>;
  importConversation: (data: string) => Promise<boolean>;
}

export function useChatService(options: UseChatServiceOptions = {}): UseChatServiceReturn {
  const {
    autoStart = false,
    defaultPersona = 'dr_gasnelio',
    preferences: defaultPreferences = {},
    enableAnalytics = true,
    onSessionStart,
    onSessionEnd,
    onMessageProcessed,
    onError
  } = options;

  // Dependências
  const { user, isAuthenticated } = useSafeAuth();
  const { handleError } = useErrorHandler();
  const chatService = useMemo(() => ChatService.getInstance(), []);

  // Estados
  const [session, setSession] = useState<ChatSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<ChatPreferences | null>(null);
  const [analytics, setAnalytics] = useState<ChatAnalytics>(chatService.getAnalytics());
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);

  // Refs para evitar re-renderizações desnecessárias
  const sessionRef = useRef<ChatSession | null>(null);
  const conversationHistory = useRef<ChatMessage[]>([]);

  // Estados computados
  const isSessionActive = useMemo(() => session !== null, [session]);

  // Carregar preferências do usuário
  useEffect(() => {
    if (isAuthenticated && user?.uid) {
      chatService.getUserPreferences(user.uid)
        .then(setPreferences)
        .catch(error => {
          console.error('Erro ao carregar preferências:', error);
          handleError(error, 'medium');
        });
    }
  }, [isAuthenticated, user?.uid, chatService, handleError]);

  // Auto-start session se configurado
  useEffect(() => {
    if (autoStart && !session && preferences) {
      startSession(preferences.preferredPersona || defaultPersona, defaultPreferences);
    }
  }, [autoStart, session, preferences]); // eslint-disable-line react-hooks/exhaustive-deps

  // Atualizar analytics periodicamente
  useEffect(() => {
    const interval = setInterval(() => {
      setAnalytics(chatService.getAnalytics());
    }, 30000); // A cada 30 segundos

    return () => clearInterval(interval);
  }, [chatService]);

  // Verificar saúde do sistema periodicamente
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const health = await chatService.checkSystemHealth();
        setSystemHealth(health);
      } catch (error) {
        console.error('Erro ao verificar saúde do sistema:', error);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 60000); // A cada minuto

    return () => clearInterval(interval);
  }, [chatService]);

  // Iniciar sessão
  const startSession = useCallback(async (
    persona: 'dr_gasnelio' | 'ga' = defaultPersona,
    sessionPreferences?: Partial<ChatPreferences>
  ) => {
    try {
      setLoading(true);
      setError(null);

      const newSession = await chatService.startSession(
        user?.uid,
        persona,
        { ...defaultPreferences, ...sessionPreferences }
      );

      setSession(newSession);
      sessionRef.current = newSession;
      conversationHistory.current = [];

      if (onSessionStart) {
        onSessionStart(newSession);
      }

      if (enableAnalytics) {
        logEvent('CHAT', 'session_started', newSession.id);
      }

      console.log('🚀 Sessão ChatService iniciada:', newSession.id);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro ao iniciar sessão');
      setError(error.message);
      handleError(error, 'medium');
      
      if (onError) {
        onError(error);
      }
    } finally {
      setLoading(false);
    }
  }, [user?.uid, defaultPersona, defaultPreferences, chatService, onSessionStart, enableAnalytics, onError, handleError]);

  // Finalizar sessão
  const endSession = useCallback(async () => {
    if (!session) return;

    try {
      await chatService.endSession(session.id);
      
      if (onSessionEnd) {
        onSessionEnd(session);
      }

      setSession(null);
      sessionRef.current = null;
      conversationHistory.current = [];

      if (enableAnalytics) {
        logEvent('CHAT', 'session_ended', session.id, Date.now() - session.startTime);
      }

      console.log('🏁 Sessão ChatService finalizada:', session.id);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro ao finalizar sessão');
      console.error('Erro ao finalizar sessão:', error);
      handleError(error, 'medium');
    }
  }, [session, chatService, onSessionEnd, enableAnalytics, handleError]);

  // Enviar mensagem
  const sendMessage = useCallback(async (message: string): Promise<ChatMessage | null> => {
    if (!session || !message.trim()) {
      setError('Sessão não iniciada ou mensagem vazia');
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await chatService.processMessage(
        session.id,
        message.trim(),
        conversationHistory.current
      );

      // Atualizar histórico local
      const userMessage: ChatMessage = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sessionId: session.id,
        role: 'user',
        content: message.trim(),
        timestamp: Date.now(),
        persona: session.persona
      };

      conversationHistory.current.push(userMessage, response);

      if (onMessageProcessed) {
        onMessageProcessed(response);
      }

      if (enableAnalytics) {
        logEvent('CHAT', 'message_sent', session.id, message.length);
      }

      return response;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro ao enviar mensagem');
      setError(error.message);
      handleError(error, 'medium');
      
      if (onError) {
        onError(error);
      }

      return null;
    } finally {
      setLoading(false);
    }
  }, [session, chatService, onMessageProcessed, enableAnalytics, onError, handleError]);

  // Trocar persona
  const switchPersona = useCallback(async (persona: 'dr_gasnelio' | 'ga'): Promise<boolean> => {
    if (!session) {
      setError('Sessão não iniciada');
      return false;
    }

    try {
      const success = await chatService.switchPersona(session.id, persona);
      
      if (success) {
        setSession(prev => prev ? { ...prev, persona } : null);
        
        if (enableAnalytics) {
          logEvent('PERSONA', 'persona_switched', persona);
        }
      }

      return success;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro ao trocar persona');
      console.error('Erro ao trocar persona:', error);
      handleError(error, 'medium');
      return false;
    }
  }, [session, chatService, enableAnalytics, handleError]);

  // Obter histórico
  const getHistory = useCallback(async (): Promise<ChatMessage[]> => {
    if (!session) return [];

    try {
      const history = await chatService.getSessionHistory(session.id);
      conversationHistory.current = history;
      return history;
    } catch (error) {
      console.error('Erro ao obter histórico:', error);
      return conversationHistory.current;
    }
  }, [session, chatService]);

  // Limpar histórico
  const clearHistory = useCallback(() => {
    conversationHistory.current = [];
  }, []);

  // Atualizar preferências
  const updatePreferences = useCallback(async (newPreferences: Partial<ChatPreferences>) => {
    if (!isAuthenticated || !user?.uid) return;

    try {
      await chatService.updateUserPreferences(user.uid, newPreferences);
      setPreferences(prev => prev ? { ...prev, ...newPreferences } : null);

      if (enableAnalytics) {
        logEvent('USER', 'preferences_updated', user.uid);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Erro ao atualizar preferências');
      console.error('Erro ao atualizar preferências:', error);
      handleError(error, 'medium');
    }
  }, [isAuthenticated, user?.uid, chatService, enableAnalytics, handleError]);

  // Atualizar analytics
  const refreshAnalytics = useCallback(() => {
    setAnalytics(chatService.getAnalytics());
  }, [chatService]);

  // Exportar conversa
  const exportConversation = useCallback(async (): Promise<string> => {
    const exportData = {
      session: session,
      history: conversationHistory.current,
      preferences: preferences,
      exportDate: new Date().toISOString()
    };

    return JSON.stringify(exportData, null, 2);
  }, [session, preferences]);

  // Importar conversa
  const importConversation = useCallback(async (data: string): Promise<boolean> => {
    try {
      const importData = JSON.parse(data);
      
      // Validação básica
      if (!importData.session || !importData.history) {
        throw new Error('Dados de importação inválidos');
      }

      // Restaurar histórico
      conversationHistory.current = importData.history;
      
      console.log('✅ Conversa importada com sucesso');
      return true;
    } catch (error) {
      console.error('Erro ao importar conversa:', error);
      return false;
    }
  }, []);

  // Cleanup na desmontagem
  useEffect(() => {
    return () => {
      if (session) {
        endSession();
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    // Estado da sessão
    session,
    isSessionActive,
    
    // Estado do chat
    loading,
    error,
    
    // Funcionalidades principais
    startSession,
    endSession,
    sendMessage,
    switchPersona,
    
    // Histórico e navegação
    getHistory,
    clearHistory,
    
    // Preferências do usuário
    preferences,
    updatePreferences,
    
    // Analytics e monitoramento
    analytics,
    systemHealth,
    refreshAnalytics,
    
    // Funcionalidades avançadas
    exportConversation,
    importConversation
  };
}

export default useChatService;