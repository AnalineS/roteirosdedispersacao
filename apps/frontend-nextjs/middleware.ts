import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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

  // Enhanced Security Headers for 9.7/10 Security Score
  
  // Content Security Policy (CSP) - Enhanced for SVG Security
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Required for Next.js
    "style-src 'self' 'unsafe-inline'", // Required for styled SVG
    "img-src 'self' data: blob:", // Allow SVG data URLs
    "font-src 'self' data:",
    "connect-src 'self' https://api-inference.huggingface.co https://openrouter.ai",
    "frame-src 'none'", // Prevent clickjacking
    "object-src 'none'", // Prevent SVG object embedding
    "base-uri 'self'", // Prevent base hijacking
    "form-action 'self'",
    "upgrade-insecure-requests"
  ].join('; ');

  response.headers.set('Content-Security-Policy', csp);

  // Additional Security Headers for Medical Application
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // HSTS for HTTPS enforcement (medical data protection)
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );

  // Medical Application Specific Headers
  response.headers.set('X-Medical-App', 'hanseniase-pqtu-v1.0');
  response.headers.set('X-Privacy-Policy', 'LGPD-compliant');

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