#!/usr/bin/env node

/**
 * Claude Quality Check - Script de Validação
 * 
 * Script principal para executar verificações de qualidade
 * Integra com o sistema médico de automação
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class ClaudeQualityCheck {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.passed = 0;
        this.failed = 0;
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
    
    runCheck(name, command, critical = true) {
        try {
            this.log(`🔍 ${name}...`, 'info');
            execSync(command, { stdio: 'pipe', encoding: 'utf8' });
            this.log(`✅ ${name} passou`, 'success');
            this.passed++;
            return true;
        } catch (error) {
            const message = `${name}: ${error.message}`;
            if (critical) {
                this.log(`❌ ${message}`, 'error');
                this.errors.push(message);
                this.failed++;
            } else {
                this.log(`⚠️ ${message}`, 'warning');
                this.warnings.push(message);
            }
            return false;
        }
    }
    
    checkFileExists(filePath, description) {
        if (fs.existsSync(filePath)) {
            this.log(`✅ ${description} encontrado`, 'success');
            return true;
        } else {
            this.log(`❌ ${description} não encontrado: ${filePath}`, 'error');
            return false;
        }
    }
    
    execute() {
        this.log('🔧 Iniciando verificação de qualidade Claude...', 'info');
        
        // 1. Verificar estrutura básica
        const requiredDirs = [
            { path: 'apps/frontend-nextjs', desc: 'Diretório Frontend' },
            { path: 'apps/backend', desc: 'Diretório Backend' },
            { path: '.claude/automation', desc: 'Automação Claude' }
        ];
        
        requiredDirs.forEach(dir => {
            this.checkFileExists(dir.path, dir.desc);
        });
        
        // 2. Verificar se existe package.json do frontend
        if (fs.existsSync('apps/frontend-nextjs/package.json')) {
            // 3. TypeScript check
            this.runCheck('TypeScript Compilation', 'cd apps/frontend-nextjs && npm run type-check', true);
            
            // 4. ESLint check (não crítico)
            this.runCheck('ESLint Check', 'cd apps/frontend-nextjs && npm run lint', false);
            
            // 5. Build check
            this.runCheck('Production Build', 'cd apps/frontend-nextjs && npm run build', true);
        } else {
            this.log('⚠️ Frontend package.json não encontrado - pulando checks do frontend', 'warning');
        }
        
        // 6. Verificar automação Claude
        if (fs.existsSync('.claude/automation/lgpd-robust.js')) {
            this.runCheck('LGPD Compliance', 'node .claude/automation/lgpd-robust.js --quick-check', false);
        }
        
        if (fs.existsSync('.claude/automation/auto-documentation.js')) {
            this.runCheck('Auto Documentation', 'node .claude/automation/auto-documentation.js --validate', false);
        }
        
        // 7. Verificar medical quality blocker
        if (fs.existsSync('.claude/hooks/medical-quality-blocker.js')) {
            this.runCheck('Medical Quality Check', 'node .claude/hooks/medical-quality-blocker.js', true);
        }
        
        // Resultado final
        this.log('\n📊 Resultado da Verificação:', 'info');
        this.log(`✅ Passou: ${this.passed}`, 'success');
        this.log(`❌ Falhou: ${this.failed}`, 'error');
        this.log(`⚠️ Warnings: ${this.warnings.length}`, 'warning');
        
        if (this.errors.length > 0) {
            this.log('\n❌ Erros encontrados:', 'error');
            this.errors.forEach(error => this.log(`  • ${error}`, 'error'));
            return 1; // Exit code 1 = falha
        } else {
            this.log('\n✅ Todos os checks críticos passaram!', 'success');
            if (this.warnings.length > 0) {
                this.log('\n⚠️ Warnings (não bloqueiam):', 'warning');
                this.warnings.forEach(warning => this.log(`  • ${warning}`, 'warning'));
            }
            return 0; // Exit code 0 = sucesso
        }
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    const checker = new ClaudeQualityCheck();
    const exitCode = checker.execute();
    process.exit(exitCode);
}

module.exports = ClaudeQualityCheck;