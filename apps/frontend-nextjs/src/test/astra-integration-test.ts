/**
 * Teste da Integração ASTRA BD/RAG
 * Script para verificar funcionamento completo do sistema
 */

import { astraClient, AstraQuery } from '../services/astraClient';
import { knowledgeSearch, searchRelevantKnowledge, enrichWithContext } from '../services/knowledgeSearch';
import { sentimentAnalyzer, SentimentCategory } from '../services/sentimentAnalysis';

// Simular ambiente do navegador
if (typeof window === 'undefined') {
  global.window = {} as any;
  global.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
    length: 0,
    key: () => null
  };
}

interface TestResult {
  testName: string;
  success: boolean;
  details: any;
  error?: string;
  duration: number;
}

class AstraIntegrationTester {
  private results: TestResult[] = [];

  async runAllTests(): Promise<void> {
    console.log('🧪 INICIANDO TESTES DE INTEGRAÇÃO ASTRA BD/RAG\n');

    // Testes do Cliente ASTRA
    await this.testAstraClient();
    
    // Testes do Serviço de Busca
    await this.testKnowledgeSearch();
    
    // Testes de Integração com Sentimento
    await this.testSentimentIntegration();
    
    // Testes de Performance
    await this.testPerformance();
    
    // Relatório final
    this.generateReport();
  }

  private async runTest(testName: string, testFn: () => Promise<any>): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      console.log(`⏳ Executando: ${testName}`);
      const result = await testFn();
      const duration = Date.now() - startTime;
      
      const testResult: TestResult = {
        testName,
        success: true,
        details: result,
        duration
      };
      
      console.log(`✅ ${testName} - ${duration}ms`);
      this.results.push(testResult);
      return testResult;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      const testResult: TestResult = {
        testName,
        success: false,
        details: null,
        error: error instanceof Error ? error.message : String(error),
        duration
      };
      
