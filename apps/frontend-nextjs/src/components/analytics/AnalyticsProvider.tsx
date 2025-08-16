'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Analytics from '@/services/analytics';

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    // Initialize GA4 on mount
    Analytics.init();
    
    // Track initial page view
    Analytics.pageView(window.location.pathname + window.location.search);
    
    // Track peak hour on mount
    Analytics.peakHour();
  }, []);

  useEffect(() => {
    // Track page views on route change
    Analytics.pageView(pathname);
  }, [pathname]);

  // Track errors globally
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      Analytics.exception(`${event.message} at ${event.filename}:${event.lineno}`, false);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      Analytics.exception(`Unhandled Promise Rejection: ${event.reason}`, false);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return <>{children}</>;
}