/**
 * Educational Security Framework
 * Sistema de Segurança para Recursos Educativos - Fase 4.2
 *
 * CONFORMIDADE REGULATÓRIA:
 * - LGPD (Lei Geral de Proteção de Dados)
 * - CFM/CFF (Conselhos Médico/Farmacêutico)
 * - ANVISA (Informações sobre medicamentos)
 * - Ministério da Saúde (Protocolos clínicos)
 */

// Use global Window interface from types/analytics.ts

// Global counter for verification code generation
let globalVerificationCounter = 0;

// Internal types for educational security
interface PatientProfile {
  id: string;
  age: number;
  weight: number;
  [key: string]: unknown;
}

interface CalculationResult {
  dose: number;
  unit: string;
  frequency: string;
  duration: string;
  warnings?: string[];
}

interface ClinicalCase {
  id: string;
  title: string;
  description: string;
  [key: string]: unknown;
}

interface Certificate {
  id: string;
  title: string;
  issuedAt: Date;
  validUntil?: Date;
  [key: string]: unknown;
}

// ValidationResult will be used from the exported interface below

interface SecurityInputData {
  patientData?: Partial<PatientProfile>;
  calculationParams?: Record<string, number | string>;
  caseData?: Partial<ClinicalCase>;
  userInput?: string | number | boolean;
  formData?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

interface SecurityOutputData {
  result?: CalculationResult;
  processedData?: Record<string, unknown>;
  validationResults?: ValidationResult[];
  certificateData?: Partial<Certificate>;
  exportData?: unknown[];
  sanitizedData?: Record<string, unknown>;
}

interface EducationalFraudAlert {
  type: 'unusual_pattern' | 'rate_limit_exceeded' | 'data_manipulation' | 'unauthorized_access';
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: string;
  timestamp: Date;
  userId?: string;
  sessionId: string;
  actionTaken: string;
}

interface SanitizedData {
  originalType: string;
  sanitizedValue: unknown;
  sanitizationRules: string[];
  wasModified: boolean;
  riskScore: number;
}

type UserDataRecord = Record<string, unknown>;

// ================== TIPOS DE SEGURANÇA ==================

export interface SecurityAudit {
  timestamp: Date;
  userId?: string;
  sessionId: string;
  action: SecurityAction;
  component: SecurityComponent;
  riskLevel: RiskLevel;
  data: {
    input?: SecurityInputData;
    output?: SecurityOutputData;
    validation?: ValidationResult;
    errors?: string[];
    exportFormat?: string;
    filename?: string;
    recordCount?: number;
    certificateId?: string;
    securityLevel?: string;
    fraudAlerts?: EducationalFraudAlert[];
    validationsPassed?: number;
    validationsTotal?: number;
  };
  metadata: {
    userAgent?: string;
    ip?: string;
    referrer?: string;
  };
}

export type SecurityAction = 
  | 'dose_calculation' 
  | 'case_access' 
  | 'certificate_generation'
  | 'data_export'
  | 'input_validation'
  | 'session_activity'
  | 'ab_test_event';

export type SecurityComponent =
  | 'calculator'
  | 'simulator'
  | 'certification'
  | 'progress'
  | 'export'
  | 'ab_testing';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sanitized: SanitizedData | string;
  riskScore: number;
}

export interface SecurityConfig {
  encryption: {
    algorithm: string;
    keyLength: number;
  };
  validation: {
    maxInputLength: number;
    allowedPatterns: RegExp[];
    forbiddenPatterns: RegExp[];
  };
  rateLimit: {
    calculations: { requests: number; window: number };
    exports: { requests: number; window: number };
    certificates: { requests: number; window: number };
  };
  audit: {
    logLevel: 'basic' | 'detailed' | 'full';
    retention: number; // days
    sensitiveFields: string[];
  };
}

// ================== CONFIGURAÇÃO DE SEGURANÇA ==================

