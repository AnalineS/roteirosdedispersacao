'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Tooltip from '../../common/Tooltip';

interface GlossaryTerm {
  id: string;
  term: string;
  definition: string;
  category: 'medicamento' | 'doenca' | 'procedimento' | 'exame' | 'sintoma' | 'tratamento';
  difficulty: 'basico' | 'intermediario' | 'avancado';
  relatedTerms?: string[];
  synonyms?: string[];
  examples?: string[];
  pronunciation?: string;
}

interface GlossaryProps {
  variant?: 'compact' | 'full' | 'inline';
  terms?: GlossaryTerm[];
  searchable?: boolean;
  categorizable?: boolean;
  onTermSelect?: (term: GlossaryTerm) => void;
  className?: string;
}

// Base de dados de termos educacionais sobre hanseníase
const defaultGlossaryTerms: GlossaryTerm[] = [
  {
    id: 'pqt-u',
    term: 'PQT-U',
    definition: 'Poliquimioterapia Única: esquema terapêutico padronizado para tratamento da hanseníase com dose única supervisionada, indicado para casos paucibacilares.',
    category: 'tratamento',
    difficulty: 'intermediario',
    synonyms: ['Poliquimioterapia Única', 'Esquema Único'],
    examples: ['Rifampicina 600mg + Dapsona 100mg + Clofazimina 300mg'],
    relatedTerms: ['rifampicina', 'dapsona', 'clofazimina']
  },
  {
    id: 'hanseniase',
    term: 'Hanseníase',
    definition: 'Doença infectocontagiosa crônica causada pelo Mycobacterium leprae, que afeta principalmente pele, nervos periféricos, mucosa nasal e outros órgãos.',
    category: 'doenca',
    difficulty: 'basico',
    synonyms: ['Lepra', 'Mal de Hansen'],
    examples: ['Manchas na pele com perda de sensibilidade', 'Dormência nas mãos e pés'],
    relatedTerms: ['mycobacterium-leprae', 'paucibacilar', 'multibacilar']
  },
  {
    id: 'baciloscopia',
    term: 'Baciloscopia',
    definition: 'Exame laboratorial que detecta a presença de bacilos álcool-ácido resistentes (BAAR) em material biológico, utilizado para diagnóstico e classificação da hanseníase.',
    category: 'exame',
    difficulty: 'intermediario',
    synonyms: ['Pesquisa de BAAR'],
    examples: ['Coleta de linfa de lóbulo auricular', 'Raspado de lesão cutânea'],
    relatedTerms: ['baar', 'indice-baciloscópico']
  },
  {
    id: 'rifampicina',
    term: 'Rifampicina',
    definition: 'Antibiótico bactericida de primeira linha no tratamento da hanseníase, componente essencial da PQT. Possui ação rápida contra o M. leprae.',
    category: 'medicamento',
    difficulty: 'intermediario',
    synonyms: ['RMP'],
    examples: ['Dose: 600mg para adultos', 'Administração: uma vez por mês, supervisionada'],
    relatedTerms: ['pqt-u', 'bactericida']
  },
  {
    id: 'dapsona',
    term: 'Dapsona',
    definition: 'Medicamento bacteriostático usado no tratamento da hanseníase, parte do esquema PQT. Possui ação prolongada contra o bacilo.',
    category: 'medicamento',
    difficulty: 'intermediario',
    synonyms: ['DDS'],
    examples: ['Dose: 100mg diários para adultos', 'Uso contínuo durante todo o tratamento'],
    relatedTerms: ['pqt-u', 'bacteriostatico']
  },
  {
    id: 'reacao-hansênica',
    term: 'Reação Hansênica',
    definition: 'Estado inflamatório agudo que pode ocorrer antes, durante ou após o tratamento da hanseníase. Requer tratamento específico e acompanhamento médico.',
    category: 'sintoma',
    difficulty: 'avancado',
    synonyms: ['Estado reacional', 'Episódio reacional'],
    examples: ['Reação tipo 1 (reversa)', 'Reação tipo 2 (eritema nodoso hansênico)'],
    relatedTerms: ['prednisona', 'talidomida']
  },
  {
    id: 'grau-incapacidade',
    term: 'Grau de Incapacidade',
    definition: 'Classificação que avalia o comprometimento neural e suas consequências funcionais, variando de 0 a 2, sendo 0 = nenhuma incapacidade, 1 = diminuição da sensibilidade, 2 = incapacidade visível.',
    category: 'procedimento',
    difficulty: 'avancado',
    examples: ['Grau 0: força muscular e sensibilidade normais', 'Grau 2: garras, pé caído, lagoftalmia'],
    relatedTerms: ['teste-sensibilidade', 'avaliacao-neurologica']
  }
];

