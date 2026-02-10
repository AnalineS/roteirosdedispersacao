/**
 * Centralized Content Security Policy configuration.
 * Single source of truth for CSP directives across all environments.
 *
 * Used by middleware.ts (Edge Runtime) to set the CSP header per request.
 * Must remain Edge-compatible: no Node.js APIs.
 */

export type CspEnvironment = 'development' | 'staging' | 'production';

export interface CspOptions {
  environment: CspEnvironment;
  apiDomain?: string;
  reportUri?: string;
}

// ---------------------------------------------------------------------------
// Domain allowlists grouped by purpose
// ---------------------------------------------------------------------------

export const CSP_DOMAINS = {
  // Google Analytics
  analytics: [
    'https://www.googletagmanager.com',
    'https://www.google-analytics.com',
    'https://region1.google-analytics.com',
  ],

  // Microsoft Clarity
  clarity: [
    'https://www.clarity.ms',
  ],

  // Google Fonts
  fonts: [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
  ],

  // Application API domains (wildcard covers hml-*, api.*, etc.)
  app: [
    'https://*.roteirosdispensacao.com.br',
  ],
} as const;

// ---------------------------------------------------------------------------
// CSP builder
// ---------------------------------------------------------------------------

/**
 * Build a complete CSP directive string for the given environment.
 *
 * - Development: adds 'unsafe-eval' (HMR), ws:/wss: (hot reload)
 * - Staging/Production: adds upgrade-insecure-requests, report-uri
 */
export function buildCspDirectives(options: CspOptions): string {
  const { environment, apiDomain, reportUri } = options;
  const isDev = environment === 'development';

  const directives: string[] = [
    // Default fallback
    "default-src 'self'",

    // Scripts: 'unsafe-inline' required for Next.js RSC hydration (self.__next_f.push)
    // and dangerouslySetInnerHTML in GA, Clarity, loading screen components.
    // 'unsafe-eval' only in dev for HMR/Fast Refresh.
    [
      "script-src 'self' 'unsafe-inline'",
      isDev ? "'unsafe-eval'" : '',
      ...CSP_DOMAINS.analytics,
      ...CSP_DOMAINS.clarity,
    ].filter(Boolean).join(' '),

    // Styles: 'unsafe-inline' required for dynamic style injection
    // (accessibility components, theme system) and Google Fonts CSS.
    [
      "style-src 'self' 'unsafe-inline'",
      CSP_DOMAINS.fonts[0], // fonts.googleapis.com
    ].join(' '),

    // Images: allow data URIs, blob (PDF generation), and any HTTPS for medical content
    "img-src 'self' data: blob: https:",

    // Fonts: Google Fonts CDN + data URIs for embedded fonts
    [
      "font-src 'self' data:",
      ...CSP_DOMAINS.fonts,
    ].join(' '),

    // Connections: API + analytics + Clarity + app wildcard
    [
      "connect-src 'self'",
      apiDomain || '',
      ...CSP_DOMAINS.app,
      ...CSP_DOMAINS.analytics,
      ...CSP_DOMAINS.clarity,
      isDev ? 'ws: wss:' : '',
    ].filter(Boolean).join(' '),

    // Block all frames, plugins, and embedding
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ];

  // HTTPS enforcement for staging/production only
  if (!isDev) {
    directives.push('upgrade-insecure-requests');
  }

  // Violation reporting
  if (reportUri) {
    directives.push(`report-uri ${reportUri}`);
  }

  return directives.join('; ');
}
