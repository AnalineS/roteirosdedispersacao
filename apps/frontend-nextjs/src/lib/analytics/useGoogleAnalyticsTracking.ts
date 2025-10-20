/**
 * Google Analytics Tracking Hooks
 * Hooks personalizados para tracking de eventos educacionais e UX
 */

'use client';

import { useCallback } from 'react';

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: unknown[];
  }
}

/**
 * Hook principal para tracking com Google Analytics
 * Compatível com @next/third-parties/google
 */
export function useGoogleAnalyticsTracking() {
  /**
   * Envia evento genérico para GA
   */
  const trackEvent = useCallback(
    (
      action: string,
      category: string,
      label?: string,
      value?: number,
      customParameters?: Record<string, any>
    ) => {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', action, {
          event_category: category,
          event_label: label,
          value: value,
          ...customParameters,
        });

        if (process.env.NODE_ENV === 'development') {
          console.log('📊 GA Event:', { action, category, label, value, customParameters });
        }
      }
    },
    []
  );

  /**
   * Tracking de pageview (compatível com App Router)
   */
  const trackPageView = useCallback((page_title: string, page_location?: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
      if (measurementId && measurementId !== 'G-XXXXXXXXXX') {
        window.gtag('config', measurementId, {
          page_title,
          page_location: page_location || window.location.href,
        });
      }
    }
  }, []);

  /**
   * Tracking de interação com elementos da UI
   */
  const trackUserInteraction = useCallback(
    (
      element_type: string,
      element_id?: string,
      persona_id?: string,
      additional_data?: Record<string, any>
    ) => {
      trackEvent('user_interaction', 'ui', element_type, undefined, {
        element_id,
        persona_id,
        ...additional_data,
      });
    },
    [trackEvent]
  );

  /**
   * Tracking de feedback do usuário
   */
  const trackFeedback = useCallback(
    (
      feedback_type: 'quick' | 'detailed',
      rating: number,
      persona_id: string,
      has_comments?: boolean,
      additional_data?: Record<string, any>
    ) => {
      trackEvent('feedback_submitted', 'user_feedback', feedback_type, rating, {
        persona_id,
        has_comments,
        ...additional_data,
      });
    },
    [trackEvent]
  );

  /**
   * Tracking de interação com personas (Dr. Gasnelio / Gá)
   */
  const trackPersonaInteraction = useCallback(
    (
      interaction_type: string,
      persona_id: string,
      question_type?: string,
      additional_data?: Record<string, any>
    ) => {
      trackEvent(interaction_type, 'persona_interaction', persona_id, undefined, {
        question_type,
        ...additional_data,
      });
    },
    [trackEvent]
  );

  /**
   * Tracking de erros
   */
  const trackError = useCallback(
    (
      error_type: string,
      error_message: string,
      component?: string,
      additional_data?: Record<string, any>
    ) => {
      trackEvent('error_occurred', 'error', error_type, undefined, {
        error_message: error_message.substring(0, 100), // Limitar tamanho
        component,
        ...additional_data,
      });
    },
    [trackEvent]
  );

  /**
   * Tracking de busca
   */
  const trackSearch = useCallback(
    (search_term: string, results_count: number, search_type: string = 'general') => {
      trackEvent('search', 'content', search_type, results_count, {
        search_term: search_term.substring(0, 50), // Limitar para privacidade
      });
    },
    [trackEvent]
  );

  /**
   * Tracking de conteúdo educacional
   */
  const trackEducationalContent = useCallback(
    (
      content_type: string,
      content_id: string,
      engagement_time?: number,
      completion_percentage?: number
    ) => {
      trackEvent('educational_interaction', 'learning', content_type, engagement_time, {
        content_id,
        completion_percentage,
      });
    },
    [trackEvent]
  );

  /**
   * Verifica se GA está carregado
   */
  const isLoaded = typeof window !== 'undefined' && !!window.gtag;

  return {
    trackEvent,
    trackPageView,
    trackUserInteraction,
    trackFeedback,
    trackPersonaInteraction,
    trackError,
    trackSearch,
    trackEducationalContent,
    isLoaded,
  };
}

/**
 * Hook para configuração LGPD-compliant do Google Analytics
 * Aplica configurações personalizadas após carregamento do script
 */
export function useGALGPDConfig() {
  const applyLGPDConfig = useCallback(() => {
    if (typeof window !== 'undefined' && window.gtag) {
      const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

      if (measurementId && measurementId !== 'G-XXXXXXXXXX') {
        window.gtag('config', measurementId, {
          anonymize_ip: true,
          allow_google_signals: false,
          allow_ad_personalization_signals: false,
          cookie_expires: 63072000, // 2 anos
          force_ssl: true,
          custom_map: {
            dimension1: 'project_type',
            dimension2: 'content_category',
            dimension3: 'target_audience',
          },
        });

        // Enviar parâmetros custom como evento
        window.gtag('event', 'config_lgpd', {
          project_type: 'educational',
          content_category: 'health_education',
          target_audience: 'healthcare_professionals',
          thesis_project: true,
          data_protection_compliant: true,
          lgpd_compliant: true,
        });

        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Google Analytics LGPD config applied');
        }
      }
    }
  }, []);

  return { applyLGPDConfig };
}
