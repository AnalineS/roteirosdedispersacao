import ReactGA from 'react-ga4';

// Google Analytics Measurement ID - Configured via GitHub secrets
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '';

// Analytics Categories
export const AnalyticsCategory = {
  CHAT: 'Chat',
  PERSONA: 'Persona',
  EDUCATION: 'Education',
  NAVIGATION: 'Navigation',
  ERROR: 'Error',
  PERFORMANCE: 'Performance',
  USER: 'User',
  ADMIN: 'Admin',
  COMPLIANCE: 'Compliance',
} as const;

// Analytics Actions
export const AnalyticsAction = {
  // Chat Actions
  MESSAGE_SENT: 'message_sent',
  MESSAGE_RECEIVED: 'message_received',
  CONVERSATION_START: 'conversation_start',
  CONVERSATION_END: 'conversation_end',
  
  // Persona Actions
  PERSONA_SELECTED: 'persona_selected',
  PERSONA_SWITCH: 'persona_switch',
  PERSONA_RESPONSE_TIME: 'persona_response_time',
  
  // Education Actions
  MODULE_START: 'module_start',
  MODULE_COMPLETE: 'module_complete',
  CERTIFICATE_GENERATED: 'certificate_generated',
  QUIZ_COMPLETED: 'quiz_completed',
  
  // Error Actions
  API_ERROR: 'api_error',
  FALLBACK_TRIGGERED: 'fallback_triggered',
  NETWORK_ERROR: 'network_error',
  
  // User Actions
  LOGIN: 'login',
  LOGOUT: 'logout',
  SIGNUP: 'signup',
  PROFILE_UPDATE: 'profile_update',
} as const;

// Medical Interaction Metrics Interface
interface MedicalInteractionMetric {
  urgencyLevel: 'critical' | 'important' | 'standard';
  accessMethod: 'click' | 'keyboard' | 'swipe';
  timeFromPageLoad: number;
}

// Medical Task Completion Interface
interface MedicalTaskCompletion {
  type: 'drug_interaction' | 'contraindication' | 'emergency_dose' | 'protocol_access';
  success: boolean;
  timeToComplete: number;
  errorCount?: number;
  urgencyLevel?: 'critical' | 'important' | 'standard';
}

// Medical Error Event Interface
interface MedicalErrorEvent {
  type: 'calculation_error' | 'interaction_missed' | 'navigation_error' | 'system_error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  context: string;
  userAction?: string;
}

// Custom Metrics Interface
interface CustomMetrics {
  // Resolution Metrics
  questionResolved: boolean;
  resolutionTime: number;
  followUpNeeded: boolean;

  // Session Metrics
  sessionDuration: number;
  messagesCount: number;
  personaSwitches: number;

  // Performance Metrics
  apiResponseTime: number;
  fallbackCount: number;
  errorCount: number;

  // Educational Metrics
  modulesCompleted: number;
  certificatesEarned: number;
  quizScore?: number;

  // Compliance Metrics
  lgpdConsent: boolean;
  dataCategory: 'public' | 'sensitive' | 'medical';
}

// Initialize GA4
export const initGA = () => {
  if (typeof window !== 'undefined' && GA_MEASUREMENT_ID) {
    ReactGA.initialize(GA_MEASUREMENT_ID, {
      gaOptions: {
        anonymizeIp: true, // LGPD compliance
        cookieFlags: 'SameSite=None;Secure',
      },
    });
  }
};

// Page View Tracking
export const logPageView = (path: string, title?: string) => {
  if (typeof window !== 'undefined') {
    ReactGA.send({
      hitType: 'pageview',
      page: path,
      title: title || document.title,
    });
  }
};

// Event Tracking
export const logEvent = (
  category: keyof typeof AnalyticsCategory,
  action: string,
  label?: string,
  value?: number,
  nonInteraction?: boolean
) => {
  if (typeof window !== 'undefined') {
    ReactGA.event({
      category: AnalyticsCategory[category],
      action,
      label,
      value,
      nonInteraction,
    });
  }
};

// Custom Metrics Tracking
export const logCustomMetrics = (metrics: Partial<CustomMetrics>) => {
  if (typeof window !== 'undefined') {
    // Log as custom dimensions
    ReactGA.gtag('event', 'custom_metrics', {
      custom_parameter: metrics,
    });
  }
};

// User Properties
export const setUserProperties = (properties: {
  userType?: 'visitor' | 'registered' | 'admin';
  institution?: string;
  specialization?: string;
}) => {
  if (typeof window !== 'undefined') {
    ReactGA.gtag('set', 'user_properties', properties);
  }
};

