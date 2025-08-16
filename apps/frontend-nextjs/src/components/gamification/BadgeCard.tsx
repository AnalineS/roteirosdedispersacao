/**
 * BadgeCard - Componente para exibir conquistas/achievements
 * Design com cores específicas por nível e visuais das personas
 * Sistema híbrido com animações para celebrações visuais
 */

'use client';

import React from 'react';
import type { Achievement, BadgeColor } from '@/types/gamification';
import { BADGE_COLORS } from '@/types/gamification';

interface BadgeCardProps {
  achievement: Achievement;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'card' | 'mini' | 'celebration';
  showDescription?: boolean;
  showXP?: boolean;
  isNewlyUnlocked?: boolean;
  onClick?: () => void;
  className?: string;
}

interface BadgeStyle {
  background: string;
  border: string;
  iconColor: string;
  textColor: string;
  glowColor?: string;
}

export default function BadgeCard({
  achievement,
  size = 'md',
  variant = 'card',
  showDescription = true,
  showXP = true,
  isNewlyUnlocked = false,
  onClick,
  className = ''
}: BadgeCardProps) {
  
  // ============================================================================
  // STYLING BASED ON BADGE COLOR AND PERSONA
  // ============================================================================
  
  const getBadgeStyle = (color: BadgeColor): BadgeStyle => {
    const baseColor = BADGE_COLORS[color];
    
    switch (color) {
      case 'paciente_green':
        return {
          background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
          border: '2px solid #22c55e',
          iconColor: '#ffffff',
          textColor: '#064e3b',
          glowColor: '#22c55e'
        };
      
      case 'estudante_blue':
        return {
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          border: '2px solid #3b82f6',
          iconColor: '#ffffff',
          textColor: '#1e3a8a',
          glowColor: '#3b82f6'
        };
      
      case 'profissional_purple':
        return {
          background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
          border: '2px solid #8b5cf6',
          iconColor: '#ffffff',
          textColor: '#581c87',
          glowColor: '#8b5cf6'
        };
      
      case 'especialista_gold':
        return {
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          border: '2px solid #f59e0b',
          iconColor: '#ffffff',
          textColor: '#92400e',
          glowColor: '#f59e0b'
        };
      
      case 'persona_ga_warm':
        return {
          background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
          border: '2px solid #f97316',
          iconColor: '#ffffff',
          textColor: '#9a3412',
          glowColor: '#f97316'
        };
      
      case 'persona_gasnelio_clinical':
        return {
          background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
          border: '2px solid #0284c7',
          iconColor: '#ffffff',
          textColor: '#0c4a6e',
          glowColor: '#0284c7'
        };
      
      default:
        return {
          background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
          border: '2px solid #6b7280',
          iconColor: '#ffffff',
          textColor: '#374151',
          glowColor: '#6b7280'
        };
    }
  };

  const style = getBadgeStyle(achievement.badgeColor);
  
  // ============================================================================
  // SIZE CONFIGURATIONS
  // ============================================================================
  
  const sizeConfig = {
    sm: {
      container: 'w-16 h-16',
      icon: 'text-lg',
      title: 'text-xs',
      description: 'text-xs',
      xp: 'text-xs'
    },
    md: {
      container: 'w-20 h-20',
      icon: 'text-xl',
      title: 'text-sm',
      description: 'text-xs',
      xp: 'text-sm'
    },
    lg: {
      container: 'w-24 h-24',
      icon: 'text-2xl',
      title: 'text-base',
      description: 'text-sm',
      xp: 'text-base'
    },
    xl: {
      container: 'w-32 h-32',
      icon: 'text-4xl',
      title: 'text-lg',
      description: 'text-base',
      xp: 'text-lg'
    }
  };

  const config = sizeConfig[size];
  
  // ============================================================================
  // RARITY EFFECTS
  // ============================================================================
  
  const getRarityEffect = () => {
    switch (achievement.rarity) {
      case 'legendary':
        return 'animate-pulse drop-shadow-lg';
      case 'epic':
        return 'drop-shadow-md';
      case 'rare':
        return 'drop-shadow-sm';
      case 'common':
      default:
        return '';
    }
  };

  // ============================================================================
  // CELEBRATION ANIMATION
  // ============================================================================
  
  const celebrationClass = isNewlyUnlocked 
    ? 'animate-bounce transform scale-110' 
    : '';

  // ============================================================================
  // VARIANT RENDERERS
  // ============================================================================

  if (variant === 'mini') {
    return (
      <div 
        className={`
          inline-flex items-center justify-center
          ${config.container} rounded-full cursor-pointer
          transition-all duration-200 hover:scale-105
          ${celebrationClass} ${getRarityEffect()} ${className}
        `}
        style={{ 
          background: style.background,
          border: style.border,
          boxShadow: isNewlyUnlocked ? `0 0 20px ${style.glowColor}` : undefined
        }}
        onClick={onClick}
        title={`${achievement.title} - ${achievement.description}`}
      >
        <span 
          className={`${config.icon}`}
          style={{ color: style.iconColor }}
        >
          {achievement.icon}
        </span>
      </div>
    );
  }

  if (variant === 'celebration') {
    return (
      <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 ${className}`}>
        <div className="bg-white rounded-2xl p-8 max-w-md mx-4 text-center animate-fadeInScale">
          <div 
            className={`
              mx-auto mb-4 ${config.container} rounded-full
              flex items-center justify-center
              animate-bounce drop-shadow-xl
            `}
            style={{ 
              background: style.background,
              border: style.border,
              boxShadow: `0 0 30px ${style.glowColor}`
            }}
          >
            <span 
              className={`${config.icon}`}
              style={{ color: style.iconColor }}
            >
              {achievement.icon}
            </span>
          </div>
          
          <h3 className={`font-bold mb-2 ${config.title}`} style={{ color: style.textColor }}>
            🎉 Conquista Desbloqueada!
          </h3>
          
          <h4 className={`font-semibold mb-2 ${config.title}`}>
            {achievement.title}
          </h4>
          
          <p className={`text-gray-600 mb-4 ${config.description}`}>
            {achievement.description}
          </p>
          
          <div className="flex items-center justify-center space-x-4">
            <div className={`font-bold ${config.xp}`} style={{ color: style.textColor }}>
              +{achievement.xpReward} XP
            </div>
            <div className="text-gray-500 text-sm">
              {achievement.rarity.toUpperCase()}
            </div>
          </div>
          
          <button
            onClick={onClick}
            className="mt-6 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Continuar
          </button>
        </div>
      </div>
    );
  }

  // CARD VARIANT (default)
  return (
    <div 
      className={`
        relative overflow-hidden rounded-xl transition-all duration-300
        ${achievement.isUnlocked 
          ? 'hover:scale-105 cursor-pointer shadow-md hover:shadow-lg' 
          : 'opacity-60 grayscale'
        }
        ${celebrationClass} ${getRarityEffect()} ${className}
      `}
      style={{
        background: achievement.isUnlocked ? 'white' : '#f3f4f6',
        border: achievement.isUnlocked ? `2px solid ${BADGE_COLORS[achievement.badgeColor]}` : '2px solid #d1d5db',
        boxShadow: isNewlyUnlocked ? `0 0 20px ${style.glowColor}` : undefined
      }}
      onClick={achievement.isUnlocked ? onClick : undefined}
    >
      {/* Rarity indicator */}
      {achievement.rarity !== 'common' && (
        <div 
          className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold"
          style={{ 
            backgroundColor: style.glowColor,
            color: 'white'
          }}
        >
          {achievement.rarity.toUpperCase()}
        </div>
      )}

      <div className="p-4">
        {/* Badge icon */}
        <div className="flex items-center justify-center mb-3">
          <div 
            className={`
              ${config.container} rounded-full 
              flex items-center justify-center
              ${achievement.isUnlocked ? '' : 'bg-gray-300'}
            `}
            style={{ 
              background: achievement.isUnlocked ? style.background : undefined,
              border: achievement.isUnlocked ? style.border : '2px solid #9ca3af'
            }}
          >
            <span 
              className={`${config.icon}`}
              style={{ 
                color: achievement.isUnlocked ? style.iconColor : '#6b7280'
              }}
            >
              {achievement.icon}
            </span>
          </div>
        </div>

        {/* Achievement info */}
        <div className="text-center">
          <h3 
            className={`font-semibold mb-1 ${config.title}`}
            style={{ 
              color: achievement.isUnlocked ? style.textColor : '#6b7280'
            }}
          >
            {achievement.title}
          </h3>
          
          {showDescription && (
            <p className={`text-gray-600 mb-2 ${config.description}`}>
              {achievement.description}
            </p>
          )}
          
          <div className="flex items-center justify-between">
            {showXP && (
              <div 
                className={`font-bold ${config.xp}`}
                style={{ 
                  color: achievement.isUnlocked ? style.textColor : '#9ca3af'
                }}
              >
                +{achievement.xpReward} XP
              </div>
            )}
            
            {achievement.isUnlocked && achievement.unlockedAt && (
              <div className="text-xs text-gray-500">
                {new Date(achievement.unlockedAt).toLocaleDateString('pt-BR')}
              </div>
            )}
          </div>
        </div>

        {/* Persona indicator */}
        {achievement.relatedPersona && achievement.relatedPersona !== 'both' && (
          <div className="absolute bottom-2 left-2">
            <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
              {achievement.relatedPersona === 'ga' ? '🤗 Gá' : '👨‍⚕️ Dr. Gasnelio'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// BADGE COLLECTION COMPONENT
// ============================================================================

interface BadgeCollectionProps {
  achievements: Achievement[];
  title?: string;
  maxDisplay?: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLocked?: boolean;
  onBadgeClick?: (achievement: Achievement) => void;
  className?: string;
}

export function BadgeCollection({
  achievements,
  title = 'Conquistas',
  maxDisplay,
  size = 'md',
  showLocked = true,
  onBadgeClick,
  className = ''
}: BadgeCollectionProps) {
  const displayAchievements = maxDisplay 
    ? achievements.slice(0, maxDisplay)
    : achievements;

  const filteredAchievements = showLocked 
    ? displayAchievements 
    : displayAchievements.filter(a => a.isUnlocked);

  return (
    <div className={`${className}`}>
      {title && (
        <h3 className="text-lg font-semibold mb-4 text-gray-800">
          {title}
        </h3>
      )}
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {filteredAchievements.map((achievement) => (
          <BadgeCard
            key={achievement.id}
            achievement={achievement}
            size={size}
            onClick={() => onBadgeClick?.(achievement)}
          />
        ))}
      </div>
      
      {maxDisplay && achievements.length > maxDisplay && (
        <div className="text-center mt-4">
          <button className="text-blue-500 hover:text-blue-600 text-sm font-medium">
            Ver todas as {achievements.length} conquistas
          </button>
        </div>
      )}
    </div>
  );
}