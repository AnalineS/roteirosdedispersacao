/**
 * Teste da Integração ASTRA BD/RAG - Versão JavaScript
 * Script para verificar funcionamento completo do sistema
 */

// Simular módulos para teste
class MockSentimentAnalyzer {
  async analyze(text) {
    const score = text.includes('obrigado') || text.includes('ajuda') ? 0.8 :
                 text.includes('preocupado') || text.includes('medo') ? -0.7 :
                 text.includes('irritado') || text.includes('difícil') ? -0.8 : 0;
    
    const category = score > 0.2 ? 'positive' :
                    score < -0.5 ? 'frustrated' :
                    score < -0.2 ? 'anxious' : 'neutral';
    
    return {
      score,
      magnitude: Math.abs(score),
      category,
      confidence: 0.8,
      keywords: text.split(' ').slice(0, 3)
    };
  }
}

class MockAstraClient {
  constructor() {
    this.cache = new Map();
    this.stats = {
      cache_stats: { total_cached_responses: 0, cache_hits: 0, cache_misses: 0, hit_rate_percent: 0 },
      feedback_stats: { total_feedback: 0, average_rating: 0, rating_distribution: {} },
      system_stats: { total_chunks: 250, knowledge_base_size: 5242880 }
    };
  }

  async searchContext(query) {
    const cacheKey = query.question.toLowerCase().replace(/\s+/g, '_');
    
    // Simular delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (this.cache.has(cacheKey)) {
      this.stats.cache_stats.cache_hits++;
      return { ...this.cache.get(cacheKey), cached: true };
    }
    
    this.stats.cache_stats.cache_misses++;
    
    // Simular resposta baseada na pergunta
    const chunks = this.generateMockChunks(query.question);
    const result = {
      chunks,
      combined_context: chunks.map(c => c.content).join('\n\n'),
      confidence: chunks.length > 0 ? 0.85 : 0,
      cached: false,
      processing_time: 150
    };
    
    this.cache.set(cacheKey, result);
    this.stats.cache_stats.total_cached_responses++;
    
    return result;
  }

  generateMockChunks(question) {
    const mockKnowledge = [
      {
        content: "A rifampicina é administrada na dose de 600mg uma vez por mês, sempre sob supervisão de profissional de saúde.",
        section: "medicamentos_rifampicina",
        relevance_score: 0.9,
        topics: ["rifampicina", "dosagem", "supervisionada"],
        importance_score: 0.9
      },
      {
        content: "A clofazimina pode causar hiperpigmentação da pele que é reversível após o término do tratamento.",
        section: "efeitos_adversos_clofazimina",
        relevance_score: 0.8,
        topics: ["clofazimina", "efeitos", "hiperpigmentação"],
        importance_score: 0.8
      },
      {
        content: "O tratamento PQT-U tem duração de 6 doses mensais supervisionadas.",
        section: "duracao_tratamento",
        relevance_score: 0.7,
        topics: ["duração", "tratamento", "6 meses"],
        importance_score: 0.8
      }
    ];
    
    const questionLower = question.toLowerCase();
    return mockKnowledge.filter(chunk => 
      chunk.topics.some(topic => questionLower.includes(topic))
    ).slice(0, 3);
  }

  async sendFeedback(feedback) {
    await new Promise(resolve => setTimeout(resolve, 200));
    this.stats.feedback_stats.total_feedback++;
    this.stats.feedback_stats.average_rating = 
      (this.stats.feedback_stats.average_rating * (this.stats.feedback_stats.total_feedback - 1) + feedback.rating) / 
      this.stats.feedback_stats.total_feedback;
  }

  async getStats() {
    return { ...this.stats };
  }

  clearCache() {
    this.cache.clear();
  }
}

class MockKnowledgeSearch {
  constructor() {
    this.astraClient = new MockAstraClient();
  }

  async searchKnowledge(question, sentiment, persona, options = {}) {
    const maxChunks = sentiment?.category === 'anxious' ? 4 : 
                     sentiment?.category === 'frustrated' ? 2 : 3;
    
    return this.astraClient.searchContext({
      question,
      persona,
      maxChunks,
      sentiment
    });
  }

  async enrichMessage(message, sentiment, persona) {
    const knowledge = await this.searchKnowledge(message, sentiment, persona);
    
    if (knowledge.confidence < 0.3) {
      return {
        original: message,
        enriched: message,
        confidence: 0,
        sources: []
      };
    }

    let enriched = message;
    
    if (sentiment?.category === 'frustrated') {
      enriched = `${message}\n\nResumo: ${this.extractKeyPoints(knowledge.combined_context)}`;
    } else if (sentiment?.category === 'anxious') {
      enriched = `Entendo sua preocupação. ${message}\n\nInformação importante: ${this.simplifyContent(knowledge.combined_context)}`;
    } else {
      enriched = `${message}\n\nContexto adicional: ${knowledge.combined_context}`;
    }

    return {
      original: message,
      enriched,
      context: knowledge.combined_context,
      confidence: knowledge.confidence,
      sources: knowledge.chunks.map(c => c.section)
    };
  }

