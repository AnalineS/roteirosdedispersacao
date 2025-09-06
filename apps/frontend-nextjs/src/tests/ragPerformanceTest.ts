/**
 * RAG Performance Test Suite
 * Testa performance completa do sistema RAG
 * Validação end-to-end da implementação Supabase
 */

import { ragIntegrationService } from '../services/ragIntegrationService';
import { ragPerformanceOptimizer } from '../services/ragPerformanceOptimizer';
import { semanticSearchEngine } from '../services/semanticSearchEngine';
import { embeddingService } from '../services/embeddingService';
import { medicalKnowledgeBase } from '../services/medicalKnowledgeBase';

interface RAGPerformanceResult {
  component: string;
  operation: string;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  successRate: number;
  throughput: number; // operations per second
  errorCount: number;
  cacheHitRate?: number;
  qualityScore?: number;
}

interface RAGTestMetrics {
  timestamp: number;
  testSuite: string;
  results: RAGPerformanceResult[];
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    averageResponseTime: number;
    overallThroughput: number;
    systemHealthScore: number; // 0-100
    qualityScore: number; // 0-100
  };
  recommendations: string[];
  systemStatus: 'excellent' | 'good' | 'acceptable' | 'needs_improvement' | 'critical';
}

export class RAGPerformanceTest {
  private results: RAGPerformanceResult[] = [];
  private testQueries: string[] = [
    'rifampicina dose',
    'dapsona efeitos colaterais',
    'clofazimina coloração da pele',
    'PQT-U duração do tratamento',
    'hanseníase contraindicações',
    'como administrar medicamentos hanseníase',
    'interações medicamentosas PQT',
    'monitoramento durante tratamento',
    'adesão ao tratamento hanseníase',
    'orientações para pacientes'
  ];

  private complexQueries: string[] = [
    'Quais são todas as contraindicações da rifampicina em pacientes com hanseníase e como isso afeta o protocolo PQT-U?',
    'Como calcular a dose ajustada de dapsona para pacientes pediátricos com hanseníase multibacilar?',
    'Qual o protocolo completo para manejo de reações adversas graves durante tratamento PQT-U?'
  ];

  /**
   * Executa suite completa de testes de performance RAG
   */
  async runCompleteRAGPerformanceTest(): Promise<RAGTestMetrics> {
    console.log('🧠 Iniciando testes de performance do sistema RAG...');

    const startTime = Date.now();
    
    try {
      // 1. Testes básicos de componentes
      await this.testEmbeddingService();
      
      // 2. Testes de knowledge base
      await this.testMedicalKnowledgeBase();
      
      // 3. Testes de busca semântica
      await this.testSemanticSearchEngine();
      
      // 4. Testes de integração RAG
      await this.testRAGIntegration();
      
      // 5. Testes de otimização
      await this.testPerformanceOptimizer();
      
      // 6. Testes de stress
      await this.testStressScenarios();
      
      // 7. Testes de qualidade
      await this.testResponseQuality();

      const metrics = this.calculateMetrics();
      
      console.log('✅ Testes de performance RAG concluídos');
      console.log(`📊 Score de saúde do sistema: ${metrics.summary.systemHealthScore}/100`);
      console.log(`⚡ Tempo médio de resposta: ${metrics.summary.averageResponseTime}ms`);
      console.log(`🎯 Score de qualidade: ${metrics.summary.qualityScore}/100`);
      
      return metrics;

    } catch (error) {
      console.error('❌ Erro durante testes de performance RAG:', error);
      throw error;
    }
  }

  /**
   * Testa serviço de embeddings
   */
  private async testEmbeddingService(): Promise<void> {
    console.log('🔤 Testando serviço de embeddings...');

    const testTexts = [
      'rifampicina 600mg',
      'dapsona administração diária',
      'clofazimina efeitos adversos',
      'PQT-U protocolo tratamento',
      'hanseníase orientações paciente'
    ];

    // Teste individual
    const singleResult = await this.measureOperation(
      'Embedding Service',
      'single_text_embedding',
      async () => {
        return await embeddingService.embedSingleText('rifampicina dose');
      }
    );
    this.results.push(singleResult);

    // Teste em lote
    const batchResult = await this.measureOperation(
      'Embedding Service',
      'batch_embeddings',
      async () => {
        return await embeddingService.generateEmbeddings({
          texts: testTexts,
          useCache: true,
          batchSize: 3
        });
      }
    );
    this.results.push(batchResult);

    // Teste de cache
    const cacheResult = await this.measureOperation(
      'Embedding Service',
      'cached_embeddings',
      async () => {
        // Segunda chamada deve usar cache
        return await embeddingService.embedSingleText('rifampicina dose');
      }
    );
    this.results.push(cacheResult);
  }

