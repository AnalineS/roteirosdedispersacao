'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { calculatePQTUDoses, validateCalculation } from '@/utils/doseCalculations';
import { PatientProfile, CalculationResult, CalculationHistory } from '@/types/medication';
import { modernChatTheme } from '@/config/modernTheme';
import BasicCalculator from './BasicCalculator';
import CalculationHistoryComponent from './CalculationHistory';
import ExportOptions from './ExportOptions';

interface AdvancedCalculatorProps {
  onCalculationComplete?: (result: CalculationResult) => void;
}

export default function AdvancedCalculator({ onCalculationComplete }: AdvancedCalculatorProps) {
  const [activeTab, setActiveTab] = useState<'calculator' | 'history' | 'export'>('calculator');
  const [currentResult, setCurrentResult] = useState<CalculationResult | null>(null);
  const [history, setHistory] = useState<CalculationHistory[]>([]);
  const [showExportModal, setShowExportModal] = useState(false);

  // Carregar histórico do localStorage no mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('pqtu_calculation_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error('Erro ao carregar histórico:', error);
      }
    }
  }, []);

  // Salvar histórico no localStorage
  const saveToHistory = useCallback((result: CalculationResult, profile: PatientProfile) => {
    const historyItem: CalculationHistory = {
      id: `calc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      patientProfile: {
        weight: profile.weight,
        age: profile.age,
        isPregnant: profile.isPregnant,
        hasG6PDDeficiency: profile.hasG6PDDeficiency,
        hasLiverDisease: profile.hasLiverDisease,
        hasKidneyDisease: profile.hasKidneyDisease
      },
      result,
      notes: `Cálculo para paciente ${profile.weight}kg, ${profile.age} anos`
    };

    const updatedHistory = [historyItem, ...history].slice(0, 50); // Manter apenas 50 mais recentes
    setHistory(updatedHistory);
    localStorage.setItem('pqtu_calculation_history', JSON.stringify(updatedHistory));
  }, [history]);

  const handleCalculationComplete = useCallback((result: CalculationResult, profile?: PatientProfile) => {
    setCurrentResult(result);
    
    if (profile) {
      saveToHistory(result, profile);
    }
    
    onCalculationComplete?.(result);
  }, [onCalculationComplete, saveToHistory]);

  const handleExport = useCallback(() => {
    if (currentResult) {
      setShowExportModal(true);
    }
  }, [currentResult]);

  const clearHistory = useCallback(() => {
    if (confirm('Tem certeza que deseja limpar todo o histórico de cálculos?')) {
      setHistory([]);
      localStorage.removeItem('pqtu_calculation_history');
    }
  }, []);

  return (
    <div style={{
      background: 'white',
      borderRadius: modernChatTheme.borderRadius.lg,
      boxShadow: modernChatTheme.shadows.subtle,
      overflow: 'hidden'
    }}>
      {/* Header Avançado */}
      <div style={{
        background: `linear-gradient(135deg, ${modernChatTheme.colors.personas.gasnelio.primary}15, ${modernChatTheme.colors.personas.ga.primary}15)`,
        padding: modernChatTheme.spacing.xl,
        textAlign: 'center'
      }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: '700',
          color: modernChatTheme.colors.neutral.text,
          marginBottom: modernChatTheme.spacing.sm
        }}>
          🎓 Calculadora PQT-U Avançada
        </h2>
        <p style={{
          fontSize: modernChatTheme.typography.meta.fontSize,
          color: modernChatTheme.colors.neutral.textMuted,
          marginBottom: modernChatTheme.spacing.md
        }}>
          Recursos exclusivos para usuários logados
        </p>
        
        {/* Benefícios Premium */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: modernChatTheme.spacing.lg,
          flexWrap: 'wrap',
          fontSize: '12px',
          color: modernChatTheme.colors.neutral.textMuted
        }}>
          <span>💾 Histórico de cálculos</span>
          <span>📄 Export PDF</span>
          <span>📧 Envio por email</span>
          <span>📊 Relatórios detalhados</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: `1px solid ${modernChatTheme.colors.neutral.border}`,
        background: modernChatTheme.colors.background.secondary
      }}>
        {[
          { key: 'calculator', label: '🧮 Calculadora', count: null },
          { key: 'history', label: '📚 Histórico', count: history.length },
          { key: 'export', label: '📤 Exportar', count: currentResult ? 1 : null }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            style={{
              flex: 1,
              padding: modernChatTheme.spacing.md,
              border: 'none',
              background: activeTab === tab.key 
                ? 'white' 
                : 'transparent',
              color: activeTab === tab.key
                ? modernChatTheme.colors.personas.gasnelio.primary
                : modernChatTheme.colors.neutral.textMuted,
              fontSize: modernChatTheme.typography.meta.fontSize,
              fontWeight: activeTab === tab.key ? '600' : '400',
              cursor: 'pointer',
              borderBottom: activeTab === tab.key 
                ? `2px solid ${modernChatTheme.colors.personas.gasnelio.primary}`
                : '2px solid transparent',
              transition: modernChatTheme.transitions.fast
            }}
          >
            {tab.label} {tab.count !== null && tab.count > 0 && `(${tab.count})`}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div style={{ padding: modernChatTheme.spacing.xl }}>
        {activeTab === 'calculator' && (
          <EnhancedBasicCalculator 
            onCalculationComplete={handleCalculationComplete}
            onExportRequest={handleExport}
            isAdvanced={true}
          />
        )}

        {activeTab === 'history' && (
          <CalculationHistoryComponent
            history={history}
            onClearHistory={clearHistory}
            onSelectCalculation={(item) => {
              setCurrentResult(item.result);
              setActiveTab('calculator');
            }}
          />
        )}

        {activeTab === 'export' && (
          <ExportOptions
            result={currentResult}
            isAvailable={!!currentResult}
          />
        )}
      </div>

      {/* Export Modal */}
      {showExportModal && currentResult && (
        <ExportModal
          result={currentResult}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </div>
  );
}

// Enhanced version of BasicCalculator with additional features
function EnhancedBasicCalculator({ 
  onCalculationComplete, 
  onExportRequest,
  isAdvanced 
}: {
  onCalculationComplete: (result: CalculationResult, profile?: PatientProfile) => void;
  onExportRequest: () => void;
  isAdvanced: boolean;
}) {
  const [profile, setProfile] = useState<PatientProfile>({
    weight: 0,
    age: 0,
    isPregnant: false,
    hasG6PDDeficiency: false,
    hasLiverDisease: false,
    hasKidneyDisease: false,
    allergies: [],
    currentMedications: []
  });
  
  const [result, setResult] = useState<CalculationResult | null>(null);
  const [savedNote, setSavedNote] = useState('');

  const handleCalculationCompleteInternal = useCallback((calcResult: CalculationResult) => {
    setResult(calcResult);
    onCalculationComplete(calcResult, profile);
  }, [onCalculationComplete, profile]);

  return (
    <div>
      <BasicCalculator onCalculationComplete={handleCalculationCompleteInternal} />
      
      {/* Advanced Features */}
      {result && isAdvanced && (
        <div style={{
          marginTop: modernChatTheme.spacing.xl,
          padding: modernChatTheme.spacing.lg,
          background: modernChatTheme.colors.background.secondary,
          borderRadius: modernChatTheme.borderRadius.md,
          border: `1px solid ${modernChatTheme.colors.neutral.border}`
        }}>
          <h4 style={{
            fontSize: modernChatTheme.typography.persona.fontSize,
            fontWeight: '600',
            color: modernChatTheme.colors.neutral.text,
            marginBottom: modernChatTheme.spacing.md
          }}>
            🎓 Recursos Avançados
          </h4>

          {/* Nota Personalizada */}
          <div style={{ marginBottom: modernChatTheme.spacing.md }}>
            <label style={{
              display: 'block',
              marginBottom: modernChatTheme.spacing.xs,
              fontSize: modernChatTheme.typography.meta.fontSize,
              fontWeight: '600',
              color: modernChatTheme.colors.neutral.text
            }}>
              📝 Adicionar nota (opcional):
            </label>
            <textarea
              value={savedNote}
              onChange={(e) => setSavedNote(e.target.value)}
              placeholder="Ex: Paciente com histórico de reações adversas..."
              maxLength={500}
              style={{
                width: '100%',
                minHeight: '60px',
                padding: modernChatTheme.spacing.sm,
                border: `1px solid ${modernChatTheme.colors.neutral.border}`,
                borderRadius: modernChatTheme.borderRadius.sm,
                fontSize: modernChatTheme.typography.meta.fontSize,
                resize: 'vertical'
              }}
            />
            <div style={{
              fontSize: '11px',
              color: modernChatTheme.colors.neutral.textMuted,
              textAlign: 'right',
              marginTop: modernChatTheme.spacing.xs
            }}>
              {savedNote.length}/500 caracteres
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: modernChatTheme.spacing.md,
            flexWrap: 'wrap'
          }}>
            <button
              onClick={onExportRequest}
              style={{
                padding: `${modernChatTheme.spacing.sm} ${modernChatTheme.spacing.md}`,
                background: modernChatTheme.colors.personas.gasnelio.primary,
                color: 'white',
                border: 'none',
                borderRadius: modernChatTheme.borderRadius.sm,
                fontSize: modernChatTheme.typography.meta.fontSize,
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: modernChatTheme.spacing.xs
              }}
            >
              📄 Exportar PDF
            </button>

            <button
              onClick={() => {
                // TODO: Implementar envio por email
                alert('Funcionalidade de email será implementada em breve!');
              }}
              style={{
                padding: `${modernChatTheme.spacing.sm} ${modernChatTheme.spacing.md}`,
                background: modernChatTheme.colors.personas.ga.primary,
                color: 'white',
                border: 'none',
                borderRadius: modernChatTheme.borderRadius.sm,
                fontSize: modernChatTheme.typography.meta.fontSize,
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: modernChatTheme.spacing.xs
              }}
            >
              📧 Enviar por Email
            </button>

            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: 'Cálculo PQT-U',
                    text: `Doses calculadas: Rifampicina ${result.monthlyDoses.rifampicina}mg, Clofazimina ${result.monthlyDoses.clofazimina_mensal}mg mensal + ${result.dailyDoses.clofazimina_diaria}mg diária, Dapsona ${result.monthlyDoses.dapsona_mensal}mg mensal + ${result.dailyDoses.dapsona_diaria}mg diária`
                  });
                } else {
                  // Fallback para cópia
                  const text = `Cálculo PQT-U - Peso: ${profile.weight}kg, Idade: ${profile.age} anos\nDoses: Rifampicina ${result.monthlyDoses.rifampicina}mg mensal`;
                  navigator.clipboard.writeText(text);
                  alert('Resultado copiado para área de transferência!');
                }
              }}
              style={{
                padding: `${modernChatTheme.spacing.sm} ${modernChatTheme.spacing.md}`,
                background: modernChatTheme.colors.neutral.textMuted,
                color: 'white',
                border: 'none',
                borderRadius: modernChatTheme.borderRadius.sm,
                fontSize: modernChatTheme.typography.meta.fontSize,
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: modernChatTheme.spacing.xs
              }}
            >
              📋 Compartilhar
            </button>
          </div>

          {/* Quick Stats */}
          <div style={{
            marginTop: modernChatTheme.spacing.lg,
            padding: modernChatTheme.spacing.md,
            background: '#3B82F6' + '10',
            borderRadius: modernChatTheme.borderRadius.sm,
            border: `1px solid ${modernChatTheme.colors.status.info}20`
          }}>
            <h5 style={{
              fontSize: modernChatTheme.typography.meta.fontSize,
              fontWeight: '600',
              color: '#3B82F6',
              marginBottom: modernChatTheme.spacing.sm
            }}>
              📊 Resumo do Tratamento
            </h5>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: modernChatTheme.spacing.sm,
              fontSize: '12px',
              color: modernChatTheme.colors.neutral.textMuted
            }}>
              <div>
                <strong>Protocolo:</strong> {result.protocol.population === 'adulto' ? 'Adulto' : 'Pediátrico'}
              </div>
              <div>
                <strong>Duração:</strong> {result.treatmentSchedule.totalDoses} meses
              </div>
              <div>
                <strong>Total de doses:</strong> {result.treatmentSchedule.totalDoses} mensais
              </div>
              <div>
                <strong>Alertas:</strong> {result.safetyAlerts.length} identificados
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Placeholder for Export Modal (will be implemented)
function ExportModal({ result, onClose }: { result: CalculationResult; onClose: () => void }) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: modernChatTheme.zIndex.modal
    }}>
      <div style={{
        background: 'white',
        padding: modernChatTheme.spacing.xl,
        borderRadius: modernChatTheme.borderRadius.lg,
        maxWidth: '400px',
        width: '90%'
      }}>
        <h3>🚧 Em Desenvolvimento</h3>
        <p>A funcionalidade de exportação será implementada na próxima etapa com EmailJS.</p>
        <button onClick={onClose} style={{
          padding: modernChatTheme.spacing.sm,
          background: modernChatTheme.colors.personas.gasnelio.primary,
          color: 'white',
          border: 'none',
          borderRadius: modernChatTheme.borderRadius.sm,
          cursor: 'pointer'
        }}>
          Fechar
        </button>
      </div>
    </div>
  );
}
