'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { knowledgeSearch, EnhancedMessage } from '@/services/knowledgeSearch';
import { astraClient, AstraResponse, AstraStats } from '@/services/astraClient';
import { SentimentResult } from '@/services/sentimentAnalysis';

interface UseKnowledgeBaseOptions {
  prefetchCommon?: boolean;
  autoEnrich?: boolean;
  cacheTimeout?: number;
}

interface UseKnowledgeBaseReturn {
  // Estado
  isSearching: boolean;
  lastSearchResult: AstraResponse | null;
  stats: AstraStats | null;
  error: string | null;
  
  // Métodos
  searchKnowledge: (question: string, sentiment?: SentimentResult, persona?: string) => Promise<AstraResponse>;
  enrichMessage: (message: string, sentiment?: SentimentResult, persona?: string) => Promise<EnhancedMessage>;
  rateResponse: (query: string, response: string, rating: number, comments?: string) => Promise<void>;
  refreshStats: () => Promise<void>;
  clearCache: () => void;
}

export function useKnowledgeBase(options: UseKnowledgeBaseOptions = {}): UseKnowledgeBaseReturn {
  const {
    prefetchCommon = true,
    autoEnrich = true,
    cacheTimeout = 5 * 60 * 1000 // 5 minutos
  } = options;
  
  const [isSearching, setIsSearching] = useState(false);
  const [lastSearchResult, setLastSearchResult] = useState<AstraResponse | null>(null);
  const [stats, setStats] = useState<AstraStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Prefetch tópicos comuns na inicialização
  useEffect(() => {
    if (prefetchCommon) {
      knowledgeSearch.prefetchCommonTopics()
        .catch(err => console.error('Erro no prefetch:', err));
    }
    
    // Buscar estatísticas iniciais
    refreshStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefetchCommon]);
  
  /**
   * Busca conhecimento relevante
   */
  const searchKnowledge = useCallback(async (
    question: string,
    sentiment?: SentimentResult,
    persona?: string
  ): Promise<AstraResponse> => {
    setIsSearching(true);
    setError(null);
    
    // Cancelar busca anterior se ainda estiver em andamento
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    try {
      const result = await knowledgeSearch.searchKnowledge(
        question,
        sentiment,
        persona,
        {
          maxChunks: 3,
          minConfidence: 0.3
        }
      );
      
      setLastSearchResult(result);
      
      // Log para analytics
      console.log('Knowledge search completed:', {
        question: question.substring(0, 50) + '...',
        confidence: result.confidence,
        chunks: result.chunks.length,
        cached: result.cached
      });
      
      return result;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar conhecimento';
      setError(errorMessage);
      console.error('Erro na busca de conhecimento:', err);
      
      // Retornar resultado vazio em caso de erro
      const emptyResult: AstraResponse = {
        chunks: [],
        combined_context: '',
        confidence: 0,
        cached: false,
        processing_time: 0
      };
      
      setLastSearchResult(emptyResult);
      return emptyResult;
      
    } finally {
      setIsSearching(false);
    }
  }, []);
  
  /**
   * Enriquece mensagem com contexto
   */
  const enrichMessage = useCallback(async (
    message: string,
    sentiment?: SentimentResult,
    persona?: string
  ): Promise<EnhancedMessage> => {
    if (!autoEnrich) {
      return {
        original: message,
        enriched: message,
        confidence: 0,
        sources: []
      };
    }
    
    try {
      const enriched = await knowledgeSearch.enrichMessage(
        message,
        sentiment,
        persona
      );
      
      return enriched;
      
    } catch (err) {
      console.error('Erro ao enriquecer mensagem:', err);
      
      return {
        original: message,
        enriched: message,
        confidence: 0,
        sources: []
      };
    }
  }, [autoEnrich]);
  
  /**
   * Avalia qualidade da resposta
   */
  const rateResponse = useCallback(async (
    query: string,
    response: string,
    rating: number,
    comments?: string
  ): Promise<void> => {
    try {
      await astraClient.sendFeedback({
        query,
        response,
        rating,
        comments
      });
      
      // Atualizar estatísticas após feedback
      setTimeout(() => refreshStats(), 1000);
      
    } catch (err) {
      console.error('Erro ao enviar avaliação:', err);
      setError('Erro ao enviar avaliação');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  /**
   * Atualiza estatísticas
   */
  const refreshStats = useCallback(async () => {
    try {
      const newStats = await astraClient.getStats();
      setStats(newStats);
    } catch (err) {
      console.error('Erro ao buscar estatísticas:', err);
    }
  }, []);
  
  /**
   * Limpa o cache
   */
  const clearCache = useCallback(() => {
    astraClient.clearCache();
    setLastSearchResult(null);
    console.log('Cache de conhecimento limpo');
  }, []);
  
  // Limpar timeout ao desmontar
  useEffect(() => {
    const timeoutRef = searchTimeoutRef.current;
    return () => {
      if (timeoutRef) {
        clearTimeout(timeoutRef);
      }
    };
  }, []);
  
  return {
    isSearching,
    lastSearchResult,
    stats,
    error,
    searchKnowledge,
    enrichMessage,
    rateResponse,
    refreshStats,
    clearCache
  };
}

/**
 * Hook para busca de conhecimento em tempo real
 */
export function useRealtimeKnowledge(
  query: string,
  options?: {
    sentiment?: SentimentResult;
    persona?: string;
    debounceMs?: number;
    enabled?: boolean;
  }
): AstraResponse | null {
  const { searchKnowledge, lastSearchResult } = useKnowledgeBase();
  const [result, setResult] = useState<AstraResponse | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const {
    sentiment,
    persona,
    debounceMs = 500,
    enabled = true
  } = options || {};
  
  useEffect(() => {
    if (!enabled || !query || query.trim().length < 5) {
      setResult(null);
      return;
    }
    
    // Cancelar busca anterior
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Agendar nova busca
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const searchResult = await searchKnowledge(query, sentiment, persona);
        setResult(searchResult);
      } catch (error) {
        console.error('Erro na busca em tempo real:', error);
        setResult(null);
      }
    }, debounceMs);
    
    // Cleanup
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, sentiment, persona, debounceMs, enabled, searchKnowledge]);
  
  return result || lastSearchResult;
}