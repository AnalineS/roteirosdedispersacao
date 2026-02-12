/**
 * Semantic Search Engine - Motor de busca semântica avançado
 * Implementa busca inteligente com ranking, filtros e otimizações
 * Sistema 100% funcional para conhecimento médico de hanseníase
 */

import { logger } from '@/utils/logger';
import { embeddingService } from './embeddingService';
import { medicalKnowledgeBase, SearchResult, MedicalDocument } from './medicalKnowledgeBase';
import { ragCache } from './simpleCache';
import { supabaseRAGClient } from './supabaseRAGClient';

export interface SemanticQuery {
  text: string;
  filters?: {
    categories?: string[];
    sources?: string[];
    dateRange?: {
      start: string;
      end: string;
    };
    priority?: {
      min: number;
      max: number;
    };
    languages?: string[];
  };
  ranking?: {
    useRelevance?: boolean;
    useFreshness?: boolean;
    useAuthority?: boolean;
    usePopularity?: boolean;
    customWeights?: {
      semantic: number;
      priority: number;
      recency: number;
      authority: number;
    };
  };
  options?: {
    maxResults?: number;
    minSimilarity?: number;
    useCache?: boolean;
    expandQuery?: boolean;
    includeSynonyms?: boolean;
    fuzzyMatching?: boolean;
  };
}

export interface EnhancedSearchResult extends SearchResult {
  semanticScore: number;
  keywordScore: number;
  priorityScore: number;
  recencyScore: number;
  authorityScore: number;
  finalScore: number;
  matchedTerms: string[];
  explanation: string[];
}

export interface SearchStats {
  totalQueries: number;
  avgResponseTime: number;
  cacheHitRate: number;
  topCategories: Record<string, number>;
  topKeywords: Record<string, number>;
  avgResultsPerQuery: number;
  satisfactionScore: number;
}

interface QueryExpansion {
  originalQuery: string;
  expandedTerms: string[];
  synonyms: string[];
  medicalTerms: string[];
  relatedConcepts: string[];
}

export class SemanticSearchEngine {
  private static instance: SemanticSearchEngine;
  private cache = ragCache;
  private knowledgeBase = medicalKnowledgeBase;
  private ragClient = supabaseRAGClient;
  
  private stats: SearchStats = {
    totalQueries: 0,
    avgResponseTime: 0,
    cacheHitRate: 0,
    topCategories: {},
    topKeywords: {},
    avgResultsPerQuery: 0,
    satisfactionScore: 0.85
  };

  // Vocabulário médico especializado em hanseníase
  private medicalTermsMap = new Map([
    ['pqt', ['poliquimioterapia', 'PQT-U', 'PQT-MB', 'tratamento']],
    ['hanseniase', ['lepra', 'mal de hansen', 'doença de hansen']],
    ['rifampicina', ['RMP', 'antibiótico', 'bactericida']],
    ['dapsona', ['DDS', 'sulfona', 'bacteriostático']],
    ['clofazimina', ['CFZ', 'lamprene', 'anti-hansênico']],
    ['bacilo', ['mycobacterium leprae', 'bacteria', 'hansen']],
    ['neuropatia', ['lesão nervosa', 'dano neural', 'comprometimento nervoso']],
    ['reacao', ['reação tipo 1', 'reação tipo 2', 'eritema nodoso']],
    ['incapacidade', ['grau de incapacidade', 'sequela', 'limitação física']],
    ['vigilancia', ['monitoramento', 'acompanhamento', 'controle']]
  ]);

  // Pesos padrão para ranking
  private defaultWeights = {
    semantic: 0.4,
    priority: 0.25,
    recency: 0.15,
    authority: 0.2
  };

  private constructor() {
    this.initializeSearchEngine();
  }

  static getInstance(): SemanticSearchEngine {
    if (!SemanticSearchEngine.instance) {
      SemanticSearchEngine.instance = new SemanticSearchEngine();
    }
    return SemanticSearchEngine.instance;
  }