      console.log(`❌ ${testName} - FALHOU: ${testResult.error}`);
      this.results.push(testResult);
      return testResult;
    }
  }

  private async testAstraClient(): Promise<void> {
    console.log('\n🔍 TESTANDO CLIENTE ASTRA');

    // Teste 1: Busca básica
    await this.runTest('Cliente ASTRA - Busca Básica', async () => {
      const query: AstraQuery = {
        question: 'Qual a dose de rifampicina no PQT-U?',
        persona: 'dr-gasnelio',
        maxChunks: 3
      };
      
      const result = await astraClient.searchContext(query);
      
      if (!result.chunks || result.chunks.length === 0) {
        throw new Error('Nenhum chunk retornado');
      }
      
      return {
        chunks: result.chunks.length,
        confidence: result.confidence,
        cached: result.cached,
        processing_time: result.processing_time
      };
    });

    // Teste 2: Cache
    await this.runTest('Cliente ASTRA - Sistema de Cache', async () => {
      const query: AstraQuery = {
        question: 'Qual a dose de rifampicina no PQT-U?',
        persona: 'dr-gasnelio'
      };
      
      // Primeira busca
      const result1 = await astraClient.searchContext(query);
      
      // Segunda busca (deve usar cache)
      const result2 = await astraClient.searchContext(query);
      
      return {
        first_cached: result1.cached,
        second_cached: result2.cached,
        cache_working: !result1.cached && result2.cached
      };
    });

    // Teste 3: Feedback
    await this.runTest('Cliente ASTRA - Sistema de Feedback', async () => {
      await astraClient.sendFeedback({
        query: 'Teste de feedback',
        response: 'Resposta de teste',
        rating: 5,
        comments: 'Teste automatizado'
      });
      
      return { feedback_sent: true };
    });

    // Teste 4: Estatísticas
    await this.runTest('Cliente ASTRA - Estatísticas', async () => {
      const stats = await astraClient.getStats();
      
      if (!stats.cache_stats || !stats.feedback_stats) {
        throw new Error('Estrutura de estatísticas inválida');
      }
      
      return stats;
    });
  }

  private async testKnowledgeSearch(): Promise<void> {
    console.log('\n🔎 TESTANDO SERVIÇO DE BUSCA DE CONHECIMENTO');

    // Teste 1: Busca sem sentimento
    await this.runTest('Knowledge Search - Busca Simples', async () => {
      const result = await searchRelevantKnowledge(
        'Como administrar clofazimina?'
      );
      
      return {
        chunks: result.chunks.length,
        confidence: result.confidence,
        has_context: result.combined_context.length > 0
      };
    });

    // Teste 2: Busca com persona
    await this.runTest('Knowledge Search - Busca com Persona', async () => {
      const resultDr = await searchRelevantKnowledge(
        'Dose de dapsona para adultos',
        undefined,
        'dr-gasnelio'
      );
      
      const resultGa = await searchRelevantKnowledge(
        'Dose de dapsona para adultos',
        undefined,
        'ga'
      );
      
      return {
        dr_gasnelio: {
          chunks: resultDr.chunks.length,
          confidence: resultDr.confidence
        },
        ga: {
          chunks: resultGa.chunks.length,
          confidence: resultGa.confidence
        }
      };
    });

    // Teste 3: Enriquecimento de mensagem
    await this.runTest('Knowledge Search - Enriquecimento de Mensagem', async () => {
      const enriched = await enrichWithContext(
        'Tenho dúvidas sobre efeitos colaterais',
        undefined,
        'ga'
      );
      
      return {
        original_length: enriched.original.length,
        enriched_length: enriched.enriched.length,
        confidence: enriched.confidence,
        sources: enriched.sources.length,
        was_enriched: enriched.enriched !== enriched.original
      };
    });
  }

  private async testSentimentIntegration(): Promise<void> {
    console.log('\n💭 TESTANDO INTEGRAÇÃO COM ANÁLISE DE SENTIMENTO');

    // Teste 1: Busca com sentimento ansioso
    await this.runTest('Sentiment Integration - Usuário Ansioso', async () => {
      const anxiousSentiment = {
        score: -0.7,
        magnitude: 0.8,
        category: SentimentCategory.ANXIOUS,
        confidence: 0.9,
        keywords: ['preocupado', 'medo', 'ansioso']
      };
      
      const result = await searchRelevantKnowledge(
        'Estou preocupado com os efeitos da medicação',
        anxiousSentiment,
        'ga'
      );
      
      return {
        chunks: result.chunks.length,
        confidence: result.confidence,
        sentiment_adjusted: result.chunks.length >= 4 // Deve retornar mais chunks para ansiosos
      };
    });

    // Teste 2: Busca com sentimento frustrado
    await this.runTest('Sentiment Integration - Usuário Frustrado', async () => {
      const frustratedSentiment = {
        score: -0.8,
        magnitude: 0.9,
        category: SentimentCategory.FRUSTRATED,
        confidence: 0.85,
        keywords: ['irritado', 'difícil', 'complicado']
      };
      
      const enriched = await enrichWithContext(
        'Isso é muito complicado de entender',
        frustratedSentiment,
        'dr-gasnelio'
      );
      
      return {
        confidence: enriched.confidence,
        simplified: enriched.enriched.includes('Resumo:'), // Deve incluir resumo para frustrados
        sources: enriched.sources.length
      };
    });

    // Teste 3: Análise de sentimento funcionando
    await this.runTest('Sentiment Analysis - Detecção Básica', async () => {
      const positiveText = 'Muito obrigado pela ajuda, foi esclarecedor!';
      const negativeText = 'Estou muito preocupado e com medo dos efeitos colaterais';
      
      const positiveSentiment = await sentimentAnalyzer.analyze(positiveText);
      const negativeSentiment = await sentimentAnalyzer.analyze(negativeText);
      
      return {
        positive: {
          score: positiveSentiment.score,
          category: positiveSentiment.category,
          correct: positiveSentiment.score > 0
        },
        negative: {
          score: negativeSentiment.score,
          category: negativeSentiment.category,
          correct: negativeSentiment.score < 0
        }
      };
    });
  }

  private async testPerformance(): Promise<void> {
    console.log('\n⚡ TESTANDO PERFORMANCE');

    // Teste 1: Tempo de resposta
    await this.runTest('Performance - Tempo de Resposta', async () => {
      const queries = [
        'Dose de rifampicina',
        'Efeitos da clofazimina',
        'Duração do tratamento PQT-U',
        'Contraindicações da dapsona'
      ];
      
      const times: number[] = [];
      
      for (const query of queries) {
        const start = Date.now();
        await searchRelevantKnowledge(query);
        times.push(Date.now() - start);
      }
      
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      
      return {
        queries_tested: queries.length,
        average_time_ms: Math.round(avgTime),
        max_time_ms: Math.max(...times),
        min_time_ms: Math.min(...times),
        performance_ok: avgTime < 1000 // Menos de 1 segundo
      };
    });

    // Teste 2: Cache Performance
    await this.runTest('Performance - Eficiência do Cache', async () => {
      const query = 'Teste de performance de cache';
      
      // Primeira busca (sem cache)
      const start1 = Date.now();
      await searchRelevantKnowledge(query);
      const time1 = Date.now() - start1;
      
      // Segunda busca (com cache)
      const start2 = Date.now();
      const result2 = await searchRelevantKnowledge(query);
      const time2 = Date.now() - start2;
      
      return {
        first_request_ms: time1,
        cached_request_ms: time2,
        cache_speedup: Math.round((time1 / time2) * 100) / 100,
        cached: result2.cached
      };
    });

    // Teste 3: Prefetch
    await this.runTest('Performance - Prefetch de Tópicos Comuns', async () => {
      const start = Date.now();
      await knowledgeSearch.prefetchCommonTopics();
      const duration = Date.now() - start;
      
      return {
        prefetch_time_ms: duration,
        prefetch_ok: duration < 5000 // Menos de 5 segundos
      };
    });
  }

  private generateReport(): void {
    console.log('\n📊 RELATÓRIO FINAL DOS TESTES\n');
    
    const totalTests = this.results.length;
    const successfulTests = this.results.filter(r => r.success).length;
    const failedTests = totalTests - successfulTests;
    const averageTime = this.results.reduce((sum, r) => sum + r.duration, 0) / totalTests;
    
    console.log(`📈 RESUMO GERAL:`);
    console.log(`   Total de Testes: ${totalTests}`);
    console.log(`   ✅ Sucessos: ${successfulTests}`);
    console.log(`   ❌ Falhas: ${failedTests}`);
    console.log(`   📊 Taxa de Sucesso: ${Math.round((successfulTests / totalTests) * 100)}%`);
    console.log(`   ⏱️  Tempo Médio: ${Math.round(averageTime)}ms\n`);

    if (failedTests > 0) {
      console.log('❌ TESTES QUE FALHARAM:');
      this.results
        .filter(r => !r.success)
        .forEach(r => {
          console.log(`   • ${r.testName}: ${r.error}`);
        });
      console.log('');
    }

    // Detalhes dos testes de performance
    const performanceTests = this.results.filter(r => r.testName.includes('Performance'));
    if (performanceTests.length > 0) {
      console.log('⚡ MÉTRICAS DE PERFORMANCE:');
      performanceTests.forEach(test => {
        if (test.success && test.details) {
          console.log(`   • ${test.testName}:`);
          Object.entries(test.details).forEach(([key, value]) => {
            console.log(`     - ${key}: ${value}`);
          });
        }
      });
      console.log('');
    }

    // Status geral
    const overallSuccess = (successfulTests / totalTests) >= 0.8; // 80% de sucesso
    console.log(`🎯 STATUS GERAL: ${overallSuccess ? '✅ APROVADO' : '❌ REQUER ATENÇÃO'}`);
    
    if (overallSuccess) {
      console.log('🚀 A integração ASTRA BD/RAG está funcionando corretamente!');
    } else {
      console.log('⚠️  A integração precisa de ajustes antes de ser considerada estável.');
    }
  }
}

// Exportar função principal para uso externo
export async function testAstraIntegration(): Promise<void> {
  const tester = new AstraIntegrationTester();
  await tester.runAllTests();
}

// Executar testes se chamado diretamente
if (require.main === module) {
  testAstraIntegration().catch(console.error);
}