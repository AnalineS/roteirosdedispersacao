#!/usr/bin/env tsx
/**
 * Script de Integração Automática - Error Handlers
 * 
 * Conecta os 102 arquivos restantes ao sistema de tratamento de erros
 * de forma automatizada, preservando variáveis de features futuras.
 * 
 * USO: npm run integrate-errors
 * 
 * @version 1.0.0
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { glob } from 'glob';
import { join } from 'path';

interface ErrorHandlerPattern {
  pattern: RegExp;
  severity: 'low' | 'medium' | 'high' | 'critical';
  component: string;
  action: string;
}

interface FileAnalysis {
  filePath: string;
  hasActiveHandlers: boolean;
  hasPlaceholderVars: boolean;
  errorHandlers: ErrorHandlerPattern[];
  needsIntegration: boolean;
}

const CRITICAL_FILES_MANUAL = [
  'services/api.ts',
  'services/auth.ts', 
  'hooks/useChat.ts',
  'components/interactive/DoseCalculator/AdvancedCalculator.tsx'
  // Já foram feitos manualmente
];

const PLACEHOLDER_PATTERNS = [
  /_err\b/,
  /_error\b/,
  /_authLoading\b/,
  /_profile\b/,
  /_personaLoading\b/,
  /_chatError\b/
];

const ERROR_HANDLER_PATTERNS: ErrorHandlerPattern[] = [
  {
    pattern: /catch\s*\(\s*([^_]\w*)\s*\)\s*\{[^}]*console\.error/,
    severity: 'medium',
    component: 'Unknown',
    action: 'error_handling'
  },
  {
    pattern: /catch\s*\(\s*([^_]\w*)\s*\)\s*\{[^}]*medical|dose|treatment/i,
    severity: 'critical',
    component: 'MedicalComponent',
    action: 'medical_operation'
  },
  {
    pattern: /catch\s*\(\s*([^_]\w*)\s*\{[^}]*auth|login|sign/i,
    severity: 'high',
    component: 'AuthComponent',
    action: 'authentication'
  },
  {
    pattern: /catch\s*\(\s*([^_]\w*)\s*\{[^}]*api|fetch|request/i,
    severity: 'medium',
    component: 'APIComponent',
    action: 'api_request'
  }
];

/**
 * Analisa um arquivo para determinar se precisa de integração
 */
function analyzeFile(filePath: string): FileAnalysis {
  if (!existsSync(filePath)) {
    return {
      filePath,
      hasActiveHandlers: false,
      hasPlaceholderVars: false,
      errorHandlers: [],
      needsIntegration: false
    };
  }

  const content = readFileSync(filePath, 'utf-8');
  
  // Verificar se tem variáveis placeholder (features futuras)
  const hasPlaceholderVars = PLACEHOLDER_PATTERNS.some(pattern => pattern.test(content));
  
  // Verificar handlers ativos vs placeholders
  const activeHandlers: ErrorHandlerPattern[] = [];
  
  ERROR_HANDLER_PATTERNS.forEach(pattern => {
    const matches = content.match(pattern.pattern);
    if (matches) {
      activeHandlers.push({
        ...pattern,
        component: extractComponentName(filePath)
      });
    }
  });

  // Verificar se já tem useErrorHandler importado
  const hasErrorHandlerImport = content.includes('useErrorHandler');
  
  return {
    filePath,
    hasActiveHandlers: activeHandlers.length > 0,
    hasPlaceholderVars,
    errorHandlers: activeHandlers,
    needsIntegration: activeHandlers.length > 0 && !hasErrorHandlerImport
  };
}

/**
 * Extrai nome do componente do caminho do arquivo
 */
function extractComponentName(filePath: string): string {
  const parts = filePath.split(/[\/\\]/);
  const fileName = parts[parts.length - 1];
  
  if (fileName.includes('Component') || fileName.includes('.tsx')) {
    return fileName.replace(/\.(tsx?|jsx?)$/, '');
  }
  
  if (filePath.includes('services/')) return 'Service';
  if (filePath.includes('hooks/')) return 'Hook';
  if (filePath.includes('utils/')) return 'Utility';
  
  return 'Component';
}

/**
 * Integra error handlers em um arquivo
 */
