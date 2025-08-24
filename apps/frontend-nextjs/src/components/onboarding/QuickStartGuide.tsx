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
          top: 90px;
          left: 50%;
          transform: translate(-50%, 0);
          width: min(520px, 92vw);
          max-height: 80vh;
          background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(255, 255, 255, 0.5);
          z-index: var(--z-modal);
          animation: slideUp 300ms ease-out;
          overflow-y: auto;
          border: 2px solid rgba(59, 130, 246, 0.1);
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translate(-50%, -20px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }

        .quick-start-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 2rem 2rem 1.5rem;
          border-bottom: 1px solid rgba(229, 231, 235, 0.6);
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.03) 100%);
          border-radius: 20px 20px 0 0;
        }

        .quick-start-header h2 {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 0.5rem;
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .quick-start-header p {
          font-size: 0.95rem;
          color: #64748b;
          margin: 0;
          font-weight: 500;
        }

        .quick-start-close {
          background: rgba(248, 250, 252, 0.8);
          border: 1px solid rgba(226, 232, 240, 0.6);
          border-radius: 50%;
          padding: 0.5rem;
          cursor: pointer;
          color: #64748b;
          transition: all 0.2s ease;
          backdrop-filter: blur(10px);
        }

        .quick-start-close:hover {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border-color: rgba(239, 68, 68, 0.2);
          transform: rotate(90deg);
        }

        .quick-start-progress {
          padding: 1.5rem 2rem 1rem;
        }

        .quick-start-progress-bar {
          height: 8px;
          background: rgba(226, 232, 240, 0.6);
          border-radius: 20px;
          overflow: hidden;
          margin-bottom: 0.75rem;
          box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .quick-start-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #8b5cf6, #06b6d4);
          border-radius: 20px;
          transition: width 0.6s ease;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
        }

        .quick-start-progress-text {
          font-size: 0.875rem;
          color: #475569;
          font-weight: 600;
          text-align: center;
        }

        .quick-start-steps {
          padding: 0 2rem;
        }

        .quick-start-step {
          display: flex;
          gap: 1rem;
          padding: 1.25rem;
          border-radius: 16px;
          margin-bottom: 1rem;
          border: 1px solid rgba(226, 232, 240, 0.6);
          background: rgba(248, 250, 252, 0.5);
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }

        .quick-start-step:hover {
          background: rgba(248, 250, 252, 0.8);
          border-color: rgba(59, 130, 246, 0.3);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
        }

        .quick-start-step.completed {
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(6, 182, 212, 0.05) 100%);
          border-color: rgba(16, 185, 129, 0.3);
          box-shadow: 0 4px 15px rgba(16, 185, 129, 0.1);
        }

        .quick-start-step-icon {
          flex-shrink: 0;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          color: white;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
        }

        .quick-start-step.completed .quick-start-step-icon {
          background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%);
          box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
        }

        .quick-start-step-content {
          flex: 1;
          min-width: 0;
        }

        .quick-start-step-content h3 {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 0.5rem;
        }

        .quick-start-step-content p {
          font-size: 0.95rem;
          color: #64748b;
          line-height: 1.6;
          margin: 0 0 1rem;
        }

        .quick-start-step-action {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1.25rem;
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          color: white;
          text-decoration: none;
          border-radius: 25px;
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
        }

        .quick-start-step-action:hover {
          background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
        }

        .quick-start-step-completed {
          color: #10b981;
          font-size: 0.875rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .quick-start-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem 2rem;
          border-top: 1px solid rgba(229, 231, 235, 0.6);
          gap: 1rem;
          background: rgba(248, 250, 252, 0.3);
          border-radius: 0 0 20px 20px;
        }

        .quick-start-btn {
          padding: 0.75rem 1.5rem;
          border-radius: 12px;
          font-size: 0.95rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          border: 1px solid transparent;
        }

        .quick-start-btn-secondary {
          background: rgba(248, 250, 252, 0.8);
          color: #64748b;
          border-color: rgba(226, 232, 240, 0.6);
        }

        .quick-start-btn-secondary:hover {
          background: rgba(248, 250, 252, 1);
          color: #374151;
          border-color: rgba(156, 163, 175, 0.4);
          transform: translateY(-1px);
        }

        .quick-start-btn-primary {
          background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%);
          color: white;
          border-color: transparent;
          box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
        }

        .quick-start-btn-primary:hover {
          background: linear-gradient(135deg, #059669 0%, #0891b2 100%);
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
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