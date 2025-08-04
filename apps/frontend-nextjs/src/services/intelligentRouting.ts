/**
 * Serviço de Roteamento Inteligente para Personas
 * Analisa perguntas e determina qual persona deve responder
 */

import { detectQuestionScope } from './api';
import type { Persona } from './api';

export interface RoutingAnalysis {
  recommendedPersonaId: string;
  confidence: number;
  reasoning: string;
  scope: string;
  alternatives: Array<{
    personaId: string;
    confidence: number;
    reasoning: string;
  }>;
}

export interface PersonaExpertise {
  personaId: string;
  expertiseAreas: string[];
  keywords: string[];
  specialties: string[];
}

// Mapeamento de expertise das personas
const PERSONAS_EXPERTISE: Record<string, PersonaExpertise> = {
  dr_gasnelio: {
    personaId: 'dr_gasnelio',
    expertiseAreas: ['clinical', 'dosage', 'protocols', 'diagnosis', 'treatment'],
    keywords: [
      'dose', 'dosagem', 'mg', 'rifampicina', 'dapsona', 'clofazimina',
      'protocolo', 'tratamento', 'diagnóstico', 'clínico', 'médico',
      'prescrição', 'posologia', 'terapêutica', 'PQT-U', 'PQT',
      'multibacilar', 'paucibacilar', 'MB', 'PB', 'esquema',
      'reação', 'efeito colateral', 'contraindicação', 'interação'
    ],
    specialties: ['Dosagens', 'Protocolos Clínicos', 'Diagnóstico']
  },
  ga: {
    personaId: 'ga',
    expertiseAreas: ['education', 'dispensation', 'family', 'guidance', 'support'],
    keywords: [
      'paciente', 'família', 'educação', 'orientação', 'ensino',
      'dispensação', 'farmácia', 'entrega', 'cronograma', 'organização',
      'aderência', 'adesão', 'motivação', 'apoio', 'comunicação',
      'explicar', 'ensinar', 'orientar', 'acompanhar', 'conversar',
      'dúvidas', 'medo', 'preconceito', 'estigma', 'social'
    ],
    specialties: ['Educação do Paciente', 'Dispensação', 'Apoio Familiar']
  }
};

/**
 * Cache para análises recentes (evita consultas repetidas)
 */
class RoutingCache {
  private cache = new Map<string, { analysis: RoutingAnalysis; timestamp: number }>();
  private readonly TTL = 5 * 60 * 1000; // 5 minutos

  set(question: string, analysis: RoutingAnalysis): void {
    const key = this.normalizeQuestion(question);
    this.cache.set(key, {
      analysis,
      timestamp: Date.now()
    });
    
    // Limpeza automática de cache antigo
    this.cleanupExpired();
  }

  get(question: string): RoutingAnalysis | null {
    const key = this.normalizeQuestion(question);
    const cached = this.cache.get(key);
    
    if (cached && (Date.now() - cached.timestamp) < this.TTL) {
      return cached.analysis;
    }
    
    if (cached) {
      this.cache.delete(key);
    }
    
    return null;
  }

