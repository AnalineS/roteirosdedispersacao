'use client';

import React, { createContext, useContext, useReducer, useEffect, useMemo, useCallback } from 'react';
import { useTrackingContext } from '@/components/tracking/IntegratedTrackingProvider';

// ============================================
// TIPOS DO CONTEXTO GLOBAL
// ============================================

export interface GlobalState {
  // User & Session Data
  userId: string;
  sessionId: string;
  userPreferences: UserPreferences;
  userProgress: UserProgress;
  
  // UI State
  theme: 'light' | 'dark' | 'auto';
  accessibility: AccessibilitySettings;
  navigation: NavigationState;
  
  // Application State
  currentModule: string;
  currentStep: string;
  completionStatus: Record<string, number>;
  
  // Chat & Persona State
  currentPersona: string;
  chatHistory: ChatMessage[];
  contextualData: Record<string, string | number | boolean | object | null>;
  
  // System State
  isOnline: boolean;
  performance: PerformanceMetrics;
  errors: SystemError[];
}

export interface UserPreferences {
  language: string;
  fontSize: number;
  highContrast: boolean;
  reduceMotion: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
  notificationsEnabled: boolean;
  dataTracking: boolean;
}

export interface UserProgress {
  modulesCompleted: string[];
  currentModule: string;
  totalTimeSpent: number;
  streakDays: number;
  lastAccess: number;
  achievements: string[];
  learningPath: string[];
}

export interface AccessibilitySettings {
  fontSize: 'small' | 'medium' | 'large' | 'x-large';
  contrast: 'normal' | 'high';
  motion: 'normal' | 'reduced';
  screenReader: boolean;
  keyboard: boolean;
  focusVisible: boolean;
}

export interface NavigationState {
  currentPath: string;
  previousPath: string;
  breadcrumbs: BreadcrumbItem[];
  menuOpen: boolean;
  sidebarCollapsed: boolean;
}

export interface BreadcrumbItem {
  label: string;
  path: string;
  isActive: boolean;
}

export interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: number;
  persona?: string;
  metadata?: Record<string, any>;
}

export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  interactionLatency: number;
  errorCount: number;
  memoryUsage: number;
}

export interface SystemError {
  id: string;
  message: string;
  stack?: string;
  timestamp: number;
  context: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

// ============================================
// AÇÕES DO CONTEXTO
// ============================================

export type GlobalAction = 
  | { type: 'SET_USER'; payload: { userId: string; sessionId: string } }
  | { type: 'UPDATE_PREFERENCES'; payload: Partial<UserPreferences> }
  | { type: 'UPDATE_PROGRESS'; payload: Partial<UserProgress> }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' | 'auto' }
  | { type: 'UPDATE_ACCESSIBILITY'; payload: Partial<AccessibilitySettings> }
  | { type: 'NAVIGATE'; payload: { path: string; previousPath: string } }
  | { type: 'SET_MODULE'; payload: { module: string; step: string } }
  | { type: 'UPDATE_COMPLETION'; payload: { module: string; completion: number } }
  | { type: 'SET_PERSONA'; payload: string }
  | { type: 'ADD_CHAT_MESSAGE'; payload: ChatMessage }
  | { type: 'UPDATE_CONTEXT'; payload: { key: string; value: string | number | boolean | object | null } }
  | { type: 'SET_ONLINE_STATUS'; payload: boolean }
  | { type: 'UPDATE_PERFORMANCE'; payload: Partial<PerformanceMetrics> }
  | { type: 'ADD_ERROR'; payload: SystemError }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'RESET_STATE' };

// ============================================
// REDUCER DO CONTEXTO GLOBAL
// ============================================

const initialState: GlobalState = {
  userId: '',
  sessionId: '',
  userPreferences: {
    language: 'pt-BR',
    fontSize: 16,
    highContrast: false,
    reduceMotion: false,
    screenReader: false,
    keyboardNavigation: false,
    notificationsEnabled: true,
    dataTracking: true
  },
  userProgress: {
    modulesCompleted: [],
    currentModule: '',
    totalTimeSpent: 0,
    streakDays: 0,
    lastAccess: Date.now(),
    achievements: [],
    learningPath: []
  },
  theme: 'light',
  accessibility: {
    fontSize: 'medium',
    contrast: 'normal',
    motion: 'normal',
    screenReader: false,
    keyboard: false,
    focusVisible: true
  },
  navigation: {
    currentPath: '/',
    previousPath: '',
    breadcrumbs: [],
    menuOpen: false,
    sidebarCollapsed: false
  },
  currentModule: '',
  currentStep: '',
  completionStatus: {},
  currentPersona: '',
  chatHistory: [],
  contextualData: {},
  isOnline: true,
  performance: {
    loadTime: 0,
    renderTime: 0,
    interactionLatency: 0,
    errorCount: 0,
    memoryUsage: 0
  },
  errors: []
};

