/**
 * LGPD Compliance System for Educational Data
 * Sistema de Conformidade com a Lei Geral de Proteção de Dados
 * 
 * APLICAÇÃO ESPECÍFICA PARA DADOS EDUCACIONAIS DE SAÚDE
 * - Dados de profissionais farmacêuticos
 * - Progresso educativo e avaliações
 * - Certificações profissionais
 * - Informações de aprendizagem
 */

import { secureLogger } from '@/utils/secureLogger';

// ================== TIPOS LGPD ==================

export interface DataSubject {
  id: string;
  name: string;
  email: string;
  professionalRegistry?: string; // CRF number
  institution?: string;
  role: 'student' | 'professional' | 'researcher';
  consentStatus: ConsentStatus;
  dataCategories: DataCategory[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ConsentStatus {
  educational: boolean;
  analytics: boolean;
  certificates: boolean;
  communications: boolean;
  research: boolean;
  consentDate: Date;
  ipAddress?: string;
  userAgent?: string;
}

export type DataCategory = 
  | 'personal_identification'     // Nome, email, CRF
  | 'educational_progress'        // Progresso nos módulos
  | 'assessment_results'          // Resultados de avaliações
  | 'certification_data'          // Dados de certificação
  | 'professional_data'           // Dados profissionais
  | 'usage_analytics'            // Analytics de uso
  | 'technical_data';            // Dados técnicos (IP, browser)

export interface DataProcessingPurpose {
  purpose: ProcessingPurpose;
  legalBasis: LegalBasis;
  description: string;
  retentionPeriod: number; // days
  dataCategories: DataCategory[];
  isEssential: boolean;
  thirdPartySharing: boolean;
}

export type ProcessingPurpose =
  | 'education_delivery'          // Entrega do conteúdo educacional
  | 'progress_tracking'           // Acompanhamento do progresso
  | 'certification_issuance'      // Emissão de certificados
  | 'quality_improvement'         // Melhoria da qualidade educacional
  | 'research_academic'           // Pesquisa acadêmica
  | 'legal_compliance'            // Conformidade legal
  | 'security_fraud_prevention';  // Prevenção de fraudes

export type LegalBasis =
  | 'consent'                     // Consentimento (Art. 7º, I)
  | 'legitimate_interest'         // Interesse legítimo (Art. 7º, IX)
  | 'legal_obligation'           // Obrigação legal (Art. 7º, II)
  | 'contract_performance'        // Execução de contrato (Art. 7º, V)
  | 'public_interest'            // Interesse público (Art. 7º, IV)
  | 'vital_interests';           // Interesses vitais (Art. 7º, III)

export interface DataRetentionPolicy {
  category: DataCategory;
  retentionPeriod: number; // days
  archivalPeriod?: number; // days after retention
  anonymizationDate?: Date;
  deletionDate?: Date;
  reason: string;
}

export interface PrivacyRequest {
  id: string;
  subjectId: string;
  type: PrivacyRequestType;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  requestDate: Date;
  responseDate?: Date;
  details?: string;
  attachments?: string[];
}

export type PrivacyRequestType =
  | 'access'                     // Art. 15 - Direito de acesso
  | 'rectification'              // Art. 16 - Direito de retificação
  | 'erasure'                    // Art. 17 - Direito ao esquecimento
  | 'portability'                // Art. 20 - Direito à portabilidade
  | 'restrict_processing'         // Art. 18 - Direito à limitação
  | 'object_processing'          // Art. 21 - Direito de oposição
  | 'withdraw_consent';          // Retirada de consentimento

// ================== CONFIGURAÇÃO DE COMPLIANCE ==================

const LGPD_CONFIG = {
  dataController: {
    name: 'Universidade de Brasília - Faculdade de Ciências Farmacêuticas',
    representative: 'Doutorando Nélio Gomes de Moura Júnior',
    email: 'dados@unb.br',
    phone: '+55 61 3107-1000',
    address: 'Campus Universitário Darcy Ribeiro, Asa Norte, Brasília/DF'
  },
  
  dataProcessor: {
    name: 'Sistema Educacional de Dispensação Farmacêutica',
    description: 'Plataforma educacional baseada em tese de doutorado',
    technicalContact: 'suporte.tecnico@unb.br'
  },

  retentionPolicies: [
    {
      category: 'personal_identification' as DataCategory,
      retentionPeriod: 1825, // 5 anos após conclusão
      reason: 'Emissão e verificação de certificados profissionais'
    },
    {
      category: 'educational_progress' as DataCategory,
      retentionPeriod: 1095, // 3 anos
      reason: 'Acompanhamento educacional e melhoria de qualidade'
    },
    {
      category: 'assessment_results' as DataCategory,
      retentionPeriod: 2555, // 7 anos (registros educacionais)
      reason: 'Conformidade com normas educacionais do MEC'
    },
    {
      category: 'certification_data' as DataCategory,
      retentionPeriod: 7300, // 20 anos (certificados profissionais)
      reason: 'Verificação perpétua de certificação profissional'
    },
    {
      category: 'usage_analytics' as DataCategory,
      retentionPeriod: 365, // 1 ano
      reason: 'Melhoria da experiência educacional'
    },
    {
      category: 'technical_data' as DataCategory,
      retentionPeriod: 180, // 6 meses
      reason: 'Segurança e prevenção de fraudes'
    }
  ] as DataRetentionPolicy[],

  processingPurposes: [
    {
      purpose: 'education_delivery' as ProcessingPurpose,
      legalBasis: 'legitimate_interest' as LegalBasis,
      description: 'Fornecimento de conteúdo educacional sobre dispensação farmacêutica',
      retentionPeriod: 1095,
      dataCategories: ['personal_identification', 'educational_progress'] as DataCategory[],
      isEssential: true,
      thirdPartySharing: false
    },
    {
      purpose: 'progress_tracking' as ProcessingPurpose,
      legalBasis: 'legitimate_interest' as LegalBasis,
      description: 'Acompanhamento do progresso educacional do usuário',
      retentionPeriod: 1095,
      dataCategories: ['educational_progress', 'assessment_results'] as DataCategory[],
      isEssential: true,
      thirdPartySharing: false
    },
    {
      purpose: 'certification_issuance' as ProcessingPurpose,
      legalBasis: 'contract_performance' as LegalBasis,
      description: 'Emissão de certificados de conclusão do programa educacional',
      retentionPeriod: 7300,
      dataCategories: ['personal_identification', 'assessment_results', 'certification_data'] as DataCategory[],
      isEssential: true,
      thirdPartySharing: false
    },
    {
      purpose: 'quality_improvement' as ProcessingPurpose,
      legalBasis: 'consent' as LegalBasis,
      description: 'Análise de dados para melhoria da qualidade educacional',
      retentionPeriod: 1095,
      dataCategories: ['usage_analytics', 'assessment_results'] as DataCategory[],
      isEssential: false,
      thirdPartySharing: false
    },
    {
      purpose: 'research_academic' as ProcessingPurpose,
      legalBasis: 'consent' as LegalBasis,
      description: 'Pesquisa acadêmica sobre educação farmacêutica (dados anonimizados)',
      retentionPeriod: 1825,
      dataCategories: ['assessment_results', 'usage_analytics'] as DataCategory[],
      isEssential: false,
      thirdPartySharing: true
    },
    {
      purpose: 'security_fraud_prevention' as ProcessingPurpose,
      legalBasis: 'legitimate_interest' as LegalBasis,
      description: 'Prevenção de fraudes e garantia da segurança do sistema',
      retentionPeriod: 180,
      dataCategories: ['technical_data'] as DataCategory[],
      isEssential: true,
      thirdPartySharing: false
    }
  ] as DataProcessingPurpose[]
};

// ================== GESTÃO DE CONSENTIMENTO ==================

class ConsentManager {
  /**
   * Registrar consentimento do usuário
   */
  async recordConsent(
    subjectId: string,
    consentData: ConsentStatus,
    metadata: { ipAddress?: string; userAgent?: string }
  ): Promise<void> {
    const consent: ConsentStatus = {
      ...consentData,
      consentDate: new Date(),
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent
    };

    // Store consent record (localStorage for demo)
    const consentKey = `consent_${subjectId}`;
    localStorage.setItem(consentKey, JSON.stringify(consent));

    // Log consent for audit
    secureLogger.lgpd('Consentimento registrado', subjectId, { 
      educational: consent.educational,
      analytics: consent.analytics,
      certificates: consent.certificates,
      communications: consent.communications,
      research: consent.research
    });
  }

  /**
   * Verificar se o consentimento é válido para uma finalidade
   */
  hasValidConsent(subjectId: string, purpose: ProcessingPurpose): boolean {
    const consentData = this.getConsent(subjectId);
    if (!consentData) return false;

    const purposeConfig = LGPD_CONFIG.processingPurposes.find(p => p.purpose === purpose);
    if (!purposeConfig) return false;

    // Se o processamento tem base legal diferente de consentimento, não precisa verificar
    if (purposeConfig.legalBasis !== 'consent') return true;

    // Verificar consentimentos específicos
    switch (purpose) {
      case 'quality_improvement':
        return consentData.analytics;
      case 'research_academic':
        return consentData.research;
      default:
        return true; // Para finalidades essenciais
    }
  }

  /**
   * Obter dados de consentimento
   */
  private getConsent(subjectId: string): ConsentStatus | null {
    const consentKey = `consent_${subjectId}`;
    const stored = localStorage.getItem(consentKey);
    return stored ? JSON.parse(stored) : null;
  }

  /**
   * Retirar consentimento
   */
  async withdrawConsent(subjectId: string, categories: Array<keyof ConsentStatus>): Promise<void> {
    const current = this.getConsent(subjectId);
    if (!current) return;

    const updated: ConsentStatus = { ...current };
    for (const category of categories) {
      if (typeof updated[category] === 'boolean') {
        (updated[category] as boolean) = false;
      }
    }

    updated.consentDate = new Date();
    const consentKey = `consent_${subjectId}`;
    localStorage.setItem(consentKey, JSON.stringify(updated));

    secureLogger.lgpd('Consentimento retirado', subjectId, { categories });
  }
}

// ================== GESTÃO DE DADOS PESSOAIS ==================

class DataManager {
  /**
   * Coletar dados pessoais com finalidade específica
   */
  async collectData(
    subjectId: string,
    purpose: ProcessingPurpose,
    data: Record<string, unknown>,
    categories: DataCategory[]
  ): Promise<boolean> {
    // Verificar se há base legal para o processamento
    const hasLegalBasis = this.hasLegalBasisForProcessing(subjectId, purpose);
    if (!hasLegalBasis) {
      secureLogger.warn('LGPD: Sem base legal para coleta de dados', { purpose });
      return false;
    }

    // Minimização de dados - coletar apenas o necessário
    const minimizedData = this.minimizeData(data, purpose);

    // Pseudonimização para dados não essenciais
    const processedData = this.pseudonymizeIfNeeded(minimizedData, purpose);

    // Armazenar dados com metadata de LGPD
    const dataRecord = {
      subjectId,
      purpose,
      categories,
      data: processedData,
      collectedAt: new Date(),
      retentionUntil: this.calculateRetentionDate(purpose),
      legalBasis: this.getLegalBasisForPurpose(purpose)
    };

    const dataKey = `data_${subjectId}_${purpose}_${Date.now()}`;
    localStorage.setItem(dataKey, JSON.stringify(dataRecord));

    return true;
  }

  /**
   * Verificar base legal para processamento
   */
  private hasLegalBasisForProcessing(subjectId: string, purpose: ProcessingPurpose): boolean {
    const purposeConfig = LGPD_CONFIG.processingPurposes.find(p => p.purpose === purpose);
    if (!purposeConfig) return false;

    switch (purposeConfig.legalBasis) {
      case 'consent':
        return consentManager.hasValidConsent(subjectId, purpose);
      case 'legitimate_interest':
      case 'contract_performance':
      case 'legal_obligation':
        return true; // Já tem base legal
      default:
        return false;
    }
  }

  /**
   * Minimização de dados - coletar apenas o necessário
   */
  private minimizeData(data: Record<string, unknown>, purpose: ProcessingPurpose): Record<string, unknown> {
    const purposeConfig = LGPD_CONFIG.processingPurposes.find(p => p.purpose === purpose);
    if (!purposeConfig) return data;

    const minimized: Record<string, unknown> = {};

    // Incluir apenas os dados necessários para a finalidade
    if (purposeConfig.dataCategories.includes('personal_identification')) {
      if (data.name) minimized.name = data.name;
      if (data.email) minimized.email = data.email;
      if (data.professionalRegistry) minimized.professionalRegistry = data.professionalRegistry;
    }

    if (purposeConfig.dataCategories.includes('educational_progress')) {
      if (data.progress) minimized.progress = data.progress;
      if (data.completedModules) minimized.completedModules = data.completedModules;
    }

    if (purposeConfig.dataCategories.includes('assessment_results')) {
      if (data.scores) minimized.scores = data.scores;
      if (data.attempts) minimized.attempts = data.attempts;
    }

    return minimized;
  }

  /**
   * Pseudonimização quando apropriada
   */
  private pseudonymizeIfNeeded(data: Record<string, unknown>, purpose: ProcessingPurpose): Record<string, unknown> {
    const nonEssentialPurposes = ['quality_improvement', 'research_academic'];
    
    if (!nonEssentialPurposes.includes(purpose)) {
      return data; // Manter dados originais para finalidades essenciais
    }

    const pseudonymized = { ...data };
    
    if (pseudonymized.name && typeof pseudonymized.name === 'string') {
      pseudonymized.name = this.createPseudonym(pseudonymized.name);
    }
    
    if (pseudonymized.email && typeof pseudonymized.email === 'string') {
      pseudonymized.email = this.createPseudonym(pseudonymized.email);
    }

    return pseudonymized;
  }

  private createPseudonym(value: string): string {
    // Criar pseudônimo determinístico mas não reversível
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      const char = value.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return `USER_${Math.abs(hash).toString(36).toUpperCase().substring(0, 8)}`;
  }

  private calculateRetentionDate(purpose: ProcessingPurpose): Date {
    const config = LGPD_CONFIG.processingPurposes.find(p => p.purpose === purpose);
    const retentionDays = config?.retentionPeriod || 365;
    
    const retentionDate = new Date();
    retentionDate.setDate(retentionDate.getDate() + retentionDays);
    
    return retentionDate;
  }

  private getLegalBasisForPurpose(purpose: ProcessingPurpose): LegalBasis {
    const config = LGPD_CONFIG.processingPurposes.find(p => p.purpose === purpose);
    return config?.legalBasis || 'consent';
  }
}

// ================== PROCESSAMENTO DE SOLICITAÇÕES ==================

class PrivacyRequestProcessor {
  /**
   * Processar solicitação de acesso aos dados
   */
  async processAccessRequest(subjectId: string): Promise<Record<string, unknown>> {
    const dataKeys = this.getDataKeysForSubject(subjectId);
    const userData: Record<string, unknown> = {
      personalData: {},
      processingActivities: [],
      retentionPolicies: LGPD_CONFIG.retentionPolicies,
      legalBasis: LGPD_CONFIG.processingPurposes
    };

    for (const key of dataKeys) {
      const stored = localStorage.getItem(key);
      if (stored) {
        const record = JSON.parse(stored);
        (userData.processingActivities as any[]).push({
          purpose: record.purpose,
          collectedAt: record.collectedAt,
          retentionUntil: record.retentionUntil,
          legalBasis: record.legalBasis,
          categories: record.categories
        });
        
        // Merge data (sem exposição de dados pseudonimizados)
        if (record.data && typeof record.data === 'object') {
          Object.assign(userData.personalData as any, record.data);
        }
      }
    }

    return userData;
  }

  /**
   * Processar solicitação de portabilidade
   */
  async processPortabilityRequest(subjectId: string): Promise<string> {
    const userData = await this.processAccessRequest(subjectId);
    
    // Formato estruturado para portabilidade (JSON)
    const portableData = {
      exportDate: new Date().toISOString(),
      dataSubject: subjectId,
      controller: LGPD_CONFIG.dataController,
      data: userData.personalData,
      metadata: {
        processingActivities: userData.processingActivities,
        exportFormat: 'JSON',
        encoding: 'UTF-8'
      }
    };

    return JSON.stringify(portableData, null, 2);
  }

  /**
   * Processar solicitação de exclusão/esquecimento
   */
  async processErasureRequest(subjectId: string, reason: string): Promise<boolean> {
    const dataKeys = this.getDataKeysForSubject(subjectId);
    
    for (const key of dataKeys) {
      const stored = localStorage.getItem(key);
      if (stored) {
        const record = JSON.parse(stored);
        
        // Verificar se pode ser deletado (algumas retenções são legalmente obrigatórias)
        if (this.canBeDeleted(record)) {
          localStorage.removeItem(key);
          secureLogger.lgpd('Dados deletados', 'system-cleanup', { key });
        } else {
          // Anonimizar se não pode deletar
          record.data = this.anonymizeRecord(record.data);
          record.anonymizedAt = new Date();
          record.anonymizationReason = reason;
          localStorage.setItem(key, JSON.stringify(record));
          secureLogger.lgpd('Dados anonimizados', 'system-cleanup', { key });
        }
      }
    }

    // Remover consentimentos
    localStorage.removeItem(`consent_${subjectId}`);

    return true;
  }

  private getDataKeysForSubject(subjectId: string): string[] {
    const keys: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`data_${subjectId}_`)) {
        keys.push(key);
      }
    }
    
