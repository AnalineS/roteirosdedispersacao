/**
 * Loading States Inteligentes - ETAPA 6 UX TRANSFORMATION
 * Sistema completo de estados de carregamento para contexto médico
 * 
 * Seguindo princípios de claude_code_optimization_prompt.md:
 * - Medical Context: Loading states específicos para dados médicos
 * - Performance: Skeleton screens para perceived performance +30%
 * - Progressive Loading: Carregamento incremental de conteúdo
 * - Accessibility: Estados acessíveis com screen readers
 */

'use client';

import React, { useState, useEffect } from 'react';
import { getUnbColors } from '@/config/modernTheme';
import { useHapticFeedback } from '@/utils/hapticFeedback';

// Interfaces para loading states
interface LoadingStateProps {
  children?: React.ReactNode;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'medical' | 'prescription' | 'emergency';
}

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  animate?: boolean;
}

interface ProgressiveLoadingProps {
  stages: {
    name: string;
    duration: number;
    message: string;
  }[];
  onComplete?: () => void;
  variant?: 'medical' | 'data' | 'system';
}

// Componente base de Skeleton
export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '1rem',
  borderRadius = '4px',
  className = '',
  animate = true
}) => {
  return (
    <div
      className={`skeleton ${animate ? 'skeleton-animate' : ''} ${className}`}
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: '#f1f5f9',
        backgroundImage: animate ? 'linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%)' : undefined,
        backgroundSize: animate ? '200% 100%' : undefined,
        animation: animate ? 'skeleton-pulse 1.5s ease-in-out infinite' : undefined
      }}
      role="presentation"
      aria-label="Carregando conteúdo"
    />
  );
};

// Loading spinner contextual médico
export const MedicalLoadingSpinner: React.FC<LoadingStateProps> = ({
  size = 'medium',
  variant = 'default',
  className = ''
}) => {
  const unbColors = getUnbColors();
  
  const getSizeConfig = () => {
    switch (size) {
      case 'small': return { size: 24, stroke: 2 };
      case 'large': return { size: 48, stroke: 3 };
      default: return { size: 32, stroke: 2.5 };
    }
  };

  const getVariantConfig = () => {
    switch (variant) {
      case 'medical':
        return {
          primary: '#0ea5e9',
          secondary: '#e0f2fe',
          icon: '🏥'
        };
      case 'prescription':
        return {
          primary: '#059669',
          secondary: '#ecfdf5',
          icon: '💊'
        };
      case 'emergency':
        return {
          primary: '#dc2626',
          secondary: '#fee2e2',
          icon: '🚨'
        };
      default:
        return {
          primary: unbColors.primary,
          secondary: unbColors.alpha.primary,
          icon: '⚕️'
        };
    }
  };

  const { size: spinnerSize, stroke } = getSizeConfig();
  const { primary, secondary, icon } = getVariantConfig();

  return (
    <div className={`medical-loading-spinner ${className}`} role="status" aria-live="polite">
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        padding: '20px'
      }}>
        {/* Spinner animado */}
        <div style={{ position: 'relative' }}>
          <svg
            width={spinnerSize}
            height={spinnerSize}
            viewBox={`0 0 ${spinnerSize} ${spinnerSize}`}
            style={{ animation: 'spin 1s linear infinite' }}
          >
            <circle
              cx={spinnerSize / 2}
              cy={spinnerSize / 2}
              r={(spinnerSize - stroke * 2) / 2}
              stroke={secondary}
              strokeWidth={stroke}
              fill="none"
            />
            <circle
              cx={spinnerSize / 2}
              cy={spinnerSize / 2}
              r={(spinnerSize - stroke * 2) / 2}
              stroke={primary}
              strokeWidth={stroke}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={`${Math.PI * (spinnerSize - stroke * 2) * 0.25} ${Math.PI * (spinnerSize - stroke * 2)}`}
              transform={`rotate(-90 ${spinnerSize / 2} ${spinnerSize / 2})`}
            />
          </svg>
          
          {/* Ícone médico central */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: `${spinnerSize * 0.4}px`
          }}>
            {icon}
          </div>
        </div>

        {/* Texto contextual */}
        <div style={{
          fontSize: '0.875rem',
          color: '#64748b',
          textAlign: 'center',
          fontWeight: '500'
        }}>
          Processando informações médicas...
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes skeleton-pulse {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
};

