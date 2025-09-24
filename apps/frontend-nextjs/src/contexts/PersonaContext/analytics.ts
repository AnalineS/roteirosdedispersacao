/**
 * Analytics helpers for PersonaContext
 * Extracted from PersonaContext.tsx for better organization
 */

import type {
  ValidPersonaId,
  PersonaSource,
  PersonaChangeEvent,
  PersonaConfig,
  WindowWithGtag
} from './types';

declare const window: WindowWithGtag;

/**
 * Track Google Analytics events with proper error handling
 */
export function trackGtagEvent(
  eventName: string,
  parameters: Record<string, unknown>
): void {
  if (typeof window !== 'undefined' && window.gtag) {
    try {
      window.gtag('event', eventName, {
        event_category: 'persona_context',
        ...parameters
      });
    } catch (error) {
      console.warn('Failed to track gtag event:', error);
    }
  }
}

/**
 * Track persona loading completion
 */
export function trackPersonasLoaded(personasCount: number): void {
  trackGtagEvent('personas_loaded', {
    event_label: 'context_initialization',
    persona_context: 'personas_loaded',
    personas_count: personasCount
  });
}

/**
 * Track persona resolution
 */
export function trackPersonaResolved(
  resolvedPersona: ValidPersonaId | null,
  source: PersonaSource,
  confidence: number
): void {
  trackGtagEvent('persona_resolved', {
    event_label: 'persona_resolution',
    persona_context: 'persona_resolved',
    resolved_persona: String(resolvedPersona),
    source: String(source),
    confidence: Number(confidence)
  });
}

/**
 * Track persona change start
 */
export function trackPersonaChangeStarted(
  previousPersona: ValidPersonaId | null,
  newPersona: ValidPersonaId,
  source: PersonaSource
): void {
  trackGtagEvent('persona_change_started', {
    event_label: 'persona_change',
    persona_context: 'persona_change_started',
    previous_persona: String(previousPersona),
    new_persona: String(newPersona),
    source: String(source)
  });
}

/**
 * Track persona change success
 */
export function trackPersonaChangeSuccess(personaId: ValidPersonaId): void {
  trackGtagEvent('persona_change_success', {
    event_label: 'persona_change',
    persona_context: 'persona_change_success',
    persona_id: String(personaId)
  });
}

/**
 * Track persona change error
 */
export function trackPersonaChangeError(error: unknown): void {
  trackGtagEvent('persona_change_error', {
    event_label: 'persona_change_error',
    persona_context: 'persona_change_error',
    error_message: String(error)
  });
}

/**
 * Track localStorage errors
 */
export function trackLocalStorageError(
  context: 'localstorage_save_error_initial' | 'localstorage_save_error_setpersona' | 'localstorage_clear_error',
  error: unknown
): void {
  trackGtagEvent('persona_localstorage_error', {
    event_label: 'storage_error',
    persona_context: context,
    error_message: String(error)
  });
}

/**
 * Track persona unavailable events
 */
export function trackPersonaUnavailable(personaId: ValidPersonaId): void {
  trackGtagEvent('persona_unavailable', {
    event_label: 'validation_error',
    persona_context: 'persona_unavailable',
    persona_id: String(personaId)
  });
}

/**
 * Track persona cleared
 */
export function trackPersonaCleared(previousPersona: ValidPersonaId | null): void {
  trackGtagEvent('persona_cleared', {
    event_label: 'persona_clear',
    persona_context: 'persona_cleared',
    previous_persona: String(previousPersona)
  });
}

/**
 * Track persona clear error
 */
export function trackPersonaClearError(error: unknown): void {
  trackGtagEvent('persona_clear_error', {
    event_label: 'persona_clear_error',
    persona_context: 'persona_clear_error',
    error_message: String(error)
  });
}

/**
 * Track personas refresh events
 */
export function trackPersonasRefreshStarted(): void {
  trackGtagEvent('personas_refresh_started', {
    event_label: 'personas_refresh',
    persona_context: 'personas_refresh_started'
  });
}

export function trackPersonasRefreshError(error: unknown): void {
  trackGtagEvent('personas_refresh_error', {
    event_label: 'personas_refresh_error',
    persona_context: 'personas_refresh_error',
    error_message: String(error)
  });
}

/**
 * Track active persona for debugging
 */
export function trackActivePersonaDebug(currentPersona: ValidPersonaId): void {
  trackGtagEvent('active_persona_debug', {
    event_label: 'debug_info',
    persona_context: 'active_persona_debug',
    current_persona: String(currentPersona)
  });
}

/**
 * Create comprehensive analytics event data
 */
export function createPersonaChangeEventData(
  previousPersona: ValidPersonaId | null,
  personaId: ValidPersonaId,
  source: PersonaSource,
  sessionDuration: number,
  sessionId: string,
  userProfile: { type: string; focus: string } | undefined,
  config: PersonaConfig | null,
  personas: Record<string, any>,
  historyLength: number,
  wasRecommended: boolean
): PersonaChangeEvent['data'] & {
  personaConfig: {
    name?: string;
    target_audience?: string;
    expertise?: string[];
  };
  context: {
    totalPersonasAvailable: number;
    historyLength: number;
    wasRecommended: boolean;
    userAgent: string;
  };
} {
  return {
    from: previousPersona,
    to: personaId,
    source,
    timestamp: Date.now(),
    duration: sessionDuration,
    sessionId,
    userProfile: userProfile || { type: 'unknown', focus: 'unknown' },
    personaConfig: {
      name: config?.name,
      target_audience: config?.target_audience,
      expertise: config?.expertise
    },
    context: {
      totalPersonasAvailable: Object.keys(personas).length,
      historyLength,
      wasRecommended,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown'
    }
  };
}