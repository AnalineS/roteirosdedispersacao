/**
 * Google Analytics Setup Component
 * Integra seu Google Analytics com UX tracking
 * Parte da ETAPA 1: Auditoria UX Baseada em Dados
 */

'use client';

import { useAsyncEffect, useOptimizedEffect } from '@/hooks/useEffectOptimizer';
import Script from 'next/script';
import { WindowWithGtag, OnboardingEventData } from '@/types/analytics';

// Using WindowWithGtag from types/analytics

// Helper para acessar gtag de forma type-safe
function getWindowWithGtag(): WindowWithGtag | null {
  return typeof window !== 'undefined' ? (window as WindowWithGtag) : null;
}

// Simulação do googleAnalyticsUX para evitar import error
const googleAnalyticsUX = {
  startUXAudit: () => {
    // UX audit implementation
  }
};


interface UXEventParameters {
  [key: string]: string | number | boolean;
}

// Tipos específicos para UX Google Analytics
interface UXGtagEventParameters {
  event_category?: string;
  event_label?: string;
  value?: number;
  custom_parameters?: {
    medical_context?: string;
    tracking_enabled?: boolean;
    measurement_id?: string;
    audit_version?: string;
    current_ux_score?: number;
    target_ux_score?: number;
    page_url?: string;
    ux_cognitive_load_score?: number;
    context?: string;
    is_critical?: string;
    issue_type?: string;
    severity?: number;
    device_width?: number;
    device_height?: number;
    ux_onboarding_step?: number;
    action?: string;
    [key: string]: string | number | boolean | undefined;
  };
}

interface UXGtagConfigParameters {
  enhanced_measurement_settings?: {
    scroll_events?: boolean;
    outbound_clicks?: boolean;
    site_search?: boolean;
    video_engagement?: boolean;
    file_downloads?: boolean;
    page_changes?: boolean;
  };
  custom_map?: {
    custom_parameter_1?: string;
    custom_parameter_2?: string;
    custom_parameter_3?: string;
    custom_parameter_4?: string;
    custom_parameter_5?: string;
    custom_parameter_6?: string;
    custom_parameter_7?: string;
    custom_parameter_8?: string;
  };
}

// Removido declare global conflitante - usando WindowWithGtag interface

interface GoogleAnalyticsSetupProps {
  enableUXTracking?: boolean;
}

