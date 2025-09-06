'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';
import { getUnbColors } from '@/config/modernTheme';
import { AlertIcon } from '@/components/icons/FlatOutlineIcons';
import { useHapticFeedback } from '@/utils/hapticFeedback';
import { SearchLoadingState } from '@/components/ui/LoadingStates';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  href: string;
  category: string;
  relevance: number;
}

// Lista de páginas para indexar (excluindo offline e páginas internas)
const INDEXED_PAGES = [
  { href: '/', title: 'Início', description: 'Página inicial do sistema', category: 'Principal' },
  { href: '/modules', title: 'Módulos', description: 'Módulos educacionais', category: 'Educacional' },
  { href: '/modules/hanseniase', title: 'Sobre a Hanseníase', description: 'Conceitos fundamentais', category: 'Módulos' },
  { href: '/modules/diagnostico', title: 'Diagnóstico', description: 'Sintomas e exames', category: 'Módulos' },
  { href: '/modules/tratamento', title: 'Tratamento PQT-U', description: 'Poliquimioterapia única', category: 'Módulos' },
  { href: '/modules/vida-com-doenca', title: 'Vida com a Doença', description: 'Apoio e qualidade de vida', category: 'Módulos' },
  { href: '/modules/roteiro-dispensacao', title: 'Roteiro de Dispensação', description: 'Protocolo completo', category: 'Módulos' },
  { href: '/dashboard', title: 'Dashboard', description: 'Visão geral do progresso', category: 'Educacional' },
  { href: '/progress', title: 'Progresso', description: 'Acompanhe seu aprendizado', category: 'Educacional' },
  { href: '/resources', title: 'Recursos', description: 'Ferramentas práticas', category: 'Educacional' },
  { href: '/resources/calculator', title: 'Calculadora', description: 'Cálculo de doses PQT-U', category: 'Recursos' },
  { href: '/resources/checklist', title: 'Checklist', description: 'Lista de verificação', category: 'Recursos' },
  { href: '/glossario', title: 'Glossário', description: 'Terminologia técnica', category: 'Recursos' },
  { href: '/downloads', title: 'Downloads', description: 'Materiais complementares', category: 'Recursos' },
  { href: '/sobre-a-tese', title: 'Sobre a Tese', description: 'Pesquisa e metodologia', category: 'Projeto' },
  { href: '/sobre', title: 'Conheça a Equipe', description: 'Equipe responsável', category: 'Projeto' },
  { href: '/metodologia', title: 'Metodologia', description: 'Métodos científicos', category: 'Projeto' },
  { href: '/chat', title: 'Chat', description: 'Conversar com assistentes', category: 'Interação' },
  { href: '/cadastro', title: 'Cadastro', description: 'Criar uma conta', category: 'Conta' },
  { href: '/login', title: 'Login', description: 'Acessar sua conta', category: 'Conta' },
  { href: '/profile', title: 'Perfil', description: 'Gerenciar perfil', category: 'Conta' },
  { href: '/vida-com-hanseniase', title: 'Vida com Hanseníase', description: 'Apoio e orientações', category: 'Apoio' },
  { href: '/sitemap', title: 'Mapa do Site', description: 'Navegação completa', category: 'Navegação' },
  { href: '/privacidade', title: 'Privacidade', description: 'Política de privacidade', category: 'Políticas' },
  { href: '/termos', title: 'Termos', description: 'Termos de uso', category: 'Políticas' },
  { href: '/conformidade', title: 'Conformidade', description: 'Conformidade e políticas', category: 'Políticas' },
  { href: '/etica', title: 'Ética', description: 'Ética e responsabilidade', category: 'Políticas' }
];

interface SearchBarProps {
  className?: string;
  placeholder?: string;
  isMobile?: boolean;
  onClose?: () => void;
}

