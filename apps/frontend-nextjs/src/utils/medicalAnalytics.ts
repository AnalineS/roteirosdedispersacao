/**
 * Analytics GA4 Enhanced para contexto médico
 * Tracking específico para UX médico e segurança farmacêutica
 */

import { AnalyticsFirestoreCache } from '@/services/analyticsFirestoreCache';
import { secureLogger } from '@/utils/secureLogger';

interface MedicalError {
  type: 'calculation_error' | 'interaction_error' | 'protocol_error' | 'system_error';
  message: string;
  code?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  userId?: string;
  context?: {
    page?: string;
    component?: string;
    userInput?: string;
    calculationType?: string;
  };
  stackTrace?: string;
}

interface MedicalAction {
  type: 'drug_interaction' | 'contraindication' | 'emergency_dose' | 'protocol_access';
  success: boolean;
  timeToComplete: number;
  errorCount?: number;
  urgencyLevel?: 'critical' | 'important' | 'standard';
  userId?: string;
  context?: {
    patientAge?: number;
    medications?: string[];
    indication?: string;
    route?: string;
  };
}

interface UsageContext {
  page: string;
  component?: string;
  userRole?: 'pharmacy' | 'medicine' | 'nursing' | 'student';
  sessionDuration?: number;
  previousActions?: string[];
  accessibility?: {
    screenReader?: boolean;
    highContrast?: boolean;
    keyboardOnly?: boolean;
  };
}

interface UserRole {
  primary: 'pharmacy' | 'medicine' | 'nursing' | 'student' | 'admin';
  level?: 'junior' | 'senior' | 'specialist' | 'consultant';
  specialties?: string[];
  permissions?: string[];
  verified?: boolean;
}

interface MedicalAnalyticsEvent {
  event: string;
  event_category: string;
  event_label?: string;
  value?: number;
  custom_dimensions?: {
    user_role?: 'pharmacy' | 'medicine' | 'nursing' | 'student' | 'unknown';
    urgency_level?: 'critical' | 'important' | 'standard';
    clinical_context?: 'emergency' | 'routine' | 'educational';
    time_to_action?: number; // em segundos
    success_rate?: number; // 0-100
    error_type?: string;
    feature_flag?: string;
    ab_test_variant?: 'A' | 'B';
    session_type?: 'first_visit' | 'returning' | 'frequent';
    device_type?: 'mobile' | 'tablet' | 'desktop';
    viewport_size?: string;
    connection_type?: 'slow' | 'fast' | 'unknown';
  };
  custom_parameters?: Record<string, unknown>;
}

interface MedicalUXMetrics {
  pageLoadTime: number;
  timeToInteractive: number;
  timeToFirstContentfulPaint: number;
  timeToLargestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
}

interface ClinicalTaskMetrics {
  taskId: string;
  taskType: 'dose_calculation' | 'interaction_check' | 'protocol_lookup' | 'emergency_access';
  startTime: number;
  endTime: number;
  success: boolean;
  errorCount: number;
  helpUsed: boolean;
  shortcutsUsed: string[];
  stepsCompleted: number;
  totalSteps: number;
}

// Configurações de analytics por contexto
export const MEDICAL_ANALYTICS_CONFIG = {
  // Eventos críticos que devem ser sempre trackados
  criticalEvents: [
    'emergency_access',
    'drug_interaction_check',
    'contraindication_lookup',
    'dose_calculation_error',
    'fast_access_bar_usage'
  ],
  
  // Dimensões customizadas para GA4
  customDimensions: {
    user_role: 'custom_dimension_1',
    urgency_level: 'custom_dimension_2',
    clinical_context: 'custom_dimension_3',
    feature_flag: 'custom_dimension_4',
    ab_test_variant: 'custom_dimension_5'
  },
  
  // Métricas customizadas
  customMetrics: {
    time_to_action: 'custom_metric_1',
    error_rate: 'custom_metric_2',
    task_completion_rate: 'custom_metric_3',
    help_usage_rate: 'custom_metric_4'
  }
} as const;

