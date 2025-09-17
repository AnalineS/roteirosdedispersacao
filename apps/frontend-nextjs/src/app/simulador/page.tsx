'use client';

import { useState, useEffect } from 'react';
import EducationalLayout from '@/components/layout/EducationalLayout';
import SimulatorIntroduction from '@/components/interactive/ClinicalSimulator/SimulatorIntroduction';
import CaseSelector from '@/components/interactive/ClinicalSimulator/CaseSelector';
import CaseExecution from '@/components/interactive/ClinicalSimulator/CaseExecution';
import { CLINICAL_CASES } from '@/data/clinicalCases';
import { ClinicalCase, CaseSession } from '@/types/clinicalCases';
import { getUnbColors } from '@/config/modernTheme';
import { CompletedCase } from '@/types/gamification';
import { LearningProgress, DEFAULT_ACHIEVEMENTS, XP_RATES } from '@/types/gamification';
import Link from 'next/link';
import {
  MicroscopeIcon,
  RefreshIcon,
  TargetIcon,
  CheckCircleIcon,
  BookIcon
} from '@/components/icons/EducationalIcons';

type SimulatorState = 'introduction' | 'case_selection' | 'case_execution' | 'case_results';

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

  // Simular carregamento de casos completados
  useEffect(() => {
    const loadUserProgress = async () => {
      setIsLoading(true);

      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock: casos completados pelo usuário
      const mockCompletedCases = ['caso_001_pediatrico_basico']; // Ana Júlia Santos já completado
      setCompletedCases(mockCompletedCases);

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
  };

  const handleBackToIntroduction = () => {
    setCurrentState('introduction');
    setSelectedCase(null);
  };

  const handleBackToCaseSelection = () => {
    setCurrentState('case_selection');
    setSelectedCase(null);
  };

  // Simulate case completion with XP and achievement tracking
  const handleCaseCompletion = (caseData: ClinicalCase) => {
    // Calculate XP based on case difficulty
    let xpReward = 0;
    switch (caseData.difficulty) {
      case 'básico':
        xpReward = XP_RATES.CASE_COMPLETION_BASIC;
        break;
      case 'intermediário':
        xpReward = XP_RATES.CASE_COMPLETION_INTERMEDIATE;
        break;
      case 'avançado':
        xpReward = XP_RATES.CASE_COMPLETION_ADVANCED;
        break;
      case 'complexo':
        xpReward = XP_RATES.CASE_COMPLETION_COMPLEX;
        break;
    }

    // Add bonus for first completion
    const isFirstCompletion = !completedCases.includes(caseData.id);
    if (isFirstCompletion) {
      xpReward += XP_RATES.CASE_ACCURACY_BONUS;
    }

    // Update completed cases
    setCompletedCases(prev => {
      if (!prev.includes(caseData.id)) {
        return [...prev, caseData.id];
      }
      return prev;
    });

    // Award XP
    setEarnedXP(prev => prev + xpReward);

    // Check for achievement unlocking
    const newCompletedCount = completedCases.length + (isFirstCompletion ? 1 : 0);
    const newAchievements: string[] = [];

    // First case achievement
    if (newCompletedCount === 1 && !unlockedAchievements.includes('first_case_completed')) {
      newAchievements.push('first_case_completed');
    }

    // Pediatric specialist achievement
    if (caseData.category === 'pediatrico' && newCompletedCount >= 3 && !unlockedAchievements.includes('pediatric_specialist')) {
      newAchievements.push('pediatric_specialist');
    }

    // Speed clinician achievement (simulated)
    if (newCompletedCount >= 3 && !unlockedAchievements.includes('speed_clinician')) {
      newAchievements.push('speed_clinician');
    }

    setUnlockedAchievements(prev => [...prev, ...newAchievements]);

    // Show completion notification
    alert(`🎉 Caso completado!\n\n+${xpReward} XP\n${newAchievements.length > 0 ? `\n🏆 Conquistas desbloqueadas: ${newAchievements.length}` : ''}\n\nProgresso salvo para certificação!`);
  };

  // Handle completion from CaseExecution component
  const handleInteractiveCaseCompletion = (result: CompletedCase) => {
    // Add to completed cases
    setCompletedCases(prev => {
      if (!prev.includes(result.caseId)) {
        return [...prev, result.caseId];
      }
      return prev;
    });

    // Award XP
    setEarnedXP(prev => prev + result.xpEarned);

    // Check for achievements
    const newCompletedCount = completedCases.length + 1;
    const newAchievements: string[] = [];

    if (newCompletedCount === 1 && !unlockedAchievements.includes('first_case_completed')) {
      newAchievements.push('first_case_completed');
    }

    if (result.category === 'pediatrico' && newCompletedCount >= 3 && !unlockedAchievements.includes('pediatric_specialist')) {
      newAchievements.push('pediatric_specialist');
    }

    if (result.diagnosticAccuracy >= 90 && newCompletedCount >= 5 && !unlockedAchievements.includes('diagnostic_accuracy_master')) {
      newAchievements.push('diagnostic_accuracy_master');
    }

    setUnlockedAchievements(prev => [...prev, ...newAchievements]);

    // Show success notification
    alert(`🎉 Caso "${result.title}" completado com sucesso!\n\n📊 Precisão diagnóstica: ${result.diagnosticAccuracy.toFixed(1)}%\n⚡ XP ganho: ${result.xpEarned}\n⏱️ Tempo: ${result.timeSpent.toFixed(1)} minutos\n${newAchievements.length > 0 ? `🏆 Novas conquistas: ${newAchievements.length}` : ''}\n\n✅ Progresso salvo para certificação!`);

    // Return to case selection
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

        {/* Gamification Progress Bar */}
        {(earnedXP > 0 || unlockedAchievements.length > 0) && (
          <div style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            padding: '1rem',
            borderRadius: '12px',
            color: 'white',
            marginBottom: '2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                ⚡ {earnedXP} XP Ganhos na Sessão
              </div>
              <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                {completedCases.length} casos completados • {unlockedAchievements.length} conquistas desbloqueadas
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
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
      </div>
    </EducationalLayout>
  );
}