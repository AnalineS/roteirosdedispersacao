/**
 * Fluid Typography System Auditor
 * Audits and optimizes responsive typography according to accessibility and UX best practices
 * 
 * Features:
 * - Scans CSS for fluid typography implementation
 * - Validates clamp() usage and value ranges
 * - Checks accessibility compliance (WCAG 2.1 AA)
 * - Provides optimization recommendations
 * - Generates typography scale analysis
 */

export interface FluidTypographyViolation {
  type: 'missing-fluid' | 'invalid-clamp' | 'accessibility' | 'performance' | 'consistency';
  severity: 'error' | 'warning' | 'info';
  element: string;
  message: string;
  recommendation: string;
  currentValue?: string;
  suggestedValue?: string;
}

export interface TypographyScale {
  name: string;
  minSize: number;
  maxSize: number;
  minViewport: number;
  maxViewport: number;
  scaleFactor: number;
  isAccessible: boolean;
}

export interface FluidTypographyReport {
  totalElements: number;
  fluidElements: number;
  violations: FluidTypographyViolation[];
  typographyScale: TypographyScale[];
  accessibilityScore: number;
  performanceScore: number;
  recommendations: string[];
  summary: {
    passed: number;
    warnings: number;
    errors: number;
  };
}

export class FluidTypographyAuditor {
  private violations: FluidTypographyViolation[] = [];
  private typographyScale: TypographyScale[] = [];
  private baseViewports = { min: 320, max: 1200 };
  private baseFontSize = 16;

  public audit(container: Document | Element = document): FluidTypographyReport {
    this.violations = [];
    this.typographyScale = [];
    
    // Audit CSS rules
    this.auditCSSRules();
    
    // Audit computed styles on elements
    this.auditComputedStyles(container);
    
    // Analyze typography scale
    this.analyzeTypographyScale();
    
    // Check for consistency
    this.checkConsistency();
    
    return this.generateReport();
  }

  private auditCSSRules(): void {
    const stylesheets = Array.from(document.styleSheets);
    
    for (const stylesheet of stylesheets) {
      try {
        if (stylesheet.href && !this.isInternalStylesheet(stylesheet.href)) {
          continue; // Skip external stylesheets
        }
        
        const rules = Array.from(stylesheet.cssRules || []);
        this.processRules(rules);
      } catch (error) {
        // Skip stylesheets that can't be accessed (CORS)
        continue;
      }
    }
  }

  private isInternalStylesheet(href: string): boolean {
    return href.includes(window.location.origin) || 
           href.startsWith('/') || 
           href.startsWith('./');
  }

  private processRules(rules: CSSRule[]): void {
    for (const rule of rules) {
      if (rule instanceof CSSStyleRule) {
        this.auditStyleRule(rule);
      } else if (rule instanceof CSSMediaRule) {
        this.processRules(Array.from(rule.cssRules));
      }
    }
  }

  private auditStyleRule(rule: CSSStyleRule): void {
    const fontSize = rule.style.fontSize;
    
    if (fontSize) {
      if (this.isFluidValue(fontSize)) {
        this.validateFluidValue(rule.selectorText, fontSize, 'font-size');
      } else if (this.shouldBeFluid(rule.selectorText)) {
        this.violations.push({
          type: 'missing-fluid',
          severity: 'warning',
          element: rule.selectorText,
          message: 'Typography should use fluid scaling for better responsive design',
          recommendation: 'Consider using clamp() for fluid typography',
          currentValue: fontSize,
          suggestedValue: this.suggestFluidValue(fontSize)
        });
      }
    }

    // Check other typography properties
    const properties = ['line-height', 'letter-spacing', 'margin', 'padding'];
    for (const prop of properties) {
      const value = rule.style.getPropertyValue(prop);
      if (value && this.isFluidValue(value)) {
        this.validateFluidValue(rule.selectorText, value, prop);
      }
    }
  }

  private auditComputedStyles(container: Document | Element): void {
    const textElements = container.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div, a, button, label, input, textarea');
    
    for (const element of textElements) {
      const computedStyle = window.getComputedStyle(element);
      const fontSize = computedStyle.fontSize;
      
      if (fontSize) {
        this.checkAccessibility(element, computedStyle);
        this.checkPerformance(element, computedStyle);
      }
    }
  }

  private isFluidValue(value: string): boolean {
    return value.includes('clamp(') || 
           value.includes('min(') || 
           value.includes('max(') || 
           value.includes('calc(') && (value.includes('vw') || value.includes('vh'));
  }

