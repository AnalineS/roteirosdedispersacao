/**
 * Sistema de Fallbacks Inteligentes
 * Garante que o usuário sempre receba uma resposta útil
 */

import { SentimentResult, SentimentCategory } from './sentimentAnalysis';
import { AstraResponse } from './astraClient';

export interface FallbackOptions {
  useLocalKnowledge?: boolean;
  includeEmergencyContacts?: boolean;
  adaptToSentiment?: boolean;
  maxRetries?: number;
  timeoutMs?: number;
}

export interface FallbackResult {
  success: boolean;
  response: string;
  source: 'cache' | 'local_knowledge' | 'emergency' | 'generic';
  confidence: number;
  suggestion?: string;
  emergency_contact?: string;
}

export class FallbackSystem {
  private static instance: FallbackSystem;
  private localKnowledge: Map<string, any>;
  private emergencyResponses: Map<string, string>;
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  
  private constructor() {
    this.localKnowledge = new Map();
    this.emergencyResponses = new Map();
    this.initializeLocalKnowledge();
    this.initializeEmergencyResponses();
  }
  
  static getInstance(): FallbackSystem {
    if (!FallbackSystem.instance) {
      FallbackSystem.instance = new FallbackSystem();
    }
    return FallbackSystem.instance;
  }
  
  /**
   * Executa fallback baseado no tipo de falha
   */
  async executeFallback(
    originalQuery: string,
    failureType: 'network' | 'timeout' | 'server_error' | 'data_corruption' | 'unknown',
    sentiment?: SentimentResult,
    options: FallbackOptions = {}
  ): Promise<FallbackResult> {
    const {
      useLocalKnowledge = true,
      includeEmergencyContacts = true,
      adaptToSentiment = true,
      maxRetries = 3,
      timeoutMs = 5000
    } = options;
    
    // Registrar falha
    this.recordFailure();
    
    // Estratégia de fallback baseada no tipo de falha
    switch (failureType) {
      case 'network':
      case 'timeout':
        return this.handleNetworkFallback(originalQuery, sentiment, options);
        
      case 'server_error':
        return this.handleServerErrorFallback(originalQuery, sentiment, options);
        
      case 'data_corruption':
        return this.handleDataCorruptionFallback(originalQuery, sentiment, options);
        
      default:
        return this.handleGenericFallback(originalQuery, sentiment, options);
    }
  }
  
  /**
   * Fallback para problemas de rede
   */
  private async handleNetworkFallback(
    query: string,
    sentiment?: SentimentResult,
    options: FallbackOptions = {}
  ): Promise<FallbackResult> {
    // Prioridade 1: Cache local
    const cachedResponse = this.searchLocalCache(query);
    if (cachedResponse) {
      return {
        success: true,
        response: this.adaptResponseToSentiment(cachedResponse, sentiment),
        source: 'cache',
        confidence: 0.8,
        suggestion: 'Resposta baseada em cache local. Conexão pode estar instável.'
      };
    }
    
    // Prioridade 2: Conhecimento local
    const localResponse = this.searchLocalKnowledge(query);
    if (localResponse) {
      return {
        success: true,
        response: this.adaptResponseToSentiment(localResponse, sentiment),
        source: 'local_knowledge',
        confidence: 0.6,
        suggestion: 'Resposta baseada em conhecimento local. Recomendo tentar novamente quando a conexão melhorar.'
      };
    }
    
    // Prioridade 3: Resposta de emergência
    return this.getEmergencyResponse(query, 'network', sentiment);
  }
  
  /**
   * Fallback para erros do servidor
   */
  private async handleServerErrorFallback(
    query: string,
    sentiment?: SentimentResult,
    options: FallbackOptions = {}
  ): Promise<FallbackResult> {
    // Para erros do servidor, usar conhecimento local primeiro
    const localResponse = this.searchLocalKnowledge(query);
    if (localResponse) {
      return {
        success: true,
        response: this.adaptResponseToSentiment(localResponse, sentiment),
        source: 'local_knowledge',
        confidence: 0.7,
        suggestion: 'Sistema principal temporariamente indisponível. Resposta baseada em conhecimento local.'
      };
    }
    
    return this.getEmergencyResponse(query, 'server_error', sentiment);
  }
  
  /**
   * Fallback para dados corrompidos
   */
  private async handleDataCorruptionFallback(
    query: string,
    sentiment?: SentimentResult,
    options: FallbackOptions = {}
  ): Promise<FallbackResult> {
    // Para dados corrompidos, não usar cache - ir direto para conhecimento local
    const localResponse = this.searchLocalKnowledge(query);
    if (localResponse) {
      return {
        success: true,
        response: this.adaptResponseToSentiment(localResponse, sentiment),
        source: 'local_knowledge',
        confidence: 0.6,
        suggestion: 'Detectado problema nos dados. Usando conhecimento local verificado.'
      };
    }
    
    return this.getEmergencyResponse(query, 'data_corruption', sentiment);
  }
  
