/**
 * Calculadora de Dose Inteligente
 * Integra com PersonaRAG para validação e sugestões contextuais
 */

'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { PersonaRAGIntegration } from '@/services/personaRAGIntegration';
import { logEvent } from '@/services/analytics';
import { motion, AnimatePresence } from 'framer-motion';
import { secureLogger } from '@/utils/secureLogger';

export interface PatientData {
  weight: number;
  age: number;
  gender: 'M' | 'F';
  pregnant?: boolean;
  breastfeeding?: boolean;
  renalFunction: 'normal' | 'mild' | 'moderate' | 'severe';
  hepaticFunction: 'normal' | 'mild' | 'moderate' | 'severe';
}

export interface MedicationDose {
  name: string;
  standardDose: number;
  calculatedDose: number;
  unit: string;
  frequency: string;
  route: 'oral' | 'im' | 'iv';
  adjustmentReason?: string;
  warnings: string[];
  interactions: string[];
}

export interface DoseRecommendation {
  classification: 'PB' | 'MB';
  regimen: 'PQT-U' | 'PQT-MB';
  duration: number;
  medications: MedicationDose[];
  monitoring: string[];
  contraindications: string[];
  specialConsiderations: string[];
  confidence: number;
  ragValidation?: {
    verified: boolean;
    sources: string[];
    warnings: string[];
    ragResponse?: string;
  } | null;
}

interface IntelligentDoseCalculatorProps {
  onRecommendationGenerated: (recommendation: DoseRecommendation) => void;
  persona?: 'dr_gasnelio' | 'ga';
  enableRAGValidation?: boolean;
  className?: string;
}

