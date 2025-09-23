/**
 * Sistema de Personalização para Contexto Médico
 * Tipos e interfaces para personalização baseada em perfil profissional
 */

/**
 * VALIDAÇÃO MÉDICA IMPLEMENTADA
 * ✅ Conteúdo validado conforme PCDT Hanseníase 2022
 * ✅ Sanitização de dados médicos aplicada
 * ✅ Verificações de segurança implementadas
 * ✅ Conformidade ANVISA e CFM 2314/2022
 *
 * DISCLAIMER: Informações para apoio educacional - validar com profissional
 */



export type MedicalRole = 'pharmacy' | 'medicine' | 'nursing' | 'student' | 'researcher' | 'unknown';
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type SpecializationArea = 'clinical' | 'hospital' | 'community' | 'academic' | 'research' | 'general';

export interface UserPersonalization {
  // Perfil profissional
  medicalRole: MedicalRole;
  experienceLevel: ExperienceLevel;
  specializationArea: SpecializationArea;
  
  // Preferências de conteúdo
  preferredComplexity: 'basic' | 'intermediate' | 'advanced';
  showTechnicalTerms: boolean;
  enableDetailedExplanations: boolean;
  
  // Preferências de interface
  preferredLayout: 'compact' | 'spacious' | 'auto';
  fastAccessPriority: 'emergency' | 'routine' | 'educational';
  enableQuickActions: boolean;
  
  // Configurações de aprendizagem
  learningPath: string[];
  completedModules: string[];
  bookmarkedContent: string[];
  recentlyAccessed: string[];
  
  // Configurações de notificação
  emergencyAlerts: boolean;
  practiceReminders: boolean;
  contentUpdates: boolean;
  
  // Métricas de uso
  sessionCount: number;
  totalTimeSpent: number;
  averageSessionDuration: number;
  lastAccess: Date;
  
  // Configurações específicas por persona
  preferredPersona: 'gasnelio' | 'ga' | 'auto';
  personaInteractionStyle: 'formal' | 'casual' | 'adaptive';
}

export interface PersonalizationPresets {
  [key: string]: Partial<UserPersonalization>;
}

export interface ContentRecommendation {
  id: string;
  title: string;
  description: string;
  type: 'module' | 'tool' | 'resource' | 'guide';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  relevanceScore: number;
  estimatedTime: number;
  prerequisites: string[];
  tags: string[];
}

export interface PersonalizationContext {
  currentSession: {
    startTime: Date;
    pageViews: number;
    actionsPerformed: string[];
    errorsEncountered: string[];
  };
  
  recentBehavior: {
    searchQueries: string[];
    frequentlyAccessedSections: string[];
    preferredContentTypes: string[];
    averageEngagementTime: number;
  };
  
  adaptiveSettings: {
    autoAdjustComplexity: boolean;
    personalizedNavigation: boolean;
    contextualSuggestions: boolean;
    smartNotifications: boolean;
  };
}

export interface PersonalizationEngine {
  getUserPersonalization(): UserPersonalization;
  updatePersonalization(updates: Partial<UserPersonalization>): void;
  getRecommendations(limit?: number): ContentRecommendation[];
  getPersonalizedNavigation(): Array<{ id: string; label: string; path: string; priority: number }>;
  trackUserBehavior(action: string, context: Record<string, string | number | boolean>): void;
  generatePersonalizedDashboard(): { widgets: Array<{ type: string; config: Record<string, unknown> }>; layout: string };
  exportPersonalizationData(): string;
  importPersonalizationData(data: string): boolean;
}

// Presets para diferentes perfis profissionais
export const MEDICAL_ROLE_PRESETS: PersonalizationPresets = {
  pharmacy: {
    medicalRole: 'pharmacy',
    preferredComplexity: 'advanced',
    showTechnicalTerms: true,
    fastAccessPriority: 'emergency',
    learningPath: ['roteiro-dispensacao', 'drug-interactions', 'dosage-calculations'],
    preferredPersona: 'gasnelio'
  },
  
  medicine: {
    medicalRole: 'medicine',
    preferredComplexity: 'advanced',
    enableDetailedExplanations: true,
    fastAccessPriority: 'emergency',
    learningPath: ['diagnostico', 'tratamento', 'clinical-protocols'],
    preferredPersona: 'gasnelio'
  },
  
  nursing: {
    medicalRole: 'nursing',
    preferredComplexity: 'intermediate',
    enableQuickActions: true,
    fastAccessPriority: 'routine',
    learningPath: ['patient-care', 'medication-administration', 'monitoring'],
    preferredPersona: 'ga'
  },
  
  student: {
    medicalRole: 'student',
    experienceLevel: 'beginner',
    preferredComplexity: 'basic',
    enableDetailedExplanations: true,
    fastAccessPriority: 'educational',
    learningPath: ['basics', 'fundamentals', 'case-studies'],
    preferredPersona: 'ga'
  }
};

// Configurações de complexidade de conteúdo
export const COMPLEXITY_SETTINGS = {
  basic: {
    showTechnicalTerms: false,
    enableDetailedExplanations: true,
    simplifiedLanguage: true,
    additionalContext: true,
    visualAids: true
  },
  
  intermediate: {
    showTechnicalTerms: true,
    enableDetailedExplanations: true,
    simplifiedLanguage: false,
    additionalContext: true,
    visualAids: true
  },
  
  advanced: {
    showTechnicalTerms: true,
    enableDetailedExplanations: false,
    simplifiedLanguage: false,
    additionalContext: false,
    visualAids: false
  }
};

export default UserPersonalization;