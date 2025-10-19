/**
 * Analytics & Tracking Validation Suite
 * Testa métricas, logging e tracking para melhoria contínua
 */

import { useIntelligentRouting } from '@/hooks/useIntelligentRouting';
import { analyzeQuestionRouting } from '@/services/intelligentRouting';
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
    expertise: ['education'],
    response_style: 'Educational',
    target_audience: 'Patients',
    system_prompt: 'Educational',
    capabilities: ['educação'],
    example_questions: ['Como explicar?'],
    limitations: ['Não substitui consulta médica'],
    response_format: {}
  }
};

// Mock do console para capturar logs
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

let capturedLogs: Array<{ level: string; message: string; timestamp: number }> = [];

function startLogCapture() {
  capturedLogs = [];
  
  console.log = (...args: unknown[]) => {
    capturedLogs.push({
      level: 'log',
      message: args.join(' '),
      timestamp: Date.now()
    });
    originalConsoleLog(...args);
  };
  
  console.error = (...args: unknown[]) => {
    capturedLogs.push({
      level: 'error',
      message: args.join(' '),
      timestamp: Date.now()
    });
    originalConsoleError(...args);
  };
  
  console.warn = (...args: unknown[]) => {
    capturedLogs.push({
      level: 'warn',
      message: args.join(' '),
      timestamp: Date.now()
    });
    originalConsoleWarn(...args);
  };
}

function stopLogCapture() {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
}

function getLogsByPattern(pattern: string) {
  return capturedLogs.filter(log => 
    log.message.toLowerCase().includes(pattern.toLowerCase())
  );
}

/**
 * Valida tracking de métricas de uso
 */
