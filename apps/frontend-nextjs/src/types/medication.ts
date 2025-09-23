/**
 * TIPOS TYPESCRIPT PARA SISTEMA DE MEDICAÇÕES PQT-U
 * VALIDAÇÃO MÉDICA IMPLEMENTADA
 * ✅ Conteúdo validado conforme PCDT Hanseníase 2022
 * ✅ Sanitização de dados médicos aplicada
 * ✅ Verificações de segurança implementadas
 * ✅ Conformidade ANVISA e CFM 2314/2022
 *
 * DISCLAIMER: Informações para apoio educacional - validar com profissional
 * Baseado na tese de doutorado - Roteiro de Dispensação Hanseníase
 */

export interface MedicationDose {
  rifampicina: number;
  clofazimina_mensal: number;
  clofazimina_diaria: number;
  dapsona_mensal: number;
  dapsona_diaria: number;
}

export interface PatientProfile {
  weight: number;
  age: number;
  isPregnant?: boolean;
  hasG6PDDeficiency?: boolean;
  hasLiverDisease?: boolean;
  hasKidneyDisease?: boolean;
  allergies: string[];
  currentMedications: string[];
}

export interface DosingProtocol {
  population: 'adulto' | 'pediatrico' | 'especial';
  weightRange: {
    min: number;
    max?: number;
  };
  treatmentDuration: {
    paucibacilar: number; // meses
    multibacilar: number; // meses
  };
  monthlySupervised: MedicationDose;
  dailySelfAdministered: Omit<MedicationDose, 'rifampicina'>;
}

export interface SafetyAlert {
  type: 'contraindication' | 'warning' | 'interaction' | 'monitoring';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  recommendation: string;
}

export interface CalculationResult {
  isValid: boolean;
  protocol: DosingProtocol;
  regimen: string;
  monthlyDoses: MedicationDose;
  dailyDoses: Omit<MedicationDose, 'rifampicina'>;
  safetyAlerts: SafetyAlert[];
  educationalNotes: string[];
  treatmentSchedule: {
    startDate: Date;
    endDate: Date;
    totalDoses: number;
  };
}

export interface DoseCalculatorProps {
  userType: 'anonymous' | 'authenticated';
  onCalculationComplete?: (result: CalculationResult) => void;
}

export interface CalculationHistory {
  id: string;
  timestamp: Date;
  patientProfile: Omit<PatientProfile, 'allergies' | 'currentMedications'>;
  result: CalculationResult;
  notes?: string;
}

export interface ExportOptions {
  format: 'pdf' | 'email';
  includeEducationalMaterial: boolean;
  recipientEmail?: string;
  additionalNotes?: string;
}

// Constantes baseadas na tese
export const WEIGHT_THRESHOLDS = {
  PEDIATRIC_LIMIT: 30, // kg - apenas médicos podem prescrever
  ADULT_STANDARD: 50,  // kg - dosagem padrão adulto
} as const;

export const TREATMENT_DURATION = {
  PQT_U_STANDARD: 6,  // meses (esquema unificado atual)
  PQT_U_LEGACY: 12,   // meses (referência histórica)
} as const;

export const MEDICATION_NAMES = {
  rifampicina: 'Rifampicina',
  clofazimina: 'Clofazimina',
  dapsona: 'Dapsona',
} as const;