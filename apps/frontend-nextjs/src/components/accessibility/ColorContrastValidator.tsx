/**
 * Color Contrast Validator - Verificação de Contraste de Cores
 * Sistema completo de validação de contraste para WCAG 2.1 AA/AAA
 * 
 * Seguindo princípios de claude_code_optimization_prompt.md:
 * - WCAG 2.1 AA/AAA: Compliance completo para contraste de cores
 * - Medical Context: Validação específica para interfaces médicas críticas
 * - Real-time Analysis: Análise em tempo real de todas as combinações de cores
 * - Daltonism Support: Simulação para diferentes tipos de daltonismo
 */

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

// Interfaces para validação de contraste
interface ColorPair {
  foreground: string;
  background: string;
  foregroundRgb: { r: number; g: number; b: number };
  backgroundRgb: { r: number; g: number; b: number };
  ratio: number;
  passesAA: boolean;
  passesAAA: boolean;
  passesAALarge: boolean;
  passesAAALarge: boolean;
  element: HTMLElement;
  elementInfo: string;
  usage: 'text' | 'large-text' | 'graphic' | 'ui-component';
  fontSize: number;
  fontWeight: string;
  issues: string[];
}

interface ColorAnalysis {
  totalElements: number;
  analyzedPairs: number;
  passedAA: number;
  passedAAA: number;
  failedPairs: ColorPair[];
  criticalFailures: ColorPair[];
  warnings: ColorPair[];
  score: number;
}

interface DaltonismSimulation {
  type: 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';
  name: string;
  percentage: number; // Porcentagem da população afetada
  simulatedRatio: number;
  passesAA: boolean;
}

interface ContrastValidationResult {
  analysis: ColorAnalysis;
  colorPairs: ColorPair[];
  daltonismTests: DaltonismSimulation[];
  recommendations: string[];
  passesWCAG21AA: boolean;
  timestamp: Date;
}

