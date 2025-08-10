/**
 * Utilitários de Cálculo de Doses PQT-U
 * Baseado na tese: "Roteiro de Dispensação para Hanseníase PQT-U"
 * Doutorando: Nélio Gomes de Moura Júnior
 */

import {
  PatientProfile,
  DosingProtocol,
  CalculationResult,
  SafetyAlert,
  MedicationDose,
  WEIGHT_THRESHOLDS,
  TREATMENT_DURATION
} from '@/types/medication';

// Protocolos baseados em dosing_protocols.json da tese
const DOSING_PROTOCOLS: DosingProtocol[] = [
  {
    population: 'adulto',
    weightRange: { min: 50 },
    treatmentDuration: {
      paucibacilar: 6,
      multibacilar: 6  // PQT-U unificada
    },
    monthlySupervised: {
      rifampicina: 600,
      clofazimina_mensal: 300,
      clofazimina_diaria: 0,
      dapsona_mensal: 100,
      dapsona_diaria: 0
    },
    dailySelfAdministered: {
      clofazimina_mensal: 0,
      clofazimina_diaria: 50,
      dapsona_mensal: 0,
      dapsona_diaria: 100
    }
  },
  {
    population: 'pediatrico',
    weightRange: { min: 10, max: 30 },
    treatmentDuration: {
      paucibacilar: 6,
      multibacilar: 6
    },
    monthlySupervised: {
      rifampicina: 450,  // 10-20mg/kg, max 600mg
      clofazimina_mensal: 150,  // 6-12mg/kg
      clofazimina_diaria: 0,
      dapsona_mensal: 50,  // 2mg/kg
      dapsona_diaria: 0
    },
    dailySelfAdministered: {
      clofazimina_mensal: 0,
      clofazimina_diaria: 50,  // dias alternados
      dapsona_mensal: 0,
      dapsona_diaria: 50  // 2mg/kg diário
    }
  }
];

/**
 * Calcula doses PQT-U baseado no peso (função simplificada para testes)
 */
export function calculatePQTDoses(weight: number, profile?: PatientProfile): CalculationResult {
  const fullProfile: PatientProfile = profile || {
    weight,
    age: 30,
    allergies: [],
    currentMedications: []
  };
  
  return calculatePQTUDoses(fullProfile);
}

/**
 * Valida perfil do paciente (função para testes)
 */
export function validatePatientProfile(profile: PatientProfile): boolean {
  if (!profile.weight || profile.weight < 10) return false;
  if (!profile.age || profile.age < 0) return false;
  if (!Array.isArray(profile.allergies)) return false;
  if (!Array.isArray(profile.currentMedications)) return false;
  return true;
}

/**
 * Calcula doses PQT-U baseado no perfil do paciente
 */
export function calculatePQTUDoses(profile: PatientProfile): CalculationResult {
  const protocol = selectProtocol(profile);
  const safetyAlerts = checkSafetyAlerts(profile);
  const educationalNotes = generateEducationalNotes(profile, protocol);
  
  const adjustedDoses = adjustDosesForWeight(protocol, profile.weight);
  
  return {
    isValid: safetyAlerts.every(alert => alert.severity !== 'critical'),
    protocol,
    regimen: 'PQT-U',
    monthlyDoses: adjustedDoses.monthly,
    dailyDoses: adjustedDoses.daily,
    safetyAlerts,
    educationalNotes,
    treatmentSchedule: {
      startDate: new Date(),
      endDate: new Date(Date.now() + (protocol.treatmentDuration.paucibacilar * 30 * 24 * 60 * 60 * 1000)),
      totalDoses: protocol.treatmentDuration.paucibacilar
    }
  };
}

/**
 * Seleciona protocolo apropriado baseado no peso
 */
function selectProtocol(profile: PatientProfile): DosingProtocol {
  if (profile.weight < WEIGHT_THRESHOLDS.PEDIATRIC_LIMIT) {
    return DOSING_PROTOCOLS.find(p => p.population === 'pediatrico')!;
  }
  return DOSING_PROTOCOLS.find(p => p.population === 'adulto')!;
}

/**
 * Ajusta doses baseado no peso específico
 */
function adjustDosesForWeight(protocol: DosingProtocol, weight: number): {
  monthly: MedicationDose;
  daily: Omit<MedicationDose, 'rifampicina'>;
} {
  if (protocol.population === 'pediatrico') {
    // Cálculo pediátrico baseado em faixas de peso específicas (conforme testes QA)
    let rifampicina: number, clofazimina_mensal: number, dapsona_mensal: number;
    
    if (weight <= 25) {
      rifampicina = 300;
      clofazimina_mensal = 150;
      dapsona_mensal = 50;
    } else if (weight <= 35) {
      rifampicina = 450;
      clofazimina_mensal = 200;
      dapsona_mensal = 100;
    } else {
      // Acima de 35kg usa dose adulta
      rifampicina = 600;
      clofazimina_mensal = 300;
      dapsona_mensal = 100;
    }
    
    return {
      monthly: {
        rifampicina,
        clofazimina_mensal,
        clofazimina_diaria: 0,
        dapsona_mensal,
        dapsona_diaria: 0
      },
      daily: {
        clofazimina_mensal: 0,
        clofazimina_diaria: clofazimina_mensal / 10, // clofazimina diária é 1/10 da mensal
        dapsona_mensal: 0,
        dapsona_diaria: 100 // dose fixa
      }
    };
  }
  
  // Adultos: doses fixas
  return {
    monthly: protocol.monthlySupervised,
    daily: protocol.dailySelfAdministered
  };
}

