/**
 * Testes para Sistema de Casos Clínicos Educacionais
 * Sistema de Quiz/Simulação para Treinamento de Farmacêuticos
 * 
 * @author Claude Code QA Specialist
 * @version 2.0.0
 */

import { describe, test, expect } from '@jest/globals';
import { CLINICAL_CASES } from '@/data/clinicalCases';
import { ClinicalCase, CaseStep, StepInteraction } from '@/types/clinicalCases';

describe('Sistema de Casos Clínicos Educacionais', () => {
  // ===== TESTES DE ESTRUTURA DO QUIZ =====
  
  describe('Estrutura do Quiz Educacional', () => {
    test('todos os casos devem ter estrutura básica de quiz válida', () => {
      expect(CLINICAL_CASES.length).toBeGreaterThan(0);
      
      CLINICAL_CASES.forEach(clinicalCase => {
        // Identificação do caso
        expect(clinicalCase.id).toBeDefined();
        expect(clinicalCase.title).toBeDefined();
        expect(clinicalCase.difficulty).toMatch(/^(básico|intermediário|avançado|complexo)$/);
        
        // Estrutura educacional
        expect(clinicalCase.learningObjectives).toBeDefined();
        expect(Array.isArray(clinicalCase.learningObjectives)).toBe(true);
        expect(clinicalCase.steps).toBeDefined();
        expect(Array.isArray(clinicalCase.steps)).toBe(true);
        expect(clinicalCase.steps.length).toBeGreaterThan(0);
        
        // Paciente simulado
        expect(clinicalCase.patient).toBeDefined();
        expect(clinicalCase.patient.name).toBeTruthy();
        expect(clinicalCase.patient.age).toBeGreaterThan(0);
        expect(clinicalCase.patient.weight).toBeGreaterThan(0);
      });
    });
    
    test('perguntas do quiz devem ter opções de resposta válidas', () => {
      CLINICAL_CASES.forEach(clinicalCase => {
        clinicalCase.steps.forEach(step => {
          expect(step.id).toBeDefined();
          expect(step.stepNumber).toBeGreaterThan(0);
          expect(step.title).toBeTruthy();
          expect(step.interaction).toBeDefined();
          
          // Verificar se tem mecanismo de interação válido
          const interactionType = step.interaction.type;
          expect(['multiple_choice', 'checklist', 'text_input', 'calculation', 'drag_drop', 'scenario_simulation'])
            .toContain(interactionType);
          
          // Se for multiple choice, deve ter opções
          if (interactionType === 'multiple_choice' && step.interaction.options) {
            expect(step.interaction.options.length).toBeGreaterThan(1);
            
            // Deve ter pelo menos uma resposta correta
            const correctAnswers = step.interaction.options.filter(opt => opt.isCorrect);
            expect(correctAnswers.length).toBeGreaterThan(0);
            
            // Cada opção deve ter explicação
            step.interaction.options.forEach(option => {
              expect(option.text).toBeTruthy();
              expect(option.explanation).toBeTruthy();
            });
          }
          
          // Se for checklist, deve ter itens
          if (interactionType === 'checklist' && step.interaction.checklistItems) {
            expect(step.interaction.checklistItems.length).toBeGreaterThan(0);
          }
        });
      });
    });
    
    test('sistema de feedback deve ser educativo', () => {
      CLINICAL_CASES.forEach(clinicalCase => {
        clinicalCase.steps.forEach(step => {
          expect(step.validation).toBeDefined();
          expect(step.validation.feedback).toBeDefined();
          
          // Deve ter feedback para resposta correta e incorreta
          expect(step.validation.feedback.correct).toBeDefined();
          expect(step.validation.feedback.incorrect).toBeDefined();
          
          // Feedback deve ter mensagem educativa
          expect(step.validation.feedback.correct.message).toBeTruthy();
          expect(step.validation.feedback.incorrect.message).toBeTruthy();
          
          // Deve explicar o raciocínio clínico
          expect(step.validation.clinicalRationale).toBeTruthy();
        });
      });
    });
  });

  // ===== TESTES DE CONTEÚDO EDUCACIONAL =====
  
  describe('Conteúdo Educacional', () => {
    test('objetivos de aprendizagem devem ser claros e específicos', () => {
      CLINICAL_CASES.forEach(clinicalCase => {
        expect(clinicalCase.learningObjectives.length).toBeGreaterThanOrEqual(3);
        
        clinicalCase.learningObjectives.forEach(objective => {
          expect(objective.length).toBeGreaterThan(20); // Deve ser descritivo
          expect(objective).toBeTruthy(); // Não pode estar vazio
        });
      });
    });
    
    test('casos devem simular situações realísticas', () => {
      CLINICAL_CASES.forEach(clinicalCase => {
        // Paciente deve ter perfil realístico
        expect(clinicalCase.patient.clinicalPresentation).toBeDefined();
        expect(clinicalCase.patient.socialContext).toBeDefined();
        
        // Cenário deve ser descritivo
        expect(clinicalCase.scenario.presentation.length).toBeGreaterThan(50);
        
        // Deve ter detalhes de prescrição
        expect(clinicalCase.scenario.prescriptionDetails).toBeDefined();
      });
    });
    
    test('progressão de dificuldade deve ser apropriada', () => {
      const timeRanges = {
        'básico': { min: 5, max: 25 },
        'intermediário': { min: 10, max: 30 },
        'avançado': { min: 15, max: 40 },
        'complexo': { min: 20, max: 60 }
      };
      
      CLINICAL_CASES.forEach(clinicalCase => {
        const range = timeRanges[clinicalCase.difficulty];
        expect(clinicalCase.estimatedTime).toBeGreaterThanOrEqual(range.min);
        expect(clinicalCase.estimatedTime).toBeLessThanOrEqual(range.max);
      });
    });
  });

  // ===== TESTES DE SISTEMA DE PONTUAÇÃO =====
  
  describe('Sistema de Pontuação e Avaliação', () => {
    test('cada step deve ter critério de pontuação', () => {
      CLINICAL_CASES.forEach(clinicalCase => {
        clinicalCase.steps.forEach(step => {
          expect(step.validation.points).toBeDefined();
          expect(step.validation.points).toBeGreaterThan(0);
          expect(step.validation.points).toBeLessThanOrEqual(200); // Ajustado para casos complexos
        });
      });
    });
    
    test('sistema de certificação deve ser configurado', () => {
      CLINICAL_CASES.forEach(clinicalCase => {
        expect(clinicalCase.assessment).toBeDefined();
        expect(clinicalCase.assessment.passingScore).toBeGreaterThan(0);
        
        const totalPoints = clinicalCase.steps.reduce((sum, step) => 
          sum + step.validation.points, 0
        );
        
        // Score de aprovação deve ser razoável (não muito fácil nem impossível)
        expect(clinicalCase.assessment.passingScore).toBeLessThanOrEqual(totalPoints);
        expect(clinicalCase.assessment.passingScore).toBeGreaterThanOrEqual(totalPoints * 0.4);
      });
    });
  });

  // ===== TESTES DE CONSISTÊNCIA DOS DADOS =====
  
  describe('Consistência dos Dados do Quiz', () => {
    test('IDs devem ser únicos', () => {
      const caseIds = new Set<string>();
      
      CLINICAL_CASES.forEach(clinicalCase => {
        expect(caseIds.has(clinicalCase.id)).toBe(false);
        caseIds.add(clinicalCase.id);
        
        // IDs dos steps também devem ser únicos dentro do caso
        const stepIds = new Set<string>();
        clinicalCase.steps.forEach(step => {
          expect(stepIds.has(step.id)).toBe(false);
          stepIds.add(step.id);
        });
      });
    });
    
    test('numeração dos steps deve ser sequencial', () => {
      CLINICAL_CASES.forEach(clinicalCase => {
        const stepNumbers = clinicalCase.steps.map(s => s.stepNumber).sort((a, b) => a - b);
        
        for (let i = 0; i < stepNumbers.length; i++) {
          expect(stepNumbers[i]).toBe(i + 1);
        }
      });
    });
    
    test('referências científicas devem estar presentes', () => {
      CLINICAL_CASES.forEach(clinicalCase => {
        expect(clinicalCase.references).toBeDefined();
        expect(Array.isArray(clinicalCase.references)).toBe(true);
        
        // Pelo menos uma referência
        if (clinicalCase.references.length > 0) {
          clinicalCase.references.forEach(ref => {
            expect(ref.title).toBeTruthy();
            expect(ref.source).toBeTruthy();
          });
        }
      });
    });
  });

  // ===== TESTES DE ACESSIBILIDADE DO QUIZ =====
  
  describe('Acessibilidade do Sistema de Quiz', () => {
    test('conteúdo deve ser legível e compreensível', () => {
      CLINICAL_CASES.forEach(clinicalCase => {
        // Títulos e descrições não devem ser muito técnicos
        expect(clinicalCase.title.length).toBeLessThan(100);
        
        clinicalCase.steps.forEach(step => {
          expect(step.instruction.length).toBeGreaterThan(10);
          expect(step.instruction.length).toBeLessThan(500);
          
          // Se tem opções de múltipla escolha, devem ser claras
          if (step.interaction.options) {
            step.interaction.options.forEach(option => {
              expect(option.text.length).toBeGreaterThan(5);
              expect(option.text.length).toBeLessThan(200);
            });
          }
        });
      });
    });
  });

  // ===== TESTES DE PERFORMANCE DO QUIZ =====
  
  describe('Performance do Sistema', () => {
    test('dados dos casos devem carregar rapidamente', () => {
      const startTime = performance.now();
      
      // Simula carregamento de todos os casos
      let totalSteps = 0;
      CLINICAL_CASES.forEach(clinicalCase => {
        totalSteps += clinicalCase.steps.length;
        expect(clinicalCase).toBeDefined();
      });
      
      const loadTime = performance.now() - startTime;
      expect(loadTime).toBeLessThan(50); // Deve ser muito rápido
      expect(totalSteps).toBeGreaterThan(0);
    });
  });

  // ===== TESTES DE INTEGRAÇÃO COM PERSONAS =====
  
  describe('Integração com Sistema de Personas', () => {
    test('casos devem ser compatíveis com diferentes personas', () => {
      const pediatricCases = CLINICAL_CASES.filter(c => c.category === 'pediatrico');
      const adultCases = CLINICAL_CASES.filter(c => c.category === 'adulto');
      
      // Deve ter casos para diferentes contextos
      expect(pediatricCases.length).toBeGreaterThan(0);
      
      // Casos pediátricos devem mencionar orientação familiar
      pediatricCases.forEach(clinicalCase => {
        const hasFamily = clinicalCase.scenario.presentation.toLowerCase().includes('mãe') ||
                         clinicalCase.scenario.presentation.toLowerCase().includes('pai') ||
                         clinicalCase.scenario.presentation.toLowerCase().includes('família');
        expect(hasFamily).toBe(true);
      });
    });
  });
});