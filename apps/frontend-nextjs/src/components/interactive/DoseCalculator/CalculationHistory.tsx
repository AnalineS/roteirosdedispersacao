'use client';

import React from 'react';
import { CalculationHistory } from '@/types/medication';
import { modernChatTheme } from '@/config/modernTheme';

interface CalculationHistoryProps {
  history: CalculationHistory[];
  onClearHistory: () => void;
  onSelectCalculation: (item: CalculationHistory) => void;
}

export default function CalculationHistoryComponent({
  history,
  onClearHistory,
  onSelectCalculation
}: CalculationHistoryProps): JSX.Element {
  
  if (history.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: modernChatTheme.spacing.xxl,
        color: modernChatTheme.colors.neutral.textMuted
      }}>
        <div style={{ fontSize: '48px', marginBottom: modernChatTheme.spacing.lg }}>
          📚
        </div>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          marginBottom: modernChatTheme.spacing.sm,
          color: modernChatTheme.colors.neutral.text
        }}>
          Nenhum cálculo salvo ainda
        </h3>
        <p style={{ fontSize: modernChatTheme.typography.meta.fontSize }}>
          Seus cálculos aparecerão aqui quando você usar a calculadora.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: modernChatTheme.spacing.lg,
        paddingBottom: modernChatTheme.spacing.md,
        borderBottom: `1px solid ${modernChatTheme.colors.neutral.border}`
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '700',
          color: modernChatTheme.colors.neutral.text
        }}>
          📚 Histórico de Cálculos ({history.length})
        </h3>
        
        <button
          onClick={onClearHistory}
          style={{
            padding: `${modernChatTheme.spacing.xs} ${modernChatTheme.spacing.sm}`,
            background: '#EF4444' + '15',
            color: '#EF4444',
            border: `1px solid ${'#EF4444'}30`,
            borderRadius: modernChatTheme.borderRadius.sm,
            fontSize: modernChatTheme.typography.meta.fontSize,
            cursor: 'pointer'
          }}
        >
          🗑️ Limpar Histórico
        </button>
      </div>

      {/* History List */}
      <div style={{
        display: 'grid',
        gap: modernChatTheme.spacing.md
      }}>
        {history.map((item, index) => (
          <HistoryItem
            key={item.id}
            item={item}
            index={index}
            onSelect={() => onSelectCalculation(item)}
          />
        ))}
      </div>
    </div>
  );
}

