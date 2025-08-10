/**
 * Tipos TypeScript para Sistema de Checklist de Dispensação
 * Baseado em dispensing_workflow.json da tese de doutorado
 * Doutorando: Nélio Gomes de Moura Júnior
 */

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  required: boolean;
  notes?: string;
  timestamp?: Date;
}

export interface ChecklistActivity {
  id: string;
  title: string;
  description?: string;
  items: ChecklistItem[];
  allItemsRequired: boolean;
}

export interface WorkflowStage {
  id: string;
  title: string;
  sequence: number;
  duration: string;
  responsible: string;
  objectives: string[];
  activities: ChecklistActivity[];
  decisionPoints?: {
    continue: string[];
    refer: string[];
    request: string[];
  };
  isCompleted: boolean;
  completedAt?: Date;
  notes?: string;
}

export interface DispensingSession {
  id: string;
  patientId?: string;
  patientName?: string;
  startTime: Date;
  endTime?: Date;
  stages: WorkflowStage[];
  currentStage: number;
  status: 'in_progress' | 'completed' | 'cancelled' | 'paused';
  totalProgress: number; // 0-100%
  pharmacistNotes: string;
  qualityIndicators?: QualityMetrics;
}

export interface QualityMetrics {
  prescriptionAccuracy: boolean;
  dispensingTime: number; // minutos
  counselingCompletion: number; // 0-100%
  documentationCompliance: boolean;
  patientSatisfaction?: number; // 1-5
  adverseEventsReported: number;
}

export interface ChecklistProgress {
  stageId: string;
  activityId: string;
  itemsCompleted: number;
  itemsTotal: number;
  percentageComplete: number;
  isStageComplete: boolean;
}

export interface ChecklistExport {
  session: DispensingSession;
  exportDate: Date;
  format: 'pdf' | 'email';
  includeNotes: boolean;
  includeQualityMetrics: boolean;
  recipientEmail?: string;
}

// Configurações por tipo de usuário
export interface ChecklistConfig {
  userType: 'anonymous' | 'authenticated';
  allowSave: boolean;
  allowEdit: boolean;
  allowExport: boolean;
  allowNotes: boolean;
  showQualityMetrics: boolean;
  showDecisionPoints: boolean;
}