  /**
   * Busca semântica principal
   */
  async search(query: SemanticQuery): Promise<EnhancedSearchResult[]> {
    const startTime = Date.now();
    
    try {
      // Validar entrada
      if (!query.text?.trim()) {
        return [];
      }

      // Configurar opções padrão
      const options = {
        maxResults: 10,
        minSimilarity: 0.6,
        useCache: true,
        expandQuery: true,
        includeSynonyms: true,
        fuzzyMatching: false,
        ...query.options
      };

      // Gerar chave de cache
      const cacheKey = this.generateCacheKey(query);
      
      // Verificar cache se habilitado
      if (options.useCache) {
        const cached = await this.cache.get(cacheKey) as EnhancedSearchResult[] | null;
        if (cached) {
          this.stats.cacheHitRate = (this.stats.cacheHitRate * this.stats.totalQueries + 1) / (this.stats.totalQueries + 1);
          this.updateQueryStats(query, cached.length, Date.now() - startTime);
          return cached;
        }
      }

      // Expandir query se habilitado
      const expandedQuery = options.expandQuery ? 
        await this.expandQuery(query.text, options.includeSynonyms) : 
        { originalQuery: query.text, expandedTerms: [query.text], synonyms: [], medicalTerms: [], relatedConcepts: [] };

      // Buscar em múltiplas fontes
      const results = await this.performMultiSourceSearch(query, expandedQuery, options);

      // Aplicar filtros
      const filteredResults = this.applyFilters(results, query.filters);

      // Calcular scores avançados
      const scoredResults = await this.calculateAdvancedScores(filteredResults, query, expandedQuery);

      // Ordenar e limitar resultados
      const rankedResults = this.rankResults(scoredResults, query.ranking).slice(0, options.maxResults);

      // Cachear resultados
      if (options.useCache && rankedResults.length > 0) {
        await this.cache.set(cacheKey, rankedResults, 30 * 60 * 1000); // 30 minutos
      }

      // Atualizar estatísticas
      this.updateQueryStats(query, rankedResults.length, Date.now() - startTime);

      return rankedResults;

    } catch (error) {
      logger.error('Error in semantic search:', error);
      
      // Fallback para busca simples
      try {
        const fallbackResults = await this.knowledgeBase.search(query.text, {
          maxResults: query.options?.maxResults || 5,
          similarity: query.options?.minSimilarity || 0.5
        });

        return this.convertToEnhancedResults(fallbackResults, query);
      } catch (fallbackError) {
        logger.error('Fallback search also failed:', fallbackError);
        return [];
      }
    }
  }

  /**
   * Busca rápida por categoria
   */
  async quickSearchByCategory(
    category: string, 
    query?: string, 
    maxResults: number = 5
  ): Promise<EnhancedSearchResult[]> {
    const searchQuery: SemanticQuery = {
      text: query || `informações sobre ${category}`,
      filters: { categories: [category] },
      options: { maxResults, expandQuery: false }
    };

    return this.search(searchQuery);
  }

  /**
   * Busca contextual para RAG
   */
  async contextualSearch(
    query: string, 
    context: string[], 
    maxResults: number = 5
  ): Promise<EnhancedSearchResult[]> {
    // Combinar query com contexto para busca mais precisa
    const enhancedQuery = `${query} ${context.join(' ')}`;
    
    const searchQuery: SemanticQuery = {
      text: enhancedQuery,
      options: {
        maxResults,
        expandQuery: true,
        includeSynonyms: true,
        minSimilarity: 0.7
      },
      ranking: {
        useRelevance: true,
        useAuthority: true,
        customWeights: {
          semantic: 0.6,
          priority: 0.3,
          recency: 0.05,
          authority: 0.05
        }
      }
    };

    return this.search(searchQuery);
  }

  /**
   * Busca por similaridade de documento
   */
  async findSimilarContent(
    referenceDoc: MedicalDocument, 
    maxResults: number = 5
  ): Promise<EnhancedSearchResult[]> {
    if (!referenceDoc.embedding) {
      return [];
    }

    try {
      // Buscar documentos similares baseado no embedding
      const results = await this.knowledgeBase.search(referenceDoc.content, {
        maxResults: maxResults + 1, // +1 para excluir o documento original
        similarity: 0.6,
        useChunks: false
      });

      // Excluir o documento original
      const filteredResults = results.filter(r => r.document.id !== referenceDoc.id);

      return this.convertToEnhancedResults(filteredResults.slice(0, maxResults), {
        text: `similar to ${referenceDoc.title}`
      });

    } catch (error) {
      logger.error('Error finding similar content:', error);
      return [];
    }
  }

