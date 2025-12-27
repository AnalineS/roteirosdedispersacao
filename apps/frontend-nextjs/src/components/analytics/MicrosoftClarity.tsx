'use client';

import Script from 'next/script';
import { useEffect } from 'react';

declare global {
  interface Window {
    clarity?: (command: string, ...args: unknown[]) => void;
  }
}

interface MicrosoftClarityProps {
  projectId?: string;
  enabled?: boolean;
}

/**
 * Microsoft Clarity Integration
 * Provides heatmaps, session recordings, and user behavior analytics
 * LGPD-compliant configuration for educational platform
 */
export default function MicrosoftClarity({
  projectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID,
  enabled = process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true'
}: MicrosoftClarityProps) {

  useEffect(() => {
    if (!enabled || !projectId || typeof window === 'undefined') return;

    // Configure Clarity settings after load
    const configureClaritySettings = () => {
      if (window.clarity) {
        // Set custom tags for educational platform
        window.clarity('set', 'project_type', 'educational');
        window.clarity('set', 'content_category', 'health_education');
        window.clarity('set', 'lgpd_compliant', 'true');

        if (process.env.NODE_ENV === 'development') {
          console.log('Microsoft Clarity configured:', projectId);
        }
      }
    };

    // Wait for Clarity to load
    const checkClarity = setInterval(() => {
      if (window.clarity) {
        configureClaritySettings();
        clearInterval(checkClarity);
      }
    }, 500);

    // Cleanup
    return () => clearInterval(checkClarity);
  }, [projectId, enabled]);

  // Don't load in development or if disabled
  if (process.env.NODE_ENV !== 'production' || !enabled || !projectId) {
    return null;
  }

  return (
    <Script
      id="microsoft-clarity"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "${projectId}");
        `
      }}
    />
  );
}

/**
 * Hook for Clarity tracking in components
 */
export function useMicrosoftClarity() {
  const setCustomTag = (key: string, value: string) => {
    if (typeof window !== 'undefined' && window.clarity) {
      window.clarity('set', key, value);
    }
  };

  const identifyUser = (userId: string, sessionId?: string, customData?: Record<string, string>) => {
    if (typeof window !== 'undefined' && window.clarity) {
      window.clarity('identify', userId, sessionId, customData);
    }
  };

  const trackEvent = (eventName: string) => {
    if (typeof window !== 'undefined' && window.clarity) {
      window.clarity('event', eventName);
    }
  };

  const upgradeSession = (reason: string) => {
    if (typeof window !== 'undefined' && window.clarity) {
      window.clarity('upgrade', reason);
    }
  };

  return {
    setCustomTag,
    identifyUser,
    trackEvent,
    upgradeSession,
    isLoaded: typeof window !== 'undefined' && !!window.clarity
  };
}
