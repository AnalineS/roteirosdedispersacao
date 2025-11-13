/**
 * UX Tracking Wrapper - Integra todos os sistemas de monitoramento
 * Conecta frontend com UXMonitoringManager do backend
 * Tracking automático de interações e métricas
 *
 * Data: 09 de Janeiro de 2025
 * Fase: Ativação de Monitoramento UX
 */

"use client";

import React, { useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { safeLocalStorage } from "@/hooks/useClientStorage";
// Simple UUID v4 generator to avoid external dependency
const generateUUID = (): string => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

interface UXTrackingWrapperProps {
  children: React.ReactNode;
  userId?: string;
  enableWebVitals?: boolean;
  enableErrorTracking?: boolean;
  enableInteractionTracking?: boolean;
}

interface InteractionMetadata {
  tag?: string;
  id?: string;
  class?: string;
  text?: string;
  [key: string]: unknown;
}

interface WebVitalsMetrics {
  lcp?: number;
  fid?: number;
  cls?: number;
  fcp?: number;
  ttfb?: number;
}

interface PerformanceEntryWithDetails extends PerformanceEntry {
  processingStart?: number;
  hadRecentInput?: boolean;
  value?: number;
}

// Generate or get session ID
const getSessionId = (): string => {
  if (typeof window === "undefined") return "";

  let sessionId = sessionStorage.getItem("ux_session_id");
  if (!sessionId) {
    sessionId = generateUUID();
    sessionStorage.setItem("ux_session_id", sessionId);
  }
  return sessionId;
};

// Generate or get user ID
const getUserId = (providedUserId?: string): string => {
  if (providedUserId) return providedUserId;

  if (typeof window === "undefined") return "anonymous";

  let userId = safeLocalStorage()?.getItem("ux_user_id");
  if (!userId) {
    userId = `user_${generateUUID()}`;
    safeLocalStorage()?.setItem("ux_user_id", userId);
  }
  return userId;
};

const UXTrackingWrapper: React.FC<UXTrackingWrapperProps> = ({
  children,
  userId: providedUserId,
  enableWebVitals = true,
  enableErrorTracking = true,
  enableInteractionTracking = true,
}) => {
  const pathname = usePathname();
  const sessionId = useRef<string>("");
  const userId = useRef<string>("");
  const pageLoadTime = useRef<number>(Date.now());
  const interactionCount = useRef<number>(0);

  // Initialize IDs
  useEffect(() => {
    sessionId.current = getSessionId();
    userId.current = getUserId(providedUserId);
  }, [providedUserId]);

  // Track page views
  const trackPageView = useCallback(async (page: string, referrer?: string) => {
    if (!userId.current || !sessionId.current) return;

    try {
      const duration = Date.now() - pageLoadTime.current;

      const response = await fetch("/api/v1/ux/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "page_view",
          user_id: userId.current,
          session_id: sessionId.current,
          data: {
            page,
            duration_ms: duration,
            referrer: referrer || document.referrer,
            timestamp: new Date().toISOString(),
          },
        }),
      });

      if (!response.ok) {
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'ux_tracking_failed', {
            event_category: 'ux_monitoring_error',
            event_label: 'api_response_failed',
            custom_parameters: {
              medical_context: 'ux_tracking_system',
              error_type: 'api_response',
              status_text: response.statusText
            }
          });
        }
      }
    } catch (error) { // eslint-disable-line @typescript-eslint/no-unused-vars
      // Analytics tracking via gtag, error details intentionally not logged
      // to protect patient privacy and medical data
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'ux_tracking_error', {
          event_category: 'ux_monitoring_error',
          event_label: 'api_request_error',
          custom_parameters: {
            medical_context: 'ux_tracking_system',
            error_type: 'network_request'
          }
        });
      }
    }
  }, []);

  // Track user interactions
  const trackInteraction = useCallback(
    async (action: string, element: string, metadata?: InteractionMetadata) => {
      if (!enableInteractionTracking || !userId.current || !sessionId.current)
        return;

      try {
        interactionCount.current++;

        await fetch("/api/v1/ux/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "interaction",
            user_id: userId.current,
            session_id: sessionId.current,
            data: {
              action,
              element,
              page: pathname,
              interaction_count: interactionCount.current,
              metadata: metadata || {},
              timestamp: new Date().toISOString(),
            },
          }),
        });
      } catch (error) {
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'interaction_tracking_error', {
            event_category: 'ux_monitoring_error',
            event_label: 'interaction_capture_failed',
            custom_parameters: {
              medical_context: 'user_interaction_tracking',
              error_type: 'interaction_api'
            }
          });
        }
      }
    },
    [pathname, enableInteractionTracking],
  );

  // Track errors
  const trackError = useCallback(
    async (error: Error, component?: string, severity: string = "medium") => {
      if (!enableErrorTracking || !userId.current || !sessionId.current) return;

      try {
        await fetch("/api/v1/ux/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "error",
            user_id: userId.current,
            session_id: sessionId.current,
            data: {
              error_type: error.name,
              error_message: error.message,
              stack: error.stack,
              component,
              severity,
              page: pathname,
              timestamp: new Date().toISOString(),
            },
          }),
        });
      } catch (trackingError) {
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'error_tracking_failed', {
            event_category: 'ux_monitoring_error',
            event_label: 'error_capture_failed',
            custom_parameters: {
              medical_context: 'error_tracking_system',
              error_type: 'tracking_api'
            }
          });
        }
      }
    },
    [pathname, enableErrorTracking],
  );

  // Track Web Vitals
  const trackWebVitals = useCallback(
    async (metrics: WebVitalsMetrics) => {
      if (!enableWebVitals || !userId.current) return;

      try {
        await fetch("/api/v1/ux/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "web_vitals",
            user_id: userId.current,
            session_id: sessionId.current,
            data: {
              lcp: metrics.lcp || 0,
              fid: metrics.fid || 0,
              cls: metrics.cls || 0,
              fcp: metrics.fcp || 0,
              ttfb: metrics.ttfb || 0,
              page: pathname,
              timestamp: new Date().toISOString(),
            },
          }),
        });
      } catch (error) {
        if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'web_vitals_tracking_error', {
          event_category: 'ux_monitoring_error',
          event_label: 'vitals_measurement_failed',
          custom_parameters: {
            medical_context: 'performance_tracking',
            error_type: 'vitals_api'
          }
        });
      }
      }
    },
    [pathname, enableWebVitals],
  );

  // Track page changes
  useEffect(() => {
    pageLoadTime.current = Date.now();
    if (pathname) {
      trackPageView(pathname);
    }
  }, [pathname, trackPageView]);

  // Global error handler
  useEffect(() => {
    if (!enableErrorTracking) return;

    const handleError = (event: ErrorEvent) => {
      trackError(new Error(event.message), "global", "high");
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error =
        event.reason instanceof Error
          ? event.reason
          : new Error(String(event.reason));
      trackError(error, "promise", "high");
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener(
        "unhandledrejection",
        handleUnhandledRejection,
      );
    };
  }, [enableErrorTracking, trackError]);

  // Web Vitals monitoring
  useEffect(() => {
    if (!enableWebVitals || typeof window === "undefined") return;

    let webVitalsMetrics: WebVitalsMetrics = {};

    // Observe Web Vitals
    if ("PerformanceObserver" in window) {
      // LCP (Largest Contentful Paint)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        webVitalsMetrics.lcp = lastEntry.startTime;

        // Send after LCP is stable
        setTimeout(() => trackWebVitals(webVitalsMetrics), 100);
      });

      try {
        lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });
      } catch (e) {
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'lcp_observer_unsupported', {
            event_category: 'ux_monitoring_warning',
            event_label: 'browser_compatibility_issue',
            custom_parameters: {
              medical_context: 'performance_monitoring',
              metric_type: 'largest_contentful_paint',
              browser: navigator.userAgent
            }
          });
        }
      }

      // FID (First Input Delay)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: PerformanceEntryWithDetails) => {
          if (entry.processingStart !== undefined) {
            webVitalsMetrics.fid = entry.processingStart - entry.startTime;
            trackWebVitals(webVitalsMetrics);
          }
        });
      });

      try {
        fidObserver.observe({ entryTypes: ["first-input"] });
      } catch (e) {
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'fid_observer_unsupported', {
            event_category: 'ux_monitoring_warning',
            event_label: 'browser_compatibility_issue',
            custom_parameters: {
              medical_context: 'performance_monitoring',
              metric_type: 'first_input_delay',
              browser: navigator.userAgent
            }
          });
        }
      }

      // CLS (Cumulative Layout Shift)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          // Type assertion for LayoutShiftEntry (Web API)
          const clsEntry = entry as PerformanceEntry & { hadRecentInput?: boolean; value: number };
          if (!clsEntry.hadRecentInput) {
            clsValue += clsEntry.value;
          }
        }
        webVitalsMetrics.cls = clsValue;
      });

      try {
        clsObserver.observe({ entryTypes: ["layout-shift"] });
      } catch (e) {
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'cls_observer_unsupported', {
            event_category: 'ux_monitoring_warning',
            event_label: 'browser_compatibility_issue',
            custom_parameters: {
              medical_context: 'performance_monitoring',
              metric_type: 'cumulative_layout_shift',
              browser: navigator.userAgent
            }
          });
        }
      }

      // FCP (First Contentful Paint)
      const fcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          webVitalsMetrics.fcp = entry.startTime;
        });
      });

      try {
        fcpObserver.observe({ entryTypes: ["paint"] });
      } catch (e) {
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'fcp_observer_unsupported', {
            event_category: 'ux_monitoring_warning',
            event_label: 'browser_compatibility_issue',
            custom_parameters: {
              medical_context: 'performance_monitoring',
              metric_type: 'first_contentful_paint',
              browser: navigator.userAgent
            }
          });
        }
      }

      // Navigation timing for TTFB
      if ("performance" in window && "timing" in performance) {
        const navTiming = performance.timing;
        webVitalsMetrics.ttfb =
          navTiming.responseStart - navTiming.navigationStart;
      }
    }

    // Fallback timeout to ensure metrics are sent
    const timeout = setTimeout(() => {
      if (Object.keys(webVitalsMetrics).length > 0) {
        trackWebVitals(webVitalsMetrics);
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, [enableWebVitals, trackWebVitals]);

  // Global click tracking
  useEffect(() => {
    if (!enableInteractionTracking) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target) return;

      // Get meaningful element info
      const tagName = target.tagName.toLowerCase();
      const id = target.id;
      const className = target.className;
      const text = target.textContent?.slice(0, 50) || "";

      const element = id
        ? `#${id}`
        : className
          ? `.${className.split(" ")[0]}`
          : text
            ? `${tagName}[${text}]`
            : tagName;

      trackInteraction("click", element, {
        tag: tagName,
        id,
        class: className,
        text: text.slice(0, 20),
      });
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [enableInteractionTracking, trackInteraction]);

  // Provide tracking context to children
  const trackingContext = {
    trackInteraction,
    trackError,
    trackWebVitals,
    userId: userId.current,
    sessionId: sessionId.current,
  };

  return (
    <div data-ux-tracking="enabled">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<{ uxTracking?: typeof trackingContext }>, {
            uxTracking: trackingContext,
          });
        }
        return child;
      })}
    </div>
  );
};

export default UXTrackingWrapper;
