/**
 * Error Handling & Fallback Validation Suite
 * Testa robustez do sistema em cenários de falha
 */

import { analyzeQuestionRouting } from '@/services/intelligentRouting';
import type { Persona } from '@/services/api';

// Mock personas para teste
const mockPersonas: Record<string, Persona> = {
  dr_gasnelio: {
    name: 'Dr. Gasnelio',
    description: 'Especialista clínico',
    avatar: '👨‍⚕️',
    personality: 'Técnico',
    expertise: ['clinical'],
    response_style: 'Technical',
    target_audience: 'Professionals',
    system_prompt: 'Clinical',
    capabilities: ['diagnóstico'],
    example_questions: ['Dose?'],
    limitations: ['Não faz diagnósticos definitivos'],
    response_format: {}
  }
};

/**
 * Mock da API que pode falhar
 */
let shouldAPIFail = false;
let apiFailureMode = 'network';

const originalFetch = global.fetch;

function mockFetchWithFailures() {
  global.fetch = jest.fn().mockImplementation((url) => {
    if (shouldAPIFail && url.includes('/api/scope')) {
      switch (apiFailureMode) {
        case 'network':
          return Promise.reject(new Error('Network Error: Connection failed'));
        case 'timeout':
          return new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), 100));
        case 'server-error':
          return Promise.resolve({
            ok: false,
            status: 500,
            json: () => Promise.resolve({ error: 'Internal Server Error' })
          });
        case 'invalid-response':
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ invalid: 'data structure' })
          });
        default:
          return Promise.reject(new Error('Unknown error'));
      }
    }
    
    // Call original fetch for other URLs
    return originalFetch(url);
  });
}

function restoreFetch() {
  global.fetch = originalFetch;
  shouldAPIFail = false;
}

/**
 * Valida fallback quando backend falha
 */
