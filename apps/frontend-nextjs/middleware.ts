import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Environment detection for middleware (Edge Runtime compatible)
function detectEnvironment(request: NextRequest): 'development' | 'staging' | 'production' {
  // Priority 1: Environment variable
  const envVar = process.env.NEXT_PUBLIC_ENVIRONMENT;
  if (envVar === 'development' || envVar === 'staging' || envVar === 'production') {
    return envVar;
  }

  // Priority 2: Hostname detection
  const hostname = request.nextUrl.hostname;

  // Development patterns
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.local')) {
    return 'development';
  }

  // Staging patterns
  if (hostname.includes('hml-') || hostname.includes('staging') || hostname.includes('test')) {
    return 'staging';
  }

  // Production patterns (default)
  return 'production';
}

// Environment-aware API URL detection
function getApiUrlForEnvironment(environment: string): string {
  switch (environment) {
    case 'development':
      return process.env.NEXT_PUBLIC_API_URL_DEV || 'http://localhost:5000';
    case 'staging':
      return process.env.NEXT_PUBLIC_API_URL_STAGING ||
             'https://hml-api.roteirosdispensacao.com.br';
    case 'production':
      return process.env.NEXT_PUBLIC_API_URL_PRODUCTION ||
             'https://roteiro-dispensacao-api-4f2gjf6cua-uc.a.run.app';
    default:
      return 'http://localhost:5000';
  }
}

// Personas válidas
const VALID_PERSONAS = ['dr_gasnelio', 'ga'] as const;
type ValidPersona = typeof VALID_PERSONAS[number];

// Normalização de persona ID (mesma lógica do hook)
const normalizePersonaId = (personaId: string): ValidPersona | null => {
  const normalized = personaId.toLowerCase().trim();
  
  const aliases: Record<string, ValidPersona> = {
    'dr_gasnelio': 'dr_gasnelio',
    'gasnelio': 'dr_gasnelio',
    'dr.gasnelio': 'dr_gasnelio',
    'drgasnelio': 'dr_gasnelio',
    'technical': 'dr_gasnelio',
    'doctor': 'dr_gasnelio',
    'ga': 'ga',
    'empathetic': 'ga',
    'empathy': 'ga',
    'welcoming': 'ga'
  };
  
  return aliases[normalized] || null;
};

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  let response = NextResponse.next();

  // Detect environment
  const environment = detectEnvironment(request);
  const apiUrl = getApiUrlForEnvironment(environment);

  // Add environment info to headers for debugging (development only)
  if (environment === 'development') {
    response.headers.set('X-Environment', environment);
    response.headers.set('X-API-URL', apiUrl);
  }

  // === PERSONA URL HANDLING ===
  // Validar e normalizar parâmetros de persona para /chat
  if (url.pathname === '/chat') {
    const personaParam = url.searchParams.get('persona');

    if (personaParam) {
      const normalizedPersona = normalizePersonaId(personaParam);

      if (normalizedPersona) {
        // Se persona foi normalizada, redirecionar para URL limpa
        if (normalizedPersona !== personaParam) {
          url.searchParams.set('persona', normalizedPersona);
          response = NextResponse.redirect(url);
        }
      } else {
        // Persona inválida - remover parâmetro e redirecionar
        url.searchParams.delete('persona');
        response = NextResponse.redirect(url);
      }
    }
  }

  // === REDIRECT FROM HOME WITH PERSONA ===
  // Redirecionar seleções de persona da home para /chat
  if (url.pathname === '/' && url.searchParams.has('persona')) {
    const personaParam = url.searchParams.get('persona');
    const normalizedPersona = normalizePersonaId(personaParam || '');

    if (normalizedPersona) {
      const chatUrl = new URL('/chat', request.url);
      chatUrl.searchParams.set('persona', normalizedPersona);
      response = NextResponse.redirect(chatUrl);
    }
  }

  // === ENVIRONMENT-AWARE SECURITY HEADERS ===

  // Extract domain from API URL for CSP
  const apiDomain = new URL(apiUrl).origin;

  // Environment-aware Content Security Policy (CSP)
  const cspPolicies = [
    "default-src 'self'",
    environment === 'development'
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'" // Development needs eval for HMR
      : "script-src 'self' 'unsafe-inline'", // Production removes eval
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src 'self' ${apiDomain}` + (environment !== 'production' ? ' ws: wss:' : ''), // WebSocket for dev
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ];

  // Add upgrade-insecure-requests only for production/staging
  if (environment !== 'development') {
    cspPolicies.push("upgrade-insecure-requests");
  }

  const csp = cspPolicies.join('; ');

  response.headers.set('Content-Security-Policy', csp);

  // === ENVIRONMENT-AWARE SECURITY HEADERS ===

  // Core security headers (all environments)
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Environment-specific security configurations
  if (environment === 'development') {
    // Development: More permissive for debugging
    response.headers.set('X-XSS-Protection', '0'); // Disabled to avoid conflicts with dev tools
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  } else {
    // Staging & Production: Maximum security
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');

    // HSTS for HTTPS enforcement (medical data protection) - only production/staging
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );

    // Medical Application Specific Headers (production/staging only)
    response.headers.set('X-Medical-App', `hanseniase-pqtu-v1.0-${environment}`);
    response.headers.set('X-Privacy-Policy', 'LGPD-compliant');
    response.headers.set('X-Content-Type-Options', 'nosniff');

    // Additional production-only headers
    if (environment === 'production') {
      response.headers.set('X-Robots-Tag', 'noindex, nofollow'); // Medical app - no indexing
      response.headers.set('X-Frame-Options', 'DENY');
    }
  }

  // Environment-specific CORS handling
  if (environment === 'development') {
    // Allow development tools and local network access
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};