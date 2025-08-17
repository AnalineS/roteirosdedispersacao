'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export function ThemeToggle() {
  const { themeMode, setThemeMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const options = [
    { value: 'light' as const, label: 'Claro', icon: '☀️' },
    { value: 'dark' as const, label: 'Escuro', icon: '🌙' },
    { value: 'system' as const, label: 'Sistema', icon: '💻' }
  ];

  const currentOption = options.find(opt => opt.value === themeMode) || options[2];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Intelligent positioning to avoid viewport overflow
  useEffect(() => {
    if (isOpen && dropdownRef.current && buttonRef.current) {
      const dropdown = dropdownRef.current;
      const button = buttonRef.current;
      const buttonRect = button.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Reset positioning
      dropdown.style.top = '';
      dropdown.style.bottom = '';
      dropdown.style.left = '';
      dropdown.style.right = '';
      
      // Check if dropdown would overflow horizontally
      const dropdownWidth = dropdown.offsetWidth;
      const spaceOnRight = viewportWidth - buttonRect.right;
      const spaceOnLeft = buttonRect.left;
      
      if (spaceOnRight < dropdownWidth && spaceOnLeft > dropdownWidth) {
        // Position on the left
        dropdown.style.right = '0';
      } else {
        // Default position on the right
        dropdown.style.left = '0';
      }
      
      // Check if dropdown would overflow vertically
      const dropdownHeight = dropdown.offsetHeight;
      const spaceBelow = viewportHeight - buttonRect.bottom - 8;
      const spaceAbove = buttonRect.top - 8;
      
      if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
        // Position above the button
        dropdown.style.bottom = 'calc(100% + 0.5rem)';
      } else {
        // Default position below the button
        dropdown.style.top = 'calc(100% + 0.5rem)';
      }
    }
  }, [isOpen]);

  return (
    <div className="theme-toggle-container" ref={dropdownRef}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="theme-toggle-button"
        aria-label="Alternar tema"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className="theme-toggle-icon">{currentOption.icon}</span>
        <span className="theme-toggle-label">{currentOption.label}</span>
        <svg
          className={`theme-toggle-arrow ${isOpen ? 'rotated' : ''}`}
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
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
        <div className="theme-toggle-dropdown" role="menu">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                setThemeMode(option.value);
                setIsOpen(false);
              }}
              className={`theme-toggle-option ${themeMode === option.value ? 'active' : ''}`}
              role="menuitem"
              aria-current={themeMode === option.value ? 'true' : 'false'}
            >
              <span className="theme-toggle-option-icon">{option.icon}</span>
              <span className="theme-toggle-option-label">{option.label}</span>
              {themeMode === option.value && (
                <svg
                  className="theme-toggle-check"
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                >
                  <path
                    d="M13.5 4.5L6 12L2.5 8.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          ))}
          
          <div className="theme-toggle-status">
            {themeMode === 'system' && 'Seguindo o tema do sistema'}
            {themeMode === 'light' && 'Tema claro ativado'}
            {themeMode === 'dark' && 'Tema escuro ativado'}
          </div>
        </div>
      )}
    </div>
  );
}