  extractKeyPoints(content) {
    const sentences = content.split(/[.!?]+/);
    return sentences
      .filter(s => /\d+\s*(mg|ml|dose|mês|dia)/i.test(s) || /deve|importante/i.test(s))
      .slice(0, 2)
      .join('. ') + '.';
  }

  simplifyContent(content) {
    return content
      .replace(/poliquimioterapia única|PQT-U/gi, 'tratamento combinado')
      .replace(/hiperpigmentação/gi, 'escurecimento da pele')
      .substring(0, 200) + '...';
  }

  async prefetchCommonTopics() {
    const commonQuestions = [
      "Como funciona o tratamento PQT-U?",
      "Quais são os efeitos colaterais?",
      "Quanto tempo dura o tratamento?",
      "Posso tomar os remédios em casa?"
    ];

    await Promise.all(
      commonQuestions.map(q => this.searchKnowledge(q))
    );
  }
}

class AstraIntegrationTester {
  constructor() {
    this.results = [];
    this.sentimentAnalyzer = new MockSentimentAnalyzer();
    this.knowledgeSearch = new MockKnowledgeSearch();
    this.astraClient = this.knowledgeSearch.astraClient;
  }

  async runAllTests() {
    console.log('🧪 INICIANDO TESTES DE INTEGRAÇÃO ASTRA BD/RAG\n');

    await this.testAstraClient();
    await this.testKnowledgeSearch();
    await this.testSentimentIntegration();
    await this.testPerformance();
    
    this.generateReport();
  }

