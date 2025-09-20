/**
 * Formulário de Avaliação Médica Inteligente
 * Integra com PersonaRAG para sugestões contextuais
 */

'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { PersonaRAGIntegration } from '@/services/personaRAGIntegration';
import { logEvent } from '@/services/analytics';
import { motion, AnimatePresence } from 'framer-motion';

export interface MedicalAssessmentData {
  // Dados do paciente
  patientInfo: {
    age: number;
    weight: number;
    height: number;
    gender: 'M' | 'F';
    pregnant?: boolean;
    breastfeeding?: boolean;
  };
  
  // Histórico médico
  medicalHistory: {
    previousTreatment: boolean;
    allergies: string[];
    currentMedications: string[];
    comorbidities: string[];
  };
  
  // Apresentação clínica
  clinicalPresentation: {
    lesionType: 'macular' | 'infiltrative' | 'nodular' | 'mixed';
    lesionCount: number;
    nerveInvolvement: boolean;
    sensoryLoss: boolean;
    motorWeakness: boolean;
  };
  
  // Exames complementares
  diagnosticTests: {
    bacilloscopy?: 'positive' | 'negative' | 'not_performed';
    biopsy?: 'compatible' | 'incompatible' | 'not_performed';
    elisa?: 'positive' | 'negative' | 'not_performed';
  };
}

export interface AssessmentRecommendation {
  classification: 'PB' | 'MB';
  treatment: 'PQT-U' | 'PQT-MB';
  duration: number; // em meses
  dosing: {
    rifampicin: string;
    dapsone: string;
    clofazimine?: string;
  };
  monitoring: string[];
  alerts: string[];
  confidence: number;
}

interface SmartAssessmentFormProps {
  onAssessmentComplete: (data: MedicalAssessmentData, recommendation: AssessmentRecommendation) => void;
  persona?: 'dr_gasnelio' | 'ga';
  enableRAGSuggestions?: boolean;
  className?: string;
}

type StepData = Partial<MedicalAssessmentData>;

interface StepFormProps {
  data: StepData;
  onUpdate: (data: StepData) => void;
}