// Timing Metrics
export const logTiming = (
  category: string,
  variable: string,
  value: number,
  label?: string
) => {
  if (typeof window !== 'undefined') {
    ReactGA.gtag('event', 'timing_complete', {
      name: variable,
      value,
      event_category: category,
      event_label: label,
    });
  }
};

// Exception Tracking
export const logException = (
  description: string,
  fatal: boolean = false
) => {
  if (typeof window !== 'undefined') {
    ReactGA.gtag('event', 'exception', {
      description,
      fatal,
    });
  }
};

// Custom Events for Educational Platform

// Track Question Resolution
export const trackQuestionResolution = (
  persona: string,
  resolved: boolean,
  timeToResolve: number,
  fallbackUsed: boolean = false
) => {
  logEvent('CHAT', 'question_resolution', persona, timeToResolve);
  logCustomMetrics({
    questionResolved: resolved,
    resolutionTime: timeToResolve,
    fallbackCount: fallbackUsed ? 1 : 0,
  });
};

// Track Persona Usage
export const trackPersonaUsage = (
  persona: 'dr_gasnelio' | 'ga',
  sessionDuration: number,
  messagesCount: number
) => {
  logEvent('PERSONA', AnalyticsAction.PERSONA_SELECTED, persona, messagesCount);
  logTiming('persona_session', persona, sessionDuration);
  logCustomMetrics({
    sessionDuration,
    messagesCount,
  });
};

// Track Top Questions
export const trackTopQuestion = (
  question: string,
  persona: string,
  category: string
) => {
  logEvent('CHAT', 'top_question', `${persona}:${category}:${question}`);
};

// Track Peak Hours
export const trackPeakHour = () => {
  const hour = new Date().getHours();
  const dayOfWeek = new Date().getDay();
  logEvent('PERFORMANCE', 'peak_hour', `${dayOfWeek}:${hour}`);
};

// Track Educational Progress
export const trackEducationalProgress = (
  moduleId: string,
  completed: boolean,
  score?: number
) => {
  logEvent(
    'EDUCATION',
    completed ? AnalyticsAction.MODULE_COMPLETE : AnalyticsAction.MODULE_START,
    moduleId,
    score
  );
  
  if (completed) {
    logCustomMetrics({
      modulesCompleted: 1,
      quizScore: score,
    });
  }
};

// Track Compliance
export const trackCompliance = (
  action: 'consent_given' | 'consent_withdrawn' | 'data_request' | 'data_deletion',
  dataCategory: 'public' | 'sensitive' | 'medical'
) => {
  logEvent('COMPLIANCE', action, dataCategory);
  logCustomMetrics({
    lgpdConsent: action === 'consent_given',
    dataCategory,
  });
};

// Admin Metrics
export const trackAdminAction = (
  action: 'config_change' | 'module_create' | 'certificate_template' | 'question_add',
  details?: string
) => {
  logEvent('ADMIN', action, details);
};

// Session Management
let currentSessionId: string | null = null;

const getCurrentSessionId = (): string => {
  if (!currentSessionId) {
    currentSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  return currentSessionId;
};

const getDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
  if (typeof window === 'undefined') return 'desktop';
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
};

// Medical Analytics Functions
export const trackMedicalInteraction = (metric: MedicalInteractionMetric) => {
  logEvent('CHAT', 'medical_interaction', metric.urgencyLevel, metric.timeFromPageLoad);
  logCustomMetrics({
    resolutionTime: metric.timeFromPageLoad,
    errorCount: 0
  });
};

export const trackMedicalTaskCompletion = (task: MedicalTaskCompletion) => {
  logEvent('EDUCATION', 'medical_task', task.type, task.timeToComplete);
  logCustomMetrics({
    questionResolved: task.success,
    resolutionTime: task.timeToComplete,
    errorCount: task.errorCount || 0
  });
};

export const trackMedicalError = (error: MedicalErrorEvent) => {
  logException(`Medical Error: ${error.type} - ${error.context}`, error.severity === 'critical');
  logEvent('ERROR', 'medical_error', error.type);
};

// Export all tracking functions
export const Analytics = {
  init: initGA,
  pageView: logPageView,
  event: logEvent,
  metrics: logCustomMetrics,
  user: setUserProperties,
  timing: logTiming,
  exception: logException,
  // Custom trackers
  questionResolution: trackQuestionResolution,
  personaUsage: trackPersonaUsage,
  topQuestion: trackTopQuestion,
  peakHour: trackPeakHour,
  education: trackEducationalProgress,
  compliance: trackCompliance,
  admin: trackAdminAction,
  // Medical tracking functions
  medicalInteraction: trackMedicalInteraction,
  medicalTask: trackMedicalTaskCompletion,
  medicalError: trackMedicalError,
};

export default Analytics;