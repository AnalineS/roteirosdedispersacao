/**
 * Tipos TypeScript para Sistema de Certificação
 * Baseado na tese de doutorado de Nélio Gomes de Moura Júnior
 * Sistema de certificação educacional para simulador clínico
 */

export interface CertificationCriteria {
  minimumScore: number; // Pontuação mínima (ex: 80%)
  requiredCompletions: number; // Número mínimo de casos
  totalHours: number; // Carga horária total
  requiredCategories: string[]; // Categorias obrigatórias
  timeLimit?: number; // Prazo máximo para conclusão (dias)
  retryLimit?: number; // Número máximo de tentativas por caso
}

export interface UserProgress {
  userId: string;
  userName: string;
  email?: string;
  startDate: Date;
  lastActivity: Date;
  
  // Progress tracking
  casesCompleted: CompletedCase[];
  totalScore: number;
  averageScore: number;
  totalTimeSpent: number; // minutos
  
  // Status
  certificationStatus: 'not_started' | 'in_progress' | 'eligible' | 'certified';
  certificationDate?: Date;
  certificateId?: string;
  
  // Analytics
  strengthAreas: string[];
  improvementAreas: string[];
  recommendedCases: string[];
}

export interface CompletedCase {
  caseId: string;
  caseTitle: string;
  category: string;
  difficulty: string;
  
  // Performance
  score: number;
  maxScore: number;
  percentage: number;
  timeSpent: number; // minutos
  attemptNumber: number;
  completionDate: Date;
  
  // Detailed results
  stepResults: {
    stepId: string;
    stepTitle: string;
    score: number;
    maxScore: number;
    correct: boolean;
  }[];
  
  // Competency analysis
  competencyScores: {
    competency: string;
    score: number;
    maxScore: number;
  }[];
}

export interface Certificate {
  id: string;
  userId: string;
  
  // Certificate details
  recipientName: string;
  recipientEmail?: string;
  issueDate: Date;
  expiryDate?: Date;
  
  // Program information
  programTitle: string;
  programDescription: string;
  totalHours: number;
  
  // Academic credentials
  supervisorName: string;
  institution: string;
  researchTitle: string;
  
  // Performance summary
  overallScore: number;
  casesCompleted: number;
  totalCases: number;
  competenciesAchieved: string[];
  
  // Verification
  verificationCode: string;
  digitalSignature?: string;
  qrCodeData: string;
  
  // Certificate template data
  template: CertificateTemplate;
  customization: CertificateCustomization;
}

export interface CertificateTemplate {
  type: 'completion' | 'excellence' | 'participation';
  layout: 'classic' | 'modern' | 'academic';
  
  // Visual elements
  backgroundColor: string;
  accentColor: string;
  logoUrl?: string;
  backgroundPattern?: string;
  
  // Content structure
  headerText: string;
  bodyTemplate: string;
  footerText: string;
  
  // Academic elements
  includeGrade: boolean;
  includeHours: boolean;
  includeCompetencies: boolean;
  includeVerification: boolean;
}

export interface CertificateCustomization {
  includePhoto: boolean;
  includeSupervisorSignature: boolean;
  includeInstitutionSeal: boolean;
  includeQRCode: boolean;
  
  // Language
  language: 'pt-BR' | 'en-US';
  
  // Format options
  format: 'A4' | 'Letter' | 'Certificate';
  orientation: 'portrait' | 'landscape';
  
  // Export options
  formats: ('pdf' | 'png' | 'jpg')[];
  resolution: 'standard' | 'high' | 'print';
}

export interface CompetencyFramework {
  id: string;
  title: string;
  description: string;
  
  competencies: Competency[];
  assessmentCriteria: AssessmentCriteria[];
  certificationLevels: CertificationLevel[];
}

export interface Competency {
  id: string;
  title: string;
  description: string;
  category: 'technical' | 'clinical' | 'communication' | 'safety' | 'regulatory';
  
  // Learning outcomes
  learningOutcomes: string[];
  assessmentMethods: string[];
  
  // Mapping to cases
  relatedCases: string[];
  weightInCertification: number; // 0-1
}

export interface AssessmentCriteria {
  competencyId: string;
  criteria: {
    level: 'novice' | 'competent' | 'proficient' | 'expert';
    description: string;
    scoreRange: [number, number]; // min, max percentage
    behaviors: string[];
  }[];
}

export interface CertificationLevel {
  id: string;
  title: string;
  description: string;
  
  requirements: {
    minimumScore: number;
    requiredCompetencies: string[];
    requiredCases: number;
    timeLimit?: number;
  };
  
  benefits: string[];
  badge: CertificationBadge;
}

export interface CertificationBadge {
  id: string;
  title: string;
  description: string;
  iconUrl: string;
  color: string;
  
  // Verification
  issuer: string;
  verificationUrl?: string;
  blockchainHash?: string;
}

// System configuration
export interface CertificationConfig {
  // Program details
  programInfo: {
    title: string;
    subtitle: string;
    description: string;
    version: string;
    lastUpdated: Date;
  };
  
  // Academic supervision
  supervision: {
    supervisorName: string;
    supervisorTitle: string;
    supervisorInstitution: string;
    coSupervisors?: string[];
  };
  
