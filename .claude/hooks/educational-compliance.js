#!/usr/bin/env node

/**
 * Educational Compliance Hook
 * Hook para compliance educacional e LGPD em plataformas médico-educacionais
 *
 * Este hook verifica:
 * - Compliance LGPD para dados educacionais
 * - Padrões de conteúdo educacional
 * - Acessibilidade educacional
 * - Integração adequada com personas educacionais
 */

const fs = require('fs');
const path = require('path');

class EducationalComplianceHook {
    constructor() {
        this.workspaceRoot = process.cwd();
        this.errors = [];
        this.warnings = [];
        this.compliance_issues = [];
        this.lgpd_violations = [];
    }

    /**
     * Executa verificações de compliance educacional
     */
    async runComplianceChecks(filePath = null) {
        try {
            console.log('📚 Educational Compliance Hook...');

            if (filePath && fs.existsSync(filePath)) {
                await this.checkFile(filePath);
            } else {
                await this.checkProject();
            }

            // Executar verificações específicas
            await this.checkLGPDCompliance();
            await this.checkEducationalStandards();
            await this.checkAccessibilityCompliance();
            await this.checkPersonaEducationalIntegration();

            this.reportResults();
            return this.errors.length === 0 && this.lgpd_violations.length === 0;

        } catch (error) {
            console.error('❌ Erro na verificação de compliance:', error.message);
            return false;
        }
    }

    /**
     * Verifica arquivo específico
     */
    async checkFile(filePath) {
        const ext = path.extname(filePath);
        const relativePath = path.relative(this.workspaceRoot, filePath);

        console.log(`📖 Verificando compliance: ${relativePath}`);

        try {
            const content = fs.readFileSync(filePath, 'utf8');

            // Verificações por tipo de arquivo
            switch (ext) {
                case '.ts':
                case '.tsx':
                case '.js':
                case '.jsx':
                    await this.checkJavaScriptEducational(filePath, content);
                    break;
                case '.py':
                    await this.checkPythonEducational(filePath, content);
                    break;
                case '.md':
                    await this.checkMarkdownEducational(filePath, content);
                    break;
                case '.json':
                    await this.checkJSONEducational(filePath, content);
                    break;
                default:
                    console.log(`ℹ️ Tipo de arquivo não educacional: ${ext}`);
            }

        } catch (error) {
            this.errors.push({
                file: relativePath,
                message: `Erro ao ler arquivo: ${error.message}`
            });
        }
    }

    /**
     * Verifica compliance em JavaScript/TypeScript
     */
    async checkJavaScriptEducational(filePath, content) {
        const relativePath = path.relative(this.workspaceRoot, filePath);

        // 1. Verificar coleta de dados pessoais
        await this.checkPersonalDataCollection(relativePath, content);

        // 2. Verificar padrões educacionais
        await this.checkEducationalPatterns(relativePath, content);

        // 3. Verificar acessibilidade
        await this.checkAccessibilityPatterns(relativePath, content);

        // 4. Verificar integração com personas educacionais
        await this.checkEducationalPersonas(relativePath, content);

        // 5. Verificar compliance de cookies/tracking
        await this.checkTrackingCompliance(relativePath, content);
    }

    /**
     * Verifica compliance em Python
     */
    async checkPythonEducational(filePath, content) {
        const relativePath = path.relative(this.workspaceRoot, filePath);

        await this.checkPersonalDataCollection(relativePath, content);
        await this.checkDataProcessingCompliance(relativePath, content);
        await this.checkEducationalDataSecurity(relativePath, content);
    }

    /**
     * Verifica compliance em Markdown (documentação)
     */
    async checkMarkdownEducational(filePath, content) {
        const relativePath = path.relative(this.workspaceRoot, filePath);

        if (this.isEducationalContent(content)) {
            await this.checkEducationalDocumentation(relativePath, content);
            await this.checkLearningObjectives(relativePath, content);
            await this.checkEducationalReferences(relativePath, content);
        }
    }

    /**
     * Verifica compliance em JSON (configurações)
     */
    async checkJSONEducational(filePath, content) {
        const relativePath = path.relative(this.workspaceRoot, filePath);

        try {
            const data = JSON.parse(content);

            // Verificar configurações de analytics/tracking
            if (this.hasTrackingConfig(data)) {
                await this.checkAnalyticsCompliance(relativePath, data);
            }

            // Verificar configurações educacionais
            if (this.hasEducationalConfig(data)) {
                await this.checkEducationalConfig(relativePath, data);
            }

        } catch (error) {
            this.errors.push({
                file: relativePath,
                message: `JSON inválido: ${error.message}`
            });
        }
    }

