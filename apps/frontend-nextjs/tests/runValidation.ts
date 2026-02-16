#!/usr/bin/env node

/**
 * Script para execução das validações do Sistema de Roteamento Inteligente
 * 
 * Uso:
 * npm run validate          - Validação completa
 * npm run validate:quick    - Validação rápida para CI/CD
 * npm run validate:category - Validação por categoria
 */

import { runMasterValidation, runQuickValidation } from './masterValidation';
import { runCompleteValidation } from './intelligentRouting.validation';
import { runPerformanceValidation } from './performance.validation';
import { runErrorHandlingValidation } from './errorHandling.validation';
import { runUIUXValidation } from './uiux.validation';
import { runIntegrationValidation } from './integration.validation';
import { runAnalyticsValidation } from './analytics.validation';

// Configurações de execução
const CONFIG = {
  colors: {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
  },
  timeouts: {
    quick: 30000,     // 30s
    normal: 120000,   // 2min
    complete: 300000  // 5min
  }
};

/**
 * Colore texto no console
 */
function colorize(text: string, color: keyof typeof CONFIG.colors): string {
  return `${CONFIG.colors[color]}${text}${CONFIG.colors.reset}`;
}

/**
 * Mostra menu de opções
 */
function showMenu(): void {
  console.log(colorize('\n🔍 VALIDAÇÃO DO SISTEMA DE ROTEAMENTO INTELIGENTE', 'cyan'));
  console.log(colorize('=' .repeat(55), 'blue'));
  console.log('\nOpções disponíveis:');
  console.log('  1. ' + colorize('complete', 'green') + '     - Validação completa (todos os módulos)');
  console.log('  2. ' + colorize('quick', 'yellow') + '        - Validação rápida (CI/CD)');
  console.log('  3. ' + colorize('functional', 'white') + '   - Validação funcional');
  console.log('  4. ' + colorize('performance', 'white') + '  - Validação de performance');
  console.log('  5. ' + colorize('errors', 'white') + '       - Validação de error handling');
  console.log('  6. ' + colorize('uiux', 'white') + '         - Validação de UI/UX');
  console.log('  7. ' + colorize('integration', 'white') + '  - Validação de integração');
  console.log('  8. ' + colorize('analytics', 'white') + '    - Validação de analytics');
  console.log('  9. ' + colorize('help', 'magenta') + '        - Mostrar este menu');
  console.log('  0. ' + colorize('exit', 'red') + '        - Sair');
  console.log('\n' + colorize('=' .repeat(55), 'blue'));
}

/**
 * Executa validação com timeout
 */
