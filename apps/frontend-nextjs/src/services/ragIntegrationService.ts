/**
 * RAG Integration Service - Integração completa do sistema RAG
 * Conecta frontend com backend RAG, embeddings e knowledge base
 */

import { supabaseRAGClient, RAGResponse, RAGQuery } from './supabaseRAGClient';
import { medicalKnowledgeBase, SearchResult } from './medicalKnowledgeBase';
import { embeddingService } from './embeddingService';
import { firestoreCache } from './firestoreCache';
import { AnalyticsFirestoreCache } from './analyticsFirestoreCache';

export interface RAGIntegrationConfig {
  useLocalKnowledge: boolean;
  useSupabaseRAG: boolean;
  fallbackToLocal: boolean;
  cacheResults: boolean;
  enhancedMode: boolean;
}

export interface IntegratedRAGResponse extends RAGResponse {
  strategy: 'supabase' | 'local' | 'hybrid' | 'fallback';
  knowledgeSource: string;
  processingSteps: string[];
  debugInfo?: {
    localResults?: SearchResult[];
    supabaseAvailable?: boolean;
    cacheUsed?: boolean;
    embeddingTime?: number;
  };
}

export class RAGIntegrationService {
  private static instance: RAGIntegrationService;
  private config: RAGIntegrationConfig = {
    useLocalKnowledge: true,
    useSupabaseRAG: true,
    fallbackToLocal: true,
    cacheResults: true,
    enhancedMode: true
  };

  private stats = {
    totalQueries: 0,
    supabaseQueries: 0,
    localQueries: 0,
    hybridQueries: 0,
    fallbackQueries: 0,
    avgResponseTime: 0,
    successRate: 0
  };

  private constructor() {
    this.initializeService();
  }

  static getInstance(): RAGIntegrationService {
    if (!RAGIntegrationService.instance) {
      RAGIntegrationService.instance = new RAGIntegrationService();
    }
    return RAGIntegrationService.instance;
  }

  /**
   * Query principal - roteamento inteligente
   */
  async query(
    query: string, 
    persona: 'dr_gasnelio' | 'ga' = 'dr_gasnelio',
    options?: Partial<RAGQuery>
  ): Promise<IntegratedRAGResponse> {
    const startTime = Date.now();
    const processingSteps: string[] = [];
    let response: IntegratedRAGResponse;

    try {
      this.stats.totalQueries++;
      processingSteps.push('Iniciando query RAG integrada');

      // 1. Análise da query
      const queryAnalysis = await this.analyzeQuery(query);
      processingSteps.push(`Query analisada: ${queryAnalysis.complexity} complexity`);

      // 2. Estratégia de roteamento
      const strategy = this.determineStrategy(queryAnalysis);
      processingSteps.push(`Estratégia selecionada: ${strategy}`);

      // 3. Executar query baseado na estratégia
      switch (strategy) {
        case 'supabase':
          response = await this.executeSupabaseQuery(query, persona, options, processingSteps);
          this.stats.supabaseQueries++;
          break;

        case 'local':
          response = await this.executeLocalQuery(query, persona, processingSteps);
          this.stats.localQueries++;
          break;

        case 'hybrid':
          response = await this.executeHybridQuery(query, persona, options, processingSteps);
          this.stats.hybridQueries++;
          break;

        case 'fallback':
        default:
          response = await this.executeFallbackQuery(query, persona, processingSteps);
          this.stats.fallbackQueries++;
          break;
      }

      // 4. Pós-processamento
      response = await this.postProcessResponse(response, queryAnalysis, processingSteps);
      
      // 5. Cache e analytics
      await this.cacheAndTrack(query, response, strategy);

      // 6. Atualizar estatísticas
      const processingTime = Date.now() - startTime;
      this.updateStats(processingTime, true);
      
      response.processingTimeMs = processingTime;
      response.processingSteps = processingSteps;

      return response;

    } catch (error) {
      console.error('Error in RAG integration:', error);
      this.updateStats(Date.now() - startTime, false);
      
      return this.generateErrorResponse(query, persona, error, processingSteps);
    }
  }

