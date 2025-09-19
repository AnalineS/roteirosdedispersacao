/**
 * Fast Access Bar - Barra de acesso rápido para emergências médicas
 * Posicionamento sticky com hide inteligente e atalhos críticos
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  EmergencyShortcut, 
  MedicalSpecialty,
  UrgencyLevel 
} from '@/types/emergencyShortcuts';
import { 
  CRITICAL_MEDICAL_SHORTCUTS,
  IMPORTANT_MEDICAL_SHORTCUTS,
  getShortcutsByProfile,
  MEDICAL_COLORS,
  ACCESS_KEYS
} from '@/constants/medicalShortcuts';
import { useRemoteConfig } from '@/hooks/useRemoteConfig';
import { UrgencyBadge } from '@/components/ui/UrgencyBadge';
import { getUrgencyFromKeywords } from '@/types/urgencyBadges';

interface FastAccessBarProps {
  className?: string;
  userProfile?: {
    role: MedicalSpecialty;
    experience: 'junior' | 'senior' | 'expert';
  };
  maxShortcuts?: number;
  position?: 'top' | 'bottom';
  behavior?: 'sticky' | 'fixed' | 'smart-hide';
  onShortcutClick?: (shortcut: EmergencyShortcut) => void;
}

export default function FastAccessBar({
  className = '',
  userProfile,
  maxShortcuts = 5,
  position = 'top',
  behavior = 'smart-hide',
  onShortcutClick
}: FastAccessBarProps) {
  const pathname = usePathname();
  const { shouldShowFastAccessBar, isDebugMode } = useRemoteConfig();
  const barRef = useRef<HTMLDivElement>(null);
  
  const [isVisible, setIsVisible] = useState(true);
  const [isScrollingDown, setIsScrollingDown] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [shortcuts, setShortcuts] = useState<EmergencyShortcut[]>([]);

  // Smart hide behavior - esconder ao rolar para baixo
  const handleScroll = useCallback(() => {
    if (behavior !== 'smart-hide') return;

    const currentScrollY = window.scrollY;
    const scrollingDown = currentScrollY > lastScrollY && currentScrollY > 100;
    
    setIsScrollingDown(scrollingDown);
    setIsVisible(!scrollingDown);
    setLastScrollY(currentScrollY);
  }, [lastScrollY, behavior]);

  // Lidar com clique em atalho
  const handleShortcutClick = useCallback((shortcut: EmergencyShortcut) => {
    // Analytics tracking
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', shortcut.analytics?.event || 'fast_access_click', {
        event_category: shortcut.analytics?.category || 'fast_access_bar',
        event_label: shortcut.analytics?.label || shortcut.id,
        custom_parameters: {
          urgency: shortcut.urgency,
          category: shortcut.category,
          user_role: userProfile?.role || 'unknown',
          access_method: 'click'
        }
      });
    }

    onShortcutClick?.(shortcut);
  }, [userProfile?.role, onShortcutClick]);

  // Configurar atalhos baseado no perfil do usuário
  useEffect(() => {
    let selectedShortcuts: EmergencyShortcut[] = [];

    if (userProfile?.role) {
      // Obter atalhos recomendados por perfil
      selectedShortcuts = getShortcutsByProfile(userProfile.role);
    } else {
      // Usar atalhos críticos por padrão
      selectedShortcuts = [...CRITICAL_MEDICAL_SHORTCUTS];
    }

    // Adicionar alguns importantes se há espaço
    const remaining = maxShortcuts - selectedShortcuts.length;
    if (remaining > 0) {
      const important = IMPORTANT_MEDICAL_SHORTCUTS
        .filter(s => !selectedShortcuts.some(existing => existing.id === s.id))
        .slice(0, remaining);
      selectedShortcuts = [...selectedShortcuts, ...important];
    }

    // Limitar ao máximo configurado
    setShortcuts(selectedShortcuts.slice(0, maxShortcuts));
  }, [userProfile, maxShortcuts]);

  useEffect(() => {
    if (behavior === 'smart-hide') {
      const throttledScroll = throttle(handleScroll, 100);
      window.addEventListener('scroll', throttledScroll, { passive: true });
      return () => window.removeEventListener('scroll', throttledScroll);
    }
  }, [handleScroll, behavior]);

  // Lidar com teclas de acesso rápido
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Alt + tecla de acesso
      if (event.altKey && !event.ctrlKey && !event.shiftKey) {
        const pressedKey = event.key.toLowerCase();
        const shortcut = shortcuts.find(s => 
          ACCESS_KEYS[s.id as keyof typeof ACCESS_KEYS] === pressedKey
        );
        
        if (shortcut) {
          event.preventDefault();
          
          // Analytics para acesso por teclado
          if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'keyboard_shortcut_used', {
              event_category: 'navigation',
              event_label: 'keyboard_shortcut',
              custom_parameters: {
                shortcut_id: shortcut.id,
                shortcut_key: pressedKey,
                page_path: pathname
              }
            });
          }
          
          handleShortcutClick(shortcut);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, pathname, handleShortcutClick]);

  // Não mostrar na página de chat ou se feature flag desabilitada
  if (pathname === '/chat' || !shouldShowFastAccessBar()) {
    return null;
  }

  // Função para throttle do scroll
  function throttle<T extends (...args: unknown[]) => unknown>(func: T, delay: number): T {
    let timeoutId: NodeJS.Timeout | null = null;
    let lastExecTime = 0;
    
    return ((...args: Parameters<T>) => {
      const currentTime = Date.now();
      
      if (currentTime - lastExecTime > delay) {
        func(...args);
        lastExecTime = currentTime;
      } else {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          func(...args);
          lastExecTime = Date.now();
        }, delay - (currentTime - lastExecTime));
      }
    }) as T;
  }


  // Obter cor baseada na urgência
  const getUrgencyColor = (urgency: UrgencyLevel) => {
    return MEDICAL_COLORS[urgency] || MEDICAL_COLORS.standard;
  };

  // Classe CSS baseada no comportamento
  const getPositionClass = () => {
    const baseClass = 'fast-access-bar';
    const positionClass = position === 'top' ? 'top-0' : 'bottom-0';
    const behaviorClass = behavior === 'fixed' ? 'fixed' : 'sticky';
    const visibilityClass = isVisible ? 'translate-y-0' : 
                           position === 'top' ? '-translate-y-full' : 'translate-y-full';
    
    return `${baseClass} ${behaviorClass} ${positionClass} ${visibilityClass}`;
  };

  if (shortcuts.length === 0) return null;

  return (
    <div 
      ref={barRef}
      className={`${getPositionClass()} ${className}`}
      style={{
        zIndex: 1100,
        transition: 'transform 0.3s ease-in-out',
        borderBottom: position === 'top' ? '1px solid rgba(0,0,0,0.1)' : 'none',
        borderTop: position === 'bottom' ? '1px solid rgba(0,0,0,0.1)' : 'none'
      }}
      role="toolbar"
      aria-label="Barra de acesso rápido para emergências médicas"
      aria-hidden={!isVisible}
    >
      <div style={{
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        padding: '8px 16px',
        maxWidth: '100vw',
        overflow: 'hidden'
      }}>
        {/* Container com scroll horizontal */}
        <div style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          overflowY: 'hidden',
          scrollbarWidth: 'none', // Firefox
          msOverflowStyle: 'none', // IE/Edge
          paddingBottom: '4px'
        }}>
          {shortcuts.map((shortcut) => {
            const colors = getUrgencyColor(shortcut.urgency);
            const accessKey = ACCESS_KEYS[shortcut.id as keyof typeof ACCESS_KEYS];
            
            return (
              <Link
                key={shortcut.id}
                href={shortcut.href}
                onClick={() => handleShortcutClick(shortcut)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  backgroundColor: colors.background,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '20px',
                  color: colors.text,
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  whiteSpace: 'nowrap',
                  minWidth: 'fit-content',
                  flexShrink: 0,
                  transition: 'all 0.2s ease',
                  outline: 'none',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.hover;
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = colors.background;
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                onFocus={(e) => {
                  e.currentTarget.style.outline = `2px solid ${colors.border}`;
                  e.currentTarget.style.outlineOffset = '2px';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.outline = 'none';
                }}
                aria-label={`${shortcut.description}. Tecla de acesso: Alt+${accessKey}`}
                title={`${shortcut.description}\nTempo estimado: ${shortcut.estimatedTime}\nTecla rápida: Alt+${accessKey}`}
                tabIndex={0}
              >
                {/* Ícone */}
                <span 
                  style={{ 
                    fontSize: '1rem',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  aria-hidden="true"
                >
                  {shortcut.icon}
                </span>
                
                {/* Label */}
                <span>{shortcut.label}</span>
                
                {/* Badge de urgência */}
                {(shortcut.urgency === 'critical' || shortcut.urgency === 'important') && (
                  <UrgencyBadge
                    urgency={shortcut.urgency === 'critical' ? 'critical' : 'high'}
                    variant="minimal"
                    size="xs"
                    showIcon={false}
                    label={shortcut.urgency === 'critical' ? '!' : ''}
                  />
                )}
                
                {/* Tecla de acesso (apenas no debug mode) */}
                {isDebugMode() && accessKey && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '-4px',
                      right: '-4px',
                      backgroundColor: colors.border,
                      color: 'white',
                      fontSize: '0.6rem',
                      padding: '1px 3px',
                      borderRadius: '2px',
                      lineHeight: 1
                    }}
                    aria-hidden="true"
                  >
                    {accessKey.toUpperCase()}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
        
        {/* Indicador de mais conteúdo (se necessário) */}
        <div 
          style={{
            position: 'absolute',
            right: '8px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'linear-gradient(90deg, transparent, rgba(248,250,252,0.9))',
            width: '20px',
            height: '100%',
            pointerEvents: 'none',
            display: shortcuts.length > 4 ? 'block' : 'none'
          }}
          aria-hidden="true"
        />
      </div>
      
      {/* CSS para animações */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        .fast-access-bar {
          /* Esconder scrollbar em diferentes browsers */
        }
        
        .fast-access-bar::-webkit-scrollbar {
          display: none;
        }
        
        @media (prefers-reduced-motion: reduce) {
          .fast-access-bar,
          .fast-access-bar * {
            transition: none !important;
            animation: none !important;
          }
        }
        
        /* Melhor contraste em modo escuro */
        @media (prefers-color-scheme: dark) {
          .fast-access-bar {
            background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
          }
        }
        
        /* Touch targets maiores em mobile */
        @media (max-width: 768px) {
          .fast-access-bar a {
            min-height: 44px !important;
            padding: 12px 16px !important;
          }
        }
      `}</style>
    </div>
  );
}