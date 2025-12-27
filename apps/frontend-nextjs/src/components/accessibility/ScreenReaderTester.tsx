/**
 * Screen Reader Tester - Validação de Tecnologias Assistivas
 * Sistema completo de testes para screen readers e outras tecnologias assistivas
 * 
 * Seguindo princípios de claude_code_optimization_prompt.md:
 * - Medical Context: Testes específicos para interfaces médicas
 * - ARIA Best Practices: Implementação correta de ARIA roles e properties
 * - Screen Reader Compatibility: Testes para NVDA, JAWS, VoiceOver
 * - Real-time Feedback: Validação em tempo real de conteúdo acessível
 */

'use client';

import React, { useState, useCallback } from 'react';

// Interfaces para testes de screen reader
interface ScreenReaderTest {
  id: string;
  name: string;
  description: string;
  element: HTMLElement | null;
  expected: string;
  actual: string;
  passed: boolean;
  impact: 'critical' | 'high' | 'medium' | 'low';
}

interface ARIAValidation {
  element: string;
  role: string;
  properties: string[];
  states: string[];
  issues: string[];
  isValid: boolean;
}

interface HeadingStructure {
  level: number;
  text: string;
  element: HTMLElement;
  hasProperStructure: boolean;
  issues: string[];
}

interface LandmarkStructure {
  type: string;
  label: string;
  element: HTMLElement;
  hasUniqueLabel: boolean;
  isProperlyNested: boolean;
}

interface ScreenReaderTestResult {
  tests: ScreenReaderTest[];
  ariaValidations: ARIAValidation[];
  headingStructure: HeadingStructure[];
  landmarkStructure: LandmarkStructure[];
  score: number;
  passedTests: number;
  totalTests: number;
  criticalIssues: string[];
}