// Hook para validação de contraste de cores
export const useColorContrastValidator = () => {
  const [result, setResult] = useState<ContrastValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Utilitários de cor
  const hexToRgb = useCallback((hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }, []);

  const rgbStringToObject = useCallback((rgb: string): { r: number; g: number; b: number } | null => {
    const match = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!match) return null;
    
    return {
      r: parseInt(match[1]),
      g: parseInt(match[2]),
      b: parseInt(match[3])
    };
  }, []);

  const rgbToHex = useCallback((r: number, g: number, b: number): string => {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }, []);

  const getLuminance = useCallback((r: number, g: number, b: number): number => {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }, []);

  const getContrastRatio = useCallback((color1: { r: number; g: number; b: number }, color2: { r: number; g: number; b: number }): number => {
    const lum1 = getLuminance(color1.r, color1.g, color1.b);
    const lum2 = getLuminance(color2.r, color2.g, color2.b);
    
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    
    return (brightest + 0.05) / (darkest + 0.05);
  }, [getLuminance]);

  // Simulação de daltonismo
  const simulateDaltonism = useCallback((rgb: { r: number; g: number; b: number }, type: DaltonismSimulation['type']): { r: number; g: number; b: number } => {
    const { r, g, b } = rgb;
    
    switch (type) {
      case 'protanopia': // Ausência de cones vermelhos
        return {
          r: Math.round(0.567 * r + 0.433 * g + 0.000 * b),
          g: Math.round(0.558 * r + 0.442 * g + 0.000 * b),
          b: Math.round(0.000 * r + 0.242 * g + 0.758 * b)
        };
      
      case 'deuteranopia': // Ausência de cones verdes
        return {
          r: Math.round(0.625 * r + 0.375 * g + 0.000 * b),
          g: Math.round(0.700 * r + 0.300 * g + 0.000 * b),
          b: Math.round(0.000 * r + 0.300 * g + 0.700 * b)
        };
      
      case 'tritanopia': // Ausência de cones azuis
        return {
          r: Math.round(0.950 * r + 0.050 * g + 0.000 * b),
          g: Math.round(0.000 * r + 0.433 * g + 0.567 * b),
          b: Math.round(0.000 * r + 0.475 * g + 0.525 * b)
        };
      
      case 'achromatopsia': // Monocromático
        const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
        return { r: gray, g: gray, b: gray };
      
      default:
        return rgb;
    }
  }, []);

  const analyzeDaltonism = useCallback((foreground: { r: number; g: number; b: number }, background: { r: number; g: number; b: number }): DaltonismSimulation[] => {
    const daltonismTypes: Array<{ type: DaltonismSimulation['type']; name: string; percentage: number }> = [
      { type: 'protanopia', name: 'Protanopia (sem vermelho)', percentage: 1.0 },
      { type: 'deuteranopia', name: 'Deuteranopia (sem verde)', percentage: 1.1 },
      { type: 'tritanopia', name: 'Tritanopia (sem azul)', percentage: 0.003 },
      { type: 'achromatopsia', name: 'Acromatopsia (monocromático)', percentage: 0.003 }
    ];

    return daltonismTypes.map(({ type, name, percentage }) => {
      const simulatedFg = simulateDaltonism(foreground, type);
      const simulatedBg = simulateDaltonism(background, type);
      const simulatedRatio = getContrastRatio(simulatedFg, simulatedBg);
      
      return {
        type,
        name,
        percentage,
        simulatedRatio,
        passesAA: simulatedRatio >= 4.5
      };
    });
  }, [simulateDaltonism, getContrastRatio]);

  const analyzeElement = useCallback((element: HTMLElement): ColorPair | null => {
    const styles = window.getComputedStyle(element);
    
    // Obter cores
    const foregroundColor = styles.color;
    const backgroundColor = styles.backgroundColor;
    
    // Verificar se o elemento tem texto visível
    const hasText = element.textContent && element.textContent.trim().length > 0;
    if (!hasText) return null;
    
    // Converter cores para RGB
    const foregroundRgb = rgbStringToObject(foregroundColor);
    const backgroundRgb = rgbStringToObject(backgroundColor);
    
    if (!foregroundRgb) return null;
    
    // Se background é transparente, procurar elemento pai com background
    let effectiveBackgroundRgb = backgroundRgb;
    if (!backgroundRgb || (backgroundRgb.r === 0 && backgroundRgb.g === 0 && backgroundRgb.b === 0)) {
      let parent = element.parentElement;
      while (parent && !effectiveBackgroundRgb) {
        const parentStyles = window.getComputedStyle(parent);
        const parentBg = rgbStringToObject(parentStyles.backgroundColor);
        if (parentBg && !(parentBg.r === 0 && parentBg.g === 0 && parentBg.b === 0)) {
          effectiveBackgroundRgb = parentBg;
          break;
        }
        parent = parent.parentElement;
      }
    }
    
    // Se ainda não tem background, assumir branco
    if (!effectiveBackgroundRgb) {
      effectiveBackgroundRgb = { r: 255, g: 255, b: 255 };
    }
    
    // Calcular contraste
    const ratio = getContrastRatio(foregroundRgb, effectiveBackgroundRgb);
    
    // Determinar tamanho e peso da fonte
    const fontSize = parseFloat(styles.fontSize);
    const fontWeight = styles.fontWeight;
    const isLargeText = fontSize >= 18 || (fontSize >= 14 && (fontWeight === 'bold' || parseInt(fontWeight) >= 700));
    
    // Determinar tipo de uso
    let usage: ColorPair['usage'] = 'text';
    if (isLargeText) usage = 'large-text';
    if (element.tagName === 'BUTTON' || element.getAttribute('role') === 'button') usage = 'ui-component';
    if (element.tagName === 'SVG' || element.tagName === 'IMG') usage = 'graphic';
    
    // Verificar compliance
    const passesAA = isLargeText ? ratio >= 3.0 : ratio >= 4.5;
    const passesAAA = isLargeText ? ratio >= 4.5 : ratio >= 7.0;
    const passesAALarge = ratio >= 3.0;
    const passesAAALarge = ratio >= 4.5;
    
    // Identificar issues
    const issues: string[] = [];
    if (!passesAA) {
      issues.push(`Contraste insuficiente para WCAG AA (${ratio.toFixed(2)}:1)`);
    }
    if (!passesAAA) {
      issues.push(`Contraste insuficiente para WCAG AAA (${ratio.toFixed(2)}:1)`);
    }
    if (ratio < 2.0) {
      issues.push('Contraste extremamente baixo - crítico para acessibilidade');
    }
    
    return {
      foreground: rgbToHex(foregroundRgb.r, foregroundRgb.g, foregroundRgb.b),
      background: rgbToHex(effectiveBackgroundRgb.r, effectiveBackgroundRgb.g, effectiveBackgroundRgb.b),
      foregroundRgb,
      backgroundRgb: effectiveBackgroundRgb,
      ratio,
      passesAA,
      passesAAA,
      passesAALarge,
      passesAAALarge,
      element,
      elementInfo: getElementInfo(element),
      usage,
      fontSize,
      fontWeight,
      issues
    };
  }, [rgbStringToObject, getContrastRatio, rgbToHex]);

  const runFullValidation = useCallback(async (): Promise<ContrastValidationResult> => {
    setIsValidating(true);

    // Encontrar todos os elementos com texto
    const textElements = document.querySelectorAll('*');
    const colorPairs: ColorPair[] = [];

    // Analisar cada elemento
    textElements.forEach(element => {
      const pair = analyzeElement(element as HTMLElement);
      if (pair) {
        // Evitar duplicatas
        const isDuplicate = colorPairs.some(existing => 
          existing.foreground === pair.foreground && 
          existing.background === pair.background &&
          existing.usage === pair.usage
        );
        
        if (!isDuplicate) {
          colorPairs.push(pair);
        }
      }
    });

    // Análise estatística
    const totalElements = colorPairs.length;
    const passedAA = colorPairs.filter(pair => pair.passesAA).length;
    const passedAAA = colorPairs.filter(pair => pair.passesAAA).length;
    const failedPairs = colorPairs.filter(pair => !pair.passesAA);
    const criticalFailures = colorPairs.filter(pair => pair.ratio < 3.0);
    const warnings = colorPairs.filter(pair => pair.passesAA && !pair.passesAAA);

    // Calcular score
    let score = 100;
    score -= criticalFailures.length * 20; // Falhas críticas
    score -= failedPairs.length * 10; // Falhas AA
    score -= warnings.length * 2; // Avisos AAA
    score = Math.max(0, score);

    // Testes de daltonismo nos pares mais problemáticos
    const daltonismTests: DaltonismSimulation[] = [];
    const samplePairs = failedPairs.slice(0, 3); // Testar apenas os primeiros 3 problemas
    
    samplePairs.forEach(pair => {
      const tests = analyzeDaltonism(pair.foregroundRgb, pair.backgroundRgb);
      tests.forEach(test => {
        const existingTest = daltonismTests.find(dt => dt.type === test.type);
        if (!existingTest || !existingTest.passesAA) {
          daltonismTests.push(test);
        }
      });
    });

    // Recomendações
    const recommendations: string[] = [];
    
    if (criticalFailures.length > 0) {
      recommendations.push('🚨 CRÍTICO: Ajustar cores com contraste extremamente baixo (<3:1)');
    }
    
    if (failedPairs.length > 0) {
      recommendations.push('📝 Implementar cores que atendam WCAG AA (4.5:1 para texto normal, 3:1 para texto grande)');
    }
    
    if (daltonismTests.some(test => !test.passesAA)) {
      recommendations.push('🌈 Considerar impacto em usuários com daltonismo');
    }
    
    if (warnings.length > 0) {
      recommendations.push('⭐ Para excelência em acessibilidade, considerar WCAG AAA (7:1 para texto normal)');
    }

    recommendations.push('🎨 Usar ferramentas de contraste durante o design');
    recommendations.push('🧪 Testar com simuladores de daltonismo');

    const analysis: ColorAnalysis = {
      totalElements,
      analyzedPairs: colorPairs.length,
      passedAA,
      passedAAA,
      failedPairs,
      criticalFailures,
      warnings,
      score
    };

    const result: ContrastValidationResult = {
      analysis,
      colorPairs,
      daltonismTests,
      recommendations,
      passesWCAG21AA: failedPairs.length === 0,
      timestamp: new Date()
    };

    setIsValidating(false);
    setResult(result);
    
    return result;
  }, [analyzeElement, analyzeDaltonism]);

  return {
    result,
    isValidating,
    runFullValidation
  };
};

