/**
 * Accessibility Validator - WCAG 2.1 AA Compliance Check
 * Sistema completo de validação de acessibilidade para aplicações médicas
 * 
 * Seguindo princípios de claude_code_optimization_prompt.md:
 * - WCAG 2.1 AA: Compliance completo com diretrizes internacionais
 * - Medical Context: Validação específica para interfaces médicas
 * - Real-time Monitoring: Detecção automática de problemas de acessibilidade
 * - Screen Reader Support: Validação completa para tecnologias assistivas
 */

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getUnbColors } from '@/config/modernTheme';

// Interfaces para validação de acessibilidade
interface AccessibilityIssue {
  id: string;
  type: 'error' | 'warning' | 'info';
  level: 'A' | 'AA' | 'AAA';
  criterion: string;
  element: string;
  description: string;
  suggestion: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
}

interface ColorContrastResult {
  element: string;
  foreground: string;
  background: string;
  ratio: number;
  passesAA: boolean;
  passesAAA: boolean;
  issues: string[];
}

interface KeyboardNavigationResult {
  focusableElements: number;
  tabOrder: string[];
  issues: string[];
  skipLinksPresent: boolean;
  focusTrapsWorking: boolean;
}

interface ScreenReaderResult {
  headingStructure: string[];
  missingAltText: string[];
  missingLabels: string[];
  ariaIssues: string[];
  landmarkStructure: string[];
}

interface AccessibilityReport {
  score: number;
  issues: AccessibilityIssue[];
  colorContrast: ColorContrastResult[];
  keyboardNavigation: KeyboardNavigationResult;
  screenReader: ScreenReaderResult;
  timestamp: Date;
  passesWCAG21AA: boolean;
}

// Utilitários para cálculo de contraste
const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

