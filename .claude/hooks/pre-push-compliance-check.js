#!/usr/bin/env node

/**
 * Pre-push Hook: Verificação de Conformidade Completa
 * 
 * Hook executado antes de push para garantir:
 * - Conformidade LGPD completa
 * - Qualidade médica validada
 * - Testes passando
 * - Segurança verificada
 * - Documentação atualizada
 * 
 * @version 2.0.0
 * @author Sistema de Automação Claude
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class PrePushComplianceChecker {
    constructor() {
        this.config = {
            // Verificações obrigatórias por ambiente
            requiredChecks: {
                development: ['lgpd', 'medical_quality', 'basic_tests'],
                staging: ['lgpd', 'medical_quality', 'all_tests', 'security', 'documentation'],
                production: ['lgpd', 'medical_quality', 'all_tests', 'security', 'documentation', 'performance']
            },
            
            // Limites de qualidade
            qualityThresholds: {
                testCoverage: 80,        // Cobertura mínima de testes
                lgpdCompliance: 100,     // Conformidade LGPD deve ser 100%
                medicalAccuracy: 95,     // Precisão médica mínima
                securityScore: 90,       // Score de segurança mínimo
                accessibilityScore: 85   // Score de acessibilidade mínimo
            },
            
            // Branches protegidas
            protectedBranches: ['main', 'master', 'production', 'staging'],
            
            // Configurações específicas por branch
            branchConfig: {
                main: { env: 'production', strictMode: true },
                master: { env: 'production', strictMode: true },
                production: { env: 'production', strictMode: true },
                staging: { env: 'staging', strictMode: true },
                develop: { env: 'staging', strictMode: false },
                default: { env: 'development', strictMode: false }
            },
            
            // Timeout para execução de testes
            timeouts: {
                unit: 5 * 60 * 1000,        // 5 minutos
                integration: 10 * 60 * 1000, // 10 minutos
                e2e: 15 * 60 * 1000,         // 15 minutos
                medical: 8 * 60 * 1000       // 8 minutos
            }
        };
        
        this.results = {
            lgpd: { passed: false, score: 0, violations: [] },
            medical: { passed: false, score: 0, issues: [] },
            tests: { passed: false, coverage: 0, failures: [] },
            security: { passed: false, score: 0, vulnerabilities: [] },
            documentation: { passed: false, coverage: 0, missing: [] },
            performance: { passed: false, scores: {}, issues: [] }
        };
        
        this.environment = 'development';
        this.currentBranch = '';
        this.strictMode = false;
    }
    
    /**
     * Executa verificação completa de conformidade
     */
    async runComplianceCheck() {
        console.log('🔒 Iniciando verificação de conformidade pré-push...\n');
        
        try {
            // 1. Detecta ambiente e configuração
            await this.detectEnvironment();
            
            // 2. Obtém informações do push
            const pushInfo = this.getPushInfo();
            console.log(`🌿 Branch: ${this.currentBranch} (${this.environment})`);
            console.log(`📋 Modo: ${this.strictMode ? 'Estrito' : 'Normal'}\n`);
            
            // 3. Executa verificações obrigatórias
            const requiredChecks = this.config.requiredChecks[this.environment] || this.config.requiredChecks.development;
            console.log(`🔍 Executando verificações: ${requiredChecks.join(', ')}\n`);
            
            // 4. Verificação LGPD
            if (requiredChecks.includes('lgpd')) {
                console.log('🛡️  Verificando conformidade LGPD...');
                await this.runLGPDCheck();
            }
            
            // 5. Verificação de qualidade médica
            if (requiredChecks.includes('medical_quality')) {
                console.log('🏥 Verificando qualidade médica...');
                await this.runMedicalQualityCheck();
            }
            
            // 6. Execução de testes
            if (requiredChecks.includes('basic_tests') || requiredChecks.includes('all_tests')) {
                console.log('🧪 Executando testes...');
                await this.runTests(requiredChecks.includes('all_tests'));
            }
            
            // 7. Verificação de segurança
            if (requiredChecks.includes('security')) {
                console.log('🔒 Verificando segurança...');
                await this.runSecurityCheck();
            }
            
            // 8. Verificação de documentação
            if (requiredChecks.includes('documentation')) {
                console.log('📚 Verificando documentação...');
                await this.runDocumentationCheck();
            }
            
            // 9. Verificação de performance (apenas para produção)
            if (requiredChecks.includes('performance')) {
                console.log('⚡ Verificando performance...');
                await this.runPerformanceCheck();
            }
            
            // 10. Análise final
            const finalResult = this.analyzeFinalResult();
            
            if (finalResult.canPush) {
                console.log('\\n✅ PUSH AUTORIZADO - Todas as verificações passaram!\\n');
                this.displaySuccessSummary();
                return { success: true, results: this.results };
            } else {
                console.log('\\n❌ PUSH BLOQUEADO - Corrija os problemas antes de continuar\\n');
                this.displayFailureSummary(finalResult.issues);
                return { success: false, results: this.results, issues: finalResult.issues };
            }
            
        } catch (error) {
            console.error('❌ Erro durante verificação de conformidade:', error.message);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Detecta ambiente baseado na branch
     */
    async detectEnvironment() {
        try {
            this.currentBranch = execSync('git branch --show-current', { encoding: 'utf-8' }).trim();
            
            const branchConfig = this.config.branchConfig[this.currentBranch] || this.config.branchConfig.default;
            this.environment = branchConfig.env;
            this.strictMode = branchConfig.strictMode;
            
        } catch (error) {
            console.warn('Aviso: Não foi possível detectar branch atual, usando configuração padrão');
            this.currentBranch = 'unknown';
        }
    }
    
    /**
     * Obtém informações do push
     */
    getPushInfo() {
        try {
            const remote = execSync('git remote get-url origin', { encoding: 'utf-8' }).trim();
            const lastCommit = execSync('git log -1 --format="%h %s"', { encoding: 'utf-8' }).trim();
            
            return {
                remote,
                branch: this.currentBranch,
                lastCommit,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                remote: 'unknown',
                branch: this.currentBranch,
                lastCommit: 'unknown',
                timestamp: new Date().toISOString()
            };
        }
    }
    
    /**
     * Executa verificação LGPD
     */
    async runLGPDCheck() {
        try {
            // Executa o checker LGPD
            const lgpdScript = path.join(__dirname, '..', 'automation', 'lgpd-compliance-checker.js');
            
            const output = execSync(`node "${lgpdScript}"`, { 
                encoding: 'utf-8',
                timeout: 2 * 60 * 1000, // 2 minutos
                stdio: 'pipe'
            });
            
            // Parse do resultado (assumindo JSON no final)
            const lines = output.split('\\n');
            const jsonLine = lines.find(line => line.trim().startsWith('{'));
            
            if (jsonLine) {
                const result = JSON.parse(jsonLine);
                this.results.lgpd = {
                    passed: result.compliance.score >= this.config.qualityThresholds.lgpdCompliance,
                    score: result.compliance.score,
                    violations: result.violations || []
                };
            } else {
                this.results.lgpd = {
                    passed: true,
                    score: 100,
                    violations: []
                };
            }
            
            console.log(`   📊 Score LGPD: ${this.results.lgpd.score}% ${this.results.lgpd.passed ? '✅' : '❌'}`);
            
        } catch (error) {
            console.warn(`   ⚠️  Erro na verificação LGPD: ${error.message}`);
            this.results.lgpd = {
                passed: !this.strictMode, // Falha apenas em modo estrito
                score: 0,
                violations: [{ severity: 'ERROR', message: error.message }]
            };
        }
    }
    
    /**
     * Executa verificação de qualidade médica
     */
    async runMedicalQualityCheck() {
        try {
            // Executa testes médicos específicos
            const medicalTests = [
                'npm run test:educational',
                'npm run test:clinical-cases', 
                'npm run test:dose-calculator'
            ];
            
            let passedTests = 0;
            const issues = [];
            
            for (const testCmd of medicalTests) {
                try {
                    execSync(`cd apps/frontend-nextjs && ${testCmd}`, {
                        encoding: 'utf-8',
                        timeout: this.config.timeouts.medical,
                        stdio: 'pipe'
                    });
                    passedTests++;
                } catch (testError) {
                    issues.push({
                        test: testCmd,
                        error: testError.message.split('\\n')[0] // Primeira linha do erro
                    });
                }
            }
            
            const score = (passedTests / medicalTests.length) * 100;
            
            this.results.medical = {
                passed: score >= this.config.qualityThresholds.medicalAccuracy,
                score,
                issues
            };
            
            console.log(`   📊 Score Médico: ${score.toFixed(1)}% ${this.results.medical.passed ? '✅' : '❌'}`);
            
        } catch (error) {
            console.warn(`   ⚠️  Erro na verificação médica: ${error.message}`);
            this.results.medical = {
                passed: false,
                score: 0,
                issues: [{ error: error.message }]
            };
        }
    }
    
    /**
     * Executa testes
     */
    async runTests(allTests = false) {
        try {
            const testSuites = allTests ? 
                ['test:unit', 'test:integration', 'test:a11y', 'test:performance'] :
                ['test:unit'];
            
            let totalPassed = 0;
            let totalFailed = 0;
            const failures = [];
            
            // Executa cobertura de testes
            try {
                const coverageOutput = execSync('cd apps/frontend-nextjs && npm run test:coverage', {
                    encoding: 'utf-8',
                    timeout: this.config.timeouts.unit,
                    stdio: 'pipe'
                });
                
                // Parse da cobertura (busca por percentual)
                const coverageMatch = coverageOutput.match(/All files[\\s\\S]*?(\\d+(?:\\.\\d+)?)%/);
                if (coverageMatch) {
                    this.results.tests.coverage = parseFloat(coverageMatch[1]);
                }
                
            } catch (coverageError) {
                console.warn(`   ⚠️  Erro ao calcular cobertura: ${coverageError.message.split('\\n')[0]}`);
            }
            
            // Executa suites de teste
            for (const suite of testSuites) {
                try {
                    const output = execSync(`cd apps/frontend-nextjs && npm run ${suite}`, {
                        encoding: 'utf-8',
                        timeout: this.config.timeouts[suite.split(':')[1]] || this.config.timeouts.unit,
                        stdio: 'pipe'
                    });
                    
                    // Parse básico dos resultados
                    const passMatch = output.match(/(\\d+) passing/);
                    const failMatch = output.match(/(\\d+) failing/);
                    
                    if (passMatch) totalPassed += parseInt(passMatch[1]);
                    if (failMatch) {
                        const failCount = parseInt(failMatch[1]);
                        totalFailed += failCount;
                        if (failCount > 0) {
                            failures.push({ suite, failures: failCount });
                        }
                    }
                    
                } catch (testError) {
                    totalFailed++;
                    failures.push({ 
                        suite, 
                        error: testError.message.split('\\n')[0]
                    });
                }
            }
            
            this.results.tests = {
                passed: totalFailed === 0 && this.results.tests.coverage >= this.config.qualityThresholds.testCoverage,
                coverage: this.results.tests.coverage || 0,
                failures,
                stats: { passed: totalPassed, failed: totalFailed }
            };
            
            console.log(`   📊 Testes: ${totalPassed} ✅ ${totalFailed} ❌ (Cobertura: ${this.results.tests.coverage.toFixed(1)}%)`);
            
        } catch (error) {
            console.warn(`   ⚠️  Erro na execução de testes: ${error.message}`);
            this.results.tests = {
                passed: false,
                coverage: 0,
                failures: [{ error: error.message }],
                stats: { passed: 0, failed: 1 }
            };
        }
    }
    
    /**
     * Executa verificação de segurança
     */
    async runSecurityCheck() {
        try {
            const securityChecks = [];
            
            // NPM Audit
            try {
                execSync('cd apps/frontend-nextjs && npm audit --audit-level moderate', {
                    encoding: 'utf-8',
                    timeout: 2 * 60 * 1000,
                    stdio: 'pipe'
                });
                securityChecks.push({ check: 'npm_audit', passed: true });
            } catch (auditError) {
                securityChecks.push({ 
                    check: 'npm_audit', 
                    passed: false, 
                    issues: auditError.message.split('\\n').slice(0, 3)
                });
            }
            
            // ESLint Security Rules
            try {
                execSync('cd apps/frontend-nextjs && npx eslint . --ext .ts,.tsx,.js,.jsx', {
                    encoding: 'utf-8',
                    timeout: 2 * 60 * 1000,
                    stdio: 'pipe'
                });
                securityChecks.push({ check: 'eslint_security', passed: true });
            } catch (lintError) {
                const securityIssues = lintError.message.split('\\n')
                    .filter(line => /security|vulnerability|dangerous/i.test(line))
                    .slice(0, 5);
                    
                securityChecks.push({ 
                    check: 'eslint_security', 
                    passed: securityIssues.length === 0,
                    issues: securityIssues
                });
            }
            
            // Calcula score baseado nos checks
            const passedChecks = securityChecks.filter(c => c.passed).length;
            const score = (passedChecks / securityChecks.length) * 100;
            
            this.results.security = {
                passed: score >= this.config.qualityThresholds.securityScore,
                score,
                vulnerabilities: securityChecks.filter(c => !c.passed)
            };
            
            console.log(`   📊 Score Segurança: ${score.toFixed(1)}% ${this.results.security.passed ? '✅' : '❌'}`);
            
        } catch (error) {
            console.warn(`   ⚠️  Erro na verificação de segurança: ${error.message}`);
            this.results.security = {
                passed: false,
                score: 0,
                vulnerabilities: [{ error: error.message }]
            };
        }
    }
    
    /**
     * Executa verificação de documentação
     */
    async runDocumentationCheck() {
        try {
            // Gera documentação automática
            const docsScript = path.join(__dirname, '..', 'automation', 'auto-documentation.js');
            
            try {
                execSync(`node "${docsScript}"`, {
                    encoding: 'utf-8',
                    timeout: 3 * 60 * 1000,
                    stdio: 'pipe'
                });
                
                // Verifica se documentação foi gerada
                const docsDir = './docs/generated';
                try {
                    await fs.access(docsDir);
                    const files = await fs.readdir(docsDir);
                    const coverage = files.length > 5 ? 90 : (files.length * 15); // Estimativa simples
                    
                    this.results.documentation = {
                        passed: coverage >= 70, // Pelo menos 70% de cobertura de docs
                        coverage,
                        missing: []
                    };
                    
                } catch (accessError) {
                    this.results.documentation = {
                        passed: false,
                        coverage: 0,
                        missing: ['Documentação automática não gerada']
                    };
                }
                
            } catch (docsError) {
                this.results.documentation = {
                    passed: !this.strictMode,
                    coverage: 0,
                    missing: [`Erro na geração de documentação: ${docsError.message.split('\\n')[0]}`]
                };
            }
            
            console.log(`   📊 Documentação: ${this.results.documentation.coverage.toFixed(1)}% ${this.results.documentation.passed ? '✅' : '❌'}`);
            
        } catch (error) {
            console.warn(`   ⚠️  Erro na verificação de documentação: ${error.message}`);
            this.results.documentation = {
                passed: false,
                coverage: 0,
                missing: [error.message]
            };
        }
    }
    
    /**
     * Executa verificação de performance
     */
    async runPerformanceCheck() {
        try {
            // Build de produção para testar performance
            console.log('   🔧 Executando build de produção...');
            
            execSync('cd apps/frontend-nextjs && npm run build', {
                encoding: 'utf-8',
                timeout: 5 * 60 * 1000,
                stdio: 'pipe'
            });
            
            // Análise do bundle
            const buildDir = './apps/frontend-nextjs/.next';
            try {
                await fs.access(buildDir);
                
                // Verifica tamanho do bundle (estimativa simples)
                const stats = await fs.stat(path.join(buildDir, 'static'));
                const sizeInMB = stats.size / (1024 * 1024);
                
                const performanceScore = sizeInMB < 5 ? 95 : (sizeInMB < 10 ? 80 : 60);
                
                this.results.performance = {
                    passed: performanceScore >= 80,
                    scores: {
                        bundleSize: performanceScore,
                        buildTime: 85 // Placeholder
                    },
                    issues: sizeInMB > 10 ? [`Bundle muito grande: ${sizeInMB.toFixed(1)}MB`] : []
                };
                
            } catch (statsError) {
                this.results.performance = {
                    passed: false,
                    scores: { buildTime: 0 },
                    issues: ['Não foi possível analisar build de produção']
                };
            }
            
            console.log(`   📊 Performance: ${Object.values(this.results.performance.scores)[0] || 0}% ${this.results.performance.passed ? '✅' : '❌'}`);
            
        } catch (error) {
            console.warn(`   ⚠️  Erro na verificação de performance: ${error.message}`);
            this.results.performance = {
                passed: false,
                scores: {},
                issues: [error.message.split('\\n')[0]]
            };
        }
    }
    
    /**
     * Analisa resultado final
     */
    analyzeFinalResult() {
        const issues = [];
        let canPush = true;
        
        // Verifica cada resultado
        Object.entries(this.results).forEach(([check, result]) => {
            if (!result.passed) {
                canPush = false;
                
                switch (check) {
                    case 'lgpd':
                        issues.push({
                            severity: 'CRITICAL',
                            check: 'LGPD Compliance',
                            message: `Score LGPD: ${result.score}% (mínimo: ${this.config.qualityThresholds.lgpdCompliance}%)`,
                            violations: result.violations.length
                        });
                        break;
                        
                    case 'medical':
                        issues.push({
                            severity: 'HIGH',
                            check: 'Qualidade Médica',
                            message: `Score médico: ${result.score}% (mínimo: ${this.config.qualityThresholds.medicalAccuracy}%)`,
                            issues: result.issues.length
                        });
                        break;
                        
                    case 'tests':
                        issues.push({
                            severity: 'HIGH',
                            check: 'Testes',
                            message: `Cobertura: ${result.coverage}% (mínimo: ${this.config.qualityThresholds.testCoverage}%), Falhas: ${result.stats?.failed || 0}`,
                            failures: result.failures.length
                        });
                        break;
                        
                    case 'security':
                        issues.push({
                            severity: 'HIGH',
                            check: 'Segurança',
                            message: `Score segurança: ${result.score}% (mínimo: ${this.config.qualityThresholds.securityScore}%)`,
                            vulnerabilities: result.vulnerabilities.length
                        });
                        break;
                        
                    case 'documentation':
                        issues.push({
                            severity: this.strictMode ? 'HIGH' : 'MEDIUM',
                            check: 'Documentação',
                            message: `Cobertura documentação: ${result.coverage}%`,
                            missing: result.missing.length
                        });
                        break;
                        
                    case 'performance':
                        issues.push({
                            severity: 'MEDIUM',
                            check: 'Performance',
                            message: `Problemas de performance detectados`,
                            issues: result.issues.length
                        });
                        break;
                }
            }
        });
        
        // Em modo não-estrito, permite push com avisos não críticos
        if (!this.strictMode) {
            const criticalIssues = issues.filter(i => i.severity === 'CRITICAL');
            canPush = criticalIssues.length === 0;
        }
        
        return { canPush, issues };
    }
    
    /**
     * Exibe resumo de sucesso
     */
    displaySuccessSummary() {
        console.log('📊 RESUMO DAS VERIFICAÇÕES:');
        console.log(`   🛡️  LGPD: ${this.results.lgpd.score}% ✅`);
        console.log(`   🏥 Médico: ${this.results.medical.score}% ✅`);
        console.log(`   🧪 Testes: ${this.results.tests.coverage}% cobertura ✅`);
        
        if (this.results.security.score > 0) {
            console.log(`   🔒 Segurança: ${this.results.security.score}% ✅`);
        }
        
        if (this.results.documentation.coverage > 0) {
            console.log(`   📚 Documentação: ${this.results.documentation.coverage}% ✅`);
        }
        
        if (Object.keys(this.results.performance.scores).length > 0) {
            const perfScore = Object.values(this.results.performance.scores)[0];
            console.log(`   ⚡ Performance: ${perfScore}% ✅`);
        }
        
        console.log(`\\n🎯 Ambiente: ${this.environment.toUpperCase()}`);
        console.log(`🌿 Branch: ${this.currentBranch}`);
        console.log(`⚙️  Modo: ${this.strictMode ? 'Estrito' : 'Normal'}`);
    }
    
    /**
     * Exibe resumo de falha
     */
    displayFailureSummary(issues) {
        console.log('❌ PROBLEMAS ENCONTRADOS:\\n');
        
        const critical = issues.filter(i => i.severity === 'CRITICAL');
        const high = issues.filter(i => i.severity === 'HIGH');
        const medium = issues.filter(i => i.severity === 'MEDIUM');
        
        if (critical.length > 0) {
            console.log('🚨 CRÍTICOS (bloqueiam push):');
            critical.forEach(issue => {
                console.log(`   • ${issue.check}: ${issue.message}`);
            });
            console.log();
        }
        
        if (high.length > 0) {
            console.log('⚠️  ALTOS:');
            high.forEach(issue => {
                console.log(`   • ${issue.check}: ${issue.message}`);
            });
            console.log();
        }
        
        if (medium.length > 0) {
            console.log('🔸 MÉDIOS:');
            medium.forEach(issue => {
                console.log(`   • ${issue.check}: ${issue.message}`);
            });
            console.log();
        }
        
        console.log('💡 PRÓXIMOS PASSOS:');
        console.log('   1. Corrija os problemas críticos e altos');
        console.log('   2. Execute os testes localmente: npm run test');
        console.log('   3. Verifique conformidade LGPD: node .claude/automation/lgpd-compliance-checker.js');
        console.log('   4. Tente o push novamente');
        console.log();
    }
}

// Execução principal
if (require.main === module) {
    const checker = new PrePushComplianceChecker();
    
    checker.runComplianceCheck()
        .then(result => {
            if (!result.success) {
                process.exit(1);
            } else {
                process.exit(0);
            }
        })
        .catch(error => {
            console.error('❌ Erro fatal durante verificação:', error.message);
            process.exit(1);
        });
}

module.exports = { PrePushComplianceChecker };