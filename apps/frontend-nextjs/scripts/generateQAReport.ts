#!/usr/bin/env ts-node

/**
 * Script de geração de relatório QA
 * Gera relatórios detalhados de qualidade
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface QAMetrics {
  timestamp: string;
  build: {
    status: 'success' | 'failed';
    errors: string[];
    warnings: string[];
  };
  tests: {
    passed: number;
    failed: number;
    coverage: number;
  };
  lint: {
    errors: number;
    warnings: number;
  };
  security: {
    vulnerabilities: number;
    level: 'low' | 'moderate' | 'high' | 'critical';
  };
  pwa: {
    score: number;
    valid: boolean;
  };
}

function runCommandSafe(command: string): { success: boolean; output: string } {
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    return { success: true, output };
  } catch (error: any) {
    return { success: false, output: error.stdout || error.message || '' };
  }
}

function collectMetrics(): QAMetrics {
  console.log('📊 Coletando métricas QA...\n');

  const metrics: QAMetrics = {
    timestamp: new Date().toISOString(),
    build: { status: 'failed', errors: [], warnings: [] },
    tests: { passed: 0, failed: 0, coverage: 0 },
    lint: { errors: 0, warnings: 0 },
    security: { vulnerabilities: 0, level: 'low' },
    pwa: { score: 0, valid: false }
  };

  // Build check
  console.log('🔨 Verificando build...');
  const buildResult = runCommandSafe('npm run build');
  metrics.build.status = buildResult.success ? 'success' : 'failed';
  
  if (!buildResult.success) {
    metrics.build.errors.push(buildResult.output);
  }

  // Lint check
  console.log('🔍 Verificando lint...');
  const lintResult = runCommandSafe('npm run lint');
  // Parse lint output for errors/warnings (simplified)
  metrics.lint.errors = (lintResult.output.match(/error/gi) || []).length;
  metrics.lint.warnings = (lintResult.output.match(/warning/gi) || []).length;

  // Test check
  console.log('🧪 Verificando testes...');
  const testResult = runCommandSafe('npm run test:ci');
  if (testResult.success) {
    // Parse test results (simplified)
    const passedMatch = testResult.output.match(/(\d+) passed/);
    const failedMatch = testResult.output.match(/(\d+) failed/);
    
    metrics.tests.passed = passedMatch ? parseInt(passedMatch[1]) : 0;
    metrics.tests.failed = failedMatch ? parseInt(failedMatch[1]) : 0;
  }

  // Security audit
  console.log('🔒 Verificando segurança...');
  const securityResult = runCommandSafe('npm audit --json');
  if (securityResult.success) {
    try {
      const auditData = JSON.parse(securityResult.output);
      metrics.security.vulnerabilities = auditData.metadata?.vulnerabilities?.total || 0;
    } catch (e) {
      // Fallback parsing
      metrics.security.vulnerabilities = (securityResult.output.match(/vulnerabilities/gi) || []).length;
    }
  }

  // PWA validation
  console.log('📱 Verificando PWA...');
  const pwaResult = runCommandSafe('node scripts/validatePWA.js');
  if (pwaResult.success) {
    const scoreMatch = pwaResult.output.match(/SCORE PWA: (\d+)\/(\d+) \((\d+)%\)/);
    if (scoreMatch) {
      metrics.pwa.score = parseInt(scoreMatch[3]);
      metrics.pwa.valid = metrics.pwa.score === 100;
    }
  }

  return metrics;
}

function generateHTMLReport(metrics: QAMetrics): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório QA - Sistema Educacional Hanseníase</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; color: #2563eb; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; margin-bottom: 30px; }
        .metric { background: #f8fafc; padding: 15px; margin: 10px 0; border-radius: 6px; border-left: 4px solid #2563eb; }
        .success { border-left-color: #10b981; }
        .warning { border-left-color: #f59e0b; }
        .error { border-left-color: #ef4444; }
        .score { font-size: 2em; font-weight: bold; text-align: center; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .timestamp { color: #6b7280; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏥 Relatório QA - Sistema Educacional Hanseníase</h1>
            <div class="timestamp">Gerado em: ${new Date(metrics.timestamp).toLocaleString('pt-BR')}</div>
        </div>
        
        <div class="grid">
            <div class="metric ${metrics.build.status === 'success' ? 'success' : 'error'}">
                <h3>🔨 Build Status</h3>
                <div class="score">${metrics.build.status === 'success' ? '✅ SUCESSO' : '❌ FALHOU'}</div>
                ${metrics.build.errors.length > 0 ? '<div>Erros: ' + metrics.build.errors.length + '</div>' : ''}
            </div>
            
            <div class="metric ${metrics.tests.failed === 0 ? 'success' : 'warning'}">
                <h3>🧪 Testes</h3>
                <div>Passaram: ${metrics.tests.passed}</div>
                <div>Falharam: ${metrics.tests.failed}</div>
                <div>Cobertura: ${metrics.tests.coverage}%</div>
            </div>
            
            <div class="metric ${metrics.lint.errors === 0 ? 'success' : 'warning'}">
                <h3>🔍 Lint</h3>
                <div>Erros: ${metrics.lint.errors}</div>
                <div>Avisos: ${metrics.lint.warnings}</div>
            </div>
            
            <div class="metric ${metrics.security.vulnerabilities === 0 ? 'success' : 'warning'}">
                <h3>🔒 Segurança</h3>
                <div>Vulnerabilidades: ${metrics.security.vulnerabilities}</div>
                <div>Nível: ${metrics.security.level}</div>
            </div>
            
            <div class="metric ${metrics.pwa.valid ? 'success' : 'warning'}">
                <h3>📱 PWA</h3>
                <div class="score">${metrics.pwa.score}%</div>
                <div>${metrics.pwa.valid ? '✅ Válido' : '⚠️ Precisa ajustes'}</div>
            </div>
        </div>
        
        <div class="metric">
            <h3>📋 Resumo Executivo</h3>
            <p>Sistema analisado em ${new Date(metrics.timestamp).toLocaleString('pt-BR')}</p>
            <ul>
                <li>Build: ${metrics.build.status === 'success' ? 'Sucesso' : 'Falhou'}</li>
                <li>Testes: ${metrics.tests.passed} passaram, ${metrics.tests.failed} falharam</li>
                <li>Qualidade: ${metrics.lint.errors + metrics.lint.warnings === 0 ? 'Excelente' : 'Precisa atenção'}</li>
                <li>PWA: ${metrics.pwa.score}% completo</li>
                <li>Segurança: ${metrics.security.vulnerabilities === 0 ? 'Seguro' : metrics.security.vulnerabilities + ' vulnerabilidades'}</li>
            </ul>
        </div>
    </div>
</body>
</html>
  `.trim();
}

function generateReport(): void {
  console.log('📋 Gerando relatório QA...\n');

  // Coletar métricas
  const metrics = collectMetrics();

  // Gerar relatório HTML
  const htmlReport = generateHTMLReport(metrics);

  // Criar diretório qa-reports se não existir
  const reportsDir = path.join(process.cwd(), '..', '..', 'qa-reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  // Salvar relatório
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = path.join(reportsDir, `qa-report-${timestamp}.html`);
  
  fs.writeFileSync(reportPath, htmlReport);

  // Salvar também métricas JSON
  const jsonPath = path.join(reportsDir, `qa-metrics-${timestamp}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(metrics, null, 2));

  console.log('\n='.repeat(50));
  console.log('📊 RELATÓRIO QA GERADO');
  console.log('='.repeat(50));
  console.log(`HTML: ${reportPath}`);
  console.log(`JSON: ${jsonPath}`);
  console.log('='.repeat(50));
}

if (require.main === module) {
  generateReport();
}

export { generateReport };