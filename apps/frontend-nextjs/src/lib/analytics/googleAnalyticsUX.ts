/**
 * Google Analytics UX Integration
 * Integra com sua configuração existente do GA
 * Adiciona tracking específico para auditoria UX (Score 74→90+)
 */

// Tipos para eventos UX customizados no GA
export interface GAUXEvent {
  event_name: string;
  event_category: 'ux_cognitive_load' | 'ux_mobile' | 'ux_onboarding' | 'ux_navigation';
  ux_metric_type: string;
  ux_score?: number;
  page_location?: string;
  custom_parameters?: Record<string, string | number>;
}

// Enhanced Google Analytics para UX
class GoogleAnalyticsUX {
  private isInitialized = false;
  private gaId: string | null = null;

  constructor() {
    this.gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || null;
    this.setupUXTracking();
  }

  private setupUXTracking() {
    if (typeof window === 'undefined' || !this.gaId) return;

    // Verificar se gtag já está carregado (sua configuração existente)
    if ((window as any).gtag) {
      this.isInitialized = true;
      this.setupCustomDimensions();
      this.startUXMonitoring();
    } else {
      // Aguardar GA carregar
      const checkGtag = () => {
        if ((window as any).gtag) {
          this.isInitialized = true;
          this.setupCustomDimensions();
          this.startUXMonitoring();
        } else {
          setTimeout(checkGtag, 500);
        }
      };
      checkGtag();
    }
  }

  private setupCustomDimensions() {
    if (!this.isInitialized) return;

    // Configurar dimensões customizadas para UX
    (window as any).gtag('config', this.gaId, {
      // Dimensões customizadas para UX (configurar no GA)
      custom_map: {
        'custom_parameter_1': 'cognitive_load_score',
        'custom_parameter_2': 'mobile_experience_score', 
        'custom_parameter_3': 'onboarding_step',
        'custom_parameter_4': 'device_category',
        'custom_parameter_5': 'user_expertise_level'
      }
    });

    console.log('🔍 Google Analytics UX tracking configurado');
  }

  private startUXMonitoring() {
    // Monitoramento automático de métricas UX
    this.monitorCognitiveLoad();
    this.monitorMobileExperience();
    this.monitorUserBehavior();
  }

  // =============================================
  // COGNITIVE LOAD TRACKING
  // =============================================

  private monitorCognitiveLoad() {
    // Medir cognitive load da página atual
    const measureCognitiveLoad = () => {
      const metrics = this.calculateCognitiveLoadMetrics();
      
      if (metrics.score > 7) { // Threshold crítico
        this.trackUXEvent({
          event_name: 'ux_cognitive_overload',
          event_category: 'ux_cognitive_load',
          ux_metric_type: 'cognitive_overload_detected',
          ux_score: metrics.score,
          custom_parameters: {
            elements_count: metrics.elementsCount,
            information_density: metrics.informationDensity,
            decision_points: metrics.decisionPoints,
            page_complexity: metrics.complexity
          }
        });
      }

      // Enviar métrica geral
      this.trackUXEvent({
        event_name: 'ux_cognitive_load_measurement',
        event_category: 'ux_cognitive_load', 
        ux_metric_type: 'page_complexity_score',
        ux_score: metrics.score,
        custom_parameters: {
          cognitive_load_score: metrics.score,
          page_type: this.getPageType()
        }
      });
    };

    // Medir após carregamento
    setTimeout(measureCognitiveLoad, 3000);
  }

  private calculateCognitiveLoadMetrics() {
    const elementsCount = document.querySelectorAll('*').length;
    const textLength = document.body.innerText.length;
    const interactiveElements = document.querySelectorAll('button, a, input, select').length;
    const imagesCount = document.querySelectorAll('img').length;
    
    // Fórmula simplificada para cognitive load (0-10)
    const elementDensity = elementsCount / (window.innerWidth * window.innerHeight) * 1000000;
    const textDensity = textLength / (window.innerWidth * window.innerHeight) * 100;
    const interactionComplexity = interactiveElements / 5;
    const mediaComplexity = imagesCount / 10;
    
    const rawScore = elementDensity + textDensity + interactionComplexity + mediaComplexity;
    const normalizedScore = Math.min(Math.max(rawScore / 20, 0), 10);

    return {
      score: Math.round(normalizedScore * 10) / 10,
      elementsCount,
      informationDensity: Math.round(textDensity),
      decisionPoints: interactiveElements,
      complexity: rawScore > 50 ? 'high' : rawScore > 25 ? 'medium' : 'low'
    };
  }

