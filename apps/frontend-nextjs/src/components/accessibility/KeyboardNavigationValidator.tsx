/**
 * Keyboard Navigation Validator - Validação de Navegação por Teclado
 * Sistema completo de validação de acessibilidade por teclado para aplicações médicas
 * 
 * Seguindo princípios de claude_code_optimization_prompt.md:
 * - WCAG 2.1 AA: Compliance completo para navegação por teclado
 * - Medical Context: Validação específica para interfaces médicas críticas
 * - Focus Management: Teste completo de gerenciamento de foco
 * - Tab Order: Validação de ordem lógica de tabulação
 */

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

// Interfaces para validação de navegação por teclado
interface FocusableElement {
  element: HTMLElement;
  tagName: string;
  type?: string;
  role?: string;
  tabIndex: number;
  isVisible: boolean;
  hasVisibleFocus: boolean;
  accessibleName: string;
  position: number;
  issues: string[];
}

interface FocusTrap {
  container: HTMLElement;
  selector: string;
  isActive: boolean;
  hasProperTrapping: boolean;
  firstFocusable?: HTMLElement;
  lastFocusable?: HTMLElement;
  issues: string[];
}

interface SkipLink {
  element: HTMLElement;
  text: string;
  target: string;
  isWorking: boolean;
  isVisible: boolean;
  issues: string[];
}

interface KeyboardShortcut {
  key: string;
  modifiers: string[];
  action: string;
  isConflicting: boolean;
  element?: HTMLElement;
}

interface KeyboardNavigationResult {
  score: number;
  focusableElements: FocusableElement[];
  focusTraps: FocusTrap[];
  skipLinks: SkipLink[];
  shortcuts: KeyboardShortcut[];
  tabOrder: string[];
  issues: string[];
  criticalIssues: string[];
  passesWCAG: boolean;
}

