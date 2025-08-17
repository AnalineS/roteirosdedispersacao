/**
 * Content Chunking Strategy - ETAPA 2 UX TRANSFORMATION
 * Implementa estratégia de chunking para reduzir carga cognitiva
 * 
 * Seguindo princípios de claude_code_optimization_prompt.md:
 * - Medical Context: Chunking específico para informações médicas
 * - Cognitive Load: Redução de 8.9/10 para 6/10 através de organização em chunks
 * - Progressive Disclosure: Revelação progressiva de informação complexa
 */

'use client';

import React, { useState, useCallback } from 'react';
import { getUnbColors } from '@/config/modernTheme';
import { HierarchyHeading, HierarchyText } from '@/components/layout/VisualHierarchyOptimizer';

// Interfaces para content chunking
interface ContentChunk {
  id: string;
  title: string;
  summary: string;
  content: React.ReactNode;
  priority: 'critical' | 'high' | 'medium' | 'low';
  estimatedReadTime?: string;
  category?: 'medical' | 'educational' | 'institutional' | 'general';
  complexity?: 'beginner' | 'intermediate' | 'advanced';
}

interface ChunkGroup {
  id: string;
  title: string;
  description?: string;
  chunks: ContentChunk[];
  defaultExpanded?: boolean;
  layout?: 'accordion' | 'cards' | 'progressive';
}

// Hook para gerenciar estado de chunks
export function useContentChunking(initialGroups: ChunkGroup[]) {
  const [expandedChunks, setExpandedChunks] = useState<Set<string>>(
    new Set(
      initialGroups
        .filter(group => group.defaultExpanded)
        .flatMap(group => group.chunks.map(chunk => chunk.id))
    )
  );
  
  const [currentStep, setCurrentStep] = useState(0);
  const [progressiveMode, setProgressiveMode] = useState(false);

  const toggleChunk = useCallback((chunkId: string) => {
    setExpandedChunks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(chunkId)) {
        newSet.delete(chunkId);
      } else {
        newSet.add(chunkId);
      }
      return newSet;
    });
  }, []);

  const expandGroup = useCallback((groupId: string) => {
    const group = initialGroups.find(g => g.id === groupId);
    if (group) {
      setExpandedChunks(prev => {
        const newSet = new Set(prev);
        group.chunks.forEach(chunk => newSet.add(chunk.id));
        return newSet;
      });
    }
  }, [initialGroups]);

  const collapseGroup = useCallback((groupId: string) => {
    const group = initialGroups.find(g => g.id === groupId);
    if (group) {
      setExpandedChunks(prev => {
        const newSet = new Set(prev);
        group.chunks.forEach(chunk => newSet.delete(chunk.id));
        return newSet;
      });
    }
  }, [initialGroups]);

  const nextStep = useCallback(() => {
    const totalChunks = initialGroups.reduce((acc, group) => acc + group.chunks.length, 0);
    if (currentStep < totalChunks - 1) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, initialGroups]);

  const previousStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  return {
    expandedChunks,
    currentStep,
    progressiveMode,
    toggleChunk,
    expandGroup,
    collapseGroup,
    nextStep,
    previousStep,
    setProgressiveMode,
    setCurrentStep
  };
}

// Componente para chunk individual
interface ContentChunkComponentProps {
  chunk: ContentChunk;
  isExpanded: boolean;
  onToggle: () => void;
  layout: 'accordion' | 'cards' | 'progressive';
}