export async function validateUsageMetrics(): Promise<{
  passed: boolean;
  results: {
    recommendationAcceptance: boolean;
    recommendationRejection: boolean;
    analysisCount: boolean;
    confidenceTracking: boolean;
    scopeDistribution: boolean;
    personaPreferences: boolean;
  };
}> {
  console.log('\n📊 VALIDANDO MÉTRICAS DE USO');
  console.log('=' .repeat(30));

  const results = {
    recommendationAcceptance: false,
    recommendationRejection: false,
    analysisCount: false,
    confidenceTracking: false,
    scopeDistribution: false,
    personaPreferences: false
  };

  try {
    startLogCapture();

    const { result } = renderHook(() => 
      useIntelligentRouting(mockPersonas, { enabled: true })
    );

    // Teste 1: Recommendation Acceptance Tracking
    console.log('📝 Teste 1: Recommendation Acceptance Tracking');
    
    // Simular análise e aceitação
    act(() => {
      result.current.analyzeQuestion('Qual a dose de rifampicina?');
    });

    await waitFor(() => {
      return result.current.currentAnalysis !== null;
    }, { timeout: 2000 });

    const initialAnalytics = result.current.getAnalytics();
    
    act(() => {
      result.current.acceptRecommendation();
    });

    const analyticsAfterAccept = result.current.getAnalytics();
    const acceptanceTracked = analyticsAfterAccept.acceptedRecommendations > initialAnalytics.acceptedRecommendations;
    
    // Verificar logs de aceitação
    const acceptanceLogs = getLogsByPattern('recommendation accepted');
    const logsCapturingAcceptance = acceptanceLogs.length > 0;
    
    results.recommendationAcceptance = acceptanceTracked && logsCapturingAcceptance;
    
    console.log(`   Analytics incrementado: ${acceptanceTracked ? '✅' : '❌'}`);
    console.log(`   Logs capturados: ${logsCapturingAcceptance ? '✅' : '❌'}`);

    // Teste 2: Recommendation Rejection Tracking
    console.log('\n📝 Teste 2: Recommendation Rejection Tracking');
    
    // Nova análise para rejeitar
    act(() => {
      result.current.analyzeQuestion('Como educar o paciente?');
    });

    await waitFor(() => {
      return result.current.currentAnalysis !== null;
    }, { timeout: 2000 });

    const analyticsBeforeReject = result.current.getAnalytics();
    
    act(() => {
      result.current.rejectRecommendation('ga');
    });

    const analyticsAfterReject = result.current.getAnalytics();
    const rejectionTracked = analyticsAfterReject.rejectedRecommendations > analyticsBeforeReject.rejectedRecommendations;
    
    // Verificar logs de rejeição
    const rejectionLogs = getLogsByPattern('recommendation rejected');
    const logsCapturingRejection = rejectionLogs.length > 0;
    
    results.recommendationRejection = rejectionTracked && logsCapturingRejection;
    
    console.log(`   Analytics incrementado: ${rejectionTracked ? '✅' : '❌'}`);
    console.log(`   Logs capturados: ${logsCapturingRejection ? '✅' : '❌'}`);

    // Teste 3: Analysis Count Tracking
    console.log('\n📝 Teste 3: Analysis Count Tracking');
    
    const finalAnalytics = result.current.getAnalytics();
    const analysisCountCorrect = finalAnalytics.totalAnalyses >= 2; // Pelo menos 2 análises
    
    results.analysisCount = analysisCountCorrect;
    console.log(`   Contagem de análises: ${finalAnalytics.totalAnalyses} ${analysisCountCorrect ? '✅' : '❌'}`);

    // Teste 4: Confidence Tracking
    console.log('\n📝 Teste 4: Confidence Tracking');
    
    // Verificar se logs incluem informações de confiança
    const confidenceLogs = capturedLogs.filter(log => 
      log.message.includes('confidence') && /\d+\.?\d*/.test(log.message)
    );
    
    results.confidenceTracking = confidenceLogs.length > 0;
    console.log(`   Confiança nos logs: ${confidenceLogs.length} logs ${results.confidenceTracking ? '✅' : '❌'}`);

    // Teste 5: Scope Distribution
    console.log('\n📝 Teste 5: Scope Distribution');
    
    // Verificar se logs incluem informações de escopo
    const scopeLogs = capturedLogs.filter(log => 
      log.message.includes('scope') || 
      log.message.includes('dosage') || 
      log.message.includes('education') ||
      log.message.includes('clinical')
    );
    
    results.scopeDistribution = scopeLogs.length > 0;
    console.log(`   Escopo nos logs: ${scopeLogs.length} logs ${results.scopeDistribution ? '✅' : '❌'}`);

    // Teste 6: Persona Preferences
    console.log('\n📝 Teste 6: Persona Preferences');
    
    // Verificar se logs incluem informações sobre personas escolhidas
    const personaLogs = capturedLogs.filter(log => 
      log.message.includes('dr_gasnelio') || 
      log.message.includes('ga') ||
      log.message.includes('persona')
    );
    
    results.personaPreferences = personaLogs.length > 0;
    console.log(`   Personas nos logs: ${personaLogs.length} logs ${results.personaPreferences ? '✅' : '❌'}`);

    stopLogCapture();

  } catch (error) {
    console.log(`💥 ERRO na validação de métricas: ${error.message}`);
    stopLogCapture();
  }

  const passed = results.recommendationAcceptance && 
                results.recommendationRejection && 
                results.analysisCount;
  // confidenceTracking, scopeDistribution, personaPreferences são desejáveis mas não críticos

  console.log(`\n📊 Usage Metrics Validation: ${passed ? '✅ PASSOU' : '❌ FALHOU'}`);

  return { passed, results };
}

/**
 * Valida qualidade dos logs para debugging
 */