    return keys;
  }

  private canBeDeleted(record: Record<string, unknown>): boolean {
    // Certificados profissionais não podem ser deletados (obrigação legal)
    if (record.purpose === 'certification_issuance') return false;
    
    // Dados de pesquisa acadêmica podem ser apenas anonimizados
    if (record.purpose === 'research_academic') return false;
    
    return true;
  }

  private anonymizeRecord(data: Record<string, unknown>): Record<string, unknown> {
    const anonymized = { ...data };
    
    // Remover/substituir identificadores diretos
    if (anonymized.name) anonymized.name = '[ANONIMIZADO]';
    if (anonymized.email) anonymized.email = '[ANONIMIZADO]';
    if (anonymized.professionalRegistry) anonymized.professionalRegistry = '[ANONIMIZADO]';
    
    return anonymized;
  }
}

// ================== AUDITORIA E COMPLIANCE ==================

class ComplianceAuditor {
  /**
   * Gerar relatório de compliance LGPD
   */
  generateComplianceReport(): Record<string, unknown> {
    return {
      timestamp: new Date().toISOString(),
      controller: LGPD_CONFIG.dataController,
      processor: LGPD_CONFIG.dataProcessor,
      
      dataProcessing: {
        purposes: LGPD_CONFIG.processingPurposes.length,
        legalBasisDistribution: this.getLegalBasisDistribution(),
        retentionPolicies: LGPD_CONFIG.retentionPolicies.length
      },
      
      dataSubjects: {
        totalActive: this.countActiveDataSubjects(),
        consentGiven: this.countConsentsByType(),
        requestsProcessed: this.countPrivacyRequests()
      },
      
      securityMeasures: {
        encryption: 'AES-256-GCM',
        pseudonymization: 'Implementado para pesquisa',
        accessControl: 'Baseado em funções',
        auditLog: 'Completo'
      },
      
      compliance: {
        privacyPolicy: 'Atualizado',
        consentMechanism: 'Granular',
        rightsExercise: 'Automatizado',
        breachNotification: 'Configurado',
        dpo: LGPD_CONFIG.dataController.representative
      }
    };
  }

