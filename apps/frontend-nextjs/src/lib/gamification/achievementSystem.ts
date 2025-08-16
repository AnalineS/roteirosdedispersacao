/**
 * Achievement System - Sistema de Conquistas para Educação em Hanseníase
 * Sistema híbrido de XP + conquistas com leaderboard entre usuários logados
 * Conquistas paralelas com celebrações visuais para marcos importantes
 */

import type { 
  Achievement, 
  AchievementRequirement, 
  LearningProgress, 
  ExperiencePoints,
  StreakData,
  QuizStatistics,
  GamificationNotification,
  ExtendedUserProfile
} from '../../types/gamification';
import {
  XP_RATES,
  LEVEL_REQUIREMENTS,
  DEFAULT_ACHIEVEMENTS
} from '../../types/gamification';
import type { UserLevel } from '../../types/disclosure';

export class AchievementSystem {
  private static instance: AchievementSystem;
  
  private constructor() {}
  
  static getInstance(): AchievementSystem {
    if (!AchievementSystem.instance) {
      AchievementSystem.instance = new AchievementSystem();
    }
    return AchievementSystem.instance;
  }

  // ============================================================================
  // EXPERIENCE POINTS MANAGEMENT
  // ============================================================================

  /**
   * Calcula XP total e nível baseado nas atividades do usuário
   */
  calculateExperiencePoints(
    chatMessages: number,
    quizCorrect: number,
    quizIncorrect: number,
    modulesCompleted: number,
    streakDays: number,
    achievementsCount: number
  ): ExperiencePoints {
    const byCategory = {
      chat_interactions: chatMessages * XP_RATES.CHAT_MESSAGE,
      quiz_completion: (quizCorrect * XP_RATES.QUIZ_QUESTION_CORRECT) + 
                      (quizIncorrect * XP_RATES.QUIZ_QUESTION_INCORRECT),
      module_completion: modulesCompleted * XP_RATES.MODULE_COMPLETION,
      streak_bonus: this.calculateStreakBonus(streakDays),
      achievement_bonus: achievementsCount * XP_RATES.ACHIEVEMENT_BONUS
    };

    const total = Object.values(byCategory).reduce((sum, xp) => sum + xp, 0);
    const level = this.calculateLevel(total);
    const nextLevelXP = this.getNextLevelRequirement(level);

    return {
      total,
      byCategory,
      level,
      nextLevelXP
    };
  }

  /**
   * Calcula bônus de streak com multiplicador exponencial
   */
  private calculateStreakBonus(streakDays: number): number {
    if (streakDays === 0) return 0;
    
    const baseBonus = XP_RATES.DAILY_LOGIN * streakDays;
    const multiplier = Math.pow(XP_RATES.STREAK_MULTIPLIER, Math.min(streakDays, 30));
    
    return Math.floor(baseBonus * multiplier);
  }

  /**
   * Calcula nível baseado no XP total
   */
  private calculateLevel(totalXP: number): number {
    for (let i = LEVEL_REQUIREMENTS.length - 1; i >= 0; i--) {
      if (totalXP >= LEVEL_REQUIREMENTS[i]) {
        return i;
      }
    }
    return 0;
  }

  /**
   * Retorna XP necessário para o próximo nível
   */
  private getNextLevelRequirement(currentLevel: number): number {
    const nextLevel = currentLevel + 1;
    if (nextLevel >= LEVEL_REQUIREMENTS.length) {
      return LEVEL_REQUIREMENTS[LEVEL_REQUIREMENTS.length - 1];
    }
    return LEVEL_REQUIREMENTS[nextLevel];
  }

  // ============================================================================
  // ACHIEVEMENT VALIDATION
  // ============================================================================

  /**
   * Verifica quais conquistas foram desbloqueadas baseado no progresso atual
   */
  checkUnlockedAchievements(
    currentProgress: LearningProgress,
    availableAchievements: Achievement[] = DEFAULT_ACHIEVEMENTS
  ): { 
    newAchievements: Achievement[],
    notifications: GamificationNotification[]
  } {
    const newAchievements: Achievement[] = [];
    const notifications: GamificationNotification[] = [];

    for (const achievement of availableAchievements) {
      if (achievement.isUnlocked) continue;

      const isUnlocked = this.validateAchievementRequirements(
        achievement.requirements,
        currentProgress
      );

      if (isUnlocked) {
        const unlockedAchievement = {
          ...achievement,
          isUnlocked: true,
          unlockedAt: new Date().toISOString()
        };
        
        newAchievements.push(unlockedAchievement);
        
        // Criar notificação
        const notification = this.createAchievementNotification(unlockedAchievement);
        notifications.push(notification);
      }
    }

    return { newAchievements, notifications };
  }

