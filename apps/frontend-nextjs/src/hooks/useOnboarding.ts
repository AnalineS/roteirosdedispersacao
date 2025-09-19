/**
 * Onboarding Hook - ETAPA 3 UX TRANSFORMATION
 * Sistema inteligente de onboarding com detecção de primeiro acesso
 * 
 * Seguindo princípios de claude_code_optimization_prompt.md:
 * - Performance: Lazy evaluation e localStorage otimizado
 * - Clean Code: Single responsibility principle
 * - Medical Context: Configuração específica para profissionais de saúde
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useGoogleAnalytics } from '@/components/analytics/GoogleAnalyticsSetup';

interface UserRole {
  id: 'medical' | 'student' | 'patient';
  title: string;
  description: string;
  icon: string;
  benefits: string[];
  recommendedPersona: 'dr-gasnelio' | 'ga';
}

interface OnboardingState {
  isFirstVisit: boolean;
  hasCompletedOnboarding: boolean;
  selectedRole: UserRole | null;
  skipCount: number;
  lastVisit: number;
}

const STORAGE_KEY = 'onboarding_state';
const MAX_SKIP_COUNT = 3;
const RETENTION_DAYS = 30;

const DEFAULT_STATE: OnboardingState = {
  isFirstVisit: true,
  hasCompletedOnboarding: false,
  selectedRole: null,
  skipCount: 0,
  lastVisit: Date.now()
};

export function useOnboarding() {
  const [state, setState] = useState<OnboardingState>(DEFAULT_STATE);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const { trackUserInteraction } = useGoogleAnalytics();

  // Initialize onboarding state
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      
      if (stored) {
        const parsed: OnboardingState = JSON.parse(stored);
        
        // Check if data is still valid (within retention period)
        const daysSinceLastVisit = (Date.now() - parsed.lastVisit) / (1000 * 60 * 60 * 24);
        
        if (daysSinceLastVisit > RETENTION_DAYS) {
          // Reset if data is too old
          setState(DEFAULT_STATE);
          localStorage.removeItem(STORAGE_KEY);
          trackUserInteraction('onboarding_data_expired', '', String(daysSinceLastVisit));
        } else {
          setState({
            ...parsed,
            lastVisit: Date.now()
          });
        }
      } else {
        // First time visitor
        trackUserInteraction('onboarding_first_visit', '', String(Date.now()));
      }
      
      setIsLoaded(true);
    } catch (error) {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'onboarding_load_error', {
          event_category: 'medical_onboarding_system',
          event_label: 'onboarding_state_load_failed',
          custom_parameters: {
            medical_context: 'onboarding_initialization',
            error_type: 'localStorage_read_failure',
            error_message: error instanceof Error ? error.message : 'unknown_error'
          }
        });
      }
      setState(DEFAULT_STATE);
      setIsLoaded(true);
    }
  }, [trackUserInteraction]);

  // Determine if wizard should be shown
  useEffect(() => {
    if (!isLoaded) return;

    const shouldShow = state.isFirstVisit && 
                      !state.hasCompletedOnboarding && 
                      state.skipCount < MAX_SKIP_COUNT;

    setShowWizard(shouldShow);

    if (shouldShow) {
      trackUserInteraction('onboarding_wizard_shown', '', String(state.skipCount));
    }
  }, [isLoaded, state, trackUserInteraction]);

  // Save state to localStorage
  const saveState = useCallback((newState: Partial<OnboardingState>) => {
    const updatedState = {
      ...state,
      ...newState,
      lastVisit: Date.now()
    };

    setState(updatedState);
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedState));
    } catch (error) {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'onboarding_save_error', {
          event_category: 'medical_onboarding_system',
          event_label: 'onboarding_state_save_failed',
          custom_parameters: {
            medical_context: 'onboarding_persistence',
            error_type: 'localStorage_write_failure',
            error_message: error instanceof Error ? error.message : 'unknown_error'
          }
        });
      }
    }
  }, [state]);

  // Complete onboarding
  const completeOnboarding = useCallback((selectedRole: UserRole) => {
    saveState({
      hasCompletedOnboarding: true,
      isFirstVisit: false,
      selectedRole
    });

    setShowWizard(false);

    trackUserInteraction('onboarding_completed', '', '1', {
      role_selected: selectedRole.id,
      recommended_persona: selectedRole.recommendedPersona,
      completion_time: Date.now()
    });

    // Store user preference for role-based features
    localStorage.setItem('user_role_preference', selectedRole.id);
  }, [saveState, trackUserInteraction]);

  // Skip onboarding
  const skipOnboarding = useCallback(() => {
    const newSkipCount = state.skipCount + 1;
    
    saveState({
      skipCount: newSkipCount,
      isFirstVisit: false
    });

    setShowWizard(false);

    trackUserInteraction('onboarding_skipped', '', String(newSkipCount), {
      skip_count: newSkipCount,
      max_skips_reached: newSkipCount >= MAX_SKIP_COUNT
    });

    // If max skips reached, mark as permanently dismissed
    if (newSkipCount >= MAX_SKIP_COUNT) {
      saveState({
        hasCompletedOnboarding: true,
        selectedRole: null // Default experience
      });
      
      trackUserInteraction('onboarding_permanently_dismissed', '', String(newSkipCount));
    }
  }, [state.skipCount, saveState, trackUserInteraction]);

  // Reset onboarding (for testing or admin purposes)
  const resetOnboarding = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('user_role_preference');
    setState(DEFAULT_STATE);
    setShowWizard(true);
    
    trackUserInteraction('onboarding_reset', '', '1');
  }, [trackUserInteraction]);

  // Check if user can still see onboarding
  const canShowOnboarding = state.skipCount < MAX_SKIP_COUNT && !state.hasCompletedOnboarding;

  // Get user's preferred persona based on role
  const getPreferredPersona = useCallback((): 'dr-gasnelio' | 'ga' | null => {
    if (state.selectedRole) {
      return state.selectedRole.recommendedPersona;
    }

    // Fallback: check localStorage for manual preference
    const rolePreference = localStorage.getItem('user_role_preference');
    if (rolePreference === 'medical' || rolePreference === 'student') {
      return 'dr-gasnelio';
    } else if (rolePreference === 'patient') {
      return 'ga';
    }

    return null;
  }, [state.selectedRole]);

  // Analytics: Track onboarding engagement
  const trackOnboardingEngagement = useCallback((event: string, value?: number, metadata?: Record<string, any>) => {
    trackUserInteraction(`onboarding_${event}`, 'onboarding_flow', value ? String(value) : undefined, {
      current_step: showWizard ? 'wizard_open' : 'completed',
      skip_count: state.skipCount,
      has_completed: state.hasCompletedOnboarding,
      ...metadata
    });
  }, [trackUserInteraction, showWizard, state.skipCount, state.hasCompletedOnboarding]);

  return {
    // State
    isLoaded,
    showWizard,
    canShowOnboarding,
    onboardingState: state,
    
    // Actions
    completeOnboarding,
    skipOnboarding,
    resetOnboarding,
    
    // Getters
    getPreferredPersona,
    
    // Analytics
    trackOnboardingEngagement,
    
    // Computed properties
    isFirstTimeUser: state.isFirstVisit && !state.hasCompletedOnboarding,
    skipsRemaining: Math.max(0, MAX_SKIP_COUNT - state.skipCount),
    hasExceededSkipLimit: state.skipCount >= MAX_SKIP_COUNT
  };
}