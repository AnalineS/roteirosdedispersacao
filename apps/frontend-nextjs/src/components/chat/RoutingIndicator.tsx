'use client';

import { useState, useCallback, useEffect } from 'react';
import PersonaAvatar from './PersonaAvatar';
import type { RoutingAnalysis } from '@/services/intelligentRouting';
import type { Persona } from '@/services/api';

interface RoutingIndicatorProps {
  analysis: RoutingAnalysis;
  recommendedPersona: Persona;
  currentPersonaId: string | null;
  personas: Record<string, Persona>;
  onAcceptRouting: (personaId: string) => void;
  onRejectRouting: () => void;
  onShowExplanation: () => void;
  isMobile?: boolean;
  className?: string;
}

export default function RoutingIndicator({
  analysis,
  recommendedPersona,
  currentPersonaId,
  personas,
  onAcceptRouting,
  onRejectRouting,
  onShowExplanation,
  isMobile = false,
  className = ''
}: RoutingIndicatorProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Auto-fade após alguns segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleAccept = useCallback(() => {
    onAcceptRouting(analysis.recommendedPersonaId);
    setIsVisible(false);
  }, [analysis.recommendedPersonaId, onAcceptRouting]);

  const handleReject = useCallback(() => {
    onRejectRouting();
    setIsVisible(false);
  }, [onRejectRouting]);

  const handleToggleExpanded = useCallback(() => {
    setIsExpanded(!isExpanded);
    onShowExplanation();
  }, [isExpanded, onShowExplanation]);

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return '#4caf50'; // Verde - alta confiança
    if (confidence >= 0.6) return '#ff9800'; // Laranja - média confiança  
    return '#f44336'; // Vermelho - baixa confiança
  };

  const getConfidenceText = (confidence: number): string => {
    if (confidence >= 0.8) return 'Alta confiança';
    if (confidence >= 0.6) return 'Média confiança';
    return 'Baixa confiança';
  };

  const isCurrentPersona = currentPersonaId === analysis.recommendedPersonaId;

  if (!isVisible) return null;

  return (
    <div
      className={className}
      style={{
        background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
        border: '1px solid #2196f3',
        borderRadius: '12px',
        margin: isMobile ? '8px 0' : '12px 0',
        padding: isMobile ? '12px' : '16px',
        boxShadow: '0 2px 8px rgba(33, 150, 243, 0.2)',
        opacity: isAnimating ? 0.7 : 1,
        transition: 'all 0.3s ease',
        position: 'relative'
      }}
      role="alert"
      aria-live="polite"
    >
      {/* Header com indicador de roteamento */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? '8px' : '12px',
        marginBottom: isExpanded ? '12px' : '0',
        flexWrap: isMobile ? 'wrap' : 'nowrap'
      }}>
        {/* Ícone de roteamento */}
        <div style={{
          fontSize: '1.2rem',
          animation: 'spin 2s linear infinite'
        }}>
          🔄
        </div>

        {/* Avatar da persona recomendada */}
        <PersonaAvatar
          persona={recommendedPersona}
          personaId={analysis.recommendedPersonaId}
          size="small"
          showStatus={false}
          ariaLabel={`Avatar de ${recommendedPersona.name}, especialista recomendado`}
        />

        {/* Texto de roteamento */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: isMobile ? '0.85rem' : '0.9rem',
            fontWeight: 'bold',
            color: '#1976d2',
            marginBottom: '2px'
          }}>
            {isCurrentPersona 
              ? `Continuando com ${recommendedPersona.name}`
              : `Roteando para ${recommendedPersona.name}`
            }
          </div>
          <div style={{
            fontSize: isMobile ? '0.75rem' : '0.8rem',
            color: '#666'
          }}>
            {analysis.reasoning}
          </div>
        </div>

        {/* Indicador de confiança */}
        <div style={{
          fontSize: '0.7rem',
          padding: '2px 6px',
          borderRadius: '10px',
          background: getConfidenceColor(analysis.confidence),
          color: 'white',
          fontWeight: 'bold',
          whiteSpace: 'nowrap'
        }}>
          {Math.round(analysis.confidence * 100)}%
        </div>
      </div>

      {/* Botões de ação */}
      {!isCurrentPersona && (
        <div style={{
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          flexWrap: isMobile ? 'wrap' : 'nowrap'
        }}>
          <button
            onClick={handleAccept}
            style={{
              background: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: isMobile ? '6px 12px' : '8px 16px',
              fontSize: isMobile ? '0.8rem' : '0.85rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#1565c0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#1976d2';
            }}
            aria-label={`Aceitar roteamento para ${recommendedPersona.name}`}
          >
            ✓ Continuar
          </button>

          {/* Mostrar alternativas se houver outras personas */}
          {Object.keys(personas).length > 1 && (
            <select
              onChange={(e) => {
                if (e.target.value && e.target.value !== analysis.recommendedPersonaId) {
                  onAcceptRouting(e.target.value);
                  setIsVisible(false);
                }
              }}
              style={{
                padding: isMobile ? '6px 8px' : '8px 12px',
                borderRadius: '6px',
                border: '1px solid #ccc',
                fontSize: isMobile ? '0.8rem' : '0.85rem',
                background: 'white',
                cursor: 'pointer'
              }}
              aria-label="Escolher especialista alternativo"
            >
              <option value="">Trocar por...</option>
              {Object.entries(personas).map(([id, persona]) => {
                if (id !== analysis.recommendedPersonaId) {
                  return (
                    <option key={id} value={id}>
                      {persona.name}
                    </option>
                  );
                }
                return null;
              })}
            </select>
          )}

          <button
            onClick={handleToggleExpanded}
            style={{
              background: 'transparent',
              border: '1px solid #1976d2',
              color: '#1976d2',
              borderRadius: '6px',
              padding: isMobile ? '6px 8px' : '8px 12px',
              fontSize: isMobile ? '0.7rem' : '0.8rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
            aria-label={isExpanded ? 'Ocultar explicação' : 'Mostrar explicação'}
          >
            {isExpanded ? 'Ocultar' : 'Por quê?'}
          </button>
        </div>
      )}

      {/* Explicação expandida */}
      {isExpanded && (
        <div style={{
          marginTop: '12px',
          padding: '12px',
          background: 'rgba(255, 255, 255, 0.7)',
          borderRadius: '8px',
          fontSize: isMobile ? '0.8rem' : '0.85rem',
          lineHeight: '1.4'
        }}>
          <div style={{ marginBottom: '8px' }}>
            <strong>Análise de especialização:</strong>
          </div>
          
          <div style={{ marginBottom: '8px' }}>
            • <strong>Escopo:</strong> {analysis.scope}
          </div>
          
          <div style={{ marginBottom: '8px' }}>
            • <strong>Confiança:</strong> {getConfidenceText(analysis.confidence)} ({Math.round(analysis.confidence * 100)}%)
          </div>
          
          <div style={{ marginBottom: '8px' }}>
            • <strong>Expertise de {recommendedPersona.name}:</strong> {recommendedPersona.target_audience}
          </div>

          {analysis.alternatives.length > 0 && (
            <div>
              • <strong>Alternativas:</strong> {analysis.alternatives.map(alt => 
                personas[alt.personaId]?.name
              ).join(', ')}
            </div>
          )}
        </div>
      )}

      {/* Botão de fechar */}
      <button
        onClick={() => setIsVisible(false)}
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          background: 'transparent',
          border: 'none',
          fontSize: '1rem',
          cursor: 'pointer',
          color: '#666',
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
        aria-label="Fechar indicador de roteamento"
      >
        ✕
      </button>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}