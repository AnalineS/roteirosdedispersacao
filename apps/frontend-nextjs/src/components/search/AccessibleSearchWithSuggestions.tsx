'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { safeLocalStorage, isClientSide } from '@/hooks/useClientStorage';
import { useOptimizedEffect, useAutoCleanup } from '@/hooks/useEffectOptimizer';
import { useRouter } from 'next/navigation';
import { getUnbColors } from '@/config/modernTheme';
import { useChatAccessibility } from '@/components/chat/accessibility/ChatAccessibilityProvider';

// SSR-safe DOMPurify wrapper
const sanitizeHtml = (html: string): string => {
  if (!isClientSide()) return html; // No sanitization on server, Next.js will handle it

  try {
    const DOMPurify = require('dompurify');
    return DOMPurify.sanitize(html);
  } catch (error) {
    return html; // Fallback to unsanitized if DOMPurify fails
  }
};

// Speech Recognition API type definitions
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechGrammarList {
  readonly length: number;
  item(index: number): SpeechGrammar;
  addFromURI(src: string, weight?: number): void;
  addFromString(string: string, weight?: number): void;
}

interface SpeechGrammar {
  src: string;
  weight: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  grammars: SpeechGrammarList;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  serviceURI: string;
  onstart?: (() => void) | null;
  onresult?: ((event: SpeechRecognitionEvent) => void) | null;
  onerror?: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend?: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
  addEventListener(type: 'result', listener: (event: SpeechRecognitionEvent) => void): void;
  addEventListener(type: 'error', listener: (event: SpeechRecognitionErrorEvent) => void): void;
  addEventListener(type: 'end', listener: () => void): void;
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
}

// Import unified analytics types
import '@/types/analytics';

declare global {
  interface Window {
    webkitSpeechRecognition: new () => SpeechRecognition;
    SpeechRecognition: new () => SpeechRecognition;
  }
}

// Re-export types from existing search system
export type AudienceType = 'professional' | 'patient' | 'student' | 'general';
export type ComplexityLevel = 'basic' | 'intermediate' | 'advanced' | 'technical';

interface SearchResult {
  id: string;
  title: string;
  snippet: string;
  url: string;
  type: 'page' | 'module' | 'tool' | 'faq' | 'glossary';
  audience: AudienceType[];
  complexity: ComplexityLevel;
  category: string;
  relevanceScore: number;
  highlightedText?: string;
  tags: string[];
}

interface SearchSuggestion {
  id: string;
  text: string;
  category: string;
  popularity: number;
  audience: AudienceType[];
}

interface AccessibleSearchProps {
  placeholder?: string;
  showFilters?: boolean;
  defaultAudience?: AudienceType;
  onResultSelect?: (result: SearchResult) => void;
  onSuggestionSelect?: (suggestion: string) => void;
  className?: string;
  maxResults?: number;
  enableVoiceSearch?: boolean;
  showRecentSearches?: boolean;
}

