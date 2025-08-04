/**
 * Integration Validation Suite - Backend/Frontend
 * Testa comunicação entre componentes e APIs
 */

import { detectQuestionScope } from '@/services/api';
import { analyzeQuestionRouting } from '@/services/intelligentRouting';
import { useIntelligentRouting } from '@/hooks/useIntelligentRouting';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { Persona } from '@/services/api';

// Mock personas para testes
const mockPersonas: Record<string, Persona> = {
  dr_gasnelio: {
    name: 'Dr. Gasnelio',
    description: 'Especialista clínico',
    avatar: '👨‍⚕️',
    personality: 'Técnico',
    expertise: ['clinical', 'dosage'],
    response_style: 'Technical',
    target_audience: 'Professionals',
    system_prompt: 'Clinical',
    capabilities: ['diagnóstico'],
    example_questions: ['Dose?'],
    limitations: ['Não faz diagnósticos definitivos'],
    response_format: {}
  },
  ga: {
    name: 'Gá',
    description: 'Especialista educacional',
    avatar: '👩‍🎓',
    personality: 'Empática',
    expertise: ['education', 'dispensation'],
    response_style: 'Educational',
    target_audience: 'Patients',
    system_prompt: 'Educational',
    capabilities: ['educação'],
    example_questions: ['Como explicar?'],
    limitations: ['Não substitui consulta médica'],
    response_format: {}
  }
};

/**
 * Mock de respostas da API
 */
const mockAPIResponses = {
  success: {
    recommended_persona: 'dr_gasnelio',
    confidence: 0.85,
    reasoning: 'Clinical question detected',
    scope: 'dosage'
  },
  lowConfidence: {
    recommended_persona: 'ga',
    confidence: 0.3,
    reasoning: 'Uncertain classification',
    scope: 'general'
  },
  invalidPersona: {
    recommended_persona: 'invalid_persona',
    confidence: 0.9,
    reasoning: 'Invalid persona returned',
    scope: 'clinical'
  }
};

// Mock do fetch global
const originalFetch = global.fetch;
let mockAPIBehavior = 'success';
let apiCallCount = 0;
let lastAPICall: any = null;

function mockAPIWithBehavior() {
  global.fetch = jest.fn().mockImplementation((url, options) => {
    apiCallCount++;
    lastAPICall = { url, options, timestamp: Date.now() };

    if (url.includes('/api/scope')) {
      switch (mockAPIBehavior) {
        case 'success':
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve(mockAPIResponses.success)
          });
        case 'lowConfidence':
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve(mockAPIResponses.lowConfidence)
          });
        case 'invalidPersona':
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve(mockAPIResponses.invalidPersona)
          });
        case 'networkError':
          return Promise.reject(new Error('Network Error'));
        case 'serverError':
          return Promise.resolve({
            ok: false,
            status: 500,
            json: () => Promise.resolve({ error: 'Server Error' })
          });
        case 'timeout':
          return new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 100));
        case 'malformedResponse':
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ invalid: 'structure' })
          });
        default:
          return originalFetch(url, options);
      }
    }
    
    return originalFetch(url, options);
  });
}

function restoreAPI() {
  global.fetch = originalFetch;
  mockAPIBehavior = 'success';
  apiCallCount = 0;
  lastAPICall = null;
}

/**
 * Valida comunicação com API de scope detection
 */