  /**
   * Busca semântica simples
   */
  async search(
    query: string,
    options?: {
      maxResults?: number;
      categories?: string[];
      useEmbeddings?: boolean;
    }
  ): Promise<SearchResult[]> {
    const { maxResults = 10, categories = [], useEmbeddings = true } = options || {};

    try {
      // Tentar Supabase primeiro
      if (this.config.useSupabaseRAG) {
        const supabaseContext = await supabaseRAGClient.search(query, {
          maxResults,
          chunkTypes: categories
        });

        if (supabaseContext && supabaseContext.chunks.length > 0) {
          // Converter chunks do Supabase para SearchResult
          return supabaseContext.chunks.map(chunk => ({
            document: {
              id: `supabase_${chunk.source}`,
              title: chunk.source,
              content: chunk.content,
              category: chunk.category as any,
              priority: chunk.priority,
              source: 'Supabase RAG',
              lastUpdated: new Date().toISOString(),
              tags: [chunk.category]
            },
            similarity: chunk.score,
            relevantSections: [chunk.source],
            confidence: chunk.weightedScore
          }));
        }
      }

      // Fallback para knowledge base local
      return medicalKnowledgeBase.search(query, {
        categories,
        maxResults,
        useChunks: useEmbeddings
      });

    } catch (error) {
      console.error('Error in RAG search:', error);
      return [];
    }
  }

  /**
   * Configurar comportamento do serviço
   */
  configure(newConfig: Partial<RAGIntegrationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('RAG Integration configured:', this.config);
  }

  /**
   * Estatísticas do serviço
   */
  getStats() {
    return { 
      ...this.stats,
      config: this.config,
      components: {
        supabaseRAG: this.config.useSupabaseRAG,
        localKnowledge: this.config.useLocalKnowledge,
        embeddingService: embeddingService ? true : false
      }
    };
  }

