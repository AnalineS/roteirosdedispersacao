'use client';

import React, { useState } from 'react';
import { FallbackResult } from '@/services/fallbackSystem';
import { theme } from '@/config/theme';

interface FallbackIndicatorProps {
  isActive: boolean;
  result?: FallbackResult | null;
  systemHealth?: string;
  attempts?: number;
  showDetails?: boolean;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export const FallbackIndicator: React.FC<FallbackIndicatorProps> = ({
  isActive,
  result,
  systemHealth = 'good',
  attempts = 0,
  showDetails = false,
  onRetry,
  onDismiss
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isActive && !result) {
    return null;
  }

  const getStatusColor = () => {
    if (systemHealth === 'critical') return theme.colors.danger[500];
    if (systemHealth === 'degraded') return theme.colors.warning[500];
    if (result?.source === 'emergency') return theme.colors.danger[500];
    if (result?.source === 'cache') return theme.colors.success[500];
    if (result?.source === 'local_knowledge') return theme.colors.primary[500];
    return theme.colors.neutral[400];
  };

  const getStatusIcon = () => {
    if (isActive && !result) return '🔄';
    if (systemHealth === 'critical') return '🚨';
    if (systemHealth === 'degraded') return '⚠️';
    if (result?.source === 'emergency') return '🆘';
    if (result?.source === 'cache') return '💾';
    if (result?.source === 'local_knowledge') return '📚';
    return '🛡️';
  };

  const getStatusText = () => {
    if (isActive && !result) return 'Ativando fallback...';
    if (systemHealth === 'critical') return 'Sistema crítico';
    if (systemHealth === 'degraded') return 'Sistema degradado';
    if (result?.source === 'emergency') return 'Resposta de emergência';
    if (result?.source === 'cache') return 'Resposta do cache';
    if (result?.source === 'local_knowledge') return 'Base local';
    return 'Sistema de fallback';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence > 0.7) return theme.colors.success[500];
    if (confidence > 0.4) return theme.colors.warning[500];
    return theme.colors.danger[500];
  };