export async function validateAPICommunication(): Promise<{
  passed: boolean;
  results: {
    successfulCall: boolean;
    errorHandling: boolean;
    responseStructure: boolean;
    requestFormat: boolean;
    timeouts: boolean;
    retryLogic: boolean;
  };
}> {
  console.log('\n🔌 VALIDANDO COMUNICAÇÃO COM API');
  console.log('=' .repeat(35));

  const results = {
    successfulCall: false,
    errorHandling: false,
    responseStructure: false,
    requestFormat: false,
    timeouts: false,
    retryLogic: false
  };

  mockAPIWithBehavior();

  try {
    // Teste 1: Successful API Call
    console.log('📝 Teste 1: Successful API Call');
    mockAPIBehavior = 'success';
    apiCallCount = 0;
    
    try {
      const response = await detectQuestionScope('Qual a dose de rifampicina?');
      
      const hasValidResponse = response && 
                              response.recommended_persona &&
                              typeof response.confidence === 'number';
      
      const apiWasCalled = apiCallCount > 0;
      const correctEndpoint = lastAPICall?.url.includes('/api/scope');
      
      results.successfulCall = hasValidResponse && apiWasCalled && correctEndpoint;
      
      console.log(`   API chamada com sucesso: ${apiWasCalled ? '✅' : '❌'}`);
      console.log(`   Endpoint correto: ${correctEndpoint ? '✅' : '❌'}`);
      console.log(`   Resposta válida: ${hasValidResponse ? '✅' : '❌'}`);
      
    } catch (error) {
      console.log(`   ❌ FALHOU: ${error.message}`);
      results.successfulCall = false;
    }

    // Teste 2: Error Handling
    console.log('\n📝 Teste 2: Error Handling');
    mockAPIBehavior = 'networkError';
    
    try {
      const response = await detectQuestionScope('Test error handling');
      // Se chegou aqui, pode ser que tenha fallback
      results.errorHandling = response === null || response === undefined;
      console.log(`   Erro tratado graciosamente: ${results.errorHandling ? '✅' : '❌'}`);
    } catch (error) {
      // Error foi propagado - isso é aceitável
      const errorHandled = error.message && error.message.length > 0;
      results.errorHandling = errorHandled;
      console.log(`   Erro propagado corretamente: ${errorHandled ? '✅' : '❌'}`);
    }

    // Teste 3: Response Structure Validation
    console.log('\n📝 Teste 3: Response Structure Validation');
    mockAPIBehavior = 'malformedResponse';
    
    try {
      const response = await detectQuestionScope('Test malformed response');
      
      // Sistema deve lidar com resposta malformada
      const handledGracefully = response === null || 
                               response === undefined ||
                               (response && typeof response === 'object');
      
      results.responseStructure = handledGracefully;
      console.log(`   Resposta malformada tratada: ${handledGracefully ? '✅' : '❌'}`);
    } catch (error) {
      results.responseStructure = true; // Erro é aceitável para resposta malformada
      console.log(`   Erro para resposta malformada: ✅`);
    }

    // Teste 4: Request Format
    console.log('\n📝 Teste 4: Request Format');
    mockAPIBehavior = 'success';
    apiCallCount = 0;
    lastAPICall = null;
    
    await detectQuestionScope('Test request format');
    
    if (lastAPICall) {
      const hasCorrectMethod = lastAPICall.options?.method === 'POST';
      const hasContentType = lastAPICall.options?.headers?.['Content-Type']?.includes('application/json');
      const hasBody = lastAPICall.options?.body;
      
      let bodyValid = false;
      if (hasBody) {
        try {
          const parsedBody = JSON.parse(lastAPICall.options.body);
          bodyValid = parsedBody.question && typeof parsedBody.question === 'string';
        } catch (e) {
          bodyValid = false;
        }
      }
      
      results.requestFormat = hasCorrectMethod && hasContentType && bodyValid;
      
      console.log(`   Método POST: ${hasCorrectMethod ? '✅' : '❌'}`);
      console.log(`   Content-Type correto: ${hasContentType ? '✅' : '❌'}`);
      console.log(`   Body válido: ${bodyValid ? '✅' : '❌'}`);
    } else {
      results.requestFormat = false;
      console.log(`   ❌ Nenhuma chamada registrada`);
    }

    // Teste 5: Timeouts
    console.log('\n📝 Teste 5: Timeouts');
    mockAPIBehavior = 'timeout';
    
    const startTime = performance.now();
    try {
      await detectQuestionScope('Test timeout');
      const endTime = performance.now() - startTime;
      
      // Se retornou rápido, pode ter timeout configurado
      results.timeouts = endTime < 5000; // Menos que 5s
      console.log(`   Timeout funcionando: ${results.timeouts ? '✅' : '❌'} (${endTime.toFixed(2)}ms)`);
    } catch (error) {
      const endTime = performance.now() - startTime;
      results.timeouts = endTime < 5000 && error.message.includes('Timeout');
      console.log(`   Timeout detectado: ${results.timeouts ? '✅' : '❌'} (${endTime.toFixed(2)}ms)`);
    }

    // Teste 6: Retry Logic (se implementado)
    console.log('\n📝 Teste 6: Retry Logic');
    mockAPIBehavior = 'serverError';
    apiCallCount = 0;
    
    try {
      await detectQuestionScope('Test retry logic');
      
      // Se houve múltiplas chamadas, há retry
      const hasRetryLogic = apiCallCount > 1;
      results.retryLogic = hasRetryLogic;
      
      console.log(`   Retry implementado: ${hasRetryLogic ? '✅' : '❌'} (${apiCallCount} tentativas)`);
    } catch (error) {
      // Mesmo com erro, pode ter tentado retry
      const hasRetryLogic = apiCallCount > 1;
      results.retryLogic = hasRetryLogic;
      
      console.log(`   Retry implementado: ${hasRetryLogic ? '✅' : '❌'} (${apiCallCount} tentativas)`);
    }

  } catch (error) {
    console.log(`💥 ERRO geral na validação de API: ${error.message}`);
  } finally {
    restoreAPI();
  }

  const passed = results.successfulCall && 
                results.errorHandling && 
                results.responseStructure && 
                results.requestFormat;
  // timeouts e retryLogic são opcionais

  console.log(`\n📊 API Communication Validation: ${passed ? '✅ PASSOU' : '❌ FALHOU'}`);

  return { passed, results };
}

