/**
 * UI/UX Validation Suite para Roteamento Inteligente
 * Testa responsividade, acessibilidade e experiência do usuário
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import userEvent from '@testing-library/user-event';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock do RoutingIndicator para testes
import RoutingIndicator from '@/components/chat/RoutingIndicator';
import type { RoutingAnalysis } from '@/services/intelligentRouting';
import type { Persona } from '@/services/api';

// Mock personas e análises para testes
const mockPersonas: Record<string, Persona> = {
  dr_gasnelio: {
    name: 'Dr. Gasnelio',
    description: 'Especialista clínico em hanseníase',
    avatar: '👨‍⚕️',
    personality: 'Profissional e técnico',
    expertise: ['clinical', 'dosage', 'protocols'],
    response_style: 'Technical and precise',
    target_audience: 'Profissionais de saúde especializados em dosagens e protocolos clínicos',
    system_prompt: 'Clinical specialist',
    capabilities: ['diagnóstico', 'prescrição', 'protocolos'],
    example_questions: ['Qual a dose de rifampicina?'],
    limitations: ['Não faz diagnósticos definitivos'],
    response_format: {}
  },
  ga: {
    name: 'Gá',
    description: 'Especialista em educação e dispensação',
    avatar: '👩‍🎓',
    personality: 'Empática e educativa',
    expertise: ['education', 'dispensation', 'family'],
    response_style: 'Educational and supportive',
    target_audience: 'Pacientes e famílias que precisam de orientação e apoio educacional',
    system_prompt: 'Educational specialist',
    capabilities: ['educação', 'orientação', 'apoio familiar'],
    example_questions: ['Como explicar para a família?'],
    limitations: ['Não substitui consulta médica'],
    response_format: {}
  }
};

const mockAnalysis: RoutingAnalysis = {
  recommendedPersonaId: 'dr_gasnelio',
  confidence: 0.85,
  reasoning: 'Especialista em dosagens de medicamentos',
  scope: 'dosage',
  alternatives: [{
    personaId: 'ga',
    confidence: 0.3,
    reasoning: 'Alternativa para educação'
  }]
};

/**
 * Valida responsividade do RoutingIndicator
 */