  // =============================================
  // MOBILE EXPERIENCE TRACKING
  // =============================================

  private monitorMobileExperience() {
    if (!this.isMobileDevice()) return;

    const auditMobile = () => {
      const issues = this.detectMobileUsabilityIssues();
      
      if (issues.length > 0) {
        this.trackUXEvent({
          event_name: 'ux_mobile_usability_issues',
          event_category: 'ux_mobile',
          ux_metric_type: 'mobile_issues_detected',
          ux_score: issues.length,
          custom_parameters: {
            small_tap_targets: issues.filter(i => i.type === 'small_tap_target').length,
            horizontal_scroll: issues.some(i => i.type === 'horizontal_scroll') ? 1 : 0,
            text_readability: issues.filter(i => i.type === 'text_too_small').length,
            device_category: this.getDeviceCategory()
          }
        });
      }

      // Mobile experience score geral
      const mobileScore = this.calculateMobileExperienceScore(issues);
      this.trackUXEvent({
        event_name: 'ux_mobile_experience_score',
        event_category: 'ux_mobile',
        ux_metric_type: 'mobile_experience_rating',
        ux_score: mobileScore,
        custom_parameters: {
          mobile_experience_score: mobileScore,
          screen_size: `${window.innerWidth}x${window.innerHeight}`,
          device_category: this.getDeviceCategory()
        }
      });
    };

    setTimeout(auditMobile, 2000);
  }

