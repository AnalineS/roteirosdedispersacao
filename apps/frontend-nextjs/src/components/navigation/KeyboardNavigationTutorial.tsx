'use client';

/**
 * Keyboard Navigation Tutorial
 * Tutorial interativo para ensinar navegação por teclado
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ACCESS_KEYS } from '@/constants/medicalShortcuts';
import { secureLogger } from '@/utils/secureLogger';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  keys: string[];
  action: string;
  isCompleted: boolean;
  isActive: boolean;
}

interface KeyboardNavigationTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (completedSteps: number) => void;
}

const TUTORIAL_STEPS: Omit<TutorialStep, 'isCompleted' | 'isActive'>[] = [
  {
    id: 'tab_navigation',
    title: 'Navegação Básica',
    description: 'Use Tab para mover entre elementos focáveis e Shift+Tab para voltar',
    keys: ['Tab', 'Shift+Tab'],
    action: 'Pressione Tab algumas vezes para praticar'
  },
  {
    id: 'fast_access_interactions',
    title: 'Atalhos de Emergência Médica',
    description: 'Acesse rapidamente ferramentas críticas para situações de emergência',
    keys: ['Alt+I', 'Alt+C', 'Alt+D'],
    action: 'Alt+I para Interações, Alt+C para Contraindicações, Alt+D para Doses'
  },
  {
    id: 'search_access',
    title: 'Busca Rápida',
    description: 'Acesse o campo de busca rapidamente de qualquer lugar',
    keys: ['Ctrl+K', '/'],
    action: 'Pressione Ctrl+K ou / para abrir a busca'
  },
  {
    id: 'persona_switching',
    title: 'Troca de Personas',
    description: 'Alterne entre Dr. Gasnelio e Gá rapidamente durante o chat',
    keys: ['Ctrl+1', 'Ctrl+2'],
    action: 'Ctrl+1 para Dr. Gasnelio, Ctrl+2 para Gá'
  },
  {
    id: 'help_access',
    title: 'Ajuda e Suporte',
    description: 'Acesse ajuda e recursos de suporte rapidamente',
    keys: ['F1', 'Ctrl+?'],
    action: 'F1 ou Ctrl+? para abrir ajuda'
  },
  {
    id: 'developer_tools',
    title: 'Ferramentas de Desenvolvedor',
    description: 'Acesse ferramentas avançadas (apenas em desenvolvimento)',
    keys: ['Ctrl+Shift+U'],
    action: 'Ctrl+Shift+U para UX Instrumentation Panel'
  }
];

export default function KeyboardNavigationTutorial({
  isOpen,
  onClose,
  onComplete
}: KeyboardNavigationTutorialProps) {
  const [steps, setSteps] = useState<TutorialStep[]>(
    TUTORIAL_STEPS.map((step, index) => ({
      ...step,
      isCompleted: false,
      isActive: index === 0
    }))
  );
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [isListening, setIsListening] = useState(false);

  const currentStep = steps[currentStepIndex];

  // Detectar teclas pressionadas para tutorial
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isOpen || !isListening) return;

    const currentStep = steps[currentStepIndex];
    if (!currentStep || currentStep.isCompleted) return;

    // Construir string da tecla pressionada
    const keyParts: string[] = [];
    if (event.ctrlKey) keyParts.push('Ctrl');
    if (event.shiftKey) keyParts.push('Shift');
    if (event.altKey) keyParts.push('Alt');

    // Teclas especiais
    const specialKeys: Record<string, string> = {
      'Tab': 'Tab',
      'F1': 'F1',
      'Slash': '/',
      'KeyK': 'K',
      'Digit1': '1',
      'Digit2': '2',
      'Quote': '?'
    };

    const mainKey = specialKeys[event.code] || event.key.toUpperCase();
    if (mainKey !== 'CONTROL' && mainKey !== 'SHIFT' && mainKey !== 'ALT') {
      keyParts.push(mainKey);
    }

    const pressedKey = keyParts.join('+');

    // Verificar se a tecla pressionada corresponde ao passo atual
    const isCorrectKey = currentStep.keys.some(stepKey => {
      // Normalizar para comparação
      const normalizedStepKey = stepKey.replace(/\s/g, '');
      const normalizedPressedKey = pressedKey.replace(/\s/g, '');
      return normalizedStepKey.toLowerCase() === normalizedPressedKey.toLowerCase();
    });

    if (isCorrectKey) {
      // Prevenir ação padrão para atalhos do tutorial
      event.preventDefault();
      event.stopPropagation();

      // Marcar passo como concluído
      setSteps(prev => prev.map((step, index) =>
        index === currentStepIndex
          ? { ...step, isCompleted: true, isActive: false }
          : step
      ));

      setCompletedCount(prev => prev + 1);

      // Avançar para próximo passo
      if (currentStepIndex < steps.length - 1) {
        setTimeout(() => {
          setCurrentStepIndex(prev => prev + 1);
          setSteps(prev => prev.map((step, index) =>
            index === currentStepIndex + 1
              ? { ...step, isActive: true }
              : step
          ));
        }, 500);
      } else {
        // Tutorial concluído
        setTimeout(() => {
          onComplete(steps.length);
          onClose();
        }, 1000);
      }

      // Log do progresso
      secureLogger.info('Keyboard tutorial step completed', {
        stepId: currentStep.id,
        stepIndex: currentStepIndex,
        keyPressed: pressedKey,
        category: 'tutorial'
      });
    }
  }, [isOpen, isListening, steps, currentStepIndex, onComplete, onClose]);

  // Adicionar/remover listener de teclado
  useEffect(() => {
    if (isOpen && isListening) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, isListening, handleKeyDown]);

  // Iniciar listening quando tutorial abre
  useEffect(() => {
    if (isOpen) {
      setIsListening(true);
      secureLogger.info('Keyboard navigation tutorial started');
    } else {
      setIsListening(false);
    }
  }, [isOpen]);

  const handleSkipStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setSteps(prev => prev.map((step, index) => {
        if (index === currentStepIndex) {
          return { ...step, isCompleted: true, isActive: false };
        }
        if (index === currentStepIndex + 1) {
          return { ...step, isActive: true };
        }
        return step;
      }));
      setCurrentStepIndex(prev => prev + 1);
    } else {
      onComplete(completedCount);
      onClose();
    }
  };

  const handleRestart = () => {
    setSteps(TUTORIAL_STEPS.map((step, index) => ({
      ...step,
      isCompleted: false,
      isActive: index === 0
    })));
    setCurrentStepIndex(0);
    setCompletedCount(0);
    setIsListening(true);
  };

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      role="dialog"
      aria-labelledby="tutorial-title"
      aria-describedby="tutorial-description"
    >
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '2rem',
          maxWidth: '600px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
        }}
      >
        {/* Header */}
        <header style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          <h2 id="tutorial-title" style={{
            margin: '0 0 0.5rem',
            color: '#1e293b',
            fontSize: '1.5rem'
          }}>
            🎯 Tutorial de Navegação por Teclado
          </h2>
          <p id="tutorial-description" style={{
            margin: 0,
            color: '#64748b',
            fontSize: '0.9rem'
          }}>
            Aprenda atalhos para navegar mais rapidamente no sistema
          </p>
        </header>

        {/* Progress */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.5rem'
          }}>
            <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
              Progresso
            </span>
            <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1e293b' }}>
              {completedCount}/{steps.length}
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '8px',
            backgroundColor: '#e2e8f0',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${(completedCount / steps.length) * 100}%`,
              height: '100%',
              backgroundColor: '#10b981',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>

        {/* Current Step */}
        {currentStep && (
          <div style={{
            padding: '1.5rem',
            backgroundColor: '#f8fafc',
            borderRadius: '12px',
            border: '2px solid #e2e8f0',
            marginBottom: '1.5rem'
          }}>
            <h3 style={{
              margin: '0 0 0.75rem',
              color: '#1e293b',
              fontSize: '1.125rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              {currentStep.isCompleted ? '✅' : '🎯'} {currentStep.title}
            </h3>

            <p style={{
              margin: '0 0 1rem',
              color: '#475569',
              lineHeight: '1.5'
            }}>
              {currentStep.description}
            </p>

            <div style={{ marginBottom: '1rem' }}>
              <span style={{
                fontSize: '0.75rem',
                fontWeight: '600',
                color: '#64748b',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Teclas para praticar:
              </span>
              <div style={{
                display: 'flex',
                gap: '0.5rem',
                marginTop: '0.5rem',
                flexWrap: 'wrap'
              }}>
                {currentStep.keys.map(key => (
                  <kbd key={key} style={{
                    padding: '0.25rem 0.5rem',
                    backgroundColor: '#1e293b',
                    color: 'white',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                    border: '1px solid #475569'
                  }}>
                    {key}
                  </kbd>
                ))}
              </div>
            </div>

            <div style={{
              padding: '0.75rem',
              backgroundColor: currentStep.isCompleted ? '#dcfce7' : '#fef3c7',
              borderRadius: '6px',
              fontSize: '0.875rem',
              color: currentStep.isCompleted ? '#166534' : '#92400e'
            }}>
              {currentStep.isCompleted
                ? '✅ Passo concluído! Avançando...'
                : `💡 ${currentStep.action}`
              }
            </div>
          </div>
        )}

        {/* Steps List */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{
            margin: '0 0 1rem',
            fontSize: '0.875rem',
            fontWeight: '600',
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            Todos os Passos
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {steps.map((step, index) => (
              <div key={step.id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.5rem',
                borderRadius: '6px',
                backgroundColor: step.isActive ? '#f0f9ff' : 'transparent',
                border: step.isActive ? '1px solid #0ea5e9' : '1px solid transparent'
              }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: step.isCompleted ? '#10b981' : step.isActive ? '#0ea5e9' : '#e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  color: step.isCompleted || step.isActive ? 'white' : '#64748b',
                  fontWeight: '600'
                }}>
                  {step.isCompleted ? '✓' : index + 1}
                </div>
                <span style={{
                  fontSize: '0.875rem',
                  color: step.isCompleted ? '#10b981' : step.isActive ? '#0ea5e9' : '#64748b',
                  fontWeight: step.isActive ? '600' : '400'
                }}>
                  {step.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div style={{
          display: 'flex',
          gap: '0.75rem',
          justifyContent: 'space-between'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'transparent',
              color: '#64748b',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            Fechar
          </button>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={handleRestart}
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: 'transparent',
                color: '#0ea5e9',
                border: '1px solid #0ea5e9',
                borderRadius: '8px',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              Reiniciar
            </button>

            <button
              onClick={handleSkipStep}
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: '#64748b',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              {currentStepIndex === steps.length - 1 ? 'Finalizar' : 'Pular Passo'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}