// Hook para testes de screen reader
export const useScreenReaderTester = () => {
  const [testResult, setTestResult] = useState<ScreenReaderTestResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const validateARIA = useCallback((): ARIAValidation[] => {
    const validations: ARIAValidation[] = [];
    const elementsWithARIA = document.querySelectorAll('[role], [aria-label], [aria-labelledby], [aria-describedby], [aria-expanded], [aria-hidden], [aria-live]');

    elementsWithARIA.forEach((element) => {
      const role = element.getAttribute('role') || '';
      const ariaAttributes = Array.from(element.attributes)
        .filter(attr => attr.name.startsWith('aria-'))
        .map(attr => attr.name);
      
      const properties = ariaAttributes.filter(attr => 
        ['aria-label', 'aria-labelledby', 'aria-describedby', 'aria-required', 'aria-invalid'].includes(attr)
      );
      
      const states = ariaAttributes.filter(attr => 
        ['aria-expanded', 'aria-hidden', 'aria-pressed', 'aria-checked', 'aria-selected'].includes(attr)
      );

      const issues: string[] = [];
      let isValid = true;

      // Validar role
      if (role) {
        const validRoles = [
          'alert', 'alertdialog', 'application', 'article', 'banner', 'button',
          'cell', 'checkbox', 'columnheader', 'combobox', 'complementary',
          'contentinfo', 'dialog', 'document', 'feed', 'figure', 'form',
          'grid', 'gridcell', 'group', 'heading', 'img', 'link', 'list',
          'listbox', 'listitem', 'main', 'menu', 'menubar', 'menuitem',
          'navigation', 'none', 'option', 'presentation', 'progressbar',
          'radio', 'radiogroup', 'region', 'row', 'rowgroup', 'rowheader',
          'scrollbar', 'search', 'separator', 'slider', 'spinbutton',
          'status', 'switch', 'tab', 'table', 'tablist', 'tabpanel',
          'textbox', 'timer', 'toolbar', 'tooltip', 'tree', 'treegrid',
          'treeitem'
        ];

        if (!validRoles.includes(role)) {
          issues.push(`Role "${role}" inválido ou não reconhecido`);
          isValid = false;
        }
      }

      // Validar aria-labelledby references
      const labelledby = element.getAttribute('aria-labelledby');
      if (labelledby) {
        const ids = labelledby.split(' ');
        ids.forEach(id => {
          if (!document.getElementById(id)) {
            issues.push(`aria-labelledby referencia ID "${id}" que não existe`);
            isValid = false;
          }
        });
      }

      // Validar aria-describedby references
      const describedby = element.getAttribute('aria-describedby');
      if (describedby) {
        const ids = describedby.split(' ');
        ids.forEach(id => {
          if (!document.getElementById(id)) {
            issues.push(`aria-describedby referencia ID "${id}" que não existe`);
            isValid = false;
          }
        });
      }

      // Validar elementos focáveis com aria-hidden
      if (element.getAttribute('aria-hidden') === 'true') {
        const focusableElements = element.querySelectorAll(
          'button, a[href], input, textarea, select, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length > 0) {
          issues.push('Elementos focáveis dentro de aria-hidden="true"');
          isValid = false;
        }
      }

      // Validar elementos interactive sem nome acessível
      const interactiveRoles = ['button', 'link', 'textbox', 'combobox', 'listbox'];
      const isInteractive = interactiveRoles.includes(role) || 
        ['BUTTON', 'A', 'INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName);

      if (isInteractive) {
        const hasAccessibleName = !!(
          element.getAttribute('aria-label') ||
          element.getAttribute('aria-labelledby') ||
          element.textContent?.trim() ||
          (element as HTMLInputElement).placeholder ||
          element.getAttribute('title')
        );

        if (!hasAccessibleName) {
          issues.push('Elemento interativo sem nome acessível');
          isValid = false;
        }
      }

      validations.push({
        element: getElementSelector(element),
        role,
        properties,
        states,
        issues,
        isValid
      });
    });

    return validations;
  }, []);

  const validateHeadingStructure = useCallback((): HeadingStructure[] => {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const structure: HeadingStructure[] = [];
    let previousLevel = 0;

    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.charAt(1));
      const text = heading.textContent?.trim() || '';
      const issues: string[] = [];
      let hasProperStructure = true;

      // Verificar se é o primeiro cabeçalho
      if (index === 0 && level !== 1) {
        issues.push('Primeiro cabeçalho deveria ser H1');
        hasProperStructure = false;
      }

      // Verificar sequência lógica
      if (level > previousLevel + 1) {
        issues.push(`Sequência de cabeçalho quebrada: H${previousLevel} seguido por H${level}`);
        hasProperStructure = false;
      }

      // Verificar se o cabeçalho tem texto
      if (!text) {
        issues.push('Cabeçalho vazio');
        hasProperStructure = false;
      }

      // Verificar se cabeçalho é muito longo
      if (text.length > 120) {
        issues.push('Cabeçalho muito longo (>120 caracteres)');
      }

      structure.push({
        level,
        text,
        element: heading as HTMLElement,
        hasProperStructure,
        issues
      });

      previousLevel = level;
    });

    return structure;
  }, []);

  const validateLandmarkStructure = useCallback((): LandmarkStructure[] => {
    const landmarks = document.querySelectorAll(
      'main, nav, aside, section, article, header, footer, [role="banner"], [role="navigation"], [role="main"], [role="complementary"], [role="contentinfo"], [role="search"], [role="form"]'
    );
    
    const structure: LandmarkStructure[] = [];
    const labelCounts: Record<string, number> = {};

    landmarks.forEach((landmark) => {
      const role = landmark.getAttribute('role') || landmark.tagName.toLowerCase();
      const ariaLabel = landmark.getAttribute('aria-label') || '';
      const ariaLabelledby = landmark.getAttribute('aria-labelledby') || '';
      
      // Determinar o label efetivo
      let effectiveLabel = ariaLabel;
      if (!effectiveLabel && ariaLabelledby) {
        const labelElement = document.getElementById(ariaLabelledby);
        effectiveLabel = labelElement?.textContent?.trim() || '';
      }
      if (!effectiveLabel && ['nav', 'section', 'aside'].includes(role)) {
        const heading = landmark.querySelector('h1, h2, h3, h4, h5, h6');
        effectiveLabel = heading?.textContent?.trim() || '';
      }

      // Contar labels para verificar unicidade
      const landmarkKey = `${role}:${effectiveLabel}`;
      labelCounts[landmarkKey] = (labelCounts[landmarkKey] || 0) + 1;

      // Verificar se está propriamente aninhado
      const isProperlyNested = !landmark.closest(
        'main, nav, aside, section, article, [role="main"], [role="navigation"], [role="complementary"]'
      ) || landmark.tagName.toLowerCase() === 'main' || role === 'main';

      structure.push({
        type: role,
        label: effectiveLabel,
        element: landmark as HTMLElement,
        hasUniqueLabel: true, // Will be updated below
        isProperlyNested
      });
    });

    // Atualizar unicidade dos labels
    structure.forEach((landmark) => {
      const landmarkKey = `${landmark.type}:${landmark.label}`;
      landmark.hasUniqueLabel = labelCounts[landmarkKey] === 1;
    });

    return structure;
  }, []);

  const runScreenReaderTests = useCallback((): ScreenReaderTest[] => {
    const tests: ScreenReaderTest[] = [];

    // Teste 1: Verificar se todas as imagens têm alt text
    const images = document.querySelectorAll('img');
    images.forEach((img, index) => {
      const alt = img.getAttribute('alt');
      const src = img.getAttribute('src') || '';
      
      tests.push({
        id: `img-alt-${index}`,
        name: 'Imagem com Alt Text',
        description: `Verificar se imagem ${src} tem texto alternativo`,
        element: img,
        expected: 'Atributo alt presente e descritivo',
        actual: alt ? `alt="${alt}"` : 'Sem atributo alt',
        passed: alt !== null && alt !== '',
        impact: 'critical'
      });
    });

    // Teste 2: Verificar links com texto descritivo
    const links = document.querySelectorAll('a[href]');
    links.forEach((link, index) => {
      const text = link.textContent?.trim() || '';
      const ariaLabel = link.getAttribute('aria-label') || '';
      const hasDescriptiveText = text.length > 0 && !['clique aqui', 'leia mais', 'saiba mais'].includes(text.toLowerCase());
      
      tests.push({
        id: `link-text-${index}`,
        name: 'Link com Texto Descritivo',
        description: `Verificar se link tem texto descritivo`,
        element: link as HTMLElement,
        expected: 'Texto do link descreve o destino',
        actual: ariaLabel || text || 'Sem texto',
        passed: hasDescriptiveText || !!ariaLabel,
        impact: 'high'
      });
    });

    // Teste 3: Verificar elementos de formulário com labels
    const formElements = document.querySelectorAll('input, textarea, select');
    formElements.forEach((element, index) => {
      const id = element.getAttribute('id');
      const label = id ? document.querySelector(`label[for="${id}"]`) : null;
      const ariaLabel = element.getAttribute('aria-label');
      const ariaLabelledby = element.getAttribute('aria-labelledby');
      
      const hasLabel = !!(label || ariaLabel || ariaLabelledby);
      
      tests.push({
        id: `form-label-${index}`,
        name: 'Elemento de Formulário com Label',
        description: `Verificar se ${element.tagName.toLowerCase()} tem label`,
        element: element as HTMLElement,
        expected: 'Label, aria-label ou aria-labelledby presente',
        actual: hasLabel ? 'Label presente' : 'Sem label',
        passed: hasLabel,
        impact: 'critical'
      });
    });

    // Teste 4: Verificar botões com texto ou aria-label
    const buttons = document.querySelectorAll('button, [role="button"]');
    buttons.forEach((button, index) => {
      const text = button.textContent?.trim() || '';
      const ariaLabel = button.getAttribute('aria-label') || '';
      const hasAccessibleName = text.length > 0 || ariaLabel.length > 0;
      
      tests.push({
        id: `button-name-${index}`,
        name: 'Botão com Nome Acessível',
        description: `Verificar se botão tem nome acessível`,
        element: button as HTMLElement,
        expected: 'Texto ou aria-label presente',
        actual: ariaLabel || text || 'Sem nome acessível',
        passed: hasAccessibleName,
        impact: 'critical'
      });
    });

    // Teste 5: Verificar skip links
    const skipLinks = document.querySelectorAll('a[href^="#"]');
    const hasSkipLinks = skipLinks.length > 0;
    
    tests.push({
      id: 'skip-links',
      name: 'Skip Links Presentes',
      description: 'Verificar se existem skip links para navegação rápida',
      element: skipLinks[0] as HTMLElement || null,
      expected: 'Pelo menos um skip link presente',
      actual: hasSkipLinks ? `${skipLinks.length} skip links encontrados` : 'Nenhum skip link',
      passed: hasSkipLinks,
      impact: 'medium'
    });

    // Teste 6: Verificar live regions
    const liveRegions = document.querySelectorAll('[aria-live], [role="status"], [role="alert"]');
    const hasLiveRegions = liveRegions.length > 0;
    
    tests.push({
      id: 'live-regions',
      name: 'Live Regions para Anúncios',
      description: 'Verificar se existem live regions para anúncios dinâmicos',
      element: liveRegions[0] as HTMLElement || null,
      expected: 'Live regions para conteúdo dinâmico',
      actual: hasLiveRegions ? `${liveRegions.length} live regions` : 'Nenhuma live region',
      passed: hasLiveRegions,
      impact: 'medium'
    });

    return tests;
  }, []);

  const runFullTest = useCallback(async (): Promise<ScreenReaderTestResult> => {
    setIsRunning(true);

    const tests = runScreenReaderTests();
    const ariaValidations = validateARIA();
    const headingStructure = validateHeadingStructure();
    const landmarkStructure = validateLandmarkStructure();

    const passedTests = tests.filter(test => test.passed).length;
    const totalTests = tests.length;
    const score = Math.round((passedTests / totalTests) * 100);

    const criticalIssues: string[] = [];
    
    // Adicionar issues críticos
    tests.forEach(test => {
      if (!test.passed && test.impact === 'critical') {
        criticalIssues.push(`${test.name}: ${test.description}`);
      }
    });

    ariaValidations.forEach(validation => {
      if (!validation.isValid) {
        validation.issues.forEach(issue => {
          criticalIssues.push(`ARIA - ${validation.element}: ${issue}`);
        });
      }
    });

    headingStructure.forEach(heading => {
      if (!heading.hasProperStructure) {
        heading.issues.forEach(issue => {
          criticalIssues.push(`Cabeçalho H${heading.level}: ${issue}`);
        });
      }
    });

    const result: ScreenReaderTestResult = {
      tests,
      ariaValidations,
      headingStructure,
      landmarkStructure,
      score,
      passedTests,
      totalTests,
      criticalIssues
    };

    setIsRunning(false);
    setTestResult(result);
    
    return result;
  }, [runScreenReaderTests, validateARIA, validateHeadingStructure, validateLandmarkStructure]);

  return {
    testResult,
    isRunning,
    runFullTest
  };
};