  private isMobileDevice(): boolean {
    return window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  private detectMobileUsabilityIssues() {
    const issues: Array<{type: string, element?: string, severity: number}> = [];

    // Tap targets menores que 44px
    const interactiveElements = document.querySelectorAll('button, a, input, [role="button"]');
    interactiveElements.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.width < 44 || rect.height < 44) {
        issues.push({
          type: 'small_tap_target',
          element: el.tagName.toLowerCase(),
          severity: rect.width < 32 || rect.height < 32 ? 3 : 2
        });
      }
    });

    // Scroll horizontal
    if (document.documentElement.scrollWidth > window.innerWidth) {
      issues.push({
        type: 'horizontal_scroll',
        severity: 3
      });
    }

    // Texto muito pequeno
    const textElements = document.querySelectorAll('p, span, div, a, button');
    let smallTextCount = 0;
    textElements.forEach(el => {
      const style = window.getComputedStyle(el);
      const fontSize = parseFloat(style.fontSize);
      if (fontSize < 14) {
        smallTextCount++;
      }
    });

    if (smallTextCount > 5) {
      issues.push({
        type: 'text_too_small',
        severity: 2
      });
    }

    return issues;
  }

  private calculateMobileExperienceScore(issues: any[]): number {
    const maxScore = 100;
    let deductions = 0;

    issues.forEach(issue => {
      deductions += issue.severity * 5; // Cada severity point = -5 pontos
    });

    return Math.max(maxScore - deductions, 0);
  }

  // =============================================
  // ONBOARDING TRACKING
  // =============================================

  public trackOnboardingStep(step: number, totalSteps: number) {
    this.trackUXEvent({
      event_name: 'ux_onboarding_step',
      event_category: 'ux_onboarding',
      ux_metric_type: 'onboarding_progress',
      ux_score: (step / totalSteps) * 100,
      custom_parameters: {
        onboarding_step: step,
        total_steps: totalSteps,
        completion_percentage: Math.round((step / totalSteps) * 100)
      }
    });
  }

  public trackOnboardingAbandonment(step: number, reason: string) {
    this.trackUXEvent({
      event_name: 'ux_onboarding_abandoned',
      event_category: 'ux_onboarding',
      ux_metric_type: 'onboarding_abandonment',
      ux_score: step,
      custom_parameters: {
        abandonment_step: step,
        abandonment_reason: reason,
        time_spent: this.getTimeOnPage()
      }
    });
  }

  public trackOnboardingCompletion(totalTime: number) {
    this.trackUXEvent({
      event_name: 'ux_onboarding_completed',
      event_category: 'ux_onboarding', 
      ux_metric_type: 'onboarding_success',
      ux_score: 100,
      custom_parameters: {
        completion_time: totalTime,
        success_rate: 100
      }
    });
  }

  // =============================================
  // USER BEHAVIOR MONITORING
  // =============================================

  private monitorUserBehavior() {
    // Track confusing navigation patterns
    this.trackNavigationConfusion();
    
    // Track page engagement
    this.trackPageEngagement();
  }

  private trackNavigationConfusion() {
    let clicksOnNonInteractive = 0;
    let rapidBackNavigation = 0;

    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      
      if (!target.matches('button, a, input, [role="button"], [tabindex]')) {
        clicksOnNonInteractive++;
        
        if (clicksOnNonInteractive % 3 === 0) { // A cada 3 cliques confusos
          this.trackUXEvent({
            event_name: 'ux_navigation_confusion',
            event_category: 'ux_navigation',
            ux_metric_type: 'user_confusion_detected',
            ux_score: clicksOnNonInteractive,
            custom_parameters: {
              confused_clicks: clicksOnNonInteractive,
              page_location: window.location.pathname
            }
          });
        }
      }
    });
  }

  private trackPageEngagement() {
    let scrollDepth = 0;
    let timeOnPage = 0;
    
    const trackEngagement = () => {
      const currentScrollDepth = this.getScrollDepth();
      const currentTimeOnPage = this.getTimeOnPage();
      
      if (currentScrollDepth > scrollDepth + 25) { // A cada 25% de scroll
        scrollDepth = currentScrollDepth;
        this.trackUXEvent({
          event_name: 'ux_page_engagement',
          event_category: 'ux_navigation',
          ux_metric_type: 'scroll_depth',
          ux_score: scrollDepth,
          custom_parameters: {
            scroll_depth: scrollDepth,
            time_on_page: currentTimeOnPage
          }
        });
      }
    };

    window.addEventListener('scroll', trackEngagement, { passive: true });
    setInterval(trackEngagement, 10000); // A cada 10 segundos
  }

  // =============================================
  // UTILITY FUNCTIONS
  // =============================================

  private trackUXEvent(event: GAUXEvent) {
    if (!this.isInitialized || !(window as any).gtag) return;

    (window as any).gtag('event', event.event_name, {
      event_category: event.event_category,
      event_label: event.ux_metric_type,
      value: event.ux_score,
      custom_parameters: {
        ux_metric_type: event.ux_metric_type,
        ux_score: event.ux_score,
        page_location: window.location.href,
        ...event.custom_parameters
      }
    });

    // Log para desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 UX Event tracked:', event);
    }
  }

  private getPageType(): string {
    const path = window.location.pathname;
    if (path === '/') return 'homepage';
    if (path.includes('/personas')) return 'personas';
    if (path.includes('/educational')) return 'educational';
    if (path.includes('/dashboard')) return 'dashboard';
    return 'other';
  }

  private getDeviceCategory(): string {
    const width = window.innerWidth;
    if (width < 480) return 'mobile_small';
    if (width < 768) return 'mobile_large';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  private getScrollDepth(): number {
    const scrollTop = window.pageYOffset;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    return docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;
  }

  private getTimeOnPage(): number {
    return Math.round((Date.now() - performance.timing.navigationStart) / 1000);
  }

  // =============================================
  // PUBLIC API
  // =============================================

  public trackCustomUXEvent(eventName: string, category: GAUXEvent['event_category'], score?: number, parameters?: Record<string, any>) {
    this.trackUXEvent({
      event_name: eventName,
      event_category: category,
      ux_metric_type: eventName,
      ux_score: score,
      custom_parameters: parameters
    });
  }

  public startUXAudit() {
    console.log('🔍 Iniciando auditoria UX com Google Analytics...');
    this.monitorCognitiveLoad();
    this.monitorMobileExperience();
    this.monitorUserBehavior();
  }
}

// Export singleton instance
export const googleAnalyticsUX = new GoogleAnalyticsUX();

// Export convenience functions
export const trackCognitiveOverload = (score: number, context: string) => {
  googleAnalyticsUX.trackCustomUXEvent('cognitive_overload_detected', 'ux_cognitive_load', score, { context });
};

export const trackMobileUsabilityIssue = (issue: string, severity: number) => {
  googleAnalyticsUX.trackCustomUXEvent('mobile_usability_issue', 'ux_mobile', severity, { issue_type: issue });
};

export const trackOnboardingStep = (step: number, totalSteps: number) => {
  googleAnalyticsUX.trackOnboardingStep(step, totalSteps);
};

export const trackOnboardingAbandonment = (step: number, reason: string) => {
  googleAnalyticsUX.trackOnboardingAbandonment(step, reason);
};

export const trackOnboardingCompletion = (totalTime: number) => {
  googleAnalyticsUX.trackOnboardingCompletion(totalTime);
};