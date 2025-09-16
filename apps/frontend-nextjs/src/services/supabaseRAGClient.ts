/**
 * Supabase RAG Client - Interface frontend para sistema RAG
 * Integra frontend Next.js com backend RAG Supabase
 */

import { ragCache } from './simpleCache';

export interface RAGQuery {
  query: string;
  persona: 'dr_gasnelio' | 'ga';
  maxChunks?: number;
  useCache?: boolean;
  enhanceWithLLM?: boolean;
}

export interface RAGChunk {
  content: string;
  score: number;
  weightedScore: number;
  source: string;
  category: string;
  priority: number;
}

export interface RAGContext {
  chunks: RAGChunk[];
  totalScore: number;
  sourceFiles: string[];
  chunkTypes: string[];
  confidenceLevel: 'high' | 'medium' | 'low';
  metadata: {
    query: string;
    searchTimeMs: number;
    similarityThreshold: number;
    chunksFound: number;
  };
}

export interface RAGResponse {
  answer: string;
  context: RAGContext;
  persona: string;
  qualityScore: number;
  sources: string[];
  limitations: string[];
  generatedAt: string;
  processingTimeMs: number;
  cached?: boolean;
  enhanced?: boolean;
  documents?: any[];
  query?: string;
}

export interface RAGStats {
  queriesProcessed: number;
  cacheHits: number;
  supabaseSearches: number;
  avgContextScore: number;
  avgRelevance?: number;
  scopeViolations: number;
  availableComponents: {
    vectorStore: boolean;
    cache: boolean;
    searchEngine: boolean;
    openrouter: boolean;
  };
}

export class SupabaseRAGClient {
  private static instance: SupabaseRAGClient;
  private baseUrl: string;
  private apiKey: string | null = null;
  private cache = ragCache;
  private stats: Partial<RAGStats> = {
    queriesProcessed: 0,
    cacheHits: 0,
    supabaseSearches: 0,
    avgContextScore: 0.0,
    scopeViolations: 0
  };

  private constructor() {
    // Configurar baseUrl baseado no ambiente
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    this.apiKey = process.env.NEXT_PUBLIC_RAG_API_KEY || null;
  }

  static getInstance(): SupabaseRAGClient {
    if (!SupabaseRAGClient.instance) {
      SupabaseRAGClient.instance = new SupabaseRAGClient();
    }
    return SupabaseRAGClient.instance;
  }

  /**
   * Query principal do sistema RAG
   */
  async query(ragQuery: RAGQuery): Promise<RAGResponse | null> {
    const startTime = Date.now();

    try {
      // Cache key para queries
      const cacheKey = `rag_query:${this.hashQuery(ragQuery)}`;
      
      // Tentar cache primeiro se habilitado
      if (ragQuery.useCache !== false) {
        const cached = await this.cache.get(cacheKey) as RAGResponse | null;
        if (cached) {
          this.stats.cacheHits = (this.stats.cacheHits || 0) + 1;
          return cached;
        }
      }

      // Fazer query no backend
      const response = await this.makeRAGRequest<RAGResponse>('/api/rag/query', {
        query: ragQuery.query,
        persona: ragQuery.persona,
        max_chunks: ragQuery.maxChunks || 3,
        enhance_with_openrouter: ragQuery.enhanceWithLLM !== false
      });

      if (response) {
        // Cachear resposta se for de boa qualidade
        if (response.qualityScore >= 0.6) {
          await this.cache.set(cacheKey, response, 30 * 60 * 1000); // 30 minutos
        }

        this.stats.queriesProcessed = (this.stats.queriesProcessed || 0) + 1;
        this.stats.supabaseSearches = (this.stats.supabaseSearches || 0) + 1;

        response.processingTimeMs = Date.now() - startTime;
        return response;
      }

      return null;

    } catch (error) {
      console.error('Error in RAG query:', error);
      const errorObj = error instanceof Error ? error : new Error(String(error));
      return this.generateFallbackResponse(ragQuery, errorObj);
    }
  }

  /**
   * Busca semântica pura (sem geração)
   */
  async search(query: string, options?: {
    maxResults?: number;
    minScore?: number;
    chunkTypes?: string[];
  }): Promise<RAGContext | null> {
    try {
      const response = await this.makeRAGRequest<{context: RAGContext}>('/api/rag/search', {
        query,
        max_chunks: options?.maxResults || 5,
        min_score: options?.minScore || 0.7,
        chunk_types: options?.chunkTypes
      });

      return response?.context || null;

    } catch (error) {
      console.error('Error in RAG search:', error);
      return null;
    }
  }

  /**
   * Verifica se query está no escopo do sistema
   */
  async isInScope(query: string): Promise<{
    inScope: boolean;
    category: string;
    confidence: number;
  }> {
    try {
      const response = await this.makeRAGRequest<{
        inScope: boolean;
        category: string;
        confidence: number;
      }>('/api/rag/scope-check', { query });
      return response || { inScope: false, category: 'unknown', confidence: 0.0 };

    } catch (error) {
      console.error('Error checking scope:', error);
      return { inScope: false, category: 'unknown', confidence: 0.0 };
    }
  }

