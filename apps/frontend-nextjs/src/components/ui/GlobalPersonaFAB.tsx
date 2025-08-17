'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { getPersonaAvatar } from '@/constants/avatars';

interface GlobalPersonaFABProps {
  className?: string;
  style?: React.CSSProperties;
}

export default function GlobalPersonaFAB({ className, style }: GlobalPersonaFABProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showCloseButton, setShowCloseButton] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

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
    // Navigate to chat with selected persona
    router.push(`/chat?persona=${bestPersona}`);
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