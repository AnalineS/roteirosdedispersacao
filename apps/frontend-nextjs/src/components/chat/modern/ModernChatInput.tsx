'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Persona } from '@/services/api';
import { modernChatTheme, getPersonaColors } from '@/config/modernTheme';
import { motion, AnimatePresence } from 'framer-motion';
import { useMultimodal, useMultimodalHealth, AnalysisResult } from '@/hooks/useMultimodal';
import ImageUploader from '@/components/multimodal/ImageUploader';

// Interface centralizada
import type { ChatAttachment } from '@/types/chat';

interface ModernChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  persona?: Persona | null;
  personaId?: string;
  isLoading?: boolean;
  isMobile?: boolean;
  disabled?: boolean;
  placeholder?: string;
  suggestions?: string[];
  onSuggestionClick?: (suggestion: string) => void;
  showSuggestions?: boolean;
  onHistoryToggle?: () => void;
  showHistory?: boolean;
  onFileUpload?: (files: FileList) => void;
  acceptedFileTypes?: string;
  maxFileSize?: number;
  // Funcionalidades multimodais
  multimodal?: boolean;
  onSendMessage?: (message: string, attachments?: ChatAttachment[]) => void;
  onImageAnalysis?: (result: AnalysisResult) => void;
}

const SendIcon = () => (
  <svg 
    width="20" 
    height="20" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2"
  >
    <path d="m22 2-7 20-4-9-9-4z"/>
    <path d="M22 2 11 13"/>
  </svg>
);

const HistoryIcon = () => (
  <svg 
    width="20" 
    height="20" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2"
  >
    <path d="M3 3v5h5"/>
    <path d="M3.05 13A9 9 0 1 0 6 5.3l-3 3.7"/>
  </svg>
);

const UploadIcon = () => (
  <svg 
    width="20" 
    height="20" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14,2 14,8 20,8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10,9 9,9 8,9"/>
  </svg>
);

const CameraIcon = () => (
  <svg 
    width="20" 
    height="20" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2"
  >
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
);

const AttachmentIcon = () => (
  <svg 
    width="20" 
    height="20" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2"
  >
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
  </svg>
);

const LoadingSpinner = () => (
  <div
    style={{
      width: '16px',
      height: '16px',
      border: '2px solid rgba(255, 255, 255, 0.3)',
      borderTop: '2px solid white',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }}
  />
);

