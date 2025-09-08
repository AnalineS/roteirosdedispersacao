'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { knowledgeSearch, EnhancedMessage } from '@/services/knowledgeSearch';
// Removed astraClient import as it was deleted
import { SentimentResult } from '@/services/sentimentAnalysis';

// Compatible RAGResponse interface
interface RAGResponse {
  chunks: Array<{ content: string; score: number; section: string }>;
  combined_context: string;
  confidence: number;
  sources: string[];
  cached: boolean;
  processing_time: number;
  documents?: any[];
  query?: string;
}

interface RAGStats {
  totalQueries: number;
  avgResponseTime: number;
  cacheHitRate: number;
  avgRelevance?: number;
}

interface UseKnowledgeBaseOptions {
  prefetchCommon?: boolean;
  autoEnrich?: boolean;
  cacheTimeout?: number;
}

interface UseKnowledgeBaseReturn {
  // Estado
  isSearching: boolean;
  lastSearchResult: RAGResponse | null;
  stats: RAGStats | null;
  error: string | null;
  
  // Métodos
  searchKnowledge: (question: string, sentiment?: SentimentResult, persona?: string) => Promise<RAGResponse>;
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
  const [lastSearchResult, setLastSearchResult] = useState<RAGResponse | null>(null);
  const [stats, setStats] = useState<RAGStats | null>(null);
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
  ): Promise<RAGResponse> => {
    setIsSearching(true);
    setError(null);
    
    // Cancelar busca anterior se ainda estiver em andamento
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    try {
      const astraResult = await knowledgeSearch.searchKnowledge(
        question,
        sentiment,
        persona,
        {
          maxChunks: 3,
          minConfidence: 0.3
        }
      );
      
      // Convert AstraResponse to RAGResponse format
      const ragResult: RAGResponse = {
        chunks: astraResult.chunks.map(chunk => ({
          content: chunk.content,
          score: chunk.score,
          section: chunk.section
        })),
        combined_context: astraResult.combined_context,
        confidence: astraResult.confidence,
        sources: astraResult.chunks.map(chunk => chunk.section),
        cached: astraResult.cached,
        processing_time: astraResult.processing_time
      };
      
      setLastSearchResult(ragResult);
      
      // Log para analytics
      console.log('Knowledge search completed:', {
        question: question.substring(0, 50) + '...',
        confidence: ragResult.confidence,
        chunks: ragResult.chunks.length,
        cached: ragResult.cached
      });
      
      return ragResult;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao buscar conhecimento';
      setError(errorMessage);
      console.error('Erro na busca de conhecimento:', err);
      
      // Retornar resultado vazio em caso de erro
      const emptyResult: RAGResponse = {
        chunks: [],
        combined_context: '',
        confidence: 0,
        sources: [],
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
      // TODO: Implement feedback system with new RAG infrastructure
      console.log('Feedback recorded:', { query, response, rating, comments });
      
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
      // TODO: Implement stats gathering with new RAG infrastructure
      const initialStats: RAGStats = {
        totalQueries: 0,
        avgResponseTime: 0,
        cacheHitRate: 0
      };
      setStats(initialStats);
    } catch (err) {
      console.error('Erro ao buscar estatísticas:', err);
    }
  }, []);
  
  /**
   * Limpa o cache
   */
  const clearCache = useCallback(() => {
    // TODO: Implement cache clearing with new RAG infrastructure
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
): RAGResponse | null {
  const { searchKnowledge, lastSearchResult } = useKnowledgeBase();
  const [result, setResult] = useState<RAGResponse | null>(null);
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