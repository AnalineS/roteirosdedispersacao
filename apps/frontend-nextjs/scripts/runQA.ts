#!/usr/bin/env ts-node

/**
 * Script de execução de QA
 * Executa validações de qualidade e testes
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface QAOptions {
  suite?: 'full' | 'basic';
  types?: string[];
  validateDeploy?: boolean;
}

function parseArgs(): QAOptions {
  const args = process.argv.slice(2);
  const options: QAOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--suite=full') {
      options.suite = 'full';
    } else if (arg === '--suite=basic') {
      options.suite = 'basic';
    } else if (arg.startsWith('--types=')) {
      options.types = arg.split('=')[1].split(',');
    } else if (arg === '--validate-deploy') {
      options.validateDeploy = true;
    }
  }

  return options;
}

function runCommand(command: string): void {
  console.log(`🔄 Executando: ${command}`);
  try {
    execSync(command, { stdio: 'inherit' });
    console.log(`✅ Sucesso: ${command}\n`);
  } catch (error) {
    console.error(`❌ Erro: ${command}`);
    throw error;
  }
}

function runQA(options: QAOptions): void {
  console.log('🚀 Iniciando QA - Sistema Educacional Hanseníase\n');
  console.log('Opções:', options, '\n');

  const commands: string[] = [];

  // Validações básicas
  commands.push('npm run lint');
  commands.push('npm run type-check');

  if (options.suite === 'full') {
    // Suite completa
    commands.push('npm run test:coverage');
    commands.push('npm run audit:security');
    commands.push('npm run format:check');
  } else {
    // Suite básica
    commands.push('npm run test');
  }

  // Validações específicas por tipo
  if (options.types?.includes('clinical_accuracy')) {
    commands.push('npm run test:clinical-cases');
  }
  
  if (options.types?.includes('educational_value')) {
    commands.push('npm run test:educational');
  }

  // Validação de deploy
  if (options.validateDeploy) {
    commands.push('npm run build');
    commands.push('node scripts/validatePWA.js');
  }

  // Executar comandos
  let successCount = 0;
  const totalCommands = commands.length;

  for (const command of commands) {
    try {
      runCommand(command);
      successCount++;
    } catch (error) {
      console.error(`\n❌ Falha em: ${command}`);
      break;
    }
  }

  // Relatório final
  console.log('='.repeat(50));
  console.log('📊 RELATÓRIO QA');
  console.log('='.repeat(50));
  console.log(`Sucesso: ${successCount}/${totalCommands} comandos`);
  console.log(`Taxa: ${Math.round((successCount / totalCommands) * 100)}%`);
  
  if (successCount === totalCommands) {
    console.log('🎉 TODOS OS TESTES PASSARAM!');
    process.exit(0);
  } else {
    console.log('⚠️ ALGUNS TESTES FALHARAM');
    process.exit(1);
  }
}

if (require.main === module) {
  const options = parseArgs();
  runQA(options);
}

export { runQA };