// Skeleton Cards específicos para contexto médico
export const MedicalSkeletonCard: React.FC<{ type: 'dosage' | 'patient' | 'prescription' | 'contact' }> = ({ type }) => {
  const getSkeletonConfig = () => {
    switch (type) {
      case 'dosage':
        return {
          title: 'Informações de Dosagem',
          elements: [
            { width: '60%', height: '1.5rem' }, // Medication name
            { width: '40%', height: '1rem' },   // Dosage
            { width: '80%', height: '1rem' },   // Frequency
            { width: '50%', height: '1rem' }    // Duration
          ]
        };
      case 'patient':
        return {
          title: 'Dados do Paciente',
          elements: [
            { width: '70%', height: '1.25rem' }, // Patient name
            { width: '90%', height: '1rem' },    // Condition
            { width: '60%', height: '1rem' },    // Last update
            { width: '100%', height: '3rem' }    // Notes area
          ]
        };
      case 'prescription':
        return {
          title: 'Prescrição Médica',
          elements: [
            { width: '80%', height: '1.5rem' }, // Prescription title
            { width: '50%', height: '1rem' },   // Doctor
            { width: '40%', height: '1rem' },   // Date
            { width: '100%', height: '4rem' }   // Instructions
          ]
        };
      case 'contact':
        return {
          title: 'Contato Médico',
          elements: [
            { width: '60%', height: '1.25rem' }, // Contact name
            { width: '80%', height: '1rem' },    // Specialty
            { width: '70%', height: '1rem' },    // Phone
            { width: '90%', height: '1rem' }     // Address
          ]
        };
    }
  };

  const config = getSkeletonConfig();

  return (
    <div style={{
      background: 'white',
      border: '1px solid #e2e8f0',
      borderRadius: '12px',
      padding: '16px',
      margin: '12px 0'
    }}>
      {/* Header skeleton */}
      <div style={{ marginBottom: '16px' }}>
        <Skeleton width="30%" height="0.875rem" />
        <div style={{ marginTop: '8px' }}>
          <Skeleton width={config.elements[0].width} height={config.elements[0].height} />
        </div>
      </div>

      {/* Content skeletons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {config.elements.slice(1).map((element, index) => (
          <div key={index}>
            <div style={{ marginBottom: '4px' }}>
              <Skeleton width="25%" height="0.75rem" />
            </div>
            <Skeleton width={element.width} height={element.height} />
          </div>
        ))}
      </div>
    </div>
  );
};

// Progressive Loading para operações complexas
export const ProgressiveLoading: React.FC<ProgressiveLoadingProps> = ({
  stages,
  onComplete,
  variant = 'medical'
}) => {
  const [currentStage, setCurrentStage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (currentStage >= stages.length) {
      setIsComplete(true);
      onComplete?.();
      return;
    }

    const stage = stages[currentStage];
    const interval = stage.duration / 100; // Update every 1% of stage duration

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          setCurrentStage(current => current + 1);
          return 0;
        }
        return prev + 1;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [currentStage, stages, onComplete]);

  const getVariantConfig = () => {
    switch (variant) {
      case 'medical':
        return {
          bg: '#f0f9ff',
          border: '#0ea5e9',
          primary: '#0ea5e9',
          icon: '🏥'
        };
      case 'data':
        return {
          bg: '#f0fdf4',
          border: '#22c55e',
          primary: '#22c55e',
          icon: '📊'
        };
      case 'system':
        return {
          bg: '#fef3c7',
          border: '#f59e0b',
          primary: '#f59e0b',
          icon: '⚙️'
        };
    }
  };

  const config = getVariantConfig();
  const totalProgress = ((currentStage * 100) + progress) / stages.length;
  const currentStageData = stages[currentStage] || stages[stages.length - 1];

  if (isComplete) {
    return (
      <div style={{
        background: '#f0fdf4',
        border: '2px solid #22c55e',
        borderRadius: '12px',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '8px' }}>✅</div>
        <div style={{ fontSize: '1rem', fontWeight: '600', color: '#166534' }}>
          Processamento Concluído!
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: config.bg,
      border: `2px solid ${config.border}`,
      borderRadius: '12px',
      padding: '20px',
      margin: '12px 0'
    }}>
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>
          {config.icon}
        </div>
        <div style={{
          fontSize: '1rem',
          fontWeight: '600',
          color: config.primary,
          marginBottom: '4px'
        }}>
          {currentStageData.name}
        </div>
        <div style={{
          fontSize: '0.875rem',
          color: '#64748b'
        }}>
          {currentStageData.message}
        </div>
      </div>

      {/* Barra de progresso geral */}
      <div style={{
        background: '#f1f5f9',
        borderRadius: '8px',
        height: '8px',
        overflow: 'hidden',
        marginBottom: '12px'
      }}>
        <div style={{
          background: config.primary,
          height: '100%',
          width: `${totalProgress}%`,
          borderRadius: '8px',
          transition: 'width 0.3s ease',
          boxShadow: `0 0 8px ${config.primary}40`
        }} />
      </div>

      {/* Indicadores de etapas */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '0.75rem',
        color: '#64748b'
      }}>
        {stages.map((stage, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              fontWeight: index === currentStage ? '600' : '400',
              color: index < currentStage ? config.primary : 
                     index === currentStage ? '#1e293b' : '#94a3b8'
            }}
          >
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: index < currentStage ? config.primary : 
                         index === currentStage ? config.border : '#cbd5e1',
              marginRight: '4px'
            }} />
            {stage.name}
          </div>
        ))}
      </div>

      {/* Porcentagem */}
      <div style={{
        textAlign: 'center',
        marginTop: '12px',
        fontSize: '0.875rem',
        fontWeight: '600',
        color: config.primary
      }}>
        {Math.round(totalProgress)}% Concluído
      </div>
    </div>
  );
};

