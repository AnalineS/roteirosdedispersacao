/**
 * Unified Analytics Service
 * Bridges GA4, Microsoft Clarity, and internal ContinuousImprovementSystem
 *
 * Architecture:
 * - GA4: Aggregate metrics, conversions, standard events
 * - Clarity: Heatmaps, session recordings, UX insights
 * - Internal CIS: Detailed feedback, A/B testing, learning analytics
 */

import { Analytics as ReactGAAnalytics } from './analytics';

// Types for unified tracking
export interface UnifiedEvent {
  name: string;
  category: 'feedback' | 'persona' | 'education' | 'navigation' | 'error' | 'ux';
  properties?: Record<string, string | number | boolean>;
  value?: number;
}

export interface FeedbackEvent {
  type: 'quick' | 'detailed';
  rating: number;
  personaId: string;
  componentType?: string;
  hasComments?: boolean;
  context?: string;
}

export interface PersonaEvent {
  action: 'selected' | 'switched' | 'interaction' | 'response';
  personaId: string;
  previousPersonaId?: string;
  questionType?: string;
  responseTime?: number;
}

export interface EducationEvent {
  action: 'module_start' | 'module_complete' | 'quiz_attempt' | 'certificate';
  moduleId: string;
  score?: number;
  timeSpent?: number;
  completionRate?: number;
}

export interface UXEvent {
  type: 'cognitive_load' | 'mobile_issue' | 'onboarding' | 'accessibility';
  score?: number;
  context: string;
  severity?: 'low' | 'medium' | 'high';
  device?: 'mobile' | 'tablet' | 'desktop';
}

