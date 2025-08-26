'use client';

import { useEffect, useCallback } from 'react';

interface WebVitalsMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  id: string;
  delta?: number;
  entries: PerformanceEntry[];
}

interface ExtendedWebVitalsData {
  metrics: WebVitalsMetric[];
  timestamp: number;
  url: string;
  userAgent: string;
  connectionType?: string;
  deviceMemory?: number;
  viewport: {
    width: number;
    height: number;
  };
  performance: {
    loadTime: number;
    domContentLoaded: number;
    firstByte: number;
  };
}

// Enhanced thresholds based on Google's 2023 recommendations
const getMetricRating = (name: string, value: number): 'good' | 'needs-improvement' | 'poor' => {
  switch (name) {
    case 'CLS':
      if (value <= 0.1) return 'good';
      if (value <= 0.25) return 'needs-improvement';
      return 'poor';
    case 'LCP':
      if (value <= 2500) return 'good';
      if (value <= 4000) return 'needs-improvement';
      return 'poor';
    case 'INP':
    case 'FID':
      if (value <= 200) return 'good'; // Updated INP threshold
      if (value <= 500) return 'needs-improvement';
      return 'poor';
    case 'FCP':
      if (value <= 1800) return 'good';
      if (value <= 3000) return 'needs-improvement';
      return 'poor';
    case 'TTFB':
      if (value <= 800) return 'good';
      if (value <= 1800) return 'needs-improvement';
      return 'poor';
    default:
      return 'good';
  }
};

// Get performance recommendations
const getPerformanceRecommendation = (name: string, rating: string, value: number): string => {
  if (rating === 'good') return '✅ Excelente performance!';
  
  const recommendations: Record<string, Record<string, string>> = {
    CLS: {
      'needs-improvement': '⚠️ Otimize mudanças de layout: use aspect-ratio em imagens, reserve espaço para anúncios',
      'poor': '❌ Crítico: Elimine layout shifts - adicione dimensões às imagens, evite inserir conteúdo acima do fold'
    },
    LCP: {
      'needs-improvement': '⚠️ Otimize carregamento: comprima imagens, use CDN, preload recursos críticos',
      'poor': '❌ Crítico: Melhore LCP - otimize imagens hero, remova render-blocking resources, use server-side rendering'
    },
    INP: {
      'needs-improvement': '⚠️ Reduza tempo de resposta: otimize JavaScript, use web workers para tarefas pesadas',
      'poor': '❌ Crítico: Melhore interatividade - minimize JavaScript, use requestIdleCallback, otimize event handlers'
    },
    FID: {
      'needs-improvement': '⚠️ Reduza delay de input: diminua JavaScript blocking, use code splitting',
      'poor': '❌ Crítico: Melhore responsividade - minimize main thread work, otimize third-party scripts'
    },
    FCP: {
      'needs-improvement': '⚠️ Acelere primeira renderização: inline critical CSS, preload fonts',
      'poor': '❌ Crítico: Otimize FCP - remova render-blocking CSS/JS, otimize server response time'
    },
    TTFB: {
      'needs-improvement': '⚠️ Otimize servidor: use cache, CDN, otimize database queries',
      'poor': '❌ Crítico: Melhore TTFB - otimize server, use edge computing, minimize redirects'
    }
  };

  return recommendations[name]?.[rating] || 'Verifique as diretrizes de performance do Google';
};

