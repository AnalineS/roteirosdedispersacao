import { buildCspDirectives, CSP_DOMAINS } from '../cspConfig';
import type { CspOptions } from '../cspConfig';

describe('cspConfig', () => {
  describe('buildCspDirectives', () => {
    const productionOptions: CspOptions = {
      environment: 'production',
      apiDomain: 'https://api.roteirosdispensacao.com.br',
    };

    const devOptions: CspOptions = {
      environment: 'development',
      apiDomain: 'http://localhost:5000',
    };

    it('should return a non-empty string', () => {
      const csp = buildCspDirectives(productionOptions);
      expect(csp).toBeDefined();
      expect(csp.length).toBeGreaterThan(0);
    });

    // --- Production CSP ---

    it('should include all required directives in production', () => {
      const csp = buildCspDirectives(productionOptions);
      const required = [
        'default-src',
        'script-src',
        'style-src',
        'img-src',
        'font-src',
        'connect-src',
        'frame-src',
        'object-src',
        'base-uri',
        'form-action',
        'frame-ancestors',
      ];
      for (const directive of required) {
        expect(csp).toContain(directive);
      }
    });

    it('should NOT include unsafe-eval in production', () => {
      const csp = buildCspDirectives(productionOptions);
      expect(csp).not.toContain("'unsafe-eval'");
    });

    it('should include unsafe-inline in script-src for RSC hydration', () => {
      const csp = buildCspDirectives(productionOptions);
      // Extract the script-src directive
      const scriptSrc = csp.split(';').find((d) => d.trim().startsWith('script-src'));
      expect(scriptSrc).toContain("'unsafe-inline'");
    });

    it('should include unsafe-inline in style-src', () => {
      const csp = buildCspDirectives(productionOptions);
      const styleSrc = csp.split(';').find((d) => d.trim().startsWith('style-src'));
      expect(styleSrc).toContain("'unsafe-inline'");
    });

    it('should include Google Analytics domains', () => {
      const csp = buildCspDirectives(productionOptions);
      for (const domain of CSP_DOMAINS.analytics) {
        expect(csp).toContain(domain);
      }
    });

    it('should include Microsoft Clarity domains', () => {
      const csp = buildCspDirectives(productionOptions);
      for (const domain of CSP_DOMAINS.clarity) {
        expect(csp).toContain(domain);
      }
    });

    it('should include Google Fonts domains in font-src', () => {
      const csp = buildCspDirectives(productionOptions);
      const fontSrc = csp.split(';').find((d) => d.trim().startsWith('font-src'));
      expect(fontSrc).toContain('fonts.gstatic.com');
      expect(fontSrc).toContain('fonts.googleapis.com');
    });

    it('should include Google Fonts in style-src', () => {
      const csp = buildCspDirectives(productionOptions);
      const styleSrc = csp.split(';').find((d) => d.trim().startsWith('style-src'));
      expect(styleSrc).toContain('fonts.googleapis.com');
    });

    it('should include frame-ancestors none', () => {
      const csp = buildCspDirectives(productionOptions);
      expect(csp).toContain("frame-ancestors 'none'");
    });

    it('should include upgrade-insecure-requests in production', () => {
      const csp = buildCspDirectives(productionOptions);
      expect(csp).toContain('upgrade-insecure-requests');
    });

    it('should include the provided API domain in connect-src', () => {
      const csp = buildCspDirectives(productionOptions);
      const connectSrc = csp.split(';').find((d) => d.trim().startsWith('connect-src'));
      expect(connectSrc).toContain('https://api.roteirosdispensacao.com.br');
    });

    it('should NOT include ws: or wss: in production connect-src', () => {
      const csp = buildCspDirectives(productionOptions);
      const connectSrc = csp.split(';').find((d) => d.trim().startsWith('connect-src'));
      expect(connectSrc).not.toContain('ws:');
      expect(connectSrc).not.toContain('wss:');
    });

    it('should include report-uri when reportUri is provided', () => {
      const csp = buildCspDirectives({
        ...productionOptions,
        reportUri: '/api/csp-report',
      });
      expect(csp).toContain('report-uri /api/csp-report');
    });

    it('should NOT include report-uri when reportUri is omitted', () => {
      const csp = buildCspDirectives(productionOptions);
      expect(csp).not.toContain('report-uri');
    });

    // --- Development CSP ---

    it('should include unsafe-eval in development for HMR', () => {
      const csp = buildCspDirectives(devOptions);
      expect(csp).toContain("'unsafe-eval'");
    });

    it('should include ws: and wss: in development for hot reload', () => {
      const csp = buildCspDirectives(devOptions);
      const connectSrc = csp.split(';').find((d) => d.trim().startsWith('connect-src'));
      expect(connectSrc).toContain('ws:');
      expect(connectSrc).toContain('wss:');
    });

    it('should NOT include upgrade-insecure-requests in development', () => {
      const csp = buildCspDirectives(devOptions);
      expect(csp).not.toContain('upgrade-insecure-requests');
    });

    // --- Staging CSP ---

    it('should treat staging identical to production (no unsafe-eval)', () => {
      const csp = buildCspDirectives({
        environment: 'staging',
        apiDomain: 'https://hml-api.roteirosdispensacao.com.br',
      });
      expect(csp).not.toContain("'unsafe-eval'");
      expect(csp).toContain('upgrade-insecure-requests');
    });

    // --- No duplicate directives ---

    it('should not have duplicate directive names', () => {
      const csp = buildCspDirectives(productionOptions);
      const directives = csp.split(';').map((d) => d.trim().split(' ')[0]);
      const unique = new Set(directives);
      expect(directives.length).toBe(unique.size);
    });

    // --- Edge case: no apiDomain ---

    it('should work without apiDomain', () => {
      const csp = buildCspDirectives({ environment: 'production' });
      expect(csp).toContain("default-src 'self'");
      expect(csp).toContain('connect-src');
    });
  });

  describe('CSP_DOMAINS', () => {
    it('should have analytics domains', () => {
      expect(CSP_DOMAINS.analytics.length).toBeGreaterThan(0);
    });

    it('should have clarity domains', () => {
      expect(CSP_DOMAINS.clarity.length).toBeGreaterThan(0);
    });

    it('should have font domains', () => {
      expect(CSP_DOMAINS.fonts.length).toBeGreaterThan(0);
    });

    it('should have app domains', () => {
      expect(CSP_DOMAINS.app.length).toBeGreaterThan(0);
    });

    it('should only contain HTTPS URLs (no HTTP)', () => {
      const allDomains = [
        ...CSP_DOMAINS.analytics,
        ...CSP_DOMAINS.clarity,
        ...CSP_DOMAINS.fonts,
        ...CSP_DOMAINS.app,
      ];
      for (const domain of allDomains) {
        expect(domain).toMatch(/^https:\/\//);
      }
    });
  });
});
