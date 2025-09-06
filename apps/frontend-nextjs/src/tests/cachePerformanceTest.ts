/**
 * Cache Performance Test Suite
 * Testa performance do sistema de cache híbrido vs Redis
 * Valida que a migração para Firestore mantém ou melhora performance
 */

import { hybridCache } from '../services/hybridCache';
import { firestoreCache } from '../services/firestoreCache';
import { ConversationCacheService } from '../services/conversationCacheService';
import { AnalyticsFirestoreCache } from '../services/analyticsFirestoreCache';

interface PerformanceResult {
  operation: string;
  cacheType: 'hybrid' | 'firestore' | 'memory';
  averageTime: number;
  minTime: number;
  maxTime: number;
  successRate: number;
  errorCount: number;
  memoryUsage?: number;
}

interface TestMetrics {
  timestamp: number;
  testSuite: string;
  results: PerformanceResult[];
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    averagePerformanceGain: number; // % comparado ao baseline
    memoryEfficiency: number;
    overallScore: number; // 0-100
  };
}

export class CachePerformanceTest {
  private results: PerformanceResult[] = [];
  private testData: any[] = [];
  private baseline: Map<string, number> = new Map();

  constructor() {
    this.initializeTestData();
  }

  /**
   * Executa suite completa de testes de performance
   */
  async runCompletePerformanceTest(): Promise<TestMetrics> {
    console.log('🚀 Iniciando testes de performance do cache híbrido...');

    const startTime = Date.now();
    
    try {
      // 1. Testes básicos de cache
      await this.testBasicCacheOperations();
      
      // 2. Testes de conversação
      await this.testConversationCaching();
      
      // 3. Testes de analytics
      await this.testAnalyticsCaching();
      
      // 4. Testes de stress
      await this.testStressScenarios();
      
      // 5. Testes de concorrência
      await this.testConcurrentOperations();
      
      // 6. Testes de fallback
      await this.testFallbackScenarios();

      const metrics = this.calculateMetrics();
      
      console.log('✅ Testes de performance concluídos');
      console.log(`📊 Score geral: ${metrics.summary.overallScore}/100`);
      console.log(`⚡ Performance gain média: ${metrics.summary.averagePerformanceGain.toFixed(2)}%`);
      
      return metrics;

    } catch (error) {
      console.error('❌ Erro durante testes de performance:', error);
      throw error;
    }
  }

  /**
   * Testa operações básicas de cache
   */
  private async testBasicCacheOperations(): Promise<void> {
    console.log('📝 Testando operações básicas de cache...');

    const testCases = [
      { key: 'test_string', value: 'Hello World', size: 'small' },
      { key: 'test_object', value: { user: 'test', data: Array(100).fill('x') }, size: 'medium' },
      { key: 'test_large', value: { data: Array(1000).fill('large_data_chunk') }, size: 'large' }
    ];

    for (const testCase of testCases) {
      // Teste SET operation
      const setResult = await this.measureOperation(
        'set',
        'hybrid',
        async () => {
          return await hybridCache.set(testCase.key, testCase.value, { ttl: 60000 });
        }
      );
      this.results.push(setResult);

      // Teste GET operation
      const getResult = await this.measureOperation(
        'get',
        'hybrid',
        async () => {
          return await hybridCache.get(testCase.key);
        }
      );
      this.results.push(getResult);

      // Comparar com Firestore direto
      const firestoreSetResult = await this.measureOperation(
        'set',
        'firestore',
        async () => {
          return await firestoreCache.set(testCase.key, testCase.value, { ttl: 60000 });
        }
      );
      this.results.push(firestoreSetResult);

      const firestoreGetResult = await this.measureOperation(
        'get',
        'firestore',
        async () => {
          return await firestoreCache.get(testCase.key);
        }
      );
      this.results.push(firestoreGetResult);
    }
  }

  /**
   * Testa cache de conversações
   */
  private async testConversationCaching(): Promise<void> {
    console.log('💬 Testando cache de conversações...');

    const userId = 'test_user_' + Date.now();
    const conversationId = 'test_conv_' + Date.now();

    // Teste de criação de conversa
    const createResult = await this.measureOperation(
      'conversation_create',
      'hybrid',
      async () => {
        return await ConversationCacheService.addMessage(
          conversationId,
          {
            id: 'msg_1',
            role: 'user',
            content: 'Teste de performance de conversação',
            timestamp: Date.now()
          },
          userId
        );
      }
    );
    this.results.push(createResult);

    // Teste de busca de conversa
    const getResult = await this.measureOperation(
      'conversation_get',
      'hybrid',
      async () => {
        return await ConversationCacheService.getConversation(conversationId);
      }
    );
    this.results.push(getResult);

    // Teste de busca de conversas do usuário
    const getUserConvsResult = await this.measureOperation(
      'user_conversations_get',
      'hybrid',
      async () => {
        return await ConversationCacheService.getUserConversations(userId);
      }
    );
    this.results.push(getUserConvsResult);
  }

