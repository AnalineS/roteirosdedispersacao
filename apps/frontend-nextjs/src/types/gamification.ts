/**
 * Gamification System Types - ETAPA 3
 * Sistema híbrido de pontos XP + conquistas para educação em hanseníase
 * Integrado com sistema de personas e progressive disclosure
 */

import { UserLevel } from './disclosure';

// ============================================================================
// CORE GAMIFICATION TYPES
// ============================================================================

export interface ExperiencePoints {
  total: number;
  byCategory: {
    chat_interactions: number;
    quiz_completion: number;
    module_completion: number;
    case_completion: number; // XP from clinical case completion
    streak_bonus: number;
    achievement_bonus: number;
  };
  level: number; // Calculado automaticamente baseado no total XP
  nextLevelXP: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  xpReward: number;
  icon: string; // CSS class ou emoji
  unlockedAt?: string; // ISO date
  isUnlocked: boolean;
  requirements: AchievementRequirement[];
  celebrationType: 'discrete' | 'visual'; // Tipo de notificação
  badgeColor: BadgeColor;
  relatedPersona?: 'ga' | 'dr-gasnelio' | 'both';
}

export type AchievementCategory =
  | 'first_steps'        // Primeiros passos na plataforma
  | 'knowledge_master'   // Domínio de conhecimento
  | 'interaction_expert' // Especialista em interações
  | 'streak_champion'    // Campeão de sequências
  | 'quiz_master'        // Mestre dos quiz
  | 'module_graduate'    // Graduado em módulos
  | 'persona_specialist' // Especialista em personas
  | 'clinical_simulator' // Especialista em casos clínicos
  | 'helping_hand';      // Ajuda à comunidade

export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

export type BadgeColor = 
  | 'paciente_green'     // Verde - nível paciente
  | 'estudante_blue'     // Azul - nível estudante  
  | 'profissional_purple' // Roxo - nível profissional
  | 'especialista_gold'  // Dourado - nível especialista
  | 'persona_ga_warm'    // Cores específicas da Gá
  | 'persona_gasnelio_clinical'; // Cores Dr. Gasnelio

export interface AchievementRequirement {
  type: 'xp_total' | 'quiz_score' | 'streak_days' | 'modules_completed' |
        'chat_messages' | 'user_level' | 'persona_used' | 'time_spent' |
        'cases_completed' | 'case_difficulty' | 'case_accuracy' | 'case_time';
  value: number | string;
  operator: '>=' | '==' | '>' | '<' | 'includes';
}

// ============================================================================
// PROGRESS TRACKING
// ============================================================================

export interface LearningProgress {
  userId: string;
  currentLevel: UserLevel;
  experiencePoints: ExperiencePoints;
  achievements: Achievement[];
  streakData: StreakData;
  moduleProgress: ModuleProgress[];
  quizStats: QuizStatistics;
  caseStats: ClinicalCaseStatistics; // Statistics for clinical cases
  lastActivity: string; // ISO date
  totalTimeSpent: number; // em minutos
  preferredPersona: 'ga' | 'dr-gasnelio';
  // Additional properties for compatibility with simulador page
  totalXP: number; // Alias for experiencePoints.total
  completedCases: CompletedCase[]; // From caseStats
  unlockedAchievements: Achievement[]; // Filtered from achievements where isUnlocked = true
  streakDays: number; // Alias for streakData.currentStreak
  progressPercentage: number; // Calculated progress percentage
  nextLevelXP: number; // Alias for experiencePoints.nextLevelXP
}

export interface StreakData {
  currentStreak: number; // dias consecutivos
  longestStreak: number;
  lastActivityDate: string; // ISO date
  isActiveToday: boolean;
  streakBreakGrace: number; // dias de tolerância
}