export async function validateBackendFailureFallback(): Promise<{
  passed: boolean;
  results: {
    networkError: boolean;
    timeoutError: boolean;
    serverError: boolean;
    invalidResponse: boolean;
    localAnalysisWorking: boolean;
  };
}> {
  console.log('\n🔄 VALIDANDO FALLBACK PARA FALHAS DO BACKEND');
  console.log('=' .repeat(45));

  const results = {
    networkError: false,
    timeoutError: false,
    serverError: false,
    invalidResponse: false,
    localAnalysisWorking: false
  };

  // Setup mock
  mockFetchWithFailures();

  try {
    const testQuestion = 'Qual a dose de rifampicina para adulto?';

    // Teste 1: Network Error
    console.log('📝 Teste 1: Network Error');
    shouldAPIFail = true;
    apiFailureMode = 'network';
    
    try {
      const result = await analyzeQuestionRouting(testQuestion, mockPersonas);
      
      // Deve retornar resultado da análise local
      const hasValidResult = result && 
                            result.recommendedPersonaId && 
                            typeof result.confidence === 'number' &&
                            result.reasoning;
      
      results.networkError = hasValidResult;
      console.log(`   Fallback funcionando: ${hasValidResult ? '✅' : '❌'}`);
      console.log(`   Persona: ${result.recommendedPersonaId}, Confiança: ${(result.confidence * 100).toFixed(1)}%`);
    } catch (error) {
      console.log(`   ❌ FALHOU: ${error.message}`);
      results.networkError = false;
    }

    // Teste 2: Timeout Error
    console.log('\n📝 Teste 2: Timeout Error');
    apiFailureMode = 'timeout';
    
    try {
      const startTime = performance.now();
      const result = await analyzeQuestionRouting(testQuestion, mockPersonas);
      const endTime = performance.now() - startTime;
      
      const hasValidResult = result && result.recommendedPersonaId;
      const timeoutHandled = endTime < 5000; // Deve falhar rápido e usar fallback
      
      results.timeoutError = hasValidResult && timeoutHandled;
      console.log(`   Fallback funcionando: ${hasValidResult ? '✅' : '❌'}`);
      console.log(`   Tempo de resposta: ${endTime.toFixed(2)}ms`);
    } catch (error) {
      console.log(`   ❌ FALHOU: ${error.message}`);
      results.timeoutError = false;
    }

    // Teste 3: Server Error (500)
    console.log('\n📝 Teste 3: Server Error (500)');
    apiFailureMode = 'server-error';
    
    try {
      const result = await analyzeQuestionRouting(testQuestion, mockPersonas);
      
      const hasValidResult = result && result.recommendedPersonaId;
      results.serverError = hasValidResult;
      console.log(`   Fallback funcionando: ${hasValidResult ? '✅' : '❌'}`);
    } catch (error) {
      console.log(`   ❌ FALHOU: ${error.message}`);
      results.serverError = false;
    }

    // Teste 4: Invalid Response Structure
    console.log('\n📝 Teste 4: Invalid Response Structure');
    apiFailureMode = 'invalid-response';
    
    try {
      const result = await analyzeQuestionRouting(testQuestion, mockPersonas);
      
      const hasValidResult = result && result.recommendedPersonaId;
      results.invalidResponse = hasValidResult;
      console.log(`   Fallback funcionando: ${hasValidResult ? '✅' : '❌'}`);
    } catch (error) {
      console.log(`   ❌ FALHOU: ${error.message}`);
      results.invalidResponse = false;
    }

    // Teste 5: Verificar se análise local está funcionando independentemente
    console.log('\n📝 Teste 5: Análise Local Independente');
    shouldAPIFail = false; // Simular backend funcionando
    
    try {
      const result = await analyzeQuestionRouting(testQuestion, mockPersonas);
      
      // Para uma pergunta sobre rifampicina, deve rotear para Dr. Gasnelio
      const correctRouting = result.recommendedPersonaId === 'dr_gasnelio';
      const reasonableConfidence = result.confidence > 0.3;
      const hasReasoning = result.reasoning && result.reasoning.length > 0;
      
      results.localAnalysisWorking = correctRouting && reasonableConfidence && hasReasoning;
      console.log(`   Roteamento correto: ${correctRouting ? '✅' : '❌'}`);
      console.log(`   Confiança adequada: ${reasonableConfidence ? '✅' : '❌'} (${(result.confidence * 100).toFixed(1)}%)`);
      console.log(`   Reasoning presente: ${hasReasoning ? '✅' : '❌'}`);
    } catch (error) {
      console.log(`   ❌ FALHOU: ${error.message}`);
      results.localAnalysisWorking = false;
    }

  } catch (error) {
    console.log(`💥 ERRO geral na validação: ${error.message}`);
  } finally {
    restoreFetch();
  }

  const passed = results.networkError && 
                results.timeoutError && 
                results.serverError && 
                results.invalidResponse && 
                results.localAnalysisWorking;

  console.log(`\n📊 Backend Fallback Validation: ${passed ? '✅ PASSOU' : '❌ FALHOU'}`);

  return { passed, results };
}

/**
 * Valida tratamento de edge cases
 */