// Utilitário para obter seletor CSS de um elemento
const getElementSelector = (element: Element): string => {
  if (element.id) return `#${element.id}`;
  if (element.className) {
    const classes = Array.from(element.classList).slice(0, 2).join('.');
    return `${element.tagName.toLowerCase()}.${classes}`;
  }
  return element.tagName.toLowerCase();
};

// Componente de relatório de testes de screen reader
export const ScreenReaderTestReport: React.FC<{
  result: ScreenReaderTestResult;
  onRetest: () => void;
}> = ({ result, onRetest }) => {
  const getScoreColor = (score: number): string => {
    if (score >= 90) return '#22c55e';
    if (score >= 70) return '#f59e0b';
    return '#dc2626';
  };

  const getImpactColor = (impact: string): string => {
    switch (impact) {
      case 'critical': return '#dc2626';
      case 'high': return '#f59e0b';
      case 'medium': return '#3b82f6';
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
            🔊 Relatório de Testes de Screen Reader
          </h2>
          <p style={{
            fontSize: '0.875rem',
            color: '#64748b',
            margin: 0
          }}>
            Validação para NVDA, JAWS, VoiceOver e outras tecnologias assistivas
          </p>
        </div>
        
        <button
          onClick={onRetest}
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
          🔄 Executar Novamente
        </button>
      </div>

      {/* Score e Estatísticas */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
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
            color: getScoreColor(result.score),
            marginBottom: '8px'
          }}>
            {result.score}%
          </div>
          <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
            Score Screen Reader
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
            {result.passedTests}/{result.totalTests}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#0369a1' }}>
            Testes Aprovados
          </div>
        </div>

        <div style={{
          background: result.criticalIssues.length === 0 ? '#f0fdf4' : '#fee2e2',
          borderRadius: '8px',
          padding: '20px',
          textAlign: 'center',
          border: `1px solid ${result.criticalIssues.length === 0 ? '#22c55e' : '#dc2626'}`
        }}>
          <div style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: result.criticalIssues.length === 0 ? '#166534' : '#991b1b',
            marginBottom: '8px'
          }}>
            {result.criticalIssues.length}
          </div>
          <div style={{
            fontSize: '0.875rem',
            color: result.criticalIssues.length === 0 ? '#166534' : '#991b1b'
          }}>
            Issues Críticos
          </div>
        </div>
      </div>

      {/* Issues Críticos */}
      {result.criticalIssues.length > 0 && (
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
            🚨 Issues Críticos para Screen Reader
          </h3>
          <ul style={{
            margin: 0,
            paddingLeft: '20px',
            fontSize: '0.875rem',
            color: '#991b1b'
          }}>
            {result.criticalIssues.slice(0, 10).map((issue, index) => (
              <li key={index} style={{ marginBottom: '4px' }}>
                {issue}
              </li>
            ))}
            {result.criticalIssues.length > 10 && (
              <li style={{ fontStyle: 'italic' }}>
                ... e mais {result.criticalIssues.length - 10} issues
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Estrutura de Cabeçalhos */}
      <div style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '20px'
      }}>
        <h3 style={{
          fontSize: '1rem',
          fontWeight: '600',
          color: '#1e293b',
          marginBottom: '12px'
        }}>
          📰 Estrutura de Cabeçalhos
        </h3>
        {result.headingStructure.length === 0 ? (
          <p style={{ fontSize: '0.875rem', color: '#dc2626' }}>
            ❌ Nenhum cabeçalho encontrado
          </p>
        ) : (
          <div style={{ fontSize: '0.875rem' }}>
            {result.headingStructure.map((heading, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '8px',
                  padding: '8px',
                  background: heading.hasProperStructure ? '#f0fdf4' : '#fee2e2',
                  borderRadius: '4px',
                  border: `1px solid ${heading.hasProperStructure ? '#22c55e' : '#dc2626'}`
                }}
              >
                <span style={{
                  marginRight: '12px',
                  fontWeight: '600',
                  color: heading.hasProperStructure ? '#166534' : '#991b1b'
                }}>
                  H{heading.level}
                </span>
                <span style={{ flex: 1, marginRight: '12px' }}>
                  {heading.text || '<sem texto>'}
                </span>
                <span style={{
                  fontSize: '0.75rem',
                  color: heading.hasProperStructure ? '#166534' : '#991b1b'
                }}>
                  {heading.hasProperStructure ? '✅' : '❌'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Estrutura de Landmarks */}
      <div style={{
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '20px'
      }}>
        <h3 style={{
          fontSize: '1rem',
          fontWeight: '600',
          color: '#1e293b',
          marginBottom: '12px'
        }}>
          🗺️ Estrutura de Landmarks
        </h3>
        {result.landmarkStructure.length === 0 ? (
          <p style={{ fontSize: '0.875rem', color: '#f59e0b' }}>
            ⚠️ Nenhum landmark encontrado
          </p>
        ) : (
          <div style={{ fontSize: '0.875rem' }}>
            {result.landmarkStructure.map((landmark, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '8px',
                  padding: '8px',
                  background: '#f0f9ff',
                  borderRadius: '4px',
                  border: '1px solid #0ea5e9'
                }}
              >
                <span style={{
                  marginRight: '12px',
                  fontWeight: '600',
                  color: '#0369a1'
                }}>
                  {landmark.type}
                </span>
                <span style={{ flex: 1, marginRight: '12px' }}>
                  {landmark.label || '<sem label>'}
                </span>
                <span style={{
                  fontSize: '0.75rem',
                  color: landmark.hasUniqueLabel && landmark.isProperlyNested ? '#166534' : '#f59e0b'
                }}>
                  {landmark.hasUniqueLabel && landmark.isProperlyNested ? '✅' : '⚠️'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};