export default function SmartAssessmentForm({
  onAssessmentComplete,
  persona = 'dr_gasnelio',
  enableRAGSuggestions = true,
  className = ''
}: SmartAssessmentFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [assessmentData, setAssessmentData] = useState<Partial<MedicalAssessmentData>>({});
  const [loading, setLoading] = useState(false);
  const [ragSuggestions, setRagSuggestions] = useState<string[]>([]);
  const [recommendation, setRecommendation] = useState<AssessmentRecommendation | null>(null);
  
  const personaRAG = useMemo(() => PersonaRAGIntegration.getInstance(), []);

  const steps = useMemo(() => [
    {
      id: 'patient_info',
      title: 'Dados do Paciente',
      description: 'Informações básicas do paciente'
    },
    {
      id: 'medical_history',
      title: 'Histórico Médico',
      description: 'Alergias, medicações e comorbidades'
    },
    {
      id: 'clinical_presentation',
      title: 'Apresentação Clínica',
      description: 'Características das lesões e sintomas'
    },
    {
      id: 'diagnostic_tests',
      title: 'Exames Complementares',
      description: 'Resultados de baciloscopia, biópsia, etc.'
    },
    {
      id: 'review',
      title: 'Revisão',
      description: 'Confirmação dos dados e recomendações'
    }
  ], []);

  // Buscar sugestões baseadas no contexto atual
  const fetchRAGSuggestions = useCallback(async (context: string) => {
    if (!enableRAGSuggestions) return;

    try {
      const response = await personaRAG.queryWithPersona(
        `Forneça sugestões clínicas para: ${context}`,
        persona,
        'assessment_form',
        []
      );

      if (response.response) {
        // Extrair sugestões do texto da resposta
        const suggestions = response.response
          .split('\n')
          .filter(line => line.trim().startsWith('-') || line.trim().startsWith('•'))
          .map(line => line.replace(/^[-•]\s*/, '').trim())
          .slice(0, 3); // Máximo 3 sugestões

        setRagSuggestions(suggestions);
      }
    } catch (error) {
      // Security: Do not log medical query details
      // Error handled silently to protect patient data
    }
  }, [personaRAG, persona, enableRAGSuggestions]);

  // Calcular recomendação baseada nos dados
  const calculateRecommendation = useCallback(async (data: MedicalAssessmentData): Promise<AssessmentRecommendation> => {
    const { clinicalPresentation, diagnosticTests, patientInfo } = data;
    
    // Lógica de classificação baseada nas diretrizes
    let classification: 'PB' | 'MB';
    let treatment: 'PQT-U' | 'PQT-MB';
    let duration: number;
    
    // Critérios para MB
    const isMB = clinicalPresentation.lesionCount > 5 || 
                 diagnosticTests.bacilloscopy === 'positive' ||
                 clinicalPresentation.lesionType === 'nodular';
    
    if (isMB) {
      classification = 'MB';
      treatment = 'PQT-MB';
      duration = 12;
    } else {
      classification = 'PB';
      treatment = 'PQT-U';
      duration = 6;
    }

    // Calcular doses baseadas no peso
    const weight = patientInfo.weight;
    const rifampicinDose = weight < 50 ? '450mg' : '600mg';
    const dapsoneDose = '100mg';
    const clofazimineDose = classification === 'MB' ? (weight < 50 ? '150mg' : '300mg') : undefined;

    // Alertas especiais
    const alerts: string[] = [];
    if (patientInfo.pregnant) {
      alerts.push('Gravidez: Monitorar desenvolvimento fetal');
    }
    if (data.medicalHistory.allergies.some(a => a.toLowerCase().includes('dapsona'))) {
      alerts.push('ALERTA: Alergia à dapsona - considerar alternativa');
    }

    // Monitoramento recomendado
    const monitoring = [
      'Hemograma mensal',
      'Função hepática trimestral',
      'Avaliação neurológica mensal',
      'Acompanhamento dermatológico'
    ];

    if (classification === 'MB') {
      monitoring.push('Monitoramento de hiperpigmentação (clofazimina)');
    }

    return {
      classification,
      treatment,
      duration,
      dosing: {
        rifampicin: rifampicinDose,
        dapsone: dapsoneDose,
        ...(clofazimineDose && { clofazimine: clofazimineDose })
      },
      monitoring,
      alerts,
      confidence: 0.85
    };
  }, []);

  // Processar formulário completo
  const handleFormSubmit = useCallback(async () => {
    const completeData = assessmentData as MedicalAssessmentData;
    
    setLoading(true);
    try {
      const rec = await calculateRecommendation(completeData);
      setRecommendation(rec);
      
      // Analytics - using secure medical logging
      // Only non-sensitive aggregated data
      logEvent('EDUCATION', 'medical_assessment_completed', JSON.stringify({
        classification: rec.classification, // Safe: medical classification only
        treatment_type: rec.treatment,     // Safe: protocol type only
        persona_used: persona,             // Safe: system setting
        confidence_level: Math.round(rec.confidence * 10) / 10 // Safe: rounded metric
        // Note: No patient data, doses, or personal info logged
      }));

      onAssessmentComplete(completeData, rec);
    } catch (error) {
      // Security: Medical assessment errors not logged to prevent data exposure
      // Error handled silently to protect patient data
    } finally {
      setLoading(false);
    }
  }, [assessmentData, calculateRecommendation, onAssessmentComplete, persona]);

  // Atualizar dados do step atual
  const updateStepData = useCallback((stepData: StepData) => {
    setAssessmentData(prev => ({
      ...prev,
      ...stepData
    }));
  }, []);

  // Buscar sugestões quando muda o step
  useEffect(() => {
    const step = steps[currentStep];
    if (step && enableRAGSuggestions) {
      fetchRAGSuggestions(`avaliação médica - ${step.description}`);
    }
  }, [currentStep, fetchRAGSuggestions, enableRAGSuggestions, steps]);

  const renderStepContent = () => {
    const step = steps[currentStep];
    
    switch (step.id) {
      case 'patient_info':
        return (
          <PatientInfoStep 
            data={assessmentData.patientInfo} 
            onUpdate={(data) => updateStepData({ patientInfo: data as MedicalAssessmentData['patientInfo'] })}
            suggestions={ragSuggestions}
          />
        );
      
      case 'medical_history':
        return (
          <MedicalHistoryStep 
            data={assessmentData.medicalHistory} 
            onUpdate={(data) => updateStepData({ medicalHistory: data as MedicalAssessmentData['medicalHistory'] })}
            suggestions={ragSuggestions}
          />
        );
      
      case 'clinical_presentation':
        return (
          <ClinicalPresentationStep 
            data={assessmentData.clinicalPresentation} 
            onUpdate={(data) => updateStepData({ clinicalPresentation: data as MedicalAssessmentData['clinicalPresentation'] })}
            suggestions={ragSuggestions}
          />
        );
      
      case 'diagnostic_tests':
        return (
          <DiagnosticTestsStep 
            data={assessmentData.diagnosticTests} 
            onUpdate={(data) => updateStepData({ diagnosticTests: data as MedicalAssessmentData['diagnosticTests'] })}
            suggestions={ragSuggestions}
          />
        );
      
      case 'review':
        return (
          <ReviewStep 
            data={assessmentData as MedicalAssessmentData}
            recommendation={recommendation}
            loading={loading}
            onSubmit={handleFormSubmit}
          />
        );
      
      default:
        return null;
    }
  };

  return (
    <div className={`max-w-4xl mx-auto p-6 ${className}`}>
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-gray-900">
            Avaliação Médica Inteligente
          </h2>
          <span className="text-sm text-gray-500">
            Paso {currentStep + 1} de {steps.length}
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <motion.div 
            className="bg-blue-600 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        
        <div className="flex justify-between mt-2">
          {steps.map((step, index) => (
            <div key={step.id} className={`text-xs ${index <= currentStep ? 'text-blue-600' : 'text-gray-400'}`}>
              {step.title}
            </div>
          ))}
        </div>
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-lg shadow-lg p-6 mb-6"
        >
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {steps[currentStep].title}
            </h3>
            <p className="text-gray-600">
              {steps[currentStep].description}
            </p>
          </div>
          
          {renderStepContent()}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      {currentStep < steps.length - 1 && (
        <div className="flex justify-between">
          <button
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={currentStep === 0}
            className="px-6 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
          
          <button
            onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Próximo
          </button>
        </div>
      )}

      {/* RAG Suggestions */}
      {enableRAGSuggestions && ragSuggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 bg-blue-50 rounded-lg p-4"
        >
          <h4 className="text-sm font-semibold text-blue-900 mb-2">
            💡 Sugestões do {persona === 'dr_gasnelio' ? 'Dr. Gasnélio' : 'Gá'}:
          </h4>
          <ul className="space-y-1">
            {ragSuggestions.map((suggestion, index) => (
              <li key={index} className="text-sm text-blue-800">
                • {suggestion}
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </div>
  );
}

// Interfaces específicas para cada step
interface PatientInfoStepProps {
  data: MedicalAssessmentData['patientInfo'] | undefined;
  onUpdate: (data: Partial<MedicalAssessmentData>) => void;
  suggestions: string[];
}

interface MedicalHistoryStepProps {
  data: MedicalAssessmentData['medicalHistory'] | undefined;
  onUpdate: (data: Partial<MedicalAssessmentData>) => void;
  suggestions: string[];
}

interface ClinicalPresentationStepProps {
  data: MedicalAssessmentData['clinicalPresentation'] | undefined;
  onUpdate: (data: Partial<MedicalAssessmentData>) => void;
  suggestions: string[];
}

interface DiagnosticTestsStepProps {
  data: MedicalAssessmentData['diagnosticTests'] | undefined;
  onUpdate: (data: Partial<MedicalAssessmentData>) => void;
  suggestions: string[];
}

interface ReviewStepProps {
  data: MedicalAssessmentData;
  recommendation: AssessmentRecommendation | null;
  loading: boolean;
  onSubmit: () => void;
}

// Componentes dos steps individuais
function PatientInfoStep({ data, onUpdate, suggestions }: PatientInfoStepProps) {
  const patientData = data;
  
  return (
    <div className="space-y-4">
      <h4 className="font-medium text-gray-900 mb-4">Informações do Paciente</h4>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Idade</label>
          <input
            type="number"
            value={patientData?.age || ''}
            onChange={(e) => onUpdate({ patientInfo: {
              age: Number(e.target.value),
              weight: patientData?.weight || 70,
              height: patientData?.height || 170,
              gender: patientData?.gender || 'M'
            } })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Ex: 35"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Peso (kg)</label>
          <input
            type="number"
            value={patientData?.weight || ''}
            onChange={(e) => onUpdate({ patientInfo: {
              age: patientData?.age || 18,
              weight: Number(e.target.value),
              height: patientData?.height || 170,
              gender: patientData?.gender || 'M'
            } })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Ex: 70"
          />
        </div>
      </div>
      
      {suggestions.length > 0 && (
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-sm text-blue-800">Sugestões:</p>
          <ul className="text-sm text-blue-700 mt-1">
            {suggestions.map((suggestion, i) => (
              <li key={i}>• {suggestion}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function MedicalHistoryStep({ data, onUpdate, suggestions }: MedicalHistoryStepProps) {
  const historyData = data;
  
  return (
    <div className="space-y-4">
      <h4 className="font-medium text-gray-900 mb-4">Histórico Médico</h4>
      
      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={historyData?.previousTreatment || false}
            onChange={(e) => onUpdate({
              medicalHistory: {
                ...historyData,
                previousTreatment: e.target.checked,
                allergies: historyData?.allergies || [],
                currentMedications: historyData?.currentMedications || [],
                comorbidities: historyData?.comorbidities || []
              }
            })}
            className="mr-2"
          />
          <span className="text-sm text-gray-700">Tratamento anterior para hanseníase</span>
        </label>
      </div>
      
      {suggestions.length > 0 && (
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-sm text-blue-800">Sugestões:</p>
          <ul className="text-sm text-blue-700 mt-1">
            {suggestions.map((suggestion, i) => (
              <li key={i}>• {suggestion}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ClinicalPresentationStep({ data, onUpdate, suggestions }: ClinicalPresentationStepProps) {
  const clinicalData = data;
  
  return (
    <div className="space-y-4">
      <h4 className="font-medium text-gray-900 mb-4">Apresentação Clínica</h4>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Número de Lesões</label>
        <input
          type="number"
          value={clinicalData?.lesionCount || 1}
          onChange={(e) => onUpdate({
            clinicalPresentation: {
              ...clinicalData,
              lesionCount: Number(e.target.value),
              lesionType: clinicalData?.lesionType || 'macular',
              nerveInvolvement: clinicalData?.nerveInvolvement || false,
              sensoryLoss: clinicalData?.sensoryLoss || false,
              motorWeakness: clinicalData?.motorWeakness || false
            }
          })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          min="1"
        />
      </div>
      
      {suggestions.length > 0 && (
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-sm text-blue-800">Sugestões:</p>
          <ul className="text-sm text-blue-700 mt-1">
            {suggestions.map((suggestion, i) => (
              <li key={i}>• {suggestion}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function DiagnosticTestsStep({ data, onUpdate, suggestions }: DiagnosticTestsStepProps) {
  const testData = data;
  
  return (
    <div className="space-y-4">
      <h4 className="font-medium text-gray-900 mb-4">Exames Complementares</h4>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Baciloscopia</label>
        <select
          value={testData?.bacilloscopy || 'not_performed'}
          onChange={(e) => onUpdate({
            diagnosticTests: {
              ...testData,
              bacilloscopy: e.target.value as 'positive' | 'negative' | 'not_performed'
            }
          })}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        >
          <option value="not_performed">Não realizada</option>
          <option value="positive">Positiva</option>
          <option value="negative">Negativa</option>
        </select>
      </div>
      
      {suggestions.length > 0 && (
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-sm text-blue-800">Sugestões:</p>
          <ul className="text-sm text-blue-700 mt-1">
            {suggestions.map((suggestion, i) => (
              <li key={i}>• {suggestion}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ReviewStep({ data, recommendation, loading, onSubmit }: ReviewStepProps) {
  return (
    <div className="space-y-6">
      <h4 className="font-semibold text-gray-900">Revisão dos Dados</h4>
      
      <div className="bg-gray-50 p-4 rounded-lg">
        <h5 className="font-medium mb-2">Dados do Paciente:</h5>
        <p>Idade: {data.patientInfo?.age} anos</p>
        <p>Peso: {data.patientInfo?.weight} kg</p>
        <p>Lesões: {data.clinicalPresentation?.lesionCount}</p>
        <p>Baciloscopia: {data.diagnosticTests?.bacilloscopy || 'Não realizada'}</p>
      </div>
      
      {recommendation && (
        <div className="bg-green-50 p-4 rounded-lg">
          <h5 className="font-medium mb-2">Recomendação:</h5>
          <p>Classificação: {recommendation.classification}</p>
          <p>Tratamento: {recommendation.treatment}</p>
          <p>Duração: {recommendation.duration} meses</p>
        </div>
      )}
      
      <button
        onClick={onSubmit}
        disabled={loading}
        className="w-full py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? 'Processando...' : 'Finalizar Avaliação'}
      </button>
    </div>
  );
}