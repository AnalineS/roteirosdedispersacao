'use client';

import { useEffect, useCallback, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useGoogleAnalyticsUX } from '@/components/analytics/GoogleAnalyticsSetup';
import { MedicalAnalytics } from '@/utils/medicalAnalytics';
import EducationalMonitoringSystem from '@/utils/educationalAnalytics';
// UX Analytics será implementado localmente por não estar exportado
interface UXEvent {
  category: string;
  action: string;
  label: string;
  custom_dimensions?: Record<string, string | number>;
  custom_parameters?: Record<string, string | number | boolean>;
}

interface CognitiveLoadMetrics {
  elements_per_page: number;
  information_density: number;
  decision_points: number;
  scroll_depth: number;
  time_to_first_interaction: number;
  confusion_indicators: number;
}

interface MobileExperienceMetrics {
  device_type: string;
  screen_size: string;
  touch_accuracy: number;
  scroll_performance: number;
  tap_targets_under_44px: number;
  horizontal_scroll_detected: boolean;
}

interface OnboardingMetrics {
  step: number;
  completion_rate: number;
  time_spent: number;
  abandonment_point: string;
  friction_score: number;
  help_usage: number;
}

interface MockUXAnalytics {
  trackEvent: (event: UXEvent) => void;
  trackCognitiveLoad: (metrics: CognitiveLoadMetrics) => void;
  trackMobileExperience: (metrics: MobileExperienceMetrics) => void;
  trackOnboarding: (metrics: OnboardingMetrics) => void;
}

class UXAnalytics implements MockUXAnalytics {
  trackEvent(event: UXEvent) {
    // Implementação mock - será conectada ao sistema real depois
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'ux_event_tracked', {
        event_category: 'medical_ux_tracking',
        event_label: 'ux_event_execution',
        custom_parameters: {
          medical_context: 'ux_analytics_system',
          event_category: event.category,
          event_action: event.action,
          event_label: event.label
        }
      });
    }
  }
  
  trackCognitiveLoad(metrics: CognitiveLoadMetrics) {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'cognitive_load_tracked', {
        event_category: 'medical_ux_tracking',
        event_label: 'cognitive_load_measurement',
        custom_parameters: {
          medical_context: 'cognitive_analytics_system',
          elements_per_page: metrics.elements_per_page,
          information_density: metrics.information_density,
          decision_points: metrics.decision_points
        }
      });
    }
  }
  
  trackMobileExperience(metrics: MobileExperienceMetrics) {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'mobile_experience_tracked', {
        event_category: 'medical_ux_tracking',
        event_label: 'mobile_experience_measurement',
        custom_parameters: {
          medical_context: 'mobile_analytics_system',
          device_type: metrics.device_type,
          screen_size: metrics.screen_size,
          touch_accuracy: metrics.touch_accuracy
        }
      });
    }
  }
  
  trackOnboarding(metrics: OnboardingMetrics) {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'onboarding_tracked', {
        event_category: 'medical_ux_tracking',
        event_label: 'onboarding_measurement',
        custom_parameters: {
          medical_context: 'onboarding_analytics_system',
          onboarding_step: metrics.step,
          completion_rate: metrics.completion_rate,
          time_spent: metrics.time_spent
        }
      });
    }
  }
}

/**
 * Global Tracking Hook - PR #176
 * Conecta as 400+ funções de tracking não utilizadas
 * Implementa auto-tracking para todo o sistema
 */

interface TrackingConfig {
  enableCognitiveLoad?: boolean;
  enableMobileTracking?: boolean;
  enableOnboarding?: boolean;
  enableMedicalActions?: boolean;
  enableEducational?: boolean;
  enablePerformance?: boolean;
  enableErrors?: boolean;
}

const DEFAULT_CONFIG: TrackingConfig = {
  enableCognitiveLoad: true,
  enableMobileTracking: true,
  enableOnboarding: true,
  enableMedicalActions: true,
  enableEducational: true,
  enablePerformance: true,
  enableErrors: true,
};

