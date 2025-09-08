// ============================================
// CONTEXT TYPES - Substituição de any em contexts
// ============================================

import { ReactNode } from 'react';
import { User, UserProgress, ChatMessage, Module } from './api';
import { BaseFormData, ValidationResult } from './forms';

// Base context types
export interface BaseContextType<T = unknown> {
  state: T;
  loading: boolean;
  error: string | null;
}

export interface ContextProviderProps {
  children: ReactNode;
}

// Auth Context
export interface AuthContextState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthContextType extends BaseContextType<AuthContextState> {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (userData: RegisterUserData) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  refreshAuth: () => Promise<void>;
  clearError: () => void;
}

export interface RegisterUserData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

// Theme Context
export interface ThemeState {
  mode: 'light' | 'dark' | 'auto';
  colorScheme: 'default' | 'high-contrast' | 'colorblind';
  fontSize: 'sm' | 'md' | 'lg' | 'xl';
  reducedMotion: boolean;
  customColors?: Record<string, string>;
}

export interface ThemeContextType extends BaseContextType<ThemeState> {
  setMode: (mode: ThemeState['mode']) => void;
  setColorScheme: (scheme: ThemeState['colorScheme']) => void;
  setFontSize: (size: ThemeState['fontSize']) => void;
  setReducedMotion: (reduced: boolean) => void;
  setCustomColors: (colors: Record<string, string>) => void;
  resetTheme: () => void;
}

// Global Context (já existente, tipando melhor)
export interface GlobalState {
  user: {
    userId: string;
    sessionId: string;
    preferences: ContextUserPreferences;
    progress: UserProgressData;
  };
  ui: {
    theme: ThemeState['mode'];
    accessibility: AccessibilitySettings;
    navigation: NavigationState;
  };
  app: {
    currentModule: string;
    currentStep: string;
    completionStatus: Record<string, number>;
    isOnline: boolean;
  };
  chat: {
    currentPersona: string;
    history: ChatMessage[];
    contextualData: Record<string, unknown>;
  };
  system: {
    performance: PerformanceMetrics;
    errors: SystemError[];
    version: string;
  };
}

export interface ContextUserPreferences {
  language: string;
  fontSize: number;
  highContrast: boolean;
  reduceMotion: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
  notificationsEnabled: boolean;
  dataTracking: boolean;
}

export interface UserProgressData {
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
  breadcrumbs: BreadcrumbData[];
  menuOpen: boolean;
  sidebarCollapsed: boolean;
}

export interface BreadcrumbData {
  label: string;
  path: string;
  isActive: boolean;
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

// Global Context Actions
export type GlobalAction = 
  | { type: 'SET_USER'; payload: { userId: string; sessionId: string } }
  | { type: 'UPDATE_PREFERENCES'; payload: Partial<ContextUserPreferences> }
  | { type: 'UPDATE_PROGRESS'; payload: Partial<UserProgressData> }
  | { type: 'SET_THEME'; payload: ThemeState['mode'] }
  | { type: 'UPDATE_ACCESSIBILITY'; payload: Partial<AccessibilitySettings> }
  | { type: 'NAVIGATE'; payload: { path: string; previousPath: string } }
  | { type: 'SET_MODULE'; payload: { module: string; step: string } }
  | { type: 'UPDATE_COMPLETION'; payload: { module: string; completion: number } }
  | { type: 'SET_PERSONA'; payload: string }
  | { type: 'ADD_CHAT_MESSAGE'; payload: ChatMessage }
  | { type: 'UPDATE_CONTEXT'; payload: { key: string; value: unknown } }
  | { type: 'SET_ONLINE_STATUS'; payload: boolean }
  | { type: 'UPDATE_PERFORMANCE'; payload: Partial<PerformanceMetrics> }
  | { type: 'ADD_ERROR'; payload: SystemError }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'RESET_STATE' };

