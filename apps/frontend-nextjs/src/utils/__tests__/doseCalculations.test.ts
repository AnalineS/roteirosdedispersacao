/**
 * Testes básicos para doseCalculations
 * Cobertura: Funções principais exportadas
 */

import { calculatePQTDoses, validatePatientProfile, calculatePQTUDoses, formatDose, validateCalculation } from '../doseCalculations';

describe('doseCalculations', () => {
  describe('calculatePQTDoses', () => {
    it('should calculate doses for adult weight', () => {
      const result = calculatePQTDoses(60);
      
      expect(result).toBeDefined();
      expect(result.isValid).toBe(true);
      expect(result.monthlyDoses).toBeDefined();
      expect(result.dailyDoses).toBeDefined();
      expect(result.monthlyDoses.rifampicina).toBe(600);
    });

    it('should calculate doses for pediatric weight', () => {
      const result = calculatePQTDoses(25);
      
      expect(result).toBeDefined();
      expect(result.isValid).toBe(true);
      expect(result.monthlyDoses.rifampicina).toBe(300);
      expect(result.monthlyDoses.clofazimina_mensal).toBe(150);
    });
  });

  describe('validatePatientProfile', () => {
    it('should validate correct profile', () => {
      const profile = {
        weight: 60,
        age: 30,
        allergies: [],
        currentMedications: []
      };
      
      const result = validatePatientProfile(profile);
      expect(result).toBe(true);
    });

    it('should reject invalid weight', () => {
      const profile = {
        weight: 5,
        age: 30,
        allergies: [],
        currentMedications: []
      };
      
      const result = validatePatientProfile(profile);
      expect(result).toBe(false);
    });

    it('should reject invalid age', () => {
      const profile = {
        weight: 60,
        age: -1,
        allergies: [],
        currentMedications: []
      };
      
      const result = validatePatientProfile(profile);
      expect(result).toBe(false);
    });
  });

  describe('calculatePQTUDoses', () => {
    it('should calculate doses with full profile', () => {
      const profile = {
        weight: 60,
        age: 30,
        allergies: [],
        currentMedications: []
      };
      
      const result = calculatePQTUDoses(profile);
      
      expect(result).toBeDefined();
      expect(result.isValid).toBe(true);
      expect(result.regimen).toBe('PQT-U');
      expect(result.safetyAlerts).toBeDefined();
      expect(result.educationalNotes).toBeDefined();
    });

    it('should include safety alerts', () => {
      const profile = {
        weight: 60,
        age: 30,
        allergies: [],
        currentMedications: []
      };
      
      const result = calculatePQTUDoses(profile);
      
      // Should always have at least the educational warning
      expect(result.safetyAlerts.length).toBeGreaterThan(0);
      expect(result.safetyAlerts[0].message).toContain('educacional');
    });
  });

  describe('formatDose', () => {
    it('should format rifampicina dose', () => {
      const formatted = formatDose('rifampicina', 600);
      
      expect(formatted).toContain('600');
      expect(formatted).toContain('mg');
      expect(formatted).toContain('300mg');
    });

    it('should format clofazimina dose', () => {
      const formatted = formatDose('clofazimina_mensal', 300);
      
      expect(formatted).toContain('300');
      expect(formatted).toContain('100mg');
    });
  });

  describe('validateCalculation', () => {
    it('should validate normal profile', () => {
      const profile = {
        weight: 60,
        age: 30,
        allergies: [],
        currentMedications: []
      };
      
      const result = validateCalculation(profile);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject very low weight', () => {
      const profile = {
        weight: 5,
        age: 30,
        allergies: [],
        currentMedications: []
      };
      
      const result = validateCalculation(profile);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should warn about high weight', () => {
      const profile = {
        weight: 200,
        age: 30,
        allergies: [],
        currentMedications: []
      };
      
      const result = validateCalculation(profile);
      
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('should handle boundary weights', () => {
      // Test pediatric boundary
      const pediatric = calculatePQTDoses(29);
      const adult = calculatePQTDoses(31);
      
      expect(pediatric.monthlyDoses.rifampicina).toBeLessThan(adult.monthlyDoses.rifampicina);
    });

    it('should include treatment schedule', () => {
      const result = calculatePQTDoses(60);
      
      expect(result.treatmentSchedule).toBeDefined();
      expect(result.treatmentSchedule.startDate).toBeInstanceOf(Date);
      expect(result.treatmentSchedule.endDate).toBeInstanceOf(Date);
      expect(result.treatmentSchedule.totalDoses).toBe(6);
    });

    it('should include educational notes', () => {
      const result = calculatePQTDoses(60);
      
      expect(result.educationalNotes).toBeDefined();
      expect(result.educationalNotes.length).toBeGreaterThan(0);
      expect(result.educationalNotes[0]).toContain('tese');
    });
  });
});