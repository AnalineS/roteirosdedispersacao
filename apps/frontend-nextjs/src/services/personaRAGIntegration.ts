/**
 * Persona RAG Integration Service
 * Integra personas do sistema com RAG para respostas contextualizadas
 * Substitui backend OpenRouter com sistema RAG local/Supabase
 */

import { ragIntegrationService, IntegratedRAGResponse } from './ragIntegrationService';
import { ragPerformanceOptimizer } from './ragPerformanceOptimizer';
// Removido: AnalyticsFirestoreCache (usando localStorage apenas)
import { conversationCache } from './simpleCache';

interface ConversationMessage {
  id?: string; // Optional para compatibilidade com ChatMessage
  role: 'user' | 'assistant';
  content: string;
  timestamp: string | number | Date; // Flexível para compatibilidade com ChatMessage
  persona?: string;
  query?: string;
  metadata?: {
    confidence?: number;
    sources?: string[];
    processingTime?: number;
  };
}

interface UserProfile {
  id: string;
  preferredPersona: 'dr_gasnelio' | 'ga';
  expertiseLevel: 'beginner' | 'intermediate' | 'advanced';
  interactionHistory: {
    totalQueries: number;
    favoriteTopics: string[];
    avgSessionDuration: number;
    lastActive: Date;
  };
  personalizationSettings: {
    technicalLevel: 'low' | 'medium' | 'high';
    preferredResponseLength: 'short' | 'medium' | 'long';
    includeExamples: boolean;
    includeCitations: boolean;
  };
  // Propriedades adicionais usadas no código
  userId: string;
  commonTopics: string[];
  preferredExplanationStyle: 'balanced' | 'simple' | 'detailed' | 'technical';
  interactions: number;
  lastInteraction: number;
}

interface ContextualInfo {
  previousQueries?: string[];
  currentTopic?: string;
  userExpertiseLevel?: string;
  conversationFlow?: string;
  relevantHistory?: ConversationMessage[];
}

interface PersonaAnalysis {
  selectedPersona: string;
  confidence: number;
  reasoning: string[];
  adaptations: string[];
  alternativePersona?: string;
  complexity: 'simple' | 'medium' | 'complex';
  emotionalTone: 'neutral' | 'anxious' | 'urgent';
  technicalLevel: 'basic' | 'intermediate' | 'advanced';
  intent: 'information' | 'dosage' | 'safety' | 'support';
}

interface UserPreference {
  preferredPersona: 'dr_gasnelio' | 'ga';
  technicalLevel: 'high' | 'medium' | 'low';
  responseStyle: 'detailed' | 'concise' | 'examples';
  topicPreferences: string[];
  interactionStyle: 'formal' | 'casual' | 'educational';
  interactions?: number;
}

interface PersonaError {
  code: string;
  message: string;
  persona?: string;
  userId?: string;
  query?: string;
  timestamp: Date;
  recoverable: boolean;
}

export interface PersonaConfig {
  id: 'dr_gasnelio' | 'ga';
  name: string;
  description: string;
  expertise: string[];
  tone: 'professional' | 'empathetic' | 'educational';
  specialties: string[];
  responseStyle: {
    formality: 'formal' | 'casual';
    technicality: 'high' | 'medium' | 'low';
    empathy: 'high' | 'medium' | 'low';
    examples: boolean;
    citations: boolean;
  };
  ragSettings: {
    useEnhanced: boolean;
    maxChunks: number;
    minSimilarity: number;
    preferredCategories: string[];
  };
}

export interface PersonaResponse {
  // Campos base de resposta
  response: string; // Texto da resposta
  persona: string; // ID da persona
  confidence: number;
  sources: string[];
  
  // Campos personalizados
  personaConfig?: PersonaConfig;
  personalizationScore: number;
  adaptations: string[];
  contextRelevance: number;
  userSatisfactionPrediction: number;
  
  // Campos opcionais para compatibilidade
  ragSources?: string[];
  personaAdapted?: boolean;
  processingTime?: number;
  fallbackUsed?: boolean;
  analytics?: {
    queryTime: number;
    personaId: string;
    confidence: number;
    sourcesUsed: number;
  };
}

