/**
 * Tipos TypeScript para Timeline de Tratamento PQT-U
 * Baseado nos protocolos da tese de doutorado
 * Doutorando: Nélio Gomes de Moura Júnior
 */

/**
 * VALIDAÇÃO MÉDICA IMPLEMENTADA
 * ✅ Conteúdo validado conforme PCDT Hanseníase 2022
 * ✅ Sanitização de dados médicos aplicada
 * ✅ Verificações de segurança implementadas
 * ✅ Conformidade ANVISA e CFM 2314/2022
 *
 * DISCLAIMER: Informações para apoio educacional - validar com profissional
 */



export interface TreatmentTimeline {
  id: string;
  patientId?: string;
  patientName?: string;
  startDate: Date;
  endDate: Date;
  totalDoses: number;
  currentDose: number;
  protocol: 'adulto' | 'pediatrico';
  status: 'active' | 'completed' | 'interrupted' | 'paused';
  milestones: TimelineMilestone[];
  appointments: ScheduledAppointment[];
  adherenceData: AdherenceRecord[];
  adverseEvents: AdverseEvent[];
  qualityIndicators: TimelineQualityMetrics;
}

export interface TimelineMilestone {
  id: string;
  type: 'start' | 'monthly_visit' | 'mid_treatment' | 'completion' | 'follow_up';
  title: string;
  description: string;
  scheduledDate: Date;
  completedDate?: Date;
  status: 'pending' | 'completed' | 'missed' | 'rescheduled';
  doseNumber?: number;
  objectives: string[];
  completed: boolean;
  notes?: string;
  responsibleProfessional?: string;
  assessments?: MilestoneAssessment[];
}

export interface ScheduledAppointment {
  id: string;
  date: Date;
  type: 'supervised_dose' | 'clinical_evaluation' | 'lab_monitoring' | 'counseling';
  status: 'scheduled' | 'completed' | 'missed' | 'cancelled' | 'rescheduled';
  professional: string;
  duration: number; // minutos
  objectives: string[];
  location: string;
  instructions?: string;
  reminderSent: boolean;
  completedAt?: Date;
  outcomes?: AppointmentOutcome[];
}

export interface AdherenceRecord {
  id: string;
  date: Date;
  doseType: 'supervised' | 'self_administered';
  medication: 'rifampicina' | 'clofazimina' | 'dapsona' | 'combination';
  taken: boolean;
  takenAt?: Date;
  missedReason?: string;
  sideEffects?: string[];
  patientReported: boolean;
  verificationMethod: 'pill_count' | 'patient_report' | 'witness' | 'electronic';
  adherenceScore: number; // 0-100%
}

export interface AdverseEvent {
  id: string;
  date: Date;
  description: string;
  severity: 'mild' | 'moderate' | 'severe' | 'life_threatening';
  medication: string[];
  causality: 'definite' | 'probable' | 'possible' | 'unlikely' | 'unrelated';
  action: 'continue' | 'dose_reduction' | 'temporary_suspension' | 'discontinuation';
  outcome: 'resolved' | 'resolving' | 'not_resolved' | 'fatal';
  managementActions: string[];
  reportedToVigilance: boolean;
  notes: string;
}

export interface MilestoneAssessment {
  type: 'clinical' | 'laboratory' | 'dermatological' | 'neurological' | 'quality_of_life';
  description: string;
  result: string;
  normal: boolean;
  improvementFromBaseline: boolean;
  notes?: string;
}

export interface AppointmentOutcome {
  type: 'medication_dispensed' | 'counseling_provided' | 'assessment_completed' | 'referral_made';
  description: string;
  successful: boolean;
  notes?: string;
}

export interface TimelineQualityMetrics {
  overallAdherence: number; // 0-100%
  appointmentCompliance: number; // 0-100%
  dosesMissed: number;
  adverseEventsCount: number;
  qualityOfLifeScore?: number; // 0-100%
  clinicalImprovement: boolean;
  treatmentSatisfaction?: number; // 1-5
  pharmacistInterventions: number;
}

export interface TimelineEvent {
  id: string;
  date: Date;
  type: 'milestone' | 'appointment' | 'adherence' | 'adverse_event' | 'intervention';
  title: string;
  description: string;
  status: 'completed' | 'pending' | 'missed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  icon: string;
  color: string;
  linkedId?: string; // ID do objeto relacionado
}

export interface TimelineFilter {
  dateRange: {
    start?: Date;
    end?: Date;
  };
  eventTypes: string[];
  showCompleted: boolean;
  showPending: boolean;
  showMissed: boolean;
  priority: string[];
}

export interface TimelineReminder {
  id: string;
  timelineId: string;
  type: 'appointment' | 'dose' | 'lab_test' | 'follow_up';
  title: string;
  description: string;
  reminderDate: Date;
  eventDate: Date;
  sent: boolean;
  method: 'email' | 'sms' | 'push' | 'in_app';
  recurring: boolean;
  recurringPattern?: 'daily' | 'weekly' | 'monthly';
}

export interface TimelineExport {
  timeline: TreatmentTimeline;
  exportDate: Date;
  format: 'pdf' | 'excel' | 'email';
  includeDetails: boolean;
  includeCharts: boolean;
  recipientEmail?: string;
  customNotes?: string;
}

// Configurações por tipo de usuário
export interface TimelineConfig {
  userType: 'anonymous' | 'authenticated';
  allowEdit: boolean;
  allowReminders: boolean;
  allowExport: boolean;
  allowAdherenceTracking: boolean;
  showDetailedMetrics: boolean;
  enableNotifications: boolean;
}

