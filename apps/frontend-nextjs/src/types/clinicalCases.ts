/**
 * Tipos TypeScript para Simulador de Casos Clínicos
 * Baseado nos dados da tese e hanseniase_catalog.json
 * Doutorando: Nélio Gomes de Moura Júnior
 */

type CalculationResult = {
  dose?: number;
  frequency?: string;
  duration?: number;
  tablets?: number;
  weight_based?: boolean;
} | string | number | boolean;

type ClinicalAnswer = {
  text?: string;
  value?: number | string;
  selected_options?: string[];
  calculation_result?: CalculationResult;
  reasoning?: string;
} | string | number | boolean | string[];

export interface ClinicalCase {
  id: string;
  title: string;
  difficulty: 'básico' | 'intermediário' | 'avançado' | 'complexo';
  estimatedTime: number; // minutos
  category: 'pediatrico' | 'adulto' | 'gravidez' | 'complicacoes' | 'interacoes';
  tags: string[];
  
  // Patient Information
  patient: PatientProfile;
  
  // Clinical Scenario
  scenario: ClinicalScenario;
  
  // Learning Objectives
  learningObjectives: string[];
  
  // Interactive Steps
  steps: CaseStep[];
  
  // Assessment and Feedback
  assessment: CaseAssessment;
  
  // References from thesis
  references: CaseReference[];
  
  // Quality metrics
  qualityMetrics: CaseQualityMetrics;
}

export interface PatientProfile {
  name: string;
  age: number;
  weight: number;
  gender: 'masculino' | 'feminino';
  
  // Clinical presentation
  clinicalPresentation: {
    type: 'paucibacilar' | 'multibacilar';
    lesions: string[];
    neurologicalSigns: string[];
    bacilloscopy?: string;
    biopsy?: string;
  };
  
  // Medical history
  medicalHistory: {
    allergies: string[];
    currentMedications: string[];
    comorbidities: string[];
    specialConditions: ('gravidez' | 'amamentacao' | 'hepatopatia' | 'nefropatia' | 'g6pd_deficiency')[];
    previousTreatments: string[];
  };
  
  // Social context
  socialContext: {
    livingConditions: string;
    adherenceFactors: string[];
    supportSystem: string[];
    economicStatus: 'baixa' | 'media' | 'alta';
    educationLevel: 'fundamental' | 'medio' | 'superior';
  };
}

export interface ClinicalScenario {
  presentation: string;
  prescriptionDetails: {
    prescribed: boolean;
    prescriber: 'medico' | 'enfermeiro';
    prescriptionType: 'pqt_u_adulto' | 'pqt_u_infantil' | 'pediatrico_under_30kg';
    prescriptionDate: Date;
    validityPeriod: number; // days
    prescriptionImage?: string; // base64 or URL
  };
  
  clinicalNotes: string[];
  warningFlags: {
    type: 'contraindication' | 'interaction' | 'special_monitoring' | 'dose_adjustment';
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }[];
}

export interface CaseStep {
  id: string;
  stepNumber: number;
  title: string;
  type: 'assessment' | 'decision' | 'calculation' | 'counseling' | 'documentation';
  phase: 'avaliacao_inicial' | 'orientacoes_cuidado' | 'pos_dispensacao';
  
  // Step content
  description: string;
  instruction: string;
  
  // Interactive elements
  interaction: StepInteraction;
  
  // Validation and feedback
  validation: StepValidation;
  
  // Educational content
  educationalNotes: string[];
  references: string[];
}

export interface StepInteraction {
  type: 'multiple_choice' | 'checklist' | 'text_input' | 'calculation' | 'drag_drop' | 'scenario_simulation';
  
  // For scenario simulation
  scenarioText?: string;
  responseOptions?: {
    id: string;
    text: string;
    isOptimal?: boolean;
    isCorrect?: boolean;
    feedback?: string;
    score?: number;
    empathyScore?: number;
    clarityScore?: number;
    safetyScore?: number;
  }[];
  
  // For multiple choice
  options?: {
    id: string;
    text: string;
    isCorrect: boolean;
    explanation: string;
    consequences?: string;
  }[];
  
  // For checklist
  checklistItems?: {
    id: string;
    text: string;
    required: boolean;
    category: string;
    points?: number;
  }[];
  
  // For calculations
  calculationParameters?: {
    inputFields: {
      name: string;
      label: string;
      type: 'number' | 'select' | 'radio';
      unit?: string;
      options?: string[];
      validation: {
        required: boolean;
        min?: number;
        max?: number;
      };
    }[];
    expectedResult: CalculationResult;
    tolerance?: number;
  };
  
  // For text input
  textValidation?: {
    expectedKeywords: string[];
    minimumWords?: number;
    scoringCriteria: string[];
  };
}

export interface StepValidation {
  correctAnswer: ClinicalAnswer;
  points: number;
  passingScore: number;
  
  feedback: {
    correct: FeedbackContent;
    incorrect: FeedbackContent;
    partial: FeedbackContent;
  };
  
  // Clinical rationale
  clinicalRationale: string;
  safetyConsiderations?: string[];
  bestPractices?: string[];
}

export interface FeedbackContent {
  message: string;
  explanation: string;
  additionalResources?: string[];
  nextStepGuidance?: string;
  improvementSuggestions?: string[];
}