function globalReducer(state: GlobalState, action: GlobalAction): GlobalState {
  switch (action.type) {
    case 'SET_USER':
      return {
        ...state,
        userId: action.payload.userId,
        sessionId: action.payload.sessionId
      };
      
    case 'UPDATE_PREFERENCES':
      return {
        ...state,
        userPreferences: { ...state.userPreferences, ...action.payload }
      };
      
    case 'UPDATE_PROGRESS':
      return {
        ...state,
        userProgress: { ...state.userProgress, ...action.payload }
      };
      
    case 'SET_THEME':
      return {
        ...state,
        theme: action.payload
      };
      
    case 'UPDATE_ACCESSIBILITY':
      return {
        ...state,
        accessibility: { ...state.accessibility, ...action.payload }
      };
      
    case 'NAVIGATE':
      return {
        ...state,
        navigation: {
          ...state.navigation,
          currentPath: action.payload.path,
          previousPath: action.payload.previousPath,
          breadcrumbs: generateBreadcrumbs(action.payload.path)
        }
      };
      
    case 'SET_MODULE':
      return {
        ...state,
        currentModule: action.payload.module,
        currentStep: action.payload.step
      };
      
    case 'UPDATE_COMPLETION':
      return {
        ...state,
        completionStatus: {
          ...state.completionStatus,
          [action.payload.module]: action.payload.completion
        }
      };
      
    case 'SET_PERSONA':
      return {
        ...state,
        currentPersona: action.payload
      };
      
    case 'ADD_CHAT_MESSAGE':
      return {
        ...state,
        chatHistory: [...state.chatHistory, action.payload].slice(-50) // Limit history
      };
      
    case 'UPDATE_CONTEXT':
      return {
        ...state,
        contextualData: {
          ...state.contextualData,
          [action.payload.key]: action.payload.value
        }
      };
      
    case 'SET_ONLINE_STATUS':
      return {
        ...state,
        isOnline: action.payload
      };
      
    case 'UPDATE_PERFORMANCE':
      return {
        ...state,
        performance: { ...state.performance, ...action.payload }
      };
      
    case 'ADD_ERROR':
      return {
        ...state,
        errors: [...state.errors, action.payload].slice(-10), // Keep last 10 errors
        performance: {
          ...state.performance,
          errorCount: state.performance.errorCount + 1
        }
      };
      
    case 'CLEAR_ERRORS':
      return {
        ...state,
        errors: []
      };
      
    case 'RESET_STATE':
      return { ...initialState, userId: state.userId, sessionId: state.sessionId };
      
    default:
      return state;
  }
}

// ============================================
// CONTEXTO GLOBAL E PROVIDER
// ============================================

interface GlobalContextType {
  state: GlobalState;
  dispatch: React.Dispatch<GlobalAction>;
  
  // Helper functions
  setUser: (userId: string, sessionId: string) => void;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  updateProgress: (progress: Partial<UserProgress>) => void;
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  updateAccessibility: (settings: Partial<AccessibilitySettings>) => void;
  navigate: (path: string) => void;
  setModule: (module: string, step: string) => void;
  updateCompletion: (module: string, completion: number) => void;
  setPersona: (persona: string) => void;
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  updateContext: (key: string, value: string | number | boolean | object | null) => void;
  setOnlineStatus: (isOnline: boolean) => void;
  updatePerformance: (metrics: Partial<PerformanceMetrics>) => void;
  addError: (error: Omit<SystemError, 'id' | 'timestamp'>) => void;
  clearErrors: () => void;
  resetState: () => void;
  
