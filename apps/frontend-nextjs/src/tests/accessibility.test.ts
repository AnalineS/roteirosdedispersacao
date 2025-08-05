/**
 * Testes de Acessibilidade Automatizados
 * Valida conformidade WCAG 2.1 AA
 */

interface AccessibilityViolation {
  type: 'error' | 'warning';
  rule: string;
  description: string;
  element?: string;
  severity: 'critical' | 'serious' | 'moderate' | 'minor';
}

interface AccessibilityTestResult {
  passed: boolean;
  violations: AccessibilityViolation[];
  score: number;
  testedElements: number;
}

export class AccessibilityValidator {
  private violations: AccessibilityViolation[] = [];
  
  /**
   * Executa todos os testes de acessibilidade
   */
  async runAccessibilityTests(document: Document): Promise<AccessibilityTestResult> {
    this.violations = [];
    
    // Executar todos os testes
    this.testImages(document);
    this.testButtons(document);
    this.testLinks(document);
    this.testForms(document);
    this.testHeadings(document);
    this.testColors(document);
    this.testKeyboardNavigation(document);
    this.testLandmarks(document);
    this.testAriaLabels(document);
    
    const testedElements = document.querySelectorAll('*').length;
    const criticalViolations = this.violations.filter(v => v.severity === 'critical').length;
    const seriousViolations = this.violations.filter(v => v.severity === 'serious').length;
    
    // Calcular score (100 - (critical*20 + serious*10 + moderate*5 + minor*1))
    const score = Math.max(0, 100 - (
      criticalViolations * 20 +
      seriousViolations * 10 +
      this.violations.filter(v => v.severity === 'moderate').length * 5 +
      this.violations.filter(v => v.severity === 'minor').length * 1
    ));
    
    return {
      passed: criticalViolations === 0 && seriousViolations === 0,
      violations: this.violations,
      score,
      testedElements
    };
  }
  
  /**
   * Teste 1: Imagens devem ter alt text
   */
  private testImages(document: Document): void {
    const images = document.querySelectorAll('img');
    
    images.forEach((img, index) => {
      const alt = img.getAttribute('alt');
      const ariaLabel = img.getAttribute('aria-label');
      const role = img.getAttribute('role');
      
      // Imagens decorativas devem ter alt="" ou role="presentation"
      if (role === 'presentation' || alt === '') {
        return; // OK - imagem decorativa
      }
      
      // Imagens informativas devem ter alt text ou aria-label
      if (!alt && !ariaLabel) {
        this.violations.push({
          type: 'error',
          rule: 'WCAG 1.1.1',
          description: `Imagem sem texto alternativo: ${img.src || 'img[' + index + ']'}`,
          element: img.outerHTML.substring(0, 100) + '...',
          severity: 'critical'
        });
      }
      
      // Alt text muito longo
      if (alt && alt.length > 125) {
        this.violations.push({
          type: 'warning',
          rule: 'WCAG 1.1.1',
          description: `Alt text muito longo (${alt.length} caracteres): ${alt.substring(0, 50)}...`,
          element: img.outerHTML.substring(0, 100) + '...',
          severity: 'moderate'
        });
      }
      
      // Alt text redundante
      if (alt && (alt.toLowerCase().includes('imagem') || alt.toLowerCase().includes('foto'))) {
        this.violations.push({
          type: 'warning',
          rule: 'WCAG 1.1.1',
          description: `Alt text redundante: "${alt}"`,
          element: img.outerHTML.substring(0, 100) + '...',
          severity: 'minor'
        });
      }
    });
  }
  
  /**
   * Teste 2: Botões devem ser acessíveis por teclado
   */
  private testButtons(document: Document): void {
    const buttons = document.querySelectorAll('button, [role="button"]');
    
    buttons.forEach((button, index) => {
      const tabIndex = button.getAttribute('tabindex');
      const ariaLabel = button.getAttribute('aria-label');
      const textContent = button.textContent?.trim();
      
      // Botões devem ser focáveis (tabindex >= 0 ou sem tabindex)
      if (tabIndex && parseInt(tabIndex) < 0 && !button.hasAttribute('disabled')) {
        this.violations.push({
          type: 'error',
          rule: 'WCAG 2.1.1',
          description: `Botão não focável por teclado: button[${index}]`,
          element: button.outerHTML.substring(0, 100) + '...',
          severity: 'critical'
        });
      }
      
      // Botões devem ter texto acessível
      if (!textContent && !ariaLabel) {
        this.violations.push({
          type: 'error',
          rule: 'WCAG 4.1.2',
          description: `Botão sem texto acessível: button[${index}]`,
          element: button.outerHTML.substring(0, 100) + '...',
          severity: 'critical'
        });
      }
      
      // Verificar área de toque mínima (44x44px)
      const rect = (button as HTMLElement).getBoundingClientRect?.();
      if (rect && (rect.width < 44 || rect.height < 44)) {
        this.violations.push({
          type: 'warning',
          rule: 'WCAG 2.5.5',
          description: `Área de toque pequena: ${rect.width}x${rect.height}px`,
          element: button.outerHTML.substring(0, 100) + '...',
          severity: 'moderate'
        });
      }
    });
  }
  