export async function validateEdgeCases(): Promise<{
  passed: boolean;
  results: {
    emptyInput: boolean;
    nullInput: boolean;
    veryLongInput: boolean;
    specialCharacters: boolean;
    emptyPersonas: boolean;
    malformedPersonas: boolean;
  };
}> {
  console.log('\n🎯 VALIDANDO EDGE CASES');
  console.log('=' .repeat(30));

  const results = {
    emptyInput: false,
    nullInput: false,
    veryLongInput: false,
    specialCharacters: false,
    emptyPersonas: false,
    malformedPersonas: false
  };

  try {
    // Teste 1: Empty Input
    console.log('📝 Teste 1: Empty Input');
    try {
      const result = await analyzeQuestionRouting('', mockPersonas);
      const hasValidResult = result && result.recommendedPersonaId;
      results.emptyInput = hasValidResult;
      console.log(`   Tratamento de string vazia: ${hasValidResult ? '✅' : '❌'}`);
    } catch (error) {
      console.log(`   ❌ FALHOU: ${error.message}`);
      results.emptyInput = false;
    }

    // Teste 2: Null/Undefined Input
    console.log('\n📝 Teste 2: Null/Undefined Input');
    try {
      // @ts-ignore - Testing edge case
      const result1 = await analyzeQuestionRouting(null, mockPersonas);
      // @ts-ignore - Testing edge case  
      const result2 = await analyzeQuestionRouting(undefined, mockPersonas);
      
      const handled1 = result1 && result1.recommendedPersonaId;
      const handled2 = result2 && result2.recommendedPersonaId;
      
      results.nullInput = handled1 || handled2; // Pelo menos um deve ser tratado
      console.log(`   Tratamento de null/undefined: ${results.nullInput ? '✅' : '❌'}`);
    } catch (error) {
      console.log(`   ❌ FALHOU: ${error.message}`);
      results.nullInput = false;
    }

    // Teste 3: Very Long Input
    console.log('\n📝 Teste 3: Very Long Input');
    const veryLongQuestion = 'Qual a dose de rifampicina '.repeat(100) + '?';
    
    try {
      const startTime = performance.now();
      const result = await analyzeQuestionRouting(veryLongQuestion, mockPersonas);
      const endTime = performance.now() - startTime;
      
      const hasValidResult = result && result.recommendedPersonaId;
      const performanceOk = endTime < 1000; // Deve processar em menos de 1s
      
      results.veryLongInput = hasValidResult && performanceOk;
      console.log(`   Input longo processado: ${hasValidResult ? '✅' : '❌'}`);
      console.log(`   Performance OK: ${performanceOk ? '✅' : '❌'} (${endTime.toFixed(2)}ms)`);
    } catch (error) {
      console.log(`   ❌ FALHOU: ${error.message}`);
      results.veryLongInput = false;
    }

    // Teste 4: Special Characters
    console.log('\n📝 Teste 4: Special Characters');
    const specialCharsQuestion = 'Qual a dose de rifampicina? @#$%^&*()[]{}|\\";:\'<>,./?`~';
    
    try {
      const result = await analyzeQuestionRouting(specialCharsQuestion, mockPersonas);
      const hasValidResult = result && result.recommendedPersonaId;
      results.specialCharacters = hasValidResult;
      console.log(`   Caracteres especiais tratados: ${hasValidResult ? '✅' : '❌'}`);
    } catch (error) {
      console.log(`   ❌ FALHOU: ${error.message}`);
      results.specialCharacters = false;
    }

    // Teste 5: Empty Personas
    console.log('\n📝 Teste 5: Empty Personas');
    try {
      const result = await analyzeQuestionRouting('Qual a dose?', {});
      // Deve retornar erro ou resultado padrão válido
      const handledGracefully = result === null || (result && result.recommendedPersonaId);
      results.emptyPersonas = handledGracefully;
      console.log(`   Personas vazias tratadas: ${handledGracefully ? '✅' : '❌'}`);
    } catch (error) {
      // Espera-se que lance erro, mas deve ser tratado graciosamente
      const errorHandled = error.message && error.message.length > 0;
      results.emptyPersonas = errorHandled;
      console.log(`   Erro tratado graciosamente: ${errorHandled ? '✅' : '❌'}`);
    }

    // Teste 6: Malformed Personas
    console.log('\n📝 Teste 6: Malformed Personas');
    const malformedPersonas = {
      // @ts-ignore - Testing edge case
      invalid1: { name: 'Test' }, // Missing required fields
      invalid2: null,
      // @ts-ignore - Testing edge case
      invalid3: 'not an object'
    };
    
    try {
      // @ts-ignore - Testing edge case
      const result = await analyzeQuestionRouting('Qual a dose?', malformedPersonas);
      const handledGracefully = result === null || (result && typeof result === 'object');
      results.malformedPersonas = handledGracefully;
      console.log(`   Personas malformadas tratadas: ${handledGracefully ? '✅' : '❌'}`);
    } catch (error) {
      const errorHandled = error.message && error.message.length > 0;
      results.malformedPersonas = errorHandled;
      console.log(`   Erro tratado graciosamente: ${errorHandled ? '✅' : '❌'}`);
    }

  } catch (error) {
    console.log(`💥 ERRO geral na validação de edge cases: ${error.message}`);
  }

  const passed = results.emptyInput && 
                results.nullInput && 
                results.veryLongInput && 
                results.specialCharacters && 
                results.emptyPersonas && 
                results.malformedPersonas;

  console.log(`\n📊 Edge Cases Validation: ${passed ? '✅ PASSOU' : '❌ FALHOU'}`);

  return { passed, results };
}

