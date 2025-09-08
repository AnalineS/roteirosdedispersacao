'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useIntegratedTracking, type IntegratedTrackingConfig } from '@/hooks/useIntegratedTracking';
import type { UserPreferences } from '@/services/UserTrackingService';

// ============================================
// CONTEXTO DE TRACKING INTEGRADO
// ============================================

interface IntegratedTrackingContextType {
  sessionId: string;
  userId: string;
  isInitialized: boolean;
  trackInteraction: (type: any, element: string, metadata?: Record<string, any>) => void;
  trackPageView: (page: string, title?: string) => void;
  trackModuleProgress: (module: string, step: string, completionRate: number, timeSpent?: number) => void;
  trackChatInteraction: (chatType: 'persona' | 'general', message: string, responseTime?: number, persona?: string) => void;
  trackError: (errorType: string, errorMessage: string, component?: string, stack?: string) => void;
  trackFeedback: (type: 'quick' | 'detailed', rating: number, comments?: string, persona?: string) => void;
  trackSearch: (searchTerm: string, resultsCount: number, searchType?: string) => void;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  getLocalAnalytics: () => any;
  getUserProgress: () => any;
  getHeatmapData: () => Record<string, number>;
  googleAnalyticsLoaded: boolean;
  localTrackingEnabled: boolean;
}

const IntegratedTrackingContext = createContext<IntegratedTrackingContextType | undefined>(undefined);

// ============================================
// PROVIDER DO TRACKING INTEGRADO
// ============================================

interface IntegratedTrackingProviderProps {
  children: React.ReactNode;
  config?: IntegratedTrackingConfig;
  userId?: string;
}

export const IntegratedTrackingProvider: React.FC<IntegratedTrackingProviderProps> = ({
  children,
  config = {},
  userId
}) => {
  const [contextUserId, setContextUserId] = useState(userId || '');
  
  const tracking = useIntegratedTracking({
    enableGoogleAnalytics: true,
    enableLocalTracking: true,
    syncWithGA: true,
    userId: contextUserId,
    ...config
  });

  // Atualizar userId quando mudado externamente
  useEffect(() => {
    if (userId && userId !== contextUserId) {
      setContextUserId(userId);
    }
  }, [userId, contextUserId]);

  // Auto-track page changes
  useEffect(() => {
    if (tracking.isInitialized && typeof window !== 'undefined') {
      const handleRouteChange = () => {
        const currentPath = window.location.pathname;
        const currentTitle = document.title;
        tracking.trackPageView(currentPath, currentTitle);
      };

      // Track initial page
      handleRouteChange();

      // Listen for route changes in Next.js
      window.addEventListener('popstate', handleRouteChange);
      
      // Listen for pushState/replaceState (Next.js router changes)
      const originalPushState = history.pushState;
      const originalReplaceState = history.replaceState;
      
      history.pushState = function(...args) {
        originalPushState.apply(history, args);
        setTimeout(handleRouteChange, 0);
      };
      
      history.replaceState = function(...args) {
        originalReplaceState.apply(history, args);
        setTimeout(handleRouteChange, 0);
      };

      return () => {
        window.removeEventListener('popstate', handleRouteChange);
        history.pushState = originalPushState;
        history.replaceState = originalReplaceState;
      };
    }
  }, [tracking.isInitialized, tracking.trackPageView]);

  // Auto-track scroll interactions
  useEffect(() => {
    if (tracking.isInitialized && typeof window !== 'undefined') {
      let scrollTimer: NodeJS.Timeout;
      let lastScrollY = 0;
      let scrollDepth = 0;
      
      const handleScroll = () => {
        const currentScrollY = window.scrollY;
        const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
        const currentDepth = Math.min(100, Math.round((currentScrollY / documentHeight) * 100));
        
        // Track significant scroll milestones
        if (currentDepth > scrollDepth && currentDepth % 25 === 0 && currentDepth > 0) {
          tracking.trackInteraction('scroll', 'page_scroll', {
            scroll_depth: currentDepth,
            direction: currentScrollY > lastScrollY ? 'down' : 'up',
            page: window.location.pathname
          });
          scrollDepth = currentDepth;
        }
        
        lastScrollY = currentScrollY;
        
        // Track scroll end
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(() => {
          if (currentDepth > 90) {
            tracking.trackInteraction('scroll', 'page_bottom_reached', {
              final_scroll_depth: currentDepth,
              page: window.location.pathname
            });
          }
        }, 1500);
      };

      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => {
        window.removeEventListener('scroll', handleScroll);
        clearTimeout(scrollTimer);
      };
    }
  }, [tracking.isInitialized, tracking.trackInteraction]);

  // Auto-track click interactions
  useEffect(() => {
    if (tracking.isInitialized && typeof window !== 'undefined') {
      const handleClick = (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        if (!target) return;

        const elementInfo = {
          tagName: target.tagName.toLowerCase(),
          className: target.className,
          id: target.id,
          text: target.textContent?.substring(0, 100) || '',
          href: target.getAttribute('href') || '',
          type: target.getAttribute('type') || '',
          page: window.location.pathname
        };

        // Track diferentes tipos de elementos
        let elementType = 'generic_click';
        let elementName = target.tagName.toLowerCase();

        if (target.tagName === 'A') {
          elementType = 'link_click';
          elementName = target.getAttribute('href') || 'link';
        } else if (target.tagName === 'BUTTON') {
          elementType = 'button_click';
          elementName = target.textContent?.substring(0, 30) || 'button';
        } else if (target.tagName === 'INPUT') {
          elementType = 'input_click';
          elementName = target.getAttribute('type') || 'input';
        } else if (target.closest('form')) {
          elementType = 'form_element_click';
          elementName = `form_${target.tagName.toLowerCase()}`;
        }

        tracking.trackInteraction('click', elementName, {
          element_type: elementType,
          ...elementInfo
        });
      };

      document.addEventListener('click', handleClick, true);
      return () => document.removeEventListener('click', handleClick, true);
    }
  }, [tracking.isInitialized, tracking.trackInteraction]);

  const value: IntegratedTrackingContextType = {
    sessionId: tracking.sessionId,
    userId: tracking.userId,
    isInitialized: tracking.isInitialized,
    trackInteraction: tracking.trackInteraction,
    trackPageView: tracking.trackPageView,
    trackModuleProgress: tracking.trackModuleProgress,
    trackChatInteraction: tracking.trackChatInteraction,
    trackError: tracking.trackError,
    trackFeedback: tracking.trackFeedback,
    trackSearch: tracking.trackSearch,
    updatePreferences: tracking.updatePreferences,
    getLocalAnalytics: tracking.getLocalAnalytics,
    getUserProgress: tracking.getUserProgress,
    getHeatmapData: tracking.getHeatmapData,
    googleAnalyticsLoaded: tracking.googleAnalyticsLoaded,
    localTrackingEnabled: tracking.localTrackingEnabled
  };

  return (
    <IntegratedTrackingContext.Provider value={value}>
      {children}
    </IntegratedTrackingContext.Provider>
  );
};