  /**
   * Valida se os requisitos de uma conquista foram atendidos
   */
  private validateAchievementRequirements(
    requirements: AchievementRequirement[],
    progress: LearningProgress
  ): boolean {
    return requirements.every(req => {
      const actualValue = this.getProgressValue(req.type, progress);
      return this.compareValues(actualValue, req.value, req.operator);
    });
  }

  /**
   * Extrai o valor atual do progresso baseado no tipo de requisito
   */
  private getProgressValue(type: string, progress: LearningProgress): number | string {
    switch (type) {
      case 'xp_total':
        return progress.experiencePoints.total;
      case 'quiz_score':
        return progress.quizStats.averageScore;
      case 'streak_days':
        return progress.streakData.currentStreak;
      case 'modules_completed':
        return progress.moduleProgress.filter(m => m.status === 'completed').length;
      case 'chat_messages':
        return progress.experiencePoints.byCategory.chat_interactions / XP_RATES.CHAT_MESSAGE;
      case 'user_level':
        return progress.currentLevel;
      case 'persona_used':
        return progress.preferredPersona;
      case 'time_spent':
        return progress.totalTimeSpent;
      default:
        return 0;
    }
  }

  /**
   * Compara valores baseado no operador
   */
  private compareValues(actual: number | string, required: number | string, operator: string): boolean {
    switch (operator) {
      case '>=':
        return Number(actual) >= Number(required);
      case '==':
        return actual === required;
      case '>':
        return Number(actual) > Number(required);
      case '<':
        return Number(actual) < Number(required);
      case 'includes':
        return String(actual).includes(String(required));
      default:
        return false;
    }
  }

  // ============================================================================
  // STREAK MANAGEMENT
  // ============================================================================

  /**
   * Atualiza dados de streak baseado na atividade do usuário
   */
  updateStreakData(
    currentStreak: StreakData,
    hasActivityToday: boolean
  ): StreakData {
    const today = new Date().toISOString().split('T')[0];
    const lastActivity = new Date(currentStreak.lastActivityDate).toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    let newStreak = currentStreak.currentStreak;
    let isActiveToday = hasActivityToday;

    if (hasActivityToday && today !== lastActivity) {
      if (lastActivity === yesterday) {
        // Continuou o streak
        newStreak = currentStreak.currentStreak + 1;
      } else if (lastActivity < yesterday) {
        // Quebrou o streak, reiniciar
        newStreak = 1;
      }
      // Se é o mesmo dia, manter streak atual
    } else if (!hasActivityToday && today > lastActivity && lastActivity < yesterday) {
      // Sem atividade hoje e perdeu ontem = streak quebrado
      newStreak = 0;
      isActiveToday = false;
    }

    return {
      currentStreak: newStreak,
      longestStreak: Math.max(currentStreak.longestStreak, newStreak),
      lastActivityDate: hasActivityToday ? new Date().toISOString() : currentStreak.lastActivityDate,
      isActiveToday,
      streakBreakGrace: 24 // 24 horas de tolerância
    };
  }

  // ============================================================================
  // NOTIFICATIONS
  // ============================================================================

  /**
   * Cria notificação para conquista desbloqueada
   */
  private createAchievementNotification(achievement: Achievement): GamificationNotification {
    return {
      id: `achievement_${achievement.id}_${Date.now()}`,
      type: 'achievement_unlocked',
      title: `🏆 Conquista Desbloqueada!`,
      message: `Você conquistou: ${achievement.title}`,
      celebrationType: achievement.celebrationType,
      data: {
        achievementId: achievement.id,
        xpGained: achievement.xpReward
      },
      isRead: false,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 dias
      personaStyle: achievement.relatedPersona === 'ga' ? 'ga' : 
                   achievement.relatedPersona === 'dr-gasnelio' ? 'dr-gasnelio' : 
                   undefined
    };
  }

  /**
   * Cria notificação para subida de nível
   */
  createLevelUpNotification(newLevel: number, xpGained: number): GamificationNotification {
    return {
      id: `levelup_${newLevel}_${Date.now()}`,
      type: 'level_up',
      title: `🎉 Parabéns!`,
      message: `Você alcançou o nível ${newLevel}!`,
      celebrationType: 'visual',
      data: {
        newLevel,
        xpGained
      },
      isRead: false,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() // 3 dias
    };
  }

