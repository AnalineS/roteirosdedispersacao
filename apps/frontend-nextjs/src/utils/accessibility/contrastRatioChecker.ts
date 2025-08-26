/**
 * Contrast Ratio Verification Tool
 * Ensures WCAG 2.1 AA/AAA compliance for color combinations
 */

export interface ColorCombination {
  foreground: string;
  background: string;
  context: string;
  element: string;
  location?: string;
}

export interface ContrastResult {
  combination: ColorCombination;
  contrastRatio: number;
  wcagLevel: 'AAA' | 'AA' | 'A' | 'Fail';
  isTextLarge: boolean;
  passes: {
    normalAA: boolean;
    normalAAA: boolean;
    largeAA: boolean;
    largeAAA: boolean;
  };
  recommendation?: string;
}

export interface ContrastAuditReport {
  overallScore: number;
  totalCombinations: number;
  passCount: number;
  failCount: number;
  results: ContrastResult[];
  summary: {
    aaaCompliant: number;
    aaCompliant: number;
    aCompliant: number;
    failing: number;
  };
  recommendations: string[];
}

export class ContrastRatioChecker {
  private static readonly WCAG_AA_NORMAL = 4.5;
  private static readonly WCAG_AAA_NORMAL = 7.0;
  private static readonly WCAG_AA_LARGE = 3.0;
  private static readonly WCAG_AAA_LARGE = 4.5;
  private static readonly LARGE_TEXT_SIZE = 18; // 18px or 14pt bold

  /**
   * Convert hex color to RGB values
   */
  private static hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Handle 3-digit hex
    if (hex.length === 3) {
      hex = hex.split('').map(char => char + char).join('');
    }
    
