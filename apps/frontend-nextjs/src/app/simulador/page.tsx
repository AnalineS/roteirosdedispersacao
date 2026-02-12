'use client';

import { useState, useEffect } from 'react';
import EducationalLayout from '@/components/layout/EducationalLayout';
import SimulatorIntroduction from '@/components/interactive/ClinicalSimulator/SimulatorIntroduction';
import CaseSelector from '@/components/interactive/ClinicalSimulator/CaseSelector';
import CaseExecution from '@/components/interactive/ClinicalSimulator/CaseExecution';
import { CLINICAL_CASES } from '@/data/clinicalCases';
import { ClinicalCase, CaseSession } from '@/types/clinicalCases';
import { getUnbColors } from '@/config/modernTheme';
import { CompletedCase, Achievement } from '@/types/gamification';
import { LearningProgress, DEFAULT_ACHIEVEMENTS } from '@/types/gamification';
import { UserLevel } from '@/types/disclosure';
import Link from 'next/link';
import {
  MicroscopeIcon,
  RefreshIcon,
  TargetIcon,
  CheckCircleIcon,
  BookIcon
} from '@/components/icons/EducationalIcons';

type SimulatorState = 'introduction' | 'case_selection' | 'case_execution' | 'case_results' | 'session_history';

// Completed cases loaded from localStorage