  private shouldBeFluid(selector: string): boolean {
    const headingSelectors = /^(h[1-6]|\.h[1-6]|\.text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl))/i;
    return headingSelectors.test(selector.replace(/[^a-zA-Z0-9\-\.#]/g, ''));
  }

  private validateFluidValue(selector: string, value: string, property: string): void {
    if (value.includes('clamp(')) {
      const clampMatch = value.match(/clamp\s*\(\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^)]+)\s*\)/);
      
      if (!clampMatch) {
        this.violations.push({
          type: 'invalid-clamp',
          severity: 'error',
          element: selector,
          message: 'Invalid clamp() syntax',
          recommendation: 'Use proper clamp(min, preferred, max) syntax',
          currentValue: value
        });
        return;
      }

      const [, min, preferred, max] = clampMatch;
      this.validateClampValues(selector, min.trim(), preferred.trim(), max.trim(), property);
    }
  }

  private validateClampValues(selector: string, min: string, preferred: string, max: string, property: string): void {
    const minPx = this.convertToPx(min);
    const maxPx = this.convertToPx(max);
    
    if (minPx !== null && maxPx !== null) {
      // Check if min is actually smaller than max
      if (minPx >= maxPx) {
        this.violations.push({
          type: 'invalid-clamp',
          severity: 'error',
          element: selector,
          message: 'Minimum value is greater than or equal to maximum value',
          recommendation: 'Ensure min < max in clamp() values',
          currentValue: `clamp(${min}, ${preferred}, ${max})`
        });
      }

      // Check accessibility for font-size
      if (property === 'font-size') {
        if (minPx < 12) {
          this.violations.push({
            type: 'accessibility',
            severity: 'warning',
            element: selector,
            message: 'Minimum font size is too small for accessibility',
            recommendation: 'Use minimum 12px for body text, 14px recommended',
            currentValue: min
          });
        }

        if (maxPx > 72) {
          this.violations.push({
            type: 'performance',
            severity: 'info',
            element: selector,
            message: 'Very large maximum font size may impact performance',
            recommendation: 'Consider if such large sizes are necessary',
            currentValue: max
          });
        }
      }

      // Add to typography scale
      this.typographyScale.push({
        name: selector,
        minSize: minPx,
        maxSize: maxPx,
        minViewport: this.baseViewports.min,
        maxViewport: this.baseViewports.max,
        scaleFactor: maxPx / minPx,
        isAccessible: minPx >= 12
      });
    }

    // Check for viewport units in preferred value
    if (!preferred.includes('vw') && !preferred.includes('vh') && !preferred.includes('%')) {
      this.violations.push({
        type: 'invalid-clamp',
        severity: 'warning',
        element: selector,
        message: 'Preferred value should include viewport units for fluid behavior',
        recommendation: 'Use vw, vh, or % in the preferred value for responsive scaling',
        currentValue: preferred
      });
    }
  }

  private convertToPx(value: string): number | null {
    const numMatch = value.match(/^([0-9]*\.?[0-9]+)(px|rem|em)$/);
    if (!numMatch) return null;

    const [, num, unit] = numMatch;
    const numValue = parseFloat(num);

    switch (unit) {
      case 'px':
        return numValue;
      case 'rem':
        return numValue * this.baseFontSize;
      case 'em':
        return numValue * this.baseFontSize; // Simplified, assumes body font-size
      default:
        return null;
    }
  }

  private suggestFluidValue(staticValue: string): string {
    const pxValue = this.convertToPx(staticValue);
    if (pxValue === null) return staticValue;

    const minScale = 0.8;
    const maxScale = 1.2;
    const minSize = Math.max(12, pxValue * minScale);
    const maxSize = pxValue * maxScale;
    const preferredVw = (pxValue / this.baseViewports.max * 100).toFixed(2);

    return `clamp(${minSize}px, ${preferredVw}vw, ${maxSize}px)`;
  }

  private checkAccessibility(element: Element, style: CSSStyleDeclaration): void {
    const fontSize = parseFloat(style.fontSize);
    const lineHeight = parseFloat(style.lineHeight) || fontSize * 1.2;
    
    // Check minimum font size
    if (fontSize < 12) {
      this.violations.push({
        type: 'accessibility',
        severity: 'error',
        element: this.getElementSelector(element),
        message: 'Font size below accessibility minimum (12px)',
        recommendation: 'Increase font size to at least 12px, 14px recommended for body text'
      });
    }

    // Check line height
    const lineHeightRatio = lineHeight / fontSize;
    if (lineHeightRatio < 1.2) {
      this.violations.push({
        type: 'accessibility',
        severity: 'warning',
        element: this.getElementSelector(element),
        message: 'Line height too tight for accessibility',
        recommendation: 'Use line-height of at least 1.2, 1.5 recommended for body text'
      });
    }
  }

  private checkPerformance(element: Element, style: CSSStyleDeclaration): void {
    const fontSize = parseFloat(style.fontSize);
    
    // Check for extremely large font sizes
    if (fontSize > 100) {
      this.violations.push({
        type: 'performance',
        severity: 'warning',
        element: this.getElementSelector(element),
        message: 'Very large font size may impact rendering performance',
        recommendation: 'Consider if such large font sizes are necessary'
      });
    }
  }

  private analyzeTypographyScale(): void {
    // Check for consistent scale ratios
    const scaleFactors = this.typographyScale.map(item => item.scaleFactor);
    const uniqueFactors = [...new Set(scaleFactors.map(f => Math.round(f * 100) / 100))];
    
    if (uniqueFactors.length > 5) {
      this.violations.push({
        type: 'consistency',
        severity: 'info',
        element: 'Typography Scale',
        message: 'Many different scale factors detected',
        recommendation: 'Consider using consistent scale ratios (e.g., 1.125, 1.25, 1.5) for better visual hierarchy'
      });
    }
  }

  private checkConsistency(): void {
    // Check for consistent viewport ranges
    const viewportRanges = this.typographyScale.map(item => 
      `${item.minViewport}-${item.maxViewport}`
    );
    const uniqueRanges = [...new Set(viewportRanges)];
    
    if (uniqueRanges.length > 3) {
      this.violations.push({
        type: 'consistency',
        severity: 'warning',
        element: 'Viewport Ranges',
        message: 'Multiple viewport ranges detected',
        recommendation: 'Use consistent viewport ranges across typography scale for better consistency'
      });
    }
  }

  private getElementSelector(element: Element): string {
    if (element.id) return `#${element.id}`;
    if (element.className) return `.${element.className.split(' ')[0]}`;
    return element.tagName.toLowerCase();
  }

  private generateReport(): FluidTypographyReport {
    const errors = this.violations.filter(v => v.severity === 'error').length;
    const warnings = this.violations.filter(v => v.severity === 'warning').length;
    const infos = this.violations.filter(v => v.severity === 'info').length;

    const accessibilityViolations = this.violations.filter(v => v.type === 'accessibility').length;
    const accessibilityScore = Math.max(0, 100 - (accessibilityViolations * 10));

    const performanceViolations = this.violations.filter(v => v.type === 'performance').length;
    const performanceScore = Math.max(0, 100 - (performanceViolations * 5));

    const recommendations = this.generateRecommendations();

    return {
      totalElements: document.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span').length,
      fluidElements: this.typographyScale.length,
      violations: this.violations,
      typographyScale: this.typographyScale,
      accessibilityScore,
      performanceScore,
      recommendations,
      summary: {
        passed: Math.max(0, this.typographyScale.length - errors - warnings),
        warnings,
        errors
      }
    };
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.typographyScale.length === 0) {
      recommendations.push('Implement fluid typography using clamp() for responsive design');
    }

    const accessibilityIssues = this.violations.filter(v => v.type === 'accessibility').length;
    if (accessibilityIssues > 0) {
      recommendations.push('Address accessibility violations for WCAG 2.1 AA compliance');
    }

    const consistencyIssues = this.violations.filter(v => v.type === 'consistency').length;
    if (consistencyIssues > 0) {
      recommendations.push('Establish consistent typography scale with modular scale ratios');
    }

    const invalidClamp = this.violations.filter(v => v.type === 'invalid-clamp').length;
    if (invalidClamp > 0) {
      recommendations.push('Fix invalid clamp() syntax and value ranges');
    }

    if (recommendations.length === 0) {
      recommendations.push('Typography system looks good! Consider periodic audits for consistency');
    }

    return recommendations;
  }

  // Static helper methods
  public static generateFluidScale(baseFontSize: number = 16, ratio: number = 1.25): Record<string, string> {
    const scale: Record<string, string> = {};
    const sizes = ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl'];
    const multipliers = [0.75, 0.875, 1, 1.125, 1.25, 1.5, 1.875, 2.25, 3, 4];

    for (let i = 0; i < sizes.length; i++) {
      const minSize = baseFontSize * multipliers[i] * 0.8;
      const maxSize = baseFontSize * multipliers[i] * 1.2;
      const preferredVw = ((baseFontSize * multipliers[i]) / 1200 * 100).toFixed(2);
      
      scale[sizes[i]] = `clamp(${minSize}px, ${preferredVw}vw, ${maxSize}px)`;
    }

    return scale;
  }

  public static getOptimalLineHeight(fontSize: number): number {
    // Optimal line height based on font size
    if (fontSize <= 14) return 1.6;
    if (fontSize <= 18) return 1.5;
    if (fontSize <= 24) return 1.4;
    if (fontSize <= 36) return 1.3;
    return 1.2;
  }

  public static validateAccessibility(fontSize: number, lineHeight: number): boolean {
    return fontSize >= 12 && (lineHeight / fontSize) >= 1.2;
  }
}

// Export function for easy usage
export function auditFluidTypography(container?: Document | Element): FluidTypographyReport {
  const auditor = new FluidTypographyAuditor();
  return auditor.audit(container);
}

// Export utility functions
export { FluidTypographyAuditor as default };