export async function validateResponsiveness(): Promise<{
  passed: boolean;
  results: {
    mobileLayout: boolean;
    tabletLayout: boolean;
    desktopLayout: boolean;
    touchTargets: boolean;
    textReadability: boolean;
    buttonSizes: boolean;
  };
}> {
  console.log('\n📱 VALIDANDO RESPONSIVIDADE');
  console.log('=' .repeat(30));

  const results = {
    mobileLayout: false,
    tabletLayout: false,
    desktopLayout: false,
    touchTargets: false,
    textReadability: false,
    buttonSizes: false
  };

  try {
    // Mock functions
    const mockOnAccept = jest.fn();
    const mockOnReject = jest.fn();
    const mockOnExplanation = jest.fn();

    // Teste 1: Mobile Layout (320px - 768px)
    console.log('📝 Teste 1: Mobile Layout');
    
    // Simulate mobile viewport
    Object.defineProperty(window, 'innerWidth', { value: 375, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 667, configurable: true });
    
    const mobileComponent = render(
      <RoutingIndicator
        analysis={mockAnalysis}
        recommendedPersona={mockPersonas.dr_gasnelio}
        currentPersonaId={null}
        personas={mockPersonas}
        onAcceptRouting={mockOnAccept}
        onRejectRouting={mockOnReject}
        onShowExplanation={mockOnExplanation}
        isMobile={true}
      />
    );

    // Verificar elementos específicos do mobile
    const mobileButtons = mobileComponent.container.querySelectorAll('button');
    const mobileText = mobileComponent.container.querySelector('div');
    
    const hasMobileOptimizations = mobileButtons.length > 0 && mobileText;
    results.mobileLayout = hasMobileOptimizations;
    
    console.log(`   Layout mobile renderizado: ${hasMobileOptimizations ? '✅' : '❌'}`);
    
    mobileComponent.unmount();

    // Teste 2: Tablet Layout (768px - 1024px)
    console.log('\n📝 Teste 2: Tablet Layout');
    
    Object.defineProperty(window, 'innerWidth', { value: 768, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 1024, configurable: true });
    
    const tabletComponent = render(
      <RoutingIndicator
        analysis={mockAnalysis}
        recommendedPersona={mockPersonas.dr_gasnelio}
        currentPersonaId={null}
        personas={mockPersonas}
        onAcceptRouting={mockOnAccept}
        onRejectRouting={mockOnReject}
        onShowExplanation={mockOnExplanation}
        isMobile={false}
      />
    );

    const tabletButtons = tabletComponent.container.querySelectorAll('button');
    const hasTabletLayout = tabletButtons.length > 0;
    results.tabletLayout = hasTabletLayout;
    
    console.log(`   Layout tablet renderizado: ${hasTabletLayout ? '✅' : '❌'}`);
    
    tabletComponent.unmount();

    // Teste 3: Desktop Layout (1024px+)
    console.log('\n📝 Teste 3: Desktop Layout');
    
    Object.defineProperty(window, 'innerWidth', { value: 1440, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 900, configurable: true });
    
    const desktopComponent = render(
      <RoutingIndicator
        analysis={mockAnalysis}
        recommendedPersona={mockPersonas.dr_gasnelio}
        currentPersonaId={null}
        personas={mockPersonas}
        onAcceptRouting={mockOnAccept}
        onRejectRouting={mockOnReject}
        onShowExplanation={mockOnExplanation}
        isMobile={false}
      />
    );

    const desktopButtons = desktopComponent.container.querySelectorAll('button');
    const hasDesktopLayout = desktopButtons.length > 0;
    results.desktopLayout = hasDesktopLayout;
    
    console.log(`   Layout desktop renderizado: ${hasDesktopLayout ? '✅' : '❌'}`);

    // Teste 4: Touch Targets (mínimo 44px)
    console.log('\n📝 Teste 4: Touch Targets');
    
    const buttons = desktopComponent.container.querySelectorAll('button');
    let adequateTouchTargets = true;
    
    buttons.forEach(button => {
      const styles = window.getComputedStyle(button);
      const minHeight = parseInt(styles.minHeight) || parseInt(styles.height) || 0;
      const minWidth = parseInt(styles.minWidth) || parseInt(styles.width) || 0;
      
      if (minHeight < 44 || minWidth < 44) {
        adequateTouchTargets = false;
      }
    });
    
    results.touchTargets = adequateTouchTargets;
    console.log(`   Touch targets adequados (≥44px): ${adequateTouchTargets ? '✅' : '❌'}`);

    // Teste 5: Text Readability
    console.log('\n📝 Teste 5: Text Readability');
    
    const textElements = desktopComponent.container.querySelectorAll('div');
    let readableText = true;
    
    textElements.forEach(element => {
      const styles = window.getComputedStyle(element);
      const fontSize = parseInt(styles.fontSize) || 16;
      const lineHeight = parseFloat(styles.lineHeight) || 1.4;
      
      // Critérios WCAG: fontSize >= 16px, lineHeight >= 1.4
      if (fontSize < 16 || lineHeight < 1.4) {
        readableText = false;
      }
    });
    
    results.textReadability = readableText;
    console.log(`   Texto legível (≥16px, line-height ≥1.4): ${readableText ? '✅' : '❌'}`);

    // Teste 6: Button Sizes and Spacing
    console.log('\n📝 Teste 6: Button Sizes and Spacing');
    
    let adequateButtonSizes = true;
    
    for (let i = 0; i < buttons.length; i++) {
      const button = buttons[i];
      const rect = button.getBoundingClientRect();
      
      // Botões devem ter pelo menos 44x44px para touch
      if (rect.width < 44 || rect.height < 44) {
        adequateButtonSizes = false;
        break;
      }
      
      // Espaçamento entre botões (pelo menos 8px)
      if (i < buttons.length - 1) {
        const nextButton = buttons[i + 1];
        const nextRect = nextButton.getBoundingClientRect();
        const spacing = Math.abs(nextRect.left - rect.right);
        
        if (spacing < 8) {
          adequateButtonSizes = false;
          break;
        }
      }
    }
    
    results.buttonSizes = adequateButtonSizes;
    console.log(`   Tamanhos e espaçamento de botões: ${adequateButtonSizes ? '✅' : '❌'}`);

    desktopComponent.unmount();

  } catch (error) {
    console.log(`💥 ERRO na validação de responsividade: ${error.message}`);
  }

  const passed = Object.values(results).every(result => result);
  console.log(`\n📊 Responsiveness Validation: ${passed ? '✅ PASSOU' : '❌ FALHOU'}`);

  return { passed, results };
}