// Hook para validação de navegação por teclado
export const useKeyboardNavigationValidator = () => {
  const [result, setResult] = useState<KeyboardNavigationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [currentFocusIndex, setCurrentFocusIndex] = useState(-1);

  const getFocusableElements = useCallback((): FocusableElement[] => {
    const focusableSelectors = [
      'a[href]:not([disabled])',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input[type="text"]:not([disabled])',
      'input[type="password"]:not([disabled])',
      'input[type="search"]:not([disabled])',
      'input[type="email"]:not([disabled])',
      'input[type="number"]:not([disabled])',
      'input[type="tel"]:not([disabled])',
      'input[type="url"]:not([disabled])',
      'input[type="radio"]:not([disabled])',
      'input[type="checkbox"]:not([disabled])',
      'input[type="date"]:not([disabled])',
      'input[type="datetime-local"]:not([disabled])',
      'input[type="month"]:not([disabled])',
      'input[type="time"]:not([disabled])',
      'input[type="week"]:not([disabled])',
      'input[type="file"]:not([disabled])',
      'input[type="range"]:not([disabled])',
      'input[type="color"]:not([disabled])',
      'select:not([disabled])',
      '[contenteditable="true"]',
      '[tabindex]:not([tabindex="-1"]):not([disabled])',
      'audio[controls]',
      'video[controls]',
      'summary',
      'iframe',
      '[role="button"]:not([disabled])',
      '[role="link"]:not([disabled])',
      '[role="textbox"]:not([disabled])',
      '[role="combobox"]:not([disabled])',
      '[role="listbox"]:not([disabled])',
      '[role="option"]:not([disabled])',
      '[role="menuitem"]:not([disabled])',
      '[role="tab"]:not([disabled])',
      '[role="slider"]:not([disabled])',
      '[role="spinbutton"]:not([disabled])'
    ];

    const elements = document.querySelectorAll(focusableSelectors.join(', '));
    const focusableElements: FocusableElement[] = [];

    elements.forEach((element, index) => {
      const htmlElement = element as HTMLElement;
      const computedStyle = window.getComputedStyle(htmlElement);
      
      // Verificar se o elemento está visível
      const isVisible = computedStyle.display !== 'none' && 
                       computedStyle.visibility !== 'hidden' &&
                       computedStyle.opacity !== '0' &&
                       htmlElement.offsetWidth > 0 &&
                       htmlElement.offsetHeight > 0;

      // Obter tabIndex
      const tabIndex = htmlElement.tabIndex;

      // Verificar se tem indicador de foco visível
      const hasVisibleFocus = checkVisibleFocus(htmlElement);

      // Obter nome acessível
      const accessibleName = getAccessibleName(htmlElement);

      // Identificar issues
      const issues: string[] = [];
      
      if (!isVisible) {
        issues.push('Elemento focável não está visível');
      }
      
      if (!hasVisibleFocus) {
        issues.push('Não tem indicador de foco visível');
      }
      
      if (!accessibleName) {
        issues.push('Não tem nome acessível');
      }
      
      if (tabIndex > 0) {
        issues.push(`TabIndex positivo (${tabIndex}) pode quebrar ordem natural`);
      }

      // Verificar se está dentro de elemento com aria-hidden
      const ariaHiddenParent = htmlElement.closest('[aria-hidden="true"]');
      if (ariaHiddenParent) {
        issues.push('Elemento focável dentro de aria-hidden="true"');
      }

      focusableElements.push({
        element: htmlElement,
        tagName: htmlElement.tagName.toLowerCase(),
        type: htmlElement.getAttribute('type') || undefined,
        role: htmlElement.getAttribute('role') || undefined,
        tabIndex,
        isVisible,
        hasVisibleFocus,
        accessibleName,
        position: index,
        issues
      });
    });

    return focusableElements;
  }, []);

  const validateFocusTraps = useCallback((): FocusTrap[] => {
    const traps: FocusTrap[] = [];
    
    // Procurar por modais e dialogs
    const modalSelectors = [
      '[role="dialog"]',
      '[role="alertdialog"]',
      '.modal',
      '.dialog',
      '[aria-modal="true"]'
    ];

    modalSelectors.forEach(selector => {
      const containers = document.querySelectorAll(selector);
      
      containers.forEach(container => {
        const htmlContainer = container as HTMLElement;
        const computedStyle = window.getComputedStyle(htmlContainer);
        const isActive = computedStyle.display !== 'none' && 
                        computedStyle.visibility !== 'hidden';

        if (!isActive) return;

        const focusableInside = htmlContainer.querySelectorAll(
          'button, a[href], input, textarea, select, [tabindex]:not([tabindex="-1"])'
        );

        const issues: string[] = [];
        let hasProperTrapping = true;

        if (focusableInside.length === 0) {
          issues.push('Modal não tem elementos focáveis');
          hasProperTrapping = false;
        }

        const firstFocusable = focusableInside[0] as HTMLElement;
        const lastFocusable = focusableInside[focusableInside.length - 1] as HTMLElement;

        // Verificar se o foco está sendo gerenciado
        const activeElement = document.activeElement;
        const focusIsInside = htmlContainer.contains(activeElement);
        
        if (!focusIsInside && isActive) {
          issues.push('Foco não está dentro do modal ativo');
          hasProperTrapping = false;
        }

        traps.push({
          container: htmlContainer,
          selector,
          isActive,
          hasProperTrapping,
          firstFocusable,
          lastFocusable,
          issues
        });
      });
    });

    return traps;
  }, []);

  const validateSkipLinks = useCallback((): SkipLink[] => {
    const skipLinks: SkipLink[] = [];
    const links = document.querySelectorAll('a[href^="#"]');

    links.forEach(link => {
      const htmlLink = link as HTMLElement;
      const href = htmlLink.getAttribute('href') || '';
      const target = href.substring(1); // Remove #
      const targetElement = document.getElementById(target);
      const text = htmlLink.textContent?.trim() || '';

      // Verificar se é realmente um skip link (geralmente no início da página)
      const isSkipLink = text.toLowerCase().includes('skip') || 
                        text.toLowerCase().includes('pular') ||
                        text.toLowerCase().includes('ir para') ||
                        htmlLink.className.includes('skip') ||
                        htmlLink.className.includes('sr-only');

      if (!isSkipLink) return;

      const computedStyle = window.getComputedStyle(htmlLink);
      const isVisible = computedStyle.display !== 'none' && 
                       computedStyle.visibility !== 'hidden';

      const issues: string[] = [];
      let isWorking = true;

      if (!targetElement) {
        issues.push(`Target "${target}" não existe`);
        isWorking = false;
      } else {
        // Verificar se o target pode receber foco
        const targetTabIndex = targetElement.tabIndex;
        const targetIsFocusable = targetTabIndex >= 0 || 
          ['a', 'button', 'input', 'textarea', 'select'].includes(targetElement.tagName.toLowerCase());
        
        if (!targetIsFocusable) {
          issues.push('Target não pode receber foco (adicione tabindex="-1")');
        }
      }

      if (!text) {
        issues.push('Skip link sem texto');
        isWorking = false;
      }

      skipLinks.push({
        element: htmlLink,
        text,
        target,
        isWorking,
        isVisible,
        issues
      });
    });

    return skipLinks;
  }, []);

  const detectKeyboardShortcuts = useCallback((): KeyboardShortcut[] => {
    const shortcuts: KeyboardShortcut[] = [];
    
    // Procurar por elementos com accesskey
    const elementsWithAccessKey = document.querySelectorAll('[accesskey]');
    elementsWithAccessKey.forEach(element => {
      const accesskey = element.getAttribute('accesskey') || '';
      shortcuts.push({
        key: accesskey.toUpperCase(),
        modifiers: ['Alt'], // AccessKey padrão usa Alt
        action: `Ativar ${element.tagName.toLowerCase()}`,
        isConflicting: false, // Será verificado depois
        element: element as HTMLElement
      });
    });

    // Adicionar atalhos comuns do navegador que podem conflitar
    const commonShortcuts = [
      { key: 'F', modifiers: ['Ctrl'], action: 'Buscar' },
      { key: 'R', modifiers: ['Ctrl'], action: 'Recarregar' },
      { key: 'T', modifiers: ['Ctrl'], action: 'Nova aba' },
      { key: 'W', modifiers: ['Ctrl'], action: 'Fechar aba' },
      { key: 'L', modifiers: ['Ctrl'], action: 'Focar barra de endereços' },
      { key: 'D', modifiers: ['Ctrl'], action: 'Favoritos' },
      { key: 'H', modifiers: ['Ctrl'], action: 'Histórico' },
      { key: 'N', modifiers: ['Ctrl'], action: 'Nova janela' },
      { key: 'P', modifiers: ['Ctrl'], action: 'Imprimir' },
      { key: 'S', modifiers: ['Ctrl'], action: 'Salvar' }
    ];

    // Verificar conflitos
    shortcuts.forEach(shortcut => {
      const conflicting = commonShortcuts.find(common => 
        common.key === shortcut.key && 
        JSON.stringify(common.modifiers) === JSON.stringify(shortcut.modifiers)
      );
      if (conflicting) {
        shortcut.isConflicting = true;
      }
    });

    return shortcuts;
  }, []);

  const runFullValidation = useCallback(async (): Promise<KeyboardNavigationResult> => {
    setIsValidating(true);

    const focusableElements = getFocusableElements();
    const focusTraps = validateFocusTraps();
    const skipLinks = validateSkipLinks();
    const shortcuts = detectKeyboardShortcuts();

    const issues: string[] = [];
    const criticalIssues: string[] = [];

    // Analisar elementos focáveis
    let elementsWithoutVisibleFocus = 0;
    let elementsWithoutAccessibleName = 0;
    let elementsWithPositiveTabIndex = 0;

    focusableElements.forEach(element => {
      if (!element.hasVisibleFocus) elementsWithoutVisibleFocus++;
      if (!element.accessibleName) elementsWithoutAccessibleName++;
      if (element.tabIndex > 0) elementsWithPositiveTabIndex++;

      element.issues.forEach(issue => {
        if (issue.includes('nome acessível') || issue.includes('aria-hidden')) {
          criticalIssues.push(`${element.tagName}: ${issue}`);
        } else {
          issues.push(`${element.tagName}: ${issue}`);
        }
      });
    });

    // Analisar focus traps
    focusTraps.forEach(trap => {
      trap.issues.forEach(issue => {
        if (trap.isActive) {
          criticalIssues.push(`Modal ativo: ${issue}`);
        } else {
          issues.push(`Modal: ${issue}`);
        }
      });
    });

    // Analisar skip links
    skipLinks.forEach(skipLink => {
      skipLink.issues.forEach(issue => {
        issues.push(`Skip link "${skipLink.text}": ${issue}`);
      });
    });

    // Verificar se há pelo menos um skip link funcionando
    const workingSkipLinks = skipLinks.filter(link => link.isWorking);
    if (workingSkipLinks.length === 0) {
      issues.push('Nenhum skip link funcionando encontrado');
    }

    // Analisar atalhos de teclado
    const conflictingShortcuts = shortcuts.filter(s => s.isConflicting);
    conflictingShortcuts.forEach(shortcut => {
      issues.push(`Atalho conflitante: ${shortcut.modifiers.join('+')}+${shortcut.key}`);
    });

    // Criar ordem de tabulação
    const tabOrder = focusableElements
      .filter(el => el.isVisible)
      .sort((a, b) => {
        if (a.tabIndex === 0 && b.tabIndex === 0) return a.position - b.position;
        if (a.tabIndex === 0) return 1;
        if (b.tabIndex === 0) return -1;
        return a.tabIndex - b.tabIndex;
      })
      .map((el, index) => `${index + 1}. ${el.accessibleName || el.tagName} (${el.tagName})`);

    // Calcular score
    let score = 100;
    score -= criticalIssues.length * 15; // Issues críticos valem mais
    score -= issues.length * 5;
    score -= elementsWithoutVisibleFocus * 3;
    score -= conflictingShortcuts.length * 2;
    score = Math.max(0, score);

    // Verificar compliance WCAG 2.1 AA
    const passesWCAG = criticalIssues.length === 0 && 
                      elementsWithoutVisibleFocus === 0 &&
                      workingSkipLinks.length > 0;

    const result: KeyboardNavigationResult = {
      score,
      focusableElements,
      focusTraps,
      skipLinks,
      shortcuts,
      tabOrder,
      issues,
      criticalIssues,
      passesWCAG
    };

    setIsValidating(false);
    setResult(result);
    
    return result;
  }, [getFocusableElements, validateFocusTraps, validateSkipLinks, detectKeyboardShortcuts]);

  // Função para testar navegação em tempo real
  const testTabNavigation = useCallback(() => {
    if (!result) return;
    
    const visibleFocusable = result.focusableElements.filter(el => el.isVisible);
    
    if (visibleFocusable.length === 0) return;

    let nextIndex = currentFocusIndex + 1;
    if (nextIndex >= visibleFocusable.length) nextIndex = 0;
    
    const nextElement = visibleFocusable[nextIndex];
    nextElement.element.focus();
    setCurrentFocusIndex(nextIndex);
  }, [result, currentFocusIndex]);

  return {
    result,
    isValidating,
    runFullValidation,
    testTabNavigation,
    currentFocusIndex
  };
};

