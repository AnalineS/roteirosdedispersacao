'use client';

// ============================================
// SISTEMA DE TRACKING DE USUÁRIO
// ============================================

export interface UserSession {
  userId: string;
  sessionId: string;
  startTime: number;
  lastActivity: number;
  pageViews: string[];
  interactions: UserInteraction[];
  deviceInfo: DeviceInfo;
  preferences: UserPreferences;
  journey: UserJourney[];
}

export interface UserInteraction {
  userId: string;
  type: InteractionType;
  element: string;
  timestamp: number;
  metadata: Record<string, any>;
  sessionId: string;
}

export interface UserJourney {
  userId: string;
  step: string;
  module: string;
  timestamp: number;
  duration: number;
  completionRate: number;
}

export interface DeviceInfo {
  userId: string;
  userAgent: string;
  screenSize: { width: number; height: number };
  isMobile: boolean;
  browser: string;
  os: string;
}

export interface UserPreferences {
  userId: string;
  theme: 'light' | 'dark';
  accessibilityMode: boolean;
  notifications: boolean;
  language: string;
  favoriteModules: string[];
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
}

export interface UserProgress {
  userId: string;
  completedModules: string[];
  currentModule: string;
  totalTimeSpent: number;
  streakDays: number;
  achievements: string[];
  lastSession: number;
}

export type InteractionType = 
  | 'click' 
  | 'scroll' 
  | 'hover' 
  | 'focus' 
  | 'form_submit' 
  | 'navigation' 
  | 'search' 
  | 'download' 
  | 'chat_interaction'
  | 'module_start'
  | 'module_complete';

export interface UserAnalytics {
  totalUsers: number;
  activeUsers: number;
  averageSessionTime: number;
  bounceRate: number;
  topPages: Array<{ page: string; visits: number }>;
  userRetention: { daily: number; weekly: number; monthly: number };
  interactionHeatmap: Record<string, number>;
  conversionFunnels: UserFunnel[];
}

export interface UserFunnel {
  name: string;
  steps: Array<{ 
    name: string; 
    userIds: string[]; 
    conversionRate: number 
  }>;
}

// ============================================
// SERVIÇO DE TRACKING DE USUÁRIO
// ============================================

class UserTrackingService {
  private static instance: UserTrackingService;
  private sessions = new Map<string, UserSession>();
  private analytics: UserAnalytics;
  private listeners = new Set<(data: UserSession) => void>();
  private storageKey = 'user-tracking-data';

  constructor() {
    this.analytics = this.initializeAnalytics();
    this.loadFromStorage();
    this.setupEventListeners();
    this.startSessionCleanup();
  }

  static getInstance(): UserTrackingService {
    if (!UserTrackingService.instance) {
      UserTrackingService.instance = new UserTrackingService();
    }
    return UserTrackingService.instance;
  }

  // ============================================
  // GESTÃO DE SESSÃO
  // ============================================

  startSession(userId?: string): string {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const actualUserId = userId || this.generateAnonymousUserId();
    
    const session: UserSession = {
      userId: actualUserId,
      sessionId,
      startTime: Date.now(),
      lastActivity: Date.now(),
      pageViews: [],
      interactions: [],
      deviceInfo: this.getDeviceInfo(actualUserId),
      preferences: this.getUserPreferences(actualUserId),
      journey: []
    };

    this.sessions.set(sessionId, session);
    this.updateAnalytics(session);
    this.saveToStorage();
    this.notifyListeners(session);

    return sessionId;
  }