  // Computed values
  isModuleCompleted: (module: string) => boolean;
  getCompletionRate: () => number;
  hasErrors: boolean;
  criticalErrors: SystemError[];
  isAccessibilityEnabled: boolean;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

// ============================================
// PROVIDER COMPONENT
// ============================================

interface GlobalContextProviderProps {
  children: React.ReactNode;
  initialData?: Partial<GlobalState>;
}

export const GlobalContextProvider: React.FC<GlobalContextProviderProps> = ({
  children,
  initialData = {}
}) => {
  const [state, dispatch] = useReducer(globalReducer, {
    ...initialState,
    ...initialData
  });

  // Integration with tracking (optional)
  let tracking = null;
  try {
    tracking = useTrackingContext();
  } catch (error) {
    // Tracking context not available yet, will sync later
    console.log('Tracking context not available, continuing without it');
  }

  // Sync with tracking context when available
  useEffect(() => {
    if (tracking?.isInitialized) {
      dispatch({
        type: 'SET_USER',
        payload: {
          userId: tracking.userId,
          sessionId: tracking.sessionId
        }
      });
    }
  }, [tracking?.isInitialized, tracking?.userId, tracking?.sessionId]);

  // Online status monitoring
  useEffect(() => {
    const handleOnline = () => dispatch({ type: 'SET_ONLINE_STATUS', payload: true });
    const handleOffline = () => dispatch({ type: 'SET_ONLINE_STATUS', payload: false });
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Performance monitoring
  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          dispatch({
            type: 'UPDATE_PERFORMANCE',
            payload: {
              loadTime: navEntry.loadEventEnd - navEntry.loadEventStart,
              renderTime: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart
            }
          });
        }
      });
    });

    observer.observe({ entryTypes: ['navigation', 'measure'] });
    return () => observer.disconnect();
  }, []);

  // Persistence
  useEffect(() => {
    const saveState = () => {
      try {
        localStorage.setItem('global-context-state', JSON.stringify({
          userPreferences: state.userPreferences,
          userProgress: state.userProgress,
          theme: state.theme,
          accessibility: state.accessibility,
          completionStatus: state.completionStatus
        }));
      } catch (error) {
        console.warn('Failed to save global state:', error);
      }
    };

    const debounceTimer = setTimeout(saveState, 1000);
    return () => clearTimeout(debounceTimer);
  }, [state.userPreferences, state.userProgress, state.theme, state.accessibility, state.completionStatus]);

  // Load saved state
  useEffect(() => {
    try {
      const saved = localStorage.getItem('global-context-state');
      if (saved) {
        const data = JSON.parse(saved);
        if (data.userPreferences) {
          dispatch({ type: 'UPDATE_PREFERENCES', payload: data.userPreferences });
        }
        if (data.userProgress) {
          dispatch({ type: 'UPDATE_PROGRESS', payload: data.userProgress });
        }
        if (data.theme) {
          dispatch({ type: 'SET_THEME', payload: data.theme });
        }
        if (data.accessibility) {
          dispatch({ type: 'UPDATE_ACCESSIBILITY', payload: data.accessibility });
        }
        if (data.completionStatus) {
          Object.entries(data.completionStatus).forEach(([module, completion]) => {
            dispatch({ type: 'UPDATE_COMPLETION', payload: { module, completion: completion as number } });
          });
        }
      }
    } catch (error) {
      console.warn('Failed to load global state:', error);
    }
  }, []);

  // Helper functions
  const helpers = useMemo(() => ({
    setUser: (userId: string, sessionId: string) => 
      dispatch({ type: 'SET_USER', payload: { userId, sessionId } }),
    
    updatePreferences: (preferences: Partial<UserPreferences>) =>
      dispatch({ type: 'UPDATE_PREFERENCES', payload: preferences }),
    
    updateProgress: (progress: Partial<UserProgress>) =>
      dispatch({ type: 'UPDATE_PROGRESS', payload: progress }),
    
    setTheme: (theme: 'light' | 'dark' | 'auto') =>
      dispatch({ type: 'SET_THEME', payload: theme }),
    
    updateAccessibility: (settings: Partial<AccessibilitySettings>) =>
      dispatch({ type: 'UPDATE_ACCESSIBILITY', payload: settings }),
    
    navigate: (path: string) =>
      dispatch({ type: 'NAVIGATE', payload: { path, previousPath: state.navigation.currentPath } }),
    
    setModule: (module: string, step: string) =>
      dispatch({ type: 'SET_MODULE', payload: { module, step } }),
    
    updateCompletion: (module: string, completion: number) =>
      dispatch({ type: 'UPDATE_COMPLETION', payload: { module, completion } }),
    
    setPersona: (persona: string) =>
      dispatch({ type: 'SET_PERSONA', payload: persona }),
    
    addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) =>
      dispatch({ 
        type: 'ADD_CHAT_MESSAGE', 
        payload: { 
          ...message, 
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now()
        }
      }),
    
    updateContext: (key: string, value: string | number | boolean | object | null) =>
      dispatch({ type: 'UPDATE_CONTEXT', payload: { key, value } }),
    
    setOnlineStatus: (isOnline: boolean) =>
      dispatch({ type: 'SET_ONLINE_STATUS', payload: isOnline }),
    
    updatePerformance: (metrics: Partial<PerformanceMetrics>) =>
      dispatch({ type: 'UPDATE_PERFORMANCE', payload: metrics }),
    
    addError: (error: Omit<SystemError, 'id' | 'timestamp'>) =>
      dispatch({ 
        type: 'ADD_ERROR', 
        payload: {
          ...error,
          id: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: Date.now()
        }
      }),
    
    clearErrors: () => dispatch({ type: 'CLEAR_ERRORS' }),
    resetState: () => dispatch({ type: 'RESET_STATE' })
  }), [state.navigation.currentPath]);

  // Computed values
  const computed = useMemo(() => ({
    isModuleCompleted: (module: string) => (state.completionStatus[module] || 0) >= 1,
    getCompletionRate: () => {
      const total = Object.keys(state.completionStatus).length;
      const completed = Object.values(state.completionStatus).filter(c => c >= 1).length;
      return total > 0 ? completed / total : 0;
    },
    hasErrors: state.errors.length > 0,
    criticalErrors: state.errors.filter(e => e.severity === 'critical'),
    isAccessibilityEnabled: state.accessibility.screenReader || state.accessibility.keyboard || 
                           state.accessibility.contrast === 'high' || state.accessibility.fontSize !== 'medium'
  }), [state.completionStatus, state.errors, state.accessibility]);

  const value: GlobalContextType = {
    state,
    dispatch,
    ...helpers,
    ...computed
  };

  return (
    <GlobalContext.Provider value={value}>
      {children}
    </GlobalContext.Provider>
  );
};

