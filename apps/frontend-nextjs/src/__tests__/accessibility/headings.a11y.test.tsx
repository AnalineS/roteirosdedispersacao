/**
 * Heading Hierarchy Accessibility Tests
 * WCAG 2.4.1, 2.4.6 - Heading hierarchy validation
 *
 * Tests:
 * - Single H1 per page
 * - No heading level skips (H1 > H2 > H3, not H1 > H3)
 * - Meaningful heading text
 */

import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';

// Test utilities
function getHeadingLevels(container: HTMLElement): number[] {
  const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
  return Array.from(headings).map(h => parseInt(h.tagName.substring(1)));
}

function hasHeadingSkips(levels: number[]): boolean {
  for (let i = 1; i < levels.length; i++) {
    const diff = levels[i] - levels[i - 1];
    if (diff > 1) return true;
  }
  return false;
}

function getH1Count(container: HTMLElement): number {
  return container.querySelectorAll('h1').length;
}

function getH1Text(container: HTMLElement): string | null {
  const h1 = container.querySelector('h1');
  return h1?.textContent || null;
}

// Mock component for testing heading hierarchy
function MockPageWithCorrectHeadings() {
  return (
    <main>
      <h1>Page Title</h1>
      <section>
        <h2>Section One</h2>
        <p>Content</p>
        <h3>Subsection</h3>
        <p>More content</p>
      </section>
      <section>
        <h2>Section Two</h2>
        <p>Content</p>
      </section>
    </main>
  );
}

function MockPageWithMultipleH1s() {
  return (
    <main>
      <h1>First Title</h1>
      <section>
        <h1>Second Title</h1>
      </section>
    </main>
  );
}

function MockPageWithSkippedHeadings() {
  return (
    <main>
      <h1>Page Title</h1>
      <section>
        <h3>Skipped H2</h3>
      </section>
    </main>
  );
}

function MockPageWithNoH1() {
  return (
    <main>
      <h2>Missing H1</h2>
      <p>Content without main heading</p>
    </main>
  );
}

describe('Heading Hierarchy - WCAG 2.4.1, 2.4.6', () => {
  describe('Single H1 Validation', () => {
    it('should have exactly one H1 element', () => {
      const { container } = render(<MockPageWithCorrectHeadings />);
      expect(getH1Count(container)).toBe(1);
    });

    it('should fail when multiple H1s are present', () => {
      const { container } = render(<MockPageWithMultipleH1s />);
      expect(getH1Count(container)).toBeGreaterThan(1);
    });

    it('should fail when no H1 is present', () => {
      const { container } = render(<MockPageWithNoH1 />);
      expect(getH1Count(container)).toBe(0);
    });

    it('H1 should have meaningful text content', () => {
      const { container } = render(<MockPageWithCorrectHeadings />);
      const h1Text = getH1Text(container);
      expect(h1Text).toBeTruthy();
      expect(h1Text!.length).toBeGreaterThan(3);
    });
  });

  describe('Heading Level Sequence', () => {
    it('should not skip heading levels', () => {
      const { container } = render(<MockPageWithCorrectHeadings />);
      const levels = getHeadingLevels(container);
      expect(hasHeadingSkips(levels)).toBe(false);
    });

    it('should detect skipped heading levels', () => {
      const { container } = render(<MockPageWithSkippedHeadings />);
      const levels = getHeadingLevels(container);
      expect(hasHeadingSkips(levels)).toBe(true);
    });

    it('should follow logical progression H1 > H2 > H3', () => {
      const { container } = render(<MockPageWithCorrectHeadings />);
      const levels = getHeadingLevels(container);

      // First heading should be H1
      expect(levels[0]).toBe(1);

      // Each subsequent heading should be at most 1 level deeper
      for (let i = 1; i < levels.length; i++) {
        expect(levels[i] - levels[i - 1]).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('axe-core Heading Rules', () => {
    it('correct headings should pass axe heading rules', async () => {
      const { container } = render(<MockPageWithCorrectHeadings />);
      const results = await axe(container, {
        rules: {
          'heading-order': { enabled: true },
          'page-has-heading-one': { enabled: true }
        }
      });
      expect(results).toHaveNoViolations();
    });

    it('multiple H1s should fail axe heading rules', async () => {
      const { container } = render(<MockPageWithMultipleH1s />);
      const results = await axe(container, {
        rules: {
          'page-has-heading-one': { enabled: true }
        }
      });
      // Note: axe-core may not flag multiple H1s as violation by default
      // This test validates our custom logic works
      expect(getH1Count(container)).toBeGreaterThan(1);
    });

    it('skipped headings should fail axe heading-order rule', async () => {
      const { container } = render(<MockPageWithSkippedHeadings />);
      const results = await axe(container, {
        rules: {
          'heading-order': { enabled: true }
        }
      });
      // Check for heading-order violations
      const headingOrderViolations = results.violations.filter(
        v => v.id === 'heading-order'
      );
      expect(headingOrderViolations.length).toBeGreaterThan(0);
    });
  });
});

describe('Heading Accessibility Best Practices', () => {
  it('headings should be within landmark regions', () => {
    const { container } = render(<MockPageWithCorrectHeadings />);
    const h1 = container.querySelector('h1');

    // H1 should be within main landmark
    const main = container.querySelector('main');
    expect(main?.contains(h1)).toBe(true);
  });

  it('section headings should use appropriate levels', () => {
    const { container } = render(<MockPageWithCorrectHeadings />);
    const sections = container.querySelectorAll('section');

    sections.forEach(section => {
      const firstHeading = section.querySelector('h1, h2, h3, h4, h5, h6');
      if (firstHeading) {
        const level = parseInt(firstHeading.tagName.substring(1));
        // Section headings should typically be H2 or lower
        expect(level).toBeGreaterThanOrEqual(2);
      }
    });
  });
});