export function useGlobalTracking(config: TrackingConfig = DEFAULT_CONFIG) {
  const pathname = usePathname();
  const searchParams = useSearchParams(); // Always call hook, check window in useEffect
  const { 
    trackCognitiveLoad, 
    trackMobileIssue, 
    trackOnboardingEvent,
    trackCustomUXEvent 
  } = useGoogleAnalyticsUX();
  
  const medicalAnalytics = useRef(MedicalAnalytics.getInstance());
  const uxAnalytics = useRef(new UXAnalytics());
  const previousPathname = useRef(pathname);
  const pageLoadTime = useRef(Date.now());
  const interactionCount = useRef(0);
  const scrollDepth = useRef(0);
  const errorCount = useRef(0);

  // Track page views e navegação
  useEffect(() => {
    if (pathname !== previousPathname.current) {
      const timeOnPage = Date.now() - pageLoadTime.current;
      
      // Track page transition
      trackCustomUXEvent('page_transition', 'navigation', undefined, {
        from: previousPathname.current || 'unknown',
        to: pathname || '/',
        time_on_previous_page: timeOnPage,
        interaction_count: interactionCount.current,
        scroll_depth: scrollDepth.current,
        error_count: errorCount.current
      });

      // Reset counters
      previousPathname.current = pathname;
      pageLoadTime.current = Date.now();
      interactionCount.current = 0;
      scrollDepth.current = 0;
      errorCount.current = 0;

      // Track page view
      uxAnalytics.current.trackEvent({
        category: 'navigation',
        action: 'page_view',
        label: pathname || '/',
        custom_parameters: {
          search_params: searchParams?.toString() || '',
          referrer: document.referrer,
          user_agent: navigator.userAgent
        }
      });

      // Educational tracking para módulos
      if (pathname?.includes('/modules') && config.enableEducational) {
        const educationalMonitoringSystem = new EducationalMonitoringSystem();
        educationalMonitoringSystem.trackModuleAccess({
          module_path: pathname,
          timestamp: new Date().toISOString()
        });
      }

      // Medical tracking para páginas críticas
      if (pathname && (pathname.includes('/calculator') || pathname.includes('/dosage')) && config.enableMedicalActions) {
        medicalAnalytics.current.trackCriticalMedicalAction({
          type: 'protocol_access',
          success: true,
          timeToComplete: 0
        });
      }
    }
  }, [pathname, searchParams, trackCustomUXEvent, config]);

  // Cognitive Load Tracking
  const measureCognitiveLoad = useCallback(() => {
    if (!config.enableCognitiveLoad) return;

    const elements = document.querySelectorAll('*').length;
    const links = document.querySelectorAll('a').length;
    const forms = document.querySelectorAll('form').length;
    const buttons = document.querySelectorAll('button').length;
    const images = document.querySelectorAll('img').length;
    const textBlocks = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6').length;

    // Calcular score de cognitive load (0-100)
    const cognitiveScore = Math.min(100, (
      (elements / 100) * 0.2 +
      (links * 2) * 0.2 +
      (forms * 10) * 0.2 +
      (buttons * 3) * 0.2 +
      (textBlocks / 10) * 0.2
    ));

    trackCognitiveLoad(cognitiveScore, pathname || '/');

    // Send to backend
    uxAnalytics.current.trackCognitiveLoad({
      elements_per_page: elements,
      information_density: textBlocks / Math.max(1, elements),
      decision_points: links + buttons + forms,
      scroll_depth: scrollDepth.current,
      time_to_first_interaction: interactionCount.current > 0 ? Date.now() - pageLoadTime.current : 0,
      confusion_indicators: errorCount.current
    });
  }, [pathname, trackCognitiveLoad, config.enableCognitiveLoad]);

  // Mobile Experience Tracking
  const trackMobileExperience = useCallback(() => {
    if (!config.enableMobileTracking) return;
    
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobile) return;

    // Check touch targets
    const smallTargets = Array.from(document.querySelectorAll('button, a, input'))
      .filter(el => {
        const rect = el.getBoundingClientRect();
        return rect.width < 44 || rect.height < 44;
      });

    // Check horizontal scroll
    const hasHorizontalScroll = document.documentElement.scrollWidth > window.innerWidth;

    // Track issues
    if (smallTargets.length > 0) {
      trackMobileIssue('small_touch_targets', smallTargets.length);
    }

    if (hasHorizontalScroll) {
      trackMobileIssue('horizontal_scroll', 1);
    }

    // Track mobile metrics
    uxAnalytics.current.trackMobileExperience({
      device_type: navigator.userAgent,
      screen_size: `${window.innerWidth}x${window.innerHeight}`,
      touch_accuracy: 100 - (smallTargets.length * 5),
      scroll_performance: 100,
      tap_targets_under_44px: smallTargets.length,
      horizontal_scroll_detected: hasHorizontalScroll
    });
  }, [trackMobileIssue, config.enableMobileTracking]);

  // Scroll Tracking
  useEffect(() => {
    if (!config.enableCognitiveLoad) return;

    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const currentScrollDepth = Math.round((scrollTop + windowHeight) / documentHeight * 100);
      
      if (currentScrollDepth > scrollDepth.current) {
        scrollDepth.current = currentScrollDepth;
        
        // Track milestone depths
        if ([25, 50, 75, 90, 100].includes(currentScrollDepth)) {
          trackCustomUXEvent('scroll_depth', 'engagement', currentScrollDepth, {
            page: pathname || '/',
            time_to_scroll: Date.now() - pageLoadTime.current
          });
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname, trackCustomUXEvent, config.enableCognitiveLoad]);

  // Click Tracking
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      interactionCount.current++;
      
      const target = e.target as HTMLElement;
      const tagName = target.tagName.toLowerCase();
      const className = target.className || 'no-class';
      const id = target.id || 'no-id';
      
      // Track important clicks
      if (['button', 'a', 'input', 'select'].includes(tagName)) {
        trackCustomUXEvent('element_click', 'interaction', undefined, {
          element: tagName,
          class: className,
          id: id,
          text: target.textContent?.substring(0, 50) || '',
          page: pathname || '/',
          interaction_number: interactionCount.current
        });
      }

      // Track first interaction time
      if (interactionCount.current === 1) {
        const timeToFirstInteraction = Date.now() - pageLoadTime.current;
        trackCustomUXEvent('first_interaction', 'engagement', timeToFirstInteraction, {
          page: pathname || '/',
          element: tagName
        });
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [pathname, trackCustomUXEvent]);

  // Error Tracking
  useEffect(() => {
    if (!config.enableErrors) return;

    const handleError = (event: ErrorEvent) => {
      errorCount.current++;
      
      trackCustomUXEvent('javascript_error', 'error', undefined, {
        message: event.message,
        source: event.filename || '',
        line: event.lineno,
        column: event.colno,
        page: pathname || '/',
        stack: event.error?.stack || ''
      });

      // Medical critical error tracking
      if (pathname && (pathname.includes('/calculator') || pathname.includes('/dosage'))) {
        medicalAnalytics.current.trackError({
          type: 'critical_page_error',
          message: event.message,
          page: pathname
        });
      }
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, [pathname, trackCustomUXEvent, config.enableErrors]);

  // Performance Tracking
  useEffect(() => {
    if (!config.enablePerformance) return;

    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          
          trackCustomUXEvent('page_performance', 'performance', undefined, {
            page: pathname || '/',
            dns_time: navEntry.domainLookupEnd - navEntry.domainLookupStart,
            connection_time: navEntry.connectEnd - navEntry.connectStart,
            request_time: navEntry.responseStart - navEntry.requestStart,
            response_time: navEntry.responseEnd - navEntry.responseStart,
            dom_processing: navEntry.domComplete - navEntry.domInteractive,
            load_complete: navEntry.loadEventEnd - navEntry.loadEventStart,
            total_time: navEntry.loadEventEnd - navEntry.fetchStart
          });
        }
        
        if (entry.entryType === 'largest-contentful-paint') {
          trackCustomUXEvent('lcp', 'web_vitals', entry.startTime, {
            page: pathname || '/'
          });
        }
      }
    });

    observer.observe({ entryTypes: ['navigation', 'largest-contentful-paint'] });
    return () => observer.disconnect();
  }, [pathname, trackCustomUXEvent, config.enablePerformance]);


  // Onboarding Tracking
  const trackOnboarding = useCallback((step: number, action: string, data?: Record<string, string | number>) => {
    if (!config.enableOnboarding) return;

    trackOnboardingEvent(action, step, {
      ...data,
      page: pathname || '/',
      timestamp: new Date().toISOString()
    });

    // Track to backend
    uxAnalytics.current.trackOnboarding({
      step,
      completion_rate: (step / 5) * 100, // Assuming 5 steps total
      time_spent: Date.now() - pageLoadTime.current,
      abandonment_point: action === 'abandon' ? pathname || '/' : '',
      friction_score: errorCount.current,
      help_usage: 0
    });
  }, [pathname, trackOnboardingEvent, config.enableOnboarding]);

  // Measure cognitive load on mount and periodically
  useEffect(() => {
    // Initial measurement
    const timer = setTimeout(() => {
      measureCognitiveLoad();
      trackMobileExperience();
    }, 1000);

    // Periodic measurements
    const interval = setInterval(() => {
      measureCognitiveLoad();
    }, 30000); // Every 30 seconds

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [measureCognitiveLoad, trackMobileExperience]);

  // Educational monitoring
  useEffect(() => {
    if (!config.enableEducational) return;

    // Start monitoring
    const educationalMonitoringSystem = new EducationalMonitoringSystem();
    educationalMonitoringSystem.startMonitoring();

    return () => {
      educationalMonitoringSystem.stopMonitoring();
    };
  }, [config.enableEducational]);

  // Return tracking functions for manual use
  return {
    trackOnboarding,
    trackMedicalAction: (action: {
      type: 'drug_interaction' | 'contraindication' | 'emergency_dose' | 'protocol_access';
      success: boolean;
      timeToComplete: number;
      errorCount?: number;
      urgencyLevel?: 'critical' | 'important' | 'standard';
    }) => {
      if (config.enableMedicalActions) {
        medicalAnalytics.current.trackCriticalMedicalAction(action);
      }
    },
    trackCustomEvent: (eventName: string, category: string, value?: number, parameters?: Record<string, string | number>) => {
      trackCustomUXEvent(eventName, category, value, parameters);
    },
    getTrackingStats: () => ({
      interactions: interactionCount.current,
      scrollDepth: scrollDepth.current,
      errors: errorCount.current,
      timeOnPage: Date.now() - pageLoadTime.current
    })
  };
}