  /**
   * Fallback genérico
   */
  private async handleGenericFallback(
    query: string,
    sentiment?: SentimentResult,
    options: FallbackOptions = {}
  ): Promise<FallbackResult> {
    return this.getEmergencyResponse(query, 'unknown', sentiment);
  }
  
  /**
   * Busca no cache local
   */
  private searchLocalCache(query: string): string | null {
    // Simular busca em cache local
    const normalizedQuery = query.toLowerCase().trim();
    
    const cacheData = [
      {
        key: 'rifampicina dose',
        response: 'A rifampicina é administrada na dose de 600mg uma vez por mês, sempre sob supervisão profissional.'
      },
      {
        key: 'clofazimina efeito',
        response: 'A clofazimina pode causar hiperpigmentação da pele, que é reversível após o tratamento.'
      },
      {
        key: 'dapsona dose',
        response: 'A dapsona é administrada na dose de 100mg diariamente por via oral.'
      },
      {
        key: 'tratamento duração',
        response: 'O tratamento PQT-U tem duração de 6 doses mensais supervisionadas.'
      }
    ];
    
    for (const item of cacheData) {
      if (normalizedQuery.includes(item.key.split(' ')[0]) && 
          normalizedQuery.includes(item.key.split(' ')[1])) {
        return item.response;
      }
    }
    
    return null;
  }
  
  /**
   * Busca no conhecimento local
   */
  private searchLocalKnowledge(query: string): string | null {
    const normalizedQuery = query.toLowerCase();
    
    // Base de conhecimento essencial local
    const knowledgeBase = [
      {
        keywords: ['rifampin', 'dose', 'quantidade'],
        response: 'A rifampicina é o medicamento principal do esquema PQT-U, administrada mensalmente sob supervisão. Para informações específicas de dosagem, consulte um profissional de saúde.'
      },
      {
        keywords: ['clofazimin', 'pele', 'cor', 'escura'],
        response: 'A clofazimina pode causar escurecimento temporário da pele. Este efeito é normal e reversível. Continue o tratamento conforme orientação médica.'
      },
      {
        keywords: ['dapsona', 'diário', 'casa'],
        response: 'A dapsona é tomada diariamente em casa. É importante não interromper o uso sem orientação médica.'
      },
      {
        keywords: ['efeito', 'colateral', 'adverso', 'reação'],
        response: 'Efeitos adversos podem ocorrer durante o tratamento. Os mais comuns são coloração da urina (rifampicina) e escurecimento da pele (clofazimina). Procure orientação médica se tiver dúvidas.'
      },
      {
        keywords: ['tempo', 'duração', 'quanto', 'meses'],
        response: 'O tratamento PQT-U dura 6 meses, com doses mensais supervisionadas. É fundamental completar todo o tratamento para garantir a cura.'
      },
      {
        keywords: ['gravidez', 'gestante', 'grávida'],
        response: 'O tratamento para hanseníase pode ser realizado durante a gravidez com adaptações. É essencial acompanhamento médico especializado.'
      }
    ];
    
    for (const item of knowledgeBase) {
      if (item.keywords.some(keyword => normalizedQuery.includes(keyword))) {
        return item.response;
      }
    }
    
    return null;
  }
  
  /**
   * Resposta de emergência
   */
  private getEmergencyResponse(
    query: string,
    failureType: string,
    sentiment?: SentimentResult
  ): FallbackResult {
    let baseResponse = '';
    let emergencyContact = '';
    
    // Adaptar resposta ao sentimento
    if (sentiment?.category === SentimentCategory.ANXIOUS) {
      baseResponse = 'Compreendo sua preocupação. Embora eu não possa acessar todas as informações no momento, posso assegurar que o tratamento para hanseníase é seguro e eficaz quando seguido corretamente.';
      emergencyContact = 'Para informações urgentes, procure: Posto de Saúde mais próximo ou ligue 136 (Disque Saúde)';
    } else if (sentiment?.category === SentimentCategory.FRUSTRATED) {
      baseResponse = 'Entendo sua frustração. O sistema está temporariamente indisponível, mas posso orientar sobre o básico do tratamento PQT-U.';
      emergencyContact = 'Para respostas mais específicas: Unidade Básica de Saúde ou Ambulatório de Hanseníase';
    } else {
      baseResponse = 'Sistema temporariamente indisponível. O tratamento para hanseníase (PQT-U) é padronizado e eficaz - continue seguindo as orientações do seu médico.';
      emergencyContact = 'Para mais informações: Ministério da Saúde - Disque 136';
    }
    
    // Adicionar informações específicas por tipo de consulta
    if (query.toLowerCase().includes('dose') || query.toLowerCase().includes('quantidade')) {
      baseResponse += ' Lembre-se: não altere doses sem orientação médica.';
    } else if (query.toLowerCase().includes('efeito') || query.toLowerCase().includes('reação')) {
      baseResponse += ' Se apresentar reações adversas intensas, procure atendimento médico.';
    }
    
    return {
      success: true,
      response: baseResponse,
      source: 'emergency',
      confidence: 0.4,
      suggestion: 'Sistema indisponível. Recomendo consultar profissional de saúde para informações específicas.',
      emergency_contact: emergencyContact
    };
  }
  