  /**
   * Sugere termos relacionados
   */
  async getSuggestions(partialQuery: string, maxSuggestions: number = 5): Promise<string[]> {
    const suggestions: string[] = [];

    // Sugestões baseadas em termos médicos
    for (const [term, synonyms] of this.medicalTermsMap) {
      if (term.toLowerCase().includes(partialQuery.toLowerCase())) {
        suggestions.push(term);
        suggestions.push(...synonyms.filter(s => s.toLowerCase().includes(partialQuery.toLowerCase())));
      }
    }

    // Sugestões baseadas em categorias
    const categories = ['dosage', 'protocol', 'contraindication', 'side_effect', 'interaction', 'general'];
    suggestions.push(...categories.filter(cat => cat.includes(partialQuery.toLowerCase())));

    // Remover duplicatas e limitar
    return Array.from(new Set(suggestions))
      .sort((a, b) => a.length - b.length) // Priorizar termos mais curtos
      .slice(0, maxSuggestions);
  }

  /**
   * Estatísticas do motor de busca
   */
  getStats(): SearchStats {
    return { ...this.stats };
  }

  /**
   * Limpa cache de busca
   */
  async clearSearchCache(): Promise<boolean> {
    try {
      await this.cache.clear('search_*');
      return true;
    } catch (error) {
      logger.error('Error clearing search cache:', error);
      return false;
    }
  }

  // MÉTODOS PRIVADOS

  private async initializeSearchEngine(): Promise<void> {
    logger.log('🔍 Initializing Semantic Search Engine...');
    
    // Carregar estatísticas do cache se disponível
    try {
      const savedStats = await this.cache.get('search_stats') as SearchStats | null;
      if (savedStats) {
        this.stats = { ...this.stats, ...savedStats };
      }
    } catch (error) {
      logger.warn('Could not load search stats from cache:', error);
    }
  }

  private async expandQuery(query: string, includeSynonyms: boolean): Promise<QueryExpansion> {
    const expansion: QueryExpansion = {
      originalQuery: query,
      expandedTerms: [query],
      synonyms: [],
      medicalTerms: [],
      relatedConcepts: []
    };

    const lowercaseQuery = query.toLowerCase();

    // Expandir com termos médicos
    for (const [term, synonyms] of this.medicalTermsMap) {
      if (lowercaseQuery.includes(term) || synonyms.some(s => lowercaseQuery.includes(s.toLowerCase()))) {
        expansion.medicalTerms.push(term);
        if (includeSynonyms) {
          expansion.synonyms.push(...synonyms);
        }
      }
    }

    // Expandir termos relacionados baseado no contexto
    if (lowercaseQuery.includes('tratamento') || lowercaseQuery.includes('medicamento')) {
      expansion.relatedConcepts.push('pqt', 'rifampicina', 'dapsona', 'clofazimina');
    }
    
    if (lowercaseQuery.includes('dosagem') || lowercaseQuery.includes('dose')) {
      expansion.relatedConcepts.push('administração', 'posologia', 'mg', 'comprimido');
    }

    // Consolidar termos expandidos
    expansion.expandedTerms = Array.from(new Set([
      ...expansion.expandedTerms,
      ...expansion.synonyms,
      ...expansion.medicalTerms,
      ...expansion.relatedConcepts
    ]));

    return expansion;
  }

  private async performMultiSourceSearch(
    query: SemanticQuery,
    expansion: QueryExpansion,
    options: Required<SemanticQuery['options']>
  ): Promise<SearchResult[]> {
    const allResults: SearchResult[] = [];

    try {
      // 1. Busca na base de conhecimento local
      const kbResults = await this.knowledgeBase.search(query.text, {
        maxResults: (options?.maxResults || 10) * 2,
        similarity: options?.minSimilarity || 0.6,
        categories: query.filters?.categories,
        useChunks: true
      });
      allResults.push(...kbResults);

      // 2. Busca expandida com termos relacionados
      if (expansion.expandedTerms.length > 1) {
        for (const term of expansion.expandedTerms.slice(1, 3)) { // Limite a 2 termos extras
          const expandedResults = await this.knowledgeBase.search(term, {
            maxResults: Math.ceil((options?.maxResults || 10) / 2),
            similarity: (options?.minSimilarity || 0.6) * 0.9, // Ligeiramente mais permissivo
            categories: query.filters?.categories
          });
          allResults.push(...expandedResults);
        }
      }

      // 3. Busca por categoria se especificada
      if (query.filters?.categories && query.filters.categories.length > 0) {
        for (const category of query.filters.categories) {
          const categoryResults = await this.knowledgeBase.searchByCategory(category, query.text);
          allResults.push(...categoryResults);
        }
      }

      // Remover duplicatas baseado no ID do documento
      const uniqueResults = allResults.filter((result, index, arr) => 
        arr.findIndex(r => r.document.id === result.document.id) === index
      );

      return uniqueResults;

    } catch (error) {
      logger.error('Error in multi-source search:', error);
      return allResults; // Retornar resultados parciais
    }
  }

