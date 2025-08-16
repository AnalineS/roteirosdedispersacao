/**
 * Mobile UX Auditor Component
 * ETAPA 1: Mobile UX Audit Completo
 * Objetivo: Identificar problemas críticos da experiência móvel
 */

'use client';

import { useEffect, useState, useRef } from 'react';
import { useGoogleAnalyticsUX } from './GoogleAnalyticsSetup';

interface MobileUXMetrics {
  overallScore: number;
  touchTargetIssues: number;
  scrollIssues: number;
  performanceScore: number;
  thumbReachability: number;
  contentOverflow: number;
  tapTargetsUnder44px: number;
  criticalIssues: string[];
}

interface MobileUXIssue {
  type: 'critical' | 'high' | 'medium' | 'low';
  category: 'touch' | 'scroll' | 'performance' | 'thumb' | 'content';
  description: string;
  impact: number;
  recommendation: string;
  element?: HTMLElement;
}

export function MobileUXAuditor() {
  const [metrics, setMetrics] = useState<MobileUXMetrics | null>(null);
  const [issues, setIssues] = useState<MobileUXIssue[]>([]);
  const [isAuditing, setIsAuditing] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<any>(null);
  const { trackCustomUXEvent } = useGoogleAnalyticsUX();
  const auditRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (isMobileDevice()) {
      // Iniciar auditoria após carregamento
      auditRef.current = setTimeout(() => {
        performMobileUXAudit();
      }, 3000);

      // Coletar informações do dispositivo
      collectDeviceInfo();
    }

    return () => {
      if (auditRef.current) {
        clearTimeout(auditRef.current);
      }
    };
  }, []);

  const isMobileDevice = (): boolean => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           window.innerWidth <= 768;
  };

  const collectDeviceInfo = () => {
    const info = {
      userAgent: navigator.userAgent,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
      orientation: screen.orientation?.type || 'unknown',
      touchSupport: 'ontouchstart' in window
    };
    
    setDeviceInfo(info);
    
    // Track device info
    trackCustomUXEvent('mobile_device_info', 'mobile_experience', undefined, {
      screen_size: `${info.screenWidth}x${info.screenHeight}`,
      viewport_size: `${info.viewportWidth}x${info.viewportHeight}`,
      pixel_ratio: info.devicePixelRatio,
      orientation: info.orientation
    });
  };

  const performMobileUXAudit = async () => {
    setIsAuditing(true);
    const foundIssues: MobileUXIssue[] = [];

    try {
      // 1. Touch Target Analysis
      const touchIssues = auditTouchTargets();
      foundIssues.push(...touchIssues);

      // 2. Scroll Performance Analysis
      const scrollIssues = auditScrollPerformance();
      foundIssues.push(...scrollIssues);

      // 3. Thumb Reachability Analysis
      const thumbIssues = auditThumbReachability();
      foundIssues.push(...thumbIssues);

      // 4. Content Overflow Analysis
      const contentIssues = auditContentOverflow();
      foundIssues.push(...contentIssues);

      // 5. Performance Analysis
      const performanceIssues = await auditMobilePerformance();
      foundIssues.push(...performanceIssues);

      // Calculate overall metrics
      const calculatedMetrics = calculateMobileMetrics(foundIssues);
      
      setMetrics(calculatedMetrics);
      setIssues(foundIssues);

      // Track results
      trackCustomUXEvent('mobile_ux_audit_complete', 'mobile_experience', calculatedMetrics.overallScore, {
        total_issues: foundIssues.length,
        critical_issues: foundIssues.filter(i => i.type === 'critical').length,
        touch_target_issues: calculatedMetrics.touchTargetIssues
      });

    } catch (error) {
      console.error('Erro na auditoria móvel:', error);
    } finally {
      setIsAuditing(false);
    }
  };

  const auditTouchTargets = (): MobileUXIssue[] => {
    const issues: MobileUXIssue[] = [];
    const interactiveElements = document.querySelectorAll('button, a, input, [role="button"], [tabindex]');
    
    interactiveElements.forEach((el) => {
      const rect = (el as HTMLElement).getBoundingClientRect();
      const minSize = 44; // WCAG recommendation
      
      if (rect.width < minSize || rect.height < minSize) {
        issues.push({
          type: rect.width < 32 || rect.height < 32 ? 'critical' : 'high',
          category: 'touch',
          description: `Touch target muito pequeno: ${Math.round(rect.width)}x${Math.round(rect.height)}px`,
          impact: 0.8,
          recommendation: `Aumentar para pelo menos ${minSize}x${minSize}px`,
          element: el as HTMLElement
        });
      }
    });

    return issues;
  };

  const auditScrollPerformance = (): MobileUXIssue[] => {
    const issues: MobileUXIssue[] = [];
    
    // Check horizontal scroll
    if (document.documentElement.scrollWidth > window.innerWidth) {
      issues.push({
        type: 'critical',
        category: 'scroll',
        description: 'Scroll horizontal detectado',
        impact: 1.0,
        recommendation: 'Implementar responsive design adequado'
      });
    }

    // Check scroll containers without momentum
    const scrollContainers = document.querySelectorAll('[style*="overflow"]');
    scrollContainers.forEach((container) => {
      const styles = window.getComputedStyle(container as Element);
      const webkitOverflow = styles.getPropertyValue('-webkit-overflow-scrolling');
      
      if (styles.overflow.includes('scroll') && webkitOverflow !== 'touch') {
        issues.push({
          type: 'medium',
          category: 'scroll',
          description: 'Container sem momentum scrolling',
          impact: 0.6,
          recommendation: 'Adicionar -webkit-overflow-scrolling: touch',
          element: container as HTMLElement
        });
      }
    });

    return issues;
  };

  const auditThumbReachability = (): MobileUXIssue[] => {
    const issues: MobileUXIssue[] = [];
    const viewportHeight = window.innerHeight;
    const thumbReachZone = viewportHeight * 0.75; // Bottom 75% é alcançável
    
    const criticalActions = document.querySelectorAll('[data-critical], .primary-button, [type="submit"]');
    
    criticalActions.forEach((el) => {
      const rect = (el as HTMLElement).getBoundingClientRect();
      
      if (rect.top < viewportHeight * 0.25) { // Top 25% é difícil de alcançar
        issues.push({
          type: 'medium',
          category: 'thumb',
          description: 'Ação crítica fora da zona de alcance do polegar',
          impact: 0.7,
          recommendation: 'Mover para zona inferior ou adicionar atalho',
          element: el as HTMLElement
        });
      }
    });

    return issues;
  };

  const auditContentOverflow = (): MobileUXIssue[] => {
    const issues: MobileUXIssue[] = [];
    
    // Check for fixed width elements
    const allElements = document.querySelectorAll('*');
    
    allElements.forEach((el) => {
      const styles = window.getComputedStyle(el);
      const rect = (el as HTMLElement).getBoundingClientRect();
      
      // Check for fixed widths that cause overflow
      if (rect.width > window.innerWidth && styles.position !== 'absolute') {
        issues.push({
          type: 'high',
          category: 'content',
          description: `Elemento excede largura da viewport: ${Math.round(rect.width)}px`,
          impact: 0.8,
          recommendation: 'Usar max-width: 100% e quebra responsiva',
          element: el as HTMLElement
        });
      }
    });

    return issues;
  };

  const auditMobilePerformance = async (): Promise<MobileUXIssue[]> => {
    const issues: MobileUXIssue[] = [];
    
    // Check Core Web Vitals if available
    if ('PerformanceObserver' in window) {
      try {
        // LCP (Largest Contentful Paint)
        const lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lcp = entries[entries.length - 1]?.startTime;
          
          if (lcp && lcp > 2500) { // Good LCP is < 2.5s
            issues.push({
              type: lcp > 4000 ? 'critical' : 'high',
              category: 'performance',
              description: `LCP muito alto: ${(lcp/1000).toFixed(1)}s`,
              impact: 0.9,
              recommendation: 'Otimizar imagens e carregamento crítico'
            });
          }
        });
        
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        
        // Disconnect after 5 seconds
        setTimeout(() => lcpObserver.disconnect(), 5000);
        
      } catch (error) {
        console.log('Performance Observer não disponível');
      }
    }

    return issues;
  };

  const calculateMobileMetrics = (issues: MobileUXIssue[]): MobileUXMetrics => {
    const criticalIssues = issues.filter(i => i.type === 'critical');
    const touchIssues = issues.filter(i => i.category === 'touch');
    const scrollIssues = issues.filter(i => i.category === 'scroll');
    
    // Calculate scores (0-100, lower is worse)
    const baseScore = 100;
    const criticalPenalty = criticalIssues.length * 25;
    const highPenalty = issues.filter(i => i.type === 'high').length * 15;
    const mediumPenalty = issues.filter(i => i.type === 'medium').length * 8;
    
    const overallScore = Math.max(0, baseScore - criticalPenalty - highPenalty - mediumPenalty);
    
    return {
      overallScore,
      touchTargetIssues: touchIssues.length,
      scrollIssues: scrollIssues.length,
      performanceScore: Math.max(0, 100 - (criticalIssues.filter(i => i.category === 'performance').length * 30)),
      thumbReachability: Math.max(0, 100 - (issues.filter(i => i.category === 'thumb').length * 20)),
      contentOverflow: issues.filter(i => i.category === 'content').length,
      tapTargetsUnder44px: touchIssues.length,
      criticalIssues: criticalIssues.map(i => i.description)
    };
  };

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPriorityColor = (type: string): string => {
    switch (type) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  if (!isMobileDevice()) {
    return (
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-blue-800">📱 Mobile UX Auditor disponível apenas em dispositivos móveis</p>
      </div>
    );
  }

  return (
    <div className="mobile-ux-auditor p-4 bg-white rounded-lg shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">📱 Mobile UX Audit</h3>
        {isAuditing && (
          <div className="flex items-center text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            Auditando...
          </div>
        )}
      </div>

      {/* Device Info */}
      {deviceInfo && (
        <div className="mb-4 p-3 bg-gray-50 rounded">
          <h4 className="font-medium text-gray-700 mb-2">Informações do Dispositivo</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p>📱 Viewport: {deviceInfo.viewportWidth}x{deviceInfo.viewportHeight}</p>
            <p>🖥️ Tela: {deviceInfo.screenWidth}x{deviceInfo.screenHeight}</p>
            <p>📐 Pixel Ratio: {deviceInfo.devicePixelRatio}</p>
            <p>🔄 Orientação: {deviceInfo.orientation}</p>
          </div>
        </div>
      )}

      {/* Metrics Summary */}
      {metrics && (
        <div className="mb-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center p-3 bg-gray-50 rounded">
              <div className={`text-2xl font-bold ${getScoreColor(metrics.overallScore)}`}>
                {metrics.overallScore}
              </div>
              <div className="text-sm text-gray-600">Score Geral</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded">
              <div className="text-2xl font-bold text-red-600">
                {metrics.criticalIssues.length}
              </div>
              <div className="text-sm text-gray-600">Críticos</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>🎯 Touch Targets: {metrics.touchTargetIssues}</div>
            <div>📜 Scroll Issues: {metrics.scrollIssues}</div>
            <div>👍 Thumb Reach: {metrics.thumbReachability}%</div>
            <div>⚡ Performance: {metrics.performanceScore}%</div>
          </div>
        </div>
      )}

      {/* Issues List */}
      {issues.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-700 mb-3">
            Problemas Encontrados ({issues.length})
          </h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {issues.slice(0, 10).map((issue, index) => (
              <div key={index} className={`p-3 rounded border ${getPriorityColor(issue.type)}`}>
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-sm">{issue.description}</span>
                  <span className="text-xs uppercase font-bold">{issue.type}</span>
                </div>
                <p className="text-xs opacity-75">{issue.recommendation}</p>
              </div>
            ))}
            {issues.length > 10 && (
              <div className="text-center p-2 text-gray-500 text-sm">
                +{issues.length - 10} problemas adicionais...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <button
          onClick={performMobileUXAudit}
          disabled={isAuditing}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isAuditing ? 'Auditando...' : 'Reanalizar Mobile UX'}
        </button>
      </div>
    </div>
  );
}

// Hook para usar mobile tracking em outros componentes
export function useMobileUXTracking() {
  const { trackCustomUXEvent } = useGoogleAnalyticsUX();

  const trackMobileIssue = (issue: string, severity: number) => {
    trackCustomUXEvent('mobile_ux_issue', 'mobile_experience', severity, {
      issue_type: issue,
      viewport_width: window.innerWidth,
      device_type: window.innerWidth < 768 ? 'mobile' : 'tablet'
    });
  };

  const trackTouchAccuracy = (accuracy: number) => {
    trackCustomUXEvent('mobile_touch_accuracy', 'mobile_experience', accuracy, {
      session_duration: Date.now()
    });
  };

  return { trackMobileIssue, trackTouchAccuracy };
}