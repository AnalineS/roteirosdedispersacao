'use client';

import { ReactNode } from 'react';
import ProgressIndicator from './ProgressIndicator';
import ModuleProgress from './ModuleProgress';
import GlobalProgress from './GlobalProgress';

export interface ProgressData {
  moduleId: string;
  moduleName: string;
  totalSteps: number;
  completedSteps: number;
  currentStep?: number;
  estimatedTime?: string;
  completionRate: number;
  status: 'not-started' | 'in-progress' | 'completed';
  category: 'learning' | 'interaction' | 'progress' | 'tools';
}

export interface UserProgressData {
  totalModules: number;
  completedModules: number;
  overallCompletionRate: number;
  currentStreak: number;
  totalTimeSpent: string;
  achievements: Achievement[];
  modules: ProgressData[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
  category: 'learning' | 'engagement' | 'mastery' | 'time';
}

interface ProgressSystemProps {
  type: 'indicator' | 'module' | 'global';
  data: ProgressData | UserProgressData;
  size?: 'small' | 'medium' | 'large';
  showDetails?: boolean;
  interactive?: boolean;
  children?: ReactNode;
}

export default function ProgressSystem({ 
  type, 
  data, 
  size = 'medium', 
  showDetails = true,
  interactive = false,
  children 
}: ProgressSystemProps) {
  switch (type) {
    case 'indicator':
      return (
        <ProgressIndicator 
          progress={data as ProgressData} 
          size={size}
          showDetails={showDetails}
          interactive={interactive}
        />
      );
      
    case 'module':
      return (
        <ModuleProgress 
          progress={data as ProgressData}
          size={size}
          showDetails={showDetails}
        />
      );
      
    case 'global':
      return (
        <GlobalProgress 
          userData={data as UserProgressData}
          size={size}
          showDetails={showDetails}
        />
      );
      
    default:
      return (
        <div style={{ 
          padding: '20px', 
          background: '#fff3cd', 
          borderRadius: '8px',
          color: '#856404' 
        }}>
          ⚠️ Tipo de progresso não reconhecido: {type}
        </div>
      );
  }
}

/** Default empty progress - honest zeros instead of fake data */
const EMPTY_USER_PROGRESS: UserProgressData = {
  totalModules: 6,
  completedModules: 0,
  overallCompletionRate: 0,
  currentStreak: 0,
  totalTimeSpent: '0min',
  achievements: [],
  modules: [
    { moduleId: 'hanseniase-intro', moduleName: 'Introducao a Hanseniase', totalSteps: 4, completedSteps: 0, estimatedTime: '10 min', completionRate: 0, status: 'not-started', category: 'learning' },
    { moduleId: 'diagnostico', moduleName: 'Diagnostico', totalSteps: 5, completedSteps: 0, estimatedTime: '15 min', completionRate: 0, status: 'not-started', category: 'learning' },
    { moduleId: 'tratamento', moduleName: 'Tratamento PQT-U', totalSteps: 6, completedSteps: 0, estimatedTime: '20 min', completionRate: 0, status: 'not-started', category: 'learning' },
  ],
};

/**
 * Hook para gerenciar dados de progresso.
 * Lê do localStorage (cache do gamificationAPI) para manter sincronia.
 */
export function useProgressData(): UserProgressData {
  if (typeof window === 'undefined') {
    return EMPTY_USER_PROGRESS;
  }

  try {
    const cached = localStorage.getItem('gamification_progress');
    if (!cached) return EMPTY_USER_PROGRESS;

    const parsed = JSON.parse(cached);
    const totalTime = typeof parsed.totalTimeSpent === 'number' ? parsed.totalTimeSpent : 0;
    const hours = Math.floor(totalTime / 60);
    const mins = totalTime % 60;
    const timeStr = hours > 0 ? `${hours}h ${mins}min` : `${mins}min`;

    const completedCount = Array.isArray(parsed.completedCases) ? parsed.completedCases.length : 0;
    const rate = EMPTY_USER_PROGRESS.totalModules > 0
      ? Math.round((completedCount / EMPTY_USER_PROGRESS.totalModules) * 100)
      : 0;

    return {
      ...EMPTY_USER_PROGRESS,
      completedModules: completedCount,
      overallCompletionRate: rate,
      currentStreak: parsed.streakDays ?? 0,
      totalTimeSpent: timeStr,
    };
  } catch {
    return EMPTY_USER_PROGRESS;
  }
}

