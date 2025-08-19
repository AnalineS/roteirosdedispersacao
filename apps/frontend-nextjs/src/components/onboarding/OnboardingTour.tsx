'use client';

import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Check } from 'lucide-react';

interface TourStep {
  id: string;
  title: string;
  content: string;
  target?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  action?: {
    label: string;
    onClick: () => void;
  };
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Bem-vindo ao Roteiros de Dispensação',
    content: 'Esta plataforma oferece orientação segura e confiável para dispensação de medicamentos no tratamento da hanseníase.',
  },
  {
    id: 'assistants',
    title: 'Conheça Nossos Assistentes',
    content: 'Dr. Gasnelio responde questões técnicas com precisão científica. Gá explica de forma simples e acolhedora.',
    target: '.hero-visual',
    position: 'left'
  },
  {
    id: 'search',
    title: 'Busca Inteligente',
    content: 'Digite medicamentos, dosagens ou protocolos para encontrar informações rapidamente.',
    target: '.hero-search',
    position: 'bottom'
  },
  {
    id: 'chat',
    title: 'Chat Especializado',
    content: 'Converse com nossos assistentes para tirar dúvidas específicas sobre dispensação.',
    target: '.hero-btn-primary',
    position: 'bottom'
  },
  {
    id: 'resources',
    title: 'Material Educativo',
    content: 'Acesse guias, protocolos e materiais de apoio sempre atualizados.',
    target: '.hero-btn-secondary',
    position: 'bottom'
  }
];

interface OnboardingTourProps {
  onComplete?: () => void;
}