export default function SearchBar({ 
  className = '', 
  placeholder = 'Buscar no site...', 
  isMobile = false,
  onClose 
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const router = useRouter();
  const pathname = usePathname();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const unbColors = getUnbColors();
  const { info, success } = useHapticFeedback();

  // Função de busca fuzzy
  const searchPages = useCallback((searchQuery: string): SearchResult[] => {
    if (!searchQuery || searchQuery.length < 2) return [];
    
    const normalizedQuery = searchQuery.toLowerCase().trim();
    const words = normalizedQuery.split(/\s+/);
    
    return INDEXED_PAGES
      .filter(page => {
        const searchText = `${page.title} ${page.description} ${page.category}`.toLowerCase();
        return words.every(word => searchText.includes(word));
      })
      .map(page => {
        // Calcular relevância
        const titleMatch = page.title.toLowerCase().includes(normalizedQuery) ? 3 : 0;
        const exactMatch = page.title.toLowerCase() === normalizedQuery ? 5 : 0;
        const descMatch = page.description.toLowerCase().includes(normalizedQuery) ? 1 : 0;
        const relevance = titleMatch + exactMatch + descMatch;
        
        return {
          id: page.href,
          title: page.title,
          description: page.description,
          href: page.href,
          category: page.category,
          relevance
        };
      })
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 8); // Limitar a 8 resultados
  }, []);

  // Executar busca quando query mudar
  useEffect(() => {
    if (debouncedQuery && debouncedQuery.length >= 2) {
      setIsSearching(true);
      
      // Simular delay de busca para mostrar loading state
      const searchTimeout = setTimeout(() => {
        const searchResults = searchPages(debouncedQuery);
        setResults(searchResults);
        setIsOpen(searchResults.length > 0);
        setSelectedIndex(-1);
        setIsSearching(false);
        
        // Haptic feedback quando resultados são encontrados
        if (searchResults.length > 0) {
          success();
        }
      }, 200);
      
      return () => clearTimeout(searchTimeout);
    } else {
      setResults([]);
      setIsOpen(false);
      setIsSearching(false);
      setSelectedIndex(-1);
    }
  }, [debouncedQuery, searchPages, success]);

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

  // Navegação por teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : results.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleNavigate(results[selectedIndex].href);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setQuery('');
        break;
    }
  };

  const handleNavigate = (href: string) => {
    // Haptic feedback para navegação
    info();
    router.push(href);
    setQuery('');
    setIsOpen(false);
    if (onClose) onClose();
  };

  // Highlight de termos encontrados
  const highlightMatch = (text: string, query: string) => {
    if (!query) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, i) => 
      regex.test(part) ? (
        <mark key={i} style={{ 
          background: 'rgba(59, 130, 246, 0.2)', 
          color: unbColors.primary,
          fontWeight: '600',
          padding: '0 2px',
          borderRadius: '2px'
        }}>
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div 
      ref={searchRef}
      className={`search-bar-container ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: isMobile ? '100%' : '600px',
        margin: '0 auto'
      }}
    >
      {/* Campo de busca */}
      <div style={{
        position: 'relative',
        width: '100%'
      }}>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label="Buscar no site"
          aria-haspopup="listbox"
          aria-controls="search-results"
          style={{
            width: '100%',
            padding: isMobile ? '10px 40px 10px 40px' : '12px 48px 12px 48px',
            fontSize: isMobile ? '14px' : '15px',
            border: `2px solid ${isOpen ? unbColors.primary : 'rgba(226, 232, 240, 0.8)'}`,
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.95)',
            color: unbColors.neutral,
            outline: 'none',
            transition: 'all 0.2s ease',
            boxShadow: isOpen ? '0 4px 20px rgba(0, 0, 0, 0.1)' : '0 2px 8px rgba(0, 0, 0, 0.05)'
          }}
          onFocus={(e) => {
            e.currentTarget.style.border = `2px solid ${unbColors.primary}`;
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
          }}
          onBlur={(e) => {
            if (!isOpen) {
              e.currentTarget.style.border = '2px solid rgba(226, 232, 240, 0.8)';
              e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)';
            }
          }}
        />
        
        {/* Ícone de busca */}
        <svg 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke={unbColors.primary}
          strokeWidth="2"
          style={{
            position: 'absolute',
            left: isMobile ? '12px' : '16px',
            top: '50%',
            transform: 'translateY(-50%)',
            opacity: 0.6
          }}
        >
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>

        {/* Botão limpar (quando há texto) */}
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            style={{
              position: 'absolute',
              right: isMobile ? '12px' : '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              transition: 'background 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 0, 0, 0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
            }}
            aria-label="Limpar busca"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={unbColors.neutral} strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>

      {/* Loading state da busca */}
      {isSearching && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            background: 'white',
            border: `1px solid ${unbColors.alpha.primary}`,
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
            zIndex: 1002,
            padding: '12px'
          }}
        >
          <SearchLoadingState query={query} withHaptic={false} />
        </div>
      )}

      {/* Resultados da busca */}
      {!isSearching && isOpen && results.length > 0 && (
        <div
          id="search-results"
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            background: 'white',
            border: `1px solid ${unbColors.alpha.primary}`,
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
            maxHeight: '400px',
            overflowY: 'auto',
            zIndex: 1002,
            animation: 'slideDown 0.2s ease'
          }}
        >
          {results.map((result, index) => (
            <button
              key={result.id}
              onClick={() => handleNavigate(result.href)}
              onMouseEnter={() => setSelectedIndex(index)}
              role="option"
              aria-selected={selectedIndex === index}
              style={{
                width: '100%',
                padding: '12px 16px',
                background: selectedIndex === index ? unbColors.alpha.secondary : 'transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                borderBottom: index < results.length - 1 ? '1px solid rgba(226, 232, 240, 0.5)' : 'none',
                transition: 'background 0.15s ease'
              }}
              onMouseOver={(e) => {
                if (selectedIndex !== index) {
                  e.currentTarget.style.background = unbColors.alpha.secondary;
                }
              }}
              onMouseLeave={(e) => {
                if (selectedIndex !== index) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px' 
              }}>
                <span style={{
                  fontSize: '11px',
                  color: unbColors.primary,
                  background: unbColors.alpha.primary,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  {result.category}
                </span>
                <span style={{
                  fontSize: '14px',
                  color: unbColors.neutral,
                  fontWeight: '600'
                }}>
                  {highlightMatch(result.title, query)}
                </span>
              </div>
              <div style={{
                fontSize: '12px',
                color: unbColors.neutral,
                opacity: 0.7,
                lineHeight: '1.4'
              }}>
                {highlightMatch(result.description, query)}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Animação */}
      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}