const SECURITY_CONFIG: SecurityConfig = {
  encryption: {
    algorithm: 'AES-256-GCM',
    keyLength: 256
  },
  validation: {
    maxInputLength: 1000,
    allowedPatterns: [
      /^[a-zA-ZÀ-ÿ0-9\s\.,\-\(\)]+$/,  // Nomes e texto geral
      /^\d{1,3}(\.\d{1,2})?$/,           // Pesos (ex: 70.5)
      /^\d{1,3}$/,                       // Idades
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/ // Emails
    ],
    forbiddenPatterns: [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, // Scripts
      /javascript:/gi,                    // URLs JavaScript
      /data:(?!image\/(?:png|jpe?g|gif|webp);base64,)/gi,   // Data URLs suspeitas
      /vbscript:/gi,                      // VBScript
      /on\w+\s*=/gi,                      // Event handlers
      /eval\s*\(/gi,                      // Eval
      /expression\s*\(/gi,                // CSS expressions
      /import\s+/gi,                      // ES6 imports
      /require\s*\(/gi,                   // CommonJS requires
      /\{\{.*\}\}/g,                      // Template expressions
      /<%.*%>/g,                          // Template tags
      /\$\{.*\}/g                         // Template literals
    ]
  },
  rateLimit: {
    calculations: { requests: 50, window: 3600000 }, // 50 cálculos por hora
    exports: { requests: 10, window: 3600000 },      // 10 exports por hora
    certificates: { requests: 5, window: 86400000 }   // 5 certificados por dia
  },
  audit: {
    logLevel: 'detailed',
    retention: 90, // 90 days
    sensitiveFields: ['email', 'name', 'personalData']
  }
};

// ================== SISTEMA DE VALIDAÇÃO ==================

/**
 * Validação segura de inputs para calculadora de doses
 */
export function validateDoseCalculationInput(profile: PatientProfile): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let riskScore = 0;

  // Validação de peso
  if (profile.weight <= 0 || profile.weight > 500) {
    errors.push('Peso deve estar entre 0.1 kg e 500 kg');
    riskScore += 30;
  }

  if (profile.weight > 200) {
    warnings.push('Peso extremo detectado - verificar se está correto');
    riskScore += 10;
  }

  // Validação de idade
  if (profile.age <= 0 || profile.age > 120) {
    errors.push('Idade deve estar entre 1 e 120 anos');
    riskScore += 30;
  }

  // Validação de consistência peso/idade
  if (profile.age < 18 && profile.weight > 100) {
    warnings.push('Combinação peso/idade incomum para paciente pediátrico');
    riskScore += 15;
  }

  // Validação de alergias (se fornecidas)
  if (profile.allergies && Array.isArray(profile.allergies)) {
    for (const allergy of profile.allergies) {
      if (typeof allergy !== 'string' || !validateString(allergy)) {
        errors.push('Formato inválido detectado em alergias');
        riskScore += 25;
        break;
      }
    }
  }

  // Validação de medicamentos atuais (se fornecidos)
  if (profile.currentMedications && Array.isArray(profile.currentMedications)) {
    for (const medication of profile.currentMedications) {
      if (typeof medication !== 'string' || !validateString(medication)) {
        errors.push('Formato inválido detectado em medicamentos');
        riskScore += 25;
        break;
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    riskScore: Math.min(riskScore, 100),
    sanitized: ''
  };
}

/**
 * Validação segura de strings contra XSS e injection
 */
export function validateString(input: string): boolean {
  if (!input || typeof input !== 'string') return false;
  
  // Check length
  if (input.length > SECURITY_CONFIG.validation.maxInputLength) return false;
  
  // Check forbidden patterns
  for (const pattern of SECURITY_CONFIG.validation.forbiddenPatterns) {
    if (pattern.test(input)) return false;
  }
  
  return true;
}

/**
 * Sanitização segura de inputs
 */
export function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .trim()
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .replace(/\\/g, '&#x5C;')
    .substring(0, SECURITY_CONFIG.validation.maxInputLength);
}

/**
 * Validação de email com verificação adicional de segurança
 */
export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];
  let riskScore = 0;

  if (!email || typeof email !== 'string') {
    errors.push('Email é obrigatório');
    return { isValid: false, errors, warnings: [], riskScore: 50, sanitized: '' };
  }

  const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
  if (!emailPattern.test(email)) {
    errors.push('Formato de email inválido');
    riskScore += 30;
  }

  if (email.length > 254) {
    errors.push('Email muito longo');
    riskScore += 20;
  }

  // Verificação de domínios suspeitos
  const suspiciousDomains = ['10minutemail.', 'guerrillamail.', 'temp-mail.', 'throwaway'];
  for (const domain of suspiciousDomains) {
    if (email.toLowerCase().includes(domain)) {
      riskScore += 15;
      break;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: [],
    riskScore: Math.min(riskScore, 100),
    sanitized: email.trim().toLowerCase()
  };
}

// ================== PROTEÇÃO DE DADOS EDUCACIONAIS ==================

/**
 * Criptografia de dados sensíveis (LGPD Compliance)
 */
export async function encryptSensitiveData(data: Record<string, unknown> | string | number | boolean | null): Promise<string> {
  // Para implementação real, usar crypto-js ou similar
  // Por enquanto, retornar encoded string para demonstração
  const jsonString = JSON.stringify(data);
  return btoa(jsonString); // Base64 encoding para demonstração
}

/**
 * Descriptografia de dados sensíveis
 */
export async function decryptSensitiveData(encryptedData: string): Promise<Record<string, unknown> | string | number | boolean | null> {
  try {
    const jsonString = atob(encryptedData);
    return JSON.parse(jsonString);
  } catch (error) {
    throw new Error('Falha na descriptografia dos dados');
  }
}

// Helper para hash de strings
const hashString = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
};

/**
 * Anonimização de dados para analytics (LGPD)
 */
export function anonymizeUserData(data: UserDataRecord): UserDataRecord {
  const anonymized = { ...data };

  // Remove/mascara informações pessoais
  if (anonymized.name) {
    anonymized.name = `User_${hashString(anonymized.name as string)}`;
  }

  if (anonymized.email) {
    anonymized.email = `${hashString(String(anonymized.email))}@anonymous.local`;
  }
  
  // Remove campos sensíveis completamente
  delete anonymized.personalId;
  delete anonymized.phone;
  delete anonymized.address;
  
  return anonymized;
}

// hashString já definido acima como const

// ================== RATE LIMITING ==================

class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  isAllowed(key: string, action: keyof SecurityConfig['rateLimit']): boolean {
    const config = SECURITY_CONFIG.rateLimit[action];
    const now = Date.now();
    const windowStart = now - config.window;
    
    // Get or create request history for this key
    const requestHistory = this.requests.get(key) || [];
    
    // Filter requests within the time window
    const recentRequests = requestHistory.filter(time => time > windowStart);
    
    if (recentRequests.length >= config.requests) {
      return false;
    }
    
    // Add current request and update history
    recentRequests.push(now);
    this.requests.set(key, recentRequests);
    
    return true;
  }
  
  getRemainingRequests(key: string, action: keyof SecurityConfig['rateLimit']): number {
    const config = SECURITY_CONFIG.rateLimit[action];
    const now = Date.now();
    const windowStart = now - config.window;
    
    const requestHistory = this.requests.get(key) || [];
    const recentRequests = requestHistory.filter(time => time > windowStart);
    
    return Math.max(0, config.requests - recentRequests.length);
  }
}