  /**
   * Adapta resposta ao sentimento do usuário
   */
  private adaptResponseToSentiment(baseResponse: string, sentiment?: SentimentResult): string {
    if (!sentiment) return baseResponse;
    
    switch (sentiment.category) {
      case SentimentCategory.ANXIOUS:
        return `Entendo sua preocupação. ${baseResponse} Lembre-se que você não está sozinho(a) neste tratamento.`;
        
      case SentimentCategory.FRUSTRATED:
        return `${baseResponse} Espero que isso esclareça sua dúvida de forma mais direta.`;
        
      case SentimentCategory.POSITIVE:
        return `${baseResponse} Fico feliz em poder ajudar!`;
        
      default:
        return baseResponse;
    }
  }
  
  /**
   * Inicializa conhecimento local essencial
   */
  private initializeLocalKnowledge(): void {
    // Informações críticas que devem estar sempre disponíveis
    const essentialKnowledge = [
      'O tratamento PQT-U é seguro e eficaz quando seguido corretamente',
      'Nunca interrompa o tratamento sem orientação médica',
      'Efeitos como coloração da urina e escurecimento da pele são normais',
      'O tratamento dura 6 meses com doses mensais supervisionadas',
      'A hanseníase tem cura quando tratada adequadamente'
    ];
    
    essentialKnowledge.forEach((info, index) => {
      this.localKnowledge.set(`essential_${index}`, info);
    });
  }
  
  /**
   * Inicializa respostas de emergência
   */
  private initializeEmergencyResponses(): void {
    this.emergencyResponses.set('network', 'Conexão temporariamente indisponível. Continue seu tratamento normalmente e tente novamente mais tarde.');
    this.emergencyResponses.set('server_error', 'Sistema em manutenção. Para dúvidas urgentes, procure seu posto de saúde.');
    this.emergencyResponses.set('data_corruption', 'Problema nos dados detectado. Recomendo consultar profissional de saúde.');
  }
  
  /**
   * Registra falha para monitoramento
   */
  private recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
  }
  
  /**
   * Retorna estatísticas de falhas
   */
  getFailureStats(): { count: number; lastFailure: number; systemHealth: string } {
    const timeSinceLastFailure = Date.now() - this.lastFailureTime;
    let systemHealth = 'good';
    
    if (this.failureCount > 10 && timeSinceLastFailure < 300000) { // 5 minutos
      systemHealth = 'degraded';
    } else if (this.failureCount > 20) {
      systemHealth = 'critical';
    }
    
    return {
      count: this.failureCount,
      lastFailure: this.lastFailureTime,
      systemHealth
    };
  }
  
  /**
   * Reset do contador de falhas
   */
  resetFailureCount(): void {
    this.failureCount = 0;
    this.lastFailureTime = 0;
  }
}

// Instância global
export const fallbackSystem = FallbackSystem.getInstance();

// Helpers convenientes
export async function executeSmartFallback(
  query: string,
  error: Error,
  sentiment?: SentimentResult
): Promise<FallbackResult> {
  let failureType: 'network' | 'timeout' | 'server_error' | 'data_corruption' | 'unknown' = 'unknown';
  
  // Detectar tipo de erro
  if (error.message.includes('network') || error.message.includes('fetch')) {
    failureType = 'network';
  } else if (error.message.includes('timeout')) {
    failureType = 'timeout';
  } else if (error.message.includes('500') || error.message.includes('502') || error.message.includes('503')) {
    failureType = 'server_error';
  } else if (error.message.includes('corrupt') || error.message.includes('invalid')) {
    failureType = 'data_corruption';
  }
  
  return fallbackSystem.executeFallback(query, failureType, sentiment);
}

export function getSystemHealth(): string {
  return fallbackSystem.getFailureStats().systemHealth;
}