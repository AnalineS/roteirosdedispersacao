#!/usr/bin/env node

/**
 * Node.js TypeScript Quality Check Hook
 * Verificações específicas para projetos Node.js com TypeScript
 *
 * Este hook roda verificações de qualidade para código TypeScript
 * em projetos Node.js, com foco em padrões médicos e de segurança
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class NodeTypeScriptQualityCheck {
    constructor() {
        this.workspaceRoot = process.cwd();
        this.errors = [];
        this.warnings = [];
        this.info = [];
    }

    /**
     * Executa verificações completas de qualidade
     */
    async runQualityChecks(filePath = null) {
        try {
            console.log('🔍 Node.js TypeScript Quality Check...');

            // Verificar se é projeto TypeScript
            if (!this.isTypeScriptProject()) {
                console.log('ℹ️ Não é um projeto TypeScript, pulando verificações');
                return true;
            }

            // Se arquivo específico fornecido
            if (filePath && fs.existsSync(filePath)) {
                await this.checkFile(filePath);
            } else {
                await this.checkProject();
            }

            // Executar verificações específicas
            await this.checkTypeScriptConfig();
            await this.checkDependencies();
            await this.checkSecurityPatterns();

            this.reportResults();
            return this.errors.length === 0;

        } catch (error) {
            console.error('❌ Erro na verificação TypeScript:', error.message);
            return false;
        }
    }

    /**
     * Verifica se é projeto TypeScript
     */
    isTypeScriptProject() {
        const tsconfigPath = path.join(this.workspaceRoot, 'tsconfig.json');
        const packageJsonPath = path.join(this.workspaceRoot, 'package.json');

        if (fs.existsSync(tsconfigPath)) return true;

        if (fs.existsSync(packageJsonPath)) {
            try {
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
                return 'typescript' in deps || '@types/node' in deps;
            } catch {}
        }

        return false;
    }

    /**
     * Verifica configuração TypeScript
     */
    async checkTypeScriptConfig() {
        const tsconfigPath = path.join(this.workspaceRoot, 'tsconfig.json');

        if (!fs.existsSync(tsconfigPath)) {
            this.warnings.push({
                file: 'tsconfig.json',
                message: 'Arquivo tsconfig.json não encontrado'
            });
            return;
        }

        try {
            const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
            const compilerOptions = tsconfig.compilerOptions || {};

            // Verificar configurações recomendadas para projeto médico
            const recommendedOptions = {
                strict: true,
                noImplicitAny: true,
                noImplicitReturns: true,
                noUnusedLocals: true,
                noUnusedParameters: true
            };

            Object.entries(recommendedOptions).forEach(([option, recommended]) => {
                if (compilerOptions[option] !== recommended) {
                    this.warnings.push({
                        file: 'tsconfig.json',
                        message: `Configuração recomendada: "${option}": ${recommended}`
                    });
                }
            });

            // Verificar se exclude inclui node_modules
            if (!tsconfig.exclude || !tsconfig.exclude.includes('node_modules')) {
                this.warnings.push({
                    file: 'tsconfig.json',
                    message: 'Adicionar "node_modules" ao exclude para melhor performance'
                });
            }

        } catch (error) {
            this.errors.push({
                file: 'tsconfig.json',
                message: `Erro ao analisar tsconfig.json: ${error.message}`
            });
        }
    }

    /**
     * Verifica dependências e versões
     */
    async checkDependencies() {
        const packageJsonPath = path.join(this.workspaceRoot, 'package.json');

        if (!fs.existsSync(packageJsonPath)) return;

        try {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

            // Verificar versões críticas para projeto médico
            const criticalDeps = {
                'typescript': '^5.0.0',
                '@types/node': '^20.0.0',
                'eslint': '^8.0.0'
            };

            Object.entries(criticalDeps).forEach(([dep, minVersion]) => {
                if (deps[dep]) {
                    this.info.push({
                        file: 'package.json',
                        message: `${dep} encontrado: ${deps[dep]}`
                    });
                }
            });

            // Verificar dependências de segurança
            const securityDeps = ['helmet', 'cors', 'express-rate-limit', 'bcrypt'];
            const hasSecurityDeps = securityDeps.some(dep => deps[dep]);

            if (!hasSecurityDeps) {
                this.warnings.push({
                    file: 'package.json',
                    message: 'Considere adicionar dependências de segurança (helmet, cors, etc.)'
                });
            }

        } catch (error) {
            this.errors.push({
                file: 'package.json',
                message: `Erro ao analisar package.json: ${error.message}`
            });
        }
    }

    /**
     * Verifica padrões de segurança específicos
     */
    async checkSecurityPatterns() {
        const srcDirs = ['src', 'apps/frontend-nextjs/src', 'apps/backend'];

        for (const srcDir of srcDirs) {
            const fullPath = path.join(this.workspaceRoot, srcDir);
            if (fs.existsSync(fullPath)) {
                await this.checkSecurityInDirectory(fullPath);
            }
        }
    }

    /**
     * Verifica segurança em diretório
     */
    async checkSecurityInDirectory(dir) {
        const files = fs.readdirSync(dir);

        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);

            if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
                await this.checkSecurityInDirectory(filePath);
            } else if (stat.isFile() && /\.(ts|tsx|js|jsx)$/.test(file)) {
                await this.checkFileForSecurity(filePath);
            }
        }
    }

    /**
     * Verifica arquivo específico
     */
    async checkFile(filePath) {
        if (!/\.(ts|tsx)$/.test(filePath)) {
            console.log(`ℹ️ Arquivo não é TypeScript: ${filePath}`);
            return;
        }

        await this.checkTypeScriptFile(filePath);
        await this.checkFileForSecurity(filePath);
    }

    /**
     * Verifica arquivo TypeScript
     */
    async checkTypeScriptFile(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const relativePath = path.relative(this.workspaceRoot, filePath);

            // Verificar uso de 'any'
            const anyMatches = content.match(/:\s*any\b/g);
            if (anyMatches) {
                this.warnings.push({
                    file: relativePath,
                    message: `${anyMatches.length} uso(s) de 'any' - considere tipos específicos`
                });
            }

            // Verificar console.log em produção
            if (content.includes('console.log') && !filePath.includes('test') && !filePath.includes('dev')) {
                this.warnings.push({
                    file: relativePath,
                    message: 'console.log em código de produção'
                });
            }

            // Verificar imports não utilizados (padrão básico)
            const importLines = content.match(/^import\s+.*$/gm) || [];
            importLines.forEach(importLine => {
                const match = importLine.match(/import\s+{([^}]+)}/);
                if (match) {
                    const imports = match[1].split(',').map(i => i.trim());
                    imports.forEach(imp => {
                        if (!content.includes(imp.replace(/\s+as\s+\w+/, ''))) {
                            this.warnings.push({
                                file: relativePath,
                                message: `Possível import não utilizado: ${imp}`
                            });
                        }
                    });
                }
            });

        } catch (error) {
            this.errors.push({
                file: filePath,
                message: `Erro ao verificar TypeScript: ${error.message}`
            });
        }
    }

    /**
     * Verifica arquivo para padrões de segurança
     */
    async checkFileForSecurity(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const relativePath = path.relative(this.workspaceRoot, filePath);

            // Padrões perigosos
            const dangerousPatterns = [
                { pattern: /eval\s*\(/, message: 'Uso perigoso de eval()' },
                { pattern: /innerHTML\s*=/, message: 'innerHTML sem sanitização - risco XSS' },
                { pattern: /document\.write\s*\(/, message: 'document.write é perigoso' },
                { pattern: /exec\s*\(/, message: 'Uso de exec() pode ser perigoso' }
            ];

            dangerousPatterns.forEach(({ pattern, message }) => {
                if (pattern.test(content)) {
                    this.errors.push({
                        file: relativePath,
                        message
                    });
                }
            });

            // Verificar dados médicos sem validação
            if (content.match(/dose|medication|calculate/i)) {
                if (!content.match(/validate|sanitize|clean|check/i)) {
                    this.warnings.push({
                        file: relativePath,
                        message: 'Código médico pode precisar de validação adicional'
                    });
                }
            }

            // Verificar logging de dados sensíveis
            if (content.match(/console\.log.*(?:password|secret|key|token)/i)) {
                this.errors.push({
                    file: relativePath,
                    message: 'Possível logging de dados sensíveis'
                });
            }

        } catch (error) {
            this.errors.push({
                file: filePath,
                message: `Erro na verificação de segurança: ${error.message}`
            });
        }
    }

    /**
     * Verifica todo o projeto
     */
    async checkProject() {
        console.log('📂 Verificando projeto completo...');

        // Verificar estrutura de pastas
        const expectedDirs = ['src', 'apps', '.claude'];
        expectedDirs.forEach(dir => {
            const dirPath = path.join(this.workspaceRoot, dir);
            if (fs.existsSync(dirPath)) {
                this.info.push({
                    file: dir,
                    message: 'Diretório encontrado'
                });
            }
        });

        // Verificar arquivos modificados recentemente
        try {
            const modifiedFiles = execSync('git diff --name-only HEAD~1', { encoding: 'utf8' })
                .split('\n')
                .filter(f => f.trim() && /\.(ts|tsx)$/.test(f));

            for (const file of modifiedFiles) {
                const fullPath = path.join(this.workspaceRoot, file);
                if (fs.existsSync(fullPath)) {
                    await this.checkFile(fullPath);
                }
            }
        } catch {
            console.log('ℹ️ Git não disponível, verificando arquivos comuns');
        }
    }

    /**
     * Reporta resultados
     */
    reportResults() {
        console.log('\n📊 Resultados da Verificação Node.js TypeScript:');

        if (this.info.length > 0) {
            console.log(`\nℹ️ Informações (${this.info.length}):`);
            this.info.forEach(info => {
                console.log(`   ${info.file}: ${info.message}`);
            });
        }

        if (this.warnings.length > 0) {
            console.log(`\n⚠️ Avisos (${this.warnings.length}):`);
            this.warnings.forEach(warning => {
                console.log(`   ${warning.file}: ${warning.message}`);
            });
        }

        if (this.errors.length > 0) {
            console.log(`\n❌ Erros (${this.errors.length}):`);
            this.errors.forEach(error => {
                console.log(`   ${error.file}: ${error.message}`);
            });
        } else {
            console.log('✅ Nenhum erro crítico encontrado');
        }

        console.log(`\n🎯 Score: ${Math.max(0, 100 - (this.errors.length * 20 + this.warnings.length * 5))}/100`);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    const filePath = process.argv[2];
    const checker = new NodeTypeScriptQualityCheck();

    checker.runQualityChecks(filePath)
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('❌ Falha na verificação:', error);
            process.exit(1);
        });
}

module.exports = NodeTypeScriptQualityCheck;