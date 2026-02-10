/**
 * Shared HTML sanitization utility using DOMPurify
 * SSR-safe: returns empty string on server-side instead of unsanitized HTML
 */

let DOMPurifyInstance: { sanitize: (html: string) => string } | null = null;

function getDOMPurify(): typeof DOMPurifyInstance {
  if (typeof window === 'undefined') return null;
  if (DOMPurifyInstance) return DOMPurifyInstance;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    DOMPurifyInstance = require('dompurify');
    return DOMPurifyInstance;
  } catch {
    return null;
  }
}

/**
 * Sanitize HTML string using DOMPurify.
 * Returns empty string if DOMPurify is unavailable (SSR or load failure).
 * Never returns unsanitized HTML.
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';
  const purify = getDOMPurify();
  if (!purify) return '';
  return purify.sanitize(html);
}
