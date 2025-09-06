/**
 * Serviço de Busca de Conhecimento
 * Integra sistema RAG completo (Supabase + Local) com o sistema de chat
 */

import { SentimentResult, SentimentCategory } from './sentimentAnalysis';
import { personaRAGIntegration, PersonaResponse } from './personaRAGIntegration';
import { ragIntegrationService, IntegratedRAGResponse } from './ragIntegrationService';
import { supabaseRAGClient, RAGContext } from './supabaseRAGClient';

interface AstraResponse {
  chunks: Array<{ 
    content: string; 
    score: number; 
    section: string;
    relevance_score: number;
    topics: string[];
    importance_score: number;
  }>;
  combined_context: string;
  confidence: number;
  cached: boolean;
  processing_time: number;
}

interface AstraQuery {
  question: string;
  persona?: string;
  maxChunks?: number;
  include_context?: boolean;
  filter_topics?: string[];
  min_confidence?: number;
  sentiment?: {
    category: SentimentCategory;
    score: number;
    magnitude: number;
  };
}

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
    persona: string = 'dr_gasnelio',
    options?: KnowledgeSearchOptions
  ): Promise<AstraResponse> {
    const startTime = Date.now();

    try {
      // Ajustar parâmetros baseado no sentimento
      const searchParams = this.adjustSearchBySentiment(sentiment, options);
      
      // Usar PersonaRAG para obter resposta contextualizada
      const personaResponse = await personaRAGIntegration.queryWithPersona(
        question,
        persona as 'dr_gasnelio' | 'ga'
      );

      if (personaResponse) {
        // Converter PersonaResponse para AstraResponse
        return this.convertPersonaResponseToAstra(personaResponse, startTime);
      }

      // Fallback para RAG Integration Service
      const ragResponse = await ragIntegrationService.query(
        question,
        persona as 'dr_gasnelio' | 'ga',
        { maxChunks: searchParams.maxChunks }
      );

      if (ragResponse) {
        return this.convertRAGResponseToAstra(ragResponse, startTime);
      }

      // Último recurso - resposta de fallback
      return this.getFallbackResponse(question, persona);

    } catch (error) {
      console.error('Error in knowledge search:', error);
      return this.getFallbackResponse(question, persona);
    }
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
   * Converte PersonaResponse para AstraResponse
   */
  private convertPersonaResponseToAstra(
    personaResponse: PersonaResponse, 
    startTime: number
  ): AstraResponse {
    const processingTime = Date.now() - startTime;
    
    // Converter sources para chunks
    const chunks = personaResponse.sources.map((source, index) => ({
      content: `${source}: ${personaResponse.response.slice(index * 100, (index + 1) * 100)}`,
      score: personaResponse.confidence,
      section: source,
      relevance_score: personaResponse.confidence,
      topics: personaResponse.adaptations,
      importance_score: personaResponse.personalizationScore / 100
    }));

    return {
      chunks: chunks.length > 0 ? chunks : [{
        content: personaResponse.response,
        score: personaResponse.confidence,
        section: `${personaResponse.persona}_response`,
        relevance_score: personaResponse.confidence,
        topics: personaResponse.adaptations,
        importance_score: personaResponse.personalizationScore / 100
      }],
      combined_context: personaResponse.response,
      confidence: personaResponse.confidence,
      cached: personaResponse.fallbackUsed !== true,
      processing_time: processingTime
    };
  }

  /**
   * Converte RAGResponse para AstraResponse
   */
  private convertRAGResponseToAstra(
    ragResponse: IntegratedRAGResponse,
    startTime: number
  ): AstraResponse {
    const processingTime = Date.now() - startTime;
    
    // Converter context chunks para AstraResponse chunks
    const chunks = ragResponse.context.chunks.map(chunk => ({
      content: chunk.content,
      score: chunk.score,
      section: chunk.source,
      relevance_score: chunk.weightedScore,
      topics: [chunk.category],
      importance_score: chunk.priority / 10
    }));

    return {
      chunks: chunks.length > 0 ? chunks : [{
        content: ragResponse.answer,
        score: ragResponse.qualityScore,
        section: ragResponse.knowledgeSource,
        relevance_score: ragResponse.qualityScore,
        topics: ragResponse.context.chunkTypes,
        importance_score: ragResponse.qualityScore
      }],
      combined_context: ragResponse.answer,
      confidence: ragResponse.qualityScore,
      cached: ragResponse.cached || false,
      processing_time: processingTime
    };
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
        score: 0.3,
        section: "fallback",
        relevance_score: 0.3,
        topics: [],
        importance_score: 0.1
      }],
      combined_context: fallbackMessage,
      confidence: 0.3,
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