async function runWithTimeout<T>(
  fn: () => Promise<T>, 
  timeoutMs: number, 
  name: string
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Timeout: ${name} não completou em ${timeoutMs}ms`));
    }, timeoutMs);

    fn()
      .then(result => {
        clearTimeout(timeout);
        resolve(result);
      })
      .catch(error => {
        clearTimeout(timeout);
        reject(error);
      });
  });
}

/**
 * Executa validação completa
 */
async function executeCompleteValidation(): Promise<void> {
  console.log(colorize('\n🚀 INICIANDO VALIDAÇÃO COMPLETA...', 'green'));
  
  const startTime = Date.now();
  
  try {
    const results = await runWithTimeout(
      runMasterValidation,
      CONFIG.timeouts.complete,
      'Validação Completa'
    );
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log(colorize(`\n✅ VALIDAÇÃO COMPLETA FINALIZADA EM ${duration}s`, 'green'));
    
    // Salvar relatório se possível
    if (typeof window === 'undefined') {
      const fs = require('fs');
      const path = require('path');

      const baseDir = path.resolve(process.cwd());
      const reportPath = path.resolve(baseDir, 'validation-report.json');

      // Prevent path traversal: ensure reportPath stays within baseDir
      if (!reportPath.startsWith(baseDir + path.sep) && reportPath !== baseDir) {
        console.error(colorize('❌ Path traversal detected, aborting report write.', 'red'));
      } else {
        fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
        console.log(colorize(`📄 Relatório salvo em: ${reportPath}`, 'blue'));
      }
    }
    
    process.exit(results.overallPassed ? 0 : 1);
    
  } catch (error) {
    console.error(colorize(`❌ ERRO na validação completa: ${error.message}`, 'red'));
    process.exit(1);
  }
}

/**
 * Executa validação rápida
 */
async function executeQuickValidation(): Promise<void> {
  console.log(colorize('\n⚡ INICIANDO VALIDAÇÃO RÁPIDA...', 'yellow'));
  
  try {
    const results = await runWithTimeout(
      runQuickValidation,
      CONFIG.timeouts.quick,
      'Validação Rápida'
    );
    
    if (results.passed) {
      console.log(colorize('\n✅ VALIDAÇÃO RÁPIDA PASSOU - Sistema pronto para deploy', 'green'));
      process.exit(0);
    } else {
      console.log(colorize('\n❌ VALIDAÇÃO RÁPIDA FALHOU:', 'red'));
      results.issues.forEach(issue => {
        console.log(colorize(`   • ${issue}`, 'red'));
      });
      process.exit(1);
    }
    
  } catch (error) {
    console.error(colorize(`❌ ERRO na validação rápida: ${error.message}`, 'red'));
    process.exit(1);
  }
}

/**
 * Executa validação por categoria
 */
async function executeCategoryValidation(category: string): Promise<void> {
  console.log(colorize(`\n🔍 INICIANDO VALIDAÇÃO: ${category.toUpperCase()}`, 'cyan'));
  
  const validationMap: Record<string, () => Promise<any>> = {
    functional: runCompleteValidation,
    performance: runPerformanceValidation,
    errors: runErrorHandlingValidation,
    uiux: runUIUXValidation,
    integration: runIntegrationValidation,
    analytics: runAnalyticsValidation
  };
  
  const validationFn = validationMap[category];
  
  if (!validationFn) {
    console.error(colorize(`❌ Categoria inválida: ${category}`, 'red'));
    return;
  }
  
  try {
    const results = await runWithTimeout(
      validationFn,
      CONFIG.timeouts.normal,
      `Validação ${category}`
    );
    
    console.log(colorize(`\n✅ VALIDAÇÃO ${category.toUpperCase()} CONCLUÍDA`, 'green'));
    
    // Mostrar resumo básico
    if (results && typeof results === 'object') {
      const passed = Object.values(results).some((result: any) => 
        result && result.passed === true
      );
      
      console.log(colorize(`Status: ${passed ? 'PASSOU' : 'FALHOU'}`, passed ? 'green' : 'red'));
    }
    
  } catch (error) {
    console.error(colorize(`❌ ERRO na validação ${category}: ${error.message}`, 'red'));
  }
}

/**
 * Processa argumentos da linha de comando
 */
async function processArguments(): Promise<void> {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    showMenu();
    return;
  }
  
  const command = args[0].toLowerCase();
  
  switch (command) {
    case 'complete':
    case 'full':
    case '1':
      await executeCompleteValidation();
      break;
      
    case 'quick':
    case 'fast':
    case '2':
      await executeQuickValidation();
      break;
      
    case 'functional':
    case '3':
      await executeCategoryValidation('functional');
      break;
      
    case 'performance':
    case 'perf':
    case '4':
      await executeCategoryValidation('performance');
      break;
      
    case 'errors':
    case 'error':
    case 'errorhandling':
    case '5':
      await executeCategoryValidation('errors');
      break;
      
    case 'uiux':
    case 'ui':
    case 'ux':
    case '6':
      await executeCategoryValidation('uiux');
      break;
      
    case 'integration':
    case 'int':
    case '7':
      await executeCategoryValidation('integration');
      break;
      
    case 'analytics':
    case 'tracking':
    case '8':
      await executeCategoryValidation('analytics');
      break;
      
    case 'help':
    case 'h':
    case '--help':
    case '9':
      showMenu();
      break;
      
    case 'exit':
    case 'quit':
    case 'q':
    case '0':
      console.log(colorize('👋 Saindo...', 'yellow'));
      process.exit(0);
      break;
      
    default:
      console.error(colorize(`❌ Comando inválido: ${command}`, 'red'));
      showMenu();
      break;
  }
}

/**
 * Modo interativo
 */
async function interactiveMode(): Promise<void> {
  const readline = require('readline');
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  showMenu();
  
  const askForInput = (): void => {
    rl.question(colorize('\nEscolha uma opção: ', 'cyan'), async (answer: string) => {
      if (answer === '0' || answer.toLowerCase() === 'exit') {
        console.log(colorize('👋 Saindo...', 'yellow'));
        rl.close();
        return;
      }
      
      // Simula argumentos
      process.argv = ['node', 'runValidation.ts', answer];
      
      try {
        await processArguments();
      } catch (error) {
        console.error(colorize(`Erro: ${error.message}`, 'red'));
      }
      
      askForInput();
    });
  };
  
  askForInput();
}

/**
 * Função principal
 */
async function main(): Promise<void> {
  console.log(colorize('🤖 Sistema de Validação QA - Roteamento Inteligente', 'magenta'));
  console.log(colorize('FASE 3.2.1 - Quality Assurance & Validation', 'blue'));
  console.log('Desenvolvido por: Elite QA Engineer & AI Validation Specialist\n');
  
  // Verificar se há argumentos
  if (process.argv.length > 2) {
    await processArguments();
  } else {
    await interactiveMode();
  }
}

// Tratamento de erros globais
process.on('unhandledRejection', (reason, promise) => {
  console.error(colorize('❌ Unhandled Rejection:', 'red'), reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error(colorize('❌ Uncaught Exception:', 'red'), error);
  process.exit(1);
});

// Executar apenas se chamado diretamente
if (require.main === module) {
  main().catch(error => {
    console.error(colorize(`❌ Erro fatal: ${error.message}`, 'red'));
    process.exit(1);
  });
}

export { main, processArguments, executeCompleteValidation, executeQuickValidation };