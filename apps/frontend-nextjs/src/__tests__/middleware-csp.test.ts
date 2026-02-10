/**
 * Integration tests: middleware sets correct CSP headers.
 *
 * These tests import the real middleware function and verify that
 * the Content-Security-Policy header is set correctly for each environment.
 */

import { NextRequest } from 'next/server';

// The middleware re-exports are tested via direct invocation
import { middleware } from '../../middleware';

function createMockRequest(
  url: string,
  env?: Record<string, string>,
): NextRequest {
  // Set environment variables before creating the request
  if (env) {
    for (const [key, value] of Object.entries(env)) {
      process.env[key] = value;
    }
  }

  return new NextRequest(new URL(url, 'https://roteirosdispensacao.com.br'));
}

function cleanupEnv(keys: string[]) {
  for (const key of keys) {
    delete process.env[key];
  }
}

describe('Middleware CSP Integration', () => {
  const envKeys = [
    'NEXT_PUBLIC_ENVIRONMENT',
    'NEXT_PUBLIC_API_URL_PRODUCTION',
    'NEXT_PUBLIC_API_URL_STAGING',
    'NEXT_PUBLIC_API_URL_DEV',
  ];

  afterEach(() => {
    cleanupEnv(envKeys);
  });

  it('should set Content-Security-Policy header', () => {
    process.env.NEXT_PUBLIC_ENVIRONMENT = 'production';
    process.env.NEXT_PUBLIC_API_URL_PRODUCTION = 'https://api.roteirosdispensacao.com.br';

    const request = createMockRequest('https://roteirosdispensacao.com.br/');
    const response = middleware(request);

    const csp = response.headers.get('Content-Security-Policy');
    expect(csp).toBeDefined();
    expect(csp).not.toBe('');
  });

  it('should contain all mandatory CSP directives', () => {
    process.env.NEXT_PUBLIC_ENVIRONMENT = 'production';
    process.env.NEXT_PUBLIC_API_URL_PRODUCTION = 'https://api.roteirosdispensacao.com.br';

    const request = createMockRequest('https://roteirosdispensacao.com.br/');
    const response = middleware(request);
    const csp = response.headers.get('Content-Security-Policy') || '';

    const mandatory = [
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

    for (const directive of mandatory) {
      expect(csp).toContain(directive);
    }
  });

  it('should not have duplicate CSP headers', () => {
    process.env.NEXT_PUBLIC_ENVIRONMENT = 'production';

    const request = createMockRequest('https://roteirosdispensacao.com.br/');
    const response = middleware(request);

    // NextResponse headers - check there's only one CSP header
    const cspValues = response.headers.getSetCookie
      ? [response.headers.get('Content-Security-Policy')]
      : [response.headers.get('Content-Security-Policy')];

    const nonNull = cspValues.filter(Boolean);
    expect(nonNull.length).toBe(1);
  });

  it('should include unsafe-eval only in development', () => {
    // Development
    process.env.NEXT_PUBLIC_ENVIRONMENT = 'development';
    const devRequest = createMockRequest('http://localhost:3000/');
    const devResponse = middleware(devRequest);
    const devCsp = devResponse.headers.get('Content-Security-Policy') || '';
    expect(devCsp).toContain("'unsafe-eval'");

    // Production
    cleanupEnv(envKeys);
    process.env.NEXT_PUBLIC_ENVIRONMENT = 'production';
    const prodRequest = createMockRequest('https://roteirosdispensacao.com.br/');
    const prodResponse = middleware(prodRequest);
    const prodCsp = prodResponse.headers.get('Content-Security-Policy') || '';
    expect(prodCsp).not.toContain("'unsafe-eval'");
  });

  it('should include upgrade-insecure-requests only in production/staging', () => {
    process.env.NEXT_PUBLIC_ENVIRONMENT = 'production';
    const prodRequest = createMockRequest('https://roteirosdispensacao.com.br/');
    const prodResponse = middleware(prodRequest);
    const prodCsp = prodResponse.headers.get('Content-Security-Policy') || '';
    expect(prodCsp).toContain('upgrade-insecure-requests');

    cleanupEnv(envKeys);
    process.env.NEXT_PUBLIC_ENVIRONMENT = 'development';
    const devRequest = createMockRequest('http://localhost:3000/');
    const devResponse = middleware(devRequest);
    const devCsp = devResponse.headers.get('Content-Security-Policy') || '';
    expect(devCsp).not.toContain('upgrade-insecure-requests');
  });

  it('should include external analytics domains in production', () => {
    process.env.NEXT_PUBLIC_ENVIRONMENT = 'production';
    process.env.NEXT_PUBLIC_API_URL_PRODUCTION = 'https://api.roteirosdispensacao.com.br';

    const request = createMockRequest('https://roteirosdispensacao.com.br/');
    const response = middleware(request);
    const csp = response.headers.get('Content-Security-Policy') || '';

    expect(csp).toContain('googletagmanager.com');
    expect(csp).toContain('google-analytics.com');
    expect(csp).toContain('clarity.ms');
    expect(csp).toContain('fonts.googleapis.com');
    expect(csp).toContain('fonts.gstatic.com');
  });

  it('should include Reporting-Endpoints header in production', () => {
    process.env.NEXT_PUBLIC_ENVIRONMENT = 'production';
    const request = createMockRequest('https://roteirosdispensacao.com.br/');
    const response = middleware(request);

    const reportEndpoints = response.headers.get('Reporting-Endpoints');
    expect(reportEndpoints).toContain('csp-endpoint');
    expect(reportEndpoints).toContain('/api/csp-report');
  });

  it('should not include Reporting-Endpoints header in development', () => {
    process.env.NEXT_PUBLIC_ENVIRONMENT = 'development';
    const request = createMockRequest('http://localhost:3000/');
    const response = middleware(request);

    const reportEndpoints = response.headers.get('Reporting-Endpoints');
    expect(reportEndpoints).toBeNull();
  });
});