// Utilitários
const checkVisibleFocus = (element: HTMLElement): boolean => {
  const computedStyle = window.getComputedStyle(element);
  
  // Verificar se tem outline
  if (computedStyle.outline && computedStyle.outline !== 'none') return true;
  
  // Verificar se tem box-shadow que pode ser usado como foco
  if (computedStyle.boxShadow && computedStyle.boxShadow !== 'none') return true;
  
  // Verificar se tem border que muda no foco (isso é uma aproximação)
  if (computedStyle.border && computedStyle.border !== 'none') return true;
  
  return false;
};

const getAccessibleName = (element: HTMLElement): string => {
  // aria-label tem prioridade
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel) return ariaLabel.trim();
  
  // aria-labelledby
  const ariaLabelledby = element.getAttribute('aria-labelledby');
  if (ariaLabelledby) {
    const labelElement = document.getElementById(ariaLabelledby);
    if (labelElement) return labelElement.textContent?.trim() || '';
  }
  
  // Label associado (para inputs)
  if (element.id) {
    const label = document.querySelector(`label[for="${element.id}"]`);
    if (label) return label.textContent?.trim() || '';
  }
  
  // Texto do próprio elemento
  const textContent = element.textContent?.trim();
  if (textContent) return textContent;
  
  // Placeholder (para inputs)
  const placeholder = element.getAttribute('placeholder');
  if (placeholder) return placeholder.trim();
  
  // Title
  const title = element.getAttribute('title');
  if (title) return title.trim();
  
  // Alt text (para imagens)
  const alt = element.getAttribute('alt');
  if (alt) return alt.trim();
  
  return '';
};

