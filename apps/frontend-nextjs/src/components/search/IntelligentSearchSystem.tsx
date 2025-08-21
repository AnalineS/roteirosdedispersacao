'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getUnbColors } from '@/config/modernTheme';

// Tipos de público-alvo
export type AudienceType = 'professional' | 'patient' | 'student' | 'general';

// Níveis de complexidade do conteúdo
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

interface SearchFilters {
  audience: AudienceType[];
  complexity: ComplexityLevel[];
  category: string[];
  type: string[];
}

interface IntelligentSearchProps {
  placeholder?: string;
  showFilters?: boolean;
  defaultAudience?: AudienceType;
  onResultSelect?: (result: SearchResult) => void;
  className?: string;
}

// Base de dados simulada - em produção viria de uma API
const searchDatabase: SearchResult[] = [
  // Conteúdo para profissionais
  {
    id: 'pqt-dosagem',
    title: 'Dosagem PQT-U: Protocolo Técnico',
    snippet: 'Rifampicina 600mg + Clofazimina 300mg + Dapsona 100mg. Administração mensal supervisionada.',
    url: '/modules/tratamento#dosagem-pqt',
    type: 'module',
    audience: ['professional'],
    complexity: 'technical',
    category: 'Tratamento',
    relevanceScore: 0,
    tags: ['PQT-U', 'dosagem', 'medicamentos', 'rifampicina', 'clofazimina', 'dapsona']
  },
  {
    id: 'interacoes-medicamentosas',
    title: 'Interações Medicamentosas da PQT-U',
    snippet: 'Rifampicina pode reduzir eficácia de contraceptivos orais, anticoagulantes e antirretrovirais.',
    url: '/resources/interactions',
    type: 'tool',
    audience: ['professional'],
    complexity: 'advanced',
    category: 'Segurança',
    relevanceScore: 0,
    tags: ['interações', 'rifampicina', 'contraceptivos', 'segurança']
  },
  
  // Conteúdo para pacientes
  {
    id: 'vida-com-hanseniase-simples',
    title: 'Como Viver Bem com Hanseníase',
    snippet: 'A hanseníase tem cura! Com o tratamento correto, você pode ter uma vida normal e saudável.',
    url: '/vida-com-hanseniase',
    type: 'page',
    audience: ['patient', 'general'],
    complexity: 'basic',
    category: 'Qualidade de Vida',
    relevanceScore: 0,
    tags: ['cura', 'vida normal', 'esperança', 'tratamento']
  },
  {
    id: 'direitos-paciente',
    title: 'Seus Direitos como Paciente',
    snippet: 'Todo paciente com hanseníase tem direito ao tratamento gratuito pelo SUS e auxílio-doença se necessário.',
    url: '/vida-com-hanseniase#direitos',
    type: 'page',
    audience: ['patient', 'general'],
    complexity: 'basic',
    category: 'Direitos',
    relevanceScore: 0,
    tags: ['direitos', 'SUS', 'auxílio-doença', 'gratuito']
  },
  
  // Conteúdo para estudantes
  {
    id: 'diagnostico-clinico',
    title: 'Diagnóstico Clínico da Hanseníase',
    snippet: 'Critérios diagnósticos: lesões dermatológicas, alterações neurológicas e baciloscopia.',
    url: '/modules/diagnostico',
    type: 'module',
    audience: ['student', 'professional'],
    complexity: 'intermediate',
    category: 'Diagnóstico',
    relevanceScore: 0,
    tags: ['diagnóstico', 'sintomas', 'baciloscopia', 'neurológico']
  },
  
  // Ferramentas
  {
    id: 'calculadora-doses',
    title: 'Calculadora de Doses PQT-U',
    snippet: 'Ferramenta para cálculo automático de doses baseado no peso e idade do paciente.',
    url: '/resources/calculator',
    type: 'tool',
    audience: ['professional', 'student'],
    complexity: 'intermediate',
    category: 'Ferramentas',
    relevanceScore: 0,
    tags: ['calculadora', 'doses', 'peso', 'idade', 'ferramenta']
  },
  
  // Glossário
  {
    id: 'mycobacterium-leprae',
    title: 'Mycobacterium leprae',
    snippet: 'Agente causador da hanseníase. Bacilo álcool-ácido resistente que se multiplica lentamente.',
    url: '/glossario#mycobacterium-leprae',
    type: 'glossary',
    audience: ['student', 'professional'],
    complexity: 'technical',
    category: 'Microbiologia',
    relevanceScore: 0,
    tags: ['mycobacterium', 'bacilo', 'agente causador', 'BAAR']
  }
];

