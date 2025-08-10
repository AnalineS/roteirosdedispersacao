'use client';

import { useState, useEffect } from 'react';
import EducationalLayout from '@/components/layout/EducationalLayout';
import { getUnbColors } from '@/config/modernTheme';
import { CalculatorIcon } from '@/components/icons/NavigationIcons';

interface DoseCalculation {
  rifampicina: string;
  clofazimina: string;
  dapsona: string;
  duration: string;
  totalCapsules: number;
  monthlyVisits: number;
}

interface PatientData {
  weight: number;
  age: number;
  classification: 'MB' | 'PB';
  hasContraindications: boolean;
  contraindicationDetails: string;
}

export default function CalculatorPage() {
  const unbColors = getUnbColors();
  const [patientData, setPatientData] = useState<PatientData>({
    weight: 0,
    age: 0,
    classification: 'MB',
    hasContraindications: false,
    contraindicationDetails: ''
  });
  
  const [calculation, setCalculation] = useState<DoseCalculation | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Função para calcular doses PQT-U
  const calculateDoses = (): DoseCalculation => {
    const { weight, classification } = patientData;
    
    // Doses baseadas no PCDT Hanseníase 2022
    let rifampicina = '';
    let clofazimina = '';
    let dapsona = '';
    let duration = '';
    let totalCapsules = 0;
    let monthlyVisits = 0;

    if (classification === 'MB') {
      // Multibacilar
      if (weight < 35) {
        rifampicina = '450mg - 1 cápsula mensal supervisionada';
        clofazimina = '150mg - 1 cápsula mensal supervisionada + 50mg diária autoadministrada';
        dapsona = '50mg - 1 comprimido diário autoadministrado';
      } else {
        rifampicina = '600mg - 1 cápsula mensal supervisionada';
        clofazimina = '300mg - 2 cápsulas mensais supervisionadas + 50mg diária autoadministrada';
        dapsona = '100mg - 1 comprimido diário autoadministrado';
      }
      duration = '12 meses';
      totalCapsules = weight < 35 ? 84 : 96; // Estimativa total de cápsulas/comprimidos
      monthlyVisits = 12;
    } else {
      // Paucibacilar  
      if (weight < 35) {
        rifampicina = '450mg - 1 cápsula mensal supervisionada';
        dapsona = '50mg - 1 comprimido diário autoadministrado';
      } else {
        rifampicina = '600mg - 1 cápsula mensal supervisionada';
        dapsona = '100mg - 1 comprimido diário autoadministrado';
      }
      clofazimina = 'Não indicada para PB';
      duration = '6 meses';
      totalCapsules = weight < 35 ? 42 : 48;
      monthlyVisits = 6;
    }

    return {
      rifampicina,
      clofazimina,
      dapsona,
      duration,
      totalCapsules,
      monthlyVisits
    };
  };

  const handleCalculate = async () => {
    if (patientData.weight <= 0 || patientData.age <= 0) {
      alert('Por favor, preencha peso e idade válidos.');
      return;
    }

    setIsCalculating(true);
    
    // Simular processamento
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const result = calculateDoses();
    setCalculation(result);
    setIsCalculating(false);
  };

  const handleReset = () => {
    setPatientData({
      weight: 0,
      age: 0,
      classification: 'MB',
      hasContraindications: false,
      contraindicationDetails: ''
    });
    setCalculation(null);
  };

  return (
    <EducationalLayout>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 20px' }}>
        {/* Header */}
        <header style={{
          textAlign: 'center',
          marginBottom: '2rem',
          padding: '2rem 0',
          background: `linear-gradient(135deg, ${unbColors.primary} 0%, ${unbColors.secondary} 100%)`,
          borderRadius: '16px',
          color: 'white'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '1rem' }}>
            <CalculatorIcon size={48} color="white" />
            <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 'bold' }}>
              Calculadora PQT-U
            </h1>
          </div>
          <p style={{ fontSize: '1.2rem', opacity: 0.9, maxWidth: '600px', margin: '0 auto' }}>
            Cálculo automático de doses da Poliquimioterapia Única para tratamento da Hanseníase
          </p>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', alignItems: 'start' }}>
          {/* Formulário de entrada */}
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            border: '1px solid #e2e8f0'
          }}>
            <h2 style={{ margin: '0 0 1.5rem', color: unbColors.primary, fontSize: '1.5rem' }}>
              📋 Dados do Paciente
            </h2>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: unbColors.neutral }}>
                Peso (kg) *
              </label>
              <input
                type="number"
                min="1"
                max="200"
                value={patientData.weight || ''}
                onChange={(e) => setPatientData(prev => ({ ...prev, weight: Number(e.target.value) }))}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = unbColors.secondary}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: unbColors.neutral }}>
                Idade (anos) *
              </label>
              <input
                type="number"
                min="1"
                max="120"
                value={patientData.age || ''}
                onChange={(e) => setPatientData(prev => ({ ...prev, age: Number(e.target.value) }))}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = unbColors.secondary}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: unbColors.neutral }}>
                Classificação Operacional *
              </label>
              <select
                value={patientData.classification}
                onChange={(e) => setPatientData(prev => ({ ...prev, classification: e.target.value as 'MB' | 'PB' }))}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  boxSizing: 'border-box',
                  backgroundColor: 'white'
                }}
              >
                <option value="MB">Multibacilar (MB) - 2 ou mais lesões</option>
                <option value="PB">Paucibacilar (PB) - até 5 lesões</option>
              </select>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600', color: unbColors.neutral }}>
                <input
                  type="checkbox"
                  checked={patientData.hasContraindications}
                  onChange={(e) => setPatientData(prev => ({ ...prev, hasContraindications: e.target.checked }))}
                  style={{ transform: 'scale(1.2)' }}
                />
                Possui contraindicações ou alergias conhecidas
              </label>
            </div>

            {patientData.hasContraindications && (
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: unbColors.neutral }}>
                  Detalhes das contraindicações:
                </label>
                <textarea
                  value={patientData.contraindicationDetails}
                  onChange={(e) => setPatientData(prev => ({ ...prev, contraindicationDetails: e.target.value }))}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    boxSizing: 'border-box',
                    resize: 'vertical'
                  }}
                  placeholder="Descreva alergias, contraindicações ou condições especiais..."
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '2rem' }}>
              <button
                onClick={handleCalculate}
                disabled={isCalculating}
                style={{
                  flex: 1,
                  padding: '16px 24px',
                  background: unbColors.secondary,
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  cursor: isCalculating ? 'not-allowed' : 'pointer',
                  opacity: isCalculating ? 0.7 : 1,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => !isCalculating && (e.currentTarget.style.background = unbColors.primary)}
                onMouseLeave={(e) => !isCalculating && (e.currentTarget.style.background = unbColors.secondary)}
              >
                {isCalculating ? '⏳ Calculando...' : '🧮 Calcular Doses'}
              </button>
              
              <button
                onClick={handleReset}
                style={{
                  padding: '16px 24px',
                  background: 'transparent',
                  color: unbColors.neutral,
                  border: `2px solid ${unbColors.neutral}`,
                  borderRadius: '8px',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = unbColors.neutral;
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = unbColors.neutral;
                }}
              >
                🔄 Limpar
              </button>
            </div>
          </div>

          {/* Resultado do cálculo */}
          <div style={{
            background: calculation ? 'white' : '#f8fafc',
            padding: '2rem',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            border: calculation ? '1px solid #e2e8f0' : '2px dashed #cbd5e1',
            minHeight: '400px'
          }}>
            {calculation ? (
              <>
                <h2 style={{ margin: '0 0 1.5rem', color: unbColors.primary, fontSize: '1.5rem' }}>
                  ✅ Resultado do Cálculo
                </h2>

                <div style={{ marginBottom: '1.5rem', padding: '1rem', background: unbColors.alpha.primary, borderRadius: '8px' }}>
                  <h3 style={{ margin: '0 0 0.5rem', color: unbColors.primary }}>
                    📊 Resumo do Tratamento
                  </h3>
                  <p style={{ margin: '0 0 0.5rem' }}><strong>Duração:</strong> {calculation.duration}</p>
                  <p style={{ margin: '0 0 0.5rem' }}><strong>Consultas mensais:</strong> {calculation.monthlyVisits}</p>
                  <p style={{ margin: '0' }}><strong>Total estimado de medicamentos:</strong> {calculation.totalCapsules} unidades</p>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <h4 style={{ margin: '0 0 0.5rem', color: unbColors.primary }}>
                    💊 Rifampicina
                  </h4>
                  <p style={{ margin: 0, padding: '0.5rem', background: '#fef3f2', borderRadius: '4px', fontSize: '0.95rem' }}>
                    {calculation.rifampicina}
                  </p>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <h4 style={{ margin: '0 0 0.5rem', color: unbColors.primary }}>
                    🟣 Clofazimina
                  </h4>
                  <p style={{ margin: 0, padding: '0.5rem', background: '#fef7ff', borderRadius: '4px', fontSize: '0.95rem' }}>
                    {calculation.clofazimina}
                  </p>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ margin: '0 0 0.5rem', color: unbColors.primary }}>
                    🔵 Dapsona
                  </h4>
                  <p style={{ margin: 0, padding: '0.5rem', background: '#eff6ff', borderRadius: '4px', fontSize: '0.95rem' }}>
                    {calculation.dapsona}
                  </p>
                </div>

                {patientData.hasContraindications && (
                  <div style={{ 
                    padding: '1rem', 
                    background: '#fef3cd', 
                    border: '1px solid #fbbf24',
                    borderRadius: '8px' 
                  }}>
                    <h4 style={{ margin: '0 0 0.5rem', color: '#d97706' }}>
                      ⚠️ Atenção - Contraindicações Informadas
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.95rem', color: '#92400e' }}>
                      {patientData.contraindicationDetails || 'Paciente possui contraindicações. Avaliar ajustes necessários.'}
                    </p>
                  </div>
                )}

                <div style={{ 
                  marginTop: '1.5rem',
                  padding: '1rem',
                  background: '#f0f9ff',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  color: '#1e40af'
                }}>
                  <strong>📌 Importante:</strong> Este cálculo segue o PCDT Hanseníase 2022. 
                  Sempre confirme com profissional habilitado e considere condições clínicas específicas do paciente.
                </div>
              </>
            ) : (
              <div style={{ textAlign: 'center', color: '#64748b', padding: '2rem 0' }}>
                <CalculatorIcon size={64} color="#cbd5e1" />
                <h3 style={{ margin: '1rem 0 0.5rem', color: '#64748b' }}>
                  Aguardando dados do paciente
                </h3>
                <p style={{ margin: 0, fontSize: '0.95rem' }}>
                  Preencha os dados ao lado para calcular as doses da PQT-U
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Informações adicionais */}
        <section style={{
          marginTop: '3rem',
          padding: '2rem',
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ margin: '0 0 1.5rem', color: unbColors.primary }}>
            📚 Informações sobre a PQT-U
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            <div>
              <h3 style={{ color: unbColors.secondary, marginBottom: '0.5rem' }}>🎯 Esquema Terapêutico</h3>
              <ul style={{ marginLeft: '1rem', lineHeight: '1.6' }}>
                <li><strong>Multibacilar:</strong> 12 meses de tratamento</li>
                <li><strong>Paucibacilar:</strong> 6 meses de tratamento</li>
                <li>Consultas mensais supervisionadas obrigatórias</li>
              </ul>
            </div>
            
            <div>
              <h3 style={{ color: unbColors.secondary, marginBottom: '0.5rem' }}>⚠️ Precauções</h3>
              <ul style={{ marginLeft: '1rem', lineHeight: '1.6' }}>
                <li>Monitorar função hepática</li>
                <li>Atentar para reações adversas</li>
                <li>Não interromper o tratamento</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </EducationalLayout>
  );
}