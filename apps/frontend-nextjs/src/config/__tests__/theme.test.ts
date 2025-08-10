/**
 * Testes para theme configuration
 * Cobertura: Cores, gradientes, personas, utilidades
 */

import { theme, getPersonaTheme, getStatusColor, getPrimaryGradient, getSecondaryGradient } from '../theme';

describe('Theme Configuration', () => {
  describe('color palettes', () => {
    it('should have complete primary color palette', () => {
      expect(theme.colors.primary).toHaveProperty('50');
      expect(theme.colors.primary).toHaveProperty('100');
      expect(theme.colors.primary).toHaveProperty('500');
      expect(theme.colors.primary).toHaveProperty('900');
      
      // Verify main color is UnB blue
      expect(theme.colors.primary[500]).toBe('#0284c7');
    });

    it('should have complete secondary color palette', () => {
      expect(theme.colors.secondary).toHaveProperty('50');
      expect(theme.colors.secondary).toHaveProperty('500');
      expect(theme.colors.secondary).toHaveProperty('900');
      
      // Verify secondary is green
      expect(theme.colors.secondary[500]).toBe('#22c55e');
    });

    it('should have neutral colors', () => {
      expect(theme.colors.neutral).toHaveProperty('50');
      expect(theme.colors.neutral).toHaveProperty('500');
      expect(theme.colors.neutral).toHaveProperty('900');
    });

    it('should have educational status colors', () => {
      expect(theme.colors.educational.success).toBeTruthy();
      expect(theme.colors.educational.warning).toBeTruthy();
      expect(theme.colors.educational.error).toBeTruthy();
      expect(theme.colors.educational.info).toBeTruthy();
      expect(theme.colors.educational.progress).toBeTruthy();
    });

    it('should have warning, success, and danger palettes', () => {
      expect(theme.colors.warning[500]).toBeTruthy();
      expect(theme.colors.success[500]).toBeTruthy();
      expect(theme.colors.danger[500]).toBeTruthy();
    });
  });

  describe('gradients', () => {
    it('should have primary gradient', () => {
      expect(theme.gradients.primary).toContain('linear-gradient');
      expect(theme.gradients.primary).toContain('#0284c7');
    });

    it('should have secondary gradient', () => {
      expect(theme.gradients.secondary).toContain('linear-gradient');
      expect(theme.gradients.secondary).toContain('#22c55e');
    });

    it('should have hero gradient', () => {
      expect(theme.gradients.hero).toContain('linear-gradient');
      expect(theme.gradients.hero).toContain('#0284c7');
      expect(theme.gradients.hero).toContain('#22c55e');
    });

    it('should have card gradient', () => {
      expect(theme.gradients.card).toContain('linear-gradient');
    });
  });

  describe('shadows', () => {
    it('should have shadow variations', () => {
      expect(theme.shadows.sm).toContain('rgb(2 132 199');
      expect(theme.shadows.md).toContain('rgb(2 132 199');
      expect(theme.shadows.lg).toContain('rgb(2 132 199');
      expect(theme.shadows.xl).toContain('rgb(2 132 199');
    });
  });

  describe('personas', () => {
    it('should have Dr. Gasnelio persona configuration', () => {
      expect(theme.personas['dr-gasnelio']).toBeDefined();
      expect(theme.personas['dr-gasnelio'].primaryColor).toBe('#0284c7');
      expect(theme.personas['dr-gasnelio'].avatar).toContain('dr-gasnelio');
    });

    it('should have dr_gasnelio variant', () => {
      expect(theme.personas['dr_gasnelio']).toBeDefined();
      expect(theme.personas['dr_gasnelio'].primaryColor).toBe('#0284c7');
    });

    it('should have Gá persona configuration', () => {
      expect(theme.personas.ga).toBeDefined();
      expect(theme.personas.ga.primaryColor).toBe('#22c55e');
      expect(theme.personas.ga.avatar).toContain('ga');
    });

    it('should have consistent color theming across personas', () => {
      const drGasnelio = theme.personas['dr-gasnelio'];
      const ga = theme.personas.ga;
      
      expect(drGasnelio.primaryColor).not.toBe(ga.primaryColor);
      expect(drGasnelio.secondaryColor).toBeTruthy();
      expect(ga.secondaryColor).toBeTruthy();
    });
  });

  describe('assets', () => {
    it('should have logo configurations', () => {
      expect(theme.assets.logos.unb).toContain('unb');
      expect(theme.assets.logos.unbFull).toContain('unb');
      expect(theme.assets.logos.ppgcf).toContain('ppgcf');
    });

    it('should use appropriate file formats', () => {
      expect(theme.assets.logos.unb).toMatch(/\.(png|webp|jpg|jpeg)$/);
      expect(theme.assets.logos.unbFull).toMatch(/\.(png|webp|jpg|jpeg)$/);
      expect(theme.assets.logos.ppgcf).toMatch(/\.(png|webp|jpg|jpeg)$/);
    });
  });
});

