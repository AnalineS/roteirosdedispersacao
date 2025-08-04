/**
 * Cache Behavior Validation for Intelligent Routing
 * Tests TTL, normalization, cleanup and memory management
 */

// Simulate the RoutingCache class from intelligentRouting.ts
class RoutingCacheTest {
  constructor() {
    this.cache = new Map();
    this.TTL = 5 * 60 * 1000; // 5 minutes
  }

  set(question, analysis) {
    const key = this.normalizeQuestion(question);
    this.cache.set(key, {
      analysis,
      timestamp: Date.now()
    });
    this.cleanupExpired();
  }

  get(question) {
    const key = this.normalizeQuestion(question);
    const cached = this.cache.get(key);
    
    if (cached && (Date.now() - cached.timestamp) < this.TTL) {
      return cached.analysis;
    }
    
    if (cached) {
      this.cache.delete(key);
    }
    
    return null;
  }

  normalizeQuestion(question) {
    return question
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  cleanupExpired() {
    const now = Date.now();
    Array.from(this.cache.entries()).forEach(([key, value]) => {
      if (now - value.timestamp >= this.TTL) {
        this.cache.delete(key);
      }
    });
  }

  // Test utilities
  getCacheSize() {
    return this.cache.size;
  }

  setTTL(ttl) {
    this.TTL = ttl;
  }

  simulateTimePass(ms) {
    // Simulate time passing for TTL tests
    Array.from(this.cache.entries()).forEach(([key, value]) => {
      value.timestamp -= ms;
    });
  }
}

function testCacheBehavior() {
  console.log("💾 TESTE DETALHADO DO SISTEMA DE CACHE");
  console.log("=====================================\n");

  const cache = new RoutingCacheTest();
  let testsPassed = 0;
  let totalTests = 0;

  // Test 1: Basic cache set/get
  console.log("1. Teste básico de armazenamento e recuperação");
  totalTests++;
  const testAnalysis = {
    recommendedPersonaId: 'dr_gasnelio',
    confidence: 0.8,
    reasoning: 'Test analysis',
    scope: 'clinical'
  };

  cache.set("Qual a dose de rifampicina?", testAnalysis);
  const retrieved = cache.get("Qual a dose de rifampicina?");
  
  if (retrieved && retrieved.recommendedPersonaId === 'dr_gasnelio') {
    console.log("✅ Cache armazenou e recuperou corretamente");
    testsPassed++;
  } else {
    console.log("❌ Falha no armazenamento/recuperação básica");
  }

  // Test 2: Question normalization
  console.log("\n2. Teste de normalização de perguntas");
  totalTests++;
  
  cache.set("  QUAL A DOSE DE RIFAMPICINA?!?  ", testAnalysis);
  const normalizedRetrieved = cache.get("qual a dose de rifampicina");
  
  if (normalizedRetrieved && normalizedRetrieved.recommendedPersonaId === 'dr_gasnelio') {
    console.log("✅ Normalização funcionando corretamente");
    testsPassed++;
  } else {
    console.log("❌ Falha na normalização");
  }

  // Test 3: TTL expiration
  console.log("\n3. Teste de expiração TTL");
  totalTests++;
  
  cache.setTTL(1000); // 1 second for test
  cache.set("Pergunta teste TTL", testAnalysis);
  
  // Simulate 2 seconds passing
  cache.simulateTimePass(2000);
  
  const expiredResult = cache.get("Pergunta teste TTL");
  
  if (!expiredResult) {
    console.log("✅ TTL funcionando - entrada expirada corretamente");
    testsPassed++;
  } else {
    console.log("❌ TTL não funcionando - entrada não expirou");
  }

  // Test 4: Cache cleanup
  console.log("\n4. Teste de limpeza automática");
  totalTests++;
  
  cache.setTTL(5 * 60 * 1000); // Reset TTL
  
  // Add multiple entries
  cache.set("Pergunta 1", testAnalysis);
  cache.set("Pergunta 2", testAnalysis);  
  cache.set("Pergunta 3", testAnalysis);
  
  const sizeBefore = cache.getCacheSize();
  
  // Expire some entries
  cache.simulateTimePass(6 * 60 * 1000); // 6 minutes
  
  // Trigger cleanup by doing a get
  cache.get("Pergunta 1");
  
  const sizeAfter = cache.getCacheSize();
  
  if (sizeAfter < sizeBefore) {
    console.log(`✅ Limpeza automática funcionando (${sizeBefore} → ${sizeAfter} entradas)`);
    testsPassed++;
  } else {
    console.log(`❌ Limpeza automática falhou (${sizeBefore} → ${sizeAfter} entradas)`);
  }

  // Test 5: Memory efficiency
  console.log("\n5. Teste de eficiência de memória");
  totalTests++;
  
  const newCache = new RoutingCacheTest();
  const testQuestions = [];
  
  // Generate many test questions
  for (let i = 0; i < 1000; i++) {
    testQuestions.push(`Pergunta de teste número ${i} com conteúdo variado`);
  }
  
  const startTime = Date.now();
  
  // Add all questions to cache
  testQuestions.forEach(question => {
    newCache.set(question, testAnalysis);
  });
  
  const endTime = Date.now();
  const duration = endTime - startTime;
  
  if (duration < 100) { // Should be very fast
    console.log(`✅ Performance de cache adequada (${duration}ms para 1000 entradas)`);
    testsPassed++;
  } else {
    console.log(`❌ Performance de cache lenta (${duration}ms para 1000 entradas)`);
  }

  // Test 6: Cache key collision handling
  console.log("\n6. Teste de colisões de chaves");
  totalTests++;
  
  const analysis1 = { ...testAnalysis, recommendedPersonaId: 'dr_gasnelio' };
  const analysis2 = { ...testAnalysis, recommendedPersonaId: 'ga' };
  
  newCache.set("pergunta teste", analysis1);
  newCache.set("Pergunta... teste!!!", analysis2); // Should normalize to same key
  
  const finalResult = newCache.get("pergunta teste");
  
  if (finalResult && finalResult.recommendedPersonaId === 'ga') {
    console.log("✅ Substituição de cache funcionando corretamente");
    testsPassed++;
  } else {
    console.log("❌ Problema na substituição de cache");
  }

  console.log(`\n📊 RESULTADO DOS TESTES DE CACHE: ${testsPassed}/${totalTests} (${((testsPassed/totalTests)*100).toFixed(1)}%)`);
  
  return { testsPassed, totalTests, success: testsPassed === totalTests };
}

// Run the tests
testCacheBehavior();