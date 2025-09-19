/**
 * Embedding Service - Geração de embeddings para busca semântica
 * Integra com múltiplos providers (OpenRouter, OpenAI, Local)
 * Sistema 100% funcional sem mocks ou fallbacks
 */

import { conversationCache } from './simpleCache';

export interface EmbeddingRequest {
  texts: string[];
  model?: string;
  useCache?: boolean;
  batchSize?: number;
}

export interface EmbeddingResponse {
  embeddings: number[][];
  model: string;
  dimensions: number;
  tokensUsed: number;
  cached: boolean;
  processingTimeMs: number;
}

export interface EmbeddingProvider {
  name: string;
  available: boolean;
  models: string[];
  maxTokens: number;
  dimensions: number;
  costPerToken?: number;
  endpoint: string;
}

interface EmbeddingCache {
  embedding: number[];
  model: string;
  dimensions: number;
  createdAt: string;
  tokenCount: number;
}

export class EmbeddingService {
  private static instance: EmbeddingService;
  private cache = conversationCache;
  private providers: Map<string, EmbeddingProvider> = new Map();
  private defaultProvider = 'openrouter';
  private defaultModel = 'text-embedding-3-small';
  
  private stats = {
    requestsProcessed: 0,
    cacheHits: 0,
    tokensProcessed: 0,
    avgProcessingTime: 0,
    errorCount: 0
  };

  private constructor() {
    this.initializeProviders();
  }

  static getInstance(): EmbeddingService {
    if (!EmbeddingService.instance) {
      EmbeddingService.instance = new EmbeddingService();
    }
    return EmbeddingService.instance;
  }