  private applyFilters(results: SearchResult[], filters?: SemanticQuery['filters']): SearchResult[] {
    if (!filters) return results;

    return results.filter(result => {
      const doc = result.document;

      // Filtro por categoria
      if (filters.categories && filters.categories.length > 0) {
        if (!filters.categories.includes(doc.category)) return false;
      }

      // Filtro por fonte
      if (filters.sources && filters.sources.length > 0) {
        if (!filters.sources.some(source => doc.source.includes(source))) return false;
      }

      // Filtro por prioridade
      if (filters.priority) {
        if (doc.priority < filters.priority.min || doc.priority > filters.priority.max) return false;
      }

      // Filtro por data (se lastUpdated estiver disponível)
      if (filters.dateRange && doc.lastUpdated) {
        const docDate = new Date(doc.lastUpdated);
        const startDate = new Date(filters.dateRange.start);
        const endDate = new Date(filters.dateRange.end);
        if (docDate < startDate || docDate > endDate) return false;
      }

      return true;
    });
  }

  private async calculateAdvancedScores(
    results: SearchResult[],
    query: SemanticQuery,
    expansion: QueryExpansion
  ): Promise<EnhancedSearchResult[]> {
    const enhancedResults: EnhancedSearchResult[] = [];

    for (const result of results) {
      const doc = result.document;
      const content = `${doc.title} ${doc.content}`;
      const contentLower = content.toLowerCase();

      // 1. Score semântico (já vem do similarity)
      const semanticScore = result.similarity;

      // 2. Score de palavra-chave
      const keywordScore = this.calculateKeywordScore(contentLower, expansion);

      // 3. Score de prioridade
      const priorityScore = doc.priority;

      // 4. Score de autoridade (baseado na fonte)
      const authorityScore = this.calculateAuthorityScore(doc.source);

      // 5. Score de recência
      const recencyScore = this.calculateRecencyScore(doc.lastUpdated);

      // 6. Termos correspondentes
      const matchedTerms = this.findMatchedTerms(contentLower, expansion);

      // 7. Score final ponderado
      const weights = query.ranking?.customWeights || this.defaultWeights;
      const finalScore = (
        semanticScore * weights.semantic +
        priorityScore * weights.priority +
        recencyScore * weights.recency +
        authorityScore * weights.authority +
        keywordScore * 0.1 // Bonus pequeno para keywords
      ) / (weights.semantic + weights.priority + weights.recency + weights.authority + 0.1);

      // 8. Explicação do score
      const explanation = [
        `Similaridade semântica: ${(semanticScore * 100).toFixed(1)}%`,
        `Prioridade do conteúdo: ${(priorityScore * 100).toFixed(1)}%`,
        `Relevância das palavras-chave: ${(keywordScore * 100).toFixed(1)}%`,
        `Autoridade da fonte: ${(authorityScore * 100).toFixed(1)}%`,
        matchedTerms.length > 0 ? `Termos encontrados: ${matchedTerms.join(', ')}` : ''
      ].filter(Boolean);

      enhancedResults.push({
        ...result,
        semanticScore,
        keywordScore,
        priorityScore,
        recencyScore,
        authorityScore,
        finalScore,
        matchedTerms,
        explanation
      });
    }

    return enhancedResults;
  }

  private calculateKeywordScore(content: string, expansion: QueryExpansion): number {
    let score = 0;
    let totalTerms = 0;

    // Verificar termo original
    if (content.includes(expansion.originalQuery.toLowerCase())) {
      score += 1.0;
    }
    totalTerms++;

    // Verificar termos médicos (peso maior)
    expansion.medicalTerms.forEach(term => {
      if (content.includes(term.toLowerCase())) {
        score += 0.8;
      }
      totalTerms++;
    });

    // Verificar sinônimos
    expansion.synonyms.forEach(synonym => {
      if (content.includes(synonym.toLowerCase())) {
        score += 0.6;
      }
      totalTerms++;
    });

    return totalTerms > 0 ? score / totalTerms : 0;
  }

