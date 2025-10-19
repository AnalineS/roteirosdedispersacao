/**
 * Atalhos médicos predefinidos para Fast Access Bar
 * Baseado em dados clínicos e padrões internacionais de segurança farmacêutica
 */

import { EmergencyShortcut, ShortcutCategory, FastAccessBarConfig } from '@/types/emergencyShortcuts';

// Atalhos críticos fixos (não podem ser removidos/reordenados)
export const CRITICAL_MEDICAL_SHORTCUTS: EmergencyShortcut[] = [
  {
    id: 'drug_interactions',
    label: 'Interações',
    href: '/resources/interactions',
    icon: '⚠️',
    urgency: 'critical',
    category: 'interactions',
    description: 'Verificar interações medicamentosas críticas',
    accessKey: 'i',
    estimatedTime: '< 30s',
    requiredRole: ['pharmacy', 'medicine'],
    analytics: {
      event: 'critical_interaction_check',
      category: 'patient_safety',
      label: 'drug_interactions_fast_access'
    }
  },
  {
    id: 'contraindications',
    label: 'Contraindicações',
    href: '/resources/contraindications',
    icon: '🚫',
    urgency: 'critical',
    category: 'contraindications',
    description: 'Consultar contraindicações absolutas e relativas',
    accessKey: 'c',
    estimatedTime: '< 30s',
    requiredRole: ['pharmacy', 'medicine', 'nursing'],
    analytics: {
      event: 'contraindication_check',
      category: 'patient_safety',
      label: 'contraindications_fast_access'
    }
  },
  {
    id: 'emergency_dosing',
    label: 'Doses Críticas',
    href: '/resources/emergency-dosing',
    icon: '💊',
    urgency: 'critical',
    category: 'dosing',
    description: 'Protocolos de dosagem para emergências',
    accessKey: 'd',
    estimatedTime: '< 20s',
    requiredRole: ['pharmacy', 'medicine'],
    analytics: {
      event: 'emergency_dosing_access',
      category: 'clinical_protocol',
      label: 'emergency_dosing_fast_access'
    }
  },
  {
    id: 'clinical_protocols',
    label: 'Protocolos',
    href: '/modules/protocolos-clinicos',
    icon: '📋',
    urgency: 'important',
    category: 'protocols',
    description: 'Protocolos clínicos oficiais PCDT 2022',
    accessKey: 'p',
    estimatedTime: '1-2 min',
    requiredRole: ['pharmacy', 'medicine', 'nursing'],
    analytics: {
      event: 'clinical_protocol_access',
      category: 'clinical_guidance',
      label: 'protocols_fast_access'
    }
  },
  {
    id: 'pharmacist_contact',
    label: 'Farmacêutico',
    href: '/sobre-a-tese',
    icon: '📞',
    urgency: 'important',
    category: 'contact',
    description: 'Contato direto com farmacêutico de plantão',
    accessKey: 'f',
    estimatedTime: 'Imediato',
    requiredRole: ['medicine', 'nursing'],
    analytics: {
      event: 'pharmacist_contact',
      category: 'professional_support',
      label: 'pharmacist_contact_fast_access'
    }
  }
];