/**
 * Classe principal para analytics médico
 */
export class MedicalAnalytics {
  private static instance: MedicalAnalytics;
  private sessionStartTime: number;
  private userRole: string = 'unknown';
  private currentTasks: Map<string, ClinicalTaskMetrics> = new Map();
  private errorBuffer: MedicalError[] = [];
  
  private constructor() {
    this.sessionStartTime = Date.now();
    this.initializeSession();
  }
  
  public static getInstance(): MedicalAnalytics {
    if (!MedicalAnalytics.instance) {
      MedicalAnalytics.instance = new MedicalAnalytics();
    }
    return MedicalAnalytics.instance;
  }
  
  /**
   * Inicializar sessão de analytics
   */
  private initializeSession(): void {
    if (typeof window === 'undefined') return;
    // Detectar tipo de dispositivo
    const deviceType = this.getDeviceType();
    const viewportSize = `${window.innerWidth}x${window.innerHeight}`;
    const sessionType = this.getSessionType();
    
    this.trackEvent({
      event: 'session_start',
      event_category: 'session_management',
      custom_parameters: {
        device_type: deviceType,
        viewport_size: viewportSize,
        session_type: sessionType,
        connection_type: this.getConnectionType()
      }
    });
    
    // Configurar listeners para Core Web Vitals
    this.setupWebVitalsTracking();
    
    // Track performance metrics
    this.trackPerformanceMetrics();
    
    // Configurar error tracking
    this.setupErrorTracking();
  }
  
