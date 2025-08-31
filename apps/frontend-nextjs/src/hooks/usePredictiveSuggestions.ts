/**
 * Hook para Sistema de Sugestões Preditivas
 * Integração com backend de análise preditiva
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useChat } from './useChat';

export interface PredictiveSuggestion {
  id: string;
  text: string;
  confidence: number;
  category: string;
  persona: string;
  contextMatch: string[];
}

export interface SuggestionContext {
  analyzedCategories: string[];
  queryPatterns: string[];
  urgencyLevel: 'normal' | 'high' | 'emergency';
  complexityIndicators: string[];
}

export interface UserContext {
  personaPreference: string;
  complexityPreference: string;
  medicalInterests: string[];
  interactionStats: {
    totalInteractions: number;
    satisfactionAverage: number;
    suggestionClickRate: number;
  };
}

interface PredictiveSuggestionsState {
  suggestions: PredictiveSuggestion[];
  context: SuggestionContext | null;
  userContext: UserContext | null;
  loading: boolean;
  error: string | null;
  lastQuery: string;
}

interface PredictiveSuggestionsHook extends PredictiveSuggestionsState {
  getSuggestions: (query: string, persona?: string) => Promise<void>;
  trackInteraction: (
    suggestionId: string,
    satisfactionScore?: number
  ) => Promise<void>;
  clearSuggestions: () => void;
  refreshUserContext: () => Promise<void>;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export function usePredictiveSuggestions(): PredictiveSuggestionsHook {
  const { sessionId, currentPersona } = useChat();
  
  const [state, setState] = useState<PredictiveSuggestionsState>({
    suggestions: [],
    context: null,
    userContext: null,
    loading: false,
    error: null,
    lastQuery: ''
  });

  // Debounce timer para evitar muitas requisições
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const suggestionsCache = useRef<Map<string, any>>(new Map());

  // Gerar chave de cache
  const getCacheKey = useCallback((query: string, persona: string) => {
    return `${query.toLowerCase().trim()}:${persona}:${sessionId}`;
  }, [sessionId]);

  // Obter sugestões do backend
  const getSuggestions = useCallback(async (
    query: string, 
    persona: string = currentPersona || 'mixed'
  ) => {
    if (!query.trim() || query.length < 3) {
      setState(prev => ({ ...prev, suggestions: [], error: null }));
      return;
    }

    // Verificar cache primeiro
    const cacheKey = getCacheKey(query, persona);
    const cached = suggestionsCache.current.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < 300000) { // 5 minutos
      setState(prev => ({
        ...prev,
        suggestions: cached.suggestions,
        context: cached.context,
        lastQuery: query,
        error: null
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch(`${API_BASE}/api/predictions/suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          session_id: sessionId,
          persona,
          max_suggestions: 3
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Atualizar cache
      suggestionsCache.current.set(cacheKey, {
        suggestions: data.suggestions || [],
        context: data.context || null,
        timestamp: Date.now()
      });

      setState(prev => ({
        ...prev,
        suggestions: data.suggestions || [],
        context: data.context || null,
        lastQuery: query,
        loading: false,
        error: null
      }));

    } catch (error) {
      console.error('Erro ao obter sugestões:', error);
      setState(prev => ({
        ...prev,
        suggestions: [],
        loading: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }));
    }
  }, [sessionId, currentPersona, getCacheKey]);

  // Versão com debounce para input do usuário
  const getSuggestionsDebounced = useCallback(async (query: string, persona?: string) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    return new Promise<void>((resolve) => {
      debounceTimer.current = setTimeout(async () => {
        await getSuggestions(query, persona);
        resolve();
      }, 500); // 500ms debounce
    });
  }, [getSuggestions]);

  // Registrar interação do usuário
  const trackInteraction = useCallback(async (
    suggestionId: string,
    satisfactionScore?: number
  ) => {
    try {
      const response = await fetch(`${API_BASE}/api/predictions/interaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          query: state.lastQuery,
          suggestions_shown: state.suggestions.map(s => s.id),
          selected_suggestion: suggestionId,
          persona_used: currentPersona || 'mixed',
          satisfaction_score: satisfactionScore
        })
      });

      if (!response.ok) {
        console.warn('Falha ao registrar interação:', response.statusText);
      }
    } catch (error) {
      console.error('Erro ao registrar interação:', error);
    }
  }, [sessionId, state.lastQuery, state.suggestions, currentPersona]);

  // Obter contexto do usuário
  const refreshUserContext = useCallback(async () => {
    if (!sessionId) return;

    try {
      const response = await fetch(`${API_BASE}/api/predictions/context/${sessionId}`);
      
      if (response.ok) {
        const data = await response.json();
        setState(prev => ({
          ...prev,
          userContext: data.context || null
        }));
      }
    } catch (error) {
      console.error('Erro ao obter contexto do usuário:', error);
    }
  }, [sessionId]);

  // Limpar sugestões
  const clearSuggestions = useCallback(() => {
    setState(prev => ({
      ...prev,
      suggestions: [],
      context: null,
      error: null,
      lastQuery: ''
    }));
    
    // Limpar debounce timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
  }, []);

  // Carregar contexto do usuário na inicialização
  useEffect(() => {
    if (sessionId) {
      refreshUserContext();
    }
  }, [sessionId, refreshUserContext]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return {
    ...state,
    getSuggestions: getSuggestionsDebounced,
    trackInteraction,
    clearSuggestions,
    refreshUserContext
  };
}

// Hook para analytics (admin)
export function usePredictiveAnalytics() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/predictions/analytics`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Erro ao obter analytics:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    analytics,
    loading,
    error,
    fetchAnalytics
  };
}

// Utility hooks
export function usePredictiveHealth() {
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);
  
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/predictions/health`);
        setIsHealthy(response.ok && response.status === 200);
      } catch {
        setIsHealthy(false);
      }
    };

    checkHealth();
    
    // Verificar a cada 5 minutos
    const interval = setInterval(checkHealth, 300000);
    return () => clearInterval(interval);
  }, []);

  return isHealthy;
}