export default function Glossary({ 
  variant = 'full',
  terms = defaultGlossaryTerms,
  searchable = true,
  categorizable = true,
  onTermSelect,
  className = ''
}: GlossaryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const [selectedTerm, setSelectedTerm] = useState<GlossaryTerm | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filtrar termos baseado na busca e categoria
  const filteredTerms = useMemo(() => {
    return terms.filter(term => {
      const matchesSearch = term.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           term.definition.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           term.synonyms?.some(synonym => synonym.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = selectedCategory === 'todas' || term.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [terms, searchTerm, selectedCategory]);

  // Categorias disponíveis
  const categories = useMemo(() => {
    const cats = Array.from(new Set(terms.map(term => term.category)));
    return [
      { id: 'todas', label: 'Todas as categorias', icon: '📚' },
      { id: 'medicamento', label: 'Medicamentos', icon: '💊' },
      { id: 'doenca', label: 'Doenças', icon: '🔬' },
      { id: 'procedimento', label: 'Procedimentos', icon: '🩺' },
      { id: 'exame', label: 'Exames', icon: '🧪' },
      { id: 'sintoma', label: 'Sintomas', icon: '⚠️' },
      { id: 'tratamento', label: 'Tratamentos', icon: '🏥' }
    ].filter(cat => cat.id === 'todas' || cats.includes(cat.id as any));
  }, [terms]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'basico': return '#22c55e';
      case 'intermediario': return '#f59e0b';
      case 'avancado': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'basico': return 'Básico';
      case 'intermediario': return 'Intermediário';
      case 'avancado': return 'Avançado';
      default: return 'Normal';
    }
  };

  const handleTermClick = (term: GlossaryTerm) => {
    setSelectedTerm(term);
    onTermSelect?.(term);
  };

  // Atalho de teclado para busca
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (variant === 'compact') {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-4 ${className}`}>
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          📖 Glossário Rápido
        </h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {terms.slice(0, 5).map(term => (
            <Tooltip key={term.id} content={term.definition} position="right">
              <div className="p-2 rounded bg-gray-50 hover:bg-gray-100 cursor-help transition-colors">
                <span className="font-medium text-blue-600">{term.term}</span>
                {term.synonyms && (
                  <span className="text-sm text-gray-500 ml-2">
                    ({term.synonyms.join(', ')})
                  </span>
                )}
              </div>
            </Tooltip>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={`inline-block ${className}`}>
        <Tooltip content="Glossário de termos técnicos" position="top">
          <button className="text-blue-600 hover:text-blue-800 underline cursor-help">
            📖 Glossário
          </button>
        </Tooltip>
      </div>
    );
  }

  // Variant 'full'
  return (
    <div className={`bg-white rounded-lg shadow-lg border ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          📖 Glossário Educacional
          <span className="text-sm font-normal text-gray-500">
            {filteredTerms.length} termo{filteredTerms.length !== 1 ? 's' : ''}
          </span>
        </h2>
        <p className="text-gray-600">
          Definições claras dos termos técnicos relacionados à hanseníase e PQT-U
        </p>
      </div>

      {/* Search and Filters */}
      <div className="p-6 border-b border-gray-200 space-y-4">
        {/* Search */}
        {searchable && (
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400">🔍</span>
            </div>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Buscar termos... (Ctrl+K)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>
        )}

        {/* Categories */}
        {categorizable && (
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-blue-100 text-blue-700 border-blue-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200'
                } border`}
              >
                {category.icon} {category.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Terms List */}
      <div className="p-6">
        {filteredTerms.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <span className="text-4xl mb-4 block">🔍</span>
            <p>Nenhum termo encontrado para &quot;{searchTerm}&quot;</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTerms.map(term => (
              <div
                key={term.id}
                className="p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                onClick={() => handleTermClick(term)}
              >
                {/* Term Header */}
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-gray-900">{term.term}</h3>
                    {term.synonyms && term.synonyms.length > 0 && (
                      <span className="text-sm text-gray-500">
                        ({term.synonyms.join(', ')})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2 py-1 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: getDifficultyColor(term.difficulty) }}
                    >
                      {getDifficultyLabel(term.difficulty)}
                    </span>
                  </div>
                </div>

                {/* Definition */}
                <p className="text-gray-700 mb-3 leading-relaxed">
                  {term.definition}
                </p>

                {/* Examples */}
                {term.examples && term.examples.length > 0 && (
                  <div className="mb-3">
                    <h4 className="text-sm font-semibold text-gray-600 mb-1">Exemplos:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {term.examples.map((example, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-blue-500 mt-0.5">•</span>
                          <span>{example}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Related Terms */}
                {term.relatedTerms && term.relatedTerms.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-600">Relacionados:</span>
                    {term.relatedTerms.map(relatedId => {
                      const relatedTerm = terms.find(t => t.id === relatedId);
                      return relatedTerm ? (
                        <Tooltip key={relatedId} content={relatedTerm.definition} position="top">
                          <button
                            className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTermClick(relatedTerm);
                            }}
                          >
                            {relatedTerm.term}
                          </button>
                        </Tooltip>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50 text-center">
        <p className="text-sm text-gray-600">
          💡 <strong>Dica:</strong> Use Ctrl+K para buscar rapidamente ou clique nos termos relacionados para navegar
        </p>
      </div>
    </div>
  );
}

// Hook para usar o glossário em contexto
export function useGlossary(terms: GlossaryTerm[] = defaultGlossaryTerms) {
  const findTerm = (searchTerm: string): GlossaryTerm | undefined => {
    return terms.find(term => 
      term.term.toLowerCase() === searchTerm.toLowerCase() ||
      term.synonyms?.some(synonym => synonym.toLowerCase() === searchTerm.toLowerCase())
    );
  };

  const getDefinition = (termName: string): string => {
    const term = findTerm(termName);
    return term?.definition || `Definição não encontrada para: ${termName}`;
  };

  const getRelatedTerms = (termName: string): GlossaryTerm[] => {
    const term = findTerm(termName);
    if (!term?.relatedTerms) return [];
    
    return term.relatedTerms
      .map(relatedId => terms.find(t => t.id === relatedId))
      .filter(Boolean) as GlossaryTerm[];
  };

  return {
    terms,
    findTerm,
    getDefinition,
    getRelatedTerms
  };
}

// Componente para destacar termos no texto automaticamente
interface AutoGlossaryProps {
  children: string;
  terms?: GlossaryTerm[];
  className?: string;
}

export function AutoGlossary({ children, terms = defaultGlossaryTerms, className = '' }: AutoGlossaryProps) {
  const highlightTerms = (text: string): React.ReactNode[] => {
    const allTerms = terms.flatMap(term => [term.term, ...(term.synonyms || [])]);
    const regex = new RegExp(`\\b(${allTerms.join('|')})\\b`, 'gi');
    
    const parts = text.split(regex);
    
    return parts.map((part, index) => {
      const term = terms.find(t => 
        t.term.toLowerCase() === part.toLowerCase() ||
        t.synonyms?.some(s => s.toLowerCase() === part.toLowerCase())
      );
      
      if (term) {
        return (
          <Tooltip key={index} content={term.definition}>
            <span className="text-blue-600 underline decoration-dotted cursor-help">
              {part}
            </span>
          </Tooltip>
        );
      }
      
      return part;
    });
  };

  return (
    <span className={className}>
      {highlightTerms(children)}
    </span>
  );
}