export async function validateLoggingQuality(): Promise<{
  passed: boolean;
  results: {
    errorLogging: boolean;
    performanceLogging: boolean;
    debugInformation: boolean;
    logStructure: boolean;
    logLevels: boolean;
    sensitiveDataProtection: boolean;
  };
}> {
  console.log('\n📝 VALIDANDO QUALIDADE DOS LOGS');
  console.log('=' .repeat(35));

  const results = {
    errorLogging: false,
    performanceLogging: false,
    debugInformation: false,
    logStructure: false,
    logLevels: false,
    sensitiveDataProtection: false
  };

  try {
    startLogCapture();

    // Teste 1: Error Logging
    console.log('📝 Teste 1: Error Logging');
    
    // Forçar erro para testar logging
    try {
      await analyzeQuestionRouting('test', {});
    } catch (error) {
      // Esperamos que falhe com personas vazias
    }
    
    const errorLogs = capturedLogs.filter(log => 
      log.level === 'error' || log.message.toLowerCase().includes('erro')
    );
    
    results.errorLogging = errorLogs.length > 0;
    console.log(`   Erros logados: ${errorLogs.length} logs ${results.errorLogging ? '✅' : '❌'}`);

    // Teste 2: Performance Logging
    console.log('\n📝 Teste 2: Performance Logging');
    
    // Executar análise normal para capturar logs de performance
    await analyzeQuestionRouting('Qual a dose de rifampicina?', mockPersonas);
    
    const performanceLogs = capturedLogs.filter(log => 
      log.message.includes('ms') || 
      log.message.includes('performance') ||
      log.message.includes('time') ||
      log.message.includes('cache')
    );
    
    results.performanceLogging = performanceLogs.length > 0;
    console.log(`   Performance logada: ${performanceLogs.length} logs ${results.performanceLogging ? '✅' : '❌'}`);

    // Teste 3: Debug Information
    console.log('\n📝 Teste 3: Debug Information');
    
    const debugLogs = capturedLogs.filter(log => 
      log.message.includes('debug') || 
      log.message.includes('analysis:') ||
      log.message.includes('routing:') ||
      log.message.includes('cache:')
    );
    
    results.debugInformation = debugLogs.length > 0;
    console.log(`   Debug info presente: ${debugLogs.length} logs ${results.debugInformation ? '✅' : '❌'}`);

    // Teste 4: Log Structure
    console.log('\n📝 Teste 4: Log Structure');
    
    // Verificar se logs têm estrutura consistente
    let structuredLogs = 0;
    
    capturedLogs.forEach(log => {
      // Logs estruturados devem ter timestamp, level e informações organizadas
      if (log.timestamp && log.level && log.message.includes(':')) {
        structuredLogs++;
      }
    });
    
    const structurePercentage = capturedLogs.length > 0 ? (structuredLogs / capturedLogs.length) * 100 : 0;
    results.logStructure = structurePercentage > 50; // Pelo menos 50% estruturados
    
    console.log(`   Logs estruturados: ${structurePercentage.toFixed(1)}% ${results.logStructure ? '✅' : '❌'}`);

    // Teste 5: Log Levels
    console.log('\n📝 Teste 5: Log Levels');
    
    const hasLogLevels = capturedLogs.some(log => log.level === 'log') &&
                        capturedLogs.some(log => log.level === 'error') &&
                        capturedLogs.some(log => log.level === 'warn');
    
    results.logLevels = hasLogLevels;
    console.log(`   Múltiplos níveis de log: ${hasLogLevels ? '✅' : '❌'}`);
    console.log(`     Logs: ${capturedLogs.filter(l => l.level === 'log').length}`);
    console.log(`     Errors: ${capturedLogs.filter(l => l.level === 'error').length}`);
    console.log(`     Warns: ${capturedLogs.filter(l => l.level === 'warn').length}`);

    // Teste 6: Sensitive Data Protection
    console.log('\n📝 Teste 6: Sensitive Data Protection');
    
    // Verificar se não há dados sensíveis nos logs
    const sensitivePatterns = [
      /password/i,
      /token/i,
      /secret/i,
      /api[_-]?key/i,
      /authorization/i,
      /bearer/i
    ];
    
    let hasSensitiveData = false;
    
    capturedLogs.forEach(log => {
      sensitivePatterns.forEach(pattern => {
        if (pattern.test(log.message)) {
          hasSensitiveData = true;
        }
      });
    });
    
    results.sensitiveDataProtection = !hasSensitiveData;
    console.log(`   Dados sensíveis protegidos: ${results.sensitiveDataProtection ? '✅' : '❌'}`);

    stopLogCapture();

  } catch (error) {
    console.log(`💥 ERRO na validação de logs: ${error.message}`);
    stopLogCapture();
  }

  const passed = results.errorLogging && 
                results.logStructure && 
                results.sensitiveDataProtection;

  console.log(`\n📊 Logging Quality Validation: ${passed ? '✅ PASSOU' : '❌ FALHOU'}`);

  return { passed, results };
}

/**
 * Valida métricas para melhoria contínua
 */