// Template padrão baseado na tese
export const DISPENSING_WORKFLOW_TEMPLATE: Omit<WorkflowStage, 'isCompleted' | 'completedAt'>[] = [
  {
    id: 'etapa_01_avaliacao_inicial',
    title: 'Avaliação Inicial',
    sequence: 1,
    duration: '5-10 minutos',
    responsible: 'Farmacêutico',
    objectives: [
      'Verificar prescrição e documentação',
      'Avaliar elegibilidade do paciente',
      'Confirmar disponibilidade do medicamento',
      'Identificar necessidades especiais'
    ],
    activities: [
      {
        id: 'prescription_verification',
        title: 'Verificação da Prescrição',
        description: 'Validação completa da prescrição médica ou de enfermagem',
        allItemsRequired: true,
        items: [
          {
            id: 'pv_01',
            text: 'Prescrição em duas vias',
            completed: false,
            required: true
          },
          {
            id: 'pv_02',
            text: 'Prescritor habilitado (médico ou enfermeiro)',
            completed: false,
            required: true
          },
          {
            id: 'pv_03',
            text: 'Para < 30kg: apenas prescrição médica',
            completed: false,
            required: true
          },
          {
            id: 'pv_04',
            text: 'Data da prescrição válida',
            completed: false,
            required: true
          },
          {
            id: 'pv_05',
            text: 'Esquema posológico correto',
            completed: false,
            required: true
          },
          {
            id: 'pv_06',
            text: 'Legibilidade da prescrição',
            completed: false,
            required: true
          }
        ]
      },
      {
        id: 'patient_assessment',
        title: 'Avaliação do Paciente',
        description: 'Coleta de informações clínicas e identificação do paciente',
        allItemsRequired: true,
        items: [
          {
            id: 'pa_01',
            text: 'Confirmar identidade do paciente',
            completed: false,
            required: true
          },
          {
            id: 'pa_02',
            text: 'Verificar peso (especialmente < 30kg)',
            completed: false,
            required: true
          },
          {
            id: 'pa_03',
            text: 'Histórico de alergias',
            completed: false,
            required: true
          },
          {
            id: 'pa_04',
            text: 'Medicamentos em uso',
            completed: false,
            required: true
          },
          {
            id: 'pa_05',
            text: 'Condições especiais (gravidez, amamentação)',
            completed: false,
            required: true
          },
          {
            id: 'pa_06',
            text: 'Primeira dispensação ou continuidade',
            completed: false,
            required: true
          }
        ]
      },
      {
        id: 'medication_availability',
        title: 'Disponibilidade do Medicamento',
        description: 'Verificação de estoque e qualidade dos medicamentos PQT-U',
        allItemsRequired: true,
        items: [
          {
            id: 'ma_01',
            text: 'Verificar estoque de PQT-U',
            completed: false,
            required: true
          },
          {
            id: 'ma_02',
            text: 'Conferir validade dos medicamentos',
            completed: false,
            required: true
          },
          {
            id: 'ma_03',
            text: 'Confirmar apresentação correta (adulto/infantil)',
            completed: false,
            required: true
          },
          {
            id: 'ma_04',
            text: 'Quantidade suficiente para 1 mês',
            completed: false,
            required: true
          },
          {
            id: 'ma_05',
            text: 'Condições de armazenamento adequadas',
            completed: false,
            required: true
          }
        ]
      },
      {
        id: 'documentation',
        title: 'Documentação',
        description: 'Registros obrigatórios para rastreabilidade',
        allItemsRequired: true,
        items: [
          {
            id: 'doc_01',
            text: 'Reter uma via da prescrição',
            completed: false,
            required: true
          },
          {
            id: 'doc_02',
            text: 'Carimbar via do paciente com quantidade fornecida',
            completed: false,
            required: true
          },
          {
            id: 'doc_03',
            text: 'Registrar em livro de controle',
            completed: false,
            required: true
          },
          {
            id: 'doc_04',
            text: 'Anotar na Caderneta do Paciente',
            completed: false,
            required: true
          }
        ]
      }
    ],
    decisionPoints: {
      continue: [
        'Prescrição válida e completa',
        'Paciente elegível',
        'Medicamento disponível',
        'Não há contraindicações aparentes'
      ],
      refer: [
        'Prescrição inadequada',
        'Paciente < 30kg sem prescrição médica',
        'Contraindicações identificadas',
        'Necessidade de ajuste de dose'
      ],
      request: [
        'Estoque insuficiente',
        'Medicamento vencido',
        'Problemas de qualidade'
      ]
    }
  },
  {
    id: 'etapa_02_orientacoes_cuidado',
    title: 'Orientações e Plano de Cuidado',
    sequence: 2,
    duration: '15-20 minutos',
    responsible: 'Farmacêutico',
    objectives: [
      'Educar sobre o tratamento',
      'Estabelecer plano de cuidado',
      'Orientar sobre administração',
      'Prevenir problemas relacionados a medicamentos'
    ],
    activities: [
      {
        id: 'medication_education',
        title: 'Educação sobre Medicamentos',
        description: 'Orientações fundamentais sobre PQT-U',
        allItemsRequired: true,
        items: [
          {
            id: 'me_01',
            text: 'Nome de cada medicamento',
            completed: false,
            required: true
          },
          {
            id: 'me_02',
            text: 'Apresentação e aparência',
            completed: false,
            required: true
          },
          {
            id: 'me_03',
            text: 'Diferença entre dose supervisionada e autoadministrada',
            completed: false,
            required: true
          },
          {
            id: 'me_04',
            text: 'Como os medicamentos funcionam',
            completed: false,
            required: true
          },
          {
            id: 'me_05',
            text: 'Por que são usados em combinação',
            completed: false,
            required: true
          },
          {
            id: 'me_06',
            text: 'Importância de completar o tratamento',
            completed: false,
            required: true
          }
        ]
      },
      {
        id: 'dosing_schedule',
        title: 'Esquema Posológico',
        description: 'Orientações sobre horários e administração',
        allItemsRequired: true,
        items: [
          {
            id: 'ds_01',
            text: 'Dose mensal supervisionada: 1 vez por mês na unidade',
            completed: false,
            required: true
          },
          {
            id: 'ds_02',
            text: 'Doses diárias: em casa, à noite após jantar',
            completed: false,
            required: true
          },
          {
            id: 'ds_03',
            text: 'NÃO tomar autoadministrada no dia da supervisionada',
            completed: false,
            required: true
          },
          {
            id: 'ds_04',
            text: 'Administração com alimentos',
            completed: false,
            required: true
          }
        ]
      },
      {
        id: 'safety_counseling',
        title: 'Orientações de Segurança',
        description: 'Alertas e precauções importantes',
        allItemsRequired: true,
        items: [
          {
            id: 'sc_01',
            text: 'Alergias conhecidas e contraindicações',
            completed: false,
            required: true
          },
          {
            id: 'sc_02',
            text: 'Interações medicamentosas',
            completed: false,
            required: true
          },
          {
            id: 'sc_03',
            text: 'Efeitos esperados (coloração urina, pele)',
            completed: false,
            required: true
          },
          {
            id: 'sc_04',
            text: 'Efeitos que requerem atenção médica',
            completed: false,
            required: true
          },
          {
            id: 'sc_05',
            text: 'Quando procurar ajuda imediatamente',
            completed: false,
            required: true
          },
          {
            id: 'sc_06',
            text: 'Orientações para populações especiais',
            completed: false,
            required: false
          }
        ]
      },
      {
        id: 'storage_disposal',
        title: 'Armazenamento e Descarte',
        description: 'Cuidados com medicamentos em casa',
        allItemsRequired: true,
        items: [
          {
            id: 'sd_01',
            text: 'Armazenamento: local seco, 15-30°C',
            completed: false,
            required: true
          },
          {
            id: 'sd_02',
            text: 'Proteger da luz e umidade',
            completed: false,
            required: true
          },
          {
            id: 'sd_03',
            text: 'Longe do alcance de crianças',
            completed: false,
            required: true
          },
          {
            id: 'sd_04',
            text: 'Descarte seguro de medicamentos vencidos',
            completed: false,
            required: true
          }
        ]
      }
    ]
  },
  {
    id: 'etapa_03_pos_dispensacao',
    title: 'Pós-Dispensação e Avaliação',
    sequence: 3,
    duration: 'Contínuo/mensal',
    responsible: 'Farmacêutico + Equipe multidisciplinar',
    objectives: [
      'Monitorar adesão ao tratamento',
      'Detectar e gerenciar problemas',
      'Avaliar efetividade e segurança',
      'Dar suporte contínuo ao paciente'
    ],
    activities: [
      {
        id: 'monthly_follow_up',
        title: 'Acompanhamento Mensal',
        description: 'Avaliação sistemática a cada 28 dias',
        allItemsRequired: false,
        items: [
          {
            id: 'mf_01',
            text: 'Perguntar sobre última dose autoadministrada',
            completed: false,
            required: true
          },
          {
            id: 'mf_02',
            text: 'Contar comprimidos restantes',
            completed: false,
            required: true
          },
          {
            id: 'mf_03',
            text: 'Avaliar dificuldades na administração',
            completed: false,
            required: true
          },
          {
            id: 'mf_04',
            text: 'Questionar sobre efeitos adversos',
            completed: false,
            required: true
          },
          {
            id: 'mf_05',
            text: 'Avaliação dermato-neurológica',
            completed: false,
            required: false
          },
          {
            id: 'mf_06',
            text: 'Evolução das lesões cutâneas',
            completed: false,
            required: false
          }
        ]
      },
      {
        id: 'problem_resolution',
        title: 'Resolução de Problemas',
        description: 'Manejo de efeitos adversos e não adesão',
        allItemsRequired: false,
        items: [
          {
            id: 'pr_01',
            text: 'Classificar gravidade de efeitos adversos',
            completed: false,
            required: false
          },
          {
            id: 'pr_02',
            text: 'Implementar medidas de manejo',
            completed: false,
            required: false
          },
          {
            id: 'pr_03',
            text: 'Comunicar ao prescritor se necessário',
            completed: false,
            required: false
          },
          {
            id: 'pr_04',
            text: 'Desenvolver estratégias para adesão',
            completed: false,
            required: false
          }
        ]
      },
      {
        id: 'care_coordination',
        title: 'Coordenação do Cuidado',
        description: 'Interface com equipe multidisciplinar',
        allItemsRequired: false,
        items: [
          {
            id: 'cc_01',
            text: 'Comunicação com equipe médica',
            completed: false,
            required: false
          },
          {
            id: 'cc_02',
            text: 'Coordenação com enfermagem',
            completed: false,
            required: false
          },
          {
            id: 'cc_03',
            text: 'Articulação com serviços sociais',
            completed: false,
            required: false
          }
        ]
      }
    ]
  }
];

// Utilitários para cálculos
export const calculateStageProgress = (stage: WorkflowStage): number => {
  const totalItems = stage.activities.reduce((sum, activity) => sum + activity.items.length, 0);
  const completedItems = stage.activities.reduce(
    (sum, activity) => sum + activity.items.filter(item => item.completed).length, 
    0
  );
  return totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
};

export const calculateOverallProgress = (session: DispensingSession): number => {
  const totalStages = session.stages.length;
  const completedStages = session.stages.filter(stage => stage.isCompleted).length;
  const partialProgress = session.stages.reduce((sum, stage) => {
    return sum + (calculateStageProgress(stage) / 100);
  }, 0);
  
  return Math.round((partialProgress / totalStages) * 100);
};