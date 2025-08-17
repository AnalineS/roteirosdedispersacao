'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { getPersonaAvatar } from '@/constants/avatars';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/hooks/useAuth';

interface GlobalPersonaFABProps {
  className?: string;
  style?: React.CSSProperties;
}

export default function GlobalPersonaFAB({ className, style }: GlobalPersonaFABProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showCloseButton, setShowCloseButton] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [miniChatInput, setMiniChatInput] = useState('');
  const router = useRouter();
  const pathname = usePathname();
  const miniChatRef = useRef<HTMLDivElement>(null);
  
  // Hooks para chat e autenticação
  const { messages, sendMessage, loading, sessionId, getSessionInfo } = useChat();
  const { isAuthenticated, user } = useAuth();
  
  // Informações da sessão para debugging/UX
  const sessionInfo = getSessionInfo();

  // Function to determine best persona for user based on saved preferences
  const getBestPersonaForUser = () => {
    try {
      // Check for saved wizard data
      const wizardData = localStorage.getItem('welcome_wizard_seen');
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
      const userProfile = localStorage.getItem('user_profile');
      if (userProfile) {
        const profile = JSON.parse(userProfile);
        if (profile.type === 'patient' || profile.role === 'patient') {
          return 'ga';
        }
      }

      // Default to Dr. Gasnelio for medical/technical users
      return 'dr_gasnelio';
    } catch (error) {
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
      console.error('Erro ao enviar mensagem:', error);
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
    setIsVisible(false);
    // Save closed state to sessionStorage (só para a sessão atual)
    const closeData = {
      timestamp: Date.now(),
      closed: true
    };
    sessionStorage.setItem('fab_closed', JSON.stringify(closeData));
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

  // Check if FAB was closed in this session and if we're on chat page
  useEffect(() => {
    // Não mostrar FAB na página do chat
    if (pathname === '/chat') {
      setIsVisible(false);
      return;
    }

    // Verificar se foi fechado nesta sessão
    const fabClosed = sessionStorage.getItem('fab_closed');
    if (fabClosed) {
      try {
        const data = JSON.parse(fabClosed);
        if (data.closed) {
          setIsVisible(false);
        }
      } catch (error) {
        sessionStorage.removeItem('fab_closed');
      }
    }
  }, [pathname]);

  if (!isVisible) return null;

  return (
    <div 
      className={className}
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 1000,
        ...style
      }}
      onMouseEnter={() => setShowCloseButton(true)}
      onMouseLeave={() => setShowCloseButton(false)}
    >
      {/* Main FAB Container with close button overlay */}
      <div style={{ position: 'relative' }}>
        {/* Main FAB with persona avatar */}
        <button
          onClick={handleChatClick}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          style={{
            width: '64px',
            height: '64px',
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
            width={48}
            height={48}
            style={{
              borderRadius: '50%',
              objectFit: 'cover'
            }}
          />
        </button>

        {/* Close button - aparece no hover, posicionado próximo ao FAB */}
        {showCloseButton && (
          <button
            onClick={handleClose}
            style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              width: '24px',
              height: '24px',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              color: '#333',
              border: 'none',
              borderRadius: '50%',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
              zIndex: 1001
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 1)';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
            aria-label="Fechar assistente"
            title="Fechar assistente"
          >
            ×
          </button>
        )}

        {/* Mini Chat Interface */}
        {isExpanded && (
          <div 
            ref={miniChatRef}
            style={{
              position: 'absolute',
              bottom: '80px',
              right: '0px',
              width: '320px',
              height: '400px',
              backgroundColor: 'white',
              borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
              border: '1px solid #e0e0e0',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              zIndex: 1000
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
                      <span title="Sessão migrada"> 🔄</span>
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
                        color: '#003366'
                      }}
                    >
                      💊 Dosagem
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
                        color: '#003366'
                      }}
                    >
                      ⚠️ Interações
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
                        color: '#003366'
                      }}
                    >
                      ⚡ Efeitos
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
                        color: '#003366'
                      }}
                    >
                      👨‍⚕️ Orientação
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

        {/* Persona name tooltip */}
        {showTooltip && (
          <div style={{
            position: 'absolute',
            bottom: '20px',
            right: '80px',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            padding: '6px 10px',
            borderRadius: '6px',
            fontSize: '12px',
            whiteSpace: 'nowrap',
            opacity: 1,
            transition: 'opacity 0.2s ease',
            pointerEvents: 'none',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
            zIndex: 999
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