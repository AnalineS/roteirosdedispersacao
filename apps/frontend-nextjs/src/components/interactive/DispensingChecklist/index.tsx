'use client';

import React, { useState, useEffect } from 'react';
import { DISPENSING_WORKFLOW_TEMPLATE, WorkflowStage, DispensingSession } from '@/types/checklist';
import { modernChatTheme } from '@/config/modernTheme';
import ReadOnlyChecklist from './ReadOnlyChecklist';
import InteractiveChecklist from './InteractiveChecklist';

interface DispensingChecklistProps {
  userType?: 'anonymous' | 'authenticated';
  patientName?: string;
  enablePersistence?: boolean;
  onSessionSave?: (session: DispensingSession) => void;
  onSessionComplete?: (session: DispensingSession) => void;
}

export default function DispensingChecklist({
  userType = 'anonymous',
  patientName,
  enablePersistence = false,
  onSessionSave,
  onSessionComplete
}: DispensingChecklistProps): React.JSX.Element {
  const [isLoading, setIsLoading] = useState(true);
  const [workflowStages, setWorkflowStages] = useState<WorkflowStage[]>([]);

  useEffect(() => {
    // Simulate loading and prepare workflow data
    const loadWorkflow = async (): Promise<void> => {
      try {
        // Add current timestamps and reset completion states
        const processedStages = DISPENSING_WORKFLOW_TEMPLATE.map(stage => ({
          ...stage,
          isCompleted: false,
          completedAt: undefined,
          notes: '',
          activities: stage.activities.map(activity => ({
            ...activity,
            items: activity.items.map(item => ({
              ...item,
              completed: false,
              timestamp: undefined,
              notes: undefined
            }))
          }))
        }));

        setWorkflowStages(processedStages);
        setIsLoading(false);
      } catch (error) {
        console.error('Erro ao carregar workflow de dispensação:', error);
        setIsLoading(false);
      }
    };

    loadWorkflow();
  }, []);

  const checklistConfig = {
    userType,
    allowSave: userType === 'authenticated' && enablePersistence,
    allowEdit: userType === 'authenticated',
    allowExport: userType === 'authenticated',
    allowNotes: userType === 'authenticated',
    showQualityMetrics: userType === 'authenticated',
    showDecisionPoints: true
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
              🔓 <span>MODO INTERATIVO</span> • Completo com salvamento e personalização
            </>
          ) : (
            <>
              👁️ <span>MODO DEMONSTRATIVO</span> • Visualização somente leitura
            </>
          )}
        </div>
      </div>

      {/* Feature Comparison (only for anonymous users) */}
      {userType === 'anonymous' && <FeatureComparison />}

      {/* Main Checklist Component */}
      {userType === 'authenticated' ? (
        <InteractiveChecklist
          stages={workflowStages}
          config={checklistConfig}
          patientName={patientName}
          onSessionSave={onSessionSave}
          onSessionComplete={onSessionComplete}
        />
      ) : (
        <ReadOnlyChecklist
          stages={workflowStages}
          showEducationalInfo={true}
        />
      )}
    </div>
  );
}

// Loading component
function LoadingState(): React.JSX.Element {
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
        🔄 Carregando Roteiro de Dispensação
      </h3>
      
      <p style={{
        fontSize: modernChatTheme.typography.meta.fontSize,
        color: modernChatTheme.colors.neutral.textMuted
      }}>
        Preparando protocolo baseado na tese de doutorado...
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
function FeatureComparison(): React.JSX.Element {
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
          📊 Comparação de Recursos
        </h3>
        <p style={{
          fontSize: modernChatTheme.typography.meta.fontSize,
          color: modernChatTheme.colors.neutral.textMuted,
          textAlign: 'center',
          margin: 0
        }}>
          Veja as diferenças entre o modo demonstrativo e a versão completa
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
            Recurso
          </div>
          <div style={{ 
            fontWeight: '600', 
            color: '#F59E0B',
            padding: modernChatTheme.spacing.sm,
            background: '#F59E0B' + '10',
            borderRadius: modernChatTheme.borderRadius.sm
          }}>
            👁️ Demonstrativo (Atual)
          </div>
          <div style={{ 
            fontWeight: '600', 
            color: '#10B981',
            padding: modernChatTheme.spacing.sm,
            background: '#10B981' + '10',
            borderRadius: modernChatTheme.borderRadius.sm
          }}>
            🔓 Interativo (Logado)
          </div>

          {/* Features */}
          {[
            { name: 'Visualizar protocolo', demo: '✅', interactive: '✅' },
            { name: 'Marcar itens concluídos', demo: '❌', interactive: '✅' },
            { name: 'Salvar progresso', demo: '❌', interactive: '✅' },
            { name: 'Adicionar notas', demo: '❌', interactive: '✅' },
            { name: 'Relatórios detalhados', demo: '❌', interactive: '✅' },
            { name: 'Exportar sessão', demo: '❌', interactive: '✅' },
            { name: 'Histórico de sessões', demo: '❌', interactive: '✅' },
            { name: 'Sincronização', demo: '❌', interactive: '✅' }
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
            🚀 Pronto para a experiência completa?
          </h4>
          
          <p style={{
            fontSize: modernChatTheme.typography.meta.fontSize,
            color: modernChatTheme.colors.neutral.textMuted,
            marginBottom: modernChatTheme.spacing.lg
          }}>
            Faça login para acessar todas as funcionalidades e transformar sua prática farmacêutica com 
            ferramentas interativas baseadas em evidências científicas.
          </p>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: modernChatTheme.spacing.lg,
            flexWrap: 'wrap',
            fontSize: '12px',
            color: modernChatTheme.colors.neutral.textMuted
          }}>
            <span>💾 Salve sessões reais</span>
            <span>📊 Gere relatórios profissionais</span>
            <span>🤝 Compartilhe com a equipe</span>
            <span>📈 Monitore sua evolução</span>
          </div>
        </div>
      </div>
    </div>
  );
}