export default function EnhancedCoreWebVitals() {
  const sendToAnalytics = useCallback((metric: WebVitalsMetric, additionalData?: any) => {
    // Send to Google Analytics 4 with enhanced data
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'web_vitals', {
        event_category: 'Web Vitals',
        event_label: metric.name,
        value: Math.round(metric.value),
        custom_parameter_1: metric.rating,
        custom_parameter_2: metric.delta || 0,
        custom_parameter_3: metric.id,
        // Additional context data
        page_location: window.location.href,
        page_title: document.title,
        user_agent: navigator.userAgent.substring(0, 100),
        viewport_width: window.innerWidth,
        viewport_height: window.innerHeight,
        connection_effective_type: (navigator as any).connection?.effectiveType || 'unknown',
        device_memory: (navigator as any).deviceMemory || 'unknown',
        ...additionalData
      });

      // Also send as a custom event for better reporting
      window.gtag('event', `vitals_${metric.name.toLowerCase()}`, {
        event_category: 'Performance',
        event_label: `${metric.name} - ${metric.rating}`,
        value: Math.round(metric.value),
        metric_rating: metric.rating,
        metric_value: metric.value,
        metric_id: metric.id,
        page_type: getPageType(),
        user_type: getUserType()
      });
    }
  }, []);

  const collectExtendedData = useCallback((): ExtendedWebVitalsData => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    return {
      metrics: [], // Will be populated by individual metrics
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      connectionType: (navigator as any).connection?.effectiveType,
      deviceMemory: (navigator as any).deviceMemory,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      performance: {
        loadTime: navigation ? navigation.loadEventEnd - navigation.fetchStart : 0,
        domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.fetchStart : 0,
        firstByte: navigation ? navigation.responseStart - navigation.fetchStart : 0
      }
    };
  }, []);

  const reportMetric = useCallback((metric: any) => {
    const rating = getMetricRating(metric.name, metric.value);
    const recommendation = getPerformanceRecommendation(metric.name, rating, metric.value);
    
    const webVitalsMetric: WebVitalsMetric = {
      name: metric.name,
      value: metric.value,
      rating,
      id: metric.id,
      delta: metric.delta,
      entries: metric.entries || []
    };

    // Enhanced logging for development
    if (process.env.NODE_ENV === 'development') {
      console.group(`📊 ${metric.name} Performance Metric`);
      console.log('Value:', `${metric.value}${getUnit(metric.name)}`);
      console.log('Rating:', `${getRatingEmoji(rating)} ${rating.toUpperCase()}`);
      console.log('Recommendation:', recommendation);
      if (metric.delta) console.log('Delta:', metric.delta);
      console.log('Metric ID:', metric.id);
      console.log('Entries:', metric.entries);
      console.groupEnd();
    }

    // Send to Google Analytics
    sendToAnalytics(webVitalsMetric, {
      recommendation,
      performance_score: calculatePerformanceScore(metric.name, rating),
      is_mobile: window.innerWidth <= 768,
      is_slow_connection: (navigator as any).connection?.effectiveType === '2g' || (navigator as any).connection?.effectiveType === 'slow-2g'
    });

    // Store in sessionStorage for debugging and local analysis
    const vitalsData = JSON.parse(sessionStorage.getItem('enhanced-web-vitals') || '[]');
    const extendedData = collectExtendedData();
    extendedData.metrics = [webVitalsMetric];
    
    vitalsData.push({
      ...extendedData,
      recommendation,
      timestamp: Date.now()
    });
    
    // Keep only last 50 entries
    if (vitalsData.length > 50) {
      vitalsData.splice(0, vitalsData.length - 50);
    }
    
    sessionStorage.setItem('enhanced-web-vitals', JSON.stringify(vitalsData));

    // Create performance alerts for critical issues
    if (rating === 'poor') {
      createPerformanceAlert(metric.name, metric.value, recommendation);
    }
  }, [sendToAnalytics, collectExtendedData]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let cleanup: (() => void) | undefined;

    // Import and setup web-vitals
    import('web-vitals').then(({ onCLS, onFCP, onLCP, onTTFB, onINP }) => {
      // Setup Core Web Vitals monitoring
      onCLS(reportMetric, { reportAllChanges: true });
      onLCP(reportMetric, { reportAllChanges: true });
      onFCP(reportMetric, { reportAllChanges: true });
      onTTFB(reportMetric);
      onINP(reportMetric, { reportAllChanges: true });

      // Setup Performance Observer for additional metrics
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            // Monitor resource loading performance
            if (entry.entryType === 'resource' && entry.duration > 1000) {
              sendToAnalytics({
                name: 'slow_resource',
                value: entry.duration,
                rating: 'poor',
                id: `resource_${Date.now()}`,
                entries: [entry]
              } as WebVitalsMetric, {
                resource_name: entry.name,
                resource_type: (entry as any).initiatorType,
                resource_size: (entry as any).transferSize || 0
              });
            }

            // Monitor long tasks
            if (entry.entryType === 'longtask') {
              sendToAnalytics({
                name: 'long_task',
                value: entry.duration,
                rating: entry.duration > 100 ? 'poor' : 'needs-improvement',
                id: `longtask_${Date.now()}`,
                entries: [entry]
              } as WebVitalsMetric, {
                task_duration: entry.duration,
                start_time: entry.startTime
              });
            }
          }
        });

        // Observe different entry types
        observer.observe({ 
          entryTypes: ['resource', 'longtask', 'largest-contentful-paint', 'layout-shift'] 
        });

        cleanup = () => observer.disconnect();
      }

      // Monitor page visibility changes
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'hidden') {
          // Send session data when page becomes hidden
          const sessionData = getSessionSummary();
          if (sessionData && window.gtag) {
            window.gtag('event', 'session_summary', {
              event_category: 'Performance',
              ...sessionData
            });
          }
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      cleanup = () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        cleanup?.();
      };
    }).catch(error => {
      console.warn('Failed to load web-vitals library:', error);
      
      // Send error to analytics
      if (window.gtag) {
        window.gtag('event', 'web_vitals_error', {
          event_category: 'Error',
          event_label: 'web-vitals library load failed',
          error_message: error.message
        });
      }
    });

    return cleanup;
  }, [reportMetric, sendToAnalytics]);

  // Setup error boundary for performance monitoring
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (window.gtag) {
        window.gtag('event', 'js_error', {
          event_category: 'Error',
          event_label: 'JavaScript Error',
          error_message: event.message.substring(0, 100),
          error_filename: event.filename,
          error_line: event.lineno,
          error_column: event.colno
        });
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (window.gtag) {
        window.gtag('event', 'promise_rejection', {
          event_category: 'Error',
          event_label: 'Unhandled Promise Rejection',
          error_message: String(event.reason).substring(0, 100)
        });
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return null; // This is a monitoring component with no UI
}

// Helper functions
function getUnit(metricName: string): string {
  switch (metricName) {
    case 'CLS':
      return '';
    case 'LCP':
    case 'FCP':
    case 'FID':
    case 'INP':
    case 'TTFB':
      return 'ms';
    default:
      return '';
  }
}

function getRatingEmoji(rating: string): string {
  switch (rating) {
    case 'good': return '🟢';
    case 'needs-improvement': return '🟡';
    case 'poor': return '🔴';
    default: return '⚪';
  }
}

function calculatePerformanceScore(metricName: string, rating: string): number {
  const scores = {
    good: 100,
    'needs-improvement': 50,
    poor: 0
  };
  return scores[rating] || 0;
}

function getPageType(): string {
  const path = window.location.pathname;
  if (path === '/') return 'home';
  if (path.startsWith('/chat')) return 'chat';
  if (path.startsWith('/search')) return 'search';
  if (path.startsWith('/modules')) return 'educational';
  if (path.startsWith('/resources')) return 'resources';
  return 'other';
}

function getUserType(): string {
  // Try to detect user type from localStorage or URL params
  const userType = localStorage.getItem('selectedPersona') || 
                  new URLSearchParams(window.location.search).get('user_type');
  
  if (userType === 'dr_gasnelio') return 'professional';
  if (userType === 'ga') return 'patient';
  return 'general';
}

function createPerformanceAlert(metricName: string, value: number, recommendation: string) {
  // Only in development mode
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      `🚨 Performance Alert: ${metricName} is performing poorly (${value}${getUnit(metricName)})\n` +
      `${recommendation}`
    );
  }
}

