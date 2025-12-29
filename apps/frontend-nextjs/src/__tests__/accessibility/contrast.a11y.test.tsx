/**
 * Color Contrast Accessibility Tests
 * WCAG 1.4.3, 1.4.6 - Contrast validation
 *
 * Tests:
 * - Normal text: 4.5:1 minimum contrast
 * - Large text (>=18pt or >=14pt bold): 3:1 minimum contrast
 * - UI components: 3:1 minimum contrast
 */

// Color contrast calculation utilities
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

function relativeLuminance(rgb: { r: number; g: number; b: number }): number {
  const [rs, gs, bs] = [rgb.r, rgb.g, rgb.b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function calculateContrastRatio(foreground: string, background: string): number {
  const fg = hexToRgb(foreground);
  const bg = hexToRgb(background);

  if (!fg || !bg) return 0;

  const lum1 = relativeLuminance(fg);
  const lum2 = relativeLuminance(bg);

  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  return (lighter + 0.05) / (darker + 0.05);
}

function meetsWCAGAA(
  foreground: string,
  background: string,
  isLargeText: boolean = false
): { passes: boolean; ratio: number; required: number } {
  const ratio = calculateContrastRatio(foreground, background);
  const required = isLargeText ? 3 : 4.5;

  return {
    passes: ratio >= required,
    ratio: Math.round(ratio * 100) / 100,
    required,
  };
}

function meetsWCAGAAA(
  foreground: string,
  background: string,
  isLargeText: boolean = false
): { passes: boolean; ratio: number; required: number } {
  const ratio = calculateContrastRatio(foreground, background);
  const required = isLargeText ? 4.5 : 7;

  return {
    passes: ratio >= required,
    ratio: Math.round(ratio * 100) / 100,
    required,
  };
}

describe('Color Contrast - WCAG 1.4.3 (AA)', () => {
  describe('Text Color Contrast', () => {
    // Primary text colors from themes.css
    const textColorPairs = [
      {
        name: 'Primary text on white',
        fg: '#0f172a', // gray-900
        bg: '#ffffff',
        isLarge: false,
      },
      {
        name: 'Secondary text on white',
        fg: '#374151', // gray-700
        bg: '#ffffff',
        isLarge: false,
      },
      {
        name: 'Muted text on white',
        fg: '#6b7280', // gray-500
        bg: '#ffffff',
        isLarge: false,
      },
      {
        name: 'UnB primary blue on white',
        fg: '#003366',
        bg: '#ffffff',
        isLarge: false,
      },
      {
        name: 'Link color on white',
        fg: '#1976d2',
        bg: '#ffffff',
        isLarge: false,
      },
    ];

    textColorPairs.forEach(({ name, fg, bg, isLarge }) => {
      it(`${name} should meet WCAG AA (${isLarge ? '3:1' : '4.5:1'})`, () => {
        const result = meetsWCAGAA(fg, bg, isLarge);
        expect(result.passes).toBe(true);
        // Log actual ratio for debugging
        if (!result.passes) {
          console.log(
            `FAIL: ${name} - Ratio: ${result.ratio}:1, Required: ${result.required}:1`
          );
        }
      });
    });
  });

  describe('Button Contrast', () => {
    const buttonColorPairs = [
      {
        name: 'Primary button (white on blue)',
        fg: '#ffffff',
        bg: '#2563eb', // blue-600
        isLarge: false,
      },
      {
        name: 'Secondary button (blue on white)',
        fg: '#2563eb',
        bg: '#ffffff',
        isLarge: false,
      },
      {
        name: 'Danger button (white on red)',
        fg: '#ffffff',
        bg: '#dc2626', // red-600
        isLarge: false,
      },
      {
        name: 'Success button (white on green)',
        fg: '#ffffff',
        bg: '#15803d', // green-700 (WCAG AA compliant)
        isLarge: false,
      },
    ];

    buttonColorPairs.forEach(({ name, fg, bg, isLarge }) => {
      it(`${name} should meet WCAG AA`, () => {
        const result = meetsWCAGAA(fg, bg, isLarge);
        expect(result.passes).toBe(true);
      });
    });
  });

  describe('Persona Colors', () => {
    // Dr. Gasnelio colors
    it('Dr. Gasnelio primary (dark blue on white) should meet WCAG AA', () => {
      const result = meetsWCAGAA('#1e3a8a', '#ffffff', false);
      expect(result.passes).toBe(true);
      expect(result.ratio).toBeGreaterThanOrEqual(4.5);
    });

    // Gá colors
    it('Gá primary (dark green on white) should meet WCAG AA', () => {
      const result = meetsWCAGAA('#166534', '#ffffff', false);
      expect(result.passes).toBe(true);
      expect(result.ratio).toBeGreaterThanOrEqual(4.5);
    });
  });

  describe('Status Colors', () => {
    // Using darker shades for WCAG AA compliance (4.5:1 ratio)
    const statusColors = [
      { name: 'Error text', fg: '#dc2626', bg: '#ffffff' }, // red-600: 4.5:1
      { name: 'Success text', fg: '#15803d', bg: '#ffffff' }, // green-700: 5.3:1
      { name: 'Warning text', fg: '#b45309', bg: '#ffffff' }, // amber-700: 4.5:1
      { name: 'Info text', fg: '#2563eb', bg: '#ffffff' }, // blue-600: 4.7:1
    ];

    statusColors.forEach(({ name, fg, bg }) => {
      it(`${name} should meet WCAG AA (4.5:1)`, () => {
        const result = meetsWCAGAA(fg, bg, false);
        expect(result.passes).toBe(true);
      });
    });
  });
});

describe('Color Contrast - WCAG 1.4.11 (Non-Text Contrast)', () => {
  describe('UI Components (3:1 minimum)', () => {
    const uiComponentColors = [
      {
        name: 'Input border on white',
        fg: '#6b7280', // gray-500
        bg: '#ffffff',
      },
      {
        name: 'Focus ring (blue) on white',
        fg: '#2563eb',
        bg: '#ffffff',
      },
      {
        name: 'Checkbox border on white',
        fg: '#374151',
        bg: '#ffffff',
      },
    ];

    uiComponentColors.forEach(({ name, fg, bg }) => {
      it(`${name} should meet 3:1 contrast for UI components`, () => {
        const ratio = calculateContrastRatio(fg, bg);
        expect(ratio).toBeGreaterThanOrEqual(3);
      });
    });
  });

  describe('Focus Indicators', () => {
    it('Focus indicator should have sufficient contrast', () => {
      // Focus ring color on white background
      const ratio = calculateContrastRatio('#2563eb', '#ffffff');
      expect(ratio).toBeGreaterThanOrEqual(3);
    });
  });
});

describe('Contrast Calculation Utilities', () => {
  it('should correctly calculate contrast for black on white', () => {
    const ratio = calculateContrastRatio('#000000', '#ffffff');
    expect(ratio).toBeCloseTo(21, 0);
  });

  it('should correctly calculate contrast for white on black', () => {
    const ratio = calculateContrastRatio('#ffffff', '#000000');
    expect(ratio).toBeCloseTo(21, 0);
  });

  it('should return 1 for same colors', () => {
    const ratio = calculateContrastRatio('#ffffff', '#ffffff');
    expect(ratio).toBe(1);
  });

  it('should correctly identify passing WCAG AA for normal text', () => {
    const result = meetsWCAGAA('#000000', '#ffffff', false);
    expect(result.passes).toBe(true);
    expect(result.required).toBe(4.5);
  });

  it('should correctly identify passing WCAG AA for large text', () => {
    const result = meetsWCAGAA('#777777', '#ffffff', true);
    expect(result.passes).toBe(true);
    expect(result.required).toBe(3);
  });
});

describe('High Contrast Mode Validation', () => {
  // Colors should still work in high contrast mode
  const highContrastPairs = [
    { name: 'Black text on white', fg: '#000000', bg: '#ffffff' },
    { name: 'White text on black', fg: '#ffffff', bg: '#000000' },
    { name: 'Blue links on white', fg: '#0000ee', bg: '#ffffff' },
  ];

  highContrastPairs.forEach(({ name, fg, bg }) => {
    it(`${name} should meet WCAG AAA (7:1)`, () => {
      const result = meetsWCAGAAA(fg, bg, false);
      expect(result.passes).toBe(true);
    });
  });
});
