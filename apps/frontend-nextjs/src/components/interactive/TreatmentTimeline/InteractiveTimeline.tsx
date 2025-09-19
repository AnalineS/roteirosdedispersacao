'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  TreatmentTimeline,
  TimelineMilestone,
  ScheduledAppointment,
  AdherenceRecord,
  TimelineConfig,
  calculateTimelineProgress,
  calculateAdherenceRate,
  getNextMilestone,
  getDaysUntilNext,
  getTreatmentPhase
} from '@/types/timeline';
import { modernChatTheme } from '@/config/modernTheme';

interface MilestonesTabProps {
  timeline: TreatmentTimeline;
  config: TimelineConfig;
  onMilestoneToggle: (milestoneId: string) => void;
  onMilestoneNote: (milestoneId: string, note: string) => void;
  selectedMilestone: string | null;
  onMilestoneSelect: (milestoneId: string | null) => void;
}

interface AdherenceTabProps {
  timeline: TreatmentTimeline;
  config: TimelineConfig;
  onAdherenceRecord: (record: Partial<AdherenceRecord>) => void;
}

interface AppointmentsTabProps {
  timeline: TreatmentTimeline;
  config: TimelineConfig;
  onAppointmentSchedule: (appointment: ScheduledAppointment) => void;
}

interface ReminderModalProps {
  timeline: TreatmentTimeline;
  onClose: () => void;
  onUpdate: (timeline: TreatmentTimeline) => void;
}

interface InteractiveTimelineProps {
  timeline: TreatmentTimeline;
  config: TimelineConfig;
  onTimelineUpdate?: (timeline: TreatmentTimeline) => void;
  onMilestoneComplete?: (milestone: TimelineMilestone) => void;
  onAppointmentSchedule?: (appointment: ScheduledAppointment) => void;
}

