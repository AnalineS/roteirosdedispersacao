'use client';

import React, { useState, useEffect } from 'react';
import { getUnbColors } from '@/config/modernTheme';

interface ConversationStep {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'upcoming' | 'optional';
  estimatedQuestions: number;
  actualQuestions?: number;
}

interface ConversationProgressProps {
  messages: any[];
  currentPersona?: string;
  onStepChange?: (step: ConversationStep) => void;
  className?: string;
  variant?: 'minimal' | 'detailed' | 'stepper';
}

interface ProgressAnalysis {
  currentStep: number;
  totalSteps: number;
  completionPercentage: number;
  estimatedTimeRemaining: string;
  conversationType: 'quick-help' | 'guided-assessment' | 'deep-consultation' | 'educational-flow';
  steps: ConversationStep[];
}

export default function ConversationProgress({ 
  messages = [], 
  currentPersona = 'general',
  onStepChange,
  className = '',
  variant = 'detailed'
}: ConversationProgressProps) {
  const unbColors = getUnbColors();
  const [progressAnalysis, setProgressAnalysis] = useState<ProgressAnalysis>({
    currentStep: 1,
    totalSteps: 1,
    completionPercentage: 0,
    estimatedTimeRemaining: 'Indefinido',
    conversationType: 'quick-help',
    steps: []
  });
  const [isExpanded, setIsExpanded] = useState(false);

  // Analisar padrão da conversa para determinar tipo e progresso
  useEffect(() => {
    const analyzeConversation = () => {
      const messageCount = messages.length;
      
      if (messageCount === 0) {
        return {
          currentStep: 0,
          totalSteps: 1,
          completionPercentage: 0,
          estimatedTimeRemaining: '2-5 min',
          conversationType: 'quick-help' as const,
          steps: getQuickHelpSteps()
        };
      }

      // Detectar tipo de conversa baseado no conteúdo e padrão
      const conversationType = detectConversationType(messages);
      const steps = getStepsForType(conversationType);
      const currentStep = getCurrentStep(messages, steps);
      
      return {
        currentStep,
        totalSteps: steps.length,
        completionPercentage: Math.round((currentStep / steps.length) * 100),
        estimatedTimeRemaining: calculateTimeRemaining(currentStep, steps),
        conversationType,
        steps: updateStepsStatus(steps, currentStep, messageCount)
      };
    };

    const analysis = analyzeConversation();
    setProgressAnalysis(analysis);

    // Notificar mudança de step
    if (onStepChange && analysis.steps[analysis.currentStep]) {
      onStepChange(analysis.steps[analysis.currentStep]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, onStepChange]);

  const detectConversationType = (msgs: any[]): ProgressAnalysis['conversationType'] => {
    const messageContent = msgs.map(m => m.content?.toLowerCase() || '').join(' ');
    
    // Palavras-chave para cada tipo
    if (messageContent.includes('dose') || messageContent.includes('medicamento') || 
        messageContent.includes('efeito') || messageContent.includes('tratamento')) {
      return msgs.length > 6 ? 'deep-consultation' : 'guided-assessment';
    }
    
    if (messageContent.includes('aprende') || messageContent.includes('estud') || 
        messageContent.includes('entend') || messageContent.includes('explic')) {
      return 'educational-flow';
    }
    
    if (msgs.length <= 3) {
      return 'quick-help';
    }
    
    return 'guided-assessment';
  };

  const getStepsForType = (type: ProgressAnalysis['conversationType']): ConversationStep[] => {
    const stepTemplates = {
      'quick-help': getQuickHelpSteps(),
      'guided-assessment': getGuidedAssessmentSteps(),
      'deep-consultation': getDeepConsultationSteps(),
      'educational-flow': getEducationalFlowSteps()
    };
    
    return stepTemplates[type];
  };

  const getQuickHelpSteps = (): ConversationStep[] => [
    {
      id: 'question',
      title: 'Pergunta',
      description: 'Faça sua pergunta específica',
      status: 'completed',
      estimatedQuestions: 1
    },
    {
      id: 'answer',
      title: 'Resposta',
      description: 'Receba orientação direcionada',
      status: 'current',
      estimatedQuestions: 1
    },
    {
      id: 'clarification',
      title: 'Esclarecimento',
      description: 'Tire dúvidas adicionais se necessário',
      status: 'optional',
      estimatedQuestions: 2
    }
  ];

  const getGuidedAssessmentSteps = (): ConversationStep[] => [
    {
      id: 'context',
      title: 'Contexto',
      description: 'Entendimento da situação',
      status: 'completed',
      estimatedQuestions: 2
    },
    {
      id: 'assessment',
      title: 'Avaliação',
      description: 'Análise detalhada do caso',
      status: 'current',
      estimatedQuestions: 3
    },
    {
      id: 'recommendation',
      title: 'Recomendação',
      description: 'Orientações específicas',
      status: 'upcoming',
      estimatedQuestions: 2
    },
    {
      id: 'follow-up',
      title: 'Acompanhamento',
      description: 'Próximos passos e recursos',
      status: 'upcoming',
      estimatedQuestions: 2
    }
  ];

  const getDeepConsultationSteps = (): ConversationStep[] => [
    {
      id: 'intake',
      title: 'Coleta Inicial',
      description: 'Informações básicas e contexto',
      status: 'completed',
      estimatedQuestions: 3
    },
    {
      id: 'deep-analysis',
      title: 'Análise Aprofundada',
      description: 'Investigação detalhada',
      status: 'current',
      estimatedQuestions: 4
    },
    {
      id: 'differential',
      title: 'Diagnóstico Diferencial',
      description: 'Consideração de alternativas',
      status: 'upcoming',
      estimatedQuestions: 3
    },
    {
      id: 'treatment-plan',
      title: 'Plano Terapêutico',
      description: 'Estratégia de tratamento',
      status: 'upcoming',
      estimatedQuestions: 3
    },
    {
      id: 'monitoring',
      title: 'Monitorização',
      description: 'Acompanhamento e ajustes',
      status: 'upcoming',
      estimatedQuestions: 2
    }
  ];

  const getEducationalFlowSteps = (): ConversationStep[] => [
    {
      id: 'topic-intro',
      title: 'Introdução',
      description: 'Apresentação do tópico',
      status: 'completed',
      estimatedQuestions: 1
    },
    {
      id: 'concept-building',
      title: 'Construção de Conceitos',
      description: 'Desenvolvimento progressivo',
      status: 'current',
      estimatedQuestions: 4
    },
    {
      id: 'application',
      title: 'Aplicação Prática',
      description: 'Exemplos e casos práticos',
      status: 'upcoming',
      estimatedQuestions: 3
    },
    {
      id: 'assessment',
      title: 'Avaliação',
      description: 'Verificação do aprendizado',
      status: 'upcoming',
      estimatedQuestions: 2
    },
    {
      id: 'resources',
      title: 'Recursos Adicionais',
      description: 'Material complementar',
      status: 'optional',
      estimatedQuestions: 1
    }
  ];

  const getCurrentStep = (msgs: any[], steps: ConversationStep[]): number => {
    const messageCount = msgs.length;
    let cumulativeQuestions = 0;
    
    for (let i = 0; i < steps.length; i++) {
      cumulativeQuestions += steps[i].estimatedQuestions;
      if (messageCount <= cumulativeQuestions) {
        return Math.max(0, i);
      }
    }
    
    return steps.length - 1;
  };

  const updateStepsStatus = (steps: ConversationStep[], currentStepIndex: number, messageCount: number): ConversationStep[] => {
    return steps.map((step, index) => ({
      ...step,
      status: index < currentStepIndex ? 'completed' : 
              index === currentStepIndex ? 'current' : 
              step.status === 'optional' ? 'optional' : 'upcoming',
      actualQuestions: index <= currentStepIndex ? step.estimatedQuestions : undefined
    }));
  };

  const calculateTimeRemaining = (currentStep: number, steps: ConversationStep[]): string => {
    const remainingSteps = steps.slice(currentStep + 1);
    const remainingQuestions = remainingSteps.reduce((sum, step) => 
      step.status !== 'optional' ? sum + step.estimatedQuestions : sum, 0
    );
    
    if (remainingQuestions === 0) return 'Concluído';
    if (remainingQuestions <= 2) return '2-3 min';
    if (remainingQuestions <= 5) return '5-8 min';
    return '10-15 min';
  };

  const getConversationTypeLabel = (type: ProgressAnalysis['conversationType']): string => {
    const labels = {
      'quick-help': 'Ajuda Rápida',
      'guided-assessment': 'Avaliação Guiada',
      'deep-consultation': 'Consulta Aprofundada',
      'educational-flow': 'Fluxo Educacional'
    };
    return labels[type];
  };

  const getStepIcon = (status: ConversationStep['status']) => {
    const size = 16;
    switch (status) {
      case 'completed':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="#22c55e">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
        );
      case 'current':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="#3b82f6">
            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"/>
            <circle cx="12" cy="12" r="4" fill="currentColor"/>
          </svg>
        );
      case 'upcoming':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="#9ca3af">
            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
          </svg>
        );
      case 'optional':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="#60a5fa">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
          </svg>
        );
    }
  };

  if (variant === 'minimal') {
    return (
      <div className={`conversation-progress-minimal ${className}`} style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.5rem 0.75rem',
        background: '#f8fafc',
        borderRadius: '20px',
        fontSize: '0.8rem'
      }}>
        <div style={{
          width: '80px',
          height: '4px',
          background: '#e5e7eb',
          borderRadius: '2px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${progressAnalysis.completionPercentage}%`,
            height: '100%',
            background: unbColors.primary,
            borderRadius: '2px',
            transition: 'width 0.3s ease'
          }} />
        </div>
        
        <span style={{ color: '#6b7280', fontWeight: '500' }}>
          {progressAnalysis.currentStep + 1}/{progressAnalysis.totalSteps}
        </span>
        
        <span style={{ color: '#374151', fontSize: '0.75rem' }}>
          ~{progressAnalysis.estimatedTimeRemaining}
        </span>
      </div>
    );
  }

  if (variant === 'stepper') {
    return (
      <div className={`conversation-progress-stepper ${className}`} style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderRadius: '12px',
        padding: '1rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '1rem'
        }}>
          {progressAnalysis.steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: step.status === 'completed' ? '#22c55e' :
                           step.status === 'current' ? unbColors.primary :
                           step.status === 'optional' ? '#f3f4f6' : '#e5e7eb',
                color: step.status === 'completed' || step.status === 'current' ? 'white' : '#6b7280',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                fontWeight: '600'
              }}>
                {step.status === 'completed' ? (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                ) : index + 1}
              </div>
              
              {index < progressAnalysis.steps.length - 1 && (
                <div style={{
                  flex: 1,
                  height: '2px',
                  background: index < progressAnalysis.currentStep ? '#22c55e' : '#e5e7eb',
                  borderRadius: '1px'
                }} />
              )}
            </React.Fragment>
          ))}
        </div>
        
        <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
          <strong style={{ color: '#374151' }}>
            {progressAnalysis.steps[progressAnalysis.currentStep]?.title}
          </strong>
          <br />
          {progressAnalysis.steps[progressAnalysis.currentStep]?.description}
        </div>
      </div>
    );
  }

  // Variant 'detailed' (default)
  return (
    <div className={`conversation-progress-detailed ${className}`} style={{
      background: 'white',
      border: `1px solid ${unbColors.alpha.primary}`,
      borderRadius: '12px',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div 
        style={{
          padding: '1rem',
          background: unbColors.alpha.primary,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: unbColors.primary,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '1.2rem'
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
            </svg>
          </div>
          
          <div>
            <h3 style={{
              margin: 0,
              fontSize: '1rem',
              fontWeight: '600',
              color: unbColors.primary
            }}>
              {getConversationTypeLabel(progressAnalysis.conversationType)}
            </h3>
            <p style={{
              margin: 0,
              fontSize: '0.8rem',
              color: '#6b7280'
            }}>
              Etapa {progressAnalysis.currentStep + 1} de {progressAnalysis.totalSteps} • 
              ~{progressAnalysis.estimatedTimeRemaining} restante
            </p>
          </div>
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <div style={{
            width: '60px',
            height: '6px',
            background: '#e5e7eb',
            borderRadius: '3px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${progressAnalysis.completionPercentage}%`,
              height: '100%',
              background: '#22c55e',
              borderRadius: '3px',
              transition: 'width 0.3s ease'
            }} />
          </div>
          
          <span style={{
            fontSize: '0.8rem',
            fontWeight: '600',
            color: unbColors.primary
          }}>
            {progressAnalysis.completionPercentage}%
          </span>
          
          <div style={{
            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            color: unbColors.primary
          }}>
            ▼
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div style={{ padding: '1rem' }}>
          <div style={{
            display: 'grid',
            gap: '0.75rem'
          }}>
            {progressAnalysis.steps.map((step, index) => (
              <div
                key={step.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem',
                  background: step.status === 'current' ? '#f0f9ff' : '#f8fafc',
                  borderRadius: '8px',
                  border: step.status === 'current' ? `1px solid ${unbColors.alpha.primary}` : '1px solid #e5e7eb'
                }}
              >
                {getStepIcon(step.status)}
                
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    color: step.status === 'current' ? unbColors.primary : '#374151',
                    marginBottom: '0.25rem'
                  }}>
                    {step.title}
                  </div>
                  <div style={{
                    fontSize: '0.8rem',
                    color: '#6b7280',
                    lineHeight: '1.4'
                  }}>
                    {step.description}
                  </div>
                </div>
                
                <div style={{
                  fontSize: '0.75rem',
                  color: '#9ca3af',
                  textAlign: 'right'
                }}>
                  <div>{step.actualQuestions || step.estimatedQuestions} pergunta{(step.actualQuestions || step.estimatedQuestions) !== 1 ? 's' : ''}</div>
                  {step.status === 'optional' && (
                    <div style={{ color: '#6b7280' }}>Opcional</div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem',
            background: '#fef3c7',
            borderRadius: '8px',
            fontSize: '0.8rem',
            color: '#92400e'
          }}>
            <div style={{ display: 'flex', alignItems: 'start', gap: '0.5rem' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#92400e">
                <path d="M9 21c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-1H9v1zm3-19C8.14 2 5 5.14 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.86-3.14-7-7-7z"/>
              </svg>
              <span><strong>Dica:</strong> Esta é uma estimativa baseada no padrão da conversa. 
              Você pode fazer quantas perguntas precisar!</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}