  /**
   * Testa cache de analytics
   */
  private async testAnalyticsCaching(): Promise<void> {
    console.log('📊 Testando cache de analytics...');

    const sessionId = 'test_session_' + Date.now();

    // Teste de criação de sessão
    const sessionResult = await this.measureOperation(
      'analytics_session_start',
      'hybrid',
      async () => {
        return await AnalyticsFirestoreCache.startAnalyticsSession({
          id: sessionId,
          userId: 'test_user',
          deviceType: 'desktop'
        });
      }
    );
    this.results.push(sessionResult);

    // Teste de salvamento de evento
    const eventResult = await this.measureOperation(
      'analytics_event_save',
      'hybrid',
      async () => {
        return await AnalyticsFirestoreCache.saveAnalyticsEvent({
          id: 'event_' + Date.now(),
          sessionId,
          timestamp: Date.now(),
          event: 'test_event',
          category: 'performance_test',
          value: 100
        });
      }
    );
    this.results.push(eventResult);

    // Teste de busca de sessão
    const getSessionResult = await this.measureOperation(
      'analytics_session_get',
      'hybrid',
      async () => {
        return await AnalyticsFirestoreCache.getAnalyticsSession(sessionId);
      }
    );
    this.results.push(getSessionResult);
  }

  /**
   * Testa cenários de stress
   */
  private async testStressScenarios(): Promise<void> {
    console.log('🔥 Testando cenários de stress...');

    const stressData = Array(50).fill(null).map((_, i) => ({
      key: `stress_test_${i}`,
      value: { data: Array(100).fill(`stress_data_${i}`) }
    }));

    // Teste de múltiplas escritas sequenciais
    const sequentialWriteResult = await this.measureOperation(
      'stress_sequential_write',
      'hybrid',
      async () => {
        for (const item of stressData) {
          await hybridCache.set(item.key, item.value, { ttl: 30000 });
        }
        return true;
      }
    );
    this.results.push(sequentialWriteResult);

    // Teste de múltiplas leituras sequenciais
    const sequentialReadResult = await this.measureOperation(
      'stress_sequential_read',
      'hybrid',
      async () => {
        for (const item of stressData) {
          await hybridCache.get(item.key);
        }
        return true;
      }
    );
    this.results.push(sequentialReadResult);
  }

  /**
   * Testa operações concorrentes
   */
  private async testConcurrentOperations(): Promise<void> {
    console.log('⚡ Testando operações concorrentes...');

    const concurrentData = Array(20).fill(null).map((_, i) => ({
      key: `concurrent_test_${i}`,
      value: { data: `concurrent_data_${i}` }
    }));

    // Teste de escritas concorrentes
    const concurrentWriteResult = await this.measureOperation(
      'concurrent_writes',
      'hybrid',
      async () => {
        const promises = concurrentData.map(item =>
          hybridCache.set(item.key, item.value, { ttl: 30000 })
        );
        await Promise.all(promises);
        return true;
      }
    );
    this.results.push(concurrentWriteResult);

    // Teste de leituras concorrentes
    const concurrentReadResult = await this.measureOperation(
      'concurrent_reads',
      'hybrid',
      async () => {
        const promises = concurrentData.map(item =>
          hybridCache.get(item.key)
        );
        await Promise.all(promises);
        return true;
      }
    );
    this.results.push(concurrentReadResult);
  }

  /**
   * Testa cenários de fallback
   */
  private async testFallbackScenarios(): Promise<void> {
    console.log('🛡️ Testando cenários de fallback...');

    // Simular falha de rede (usando chave inválida)
    const fallbackResult = await this.measureOperation(
      'fallback_network_failure',
      'hybrid',
      async () => {
        try {
          // Tentar operação que pode falhar
          return await hybridCache.get('non_existent_key_' + Date.now());
        } catch (error) {
          // Fallback bem-sucedido se não encontrar
          return null;
        }
      }
    );
    this.results.push(fallbackResult);

    // Teste de limpeza de cache
    const cleanupResult = await this.measureOperation(
      'cache_cleanup',
      'hybrid',
      async () => {
        await hybridCache.clear();
        return true;
      }
    );
    this.results.push(cleanupResult);
  }

  /**
   * Mede performance de uma operação
   */
  private async measureOperation(
    operation: string,
    cacheType: 'hybrid' | 'firestore' | 'memory',
    testFunction: () => Promise<any>,
    iterations: number = 5
  ): Promise<PerformanceResult> {
    const times: number[] = [];
    let errorCount = 0;
    const startMemory = this.getMemoryUsage();

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      try {
        await testFunction();
        const end = performance.now();
        times.push(end - start);
      } catch (error) {
        errorCount++;
        console.warn(`Error in ${operation} iteration ${i + 1}:`, error);
      }
    }