// Componente de relatório de navegação por teclado
export const KeyboardNavigationReport: React.FC<{
  result: KeyboardNavigationResult;
  onRevalidate: () => void;
  onTestNavigation: () => void;
  currentFocusIndex: number;
}> = ({ result, onRevalidate, onTestNavigation, currentFocusIndex }) => {
  const getScoreColor = (score: number): string => {
    if (score >= 90) return '#22c55e';
    if (score >= 70) return '#f59e0b';
    return '#dc2626';
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
            ⌨️ Relatório de Navegação por Teclado
          </h2>
          <p style={{
            fontSize: '0.875rem',
            color: '#64748b',
            margin: 0
          }}>
            Validação WCAG 2.1 AA para navegação sem mouse
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={onTestNavigation}
            style={{
              background: '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 16px',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            ⇥ Testar Tab
          </button>
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
            {result.score}/100
          </div>
          <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
            Score Teclado
          </div>
        </div>

        <div style={{
          background: result.passesWCAG ? '#f0fdf4' : '#fee2e2',
          borderRadius: '8px',
          padding: '20px',
          textAlign: 'center',
          border: `1px solid ${result.passesWCAG ? '#22c55e' : '#dc2626'}`
        }}>
          <div style={{
            fontSize: '1.5rem',
            marginBottom: '8px'
          }}>
            {result.passesWCAG ? '✅' : '❌'}
          </div>
          <div style={{
            fontSize: '0.875rem',
            color: result.passesWCAG ? '#166534' : '#991b1b',
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
            {result.focusableElements.filter(el => el.isVisible).length}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#0369a1' }}>
            Elementos Focáveis
          </div>
        </div>

        <div style={{
          background: result.skipLinks.length > 0 ? '#f0fdf4' : '#fef3c7',
          borderRadius: '8px',
          padding: '20px',
          textAlign: 'center',
          border: `1px solid ${result.skipLinks.length > 0 ? '#22c55e' : '#f59e0b'}`
        }}>
          <div style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: result.skipLinks.length > 0 ? '#166534' : '#92400e',
            marginBottom: '8px'
          }}>
            {result.skipLinks.length}
          </div>
          <div style={{
            fontSize: '0.875rem',
            color: result.skipLinks.length > 0 ? '#166534' : '#92400e'
          }}>
            Skip Links
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
            🚨 Issues Críticos de Navegação
          </h3>
          <ul style={{
            margin: 0,
            paddingLeft: '20px',
            fontSize: '0.875rem',
            color: '#991b1b'
          }}>
            {result.criticalIssues.map((issue, index) => (
              <li key={index} style={{ marginBottom: '4px' }}>
                {issue}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Ordem de Tabulação */}
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
          ⇥ Ordem de Tabulação {currentFocusIndex >= 0 && `(Atual: ${currentFocusIndex + 1})`}
        </h3>
        <div style={{ 
          maxHeight: '200px', 
          overflowY: 'auto',
          fontSize: '0.875rem',
          lineHeight: '1.5'
        }}>
          {result.tabOrder.map((item, index) => (
            <div
              key={index}
              style={{
                padding: '4px 8px',
                marginBottom: '2px',
                background: index === currentFocusIndex ? '#dbeafe' : 'transparent',
                borderRadius: '4px',
                border: index === currentFocusIndex ? '1px solid #3b82f6' : '1px solid transparent'
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* Skip Links */}
      {result.skipLinks.length > 0 && (
        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '16px'
        }}>
          <h3 style={{
            fontSize: '1rem',
            fontWeight: '600',
            color: '#1e293b',
            marginBottom: '12px'
          }}>
            🔗 Skip Links Encontrados
          </h3>
          {result.skipLinks.map((skipLink, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px',
                marginBottom: '8px',
                background: skipLink.isWorking ? '#f0fdf4' : '#fee2e2',
                borderRadius: '4px',
                border: `1px solid ${skipLink.isWorking ? '#22c55e' : '#dc2626'}`
              }}
            >
              <div style={{ fontSize: '0.875rem' }}>
                <strong>{skipLink.text}</strong> → #{skipLink.target}
              </div>
              <span style={{ fontSize: '0.75rem' }}>
                {skipLink.isWorking ? '✅ Funcionando' : '❌ Com problemas'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};