export async function validateContinuousImprovement(): Promise<{
  passed: boolean;
  results: {
    accuracyMetrics: boolean;
    userSatisfaction: boolean;
    performanceTrends: boolean;
    errorPatterns: boolean;
    usagePatterns: boolean;
    improvementOpportunities: boolean;
  };
}> {
  console.log('\n🔄 VALIDANDO MÉTRICAS PARA MELHORIA CONTÍNUA');
  console.log('=' .repeat(45));

  const results = {
    accuracyMetrics: false,
    userSatisfaction: false,
    performanceTrends: false,
    errorPatterns: false,
    usagePatterns: false,
    improvementOpportunities: false
  };

  try {
    startLogCapture();

    const { result } = renderHook(() => 
      useIntelligentRouting(mockPersonas, { enabled: true })
    );

    // Simular sessão de uso diversificada
    const testScenarios = [
      { question: 'Qual a dose de rifampicina?', expectedPersona: 'dr_gasnelio', userChoice: 'dr_gasnelio' },
      { question: 'Como educar o paciente?', expectedPersona: 'ga', userChoice: 'ga' },
      { question: 'Protocolo para MB?', expectedPersona: 'dr_gasnelio', userChoice: 'dr_gasnelio' },
      { question: 'Como explicar para família?', expectedPersona: 'ga', userChoice: 'dr_gasnelio' }, // Discordância
      { question: 'Dispensação na farmácia?', expectedPersona: 'ga', userChoice: 'ga' }
    ];

    // Teste 1: Accuracy Metrics
    console.log('📝 Teste 1: Accuracy Metrics');
    
    let correctRecommendations = 0;
    let totalRecommendations = 0;
    
    for (const scenario of testScenarios) {
      act(() => {
        result.current.analyzeQuestion(scenario.question);
      });

      await waitFor(() => {
        return result.current.currentAnalysis !== null;
      }, { timeout: 2000 });

      const analysis = result.current.currentAnalysis;
      if (analysis) {
        totalRecommendations++;
        if (analysis.recommendedPersonaId === scenario.expectedPersona) {
          correctRecommendations++;
        }
        
        // Simular escolha do usuário
        if (scenario.userChoice === analysis.recommendedPersonaId) {
          act(() => {
            result.current.acceptRecommendation();
          });
        } else {
          act(() => {
            result.current.rejectRecommendation(scenario.userChoice);
          });
        }
      }
    }

    const accuracy = totalRecommendations > 0 ? (correctRecommendations / totalRecommendations) * 100 : 0;
    results.accuracyMetrics = accuracy > 60; // Pelo menos 60% de precisão
    
    console.log(`   Precisão do algoritmo: ${accuracy.toFixed(1)}% ${results.accuracyMetrics ? '✅' : '❌'}`);

    // Teste 2: User Satisfaction (baseado em aceitação)
    console.log('\n📝 Teste 2: User Satisfaction');
    
    const analytics = result.current.getAnalytics();
    const acceptanceRate = analytics.acceptanceRate;
    
    results.userSatisfaction = acceptanceRate > 50; // Pelo menos 50% de aceitação
    console.log(`   Taxa de aceitação: ${acceptanceRate}% ${results.userSatisfaction ? '✅' : '❌'}`);

    // Teste 3: Performance Trends
    console.log('\n📝 Teste 3: Performance Trends');
    
    const performanceLogs = capturedLogs.filter(log => 
      log.message.includes('ms') || log.message.includes('time')
    );
    
    results.performanceTrends = performanceLogs.length > 0;
    console.log(`   Dados de performance coletados: ${performanceLogs.length} logs ${results.performanceTrends ? '✅' : '❌'}`);

    // Teste 4: Error Patterns
    console.log('\n📝 Teste 4: Error Patterns');
    
    const errorLogs = capturedLogs.filter(log => 
      log.level === 'error' || log.message.toLowerCase().includes('erro')
    );
    
    // Verificar se erros são categorizados
    const categorizedErrors = errorLogs.filter(log => 
      log.message.includes('Network') || 
      log.message.includes('Validation') ||
      log.message.includes('Backend')
    );
    
    results.errorPatterns = categorizedErrors.length >= errorLogs.length * 0.5; // 50% categorizados
    console.log(`   Erros categorizados: ${categorizedErrors.length}/${errorLogs.length} ${results.errorPatterns ? '✅' : '❌'}`);

    // Teste 5: Usage Patterns
    console.log('\n📝 Teste 5: Usage Patterns');
    
    // Verificar se há dados sobre padrões de uso
    const usageLogs = capturedLogs.filter(log => 
      log.message.includes('scope') || 
      log.message.includes('confidence') ||
      log.message.includes('persona')
    );
    
    results.usagePatterns = usageLogs.length > 0;
    console.log(`   Padrões de uso capturados: ${usageLogs.length} logs ${results.usagePatterns ? '✅' : '❌'}`);

    // Teste 6: Improvement Opportunities
    console.log('\n📝 Teste 6: Improvement Opportunities');
    
    // Identificar oportunidades baseadas nos logs
    const rejectionLogs = getLogsByPattern('rejected');
    const lowConfidenceLogs = capturedLogs.filter(log => 
      log.message.includes('confidence') && 
      (log.message.includes('0.') && parseFloat(log.message.match(/0\.\d+/)?.[0] || '1') < 0.6)
    );
    
    const hasImprovementData = rejectionLogs.length > 0 || lowConfidenceLogs.length > 0;
    results.improvementOpportunities = hasImprovementData;
    
    console.log(`   Rejeições para análise: ${rejectionLogs.length}`);
    console.log(`   Baixa confiança: ${lowConfidenceLogs.length}`);
    console.log(`   Oportunidades identificadas: ${hasImprovementData ? '✅' : '❌'}`);

    stopLogCapture();

  } catch (error) {
    console.log(`💥 ERRO na validação de melhoria contínua: ${error.message}`);
    stopLogCapture();
  }

  const passed = results.accuracyMetrics && 
                results.userSatisfaction && 
                results.usagePatterns;

  console.log(`\n📊 Continuous Improvement Validation: ${passed ? '✅ PASSOU' : '❌ FALHOU'}`);

  return { passed, results };
}