  updateSession(sessionId: string, updates: Partial<UserSession>): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      Object.assign(session, updates);
      session.lastActivity = Date.now();
      this.saveToStorage();
      this.notifyListeners(session);
    }
  }

  endSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      const sessionDuration = Date.now() - session.startTime;
      this.trackInteraction(session.userId, {
        type: 'navigation',
        element: 'session_end',
        timestamp: Date.now(),
        metadata: { 
          duration: sessionDuration,
          interactions: session.interactions.length,
          pageViews: session.pageViews.length
        },
        sessionId
      });
      
      this.sessions.delete(sessionId);
      this.saveToStorage();
    }
  }

  // ============================================
  // TRACKING DE INTERAÇÕES
  // ============================================

  trackInteraction(userId: string, interaction: Omit<UserInteraction, 'userId'>): void {
    const fullInteraction: UserInteraction = { ...interaction, userId };
    
    const session = Array.from(this.sessions.values())
      .find(s => s.userId === userId && s.sessionId === interaction.sessionId);
    
    if (session) {
      session.interactions.push(fullInteraction);
      session.lastActivity = Date.now();
      this.updateAnalytics(session);
      this.saveToStorage();
    }
  }

  trackPageView(userId: string, page: string, sessionId?: string): void {
    const activeSession = sessionId ? 
      this.sessions.get(sessionId) : 
      Array.from(this.sessions.values()).find(s => s.userId === userId);

    if (activeSession) {
      activeSession.pageViews.push(page);
      activeSession.lastActivity = Date.now();
      
      this.trackInteraction(userId, {
        type: 'navigation',
        element: page,
        timestamp: Date.now(),
        metadata: { type: 'page_view' },
        sessionId: activeSession.sessionId
      });
    }
  }

  trackUserJourney(userId: string, step: string, module: string, completionRate: number = 1): void {
    const session = Array.from(this.sessions.values()).find(s => s.userId === userId);
    if (session) {
      const journey: UserJourney = {
        userId,
        step,
        module,
        timestamp: Date.now(),
        duration: Date.now() - session.lastActivity,
        completionRate
      };
      
      session.journey.push(journey);
      this.saveToStorage();
    }
  }

  // ============================================
  // GESTÃO DE PREFERÊNCIAS
  // ============================================

  updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): void {
    const sessions = Array.from(this.sessions.values()).filter(s => s.userId === userId);
    sessions.forEach(session => {
      session.preferences = { ...session.preferences, ...preferences };
    });
    
    this.saveUserPreferencesToLocal(userId, preferences);
    this.saveToStorage();
  }

  getUserPreferences(userId: string): UserPreferences {
    const stored = this.loadUserPreferencesFromLocal(userId);
    return stored || {
      userId,
      theme: 'light',
      accessibilityMode: false,
      notifications: true,
      language: 'pt-BR',
      favoriteModules: [],
      learningStyle: 'visual'
    };
  }

  // ============================================
  // ANALYTICS E MÉTRICAS
  // ============================================

  getAnalytics(): UserAnalytics {
    this.updateGlobalAnalytics();
    return { ...this.analytics };
  }

  getUserProgress(userId: string): UserProgress | null {
    const sessions = Array.from(this.sessions.values()).filter(s => s.userId === userId);
    if (sessions.length === 0) return null;

    const allJourneys = sessions.flatMap(s => s.journey);
    const completedModules = [...new Set(
      allJourneys
        .filter(j => j.completionRate >= 1)
        .map(j => j.module)
    )];

    const totalTimeSpent = sessions.reduce((total, session) => {
      return total + (session.lastActivity - session.startTime);
    }, 0);

    return {
      userId,
      completedModules,
      currentModule: allJourneys[allJourneys.length - 1]?.module || '',
      totalTimeSpent,
      streakDays: this.calculateStreakDays(userId),
      achievements: this.calculateAchievements(userId, completedModules.length),
      lastSession: Math.max(...sessions.map(s => s.lastActivity))
    };
  }

  getHeatmapData(): Record<string, number> {
    const heatmap: Record<string, number> = {};
    
    Array.from(this.sessions.values()).forEach(session => {
      session.interactions.forEach(interaction => {
        const key = `${interaction.type}-${interaction.element}`;
        heatmap[key] = (heatmap[key] || 0) + 1;
      });
    });

    return heatmap;
  }

  // ============================================
  // UTILITÁRIOS PRIVADOS
  // ============================================

  private generateAnonymousUserId(): string {
    const stored = safeLocalStorage()?.getItem('anonymous-user-id');
    if (stored) return stored;
    
    const newId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    safeLocalStorage()?.setItem('anonymous-user-id', newId);
    return newId;
  }

  private getDeviceInfo(userId: string): DeviceInfo {
    return {
      userId,
      userAgent: navigator.userAgent,
      screenSize: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      isMobile: window.innerWidth < 768,
      browser: this.detectBrowser(),
      os: this.detectOS()
    };
  }

  private detectBrowser(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Other';
  }

  private detectOS(): string {
    const ua = navigator.userAgent;
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('iOS')) return 'iOS';
    return 'Other';
  }

  private calculateStreakDays(userId: string): number {
    const sessions = Array.from(this.sessions.values())
      .filter(s => s.userId === userId)
      .sort((a, b) => b.startTime - a.startTime);

    if (sessions.length === 0) return 0;

    let streak = 1;
    let currentDate = new Date(sessions[0].startTime);
    
    for (let i = 1; i < sessions.length; i++) {
      const sessionDate = new Date(sessions[i].startTime);
      const dayDiff = Math.floor((currentDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (dayDiff === 1) {
        streak++;
        currentDate = sessionDate;
      } else {
        break;
      }
    }

    return streak;
  }

  private calculateAchievements(userId: string, completedModules: number): string[] {
    const achievements: string[] = [];
    
    if (completedModules >= 1) achievements.push('first_module');
    if (completedModules >= 5) achievements.push('dedicated_learner');
    if (completedModules >= 10) achievements.push('knowledge_master');
    
    const streak = this.calculateStreakDays(userId);
    if (streak >= 7) achievements.push('week_streak');
    if (streak >= 30) achievements.push('month_streak');
    
    return achievements;
  }

  private initializeAnalytics(): UserAnalytics {
    return {
      totalUsers: 0,
      activeUsers: 0,
      averageSessionTime: 0,
      bounceRate: 0,
      topPages: [],
      userRetention: { daily: 0, weekly: 0, monthly: 0 },
      interactionHeatmap: {},
      conversionFunnels: []
    };
  }

  private updateAnalytics(session: UserSession): void {
    // Atualiza métricas básicas
    this.analytics.totalUsers = new Set(
      Array.from(this.sessions.values()).map(s => s.userId)
    ).size;
    
    this.analytics.activeUsers = this.sessions.size;
    
    // Atualiza tempo médio de sessão
    const totalSessionTime = Array.from(this.sessions.values())
      .reduce((total, s) => total + (s.lastActivity - s.startTime), 0);
    this.analytics.averageSessionTime = totalSessionTime / this.sessions.size;
    
    // Atualiza heatmap
    this.analytics.interactionHeatmap = this.getHeatmapData();
  }

  private updateGlobalAnalytics(): void {
    const allSessions = Array.from(this.sessions.values());
    
    // Páginas mais visitadas
    const pageViews: Record<string, number> = {};
    allSessions.forEach(session => {
      session.pageViews.forEach(page => {
        pageViews[page] = (pageViews[page] || 0) + 1;
      });
    });
    
    this.analytics.topPages = Object.entries(pageViews)
      .map(([page, visits]) => ({ page, visits }))
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 10);
  }

  private setupEventListeners(): void {
    if (typeof window !== 'undefined') {
      // Track page visibility changes
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          Array.from(this.sessions.values()).forEach(session => {
            this.trackInteraction(session.userId, {
              type: 'focus',
              element: 'page_blur',
              timestamp: Date.now(),
              metadata: { visibility: 'hidden' },
              sessionId: session.sessionId
            });
          });
        }
      });
      
      // Track unload
      window.addEventListener('beforeunload', () => {
        Array.from(this.sessions.keys()).forEach(sessionId => {
          this.endSession(sessionId);
        });
      });
    }
  }

  private startSessionCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      const inactiveSessions = Array.from(this.sessions.entries())
        .filter(([_, session]) => now - session.lastActivity > 30 * 60 * 1000); // 30 min
      
      inactiveSessions.forEach(([sessionId]) => {
        this.endSession(sessionId);
      });
    }, 5 * 60 * 1000); // Check every 5 minutes
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return; // Skip on server-side rendering
    }
    
    try {
      const data = {
        sessions: Array.from(this.sessions.entries()),
        analytics: this.analytics,
        timestamp: Date.now()
      };
      safeLocalStorage()?.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save tracking data to localStorage:', error);
    }
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return; // Skip on server-side rendering
    }
    
    try {
      const stored = safeLocalStorage()?.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        this.sessions = new Map(data.sessions);
        this.analytics = data.analytics || this.analytics;
      }
    } catch (error) {
      console.warn('Failed to load tracking data from localStorage:', error);
    }
  }

  private saveUserPreferencesToLocal(userId: string, preferences: Partial<UserPreferences>): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return; // Skip on server-side rendering
    }
    
    const key = `user-prefs-${userId}`;
    const existing = this.loadUserPreferencesFromLocal(userId);
    const updated = { ...existing, ...preferences };
    safeLocalStorage()?.setItem(key, JSON.stringify(updated));
  }

  private loadUserPreferencesFromLocal(userId: string): UserPreferences | null {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return null; // Skip on server-side rendering
    }
    
    try {
      const key = `user-prefs-${userId}`;
      const stored = safeLocalStorage()?.getItem(key);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  private notifyListeners(session: UserSession): void {
    this.listeners.forEach(listener => listener(session));
  }

  subscribe(listener: (session: UserSession) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export default UserTrackingService;