export function GoogleAnalyticsSetup({ 
  enableUXTracking = true 
}: GoogleAnalyticsSetupProps) {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  
  useAsyncEffect(async () => {
    // Aguardar GA carregar e então iniciar UX tracking - otimizado
    if (enableUXTracking && typeof window !== 'undefined') {
      const checkGtag = () => {
        const windowWithGtag = getWindowWithGtag();
        if (windowWithGtag?.gtag) {
          windowWithGtag.gtag('event', 'analytics_system_loaded', {
            event_category: 'medical_analytics_initialization',
            event_label: 'google_analytics_ux_tracking_started',
            custom_parameters: {
              medical_context: 'analytics_setup_system',
              tracking_enabled: enableUXTracking,
              measurement_id: measurementId
            }
          });
          googleAnalyticsUX.startUXAudit();
          
          // Configurar dimensões customizadas para UX
          if (measurementId) {
            windowWithGtag.gtag('config', measurementId, {
            // Configurar enhanced measurement
            enhanced_measurement_settings: {
              scroll_events: true,
              outbound_clicks: true,
              site_search: true,
              video_engagement: true,
              file_downloads: true
            },
            // Custom parameters para UX
            custom_map: {
              'custom_parameter_1': 'ux_cognitive_load_score',
              'custom_parameter_2': 'ux_mobile_score', 
              'custom_parameter_3': 'ux_onboarding_step',
              'custom_parameter_4': 'ux_device_category',
              'custom_parameter_5': 'ux_page_complexity'
            }
            });
          }

          // Track initial page como baseline UX
          windowWithGtag.gtag('event', 'ux_audit_start', {
            event_category: 'ux_analysis',
            custom_parameters: {
              audit_version: '1.0',
              current_ux_score: 74,
              target_ux_score: 90,
              page_url: window.location.href
            }
          });

        } else {
          setTimeout(checkGtag, 100);
        }
      };
      
      setTimeout(checkGtag, 1000);
    }
  }, [measurementId, enableUXTracking]);

  // Se analytics estiver desabilitado ou ID não configurado, não renderizar
  if (process.env.NEXT_PUBLIC_ANALYTICS_ENABLED !== 'true' || !measurementId) {
    return null;
  }

  return (
    <>
      {/* Google Analytics Script */}
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());

          gtag('config', '${measurementId}', {
            // Configurações básicas
            page_title: document.title,
            page_location: window.location.href,
            
            // Configurações UX específicas
            send_page_view: true,
            anonymize_ip: true,
            
            // Enhanced measurements para UX
            enhanced_measurement_settings: {
              scroll_events: true,
              outbound_clicks: true,
              site_search: true,
              video_engagement: true,
              file_downloads: true,
              page_changes: true
            },
            
            // Custom events para UX tracking
            custom_map: {
              'custom_parameter_1': 'ux_cognitive_load_score',
              'custom_parameter_2': 'ux_mobile_experience_score',
              'custom_parameter_3': 'ux_onboarding_step',
              'custom_parameter_4': 'ux_device_category',
              'custom_parameter_5': 'ux_page_complexity',
              'custom_parameter_6': 'ux_user_confusion_level',
              'custom_parameter_7': 'ux_accessibility_score',
              'custom_parameter_8': 'ux_performance_impact'
            }
          });

          // Eventos UX customizados globais
          window.trackUXEvent = function(eventName, category, score, parameters) {
            gtag('event', eventName, {
              event_category: category,
              value: score,
              custom_parameters: parameters || {}
            });
          };

          // Helper para tracking de cognitive load
          window.trackCognitiveLoad = function(score, context) {
            gtag('event', 'ux_cognitive_load_measured', {
              event_category: 'ux_cognitive_load',
              value: score,
              custom_parameters: {
                ux_cognitive_load_score: score,
                context: context,
                page_url: window.location.pathname,
                is_critical: score > 8 ? 'yes' : 'no'
              }
            });
          };

          // Helper para tracking mobile
          window.trackMobileIssue = function(issueType, severity) {
            gtag('event', 'ux_mobile_issue', {
              event_category: 'ux_mobile',
              value: severity,
              custom_parameters: {
                issue_type: issueType,
                severity: severity,
                device_width: window.innerWidth,
                device_height: window.innerHeight
              }
            });
          };

          // Helper para onboarding
          window.trackOnboardingEvent = function(action, step, data) {
            gtag('event', 'ux_onboarding_' + action, {
              event_category: 'ux_onboarding',
              value: step,
              custom_parameters: {
                ux_onboarding_step: step,
                action: action,
                ...data
              }
            });
          };

          if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'analytics_ux_configured', {
              event_category: 'medical_analytics_setup',
              event_label: 'ux_tracking_configuration_complete',
              custom_parameters: {
                medical_context: 'analytics_configuration',
                measurement_id: '${measurementId}',
                ux_tracking_enabled: true
              }
            });
          }
        `}
      </Script>

      {/* Debug script para desenvolvimento */}
      {process.env.NODE_ENV === 'development' && (
        <Script id="ga-debug" strategy="afterInteractive">
          {`
            // Log eventos GA em desenvolvimento
            if (window.gtag) {
              const originalGtag = window.gtag;
              window.gtag = function() {
                if (typeof window !== 'undefined' && originalGtag) {
                  originalGtag('event', 'analytics_debug_event', {
                    event_category: 'medical_analytics_debug',
                    event_label: 'ga_event_logged_in_development',
                    custom_parameters: {
                      medical_context: 'analytics_debug_system',
                      event_args_count: arguments.length,
                      development_mode: true
                    }
                  });
                }
                return originalGtag.apply(this, arguments);
              };
            }
          `}
        </Script>
      )}
    </>
  );
}

// Hook para usar GA UX tracking em componentes
// Hook para tracking de eventos personalizados (migrado do GoogleAnalytics.tsx)
export function useGoogleAnalytics() {
  const trackEvent = (
    action: string,
    category: string,
    label?: string,
    value?: number,
    customParameters?: Record<string, string | number | boolean>
  ) => {
    const windowWithGtag = getWindowWithGtag();
    if (windowWithGtag?.gtag) {
      windowWithGtag.gtag('event', action, {
        event_category: category,
        event_label: label,
        value: value,
        ...customParameters
      });
    }
  };

  const trackPageView = (page_title: string, page_location?: string) => {
    const windowWithGtag = getWindowWithGtag();
    if (windowWithGtag?.gtag && process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) {
      windowWithGtag.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID, {
        page_title,
        page_location: page_location || (typeof window !== 'undefined' ? window.location.href : '/'),
      });
    }
  };

  const trackUserInteraction = (
    element_type: string,
    element_id?: string,
    persona_id?: string,
    additional_data?: Record<string, string | number | boolean>
  ) => {
    trackEvent('user_interaction', 'ui', element_type, undefined, {
      element_id: element_id || '',
      persona_id: persona_id || '',
      ...additional_data
    });
  };

  const trackFeedback = (
    feedback_type: 'quick' | 'detailed',
    rating: number,
    persona_id: string,
    has_comments?: boolean,
    additional_data?: Record<string, string | number | boolean>
  ) => {
    trackEvent('feedback_submitted', 'user_feedback', feedback_type, rating, {
      persona_id,
      has_comments: has_comments || false,
      ...additional_data
    });
  };

  const trackPersonaInteraction = (
    interaction_type: string,
    persona_id: string,
    question_type?: string,
    additional_data?: Record<string, string | number | boolean>
  ) => {
    trackEvent(interaction_type, 'persona_interaction', persona_id, undefined, {
      question_type: question_type || 'general',
      ...additional_data
    });
  };

  const trackError = (
    error_type: string,
    error_message: string,
    component?: string,
    additional_data?: Record<string, string | number | boolean>
  ) => {
    trackEvent('error_occurred', 'error', error_type, undefined, {
      error_message: error_message.substring(0, 100),
      component: component || 'unknown',
      ...additional_data
    });
  };

  const trackSearch = (
    search_term: string,
    results_count: number,
    search_type: string = 'general'
  ) => {
    trackEvent('search', 'content', search_type, results_count, {
      search_term: search_term.substring(0, 50)
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
      completion_percentage: completion_percentage || 0
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
    isLoaded: !!getWindowWithGtag()?.gtag
  };
}

export function useGoogleAnalyticsUX() {
  useOptimizedEffect(() => {
    // Verificar se GA está disponível
    const windowWithGtag = getWindowWithGtag();
    if (windowWithGtag?.gtag) {
      // GA disponível - setup já feito
    }
  }, []);

  const trackCognitiveLoad = (score: number, context: string) => {
    const windowWithGtag = getWindowWithGtag();
    if (windowWithGtag?.trackCognitiveLoad) {
      windowWithGtag.trackCognitiveLoad(score, context);
    }
  };

  const trackMobileIssue = (issueType: string, severity: number) => {
    const windowWithGtag = getWindowWithGtag();
    if (windowWithGtag?.trackMobileIssue) {
      windowWithGtag.trackMobileIssue(issueType, severity);
    }
  };

  const trackOnboardingEvent = (action: string, step: number, data?: OnboardingEventData) => {
    const windowWithGtag = getWindowWithGtag();
    if (windowWithGtag?.trackOnboardingEvent) {
      windowWithGtag.trackOnboardingEvent(action, step, data);
    }
  };

  const trackCustomUXEvent = (eventName: string, category: string, score?: number, parameters?: UXEventParameters) => {
    const windowWithGtag = getWindowWithGtag();
    if (windowWithGtag?.trackUXEvent) {
      windowWithGtag.trackUXEvent(eventName, category, score, parameters);
    }
  };

  return {
    trackCognitiveLoad,
    trackMobileIssue,
    trackOnboardingEvent,
    trackCustomUXEvent
  };
}

// Remove conflicting global declaration - use only WindowWithGtag interface
// Global tracking functions remain available through WindowWithGtag casting