export interface ModuleProgress {
  moduleId: string;
  title: string;
  userLevel: UserLevel[];
  status: 'locked' | 'available' | 'in_progress' | 'completed';
  progress: number; // 0-100
  completedAt?: string; // ISO date
  timeSpent: number; // em minutos
  xpEarned: number;
  quizScores: number[]; // Array de pontuações nos quiz
  estimatedTimeMinutes: number;
  prerequisites: string[]; // IDs de módulos obrigatórios
}

// ============================================================================
// QUIZ SYSTEM
// ============================================================================

export interface EducationalQuiz {
  id: string;
  title: string;
  description: string;
  moduleId: string;
  difficulty: UserLevel; // Baseado no sistema de 4 níveis
  questions: QuizQuestion[];
  timeLimit?: number; // em minutos
  passingScore?: number; // percentual mínimo para passar
  xpReward?: number;
  maxAttempts?: number;
  hasImages?: boolean;
  feedbackPersona?: 'ga' | 'dr-gasnelio' | 'adaptive'; // Adaptive = baseado no nível
  topics?: string[]; // Tags dos tópicos abordados no quiz
}

export interface QuizQuestion {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'drag_drop' | 'text_input';
  question: string;
  options?: string[]; // Para multiple choice
  correctAnswer: string | string[]; // Pode ser múltiplas respostas
  explanation: {
    correct: string;
    incorrect: string;
    technical?: string; // Explicação técnica adicional
  };
  difficulty: 1 | 2 | 3 | 4; // 1=fácil, 4=expert
  topics: string[]; // Tags dos tópicos abordados
  image?: {
    url: string;
    alt: string;
    caption?: string;
  };
  xpValue: number;
  userLevel: UserLevel[]; // Níveis que podem ver esta questão
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  startedAt: string; // ISO date
  completedAt?: string; // ISO date
  answers: QuizAnswer[];
  score: number; // 0-100
  xpEarned: number;
  timeSpent: number; // em segundos
  isPassed: boolean;
  feedbackPersona: 'ga' | 'dr-gasnelio';
}

export interface QuizAnswer {
  questionId: string;
  userAnswer: string | string[];
  isCorrect: boolean;
  timeSpent: number; // em segundos
  hintsUsed: number;
}

export interface QuizStatistics {
  totalQuizzes: number;
  completedQuizzes: number;
  averageScore: number;
  totalXPFromQuizzes: number;
  bestStreak: number; // Quiz corretos consecutivos
  currentStreak: number;
  favoriteTopics: string[];
  weakestTopics: string[];
  timeSpentQuizzes: number; // em minutos
  lastQuizDate?: string; // ISO date
}

// ============================================================================
// CLINICAL CASE STATISTICS
// ============================================================================

export interface ClinicalCaseStatistics {
  totalCases: number;
  completedCases: number;
  averageScore: number; // Diagnostic accuracy percentage
  totalXPFromCases: number;
  casesPassedFirstAttempt: number;
  bestDiagnosticStreak: number; // Casos corretos consecutivos
  currentDiagnosticStreak: number;
  categoriesCompleted: {
    pediatrico: number;
    adulto: number;
    gravidez: number;
    complicacoes: number;
    interacoes: number;
  };
  difficultyCompleted: {
    basico: number;
    intermediario: number;
    avancado: number;
    complexo: number;
  };
  averageTimePerCase: number; // em minutos
  fastestCompletion: number; // em minutos
  timeSpentCases: number; // em minutos total
  lastCaseDate?: string; // ISO date
  favoriteCategories: string[];
  strongestSkills: string[]; // Based on learning objectives
  areasForImprovement: string[];
}

export interface CompletedCase {
  caseId: string;
  title: string;
  difficulty: 'básico' | 'intermediário' | 'avançado' | 'complexo';
  category: string;
  completedAt: string; // ISO date
  timeSpent: number; // em minutos
  diagnosticAccuracy: number; // 0-100
  score: number; // Alias for diagnosticAccuracy for compatibility
  xpEarned: number;
  attempts: number;
  perfectScore: boolean;
  stepResults: CaseStepResult[];
  competencyScores: { [key: string]: number }; // Learning objectives scores
}

