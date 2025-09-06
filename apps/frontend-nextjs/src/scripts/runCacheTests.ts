/**
 * Script para executar testes de performance do cache
 * Pode ser executado via npm run test:cache ou diretamente
 */

import CachePerformanceTest from '../tests/cachePerformanceTest';

async function runCachePerformanceTests() {
  console.log('🎯 Executando testes de performance do cache híbrido...\n');

  try {
    const tester = new CachePerformanceTest();
    
    // Executar testes completos
    const metrics = await tester.runCompletePerformanceTest();
    
    // Gerar relatório
    const report = tester.generateDetailedReport(metrics);
    
    console.log('\n' + '='.repeat(80));
    console.log('📋 RELATÓRIO DE PERFORMANCE');
    console.log('='.repeat(80));
    console.log(report);
    
    // Salvar relatório em arquivo (se em ambiente Node.js)
    if (typeof process !== 'undefined') {
      const fs = require('fs');
      const path = require('path');
      
      const reportPath = path.join(process.cwd(), 'cache-performance-report.md');
      fs.writeFileSync(reportPath, report);
      console.log(`\n💾 Relatório salvo em: ${reportPath}`);
    }
    
    // Determinar se os testes passaram
    if (metrics.summary.overallScore >= 70) {
      console.log('\n✅ TESTES DE PERFORMANCE: APROVADOS');
      console.log(`Score final: ${metrics.summary.overallScore}/100`);
      process.exit(0);
    } else {
      console.log('\n❌ TESTES DE PERFORMANCE: REPROVADOS');
      console.log(`Score final: ${metrics.summary.overallScore}/100 (mínimo: 70)`);
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