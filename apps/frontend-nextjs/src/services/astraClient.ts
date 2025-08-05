/**
 * Cliente ASTRA BD - Integração com Backend RAG
 * Sistema de Retrieval-Augmented Generation para hanseníase
 */

import { SentimentResult } from './sentimentAnalysis';

export interface AstraQuery {
  question: string;
  context?: string;
  persona?: string;
  sentiment?: {
    category: string;
    score: number;
    magnitude: number;
  };
  maxChunks?: number;
}

export interface AstraChunk {
  content: string;
  section: string;
  relevance_score: number;
  topics: string[];
  importance_score: number;
}

export interface AstraResponse {
  chunks: AstraChunk[];
  combined_context: string;
  confidence: number;
  cached: boolean;
  processing_time: number;
}

export interface AstraFeedback {
  query: string;
  response: string;
  rating: number; // 1-5
  comments?: string;
}

export interface AstraStats {
  cache_stats: {
    total_cached_responses: number;
    cache_hits: number;
    cache_misses: number;
    hit_rate_percent: number;
  };
  feedback_stats: {
    total_feedback: number;
    average_rating: number;
    rating_distribution: Record<number, number>;
  };
  system_stats: {
    total_chunks: number;
    knowledge_base_size: number;
  };
}

class AstraClient {
  private baseUrl: string;
  private cache: Map<string, AstraResponse>;
  private cacheTimeout: number = 5 * 60 * 1000; // 5 minutos
  
  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://roteiro-dispensacao-api-1016586236354.us-central1.run.app';
    this.cache = new Map();
  }
  
  /**
   * Busca contexto relevante usando RAG
   */
  async searchContext(query: AstraQuery): Promise<AstraResponse> {
    const startTime = Date.now();
    
    // Verificar cache local primeiro
    const cacheKey = this.generateCacheKey(query);
    const cachedResponse = this.getCachedResponse(cacheKey);
    if (cachedResponse) {
      return {
        ...cachedResponse,
        cached: true,
        processing_time: Date.now() - startTime
      };
    }
    
    try {
      // Por enquanto, simular resposta do RAG
      // TODO: Quando o endpoint estiver disponível, fazer a chamada real
      const simulatedResponse = await this.simulateRAGResponse(query);
      
      // Cachear resposta
      this.cacheResponse(cacheKey, simulatedResponse);
      
      return {
        ...simulatedResponse,
        cached: false,
        processing_time: Date.now() - startTime
      };
      
    } catch (error) {
      console.error('Erro ao buscar contexto ASTRA:', error);
      
      // Fallback para busca local
      return this.localFallbackSearch(query);
    }
  }
  
  /**
   * Envia feedback sobre qualidade da resposta
   */
  async sendFeedback(feedback: AstraFeedback): Promise<void> {
    try {
      // TODO: Implementar quando endpoint estiver disponível
      console.log('Feedback registrado:', feedback);
      
      // Simular envio
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error('Erro ao enviar feedback:', error);
    }
  }
  
  /**
   * Obtém estatísticas do sistema RAG
   */
  async getStats(): Promise<AstraStats> {
    try {
      // TODO: Implementar quando endpoint estiver disponível
      
      // Simular estatísticas
      return {
        cache_stats: {
          total_cached_responses: this.cache.size,
          cache_hits: 45,
          cache_misses: 15,
          hit_rate_percent: 75.0
        },
        feedback_stats: {
          total_feedback: 120,
          average_rating: 4.2,
          rating_distribution: {
            1: 5,
            2: 10,
            3: 20,
            4: 50,
            5: 35
          }
        },
        system_stats: {
          total_chunks: 250,
          knowledge_base_size: 1024 * 1024 * 5 // 5MB
        }
      };
      
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      throw error;
    }
  }
  
  /**
   * Simula resposta do RAG (temporário)
   */
  private async simulateRAGResponse(query: AstraQuery): Promise<AstraResponse> {
    // Simular delay de processamento
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Base de conhecimento simulada
    const knowledgeBase = [
      {
        content: "A Poliquimioterapia Única (PQT-U) é o esquema padrão para tratamento da hanseníase, consistindo em rifampicina 600mg dose mensal supervisionada, clofazimina 300mg dose mensal supervisionada e 50mg diária autoadministrada, e dapsona 100mg diária autoadministrada.",
        section: "tratamento_pqtu",
        topics: ["pqt-u", "poliquimioterapia", "dosagem", "rifampicina", "clofazimina", "dapsona"]
      },
      {
        content: "A rifampicina pode causar coloração avermelhada na urina, suor e lágrimas nas primeiras 48 horas após a dose, sendo um efeito esperado e não prejudicial. Pacientes devem ser orientados para não se alarmarem.",
        section: "efeitos_adversos_rifampicina",
        topics: ["rifampicina", "efeito adverso", "coloração", "urina"]
      },
      {
        content: "A clofazimina pode causar hiperpigmentação cutânea e ressecamento da pele, que são reversíveis após o término do tratamento. O uso de hidratantes e protetor solar é recomendado.",
        section: "efeitos_adversos_clofazimina",
        topics: ["clofazimina", "efeito adverso", "hiperpigmentação", "pele"]
      },
      {
        content: "A dapsona pode causar anemia hemolítica, especialmente em pacientes com deficiência de G6PD. Monitoramento com hemograma é recomendado no início do tratamento.",
        section: "efeitos_adversos_dapsona",
        topics: ["dapsona", "efeito adverso", "anemia", "g6pd", "hemograma"]
      },
      {
        content: "O tratamento da hanseníase com PQT-U tem duração de 6 doses mensais supervisionadas. A adesão ao tratamento é fundamental para a cura e prevenção de resistência medicamentosa.",
        section: "duracao_tratamento",
        topics: ["tratamento", "duração", "adesão", "cura"]
      }
    ];
    
    // Buscar chunks relevantes
    const queryLower = query.question.toLowerCase();
    const scoredChunks = knowledgeBase.map(chunk => {
      let score = 0;
      
      // Pontuação por palavras-chave
      chunk.topics.forEach(topic => {
        if (queryLower.includes(topic)) {
          score += 2;
        }
      });
      
      // Pontuação por conteúdo
      const contentWords = chunk.content.toLowerCase().split(/\s+/);
      const queryWords = queryLower.split(/\s+/);
      queryWords.forEach(word => {
        if (contentWords.includes(word)) {
          score += 1;
        }
      });
      
      return {
        ...chunk,
        relevance_score: score / (queryWords.length + chunk.topics.length),
        importance_score: 0.8
      };
    });
    
    // Ordenar por relevância e pegar os melhores
    const topChunks = scoredChunks
      .filter(chunk => chunk.relevance_score > 0)
      .sort((a, b) => b.relevance_score - a.relevance_score)
      .slice(0, query.maxChunks || 3);
    
    // Combinar contexto
    const combinedContext = topChunks
      .map(chunk => `[${chunk.section}] ${chunk.content}`)
      .join('\n\n');
    
    return {
      chunks: topChunks,
      combined_context: combinedContext || "Não foram encontradas informações específicas sobre esta pergunta na base de conhecimento.",
      confidence: topChunks.length > 0 ? Math.min(topChunks[0].relevance_score, 1) : 0,
      cached: false,
      processing_time: 0
    };
  }
  
  /**
   * Busca local como fallback
   */
  private localFallbackSearch(query: AstraQuery): AstraResponse {
    // Contexto básico de fallback
    const fallbackContext = `
    Informações básicas sobre PQT-U para hanseníase:
    - Esquema padrão com 3 medicamentos
    - Duração de 6 meses
    - Doses supervisionadas mensais
    
    Para informações mais específicas, consulte um profissional de saúde.
    `;
    
    return {
      chunks: [{
        content: fallbackContext,
        section: "fallback",
        relevance_score: 0.3,
        topics: ["pqt-u", "hanseniase"],
        importance_score: 0.5
      }],
      combined_context: fallbackContext,
      confidence: 0.3,
      cached: false,
      processing_time: 10
    };
  }
  
  /**
   * Gera chave de cache
   */
  private generateCacheKey(query: AstraQuery): string {
    const key = `${query.question}_${query.persona || 'default'}_${query.maxChunks || 3}`;
    return key.toLowerCase().replace(/\s+/g, '_');
  }
  
  /**
   * Busca resposta no cache
   */
  private getCachedResponse(key: string): AstraResponse | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    // Verificar se ainda é válido
    const age = Date.now() - (cached.processing_time || 0);
    if (age > this.cacheTimeout) {
      this.cache.delete(key);
      return null;
    }
    
    return cached;
  }
  
  /**
   * Armazena resposta no cache
   */
  private cacheResponse(key: string, response: AstraResponse): void {
    // Limitar tamanho do cache
    if (this.cache.size > 100) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    
    this.cache.set(key, response);
  }
  
  /**
   * Limpa o cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Exportar instância única
export const astraClient = new AstraClient();

// Helpers convenientes
export async function searchRAGContext(
  question: string, 
  options?: Partial<AstraQuery>
): Promise<AstraResponse> {
  return astraClient.searchContext({
    question,
    ...options
  });
}

export async function rateRAGResponse(
  query: string,
  response: string,
  rating: number,
  comments?: string
): Promise<void> {
  return astraClient.sendFeedback({
    query,
    response,
    rating,
    comments
  });
}

export async function getRAGStatistics(): Promise<AstraStats> {
  return astraClient.getStats();
}