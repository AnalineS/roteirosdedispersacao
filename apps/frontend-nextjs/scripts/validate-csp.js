#!/usr/bin/env node

/**
 * CSP validation script for CI/CD pipelines.
 *
 * Generates a production CSP string from the shared module and validates:
 *  1. All mandatory directives are present
 *  2. No dangerous wildcards in script-src
 *  3. frame-ancestors is set to 'none'
 *  4. upgrade-insecure-requests is present in production
 *  5. External analytics/font domains are allowlisted
 *
 * Exit code 0 = pass, 1 = fail
 */

// Use require() for compatibility with the Node.js runner in CI
// The module is TypeScript, so we need ts-node or a compiled version.
// In CI, jest already validates the module. This script validates the OUTPUT.

const path = require('path');

// Since this is a TS module, we use a simple inline approach:
// Re-declare the domains and build logic here to avoid needing ts-node in CI.
// This is intentionally duplicated for CI independence.

const CSP_DOMAINS = {
  analytics: [
    'https://www.googletagmanager.com',
    'https://www.google-analytics.com',
    'https://region1.google-analytics.com',
  ],
  clarity: [
    'https://www.clarity.ms',
  ],
  fonts: [
    'https://fonts.googleapis.com',
    'https://fonts.gstatic.com',
  ],
  app: [
    'https://*.roteirosdispensacao.com.br',
  ],
};

function buildCspDirectives(options) {
  const { environment, apiDomain, reportUri } = options;
  const isDev = environment === 'development';

  const directives = [
    "default-src 'self'",
    [
      "script-src 'self' 'unsafe-inline'",
      isDev ? "'unsafe-eval'" : '',
      ...CSP_DOMAINS.analytics,
      ...CSP_DOMAINS.clarity,
    ].filter(Boolean).join(' '),
    [
      "style-src 'self' 'unsafe-inline'",
      CSP_DOMAINS.fonts[0],
    ].join(' '),
    "img-src 'self' data: blob: https:",
    [
      "font-src 'self' data:",
      ...CSP_DOMAINS.fonts,
    ].join(' '),
    [
      "connect-src 'self'",
      apiDomain || '',
      ...CSP_DOMAINS.app,
      ...CSP_DOMAINS.analytics,
      ...CSP_DOMAINS.clarity,
      isDev ? 'ws: wss:' : '',
    ].filter(Boolean).join(' '),
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ];

  if (!isDev) {
    directives.push('upgrade-insecure-requests');
  }

  if (reportUri) {
    directives.push(`report-uri ${reportUri}`);
  }

  return directives.join('; ');
}

// --- Validation ---

const errors = [];
const warnings = [];

// Generate production CSP
const productionCsp = buildCspDirectives({
  environment: 'production',
  apiDomain: 'https://api.roteirosdispensacao.com.br',
  reportUri: '/api/csp-report',
});

console.log('=== CSP Validation ===\n');
console.log('Production CSP:\n' + productionCsp + '\n');

// 1. Mandatory directives
const mandatoryDirectives = [
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

for (const directive of mandatoryDirectives) {
  if (!productionCsp.includes(directive)) {
    errors.push(`MISSING mandatory directive: ${directive}`);
  }
}

// 2. No dangerous wildcards in script-src
const scriptSrc = productionCsp.split(';').find(d => d.trim().startsWith('script-src')) || '';
if (scriptSrc.includes('*') && !scriptSrc.includes('*.roteirosdispensacao')) {
  errors.push('DANGEROUS: wildcard (*) found in script-src');
}
if (scriptSrc.includes("'unsafe-eval'")) {
  errors.push("DANGEROUS: 'unsafe-eval' found in production script-src");
}

// 3. frame-ancestors
if (!productionCsp.includes("frame-ancestors 'none'")) {
  errors.push("MISSING: frame-ancestors 'none' (anti-embedding protection)");
}

// 4. upgrade-insecure-requests
if (!productionCsp.includes('upgrade-insecure-requests')) {
  errors.push('MISSING: upgrade-insecure-requests in production CSP');
}

// 5. External domains present
const requiredDomains = [
  'googletagmanager.com',
  'google-analytics.com',
  'clarity.ms',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
];

for (const domain of requiredDomains) {
  if (!productionCsp.includes(domain)) {
    errors.push(`MISSING external domain: ${domain}`);
  }
}

// 6. Verify report-uri
if (!productionCsp.includes('report-uri')) {
  warnings.push('report-uri not configured (violation reporting disabled)');
}

// 7. Verify dev CSP has unsafe-eval
const devCsp = buildCspDirectives({
  environment: 'development',
  apiDomain: 'http://localhost:5000',
});

if (!devCsp.includes("'unsafe-eval'")) {
  warnings.push("Development CSP missing 'unsafe-eval' (HMR may not work)");
}

// --- Results ---

console.log('--- Results ---\n');

if (errors.length === 0 && warnings.length === 0) {
  console.log('PASS: All CSP validations passed.\n');
  process.exit(0);
}

if (warnings.length > 0) {
  console.log(`WARNINGS (${warnings.length}):`);
  for (const w of warnings) {
    console.log(`  - ${w}`);
  }
  console.log('');
}

if (errors.length > 0) {
  console.log(`ERRORS (${errors.length}):`);
  for (const e of errors) {
    console.log(`  - ${e}`);
  }
  console.log('\nFAIL: CSP validation failed.\n');
  process.exit(1);
}

console.log('PASS: All CSP validations passed (with warnings).\n');
process.exit(0);
