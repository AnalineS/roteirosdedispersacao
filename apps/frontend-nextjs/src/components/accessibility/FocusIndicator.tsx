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

      /* Classe para skip links - Posicionamento melhorado */
      .skip-link {
        position: fixed;
        top: -100px;
        left: 50%;
        transform: translateX(-50%);
        background: ${color};
        color: white;
        padding: 12px 24px;
        text-decoration: none;
        border-radius: 8px;
        z-index: 10000;
        font-weight: 600;
        font-size: 16px;
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        border: 2px solid transparent;
        min-width: 200px;
        text-align: center;
        line-height: 1.2;
      }

      .skip-link:focus,
      .skip-link:focus-visible {
        top: 20px;
        outline: 3px solid white !important;
        outline-offset: 2px !important;
        border-color: white;
        transform: translateX(-50%) scale(1.05);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
      }

      /* Container para organizar múltiplos skip links */
      .skip-links-container {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 10000;
        pointer-events: none;
      }

      .skip-links-container .skip-link {
        pointer-events: auto;
        position: relative;
        top: -100px;
        left: auto;
        transform: none;
        display: inline-block;
        margin: 0 8px;
      }

      .skip-links-container .skip-link:focus,
      .skip-links-container .skip-link:focus-visible {
        top: 20px;
        transform: scale(1.05);
      }

      /* Container para skip links abaixo da navegação */
      .skip-links-container-below-nav {
        position: relative;
        background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        border-bottom: 1px solid #cbd5e1;
        padding: 0;
        margin: 0;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 0;
        overflow: hidden;
        transition: min-height 0.3s ease;
      }

      .skip-links-container-below-nav:focus-within {
        min-height: 60px;
        padding: 8px 16px;
      }

      .skip-links-container-below-nav .skip-link {
        position: relative;
        top: -80px;
        background: ${color};
        color: white;
        padding: 8px 16px;
        margin: 0 4px;
        font-size: 14px;
        border-radius: 6px;
        text-decoration: none;
        font-weight: 600;
        transition: all 0.3s ease;
        opacity: 0;
        transform: translateY(-20px);
        min-width: 140px;
        text-align: center;
        line-height: 1.2;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .skip-links-container-below-nav .skip-link:focus,
      .skip-links-container-below-nav .skip-link:focus-visible {
        top: 0;
        opacity: 1;
        transform: translateY(0);
        outline: 2px solid white !important;
        outline-offset: 2px !important;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        z-index: 10001;
      }

      /* Estilos específicos para diferentes skip links */
      .skip-link[href="#main-content"] {
        background: ${modernChatTheme.colors.unb.primary};
      }

      .skip-link[href="#navigation"] {
        background: ${modernChatTheme.colors.personas.gasnelio.primary};
        left: calc(50% - 120px);
      }

      .skip-link[href="#footer"] {
        background: ${modernChatTheme.colors.personas.ga.primary};
        left: calc(50% + 120px);
      }

      /* Melhorias para responsividade */
      @media (max-width: 768px) {
        .skip-link {
          font-size: 14px;
          padding: 10px 20px;
          min-width: 160px;
        }

        .skip-link[href="#navigation"] {
          left: calc(50% - 100px);
        }

        .skip-link[href="#footer"] {
          left: calc(50% + 100px);
        }
      }

      @media (max-width: 480px) {
        .skip-link {
          position: fixed;
          left: 10px;
          right: 10px;
          transform: none;
          min-width: auto;
          margin-bottom: 8px;
        }

        .skip-link[href="#navigation"] {
          top: -160px;
          left: 10px;
          right: 10px;
        }

        .skip-link[href="#footer"] {
          top: -220px;
          left: 10px;
          right: 10px;
        }

        .skip-link:focus,
        .skip-link:focus-visible {
          transform: none;
        }

        .skip-link[href="#main-content"]:focus {
          top: 20px;
        }

        .skip-link[href="#navigation"]:focus {
          top: 80px;
        }

        .skip-link[href="#footer"]:focus {
          top: 140px;
        }
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
export function SkipLink({ 
  href = '#main-content', 
  children = 'Pular para o conteúdo principal' 
}: {
  href?: string;
  children?: React.ReactNode;
}) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    
    // Encontrar o elemento alvo
    const targetElement = document.querySelector(href);
    
    if (targetElement) {
      // Scroll suave para o elemento
      targetElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
      
      // Focar no elemento se for focável
      if (targetElement instanceof HTMLElement) {
        // Adicionar tabindex temporariamente se necessário
        const originalTabindex = targetElement.getAttribute('tabindex');
        if (!targetElement.hasAttribute('tabindex')) {
          targetElement.setAttribute('tabindex', '-1');
        }
        
        targetElement.focus();
        
        // Remover tabindex temporário após 1 segundo
        if (!originalTabindex) {
          setTimeout(() => {
            targetElement.removeAttribute('tabindex');
          }, 1000);
        }
      }
    }
  };

  return (
    <a 
      href={href} 
      className="skip-link"
      onClick={handleClick}
      role="button"
      aria-label={`${children} - Pressione Enter para navegar`}
    >
      {children}
    </a>
  );
}