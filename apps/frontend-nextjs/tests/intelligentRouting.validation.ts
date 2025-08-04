/**
 * Validation Suite para Sistema de Roteamento Inteligente
 * QA Engineer: Validação completa da FASE 3.2.1
 */

import { analyzeQuestionRouting, getPersonaExpertise, isAmbiguousQuestion } from '@/services/intelligentRouting';
import type { Persona } from '@/services/api';

// Mock personas para teste
const mockPersonas: Record<string, Persona> = {
  dr_gasnelio: {
    name: 'Dr. Gasnelio',
    description: 'Especialista clínico em hanseníase',
    avatar: '👨‍⚕️',
    personality: 'Profissional e técnico',
    expertise: ['clinical', 'dosage', 'protocols', 'diagnosis'],
    response_style: 'Technical and precise',
    target_audience: 'Healthcare professionals',
    system_prompt: 'Clinical specialist',
    capabilities: ['diagnóstico', 'prescrição', 'protocolos'],
    example_questions: ['Qual a dose de rifampicina?'],
    limitations: ['Não faz diagnósticos definitivos'],
    response_format: {}
  },
  ga: {
    name: 'Gá',
    description: 'Especialista em educação e dispensação',
    avatar: '👩‍🎓',
    personality: 'Empática e educativa',
    expertise: ['education', 'dispensation', 'family', 'guidance'],
    response_style: 'Educational and supportive',
    target_audience: 'Patients and families',
    system_prompt: 'Educational specialist',
    capabilities: ['educação', 'orientação', 'apoio familiar'],
    example_questions: ['Como explicar para a família?'],
    limitations: ['Não substitui consulta médica'],
    response_format: {}
  }
};

// Casos de teste para validação funcional
interface TestCase {
  question: string;
  expectedPersona: string;
  expectedScope: string;
  minConfidence: number;
  description: string;
  category: 'clinical' | 'education' | 'ambiguous' | 'edge-case';
}

const testCases: TestCase[] = [
  // Casos Clínicos - Dr. Gasnelio
  {
    question: 'Qual a dose de rifampicina para adulto?',
    expectedPersona: 'dr_gasnelio',
    expectedScope: 'dosage',
    minConfidence: 0.7,
    description: 'Pergunta específica sobre dosagem',
    category: 'clinical'
  },
  {
    question: 'Como prescrever PQT-U para multibacilar?',
    expectedPersona: 'dr_gasnelio',
    expectedScope: 'clinical',
    minConfidence: 0.7,
    description: 'Pergunta sobre protocolo clínico',
    category: 'clinical'
  },
  {
    question: 'Paciente tem reação adversa à dapsona, o que fazer?',
    expectedPersona: 'dr_gasnelio',
    expectedScope: 'clinical',
    minConfidence: 0.6,
    description: 'Pergunta sobre efeitos colaterais',
    category: 'clinical'
  },
  {
    question: 'Qual o esquema de tratamento para hanseníase paucibacilar?',
    expectedPersona: 'dr_gasnelio',
    expectedScope: 'clinical',
    minConfidence: 0.8,
    description: 'Pergunta técnica sobre tratamento',
    category: 'clinical'
  },
  
  // Casos Educacionais - Gá
  {
    question: 'Como explicar para a família sobre a hanseníase?',
    expectedPersona: 'ga',
    expectedScope: 'education',
    minConfidence: 0.7,
    description: 'Pergunta sobre educação familiar',
    category: 'education'
  },
  {
    question: 'Paciente tem medo do preconceito, como orientar?',
    expectedPersona: 'ga',
    expectedScope: 'education',
    minConfidence: 0.6,
    description: 'Pergunta sobre apoio psicossocial',
    category: 'education'
  },
  {
    question: 'Como organizar cronograma de dispensação?',
    expectedPersona: 'ga',
    expectedScope: 'dispensation',
    minConfidence: 0.7,
    description: 'Pergunta sobre organização da dispensação',
    category: 'education'
  },
  {
    question: 'Paciente não entende a importância do tratamento',
    expectedPersona: 'ga',
    expectedScope: 'education',
    minConfidence: 0.6,
    description: 'Pergunta sobre aderência ao tratamento',
    category: 'education'
  },
  
  // Casos Ambíguos
  {
    question: 'Fale sobre hanseníase',
    expectedPersona: 'dr_gasnelio', // Default
    expectedScope: 'general',
    minConfidence: 0.3,
    description: 'Pergunta muito geral',
    category: 'ambiguous'
  },
  {
    question: 'Qual é o melhor tratamento?',
    expectedPersona: 'dr_gasnelio', // Default
    expectedScope: 'general',
    minConfidence: 0.4,
    description: 'Pergunta ambígua sobre tratamento',
    category: 'ambiguous'
  },
  
  // Edge Cases
  {
    question: '',
    expectedPersona: 'dr_gasnelio', // Default
    expectedScope: 'general',
    minConfidence: 0.3,
    description: 'String vazia',
    category: 'edge-case'
  },
  {
    question: 'xyz abc 123',
    expectedPersona: 'dr_gasnelio', // Default
    expectedScope: 'general',
    minConfidence: 0.3,
    description: 'Texto sem sentido',
    category: 'edge-case'
  },
  {
    question: 'Dose rifampicina família educação',
    expectedPersona: 'dr_gasnelio', // Rifampicina tem mais peso
    expectedScope: 'dosage',
    minConfidence: 0.5,
    description: 'Keywords misturadas',
    category: 'edge-case'
  }
];