const ContextualSuggestions = ({ 
  suggestions, 
  onSuggestionClick, 
  visible,
  persona,
  personaId 
}: {
  suggestions?: string[];
  onSuggestionClick?: (suggestion: string) => void;
  visible: boolean;
  persona?: Persona | null;
  personaId?: string;
}) => {
  if (!visible || !suggestions?.length || !persona) return null;

  const colors = getPersonaColors(personaId || 'gasnelio');

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '100%',
        left: 0,
        right: 0,
        marginBottom: modernChatTheme.spacing.sm,
        background: 'white',
        border: `1px solid ${modernChatTheme.colors.neutral.border}`,
        borderRadius: modernChatTheme.borderRadius.lg,
        boxShadow: modernChatTheme.shadows.emphasis,
        overflow: 'hidden',
        animation: 'slideUp 200ms ease',
        zIndex: modernChatTheme.zIndex.dropdown
      }}
    >
      <div
        style={{
          padding: modernChatTheme.spacing.sm,
          borderBottom: `1px solid ${modernChatTheme.colors.neutral.divider}`,
          fontSize: modernChatTheme.typography.meta.fontSize,
          color: modernChatTheme.colors.neutral.textMuted,
          fontWeight: '500'
        }}
      >
        💡 Sugestões para {persona.name}
      </div>
      
      {suggestions.slice(0, 3).map((suggestion, index) => (
        <button
          key={index}
          onClick={() => onSuggestionClick?.(suggestion)}
          style={{
            display: 'block',
            width: '100%',
            padding: modernChatTheme.spacing.md,
            border: 'none',
            background: 'transparent',
            textAlign: 'left',
            cursor: 'pointer',
            fontSize: modernChatTheme.typography.message.fontSize,
            lineHeight: modernChatTheme.typography.message.lineHeight,
            color: modernChatTheme.colors.neutral.text,
            transition: modernChatTheme.transitions.fast,
            borderBottom: index < suggestions.length - 1 ? 
              `1px solid ${modernChatTheme.colors.neutral.divider}` : 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = colors.alpha;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
};

export default function ModernChatInput({
  value,
  onChange,
  onSubmit,
  persona,
  personaId = 'gasnelio',
  isLoading = false,
  isMobile = false,
  placeholder,
  suggestions,
  onSuggestionClick,
  showSuggestions = false,
  onHistoryToggle,
  showHistory = false,
  onFileUpload,
  acceptedFileTypes = ".jpg,.jpeg,.png,.pdf,.txt,.doc,.docx",
  maxFileSize = 10 * 1024 * 1024, // 10MB
  // Funcionalidades multimodais
  multimodal = false,
  onSendMessage,
  onImageAnalysis
}: ModernChatInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Estados multimodais
  const [attachedImages, setAttachedImages] = useState<ChatAttachment[]>([]);
  const [showImageUploader, setShowImageUploader] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  
  // Hooks multimodais (somente se multimodal estiver habilitado)
  const multimodalHook = multimodal ? useMultimodal() : null;
  const healthHook = multimodal ? useMultimodalHealth() : null;

  const colors = persona ? getPersonaColors(personaId) : null;

  const getPlaceholder = () => {
    if (placeholder) return placeholder;
    if (!persona) return 'Selecione uma persona para começar a conversar...';
    return `Faça sua pergunta para ${persona.name}...`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!value.trim() && attachedImages.length === 0) || isLoading) return;
    
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
    
    // Se multimodal está habilitado e há callback específico, usar esse
    if (multimodal && onSendMessage) {
      handleMultimodalSubmit();
      onChange(''); // Limpar input
    } else {
      onSubmit(e);
    }
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !onFileUpload) return;

    // Validar tamanho dos arquivos
    for (const file of Array.from(files)) {
      if (file.size > maxFileSize) {
        alert(`Arquivo "${file.name}" é muito grande. Limite: ${maxFileSize / (1024 * 1024)}MB`);
        return;
      }
    }

    onFileUpload(files);
    // Limpar o input para permitir upload do mesmo arquivo novamente
    e.target.value = '';
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    // Delay to allow suggestion clicks
    setTimeout(() => setIsFocused(false), 200);
  };

  // Handlers multimodais
  const handleAnalysisComplete = useCallback((result: AnalysisResult) => {
    setAnalysisResult(result);
    onImageAnalysis?.(result);
    
    // Adicionar resultado como anexo
    setAttachedImages(prev => [...prev, {
      id: result.file_id,
      type: 'image_analysis' as const,
      name: `Análise: ${result.extracted_text.slice(0, 50)}...`,
      url: result.file_id,
      confidence: result.confidence_score,
      extracted_text: result.extracted_text,
      result: result
    }]);

    // Sugerir mensagem baseada no resultado
    if (result.extracted_text && result.medical_indicators.length > 0) {
      const suggestedMessage = `Analisei a imagem e encontrei: ${result.medical_indicators.join(', ')}. Pode me explicar mais sobre isso?`;
      onChange(suggestedMessage);
    }

    setShowImageUploader(false);
  }, [onImageAnalysis, onChange]);

  const handleUploadSuccess = useCallback((fileId: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'modern_chat_upload_success', {
        event_category: 'medical_chat_interaction',
        event_label: 'file_upload_completed',
        custom_parameters: {
          medical_context: 'modern_chat_input_system',
          file_id: fileId,
          upload_type: 'chat_attachment',
          component: 'ModernChatInput'
        }
      });
    }
  }, []);

  const removeAttachment = useCallback((index: number) => {
    setAttachedImages(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleImageUpload = () => {
    if (multimodal) {
      setShowImageUploader(true);
    }
  };

  const handleMultimodalSubmit = useCallback(() => {
    if (multimodal && onSendMessage && (value.trim() || attachedImages.length > 0)) {
      onSendMessage(value, attachedImages);
      setAttachedImages([]);
      setAnalysisResult(null);
    }
  }, [multimodal, onSendMessage, value, attachedImages]);

  // Auto-focus on mobile when persona is selected
  useEffect(() => {
    if (persona && isMobile && inputRef.current) {
      inputRef.current.focus();
    }
  }, [persona, isMobile]);

  const isDisabled = !persona || isLoading;
  const canSubmit = persona && (value.trim() || attachedImages.length > 0) && !isLoading;

  return (
    <div
      className="modern-chat-input"
      style={{
        position: 'relative',
        background: 'white',
        borderTop: `1px solid ${modernChatTheme.colors.neutral.divider}`,
        padding: modernChatTheme.spacing.lg,
        paddingBottom: isMobile ? 
          `max(${modernChatTheme.spacing.lg}, env(safe-area-inset-bottom))` : 
          modernChatTheme.spacing.lg
      }}
    >
      {/* Contextual Suggestions */}
      <ContextualSuggestions
        suggestions={suggestions}
        onSuggestionClick={onSuggestionClick}
        visible={showSuggestions && isFocused && value.length === 0}
        persona={persona}
        personaId={personaId}
      />

      {/* Área de Anexos - somente se multimodal */}
      {multimodal && attachedImages.length > 0 && (
        <div style={{ 
          padding: modernChatTheme.spacing.md,
          borderTop: `1px solid ${modernChatTheme.colors.neutral.divider}`,
          background: modernChatTheme.colors.neutral.surface 
        }}>
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: modernChatTheme.spacing.sm 
          }}>
            {attachedImages.map((attachment, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  position: 'relative',
                  background: 'white',
                  borderRadius: modernChatTheme.borderRadius.md,
                  padding: modernChatTheme.spacing.sm,
                  border: `1px solid ${modernChatTheme.colors.neutral.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: modernChatTheme.spacing.xs,
                  maxWidth: '300px'
                }}
              >
                <div style={{ 
                  width: '32px',
                  height: '32px', 
                  borderRadius: '50%',
                  background: colors?.alpha || modernChatTheme.colors.neutral.surface,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: colors?.primary || modernChatTheme.colors.neutral.text
                }}>
                  {attachment.type === 'image_analysis' ? '🔍' : '📎'}
                </div>
                
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ 
                    fontSize: modernChatTheme.typography.meta.fontSize,
                    fontWeight: '500',
                    color: colors?.primary || modernChatTheme.colors.neutral.text,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {attachment.type === 'image_analysis' ? 'Análise de Imagem' : attachment.name}
                  </div>
                  <div style={{ 
                    fontSize: modernChatTheme.typography.meta.fontSize,
                    color: modernChatTheme.colors.neutral.textMuted,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {attachment.type === 'image_analysis' && attachment.confidence 
                      ? `${Math.round(attachment.confidence * 100)}% confiança`
                      : attachment.name
                    }
                  </div>
                </div>
                
                <button
                  onClick={() => removeAttachment(index)}
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    border: 'none',
                    background: modernChatTheme.colors.neutral.textMuted,
                    color: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px'
                  }}
                  aria-label="Remover anexo"
                >
                  ×
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Modal do Image Uploader */}
      <AnimatePresence>
        {multimodal && showImageUploader && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: modernChatTheme.spacing.lg
            }}
            onClick={() => setShowImageUploader(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'white',
                borderRadius: modernChatTheme.borderRadius.xl,
                overflow: 'hidden',
                maxWidth: '500px',
                width: '100%'
              }}
            >
              <ImageUploader
                onAnalysisComplete={handleAnalysisComplete}
                onUploadSuccess={handleUploadSuccess}
                onClose={() => setShowImageUploader(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="input-form">
        <div
          className="input-wrapper"
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: modernChatTheme.spacing.sm,
            background: isFocused ? 'white' : modernChatTheme.colors.neutral.surface,
            borderRadius: modernChatTheme.borderRadius.xl,
            border: `2px solid ${
              isFocused && colors ? 
                colors.primary : 
                'transparent'
            }`,
            transition: `all ${modernChatTheme.transitions.normal}`,
            boxShadow: isFocused ? 
              modernChatTheme.shadows.moderate : 
              modernChatTheme.shadows.subtle,
            transform: isAnimating ? 'scale(0.98)' : 'scale(1)',
            opacity: isDisabled ? 0.6 : 1
          }}
        >
          {/* Botão de Histórico */}
          {onHistoryToggle && (
            <button
              type="button"
              onClick={onHistoryToggle}
              aria-label={showHistory ? 'Fechar histórico' : 'Mostrar histórico'}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: 'none',
                background: showHistory ? 
                  (colors?.primary || modernChatTheme.colors.personas.gasnelio.primary) : 
                  modernChatTheme.colors.neutral.border,
                color: showHistory ? 'white' : modernChatTheme.colors.neutral.textMuted,
                margin: '4px',
                cursor: 'pointer',
                transition: `all ${modernChatTheme.transitions.normal}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                touchAction: 'manipulation'
              }}
              onMouseEnter={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = `0 2px 8px ${colors?.alpha || 'rgba(0,0,0,0.2)'}`;
                }
              }}
              onMouseLeave={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              <HistoryIcon />
            </button>
          )}

          {/* Botão de Upload de Arquivo */}
          {onFileUpload && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept={acceptedFileTypes}
                onChange={handleFileChange}
                multiple
                style={{ display: 'none' }}
                aria-label="Upload de arquivos"
              />
              <button
                type="button"
                onClick={handleFileUpload}
                aria-label="Anexar arquivo"
                title="Anexar arquivo (PDF, imagens, documentos)"
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  border: 'none',
                  background: modernChatTheme.colors.neutral.border,
                  color: modernChatTheme.colors.neutral.textMuted,
                  margin: '4px',
                  cursor: 'pointer',
                  transition: `all ${modernChatTheme.transitions.normal}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  touchAction: 'manipulation'
                }}
                onMouseEnter={(e) => {
                  if (!isMobile) {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.background = colors?.alpha || 'rgba(0,0,0,0.1)';
                    e.currentTarget.style.color = colors?.primary || modernChatTheme.colors.neutral.text;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isMobile) {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.background = modernChatTheme.colors.neutral.border;
                    e.currentTarget.style.color = modernChatTheme.colors.neutral.textMuted;
                  }
                }}
              >
                <UploadIcon />
              </button>
            </>
          )}

          {/* Botão de Análise de Imagem - somente se multimodal */}
          {multimodal && (
            <button
              type="button"
              onClick={handleImageUpload}
              aria-label="Analisar imagem médica"
              title="Upload e análise de imagem médica"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: 'none',
                background: modernChatTheme.colors.neutral.border,
                color: modernChatTheme.colors.neutral.textMuted,
                margin: '4px',
                cursor: 'pointer',
                transition: `all ${modernChatTheme.transitions.normal}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                touchAction: 'manipulation'
              }}
              onMouseEnter={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.background = colors?.alpha || 'rgba(0,0,0,0.1)';
                  e.currentTarget.style.color = colors?.primary || modernChatTheme.colors.neutral.text;
                }
              }}
              onMouseLeave={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.background = modernChatTheme.colors.neutral.border;
                  e.currentTarget.style.color = modernChatTheme.colors.neutral.textMuted;
                }
              }}
            >
              <CameraIcon />
            </button>
          )}
          
          <input
            ref={inputRef}
            id="chat-input"
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={getPlaceholder()}
            disabled={isDisabled}
            maxLength={1000}
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              padding: `${modernChatTheme.spacing.md} ${modernChatTheme.spacing.lg}`,
              fontSize: '16px', // Prevents zoom on iOS
              lineHeight: modernChatTheme.typography.message.lineHeight,
              outline: 'none',
              minHeight: isMobile ? '48px' : '52px',
              color: modernChatTheme.colors.neutral.text,
              resize: 'none'
            }}
            autoComplete="off"
            autoCapitalize="sentences"
            spellCheck="true"
          />
          
          <button
            type="submit"
            disabled={!canSubmit}
            aria-label="Enviar mensagem"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: 'none',
              background: canSubmit ? 
                (colors?.primary || modernChatTheme.colors.personas.gasnelio.primary) : 
                modernChatTheme.colors.neutral.textMuted,
              color: 'white',
              margin: '4px',
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              transition: `all ${modernChatTheme.transitions.normal}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              transform: canSubmit && !isMobile ? 'scale(1)' : 'scale(0.95)',
              touchAction: 'manipulation'
            }}
            onMouseEnter={(e) => {
              if (canSubmit && !isMobile) {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.boxShadow = `0 2px 8px ${colors?.alpha || 'rgba(0,0,0,0.2)'}`;
              }
            }}
            onMouseLeave={(e) => {
              if (canSubmit) {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
          >
            {isLoading ? <LoadingSpinner /> : <SendIcon />}
          </button>
        </div>

        {/* Character count indicator */}
        {value.length > 800 && (
          <div
            style={{
              textAlign: 'right',
              marginTop: modernChatTheme.spacing.xs,
              fontSize: modernChatTheme.typography.meta.fontSize,
              color: value.length > 950 ? 
                '#F59E0B' : 
                modernChatTheme.colors.neutral.textMuted
            }}
          >
            {value.length}/1000
          </div>
        )}
      </form>

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Ensure input doesn't get hidden behind virtual keyboard */
        @media (max-width: ${modernChatTheme.breakpoints.mobile}) {
          .modern-chat-input {
            position: sticky !important;
            bottom: 0;
            z-index: ${modernChatTheme.zIndex.sticky};
          }
          
          .input-wrapper {
            min-height: 52px !important;
          }
        }

        /* Focus ring for accessibility */
        .input-wrapper:focus-within {
          outline: 2px solid ${colors?.alpha || 'rgba(59, 130, 246, 0.3)'};
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
}