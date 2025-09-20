'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { modernChatTheme } from '@/config/modernTheme';
import { CheckIcon, HeartIcon, DoctorIcon, AlertIcon } from '@/components/icons/FlatOutlineIcons';
import type { RoutingAnalysis } from '@/services/intelligentRouting';
import type { Persona } from '@/services/api';

interface RoutingSuggestionModalProps {
  isVisible: boolean;
  analysis: RoutingAnalysis;
  recommendedPersona: Persona;
  currentPersonaId: string | null;
  personas: Record<string, Persona>;
  onAccept: (personaId: string) => void;
  onReject: () => void;
  onClose: () => void;
  isLoading?: boolean;
}

export default function RoutingSuggestionModal({
  isVisible,
  analysis,
  recommendedPersona,
  currentPersonaId,
  personas,
  onAccept,
  onReject,
  onClose,
  isLoading = false
}: RoutingSuggestionModalProps): React.JSX.Element | null {

  const [isAnimating, setIsAnimating] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);

  // Auto-close após 15 segundos se não houver interação
  useEffect(() => {
    if (!isVisible) return;

    const timer = setTimeout(() => {
      setIsAnimating(true);
      setTimeout(onClose, 300);
    }, 15000);

    return () => clearTimeout(timer);
  }, [isVisible, onClose]);

  // Animar entrada do modal
  useEffect(() => {
    if (isVisible) {
      setIsAnimating(false);
      setShowExplanation(false);
    }
  }, [isVisible]);

  const handleAccept = useCallback(() => {
    setIsAnimating(true);
    setTimeout(() => {
      onAccept(analysis.recommendedPersonaId);
      onClose();
    }, 200);
  }, [analysis.recommendedPersonaId, onAccept, onClose]);

  const handleReject = useCallback(() => {
    setIsAnimating(true);
    setTimeout(() => {
      onReject();
      onClose();
    }, 200);
  }, [onReject, onClose]);

  const getPersonaIcon = (personaId: string) => {
    switch (personaId) {
      case 'dr_gasnelio':
        return <DoctorIcon size={24} color={modernChatTheme.colors.personas.gasnelio.primary} />;
      case 'ga':
        return <HeartIcon size={24} color={modernChatTheme.colors.personas.ga.primary} />;
      default:
        return <DoctorIcon size={24} color={modernChatTheme.colors.neutral.text} />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return '#22c55e'; // Green - Alta confiança
    if (confidence >= 0.6) return '#f59e0b'; // Amber - Média confiança
    return '#ef4444'; // Red - Baixa confiança
  };

  if (!isVisible) return null;

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
      zIndex: 1000,
      padding: '1rem',
      opacity: isAnimating ? 0 : 1,
      transition: 'opacity 0.3s ease'
    }}>
      <div style={{
        background: 'white',
        borderRadius: modernChatTheme.borderRadius.lg,
        boxShadow: modernChatTheme.shadows.floating,
        maxWidth: '450px',
        width: '100%',
        maxHeight: '80vh',
        overflow: 'auto',
        transform: isAnimating ? 'scale(0.95)' : 'scale(1)',
        transition: 'all 0.3s ease'
      }}>
        
        {/* Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: `1px solid ${modernChatTheme.colors.neutral.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <div style={{
              padding: '0.5rem',
              background: `${modernChatTheme.colors.personas.gasnelio.primary}15`,
              borderRadius: modernChatTheme.borderRadius.md,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <AlertIcon size={20} color={modernChatTheme.colors.personas.gasnelio.primary} />
            </div>
            <div>
              <h3 style={{
                fontSize: '1.1rem',
                fontWeight: '700',
                color: modernChatTheme.colors.neutral.text,
                margin: 0,
                marginBottom: '0.25rem'
              }}>
                Sugestão de Especialista
              </h3>
              <p style={{
                fontSize: '0.875rem',
                color: modernChatTheme.colors.neutral.textMuted,
                margin: 0
              }}>
                Baseado na sua pergunta
              </p>
            </div>
          </div>
          
          {/* Loading Indicator */}
          {isLoading && (
            <div style={{
              width: '20px',
              height: '20px',
              border: `2px solid ${modernChatTheme.colors.neutral.border}`,
              borderTop: `2px solid ${modernChatTheme.colors.personas.gasnelio.primary}`,
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
          )}
        </div>

        {/* Content */}
        <div style={{
          padding: '1.5rem'
        }}>
          {/* Persona Recommendation */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1rem',
            padding: '1rem',
            background: `${modernChatTheme.colors.personas.gasnelio.primary}08`,
            borderRadius: modernChatTheme.borderRadius.md,
            border: `1px solid ${modernChatTheme.colors.personas.gasnelio.primary}20`
          }}>
            {getPersonaIcon(analysis.recommendedPersonaId)}
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: modernChatTheme.colors.neutral.text,
                marginBottom: '0.25rem'
              }}>
                {recommendedPersona.name}
              </div>
              <div style={{
                fontSize: '0.875rem',
                color: modernChatTheme.colors.neutral.textMuted,
                marginBottom: '0.5rem'
              }}>
                {recommendedPersona.description}
              </div>
              
              {/* Confidence Badge */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.25rem 0.75rem',
                background: `${getConfidenceColor(analysis.confidence)}15`,
                border: `1px solid ${getConfidenceColor(analysis.confidence)}40`,
                borderRadius: modernChatTheme.borderRadius.full,
                fontSize: '0.75rem',
                fontWeight: '600',
                color: getConfidenceColor(analysis.confidence)
              }}>
                <div style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: getConfidenceColor(analysis.confidence)
                }} />
                {Math.round(analysis.confidence * 100)}% confiança
              </div>
            </div>
          </div>

          {/* Reasoning */}
          <div style={{
            marginBottom: '1rem'
          }}>
            <div style={{
              fontSize: '0.875rem',
              fontWeight: '600',
              color: modernChatTheme.colors.neutral.text,
              marginBottom: '0.5rem'
            }}>
              Por que essa sugestão?
            </div>
            <div style={{
              fontSize: '0.875rem',
              color: modernChatTheme.colors.neutral.textMuted,
              lineHeight: '1.5',
              padding: '0.75rem',
              background: modernChatTheme.colors.neutral.surface,
              borderRadius: modernChatTheme.borderRadius.md
            }}>
              {analysis.reasoning}
            </div>
          </div>

          {/* Explanation Toggle */}
          {!showExplanation ? (
            <button
              onClick={() => setShowExplanation(true)}
              style={{
                background: 'none',
                border: 'none',
                color: modernChatTheme.colors.personas.gasnelio.primary,
                fontSize: '0.875rem',
                cursor: 'pointer',
                marginBottom: '1rem',
                textDecoration: 'underline'
              }}
            >
              Ver detalhes da análise
            </button>
          ) : (
            <div style={{
              marginBottom: '1rem',
              padding: '0.75rem',
              background: `${modernChatTheme.colors.neutral.surface}80`,
              borderRadius: modernChatTheme.borderRadius.md,
              fontSize: '0.8rem',
              color: modernChatTheme.colors.neutral.textMuted,
              lineHeight: '1.4'
            }}>
              <strong>Escopo:</strong> {analysis.scope}<br/>
              {analysis.alternatives.length > 0 && (
                <>
                  <strong>Alternativas:</strong>{' '}
                  {analysis.alternatives.map((alt, idx) => (
                    <span key={idx}>
                      {personas[alt.personaId]?.name} ({Math.round(alt.confidence * 100)}%)
                      {idx < analysis.alternatives.length - 1 ? ', ' : ''}
                    </span>
                  ))}
                </>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: '0.75rem',
            justifyContent: 'flex-end'
          }}>
            <button
              onClick={handleReject}
              disabled={isLoading}
              style={{
                padding: '0.75rem 1.5rem',
                border: `1px solid ${modernChatTheme.colors.neutral.border}`,
                background: 'white',
                color: modernChatTheme.colors.neutral.text,
                borderRadius: modernChatTheme.borderRadius.md,
                fontSize: '0.875rem',
                fontWeight: '500',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: isLoading ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.background = modernChatTheme.colors.neutral.surface;
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.background = 'white';
                }
              }}
            >
              Continuar com {currentPersonaId ? personas[currentPersonaId]?.name : 'atual'}
            </button>
            
            <button
              onClick={handleAccept}
              disabled={isLoading}
              style={{
                padding: '0.75rem 1.5rem',
                border: 'none',
                background: modernChatTheme.colors.personas.gasnelio.primary,
                color: 'white',
                borderRadius: modernChatTheme.borderRadius.md,
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                opacity: isLoading ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseEnter={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.background = `${modernChatTheme.colors.personas.gasnelio.primary}dd`;
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading) {
                  e.currentTarget.style.background = modernChatTheme.colors.personas.gasnelio.primary;
                }
              }}
            >
              <CheckIcon size={16} color="white" />
              Trocar para {recommendedPersona.name}
            </button>
          </div>
        </div>
      </div>

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}