  return (
    <>
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .fallback-indicator {
          animation: ${isActive && !result ? 'pulse 2s infinite' : 'none'};
        }
        
        .fallback-spinner {
          animation: spin 1s linear infinite;
        }
      `}</style>

      <div 
        className="fallback-indicator"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          borderRadius: '16px',
          backgroundColor: theme.colors.neutral[50],
          border: `2px solid ${getStatusColor()}`,
          color: getStatusColor(),
          fontSize: '0.8rem',
          fontWeight: 500,
          cursor: showDetails ? 'pointer' : 'default',
          transition: 'all 0.3s ease',
          position: 'relative',
          maxWidth: '280px'
        }}
        onClick={() => showDetails && setIsExpanded(!isExpanded)}
        role={showDetails ? "button" : "status"}
        aria-label={getStatusText()}
      >
        <span 
          className={isActive && !result ? 'fallback-spinner' : ''}
          style={{ fontSize: '1rem' }}
        >
          {getStatusIcon()}
        </span>
        
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'flex-start',
          minWidth: 0,
          flex: 1
        }}>
          <span style={{ 
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            width: '100%'
          }}>
            {getStatusText()}
          </span>
          
          {result && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              fontSize: '0.7rem',
              opacity: 0.8
            }}>
              <span>
                Confiança: {Math.round(result.confidence * 100)}%
              </span>
              {attempts > 1 && (
                <span>
                  | Tentativa {attempts}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Botões de ação */}
        {result && (onRetry || onDismiss) && (
          <div style={{ 
            display: 'flex', 
            gap: '4px',
            marginLeft: '8px'
          }}>
            {onRetry && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRetry();
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: getStatusColor(),
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  padding: '2px 4px',
                  borderRadius: '4px',
                  opacity: 0.7,
                  transition: 'opacity 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
                title="Tentar novamente"
              >
                🔄
              </button>
            )}
            {onDismiss && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDismiss();
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: getStatusColor(),
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  padding: '2px 4px',
                  borderRadius: '4px',
                  opacity: 0.7,
                  transition: 'opacity 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
                title="Dispensar"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* Detalhes expandidos */}
        {showDetails && isExpanded && result && (
          <div style={{
            position: 'absolute',
            bottom: '100%',
            left: '0',
            right: '0',
            marginBottom: '8px',
            padding: '12px',
            backgroundColor: 'white',
            border: `1px solid ${theme.colors.neutral[200]}`,
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            fontSize: '0.75rem',
            zIndex: 1001,
            minWidth: '300px'
          }}>
            {/* Informações da resposta de fallback */}
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                Resposta de Fallback:
              </div>
              <div style={{ marginBottom: '6px' }}>
                Fonte: <span style={{ 
                  color: getStatusColor(),
                  fontWeight: 'bold'
                }}>
                  {result.source === 'cache' ? 'Cache Local' :
                   result.source === 'local_knowledge' ? 'Base de Conhecimento' :
                   result.source === 'emergency' ? 'Sistema de Emergência' :
                   'Genérico'}
                </span>
              </div>
              <div style={{ marginBottom: '6px' }}>
                Confiança: <span style={{ 
                  color: getConfidenceColor(result.confidence),
                  fontWeight: 'bold'
                }}>
                  {Math.round(result.confidence * 100)}%
                </span>
              </div>
              {attempts > 1 && (
                <div style={{ marginBottom: '6px' }}>
                  Tentativas: {attempts}
                </div>
              )}
            </div>

            {/* Sugestão */}
            {result.suggestion && (
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                  Sugestão:
                </div>
                <div style={{ 
                  color: theme.colors.neutral[600],
                  fontStyle: 'italic'
                }}>
                  {result.suggestion}
                </div>
              </div>
            )}

            {/* Contato de emergência */}
            {result.emergency_contact && (
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                  Contato de Emergência:
                </div>
                <div style={{ 
                  color: theme.colors.danger[600],
                  fontWeight: 'bold'
                }}>
                  {result.emergency_contact}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

// Componente para mostrar aviso de sistema degradado
export const SystemHealthWarning: React.FC<{
  systemHealth: string;
  onResetFailures?: () => void;
}> = ({ systemHealth, onResetFailures }) => {
  if (systemHealth === 'good') {
    return null;
  }

  const isCritical = systemHealth === 'critical';
  
  return (
    <div style={{
      padding: '12px 16px',
      backgroundColor: isCritical ? theme.colors.danger[50] : theme.colors.warning[50],
      border: `1px solid ${isCritical ? theme.colors.danger[200] : theme.colors.warning[200]}`,
      borderRadius: '8px',
      margin: '8px 0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '1.2rem' }}>
          {isCritical ? '🚨' : '⚠️'}
        </span>
        <div>
          <div style={{ 
            fontWeight: 'bold',
            color: isCritical ? theme.colors.danger[700] : theme.colors.warning[700],
            fontSize: '0.9rem'
          }}>
            {isCritical ? 'Sistema Crítico' : 'Sistema Degradado'}
          </div>
          <div style={{ 
            fontSize: '0.8rem',
            color: isCritical ? theme.colors.danger[600] : theme.colors.warning[600]
          }}>
            {isCritical 
              ? 'Múltiplas falhas detectadas. Usando apenas respostas de emergência.'
              : 'Instabilidade detectada. Usando fallbacks quando necessário.'
            }
          </div>
        </div>
      </div>
      
      {onResetFailures && (
        <button
          onClick={onResetFailures}
          style={{
            padding: '6px 12px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: isCritical ? theme.colors.danger[600] : theme.colors.warning[600],
            color: 'white',
            fontSize: '0.8rem',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          Reset
        </button>
      )}
    </div>
  );
};

// Export default para lazy loading
export default FallbackIndicator;