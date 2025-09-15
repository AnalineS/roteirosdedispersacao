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

  let userId = localStorage.getItem("ux_user_id");
  if (!userId) {
    userId = `user_${generateUUID()}`;
    localStorage.setItem("ux_user_id", userId);
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
        console.debug("UX tracking failed:", response.statusText);
      }
    } catch (error) {
      console.debug("UX tracking error:", error);
    }
  }, []);

  // Track user interactions
  const trackInteraction = useCallback(
    async (action: string, element: string, metadata?: any) => {
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
        console.debug("Interaction tracking error:", error);
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
        console.debug("Error tracking failed:", trackingError);
      }
    },
    [pathname, enableErrorTracking],
  );

  // Track Web Vitals
  const trackWebVitals = useCallback(
    async (metrics: any) => {
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
        console.debug("Web Vitals tracking error:", error);
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

    let webVitalsMetrics: any = {};

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
        console.debug("LCP observer not supported");
      }

      // FID (First Input Delay)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          webVitalsMetrics.fid = entry.processingStart - entry.startTime;
          trackWebVitals(webVitalsMetrics);
        });
      });

      try {
        fidObserver.observe({ entryTypes: ["first-input"] });
      } catch (e) {
        console.debug("FID observer not supported");
      }

      // CLS (Cumulative Layout Shift)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        webVitalsMetrics.cls = clsValue;
      });

      try {
        clsObserver.observe({ entryTypes: ["layout-shift"] });
      } catch (e) {
        console.debug("CLS observer not supported");
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
        console.debug("FCP observer not supported");
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
          return React.cloneElement(child as React.ReactElement<any>, {
            uxTracking: trackingContext,
          });
        }
        return child;
      })}
    </div>
  );
};

export default UXTrackingWrapper;
