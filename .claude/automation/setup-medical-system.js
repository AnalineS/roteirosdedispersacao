#!/usr/bin/env node

/**
 * Setup Medical System - Sistema de Configuração Automática
 * 
 * Script central para ativação completa do sistema médico de automação
 * Integra todos os componentes: LGPD, monitoramento, hooks, docs, etc.
 * 
 * @version 1.0.0
 * @author Sistema de Automação Claude
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class MedicalSystemSetup {
    constructor() {
        this.config = {
            medicalMode: true,
            lgpdCompliance: true,
            accessibilityWCAG: '2.1-AA',
            monitoringEnabled: true,
            personasEnabled: ['dr_gasnelio', 'ga'],
            calculatorsEnabled: ['rifampicina', 'dapsona', 'pqt'],
            progressiveDisclosure: true
        };
        
        this.setupSteps = [];
        this.errors = [];
        this.warnings = [];
    }
    
    log(message, type = 'info') {
        const colors = {
            info: '\x1b[36m',     // Cyan
            success: '\x1b[32m',  // Green
            warning: '\x1b[33m',  // Yellow
            error: '\x1b[31m',    // Red
            reset: '\x1b[0m'
        };
        console.log(`${colors[type]}${message}${colors.reset}`);
    }
    
    async setupDirectoryStructure() {
        this.log('🏗️ Configurando estrutura de diretórios médicos...', 'info');
        
        const dirs = [
            '.claude/automation/reports',
            '.claude/hooks/consolidated', 
            '.claude/config',
            '.claude/production/scripts',
            '.claude/training/updated'
        ];
        
        for (const dir of dirs) {
            try {
                await fs.mkdir(dir, { recursive: true });
                this.log(`✅ Diretório criado: ${dir}`, 'success');
            } catch (error) {
                this.log(`❌ Erro ao criar diretório ${dir}: ${error.message}`, 'error');
                this.errors.push(`Directory creation failed: ${dir}`);
            }
        }
    }
    
    async setupMedicalConfig() {
        this.log('⚙️ Configurando parâmetros médicos...', 'info');
        
        const medicalConfig = {
            project: {
                type: 'medical-education',
                domain: 'hanseniase',
                compliance: 'LGPD',
                accessibility: 'WCAG-2.1-AA'
            },
            personas: {
                dr_gasnelio: {
                    type: 'experienced_doctor',
                    complexity_level: 'advanced',
                    needs: ['complex_cases', 'scientific_refs', 'quick_updates']
                },
                ga: {
                    type: 'young_pharmacist', 
                    complexity_level: 'learning',
                    needs: ['guided_learning', 'basic_cases', 'detailed_explanations']
                }
            },
            calculators: {
                rifampicina: {
                    precision_threshold: 95,
                    validation_required: true,
                    adult_mb_cases: true,
                    pediatric_pb_cases: true
                },
                dapsona: {
                    precision_threshold: 95,
                    renal_function_check: true,
                    pregnancy_cases: true
                },
                pqt_schemes: {
                    pb_complete: true,
                    mb_complete: true,
                    duration_validation: true
                }
            },
            monitoring: {
                lgpd_real_time: true,
                medical_precision: true,
                accessibility_wcag: true,
                performance_critical: true
            },
            automation: {
                pre_commit_medical: true,
                pre_push_compliance: true,
                post_merge_docs: true,
                ci_medical_validation: true
            }
        };
        
        try {
            await fs.writeFile(
                '.claude/config/medical-system.json',
                JSON.stringify(medicalConfig, null, 2),
                'utf8'
            );
            this.log('✅ Configuração médica criada', 'success');
        } catch (error) {
            this.log(`❌ Erro ao criar configuração: ${error.message}`, 'error');
            this.errors.push('Medical config creation failed');
        }
    }
    
    async setupGitHooks() {
        this.log('🪝 Configurando hooks Git médicos...', 'info');
        
        try {
            // Verificar se hooks já existem
            const hookFiles = ['.git/hooks/pre-commit', '.git/hooks/pre-push', '.git/hooks/post-merge'];
            
            for (const hookFile of hookFiles) {
                try {
                    const exists = await fs.access(hookFile);
                    this.log(`✅ Hook já configurado: ${hookFile}`, 'success');
                } catch {
                    this.log(`⚠️ Hook não encontrado: ${hookFile}`, 'warning');
                    this.warnings.push(`Missing hook: ${hookFile}`);
                }
            }
            
        } catch (error) {
            this.log(`❌ Erro ao verificar hooks: ${error.message}`, 'error');
        }
    }
    
    async testMedicalSystems() {
        this.log('🧪 Testando sistemas médicos...', 'info');
        
        const tests = [
            {
                name: 'LGPD Compliance Checker',
                command: 'cd .claude/automation && node lgpd-compliance-checker.js --quick-check',
                critical: true
            },
            {
                name: 'Medical Documentation Generator', 
                command: 'cd .claude/automation && node auto-documentation.js --test-mode',
                critical: false
            },
            {
                name: 'TypeScript Compilation',
                command: 'cd apps/frontend-nextjs && npm run type-check',
                critical: true
            },
            {
                name: 'Production Build',
                command: 'cd apps/frontend-nextjs && npm run build',
                critical: true
            }
        ];
        
        for (const test of tests) {
            try {
                this.log(`🔍 Testando: ${test.name}...`);
                execSync(test.command, { stdio: 'pipe', timeout: 30000 });
                this.log(`✅ ${test.name} passou`, 'success');
            } catch (error) {
                const message = `❌ ${test.name} falhou`;
                if (test.critical) {
                    this.log(message, 'error');
                    this.errors.push(`Critical test failed: ${test.name}`);
                } else {
                    this.log(message, 'warning');
                    this.warnings.push(`Non-critical test failed: ${test.name}`);
                }
            }
        }
    }
    
    async generateSetupReport() {
        this.log('📊 Gerando relatório de configuração...', 'info');
        
        const report = {
            timestamp: new Date().toISOString(),
            setup_version: '1.0.0',
            medical_config: this.config,
            steps_completed: this.setupSteps.length,
            errors: this.errors,
            warnings: this.warnings,
            status: this.errors.length === 0 ? 'SUCCESS' : 'PARTIAL_SUCCESS',
            next_steps: this.errors.length === 0 ? 
                ['Sistema pronto para uso', 'Execute: npm run medical:dashboard'] :
                ['Corrigir erros listados', 'Re-executar setup'],
            medical_features: {
                lgpd_compliance: this.errors.filter(e => e.includes('lgpd')).length === 0,
                typescript_ready: this.errors.filter(e => e.includes('TypeScript')).length === 0,
                production_build: this.errors.filter(e => e.includes('build')).length === 0,
                hooks_configured: this.warnings.filter(w => w.includes('hook')).length < 3
            }
        };
        
        try {
            await fs.writeFile(
                '.claude/automation/reports/medical-setup-report.json',
                JSON.stringify(report, null, 2),
                'utf8'
            );
            this.log('✅ Relatório salvo em: .claude/automation/reports/medical-setup-report.json', 'success');
        } catch (error) {
            this.log(`❌ Erro ao salvar relatório: ${error.message}`, 'error');
        }
        
        return report;
    }
    
    async execute(options = {}) {
        this.log('🏥 Iniciando configuração do sistema médico...', 'info');
        this.log('📋 Sistema: Plataforma Educacional de Hanseníase', 'info');
        
        try {
            // Passo 1: Estrutura de diretórios
            await this.setupDirectoryStructure();
            this.setupSteps.push('directory_structure');
            
            // Passo 2: Configuração médica
            await this.setupMedicalConfig();
            this.setupSteps.push('medical_config');
            
            // Passo 3: Hooks Git
            await this.setupGitHooks();
            this.setupSteps.push('git_hooks');
            
            // Passo 4: Testes dos sistemas
            if (!options.skipTests) {
                await this.testMedicalSystems();
                this.setupSteps.push('system_tests');
            }
            
            // Passo 5: Relatório final
            const report = await this.generateSetupReport();
            this.setupSteps.push('final_report');
            
            // Resultado final
            if (this.errors.length === 0) {
                this.log('🎉 Sistema médico configurado com sucesso!', 'success');
                this.log('🚀 Próximos passos:', 'info');
                this.log('   1. Execute: node .claude/automation/continuous-monitoring-system.js --start', 'info');
                this.log('   2. Acesse dashboard: http://localhost:3030', 'info');
                this.log('   3. Faça commit das mudanças', 'info');
                return { success: true, report };
            } else {
                this.log(`⚠️ Configuração concluída com ${this.errors.length} erros`, 'warning');
                this.log('🔧 Corrija os erros e execute novamente', 'warning');
                return { success: false, report };
            }
            
        } catch (error) {
            this.log(`💥 Erro crítico durante configuração: ${error.message}`, 'error');
            return { success: false, error: error.message };
        }
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    const setup = new MedicalSystemSetup();
    const args = process.argv.slice(2);
    const options = {
        skipTests: args.includes('--skip-tests'),
        installAll: args.includes('--install-all')
    };
    
    setup.execute(options).then(result => {
        process.exit(result.success ? 0 : 1);
    }).catch(error => {
        console.error(`💥 Setup falhou: ${error.message}`);
        process.exit(1);
    });
}

module.exports = MedicalSystemSetup;