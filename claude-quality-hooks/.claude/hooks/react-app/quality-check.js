#!/usr/bin/env node

/**
 * React App Quality Check Hook
 * Verificações específicas para aplicações React médico-educacionais
 *
 * Este hook é executado após operações de escrita em arquivos React
 * para garantir qualidade e compliance médico
 */

const fs = require('fs');
const path = require('path');

class ReactAppQualityCheck {
    constructor() {
        this.workspaceRoot = process.cwd();
        this.errors = [];
        this.warnings = [];
        this.info = [];
    }

    /**
     * Executa verificações de qualidade para React App
     */
    async runQualityChecks(filePath = null) {
        try {
            console.log('🔍 React App Quality Check...');

            // Verificar se é projeto React
            if (!this.isReactProject()) {
                console.log('ℹ️ Não é um projeto React, pulando verificações');
                return true;
            }

            // Se arquivo específico fornecido
            if (filePath && fs.existsSync(filePath)) {
                await this.checkFile(filePath);
            } else {
                await this.checkProject();
            }

            // Executar verificações específicas
            await this.checkReactConfig();
            await this.checkMedicalComponents();
            await this.checkAccessibility();
            await this.checkPersonaIntegration();

            this.reportResults();
            return this.errors.length === 0;

        } catch (error) {
            console.error('❌ Erro na verificação React:', error.message);
            return false;
        }
    }

    /**
     * Verifica se é projeto React
     */
    isReactProject() {
        const packageJsonPath = path.join(this.workspaceRoot, 'package.json');
        const nextConfigPath = path.join(this.workspaceRoot, 'next.config.js');

        if (fs.existsSync(nextConfigPath)) return true;

        if (fs.existsSync(packageJsonPath)) {
            try {
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
                return 'react' in deps || 'next' in deps || '@types/react' in deps;
            } catch {}
        }

        return false;
    }

    /**
     * Verifica configuração React/Next.js
     */
    async checkReactConfig() {
        const nextConfigPath = path.join(this.workspaceRoot, 'next.config.js');
        const packageJsonPath = path.join(this.workspaceRoot, 'package.json');

        // Verificar Next.js config
        if (fs.existsSync(nextConfigPath)) {
            try {
                const configContent = fs.readFileSync(nextConfigPath, 'utf8');

                // Verificar configurações médicas essenciais
                if (!configContent.includes('output')) {
                    this.warnings.push({
                        file: 'next.config.js',
                        message: 'Considere configurar output para deploy em Cloud Run'
                    });
                }

                if (!configContent.includes('trailingSlash')) {
                    this.info.push({
                        file: 'next.config.js',
                        message: 'Configuração trailingSlash não encontrada'
                    });
                }

            } catch (error) {
                this.errors.push({
                    file: 'next.config.js',
                    message: `Erro ao analisar configuração: ${error.message}`
                });
            }
        }

        // Verificar package.json
        if (fs.existsSync(packageJsonPath)) {
            try {
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

                // Verificar scripts essenciais
                const requiredScripts = ['build', 'dev', 'lint', 'type-check'];
                requiredScripts.forEach(script => {
                    if (!packageJson.scripts || !packageJson.scripts[script]) {
                        this.warnings.push({
                            file: 'package.json',
                            message: `Script '${script}' não encontrado`
                        });
                    }
                });

                // Verificar dependências médicas
                const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
                const medicalDeps = ['@types/react', 'typescript', 'eslint'];

                medicalDeps.forEach(dep => {
                    if (deps[dep]) {
                        this.info.push({
                            file: 'package.json',
                            message: `${dep} encontrado: ${deps[dep]}`
                        });
                    }
                });

            } catch (error) {
                this.errors.push({
                    file: 'package.json',
                    message: `Erro ao analisar package.json: ${error.message}`
                });
            }
        }
    }

    /**
     * Verifica componentes médicos específicos
     */
    async checkMedicalComponents() {
        const componentDirs = [
            'src/components',
            'apps/frontend-nextjs/src/components',
            'components'
        ];

        for (const dir of componentDirs) {
            const fullPath = path.join(this.workspaceRoot, dir);
            if (fs.existsSync(fullPath)) {
                await this.checkMedicalComponentsInDir(fullPath);
            }
        }
    }

    /**
     * Verifica componentes médicos em diretório
     */
    async checkMedicalComponentsInDir(dir) {
        const files = fs.readdirSync(dir);

        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);

