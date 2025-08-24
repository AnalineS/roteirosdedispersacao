'use client';

import React, { useState, useEffect } from 'react';
import { X, ArrowRight, Check, MessageCircle, BookOpen, Search, HelpCircle } from 'lucide-react';

interface QuickStartStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: {
    label: string;
    href: string;
  };
  completed?: boolean;
}

const quickStartSteps: QuickStartStep[] = [
  {
    id: 'explore-personas',
    title: 'Conheça os Assistentes',
    description: 'Dr. Gasnelio para questões técnicas e Gá para suporte empático',
    icon: <MessageCircle size={24} />,
    action: {
      label: 'Abrir Chat',
      href: '/chat'
    }
  },
  {
    id: 'browse-modules',
    title: 'Explore os Módulos',
    description: 'Acesse conteúdo educacional estruturado sobre hanseníase',
    icon: <BookOpen size={24} />,
    action: {
      label: 'Ver Módulos',
      href: '/modules'
    }
  },
  {
    id: 'search-content',
    title: 'Use a Busca Inteligente',
    description: 'Encontre rapidamente informações sobre medicamentos e protocolos',
    icon: <Search size={24} />,
    action: {
      label: 'Buscar Agora',
      href: '/?focus=search'
    }
  },
  {
    id: 'get-help',
    title: 'Precisa de Ajuda?',
    description: 'Acesse recursos adicionais e suporte técnico',
    icon: <HelpCircle size={24} />,
    action: {
      label: 'Central de Ajuda',
      href: '/help'
    }
  }
];

interface QuickStartGuideProps {
  onComplete?: () => void;
  autoShow?: boolean;
}