export default function SimuladorPage() {
  const unbColors = getUnbColors();
  const [currentState, setCurrentState] = useState<SimulatorState>('introduction');
  const [selectedCase, setSelectedCase] = useState<ClinicalCase | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [completedCases, setCompletedCases] = useState<string[]>([]);
  const [gamificationProgress, setGamificationProgress] = useState<LearningProgress | null>(null);
  const [earnedXP, setEarnedXP] = useState(0);
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  const [userLevel] = useState<'paciente' | 'estudante' | 'profissional' | 'especialista'>('estudante'); // Default to estudante

  // Sistema de CaseSession ativado - rastreamento completo de sessões clínicas
  const [currentSession, setCurrentSession] = useState<CaseSession | null>(null);
  const [sessionHistory, setSessionHistory] = useState<CaseSession[]>([]);

  // Persistir sessionHistory no localStorage sempre que mudar
  const SESSION_HISTORY_KEY = 'simulador_session_history';
  const MAX_STORED_SESSIONS = 50;

  useEffect(() => {
    // Skip persisting on initial empty state (loaded separately below)
    if (sessionHistory.length === 0) return;
    try {
      const toStore = sessionHistory.slice(-MAX_STORED_SESSIONS);
      localStorage.setItem(SESSION_HISTORY_KEY, JSON.stringify(toStore));
    } catch { /* localStorage full or unavailable */ }
  }, [sessionHistory]);

  // Inicializar sistema de gamificação e carregar progresso do usuário
  useEffect(() => {
    const loadUserProgress = async () => {
      setIsLoading(true);

      // Carregar session history do localStorage
      try {
        const storedHistory = localStorage.getItem(SESSION_HISTORY_KEY);
        if (storedHistory) {
          const parsed: CaseSession[] = JSON.parse(storedHistory);
          // Reconstituir objetos Date que foram serializados como string
          const hydrated = parsed.map(s => ({
            ...s,
            startTime: new Date(s.startTime),
            endTime: s.endTime ? new Date(s.endTime) : undefined,
          }));
          setSessionHistory(hydrated);
        }
      } catch { /* localStorage indisponivel */ }

      // Carregar progresso real do localStorage
      let savedCaseIds: string[] = [];
      let savedCaseObjects: CompletedCase[] = [];
      let savedXP = 0;
      let savedUnlocked: string[] = [];
      try {
        const stored = localStorage.getItem('gamification_progress');
        if (stored) {
          const parsed = JSON.parse(stored);
          const rawCases = parsed.completedCases || [];
          // Suportar tanto string[] quanto CompletedCase[]
          if (rawCases.length > 0 && typeof rawCases[0] === 'string') {
            savedCaseIds = rawCases;
          } else {
            savedCaseObjects = rawCases;
            savedCaseIds = rawCases.map((c: CompletedCase) => c.caseId);
          }
          savedXP = parsed.totalXP || 0;
          savedUnlocked = parsed.unlockedAchievements || [];
        }
      } catch {
        // localStorage indisponivel - iniciar do zero
      }

      const availableAchievements = DEFAULT_ACHIEVEMENTS.filter(achievement =>
        achievement.category === 'knowledge_master' || achievement.category === 'clinical_simulator'
      );

      const unlockedAchievementObjects = availableAchievements.filter(achievement =>
        savedUnlocked.includes(achievement.id)
      );

      const initialProgress: LearningProgress = {
        userId: 'user-1',
        currentLevel: 'estudante' as UserLevel,
        experiencePoints: {
          total: savedXP,
          byCategory: {
            chat_interactions: 0,
            quiz_completion: 0,
            module_completion: 0,
            case_completion: savedXP,
            streak_bonus: 0,
            achievement_bonus: 0
          },
          level: Math.max(1, Math.floor(savedXP / 1000) + 1),
          nextLevelXP: 1000
        },
        achievements: unlockedAchievementObjects,
        streakData: {
          currentStreak: 0,
          longestStreak: 0,
          lastActivityDate: new Date().toISOString(),
          isActiveToday: false,
          streakBreakGrace: 1
        },
        moduleProgress: [],
        quizStats: {
          totalQuizzes: 0,
          completedQuizzes: 0,
          averageScore: 0,
          totalXPFromQuizzes: 0,
          bestStreak: 0,
          currentStreak: 0,
          favoriteTopics: [],
          weakestTopics: [],
          timeSpentQuizzes: 0,
          lastQuizDate: new Date().toISOString()
        },
        caseStats: {
          totalCases: 0,
          completedCases: savedCaseIds.length,
          averageScore: 0,
          totalXPFromCases: savedXP,
          casesPassedFirstAttempt: 0,
          bestDiagnosticStreak: 0,
          currentDiagnosticStreak: 0,
          categoriesCompleted: {
            pediatrico: 0,
            adulto: 0,
            gravidez: 0,
            complicacoes: 0,
            interacoes: 0
          },
          difficultyCompleted: {
            basico: 0,
            intermediario: 0,
            avancado: 0,
            complexo: 0
          },
          averageTimePerCase: 0,
          fastestCompletion: 0,
          timeSpentCases: 0,
          lastCaseDate: new Date().toISOString(),
          favoriteCategories: [],
          strongestSkills: [],
          areasForImprovement: []
        },
        lastActivity: new Date().toISOString(),
        totalTimeSpent: 0,
        preferredPersona: 'ga',
        // Compatibility properties
        totalXP: savedXP,
        completedCases: savedCaseObjects,
        unlockedAchievements: unlockedAchievementObjects,
        streakDays: 0,
        progressPercentage: savedCaseIds.length > 0 ? Math.round((savedCaseIds.length / CLINICAL_CASES.length) * 100) : 0,
        nextLevelXP: 1000
      };

      setGamificationProgress(initialProgress);
      setEarnedXP(savedXP);
      setUnlockedAchievements(savedUnlocked);
      setCompletedCases(savedCaseIds);

      setIsLoading(false);
    };

    loadUserProgress();
  }, []);

  const handleStartSimulator = () => {
    setCurrentState('case_selection');
  };

  const handleSelectCase = (caseData: ClinicalCase) => {
    setSelectedCase(caseData);
    setCurrentState('case_execution');

    // Iniciar CaseSession completa para rastreamento médico
    const sessionId = `session_${Date.now()}_${caseData.id}`;
    const newSession: CaseSession = {
      id: sessionId,
      caseId: caseData.id,
      startTime: new Date(),
      currentStep: 0,
      status: 'in_progress',
      stepResults: [],
      totalScore: 0,
      timeSpent: 0,
      strengths: [],
      improvementAreas: [],
      recommendations: []
    };

    setCurrentSession(newSession);
  };

  const handleBackToIntroduction = () => {
    setCurrentState('introduction');
    setSelectedCase(null);
  };

  const handleBackToCaseSelection = () => {
    setCurrentState('case_selection');
    setSelectedCase(null);

    // Finalizar sessão como abandonada se voltar sem completar
    if (currentSession && currentSession.status === 'in_progress') {
      const abandonedSession: CaseSession = {
        ...currentSession,
        endTime: new Date(),
        status: 'abandoned',
        timeSpent: (new Date().getTime() - currentSession.startTime.getTime()) / (1000 * 60), // minutos
      };

      setSessionHistory(prev => [...prev, abandonedSession]);
      setCurrentSession(null);
    }
  };

  const handleViewSessionHistory = () => {
    setCurrentState('session_history');
  };

  const handleBackFromHistory = () => {
    setCurrentState('case_selection');
  };

  // Handle completion from CaseExecution component
  const handleInteractiveCaseCompletion = (result: CompletedCase) => {
    const completedCase = CLINICAL_CASES.find(c => c.id === result.caseId);

    // Atualizar lista de casos completados
    const isFirstCompletion = !completedCases.includes(result.caseId);
    if (isFirstCompletion) {
      setCompletedCases(prev => [...prev, result.caseId]);
    }

    // Calcular XP usando dados reais do resultado
    const xpReward = result.xpEarned;
    setEarnedXP(prev => prev + xpReward);

    // Verificar conquistas reais baseadas no progresso acumulado
    const newCompletedCount = completedCases.length + (isFirstCompletion ? 1 : 0);
    const newAchievementIds: string[] = [];

    if (newCompletedCount === 1 && !unlockedAchievements.includes('first_case_completed')) {
      newAchievementIds.push('first_case_completed');
    }
    if (completedCase?.category === 'pediatrico' && newCompletedCount >= 3 && !unlockedAchievements.includes('pediatric_specialist')) {
      newAchievementIds.push('pediatric_specialist');
    }
    if (newCompletedCount >= 5 && !unlockedAchievements.includes('speed_clinician')) {
      newAchievementIds.push('speed_clinician');
    }

    const updatedUnlockedIds = [...unlockedAchievements, ...newAchievementIds];
    setUnlockedAchievements(updatedUnlockedIds);

    // Finalizar CaseSession com dados reais do resultado
    if (currentSession) {
      const timeSpentMinutes = (new Date().getTime() - currentSession.startTime.getTime()) / (1000 * 60);

      const completedSession: CaseSession = {
        ...currentSession,
        endTime: new Date(),
        status: 'completed',
        stepResults: [], // CaseExecution retorna resumo agregado, sem detalhes individuais por passo
        totalScore: result.score,
        timeSpent: timeSpentMinutes,
        strengths: result.diagnosticAccuracy > 80
          ? ['Diagnostico preciso', 'Conhecimento farmacologico']
          : ['Dedicacao ao aprendizado'],
        improvementAreas: result.diagnosticAccuracy < 70
          ? ['Diagnostico diferencial', 'Farmacoterapia']
          : [],
        recommendations: [
          'Continue praticando casos similares',
          'Revise protocolos de hanseniase',
          'Aprofunde conhecimento em PQT-U'
        ]
      };

      setSessionHistory(prev => [...prev, completedSession]);
      setCurrentSession(null);
    }

    // Atualizar progresso de gamificacao com dados reais
    const newXP = earnedXP + xpReward;
    const newLevel = Math.floor(newXP / 1000) + 1;

    // Calcular streak real baseado na ultima atividade salva
    let currentStreak = 1;
    try {
      const stored = localStorage.getItem('gamification_progress');
      if (stored) {
        const parsed = JSON.parse(stored);
        const lastActivity = parsed.lastActivity ? new Date(parsed.lastActivity) : null;
        if (lastActivity) {
          const daysDiff = Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
          currentStreak = daysDiff <= 1 ? (parsed.streakDays || 0) + (daysDiff === 1 ? 1 : 0) : 1;
        }
      }
    } catch { /* localStorage indisponivel */ }

    const realUnlockedAchievements = DEFAULT_ACHIEVEMENTS.filter(a =>
      updatedUnlockedIds.includes(a.id)
    );

    setGamificationProgress(prev => prev ? ({
      ...prev,
      totalXP: newXP,
      currentLevel: newLevel < 2 ? 'estudante' : newLevel < 3 ? 'profissional' : 'especialista' as UserLevel,
      completedCases: [...prev.completedCases, result],
      unlockedAchievements: realUnlockedAchievements,
      streakDays: currentStreak,
      totalTimeSpent: prev.totalTimeSpent + result.timeSpent,
      nextLevelXP: (newLevel * 1000),
      progressPercentage: ((newXP % 1000) / 1000) * 100
    }) : null);

    // Persistir progresso no localStorage
    try {
      localStorage.setItem('gamification_progress', JSON.stringify({
        completedCases: [...completedCases, ...(isFirstCompletion ? [result.caseId] : [])],
        totalXP: newXP,
        unlockedAchievements: updatedUnlockedIds,
        streakDays: currentStreak,
        lastActivity: new Date().toISOString()
      }));
    } catch { /* localStorage indisponivel */ }

    // Voltar para selecao de casos
    setCurrentState('case_selection');
    setSelectedCase(null);
  };

  if (isLoading) {
    return (
      <EducationalLayout>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          textAlign: 'center'
        }}>
          <RefreshIcon size={48} color={unbColors.primary} />
          <h2 style={{ marginTop: '1rem', color: unbColors.primary }}>
            Carregando Simulador Clínico...
          </h2>
          <p style={{ color: '#64748b', maxWidth: '400px', marginTop: '0.5rem' }}>
            Preparando casos clínicos baseados em protocolos reais de hanseníase
          </p>
        </div>
      </EducationalLayout>
    );
  }

  return (
    <EducationalLayout>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        {/* Header Global */}
        <header style={{
          textAlign: 'center',
          marginBottom: '2rem',
          padding: '2rem',
          background: `linear-gradient(135deg, ${unbColors.primary} 0%, ${unbColors.secondary} 100%)`,
          borderRadius: '16px',
          color: 'white'
        }}>
          <h1 style={{
            margin: 0,
            fontSize: '2.5rem',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}>
            <MicroscopeIcon size={40} color="white" /> Simulador Clínico
          </h1>
          <p style={{ margin: '1rem 0 0', fontSize: '1.2rem', opacity: 0.9 }}>
            Casos clínicos reais baseados na tese de doutorado
          </p>
        </header>

        {/* Breadcrumb de Navegação */}
        <nav style={{
          marginBottom: '2rem',
          padding: '1rem',
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => setCurrentState('introduction')}
              style={{
                background: currentState === 'introduction' ? unbColors.primary : 'transparent',
                color: currentState === 'introduction' ? 'white' : unbColors.primary,
                border: `1px solid ${unbColors.primary}`,
                borderRadius: '6px',
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              <BookIcon size={16} color="currentColor" />
              Introdução
            </button>

            <span style={{ color: '#64748b' }}>→</span>

            <button
              onClick={() => setCurrentState('case_selection')}
              disabled={currentState === 'introduction'}
              style={{
                background: currentState === 'case_selection' ? unbColors.primary : 'transparent',
                color: currentState === 'case_selection' ? 'white' : currentState === 'introduction' ? '#9ca3af' : unbColors.primary,
                border: `1px solid ${currentState === 'introduction' ? '#9ca3af' : unbColors.primary}`,
                borderRadius: '6px',
                padding: '0.5rem 1rem',
                fontSize: '0.875rem',
                cursor: currentState === 'introduction' ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}
            >
              <TargetIcon size={16} color="currentColor" />
              Seleção de Casos
            </button>

            {selectedCase && (
              <>
                <span style={{ color: '#64748b' }}>→</span>
                <div style={{
                  background: currentState === 'case_execution' ? unbColors.primary : '#f3f4f6',
                  color: currentState === 'case_execution' ? 'white' : '#64748b',
                  border: `1px solid ${currentState === 'case_execution' ? unbColors.primary : '#d1d5db'}`,
                  borderRadius: '6px',
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem'
                }}>
                  <CheckCircleIcon size={16} color="currentColor" />
                  {selectedCase.title}
                </div>
              </>
            )}
          </div>
        </nav>

        {/* Sistema de Gamificação Completo - gamificationProgress ativado */}
        {(currentSession || gamificationProgress) && (
          <div style={{
            background: currentSession
              ? 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)'
              : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            padding: '1rem',
            borderRadius: '12px',
            color: 'white',
            marginBottom: '2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ flex: 1 }}>
              {currentSession ? (
                <>
                  <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                    🔄 Sessão Clínica Ativa
                  </div>
                  <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                    Caso: {selectedCase?.title} • Iniciado em {currentSession.startTime.toLocaleTimeString('pt-BR')}
                  </div>
                </>
              ) : gamificationProgress && (
                <>
                  <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                    🎮 Nível {gamificationProgress.currentLevel} • {gamificationProgress.totalXP} XP Total
                  </div>
                  <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                    {gamificationProgress.completedCases.length} casos completados • {gamificationProgress.unlockedAchievements.length} conquistas • {gamificationProgress.streakDays} dias consecutivos
                  </div>

                  {/* Barra de progresso para próximo nível */}
                  <div style={{
                    marginTop: '0.5rem',
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    height: '6px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      background: 'rgba(255,255,255,0.8)',
                      height: '100%',
                      width: `${Math.min(gamificationProgress.progressPercentage, 100)}%`,
                      borderRadius: '8px',
                      transition: 'width 0.5s ease'
                    }} />
                  </div>

                  <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '0.25rem' }}>
                    {Math.floor((gamificationProgress.nextLevelXP - gamificationProgress.totalXP) / 10) * 10} XP até o próximo nível
                  </div>
                </>
              )}
            </div>

            {/* Conquistas recentes */}
            {gamificationProgress && gamificationProgress.unlockedAchievements.length > 0 && !currentSession && (
              <div style={{
                display: 'flex',
                gap: '0.5rem',
                marginLeft: '1rem'
              }}>
                {gamificationProgress.unlockedAchievements.slice(0, 3).map((achievement: Achievement, index: number) => (
                  <div
                    key={achievement.id}
                    style={{
                      background: 'rgba(255,255,255,0.2)',
                      borderRadius: '50%',
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      border: '2px solid rgba(255,255,255,0.3)'
                    }}
                    title={`Conquista: ${achievement.title}`}
                  >
                    {index === 0 ? '🏆' : index === 1 ? '⭐' : '🎯'}
                  </div>
                ))}
              </div>
            )}

            {/* Ações de navegação */}
            <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
              <Link
                href="/dashboard"
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  color: 'white',
                  fontSize: '0.875rem'
                }}
              >
                📊 Dashboard
              </Link>
              <Link
                href="/certificacao"
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  color: 'white',
                  fontSize: '0.875rem'
                }}
              >
                🎓 Certificação
              </Link>
              <button
                onClick={handleViewSessionHistory}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  padding: '0.5rem 1rem',
                  borderRadius: '6px',
                  border: 'none',
                  color: 'white',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                📋 Histórico ({sessionHistory.length})
              </button>
            </div>
          </div>
        )}

        {/* Conteúdo Dinâmico */}
        {currentState === 'introduction' && (
          <SimulatorIntroduction
            onStart={handleStartSimulator}
            userType="anonymous"
          />
        )}

        {currentState === 'case_selection' && (
          <CaseSelector
            cases={CLINICAL_CASES}
            onSelectCase={handleSelectCase}
            onBack={handleBackToIntroduction}
            userType="anonymous"
            completedCases={completedCases}
          />
        )}

        {currentState === 'case_execution' && selectedCase && (
          <CaseExecution
            case={selectedCase}
            onComplete={handleInteractiveCaseCompletion}
            onBack={handleBackToCaseSelection}
            userLevel={userLevel}
          />
        )}

        {currentState === 'session_history' && (
          <div style={{ padding: '2rem' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '2rem'
            }}>
              <h2 style={{
                color: unbColors.primary,
                fontSize: '1.5rem',
                margin: 0
              }}>
                📋 Histórico de Sessões Clínicas
              </h2>
              <button
                onClick={handleBackFromHistory}
                style={{
                  background: unbColors.primary,
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                ← Voltar
              </button>
            </div>

            {sessionHistory.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem',
                background: '#f8fafc',
                borderRadius: '12px',
                border: '2px dashed #e2e8f0'
              }}>
                <div style={{ marginBottom: '1rem' }}>
                  <BookIcon size={48} color="#94a3b8" />
                </div>
                <h3 style={{ color: '#64748b', margin: '0 0 0.5rem' }}>
                  Nenhuma sessão registrada
                </h3>
                <p style={{ color: '#94a3b8', margin: 0 }}>
                  Complete casos clínicos para ver seu histórico aqui
                </p>
              </div>
            ) : (
              <div>
                {/* Estatísticas do histórico */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1rem',
                  marginBottom: '2rem'
                }}>
                  <div style={{
                    background: 'white',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '2rem', color: '#22c55e' }}>
                      {sessionHistory.filter(s => s.status === 'completed').length}
                    </div>
                    <div style={{ color: '#64748b', fontSize: '0.9rem' }}>
                      Sessões Completadas
                    </div>
                  </div>
                  <div style={{
                    background: 'white',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '2rem', color: '#f59e0b' }}>
                      {sessionHistory.filter(s => s.status === 'abandoned').length}
                    </div>
                    <div style={{ color: '#64748b', fontSize: '0.9rem' }}>
                      Sessões Abandonadas
                    </div>
                  </div>
                  <div style={{
                    background: 'white',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '2rem', color: unbColors.primary }}>
                      {Math.round(sessionHistory.reduce((acc, s) => acc + (s.timeSpent || 0), 0))}
                    </div>
                    <div style={{ color: '#64748b', fontSize: '0.9rem' }}>
                      Minutos Totais
                    </div>
                  </div>
                </div>

                {/* Lista de sessões */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {sessionHistory.map((session, index) => (
                    <div
                      key={`${session.caseId}-${index}`}
                      style={{
                        background: 'white',
                        padding: '1.5rem',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '1rem'
                      }}>
                        <div>
                          <h4 style={{
                            margin: '0 0 0.5rem',
                            color: unbColors.primary,
                            fontSize: '1.1rem'
                          }}>
                            {CLINICAL_CASES.find(c => c.id === session.caseId)?.title || session.caseId}
                          </h4>
                          <div style={{
                            display: 'flex',
                            gap: '1rem',
                            fontSize: '0.85rem',
                            color: '#64748b'
                          }}>
                            <span>📅 {session.startTime.toLocaleDateString()}</span>
                            <span>⏱️ {Math.round(session.timeSpent || 0)} min</span>
                            {session.totalScore && (
                              <span>🎯 {session.totalScore}%</span>
                            )}
                          </div>
                        </div>
                        <div style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '20px',
                          fontSize: '0.8rem',
                          fontWeight: 'bold',
                          background: session.status === 'completed' ? '#dcfce7' : '#fef3c7',
                          color: session.status === 'completed' ? '#166534' : '#92400e'
                        }}>
                          {session.status === 'completed' ? '✅ Completada' : '⏸️ Abandonada'}
                        </div>
                      </div>

                      {session.status === 'completed' && (
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                          gap: '1rem',
                          marginTop: '1rem'
                        }}>
                          {session.strengths && session.strengths.length > 0 && (
                            <div>
                              <h5 style={{
                                margin: '0 0 0.5rem',
                                color: '#22c55e',
                                fontSize: '0.9rem'
                              }}>
                                💪 Pontos Fortes
                              </h5>
                              <ul style={{
                                margin: 0,
                                paddingLeft: '1rem',
                                fontSize: '0.85rem',
                                color: '#64748b'
                              }}>
                                {session.strengths.map((strength, idx) => (
                                  <li key={idx}>{strength}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {session.improvementAreas && session.improvementAreas.length > 0 && (
                            <div>
                              <h5 style={{
                                margin: '0 0 0.5rem',
                                color: '#f59e0b',
                                fontSize: '0.9rem'
                              }}>
                                🎯 Áreas de Melhoria
                              </h5>
                              <ul style={{
                                margin: 0,
                                paddingLeft: '1rem',
                                fontSize: '0.85rem',
                                color: '#64748b'
                              }}>
                                {session.improvementAreas.map((area, idx) => (
                                  <li key={idx}>{area}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </EducationalLayout>
  );
}