const ContentChunkComponent: React.FC<ContentChunkComponentProps> = ({
  chunk,
  isExpanded,
  onToggle,
  layout
}) => {
  const unbColors = getUnbColors();
  
  const getPriorityColor = (priority: ContentChunk['priority']) => {
    switch (priority) {
      case 'critical': return '#dc2626';
      case 'high': return '#ea580c';
      case 'medium': return '#0284c7';
      case 'low': return '#64748b';
    }
  };

  const getCategoryIcon = (category: ContentChunk['category']) => {
    switch (category) {
      case 'medical': return '⚕️';
      case 'educational': return '📚';
      case 'institutional': return '🏛️';
      default: return '📄';
    }
  };

  const baseStyle = {
    backgroundColor: 'white',
    borderRadius: '12px',
    border: `2px solid ${isExpanded ? getPriorityColor(chunk.priority) : '#e2e8f0'}`,
    marginBottom: 'var(--hierarchy-spacing-elements)',
    transition: 'all 0.3s ease',
    boxShadow: isExpanded ? '0 8px 24px rgba(0,0,0,0.1)' : '0 2px 8px rgba(0,0,0,0.05)'
  };

  return (
    <div style={baseStyle}>
      {/* Header do Chunk */}
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          padding: 'var(--hierarchy-spacing-elements)',
          background: 'transparent',
          border: 'none',
          textAlign: 'left',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--hierarchy-spacing-micro)'
        }}
        aria-expanded={isExpanded}
        aria-controls={`chunk-content-${chunk.id}`}
      >
        {/* Ícone de categoria */}
        <span style={{ fontSize: '1.5rem' }}>{getCategoryIcon(chunk.category)}</span>
        
        {/* Conteúdo do header */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--hierarchy-spacing-micro)' }}>
            <HierarchyHeading 
              level="h3" 
              style={{ 
                margin: 0,
                color: getPriorityColor(chunk.priority)
              }}
            >
              {chunk.title}
            </HierarchyHeading>
            
            {/* Badges informativos */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {chunk.estimatedReadTime && (
                <span style={{
                  padding: '0.25rem 0.5rem',
                  background: '#f1f5f9',
                  color: '#64748b',
                  fontSize: '0.75rem',
                  borderRadius: '4px',
                  fontWeight: '500'
                }}>
                  {chunk.estimatedReadTime}
                </span>
              )}
              
              {chunk.complexity && (
                <span style={{
                  padding: '0.25rem 0.5rem',
                  background: chunk.complexity === 'beginner' ? '#dcfce7' : 
                           chunk.complexity === 'intermediate' ? '#fef3c7' : '#fee2e2',
                  color: chunk.complexity === 'beginner' ? '#166534' : 
                         chunk.complexity === 'intermediate' ? '#92400e' : '#991b1b',
                  fontSize: '0.75rem',
                  borderRadius: '4px',
                  fontWeight: '500'
                }}>
                  {chunk.complexity}
                </span>
              )}
            </div>
          </div>
          
          <HierarchyText size="normal" style={{ 
            margin: '0.5rem 0 0 0',
            color: '#64748b'
          }}>
            {chunk.summary}
          </HierarchyText>
        </div>
        
        {/* Indicador de expansão */}
        <div style={{
          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.3s ease',
          color: getPriorityColor(chunk.priority)
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6,9 12,15 18,9"></polyline>
          </svg>
        </div>
      </button>
      
      {/* Conteúdo expandido */}
      {isExpanded && (
        <div
          id={`chunk-content-${chunk.id}`}
          style={{
            padding: '0 var(--hierarchy-spacing-elements) var(--hierarchy-spacing-elements)',
            borderTop: `1px solid ${getPriorityColor(chunk.priority)}`,
            background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)'
          }}
        >
          {chunk.content}
        </div>
      )}
    </div>
  );
};

// Componente principal para grupos de chunks
interface ContentChunkingProps {
  groups: ChunkGroup[];
  className?: string;
  enableProgressiveMode?: boolean;
  maxConcurrentChunks?: number;
}

