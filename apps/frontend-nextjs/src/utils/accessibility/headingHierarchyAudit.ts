/**
 * Heading Hierarchy Accessibility Audit Tool
 * Validates WCAG 2.1 AA compliance for heading structure
 */

export interface HeadingViolation {
  id: string;
  level: number;
  text: string;
  element: string;
  violation: string;
  severity: 'error' | 'warning' | 'info';
  recommendation: string;
  wcagCriterion: string;
  location: {
    line?: number;
    selector: string;
    parent?: string;
  };
}

export interface HeadingAuditResult {
  isValid: boolean;
  violations: HeadingViolation[];
  summary: {
    totalHeadings: number;
    h1Count: number;
    h2Count: number;
    h3Count: number;
    h4Count: number;
    h5Count: number;
    h6Count: number;
    errorCount: number;
    warningCount: number;
    score: number; // 0-100 accessibility score
  };
  recommendations: string[];
}

export class HeadingHierarchyAuditor {
  private violations: HeadingViolation[] = [];
  private headings: HTMLHeadingElement[] = [];

  /**
   * Performs comprehensive heading hierarchy audit
   */
  public audit(container: Document | Element = document): HeadingAuditResult {
    this.violations = [];
    this.headings = [];

    // Collect all heading elements
    this.collectHeadings(container);

    // Run all validation checks
    this.validateSingleH1();
    this.validateLogicalProgression();
    this.validateSkippingLevels();
    this.validateEmptyHeadings();
    this.validateAccessibleText();
    this.validateAriaLabels();
    this.validateHeadingNesting();
    this.validateSectionStructure();

    return this.generateReport();
  }

  /**
   * Collect all heading elements
   */
  private collectHeadings(container: Document | Element): void {
    const headingSelectors = 'h1, h2, h3, h4, h5, h6, [role="heading"]';
    const elements = container.querySelectorAll(headingSelectors);
    
    this.headings = Array.from(elements).map(el => {
      if (el.hasAttribute('role') && el.getAttribute('role') === 'heading') {
        // Handle elements with role="heading"
        const level = parseInt(el.getAttribute('aria-level') || '1', 10);
        return { ...el, tagName: `H${level}` } as HTMLHeadingElement;
      }
      return el as HTMLHeadingElement;
    });
  }

  /**
   * Validate that there's only one H1 per page
   */
  private validateSingleH1(): void {
    const h1Elements = this.headings.filter(h => this.getHeadingLevel(h) === 1);
    
    if (h1Elements.length === 0) {
      this.violations.push({
        id: 'missing-h1',
        level: 1,
        text: '',
        element: 'h1',
        violation: 'Missing H1 heading',
        severity: 'error',
        recommendation: 'Add exactly one H1 heading to define the main topic of the page.',
        wcagCriterion: '1.3.1 Info and Relationships',
        location: {
          selector: 'html',
          parent: 'document'
        }
      });
    } else if (h1Elements.length > 1) {
      h1Elements.slice(1).forEach((h1, index) => {
        this.violations.push({
          id: `multiple-h1-${index}`,
          level: 1,
          text: h1.textContent || '',
          element: h1.tagName.toLowerCase(),
          violation: `Multiple H1 headings found (${h1Elements.length} total)`,
          severity: 'error',
          recommendation: 'Use only one H1 per page. Convert additional H1s to H2 or lower.',
          wcagCriterion: '1.3.1 Info and Relationships',
          location: {
            selector: this.getElementSelector(h1),
            parent: h1.parentElement?.tagName.toLowerCase()
          }
        });
      });
    }
  }

  /**
   * Validate logical progression of heading levels
   */
  private validateLogicalProgression(): void {
    let expectedLevel = 1;
    
    this.headings.forEach((heading, index) => {
      const currentLevel = this.getHeadingLevel(heading);
      const text = heading.textContent?.trim() || '';
      
      // First heading should be H1
      if (index === 0 && currentLevel !== 1) {
        this.violations.push({
          id: `first-heading-not-h1-${index}`,
          level: currentLevel,
          text,
          element: heading.tagName.toLowerCase(),
          violation: 'First heading is not H1',
          severity: 'warning',
          recommendation: 'The first heading should be H1 to establish page hierarchy.',
          wcagCriterion: '1.3.1 Info and Relationships',
          location: {
            selector: this.getElementSelector(heading),
            parent: heading.parentElement?.tagName.toLowerCase()
          }
        });
      }

      // Check for logical progression
      if (currentLevel > expectedLevel + 1) {
        this.violations.push({
          id: `skipped-level-${index}`,
          level: currentLevel,
          text,
          element: heading.tagName.toLowerCase(),
          violation: `Skipped heading level (jumped from H${expectedLevel} to H${currentLevel})`,
          severity: 'error',
          recommendation: `Use H${expectedLevel + 1} instead of H${currentLevel} to maintain logical hierarchy.`,
          wcagCriterion: '1.3.1 Info and Relationships',
          location: {
            selector: this.getElementSelector(heading),
            parent: heading.parentElement?.tagName.toLowerCase()
          }
        });
      }

      expectedLevel = Math.min(currentLevel + 1, 6);
    });
  }

