'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getUnbColors } from '@/config/modernTheme';

interface ChatFeedbackProps {
  onMessageSent?: () => void;
  onMessageReceived?: () => void;
  enableSound?: boolean;
  enableVisualFeedback?: boolean;
  className?: string;
}

interface FeedbackState {
  isSending: boolean;
  isReceiving: boolean;
  lastAction: 'sent' | 'received' | null;
  showSuccess: boolean;
}

export default function ChatFeedback({
  onMessageSent,
  onMessageReceived,
  enableSound = true,
  enableVisualFeedback = true,
  className = ''
}: ChatFeedbackProps) {
  const unbColors = getUnbColors();
  const [feedbackState, setFeedbackState] = useState<FeedbackState>({
    isSending: false,
    isReceiving: false,
    lastAction: null,
    showSuccess: false
  });
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const successTimeoutRef = useRef<NodeJS.Timeout>(undefined);

  // Inicializar AudioContext
  useEffect(() => {
    if (enableSound && typeof window !== 'undefined') {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (error) {
        console.warn('AudioContext não disponível:', error);
      }
    }

    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [enableSound]);

  // Gerar som sintético
  const playSound = (type: 'send' | 'receive' | 'success' | 'error') => {
    if (!enableSound || !audioContextRef.current) return;

    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Diferentes frequências e padrões para cada tipo
    const soundPatterns = {
      send: {
        frequency: 800,
        duration: 0.15,
        volume: 0.1,
        type: 'sine' as OscillatorType
      },
      receive: {
        frequency: 600,
        duration: 0.2,
        volume: 0.08,
        type: 'sine' as OscillatorType
      },
      success: {
        frequency: 1000,
        duration: 0.3,
        volume: 0.12,
        type: 'sine' as OscillatorType
      },
      error: {
        frequency: 300,
        duration: 0.5,
        volume: 0.15,
        type: 'sawtooth' as OscillatorType
      }
    };

    const pattern = soundPatterns[type];
    
    oscillator.type = pattern.type;
    oscillator.frequency.value = pattern.frequency;
    
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(pattern.volume, ctx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + pattern.duration);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + pattern.duration);
  };

  // Funções públicas para controlar feedback
  const triggerSendFeedback = () => {
    setFeedbackState(prev => ({
      ...prev,
      isSending: true,
      lastAction: 'sent'
    }));

    playSound('send');

    // Simular envio
    setTimeout(() => {
      setFeedbackState(prev => ({
        ...prev,
        isSending: false,
        showSuccess: true
      }));

      playSound('success');
      onMessageSent?.();

      // Limpar feedback de sucesso
      successTimeoutRef.current = setTimeout(() => {
        setFeedbackState(prev => ({
          ...prev,
          showSuccess: false,
          lastAction: null
        }));
      }, 2000);
    }, 500);
  };

  const triggerReceiveFeedback = () => {
    setFeedbackState(prev => ({
      ...prev,
      isReceiving: true,
      lastAction: 'received'
    }));

    playSound('receive');
    onMessageReceived?.();

    // Limpar feedback de recebimento
    setTimeout(() => {
      setFeedbackState(prev => ({
        ...prev,
        isReceiving: false
      }));
    }, 1000);
  };

  const triggerErrorFeedback = (message: string = 'Erro ao enviar mensagem') => {
    setFeedbackState(prev => ({
      ...prev,
      isSending: false,
      isReceiving: false
    }));

    playSound('error');
    
    // Mostrar notificação de erro
    if (enableVisualFeedback) {
      // Aqui você pode integrar com um sistema de notificações
      console.error(message);
    }
  };

  if (!enableVisualFeedback) {
    return null;
  }

  return (
    <div className={`chat-feedback ${className}`} style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      pointerEvents: 'none'
    }}>
      {/* Indicador de Envio */}
      {feedbackState.isSending && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          background: 'white',
          padding: '0.75rem 1rem',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          border: `2px solid ${unbColors.primary}`,
          animation: 'slideInRight 0.3s ease'
        }}>
          {/* Spinner de envio */}
          <div style={{
            width: '20px',
            height: '20px',
            border: `2px solid ${unbColors.alpha.primary}`,
            borderTop: `2px solid ${unbColors.primary}`,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          
          <span style={{
            fontSize: '0.9rem',
            fontWeight: '600',
            color: unbColors.primary
          }}>
            Enviando mensagem...
          </span>
        </div>
      )}

      {/* Indicador de Recebimento */}
      {feedbackState.isReceiving && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          background: 'white',
          padding: '0.75rem 1rem',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          border: '2px solid #059669',
          animation: 'slideInRight 0.3s ease'
        }}>
          {/* Indicador de digitação */}
          <div style={{
            display: 'flex',
            gap: '0.25rem'
          }}>
            {[0, 1, 2].map(i => (
              <div
                key={i}
                style={{
                  width: '6px',
                  height: '6px',
                  background: '#059669',
                  borderRadius: '50%',
                  animation: `bounce 1.4s ease-in-out ${i * 0.16}s infinite`
                }}
              />
            ))}
          </div>
          
          <span style={{
            fontSize: '0.9rem',
            fontWeight: '600',
            color: '#059669'
          }}>
            Assistente digitando...
          </span>
        </div>
      )}

      {/* Feedback de Sucesso */}
      {feedbackState.showSuccess && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          background: 'white',
          padding: '0.75rem 1rem',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          border: '2px solid #22c55e',
          animation: 'slideInRight 0.3s ease'
        }}>
          {/* Ícone de sucesso */}
          <div style={{
            width: '20px',
            height: '20px',
            background: '#22c55e',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: '12px'
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
          </div>
          
          <span style={{
            fontSize: '0.9rem',
            fontWeight: '600',
            color: '#22c55e'
          }}>
            Mensagem enviada!
          </span>
        </div>
      )}

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes bounce {
          0%, 80%, 100% { 
            transform: scale(0.8);
            opacity: 0.5;
          }
          40% { 
            transform: scale(1);
            opacity: 1;
          }
        }
        
        @keyframes slideInRight {
          0% {
            opacity: 0;
            transform: translateX(100px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slideOutRight {
          0% {
            opacity: 1;
            transform: translateX(0);
          }
          100% {
            opacity: 0;
            transform: translateX(100px);
          }
        }
      `}</style>
    </div>
  );
}

// Hook para controlar feedback do chat
export function useChatFeedback() {
  const feedbackRef = useRef<{
    triggerSendFeedback: () => void;
    triggerReceiveFeedback: () => void;
    triggerErrorFeedback: (message?: string) => void;
  } | null>(null);

  const setFeedbackRef = (ref: any) => {
    feedbackRef.current = ref;
  };

  const triggerSendFeedback = () => {
    feedbackRef.current?.triggerSendFeedback();
  };

  const triggerReceiveFeedback = () => {
    feedbackRef.current?.triggerReceiveFeedback();
  };

  const triggerErrorFeedback = (message?: string) => {
    feedbackRef.current?.triggerErrorFeedback(message);
  };

  return {
    setFeedbackRef,
    triggerSendFeedback,
    triggerReceiveFeedback,
    triggerErrorFeedback
  };
}

// Componente wrapper para integrar feedback automaticamente
interface ChatFeedbackWrapperProps {
  children: React.ReactNode;
  enableSound?: boolean;
  enableVisualFeedback?: boolean;
}

export function ChatFeedbackWrapper({
  children,
  enableSound = true,
  enableVisualFeedback = true
}: ChatFeedbackWrapperProps) {
  return (
    <div style={{ position: 'relative' }}>
      {children}
      <ChatFeedback
        enableSound={enableSound}
        enableVisualFeedback={enableVisualFeedback}
      />
    </div>
  );
}