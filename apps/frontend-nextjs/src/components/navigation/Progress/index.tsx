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

// Hook para gerenciar dados de progresso
export function useProgressData(): UserProgressData {
  // Dados mockados - em produção, viria de uma API/localStorage
  return {
    totalModules: 10,
    completedModules: 4,
    overallCompletionRate: 40,
    currentStreak: 3,
    totalTimeSpent: '2h 30min',
    achievements: [
      {
        id: 'first-module',
        name: 'Primeiro Passo',
        description: 'Complete seu primeiro módulo',
        icon: '🎯',
        unlockedAt: new Date('2025-08-01'),
        category: 'learning'
      },
      {
        id: 'streak-3',
        name: 'Consistente',
        description: '3 dias consecutivos estudando',
        icon: '🔥',
        unlockedAt: new Date('2025-08-03'),
        category: 'engagement'
      }
    ],
    modules: [
      {
        moduleId: 'hanseniase-intro',
        moduleName: 'Introdução à Hanseníase',
        totalSteps: 4,
        completedSteps: 4,
        estimatedTime: '10 min',
        completionRate: 100,
        status: 'completed',
        category: 'learning'
      },
      {
        moduleId: 'diagnostico',
        moduleName: 'Diagnóstico',
        totalSteps: 5,
        completedSteps: 3,
        currentStep: 4,
        estimatedTime: '15 min',
        completionRate: 60,
        status: 'in-progress',
        category: 'learning'
      },
      {
        moduleId: 'tratamento',
        moduleName: 'Tratamento PQT-U',
        totalSteps: 6,
        completedSteps: 0,
        estimatedTime: '20 min',
        completionRate: 0,
        status: 'not-started',
        category: 'learning'
      }
    ]
  };
}