export interface CaseStepResult {
  stepId: string;
  stepNumber: number;
  title: string;
  score: number; // 0-100
  timeSpent: number; // em segundos
  attempts: number;
  completed: boolean;
}

// ============================================================================
// LEADERBOARD & SOCIAL
// ============================================================================

export interface LeaderboardEntry {
  userId: string;
  displayName: string; // Anônimo mas com nickname
  avatar?: string; // Avatar baseado na persona preferida
  totalXP: number;
  level: number;
  achievementCount: number;
  currentStreak: number;
  rank: number;
  badgeHighlight: Achievement; // Achievement mais raro para mostrar
}

export interface Leaderboard {
  id: string;
  title: string;
  type: 'weekly' | 'monthly' | 'all_time' | 'by_level';
  entries: LeaderboardEntry[];
  userPosition?: number; // Posição do usuário atual
  lastUpdated: string; // ISO date
  filterLevel?: UserLevel; // Para leaderboards por nível
}

// ============================================================================
// LEARNING MODULES
// ============================================================================

export interface LearningModule {
  id: string;
  title: string;
  description: string;
  category: 'fundamentals' | 'protocols' | 'adverse_effects' | 'clinical_cases' | 'advanced';
  userLevel: UserLevel[]; // Níveis que podem acessar
  order: number; // Ordem sequencial
  estimatedTimeMinutes: number;
  xpReward: number;
  prerequisites: string[]; // IDs de módulos obrigatórios
  content: ModuleContent[];
  finalQuiz: EducationalQuiz;
  certificateTemplate?: string; // Para certificação geral
  status: 'locked' | 'available' | 'in_progress' | 'completed';
  isRequired: boolean; // Obrigatório para certificação geral
}

export interface ModuleContent {
  id: string;
  type: 'text' | 'video' | 'interactive' | 'case_study' | 'persona_chat';
  title: string;
  content: string;
  estimatedTimeMinutes: number;
  xpValue: number;
  interactiveElements?: {
    type: 'persona_suggestion' | 'quiz_question' | 'drag_drop' | 'timeline';
    data: Record<string, unknown>; // Específico para cada tipo
  }[];
  medicalTerms?: string[]; // IDs de termos médicos para popup
  completed: boolean;
}

// ============================================================================
// NOTIFICATIONS & CELEBRATIONS
// ============================================================================

export interface GamificationNotification {
  id: string;
  type: 'achievement_unlocked' | 'level_up' | 'streak_milestone' | 
        'quiz_completed' | 'module_completed' | 'leaderboard_update';
  title: string;
  message: string;
  celebrationType: 'discrete' | 'visual';
  data: {
    xpGained?: number;
    achievementId?: string;
    newLevel?: number;
    streakDays?: number;
  };
  isRead: boolean;
  createdAt: string; // ISO date
  expiresAt?: string; // ISO date
  personaStyle?: 'ga' | 'dr-gasnelio'; // Estilo da notificação baseado na persona
}

// ============================================================================
// SYSTEM CONFIGURATION
// ============================================================================

export interface GamificationConfig {
  xpRates: {
    chatMessage: number;
    quizQuestion: number;
    moduleCompletion: number;
    dailyLogin: number;
    streakBonus: number;
  };
  levelRequirements: number[]; // XP necessário para cada nível
  achievementGroups: Achievement[];
  moduleSequence: string[]; // IDs dos módulos na ordem sequencial
  leaderboardTypes: Leaderboard[];
  celebrationSettings: {
    enableVisualCelebrations: boolean;
    soundEffects: boolean;
    animationDuration: number;
  };
  streakSettings: {
    gracePeriodHours: number;
    maxStreakBonus: number;
    streakMilestones: number[]; // Marcos para achievements especiais
  };
}

// ============================================================================
// INTEGRATION WITH EXISTING SYSTEM
// ============================================================================

