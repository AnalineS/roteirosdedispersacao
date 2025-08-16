/**
 * ProgressRing - Componente para exibir progresso circular
 * Sistema híbrido: progresso percentual + marcos qualitativos
 * Design adaptado para níveis e personas
 */

'use client';

import React from 'react';
import type { ExperiencePoints } from '@/types/gamification';
import { LEVEL_REQUIREMENTS, BADGE_COLORS } from '@/types/gamification';
import { UserLevel } from '@/types/disclosure';

interface ProgressRingProps {
  experiencePoints: ExperiencePoints;
  userLevel: UserLevel;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  showXP?: boolean;
  showNextLevel?: boolean;
  variant?: 'minimal' | 'detailed' | 'dashboard';
  className?: string;
}

interface ProgressRingConfig {
  size: number;
  strokeWidth: number;
  fontSize: string;
  labelSize: string;
  xpSize: string;
}

export default function ProgressRing({
  experiencePoints,
  userLevel,
  size = 'md',
  showLabel = true,
  showXP = true,
  showNextLevel = true,
  variant = 'detailed',
  className = ''
}: ProgressRingProps) {

  // ============================================================================
  // SIZE CONFIGURATIONS
  // ============================================================================
  
  const sizeConfigs: Record<string, ProgressRingConfig> = {
    sm: {
      size: 60,
      strokeWidth: 4,
      fontSize: 'text-xs',
      labelSize: 'text-xs',
      xpSize: 'text-xs'
    },
    md: {
      size: 80,
      strokeWidth: 6,
      fontSize: 'text-sm',
      labelSize: 'text-sm',
      xpSize: 'text-xs'
    },
    lg: {
      size: 120,
      strokeWidth: 8,
      fontSize: 'text-base',
      labelSize: 'text-base',
      xpSize: 'text-sm'
    },
    xl: {
      size: 160,
      strokeWidth: 10,
      fontSize: 'text-lg',
      labelSize: 'text-lg',
      xpSize: 'text-base'
    }
  };

  const config = sizeConfigs[size];
  
  // ============================================================================
  // LEVEL COLOR MAPPING
  // ============================================================================
  
  const getLevelColor = (level: UserLevel) => {
    switch (level) {
      case 'paciente':
        return BADGE_COLORS.paciente_green;
      case 'estudante':
        return BADGE_COLORS.estudante_blue;
      case 'profissional':
        return BADGE_COLORS.profissional_purple;
      case 'especialista':
        return BADGE_COLORS.especialista_gold;
      default:
        return BADGE_COLORS.paciente_green;
    }
  };

  const levelColor = getLevelColor(userLevel);
  
  // ============================================================================
  // PROGRESS CALCULATION
  // ============================================================================
  
  const currentLevelXP = LEVEL_REQUIREMENTS[experiencePoints.level] || 0;
  const nextLevelXP = experiencePoints.nextLevelXP;
  const progressInLevel = experiencePoints.total - currentLevelXP;
  const xpNeededForNext = nextLevelXP - currentLevelXP;
  
  // Percentual de progresso no nível atual (0-100)
  const progressPercentage = xpNeededForNext > 0 
    ? Math.min(100, (progressInLevel / xpNeededForNext) * 100)
    : 100;
  
  // ============================================================================
  // SVG CIRCLE CALCULATIONS
  // ============================================================================
  
  const radius = (config.size - config.strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;
  
  // ============================================================================
  // QUALITATIVE MILESTONES
  // ============================================================================
  
  const getProgressMilestone = (percentage: number): string => {
    if (percentage >= 90) return '🎯 Quase lá!';
    if (percentage >= 75) return '🚀 Acelerando!';
    if (percentage >= 50) return '💪 Meio caminho!';
    if (percentage >= 25) return '🌱 Progredindo!';
    if (percentage > 0) return '✨ Começando!';
    return '🎯 Vamos começar!';
  };

  const milestone = getProgressMilestone(progressPercentage);
  
  // ============================================================================
  // VARIANT RENDERERS
  // ============================================================================

  if (variant === 'minimal') {
    return (
      <div className={`inline-flex items-center space-x-2 ${className}`}>
        <div className="relative" style={{ width: config.size, height: config.size }}>
          <svg
            width={config.size}
            height={config.size}
            className="transform -rotate-90"
          >
            {/* Background circle */}
            <circle
              cx={config.size / 2}
              cy={config.size / 2}
              r={radius}
              stroke="#e5e7eb"
              strokeWidth={config.strokeWidth}
              fill="transparent"
            />
            
            {/* Progress circle */}
            <circle
              cx={config.size / 2}
              cy={config.size / 2}
              r={radius}
              stroke={levelColor}
              strokeWidth={config.strokeWidth}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-500 ease-out"
            />
          </svg>
          
          {/* Center content */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`font-bold ${config.fontSize}`} style={{ color: levelColor }}>
              {experiencePoints.level}
            </span>
          </div>
        </div>
        
        {showXP && (
          <div className={`${config.xpSize} text-gray-600`}>
            {experiencePoints.total.toLocaleString()} XP
          </div>
        )}
      </div>
    );
  }

  if (variant === 'dashboard') {
    return (
      <div className={`bg-white rounded-xl p-6 shadow-lg ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Progresso</h3>
          <span 
            className="px-3 py-1 rounded-full text-sm font-medium text-white"
            style={{ backgroundColor: levelColor }}
          >
            Nível {experiencePoints.level}
          </span>
        </div>
        
        <div className="flex items-center space-x-6">
          {/* Progress Ring */}
          <div className="relative" style={{ width: config.size, height: config.size }}>
            <svg
              width={config.size}
              height={config.size}
              className="transform -rotate-90"
            >
              {/* Background circle */}
              <circle
                cx={config.size / 2}
                cy={config.size / 2}
                r={radius}
                stroke="#f3f4f6"
                strokeWidth={config.strokeWidth}
                fill="transparent"
              />
              
              {/* Progress circle */}
              <circle
                cx={config.size / 2}
                cy={config.size / 2}
                r={radius}
                stroke={levelColor}
                strokeWidth={config.strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-1000 ease-out"
                style={{
                  filter: `drop-shadow(0 0 6px ${levelColor}40)`
                }}
              />
            </svg>
            
            {/* Center percentage */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className={`font-bold ${config.fontSize}`} style={{ color: levelColor }}>
                  {Math.round(progressPercentage)}%
                </div>
                <div className="text-xs text-gray-500">
                  Nível {experiencePoints.level + 1}
                </div>
              </div>
            </div>
          </div>
          
          {/* Progress details */}
          <div className="flex-1">
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className={`font-medium ${config.labelSize}`}>XP Total</span>
                  <span className={`${config.labelSize} font-bold`} style={{ color: levelColor }}>
                    {experiencePoints.total.toLocaleString()}
                  </span>
                </div>
                
                {showNextLevel && xpNeededForNext > 0 && (
                  <div className="text-sm text-gray-600">
                    {(nextLevelXP - experiencePoints.total).toLocaleString()} XP para o próximo nível
                  </div>
                )}
              </div>
              
              <div className="text-sm">
                <span className="inline-block bg-gray-100 px-2 py-1 rounded-full">
                  {milestone}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* XP Breakdown */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Fontes de XP</h4>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">Chat:</span>
              <span className="font-medium">{experiencePoints.byCategory.chat_interactions}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Quiz:</span>
              <span className="font-medium">{experiencePoints.byCategory.quiz_completion}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Módulos:</span>
              <span className="font-medium">{experiencePoints.byCategory.module_completion}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Streak:</span>
              <span className="font-medium">{experiencePoints.byCategory.streak_bonus}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // DETAILED VARIANT (default)
  return (
    <div className={`text-center ${className}`}>
      <div className="relative inline-block" style={{ width: config.size, height: config.size }}>
        <svg
          width={config.size}
          height={config.size}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={config.size / 2}
            cy={config.size / 2}
            r={radius}
            stroke="#f3f4f6"
            strokeWidth={config.strokeWidth}
            fill="transparent"
          />
          
          {/* Progress circle */}
          <circle
            cx={config.size / 2}
            cy={config.size / 2}
            r={radius}
            stroke={levelColor}
            strokeWidth={config.strokeWidth}
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
            style={{
              filter: `drop-shadow(0 0 4px ${levelColor}40)`
            }}
          />
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className={`font-bold ${config.fontSize}`} style={{ color: levelColor }}>
              {experiencePoints.level}
            </div>
            <div className="text-xs text-gray-500">
              Nível
            </div>
          </div>
        </div>
      </div>
      
      {showLabel && (
        <div className="mt-3">
          <div className={`font-semibold ${config.labelSize}`}>
            {Math.round(progressPercentage)}% para o nível {experiencePoints.level + 1}
          </div>
          
          {showXP && (
            <div className={`text-gray-600 ${config.xpSize} mt-1`}>
              {experiencePoints.total.toLocaleString()} / {nextLevelXP.toLocaleString()} XP
            </div>
          )}
          
          <div className="text-xs text-gray-500 mt-1">
            {milestone}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MINI PROGRESS BAR COMPONENT
// ============================================================================

interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
  color?: string;
  className?: string;
}

export function ProgressBar({
  current,
  total,
  label,
  color = '#3b82f6',
  className = ''
}: ProgressBarProps) {
  const percentage = total > 0 ? Math.min(100, (current / total) * 100) : 0;
  
  return (
    <div className={`${className}`}>
      {label && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">{label}</span>
          <span className="text-sm text-gray-600">
            {current.toLocaleString()} / {total.toLocaleString()}
          </span>
        </div>
      )}
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="h-2 rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${percentage}%`,
            backgroundColor: color
          }}
        />
      </div>
      
      <div className="text-right">
        <span className="text-xs text-gray-500">
          {Math.round(percentage)}%
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// LEVEL BADGE COMPONENT
// ============================================================================

interface LevelBadgeProps {
  level: number;
  userLevel: UserLevel;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LevelBadge({
  level,
  userLevel,
  size = 'md',
  className = ''
}: LevelBadgeProps) {
  const levelColor = (() => {
    switch (userLevel) {
      case 'paciente':
        return BADGE_COLORS.paciente_green;
      case 'estudante':
        return BADGE_COLORS.estudante_blue;
      case 'profissional':
        return BADGE_COLORS.profissional_purple;
      case 'especialista':
        return BADGE_COLORS.especialista_gold;
      default:
        return BADGE_COLORS.paciente_green;
    }
  })();

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base'
  };

  return (
    <div
      className={`
        ${sizeClasses[size]} rounded-full 
        flex items-center justify-center 
        font-bold text-white
        ${className}
      `}
      style={{ backgroundColor: levelColor }}
    >
      {level}
    </div>
  );
}