  /**
   * Cria notificação para marco de streak
   */
  createStreakNotification(streakDays: number, xpBonus: number): GamificationNotification {
    const milestoneMessages: Record<number, string> = {
      7: '🔥 Uma semana de dedicação!',
      14: '💪 Duas semanas consecutivas!',
      30: '🌟 Um mês de constância!',
      100: '👑 Cem dias de excelência!'
    };

    const message = milestoneMessages[streakDays] || `🔥 ${streakDays} dias consecutivos!`;

    return {
      id: `streak_${streakDays}_${Date.now()}`,
      type: 'streak_milestone',
      title: message,
      message: `Você manteve ${streakDays} dias de estudo consecutivos!`,
      celebrationType: streakDays >= 30 ? 'visual' : 'discrete',
      data: {
        streakDays,
        xpGained: xpBonus
      },
      isRead: false,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString() // 5 dias
    };
  }

  // ============================================================================
  // ACHIEVEMENT DEFINITIONS - Específicas para Hanseníase
  // ============================================================================

  /**
   * Retorna todas as conquistas disponíveis organizadas por categoria
   */
  getAllAchievements(): Achievement[] {
    return [
      // FIRST STEPS
      {
        id: 'welcome_aboard',
        title: 'Bem-vindo a Bordo!',
        description: 'Completou o perfil e teve a primeira conversa com Gá ou Dr. Gasnelio',
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
        id: 'profile_complete',
        title: 'Perfil Completo',
        description: 'Configurou completamente suas preferências e nível de conhecimento',
        category: 'first_steps',
        rarity: 'common',
        xpReward: 25,
        icon: '📋',
        isUnlocked: false,
        requirements: [
          { type: 'user_level', value: 'estudante', operator: '>=' }
        ],
        celebrationType: 'discrete',
        badgeColor: 'estudante_blue',
        relatedPersona: 'both'
      },

      // KNOWLEDGE MASTERY
      {
        id: 'pqtu_novice',
        title: 'Novato em PQT-U',
        description: 'Demonstrou conhecimento básico sobre Poliquimioterapia Única',
        category: 'knowledge_master',
        rarity: 'common',
        xpReward: 100,
        icon: '💊',
        isUnlocked: false,
        requirements: [
          { type: 'modules_completed', value: 1, operator: '>=' }
        ],
        celebrationType: 'visual',
        badgeColor: 'estudante_blue',
        relatedPersona: 'both'
      },
      {
        id: 'hanseniase_expert',
        title: 'Especialista em Hanseníase',
        description: 'Dominou todos os aspectos fundamentais da hanseníase e seu tratamento',
        category: 'knowledge_master',
        rarity: 'epic',
        xpReward: 500,
        icon: '🏆',
        isUnlocked: false,
        requirements: [
          { type: 'modules_completed', value: 5, operator: '>=' },
          { type: 'quiz_score', value: 85, operator: '>=' },
          { type: 'user_level', value: 'profissional', operator: '>=' }
        ],
        celebrationType: 'visual',
        badgeColor: 'especialista_gold',
        relatedPersona: 'dr-gasnelio'
      },

      // QUIZ MASTERY
      {
        id: 'quiz_enthusiast',
        title: 'Entusiasta dos Quiz',
        description: 'Completou seu primeiro quiz com sucesso',
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
        id: 'quiz_perfectionist',
        title: 'Perfeccionista',
        description: 'Acertou 100% das questões em um quiz completo',
        category: 'quiz_master',
        rarity: 'rare',
        xpReward: 200,
        icon: '💯',
        isUnlocked: false,
        requirements: [
          { type: 'quiz_score', value: 100, operator: '==' }
        ],
        celebrationType: 'visual',
        badgeColor: 'profissional_purple',
        relatedPersona: 'dr-gasnelio'
      },

      // STREAK CHAMPIONS
      {
        id: 'dedicated_learner',
        title: 'Aprendiz Dedicado',
        description: 'Manteve 7 dias consecutivos de atividade',
        category: 'streak_champion',
        rarity: 'rare',
        xpReward: 150,
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
        id: 'consistency_master',
        title: 'Mestre da Consistência',
        description: 'Incredible! 30 dias consecutivos de dedicação ao aprendizado',
        category: 'streak_champion',
        rarity: 'legendary',
        xpReward: 1000,
        icon: '👑',
        isUnlocked: false,
        requirements: [
          { type: 'streak_days', value: 30, operator: '>=' }
        ],
        celebrationType: 'visual',
        badgeColor: 'especialista_gold',
        relatedPersona: 'both'
      },

      // PERSONA SPECIALISTS
      {
        id: 'ga_friend',
        title: 'Amigo da Gá',
        description: 'Teve 20 conversas produtivas com nossa assistente empática',
        category: 'persona_specialist',
        rarity: 'rare',
        xpReward: 150,
        icon: '🤗',
        isUnlocked: false,
        requirements: [
          { type: 'chat_messages', value: 20, operator: '>=' },
          { type: 'persona_used', value: 'ga', operator: '==' }
        ],
        celebrationType: 'visual',
        badgeColor: 'persona_ga_warm',
        relatedPersona: 'ga'
      },
      {
        id: 'gasnelio_colleague',
        title: 'Colega do Dr. Gasnelio',
        description: 'Explorou aspectos técnicos avançados com nosso farmacêutico especialista',
        category: 'persona_specialist',
        rarity: 'rare',
        xpReward: 150,
        icon: '👨‍⚕️',
        isUnlocked: false,
        requirements: [
          { type: 'chat_messages', value: 20, operator: '>=' },
          { type: 'persona_used', value: 'dr-gasnelio', operator: '==' }
        ],
        celebrationType: 'visual',
        badgeColor: 'persona_gasnelio_clinical',
        relatedPersona: 'dr-gasnelio'
      },

      // INTERACTION EXPERTS
      {
        id: 'active_participant',
        title: 'Participante Ativo',
        description: 'Teve mais de 50 interações significativas na plataforma',
        category: 'interaction_expert',
        rarity: 'rare',
        xpReward: 200,
        icon: '💬',
        isUnlocked: false,
        requirements: [
          { type: 'chat_messages', value: 50, operator: '>=' }
        ],
        celebrationType: 'visual',
        badgeColor: 'profissional_purple',
        relatedPersona: 'both'
      },

      // MODULE GRADUATES
      {
        id: 'certified_professional',
        title: 'Profissional Certificado',
        description: 'Completou toda a certificação geral em hanseníase',
        category: 'module_graduate',
        rarity: 'legendary',
        xpReward: 1500,
        icon: '🎓',
        isUnlocked: false,
        requirements: [
          { type: 'modules_completed', value: 8, operator: '>=' },
          { type: 'quiz_score', value: 90, operator: '>=' },
          { type: 'user_level', value: 'especialista', operator: '>=' }
        ],
        celebrationType: 'visual',
        badgeColor: 'especialista_gold',
        relatedPersona: 'dr-gasnelio'
      }
    ];
  }

