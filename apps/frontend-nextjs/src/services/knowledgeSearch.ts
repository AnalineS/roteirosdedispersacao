/**
 * Serviço de Busca de Conhecimento
 * Integra ASTRA BD/RAG com o sistema de chat
 */

import { astraClient, AstraResponse, AstraQuery } from './astraClient';
import { SentimentResult, SentimentCategory } from './sentimentAnalysis';

export interface KnowledgeSearchOptions {
  maxChunks?: number;
  includeContext?: boolean;
  filterByTopics?: string[];
  minConfidence?: number;
}

export interface EnhancedMessage {
  original: string;
  enriched: string;
  context?: string;
  confidence: number;
  sources: string[];
}

export class KnowledgeSearchService {
  private static instance: KnowledgeSearchService;
  
  private constructor() {}
  
  static getInstance(): KnowledgeSearchService {
    if (!KnowledgeSearchService.instance) {
      KnowledgeSearchService.instance = new KnowledgeSearchService();
    }
    return KnowledgeSearchService.instance;
  }
  
  /**
   * Busca conhecimento relevante baseado na pergunta e sentimento
   */
  async searchKnowledge(
    question: string,
    sentiment?: SentimentResult,
    persona?: string,
    options?: KnowledgeSearchOptions
  ): Promise<AstraResponse> {
    // Ajustar parâmetros baseado no sentimento
    const searchParams = this.adjustSearchBySentiment(sentiment, options);
    
    // Preparar query
    const query: AstraQuery = {
      question,
      persona,
      maxChunks: searchParams.maxChunks,
      ...(sentiment && {
        sentiment: {
          category: sentiment.category,
          score: sentiment.score,
          magnitude: sentiment.magnitude
        }
      })
    };
    
    // Buscar no ASTRA
    const response = await astraClient.searchContext(query);
    
    // Filtrar por confiança mínima se especificado
    if (searchParams.minConfidence && response.confidence < searchParams.minConfidence) {
      return this.getFallbackResponse(question, persona);
    }
    
    return response;
  }
  
  /**
   * Enriquece mensagem com contexto do conhecimento
   */
  async enrichMessage(
    message: string,
    sentiment?: SentimentResult,
    persona?: string
  ): Promise<EnhancedMessage> {
    try {
      // Buscar contexto relevante
      const knowledge = await this.searchKnowledge(message, sentiment, persona, {
        maxChunks: 2,
        minConfidence: 0.5
      });
      
      if (!knowledge.combined_context || knowledge.confidence < 0.3) {
        return {
          original: message,
          enriched: message,
          confidence: 0,
          sources: []
        };
      }
      
      // Construir mensagem enriquecida
      const enriched = this.buildEnrichedMessage(message, knowledge, sentiment);
      
      return {
        original: message,
        enriched: enriched.text,
        context: knowledge.combined_context,
        confidence: knowledge.confidence,
        sources: enriched.sources
      };
      
    } catch (error) {
      console.error('Erro ao enriquecer mensagem:', error);
      return {
        original: message,
        enriched: message,
        confidence: 0,
        sources: []
      };
    }
  }
  
  /**
   * Ajusta parâmetros de busca baseado no sentimento
   */
  private adjustSearchBySentiment(
    sentiment?: SentimentResult,
    baseOptions?: KnowledgeSearchOptions
  ): Required<KnowledgeSearchOptions> {
    const defaults: Required<KnowledgeSearchOptions> = {
      maxChunks: 3,
      includeContext: true,
      filterByTopics: [],
      minConfidence: 0.3
    };
    
    if (!sentiment) {
      return { ...defaults, ...baseOptions };
    }
    
    // Ajustes por categoria de sentimento
    switch (sentiment.category) {
      case SentimentCategory.ANXIOUS:
        // Usuário ansioso - fornecer mais contexto e informações tranquilizadoras
        return {
          ...defaults,
          ...baseOptions,
          maxChunks: 4,
          minConfidence: 0.5 // Apenas informações confiáveis
        };
        
      case SentimentCategory.FRUSTRATED:
        // Usuário frustrado - ser mais direto e objetivo
        return {
          ...defaults,
          ...baseOptions,
          maxChunks: 2,
          minConfidence: 0.6 // Alta confiança para evitar mais frustração
        };
        
      case SentimentCategory.CONCERNED:
        // Usuário preocupado - fornecer informações detalhadas
        return {
          ...defaults,
          ...baseOptions,
          maxChunks: 5,
          includeContext: true
        };
        
      default:
        return { ...defaults, ...baseOptions };
    }
  }
  
