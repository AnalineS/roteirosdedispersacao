/**
 * Hook especializado para gerenciamento de estado do chat
 * Utiliza useReducer para estado complexo e otimizações de performance
 */

import { useReducer, useCallback, useMemo } from 'react';

interface ChatState {
  loading: boolean;
  error: string | null;
  personaSwitchSuggestion: string | null;
  isOnline: boolean;
  retryCount: number;
  lastApiCallTime: number | null;
}

type ChatAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_PERSONA_SUGGESTION'; payload: string | null }
  | { type: 'SET_ONLINE_STATUS'; payload: boolean }
  | { type: 'INCREMENT_RETRY' }
  | { type: 'RESET_RETRY' }
  | { type: 'SET_LAST_API_CALL'; payload: number }
  | { type: 'RESET_STATE' };

const initialState: ChatState = {
  loading: false,
  error: null,
  personaSwitchSuggestion: null,
  isOnline: true,
  retryCount: 0,
  lastApiCallTime: null
};

function chatStateReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { 
        ...state, 
        error: action.payload,
        loading: false
      };
    
    case 'SET_PERSONA_SUGGESTION':
      return { ...state, personaSwitchSuggestion: action.payload };
    
    case 'SET_ONLINE_STATUS':
      return { 
        ...state, 
        isOnline: action.payload,
        error: action.payload ? null : state.error
      };
    
    case 'INCREMENT_RETRY':
      return { ...state, retryCount: state.retryCount + 1 };
    
    case 'RESET_RETRY':
      return { ...state, retryCount: 0 };
    
    case 'SET_LAST_API_CALL':
      return { ...state, lastApiCallTime: action.payload };
    
    case 'RESET_STATE':
      return initialState;
    
    default:
      return state;
  }
}

export function useChatState() {
  const [state, dispatch] = useReducer(chatStateReducer, initialState);

  // Actions otimizadas com useCallback
  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  const setPersonaSuggestion = useCallback((suggestion: string | null) => {
    dispatch({ type: 'SET_PERSONA_SUGGESTION', payload: suggestion });
  }, []);

  const setOnlineStatus = useCallback((isOnline: boolean) => {
    dispatch({ type: 'SET_ONLINE_STATUS', payload: isOnline });
  }, []);

  const incrementRetry = useCallback(() => {
    dispatch({ type: 'INCREMENT_RETRY' });
  }, []);

  const resetRetry = useCallback(() => {
    dispatch({ type: 'RESET_RETRY' });
  }, []);

  const setLastApiCall = useCallback((timestamp: number) => {
    dispatch({ type: 'SET_LAST_API_CALL', payload: timestamp });
  }, []);

  const resetState = useCallback(() => {
    dispatch({ type: 'RESET_STATE' });
  }, []);

  // Computed properties memoizadas
  const computedState = useMemo(() => ({
    canRetry: state.retryCount < 3,
    shouldShowError: state.error !== null && !state.loading,
    shouldShowRetry: state.error !== null && state.canRetry,
    timeSinceLastCall: state.lastApiCallTime 
      ? Date.now() - state.lastApiCallTime 
      : null,
    isRateLimited: state.timeSinceLastCall !== null && state.timeSinceLastCall < 1000
  }), [state]);

  return {
    // State
    ...state,
    ...computedState,
    
    // Actions
    setLoading,
    setError,
    setPersonaSuggestion,
    setOnlineStatus,
    incrementRetry,
    resetRetry,
    setLastApiCall,
    resetState
  };
}