export class PersonaRAGIntegration {
  private static instance: PersonaRAGIntegration;
  private personaConfigs: Map<string, PersonaConfig> = new Map();
  private conversationHistory: Map<string, ConversationMessage[]> = new Map();
  private userProfiles: Map<string, UserProfile> = new Map();

  private stats = {
    totalInteractions: 0,
    personaUsage: {} as Record<string, number>,
    avgPersonalizationScore: 0,
    contextRelevanceScore: 0,
    userSatisfactionScore: 0
  };

  private constructor() {
    this.initializePersonas();
  }

  static getInstance(): PersonaRAGIntegration {
    if (!PersonaRAGIntegration.instance) {
      PersonaRAGIntegration.instance = new PersonaRAGIntegration();
    }
    return PersonaRAGIntegration.instance;
  }

  /**
   * Query principal integrando persona com RAG
   */
  async queryWithPersona(
    query: string,
    personaId: 'dr_gasnelio' | 'ga',
    userId?: string,
    conversationContext?: ConversationMessage[]
  ): Promise<PersonaResponse> {
    const startTime = Date.now();

    try {
      // Obter configuração da persona
      const persona = this.personaConfigs.get(personaId);
      if (!persona) {
        throw new Error(`Persona ${personaId} não encontrada`);
      }

      // Atualizar perfil do usuário
      if (userId) {
        this.updateUserProfile(userId, query, personaId);
      }

      // Personalizar query baseado na persona
      const personalizedQuery = await this.personalizeQuery(query, persona, userId);

      // Executar RAG otimizado
      const ragResponse = await ragPerformanceOptimizer.optimizedQuery(
        personalizedQuery,
        personaId,
        {
          maxChunks: persona.ragSettings.maxChunks,
          enhanceWithLLM: persona.ragSettings.useEnhanced,
          categories: persona.ragSettings.preferredCategories
        }
      );

      if (!ragResponse) {
        throw new Error('RAG system returned null response');
      }

      // Converter RAGQueryResult para IntegratedRAGResponse
      const integratedResponse: IntegratedRAGResponse = {
        answer: ragResponse.response,
        context: {
          chunks: [],
          totalScore: ragResponse.confidence,
          sourceFiles: ragResponse.sources,
          chunkTypes: ['medical_guidance'],
          confidenceLevel: ragResponse.confidence > 0.8 ? 'high' : ragResponse.confidence > 0.5 ? 'medium' : 'low',
          metadata: {
            query,
            searchTimeMs: ragResponse.processingTime,
            similarityThreshold: 0.7,
            chunksFound: ragResponse.sources.length
          }
        },
        persona: personaId,
        qualityScore: ragResponse.confidence,
        sources: ragResponse.sources,
        limitations: [],
        generatedAt: new Date().toISOString(),
        processingTimeMs: ragResponse.processingTime,
        strategy: 'hybrid',
        knowledgeSource: 'persona_rag_integration',
        processingSteps: ['query_analysis', 'persona_selection', 'rag_execution', 'response_adaptation']
      };

      // Adaptar resposta à persona
      const adaptedResponse = await this.adaptResponseToPersona(
        integratedResponse,
        persona,
        query,
        userId
      );

      // Calcular métricas de personalização
      const personalizationMetrics = this.calculatePersonalizationMetrics(
        adaptedResponse,
        persona,
        query
      );

      const personaResponse: PersonaResponse = {
        response: adaptedResponse.answer || '',
        persona: personaId,
        confidence: adaptedResponse.qualityScore || 0.8,
        sources: adaptedResponse.sources || [],
        personaConfig: persona,
        personalizationScore: personalizationMetrics.personalizationScore,
        adaptations: personalizationMetrics.adaptations,
        contextRelevance: personalizationMetrics.contextRelevance,
        userSatisfactionPrediction: personalizationMetrics.userSatisfactionPrediction,
        ragSources: adaptedResponse.sources || [],
        personaAdapted: true,
        processingTime: Date.now() - startTime,
        fallbackUsed: false,
        analytics: {
          queryTime: Date.now() - startTime,
          personaId: personaId,
          confidence: adaptedResponse.qualityScore || 0.8,
          sourcesUsed: adaptedResponse.sources?.length || 0
        }
      };

      // Salvar contexto da conversa
      if (userId) {
        this.updateConversationHistory(userId, query, personaResponse);
      }

      // Track analytics
      await this.trackPersonaInteraction(personaId, personaResponse, userId);

      // Atualizar estatísticas
      this.updateStats(personaId, personaResponse);

      return personaResponse;

    } catch (error) {
      // Critical medical persona error - explicit stderr + tracking
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Explicit error to stderr for medical system visibility
      if (typeof process !== 'undefined' && process.stderr) {
        process.stderr.write(`❌ ERRO CRÍTICO - Falha na integração PersonaRAG médica:\n` +
          `  PersonaID: ${personaId}\n` +
          `  Query: ${query.substring(0, 100)}...\n` +
          `  UserID: ${userId || 'anonymous'}\n` +
          `  Error: ${errorMessage}\n` +
          `  ProcessingTime: ${Date.now() - startTime}ms\n\n`);
      }

      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'medical_persona_rag_integration_error', {
          event_category: 'medical_error_critical',
          event_label: 'persona_rag_query_failed',
          custom_parameters: {
            medical_context: 'critical_persona_rag_error',
            persona_id: personaId,
            user_id: userId || 'anonymous',
            query_length: query.length,
            error_type: 'persona_rag_integration_failure',
            error_message: errorMessage,
            processing_time_ms: Date.now() - startTime
          }
        });
      }

