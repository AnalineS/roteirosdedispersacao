/**
 * Google Analytics Setup Component
 * Integra seu GA existente (G-3MQVGKVMLP) com UX tracking
 * Parte da ETAPA 1: Auditoria UX Baseada em Dados
 */

'use client';

import { useEffect } from 'react';
import Script from 'next/script';
import { googleAnalyticsUX } from '@/lib/analytics/googleAnalyticsUX';

interface GoogleAnalyticsSetupProps {
  enableUXTracking?: boolean;
}

export function GoogleAnalyticsSetup({ 
  enableUXTracking = true 
}: GoogleAnalyticsSetupProps) {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  
  useEffect(() => {
    // Aguardar GA carregar e então iniciar UX tracking
    if (enableUXTracking && typeof window !== 'undefined') {
      const checkGtag = () => {
        if ((window as any).gtag) {
          console.log('🔍 Google Analytics carregado, iniciando UX tracking...');
          googleAnalyticsUX.startUXAudit();
          
          // Configurar dimensões customizadas para UX
          (window as any).gtag('config', measurementId, {
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

          // Track initial page como baseline UX
          (window as any).gtag('event', 'ux_audit_start', {
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

          console.log('📊 Google Analytics UX tracking configurado (ID: ${measurementId})');
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
                console.log('📊 GA Event:', arguments);
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
export function useGoogleAnalyticsUX() {
  useEffect(() => {
    // Verificar se GA está disponível
    if (typeof window !== 'undefined' && (window as any).gtag) {
      // GA disponível - setup já feito
    }
  }, []);

  const trackCognitiveLoad = (score: number, context: string) => {
    if (typeof window !== 'undefined' && (window as any).trackCognitiveLoad) {
      (window as any).trackCognitiveLoad(score, context);
    }
  };

  const trackMobileIssue = (issueType: string, severity: number) => {
    if (typeof window !== 'undefined' && (window as any).trackMobileIssue) {
      (window as any).trackMobileIssue(issueType, severity);
    }
  };

  const trackOnboardingEvent = (action: string, step: number, data?: any) => {
    if (typeof window !== 'undefined' && (window as any).trackOnboardingEvent) {
      (window as any).trackOnboardingEvent(action, step, data);
    }
  };

  const trackCustomUXEvent = (eventName: string, category: string, score?: number, parameters?: any) => {
    if (typeof window !== 'undefined' && (window as any).trackUXEvent) {
      (window as any).trackUXEvent(eventName, category, score, parameters);
    }
  };

  return {
    trackCognitiveLoad,
    trackMobileIssue,
    trackOnboardingEvent,
    trackCustomUXEvent
  };
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: unknown[];
    trackUXEvent: (eventName: string, category: string, score?: number, parameters?: any) => void;
    trackCognitiveLoad: (score: number, context: string) => void;
    trackMobileIssue: (issueType: string, severity: number) => void;
    trackOnboardingEvent: (action: string, step: number, data?: any) => void;
  }
}