  /**
   * Testa base de conhecimento médico
   */
  private async testMedicalKnowledgeBase(): Promise<void> {
    console.log('📚 Testando base de conhecimento médico...');

    // Teste de busca por categoria
    const categoryResult = await this.measureOperation(
      'Medical Knowledge Base',
      'search_by_category',
      async () => {
        return await medicalKnowledgeBase.searchByCategory('dosage', 'rifampicina');
      }
    );
    this.results.push(categoryResult);

    // Teste de busca crítica
    const criticalResult = await this.measureOperation(
      'Medical Knowledge Base',
      'critical_search',
      async () => {
        return await medicalKnowledgeBase.searchCritical('contraindicações rifampicina');
      }
    );
    this.results.push(criticalResult);

    // Teste de busca geral
    const generalResult = await this.measureOperation(
      'Medical Knowledge Base',
      'general_search',
      async () => {
        return await medicalKnowledgeBase.search('hanseníase tratamento', {
          maxResults: 5,
          useChunks: true
        });
      }
    );
    this.results.push(generalResult);
  }

  /**
   * Testa motor de busca semântica
   */
  private async testSemanticSearchEngine(): Promise<void> {
    console.log('🔍 Testando motor de busca semântica...');

    // Teste de busca rápida
    const quickResult = await this.measureOperation(
      'Semantic Search Engine',
      'quick_search',
      async () => {
        return await semanticSearchEngine.quickSearch('dapsona efeitos');
      }
    );
    this.results.push(quickResult);

    // Teste de busca com sugestões
    const suggestionsResult = await this.measureOperation(
      'Semantic Search Engine',
      'search_with_suggestions',
      async () => {
        return await semanticSearchEngine.searchWithSuggestions('rifamp');
      }
    );
    this.results.push(suggestionsResult);

    // Teste de busca similar
    const similarResult = await this.measureOperation(
      'Semantic Search Engine',
      'find_similar',
      async () => {
        return await semanticSearchEngine.findSimilar('medicamento para hanseníase');
      }
    );
    this.results.push(similarResult);

    // Teste de análise de query
    const analysisResult = await this.measureOperation(
      'Semantic Search Engine',
      'query_analysis',
      async () => {
        return semanticSearchEngine.analyzeQuery('qual a dose de rifampicina para hanseníase?');
      }
    );
    this.results.push(analysisResult);
  }

  /**
   * Testa integração RAG completa
   */
  private async testRAGIntegration(): Promise<void> {
    console.log('🧠 Testando integração RAG...');

    // Teste queries simples
    for (const query of this.testQueries.slice(0, 5)) {
      const result = await this.measureOperation(
        'RAG Integration',
        'simple_query',
        async () => {
          return await ragIntegrationService.query(query, 'dr_gasnelio');
        }
      );
      this.results.push(result);
    }

    // Teste queries complexas
    for (const query of this.complexQueries) {
      const result = await this.measureOperation(
        'RAG Integration',
        'complex_query',
        async () => {
          return await ragIntegrationService.query(query, 'dr_gasnelio');
        }
      );
      this.results.push(result);
    }

    // Teste de busca RAG
    const searchResult = await this.measureOperation(
      'RAG Integration',
      'semantic_search',
      async () => {
        return await ragIntegrationService.search('rifampicina contraindicações', {
          maxResults: 3,
          categories: ['contraindication']
        });
      }
    );
    this.results.push(searchResult);

    // Health check
    const healthResult = await this.measureOperation(
      'RAG Integration',
      'health_check',
      async () => {
        return await ragIntegrationService.healthCheck();
      }
    );
    this.results.push(healthResult);
  }

  /**
   * Testa otimizador de performance
   */
  private async testPerformanceOptimizer(): Promise<void> {
    console.log('⚡ Testando otimizador de performance...');

    // Teste query otimizada
    const optimizedResult = await this.measureOperation(
      'Performance Optimizer',
      'optimized_query',
      async () => {
        return await ragPerformanceOptimizer.optimizedQuery('rifampicina dose efeitos');
      }
    );
    this.results.push(optimizedResult);

    // Teste busca otimizada
    const optimizedSearchResult = await this.measureOperation(
      'Performance Optimizer',
      'optimized_search',
      async () => {
        return await ragPerformanceOptimizer.optimizedSearch('dapsona administração');
      }
    );
    this.results.push(optimizedSearchResult);

    // Teste auto-otimização
    const autoOptimizeResult = await this.measureOperation(
      'Performance Optimizer',
      'auto_optimize',
      async () => {
        return await ragPerformanceOptimizer.autoOptimize();
      }
    );
    this.results.push(autoOptimizeResult);
  }

