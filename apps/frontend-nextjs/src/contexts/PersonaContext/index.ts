/**
 * Index file for PersonaContext modules
 * Provides clean exports for all PersonaContext functionality
 */

// Main context and provider
export { PersonaProvider, usePersonaContext } from './PersonaContext';

// Specialized hooks
export {
  useCurrentPersona,
  usePersonaActions,
  usePersonaAnalytics
} from './PersonaContext';

// Types
export type {
  PersonaProviderProps,
  PersonaProviderConfig,
  PersonaResolutionResult,
  PersonaHistoryEntryInternal,
  PersonaSetterOptions,
  // Re-exported from types/personas
  PersonaContextValue,
  PersonaChangeEvent,
  PersonaSource,
  PersonaConfig,
  ValidPersonaId,
  PersonaHistoryEntry
} from './types';

// Utility functions (if needed externally)
export {
  getLocalStoragePersona,
  getMostUsedPersonaFromHistory,
  getFirstAvailablePersona,
  getPersonaConfigWithFallback,
  createAvailablePersonasRecord,
  addToPersonaHistory,
  calculateSessionDuration,
  determineErrorState
} from './utils';

// Analytics functions (if needed externally)
export {
  trackGtagEvent,
  trackPersonasLoaded,
  trackPersonaResolved,
  trackPersonaChangeStarted,
  trackPersonaChangeSuccess,
  trackPersonaChangeError,
  trackLocalStorageError,
  trackPersonaUnavailable,
  trackPersonaCleared,
  trackPersonaClearError,
  trackPersonasRefreshStarted,
  trackPersonasRefreshError,
  trackActivePersonaDebug,
  createPersonaChangeEventData
} from './analytics';