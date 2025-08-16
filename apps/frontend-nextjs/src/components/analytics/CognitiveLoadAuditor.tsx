/**
 * Cognitive Load Auditor Component - FIXED VERSION
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
  medicalComplexity: number;
  clinicalWorkflowComplexity: number;
  contextSpecificScore: number;
}

interface CognitiveLoadIssue {
  type: 'critical' | 'high' | 'medium' | 'low';
  category: 'elements' | 'text' | 'colors' | 'hierarchy' | 'noise' | 'medical' | 'workflow';
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
          medical_complexity: auditMetrics.medicalComplexity,
          elements_count: auditMetrics.elementsCount,
          issues_found: detectedIssues.length
        });
      }

      console.log('🧠 Cognitive Load Audit:', {
        score: auditMetrics.overallScore,
        medicalScore: auditMetrics.contextSpecificScore,
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

    // 8. Complexidade médica específica
    const medicalComplexity = calculateMedicalComplexity();

    // 9. Complexidade de fluxo clínico
    const clinicalWorkflowComplexity = calculateClinicalWorkflowComplexity();

    // 10. Score específico do contexto médico
    const contextSpecificScore = (medicalComplexity + clinicalWorkflowComplexity) / 2;

    // 11. Score geral (0-10) com peso para contexto médico
    const overallScore = calculateOverallCognitiveLoadScore({
      elementsCount: visibleElements.length,
      textDensity,
      interactiveElements,
      colorComplexity,
      hierarchyDepth,
      informationDensity,
      visualNoise,
      medicalComplexity,
      clinicalWorkflowComplexity,
      contextSpecificScore
    });

    return {
      overallScore,
      elementsCount: visibleElements.length,
      textDensity,
      interactiveElements,
      colorComplexity,
      hierarchyDepth,
      informationDensity,
      visualNoise,
      medicalComplexity,
      clinicalWorkflowComplexity,
      contextSpecificScore
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

    return Math.min(colors.size / 20, 10);
  };

  const calculateHierarchyDepth = (): number => {
    const headers = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const levels = new Set<string>();
    
    headers.forEach(header => {
      levels.add(header.tagName);
    });

    return Math.min(levels.size, 6);
  };

  const calculateInformationDensity = (): number => {
    // Densidade específica para contexto médico
    const medicalTerms = document.body.innerText.match(/\b(hanseníase|bacilo|mycobacterium|PQT|WHO|ministério|saúde|paciente|tratamento|dose|mg|comprimido|blister)\b/gi) || [];
    const technicalDensity = medicalTerms.length / 100;
    
    const paragraphs = document.querySelectorAll('p, div, span').length;
    const avgWordsPerElement = (document.body.innerText.split(' ').length) / paragraphs;
    
    return Math.min((technicalDensity * 2 + avgWordsPerElement / 20), 10);
  };

  const calculateMedicalComplexity = (): number => {
    const complexMedicalTerms = [
      'paucibacilar', 'multibacilar', 'clofazimina', 'dapsona', 'rifampicina',
      'poliquimioterapia', 'dermatologia', 'neurologia', 'oftalmologia'
    ];
    
    const simpleMedicalTerms = [
      'hanseníase', 'lepra', 'paciente', 'tratamento', 'remédio', 'dose'
    ];
    
    const textContent = document.body.innerText.toLowerCase();
    const complexCount = complexMedicalTerms.filter(term => textContent.includes(term)).length;
    const simpleCount = simpleMedicalTerms.filter(term => textContent.includes(term)).length;
    
    const complexityRatio = simpleCount > 0 ? complexCount / simpleCount : complexCount;
    return Math.min(complexityRatio * 3, 10);
  };

  const calculateClinicalWorkflowComplexity = (): number => {
    const workflowElements = document.querySelectorAll('[data-step], .step, .workflow, .protocol').length;
    const navigationItems = document.querySelectorAll('nav a, .menu-item, .tab').length;
    const formElements = document.querySelectorAll('input, select, textarea, button[type="submit"]').length;
    
    const workflowComplexity = (workflowElements * 0.5 + navigationItems * 0.3 + formElements * 0.2) / 10;
    return Math.min(workflowComplexity, 10);
  };

  const calculateVisualNoise = (): number => {
    const textElements = document.querySelectorAll('p, span, div, li, td');
    let totalText = 0;
    let totalArea = 0;

    textElements.forEach(el => {
      const rect = (el as HTMLElement).getBoundingClientRect();
      const area = rect.width * rect.height;
      const text = (el as HTMLElement).innerText?.length || 0;
      
      totalArea += area;
      totalText += text;
    });

    const textAreaRatio = totalArea > 0 ? totalText / totalArea : 0;
    const noiseScore = Math.min(textAreaRatio * 1000, 10);

    return Math.min(noiseScore, 10);
  };

  const calculateOverallCognitiveLoadScore = (metrics: Omit<CognitiveLoadMetrics, 'overallScore'>): number => {
    // Pesos ajustados para contexto médico
    const weights = {
      elements: 0.20,      // 20% - Quantidade de elementos
      text: 0.15,         // 15% - Densidade de texto
      interactive: 0.12,  // 12% - Elementos interativos
      colors: 0.10,       // 10% - Complexidade de cores
      hierarchy: 0.10,    // 10% - Profundidade hierárquica
      information: 0.10,  // 10% - Densidade informacional
      noise: 0.08,        // 8% - Ruído visual
      medical: 0.08,      // 8% - Complexidade médica específica
      workflow: 0.07      // 7% - Complexidade de fluxo clínico
    };

    // Normalizar e calcular scores parciais
    const elementScore = Math.min(metrics.elementsCount / 200, 1) * 10;
    const textScore = Math.min(metrics.textDensity / 20, 1) * 10;
    const interactiveScore = Math.min(metrics.interactiveElements / 30, 1) * 10;
    const colorScore = metrics.colorComplexity;
    const hierarchyScore = Math.min(metrics.hierarchyDepth / 3, 1) * 10;
    const informationScore = Math.min(metrics.informationDensity / 5, 1) * 10;
    const noiseScore = metrics.visualNoise;
    const medicalScore = metrics.medicalComplexity;
    const workflowScore = metrics.clinicalWorkflowComplexity;

    // Score final ponderado com métricas médicas
    const finalScore = 
      (elementScore * weights.elements) +
      (textScore * weights.text) +
      (interactiveScore * weights.interactive) +
      (colorScore * weights.colors) +
      (hierarchyScore * weights.hierarchy) +
      (informationScore * weights.information) +
      (noiseScore * weights.noise) +
      (medicalScore * weights.medical) +
      (workflowScore * weights.workflow);

    return Math.min(finalScore, 10);
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

    // Complexidade médica específica
    if (metrics.medicalComplexity > 7) {
      issues.push({
        type: 'critical',
        category: 'medical',
        description: 'Terminologia médica muito complexa para público geral',
        impact: 3,
        recommendation: 'Implementar glossário médico e simplificar linguagem técnica'
      });
    } else if (metrics.medicalComplexity > 5) {
      issues.push({
        type: 'high',
        category: 'medical',
        description: 'Densidade alta de termos médicos complexos',
        impact: 2,
        recommendation: 'Adicionar tooltips explicativos para termos técnicos'
      });
    }

    // Complexidade de fluxo clínico
    if (metrics.clinicalWorkflowComplexity > 6) {
      issues.push({
        type: 'high',
        category: 'workflow',
        description: 'Fluxo de trabalho clínico muito complexo',
        impact: 2.5,
        recommendation: 'Simplificar navegação. Criar wizard step-by-step para processos'
      });
    }

    // Score específico do contexto médico
    if (metrics.contextSpecificScore > 7) {
      issues.push({
        type: 'critical',
        category: 'medical',
        description: 'Interface não adequada para contexto de hanseníase',
        impact: 3,
        recommendation: 'Revisar com profissionais de saúde. Simplificar terminologia'
      });
    }

    return issues;
  };

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
          <div>Score Geral: {metrics.overallScore.toFixed(1)}/10</div>
          <div>Score Médico: {metrics.contextSpecificScore.toFixed(1)}/10</div>
          <div>Elementos: {metrics.elementsCount}</div>
          <div>Complexidade Médica: {metrics.medicalComplexity.toFixed(1)}</div>
          <div>Workflow Clínico: {metrics.clinicalWorkflowComplexity.toFixed(1)}</div>
          <div>Issues: {issues.length}</div>
          {metrics.overallScore > 8 && (
            <div style={{ color: '#ff4444' }}>⚠️ COGNITIVE OVERLOAD CRÍTICO</div>
          )}
          {metrics.contextSpecificScore > 7 && (
            <div style={{ color: '#ff8800' }}>⚠️ CONTEXTO MÉDICO INADEQUADO</div>
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