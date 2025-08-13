'use client';

import React, { useState } from 'react';
import { TREATMENT_TIMELINE_TEMPLATES } from '@/types/timeline';
import { modernChatTheme } from '@/config/modernTheme';

interface StaticTimelineProps {
  protocol?: 'adulto' | 'pediatrico';
  showEducationalInfo?: boolean;
}

export default function StaticTimeline({ 
  protocol = 'adulto', 
  showEducationalInfo = true 
}: StaticTimelineProps) {
  const [selectedMilestone, setSelectedMilestone] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'timeline' | 'calendar' | 'list'>('timeline');

  const template = TREATMENT_TIMELINE_TEMPLATES[protocol];
  const totalDays = template.duration;

  const getMilestoneIcon = (type: string, isCompleted: boolean = false) => {
    if (isCompleted) return '✅';
    
    switch (type) {
      case 'start': return '🚀';
      case 'monthly_visit': return '📋';
      case 'mid_treatment': return '🔍';
      case 'completion': return '🎯';
      case 'follow_up': return '👁️';
      default: return '📅';
    }
  };

  const getMilestoneColor = (type: string) => {
    switch (type) {
      case 'start': return modernChatTheme.colors.status.success;
      case 'monthly_visit': return modernChatTheme.colors.personas.gasnelio.primary;
      case 'mid_treatment': return modernChatTheme.colors.status.warning;
      case 'completion': return modernChatTheme.colors.status.success;
      case 'follow_up': return modernChatTheme.colors.personas.ga.primary;
      default: return modernChatTheme.colors.neutral.textMuted;
    }
  };

  const formatDayToDate = (day: number): string => {
    const baseDate = new Date();
    const targetDate = new Date(baseDate.getTime() + (day * 24 * 60 * 60 * 1000));
    return targetDate.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getTimelinePosition = (day: number): number => {
    return (day / totalDays) * 100;
  };

  return (
    <div>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: modernChatTheme.spacing.xl,
        padding: modernChatTheme.spacing.lg,
        background: modernChatTheme.colors.background.secondary,
        borderRadius: modernChatTheme.borderRadius.md,
        border: `1px solid ${modernChatTheme.colors.neutral.border}`
      }}>
        <h2 style={{
          fontSize: '20px',
          fontWeight: '700',
          color: modernChatTheme.colors.neutral.text,
          marginBottom: modernChatTheme.spacing.sm
        }}>
          📅 Cronograma de Tratamento PQT-U
        </h2>
        <p style={{
          fontSize: modernChatTheme.typography.meta.fontSize,
          color: modernChatTheme.colors.neutral.textMuted,
          marginBottom: modernChatTheme.spacing.md
        }}>
          {protocol === 'adulto' ? 'Protocolo para pacientes adultos' : 'Protocolo pediátrico adaptado'} • 
          {template.totalDoses} doses ao longo de {Math.round(template.duration / 30)} meses
        </p>
        
        {/* View Mode Toggle */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: modernChatTheme.spacing.sm,
          marginBottom: showEducationalInfo ? modernChatTheme.spacing.md : 0
        }}>
          {['timeline', 'calendar', 'list'].map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode as any)}
              style={{
                padding: `${modernChatTheme.spacing.xs} ${modernChatTheme.spacing.sm}`,
                background: viewMode === mode 
                  ? modernChatTheme.colors.personas.gasnelio.primary
                  : 'transparent',
                color: viewMode === mode 
                  ? 'white'
                  : modernChatTheme.colors.neutral.textMuted,
                border: `1px solid ${modernChatTheme.colors.neutral.border}`,
                borderRadius: modernChatTheme.borderRadius.sm,
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                textTransform: 'capitalize'
              }}
            >
              {mode === 'timeline' && '📊'} {mode === 'calendar' && '📅'} {mode === 'list' && '📋'} {mode}
            </button>
          ))}
        </div>

        {showEducationalInfo && (
          <div style={{
            background: '#3B82F6' + '10',
            padding: modernChatTheme.spacing.md,
            borderRadius: modernChatTheme.borderRadius.sm,
            border: `1px solid ${modernChatTheme.colors.status.info}20`
          }}>
            <p style={{
              fontSize: '12px',
              color: '#3B82F6',
              margin: 0
            }}>
              💡 <strong>Versão demonstrativa:</strong> Faça login para personalizar cronograma, receber lembretes e acompanhar progresso real
            </p>
          </div>
        )}
      </div>

      {/* Timeline View */}
      {viewMode === 'timeline' && (
        <div style={{
          background: 'white',
          border: `1px solid ${modernChatTheme.colors.neutral.border}`,
          borderRadius: modernChatTheme.borderRadius.lg,
          padding: modernChatTheme.spacing.xl,
          marginBottom: modernChatTheme.spacing.lg
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: modernChatTheme.colors.neutral.text,
            marginBottom: modernChatTheme.spacing.lg,
            textAlign: 'center'
          }}>
            📊 Linha do Tempo Interativa
          </h3>

          {/* Timeline Container */}
          <div style={{
            position: 'relative',
            height: '120px',
            margin: `${modernChatTheme.spacing.xl} 0`,
            background: modernChatTheme.colors.background.secondary,
            borderRadius: modernChatTheme.borderRadius.md,
            overflow: 'hidden'
          }}>
            {/* Timeline Base Line */}
            <div style={{
              position: 'absolute',
              top: '60px',
              left: '5%',
              right: '5%',
              height: '4px',
              background: modernChatTheme.colors.neutral.border,
              borderRadius: '2px'
            }} />

            {/* Progress Line (Static Demo) */}
            <div style={{
              position: 'absolute',
              top: '60px',
              left: '5%',
              width: '25%', // Demo: shows as if 25% complete
              height: '4px',
              background: `linear-gradient(90deg, ${modernChatTheme.colors.personas.gasnelio.primary}, ${modernChatTheme.colors.personas.ga.primary})`,
              borderRadius: '2px',
              transition: modernChatTheme.transitions.medium
            }} />

            {/* Milestones */}
            {template.milestones.map((milestone, index) => {
              const position = getTimelinePosition(milestone.day);
              const isActive = selectedMilestone === index;
              const isDemo = index < 2; // Demo: first 2 milestones "completed"

              return (
                <div
                  key={index}
                  onMouseEnter={() => setSelectedMilestone(index)}
                  onMouseLeave={() => setSelectedMilestone(null)}
                  style={{
                    position: 'absolute',
                    left: `${Math.max(5, Math.min(90, position))}%`,
                    top: '45px',
                    width: '30px',
                    height: '30px',
                    background: isDemo 
                      ? getMilestoneColor(milestone.type)
                      : 'white',
                    border: `3px solid ${getMilestoneColor(milestone.type)}`,
                    borderRadius: '50%',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    transition: modernChatTheme.transitions.fast,
                    transform: isActive ? 'scale(1.2)' : 'scale(1)',
                    zIndex: isActive ? 10 : 1,
                    boxShadow: isActive ? modernChatTheme.shadows.moderate : 'none'
                  }}
                >
                  {getMilestoneIcon(milestone.type, isDemo)}
                </div>
              );
            })}

            {/* Tooltip */}
            {selectedMilestone !== null && (
              <div style={{
                position: 'absolute',
                left: `${Math.max(5, Math.min(70, getTimelinePosition(template.milestones[selectedMilestone].day)))}%`,
                top: '5px',
                background: 'rgba(0, 0, 0, 0.9)',
                color: 'white',
                padding: modernChatTheme.spacing.sm,
                borderRadius: modernChatTheme.borderRadius.sm,
                fontSize: '12px',
                whiteSpace: 'nowrap',
                zIndex: 20,
                maxWidth: '200px',
                textAlign: 'center'
              }}>
                <div style={{ fontWeight: '600' }}>
                  {template.milestones[selectedMilestone].title}
                </div>
                <div style={{ fontSize: '10px', opacity: 0.8 }}>
                  Dia {template.milestones[selectedMilestone].day} • {formatDayToDate(template.milestones[selectedMilestone].day)}
                </div>
              </div>
            )}
          </div>

          {/* Timeline Legend */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '11px',
            color: modernChatTheme.colors.neutral.textMuted,
            marginTop: modernChatTheme.spacing.md
          }}>
            <span>📅 Início</span>
            <span>🗓️ {Math.round(template.duration / 4)} dias</span>
            <span>📊 {Math.round(template.duration / 2)} dias</span>
            <span>🎯 {Math.round(template.duration * 3/4)} dias</span>
            <span>✅ Conclusão ({template.duration} dias)</span>
          </div>
        </div>
      )}

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <CalendarView milestones={template.milestones} protocol={protocol} />
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <ListView milestones={template.milestones} protocol={protocol} />
      )}

      {/* Call to Action */}
      <div style={{
        marginTop: modernChatTheme.spacing.xl,
        padding: modernChatTheme.spacing.xl,
        background: `linear-gradient(135deg, ${modernChatTheme.colors.personas.gasnelio.primary}10, ${modernChatTheme.colors.personas.ga.primary}10)`,
        borderRadius: modernChatTheme.borderRadius.lg,
        textAlign: 'center',
        border: `1px solid ${modernChatTheme.colors.neutral.border}`
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '700',
          color: modernChatTheme.colors.neutral.text,
          marginBottom: modernChatTheme.spacing.sm
        }}>
          ⏰ Pronto para um cronograma personalizado?
        </h3>
        <p style={{
          fontSize: modernChatTheme.typography.meta.fontSize,
          color: modernChatTheme.colors.neutral.textMuted,
          marginBottom: modernChatTheme.spacing.lg
        }}>
          Faça login para criar cronogramas personalizados, receber lembretes automáticos, 
          acompanhar progresso real e integrar com agenda médica.
        </p>
        
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: modernChatTheme.spacing.lg,
          flexWrap: 'wrap',
          fontSize: '12px',
          color: modernChatTheme.colors.neutral.textMuted
        }}>
          <span>⏰ Lembretes automáticos</span>
          <span>📱 Sincronização mobile</span>
          <span>👥 Compartilhar com equipe</span>
          <span>📊 Relatórios de adesão</span>
        </div>
      </div>
    </div>
  );
}