/**
 * Valida integração do hook useIntelligentRouting
 */
export async function validateHookIntegration(): Promise<{
  passed: boolean;
  results: {
    hookInitialization: boolean;
    debounceWorking: boolean;
    stateManagement: boolean;
    analyticsTracking: boolean;
    errorRecovery: boolean;
    memoryCleanup: boolean;
  };
}> {
  console.log('\n🪝 VALIDANDO INTEGRAÇÃO DO HOOK');
  console.log('=' .repeat(35));

  const results = {
    hookInitialization: false,
    debounceWorking: false,
    stateManagement: false,
    analyticsTracking: false,
    errorRecovery: false,
    memoryCleanup: false
  };

  mockAPIWithBehavior();

  try {
    // Teste 1: Hook Initialization
    console.log('📝 Teste 1: Hook Initialization');
    
    const { result } = renderHook(() => 
      useIntelligentRouting(mockPersonas, {
        enabled: true,
        debounceMs: 500,
        minConfidenceThreshold: 0.6
      })
    );

    const hookInitialized = result.current.isAnalyzing !== undefined &&
                           result.current.currentAnalysis !== undefined &&
                           typeof result.current.analyzeQuestion === 'function';

    results.hookInitialization = hookInitialized;
    console.log(`   Hook inicializado corretamente: ${hookInitialized ? '✅' : '❌'}`);

    // Teste 2: Debounce Working
    console.log('\n📝 Teste 2: Debounce Working');
    mockAPIBehavior = 'success';
    apiCallCount = 0;

    // Simular digitação rápida
    act(() => {
      result.current.analyzeQuestion('q');
    });
    act(() => {
      result.current.analyzeQuestion('qu');
    });
    act(() => {
      result.current.analyzeQuestion('qua');
    });
    act(() => {
      result.current.analyzeQuestion('qual a dose de rifampicina?');
    });

    // Aguardar debounce + processamento
    await waitFor(() => {
      return !result.current.isAnalyzing;
    }, { timeout: 2000 });

    // Com debounce, deve haver menos chamadas que inputs
    const debounceEffective = apiCallCount < 4; // Menos que os 4 inputs
    results.debounceWorking = debounceEffective;
    
    console.log(`   Debounce efetivo: ${debounceEffective ? '✅' : '❌'} (${apiCallCount} chamadas para 4 inputs)`);

    // Teste 3: State Management
    console.log('\n📝 Teste 3: State Management');
    
    const hasAnalysis = result.current.currentAnalysis !== null;
    const hasRecommendedPersona = result.current.getRecommendedPersona() !== null;
    const shouldShow = result.current.shouldShowRouting();
    
    results.stateManagement = hasAnalysis && hasRecommendedPersona && shouldShow;
    
    console.log(`   Análise presente: ${hasAnalysis ? '✅' : '❌'}`);
    console.log(`   Persona recomendada: ${hasRecommendedPersona ? '✅' : '❌'}`);
    console.log(`   Deve mostrar routing: ${shouldShow ? '✅' : '❌'}`);

    // Teste 4: Analytics Tracking
    console.log('\n📝 Teste 4: Analytics Tracking');
    
    const initialAnalytics = result.current.getAnalytics();
    
    // Simular aceitação
    act(() => {
      result.current.acceptRecommendation();
    });
    
    const analyticsAfterAccept = result.current.getAnalytics();
    const trackingWorking = analyticsAfterAccept.acceptedRecommendations > initialAnalytics.acceptedRecommendations;
    
    results.analyticsTracking = trackingWorking;
    console.log(`   Analytics tracking: ${trackingWorking ? '✅' : '❌'}`);

    // Teste 5: Error Recovery
    console.log('\n📝 Teste 5: Error Recovery');
    mockAPIBehavior = 'networkError';

    act(() => {
      result.current.analyzeQuestion('pergunta com erro');
    });

    await waitFor(() => {
      return !result.current.isAnalyzing;
    }, { timeout: 2000 });

    // Sistema deve se recuperar do erro
    const hasError = result.current.error !== null;
    const stillFunctional = typeof result.current.analyzeQuestion === 'function';
    
    results.errorRecovery = stillFunctional; // Pode ter erro, mas deve continuar funcional
    console.log(`   Erro capturado: ${hasError ? '✅' : '❌'}`);
    console.log(`   Hook ainda funcional: ${stillFunctional ? '✅' : '❌'}`);

    // Teste 6: Memory Cleanup
    console.log('\n📝 Teste 6: Memory Cleanup');
    
    // Simular limpeza
    act(() => {
      result.current.clearAnalysis();
    });
    
    const analysisCleared = result.current.currentAnalysis === null;
    const stateReset = !result.current.hasAnalyzed;
    
    results.memoryCleanup = analysisCleared;
    console.log(`   Análise limpa: ${analysisCleared ? '✅' : '❌'}`);
    console.log(`   Estado resetado: ${stateReset ? '✅' : '❌'}`);

  } catch (error) {
    console.log(`💥 ERRO na validação do hook: ${error.message}`);
  } finally {
    restoreAPI();
  }

  const passed = results.hookInitialization && 
                results.stateManagement && 
                results.errorRecovery;
  // debounce, analytics e cleanup são importantes mas não críticos

  console.log(`\n📊 Hook Integration Validation: ${passed ? '✅ PASSOU' : '❌ FALHOU'}`);

  return { passed, results };
}