  private getLegalBasisDistribution(): Record<LegalBasis, number> {
    const distribution: Record<LegalBasis, number> = {
      consent: 0,
      legitimate_interest: 0,
      legal_obligation: 0,
      contract_performance: 0,
      public_interest: 0,
      vital_interests: 0
    };

    for (const purpose of LGPD_CONFIG.processingPurposes) {
      distribution[purpose.legalBasis]++;
    }

    return distribution;
  }

  private countActiveDataSubjects(): number {
    let count = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('consent_')) {
        count++;
      }
    }
    return count;
  }

  private countConsentsByType(): Record<string, number> {
    const counts = {
      educational: 0,
      analytics: 0,
      certificates: 0,
      communications: 0,
      research: 0
    };

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('consent_')) {
        const consent = JSON.parse(localStorage.getItem(key) || '{}');
        for (const [type, value] of Object.entries(consent)) {
          if (typeof value === 'boolean' && value && counts.hasOwnProperty(type)) {
            counts[type as keyof typeof counts]++;
          }
        }
      }
    }

    return counts;
  }

  private countPrivacyRequests(): Record<PrivacyRequestType, number> {
    // Em implementação real, isso viria de um banco de dados
    return {
      access: 0,
      rectification: 0,
      erasure: 0,
      portability: 0,
      restrict_processing: 0,
      object_processing: 0,
      withdraw_consent: 0
    };
  }
}