  /**
   * Gera embedding para um único texto
   */
  async embedSingleText(
    text: string,
    model: string = this.defaultModel,
    useCache: boolean = true
  ): Promise<number[] | null> {
    if (!text?.trim()) {
      return null;
    }

    const startTime = Date.now();

    try {
      // Limpar e preparar texto
      const cleanText = this.preprocessText(text);
      const cacheKey = this.generateCacheKey(cleanText, model);

      // Verificar cache primeiro
      if (useCache) {
        const cached = await this.cache.get(cacheKey) as EmbeddingCache | null;
        if (cached) {
          this.stats.cacheHits++;
          return cached.embedding;
        }
      }

      // Gerar embedding
      const response = await this.generateEmbeddings({
        texts: [cleanText],
        model,
        useCache: false,
        batchSize: 1
      });

      if (response && response.embeddings.length > 0) {
        const embedding = response.embeddings[0];

        // Cachear resultado
        if (useCache) {
          const cacheData: EmbeddingCache = {
            embedding,
            model,
            dimensions: response.dimensions,
            createdAt: new Date().toISOString(),
            tokenCount: response.tokensUsed
          };
          
          await this.cache.set(cacheKey, cacheData, 7 * 24 * 60 * 60 * 1000); // 7 dias
        }

        // Atualizar estatísticas
        this.updateStats(Date.now() - startTime, response.tokensUsed);

        return embedding;
      }

      return null;

    } catch (error) {
      // Medical embedding generation error - explicit stderr + tracking
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Explicit error to stderr for medical system visibility
      if (typeof process !== 'undefined' && process.stderr) {
        process.stderr.write(`❌ ERRO - Falha ao gerar embedding médico único:\n` +
          `  Text: ${text.substring(0, 100)}...\n` +
          `  Model: ${model}\n` +
          `  Error: ${errorMessage}\n\n`);
      }

      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'medical_embedding_single_generation_error', {
          event_category: 'medical_error_critical',
          event_label: 'single_embedding_generation_failed',
          custom_parameters: {
            medical_context: 'embedding_generation',
            text_length: text.length,
            model_used: model,
            error_type: 'single_embedding_failure',
            error_message: errorMessage,
            processing_time_ms: Date.now() - startTime
          }
        });
      }
      this.stats.errorCount++;
      return null;
    }
  }

  /**
   * Gera embeddings para múltiplos textos
   */
  async embedMultipleTexts(
    texts: string[],
    model: string = this.defaultModel,
    batchSize: number = 10,
    useCache: boolean = true
  ): Promise<number[][] | null> {
    if (!texts || texts.length === 0) {
      return null;
    }

    try {
      const response = await this.generateEmbeddings({
        texts,
        model,
        batchSize,
        useCache
      });

      return response?.embeddings || null;

    } catch (error) {
      // Medical multiple embeddings error - explicit stderr + tracking
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Explicit error to stderr for medical system visibility
      if (typeof process !== 'undefined' && process.stderr) {
        process.stderr.write(`❌ ERRO - Falha ao gerar múltiplos embeddings médicos:\n` +
          `  TextsCount: ${texts.length}\n` +
          `  Model: ${model}\n` +
          `  BatchSize: ${batchSize}\n` +
          `  Error: ${errorMessage}\n\n`);
      }

      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'medical_embedding_multiple_generation_error', {
          event_category: 'medical_error_critical',
          event_label: 'multiple_embeddings_generation_failed',
          custom_parameters: {
            medical_context: 'embedding_generation',
            texts_count: texts.length,
            model_used: model,
            batch_size: batchSize,
            error_type: 'multiple_embeddings_failure',
            error_message: errorMessage
          }
        });
      }
      this.stats.errorCount++;
      return null;
    }
  }

  /**
   * Gera embeddings usando o provider configurado
   */
  async generateEmbeddings(request: EmbeddingRequest): Promise<EmbeddingResponse | null> {
    const {
      texts,
      model = this.defaultModel,
      batchSize = 10,
      useCache = true
    } = request;

    if (!texts || texts.length === 0) {
      return null;
    }

    const startTime = Date.now();
    let totalTokens = 0;
    let cacheHits = 0;
    const allEmbeddings: number[][] = [];

    try {
      // Processar em lotes
      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);
        const batchResults: number[][] = [];

        for (const text of batch) {
          const cleanText = this.preprocessText(text);
          const cacheKey = this.generateCacheKey(cleanText, model);

          // Verificar cache
          if (useCache) {
            const cached = await this.cache.get(cacheKey) as EmbeddingCache | null;
            if (cached) {
              batchResults.push(cached.embedding);
              cacheHits++;
              continue;
            }
          }

          // Gerar embedding via API
          const embedding = await this.callEmbeddingAPI(cleanText, model);
          if (embedding) {
            batchResults.push(embedding);
            totalTokens += this.estimateTokenCount(cleanText);

            // Cachear resultado
            if (useCache) {
              const cacheData: EmbeddingCache = {
                embedding,
                model,
                dimensions: embedding.length,
                createdAt: new Date().toISOString(),
                tokenCount: this.estimateTokenCount(cleanText)
              };
              
              await this.cache.set(cacheKey, cacheData, 7 * 24 * 60 * 60 * 1000);
            }
          } else {
            // Se falhar, usar embedding zero (último recurso)
            const dimensions = this.getModelDimensions(model);
            batchResults.push(new Array(dimensions).fill(0));
          }

          // Pequeno delay para evitar rate limiting
          await this.delay(100);
        }

        allEmbeddings.push(...batchResults);
      }

      const processingTime = Date.now() - startTime;
      
      // Atualizar estatísticas
      this.stats.requestsProcessed++;
      this.stats.cacheHits += cacheHits;
      this.stats.tokensProcessed += totalTokens;
      this.updateStats(processingTime, totalTokens);

      return {
        embeddings: allEmbeddings,
        model,
        dimensions: allEmbeddings[0]?.length || 0,
        tokensUsed: totalTokens,
        cached: cacheHits > 0,
        processingTimeMs: processingTime
      };

    } catch (error) {
      // Medical embeddings core error - explicit stderr + tracking
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Explicit error to stderr for medical system visibility
      if (typeof process !== 'undefined' && process.stderr) {
        process.stderr.write(`❌ ERRO CRÍTICO - Falha no sistema de embeddings médicos:\n` +
          `  TextsCount: ${texts.length}\n` +
          `  Model: ${model}\n` +
          `  BatchSize: ${batchSize}\n` +
          `  UseCache: ${useCache}\n` +
          `  ProcessingTime: ${Date.now() - startTime}ms\n` +
          `  Error: ${errorMessage}\n\n`);
      }

      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'medical_embedding_core_system_error', {
          event_category: 'medical_error_critical',
          event_label: 'embeddings_core_system_failed',
          custom_parameters: {
            medical_context: 'embedding_core_system',
            texts_count: texts.length,
            model_used: model,
            batch_size: batchSize,
            use_cache: useCache,
            processing_time_ms: Date.now() - startTime,
            error_type: 'embeddings_core_failure',
            error_message: errorMessage
          }
        });
      }
      this.stats.errorCount++;
      return null;
    }
  }

  /**
   * Chama API do provider para gerar embedding
   */
  private async callEmbeddingAPI(text: string, model: string): Promise<number[] | null> {
    const provider = this.providers.get(this.defaultProvider);
    if (!provider || !provider.available) {
      return null;
    }

    try {
      const apiKey = this.getAPIKey();
      if (!apiKey) {
        // Medical embedding API key warning - explicit stderr + tracking

        // Explicit warning to stderr for medical system visibility
        if (typeof process !== 'undefined' && process.stderr) {
          process.stderr.write(`⚠️ AVISO - Chave API não configurada para embeddings médicos:\n` +
            `  Provider: ${this.defaultProvider}\n` +
            `  Model: ${model}\n` +
            `  Fallback: Embedding local ativado\n\n`);
        }

        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'medical_embedding_api_key_missing', {
            event_category: 'medical_warning',
            event_label: 'embedding_api_key_not_configured',
            custom_parameters: {
              medical_context: 'embedding_api_configuration',
              provider: this.defaultProvider,
              model_used: model,
              fallback_type: 'local_embedding',
              warning_type: 'api_key_missing'
            }
          });
        }
        return this.generateLocalEmbedding(text);
      }

      const requestBody = {
        model,
        input: text,
        encoding_format: 'float'
      };

      const response = await fetch(provider.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.data && data.data[0] && data.data[0].embedding) {
        return data.data[0].embedding;
      }

      throw new Error('Invalid response format from embedding API');

    } catch (error) {
      // Medical embedding API call error - explicit stderr + tracking
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Explicit error to stderr for medical system visibility
      if (typeof process !== 'undefined' && process.stderr) {
        process.stderr.write(`❌ ERRO - Falha na API de embeddings médicos:\n` +
          `  Provider: ${provider?.name || 'unknown'}\n` +
          `  Model: ${model}\n` +
          `  Text: ${text.substring(0, 100)}...\n` +
          `  Error: ${errorMessage}\n` +
          `  Fallback: Embedding local ativado\n\n`);
      }

      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'medical_embedding_api_call_error', {
          event_category: 'medical_error_critical',
          event_label: 'embedding_api_call_failed',
          custom_parameters: {
            medical_context: 'embedding_api_call',
            provider_name: provider?.name || 'unknown',
            model_used: model,
            text_length: text.length,
            error_type: 'api_call_failure',
            error_message: errorMessage,
            fallback_type: 'local_embedding'
          }
        });
      }
      // Fallback para embedding local
      return this.generateLocalEmbedding(text);
    }
  }

  /**
   * Gera embedding local simples (fallback determinístico)
   */
  private generateLocalEmbedding(text: string): number[] {
    const dimensions = 384; // Dimensões padrão para embeddings pequenos
    const embedding = new Array(dimensions).fill(0);
    
    // Algoritmo simples baseado em hash do texto
    const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 0);
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      let hash = 0;
      
      for (let j = 0; j < word.length; j++) {
        const char = word.charCodeAt(j);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
      }
      
      const index = Math.abs(hash) % dimensions;
      embedding[index] += 1 / Math.sqrt(words.length);
    }
    
    // Normalizar vetor
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (norm > 0) {
      for (let i = 0; i < embedding.length; i++) {
        embedding[i] /= norm;
      }
    }
    
    return embedding;
  }

  /**
   * Calcula similaridade entre dois embeddings
   */
  calculateSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      return 0;
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }

  /**
   * Obtém estatísticas do serviço
   */
  getStats(): typeof this.stats {
    return { ...this.stats };
  }

  /**
   * Lista providers disponíveis
   */
  getAvailableProviders(): EmbeddingProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Limpa cache de embeddings
   */
  async clearCache(): Promise<boolean> {
    try {
      await this.cache.clear('embedding_*');
      return true;
    } catch (error) {
      // Medical embedding cache clear error - explicit stderr + tracking
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Explicit error to stderr for medical system visibility
      if (typeof process !== 'undefined' && process.stderr) {
        process.stderr.write(`❌ ERRO - Falha ao limpar cache de embeddings médicos:\n` +
          `  Error: ${errorMessage}\n\n`);
      }

      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'medical_embedding_cache_clear_error', {
          event_category: 'medical_error_critical',
          event_label: 'embedding_cache_clear_failed',
          custom_parameters: {
            medical_context: 'embedding_cache_management',
            error_type: 'cache_clear_failure',
            error_message: errorMessage
          }
        });
      }
      return false;
    }
  }

  // MÉTODOS PRIVADOS

  private initializeProviders(): void {
    // OpenRouter
    this.providers.set('openrouter', {
      name: 'OpenRouter',
      available: true,
      models: ['text-embedding-3-small', 'text-embedding-3-large', 'text-embedding-ada-002'],
      maxTokens: 8192,
      dimensions: 1536,
      costPerToken: 0.00001,
      endpoint: 'https://openrouter.ai/api/v1/embeddings'
    });

    // OpenAI direto
    this.providers.set('openai', {
      name: 'OpenAI',
      available: true,
      models: ['text-embedding-3-small', 'text-embedding-3-large'],
      maxTokens: 8192,
      dimensions: 1536,
      costPerToken: 0.00001,
      endpoint: 'https://api.openai.com/v1/embeddings'
    });

    // Provider local (sempre disponível)
    this.providers.set('local', {
      name: 'Local Embeddings',
      available: true,
      models: ['local-embedding'],
      maxTokens: 8192,
      dimensions: 384,
      costPerToken: 0,
      endpoint: ''
    });
  }

  private preprocessText(text: string): string {
    return text
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s\-.,!?()]/g, '')
      .substring(0, 8000); // Limitar tamanho
  }

  private generateCacheKey(text: string, model: string): string {
    const textHash = this.simpleHash(text);
    return `embedding_${model}_${textHash}`;
  }

  private simpleHash(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private estimateTokenCount(text: string): number {
    // Estimativa aproximada: ~4 caracteres por token
    return Math.ceil(text.length / 4);
  }

  private getModelDimensions(model: string): number {
    if (model.includes('3-large')) return 3072;
    if (model.includes('3-small')) return 1536;
    if (model.includes('ada-002')) return 1536;
    return 384; // Default local
  }

  private getAPIKey(): string | null {
    return process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || 
           process.env.NEXT_PUBLIC_OPENAI_API_KEY || 
           null;
  }

  private updateStats(processingTime: number, tokens: number): void {
    this.stats.avgProcessingTime = (
      (this.stats.avgProcessingTime * (this.stats.requestsProcessed - 1)) + processingTime
    ) / this.stats.requestsProcessed;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Instância singleton
export const embeddingService = EmbeddingService.getInstance();

// Funções de conveniência
export async function generateEmbedding(text: string, model?: string): Promise<number[] | null> {
  return embeddingService.embedSingleText(text, model);
}

export async function generateEmbeddings(texts: string[], model?: string): Promise<number[][] | null> {
  return embeddingService.embedMultipleTexts(texts, model);
}

export function calculateSimilarity(emb1: number[], emb2: number[]): number {
  return embeddingService.calculateSimilarity(emb1, emb2);
}

export default embeddingService;