// Unified Analytics Class
class UnifiedAnalyticsService {
  private initialized = false;
  private sessionId: string | null = null;
  private userId: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.sessionId = this.generateSessionId();
    }
  }

  private generateSessionId(): string {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint8Array(8);
      crypto.getRandomValues(array);
      return Array.from(array, b => b.toString(36)).join('');
    }
    return Date.now().toString(36);
  }

  /**
   * Initialize all analytics systems
   */
  init(): void {
    if (this.initialized) return;

    // Initialize ReactGA4
    ReactGAAnalytics.init();

    this.initialized = true;

    if (process.env.NODE_ENV === 'development') {
      console.log('Unified Analytics initialized');
    }
  }

  /**
   * Set user for all systems
   */
  setUser(userId: string, properties?: Record<string, string>): void {
    this.userId = userId;

    // GA4 user properties
    ReactGAAnalytics.user({
      userType: properties?.userType as 'visitor' | 'registered' | 'admin' | undefined,
      institution: properties?.institution,
      specialization: properties?.specialization
    });

    // Clarity user identification
    if (typeof window !== 'undefined' && window.clarity) {
      window.clarity('identify', userId, this.sessionId || undefined, properties);
    }
  }

  /**
   * Track unified event across all systems
   */
  trackEvent(event: UnifiedEvent): void {
    const { name, category, properties, value } = event;

    // GA4 event
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', name, {
        event_category: category,
        value,
        session_id: this.sessionId,
        ...properties
      });
    }

    // Clarity custom event
    if (typeof window !== 'undefined' && window.clarity) {
      window.clarity('event', name);
      if (properties) {
        Object.entries(properties).forEach(([key, val]) => {
          window.clarity?.('set', `${name}_${key}`, String(val));
        });
      }
    }

    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Unified Event:', { name, category, properties, value });
    }
  }

  /**
   * Track feedback event
   */
  trackFeedback(feedback: FeedbackEvent): void {
    // GA4 feedback
    ReactGAAnalytics.questionResolution(
      feedback.personaId,
      true,
      0,
      false
    );

    // Unified event
    this.trackEvent({
      name: 'feedback_submitted',
      category: 'feedback',
      properties: {
        type: feedback.type,
        persona_id: feedback.personaId,
        component_type: feedback.componentType || 'chat',
        has_comments: feedback.hasComments || false
      },
      value: feedback.rating
    });

    // Clarity upgrade for detailed feedback
    if (feedback.type === 'detailed' && typeof window !== 'undefined' && window.clarity) {
      window.clarity('upgrade', 'detailed_feedback');
    }
  }

  /**
   * Track persona interaction
   */
  trackPersona(event: PersonaEvent): void {
    // GA4 persona tracking
    if (event.action === 'selected' || event.action === 'switched') {
      ReactGAAnalytics.personaUsage(
        event.personaId as 'dr_gasnelio' | 'ga',
        0,
        0
      );
    }

    // Unified event
    this.trackEvent({
      name: `persona_${event.action}`,
      category: 'persona',
      properties: {
        persona_id: event.personaId,
        previous_persona_id: event.previousPersonaId || '',
        question_type: event.questionType || '',
        response_time: event.responseTime || 0
      }
    });
  }

  /**
   * Track educational progress
   */
  trackEducation(event: EducationEvent): void {
    // GA4 education tracking
    ReactGAAnalytics.education(
      event.moduleId,
      event.action === 'module_complete',
      event.score
    );

    // Unified event
    this.trackEvent({
      name: event.action,
      category: 'education',
      properties: {
        module_id: event.moduleId,
        completion_rate: event.completionRate || 0,
        time_spent: event.timeSpent || 0
      },
      value: event.score
    });
  }

  /**
   * Track UX event (cognitive load, mobile issues, etc.)
   */
  trackUX(event: UXEvent): void {
    // Use window helpers if available
    if (typeof window !== 'undefined') {
      switch (event.type) {
        case 'cognitive_load':
          if (window.trackCognitiveLoad) {
            window.trackCognitiveLoad(event.score || 0, event.context);
          }
          break;
        case 'mobile_issue':
          if (window.trackMobileIssue) {
            const severityMap = { low: 3, medium: 5, high: 8 };
            window.trackMobileIssue(event.context, severityMap[event.severity || 'medium']);
          }
          break;
        case 'onboarding':
          if (window.trackOnboardingEvent) {
            window.trackOnboardingEvent(event.context, event.score || 1, {});
          }
          break;
      }
    }

    // Unified event
    this.trackEvent({
      name: `ux_${event.type}`,
      category: 'ux',
      properties: {
        context: event.context,
        severity: event.severity || 'medium',
        device: event.device || this.getDeviceType()
      },
      value: event.score
    });
  }

  /**
   * Track error with proper categorization
   */
  trackError(error: {
    type: string;
    message: string;
    component?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
  }): void {
    // GA4 exception
    ReactGAAnalytics.exception(
      `${error.type}: ${error.message}`,
      error.severity === 'critical'
    );

    // Unified event
    this.trackEvent({
      name: 'error_occurred',
      category: 'error',
      properties: {
        error_type: error.type,
        error_message: error.message.substring(0, 100),
        component: error.component || 'unknown',
        severity: error.severity || 'medium'
      }
    });

    // Clarity upgrade for critical errors
    if (error.severity === 'critical' && typeof window !== 'undefined' && window.clarity) {
      window.clarity('upgrade', 'critical_error');
    }
  }

  /**
   * Track page view
   */
  trackPageView(path: string, title?: string): void {
    ReactGAAnalytics.pageView(path, title);
    ReactGAAnalytics.peakHour();
  }

  /**
   * Get current device type
   */
  private getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    if (typeof window === 'undefined') return 'desktop';
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  /**
   * Get session ID for correlation
   */
  getSessionId(): string | null {
    return this.sessionId;
  }

  /**
   * Get user ID
   */
  getUserId(): string | null {
    return this.userId;
  }
}

// Singleton instance
export const UnifiedAnalytics = new UnifiedAnalyticsService();

// React hook for components
export function useUnifiedAnalytics() {
  return {
    trackEvent: UnifiedAnalytics.trackEvent.bind(UnifiedAnalytics),
    trackFeedback: UnifiedAnalytics.trackFeedback.bind(UnifiedAnalytics),
    trackPersona: UnifiedAnalytics.trackPersona.bind(UnifiedAnalytics),
    trackEducation: UnifiedAnalytics.trackEducation.bind(UnifiedAnalytics),
    trackUX: UnifiedAnalytics.trackUX.bind(UnifiedAnalytics),
    trackError: UnifiedAnalytics.trackError.bind(UnifiedAnalytics),
    trackPageView: UnifiedAnalytics.trackPageView.bind(UnifiedAnalytics),
    setUser: UnifiedAnalytics.setUser.bind(UnifiedAnalytics),
    getSessionId: UnifiedAnalytics.getSessionId.bind(UnifiedAnalytics)
  };
}

export default UnifiedAnalytics;
