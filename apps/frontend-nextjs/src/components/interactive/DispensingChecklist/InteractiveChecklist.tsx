'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { 
  WorkflowStage, 
  DispensingSession, 
  ChecklistProgress, 
  ChecklistConfig,
  QualityMetrics 
} from '@/types/checklist';
import { ClipboardIcon, CheckIcon, HeartIcon } from '@/components/icons/FlatOutlineIcons';
import { modernChatTheme } from '@/config/modernTheme';

interface InteractiveChecklistProps {
  stages: WorkflowStage[];
  config: ChecklistConfig;
  patientName?: string;
  onSessionSave?: (session: DispensingSession) => void;
  onSessionComplete?: (session: DispensingSession) => void;
}

export default function InteractiveChecklist({
  stages: initialStages,
  config,
  patientName,
  onSessionSave,
  onSessionComplete
}: InteractiveChecklistProps): React.JSX.Element {
  const announcementRef = useRef<HTMLDivElement>(null);
  const [session, setSession] = useState<DispensingSession>(() => ({
    id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    patientName: patientName || '',
    startTime: new Date(),
    stages: initialStages.map(stage => ({ ...stage, isCompleted: false })),
    currentStage: 0,
    status: 'in_progress',
    totalProgress: 0,
    pharmacistNotes: '',
    qualityIndicators: {
      prescriptionAccuracy: false,
      dispensingTime: 0,
      counselingCompletion: 0,
      documentationCompliance: false,
      adverseEventsReported: 0
    }
  }));

  const [expandedStage, setExpandedStage] = useState<string>(session.stages[0]?.id || '');
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null);
  const [autoSave, setAutoSave] = useState(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [announcement, setAnnouncement] = useState<string>('');

  // Anunciar mudanças para leitores de tela
  const announceChange = useCallback((message: string): void => {
    setAnnouncement(message);
    if (announcementRef.current) {
      announcementRef.current.textContent = message;
    }
    setTimeout(() => setAnnouncement(''), 1000);
  }, []);

  // Auto-save functionality
  useEffect(() => {
    if (autoSave && config.allowSave) {
      const saveTimer = setTimeout(() => {
        handleSave();
      }, 30000); // Auto-save every 30 seconds

      return (): void => clearTimeout(saveTimer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, autoSave, config.allowSave]);

  // Calculate progress
  const calculateOverallProgress = useCallback((): number => {
    const totalItems = session.stages.reduce(
      (sum, stage) => sum + stage.activities.reduce(
        (actSum, activity) => actSum + activity.items.length, 0
      ), 0
    );
    
    const completedItems = session.stages.reduce(
      (sum, stage) => sum + stage.activities.reduce(
        (actSum, activity) => actSum + activity.items.filter(item => item.completed).length, 0
      ), 0
    );

    return totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  }, [session.stages]);

  const calculateStageProgress = useCallback((stage: WorkflowStage): number => {
    const totalItems = stage.activities.reduce((sum, activity) => sum + activity.items.length, 0);
    const completedItems = stage.activities.reduce(
      (sum, activity) => sum + activity.items.filter(item => item.completed).length, 0
    );
    return totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  }, []);

  const handleItemToggle = useCallback((stageId: string, activityId: string, itemId: string): void => {
    if (!config.allowEdit) return;

    setSession(prevSession => {
      const newSession = { ...prevSession };
      const stage = newSession.stages.find(s => s.id === stageId);
      
      if (stage) {
        const activity = stage.activities.find(a => a.id === activityId);
        if (activity) {
          const item = activity.items.find(i => i.id === itemId);
          if (item) {
            item.completed = !item.completed;
            item.timestamp = new Date();
            
            // Anunciar mudança
            const itemStatus = item.completed ? 'marcado como concluído' : 'desmarcado';
            announceChange(`Item ${item.text} ${itemStatus}`);
            
            // Update stage completion status
            const stageProgress = calculateStageProgress(stage);
            stage.isCompleted = stageProgress === 100;
            if (stage.isCompleted) {
              stage.completedAt = new Date();
              announceChange(`Etapa ${stage.title} concluída!`);
            }
          }
        }
      }

      // Update overall progress
      newSession.totalProgress = calculateOverallProgress();
      
      // Check if all stages are completed
      const allCompleted = newSession.stages.every(s => s.isCompleted);
      if (allCompleted && newSession.status === 'in_progress') {
        newSession.status = 'completed';
        newSession.endTime = new Date();
        announceChange('Sessão de dispensação concluída com sucesso!');
        onSessionComplete?.(newSession);
      }

      return newSession;
    });
  }, [config.allowEdit, calculateStageProgress, calculateOverallProgress, onSessionComplete, announceChange]);

  const handleAddNote = useCallback((stageId: string, activityId: string, itemId: string, note: string): void => {
    if (!config.allowNotes) return;

    setSession(prevSession => {
      const newSession = { ...prevSession };
      const stage = newSession.stages.find(s => s.id === stageId);
      
      if (stage) {
        const activity = stage.activities.find(a => a.id === activityId);
        if (activity) {
          const item = activity.items.find(i => i.id === itemId);
          if (item) {
            item.notes = note;
          }
        }
      }

      return newSession;
    });
  }, [config.allowNotes]);

  const handlePharmacistNotesChange = useCallback((notes: string): void => {
    setSession(prevSession => ({
      ...prevSession,
      pharmacistNotes: notes
    }));
  }, []);

  const handleSave = useCallback((): void => {
    if (config.allowSave) {
      onSessionSave?.(session);
      setLastSaved(new Date());
      announceChange('Sessão salva com sucesso');
    }
  }, [config.allowSave, session, onSessionSave, announceChange]);

  const handlePauseSession = useCallback((): void => {
    setSession(prevSession => ({
      ...prevSession,
      status: 'paused'
    }));
    handleSave();
    announceChange('Sessão pausada');
  }, [handleSave, announceChange]);

  const handleResumeSession = useCallback((): void => {
    setSession(prevSession => ({
      ...prevSession,
      status: 'in_progress'
    }));
    announceChange('Sessão retomada');
  }, [announceChange]);

  const getStageIcon = (stage: WorkflowStage) => {
    if (stage.isCompleted) return <CheckIcon size={20} color="#22c55e" />;
    const progress = calculateStageProgress(stage);
    if (progress > 0) return <HeartIcon size={20} color="#f59e0b" />;
    return stage.sequence === 1 ? <ClipboardIcon size={20} color="#6366f1" /> : 
           stage.sequence === 2 ? <ClipboardIcon size={20} color="#8b5cf6" /> : 
           <HeartIcon size={20} color="#06b6d4" />;
  };

  const getCurrentStageIndex = (): number => {
    return session.stages.findIndex(stage => !stage.isCompleted);
  };

  // Navegação por teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      // Alt + S para salvar
      if (e.altKey && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      // Alt + P para pausar/retomar
      if (e.altKey && e.key === 'p') {
        e.preventDefault();
        if (session.status === 'in_progress') {
          handlePauseSession();
        } else if (session.status === 'paused') {
          handleResumeSession();
        }
      }
      // Tab para navegar entre etapas
      if (e.key === 'Tab' && !e.shiftKey) {
        const currentIndex = session.stages.findIndex(s => s.id === expandedStage);
        if (currentIndex < session.stages.length - 1) {
          const nextStage = session.stages[currentIndex + 1];
          setExpandedStage(nextStage.id);
          announceChange(`Navegando para ${nextStage.title}`);
        }
      }
      // Shift + Tab para voltar
      if (e.key === 'Tab' && e.shiftKey) {
        const currentIndex = session.stages.findIndex(s => s.id === expandedStage);
        if (currentIndex > 0) {
          const prevStage = session.stages[currentIndex - 1];
          setExpandedStage(prevStage.id);
          announceChange(`Voltando para ${prevStage.title}`);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return (): void => window.removeEventListener('keydown', handleKeyDown);
  }, [session, expandedStage, handleSave, handlePauseSession, handleResumeSession, announceChange]);

  return (
    <section role="main" aria-label="Sistema interativo de checklist para dispensação PQT-U">
      {/* Região de anúncios ARIA para leitores de tela */}
      <div 
        ref={announcementRef}
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
        style={{
          position: 'absolute',
          left: '-10000px',
          width: '1px',
          height: '1px',
          overflow: 'hidden'
        }}
      >
        {announcement}
      </div>
      {/* Header with Progress */}
      <header 
        role="banner"
        aria-label="Cabeçalho da sessão de dispensação"
        style={{
          background: `linear-gradient(135deg, ${modernChatTheme.colors.personas.gasnelio.primary}15, ${modernChatTheme.colors.personas.ga.primary}15)`,
          padding: modernChatTheme.spacing.xl,
          borderRadius: modernChatTheme.borderRadius.lg,
          marginBottom: modernChatTheme.spacing.lg,
          border: `1px solid ${modernChatTheme.colors.neutral.border}`
        }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: modernChatTheme.spacing.md
        }}>
          <div>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '700',
              color: modernChatTheme.colors.neutral.text,
              marginBottom: modernChatTheme.spacing.xs
            }}>
              📋 Sessão de Dispensação #{session.id.slice(-6).toUpperCase()}
            </h2>
            <div style={{
              fontSize: modernChatTheme.typography.meta.fontSize,
              color: modernChatTheme.colors.neutral.textMuted,
              display: 'flex',
              gap: modernChatTheme.spacing.md,
              flexWrap: 'wrap'
            }}>
              {session.patientName && <span>👤 {session.patientName}</span>}
              <span>🕒 Iniciado: {session.startTime.toLocaleString('pt-BR')}</span>
              <span>⏱️ Duração: {Math.round((Date.now() - session.startTime.getTime()) / 60000)}min</span>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: modernChatTheme.spacing.md
          }}>
            <span style={{
              padding: `${modernChatTheme.spacing.xs} ${modernChatTheme.spacing.sm}`,
              background: session.status === 'completed' 
                ? '#10B981' + '20'
                : session.status === 'paused'
                  ? '#F59E0B' + '20'
                  : '#3B82F6' + '20',
              color: session.status === 'completed' 
                ? '#10B981'
                : session.status === 'paused'
                  ? '#F59E0B'
                  : '#3B82F6',
              borderRadius: modernChatTheme.borderRadius.sm,
              fontSize: '12px',
              fontWeight: '600'
            }}>
              {session.status === 'completed' && '✅ CONCLUÍDO'}
              {session.status === 'paused' && '⏸️ PAUSADO'}
              {session.status === 'in_progress' && '🔄 EM ANDAMENTO'}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div role="progressbar" 
          aria-valuenow={session.totalProgress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Progresso geral: ${session.totalProgress}% concluído`}
        >
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
              Progresso Geral
            </span>
            <span 
              id="progress-percentage"
              style={{
                fontSize: modernChatTheme.typography.meta.fontSize,
                color: modernChatTheme.colors.personas.gasnelio.primary,
                fontWeight: '700'
              }}
            >
              {session.totalProgress}%
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
              width: `${session.totalProgress}%`,
              transition: modernChatTheme.transitions.medium
            }} />
          </div>
        </div>

        {/* Action Buttons */}
        {config.allowSave && (
          <div style={{
            display: 'flex',
            gap: modernChatTheme.spacing.md,
            marginTop: modernChatTheme.spacing.md,
            flexWrap: 'wrap'
          }}>
            <button
              onClick={handleSave}
              aria-label="Salvar sessão agora (Alt+S)"
              title="Salvar agora (Alt+S)"
              style={{
                padding: `${modernChatTheme.spacing.xs} ${modernChatTheme.spacing.sm}`,
                background: modernChatTheme.colors.personas.gasnelio.primary,
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
              💾 Salvar Agora
            </button>

            {session.status === 'in_progress' ? (
              <button
                onClick={handlePauseSession}
                aria-label="Pausar sessão atual (Alt+P)"
                title="Pausar sessão (Alt+P)"
                style={{
                  padding: `${modernChatTheme.spacing.xs} ${modernChatTheme.spacing.sm}`,
                  background: '#F59E0B',
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
                ⏸️ Pausar Sessão
              </button>
            ) : session.status === 'paused' && (
              <button
                onClick={handleResumeSession}
                aria-label="Retomar sessão pausada (Alt+P)"
                title="Retomar sessão (Alt+P)"
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
                ▶️ Retomar Sessão
              </button>
            )}

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: modernChatTheme.spacing.xs
            }}>
              <input
                type="checkbox"
                id="auto-save"
                checked={autoSave}
                onChange={(e) => setAutoSave(e.target.checked)}
              />
              <label 
                htmlFor="auto-save"
                style={{
                  fontSize: '12px',
                  color: modernChatTheme.colors.neutral.textMuted,
                  cursor: 'pointer'
                }}
              >
                🔄 Auto-salvar (30s)
              </label>
            </div>

            {lastSaved && (
              <span style={{
                fontSize: '11px',
                color: modernChatTheme.colors.neutral.textMuted
              }}>
                Último salvamento: {lastSaved.toLocaleTimeString('pt-BR')}
              </span>
            )}
          </div>
        )}
      </header>

      {/* Stage Navigation */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: modernChatTheme.spacing.md,
        marginBottom: modernChatTheme.spacing.xl
      }}>
        {session.stages.map((stage, index) => {
          const progress = calculateStageProgress(stage);
          const isCurrent = index === getCurrentStageIndex();
          
          return (
            <button
              key={stage.id}
              onClick={() => {
                setExpandedStage(stage.id);
                announceChange(`Visualizando ${stage.title}`);
              }}
              aria-expanded={expandedStage === stage.id}
              aria-label={`${stage.title} - ${progress}% concluído ${isCurrent ? '- Etapa atual' : ''}`}
              style={{
                padding: modernChatTheme.spacing.md,
                background: isCurrent 
                  ? modernChatTheme.colors.personas.gasnelio.bubble
                  : stage.isCompleted
                    ? '#10B981' + '10'
                    : 'white',
                border: `2px solid ${
                  isCurrent 
                    ? modernChatTheme.colors.personas.gasnelio.primary
                    : stage.isCompleted
                      ? '#10B981'
                      : modernChatTheme.colors.neutral.border
                }`,
                borderRadius: modernChatTheme.borderRadius.md,
                cursor: 'pointer',
                transition: modernChatTheme.transitions.medium,
                transform: expandedStage === stage.id ? 'scale(1.02)' : 'scale(1)',
                width: '100%',
                textAlign: 'left',
                font: 'inherit'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: modernChatTheme.spacing.sm
              }}>
                <div style={{ fontSize: '24px' }}>
                  {getStageIcon(stage)}
                </div>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '700',
                  color: isCurrent 
                    ? modernChatTheme.colors.personas.gasnelio.primary
                    : stage.isCompleted
                      ? '#10B981'
                      : modernChatTheme.colors.neutral.textMuted
                }}>
                  {progress}%
                </div>
              </div>
              
              <h4 style={{
                fontSize: modernChatTheme.typography.persona.fontSize,
                fontWeight: '600',
                color: modernChatTheme.colors.neutral.text,
                marginBottom: modernChatTheme.spacing.xs
              }}>
                {stage.title}
              </h4>
              
              <p style={{
                fontSize: '12px',
                color: modernChatTheme.colors.neutral.textMuted,
                margin: 0
              }}>
                {stage.activities.length} atividades • {stage.duration}
              </p>

              {isCurrent && (
                <div style={{
                  marginTop: modernChatTheme.spacing.sm,
                  padding: modernChatTheme.spacing.xs,
                  background: modernChatTheme.colors.personas.gasnelio.primary + '20',
                  borderRadius: modernChatTheme.borderRadius.sm,
                  fontSize: '11px',
                  color: modernChatTheme.colors.personas.gasnelio.primary,
                  fontWeight: '600',
                  textAlign: 'center'
                }}>
                  🎯 ETAPA ATUAL
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Detailed Stage Content */}
      {expandedStage && session.stages.map(stage => 
        stage.id === expandedStage && (
          <StageDetailView
            key={stage.id}
            stage={stage}
            config={config}
            onItemToggle={handleItemToggle}
            onAddNote={handleAddNote}
            expandedActivity={expandedActivity}
            onActivityToggle={setExpandedActivity}
          />
        )
      )}

      {/* Pharmacist Notes */}
      {config.allowNotes && (
        <div style={{
          marginTop: modernChatTheme.spacing.xl,
          padding: modernChatTheme.spacing.lg,
          background: 'white',
          border: `1px solid ${modernChatTheme.colors.neutral.border}`,
          borderRadius: modernChatTheme.borderRadius.lg
        }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: modernChatTheme.colors.neutral.text,
            marginBottom: modernChatTheme.spacing.md
          }}>
            📝 Observações do Farmacêutico
          </h3>
          
          <textarea
            id="pharmacist-notes"
            value={session.pharmacistNotes}
            onChange={(e) => handlePharmacistNotesChange(e.target.value)}
            placeholder="Registre observações importantes sobre a dispensação, condições especiais do paciente, intercorrências, etc..."
            aria-label="Observações do farmacêutico"
            aria-describedby="notes-help-text"
            style={{
              width: '100%',
              minHeight: '120px',
              padding: modernChatTheme.spacing.md,
              border: `2px solid ${modernChatTheme.colors.neutral.border}`,
              borderRadius: modernChatTheme.borderRadius.md,
              fontSize: modernChatTheme.typography.meta.fontSize,
              resize: 'vertical',
              fontFamily: 'inherit',
              outline: 'none'
            }}
            onFocus={(e) => {
              e.currentTarget.style.border = `2px solid ${modernChatTheme.colors.personas.gasnelio.primary}`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.border = `2px solid ${modernChatTheme.colors.neutral.border}`;
            }}
          />
          
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: modernChatTheme.spacing.sm,
            fontSize: '11px',
            color: modernChatTheme.colors.neutral.textMuted
          }}>
            <span>{session.pharmacistNotes.length} caracteres</span>
            <span>💡 Estas notas serão incluídas no relatório final</span>
          </div>
        </div>
      )}
    </section>
  );
}

// Component for detailed stage view
interface StageDetailViewProps {
  stage: WorkflowStage;
  config: ChecklistConfig;
  onItemToggle: (stageId: string, activityId: string, itemId: string) => void;
  onAddNote: (stageId: string, activityId: string, itemId: string, note: string) => void;
  expandedActivity: string | null;
  onActivityToggle: (activityId: string | null) => void;
}

function StageDetailView({
  stage,
  config,
  onItemToggle,
  onAddNote,
  expandedActivity,
  onActivityToggle
}: StageDetailViewProps): React.JSX.Element {
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  return (
    <div style={{
      background: 'white',
      border: `1px solid ${modernChatTheme.colors.neutral.border}`,
      borderRadius: modernChatTheme.borderRadius.lg,
      overflow: 'hidden',
      marginBottom: modernChatTheme.spacing.xl
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
          marginBottom: modernChatTheme.spacing.sm
        }}>
          {stage.sequence === 1 ? '🔍' : stage.sequence === 2 ? '📋' : '📊'} {stage.title}
        </h3>
        
        <div style={{
          fontSize: modernChatTheme.typography.meta.fontSize,
          color: modernChatTheme.colors.neutral.textMuted
        }}>
          <strong>Objetivos:</strong> {stage.objectives.join(' • ')}
        </div>
      </div>

      <div style={{ padding: modernChatTheme.spacing.lg }}>
        {stage.activities.map(activity => (
          <div
            key={activity.id}
            style={{
              marginBottom: modernChatTheme.spacing.lg,
              border: `1px solid ${modernChatTheme.colors.neutral.border}`,
              borderRadius: modernChatTheme.borderRadius.md,
              overflow: 'hidden'
            }}
          >
            <div
              onClick={() => onActivityToggle(expandedActivity === activity.id ? null : activity.id)}
              style={{
                padding: modernChatTheme.spacing.md,
                background: modernChatTheme.colors.background.secondary,
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <h4 style={{
                fontSize: modernChatTheme.typography.persona.fontSize,
                fontWeight: '600',
                color: modernChatTheme.colors.neutral.text,
                margin: 0
              }}>
                {activity.title}
              </h4>
              
              <span style={{
                fontSize: '16px',
                color: modernChatTheme.colors.neutral.textMuted,
                transform: expandedActivity === activity.id ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: modernChatTheme.transitions.fast
              }}>
                ⌄
              </span>
            </div>

            {expandedActivity === activity.id && (
              <div style={{ padding: modernChatTheme.spacing.md }}>
                {activity.items.map(item => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: modernChatTheme.spacing.md,
                      padding: modernChatTheme.spacing.sm,
                      marginBottom: modernChatTheme.spacing.sm,
                      background: item.completed 
                        ? '#10B981' + '10'
                        : modernChatTheme.colors.background.secondary,
                      borderRadius: modernChatTheme.borderRadius.sm,
                      border: `1px solid ${
                        item.completed 
                          ? '#10B981' + '30'
                          : modernChatTheme.colors.neutral.border
                      }`
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={item.completed}
                      onChange={() => onItemToggle(stage.id, activity.id, item.id)}
                      disabled={!config.allowEdit}
                      style={{
                        width: '18px',
                        height: '18px',
                        marginTop: '2px',
                        cursor: config.allowEdit ? 'pointer' : 'not-allowed'
                      }}
                    />
                    
                    <div style={{ flex: 1 }}>
                      <p style={{
                        margin: 0,
                        fontSize: modernChatTheme.typography.meta.fontSize,
                        color: modernChatTheme.colors.neutral.text,
                        fontWeight: item.required ? '600' : '400',
                        textDecoration: item.completed ? 'line-through' : 'none',
                        opacity: item.completed ? 0.8 : 1
                      }}>
                        {item.text}
                        {item.required && (
                          <span style={{
                            marginLeft: modernChatTheme.spacing.xs,
                            fontSize: '10px',
                            color: '#EF4444',
                            fontWeight: '600'
                          }}>
                            • OBRIGATÓRIO
                          </span>
                        )}
                      </p>
                      
                      {item.timestamp && (
                        <p style={{
                          margin: `${modernChatTheme.spacing.xs} 0 0 0`,
                          fontSize: '10px',
                          color: modernChatTheme.colors.neutral.textMuted
                        }}>
                          ✅ Concluído em: {item.timestamp.toLocaleString('pt-BR')}
                        </p>
                      )}

                      {/* Notes Section */}
                      {config.allowNotes && (
                        <div style={{ marginTop: modernChatTheme.spacing.sm }}>
                          {editingNote === item.id ? (
                            <div>
                              <textarea
                                value={noteText}
                                onChange={(e) => setNoteText(e.target.value)}
                                placeholder="Adicione uma observação..."
                                style={{
                                  width: '100%',
                                  minHeight: '60px',
                                  padding: modernChatTheme.spacing.xs,
                                  border: `1px solid ${modernChatTheme.colors.neutral.border}`,
                                  borderRadius: modernChatTheme.borderRadius.sm,
                                  fontSize: '12px',
                                  resize: 'vertical'
                                }}
                              />
                              <div style={{
                                display: 'flex',
                                gap: modernChatTheme.spacing.xs,
                                marginTop: modernChatTheme.spacing.xs
                              }}>
                                <button
                                  onClick={() => {
                                    onAddNote(stage.id, activity.id, item.id, noteText);
                                    setEditingNote(null);
                                    setNoteText('');
                                  }}
                                  style={{
                                    padding: `${modernChatTheme.spacing.xs} ${modernChatTheme.spacing.sm}`,
                                    background: '#10B981',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: modernChatTheme.borderRadius.sm,
                                    fontSize: '11px',
                                    cursor: 'pointer'
                                  }}
                                >
                                  💾 Salvar
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingNote(null);
                                    setNoteText('');
                                  }}
                                  style={{
                                    padding: `${modernChatTheme.spacing.xs} ${modernChatTheme.spacing.sm}`,
                                    background: modernChatTheme.colors.neutral.textMuted,
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: modernChatTheme.borderRadius.sm,
                                    fontSize: '11px',
                                    cursor: 'pointer'
                                  }}
                                >
                                  ❌ Cancelar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              {item.notes && (
                                <p style={{
                                  margin: 0,
                                  padding: modernChatTheme.spacing.xs,
                                  background: '#3B82F6' + '10',
                                  border: `1px solid ${'#3B82F6'}20`,
                                  borderRadius: modernChatTheme.borderRadius.sm,
                                  fontSize: '11px',
                                  color: '#3B82F6',
                                  fontStyle: 'italic',
                                  marginBottom: modernChatTheme.spacing.xs
                                }}>
                                  💬 {item.notes}
                                </p>
                              )}
                              
                              <button
                                onClick={() => {
                                  setEditingNote(item.id);
                                  setNoteText(item.notes || '');
                                }}
                                style={{
                                  padding: `${modernChatTheme.spacing.xs} ${modernChatTheme.spacing.sm}`,
                                  background: 'transparent',
                                  color: modernChatTheme.colors.neutral.textMuted,
                                  border: `1px solid ${modernChatTheme.colors.neutral.border}`,
                                  borderRadius: modernChatTheme.borderRadius.sm,
                                  fontSize: '11px',
                                  cursor: 'pointer'
                                }}
                              >
                                📝 {item.notes ? 'Editar' : 'Adicionar'} Nota
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
