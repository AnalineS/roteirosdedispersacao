/**
 * UX Analytics Provider
 * Integra o sistema de tracking UX na aplicação
 * Parte da ETAPA 1: Auditoria UX Baseada em Dados
 */

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { uxAnalytics, UXEvent } from '@/lib/analytics/uxTracking';

interface UXAnalyticsContextType {
  trackEvent: (event: UXEvent) => void;
  trackCognitiveLoad: (score: number, context: string) => void;
  trackMobileIssue: (issue: string, severity: number) => void;
  trackOnboardingStep: (step: number) => void;
  trackOnboardingAbandonment: (reason: string) => void;
  isInitialized: boolean;
}

const UXAnalyticsContext = createContext<UXAnalyticsContextType | null>(null);

interface UXAnalyticsProviderProps {
  children: React.ReactNode;
  enableTracking?: boolean;
}

export function UXAnalyticsProvider({ 
  children, 
  enableTracking = true 
}: UXAnalyticsProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!enableTracking) return;

    // Initialize UX tracking
    setIsInitialized(true);

    // Track initial page load
    uxAnalytics.trackEvent({
      category: 'engagement',
      action: 'page_view',
      label: window.location.pathname,
      custom_dimensions: {
        page_title: document.title,
        timestamp: Date.now()
      }
    });

    // Track page unload for session analysis
    const handleBeforeUnload = () => {
      uxAnalytics.trackEvent({
        category: 'engagement',
        action: 'session_end',
        custom_dimensions: {
          session_duration: Date.now(),
          final_page: window.location.pathname
        }
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enableTracking]);

  const trackEvent = (event: UXEvent) => {
    if (!enableTracking || !isInitialized) return;
    uxAnalytics.trackEvent(event);
  };

  const trackCognitiveLoad = (score: number, context: string) => {
    trackEvent({
      category: 'cognitive_load',
      action: 'measurement',
      value: score,
      label: context,
      custom_dimensions: {
        page_url: window.location.pathname,
        cognitive_load_score: score
      }
    });
  };

  const trackMobileIssue = (issue: string, severity: number) => {
    trackEvent({
      category: 'mobile_experience',
      action: 'issue_detected',
      label: issue,
      value: severity,
      custom_dimensions: {
        device_type: window.innerWidth < 768 ? 'mobile' : 'desktop',
        screen_size: `${window.innerWidth}x${window.innerHeight}`
      }
    });
  };

  const trackOnboardingStep = (step: number) => {
    uxAnalytics.trackOnboardingStep(step);
  };

  const trackOnboardingAbandonment = (reason: string) => {
    uxAnalytics.trackOnboardingAbandonment(reason);
  };

  const contextValue: UXAnalyticsContextType = {
    trackEvent,
    trackCognitiveLoad,
    trackMobileIssue,
    trackOnboardingStep,
    trackOnboardingAbandonment,
    isInitialized
  };

  return (
    <UXAnalyticsContext.Provider value={contextValue}>
      {children}
    </UXAnalyticsContext.Provider>
  );
}

export function useUXAnalytics(): UXAnalyticsContextType {
  const context = useContext(UXAnalyticsContext);
  if (!context) {
    throw new Error('useUXAnalytics must be used within UXAnalyticsProvider');
  }
  return context;
}

// Hook para tracking automático de cognitive load
export function useCognitiveLoadTracking(threshold: number = 7) {
  const { trackCognitiveLoad } = useUXAnalytics();

  useEffect(() => {
    const measureCognitiveLoad = () => {
      // Simplified cognitive load measurement
      const visibleElements = document.querySelectorAll('*').length;
      const textLength = document.body.innerText.length;
      const interactiveElements = document.querySelectorAll(
        'button, a, input, select, textarea'
      ).length;

      // Simple formula (can be enhanced)
      const elementDensity = visibleElements / (window.innerWidth * window.innerHeight) * 1000000;
      const textDensity = textLength / (window.innerWidth * window.innerHeight) * 1000;
      const interactionComplexity = interactiveElements / 10;

      const cognitiveScore = elementDensity + textDensity + interactionComplexity;
      const normalizedScore = Math.min(cognitiveScore / 100 * 10, 10);

      if (normalizedScore > threshold) {
        trackCognitiveLoad(
          normalizedScore, 
          `High cognitive load detected: ${normalizedScore.toFixed(1)}/10`
        );
      }

      return normalizedScore;
    };

    // Measure after component mount
    const timer = setTimeout(measureCognitiveLoad, 2000);

    return () => clearTimeout(timer);
  }, [threshold, trackCognitiveLoad]);
}

// Hook para tracking de problemas mobile
export function useMobileExperienceTracking() {
  const { trackMobileIssue } = useUXAnalytics();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isMobile = window.innerWidth < 768;
    if (!isMobile) return;

    const auditMobileExperience = () => {
      // Check for tap targets smaller than 44px
      const smallTapTargets = document.querySelectorAll(
        'button, a, input, [role="button"]'
      );
      
      let smallTargetCount = 0;
      smallTapTargets.forEach(element => {
        const rect = element.getBoundingClientRect();
        if (rect.width < 44 || rect.height < 44) {
          smallTargetCount++;
        }
      });

      if (smallTargetCount > 0) {
        trackMobileIssue(`Small tap targets found: ${smallTargetCount}`, smallTargetCount);
      }

      // Check for horizontal scroll
      if (document.documentElement.scrollWidth > window.innerWidth) {
        trackMobileIssue('Horizontal scroll detected', 8);
      }

      // Check for text too small
      const textElements = document.querySelectorAll('p, span, div, a, button');
      let smallTextCount = 0;
      
      textElements.forEach(element => {
        const computedStyle = window.getComputedStyle(element);
        const fontSize = parseFloat(computedStyle.fontSize);
        if (fontSize < 14) {
          smallTextCount++;
        }
      });

      if (smallTextCount > 5) {
        trackMobileIssue(`Text too small: ${smallTextCount} elements`, smallTextCount / 5);
      }
    };

    const timer = setTimeout(auditMobileExperience, 3000);
    return () => clearTimeout(timer);
  }, [trackMobileIssue]);
}

// Hook para tracking de onboarding
export function useOnboardingTracking(currentStep: number, totalSteps: number) {
  const { trackOnboardingStep, trackOnboardingAbandonment, trackEvent } = useUXAnalytics();

  useEffect(() => {
    trackOnboardingStep(currentStep);
  }, [currentStep, trackOnboardingStep]);

  const trackAbandonment = (reason: string) => {
    trackOnboardingAbandonment(`Step ${currentStep}/${totalSteps}: ${reason}`);
  };

  const trackCompletion = () => {
    trackEvent({
      category: 'onboarding',
      action: 'completed',
      value: totalSteps,
      custom_dimensions: {
        completion_rate: 100,
        total_steps: totalSteps
      }
    });
  };

  return { trackAbandonment, trackCompletion };
}