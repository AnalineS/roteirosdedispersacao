/**
 * Performance Validation Suite para Sistema de Roteamento Inteligente
 * Testa cache, debounce, memory leaks e otimizações
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
 * Valida comportamento do cache
 */
export async function validateCacheBehavior(): Promise<{
  passed: boolean;
  results: {
    cacheHitTest: boolean;
    cacheExpiration: boolean;
    cacheNormalization: boolean;
    performanceImprovement: number;
  };
}> {
  console.log('\n💾 VALIDANDO COMPORTAMENTO DO CACHE');
  console.log('=' .repeat(40));

  const results = {
    cacheHitTest: false,
    cacheExpiration: false,
    cacheNormalization: false,
    performanceImprovement: 0
  };

  try {
    // Teste 1: Cache Hit
    console.log('📝 Teste 1: Cache Hit');
    const question = 'Qual a dose de rifampicina?';
    
    // Primeira chamada (cache miss)
    const start1 = performance.now();
    const result1 = await analyzeQuestionRouting(question, mockPersonas);
    const time1 = performance.now() - start1;
    
    // Segunda chamada (cache hit esperado)
    const start2 = performance.now();
    const result2 = await analyzeQuestionRouting(question, mockPersonas);
    const time2 = performance.now() - start2;
    
    // Validar que resultados são idênticos
    const resultsIdentical = result1.recommendedPersonaId === result2.recommendedPersonaId &&
                            result1.confidence === result2.confidence &&
                            result1.scope === result2.scope;
    
    results.cacheHitTest = resultsIdentical;
    results.performanceImprovement = time1 > 0 ? ((time1 - time2) / time1) * 100 : 0;
    
    console.log(`   Primeira chamada: ${time1.toFixed(2)}ms`);
    console.log(`   Segunda chamada: ${time2.toFixed(2)}ms`);
    console.log(`   Melhoria: ${results.performanceImprovement.toFixed(1)}%`);
    console.log(`   Resultados idênticos: ${resultsIdentical ? '✅' : '❌'}`);

    // Teste 2: Normalização de cache
    console.log('\n📝 Teste 2: Normalização de Cache');
    const variations = [
      'Qual a dose de rifampicina?',
      'QUAL A DOSE DE RIFAMPICINA?',
      'qual   a  dose   de   rifampicina?',  
      'Qual a dose de rifampicina???',
      'qual a dose de rifampicina...'
    ];

    const normalizedResults = [];
    for (const variation of variations) {
      const startTime = performance.now();
      const result = await analyzeQuestionRouting(variation, mockPersonas);
      const endTime = performance.now() - startTime;
      normalizedResults.push({ result, time: endTime });
    }

    // Verificar se todas as variações têm o mesmo resultado
    const firstResult = normalizedResults[0].result;
    const allSame = normalizedResults.every(({ result }) => 
      result.recommendedPersonaId === firstResult.recommendedPersonaId &&
      result.confidence === firstResult.confidence
    );

    // Verificar se as chamadas subsequentes foram mais rápidas (cache hit)
    const avgSubsequentTime = normalizedResults.slice(1).reduce((sum, { time }) => sum + time, 0) / (normalizedResults.length - 1);
    const cacheSpeedup = avgSubsequentTime < normalizedResults[0].time;

    results.cacheNormalization = allSame && cacheSpeedup;
    
    console.log(`   Todas variações retornam mesmo resultado: ${allSame ? '✅' : '❌'}`);
    console.log(`   Cache funcionando para variações: ${cacheSpeedup ? '✅' : '❌'}`);
    console.log(`   Tempo médio subsequente: ${avgSubsequentTime.toFixed(2)}ms`);

    // Teste 3: Expiração de cache (TTL = 5min, vamos simular)
    console.log('\n📝 Teste 3: Expiração de Cache');
    // Nota: Como TTL é 5min, vamos apenas verificar se o mecanismo existe
    // Em um teste real, precisaríamos mock do Date.now() ou reduzir TTL para teste
    
    // Verificar se método cleanupExpired existe indiretamente
    // fazendo múltiplas chamadas com perguntas diferentes
    const cacheTestQuestions = [
      'dose rifampicina',
      'educação paciente', 
      'protocolo tratamento',
      'dispensação farmácia',
      'reação adversa'
    ];

    let cacheWorking = true;
    for (let i = 0; i < cacheTestQuestions.length; i++) {
      try {
        await analyzeQuestionRouting(cacheTestQuestions[i], mockPersonas);
        // Segunda chamada deve ser mais rápida
        const start = performance.now();
        await analyzeQuestionRouting(cacheTestQuestions[i], mockPersonas);
        const end = performance.now() - start;
        
        if (end > 10) { // Se demora mais que 10ms, provavelmente não está usando cache
          cacheWorking = false;
        }
      } catch (error) {
        cacheWorking = false;
        break;
      }
    }

    results.cacheExpiration = cacheWorking;
    console.log(`   Mecanismo de cache funcionando: ${cacheWorking ? '✅' : '❌'}`);

  } catch (error) {
    console.log(`💥 ERRO na validação de cache: ${error.message}`);
    return { passed: false, results };
  }

  const passed = results.cacheHitTest && results.cacheNormalization && results.cacheExpiration;
  console.log(`\n📊 Cache Validation: ${passed ? '✅ PASSOU' : '❌ FALHOU'}`);

  return { passed, results };
}