// Atalhos importantes (podem ser customizados)
export const IMPORTANT_MEDICAL_SHORTCUTS: EmergencyShortcut[] = [
  {
    id: 'dose_calculator',
    label: 'Calculadora',
    href: '/resources/calculator',
    icon: '🧮',
    urgency: 'important',
    category: 'dosing',
    description: 'Calculadora de doses PQT-U',
    accessKey: 'a',
    estimatedTime: '30s',
    requiredRole: ['pharmacy', 'medicine'],
    analytics: {
      event: 'dose_calculator_access',
      category: 'calculation_tool',
      label: 'calculator_fast_access'
    }
  },
  {
    id: 'dispensing_checklist',
    label: 'Checklist',
    href: '/resources/checklist',
    icon: '✅',
    urgency: 'important',
    category: 'protocols',
    description: 'Lista de verificação para dispensação',
    accessKey: 'l',
    estimatedTime: '2-3 min',
    requiredRole: ['pharmacy'],
    analytics: {
      event: 'checklist_access',
      category: 'quality_assurance',
      label: 'checklist_fast_access'
    }
  },
  {
    id: 'patient_education',
    label: 'Orientação',
    href: '/vida-com-hanseniase',
    icon: '👨‍⚕️',
    urgency: 'standard',
    category: 'contact',
    description: 'Material para orientação do paciente',
    accessKey: 'o',
    estimatedTime: '5-10 min',
    requiredRole: ['pharmacy', 'medicine', 'nursing'],
    analytics: {
      event: 'patient_education_access',
      category: 'patient_care',
      label: 'education_fast_access'
    }
  },
  {
    id: 'medical_glossary',
    label: 'Glossário',
    href: '/glossario',
    icon: '📖',
    urgency: 'standard',
    category: 'protocols',
    description: 'Termos técnicos da hanseníase',
    accessKey: 'g',
    estimatedTime: '1-2 min',
    requiredRole: ['pharmacy', 'medicine', 'nursing'],
    analytics: {
      event: 'glossary_access',
      category: 'reference_material',
      label: 'glossary_fast_access'
    }
  },
  {
    id: 'adverse_reactions',
    label: 'RAM',
    href: '/resources/adverse-reactions',
    icon: '⚡',
    urgency: 'important',
    category: 'contraindications',
    description: 'Reações adversas a medicamentos',
    accessKey: 'r',
    estimatedTime: '1-2 min',
    requiredRole: ['pharmacy', 'medicine'],
    analytics: {
      event: 'adverse_reactions_access',
      category: 'pharmacovigilance',
      label: 'adverse_reactions_fast_access'
    }
  }
];

// Categorias de atalhos para organização
export const SHORTCUT_CATEGORIES: ShortcutCategory[] = [
  {
    id: 'interactions',
    name: 'Interações',
    icon: '⚠️',
    description: 'Verificação de interações medicamentosas',
    color: '#D32F2F', // Vermelho crítico
    shortcuts: CRITICAL_MEDICAL_SHORTCUTS.filter(s => s.category === 'interactions')
      .concat(IMPORTANT_MEDICAL_SHORTCUTS.filter(s => s.category === 'interactions'))
  },
  {
    id: 'contraindications',
    name: 'Contraindicações',
    icon: '🚫',
    description: 'Contraindicações e precauções',
    color: '#F57C00', // Laranja importante
    shortcuts: CRITICAL_MEDICAL_SHORTCUTS.filter(s => s.category === 'contraindications')
      .concat(IMPORTANT_MEDICAL_SHORTCUTS.filter(s => s.category === 'contraindications'))
  },
  {
    id: 'dosing',
    name: 'Dosagem',
    icon: '💊',
    description: 'Cálculos e protocolos de dosagem',
    color: '#FFC107', // Amarelo alerta
    shortcuts: CRITICAL_MEDICAL_SHORTCUTS.filter(s => s.category === 'dosing')
      .concat(IMPORTANT_MEDICAL_SHORTCUTS.filter(s => s.category === 'dosing'))
  },
  {
    id: 'protocols',
    name: 'Protocolos',
    icon: '📋',
    description: 'Protocolos clínicos e procedimentos',
    color: '#388E3C', // Verde padrão
    shortcuts: CRITICAL_MEDICAL_SHORTCUTS.filter(s => s.category === 'protocols')
      .concat(IMPORTANT_MEDICAL_SHORTCUTS.filter(s => s.category === 'protocols'))
  },
  {
    id: 'contact',
    name: 'Contato',
    icon: '📞',
    description: 'Suporte e contato profissional',
    color: '#1976D2', // Azul informativo
    shortcuts: CRITICAL_MEDICAL_SHORTCUTS.filter(s => s.category === 'contact')
      .concat(IMPORTANT_MEDICAL_SHORTCUTS.filter(s => s.category === 'contact'))
  }
];

