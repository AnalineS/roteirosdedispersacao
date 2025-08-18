'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { getUnbColors } from '@/config/modernTheme';

interface ChatNavigationProps {
  currentPersona?: string;
  conversationLength?: number;
  showProgress?: boolean;
  className?: string;
}

interface NavigationState {
  canGoBack: boolean;
  canGoForward: boolean;
  currentStep: number;
  totalSteps: number;
  currentFlow: 'chat' | 'onboarding' | 'assessment' | 'free';
}

export default function ChatNavigation({ 
  currentPersona, 
  conversationLength = 0,
  showProgress = true,
  className = '' 
}: ChatNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const unbColors = getUnbColors();
  const [navigationState, setNavigationState] = useState<NavigationState>({
    canGoBack: true,
    canGoForward: false,
    currentStep: 1,
    totalSteps: 1,
    currentFlow: 'free'
  });

  // Detectar tipo de fluxo baseado na conversa
  useEffect(() => {
    const analyzeConversationFlow = () => {
      if (conversationLength === 0) {
        return {
          currentStep: 1,
          totalSteps: 1,
          currentFlow: 'chat' as const
        };
      }

      // Detectar padrões de fluxo baseado no conteúdo
      // Para simplificar, usando tamanho da conversa como proxy
      if (conversationLength <= 3) {
        return {
          currentStep: 1,
          totalSteps: 5, // Fluxo típico de onboarding
          currentFlow: 'onboarding' as const
        };
      } else if (conversationLength <= 10) {
        return {
          currentStep: Math.min(conversationLength, 5),
          totalSteps: 5,
          currentFlow: 'assessment' as const
        };
      } else {
        return {
          currentStep: conversationLength,
          totalSteps: conversationLength,
          currentFlow: 'free' as const
        };
      }
    };

    const flowInfo = analyzeConversationFlow();
    setNavigationState(prev => ({
      ...prev,
      ...flowInfo,
      canGoBack: true,
      canGoForward: false
    }));
  }, [conversationLength]);

  const handleGoBack = () => {
    // Navegação inteligente baseada no contexto
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  const handleGoHome = () => {
    router.push('/');
  };

  const handleNewChat = () => {
    // Limpar conversa atual e começar nova
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.delete('conversation');
    router.push(currentUrl.pathname);
  };

  const getFlowDescription = () => {
    const descriptions = {
      chat: 'Conversa livre',
      onboarding: 'Primeiros passos',
      assessment: 'Avaliação dirigida',
      free: 'Conversa livre'
    };
    return descriptions[navigationState.currentFlow];
  };

  const getProgressColor = () => {
    const progress = navigationState.currentStep / navigationState.totalSteps;
    if (progress < 0.3) return '#ef4444'; // Vermelho - início
    if (progress < 0.7) return '#f59e0b'; // Amarelo - meio
    return '#22c55e'; // Verde - quase completo
  };

  return (
    <div className={`chat-navigation ${className}`} style={{
      background: 'white',
      borderBottom: `1px solid ${unbColors.alpha.primary}`,
      padding: '0.75rem 1rem',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Left: Navigation Controls */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          {/* Back Button - SEMPRE VISÍVEL */}
          <button
            onClick={handleGoBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: unbColors.alpha.primary,
              color: unbColors.primary,
              border: `2px solid ${unbColors.primary}`,
              borderRadius: '8px',
              padding: '0.5rem 1rem',
              fontSize: '0.9rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = unbColors.primary;
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = unbColors.alpha.primary;
              e.currentTarget.style.color = unbColors.primary;
            }}
            title="Voltar à página anterior"
            aria-label="Voltar à página anterior"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5"/>
              <path d="M12 19l-7-7 7-7"/>
            </svg>
            Voltar
          </button>

          {/* Home Button */}
          <button
            onClick={handleGoHome}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'white',
              color: '#6b7280',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              padding: '0.5rem 1rem',
              fontSize: '0.9rem',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f3f4f6';
              e.currentTarget.style.borderColor = '#9ca3af';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.borderColor = '#d1d5db';
            }}
            title="Ir para página inicial"
            aria-label="Ir para página inicial"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9,22 9,12 15,12 15,22"/>
            </svg>
            Início
          </button>

          {/* Breadcrumb */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.85rem',
            color: '#6b7280'
          }}>
            <span>Início</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
            <span style={{ color: unbColors.primary, fontWeight: '600' }}>
              Chat {currentPersona && `com ${currentPersona}`}
            </span>
          </div>
        </div>

        {/* Center: Progress Information */}
        {showProgress && navigationState.currentFlow !== 'free' && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            background: '#f8fafc',
            padding: '0.5rem 1rem',
            borderRadius: '20px',
            border: '1px solid #e2e8f0'
          }}>
            {/* Progress Bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <span style={{
                fontSize: '0.8rem',
                fontWeight: '600',
                color: '#374151'
              }}>
                {getFlowDescription()}
              </span>
              
              <div style={{
                width: '120px',
                height: '6px',
                background: '#e5e7eb',
                borderRadius: '3px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${(navigationState.currentStep / navigationState.totalSteps) * 100}%`,
                  height: '100%',
                  background: getProgressColor(),
                  borderRadius: '3px',
                  transition: 'all 0.3s ease'
                }} />
              </div>
              
              <span style={{
                fontSize: '0.75rem',
                color: '#6b7280',
                fontWeight: '500'
              }}>
                {navigationState.currentStep}/{navigationState.totalSteps}
              </span>
            </div>
          </div>
        )}

        {/* Right: Action Buttons */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          {/* New Chat Button */}
          <button
            onClick={handleNewChat}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'white',
              color: '#059669',
              border: '1px solid #059669',
              borderRadius: '8px',
              padding: '0.5rem 1rem',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#059669';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.color = '#059669';
            }}
            title="Iniciar nova conversa"
            aria-label="Iniciar nova conversa"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14"/>
              <path d="M5 12h14"/>
            </svg>
            Nova Conversa
          </button>

          {/* Help Button */}
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              background: 'white',
              color: '#6b7280',
              border: '1px solid #d1d5db',
              borderRadius: '50%',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f3f4f6';
              e.currentTarget.style.color = '#374151';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.color = '#6b7280';
            }}
            title="Ajuda - Como usar o chat"
            aria-label="Ajuda - Como usar o chat"
            onClick={() => {
              // Mostrar dicas de uso ou modal de ajuda
              alert('💡 Dicas:\n\n• Use o botão "Voltar" para sair do chat\n• O progresso mostra seu avanço na conversa\n• "Nova Conversa" limpa o histórico atual\n• Você pode alternar entre assistentes a qualquer momento');
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
              <path d="M12 17h.01"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Progress Details (Expandable) */}
      {showProgress && navigationState.currentFlow === 'assessment' && (
        <div style={{
          marginTop: '0.75rem',
          padding: '0.75rem',
          background: '#f0f9ff',
          borderRadius: '8px',
          border: '1px solid #e0f2fe',
          fontSize: '0.8rem',
          color: '#0c4a6e'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#0c4a6e">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
              </svg>
              <span><strong>Avaliação em andamento:</strong> Esta conversa está coletando informações específicas</span>
            </div>
            <span style={{
              background: '#0369a1',
              color: 'white',
              padding: '0.25rem 0.75rem',
              borderRadius: '12px',
              fontSize: '0.7rem',
              fontWeight: '600'
            }}>
              {Math.round((navigationState.currentStep / navigationState.totalSteps) * 100)}% completo
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Hook para gerenciar estado de navegação do chat
export function useChatNavigation(conversationMessages: any[] = []) {
  const [navigationState, setNavigationState] = useState({
    conversationLength: 0,
    flowType: 'free' as 'chat' | 'onboarding' | 'assessment' | 'free',
    canNavigateAway: true
  });

  useEffect(() => {
    setNavigationState(prev => ({
      ...prev,
      conversationLength: conversationMessages.length
    }));
  }, [conversationMessages]);

  const updateFlowType = (newType: typeof navigationState.flowType) => {
    setNavigationState(prev => ({
      ...prev,
      flowType: newType
    }));
  };

  return {
    navigationState,
    updateFlowType
  };
}