export default function ContentChunking({
  groups,
  className = '',
  enableProgressiveMode = false,
  maxConcurrentChunks = 3
}: ContentChunkingProps) {
  const {
    expandedChunks,
    currentStep,
    progressiveMode,
    toggleChunk,
    expandGroup,
    collapseGroup,
    nextStep,
    previousStep,
    setProgressiveMode
  } = useContentChunking(groups);

  // Limitar chunks expandidos se necessário
  const handleToggleChunk = useCallback((chunkId: string) => {
    if (!expandedChunks.has(chunkId) && expandedChunks.size >= maxConcurrentChunks) {
      // Fechar o primeiro chunk expandido
      const firstExpanded = Array.from(expandedChunks)[0];
      toggleChunk(firstExpanded);
    }
    toggleChunk(chunkId);
  }, [expandedChunks, maxConcurrentChunks, toggleChunk]);

  return (
    <div className={`content-chunking ${className}`}>
      {/* Controles do modo progressivo */}
      {enableProgressiveMode && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--hierarchy-spacing-elements)',
          padding: 'var(--hierarchy-spacing-micro)',
          background: '#f0f9ff',
          borderRadius: '8px',
          border: '1px solid #0ea5e9'
        }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              checked={progressiveMode}
              onChange={(e) => setProgressiveMode(e.target.checked)}
            />
            <HierarchyText size="small" style={{ margin: 0 }}>
              Modo de leitura progressiva
            </HierarchyText>
          </label>
          
          {progressiveMode && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={previousStep}
                disabled={currentStep === 0}
                style={{
                  padding: '0.5rem 1rem',
                  background: currentStep === 0 ? '#f1f5f9' : '#0ea5e9',
                  color: currentStep === 0 ? '#94a3b8' : 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  cursor: currentStep === 0 ? 'not-allowed' : 'pointer'
                }}
              >
                ← Anterior
              </button>
              <button
                onClick={nextStep}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#0ea5e9',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                Próximo →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Renderizar grupos */}
      {groups.map((group) => (
        <div key={group.id} className="chunk-group hierarchy-component">
          {/* Header do grupo */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 'var(--hierarchy-spacing-elements)'
          }}>
            <div>
              <HierarchyHeading level="h2">
                {group.title}
              </HierarchyHeading>
              {group.description && (
                <HierarchyText size="normal" style={{ margin: '0.5rem 0 0 0' }}>
                  {group.description}
                </HierarchyText>
              )}
            </div>
            
            {/* Controles do grupo */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => expandGroup(group.id)}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'transparent',
                  border: '1px solid #0ea5e9',
                  color: '#0ea5e9',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                Expandir Tudo
              </button>
              <button
                onClick={() => collapseGroup(group.id)}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'transparent',
                  border: '1px solid #64748b',
                  color: '#64748b',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
              >
                Recolher Tudo
              </button>
            </div>
          </div>

          {/* Layout dos chunks */}
          <div className={`chunks-container ${group.layout || 'accordion'}`}>
            {group.chunks.map((chunk, index) => {
              // Lógica para modo progressivo
              if (progressiveMode && group.layout === 'progressive') {
                const allChunks = groups.flatMap(g => g.chunks);
                const globalIndex = allChunks.findIndex(c => c.id === chunk.id);
                if (globalIndex > currentStep) return null;
              }

              return (
                <ContentChunkComponent
                  key={chunk.id}
                  chunk={chunk}
                  isExpanded={expandedChunks.has(chunk.id)}
                  onToggle={() => handleToggleChunk(chunk.id)}
                  layout={group.layout || 'accordion'}
                />
              );
            })}
          </div>
        </div>
      ))}

      {/* Informações de carga cognitiva */}
      <div style={{
        marginTop: 'var(--hierarchy-spacing-components)',
        padding: 'var(--hierarchy-spacing-elements)',
        background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
        borderRadius: '12px',
        border: '1px solid #0ea5e9'
      }}>
        <HierarchyText size="small" style={{ margin: 0, color: '#0369a1' }}>
          📊 <strong>Carga Cognitiva Otimizada:</strong> {expandedChunks.size}/{maxConcurrentChunks} seções abertas. 
          Recomendamos não exceder {maxConcurrentChunks} seções simultâneas para melhor compreensão.
        </HierarchyText>
      </div>

      {/* CSS para layouts específicos */}
      <style jsx>{`
        .chunks-container.cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: var(--hierarchy-spacing-elements);
        }
        
        .chunks-container.tabs {
          border-top: 2px solid #e2e8f0;
          padding-top: var(--hierarchy-spacing-elements);
        }
        
        .chunks-container.progressive .content-chunk:not(:first-child) {
          opacity: 0.7;
          transform: translateY(10px);
        }
        
        @media (max-width: 768px) {
          .chunks-container.cards {
            grid-template-columns: 1fr;
          }
          
          .chunk-group .content-chunk {
            margin-bottom: var(--hierarchy-spacing-micro);
          }
        }
      `}</style>
    </div>
  );
}

// Hook utilitário para criar chunks rapidamente
export function createMedicalContentChunk(
  id: string,
  title: string,
  summary: string,
  content: React.ReactNode,
  options: Partial<Pick<ContentChunk, 'priority' | 'complexity' | 'estimatedReadTime'>> = {}
): ContentChunk {
  return {
    id,
    title,
    summary,
    content,
    category: 'medical',
    priority: options.priority || 'medium',
    complexity: options.complexity || 'intermediate',
    estimatedReadTime: options.estimatedReadTime || '3-5 min',
    ...options
  };
}

export function createEducationalContentChunk(
  id: string,
  title: string,
  summary: string,
  content: React.ReactNode,
  options: Partial<Pick<ContentChunk, 'priority' | 'complexity' | 'estimatedReadTime'>> = {}
): ContentChunk {
  return {
    id,
    title,
    summary,
    content,
    category: 'educational',
    priority: options.priority || 'medium',
    complexity: options.complexity || 'beginner',
    estimatedReadTime: options.estimatedReadTime || '5-10 min',
    ...options
  };
}

export { ContentChunking };