// Optimistic UI Loading States
export const OptimisticLoadingState: React.FC<{
  action: string;
  success?: boolean;
  error?: string;
  onRetry?: () => void;
}> = ({ action, success, error, onRetry }) => {
  if (success) {
    return (
      <div style={{
        background: '#f0fdf4',
        border: '1px solid #22c55e',
        borderRadius: '8px',
        padding: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        color: '#166534'
      }}>
        <span style={{ fontSize: '1.125rem' }}>✅</span>
        <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
          {action} realizado com sucesso!
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        background: '#fee2e2',
        border: '1px solid #dc2626',
        borderRadius: '8px',
        padding: '12px',
        color: '#991b1b'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span style={{ fontSize: '1.125rem' }}>❌</span>
          <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
            Erro ao {action.toLowerCase()}
          </span>
        </div>
        <div style={{ fontSize: '0.75rem', marginBottom: '8px' }}>
          {error}
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            style={{
              background: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '6px 12px',
              fontSize: '0.75rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Tentar Novamente
          </button>
        )}
      </div>
    );
  }

  return (
    <div style={{
      background: '#fef3c7',
      border: '1px solid #f59e0b',
      borderRadius: '8px',
      padding: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      color: '#92400e'
    }}>
      <MedicalLoadingSpinner size="small" variant="default" />
      <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
        {action}...
      </span>
    </div>
  );
};

// Context-aware Loading Messages com Haptic Feedback
export const ContextualLoadingMessage: React.FC<{
  context: 'chat' | 'dosage' | 'search' | 'calculation' | 'save' | 'auth' | 'export';
  persona?: 'gasnelio' | 'ga';
  withHaptic?: boolean;
}> = ({ context, persona, withHaptic = false }) => {
  const { medical, calculation, info } = useHapticFeedback();
  
  useEffect(() => {
    if (withHaptic) {
      // Trigger haptic feedback baseado no contexto
      switch (context) {
        case 'dosage':
        case 'calculation':
          calculation();
          break;
        case 'chat':
          medical();
          break;
        default:
          info();
      }
    }
  }, [context, withHaptic, medical, calculation, info]);

  const getContextMessage = () => {
    const messages = {
      chat: {
        gasnelio: 'Dr. Gasnelio está analisando sua pergunta médica...',
        ga: 'Gá está preparando uma resposta carinhosa para você...'
      },
      dosage: {
        gasnelio: 'Calculando dosagens com precisão farmacológica...',
        ga: 'Verificando as melhores orientações de medicação...'
      },
      search: {
        gasnelio: 'Buscando evidências científicas atualizadas...',
        ga: 'Procurando informações úteis para você...'
      },
      calculation: {
        gasnelio: 'Executando cálculos farmacológicos complexos...',
        ga: 'Fazendo os cálculos necessários com cuidado...'
      },
      save: {
        gasnelio: 'Salvando dados com segurança médica...',
        ga: 'Guardando suas informações com carinho...'
      },
      auth: {
        gasnelio: 'Verificando credenciais com segurança...',
        ga: 'Processando seu acesso com cuidado...'
      },
      export: {
        gasnelio: 'Gerando documento com dados médicos...',
        ga: 'Preparando seus materiais com atenção...'
      }
    };

    return messages[context][persona || 'gasnelio'];
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontSize: '0.875rem',
      color: '#64748b',
      fontStyle: 'italic'
    }}>
      {getContextMessage()}
    </div>
  );
};