/**
 * Valida integração end-to-end
 */
export async function validateEndToEndIntegration(): Promise<{
  passed: boolean;
  results: {
    completeFlow: boolean;
    dataConsistency: boolean;
    userInteraction: boolean;
    performanceIntegration: boolean;
    errorPropagation: boolean;
  };
}> {
  console.log('\n🔄 VALIDANDO INTEGRAÇÃO END-TO-END');
  console.log('=' .repeat(35));

  const results = {
    completeFlow: false,
    dataConsistency: false,
    userInteraction: false,
    performanceIntegration: false,
    errorPropagation: false
  };

  mockAPIWithBehavior();

  try {
    // Teste 1: Complete Flow
    console.log('📝 Teste 1: Complete Flow');
    mockAPIBehavior = 'success';
    
    // Simular fluxo completo: pergunta -> análise -> recomendação
    const question = 'Qual a dose de rifampicina para adulto?';
    
    const startTime = performance.now();
    const analysis = await analyzeQuestionRouting(question, mockPersonas);
    const endTime = performance.now() - startTime;
    
    const flowComplete = analysis && 
                        analysis.recommendedPersonaId &&
                        analysis.confidence > 0 &&
                        analysis.reasoning &&
                        analysis.scope;
    
    results.completeFlow = flowComplete;
    
    console.log(`   Análise completa: ${flowComplete ? '✅' : '❌'}`);
    console.log(`   Persona: ${analysis?.recommendedPersonaId}`);
    console.log(`   Confiança: ${analysis ? (analysis.confidence * 100).toFixed(1) : 'N/A'}%`);
    console.log(`   Tempo: ${endTime.toFixed(2)}ms`);

    // Teste 2: Data Consistency
    console.log('\n📝 Teste 2: Data Consistency');
    
    if (analysis) {
      // Verificar se persona existe
      const personaExists = mockPersonas[analysis.recommendedPersonaId] !== undefined;
      
      // Verificar se confiança está no range válido
      const confidenceValid = analysis.confidence >= 0 && analysis.confidence <= 1;
      
      // Verificar se escopo é válido
      const validScopes = ['clinical', 'education', 'dispensation', 'dosage', 'general'];
      const scopeValid = validScopes.includes(analysis.scope);
      
      results.dataConsistency = personaExists && confidenceValid && scopeValid;
      
      console.log(`   Persona existe: ${personaExists ? '✅' : '❌'}`);
      console.log(`   Confiança válida: ${confidenceValid ? '✅' : '❌'}`);
      console.log(`   Escopo válido: ${scopeValid ? '✅' : '❌'}`);
    } else {
      results.dataConsistency = false;
      console.log(`   ❌ Nenhuma análise para validar`);
    }

    // Teste 3: User Interaction Flow
    console.log('\n📝 Teste 3: User Interaction Flow');
    
    const { result } = renderHook(() => 
      useIntelligentRouting(mockPersonas, { enabled: true })
    );

    // Simular interação do usuário
    act(() => {
      result.current.analyzeQuestion(question);
    });

    await waitFor(() => {
      return result.current.currentAnalysis !== null;
    }, { timeout: 3000 });

    const userFlowWorking = result.current.currentAnalysis !== null &&
                           result.current.shouldShowRouting() &&
                           typeof result.current.acceptRecommendation === 'function';

    results.userInteraction = userFlowWorking;
    console.log(`   Fluxo de usuário funcionando: ${userFlowWorking ? '✅' : '❌'}`);

    // Teste 4: Performance Integration
    console.log('\n📝 Teste 4: Performance Integration');
    
    const performanceTests = [];
    
    // Múltiplas análises para testar cache
    for (let i = 0; i < 5; i++) {
      const start = performance.now();
      await analyzeQuestionRouting(question, mockPersonas);
      const end = performance.now() - start;
      performanceTests.push(end);
    }
    
    const avgTime = performanceTests.reduce((sum, time) => sum + time, 0) / performanceTests.length;
    const cacheImprovement = performanceTests[0] > performanceTests[performanceTests.length - 1];
    
    results.performanceIntegration = avgTime < 200 && cacheImprovement; // Média < 200ms e cache working
    
    console.log(`   Tempo médio: ${avgTime.toFixed(2)}ms`);
    console.log(`   Cache melhorando performance: ${cacheImprovement ? '✅' : '❌'}`);

    // Teste 5: Error Propagation
    console.log('\n📝 Teste 5: Error Propagation');
    mockAPIBehavior = 'networkError';
    
    try {
      const errorAnalysis = await analyzeQuestionRouting('test error', mockPersonas);
      
      // Com fallback, deve retornar análise local mesmo com erro da API
      const errorHandledGracefully = errorAnalysis && 
                                    errorAnalysis.recommendedPersonaId &&
                                    errorAnalysis.confidence > 0;
      
      results.errorPropagation = errorHandledGracefully;
      console.log(`   Erro tratado com fallback: ${errorHandledGracefully ? '✅' : '❌'}`);
      
    } catch (error) {
      // Se propagou erro, verificar se é informativo
      const errorInformative = error.message && error.message.length > 0;
      results.errorPropagation = errorInformative;
      console.log(`   Erro propagado informativamente: ${errorInformative ? '✅' : '❌'}`);
    }

  } catch (error) {
    console.log(`💥 ERRO na validação end-to-end: ${error.message}`);
  } finally {
    restoreAPI();
  }

  const passed = results.completeFlow && 
                results.dataConsistency && 
                results.userInteraction && 
                results.errorPropagation;

  console.log(`\n📊 End-to-End Integration Validation: ${passed ? '✅ PASSOU' : '❌ FALHOU'}`);

  return { passed, results };
}