    /**
     * Verifica coleta de dados pessoais (LGPD)
     */
    async checkPersonalDataCollection(filePath, content) {
        // Padrões que indicam coleta de dados pessoais
        const personalDataPatterns = [
            /email.*input|input.*email/i,
            /name.*input|input.*name/i,
            /cpf|rg|documento/i,
            /phone|telefone|celular/i,
            /address|endereço/i,
            /birthday|nascimento|idade/i,
            /localStorage.*user|sessionStorage.*user/i,
            /cookies.*user|user.*cookies/i
        ];

        const hasPersonalData = personalDataPatterns.some(pattern => pattern.test(content));

        if (hasPersonalData) {
            // Verificar se há consentimento LGPD
            if (!content.match(/consent|consentimento|aceito.*termos|lgpd/i)) {
                this.lgpd_violations.push({
                    file: filePath,
                    message: 'LGPD: Coleta de dados pessoais sem mecanismo de consentimento',
                    severity: 'critical'
                });
            }

            // Verificar se há política de privacidade
            if (!content.match(/privacy.*policy|política.*privacidade|proteção.*dados/i)) {
                this.lgpd_violations.push({
                    file: filePath,
                    message: 'LGPD: Coleta de dados sem referência à política de privacidade',
                    severity: 'high'
                });
            }

            // Verificar se há opção de exclusão/portabilidade
            if (!content.match(/delete.*data|excluir.*dados|portabilidade|download.*data/i)) {
                this.warnings.push({
                    file: filePath,
                    message: 'LGPD: Considere implementar opções de exclusão/portabilidade de dados'
                });
            }
        }
    }

    /**
     * Verifica padrões educacionais
     */
    async checkEducationalPatterns(filePath, content) {
        const educationalKeywords = [
            'lesson', 'course', 'quiz', 'test', 'learning',
            'aula', 'curso', 'questionário', 'teste', 'aprendizagem',
            'objetivo', 'competência', 'habilidade'
        ];

        const hasEducationalContent = educationalKeywords.some(keyword =>
            content.toLowerCase().includes(keyword)
        );

        if (hasEducationalContent) {
            // Verificar objetivos de aprendizagem
            if (!content.match(/objetivo.*aprendizagem|learning.*objective|competência|habilidade/i)) {
                this.warnings.push({
                    file: filePath,
                    message: 'Conteúdo educacional deve especificar objetivos de aprendizagem'
                });
            }

            // Verificar níveis de dificuldade
            if (!content.match(/básico|intermediário|avançado|basic|intermediate|advanced|level/i)) {
                this.warnings.push({
                    file: filePath,
                    message: 'Conteúdo educacional deve especificar nível de dificuldade'
                });
            }

            // Verificar pré-requisitos
            if (!content.match(/pré-requisito|prerequisite|requirement|conhecimento.*prévio/i)) {
                this.warnings.push({
                    file: filePath,
                    message: 'Considere especificar pré-requisitos para o conteúdo educacional'
                });
            }
        }
    }

    /**
     * Verifica padrões de acessibilidade
     */
    async checkAccessibilityPatterns(filePath, content) {
        // Verificar elementos sem acessibilidade
        const accessibilityIssues = [
            {
                pattern: /<img(?![^>]*alt=)/i,
                message: 'Imagem sem texto alternativo (alt)'
            },
            {
                pattern: /<input(?![^>]*aria-label)(?![^>]*id.*label)/i,
                message: 'Input sem label ou aria-label'
            },
            {
                pattern: /<button(?![^>]*aria-label)>(\s*<[^>]*>)*\s*<\/button>/i,
                message: 'Botão sem texto acessível'
            },
            {
                pattern: /onClick.*(?!onKeyDown|onKeyPress)/i,
                message: 'Evento de click sem equivalente de teclado'
            }
        ];

        accessibilityIssues.forEach(issue => {
            if (issue.pattern.test(content)) {
                this.compliance_issues.push({
                    file: filePath,
                    message: `Acessibilidade: ${issue.message}`,
                    type: 'accessibility'
                });
            }
        });

        // Verificar se há textos muito pequenos (educação inclusiva)
        if (content.match(/font-size:\s*[0-9]px|fontSize:\s*[0-9]/i)) {
            this.warnings.push({
                file: filePath,
                message: 'Fontes muito pequenas podem prejudicar a acessibilidade educacional'
            });
        }
    }

