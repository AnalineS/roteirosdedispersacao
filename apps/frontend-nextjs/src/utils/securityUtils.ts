/**
 * Utilities de Segurança para Dados Médicos e LGPD Compliance
 * Implementa sanitização, validação e proteção de dados sensíveis
 */

// Padrões de dados médicos sensíveis para detecção
const MEDICAL_SENSITIVE_PATTERNS = [
  // CPF/CNPJ
  /\b\d{3}\.?\d{3}\.?\d{3}[-.]?\d{2}\b/g,
  /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}[-.]?\d{2}\b/g,
  
  // RG
  /\b\d{1,2}\.?\d{3}\.?\d{3}[-.]?[0-9xX]\b/g,
  
  // Telefone
  /\b(?:\+?55\s?)?\(?[1-9]{2}\)?\s?[0-9]{4,5}[-.]?[0-9]{4}\b/g,
  
  // Email
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  
  // Data de nascimento (formatos brasileiros)
  /\b(?:[0-3]?\d\/[01]?\d\/(?:19|20)\d{2})\b/g,
  /\b(?:[0-3]?\d[-][01]?\d[-](?:19|20)\d{2})\b/g,
  
  // Endereço específico
  /\b(?:rua|av|avenida|praça|travessa)\s+[^,\n]{10,}\b/gi,
  /\bCEP\s*:?\s*\d{5}[-.]?\d{3}\b/gi,
  
  // Números de documentos médicos
  /\b(?:CRM|CRF|COREN)\s*:?\s*\d+\b/gi,
  /\bregistro\s+(?:médico|farmacêutico|enfermagem)\s*:?\s*\d+\b/gi,
  
  // Nomes próprios completos (heurística)
  /\b[A-Z][a-záàâãéêíóôõúç]+\s+[A-Z][a-záàâãéêíóôõúç]+(?:\s+[A-Z][a-záàâãéêíóôõúç]+)+\b/g
];

// Palavras relacionadas a dados pessoais sensíveis
const PERSONAL_DATA_KEYWORDS = [
  'nome completo', 'nome do paciente', 'paciente', 'cliente',
  'endereço', 'telefone', 'celular', 'email', 'idade',
  'data de nascimento', 'nascimento', 'cpf', 'rg', 'documento',
  'prontuário', 'registro médico', 'histórico médico',
  'família', 'esposa', 'marido', 'filho', 'filha', 'mãe', 'pai'
];

/**
 * Sanitiza input removendo/mascarando dados médicos sensíveis
 */
export function sanitizeMedicalInput(input: string): {
  sanitized: string;
  hasSensitiveData: boolean;
  detectedPatterns: string[];
} {
  if (!input || typeof input !== 'string') {
    return { sanitized: '', hasSensitiveData: false, detectedPatterns: [] };
  }

  let sanitized = input;
  const detectedPatterns: string[] = [];

  // Detectar e mascarar padrões de dados sensíveis
  MEDICAL_SENSITIVE_PATTERNS.forEach((pattern, index) => {
    const matches = input.match(pattern);
    if (matches) {
      detectedPatterns.push(`pattern_${index}`);
      sanitized = sanitized.replace(pattern, '[DADOS_REMOVIDOS_PRIVACIDADE]');
    }
  });

  // Detectar palavras-chave de dados pessoais
  const lowerInput = input.toLowerCase();
  const hasPersonalKeywords = PERSONAL_DATA_KEYWORDS.some(keyword => 
    lowerInput.includes(keyword)
  );

  if (hasPersonalKeywords) {
    detectedPatterns.push('personal_keywords');
  }

  // Sanitização adicional para XSS
  sanitized = sanitized
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '[SCRIPT_REMOVIDO]')
    .replace(/javascript:/gi, '[JS_REMOVIDO]')
    .replace(/on\w+\s*=/gi, '[EVENT_REMOVIDO]')
    .replace(/data:text\/html/gi, '[DATA_URL_REMOVIDO]')
    // Manter quebras de linha mas remover HTML perigoso
    .replace(/<(?!br\s*\/?>)[^>]+>/g, '')
    // Limitar tamanho
    .substring(0, 1000);

  return {
    sanitized: sanitized.trim(),
    hasSensitiveData: detectedPatterns.length > 0,
    detectedPatterns
  };
}

/**
 * Valida rating dentro dos parâmetros aceitáveis
 */
export function validateRating(rating: unknown): { isValid: boolean; sanitizedRating: number } {
  const numRating = Number(rating);
  
  if (isNaN(numRating) || !Number.isInteger(numRating) || numRating < 1 || numRating > 5) {
    return { isValid: false, sanitizedRating: 3 }; // Default neutro
  }
  
  return { isValid: true, sanitizedRating: numRating };
}

