'use client';

import React, { useState } from 'react';
import { getUnbColors } from '@/config/modernTheme';
import { ClockIcon, CheckCircleIcon, AlertCircleIcon, InfoIcon } from '@/components/icons/EducationalIcons';

interface TimelineMilestone {
  id: string;
  title: string;
  description: string;
  dayNumber: number;
  isCompleted: boolean;
  isCurrent: boolean;
  type: 'dose' | 'monitoring' | 'consultation' | 'evaluation';
  medications?: string[];
  importantNotes?: string[];
}

interface AnonymousTimelineProps {
  className?: string;
  showProgress?: boolean;
  interactive?: boolean;
}

// Timeline educativa baseada no protocolo PQT-U real
const PQT_U_TIMELINE: TimelineMilestone[] = [
  {
    id: 'day_0',
    title: 'Início do Tratamento - 1ª Dose',
    description: 'Primeira dose supervisionada de PQT-U',
    dayNumber: 0,
    isCompleted: false,
    isCurrent: true,
    type: 'dose',
    medications: ['Rifampicina 600mg', 'Clofazimina 300mg', 'Dapsona 100mg'],
    importantNotes: [
      'Dose supervisionada obrigatória',
      'Orientações sobre efeitos adversos',
      'Agendamento próxima consulta'
    ]
  },
  {
    id: 'week_1',
    title: 'Acompanhamento Semanal',
    description: 'Monitoramento inicial de tolerabilidade',
    dayNumber: 7,
    isCompleted: false,
    isCurrent: false,
    type: 'monitoring',
    importantNotes: [
      'Verificar adesão à medicação diária',
      'Investigar efeitos adversos',
      'Orientações sobre coloração da pele'
    ]
  },
  {
    id: 'day_30',
    title: '2ª Dose Supervisionada',
    description: 'Segunda dose mensal de PQT-U',
    dayNumber: 30,
    isCompleted: false,
    isCurrent: false,
    type: 'dose',
    medications: ['Rifampicina 600mg', 'Clofazimina 300mg', 'Dapsona 100mg'],
    importantNotes: [
      'Avaliação de adesão ao tratamento',
      'Investigação de novos sintomas',
      'Renovação prescrição medicação diária'
    ]
  },
  {
    id: 'day_60',
    title: '3ª Dose Supervisionada',
    description: 'Terceira dose mensal - meio do tratamento',
    dayNumber: 60,
    isCompleted: false,
    isCurrent: false,
    type: 'dose',
    medications: ['Rifampicina 600mg', 'Clofazimina 300mg', 'Dapsona 100mg'],
    importantNotes: [
      'Avaliação de melhora clínica',
      'Verificar adesão contínua',
      'Orientações sobre continuidade'
    ]
  },
  {
    id: 'day_90',
    title: '4ª Dose Supervisionada',
    description: 'Quarta dose mensal de PQT-U',
    dayNumber: 90,
    isCompleted: false,
    isCurrent: false,
    type: 'dose',
    medications: ['Rifampicina 600mg', 'Clofazimina 300mg', 'Dapsona 100mg'],
    importantNotes: [
      'Documentação de evolução clínica',
      'Preparação para fase final',
      'Reforço de orientações'
    ]
  },
  {
    id: 'day_120',
    title: '5ª Dose Supervisionada',
    description: 'Quinta dose mensal - quase concluindo',
    dayNumber: 120,
    isCompleted: false,
    isCurrent: false,
    type: 'dose',
    medications: ['Rifampicina 600mg', 'Clofazimina 300mg', 'Dapsona 100mg'],
    importantNotes: [
      'Penúltima dose supervisionada',
      'Avaliação de resposta terapêutica',
      'Orientações pré-alta'
    ]
  },
  {
    id: 'day_150',
    title: '6ª Dose - Conclusão do PQT-U',
    description: 'Última dose supervisionada',
    dayNumber: 150,
    isCompleted: false,
    isCurrent: false,
    type: 'dose',
    medications: ['Rifampicina 600mg', 'Clofazimina 300mg', 'Dapsona 100mg'],
    importantNotes: [
      'Conclusão do esquema PQT-U',
      'Alta do tratamento',
      'Orientações sobre seguimento'
    ]
  },
  {
    id: 'follow_up',
    title: 'Seguimento Pós-Tratamento',
    description: 'Acompanhamento e vigilância',
    dayNumber: 180,
    isCompleted: false,
    isCurrent: false,
    type: 'evaluation',
    importantNotes: [
      'Avaliação de cura',
      'Detecção precoce de recidiva',
      'Acompanhamento anual recomendado'
    ]
  }
];

