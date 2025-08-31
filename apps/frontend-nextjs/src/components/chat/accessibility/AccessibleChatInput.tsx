'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Persona } from '@/services/api';
import { modernChatTheme, getPersonaColors } from '@/config/modernTheme';
import { useChatAccessibility, useAccessibleFocus } from './ChatAccessibilityProvider';

const UploadIcon = () => (
  <svg 
    width="20" 
    height="20" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2"
    aria-hidden="true"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14,2 14,8 20,8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10,9 9,9 8,9"/>
  </svg>
);

interface AccessibleChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  persona?: Persona | null;
  personaId?: string;
  isLoading?: boolean;
  isMobile?: boolean;
  placeholder?: string;
  suggestions?: string[];
  onSuggestionClick?: (suggestion: string) => void;
  showSuggestions?: boolean;
  disabled?: boolean;
  maxLength?: number;
  onFileUpload?: (files: FileList) => void;
  acceptedFileTypes?: string;
  maxFileSize?: number;
}

const AccessibleChatInput: React.FC<AccessibleChatInputProps> = ({
  value,
  onChange,
  onSubmit,
  persona,
  personaId = 'gasnelio',
  isLoading = false,
  isMobile = false,
  placeholder,
  suggestions = [],
  onSuggestionClick,
  showSuggestions = false,
  disabled = false,
  maxLength = 2000,
  onFileUpload,
  acceptedFileTypes = ".jpg,.jpeg,.png,.pdf,.txt,.doc,.docx",
  maxFileSize = 10 * 1024 * 1024 // 10MB
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isFocused, setIsFocused] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [characterCount, setCharacterCount] = useState(0);
  const [hasExceededLimit, setHasExceededLimit] = useState(false);

  const { announceMessage, announceSystemStatus } = useChatAccessibility();

  // Register this input for focus management
  useAccessibleFocus(textareaRef as React.RefObject<HTMLElement>, 'input');

  const colors = getPersonaColors(personaId);
  const filteredSuggestions = useMemo(() => 
    showSuggestions ? suggestions.filter(s => s) : [], 
    [showSuggestions, suggestions]
  );

  // Character count management
  useEffect(() => {
    setCharacterCount(value.length);
    setHasExceededLimit(value.length > maxLength);
  }, [value, maxLength]);

  // Auto-resize textarea
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const maxHeight = isMobile ? 120 : 150;
      textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
    }
  }, [isMobile]);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  // Handle input changes with accessibility announcements
  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    
    // Prevent input if over limit
    if (newValue.length > maxLength) {
      if (!hasExceededLimit) {
        announceSystemStatus(`Limite de ${maxLength} caracteres atingido`, 'warning');
      }
      return;
    }

    onChange(newValue);
    setSelectedSuggestionIndex(-1); // Reset suggestion selection on manual input
  }, [onChange, maxLength, hasExceededLimit, announceSystemStatus]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle suggestions navigation
    if (filteredSuggestions.length > 0) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedSuggestionIndex(prev => 
            prev < filteredSuggestions.length - 1 ? prev + 1 : 0
          );
          const nextIndex = selectedSuggestionIndex < filteredSuggestions.length - 1 ? selectedSuggestionIndex + 1 : 0;
          announceMessage(`Sugestão ${nextIndex + 1} de ${filteredSuggestions.length}: ${filteredSuggestions[nextIndex]}`);
          break;
          
        case 'ArrowUp':
          e.preventDefault();
          setSelectedSuggestionIndex(prev => 
            prev > 0 ? prev - 1 : filteredSuggestions.length - 1
          );
          const prevIndex = selectedSuggestionIndex > 0 ? selectedSuggestionIndex - 1 : filteredSuggestions.length - 1;
          announceMessage(`Sugestão ${prevIndex + 1} de ${filteredSuggestions.length}: ${filteredSuggestions[prevIndex]}`);
          break;
          
        case 'Enter':
          if (!e.shiftKey && selectedSuggestionIndex >= 0) {
            e.preventDefault();
            const selectedSuggestion = filteredSuggestions[selectedSuggestionIndex];
            if (onSuggestionClick) {
              onSuggestionClick(selectedSuggestion);
              announceMessage(`Sugestão selecionada: ${selectedSuggestion}`);
            }
            return;
          }
          // Fall through to normal Enter handling
          break;
          
        case 'Escape':
          setSelectedSuggestionIndex(-1);
          announceMessage('Navegação de sugestões cancelada');
          break;
      }
    }

    // Handle form submission
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isLoading && !disabled) {
        onSubmit(e);
        announceMessage('Mensagem enviada');
      } else if (isLoading) {
        announceMessage('Aguarde, mensagem ainda está sendo processada');
      } else if (!value.trim()) {
        announceMessage('Digite uma mensagem antes de enviar');
      }
    }
  }, [filteredSuggestions, selectedSuggestionIndex, onSuggestionClick, value, isLoading, disabled, onSubmit, announceMessage]);

  // Handle form submission
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) {
      announceSystemStatus('Digite uma mensagem antes de enviar', 'warning');
      textareaRef.current?.focus();
      return;
    }
    if (hasExceededLimit) {
      announceSystemStatus(`Mensagem muito longa. Limite: ${maxLength} caracteres`, 'error');
      return;
    }
    if (isLoading) {
      announceSystemStatus('Aguarde a resposta anterior antes de enviar nova mensagem', 'warning');
      return;
    }
    onSubmit(e);
  }, [value, hasExceededLimit, isLoading, maxLength, onSubmit, announceSystemStatus]);

  // Handle suggestion click
  const handleSuggestionClick = useCallback((suggestion: string, index: number) => {
    if (onSuggestionClick) {
      onSuggestionClick(suggestion);
      announceMessage(`Sugestão aplicada: ${suggestion}`);
      setSelectedSuggestionIndex(-1);
      // Focus back to input
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [onSuggestionClick, announceMessage]);

  // Focus handlers
  const handleFocus = useCallback(() => {
    setIsFocused(true);
    if (filteredSuggestions.length > 0) {
      announceMessage(`Campo de mensagem focado. ${filteredSuggestions.length} sugestões disponíveis. Use setas para navegar.`);
    } else {
      announceMessage('Campo de mensagem focado');
    }
  }, [filteredSuggestions.length, announceMessage]);

  const handleBlur = useCallback((e: React.FocusEvent) => {
    // Delay blur to allow suggestion clicks
    setTimeout(() => {
      if (!suggestionsRef.current?.contains(document.activeElement)) {
        setIsFocused(false);
        setSelectedSuggestionIndex(-1);
      }
    }, 200);
  }, []);

  // Handle file upload
  const handleFileUpload = useCallback(() => {
    if (onFileUpload) {
      fileInputRef.current?.click();
      announceMessage('Seletor de arquivo aberto');
    }
  }, [onFileUpload, announceMessage]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !onFileUpload) return;

    // Validar tamanho dos arquivos
    for (const file of Array.from(files)) {
      if (file.size > maxFileSize) {
        const sizeMB = (maxFileSize / (1024 * 1024)).toFixed(1);
        announceSystemStatus(`Arquivo "${file.name}" é muito grande. Limite: ${sizeMB}MB`, 'error');
        return;
      }
    }

    const fileCount = files.length;
    const fileNames = Array.from(files).map(f => f.name).join(', ');
    announceMessage(`${fileCount} arquivo${fileCount > 1 ? 's' : ''} selecionado${fileCount > 1 ? 's' : ''}: ${fileNames}`);
    
    onFileUpload(files);
    // Limpar o input para permitir upload do mesmo arquivo novamente
    e.target.value = '';
  }, [onFileUpload, maxFileSize, announceMessage, announceSystemStatus]);

  // Generate accessible placeholder
  const accessiblePlaceholder = placeholder || 
    (persona ? `Digite sua mensagem para ${persona.name}...` : 'Digite sua mensagem...');

  // Generate input description for screen readers
  const inputDescription = [
    persona ? `Conversando com ${persona.name}` : 'Chat com assistente',
    filteredSuggestions.length > 0 ? `${filteredSuggestions.length} sugestões disponíveis` : '',
    `Limite: ${maxLength} caracteres`,
    onFileUpload ? 'Botão de anexar arquivos disponível' : '',
    'Enter para enviar, Shift+Enter para nova linha'
  ].filter(Boolean).join('. ');

  return (
    <div className="accessible-chat-input-container">
      {/* Input description for screen readers */}
      <div id="input-description" className="sr-only">
        {inputDescription}
      </div>

      {/* Character count and status */}
      <div 
        className="input-status"
        aria-live="polite"
        role="status"
      >
        <span className={`char-count ${hasExceededLimit ? 'error' : characterCount > maxLength * 0.8 ? 'warning' : ''}`}>
          {characterCount}/{maxLength}
        </span>
        {isLoading && (
          <span className="loading-indicator" aria-label="Enviando mensagem">
            <span className="spinner" />
            Enviando...
          </span>
        )}
      </div>

      {/* Suggestions */}
      {filteredSuggestions.length > 0 && (isFocused || selectedSuggestionIndex >= 0) && (
        <div
          ref={suggestionsRef}
          className="suggestions-container"
          role="listbox"
          aria-label={`${filteredSuggestions.length} sugestões de mensagem`}
          aria-activedescendant={selectedSuggestionIndex >= 0 ? `suggestion-${selectedSuggestionIndex}` : undefined}
        >
          <div className="suggestions-header" role="presentation">
            <span>💡 Sugestões ({filteredSuggestions.length})</span>
          </div>
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={index}
              id={`suggestion-${index}`}
              className={`suggestion-item ${index === selectedSuggestionIndex ? 'selected' : ''}`}
              onClick={() => handleSuggestionClick(suggestion, index)}
              role="option"
              aria-selected={index === selectedSuggestionIndex}
              tabIndex={index === selectedSuggestionIndex ? 0 : -1}
              type="button"
            >
              <span className="suggestion-text">{suggestion}</span>
            </button>
          ))}
        </div>
      )}

      {/* Main input form */}
      <form 
        ref={formRef}
        onSubmit={handleSubmit}
        className="input-form"
        role="search"
        aria-label="Enviar mensagem para assistente"
      >
        <div className={`input-wrapper ${isFocused ? 'focused' : ''} ${hasExceededLimit ? 'error' : ''}`}>
          {/* Hidden file input */}
          {onFileUpload && (
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptedFileTypes}
              onChange={handleFileChange}
              multiple
              style={{ display: 'none' }}
              aria-label="Upload de arquivos"
            />
          )}
          
          {/* File upload button */}
          {onFileUpload && (
            <button
              type="button"
              onClick={handleFileUpload}
              disabled={disabled || isLoading}
              className="file-upload-button"
              aria-label="Anexar arquivo"
              title="Anexar arquivo (PDF, imagens, documentos) - Arquivos são processados temporariamente e excluídos automaticamente"
            >
              <UploadIcon />
            </button>
          )}
          
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={accessiblePlaceholder}
            disabled={disabled || isLoading}
            className="message-input"
            rows={1}
            aria-label="Mensagem"
            aria-describedby="input-description"
            aria-invalid={hasExceededLimit}
            aria-required={true}
            data-chat-input="true"
            spellCheck="true"
            autoComplete="off"
            autoCorrect="on"
            autoCapitalize="sentences"
          />
          
          <button
            type="submit"
            disabled={disabled || isLoading || !value.trim() || hasExceededLimit}
            className="send-button"
            aria-label={isLoading ? 'Enviando mensagem...' : 'Enviar mensagem'}
            title={isLoading ? 'Enviando...' : 'Enviar mensagem (Enter)'}
          >
            {isLoading ? (
              <div className="spinner" aria-hidden="true" />
            ) : (
              <svg 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
                aria-hidden="true"
              >
                <path d="m22 2-7 20-4-9-9-4z"/>
                <path d="M22 2 11 13"/>
              </svg>
            )}
          </button>
        </div>
      </form>

      {/* Privacy notice for file uploads */}
      {onFileUpload && isFocused && (
        <div className="privacy-notice">
          🔒 Arquivos anexados são processados temporariamente e excluídos automaticamente após análise
        </div>
      )}

      <style jsx>{`
        .accessible-chat-input-container {
          position: relative;
          background: white;
          border-radius: ${modernChatTheme.borderRadius.lg};
          box-shadow: ${modernChatTheme.shadows.moderate};
          border: 2px solid ${colors.secondary}20;
          transition: all 0.2s ease;
        }

        .accessible-chat-input-container:focus-within {
          border-color: ${colors.primary};
          box-shadow: 0 0 0 3px ${colors.primary}20;
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

        .input-status {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: ${modernChatTheme.spacing.xs} ${modernChatTheme.spacing.md};
          border-bottom: 1px solid ${modernChatTheme.colors.neutral.border};
          background: ${modernChatTheme.colors.background.secondary};
          border-radius: ${modernChatTheme.borderRadius.lg} ${modernChatTheme.borderRadius.lg} 0 0;
        }

        .char-count {
          font-size: ${modernChatTheme.typography.meta.fontSize};
          color: ${modernChatTheme.colors.neutral.textMuted};
          font-weight: 500;
        }

        .char-count.warning {
          color: #F59E0B;
        }

        .char-count.error {
          color: #EF4444;
          font-weight: 600;
        }

        .loading-indicator {
          display: flex;
          align-items: center;
          gap: ${modernChatTheme.spacing.xs};
          font-size: ${modernChatTheme.typography.meta.fontSize};
          color: ${colors.primary};
        }

        .suggestions-container {
          background: white;
          border-bottom: 1px solid ${modernChatTheme.colors.neutral.border};
          max-height: 200px;
          overflow-y: auto;
        }

        .suggestions-header {
          padding: ${modernChatTheme.spacing.sm} ${modernChatTheme.spacing.md};
          background: ${colors.primary}10;
          color: ${colors.primary};
          font-size: ${modernChatTheme.typography.meta.fontSize};
          font-weight: 600;
          border-bottom: 1px solid ${colors.primary}20;
        }

        .suggestion-item {
          width: 100%;
          padding: ${modernChatTheme.spacing.sm} ${modernChatTheme.spacing.md};
          border: none;
          background: white;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s ease;
          border-bottom: 1px solid ${modernChatTheme.colors.neutral.border};
        }

        .suggestion-item:hover,
        .suggestion-item.selected {
          background: ${colors.primary}10;
          color: ${colors.primary};
        }

        .suggestion-item:focus {
          outline: 2px solid ${colors.primary};
          outline-offset: -2px;
          background: ${colors.primary}15;
        }

        .suggestion-text {
          font-size: ${modernChatTheme.typography.body.fontSize};
          line-height: 1.4;
        }

        .input-form {
          margin: 0;
        }

        .input-wrapper {
          display: flex;
          align-items: flex-end;
          padding: ${modernChatTheme.spacing.md};
          gap: ${modernChatTheme.spacing.md};
          min-height: 60px;
        }

        .input-wrapper.error {
          border-top: 2px solid #EF4444;
        }

        .message-input {
          flex: 1;
          min-height: 24px;
          max-height: ${isMobile ? '120px' : '150px'};
          padding: ${modernChatTheme.spacing.sm};
          border: 2px solid ${modernChatTheme.colors.neutral.border};
          border-radius: ${modernChatTheme.borderRadius.md};
          font-size: ${modernChatTheme.typography.body.fontSize};
          line-height: 1.5;
          resize: none;
          background: white;
          color: ${modernChatTheme.colors.neutral.text};
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .message-input:focus {
          outline: none;
          border-color: ${colors.primary};
          box-shadow: 0 0 0 3px ${colors.primary}20;
        }

        .message-input:disabled {
          background: ${modernChatTheme.colors.background.secondary};
          color: ${modernChatTheme.colors.neutral.textMuted};
          cursor: not-allowed;
        }

        .message-input::placeholder {
          color: ${modernChatTheme.colors.neutral.textMuted};
          opacity: 0.8;
        }

        .send-button {
          padding: ${modernChatTheme.spacing.sm};
          background: ${colors.primary};
          border: 2px solid ${colors.primary};
          border-radius: ${modernChatTheme.borderRadius.md};
          color: white;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 44px;
          min-height: 44px;
        }

        .send-button:hover:not(:disabled) {
          background: ${colors.secondary};
          border-color: ${colors.secondary};
          transform: translateY(-1px);
        }

        .send-button:focus {
          outline: 2px solid ${colors.primary};
          outline-offset: 2px;
        }

        .send-button:disabled {
          background: ${modernChatTheme.colors.neutral.textMuted};
          border-color: ${modernChatTheme.colors.neutral.textMuted};
          cursor: not-allowed;
          transform: none;
        }

        .file-upload-button {
          padding: ${modernChatTheme.spacing.sm};
          background: ${modernChatTheme.colors.neutral.border};
          border: 2px solid ${modernChatTheme.colors.neutral.border};
          border-radius: ${modernChatTheme.borderRadius.md};
          color: ${modernChatTheme.colors.neutral.textMuted};
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 44px;
          min-height: 44px;
          margin-right: ${modernChatTheme.spacing.xs};
        }

        .file-upload-button:hover:not(:disabled) {
          background: ${colors.primary}15;
          border-color: ${colors.primary};
          color: ${colors.primary};
          transform: translateY(-1px);
        }

        .file-upload-button:focus {
          outline: 2px solid ${colors.primary};
          outline-offset: 2px;
        }

        .file-upload-button:disabled {
          background: ${modernChatTheme.colors.background.secondary};
          border-color: ${modernChatTheme.colors.neutral.border};
          color: ${modernChatTheme.colors.neutral.textMuted};
          cursor: not-allowed;
          transform: none;
        }

        .privacy-notice {
          position: absolute;
          bottom: -32px;
          left: 0;
          right: 0;
          font-size: ${modernChatTheme.typography.meta.fontSize};
          color: ${modernChatTheme.colors.neutral.textMuted};
          background: ${modernChatTheme.colors.background.secondary};
          padding: ${modernChatTheme.spacing.xs} ${modernChatTheme.spacing.md};
          border-radius: ${modernChatTheme.borderRadius.md};
          border: 1px solid ${modernChatTheme.colors.neutral.border};
          box-shadow: ${modernChatTheme.shadows.subtle};
          animation: slideUpFade 0.2s ease-out;
          z-index: ${modernChatTheme.zIndex.tooltip};
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes slideUpFade {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .message-input,
          .send-button,
          .file-upload-button,
          .suggestion-item {
            border-width: 3px !important;
          }
          
          .accessible-chat-input-container {
            border-width: 3px !important;
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .accessible-chat-input-container,
          .message-input,
          .send-button,
          .file-upload-button,
          .suggestion-item,
          .privacy-notice {
            transition: none !important;
            animation: none !important;
          }
          
          .spinner {
            animation: none !important;
          }
          
          .send-button:hover:not(:disabled),
          .file-upload-button:hover:not(:disabled) {
            transform: none !important;
          }
        }

        /* Mobile optimizations */
        @media (max-width: ${modernChatTheme.breakpoints.mobile}) {
          .input-wrapper {
            padding: ${modernChatTheme.spacing.sm};
          }
          
          .suggestions-container {
            max-height: 150px;
          }
          
          .message-input {
            font-size: 16px; /* Prevent zoom on iOS */
          }
          
          .privacy-notice {
            bottom: -28px;
            font-size: 11px;
            padding: ${modernChatTheme.spacing.xs};
          }
        }
      `}</style>
    </div>
  );
};

export default AccessibleChatInput;