  /**
   * Validate against skipping heading levels
   */
  private validateSkippingLevels(): void {
    for (let i = 1; i < this.headings.length; i++) {
      const prevLevel = this.getHeadingLevel(this.headings[i - 1]);
      const currentLevel = this.getHeadingLevel(this.headings[i]);
      
      if (currentLevel > prevLevel + 1) {
        const heading = this.headings[i];
        this.violations.push({
          id: `level-skip-${i}`,
          level: currentLevel,
          text: heading.textContent?.trim() || '',
          element: heading.tagName.toLowerCase(),
          violation: `Heading level skipped from H${prevLevel} to H${currentLevel}`,
          severity: 'error',
          recommendation: `Use sequential heading levels. Change to H${prevLevel + 1}.`,
          wcagCriterion: '1.3.1 Info and Relationships',
          location: {
            selector: this.getElementSelector(heading),
            parent: heading.parentElement?.tagName.toLowerCase()
          }
        });
      }
    }
  }

  /**
   * Validate against empty headings
   */
  private validateEmptyHeadings(): void {
    this.headings.forEach((heading, index) => {
      const text = heading.textContent?.trim() || '';
      const ariaLabel = heading.getAttribute('aria-label');
      const ariaLabelledBy = heading.getAttribute('aria-labelledby');
      
      if (!text && !ariaLabel && !ariaLabelledBy) {
        this.violations.push({
          id: `empty-heading-${index}`,
          level: this.getHeadingLevel(heading),
          text: '',
          element: heading.tagName.toLowerCase(),
          violation: 'Heading has no accessible text content',
          severity: 'error',
          recommendation: 'Add meaningful text content or aria-label to the heading.',
          wcagCriterion: '2.4.6 Headings and Labels',
          location: {
            selector: this.getElementSelector(heading),
            parent: heading.parentElement?.tagName.toLowerCase()
          }
        });
      }
    });
  }

  /**
   * Validate accessible text quality
   */
  private validateAccessibleText(): void {
    this.headings.forEach((heading, index) => {
      const text = heading.textContent?.trim() || '';
      
      if (text) {
        // Check for vague headings
        const vaguePatterns = /^(click here|read more|more|continue|next|previous|back|here|link)$/i;
        if (vaguePatterns.test(text)) {
          this.violations.push({
            id: `vague-heading-${index}`,
            level: this.getHeadingLevel(heading),
            text,
            element: heading.tagName.toLowerCase(),
            violation: 'Heading text is too vague',
            severity: 'warning',
            recommendation: 'Use descriptive heading text that clearly indicates the section content.',
            wcagCriterion: '2.4.6 Headings and Labels',
            location: {
              selector: this.getElementSelector(heading),
              parent: heading.parentElement?.tagName.toLowerCase()
            }
          });
        }

        // Check for very long headings
        if (text.length > 120) {
          this.violations.push({
            id: `long-heading-${index}`,
            level: this.getHeadingLevel(heading),
            text: text.substring(0, 50) + '...',
            element: heading.tagName.toLowerCase(),
            violation: 'Heading text is too long',
            severity: 'warning',
            recommendation: 'Keep headings concise (under 120 characters). Consider using subheadings.',
            wcagCriterion: '2.4.6 Headings and Labels',
            location: {
              selector: this.getElementSelector(heading),
              parent: heading.parentElement?.tagName.toLowerCase()
            }
          });
        }

        // Check for ALL CAPS headings
        if (text === text.toUpperCase() && text.length > 3) {
          this.violations.push({
            id: `caps-heading-${index}`,
            level: this.getHeadingLevel(heading),
            text,
            element: heading.tagName.toLowerCase(),
            violation: 'Heading text is in all capitals',
            severity: 'info',
            recommendation: 'Use normal case for better readability. Screen readers may read all caps as acronyms.',
            wcagCriterion: '3.1.5 Reading Level',
            location: {
              selector: this.getElementSelector(heading),
              parent: heading.parentElement?.tagName.toLowerCase()
            }
          });
        }
      }
    });
  }

