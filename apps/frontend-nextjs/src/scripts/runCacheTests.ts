/**
 * Script para executar testes de performance do cache
 * Pode ser executado via npm run test:cache ou diretamente
 */

import { runCachePerformanceTest } from '../tests/cachePerformanceTest';

// Interface para resultado de performance
interface PerformanceResult {
  operation: string;
  duration: number;
  success: boolean;
}

// Interface para relatório
interface PerformanceReport {
  content: string;
  summary: {
    overallScore: number;
    totalTests: number;
    passedTests: number;
    averageDuration: number;
  };
}

function generatePerformanceReport(metrics: PerformanceResult[]): PerformanceReport {
  const totalTests = metrics.length;
  const passedTests = metrics.filter(m => m.success).length;
  const averageDuration = metrics.reduce((sum, m) => sum + m.duration, 0) / totalTests;
  const overallScore = Math.round((passedTests / totalTests) * 100);

  const content = `# Cache Performance Report

## Summary
- Total Tests: ${totalTests}
- Passed Tests: ${passedTests}
- Success Rate: ${overallScore}%
- Average Duration: ${averageDuration.toFixed(2)}ms

## Individual Results
${metrics.map(m => `- ${m.operation}: ${m.duration.toFixed(2)}ms (${m.success ? 'PASS' : 'FAIL'})`).join('\n')}
`;

  return {
    content,
    summary: {
      overallScore,
      totalTests,
      passedTests,
      averageDuration
    }
  };
}

async function runCachePerformanceTests() {
  console.log('🎯 Executando testes de performance do cache híbrido...\n');

  try {
    // Executar testes completos
    const metrics = await runCachePerformanceTest();

    // Gerar relatório simplificado
    console.log('Resultados dos testes:');
    metrics.forEach(result => {
      console.log(`- ${result.operation}: ${result.duration.toFixed(2)}ms (${result.success ? 'OK' : 'ERRO'})`);
    });

    // Gerar relatório de performance
    const Report = generatePerformanceReport(metrics);

    console.log('\n' + '='.repeat(80));
    console.log('📋 RELATÓRIO DE PERFORMANCE');
    console.log('='.repeat(80));
    console.log(Report.content);
    
    // Salvar relatório em arquivo (se em ambiente Node.js)
    if (typeof process !== 'undefined') {
      const fs = require('fs');
      const path = require('path');
      
      const reportPath = path.join(process.cwd(), 'cache-performance-report.md');
      fs.writeFileSync(reportPath, Report.content);
      console.log(`\n💾 Relatório salvo em: ${reportPath}`);
    }
    
    // Determinar se os testes passaram
    if (Report.summary.overallScore >= 70) {
      console.log('\n✅ TESTES DE PERFORMANCE: APROVADOS');
      console.log(`Score final: ${Report.summary.overallScore}/100`);
      process.exit(0);
    } else {
      console.log('\n❌ TESTES DE PERFORMANCE: REPROVADOS');
      console.log(`Score final: ${Report.summary.overallScore}/100 (mínimo: 70)`);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('💥 Erro crítico durante testes de performance:', error);
    process.exit(1);
  }
}

// Auto-executar se for chamado diretamente
if (typeof process !== 'undefined' && require.main === module) {
  runCachePerformanceTests();
}

export default runCachePerformanceTests;