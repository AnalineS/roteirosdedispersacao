'use client';

import { useState, useEffect, useCallback } from 'react';
import UserTrackingService, { 
  type UserSession, 
  type UserInteraction, 
  type UserPreferences,
  type InteractionType 
} from '@/services/UserTrackingService';
import { useGoogleAnalytics } from '@/components/GoogleAnalytics';

// ============================================
// HOOK INTEGRADO DE TRACKING 
// ============================================

export interface IntegratedTrackingConfig {
  enableGoogleAnalytics?: boolean;
  enableLocalTracking?: boolean;
  syncWithGA?: boolean;
  userId?: string;
}

export const useIntegratedTracking = (config: IntegratedTrackingConfig = {}) => {
  const {
    enableGoogleAnalytics = true,
    enableLocalTracking = true,
    syncWithGA = true,
    userId
  } = config;

  const [sessionId, setSessionId] = useState<string>('');
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [isInitialized, setIsInitialized] = useState(false);

  const trackingService = UserTrackingService.getInstance();
  const googleAnalytics = useGoogleAnalytics();

  // ============================================
  // INICIALIZAÇÃO
  // ============================================

  useEffect(() => {
    if (!isInitialized) {
      const newSessionId = trackingService.startSession(userId);
      setSessionId(newSessionId);
      setCurrentUserId(userId || '');
      setIsInitialized(true);

      // Sync with Google Analytics
      if (enableGoogleAnalytics && syncWithGA && googleAnalytics.isLoaded) {
        googleAnalytics.trackEvent('session_start', 'user_session', 'integrated_tracking', undefined, {
          session_id: newSessionId,
          user_id: currentUserId,
          tracking_method: 'integrated'
        });
      }
    }

    return () => {
      if (sessionId) {
        trackingService.endSession(sessionId);
        
        if (enableGoogleAnalytics && syncWithGA && googleAnalytics.isLoaded) {
          googleAnalytics.trackEvent('session_end', 'user_session', 'integrated_tracking', undefined, {
            session_id: sessionId
          });
        }
      }
    };
  }, [userId, isInitialized]);

  // ============================================
  // TRACKING DE INTERAÇÕES
  // ============================================

  const trackInteraction = useCallback((
    type: InteractionType,
    element: string,
    metadata: Record<string, string | number | boolean> = {}
  ) => {
    if (!isInitialized) return;

    // Local tracking
    if (enableLocalTracking) {
      trackingService.trackInteraction(currentUserId, {
        type,
        element,
        timestamp: Date.now(),
        metadata,
        sessionId
      });
    }

    // Google Analytics tracking
    if (enableGoogleAnalytics && googleAnalytics.isLoaded) {
      const gaCategory = getGACategoryFromType(type);
      googleAnalytics.trackEvent(type, gaCategory, element, undefined, {
        user_id: currentUserId,
        session_id: sessionId,
        ...metadata
      });
    }
  }, [currentUserId, sessionId, isInitialized, enableLocalTracking, enableGoogleAnalytics]);

  const trackPageView = useCallback((page: string, title?: string) => {
    if (!isInitialized) return;

    // Local tracking
    if (enableLocalTracking) {
      trackingService.trackPageView(currentUserId, page, sessionId);
    }

    // Google Analytics tracking
    if (enableGoogleAnalytics && googleAnalytics.isLoaded) {
      googleAnalytics.trackPageView(title || document.title, page);
    }
  }, [currentUserId, sessionId, isInitialized]);

  const trackModuleProgress = useCallback((
    module: string,
    step: string,
    completionRate: number,
    timeSpent?: number
  ) => {
    if (!isInitialized) return;

    // Local tracking
    if (enableLocalTracking) {
      trackingService.trackUserJourney(currentUserId, step, module, completionRate);
    }

    // Google Analytics tracking
    if (enableGoogleAnalytics && googleAnalytics.isLoaded) {
      googleAnalytics.trackEducationalContent('module', module, timeSpent, completionRate * 100);
      
      if (completionRate >= 1) {
        googleAnalytics.trackEvent('module_completed', 'learning', module, timeSpent, {
          user_id: currentUserId,
          session_id: sessionId,
          completion_rate: completionRate
        });
      }
    }
  }, [currentUserId, sessionId, isInitialized]);

  const trackChatInteraction = useCallback((
    chatType: 'persona' | 'general',
    message: string,
    responseTime?: number,
    persona?: string
  ) => {
    if (!isInitialized) return;

    const interactionData = {
      chat_type: chatType,
      message_length: message.length,
      response_time: responseTime,
      persona,
      has_response: !!responseTime
    };

    // Local tracking
    if (enableLocalTracking) {
      trackingService.trackInteraction(currentUserId, {
        type: 'chat_interaction',
        element: `chat_${chatType}`,
        timestamp: Date.now(),
        metadata: interactionData,
        sessionId
      });
    }

    // Google Analytics tracking
    if (enableGoogleAnalytics && googleAnalytics.isLoaded) {
      if (persona) {
        googleAnalytics.trackPersonaInteraction('chat_message', persona, 'user_question', interactionData);
      } else {
        googleAnalytics.trackEvent('chat_interaction', 'communication', chatType, responseTime, interactionData);
      }
    }
  }, [currentUserId, sessionId, isInitialized]);

  const trackError = useCallback((
    errorType: string,
    errorMessage: string,
    component?: string,
    stack?: string
  ) => {
    if (!isInitialized) return;

    const errorData = {
      error_type: errorType,
      component,
      stack: stack?.substring(0, 500), // Limitar tamanho
      timestamp: Date.now()
    };

    // Local tracking
    if (enableLocalTracking) {
      trackingService.trackInteraction(currentUserId, {
        type: 'click',
        element: 'error_occurred',
        timestamp: Date.now(),
        metadata: errorData,
        sessionId
      });
    }

    // Google Analytics tracking
    if (enableGoogleAnalytics && googleAnalytics.isLoaded) {
      googleAnalytics.trackError(errorType, errorMessage, component, errorData);
    }
  }, [currentUserId, sessionId, isInitialized]);

  const trackFeedback = useCallback((
    type: 'quick' | 'detailed',
    rating: number,
    comments?: string,
    persona?: string
  ) => {
    if (!isInitialized) return;

    const feedbackData = {
      rating,
      has_comments: !!comments,
      comment_length: comments?.length || 0,
      persona
    };

    // Local tracking
    if (enableLocalTracking) {
      trackingService.trackInteraction(currentUserId, {
        type: 'form_submit',
        element: `feedback_${type}`,
        timestamp: Date.now(),
        metadata: feedbackData,
        sessionId
      });
    }

    // Google Analytics tracking
    if (enableGoogleAnalytics && googleAnalytics.isLoaded) {
      googleAnalytics.trackFeedback(type, rating, persona || 'general', !!comments, feedbackData);
    }
  }, [currentUserId, sessionId, isInitialized]);

  const trackSearch = useCallback((
    searchTerm: string,
    resultsCount: number,
    searchType: string = 'general'
  ) => {
    if (!isInitialized) return;

    const searchData = {
      search_term: searchTerm.substring(0, 50), // Privacidade
      results_count: resultsCount,
      search_type: searchType
    };

    // Local tracking
    if (enableLocalTracking) {
      trackingService.trackInteraction(currentUserId, {
        type: 'search',
        element: `search_${searchType}`,
        timestamp: Date.now(),
        metadata: searchData,
        sessionId
      });
    }

    // Google Analytics tracking
    if (enableGoogleAnalytics && googleAnalytics.isLoaded) {
      googleAnalytics.trackSearch(searchTerm, resultsCount, searchType);
    }
  }, [currentUserId, sessionId, isInitialized]);

  // ============================================
  // GESTÃO DE PREFERÊNCIAS
  // ============================================

  const updatePreferences = useCallback((preferences: Partial<UserPreferences>) => {
    if (!isInitialized) return;

    // Local tracking
    if (enableLocalTracking) {
      trackingService.updateUserPreferences(currentUserId, preferences);
    }

    // Google Analytics tracking
    if (enableGoogleAnalytics && googleAnalytics.isLoaded) {
      googleAnalytics.trackEvent('preferences_updated', 'user_settings', 'profile_update', undefined, {
        user_id: currentUserId,
        updated_fields: Object.keys(preferences),
        preferences_count: Object.keys(preferences).length
      });
    }
  }, [currentUserId, isInitialized]);

  // ============================================
  // DADOS E MÉTRICAS
  // ============================================

  const getLocalAnalytics = useCallback(() => {
    if (!enableLocalTracking) return null;
    return trackingService.getAnalytics();
  }, [enableLocalTracking]);

  const getUserProgress = useCallback(() => {
    if (!enableLocalTracking) return null;
    return trackingService.getUserProgress(currentUserId);
  }, [currentUserId, enableLocalTracking]);

  const getHeatmapData = useCallback(() => {
    if (!enableLocalTracking) return {};
    return trackingService.getHeatmapData();
  }, [enableLocalTracking]);

  // ============================================
  // UTILITÁRIOS
  // ============================================

  const getGACategoryFromType = (type: InteractionType): string => {
    const categoryMap: Record<InteractionType, string> = {
      'click': 'ui_interaction',
      'scroll': 'ui_interaction', 
      'hover': 'ui_interaction',
      'focus': 'ui_interaction',
      'form_submit': 'form_interaction',
      'navigation': 'navigation',
      'search': 'search',
      'download': 'content',
      'chat_interaction': 'communication',
      'module_start': 'learning',
      'module_complete': 'learning'
    };
    
    return categoryMap[type] || 'general';
  };

  // ============================================
  // RETORNO DO HOOK
  // ============================================

  return {
    // Estado
    sessionId,
    userId: currentUserId,
    isInitialized,
    
    // Tracking functions
    trackInteraction,
    trackPageView,
    trackModuleProgress,
    trackChatInteraction,
    trackError,
    trackFeedback,
    trackSearch,
    
    // Preferências
    updatePreferences,
    
    // Analytics
    getLocalAnalytics,
    getUserProgress,
    getHeatmapData,
    
    // Status
    googleAnalyticsLoaded: googleAnalytics.isLoaded,
    localTrackingEnabled: enableLocalTracking
  };
};

// ============================================
// HOOK SIMPLIFICADO PARA USO COMUM
// ============================================

export const useSimpleTracking = (userId?: string) => {
  const tracking = useIntegratedTracking({ userId });
  
  return {
    track: tracking.trackInteraction,
    trackPage: tracking.trackPageView,
    trackModule: tracking.trackModuleProgress,
    trackChat: tracking.trackChatInteraction,
    trackError: tracking.trackError
  };
};