export interface ExtendedUserProfile {
  // Mantém todos os campos existentes do UserProfile
  type: 'professional' | 'student' | 'patient' | 'caregiver';
  focus: 'technical' | 'practical' | 'effects' | 'general';
  confidence: number;
  explanation: string;
  selectedPersona?: string;
  preferences?: {
    language: 'simple' | 'technical';
    notifications: boolean;
    theme: 'light' | 'dark' | 'auto';
  };
  history?: {
    lastPersona: string;
    conversationCount: number;
    lastAccess: string;
    preferredTopics: string[];
  };
  
  // Novos campos de gamificação
  gamification: LearningProgress;
  notifications: GamificationNotification[];
  tutorialCompleted: boolean;
  privacySettings: {
    showInLeaderboard: boolean;
    shareProgress: boolean;
    anonymousMode: boolean;
  };
}

// ============================================================================
// CONSTANTS & DEFAULTS
// ============================================================================

export const XP_RATES = {
  CHAT_MESSAGE: 5,
  QUIZ_QUESTION_CORRECT: 15,
  QUIZ_QUESTION_INCORRECT: 3,
  MODULE_COMPLETION: 100,
  CASE_COMPLETION_BASIC: 150,      // Casos básicos
  CASE_COMPLETION_INTERMEDIATE: 250, // Casos intermediários
  CASE_COMPLETION_ADVANCED: 400,   // Casos avançados
  CASE_COMPLETION_COMPLEX: 600,    // Casos complexos
  CASE_ACCURACY_BONUS: 50,         // Bônus por alta precisão diagnóstica
  CASE_SPEED_BONUS: 25,            // Bônus por completar rapidamente
  DAILY_LOGIN: 10,
  STREAK_MULTIPLIER: 1.2, // Multiplicador por dia de streak
  ACHIEVEMENT_BONUS: 50 // Bônus base por achievement
} as const;

export const LEVEL_REQUIREMENTS = [
  0,    // Nível 0 (início)
  100,  // Nível 1
  250,  // Nível 2
  500,  // Nível 3
  1000, // Nível 4
  2000, // Nível 5
  3500, // Nível 6
  5500, // Nível 7
  8000, // Nível 8
  12000, // Nível 9
  17000  // Nível 10 (máximo)
] as const;

export const BADGE_COLORS = {
  paciente_green: '#22c55e',
  estudante_blue: '#3b82f6', 
  profissional_purple: '#8b5cf6',
  especialista_gold: '#f59e0b',
  persona_ga_warm: '#f97316',
  persona_gasnelio_clinical: '#0284c7'
} as const;