// Enhanced search database with more comprehensive content
const searchDatabase: SearchResult[] = [
  // Professional content
  {
    id: 'pqt-dosagem',
    title: 'Dosagem PQT-U: Protocolo Técnico',
    snippet: 'Rifampicina 600mg + Clofazimina 300mg + Dapsona 100mg. Administração mensal supervisionada com acompanhamento farmacêutico.',
    url: '/modules/tratamento#dosagem-pqt',
    type: 'module',
    audience: ['professional'],
    complexity: 'technical',
    category: 'Tratamento',
    relevanceScore: 0,
    tags: ['PQT-U', 'dosagem', 'medicamentos', 'rifampicina', 'clofazimina', 'dapsona', 'protocolo', 'supervisionada']
  },
  {
    id: 'efeitos-colaterais-manejo',
    title: 'Manejo de Efeitos Colaterais da PQT-U',
    snippet: 'Identificação precoce e tratamento de reações adversas: hepatotoxicidade, coloração da pele e neuropatia.',
    url: '/modules/efeitos-colaterais',
    type: 'module',
    audience: ['professional', 'student'],
    complexity: 'advanced',
    category: 'Segurança',
    relevanceScore: 0,
    tags: ['efeitos colaterais', 'reações adversas', 'hepatotoxicidade', 'neuropatia', 'coloração', 'pele']
  },
  {
    id: 'interacoes-medicamentosas',
    title: 'Interações Medicamentosas da PQT-U',
    snippet: 'Rifampicina induz enzimas hepáticas, reduzindo eficácia de contraceptivos orais, anticoagulantes e antirretrovirais.',
    url: '/resources/interactions',
    type: 'tool',
    audience: ['professional'],
    complexity: 'advanced',
    category: 'Segurança',
    relevanceScore: 0,
    tags: ['interações', 'rifampicina', 'contraceptivos', 'anticoagulantes', 'antirretrovirais', 'enzimas hepáticas']
  },
  
  // Patient-focused content
  {
    id: 'vida-com-hanseniase',
    title: 'Como Viver Bem com Hanseníase',
    snippet: 'A hanseníase tem cura! Com o tratamento correto você pode ter uma vida normal, trabalhar, estudar e conviver em família.',
    url: '/vida-com-hanseniase',
    type: 'page',
    audience: ['patient', 'general'],
    complexity: 'basic',
    category: 'Qualidade de Vida',
    relevanceScore: 0,
    tags: ['cura', 'vida normal', 'esperança', 'tratamento', 'família', 'trabalho', 'preconceito']
  },
  {
    id: 'como-tomar-remedios',
    title: 'Como Tomar os Medicamentos Corretamente',
    snippet: 'Instruções simples para tomar a PQT-U: horários, com ou sem comida, o que fazer se esquecer uma dose.',
    url: '/vida-com-hanseniase#medicamentos',
    type: 'page',
    audience: ['patient', 'general'],
    complexity: 'basic',
    category: 'Medicamentos',
    relevanceScore: 0,
    tags: ['como tomar', 'medicamentos', 'horários', 'comida', 'esquecer dose', 'instruções simples']
  },
  {
    id: 'direitos-paciente',
    title: 'Seus Direitos como Paciente',
    snippet: 'Todo paciente com hanseníase tem direito ao tratamento gratuito pelo SUS, auxílio-doença e proteção contra discriminação.',
    url: '/vida-com-hanseniase#direitos',
    type: 'page',
    audience: ['patient', 'general'],
    complexity: 'basic',
    category: 'Direitos',
    relevanceScore: 0,
    tags: ['direitos', 'SUS', 'auxílio-doença', 'gratuito', 'discriminação', 'proteção legal']
  },
  
  // Student content
  {
    id: 'diagnostico-clinico',
    title: 'Diagnóstico Clínico da Hanseníase',
    snippet: 'Critérios diagnósticos essenciais: lesões dermatológicas características, alterações neurológicas e baciloscopia.',
    url: '/modules/diagnostico',
    type: 'module',
    audience: ['student', 'professional'],
    complexity: 'intermediate',
    category: 'Diagnóstico',
    relevanceScore: 0,
    tags: ['diagnóstico', 'sintomas', 'baciloscopia', 'neurológico', 'lesões', 'critérios']
  },
  {
    id: 'classificacao-operacional',
    title: 'Classificação Operacional MB/PB',
    snippet: 'Diferenciação entre hanseníase multibacilar (MB) e paucibacilar (PB) para escolha do esquema terapêutico adequado.',
    url: '/modules/classificacao',
    type: 'module',
    audience: ['student', 'professional'],
    complexity: 'intermediate',
    category: 'Classificação',
    relevanceScore: 0,
    tags: ['classificação', 'multibacilar', 'paucibacilar', 'MB', 'PB', 'esquema terapêutico']
  },

  // Tools and resources
  {
    id: 'calculadora-doses',
    title: 'Calculadora de Doses PQT-U',
    snippet: 'Ferramenta interativa para cálculo automático de doses baseado no peso, idade e classificação do paciente.',
    url: '/resources/calculator',
    type: 'tool',
    audience: ['professional', 'student'],
    complexity: 'intermediate',
    category: 'Ferramentas',
    relevanceScore: 0,
    tags: ['calculadora', 'doses', 'peso', 'idade', 'ferramenta', 'automático', 'PQT-U']
  },
  {
    id: 'cartao-tratamento',
    title: 'Cartão de Tratamento Digital',
    snippet: 'Acompanhe suas doses, datas de consulta e progresso do tratamento de forma digital e segura.',
    url: '/resources/treatment-card',
    type: 'tool',
    audience: ['patient', 'general'],
    complexity: 'basic',
    category: 'Ferramentas',
    relevanceScore: 0,
    tags: ['cartão', 'tratamento', 'digital', 'doses', 'consultas', 'progresso', 'acompanhamento']
  },

  // FAQ content
  {
    id: 'posso-parar-tratamento',
    title: 'Posso Parar o Tratamento se me Sentir Bem?',
    snippet: 'Nunca! É fundamental completar todo o período de 6 meses mesmo se os sintomas melhorarem. A interrupção pode causar resistência.',
    url: '/faq#parar-tratamento',
    type: 'faq',
    audience: ['patient', 'general'],
    complexity: 'basic',
    category: 'FAQ',
    relevanceScore: 0,
    tags: ['parar tratamento', 'sentir bem', 'completar', '6 meses', 'resistência', 'interrupção']
  },
  {
    id: 'hanseniase-contagiosa',
    title: 'A Hanseníase é Contagiosa?',
    snippet: 'Após 15 dias de tratamento, a pessoa não transmite mais a doença. O contágio é difícil e requer contato prolongado.',
    url: '/faq#contagio',
    type: 'faq',
    audience: ['patient', 'general'],
    complexity: 'basic',
    category: 'FAQ',
    relevanceScore: 0,
    tags: ['contagiosa', 'transmissão', '15 dias', 'tratamento', 'contato prolongado', 'difícil']
  }
];

