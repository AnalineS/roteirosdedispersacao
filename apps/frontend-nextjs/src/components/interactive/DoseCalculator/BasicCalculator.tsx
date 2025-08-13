'use client';

import React, { useState, useCallback } from 'react';
import { calculatePQTUDoses, validateCalculation, formatDose } from '@/utils/doseCalculations';
import { PatientProfile, CalculationResult } from '@/types/medication';
import { modernChatTheme } from '@/config/modernTheme';
import {
  PillIcon,
  AlertTriangleIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  RefreshIcon,
  CalculatorIcon,
  ChartIcon,
  ZapIcon,
  LightbulbIcon,
  CalendarIcon,
  HomeIcon,
  BookIcon,
  LockIcon
} from '@/components/icons/EducationalIcons';
// Placeholder for PersonaEducationalMessage - to be implemented
// import { PersonaEducationalMessage } from '@/components/educational/PersonaEducationalAvatar';

interface BasicCalculatorProps {
  onCalculationComplete?: (result: CalculationResult) => void;
}

export default function BasicCalculator({ onCalculationComplete }: BasicCalculatorProps) {
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
  const [isCalculating, setIsCalculating] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  const handleCalculate = useCallback(async () => {
    if (profile.weight <= 0 || profile.age <= 0) {
      alert('Por favor, preencha peso e idade válidos.');
      return;
    }

    setIsCalculating(true);
    
    // Simular processamento (UX)
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const validation = validateCalculation(profile);
    if (!validation.isValid) {
      alert(`Erro na validação: ${validation.errors.join(', ')}`);
      setIsCalculating(false);
      return;
    }
    
    const calculationResult = calculatePQTUDoses(profile);
    setResult(calculationResult);
    onCalculationComplete?.(calculationResult);
    setIsCalculating(false);
  }, [profile, onCalculationComplete]);

  const handleInputChange = (field: keyof PatientProfile, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }));
    setResult(null); // Limpar resultado anterior
  };

  return (
    <section 
      role="main"
      aria-label="Calculadora de doses PQT-U para hanseníase"
      style={{
        background: 'white',
        border: `1px solid ${modernChatTheme.colors.neutral.border}`,
        borderRadius: modernChatTheme.borderRadius.lg,
        padding: modernChatTheme.spacing.xl,
        boxShadow: modernChatTheme.shadows.subtle
      }}
    >
      {/* Header Educacional com Persona Dr. Gasnelio */}
      {/* TODO: Integrar PersonaEducationalMessage quando disponível */}
      <div style={{
        marginBottom: modernChatTheme.spacing.xl,
        textAlign: 'center',
        padding: modernChatTheme.spacing.lg,
        background: `linear-gradient(135deg, ${modernChatTheme.colors.personas.gasnelio.primary}15, ${modernChatTheme.colors.personas.gasnelio.primary}05)`,
        borderRadius: modernChatTheme.borderRadius.md,
        border: `1px solid ${modernChatTheme.colors.personas.gasnelio.primary}30`
      }}>
        <h2 style={{
          fontSize: '20px',
          fontWeight: '700',
          color: modernChatTheme.colors.neutral.text,
          marginBottom: modernChatTheme.spacing.sm
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: modernChatTheme.spacing.sm, justifyContent: 'center' }}>
            <PillIcon size={24} color={modernChatTheme.colors.personas.gasnelio.primary} />
            Calculadora de Doses PQT-U
          </div>
        </h2>
        <p style={{
          fontSize: modernChatTheme.typography.meta.fontSize,
          color: modernChatTheme.colors.neutral.textMuted,
          marginBottom: modernChatTheme.spacing.sm
        }}>
          <strong>Dr. Gasnelio:</strong> "Bem-vindo à calculadora de doses PQT-U. Utilizamos protocolos baseados na minha pesquisa de doutorado para garantir cálculos precisos e seguros."
        </p>
        <div style={{
          background: modernChatTheme.colors.status.warning + '15',
          padding: modernChatTheme.spacing.sm,
          borderRadius: modernChatTheme.borderRadius.sm,
          border: `1px solid ${modernChatTheme.colors.status.warning}30`
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: modernChatTheme.spacing.xs, 
            color: modernChatTheme.colors.status.warning, 
            fontWeight: 'bold',
            justifyContent: 'center'
          }}>
            <AlertTriangleIcon size={18} color="currentColor" />
            IMPORTANTE: Sempre consulte um médico. Esta ferramenta é apenas educacional.
          </div>
        </div>
      </div>

      {/* Formulário Básico */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: modernChatTheme.spacing.lg,
        marginBottom: modernChatTheme.spacing.xl
      }}>
        {/* Peso */}
        <div>
          <label 
            htmlFor="weight-input"
            style={{
              display: 'block',
              marginBottom: modernChatTheme.spacing.xs,
              fontSize: modernChatTheme.typography.meta.fontSize,
              fontWeight: '600',
              color: modernChatTheme.colors.neutral.text
            }}
          >
            Peso (kg) *
          </label>
          <input
            id="weight-input"
            type="number"
            value={profile.weight || ''}
            onChange={(e) => handleInputChange('weight', Number(e.target.value))}
            min="1"
            max="200"
            step="0.1"
            required
            aria-required="true"
            aria-describedby="weight-error"
            aria-invalid={profile.weight <= 0 ? 'true' : 'false'}
            style={{
              width: '100%',
              padding: modernChatTheme.spacing.sm,
              border: `2px solid ${profile.weight <= 0 && profile.weight !== 0 ? modernChatTheme.colors.status.error : modernChatTheme.colors.neutral.border}`,
              borderRadius: modernChatTheme.borderRadius.sm,
              fontSize: modernChatTheme.typography.message.fontSize,
              outline: 'none'
            }}
            onFocus={(e) => {
              e.currentTarget.style.border = `2px solid ${modernChatTheme.colors.personas.gasnelio.primary}`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.border = `2px solid ${profile.weight <= 0 && profile.weight !== 0 ? modernChatTheme.colors.status.error : modernChatTheme.colors.neutral.border}`;
            }}
            placeholder="Ex: 70"
          />
          {profile.weight <= 0 && profile.weight !== 0 && (
            <div 
              id="weight-error" 
              role="alert" 
              style={{
                color: modernChatTheme.colors.status.error,
                fontSize: '12px',
                marginTop: '4px'
              }}
            >
              Peso deve ser maior que 0 kg
            </div>
          )}
        </div>

        {/* Idade */}
        <div>
          <label 
            htmlFor="age-input"
            style={{
              display: 'block',
              marginBottom: modernChatTheme.spacing.xs,
              fontSize: modernChatTheme.typography.meta.fontSize,
              fontWeight: '600',
              color: modernChatTheme.colors.neutral.text
            }}
          >
            Idade (anos) *
          </label>
          <input
            id="age-input"
            type="number"
            value={profile.age || ''}
            onChange={(e) => handleInputChange('age', Number(e.target.value))}
            min="1"
            max="120"
            required
            aria-required="true"
            aria-describedby="age-error"
            aria-invalid={profile.age <= 0 ? 'true' : 'false'}
            style={{
              width: '100%',
              padding: modernChatTheme.spacing.sm,
              border: `2px solid ${profile.age <= 0 && profile.age !== 0 ? modernChatTheme.colors.status.error : modernChatTheme.colors.neutral.border}`,
              borderRadius: modernChatTheme.borderRadius.sm,
              fontSize: modernChatTheme.typography.message.fontSize,
              outline: 'none'
            }}
            onFocus={(e) => {
              e.currentTarget.style.border = `2px solid ${modernChatTheme.colors.personas.gasnelio.primary}`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.border = `2px solid ${profile.age <= 0 && profile.age !== 0 ? modernChatTheme.colors.status.error : modernChatTheme.colors.neutral.border}`;
            }}
            placeholder="Ex: 35"
          />
          {profile.age <= 0 && profile.age !== 0 && (
            <div 
              id="age-error" 
              role="alert" 
              style={{
                color: modernChatTheme.colors.status.error,
                fontSize: '12px',
                marginTop: '4px'
              }}
            >
              Idade deve ser maior que 0 anos
            </div>
          )}
        </div>
      </div>

      {/* Opções Avançadas */}
      <div style={{ marginBottom: modernChatTheme.spacing.lg }}>
        <button
          onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
          style={{
            background: 'transparent',
            border: 'none',
            color: modernChatTheme.colors.personas.gasnelio.primary,
            fontSize: modernChatTheme.typography.meta.fontSize,
            textDecoration: 'underline',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: modernChatTheme.spacing.xs }}>
            {showAdvancedOptions ? <ChevronUpIcon size={16} color="currentColor" /> : <ChevronDownIcon size={16} color="currentColor" />} 
            Opções avançadas (condições especiais)
          </div>
        </button>

        {showAdvancedOptions && (
          <div style={{
            marginTop: modernChatTheme.spacing.md,
            padding: modernChatTheme.spacing.md,
            background: modernChatTheme.colors.background.secondary,
            borderRadius: modernChatTheme.borderRadius.sm,
            display: 'grid',
            gap: modernChatTheme.spacing.sm
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: modernChatTheme.spacing.xs,
              fontSize: modernChatTheme.typography.meta.fontSize,
              cursor: 'pointer'
            }}>
              <input
                id="pregnant-checkbox"
                type="checkbox"
                checked={profile.isPregnant || false}
                onChange={(e) => handleInputChange('isPregnant', e.target.checked)}
                aria-describedby="pregnant-desc"
                style={{
                  width: '16px',
                  height: '16px',
                  cursor: 'pointer'
                }}
              />
              <span>
                Gestante
                <span className="sr-only" id="pregnant-desc">
                  Marcar se a paciente está grávida para ajustes na medicação
                </span>
              </span>
            </label>

            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: modernChatTheme.spacing.xs,
              fontSize: modernChatTheme.typography.meta.fontSize
            }}>
              <input
                type="checkbox"
                checked={profile.hasG6PDDeficiency || false}
                onChange={(e) => handleInputChange('hasG6PDDeficiency', e.target.checked)}
              />
              <span>Deficiência de G6PD</span>
            </label>

            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: modernChatTheme.spacing.xs,
              fontSize: modernChatTheme.typography.meta.fontSize
            }}>
              <input
                type="checkbox"
                checked={profile.hasLiverDisease || false}
                onChange={(e) => handleInputChange('hasLiverDisease', e.target.checked)}
              />
              <span>Doença hepática</span>
            </label>

            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: modernChatTheme.spacing.xs,
              fontSize: modernChatTheme.typography.meta.fontSize
            }}>
              <input
                type="checkbox"
                checked={profile.hasKidneyDisease || false}
                onChange={(e) => handleInputChange('hasKidneyDisease', e.target.checked)}
              />
              <span>Doença renal</span>
            </label>
          </div>
        )}
      </div>

      {/* Botão Calcular */}
      <button
        onClick={handleCalculate}
        disabled={isCalculating || profile.weight <= 0 || profile.age <= 0}
        aria-describedby="calculate-button-desc"
        style={{
          width: '100%',
          padding: modernChatTheme.spacing.md,
          background: profile.weight > 0 && profile.age > 0
            ? modernChatTheme.colors.personas.gasnelio.primary
            : modernChatTheme.colors.neutral.textMuted,
          color: 'white',
          border: '2px solid transparent',
          borderRadius: modernChatTheme.borderRadius.md,
          fontSize: modernChatTheme.typography.message.fontSize,
          fontWeight: '600',
          cursor: profile.weight > 0 && profile.age > 0 ? 'pointer' : 'not-allowed',
          opacity: isCalculating ? 0.7 : 1,
          marginBottom: modernChatTheme.spacing.xl,
          minHeight: '48px',
          outline: 'none'
        }}
        onFocus={(e) => {
          if (!e.currentTarget.disabled) {
            e.currentTarget.style.border = `2px solid ${modernChatTheme.colors.neutral.text}`;
          }
        }}
        onBlur={(e) => {
          e.currentTarget.style.border = '2px solid transparent';
        }}
      >
        <span className="sr-only" id="calculate-button-desc">
          Calcular doses de medicamentos PQT-U baseado no peso e idade informados
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: modernChatTheme.spacing.sm, justifyContent: 'center' }}>
          {isCalculating ? (
            <>
              <RefreshIcon size={16} color="currentColor" />
              Calculando...
            </>
          ) : (
            <>
              <CalculatorIcon size={16} color="currentColor" />
              Calcular Doses PQT-U
            </>
          )}
        </div>
      </button>

      {/* Resultados */}
      {result && (
        <div>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '700',
            color: modernChatTheme.colors.neutral.text,
            marginBottom: modernChatTheme.spacing.lg,
            textAlign: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: modernChatTheme.spacing.sm, justifyContent: 'center' }}>
              <ChartIcon size={18} color="currentColor" />
              Resultado do Cálculo
            </div>
          </h3>

          {/* Alertas de Segurança */}
          {result.safetyAlerts.map((alert, index) => (
            <div
              key={index}
              style={{
                marginBottom: modernChatTheme.spacing.md,
                padding: modernChatTheme.spacing.md,
                borderRadius: modernChatTheme.borderRadius.sm,
                background: alert.severity === 'critical' || alert.severity === 'high' 
                  ? modernChatTheme.colors.status.error + '15'
                  : modernChatTheme.colors.status.warning + '15',
                border: `1px solid ${
                  alert.severity === 'critical' || alert.severity === 'high'
                    ? modernChatTheme.colors.status.error + '30'
                    : modernChatTheme.colors.status.warning + '30'
                }`
              }}
            >
              <strong style={{
                color: alert.severity === 'critical' || alert.severity === 'high'
                  ? modernChatTheme.colors.status.error
                  : modernChatTheme.colors.status.warning
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: modernChatTheme.spacing.xs }}>
                  {alert.severity === 'critical' ? <ZapIcon size={18} color="currentColor" /> : 
                   alert.severity === 'high' ? <AlertTriangleIcon size={18} color="currentColor" /> : 
                   <LightbulbIcon size={18} color="currentColor" />}
                  {alert.message}
                </div>
              </strong>
              <br />
              <span style={{
                fontSize: modernChatTheme.typography.meta.fontSize,
                color: modernChatTheme.colors.neutral.textMuted,
                marginTop: modernChatTheme.spacing.xs
              }}>
                {alert.recommendation}
              </span>
            </div>
          ))}

          {/* Doses Calculadas */}
          {result.isValid && (
            <>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: modernChatTheme.spacing.lg,
                marginBottom: modernChatTheme.spacing.xl
              }}>
                {/* Dose Mensal Supervisionada */}
                <div style={{
                  background: modernChatTheme.colors.personas.gasnelio.bubble,
                  padding: modernChatTheme.spacing.lg,
                  borderRadius: modernChatTheme.borderRadius.md,
                  border: `1px solid ${modernChatTheme.colors.personas.gasnelio.primary}30`
                }}>
                  <h4 style={{
                    fontSize: modernChatTheme.typography.persona.fontSize,
                    fontWeight: '600',
                    color: modernChatTheme.colors.personas.gasnelio.primary,
                    marginBottom: modernChatTheme.spacing.sm
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: modernChatTheme.spacing.xs }}>
                      <CalendarIcon size={18} color="currentColor" />
                      Dose Mensal (Supervisionada)
                    </div>
                  </h4>
                  <ul style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    fontSize: modernChatTheme.typography.meta.fontSize
                  }}>
                    <li>• Rifampicina: {formatDose('rifampicina', result.monthlyDoses.rifampicina)}</li>
                    <li>• Clofazimina: {formatDose('clofazimina_mensal', result.monthlyDoses.clofazimina_mensal)}</li>
                    <li>• Dapsona: {formatDose('dapsona_mensal', result.monthlyDoses.dapsona_mensal)}</li>
                  </ul>
                </div>

                {/* Dose Diária Autoadministrada */}
                <div style={{
                  background: modernChatTheme.colors.personas.ga.bubble,
                  padding: modernChatTheme.spacing.lg,
                  borderRadius: modernChatTheme.borderRadius.md,
                  border: `1px solid ${modernChatTheme.colors.personas.ga.primary}30`
                }}>
                  <h4 style={{
                    fontSize: modernChatTheme.typography.persona.fontSize,
                    fontWeight: '600',
                    color: modernChatTheme.colors.personas.ga.primary,
                    marginBottom: modernChatTheme.spacing.sm
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: modernChatTheme.spacing.xs }}>
                      <HomeIcon size={18} color="currentColor" />
                      Dose Diária (Em casa)
                    </div>
                  </h4>
                  <ul style={{
                    listStyle: 'none',
                    padding: 0,
                    margin: 0,
                    fontSize: modernChatTheme.typography.meta.fontSize
                  }}>
                    <li>• Clofazimina: {formatDose('clofazimina_diaria', result.dailyDoses.clofazimina_diaria)}</li>
                    <li>• Dapsona: {formatDose('dapsona_diaria', result.dailyDoses.dapsona_diaria)}</li>
                  </ul>
                  <p style={{
                    fontSize: '11px',
                    color: modernChatTheme.colors.neutral.textMuted,
                    marginTop: modernChatTheme.spacing.xs,
                    fontStyle: 'italic'
                  }}>
                    ⚠️ NÃO tomar no dia da dose supervisionada
                  </p>
                </div>
              </div>

              {/* Notas Educacionais */}
              <div style={{
                background: modernChatTheme.colors.background.secondary,
                padding: modernChatTheme.spacing.lg,
                borderRadius: modernChatTheme.borderRadius.md,
                border: `1px solid ${modernChatTheme.colors.neutral.border}`
              }}>
                <h4 style={{
                  fontSize: modernChatTheme.typography.persona.fontSize,
                  fontWeight: '600',
                  color: modernChatTheme.colors.neutral.text,
                  marginBottom: modernChatTheme.spacing.sm
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: modernChatTheme.spacing.xs }}>
                    <BookIcon size={18} color="currentColor" />
                    Notas Educacionais
                  </div>
                </h4>
                <ul style={{
                  fontSize: modernChatTheme.typography.meta.fontSize,
                  lineHeight: '1.4',
                  color: modernChatTheme.colors.neutral.textMuted,
                  paddingLeft: modernChatTheme.spacing.md
                }}>
                  {result.educationalNotes.map((note, index) => (
                    <li key={index} style={{ marginBottom: modernChatTheme.spacing.xs }}>
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}

          {/* Call to Action para Usuários Anônimos */}
          <div style={{
            marginTop: modernChatTheme.spacing.xl,
            padding: modernChatTheme.spacing.lg,
            background: modernChatTheme.colors.status.info + '10',
            borderRadius: modernChatTheme.borderRadius.md,
            border: `1px solid ${modernChatTheme.colors.status.info}30`,
            textAlign: 'center'
          }}>
            <p style={{
              fontSize: modernChatTheme.typography.meta.fontSize,
              color: modernChatTheme.colors.neutral.textMuted,
              marginBottom: modernChatTheme.spacing.sm
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: modernChatTheme.spacing.xs, justifyContent: 'center' }}>
                <LightbulbIcon size={16} color="currentColor" />
                Quer salvar este cálculo, exportar em PDF ou receber por email?
              </div>
            </p>
            <p style={{
              fontSize: modernChatTheme.typography.meta.fontSize,
              fontWeight: '600',
              color: modernChatTheme.colors.status.info
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: modernChatTheme.spacing.xs, justifyContent: 'center' }}>
                <LockIcon size={16} color="currentColor" />
                Faça login para acessar recursos avançados!
              </div>
            </p>
          </div>
        </div>
      )}
    </section>
  );
}