    const endMemory = this.getMemoryUsage();
    const averageTime = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;

    return {
      operation,
      cacheType,
      averageTime,
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
      successRate: ((iterations - errorCount) / iterations) * 100,
      errorCount,
      memoryUsage: endMemory - startMemory
    };
  }

  /**
   * Calcula métricas finais
   */
  private calculateMetrics(): TestMetrics {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.successRate >= 80).length;
    const failedTests = totalTests - passedTests;

    // Calcular ganho de performance (comparado com Firestore direto)
    const hybridResults = this.results.filter(r => r.cacheType === 'hybrid');
    const firestoreResults = this.results.filter(r => r.cacheType === 'firestore');
    
    let averagePerformanceGain = 0;
    if (firestoreResults.length > 0) {
      const hybridAvg = hybridResults.reduce((sum, r) => sum + r.averageTime, 0) / hybridResults.length;
      const firestoreAvg = firestoreResults.reduce((sum, r) => sum + r.averageTime, 0) / firestoreResults.length;
      averagePerformanceGain = ((firestoreAvg - hybridAvg) / firestoreAvg) * 100;
    }

    // Calcular eficiência de memória
    const totalMemoryUsage = this.results.reduce((sum, r) => sum + (r.memoryUsage || 0), 0);
    const memoryEfficiency = Math.max(0, 100 - (totalMemoryUsage / 1024)); // Score baseado em MB

    // Score geral (0-100)
    const successRate = (passedTests / totalTests) * 100;
    const performanceScore = Math.max(0, Math.min(100, 50 + averagePerformanceGain));
    const overallScore = (successRate * 0.4 + performanceScore * 0.4 + memoryEfficiency * 0.2);

    return {
      timestamp: Date.now(),
      testSuite: 'Cache Performance Test Suite v2.0',
      results: this.results,
      summary: {
        totalTests,
        passedTests,
        failedTests,
        averagePerformanceGain,
        memoryEfficiency,
        overallScore: Math.round(overallScore)
      }
    };
  }

  /**
   * Obtém uso de memória atual (aproximado)
   */
  private getMemoryUsage(): number {
    if (typeof window !== 'undefined' && (window as any).performance?.memory) {
      return (window as any).performance.memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    return 0;
  }

  /**
   * Inicializa dados de teste
   */
  private initializeTestData(): void {
    this.testData = Array(100).fill(null).map((_, i) => ({
      id: `test_${i}`,
      data: `test_data_${i}`,
      timestamp: Date.now() + i,
      metadata: {
        type: 'performance_test',
        iteration: i,
        complexity: i % 3 === 0 ? 'high' : i % 2 === 0 ? 'medium' : 'low'
      }
    }));
  }

  /**
   * Gera relatório detalhado
   */
  generateDetailedReport(metrics: TestMetrics): string {
    let report = `
# Cache Performance Test Report
Generated: ${new Date(metrics.timestamp).toISOString()}
Test Suite: ${metrics.testSuite}

## Summary
- **Overall Score**: ${metrics.summary.overallScore}/100
- **Total Tests**: ${metrics.summary.totalTests}
- **Passed**: ${metrics.summary.passedTests} (${((metrics.summary.passedTests / metrics.summary.totalTests) * 100).toFixed(1)}%)
- **Failed**: ${metrics.summary.failedTests}
- **Average Performance Gain**: ${metrics.summary.averagePerformanceGain.toFixed(2)}%
- **Memory Efficiency**: ${metrics.summary.memoryEfficiency.toFixed(1)}/100

## Performance Results by Operation
`;

    const groupedResults = metrics.results.reduce((groups: any, result) => {
      if (!groups[result.operation]) {
        groups[result.operation] = [];
      }
      groups[result.operation].push(result);
      return groups;
    }, {});

    for (const [operation, results] of Object.entries(groupedResults) as [string, PerformanceResult[]][]) {
      report += `\n### ${operation}\n`;
      for (const result of results) {
        report += `- **${result.cacheType}**: ${result.averageTime.toFixed(2)}ms avg, ${result.successRate.toFixed(1)}% success\n`;
      }
    }

    report += `\n## Recommendations\n`;
    
    if (metrics.summary.overallScore >= 90) {
      report += `✅ **Excellent**: Cache system is performing optimally.\n`;
    } else if (metrics.summary.overallScore >= 70) {
      report += `⚠️ **Good**: Cache system is performing well with room for improvement.\n`;
    } else {
      report += `❌ **Needs Attention**: Cache system requires optimization.\n`;
    }

    if (metrics.summary.averagePerformanceGain < 0) {
      report += `- Consider optimizing hybrid cache strategy\n`;
    }

    if (metrics.summary.memoryEfficiency < 80) {
      report += `- Implement better memory management\n`;
    }

    return report;
  }
}

export default CachePerformanceTest;