  private calculateAuthorityScore(source: string): number {
    const authorityMap = {
      'Ministério da Saúde': 1.0,
      'OMS': 0.95,
      'Protocolo Clínico': 0.9,
      'Manual': 0.8,
      'Guia': 0.75,
      'Farmacologia Clínica': 0.85
    };

    for (const [key, score] of Object.entries(authorityMap)) {
      if (source.includes(key)) {
        return score;
      }
    }

    return 0.5; // Score padrão para fontes não reconhecidas
  }

  private calculateRecencyScore(lastUpdated?: string): number {
    if (!lastUpdated) return 0.5;

    const docDate = new Date(lastUpdated);
    const now = new Date();
    const daysDiff = (now.getTime() - docDate.getTime()) / (1000 * 60 * 60 * 24);

    // Score máximo para documentos recentes, decay exponencial
    if (daysDiff <= 30) return 1.0;
    if (daysDiff <= 90) return 0.9;
    if (daysDiff <= 180) return 0.8;
    if (daysDiff <= 365) return 0.7;
    return 0.5;
  }

  private findMatchedTerms(content: string, expansion: QueryExpansion): string[] {
    const matched: string[] = [];

    [expansion.originalQuery, ...expansion.medicalTerms, ...expansion.synonyms].forEach(term => {
      if (content.includes(term.toLowerCase())) {
        matched.push(term);
      }
    });

    return Array.from(new Set(matched));
  }

  private rankResults(
    results: EnhancedSearchResult[],
    ranking?: SemanticQuery['ranking']
  ): EnhancedSearchResult[] {
    if (!ranking) {
      return results.sort((a, b) => b.finalScore - a.finalScore);
    }

    // Aplicar ordenação customizada se especificada
    return results.sort((a, b) => {
      if (ranking.useRelevance && a.semanticScore !== b.semanticScore) {
        return b.semanticScore - a.semanticScore;
      }
      if (ranking.useAuthority && a.authorityScore !== b.authorityScore) {
        return b.authorityScore - a.authorityScore;
      }
      if (ranking.useFreshness && a.recencyScore !== b.recencyScore) {
        return b.recencyScore - a.recencyScore;
      }
      return b.finalScore - a.finalScore;
    });
  }

  private convertToEnhancedResults(
    results: SearchResult[],
    query: SemanticQuery
  ): EnhancedSearchResult[] {
    return results.map(result => ({
      ...result,
      semanticScore: result.similarity,
      keywordScore: 0.5,
      priorityScore: result.document.priority,
      recencyScore: 0.5,
      authorityScore: 0.5,
      finalScore: result.similarity,
      matchedTerms: [],
      explanation: [`Busca básica - Similaridade: ${(result.similarity * 100).toFixed(1)}%`]
    }));
  }