  // Institutional info
  institution: {
    name: string;
    department: string;
    address: string;
    website: string;
    logoUrl: string;
  };
  
  // Certification criteria
  criteria: CertificationCriteria;
  
  // Template settings
  defaultTemplate: CertificateTemplate;
  availableTemplates: CertificateTemplate[];
  
  // Verification system
  verification: {
    baseUrl: string;
    qrCodeEnabled: boolean;
    blockchainEnabled: boolean;
    emailVerification: boolean;
  };
}

// Default certification configuration based on thesis
export const DEFAULT_CERTIFICATION_CONFIG: CertificationConfig = {
  programInfo: {
    title: 'Certificação em Dispensação Farmacêutica - Hanseníase PQT-U',
    subtitle: 'Programa Educacional Baseado em Evidências',
    description: 'Programa de capacitação para farmacêuticos em dispensação de poliquimioterapia única para hanseníase, fundamentado em pesquisa acadêmica e protocolos nacionais.',
    version: '1.0',
    lastUpdated: new Date()
  },
  
  supervision: {
    supervisorName: 'Nélio Gomes de Moura Júnior',
    supervisorTitle: 'Doutorando em Ciências Farmacêuticas',
    supervisorInstitution: 'Programa de Pós-graduação em Ciências Farmacêuticas',
    coSupervisors: []
  },
  
  institution: {
    name: 'Universidade Federal',
    department: 'Programa de Pós-graduação em Ciências Farmacêuticas',
    address: 'Brasil',
    website: 'https://roteirosdedispensacao.com',
    logoUrl: '/assets/institutional-logo.png'
  },
  
  criteria: {
    minimumScore: 80, // 80% mínimo
    requiredCompletions: 4, // 4 casos obrigatórios (de 5 disponíveis)
    totalHours: 12, // 12-15 horas de dedicação
    requiredCategories: ['pediatrico', 'adulto', 'gravidez'], // 3 categorias obrigatórias
    timeLimit: 90, // 90 dias para conclusão
    retryLimit: 3 // máximo 3 tentativas por caso
  },
  
  defaultTemplate: {
    type: 'completion',
    layout: 'academic',
    backgroundColor: '#FFFFFF',
    accentColor: '#2563EB',
    logoUrl: '/assets/certificate-logo.png',
    backgroundPattern: 'academic-border',
    headerText: 'CERTIFICADO DE CONCLUSÃO',
    bodyTemplate: `Certificamos que {recipientName} concluiu com aproveitamento o programa de capacitação em "Dispensação Farmacêutica - Hanseníase PQT-U", desenvolvido com base na tese de doutorado de {supervisorName}.

O programa, com carga horária de {totalHours} horas, abordou competências essenciais em:
• Protocolos de dispensação PQT-U
• Cálculos posológicos pediátricos e adultos
• Orientação farmacêutica especializada
• Manejo de situações clínicas complexas
• Farmacovigilância e segurança

Pontuação obtida: {overallScore}% | Casos concluídos: {casesCompleted}/{totalCases}`,
    footerText: 'Programa fundamentado em evidências científicas e protocolos do Ministério da Saúde',
    includeGrade: true,
    includeHours: true,
    includeCompetencies: true,
    includeVerification: true
  },
  
  availableTemplates: [], // Será populado com templates adicionais
  
  verification: {
    baseUrl: 'https://roteirosdedispensacao.com/verify',
    qrCodeEnabled: true,
    blockchainEnabled: false,
    emailVerification: true
  }
};

// Utility functions
export const calculateOverallProgress = (progress: UserProgress): number => {
  if (progress.casesCompleted.length === 0) return 0;
  return Math.round(progress.totalScore / progress.casesCompleted.length);
};

export const checkCertificationEligibility = (
  progress: UserProgress, 
  criteria: CertificationCriteria
): { eligible: boolean; missing: string[] } => {
  const missing: string[] = [];
  
  // Check minimum cases
  if (progress.casesCompleted.length < criteria.requiredCompletions) {
    missing.push(`${criteria.requiredCompletions - progress.casesCompleted.length} casos adicionais`);
  }
  
  // Check minimum score
  if (progress.averageScore < criteria.minimumScore) {
    missing.push(`${criteria.minimumScore - progress.averageScore}% pontos adicionais`);
  }
  
  // Check required categories
  const completedCategories = new Set(progress.casesCompleted.map(c => c.category));
  const missingCategories = criteria.requiredCategories.filter(cat => !completedCategories.has(cat));
  if (missingCategories.length > 0) {
    missing.push(`Categorias: ${missingCategories.join(', ')}`);
  }
  
  // Check time limit
  if (criteria.timeLimit) {
    const daysSinceStart = Math.floor((Date.now() - progress.startDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceStart > criteria.timeLimit) {
      missing.push('Prazo expirado');
    }
  }
  
  return {
    eligible: missing.length === 0,
    missing
  };
};

export const generateCertificateId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substr(2, 9);
  return `CERT-${timestamp}-${randomPart}`.toUpperCase();
};

export const generateVerificationCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 12; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
    if (i === 3 || i === 7) result += '-';
  }
  return result;
};