  /**
   * Health check completo
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    components: Record<string, boolean>;
    recommendations: string[];
  }> {
    const components: Record<string, boolean> = {};
    const recommendations: string[] = [];

    try {
      // Testar Supabase RAG
      if (this.config.useSupabaseRAG) {
        const supabaseHealth = await supabaseRAGClient.healthCheck();
        components.supabaseRAG = supabaseHealth.status === 'healthy';
        
        if (!components.supabaseRAG) {
          recommendations.push('Verificar conectividade com Supabase');
        }
      }

      // Testar knowledge base local
      const localKnowledge = medicalKnowledgeBase.getStats();
      components.localKnowledge = localKnowledge.totalDocuments > 0;
      
      if (!components.localKnowledge) {
        recommendations.push('Inicializar knowledge base local');
      }

      // Testar embeddings
      const embeddingTest = await embeddingService.embedSingleText('teste');
      components.embeddingService = embeddingTest !== null;
      
      if (!components.embeddingService) {
        recommendations.push('Configurar serviço de embeddings');
      }

      // Determinar status geral
      const healthyComponents = Object.values(components).filter(Boolean).length;
      const totalComponents = Object.values(components).length;
      
      let status: 'healthy' | 'degraded' | 'unhealthy';
      if (healthyComponents === totalComponents) {
        status = 'healthy';
      } else if (healthyComponents >= totalComponents / 2) {
        status = 'degraded';
      } else {
        status = 'unhealthy';
      }

      return { status, components, recommendations };

    } catch (error) {
      return {
        status: 'unhealthy',
        components,
        recommendations: ['Erro no health check', ...recommendations]
      };
    }
  }

  // MÉTODOS PRIVADOS

  private async initializeService(): Promise<void> {
    try {
      // Inicializar knowledge base local
      if (this.config.useLocalKnowledge) {
        await medicalKnowledgeBase.getStats(); // Trigger lazy initialization
      }

      console.log('🧠 RAG Integration Service initialized');
    } catch (error) {
      console.error('Error initializing RAG Integration Service:', error);
    }
  }

  private async analyzeQuery(query: string): Promise<{
    complexity: 'simple' | 'medium' | 'complex';
    medicalTerms: string[];
    categories: string[];
    requiresContext: boolean;
  }> {
    const medicalTerms = this.extractMedicalTerms(query);
    const categories = this.detectCategories(query);
    
    let complexity: 'simple' | 'medium' | 'complex' = 'simple';
    if (medicalTerms.length > 2 || categories.length > 1) {
      complexity = 'medium';
    }
    if (query.split(' ').length > 10 || categories.length > 2) {
      complexity = 'complex';
    }

    return {
      complexity,
      medicalTerms,
      categories,
      requiresContext: complexity !== 'simple'
    };
  }

  private extractMedicalTerms(query: string): string[] {
    const medicalPatterns = [
      /rifampicina?/gi,
      /dapsona/gi,
      /clofazimina/gi,
      /pqt[\-\s]?u?/gi,
      /hanseníase|hansen|lepra/gi,
      /dosagem?|dose/gi,
      /contraindicaç/gi,
      /efeito.*colateral/gi
    ];

    const terms: string[] = [];
    medicalPatterns.forEach(pattern => {
      const matches = query.match(pattern);
      if (matches) {
        terms.push(...matches);
      }
    });

    return [...new Set(terms)];
  }

  private detectCategories(query: string): string[] {
    const categoryMap = {
      dosage: /(dose|dosagem|quantidade|mg|comprimido)/i,
      contraindication: /(contraindicaç|não.*pode|evitar|precauç)/i,
      side_effect: /(efeito|reação|colateral|adverso)/i,
      interaction: /(interaç|junto.*com|combinar)/i,
      protocol: /(protocolo|tratamento|pqt|poliquimio)/i
    };

    return Object.entries(categoryMap)
      .filter(([_, pattern]) => pattern.test(query))
      .map(([category]) => category);
  }

  private determineStrategy(analysis: any): 'supabase' | 'local' | 'hybrid' | 'fallback' {
    // Estratégia baseada na complexidade e configuração
    if (!this.config.useSupabaseRAG && !this.config.useLocalKnowledge) {
      return 'fallback';
    }

    if (analysis.complexity === 'complex' && this.config.enhancedMode && this.config.useSupabaseRAG) {
      return 'hybrid'; // Usar ambos para melhor contexto
    }

    if (this.config.useSupabaseRAG && analysis.requiresContext) {
      return 'supabase'; // Queries complexas preferencialmente no Supabase
    }

    if (this.config.useLocalKnowledge) {
      return 'local'; // Queries simples podem usar local
    }

    return 'fallback';
  }

  private async executeSupabaseQuery(
    query: string,
    persona: string,
    options: any,
    processingSteps: string[]
  ): Promise<IntegratedRAGResponse> {
    processingSteps.push('Executando query no Supabase RAG');

    const supabaseResponse = await supabaseRAGClient.query({
      query,
      persona: persona as any,
      ...options
    });

    if (!supabaseResponse) {
      processingSteps.push('Supabase falhou - executando fallback');
      return this.executeFallbackQuery(query, persona, processingSteps);
    }

    return {
      ...supabaseResponse,
      strategy: 'supabase',
      knowledgeSource: 'Supabase Vector Database',
      processingSteps,
      debugInfo: {
        supabaseAvailable: true,
        cacheUsed: supabaseResponse.cached || false
      }
    };
  }

  private async executeLocalQuery(
    query: string,
    persona: string,
    processingSteps: string[]
  ): Promise<IntegratedRAGResponse> {
    processingSteps.push('Executando query no knowledge base local');

    const searchResults = await medicalKnowledgeBase.search(query, {
      maxResults: 3,
      useChunks: true
    });

    const answer = this.generateAnswerFromLocalResults(searchResults, query, persona);
    const sources = searchResults.map(r => `${r.document.title} (${r.document.source})`);

    return {
      answer,
      context: {
        chunks: [],
        totalScore: searchResults.reduce((sum, r) => sum + r.similarity, 0),
        sourceFiles: sources,
        chunkTypes: [...new Set(searchResults.map(r => r.document.category))],
        confidenceLevel: searchResults.length >= 2 ? 'high' : 'medium',
        metadata: {
          query,
          searchTimeMs: 0,
          similarityThreshold: 0.7,
          chunksFound: searchResults.length
        }
      },
      persona,
      qualityScore: searchResults.length > 0 ? 0.8 : 0.4,
      sources,
      limitations: searchResults.length === 0 ? ['Nenhum resultado encontrado na base local'] : [],
      generatedAt: new Date().toISOString(),
      processingTimeMs: 0,
      strategy: 'local',
      knowledgeSource: 'Local Medical Knowledge Base',
      processingSteps,
      debugInfo: {
        localResults: searchResults,
        supabaseAvailable: false
      }
    };
  }

  private async executeHybridQuery(
    query: string,
    persona: string,
    options: any,
    processingSteps: string[]
  ): Promise<IntegratedRAGResponse> {
    processingSteps.push('Executando query híbrida (Supabase + Local)');

    // Executar ambos em paralelo
    const [supabaseResponse, localResults] = await Promise.all([
      supabaseRAGClient.query({ query, persona: persona as any, ...options }),
      medicalKnowledgeBase.search(query, { maxResults: 2, useChunks: true })
    ]);

    if (supabaseResponse && localResults.length > 0) {
      // Combinar resultados
      const combinedAnswer = this.combineAnswers(supabaseResponse.answer, localResults, persona);
      const combinedSources = [
        ...supabaseResponse.sources,
        ...localResults.map(r => r.document.title)
      ];

      return {
        ...supabaseResponse,
        answer: combinedAnswer,
        sources: combinedSources,
        strategy: 'hybrid',
        knowledgeSource: 'Supabase + Local Knowledge Base',
        processingSteps,
        debugInfo: {
          localResults,
          supabaseAvailable: true,
          cacheUsed: supabaseResponse.cached || false
        }
      };
    }

    // Fallback para melhor resultado disponível
    if (supabaseResponse) {
      return this.executeSupabaseQuery(query, persona, options, processingSteps);
    } else {
      return this.executeLocalQuery(query, persona, processingSteps);
    }
  }

  private async executeFallbackQuery(
    query: string,
    persona: string,
    processingSteps: string[]
  ): Promise<IntegratedRAGResponse> {
    processingSteps.push('Executando resposta de fallback');

    const fallbackAnswer = persona === 'dr_gasnelio'
      ? `**Dr. Gasnelio:** Não foi possível acessar nossa base de dados no momento. Para questões sobre hanseníase, recomendo consultar o Manual do Ministério da Saúde ou procurar orientação médica especializada.`
      : `**Gá:** Oops! Estou com dificuldades técnicas agora. Para dúvidas sobre hanseníase, procure seu médico ou farmacêutico! 😊`;

    return {
      answer: fallbackAnswer,
      context: {
        chunks: [],
        totalScore: 0,
        sourceFiles: [],
        chunkTypes: [],
        confidenceLevel: 'low',
        metadata: {
          query,
          searchTimeMs: 0,
          similarityThreshold: 0,
          chunksFound: 0
        }
      },
      persona,
      qualityScore: 0.3,
      sources: [],
      limitations: ['Sistema de busca temporariamente indisponível'],
      generatedAt: new Date().toISOString(),
      processingTimeMs: 0,
      strategy: 'fallback',
      knowledgeSource: 'Fallback Response',
      processingSteps,
      debugInfo: {
        supabaseAvailable: false,
        localResults: []
      }
    };
  }

  private generateAnswerFromLocalResults(
    results: SearchResult[],
    query: string,
    persona: string
  ): string {
    if (results.length === 0) {
      return persona === 'dr_gasnelio'
        ? "**Dr. Gasnelio:** Não encontrei informações específicas sobre sua consulta na base de dados disponível."
        : "**Gá:** Não achei informações específicas sobre isso. Pode me perguntar de outra forma?";
    }

    const prefix = persona === 'dr_gasnelio' 
      ? "**Dr. Gasnelio (Farmacêutico Clínico):**\n\nBaseado na literatura médica disponível:\n\n"
      : "**Gá (Assistente Empático):**\n\nVou te explicar o que sei sobre isso:\n\n";

    const content = results.map((result, index) => {
      const confidence = result.confidence >= 0.8 ? '[ALTA CONFIANÇA]' : 
                        result.confidence >= 0.6 ? '[MÉDIA CONFIANÇA]' : '[BAIXA CONFIANÇA]';
      
      return `${confidence} ${result.document.content}`;
    }).join('\n\n');

    return prefix + content;
  }

  private combineAnswers(
    supabaseAnswer: string,
    localResults: SearchResult[],
    persona: string
  ): string {
    if (localResults.length === 0) {
      return supabaseAnswer;
    }

    const localInsights = localResults
      .filter(r => r.confidence >= 0.7)
      .map(r => r.document.content)
      .join(' ');

    return `${supabaseAnswer}\n\n**Informação complementar:** ${localInsights}`;
  }

  private async postProcessResponse(
    response: IntegratedRAGResponse,
    analysis: any,
    processingSteps: string[]
  ): Promise<IntegratedRAGResponse> {
    processingSteps.push('Pós-processamento da resposta');

    // Adicionar avisos baseados na análise
    if (analysis.medicalTerms.length > 0 && response.qualityScore < 0.6) {
      response.limitations.push('Resposta com baixa confiança para termos médicos específicos');
    }

    // Sugestões baseadas na categoria
    if (analysis.categories.includes('dosage')) {
      response.limitations.push('Para dosagens específicas, sempre consulte um profissional de saúde');
    }

    return response;
  }

  private async cacheAndTrack(
    query: string,
    response: IntegratedRAGResponse,
    strategy: string
  ): Promise<void> {
    try {
      // Cache se qualidade for boa
      if (this.config.cacheResults && response.qualityScore >= 0.6) {
        const cacheKey = `rag_integrated:${strategy}:${this.hashQuery(query)}`;
        await firestoreCache.set(cacheKey, response, { ttl: 30 * 60 * 1000 }); // 30 min
      }

      // Track analytics
      await AnalyticsFirestoreCache.saveAnalyticsEvent({
        id: `rag_query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sessionId: 'rag_session',
        timestamp: Date.now(),
        event: 'rag_query_executed',
        category: 'knowledge_retrieval',
        label: strategy,
        value: Math.round(response.qualityScore * 100),
        customDimensions: {
          persona: response.persona,
          strategy: response.strategy,
          knowledgeSource: response.knowledgeSource,
          processingTime: response.processingTimeMs
        }
      });

    } catch (error) {
      console.debug('Error caching/tracking RAG response:', error);
    }
  }

  private generateErrorResponse(
    query: string,
    persona: string,
    error: any,
    processingSteps: string[]
  ): IntegratedRAGResponse {
    return {
      answer: `**Sistema:** Ocorreu um erro interno. Erro: ${error.message}`,
      context: {
        chunks: [],
        totalScore: 0,
        sourceFiles: [],
        chunkTypes: [],
        confidenceLevel: 'low',
        metadata: { query, searchTimeMs: 0, similarityThreshold: 0, chunksFound: 0 }
      },
      persona,
      qualityScore: 0.1,
      sources: [],
      limitations: [`Erro interno: ${error.message}`],
      generatedAt: new Date().toISOString(),
      processingTimeMs: 0,
      strategy: 'fallback',
      knowledgeSource: 'Error Handler',
      processingSteps: [...processingSteps, `Erro: ${error.message}`]
    };
  }

  private updateStats(processingTime: number, success: boolean): void {
    this.stats.avgResponseTime = 
      (this.stats.avgResponseTime * (this.stats.totalQueries - 1) + processingTime) / this.stats.totalQueries;
    
    this.stats.successRate = success 
      ? (this.stats.successRate * (this.stats.totalQueries - 1) + 1) / this.stats.totalQueries
      : (this.stats.successRate * (this.stats.totalQueries - 1)) / this.stats.totalQueries;
  }

  private hashQuery(query: string): string {
    let hash = 0;
    for (let i = 0; i < query.length; i++) {
      const char = query.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
}

// Instância singleton
export const ragIntegrationService = RAGIntegrationService.getInstance();

// Funções de conveniência
export async function queryRAGIntegrated(
  query: string,
  persona: 'dr_gasnelio' | 'ga' = 'dr_gasnelio',
  options?: any
): Promise<IntegratedRAGResponse> {
  return ragIntegrationService.query(query, persona, options);
}

export async function searchMedicalRAG(
  query: string,
  options?: any
): Promise<SearchResult[]> {
  return ragIntegrationService.search(query, options);
}

export async function checkRAGIntegrationHealth(): Promise<boolean> {
  const health = await ragIntegrationService.healthCheck();
  return health.status !== 'unhealthy';
}

export default ragIntegrationService;