// Skeleton Export para uso geral
export const LoadingSkeletonGrid: React.FC<{
  items: number;
  type: 'card' | 'list' | 'table';
}> = ({ items, type }) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            {Array.from({ length: items }).map((_, index) => (
              <MedicalSkeletonCard key={index} type="dosage" />
            ))}
          </div>
        );
      case 'list':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {Array.from({ length: items }).map((_, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px' }}>
                <Skeleton width="40px" height="40px" borderRadius="50%" />
                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: '4px' }}>
                    <Skeleton width="70%" height="1rem" />
                  </div>
                  <Skeleton width="50%" height="0.875rem" />
                </div>
              </div>
            ))}
          </div>
        );
      case 'table':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {Array.from({ length: items }).map((_, index) => (
              <div key={index} style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(4, 1fr)', 
                gap: '12px', 
                padding: '12px',
                borderBottom: '1px solid #e2e8f0'
              }}>
                <Skeleton width="80%" height="1rem" />
                <Skeleton width="60%" height="1rem" />
                <Skeleton width="90%" height="1rem" />
                <Skeleton width="70%" height="1rem" />
              </div>
            ))}
          </div>
        );
    }
  };

  return <div>{renderSkeleton()}</div>;
};

// Skeleton Screen para Dashboard Médico
export const DashboardSkeleton: React.FC<{
  showPatientCard?: boolean;
  showProgressCharts?: boolean;
  showRecentActivity?: boolean;
}> = ({ showPatientCard = true, showProgressCharts = true, showRecentActivity = true }) => {
  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Skeleton */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <Skeleton width="200px" height="2rem" />
          <div style={{ marginTop: '8px' }}>
            <Skeleton width="300px" height="1rem" />
          </div>
        </div>
        <Skeleton width="120px" height="40px" borderRadius="8px" />
      </div>

      {/* Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
        {/* Estatísticas Cards */}
        {[...Array(4)].map((_, i) => (
          <div key={i} style={{
            background: 'white',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <Skeleton width="100px" height="0.875rem" />
                <div style={{ marginTop: '12px' }}>
                  <Skeleton width="60px" height="2rem" />
                </div>
              </div>
              <Skeleton width="40px" height="40px" borderRadius="50%" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Chart Area */}
        {showProgressCharts && (
          <div style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0'
          }}>
            <div style={{ marginBottom: '20px' }}>
              <Skeleton width="180px" height="1.5rem" />
              <div style={{ marginTop: '8px' }}>
                <Skeleton width="250px" height="1rem" />
              </div>
            </div>
            <Skeleton width="100%" height="200px" borderRadius="8px" />
          </div>
        )}

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Patient Card */}
          {showPatientCard && (
            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ marginBottom: '16px' }}>
                <Skeleton width="120px" height="1.25rem" />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <Skeleton width="60px" height="60px" borderRadius="50%" />
                <div>
                  <Skeleton width="140px" height="1rem" />
                  <div style={{ marginTop: '4px' }}>
                    <Skeleton width="100px" height="0.875rem" />
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Skeleton width="100%" height="0.875rem" />
                <Skeleton width="80%" height="0.875rem" />
                <Skeleton width="90%" height="0.875rem" />
              </div>
            </div>
          )}

          {/* Recent Activity */}
          {showRecentActivity && (
            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ marginBottom: '16px' }}>
                <Skeleton width="140px" height="1.25rem" />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[...Array(5)].map((_, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Skeleton width="32px" height="32px" borderRadius="50%" />
                    <div style={{ flex: 1 }}>
                      <Skeleton width="100%" height="0.875rem" />
                      <div style={{ marginTop: '4px' }}>
                        <Skeleton width="60%" height="0.75rem" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Skeleton Screen para Chat Interface
export const ChatInterfaceSkeleton: React.FC<{
  messagesCount?: number;
  showTypingIndicator?: boolean;
}> = ({ messagesCount = 5, showTypingIndicator = true }) => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '600px',
      background: 'white',
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
      overflow: 'hidden'
    }}>
      {/* Chat Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        <Skeleton width="40px" height="40px" borderRadius="50%" />
        <div>
          <Skeleton width="120px" height="1rem" />
          <div style={{ marginTop: '4px' }}>
            <Skeleton width="80px" height="0.75rem" />
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div style={{
        flex: 1,
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        overflowY: 'auto'
      }}>
        {[...Array(messagesCount)].map((_, i) => {
          const isUser = i % 2 === 0;
          return (
            <div key={i} style={{
              display: 'flex',
              justifyContent: isUser ? 'flex-end' : 'flex-start'
            }}>
              <div style={{
                maxWidth: '70%',
                padding: '12px 16px',
                borderRadius: '12px',
                background: isUser ? '#f1f5f9' : '#e0f2fe'
              }}>
                <Skeleton width="100%" height="1rem" />
                <div style={{ marginTop: '4px' }}>
                  <Skeleton width={`${Math.random() * 40 + 40}%`} height="1rem" />
                </div>
              </div>
            </div>
          );
        })}

        {/* Typing Indicator */}
        {showTypingIndicator && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{
              padding: '12px 16px',
              borderRadius: '12px',
              background: '#e0f2fe',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#64748b',
                animation: 'bounce 1.4s ease-in-out infinite both'
              }} />
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#64748b',
                animation: 'bounce 1.4s ease-in-out 0.16s infinite both'
              }} />
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#64748b',
                animation: 'bounce 1.4s ease-in-out 0.32s infinite both'
              }} />
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div style={{
        padding: '16px',
        borderTop: '1px solid #e2e8f0',
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-end'
      }}>
        <Skeleton width="100%" height="40px" borderRadius="20px" />
        <Skeleton width="40px" height="40px" borderRadius="50%" />
      </div>

      <style jsx>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

