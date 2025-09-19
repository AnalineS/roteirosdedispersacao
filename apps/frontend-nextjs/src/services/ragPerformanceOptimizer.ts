/**
 * RAG Performance Optimizer
 * Sistema de otimização de performance para RAG
 * Inclui caching inteligente, batch processing e otimizações de queries
 */

import { ragIntegrationService } from './ragIntegrationService';
import type { IntegratedRAGResponse } from './ragIntegrationService';
import { semanticSearchEngine } from './semanticSearchEngine';
import type { EnhancedSearchResult } from './semanticSearchEngine';
import { embeddingService } from './embeddingService';
import { ragCache } from './simpleCache';
import type { SearchResult as MedicalSearchResult } from './medicalKnowledgeBase';

// Global gtag type declaration
declare global {
  interface Window {
    gtag?: (
      command: 'event',
      eventName: string,
      parameters?: {
        event_category?: string;
        event_label?: string;
        value?: number;
        custom_parameters?: Record<string, unknown>;
      }
    ) => void;
  }
}

interface QueryOptions {
  maxResults?: number;
  threshold?: number;
  filters?: Record<string, unknown>;
  context?: string;
  maxChunks?: number;
  enhanceWithLLM?: boolean;
  categories?: string[];
}

interface RAGQueryResult {
  response: string;
  sources: string[];
  confidence: number;
  processingTime: number;
}

interface SearchResult {
  text: string;
  score: number;
  finalScore: number;
  source: string;
  metadata?: Record<string, unknown>;
}

interface QueueItem {
  query: string;
  persona: string;
  resolve: (result: RAGQueryResult) => void;
  reject: (error: Error) => void;
  timestamp: number;
}

interface QueryAnalysis {
  complexity: 'simple' | 'medium' | 'complex';
  medicalTerms: string[];
  categories: string[];
  requiresContext: boolean;
  confidence: number;
  intent: 'dosage' | 'safety' | 'procedure' | 'general';
  suggestedStrategy: 'direct' | 'enhanced' | 'fallback';
}

interface UsageAnalysis {
  commonQueries: string[];
  peakHours: number[];
  avgQueryComplexity: number;
  cacheEfficiency: number;
}

interface BottleneckItem {
  component: string;
  impact: 'low' | 'medium' | 'high';
  description: string;
  solution: string;
}

export interface PerformanceMetrics {
  avgQueryTime: number;
  cacheHitRate: number;
  embeddingTime: number;
  searchTime: number;
  processingTime: number;
  successRate: number;
  throughput: number; // queries per second
}

export interface OptimizationConfig {
  enableBatching: boolean;
  batchSize: number;
  batchTimeout: number; // ms
  enablePrefetch: boolean;
  prefetchThreshold: number;
  enableQueryOptimization: boolean;
  maxCacheSize: number;
  cacheStrategy: 'lru' | 'lfu' | 'ttl';
  enableParallelProcessing: boolean;
  maxParallelQueries: number;
}

export interface QueryOptimization {
  originalQuery: string;
  optimizedQuery: string;
  optimizationType: 'shortened' | 'expanded' | 'rewritten' | 'cached';
  expectedSpeedup: number;
  confidence: number;
}

export class RAGPerformanceOptimizer {
  private static instance: RAGPerformanceOptimizer;
  private metrics: PerformanceMetrics = {
    avgQueryTime: 0,
    cacheHitRate: 0,
    embeddingTime: 0,
    searchTime: 0,
    processingTime: 0,
    successRate: 0,
    throughput: 0
  };

  private config: OptimizationConfig = {
    enableBatching: true,
    batchSize: 5,
    batchTimeout: 100,
    enablePrefetch: true,
    prefetchThreshold: 0.8,
    enableQueryOptimization: true,
    maxCacheSize: 1000,
    cacheStrategy: 'lru',
    enableParallelProcessing: true,
    maxParallelQueries: 3
  };

  private queryQueue: QueueItem[] = [];