    if (hex.length !== 6) return null;
    
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    return { r, g, b };
  }

  /**
   * Convert RGB string to RGB values
   */
  private static rgbStringToRgb(rgbString: string): { r: number; g: number; b: number } | null {
    const match = rgbString.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (!match) return null;
    
    return {
      r: parseInt(match[1], 10),
      g: parseInt(match[2], 10),
      b: parseInt(match[3], 10)
    };
  }

  /**
   * Convert RGBA string to RGB values
   */
  private static rgbaStringToRgb(rgbaString: string): { r: number; g: number; b: number } | null {
    const match = rgbaString.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([0-9.]+)\)/);
    if (!match) return null;
    
    return {
      r: parseInt(match[1], 10),
      g: parseInt(match[2], 10),
      b: parseInt(match[3], 10)
    };
  }

  /**
   * Parse color string to RGB
   */
  private static parseColor(color: string): { r: number; g: number; b: number } | null {
    // Normalize color string
    color = color.trim().toLowerCase();
    
    // Handle hex colors
    if (color.startsWith('#')) {
      return this.hexToRgb(color);
    }
    
    // Handle rgb() colors
    if (color.startsWith('rgb(')) {
      return this.rgbStringToRgb(color);
    }
    
    // Handle rgba() colors
    if (color.startsWith('rgba(')) {
      return this.rgbaStringToRgb(color);
    }
    
    // Handle named colors (basic set)
    const namedColors: Record<string, string> = {
      'white': '#ffffff',
      'black': '#000000',
      'red': '#ff0000',
      'green': '#008000',
      'blue': '#0000ff',
      'yellow': '#ffff00',
      'cyan': '#00ffff',
      'magenta': '#ff00ff',
      'silver': '#c0c0c0',
      'gray': '#808080',
      'grey': '#808080',
      'maroon': '#800000',
      'olive': '#808000',
      'lime': '#00ff00',
      'aqua': '#00ffff',
      'teal': '#008080',
      'navy': '#000080',
      'fuchsia': '#ff00ff',
      'purple': '#800080'
    };
    
    if (namedColors[color]) {
      return this.hexToRgb(namedColors[color]);
    }
    
    return null;
  }

  /**
   * Calculate relative luminance
   */
  private static getRelativeLuminance(r: number, g: number, b: number): number {
    // Convert to sRGB
    const rsRGB = r / 255;
    const gsRGB = g / 255;
    const bsRGB = b / 255;

    // Apply gamma correction
    const rLinear = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
    const gLinear = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
    const bLinear = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

    // Calculate relative luminance
    return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
  }

  /**
   * Calculate contrast ratio between two colors
   */
  public static calculateContrastRatio(foreground: string, background: string): number {
    const fgRgb = this.parseColor(foreground);
    const bgRgb = this.parseColor(background);

    if (!fgRgb || !bgRgb) {
      console.warn('Invalid color format:', { foreground, background });
      return 0;
    }

    const fgLuminance = this.getRelativeLuminance(fgRgb.r, fgRgb.g, fgRgb.b);
    const bgLuminance = this.getRelativeLuminance(bgRgb.r, bgRgb.g, bgRgb.b);

    const lightest = Math.max(fgLuminance, bgLuminance);
    const darkest = Math.min(fgLuminance, bgLuminance);

    return (lightest + 0.05) / (darkest + 0.05);
  }

  /**
   * Determine if text is large based on font size and weight
   */
  private static isLargeText(element: HTMLElement): boolean {
    const computedStyle = window.getComputedStyle(element);
    const fontSize = parseInt(computedStyle.fontSize, 10);
    const fontWeight = computedStyle.fontWeight;

    // Large text is 18pt (24px) or larger, or 14pt (18.66px) bold or larger
    return fontSize >= 24 || (fontSize >= 19 && (fontWeight === 'bold' || parseInt(fontWeight, 10) >= 700));
  }

  /**
   * Get computed color from element
   */
  private static getComputedColor(element: HTMLElement, property: 'color' | 'background-color'): string {
    const computedStyle = window.getComputedStyle(element);
    let color = computedStyle.getPropertyValue(property);

    // If background-color is transparent, find actual background
    if (property === 'background-color' && (color === 'transparent' || color === 'rgba(0, 0, 0, 0)')) {
      let parent = element.parentElement;
      while (parent) {
        const parentStyle = window.getComputedStyle(parent);
        const parentBg = parentStyle.getPropertyValue('background-color');
        if (parentBg && parentBg !== 'transparent' && parentBg !== 'rgba(0, 0, 0, 0)') {
          color = parentBg;
          break;
        }
        parent = parent.parentElement;
      }
      // If still transparent, assume white background
      if (color === 'transparent' || color === 'rgba(0, 0, 0, 0)') {
        color = 'rgb(255, 255, 255)';
      }
    }

    return color;
  }

  /**
   * Evaluate contrast result
   */
  private static evaluateContrast(ratio: number, isLarge: boolean): ContrastResult['passes'] & { wcagLevel: ContrastResult['wcagLevel'] } {
    const passes = {
      normalAA: ratio >= this.WCAG_AA_NORMAL,
      normalAAA: ratio >= this.WCAG_AAA_NORMAL,
      largeAA: ratio >= this.WCAG_AA_LARGE,
      largeAAA: ratio >= this.WCAG_AAA_LARGE
    };

    let wcagLevel: ContrastResult['wcagLevel'];

    if (isLarge) {
      if (passes.largeAAA) wcagLevel = 'AAA';
      else if (passes.largeAA) wcagLevel = 'AA';
      else wcagLevel = 'Fail';
    } else {
      if (passes.normalAAA) wcagLevel = 'AAA';
      else if (passes.normalAA) wcagLevel = 'AA';
      else wcagLevel = 'Fail';
    }

    return { ...passes, wcagLevel };
  }

  /**
   * Generate recommendation for improving contrast
   */
  private static generateRecommendation(result: ContrastResult): string {
    const { contrastRatio, isTextLarge, passes } = result;
    const requiredRatio = isTextLarge ? this.WCAG_AA_LARGE : this.WCAG_AA_NORMAL;
    const idealRatio = isTextLarge ? this.WCAG_AAA_LARGE : this.WCAG_AAA_NORMAL;

    if (contrastRatio < requiredRatio) {
      const deficit = requiredRatio - contrastRatio;
      return `Increase contrast ratio by ${deficit.toFixed(1)} to meet WCAG AA standards. Consider darkening the text or lightening the background.`;
    } else if (contrastRatio < idealRatio) {
      const improvement = idealRatio - contrastRatio;
      return `Consider increasing contrast by ${improvement.toFixed(1)} to achieve WCAG AAA compliance.`;
    }

    return 'Excellent contrast ratio! This combination provides optimal readability.';
  }

  /**
   * Check contrast for a single element
   */
  public static checkElementContrast(element: HTMLElement): ContrastResult | null {
    // Only check text elements
    const textContent = element.textContent?.trim();
    if (!textContent || element.children.length > 0) return null;

    const foregroundColor = this.getComputedColor(element, 'color');
    const backgroundColor = this.getComputedColor(element, 'background-color');

    const contrastRatio = this.calculateContrastRatio(foregroundColor, backgroundColor);
    if (contrastRatio === 0) return null;

    const isTextLarge = this.isLargeText(element);
    const evaluation = this.evaluateContrast(contrastRatio, isTextLarge);

    const combination: ColorCombination = {
      foreground: foregroundColor,
      background: backgroundColor,
      context: textContent.substring(0, 50) + (textContent.length > 50 ? '...' : ''),
      element: element.tagName.toLowerCase(),
      location: this.getElementSelector(element)
    };

    const result: ContrastResult = {
      combination,
      contrastRatio: Math.round(contrastRatio * 100) / 100,
      wcagLevel: evaluation.wcagLevel,
      isTextLarge,
      passes: {
        normalAA: evaluation.normalAA,
        normalAAA: evaluation.normalAAA,
        largeAA: evaluation.largeAA,
        largeAAA: evaluation.largeAAA
      }
    };

    result.recommendation = this.generateRecommendation(result);

    return result;
  }

  /**
   * Get element selector for identification
   */
  private static getElementSelector(element: HTMLElement): string {
    const tagName = element.tagName.toLowerCase();
    const id = element.id ? `#${element.id}` : '';
    const classes = element.className ? `.${Array.from(element.classList).join('.')}` : '';
    return `${tagName}${id}${classes}`;
  }

  /**
   * Audit contrast ratios for entire page
   */
  public static auditPageContrast(container: Document | Element = document): ContrastAuditReport {
    // Find all text elements
    const textElements = container.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, a, button, label, li, td, th, caption, figcaption, blockquote, cite, code, pre, small, strong, em, mark, del, ins, sub, sup, time, address');
    
    const results: ContrastResult[] = [];

    textElements.forEach(element => {
      const result = this.checkElementContrast(element as HTMLElement);
      if (result) {
        results.push(result);
      }
    });

    // Calculate summary
    const summary = {
      aaaCompliant: results.filter(r => r.wcagLevel === 'AAA').length,
      aaCompliant: results.filter(r => r.wcagLevel === 'AA').length,
      aCompliant: results.filter(r => r.wcagLevel === 'A').length,
      failing: results.filter(r => r.wcagLevel === 'Fail').length
    };

    const passCount = summary.aaaCompliant + summary.aaCompliant;
    const failCount = summary.failing;
    const totalCombinations = results.length;

    // Calculate overall score (0-100)
    const overallScore = totalCombinations > 0 ? Math.round((passCount / totalCombinations) * 100) : 100;

    // Generate recommendations
    const recommendations = this.generateRecommendations(results);

    return {
      overallScore,
      totalCombinations,
      passCount,
      failCount,
      results,
      summary,
      recommendations
    };
  }

  /**
   * Generate actionable recommendations
   */
  private static generateRecommendations(results: ContrastResult[]): string[] {
    const recommendations: string[] = [];
    
    const failingResults = results.filter(r => r.wcagLevel === 'Fail');
    const lowResults = results.filter(r => r.wcagLevel === 'AA' || r.wcagLevel === 'A');

    if (failingResults.length > 0) {
      recommendations.push(`${failingResults.length} color combinations fail WCAG standards. Prioritize fixing these for accessibility compliance.`);
      
      // Common failing patterns
      const commonIssues = this.identifyCommonIssues(failingResults);
      recommendations.push(...commonIssues);
    }

    if (lowResults.length > 0) {
      recommendations.push(`${lowResults.length} combinations meet minimum standards but could be improved for better readability.`);
    }

    // General best practices
    if (results.length > 0) {
      const avgRatio = results.reduce((sum, r) => sum + r.contrastRatio, 0) / results.length;
      if (avgRatio < 7.0) {
        recommendations.push('Consider using higher contrast colors throughout the design for better accessibility.');
      }
    }

    // Specific improvements
    if (failingResults.length === 0 && lowResults.length === 0) {
      recommendations.push('Excellent color accessibility! All text meets or exceeds WCAG AA standards.');
    }

    return recommendations.length > 0 ? recommendations : ['No specific recommendations. Color contrast appears to be well implemented.'];
  }

  /**
   * Identify common contrast issues
   */
  private static identifyCommonIssues(failingResults: ContrastResult[]): string[] {
    const issues: string[] = [];
    
    // Check for common problematic color combinations
    const grayOnWhite = failingResults.filter(r => 
      r.combination.foreground.includes('gray') || 
      r.combination.foreground.includes('128, 128, 128')
    );
    
    if (grayOnWhite.length > 0) {
      issues.push('Light gray text on white backgrounds is commonly problematic. Consider darker gray (#4a4a4a or darker).');
    }

    // Check for link contrast issues
    const linkIssues = failingResults.filter(r => r.combination.element === 'a');
    if (linkIssues.length > 0) {
      issues.push('Links have contrast issues. Ensure link colors have sufficient contrast against their backgrounds.');
    }

    // Check for button contrast issues
    const buttonIssues = failingResults.filter(r => r.combination.element === 'button');
    if (buttonIssues.length > 0) {
      issues.push('Button text contrast needs improvement. Consider darker text or different background colors.');
    }

    return issues;
  }

  /**
   * Suggest better color alternatives
   */
  public static suggestAlternatives(foreground: string, background: string, targetRatio: number = 4.5): string[] {
    const suggestions: string[] = [];
    
    const fgRgb = this.parseColor(foreground);
    const bgRgb = this.parseColor(background);
    
    if (!fgRgb || !bgRgb) return suggestions;

    // Try darkening the foreground
    for (let factor = 0.1; factor <= 0.9; factor += 0.1) {
      const darkerFg = {
        r: Math.round(fgRgb.r * (1 - factor)),
        g: Math.round(fgRgb.g * (1 - factor)),
        b: Math.round(fgRgb.b * (1 - factor))
      };
      
      const darkerColor = `rgb(${darkerFg.r}, ${darkerFg.g}, ${darkerFg.b})`;
      const ratio = this.calculateContrastRatio(darkerColor, background);
      
      if (ratio >= targetRatio) {
        suggestions.push(`Darker foreground: ${darkerColor} (ratio: ${ratio.toFixed(1)})`);
        break;
      }
    }

    // Try lightening the background
    for (let factor = 0.1; factor <= 0.9; factor += 0.1) {
      const lighterBg = {
        r: Math.min(255, Math.round(bgRgb.r + (255 - bgRgb.r) * factor)),
        g: Math.min(255, Math.round(bgRgb.g + (255 - bgRgb.g) * factor)),
        b: Math.min(255, Math.round(bgRgb.b + (255 - bgRgb.b) * factor))
      };
      
      const lighterColor = `rgb(${lighterBg.r}, ${lighterBg.g}, ${lighterBg.b})`;
      const ratio = this.calculateContrastRatio(foreground, lighterColor);
      
      if (ratio >= targetRatio) {
        suggestions.push(`Lighter background: ${lighterColor} (ratio: ${ratio.toFixed(1)})`);
        break;
      }
    }

    return suggestions.slice(0, 2); // Return top 2 suggestions
  }
}

/**
 * Convenience function to check single color combination
 */
export function checkContrast(foreground: string, background: string, isLargeText: boolean = false): ContrastResult {
  const contrastRatio = ContrastRatioChecker.calculateContrastRatio(foreground, background);
  const evaluation = ContrastRatioChecker['evaluateContrast'](contrastRatio, isLargeText);

  const combination: ColorCombination = {
    foreground,
    background,
    context: 'Manual check',
    element: 'custom'
  };

  const result: ContrastResult = {
    combination,
    contrastRatio: Math.round(contrastRatio * 100) / 100,
    wcagLevel: evaluation.wcagLevel,
    isTextLarge: isLargeText,
    passes: {
      normalAA: evaluation.normalAA,
      normalAAA: evaluation.normalAAA,
      largeAA: evaluation.largeAA,
      largeAAA: evaluation.largeAAA
    }
  };

  result.recommendation = ContrastRatioChecker['generateRecommendation'](result);

  return result;
}

/**
 * Quick audit function
 */
export function auditContrast(container?: Document | Element): ContrastAuditReport {
  return ContrastRatioChecker.auditPageContrast(container);
}