export default function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenTour, setHasSeenTour] = useState(false);

  useEffect(() => {
    const tourSeen = localStorage.getItem('onboarding-tour-completed');
    if (!tourSeen) {
      setTimeout(() => setIsVisible(true), 1000);
    } else {
      setHasSeenTour(true);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    setIsVisible(false);
    localStorage.setItem('onboarding-tour-completed', 'skipped');
  };

  const handleComplete = () => {
    setIsVisible(false);
    localStorage.setItem('onboarding-tour-completed', 'true');
    onComplete?.();
  };

  const handleRestart = () => {
    setCurrentStep(0);
    setIsVisible(true);
  };

  const step = tourSteps[currentStep];
  const progress = ((currentStep + 1) / tourSteps.length) * 100;

  if (!isVisible && !hasSeenTour) return null;

  return (
    <>
      {/* Botão para Reiniciar Tour */}
      {hasSeenTour && !isVisible && (
        <button 
          onClick={handleRestart}
          className="tour-restart-btn"
          aria-label="Reiniciar tour"
        >
          <span className="tour-restart-icon">?</span>
          <span className="tour-restart-text">Tour Guiado</span>
        </button>
      )}

      {/* Overlay e Modal do Tour */}
      {isVisible && (
        <>
          <div className="tour-overlay" onClick={handleSkip} />
          
          <div className="tour-modal">
            {/* Header */}
            <div className="tour-header">
              <div className="tour-progress">
                <div 
                  className="tour-progress-bar" 
                  style={{ width: `${progress}%` }}
                />
              </div>
              <button 
                onClick={handleSkip}
                className="tour-close"
                aria-label="Fechar tour"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="tour-content">
              <div className="tour-step-indicator">
                Passo {currentStep + 1} de {tourSteps.length}
              </div>
              
              <h3 className="tour-title">{step.title}</h3>
              <p className="tour-description">{step.content}</p>

              {step.action && (
                <button 
                  onClick={step.action.onClick}
                  className="tour-action-btn"
                >
                  {step.action.label}
                </button>
              )}
            </div>

            {/* Footer */}
            <div className="tour-footer">
              <button 
                onClick={handlePrevious}
                className="tour-nav-btn"
                disabled={currentStep === 0}
              >
                <ChevronLeft size={20} />
                Anterior
              </button>

              <div className="tour-dots">
                {tourSteps.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentStep(index)}
                    className={`tour-dot ${index === currentStep ? 'active' : ''}`}
                    aria-label={`Ir para passo ${index + 1}`}
                  />
                ))}
              </div>

              <button 
                onClick={handleNext}
                className="tour-nav-btn tour-nav-next"
              >
                {currentStep === tourSteps.length - 1 ? (
                  <>
                    Concluir
                    <Check size={20} />
                  </>
                ) : (
                  <>
                    Próximo
                    <ChevronRight size={20} />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Spotlight no elemento alvo */}
          {step.target && <div className="tour-spotlight" data-target={step.target} />}
        </>
      )}

      <style jsx>{`
        .tour-restart-btn {
          position: fixed;
          bottom: var(--spacing-xl);
          right: var(--spacing-xl);
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-sm) var(--spacing-md);
          background: var(--color-primary-500);
          color: white;
          border: none;
          border-radius: var(--radius-full);
          box-shadow: var(--shadow-lg);
          cursor: pointer;
          transition: all var(--transition-base);
          z-index: var(--z-sticky);
        }

        .tour-restart-btn:hover {
          background: var(--color-primary-600);
          transform: scale(1.05);
        }

        .tour-restart-icon {
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          color: var(--color-primary-500);
          border-radius: 50%;
          font-weight: bold;
        }

        .tour-restart-text {
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
        }

        .tour-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          z-index: var(--z-modal-backdrop);
          animation: fadeIn var(--transition-base);
        }

        .tour-modal {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: white;
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-2xl);
          max-width: 500px;
          width: 90%;
          z-index: var(--z-modal);
          animation: slideUp var(--transition-base);
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translate(-50%, -40%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -50%);
          }
        }

        .tour-header {
          position: relative;
          padding: var(--spacing-lg);
          border-bottom: 1px solid var(--color-gray-200);
        }

        .tour-progress {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: var(--color-gray-200);
          border-radius: var(--radius-xl) var(--radius-xl) 0 0;
          overflow: hidden;
        }

        .tour-progress-bar {
          height: 100%;
          background: linear-gradient(90deg, 
            var(--color-primary-400), 
            var(--color-primary-600));
          transition: width var(--transition-base);
        }

        .tour-close {
          position: absolute;
          top: var(--spacing-md);
          right: var(--spacing-md);
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-gray-100);
          border: none;
          border-radius: var(--radius-full);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .tour-close:hover {
          background: var(--color-gray-200);
        }

        .tour-content {
          padding: var(--spacing-xl);
        }

        .tour-step-indicator {
          font-size: var(--font-size-sm);
          color: var(--color-gray-500);
          margin-bottom: var(--spacing-sm);
        }

        .tour-title {
          font-size: var(--font-size-2xl);
          font-weight: var(--font-weight-semibold);
          color: var(--color-gray-900);
          margin-bottom: var(--spacing-md);
        }

        .tour-description {
          font-size: var(--font-size-base);
          color: var(--color-gray-600);
          line-height: var(--line-height-relaxed);
          margin-bottom: var(--spacing-lg);
        }

        .tour-action-btn {
          padding: var(--spacing-sm) var(--spacing-lg);
          background: var(--color-primary-500);
          color: white;
          border: none;
          border-radius: var(--radius-md);
          font-size: var(--font-size-base);
          font-weight: var(--font-weight-medium);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .tour-action-btn:hover {
          background: var(--color-primary-600);
        }

        .tour-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--spacing-lg);
          border-top: 1px solid var(--color-gray-200);
        }

        .tour-nav-btn {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          padding: var(--spacing-sm) var(--spacing-md);
          background: transparent;
          color: var(--color-gray-600);
          border: 1px solid var(--color-gray-300);
          border-radius: var(--radius-md);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .tour-nav-btn:hover:not(:disabled) {
          background: var(--color-gray-50);
          border-color: var(--color-gray-400);
        }

        .tour-nav-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .tour-nav-next {
          background: var(--color-primary-500);
          color: white;
          border-color: var(--color-primary-500);
        }

        .tour-nav-next:hover {
          background: var(--color-primary-600);
          border-color: var(--color-primary-600);
        }

        .tour-dots {
          display: flex;
          gap: var(--spacing-xs);
        }

        .tour-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--color-gray-300);
          border: none;
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .tour-dot:hover {
          background: var(--color-gray-400);
        }

        .tour-dot.active {
          width: 24px;
          border-radius: 4px;
          background: var(--color-primary-500);
        }

        .tour-spotlight {
          position: fixed;
          border: 3px solid var(--color-primary-500);
          border-radius: var(--radius-lg);
          box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.5);
          z-index: var(--z-modal-backdrop);
          pointer-events: none;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.02);
          }
        }

        /* Dark Mode */
        [data-theme="dark"] .tour-modal {
          background: var(--color-gray-100);
        }

        [data-theme="dark"] .tour-header,
        [data-theme="dark"] .tour-footer {
          border-color: var(--color-gray-300);
        }

        [data-theme="dark"] .tour-title {
          color: var(--color-gray-900);
        }

        [data-theme="dark"] .tour-close {
          background: var(--color-gray-200);
        }

        [data-theme="dark"] .tour-close:hover {
          background: var(--color-gray-300);
        }

        /* Mobile */
        @media (max-width: 640px) {
          .tour-modal {
            width: 95%;
            max-height: 90vh;
            overflow-y: auto;
          }

          .tour-footer {
            flex-wrap: wrap;
            gap: var(--spacing-md);
          }

          .tour-dots {
            order: -1;
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </>
  );
}