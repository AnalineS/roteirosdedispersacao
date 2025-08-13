'use client';

import { useEffect } from 'react';
import { modernChatTheme } from '@/config/modernTheme';

interface FocusIndicatorConfig {
  enabled?: boolean;
  color?: string;
  width?: string;
  style?: 'solid' | 'dashed' | 'dotted';
  offset?: string;
  borderRadius?: string;
  animation?: boolean;
}

export default function FocusIndicator({
  enabled = true,
  color = modernChatTheme.colors.unb.primary,
  width = '3px',
  style = 'solid',
  offset = '2px',
  borderRadius = modernChatTheme.borderRadius.sm,
  animation = true
}: FocusIndicatorConfig) {
  useEffect(() => {
    if (!enabled) return;

    // Criar estilos globais para indicadores de foco
    const styleId = 'focus-indicator-styles';
    let styleElement = document.getElementById(styleId) as HTMLStyleElement;

    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }

    // Definir estilos de foco personalizados
    styleElement.textContent = `
      /* Remover outline padrão do navegador */
      *:focus {
        outline: none !important;
      }

      /* Indicador de foco personalizado para elementos interativos */
      a:focus-visible,
      button:focus-visible,
      input:focus-visible,
      textarea:focus-visible,
      select:focus-visible,
      [role="button"]:focus-visible,
      [role="link"]:focus-visible,
      [role="menuitem"]:focus-visible,
      [role="tab"]:focus-visible,
      [tabindex]:focus-visible {
        position: relative;
        outline: ${width} ${style} ${color} !important;
        outline-offset: ${offset} !important;
        border-radius: ${borderRadius};
        ${animation ? `
          animation: focusPulse 1.5s ease-in-out infinite;
        ` : ''}
      }

      /* Estilos específicos para diferentes tipos de elementos */
      input[type="checkbox"]:focus-visible,
      input[type="radio"]:focus-visible {
        outline-offset: 4px !important;
      }

      /* Indicador de foco para cards e containers */
      .focus-card:focus-visible,
      [role="article"]:focus-visible,
      [role="region"]:focus-visible {
        box-shadow: 0 0 0 ${width} ${color};
        ${animation ? `
          animation: focusGlow 1.5s ease-in-out infinite;
        ` : ''}
      }

      /* Animações de foco */
      @keyframes focusPulse {
        0%, 100% {
          outline-color: ${color};
        }
        50% {
          outline-color: ${color}CC;
        }
      }

      @keyframes focusGlow {
        0%, 100% {
          box-shadow: 0 0 0 ${width} ${color};
        }
        50% {
          box-shadow: 0 0 8px ${width} ${color}80;
        }
      }

      /* Classe para skip links */
      .skip-link {
        position: absolute;
        top: -40px;
        left: 0;
        background: ${color};
        color: white;
        padding: 8px 16px;
        text-decoration: none;
        border-radius: 0 0 4px 0;
        z-index: 10000;
        font-weight: 600;
        font-size: 14px;
        transition: top 0.2s ease;
      }

      .skip-link:focus {
        top: 0;
        outline: 3px solid white !important;
        outline-offset: -6px !important;
      }

      /* Indicadores de foco para navegação por teclado */
      .keyboard-navigation *:focus {
        outline: ${width} solid ${color} !important;
        outline-offset: ${offset} !important;
        transition: outline 0.1s ease;
      }

      /* Estados de hover não devem mostrar outline */
      *:hover:not(:focus-visible) {
        outline: none !important;
      }

      /* Melhorar visibilidade em elementos com fundo escuro */
      .dark-bg *:focus-visible,
      [data-theme="dark"] *:focus-visible {
        outline-color: white !important;
        box-shadow: 0 0 0 ${width} white;
      }

      /* Indicador de foco para elementos desabilitados */
      [disabled]:focus-visible,
      [aria-disabled="true"]:focus-visible {
        outline-style: dotted !important;
        outline-color: ${modernChatTheme.colors.neutral.textMuted} !important;
      }

      /* Melhorar contraste para daltonismo */
      @media (prefers-contrast: high) {
        *:focus-visible {
          outline-width: 4px !important;
          outline-style: solid !important;
        }
      }

      /* Suporte para modo de alto contraste do Windows */
      @media (-ms-high-contrast: active) {
        *:focus-visible {
          outline: 3px solid currentColor !important;
        }
      }
    `;

    // Detectar navegação por teclado
    let isKeyboardNav = false;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        isKeyboardNav = true;
        document.body.classList.add('keyboard-navigation');
      }
    };

    const handleMouseDown = () => {
      isKeyboardNav = false;
      document.body.classList.remove('keyboard-navigation');
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleMouseDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleMouseDown);
      if (styleElement && styleElement.parentNode) {
        styleElement.parentNode.removeChild(styleElement);
      }
    };
  }, [enabled, color, width, style, offset, borderRadius, animation]);

  return null;
}

// Hook para usar indicadores de foco programaticamente
export function useFocusIndicator() {
  const showFocus = (element: HTMLElement) => {
    element.style.outline = `3px solid ${modernChatTheme.colors.unb.primary}`;
    element.style.outlineOffset = '2px';
  };

  const hideFocus = (element: HTMLElement) => {
    element.style.outline = 'none';
  };

  const focusWithIndication = (element: HTMLElement) => {
    element.focus();
    showFocus(element);
    
    // Remover indicação após perder o foco
    element.addEventListener('blur', () => hideFocus(element), { once: true });
  };

  return {
    showFocus,
    hideFocus,
    focusWithIndication
  };
}

// Componente Skip Link para navegação rápida
export function SkipLink({ href = '#main-content', children = 'Pular para o conteúdo principal' }) {
  return (
    <a href={href} className="skip-link">
      {children}
    </a>
  );
}