export default function InteractiveTimeline({
  timeline: initialTimeline,
  config,
  onTimelineUpdate,
  onMilestoneComplete,
  onAppointmentSchedule
}: InteractiveTimelineProps) {
  const [timeline, setTimeline] = useState<TreatmentTimeline>(initialTimeline);
  const [activeTab, setActiveTab] = useState<'overview' | 'milestones' | 'adherence' | 'appointments'>('overview');
  const [selectedMilestone, setSelectedMilestone] = useState<string | null>(null);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [newNote, setNewNote] = useState('');

  // Auto-save functionality
  useEffect(() => {
    if (config.allowEdit) {
      const saveTimer = setTimeout(() => {
        onTimelineUpdate?.(timeline);
      }, 5000);

      return () => clearTimeout(saveTimer);
    }
  }, [timeline, config.allowEdit, onTimelineUpdate]);

  const handleMilestoneToggle = useCallback((milestoneId: string) => {
    if (!config.allowEdit) return;

    setTimeline(prevTimeline => {
      const newTimeline = { ...prevTimeline };
      const milestone = newTimeline.milestones.find(m => m.id === milestoneId);
      
      if (milestone) {
        milestone.completed = !milestone.completed;
        milestone.completedDate = milestone.completed ? new Date() : undefined;
        milestone.status = milestone.completed ? 'completed' : 'pending';

        if (milestone.completed) {
          onMilestoneComplete?.(milestone);
        }

        // Update overall timeline status
        const allCompleted = newTimeline.milestones.every(m => m.completed);
        if (allCompleted && newTimeline.status === 'active') {
          newTimeline.status = 'completed';
          newTimeline.endDate = new Date();
        }
      }

      return newTimeline;
    });
  }, [config.allowEdit, onMilestoneComplete]);

  const handleMilestoneNote = useCallback((milestoneId: string, note: string) => {
    if (!config.allowEdit) return;

    setTimeline(prevTimeline => {
      const newTimeline = { ...prevTimeline };
      const milestone = newTimeline.milestones.find(m => m.id === milestoneId);
      
      if (milestone) {
        milestone.notes = note;
      }

      return newTimeline;
    });
  }, [config.allowEdit]);

  const handleAdherenceRecord = useCallback((record: Partial<AdherenceRecord>) => {
    if (!config.allowAdherenceTracking) return;

    setTimeline(prevTimeline => ({
      ...prevTimeline,
      adherenceData: [
        ...prevTimeline.adherenceData,
        {
          id: `adh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          date: new Date(),
          taken: false,
          patientReported: true,
          verificationMethod: 'patient_report',
          adherenceScore: 100,
          ...record
        } as AdherenceRecord
      ]
    }));
  }, [config.allowAdherenceTracking]);

  const progress = calculateTimelineProgress(timeline);
  const adherenceRate = calculateAdherenceRate(timeline);
  const nextMilestone = getNextMilestone(timeline);
  const daysUntilNext = getDaysUntilNext(timeline);
  const treatmentPhase = getTreatmentPhase(timeline);

  const getPhaseColor = () => {
    switch (treatmentPhase) {
      case 'initial': return '#3B82F6';
      case 'continuation': return modernChatTheme.colors.personas.gasnelio.primary;
      case 'final': return '#F59E0B';
      case 'follow_up': return modernChatTheme.colors.personas.ga.primary;
      default: return modernChatTheme.colors.neutral.textMuted;
    }
  };

  const getStatusColor = () => {
    switch (timeline.status) {
      case 'active': return '#10B981';
      case 'completed': return '#10B981';
      case 'interrupted': return '#EF4444';
      case 'paused': return '#F59E0B';
      default: return modernChatTheme.colors.neutral.textMuted;
    }
  };

  return (
    <div>
      {/* Header with Timeline Status */}
      <div style={{
        background: `linear-gradient(135deg, ${modernChatTheme.colors.personas.gasnelio.primary}15, ${modernChatTheme.colors.personas.ga.primary}15)`,
        padding: modernChatTheme.spacing.xl,
        borderRadius: modernChatTheme.borderRadius.lg,
        marginBottom: modernChatTheme.spacing.lg,
        border: `1px solid ${modernChatTheme.colors.neutral.border}`
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: modernChatTheme.spacing.lg
        }}>
          <div>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '700',
              color: modernChatTheme.colors.neutral.text,
              marginBottom: modernChatTheme.spacing.xs
            }}>
              📅 Cronograma de Tratamento
            </h2>
            
            <div style={{
              fontSize: modernChatTheme.typography.meta.fontSize,
              color: modernChatTheme.colors.neutral.textMuted,
              display: 'flex',
              gap: modernChatTheme.spacing.md,
              flexWrap: 'wrap'
            }}>
              {timeline.patientName && <span>👤 {timeline.patientName}</span>}
              <span>🏥 Protocolo {timeline.protocol}</span>
              <span>📊 Dose {timeline.currentDose}/{timeline.totalDoses}</span>
              <span>📅 Iniciado: {timeline.startDate.toLocaleDateString('pt-BR')}</span>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: modernChatTheme.spacing.md
          }}>
            <span style={{
              padding: `${modernChatTheme.spacing.xs} ${modernChatTheme.spacing.sm}`,
              background: getStatusColor() + '20',
              color: getStatusColor(),
              borderRadius: modernChatTheme.borderRadius.sm,
              fontSize: '12px',
              fontWeight: '600',
              textTransform: 'uppercase'
            }}>
              {timeline.status === 'active' && '🔄 ATIVO'}
              {timeline.status === 'completed' && '✅ CONCLUÍDO'}
              {timeline.status === 'paused' && '⏸️ PAUSADO'}
              {timeline.status === 'interrupted' && '⚠️ INTERROMPIDO'}
            </span>
            
            <span style={{
              padding: `${modernChatTheme.spacing.xs} ${modernChatTheme.spacing.sm}`,
              background: getPhaseColor() + '20',
              color: getPhaseColor(),
              borderRadius: modernChatTheme.borderRadius.sm,
              fontSize: '12px',
              fontWeight: '600',
              textTransform: 'uppercase'
            }}>
              {treatmentPhase === 'initial' && '🚀 INÍCIO'}
              {treatmentPhase === 'continuation' && '📋 CONTINUAÇÃO'}
              {treatmentPhase === 'final' && '🎯 FINAL'}
              {treatmentPhase === 'follow_up' && '👁️ SEGUIMENTO'}
            </span>
          </div>
        </div>

        {/* Progress and Metrics */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: modernChatTheme.spacing.lg,
          marginBottom: modernChatTheme.spacing.lg
        }}>
          {/* Overall Progress */}
          <div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: modernChatTheme.spacing.xs
            }}>
              <span style={{
                fontSize: modernChatTheme.typography.meta.fontSize,
                fontWeight: '600',
                color: modernChatTheme.colors.neutral.text
              }}>
                📊 Progresso Geral
              </span>
              <span style={{
                fontSize: '16px',
                fontWeight: '700',
                color: modernChatTheme.colors.personas.gasnelio.primary
              }}>
                {progress}%
              </span>
            </div>
            
            <div style={{
              background: modernChatTheme.colors.background.secondary,
              height: '8px',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                background: `linear-gradient(90deg, ${modernChatTheme.colors.personas.gasnelio.primary}, ${modernChatTheme.colors.personas.ga.primary})`,
                height: '100%',
                width: `${progress}%`,
                transition: modernChatTheme.transitions.medium
              }} />
            </div>
          </div>

          {/* Adherence Rate */}
          {config.allowAdherenceTracking && (
            <div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: modernChatTheme.spacing.xs
              }}>
                <span style={{
                  fontSize: modernChatTheme.typography.meta.fontSize,
                  fontWeight: '600',
                  color: modernChatTheme.colors.neutral.text
                }}>
                  💊 Taxa de Adesão
                </span>
                <span style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  color: adherenceRate >= 80 
                    ? '#10B981'
                    : adherenceRate >= 60 
                      ? '#F59E0B'
                      : '#EF4444'
                }}>
                  {adherenceRate}%
                </span>
              </div>
              
              <div style={{
                background: modernChatTheme.colors.background.secondary,
                height: '8px',
                borderRadius: '4px',
                overflow: 'hidden'
              }}>
                <div style={{
                  background: adherenceRate >= 80 
                    ? '#10B981'
                    : adherenceRate >= 60 
                      ? '#F59E0B'
                      : '#EF4444',
                  height: '100%',
                  width: `${adherenceRate}%`,
                  transition: modernChatTheme.transitions.medium
                }} />
              </div>
            </div>
          )}

          {/* Next Milestone */}
          {nextMilestone && (
            <div>
              <div style={{
                fontSize: modernChatTheme.typography.meta.fontSize,
                fontWeight: '600',
                color: modernChatTheme.colors.neutral.text,
                marginBottom: modernChatTheme.spacing.xs
              }}>
                ⏰ Próximo Marco
              </div>
              <div style={{
                fontSize: '12px',
                color: modernChatTheme.colors.neutral.textMuted
              }}>
                <div style={{ fontWeight: '600', color: modernChatTheme.colors.neutral.text }}>
                  {nextMilestone.title}
                </div>
                <div>
                  {daysUntilNext > 0 
                    ? `Em ${daysUntilNext} dia${daysUntilNext > 1 ? 's' : ''}`
                    : 'Hoje'
                  } • {nextMilestone.scheduledDate.toLocaleDateString('pt-BR')}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: modernChatTheme.spacing.md,
          flexWrap: 'wrap'
        }}>
          {config.allowEdit && (
            <>
              <button
                onClick={() => setShowReminderModal(true)}
                disabled={!config.allowReminders}
                style={{
                  padding: `${modernChatTheme.spacing.xs} ${modernChatTheme.spacing.sm}`,
                  background: config.allowReminders 
                    ? modernChatTheme.colors.personas.ga.primary
                    : modernChatTheme.colors.neutral.textMuted,
                  color: 'white',
                  border: 'none',
                  borderRadius: modernChatTheme.borderRadius.sm,
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: config.allowReminders ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: modernChatTheme.spacing.xs
                }}
              >
                🔔 Configurar Lembretes
              </button>

              <button
                onClick={() => {/* TODO: Implement export */}}
                disabled={!config.allowExport}
                style={{
                  padding: `${modernChatTheme.spacing.xs} ${modernChatTheme.spacing.sm}`,
                  background: config.allowExport 
                    ? modernChatTheme.colors.personas.gasnelio.primary
                    : modernChatTheme.colors.neutral.textMuted,
                  color: 'white',
                  border: 'none',
                  borderRadius: modernChatTheme.borderRadius.sm,
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: config.allowExport ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: modernChatTheme.spacing.xs
                }}
              >
                📊 Exportar Relatório
              </button>
            </>
          )}

          {nextMilestone && timeline.status === 'active' && (
            <button
              onClick={() => handleMilestoneToggle(nextMilestone.id)}
              style={{
                padding: `${modernChatTheme.spacing.xs} ${modernChatTheme.spacing.sm}`,
                background: '#10B981',
                color: 'white',
                border: 'none',
                borderRadius: modernChatTheme.borderRadius.sm,
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: modernChatTheme.spacing.xs
              }}
            >
              ✅ Marcar Próximo Marco
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: `1px solid ${modernChatTheme.colors.neutral.border}`,
        marginBottom: modernChatTheme.spacing.lg,
        background: 'white',
        borderRadius: `${modernChatTheme.borderRadius.md} ${modernChatTheme.borderRadius.md} 0 0`
      }}>
        {[
          { key: 'overview', label: '📊 Visão Geral', count: null },
          { key: 'milestones', label: '🎯 Marcos', count: timeline.milestones.filter(m => m.completed).length },
          { key: 'adherence', label: '💊 Adesão', count: config.allowAdherenceTracking ? timeline.adherenceData.length : null },
          { key: 'appointments', label: '📅 Consultas', count: timeline.appointments.length }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as 'overview' | 'milestones' | 'adherence' | 'appointments')}
            style={{
              flex: 1,
              padding: modernChatTheme.spacing.md,
              border: 'none',
              background: activeTab === tab.key ? 'white' : 'transparent',
              color: activeTab === tab.key
                ? modernChatTheme.colors.personas.gasnelio.primary
                : modernChatTheme.colors.neutral.textMuted,
              fontSize: modernChatTheme.typography.meta.fontSize,
              fontWeight: activeTab === tab.key ? '600' : '400',
              cursor: 'pointer',
              borderBottom: activeTab === tab.key 
                ? `2px solid ${modernChatTheme.colors.personas.gasnelio.primary}`
                : '2px solid transparent',
              transition: modernChatTheme.transitions.fast
            }}
          >
            {tab.label} {tab.count !== null && tab.count > 0 && `(${tab.count})`}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && (
          <OverviewTab 
            timeline={timeline} 
            config={config} 
            onMilestoneSelect={setSelectedMilestone}
          />
        )}

        {activeTab === 'milestones' && (
          <MilestonesTab 
            timeline={timeline}
            config={config}
            onMilestoneToggle={handleMilestoneToggle}
            onMilestoneNote={handleMilestoneNote}
            selectedMilestone={selectedMilestone}
            onMilestoneSelect={setSelectedMilestone}
          />
        )}

        {activeTab === 'adherence' && config.allowAdherenceTracking && (
          <AdherenceTab 
            timeline={timeline}
            config={config}
            onAdherenceRecord={handleAdherenceRecord}
          />
        )}

        {activeTab === 'appointments' && (
          <AppointmentsTab 
            timeline={timeline}
            config={config}
            onAppointmentSchedule={onAppointmentSchedule}
          />
        )}
      </div>

      {/* Reminder Modal */}
      {showReminderModal && (
        <ReminderModal
          timeline={timeline}
          onClose={() => setShowReminderModal(false)}
          onUpdate={setTimeline}
        />
      )}
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ 
  timeline, 
  config, 
  onMilestoneSelect 
}: {
  timeline: TreatmentTimeline;
  config: TimelineConfig;
  onMilestoneSelect: (id: string) => void;
}) {
  const totalDays = Math.ceil((timeline.endDate.getTime() - timeline.startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  return (
    <div style={{ display: 'grid', gap: modernChatTheme.spacing.lg }}>
      {/* Timeline Visualization */}
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
          📊 Linha do Tempo do Tratamento
        </h3>

        {/* Visual Timeline */}
        <div style={{
          position: 'relative',
          height: '120px',
          margin: `${modernChatTheme.spacing.xl} 0`,
          background: modernChatTheme.colors.background.secondary,
          borderRadius: modernChatTheme.borderRadius.md,
          overflow: 'hidden'
        }}>
          {/* Base Line */}
          <div style={{
            position: 'absolute',
            top: '60px',
            left: '5%',
            right: '5%',
            height: '4px',
            background: modernChatTheme.colors.neutral.border,
            borderRadius: '2px'
          }} />

          {/* Progress Line */}
          <div style={{
            position: 'absolute',
            top: '60px',
            left: '5%',
            width: `${Math.min(90, calculateTimelineProgress(timeline) * 0.9)}%`,
            height: '4px',
            background: `linear-gradient(90deg, ${modernChatTheme.colors.personas.gasnelio.primary}, ${modernChatTheme.colors.personas.ga.primary})`,
            borderRadius: '2px',
            transition: modernChatTheme.transitions.medium
          }} />

          {/* Milestones */}
          {timeline.milestones.map((milestone, index) => {
            const daysPassed = Math.ceil((milestone.scheduledDate.getTime() - timeline.startDate.getTime()) / (1000 * 60 * 60 * 24));
            const position = Math.max(5, Math.min(90, (daysPassed / totalDays) * 85 + 5));

            return (
              <div
                key={milestone.id}
                onClick={() => onMilestoneSelect(milestone.id)}
                style={{
                  position: 'absolute',
                  left: `${position}%`,
                  top: '45px',
                  width: '30px',
                  height: '30px',
                  background: milestone.completed 
                    ? '#10B981'
                    : 'white',
                  border: `3px solid ${
                    milestone.completed 
                      ? '#10B981'
                      : modernChatTheme.colors.personas.gasnelio.primary
                  }`,
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  transition: modernChatTheme.transitions.fast,
                  zIndex: 1
                }}
                title={milestone.title}
              >
                {milestone.completed ? '✅' : index + 1}
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: modernChatTheme.spacing.lg
      }}>
        <SummaryCard
          icon="🎯"
          title="Marcos Concluídos"
          value={`${timeline.milestones.filter(m => m.completed).length}/${timeline.milestones.length}`}
          subtitle="marcos do tratamento"
          color={'#10B981'}
        />

        <SummaryCard
          icon="💊"
          title="Dose Atual"
          value={`${timeline.currentDose}/${timeline.totalDoses}`}
          subtitle="doses supervisionadas"
          color={modernChatTheme.colors.personas.gasnelio.primary}
        />

        {config.allowAdherenceTracking && (
          <SummaryCard
            icon="📊"
            title="Taxa de Adesão"
            value={`${calculateAdherenceRate(timeline)}%`}
            subtitle="das doses tomadas"
            color={modernChatTheme.colors.personas.ga.primary}
          />
        )}

        <SummaryCard
          icon="⚠️"
          title="Eventos Adversos"
          value={`${timeline.adverseEvents.length}`}
          subtitle="registrados"
          color={timeline.adverseEvents.length > 0 
            ? '#F59E0B'
            : '#10B981'
          }
        />
      </div>
    </div>
  );
}

// Summary Card Component
function SummaryCard({ 
  icon, 
  title, 
  value, 
  subtitle, 
  color 
}: {
  icon: string;
  title: string;
  value: string;
  subtitle: string;
  color: string;
}) {
  return (
    <div style={{
      background: 'white',
      border: `1px solid ${modernChatTheme.colors.neutral.border}`,
      borderRadius: modernChatTheme.borderRadius.md,
      padding: modernChatTheme.spacing.lg,
      textAlign: 'center'
    }}>
      <div style={{ fontSize: '24px', marginBottom: modernChatTheme.spacing.sm }}>
        {icon}
      </div>
      <h4 style={{
        fontSize: modernChatTheme.typography.persona.fontSize,
        fontWeight: '600',
        color: modernChatTheme.colors.neutral.text,
        marginBottom: modernChatTheme.spacing.xs
      }}>
        {title}
      </h4>
      <div style={{
        fontSize: '24px',
        fontWeight: '700',
        color,
        marginBottom: modernChatTheme.spacing.xs
      }}>
        {value}
      </div>
      <p style={{
        fontSize: '12px',
        color: modernChatTheme.colors.neutral.textMuted,
        margin: 0
      }}>
        {subtitle}
      </p>
    </div>
  );
}

// Placeholder components (to be implemented)
function MilestonesTab({ timeline, config, onMilestoneToggle, onMilestoneNote, selectedMilestone, onMilestoneSelect }: MilestonesTabProps) {
  return (
    <div style={{
      background: 'white',
      border: `1px solid ${modernChatTheme.colors.neutral.border}`,
      borderRadius: modernChatTheme.borderRadius.lg,
      padding: modernChatTheme.spacing.xl,
      textAlign: 'center'
    }}>
      <h3>🎯 Marcos do Tratamento</h3>
      <p style={{ color: modernChatTheme.colors.neutral.textMuted }}>
        Funcionalidade em desenvolvimento - Gerenciamento detalhado dos marcos do tratamento
      </p>
    </div>
  );
}

function AdherenceTab({ timeline, config, onAdherenceRecord }: AdherenceTabProps) {
  return (
    <div style={{
      background: 'white',
      border: `1px solid ${modernChatTheme.colors.neutral.border}`,
      borderRadius: modernChatTheme.borderRadius.lg,
      padding: modernChatTheme.spacing.xl,
      textAlign: 'center'
    }}>
      <h3>💊 Controle de Adesão</h3>
      <p style={{ color: modernChatTheme.colors.neutral.textMuted }}>
        Funcionalidade em desenvolvimento - Registro e monitoramento de adesão ao tratamento
      </p>
    </div>
  );
}

function AppointmentsTab({ timeline, config, onAppointmentSchedule }: AppointmentsTabProps) {
  return (
    <div style={{
      background: 'white',
      border: `1px solid ${modernChatTheme.colors.neutral.border}`,
      borderRadius: modernChatTheme.borderRadius.lg,
      padding: modernChatTheme.spacing.xl,
      textAlign: 'center'
    }}>
      <h3>📅 Agenda de Consultas</h3>
      <p style={{ color: modernChatTheme.colors.neutral.textMuted }}>
        Funcionalidade em desenvolvimento - Agendamento e controle de consultas
      </p>
    </div>
  );
}

function ReminderModal({ timeline, onClose, onUpdate }: ReminderModalProps) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: modernChatTheme.zIndex.modal
    }}>
      <div style={{
        background: 'white',
        padding: modernChatTheme.spacing.xl,
        borderRadius: modernChatTheme.borderRadius.lg,
        maxWidth: '400px',
        width: '90%'
      }}>
        <h3>🔔 Configurar Lembretes</h3>
        <p style={{ color: modernChatTheme.colors.neutral.textMuted }}>
          Funcionalidade de lembretes será implementada na próxima etapa.
        </p>
        <button onClick={onClose} style={{
          padding: modernChatTheme.spacing.sm,
          background: modernChatTheme.colors.personas.gasnelio.primary,
          color: 'white',
          border: 'none',
          borderRadius: modernChatTheme.borderRadius.sm,
          cursor: 'pointer'
        }}>
          Fechar
        </button>
      </div>
    </div>
  );
}