function getSessionSummary() {
  try {
    const vitalsData = JSON.parse(sessionStorage.getItem('enhanced-web-vitals') || '[]');
    if (vitalsData.length === 0) return null;

    const metrics = vitalsData.reduce((acc: any, entry: any) => {
      entry.metrics.forEach((metric: WebVitalsMetric) => {
        if (!acc[metric.name]) {
          acc[metric.name] = { values: [], ratings: [] };
        }
        acc[metric.name].values.push(metric.value);
        acc[metric.name].ratings.push(metric.rating);
      });
      return acc;
    }, {});

    // Calculate averages and ratings distribution
    const summary: any = {
      session_duration: Date.now() - vitalsData[0].timestamp,
      total_measurements: vitalsData.length
    };

    Object.keys(metrics).forEach(name => {
      const values = metrics[name].values;
      const ratings = metrics[name].ratings;
      
      summary[`avg_${name.toLowerCase()}`] = values.reduce((a: number, b: number) => a + b, 0) / values.length;
      summary[`${name.toLowerCase()}_good_count`] = ratings.filter((r: string) => r === 'good').length;
      summary[`${name.toLowerCase()}_poor_count`] = ratings.filter((r: string) => r === 'poor').length;
    });

    return summary;
  } catch (error) {
    console.warn('Failed to generate session summary:', error);
    return null;
  }
}

// Export function for manual performance reporting
export function reportCustomMetric(name: string, value: number, additionalData?: any) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', 'custom_performance_metric', {
      event_category: 'Performance',
      event_label: name,
      value: Math.round(value),
      ...additionalData
    });
  }
}

// Export function to get current performance data
export function getCurrentPerformanceData(): ExtendedWebVitalsData[] {
  try {
    return JSON.parse(sessionStorage.getItem('enhanced-web-vitals') || '[]');
  } catch {
    return [];
  }
}