// Skeleton Screen para Lista de Módulos/Recursos
export const ModuleListSkeleton: React.FC<{
  itemsCount?: number;
  showFilters?: boolean;
  layout?: 'grid' | 'list';
}> = ({ itemsCount = 6, showFilters = true, layout = 'grid' }) => {
  return (
    <div style={{ padding: '24px' }}>
      {/* Header com filtros */}
      {showFilters && (
        <div style={{
          marginBottom: '24px',
          padding: '20px',
          background: 'white',
          borderRadius: '12px',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ marginBottom: '16px' }}>
            <Skeleton width="180px" height="1.5rem" />
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Skeleton width="120px" height="36px" borderRadius="18px" />
            <Skeleton width="100px" height="36px" borderRadius="18px" />
            <Skeleton width="140px" height="36px" borderRadius="18px" />
            <Skeleton width="90px" height="36px" borderRadius="18px" />
          </div>
        </div>
      )}

      {/* Grid ou Lista */}
      <div style={{
        display: layout === 'grid' ? 'grid' : 'flex',
        gridTemplateColumns: layout === 'grid' ? 'repeat(auto-fill, minmax(300px, 1fr))' : undefined,
        flexDirection: layout === 'list' ? 'column' : undefined,
        gap: '16px'
      }}>
        {[...Array(itemsCount)].map((_, i) => (
          <div key={i} style={{
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '20px',
            display: 'flex',
            flexDirection: layout === 'grid' ? 'column' : 'row',
            gap: '16px'
          }}>
            {/* Ícone/Imagem */}
            <Skeleton 
              width={layout === 'grid' ? '60px' : '80px'} 
              height={layout === 'grid' ? '60px' : '80px'} 
              borderRadius="12px" 
            />
            
            {/* Conteúdo */}
            <div style={{ flex: 1 }}>
              <Skeleton width="100%" height="1.25rem" />
              <div style={{ marginTop: '8px' }}>
                <Skeleton width="100%" height="0.875rem" />
              </div>
              <div style={{ marginTop: '4px' }}>
                <Skeleton width="80%" height="0.875rem" />
              </div>
              
              {/* Tags */}
              <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                <Skeleton width="60px" height="20px" borderRadius="10px" />
                <Skeleton width="80px" height="20px" borderRadius="10px" />
              </div>
              
              {/* Progress bar para módulos */}
              {layout === 'grid' && (
                <div style={{ marginTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <Skeleton width="80px" height="0.75rem" />
                    <Skeleton width="40px" height="0.75rem" />
                  </div>
                  <Skeleton width="100%" height="6px" borderRadius="3px" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Loading State para Autenticação/Login
export const AuthLoadingState: React.FC<{
  type: 'login' | 'register' | 'reset' | 'verify';
  message?: string;
  withHaptic?: boolean;
}> = ({ type, message, withHaptic = true }) => {
  const { info } = useHapticFeedback();
  
  useEffect(() => {
    if (withHaptic) {
      info();
    }
  }, [withHaptic, info]);

  const getAuthMessage = () => {
    if (message) return message;
    
    switch (type) {
      case 'login':
        return 'Verificando suas credenciais...';
      case 'register':
        return 'Criando sua conta com segurança...';
      case 'reset':
        return 'Enviando instruções para recuperação...';
      case 'verify':
        return 'Verificando seu email...';
      default:
        return 'Processando autenticação...';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'login': return '🔐';
      case 'register': return '👤';
      case 'reset': return '🔄';
      case 'verify': return '✉️';
      default: return '🔒';
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '32px',
      textAlign: 'center',
      background: 'rgba(59, 130, 246, 0.05)',
      borderRadius: '12px',
      border: '1px solid rgba(59, 130, 246, 0.1)'
    }}>
      <div style={{
        fontSize: '2rem',
        marginBottom: '16px',
        animation: 'pulse 2s infinite'
      }}>
        {getIcon()}
      </div>
      
      <MedicalLoadingSpinner size="medium" variant="default" />
      
      <div style={{
        marginTop: '16px',
        fontSize: '0.875rem',
        color: '#64748b',
        fontWeight: '500'
      }}>
        {getAuthMessage()}
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
};

// Loading State para Busca Inteligente
export const SearchLoadingState: React.FC<{
  query?: string;
  withHaptic?: boolean;
}> = ({ query, withHaptic = false }) => {
  const { info } = useHapticFeedback();
  
  useEffect(() => {
    if (withHaptic) {
      info();
    }
  }, [withHaptic, info]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '16px',
      background: 'rgba(34, 197, 94, 0.05)',
      borderRadius: '8px',
      border: '1px solid rgba(34, 197, 94, 0.1)'
    }}>
      <div style={{
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        border: '2px solid rgba(34, 197, 94, 0.3)',
        borderTopColor: '#22c55e',
        animation: 'spin 1s linear infinite'
      }} />
      
      <div style={{
        fontSize: '0.875rem',
        color: '#059669'
      }}>
        {query ? `Buscando por "${query}"...` : 'Processando busca...'}
      </div>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

// Loading State para Export/Download
export const ExportLoadingState: React.FC<{
  format: 'pdf' | 'excel' | 'word' | 'email';
  progress?: number;
  stage?: string;
  withHaptic?: boolean;
}> = ({ format, progress = 0, stage, withHaptic = true }) => {
  const { calculation } = useHapticFeedback();
  
  useEffect(() => {
    if (withHaptic && progress === 0) {
      calculation();
    }
  }, [withHaptic, progress, calculation]);

  const getFormatInfo = () => {
    switch (format) {
      case 'pdf':
        return { icon: '📄', name: 'PDF', color: '#dc2626' };
      case 'excel':
        return { icon: '📊', name: 'Excel', color: '#059669' };
      case 'word':
        return { icon: '📝', name: 'Word', color: '#2563eb' };
      case 'email':
        return { icon: '📧', name: 'Email', color: '#7c3aed' };
      default:
        return { icon: '📋', name: 'Arquivo', color: '#64748b' };
    }
  };

  const formatInfo = getFormatInfo();

  return (
    <div style={{
      padding: '24px',
      textAlign: 'center',
      background: 'white',
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{
        fontSize: '3rem',
        marginBottom: '16px',
        animation: 'bounce 2s infinite'
      }}>
        {formatInfo.icon}
      </div>
      
      <div style={{
        fontSize: '1rem',
        fontWeight: '600',
        color: formatInfo.color,
        marginBottom: '12px'
      }}>
        Gerando {formatInfo.name}...
      </div>
      
      {stage && (
        <div style={{
          fontSize: '0.75rem',
          color: '#64748b',
          marginBottom: '16px'
        }}>
          {stage}
        </div>
      )}
      
      {/* Barra de Progresso */}
      {progress > 0 && (
        <div style={{
          background: '#f1f5f9',
          borderRadius: '8px',
          height: '8px',
          overflow: 'hidden',
          marginBottom: '12px'
        }}>
          <div style={{
            background: formatInfo.color,
            height: '100%',
            width: `${Math.min(progress, 100)}%`,
            borderRadius: '8px',
            transition: 'width 0.3s ease',
            boxShadow: `0 0 8px ${formatInfo.color}40`
          }} />
        </div>
      )}
      
      <div style={{
        fontSize: '0.875rem',
        color: '#64748b'
      }}>
        {progress > 0 ? `${Math.round(progress)}% concluído` : 'Preparando documento...'}
      </div>

      <style jsx>{`
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
          60% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
};