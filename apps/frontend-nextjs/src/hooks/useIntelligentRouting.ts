/**
 * Hook para Roteamento Inteligente de Personas
 * Analisa perguntas e sugere a melhor persona para responder
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { analyzeQuestionRouting, isAmbiguousQuestion, getRoutingExplanation } from '@/services/intelligentRouting';
import type { RoutingAnalysis } from '@/services/intelligentRouting';
import type { Persona } from '@/services/api';

interface UseIntelligentRoutingOptions {
  enabled?: boolean;
  debounceMs?: number;
  minConfidenceThreshold?: number;
}

interface RoutingState {
  currentAnalysis: RoutingAnalysis | null;
  isAnalyzing: boolean;
  error: string | null;
  hasAnalyzed: boolean;
}

interface RoutingActions {
  analyzeQuestion: (question: string) => Promise<void>;
  acceptRecommendation: () => void;
  rejectRecommendation: (selectedPersonaId: string) => void;
  clearAnalysis: () => void;
  getExplanation: () => string;
}

export function useIntelligentRouting(
  personas: Record<string, Persona>,
  options: UseIntelligentRoutingOptions = {}
): RoutingState & RoutingActions & {
  isAmbiguous: () => boolean;
  getAnalytics: () => any;
  shouldShowRouting: () => boolean;
  getRecommendedPersona: () => Persona | null;
  getAlternatives: () => any[];
} {
  const {
    enabled = true,
    debounceMs = 800,
    minConfidenceThreshold = 0.4
  } = options;

  const [state, setState] = useState<RoutingState>({
    currentAnalysis: null,
    isAnalyzing: false,
    error: null,
    hasAnalyzed: false
  });

  const analysisTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastQuestionRef = useRef<string>('');
  const analyticsRef = useRef<{
    acceptedRecommendations: number;
    rejectedRecommendations: number;
    totalAnalyses: number;
  }>({
    acceptedRecommendations: 0,
    rejectedRecommendations: 0,
    totalAnalyses: 0
  });

  // Cleanup timeout ao desmontar
  useEffect(() => {
    return () => {
      if (analysisTimeoutRef.current) {
        clearTimeout(analysisTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Analisa uma pergunta para determinar roteamento
   */
  const analyzeQuestion = useCallback(async (question: string) => {
    if (!enabled || !question.trim() || Object.keys(personas).length === 0) {
      return;
    }

    const normalizedQuestion = question.trim();
    
    // Evitar análises redundantes
    if (normalizedQuestion === lastQuestionRef.current) {
      return;
    }

    lastQuestionRef.current = normalizedQuestion;

    // Limpar timeout anterior
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
    }

    // Debounce para evitar muitas análises
    analysisTimeoutRef.current = setTimeout(async () => {
      setState(prev => ({
        ...prev,
        isAnalyzing: true,
        error: null
      }));

      try {
        const analysis = await analyzeQuestionRouting(normalizedQuestion, personas);
        
        // Só mostrar recomendação se confiança for suficiente
        if (analysis.confidence >= minConfidenceThreshold) {
          setState(prev => ({
            ...prev,
            currentAnalysis: analysis,
            isAnalyzing: false,
            hasAnalyzed: true
          }));
          
          analyticsRef.current.totalAnalyses++;
        } else {
          // Confiança baixa - não mostrar roteamento automático
          setState(prev => ({
            ...prev,
            currentAnalysis: null,
            isAnalyzing: false,
            hasAnalyzed: true
          }));
        }
      } catch (error) {
        console.error('Erro na análise de roteamento:', error);
        setState(prev => ({
          ...prev,
          currentAnalysis: null,
          isAnalyzing: false,
          error: error instanceof Error ? error.message : 'Erro na análise',
          hasAnalyzed: true
        }));
      }
    }, debounceMs);
  }, [enabled, personas, minConfidenceThreshold, debounceMs]);

  /**
   * Aceita a recomendação de roteamento
   */
  const acceptRecommendation = useCallback(() => {
    if (state.currentAnalysis) {
      analyticsRef.current.acceptedRecommendations++;
      
      // Log para métricas (pode ser enviado para analytics)
      console.log('Routing recommendation accepted:', {
        personaId: state.currentAnalysis.recommendedPersonaId,
        confidence: state.currentAnalysis.confidence,
        scope: state.currentAnalysis.scope
      });
    }
  }, [state.currentAnalysis]);

  /**
   * Rejeita a recomendação e seleciona outra persona
   */
  const rejectRecommendation = useCallback((selectedPersonaId: string) => {
    if (state.currentAnalysis) {
      analyticsRef.current.rejectedRecommendations++;
      
      // Log para métricas e melhoria do algoritmo
      console.log('Routing recommendation rejected:', {
        recommended: state.currentAnalysis.recommendedPersonaId,
        selected: selectedPersonaId,
        confidence: state.currentAnalysis.confidence,
        scope: state.currentAnalysis.scope,
        reasoning: state.currentAnalysis.reasoning
      });
    }
    
    // Limpar análise atual
    setState(prev => ({
      ...prev,
      currentAnalysis: null
    }));
  }, [state.currentAnalysis]);

  /**
   * Limpa a análise atual
   */
  const clearAnalysis = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentAnalysis: null,
      error: null,
      hasAnalyzed: false
    }));
    lastQuestionRef.current = '';
    
    if (analysisTimeoutRef.current) {
      clearTimeout(analysisTimeoutRef.current);
    }
  }, []);

  /**
   * Obtém explicação detalhada da recomendação
   */
  const getExplanation = useCallback((): string => {
    if (!state.currentAnalysis) {
      return 'Nenhuma análise disponível';
    }

    return getRoutingExplanation(state.currentAnalysis, personas);
  }, [state.currentAnalysis, personas]);

  /**
   * Verifica se a pergunta é ambígua
   */
  const isAmbiguous = useCallback((): boolean => {
    return state.currentAnalysis ? isAmbiguousQuestion(state.currentAnalysis) : false;
  }, [state.currentAnalysis]);

  /**
   * Obtém métricas de uso
   */
  const getAnalytics = useCallback(() => {
    const analytics = analyticsRef.current;
    const acceptanceRate = analytics.totalAnalyses > 0 
      ? (analytics.acceptedRecommendations / analytics.totalAnalyses) * 100 
      : 0;

    return {
      ...analytics,
      acceptanceRate: Math.round(acceptanceRate)
    };
  }, []);

  /**
   * Verifica se deve mostrar o roteamento
   */
  const shouldShowRouting = useCallback((): boolean => {
    return !!(
      state.currentAnalysis && 
      state.currentAnalysis.confidence >= minConfidenceThreshold &&
      !state.isAnalyzing
    );
  }, [state.currentAnalysis, state.isAnalyzing, minConfidenceThreshold]);

  /**
   * Obtém persona recomendada
   */
  const getRecommendedPersona = useCallback((): Persona | null => {
    if (!state.currentAnalysis) return null;
    return personas[state.currentAnalysis.recommendedPersonaId] || null;
  }, [state.currentAnalysis, personas]);

  /**
   * Obtém alternativas disponíveis
   */
  const getAlternatives = useCallback(() => {
    if (!state.currentAnalysis) return [];
    
    return state.currentAnalysis.alternatives
      .filter(alt => personas[alt.personaId])
      .map(alt => ({
        ...alt,
        persona: personas[alt.personaId]
      }));
  }, [state.currentAnalysis, personas]);

  return {
    // Estado
    currentAnalysis: state.currentAnalysis,
    isAnalyzing: state.isAnalyzing,
    error: state.error,
    hasAnalyzed: state.hasAnalyzed,
    
    // Ações
    analyzeQuestion,
    acceptRecommendation,
    rejectRecommendation,
    clearAnalysis,
    getExplanation,
    
    // Métodos auxiliares
    isAmbiguous,
    getAnalytics,
    shouldShowRouting,
    getRecommendedPersona,
    getAlternatives
  };
}