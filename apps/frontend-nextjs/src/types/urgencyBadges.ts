/**
 * Sistema de Badges de Urgência Médica
 * Tipos e interfaces para indicação visual de prioridade médica
 */

export type UrgencyLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type BadgeVariant = 'filled' | 'outline' | 'minimal' | 'pulse';
export type BadgeSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface UrgencyBadgeConfig {
  level: UrgencyLevel;
  label: string;
  description: string;
  color: {
    background: string;
    foreground: string;
    border: string;
  };
  icon: string;
  pulse?: boolean;
  priority: number; // 1 = highest priority
}

export interface BadgeProps {
  urgency: UrgencyLevel;
  variant?: BadgeVariant;
  size?: BadgeSize;
  label?: string;
  showIcon?: boolean;
  showPulse?: boolean;
  onClick?: () => void;
  className?: string;
  tooltip?: string;
}

export interface MedicalContext {
  area: 'emergency' | 'icu' | 'pharmacy' | 'outpatient' | 'general';
  timeConstraint?: number; // minutes
  patientRisk?: 'low' | 'medium' | 'high' | 'critical';
  regulatoryImportance?: boolean;
}

// Configurações de urgência por contexto médico
export const URGENCY_CONFIGS: Record<UrgencyLevel, UrgencyBadgeConfig> = {
  critical: {
    level: 'critical',
    label: 'CRÍTICO',
    description: 'Situação de emergência - ação imediata necessária',
    color: {
      background: '#dc2626', // red-600
      foreground: '#ffffff',
      border: '#b91c1c' // red-700
    },
    icon: 'AlertTriangle',
    pulse: true,
    priority: 1
  },
  high: {
    level: 'high',
    label: 'ALTO',
    description: 'Prioridade alta - atenção urgente requerida',
    color: {
      background: '#ea580c', // orange-600
      foreground: '#ffffff',
      border: '#c2410c' // orange-700
    },
    icon: 'AlertCircle',
    pulse: false,
    priority: 2
  },
  medium: {
    level: 'medium',
    label: 'MÉDIO',
    description: 'Prioridade moderada - ação necessária em breve',
    color: {
      background: '#ca8a04', // yellow-600
      foreground: '#ffffff',
      border: '#a16207' // yellow-700
    },
    icon: 'Clock',
    pulse: false,
    priority: 3
  },
  low: {
    level: 'low',
    label: 'BAIXO',
    description: 'Prioridade baixa - pode ser tratado posteriormente',
    color: {
      background: '#16a34a', // green-600
      foreground: '#ffffff',
      border: '#15803d' // green-700
    },
    icon: 'Check',
    pulse: false,
    priority: 4
  },
  info: {
    level: 'info',
    label: 'INFO',
    description: 'Informativo - sem urgência específica',
    color: {
      background: '#2563eb', // blue-600
      foreground: '#ffffff',
      border: '#1d4ed8' // blue-700
    },
    icon: 'Info',
    pulse: false,
    priority: 5
  }
};

// Mapeamento de contextos médicos para urgência padrão
export const MEDICAL_CONTEXT_URGENCY: Record<string, UrgencyLevel> = {
  'drug_interaction': 'critical',
  'contraindication': 'critical',
  'overdose_risk': 'critical',
  'emergency_dose': 'critical',
  'protocol_violation': 'high',
  'side_effects': 'high',
  'monitoring_required': 'medium',
  'routine_dispensing': 'low',
  'educational_content': 'info',
  'general_information': 'info'
};

// Configurações de tamanhos
export const BADGE_SIZES = {
  xs: {
    padding: '2px 6px',
    fontSize: '0.625rem', // 10px
    height: '18px',
    iconSize: '10px'
  },
  sm: {
    padding: '4px 8px',
    fontSize: '0.75rem', // 12px
    height: '24px',
    iconSize: '12px'
  },
  md: {
    padding: '6px 12px',
    fontSize: '0.875rem', // 14px
    height: '32px',
    iconSize: '14px'
  },
  lg: {
    padding: '8px 16px',
    fontSize: '1rem', // 16px
    height: '40px',
    iconSize: '16px'
  },
  xl: {
    padding: '12px 20px',
    fontSize: '1.125rem', // 18px
    height: '48px',
    iconSize: '18px'
  }
};

// Função para determinar urgência baseada em contexto
export function getUrgencyFromContext(context: MedicalContext): UrgencyLevel {
  if (context.patientRisk === 'critical' || context.area === 'emergency') {
    return 'critical';
  }
  
  if (context.patientRisk === 'high' || context.area === 'icu') {
    return 'high';
  }
  
  if (context.timeConstraint && context.timeConstraint <= 15) {
    return 'high';
  }
  
  if (context.timeConstraint && context.timeConstraint <= 60) {
    return 'medium';
  }
  
  if (context.regulatoryImportance) {
    return 'medium';
  }
  
  return 'low';
}

// Função para determinar urgência por palavra-chave
export function getUrgencyFromKeywords(text: string): UrgencyLevel {
  const lowerText = text.toLowerCase();
  
  const criticalKeywords = [
    'emergência', 'emergency', 'crítico', 'critical', 'urgente', 'urgent',
    'overdose', 'intoxicação', 'reação adversa', 'choque', 'convulsão',
    'parada', 'arritmia', 'hipotensão', 'hipertensão severa'
  ];
  
  const highKeywords = [
    'alto', 'high', 'importante', 'important', 'atenção', 'attention',
    'monitoramento', 'monitoring', 'interação', 'interaction', 'contraindicação',
    'efeito colateral', 'ajuste de dose', 'toxicidade'
  ];
  
  const mediumKeywords = [
    'médio', 'medium', 'moderado', 'moderate', 'cuidado', 'precaução',
    'observação', 'acompanhamento', 'follow-up'
  ];
  
  if (criticalKeywords.some(keyword => lowerText.includes(keyword))) {
    return 'critical';
  }
  
  if (highKeywords.some(keyword => lowerText.includes(keyword))) {
    return 'high';
  }
  
  if (mediumKeywords.some(keyword => lowerText.includes(keyword))) {
    return 'medium';
  }
  
  return 'low';
}

export default UrgencyBadgeConfig;