  // ============================================================================
  // PROGRESS CALCULATION
  // ============================================================================

  /**
   * Calcula progresso completo do usuário e atualiza conquistas
   */
  calculateCompleteProgress(
    userId: string,
    currentProfile: ExtendedUserProfile,
    chatMessages: number,
    quizStats: QuizStatistics,
    moduleProgress: any[],
    hasActivityToday: boolean
  ): {
    updatedProgress: LearningProgress,
    newAchievements: Achievement[],
    notifications: GamificationNotification[]
  } {
    // Atualizar streak
    const updatedStreak = this.updateStreakData(
      currentProfile.gamification?.streakData || {
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: new Date().toISOString(),
        isActiveToday: false,
        streakBreakGrace: 24
      },
      hasActivityToday
    );

    // Calcular XP
    const experiencePoints = this.calculateExperiencePoints(
      chatMessages,
      quizStats.completedQuizzes || 0,
      0, // Quiz incorretos - implementar depois
      moduleProgress.filter(m => m.status === 'completed').length,
      updatedStreak.currentStreak,
      currentProfile.gamification?.achievements?.length || 0
    );

    // Progresso atualizado
    const updatedProgress: LearningProgress = {
      userId,
      currentLevel: currentProfile.gamification?.currentLevel || 'paciente',
      experiencePoints,
      achievements: currentProfile.gamification?.achievements || [],
      streakData: updatedStreak,
      moduleProgress: moduleProgress || [],
      quizStats,
      lastActivity: new Date().toISOString(),
      totalTimeSpent: currentProfile.gamification?.totalTimeSpent || 0,
      preferredPersona: (currentProfile.selectedPersona as 'ga' | 'dr-gasnelio') || 'ga'
    };

    // Verificar novas conquistas
    const { newAchievements, notifications } = this.checkUnlockedAchievements(
      updatedProgress,
      this.getAllAchievements()
    );

    // Adicionar conquistas desbloqueadas ao progresso
    updatedProgress.achievements = [...updatedProgress.achievements, ...newAchievements];

    return {
      updatedProgress,
      newAchievements,
      notifications
    };
  }
}

// Singleton export
export const achievementSystem = AchievementSystem.getInstance();