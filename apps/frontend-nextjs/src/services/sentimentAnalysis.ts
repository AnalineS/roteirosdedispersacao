/**
 * Serviço de Análise de Sentimento
 * Detecta o estado emocional do usuário para ajustar respostas das personas
 */

export interface SentimentResult {
  score: number; // -1 (muito negativo) a 1 (muito positivo)
  magnitude: number; // 0 (baixa intensidade) a 1 (alta intensidade)
  category: SentimentCategory;
  confidence: number; // 0 a 1
  keywords: string[]; // palavras que influenciaram a análise
}

export enum SentimentCategory {
  POSITIVE = 'positive',
  NEUTRAL = 'neutral',
  CONCERNED = 'concerned',
  ANXIOUS = 'anxious',
  FRUSTRATED = 'frustrated'
}

// Cache para otimização de performance
interface CachedSentiment {
  result: SentimentResult;
  timestamp: number;
}

const sentimentCache = new Map<string, CachedSentiment>();
const CACHE_MAX_SIZE = 100;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

export class SentimentAnalyzer {
  private static instance: SentimentAnalyzer;
  
  private constructor() {}
  
  static getInstance(): SentimentAnalyzer {
    if (!SentimentAnalyzer.instance) {
      SentimentAnalyzer.instance = new SentimentAnalyzer();
    }
    return SentimentAnalyzer.instance;
  }
  
  /**
   * Analisa o sentimento de um texto
   */
  async analyze(text: string): Promise<SentimentResult> {
    // Normalizar texto para cache
    const normalizedText = text.toLowerCase().trim();
    
    // Verificar cache
    const cached = this.getCachedResult(normalizedText);
    if (cached) return cached;
    
    // Análise local (v1)
    const result = await this.performLocalAnalysis(normalizedText);
    
    // Salvar no cache
    this.cacheResult(normalizedText, result);
    
    return result;
  }
  
  /**
   * Análise local baseada em palavras-chave e padrões
   */
  private async performLocalAnalysis(text: string): Promise<SentimentResult> {
    // Importar palavras-chave dinamicamente para não impactar bundle inicial
    const { sentimentKeywords } = await import('./sentimentKeywords');
    
    let score = 0;
    let magnitude = 0;
    const foundKeywords: string[] = [];
    let totalWeight = 0;
    
    // Analisar palavras-chave
    for (const [category, keywords] of Object.entries(sentimentKeywords)) {
      for (const keyword of keywords) {
        const regex = new RegExp(`\\b${keyword.word}\\b`, 'gi');
        const matches = text.match(regex);
        
        if (matches) {
          const weight = keyword.weight * matches.length;
          score += weight;
          magnitude += Math.abs(weight);
          totalWeight += matches.length;
          foundKeywords.push(keyword.word);
        }
      }
    }
    
    // Normalizar score e magnitude
    if (totalWeight > 0) {
      score = Math.max(-1, Math.min(1, score / totalWeight));
      magnitude = Math.min(1, magnitude / totalWeight);
    }
    
    // Detectar emojis para ajustar análise
    const emojiAdjustment = this.analyzeEmojis(text);
    score = (score + emojiAdjustment.score) / 2;
    magnitude = Math.max(magnitude, emojiAdjustment.magnitude);
    
    // Determinar categoria
    const category = this.determineCategory(score, magnitude);
    
    // Calcular confiança baseada na quantidade de evidências
    const confidence = Math.min(1, (foundKeywords.length + emojiAdjustment.count) / 5);
    
    return {
      score,
      magnitude,
      category,
      confidence,
      keywords: foundKeywords.slice(0, 5) // Top 5 palavras
    };
  }
  
  /**
   * Analisa emojis no texto
   */
  private analyzeEmojis(text: string): { score: number; magnitude: number; count: number } {
    const positiveEmojis = /😊|😃|😄|😁|🙂|👍|❤️|💚|✅|🎉/g;
    const negativeEmojis = /😟|😰|😔|😢|😭|😡|😤|👎|❌|💔/g;
    const concernedEmojis = /🤔|😕|🧐|❓|⁉️/g;
    
    const positive = (text.match(positiveEmojis) || []).length;
    const negative = (text.match(negativeEmojis) || []).length;
    const concerned = (text.match(concernedEmojis) || []).length;
    
    const total = positive + negative + concerned;
    if (total === 0) return { score: 0, magnitude: 0, count: 0 };
    
    const score = (positive - negative) / total;
    const magnitude = Math.min(1, total / 3); // 3 emojis = magnitude máxima
    
    return { score, magnitude, count: total };
  }
  
  /**
   * Determina a categoria baseada no score e magnitude
   */
  private determineCategory(score: number, magnitude: number): SentimentCategory {
    // Alta magnitude indica emoção forte
    if (magnitude > 0.7) {
      if (score > 0.3) return SentimentCategory.POSITIVE;
      if (score < -0.5) return SentimentCategory.FRUSTRATED;
      if (score < -0.2) return SentimentCategory.ANXIOUS;
    }
    
    // Análise baseada principalmente no score
    if (score > 0.2) return SentimentCategory.POSITIVE;
    if (score < -0.4) return SentimentCategory.FRUSTRATED;
    if (score < -0.2) return SentimentCategory.ANXIOUS;
    if (Math.abs(score) < 0.2 && magnitude > 0.3) return SentimentCategory.CONCERNED;
    
    return SentimentCategory.NEUTRAL;
  }
  
  /**
   * Busca resultado no cache
   */
  private getCachedResult(text: string): SentimentResult | null {
    const cached = sentimentCache.get(text);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.result;
    }
    
    // Limpar entrada expirada
    if (cached) {
      sentimentCache.delete(text);
    }
    
    return null;
  }
  
  /**
   * Salva resultado no cache
   */
  private cacheResult(text: string, result: SentimentResult): void {
    // Limitar tamanho do cache
    if (sentimentCache.size >= CACHE_MAX_SIZE) {
      const firstKey = sentimentCache.keys().next().value;
      if (firstKey) sentimentCache.delete(firstKey);
    }
    
    sentimentCache.set(text, {
      result,
      timestamp: Date.now()
    });
  }
  
  /**
   * Limpa o cache (útil para testes)
   */
  clearCache(): void {
    sentimentCache.clear();
  }
}

// Exportar instância singleton
export const sentimentAnalyzer = SentimentAnalyzer.getInstance();

/**
 * Helper para determinar se deve sugerir troca de persona
 */
export function shouldSuggestPersonaSwitch(
  sentiment: SentimentResult,
  currentPersona: 'dr-gasnelio' | 'ga'
): boolean {
  // Gá é melhor para sentimentos negativos
  if (currentPersona === 'dr-gasnelio' && 
      (sentiment.category === SentimentCategory.ANXIOUS || 
       sentiment.category === SentimentCategory.FRUSTRATED) &&
      sentiment.confidence > 0.7) {
    return true;
  }
  
  // Dr. Gasnelio é melhor para questões técnicas (neutro com baixa magnitude)
  if (currentPersona === 'ga' && 
      sentiment.category === SentimentCategory.NEUTRAL &&
      sentiment.magnitude < 0.3 &&
      sentiment.confidence > 0.7) {
    return true;
  }
  
  return false;
}

/**
 * Helper para ajustar tom da resposta baseado no sentimento
 */
export function adjustResponseTone(
  baseResponse: string,
  sentiment: SentimentResult
): string {
  // Por enquanto retorna a resposta base
  // Em versões futuras, pode modificar o tom
  return baseResponse;
}