  /**
   * Validate ARIA labels and relationships
   */
  private validateAriaLabels(): void {
    this.headings.forEach((heading, index) => {
      const ariaLabelledBy = heading.getAttribute('aria-labelledby');
      
      if (ariaLabelledBy) {
        const referencedElements = ariaLabelledBy.split(' ').map(id => 
          document.getElementById(id)
        );
        
        if (referencedElements.some(el => !el)) {
          this.violations.push({
            id: `invalid-labelledby-${index}`,
            level: this.getHeadingLevel(heading),
            text: heading.textContent?.trim() || '',
            element: heading.tagName.toLowerCase(),
            violation: 'aria-labelledby references non-existent elements',
            severity: 'error',
            recommendation: 'Ensure all IDs in aria-labelledby exist and are accessible.',
            wcagCriterion: '4.1.2 Name, Role, Value',
            location: {
              selector: this.getElementSelector(heading),
              parent: heading.parentElement?.tagName.toLowerCase()
            }
          });
        }
      }
    });
  }

  /**
   * Validate heading nesting within landmark regions
   */
  private validateHeadingNesting(): void {
    this.headings.forEach((heading, index) => {
      const landmarkParent = this.findLandmarkParent(heading);
      
      if (!landmarkParent) {
        this.violations.push({
          id: `heading-outside-landmark-${index}`,
          level: this.getHeadingLevel(heading),
          text: heading.textContent?.trim() || '',
          element: heading.tagName.toLowerCase(),
          violation: 'Heading is not inside a landmark region',
          severity: 'warning',
          recommendation: 'Place headings within landmark regions (main, section, article, etc.) for better navigation.',
          wcagCriterion: '1.3.6 Identify Purpose',
          location: {
            selector: this.getElementSelector(heading),
            parent: heading.parentElement?.tagName.toLowerCase()
          }
        });
      }
    });
  }

  /**
   * Validate section structure
   */
  private validateSectionStructure(): void {
    const sections = document.querySelectorAll('section, article, aside, nav');
    
    sections.forEach((section, index) => {
      const headings = section.querySelectorAll('h1, h2, h3, h4, h5, h6, [role="heading"]');
      
      if (headings.length === 0) {
        this.violations.push({
          id: `section-without-heading-${index}`,
          level: 0,
          text: '',
          element: section.tagName.toLowerCase(),
          violation: 'Section has no heading',
          severity: 'warning',
          recommendation: 'Add a heading to clearly identify the section content.',
          wcagCriterion: '2.4.1 Bypass Blocks',
          location: {
            selector: this.getElementSelector(section as HTMLElement),
            parent: section.parentElement?.tagName.toLowerCase()
          }
        });
      }
    });
  }

  /**
   * Generate comprehensive audit report
   */
  private generateReport(): HeadingAuditResult {
    const summary = this.generateSummary();
    const score = this.calculateAccessibilityScore();
    const recommendations = this.generateRecommendations();

    return {
      isValid: this.violations.filter(v => v.severity === 'error').length === 0,
      violations: this.violations,
      summary: {
        ...summary,
        score
      },
      recommendations
    };
  }

  /**
   * Generate summary statistics
   */
  private generateSummary() {
    const counts = { h1: 0, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0 };
    
    this.headings.forEach(heading => {
      const level = this.getHeadingLevel(heading);
      counts[`h${level}` as keyof typeof counts]++;
    });

    const errorCount = this.violations.filter(v => v.severity === 'error').length;
    const warningCount = this.violations.filter(v => v.severity === 'warning').length;

    return {
      totalHeadings: this.headings.length,
      h1Count: counts.h1,
      h2Count: counts.h2,
      h3Count: counts.h3,
      h4Count: counts.h4,
      h5Count: counts.h5,
      h6Count: counts.h6,
      errorCount,
      warningCount
    };
  }

