#!/usr/bin/env node

/**
 * Quality Check Hook for VSCode Extension Integration
 * Integra verificações de qualidade com extensões do VSCode
 *
 * Este hook é executado por ferramentas de extensão do VSCode
 * para garantir qualidade do código em tempo real
 */

const fs = require('fs');
const path = require('path');

class VSCodeQualityCheck {
    constructor() {
        this.workspaceRoot = process.cwd();
        this.errors = [];
        this.warnings = [];
    }

    /**
     * Executa verificações de qualidade para extensões VSCode
     */
    async runQualityChecks(filePath = null) {
        try {
            console.log('🔍 Executando verificações de qualidade...');

            // Se arquivo específico fornecido, verificar apenas ele
            if (filePath && fs.existsSync(filePath)) {
                await this.checkFile(filePath);
            } else {
                // Verificar arquivos modificados
                await this.checkModifiedFiles();
            }

            // Reportar resultados
            this.reportResults();

            // Retornar status
            return this.errors.length === 0;

        } catch (error) {
            console.error('❌ Erro na verificação de qualidade:', error.message);
            return false;
        }
    }

    /**
     * Verifica arquivo específico
     */
    async checkFile(filePath) {
        const ext = path.extname(filePath);
        const relativePath = path.relative(this.workspaceRoot, filePath);

        console.log(`📁 Verificando: ${relativePath}`);

        // Verificações por tipo de arquivo
        switch (ext) {
            case '.ts':
            case '.tsx':
                await this.checkTypeScript(filePath);
                break;
            case '.js':
            case '.jsx':
                await this.checkJavaScript(filePath);
                break;
            case '.py':
                await this.checkPython(filePath);
                break;
            case '.md':
                await this.checkMarkdown(filePath);
                break;
            default:
                console.log(`ℹ️ Tipo de arquivo não suportado: ${ext}`);
        }
    }

    /**
     * Verifica arquivos TypeScript
     */
    async checkTypeScript(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');

            // Verificar problemas comuns
            if (content.includes('any')) {
                this.warnings.push({
                    file: filePath,
                    message: 'Uso de "any" detectado - considere tipos mais específicos'
                });
            }

            if (content.includes('console.log') && !filePath.includes('test')) {
                this.warnings.push({
                    file: filePath,
                    message: 'console.log encontrado em código de produção'
                });
            }

            // Verificar imports médicos críticos
            if (content.includes('dose') || content.includes('medication')) {
                if (!content.includes('validation') && !content.includes('sanitize')) {
                    this.warnings.push({
                        file: filePath,
                        message: 'Código médico sem validação/sanitização aparente'
                    });
                }
            }

        } catch (error) {
            this.errors.push({
                file: filePath,
                message: `Erro ao verificar TypeScript: ${error.message}`
            });
        }
    }

    /**
     * Verifica arquivos JavaScript
     */
    async checkJavaScript(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');

            // Verificações básicas de qualidade
            if (content.includes('eval(')) {
                this.errors.push({
                    file: filePath,
                    message: 'Uso perigoso de eval() detectado'
                });
            }

            if (content.includes('innerHTML') && !content.includes('sanitize')) {
                this.warnings.push({
                    file: filePath,
                    message: 'innerHTML sem sanitização - possível XSS'
                });
            }

        } catch (error) {
            this.errors.push({
                file: filePath,
                message: `Erro ao verificar JavaScript: ${error.message}`
            });
        }
    }

    /**
     * Verifica arquivos Python
     */
    async checkPython(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');

            // Verificações específicas para Python médico
            if (content.includes('exec(') || content.includes('eval(')) {
                this.errors.push({
                    file: filePath,
                    message: 'Uso perigoso de exec/eval detectado'
                });
            }

            // Verificar logging de dados sensíveis
            if (content.includes('log') && (content.includes('secret') || content.includes('key'))) {
                this.errors.push({
                    file: filePath,
                    message: 'Possível logging de dados sensíveis'
                });
            }

        } catch (error) {
            this.errors.push({
                file: filePath,
                message: `Erro ao verificar Python: ${error.message}`
            });
        }
    }

    /**
     * Verifica arquivos Markdown
     */
    async checkMarkdown(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf8');

            // Verificar links quebrados básico
            const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
            let match;

            while ((match = linkRegex.exec(content)) !== null) {
                const linkText = match[1];
                const linkUrl = match[2];

                // Verificar links locais
                if (linkUrl.startsWith('./') || linkUrl.startsWith('../')) {
                    const linkPath = path.resolve(path.dirname(filePath), linkUrl);
                    if (!fs.existsSync(linkPath)) {
                        this.warnings.push({
                            file: filePath,
                            message: `Link quebrado: ${linkUrl}`
                        });
                    }
                }
            }

        } catch (error) {
            this.errors.push({
                file: filePath,
                message: `Erro ao verificar Markdown: ${error.message}`
            });
        }
    }

    /**
     * Verifica arquivos modificados recentemente
     */
    async checkModifiedFiles() {
        try {
            // Usar git para encontrar arquivos modificados
            const { execSync } = require('child_process');
            const modifiedFiles = execSync('git diff --name-only HEAD~1', { encoding: 'utf8' })
                .split('\n')
                .filter(f => f.trim())
                .map(f => path.join(this.workspaceRoot, f));

            for (const file of modifiedFiles) {
                if (fs.existsSync(file)) {
                    await this.checkFile(file);
                }
            }

        } catch (error) {
            // Fallback: verificar arquivos comuns se git falhar
            console.log('ℹ️ Git não disponível, usando verificação fallback');
            await this.checkCommonFiles();
        }
    }

    /**
     * Verifica arquivos comuns quando git não está disponível
     */
    async checkCommonFiles() {
        const commonPaths = [
            'apps/frontend-nextjs/src',
            'apps/backend',
            '.claude/hooks'
        ];

        for (const basePath of commonPaths) {
            const fullPath = path.join(this.workspaceRoot, basePath);
            if (fs.existsSync(fullPath)) {
                await this.walkDirectory(fullPath);
            }
        }
    }

    /**
     * Percorre diretório recursivamente
     */
    async walkDirectory(dir) {
        const files = fs.readdirSync(dir);

        for (const file of files) {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);

            if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
                await this.walkDirectory(filePath);
            } else if (stat.isFile()) {
                await this.checkFile(filePath);
            }
        }
    }

    /**
     * Reporta resultados das verificações
     */
    reportResults() {
        console.log('\n📊 Resultados da Verificação de Qualidade:');
        console.log(`✅ Arquivos verificados com sucesso`);

        if (this.warnings.length > 0) {
            console.log(`\n⚠️ ${this.warnings.length} aviso(s):`);
            this.warnings.forEach(warning => {
                console.log(`   ${path.relative(this.workspaceRoot, warning.file)}: ${warning.message}`);
            });
        }

        if (this.errors.length > 0) {
            console.log(`\n❌ ${this.errors.length} erro(s):`);
            this.errors.forEach(error => {
                console.log(`   ${path.relative(this.workspaceRoot, error.file)}: ${error.message}`);
            });
        } else {
            console.log('✅ Nenhum erro crítico encontrado');
        }
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    const filePath = process.argv[2];
    const checker = new VSCodeQualityCheck();

    checker.runQualityChecks(filePath)
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('❌ Falha na verificação:', error);
            process.exit(1);
        });
}

module.exports = VSCodeQualityCheck;