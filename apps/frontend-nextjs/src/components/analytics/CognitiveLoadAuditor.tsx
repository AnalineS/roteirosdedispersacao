/**
 * Cognitive Load Auditor Component
 * ETAPA 1.2: Cognitive Load Assessment
 * Objetivo: Reduzir de 8.9/10 para <4/10
 */

'use client';

import { useEffect, useState, useRef } from 'react';
import { useGoogleAnalyticsUX } from './GoogleAnalyticsSetup';

interface CognitiveLoadMetrics {
  overallScore: number;
  elementsCount: number;
  textDensity: number;
  interactiveElements: number;
  colorComplexity: number;
  hierarchyDepth: number;
  informationDensity: number;
  visualNoise: number;
}

interface CognitiveLoadIssue {
  type: 'critical' | 'high' | 'medium' | 'low';
  category: 'elements' | 'text' | 'colors' | 'hierarchy' | 'noise';
  description: string;
  impact: number;
  recommendation: string;
  element?: HTMLElement;
}

export function CognitiveLoadAuditor() {
  const [metrics, setMetrics] = useState<CognitiveLoadMetrics | null>(null);
  const [issues, setIssues] = useState<CognitiveLoadIssue[]>([]);
  const [isAuditing, setIsAuditing] = useState(false);
  const { trackCognitiveLoad, trackCustomUXEvent } = useGoogleAnalyticsUX();
  const auditRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Começar auditoria após carregamento da página
    auditRef.current = setTimeout(() => {
      performCognitiveLoadAudit();
    }, 2000);

    return () => {
      if (auditRef.current) {
        clearTimeout(auditRef.current);
      }
    };
  }, []);

  const performCognitiveLoadAudit = async () => {
    setIsAuditing(true);
    
    try {
      const auditMetrics = await analyzeCognitiveLoad();
      const detectedIssues = identifyIssues(auditMetrics);
      
      setMetrics(auditMetrics);
      setIssues(detectedIssues);

      // Track no Google Analytics
      trackCognitiveLoad(auditMetrics.overallScore, `Page: ${window.location.pathname}`);
      
      // Se score crítico, enviar alerta
      if (auditMetrics.overallScore > 8) {
        trackCustomUXEvent('cognitive_overload_critical', 'ux_cognitive_load', auditMetrics.overallScore, {
          page_url: window.location.pathname,
          elements_count: auditMetrics.elementsCount,
          text_density: auditMetrics.textDensity,
          issues_found: detectedIssues.length,
          critical_issues: detectedIssues.filter(i => i.type === 'critical').length
        });
      }

      console.log('🧠 Cognitive Load Audit:', {
        score: auditMetrics.overallScore,
        issues: detectedIssues.length,
        critical: detectedIssues.filter(i => i.type === 'critical').length
      });

    } catch (error) {
      console.error('Erro na auditoria de cognitive load:', error);
    } finally {
      setIsAuditing(false);
    }
  };

  const analyzeCognitiveLoad = async (): Promise<CognitiveLoadMetrics> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const metrics = calculateCognitiveLoadMetrics();
        resolve(metrics);
      }, 100);
    });
  };

  const calculateCognitiveLoadMetrics = (): CognitiveLoadMetrics => {
    // 1. Contagem de elementos visuais
    const allElements = document.querySelectorAll('*');
    const visibleElements = Array.from(allElements).filter(el => {
      const rect = (el as HTMLElement).getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });

    // 2. Densidade de texto
    const textContent = document.body.innerText || '';
    const textLength = textContent.length;
    const viewportArea = window.innerWidth * window.innerHeight;
    const textDensity = textLength / viewportArea * 1000;

    // 3. Elementos interativos
    const interactiveElements = document.querySelectorAll(
      'button, a, input, select, textarea, [role="button"], [tabindex]:not([tabindex="-1"])'
    ).length;

    // 4. Complexidade de cores
    const colorComplexity = calculateColorComplexity();

    // 5. Profundidade da hierarquia
    const hierarchyDepth = calculateHierarchyDepth();

    // 6. Densidade informacional
    const informationDensity = calculateInformationDensity();

    // 7. Ruído visual
    const visualNoise = calculateVisualNoise();

    // 8. Score geral (0-10)
    const overallScore = calculateOverallCognitiveLoadScore({
      elementsCount: visibleElements.length,
      textDensity,
      interactiveElements,
      colorComplexity,
      hierarchyDepth,
      informationDensity,
      visualNoise
    });

    return {
      overallScore,
      elementsCount: visibleElements.length,
      textDensity,
      interactiveElements,
      colorComplexity,
      hierarchyDepth,
      informationDensity,
      visualNoise
    };
  };

  const calculateColorComplexity = (): number => {
    const elements = document.querySelectorAll('*');
    const colors = new Set<string>();
    
    elements.forEach(el => {
      const style = window.getComputedStyle(el as Element);
      colors.add(style.color);
      colors.add(style.backgroundColor);
      colors.add(style.borderColor);
    });

    return Math.min(colors.size / 20, 10); // Normalizado para 0-10
  };

  const calculateHierarchyDepth = (): number => {
    const headers = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const levels = new Set<string>();
    
    headers.forEach(header => {
      levels.add(header.tagName);
    });

    return Math.min(levels.size, 6); // Max 6 níveis de hierarquia
  };

  const calculateInformationDensity = (): number => {
    const textElements = document.querySelectorAll('p, span, div, li, td');
    let totalText = 0;
    let totalArea = 0;

    textElements.forEach(el => {
      const rect = (el as HTMLElement).getBoundingClientRect();
      const text = (el as HTMLElement).innerText?.length || 0;
      const area = rect.width * rect.height;
      
      if (area > 0) {
        totalText += text;
        totalArea += area;
      }
    });

    return totalArea > 0 ? (totalText / totalArea) * 1000 : 0;
  };

  const calculateVisualNoise = (): number => {
    let noiseScore = 0;

    // Muitas imagens
    const images = document.querySelectorAll('img').length;
    if (images > 10) noiseScore += 2;

    // Muitas cores diferentes
    const uniqueColors = new Set<string>();
    document.querySelectorAll('*').forEach(el => {
      const style = window.getComputedStyle(el as Element);
      uniqueColors.add(style.backgroundColor);
    });
    if (uniqueColors.size > 15) noiseScore += 2;

    // Muitos elementos de animação
    const animatedElements = document.querySelectorAll('[style*="animation"], .animate');
    if (animatedElements.length > 5) noiseScore += 1;

    // Elementos sobrepostos
    const absoluteElements = document.querySelectorAll('[style*="position: absolute"], [style*="position: fixed"]');
    if (absoluteElements.length > 8) noiseScore += 1;

    return Math.min(noiseScore, 10);
  };

  const calculateOverallCognitiveLoadScore = (metrics: Omit<CognitiveLoadMetrics, 'overallScore'>): number => {
    // Pesos para diferentes fatores
    const weights = {
      elements: 0.25,      // 25% - Quantidade de elementos
      text: 0.20,         // 20% - Densidade de texto
      interactive: 0.15,  // 15% - Elementos interativos
      colors: 0.15,       // 15% - Complexidade de cores
      hierarchy: 0.10,    // 10% - Profundidade hierárquica
      information: 0.10,  // 10% - Densidade informacional
      noise: 0.05         // 5% - Ruído visual
    };

    // Normalizar e calcular scores parciais
    const elementScore = Math.min(metrics.elementsCount / 200, 1) * 10;
    const textScore = Math.min(metrics.textDensity / 20, 1) * 10;
    const interactiveScore = Math.min(metrics.interactiveElements / 30, 1) * 10;
    const colorScore = metrics.colorComplexity;
    const hierarchyScore = Math.min(metrics.hierarchyDepth / 3, 1) * 10;
    const informationScore = Math.min(metrics.informationDensity / 5, 1) * 10;
    const noiseScore = metrics.visualNoise;

    // Score final ponderado
    const finalScore = 
      (elementScore * weights.elements) +
      (textScore * weights.text) +
      (interactiveScore * weights.interactive) +
      (colorScore * weights.colors) +
      (hierarchyScore * weights.hierarchy) +
      (informationScore * weights.information) +
      (noiseScore * weights.noise);

    return Math.round(finalScore * 10) / 10; // Round to 1 decimal place
  };

  const identifyIssues = (metrics: CognitiveLoadMetrics): CognitiveLoadIssue[] => {
    const issues: CognitiveLoadIssue[] = [];

    // Muitos elementos visuais
    if (metrics.elementsCount > 300) {
      issues.push({
        type: 'critical',
        category: 'elements',
        description: `Muitos elementos na página (${metrics.elementsCount})`,
        impact: 3,
        recommendation: 'Reduzir densidade visual em 40%. Usar progressive disclosure.'
      });
    } else if (metrics.elementsCount > 200) {
      issues.push({
        type: 'high',
        category: 'elements',
        description: `Densidade alta de elementos (${metrics.elementsCount})`,
        impact: 2,
        recommendation: 'Simplificar interface. Remover elementos desnecessários.'
      });
    }

    // Densidade de texto muito alta
    if (metrics.textDensity > 25) {
      issues.push({
        type: 'critical',
        category: 'text',
        description: 'Densidade de texto excessiva',
        impact: 3,
        recommendation: 'Fragmentar texto em seções. Usar bullet points e headers.'
      });
    }

    // Muitos elementos interativos
    if (metrics.interactiveElements > 40) {
      issues.push({
        type: 'high',
        category: 'elements',
        description: `Muitas opções de interação (${metrics.interactiveElements})`,
        impact: 2,
        recommendation: 'Reduzir número de botões e links. Priorizar ações principais.'
      });
    }

    // Complexidade de cores
    if (metrics.colorComplexity > 8) {
      issues.push({
        type: 'medium',
        category: 'colors',
        description: 'Paleta de cores muito complexa',
        impact: 1,
        recommendation: 'Usar sistema de cores mais restrito. Max 5 cores principais.'
      });
    }

    // Hierarquia muito profunda
    if (metrics.hierarchyDepth > 4) {
      issues.push({
        type: 'medium',
        category: 'hierarchy',
        description: 'Hierarquia muito profunda',
        impact: 1,
        recommendation: 'Simplificar hierarquia para máximo 3 níveis.'
      });
    }

    // Ruído visual
    if (metrics.visualNoise > 6) {
      issues.push({
        type: 'high',
        category: 'noise',
        description: 'Muito ruído visual',
        impact: 2,
        recommendation: 'Reduzir animações, sobreposições e elementos decorativos.'
      });
    }

    return issues;
  };

  // Não renderizar componente visual, apenas funciona em background
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <div>🧠 Cognitive Load Audit</div>
      {isAuditing && <div>Analisando...</div>}
      {metrics && (
        <div>
          <div>Score: {metrics.overallScore}/10</div>
          <div>Elementos: {metrics.elementsCount}</div>
          <div>Issues: {issues.length}</div>
          {metrics.overallScore > 8 && (
            <div style={{ color: '#ff4444' }}>⚠️ CRÍTICO</div>
          )}
        </div>
      )}
    </div>
  );
}

// Hook para usar cognitive load tracking em outros componentes
export function useCognitiveLoadTracking() {
  const { trackCognitiveLoad } = useGoogleAnalyticsUX();

  const measureAndTrack = () => {
    // Usar funções de auditoria diretamente sem instanciar componente
    // Lógica para medir e trackear
  };

  return { measureAndTrack };
}