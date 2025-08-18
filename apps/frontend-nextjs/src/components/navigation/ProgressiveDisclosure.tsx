'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useSmartNavigation } from './SmartNavigationSystem';
import { getUnbColors } from '@/config/modernTheme';
import Link from 'next/link';

interface TourStep {
  id: string;
  target: string; // CSS selector
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  action?: 'click' | 'hover' | 'none';
  skipable?: boolean;
}

interface ProgressiveDisclosureProps {
  enabled?: boolean;
  autoStart?: boolean;
}

export default function ProgressiveDisclosure({ 
  enabled = true, 
  autoStart = true 
}: ProgressiveDisclosureProps) {
  const { navigationState, updateUserLevel } = useSmartNavigation();
  const pathname = usePathname();
  const unbColors = getUnbColors();
  
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenTour, setHasSeenTour] = useState(false);
  const [showLevelSelector, setShowLevelSelector] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Verificar se usuário já viu o tour
  useEffect(() => {
    const tourCompleted = localStorage.getItem('navigation-tour-completed');
    const userLevel = localStorage.getItem('userNavigationLevel');
    
    setHasSeenTour(!!tourCompleted);
    
    // Auto-iniciar para novos usuários
    if (autoStart && !tourCompleted && !userLevel && pathname === '/') {
      setTimeout(() => setShowLevelSelector(true), 2000);
    }
  }, [autoStart, pathname]);

  const tourSteps: TourStep[] = [
    {
      id: 'welcome',
      target: 'body',
      title: '👋 Bem-vindo ao Sistema de Roteiros de Dispensação',
      content: 'Este tour rápido vai te ajudar a navegar pela plataforma de forma eficiente. Vamos começar?',
      position: 'bottom',
      action: 'none'
    },
    {
      id: 'main-navigation',
      target: '.navigation-header, .quick-navigation-menu',
      title: '🧭 Sistema de Navegação',
      content: 'Use o menu principal no topo (desktop) ou o botão flutuante (mobile) para acessar todas as áreas do sistema.',
      position: 'bottom',
      action: 'hover'
    },
    {
      id: 'modules',
      target: '[href="/modules"]',
      title: '📚 Módulos Educacionais',
      content: 'Aqui você encontra todo o conteúdo educacional sobre hanseníase, diagnóstico e tratamento PQT-U.',
      position: 'bottom',
      action: 'hover'
    },
    {
      id: 'chat',
      target: '[href="/chat"]',
      title: '💬 Assistentes Virtuais',
      content: 'Converse com Dr. Gasnelio (técnico) ou Gá (empático) para tirar dúvidas específicas.',
      position: 'bottom',
      action: 'hover'
    },
    {
      id: 'tools',
      target: '[href="/resources"]',
      title: '🛠️ Ferramentas Práticas',
      content: 'Acesse calculadoras, checklists e verificadores para uso profissional.',
      position: 'bottom',
      action: 'hover'
    },
    {
      id: 'breadcrumbs',
      target: '[role="navigation"][aria-label="Educational breadcrumb navigation"]',
      title: '🍞 Breadcrumbs',
      content: 'Use as migalhas de pão para saber onde você está e voltar facilmente para seções anteriores.',
      position: 'bottom',
      action: 'none',
      skipable: true
    },
    {
      id: 'complete',
      target: 'body',
      title: '✅ Tour Concluído!',
      content: 'Agora você está pronto para explorar a plataforma. Lembre-se: você pode acessar qualquer área sem precisar escolher um assistente primeiro.',
      position: 'bottom',
      action: 'none'
    }
  ];

  const startTour = (userLevel: 'beginner' | 'intermediate' | 'expert') => {
    updateUserLevel(userLevel);
    setIsActive(true);
    setCurrentStep(0);
    setShowLevelSelector(false);
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const nextStep = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipTour = () => {
    completeTour();
  };

  const completeTour = () => {
    setIsActive(false);
    setCurrentStep(0);
    localStorage.setItem('navigation-tour-completed', 'true');
    setHasSeenTour(true);
  };

  const restartTour = () => {
    setShowLevelSelector(true);
  };

  if (!enabled) return null;

  const currentTourStep = tourSteps[currentStep];

  return (
    <>
      {/* Level Selector Modal */}
      {showLevelSelector && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}>
            <h2 style={{ 
              color: unbColors.primary,
              fontSize: '1.5rem',
              fontWeight: 'bold',
              marginBottom: '1rem',
              textAlign: 'center'
            }}>
              🎯 Qual é o seu nível de experiência?
            </h2>
            
            <p style={{
              color: '#6b7280',
              fontSize: '0.95rem',
              textAlign: 'center',
              marginBottom: '2rem',
              lineHeight: '1.5'
            }}>
              Isso nos ajudará a personalizar a navegação para você
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button
                onClick={() => startTour('beginner')}
                style={{
                  padding: '1rem 1.5rem',
                  border: `2px solid ${unbColors.primary}`,
                  borderRadius: '12px',
                  background: 'white',
                  color: unbColors.primary,
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = unbColors.alpha.primary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white';
                }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                  🌱 Iniciante
                </div>
                <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                  Primeira vez usando o sistema - quero navegação simplificada
                </div>
              </button>

              <button
                onClick={() => startTour('intermediate')}
                style={{
                  padding: '1rem 1.5rem',
                  border: `2px solid ${unbColors.secondary}`,
                  borderRadius: '12px',
                  background: 'white',
                  color: unbColors.secondary,
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = unbColors.alpha.secondary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white';
                }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                  📈 Intermediário
                </div>
                <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                  Tenho experiência com sistemas similares
                </div>
              </button>

              <button
                onClick={() => startTour('expert')}
                style={{
                  padding: '1rem 1.5rem',
                  border: `2px solid #059669`,
                  borderRadius: '12px',
                  background: 'white',
                  color: '#059669',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#05966910';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white';
                }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                  🚀 Avançado
                </div>
                <div style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                  Quero acesso completo a todas as funcionalidades
                </div>
              </button>
            </div>

            <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
              <button
                onClick={() => {
                  setShowLevelSelector(false);
                  updateUserLevel('intermediate');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6b7280',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Pular e usar padrão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tour Overlay */}
      {isActive && currentTourStep && (
        <div 
          ref={overlayRef}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            zIndex: 9999,
            pointerEvents: 'auto'
          }}
          onClick={(e) => {
            if (e.target === overlayRef.current) {
              skipTour();
            }
          }}
        >
          {/* Tour Step Card */}
          <div style={{
            position: 'absolute',
            bottom: '2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'white',
            borderRadius: '16px',
            padding: '1.5rem',
            maxWidth: '400px',
            width: '90vw',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            pointerEvents: 'auto'
          }}>
            <div style={{ marginBottom: '1rem' }}>
              <h3 style={{
                color: unbColors.primary,
                fontSize: '1.1rem',
                fontWeight: 'bold',
                marginBottom: '0.5rem'
              }}>
                {currentTourStep.title}
              </h3>
              <p style={{
                color: '#374151',
                fontSize: '0.95rem',
                lineHeight: '1.5',
                margin: 0
              }}>
                {currentTourStep.content}
              </p>
            </div>

            {/* Progress indicator */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '0.25rem',
              marginBottom: '1rem'
            }}>
              {tourSteps.map((_, index) => (
                <div
                  key={index}
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: index === currentStep ? unbColors.primary : '#d1d5db'
                  }}
                />
              ))}
            </div>

            {/* Controls */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <button
                onClick={skipTour}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6b7280',
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
              >
                Pular tour
              </button>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {currentStep > 0 && (
                  <button
                    onClick={prevStep}
                    style={{
                      padding: '0.5rem 1rem',
                      border: `1px solid ${unbColors.primary}`,
                      borderRadius: '8px',
                      background: 'white',
                      color: unbColors.primary,
                      fontSize: '0.9rem',
                      cursor: 'pointer'
                    }}
                  >
                    Anterior
                  </button>
                )}
                
                <button
                  onClick={nextStep}
                  style={{
                    padding: '0.5rem 1rem',
                    border: 'none',
                    borderRadius: '8px',
                    background: unbColors.primary,
                    color: 'white',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    fontWeight: '500'
                  }}
                >
                  {currentStep === tourSteps.length - 1 ? 'Finalizar' : 'Próximo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tour Restart Button (for returning users) */}
      {hasSeenTour && !isActive && (
        <button
          onClick={restartTour}
          style={{
            position: 'fixed',
            top: '100px',
            left: '20px',
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            background: unbColors.alpha.primary,
            border: `2px solid ${unbColors.primary}`,
            color: unbColors.primary,
            cursor: 'pointer',
            fontSize: '1.2rem',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Reiniciar tour de navegação"
          aria-label="Reiniciar tour de navegação"
        >
          🎯
        </button>
      )}
    </>
  );
}