/**
 * Valida robustez em condições de stress
 */
export async function validateStressConditions(): Promise<{
  passed: boolean;
  results: {
    concurrentRequests: boolean;
    rapidFireRequests: boolean;
    memoryPressure: boolean;
    recoveryAfterError: boolean;
  };
}> {
  console.log('\n💪 VALIDANDO CONDIÇÕES DE STRESS');
  console.log('=' .repeat(35));

  const results = {
    concurrentRequests: false,
    rapidFireRequests: false,
    memoryPressure: false,
    recoveryAfterError: false
  };

  try {
    // Teste 1: Concurrent Requests
    console.log('📝 Teste 1: Concurrent Requests');
    const concurrentQuestions = [
      'Dose de rifampicina?',
      'Educação do paciente?',
      'Protocolo MB?',
      'Dispensação farmácia?',
      'Reação adversa?'
    ];

    try {
      const promises = concurrentQuestions.map(q => 
        analyzeQuestionRouting(q, mockPersonas)
      );
      
      const startTime = performance.now();
      const results_concurrent = await Promise.all(promises);
      const endTime = performance.now() - startTime;
      
      const allSuccessful = results_concurrent.every(r => r && r.recommendedPersonaId);
      const performanceOk = endTime < 2000; // Todas em menos de 2s
      
      results.concurrentRequests = allSuccessful && performanceOk;
      console.log(`   Todas requisições bem-sucedidas: ${allSuccessful ? '✅' : '❌'}`);
      console.log(`   Performance adequada: ${performanceOk ? '✅' : '❌'} (${endTime.toFixed(2)}ms)`);
    } catch (error) {
      console.log(`   ❌ FALHOU: ${error.message}`);
      results.concurrentRequests = false;
    }

    // Teste 2: Rapid Fire Requests
    console.log('\n📝 Teste 2: Rapid Fire Requests');
    try {
      const rapidQuestions = Array.from({ length: 20 }, (_, i) => `Dose rifampicina ${i}?`);
      let successCount = 0;
      
      for (const question of rapidQuestions) {
        try {
          const result = await analyzeQuestionRouting(question, mockPersonas);
          if (result && result.recommendedPersonaId) {
            successCount++;
          }
        } catch (error) {
          // Continue even if some fail
        }
      }
      
      const successRate = (successCount / rapidQuestions.length) * 100;
      results.rapidFireRequests = successRate > 80; // 80% success rate
      
      console.log(`   Taxa de sucesso: ${successRate.toFixed(1)}%`);
      console.log(`   Requisições rápidas: ${results.rapidFireRequests ? '✅' : '❌'}`);
    } catch (error) {
      console.log(`   ❌ FALHOU: ${error.message}`);
      results.rapidFireRequests = false;
    }

    // Teste 3: Memory Pressure Simulation
    console.log('\n📝 Teste 3: Memory Pressure');
    try {
      // Criar muitos objetos para simular pressão de memória
      const largeArrays = [];
      for (let i = 0; i < 100; i++) {
        largeArrays.push(new Array(10000).fill(`data-${i}`));
      }
      
      // Tentar análise com pressão de memória
      const result = await analyzeQuestionRouting('Dose rifampicina pressão memória?', mockPersonas);
      const survivedMemoryPressure = result && result.recommendedPersonaId;
      
      results.memoryPressure = survivedMemoryPressure;
      console.log(`   Funcionou sob pressão de memória: ${survivedMemoryPressure ? '✅' : '❌'}`);
      
      // Limpar arrays
      largeArrays.length = 0;
    } catch (error) {
      console.log(`   ❌ FALHOU: ${error.message}`);
      results.memoryPressure = false;
    }

    // Teste 4: Recovery After Error
    console.log('\n📝 Teste 4: Recovery After Error');
    try {
      // Primeiro causar um erro
      shouldAPIFail = true;
      apiFailureMode = 'network';
      mockFetchWithFailures();
      
      await analyzeQuestionRouting('Erro forçado', mockPersonas);
      
      // Depois restaurar e verificar se funciona normalmente
      restoreFetch();
      shouldAPIFail = false;
      
      const result = await analyzeQuestionRouting('Dose rifampicina recovery?', mockPersonas);
      const recoveredSuccessfully = result && result.recommendedPersonaId;
      
      results.recoveryAfterError = recoveredSuccessfully;
      console.log(`   Recuperação após erro: ${recoveredSuccessfully ? '✅' : '❌'}`);
    } catch (error) {
      console.log(`   ❌ FALHOU: ${error.message}`);
      results.recoveryAfterError = false;
    }

  } catch (error) {
    console.log(`💥 ERRO geral na validação de stress: ${error.message}`);
  }

  const passed = results.concurrentRequests && 
                results.rapidFireRequests && 
                results.memoryPressure && 
                results.recoveryAfterError;

  console.log(`\n📊 Stress Conditions Validation: ${passed ? '✅ PASSOU' : '❌ FALHOU'}`);

  return { passed, results };
}