  /**
   * Estatísticas do sistema RAG
   */
  async getStats(): Promise<RAGStats | null> {
    try {
      const backendStats = await this.makeRAGRequest<Partial<RAGStats>>('/api/rag/stats');
      
      return {
        ...this.stats,
        ...backendStats,
        queriesProcessed: this.stats.queriesProcessed || 0,
        cacheHits: this.stats.cacheHits || 0,
        supabaseSearches: this.stats.supabaseSearches || 0,
        avgContextScore: backendStats?.avgContextScore || 0,
        scopeViolations: backendStats?.scopeViolations || 0,
        availableComponents: backendStats?.availableComponents || {
          vectorStore: false,
          cache: false,
          searchEngine: false,
          openrouter: false
        }
      } as RAGStats;

    } catch (error) {
      console.error('Error getting RAG stats:', error);
      return null;
    }
  }

  /**
   * Limpa cache do RAG
   */
  async clearCache(): Promise<boolean> {
    try {
      // Limpar cache local
      await this.cache.clear('rag_*');

      // Notificar backend para limpar cache
      await this.makeRAGRequest<{success: boolean}>('/api/rag/clear-cache', {}, { method: 'POST' });

      this.stats.cacheHits = 0;
      return true;

    } catch (error) {
      console.error('Error clearing RAG cache:', error);
      return false;
    }
  }

  /**
   * Health check do sistema RAG
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    components: Record<string, boolean>;
    message: string;
  }> {
    try {
      const response = await this.makeRAGRequest<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        components: Record<string, boolean>;
        message: string;
      }>('/api/rag/health');
      return response || {
        status: 'unhealthy',
        components: {},
        message: 'No response from backend'
      };

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return {
        status: 'unhealthy',
        components: {},
        message: `Backend unreachable: ${errorMsg}`
      };
    }
  }

  // MÉTODOS PRIVADOS

  private async makeRAGRequest<T = unknown>(
    endpoint: string, 
    data?: Record<string, unknown>, 
    options?: RequestInit
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const requestOptions: RequestInit = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {}),
      },
      body: data ? JSON.stringify(data) : undefined,
      ...options
    };

    const response = await fetch(url, requestOptions);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (result.success === false) {
      throw new Error(result.message || 'Backend returned error');
    }

    return result.data || result;
  }

  private hashQuery(ragQuery: RAGQuery): string {
    const queryString = JSON.stringify({
      query: ragQuery.query,
      persona: ragQuery.persona,
      maxChunks: ragQuery.maxChunks
    });
    
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < queryString.length; i++) {
      const char = queryString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private generateFallbackResponse(ragQuery: RAGQuery, error: Error): RAGResponse {
    const fallbackMessage = ragQuery.persona === 'dr_gasnelio'
      ? `**Dr. Gasnelio (Farmacêutico Clínico):**\n\nNo momento, nosso sistema de busca está temporariamente indisponível. Para questões sobre hanseníase e PQT, recomendo consultar:\n\n- Manual do Ministério da Saúde sobre hanseníase\n- Protocolo clínico e diretrizes terapêuticas\n- Consultar profissional de saúde especializado\n\n*Sistema será normalizado em breve.*`
      : `**Gá (Assistente Empático):**\n\nOi! Parece que estou com um probleminha técnico agora, mas não se preocupe!\n\nPara dúvidas sobre hanseníase e seus medicamentos, você pode:\n- Conversar com seu médico ou farmacêutico\n- Procurar a unidade de saúde mais próxima\n- Consultar materiais oficiais do Ministério da Saúde\n\nVou voltar ao normal em breve! 😊`;

    return {
      answer: fallbackMessage,
      context: {
        chunks: [],
        totalScore: 0,
        sourceFiles: [],
        chunkTypes: [],
        confidenceLevel: 'low',
        metadata: {
          query: ragQuery.query,
          searchTimeMs: 0,
          similarityThreshold: 0,
          chunksFound: 0
        }
      },
      persona: ragQuery.persona,
      qualityScore: 0.3,
      sources: [],
      limitations: ['Sistema RAG temporariamente indisponível', `Erro: ${error.message}`],
      generatedAt: new Date().toISOString(),
      processingTimeMs: 0,
      cached: false,
      enhanced: false
    };
  }
}

// Instância singleton
export const supabaseRAGClient = SupabaseRAGClient.getInstance();

// Funções de conveniência
export async function queryRAG(
  query: string,
  persona: 'dr_gasnelio' | 'ga' = 'dr_gasnelio',
  options?: Partial<RAGQuery>
): Promise<RAGResponse | null> {
  return supabaseRAGClient.query({
    query,
    persona,
    ...options
  });
}

export async function searchRAG(
  query: string,
  options?: {
    maxResults?: number;
    minScore?: number;
    chunkTypes?: string[];
  }
): Promise<RAGContext | null> {
  return supabaseRAGClient.search(query, options);
}

export async function checkRAGHealth(): Promise<boolean> {
  const health = await supabaseRAGClient.healthCheck();
  return health.status === 'healthy';
}

export default supabaseRAGClient;