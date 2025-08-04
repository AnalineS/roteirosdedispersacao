/**
 * Master Validation Suite - Sistema de Roteamento Inteligente
 * Orquestra todas as validações e gera relatório completo
 * 
 * QA Engineer: Validação sistemática da FASE 3.2.1
 * Critérios de Aprovação: Robustez, Performance, UX, Integração
 */

import { runCompleteValidation } from './intelligentRouting.validation';
import { runPerformanceValidation } from './performance.validation';
import { runErrorHandlingValidation } from './errorHandling.validation';
import { runUIUXValidation } from './uiux.validation';
import { runIntegrationValidation } from './integration.validation';
import { runAnalyticsValidation } from './analytics.validation';

interface ValidationResult {
  passed: boolean;
  score: number;
  criticalIssues: string[];
  recommendations: string[];
  details: any;
}

interface ValidationSummary {
  overallScore: number;
  overallPassed: boolean;
  categoryResults: {
    functional: ValidationResult;
    performance: ValidationResult;
    errorHandling: ValidationResult;
    uiux: ValidationResult;
    integration: ValidationResult;
    analytics: ValidationResult;
  };
  criticalIssues: string[];
  recommendations: string[];
  deploymentReadiness: {
    ready: boolean;
    blockers: string[];
    improvements: string[];
  };
}

/**
 * Calcula score baseado nos resultados
 */
function calculateScore(results: any): number {
  if (!results || typeof results !== 'object') return 0;
  
  let totalPoints = 0;
  let maxPoints = 0;
  
  // Percorre resultados recursivamente
  function scoreResults(obj: any, weight: number = 1): void {
    if (typeof obj === 'boolean') {
      maxPoints += weight;
      if (obj) totalPoints += weight;
    } else if (typeof obj === 'object' && obj !== null) {
      Object.values(obj).forEach(value => {
        scoreResults(value, weight * 0.5);
      });
    }
  }
  
  scoreResults(results);
  
  return maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0;
}

/**
 * Extrai issues críticos dos resultados
 */
function extractCriticalIssues(categoryName: string, results: any): string[] {
  const issues: string[] = [];
  
  switch (categoryName) {
    case 'functional':
      if (results.functionalRouting && results.functionalRouting.failed > 0) {
        issues.push(`${results.functionalRouting.failed} testes funcionais falharam`);
      }
      if (!results.highPriorityCases) {
        issues.push('Casos críticos de alto impacto falhando');
      }
      if (!results.personaExpertise) {
        issues.push('Expertise das personas inválida');
      }
      break;
      
    case 'performance':
      if (results.performance && !results.performance.passed) {
        if (results.performance.results.averageResponseTime > 100) {
          issues.push(`Tempo de resposta alto: ${results.performance.results.averageResponseTime}ms`);
        }
        if (results.performance.results.successRate < 95) {
          issues.push(`Taxa de sucesso baixa: ${results.performance.results.successRate}%`);
        }
      }
      if (results.memory && !results.memory.passed) {
        issues.push('Possível vazamento de memória detectado');
      }
      break;
      
    case 'errorHandling':
      if (results.backendFallback && !results.backendFallback.passed) {
        issues.push('Fallback para falhas de backend não funciona adequadamente');
      }
      if (results.edgeCases && !results.edgeCases.passed) {
        issues.push('Edge cases não tratados adequadamente');
      }
      break;
      
    case 'uiux':
      if (results.accessibility && !results.accessibility.passed) {
        issues.push('Violações de acessibilidade (WCAG 2.1)');
      }
      if (results.responsiveness && !results.responsiveness.passed) {
        issues.push('Problemas de responsividade mobile');
      }
      break;
      
    case 'integration':
      if (results.apiCommunication && !results.apiCommunication.passed) {
        issues.push('Comunicação com API backend com problemas');
      }
      if (results.endToEndIntegration && !results.endToEndIntegration.passed) {
        issues.push('Fluxo end-to-end não funciona adequadamente');
      }
      break;
      
    case 'analytics':
      if (results.usageMetrics && !results.usageMetrics.passed) {
        issues.push('Métricas de uso não funcionando adequadamente');
      }
      break;
  }
  
  return issues;
}

/**
 * Gera recomendações baseadas nos resultados
 */
function generateRecommendations(categoryName: string, results: any): string[] {
  const recommendations: string[] = [];
  
  switch (categoryName) {
    case 'functional':
      recommendations.push('Revisar e expandir keywords das personas');
      recommendations.push('Implementar testes automatizados para casos críticos');
      recommendations.push('Ajustar thresholds de confiança baseado em dados reais');
      break;
      
    case 'performance':
      recommendations.push('Implementar cache persistente para análises frequentes');
      recommendations.push('Otimizar algoritmo de análise local');
      recommendations.push('Adicionar métricas de performance em produção');
      break;
      
    case 'errorHandling':
      recommendations.push('Implementar retry com backoff exponencial');
      recommendations.push('Adicionar circuit breaker para API calls');
      recommendations.push('Melhorar mensagens de erro para usuários');
      break;
      
    case 'uiux':
      recommendations.push('Implementar testes automatizados de acessibilidade');
      recommendations.push('Adicionar animações suaves para melhor UX');
      recommendations.push('Otimizar para diferentes tamanhos de tela');
      break;
      
    case 'integration':
      recommendations.push('Implementar health checks para monitoramento');
      recommendations.push('Adicionar testes de integração automatizados');
      recommendations.push('Melhorar handling de timeouts de API');
      break;
      
    case 'analytics':
      recommendations.push('Implementar dashboard de métricas');
      recommendations.push('Adicionar A/B testing para melhorias');
      recommendations.push('Criar alertas para anomalias no comportamento');
      break;
  }
  
  return recommendations;
}

