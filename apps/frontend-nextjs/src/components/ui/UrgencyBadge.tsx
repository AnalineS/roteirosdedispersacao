/**
 * Componente de Badge de Urgência Médica
 * Sistema visual para indicação de prioridade e urgência em contextos médicos
 */

'use client';

import React from 'react';
import { 
  BadgeProps, 
  URGENCY_CONFIGS, 
  BADGE_SIZES,
  UrgencyLevel
} from '@/types/urgencyBadges';

// Ícones SVG para cada tipo de urgência
const UrgencyIcons = {
  AlertTriangle: ({ size = '14' }: { size?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
      <path d="M12 9v4"/>
      <path d="m12 17 .01 0"/>
    </svg>
  ),
  AlertCircle: ({ size = '14' }: { size?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 8v4"/>
      <path d="m12 16 .01 0"/>
    </svg>
  ),
  Clock: ({ size = '14' }: { size?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12,6 12,12 16,14"/>
    </svg>
  ),
  Check: ({ size = '14' }: { size?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="20,6 9,17 4,12"/>
    </svg>
  ),
  Info: ({ size = '14' }: { size?: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <path d="M12 16v-4"/>
      <path d="m12 8 .01 0"/>
    </svg>
  )
};

export function UrgencyBadge({
  urgency,
  variant = 'filled',
  size = 'md',
  label,
  showIcon = true,
  showPulse,
  onClick,
  className = '',
  tooltip
}: BadgeProps) {
  const config = URGENCY_CONFIGS[urgency];
  const sizeConfig = BADGE_SIZES[size];
  const shouldPulse = showPulse ?? config.pulse;
  const displayLabel = label ?? config.label;

  // Estilos baseados na variante
  const getVariantStyles = () => {
    switch (variant) {
      case 'filled':
        return {
          backgroundColor: config.color.background,
          color: config.color.foreground,
          border: `1px solid ${config.color.border}`
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          color: config.color.background,
          border: `2px solid ${config.color.background}`
        };
      case 'minimal':
        return {
          backgroundColor: `${config.color.background}15`, // 15% opacity
          color: config.color.background,
          border: 'none'
        };
      case 'pulse':
        return {
          backgroundColor: config.color.background,
          color: config.color.foreground,
          border: `1px solid ${config.color.border}`,
          animation: 'pulse 2s infinite'
        };
      default:
        return {};
    }
  };

  const IconComponent = UrgencyIcons[config.icon as keyof typeof UrgencyIcons];

  const badgeStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: showIcon ? '4px' : '0',
    padding: sizeConfig.padding,
    fontSize: sizeConfig.fontSize,
    fontWeight: '600',
    borderRadius: '6px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.025em',
    transition: 'all 0.2s ease',
    cursor: onClick ? 'pointer' : 'default',
    userSelect: 'none' as const,
    whiteSpace: 'nowrap' as const,
    ...getVariantStyles()
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <>
      <span
        className={`urgency-badge urgency-badge--${urgency} urgency-badge--${variant} urgency-badge--${size} ${className}`}
        style={badgeStyle}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={onClick ? 0 : undefined}
        role={onClick ? 'button' : undefined}
        aria-label={tooltip || `${config.description}: ${displayLabel}`}
        title={tooltip || config.description}
      >
        {showIcon && IconComponent && (
          <IconComponent size={sizeConfig.iconSize} />
        )}
        {displayLabel}
      </span>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        .urgency-badge:hover { transform: translateY(-1px); box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15); }
        .urgency-badge:active { transform: translateY(0); }
        .urgency-badge--critical.urgency-badge--filled { box-shadow: 0 0 10px rgba(220, 38, 38, 0.3); }
        @media (prefers-reduced-motion: reduce) { .urgency-badge { animation: none !important; } }
        @media (prefers-contrast: high) { .urgency-badge { border-width: 2px !important; } }
        ${shouldPulse ? '.urgency-badge { animation: pulse 2s infinite; }' : ''}
      `}</style>
    </>
  );
}

// Componente específico para badges de medicação
export function MedicationUrgencyBadge({
  interaction = false,
  contraindication = false,
  monitoring = false,
  dosageAdjustment = false,
  className = ''
}: {
  interaction?: boolean;
  contraindication?: boolean;
  monitoring?: boolean;
  dosageAdjustment?: boolean;
  className?: string;
}) {
  const badges = [];

  if (contraindication) {
    badges.push(
      <UrgencyBadge
        key="contraindication"
        urgency="critical"
        label="CONTRAINDICADO"
        size="sm"
        showPulse
        tooltip="Medicamento contraindicado - não administrar"
      />
    );
  }

  if (interaction) {
    badges.push(
      <UrgencyBadge
        key="interaction"
        urgency="high"
        label="INTERAÇÃO"
        size="sm"
        tooltip="Possível interação medicamentosa - verificar"
      />
    );
  }

  if (dosageAdjustment) {
    badges.push(
      <UrgencyBadge
        key="dosage"
        urgency="medium"
        label="AJUSTE DOSE"
        size="sm"
        tooltip="Ajuste de dosagem necessário"
      />
    );
  }

  if (monitoring) {
    badges.push(
      <UrgencyBadge
        key="monitoring"
        urgency="medium"
        label="MONITORAR"
        size="sm"
        tooltip="Monitoramento clínico necessário"
      />
    );
  }

  if (badges.length === 0) {
    return null;
  }

  return (
    <div className={`medication-badges ${className}`} style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: '4px',
      alignItems: 'center'
    }}>
      {badges}
    </div>
  );
}

// Hook para gerenciar badges de urgência
export function useUrgencyBadges() {
  const createBadge = (urgency: UrgencyLevel, options?: Partial<BadgeProps>) => {
    return {
      urgency,
      ...options,
      config: URGENCY_CONFIGS[urgency]
    };
  };

  const getBadgesByPriority = (urgencies: UrgencyLevel[]) => {
    return urgencies
      .map(urgency => ({ urgency, priority: URGENCY_CONFIGS[urgency].priority }))
      .sort((a, b) => a.priority - b.priority)
      .map(item => item.urgency);
  };

  const getHighestUrgency = (urgencies: UrgencyLevel[]): UrgencyLevel => {
    if (urgencies.length === 0) return 'info';
    return getBadgesByPriority(urgencies)[0];
  };

  return {
    createBadge,
    getBadgesByPriority,
    getHighestUrgency,
    configs: URGENCY_CONFIGS
  };
}

export default UrgencyBadge;