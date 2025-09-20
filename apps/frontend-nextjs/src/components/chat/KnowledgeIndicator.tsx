'use client';

import React, { useState } from 'react';
import { RAGResponse } from '@/services/supabaseRAGClient';
import { theme } from '@/config/theme';

// Tipo para chunks de conhecimento
interface KnowledgeChunk {
  content: string;
  score: number;
  section?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

// Estatísticas do sistema RAG
interface RAGStats {
  documentsIndexed?: number;
  totalQueries?: number;
  averageResponseTime?: number;
  cacheHitRate?: number;
  successRate?: number;
}

interface KnowledgeIndicatorProps {
  searchResult?: RAGResponse | null;
  stats?: RAGStats | null;
  isSearching?: boolean;
  showDetails?: boolean;
  position?: 'inline' | 'floating';
}

export const KnowledgeIndicator: React.FC<KnowledgeIndicatorProps> = ({
  searchResult,
  stats,
  isSearching = false,
  showDetails = false,
  position = 'inline'
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!searchResult && !stats && !isSearching) {
    return null;
  }
  
  const getStatusColor = () => {
    if (isSearching) return theme.colors.warning[500];
    if (!searchResult) return theme.colors.neutral[400];
    if (searchResult.qualityScore > 0.7) return theme.colors.success[500];
    if (searchResult.qualityScore > 0.4) return theme.colors.warning[500];
    return theme.colors.danger[500];
  };
  
  const getStatusIcon = () => {
    if (isSearching) return '🔄';
    if (!searchResult) return '📚';
    if (searchResult.qualityScore > 0.7) return '✅';
    if (searchResult.qualityScore > 0.4) return '⚠️';
    return '❓';
  };
  
  const getStatusText = () => {
    if (isSearching) return 'Buscando contexto...';
    if (!searchResult) return 'Base de conhecimento';
    if (searchResult.cached) return 'Contexto (cache)';
    if (searchResult.qualityScore > 0.7) return 'Contexto encontrado';
    if (searchResult.qualityScore > 0.4) return 'Contexto parcial';
    return 'Contexto limitado';
  };
  
  const containerStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 12px',
    borderRadius: '16px',
    backgroundColor: theme.colors.neutral[50],
    border: `1px solid ${getStatusColor()}`,
    color: getStatusColor(),
    fontSize: '0.8rem',
    fontWeight: 500,
    cursor: showDetails ? 'pointer' : 'default',
    transition: 'all 0.3s ease',
    ...(position === 'floating' && {
      position: 'fixed',
      bottom: '80px',
      right: '20px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      zIndex: 1000,
      backgroundColor: 'white'
    })
  };
  
  const iconStyle: React.CSSProperties = {
    fontSize: '1rem',
    animation: isSearching ? 'spin 1s linear infinite' : 'none'
  };
  
  return (
    <>
      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .knowledge-details {
          position: absolute;
          bottom: 100%;
          left: 0;
          right: 0;
          margin-bottom: '8px';
          padding: '12px';
          backgroundColor: 'white';
          border: '1px solid ${theme.colors.neutral[200]}';
          borderRadius: '8px';
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)';
          fontSize: '0.75rem';
          zIndex: 1001;
          minWidth: '250px';
          opacity: 0;
          visibility: 'hidden';
          transition: 'all 0.3s ease';
        }
        
        .knowledge-indicator:hover .knowledge-details {
          opacity: 1 !important;
          visibility: visible !important;
        }
      `}</style>
      
      <div 
        className="knowledge-indicator"
        style={containerStyle}
        onClick={() => showDetails && setIsExpanded(!isExpanded)}
        role={showDetails ? "button" : "status"}
        aria-label={getStatusText()}
      >
        <span style={iconStyle}>{getStatusIcon()}</span>
        <span>{getStatusText()}</span>
        
        {searchResult && (
          <span style={{ 
            fontSize: '0.7rem', 
            opacity: 0.7,
            marginLeft: '4px'
          }}>
            ({Math.round(searchResult.qualityScore * 100)}%)
          </span>
        )}
        
        {showDetails && (
          <div className="knowledge-details">
            {/* Informações da última busca */}
            {searchResult && (
              <div style={{ marginBottom: '8px' }}>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                  Última Busca:
                </div>
                <div>Chunks encontrados: {searchResult.context?.chunks?.length || 0}</div>
                <div>Confiança: {Math.round(searchResult.qualityScore * 100)}%</div>
                <div>Tempo: {searchResult.processingTimeMs}ms</div>
                <div>Cache: {searchResult.cached ? 'Sim' : 'Não'}</div>
                
                {searchResult.context?.chunks && searchResult.context.chunks.length > 0 && (
                  <div style={{ marginTop: '6px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '0.7rem' }}>
                      Fontes:
                    </div>
                    {searchResult.context.chunks.slice(0, 3).map((chunk: KnowledgeChunk, index: number) => (
                      <div key={index} style={{ 
                        fontSize: '0.65rem', 
                        opacity: 0.8,
                        marginLeft: '8px'
                      }}>
                        • {(chunk.section || 'contexto').replace(/_/g, ' ')}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Estatísticas gerais */}
            {stats && (
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                  Estatísticas:
                </div>
                <div>Taxa de cache: {Math.round((stats.cacheHitRate || 0) * 100)}%</div>
                <div>Taxa de sucesso: {Math.round((stats.successRate || 0) * 100)}%</div>
                <div>Documentos: {stats.documentsIndexed || 0} indexados</div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

// Componente para mostrar contexto encontrado
export const ContextPreview: React.FC<{
  context: string;
  sources: string[];
  confidence: number;
}> = ({ context, sources, confidence }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!context || confidence < 0.3) {
    return null;
  }
  
  const previewText = context.length > 150 
    ? context.substring(0, 147) + '...'
    : context;
  
  return (
    <div style={{
      padding: '12px',
      backgroundColor: theme.colors.primary[50],
      border: `1px solid ${theme.colors.primary[200]}`,
      borderRadius: '8px',
      margin: '8px 0',
      fontSize: '0.85rem'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '8px'
      }}>
        <span style={{ color: theme.colors.primary[600] }}>🔍</span>
        <span style={{ 
          fontWeight: 'bold', 
          color: theme.colors.primary[700] 
        }}>
          Contexto da Base de Conhecimento
        </span>
        <span style={{ 
          fontSize: '0.7rem',
          color: theme.colors.primary[500],
          backgroundColor: theme.colors.primary[100],
          padding: '2px 6px',
          borderRadius: '10px'
        }}>
          {Math.round(confidence * 100)}%
        </span>
      </div>
      
      <div style={{ 
        color: theme.colors.neutral[700],
        lineHeight: '1.4',
        marginBottom: sources.length > 0 ? '8px' : '0'
      }}>
        {isExpanded ? context : previewText}
        {context.length > 150 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              background: 'none',
              border: 'none',
              color: theme.colors.primary[600],
              cursor: 'pointer',
              marginLeft: '4px',
              fontSize: '0.8rem',
              textDecoration: 'underline'
            }}
          >
            {isExpanded ? 'ver menos' : 'ver mais'}
          </button>
        )}
      </div>
      
      {sources.length > 0 && (
        <div style={{ 
          fontSize: '0.7rem', 
          color: theme.colors.neutral[500],
          fontStyle: 'italic'
        }}>
          Fontes: {sources.slice(0, 2).map(s => s.replace(/_/g, ' ')).join(', ')}
          {sources.length > 2 && ` e mais ${sources.length - 2}`}
        </div>
      )}
    </div>
  );
};

// Export default para lazy loading
export default KnowledgeIndicator;