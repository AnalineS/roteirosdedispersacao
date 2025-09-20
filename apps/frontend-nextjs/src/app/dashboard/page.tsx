'use client';

import { useState, useEffect } from 'react';
import EducationalLayout from '@/components/layout/EducationalLayout';
import { usePersonas } from '@/hooks/usePersonas';
import EducationalDashboard from '@/components/educational/EducationalDashboard';
import ProgressDashboard from '@/components/gamification/ProgressDashboard';
import GamificationWidget from '@/components/gamification/GamificationWidget';

export default function DashboardPage() {
  const { personas, loading: personasLoading } = usePersonas();
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);

  // Carregar persona selecionada
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('selectedPersona');
      if (stored && personas[stored]) {
        setSelectedPersona(stored);
      }
    }
  }, [personas]);

  const currentPersona = selectedPersona ? personas[selectedPersona] : null;

  if (personasLoading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center' 
      }}>
        <div>Carregando dashboard educacional...</div>
      </div>
    );
  }

  return (
    <EducationalLayout currentPersona={currentPersona?.name}>
      {/* Gamification Overview */}
      <div style={{ marginBottom: '2rem' }}>
        <GamificationWidget
          compact={false}
          className="max-w-6xl mx-auto"
          showDetailedProgress={true}
        />
      </div>

      {/* Progress Dashboard */}
      <div style={{ marginBottom: '2rem' }}>
        <ProgressDashboard
          userId="user-session-id" // ID único do usuário real, não da persona IA
          showAchievements={true}
          showLeaderboard={true}
        />
      </div>

      {/* Educational Dashboard */}
      <EducationalDashboard currentPersona={currentPersona?.name} />
    </EducationalLayout>
  );
}