  /**
   * Calculate accessibility score (0-100)
   */
  private calculateAccessibilityScore(): number {
    const totalIssues = this.violations.length;
    const errorWeight = 10;
    const warningWeight = 3;
    const infoWeight = 1;

    const weightedScore = this.violations.reduce((score, violation) => {
      switch (violation.severity) {
        case 'error': return score - errorWeight;
        case 'warning': return score - warningWeight;
        case 'info': return score - infoWeight;
        default: return score;
      }
    }, 100);

    return Math.max(0, Math.min(100, weightedScore));
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const violations = this.violations;

    if (violations.some(v => v.id === 'missing-h1')) {
      recommendations.push('Add a single H1 heading to establish the main topic of each page.');
    }

    if (violations.some(v => v.id.startsWith('multiple-h1'))) {
      recommendations.push('Use only one H1 per page. Convert additional H1s to H2 or appropriate levels.');
    }

    if (violations.some(v => v.id.startsWith('skipped-level') || v.id.startsWith('level-skip'))) {
      recommendations.push('Maintain sequential heading hierarchy. Don\'t skip levels (H1→H2→H3, not H1→H3).');
    }

    if (violations.some(v => v.id.startsWith('empty-heading'))) {
      recommendations.push('Ensure all headings have meaningful, accessible text content.');
    }

    if (violations.some(v => v.id.startsWith('vague-heading'))) {
      recommendations.push('Use descriptive heading text that clearly indicates section content.');
    }

    if (violations.some(v => v.id.startsWith('heading-outside-landmark'))) {
      recommendations.push('Place headings within semantic landmarks (main, section, article) for better navigation.');
    }

    if (violations.some(v => v.id.startsWith('section-without-heading'))) {
      recommendations.push('Add headings to sections and articles to improve content structure.');
    }

    // Add general best practices if no specific violations
    if (violations.length === 0) {
      recommendations.push('Excellent heading structure! Consider reviewing content for clarity and user experience.');
    }

    return recommendations;
  }

  /**
   * Utility methods
   */
  private getHeadingLevel(heading: HTMLHeadingElement): number {
    if (heading.hasAttribute('role') && heading.getAttribute('role') === 'heading') {
      return parseInt(heading.getAttribute('aria-level') || '1', 10);
    }
    return parseInt(heading.tagName.charAt(1), 10);
  }

  private getElementSelector(element: Element): string {
    const tagName = element.tagName.toLowerCase();
    const id = element.id ? `#${element.id}` : '';
    const classes = element.className ? `.${Array.from(element.classList).join('.')}` : '';
    
    return `${tagName}${id}${classes}`;
  }

  private findLandmarkParent(element: Element): Element | null {
    const landmarks = ['main', 'section', 'article', 'aside', 'nav', 'header', 'footer'];
    let parent = element.parentElement;
    
    while (parent) {
      if (landmarks.includes(parent.tagName.toLowerCase()) || 
          parent.hasAttribute('role') && 
          ['banner', 'navigation', 'main', 'complementary', 'contentinfo'].includes(parent.getAttribute('role') || '')) {
        return parent;
      }
      parent = parent.parentElement;
    }
    
    return null;
  }
}

/**
 * Convenience function to run heading audit
 */
export function auditHeadingHierarchy(container?: Document | Element): HeadingAuditResult {
  const auditor = new HeadingHierarchyAuditor();
  return auditor.audit(container);
}

/**
 * Generate accessibility report for display
 */
export function generateAccessibilityReport(result: HeadingAuditResult): string {
  const { summary, violations, recommendations } = result;
  
  let report = `# Heading Hierarchy Accessibility Report\n\n`;
  report += `## Summary\n`;
  report += `- **Accessibility Score:** ${summary.score}/100\n`;
  report += `- **Total Headings:** ${summary.totalHeadings}\n`;
  report += `- **H1:** ${summary.h1Count} | **H2:** ${summary.h2Count} | **H3:** ${summary.h3Count}\n`;
  report += `- **H4:** ${summary.h4Count} | **H5:** ${summary.h5Count} | **H6:** ${summary.h6Count}\n`;
  report += `- **Errors:** ${summary.errorCount} | **Warnings:** ${summary.warningCount}\n\n`;

  if (violations.length > 0) {
    report += `## Issues Found\n\n`;
    violations.forEach((violation, index) => {
      report += `### ${index + 1}. ${violation.violation}\n`;
      report += `- **Severity:** ${violation.severity.toUpperCase()}\n`;
      report += `- **Location:** ${violation.location.selector}\n`;
      report += `- **Text:** "${violation.text}"\n`;
      report += `- **Recommendation:** ${violation.recommendation}\n`;
      report += `- **WCAG Criterion:** ${violation.wcagCriterion}\n\n`;
    });
  }

  report += `## Recommendations\n\n`;
  recommendations.forEach((rec, index) => {
    report += `${index + 1}. ${rec}\n`;
  });

  return report;
}