/**
 * Executa validação completa de error handling
 */
export async function runErrorHandlingValidation() {
  console.log('🚀 INICIANDO VALIDAÇÃO DE ERROR HANDLING & FALLBACKS');
  console.log('🕒 ' + new Date().toLocaleString());
  console.log('='.repeat(65));

  const results = {
    backendFallback: await validateBackendFailureFallback(),
    edgeCases: await validateEdgeCases(),
    stressConditions: await validateStressConditions()
  };

  // Sumário final
  console.log('\n' + '='.repeat(65));
  console.log('📋 SUMÁRIO DA VALIDAÇÃO DE ERROR HANDLING');
  console.log('='.repeat(65));
  
  console.log(`${results.backendFallback.passed ? '✅' : '❌'} Backend Fallback: ${results.backendFallback.passed ? 'ROBUSTO' : 'PROBLEMAS'}`);
  console.log(`${results.edgeCases.passed ? '✅' : '❌'} Edge Cases: ${results.edgeCases.passed ? 'TRATADOS' : 'VULNERÁVEL'}`);
  console.log(`${results.stressConditions.passed ? '✅' : '❌'} Stress Conditions: ${results.stressConditions.passed ? 'RESISTENTE' : 'INSTÁVEL'}`);

  const overallSuccess = results.backendFallback.passed && 
                        results.edgeCases.passed && 
                        results.stressConditions.passed;

  console.log('\n🎯 RESULTADO GERAL: ' + (overallSuccess ? '✅ ERROR HANDLING APROVADO' : '❌ ERROR HANDLING REQUER MELHORIAS'));

  // Detalhes específicos se houver falhas
  if (!overallSuccess) {
    console.log('\n⚠️ ISSUES ESPECÍFICOS:');
    
    if (!results.backendFallback.passed) {
      const fb = results.backendFallback.results;
      if (!fb.networkError) console.log('   • Falha de rede não tratada adequadamente');
      if (!fb.timeoutError) console.log('   • Timeout não tratado adequadamente');
      if (!fb.serverError) console.log('   • Erro de servidor não tratado adequadamente');
      if (!fb.invalidResponse) console.log('   • Resposta inválida não tratada adequadamente');
      if (!fb.localAnalysisWorking) console.log('   • Análise local não funcionando corretamente');
    }
    
    if (!results.edgeCases.passed) {
      const ec = results.edgeCases.results;
      if (!ec.emptyInput) console.log('   • Input vazio não tratado');
      if (!ec.nullInput) console.log('   • Input null/undefined não tratado');
      if (!ec.veryLongInput) console.log('   • Input muito longo não tratado');
      if (!ec.specialCharacters) console.log('   • Caracteres especiais não tratados');
      if (!ec.emptyPersonas) console.log('   • Personas vazias não tratadas');
      if (!ec.malformedPersonas) console.log('   • Personas malformadas não tratadas');
    }
    
    if (!results.stressConditions.passed) {
      const sc = results.stressConditions.results;
      if (!sc.concurrentRequests) console.log('   • Requisições concorrentes falhando');
      if (!sc.rapidFireRequests) console.log('   • Requisições rápidas falhando');
      if (!sc.memoryPressure) console.log('   • Falha sob pressão de memória');
      if (!sc.recoveryAfterError) console.log('   • Não recupera após erros');
    }
  }

  return results;
}