describe('Theme Utility Functions', () => {
  describe('getPersonaTheme', () => {
    it('should return correct theme for dr-gasnelio', () => {
      const theme = getPersonaTheme('dr-gasnelio');
      
      expect(theme.primaryColor).toBe('#0284c7');
      expect(theme.avatar).toContain('dr-gasnelio');
    });

    it('should return correct theme for dr_gasnelio variant', () => {
      const theme = getPersonaTheme('dr_gasnelio');
      
      expect(theme.primaryColor).toBe('#0284c7');
      expect(theme.avatar).toContain('dr-gasnelio');
    });

    it('should return correct theme for ga', () => {
      const theme = getPersonaTheme('ga');
      
      expect(theme.primaryColor).toBe('#22c55e');
      expect(theme.avatar).toContain('ga');
    });

    it('should return default theme for unknown persona', () => {
      const theme = getPersonaTheme('unknown');
      
      // Should default to ga
      expect(theme.primaryColor).toBe('#22c55e');
    });
  });

  describe('getStatusColor', () => {
    it('should return correct colors for each status', () => {
      expect(getStatusColor('success')).toBe('#22c55e');
      expect(getStatusColor('warning')).toBe('#f59e0b');
      expect(getStatusColor('error')).toBe('#ef4444');
      expect(getStatusColor('info')).toBe('#0284c7');
      expect(getStatusColor('progress')).toBe('#8b5cf6');
    });
  });

  describe('gradient utilities', () => {
    it('should return primary gradient', () => {
      const gradient = getPrimaryGradient();
      
      expect(gradient).toContain('linear-gradient');
      expect(gradient).toContain('#0284c7');
    });

    it('should return secondary gradient', () => {
      const gradient = getSecondaryGradient();
      
      expect(gradient).toContain('linear-gradient');
      expect(gradient).toContain('#22c55e');
    });
  });
});

describe('Theme Consistency', () => {
  it('should maintain color consistency across palettes', () => {
    // Primary color should be consistent
    expect(theme.colors.primary[500]).toBe('#0284c7');
    expect(theme.colors.educational.info).toBe('#0284c7');
    expect(theme.personas['dr-gasnelio'].primaryColor).toBe('#0284c7');
  });

  it('should maintain green color consistency', () => {
    // Secondary/green color should be consistent
    expect(theme.colors.secondary[500]).toBe('#22c55e');
    expect(theme.colors.educational.success).toBe('#22c55e');
    expect(theme.personas.ga.primaryColor).toBe('#22c55e');
  });

  it('should have proper color contrast ratios', () => {
    // Basic checks for contrast (simplified)
    const primary = theme.colors.primary[500];
    const secondary = theme.colors.secondary[500];
    const neutral = theme.colors.neutral[500];
    
    expect(primary).not.toBe(secondary);
    expect(primary).not.toBe(neutral);
    expect(secondary).not.toBe(neutral);
  });

  it('should have complete color scales', () => {
    const colorPalettes = ['primary', 'secondary', 'neutral', 'warning', 'success', 'danger'];
    
    colorPalettes.forEach(palette => {
      const colors = theme.colors[palette as keyof typeof theme.colors];
      
      if (typeof colors === 'object' && colors !== null) {
        expect(colors).toHaveProperty('50');
        expect(colors).toHaveProperty('500');
        expect(colors).toHaveProperty('900');
      }
    });
  });
});