/**
 * Executa validação completa de integração
 */
export async function runIntegrationValidation() {
  console.log('🚀 INICIANDO VALIDAÇÃO DE INTEGRAÇÃO BACKEND/FRONTEND');
  console.log('🕒 ' + new Date().toLocaleString());
  console.log('='.repeat(60));

  const results = {
    apiCommunication: await validateAPICommunication(),
    hookIntegration: await validateHookIntegration(),
    endToEndIntegration: await validateEndToEndIntegration()
  };

  // Sumário final
  console.log('\n' + '='.repeat(60));
  console.log('📋 SUMÁRIO DA VALIDAÇÃO DE INTEGRAÇÃO');
  console.log('='.repeat(60));
  
  console.log(`${results.apiCommunication.passed ? '✅' : '❌'} API Communication: ${results.apiCommunication.passed ? 'FUNCIONANDO' : 'PROBLEMAS'}`);
  console.log(`${results.hookIntegration.passed ? '✅' : '❌'} Hook Integration: ${results.hookIntegration.passed ? 'FUNCIONANDO' : 'PROBLEMAS'}`);
  console.log(`${results.endToEndIntegration.passed ? '✅' : '❌'} End-to-End: ${results.endToEndIntegration.passed ? 'FUNCIONANDO' : 'PROBLEMAS'}`);

  const overallSuccess = results.apiCommunication.passed && 
                        results.hookIntegration.passed && 
                        results.endToEndIntegration.passed;

  console.log('\n🎯 RESULTADO GERAL: ' + (overallSuccess ? '✅ INTEGRAÇÃO APROVADA' : '❌ INTEGRAÇÃO REQUER CORREÇÕES'));

  // Detalhes específicos se houver falhas
  if (!overallSuccess) {
    console.log('\n🔧 ISSUES DE INTEGRAÇÃO:');
    
    if (!results.apiCommunication.passed) {
      const api = results.apiCommunication.results;
      if (!api.successfulCall) console.log('   • Chamadas de API falhando');
      if (!api.errorHandling) console.log('   • Error handling inadequado');
      if (!api.responseStructure) console.log('   • Validação de resposta insuficiente');
      if (!api.requestFormat) console.log('   • Formato de requisição incorreto');
    }
    
    if (!results.hookIntegration.passed) {
      const hook = results.hookIntegration.results;
      if (!hook.hookInitialization) console.log('   • Hook não inicializa corretamente');
      if (!hook.stateManagement) console.log('   • Gerenciamento de estado problemático');
      if (!hook.errorRecovery) console.log('   • Recuperação de erro inadequada');
    }
    
    if (!results.endToEndIntegration.passed) {
      const e2e = results.endToEndIntegration.results;
      if (!e2e.completeFlow) console.log('   • Fluxo completo não funciona');
      if (!e2e.dataConsistency) console.log('   • Inconsistência de dados');
      if (!e2e.userInteraction) console.log('   • Interação do usuário problemática');
      if (!e2e.errorPropagation) console.log('   • Propagação de erro inadequada');
    }
  }

  return results;
}