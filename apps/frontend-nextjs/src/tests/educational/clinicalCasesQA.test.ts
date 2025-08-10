/**
 * Testes Automatizados para Casos Clínicos
 * Sistema QA para validação de qualidade educativa
 * 
 * @author Claude Code QA Specialist
 * @version 1.0.0
 */

import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import EducationalQAFramework, { QAValidationResult } from '@/utils/educationalQAFramework';
import { CLINICAL_CASES } from '@/data/clinicalCases';
import { ClinicalCase, StepResult } from '@/types/clinicalCases';

describe('Clinical Cases QA Validation Suite', () => {
  let qaFramework: EducationalQAFramework;
  
  beforeEach(() => {
    qaFramework = EducationalQAFramework.getInstance();
  });
  
  afterEach(() => {
    // Cleanup se necessário
  });

  // ===== TESTES DE PRECISÃO CLÍNICA =====
  
  describe('Clinical Accuracy Validation', () => {
    test('todos os casos clínicos devem ter conformidade PCDT 2022', async () => {
      for (const clinicalCase of CLINICAL_CASES) {
        const validation = await qaFramework.validateClinicalCase(clinicalCase);
        
        expect(validation.metrics.clinicalAccuracy.pcdt2022Compliance).toBe(true);
        expect(validation.metrics.clinicalAccuracy.score).toBeGreaterThanOrEqual(85);
        
        if (!validation.metrics.clinicalAccuracy.pcdt2022Compliance) {
          console.warn(`Caso ${clinicalCase.id} não conforme com PCDT 2022`);
        }
      }
    });
    
    test('cálculos de dose pediátrica devem ser precisos', async () => {
      const pediatricCases = CLINICAL_CASES.filter(c => c.category === 'pediatrico');
      
      for (const clinicalCase of pediatricCases) {
        const validation = await qaFramework.validateClinicalCase(clinicalCase);
        
        // Verificar se prescrição médica é obrigatória para < 30kg
        if (clinicalCase.patient.weight < 30) {
          const prescriptionStep = clinicalCase.steps.find(s => 
            s.interaction.checklistItems?.some(item => 
              item.id === 'prescriber_check'
            )
          );
          expect(prescriptionStep).toBeDefined();
        }
        
        expect(validation.metrics.clinicalAccuracy.dosageAccuracy).toBe(true);
      }
    });
    
    test('alertas de segurança devem estar presentes em casos complexos', async () => {
      const complexCases = CLINICAL_CASES.filter(c => 
        c.difficulty === 'avançado' || c.difficulty === 'complexo'
      );
      
      for (const clinicalCase of complexCases) {
        expect(clinicalCase.scenario.warningFlags).toBeDefined();
        expect(clinicalCase.scenario.warningFlags.length).toBeGreaterThan(0);
        
        // Verificar severidade apropriada
        const criticalWarnings = clinicalCase.scenario.warningFlags.filter(w => 
          w.severity === 'high' || w.severity === 'critical'
        );
        expect(criticalWarnings.length).toBeGreaterThan(0);
      }
    });
    
    test('referências científicas devem ser válidas e atualizadas', async () => {
      for (const clinicalCase of CLINICAL_CASES) {
        expect(clinicalCase.references).toBeDefined();
        expect(clinicalCase.references.length).toBeGreaterThan(0);
        
        // Verificar se há pelo menos uma referência primária
        const primaryReferences = clinicalCase.references.filter(r => 
          r.relevance === 'primary'
        );
        expect(primaryReferences.length).toBeGreaterThan(0);
        
        // Verificar tipos de referência apropriados
        const protocolReferences = clinicalCase.references.filter(r => 
          r.type === 'protocolo_nacional' || r.type === 'tese_doutorado'
        );
        expect(protocolReferences.length).toBeGreaterThan(0);
      }
    });
  });

  // ===== TESTES DE QUALIDADE EDUCATIVA =====
  
  describe('Educational Value Assessment', () => {
    test('todos os casos devem ter objetivos de aprendizagem claros', () => {
      CLINICAL_CASES.forEach(clinicalCase => {
        expect(clinicalCase.learningObjectives).toBeDefined();
        expect(clinicalCase.learningObjectives.length).toBeGreaterThanOrEqual(3);
        
        // Verificar se objetivos são específicos e mensuráveis
        clinicalCase.learningObjectives.forEach(objective => {
          expect(objective).toMatch(/^(Calcular|Identificar|Orientar|Estabelecer|Demonstrar|Aplicar)/);
          expect(objective.length).toBeGreaterThan(20);
        });
      });
    });
    
    test('feedback deve ser específico e educativo', () => {
      CLINICAL_CASES.forEach(clinicalCase => {
        clinicalCase.steps.forEach(step => {
          expect(step.validation.feedback.correct).toBeDefined();
          expect(step.validation.feedback.incorrect).toBeDefined();
          
          // Feedback deve ter explanação
          expect(step.validation.feedback.correct.explanation).toBeTruthy();
          expect(step.validation.feedback.incorrect.explanation).toBeTruthy();
          
          // Feedback incorreto deve ter sugestões de melhoria
          expect(step.validation.feedback.incorrect.improvementSuggestions).toBeDefined();
          expect(step.validation.feedback.incorrect.improvementSuggestions?.length).toBeGreaterThan(0);
        });
      });
    });
    
    test('progressão de dificuldade deve ser apropriada', () => {
      const difficultyOrder = ['básico', 'intermediário', 'avançado', 'complexo'];
      const estimatedTimes = {
        'básico': { min: 10, max: 20 },
        'intermediário': { min: 15, max: 25 },
        'avançado': { min: 20, max: 30 },
        'complexo': { min: 25, max: 40 }
      };
      
      CLINICAL_CASES.forEach(clinicalCase => {
        const timeRange = estimatedTimes[clinicalCase.difficulty];
        expect(clinicalCase.estimatedTime).toBeGreaterThanOrEqual(timeRange.min);
        expect(clinicalCase.estimatedTime).toBeLessThanOrEqual(timeRange.max);
        
        // Casos mais complexos devem ter mais steps
        if (clinicalCase.difficulty === 'complexo') {
          expect(clinicalCase.steps.length).toBeGreaterThanOrEqual(8);
        }
      });
    });
    
    test('casos devem ter elementos de engajamento adequados', () => {
      CLINICAL_CASES.forEach(clinicalCase => {
        // Verificar contexto social realístico
        expect(clinicalCase.patient.socialContext).toBeDefined();
        expect(clinicalCase.patient.socialContext.supportSystem.length).toBeGreaterThan(0);
        
        // Verificar apresentação envolvente
        expect(clinicalCase.scenario.presentation.length).toBeGreaterThan(100);
        
        // Verificar elementos de interatividade
        const interactiveSteps = clinicalCase.steps.filter(s => 
          s.interaction.type !== 'text_input'
        );
        expect(interactiveSteps.length).toBeGreaterThan(0);
      });
    });
  });

  // ===== TESTES DE CONSISTÊNCIA =====
  
  describe('Consistency Validation', () => {
    test('terminologia médica deve ser consistente entre casos', () => {
      const medicalTerms = new Set<string>();
      
      CLINICAL_CASES.forEach(clinicalCase => {
        // Coletar termos médicos
        if (clinicalCase.patient.clinicalPresentation.type) {
          medicalTerms.add(clinicalCase.patient.clinicalPresentation.type);
        }
      });
      
      // Verificar padronização de termos
      expect(medicalTerms.has('paucibacilar')).toBe(true);
      expect(medicalTerms.has('multibacilar')).toBe(true);
      
      // Não deve haver variações inconsistentes
      expect(medicalTerms.has('pauci-bacilar')).toBe(false);
      expect(medicalTerms.has('multi-bacilar')).toBe(false);
    });
    
    test('estrutura de steps deve seguir padrão consistente', () => {
      const expectedPhases = ['avaliacao_inicial', 'orientacoes_cuidado', 'pos_dispensacao'];
      
      CLINICAL_CASES.forEach(clinicalCase => {
        const phases = new Set(clinicalCase.steps.map(s => s.phase));
        
        // Todos os casos devem ter pelo menos as fases principais
        expect(phases.has('avaliacao_inicial')).toBe(true);
        expect(phases.has('orientacoes_cuidado')).toBe(true);
        
        // Verificar numeração sequencial
        const stepNumbers = clinicalCase.steps.map(s => s.stepNumber).sort();
        for (let i = 0; i < stepNumbers.length; i++) {
          expect(stepNumbers[i]).toBe(i + 1);
        }
      });
    });
    
    test('sistema de pontuação deve ser balanceado', () => {
      CLINICAL_CASES.forEach(clinicalCase => {
        const totalPoints = clinicalCase.steps.reduce((sum, step) => 
          sum + step.validation.points, 0
        );
        
        expect(totalPoints).toBeGreaterThanOrEqual(100);
        expect(totalPoints).toBeLessThanOrEqual(500);
        
        // Score de aprovação deve ser justo (60-80% dos pontos totais)
        expect(clinicalCase.assessment.passingScore).toBeGreaterThanOrEqual(totalPoints * 0.6);
        expect(clinicalCase.assessment.passingScore).toBeLessThanOrEqual(totalPoints * 0.8);
      });
    });
  });

  // ===== TESTES DE PERFORMANCE =====
  
  describe('Performance Validation', () => {
    test('carregamento de casos deve ser rápido', async () => {
      const startTime = performance.now();
      
      for (const clinicalCase of CLINICAL_CASES) {
        // Simular carregamento do caso
        expect(clinicalCase).toBeDefined();
        expect(clinicalCase.steps).toBeDefined();
        expect(clinicalCase.patient).toBeDefined();
      }
      
      const loadTime = performance.now() - startTime;
      expect(loadTime).toBeLessThan(100); // < 100ms para carregar todos os casos
    });
    
    test('validação QA não deve afetar performance significativamente', async () => {
      const sampleCase = CLINICAL_CASES[0];
      const iterations = 3;
      const times: number[] = [];
      
      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        await qaFramework.validateClinicalCase(sampleCase);
        times.push(performance.now() - startTime);
      }
      
      const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
      expect(avgTime).toBeLessThan(500); // < 500ms em média
    });
  });

  // ===== TESTES DE REGRESSÃO =====
  
  describe('Regression Tests', () => {
    test('não deve haver regressões nos casos existentes', async () => {
      // Este teste garante que mudanças não quebrem casos já validados
      const knownGoodCases = ['caso_001_pediatrico_basico'];
      
      for (const caseId of knownGoodCases) {
        const clinicalCase = CLINICAL_CASES.find(c => c.id === caseId);
        expect(clinicalCase).toBeDefined();
        
        if (clinicalCase) {
          const validation = await qaFramework.validateClinicalCase(clinicalCase);
          expect(validation.status).not.toBe('failed');
          expect(validation.overallScore).toBeGreaterThanOrEqual(80);
        }
      }
    });
    
    test('estrutura de dados deve manter compatibilidade', () => {
      // Verificar que propriedades essenciais ainda existem
      CLINICAL_CASES.forEach(clinicalCase => {
        // Propriedades core que nunca devem mudar
        expect(clinicalCase.id).toBeDefined();
        expect(clinicalCase.title).toBeDefined();
        expect(clinicalCase.patient).toBeDefined();
        expect(clinicalCase.scenario).toBeDefined();
        expect(clinicalCase.steps).toBeDefined();
        expect(clinicalCase.assessment).toBeDefined();
        
        // Tipos específicos devem ser mantidos
        expect(typeof clinicalCase.estimatedTime).toBe('number');
        expect(Array.isArray(clinicalCase.learningObjectives)).toBe(true);
        expect(Array.isArray(clinicalCase.steps)).toBe(true);
      });
    });
  });

  // ===== TESTES DE INTEGRAÇÃO =====
  
  describe('Integration Tests', () => {
    test('casos devem integrar bem com sistema de personas', async () => {
      const drGasnelioCase = CLINICAL_CASES.find(c => c.category === 'adulto');
      const gaCase = CLINICAL_CASES.find(c => c.category === 'pediatrico');
      
      expect(drGasnelioCase).toBeDefined();
      expect(gaCase).toBeDefined();
      
      // Verificar se feedback é apropriado para cada persona
      if (drGasnelioCase) {
        const technicalFeedback = drGasnelioCase.steps[0].validation.feedback.correct.message;
        expect(technicalFeedback).toMatch(/(protocolo|dosagem|farmacocinética|PCDT)/i);
      }
      
      if (gaCase) {
        const empathicFeedback = gaCase.steps[0].validation.feedback.correct.message;
        expect(empathicFeedback).toMatch(/(cuidado|família|tranquil|apoio)/i);
      }
    });
    
    test('casos devem ser compatíveis com sistema de certificação', () => {
      CLINICAL_CASES.forEach(clinicalCase => {
        expect(clinicalCase.assessment.certificationCriteria).toBeDefined();
        expect(clinicalCase.assessment.certificationCriteria.minimumScore).toBeGreaterThan(0);
        expect(clinicalCase.assessment.certificationCriteria.requiredSteps).toBeDefined();
        
        // Verificar que steps obrigatórios existem
        clinicalCase.assessment.certificationCriteria.requiredSteps.forEach(requiredStep => {
          const step = clinicalCase.steps.find(s => s.id === requiredStep);
          expect(step).toBeDefined();
        });
      });
    });
  });

  // ===== TESTES DE QUALIDADE DE DADOS =====
  
  describe('Data Quality Tests', () => {
    test('não deve haver dados duplicados ou inconsistentes', () => {
      const caseIds = new Set<string>();
      const stepIds = new Set<string>();
      
      CLINICAL_CASES.forEach(clinicalCase => {
        // IDs únicos para casos
        expect(caseIds.has(clinicalCase.id)).toBe(false);
        caseIds.add(clinicalCase.id);
        
        // IDs únicos para steps dentro de cada caso
        const caseStepIds = new Set<string>();
        clinicalCase.steps.forEach(step => {
          expect(caseStepIds.has(step.id)).toBe(false);
          caseStepIds.add(step.id);
        });
      });
    });
    
    test('todos os campos obrigatórios devem estar preenchidos', () => {
      CLINICAL_CASES.forEach(clinicalCase => {
        // Campos obrigatórios do caso
        expect(clinicalCase.title.trim()).toBeTruthy();
        expect(clinicalCase.patient.name.trim()).toBeTruthy();
        expect(clinicalCase.patient.age).toBeGreaterThan(0);
        expect(clinicalCase.patient.weight).toBeGreaterThan(0);
        
        // Campos obrigatórios dos steps
        clinicalCase.steps.forEach(step => {
          expect(step.title.trim()).toBeTruthy();
          expect(step.description.trim()).toBeTruthy();
          expect(step.instruction.trim()).toBeTruthy();
          expect(step.validation.clinicalRationale.trim()).toBeTruthy();
        });
      });
    });
  });
});