  /**
   * Teste 3: Links devem ser acessíveis
   */
  private testLinks(document: Document): void {
    const links = document.querySelectorAll('a');
    
    links.forEach((link, index) => {
      const href = link.getAttribute('href');
      const textContent = link.textContent?.trim();
      const ariaLabel = link.getAttribute('aria-label');
      const title = link.getAttribute('title');
      
      // Links devem ter href ou role="button"
      if (!href && link.getAttribute('role') !== 'button') {
        this.violations.push({
          type: 'error',
          rule: 'WCAG 2.1.1',
          description: `Link sem href: a[${index}]`,
          element: link.outerHTML.substring(0, 100) + '...',
          severity: 'serious'
        });
      }
      
      // Links devem ter texto acessível
      if (!textContent && !ariaLabel && !title) {
        this.violations.push({
          type: 'error',
          rule: 'WCAG 2.4.4',
          description: `Link sem texto acessível: a[${index}]`,
          element: link.outerHTML.substring(0, 100) + '...',
          severity: 'critical'
        });
      }
      
      // Links externos devem ter indicação
      if (href && (href.startsWith('http') && !href.includes(window.location.hostname))) {
        const hasIndicator = textContent?.includes('(abre em nova aba)') || 
                            ariaLabel?.includes('abre em nova aba') ||
                            link.getAttribute('target') !== '_blank';
        
        if (!hasIndicator && link.getAttribute('target') === '_blank') {
          this.violations.push({
            type: 'warning',
            rule: 'WCAG 3.2.5',
            description: `Link externo sem indicação: ${href}`,
            element: link.outerHTML.substring(0, 100) + '...',
            severity: 'moderate'
          });
        }
      }
    });
  }
  
  /**
   * Teste 4: Formulários devem ser acessíveis
   */
  private testForms(document: Document): void {
    const inputs = document.querySelectorAll('input, textarea, select');
    
    inputs.forEach((input, index) => {
      const id = input.getAttribute('id');
      const ariaLabel = input.getAttribute('aria-label');
      const ariaLabelledby = input.getAttribute('aria-labelledby');
      const placeholder = input.getAttribute('placeholder');
      
      // Inputs devem ter label associado
      const hasLabel = id && document.querySelector(`label[for="${id}"]`);
      
      if (!hasLabel && !ariaLabel && !ariaLabelledby) {
        this.violations.push({
          type: 'error',
          rule: 'WCAG 3.3.2',
          description: `Input sem label: ${input.tagName.toLowerCase()}[${index}]`,
          element: input.outerHTML.substring(0, 100) + '...',
          severity: 'critical'
        });
      }
      
      // Placeholder não deve ser a única indicação
      if (placeholder && !hasLabel && !ariaLabel && !ariaLabelledby) {
        this.violations.push({
          type: 'warning',
          rule: 'WCAG 3.3.2',
          description: `Apenas placeholder como label: "${placeholder}"`,
          element: input.outerHTML.substring(0, 100) + '...',
          severity: 'serious'
        });
      }
      
      // Inputs obrigatórios devem ter indicação
      if (input.hasAttribute('required')) {
        const hasRequiredIndicator = hasLabel && document.querySelector(`label[for="${id}"]`)?.textContent?.includes('*') ||
                                    ariaLabel?.includes('obrigatório') ||
                                    input.getAttribute('aria-required') === 'true';
        
        if (!hasRequiredIndicator) {
          this.violations.push({
            type: 'warning',
            rule: 'WCAG 3.3.2',
            description: `Campo obrigatório sem indicação: ${input.tagName.toLowerCase()}[${index}]`,
            element: input.outerHTML.substring(0, 100) + '...',
            severity: 'moderate'
          });
        }
      }
    });
  }
  
  /**
   * Teste 5: Hierarquia de headings
   */
  private testHeadings(document: Document): void {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let previousLevel = 0;
    
    // Deve haver pelo menos um h1
    const h1Count = document.querySelectorAll('h1').length;
    if (h1Count === 0) {
      this.violations.push({
        type: 'error',
        rule: 'WCAG 1.3.1',
        description: 'Página sem heading h1',
        severity: 'serious'
      });
    } else if (h1Count > 1) {
      this.violations.push({
        type: 'warning',
        rule: 'WCAG 1.3.1',
        description: `Múltiplos h1 encontrados: ${h1Count}`,
        severity: 'moderate'
      });
    }
    
    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.charAt(1));
      const textContent = heading.textContent?.trim();
      
      // Headings não devem estar vazios
      if (!textContent) {
        this.violations.push({
          type: 'error',
          rule: 'WCAG 1.3.1',
          description: `Heading vazio: ${heading.tagName.toLowerCase()}[${index}]`,
          element: heading.outerHTML.substring(0, 100) + '...',
          severity: 'serious'
        });
      }
      
      // Verificar hierarquia (não pular níveis)
      if (previousLevel > 0 && level > previousLevel + 1) {
        this.violations.push({
          type: 'warning',
          rule: 'WCAG 1.3.1',
          description: `Hierarquia de heading quebrada: h${previousLevel} → h${level}`,
          element: heading.outerHTML.substring(0, 100) + '...',
          severity: 'moderate'
        });
      }
      
