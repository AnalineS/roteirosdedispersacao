'use client';

import React, { useState, useEffect, useRef } from 'react';
import { safeLocalStorage, isClientSide } from '@/hooks/useClientStorage';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { getPersonaAvatar } from '@/constants/avatars';
import { useChat } from '@/hooks/useChat';
import { useSafeAuth } from '@/hooks/useSafeAuth';
import { useFloatingElement } from '@/components/navigation/FloatingElementsCoordinator';
import { useFABVisibility } from '@/hooks/useResponsiveScreen';

interface GlobalPersonaFABProps {
  className?: string;
  style?: React.CSSProperties;
}

export default function GlobalPersonaFAB({ className, style }: GlobalPersonaFABProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [miniChatInput, setMiniChatInput] = useState('');
  const router = useRouter();
  const pathname = usePathname();
  const miniChatRef = useRef<HTMLDivElement>(null);
  
  // Usar sistema responsivo para FAB
  const { 
    isVisible, 
    closeFAB, 
    fabConfig, 
    screenSize, 
    isClient 
  } = useFABVisibility();
  
  // Usar coordenador de elementos flutuantes (mantido para compatibilidade)
  const { optimalPosition, updateVisibility } = useFloatingElement(
    'persona-fab',
    'bottom-right',
    1, // Highest priority
    'large'
  );
  
  // Hooks para chat e autenticação
  const { messages, sendMessage, loading, sessionId, getSessionInfo } = useChat();
  const { isAuthenticated, user } = useSafeAuth();
  
  // Informações da sessão para debugging/UX
  const sessionInfo = getSessionInfo();

  // Function to determine best persona for user based on saved preferences
  const getBestPersonaForUser = () => {
    try {
      // Check for saved wizard data
      const wizardData = safeLocalStorage()?.getItem('welcome_wizard_seen');
      if (wizardData) {
        const data = JSON.parse(wizardData);
        if (data.selectedRole) {
          // Map role to persona based on WelcomeWizard logic
          if (data.selectedRole === 'patient') {
            return 'ga';
          }
          // medical and student both use dr-gasnelio
          return 'dr_gasnelio';
        }
      }

      // Check for user profile data
      const userProfile = safeLocalStorage()?.getItem('user_profile');
      if (userProfile) {
        const profile = JSON.parse(userProfile);
        if (profile.type === 'patient' || profile.role === 'patient') {
          return 'ga';
        }
      }

      // Default to Dr. Gasnelio for medical/technical users
      return 'dr_gasnelio';
    } catch {
      // Default fallback
      return 'dr_gasnelio';
    }
  };

  const bestPersona = getBestPersonaForUser();
  const personaAvatar = getPersonaAvatar(bestPersona);
  const personaName = bestPersona === 'ga' ? 'Gá' : 'Dr. Gasnelio';

  const handleChatClick = () => {
    if (isExpanded) {
      // Se mini chat já está aberto, feche-o
      setIsExpanded(false);
    } else {
      // Se não está expandido, expandir mini chat
      setIsExpanded(true);
    }
  };

  const handleFullChatRedirect = () => {
    // Navigate to chat with selected persona
    router.push(`/chat?persona=${bestPersona}`);
  };

  const handleMiniChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!miniChatInput.trim() || loading) return;
    
    try {
      await sendMessage(miniChatInput, bestPersona);
      setMiniChatInput('');
    } catch (error) {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'global_persona_fab_send_error', {
          event_category: 'medical_chat_interaction',
          event_label: 'fab_message_send_failed',
          custom_parameters: {
            medical_context: 'global_persona_fab',
            session_id: sessionId,
            error_type: 'message_send_failure',
            error_message: error instanceof Error ? error.message : String(error)
          }
        });
      }
    }
  };

  const handleQuickAction = async (action: string) => {
    const quickMessages = {
      'dose_help': 'Como calcular a dose de PQT-U?',
      'interaction_check': 'Verificar interações medicamentosas',
      'side_effects': 'Quais são os efeitos colaterais da PQT-U?',
      'patient_guidance': 'Como orientar o paciente sobre hanseníase?'
    };
    
    const message = quickMessages[action as keyof typeof quickMessages];
    if (message) {
      await sendMessage(message, bestPersona);
    }
  };

  const handleClose = () => {
    closeFAB();
  };

  // Click outside to close mini chat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isExpanded && miniChatRef.current && !miniChatRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExpanded]);

  // Sistema responsivo já gerencia visibilidade baseada na página
  // Mantido apenas para compatibilidade com outros sistemas

  // Não renderizar no servidor ou se não visível
  if (!isClient || !isVisible) return null;

  return (
    <div 
      className={className}
      style={{
        position: 'fixed',
        bottom: `${fabConfig.bottomOffset}px`,
        right: `${fabConfig.rightOffset}px`,
        zIndex: fabConfig.zIndex,
        transition: 'all 0.3s ease',
        ...style
      }}
    >
      {/* Main FAB Container with close button overlay */}
      <div style={{ position: 'relative' }}>
        {/* Main FAB with persona avatar */}
        <button
          onClick={handleChatClick}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          style={{
            width: `${fabConfig.size}px`,
            height: `${fabConfig.size}px`,
            backgroundColor: '#003366',
            border: 'none',
            borderRadius: '50%',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0, 51, 102, 0.3)',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 51, 102, 0.4)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 51, 102, 0.3)';
          }}
          aria-label={`Conversar com ${personaName}`}
          title={`Conversar com ${personaName}`}
        >
          <Image
            src={personaAvatar}
            alt={`Avatar de ${personaName}`}
            width={Math.round(fabConfig.size * 0.75)}
            height={Math.round(fabConfig.size * 0.75)}
            style={{
              borderRadius: '50%',
              objectFit: 'cover'
            }}
          />
        </button>

        {/* Close button - responsivo e sempre visível */}
        <button
          onClick={handleClose}
          style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            width: screenSize.isMobile ? '18px' : '16px',
            height: screenSize.isMobile ? '18px' : '16px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            color: '#666',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: screenSize.isMobile ? '11px' : '10px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)',
            zIndex: fabConfig.zIndex + 10,
            opacity: 0.9,
            padding: 0,
            lineHeight: 1
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 1)';
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.opacity = '1';
            e.currentTarget.style.color = '#333';
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.opacity = '0.9';
            e.currentTarget.style.color = '#666';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.12)';
          }}
          aria-label="Fechar assistente"
          title="Fechar assistente"
        >
          ×
        </button>

        {/* Mini Chat Interface */}
        {isExpanded && (
          <div 
            ref={miniChatRef}
            style={{
              position: 'absolute',
              bottom: `${fabConfig.size + 16}px`,
              right: screenSize.isMobile ? `${fabConfig.rightOffset - fabConfig.miniChatWidth + fabConfig.size}px` : '0px',
              width: `${fabConfig.miniChatWidth}px`,
              height: `${fabConfig.miniChatHeight}px`,
              backgroundColor: 'white',
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
              border: '1px solid #e0e0e0',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              zIndex: fabConfig.zIndex + 1,
              // Responsivo para mobile
              ...(screenSize.isMobile && {
                position: 'fixed',
                bottom: `${fabConfig.bottomOffset + fabConfig.size + 16}px`,
                right: `${fabConfig.rightOffset}px`,
                left: `${fabConfig.rightOffset}px`,
                width: 'auto'
              })
            }}
          >
            {/* Mini Chat Header */}
            <div style={{
              background: 'linear-gradient(135deg, #003366 0%, #004080 100%)',
              color: 'white',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Image
                  src={personaAvatar}
                  alt={personaName}
                  width={24}
                  height={24}
                  style={{ borderRadius: '50%' }}
                />
                <span style={{ fontSize: '14px', fontWeight: '600' }}>
                  {personaName}
                  <span style={{ fontSize: '12px', opacity: 0.8, marginLeft: '4px' }}>
                    • {sessionInfo.sessionType === 'authenticated' ? 'Logado' : 'Visitante'}
                    {sessionInfo.migrationData && (
                      <span title="Sessão migrada" style={{ fontSize: '10px' }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style={{ marginLeft: '2px' }}>
                          <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
                        </svg>
                      </span>
                    )}
                  </span>
                </span>
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  onClick={handleFullChatRedirect}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    borderRadius: '4px',
                    color: 'white',
                    padding: '4px 8px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                  title="Abrir chat completo"
                >
                  ↗
                </button>
                <button
                  onClick={() => setIsExpanded(false)}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    borderRadius: '4px',
                    color: 'white',
                    padding: '4px 8px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                  title="Minimizar"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              {messages.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  color: '#666',
                  fontSize: '14px',
                  padding: '20px'
                }}>
                  <p>Olá! Como posso ajudar?</p>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px',
                    marginTop: '12px'
                  }}>
                    <button
                      onClick={() => handleQuickAction('dose_help')}
                      style={{
                        background: '#f0f8ff',
                        border: '1px solid #003366',
                        borderRadius: '8px',
                        padding: '8px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        color: '#003366',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 8h-2v3h-3v2h3v3h2v-3h3v-2h-3V8zM4 10V8a4 4 0 0 1 4-4h1V2h2v2h1a4 4 0 0 1 4 4v2h-2V8a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v2H4z"/>
                        <rect x="2" y="10" width="12" height="12" rx="2" fill="currentColor"/>
                      </svg>
                      Dosagem
                    </button>
                    <button
                      onClick={() => handleQuickAction('interaction_check')}
                      style={{
                        background: '#f0f8ff',
                        border: '1px solid #003366',
                        borderRadius: '8px',
                        padding: '8px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        color: '#003366',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2L1 21h22L12 2zm0 3.5L19.5 19h-15L12 5.5zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z"/>
                      </svg>
                      Interações
                    </button>
                    <button
                      onClick={() => handleQuickAction('side_effects')}
                      style={{
                        background: '#f0f8ff',
                        border: '1px solid #003366',
                        borderRadius: '8px',
                        padding: '8px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        color: '#003366',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
                      </svg>
                      Efeitos
                    </button>
                    <button
                      onClick={() => handleQuickAction('patient_guidance')}
                      style={{
                        background: '#f0f8ff',
                        border: '1px solid #003366',
                        borderRadius: '8px',
                        padding: '8px',
                        fontSize: '12px',
                        cursor: 'pointer',
                        color: '#003366',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
                      </svg>
                      Orientação
                    </button>
                  </div>
                </div>
              ) : (
                messages.slice(-3).map((message, index) => (
                  <div
                    key={index}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '12px',
                      fontSize: '13px',
                      maxWidth: '85%',
                      alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                      backgroundColor: message.role === 'user' ? '#003366' : '#f5f5f5',
                      color: message.role === 'user' ? 'white' : '#333'
                    }}
                  >
                    {message.content}
                  </div>
                ))
              )}
              {loading && (
                <div style={{
                  alignSelf: 'flex-start',
                  padding: '8px 12px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '12px',
                  fontSize: '13px',
                  color: '#666'
                }}>
                  Pensando...
                </div>
              )}
            </div>

            {/* Input Area */}
            <form onSubmit={handleMiniChatSubmit} style={{
              padding: '12px',
              borderTop: '1px solid #e0e0e0',
              display: 'flex',
              gap: '8px'
            }}>
              <input
                type="text"
                value={miniChatInput}
                onChange={(e) => setMiniChatInput(e.target.value)}
                placeholder="Digite sua pergunta..."
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '20px',
                  fontSize: '14px',
                  outline: 'none',
                  backgroundColor: loading ? '#f5f5f5' : 'white'
                }}
              />
              <button
                type="submit"
                disabled={loading || !miniChatInput.trim()}
                style={{
                  background: '#003366',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: loading || !miniChatInput.trim() ? 0.5 : 1
                }}
              >
                ➤
              </button>
            </form>
          </div>
        )}

        {/* Persona name tooltip - responsivo */}
        {showTooltip && !screenSize.isMobile && (
          <div style={{
            position: 'absolute',
            bottom: `${Math.round(fabConfig.size * 0.3)}px`,
            right: `${fabConfig.size + 16}px`,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '6px 10px',
            borderRadius: '6px',
            fontSize: screenSize.isLargeDesktop ? '13px' : '12px',
            whiteSpace: 'nowrap',
            opacity: 1,
            transition: 'opacity 0.2s ease',
            pointerEvents: 'none',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
            zIndex: fabConfig.zIndex - 1
          }}>
            {personaName}
            {/* Small arrow */}
            <div style={{
              position: 'absolute',
              top: '50%',
              right: '-4px',
              transform: 'translateY(-50%)',
              width: 0,
              height: 0,
              borderLeft: '4px solid rgba(0, 0, 0, 0.8)',
              borderTop: '4px solid transparent',
              borderBottom: '4px solid transparent'
            }} />
          </div>
        )}
      </div>
    </div>
  );
}

// Hook to use PersonaFAB across different pages
export function usePersonaFAB() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return { isClient };
}