/**
 * Executa validação completa do sistema
 */
export async function runMasterValidation(): Promise<ValidationSummary> {
  console.log('🚀 INICIANDO VALIDAÇÃO MASTER DO SISTEMA DE ROTEAMENTO INTELIGENTE');
  console.log('🏗️ FASE 3.2.1 - Validation & Quality Assurance');
  console.log('🕒 ' + new Date().toLocaleString());
  console.log('='.repeat(80));
  
  const startTime = performance.now();
  
  try {
    // Executar todas as categorias de validação
    console.log('\n📋 EXECUTANDO CATEGORIAS DE VALIDAÇÃO...\n');
    
    const [
      functionalResults,
      performanceResults,
      errorHandlingResults,
      uiuxResults,
      integrationResults,
      analyticsResults
    ] = await Promise.all([
      runCompleteValidation().catch(error => ({ error: error.message })),
      runPerformanceValidation().catch(error => ({ error: error.message })),
      runErrorHandlingValidation().catch(error => ({ error: error.message })),
      runUIUXValidation().catch(error => ({ error: error.message })),
      runIntegrationValidation().catch(error => ({ error: error.message })),
      runAnalyticsValidation().catch(error => ({ error: error.message }))
    ]);
    
    // Processar resultados de cada categoria
    const categoryResults = {
      functional: {
        passed: !functionalResults.error && functionalResults.functionalRouting?.passed && functionalResults.highPriorityCases,
        score: calculateScore(functionalResults),
        criticalIssues: extractCriticalIssues('functional', functionalResults),
        recommendations: generateRecommendations('functional', functionalResults),
        details: functionalResults
      },
      performance: {
        passed: !performanceResults.error && performanceResults.performance?.passed && performanceResults.cache?.passed,
        score: calculateScore(performanceResults),
        criticalIssues: extractCriticalIssues('performance', performanceResults),
        recommendations: generateRecommendations('performance', performanceResults),
        details: performanceResults
      },
      errorHandling: {
        passed: !errorHandlingResults.error && errorHandlingResults.backendFallback?.passed,
        score: calculateScore(errorHandlingResults),
        criticalIssues: extractCriticalIssues('errorHandling', errorHandlingResults),
        recommendations: generateRecommendations('errorHandling', errorHandlingResults),
        details: errorHandlingResults
      },
      uiux: {
        passed: !uiuxResults.error && uiuxResults.accessibility?.passed && uiuxResults.responsiveness?.passed,
        score: calculateScore(uiuxResults),
        criticalIssues: extractCriticalIssues('uiux', uiuxResults),
        recommendations: generateRecommendations('uiux', uiuxResults),
        details: uiuxResults
      },
      integration: {
        passed: !integrationResults.error && integrationResults.apiCommunication?.passed && integrationResults.endToEndIntegration?.passed,
        score: calculateScore(integrationResults),
        criticalIssues: extractCriticalIssues('integration', integrationResults),
        recommendations: generateRecommendations('integration', integrationResults),
        details: integrationResults
      },
      analytics: {
        passed: !analyticsResults.error && analyticsResults.usageMetrics?.passed,
        score: calculateScore(analyticsResults),
        criticalIssues: extractCriticalIssues('analytics', analyticsResults),
        recommendations: generateRecommendations('analytics', analyticsResults),
        details: analyticsResults
      }
    };
    
    // Calcular score geral
    const scores = Object.values(categoryResults).map(cat => cat.score);
    const overallScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
    
    // Determinar se passou geral
    const criticalCategories = ['functional', 'performance', 'errorHandling', 'integration'];
    const criticalPassed = criticalCategories.every(cat => categoryResults[cat as keyof typeof categoryResults].passed);
    const overallPassed = criticalPassed && overallScore >= 75;
    
    // Coletar issues críticos
    const allCriticalIssues = Object.values(categoryResults)
      .flatMap(cat => cat.criticalIssues)
      .filter(issue => issue.length > 0);
    
    // Coletar recomendações
    const allRecommendations = Object.values(categoryResults)
      .flatMap(cat => cat.recommendations)
      .filter(rec => rec.length > 0);
    
    // Determinar prontidão para deploy
    const blockers = allCriticalIssues.filter(issue => 
      issue.includes('crítico') || 
      issue.includes('falhando') || 
      issue.includes('não funciona')
    );
    
    const improvements = allRecommendations.slice(0, 5); // Top 5 melhorias
    
    const deploymentReadiness = {
      ready: overallPassed && blockers.length === 0,
      blockers,
      improvements
    };
    
    const endTime = performance.now();
    
    // Gerar relatório final
    console.log('\n' + '='.repeat(80));
    console.log('📊 RELATÓRIO FINAL DE VALIDAÇÃO');
    console.log('='.repeat(80));
    
    console.log(`\n🎯 SCORE GERAL: ${overallScore}/100`);
    console.log(`🏆 STATUS: ${overallPassed ? '✅ APROVADO' : '❌ REQUER CORREÇÕES'}`);
    console.log(`⏱️ TEMPO TOTAL: ${((endTime - startTime) / 1000).toFixed(2)}s`);
    
    console.log('\n📋 RESULTADOS POR CATEGORIA:');
    Object.entries(categoryResults).forEach(([category, result]) => {
      const emoji = result.passed ? '✅' : '❌';
      const status = result.passed ? 'PASSOU' : 'FALHOU';
      console.log(`   ${emoji} ${category.toUpperCase()}: ${result.score}/100 - ${status}`);
    });
    
    if (allCriticalIssues.length > 0) {
      console.log('\n🚨 ISSUES CRÍTICOS:');
      allCriticalIssues.forEach(issue => {
        console.log(`   • ${issue}`);
      });
    }
    
    console.log('\n💡 TOP RECOMENDAÇÕES:');
    improvements.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec}`);
    });
    
    console.log('\n🚀 PRONTIDÃO PARA DEPLOY:');
    console.log(`   Status: ${deploymentReadiness.ready ? '✅ PRONTO' : '⚠️ BLOQUEADO'}`);
    
    if (blockers.length > 0) {
      console.log('   Blockers:');
      blockers.forEach(blocker => {
        console.log(`     • ${blocker}`);
      });
    }
    
    if (deploymentReadiness.ready) {
      console.log('\n🎉 SISTEMA APROVADO PARA PRODUÇÃO!');
      console.log('   ✅ Todos os critérios críticos foram atendidos');
      console.log('   ✅ Performance adequada para uso em produção');
      console.log('   ✅ Error handling robusto implementado');
      console.log('   ✅ Integração end-to-end funcionando');
    } else {
      console.log('\n⚠️ SISTEMA REQUER CORREÇÕES ANTES DO DEPLOY');
      console.log('   Resolva os blockers listados acima');
      console.log('   Execute nova validação após correções');
    }
    
    console.log('\n' + '='.repeat(80));
    
    return {
      overallScore,
      overallPassed,
      categoryResults,
      criticalIssues: allCriticalIssues,
      recommendations: allRecommendations,
      deploymentReadiness
    };
    
  } catch (error) {
    console.error('💥 ERRO CRÍTICO na validação master:', error);
    
    return {
      overallScore: 0,
      overallPassed: false,
      categoryResults: {
        functional: { passed: false, score: 0, criticalIssues: ['Erro na execução'], recommendations: [], details: null },
        performance: { passed: false, score: 0, criticalIssues: ['Erro na execução'], recommendations: [], details: null },
        errorHandling: { passed: false, score: 0, criticalIssues: ['Erro na execução'], recommendations: [], details: null },
        uiux: { passed: false, score: 0, criticalIssues: ['Erro na execução'], recommendations: [], details: null },
        integration: { passed: false, score: 0, criticalIssues: ['Erro na execução'], recommendations: [], details: null },
        analytics: { passed: false, score: 0, criticalIssues: ['Erro na execução'], recommendations: [], details: null }
      },
      criticalIssues: [`Erro crítico na validação: ${error.message}`],
      recommendations: ['Verificar configuração do ambiente de teste', 'Revisar implementação dos componentes'],
      deploymentReadiness: {
        ready: false,
        blockers: ['Validação não executou com sucesso'],
        improvements: []
      }
    };
  }
}

/**
 * Executa validação rápida para CI/CD
 */
export async function runQuickValidation(): Promise<{ passed: boolean; issues: string[] }> {
  console.log('⚡ VALIDAÇÃO RÁPIDA PARA CI/CD');
  console.log('='.repeat(30));
  
  try {
    // Testes críticos mínimos
    const functionalResults = await runCompleteValidation();
    const performanceResults = await runPerformanceValidation();
    
    const criticalPassed = functionalResults.highPriorityCases && 
                          performanceResults.performance?.passed;
    
    const issues: string[] = [];
    
    if (!functionalResults.highPriorityCases) {
      issues.push('Casos críticos funcionais falhando');
    }
    
    if (!performanceResults.performance?.passed) {
      issues.push('Performance inadequada');
    }
    
    console.log(`Resultado: ${criticalPassed ? '✅ PASSOU' : '❌ FALHOU'}`);
    
    return { passed: criticalPassed, issues };
    
  } catch (error) {
    console.error('Erro na validação rápida:', error);
    return { 
      passed: false, 
      issues: [`Erro na execução: ${error.message}`] 
    };
  }
}

// Exports para uso em outros contextos
export { ValidationResult, ValidationSummary };