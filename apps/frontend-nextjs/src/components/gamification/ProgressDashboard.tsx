/**
 * ProgressDashboard - Painel consolidado de gamificação
 * Dashboard integrado na página principal com gráficos e indicadores
 * Sistema híbrido: progresso visual + próximas conquistas + histórico
 */

'use client';

import React, { useState } from 'react';
import type { 
  LearningProgress, 
  Achievement, 
  GamificationNotification,
  LeaderboardEntry 
} from '@/types/gamification';
import { UserLevel } from '@/types/disclosure';
import BadgeCard, { BadgeCollection } from './BadgeCard';
import ProgressRing, { ProgressBar, LevelBadge } from './ProgressRing';

interface ProgressDashboardProps {
  progress?: LearningProgress;
  availableAchievements?: Achievement[];
  notifications?: GamificationNotification[];
  leaderboard?: LeaderboardEntry[];
  onAchievementClick?: (achievement: Achievement) => void;
  onStartTutorial?: () => void;
  className?: string;
  userId?: string;
  showAchievements?: boolean;
  showLeaderboard?: boolean;
}

interface DashboardTab {
  id: string;
  label: string;
  icon: string;
}

export default function ProgressDashboard({
  progress,
  availableAchievements,
  notifications,
  leaderboard = [],
  onAchievementClick,
  onStartTutorial,
  className = ''
}: ProgressDashboardProps) {

  const [activeTab, setActiveTab] = useState('overview');

  // ============================================================================
  // DATA PROCESSING
  // ============================================================================

  const unlockedAchievements = availableAchievements?.filter(a => a.isUnlocked) || [];
  const nextAchievements = availableAchievements
    ?.filter(a => !a.isUnlocked)
    .slice(0, 3) || []; // Próximas 3 conquistas

  const unreadNotifications = notifications?.filter(n => !n.isRead) || [];

  const streakDays = progress?.streakData.currentStreak || 0;
  const longestStreak = progress?.streakData.longestStreak || 0;

  const completedModules = progress?.moduleProgress.filter(m => m.status === 'completed').length || 0;
  const totalModules = progress?.moduleProgress.length || 0;

  const averageQuizScore = progress?.quizStats.averageScore || 0;
  const totalQuizzes = progress?.quizStats.totalQuizzes || 0;

  // Clinical Case Statistics
  const completedCases = progress?.caseStats.completedCases || 0;
  const totalCases = progress?.caseStats.totalCases || 0;
  const averageCaseScore = progress?.caseStats.averageScore || 0;
  const caseTimeSpent = progress?.caseStats.timeSpentCases || 0;

  // Calcular posição no leaderboard
  const userRank = leaderboard.findIndex(entry => entry.userId === progress?.userId) + 1;

  // ============================================================================
  // TABS CONFIGURATION
  // ============================================================================

  const tabs: DashboardTab[] = [
    { id: 'overview', label: 'Visão Geral', icon: '📊' },
    { id: 'achievements', label: 'Conquistas', icon: '🏆' },
    { id: 'leaderboard', label: 'Ranking', icon: '👑' },
    { id: 'statistics', label: 'Estatísticas', icon: '📈' }
  ];

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">
              Olá, {progress?.currentLevel === 'paciente' ? 'Estudante' :
                     progress?.currentLevel === 'estudante' ? 'Estudante' :
                     progress?.currentLevel === 'profissional' ? 'Profissional' : 'Especialista'}!
            </h2>
            <p className="text-blue-100">
              Continue sua jornada de aprendizado em hanseníase
            </p>
          </div>
          <LevelBadge
            level={progress?.experiencePoints.level || 1}
            userLevel={progress?.currentLevel || 'paciente'}
            size="lg"
          />
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {streakDays}
            </div>
            <div className="text-sm text-gray-600">
              Dias consecutivos
            </div>
            <div className="text-xs text-gray-500 mt-1">
              🔥 {progress?.streakData.isActiveToday ? 'Ativo hoje' : 'Faça login hoje!'}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {unlockedAchievements.length}
            </div>
            <div className="text-sm text-gray-600">
              Conquistas
            </div>
            <div className="text-xs text-gray-500 mt-1">
              📈 de {availableAchievements?.length || 0} totais
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {completedModules}
            </div>
            <div className="text-sm text-gray-600">
              Módulos completos
            </div>
            <div className="text-xs text-gray-500 mt-1">
              📚 de {totalModules} disponíveis
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {userRank > 0 ? `#${userRank}` : '--'}
            </div>
            <div className="text-sm text-gray-600">
              Posição no ranking
            </div>
            <div className="text-xs text-gray-500 mt-1">
              👥 entre {leaderboard.length} usuários
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
          <div className="text-center">
            <div className="text-2xl font-bold text-teal-600">
              {completedCases}
            </div>
            <div className="text-sm text-gray-600">
              Casos clínicos
            </div>
            <div className="text-xs text-gray-500 mt-1">
              🩺 {averageCaseScore > 0 ? `${averageCaseScore.toFixed(1)}% precisão` : 'Nenhum completado'}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Section */}
      <div className="grid md:grid-cols-2 gap-6">
        <ProgressRing
          experiencePoints={progress?.experiencePoints || {
            total: 0,
            level: 1,
            nextLevelXP: 100,
            byCategory: {
              chat_interactions: 0,
              quiz_completion: 0,
              module_completion: 0,
              case_completion: 0,
              streak_bonus: 0,
              achievement_bonus: 0
            }
          }}
          userLevel={progress?.currentLevel || 'paciente'}
          size="lg"
          variant="dashboard"
        />

        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Progresso dos Módulos</h3>
          <div className="space-y-4">
            <ProgressBar
              current={completedModules}
              total={totalModules}
              label="Módulos Concluídos"
              color="#22c55e"
            />
            
            <ProgressBar
              current={averageQuizScore}
              total={100}
              label="Média nos Quiz (%)"
              color="#3b82f6"
            />
            
            <ProgressBar
              current={Math.min(totalQuizzes, 20)}
              total={20}
              label="Quiz Realizados"
              color="#8b5cf6"
            />

            <ProgressBar
              current={completedCases}
              total={Math.max(totalCases, 5)} // Show at least 5 cases as target
              label="Casos Clínicos"
              color="#0d9488"
            />
          </div>
        </div>
      </div>

      {/* Next Achievements */}
      {nextAchievements.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold mb-4">🎯 Próximas Conquistas</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {nextAchievements.map((achievement) => (
              <BadgeCard
                key={achievement.id}
                achievement={achievement}
                size="md"
                onClick={() => onAchievementClick?.(achievement)}
                className="hover:scale-105 transition-transform"
              />
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {unreadNotifications.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold mb-4">📢 Atividade Recente</h3>
          <div className="space-y-3">
            {unreadNotifications.slice(0, 3).map((notification) => (
              <div 
                key={notification.id}
                className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg"
              >
                <div className="text-xl">
                  {notification.type === 'achievement_unlocked' ? '🏆' :
                   notification.type === 'level_up' ? '🎉' :
                   notification.type === 'streak_milestone' ? '🔥' : '📝'}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">{notification.title}</div>
                  <div className="text-xs text-gray-600">{notification.message}</div>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(notification.createdAt).toLocaleDateString('pt-BR')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderAchievements = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Suas Conquistas</h2>
        <div className="text-sm text-gray-600">
          {unlockedAchievements.length} de {availableAchievements?.length || 0} desbloqueadas
        </div>
      </div>

      <BadgeCollection
        achievements={availableAchievements || []}
        title=""
        size="md"
        showLocked={true}
        onBadgeClick={onAchievementClick}
      />
    </div>
  );

  const renderLeaderboard = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Ranking Geral</h2>
        <div className="text-sm text-gray-600">
          Atualizado hoje
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
          <h3 className="font-semibold">🏆 Top Learners</h3>
          <p className="text-sm opacity-90">Os mais dedicados ao aprendizado</p>
        </div>

        <div className="divide-y divide-gray-200">
          {leaderboard.slice(0, 10).map((entry, index) => (
            <div 
              key={entry.userId}
              className={`p-4 flex items-center justify-between ${
                entry.userId === progress?.userId ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-center space-x-4">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm
                  ${index === 0 ? 'bg-yellow-500 text-white' :
                    index === 1 ? 'bg-gray-400 text-white' :
                    index === 2 ? 'bg-yellow-700 text-white' :
                    'bg-gray-100 text-gray-600'}
                `}>
                  {index + 1}
                </div>
                
                <div>
                  <div className="font-medium">
                    {entry.displayName}
                    {entry.userId === progress?.userId && (
                      <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-1 rounded-full">
                        Você
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    Nível {entry.level} • {entry.achievementCount} conquistas
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="font-bold text-lg">
                  {entry.totalXP.toLocaleString()}
                </div>
                <div className="text-xs text-gray-600">XP</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {userRank > 10 && (
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-1">Sua posição atual:</div>
            <div className="text-2xl font-bold text-blue-600">#{userRank}</div>
            <div className="text-xs text-gray-500">
              Continue estudando para subir no ranking!
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderStatistics = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Estatísticas Detalhadas</h2>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Learning Stats */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold mb-4">📚 Aprendizado</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Tempo total de estudo:</span>
              <span className="font-medium">
                {Math.round((progress?.totalTimeSpent || 0) / 60)}h {(progress?.totalTimeSpent || 0) % 60}m
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Módulos concluídos:</span>
              <span className="font-medium">{completedModules}/{totalModules}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Quiz realizados:</span>
              <span className="font-medium">{totalQuizzes}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Média nos quiz:</span>
              <span className="font-medium">{averageQuizScore.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Streak Stats */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold mb-4">🔥 Consistência</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Streak atual:</span>
              <span className="font-medium text-orange-600">{streakDays} dias</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Maior streak:</span>
              <span className="font-medium">{longestStreak} dias</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Última atividade:</span>
              <span className="font-medium">
                {progress?.lastActivity ? new Date(progress.lastActivity).toLocaleDateString('pt-BR') : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status hoje:</span>
              <span className={`font-medium ${
                progress?.streakData.isActiveToday ? 'text-green-600' : 'text-red-600'
              }`}>
                {progress?.streakData.isActiveToday ? '✅ Ativo' : '❌ Inativo'}
              </span>
            </div>
          </div>
        </div>

        {/* XP Breakdown */}
        <div className="bg-white rounded-xl p-6 shadow-lg md:col-span-2">
          <h3 className="text-lg font-semibold mb-4">⚡ Distribuição de XP</h3>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {progress?.experiencePoints.byCategory.chat_interactions || 0}
              </div>
              <div className="text-sm text-gray-600">Chat</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {progress?.experiencePoints.byCategory.quiz_completion || 0}
              </div>
              <div className="text-sm text-gray-600">Quiz</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {progress?.experiencePoints.byCategory.module_completion || 0}
              </div>
              <div className="text-sm text-gray-600">Módulos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {progress?.experiencePoints.byCategory.streak_bonus || 0}
              </div>
              <div className="text-sm text-gray-600">Streak</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {progress?.experiencePoints.byCategory.achievement_bonus || 0}
              </div>
              <div className="text-sm text-gray-600">Conquistas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-teal-600">
                {progress?.experiencePoints.byCategory.case_completion || 0}
              </div>
              <div className="text-sm text-gray-600">Casos</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tutorial Button */}
      {onStartTutorial && (
        <div className="bg-gray-50 rounded-xl p-6 text-center">
          <h3 className="font-semibold mb-2">Precisa de ajuda?</h3>
          <p className="text-gray-600 mb-4">
            Aprenda como usar todas as funcionalidades da gamificação
          </p>
          <button
            onClick={onStartTutorial}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            📚 Iniciar Tutorial
          </button>
        </div>
      )}
    </div>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div className={`max-w-6xl mx-auto ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Dashboard de Progresso
        </h1>
        <p className="text-gray-600">
          Acompanhe seu aprendizado e conquistas em hanseníase
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center space-x-2 py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.id === 'achievements' && unreadNotifications.length > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                  {unreadNotifications.length}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-96">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'achievements' && renderAchievements()}
        {activeTab === 'leaderboard' && renderLeaderboard()}
        {activeTab === 'statistics' && renderStatistics()}
      </div>
    </div>
  );
}