export default function IntelligentSearchSystem({
  placeholder = "Ex: Como tomar PQT-U? Efeitos colaterais? Posso parar o tratamento?",
  showFilters = true,
  defaultAudience = 'general',
  onResultSelect,
  className = ''
}: IntelligentSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    audience: [defaultAudience],
    complexity: [],
    category: [],
    type: []
  });
  const [selectedAudience, setSelectedAudience] = useState<AudienceType>(defaultAudience);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const unbColors = getUnbColors();

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Função de busca inteligente
  const performSearch = useCallback((searchQuery: string, searchFilters: SearchFilters) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    
    // Simular delay de API
    setTimeout(() => {
      const filteredResults = searchDatabase
        .map(item => {
          // Calcular relevância baseada na query
          const titleMatch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
          const snippetMatch = item.snippet.toLowerCase().includes(searchQuery.toLowerCase());
          const tagMatch = item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
          
          let relevanceScore = 0;
          if (titleMatch) relevanceScore += 3;
          if (snippetMatch) relevanceScore += 2;
          if (tagMatch) relevanceScore += 1;
          
          // Bonus por adequação ao público
          if (item.audience.includes(selectedAudience)) {
            relevanceScore += 2;
          }
          
          // Destacar texto encontrado
          const highlightedTitle = titleMatch 
            ? item.title.replace(new RegExp(searchQuery, 'gi'), `<mark>$&</mark>`)
            : item.title;
          
          const highlightedSnippet = snippetMatch
            ? item.snippet.replace(new RegExp(searchQuery, 'gi'), `<mark>$&</mark>`)
            : item.snippet;

          return {
            ...item,
            relevanceScore,
            highlightedText: highlightedTitle + ' | ' + highlightedSnippet
          };
        })
        .filter(item => {
          // Filtrar por relevância mínima
          if (item.relevanceScore === 0) return false;
          
          // Filtrar por público-alvo
          if (searchFilters.audience.length > 0) {
            const hasAudienceMatch = searchFilters.audience.some(aud => 
              item.audience.includes(aud)
            );
            if (!hasAudienceMatch) return false;
          }
          
          // Filtrar por complexidade
          if (searchFilters.complexity.length > 0) {
            if (!searchFilters.complexity.includes(item.complexity)) return false;
          }
          
          return true;
        })
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 8); // Limitar a 8 resultados

      setResults(filteredResults);
      setIsLoading(false);
    }, 300);
  }, [selectedAudience]);

  // Busca em tempo real
  useEffect(() => {
    if (query.length >= 2) {
      performSearch(query, filters);
      setIsOpen(true);
    } else {
      setResults([]);
      setIsLoading(false);
    }
  }, [query, filters, performSearch]);

  // Atualizar filtros quando audiência muda
  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      audience: [selectedAudience]
    }));
  }, [selectedAudience]);

  const handleResultClick = (result: SearchResult) => {
    setIsOpen(false);
    setQuery('');
    
    if (onResultSelect) {
      onResultSelect(result);
    } else {
      router.push(result.url);
    }
  };

  const getAudienceLabel = (audience: AudienceType) => {
    const labels = {
      professional: 'Profissional',
      patient: 'Paciente',
      student: 'Estudante',
      general: 'Geral'
    };
    return labels[audience];
  };

  const getComplexityColor = (complexity: ComplexityLevel) => {
    const colors = {
      basic: '#10b981',      // Verde
      intermediate: '#f59e0b', // Amarelo
      advanced: '#ef4444',    // Vermelho
      technical: '#8b5cf6'    // Roxo
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

  return (
    <div ref={searchRef} className={`intelligent-search ${className}`} style={{ position: 'relative' }}>
      {/* Search Input with Audience Selector */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: 'var(--bg-primary)',
        border: `2px solid ${isOpen ? 'var(--accent-primary)' : 'var(--border-default)'}`,
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: isOpen ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
        transition: 'all 0.3s ease'
      }}>
        {/* Audience Selector */}
        <select
          value={selectedAudience}
          onChange={(e) => setSelectedAudience(e.target.value as AudienceType)}
          style={{
            border: 'none',
            padding: '12px',
            fontSize: '0.9rem',
            fontWeight: '500',
            color: unbColors.primary,
            background: unbColors.alpha.primary,
            outline: 'none',
            minWidth: '120px'
          }}
          aria-label="Selecionar tipo de público"
        >
          <option value="general">Geral</option>
          <option value="patient">Paciente</option>
          <option value="professional">Profissional</option>
          <option value="student">Estudante</option>
        </select>

        {/* Search Input */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          style={{
            flex: 1,
            border: 'none',
            padding: '12px 16px',
            fontSize: '1rem',
            outline: 'none'
          }}
          onFocus={() => {
            if (query.length >= 2) setIsOpen(true);
          }}
        />

        {/* Search Icon */}
        <div style={{ padding: '12px 16px' }}>
          {isLoading ? (
            <div style={{ 
              width: '20px', 
              height: '20px', 
              border: `2px solid ${unbColors.alpha.primary}`,
              borderTop: `2px solid ${unbColors.primary}`,
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={unbColors.primary} strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
          )}
        </div>
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          marginTop: '4px',
          background: 'white',
          border: `1px solid ${unbColors.alpha.primary}`,
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
          zIndex: 1000,
          maxHeight: '400px',
          overflowY: 'auto'
        }}>
          {/* Filter Info */}
          <div style={{
            padding: '12px 16px',
            background: unbColors.alpha.secondary,
            borderBottom: `1px solid ${unbColors.alpha.primary}`,
            fontSize: '0.85rem',
            color: unbColors.neutral
          }}>
            Buscando para: <strong>{getAudienceLabel(selectedAudience)}</strong>
            {query && ` • "${query}"`}
          </div>

          {/* Results */}
          {results.length > 0 ? (
            <div>
              {results.map((result) => (
                <div
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  style={{
                    padding: '16px',
                    borderBottom: `1px solid ${unbColors.alpha.secondary}`,
                    cursor: 'pointer',
                    transition: 'background 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = unbColors.alpha.secondary;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                    <h4 style={{
                      margin: 0,
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: unbColors.primary
                    }} dangerouslySetInnerHTML={{ 
                      __html: result.highlightedText?.split(' | ')[0] || result.title 
                    }} />
                    
                    <span style={{
                      fontSize: '0.7rem',
                      padding: '2px 6px',
                      borderRadius: '12px',
                      background: getComplexityColor(result.complexity),
                      color: 'white',
                      fontWeight: '500',
                      marginLeft: '8px',
                      flexShrink: 0
                    }}>
                      {getComplexityLabel(result.complexity)}
                    </span>
                  </div>
                  
                  <p style={{
                    margin: 0,
                    fontSize: '0.9rem',
                    color: '#6b7280',
                    lineHeight: '1.4'
                  }} dangerouslySetInnerHTML={{ 
                    __html: result.highlightedText?.split(' | ')[1] || result.snippet 
                  }} />
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '8px'
                  }}>
                    <span style={{
                      fontSize: '0.8rem',
                      color: unbColors.primary,
                      fontWeight: '500'
                    }}>
                      {result.category}
                    </span>
                    
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {result.audience.map(aud => (
                        <span key={aud} style={{
                          fontSize: '0.7rem',
                          padding: '2px 4px',
                          borderRadius: '4px',
                          background: aud === selectedAudience ? unbColors.primary : unbColors.alpha.primary,
                          color: aud === selectedAudience ? 'white' : unbColors.primary
                        }}>
                          {getAudienceLabel(aud)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : query.length >= 2 && !isLoading ? (
            <div style={{
              padding: '32px 16px',
              textAlign: 'center',
              color: '#6b7280'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="#6b7280" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
              </div>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>
                Nenhum resultado encontrado para &quot;{query}&quot;
              </p>
              <p style={{ margin: '8px 0 0', fontSize: '0.8rem' }}>
                Tente termos como: dosagem, sintomas, direitos, tratamento
              </p>
            </div>
          ) : null}
        </div>
      )}

      {/* CSS Animation */}
      <style jsx global>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        mark {
          background: #fef08a;
          padding: 2px 4px;
          border-radius: 3px;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}