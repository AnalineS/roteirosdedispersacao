import { useCallback, useRef, useEffect } from 'react';
import Analytics from '@/services/analytics';

// Hook for tracking chat interactions
export const useChatAnalytics = (persona: 'dr_gasnelio' | 'ga') => {
  const sessionStartRef = useRef<number>(Date.now());
  const messageCountRef = useRef<number>(0);
  const lastQuestionRef = useRef<string>('');
  const questionStartRef = useRef<number>(0);

  const trackMessage = useCallback((message: string, isUser: boolean) => {
    if (isUser) {
      messageCountRef.current++;
      lastQuestionRef.current = message;
      questionStartRef.current = Date.now();
      
      Analytics.event('CHAT', 'message_sent', persona);
      
      // Track as potential top question
      Analytics.topQuestion(message.substring(0, 100), persona, 'general');
    } else {
      Analytics.event('CHAT', 'message_received', persona);
      
      // Track question resolution time
      if (questionStartRef.current > 0) {
        const resolutionTime = Date.now() - questionStartRef.current;
        Analytics.questionResolution(
          persona,
          true, // Assume resolved if response received
          resolutionTime,
          false // Will be updated if fallback is detected
        );
        questionStartRef.current = 0;
      }
    }
  }, [persona]);

  const trackFallback = useCallback(() => {
    Analytics.event('ERROR', 'fallback_triggered', persona);
    if (lastQuestionRef.current && questionStartRef.current > 0) {
      const resolutionTime = Date.now() - questionStartRef.current;
      Analytics.questionResolution(persona, false, resolutionTime, true);
    }
  }, [persona]);

  const endSession = useCallback(() => {
    const sessionDuration = Date.now() - sessionStartRef.current;
    Analytics.personaUsage(persona, sessionDuration, messageCountRef.current);
  }, [persona]);

  // Track session end on unmount
  useEffect(() => {
    return () => {
      endSession();
    };
  }, [endSession]);

  return {
    trackMessage,
    trackFallback,
    endSession,
  };
};

// Hook for tracking educational modules
export const useEducationAnalytics = () => {
  const moduleStartRef = useRef<{ [key: string]: number }>({});

  const startModule = useCallback((moduleId: string) => {
    moduleStartRef.current[moduleId] = Date.now();
    Analytics.education(moduleId, false);
  }, []);

  const completeModule = useCallback((moduleId: string, score?: number) => {
    const startTime = moduleStartRef.current[moduleId];
    if (startTime) {
      const duration = Date.now() - startTime;
      Analytics.timing('education', `module_${moduleId}`, duration);
    }
    Analytics.education(moduleId, true, score);
    delete moduleStartRef.current[moduleId];
  }, []);

  const generateCertificate = useCallback((moduleId: string) => {
    Analytics.event('EDUCATION', 'certificate_generated', moduleId);
  }, []);

  return {
    startModule,
    completeModule,
    generateCertificate,
  };
};

// Hook for tracking user authentication
export const useAuthAnalytics = () => {
  const trackLogin = useCallback((method: string, userType: string) => {
    Analytics.event('USER', 'login', method);
    Analytics.user({ userType: userType as 'visitor' | 'registered' | 'admin' });
  }, []);

  const trackSignup = useCallback((method: string) => {
    Analytics.event('USER', 'signup', method);
  }, []);

  const trackLogout = useCallback(() => {
    Analytics.event('USER', 'logout');
  }, []);

  return {
    trackLogin,
    trackSignup,
    trackLogout,
  };
};

// Hook for tracking admin actions
export const useAdminAnalytics = () => {
  const trackConfigChange = useCallback((configType: string) => {
    Analytics.admin('config_change', configType);
  }, []);

  const trackModuleCreate = useCallback((moduleName: string) => {
    Analytics.admin('module_create', moduleName);
  }, []);

  const trackCertificateTemplate = useCallback((action: string) => {
    Analytics.admin('certificate_template', action);
  }, []);

  const trackQuestionAdd = useCallback((category: string) => {
    Analytics.admin('question_add', category);
  }, []);

  return {
    trackConfigChange,
    trackModuleCreate,
    trackCertificateTemplate,
    trackQuestionAdd,
  };
};

// Hook for tracking performance metrics
export const usePerformanceAnalytics = () => {
  const trackApiCall = useCallback((endpoint: string, duration: number, success: boolean) => {
    Analytics.timing('api', endpoint, duration);
    if (!success) {
      Analytics.event('ERROR', 'api_error', endpoint);
    }
  }, []);

  const trackLoadTime = useCallback((component: string, duration: number) => {
    Analytics.timing('performance', `load_${component}`, duration);
  }, []);

  return {
    trackApiCall,
    trackLoadTime,
  };
};

// Hook for compliance tracking
export const useComplianceAnalytics = () => {
  const trackConsent = useCallback((given: boolean) => {
    Analytics.compliance(given ? 'consent_given' : 'consent_withdrawn', 'medical');
  }, []);

  const trackDataRequest = useCallback((type: 'request' | 'deletion') => {
    Analytics.compliance(
      type === 'request' ? 'data_request' : 'data_deletion',
      'medical'
    );
  }, []);

  return {
    trackConsent,
    trackDataRequest,
  };
};

// Main analytics hook that combines all
export const useAnalytics = () => {
  return {
    chat: useChatAnalytics,
    education: useEducationAnalytics(),
    auth: useAuthAnalytics(),
    admin: useAdminAnalytics(),
    performance: usePerformanceAnalytics(),
    compliance: useComplianceAnalytics(),
  };
};