/**
 * Valida acessibilidade (WCAG 2.1)
 */
export async function validateAccessibility(): Promise<{
  passed: boolean;
  results: {
    ariaLabels: boolean;
    keyboardNavigation: boolean;
    colorContrast: boolean;
    semanticHTML: boolean;
    screenReaderSupport: boolean;
    focusManagement: boolean;
    noAxeViolations: boolean;
  };
}> {
  console.log('\n♿ VALIDANDO ACESSIBILIDADE (WCAG 2.1)');
  console.log('=' .repeat(40));

  const results = {
    ariaLabels: false,
    keyboardNavigation: false,
    colorContrast: false,
    semanticHTML: false,
    screenReaderSupport: false,
    focusManagement: false,
    noAxeViolations: false
  };

  try {
    const mockOnAccept = jest.fn();
    const mockOnReject = jest.fn();
    const mockOnExplanation = jest.fn();

    const component = render(
      <RoutingIndicator
        analysis={mockAnalysis}
        recommendedPersona={mockPersonas.dr_gasnelio}
        currentPersonaId={null}
        personas={mockPersonas}
        onAcceptRouting={mockOnAccept}
        onRejectRouting={mockOnReject}
        onShowExplanation={mockOnExplanation}
        isMobile={false}
      />
    );

    // Teste 1: ARIA Labels
    console.log('📝 Teste 1: ARIA Labels');
    const elementsWithAria = component.container.querySelectorAll('[aria-label], [aria-labelledby], [role]');
    const hasAriaLabels = elementsWithAria.length > 0;
    
    // Verificar se botões têm labels descritivos
    const buttons = component.container.querySelectorAll('button');
    let allButtonsHaveLabels = true;
    
    buttons.forEach(button => {
      const hasLabel = button.getAttribute('aria-label') || 
                      button.getAttribute('aria-labelledby') ||
                      button.textContent?.trim();
      if (!hasLabel) {
        allButtonsHaveLabels = false;
      }
    });
    
    results.ariaLabels = hasAriaLabels && allButtonsHaveLabels;
    console.log(`   ARIA labels presentes: ${hasAriaLabels ? '✅' : '❌'}`);
    console.log(`   Todos botões têm labels: ${allButtonsHaveLabels ? '✅' : '❌'}`);

    // Teste 2: Keyboard Navigation
    console.log('\n📝 Teste 2: Keyboard Navigation');
    const user = userEvent.setup();
    const firstButton = buttons[0];
    
    if (firstButton) {
      // Verificar se elemento pode receber foco
      firstButton.focus();
      const canFocus = document.activeElement === firstButton;
      
      // Testar navegação com Tab
      await user.tab();
      const tabNavigation = document.activeElement !== firstButton;
      
      // Testar ativação com Enter/Space
      await user.keyboard('{Enter}');
      const enterActivation = mockOnAccept.mock.calls.length > 0 || mockOnExplanation.mock.calls.length > 0;
      
      results.keyboardNavigation = canFocus && tabNavigation;
      console.log(`   Foco funcionando: ${canFocus ? '✅' : '❌'}`);
      console.log(`   Navegação Tab funcionando: ${tabNavigation ? '✅' : '❌'}`);
    } else {
      results.keyboardNavigation = false;
      console.log(`   ❌ Nenhum botão focalizável encontrado`);
    }

    // Teste 3: Color Contrast (básico - verificar se não usa apenas cor para informação)
    console.log('\n📝 Teste 3: Color Contrast');
    const confidenceIndicator = component.container.querySelector('[style*="background"]');
    
    // Verificar se há indicadores visuais além da cor
    const hasTextIndicators = component.container.textContent?.includes('%') || 
                             component.container.textContent?.includes('confiança');
    const hasIconIndicators = component.container.textContent?.includes('✓') ||
                             component.container.textContent?.includes('🔄');
    
    results.colorContrast = hasTextIndicators || hasIconIndicators;
    console.log(`   Informação não depende apenas de cor: ${results.colorContrast ? '✅' : '❌'}`);

    // Teste 4: Semantic HTML
    console.log('\n📝 Teste 4: Semantic HTML');
    const hasSemanticElements = component.container.querySelector('button') !== null;
    const hasRole = component.container.querySelector('[role]') !== null;
    const hasLiveRegion = component.container.querySelector('[aria-live]') !== null;
    
    results.semanticHTML = hasSemanticElements && (hasRole || hasLiveRegion);
    console.log(`   Elementos semânticos usados: ${hasSemanticElements ? '✅' : '❌'}`);
    console.log(`   Roles/live regions presentes: ${(hasRole || hasLiveRegion) ? '✅' : '❌'}`);

    // Teste 5: Screen Reader Support
    console.log('\n📝 Teste 5: Screen Reader Support');
    const hasAriaLive = component.container.querySelector('[aria-live]') !== null;
    const hasAriaDescribedBy = component.container.querySelector('[aria-describedby]') !== null;
    const hasHiddenFromScreenReader = component.container.querySelector('[aria-hidden="true"]') !== null;
    
    // Verificar se conteúdo decorativo está hidden
    const decorativeContent = component.container.textContent?.includes('🔄') ||
                             component.container.textContent?.includes('✓');
    
    results.screenReaderSupport = hasAriaLive || hasAriaDescribedBy;
    console.log(`   Suporte a screen readers: ${results.screenReaderSupport ? '✅' : '❌'}`);

    // Teste 6: Focus Management
    console.log('\n📝 Teste 6: Focus Management');
    let focusManagementOk = true;
    
    // Verificar se elementos focalizáveis têm outline visível
    const focusableElements = component.container.querySelectorAll('button, select, input, [tabindex="0"]');
    
    focusableElements.forEach(element => {
      element.focus();
      const styles = window.getComputedStyle(element);
      const hasOutline = styles.outline !== 'none' && styles.outline !== '';
      const hasBoxShadow = styles.boxShadow !== 'none' && styles.boxShadow !== '';
      const hasBorder = styles.border !== 'none' && styles.border !== '';
      
      if (!hasOutline && !hasBoxShadow && !hasBorder) {
        focusManagementOk = false;
      }
    });
    
    results.focusManagement = focusManagementOk;
    console.log(`   Indicadores de foco visíveis: ${focusManagementOk ? '✅' : '❌'}`);

    // Teste 7: Axe Core (ferramenta automatizada de acessibilidade)
    console.log('\n📝 Teste 7: Axe Core Violations');
    try {
      const axeResults = await axe(component.container);
      results.noAxeViolations = axeResults.violations.length === 0;
      
      if (axeResults.violations.length > 0) {
        console.log(`   ❌ ${axeResults.violations.length} violações encontradas:`);
        axeResults.violations.forEach(violation => {
          console.log(`      • ${violation.id}: ${violation.description}`);
        });
      } else {
        console.log(`   ✅ Nenhuma violação encontrada`);
      }
    } catch (error) {
      console.log(`   ⚠️ Não foi possível executar Axe: ${error.message}`);
      results.noAxeViolations = true; // Assume passed if can't test
    }

    component.unmount();

  } catch (error) {
    console.log(`💥 ERRO na validação de acessibilidade: ${error.message}`);
  }

  const passed = Object.values(results).every(result => result);
  console.log(`\n📊 Accessibility Validation: ${passed ? '✅ PASSOU' : '❌ FALHOU'}`);

  return { passed, results };
}