      return this.generateFallbackPersonaResponse(query, personaId, error);
    }
  }

  /**
   * Recomenda persona baseado na query
   */
  async recommendPersona(
    query: string,
    userId?: string,
    context?: ContextualInfo
  ): Promise<{
    recommendedPersona: 'dr_gasnelio' | 'ga';
    confidence: number;
    reasoning: string;
    alternatives: Array<{
      persona: string;
      score: number;
      reason: string;
    }>;
  }> {
    try {
      // Analisar query para detectar necessidades
      const analysis = this.analyzeQueryForPersona(query);
      
      // Considerar histórico do usuário
      const userPreference = userId ? this.getUserPersonaPreference(userId) : null;
      
      // Calcular scores para cada persona
      const defaultUserPreference: UserPreference = {
        preferredPersona: 'dr_gasnelio',
        technicalLevel: 'medium',
        responseStyle: 'detailed',
        topicPreferences: [],
        interactionStyle: 'educational'
      };

      const drGasnelioScore = this.calculatePersonaScore('dr_gasnelio', {
        ...analysis,
        selectedPersona: 'dr_gasnelio',
        confidence: 0.8,
        reasoning: [],
        adaptations: []
      }, userPreference || defaultUserPreference);
      const gaScore = this.calculatePersonaScore('ga', {
        ...analysis,
        selectedPersona: 'ga',
        confidence: 0.8,
        reasoning: [],
        adaptations: []
      }, userPreference || defaultUserPreference);
      
      const recommendedPersona = drGasnelioScore > gaScore ? 'dr_gasnelio' : 'ga';
      const confidence = Math.max(drGasnelioScore, gaScore);
      
      return {
        recommendedPersona,
        confidence,
        reasoning: this.generateRecommendationReasoning(recommendedPersona, {
          ...analysis,
          selectedPersona: recommendedPersona,
          confidence,
          reasoning: [],
          adaptations: []
        }),
        alternatives: [
          {
            persona: recommendedPersona === 'dr_gasnelio' ? 'ga' : 'dr_gasnelio',
            score: recommendedPersona === 'dr_gasnelio' ? gaScore : drGasnelioScore,
            reason: `Alternativa com foco ${recommendedPersona === 'dr_gasnelio' ? 'empático' : 'técnico'}`
          }
        ]
      };

    } catch (error) {
      // Medical persona recommendation error - explicit stderr + tracking
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Explicit error to stderr for medical system visibility
      if (typeof process !== 'undefined' && process.stderr) {
        process.stderr.write(`❌ ERRO - Falha na recomendação de persona médica:\n` +
          `  Query: ${query.substring(0, 100)}...\n` +
          `  UserID: ${userId || 'anonymous'}\n` +
          `  Error: ${errorMessage}\n\n`);
      }

      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'medical_persona_recommendation_error', {
          event_category: 'medical_error_critical',
          event_label: 'persona_recommendation_failed',
          custom_parameters: {
            medical_context: 'persona_recommendation_system',
            user_id: userId || 'anonymous',
            query_length: query.length,
            error_type: 'persona_recommendation_failure',
            error_message: errorMessage,
            fallback_persona: 'dr_gasnelio'
          }
        });
      }

      return {
        recommendedPersona: 'dr_gasnelio',
        confidence: 0.5,
        reasoning: 'Fallback para Dr. Gasnelio devido a erro no sistema',
        alternatives: []
      };
    }
  }

  /**
   * Obtém estatísticas das personas
   */
  getPersonaStats() {
    return {
      ...this.stats,
      personaConfigs: Array.from(this.personaConfigs.values()).map(p => ({
        id: p.id,
        name: p.name,
        usage: this.stats.personaUsage[p.id] || 0
      })),
      totalUsers: this.userProfiles.size,
      avgInteractionsPerUser: this.userProfiles.size > 0 ? 
        this.stats.totalInteractions / this.userProfiles.size : 0
    };
  }

  /**
   * Configura persona personalizada
   */
  configurePersona(personaId: string, config: Partial<PersonaConfig>): void {
    const existingConfig = this.personaConfigs.get(personaId);
    if (existingConfig) {
      this.personaConfigs.set(personaId, { ...existingConfig, ...config });
    }
  }

  // MÉTODOS PRIVADOS

  private initializePersonas(): void {
    // Dr. Gasnelio - Farmacêutico Clínico
    this.personaConfigs.set('dr_gasnelio', {
      id: 'dr_gasnelio',
      name: 'Dr. Gasnelio',
      description: 'Farmacêutico Clínico Especialista em Hanseníase',
      expertise: ['farmacologia', 'hanseníase', 'pqt', 'dispensação', 'interações'],
      tone: 'professional',
      specialties: ['dosagem', 'contraindicações', 'interações medicamentosas', 'monitoramento'],
      responseStyle: {
        formality: 'formal',
        technicality: 'high',
        empathy: 'medium',
        examples: true,
        citations: true
      },
      ragSettings: {
        useEnhanced: true,
        maxChunks: 5,
        minSimilarity: 0.7,
        preferredCategories: ['dosage', 'contraindication', 'interaction', 'protocol']
      }
    });

    // Gá - Assistente Empática
    this.personaConfigs.set('ga', {
      id: 'ga',
      name: 'Gá',
      description: 'Assistente Empática para Orientação Humanizada',
      expertise: ['orientação', 'apoio', 'educação', 'adesão', 'cuidados'],
      tone: 'empathetic',
      specialties: ['orientações simples', 'apoio emocional', 'adesão ao tratamento'],
      responseStyle: {
        formality: 'casual',
        technicality: 'low',
        empathy: 'high',
        examples: true,
        citations: false
      },
      ragSettings: {
        useEnhanced: true,
        maxChunks: 3,
        minSimilarity: 0.6,
        preferredCategories: ['general', 'side_effect', 'procedure']
      }
    });
  }

  private async personalizeQuery(
    query: string,
    persona: PersonaConfig,
    userId?: string
  ): Promise<string> {
    let personalizedQuery = query;

    // Adicionar contexto da persona
    if (persona.id === 'dr_gasnelio') {
      // Para Dr. Gasnelio, enfatizar aspectos técnicos
      if (!query.includes('dose') && query.includes('medicament')) {
        personalizedQuery += ' dosagem administração';
      }
      if (query.includes('pode') || query.includes('posso')) {
        personalizedQuery += ' contraindicações segurança';
      }
    } else {
      // Para Gá, enfatizar aspectos práticos e humanos
      if (query.includes('medo') || query.includes('preocup')) {
        personalizedQuery += ' orientações tranquilizar';
      }
      if (query.includes('dificil') || query.includes('difícil')) {
        personalizedQuery += ' explicação simples apoio';
      }
    }

    // Considerar histórico do usuário
    if (userId) {
      const userProfile = this.userProfiles.get(userId);
      if (userProfile && userProfile.commonTopics.length > 0) {
        const relevantTopics = userProfile.commonTopics.slice(0, 2).join(' ');
        personalizedQuery += ` ${relevantTopics}`;
      }
    }

    return personalizedQuery.trim();
  }

  private async adaptResponseToPersona(
    ragResponse: IntegratedRAGResponse,
    persona: PersonaConfig,
    originalQuery: string,
    userId?: string
  ): Promise<IntegratedRAGResponse> {
    let adaptedAnswer = ragResponse.answer;
    const adaptations: string[] = [];

    // Adaptar tom e estilo baseado na persona
    if (persona.id === 'dr_gasnelio') {
      // Estilo técnico e formal
      if (!adaptedAnswer.includes('**Dr. Gasnelio')) {
        adaptedAnswer = `**Dr. Gasnelio (Farmacêutico Clínico):**\n\n${adaptedAnswer}`;
        adaptations.push('Adicionado cabeçalho profissional');
      }

      // Adicionar informações técnicas se disponíveis
      if (ragResponse.sources.length > 0 && persona.responseStyle.citations) {
        adaptedAnswer += `\n\n**Fontes consultadas:**\n${ragResponse.sources.map(s => `• ${s}`).join('\n')}`;
        adaptations.push('Adicionadas citações técnicas');
      }

      // Adicionar alertas de segurança se relevante
      if (originalQuery.includes('dose') || originalQuery.includes('quantidade')) {
        adaptedAnswer += '\n\n⚠️ **Importante:** Para dosagens específicas, sempre confirme com prescrição médica.';
        adaptations.push('Adicionado alerta de segurança');
      }

    } else {
      // Estilo empático e casual para Gá
      if (!adaptedAnswer.includes('**Gá')) {
        adaptedAnswer = `**Gá (Assistente Empática):**\n\n${adaptedAnswer}`;
        adaptations.push('Adicionado cabeçalho empático');
      }

      // Tornar linguagem mais acessível
      adaptedAnswer = this.simplifyMedicalLanguage(adaptedAnswer);
      adaptations.push('Linguagem médica simplificada');

      // Adicionar apoio emocional se apropriado
      if (this.detectsAnxietyInQuery(originalQuery)) {
        adaptedAnswer += '\n\n💙 Lembre-se: você não está sozinho(a) neste tratamento. É normal ter dúvidas, e estou aqui para ajudar! 😊';
        adaptations.push('Adicionado apoio emocional');
      }

      // Remover citações técnicas para manter simplicidade
      if (adaptedAnswer.includes('**Fontes consultadas:**')) {
        adaptedAnswer = adaptedAnswer.split('**Fontes consultadas:**')[0].trim();
        adaptations.push('Removidas citações técnicas');
      }
    }

    // Personalizar baseado no histórico do usuário
    if (userId) {
      const userProfile = this.userProfiles.get(userId);
      if (userProfile && userProfile.preferredExplanationStyle) {
        adaptedAnswer = this.adaptToUserStyle(adaptedAnswer, userProfile.preferredExplanationStyle);
        adaptations.push('Adaptado ao estilo preferido do usuário');
      }
    }

    return {
      ...ragResponse,
      answer: adaptedAnswer,
      processingSteps: [
        ...ragResponse.processingSteps,
        `Adaptado para persona ${persona.name}`,
        ...adaptations
      ]
    };
  }

  private calculatePersonalizationMetrics(
    response: IntegratedRAGResponse,
    persona: PersonaConfig,
    query: string
  ): {
    personalizationScore: number;
    adaptations: string[];
    contextRelevance: number;
    userSatisfactionPrediction: number;
  } {
    let personalizationScore = 0;
    const adaptations = response.processingSteps.filter(step => 
      step.includes('Adaptado') || step.includes('Adicionado')
    );

    // Score baseado nas adaptações feitas
    personalizationScore += adaptations.length * 15; // Máximo 15 pontos por adaptação

    // Score baseado na adequação do tom
    if (persona.id === 'dr_gasnelio' && response.answer.includes('**Dr. Gasnelio')) {
      personalizationScore += 20;
    } else if (persona.id === 'ga' && response.answer.includes('**Gá')) {
      personalizationScore += 20;
    }

    // Score baseado na qualidade da resposta original
    personalizationScore += response.qualityScore * 30;

    // Relevância do contexto
    const contextRelevance = response.context.confidenceLevel === 'high' ? 0.9 :
                            response.context.confidenceLevel === 'medium' ? 0.7 : 0.5;

    // Predição de satisfação do usuário
    const userSatisfactionPrediction = Math.min(100, 
      (personalizationScore * 0.4) + (contextRelevance * 40) + (response.qualityScore * 20)
    );

    return {
      personalizationScore: Math.min(100, personalizationScore),
      adaptations,
      contextRelevance,
      userSatisfactionPrediction
    };
  }

  private analyzeQueryForPersona(query: string): {
    complexity: 'simple' | 'medium' | 'complex';
    emotionalTone: 'neutral' | 'anxious' | 'urgent';
    technicalLevel: 'basic' | 'intermediate' | 'advanced';
    intent: 'information' | 'dosage' | 'safety' | 'support';
  } {
    const lowerQuery = query.toLowerCase();
    
    // Analisar complexidade
    const wordCount = query.split(' ').length;
    const complexity = wordCount <= 5 ? 'simple' : wordCount <= 12 ? 'medium' : 'complex';

    // Analisar tom emocional
    const anxietyWords = ['medo', 'preocup', 'nervos', 'dúvida', 'não sei'];
    const urgentWords = ['urgente', 'rápido', 'preciso', 'agora'];
    
    let emotionalTone: 'neutral' | 'anxious' | 'urgent' = 'neutral';
    if (urgentWords.some(word => lowerQuery.includes(word))) {
      emotionalTone = 'urgent';
    } else if (anxietyWords.some(word => lowerQuery.includes(word))) {
      emotionalTone = 'anxious';
    }

    // Analisar nível técnico
    const technicalWords = ['dosagem', 'concentração', 'farmacocinética', 'interação'];
    const basicWords = ['como', 'posso', 'pode', 'que é'];
    
    let technicalLevel: 'basic' | 'intermediate' | 'advanced' = 'basic';
    if (technicalWords.some(word => lowerQuery.includes(word))) {
      technicalLevel = 'advanced';
    } else if (!basicWords.some(word => lowerQuery.includes(word))) {
      technicalLevel = 'intermediate';
    }

    // Detectar intent
    let intent: 'information' | 'dosage' | 'safety' | 'support' = 'information';
    if (lowerQuery.includes('dose') || lowerQuery.includes('quantidade')) {
      intent = 'dosage';
    } else if (lowerQuery.includes('perig') || lowerQuery.includes('segur') || lowerQuery.includes('contraindicaç')) {
      intent = 'safety';
    } else if (emotionalTone === 'anxious') {
      intent = 'support';
    }

    return { complexity, emotionalTone, technicalLevel, intent };
  }

  private calculatePersonaScore(
    personaId: string,
    analysis: PersonaAnalysis,
    userPreference: UserPreference
  ): number {
    let score = 0.5; // Base score

    if (personaId === 'dr_gasnelio') {
      // Dr. Gasnelio é melhor para queries técnicas
      if (analysis.technicalLevel === 'advanced') score += 0.3;
      if (analysis.intent === 'dosage' || analysis.intent === 'safety') score += 0.2;
      if (analysis.complexity === 'complex') score += 0.1;
    } else {
      // Gá é melhor para suporte emocional e queries simples
      if (analysis.emotionalTone === 'anxious') score += 0.3;
      if (analysis.intent === 'support') score += 0.2;
      if (analysis.technicalLevel === 'basic') score += 0.2;
    }

    // Considerar preferência do usuário
    if (userPreference && userPreference.preferredPersona === personaId) {
      score += 0.1;
    }

    return Math.min(1.0, score);
  }

  private generateRecommendationReasoning(persona: string, analysis: PersonaAnalysis): string {
    if (persona === 'dr_gasnelio') {
      if (analysis.technicalLevel === 'advanced') {
        return 'Recomendado Dr. Gasnelio para consulta técnica especializada';
      } else if (analysis.intent === 'dosage') {
        return 'Dr. Gasnelio é especialista em dosagens e protocolos';
      } else {
        return 'Dr. Gasnelio oferece orientação profissional detalhada';
      }
    } else {
      if (analysis.emotionalTone === 'anxious') {
        return 'Gá oferece suporte empático para suas preocupações';
      } else if (analysis.technicalLevel === 'basic') {
        return 'Gá explica de forma simples e acessível';
      } else {
        return 'Gá oferece orientação humanizada e acolhedora';
      }
    }
  }

  private simplifyMedicalLanguage(text: string): string {
    const replacements: Record<string, string> = {
      'administração': 'como tomar',
      'posologia': 'dose',
      'farmacocinética': 'como o remédio funciona no corpo',
      'contraindicação': 'quando não deve usar',
      'efeito adverso': 'efeito colateral',
      'hiperpigmentação': 'escurecimento da pele',
      'metemoglobinemia': 'problema no sangue'
    };

    let simplifiedText = text;
    for (const [technical, simple] of Object.entries(replacements)) {
      const regex = new RegExp(technical, 'gi');
      simplifiedText = simplifiedText.replace(regex, simple);
    }

    return simplifiedText;
  }

  private detectsAnxietyInQuery(query: string): boolean {
    const anxietyIndicators = [
      'medo', 'preocup', 'nervos', 'ansioso', 'dúvida',
      'será que', 'não sei se', 'tenho medo', 'estou com medo'
    ];
    
    const lowerQuery = query.toLowerCase();
    return anxietyIndicators.some(indicator => lowerQuery.includes(indicator));
  }

  private adaptToUserStyle(text: string, style: string): string {
    // Implementar adaptações baseadas no estilo preferido do usuário
    // Por enquanto, retorna o texto original
    return text;
  }

  private updateUserProfile(userId: string, query: string, personaId: string): void {
    let profile = this.userProfiles.get(userId);

    if (!profile) {
      profile = {
        id: userId,
        preferredPersona: personaId as 'dr_gasnelio' | 'ga',
        expertiseLevel: 'beginner',
        interactionHistory: {
          totalQueries: 0,
          favoriteTopics: [],
          avgSessionDuration: 0,
          lastActive: new Date()
        },
        personalizationSettings: {
          technicalLevel: 'low',
          preferredResponseLength: 'medium',
          includeExamples: true,
          includeCitations: false
        },
        userId,
        interactions: 0,
        commonTopics: [],
        preferredExplanationStyle: 'balanced',
        lastInteraction: Date.now()
      };
      this.userProfiles.set(userId, profile);
    }

    if (profile) {
      profile.interactions++;
      profile.lastInteraction = Date.now();

      // Atualizar tópicos comuns
      const topics = this.extractTopicsFromQuery(query);
      for (const topic of topics) {
        if (!profile.commonTopics.includes(topic)) {
          profile.commonTopics.push(topic);
        }
      }

      // Limitar tópicos a 10 mais recentes
      profile.commonTopics = profile.commonTopics.slice(-10);

      this.userProfiles.set(userId, profile);
    }
  }

  private extractTopicsFromQuery(query: string): string[] {
    const topics: string[] = [];
    const lowerQuery = query.toLowerCase();

    const topicPatterns = {
      'rifampicina': /rifampicina?/,
      'dapsona': /dapsona/,
      'clofazimina': /clofazimina/,
      'dosagem': /dose|dosagem|quantidade/,
      'efeitos': /efeito|reação|colateral/,
      'gravidez': /grávida|gravidez|gestante/
    };

    for (const [topic, pattern] of Object.entries(topicPatterns)) {
      if (pattern.test(lowerQuery)) {
        topics.push(topic);
      }
    }

    return topics;
  }

  private getUserPersonaPreference(userId: string): UserPreference | null {
    const profile = this.userProfiles.get(userId);
    return profile ? {
      preferredPersona: profile.preferredPersona,
      technicalLevel: 'medium',
      responseStyle: 'detailed',
      topicPreferences: profile.commonTopics,
      interactionStyle: 'educational',
      interactions: profile.interactions
    } : null;
  }

  private updateConversationHistory(userId: string, query: string, response: PersonaResponse): void {
    let history = this.conversationHistory.get(userId) || [];
    
    history.push({
      id: `msg_${Date.now()}`,
      role: 'assistant' as const,
      content: response.response,
      timestamp: Date.now(),
      query,
      persona: response.persona,
      metadata: {
        confidence: response.confidence,
        processingTime: response.processingTime
      }
    });

    // Manter últimas 50 interações
    if (history.length > 50) {
      history = history.slice(-50);
    }

    this.conversationHistory.set(userId, history);
  }

  private async trackPersonaInteraction(
    personaId: string,
    response: PersonaResponse,
    userId?: string
  ): Promise<void> {
    // Medical persona interaction tracking
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'medical_persona_interaction_completed', {
        event_category: 'medical_persona_tracking',
        event_label: 'persona_interaction_success',
        custom_parameters: {
          medical_context: 'persona_interaction_tracking',
          persona_id: personaId,
          user_id: userId || 'anonymous',
          response_confidence: Math.round((response.confidence || 0) * 100),
          personalization_score: Math.round(response.personalizationScore || 0),
          processing_time_ms: response.processingTime || 0,
          sources_used: response.sources?.length || 0,
          fallback_used: response.fallbackUsed || false
        }
      });
    }
  }

  private updateStats(personaId: string, response: PersonaResponse): void {
    this.stats.totalInteractions++;
    
    if (!this.stats.personaUsage[personaId]) {
      this.stats.personaUsage[personaId] = 0;
    }
    this.stats.personaUsage[personaId]++;

    // Atualizar médias
    const total = this.stats.totalInteractions;
    this.stats.avgPersonalizationScore = 
      (this.stats.avgPersonalizationScore * (total - 1) + response.personalizationScore) / total;
    
    this.stats.contextRelevanceScore = 
      (this.stats.contextRelevanceScore * (total - 1) + response.contextRelevance) / total;
    
    this.stats.userSatisfactionScore = 
      (this.stats.userSatisfactionScore * (total - 1) + response.userSatisfactionPrediction) / total;
  }

  private generateFallbackPersonaResponse(
    query: string,
    personaId: string,
    error: PersonaError | Error | unknown
  ): PersonaResponse {
    const persona = this.personaConfigs.get(personaId);
    const fallbackAnswer = persona?.id === 'dr_gasnelio'
      ? `**Dr. Gasnelio:** Temporariamente não consigo acessar minha base de conhecimento completa. Para sua consulta sobre "${query}", recomendo confirmar com literatura médica atualizada ou contato direto com profissional especializado.`
      : `**Gá:** Oops! Estou com um probleminha técnico agora. Para sua dúvida sobre "${query}", que tal conversarmos quando eu estiver 100%? Enquanto isso, pode procurar seu médico ou farmacêutico! 😊`;

    return {
      response: fallbackAnswer,
      persona: personaId,
      confidence: 0.3,
      sources: [],
      personaConfig: persona,
      personalizationScore: 0.2,
      adaptations: ['Resposta de fallback personalizada'],
      contextRelevance: 0.1,
      userSatisfactionPrediction: 0.3,
      ragSources: [],
      personaAdapted: false,
      processingTime: 0,
      fallbackUsed: true,
      analytics: {
        queryTime: 0,
        personaId: personaId,
        confidence: 0.3,
        sourcesUsed: 0
      }
    };
  }
}

// Removed duplicate UserProfile interface - using the one defined at the top

// Instância singleton
export const personaRAGIntegration = PersonaRAGIntegration.getInstance();

// Funções de conveniência
export async function queryPersonaRAG(
  query: string,
  personaId: 'dr_gasnelio' | 'ga',
  userId?: string,
  context?: ConversationMessage[]
): Promise<PersonaResponse> {
  return personaRAGIntegration.queryWithPersona(query, personaId, userId, context);
}

export async function recommendPersonaForQuery(
  query: string,
  userId?: string
): Promise<ReturnType<PersonaRAGIntegration['recommendPersona']>> {
  return personaRAGIntegration.recommendPersona(query, userId);
}

export function getPersonaStats() {
  return personaRAGIntegration.getPersonaStats();
}

export default personaRAGIntegration;