function integrateErrorHandlers(filePath: string, analysis: FileAnalysis): boolean {
  if (!analysis.needsIntegration) {
    return false;
  }

  let content = readFileSync(filePath, 'utf-8');
  let modified = false;

  // 1. Adicionar import do useErrorHandler (se necessário)
  if (!content.includes('useErrorHandler')) {
    const importRegex = /(import.*from ['"]react['"];?\n)/;
    const match = content.match(importRegex);
    
    if (match) {
      content = content.replace(
        importRegex,
        `$1import { useErrorHandler } from '@/hooks/useErrorHandler';\n`
      );
      modified = true;
    }
  }

  // 2. Adicionar hook no componente (se for React component)
  if (filePath.includes('.tsx') && !content.includes('const { captureError } = useErrorHandler()')) {
    const functionMatch = content.match(/(export\s+(?:default\s+)?function\s+\w+[^{]*\{)/);
    const arrowMatch = content.match(/(const\s+\w+[^=]*=\s*[^{]*\{)/);
    
    if (functionMatch) {
      content = content.replace(
        functionMatch[0],
        `${functionMatch[0]}\n  const { captureError } = useErrorHandler();`
      );
      modified = true;
    } else if (arrowMatch) {
      content = content.replace(
        arrowMatch[0],
        `${arrowMatch[0]}\n  const { captureError } = useErrorHandler();`
      );
      modified = true;
    }
  }

  // 3. Substituir catch blocks ativos (preservando placeholders)
  analysis.errorHandlers.forEach(handler => {
    // Só substituir catches que NÃO são placeholders
    const catchPattern = /catch\s*\(\s*([^_]\w*)\s*\)\s*\{([^}]*)\}/g;
    
    content = content.replace(catchPattern, (match, errorVar, body) => {
      // Se o body já tem captureError, não substituir
      if (body.includes('captureError')) {
        return match;
      }
      
      // Substituir por versão integrada
      return `catch (${errorVar}) {
        captureError(${errorVar}, {
          severity: '${handler.severity}',
          component: '${handler.component}',
          action: '${handler.action}',
          metadata: { originalHandler: true }
        });${body}
      }`;
    });
    
    modified = true;
  });

  // 4. Salvar arquivo se modificado
  if (modified) {
    writeFileSync(filePath, content, 'utf-8');
    return true;
  }

  return false;
}

/**
 * Script principal
 */
async function main() {
  console.log('🚀 Iniciando integração automática de error handlers...\n');

  // 1. Encontrar todos os arquivos TS/TSX
  const patterns = [
    'apps/frontend-nextjs/src/**/*.ts',
    'apps/frontend-nextjs/src/**/*.tsx'
  ];

  const allFiles: string[] = [];
  for (const pattern of patterns) {
    const files = await glob(pattern, { 
      ignore: [
        '**/node_modules/**',
        '**/dist/**',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/scripts/**'
      ]
    });
    allFiles.push(...files);
  }

  console.log(`📁 Encontrados ${allFiles.length} arquivos para análise`);

  // 2. Filtrar arquivos já processados manualmente
  const filesToProcess = allFiles.filter(file => {
    return !CRITICAL_FILES_MANUAL.some(critical => 
      file.includes(critical.replace(/\//g, '\\'))
    );
  });

  console.log(`🔍 ${filesToProcess.length} arquivos para processamento automático\n`);

  // 3. Analisar arquivos
  const analyses: FileAnalysis[] = [];
  let needIntegration = 0;
  let hasPlaceholders = 0;

  for (const filePath of filesToProcess) {
    const analysis = analyzeFile(filePath);
    analyses.push(analysis);
    
    if (analysis.needsIntegration) needIntegration++;
    if (analysis.hasPlaceholderVars) hasPlaceholders++;
  }

  console.log(`📊 Análise completa:`);
  console.log(`   • ${needIntegration} arquivos precisam de integração`);
  console.log(`   • ${hasPlaceholders} arquivos têm variáveis de features futuras`);
  console.log(`   • ${analyses.length - needIntegration} arquivos já integrados ou sem handlers\n`);

  // 4. Processar integrações
  let integrated = 0;
  let errors = 0;

  for (const analysis of analyses) {
    if (analysis.needsIntegration) {
      try {
        const success = integrateErrorHandlers(analysis.filePath, analysis);
        if (success) {
          integrated++;
          console.log(`✅ ${analysis.filePath} - ${analysis.errorHandlers.length} handlers integrados`);
        }
      } catch (error) {
        errors++;
        console.error(`❌ ${analysis.filePath} - Erro: ${error}`);
      }
    }
  }

  // 5. Relatório final
  console.log(`\n🎯 Integração concluída:`);
  console.log(`   • ${integrated} arquivos integrados com sucesso`);
  console.log(`   • ${errors} erros durante integração`);
  console.log(`   • ${hasPlaceholders} arquivos com placeholders preservados`);
  
  // 6. Gerar relatório para PR
  const reportData = {
    timestamp: new Date().toISOString(),
    totalFiles: allFiles.length,
    processedFiles: filesToProcess.length,
    integratedFiles: integrated,
    errorsCount: errors,
    placeholderFiles: hasPlaceholders,
    criticalFilesManual: CRITICAL_FILES_MANUAL.length,
    strategy: 'Option D - Hybrid Integration'
  };

  writeFileSync(
    join(process.cwd(), 'integration-report.json'),
    JSON.stringify(reportData, null, 2)
  );

  console.log(`\n📄 Relatório salvo em: integration-report.json`);
  console.log(`\n🚀 Próximos passos:`);
  console.log(`   1. Executar testes: npm run test`);
  console.log(`   2. Verificar build: npm run build`);
  console.log(`   3. Validar performance: npm run perf-test`);
  console.log(`   4. Criar PR para reavaliação futura`);
}

// Executar script
if (require.main === module) {
  main().catch(console.error);
}

export { analyzeFile, integrateErrorHandlers, main };