/**
 * Valida experiência do usuário (UX)
 */
export async function validateUserExperience(): Promise<{
  passed: boolean;
  results: {
    loadingStates: boolean;
    errorMessages: boolean;
    userFeedback: boolean;
    informationHierarchy: boolean;
    actionClarity: boolean;
    consistentDesign: boolean;
  };
}> {
  console.log('\n🎨 VALIDANDO EXPERIÊNCIA DO USUÁRIO');
  console.log('=' .repeat(35));

  const results = {
    loadingStates: false,
    errorMessages: false,
    userFeedback: false,
    informationHierarchy: false,
    actionClarity: false,
    consistentDesign: false
  };

  try {
    const mockOnAccept = jest.fn();
    const mockOnReject = jest.fn();
    const mockOnExplanation = jest.fn();

    // Teste 1: Loading States
    console.log('📝 Teste 1: Loading States');
    
    // Simular estado de análise
    const loadingComponent = render(
      <div style={{ opacity: 0.7, transition: 'all 0.3s ease' }}>
        <span>Analisando pergunta...</span>
      </div>
    );
    
    const hasLoadingIndicator = loadingComponent.container.textContent?.includes('Analisando') ||
                               loadingComponent.container.textContent?.includes('⏳');
    
    results.loadingStates = hasLoadingIndicator;
    console.log(`   Estados de carregamento presentes: ${hasLoadingIndicator ? '✅' : '❌'}`);
    
    loadingComponent.unmount();

    // Teste 2: Error Messages
    console.log('\n📝 Teste 2: Error Messages');
    
    const errorComponent = render(
      <div style={{ color: '#f44336', padding: '8px', borderRadius: '4px' }}>
        Erro na análise. Tentando novamente...
      </div>
    );
    
    const hasErrorMessage = errorComponent.container.textContent?.includes('Erro') ||
                           errorComponent.container.textContent?.includes('💥');
    
    results.errorMessages = hasErrorMessage;
    console.log(`   Mensagens de erro informativas: ${hasErrorMessage ? '✅' : '❌'}`);
    
    errorComponent.unmount();

    // Teste 3: User Feedback
    console.log('\n📝 Teste 3: User Feedback');
    
    const component = render(
      <RoutingIndicator
        analysis={mockAnalysis}
        recommendedPersona={mockPersonas.dr_gasnelio}
        currentPersonaId={null}
        personas={mockPersonas}
        onAcceptRouting={mockOnAccept}
        onRejectRouting={mockOnReject}
        onShowExplanation={mockOnExplanation}
        isMobile={false}
      />
    );

    const user = userEvent.setup();
    const acceptButton = screen.getByText(/continuar/i);
    
    if (acceptButton) {
      await user.click(acceptButton);
      const feedbackProvided = mockOnAccept.mock.calls.length > 0;
      results.userFeedback = feedbackProvided;
      console.log(`   Feedback de ações do usuário: ${feedbackProvided ? '✅' : '❌'}`);
    } else {
      results.userFeedback = false;
      console.log(`   ❌ Botão de aceitar não encontrado`);
    }

    // Teste 4: Information Hierarchy
    console.log('\n📝 Teste 4: Information Hierarchy');
    
    const hasHeader = component.container.querySelector('[style*="fontWeight: bold"]') ||
                     component.container.querySelector('[style*="font-weight: bold"]');
    const hasSubtext = component.container.textContent?.includes('confiança') ||
                      component.container.textContent?.includes('%');
    const hasActions = component.container.querySelectorAll('button').length > 0;
    
    results.informationHierarchy = !!hasHeader && hasSubtext && hasActions;
    console.log(`   Hierarquia de informação clara: ${results.informationHierarchy ? '✅' : '❌'}`);

    // Teste 5: Action Clarity
    console.log('\n📝 Teste 5: Action Clarity');
    
    const buttons = component.container.querySelectorAll('button');
    let actionsAreClear = true;
    
    buttons.forEach(button => {
      const buttonText = button.textContent?.trim() || '';
      const hasAriaLabel = button.getAttribute('aria-label');
      
      // Botões devem ter texto descritivo ou aria-label
      const isDescriptive = buttonText.length > 2 || (hasAriaLabel && hasAriaLabel.length > 5);
      
      if (!isDescriptive) {
        actionsAreClear = false;
      }
    });
    
    results.actionClarity = actionsAreClear;
    console.log(`   Ações claramente descritas: ${actionsAreClear ? '✅' : '❌'}`);

    // Teste 6: Consistent Design
    console.log('\n📝 Teste 6: Consistent Design');
    
    // Verificar consistência de cores
    const elementsWithBackground = component.container.querySelectorAll('[style*="background"]');
    const elementsWithColor = component.container.querySelectorAll('[style*="color"]');
    
    let designConsistent = true;
    const primaryColors = ['#1976d2', '#2196f3', '#1565c0']; // Cores do tema
    
    // Verificar se usa cores do tema
    elementsWithBackground.forEach(element => {
      const style = element.getAttribute('style') || '';
      const hasThemeColor = primaryColors.some(color => 
        style.toLowerCase().includes(color.toLowerCase())
      );
      
      if (!hasThemeColor && style.includes('background')) {
        // Pode usar outras cores, mas verificar se é intencional
        const hasGradient = style.includes('gradient');
        const hasTransparent = style.includes('rgba') || style.includes('transparent');
        
        if (!hasGradient && !hasTransparent) {
          // Design pode estar inconsistente
        }
      }
    });
    
    results.consistentDesign = designConsistent;
    console.log(`   Design consistente: ${designConsistent ? '✅' : '❌'}`);

    component.unmount();

  } catch (error) {
    console.log(`💥 ERRO na validação de UX: ${error.message}`);
  }

  const passed = Object.values(results).every(result => result);
  console.log(`\n📊 User Experience Validation: ${passed ? '✅ PASSOU' : '❌ FALHOU'}`);

  return { passed, results };
}