// Auto-suggestion database
const suggestionDatabase: SearchSuggestion[] = [
  // Most common searches by patients
  { id: 's1', text: 'Como tomar os remédios da hanseníase', category: 'Medicamentos', popularity: 95, audience: ['patient', 'general'] },
  { id: 's2', text: 'Posso parar o tratamento se me sentir bem', category: 'Tratamento', popularity: 90, audience: ['patient', 'general'] },
  { id: 's3', text: 'Hanseníase tem cura', category: 'Informações Gerais', popularity: 88, audience: ['patient', 'general'] },
  { id: 's4', text: 'Efeitos colaterais dos medicamentos', category: 'Medicamentos', popularity: 85, audience: ['patient', 'general'] },
  { id: 's5', text: 'A hanseníase é contagiosa', category: 'Informações Gerais', popularity: 82, audience: ['patient', 'general'] },
  { id: 's6', text: 'Direitos do paciente com hanseníase', category: 'Direitos', popularity: 78, audience: ['patient', 'general'] },
  { id: 's7', text: 'Posso trabalhar durante o tratamento', category: 'Qualidade de Vida', popularity: 75, audience: ['patient', 'general'] },
  { id: 's8', text: 'O que fazer se esquecer de tomar o remédio', category: 'Medicamentos', popularity: 72, audience: ['patient', 'general'] },
  
  // Professional searches
  { id: 's9', text: 'Dosagem PQT-U multibacilar', category: 'Protocolo', popularity: 70, audience: ['professional'] },
  { id: 's10', text: 'Interações medicamentosas rifampicina', category: 'Segurança', popularity: 68, audience: ['professional'] },
  { id: 's11', text: 'Manejo de reações adversas', category: 'Segurança', popularity: 65, audience: ['professional'] },
  { id: 's12', text: 'Critérios diagnósticos hanseníase', category: 'Diagnóstico', popularity: 62, audience: ['professional', 'student'] },
  { id: 's13', text: 'Classificação operacional MB PB', category: 'Classificação', popularity: 60, audience: ['professional', 'student'] },
  { id: 's14', text: 'Poliquimioterapia esquema adulto', category: 'Protocolo', popularity: 58, audience: ['professional'] },
  
  // Student searches
  { id: 's15', text: 'Mycobacterium leprae características', category: 'Microbiologia', popularity: 55, audience: ['student', 'professional'] },
  { id: 's16', text: 'Formas clínicas da hanseníase', category: 'Classificação', popularity: 52, audience: ['student', 'professional'] },
  { id: 's17', text: 'Teste de Mitsuda significado', category: 'Diagnóstico', popularity: 50, audience: ['student', 'professional'] },
  { id: 's18', text: 'Neuropatias na hanseníase', category: 'Complicações', popularity: 48, audience: ['student', 'professional'] }
];

