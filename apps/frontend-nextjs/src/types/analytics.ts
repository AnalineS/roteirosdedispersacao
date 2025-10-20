/**
 * Unified Analytics Type Definitions
 * Declaração centralizada para evitar conflitos entre módulos
 */

// Common interfaces used across analytics modules
export interface OnboardingEventData {
  [key: string]: string | number | boolean;
}

// Unified gtag interface - suporta todos os casos de uso
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: unknown[];

    // UX tracking extensions
    trackCognitiveLoad?: (score: number, context: string) => void;
    trackMobileIssue?: (issueType: string, severity: number) => void;
    trackOnboardingEvent?: (action: string, step: number, data?: OnboardingEventData) => void;
    trackUXEvent?: (eventName: string, category: string, score?: number, parameters?: Record<string, unknown>) => void;
  }
}

// Export interface for type checking
export interface WindowWithGtag extends Window {
  gtag: NonNullable<Window['gtag']>;
}

// Helper para verificar se gtag está disponível
export function hasGtag(win: Window): win is WindowWithGtag {
  return typeof win.gtag === 'function';
}

// Type-safe gtag wrapper
export function safeGtag(
  command: 'event' | 'config',
  eventNameOrId: string,
  parameters?: Parameters<NonNullable<Window['gtag']>>[2]
): void {
  if (typeof window !== 'undefined' && hasGtag(window)) {
    window.gtag(command, eventNameOrId, parameters);
  }
}

export default {};