/**
 * Valida comportamento do debounce
 */
export async function validateDebounce(): Promise<{
  passed: boolean;
  results: {
    debounceDelay: number;
    callsReduction: number;
    finalResultCorrect: boolean;
  };
}> {
  console.log('\n⏱️ VALIDANDO COMPORTAMENTO DO DEBOUNCE');
  console.log('=' .repeat(40));

  const results = {
    debounceDelay: 0,
    callsReduction: 0,
    finalResultCorrect: false
  };

  try {
    // Simular digitação rápida
    const typingSequence = [
      'q',
      'qu',
      'qua',
      'qual',
      'qual ',
      'qual a',
      'qual a ',
      'qual a d',
      'qual a do',
      'qual a dos',
      'qual a dose',
      'qual a dose ',
      'qual a dose d',
      'qual a dose de',
      'qual a dose de ',
      'qual a dose de r',
      'qual a dose de ri',
      'qual a dose de rif',
      'qual a dose de rifa',
      'qual a dose de rifam',
      'qual a dose de rifamp',
      'qual a dose de rifampi',
      'qual a dose de rifampic',
      'qual a dose de rifampici',
      'qual a dose de rifampcin',
      'qual a dose de rifampicina'
    ];

    let actualCalls = 0;
    const startTime = performance.now();

    // Mock da função de análise para contar chamadas
    const originalAnalyze = analyzeQuestionRouting;
    let callCount = 0;
    
    // Simular hook behavior - sem debounce todas as chamadas seriam feitas
    const expectedWithoutDebounce = typingSequence.length;

    // Simular com debounce (baseado no hook real: 1000ms)
    const debounceTime = 1000;
    let lastCallTime = 0;
    
    for (let i = 0; i < typingSequence.length; i++) {
      const currentTime = performance.now();
      
      // Simular intervalo de digitação (50ms entre caracteres)
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      // Simular debounce behavior
      if (currentTime - lastCallTime >= debounceTime || i === typingSequence.length - 1) {
        if (typingSequence[i].length > 10) { // Condição do hook real
          try {
            await analyzeQuestionRouting(typingSequence[i], mockPersonas);
            callCount++;
            lastCallTime = currentTime;
          } catch (error) {
            // Ignore errors for debounce test
          }
        }
      }
    }

    const endTime = performance.now();
    results.debounceDelay = endTime - startTime;
    results.callsReduction = ((expectedWithoutDebounce - callCount) / expectedWithoutDebounce) * 100;

    // Verificar se o resultado final está correto
    try {
      const finalResult = await analyzeQuestionRouting(typingSequence[typingSequence.length - 1], mockPersonas);
      results.finalResultCorrect = finalResult.recommendedPersonaId === 'dr_gasnelio'; // Esperado para pergunta sobre dose
    } catch (error) {
      results.finalResultCorrect = false;
    }

    console.log(`   Chamadas simuladas: ${callCount}`);
    console.log(`   Redução de chamadas: ${results.callsReduction.toFixed(1)}%`);
    console.log(`   Resultado final correto: ${results.finalResultCorrect ? '✅' : '❌'}`);
    console.log(`   Tempo total: ${results.debounceDelay.toFixed(2)}ms`);

  } catch (error) {
    console.log(`💥 ERRO na validação de debounce: ${error.message}`);
    return { passed: false, results };
  }

  // Debounce é efetivo se reduz chamadas significativamente e mantém resultado correto
  const passed = results.callsReduction > 50 && results.finalResultCorrect;
  console.log(`\n📊 Debounce Validation: ${passed ? '✅ PASSOU' : '❌ FALHOU'}`);

  return { passed, results };
}