export default function AccessibleSearchWithSuggestions({
  placeholder = "Ex: Como tomar PQT-U? Efeitos colaterais? Posso parar o tratamento?",
  showFilters = true,
  defaultAudience = 'general',
  onResultSelect,
  onSuggestionSelect,
  className = '',
  maxResults = 8,
  enableVoiceSearch = false,
  showRecentSearches = true
}: AccessibleSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [selectedAudience, setSelectedAudience] = useState<AudienceType>(defaultAudience);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const unbColors = getUnbColors();
  const { announceMessage, announceSystemStatus } = useChatAccessibility();

  // Load recent searches from localStorage - otimizado
  useOptimizedEffect(() => {
    if (showRecentSearches && typeof window !== 'undefined') {
      const saved = safeLocalStorage()?.getItem('recentSearches');
      if (saved) {
        try {
          setRecentSearches(JSON.parse(saved));
        } catch (error) {
          if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'search_local_storage_error', {
              event_category: 'medical_search_functionality',
              event_label: 'recent_searches_load_failed',
              custom_parameters: {
                medical_context: 'accessible_search_storage',
                storage_type: 'recent_searches',
                error_type: 'json_parse_failure',
                error_message: error instanceof Error ? error.message : String(error)
              }
            });
          }
        }
      }
    }
  }, [showRecentSearches]);

  // Save recent searches to localStorage
  const saveRecentSearch = useCallback((searchTerm: string) => {
    if (!showRecentSearches || typeof window === 'undefined') return;
    
    setRecentSearches(prev => {
      const updated = [searchTerm, ...prev.filter(s => s !== searchTerm)].slice(0, 5);
      safeLocalStorage()?.setItem('recentSearches', JSON.stringify(updated));
      return updated;
    });
  }, [showRecentSearches]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-suggestions generator
  const generateSuggestions = useCallback((searchQuery: string, audience: AudienceType) => {
    if (searchQuery.length < 1) {
      // Show popular suggestions for the audience
      return suggestionDatabase
        .filter(s => s.audience.includes(audience))
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, 6);
    }

    // Filter suggestions based on query
    return suggestionDatabase
      .filter(s => {
        const matchesQuery = s.text.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesAudience = s.audience.includes(audience);
        return matchesQuery && matchesAudience;
      })
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 6);
  }, []);

  // Intelligent search function
  const performSearch = useCallback((searchQuery: string, audience: AudienceType) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    announceMessage('Buscando conteúdo...');
    
    setTimeout(() => {
      const filteredResults = searchDatabase
        .map(item => {
          const queryLower = searchQuery.toLowerCase();
          const titleMatch = item.title.toLowerCase().includes(queryLower);
          const snippetMatch = item.snippet.toLowerCase().includes(queryLower);
          const tagMatch = item.tags.some(tag => tag.toLowerCase().includes(queryLower));
          const categoryMatch = item.category.toLowerCase().includes(queryLower);
          
          let relevanceScore = 0;
          if (titleMatch) relevanceScore += 4;
          if (categoryMatch) relevanceScore += 3;
          if (snippetMatch) relevanceScore += 2;
          if (tagMatch) relevanceScore += 1;
          
          // Audience bonus
          if (item.audience.includes(audience)) {
            relevanceScore += 3;
          }
          
          // Exact match bonus
          if (item.title.toLowerCase() === queryLower) {
            relevanceScore += 5;
          }
          
          // Highlight text
          const highlightRegex = new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
          const highlightedTitle = titleMatch 
            ? item.title.replace(highlightRegex, '<mark>$&</mark>')
            : item.title;
          
          const highlightedSnippet = snippetMatch
            ? item.snippet.replace(highlightRegex, '<mark>$&</mark>')
            : item.snippet;

          return {
            ...item,
            relevanceScore,
            highlightedText: highlightedTitle + ' | ' + highlightedSnippet
          };
        })
        .filter(item => item.relevanceScore > 0)
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, maxResults);

      setResults(filteredResults);
      setIsLoading(false);
      
      if (filteredResults.length > 0) {
        announceMessage(`${filteredResults.length} resultado${filteredResults.length > 1 ? 's' : ''} encontrado${filteredResults.length > 1 ? 's' : ''}`);
      } else {
        announceMessage('Nenhum resultado encontrado');
      }
    }, 300);
  }, [maxResults, announceMessage]);

  // Update suggestions and results when query changes
  useEffect(() => {
    const newSuggestions = generateSuggestions(query, selectedAudience);
    setSuggestions(newSuggestions);

    if (query.length >= 2) {
      performSearch(query, selectedAudience);
      setShowSuggestions(false);
    } else {
      setResults([]);
      setShowSuggestions(true);
      setIsLoading(false);
    }
  }, [query, selectedAudience, performSearch, generateSuggestions]);

  // Handle suggestion selection
  const handleSuggestionClick = useCallback((suggestion: SearchSuggestion) => {
    setQuery(suggestion.text);
    setSelectedIndex(-1);
    setShowSuggestions(false);
    performSearch(suggestion.text, selectedAudience);
    saveRecentSearch(suggestion.text);
    announceMessage(`Pesquisando por: ${suggestion.text}`);
    
    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion.text);
    }
  }, [selectedAudience, performSearch, saveRecentSearch, announceMessage, onSuggestionSelect]);

  // Handle result selection
  const handleResultClick = useCallback((result: SearchResult) => {
    setIsOpen(false);
    setQuery('');
    setSelectedIndex(-1);
    saveRecentSearch(result.title);
    announceMessage(`Navegando para: ${result.title}`);
    
    if (onResultSelect) {
      onResultSelect(result);
    } else {
      router.push(result.url);
    }
  }, [saveRecentSearch, announceMessage, onResultSelect, router]);

  // Handle search execution
  const handleSearch = useCallback(() => {
    if (!query.trim()) return;
    
    setShowSuggestions(false);
    performSearch(query, selectedAudience);
    saveRecentSearch(query);
    setIsOpen(true);
  }, [query, selectedAudience, performSearch, saveRecentSearch]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const totalItems = showSuggestions ? suggestions.length : results.length;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => {
          const newIndex = prev < totalItems - 1 ? prev + 1 : 0;
          const item = showSuggestions ? suggestions[newIndex] : results[newIndex];
          if (item) {
            const description = showSuggestions 
              ? `Sugestão ${newIndex + 1}: ${(item as SearchSuggestion).text || (item as SearchResult).title}`
              : `Resultado ${newIndex + 1}: ${(item as SearchResult).title}`;
            announceMessage(description);
          }
          return newIndex;
        });
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => {
          const newIndex = prev > 0 ? prev - 1 : totalItems - 1;
          const item = showSuggestions ? suggestions[newIndex] : results[newIndex];
          if (item) {
            const description = showSuggestions 
              ? `Sugestão ${newIndex + 1}: ${(item as SearchSuggestion).text || (item as SearchResult).title}`
              : `Resultado ${newIndex + 1}: ${(item as SearchResult).title}`;
            announceMessage(description);
          }
          return newIndex;
        });
        break;
        
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          if (showSuggestions && suggestions[selectedIndex]) {
            handleSuggestionClick(suggestions[selectedIndex]);
          } else if (!showSuggestions && results[selectedIndex]) {
            handleResultClick(results[selectedIndex]);
          }
        } else if (query.trim()) {
          handleSearch();
        }
        break;
        
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        announceMessage('Busca cancelada');
        break;
        
      case 'Tab':
        if (isOpen) {
          e.preventDefault();
          setSelectedIndex(prev => prev < totalItems - 1 ? prev + 1 : 0);
        }
        break;
    }
  }, [showSuggestions, suggestions, results, selectedIndex, query, announceMessage, isOpen, handleSuggestionClick, handleResultClick, handleSearch]);

  // Voice search functionality (Web Speech API)
  const handleVoiceSearch = useCallback(() => {
    if (!enableVoiceSearch || !('webkitSpeechRecognition' in window)) {
      announceSystemStatus('Busca por voz não disponível neste navegador', 'warning');
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsVoiceRecording(true);
      announceMessage('Escutando... Fale sua pergunta');
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      setIsVoiceRecording(false);
      announceMessage(`Voz reconhecida: ${transcript}`);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setIsVoiceRecording(false);
      announceSystemStatus('Erro no reconhecimento de voz', 'error');
    };

    recognition.onend = () => {
      setIsVoiceRecording(false);
    };

    recognition.start();
  }, [enableVoiceSearch, announceMessage, announceSystemStatus]);

  // Get audience label
  const getAudienceLabel = (audience: AudienceType) => {
    const labels = {
      professional: 'Profissional',
      patient: 'Paciente', 
      student: 'Estudante',
      general: 'Geral'
    };
    return labels[audience];
  };

  // Get complexity styling
  const getComplexityColor = (complexity: ComplexityLevel) => {
    const colors = {
      basic: '#10b981',
      intermediate: '#f59e0b',
      advanced: '#ef4444', 
      technical: '#8b5cf6'
    };
    return colors[complexity];
  };

  const getComplexityLabel = (complexity: ComplexityLevel) => {
    const labels = {
      basic: 'Básico',
      intermediate: 'Intermediário',
      advanced: 'Avançado', 
      technical: 'Técnico'
    };
    return labels[complexity];
  };

  const combinedItems = showSuggestions ? suggestions : results;

  return (
    <div 
      ref={searchRef} 
      className={`accessible-search ${className}`} 
      role="search"
      aria-label="Busca inteligente de conteúdo"
    >
      {/* Screen reader instructions */}
      <div className="sr-only" id="search-instructions">
        Use as setas para navegar pelos resultados, Enter para selecionar, Escape para fechar
      </div>

      {/* Main search container */}
      <div className="search-container">
        {/* Audience selector */}
        {showFilters && (
          <select
            value={selectedAudience}
            onChange={(e) => {
              const newAudience = e.target.value as AudienceType;
              setSelectedAudience(newAudience);
              announceMessage(`Filtrando para: ${getAudienceLabel(newAudience)}`);
            }}
            className="audience-selector"
            aria-label="Tipo de público-alvo"
          >
            <option value="general">👥 Geral</option>
            <option value="patient">🏥 Paciente</option>
            <option value="professional">👨‍⚕️ Profissional</option>
            <option value="student">🎓 Estudante</option>
          </select>
        )}

        {/* Search input */}
        <div className="input-wrapper">
          <input
            ref={inputRef}
            type="text"
            role="combobox"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              setIsOpen(true);
              announceMessage('Campo de busca focado. Digite para buscar ou use as setas para navegar pelas sugestões.');
            }}
            placeholder={placeholder}
            className="search-input"
            aria-describedby="search-instructions"
            aria-expanded={isOpen}
            aria-controls="search-results"
            aria-haspopup="listbox"
            aria-owns={isOpen ? "search-results" : undefined}
            aria-activedescendant={selectedIndex >= 0 ? `search-item-${selectedIndex}` : undefined}
            autoComplete="off"
            spellCheck="true"
          />

          {/* Voice search button */}
          {enableVoiceSearch && 'webkitSpeechRecognition' in window && (
            <button
              type="button"
              onClick={handleVoiceSearch}
              disabled={isVoiceRecording}
              className="voice-button"
              aria-label={isVoiceRecording ? 'Gravando...' : 'Busca por voz'}
              title="Clique para usar busca por voz"
            >
              {isVoiceRecording ? (
                <div className="recording-indicator" />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/>
                  <line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
              )}
            </button>
          )}

          {/* Search/Loading icon */}
          <div className="search-icon">
            {isLoading ? (
              <div className="loading-spinner" aria-label="Buscando..." />
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
            )}
          </div>
        </div>
      </div>

      {/* Search results dropdown */}
      {isOpen && (
        <div 
          ref={resultsRef}
          className="search-dropdown"
          role="listbox"
          aria-label={showSuggestions ? "Sugestões de busca" : "Resultados da busca"}
          id="search-results"
        >
          {/* Header info */}
          <div className="dropdown-header" role="presentation">
            <span className="header-text">
              {showSuggestions 
                ? `💡 ${suggestions.length > 0 ? 'Sugestões populares' : 'Sugestões'} - ${getAudienceLabel(selectedAudience)}`
                : `🔍 ${results.length} resultado${results.length !== 1 ? 's' : ''} para "${query}"`
              }
            </span>
          </div>

          {/* Results/Suggestions list */}
          <div className="dropdown-content">
            {combinedItems.length > 0 ? (
              combinedItems.map((item, index) => {
                const isResult = 'url' in item;
                const isSelected = index === selectedIndex;
                
                return (
                  <div
                    key={item.id}
                    id={`search-item-${index}`}
                    className={`search-item ${isSelected ? 'selected' : ''} ${isResult ? 'result' : 'suggestion'}`}
                    onClick={() => isResult ? handleResultClick(item as SearchResult) : handleSuggestionClick(item as SearchSuggestion)}
                    role="option"
                    aria-selected={isSelected}
                    tabIndex={-1}
                  >
                    {/* Suggestion item */}
                    {!isResult && (
                      <div className="suggestion-content">
                        <div className="suggestion-icon">💡</div>
                        <div className="suggestion-text">
                          <div className="suggestion-title">{(item as SearchSuggestion).text}</div>
                          <div className="suggestion-category">{(item as SearchSuggestion).category}</div>
                        </div>
                        <div className="suggestion-popularity">
                          {Math.round((item as SearchSuggestion).popularity)}%
                        </div>
                      </div>
                    )}

                    {/* Result item */}
                    {isResult && (
                      <div className="result-content">
                        <div className="result-header">
                          <h4 
                            className="result-title"
                            dangerouslySetInnerHTML={{
                              __html: sanitizeHtml((item as SearchResult).highlightedText?.split(' | ')[0] || (item as SearchResult).title)
                            }} 
                          />
                          <span 
                            className="complexity-badge"
                            style={{ backgroundColor: getComplexityColor((item as SearchResult).complexity) }}
                          >
                            {getComplexityLabel((item as SearchResult).complexity)}
                          </span>
                        </div>
                        
                        <p 
                          className="result-snippet"
                          dangerouslySetInnerHTML={{
                            __html: sanitizeHtml((item as SearchResult).highlightedText?.split(' | ')[1] || (item as SearchResult).snippet)
                          }} 
                        />
                        
                        <div className="result-footer">
                          <span className="result-category">{(item as SearchResult).category}</span>
                          <div className="result-audience">
                            {(item as SearchResult).audience.map(aud => (
                              <span key={aud} className={`audience-tag ${aud === selectedAudience ? 'active' : ''}`}>
                                {getAudienceLabel(aud)}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : query.length >= 2 && !isLoading ? (
              <div className="no-results">
                <div className="no-results-icon">🔍</div>
                <p className="no-results-text">
                  Nenhum resultado encontrado para &quot;{query}&quot;
                </p>
                <p className="no-results-suggestions">
                  Tente: dosagem, sintomas, direitos, tratamento, efeitos colaterais
                </p>
              </div>
            ) : null}

            {/* Recent searches */}
            {showSuggestions && query.length === 0 && recentSearches.length > 0 && (
              <div className="recent-searches">
                <div className="recent-header">🕒 Buscas recentes</div>
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    className="recent-item"
                    onClick={() => setQuery(search)}
                    type="button"
                  >
                    <span className="recent-text">{search}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9,18 15,12 9,6"/>
                    </svg>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
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

        .accessible-search {
          position: relative;
          width: 100%;
          max-width: 600px;
        }

        .search-container {
          display: flex;
          align-items: center;
          background: white;
          border: 2px solid ${isOpen ? unbColors.primary : '#e5e7eb'};
          border-radius: 12px;
          overflow: hidden;
          box-shadow: ${isOpen ? '0 4px 20px rgba(0, 0, 0, 0.15)' : '0 2px 8px rgba(0, 0, 0, 0.1)'};
          transition: all 0.3s ease;
        }

        .audience-selector {
          border: none;
          padding: 12px;
          font-size: 0.9rem;
          font-weight: 500;
          color: ${unbColors.primary};
          background: ${unbColors.alpha.primary};
          outline: none;
          min-width: 140px;
          cursor: pointer;
        }

        .audience-selector:focus {
          outline: 2px solid ${unbColors.primary};
          outline-offset: -2px;
        }

        .input-wrapper {
          display: flex;
          align-items: center;
          flex: 1;
          position: relative;
        }

        .search-input {
          flex: 1;
          border: none;
          padding: 12px 16px;
          font-size: 1rem;
          outline: none;
          background: transparent;
        }

        .search-input::placeholder {
          color: #9ca3af;
        }

        .search-input:focus {
          outline: none;
        }

        .voice-button {
          padding: 8px;
          border: none;
          background: none;
          color: ${unbColors.primary};
          cursor: pointer;
          border-radius: 6px;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .voice-button:hover:not(:disabled) {
          background: ${unbColors.alpha.primary};
          color: ${unbColors.primary};
        }

        .voice-button:focus {
          outline: 2px solid ${unbColors.primary};
          outline-offset: 2px;
        }

        .voice-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .recording-indicator {
          width: 20px;
          height: 20px;
          background: #ef4444;
          border-radius: 50%;
          animation: pulse 1s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .search-icon {
          padding: 12px 16px;
          color: ${unbColors.primary};
          display: flex;
          align-items: center;
        }

        .loading-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid ${unbColors.alpha.primary};
          border-top: 2px solid ${unbColors.primary};
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .search-dropdown {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          margin-top: 4px;
          background: white;
          border: 1px solid ${unbColors.alpha.primary};
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
          z-index: 1000;
          max-height: 500px;
          overflow: hidden;
        }

        .dropdown-header {
          padding: 12px 16px;
          background: ${unbColors.alpha.secondary};
          border-bottom: 1px solid ${unbColors.alpha.primary};
          font-size: 0.85rem;
          font-weight: 600;
          color: ${unbColors.primary};
        }

        .dropdown-content {
          max-height: 450px;
          overflow-y: auto;
        }

        .search-item {
          padding: 12px 16px;
          border-bottom: 1px solid #f3f4f6;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .search-item:hover,
        .search-item.selected {
          background: ${unbColors.alpha.secondary};
        }

        .search-item:focus {
          outline: 2px solid ${unbColors.primary};
          outline-offset: -2px;
        }

        .suggestion-content {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .suggestion-icon {
          font-size: 1.2rem;
          flex-shrink: 0;
        }

        .suggestion-text {
          flex: 1;
        }

        .suggestion-title {
          font-weight: 500;
          color: #1f2937;
          margin-bottom: 2px;
        }

        .suggestion-category {
          font-size: 0.8rem;
          color: ${unbColors.primary};
        }

        .suggestion-popularity {
          font-size: 0.8rem;
          color: #6b7280;
          font-weight: 500;
        }

        .result-content {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .result-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 12px;
        }

        .result-title {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
          color: ${unbColors.primary};
          flex: 1;
          line-height: 1.4;
        }

        .complexity-badge {
          font-size: 0.7rem;
          padding: 2px 6px;
          border-radius: 12px;
          color: white;
          font-weight: 500;
          flex-shrink: 0;
        }

        .result-snippet {
          margin: 0;
          font-size: 0.9rem;
          color: #6b7280;
          line-height: 1.4;
        }

        .result-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .result-category {
          font-size: 0.8rem;
          color: ${unbColors.primary};
          font-weight: 500;
        }

        .result-audience {
          display: flex;
          gap: 4px;
        }

        .audience-tag {
          font-size: 0.7rem;
          padding: 2px 4px;
          border-radius: 4px;
          background: ${unbColors.alpha.primary};
          color: ${unbColors.primary};
        }

        .audience-tag.active {
          background: ${unbColors.primary};
          color: white;
        }

        .no-results {
          padding: 32px 16px;
          text-align: center;
          color: #6b7280;
        }

        .no-results-icon {
          font-size: 2rem;
          margin-bottom: 8px;
        }

        .no-results-text {
          margin: 0 0 8px 0;
          font-weight: 500;
        }

        .no-results-suggestions {
          margin: 0;
          font-size: 0.8rem;
          opacity: 0.8;
        }

        .recent-searches {
          border-top: 1px solid #f3f4f6;
          padding: 8px 0;
        }

        .recent-header {
          padding: 8px 16px;
          font-size: 0.8rem;
          font-weight: 500;
          color: ${unbColors.primary};
        }

        .recent-item {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 16px;
          border: none;
          background: none;
          cursor: pointer;
          transition: background 0.2s ease;
          text-align: left;
        }

        .recent-item:hover {
          background: ${unbColors.alpha.secondary};
        }

        .recent-text {
          font-size: 0.9rem;
          color: #4b5563;
        }

        /* Global highlight styles */
        .search-dropdown :global(mark) {
          background: #fef08a;
          padding: 2px 4px;
          border-radius: 3px;
          font-weight: 600;
        }

        /* High contrast mode */
        @media (prefers-contrast: high) {
          .search-container {
            border-width: 3px;
          }
          
          .search-item:hover,
          .search-item.selected {
            outline: 3px solid currentColor;
          }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .search-container,
          .search-item,
          .voice-button,
          .loading-spinner {
            transition: none !important;
            animation: none !important;
          }
        }

        /* Mobile optimization */
        @media (max-width: 768px) {
          .search-input {
            font-size: 16px; /* Prevent zoom on iOS */
          }
          
          .dropdown-content {
            max-height: 300px;
          }
          
          .audience-selector {
            min-width: 100px;
            font-size: 0.8rem;
          }
        }
      `}</style>
    </div>
  );
}