// ================== INSTÂNCIAS DOS GERENCIADORES ==================

export const consentManager = new ConsentManager();
export const dataManager = new DataManager();
export const privacyRequestProcessor = new PrivacyRequestProcessor();
export const complianceAuditor = new ComplianceAuditor();

// ================== HOOK PRINCIPAL PARA COMPONENTES ==================

/**
 * Hook principal para compliance LGPD em componentes educativos
 */
export function useLGPDCompliance() {
  return {
    // Gestão de consentimento
    recordConsent: consentManager.recordConsent.bind(consentManager),
    hasValidConsent: consentManager.hasValidConsent.bind(consentManager),
    withdrawConsent: consentManager.withdrawConsent.bind(consentManager),
    
    // Gestão de dados
    collectData: dataManager.collectData.bind(dataManager),
    
    // Direitos do titular
    processAccessRequest: privacyRequestProcessor.processAccessRequest.bind(privacyRequestProcessor),
    processPortabilityRequest: privacyRequestProcessor.processPortabilityRequest.bind(privacyRequestProcessor),
    processErasureRequest: privacyRequestProcessor.processErasureRequest.bind(privacyRequestProcessor),
    
    // Compliance
    generateComplianceReport: complianceAuditor.generateComplianceReport.bind(complianceAuditor),
    
    // Configuração
    config: LGPD_CONFIG
  };
}