// ============================================
// HOOK PARA USAR O CONTEXTO
// ============================================

export const useTrackingContext = (): IntegratedTrackingContextType => {
  const context = useContext(IntegratedTrackingContext);
  if (!context) {
    throw new Error('useTrackingContext must be used within IntegratedTrackingProvider');
  }
  return context;
};

// ============================================
// HOOK SIMPLIFICADO
// ============================================

export const useSimpleTrack = () => {
  const tracking = useTrackingContext();
  
  return {
    track: tracking.trackInteraction,
    trackPage: tracking.trackPageView,
    trackModule: tracking.trackModuleProgress,
    trackChat: tracking.trackChatInteraction,
    trackError: tracking.trackError,
    trackFeedback: tracking.trackFeedback,
    trackSearch: tracking.trackSearch,
    userId: tracking.userId,
    sessionId: tracking.sessionId
  };
};

// ============================================
// COMPONENTE DE DEBUG (DEVELOPMENT ONLY)
// ============================================

export const TrackingDebugPanel: React.FC = () => {
  const tracking = useTrackingContext();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      right: '10px',
      background: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9998,
      maxWidth: '300px'
    }}>
      <strong>Tracking Debug</strong>
      <div>Session: {tracking.sessionId.substring(0, 8)}...</div>
      <div>User: {tracking.userId || 'anonymous'}</div>
      <div>GA: {tracking.googleAnalyticsLoaded ? '✅' : '❌'}</div>
      <div>Local: {tracking.localTrackingEnabled ? '✅' : '❌'}</div>
      <div>Init: {tracking.isInitialized ? '✅' : '❌'}</div>
    </div>
  );
};

export default IntegratedTrackingProvider;