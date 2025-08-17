'use client';

import React, { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export function ThemeToggle() {
  const { themeMode, setThemeMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const options = [
    { value: 'light' as const, label: 'Claro', icon: '☀️' },
    { value: 'dark' as const, label: 'Escuro', icon: '🌙' },
    { value: 'system' as const, label: 'Sistema', icon: '💻' }
  ];

  const currentOption = options.find(opt => opt.value === themeMode) || options[2];

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          borderRadius: '8px',
          border: '1px solid #e2e8f0',
          background: 'white',
          cursor: 'pointer',
          fontSize: '0.875rem',
          fontWeight: '500',
          transition: 'all 0.2s ease',
          minWidth: '120px'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#003366';
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#e2e8f0';
          e.currentTarget.style.boxShadow = 'none';
        }}
        aria-label="Alternar tema"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span>{currentOption.icon}</span>
        <span>{currentOption.label}</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          style={{
            marginLeft: 'auto',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease'
          }}
        >
          <path
            d="M3 4.5L6 7.5L9 4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop para fechar ao clicar fora */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999
            }}
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu dropdown */}
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 0.5rem)',
              right: 0,
              background: 'white',
              borderRadius: '8px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              border: '1px solid #e2e8f0',
              padding: '0.5rem',
              zIndex: 1000,
              minWidth: '150px'
            }}
            role="menu"
          >
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setThemeMode(option.value);
                  setIsOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: themeMode === option.value ? '#f0f9ff' : 'transparent',
                  color: themeMode === option.value ? '#003366' : '#374151',
                  fontSize: '0.875rem',
                  fontWeight: themeMode === option.value ? '600' : '400',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => {
                  if (themeMode !== option.value) {
                    e.currentTarget.style.background = '#f8fafc';
                  }
                }}
                onMouseLeave={(e) => {
                  if (themeMode !== option.value) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
                role="menuitem"
                aria-current={themeMode === option.value ? 'true' : 'false'}
              >
                <span style={{ fontSize: '1.125rem' }}>{option.icon}</span>
                <span>{option.label}</span>
                {themeMode === option.value && (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    style={{ marginLeft: 'auto' }}
                  >
                    <path
                      d="M13.5 4.5L6 12L2.5 8.5"
                      stroke="#003366"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            ))}
            
            <div
              style={{
                marginTop: '0.5rem',
                paddingTop: '0.5rem',
                borderTop: '1px solid #e2e8f0',
                fontSize: '0.75rem',
                color: '#64748b',
                padding: '0.5rem 0.75rem'
              }}
            >
              {themeMode === 'system' && (
                <div>
                  Seguindo o tema do sistema
                </div>
              )}
              {themeMode === 'light' && (
                <div>
                  Tema claro ativado
                </div>
              )}
              {themeMode === 'dark' && (
                <div>
                  Tema escuro ativado
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}