  /**
   * Testa cenários de stress
   */
  private async testStressScenarios(): Promise<void> {
    console.log('🔥 Testando cenários de stress...');

    // Teste de queries simultâneas
    const concurrentResult = await this.measureOperation(
      'Stress Test',
      'concurrent_queries',
      async () => {
        const promises = this.testQueries.slice(0, 5).map(query =>
          ragIntegrationService.query(query, 'dr_gasnelio')
        );
        return await Promise.all(promises);
      }
    );
    this.results.push(concurrentResult);

    // Teste de queries rápidas sequenciais
    const rapidResult = await this.measureOperation(
      'Stress Test',
      'rapid_sequential',
      async () => {
        const results = [];
        for (const query of this.testQueries.slice(0, 3)) {
          const result = await ragIntegrationService.query(query, 'ga');
          results.push(result);
        }
        return results;
      }
    );
    this.results.push(rapidResult);

    // Teste de embedding em lote grande
    const largeBatchResult = await this.measureOperation(
      'Stress Test',
      'large_batch_embeddings',
      async () => {
        const texts = Array(20).fill(null).map((_, i) => `teste embedding ${i} hanseníase rifampicina`);
        return await embeddingService.generateEmbeddings({
          texts,
          batchSize: 5,
          useCache: false
        });
      }
    );
    this.results.push(largeBatchResult);
  }

  /**
   * Testa qualidade das respostas
   */
  private async testResponseQuality(): Promise<void> {
    console.log('🎯 Testando qualidade das respostas...');

    const qualityTests = [
      'Qual é a dose da rifampicina?',
      'Posso tomar dapsona se estou grávida?',
      'Clofazimina escurece a pele?'
    ];

    for (const query of qualityTests) {
      const result = await this.measureOperation(
        'Quality Test',
        'response_quality',
        async () => {
          const response = await ragIntegrationService.query(query, 'dr_gasnelio');
          
          // Avaliar qualidade da resposta
          const qualityScore = this.evaluateResponseQuality(response, query);
          return { response, qualityScore };
        }
      );
      
      // Adicionar score de qualidade ao resultado
      result.qualityScore = (result as any).result?.qualityScore || 0;
      this.results.push(result);
    }
  }

  /**
   * Mede performance de uma operação
   */
  private async measureOperation(
    component: string,
    operation: string,
    testFunction: () => Promise<any>,
    iterations: number = 3
  ): Promise<RAGPerformanceResult> {
    const times: number[] = [];
    let errorCount = 0;
    let results: any[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      try {
        const result = await testFunction();
        const end = performance.now();
        times.push(end - start);
        results.push(result);
      } catch (error) {
        errorCount++;
        console.warn(`Error in ${operation} iteration ${i + 1}:`, error);
      }
    }

    const avgTime = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
    const successRate = ((iterations - errorCount) / iterations) * 100;
    const throughput = avgTime > 0 ? 1000 / avgTime : 0;

    return {
      component,
      operation,
      avgResponseTime: avgTime,
      minResponseTime: Math.min(...times),
      maxResponseTime: Math.max(...times),
      successRate,
      throughput,
      errorCount,
      cacheHitRate: this.calculateCacheHitRate(results),
      qualityScore: this.calculateQualityScore(results)
    };
  }

  /**
   * Avalia qualidade de uma resposta
   */
  private evaluateResponseQuality(response: any, query: string): number {
    if (!response || !response.answer) return 0;

    let score = 0;

    // Fator 1: Tem resposta substancial
    if (response.answer.length > 50) score += 25;

    // Fator 2: Qualidade reportada pelo sistema
    if (response.qualityScore) score += response.qualityScore * 30;

    // Fator 3: Tem fontes
    if (response.sources && response.sources.length > 0) score += 20;

    // Fator 4: Contexto relevante
    if (response.context && response.context.chunks.length > 0) score += 15;

    // Fator 5: Poucas limitações
    if (!response.limitations || response.limitations.length < 2) score += 10;

    return Math.min(100, score);
  }

  /**
   * Calcula taxa de cache hit dos resultados
   */
  private calculateCacheHitRate(results: any[]): number {
    if (results.length === 0) return 0;

    const cacheHits = results.filter(r => r?.cached || r?.response?.cached).length;
    return (cacheHits / results.length) * 100;
  }

  /**
   * Calcula score de qualidade dos resultados
   */
  private calculateQualityScore(results: any[]): number {
    if (results.length === 0) return 0;

    const scores = results.map(r => {
      if (r?.qualityScore) return r.qualityScore;
      if (r?.response?.qualityScore) return r.response.qualityScore * 100;
      return 50; // Score neutro
    });

    return scores.reduce((a, b) => a + b, 0) / scores.length;
  }

  /**
   * Calcula métricas finais
   */
  private calculateMetrics(): RAGTestMetrics {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.successRate >= 80).length;
    const failedTests = totalTests - passedTests;

    const avgResponseTime = this.results.reduce((sum, r) => sum + r.avgResponseTime, 0) / totalTests;
    const overallThroughput = this.results.reduce((sum, r) => sum + r.throughput, 0) / totalTests;