// Utilitários
const getElementInfo = (element: HTMLElement): string => {
  const tagName = element.tagName.toLowerCase();
  const id = element.id ? `#${element.id}` : '';
  const classes = element.className ? `.${element.className.split(' ').slice(0, 2).join('.')}` : '';
  const text = element.textContent?.trim().substring(0, 30) || '';
  
  return `${tagName}${id}${classes} "${text}${text.length > 30 ? '...' : ''}"`;
};

// Componente de relatório de contraste
export const ColorContrastReport: React.FC<{
  result: ContrastValidationResult;
  onRevalidate: () => void;
}> = ({ result, onRevalidate }) => {
  const getScoreColor = (score: number): string => {
    if (score >= 90) return '#22c55e';
    if (score >= 70) return '#f59e0b';
    return '#dc2626';
  };

  const getContrastColor = (ratio: number): string => {
    if (ratio >= 7) return '#22c55e'; // AAA
    if (ratio >= 4.5) return '#3b82f6'; // AA
    if (ratio >= 3) return '#f59e0b'; // AA Large
    return '#dc2626'; // Fail
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e2e8f0',
      maxWidth: '1200px',
      margin: '20px auto'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        paddingBottom: '16px',
        borderBottom: '1px solid #e2e8f0'
      }}>
        <div>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: '#1e293b',
            margin: '0 0 8px 0'
          }}>
            🎨 Relatório de Contraste de Cores
          </h2>
          <p style={{
            fontSize: '0.875rem',
            color: '#64748b',
            margin: 0
          }}>
            Validação WCAG 2.1 AA/AAA e simulação de daltonismo
          </p>
        </div>
        
        <button
          onClick={onRevalidate}
          style={{
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '8px 16px',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          🔄 Revalidar
        </button>
      </div>

      {/* Score e Estatísticas */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap: '16px',
        marginBottom: '32px'
      }}>
        <div style={{
          background: '#f8fafc',
          borderRadius: '8px',
          padding: '20px',
          textAlign: 'center',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{
            fontSize: '2rem',
            fontWeight: '700',
            color: getScoreColor(result.analysis.score),
            marginBottom: '8px'
          }}>
            {result.analysis.score}/100
          </div>
          <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
            Score Contraste
          </div>
        </div>

        <div style={{
          background: result.passesWCAG21AA ? '#f0fdf4' : '#fee2e2',
          borderRadius: '8px',
          padding: '20px',
          textAlign: 'center',
          border: `1px solid ${result.passesWCAG21AA ? '#22c55e' : '#dc2626'}`
        }}>
          <div style={{
            fontSize: '1.5rem',
            marginBottom: '8px'
          }}>
            {result.passesWCAG21AA ? '✅' : '❌'}
          </div>
          <div style={{
            fontSize: '0.875rem',
            color: result.passesWCAG21AA ? '#166534' : '#991b1b',
            fontWeight: '600'
          }}>
            WCAG 2.1 AA
          </div>
        </div>

        <div style={{
          background: '#f0f9ff',
          borderRadius: '8px',
          padding: '20px',
          textAlign: 'center',
          border: '1px solid #0ea5e9'
        }}>
          <div style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: '#0284c7',
            marginBottom: '8px'
          }}>
            {result.analysis.passedAA}/{result.analysis.analyzedPairs}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#0369a1' }}>
            Passou AA
          </div>
        </div>

        <div style={{
          background: '#f0fdf4',
          borderRadius: '8px',
          padding: '20px',
          textAlign: 'center',
          border: '1px solid #22c55e'
        }}>
          <div style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: '#166534',
            marginBottom: '8px'
          }}>
            {result.analysis.passedAAA}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#166534' }}>
            Passou AAA
          </div>
        </div>

        <div style={{
          background: result.analysis.criticalFailures.length === 0 ? '#f0fdf4' : '#fee2e2',
          borderRadius: '8px',
          padding: '20px',
          textAlign: 'center',
          border: `1px solid ${result.analysis.criticalFailures.length === 0 ? '#22c55e' : '#dc2626'}`
        }}>
          <div style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: result.analysis.criticalFailures.length === 0 ? '#166534' : '#991b1b',
            marginBottom: '8px'
          }}>
            {result.analysis.criticalFailures.length}
          </div>
          <div style={{
            fontSize: '0.875rem',
            color: result.analysis.criticalFailures.length === 0 ? '#166534' : '#991b1b'
          }}>
            Críticos
          </div>
        </div>
      </div>

      {/* Falhas Críticas */}
      {result.analysis.criticalFailures.length > 0 && (
        <div style={{
          background: '#fee2e2',
          border: '1px solid #dc2626',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <h3 style={{
            fontSize: '1rem',
            fontWeight: '600',
            color: '#991b1b',
            marginBottom: '12px'
          }}>
            🚨 Falhas Críticas de Contraste (&lt;3:1)
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {result.analysis.criticalFailures.slice(0, 5).map((pair, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '8px',
                  background: 'white',
                  borderRadius: '4px',
                  fontSize: '0.875rem'
                }}
              >
                <div style={{ display: 'flex', gap: '4px' }}>
                  <div style={{
                    width: '20px',
                    height: '20px',
                    backgroundColor: pair.foreground,
                    border: '1px solid #ccc'
                  }} />
                  <div style={{
                    width: '20px',
                    height: '20px',
                    backgroundColor: pair.background,
                    border: '1px solid #ccc'
                  }} />
                </div>
                
                <div style={{ flex: 1 }}>
                  <strong style={{ color: '#991b1b' }}>
                    {pair.ratio.toFixed(2)}:1
                  </strong> - {pair.elementInfo}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Testes de Daltonismo */}
      {result.daltonismTests.length > 0 && (
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <h3 style={{
            fontSize: '1rem',
            fontWeight: '600',
            color: '#1e293b',
            marginBottom: '12px'
          }}>
            🌈 Simulação de Daltonismo
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px'
          }}>
            {result.daltonismTests.map((test, index) => (
              <div
                key={index}
                style={{
                  padding: '12px',
                  background: test.passesAA ? '#f0fdf4' : '#fee2e2',
                  borderRadius: '6px',
                  border: `1px solid ${test.passesAA ? '#22c55e' : '#dc2626'}`
                }}
              >
                <div style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: test.passesAA ? '#166534' : '#991b1b',
                  marginBottom: '4px'
                }}>
                  {test.passesAA ? '✅' : '❌'} {test.name}
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  color: '#64748b'
                }}>
                  {test.percentage}% da população
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  color: test.passesAA ? '#166534' : '#991b1b'
                }}>
                  Contraste: {test.simulatedRatio.toFixed(2)}:1
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recomendações */}
      <div style={{
        background: '#fef3c7',
        border: '1px solid #f59e0b',
        borderRadius: '8px',
        padding: '16px'
      }}>
        <h3 style={{
          fontSize: '1rem',
          fontWeight: '600',
          color: '#92400e',
          marginBottom: '12px'
        }}>
          💡 Recomendações para Melhoria
        </h3>
        
        <ul style={{
          margin: 0,
          paddingLeft: '20px',
          fontSize: '0.875rem',
          color: '#92400e',
          lineHeight: '1.6'
        }}>
          {result.recommendations.map((recommendation, index) => (
            <li key={index} style={{ marginBottom: '4px' }}>
              {recommendation}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};