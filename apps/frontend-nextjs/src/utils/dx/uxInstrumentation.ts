/**
 * UX Instrumentation for Developer Experience
 * Lightweight monitoring and debugging tools for UX analysis
 *
 * Features:
 * - User interaction tracking
 * - Performance bottleneck detection
 * - A/B testing support
 * - Accessibility issue detection
 * - Component render performance
 * - Error boundary monitoring
 */

import { safeLocalStorage } from '@/hooks/useClientStorage';

interface ReactDevToolsHook {
  onCommitFiberRoot?: (id: string | number, root: unknown, priorityLevel: unknown) => void;
  [key: string]: unknown;
}

interface PerformanceMemory {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface UXEvent {
  type: 'click' | 'scroll' | 'focus' | 'blur' | 'input' | 'error' | 'render' | 'navigation';
  element?: string;
  timestamp: number;
  data?: Record<string, unknown>;
  custom_parameters?: Record<string, unknown>;
  userId?: string;
  sessionId: string;
  page: string;
  viewport: {
    width: number;
    height: number;
  };
}

interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'count' | 'bytes' | 'score';
  timestamp: number;
  context?: Record<string, unknown>;
}

interface AccessibilityViolation {
  type: 'focus' | 'contrast' | 'aria' | 'semantic' | 'keyboard';
  severity: 'low' | 'medium' | 'high' | 'critical';
  element: string;
  description: string;
  timestamp: number;
  page: string;
}

interface UXInstrumentationConfig {
  enableInProduction: boolean;
  enableConsoleLogging: boolean;
  enableLocalStorage: boolean;
  sampleRate: number; // 0-1, percentage of events to capture
  enableErrorTracking: boolean;
  enablePerformanceTracking: boolean;
  enableAccessibilityTracking: boolean;
  enableUserInteractionTracking: boolean;
  maxStoredEvents: number;
}

class UXInstrumentationManager {
  private config: UXInstrumentationConfig;
  private sessionId: string;
  private events: UXEvent[] = [];
  private metrics: PerformanceMetric[] = [];
  private violations: AccessibilityViolation[] = [];
  private isInitialized = false;

  constructor(config: Partial<UXInstrumentationConfig> = {}) {
    this.config = {
      enableInProduction: false,
      enableConsoleLogging: process.env.NODE_ENV === 'development',
      enableLocalStorage: true,
      sampleRate: process.env.NODE_ENV === 'development' ? 1 : 0.1,
      enableErrorTracking: true,
      enablePerformanceTracking: true,
      enableAccessibilityTracking: true,
      enableUserInteractionTracking: true,
      maxStoredEvents: 1000,
      ...config
    };

    this.sessionId = this.generateSessionId();
    
    // Only initialize in development or if explicitly enabled in production
    if (process.env.NODE_ENV === 'development' || this.config.enableInProduction) {
      this.initialize();
    }
  }

