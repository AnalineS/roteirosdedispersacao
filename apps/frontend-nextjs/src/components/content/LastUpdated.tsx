'use client';

import React from 'react';
import { getUnbColors } from '@/config/modernTheme';

interface LastUpdatedProps {
  date: string; // ISO string or readable date
  content?: string;
  version?: string;
  reviewer?: string;
  source?: string;
  className?: string;
  variant?: 'compact' | 'detailed' | 'medical';
}

interface MedicalContentMetadata {
  lastReviewed: string;
  nextReview: string;
  reviewer: string;
  evidenceLevel: 'A' | 'B' | 'C' | 'D';
  guidelines: string[];
  version: string;
}

export default function LastUpdated({
  date,
  content = 'Conteúdo',
  version = '1.0',
  reviewer = 'Equipe Técnica',
  source = 'PCDT Hanseníase 2022',
  className = '',
  variant = 'compact'
}: LastUpdatedProps) {
  const unbColors = getUnbColors();

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const getTimeSinceUpdate = (dateString: string): string => {
    try {
      const updateDate = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - updateDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 30) {
        return `Atualizado há ${diffDays} dias`;
      } else if (diffDays < 365) {
        const months = Math.floor(diffDays / 30);
        return `Atualizado há ${months} ${months === 1 ? 'mês' : 'meses'}`;
      } else {
        const years = Math.floor(diffDays / 365);
        return `Atualizado há ${years} ${years === 1 ? 'ano' : 'anos'}`;
      }
    } catch {
      return 'Data de atualização indisponível';
    }
  };

  const isContentFresh = (dateString: string): boolean => {
    try {
      const updateDate = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - updateDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Considerar "fresco" se atualizado nos últimos 6 meses para conteúdo médico
      return diffDays <= 180;
    } catch {
      return false;
    }
  };

  const isFresh = isContentFresh(date);
  const timeSince = getTimeSinceUpdate(date);

  if (variant === 'compact') {
    return (
      <div className={`last-updated-compact ${className}`} style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.25rem 0.75rem',
        background: isFresh ? '#f0fdf4' : '#fef3c7',
        color: isFresh ? '#16a34a' : '#92400e',
        borderRadius: '20px',
        fontSize: '0.8rem',
        fontWeight: '500',
        border: `1px solid ${isFresh ? '#bbf7d0' : '#fed7aa'}`
      }}>
        <span>{isFresh ? '🟢' : '🟡'}</span>
        <span>Atualizado: {formatDate(date)}</span>
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className={`last-updated-detailed ${className}`} style={{
        background: 'white',
        border: `1px solid ${isFresh ? '#bbf7d0' : '#fed7aa'}`,
        borderRadius: '12px',
        padding: '1rem',
        margin: '1rem 0'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.75rem'
        }}>
          <h4 style={{
            margin: 0,
            fontSize: '0.95rem',
            fontWeight: '600',
            color: '#374151',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            📅 {content} - Informações de Atualização
          </h4>
          
          <span style={{
            background: isFresh ? '#16a34a' : '#f59e0b',
            color: 'white',
            padding: '0.25rem 0.75rem',
            borderRadius: '12px',
            fontSize: '0.7rem',
            fontWeight: '600'
          }}>
            {isFresh ? 'ATUALIZADO' : 'REVISAR'}
          </span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '0.75rem',
          fontSize: '0.85rem'
        }}>
          <div>
            <strong style={{ color: '#6b7280' }}>Última atualização:</strong>
            <br />
            {formatDate(date)} ({timeSince})
          </div>
          
          <div>
            <strong style={{ color: '#6b7280' }}>Versão:</strong>
            <br />
            {version}
          </div>
          
          <div>
            <strong style={{ color: '#6b7280' }}>Revisado por:</strong>
            <br />
            {reviewer}
          </div>
          
          <div>
            <strong style={{ color: '#6b7280' }}>Fonte:</strong>
            <br />
            {source}
          </div>
        </div>

        {!isFresh && (
          <div style={{
            marginTop: '0.75rem',
            padding: '0.75rem',
            background: '#fef3c7',
            borderRadius: '8px',
            fontSize: '0.8rem',
            color: '#92400e'
          }}>
            ⚠️ <strong>Atenção:</strong> Este conteúdo pode estar desatualizado. 
            Verifique as fontes oficiais mais recentes ou consulte um profissional de saúde.
          </div>
        )}
      </div>
    );
  }

  if (variant === 'medical') {
    const medicalMetadata: MedicalContentMetadata = {
      lastReviewed: date,
      nextReview: calculateNextReviewDate(date),
      reviewer: reviewer,
      evidenceLevel: 'A', // Placeholder - seria dinâmico
      guidelines: ['PCDT Hanseníase 2022', 'WHO Guidelines 2018'],
      version: version
    };

    return (
      <div className={`last-updated-medical ${className}`} style={{
        background: 'white',
        border: `2px solid ${unbColors.primary}`,
        borderRadius: '16px',
        padding: '1.5rem',
        margin: '1.5rem 0'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '1rem'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: unbColors.alpha.primary,
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem'
          }}>
            🏥
          </div>
          
          <div>
            <h3 style={{
              margin: 0,
              fontSize: '1.1rem',
              fontWeight: '700',
              color: unbColors.primary
            }}>
              Validação Médica e Científica
            </h3>
            <p style={{
              margin: 0,
              fontSize: '0.85rem',
              color: '#6b7280'
            }}>
              Conteúdo baseado em evidências científicas atuais
            </p>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1rem',
          marginBottom: '1rem'
        }}>
          <div style={{
            background: '#f8fafc',
            padding: '1rem',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#374151' }}>
              📅 Cronograma de Revisão
            </h4>
            <div style={{ fontSize: '0.8rem', lineHeight: '1.5' }}>
              <p style={{ margin: '0 0 0.25rem 0' }}>
                <strong>Última revisão:</strong> {formatDate(medicalMetadata.lastReviewed)}
              </p>
              <p style={{ margin: '0 0 0.25rem 0' }}>
                <strong>Próxima revisão:</strong> {medicalMetadata.nextReview}
              </p>
              <p style={{ margin: 0 }}>
                <strong>Status:</strong> <span style={{ color: isFresh ? '#16a34a' : '#dc2626' }}>
                  {isFresh ? 'Atualizado' : 'Revisão necessária'}
                </span>
              </p>
            </div>
          </div>

          <div style={{
            background: '#f0f9ff',
            padding: '1rem',
            borderRadius: '8px',
            border: '1px solid #e0f2fe'
          }}>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#0369a1' }}>
              🔬 Nível de Evidência
            </h4>
            <div style={{ fontSize: '0.8rem', lineHeight: '1.5' }}>
              <div style={{
                display: 'inline-block',
                background: '#0369a1',
                color: 'white',
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                fontWeight: '600',
                marginBottom: '0.5rem'
              }}>
                Nível {medicalMetadata.evidenceLevel}
              </div>
              <p style={{ margin: 0, color: '#0c4a6e' }}>
                Baseado em diretrizes oficiais e consenso de especialistas
              </p>
            </div>
          </div>
        </div>

        <div style={{
          background: '#f0fdf4',
          padding: '1rem',
          borderRadius: '8px',
          border: '1px solid #bbf7d0'
        }}>
          <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#16a34a' }}>
            📚 Diretrizes de Referência
          </h4>
          <div style={{ fontSize: '0.8rem' }}>
            {medicalMetadata.guidelines.map((guideline, index) => (
              <span
                key={index}
                style={{
                  display: 'inline-block',
                  background: '#dcfce7',
                  color: '#16a34a',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '12px',
                  marginRight: '0.5rem',
                  marginBottom: '0.25rem',
                  fontSize: '0.75rem',
                  fontWeight: '500'
                }}
              >
                {guideline}
              </span>
            ))}
          </div>
        </div>

        <div style={{
          marginTop: '1rem',
          padding: '0.75rem',
          background: '#fef3c7',
          borderRadius: '8px',
          fontSize: '0.8rem',
          color: '#92400e',
          textAlign: 'center'
        }}>
          💡 <strong>Importante:</strong> Este conteúdo é educacional e não substitui 
          consulta, diagnóstico ou tratamento médico profissional.
        </div>
      </div>
    );
  }

  return null;
}

// Função auxiliar para calcular próxima data de revisão
function calculateNextReviewDate(lastReviewDate: string): string {
  try {
    const date = new Date(lastReviewDate);
    date.setFullYear(date.getFullYear() + 1); // Revisar anualmente
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return 'A definir';
  }
}

// Componente para marcar automaticamente datas em textos
export function AutoDateStamp({ children, className = '' }: { 
  children: React.ReactNode; 
  className?: string; 
}) {
  const currentDate = new Date().toISOString();
  
  return (
    <div className={className}>
      {children}
      <LastUpdated 
        date={currentDate}
        content="Esta página"
        variant="compact"
        className="auto-timestamp"
      />
    </div>
  );
}