'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Persona } from '@/services/api';

// Sanitização de entrada para prevenir XSS
const sanitizeInput = (input: string): string => {
  return input.replace(/[<>"'&]/g, (match) => {
    const escapeMap: Record<string, string> = {
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '&': '&amp;'
    };
    return escapeMap[match] || match;
  });
};

interface ContextualSuggestionsProps {
  persona: Persona;
  personaId: string;
  currentInput: string;
  onSuggestionClick: (suggestion: string) => void;
  isVisible?: boolean;
  onClose?: () => void;
}

export default function ContextualSuggestions({
  persona,
  personaId,
  currentInput,
  onSuggestionClick,
  isVisible = true,
  onClose
}: ContextualSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);

  // Categorizar sugestões por tipo de pergunta (memoizado para performance)
  const categorizedSuggestions = useMemo(() => ({
    dose_calculation: [
      "Como calcular a dose correta de PQT-U?",
      "Quais fatores considerar na dosagem?",
      "Como ajustar doses para diferentes idades?"
    ],
    adverse_reactions: [
      "Quais são os efeitos colaterais mais comuns?",
      "Como identificar reações adversas graves?",
      "O que fazer quando paciente tem alergia?"
    ],
    clinical_cases: [
      "Como diagnosticar hanseníase multibacilar?",
      "Diferenças entre PB e MB?",
      "Quando iniciar o tratamento?"
    ],
    patient_education: [
      "Como explicar o tratamento ao paciente?",
      "Como motivar adesão ao tratamento?",
      "Orientações para família do paciente"
    ],
    dispensation: [
      "Protocolo correto de dispensação",
      "Como organizar cronograma mensal?",
      "Documentação necessária"
    ]
  }), []);

  // Detectar contexto da pergunta baseado no input atual (memoizado)
  const detectContext = useCallback((input: string): string[] => {
    if (!input || typeof input !== 'string') return [];
    
    const sanitizedInput = sanitizeInput(input);
    const lowercaseInput = sanitizedInput.toLowerCase().trim();
    let contextSuggestions: string[] = [];

    // Palavras-chave para diferentes contextos
    if (lowercaseInput.includes('dose') || lowercaseInput.includes('quantidade') || lowercaseInput.includes('mg')) {
      contextSuggestions.push(...categorizedSuggestions.dose_calculation);
    }
    
    if (lowercaseInput.includes('efeito') || lowercaseInput.includes('reação') || lowercaseInput.includes('alergia')) {
      contextSuggestions.push(...categorizedSuggestions.adverse_reactions);
    }
    
    if (lowercaseInput.includes('diagnos') || lowercaseInput.includes('sintoma') || lowercaseInput.includes('caso')) {
      contextSuggestions.push(...categorizedSuggestions.clinical_cases);
    }
    
    if (lowercaseInput.includes('paciente') || lowercaseInput.includes('família') || lowercaseInput.includes('explicar')) {
      contextSuggestions.push(...categorizedSuggestions.patient_education);
    }
    
    if (lowercaseInput.includes('dispensar') || lowercaseInput.includes('entregar') || lowercaseInput.includes('cronograma')) {
      contextSuggestions.push(...categorizedSuggestions.dispensation);
    }

    // Se não detectou contexto específico, usar perguntas exemplo da persona
    if (contextSuggestions.length === 0) {
      contextSuggestions = persona.example_questions?.slice(0, 4) || [];
    }

    // Remover duplicatas e limitar a 4 sugestões
    return Array.from(new Set(contextSuggestions)).slice(0, 4);
  }, [categorizedSuggestions, persona.example_questions]);

  // Atualizar sugestões baseado no input
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      try {
        if (currentInput.length > 2) {
          const contextSuggestions = detectContext(currentInput);
          setSuggestions(contextSuggestions);
          setShowSuggestions(true);
        } else if (currentInput.length === 0) {
          // Mostrar perguntas exemplo quando não há input
          setSuggestions(persona.example_questions?.slice(0, 4) || []);
          setShowSuggestions(true);
        } else {
          setShowSuggestions(false);
        }
        setSelectedIndex(-1);
      } catch (error) {
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'contextual_suggestions_context_detection_error', {
            event_category: 'medical_chat_interaction',
            event_label: 'context_detection_failed',
            custom_parameters: {
              medical_context: 'contextual_suggestions_system',
              persona_id: personaId,
              input_length: currentInput.length,
              error_type: 'context_detection',
              error_message: error instanceof Error ? error.message : String(error)
            }
          });
        }
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsLoading(false);
      }
    }, 150); // Debounce para melhor performance
    
    return () => clearTimeout(timer);
  }, [currentInput, persona.example_questions, detectContext]);

  // Handlers para navegação por teclado
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % suggestions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev <= 0 ? suggestions.length - 1 : prev - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          onSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose?.();
        break;
    }
  }, [suggestions, selectedIndex, onSuggestionClick, onClose]);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    try {
      onSuggestionClick(suggestion);
    } catch (error) {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'contextual_suggestions_apply_error', {
          event_category: 'medical_chat_interaction',
          event_label: 'suggestion_application_failed',
          custom_parameters: {
            medical_context: 'contextual_suggestions_click',
            persona_id: personaId,
            suggestion_text: suggestion.substring(0, 50),
            error_type: 'suggestion_application',
            error_message: error instanceof Error ? error.message : String(error)
          }
        });
      }
    }
  }, [onSuggestionClick]);

  if (!isVisible || !showSuggestions || (suggestions.length === 0 && !isLoading)) {
    return null;
  }

  return (
    <div 
      role="listbox"
      aria-label="Sugestões de perguntas"
      aria-live="polite"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
      style={{
        position: 'absolute',
        bottom: '100%',
        left: 0,
        right: 0,
        background: 'white',
        border: '1px solid #e0e0e0',
        borderRadius: '12px 12px 0 0',
        boxShadow: '0 -4px 12px rgba(0,0,0,0.1)',
        maxHeight: '200px',
        overflowY: 'auto',
        zIndex: 1000
      }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #f0f0f0',
        background: '#f8f9fa',
        borderRadius: '12px 12px 0 0'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{ fontSize: '1rem' }}>💡</span>
          <span style={{ 
            fontSize: '0.85rem', 
            fontWeight: 'bold', 
            color: '#1976d2' 
          }}>
            {currentInput.length > 2 ? 'Sugestões relacionadas' : 'Perguntas frequentes'}
          </span>
        </div>
      </div>

      {/* Suggestions List */}
      <div style={{ padding: '8px 0' }}>
        {isLoading ? (
          <div style={{
            padding: '16px',
            textAlign: 'center',
            color: '#666',
            fontSize: '0.9rem'
          }}>
            <span>Carregando sugestões...</span>
          </div>
        ) : (
          suggestions.map((suggestion, index) => {
            const isSelected = index === selectedIndex;
            return (
              <button
                key={`${personaId}-suggestion-${index}`}
                role="option"
                aria-selected={isSelected}
                aria-label={`Sugestão ${index + 1} de ${suggestions.length}: ${suggestion}`}
                onClick={() => handleSuggestionClick(suggestion)}
                onMouseEnter={() => setSelectedIndex(index)}
                onMouseLeave={() => setSelectedIndex(-1)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: 'none',
                  background: isSelected ? '#e3f2fd' : 'transparent',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  color: '#333',
                  transition: 'all 0.2s ease',
                  borderBottom: index < suggestions.length - 1 ? '1px solid #f5f5f5' : 'none',
                  outline: isSelected ? '2px solid #1976d2' : 'none',
                  outlineOffset: '-2px'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px'
                }}>
                  <span style={{ 
                    fontSize: '0.8rem', 
                    color: '#1976d2',
                    marginTop: '2px',
                    flexShrink: 0
                  }}>
                    ?
                  </span>
                  <span style={{ 
                    lineHeight: '1.4',
                    wordBreak: 'break-word'
                  }}>
                    {suggestion}
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Footer with persona expertise hint */}
      <div style={{
        padding: '8px 16px',
        background: '#f8f9fa',
        borderTop: '1px solid #f0f0f0',
        fontSize: '0.75rem',
        color: '#666'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>{persona.avatar}</span>
          <span>
            Especialidade: {persona.expertise?.slice(0, 2).join(', ') || persona.target_audience}
          </span>
        </div>
      </div>
    </div>
  );
}