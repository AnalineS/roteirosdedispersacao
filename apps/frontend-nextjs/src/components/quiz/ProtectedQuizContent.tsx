'use client';

import React, { useEffect, useRef } from 'react';

interface ProtectedQuizContentProps {
  children: React.ReactNode;
  className?: string;
  blockRightClick?: boolean;
  blockCopy?: boolean;
  blockPrint?: boolean;
  showWarning?: boolean;
}

/**
 * Componente para proteger conteúdo de quiz contra cópia
 * Previne seleção de texto, cópia e outros métodos de extração
 */
export default function ProtectedQuizContent({
  children,
  className = '',
  blockRightClick = true,
  blockCopy = true,
  blockPrint = true,
  showWarning = false
}: ProtectedQuizContentProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Prevenir menu de contexto (clique direito)
    const handleContextMenu = (e: MouseEvent) => {
      if (blockRightClick) {
        e.preventDefault();
        if (showWarning) {
          console.warn('Conteúdo protegido: cópia não permitida em questões de avaliação');
        }
      }
    };

    // Prevenir cópia via teclado
    const handleCopy = (e: ClipboardEvent) => {
      if (blockCopy) {
        e.preventDefault();
        if (showWarning) {
          alert('Este conteúdo está protegido e não pode ser copiado durante a avaliação.');
        }
      }
    };

    // Prevenir seleção de texto
    const handleSelectStart = (e: Event) => {
      e.preventDefault();
    };

    // Prevenir drag de elementos
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
    };

    // Adicionar listeners
    container.addEventListener('contextmenu', handleContextMenu);
    container.addEventListener('copy', handleCopy);
    container.addEventListener('selectstart', handleSelectStart);
    container.addEventListener('dragstart', handleDragStart);

    // Prevenir teclas de atalho
    const handleKeyDown = (e: KeyboardEvent) => {
      // Bloquear Ctrl+C, Ctrl+A, Ctrl+X
      if (e.ctrlKey && (e.key === 'c' || e.key === 'a' || e.key === 'x')) {
        e.preventDefault();
        if (showWarning) {
          console.warn('Atalhos de cópia desabilitados em área de avaliação');
        }
      }
      // Bloquear PrintScreen (limitado, nem sempre funciona)
      if (e.key === 'PrintScreen') {
        e.preventDefault();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      container.removeEventListener('contextmenu', handleContextMenu);
      container.removeEventListener('copy', handleCopy);
      container.removeEventListener('selectstart', handleSelectStart);
      container.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [blockRightClick, blockCopy, showWarning]);

  // CSS para prevenir impressão
  useEffect(() => {
    if (blockPrint) {
      const style = document.createElement('style');
      style.innerHTML = `
        @media print {
          .quiz-protected-content {
            display: none !important;
          }
          
          .quiz-protected-content::after {
            content: "Conteúdo protegido - Impressão não permitida";
            display: block !important;
            font-size: 24px;
            text-align: center;
            padding: 50px;
          }
        }
      `;
      document.head.appendChild(style);

      return () => {
        document.head.removeChild(style);
      };
    }
  }, [blockPrint]);

  return (
    <div
      ref={containerRef}
      className={`quiz-container quiz-protected-content ${className}`}
      data-protected="true"
      data-no-select="true"
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        WebkitTouchCallout: 'none',
        position: 'relative'
      }}
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onPaste={(e) => e.preventDefault()}
    >
      {/* Overlay invisível para prevenir inspeção fácil */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
          pointerEvents: 'none',
          userSelect: 'none'
        }}
        aria-hidden="true"
      />
      
      {/* Conteúdo do quiz */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>

      {/* Marca d'água opcional */}
      {showWarning && (
        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            right: '10px',
            fontSize: '0.75rem',
            color: '#999',
            userSelect: 'none',
            pointerEvents: 'none',
            opacity: 0.7
          }}
        >
          Conteúdo protegido
        </div>
      )}
    </div>
  );
}

/**
 * Hook para detectar tentativas de cópia/fraude
 */
export function useQuizProtection() {
  const [copyAttempts, setCopyAttempts] = React.useState(0);
  const [suspiciousActivity, setSuspiciousActivity] = React.useState(false);

  React.useEffect(() => {
    const handleCopyAttempt = () => {
      setCopyAttempts(prev => prev + 1);
      if (copyAttempts > 3) {
        setSuspiciousActivity(true);
      }
    };

    // Detectar mudança de aba/janela (possível consulta)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('Usuário saiu da aba durante avaliação');
      }
    };

    document.addEventListener('copy', handleCopyAttempt);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('copy', handleCopyAttempt);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [copyAttempts]);

  return { copyAttempts, suspiciousActivity };
}