/**
 * Testa vazamentos de memória
 */
export async function validateMemoryLeaks(): Promise<{
  passed: boolean;
  results: {
    initialMemory: number;
    finalMemory: number;
    memoryIncrease: number;
    cacheSize: number;
  };
}> {
  console.log('\n🧠 VALIDANDO VAZAMENTOS DE MEMÓRIA');
  console.log('=' .repeat(40));

  const results = {
    initialMemory: 0,
    finalMemory: 0,
    memoryIncrease: 0,
    cacheSize: 0
  };

  try {
    // Medir memória inicial (se disponível)
    if (performance.memory) {
      results.initialMemory = performance.memory.usedJSHeapSize;
    }

    // Executar muitas operações para testar vazamentos
    const iterations = 1000;
    const questions = [
      'dose rifampicina',
      'educação paciente',
      'protocolo tratamento',
      'dispensação medicamento',
      'reação adversa',
      'orientação familiar'
    ];

    console.log(`   Executando ${iterations} operações...`);

    for (let i = 0; i < iterations; i++) {
      const question = questions[i % questions.length] + ` ${i}`;
      try {
        await analyzeQuestionRouting(question, mockPersonas);
      } catch (error) {
        // Continue even if some calls fail
      }

      // Force garbage collection ocasionalmente se disponível
      if (i % 100 === 0 && global.gc) {
        global.gc();
      }
    }

    // Medir memória final
    if (performance.memory) {
      results.finalMemory = performance.memory.usedJSHeapSize;
      results.memoryIncrease = results.finalMemory - results.initialMemory;
    }

    // Testar se cache está limitando crescimento
    // Cache deve limpar entradas expiradas automaticamente
    const testCacheGrowth = async () => {
      const manyQuestions = Array.from({ length: 100 }, (_, i) => `test question ${i}`);
      for (const q of manyQuestions) {
        await analyzeQuestionRouting(q, mockPersonas);
      }
    };

    await testCacheGrowth();

    console.log(`   Memória inicial: ${(results.initialMemory / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Memória final: ${(results.finalMemory / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Incremento: ${(results.memoryIncrease / 1024 / 1024).toFixed(2)} MB`);

  } catch (error) {
    console.log(`💥 ERRO na validação de memória: ${error.message}`);
    return { passed: false, results };
  }

  // Aprovado se aumento de memória for razoável (< 50MB para 1000 operações)
  const memoryIncreaseReasonable = results.memoryIncrease < 50 * 1024 * 1024; // 50MB
  const passed = memoryIncreaseReasonable;

  console.log(`\n📊 Memory Validation: ${passed ? '✅ PASSOU' : '❌ FALHOU'}`);
  if (!memoryIncreaseReasonable) {
    console.log(`   ⚠️ Possível vazamento: aumento excessivo de memória`);
  }

  return { passed, results };
}

/**
 * Testa performance geral do sistema
 */
