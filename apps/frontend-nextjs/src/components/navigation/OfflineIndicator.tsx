'use client';

/**
 * Componente OfflineIndicator - Indicador Discreto de Modo Offline
 *
 * Conforme PR #264 - RF03: Indicadores Discretos
 * - Badge discreto no canto superior direito
 * - Visível apenas quando offline
 * - Tooltip com detalhes sob demanda
 * - Acessível via teclado e screen reader
 *
 * Best Practices aplicadas:
 * - Next.js Client Component pattern
 * - React useState/useEffect hooks
 * - Progressive disclosure
 */

import { useState, useEffect } from 'react';

interface OfflineIndicatorProps {
  /** Posição do indicador */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  /** Variante visual */
  variant?: 'minimal' | 'default';
  /** Quando mostrar detalhes */
  showDetails?: 'always' | 'on-hover' | 'never';
  /** Classe CSS customizada */
  className?: string;
}

export default function OfflineIndicator({
  position = 'top-right',
  variant = 'minimal',
  showDetails = 'on-hover',
  className = ''
}: OfflineIndicatorProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);
  const [lastOnline, setLastOnline] = useState<Date | null>(null);

  useEffect(() => {
    // Definir estado inicial
    setIsOnline(navigator.onLine);

    // Event listeners para mudanças de conectividade
    const handleOnline = () => {
      setIsOnline(true);
      setLastOnline(new Date());
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Não renderizar se estiver online
  if (isOnline) return null;

  const positionStyles = {
    'top-right': { top: '16px', right: '16px' },
    'top-left': { top: '16px', left: '16px' },
    'bottom-right': { bottom: '16px', right: '16px' },
    'bottom-left': { bottom: '16px', left: '16px' }
  };

  const getTimeSinceOnline = () => {
    if (!lastOnline) return 'Desconhecido';
    const diff = Date.now() - lastOnline.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Agora mesmo';
    if (minutes === 1) return 'Há 1 minuto';
    if (minutes < 60) return `Há ${minutes} minutos`;
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return 'Há 1 hora';
    return `Há ${hours} horas`;
  };

  return (
    <>
      <div
        className={`offline-indicator ${className}`}
        data-variant={variant}
        data-testid="offline-indicator"
        style={{
          position: 'fixed',
          ...positionStyles[position],
          zIndex: 1000,
          transition: 'all 200ms ease'
        }}
        onMouseEnter={() => showDetails === 'on-hover' && setShowTooltip(true)}
        onMouseLeave={() => showDetails === 'on-hover' && setShowTooltip(false)}
        onFocus={() => showDetails === 'on-hover' && setShowTooltip(true)}
        onBlur={() => showDetails === 'on-hover' && setShowTooltip(false)}
        role="status"
        aria-live="polite"
        aria-label="Modo Offline - Funcionalidades limitadas"
        tabIndex={0}
      >
        <div className="offline-badge">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
          {(showDetails === 'always' || showTooltip) && (
            <div className="offline-tooltip" data-testid="offline-tooltip">
              <div className="tooltip-content">
                <strong>Modo Offline</strong>
                <p>Funcionalidades limitadas</p>
                {lastOnline && <small>Última conexão: {getTimeSinceOnline()}</small>}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Estilos CSS-in-JS */}
      <style jsx>{`
        .offline-badge {
          position: relative;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: ${variant === 'minimal' ? '6px' : '8px 12px'};
          background: ${variant === 'minimal' ? 'transparent' : '#FFF3E0'};
          color: #E65100;
          border-radius: 8px;
          box-shadow: ${variant === 'minimal' ? 'none' : '0 2px 8px rgba(0,0,0,0.1)'};
          font-size: 14px;
          cursor: help;
          transition: all 200ms ease;
        }

        .offline-indicator[data-variant="minimal"]:hover .offline-badge {
          background: #FFF3E0;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .offline-indicator:focus {
          outline: 2px solid #E65100;
          outline-offset: 2px;
          border-radius: 8px;
        }

        .offline-tooltip {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          background: white;
          border: 1px solid #E0E0E0;
          border-radius: 8px;
          padding: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          min-width: 200px;
          z-index: 1001;
          animation: fadeIn 200ms ease;
        }

        .tooltip-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .tooltip-content strong {
          color: #E65100;
          font-size: 14px;
        }

        .tooltip-content p {
          margin: 0;
          color: #616161;
          font-size: 13px;
        }

        .tooltip-content small {
          color: #9E9E9E;
          font-size: 11px;
          margin-top: 4px;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Responsividade mobile */
        @media (max-width: 640px) {
          .offline-indicator {
            top: 12px !important;
            right: 12px !important;
          }

          .offline-badge {
            padding: 4px;
          }

          .offline-tooltip {
            min-width: 180px;
            font-size: 12px;
          }
        }
      `}</style>
    </>
  );
}