export interface GlobalContextType {
  state: GlobalState;
  dispatch: React.Dispatch<GlobalAction>;
  // Helper functions
  setUser: (userId: string, sessionId: string) => void;
  updatePreferences: (preferences: Partial<ContextUserPreferences>) => void;
  updateProgress: (progress: Partial<UserProgressData>) => void;
  setTheme: (theme: ThemeState['mode']) => void;
  updateAccessibility: (settings: Partial<AccessibilitySettings>) => void;
  navigate: (path: string) => void;
  setModule: (module: string, step: string) => void;
  updateCompletion: (module: string, completion: number) => void;
  setPersona: (persona: string) => void;
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  updateContext: (key: string, value: unknown) => void;
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

// Notification Context
export interface NotificationState {
  notifications: NotificationMessage[];
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  maxNotifications: number;
  autoClose: boolean;
  duration: number;
}

export interface NotificationMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  action?: NotificationAction;
  timestamp: number;
  duration?: number;
  persistent?: boolean;
}

export interface NotificationAction {
  label: string;
  handler: () => void;
  style?: 'primary' | 'secondary';
}

export interface NotificationContextType extends BaseContextType<NotificationState> {
  showNotification: (notification: Omit<NotificationMessage, 'id' | 'timestamp'>) => string;
  hideNotification: (id: string) => void;
  clearAllNotifications: () => void;
  updateSettings: (settings: Partial<Omit<NotificationState, 'notifications'>>) => void;
}

// Form Context
export interface FormContextType<T extends BaseFormData = BaseFormData> {
  formData: T;
  errors: Record<keyof T, string>;
  touched: Record<keyof T, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
  setValue: (field: keyof T, value: T[keyof T]) => void;
  setError: (field: keyof T, error: string) => void;
  clearError: (field: keyof T) => void;
  setTouched: (field: keyof T, touched?: boolean) => void;
  validate: () => ValidationResult;
  validateField: (field: keyof T) => boolean;
  reset: () => void;
  submit: () => Promise<void>;
}

// Chat Context
export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  currentPersona: string | null;
  conversationId: string | null;
  typing: boolean;
  connected: boolean;
}

export interface ChatContextType extends BaseContextType<ChatState> {
  sendMessage: (content: string, persona?: string) => Promise<void>;
  clearMessages: () => void;
  setPersona: (persona: string) => void;
  startNewConversation: () => void;
  retry: () => void;
  setTyping: (typing: boolean) => void;
}

// Module Context
export interface ModuleState {
  currentModule: Module | null;
  progress: UserProgress | null;
  isLoading: boolean;
  error: string | null;
  availableModules: Module[];
}

export interface ModuleContextType extends BaseContextType<ModuleState> {
  loadModule: (moduleId: string) => Promise<void>;
  updateProgress: (progress: Partial<UserProgress>) => void;
  completeModule: () => Promise<void>;
  getNextModule: () => Module | null;
  getPreviousModule: () => Module | null;
  searchModules: (query: string) => Module[];
}

// Settings Context
export interface SettingsState {
  general: GeneralSettings;
  privacy: PrivacySettings;
  notifications: NotificationSettings;
  accessibility: AccessibilitySettings;
  advanced: AdvancedSettings;
}

export interface GeneralSettings {
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
}

export interface PrivacySettings {
  dataCollection: boolean;
  analytics: boolean;
  crashReporting: boolean;
  profileVisibility: 'public' | 'private' | 'friends';
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  inApp: boolean;
  marketing: boolean;
  reminders: boolean;
}

export interface AdvancedSettings {
  debugMode: boolean;
  experimentalFeatures: boolean;
  cacheSize: number;
  autoSave: boolean;
}

export interface SettingsContextType extends BaseContextType<SettingsState> {
  updateGeneralSettings: (settings: Partial<GeneralSettings>) => void;
  updatePrivacySettings: (settings: Partial<PrivacySettings>) => void;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  updateAccessibilitySettings: (settings: Partial<AccessibilitySettings>) => void;
  updateAdvancedSettings: (settings: Partial<AdvancedSettings>) => void;
  resetSettings: () => void;
  exportSettings: () => string;
  importSettings: (settings: string) => void;
}

// Utility types
export type ContextReducer<S, A> = (state: S, action: A) => S;
export type ContextDispatch<A> = React.Dispatch<A>;
export type ContextState<T> = T extends BaseContextType<infer S> ? S : never;
export type ContextActions<T> = Omit<T, keyof BaseContextType<unknown>>;