'use client';

import React, { useState, useEffect } from 'react';
import { safeLocalStorage, isClientSide } from '@/hooks/useClientStorage';
import { getUnbColors } from '@/config/modernTheme';

interface LGPDBannerProps {
  onAccept?: () => void;
  onDecline?: () => void;
}

export default function LGPDBanner({ onAccept, onDecline }: LGPDBannerProps) {
  const [isVisible, setIsVisible] = useState(() => {
    if (typeof window === 'undefined') return false;
    const generalConsent = safeLocalStorage()?.getItem('lgpd-general-consent');
    return !generalConsent;
  });
  const [isMinimized, setIsMinimized] = useState(false);
  const unbColors = getUnbColors();

  const handleAccept = () => {
    const consentData = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      accepted: true,
      ip: 'masked-for-privacy', // IP não é coletado para privacidade
      userAgent: navigator.userAgent.substring(0, 100) // Limitado para privacidade
    };

    safeLocalStorage()?.setItem('lgpd-general-consent', JSON.stringify(consentData));
    setIsVisible(false);

    if (onAccept) {
      onAccept();
    }
  };

  const handleDecline = () => {
    // Redirecionar para página externa ou mostrar informações limitadas
    alert('Para usar esta plataforma educacional, é necessário aceitar a política de privacidade. Você será redirecionado para uma versão com informações básicas.');

    if (onDecline) {
      onDecline();
    } else {
      // Redirecionar para página estática
      window.location.href = '/politica-nao-aceita';
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      background: 'linear-gradient(135deg, #003366 0%, #004488 100%)',
      color: 'white',
      zIndex: 10001,
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
      borderBottom: '3px solid #FFD700'
    }}>
      {!isMinimized ? (
        <div style={{
          padding: '1rem 2rem',
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          gap: '1.5rem',
          flexWrap: 'wrap'
        }}>
          <div style={{
            flex: '1',
            minWidth: '300px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.5rem'
            }}>
              <span style={{ fontSize: '1.2rem' }}>🔒</span>
              <h3 style={{
                margin: 0,
                fontSize: '1.1rem',
                fontWeight: '600'
              }}>
                Proteção de Dados Pessoais - LGPD
              </h3>
            </div>

            <p style={{
              margin: 0,
              fontSize: '0.9rem',
              lineHeight: '1.4',
              opacity: 0.95
            }}>
              Usamos cookies e coletamos dados para melhorar sua experiência educacional sobre hanseníase.
              Seus dados de saúde são tratados com máxima segurança, conforme a LGPD.
            </p>
          </div>

          <div style={{
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <button
              onClick={() => window.open('/privacidade', '_blank')}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: '500',
                textDecoration: 'none',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              }}
            >
              📋 Ler Política
            </button>

            <button
              onClick={handleDecline}
              style={{
                background: 'rgba(220, 38, 38, 0.8)',
                color: 'white',
                border: 'none',
                padding: '0.6rem 1.2rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: '600'
              }}
            >
              ❌ Recusar
            </button>

            <button
              onClick={handleAccept}
              style={{
                background: '#10B981',
                color: 'white',
                border: 'none',
                padding: '0.6rem 1.5rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: '600',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
              }}
            >
              ✅ Aceitar e Continuar
            </button>
          </div>

          <button
            onClick={toggleMinimize}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontSize: '1.2rem',
              padding: '0.25rem',
              opacity: 0.7
            }}
            title="Minimizar banner"
          >
            ⬆️
          </button>
        </div>
      ) : (
        <div style={{
          padding: '0.5rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.85rem'
          }}>
            <span>🔒</span>
            <span>Aceite a política de privacidade para continuar</span>
          </div>

          <div style={{
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center'
          }}>
            <button
              onClick={handleAccept}
              style={{
                background: '#10B981',
                color: 'white',
                border: 'none',
                padding: '0.4rem 1rem',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: '600'
              }}
            >
              ✅ Aceitar
            </button>

            <button
              onClick={toggleMinimize}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                fontSize: '1rem',
                padding: '0.25rem',
                opacity: 0.7
              }}
              title="Expandir banner"
            >
              ⬇️
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Hook para verificar se o usuário deu consentimento geral
export function useGeneralConsent() {
  const [hasConsent, setHasConsent] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      const generalConsent = safeLocalStorage()?.getItem('lgpd-general-consent');
      if (generalConsent) {
        const consentData = JSON.parse(generalConsent);
        return consentData.accepted === true;
      }
    } catch {
      // ignore parse errors
    }
    return false;
  });
  const [isLoading] = useState(false);

  return {
    hasConsent,
    isLoading
  };
}