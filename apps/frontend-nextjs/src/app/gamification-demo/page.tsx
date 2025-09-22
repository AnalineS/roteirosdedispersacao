/**
 * Gamification Demo Page - Demonstração completa do sistema de gamificação
 * Integração real com sistema de achievements, quiz e progresso educacional
 * Inclui tutorial de uso do sistema
 */

'use client';

import React, { useState } from 'react';
import { useGamification } from '@/hooks/useGamification';
import { useProgressiveDisclosure } from '@/hooks/useProgressiveDisclosure';
import ProgressDashboard from '@/components/gamification/ProgressDashboard';
import EducationalQuiz from '@/components/gamification/EducationalQuiz';
import BadgeCard from '@/components/gamification/BadgeCard';
import { NotificationProvider, NotificationPermissionButton } from '@/components/gamification/NotificationSystem';
import type { 
  Achievement, 
  EducationalQuiz as QuizType,
  QuizAttempt,
} from '@/types/gamification';
import { getQuizByUserLevel } from '@/data/quiz/hanseniaseQuestions';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  component: string;
  action?: string;
}

export default function GamificationDemoPage() {
  
  // ============================================================================
  // HOOKS AND STATE
  // ============================================================================
  
  const gamification = useGamification();
  const { currentLevel } = useProgressiveDisclosure();
  
  // ============================================================================
  // REAL-TIME LEADERBOARD SETUP
  // ============================================================================
  
  React.useEffect(() => {
    // Configurar subscrição em tempo real do leaderboard se o usuário estiver autenticado
    const unsubscribe = gamification.subscribeToRealTimeLeaderboard();
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [gamification]);
  
  const [activeView, setActiveView] = useState<'dashboard' | 'quiz' | 'tutorial'>('dashboard');
  const [selectedQuiz, setSelectedQuiz] = useState<QuizType | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [currentTutorialStep, setCurrentTutorialStep] = useState(0);
  const [showCelebration, setShowCelebration] = useState<Achievement | null>(null);

  // ============================================================================
  // TUTORIAL CONFIGURATION
  // ============================================================================

  const tutorialSteps: TutorialStep[] = [
    {
      id: 'welcome',
      title: '🎮 Bem-vindo ao Sistema de Gamificação!',
      description: 'Aprenda sobre hanseníase de forma interativa, ganhe XP, conquiste achievements e suba no ranking!',
      component: 'overview'
    },
    {
      id: 'dashboard',
      title: '📊 Dashboard de Progresso',
      description: 'Acompanhe seu XP, streak diário, conquistas e posição no ranking. Use as abas para navegar entre diferentes visualizações.',
      component: 'dashboard'
    },
    {
      id: 'quiz_system',
      title: '🧠 Sistema de Quiz',
      description: 'Responda questões sobre hanseníase adaptadas ao seu nível. Feedback personalizado por Gá (empático) ou Dr. Gasnelio (técnico).',
      component: 'quiz',
      action: 'start_quiz'
    },
    {
      id: 'achievements',
      title: '🏆 Sistema de Conquistas',
      description: 'Desbloqueie badges coloridos por nível, mantenha streaks consecutivos e complete módulos educacionais.',
      component: 'achievements'
    },
    {
      id: 'leaderboard',
      title: '👑 Ranking entre Usuários',
      description: 'Compare seu progresso com outros usuários logados. Apenas participantes autenticados aparecem no ranking.',
      component: 'leaderboard'
    },
    {
      id: 'personas',
      title: '🤗👨‍⚕️ Integração com Personas',
      description: 'Gá oferece explicações empáticas e acolhedoras. Dr. Gasnelio fornece feedback técnico e científico.',
      component: 'personas'
    }
  ];

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleQuizComplete = async (attempt: QuizAttempt) => {
    await gamification.recordQuizAttempt(attempt);
    setSelectedQuiz(null);
    setActiveView('dashboard');
    
    // Show celebration for significant achievements
    if (attempt.isPassed && attempt.score >= 90) {
      // Mock achievement for perfect score
      const perfectScoreAchievement: Achievement = {
        id: 'perfect_score',
        title: 'Pontuação Perfeita!',
        description: `Acertou ${attempt.score}% no quiz de ${currentLevel}`,
        category: 'quiz_master',
        rarity: 'rare',
        xpReward: 100,
        icon: '🎯',
        isUnlocked: true,
        requirements: [],
        celebrationType: 'visual',
        badgeColor: 'especialista_gold',
        relatedPersona: 'both',
        unlockedAt: new Date().toISOString()
      };
      
      setShowCelebration(perfectScoreAchievement);
    }
  };

  const handleStartQuiz = (userLevel = currentLevel) => {
    const quiz = getQuizByUserLevel(userLevel);
    if (quiz && gamification.canTakeQuiz(quiz.id)) {
      setSelectedQuiz(quiz);
      setActiveView('quiz');
    }
  };

  const handleAchievementClick = (achievement: Achievement) => {
    console.log('Achievement clicked:', achievement);
    // Could show detailed achievement modal
  };

  const handleTutorialNext = () => {
    if (currentTutorialStep < tutorialSteps.length - 1) {
      setCurrentTutorialStep(prev => prev + 1);
      
      // Execute tutorial actions
      const step = tutorialSteps[currentTutorialStep + 1];
      if (step.action === 'start_quiz') {
        // Don't actually start quiz in tutorial, just demonstrate
        console.log('Tutorial would start quiz here');
      }
    } else {
      setShowTutorial(false);
      setCurrentTutorialStep(0);
    }
  };

  const handleTutorialPrev = () => {
    if (currentTutorialStep > 0) {
      setCurrentTutorialStep(prev => prev - 1);
    }
  };

  const simulateActivity = async () => {
    await gamification.recordChatInteraction('ga');
    await gamification.recordDailyActivity();
  };

  // ============================================================================
  // TUTORIAL OVERLAY
  // ============================================================================

  const renderTutorial = () => {
    if (!showTutorial) return null;

    const step = tutorialSteps[currentTutorialStep];

    return (
      <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-2xl w-full">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2">{step.title}</h2>
            <p className="text-gray-600 text-lg">{step.description}</p>
          </div>

          {/* Tutorial content based on step */}
          {step.component === 'overview' && (
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white text-center mb-6">
              <div className="text-4xl mb-2">🎯</div>
              <h3 className="text-xl font-bold">Sistema Educacional Gamificado</h3>
              <p className="text-blue-100 mt-2">
                Aprenda sobre PQT-U e hanseníase de forma interativa!
              </p>
            </div>
          )}

          {step.component === 'quiz' && (
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <h4 className="font-semibold mb-2">🧠 Exemplo de Questão:</h4>
              <div className="bg-white rounded-lg p-4 border">
                <p className="font-medium mb-3">
                  Qual é a duração do tratamento PQT-U para hanseníase?
                </p>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-full border-2 border-green-500 bg-green-500 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                    <span className="text-green-700 font-medium">6 meses ✓</span>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-green-50 rounded border-l-4 border-green-500">
                  <p className="text-sm text-green-700">
                    <strong>🤗 Gá explica:</strong> Isso mesmo! O tratamento PQT-U dura 6 meses, com doses mensais supervisionadas.
                  </p>
                </div>
              </div>
            </div>
          )}

          {step.component === 'achievements' && (
            <div className="grid grid-cols-3 gap-4 mb-6">
              <BadgeCard
                achievement={{
                  id: 'demo1',
                  title: 'Primeiro Quiz',
                  description: 'Completou primeiro quiz',
                  category: 'first_steps',
                  rarity: 'common',
                  xpReward: 50,
                  icon: '🎯',
                  isUnlocked: true,
                  requirements: [],
                  celebrationType: 'discrete',
                  badgeColor: 'paciente_green',
                  relatedPersona: 'both'
                }}
                size="sm"
              />
              <BadgeCard
                achievement={{
                  id: 'demo2',
                  title: 'Streak 7 dias',
                  description: 'Manteve 7 dias consecutivos',
                  category: 'streak_champion',
                  rarity: 'rare',
                  xpReward: 150,
                  icon: '🔥',
                  isUnlocked: false,
                  requirements: [],
                  celebrationType: 'visual',
                  badgeColor: 'profissional_purple',
                  relatedPersona: 'both'
                }}
                size="sm"
              />
              <BadgeCard
                achievement={{
                  id: 'demo3',
                  title: 'Especialista',
                  description: 'Dominou todos os módulos',
                  category: 'knowledge_master',
                  rarity: 'legendary',
                  xpReward: 500,
                  icon: '👑',
                  isUnlocked: false,
                  requirements: [],
                  celebrationType: 'visual',
                  badgeColor: 'especialista_gold',
                  relatedPersona: 'dr-gasnelio'
                }}
                size="sm"
              />
            </div>
          )}

          {/* Tutorial navigation */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {currentTutorialStep + 1} de {tutorialSteps.length}
            </div>
            
            <div className="flex space-x-3">
              {currentTutorialStep > 0 && (
                <button
                  onClick={handleTutorialPrev}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Anterior
                </button>
              )}
              
              <button
                onClick={handleTutorialNext}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                {currentTutorialStep === tutorialSteps.length - 1 ? 'Finalizar' : 'Próximo'}
              </button>
            </div>
          </div>
          
          {/* Progress indicator */}
          <div className="mt-6">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${((currentTutorialStep + 1) / tutorialSteps.length) * 100}%`
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ============================================================================
  // CELEBRATION MODAL
  // ============================================================================

  const renderCelebration = () => {
    if (!showCelebration) return null;

    return (
      <BadgeCard
        achievement={showCelebration}
        variant="celebration"
        onClick={() => setShowCelebration(null)}
      />
    );
  };

  // ============================================================================
  // QUICK ACTIONS PANEL
  // ============================================================================

  const renderQuickActions = () => (
    <div className="bg-white rounded-xl p-6 shadow-lg mb-6">
      <h3 className="text-lg font-semibold mb-4">⚡ Ações Rápidas</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <button
          onClick={() => handleStartQuiz()}
          disabled={!gamification.canTakeQuiz(getQuizByUserLevel(currentLevel)?.id || '')}
          className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 text-sm font-medium"
        >
          🧠 Fazer Quiz
        </button>
        
        <button
          onClick={simulateActivity}
          className="p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm font-medium"
        >
          💬 Simular Chat
        </button>
        
        <button
          onClick={() => setShowTutorial(true)}
          className="p-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 text-sm font-medium"
        >
          📚 Tutorial
        </button>
        
        <button
          onClick={gamification.forceSync}
          disabled={gamification.syncStatus === 'syncing'}
          className="p-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:bg-gray-300 text-sm font-medium"
        >
          🔄 Sincronizar
        </button>
      </div>
    </div>
  );

  // ============================================================================
  // STATUS INDICATORS
  // ============================================================================

  const renderStatusIndicators = () => (
    <div className="bg-white rounded-xl p-6 shadow-lg mb-6">
      <h3 className="text-lg font-semibold mb-4">📊 Status do Sistema</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div>
          <div className={`text-2xl font-bold ${
            gamification.syncStatus === 'syncing' ? 'text-orange-500' :
            gamification.syncStatus === 'error' ? 'text-red-500' :
            'text-green-500'
          }`}>
            {gamification.syncStatus === 'syncing' ? '⏳' :
             gamification.syncStatus === 'error' ? '❌' : '✅'}
          </div>
          <div className="text-sm text-gray-600">Sincronização</div>
        </div>
        
        <div>
          <div className="text-2xl font-bold text-blue-500">
            {gamification.progress?.achievements.length || 0}
          </div>
          <div className="text-sm text-gray-600">Conquistas</div>
        </div>
        
        <div>
          <div className="text-2xl font-bold text-purple-500">
            {gamification.progress?.experiencePoints.level || 0}
          </div>
          <div className="text-sm text-gray-600">Nível</div>
        </div>
        
        <div>
          <div className="text-2xl font-bold text-orange-500">
            {gamification.getUserRank() || '--'}
          </div>
          <div className="text-sm text-gray-600">Posição</div>
        </div>
      </div>
    </div>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  if (gamification.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando sistema de gamificação...</p>
        </div>
      </div>
    );
  }

  if (activeView === 'quiz' && selectedQuiz) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="mb-6">
            <button
              onClick={() => {
                setSelectedQuiz(null);
                setActiveView('dashboard');
              }}
              className="text-blue-500 hover:text-blue-600 flex items-center space-x-2"
            >
              <span>←</span>
              <span>Voltar ao Dashboard</span>
            </button>
          </div>
          
          <EducationalQuiz
            quiz={selectedQuiz}
            userLevel={currentLevel}
            onQuizComplete={handleQuizComplete}
            onQuizExit={() => {
              setSelectedQuiz(null);
              setActiveView('dashboard');
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <NotificationProvider>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              🎮 Sistema de Gamificação - Hanseníase
            </h1>
            <p className="text-gray-600">
              Demonstração completa com integração real dos sistemas
            </p>
            
            {/* Notification Permission Button */}
            <div className="mt-4 flex justify-center">
              <NotificationPermissionButton />
            </div>
          </div>

          {/* Status and Quick Actions */}
          {renderStatusIndicators()}
          {renderQuickActions()}

          {/* Main Dashboard */}
          {gamification.progress && (
            <ProgressDashboard
              progress={gamification.progress}
              availableAchievements={gamification.progress.achievements}
              notifications={gamification.notifications}
              leaderboard={gamification.leaderboard}
              onAchievementClick={handleAchievementClick}
              onStartTutorial={() => setShowTutorial(true)}
            />
          )}

          {/* Notifications Panel */}
          {gamification.notifications.length > 0 && (
            <div className="mt-6 bg-white rounded-xl p-6 shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">🔔 Notificações Recentes</h3>
                <button
                  onClick={gamification.clearAllNotifications}
                  className="text-sm text-blue-500 hover:text-blue-600"
                >
                  Limpar todas
                </button>
              </div>
              
              <div className="space-y-3">
                {gamification.notifications.slice(0, 5).map((notification) => (
                  <div 
                    key={notification.id}
                    className="flex items-center justify-between p-3 bg-blue-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">
                        {notification.type === 'achievement_unlocked' ? '🏆' :
                         notification.type === 'level_up' ? '🎉' :
                         notification.type === 'streak_milestone' ? '🔥' : '📝'}
                      </span>
                      <div>
                        <div className="font-medium text-sm">{notification.title}</div>
                        <div className="text-xs text-gray-600">{notification.message}</div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => gamification.markNotificationRead(notification.id)}
                      className="text-xs text-blue-500 hover:text-blue-600"
                    >
                      Marcar como lida
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tutorial Modal */}
          {renderTutorial()}
          
          {/* Celebration Modal */}
          {renderCelebration()}
        </div>
      </div>
    </NotificationProvider>
  );
}