/**
 * Valida dados completos do feedback antes de envio
 */
export function validateFeedbackData(data: any): {
  isValid: boolean;
  sanitizedData: any;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      sanitizedData: null,
      errors: ['Dados de feedback inválidos'],
      warnings: []
    };
  }

  // Validar campos obrigatórios
  if (!data.messageId || typeof data.messageId !== 'string') {
    errors.push('ID da mensagem é obrigatório');
  }

  if (!data.personaId || typeof data.personaId !== 'string') {
    errors.push('ID da persona é obrigatório');
  }

  if (!data.question || typeof data.question !== 'string') {
    errors.push('Pergunta é obrigatória');
  }

  if (!data.response || typeof data.response !== 'string') {
    errors.push('Resposta é obrigatória');
  }

  // Validar rating
  const { isValid: ratingValid, sanitizedRating } = validateRating(data.rating);
  if (!ratingValid) {
    errors.push('Rating deve ser um número entre 1 e 5');
  }

  // Sanitizar comentários se existirem
  let sanitizedComments = '';
  let hasSensitiveData = false;
  
  if (data.comments && typeof data.comments === 'string') {
    const commentSanitization = sanitizeMedicalInput(data.comments);
    sanitizedComments = commentSanitization.sanitized;
    hasSensitiveData = commentSanitization.hasSensitiveData;
    
    if (hasSensitiveData) {
      warnings.push('Dados pessoais foram removidos do comentário por motivos de privacidade');
    }
  }

  // Sanitizar question e response também
  const questionSanitization = sanitizeMedicalInput(data.question);
  const responseSanitization = sanitizeMedicalInput(data.response);

  if (questionSanitization.hasSensitiveData || responseSanitization.hasSensitiveData) {
    warnings.push('Dados sensíveis foram identificados e tratados adequadamente');
  }

  const sanitizedData = {
    messageId: String(data.messageId).substring(0, 100),
    personaId: String(data.personaId).substring(0, 50),
    question: questionSanitization.sanitized,
    response: responseSanitization.sanitized,
    rating: sanitizedRating,
    comments: sanitizedComments || undefined,
    timestamp: Date.now(),
    // Metadados para auditoria (sem dados sensíveis)
    metadata: {
      hasSensitiveData,
      sanitizationApplied: true,
      clientTimestamp: data.timestamp || Date.now()
    }
  };

  return {
    isValid: errors.length === 0,
    sanitizedData,
    errors,
    warnings
  };
}

/**
 * Rate limiting client-side
 */
class ClientRateLimiter {
  private attempts: Map<string, number[]> = new Map();
  private readonly maxAttempts: number = 5;
  private readonly windowMs: number = 60000; // 1 minuto

  canProceed(identifier: string): { allowed: boolean; retryAfter?: number } {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    if (!this.attempts.has(identifier)) {
      this.attempts.set(identifier, []);
    }
    
    const userAttempts = this.attempts.get(identifier)!;
    
    // Limpar tentativas antigas
    const recentAttempts = userAttempts.filter(time => time > windowStart);
    this.attempts.set(identifier, recentAttempts);
    
    if (recentAttempts.length >= this.maxAttempts) {
      const oldestAttempt = Math.min(...recentAttempts);
      const retryAfter = oldestAttempt + this.windowMs - now;
      return { allowed: false, retryAfter };
    }
    
    // Adicionar tentativa atual
    recentAttempts.push(now);
    this.attempts.set(identifier, recentAttempts);
    
    return { allowed: true };
  }

  reset(identifier: string): void {
    this.attempts.delete(identifier);
  }
}

export const feedbackRateLimiter = new ClientRateLimiter();

/**
 * Gera identificador único para sessão (sem dados pessoais)
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Utilitário para headers de segurança
 */
export const SECURITY_HEADERS = {
  'Content-Type': 'application/json',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin'
} as const;

/**
 * Configurações de compliance LGPD
 */
export const LGPD_CONFIG = {
  dataMinimization: true,
  explicitConsent: false, // Feedback é implícito no uso do sistema
  rightToForget: true,
  dataPortability: false, // Não aplicável para feedback anônimo
  transparencyRequired: true,
  
  // Configurações de retention
  maxRetentionDays: 730, // 2 anos para análise educacional
  anonymizeAfterDays: 90,  // Anonimizar dados após 90 dias
  
  // Configurações de analytics
  googleAnalytics: {
    anonymizeIP: true,
    allowGoogleSignals: false,
    allowAdPersonalization: false,
    cookieExpires: 63072000, // 2 anos (padrão educacional)
    forceSSL: true
  }
} as const;