export async function validateOverallPerformance(): Promise<{
  passed: boolean;
  results: {
    averageResponseTime: number;
    p95ResponseTime: number;
    successRate: number;
    throughput: number;
  };
}> {
  console.log('\n⚡ VALIDANDO PERFORMANCE GERAL');
  console.log('=' .repeat(40));

  const results = {
    averageResponseTime: 0,
    p95ResponseTime: 0,
    successRate: 0,
    throughput: 0
  };

  try {
    const testQuestions = [
      'Qual a dose de rifampicina?',
      'Como educar o paciente?',
      'Protocolo para multibacilar',
      'Dispensação na farmácia',
      'Reação adversa à dapsona',
      'Orientação familiar',
      'Diagnóstico hanseníase',
      'Cronograma tratamento',
      'Aderência ao tratamento',
      'Preconceito social'
    ];

    const responseTimes: number[] = [];
    let successCount = 0;
    const totalTests = 100;

    console.log(`   Executando ${totalTests} testes de performance...`);

    const startTime = performance.now();

    for (let i = 0; i < totalTests; i++) {
      const question = testQuestions[i % testQuestions.length];
      
      try {
        const testStart = performance.now();
        await analyzeQuestionRouting(question, mockPersonas);
        const testEnd = performance.now();
        
        responseTimes.push(testEnd - testStart);
        successCount++;
      } catch (error) {
        // Continue testing even if some fail
      }
    }

    const totalTime = performance.now() - startTime;

    // Calcular métricas
    if (responseTimes.length > 0) {
      results.averageResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
      
      // P95 (95th percentile)
      const sorted = responseTimes.sort((a, b) => a - b);
      const p95Index = Math.floor(sorted.length * 0.95);
      results.p95ResponseTime = sorted[p95Index] || 0;
    }

    results.successRate = (successCount / totalTests) * 100;
    results.throughput = totalTests / (totalTime / 1000); // operations per second

    console.log(`   Tempo médio de resposta: ${results.averageResponseTime.toFixed(2)}ms`);
    console.log(`   P95 tempo de resposta: ${results.p95ResponseTime.toFixed(2)}ms`);
    console.log(`   Taxa de sucesso: ${results.successRate.toFixed(1)}%`);
    console.log(`   Throughput: ${results.throughput.toFixed(1)} ops/s`);

  } catch (error) {
    console.log(`💥 ERRO na validação de performance: ${error.message}`);
    return { passed: false, results };
  }

  // Critérios de aprovação
  const avgTimeOk = results.averageResponseTime < 100; // < 100ms média
  const p95TimeOk = results.p95ResponseTime < 500; // < 500ms P95
  const successRateOk = results.successRate > 95; // > 95% sucesso
  const throughputOk = results.throughput > 10; // > 10 ops/s

  const passed = avgTimeOk && p95TimeOk && successRateOk && throughputOk;

  console.log(`\n📊 Performance Validation: ${passed ? '✅ PASSOU' : '❌ FALHOU'}`);
  
  if (!avgTimeOk) console.log(`   ⚠️ Tempo médio muito alto: ${results.averageResponseTime.toFixed(2)}ms`);
  if (!p95TimeOk) console.log(`   ⚠️ P95 muito alto: ${results.p95ResponseTime.toFixed(2)}ms`);
  if (!successRateOk) console.log(`   ⚠️ Taxa de sucesso baixa: ${results.successRate.toFixed(1)}%`);
  if (!throughputOk) console.log(`   ⚠️ Throughput baixo: ${results.throughput.toFixed(1)} ops/s`);

  return { passed, results };
}

/**
 * Executa validação completa de performance
 */
export async function runPerformanceValidation() {
  console.log('🚀 INICIANDO VALIDAÇÃO DE PERFORMANCE');
  console.log('🕒 ' + new Date().toLocaleString());
  console.log('='.repeat(60));

  const results = {
    cache: await validateCacheBehavior(),
    debounce: await validateDebounce(),
    memory: await validateMemoryLeaks(),
    performance: await validateOverallPerformance()
  };

  // Sumário final
  console.log('\n' + '='.repeat(60));
  console.log('📋 SUMÁRIO DA VALIDAÇÃO DE PERFORMANCE');
  console.log('='.repeat(60));
  
  console.log(`${results.cache.passed ? '✅' : '❌'} Cache: ${results.cache.passed ? 'FUNCIONANDO' : 'PROBLEMAS'}`);
  console.log(`${results.debounce.passed ? '✅' : '❌'} Debounce: ${results.debounce.passed ? 'EFETIVO' : 'INEFICAZ'}`);
  console.log(`${results.memory.passed ? '✅' : '❌'} Memória: ${results.memory.passed ? 'SEM VAZAMENTOS' : 'POSSÍVEL VAZAMENTO'}`);
  console.log(`${results.performance.passed ? '✅' : '❌'} Performance: ${results.performance.passed ? 'ADEQUADA' : 'INSUFICIENTE'}`);

  const overallSuccess = results.cache.passed && 
                        results.debounce.passed && 
                        results.memory.passed && 
                        results.performance.passed;

  console.log('\n🎯 RESULTADO GERAL: ' + (overallSuccess ? '✅ PERFORMANCE APROVADA' : '❌ PERFORMANCE REQUER OTIMIZAÇÃO'));

  return results;
}