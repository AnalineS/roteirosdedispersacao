'use client';

import Script from 'next/script';
import { useEffect } from 'react';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

interface GoogleAnalyticsProps {
  GA_MEASUREMENT_ID?: string;
}

export default function GoogleAnalytics({ 
  GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || ''
}: GoogleAnalyticsProps) {
  
  useEffect(() => {
    // Configurar dataLayer se não existir
    if (typeof window !== 'undefined' && !window.dataLayer) {
      window.dataLayer = [];
    }

    // Função gtag helper
    if (typeof window !== 'undefined' && !window.gtag) {
      window.gtag = function gtag() {
        window.dataLayer?.push(arguments);
      };
    }

    // Configuração inicial quando o script carregar
    if (typeof window !== 'undefined' && GA_MEASUREMENT_ID && window.gtag) {
      window.gtag('js', new Date());
      window.gtag('config', GA_MEASUREMENT_ID, {
        page_title: document.title,
        page_location: window.location.href,
        // Configurações LGPD-compliant
        anonymize_ip: true,
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
        cookie_expires: 63072000, // 2 anos (padrão educacional)
        force_ssl: true,
        // Configurações do projeto educacional
        custom_parameters: {
          project_type: 'educational',
          content_category: 'health_education',
          target_audience: 'healthcare_professionals',
          thesis_project: true,
          data_protection_compliant: true,
          lgpd_compliant: true
        }
      });

      // Debug logs para desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        console.log('Google Analytics configurado:', GA_MEASUREMENT_ID);
      }
    }
  }, [GA_MEASUREMENT_ID]);

  // Não carregar em desenvolvimento ou se não tiver ID configurado
  if (process.env.NODE_ENV !== 'production' || !GA_MEASUREMENT_ID) {
    return null;
  }

  return (
    <>
      {/* Google Analytics Script */}
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      
      <Script
        id="google-analytics-config"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
              page_title: document.title,
              page_location: window.location.href,
              anonymize_ip: true,
              allow_google_signals: false,
              allow_ad_personalization_signals: false,
              cookie_expires: 63072000,
              force_ssl: true,
              custom_parameters: {
                project_type: 'educational',
                content_category: 'health_education',
                target_audience: 'healthcare_professionals',
                thesis_project: true,
                data_protection_compliant: true,
                lgpd_compliant: true
              }
            });
          `
        }}
      />
    </>
  );
}

// Hook para tracking de eventos personalizados
export function useGoogleAnalytics() {
  const trackEvent = (
    action: string,
    category: string,
    label?: string,
    value?: number,
    customParameters?: Record<string, unknown>
  ) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', action, {
        event_category: category,
        event_label: label,
        value: value,
        ...customParameters
      });
      
      if (process.env.NODE_ENV === 'development') {
        console.log('GA Event:', { action, category, label, value, customParameters });
      }
    }
  };

  const trackPageView = (page_title: string, page_location?: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID, {
        page_title,
        page_location: page_location || window.location.href,
      });
    }
  };

  const trackUserInteraction = (
    element_type: string,
    element_id?: string,
    persona_id?: string,
    additional_data?: Record<string, unknown>
  ) => {
    trackEvent('user_interaction', 'ui', element_type, undefined, {
      element_id,
      persona_id,
      ...additional_data
    });
  };

  const trackFeedback = (
    feedback_type: 'quick' | 'detailed',
    rating: number,
    persona_id: string,
    has_comments?: boolean,
    additional_data?: Record<string, unknown>
  ) => {
    trackEvent('feedback_submitted', 'user_feedback', feedback_type, rating, {
      persona_id,
      has_comments,
      ...additional_data
    });
  };

  const trackPersonaInteraction = (
    interaction_type: string,
    persona_id: string,
    question_type?: string,
    additional_data?: Record<string, unknown>
  ) => {
    trackEvent(interaction_type, 'persona_interaction', persona_id, undefined, {
      question_type,
      ...additional_data
    });
  };

  const trackError = (
    error_type: string,
    error_message: string,
    component?: string,
    additional_data?: Record<string, unknown>
  ) => {
    trackEvent('error_occurred', 'error', error_type, undefined, {
      error_message: error_message.substring(0, 100), // Limitar tamanho
      component,
      ...additional_data
    });
  };

  const trackSearch = (
    search_term: string,
    results_count: number,
    search_type: string = 'general'
  ) => {
    trackEvent('search', 'content', search_type, results_count, {
      search_term: search_term.substring(0, 50) // Limitar para privacidade
    });
  };

  const trackEducationalContent = (
    content_type: string,
    content_id: string,
    engagement_time?: number,
    completion_percentage?: number
  ) => {
    trackEvent('educational_interaction', 'learning', content_type, engagement_time, {
      content_id,
      completion_percentage
    });
  };

  return {
    trackEvent,
    trackPageView,
    trackUserInteraction,
    trackFeedback,
    trackPersonaInteraction,
    trackError,
    trackSearch,
    trackEducationalContent,
    // Verificar se GA está carregado
    isLoaded: typeof window !== 'undefined' && !!window.gtag
  };
}