function HistoryItem({ 
  item, 
  index, 
  onSelect 
}: { 
  item: CalculationHistory; 
  index: number; 
  onSelect: () => void; 
}): JSX.Element {
  const isRecent = (Date.now() - item.timestamp.getTime()) < (24 * 60 * 60 * 1000); // Últimas 24h
  
  return (
    <div
      onClick={onSelect}
      style={{
        padding: modernChatTheme.spacing.lg,
        background: isRecent 
          ? modernChatTheme.colors.personas.gasnelio.bubble 
          : 'white',
        border: isRecent
          ? `1px solid ${modernChatTheme.colors.personas.gasnelio.primary}30`
          : `1px solid ${modernChatTheme.colors.neutral.border}`,
        borderRadius: modernChatTheme.borderRadius.md,
        cursor: 'pointer',
        transition: modernChatTheme.transitions.fast
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = modernChatTheme.shadows.moderate;
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = modernChatTheme.shadows.subtle;
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Header with timestamp and badge */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: modernChatTheme.spacing.sm
      }}>
        <div>
          <h4 style={{
            fontSize: modernChatTheme.typography.persona.fontSize,
            fontWeight: '600',
            color: modernChatTheme.colors.neutral.text,
            marginBottom: modernChatTheme.spacing.xs
          }}>
            Cálculo #{String(history.length - index).padStart(3, '0')}
          </h4>
          <p style={{
            fontSize: '11px',
            color: modernChatTheme.colors.neutral.textMuted
          }}>
            {item.timestamp.toLocaleString('pt-BR', {
              day: '2-digit',
              month: '2-digit', 
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: modernChatTheme.spacing.xs }}>
          {isRecent && (
            <span style={{
              padding: `${modernChatTheme.spacing.xs} ${modernChatTheme.spacing.xs}`,
              background: '#10B981' + '20',
              color: '#10B981',
              fontSize: '10px',
              fontWeight: '600',
              borderRadius: modernChatTheme.borderRadius.sm,
              border: `1px solid ${'#10B981'}30`
            }}>
              ⭐ RECENTE
            </span>
          )}
          
          <span style={{
            padding: `${modernChatTheme.spacing.xs} ${modernChatTheme.spacing.xs}`,
            background: item.result.protocol.population === 'adulto' 
              ? modernChatTheme.colors.personas.gasnelio.alpha
              : modernChatTheme.colors.personas.ga.alpha,
            color: item.result.protocol.population === 'adulto'
              ? modernChatTheme.colors.personas.gasnelio.primary
              : modernChatTheme.colors.personas.ga.primary,
            fontSize: '10px',
            fontWeight: '600',
            borderRadius: modernChatTheme.borderRadius.sm,
            textTransform: 'uppercase'
          }}>
            {item.result.protocol.population === 'adulto' ? '👨‍⚕️ ADULTO' : '👶 PEDIÁTRICO'}
          </span>
        </div>
      </div>

      {/* Patient Info */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
        gap: modernChatTheme.spacing.md,
        marginBottom: modernChatTheme.spacing.sm,
        fontSize: modernChatTheme.typography.meta.fontSize,
        color: modernChatTheme.colors.neutral.textMuted
      }}>
        <div>
          <strong>Peso:</strong> {item.patientProfile.weight}kg
        </div>
        <div>
          <strong>Idade:</strong> {item.patientProfile.age} anos
        </div>
        {item.result.safetyAlerts.length > 0 && (
          <div style={{ 
            color: item.result.safetyAlerts.some(a => a.severity === 'high' || a.severity === 'critical')
              ? '#EF4444' 
              : '#F59E0B' 
          }}>
            <strong>Alertas:</strong> {item.result.safetyAlerts.length}
          </div>
        )}
      </div>

      {/* Quick Doses Preview */}
      <div style={{
        background: modernChatTheme.colors.background.secondary,
        padding: modernChatTheme.spacing.sm,
        borderRadius: modernChatTheme.borderRadius.sm,
        marginBottom: modernChatTheme.spacing.sm
      }}>
        <div style={{
          fontSize: '12px',
          color: modernChatTheme.colors.neutral.textMuted,
          marginBottom: modernChatTheme.spacing.xs
        }}>
          <strong>📊 Doses calculadas:</strong>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: modernChatTheme.spacing.xs,
          fontSize: '11px',
          color: modernChatTheme.colors.neutral.textMuted
        }}>
          <div>Rifampicina: {item.result.monthlyDoses.rifampicina}mg</div>
          <div>Clofazimina: {item.result.monthlyDoses.clofazimina_mensal}mg + {item.result.dailyDoses.clofazimina_diaria}mg/dia</div>
          <div>Dapsona: {item.result.monthlyDoses.dapsona_mensal}mg + {item.result.dailyDoses.dapsona_diaria}mg/dia</div>
        </div>
      </div>

      {/* Notes */}
      {item.notes && (
        <div style={{
          fontSize: '12px',
          color: modernChatTheme.colors.neutral.textMuted,
          fontStyle: 'italic',
          marginBottom: modernChatTheme.spacing.sm
        }}>
          💬 {item.notes}
        </div>
      )}

      {/* Action Hint */}
      <div style={{
        fontSize: '11px',
        color: modernChatTheme.colors.personas.gasnelio.primary,
        textAlign: 'center',
        fontWeight: '500'
      }}>
        👆 Clique para visualizar detalhes completos
      </div>
    </div>
  );
}