export default function QuickStartGuide({ 
  onComplete,
  autoShow = true
}: QuickStartGuideProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [hasSeenGuide, setHasSeenGuide] = useState(false);

  useEffect(() => {
    const guideSeen = localStorage.getItem('quick-start-guide-seen');
    const completedStepsStored = localStorage.getItem('quick-start-completed-steps');
    
    if (completedStepsStored) {
      setCompletedSteps(new Set(JSON.parse(completedStepsStored)));
    }

    if (!guideSeen && autoShow) {
      // Show guide after a brief delay for better UX
      setTimeout(() => setIsVisible(true), 2000);
    } else {
      setHasSeenGuide(true);
    }
  }, [autoShow]);

  const handleStepComplete = (stepId: string) => {
    const newCompleted = new Set(completedSteps);
    newCompleted.add(stepId);
    setCompletedSteps(newCompleted);
    localStorage.setItem('quick-start-completed-steps', JSON.stringify([...newCompleted]));
    
    // If all steps completed, trigger completion
    if (newCompleted.size === quickStartSteps.length) {
      setTimeout(() => {
        handleComplete();
      }, 500);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    localStorage.setItem('quick-start-guide-seen', 'true');
    setHasSeenGuide(true);
    onComplete?.();
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('quick-start-guide-seen', 'dismissed');
    setHasSeenGuide(true);
  };

  const handleRestart = () => {
    setCompletedSteps(new Set());
    localStorage.removeItem('quick-start-completed-steps');
    localStorage.removeItem('quick-start-guide-seen');
    setIsVisible(true);
    setHasSeenGuide(false);
  };

  const progress = (completedSteps.size / quickStartSteps.length) * 100;

  if (!isVisible && !hasSeenGuide) return null;

  return (
    <>
      {/* Restart Button for returning users */}
      {hasSeenGuide && !isVisible && (
        <button
          onClick={handleRestart}
          className="quick-start-restart-btn"
          aria-label="Reiniciar guia de início rápido"
          title="Guia de Início Rápido"
        >
          <HelpCircle size={20} />
          <span>Guia</span>
        </button>
      )}

      {/* Quick Start Guide Modal */}
      {isVisible && (
        <>
          <div 
            className="quick-start-overlay"
            onClick={handleDismiss}
            aria-hidden="true"
          />
          
          <div 
            className="quick-start-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="quick-start-title"
          >
            {/* Header */}
            <div className="quick-start-header">
              <div>
                <h2 id="quick-start-title">🚀 Início Rápido</h2>
                <p>Primeiros passos na plataforma</p>
              </div>
              <button
                onClick={handleDismiss}
                className="quick-start-close"
                aria-label="Fechar guia"
              >
                <X size={20} />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="quick-start-progress">
              <div className="quick-start-progress-bar">
                <div 
                  className="quick-start-progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="quick-start-progress-text">
                {completedSteps.size} de {quickStartSteps.length} concluídos
              </span>
            </div>

            {/* Steps */}
            <div className="quick-start-steps">
              {quickStartSteps.map((step, index) => {
                const isCompleted = completedSteps.has(step.id);
                
                return (
                  <div 
                    key={step.id}
                    className={`quick-start-step ${isCompleted ? 'completed' : ''}`}
                  >
                    <div className="quick-start-step-icon">
                      {isCompleted ? <Check size={24} /> : step.icon}
                    </div>
                    
                    <div className="quick-start-step-content">
                      <h3>{step.title}</h3>
                      <p>{step.description}</p>
                      
                      {step.action && !isCompleted && (
                        <a
                          href={step.action.href}
                          className="quick-start-step-action"
                          onClick={() => handleStepComplete(step.id)}
                        >
                          {step.action.label}
                          <ArrowRight size={16} />
                        </a>
                      )}
                      
                      {isCompleted && (
                        <div className="quick-start-step-completed">
                          ✅ Concluído!
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="quick-start-footer">
              <button
                onClick={handleDismiss}
                className="quick-start-btn quick-start-btn-secondary"
              >
                Pular por agora
              </button>
              
              {completedSteps.size === quickStartSteps.length && (
                <button
                  onClick={handleComplete}
                  className="quick-start-btn quick-start-btn-primary"
                >
                  Finalizar Guia
                </button>
              )}
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        .quick-start-restart-btn {
          position: fixed;
          top: 100px;
          right: 20px;
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          padding: var(--spacing-sm) var(--spacing-md);
          background: var(--color-primary-500);
          color: white;
          border: none;
          border-radius: var(--radius-full);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          cursor: pointer;
          box-shadow: var(--shadow-lg);
          transition: all var(--transition-fast);
          z-index: var(--z-sticky);
        }

        .quick-start-restart-btn:hover {
          background: var(--color-primary-600);
          transform: translateY(-2px);
          box-shadow: var(--shadow-xl);
        }

        .quick-start-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          z-index: var(--z-modal-backdrop);
          animation: fadeIn 300ms ease-out;
        }

        .quick-start-modal {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: min(500px, 90vw);
          max-height: 90vh;
          background: var(--color-bg-primary);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-2xl);
          z-index: var(--z-modal);
          animation: slideUp 300ms ease-out;
          overflow-y: auto;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
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

        .quick-start-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: var(--spacing-xl);
          border-bottom: 1px solid var(--color-border-default);
        }

        .quick-start-header h2 {
          font-size: var(--font-size-xl);
          font-weight: var(--font-weight-bold);
          color: var(--color-text-primary);
          margin: 0 0 var(--spacing-xs);
        }

        .quick-start-header p {
          font-size: var(--font-size-sm);
          color: var(--color-text-muted);
          margin: 0;
        }

        .quick-start-close {
          background: var(--color-gray-100);
          border: none;
          border-radius: var(--radius-full);
          padding: var(--spacing-sm);
          cursor: pointer;
          color: var(--color-text-muted);
          transition: all var(--transition-fast);
        }

        .quick-start-close:hover {
          background: var(--color-gray-200);
          color: var(--color-text-primary);
        }

        .quick-start-progress {
          padding: var(--spacing-lg) var(--spacing-xl) var(--spacing-md);
        }

        .quick-start-progress-bar {
          height: 6px;
          background: var(--color-gray-200);
          border-radius: var(--radius-full);
          overflow: hidden;
          margin-bottom: var(--spacing-sm);
        }

        .quick-start-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--color-primary-500), var(--color-primary-400));
          border-radius: var(--radius-full);
          transition: width var(--transition-slow);
        }

        .quick-start-progress-text {
          font-size: var(--font-size-sm);
          color: var(--color-text-muted);
          font-weight: var(--font-weight-medium);
        }

        .quick-start-steps {
          padding: 0 var(--spacing-xl);
        }

        .quick-start-step {
          display: flex;
          gap: var(--spacing-lg);
          padding: var(--spacing-lg);
          border-radius: var(--radius-md);
          margin-bottom: var(--spacing-md);
          border: 2px solid transparent;
          transition: all var(--transition-fast);
        }

        .quick-start-step:hover {
          background: var(--color-bg-secondary);
          border-color: var(--color-border-light);
        }

        .quick-start-step.completed {
          background: var(--color-success-background);
          border-color: var(--color-success-border);
        }

        .quick-start-step-icon {
          flex-shrink: 0;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius-md);
          background: var(--color-primary-500);
          color: white;
          transition: all var(--transition-fast);
        }

        .quick-start-step.completed .quick-start-step-icon {
          background: var(--color-success-500);
        }

        .quick-start-step-content {
          flex: 1;
          min-width: 0;
        }

        .quick-start-step-content h3 {
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-semibold);
          color: var(--color-text-primary);
          margin: 0 0 var(--spacing-xs);
        }

        .quick-start-step-content p {
          font-size: var(--font-size-base);
          color: var(--color-text-muted);
          line-height: var(--line-height-relaxed);
          margin: 0 0 var(--spacing-md);
        }

        .quick-start-step-action {
          display: inline-flex;
          align-items: center;
          gap: var(--spacing-xs);
          padding: var(--spacing-sm) var(--spacing-md);
          background: var(--color-primary-500);
          color: white;
          text-decoration: none;
          border-radius: var(--radius-sm);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          transition: all var(--transition-fast);
        }

        .quick-start-step-action:hover {
          background: var(--color-primary-600);
          transform: translateY(-1px);
        }

        .quick-start-step-completed {
          color: var(--color-success-primary);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-semibold);
        }

        .quick-start-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-xl);
          border-top: 1px solid var(--color-border-default);
          gap: var(--spacing-md);
        }

        .quick-start-btn {
          padding: var(--spacing-sm) var(--spacing-lg);
          border-radius: var(--radius-md);
          font-size: var(--font-size-base);
          font-weight: var(--font-weight-medium);
          cursor: pointer;
          transition: all var(--transition-fast);
          border: 2px solid transparent;
        }

        .quick-start-btn-secondary {
          background: transparent;
          color: var(--color-text-muted);
          border-color: var(--color-border-default);
        }

        .quick-start-btn-secondary:hover {
          background: var(--color-bg-secondary);
          color: var(--color-text-primary);
          border-color: var(--color-border-focus);
        }

        .quick-start-btn-primary {
          background: var(--color-primary-500);
          color: white;
          border-color: var(--color-primary-500);
        }

        .quick-start-btn-primary:hover {
          background: var(--color-primary-600);
          border-color: var(--color-primary-600);
          transform: translateY(-1px);
        }

        /* Dark theme support */
        [data-theme="dark"] .quick-start-modal {
          background: var(--color-gray-100);
        }

        [data-theme="dark"] .quick-start-header {
          border-color: var(--color-gray-300);
        }

        [data-theme="dark"] .quick-start-step:hover {
          background: var(--color-gray-200);
        }

        [data-theme="dark"] .quick-start-footer {
          border-color: var(--color-gray-300);
        }

        /* Mobile responsive */
        @media (max-width: 640px) {
          .quick-start-modal {
            width: 95vw;
            max-height: 95vh;
          }

          .quick-start-header,
          .quick-start-progress,
          .quick-start-steps,
          .quick-start-footer {
            padding-left: var(--spacing-lg);
            padding-right: var(--spacing-lg);
          }

          .quick-start-step {
            flex-direction: column;
            text-align: center;
            gap: var(--spacing-md);
          }

          .quick-start-step-icon {
            margin: 0 auto;
          }

          .quick-start-footer {
            flex-direction: column;
            gap: var(--spacing-md);
          }

          .quick-start-btn {
            width: 100%;
            justify-content: center;
          }

          .quick-start-restart-btn {
            right: 10px;
            padding: var(--spacing-xs) var(--spacing-sm);
          }
        }
      `}</style>
    </>
  );
}