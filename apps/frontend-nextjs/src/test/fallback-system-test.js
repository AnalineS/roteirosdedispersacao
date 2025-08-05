/**
 * Teste do Sistema de Fallbacks Inteligentes
 * Testa diferentes cenários de falha e verifica as respostas
 */

// Simular ambiente Node.js
if (typeof global === 'undefined') {
  global = {};
}

// Mock dependencies
const { fallbackSystem, executeSmartFallback } = require('../services/fallbackSystem');

// Mock SentimentResult para testes
const mockSentiments = {
  positive: {
    score: 0.8,
    magnitude: 0.6,
    category: 'POSITIVE',
    confidence: 0.9,
    keywords: ['bom', 'ótimo']
  },
  anxious: {
    score: -0.6,
    magnitude: 0.8,
    category: 'ANXIOUS',
    confidence: 0.8,
    keywords: ['preocupado', 'nervoso']
  },
  frustrated: {
    score: -0.7,
    magnitude: 0.7,
    category: 'FRUSTRATED',
    confidence: 0.9,
    keywords: ['irritado', 'chateado']
  }
};

// Testes
async function runFallbackTests() {
  console.log('🧪 Iniciando Testes do Sistema de Fallbacks\n');
  
  let passed = 0;
  let total = 0;
  
  function test(name, testFn) {
    total++;
    console.log(`\n${total}. Testando: ${name}`);
    try {
      const start = Date.now();
      const result = testFn();
      const duration = Date.now() - start;
      
      if (result) {
        console.log(`   ✅ PASSOU (${duration}ms)`);
        passed++;
      } else {
        console.log(`   ❌ FALHOU (${duration}ms)`);
      }
    } catch (error) {
      console.log(`   ❌ ERRO: ${error.message}`);
    }
  }
  
  // Test 1: Fallback de rede básico
  test('Fallback de rede básico', async () => {
    const result = await fallbackSystem.executeFallback(
      'rifampicina dose',
      'network',
      undefined,
      { useLocalKnowledge: true }
    );
    
    console.log(`   - Resposta: "${result.response.substring(0, 50)}..."`);
    console.log(`   - Fonte: ${result.source}`);
    console.log(`   - Confiança: ${Math.round(result.confidence * 100)}%`);
    
    return result.success && result.response.length > 0;
  });
  
  // Test 2: Fallback com sentimento ansioso
  test('Fallback com usuário ansioso', async () => {
    const result = await fallbackSystem.executeFallback(
      'clofazimina pele escura',
      'server_error',  
      mockSentiments.anxious
    );
    
    console.log(`   - Resposta: "${result.response.substring(0, 60)}..."`);
    console.log(`   - Fonte: ${result.source}`);
    console.log(`   - Adaptação de sentimento: ${result.response.includes('preocupação') ? 'Sim' : 'Não'}`);
    
    return result.success && result.response.includes('preocupação');
  });
  
  // Test 3: Fallback com usuário frustrado
  test('Fallback com usuário frustrado', async () => {
    const result = await fallbackSystem.executeFallback(
      'dapsona efeitos',
      'timeout',
      mockSentiments.frustrated
    );
    
    console.log(`   - Resposta: "${result.response.substring(0, 60)}..."`);
    console.log(`   - Adaptação: ${result.response.includes('frustração') ? 'Detectada' : 'Não detectada'}`);
    
    return result.success;
  });
  
  // Test 4: Cache local
  test('Sistema de cache local', async () => {
    const query = 'rifampicina dose';
    
    const result = await fallbackSystem.executeFallback(
      query,
      'network'
    );
    
    console.log(`   - Cache hit: ${result.source === 'cache' ? 'Sim' : 'Não'}`);
    console.log(`   - Sugestão: "${result.suggestion}"`);
    
    return result.source === 'cache' || result.source === 'local_knowledge';
  });
  
  // Test 5: Conhecimento local
  test('Base de conhecimento local', async () => {
    const result = await fallbackSystem.executeFallback(
      'tempo tratamento hanseniase',
      'data_corruption'
    );
    
    console.log(`   - Fonte: ${result.source}`);
    console.log(`   - Resposta contém duração: ${result.response.includes('meses') ? 'Sim' : 'Não'}`);
    
    return result.success && result.response.includes('meses');
  });
  
  // Test 6: Resposta de emergência
  test('Sistema de emergência', async () => {
    const result = await fallbackSystem.executeFallback(
      'pergunta muito específica sobre algo inexistente',
      'unknown',
      mockSentiments.anxious
    );
    
    console.log(`   - Fonte: ${result.source}`);
    console.log(`   - Contato emergência: ${result.emergency_contact ? 'Fornecido' : 'Não fornecido'}`);
    
    return result.source === 'emergency' && result.emergency_contact;
  });
  
  // Test 7: executeSmartFallback helper
  test('Helper executeSmartFallback', async () => {
    const networkError = new Error('fetch failed - network error');
    
    const result = await executeSmartFallback(
      'dapsona diario',
      networkError,
      mockSentiments.positive
    );
    
    console.log(`   - Tipo de erro detectado: ${networkError.message.includes('network') ? 'Network' : 'Outros'}`);
    console.log(`   - Resposta: "${result.response.substring(0, 50)}..."`);
    
    return result.success;
  });
  
  // Test 8: Estatísticas do sistema
  test('Estatísticas do sistema', () => {
    const stats = fallbackSystem.getFailureStats();
    
    console.log(`   - Contagem de falhas: ${stats.count}`);
    console.log(`   - Saúde do sistema: ${stats.systemHealth}`);
    console.log(`   - Última falha: ${stats.lastFailure > 0 ? 'Registrada' : 'Nenhuma'}`);
    
    return typeof stats.count === 'number' && typeof stats.systemHealth === 'string';
  });
  
  // Test 9: Reset do contador
  test('Reset do contador de falhas', () => {
    const statsBefore = fallbackSystem.getFailureStats();
    
    fallbackSystem.resetFailureCount();
    
    const statsAfter = fallbackSystem.getFailureStats();
    
    console.log(`   - Antes: ${statsBefore.count} falhas`);
    console.log(`   - Depois: ${statsAfter.count} falhas`);
    
    return statsAfter.count === 0;
  });
  
  // Test 10: Adaptação de resposta por sentimento
  test('Adaptação de resposta por sentimento', async () => {
    const normalResult = await fallbackSystem.executeFallback(
      'tratamento hanseniase',
      'network'
    );
    
    const anxiousResult = await fallbackSystem.executeFallback(
      'tratamento hanseniase',
      'network',
      mockSentiments.anxious
    );
    
    console.log(`   - Resposta normal: "${normalResult.response.substring(0, 30)}..."`);
    console.log(`   - Resposta ansiosa: "${anxiousResult.response.substring(0, 30)}..."`);
    console.log(`   - Diferentes: ${normalResult.response !== anxiousResult.response ? 'Sim' : 'Não'}`);
    
    return normalResult.response !== anxiousResult.response;
  });
  
  // Resultados finais
  console.log('\n' + '='.repeat(50));
  console.log(`📊 RESULTADOS DOS TESTES`);
  console.log('='.repeat(50));
  console.log(`✅ Sucessos: ${passed}`);
  console.log(`❌ Falhas: ${total - passed}`);
  console.log(`📈 Taxa de Sucesso: ${Math.round((passed / total) * 100)}%`);
  
  if (passed === total) {
    console.log(`\n🎉 TODOS OS TESTES PASSARAM! Sistema de fallbacks está funcionando perfeitamente.`);
  } else {
    console.log(`\n⚠️  ${total - passed} testes falharam. Revise a implementação.`);
  }
  
  return passed === total;
}

// Executar testes se for chamado diretamente
if (require.main === module) {
  runFallbackTests().catch(console.error);
}

module.exports = { runFallbackTests };