      previousLevel = level;
    });
  }
  
  /**
   * Teste 6: Contraste de cores
   */
  private testColors(document: Document): void {
    const elements = document.querySelectorAll('*');
    
    elements.forEach((element, index) => {
      const styles = window.getComputedStyle?.(element as Element);
      if (!styles) return;
      
      const color = styles.color;
      const backgroundColor = styles.backgroundColor;
      const fontSize = parseFloat(styles.fontSize);
      
      // Simular teste de contraste (implementação básica)
      if (color && backgroundColor && color !== backgroundColor) {
        const isLargeText = fontSize >= 18 || (fontSize >= 14 && styles.fontWeight === 'bold');
        const requiredRatio = isLargeText ? 3 : 4.5;
        
        // Esta é uma implementação simplificada
        // Em produção, usaria uma biblioteca de cálculo de contraste real
        if (color === 'rgb(255, 255, 255)' && backgroundColor === 'rgb(255, 255, 255)') {
          this.violations.push({
            type: 'error',
            rule: 'WCAG 1.4.3',
            description: `Contraste insuficiente: texto branco em fundo branco`,
            element: element.tagName.toLowerCase() + '[' + index + ']',
            severity: 'critical'
          });
        }
      }
    });
  }
  
  /**
   * Teste 7: Navegação por teclado
   */
  private testKeyboardNavigation(document: Document): void {
    const focusableElements = document.querySelectorAll(
      'a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])'
    );
    
    focusableElements.forEach((element, index) => {
      const tabIndex = element.getAttribute('tabindex');
      
      // Evitar tabindex positivos
      if (tabIndex && parseInt(tabIndex) > 0) {
        this.violations.push({
          type: 'warning',
          rule: 'WCAG 2.4.3',
          description: `Evitar tabindex positivo: tabindex="${tabIndex}"`,
          element: element.tagName.toLowerCase() + '[' + index + ']',
          severity: 'moderate'
        });
      }
    });
  }
  
  /**
   * Teste 8: Landmarks e estrutura
   */
  private testLandmarks(document: Document): void {
    const mainElements = document.querySelectorAll('main, [role="main"]');
    
    if (mainElements.length === 0) {
      this.violations.push({
        type: 'warning',
        rule: 'WCAG 1.3.1',
        description: 'Página sem landmark main',
        severity: 'moderate'
      });
    } else if (mainElements.length > 1) {
      this.violations.push({
        type: 'warning',
        rule: 'WCAG 1.3.1',
        description: `Múltiplos landmarks main: ${mainElements.length}`,
        severity: 'moderate'
      });
    }
  }
  
  /**
   * Teste 9: Aria labels e roles
   */
  private testAriaLabels(document: Document): void {
    const elementsWithRole = document.querySelectorAll('[role]');
    
    elementsWithRole.forEach((element, index) => {
      const role = element.getAttribute('role');
      const ariaLabel = element.getAttribute('aria-label');
      const ariaLabelledby = element.getAttribute('aria-labelledby');
      const textContent = element.textContent?.trim();
      
      // Elementos com role específicos precisam de labels
      const needsLabel = ['button', 'link', 'menuitem', 'tab', 'option'];
      
      if (role && needsLabel.includes(role) && !ariaLabel && !ariaLabelledby && !textContent) {
        this.violations.push({
          type: 'error',
          rule: 'WCAG 4.1.2',
          description: `Elemento com role="${role}" sem label acessível`,
          element: element.tagName.toLowerCase() + '[' + index + ']',
          severity: 'serious'
        });
      }
    });
  }
}

// Função utilitária para executar testes
export async function runAccessibilityValidation(): Promise<AccessibilityTestResult> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return {
      passed: false,
      violations: [{
        type: 'error',
        rule: 'ENV',
        description: 'Testes de acessibilidade só podem ser executados no browser',
        severity: 'critical'
      }],
      score: 0,
      testedElements: 0
    };
  }
  
  const validator = new AccessibilityValidator();
  return await validator.runAccessibilityTests(document);
}

// Executar testes automaticamente em desenvolvimento
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Aguardar carregamento da página
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
      const result = await runAccessibilityValidation();
      console.group('🔍 Validação de Acessibilidade');
      console.log(`Score: ${result.score}/100`);
      console.log(`Elementos testados: ${result.testedElements}`);
      console.log(`Status: ${result.passed ? '✅ Aprovado' : '❌ Reprovado'}`);
      
      if (result.violations.length > 0) {
        console.group(`⚠️ ${result.violations.length} violações encontradas:`);
        result.violations.forEach(violation => {
          const emoji = violation.severity === 'critical' ? '🚨' : 
                       violation.severity === 'serious' ? '⚠️' : 
                       violation.severity === 'moderate' ? '🟡' : '💡';
          console.warn(`${emoji} [${violation.rule}] ${violation.description}`);
          if (violation.element) {
            console.log(`   Elemento: ${violation.element}`);
          }
        });
        console.groupEnd();
      }
      console.groupEnd();
    });
  }
}