            if (stat.isDirectory() && !file.startsWith('.')) {
                await this.checkMedicalComponentsInDir(filePath);
            } else if (stat.isFile() && /\.(tsx|jsx)$/.test(file)) {
                await this.checkMedicalComponent(filePath);
            }
        }
    }

    /**
     * Verifica componente médico específico
     */
    async checkMedicalComponent(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const relativePath = path.relative(this.workspaceRoot, filePath);

            // Verificar padrões médicos
            if (content.match(/dose|medication|calculate|hanseniase/i)) {
                // Verificar se tem disclaimer médico
                if (!content.match(/disclaimer|aviso|importante.*consulte/i)) {
                    this.warnings.push({
                        file: relativePath,
                        message: 'Componente médico pode precisar de disclaimer'
                    });
                }

                // Verificar validação de dados médicos
                if (!content.match(/validate|sanitize|check|verify/i)) {
                    this.warnings.push({
                        file: relativePath,
                        message: 'Componente médico pode precisar de validação de dados'
                    });
                }
            }

            // Verificar acessibilidade
            if (content.includes('<input') && !content.includes('aria-label') && !content.includes('htmlFor')) {
                this.warnings.push({
                    file: relativePath,
                    message: 'Input sem acessibilidade (aria-label ou label)'
                });
            }

            if (content.includes('<button') && !content.includes('aria-label') && !content.match(/>\s*\w+/)) {
                this.warnings.push({
                    file: relativePath,
                    message: 'Botão pode precisar de texto acessível'
                });
            }

            // Verificar uso de console.log em produção
            if (content.includes('console.log') && !filePath.includes('test') && !filePath.includes('dev')) {
                this.warnings.push({
                    file: relativePath,
                    message: 'console.log em componente de produção'
                });
            }

        } catch (error) {
            this.errors.push({
                file: filePath,
                message: `Erro ao verificar componente médico: ${error.message}`
            });
        }
    }

    /**
     * Verifica acessibilidade específica
     */
    async checkAccessibility() {
        const publicDir = path.join(this.workspaceRoot, 'public');

        // Verificar se existe favicon
        const faviconPath = path.join(publicDir, 'favicon.ico');
        if (!fs.existsSync(faviconPath)) {
            this.warnings.push({
                file: 'public/',
                message: 'Favicon não encontrado'
            });
        }

        // Verificar manifest.json para PWA
        const manifestPath = path.join(publicDir, 'manifest.json');
        if (fs.existsSync(manifestPath)) {
            this.info.push({
                file: 'public/manifest.json',
                message: 'PWA manifest encontrado'
            });
        }
    }

    /**
     * Verifica integração com personas
     */
    async checkPersonaIntegration() {
        const srcDirs = [
            'src',
            'apps/frontend-nextjs/src'
        ];

        for (const srcDir of srcDirs) {
            const fullPath = path.join(this.workspaceRoot, srcDir);
            if (fs.existsSync(fullPath)) {
                await this.checkPersonaFiles(fullPath);
            }
        }
    }

    /**
     * Verifica arquivos de persona
     */
    async checkPersonaFiles(dir) {
        const files = fs.readdirSync(dir);

        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);

            if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
                await this.checkPersonaFiles(filePath);
            } else if (stat.isFile() && /\.(ts|tsx|js|jsx)$/.test(file)) {
                await this.checkPersonaInFile(filePath);
            }
        }
    }

    /**
     * Verifica personas em arquivo
     */
    async checkPersonaInFile(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');
            const relativePath = path.relative(this.workspaceRoot, filePath);

            // Verificar referências às personas
            const hasGasnelio = content.includes('gasnelio') || content.includes('Gasnelio');
            const hasGa = content.includes('gá') || content.includes('Gá');

            if (hasGasnelio || hasGa) {
                this.info.push({
                    file: relativePath,
                    message: `Integração com persona detectada: ${hasGasnelio ? 'Dr. Gasnelio' : ''} ${hasGa ? 'Gá' : ''}`.trim()
                });

                // Verificar se tem seletor de persona
                if (!content.includes('PersonaSelector') && !content.includes('persona') && !content.includes('setPersona')) {
                    this.warnings.push({
                        file: relativePath,
                        message: 'Arquivo com personas pode precisar de seletor'
                    });
                }
            }

        } catch (error) {
            this.errors.push({
                file: filePath,
                message: `Erro ao verificar personas: ${error.message}`
            });
        }
    }

    /**
     * Verifica arquivo específico
     */
    async checkFile(filePath) {
        if (!/\.(tsx|jsx|ts|js)$/.test(filePath)) {
            console.log(`ℹ️ Arquivo não é React: ${filePath}`);
            return;
        }

        await this.checkMedicalComponent(filePath);
        await this.checkPersonaInFile(filePath);
    }

    /**
     * Verifica projeto completo
     */
    async checkProject() {
        console.log('📂 Verificando projeto React completo...');

        // Verificar estrutura esperada
        const expectedDirs = ['src', 'public', 'components'];
        expectedDirs.forEach(dir => {
            const dirPath = path.join(this.workspaceRoot, dir);
            if (fs.existsSync(dirPath)) {
                this.info.push({
                    file: dir,
                    message: 'Diretório encontrado'
                });
            }
        });
    }

    /**
     * Reporta resultados
     */
    reportResults() {
        console.log('\n📊 Resultados da Verificação React App:');

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
    const checker = new ReactAppQualityCheck();

    checker.runQualityChecks(filePath)
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('❌ Falha na verificação:', error);
            process.exit(1);
        });
}

module.exports = ReactAppQualityCheck;