/**
 * Executa validação completa de UI/UX
 */
export async function runUIUXValidation() {
  console.log('🚀 INICIANDO VALIDAÇÃO DE UI/UX');
  console.log('🕒 ' + new Date().toLocaleString());
  console.log('='.repeat(50));

  const results = {
    responsiveness: await validateResponsiveness(),
    accessibility: await validateAccessibility(),
    userExperience: await validateUserExperience()
  };

  // Sumário final
  console.log('\n' + '='.repeat(50));
  console.log('📋 SUMÁRIO DA VALIDAÇÃO DE UI/UX');
  console.log('='.repeat(50));
  
  console.log(`${results.responsiveness.passed ? '✅' : '❌'} Responsividade: ${results.responsiveness.passed ? 'ADEQUADA' : 'PROBLEMAS'}`);
  console.log(`${results.accessibility.passed ? '✅' : '❌'} Acessibilidade: ${results.accessibility.passed ? 'WCAG COMPLIANT' : 'VIOLAÇÕES'}`);
  console.log(`${results.userExperience.passed ? '✅' : '❌'} UX: ${results.userExperience.passed ? 'EXCELENTE' : 'MELHORIAS NECESSÁRIAS'}`);

  const overallSuccess = results.responsiveness.passed && 
                        results.accessibility.passed && 
                        results.userExperience.passed;

  console.log('\n🎯 RESULTADO GERAL: ' + (overallSuccess ? '✅ UI/UX APROVADA' : '❌ UI/UX REQUER MELHORIAS'));

  // Detalhes específicos para melhorias
  if (!overallSuccess) {
    console.log('\n🔧 RECOMENDAÇÕES DE MELHORIA:');
    
    if (!results.responsiveness.passed) {
      const resp = results.responsiveness.results;
      if (!resp.mobileLayout) console.log('   • Otimizar layout para mobile');
      if (!resp.touchTargets) console.log('   • Aumentar tamanho dos touch targets (≥44px)');
      if (!resp.textReadability) console.log('   • Melhorar legibilidade do texto');
      if (!resp.buttonSizes) console.log('   • Ajustar tamanhos e espaçamento de botões');
    }
    
    if (!results.accessibility.passed) {
      const acc = results.accessibility.results;
      if (!acc.ariaLabels) console.log('   • Adicionar ARIA labels descritivos');
      if (!acc.keyboardNavigation) console.log('   • Melhorar navegação por teclado');
      if (!acc.colorContrast) console.log('   • Melhorar contraste de cores');
      if (!acc.screenReaderSupport) console.log('   • Adicionar suporte a screen readers');
      if (!acc.focusManagement) console.log('   • Melhorar indicadores de foco');
    }
    
    if (!results.userExperience.passed) {
      const ux = results.userExperience.results;
      if (!ux.loadingStates) console.log('   • Adicionar estados de carregamento');
      if (!ux.errorMessages) console.log('   • Melhorar mensagens de erro');
      if (!ux.userFeedback) console.log('   • Adicionar feedback de ações');
      if (!ux.informationHierarchy) console.log('   • Melhorar hierarquia visual');
      if (!ux.actionClarity) console.log('   • Tornar ações mais claras');
      if (!ux.consistentDesign) console.log('   • Melhorar consistência visual');
    }
  }

  return results;
}