    // System Health Score (0-100)
    const successRate = (passedTests / totalTests) * 100;
    const performanceScore = avgResponseTime < 1000 ? 100 : Math.max(0, 100 - (avgResponseTime - 1000) / 50);
    const qualityScore = this.results.reduce((sum, r) => sum + (r.qualityScore || 70), 0) / totalTests;
    
    const systemHealthScore = (successRate * 0.4 + performanceScore * 0.3 + qualityScore * 0.3);

    // Recomendações
    const recommendations: string[] = [];
    
    if (avgResponseTime > 1500) {
      recommendations.push('Otimizar tempo de resposta - considerando habilitar batching');
    }
    
    if (successRate < 90) {
      recommendations.push('Melhorar taxa de sucesso - verificar componentes com falhas');
    }
    
    if (qualityScore < 70) {
      recommendations.push('Melhorar qualidade das respostas - revisar knowledge base');
    }

    const avgCacheHitRate = this.results.reduce((sum, r) => sum + (r.cacheHitRate || 0), 0) / totalTests;
    if (avgCacheHitRate < 30) {
      recommendations.push('Implementar melhor estratégia de cache');
    }

    // Status do sistema
    let systemStatus: RAGTestMetrics['systemStatus'] = 'critical';
    if (systemHealthScore >= 90) systemStatus = 'excellent';
    else if (systemHealthScore >= 80) systemStatus = 'good';
    else if (systemHealthScore >= 70) systemStatus = 'acceptable';
    else if (systemHealthScore >= 60) systemStatus = 'needs_improvement';

    return {
      timestamp: Date.now(),
      testSuite: 'RAG Complete Performance Test Suite v1.0',
      results: this.results,
      summary: {
        totalTests,
        passedTests,
        failedTests,
        averageResponseTime: avgResponseTime,
        overallThroughput,
        systemHealthScore: Math.round(systemHealthScore),
        qualityScore: Math.round(qualityScore)
      },
      recommendations,
      systemStatus
    };
  }

  /**
   * Gera relatório detalhado
   */
  generateDetailedReport(metrics: RAGTestMetrics): string {
    let report = `
# RAG System Performance Report
Generated: ${new Date(metrics.timestamp).toISOString()}
Test Suite: ${metrics.testSuite}

## Executive Summary
- **System Status**: ${metrics.systemStatus.toUpperCase()}
- **Health Score**: ${metrics.summary.systemHealthScore}/100
- **Quality Score**: ${metrics.summary.qualityScore}/100
- **Average Response Time**: ${metrics.summary.averageResponseTime.toFixed(0)}ms
- **Overall Throughput**: ${metrics.summary.overallThroughput.toFixed(2)} ops/sec

## Test Results Summary
- **Total Tests**: ${metrics.summary.totalTests}
- **Passed**: ${metrics.summary.passedTests} (${((metrics.summary.passedTests / metrics.summary.totalTests) * 100).toFixed(1)}%)
- **Failed**: ${metrics.summary.failedTests}

## Component Performance
`;

    const groupedResults = metrics.results.reduce((groups: any, result) => {
      if (!groups[result.component]) {
        groups[result.component] = [];
      }
      groups[result.component].push(result);
      return groups;
    }, {});

    for (const [component, results] of Object.entries(groupedResults) as [string, RAGPerformanceResult[]][]) {
      report += `\n### ${component}\n`;
      for (const result of results) {
        const status = result.successRate >= 80 ? '✅' : '❌';
        report += `${status} **${result.operation}**: ${result.avgResponseTime.toFixed(0)}ms avg, ${result.successRate.toFixed(0)}% success`;
        if (result.qualityScore) {
          report += `, ${result.qualityScore.toFixed(0)}% quality`;
        }
        report += `\n`;
      }
    }

    report += `\n## Recommendations\n`;
    metrics.recommendations.forEach(rec => {
      report += `- ${rec}\n`;
    });

    if (metrics.summary.systemHealthScore >= 85) {
      report += `\n## Conclusion
✅ **Sistema RAG funcionando excelentemente**
- Performance superior às expectativas
- Qualidade de respostas satisfatória
- Componentes integrados e estáveis
`;
    } else if (metrics.summary.systemHealthScore >= 70) {
      report += `\n## Conclusion
⚠️ **Sistema RAG funcionando adequadamente com oportunidades de melhoria**
- Performance aceitável para produção
- Algumas otimizações recomendadas
- Monitoramento contínuo sugerido
`;
    } else {
      report += `\n## Conclusion
❌ **Sistema RAG requer atenção imediata**
- Performance abaixo do esperado
- Melhorias críticas necessárias antes da produção
- Revisão arquitetural recomendada
`;
    }

    return report;
  }
}

export default RAGPerformanceTest;