export const rateLimiter = new RateLimiter();

// ================== AUDITORIA E LOGGING ==================

class SecurityLogger {
  private logs: SecurityAudit[] = [];

  log(audit: Omit<SecurityAudit, 'timestamp'>): void {
    const fullAudit: SecurityAudit = {
      ...audit,
      timestamp: new Date()
    };

    // Sanitize sensitive data before logging
    if (fullAudit.data.input) {
      fullAudit.data.input = this.sanitizeLogData(fullAudit.data.input as SecurityInputData);
    }
    
    this.logs.push(fullAudit);
    
    // In production, send to monitoring service
    if (fullAudit.riskLevel === 'critical' || fullAudit.riskLevel === 'high') {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'security_alert', {
          event_category: 'medical_security',
          event_label: fullAudit.action,
          custom_parameters: {
            medical_context: 'security_framework',
            risk_level: fullAudit.riskLevel,
            component: fullAudit.component,
            user_id: fullAudit.userId || 'anonymous'
          }
        });
      }
    }
    
    // Keep only recent logs (memory management)
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-500);
    }
  }

  private sanitizeLogData(data: SecurityInputData): SecurityInputData {
    if (!data || typeof data !== 'object') return data;

    const sanitized = { ...data };

    for (const field of SECURITY_CONFIG.audit.sensitiveFields) {
      if (field in sanitized) {
        sanitized[field as keyof SecurityInputData] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  getRecentAlerts(hours: number = 24): SecurityAudit[] {
    const cutoff = new Date(Date.now() - (hours * 60 * 60 * 1000));
    return this.logs.filter(log => 
      log.timestamp >= cutoff && 
      (log.riskLevel === 'high' || log.riskLevel === 'critical')
    );
  }

  generateSecurityReport(): {
    totalEvents: number;
    riskDistribution: Record<RiskLevel, number>;
    topComponents: Array<{ component: SecurityComponent; count: number }>;
    recentAlerts: SecurityAudit[];
  } {
    const riskDistribution: Record<RiskLevel, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    };

    const componentCounts: Record<string, number> = {};

    for (const log of this.logs) {
      riskDistribution[log.riskLevel]++;
      componentCounts[log.component] = (componentCounts[log.component] || 0) + 1;
    }

    const topComponents = Object.entries(componentCounts)
      .map(([component, count]) => ({ component: component as SecurityComponent, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalEvents: this.logs.length,
      riskDistribution,
      topComponents,
      recentAlerts: this.getRecentAlerts()
    };
  }
}

export const securityLogger = new SecurityLogger();

// ================== FUNÇÕES DE SEGURANÇA ESPECÍFICAS ==================

/**
 * Validação segura para sistema de certificação
 */
export function validateCertificationData(
  recipientName: string,
  email: string,
  competencies: string[]
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let riskScore = 0;

  // Validação do nome
  if (!recipientName || typeof recipientName !== 'string') {
    errors.push('Nome do recipiente é obrigatório');
    riskScore += 40;
  } else if (!validateString(recipientName)) {
    errors.push('Formato inválido no nome do recipiente');
    riskScore += 35;
  } else if (recipientName.length < 2 || recipientName.length > 100) {
    errors.push('Nome deve ter entre 2 e 100 caracteres');
    riskScore += 20;
  }

  // Validação do email
  const emailValidation = validateEmail(email);
  errors.push(...emailValidation.errors);
  riskScore += emailValidation.riskScore;

  // Validação das competências
  if (!Array.isArray(competencies) || competencies.length === 0) {
    errors.push('Competências são obrigatórias');
    riskScore += 30;
  } else {
    for (const competency of competencies) {
      if (typeof competency !== 'string' || !validateString(competency)) {
        errors.push('Formato inválido detectado nas competências');
        riskScore += 25;
        break;
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    riskScore: Math.min(riskScore, 100),
    sanitized: ''
  };
}

/**
 * Geração segura de códigos de verificação para certificados
 */
export function generateSecureVerificationCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  
  // Generate timestamp-based prefix for uniqueness
  const timestamp = Date.now().toString(36).toUpperCase();
  
  // Generate cryptographically secure random suffix
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint8Array(8);
    window.crypto.getRandomValues(array);
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(array[i] % chars.length);
    }
  } else {
    // Fallback for environments without crypto API
    globalVerificationCounter = (globalVerificationCounter + 1) % 10000;
    const seed = timestamp + globalVerificationCounter.toString();
    for (let i = 0; i < 8; i++) {
      const charIndex = (seed.charCodeAt(i % seed.length) + i) % chars.length;
      result += chars.charAt(charIndex);
    }
  }
  
  return `${timestamp}-${result}`;
}

/**
 * Validação de integridade para casos clínicos
 */
export function validateClinicalCaseAccess(
  caseId: string,
  userType: 'anonymous' | 'authenticated'
): ValidationResult {
  const errors: string[] = [];
  let riskScore = 0;

  if (!caseId || typeof caseId !== 'string') {
    errors.push('ID do caso é obrigatório');
    riskScore += 40;
  }

  if (!validateString(caseId)) {
    errors.push('Formato inválido no ID do caso');
    riskScore += 35;
  }

  // Verificação de acesso para usuários anônimos
  if (userType === 'anonymous') {
    const allowedDemoCases = ['caso_001_pediatrico_basico', 'caso_002_adulto_standard'];
    if (!allowedDemoCases.includes(caseId)) {
      errors.push('Acesso negado: caso não disponível para usuários anônimos');
      riskScore += 50;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: [],
    riskScore: Math.min(riskScore, 100),
    sanitized: ''
  };
}

// ================== MIDDLEWARE DE SEGURANÇA ==================

/**
 * Middleware para validação de segurança em componentes educativos
 */
export async function securityMiddleware<T>(
  action: SecurityAction,
  component: SecurityComponent,
  data: T,
  sessionId: string,
  userId?: string
): Promise<{ success: boolean; data?: T; errors?: string[] }> {
  
  let validation: ValidationResult;
  let rateLimitKey = userId || sessionId;

  try {
    // Rate limiting check
    const rateLimitAction = component === 'calculator' ? 'calculations' :
                           component === 'certification' ? 'certificates' :
                           'exports';

    if (!rateLimiter.isAllowed(rateLimitKey, rateLimitAction)) {
      const remaining = rateLimiter.getRemainingRequests(rateLimitKey, rateLimitAction);
      securityLogger.log({
        userId,
        sessionId,
        action,
        component,
        riskLevel: 'medium',
        data: { errors: ['Rate limit exceeded'] },
        metadata: {}
      });

      return {
        success: false,
        errors: [`Rate limit excedido. Tente novamente mais tarde. (${remaining} requests restantes)`]
      };
    }

    // Component-specific validation
    switch (component) {
      case 'calculator':
        validation = validateDoseCalculationInput(data as PatientProfile);
        break;
        
      case 'certification':
        const certData = data as Record<string, unknown>;
        validation = validateCertificationData(
          String(certData.recipientName || ''),
          String(certData.email || ''),
          certData.competencies as string[]
        );
        break;
        
      default:
        validation = { isValid: true, errors: [], warnings: [], riskScore: 0, sanitized: '' };
    }

    // Determine risk level
    let riskLevel: RiskLevel = 'low';
    if (validation.riskScore >= 80) riskLevel = 'critical';
    else if (validation.riskScore >= 60) riskLevel = 'high';
    else if (validation.riskScore >= 30) riskLevel = 'medium';

    // Log the security event
    securityLogger.log({
      userId,
      sessionId,
      action,
      component,
      riskLevel,
      data: {
        input: component === 'certification'
          ? { userInput: '[SENSITIVE_DATA]' } as SecurityInputData
          : (data as SecurityInputData),
        validation
      },
      metadata: {
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined
      }
    });

    if (!validation.isValid) {
      return {
        success: false,
        errors: validation.errors
      };
    }

    return {
      success: true,
      data: data
    };

  } catch (error) {
    securityLogger.log({
      userId,
      sessionId,
      action,
      component,
      riskLevel: 'critical',
      data: {
        errors: ['Security middleware error: ' + (error instanceof Error ? error.message : 'Unknown error')]
      },
      metadata: {}
    });

    return {
      success: false,
      errors: ['Erro interno de segurança']
    };
  }
}

// ================== UTILITÁRIOS DE SESSÃO ==================

/**
 * Geração segura de ID de sessão
 */
export function generateSecureSessionId(): string {
  const array = new Uint8Array(32);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    // Fallback for environments without crypto API
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Validação de timeout de sessão educativa
 */
export function validateSessionTimeout(sessionStart: Date, timeoutMinutes: number = 120): boolean {
  const now = new Date();
  const elapsed = now.getTime() - sessionStart.getTime();
  const timeoutMs = timeoutMinutes * 60 * 1000;
  
  return elapsed < timeoutMs;
}

// ================== EXPORTAÇÃO DOS COMPONENTES ==================

export const EducationalSecurity = {
  // Validação
  validateDoseCalculationInput,
  validateString,
  validateEmail,
  validateCertificationData,
  validateClinicalCaseAccess,
  
  // Sanitização
  sanitizeInput,
  
  // Criptografia e proteção de dados
  encryptSensitiveData,
  decryptSensitiveData,
  anonymizeUserData,
  
  // Rate limiting
  rateLimiter,
  
  // Auditoria
  securityLogger,
  
  // Middleware
  securityMiddleware,
  
  // Utilitários
  generateSecureVerificationCode,
  generateSecureSessionId,
  validateSessionTimeout,
  
  // Configuração
  config: SECURITY_CONFIG
};

export default EducationalSecurity;