export interface CaseAssessment {
  totalPoints: number;
  passingScore: number;
  
  // Rubric categories
  categories: {
    name: string;
    weight: number;
    maxPoints: number;
    criteria: string[];
  }[];
  
  // Performance metrics
  timeLimit?: number; // minutes
  attemptsAllowed: number;
  
  // Certification requirements
  certificationCriteria: {
    minimumScore: number;
    requiredSteps: string[];
    timeRequirement?: number;
  };
}

export interface CaseReference {
  type: 'protocolo_nacional' | 'tese_doutorado' | 'literatura_cientifica' | 'guideline_international';
  title: string;
  source: string;
  section?: string;
  page?: number;
  url?: string;
  relevance: 'primary' | 'secondary' | 'supplementary';
  [key: string]: unknown;
}

export interface CaseQualityMetrics {
  educationalValue: number; // 1-5
  clinicalRealism: number; // 1-5
  difficultyAlignment: number; // 1-5
  feedbackQuality: number; // 1-5
  
  completionStats?: {
    totalAttempts: number;
    successRate: number;
    averageScore: number;
    averageTime: number;
    commonMistakes: string[];
  };
}

// Session and Progress Tracking
export interface CaseSession {
  id: string;
  caseId: string;
  userId?: string;
  startTime: Date;
  endTime?: Date;
  currentStep: number;
  status: 'in_progress' | 'completed' | 'abandoned' | 'failed';
  
  // Progress tracking
  stepResults: StepResult[];
  totalScore: number;
  timeSpent: number; // minutes
  
  // Performance analysis
  strengths: string[];
  improvementAreas: string[];
  recommendations: string[];
}

export interface StepResult {
  stepId: string;
  response: string | number | string[] | boolean; // Text, numeric, multiple choice, or boolean responses
  isCorrect: boolean;
  pointsEarned: number;
  timeSpent: number; // seconds
  attemptNumber: number;
  feedback: string;
}

// Configuration and Settings
export interface CaseSimulatorConfig {
  userType: 'anonymous' | 'authenticated';
  allowSaveProgress: boolean;
  allowRetry: boolean;
  showDetailedFeedback: boolean;
  enableHints: boolean;
  showReferences: boolean;
  trackAnalytics: boolean;
}

// Export formats
export interface CaseExport {
  session: CaseSession;
  case: ClinicalCase;
  exportDate: Date;
  format: 'pdf' | 'json' | 'email';
  includeAnswers: boolean;
  includeRationale: boolean;
  recipientEmail?: string;
}

// Base template for clinical cases based on thesis data
export const CLINICAL_CASE_TEMPLATES = {
  pediatrico_basico: {
    difficulty: 'básico' as const,
    category: 'pediatrico' as const,
    estimatedTime: 15,
    focusAreas: ['cálculo de dose por peso', 'prescrição médica obrigatória', 'orientações aos responsáveis'],
    commonChallenges: ['dose fracionada', 'adesão infantil', 'comunicação com família']
  },
  adulto_standard: {
    difficulty: 'intermediário' as const,
    category: 'adulto' as const,
    estimatedTime: 20,
    focusAreas: ['esquema padrão PQT-U', 'orientações de adesão', 'identificação efeitos adversos'],
    commonChallenges: ['adesão domiciliar', 'reconhecimento efeitos esperados', 'cronograma mensal']
  },
  gravidez_lactacao: {
    difficulty: 'avançado' as const,
    category: 'gravidez' as const,
    estimatedTime: 25,
    focusAreas: ['segurança fetal', 'orientações específicas', 'vitamina K', 'pigmentação RN'],
    commonChallenges: ['medos maternos', 'orientação sobre efeitos no bebê', 'seguimento especializado']
  },
  interacoes_medicamentosas: {
    difficulty: 'avançado' as const,
    category: 'interacoes' as const,
    estimatedTime: 30,
    focusAreas: ['identificação interações', 'ajustes necessários', 'monitoramento intensificado'],
    commonChallenges: ['múltiplas medicações', 'priorização terapêutica', 'comunicação médico-farmacêutico']
  },
  complicacoes_clinicas: {
    difficulty: 'complexo' as const,
    category: 'complicacoes' as const,
    estimatedTime: 35,
    focusAreas: ['eventos adversos graves', 'manejo de emergências', 'decisões clínicas complexas'],
    commonChallenges: ['diagnóstico diferencial', 'conduta imediata', 'referenciamento adequado']
  }
};

// Utility functions
export const calculateCaseScore = (session: CaseSession): number => {
  const totalPossible = session.stepResults.length * 100; // assuming max 100 points per step
  const earnedPoints = session.stepResults.reduce((sum, result) => sum + result.pointsEarned, 0);
  return totalPossible > 0 ? Math.round((earnedPoints / totalPossible) * 100) : 0;
};

export const getCaseDifficultyColor = (difficulty: string): string => {
  switch (difficulty) {
    case 'básico': return '#10B981'; // green
    case 'intermediário': return '#F59E0B'; // yellow  
    case 'avançado': return '#EF4444'; // red
    case 'complexo': return '#8B5CF6'; // purple
    default: return '#6B7280'; // gray
  }
};

export const formatCaseTime = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes > 0 ? `${remainingMinutes}min` : ''}`.trim();
};