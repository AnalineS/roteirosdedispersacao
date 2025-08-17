/**
 * Tipos TypeScript para atalhos de emergência médica
 * Sistema de Fast Access Bar com foco em segurança clínica
 */

export type UrgencyLevel = 'critical' | 'important' | 'standard';
export type MedicalSpecialty = 'pharmacy' | 'medicine' | 'nursing' | 'general';
export type ExperienceLevel = 'junior' | 'senior' | 'expert';

export interface EmergencyShortcut {
  id: string;
  label: string;
  href: string;
  icon: string;
  urgency: UrgencyLevel;
  category: 'interactions' | 'contraindications' | 'dosing' | 'protocols' | 'contact';
  description: string;
  accessKey?: string; // Para navegação por teclado rápida
  estimatedTime?: string; // Tempo estimado para encontrar informação
  requiredRole?: MedicalSpecialty[]; // Especialidades que mais usam
  analytics?: {
    event: string;
    category: string;
    label: string;
  };
}

export interface CustomShortcut extends Omit<EmergencyShortcut, 'id' | 'urgency'> {
  id: string;
  isCustom: true;
  createdAt: number;
  usageCount: number;
  lastUsed: number;
}

export interface ShortcutCategory {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
  shortcuts: EmergencyShortcut[];
}

export interface FastAccessBarConfig {
  isEnabled: boolean;
  position: 'top' | 'bottom';
  behavior: 'sticky' | 'fixed' | 'smart-hide';
  maxShortcuts: number;
  customizationEnabled: boolean;
  fixedShortcuts: string[]; // IDs de atalhos que não podem ser removidos
  analytics: {
    trackUsage: boolean;
    trackTiming: boolean;
  };
}

export interface ShortcutUsageMetrics {
  shortcutId: string;
  timestamp: number;
  timeToClick: number; // Tempo desde carregamento até clique
  userProfile: {
    role: MedicalSpecialty;
    experience: ExperienceLevel;
  };
  context: {
    page: string;
    viewport: 'mobile' | 'tablet' | 'desktop';
    urgencyContext?: 'emergency' | 'routine' | 'educational';
  };
}

// Dados clínicos para configuração de atalhos
export interface ClinicalContext {
  severity: 'emergency' | 'urgent' | 'routine';
  timeConstraint: 'immediate' | 'within_minutes' | 'within_hour' | 'no_constraint';
  accuracyRequirement: 'critical' | 'high' | 'moderate';
  frequencyOfUse: 'daily' | 'weekly' | 'monthly' | 'rare';
}

// Interface para personalização por perfil médico
export interface MedicalProfile {
  role: MedicalSpecialty;
  specialty?: string; // Sub-especialidade
  experienceLevel: ExperienceLevel;
  institution?: string;
  primaryWorkArea: 'hospital' | 'clinic' | 'pharmacy' | 'academic';
  preferences: {
    preferredShortcuts: string[];
    hiddenCategories: string[];
    customShortcuts: CustomShortcut[];
  };
  analytics: {
    optedIn: boolean;
    shareUsageData: boolean;
  };
}

// Configurações de acessibilidade para contexto médico
export interface MedicalAccessibilityConfig {
  largerTouchTargets: boolean; // Para uso com luvas
  highContrast: boolean; // Para ambientes com pouca luz
  reduceAnimations: boolean; // Para evitar distração em emergências
  voiceAnnouncements: boolean; // Para confirmação de ações críticas
  tactileConfirmation: boolean; // Feedback háptico para ações importantes
}

// Analytics específicos para UX médico
export interface MedicalUXAnalytics {
  averageTimeToAction: number; // Tempo médio para completar tarefa crítica
  errorRate: number; // Taxa de navegação incorreta
  emergencyContextSuccessRate: number; // Taxa de sucesso em contextos de emergência
  userSatisfactionScore: number; // Score baseado em feedback
  clinicalEffectivenessMetrics: {
    dosageErrorPrevention: number;
    protocolComplianceImprovement: number;
    timeToDecisionReduction: number;
  };
}

// Estados visuais para feedback em contexto médico
export interface MedicalVisualStates {
  default: {
    background: string;
    text: string;
    border: string;
  };
  hover: {
    background: string;
    text: string;
    border: string;
    shadow?: string;
  };
  active: {
    background: string;
    text: string;
    border: string;
  };
  focus: {
    background: string;
    text: string;
    border: string;
    outline: string;
  };
  urgent: {
    background: string;
    text: string;
    border: string;
    animation?: string;
  };
  disabled: {
    background: string;
    text: string;
    border: string;
    opacity: number;
  };
}

// Interface para sistema de notificações médicas
export interface MedicalNotification {
  id: string;
  type: 'drug_interaction' | 'contraindication' | 'dosage_alert' | 'protocol_update';
  severity: UrgencyLevel;
  title: string;
  message: string;
  actionRequired: boolean;
  autoExpire?: number; // em segundos
  relatedShortcuts?: string[]; // IDs de atalhos relacionados
  clinicalRelevance: {
    patientSafety: boolean;
    dosageImplication: boolean;
    timesSensitive: boolean;
  };
}

// Configuração para testes A/B específicos de UX médico
export interface MedicalABTestConfig {
  testId: string;
  name: string;
  description: string;
  variants: {
    A: {
      name: string;
      config: Partial<FastAccessBarConfig>;
    };
    B: {
      name: string;
      config: Partial<FastAccessBarConfig>;
    };
  };
  successMetrics: {
    primary: keyof MedicalUXAnalytics;
    secondary: (keyof MedicalUXAnalytics)[];
  };
  targetImprovement: number; // % de melhoria esperada
  minimumSampleSize: number;
  durationDays: number;
  clinicalContext: ClinicalContext;
}

// Tipos utilitários
export type ShortcutAction = 
  | { type: 'navigate'; href: string; target?: '_blank' | '_self' }
  | { type: 'modal'; component: string; props?: Record<string, any> }
  | { type: 'function'; handler: () => void | Promise<void> }
  | { type: 'external'; url: string; confirm?: boolean };

export type NavigationContext = {
  currentPage: string;
  userAgent: string;
  timestamp: number;
  sessionId: string;
  medicalContext?: {
    urgency: UrgencyLevel;
    workflow: 'dispensing' | 'consultation' | 'emergency' | 'education';
  };
};

// Hooks para desenvolvimento
export interface UseEmergencyShortcutsOptions {
  maxShortcuts?: number;
  enableCustomization?: boolean;
  trackAnalytics?: boolean;
  medicalProfile?: MedicalProfile;
  abTestVariant?: 'A' | 'B';
}

export interface UseEmergencyShortcutsReturn {
  shortcuts: EmergencyShortcut[];
  customShortcuts: CustomShortcut[];
  addCustomShortcut: (shortcut: Omit<CustomShortcut, 'id' | 'isCustom' | 'createdAt' | 'usageCount' | 'lastUsed'>) => void;
  removeCustomShortcut: (id: string) => void;
  reorderShortcuts: (newOrder: string[]) => void;
  trackUsage: (shortcutId: string, context?: Partial<NavigationContext>) => void;
  getShortcutsByCategory: (category: string) => EmergencyShortcut[];
  getShortcutsByUrgency: (urgency: UrgencyLevel) => EmergencyShortcut[];
  analytics: MedicalUXAnalytics;
  config: FastAccessBarConfig;
  updateConfig: (newConfig: Partial<FastAccessBarConfig>) => void;
}