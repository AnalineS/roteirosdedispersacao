'use client';

import React, { useState, useEffect } from 'react';
import { TreatmentTimeline, TimelineConfig, TREATMENT_TIMELINE_TEMPLATES } from '@/types/timeline';
import { modernChatTheme } from '@/config/modernTheme';
import StaticTimeline from './StaticTimeline';
import InteractiveTimeline from './InteractiveTimeline';

interface TreatmentTimelineProps {
  userType?: 'anonymous' | 'authenticated';
  protocol?: 'adulto' | 'pediatrico';
  patientName?: string;
  patientId?: string;
  onTimelineUpdate?: (timeline: TreatmentTimeline) => void;
  onMilestoneComplete?: (milestone: import('@/types/timeline').TimelineMilestone) => void;
}

export default function TreatmentTimelineContainer({
  userType = 'anonymous',
  protocol = 'adulto',
  patientName,
  patientId,
  onTimelineUpdate,
  onMilestoneComplete
}: TreatmentTimelineProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [timeline, setTimeline] = useState<TreatmentTimeline | null>(null);
  const [demoMode, setDemoMode] = useState(userType === 'anonymous');

  useEffect(() => {
    // Create timeline based on template
    const createTimeline = () => {
      const template = TREATMENT_TIMELINE_TEMPLATES[protocol];
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + (template.duration * 24 * 60 * 60 * 1000));

      const timelineMilestones = template.milestones.map((milestone, index) => ({
        id: `milestone_${index + 1}`,
        type: milestone.type,
        title: milestone.title,
        description: milestone.description,
        scheduledDate: new Date(startDate.getTime() + (milestone.day * 24 * 60 * 60 * 1000)),
        status: 'pending' as const,
        doseNumber: milestone.doseNumber ?? undefined,
        objectives: milestone.objectives,
        completed: userType === 'authenticated' && index < 1, // Demo: first milestone completed for auth users
        completedDate: userType === 'authenticated' && index < 1 ? new Date() : undefined,
        responsibleProfessional: 'Dr. Farmacêutico',
        assessments: []
      }));

      const newTimeline: TreatmentTimeline = {
        id: `timeline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        patientId,
        patientName,
        startDate,
        endDate,
        totalDoses: template.totalDoses,
        currentDose: userType === 'authenticated' ? 1 : 0,
        protocol,
        status: 'active',
        milestones: timelineMilestones,
        appointments: [],
        adherenceData: userType === 'authenticated' ? createDemoAdherenceData(startDate) : [],
        adverseEvents: [],
        qualityIndicators: {
          overallAdherence: userType === 'authenticated' ? 95 : 0,
          appointmentCompliance: userType === 'authenticated' ? 100 : 0,
          dosesMissed: 0,
          adverseEventsCount: 0,
          clinicalImprovement: true,
          pharmacistInterventions: 0
        }
      };

      return newTimeline;
    };

    setTimeline(createTimeline());
    setIsLoading(false);
  }, [protocol, patientName, patientId, userType]);

  // Create demo adherence data for authenticated users
  const createDemoAdherenceData = (startDate: Date) => {
    const adherenceData = [];
    const today = new Date();
    
    // Create records for the past 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today.getTime() - (i * 24 * 60 * 60 * 1000));
      if (date >= startDate) {
        adherenceData.push({
          id: `adh_${date.getTime()}`,
          date,
          doseType: 'self_administered' as const,
          medication: 'combination' as const,
          taken: Math.random() > 0.1, // 90% adherence rate
          takenAt: Math.random() > 0.1 ? new Date(date.getTime() + (20 * 60 * 60 * 1000)) : undefined,
          patientReported: true,
          verificationMethod: 'patient_report' as const,
          adherenceScore: Math.random() > 0.1 ? 100 : 0
        });
      }
    }
    
    return adherenceData;
  };

  const timelineConfig: TimelineConfig = {
    userType,
    allowEdit: userType === 'authenticated',
    allowReminders: userType === 'authenticated',
    allowExport: userType === 'authenticated',
    allowAdherenceTracking: userType === 'authenticated',
    showDetailedMetrics: userType === 'authenticated',
    enableNotifications: userType === 'authenticated'
  };

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: modernChatTheme.spacing.md
    }}>
      {/* Header with Mode Info */}
      <div style={{
        marginBottom: modernChatTheme.spacing.xl,
        textAlign: 'center'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: modernChatTheme.spacing.sm,
          padding: `${modernChatTheme.spacing.sm} ${modernChatTheme.spacing.lg}`,
          background: userType === 'authenticated' 
            ? '#10B981' + '15'
            : '#3B82F6' + '15',
          border: `1px solid ${
            userType === 'authenticated' 
              ? '#10B981' + '30'
              : '#3B82F6' + '30'
          }`,
          borderRadius: modernChatTheme.borderRadius.lg,
          fontSize: modernChatTheme.typography.meta.fontSize,
          fontWeight: '600',
          color: userType === 'authenticated' 
            ? '#10B981'
            : '#3B82F6'
        }}>
          {userType === 'authenticated' ? (
            <>
              ⏰ <span>CRONOGRAMA INTERATIVO</span> • Personalizado com lembretes e acompanhamento
            </>
          ) : (
            <>
              📅 <span>CRONOGRAMA DEMONSTRATIVO</span> • Exemplo estático do protocolo
            </>
          )}
        </div>
      </div>

      {/* Protocol Selector for anonymous users */}
      {userType === 'anonymous' && (
        <div style={{
          marginBottom: modernChatTheme.spacing.xl,
          display: 'flex',
          justifyContent: 'center'
        }}>
          <div style={{
            background: 'white',
            border: `1px solid ${modernChatTheme.colors.neutral.border}`,
            borderRadius: modernChatTheme.borderRadius.lg,
            padding: modernChatTheme.spacing.md,
            display: 'flex',
            gap: modernChatTheme.spacing.sm
          }}>
            <button
              onClick={() => window.location.reload()} // Simple reload to change protocol
              style={{
                padding: `${modernChatTheme.spacing.sm} ${modernChatTheme.spacing.lg}`,
                background: protocol === 'adulto' 
                  ? modernChatTheme.colors.personas.gasnelio.primary
                  : 'transparent',
                color: protocol === 'adulto' 
                  ? 'white'
                  : modernChatTheme.colors.neutral.textMuted,
                border: `1px solid ${modernChatTheme.colors.neutral.border}`,
                borderRadius: modernChatTheme.borderRadius.sm,
                fontSize: modernChatTheme.typography.meta.fontSize,
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              👨‍⚕️ Protocolo Adulto
            </button>
            <button
              onClick={() => {
                // For demo, we'll just show a tooltip
                alert('Para alternar protocolos, faça login na plataforma completa!');
              }}
              style={{
                padding: `${modernChatTheme.spacing.sm} ${modernChatTheme.spacing.lg}`,
                background: protocol === 'pediatrico' 
                  ? modernChatTheme.colors.personas.ga.primary
                  : 'transparent',
                color: protocol === 'pediatrico' 
                  ? 'white'
                  : modernChatTheme.colors.neutral.textMuted,
                border: `1px solid ${modernChatTheme.colors.neutral.border}`,
                borderRadius: modernChatTheme.borderRadius.sm,
                fontSize: modernChatTheme.typography.meta.fontSize,
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              👶 Protocolo Pediátrico
            </button>
          </div>
        </div>
      )}

      {/* Feature Comparison for anonymous users */}
      {userType === 'anonymous' && <TimelineFeatureComparison />}

      {/* Main Timeline Component */}
      {userType === 'authenticated' && timeline ? (
        <InteractiveTimeline
          timeline={timeline}
          config={timelineConfig}
          onTimelineUpdate={onTimelineUpdate}
          onMilestoneComplete={onMilestoneComplete}
        />
      ) : (
        <StaticTimeline
          protocol={protocol}
          showEducationalInfo={true}
        />
      )}
    </div>
  );
}

// Loading component
function LoadingState() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: modernChatTheme.spacing.xxl,
      textAlign: 'center'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: `3px solid ${modernChatTheme.colors.neutral.border}`,
        borderTop: `3px solid ${modernChatTheme.colors.personas.gasnelio.primary}`,
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: modernChatTheme.spacing.lg
      }} />
      
      <h3 style={{
        fontSize: '18px',
        fontWeight: '600',
        color: modernChatTheme.colors.neutral.text,
        marginBottom: modernChatTheme.spacing.sm
      }}>
        📅 Carregando Cronograma
      </h3>
      
      <p style={{
        fontSize: modernChatTheme.typography.meta.fontSize,
        color: modernChatTheme.colors.neutral.textMuted
      }}>
        Preparando cronograma baseado no protocolo PQT-U...
      </p>
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// Feature comparison for anonymous users
function TimelineFeatureComparison() {
  return (
    <div style={{
      marginBottom: modernChatTheme.spacing.xl,
      background: 'white',
      border: `1px solid ${modernChatTheme.colors.neutral.border}`,
      borderRadius: modernChatTheme.borderRadius.lg,
      overflow: 'hidden',
      boxShadow: modernChatTheme.shadows.subtle
    }}>
      <div style={{
        padding: modernChatTheme.spacing.lg,
        background: modernChatTheme.colors.background.secondary,
        borderBottom: `1px solid ${modernChatTheme.colors.neutral.border}`
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '700',
          color: modernChatTheme.colors.neutral.text,
          marginBottom: modernChatTheme.spacing.sm,
          textAlign: 'center'
        }}>
          ⚖️ Comparação: Timeline Demonstrativa vs Interativa
        </h3>
        <p style={{
          fontSize: modernChatTheme.typography.meta.fontSize,
          color: modernChatTheme.colors.neutral.textMuted,
          textAlign: 'center',
          margin: 0
        }}>
          Veja as diferenças entre o cronograma estático e a versão personalizada
        </p>
      </div>

      <div style={{ padding: modernChatTheme.spacing.lg }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: modernChatTheme.spacing.md,
          textAlign: 'center'
        }}>
          {/* Header */}
          <div style={{ fontWeight: '600', color: modernChatTheme.colors.neutral.text }}>
            Funcionalidade
          </div>
          <div style={{ 
            fontWeight: '600', 
            color: '#F59E0B',
            padding: modernChatTheme.spacing.sm,
            background: '#F59E0B' + '10',
            borderRadius: modernChatTheme.borderRadius.sm
          }}>
            📅 Demonstrativo (Atual)
          </div>
          <div style={{ 
            fontWeight: '600', 
            color: '#10B981',
            padding: modernChatTheme.spacing.sm,
            background: '#10B981' + '10',
            borderRadius: modernChatTheme.borderRadius.sm
          }}>
            ⏰ Interativo (Logado)
          </div>

          {/* Features */}
          {[
            { name: 'Visualizar cronograma', demo: '✅', interactive: '✅' },
            { name: 'Marcos personalizáveis', demo: '❌', interactive: '✅' },
            { name: 'Lembretes automáticos', demo: '❌', interactive: '✅' },
            { name: 'Controle de adesão', demo: '❌', interactive: '✅' },
            { name: 'Agenda integrada', demo: '❌', interactive: '✅' },
            { name: 'Relatórios de progresso', demo: '❌', interactive: '✅' },
            { name: 'Notificações mobile', demo: '❌', interactive: '✅' },
            { name: 'Sincronização equipe', demo: '❌', interactive: '✅' }
          ].map((feature, index) => (
            <React.Fragment key={index}>
              <div style={{
                padding: modernChatTheme.spacing.sm,
                fontSize: modernChatTheme.typography.meta.fontSize,
                color: modernChatTheme.colors.neutral.text,
                textAlign: 'left'
              }}>
                {feature.name}
              </div>
              <div style={{
                padding: modernChatTheme.spacing.sm,
                fontSize: modernChatTheme.typography.meta.fontSize,
                color: feature.demo === '✅' 
                  ? '#10B981'
                  : modernChatTheme.colors.neutral.textMuted
              }}>
                {feature.demo}
              </div>
              <div style={{
                padding: modernChatTheme.spacing.sm,
                fontSize: modernChatTheme.typography.meta.fontSize,
                color: '#10B981'
              }}>
                {feature.interactive}
              </div>
            </React.Fragment>
          ))}
        </div>

        {/* CTA */}
        <div style={{
          marginTop: modernChatTheme.spacing.lg,
          padding: modernChatTheme.spacing.lg,
          background: `linear-gradient(135deg, ${modernChatTheme.colors.personas.gasnelio.primary}10, ${modernChatTheme.colors.personas.ga.primary}10)`,
          borderRadius: modernChatTheme.borderRadius.md,
          textAlign: 'center'
        }}>
          <h4 style={{
            fontSize: modernChatTheme.typography.persona.fontSize,
            fontWeight: '700',
            color: modernChatTheme.colors.neutral.text,
            marginBottom: modernChatTheme.spacing.sm
          }}>
            ⏰ Precisa de um cronograma que realmente funciona?
          </h4>
          
          <p style={{
            fontSize: modernChatTheme.typography.meta.fontSize,
            color: modernChatTheme.colors.neutral.textMuted,
            marginBottom: modernChatTheme.spacing.lg
          }}>
            Faça login para criar cronogramas personalizados que se adaptam à rotina do seu paciente, 
            com lembretes inteligentes e acompanhamento automático de progresso.
          </p>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: modernChatTheme.spacing.lg,
            flexWrap: 'wrap',
            fontSize: '12px',
            color: modernChatTheme.colors.neutral.textMuted
          }}>
            <span>⏰ Lembretes via WhatsApp</span>
            <span>📱 App mobile sincronizado</span>
            <span>🤝 Compartilhamento com equipe</span>
            <span>📊 Analytics de adesão</span>
          </div>
        </div>
      </div>
    </div>
  );
}