export default function AnonymousTimeline({
  className = '',
  showProgress = true,
  interactive = true
}: AnonymousTimelineProps) {
  const unbColors = getUnbColors();
  const [selectedMilestone, setSelectedMilestone] = useState<string | null>(null);
  const [currentDay, setCurrentDay] = useState(0);

  const handleDaySimulation = (day: number) => {
    if (!interactive) return;
    setCurrentDay(day);

    // Update milestones based on current day
    PQT_U_TIMELINE.forEach(milestone => {
      milestone.isCompleted = milestone.dayNumber <= day;
      milestone.isCurrent = milestone.dayNumber === day ||
        (milestone.dayNumber > day && PQT_U_TIMELINE.filter(m => m.dayNumber <= day).length === PQT_U_TIMELINE.indexOf(milestone));
    });
  };

  const getProgressPercentage = () => {
    const completedMilestones = PQT_U_TIMELINE.filter(m => m.isCompleted).length;
    return Math.round((completedMilestones / PQT_U_TIMELINE.length) * 100);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'dose': return '💊';
      case 'monitoring': return '🔍';
      case 'consultation': return '👨‍⚕️';
      case 'evaluation': return '📋';
      default: return '📅';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'dose': return unbColors.primary;
      case 'monitoring': return '#F59E0B';
      case 'consultation': return '#10B981';
      case 'evaluation': return '#8B5CF6';
      default: return unbColors.neutral;
    }
  };

  return (
    <div className={`anonymous-timeline ${className}`}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${unbColors.primary}15, ${unbColors.secondary}15)`,
        padding: '2rem',
        borderRadius: '16px',
        marginBottom: '2rem',
        border: `1px solid ${unbColors.primary}20`
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1rem'
        }}>
          <ClockIcon size={32} color={unbColors.primary} />
          <h2 style={{
            margin: 0,
            fontSize: '1.75rem',
            fontWeight: 'bold',
            color: unbColors.primary
          }}>
            Timeline do Tratamento PQT-U
          </h2>
        </div>

        <p style={{
          margin: 0,
          color: '#64748b',
          fontSize: '1.1rem',
          lineHeight: '1.6'
        }}>
          Cronograma completo do tratamento com Poliquimioterapia Única (PQT-U) para hanseníase.
          Duração total: <strong>6 meses</strong> com doses supervisionadas mensais.
        </p>

        {showProgress && (
          <div style={{ marginTop: '1.5rem' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.5rem'
            }}>
              <span style={{
                fontSize: '0.875rem',
                fontWeight: '600',
                color: unbColors.primary
              }}>
                Progresso do Tratamento
              </span>
              <span style={{
                fontSize: '1rem',
                fontWeight: 'bold',
                color: unbColors.primary
              }}>
                {getProgressPercentage()}%
              </span>
            </div>

            <div style={{
              background: '#f1f5f9',
              height: '12px',
              borderRadius: '6px',
              overflow: 'hidden'
            }}>
              <div style={{
                background: `linear-gradient(90deg, ${unbColors.primary}, ${unbColors.secondary})`,
                height: '100%',
                width: `${getProgressPercentage()}%`,
                transition: 'width 0.3s ease',
                borderRadius: '6px'
              }} />
            </div>
          </div>
        )}

        {interactive && (
          <div style={{ marginTop: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: unbColors.primary,
              marginBottom: '0.5rem'
            }}>
              Simular progresso do tratamento (dia):
            </label>
            <input
              type="range"
              min="0"
              max="180"
              step="1"
              value={currentDay}
              onChange={(e) => handleDaySimulation(Number(e.target.value))}
              style={{
                width: '100%',
                height: '6px',
                borderRadius: '3px',
                background: '#f1f5f9',
                outline: 'none',
                cursor: 'pointer'
              }}
            />
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.75rem',
              color: '#64748b',
              marginTop: '0.25rem'
            }}>
              <span>Dia 0</span>
              <span>Dia {currentDay}</span>
              <span>Dia 180</span>
            </div>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div style={{
        position: 'relative',
        paddingLeft: '2rem'
      }}>
        {/* Vertical line */}
        <div style={{
          position: 'absolute',
          left: '1rem',
          top: '0',
          bottom: '0',
          width: '2px',
          background: `linear-gradient(180deg, ${unbColors.primary}, ${unbColors.secondary})`,
          borderRadius: '1px'
        }} />

        {PQT_U_TIMELINE.map((milestone, index) => (
          <div
            key={milestone.id}
            style={{
              position: 'relative',
              paddingBottom: index === PQT_U_TIMELINE.length - 1 ? '0' : '3rem',
              cursor: interactive ? 'pointer' : 'default'
            }}
            onClick={() => interactive && setSelectedMilestone(
              selectedMilestone === milestone.id ? null : milestone.id
            )}
          >
            {/* Milestone dot */}
            <div style={{
              position: 'absolute',
              left: '-1.75rem',
              top: '0.5rem',
              width: '1.5rem',
              height: '1.5rem',
              background: milestone.isCompleted ? '#10B981' :
                          milestone.isCurrent ? getTypeColor(milestone.type) : 'white',
              border: `3px solid ${
                milestone.isCompleted ? '#10B981' :
                milestone.isCurrent ? getTypeColor(milestone.type) : '#cbd5e1'
              }`,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.625rem',
              zIndex: 1
            }}>
              {milestone.isCompleted ? (
                <CheckCircleIcon size={12} color="white" />
              ) : milestone.isCurrent ? (
                <span style={{ fontSize: '0.5rem' }}>{getTypeIcon(milestone.type)}</span>
              ) : null}
            </div>

            {/* Milestone content */}
            <div style={{
              background: 'white',
              border: `1px solid ${
                milestone.isCurrent ? getTypeColor(milestone.type) : '#e2e8f0'
              }`,
              borderRadius: '12px',
              padding: '1.5rem',
              marginLeft: '1rem',
              boxShadow: milestone.isCurrent ?
                `0 4px 12px ${getTypeColor(milestone.type)}20` :
                '0 2px 8px rgba(0,0,0,0.1)',
              transition: 'all 0.2s ease'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '0.75rem'
              }}>
                <div>
                  <h3 style={{
                    margin: 0,
                    fontSize: '1.125rem',
                    fontWeight: 'bold',
                    color: milestone.isCurrent ? getTypeColor(milestone.type) : '#1e293b',
                    marginBottom: '0.25rem'
                  }}>
                    {getTypeIcon(milestone.type)} {milestone.title}
                  </h3>
                  <p style={{
                    margin: 0,
                    color: '#64748b',
                    fontSize: '0.875rem'
                  }}>
                    {milestone.description}
                  </p>
                </div>

                <span style={{
                  background: getTypeColor(milestone.type) + '15',
                  color: getTypeColor(milestone.type),
                  padding: '0.25rem 0.75rem',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  whiteSpace: 'nowrap'
                }}>
                  Dia {milestone.dayNumber}
                </span>
              </div>

              {milestone.medications && (
                <div style={{ marginBottom: '1rem' }}>
                  <h4 style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    💊 Medicações
                  </h4>
                  <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.5rem'
                  }}>
                    {milestone.medications.map((med, idx) => (
                      <span
                        key={idx}
                        style={{
                          background: '#f0f9ff',
                          color: '#0369a1',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: '500'
                        }}
                      >
                        {med}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {milestone.importantNotes && selectedMilestone === milestone.id && (
                <div style={{
                  background: '#fefce8',
                  border: '1px solid #fde047',
                  borderRadius: '8px',
                  padding: '1rem',
                  marginTop: '1rem'
                }}>
                  <h4 style={{
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    color: '#92400e',
                    marginBottom: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <InfoIcon size={16} color="#92400e" />
                    Pontos Importantes
                  </h4>
                  <ul style={{
                    margin: 0,
                    paddingLeft: '1.25rem',
                    color: '#92400e'
                  }}>
                    {milestone.importantNotes.map((note, idx) => (
                      <li key={idx} style={{ fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                        {note}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div style={{
        background: 'white',
        border: `1px solid ${unbColors.primary}30`,
        borderRadius: '16px',
        padding: '2rem',
        marginTop: '3rem',
        textAlign: 'center'
      }}>
        <h3 style={{
          margin: '0 0 1rem 0',
          fontSize: '1.25rem',
          fontWeight: 'bold',
          color: unbColors.primary
        }}>
          Informações Importantes sobre o PQT-U
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem',
          marginTop: '1.5rem'
        }}>
          <div style={{
            background: '#f0fdf4',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid #bbf7d0'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#15803d' }}>Eficácia Comprovada</h4>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#166534' }}>
              O PQT-U tem 100% de eficácia quando tomado conforme orientação médica
            </p>
          </div>

          <div style={{
            background: '#fef3c7',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid #fde047'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚠️</div>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#92400e' }}>Nunca Interromper</h4>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#92400e' }}>
              A interrupção do tratamento pode causar resistência medicamentosa
            </p>
          </div>

          <div style={{
            background: '#dbeafe',
            padding: '1.5rem',
            borderRadius: '12px',
            border: '1px solid #93c5fd'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📞</div>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#1d4ed8' }}>Suporte Disponível</h4>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#1e40af' }}>
              Equipe de saúde disponível para dúvidas e orientações
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}