/**
 * Executa validação funcional do algoritmo de roteamento
 */
export async function validateFunctionalRouting(): Promise<{
  passed: number;
  failed: number;
  results: Array<{
    test: TestCase;
    result: any;
    passed: boolean;
    issues: string[];
  }>;
}> {
  const results = [];
  let passed = 0;
  let failed = 0;

  console.log('🔍 INICIANDO VALIDAÇÃO FUNCIONAL DO ROTEAMENTO INTELIGENTE');
  console.log('=' .repeat(60));

  for (const testCase of testCases) {
    console.log(`\n📝 Testando: ${testCase.description}`);
    console.log(`   Pergunta: "${testCase.question}"`);
    
    try {
      const analysis = await analyzeQuestionRouting(testCase.question, mockPersonas);
      const issues: string[] = [];

      // Validar persona recomendada
      if (analysis.recommendedPersonaId !== testCase.expectedPersona) {
        issues.push(`Persona incorreta: esperado ${testCase.expectedPersona}, obtido ${analysis.recommendedPersonaId}`);
      }

      // Validar escopo
      if (analysis.scope !== testCase.expectedScope) {
        issues.push(`Escopo incorreto: esperado ${testCase.expectedScope}, obtido ${analysis.scope}`);
      }

      // Validar confiança mínima
      if (analysis.confidence < testCase.minConfidence && testCase.category !== 'ambiguous' && testCase.category !== 'edge-case') {
        issues.push(`Confiança baixa: esperado >= ${testCase.minConfidence}, obtido ${analysis.confidence.toFixed(2)}`);
      }

      // Validar estrutura da resposta
      if (!analysis.reasoning || analysis.reasoning.trim() === '') {
        issues.push('Reasoning vazio');
      }

      if (!Array.isArray(analysis.alternatives)) {
        issues.push('Alternatives deve ser um array');
      }

      const testPassed = issues.length === 0;
      if (testPassed) {
        passed++;
        console.log(`   ✅ PASSOU - Confiança: ${(analysis.confidence * 100).toFixed(1)}%`);
      } else {
        failed++;
        console.log(`   ❌ FALHOU - Issues: ${issues.join(', ')}`);
      }

      results.push({
        test: testCase,
        result: analysis,
        passed: testPassed,
        issues
      });

    } catch (error) {
      failed++;
      console.log(`   💥 ERRO: ${error.message}`);
      results.push({
        test: testCase,
        result: null,
        passed: false,
        issues: [`Erro na execução: ${error.message}`]
      });
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`📊 RESULTADO FINAL: ${passed} passou, ${failed} falhou`);
  console.log(`   Taxa de sucesso: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

  return { passed, failed, results };
}

/**
 * Valida casos específicos de alta prioridade
 */
export async function validateHighPriorityCases(): Promise<boolean> {
  const criticalCases = [
    'Qual a dose de rifampicina para adulto?',
    'Como explicar hanseníase para a família?',
    'Paciente tem reação à dapsona',
    'Como organizar dispensação na farmácia?'
  ];

  console.log('\n🎯 VALIDANDO CASOS CRÍTICOS DE ALTO IMPACTO');
  console.log('=' .repeat(50));

  let allPassed = true;

  for (const question of criticalCases) {
    try {
      const analysis = await analyzeQuestionRouting(question, mockPersonas);
      
      // Validações críticas
      const hasValidPersona = mockPersonas[analysis.recommendedPersonaId];
      const hasReasonableConfidence = analysis.confidence >= 0.5;
      const hasReasoning = analysis.reasoning && analysis.reasoning.length > 0;
      
      const criticalPassed = hasValidPersona && hasReasonableConfidence && hasReasoning;
      
      console.log(`📝 "${question}"`);
      console.log(`   → ${analysis.recommendedPersonaId} (${(analysis.confidence * 100).toFixed(1)}%) - ${criticalPassed ? '✅' : '❌'}`);
      
      if (!criticalPassed) {
        allPassed = false;
        if (!hasValidPersona) console.log('      ⚠️ Persona inválida');
        if (!hasReasonableConfidence) console.log('      ⚠️ Confiança muito baixa');
        if (!hasReasoning) console.log('      ⚠️ Reasoning vazio');
      }
    } catch (error) {
      console.log(`💥 ERRO: ${error.message}`);
      allPassed = false;
    }
  }

  return allPassed;
}

/**
 * Valida expertise das personas
 */
export function validatePersonaExpertise(): boolean {
  console.log('\n👥 VALIDANDO EXPERTISE DAS PERSONAS');
  console.log('=' .repeat(40));

  let allValid = true;

  Object.keys(mockPersonas).forEach(personaId => {
    const expertise = getPersonaExpertise(personaId);
    
    if (!expertise) {
      console.log(`❌ ${personaId}: Expertise não encontrada`);
      allValid = false;
      return;
    }

    // Validar estrutura
    const hasRequiredFields = expertise.personaId && 
                            Array.isArray(expertise.expertiseAreas) &&
                            Array.isArray(expertise.keywords) &&
                            Array.isArray(expertise.specialties);

    if (!hasRequiredFields) {
      console.log(`❌ ${personaId}: Estrutura de expertise inválida`);
      allValid = false;
      return;
    }

    // Validar conteúdo
    const hasContent = expertise.expertiseAreas.length > 0 &&
                      expertise.keywords.length > 0 &&
                      expertise.specialties.length > 0;

    if (!hasContent) {
      console.log(`❌ ${personaId}: Expertise sem conteúdo suficiente`);
      allValid = false;
      return;
    }

    console.log(`✅ ${personaId}: ${expertise.keywords.length} keywords, ${expertise.specialties.length} especialidades`);
  });

  return allValid;
}

/**
 * Testa detecção de perguntas ambíguas
 */
export async function validateAmbiguityDetection(): Promise<boolean> {
  console.log('\n🤷 VALIDANDO DETECÇÃO DE AMBIGUIDADE');
  console.log('=' .repeat(40));

  const ambiguousQuestions = [
    'O que fazer?',
    'Ajuda',
    'Não sei',
    'Fale sobre isso',
    ''
  ];

  const clearQuestions = [
    'Qual a dose de rifampicina?',
    'Como educar o paciente sobre hanseníase?',
    'Protocolo PQT-U para multibacilar'
  ];

  let allCorrect = true;

  // Testar questões ambíguas
  console.log('📝 Testando questões ambíguas:');
  for (const question of ambiguousQuestions) {
    try {
      const analysis = await analyzeQuestionRouting(question, mockPersonas);
      const isDetectedAsAmbiguous = isAmbiguousQuestion(analysis);
      
      console.log(`   "${question || '(vazio)'}" - ${isDetectedAsAmbiguous ? '✅' : '❌'} (${(analysis.confidence * 100).toFixed(1)}%)`);
      
      if (!isDetectedAsAmbiguous) {
        allCorrect = false;
      }
    } catch (error) {
      console.log(`   "${question}" - 💥 ERRO: ${error.message}`);
      allCorrect = false;
    }
  }

  // Testar questões claras
  console.log('\n📝 Testando questões claras:');
  for (const question of clearQuestions) {
    try {
      const analysis = await analyzeQuestionRouting(question, mockPersonas);
      const isDetectedAsAmbiguous = isAmbiguousQuestion(analysis);
      
      console.log(`   "${question}" - ${!isDetectedAsAmbiguous ? '✅' : '❌'} (${(analysis.confidence * 100).toFixed(1)}%)`);
      
      if (isDetectedAsAmbiguous) {
        allCorrect = false;
      }
    } catch (error) {
      console.log(`   "${question}" - 💥 ERRO: ${error.message}`);
      allCorrect = false;
    }
  }

  return allCorrect;
}

/**
 * Executa validação completa
 */
export async function runCompleteValidation() {
  console.log('🚀 INICIANDO VALIDAÇÃO COMPLETA DO SISTEMA DE ROTEAMENTO INTELIGENTE');
  console.log('🕒 ' + new Date().toLocaleString());
  console.log('='.repeat(80));

  const results = {
    functionalRouting: await validateFunctionalRouting(),
    highPriorityCases: await validateHighPriorityCases(),
    personaExpertise: validatePersonaExpertise(),
    ambiguityDetection: await validateAmbiguityDetection()
  };

  // Sumário final
  console.log('\n' + '='.repeat(80));
  console.log('📋 SUMÁRIO DA VALIDAÇÃO');
  console.log('='.repeat(80));
  
  console.log(`✅ Testes Funcionais: ${results.functionalRouting.passed}/${results.functionalRouting.passed + results.functionalRouting.failed}`);
  console.log(`${results.highPriorityCases ? '✅' : '❌'} Casos Críticos: ${results.highPriorityCases ? 'PASSOU' : 'FALHOU'}`);
  console.log(`${results.personaExpertise ? '✅' : '❌'} Expertise Personas: ${results.personaExpertise ? 'VÁLIDA' : 'INVÁLIDA'}`);
  console.log(`${results.ambiguityDetection ? '✅' : '❌'} Detecção Ambiguidade: ${results.ambiguityDetection ? 'FUNCIONANDO' : 'FALHANDO'}`);

  const overallSuccess = results.functionalRouting.passed > results.functionalRouting.failed &&
                        results.highPriorityCases &&
                        results.personaExpertise &&
                        results.ambiguityDetection;

  console.log('\n🎯 RESULTADO GERAL: ' + (overallSuccess ? '✅ SISTEMA APROVADO' : '❌ SISTEMA REQUER CORREÇÕES'));

  return results;
}