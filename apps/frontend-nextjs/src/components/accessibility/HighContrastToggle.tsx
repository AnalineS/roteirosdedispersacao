'use client';

import React from 'react';
import { useAccessibility } from '@/contexts/AccessibilityContext';

interface HighContrastToggleProps {
  variant?: 'button' | 'switch';
  className?: string;
  showLabel?: boolean;
}

export default function HighContrastToggle({ 
  variant = 'button', 
  className = '',
  showLabel = true 
}: HighContrastToggleProps) {
  const { highContrast, setHighContrast } = useAccessibility();

  const handleToggle = () => {
    setHighContrast(!highContrast);
  };

  if (variant === 'switch') {
    return (
      <div className={`contrast-toggle-container ${className}`}>
        {showLabel && (
          <label 
            htmlFor="high-contrast-switch"
            className="contrast-toggle-label"
          >
            Alto Contraste
          </label>
        )}
        
        <button
          id="high-contrast-switch"
          role="switch"
          aria-checked={highContrast}
          onClick={handleToggle}
          className={`contrast-switch ${highContrast ? 'active' : ''}`}
          aria-label={`${highContrast ? 'Desativar' : 'Ativar'} alto contraste`}
          aria-describedby="contrast-description"
        >
          <span className="contrast-switch-slider" />
        </button>
        
        <span
          id="contrast-description"
          className="sr-only"
        >
          {highContrast ? 'Alto contraste ativado' : 'Alto contraste desativado'}. 
          Melhora a legibilidade para pessoas com baixa visão.
        </span>
        
        <style jsx>{`
          .contrast-toggle-container {
            display: flex;
            align-items: center;
            gap: var(--spacing-md);
          }
          
          .contrast-toggle-label {
            font-size: var(--font-size-sm);
            font-weight: var(--font-weight-medium);
            color: var(--color-text-primary);
            cursor: pointer;
          }
          
          .contrast-switch {
            position: relative;
            width: 48px;
            height: 28px;
            border-radius: 14px;
            border: 2px solid var(--color-border-default);
            background-color: var(--color-bg-secondary);
            cursor: pointer;
            transition: all var(--transition-base);
            outline: none;
            overflow: hidden;
          }
          
          .contrast-switch:hover {
            border-color: var(--color-primary-500);
          }
          
          .contrast-switch:focus-visible {
            outline: 2px solid var(--color-primary-500);
            outline-offset: 2px;
          }
          
          .contrast-switch.active {
            background-color: var(--color-primary-500);
            border-color: var(--color-primary-500);
          }
          
          .contrast-switch-slider {
            position: absolute;
            top: 2px;
            left: 2px;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background-color: var(--color-white);
            transition: transform var(--transition-base);
            box-shadow: var(--shadow-sm);
          }
          
          .contrast-switch.active .contrast-switch-slider {
            transform: translateX(20px);
          }
          
          .sr-only {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border: 0;
          }
          
          /* High contrast mode styles */
          [data-contrast="high"] .contrast-switch {
            border-width: 3px;
            border-color: #000000;
          }
          
          [data-contrast="high"] .contrast-switch.active {
            background-color: #000000;
            border-color: #000000;
          }
          
          [data-contrast="high"] .contrast-switch-slider {
            background-color: #ffffff;
            border: 2px solid #000000;
          }
          
          /* Reduced motion */
          @media (prefers-reduced-motion: reduce) {
            .contrast-switch,
            .contrast-switch-slider {
              transition: none;
            }
          }
        `}</style>
      </div>
    );
  }

  return (
    <button
      onClick={handleToggle}
      className={`contrast-toggle-button ${highContrast ? 'active' : ''} ${className}`}
      aria-pressed={highContrast}
      aria-label={`${highContrast ? 'Desativar' : 'Ativar'} modo de alto contraste`}
      title={`${highContrast ? 'Desativar' : 'Ativar'} alto contraste`}
    >
      <span className="contrast-icon" aria-hidden="true">
        {highContrast ? '🔆' : '🔅'}
      </span>
      {showLabel && (
        <span className="contrast-label">
          {highContrast ? 'Alto Contraste' : 'Contraste Normal'}
        </span>
      )}
      
      <style jsx>{`
        .contrast-toggle-button {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-xs) var(--spacing-md);
          border: 2px solid var(--color-border-default);
          border-radius: var(--radius-md);
          background-color: var(--color-bg-primary);
          color: var(--color-text-primary);
          cursor: pointer;
          transition: all var(--transition-base);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          font-family: inherit;
          outline: none;
          min-height: var(--touch-target-min);
          min-width: fit-content;
        }
        
        .contrast-toggle-button:hover {
          border-color: var(--color-primary-500);
          background-color: var(--color-bg-secondary);
        }
        
        .contrast-toggle-button:focus-visible {
          outline: 2px solid var(--color-primary-500);
          outline-offset: 2px;
        }
        
        .contrast-toggle-button.active {
          background-color: var(--color-primary-500);
          color: var(--color-white);
          border-color: var(--color-primary-500);
        }
        
        .contrast-icon {
          font-size: var(--font-size-lg);
          line-height: 1;
        }
        
        .contrast-label {
          white-space: nowrap;
        }
        
        /* High contrast mode styles */
        [data-contrast="high"] .contrast-toggle-button {
          border-width: 3px;
          border-color: #000000;
          background-color: #ffffff;
          color: #000000;
        }
        
        [data-contrast="high"] .contrast-toggle-button.active {
          background-color: #000000;
          color: #ffffff;
          border-color: #000000;
        }
        
        [data-contrast="high"] .contrast-toggle-button:hover {
          background-color: #f0f0f0;
        }
        
        [data-contrast="high"] .contrast-toggle-button.active:hover {
          background-color: #333333;
        }
        
        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .contrast-toggle-button {
            transition: none;
          }
        }
        
        /* Mobile adjustments */
        @media (max-width: 768px) {
          .contrast-toggle-button {
            padding: var(--spacing-sm) var(--spacing-md);
          }
        }
      `}</style>
    </button>
  );
}