// Configuração padrão da Fast Access Bar
export const DEFAULT_FAST_ACCESS_CONFIG: FastAccessBarConfig = {
  isEnabled: true, // Ativado para uso em produção
  position: 'top',
  behavior: 'smart-hide',
  maxShortcuts: 7, // 5 fixos + 2 customizáveis
  customizationEnabled: true,
  fixedShortcuts: CRITICAL_MEDICAL_SHORTCUTS.slice(0, 3).map(s => s.id), // 3 primeiros são fixos
  analytics: {
    trackUsage: true,
    trackTiming: true
  }
};

// Mapeamento de especialidades para atalhos recomendados
export const SPECIALTY_RECOMMENDATIONS = {
  pharmacy: [
    'drug_interactions',
    'contraindications',
    'dose_calculator',
    'dispensing_checklist',
    'adverse_reactions'
  ],
  medicine: [
    'emergency_dosing',
    'clinical_protocols',
    'drug_interactions',
    'pharmacist_contact',
    'patient_education'
  ],
  nursing: [
    'contraindications',
    'clinical_protocols',
    'patient_education',
    'pharmacist_contact',
    'adverse_reactions'
  ],
  general: [
    'clinical_protocols',
    'patient_education',
    'medical_glossary',
    'pharmacist_contact',
    'contraindications'
  ]
} as const;

// Cores baseadas em padrões médicos internacionais
export const MEDICAL_COLORS = {
  critical: {
    background: '#FFEBEE', // Red 50
    border: '#D32F2F',     // Red 700
    text: '#B71C1C',       // Red 900
    hover: '#FFCDD2'       // Red 100
  },
  important: {
    background: '#FFF3E0', // Orange 50
    border: '#F57C00',     // Orange 700
    text: '#E65100',       // Orange 900
    hover: '#FFE0B2'       // Orange 100
  },
  standard: {
    background: '#E8F5E8', // Green 50
    border: '#388E3C',     // Green 700
    text: '#1B5E20',       // Green 900
    hover: '#C8E6C9'       // Green 100
  }
} as const;

// Teclas de acesso rápido (acessibilidade)
export const ACCESS_KEYS = {
  drug_interactions: 'i',
  contraindications: 'c',
  emergency_dosing: 'd',
  clinical_protocols: 'p',
  pharmacist_contact: 'f',
  dose_calculator: 'a',
  dispensing_checklist: 'l',
  patient_education: 'o',
  medical_glossary: 'g',
  adverse_reactions: 'r'
} as const;

// Helper function para verificação type-safe de IDs
const isRecommendedShortcut = (shortcutId: string, recommendedIds: readonly string[]): boolean => {
  return recommendedIds.some(id => id === shortcutId);
};

// Função para obter atalhos por perfil
export const getShortcutsByProfile = (
  specialty: keyof typeof SPECIALTY_RECOMMENDATIONS,
  includeCustom: boolean = true
): EmergencyShortcut[] => {
  const recommendedIds = SPECIALTY_RECOMMENDATIONS[specialty];
  const allShortcuts = [...CRITICAL_MEDICAL_SHORTCUTS, ...IMPORTANT_MEDICAL_SHORTCUTS];

  return allShortcuts.filter(shortcut =>
    isRecommendedShortcut(shortcut.id, recommendedIds) ||
    shortcut.requiredRole?.includes(specialty)
  );
};

// Função para obter atalhos por urgência
export const getShortcutsByUrgency = (urgency: 'critical' | 'important' | 'standard'): EmergencyShortcut[] => {
  const allShortcuts = [...CRITICAL_MEDICAL_SHORTCUTS, ...IMPORTANT_MEDICAL_SHORTCUTS];
  return allShortcuts.filter(shortcut => shortcut.urgency === urgency);
};

// Função para validar configuração de atalho customizado
export const validateCustomShortcut = (shortcut: Partial<EmergencyShortcut>): boolean => {
  return !!(
    shortcut.label &&
    shortcut.href &&
    shortcut.icon &&
    shortcut.category &&
    shortcut.description &&
    shortcut.label.length <= 15 && // Limite para UI
    shortcut.description.length <= 100 // Limite para tooltip
  );
};

export default CRITICAL_MEDICAL_SHORTCUTS;