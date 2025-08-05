'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { sentimentAnalyzer, SentimentResult, SentimentCategory } from '@/services/sentimentAnalysis';

interface SentimentHistory {
  timestamp: number;
  text: string;
  result: SentimentResult;
}

interface UseSentimentAnalysisOptions {
  debounceMs?: number;
  maxHistorySize?: number;
  autoAnalyze?: boolean;
}

interface UseSentimentAnalysisReturn {
  currentSentiment: SentimentResult | null;
  sentimentHistory: SentimentHistory[];
  analyzeSentiment: (text: string) => Promise<SentimentResult>;
  clearHistory: () => void;
  isAnalyzing: boolean;
  averageSentiment: {
    score: number;
    category: SentimentCategory;
  } | null;
}

export function useSentimentAnalysis(
  options: UseSentimentAnalysisOptions = {}
): UseSentimentAnalysisReturn {
  const {
    debounceMs = 500,
    maxHistorySize = 10,
    autoAnalyze = true
  } = options;
  
  const [currentSentiment, setCurrentSentiment] = useState<SentimentResult | null>(null);
  const [sentimentHistory, setSentimentHistory] = useState<SentimentHistory[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastAnalyzedTextRef = useRef<string>('');
  
  /**
   * Analisa o sentimento de um texto
   */
  const analyzeSentiment = useCallback(async (text: string): Promise<SentimentResult> => {
    // Ignorar textos vazios ou muito curtos
    if (!text || text.trim().length < 3) {
      const emptyResult: SentimentResult = {
        score: 0,
        magnitude: 0,
        category: SentimentCategory.NEUTRAL,
        confidence: 0,
        keywords: []
      };
      setCurrentSentiment(emptyResult);
      return emptyResult;
    }
    
    // Evitar reanálise do mesmo texto
    if (text === lastAnalyzedTextRef.current && currentSentiment) {
      return currentSentiment;
    }
    
    setIsAnalyzing(true);
    
    try {
      const result = await sentimentAnalyzer.analyze(text);
      
      setCurrentSentiment(result);
      lastAnalyzedTextRef.current = text;
      
      // Adicionar ao histórico
      setSentimentHistory(prev => {
        const newEntry: SentimentHistory = {
          timestamp: Date.now(),
          text: text.substring(0, 100), // Limitar tamanho para privacidade
          result
        };
        
        const updated = [newEntry, ...prev];
        return updated.slice(0, maxHistorySize);
      });
      
      return result;
    } catch (error) {
      console.error('Erro ao analisar sentimento:', error);
      
      // Retornar resultado neutro em caso de erro
      const errorResult: SentimentResult = {
        score: 0,
        magnitude: 0,
        category: SentimentCategory.NEUTRAL,
        confidence: 0,
        keywords: []
      };
      
      setCurrentSentiment(errorResult);
      return errorResult;
    } finally {
      setIsAnalyzing(false);
    }
  }, [currentSentiment, maxHistorySize]);
  
  /**
   * Versão com debounce da análise
   */
  const analyzeSentimentDebounced = useCallback((text: string) => {
    // Cancelar análise anterior
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Agendar nova análise
    debounceTimerRef.current = setTimeout(() => {
      analyzeSentiment(text);
    }, debounceMs);
  }, [analyzeSentiment, debounceMs]);
  
  /**
   * Limpar histórico
   */
  const clearHistory = useCallback(() => {
    setSentimentHistory([]);
    setCurrentSentiment(null);
    lastAnalyzedTextRef.current = '';
  }, []);
  
  /**
   * Calcular sentimento médio do histórico
   */
  const averageSentiment = sentimentHistory.length > 0
    ? (() => {
        const totalScore = sentimentHistory.reduce((sum, item) => sum + item.result.score, 0);
        const avgScore = totalScore / sentimentHistory.length;
        
        // Determinar categoria média
        let category: SentimentCategory;
        if (avgScore > 0.2) category = SentimentCategory.POSITIVE;
        else if (avgScore < -0.4) category = SentimentCategory.FRUSTRATED;
        else if (avgScore < -0.2) category = SentimentCategory.ANXIOUS;
        else category = SentimentCategory.NEUTRAL;
        
        return { score: avgScore, category };
      })()
    : null;
  
  // Cleanup
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);
  
  return {
    currentSentiment,
    sentimentHistory,
    analyzeSentiment,
    clearHistory,
    isAnalyzing,
    averageSentiment
  };
}

/**
 * Hook para monitorar sentimento em tempo real
 */
export function useRealtimeSentiment(
  text: string,
  options?: UseSentimentAnalysisOptions
): SentimentResult | null {
  const { currentSentiment, analyzeSentiment } = useSentimentAnalysis(options);
  
  useEffect(() => {
    if (text && text.trim().length >= 3) {
      analyzeSentiment(text);
    }
  }, [text, analyzeSentiment]);
  
  return currentSentiment;
}