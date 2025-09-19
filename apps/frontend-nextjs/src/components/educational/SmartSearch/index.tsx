'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useGlossary } from '@/components/educational/Glossary';
import Glossary from '@/components/educational/Glossary';
import Link from 'next/link';

interface SearchResult {
  id: string;
  title: string;
  content: string;
  type: 'module' | 'glossary' | 'resource' | 'chat' | 'page';
  category: string;
  relevance: number;
  path: string;
  icon: string;
  description?: string;
  tags?: string[];
}

interface SmartSearchProps {
  placeholder?: string;
  variant?: 'full' | 'compact' | 'inline';
  onResultSelect?: (result: SearchResult) => void;
  enableGlossaryAutocomplete?: boolean;
  showGlossaryIntegration?: boolean;
  className?: string;
}

interface AutocompleteItem {
  id: string;
  text: string;
  type: 'term' | 'suggestion' | 'recent';
  description?: string;
  category?: string;
}

export default function SmartSearch({ 
  placeholder = "Buscar conteúdos, termos técnicos, módulos...",
  variant = 'full',
  onResultSelect,
  enableGlossaryAutocomplete = true,
  showGlossaryIntegration = true,
  className = ''
}: SmartSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteItems, setAutocompleteItems] = useState<AutocompleteItem[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showGlossary, setShowGlossary] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const { terms, findTerm, getDefinition } = useGlossary();

  // Base de dados de conteúdo para busca
  const searchDatabase: SearchResult[] = useMemo(() => [
    // Módulos Educacionais
    {
      id: 'hanseniase-intro',
      title: 'Introdução à Hanseníase',
      content: 'Conceitos básicos sobre a doença, transmissão, sintomas iniciais, histórico da hanseníase no Brasil',
      type: 'module',
      category: 'Educacional',
      relevance: 0,
      path: '/modules/hanseniase',
      icon: '🔬',
      description: 'Módulo básico sobre fundamentos da hanseníase',
      tags: ['básico', 'introdução', 'hanseníase', 'doença', 'sintomas']
    },
    {
      id: 'diagnostico-clinical',
      title: 'Diagnóstico Clínico',
      content: 'Sinais e sintomas, exames complementares, diagnóstico diferencial, classificação operacional',
      type: 'module',
      category: 'Educacional',
      relevance: 0,
      path: '/modules/diagnostico',
      icon: '🩺',
      description: 'Técnicas e métodos para diagnóstico da hanseníase',
      tags: ['diagnóstico', 'exames', 'sintomas', 'classificação']
    },
    {
      id: 'pqt-treatment',
      title: 'Tratamento PQT-U',
      content: 'Poliquimioterapia única, rifampicina, dapsona, clofazimina, doses, duração, acompanhamento',
      type: 'module',
      category: 'Educacional',
      relevance: 0,
      path: '/modules/tratamento',
      icon: '💊',
      description: 'Protocolo completo de poliquimioterapia única',
      tags: ['PQT-U', 'tratamento', 'medicamentos', 'doses']
    },
    {
      id: 'dispensacao-pharmaceutical',
      title: 'Roteiro de Dispensação',
      content: 'Procedimentos farmacêuticos, orientações ao paciente, adesão ao tratamento, dispensação mensal',
      type: 'module',
      category: 'Educacional',
      relevance: 0,
      path: '/modules/dispensacao',
      icon: '📋',
      description: 'Guia prático para dispensação farmacêutica',
      tags: ['dispensação', 'farmácia', 'orientações', 'paciente']
    },

    // Recursos Práticos
    {
      id: 'dose-calculator',
      title: 'Calculadora de Doses',
      content: 'Cálculo automático de doses PQT-U baseado em peso, idade e classificação operacional',
      type: 'resource',
      category: 'Ferramentas',
      relevance: 0,
      path: '/resources/calculator',
      icon: '🧮',
      description: 'Ferramenta para cálculo preciso de medicamentos',
      tags: ['calculadora', 'doses', 'PQT-U', 'peso']
    },
    {
      id: 'dispensation-checklist',
      title: 'Checklist de Dispensação',
      content: 'Lista de verificação completa para dispensação segura e orientações obrigatórias',
      type: 'resource',
      category: 'Ferramentas',
      relevance: 0,
      path: '/resources/checklist',
      icon: '✅',
      description: 'Lista para garantir dispensação completa',
      tags: ['checklist', 'dispensação', 'segurança', 'verificação']
    },

    // Páginas do Sistema
    {
      id: 'chat-assistants',
      title: 'Chat com Assistentes',
      content: 'Converse com Dr. Gasnelio ou Gá sobre dúvidas técnicas e práticas sobre hanseníase',
      type: 'chat',
      category: 'Interação',
      relevance: 0,
      path: '/chat',
      icon: '💬',
      description: 'Assistentes virtuais especializados',
      tags: ['chat', 'assistente', 'dúvidas', 'Dr. Gasnelio', 'Gá']
    },
    {
      id: 'educational-dashboard',
      title: 'Dashboard Educacional',
      content: 'Acompanhe seu progresso, conquistas, trilhas de aprendizagem e métricas de estudo',
      type: 'page',
      category: 'Progresso',
      relevance: 0,
      path: '/dashboard',
      icon: '📊',
      description: 'Painel de acompanhamento personalizado',
      tags: ['dashboard', 'progresso', 'conquistas', 'métricas']
    },
    {
      id: 'progress-tracking',
      title: 'Acompanhamento de Progresso',
      content: 'Visualize seu progresso detalhado, conquistas obtidas e próximos objetivos',
      type: 'page',
      category: 'Progresso',
      relevance: 0,
      path: '/progress',
      icon: '📈',
      description: 'Detalhamento completo do seu aprendizado',
      tags: ['progresso', 'objetivos', 'metas', 'acompanhamento']
    },

    // Integração com Glossário
    ...terms.map(term => ({
      id: `glossary-${term.id}`,
      title: term.term,
      content: term.definition,
      type: 'glossary' as const,
      category: `Glossário - ${term.category}`,
      relevance: 0,
      path: '#glossary',
      icon: '📖',
      description: `Definição: ${term.definition.substring(0, 100)}...`,
      tags: [term.term.toLowerCase(), ...(term.synonyms || []), term.category]
    }))
  ], [terms]);

  // Carregar buscas recentes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('smartSearchRecents');
      if (stored) {
        try {
          setRecentSearches(JSON.parse(stored));
        } catch (e) {
          // Silent error handling for localStorage parsing
          // Error tracked for analytics without sensitive data exposure
          if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'search_storage_error', {
              event_category: 'search',
              event_label: 'recent_searches_parse_error'
            });
          }
        }
      }
    }
  }, []);

  // Salvar busca recente
  const saveRecentSearch = (search: string) => {
    if (!search.trim()) return;
    
    setRecentSearches(prev => {
      const newRecents = [search, ...prev.filter(item => item !== search)].slice(0, 5);
      if (typeof window !== 'undefined') {
        localStorage.setItem('smartSearchRecents', JSON.stringify(newRecents));
      }
      return newRecents;
    });
  };

  // Gerar itens de autocomplete
  const generateAutocomplete = useMemo(() => {
    return (searchQuery: string): AutocompleteItem[] => {
      if (!searchQuery.trim() || searchQuery.length < 2) {
        // Mostrar sugestões recentes e populares quando não há query
        const recents: AutocompleteItem[] = recentSearches.map(search => ({
          id: `recent-${search}`,
          text: search,
          type: 'recent',
          description: 'Busca recente'
        }));

        const suggestions: AutocompleteItem[] = [
          { id: 'sug-pqtu', text: 'PQT-U', type: 'suggestion', description: 'Poliquimioterapia Única' },
          { id: 'sug-diag', text: 'diagnóstico', type: 'suggestion', description: 'Métodos diagnósticos' },
          { id: 'sug-disp', text: 'dispensação', type: 'suggestion', description: 'Procedimentos farmacêuticos' },
          { id: 'sug-calc', text: 'calculadora', type: 'suggestion', description: 'Ferramentas de cálculo' }
        ];

        return [...recents, ...suggestions].slice(0, 6);
      }

      const lowerQuery = searchQuery.toLowerCase();
      const autocompleteItems: AutocompleteItem[] = [];

      // Autocomplete de termos do glossário
      if (enableGlossaryAutocomplete) {
        const matchingTerms = terms
          .filter(term => 
            term.term.toLowerCase().includes(lowerQuery) ||
            term.synonyms?.some(synonym => synonym.toLowerCase().includes(lowerQuery))
          )
          .slice(0, 4)
          .map(term => ({
            id: `term-${term.id}`,
            text: term.term,
            type: 'term' as const,
            description: term.definition.substring(0, 100) + '...',
            category: term.category
          }));

        autocompleteItems.push(...matchingTerms);
      }

      // Autocomplete de sugestões contextuais
      const suggestions = [
        'PQT-U tratamento',
        'hanseníase sintomas',
        'diagnóstico diferencial',
        'dispensação farmacêutica',
        'calculadora doses',
        'reações adversas'
      ]
        .filter(suggestion => suggestion.toLowerCase().includes(lowerQuery))
        .slice(0, 3)
        .map(suggestion => ({
          id: `suggestion-${suggestion}`,
          text: suggestion,
          type: 'suggestion' as const,
          description: 'Sugestão de busca'
        }));

      autocompleteItems.push(...suggestions);

      return autocompleteItems.slice(0, 6);
    };
  }, [terms, recentSearches, enableGlossaryAutocomplete]);

  // Função de busca inteligente
  const performSearch = useMemo(() => {
    return (searchQuery: string): SearchResult[] => {
      if (!searchQuery.trim()) return [];

      const lowerQuery = searchQuery.toLowerCase();
      const queryWords = lowerQuery.split(/\s+/).filter(word => word.length > 1);

      return searchDatabase
        .map(item => {
          let relevance = 0;

          // Busca exata no título (peso maior)
          if (item.title.toLowerCase().includes(lowerQuery)) {
            relevance += 100;
          }

          // Busca por palavras individuais no título
          queryWords.forEach(word => {
            if (item.title.toLowerCase().includes(word)) {
              relevance += 50;
            }
          });

          // Busca no conteúdo
          if (item.content.toLowerCase().includes(lowerQuery)) {
            relevance += 30;
          }

          queryWords.forEach(word => {
            if (item.content.toLowerCase().includes(word)) {
              relevance += 15;
            }
          });

          // Busca nas tags
          item.tags?.forEach(tag => {
            if (tag.includes(lowerQuery)) {
              relevance += 25;
            }
            queryWords.forEach(word => {
              if (tag.includes(word)) {
                relevance += 10;
              }
            });
          });

          // Bonus para correspondência de tipo específico
          if (lowerQuery.includes('módulo') && item.type === 'module') relevance += 20;
          if (lowerQuery.includes('ferramenta') && item.type === 'resource') relevance += 20;
          if (lowerQuery.includes('chat') && item.type === 'chat') relevance += 20;
          if (lowerQuery.includes('glossário') && item.type === 'glossary') relevance += 20;

          return { ...item, relevance };
        })
        .filter(item => item.relevance > 0)
        .sort((a, b) => b.relevance - a.relevance)
        .slice(0, 8); // Limitar a 8 resultados
    };
  }, [searchDatabase]);

  // Debounce da busca e autocomplete
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim()) {
        setIsLoading(true);
        const searchResults = performSearch(query);
        const autocomplete = generateAutocomplete(query);
        
        setResults(searchResults);
        setAutocompleteItems(autocomplete);
        setShowAutocomplete(autocomplete.length > 0 && searchResults.length === 0);
        setIsLoading(false);
        setIsOpen(true);
      } else {
        // Mostrar autocomplete padrão quando não há query
        const defaultAutocomplete = generateAutocomplete('');
        setResults([]);
        setAutocompleteItems(defaultAutocomplete);
        setShowAutocomplete(defaultAutocomplete.length > 0);
        setIsOpen(false);
      }
    }, 200); // Reduzido para autocomplete mais responsivo

    return () => clearTimeout(timeoutId);
  }, [query, performSearch, generateAutocomplete]);

  // Navegação por teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) {
          handleResultSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  // Sanitize URL to prevent XSS attacks
  const sanitizeUrl = (url: string): string => {
    if (!url || typeof url !== 'string') {
      return '/';
    }
    
    // Block dangerous protocols
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('javascript:') || lowerUrl.includes('data:') || lowerUrl.includes('vbscript:')) {
      return '/';
    }
    
    // Only allow relative paths
    if (url.startsWith('/') || url.startsWith('#')) {
      // Remove any dangerous characters
      return url.replace(/[<>'"]/g, '').replace(/[^\w\-\.\/\#\?=&]/g, '');
    }
    
    // Block any external URLs or unknown protocols
    return '/';
  };

  const handleResultSelect = (result: SearchResult) => {
    saveRecentSearch(query);
    setQuery('');
    setIsOpen(false);
    setSelectedIndex(0);
    setShowAutocomplete(false);
    onResultSelect?.(result);
  };

  const handleAutocompleteSelect = (item: AutocompleteItem) => {
    if (item.type === 'term') {
      // Para termos do glossário, podemos mostrar definição ou buscar
      setQuery(item.text);
      setShowAutocomplete(false);
      // Opcional: mostrar definição diretamente
    } else {
      // Para sugestões e buscas recentes, aplicar como nova busca
      setQuery(item.text);
      saveRecentSearch(item.text);
    }
  };

  // Atalhos de teclado globais
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const getTypeIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'module': return '📚';
      case 'glossary': return '📖';
      case 'resource': return '🛠️';
      case 'chat': return '💬';
      case 'page': return '📄';
      default: return '🔍';
    }
  };

  const getTypeLabel = (type: SearchResult['type']) => {
    switch (type) {
      case 'module': return 'Módulo';
      case 'glossary': return 'Glossário';
      case 'resource': return 'Ferramenta';
      case 'chat': return 'Chat';
      case 'page': return 'Página';
      default: return 'Conteúdo';
    }
  };

  if (variant === 'compact') {
    return (
      <div className={`relative ${className}`}>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-400">🔍</span>
          </div>
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        
        {(isOpen || showAutocomplete) && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">Buscando...</div>
            ) : (
              <>
                {/* Autocomplete */}
                {showAutocomplete && autocompleteItems.length > 0 && (
                  <div className="border-b border-gray-100">
                    <div className="p-2 text-xs font-medium text-gray-500 bg-gray-50">
                      {query.trim() ? 'Sugestões' : 'Buscas recentes e sugestões'}
                    </div>
                    {autocompleteItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 cursor-pointer hover:bg-blue-50 transition-colors"
                        onClick={() => handleAutocompleteSelect(item)}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-lg">
                            {item.type === 'term' ? '📖' : 
                             item.type === 'recent' ? '🕒' : '💡'}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">{item.text}</div>
                            <div className="text-sm text-gray-500 truncate">{item.description}</div>
                          </div>
                          <span className="text-xs text-gray-400">
                            {item.type === 'term' ? 'Glossário' : 
                             item.type === 'recent' ? 'Recente' : 'Sugestão'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Resultados de busca */}
                {results.length === 0 && !showAutocomplete ? (
                  <div className="p-4 text-center text-gray-500">Nenhum resultado encontrado</div>
                ) : results.length > 0 ? (
                  <>
                    {showAutocomplete && autocompleteItems.length > 0 && (
                      <div className="p-2 text-xs font-medium text-gray-500 bg-gray-50">
                        Resultados da busca
                      </div>
                    )}
                    {results.map((result, index) => {
                      // Create safe static path to prevent XSS completely
                      const safePath = result.id ? `/modules/${result.id}` : '/';
                      return (
                      <Link key={result.id} href={safePath}>
                        <div
                          className={`p-3 cursor-pointer transition-colors ${
                            index === selectedIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
                          }`}
                          onClick={() => handleResultSelect(result)}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{result.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 truncate">{result.title}</div>
                              <div className="text-sm text-gray-500 truncate">{result.description}</div>
                            </div>
                            <span className="text-xs text-gray-400">{getTypeLabel(result.type)}</span>
                          </div>
                        </div>
                      </Link>
                      );
                    })}
                  </>
                ) : null}
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          🔍 Busca Inteligente
        </h2>
        <p className="text-gray-600">
          Encontre rapidamente módulos, termos técnicos, ferramentas e conteúdos educacionais
        </p>
      </div>

      {/* Search Input */}
      <div className="p-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <span className="text-gray-400 text-xl">🔍</span>
          </div>
          <input
            ref={inputRef}
            type="text"
            placeholder={`${placeholder} (Ctrl+K)`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full pl-12 pr-4 py-4 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setIsOpen(false);
              }}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Quick Suggestions */}
        {!query && (
          <div className="mt-4">
            <div className="text-sm font-medium text-gray-600 mb-2">Sugestões rápidas:</div>
            <div className="flex flex-wrap gap-2">
              {['PQT-U', 'diagnóstico', 'dispensação', 'calculadora', 'Dr. Gasnelio'].map(suggestion => (
                <button
                  key={suggestion}
                  onClick={() => setQuery(suggestion)}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {isOpen && (
          <div ref={resultsRef} className="mt-4">
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-2xl mb-2">⏳</div>
                <div>Buscando conteúdos...</div>
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-4">🔍</div>
                <div className="text-lg font-medium mb-2">Nenhum resultado encontrado</div>
                <div className="text-sm">Tente termos como &quot;PQT-U&quot;, &quot;diagnóstico&quot; ou &quot;dispensação&quot;</div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-sm font-medium text-gray-600 mb-3">
                  {results.length} resultado{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}
                </div>
                {results.map((result, index) => {
                  // Create safe static path to prevent XSS completely
                  const safePath = result.id ? `/modules/${result.id}` : '/';
                  return (
                  <Link key={result.id} href={safePath}>
                    <div
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        index === selectedIndex 
                          ? 'border-blue-300 bg-blue-50 shadow-md' 
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      }`}
                      onClick={() => handleResultSelect(result)}
                    >
                      <div className="flex items-start gap-4">
                        <div className="bg-white p-2 rounded-lg shadow-sm">
                          <span className="text-xl">{result.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-gray-900">{result.title}</h3>
                            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                              {getTypeLabel(result.type)}
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                            {result.description || result.content}
                          </p>
                          <div className="text-xs text-gray-500">
                            {result.category} • Relevância: {result.relevance}
                          </div>
                        </div>
                        <div className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                          →
                        </div>
                      </div>
                    </div>
                  </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Integração com Glossário */}
      {showGlossaryIntegration && (
        <div className="border-t border-gray-200">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Glossário Integrado</h3>
              <button
                onClick={() => setShowGlossary(!showGlossary)}
                className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
              >
                {showGlossary ? 'Ocultar' : 'Mostrar'} Glossário
              </button>
            </div>
            
            {showGlossary && (
              <div className="max-h-96 overflow-y-auto">
                <Glossary 
                  variant="compact" 
                  searchable={false}
                  categorizable={false}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50 text-center">
        <p className="text-sm text-gray-600">
          💡 <strong>Dica:</strong> Use Ctrl+K para buscar rapidamente de qualquer lugar
          {enableGlossaryAutocomplete && ' • Termos do glossário aparecem automaticamente'}
        </p>
      </div>
    </div>
  );
}

// Hook para busca global
export function useSmartSearch() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    isSearchOpen,
    setIsSearchOpen,
    openSearch: () => setIsSearchOpen(true),
    closeSearch: () => setIsSearchOpen(false)
  };
}