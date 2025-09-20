'use client';

import { useEffect } from 'react';

interface WebVitalsMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  id: string;
}

const getCLSThresholds = (value: number): 'good' | 'needs-improvement' | 'poor' => {
  if (value <= 0.1) return 'good';
  if (value <= 0.25) return 'needs-improvement';
  return 'poor';
};

const getLCPThresholds = (value: number): 'good' | 'needs-improvement' | 'poor' => {
  if (value <= 2500) return 'good';
  if (value <= 4000) return 'needs-improvement';
  return 'poor';
};

const getFIDThresholds = (value: number): 'good' | 'needs-improvement' | 'poor' => {
  if (value <= 100) return 'good';
  if (value <= 300) return 'needs-improvement';
  return 'poor';
};

const getTTFBThresholds = (value: number): 'good' | 'needs-improvement' | 'poor' => {
  if (value <= 800) return 'good';
  if (value <= 1800) return 'needs-improvement';
  return 'poor';
};

export default function CoreWebVitals() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Import web-vitals dynamically
    import('web-vitals').then(({ onCLS, onFCP, onLCP, onTTFB, onINP }) => {
      const reportMetric = (metric: { name: string; value: number; id: string; delta: number; entries: PerformanceEntry[] }) => {
        let rating: 'good' | 'needs-improvement' | 'poor';
        
        switch (metric.name) {
          case 'CLS':
            rating = getCLSThresholds(metric.value);
            break;
          case 'LCP':
            rating = getLCPThresholds(metric.value);
            break;
          case 'INP':
          case 'FID':
            rating = getFIDThresholds(metric.value);
            break;
          case 'TTFB':
            rating = getTTFBThresholds(metric.value);
            break;
          default:
            rating = 'good';
        }

        const webVitalsMetric: WebVitalsMetric = {
          name: metric.name,
          value: metric.value,
          rating,
          id: String(metric.id || 'unknown')
        };

        // Performance tracking in development

        // Send to analytics if available
        if (typeof window !== 'undefined' && 'gtag' in window && typeof window.gtag === 'function') {
          window.gtag('event', metric.name, {
            event_category: 'web_vitals',
            event_label: 'core_performance',
            value: metric.value,
            custom_parameters: {
              metric_value: metric.value,
              rating: rating
            }
          });
        }

        // Store in sessionStorage for debugging
        const vitalsData = JSON.parse(sessionStorage.getItem('core-web-vitals') || '[]');
        vitalsData.push({
          ...webVitalsMetric,
          timestamp: Date.now(),
          url: window.location.href
        });
        sessionStorage.setItem('core-web-vitals', JSON.stringify(vitalsData));
      };

      // Measure all Core Web Vitals
      onCLS(reportMetric);
      onINP(reportMetric); // INP replaced FID in web-vitals v3+
      onFCP(reportMetric);
      onLCP(reportMetric);
      onTTFB(reportMetric);
    }).catch(error => {
      // Silent fallback if web-vitals library is not available
    });

    // Performance observer for additional metrics
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            
            // Calculate custom metrics
            const metrics = {
              domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.fetchStart,
              loadComplete: navEntry.loadEventEnd - navEntry.fetchStart,
              firstByte: navEntry.responseStart - navEntry.fetchStart,
              domProcessing: navEntry.domComplete - navEntry.domContentLoadedEventStart
            };

            // Navigation metrics collected for analytics

            // Store custom metrics
            sessionStorage.setItem('navigation-metrics', JSON.stringify(metrics));
          }
        }
      });

      observer.observe({ entryTypes: ['navigation'] });

      return () => observer.disconnect();
    }
  }, []);

  return null; // This is a measurement component, no UI
}

function getUnit(metricName: string): string {
  switch (metricName) {
    case 'CLS':
      return '(no unit)';
    case 'LCP':
    case 'FID':
    case 'FCP':
    case 'TTFB':
      return 'ms';
    default:
      return '';
  }
}

function getRatingRecommendation(metricName: string, rating: string): string {
  if (rating === 'good') return '✅ Excelente performance!';
  
  switch (metricName) {
    case 'CLS':
      return rating === 'needs-improvement' 
        ? '⚠️ Optimize layout shifts (target: ≤ 0.1)'
        : '❌ Critical: reduce layout shifts (target: ≤ 0.1)';
    case 'LCP':
      return rating === 'needs-improvement'
        ? '⚠️ Optimize largest content paint (target: ≤ 2.5s)'
        : '❌ Critical: improve loading performance (target: ≤ 2.5s)';
    case 'FID':
      return rating === 'needs-improvement'
        ? '⚠️ Reduce input delay (target: ≤ 100ms)'
        : '❌ Critical: improve interactivity (target: ≤ 100ms)';
    case 'TTFB':
      return rating === 'needs-improvement'
        ? '⚠️ Optimize server response (target: ≤ 800ms)'
        : '❌ Critical: improve server performance (target: ≤ 800ms)';
    default:
      return 'Check performance guidelines';
  }
}