  /**
   * Tracking de evento principal
   */
  public trackEvent(event: MedicalAnalyticsEvent): void {
    if (typeof window === 'undefined' || !window.gtag) {
      secureLogger.warn('Google Analytics not available', {
        component: 'MedicalAnalytics',
        operation: 'trackEvent'
      });
      return;
    }
    
    try {
      // Enriquecer evento com contexto médico
      const enrichedEvent = this.enrichEventWithContext(event);
      
      // Enviar para GA4
      window.gtag('event', enrichedEvent.event, {
        event_category: enrichedEvent.event_category,
        event_label: enrichedEvent.event_label,
        value: enrichedEvent.value,
        ...enrichedEvent.custom_dimensions
      });

      // Também salvar no Firestore para analytics médico avançado
      const sessionId = this.getCurrentSessionId();
      AnalyticsFirestoreCache.saveAnalyticsEvent({
        id: `medical_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sessionId,
        timestamp: new Date().toISOString(),
        type: enrichedEvent.event,
        category: enrichedEvent.event_category,
        label: enrichedEvent.event_label,
        value: enrichedEvent.value,
        customDimensions: enrichedEvent.custom_dimensions,
        medicalContext: {
          urgencyLevel: enrichedEvent.custom_dimensions?.urgency_level,
          clinicalContext: enrichedEvent.custom_dimensions?.clinical_context,
          userRole: enrichedEvent.custom_dimensions?.user_role
        }
      }).catch((error: unknown) => {
        secureLogger.error('Medical analytics event save failed', error as Error, {
          component: 'MedicalAnalytics',
          operation: 'trackEvent',
          eventCategory: enrichedEvent.event_category
        });
      });
      
      // Log em desenvolvimento usando secure logging
      if (process.env.NODE_ENV === 'development') {
        secureLogger.debug('Medical Analytics Event', {
          event: enrichedEvent.event,
          category: enrichedEvent.event_category,
          hasCustomDimensions: !!enrichedEvent.custom_dimensions,
          component: 'MedicalAnalytics'
        });
      }
      
    } catch (error) {
      secureLogger.error('Analytics event send failed', error as Error, {
        component: 'MedicalAnalytics',
        operation: 'trackEvent'
      });
      // Note: Not logging event details to prevent data exposure
    }
  }
  
  /**
   * Enriquecer evento com contexto adicional
   */
  private enrichEventWithContext(event: MedicalAnalyticsEvent): MedicalAnalyticsEvent {
    const baseContext = {
      user_role: this.userRole as 'pharmacy' | 'medicine' | 'nursing' | 'student' | 'unknown',
      device_type: this.getDeviceType(),
      session_duration: Math.floor((Date.now() - this.sessionStartTime) / 1000)
    };
    
    return {
      ...event,
      custom_parameters: {
        ...baseContext,
        ...event.custom_dimensions
      }
    };
  }
  
  /**
   * Tracking específico para ações médicas críticas
   */
  public trackCriticalMedicalAction(action: {
    type: 'drug_interaction' | 'contraindication' | 'emergency_dose' | 'protocol_access';
    success: boolean;
    timeToComplete: number;
    errorCount?: number;
    urgencyLevel?: 'critical' | 'important' | 'standard';
  }): void {
    this.trackEvent({
      event: 'critical_medical_action',
      event_category: 'patient_safety',
      event_label: action.type,
      value: action.timeToComplete,
      custom_parameters: {
        urgency_level: action.urgencyLevel,
        clinical_context: action.urgencyLevel === 'critical' ? 'emergency' : 'routine',
        time_to_action: action.timeToComplete,
        success_rate: action.success ? 100 : 0
      }
    });

    // Track como ação crítica no Firestore
    const sessionId = this.getCurrentSessionId();
    AnalyticsFirestoreCache.trackMedicalMetric({
      type: 'adverse_effect',
      value: action.timeToComplete,
      context: {
        actionType: action.type,
        success: action.success,
        urgencyLevel: action.urgencyLevel,
        errorCount: action.errorCount || 0
      }
    }).catch((error: unknown) => {
      secureLogger.error('Critical medical action tracking failed', error as Error, {
        component: 'MedicalAnalytics',
        operation: 'trackCriticalMedicalAction',
        actionType: action.type
      });
    });
  }
  
  /**
   * Tracking para Fast Access Bar
   */
  public trackFastAccessUsage(shortcutId: string, context: {
    urgencyLevel: 'critical' | 'important' | 'standard';
    accessMethod: 'click' | 'keyboard' | 'swipe';
    timeFromPageLoad: number;
  }): void {
    this.trackEvent({
      event: 'fast_access_usage',
      event_category: 'emergency_tools',
      event_label: shortcutId,
      value: context.timeFromPageLoad,
      custom_parameters: {
        urgency_level: context.urgencyLevel,
        clinical_context: context.urgencyLevel === 'critical' ? 'emergency' : 'routine',
        time_to_action: context.timeFromPageLoad / 1000
      }
    });
  }
  
  /**
   * Tracking para feature flags
   */
  public trackFeatureFlagUsage(flagKey: string, flagValue: boolean, source: string): void {
    this.trackEvent({
      event: 'feature_flag_usage',
      event_category: 'feature_flags',
      event_label: flagKey,
      custom_parameters: {
        feature_flag: `${flagKey}:${flagValue}`,
        user_role: this.userRole as 'pharmacy' | 'medicine' | 'nursing' | 'student' | 'unknown'
      }
    });
  }
  
  /**
   * Iniciar tracking de tarefa clínica
   */
  public startClinicalTask(taskId: string, taskType: ClinicalTaskMetrics['taskType']): void {
    const task: ClinicalTaskMetrics = {
      taskId,
      taskType,
      startTime: Date.now(),
      endTime: 0,
      success: false,
      errorCount: 0,
      helpUsed: false,
      shortcutsUsed: [],
      stepsCompleted: 0,
      totalSteps: 1
    };
    
    this.currentTasks.set(taskId, task);
    
    this.trackEvent({
      event: 'clinical_task_start',
      event_category: 'task_management',
      event_label: taskType,
      custom_parameters: {
        clinical_context: this.getTaskContext(taskType)
      }
    });
  }
  
  /**
   * Finalizar tracking de tarefa clínica
   */
  public completeClinicalTask(taskId: string, success: boolean): void {
    const task = this.currentTasks.get(taskId);
    if (!task) return;
    
    task.endTime = Date.now();
    task.success = success;
    
    const duration = task.endTime - task.startTime;
    const completionRate = (task.stepsCompleted / task.totalSteps) * 100;
    
    this.trackEvent({
      event: 'clinical_task_complete',
      event_category: 'task_management',
      event_label: task.taskType,
      value: duration,
      custom_parameters: {
        time_to_action: duration / 1000,
        success_rate: success ? 100 : 0,
        clinical_context: this.getTaskContext(task.taskType)
      }
    });
    
    this.currentTasks.delete(taskId);
  }
  
  /**
   * Tracking de erro médico
   */
  public trackMedicalError(error: {
    type: 'calculation_error' | 'interaction_missed' | 'navigation_error' | 'system_error';
    severity: 'low' | 'medium' | 'high' | 'critical';
    context: string;
    userAction?: string;
  }): void {
    this.trackEvent({
      event: 'medical_error',
      event_category: 'error_tracking',
      event_label: error.type,
      custom_parameters: {
        urgency_level: error.severity === 'critical' ? 'critical' : 
                      error.severity === 'high' ? 'important' : 'standard',
        error_type: error.type,
        clinical_context: error.severity === 'critical' ? 'emergency' : 'routine'
      }
    });
  }
  
  /**
   * Configurar Web Vitals tracking
   */
  private setupWebVitalsTracking(): void {
    // Usar a API Web Vitals se disponível
    if ('web-vital' in window) {
      // Implementation seria feita com a biblioteca web-vitals
      secureLogger.debug('Web Vitals tracking configured', {
        component: 'MedicalAnalytics',
        operation: 'setupWebVitalsTracking'
      });
    }
  }
  
  /**
   * Tracking de métricas de performance
   */
  private trackPerformanceMetrics(): void {
    if (typeof window === 'undefined' || !('performance' in window) || !('getEntriesByType' in performance)) return;
    if ('performance' in window && 'getEntriesByType' in performance) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          
          if (navigation) {
            this.trackEvent({
              event: 'performance_metrics',
              event_category: 'performance',
              custom_parameters: {
                time_to_action: navigation.loadEventEnd - navigation.fetchStart
              }
            });
          }
        }, 0);
      });
    }
  }
  
  /**
   * Configurar tracking de erros
   */
  private setupErrorTracking(): void {
    if (typeof window === 'undefined') return;
    window.addEventListener('error', (event) => {
      this.trackMedicalError({
        type: 'system_error',
        severity: 'medium',
        context: event.filename || 'unknown',
        userAction: 'page_load'
      });
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      this.trackMedicalError({
        type: 'system_error',
        severity: 'high',
        context: 'unhandled_promise_rejection',
        userAction: 'async_operation'
      });
    });
  }
  
  /**
   * Definir papel do usuário
   */
  public setUserRole(role: 'pharmacy' | 'medicine' | 'nursing' | 'student' | 'unknown'): void {
    this.userRole = role;
    
    this.trackEvent({
      event: 'user_role_set',
      event_category: 'user_management',
      event_label: role,
      custom_parameters: {
        user_role: role
      }
    });
  }
  
  /**
   * Utilitários
   */
  private getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    if (typeof window === 'undefined') return 'desktop';
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }
  
  private getSessionType(): 'first_visit' | 'returning' | 'frequent' {
    const visitCount = parseInt(localStorage.getItem('visit_count') || '0');
    localStorage.setItem('visit_count', (visitCount + 1).toString());
    
    if (visitCount === 0) return 'first_visit';
    if (visitCount < 5) return 'returning';
    return 'frequent';
  }
  
  private getConnectionType(): 'slow' | 'fast' | 'unknown' {
    if ('connection' in navigator) {
      const connection = (navigator as unknown as { connection: { effectiveType: string } }).connection;
      if (connection.effectiveType === '4g') return 'fast';
      if (connection.effectiveType === '3g' || connection.effectiveType === '2g') return 'slow';
    }
    return 'unknown';
  }
  
  private getTaskContext(taskType: string): 'emergency' | 'routine' | 'educational' {
    const emergencyTasks = ['dose_calculation', 'interaction_check'];
    if (emergencyTasks.includes(taskType)) return 'emergency';
    return 'routine';
  }

  private getCurrentSessionId(): string {
    if (!this.currentSessionId) {
      this.currentSessionId = `medical_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      // Iniciar sessão médica no Firestore
      AnalyticsFirestoreCache.startAnalyticsSession({
        id: this.currentSessionId,
        startTime: new Date().toISOString(),
        status: 'active',
        events: [],
        metadata: {
          deviceType: this.getDeviceType(),
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server'
        }
      }).catch((error: unknown) => {
        secureLogger.error('Medical analytics session start failed', error as Error, {
          component: 'MedicalAnalytics',
          operation: 'getCurrentSessionId'
        });
      });
    }
    return this.currentSessionId;
  }

  private currentSessionId: string | null = null;

  // Método público para tracking de erros gerais
  public trackError(error: {
    type: string;
    message: string;
    page?: string;
  }): void {
    this.trackMedicalError({
      type: 'system_error',
      severity: 'medium',
      context: error.page || 'unknown',
      userAction: 'page_interaction'
    });
  }
}

// Instância singleton
// Export lazy initialization to prevent SSR issues
export const medicalAnalytics = {
  getInstance: () => typeof window !== 'undefined' ? MedicalAnalytics.getInstance() : null,
  trackEvent: (event: MedicalAnalyticsEvent) => {
    const instance = typeof window !== 'undefined' ? MedicalAnalytics.getInstance() : null;
    if (instance) instance.trackEvent(event);
  },
  trackMedicalError: (error: MedicalError) => {
    const instance = typeof window !== 'undefined' ? MedicalAnalytics.getInstance() : null;
    if (instance) instance.trackMedicalError(error);
  },
  trackClinicalTask: (task: ClinicalTaskMetrics) => {
    const instance = typeof window !== 'undefined' ? MedicalAnalytics.getInstance() : null;
    if (instance) instance.startClinicalTask(task.taskId, task.taskType);
  },
  trackCriticalMedicalAction: (action: MedicalAction) => {
    const instance = typeof window !== 'undefined' ? MedicalAnalytics.getInstance() : null;
    if (instance) instance.trackCriticalMedicalAction(action);
  },
  trackFastAccessUsage: (shortcutId: string, context: UsageContext) => {
    const instance = typeof window !== 'undefined' ? MedicalAnalytics.getInstance() : null;
    if (instance) instance.trackFastAccessUsage(shortcutId, context);
  },
  trackFeatureFlagUsage: (flagKey: string, flagValue: boolean, source: string) => {
    const instance = typeof window !== 'undefined' ? MedicalAnalytics.getInstance() : null;
    if (instance) instance.trackFeatureFlagUsage(flagKey, flagValue, source);
  },
  setUserRole: (role: UserRole) => {
    const instance = typeof window !== 'undefined' ? MedicalAnalytics.getInstance() : null;
    if (instance) instance.setUserRole(role);
  }
};

// Funções utilitárias para uso direto
export const trackCriticalAction = (action: Parameters<MedicalAnalytics['trackCriticalMedicalAction']>[0]) => {
  medicalAnalytics.trackCriticalMedicalAction(action);
};

export const trackFastAccess = (shortcutId: string, context: Parameters<MedicalAnalytics['trackFastAccessUsage']>[1]) => {
  medicalAnalytics.trackFastAccessUsage(shortcutId, context);
};

export const trackFeatureFlag = (flagKey: string, flagValue: boolean, source: string = 'manual') => {
  medicalAnalytics.trackFeatureFlagUsage(flagKey, flagValue, source);
};

export const setUserRole = (role: Parameters<MedicalAnalytics['setUserRole']>[0]) => {
  medicalAnalytics.setUserRole(role);
};

export default medicalAnalytics;