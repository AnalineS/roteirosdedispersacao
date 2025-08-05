'use client';

import { ProgressData } from './index';

interface ModuleProgressProps {
  progress: ProgressData;
  size?: 'small' | 'medium' | 'large';
  showDetails?: boolean;
}

export default function ModuleProgress({ 
  progress, 
  size = 'medium', 
  showDetails = true 
}: ModuleProgressProps) {
  
  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < progress.completedSteps) return 'completed';
    if (stepIndex === progress.currentStep) return 'current';
    return 'pending';
  };

  const getStepColor = (status: string) => {
    switch (status) {
      case 'completed': return '#4caf50';
      case 'current': return '#1976d2';
      case 'pending': return '#e0e0e0';
      default: return '#e0e0e0';
    }
  };

  const getStatusIcon = () => {
    switch (progress.status) {
      case 'completed': return '✅';
      case 'in-progress': return '⏳';
      case 'not-started': return '⭕';
      default: return '⭕';
    }
  };

  const getCategoryColor = () => {
    switch (progress.category) {
      case 'learning': return '#1976d2';
      case 'interaction': return '#4caf50';
      case 'progress': return '#ff9800';
      case 'tools': return '#9c27b0';
      default: return '#666';
    }
  };

  // Generate steps array
  const steps = Array.from({ length: progress.totalSteps }, (_, index) => ({
    index: index + 1,
    status: getStepStatus(index),
    title: `Passo ${index + 1}`,
    description: `Conteúdo do passo ${index + 1}`
  }));

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: size === 'small' ? '16px' : size === 'large' ? '32px' : '24px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      border: `2px solid ${getCategoryColor()}20`
    }}>
      {/* Module Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            fontSize: size === 'small' ? '1.5rem' : '2rem',
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: getCategoryColor(),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
          }}>
            📚
          </div>
          
          <div>
            <h3 style={{
              margin: 0,
              fontSize: size === 'small' ? '1.2rem' : size === 'large' ? '1.8rem' : '1.5rem',
              color: '#333',
              fontWeight: 'bold'
            }}>
              {progress.moduleName}
            </h3>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginTop: '4px'
            }}>
              <span style={{
                fontSize: '0.85rem',
                color: '#666'
              }}>
                {progress.completedSteps}/{progress.totalSteps} passos
              </span>
              {progress.estimatedTime && (
                <span style={{
                  fontSize: '0.85rem',
                  color: '#666'
                }}>
                  ⏱️ {progress.estimatedTime}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Status and Progress */}
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontSize: '1.5rem',
            marginBottom: '4px'
          }}>
            {getStatusIcon()}
          </div>
          <div style={{
            fontSize: '1.2rem',
            fontWeight: 'bold',
            color: getCategoryColor()
          }}>
            {progress.completionRate}%
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{
        width: '100%',
        height: '8px',
        background: '#e0e0e0',
        borderRadius: '4px',
        marginBottom: '24px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: `${progress.completionRate}%`,
          height: '100%',
          background: getCategoryColor(),
          borderRadius: '4px',
          transition: 'width 0.5s ease'
        }} />
      </div>

      {/* Steps Timeline */}
      {showDetails && (
        <div>
          <h4 style={{
            fontSize: '1.1rem',
            color: '#333',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            🗺️ Roteiro do Módulo
          </h4>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {steps.map((step, index) => (
              <div
                key={step.index}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '12px',
                  borderRadius: '8px',
                  background: step.status === 'current' ? `${getCategoryColor()}10` : '#f8fafc',
                  border: step.status === 'current' ? `2px solid ${getCategoryColor()}` : '1px solid #e0e0e0',
                  opacity: step.status === 'pending' ? 0.6 : 1
                }}
              >
                {/* Step Number/Icon */}
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: getStepColor(step.status),
                  color: step.status === 'pending' ? '#666' : 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.9rem',
                  fontWeight: 'bold',
                  flexShrink: 0
                }}>
                  {step.status === 'completed' ? '✓' : step.index}
                </div>

                {/* Step Content */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '0.95rem',
                    fontWeight: step.status === 'current' ? 'bold' : 'normal',
                    color: step.status === 'current' ? getCategoryColor() : '#333',
                    marginBottom: '2px'
                  }}>
                    {step.title}
                  </div>
                  <div style={{
                    fontSize: '0.8rem',
                    color: '#666'
                  }}>
                    {step.description}
                  </div>
                </div>

                {/* Step Status */}
                <div style={{
                  fontSize: '0.75rem',
                  color: getStepColor(step.status),
                  fontWeight: 'bold',
                  flexShrink: 0
                }}>
                  {step.status === 'completed' && 'Concluído'}
                  {step.status === 'current' && 'Em andamento'}
                  {step.status === 'pending' && 'Pendente'}
                </div>

                {/* Connection line */}
                {index < steps.length - 1 && (
                  <div style={{
                    position: 'absolute',
                    left: '40px',
                    bottom: '-12px',
                    width: '2px',
                    height: '12px',
                    background: index < progress.completedSteps ? getCategoryColor() : '#e0e0e0'
                  }} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{
        marginTop: '24px',
        display: 'flex',
        gap: '12px',
        justifyContent: 'flex-end'
      }}>
        {progress.status === 'not-started' && (
          <button style={{
            padding: '10px 20px',
            background: getCategoryColor(),
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}>
            🚀 Iniciar Módulo
          </button>
        )}

        {progress.status === 'in-progress' && (
          <button style={{
            padding: '10px 20px',
            background: getCategoryColor(),
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}>
            ▶️ Continuar
          </button>
        )}

        {progress.status === 'completed' && (
          <button style={{
            padding: '10px 20px',
            background: '#4caf50',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}>
            📖 Revisar
          </button>
        )}
      </div>
    </div>
  );
}