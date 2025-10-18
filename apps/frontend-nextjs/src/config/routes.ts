/**
 * Route Configuration - Define public and protected routes
 * This configuration determines which pages require authentication
 */

// Public routes - accessible without authentication
export const PUBLIC_ROUTES = [
  '/',                      // Home page
  '/chat',                  // Educational assistants (Dr. Gasnelio & Gá)
  '/sobre',                 // About page
  '/sobre-a-tese',          // About the thesis
  '/metodologia',           // Methodology
  '/metodologia/detalhada', // Detailed methodology
  '/resources',             // Resources
  '/resources/calculator',  // Dose calculator
  '/resources/checklist',   // Checklist
  '/termos',                // Terms of service
  '/privacidade',           // Privacy policy
  '/acessibilidade',        // Accessibility
  '/conformidade',          // Compliance
  '/etica',                 // Ethics
  '/referencias',           // References
  '/glossario',             // Glossary
  '/cronograma',            // Timeline
  '/sitemap',               // Sitemap
  '/offline',               // Offline page
  '/vida-com-hanseniase',   // Living with leprosy

  // Auth-related pages (must be public for login flow)
  '/login',
  '/cadastro',
  '/esqueci-senha',
];

// Protected routes - require authentication
export const PROTECTED_ROUTES = [
  '/dashboard',
  '/profile',
  '/admin',
  '/admin/analytics',
  '/admin/analytics/master',
  '/progress',
  '/certificacao',
  '/notifications',
  '/modules',               // Educational modules listing
  '/modules/hanseniase',    // Leprosy module
  '/modules/diagnostico',   // Diagnosis module
  '/modules/tratamento',    // Treatment module
  '/modules/roteiro-dispensacao', // Dispensing guide
  '/modules/vida-com-doenca',     // Living with the disease
  '/modules/sobre-a-tese',        // About the thesis
];

// Route patterns for dynamic matching
export const PUBLIC_ROUTE_PATTERNS = [
  /^\/resources\/.*/, // All resource sub-pages
];

export const PROTECTED_ROUTE_PATTERNS = [
  /^\/admin\/.*/,    // All admin sub-pages
  /^\/modules\/.*/,  // All module sub-pages
];

/**
 * Check if a given path is a public route
 * @param path - The pathname to check
 * @returns true if the route is public, false if protected
 */
export function isPublicRoute(path: string): boolean {
  // Remove query parameters and hash
  const cleanPath = path.split('?')[0].split('#')[0];

  // Check exact matches first
  if (PUBLIC_ROUTES.includes(cleanPath)) {
    return true;
  }

  // Check pattern matches
  for (const pattern of PUBLIC_ROUTE_PATTERNS) {
    if (pattern.test(cleanPath)) {
      return true;
    }
  }

  // Check if it's explicitly protected
  if (PROTECTED_ROUTES.includes(cleanPath)) {
    return false;
  }

  // Check protected patterns
  for (const pattern of PROTECTED_ROUTE_PATTERNS) {
    if (pattern.test(cleanPath)) {
      return false;
    }
  }

  // Default to public for unknown routes to avoid blocking content
  return true;
}

/**
 * Check if a given path is a protected route
 * @param path - The pathname to check
 * @returns true if the route is protected, false if public
 */
export function isProtectedRoute(path: string): boolean {
  return !isPublicRoute(path);
}

/**
 * Get the redirect path after login based on intended destination
 * @param intendedPath - The path user was trying to access
 * @returns The appropriate redirect path
 */
export function getPostLoginRedirect(intendedPath?: string): string {
  // If no intended path or it was a login page, go to dashboard
  if (!intendedPath || intendedPath.startsWith('/login') ||
      intendedPath.startsWith('/cadastro') || intendedPath.startsWith('/esqueci-senha')) {
    return '/dashboard';
  }

  // If intended path is protected, go there
  if (isProtectedRoute(intendedPath)) {
    return intendedPath;
  }

  // Otherwise go to dashboard
  return '/dashboard';
}

/**
 * Check if authentication features should be shown for a route
 * @param path - The pathname to check
 * @returns true if auth UI elements should be shown
 */
export function shouldShowAuthUI(path: string): boolean {
  // Don't show auth UI on auth pages themselves
  const authPages = ['/login', '/cadastro', '/esqueci-senha'];
  const cleanPath = path.split('?')[0].split('#')[0];

  return !authPages.includes(cleanPath);
}