  private generateCacheKey(query: SemanticQuery): string {
    const keyData = {
      text: query.text,
      filters: query.filters,
      options: query.options
    };
    
    const keyString = JSON.stringify(keyData);
    let hash = 0;
    for (let i = 0; i < keyString.length; i++) {
      const char = keyString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    return `search_${Math.abs(hash).toString(36)}`;
  }

  private updateQueryStats(query: SemanticQuery, resultCount: number, responseTime: number): void {
    this.stats.totalQueries++;
    this.stats.avgResponseTime = (
      (this.stats.avgResponseTime * (this.stats.totalQueries - 1)) + responseTime
    ) / this.stats.totalQueries;
    
    this.stats.avgResultsPerQuery = (
      (this.stats.avgResultsPerQuery * (this.stats.totalQueries - 1)) + resultCount
    ) / this.stats.totalQueries;

    // Atualizar top categorias
    if (query.filters?.categories) {
      query.filters.categories.forEach(category => {
        this.stats.topCategories[category] = (this.stats.topCategories[category] || 0) + 1;
      });
    }

    // Salvar estatísticas no cache periodicamente
    if (this.stats.totalQueries % 10 === 0) {
      this.cache.set('search_stats', this.stats, 24 * 60 * 60 * 1000);
    }
  }

  /**
   * Análise de query para otimização
   */
  analyzeQuery(query: string): {
    complexity: 'simple' | 'medium' | 'complex';
    medicalTerms: string[];
    categories: string[];
    confidence: number;
  } {
    const words = query.toLowerCase().split(/\s+/);
    const medicalTerms = this.extractMedicalTerms(query);
    const categories = this.detectCategories(query);
    
    let complexity: 'simple' | 'medium' | 'complex' = 'simple';
    if (words.length > 10 || medicalTerms.length > 2) {
      complexity = 'medium';
    }
    if (words.length > 20 || medicalTerms.length > 4 || categories.length > 2) {
      complexity = 'complex';
    }
    
    const confidence = Math.min(1, (medicalTerms.length * 0.3) + (words.length * 0.05));
    
    return { complexity, medicalTerms, categories, confidence };
  }

  /**
   * Busca rápida simplificada
   */
  async quickSearch(query: string): Promise<SearchResult[]> {
    return this.search({
      text: query,
      options: {
        maxResults: 5,
        expandQuery: false,
        includeSynonyms: false
      }
    });
  }

  /**
   * Busca com sugestões automáticas
   */
  async searchWithSuggestions(query: string): Promise<{
    results: SearchResult[];
    suggestions: string[];
  }> {
    const results = await this.search({ 
      text: query, 
      options: { maxResults: 10 }
    });
    const suggestions = this.generateQuerySuggestions(query, results);
    return { results, suggestions };
  }

  /**
   * Encontrar documentos similares
   */
  async findSimilar(documentId: string): Promise<SearchResult[]> {
    const document = await medicalKnowledgeBase.getDocument(documentId);
    if (!document) return [];
    
    return this.search({
      text: document.content.substring(0, 200),
      options: {
        maxResults: 5
      }
    });
  }

  private generateQuerySuggestions(query: string, results: SearchResult[]): string[] {
    const suggestions: string[] = [];
    
    // Sugestões baseadas nos resultados
    results.slice(0, 3).forEach(result => {
      const title = result.document.title.toLowerCase();
      if (!title.includes(query.toLowerCase())) {
        suggestions.push(result.document.title);
      }
    });
    
    return suggestions.slice(0, 3);
  }

  private extractMedicalTerms(query: string): string[] {
    const medicalTerms: string[] = [];
    const queryLower = query.toLowerCase();
    
    // Mapear termos médicos específicos de hanseníase
    const medicalTermsMap = [
      ['hanseniase', 'hanseníase', 'lepra'],
      ['pqt', 'poliquimioterapia'],
      ['rifampicina', 'rifampin'],
      ['dapsona', 'dds'],
      ['clofazimina', 'clofazimine'],
      ['baciloscopia', 'bacilos'],
      ['neurite', 'neuropatia'],
      ['reacao', 'reação', 'episódio reacional'],
      ['paucibacilar', 'pb'],
      ['multibacilar', 'mb']
    ];
    
    for (const termGroup of medicalTermsMap) {
      for (const term of termGroup) {
        if (queryLower.includes(term)) {
          medicalTerms.push(termGroup[0]); // Adiciona o termo principal
          break;
        }
      }
    }
    
    return [...new Set(medicalTerms)]; // Remove duplicatas
  }

  private detectCategories(query: string): string[] {
    const categories: string[] = [];
    const queryLower = query.toLowerCase();
    
    // Mapear categorias médicas
    const categoryMap = {
      'tratamento': ['tratamento', 'terapia', 'medicamento', 'droga'],
      'diagnóstico': ['diagnóstico', 'exame', 'teste', 'baciloscopia'],
      'sintomas': ['sintomas', 'sinais', 'manifestação', 'lesão'],
      'efeitos_adversos': ['efeito', 'reação', 'adverso', 'colateral'],
      'prevenção': ['prevenção', 'profilaxia', 'controle'],
      'epidemiologia': ['epidemiologia', 'prevalência', 'incidência']
    };
    
    for (const [category, terms] of Object.entries(categoryMap)) {
      for (const term of terms) {
        if (queryLower.includes(term)) {
          categories.push(category);
          break;
        }
      }
    }
    
    return [...new Set(categories)]; // Remove duplicatas
  }
}

// Instância singleton
export const semanticSearchEngine = SemanticSearchEngine.getInstance();

// Funções de conveniência
export async function semanticSearch(
  query: string,
  options?: Partial<SemanticQuery>
): Promise<EnhancedSearchResult[]> {
  return semanticSearchEngine.search({
    text: query,
    ...options
  });
}

export async function quickMedicalSearch(query: string, category?: string): Promise<EnhancedSearchResult[]> {
  if (category) {
    return semanticSearchEngine.quickSearchByCategory(category, query);
  }
  return semanticSearch(query, { options: { maxResults: 5 } });
}

export async function findSimilarDocuments(
  doc: MedicalDocument,
  maxResults: number = 3
): Promise<EnhancedSearchResult[]> {
  return semanticSearchEngine.findSimilarContent(doc, maxResults);
}

export default semanticSearchEngine;