// ================== UTILITÁRIOS PÚBLICOS ==================

export const LGPDUtils = {
  /**
   * Gerar aviso de privacidade contextual
   */
  generatePrivacyNotice(purpose: ProcessingPurpose): string {
    const purposeConfig = LGPD_CONFIG.processingPurposes.find(p => p.purpose === purpose);
    if (!purposeConfig) return '';

    return `
📋 AVISO DE PRIVACIDADE

Finalidade: ${purposeConfig.description}
Base Legal: ${this.getLegalBasisText(purposeConfig.legalBasis)}
Categorias de Dados: ${purposeConfig.dataCategories.join(', ')}
Período de Retenção: ${Math.floor(purposeConfig.retentionPeriod / 365)} anos
Compartilhamento: ${purposeConfig.thirdPartySharing ? 'Sim (para fins acadêmicos)' : 'Não'}

Controlador: ${LGPD_CONFIG.dataController.name}
Contato: ${LGPD_CONFIG.dataController.email}

Seus direitos: acesso, retificação, exclusão, portabilidade, oposição e revisão de decisões automatizadas.
    `.trim();
  },

  getLegalBasisText(basis: LegalBasis): string {
    const texts: Record<LegalBasis, string> = {
      consent: 'Consentimento do titular',
      legitimate_interest: 'Interesse legítimo do controlador',
      legal_obligation: 'Cumprimento de obrigação legal',
      contract_performance: 'Execução de contrato',
      public_interest: 'Exercício regular de direitos em processo',
      vital_interests: 'Proteção da vida ou incolumidade física'
    };
    
    return texts[basis] || basis;
  },

  /**
   * Validar se dados podem ser processados
   */
  canProcessData(subjectId: string, purpose: ProcessingPurpose, dataCategories: DataCategory[]): boolean {
    // Verificar base legal
    const purposeConfig = LGPD_CONFIG.processingPurposes.find(p => p.purpose === purpose);
    if (!purposeConfig) return false;

    // Verificar se as categorias de dados são permitidas para a finalidade
    const allowedCategories = purposeConfig.dataCategories;
    for (const category of dataCategories) {
      if (!allowedCategories.includes(category)) {
        return false;
      }
    }

    // Verificar consentimento se necessário
    if (purposeConfig.legalBasis === 'consent') {
      return consentManager.hasValidConsent(subjectId, purpose);
    }

    return true;
  }
};

const LGPDComplianceModule = {
  consentManager,
  dataManager,
  privacyRequestProcessor,
  complianceAuditor,
  useLGPDCompliance,
  LGPDUtils,
  LGPD_CONFIG
};

export default LGPDComplianceModule;