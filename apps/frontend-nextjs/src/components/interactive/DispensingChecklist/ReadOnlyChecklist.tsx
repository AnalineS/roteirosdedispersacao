'use client';

import React, { useState } from 'react';
import { WorkflowStage, ChecklistProgress } from '@/types/checklist';
import { modernChatTheme } from '@/config/modernTheme';

interface ReadOnlyChecklistProps {
  stages: WorkflowStage[];
  showEducationalInfo?: boolean;
}

export default function ReadOnlyChecklist({ 
  stages, 
  showEducationalInfo = true 
}: ReadOnlyChecklistProps) {
  const [expandedStage, setExpandedStage] = useState<string | null>(stages[0]?.id || null);
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null);

  const calculateStageProgress = (stage: WorkflowStage): number => {
    const totalItems = stage.activities.reduce((sum, activity) => sum + activity.items.length, 0);
    const requiredItems = stage.activities.reduce(
      (sum, activity) => sum + activity.items.filter(item => item.required).length,
      0
    );
    return totalItems > 0 ? Math.round((requiredItems / totalItems) * 100) : 0;
  };

  const getStageIcon = (stage: WorkflowStage) => {
    switch (stage.sequence) {
      case 1: return '🔍';
      case 2: return '📋';
      case 3: return '📊';
      default: return '📄';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
      case 'critical':
        return '#EF4444';
      case 'medium':
        return '#F59E0B';
      default:
        return '#3B82F6';
    }
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
          📋 Roteiro de Dispensação PQT-U
        </h2>
        <p style={{
          fontSize: modernChatTheme.typography.meta.fontSize,
          color: modernChatTheme.colors.neutral.textMuted,
          marginBottom: modernChatTheme.spacing.md
        }}>
          Visualização demonstrativa do protocolo de dispensação baseado na tese
        </p>
        
        {showEducationalInfo && (
          <div style={{
            background: '#3B82F6' + '10',
            padding: modernChatTheme.spacing.md,
            borderRadius: modernChatTheme.borderRadius.sm,
            border: `1px solid ${'#3B82F6'}20`
          }}>
            <p style={{
              fontSize: '12px',
              color: '#3B82F6',
              margin: 0
            }}>
              💡 <strong>Modo demonstrativo:</strong> Faça login para usar a versão interativa com salvamento e personalização
            </p>
          </div>
        )}
      </div>

      {/* Progress Overview */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: modernChatTheme.spacing.md,
        marginBottom: modernChatTheme.spacing.xl
      }}>
        {stages.map((stage, index) => (
          <div
            key={stage.id}
            style={{
              padding: modernChatTheme.spacing.md,
              background: 'white',
              border: `1px solid ${modernChatTheme.colors.neutral.border}`,
              borderRadius: modernChatTheme.borderRadius.md,
              boxShadow: modernChatTheme.shadows.subtle,
              textAlign: 'center'
            }}
          >
            <div style={{
              fontSize: '24px',
              marginBottom: modernChatTheme.spacing.xs
            }}>
              {getStageIcon(stage)}
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
              fontSize: '11px',
              color: modernChatTheme.colors.neutral.textMuted,
              marginBottom: modernChatTheme.spacing.sm
            }}>
              {stage.duration} • {stage.activities.length} atividades
            </p>
            <div style={{
              background: modernChatTheme.colors.background.secondary,
              height: '6px',
              borderRadius: '3px',
              overflow: 'hidden'
            }}>
              <div style={{
                background: modernChatTheme.colors.personas.gasnelio.primary,
                height: '100%',
                width: `${calculateStageProgress(stage)}%`,
                transition: modernChatTheme.transitions.medium
              }} />
            </div>
            <p style={{
              fontSize: '10px',
              color: modernChatTheme.colors.neutral.textMuted,
              marginTop: modernChatTheme.spacing.xs
            }}>
              {calculateStageProgress(stage)}% dos itens são obrigatórios
            </p>
          </div>
        ))}
      </div>

      {/* Detailed Stages */}
      <div style={{ display: 'grid', gap: modernChatTheme.spacing.lg }}>
        {stages.map((stage) => (
          <div
            key={stage.id}
            style={{
              background: 'white',
              border: `1px solid ${modernChatTheme.colors.neutral.border}`,
              borderRadius: modernChatTheme.borderRadius.lg,
              boxShadow: modernChatTheme.shadows.subtle,
              overflow: 'hidden'
            }}
          >
            {/* Stage Header */}
            <div
              onClick={() => setExpandedStage(expandedStage === stage.id ? null : stage.id)}
              style={{
                padding: modernChatTheme.spacing.lg,
                background: expandedStage === stage.id 
                  ? modernChatTheme.colors.personas.gasnelio.bubble
                  : modernChatTheme.colors.background.secondary,
                cursor: 'pointer',
                borderBottom: expandedStage === stage.id 
                  ? `1px solid ${modernChatTheme.colors.neutral.border}`
                  : 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: modernChatTheme.transitions.medium
              }}
            >
              <div>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  color: modernChatTheme.colors.neutral.text,
                  marginBottom: modernChatTheme.spacing.xs,
                  display: 'flex',
                  alignItems: 'center',
                  gap: modernChatTheme.spacing.sm
                }}>
                  {getStageIcon(stage)} {stage.title}
                </h3>
                <div style={{
                  fontSize: modernChatTheme.typography.meta.fontSize,
                  color: modernChatTheme.colors.neutral.textMuted,
                  display: 'flex',
                  gap: modernChatTheme.spacing.md,
                  flexWrap: 'wrap'
                }}>
                  <span>⏱️ {stage.duration}</span>
                  <span>👨‍⚕️ {stage.responsible}</span>
                  <span>📋 {stage.activities.length} atividades</span>
                </div>
              </div>
              
              <div style={{
                fontSize: '20px',
                color: modernChatTheme.colors.neutral.textMuted,
                transform: expandedStage === stage.id ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: modernChatTheme.transitions.fast
              }}>
                ⌄
              </div>
            </div>

            {/* Stage Content */}
            {expandedStage === stage.id && (
              <div style={{ padding: modernChatTheme.spacing.lg }}>
                {/* Objectives */}
                <div style={{ marginBottom: modernChatTheme.spacing.lg }}>
                  <h4 style={{
                    fontSize: modernChatTheme.typography.persona.fontSize,
                    fontWeight: '600',
                    color: modernChatTheme.colors.neutral.text,
                    marginBottom: modernChatTheme.spacing.sm
                  }}>
                    🎯 Objetivos
                  </h4>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: modernChatTheme.spacing.sm
                  }}>
                    {stage.objectives.map((objective, index) => (
                      <div
                        key={index}
                        style={{
                          padding: modernChatTheme.spacing.sm,
                          background: modernChatTheme.colors.background.secondary,
                          borderRadius: modernChatTheme.borderRadius.sm,
                          fontSize: modernChatTheme.typography.meta.fontSize,
                          color: modernChatTheme.colors.neutral.text
                        }}
                      >
                        • {objective}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Activities */}
                <div>
                  <h4 style={{
                    fontSize: modernChatTheme.typography.persona.fontSize,
                    fontWeight: '600',
                    color: modernChatTheme.colors.neutral.text,
                    marginBottom: modernChatTheme.spacing.md
                  }}>
                    📝 Atividades de Verificação
                  </h4>
                  
                  <div style={{ display: 'grid', gap: modernChatTheme.spacing.md }}>
                    {stage.activities.map((activity) => (
                      <div
                        key={activity.id}
                        style={{
                          border: `1px solid ${modernChatTheme.colors.neutral.border}`,
                          borderRadius: modernChatTheme.borderRadius.md,
                          overflow: 'hidden'
                        }}
                      >
                        {/* Activity Header */}
                        <div
                          onClick={() => setExpandedActivity(expandedActivity === activity.id ? null : activity.id)}
                          style={{
                            padding: modernChatTheme.spacing.md,
                            background: expandedActivity === activity.id 
                              ? modernChatTheme.colors.personas.ga.bubble
                              : modernChatTheme.colors.background.secondary,
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: modernChatTheme.transitions.medium
                          }}
                        >
                          <div>
                            <h5 style={{
                              fontSize: modernChatTheme.typography.persona.fontSize,
                              fontWeight: '600',
                              color: modernChatTheme.colors.neutral.text,
                              marginBottom: modernChatTheme.spacing.xs
                            }}>
                              {activity.title}
                            </h5>
                            {activity.description && (
                              <p style={{
                                fontSize: modernChatTheme.typography.meta.fontSize,
                                color: modernChatTheme.colors.neutral.textMuted,
                                margin: 0
                              }}>
                                {activity.description}
                              </p>
                            )}
                          </div>
                          
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: modernChatTheme.spacing.sm
                          }}>
                            <span style={{
                              fontSize: '12px',
                              padding: `${modernChatTheme.spacing.xs} ${modernChatTheme.spacing.sm}`,
                              background: activity.allItemsRequired 
                                ? '#EF4444' + '20'
                                : '#3B82F6' + '20',
                              color: activity.allItemsRequired 
                                ? '#EF4444'
                                : '#3B82F6',
                              borderRadius: modernChatTheme.borderRadius.sm,
                              fontWeight: '600'
                            }}>
                              {activity.allItemsRequired ? '⚠️ TODOS OBRIGATÓRIOS' : '💡 VERIFICAÇÃO FLEXÍVEL'}
                            </span>
                            
                            <span style={{
                              fontSize: '16px',
                              color: modernChatTheme.colors.neutral.textMuted,
                              transform: expandedActivity === activity.id ? 'rotate(180deg)' : 'rotate(0deg)',
                              transition: modernChatTheme.transitions.fast
                            }}>
                              ⌄
                            </span>
                          </div>
                        </div>

                        {/* Activity Items */}
                        {expandedActivity === activity.id && (
                          <div style={{ padding: modernChatTheme.spacing.md }}>
                            <div style={{ display: 'grid', gap: modernChatTheme.spacing.sm }}>
                              {activity.items.map((item, index) => (
                                <div
                                  key={item.id}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: modernChatTheme.spacing.sm,
                                    padding: modernChatTheme.spacing.sm,
                                    background: item.required 
                                      ? '#F59E0B' + '05'
                                      : modernChatTheme.colors.background.secondary,
                                    borderRadius: modernChatTheme.borderRadius.sm,
                                    border: item.required 
                                      ? `1px solid ${'#F59E0B'}20`
                                      : `1px solid ${modernChatTheme.colors.neutral.border}20`
                                  }}
                                >
                                  <div style={{
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '50%',
                                    border: `2px solid ${item.required 
                                      ? '#F59E0B'
                                      : modernChatTheme.colors.neutral.border}`,
                                    background: item.completed 
                                      ? (item.required 
                                          ? '#F59E0B'
                                          : '#10B981')
                                      : 'transparent',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    fontSize: '10px',
                                    color: 'white',
                                    marginTop: '2px'
                                  }}>
                                    {item.completed && '✓'}
                                  </div>
                                  
                                  <div style={{ flex: 1 }}>
                                    <p style={{
                                      margin: 0,
                                      fontSize: modernChatTheme.typography.meta.fontSize,
                                      color: modernChatTheme.colors.neutral.text,
                                      fontWeight: item.required ? '600' : '400'
                                    }}>
                                      {item.text}
                                      {item.required && (
                                        <span style={{
                                          marginLeft: modernChatTheme.spacing.xs,
                                          fontSize: '10px',
                                          color: '#F59E0B',
                                          fontWeight: '600'
                                        }}>
                                          • OBRIGATÓRIO
                                        </span>
                                      )}
                                    </p>
                                    
                                    {item.notes && (
                                      <p style={{
                                        margin: `${modernChatTheme.spacing.xs} 0 0 0`,
                                        fontSize: '11px',
                                        color: modernChatTheme.colors.neutral.textMuted,
                                        fontStyle: 'italic'
                                      }}>
                                        💡 {item.notes}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Decision Points */}
                {stage.decisionPoints && (
                  <div style={{ 
                    marginTop: modernChatTheme.spacing.lg,
                    padding: modernChatTheme.spacing.md,
                    background: modernChatTheme.colors.background.secondary,
                    borderRadius: modernChatTheme.borderRadius.md,
                    border: `1px solid ${modernChatTheme.colors.neutral.border}`
                  }}>
                    <h4 style={{
                      fontSize: modernChatTheme.typography.persona.fontSize,
                      fontWeight: '600',
                      color: modernChatTheme.colors.neutral.text,
                      marginBottom: modernChatTheme.spacing.md
                    }}>
                      🤔 Pontos de Decisão
                    </h4>
                    
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: modernChatTheme.spacing.md
                    }}>
                      {stage.decisionPoints.continue && (
                        <div>
                          <h5 style={{
                            fontSize: modernChatTheme.typography.meta.fontSize,
                            fontWeight: '600',
                            color: '#10B981',
                            marginBottom: modernChatTheme.spacing.xs
                          }}>
                            ✅ Continuar dispensação se:
                          </h5>
                          <ul style={{
                            margin: 0,
                            paddingLeft: modernChatTheme.spacing.md,
                            fontSize: '12px',
                            color: modernChatTheme.colors.neutral.text
                          }}>
                            {stage.decisionPoints.continue.map((item, index) => (
                              <li key={index} style={{ marginBottom: modernChatTheme.spacing.xs }}>
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {stage.decisionPoints.refer && (
                        <div>
                          <h5 style={{
                            fontSize: modernChatTheme.typography.meta.fontSize,
                            fontWeight: '600',
                            color: '#EF4444',
                            marginBottom: modernChatTheme.spacing.xs
                          }}>
                            ⚠️ Encaminhar ao prescritor se:
                          </h5>
                          <ul style={{
                            margin: 0,
                            paddingLeft: modernChatTheme.spacing.md,
                            fontSize: '12px',
                            color: modernChatTheme.colors.neutral.text
                          }}>
                            {stage.decisionPoints.refer.map((item, index) => (
                              <li key={index} style={{ marginBottom: modernChatTheme.spacing.xs }}>
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {stage.decisionPoints.request && (
                        <div>
                          <h5 style={{
                            fontSize: modernChatTheme.typography.meta.fontSize,
                            fontWeight: '600',
                            color: '#F59E0B',
                            marginBottom: modernChatTheme.spacing.xs
                          }}>
                            📦 Solicitar medicamento se:
                          </h5>
                          <ul style={{
                            margin: 0,
                            paddingLeft: modernChatTheme.spacing.md,
                            fontSize: '12px',
                            color: modernChatTheme.colors.neutral.text
                          }}>
                            {stage.decisionPoints.request.map((item, index) => (
                              <li key={index} style={{ marginBottom: modernChatTheme.spacing.xs }}>
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

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
          🚀 Quer usar a versão completa?
        </h3>
        <p style={{
          fontSize: modernChatTheme.typography.meta.fontSize,
          color: modernChatTheme.colors.neutral.textMuted,
          marginBottom: modernChatTheme.spacing.lg
        }}>
          Faça login para acessar a versão interativa com salvamento de progresso, 
          notas personalizadas e integração com outros recursos educacionais.
        </p>
        
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: modernChatTheme.spacing.lg,
          flexWrap: 'wrap',
          fontSize: '12px',
          color: modernChatTheme.colors.neutral.textMuted
        }}>
          <span>✅ Salvar progresso</span>
          <span>📝 Adicionar notas</span>
          <span>📊 Relatórios detalhados</span>
          <span>🔄 Sincronizar entre dispositivos</span>
        </div>
      </div>
    </div>
  );
}