  private normalizeQuestion(question: string): string {
    return question
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private cleanupExpired(): void {
    const now = Date.now();
    Array.from(this.cache.entries()).forEach(([key, value]) => {
      if (now - value.timestamp >= this.TTL) {
        this.cache.delete(key);
      }
    });
  }
}

const routingCache = new RoutingCache();

/**
 * Analisa uma pergunta usando algoritmo local + backend
 */
export async function analyzeQuestionRouting(
  question: string,
  availablePersonas: Record<string, Persona>
): Promise<RoutingAnalysis> {
  try {
    // Verificar cache primeiro
    const cached = routingCache.get(question);
    if (cached) {
      return cached;
    }

    // Análise local baseada em keywords
    const localAnalysis = analyzeLocalKeywords(question, availablePersonas);
    
    // Análise do backend (se disponível)
    let backendAnalysis: any = null;
    try {
      backendAnalysis = await detectQuestionScope(question);
    } catch (error) {
      console.warn('Backend scope detection failed, using local analysis:', error);
    }

    // Combinar análises local e backend
    const combinedAnalysis = combineAnalyses(localAnalysis, backendAnalysis, availablePersonas);
    
    // Cache do resultado
    routingCache.set(question, combinedAnalysis);
    
    return combinedAnalysis;
  } catch (error) {
    console.error('Erro na análise de roteamento:', error);
    
    // Fallback para análise local
    return analyzeLocalKeywords(question, availablePersonas);
  }
}

/**
 * Análise local baseada em keywords e padrões
 */
function analyzeLocalKeywords(
  question: string,
  availablePersonas: Record<string, Persona>
): RoutingAnalysis {
  const normalizedQuestion = question.toLowerCase();
  const scores: Record<string, number> = {};
  const reasonings: Record<string, string[]> = {};

  // Analisar cada persona disponível
  Object.keys(availablePersonas).forEach(personaId => {
    const expertise = PERSONAS_EXPERTISE[personaId];
    if (!expertise) return;

    let score = 0;
    const matchedKeywords: string[] = [];

    // Pontuação por keywords
    expertise.keywords.forEach(keyword => {
      if (normalizedQuestion.includes(keyword.toLowerCase())) {
        score += keyword.length > 6 ? 2 : 1; // Keywords mais específicas valem mais
        matchedKeywords.push(keyword);
      }
    });

    // Pontuação por áreas de expertise
    expertise.expertiseAreas.forEach(area => {
      if (normalizedQuestion.includes(area)) {
        score += 3;
        matchedKeywords.push(area);
      }
    });

    scores[personaId] = score;
    reasonings[personaId] = matchedKeywords;
  });

  // Encontrar a melhor persona
  const sortedPersonas = Object.entries(scores)
    .sort(([,a], [,b]) => b - a)
    .filter(([,score]) => score > 0);

  if (sortedPersonas.length === 0) {
    // Nenhuma correspondência - usar Dr. Gasnelio como padrão para questões clínicas
    const defaultPersona = 'dr_gasnelio';
    return {
      recommendedPersonaId: defaultPersona,
      confidence: 0.3,
      reasoning: 'Questão geral - roteado para especialista clínico',
      scope: 'general',
      alternatives: Object.keys(availablePersonas)
        .filter(id => id !== defaultPersona)
        .map(id => ({
          personaId: id,
          confidence: 0.2,
          reasoning: 'Alternativa disponível'
        }))
    };
  }

  const [topPersonaId, topScore] = sortedPersonas[0];
  const maxPossibleScore = PERSONAS_EXPERTISE[topPersonaId]?.keywords.length || 1;
  const confidence = Math.min(0.95, (topScore / maxPossibleScore) * 0.8 + 0.2);

  const topKeywords = reasonings[topPersonaId] || [];
  const reasoning = topKeywords.length > 0
    ? `Especialista em: ${topKeywords.slice(0, 3).join(', ')}`
    : 'Melhor correspondência de expertise';

  return {
    recommendedPersonaId: topPersonaId,
    confidence,
    reasoning,
    scope: determineScope(normalizedQuestion),
    alternatives: sortedPersonas.slice(1, 3).map(([personaId, score]) => ({
      personaId,
      confidence: Math.min(0.8, (score / maxPossibleScore) * 0.6 + 0.1),
      reasoning: reasonings[personaId]?.length > 0
        ? `Também especialista em: ${reasonings[personaId].slice(0, 2).join(', ')}`
        : 'Alternativa com expertise relacionada'
    }))
  };
}

/**
 * Determina o escopo temático da pergunta
 */
function determineScope(question: string): string {
  const dosageKeywords = ['dose', 'dosagem', 'mg', 'quantidade', 'posologia'];
  const clinicalKeywords = ['diagnóstico', 'sintoma', 'caso', 'tratamento', 'protocolo'];
  const educationKeywords = ['paciente', 'família', 'explicar', 'ensinar', 'orientar'];
  const dispensationKeywords = ['dispensar', 'farmácia', 'entrega', 'cronograma'];

  if (dosageKeywords.some(keyword => question.includes(keyword))) return 'dosage';
  if (clinicalKeywords.some(keyword => question.includes(keyword))) return 'clinical';
  if (educationKeywords.some(keyword => question.includes(keyword))) return 'education';
  if (dispensationKeywords.some(keyword => question.includes(keyword))) return 'dispensation';
  
  return 'general';
}

/**
 * Combina análise local com resposta do backend
 */
function combineAnalyses(
  localAnalysis: RoutingAnalysis,
  backendAnalysis: any,
  availablePersonas: Record<string, Persona>
): RoutingAnalysis {
  if (!backendAnalysis || !backendAnalysis.recommended_persona) {
    return localAnalysis;
  }

  // Se backend sugere uma persona disponível, dar peso extra
  const backendPersona = backendAnalysis.recommended_persona;
  if (availablePersonas[backendPersona]) {
    const backendConfidence = backendAnalysis.confidence || 0.5;
    const combinedConfidence = (localAnalysis.confidence + backendConfidence) / 2;

    if (backendPersona === localAnalysis.recommendedPersonaId) {
      // Backend confirma análise local - aumentar confiança
      return {
        ...localAnalysis,
        confidence: Math.min(0.95, combinedConfidence + 0.2),
        reasoning: `${localAnalysis.reasoning} (confirmado por IA)`
      };
    } else if (backendConfidence > localAnalysis.confidence) {
      // Backend sugere persona diferente com mais confiança
      return {
        recommendedPersonaId: backendPersona,
        confidence: combinedConfidence,
        reasoning: backendAnalysis.reasoning || 'Recomendado por análise de IA',
        scope: backendAnalysis.scope || localAnalysis.scope,
        alternatives: [
          {
            personaId: localAnalysis.recommendedPersonaId,
            confidence: localAnalysis.confidence,
            reasoning: localAnalysis.reasoning
          },
          ...localAnalysis.alternatives
        ]
      };
    }
  }

  return localAnalysis;
}

/**
 * Obtém informações de expertise de uma persona
 */
export function getPersonaExpertise(personaId: string): PersonaExpertise | null {
  return PERSONAS_EXPERTISE[personaId] || null;
}

/**
 * Verifica se uma pergunta é ambígua (baixa confiança)
 */
export function isAmbiguousQuestion(analysis: RoutingAnalysis): boolean {
  return analysis.confidence < 0.6;
}

/**
 * Obtém texto explicativo sobre por que uma persona foi escolhida
 */
export function getRoutingExplanation(
  analysis: RoutingAnalysis,
  personas: Record<string, Persona>
): string {
  const persona = personas[analysis.recommendedPersonaId];
  if (!persona) return analysis.reasoning;

  const expertise = getPersonaExpertise(analysis.recommendedPersonaId);
  const specialties = expertise?.specialties.join(', ') || 'questões especializadas';

  return `${persona.name} especializa-se em ${specialties}. ${analysis.reasoning}`;
}