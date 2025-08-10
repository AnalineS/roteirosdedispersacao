import { useState, useCallback } from 'react';
import { apiClient } from '@/services/api';

export interface FeedbackData {
  messageId: string;
  personaId: string;
  question: string;
  response: string;
  rating: number;
  comments?: string;
  timestamp: number;
}

export interface FeedbackResponse {
  message: string;
  request_id: string;
  timestamp: string;
  feedback_summary: {
    rating: number;
    has_comments: boolean;
  };
}

export interface FeedbackStats {
  totalFeedbacks: number;
  averageRating: number;
  ratingsDistribution: Record<number, number>;
  recentFeedbacks: Array<{
    rating: number;
    timestamp: string;
    personaId: string;
    hasComments: boolean;
  }>;
}

interface UseFeedbackOptions {
  onSuccess?: (response: FeedbackResponse) => void;
  onError?: (error: Error) => void;
  enableOfflineQueue?: boolean;
  retryAttempts?: number;
}

export function useFeedback(options: UseFeedbackOptions = {}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [lastSubmittedFeedback, setLastSubmittedFeedback] = useState<FeedbackResponse | null>(null);

  // Queue para feedbacks offline
  const [offlineQueue, setOfflineQueue] = useState<FeedbackData[]>([]);

  const {
    onSuccess,
    onError,
    enableOfflineQueue = true,
    retryAttempts = 3
  } = options;

  // Submeter feedback
  const submitFeedback = useCallback(async (feedbackData: FeedbackData): Promise<FeedbackResponse> => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Validar dados localmente
      if (!feedbackData.messageId || !feedbackData.personaId) {
        throw new Error('messageId e personaId são obrigatórios');
      }

      if (!feedbackData.question || !feedbackData.response) {
        throw new Error('question e response são obrigatórios');
      }

      if (feedbackData.rating < 1 || feedbackData.rating > 5) {
        throw new Error('rating deve ser entre 1 e 5');
      }

      // Preparar dados para a API
      const apiData = {
        question: feedbackData.question,
        response: feedbackData.response,
        rating: feedbackData.rating,
        comments: feedbackData.comments || ''
      };

      let lastError: Error | null = null;

      // Tentativas com retry
      for (let attempt = 1; attempt <= retryAttempts; attempt++) {
        try {
          const response = await apiClient.post<FeedbackResponse>('/api/feedback', apiData);
          
          setLastSubmittedFeedback(response);
          onSuccess?.(response);

          // Processar queue offline se bem-sucedido
          if (offlineQueue.length > 0) {
            processOfflineQueue();
          }

          // Analytics tracking
          trackFeedbackSubmission(feedbackData, response);

          return response;

        } catch (attemptError: any) {
          lastError = attemptError;
          
          if (attempt < retryAttempts) {
            // Exponential backoff
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      // Se chegou aqui, todos os attempts falharam
      throw lastError;

    } catch (submitError: any) {
      const errorMessage = submitError?.message || 'Erro ao enviar feedback';
      setError(errorMessage);

      // Adicionar à queue offline se habilitado
      if (enableOfflineQueue && !navigator.onLine) {
        addToOfflineQueue(feedbackData);
        console.log('Feedback adicionado à queue offline');
      } else {
        onError?.(submitError);
      }

      throw submitError;

    } finally {
      setIsSubmitting(false);
    }
  }, [offlineQueue, onSuccess, onError, enableOfflineQueue, retryAttempts]);

  // Adicionar à queue offline
  const addToOfflineQueue = useCallback((feedbackData: FeedbackData) => {
    setOfflineQueue(prev => {
      const newQueue = [...prev, feedbackData];
      
      // Salvar no localStorage
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('feedback_offline_queue', JSON.stringify(newQueue));
        } catch (e) {
          console.warn('Erro ao salvar queue offline no localStorage:', e);
        }
      }
      
      return newQueue;
    });
  }, []);

  // Processar queue offline
  const processOfflineQueue = useCallback(async () => {
    if (offlineQueue.length === 0 || !navigator.onLine) {
      return;
    }

    const queue = [...offlineQueue];
    setOfflineQueue([]);

    for (const feedbackData of queue) {
      try {
        await submitFeedback(feedbackData);
        console.log('Feedback offline enviado com sucesso:', feedbackData.messageId);
      } catch (error) {
        console.error('Erro ao enviar feedback offline:', error);
        // Recolocar na queue se falhar
        addToOfflineQueue(feedbackData);
      }
    }

    // Limpar localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('feedback_offline_queue');
      } catch (e) {
        console.warn('Erro ao limpar queue offline do localStorage:', e);
      }
    }
  }, [offlineQueue, submitFeedback, addToOfflineQueue]);

  // Carregar queue offline do localStorage
  const loadOfflineQueue = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      const saved = localStorage.getItem('feedback_offline_queue');
      if (saved) {
        const queue: FeedbackData[] = JSON.parse(saved);
        setOfflineQueue(queue);
      }
    } catch (e) {
      console.warn('Erro ao carregar queue offline do localStorage:', e);
    }
  }, []);

  // Buscar estatísticas de feedback
  const fetchStats = useCallback(async (): Promise<FeedbackStats | null> => {
    try {
      // Esta seria uma chamada para um endpoint de stats específico para feedback
      // Por ora, vamos retornar dados mockados ou calcular baseado no que temos
      
      const mockStats: FeedbackStats = {
        totalFeedbacks: 0,
        averageRating: 0,
        ratingsDistribution: {},
        recentFeedbacks: []
      };

      setStats(mockStats);
      return mockStats;

    } catch (error) {
      console.error('Erro ao buscar estatísticas de feedback:', error);
      return null;
    }
  }, []);

  // Analytics tracking
  const trackFeedbackSubmission = useCallback((
    feedbackData: FeedbackData, 
    response: FeedbackResponse
  ) => {
    if (typeof window === 'undefined' || !(window as any).gtag) return;

    try {
      (window as any).gtag('event', 'feedback_submitted', {
        event_category: 'user_feedback',
        event_label: feedbackData.personaId,
        value: feedbackData.rating,
        custom_parameters: {
          message_id: feedbackData.messageId,
          persona_id: feedbackData.personaId,
          has_comments: !!feedbackData.comments,
          request_id: response.request_id,
          rating: feedbackData.rating
        }
      });

      // Evento específico para ratings baixos (para análise)
      if (feedbackData.rating <= 2) {
        (window as any).gtag('event', 'low_rating_feedback', {
          event_category: 'quality_monitoring',
          event_label: feedbackData.personaId,
          value: feedbackData.rating,
          custom_parameters: {
            message_id: feedbackData.messageId,
            has_comments: !!feedbackData.comments
          }
        });
      }

    } catch (analyticsError) {
      console.warn('Erro no tracking de analytics:', analyticsError);
    }
  }, []);

  // Limpar erro
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Resetar estado
  const reset = useCallback(() => {
    setError(null);
    setIsSubmitting(false);
    setLastSubmittedFeedback(null);
  }, []);

  return {
    // Estado
    isSubmitting,
    error,
    stats,
    lastSubmittedFeedback,
    offlineQueue: offlineQueue.length,
    hasOfflineQueue: offlineQueue.length > 0,

    // Ações
    submitFeedback,
    processOfflineQueue,
    loadOfflineQueue,
    fetchStats,
    clearError,
    reset,

    // Utilities
    isOnline: typeof window !== 'undefined' ? navigator.onLine : true
  };
}

// Hook para estatísticas globais de feedback (opcional)
export function useFeedbackStats() {
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Aqui poderia ser uma chamada específica para stats de feedback
      // Por ora, usar o endpoint de stats geral
      const response = await apiClient.get<any>('/api/stats');
      
      // Extrair dados de feedback se disponível
      const mockStats: FeedbackStats = {
        totalFeedbacks: response.rag?.feedback_count || 0,
        averageRating: response.rag?.average_rating || 0,
        ratingsDistribution: response.rag?.ratings_distribution || {},
        recentFeedbacks: response.rag?.recent_feedbacks || []
      };

      setStats(mockStats);

    } catch (fetchError: any) {
      setError(fetchError?.message || 'Erro ao buscar estatísticas');
      console.error('Erro ao buscar stats de feedback:', fetchError);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    stats,
    loading,
    error,
    fetchStats,
    refetch: fetchStats
  };
}