export default function IntelligentDoseCalculator({
  onRecommendationGenerated,
  persona = 'dr_gasnelio',
  enableRAGValidation = true,
  className = ''
}: IntelligentDoseCalculatorProps) {
  const [patientData, setPatientData] = useState<Partial<PatientData>>({
    renalFunction: 'normal',
    hepaticFunction: 'normal'
  });
  const [lesionData, setLesionData] = useState({
    count: 1,
    type: 'macular' as 'macular' | 'infiltrative' | 'nodular',
    bacilloscopy: 'not_performed' as 'positive' | 'negative' | 'not_performed'
  });
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<DoseRecommendation | null>(null);
  const [ragValidation, setRagValidation] = useState<any>(null);
  const [validationStatus, setValidationStatus] = useState<'pending' | 'validating' | 'validated' | 'error'>('pending');

  const personaRAG = useMemo(() => PersonaRAGIntegration.getInstance(), []);

  // Validação RAG da recomendação
  const validateWithRAG = useCallback(async (recommendation: DoseRecommendation) => {
    if (!enableRAGValidation) return null;

    setValidationStatus('validating');
    
    try {
      const validationQuery = `
        Validar prescrição:
        - Classificação: ${recommendation.classification}
        - Esquema: ${recommendation.regimen}
        - Medicações: ${recommendation.medications.map(m => `${m.name} ${m.calculatedDose}${m.unit}`).join(', ')}
        - Paciente: ${patientData.weight}kg, ${patientData.age} anos
        - Função renal: ${patientData.renalFunction}
        - Função hepática: ${patientData.hepaticFunction}
        
        Confirme se as doses estão corretas e identifique potenciais problemas.
      `;

      const response = await personaRAG.queryWithPersona(
        validationQuery,
        persona,
        'dose_validation',
        []
      );

      const validation = {
        verified: response.confidence > 0.8,
        sources: response.ragSources || [],
        warnings: extractWarnings(response.response),
        ragResponse: response.response
      };

      setRagValidation(validation);
      setValidationStatus('validated');
      
      return validation;
    } catch (error) {
      secureLogger.error('RAG validation failed', error as Error, {
        component: 'IntelligentDoseCalculator',
        operation: 'validateWithRAG',
        persona
      });
      setValidationStatus('error');
      return null;
    }
  }, [personaRAG, persona, patientData, enableRAGValidation]);

  // Extrair warnings da resposta RAG
  const extractWarnings = (response: string): string[] => {
    const warnings: string[] = [];
    
    if (response.toLowerCase().includes('atenção') || response.toLowerCase().includes('cuidado')) {
      warnings.push('Requer atenção especial - revisar resposta do especialista');
    }
    if (response.toLowerCase().includes('contraindicado')) {
      warnings.push('Possível contraindicação identificada');
    }
    if (response.toLowerCase().includes('ajustar') || response.toLowerCase().includes('reduzir')) {
      warnings.push('Ajuste de dose pode ser necessário');
    }
    
    return warnings;
  };

  // Calcular doses baseado nos algoritmos padrão
  const calculateDoses = useCallback((patient: PatientData, lesions: { count: number; bacilloscopy?: string; type?: string; [key: string]: unknown }): DoseRecommendation => {
    const { weight, age, pregnant, renalFunction, hepaticFunction } = patient;
    
    // Determinar classificação
    const isMB = lesions.count > 5 || lesions.bacilloscopy === 'positive' || lesions.type === 'nodular';
    const classification = isMB ? 'MB' : 'PB';
    const regimen = isMB ? 'PQT-MB' : 'PQT-U';
    
    // Medicações base
    const medications: MedicationDose[] = [];
    
    // Rifampicina
    let rifampicinDose = weight < 50 ? 450 : 600;
    const rifampicinWarnings: string[] = [];
    
    if (hepaticFunction !== 'normal') {
      rifampicinWarnings.push('Monitorar função hepática - rifampicina é hepatotóxica');
      if (hepaticFunction === 'severe') {
        rifampicinDose *= 0.5;
      }
    }
    if (pregnant) {
      rifampicinWarnings.push('Segura na gravidez, mas monitorar');
    }

    medications.push({
      name: 'Rifampicina',
      standardDose: weight < 50 ? 450 : 600,
      calculatedDose: rifampicinDose,
      unit: 'mg',
      frequency: '1x/mês supervisionado',
      route: 'oral',
      adjustmentReason: hepaticFunction !== 'normal' ? 'Ajuste por disfunção hepática' : undefined,
      warnings: rifampicinWarnings,
      interactions: ['Contraceptivos orais', 'Warfarina', 'Antirretrovirais']
    });

    // Dapsona
    let dapsoneDose = 100;
    const dapsoneWarnings: string[] = [];
    
    if (age < 18) {
      dapsoneDose = Math.round(weight * 1.5); // 1-2mg/kg/dia
      dapsoneWarnings.push('Dose pediátrica calculada');
    }
    if (renalFunction !== 'normal') {
      dapsoneWarnings.push('Monitorar - excreção renal');
    }
    if (pregnant) {
      dapsoneWarnings.push('Segura na gravidez');
    }

    medications.push({
      name: 'Dapsona',
      standardDose: 100,
      calculatedDose: dapsoneDose,
      unit: 'mg',
      frequency: 'Diária',
      route: 'oral',
      adjustmentReason: age < 18 ? 'Dose pediátrica' : undefined,
      warnings: dapsoneWarnings,
      interactions: ['Probenecid', 'Trimetoprima']
    });

    // Clofazimina (apenas para MB)
    if (isMB) {
      let clofazimineDose = weight < 50 ? 150 : 300;
      const clofazimineWarnings = ['Hiperpigmentação da pele (reversível)', 'Pode causar dor abdominal'];
      
      if (pregnant) {
        clofazimineWarnings.push('Atravessa a placenta - usar com cautela');
      }

      medications.push({
        name: 'Clofazimina',
        standardDose: weight < 50 ? 150 : 300,
        calculatedDose: clofazimineDose,
        unit: 'mg',
        frequency: '1x/mês supervisionado + 50mg diários',
        route: 'oral',
        warnings: clofazimineWarnings,
        interactions: []
      });
    }

    // Monitoramento
    const monitoring = [
      'Hemograma completo mensal',
      'Função hepática (AST/ALT) mensal',
      'Avaliação neurológica mensal',
      'Pesquisa de efeitos adversos'
    ];

    if (isMB) {
      monitoring.push('Monitorar hiperpigmentação da pele');
    }

    // Contraindicações
    const contraindications: string[] = [];
    if (hepaticFunction === 'severe') {
      contraindications.push('Disfunção hepática grave - considerar esquemas alternativos');
    }

    // Considerações especiais
    const specialConsiderations: string[] = [];
    if (pregnant) {
      specialConsiderations.push('Gravidez: Monitoramento fetal especializado');
    }
    if (age > 65) {
      specialConsiderations.push('Idoso: Monitoramento intensivo de efeitos adversos');
    }

    return {
      classification,
      regimen,
      duration: isMB ? 12 : 6,
      medications,
      monitoring,
      contraindications,
      specialConsiderations,
      confidence: 0.9
    };
  }, []);

  // Processar cálculo completo
  const handleCalculate = useCallback(async () => {
    if (!patientData.weight || !patientData.age) {
      alert('Por favor, preencha peso e idade do paciente');
      return;
    }

    setLoading(true);
    setValidationStatus('pending');
    
    try {
      const recommendation = calculateDoses(patientData as PatientData, lesionData);
      
      // Validar com RAG se habilitado
      let ragValidationResult = null;
      if (enableRAGValidation) {
        ragValidationResult = await validateWithRAG(recommendation);
      }

      const finalRecommendation = {
        ...recommendation,
        ragValidation: ragValidationResult
      };

      setRecommendation(finalRecommendation);
      onRecommendationGenerated(finalRecommendation);

      // Analytics
      logEvent('EDUCATION', 'dose_calculated', JSON.stringify({
        classification: recommendation.classification,
        regimen: recommendation.regimen,
        patientWeight: patientData.weight,
        patientAge: patientData.age,
        ragValidated: !!ragValidationResult?.verified,
        persona
      }));

    } catch (error) {
      secureLogger.error('Dose calculation failed', error as Error, {
        component: 'IntelligentDoseCalculator',
        operation: 'handleCalculate',
        hasPatientData: !!patientData,
        hasLesionData: !!lesionData
      });
      alert('Erro ao calcular doses. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [patientData, lesionData, calculateDoses, validateWithRAG, onRecommendationGenerated, enableRAGValidation, persona]);

  return (
    <div className={`max-w-6xl mx-auto p-6 ${className}`}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Formulário de Entrada */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Calculadora de Dose Inteligente
            </h2>

            {/* Dados do Paciente */}
            <div className="space-y-4 mb-6">
              <h3 className="text-lg font-semibold text-gray-800">Dados do Paciente</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Peso (kg)
                  </label>
                  <input
                    type="number"
                    value={patientData.weight || ''}
                    onChange={(e) => setPatientData(prev => ({ ...prev, weight: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: 70"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Idade (anos)
                  </label>
                  <input
                    type="number"
                    value={patientData.age || ''}
                    onChange={(e) => setPatientData(prev => ({ ...prev, age: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: 35"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sexo
                  </label>
                  <select
                    value={patientData.gender || ''}
                    onChange={(e) => setPatientData(prev => ({ ...prev, gender: e.target.value as 'M' | 'F' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecionar</option>
                    <option value="M">Masculino</option>
                    <option value="F">Feminino</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Função Renal
                  </label>
                  <select
                    value={patientData.renalFunction || 'normal'}
                    onChange={(e) => setPatientData(prev => ({ ...prev, renalFunction: e.target.value as 'normal' | 'mild' | 'moderate' | 'severe' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="normal">Normal</option>
                    <option value="mild">Leve</option>
                    <option value="moderate">Moderada</option>
                    <option value="severe">Grave</option>
                  </select>
                </div>
              </div>

              {patientData.gender === 'F' && (
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={patientData.pregnant || false}
                      onChange={(e) => setPatientData(prev => ({ ...prev, pregnant: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Grávida</span>
                  </label>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={patientData.breastfeeding || false}
                      onChange={(e) => setPatientData(prev => ({ ...prev, breastfeeding: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-700">Amamentando</span>
                  </label>
                </div>
              )}
            </div>

            {/* Dados da Lesão */}
            <div className="space-y-4 mb-6">
              <h3 className="text-lg font-semibold text-gray-800">Apresentação Clínica</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Lesões
                </label>
                <input
                  type="number"
                  value={lesionData.count}
                  onChange={(e) => setLesionData(prev => ({ ...prev, count: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Baciloscopia
                </label>
                <select
                  value={lesionData.bacilloscopy}
                  onChange={(e) => setLesionData(prev => ({ ...prev, bacilloscopy: e.target.value as 'positive' | 'negative' | 'not_performed' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="not_performed">Não realizada</option>
                  <option value="positive">Positiva</option>
                  <option value="negative">Negativa</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleCalculate}
              disabled={loading || !patientData.weight || !patientData.age}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Calculando...' : 'Calcular Doses'}
            </button>
          </div>
        </div>

        {/* Resultados */}
        <div className="space-y-6">
          <AnimatePresence>
            {recommendation && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-lg shadow-lg p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">
                    Recomendação de Tratamento
                  </h3>
                  {enableRAGValidation && (
                    <div className="flex items-center space-x-2">
                      {validationStatus === 'validating' && (
                        <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                      )}
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        validationStatus === 'validated' 
                          ? ragValidation?.verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          : validationStatus === 'validating' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-gray-100 text-gray-800'
                      }`}>
                        {validationStatus === 'validated' 
                          ? ragValidation?.verified ? '✓ Validado' : '⚠ Revisar'
                          : validationStatus === 'validating' 
                            ? '🔄 Validando...'
                            : '○ Aguardando'
                        }
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-sm font-medium text-blue-900">Classificação</div>
                      <div className="text-lg font-bold text-blue-800">{recommendation.classification}</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="text-sm font-medium text-green-900">Esquema</div>
                      <div className="text-lg font-bold text-green-800">{recommendation.regimen}</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Medicações Prescritas:</h4>
                    <div className="space-y-3">
                      {recommendation.medications.map((med, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="font-medium text-gray-900">{med.name}</div>
                              <div className="text-sm text-gray-600">{med.frequency}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-bold text-lg text-blue-600">
                                {med.calculatedDose}{med.unit}
                              </div>
                              {med.adjustmentReason && (
                                <div className="text-xs text-orange-600">{med.adjustmentReason}</div>
                              )}
                            </div>
                          </div>
                          
                          {med.warnings.length > 0 && (
                            <div className="mt-2">
                              <div className="text-xs font-medium text-red-700 mb-1">Cuidados:</div>
                              <ul className="text-xs text-red-600 space-y-1">
                                {med.warnings.map((warning, wi) => (
                                  <li key={wi}>• {warning}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Monitoramento:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {recommendation.monitoring.map((item, index) => (
                        <li key={index}>• {item}</li>
                      ))}
                    </ul>
                  </div>

                  {recommendation.contraindications.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-red-800 mb-2">⚠️ Contraindicações:</h4>
                      <ul className="text-sm text-red-600 space-y-1">
                        {recommendation.contraindications.map((item, index) => (
                          <li key={index}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {ragValidation && ragValidation.warnings.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Alertas do Especialista:</h4>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        {ragValidation.warnings.map((warning: string, index: number) => (
                          <li key={index}>• {warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}