  /**
   * Constrói mensagem enriquecida com contexto
   */
  private buildEnrichedMessage(
    originalMessage: string,
    knowledge: AstraResponse,
    sentiment?: SentimentResult
  ): { text: string; sources: string[] } {
    const sources: string[] = [];
    let enrichedText = originalMessage;
    
    // Adicionar contexto baseado nos chunks mais relevantes
    const topChunk = knowledge.chunks[0];
    if (topChunk && topChunk.relevance_score > 0.7) {
      // Alta relevância - incluir diretamente na resposta
      sources.push(topChunk.section);
      
      // Adaptar tom baseado no sentimento
      if (sentiment?.category === SentimentCategory.ANXIOUS) {
        enrichedText = `Entendo sua preocupação. ${originalMessage}\n\nInformação importante: ${this.simplifyContent(topChunk.content)}`;
      } else if (sentiment?.category === SentimentCategory.FRUSTRATED) {
        enrichedText = `${originalMessage}\n\nResumo: ${this.extractKeyPoints(topChunk.content)}`;
      } else {
        enrichedText = `${originalMessage}\n\nContexto adicional: ${topChunk.content}`;
      }
    }
    
    // Adicionar outras fontes relevantes
    knowledge.chunks.slice(1).forEach(chunk => {
      if (chunk.relevance_score > 0.5) {
        sources.push(chunk.section);
      }
    });
    
    return { text: enrichedText, sources };
  }
  
  /**
   * Simplifica conteúdo para usuários ansiosos
   */
  private simplifyContent(content: string): string {
    // Remover jargões técnicos e simplificar
    let simplified = content;
    
    // Substituir termos técnicos por versões mais simples
    const replacements = [
      { from: /poliquimioterapia única|PQT-U/gi, to: 'tratamento combinado' },
      { from: /hiperpigmentação/gi, to: 'escurecimento da pele' },
      { from: /anemia hemolítica/gi, to: 'redução de glóbulos vermelhos' },
      { from: /dose supervisionada/gi, to: 'dose tomada na presença do profissional' }
    ];
    
    replacements.forEach(({ from, to }) => {
      simplified = simplified.replace(from, to);
    });
    
    // Limitar tamanho
    if (simplified.length > 200) {
      simplified = simplified.substring(0, 197) + '...';
    }
    
    return simplified;
  }
  
  /**
   * Extrai pontos principais para usuários frustrados
   */
  private extractKeyPoints(content: string): string {
    // Extrair sentenças que contêm números, dosagens ou instruções
    const sentences = content.split(/[.!?]+/);
    const keyPoints: string[] = [];
    
    sentences.forEach(sentence => {
      if (
        /\d+\s*(mg|ml|dose|mês|meses|dia|dias)/i.test(sentence) ||
        /deve|precisa|importante|necessário/i.test(sentence)
      ) {
        keyPoints.push(sentence.trim());
      }
    });
    
    // Retornar no máximo 3 pontos principais
    return keyPoints.slice(0, 3).join('. ') + '.';
  }
  
  /**
   * Resposta de fallback quando não há contexto suficiente
   */
  private getFallbackResponse(question: string, persona?: string): AstraResponse {
    const fallbackMessage = persona === 'ga' 
      ? "Não encontrei informações específicas sobre isso, mas posso ajudar de outras formas. O que mais você gostaria de saber?"
      : "Não há informações detalhadas sobre este tópico na base de conhecimento atual. Recomendo consultar as diretrizes oficiais ou um especialista.";
    
    return {
      chunks: [{
        content: fallbackMessage,
        section: "fallback",
        relevance_score: 0,
        topics: [],
        importance_score: 0
      }],
      combined_context: fallbackMessage,
      confidence: 0,
      cached: false,
      processing_time: 0
    };
  }
  
  /**
   * Pré-busca contexto para perguntas comuns
   */
  async prefetchCommonTopics(): Promise<void> {
    const commonQuestions = [
      "Como funciona o tratamento PQT-U?",
      "Quais são os efeitos colaterais?",
      "Quanto tempo dura o tratamento?",
      "Posso tomar os remédios em casa?"
    ];
    
    // Buscar em paralelo para popular o cache
    await Promise.all(
      commonQuestions.map(q => 
        this.searchKnowledge(q, undefined, undefined, { maxChunks: 2 })
          .catch(err => console.error('Erro no prefetch:', err))
      )
    );
  }
}

// Exportar instância e helpers
export const knowledgeSearch = KnowledgeSearchService.getInstance();

export async function searchRelevantKnowledge(
  question: string,
  sentiment?: SentimentResult,
  persona?: string
): Promise<AstraResponse> {
  return knowledgeSearch.searchKnowledge(question, sentiment, persona);
}

export async function enrichWithContext(
  message: string,
  sentiment?: SentimentResult,
  persona?: string
): Promise<EnhancedMessage> {
  return knowledgeSearch.enrichMessage(message, sentiment, persona);
}