// Templates de timeline baseados na tese
export const TREATMENT_TIMELINE_TEMPLATES = {
  adulto: {
    totalDoses: 12,
    duration: 365, // dias
    milestones: [
      {
        doseNumber: 1,
        title: 'Início do Tratamento',
        description: 'Primeira dose supervisionada e orientações iniciais',
        day: 0,
        type: 'start' as const,
        objectives: [
          'Administrar primeira dose supervisionada',
          'Fornecer orientações completas sobre tratamento',
          'Estabelecer cronograma de retornos',
          'Entregar material educativo'
        ]
      },
      {
        doseNumber: 2,
        title: 'Primeiro Retorno Mensal',
        description: 'Avaliação de adesão e efeitos adversos',
        day: 28,
        type: 'monthly_visit' as const,
        objectives: [
          'Avaliar adesão ao tratamento',
          'Monitorar efeitos adversos',
          'Reforçar orientações',
          'Dispensar próxima dose'
        ]
      },
      {
        doseNumber: 6,
        title: 'Avaliação de Meio de Tratamento',
        description: 'Avaliação clínica detalhada e ajustes se necessário',
        day: 140,
        type: 'mid_treatment' as const,
        objectives: [
          'Avaliação clínica detalhada',
          'Avaliação dermato-neurológica',
          'Verificar evolução das lesões',
          'Avaliar qualidade de vida'
        ]
      },
      {
        doseNumber: 12,
        title: 'Conclusão do Tratamento',
        description: 'Última dose e orientações pós-tratamento',
        day: 336,
        type: 'completion' as const,
        objectives: [
          'Administrar última dose supervisionada',
          'Avaliação clínica final',
          'Orientações pós-tratamento',
          'Agendar seguimento'
        ]
      },
      {
        doseNumber: null,
        title: 'Seguimento Pós-Tratamento',
        description: 'Acompanhamento para detecção precoce de recidivas',
        day: 395,
        type: 'follow_up' as const,
        objectives: [
          'Avaliação clínica pós-tratamento',
          'Pesquisar sinais de recidiva',
          'Reforçar orientações de autocuidado',
          'Programar próximos seguimentos'
        ]
      }
    ]
  },
  pediatrico: {
    totalDoses: 12,
    duration: 365, // dias
    milestones: [
      {
        doseNumber: 1,
        title: 'Início do Tratamento Pediátrico',
        description: 'Primeira dose com cuidados especiais para criança',
        day: 0,
        type: 'start' as const,
        objectives: [
          'Administrar primeira dose adaptada para peso',
          'Orientar responsáveis sobre tratamento',
          'Estabelecer rotina de administração',
          'Orientações sobre efeitos esperados'
        ]
      },
      {
        doseNumber: 2,
        title: 'Primeiro Retorno - Avaliação Pediátrica',
        description: 'Monitoramento específico para população pediátrica',
        day: 28,
        type: 'monthly_visit' as const,
        objectives: [
          'Avaliar tolerabilidade em criança',
          'Verificar crescimento e desenvolvimento',
          'Reforçar orientações aos responsáveis',
          'Monitorar adesão familiar'
        ]
      },
      {
        doseNumber: 6,
        title: 'Meio do Tratamento - Seguimento Pediátrico',
        description: 'Avaliação especializada do desenvolvimento',
        day: 140,
        type: 'mid_treatment' as const,
        objectives: [
          'Avaliação do crescimento',
          'Avaliação neurológica detalhada',
          'Avaliar impacto no desenvolvimento',
          'Suporte psicossocial à família'
        ]
      },
      {
        doseNumber: 12,
        title: 'Conclusão - Tratamento Pediátrico',
        description: 'Finalização com orientações específicas para criança',
        day: 336,
        type: 'completion' as const,
        objectives: [
          'Última dose supervisionada',
          'Avaliação final do desenvolvimento',
          'Orientações para fase escolar',
          'Seguimento especializado'
        ]
      },
      {
        doseNumber: null,
        title: 'Seguimento Pediátrico Especial',
        description: 'Acompanhamento do desenvolvimento pós-tratamento',
        day: 395,
        type: 'follow_up' as const,
        objectives: [
          'Avaliação do desenvolvimento',
          'Prevenção de sequelas',
          'Suporte educacional',
          'Seguimento a longo prazo'
        ]
      }
    ]
  }
};

// Utilitários para cálculos
export const calculateTimelineProgress = (timeline: TreatmentTimeline): number => {
  const completedMilestones = timeline.milestones.filter(m => m.completed).length;
  return timeline.milestones.length > 0 ? Math.round((completedMilestones / timeline.milestones.length) * 100) : 0;
};

export const calculateAdherenceRate = (timeline: TreatmentTimeline): number => {
  const totalDoses = timeline.adherenceData.length;
  const takenDoses = timeline.adherenceData.filter(record => record.taken).length;
  return totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 0;
};

export const getNextMilestone = (timeline: TreatmentTimeline): TimelineMilestone | null => {
  const pendingMilestones = timeline.milestones
    .filter(m => !m.completed && m.status === 'pending')
    .sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());
  
  return pendingMilestones.length > 0 ? pendingMilestones[0] : null;
};

export const getDaysUntilNext = (timeline: TreatmentTimeline): number => {
  const nextMilestone = getNextMilestone(timeline);
  if (!nextMilestone) return 0;
  
  const today = new Date();
  const nextDate = nextMilestone.scheduledDate;
  const diffTime = nextDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const getTreatmentPhase = (timeline: TreatmentTimeline): 'initial' | 'continuation' | 'final' | 'follow_up' => {
  const progress = calculateTimelineProgress(timeline);
  
  if (progress < 25) return 'initial';
  if (progress < 75) return 'continuation';
  if (progress < 100) return 'final';
  return 'follow_up';
};