// Calendar View Component
function CalendarView({ 
  milestones, 
  protocol 
}: { 
  milestones: any[], 
  protocol: string 
}) {
  return (
    <div style={{
      background: 'white',
      border: `1px solid ${modernChatTheme.colors.neutral.border}`,
      borderRadius: modernChatTheme.borderRadius.lg,
      padding: modernChatTheme.spacing.xl
    }}>
      <h3 style={{
        fontSize: '18px',
        fontWeight: '600',
        color: modernChatTheme.colors.neutral.text,
        marginBottom: modernChatTheme.spacing.lg,
        textAlign: 'center'
      }}>
        📅 Visão Calendário - {protocol === 'adulto' ? 'Protocolo Adulto' : 'Protocolo Pediátrico'}
      </h3>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: modernChatTheme.spacing.lg
      }}>
        {milestones.map((milestone, index) => (
          <div
            key={index}
            style={{
              padding: modernChatTheme.spacing.lg,
              border: `1px solid ${modernChatTheme.colors.neutral.border}`,
              borderRadius: modernChatTheme.borderRadius.md,
              background: index < 2 
                ? modernChatTheme.colors.status.success + '10'
                : modernChatTheme.colors.background.secondary
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: modernChatTheme.spacing.sm,
              marginBottom: modernChatTheme.spacing.md
            }}>
              <span style={{ fontSize: '24px' }}>
                {index < 2 ? '✅' : milestone.type === 'start' ? '🚀' : 
                 milestone.type === 'monthly_visit' ? '📋' : 
                 milestone.type === 'completion' ? '🎯' : '👁️'}
              </span>
              <div>
                <h4 style={{
                  fontSize: modernChatTheme.typography.persona.fontSize,
                  fontWeight: '600',
                  color: modernChatTheme.colors.neutral.text,
                  marginBottom: modernChatTheme.spacing.xs
                }}>
                  {milestone.title}
                </h4>
                <p style={{
                  fontSize: '12px',
                  color: modernChatTheme.colors.neutral.textMuted,
                  margin: 0
                }}>
                  Dia {milestone.day} • {milestone.day === 0 ? 'Hoje' : `${Math.round(milestone.day / 7)} semanas`}
                </p>
              </div>
            </div>

            <p style={{
              fontSize: modernChatTheme.typography.meta.fontSize,
              color: modernChatTheme.colors.neutral.textMuted,
              marginBottom: modernChatTheme.spacing.md,
              lineHeight: '1.4'
            }}>
              {milestone.description}
            </p>

            <div>
              <h5 style={{
                fontSize: '12px',
                fontWeight: '600',
                color: modernChatTheme.colors.neutral.text,
                marginBottom: modernChatTheme.spacing.xs
              }}>
                🎯 Objetivos:
              </h5>
              <ul style={{
                margin: 0,
                paddingLeft: modernChatTheme.spacing.md,
                fontSize: '11px',
                color: modernChatTheme.colors.neutral.textMuted,
                lineHeight: '1.4'
              }}>
                {milestone.objectives.map((objective: string, objIndex: number) => (
                  <li key={objIndex} style={{ marginBottom: modernChatTheme.spacing.xs }}>
                    {objective}
                  </li>
                ))}
              </ul>
            </div>

            {index < 2 && (
              <div style={{
                marginTop: modernChatTheme.spacing.md,
                padding: modernChatTheme.spacing.xs,
                background: '#10B981' + '20',
                borderRadius: modernChatTheme.borderRadius.sm,
                fontSize: '11px',
                color: '#10B981',
                fontWeight: '600',
                textAlign: 'center'
              }}>
                ✅ DEMO: Marco concluído
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// List View Component
function ListView({ 
  milestones, 
  protocol 
}: { 
  milestones: any[], 
  protocol: string 
}) {
  return (
    <div style={{
      background: 'white',
      border: `1px solid ${modernChatTheme.colors.neutral.border}`,
      borderRadius: modernChatTheme.borderRadius.lg,
      padding: modernChatTheme.spacing.xl
    }}>
      <h3 style={{
        fontSize: '18px',
        fontWeight: '600',
        color: modernChatTheme.colors.neutral.text,
        marginBottom: modernChatTheme.spacing.lg,
        textAlign: 'center'
      }}>
        📋 Lista Cronológica - {protocol === 'adulto' ? 'Protocolo Adulto' : 'Protocolo Pediátrico'}
      </h3>

      <div style={{ display: 'grid', gap: modernChatTheme.spacing.sm }}>
        {milestones.map((milestone, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: modernChatTheme.spacing.md,
              padding: modernChatTheme.spacing.md,
              border: `1px solid ${modernChatTheme.colors.neutral.border}`,
              borderRadius: modernChatTheme.borderRadius.md,
              background: index < 2 
                ? modernChatTheme.colors.status.success + '10'
                : 'white',
              borderLeft: `4px solid ${
                index < 2 
                  ? modernChatTheme.colors.status.success
                  : modernChatTheme.colors.neutral.border
              }`
            }}
          >
            <div style={{
              fontSize: '24px',
              minWidth: '40px',
              textAlign: 'center'
            }}>
              {index < 2 ? '✅' : milestone.type === 'start' ? '🚀' : 
               milestone.type === 'monthly_visit' ? '📋' : 
               milestone.type === 'completion' ? '🎯' : '👁️'}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: modernChatTheme.spacing.md,
                marginBottom: modernChatTheme.spacing.xs
              }}>
                <h4 style={{
                  fontSize: modernChatTheme.typography.persona.fontSize,
                  fontWeight: '600',
                  color: modernChatTheme.colors.neutral.text,
                  margin: 0
                }}>
                  {milestone.title}
                </h4>
                
                <span style={{
                  padding: `${modernChatTheme.spacing.xs} ${modernChatTheme.spacing.sm}`,
                  background: modernChatTheme.colors.personas.gasnelio.alpha,
                  color: modernChatTheme.colors.personas.gasnelio.primary,
                  borderRadius: modernChatTheme.borderRadius.sm,
                  fontSize: '10px',
                  fontWeight: '600'
                }}>
                  DIA {milestone.day}
                </span>
              </div>

              <p style={{
                fontSize: modernChatTheme.typography.meta.fontSize,
                color: modernChatTheme.colors.neutral.textMuted,
                margin: `0 0 ${modernChatTheme.spacing.sm} 0`,
                lineHeight: '1.4'
              }}>
                {milestone.description}
              </p>

              <div style={{
                fontSize: '11px',
                color: modernChatTheme.colors.neutral.textMuted
              }}>
                <strong>Objetivos:</strong> {milestone.objectives.join(' • ')}
              </div>
            </div>

            {milestone.doseNumber && (
              <div style={{
                padding: modernChatTheme.spacing.sm,
                background: modernChatTheme.colors.personas.ga.alpha,
                color: modernChatTheme.colors.personas.ga.primary,
                borderRadius: modernChatTheme.borderRadius.md,
                textAlign: 'center',
                minWidth: '60px'
              }}>
                <div style={{ fontSize: '14px', fontWeight: '700' }}>
                  {milestone.doseNumber}ª
                </div>
                <div style={{ fontSize: '10px' }}>
                  DOSE
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