/**
 * Executa validação completa de analytics
 */
export async function runAnalyticsValidation() {
  console.log('🚀 INICIANDO VALIDAÇÃO DE ANALYTICS & TRACKING');
  console.log('🕒 ' + new Date().toLocaleString());
  console.log('='.repeat(55));

  const results = {
    usageMetrics: await validateUsageMetrics(),
    loggingQuality: await validateLoggingQuality(),
    continuousImprovement: await validateContinuousImprovement()
  };

  // Sumário final
  console.log('\n' + '='.repeat(55));
  console.log('📋 SUMÁRIO DA VALIDAÇÃO DE ANALYTICS');
  console.log('='.repeat(55));
  
  console.log(`${results.usageMetrics.passed ? '✅' : '❌'} Usage Metrics: ${results.usageMetrics.passed ? 'FUNCIONANDO' : 'PROBLEMAS'}`);
  console.log(`${results.loggingQuality.passed ? '✅' : '❌'} Logging Quality: ${results.loggingQuality.passed ? 'ADEQUADA' : 'MELHORIAS NECESSÁRIAS'}`);
  console.log(`${results.continuousImprovement.passed ? '✅' : '❌'} Continuous Improvement: ${results.continuousImprovement.passed ? 'HABILITADA' : 'INSUFICIENTE'}`);

  const overallSuccess = results.usageMetrics.passed && 
                        results.loggingQuality.passed && 
                        results.continuousImprovement.passed;

  console.log('\n🎯 RESULTADO GERAL: ' + (overallSuccess ? '✅ ANALYTICS APROVADO' : '❌ ANALYTICS REQUER MELHORIAS'));

  // Recomendações específicas
  if (!overallSuccess) {
    console.log('\n📈 RECOMENDAÇÕES PARA ANALYTICS:');
    
    if (!results.usageMetrics.passed) {
      console.log('   • Implementar tracking mais robusto de aceitação/rejeição');
      console.log('   • Adicionar métricas de confiança e escopo');
      console.log('   • Melhorar logs de interação do usuário');
    }
    
    if (!results.loggingQuality.passed) {
      console.log('   • Estruturar logs de forma mais consistente');
      console.log('   • Implementar diferentes níveis de log');
      console.log('   • Adicionar proteção para dados sensíveis');
      console.log('   • Melhorar logs de erro e performance');
    }
    
    if (!results.continuousImprovement.passed) {
      console.log('   • Implementar métricas de precisão do algoritmo');
      console.log('   • Adicionar tracking de satisfação do usuário');
      console.log('   • Coletar dados para identificar padrões de melhoria');
      console.log('   • Implementar dashboards de analytics');
    }
  } else {
    console.log('\n✨ PONTOS FORTES DO SISTEMA DE ANALYTICS:');
    console.log('   • Tracking abrangente de interações do usuário');
    console.log('   • Logs estruturados para debugging eficiente');
    console.log('   • Métricas adequadas para melhoria contínua');
    console.log('   • Proteção de dados sensíveis implementada');
  }

  return results;
}