/**
 * UX Analytics Tracking System
 * Implementa tracking detalhado para auditoria UX
 * Score atual: 74/100 → Meta: 90+/100
 */

// Tipos para tracking UX
export interface UXEvent {
  category: 'cognitive_load' | 'mobile_experience' | 'onboarding' | 'navigation' | 'engagement';
  action: string;
  label?: string;
  value?: number;
  custom_dimensions?: Record<string, string | number>;
}

export interface CognitiveLoadMetrics {
  elements_per_page: number;
  information_density: number;
  decision_points: number;
  scroll_depth: number;
  time_to_first_interaction: number;
  confusion_indicators: number;
}

export interface MobileExperienceMetrics {
  device_type: string;
  screen_size: string;
  touch_accuracy: number;
  scroll_performance: number;
  tap_targets_under_44px: number;
  horizontal_scroll_detected: boolean;
}

export interface OnboardingMetrics {
  step: number;
  completion_rate: number;
  time_spent: number;
  abandonment_point: string;
  friction_score: number;
  help_usage: number;
}

// UX Analytics Manager
class UXAnalytics {
  private isInitialized = false;
  private sessionId: string;
  private userId: string | null = null;
  private startTime: number;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    this.initializeTracking();
  }

  private generateSessionId(): string {
    return `ux_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeTracking() {
    if (typeof window === 'undefined') return;

    // Initialize Google Analytics 4 UX tracking
    this.setupGA4UXEvents();

    // Initialize Microsoft Clarity (free heatmaps)
    this.setupClarity();

    // Setup custom UX listeners
    this.setupUXListeners();

    this.isInitialized = true;
    this.trackEvent({
      category: 'engagement',
      action: 'session_start',
      custom_dimensions: {
        session_id: this.sessionId,
        user_agent: navigator.userAgent,
        screen_resolution: `${screen.width}x${screen.height}`,
        device_type: this.getDeviceType()
      }
    });
  }

  private setupGA4UXEvents() {
    // Enhanced GA4 tracking for UX metrics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || process.env.GA_MEASUREMENT_ID, {
        custom_map: {
          'custom_parameter_1': 'cognitive_load_score',
          'custom_parameter_2': 'mobile_experience_score',
          'custom_parameter_3': 'onboarding_completion'
        }
      });
    }
  }

  private setupClarity() {
    // Microsoft Clarity - Free heatmaps and session recordings
    if (typeof window !== 'undefined' && !document.getElementById('clarity-script')) {
      const script = document.createElement('script');
      script.id = 'clarity-script';
      script.innerHTML = `
        (function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window, document, "clarity", "script", "your_clarity_id");
      `;
      document.head.appendChild(script);
    }
  }

  private setupUXListeners() {
    if (typeof window === 'undefined') return;

    // Cognitive Load Tracking
    this.trackCognitiveLoad();

    // Mobile Experience Tracking
    this.trackMobileExperience();

    // Onboarding Flow Tracking
    this.trackOnboardingFlow();

    // Navigation and Confusion Indicators
    this.trackNavigationPatterns();

    // Performance Impact on UX
    this.trackPerformanceUX();
  }

  // =====================================
  // COGNITIVE LOAD TRACKING
  // =====================================

  private trackCognitiveLoad() {
    const observer = new MutationObserver(() => {
      this.measureCognitiveLoad();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true
    });

    // Initial measurement
    setTimeout(() => this.measureCognitiveLoad(), 2000);
  }

  private measureCognitiveLoad() {
    const metrics: CognitiveLoadMetrics = {
      elements_per_page: this.countVisibleElements(),
      information_density: this.calculateInformationDensity(),
      decision_points: this.countDecisionPoints(),
      scroll_depth: this.getScrollDepth(),
      time_to_first_interaction: this.getTimeToFirstInteraction(),
      confusion_indicators: this.detectConfusionIndicators()
    };

    // Calculate cognitive load score (0-10, where 10 is overwhelming)
    const cognitiveLoadScore = this.calculateCognitiveLoadScore(metrics);

    this.trackEvent({
      category: 'cognitive_load',
      action: 'page_analysis',
      value: cognitiveLoadScore,
      custom_dimensions: {
        ...metrics,
        page_url: window.location.pathname,
        cognitive_load_score: cognitiveLoadScore
      }
    });

    // Alert if cognitive load is critical (>8)
    if (cognitiveLoadScore > 8) {
      this.trackEvent({
        category: 'cognitive_load',
        action: 'critical_overload',
        value: cognitiveLoadScore,
        label: window.location.pathname
      });
    }
  }

  private countVisibleElements(): number {
    const elements = document.querySelectorAll('*');
    let visibleCount = 0;

    elements.forEach(el => {
      const rect = (el as HTMLElement).getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        visibleCount++;
      }
    });

    return visibleCount;
  }

  private calculateInformationDensity(): number {
    const textContent = document.body.innerText.length;
    const viewport = window.innerWidth * window.innerHeight;
    return textContent / viewport * 1000; // Characters per 1000px²
  }

  private countDecisionPoints(): number {
    const interactiveElements = document.querySelectorAll(
      'button, a, input, select, textarea, [role="button"], [tabindex]:not([tabindex="-1"])'
    );
    return interactiveElements.length;
  }

  private getScrollDepth(): number {
    const scrollTop = window.pageYOffset;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    return docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  }

  private getTimeToFirstInteraction(): number {
    // This would be set by interaction listeners
    return (performance.now() - this.startTime) / 1000;
  }

  private detectConfusionIndicators(): number {
    // Track patterns that indicate user confusion
    let confusionScore = 0;

    // Multiple back button clicks
    // Rapid scrolling up/down
    // Multiple clicks on non-interactive elements
    // Long hover times without clicking

    return confusionScore;
  }

  private calculateCognitiveLoadScore(metrics: CognitiveLoadMetrics): number {
    // Weighted formula for cognitive load (0-10 scale)
    const elementWeight = Math.min(metrics.elements_per_page / 100, 3);
    const densityWeight = Math.min(metrics.information_density / 50, 3);
    const decisionWeight = Math.min(metrics.decision_points / 20, 2);
    const confusionWeight = metrics.confusion_indicators * 2;

    return Math.min(elementWeight + densityWeight + decisionWeight + confusionWeight, 10);
  }

  // =====================================
  // MOBILE EXPERIENCE TRACKING
  // =====================================

  private trackMobileExperience() {
    if (!this.isMobileDevice()) return;

    const metrics: MobileExperienceMetrics = {
      device_type: this.getDeviceType(),
      screen_size: `${window.innerWidth}x${window.innerHeight}`,
      touch_accuracy: 0,
      scroll_performance: 0,
      tap_targets_under_44px: this.countSmallTapTargets(),
      horizontal_scroll_detected: this.detectHorizontalScroll()
    };

    this.trackEvent({
      category: 'mobile_experience',
      action: 'mobile_audit',
      custom_dimensions: metrics as unknown as Record<string, string | number>
    });

    // Track touch accuracy
    this.trackTouchAccuracy();

    // Track scroll performance
    this.trackScrollPerformance();
  }

  private isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  private getDeviceType(): string {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  private countSmallTapTargets(): number {
    const interactiveElements = document.querySelectorAll('button, a, input, [role="button"]');
    let smallTargets = 0;

    interactiveElements.forEach(el => {
      const rect = (el as HTMLElement).getBoundingClientRect();
      if (rect.width < 44 || rect.height < 44) {
        smallTargets++;
      }
    });

    return smallTargets;
  }

  private detectHorizontalScroll(): boolean {
    return document.documentElement.scrollWidth > window.innerWidth;
  }

  private trackTouchAccuracy() {
    let touchAttempts = 0;
    let successfulTouches = 0;

    document.addEventListener('touchstart', (e) => {
      touchAttempts++;
      const target = e.target as HTMLElement;
      
      if (target.matches('button, a, input, [role="button"]')) {
        successfulTouches++;
      }

      // Track accuracy every 10 touches
      if (touchAttempts % 10 === 0) {
        const accuracy = (successfulTouches / touchAttempts) * 100;
        this.trackEvent({
          category: 'mobile_experience',
          action: 'touch_accuracy',
          value: accuracy
        });
      }
    });
  }

  private trackScrollPerformance() {
    let scrollEvents = 0;
    let lastScrollTime = performance.now();

    const scrollHandler = () => {
      scrollEvents++;
      const currentTime = performance.now();
      const timeDiff = currentTime - lastScrollTime;
      
      if (timeDiff > 16.67) { // Less than 60fps
        this.trackEvent({
          category: 'mobile_experience',
          action: 'scroll_performance_issue',
          value: timeDiff
        });
      }

      lastScrollTime = currentTime;
    };

    window.addEventListener('scroll', scrollHandler, { passive: true });
  }

  // =====================================
  // ONBOARDING FLOW TRACKING
  // =====================================

  private trackOnboardingFlow() {
    // Track onboarding steps and abandonment
    this.trackOnboardingStep();
  }

  public trackOnboardingStep(step?: number) {
    const currentStep = step || this.detectOnboardingStep();
    
    this.trackEvent({
      category: 'onboarding',
      action: 'step_reached',
      value: currentStep,
      custom_dimensions: {
        time_spent: (Date.now() - this.startTime) / 1000,
        session_id: this.sessionId
      }
    });
  }

  public trackOnboardingCompletion() {
    this.trackEvent({
      category: 'onboarding',
      action: 'completed',
      custom_dimensions: {
        total_time: (Date.now() - this.startTime) / 1000,
        session_id: this.sessionId
      }
    });
  }

  public trackOnboardingAbandonment(reason: string) {
    this.trackEvent({
      category: 'onboarding',
      action: 'abandoned',
      label: reason,
      custom_dimensions: {
        abandonment_point: window.location.pathname,
        time_spent: (Date.now() - this.startTime) / 1000
      }
    });
  }

  private detectOnboardingStep(): number {
    // Detect current onboarding step based on URL or UI state
    const path = window.location.pathname;
    if (path.includes('welcome')) return 1;
    if (path.includes('tutorial')) return 2;
    if (path.includes('setup')) return 3;
    return 0;
  }

  // =====================================
  // NAVIGATION PATTERNS
  // =====================================

  private trackNavigationPatterns() {
    let navigationAttempts = 0;
    let successfulNavigations = 0;

    // Track failed navigation attempts
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      navigationAttempts++;

      if (target.matches('a, button, [role="button"]')) {
        successfulNavigations++;
      } else {
        // User clicked on non-interactive element (confusion indicator)
        this.trackEvent({
          category: 'navigation',
          action: 'failed_click',
          label: target.tagName.toLowerCase(),
          custom_dimensions: {
            element_text: target.textContent?.substr(0, 50) || '',
            page_url: window.location.pathname
          }
        });
      }
    });

    // Track navigation success rate
    setInterval(() => {
      if (navigationAttempts > 0) {
        const successRate = (successfulNavigations / navigationAttempts) * 100;
        this.trackEvent({
          category: 'navigation',
          action: 'success_rate',
          value: successRate
        });
      }
    }, 30000); // Every 30 seconds
  }

  // =====================================
  // PERFORMANCE UX IMPACT
  // =====================================

  private trackPerformanceUX() {
    // Track Core Web Vitals impact on UX
    this.trackWebVitals();
  }

  private trackWebVitals() {
    // Import web-vitals library or implement basic measurements
    if (typeof window !== 'undefined') {
      // Measure LCP (Largest Contentful Paint)
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        this.trackEvent({
          category: 'engagement',
          action: 'lcp',
          value: lastEntry.startTime,
          custom_dimensions: {
            element: (lastEntry as any).element?.tagName || 'unknown'
          }
        });
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // Measure FID (First Input Delay)
      new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry) => {
          this.trackEvent({
            category: 'engagement',
            action: 'fid',
            value: (entry as any).processingStart - entry.startTime
          });
        });
      }).observe({ entryTypes: ['first-input'] });
    }
  }

  // =====================================
  // PUBLIC API
  // =====================================

  public trackEvent(event: UXEvent) {
    if (!this.isInitialized) return;

    // Send to Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', event.action, {
        event_category: event.category,
        event_label: event.label,
        value: event.value,
        custom_parameters: event.custom_dimensions
      });
    }

    // Send to custom analytics endpoint
    this.sendToCustomEndpoint(event);

    // Console log for development
    if (process.env.NODE_ENV === 'development') {
      console.log('UX Event:', event);
    }
  }

  private sendToCustomEndpoint(event: UXEvent) {
    // Send to backend for custom analytics
    if (typeof window !== 'undefined') {
      fetch('/api/analytics/ux', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...event,
          session_id: this.sessionId,
          timestamp: Date.now(),
          user_id: this.userId,
          page_url: window.location.href,
          referrer: document.referrer
        })
      }).catch(err => {
        console.warn('Failed to send UX analytics:', err);
      });
    }
  }

  public setUserId(userId: string) {
    this.userId = userId;
  }

  public generateUXReport(): object {
    // Generate comprehensive UX report
    return {
      session_id: this.sessionId,
      user_id: this.userId,
      session_duration: (Date.now() - this.startTime) / 1000,
      pages_visited: this.getVisitedPages(),
      device_info: {
        type: this.getDeviceType(),
        screen_size: `${window.innerWidth}x${window.innerHeight}`,
        user_agent: navigator.userAgent
      }
    };
  }

  private getVisitedPages(): string[] {
    // This would be tracked throughout the session
    return [window.location.pathname];
  }
}

// Export singleton instance
export const uxAnalytics = new UXAnalytics();

// Export utility functions
export const trackCognitiveOverload = (score: number, context: string) => {
  uxAnalytics.trackEvent({
    category: 'cognitive_load',
    action: 'overload_detected',
    value: score,
    label: context
  });
};

export const trackMobileUsabilityIssue = (issue: string, severity: number) => {
  uxAnalytics.trackEvent({
    category: 'mobile_experience',
    action: 'usability_issue',
    label: issue,
    value: severity
  });
};

export const trackOnboardingFriction = (step: number, friction_type: string) => {
  uxAnalytics.trackEvent({
    category: 'onboarding',
    action: 'friction_detected',
    value: step,
    label: friction_type
  });
};