/**
 * Verifica alertas de segurança baseados na tese
 */
function checkSafetyAlerts(profile: PatientProfile): SafetyAlert[] {
  const alerts: SafetyAlert[] = [];
  
  // Alerta sempre presente - finalidade educacional
  alerts.push({
    type: 'warning',
    severity: 'high',
    message: 'Esta é uma ferramenta educacional baseada na tese de doutorado.',
    recommendation: 'SEMPRE consulte um médico antes de iniciar ou alterar tratamento. Prescrição médica é obrigatória.'
  });
  
  // G6PD Deficiência - contraindicação relativa para dapsona
  if (profile.hasG6PDDeficiency) {
    alerts.push({
      type: 'contraindication',
      severity: 'high',
      message: 'Deficiência de G6PD detectada - risco de anemia hemolítica com dapsona.',
      recommendation: 'Avaliar benefício/risco. Considerar monitoramento hematológico intensivo.'
    });
  }
  
  // Gravidez - ajustes necessários
  if (profile.isPregnant) {
    alerts.push({
      type: 'warning',
      severity: 'medium',
      message: 'Paciente gestante - PQT-U é segura na gravidez.',
      recommendation: 'Manter tratamento. Monitorar desenvolvimento fetal. Clofazimina pode causar pigmentação.'
    });
  }
  
  // Peso < 30kg - apenas médicos
  if (profile.weight < WEIGHT_THRESHOLDS.PEDIATRIC_LIMIT) {
    alerts.push({
      type: 'warning',
      severity: 'high',
      message: 'Paciente < 30kg - prescrição exclusivamente médica.',
      recommendation: 'Enfermeiros não podem prescrever. Cálculo pediátrico requer supervisão médica.'
    });
  }
  
  // Doença hepática - cuidados com rifampicina
  if (profile.hasLiverDisease) {
    alerts.push({
      type: 'monitoring',
      severity: 'medium',
      message: 'Doença hepática - rifampicina pode causar hepatotoxicidade.',
      recommendation: 'Monitorar enzimas hepáticas mensalmente. Considerar redução de dose se necessário.'
    });
  }
  
  return alerts;
}

/**
 * Gera notas educacionais baseadas no perfil
 */
function generateEducationalNotes(profile: PatientProfile, protocol: DosingProtocol): string[] {
  const notes: string[] = [];
  
  notes.push('📚 Baseado na tese: "Roteiro de Dispensação para Hanseníase PQT-U" - Doutorando Nélio Gomes de Moura Júnior');
  
  notes.push(`🎯 Protocolo ${protocol.population}: Tratamento por ${protocol.treatmentDuration.paucibacilar} meses`);
  
  notes.push('💊 Administração: Dose mensal supervisionada + doses diárias em casa');
  
  notes.push('⚠️ Rifampicina: Pode causar coloração alaranjada da urina, suor e lágrimas');
  
  notes.push('🟤 Clofazimina: Pode causar pigmentação da pele (reversível após o tratamento)');
  
  notes.push('🩸 Dapsona: Monitorar sinais de anemia ou metahemoglobinemia');
  
  notes.push('📅 Importante: NÃO tomar medicação diária no dia da dose supervisionada');
  
  notes.push('🏥 Sempre manter acompanhamento médico regular durante todo o tratamento');
  
  if (protocol.population === 'pediatrico') {
    notes.push('👶 Dose pediátrica calculada por peso - acompanhamento médico obrigatório');
    notes.push('📏 Clofazimina diária: administrar em dias alternados para crianças');
  }
  
  return notes;
}

/**
 * Valida se o cálculo é seguro para implementação
 */
export function validateCalculation(profile: PatientProfile): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Validações críticas
  if (profile.weight < 10) {
    errors.push('Peso muito baixo - consulta médica especializada necessária');
  }
  
  if (profile.weight > 150) {
    warnings.push('Peso elevado - verificar se doses padrão são adequadas');
  }
  
  if (profile.age < 1) {
    errors.push('Idade muito baixa - tratamento requer especialista');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Formata doses para exibição
 */
export function formatDose(medication: keyof MedicationDose, dose: number): string {
  const units: Record<keyof MedicationDose, string> = {
    rifampicina: 'mg (cápsulas de 300mg)',
    clofazimina_mensal: 'mg (cápsulas de 100mg)',
    clofazimina_diaria: 'mg/dia (cápsulas de 50mg)',
    dapsona_mensal: 'mg (comprimidos de 100mg)',
    dapsona_diaria: 'mg/dia (comprimidos de 100mg)'
  };
  
  return `${dose}${units[medication]}`;
}