// ============================================
// HOOKS PARA USAR O CONTEXTO
// ============================================

export const useGlobalContext = (): GlobalContextType => {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error('useGlobalContext must be used within GlobalContextProvider');
  }
  return context;
};

// Hooks especializados
export const useGlobalUser = () => {
  const { state } = useGlobalContext();
  return {
    userId: state.userId,
    sessionId: state.sessionId,
    preferences: state.userPreferences,
    progress: state.userProgress
  };
};

export const useGlobalTheme = () => {
  const { state, setTheme, updateAccessibility } = useGlobalContext();
  return {
    theme: state.theme,
    accessibility: state.accessibility,
    setTheme,
    updateAccessibility
  };
};

export const useGlobalNavigation = () => {
  const { state, navigate } = useGlobalContext();
  return {
    navigation: state.navigation,
    navigate,
    currentPath: state.navigation.currentPath,
    previousPath: state.navigation.previousPath,
    breadcrumbs: state.navigation.breadcrumbs
  };
};

export const useGlobalModule = () => {
  const { state, setModule, updateCompletion, isModuleCompleted, getCompletionRate } = useGlobalContext();
  return {
    currentModule: state.currentModule,
    currentStep: state.currentStep,
    completionStatus: state.completionStatus,
    setModule,
    updateCompletion,
    isModuleCompleted,
    getCompletionRate
  };
};

export const useGlobalChat = () => {
  const { state, setPersona, addChatMessage } = useGlobalContext();
  return {
    currentPersona: state.currentPersona,
    chatHistory: state.chatHistory,
    setPersona,
    addChatMessage
  };
};

export const useGlobalErrors = () => {
  const { state, addError, clearErrors, hasErrors, criticalErrors } = useGlobalContext();
  return {
    errors: state.errors,
    addError,
    clearErrors,
    hasErrors,
    criticalErrors
  };
};

// ============================================
// UTILITÁRIOS
// ============================================

function generateBreadcrumbs(path: string): BreadcrumbItem[] {
  const segments = path.split('/').filter(Boolean);
  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Início', path: '/', isActive: path === '/' }
  ];
  
  let currentPath = '';
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === segments.length - 1;
    
    breadcrumbs.push({
      label: formatPathSegment(segment),
      path: currentPath,
      isActive: isLast
    });
  });
  
  return breadcrumbs;
}

function formatPathSegment(segment: string): string {
  const formatMap: Record<string, string> = {
    'chat': 'Chat',
    'modules': 'Módulos',
    'roteiro-dispensacao': 'Roteiro de Dispensação',
    'hanseniase': 'Hanseníase',
    'diagnostico': 'Diagnóstico',
    'tratamento': 'Tratamento',
    'vida-com-doenca': 'Vida com a Doença',
    'conformidade': 'Conformidade',
    'progress': 'Progresso',
    'login': 'Login',
    'cadastro': 'Cadastro'
  };
  
  return formatMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
}