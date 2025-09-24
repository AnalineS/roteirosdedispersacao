'use client';

import { useState, useEffect } from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import ProgressIndicator from '@/components/navigation/Progress/ProgressIndicator';
import { ProgressData } from '@/components/navigation/Progress';
import Link from 'next/link';
import GamificationWidget from '@/components/gamification/GamificationWidget';
import ProgressDashboard from '@/components/gamification/ProgressDashboard';
import EducationalQuizComponent from '@/components/gamification/EducationalQuiz';
import type { LearningProgress, Achievement as GamificationAchievement, GamificationNotification, QuizAttempt, EducationalQuiz } from '@/types/gamification';
import { UserLevel } from '@/types/disclosure';
import { EDUCATIONAL_QUIZZES, getQuizById } from '@/data/educationalQuizzes';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earnedAt: string;
  category: 'learning' | 'interaction' | 'progress' | 'special';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface LearningPath {
  id: string;
  title: string;
  description: string;
  modules: string[];
  difficulty: 'Básico' | 'Intermediário' | 'Avançado';
  estimatedTime: string;
  progress: number;
  category: 'clinical' | 'pharmaceutical' | 'management';
  recommendedFor: string[];
}

interface StudySession {
  date: string;
  duration: number; // minutes
  modules: string[];
  completed: boolean;
}

interface EducationalDashboardProps {
  currentPersona?: string;
}