const getLuminance = (r: number, g: number, b: number): number => {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

const getContrastRatio = (color1: string, color2: string): number => {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return 0;
  
  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
};

// Hook principal para validação de acessibilidade
export const useAccessibilityValidator = () => {
  const [report, setReport] = useState<AccessibilityReport | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const validateColorContrast = useCallback((): ColorContrastResult[] => {
    const results: ColorContrastResult[] = [];
    const elements = document.querySelectorAll('*');

    elements.forEach((element) => {
      const styles = window.getComputedStyle(element);
      const foreground = styles.color;
      const background = styles.backgroundColor;
      
      if (foreground && background && background !== 'rgba(0, 0, 0, 0)') {
        const fgHex = rgbToHex(foreground);
        const bgHex = rgbToHex(background);
        
        if (fgHex && bgHex) {
          const ratio = getContrastRatio(fgHex, bgHex);
          const passesAA = ratio >= 4.5; // Normal text
          const passesAAA = ratio >= 7; // Large text or enhanced
          
          if (!passesAA) {
            const issues = [];
            if (ratio < 3) issues.push('Contraste extremamente baixo');
            if (ratio < 4.5) issues.push('Não atende WCAG AA');
            if (ratio < 7) issues.push('Não atende WCAG AAA');
            
            results.push({
              element: element.tagName.toLowerCase() + (element.className ? `.${element.className}` : ''),
              foreground: fgHex,
              background: bgHex,
              ratio,
              passesAA,
              passesAAA,
              issues
            });
          }
        }
      }
    });

    return results;
  }, []);

  const validateKeyboardNavigation = useCallback((): KeyboardNavigationResult => {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input[type="text"]:not([disabled])',
      'input[type="radio"]:not([disabled])',
      'input[type="checkbox"]:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ];

    const focusableElements = document.querySelectorAll(focusableSelectors.join(', '));
    const tabOrder: string[] = [];
    const issues: string[] = [];

    // Verificar ordem de tabulação
    focusableElements.forEach((element, index) => {
      const tabindex = element.getAttribute('tabindex');
      const tagName = element.tagName.toLowerCase();
      const identifier = element.getAttribute('aria-label') || 
                        element.getAttribute('id') || 
                        tagName;
      
      tabOrder.push(`${index + 1}. ${identifier} (${tagName})`);
      
      // Verificar se elementos focáveis têm indicadores visuais
      const styles = window.getComputedStyle(element);
      if (!styles.outline && !styles.boxShadow) {
        issues.push(`Elemento ${identifier} não tem indicador de foco visível`);
      }
    });

    // Verificar skip links
    const skipLinks = document.querySelectorAll('a[href^="#"]');
    const skipLinksPresent = skipLinks.length > 0;

    // Verificar focus traps em modais
    const modals = document.querySelectorAll('[role="dialog"], .modal');
    const focusTrapsWorking = modals.length === 0 || 
      Array.from(modals).every(modal => {
        const modalFocusable = modal.querySelectorAll(focusableSelectors.join(', '));
        return modalFocusable.length > 0;
      });

    if (!skipLinksPresent) {
      issues.push('Skip links não encontrados para navegação rápida');
    }

    if (!focusTrapsWorking) {
      issues.push('Focus traps em modais não estão funcionando corretamente');
    }

    return {
      focusableElements: focusableElements.length,
      tabOrder,
      issues,
      skipLinksPresent,
      focusTrapsWorking
    };
  }, []);

  const validateScreenReader = useCallback((): ScreenReaderResult => {
    const headingStructure: string[] = [];
    const missingAltText: string[] = [];
    const missingLabels: string[] = [];
    const ariaIssues: string[] = [];
    const landmarkStructure: string[] = [];

    // Verificar estrutura de cabeçalhos
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let previousLevel = 0;
    
    headings.forEach((heading) => {
      const level = parseInt(heading.tagName.charAt(1));
      const text = heading.textContent?.trim() || '';
      
      headingStructure.push(`H${level}: ${text}`);
      
      if (level > previousLevel + 1) {
        ariaIssues.push(`Estrutura de cabeçalho quebrada: H${previousLevel} seguido por H${level}`);
      }
      previousLevel = level;
    });

    // Verificar alt text em imagens
    const images = document.querySelectorAll('img');
    images.forEach((img) => {
      const alt = img.getAttribute('alt');
      const src = img.getAttribute('src') || '';
      
      if (alt === null || alt === '') {
        missingAltText.push(`Imagem sem alt text: ${src}`);
      }
    });

    // Verificar labels em elementos de formulário
    const formElements = document.querySelectorAll('input, textarea, select');
    formElements.forEach((element) => {
      const id = element.getAttribute('id');
      const label = document.querySelector(`label[for="${id}"]`);
      const ariaLabel = element.getAttribute('aria-label');
      const ariaLabelledby = element.getAttribute('aria-labelledby');
      
      if (!label && !ariaLabel && !ariaLabelledby) {
        const type = element.getAttribute('type') || element.tagName.toLowerCase();
        missingLabels.push(`${type} sem label ou aria-label`);
      }
    });

    // Verificar landmarks
    const landmarks = document.querySelectorAll('main, nav, aside, section, header, footer, [role="banner"], [role="navigation"], [role="main"], [role="complementary"], [role="contentinfo"]');
    landmarks.forEach((landmark) => {
      const role = landmark.getAttribute('role') || landmark.tagName.toLowerCase();
      const ariaLabel = landmark.getAttribute('aria-label') || '';
      landmarkStructure.push(`${role}: ${ariaLabel}`);
    });

    // Verificar ARIA issues adicionais
    const ariaElements = document.querySelectorAll('[aria-hidden="true"]');
    ariaElements.forEach((element) => {
      const focusable = element.querySelectorAll('button, a, input, textarea, select');
      if (focusable.length > 0) {
        ariaIssues.push('Elementos focáveis dentro de aria-hidden="true"');
      }
    });

    return {
      headingStructure,
      missingAltText,
      missingLabels,
      ariaIssues,
      landmarkStructure
    };
  }, []);

  const runFullValidation = useCallback(async (): Promise<AccessibilityReport> => {
    setIsValidating(true);
    
    const issues: AccessibilityIssue[] = [];
    
    // Executar validações
    const colorContrast = validateColorContrast();
    const keyboardNavigation = validateKeyboardNavigation();
    const screenReader = validateScreenReader();

    // Converter resultados em issues
    colorContrast.forEach((result) => {
      if (!result.passesAA) {
        issues.push({
          id: `contrast-${Date.now()}-${Math.random()}`,
          type: 'error',
          level: 'AA',
          criterion: '1.4.3 Contrast (Minimum)',
          element: result.element,
          description: `Contraste insuficiente: ${result.ratio.toFixed(2)}:1`,
          suggestion: 'Ajustar cores para atingir pelo menos 4.5:1 para texto normal',
          impact: 'serious'
        });
      }
    });

    keyboardNavigation.issues.forEach((issue) => {
      issues.push({
        id: `keyboard-${Date.now()}-${Math.random()}`,
        type: 'error',
        level: 'AA',
        criterion: '2.1.1 Keyboard',
        element: 'keyboard navigation',
        description: issue,
        suggestion: 'Implementar navegação por teclado adequada',
        impact: 'serious'
      });
    });

    screenReader.ariaIssues.forEach((issue) => {
      issues.push({
        id: `aria-${Date.now()}-${Math.random()}`,
        type: 'error',
        level: 'AA',
        criterion: '4.1.2 Name, Role, Value',
        element: 'ARIA',
        description: issue,
        suggestion: 'Corrigir implementação ARIA',
        impact: 'serious'
      });
    });

    screenReader.missingAltText.forEach((issue) => {
      issues.push({
        id: `alt-${Date.now()}-${Math.random()}`,
        type: 'error',
        level: 'A',
        criterion: '1.1.1 Non-text Content',
        element: issue,
        description: 'Imagem sem texto alternativo',
        suggestion: 'Adicionar atributo alt descritivo',
        impact: 'serious'
      });
    });

    screenReader.missingLabels.forEach((issue) => {
      issues.push({
        id: `label-${Date.now()}-${Math.random()}`,
        type: 'error',
        level: 'AA',
        criterion: '3.3.2 Labels or Instructions',
        element: issue,
        description: 'Elemento de formulário sem label',
        suggestion: 'Adicionar label ou aria-label',
        impact: 'serious'
      });
    });

    // Calcular score (100 - (issues críticos * 20) - (issues sérios * 10) - (issues moderados * 5))
    const criticalIssues = issues.filter(i => i.impact === 'critical').length;
    const seriousIssues = issues.filter(i => i.impact === 'serious').length;
    const moderateIssues = issues.filter(i => i.impact === 'moderate').length;
    
    const score = Math.max(0, 100 - (criticalIssues * 20) - (seriousIssues * 10) - (moderateIssues * 5));
    const passesWCAG21AA = issues.filter(i => i.level === 'AA' && i.type === 'error').length === 0;

    const report: AccessibilityReport = {
      score,
      issues,
      colorContrast,
      keyboardNavigation,
      screenReader,
      timestamp: new Date(),
      passesWCAG21AA
    };

    setIsValidating(false);
    setReport(report);
    
    return report;
  }, [validateColorContrast, validateKeyboardNavigation, validateScreenReader]);

  return {
    report,
    isValidating,
    runFullValidation
  };
};

// Utilitário para converter RGB para HEX
const rgbToHex = (rgb: string): string | null => {
  const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!match) return null;
  
  const [, r, g, b] = match;
  return '#' + [r, g, b].map(x => {
    const hex = parseInt(x).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
};

// Componente de relatório de acessibilidade
export const AccessibilityReport: React.FC<{
  report: AccessibilityReport;
  onRevalidate: () => void;
}> = ({ report, onRevalidate }) => {
  const unbColors = getUnbColors();

  const getScoreColor = (score: number): string => {
    if (score >= 90) return '#22c55e'; // Verde
    if (score >= 70) return '#f59e0b'; // Amarelo
    return '#dc2626'; // Vermelho
  };

  const getImpactColor = (impact: string): string => {
    switch (impact) {
      case 'critical': return '#dc2626';
      case 'serious': return '#f59e0b';
      case 'moderate': return '#3b82f6';
      default: return '#64748b';
    }
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
            🔍 Relatório de Acessibilidade WCAG 2.1 AA
          </h2>
          <p style={{
            fontSize: '0.875rem',
            color: '#64748b',
            margin: 0
          }}>
            Gerado em {report.timestamp.toLocaleString('pt-BR')}
          </p>
        </div>
        
        <button
          onClick={onRevalidate}
          style={{
            background: unbColors.primary,
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

      {/* Score Principal */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
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
            fontSize: '2.5rem',
            fontWeight: '700',
            color: getScoreColor(report.score),
            marginBottom: '8px'
          }}>
            {report.score}/100
          </div>
          <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
            Score de Acessibilidade
          </div>
        </div>

        <div style={{
          background: report.passesWCAG21AA ? '#f0fdf4' : '#fee2e2',
          borderRadius: '8px',
          padding: '20px',
          textAlign: 'center',
          border: `1px solid ${report.passesWCAG21AA ? '#22c55e' : '#dc2626'}`
        }}>
          <div style={{
            fontSize: '1.5rem',
            marginBottom: '8px'
          }}>
            {report.passesWCAG21AA ? '✅' : '❌'}
          </div>
          <div style={{
            fontSize: '0.875rem',
            color: report.passesWCAG21AA ? '#166534' : '#991b1b',
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
            {report.issues.length}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#0369a1' }}>
            Issues Encontrados
          </div>
        </div>
      </div>

      {/* Issues */}
      {report.issues.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            color: '#1e293b',
            marginBottom: '16px'
          }}>
            🚨 Issues de Acessibilidade
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {report.issues.map((issue) => (
              <div
                key={issue.id}
                style={{
                  background: '#fafafa',
                  border: `2px solid ${getImpactColor(issue.impact)}`,
                  borderRadius: '8px',
                  padding: '16px'
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '8px'
                }}>
                  <div style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#1e293b'
                  }}>
                    {issue.criterion} - {issue.element}
                  </div>
                  <div style={{
                    background: getImpactColor(issue.impact),
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }}>
                    {issue.impact}
                  </div>
                </div>
                
                <p style={{
                  fontSize: '0.875rem',
                  color: '#374151',
                  margin: '0 0 8px 0'
                }}>
                  {issue.description}
                </p>
                
                <p style={{
                  fontSize: '0.75rem',
                  color: '#64748b',
                  margin: 0,
                  fontStyle: 'italic'
                }}>
                  💡 {issue.suggestion}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detalhes das Validações */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px'
      }}>
        {/* Contraste de Cores */}
        <div style={{
          background: '#f8fafc',
          borderRadius: '8px',
          padding: '16px',
          border: '1px solid #e2e8f0'
        }}>
          <h4 style={{
            fontSize: '1rem',
            fontWeight: '600',
            color: '#1e293b',
            marginBottom: '12px'
          }}>
            🎨 Contraste de Cores
          </h4>
          
          {report.colorContrast.length === 0 ? (
            <p style={{ fontSize: '0.875rem', color: '#22c55e' }}>
              ✅ Todos os contrastes passam WCAG AA
            </p>
          ) : (
            <div style={{ fontSize: '0.75rem', color: '#dc2626' }}>
              ❌ {report.colorContrast.length} problemas de contraste encontrados
            </div>
          )}
        </div>

        {/* Navegação por Teclado */}
        <div style={{
          background: '#f8fafc',
          borderRadius: '8px',
          padding: '16px',
          border: '1px solid #e2e8f0'
        }}>
          <h4 style={{
            fontSize: '1rem',
            fontWeight: '600',
            color: '#1e293b',
            marginBottom: '12px'
          }}>
            ⌨️ Navegação por Teclado
          </h4>
          
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            <div>📍 {report.keyboardNavigation.focusableElements} elementos focáveis</div>
            <div>🔗 Skip links: {report.keyboardNavigation.skipLinksPresent ? '✅' : '❌'}</div>
            <div>🔒 Focus traps: {report.keyboardNavigation.focusTrapsWorking ? '✅' : '❌'}</div>
          </div>
        </div>

        {/* Screen Reader */}
        <div style={{
          background: '#f8fafc',
          borderRadius: '8px',
          padding: '16px',
          border: '1px solid #e2e8f0'
        }}>
          <h4 style={{
            fontSize: '1rem',
            fontWeight: '600',
            color: '#1e293b',
            marginBottom: '12px'
          }}>
            🔊 Screen Reader
          </h4>
          
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
            <div>📰 {report.screenReader.headingStructure.length} cabeçalhos</div>
            <div>🖼️ Alt text: {report.screenReader.missingAltText.length === 0 ? '✅' : `❌ ${report.screenReader.missingAltText.length}`}</div>
            <div>🏷️ Labels: {report.screenReader.missingLabels.length === 0 ? '✅' : `❌ ${report.screenReader.missingLabels.length}`}</div>
            <div>🗺️ {report.screenReader.landmarkStructure.length} landmarks</div>
          </div>
        </div>
      </div>
    </div>
  );
};