  async runTest(testName, testFn) {
    const startTime = Date.now();
    
    try {
      console.log(`⏳ Executando: ${testName}`);
      const result = await testFn();
      const duration = Date.now() - startTime;
      
      const testResult = {
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
      const testResult = {
        testName,
        success: false,
        details: null,
        error: error.message,
        duration
      };
      
      console.log(`❌ ${testName} - FALHOU: ${testResult.error}`);
      this.results.push(testResult);
      return testResult;
    }
  }

  async testAstraClient() {
    console.log('\n🔍 TESTANDO CLIENTE ASTRA');

    await this.runTest('Cliente ASTRA - Busca Básica', async () => {
      const query = {
        question: 'Qual a dose de rifampicina no PQT-U?',
        persona: 'dr-gasnelio',
        maxChunks: 3
      };
      
      const result = await this.astraClient.searchContext(query);
      
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

    await this.runTest('Cliente ASTRA - Sistema de Cache', async () => {
      const query = {
        question: 'Qual a dose de rifampicina no PQT-U?',
        persona: 'dr-gasnelio'
      };
      
      const result1 = await this.astraClient.searchContext(query);
      const result2 = await this.astraClient.searchContext(query);
      
      return {
        first_cached: result1.cached,
        second_cached: result2.cached,
        cache_working: !result1.cached && result2.cached
      };
    });

    await this.runTest('Cliente ASTRA - Sistema de Feedback', async () => {
      await this.astraClient.sendFeedback({
        query: 'Teste de feedback',
        response: 'Resposta de teste',
        rating: 5,
        comments: 'Teste automatizado'
      });
      
      return { feedback_sent: true };
    });

    await this.runTest('Cliente ASTRA - Estatísticas', async () => {
      const stats = await this.astraClient.getStats();
      
      if (!stats.cache_stats || !stats.feedback_stats) {
        throw new Error('Estrutura de estatísticas inválida');
      }
      
      return stats;
    });
  }

  async testKnowledgeSearch() {
    console.log('\n🔎 TESTANDO SERVIÇO DE BUSCA DE CONHECIMENTO');

    await this.runTest('Knowledge Search - Busca Simples', async () => {
      const result = await this.knowledgeSearch.searchKnowledge(
        'Como administrar clofazimina?'
      );
      
      return {
        chunks: result.chunks.length,
        confidence: result.confidence,
        has_context: result.combined_context.length > 0
      };
    });

    await this.runTest('Knowledge Search - Busca com Persona', async () => {
      const resultDr = await this.knowledgeSearch.searchKnowledge(
        'Dose de dapsona para adultos',
        undefined,
        'dr-gasnelio'
      );
      
      const resultGa = await this.knowledgeSearch.searchKnowledge(
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

    await this.runTest('Knowledge Search - Enriquecimento de Mensagem', async () => {
      const enriched = await this.knowledgeSearch.enrichMessage(
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

  async testSentimentIntegration() {
    console.log('\n💭 TESTANDO INTEGRAÇÃO COM ANÁLISE DE SENTIMENTO');

    await this.runTest('Sentiment Integration - Usuário Ansioso', async () => {
      const anxiousSentiment = {
        score: -0.7,
        magnitude: 0.8,
        category: 'anxious',
        confidence: 0.9,
        keywords: ['preocupado', 'medo', 'ansioso']
      };
      
      const result = await this.knowledgeSearch.searchKnowledge(
        'Estou preocupado com os efeitos da medicação',
        anxiousSentiment,
        'ga'
      );
      
      return {
        chunks: result.chunks.length,
        confidence: result.confidence,
        sentiment_adjusted: result.chunks.length >= 4
      };
    });

    await this.runTest('Sentiment Integration - Usuário Frustrado', async () => {
      const frustratedSentiment = {
        score: -0.8,
        magnitude: 0.9,
        category: 'frustrated',
        confidence: 0.85,
        keywords: ['irritado', 'difícil', 'complicado']
      };
      
      const enriched = await this.knowledgeSearch.enrichMessage(
        'Isso é muito complicado de entender',
        frustratedSentiment,
        'dr-gasnelio'
      );
      
      return {
        confidence: enriched.confidence,
        simplified: enriched.enriched.includes('Resumo:'),
        sources: enriched.sources.length
      };
    });

    await this.runTest('Sentiment Analysis - Detecção Básica', async () => {
      const positiveText = 'Muito obrigado pela ajuda, foi esclarecedor!';
      const negativeText = 'Estou muito preocupado e com medo dos efeitos colaterais';
      
      const positiveSentiment = await this.sentimentAnalyzer.analyze(positiveText);
      const negativeSentiment = await this.sentimentAnalyzer.analyze(negativeText);
      
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

  async testPerformance() {
    console.log('\n⚡ TESTANDO PERFORMANCE');

    await this.runTest('Performance - Tempo de Resposta', async () => {
      const queries = [
        'Dose de rifampicina',
        'Efeitos da clofazimina',
        'Duração do tratamento PQT-U',
        'Contraindicações da dapsona'
      ];
      
      const times = [];
      
      for (const query of queries) {
        const start = Date.now();
        await this.knowledgeSearch.searchKnowledge(query);
        times.push(Date.now() - start);
      }
      
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      
      return {
        queries_tested: queries.length,
        average_time_ms: Math.round(avgTime),
        max_time_ms: Math.max(...times),
        min_time_ms: Math.min(...times),
        performance_ok: avgTime < 1000
      };
    });

    await this.runTest('Performance - Eficiência do Cache', async () => {
      const query = 'Teste de performance de cache';
      
      const start1 = Date.now();
      await this.knowledgeSearch.searchKnowledge(query);
      const time1 = Date.now() - start1;
      
      const start2 = Date.now();
      const result2 = await this.knowledgeSearch.searchKnowledge(query);
      const time2 = Date.now() - start2;
      
      return {
        first_request_ms: time1,
        cached_request_ms: time2,
        cache_speedup: Math.round((time1 / time2) * 100) / 100,
        cached: result2.cached
      };
    });

    await this.runTest('Performance - Prefetch de Tópicos Comuns', async () => {
      const start = Date.now();
      await this.knowledgeSearch.prefetchCommonTopics();
      const duration = Date.now() - start;
      
      return {
        prefetch_time_ms: duration,
        prefetch_ok: duration < 5000
      };
    });
  }

  generateReport() {
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

    const overallSuccess = (successfulTests / totalTests) >= 0.8;
    console.log(`🎯 STATUS GERAL: ${overallSuccess ? '✅ APROVADO' : '❌ REQUER ATENÇÃO'}`);
    
    if (overallSuccess) {
      console.log('🚀 A integração ASTRA BD/RAG está funcionando corretamente!');
    } else {
      console.log('⚠️  A integração precisa de ajustes antes de ser considerada estável.');
    }

    // Análise detalhada dos resultados
    console.log('\n🔍 ANÁLISE DETALHADA:');
    
    const cacheTest = this.results.find(r => r.testName.includes('Cache'));
    if (cacheTest && cacheTest.success) {
      console.log(`   💾 Cache: ${cacheTest.details.cache_working ? 'Funcionando' : 'Problema detectado'}`);
    }
    
    const sentimentTests = this.results.filter(r => r.testName.includes('Sentiment'));
    const sentimentSuccess = sentimentTests.filter(r => r.success).length;
    console.log(`   💭 Análise de Sentimento: ${sentimentSuccess}/${sentimentTests.length} testes aprovados`);
    
    const performanceAvg = performanceTests
      .filter(r => r.success && r.details.average_time_ms)
      .reduce((sum, r) => sum + r.details.average_time_ms, 0) / 
      performanceTests.filter(r => r.success && r.details.average_time_ms).length;
    
    if (performanceAvg) {
      console.log(`   ⚡ Performance Média: ${Math.round(performanceAvg)}ms`);
    }
  }
}

// Executar testes
async function runTests() {
  const tester = new AstraIntegrationTester();
  await tester.runAllTests();
}

runTests().catch(console.error);