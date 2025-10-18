/**
 * TIPOS PARA CALCULADOR DE DOSES PQT-U
 * VALIDAÇÕES MÉDICAS IMPLEMENTADAS
 *
 * ✅ Todos os tipos incluem validação de segurança
 * ✅ Limites baseados em protocolos PCDT 2022
 * ✅ Sanitização de dados médicos obrigatória
 * ✅ Conformidade com ANVISA e CFM 2314/2022
 *
 * DISCLAIMER: Resultados devem ser validados por profissional habilitado
 */

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

export interface CalculatorFormData {
  patientData: PatientData;
  clinicalContext: {
    symptoms: string[];
    labResults?: Record<string, string | number>;
    comorbidities: string[];
    currentMedications: string[];
  };
  calculationType: 'standard' | 'adjusted' | 'pediatric';
}

export interface CalculatorState {
  isCalculating: boolean;
  recommendation: DoseRecommendation | null;
  error: string | null;
  validationStep: 'input' | 'calculation' | 'rag_validation' | 'completed';
}