// Default achievements baseados nas especificações
export const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_login',
    title: 'Bem-vindo à Plataforma!',
    description: 'Fez seu primeiro login e configurou seu perfil',
    category: 'first_steps',
    rarity: 'common',
    xpReward: 50,
    icon: '👋',
    isUnlocked: false,
    requirements: [
      { type: 'chat_messages', value: 1, operator: '>=' }
    ],
    celebrationType: 'discrete',
    badgeColor: 'paciente_green',
    relatedPersona: 'both'
  },
  {
    id: 'qa_enthusiast',
    title: 'Entusiasta do Conhecimento',
    description: 'Completou seu primeiro quiz sobre hanseníase',
    category: 'quiz_master',
    rarity: 'common',
    xpReward: 75,
    icon: '🧠',
    isUnlocked: false,
    requirements: [
      { type: 'quiz_score', value: 70, operator: '>=' }
    ],
    celebrationType: 'visual',
    badgeColor: 'estudante_blue',
    relatedPersona: 'both'
  },
  {
    id: 'streak_warrior',
    title: 'Guerreiro da Constância',
    description: 'Manteve 7 dias consecutivos de estudo',
    category: 'streak_champion',
    rarity: 'rare',
    xpReward: 200,
    icon: '🔥',
    isUnlocked: false,
    requirements: [
      { type: 'streak_days', value: 7, operator: '>=' }
    ],
    celebrationType: 'visual',
    badgeColor: 'profissional_purple',
    relatedPersona: 'both'
  },
  {
    id: 'hanseniase_master',
    title: 'Mestre em Hanseníase',
    description: 'Dominou todos os módulos fundamentais sobre hanseníase',
    category: 'knowledge_master',
    rarity: 'epic',
    xpReward: 500,
    icon: '🏆',
    isUnlocked: false,
    requirements: [
      { type: 'modules_completed', value: 5, operator: '>=' },
      { type: 'user_level', value: 'profissional', operator: '==' }
    ],
    celebrationType: 'visual',
    badgeColor: 'especialista_gold',
    relatedPersona: 'dr-gasnelio'
  },

  // Clinical Case Achievements
  {
    id: 'first_case_completed',
    title: 'Primeiro Caso Clínico',
    description: 'Completou seu primeiro caso clínico no simulador',
    category: 'clinical_simulator',
    rarity: 'common',
    xpReward: 100,
    icon: '🩺',
    isUnlocked: false,
    requirements: [
      { type: 'cases_completed', value: 1, operator: '>=' }
    ],
    celebrationType: 'visual',
    badgeColor: 'estudante_blue',
    relatedPersona: 'both'
  },
  {
    id: 'pediatric_specialist',
    title: 'Especialista Pediátrico',
    description: 'Dominou casos pediátricos de hanseníase',
    category: 'clinical_simulator',
    rarity: 'rare',
    xpReward: 250,
    icon: '👶',
    isUnlocked: false,
    requirements: [
      { type: 'case_difficulty', value: 'pediatrico', operator: 'includes' },
      { type: 'cases_completed', value: 3, operator: '>=' }
    ],
    celebrationType: 'visual',
    badgeColor: 'profissional_purple',
    relatedPersona: 'dr-gasnelio'
  },
  {
    id: 'diagnostic_accuracy_master',
    title: 'Mestre do Diagnóstico',
    description: 'Mantém alta precisão diagnóstica (>90%) em casos clínicos',
    category: 'clinical_simulator',
    rarity: 'epic',
    xpReward: 400,
    icon: '🎯',
    isUnlocked: false,
    requirements: [
      { type: 'case_accuracy', value: 90, operator: '>=' },
      { type: 'cases_completed', value: 5, operator: '>=' }
    ],
    celebrationType: 'visual',
    badgeColor: 'especialista_gold',
    relatedPersona: 'dr-gasnelio'
  },
  {
    id: 'speed_clinician',
    title: 'Clínico Eficiente',
    description: 'Completa casos clínicos em tempo otimizado',
    category: 'clinical_simulator',
    rarity: 'rare',
    xpReward: 200,
    icon: '⚡',
    isUnlocked: false,
    requirements: [
      { type: 'case_time', value: 10, operator: '<' }, // Menos de 10 min por caso
      { type: 'cases_completed', value: 3, operator: '>=' }
    ],
    celebrationType: 'discrete',
    badgeColor: 'profissional_purple',
    relatedPersona: 'both'
  },
  {
    id: 'clinical_simulator_champion',
    title: 'Campeão do Simulador',
    description: 'Completou todos os tipos de casos clínicos disponíveis',
    category: 'clinical_simulator',
    rarity: 'legendary',
    xpReward: 750,
    icon: '🏅',
    isUnlocked: false,
    requirements: [
      { type: 'cases_completed', value: 10, operator: '>=' },
      { type: 'case_accuracy', value: 85, operator: '>=' }
    ],
    celebrationType: 'visual',
    badgeColor: 'especialista_gold',
    relatedPersona: 'dr-gasnelio'
  }
];

const GamificationConfig = {
  XP_RATES,
  LEVEL_REQUIREMENTS,
  BADGE_COLORS,
  DEFAULT_ACHIEVEMENTS
};

export default GamificationConfig;