  private prefetchCache = new Map<string, RAGQueryResult>();
  private queryPatterns = new Map<string, number>();
  private processingQueue = new Set<string>();
  private batchTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.startPerformanceMonitoring();
  }

  static getInstance(): RAGPerformanceOptimizer {
    if (!RAGPerformanceOptimizer.instance) {
      RAGPerformanceOptimizer.instance = new RAGPerformanceOptimizer();
    }
    return RAGPerformanceOptimizer.instance;
  }

  /**
   * Query otimizada com todas as otimizações habilitadas
   */
  async optimizedQuery(
    query: string,
    persona: 'dr_gasnelio' | 'ga' = 'dr_gasnelio',
    options?: QueryOptions
  ): Promise<RAGQueryResult> {
    const startTime = Date.now();

    try {
      // 1. Otimização da query
      const optimization = await this.optimizeQuery(query);
      const finalQuery = optimization.optimizedQuery;

      // 2. Verificar prefetch cache
      const prefetchResult = this.checkPrefetchCache(finalQuery);
      if (prefetchResult) {
        this.updateMetrics(Date.now() - startTime, true, true);
        return prefetchResult;
      }

      // 3. Batching se habilitado
      if (this.config.enableBatching) {
        return this.addToBatch(finalQuery, persona, options);
      }

      // 4. Processamento paralelo se habilitado
      if (this.config.enableParallelProcessing) {
        return this.processWithParallel(finalQuery, persona, options);
      }

      // 5. Processamento direto
      const response = await ragIntegrationService.query(finalQuery, persona, options);
      const result = this.convertToRAGQueryResult(response, Date.now() - startTime);

      // 6. Prefetch para queries relacionadas
      if (this.config.enablePrefetch && result) {
        await this.prefetchRelatedQueries(finalQuery, result);
      }

      this.updateMetrics(Date.now() - startTime, true, false);
      return result;

    } catch (error) {
      this.updateMetrics(Date.now() - startTime, false, false);
      throw error;
    }
  }

  /**
   * Busca otimizada com cache inteligente
   */
  async optimizedSearch(
    query: string,
    options?: QueryOptions
  ): Promise<SearchResult[]> {
    const cacheKey = `search:${this.hashQuery(query, options)}`;
    
    // Verificar cache primeiro
    const cached = await ragCache.getCached(cacheKey);
    if (cached && Array.isArray(cached)) {
      this.metrics.cacheHitRate += 0.1;
      return cached as SearchResult[];
    }

    // Otimizar query para busca
    const optimizedQuery = await this.optimizeSearchQuery(query);
    
    // Executar busca
    const searchResults: EnhancedSearchResult[] = await semanticSearchEngine.search({
      text: optimizedQuery,
      ...options
    });

    // Converter EnhancedSearchResult[] para SearchResult[] local
    const results: SearchResult[] = searchResults.map((enhancedResult: EnhancedSearchResult) => {
      // EnhancedSearchResult extends SearchResult from medicalKnowledgeBase
      // que contém: document, chunk?, similarity, relevantSections, confidence
      return {
        text: enhancedResult.document?.content || '',
        score: enhancedResult.similarity || 0,
        finalScore: enhancedResult.finalScore,
        source: enhancedResult.document?.source || 'unknown',
        metadata: {
          document: enhancedResult.document,
          relevantSections: enhancedResult.relevantSections,
          matchedTerms: enhancedResult.matchedTerms
        }
      };
    });

    // Cachear resultado se for de qualidade
    if (results.length > 0) {
      const avgScore = results.reduce((sum, r) => sum + r.finalScore, 0) / results.length;
      if (avgScore > 0.6) {
        await ragCache.setCached(cacheKey, results, 30 * 60 * 1000); // 30 min
      }
    }

    return results;
  }

  /**
   * Processamento em lote de embeddings
   */
  async batchEmbeddings(texts: string[]): Promise<number[][]> {
    const { batchSize } = this.config;
    const results: number[][] = [];

    // Processar em lotes
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      
      const batchResult = await embeddingService.generateEmbeddings({
        texts: batch,
        useCache: true,
        batchSize
      });

      if (batchResult) {
        results.push(...batchResult.embeddings);
      }
    }

    return results;
  }

  /**
   * Otimização automática de configurações
   */
  async autoOptimize(): Promise<{
    previousConfig: OptimizationConfig;
    newConfig: OptimizationConfig;
    expectedImprovement: number;
  }> {
    const previousConfig = { ...this.config };
    const currentMetrics = { ...this.metrics };

    // Analisar padrões de uso
    const analysis = this.analyzeUsagePatterns();
    
    // Otimizar configurações baseado na análise
    const newConfig = this.generateOptimalConfig(analysis);
    
    // Calcular melhoria esperada
    const expectedImprovement = this.calculateExpectedImprovement(
      previousConfig, 
      newConfig, 
      currentMetrics
    );

    // Aplicar nova configuração
    this.config = newConfig;

    // Medical tracking: Auto-optimization completed
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'rag_auto_optimization_completed', {
        event_category: 'rag_performance',
        event_label: 'optimization_improvement',
        value: Math.round(expectedImprovement)
      });
    }

    return {
      previousConfig,
      newConfig,
      expectedImprovement
    };
  }

  /**
   * Relatório de performance detalhado
   */
  getPerformanceReport(): {
    metrics: PerformanceMetrics;
    config: OptimizationConfig;
    recommendations: string[];
    bottlenecks: Array<{
      component: string;
      impact: 'low' | 'medium' | 'high';
      description: string;
      solution: string;
    }>;
  } {
    const recommendations: string[] = [];
    const bottlenecks: BottleneckItem[] = [];

    // Analisar métricas e identificar problemas
    if (this.metrics.avgQueryTime > 2000) {
      bottlenecks.push({
        component: 'Query Processing',
        impact: 'high',
        description: 'Tempo de query muito alto (>2s)',
        solution: 'Ativar batching e otimização de queries'
      });
      recommendations.push('Reduzir tempo de processamento com batching');
    }

    if (this.metrics.cacheHitRate < 0.3) {
      bottlenecks.push({
        component: 'Caching',
        impact: 'medium',
        description: 'Taxa de cache hit baixa (<30%)',
        solution: 'Implementar prefetch inteligente'
      });
      recommendations.push('Melhorar estratégia de cache');
    }

    if (this.metrics.embeddingTime > this.metrics.avgQueryTime * 0.5) {
      bottlenecks.push({
        component: 'Embeddings',
        impact: 'high',
        description: 'Embeddings consumindo >50% do tempo total',
        solution: 'Usar cache de embeddings e processamento em lote'
      });
      recommendations.push('Otimizar geração de embeddings');
    }

    return {
      metrics: this.metrics,
      config: this.config,
      recommendations,
      bottlenecks
    };
  }

  /**
   * Configurar otimizador
   */
  configure(newConfig: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    // Medical tracking: RAG Performance Optimizer configured
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'rag_optimizer_configured', {
        event_category: 'rag_performance',
        event_label: 'optimizer_setup',
        custom_parameters: {
          batching_enabled: this.config.enableBatching,
          prefetch_enabled: this.config.enablePrefetch
        }
      });
    }
  }

  // MÉTODOS PRIVADOS

  /**
   * Converte IntegratedRAGResponse para RAGQueryResult
   */
  private convertToRAGQueryResult(response: IntegratedRAGResponse, processingTime: number): RAGQueryResult {
    return {
      response: response.answer,
      sources: response.sources,
      confidence: response.qualityScore,
      processingTime: processingTime || response.processingTimeMs || 0
    };
  }

  /**
   * Determina o intent baseado nos termos médicos e categorias
   */
  private determineIntent(medicalTerms: string[], categories: string[]): 'dosage' | 'safety' | 'procedure' | 'general' {
    // Palavras-chave para dosagem
    const dosageKeywords = ['dose', 'dosagem', 'mg', 'quantidade', 'administração'];
    // Palavras-chave para segurança
    const safetyKeywords = ['efeitos', 'colaterais', 'contraindicações', 'reações', 'adversas'];
    // Palavras-chave para procedimentos
    const procedureKeywords = ['como', 'protocolo', 'procedimento', 'tratamento', 'aplicar'];

    const allTerms = [...medicalTerms, ...categories].join(' ').toLowerCase();

    if (dosageKeywords.some(keyword => allTerms.includes(keyword))) {
      return 'dosage';
    }
    if (safetyKeywords.some(keyword => allTerms.includes(keyword))) {
      return 'safety';
    }
    if (procedureKeywords.some(keyword => allTerms.includes(keyword))) {
      return 'procedure';
    }

    return 'general';
  }

  private async optimizeQuery(query: string): Promise<QueryOptimization> {
    if (!this.config.enableQueryOptimization) {
      return {
        originalQuery: query,
        optimizedQuery: query,
        optimizationType: 'cached',
        expectedSpeedup: 1.0,
        confidence: 1.0
      };
    }

    // Análise da query - analyzeQuery retorna: { complexity, medicalTerms, categories, confidence }
    const baseAnalysis: {
      complexity: 'simple' | 'medium' | 'complex';
      medicalTerms: string[];
      categories: string[];
      confidence: number;
    } = semanticSearchEngine.analyzeQuery(query);

    const analysis: QueryAnalysis = {
      complexity: baseAnalysis.complexity,
      medicalTerms: baseAnalysis.medicalTerms,
      categories: baseAnalysis.categories,
      requiresContext: baseAnalysis.categories.length > 1 || baseAnalysis.medicalTerms.length > 2,
      confidence: baseAnalysis.confidence,
      intent: this.determineIntent(baseAnalysis.medicalTerms, baseAnalysis.categories),
      suggestedStrategy: 'direct'
    };
    
    let optimizedQuery = query;
    let optimizationType: QueryOptimization['optimizationType'] = 'cached';
    let expectedSpeedup = 1.0;

    // Otimização baseada na complexidade
    if (analysis.complexity === 'complex') {
      // Simplificar queries complexas
      optimizedQuery = this.simplifyQuery(query);
      optimizationType = 'shortened';
      expectedSpeedup = 1.3;
    } else if (analysis.complexity === 'simple' && analysis.medicalTerms.length === 0) {
      // Expandir queries muito simples
      optimizedQuery = await this.expandQuery(query);
      optimizationType = 'expanded';
      expectedSpeedup = 1.1;
    }

    // Reescrever queries com baixa confiança
    if (analysis.confidence < 0.6) {
      optimizedQuery = await this.rewriteQuery(query, analysis);
      optimizationType = 'rewritten';
      expectedSpeedup = 1.2;
    }

    return {
      originalQuery: query,
      optimizedQuery,
      optimizationType,
      expectedSpeedup,
      confidence: analysis.confidence
    };
  }

  private simplifyQuery(query: string): string {
    // Remover palavras desnecessárias e manter termos-chave
    const stopWords = ['como', 'que', 'qual', 'onde', 'quando', 'por favor', 'você', 'pode'];
    const words = query.split(' ').filter(word => 
      !stopWords.includes(word.toLowerCase()) && word.length > 2
    );
    
    return words.slice(0, 5).join(' '); // Limitar a 5 palavras-chave
  }

  private async expandQuery(query: string): Promise<string> {
    // Adicionar contexto médico para queries muito simples
    const medicalContext = ' hanseníase medicamento';
    return query + medicalContext;
  }

  private async rewriteQuery(query: string, analysis: QueryAnalysis): Promise<string> {
    // Reescrever query baseado no intent detectado
    if (analysis.intent === 'dosage') {
      return query + ' dose quantidade mg';
    } else if (analysis.intent === 'safety') {
      return query + ' efeitos colaterais contraindicações';
    } else if (analysis.intent === 'procedure') {
      return query + ' como fazer protocolo';
    }
    
    return query;
  }

  private async optimizeSearchQuery(query: string): Promise<string> {
    // Otimizar especificamente para busca semântica
    const medicalTerms = this.extractMedicalTerms(query);
    
    if (medicalTerms.length > 0) {
      // Priorizar termos médicos
      return medicalTerms.join(' ');
    }
    
    return query;
  }

  private extractMedicalTerms(query: string): string[] {
    const medicalPatterns = [
      /rifampicina?/gi,
      /dapsona/gi,
      /clofazimina/gi,
      /pqt[\-\s]?u?/gi,
      /hanseníase|hansen/gi,
      /dose|dosagem/gi
    ];

    const terms: string[] = [];
    medicalPatterns.forEach(pattern => {
      const matches = query.match(pattern);
      if (matches) {
        terms.push(...matches);
      }
    });

    return Array.from(new Set(terms));
  }

  private checkPrefetchCache(query: string): RAGQueryResult | null {
    const cacheKey = this.hashQuery(query);
    return this.prefetchCache.get(cacheKey) || null;
  }

  private async addToBatch(query: string, persona: string, options?: QueryOptions): Promise<RAGQueryResult> {
    return new Promise((resolve, reject) => {
      this.queryQueue.push({
        query,
        persona,
        resolve,
        reject,
        timestamp: Date.now()
      });

      // Processar lote se atingiu o tamanho ou timeout
      if (this.queryQueue.length >= this.config.batchSize) {
        this.processBatch();
      } else if (!this.batchTimer) {
        this.batchTimer = setTimeout(() => {
          this.processBatch();
        }, this.config.batchTimeout);
      }
    });
  }

  private async processBatch(): Promise<void> {
    if (this.queryQueue.length === 0) return;

    const batch = this.queryQueue.splice(0, this.config.batchSize);
    this.batchTimer = null;

    // Processar queries em paralelo
    const promises = batch.map(async (item) => {
      try {
        const response = await ragIntegrationService.query(item.query, item.persona as 'dr_gasnelio' | 'ga');
        const result = this.convertToRAGQueryResult(response, 0);
        item.resolve(result);
      } catch (error) {
        item.reject(error);
      }
    });

    await Promise.all(promises);
  }

  private async processWithParallel(query: string, persona: string, options?: QueryOptions): Promise<RAGQueryResult> {
    const queryId = this.hashQuery(query);
    
    // Verificar se já está sendo processada
    if (this.processingQueue.has(queryId)) {
      // Esperar resultado da query existente
      return this.waitForProcessing(queryId);
    }

    // Marcar como em processamento
    this.processingQueue.add(queryId);

    try {
      const response = await ragIntegrationService.query(query, persona as 'dr_gasnelio' | 'ga', options);
      const result = this.convertToRAGQueryResult(response, 0);

      // Cachear resultado
      this.prefetchCache.set(queryId, result);

      return result;
    } finally {
      this.processingQueue.delete(queryId);
    }
  }

  private async waitForProcessing(queryId: string): Promise<RAGQueryResult | undefined> {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        if (!this.processingQueue.has(queryId)) {
          clearInterval(checkInterval);
          resolve(this.prefetchCache.get(queryId));
        }
      }, 50);
    });
  }

  private async prefetchRelatedQueries(originalQuery: string, result: RAGQueryResult): Promise<void> {
    if (!this.config.enablePrefetch) return;

    try {
      // Gerar queries relacionadas baseadas no contexto
      const relatedQueries = this.generateRelatedQueries(originalQuery, result);
      
      // Prefetch em background
      Promise.all(relatedQueries.map(async (relatedQuery) => {
        const cacheKey = this.hashQuery(relatedQuery);
        if (!this.prefetchCache.has(cacheKey)) {
          try {
            const response = await ragIntegrationService.query(relatedQuery, 'dr_gasnelio');
            const prefetchResult = this.convertToRAGQueryResult(response, 0);
            this.prefetchCache.set(cacheKey, prefetchResult);
          } catch (error) {
            // Ignore prefetch errors
          }
        }
      }));

    } catch (error) {
      // Medical tracking: Prefetch error
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'rag_prefetch_error', {
          event_category: 'rag_performance',
          event_label: 'prefetch_failure',
          custom_parameters: {
            error_type: 'prefetch_error'
          }
        });
      }
    }
  }

  private generateRelatedQueries(originalQuery: string, result: RAGQueryResult): string[] {
    const related: string[] = [];
    
    // Baseado nas fontes do resultado
    if (result.sources && result.sources.length > 0) {
      const source = result.sources[0];
      if (source.includes('rifampicina')) {
        related.push('rifampicina efeitos colaterais', 'rifampicina dose');
      }
      if (source.includes('dapsona')) {
        related.push('dapsona contraindicações', 'dapsona administração');
      }
    }

    return related;
  }

  private analyzeUsagePatterns(): UsageAnalysis {
    return {
      commonQueries: Array.from(this.queryPatterns.keys()).slice(0, 10),
      peakHours: [9, 10, 14, 15], // Placeholder
      avgQueryComplexity: 2.3,
      cacheEfficiency: this.metrics.cacheHitRate
    };
  }

  private generateOptimalConfig(analysis: UsageAnalysis): OptimizationConfig {
    const newConfig = { ...this.config };

    // Ajustar baseado nos padrões de uso
    if (analysis.cacheEfficiency < 0.3) {
      newConfig.enablePrefetch = true;
      newConfig.prefetchThreshold = 0.6;
    }

    if (analysis.avgQueryComplexity > 3) {
      newConfig.enableQueryOptimization = true;
      newConfig.enableBatching = true;
      newConfig.batchSize = Math.min(10, this.config.batchSize + 2);
    }

    return newConfig;
  }

  private calculateExpectedImprovement(
    oldConfig: OptimizationConfig,
    newConfig: OptimizationConfig,
    metrics: PerformanceMetrics
  ): number {
    let improvement = 0;

    // Calcular melhoria baseada nas mudanças
    if (!oldConfig.enableBatching && newConfig.enableBatching) {
      improvement += 20; // 20% melhoria esperada
    }

    if (!oldConfig.enablePrefetch && newConfig.enablePrefetch) {
      improvement += 15; // 15% melhoria esperada
    }

    if (newConfig.batchSize > oldConfig.batchSize) {
      improvement += 5; // 5% adicional por batching maior
    }

    return Math.min(50, improvement); // Máximo 50% melhoria
  }

  private startPerformanceMonitoring(): void {
    setInterval(() => {
      this.calculateThroughput();
      this.cleanupCaches();
    }, 60000); // A cada minuto
  }

  private calculateThroughput(): void {
    // Implementar cálculo de throughput baseado em métricas recentes
    // Por enquanto placeholder
    this.metrics.throughput = this.metrics.avgQueryTime > 0 ? 1000 / this.metrics.avgQueryTime : 0;
  }

  private cleanupCaches(): void {
    // Limpar caches antigos baseado na estratégia configurada
    if (this.prefetchCache.size > this.config.maxCacheSize) {
      const entries = Array.from(this.prefetchCache.entries());
      
      if (this.config.cacheStrategy === 'lru') {
        // Remover entradas mais antigas
        const toRemove = entries.slice(0, entries.length - this.config.maxCacheSize);
        toRemove.forEach(([key]) => this.prefetchCache.delete(key));
      }
    }
  }

  private updateMetrics(responseTime: number, success: boolean, cached: boolean): void {
    const currentQueries = this.metrics.throughput || 1;
    
    this.metrics.avgQueryTime = 
      (this.metrics.avgQueryTime * (currentQueries - 1) + responseTime) / currentQueries;
    
    if (cached) {
      this.metrics.cacheHitRate = 
        (this.metrics.cacheHitRate * (currentQueries - 1) + 1) / currentQueries;
    }

    this.metrics.successRate = 
      (this.metrics.successRate * (currentQueries - 1) + (success ? 1 : 0)) / currentQueries;
  }

  private hashQuery(query: string, options?: QueryOptions): string {
    const combined = query + (options ? JSON.stringify(options) : '');
    let hash = 0;
    for (let i = 0; i < combined.length; i++) {
      const char = combined.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
}

// Instância singleton
export const ragPerformanceOptimizer = RAGPerformanceOptimizer.getInstance();

// Funções de conveniência
export async function optimizedRAGQuery(
  query: string,
  persona: 'dr_gasnelio' | 'ga' = 'dr_gasnelio',
  options?: QueryOptions
): Promise<RAGQueryResult> {
  return ragPerformanceOptimizer.optimizedQuery(query, persona, options);
}

export async function optimizedSemanticSearch(
  query: string,
  options?: QueryOptions
): Promise<SearchResult[]> {
  return ragPerformanceOptimizer.optimizedSearch(query, options);
}

export function getRAGPerformanceReport(): {
  metrics: PerformanceMetrics;
  config: OptimizationConfig;
  recommendations: string[];
  bottlenecks: BottleneckItem[];
} {
  return ragPerformanceOptimizer.getPerformanceReport();
}

export default ragPerformanceOptimizer;