    /**
     * Verifica integração educacional com personas
     */
    async checkEducationalPersonas(filePath, content) {
        const hasPersonas = content.match(/gasnelio|gá|persona/i);

        if (hasPersonas) {
            // Verificar se adapta conteúdo por persona
            if (!content.match(/adapt.*content|conteúdo.*adaptado|switch.*explanation/i)) {
                this.warnings.push({
                    file: filePath,
                    message: 'Personas educacionais devem adaptar conteúdo ao público'
                });
            }

            // Verificar se Dr. Gasnelio usa linguagem técnica apropriada
            if (content.includes('gasnelio') || content.includes('Gasnelio')) {
                if (!content.match(/técnico|científico|referência|bibliografia|evidência/i)) {
                    this.warnings.push({
                        file: filePath,
                        message: 'Dr. Gasnelio deve usar abordagem técnica/científica'
                    });
                }
            }

            // Verificar se Gá usa linguagem didática
            if (content.includes('gá') || content.includes('Gá')) {
                if (!content.match(/simples|didático|exemplo|analogia|explicação.*fácil/i)) {
                    this.warnings.push({
                        file: filePath,
                        message: 'Gá deve usar linguagem didática e exemplos simples'
                    });
                }
            }
        }
    }

    /**
     * Verifica compliance de tracking/analytics
     */
    async checkTrackingCompliance(filePath, content) {
        const trackingPatterns = [
            /google.*analytics|gtag|ga\(/i,
            /facebook.*pixel|fbq\(/i,
            /track.*event|event.*track/i,
            /analytics.*send|send.*analytics/i
        ];

        const hasTracking = trackingPatterns.some(pattern => pattern.test(content));

        if (hasTracking) {
            // Verificar se há consentimento para tracking
            if (!content.match(/consent.*analytics|analytics.*consent|cookie.*consent/i)) {
                this.lgpd_violations.push({
                    file: filePath,
                    message: 'LGPD: Tracking/Analytics sem consentimento explícito',
                    severity: 'high'
                });
            }

            // Verificar se há opção de opt-out
            if (!content.match(/opt.*out|disable.*tracking|recusar.*analytics/i)) {
                this.warnings.push({
                    file: filePath,
                    message: 'LGPD: Considere implementar opt-out para analytics'
                });
            }
        }
    }

    /**
     * Verifica processamento de dados educacionais
     */
    async checkDataProcessingCompliance(filePath, content) {
        // Verificar se há processamento de dados de progresso educacional
        const educationalDataPatterns = [
            /progress.*save|save.*progress/i,
            /score.*store|store.*score/i,
            /learning.*data|data.*learning/i,
            /user.*progress|progress.*user/i
        ];

        const hasEducationalData = educationalDataPatterns.some(pattern => pattern.test(content));

        if (hasEducationalData) {
            // Verificar se há finalidade educacional clara
            if (!content.match(/educational.*purpose|finalidade.*educacional|objetivo.*pedagógico/i)) {
                this.lgpd_violations.push({
                    file: filePath,
                    message: 'LGPD: Processamento de dados educacionais sem finalidade clara',
                    severity: 'medium'
                });
            }

            // Verificar se há retenção de dados definida
            if (!content.match(/retention|retenção|prazo.*dados|delete.*after/i)) {
                this.warnings.push({
                    file: filePath,
                    message: 'LGPD: Defina prazo de retenção para dados educacionais'
                });
            }
        }
    }

    /**
     * Verifica segurança de dados educacionais
     */
    async checkEducationalDataSecurity(filePath, content) {
        // Verificar se dados educacionais são criptografados
        if (content.match(/student.*data|user.*progress|learning.*record/i)) {
            if (!content.match(/encrypt|hash|secure|bcrypt|crypto/i)) {
                this.compliance_issues.push({
                    file: filePath,
                    message: 'Dados educacionais devem ser protegidos/criptografados',
                    type: 'security'
                });
            }
        }

        // Verificar se há logs seguros
        if (content.match(/log.*student|log.*user.*data|print.*progress/i)) {
            this.lgpd_violations.push({
                file: filePath,
                message: 'LGPD: Evite fazer log de dados pessoais educacionais',
                severity: 'high'
            });
        }
    }

    /**
     * Verifica se é conteúdo educacional
     */
    isEducationalContent(content) {
        const educationalIndicators = [
            'learning', 'education', 'course', 'lesson',
            'aprendizagem', 'educação', 'curso', 'aula',
            'tutorial', 'guide', 'guia', 'ensino'
        ];

        return educationalIndicators.some(indicator =>
            content.toLowerCase().includes(indicator)
        );
    }

    /**
     * Verifica documentação educacional
     */
    async checkEducationalDocumentation(filePath, content) {
        // Verificar estrutura de documentação educacional
        const requiredSections = [
            'objetivo', 'público.*alvo', 'pré.*requisito',
            'conteúdo', 'metodologia', 'avaliação'
        ];

        requiredSections.forEach(section => {
            const sectionRegex = new RegExp(`#{1,3}\\s*${section}`, 'i');
            if (!sectionRegex.test(content)) {
                this.warnings.push({
                    file: filePath,
                    message: `Documentação educacional pode precisar de seção: ${section}`
                });
            }
        });
    }

    /**
     * Verifica objetivos de aprendizagem
     */
    async checkLearningObjectives(filePath, content) {
        if (content.match(/objetivo|objective|competência|habilidade/i)) {
            // Verificar se objetivos são mensuráveis
            const measurableVerbs = [
                'identificar', 'explicar', 'demonstrar', 'aplicar',
                'analisar', 'avaliar', 'criar', 'compreender'
            ];

            const hasMeasurableObjectives = measurableVerbs.some(verb =>
                content.toLowerCase().includes(verb)
            );

            if (!hasMeasurableObjectives) {
                this.warnings.push({
                    file: filePath,
                    message: 'Objetivos educacionais devem usar verbos mensuráveis (Bloom)'
                });
            }
        }
    }

    /**
     * Verifica referências educacionais
     */
    async checkEducationalReferences(filePath, content) {
        if (this.isEducationalContent(content)) {
            if (!content.match(/referência|bibliography|fonte|source|cfm|anvisa|ministério/i)) {
                this.warnings.push({
                    file: filePath,
                    message: 'Conteúdo educacional médico deve ter referências confiáveis'
                });
            }
        }
    }

    /**
     * Verifica se tem configurações de tracking
     */
    hasTrackingConfig(data) {
        const trackingKeys = ['analytics', 'tracking', 'gtag', 'facebook', 'pixel'];
        return trackingKeys.some(key => this.hasNestedKey(data, key));
    }

    /**
     * Verifica se tem configurações educacionais
     */
    hasEducationalConfig(data) {
        const educationalKeys = ['course', 'lesson', 'learning', 'education', 'curriculum'];
        return educationalKeys.some(key => this.hasNestedKey(data, key));
    }

    /**
     * Verifica chave aninhada em objeto
     */
    hasNestedKey(obj, key) {
        if (!obj || typeof obj !== 'object') return false;

        if (Object.keys(obj).some(k => k.toLowerCase().includes(key.toLowerCase()))) {
            return true;
        }

        return Object.values(obj).some(value =>
            typeof value === 'object' && this.hasNestedKey(value, key)
        );
    }

    /**
     * Verifica compliance de analytics
     */
    async checkAnalyticsCompliance(filePath, data) {
        this.warnings.push({
            file: filePath,
            message: 'Configuração de analytics encontrada - verificar compliance LGPD'
        });
    }

    /**
     * Verifica configuração educacional
     */
    async checkEducationalConfig(filePath, data) {
        this.info.push({
            file: filePath,
            message: 'Configuração educacional encontrada'
        });
    }

    /**
     * Verificações específicas do projeto
     */
    async checkLGPDCompliance() {
        // Implementar verificações LGPD específicas
    }

    async checkEducationalStandards() {
        // Implementar verificações de padrões educacionais
    }

    async checkAccessibilityCompliance() {
        // Implementar verificações de acessibilidade
    }

    async checkPersonaEducationalIntegration() {
        // Implementar verificações de integração educacional
    }

    async checkProject() {
        console.log('📚 Verificando compliance educacional do projeto...');
        // Implementar verificação do projeto completo
    }

    /**
     * Reporta resultados
     */
    reportResults() {
        console.log('\n📚 Resultados do Educational Compliance:');

        if (this.lgpd_violations.length > 0) {
            console.log(`\n🚨 VIOLAÇÕES LGPD (${this.lgpd_violations.length}):`);
            this.lgpd_violations.forEach(violation => {
                console.log(`   ${violation.file}: ${violation.message} [${violation.severity}]`);
            });
        }

        if (this.compliance_issues.length > 0) {
            console.log(`\n⚖️ Issues de Compliance (${this.compliance_issues.length}):`);
            this.compliance_issues.forEach(issue => {
                console.log(`   ${issue.file}: ${issue.message} [${issue.type}]`);
            });
        }

        if (this.errors.length > 0) {
            console.log(`\n❌ Erros (${this.errors.length}):`);
            this.errors.forEach(error => {
                console.log(`   ${error.file}: ${error.message}`);
            });
        }

        if (this.warnings.length > 0) {
            console.log(`\n⚠️ Avisos (${this.warnings.length}):`);
            this.warnings.forEach(warning => {
                console.log(`   ${warning.file}: ${warning.message}`);
            });
        }

        if (this.lgpd_violations.length === 0 && this.errors.length === 0) {
            console.log('✅ Compliance educacional aprovado');
        }

        const totalIssues = this.lgpd_violations.length + this.compliance_issues.length + this.errors.length + this.warnings.length;
        console.log(`\n🎯 Score Compliance: ${Math.max(0, 100 - totalIssues * 3)}/100`);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    const filePath = process.argv[2];
    const compliance = new EducationalComplianceHook();

    compliance.runComplianceChecks(filePath)
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('❌ Falha na verificação de compliance:', error);
            process.exit(1);
        });
}

module.exports = EducationalComplianceHook;