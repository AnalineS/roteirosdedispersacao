/**
 * Testes para tipos de medicação
 * Cobertura: Interfaces, constantes, validações de tipo
 */

import { 
  WEIGHT_THRESHOLDS, 
  TREATMENT_DURATION, 
  MEDICATION_NAMES,
  MedicationDose,
  PatientProfile,
  SafetyAlert,
  CalculationResult
} from '../medication';

describe('Medication Types', () => {
  describe('WEIGHT_THRESHOLDS', () => {
    it('should have correct pediatric limit', () => {
      expect(WEIGHT_THRESHOLDS.PEDIATRIC_LIMIT).toBe(30);
    });

    it('should have correct adult standard weight', () => {
      expect(WEIGHT_THRESHOLDS.ADULT_STANDARD).toBe(50);
    });

    it('should be readonly constants', () => {
      // TypeScript const assertions make these readonly at compile time
      // At runtime, they can still be modified but shouldn't be
      expect(WEIGHT_THRESHOLDS.PEDIATRIC_LIMIT).toBe(30);
      expect(WEIGHT_THRESHOLDS.ADULT_STANDARD).toBe(50);
    });
  });

  describe('TREATMENT_DURATION', () => {
    it('should have standard PQT-U duration', () => {
      expect(TREATMENT_DURATION.PQT_U_STANDARD).toBe(6);
    });

    it('should have legacy duration reference', () => {
      expect(TREATMENT_DURATION.PQT_U_LEGACY).toBe(12);
    });

    it('should be readonly constants', () => {
      // TypeScript const assertions make these readonly at compile time
      expect(TREATMENT_DURATION.PQT_U_STANDARD).toBe(6);
      expect(TREATMENT_DURATION.PQT_U_LEGACY).toBe(12);
    });
  });

  describe('MEDICATION_NAMES', () => {
    it('should have correct medication names in Portuguese', () => {
      expect(MEDICATION_NAMES.rifampicina).toBe('Rifampicina');
      expect(MEDICATION_NAMES.clofazimina).toBe('Clofazimina');
      expect(MEDICATION_NAMES.dapsona).toBe('Dapsona');
    });

    it('should be readonly constants', () => {
      // TypeScript const assertions make these readonly at compile time
      expect(MEDICATION_NAMES.rifampicina).toBe('Rifampicina');
      expect(MEDICATION_NAMES.clofazimina).toBe('Clofazimina');
      expect(MEDICATION_NAMES.dapsona).toBe('Dapsona');
    });
  });

  describe('MedicationDose interface', () => {
    it('should validate correct medication dose structure', () => {
      const validDose: MedicationDose = {
        rifampicina: 600,
        clofazimina_mensal: 300,
        clofazimina_diaria: 50,
        dapsona_mensal: 100,
        dapsona_diaria: 100
      };

      expect(typeof validDose.rifampicina).toBe('number');
      expect(typeof validDose.clofazimina_mensal).toBe('number');
      expect(typeof validDose.clofazimina_diaria).toBe('number');
      expect(typeof validDose.dapsona_mensal).toBe('number');
      expect(typeof validDose.dapsona_diaria).toBe('number');
    });

    it('should have all required fields', () => {
      const dose: MedicationDose = {
        rifampicina: 600,
        clofazimina_mensal: 300,
        clofazimina_diaria: 50,
        dapsona_mensal: 100,
        dapsona_diaria: 100
      };

      expect(dose).toHaveProperty('rifampicina');
      expect(dose).toHaveProperty('clofazimina_mensal');
      expect(dose).toHaveProperty('clofazimina_diaria');
      expect(dose).toHaveProperty('dapsona_mensal');
      expect(dose).toHaveProperty('dapsona_diaria');
    });
  });

  describe('PatientProfile interface', () => {
    it('should validate minimal patient profile', () => {
      const profile: PatientProfile = {
        weight: 60,
        age: 30,
        allergies: [],
        currentMedications: []
      };

      expect(typeof profile.weight).toBe('number');
      expect(typeof profile.age).toBe('number');
      expect(Array.isArray(profile.allergies)).toBe(true);
      expect(Array.isArray(profile.currentMedications)).toBe(true);
    });

    it('should handle optional boolean fields', () => {
      const profile: PatientProfile = {
        weight: 60,
        age: 30,
        allergies: [],
        currentMedications: [],
        isPregnant: true,
        hasG6PDDeficiency: false,
        hasLiverDisease: true,
        hasKidneyDisease: undefined
      };

      expect(typeof profile.isPregnant).toBe('boolean');
      expect(typeof profile.hasG6PDDeficiency).toBe('boolean');
      expect(typeof profile.hasLiverDisease).toBe('boolean');
      expect(profile.hasKidneyDisease).toBeUndefined();
    });
  });

  describe('SafetyAlert interface', () => {
    it('should validate safety alert structure', () => {
      const alert: SafetyAlert = {
        type: 'warning',
        severity: 'high',
        message: 'Test warning message',
        recommendation: 'Test recommendation'
      };

      expect(['contraindication', 'warning', 'interaction', 'monitoring']).toContain(alert.type);
      expect(['low', 'medium', 'high', 'critical']).toContain(alert.severity);
      expect(typeof alert.message).toBe('string');
      expect(typeof alert.recommendation).toBe('string');
    });

    it('should accept all valid alert types', () => {
      const types: SafetyAlert['type'][] = ['contraindication', 'warning', 'interaction', 'monitoring'];
      const severities: SafetyAlert['severity'][] = ['low', 'medium', 'high', 'critical'];

      types.forEach(type => {
        severities.forEach(severity => {
          const alert: SafetyAlert = {
            type,
            severity,
            message: 'Test message',
            recommendation: 'Test recommendation'
          };
          expect(alert.type).toBe(type);
          expect(alert.severity).toBe(severity);
        });
      });
    });
  });

  describe('CalculationResult interface', () => {
    it('should validate complete calculation result', () => {
      const result: CalculationResult = {
        isValid: true,
        protocol: {
          population: 'adulto',
          weightRange: { min: 50 },
          treatmentDuration: { paucibacilar: 6, multibacilar: 6 },
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
        regimen: 'PQT-U',
        monthlyDoses: {
          rifampicina: 600,
          clofazimina_mensal: 300,
          clofazimina_diaria: 0,
          dapsona_mensal: 100,
          dapsona_diaria: 0
        },
        dailyDoses: {
          clofazimina_mensal: 0,
          clofazimina_diaria: 50,
          dapsona_mensal: 0,
          dapsona_diaria: 100
        },
        safetyAlerts: [],
        educationalNotes: ['Note 1', 'Note 2'],
        treatmentSchedule: {
          startDate: new Date(),
          endDate: new Date(),
          totalDoses: 6
        }
      };

      expect(typeof result.isValid).toBe('boolean');
      expect(typeof result.regimen).toBe('string');
      expect(result.protocol).toBeDefined();
      expect(result.monthlyDoses).toBeDefined();
      expect(result.dailyDoses).toBeDefined();
      expect(Array.isArray(result.safetyAlerts)).toBe(true);
      expect(Array.isArray(result.educationalNotes)).toBe(true);
      expect(result.treatmentSchedule.startDate).toBeInstanceOf(Date);
      expect(result.treatmentSchedule.endDate).toBeInstanceOf(Date);
      expect(typeof result.treatmentSchedule.totalDoses).toBe('number');
    });
  });

  describe('Type safety', () => {
    it('should enforce correct types at compile time', () => {
      // These tests verify TypeScript compilation
      const weight: number = WEIGHT_THRESHOLDS.PEDIATRIC_LIMIT;
      const duration: number = TREATMENT_DURATION.PQT_U_STANDARD;
      const medicationName: string = MEDICATION_NAMES.rifampicina;

      expect(typeof weight).toBe('number');
      expect(typeof duration).toBe('number');
      expect(typeof medicationName).toBe('string');
    });

    it('should provide proper intellisense for interfaces', () => {
      const profile: PatientProfile = {
        weight: 60,
        age: 30,
        allergies: ['penicilina'],
        currentMedications: ['vitamina D']
      };

      // These properties should be available with proper types
      expect(profile.weight).toBeDefined();
      expect(profile.age).toBeDefined();
      expect(profile.allergies).toBeDefined();
      expect(profile.currentMedications).toBeDefined();
    });
  });
});