export default function EducationalDashboard({ currentPersona }: EducationalDashboardProps) {
  const { profile, hasProfile } = useUserProfile();
  const [selectedLearningPath, setSelectedLearningPath] = useState<string>('clinical-complete');
  const [selectedQuizId, setSelectedQuizId] = useState<string>('hanseniase-fundamentals');
  const [showQuizSelection, setShowQuizSelection] = useState(true);

  // Dados educacionais avançados
  const achievements: Achievement[] = [
    {
      id: 'first-chat',
      title: 'Primeiro Contato',
      description: 'Iniciou sua primeira conversa com um assistente virtual',
      icon: '💬',
      earnedAt: '2025-01-01',
      category: 'interaction',
      rarity: 'common'
    },
    {
      id: 'module-master',
      title: 'Mestre dos Módulos',
      description: 'Completou 3 módulos educacionais em sequência',
      icon: '🎓',
      earnedAt: '2025-01-03',
      category: 'learning',
      rarity: 'rare'
    },
    {
      id: 'consistency-king',
      title: 'Rei da Consistência',
      description: 'Estudou por 7 dias consecutivos',
      icon: '👑',
      earnedAt: '2025-01-05',
      category: 'progress',
      rarity: 'epic'
    },
    {
      id: 'pqt-specialist',
      title: 'Especialista PQT-U',
      description: 'Dominou todos os aspectos da Poliquimioterapia Única',
      icon: '💊',
      earnedAt: '2025-01-07',
      category: 'special',
      rarity: 'legendary'
    }
  ];

  const learningPaths: LearningPath[] = [
    {
      id: 'clinical-complete',
      title: 'Trilha Clínica Completa',
      description: 'Caminho completo desde diagnóstico até acompanhamento do paciente com hanseníase',
      modules: ['hanseniase-intro', 'diagnostico', 'pqt-fundamentos', 'farmacovigilancia', 'casos-clinicos'],
      difficulty: 'Avançado',
      estimatedTime: '2h 15min',
      progress: 60,
      category: 'clinical',
      recommendedFor: ['Médicos', 'Enfermeiros', 'Estudantes de Medicina']
    },
    {
      id: 'pharmaceutical-focus',
      title: 'Trilha Farmacêutica',
      description: 'Foco em dispensação, orientações farmacêuticas e farmacovigilancia da PQT-U',
      modules: ['pqt-fundamentos', 'dispensacao', 'farmacovigilancia'],
      difficulty: 'Intermediário',
      estimatedTime: '1h 25min',
      progress: 75,
      category: 'pharmaceutical',
      recommendedFor: ['Farmacêuticos', 'Técnicos em Farmácia']
    },
    {
      id: 'basic-introduction',
      title: 'Introdução à Hanseníase',
      description: 'Conhecimentos fundamentais sobre a doença, transmissão e cuidados básicos',
      modules: ['hanseniase-intro', 'diagnostico'],
      difficulty: 'Básico',
      estimatedTime: '40min',
      progress: 100,
      category: 'management',
      recommendedFor: ['Profissionais de Saúde', 'Estudantes', 'Gestores']
    }
  ];

  const recentStudySessions: StudySession[] = [
    { date: '2025-01-05', duration: 25, modules: ['pqt-fundamentos'], completed: true },
    { date: '2025-01-04', duration: 30, modules: ['diagnostico'], completed: true },
    { date: '2025-01-03', duration: 20, modules: ['hanseniase-intro'], completed: true },
    { date: '2025-01-02', duration: 15, modules: ['hanseniase-intro'], completed: false },
  ];

  // Métricas educacionais
  const weeklyGoal = 5; // módulos por semana
  const weeklyProgress = 3;
  const totalStudyTime = recentStudySessions.reduce((total, session) => total + session.duration, 0);
  const averageSessionTime = totalStudyTime / recentStudySessions.length;
  const streak = 7; // dias consecutivos

  const currentPath = learningPaths.find(path => path.id === selectedLearningPath);
  const currentQuiz = getQuizById(selectedQuizId);

  const getRarityColor = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common': return '#22c55e';
      case 'rare': return '#3b82f6';
      case 'epic': return '#8b5cf6';
      case 'legendary': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getCategoryIcon = (category: LearningPath['category']) => {
    switch (category) {
      case 'clinical': return '🩺';
      case 'pharmaceutical': return '💊';
      case 'management': return '📊';
      default: return '📚';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '#22c55e';
      case 'intermediate': return '#f59e0b';
      case 'advanced': return '#dc2626';
      case 'expert': return '#7c3aed';
      default: return '#6b7280';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'Iniciante';
      case 'intermediate': return 'Intermediário';
      case 'advanced': return 'Avançado';
      case 'expert': return 'Especialista';
      default: return 'Padrão';
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header Personalizado */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Olá{hasProfile && profile ? `, ${profile.type === 'professional' ? 'Dr(a)' : 'estudante'}!` : '!'}
            </h1>
            <p className="text-lg text-gray-600">
              {currentPersona ? `Continuando com ${currentPersona}` : 'Seja bem-vindo ao seu painel educacional'}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Perfil detectado</div>
            <div className="text-lg font-semibold text-blue-600">
              {hasProfile && profile ? `${profile.type} • ${profile.focus}` : 'Visitante'}
            </div>
          </div>
        </div>
      </div>

      {/* Sistema de Gamificação Integrado */}
      <div className="mb-8">
        <GamificationWidget compact={false} showOnlyOverview={false} />
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Meta Semanal */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <span className="text-2xl">🎯</span>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{weeklyProgress}/{weeklyGoal}</div>
              <div className="text-sm text-gray-500">Meta Semanal</div>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${(weeklyProgress / weeklyGoal) * 100}%` }}
            />
          </div>
        </div>

        {/* Sequência de Estudos */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-orange-100 p-3 rounded-lg">
              <span className="text-2xl">🔥</span>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{streak}</div>
              <div className="text-sm text-gray-500">Dias Seguidos</div>
            </div>
          </div>
          <div className="text-sm text-orange-600 font-medium">
            Continue assim! 🚀
          </div>
        </div>

        {/* Tempo Total */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-green-100 p-3 rounded-lg">
              <span className="text-2xl">⏱️</span>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{totalStudyTime}min</div>
              <div className="text-sm text-gray-500">Tempo Total</div>
            </div>
          </div>
          <div className="text-sm text-green-600 font-medium">
            ~{Math.round(averageSessionTime)}min por sessão
          </div>
        </div>

        {/* Conquistas */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-purple-100 p-3 rounded-lg">
              <span className="text-2xl">🏆</span>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{achievements.length}</div>
              <div className="text-sm text-gray-500">Conquistas</div>
            </div>
          </div>
          <div className="text-sm text-purple-600 font-medium">
            +2 esta semana
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Trilha de Aprendizagem Atual */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Sua Trilha de Aprendizagem</h2>
              <select 
                value={selectedLearningPath} 
                onChange={(e) => setSelectedLearningPath(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {learningPaths.map(path => (
                  <option key={path.id} value={path.id}>{path.title}</option>
                ))}
              </select>
            </div>

            {currentPath && (
              <div className="space-y-4">
                {/* Info da Trilha */}
                <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    {getCategoryIcon(currentPath.category)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 mb-1">{currentPath.title}</h3>
                    <p className="text-gray-600 text-sm mb-2">{currentPath.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>📊 {currentPath.difficulty}</span>
                      <span>⏱️ {currentPath.estimatedTime}</span>
                      <span>🎯 {currentPath.progress}% completo</span>
                    </div>
                  </div>
                </div>

                {/* Progresso Visual */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-700">Progresso da Trilha</span>
                    <span className="text-sm text-gray-500">{currentPath.modules.length} módulos</span>
                  </div>
                  <div className="relative">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-700"
                        style={{ width: `${currentPath.progress}%` }}
                      />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-bold text-white drop-shadow">
                        {currentPath.progress}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Recomendado Para */}
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Recomendado para:</div>
                  <div className="flex flex-wrap gap-2">
                    {currentPath.recommendedFor.map((role, index) => (
                      <span 
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sessões de Estudo Recentes */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Atividade Recente</h2>
            <div className="space-y-3">
              {recentStudySessions.map((session, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${session.completed ? 'bg-green-500' : 'bg-yellow-500'}`} />
                    <div>
                      <div className="font-medium text-gray-900">
                        {new Date(session.date).toLocaleDateString('pt-BR', { 
                          weekday: 'long', 
                          day: 'numeric', 
                          month: 'short' 
                        })}
                      </div>
                      <div className="text-sm text-gray-500">
                        {session.modules.join(', ')}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">{session.duration}min</div>
                    <div className="text-xs text-gray-500">
                      {session.completed ? '✅ Concluído' : '⏸️ Em progresso'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar - Conquistas e Ações Rápidas */}
        <div className="space-y-6">
          {/* Conquistas Recentes */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Conquistas Recentes</h2>
            <div className="space-y-3">
              {achievements.slice(-3).map((achievement) => (
                <div 
                  key={achievement.id} 
                  className="flex items-center gap-3 p-3 rounded-lg border-2 transition-all hover:shadow-md"
                  style={{ borderColor: getRarityColor(achievement.rarity) + '40' }}
                >
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-xl"
                    style={{ backgroundColor: getRarityColor(achievement.rarity) + '20' }}
                  >
                    {achievement.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">{achievement.title}</div>
                    <div className="text-sm text-gray-500 truncate">{achievement.description}</div>
                    <div className="text-xs text-gray-400">
                      {new Date(achievement.earnedAt).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/progress" className="block mt-4 text-center py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors">
              Ver todas as conquistas
            </Link>
          </div>

          {/* Sistema de Aprendizagem Interativa */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">Sistema de Aprendizagem</h2>
                <p className="text-gray-600 text-sm">
                  Quizzes baseados em protocolos clínicos reais de hanseníase
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Baseado em</div>
                <div className="text-sm font-semibold text-blue-600">Tese Doutoral UnB</div>
              </div>
            </div>

            {showQuizSelection ? (
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800 mb-4">Escolha seu Quiz:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {EDUCATIONAL_QUIZZES.map((quiz) => (
                    <div
                      key={quiz.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedQuizId === quiz.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedQuizId(quiz.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 text-sm">{quiz.title}</h4>
                        <span
                          className="px-2 py-1 rounded-full text-xs font-medium text-white"
                          style={{ backgroundColor: getDifficultyColor(quiz.difficulty) }}
                        >
                          {getDifficultyLabel(quiz.difficulty)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mb-3">{quiz.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{quiz.questions.length} questões</span>
                        <span>{Math.floor((quiz.timeLimit || 10) / 60)} min</span>
                        <span>{quiz.xpReward} XP</span>
                      </div>
                    </div>
                  ))}
                </div>

                {currentQuiz && (
                  <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-blue-900">{currentQuiz.title}</h4>
                        <p className="text-sm text-blue-700 mt-1">{currentQuiz.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-blue-600">
                          <span>🎯 {currentQuiz.questions.length} questões</span>
                          <span>⏱️ {Math.floor((currentQuiz.timeLimit || 10) / 60)} minutos</span>
                          <span>🏆 {currentQuiz.xpReward} pontos XP</span>
                          <span>📊 Nota mínima: {currentQuiz.passingScore}%</span>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowQuizSelection(false)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        Iniciar Quiz
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800">{currentQuiz?.title}</h3>
                  <button
                    onClick={() => setShowQuizSelection(true)}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    ← Escolher outro quiz
                  </button>
                </div>

                {currentQuiz && (
                  <EducationalQuizComponent
                    quiz={currentQuiz}
                    userLevel={profile?.type === 'professional' ? 'profissional' : 'estudante'}
                    onQuizComplete={(attempt: QuizAttempt) => {
                      if (typeof window !== 'undefined' && window.gtag) {
                        window.gtag('event', 'quiz_completed', {
                          event_category: 'educational',
                          event_label: 'quiz_assessment',
                          custom_parameters: {
                            medical_context: 'hanseniase_education',
                            quiz_score: attempt.score,
                            user_level: profile?.type === 'professional' ? 'profissional' : 'estudante'
                          }
                        });
                      }
                      // Aqui você pode implementar lógica para salvar o resultado
                      // e atualizar pontuação/conquistas
                      setShowQuizSelection(true);
                    }}
                    onQuizExit={() => {
                      if (typeof window !== 'undefined' && window.gtag) {
                        window.gtag('event', 'quiz_exited', {
                          event_category: 'educational',
                          event_label: 'quiz_abandonment',
                          custom_parameters: {
                            medical_context: 'hanseniase_education',
                            user_level: profile?.type === 'professional' ? 'profissional' : 'estudante'
                          }
                        });
                      }
                      setShowQuizSelection(true);
                    }}
                  />
                )}
              </div>
            )}
          </div>

          {/* Ações Rápidas */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Ações Rápidas</h2>
            <div className="space-y-3">
              <Link href="/chat" className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                <span className="text-2xl">💬</span>
                <div>
                  <div className="font-medium text-blue-900">Continuar Chat</div>
                  <div className="text-sm text-blue-600">Com {currentPersona || 'assistente virtual'}</div>
                </div>
              </Link>
              
              <Link href="/modules" className="flex items-center gap-3 p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                <span className="text-2xl">📚</span>
                <div>
                  <div className="font-medium text-green-900">Próximo Módulo</div>
                  <div className="text-sm text-green-600">Roteiro de Dispensação</div>
                </div>
              </Link>
              
              <Link href="/resources" className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
                <span className="text-2xl">🛠️</span>
                <div>
                  <div className="font-medium text-orange-900">Ferramentas</div>
                  <div className="text-sm text-orange-600">Calculadoras e checklists</div>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}