import { useState, useCallback } from 'react';
import { safeLocalStorage, isClientSide } from '@/hooks/useClientStorage';
import { apiClient } from '@/services/api';
import type { FeedbackData } from '@/types/feedback';

// Import unified analytics types
import '@/types/analytics';
// WindowWithGtag imported via global types

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
          const response = await apiClient.post<FeedbackResponse>('/api/v1/feedback', apiData);
          
          setLastSubmittedFeedback(response);
          onSuccess?.(response);

          // Processar queue offline se bem-sucedido
          if (offlineQueue.length > 0) {
            processOfflineQueue();
          }

          // Analytics tracking
          trackFeedbackSubmission(feedbackData, response);

          return response;

        } catch (attemptError: Error | unknown) {
          lastError = attemptError instanceof Error ? attemptError : new Error(String(attemptError));
          
          if (attempt < retryAttempts) {
            // Exponential backoff
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      // Se chegou aqui, todos os attempts falharam
      throw lastError;

    } catch (submitError: Error | unknown) {
      const errorMessage = submitError instanceof Error ? submitError.message : 'Erro ao enviar feedback';
      setError(errorMessage);

      // Adicionar à queue offline se habilitado
      if (enableOfflineQueue && !navigator.onLine) {
        addToOfflineQueue(feedbackData);
        // Feedback adicionado à queue offline
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'feedback_offline_queued', {
            event_category: 'medical_feedback',
            event_label: 'offline_queue_add',
            custom_parameters: {
              feedback_context: 'offline_storage',
              queue_action: 'add_to_queue'
            }
          });
        }
      } else {
        onError?.(submitError instanceof Error ? submitError : new Error(String(submitError)));
      }

      throw submitError;

    } finally {
      setIsSubmitting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offlineQueue, onSuccess, onError, enableOfflineQueue, retryAttempts]);

  // Adicionar à queue offline
  const addToOfflineQueue = useCallback((feedbackData: FeedbackData) => {
    setOfflineQueue(prev => {
      const newQueue = [...prev, feedbackData];
      
      // Salvar no localStorage
      if (typeof window !== 'undefined') {
        try {
          safeLocalStorage()?.setItem('feedback_offline_queue', JSON.stringify(newQueue));
        } catch (e) {
          // Erro ao salvar queue offline no localStorage
          if (typeof process !== 'undefined' && process.stderr) {
            process.stderr.write(`⚠️ AVISO - Falha ao salvar queue offline no localStorage: ${e}\n`);
          }
          if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'feedback_offline_save_error', {
              event_category: 'medical_feedback_error',
              event_label: 'localStorage_save_failed',
              custom_parameters: {
                error_context: 'offline_queue_storage',
                error_type: 'localStorage_write_failure'
              }
            });
          }
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
        // Feedback offline enviado com sucesso
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'feedback_offline_sent', {
            event_category: 'medical_feedback',
            event_label: 'offline_queue_success',
            custom_parameters: {
              message_id: feedbackData.messageId,
              feedback_context: 'offline_queue_processing'
            }
          });
        }
      } catch (error) {
        // Erro ao enviar feedback offline
        if (typeof process !== 'undefined' && process.stderr) {
          process.stderr.write(`❌ ERRO - Falha ao enviar feedback offline: ${error}\n`);
        }
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'feedback_offline_send_error', {
            event_category: 'medical_feedback_error',
            event_label: 'offline_send_failed',
            custom_parameters: {
              error_context: 'offline_queue_processing',
              error_message: String(error)
            }
          });
        }
        // Recolocar na queue se falhar
        addToOfflineQueue(feedbackData);
      }
    }

    // Limpar localStorage
    if (typeof window !== 'undefined') {
      try {
        safeLocalStorage()?.removeItem('feedback_offline_queue');
      } catch (e) {
        // Erro ao limpar queue offline do localStorage
        if (typeof process !== 'undefined' && process.stderr) {
          process.stderr.write(`⚠️ AVISO - Falha ao limpar queue offline do localStorage: ${e}\n`);
        }
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'feedback_offline_clear_error', {
            event_category: 'medical_feedback_error',
            event_label: 'localStorage_clear_failed',
            custom_parameters: {
              error_context: 'offline_queue_cleanup',
              error_type: 'localStorage_clear_failure'
            }
          });
        }
      }
    }
  }, [offlineQueue, submitFeedback, addToOfflineQueue]);

  // Carregar queue offline do localStorage
  const loadOfflineQueue = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      const saved = safeLocalStorage()?.getItem('feedback_offline_queue');
      if (saved) {
        const queue: FeedbackData[] = JSON.parse(saved);
        setOfflineQueue(queue);
      }
    } catch (e) {
      // Erro ao carregar queue offline do localStorage
      if (typeof process !== 'undefined' && process.stderr) {
        process.stderr.write(`⚠️ AVISO - Falha ao carregar queue offline do localStorage: ${e}\n`);
      }
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'feedback_offline_load_error', {
          event_category: 'medical_feedback_error',
          event_label: 'localStorage_load_failed',
          custom_parameters: {
            error_context: 'offline_queue_initialization',
            error_type: 'localStorage_read_failure'
          }
        });
      }
    }
  }, []);

  // Buscar estatísticas de feedback do backend real
  const fetchStats = useCallback(async (): Promise<FeedbackStats | null> => {
    try {
      const response = await fetch('/api/v1/feedback/stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Estrutura real do backend: { general: {...}, by_persona: {...}, recent_feedbacks: [...] }
      if (data.general) {
        const realStats: FeedbackStats = {
          totalFeedbacks: data.general.total_count || 0,
          averageRating: data.general.average_rating || 0,
          ratingsDistribution: data.general.rating_distribution || {},
          recentFeedbacks: (data.recent_feedbacks || []).map((feedback: any) => ({
            rating: feedback.rating,
            timestamp: feedback.created_at,
            personaId: feedback.persona_id || 'unknown',
            hasComments: feedback.has_comments || false
          }))
        };

        setStats(realStats);
        return realStats;
      } else {
        throw new Error(data.error || 'Invalid response format');
      }

    } catch (error) {
      // Erro ao buscar estatísticas de feedback
      if (typeof process !== 'undefined' && process.stderr) {
        process.stderr.write(`❌ ERRO - Falha ao buscar estatísticas de feedback: ${error}\n`);
      }
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'feedback_stats_fetch_error', {
          event_category: 'medical_feedback_error',
          event_label: 'stats_fetch_failed',
          custom_parameters: {
            error_context: 'feedback_statistics',
            error_message: String(error)
          }
        });
      }
      return null;
    }
  }, []);

  // Analytics tracking
  const trackFeedbackSubmission = useCallback((
    feedbackData: FeedbackData, 
    response: FeedbackResponse
  ) => {
    if (typeof window === 'undefined' || !window.gtag) return;

    try {
      window.gtag!('event', 'feedback_submitted', {
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
        window.gtag!('event', 'low_rating_feedback', {
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
      // Erro no tracking de analytics
      if (typeof process !== 'undefined' && process.stderr) {
        process.stderr.write(`⚠️ AVISO - Falha no tracking de analytics: ${analyticsError}\n`);
      }
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'feedback_analytics_tracking_error', {
          event_category: 'medical_feedback_error',
          event_label: 'analytics_tracking_failed',
          custom_parameters: {
            error_context: 'analytics_tracking',
            error_type: 'gtag_tracking_failure'
          }
        });
      }
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

// Hook para estatísticas globais de feedback (usando backend real)
export function useFeedbackStats() {
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/feedback/stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Usar estrutura real do backend
      if (data.general) {
        const realStats: FeedbackStats = {
          totalFeedbacks: data.general.total_count || 0,
          averageRating: data.general.average_rating || 0,
          ratingsDistribution: data.general.rating_distribution || {},
          recentFeedbacks: (data.recent_feedbacks || []).map((feedback: any) => ({
            rating: feedback.rating,
            timestamp: feedback.created_at,
            personaId: feedback.persona_id || 'unknown',
            hasComments: feedback.has_comments || false
          }))
        };

        setStats(realStats);
      } else {
        throw new Error(data.error || 'Invalid response format');
      }

    } catch (fetchError: Error | unknown) {
      setError(fetchError instanceof Error ? fetchError.message : 'Erro ao buscar estatísticas');
      // Erro ao buscar stats de feedback
      if (typeof process !== 'undefined' && process.stderr) {
        process.stderr.write(`❌ ERRO - Falha ao buscar stats de feedback: ${fetchError}\n`);
      }
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'feedback_stats_error', {
          event_category: 'medical_feedback_error',
          event_label: 'stats_fetch_failed',
          custom_parameters: {
            error_context: 'feedback_stats_api',
            error_message: String(fetchError)
          }
        });
      }
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