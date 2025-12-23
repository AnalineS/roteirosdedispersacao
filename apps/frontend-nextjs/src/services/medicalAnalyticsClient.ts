/**
 * Medical Analytics Client
 * Handles medical-specific analytics tracking (not UX metrics)
 * Sends data to internal SQLite/Google Storage backend
 */

import { safeLocalStorage } from '@/hooks/useClientStorage';
import { generateSecureId } from '@/utils/secureRandom';

interface MedicalEvent {
  event_type: 'medical_interaction' | 'medical_error' | 'clinical_task' | 'educational_progress';
  persona_id?: string;
  question?: string;
  response_time?: number;
  urgency_level?: 'critical' | 'important' | 'standard';
  fallback_used?: boolean;
  error_type?: string;
  error_severity?: string;
  error_context?: string;
  task_type?: string;
  task_success?: boolean;
  module_id?: string;
  completion_rate?: number;
}

interface UserContext {
  userId?: string;
  sessionId: string;
  isAnonymous: boolean;
}

class MedicalAnalyticsClient {
  private static instance: MedicalAnalyticsClient;
  private sessionId: string;
  private userId: string | null = null;
  private isAnonymous: boolean = true;
  private apiBaseUrl: string;

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    this.initializeSession();
  }

  public static getInstance(): MedicalAnalyticsClient {
    if (!MedicalAnalyticsClient.instance) {
      MedicalAnalyticsClient.instance = new MedicalAnalyticsClient();
    }
    return MedicalAnalyticsClient.instance;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${generateSecureId(9)}`;
  }

  /**
   * Initialize or update user context
   * Call this when user logs in/out
   */
  public setUserContext(userId: string | null): void {
    this.userId = userId;
    this.isAnonymous = !userId;

    // Store in localStorage for persistence
    if (typeof window !== 'undefined') {
      if (userId) {
        safeLocalStorage()?.setItem('medical_user_id', userId);
        safeLocalStorage()?.setItem('medical_is_anonymous', 'false');
      } else {
        safeLocalStorage()?.removeItem('medical_user_id');
        safeLocalStorage()?.setItem('medical_is_anonymous', 'true');
      }
    }
  }

  /**
   * Initialize session from localStorage
   */
  private initializeSession(): void {
    if (typeof window !== 'undefined') {
      // Restore user context from localStorage
      const storedUserId = safeLocalStorage()?.getItem('medical_user_id');
      const storedSessionId = safeLocalStorage()?.getItem('medical_session_id');

      if (storedUserId) {
        this.userId = storedUserId;
        this.isAnonymous = false;
      }

      // Use existing session or create new one
      if (storedSessionId) {
        this.sessionId = storedSessionId;
      } else {
        safeLocalStorage()?.setItem('medical_session_id', this.sessionId);
        this.startSession();
      }
    }
  }

  /**
   * Start a new analytics session
   */
  private async startSession(): Promise<void> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v1/analytics/session/start`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          device_type: this.getDeviceType(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.session_id) {
          this.sessionId = data.session_id;
          safeLocalStorage()?.setItem('medical_session_id', this.sessionId);
        }
      }
    } catch (error) {
      console.warn('Failed to start analytics session:', error);
    }
  }

  /**
   * End current session (call on logout or page unload)
   */
  public async endSession(): Promise<void> {
    try {
      await fetch(`${this.apiBaseUrl}/v1/analytics/session/end`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          session_id: this.sessionId,
        }),
      });

      // Clear session from localStorage
      safeLocalStorage()?.removeItem('medical_session_id');
    } catch (error) {
      console.warn('Failed to end analytics session:', error);
    }
  }

  /**
   * Track a medical interaction (question/response)
   */
  public async trackMedicalInteraction(
    personaId: string,
    question: string,
    responseTime?: number,
    urgencyLevel?: 'critical' | 'important' | 'standard',
    fallbackUsed: boolean = false
  ): Promise<void> {
    const event: MedicalEvent = {
      event_type: 'medical_interaction',
      persona_id: personaId,
      question: question.substring(0, 500), // Limit for privacy
      response_time: responseTime,
      urgency_level: urgencyLevel || this.detectUrgency(question),
      fallback_used: fallbackUsed,
    };

    await this.trackEvent(event);
  }

  /**
   * Track a medical error
   */
  public async trackMedicalError(
    errorType: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    context: string
  ): Promise<void> {
    const event: MedicalEvent = {
      event_type: 'medical_error',
      error_type: errorType,
      error_severity: severity,
      error_context: context,
    };

    await this.trackEvent(event);
  }

  /**
   * Track educational progress
   */
  public async trackEducationalProgress(
    moduleId: string,
    completionRate: number
  ): Promise<void> {
    const event: MedicalEvent = {
      event_type: 'educational_progress',
      module_id: moduleId,
      completion_rate: completionRate,
    };

    await this.trackEvent(event);
  }

  /**
   * Track clinical task completion
   */
  public async trackClinicalTask(
    taskType: string,
    success: boolean,
    responseTime?: number
  ): Promise<void> {
    const event: MedicalEvent = {
      event_type: 'clinical_task',
      task_type: taskType,
      task_success: success,
      response_time: responseTime,
    };

    await this.trackEvent(event);
  }

  /**
   * Core method to track any event
   */
  private async trackEvent(event: MedicalEvent): Promise<void> {
    try {
      await fetch(`${this.apiBaseUrl}/v1/analytics/track`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(event),
      });
    } catch (error) {
      console.warn('Failed to track medical event:', error);
    }
  }

  /**
   * Get real-time metrics
   */
  public async getRealTimeMetrics(): Promise<any> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v1/analytics/realtime`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        return data.data;
      }
    } catch (error) {
      console.warn('Failed to get realtime metrics:', error);
    }
    return null;
  }

  /**
   * Get aggregated metrics for date range
   */
  public async getAggregatedMetrics(startDate: Date, endDate: Date): Promise<any> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/v1/analytics/sessions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.data;
      }
    } catch (error) {
      console.warn('Failed to get aggregated metrics:', error);
    }
    return null;
  }

  /**
   * Helper to detect urgency from message content
   */
  private detectUrgency(message: string): 'critical' | 'important' | 'standard' {
    const lowerMessage = message.toLowerCase();

    const criticalKeywords = ['emergência', 'urgente', 'imediato', 'grave', 'crítico'];
    const importantKeywords = ['importante', 'atenção', 'cuidado', 'preocupado'];

    if (criticalKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'critical';
    } else if (importantKeywords.some(keyword => lowerMessage.includes(keyword))) {
      return 'important';
    }

    return 'standard';
  }

  /**
   * Helper to get device type
   */
  private getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    if (typeof window === 'undefined') return 'desktop';

    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  /**
   * Helper to build headers with user context
   */
  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'X-User-ID': this.userId || 'anonymous',
      'X-Session-ID': this.sessionId,
    };
  }
}

// Export singleton instance
const medicalAnalytics = MedicalAnalyticsClient.getInstance();

// Add window unload listener to end session
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    medicalAnalytics.endSession();
  });
}

export default medicalAnalytics;

// Export type definitions
export type { MedicalEvent, UserContext };