  private initialize(): void {
    if (this.isInitialized) return;

    // Restore previous session data
    this.restoreStoredData();

    // Setup event listeners
    if (this.config.enableUserInteractionTracking) {
      this.setupInteractionTracking();
    }

    if (this.config.enablePerformanceTracking) {
      this.setupPerformanceTracking();
    }

    if (this.config.enableAccessibilityTracking) {
      this.setupAccessibilityTracking();
    }

    if (this.config.enableErrorTracking) {
      this.setupErrorTracking();
    }

    // Periodic data persistence
    setInterval(() => {
      this.persistData();
    }, 30000); // Every 30 seconds

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
      this.persistData();
    });

    this.isInitialized = true;
    this.log('UX Instrumentation initialized', { sessionId: this.sessionId, config: this.config });
  }

  private generateSessionId(): string {
    return `ux_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private shouldSample(): boolean {
    return Math.random() < this.config.sampleRate;
  }

  private log(message: string, data?: unknown): void {
    if (this.config.enableConsoleLogging && typeof window !== 'undefined' && window.gtag) {
      // Use gtag for UX instrumentation logging instead of console
      window.gtag('event', 'ux_instrumentation_log', {
        event_category: 'medical_ux_instrumentation',
        event_label: 'instrumentation_activity',
        custom_parameters: {
          medical_context: 'ux_instrumentation_logging',
          log_message: message,
          log_data: JSON.stringify(data || {})
        }
      });
    }
  }

  private setupInteractionTracking(): void {
    // Track clicks with context
    document.addEventListener('click', (event) => {
      if (!this.shouldSample()) return;

      const element = this.getElementSelector(event.target as Element);
      const isInteractive = this.isInteractiveElement(event.target as Element);
      
      this.trackEvent({
        type: 'click',
        element,
        data: {
          x: event.clientX,
          y: event.clientY,
          isInteractive,
          modifier: {
            ctrl: event.ctrlKey,
            alt: event.altKey,
            shift: event.shiftKey
          }
        }
      });

      // Detect potential usability issues
      if (!isInteractive) {
        this.trackAccessibilityViolation({
          type: 'semantic',
          severity: 'medium',
          element,
          description: 'Click on non-interactive element may indicate missing button/link semantics'
        });
      }
    }, { capture: true });

    // Track scroll behavior
    let scrollTimeout: NodeJS.Timeout;
    document.addEventListener('scroll', () => {
      if (!this.shouldSample()) return;

      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.trackEvent({
          type: 'scroll',
          data: {
            scrollY: window.scrollY,
            scrollX: window.scrollX,
            scrollHeight: document.documentElement.scrollHeight,
            viewportHeight: window.innerHeight
          }
        });
      }, 250);
    }, { passive: true });

    // Track focus management
    document.addEventListener('focus', (event) => {
      if (!this.shouldSample()) return;

      const element = this.getElementSelector(event.target as Element);
      this.trackEvent({
        type: 'focus',
        element,
        data: {
          focusedFromKeyboard: this.wasFocusedFromKeyboard(event.target as Element),
          hasVisibleFocus: this.hasVisibleFocus(event.target as Element)
        }
      });

      // Check for focus visibility issues
      if (!this.hasVisibleFocus(event.target as Element)) {
        this.trackAccessibilityViolation({
          type: 'focus',
          severity: 'high',
          element,
          description: 'Focusable element lacks visible focus indicator'
        });
      }
    }, { capture: true });

    // Track form interactions
    document.addEventListener('input', (event) => {
      if (!this.shouldSample()) return;

      const element = this.getElementSelector(event.target as Element);
      const inputElement = event.target as HTMLInputElement;
      
      this.trackEvent({
        type: 'input',
        element,
        data: {
          type: inputElement.type,
          hasLabel: this.hasAccessibleLabel(inputElement),
          hasValidation: this.hasValidationMessages(inputElement),
          valueLength: inputElement.value?.length || 0
        }
      });
    });
  }

  private setupPerformanceTracking(): void {
    // Track component render performance using Performance Observer
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.trackMetric({
            name: entry.name,
            value: entry.duration,
            unit: 'ms',
            timestamp: performance.now(),
            context: {
              entryType: entry.entryType,
              startTime: entry.startTime
            }
          });
        }
      });

      observer.observe({ entryTypes: ['measure', 'navigation'] });
    }

    // Track React component render times (if React DevTools is available)
    this.setupReactPerformanceTracking();

    // Monitor long tasks
    this.monitorLongTasks();

    // Track memory usage
    this.monitorMemoryUsage();
  }

  private setupReactPerformanceTracking(): void {
    // Hook into React DevTools profiler data if available
    if (typeof window !== 'undefined' && (window as unknown as { __REACT_DEVTOOLS_GLOBAL_HOOK__?: ReactDevToolsHook }).__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      const hook = (window as unknown as { __REACT_DEVTOOLS_GLOBAL_HOOK__: ReactDevToolsHook }).__REACT_DEVTOOLS_GLOBAL_HOOK__;
      
      hook.onCommitFiberRoot = (id: string | number, root: unknown, priorityLevel: unknown) => {
        this.trackMetric({
          name: 'react_commit',
          value: performance.now(),
          unit: 'ms',
          timestamp: performance.now(),
          context: { rootId: id, priorityLevel }
        });
      };
    }
  }

  private monitorLongTasks(): void {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) { // Long task threshold
            this.trackMetric({
              name: 'long_task',
              value: entry.duration,
              unit: 'ms',
              timestamp: performance.now(),
              context: {
                startTime: entry.startTime,
                severity: entry.duration > 100 ? 'high' : 'medium'
              }
            });
          }
        }
      });

      observer.observe({ entryTypes: ['longtask'] });
    }
  }

  private monitorMemoryUsage(): void {
    // Monitor memory every 30 seconds
    setInterval(() => {
      if ('memory' in performance) {
        const memory = (performance as unknown as { memory: PerformanceMemory }).memory;
        this.trackMetric({
          name: 'memory_usage',
          value: memory.usedJSHeapSize,
          unit: 'bytes',
          timestamp: performance.now(),
          context: {
            totalHeapSize: memory.totalJSHeapSize,
            heapSizeLimit: memory.jsHeapSizeLimit
          }
        });
      }
    }, 30000);
  }

  private setupAccessibilityTracking(): void {
    // Monitor color contrast issues
    this.monitorColorContrast();

    // Check for missing alt text
    this.monitorImageAccessibility();

    // Monitor keyboard navigation issues
    this.monitorKeyboardNavigation();
  }

  private monitorColorContrast(): void {
    // Check color contrast on page load and DOM changes
    const checkContrast = () => {
      const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, a, button');
      
      for (const element of textElements) {
        const styles = window.getComputedStyle(element);
        const color = styles.color;
        const backgroundColor = styles.backgroundColor;
        
        if (color && backgroundColor && this.hasInsufficientContrast(color, backgroundColor)) {
          this.trackAccessibilityViolation({
            type: 'contrast',
            severity: 'high',
            element: this.getElementSelector(element),
            description: `Insufficient color contrast ratio between text (${color}) and background (${backgroundColor})`
          });
        }
      }
    };

    // Initial check
    setTimeout(checkContrast, 1000);

    // Check on DOM mutations
    if ('MutationObserver' in window) {
      const observer = new MutationObserver(() => {
        setTimeout(checkContrast, 500);
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class']
      });
    }
  }

  private monitorImageAccessibility(): void {
    const checkImages = () => {
      const images = document.querySelectorAll('img');
      
      for (const img of images) {
        if (!img.alt && !img.getAttribute('aria-label') && !img.getAttribute('aria-labelledby')) {
          this.trackAccessibilityViolation({
            type: 'aria',
            severity: 'medium',
            element: this.getElementSelector(img),
            description: 'Image missing alternative text (alt attribute)'
          });
        }
      }
    };

    setTimeout(checkImages, 1000);
  }

  private monitorKeyboardNavigation(): void {
    let wasTabPressed = false;
    
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Tab') {
        wasTabPressed = true;
      }
    });

    document.addEventListener('focus', (event) => {
      if (wasTabPressed) {
        const element = event.target as Element;
        if (!this.isKeyboardAccessible(element)) {
          this.trackAccessibilityViolation({
            type: 'keyboard',
            severity: 'high',
            element: this.getElementSelector(element),
            description: 'Element focused via keyboard but may not be fully keyboard accessible'
          });
        }
      }
      wasTabPressed = false;
    });
  }

  private setupErrorTracking(): void {
    // Track JavaScript errors
    window.addEventListener('error', (event) => {
      this.trackEvent({
        type: 'error',
        data: {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack
        }
      });
    });

    // Track promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackEvent({
        type: 'error',
        data: {
          type: 'promise_rejection',
          reason: String(event.reason),
          stack: event.reason?.stack
        }
      });
    });

    // Track React error boundaries (if available)
    this.setupReactErrorTracking();
  }

  private setupReactErrorTracking(): void {
    // Track uncaught errors and React error boundaries
    window.addEventListener('error', (event) => {
      this.trackEvent({
        type: 'error',
        data: {
          type: 'javascript_error',
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack
        }
      });
    });

    // Track unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackEvent({
        type: 'error',
        data: {
          type: 'unhandled_promise_rejection',
          message: event.reason?.message || String(event.reason),
          stack: event.reason?.stack
        }
      });
    });
  }

  // Event tracking methods
  public trackEvent(event: Partial<UXEvent>): void {
    const fullEvent: UXEvent = {
      timestamp: Date.now(),
      sessionId: this.sessionId,
      page: window.location.pathname,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      ...event
    } as UXEvent;

    this.events.push(fullEvent);
    this.trimEvents();
    
    this.log('Event tracked', fullEvent);

    // Send to analytics if in production
    if (process.env.NODE_ENV === 'production' && window.gtag) {
      window.gtag('event', 'ux_instrumentation', {
        event_category: 'UX',
        event_label: fullEvent.type,
        custom_parameters: {
          element: fullEvent.element || 'unknown',
          data: JSON.stringify(fullEvent.data)
        }
      });
    }
  }

  public trackMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    this.trimMetrics();
    
    this.log('Metric tracked', metric);
  }

  public trackAccessibilityViolation(violation: Omit<AccessibilityViolation, 'timestamp' | 'page'>): void {
    const fullViolation: AccessibilityViolation = {
      timestamp: Date.now(),
      page: window.location.pathname,
      ...violation
    };

    this.violations.push(fullViolation);
    this.log('Accessibility violation tracked', fullViolation);
  }

  // Utility methods
  private getElementSelector(element: Element | null): string {
    if (!element) return 'unknown';

    if (element.id) return `#${element.id}`;
    if (element.className) return `.${element.className.split(' ')[0]}`;
    return element.tagName.toLowerCase();
  }

  private isInteractiveElement(element: Element): boolean {
    const interactiveTags = ['button', 'a', 'input', 'select', 'textarea'];
    const isInteractiveTag = interactiveTags.includes(element.tagName.toLowerCase());
    const hasClickHandler = !!element.getAttribute('onclick') || element.getAttribute('role') === 'button';
    
    return isInteractiveTag || hasClickHandler;
  }

  private wasFocusedFromKeyboard(element: Element): boolean {
    // Simple heuristic - can be enhanced with more sophisticated detection
    return element.matches(':focus-visible') || document.querySelector(':focus-visible') === element;
  }

  private hasVisibleFocus(element: Element): boolean {
    const styles = window.getComputedStyle(element);
    return styles.outline !== 'none' && styles.outline !== '0px';
  }

  private hasAccessibleLabel(element: HTMLElement): boolean {
    return !!(element.getAttribute('aria-label') || 
              element.getAttribute('aria-labelledby') ||
              element.querySelector('label') ||
              (element as HTMLInputElement).labels?.length);
  }

  private hasValidationMessages(element: HTMLElement): boolean {
    return !!(element.getAttribute('aria-describedby') ||
              element.closest('form')?.querySelector('[aria-live]'));
  }

  private hasInsufficientContrast(color: string, backgroundColor: string): boolean {
    // Simplified contrast check - can be enhanced with proper WCAG calculations
    return color === backgroundColor || 
           (color.includes('rgb(255') && backgroundColor.includes('rgb(255')) ||
           (color.includes('rgb(0') && backgroundColor.includes('rgb(0'));
  }

  private isKeyboardAccessible(element: Element): boolean {
    const focusableElements = ['input', 'button', 'select', 'textarea', 'a'];
    return focusableElements.includes(element.tagName.toLowerCase()) ||
           element.getAttribute('tabindex') !== null ||
           element.getAttribute('role') === 'button';
  }

  private trimEvents(): void {
    if (this.events.length > this.config.maxStoredEvents) {
      this.events = this.events.slice(-this.config.maxStoredEvents);
    }
  }

  private trimMetrics(): void {
    if (this.metrics.length > this.config.maxStoredEvents) {
      this.metrics = this.metrics.slice(-this.config.maxStoredEvents);
    }
  }

  private persistData(): void {
    if (!this.config.enableLocalStorage) return;

    try {
      safeLocalStorage()?.setItem('ux_instrumentation_events', JSON.stringify(this.events));
      safeLocalStorage()?.setItem('ux_instrumentation_metrics', JSON.stringify(this.metrics));
      safeLocalStorage()?.setItem('ux_instrumentation_violations', JSON.stringify(this.violations));
    } catch (error) {
      this.log('Failed to persist data to localStorage', error);
    }
  }

  private restoreStoredData(): void {
    if (!this.config.enableLocalStorage) return;

    try {
      const storedEvents = safeLocalStorage()?.getItem('ux_instrumentation_events');
      const storedMetrics = safeLocalStorage()?.getItem('ux_instrumentation_metrics');
      const storedViolations = safeLocalStorage()?.getItem('ux_instrumentation_violations');

      if (storedEvents) this.events = JSON.parse(storedEvents);
      if (storedMetrics) this.metrics = JSON.parse(storedMetrics);
      if (storedViolations) this.violations = JSON.parse(storedViolations);
    } catch (error) {
      this.log('Failed to restore data from localStorage', error);
    }
  }

  // Public API for accessing data
  public getEvents(): UXEvent[] {
    return [...this.events];
  }

  public getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  public getViolations(): AccessibilityViolation[] {
    return [...this.violations];
  }

  public getSummary(): {
    totalEvents: number;
    totalMetrics: number;
    totalViolations: number;
    averageSessionTime: number;
    topEvents: Array<{ type: string; count: number }>;
    performanceIssues: number;
    accessibilityScore: number;
  } {
    const eventCounts = this.events.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topEvents = Object.entries(eventCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));

    const performanceIssues = this.metrics.filter(m => 
      (m.name === 'long_task' && m.value > 50) ||
      (m.name.includes('memory') && m.context?.severity === 'high')
    ).length;

    const criticalViolations = this.violations.filter(v => v.severity === 'critical' || v.severity === 'high').length;
    const accessibilityScore = Math.max(0, 100 - (criticalViolations * 10) - (this.violations.length * 2));

    const sessionStart = this.events.length > 0 ? Math.min(...this.events.map(e => e.timestamp)) : Date.now();
    const sessionEnd = this.events.length > 0 ? Math.max(...this.events.map(e => e.timestamp)) : Date.now();
    const averageSessionTime = sessionEnd - sessionStart;

    return {
      totalEvents: this.events.length,
      totalMetrics: this.metrics.length,
      totalViolations: this.violations.length,
      averageSessionTime,
      topEvents,
      performanceIssues,
      accessibilityScore
    };
  }

  public clearData(): void {
    this.events = [];
    this.metrics = [];
    this.violations = [];
    
    if (this.config.enableLocalStorage) {
      safeLocalStorage()?.removeItem('ux_instrumentation_events');
      safeLocalStorage()?.removeItem('ux_instrumentation_metrics');
      safeLocalStorage()?.removeItem('ux_instrumentation_violations');
    }
    
    this.log('All instrumentation data cleared');
  }

  public exportData(): string {
    return JSON.stringify({
      sessionId: this.sessionId,
      timestamp: Date.now(),
      events: this.events,
      metrics: this.metrics,
      violations: this.violations,
      summary: this.getSummary()
    }, null, 2);
  }
}

// Global instance
let uxInstrumentation: UXInstrumentationManager | null = null;

export function initializeUXInstrumentation(config?: Partial<UXInstrumentationConfig>): UXInstrumentationManager {
  if (!uxInstrumentation) {
    uxInstrumentation = new UXInstrumentationManager(config);
  }
  return uxInstrumentation;
}

export function getUXInstrumentation(): UXInstrumentationManager | null {
  return uxInstrumentation;
}

// Convenience functions
export function trackUXEvent(event: Partial<UXEvent>): void {
  uxInstrumentation?.trackEvent(event);
}

export function trackUXMetric(metric: PerformanceMetric): void {
  uxInstrumentation?.trackMetric(metric);
}

export function getUXSummary() {
  return uxInstrumentation?.getSummary();
}

export { UXInstrumentationManager, type UXEvent, type PerformanceMetric, type AccessibilityViolation, type UXInstrumentationConfig };