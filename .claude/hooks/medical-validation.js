#!/usr/bin/env node

/**
 * Medical Validation Hook
 * Hook especializado para validação de código médico-farmacológico
 *
 * Este hook verifica:
 * - Nomenclatura médica (CID, medicamentos)
 * - Unidades farmacológicas corretas
 * - Disclaimers médicos obrigatórios
 * - Padrões de segurança médica
 */

const fs = require('fs');
const path = require('path');

class MedicalValidationHook {
    constructor() {
        this.workspaceRoot = process.cwd();
        this.errors = [];
        this.warnings = [];
        this.violations = [];
    }

    /**
     * Executa validações médicas específicas
     */
    async runMedicalValidations(filePath = null) {
        try {
            console.log('🏥 Medical Validation Hook...');

            if (filePath && fs.existsSync(filePath)) {
                await this.validateFile(filePath);
            } else {
                await this.validateProject();
            }

            // Executar validações específicas
            await this.validateMedicalTerminology();
            await this.validatePharmacologicalUnits();
            await this.validateMedicalDisclaimers();
            await this.validateClinicalData();

            this.reportResults();
            return this.errors.length === 0 && this.violations.length === 0;

        } catch (error) {
            console.error('❌ Erro na validação médica:', error.message);
            return false;
        }
    }

    /**
     * Valida arquivo específico
     */
    async validateFile(filePath) {
        const ext = path.extname(filePath);
        const relativePath = path.relative(this.workspaceRoot, filePath);

        console.log(`🔍 Validando: ${relativePath}`);

        try {
            const content = fs.readFileSync(filePath, 'utf8');

            // Validações por tipo de arquivo
            switch (ext) {
                case '.ts':
                case '.tsx':
                case '.js':
                case '.jsx':
                    await this.validateJavaScriptMedical(filePath, content);
                    break;
                case '.py':
                    await this.validatePythonMedical(filePath, content);
                    break;
                case '.md':
                    await this.validateMarkdownMedical(filePath, content);
                    break;
                default:
                    console.log(`ℹ️ Tipo de arquivo não médico: ${ext}`);
            }

        } catch (error) {
            this.errors.push({
                file: relativePath,
                message: `Erro ao ler arquivo: ${error.message}`
            });
        }
    }

    /**
     * Valida código JavaScript/TypeScript médico
     */
    async validateJavaScriptMedical(filePath, content) {
        const relativePath = path.relative(this.workspaceRoot, filePath);

        // 1. Verificar nomenclatura médica
        await this.checkMedicalNomenclature(relativePath, content);

        // 2. Verificar cálculos farmacológicos
        await this.checkPharmacologicalCalculations(relativePath, content);

        // 3. Verificar disclaimers obrigatórios
        await this.checkMandatoryDisclaimers(relativePath, content);

        // 4. Verificar padrões de segurança
        await this.checkMedicalSecurityPatterns(relativePath, content);

        // 5. Verificar integração com personas
        await this.checkPersonaIntegration(relativePath, content);
    }

    /**
     * Valida código Python médico
     */
    async validatePythonMedical(filePath, content) {
        const relativePath = path.relative(this.workspaceRoot, filePath);

        // Verificações específicas para Python médico
        await this.checkMedicalNomenclature(relativePath, content);
        await this.checkPythonMedicalSecurity(relativePath, content);
        await this.checkMandatoryDisclaimers(relativePath, content);
    }

    /**
     * Valida documentação médica
     */
    async validateMarkdownMedical(filePath, content) {
        const relativePath = path.relative(this.workspaceRoot, filePath);

        // Verificar se contém informações médicas
        if (this.containsMedicalContent(content)) {
            await this.checkMedicalDocumentation(relativePath, content);
            await this.checkMandatoryDisclaimers(relativePath, content);
        }
    }

    /**
     * Verifica nomenclatura médica
     */
    async checkMedicalNomenclature(filePath, content) {
        // Dicionário de termos médicos corretos
        const medicalTerms = {
            // Hanseníase
            'hanseniase': ['hanseníase', 'lepra', 'mal de hansen'],
            'paucibacilar': ['paucibacilar', 'PB'],
            'multibacilar': ['multibacilar', 'MB'],
            'pqt': ['PQT', 'poliquimioterapia'],

            // Medicamentos
            'rifampicina': ['rifampicina', 'RMP'],
            'dapsona': ['dapsona', 'DDS'],
            'clofazimina': ['clofazimina', 'CFZ'],

            // Unidades
            'mg': ['mg', 'miligramas'],
            'ml': ['ml', 'mililitros'],
            'comprimido': ['comprimido', 'comp', 'cp']
        };

        // Verificar termos incorretos comuns
        const incorrectTerms = {
            'lepra': 'Prefira "hanseníase" ao invés de "lepra"',
            'leproso': 'Use "pessoa com hanseníase" ao invés de termos estigmatizantes',
            'hanseniase': 'Grafia correta: "hanseníase" (com acento)',
            'mg/kg/dia': 'Especifique melhor: "mg/kg/dia" pode ser ambíguo'
        };

        Object.entries(incorrectTerms).forEach(([term, suggestion]) => {
            const regex = new RegExp(`\\b${term}\\b`, 'gi');
            if (regex.test(content)) {
                this.warnings.push({
                    file: filePath,
                    message: `Nomenclatura médica: ${suggestion}`,
                    term: term
                });
            }
        });

        // Verificar CID codes (formato A00-Z99)
        const cidPattern = /[A-Z]\d{2}(\.\d)?/g;
        const cidMatches = content.match(cidPattern);
        if (cidMatches) {
            cidMatches.forEach(cid => {
                if (!this.isValidCID(cid)) {
                    this.warnings.push({
                        file: filePath,
                        message: `CID possivelmente inválido: ${cid}`,
                        term: cid
                    });
                }
            });
        }
    }

    /**
     * Verifica cálculos farmacológicos
     */
    async checkPharmacologicalCalculations(filePath, content) {
        // Verificar funções que fazem cálculos de dose
        const calculationPatterns = [
            /calculate.*dose/i,
            /dose.*calculation/i,
            /mg.*kg/i,
            /\bmg\/kg\b/i,
            /dosage.*function/i
        ];

        const hasCalculations = calculationPatterns.some(pattern => pattern.test(content));

        if (hasCalculations) {
            // Verificar se tem validação de entrada
            if (!content.match(/validate|sanitize|check.*input|isNaN|typeof.*number/i)) {
                this.violations.push({
                    file: filePath,
                    message: 'CRÍTICO: Cálculo farmacológico sem validação de entrada',
                    severity: 'critical'
                });
            }

            // Verificar se tem verificação de limites
            if (!content.match(/min.*dose|max.*dose|limit|range|between/i)) {
                this.warnings.push({
                    file: filePath,
                    message: 'Cálculo farmacológico pode precisar de verificação de limites'
                });
            }

            // Verificar se tem disclaimer para cálculos
            if (!content.match(/disclaimer|consultation|professional.*health|médico/i)) {
                this.violations.push({
                    file: filePath,
                    message: 'CRÍTICO: Cálculo farmacológico sem disclaimer médico',
                    severity: 'critical'
                });
            }
        }
    }

    /**
     * Verifica disclaimers obrigatórios
     */
    async checkMandatoryDisclaimers(filePath, content) {
        const medicalContentIndicators = [
            /dose|dosage|medication|drug/i,
            /hanseniase|hanseníase|lepra/i,
            /treatment|tratamento|medicamento/i,
            /clinical|clínico|diagnóstico/i
        ];

        const hasMedicalContent = medicalContentIndicators.some(pattern => pattern.test(content));

        if (hasMedicalContent) {
            const disclaimerPatterns = [
                /disclaimer/i,
                /consulte.*médico/i,
                /profissional.*saúde/i,
                /apenas.*educacional/i,
                /não.*substitui.*consulta/i
            ];

            const hasDisclaimer = disclaimerPatterns.some(pattern => pattern.test(content));

            if (!hasDisclaimer) {
                this.violations.push({
                    file: filePath,
                    message: 'OBRIGATÓRIO: Conteúdo médico deve ter disclaimer',
                    severity: 'critical'
                });
            }
        }
    }

    /**
     * Verifica padrões de segurança médica
     */
    async checkMedicalSecurityPatterns(filePath, content) {
        // Verificar logging de dados sensíveis
        const sensitivePatterns = [
            /console\.log.*patient/i,
            /console\.log.*dose/i,
            /console\.log.*medication/i,
            /log.*cpf|log.*rg|log.*patient_id/i
        ];

        sensitivePatterns.forEach(pattern => {
            if (pattern.test(content)) {
                this.violations.push({
                    file: filePath,
                    message: 'CRÍTICO: Possível logging de dados médicos sensíveis',
                    severity: 'critical'
                });
            }
        });

        // Verificar sanitização de inputs médicos
        if (content.match(/input.*medical|medical.*input|patient.*data/i)) {
            if (!content.match(/sanitize|clean|validate|escape/i)) {
                this.warnings.push({
                    file: filePath,
                    message: 'Input médico pode precisar de sanitização'
                });
            }
        }
    }

    /**
     * Verifica integração com personas
     */
    async checkPersonaIntegration(filePath, content) {
        const hasPersonas = content.match(/gasnelio|gá|persona/i);

        if (hasPersonas) {
            // Verificar se implementa corretamente as personas
            const hasPersonaLogic = content.match(/persona.*selector|switch.*persona|if.*persona/i);

            if (!hasPersonaLogic) {
                this.warnings.push({
                    file: filePath,
                    message: 'Referência a personas sem lógica de alternância'
                });
            }

            // Verificar consistência do tom
            if (content.includes('gasnelio') || content.includes('Gasnelio')) {
                if (!content.match(/técnico|científico|clinical|professional/i)) {
                    this.warnings.push({
                        file: filePath,
                        message: 'Persona Dr. Gasnelio deve usar tom técnico/científico'
                    });
                }
            }

            if (content.includes('gá') || content.includes('Gá')) {
                if (!content.match(/simples|didático|empático|friendly|caring/i)) {
                    this.warnings.push({
                        file: filePath,
                        message: 'Persona Gá deve usar tom empático/didático'
                    });
                }
            }
        }
    }

    /**
     * Verifica segurança específica do Python médico
     */
    async checkPythonMedicalSecurity(filePath, content) {
        // Verificar imports perigosos
        const dangerousImports = ['eval', 'exec', 'subprocess', 'os.system'];
        dangerousImports.forEach(imp => {
            if (content.includes(imp)) {
                this.warnings.push({
                    file: filePath,
                    message: `Import potencialmente perigoso: ${imp}`
                });
            }
        });

        // Verificar SQL injection em queries médicas
        if (content.match(/SELECT.*patient|INSERT.*medical|UPDATE.*dose/i)) {
            if (!content.match(/parameterized|prepared|placeholder|\?|\$\d/i)) {
                this.violations.push({
                    file: filePath,
                    message: 'CRÍTICO: Query médica pode estar vulnerável a SQL injection',
                    severity: 'critical'
                });
            }
        }
    }

    /**
     * Verifica se contém conteúdo médico
     */
    containsMedicalContent(content) {
        const medicalKeywords = [
            'hanseniase', 'hanseníase', 'lepra',
            'medicamento', 'medication', 'drug',
            'dose', 'dosage', 'treatment',
            'clinical', 'medical', 'patient',
            'rifampicina', 'dapsona', 'clofazimina'
        ];

        return medicalKeywords.some(keyword =>
            content.toLowerCase().includes(keyword.toLowerCase())
        );
    }

    /**
     * Verifica documentação médica
     */
    async checkMedicalDocumentation(filePath, content) {
        // Verificar estrutura de documentação médica
        const requiredSections = [
            'objetivo', 'description', 'usage',
            'disclaimer', 'references'
        ];

        requiredSections.forEach(section => {
            const sectionRegex = new RegExp(`#{1,3}\\s*${section}`, 'i');
            if (!sectionRegex.test(content)) {
                this.warnings.push({
                    file: filePath,
                    message: `Documentação médica pode precisar de seção: ${section}`
                });
            }
        });

        // Verificar referências médicas
        if (!content.match(/fonte:|reference:|bibliografia:|cfm|anvisa|ministério.*saúde/i)) {
            this.warnings.push({
                file: filePath,
                message: 'Documentação médica deve ter fontes/referências'
            });
        }
    }

    /**
     * Valida CID (básico)
     */
    isValidCID(cid) {
        // Validação básica do formato CID-10
        const cidPattern = /^[A-Z]\d{2}(\.\d)?$/;
        return cidPattern.test(cid);
    }

    /**
     * Validações específicas do projeto
     */
    async validateMedicalTerminology() {
        // Implementar validação de terminologia específica do projeto
    }

    async validatePharmacologicalUnits() {
        // Implementar validação de unidades farmacológicas
    }

    async validateMedicalDisclaimers() {
        // Implementar validação de disclaimers
    }

    async validateClinicalData() {
        // Implementar validação de dados clínicos
    }

    async validateProject() {
        console.log('📂 Validando projeto médico completo...');
        // Implementar validação do projeto completo
    }

    /**
     * Reporta resultados das validações
     */
    reportResults() {
        console.log('\n🏥 Resultados da Validação Médica:');

        if (this.violations.length > 0) {
            console.log(`\n🚨 VIOLAÇÕES CRÍTICAS (${this.violations.length}):`);
            this.violations.forEach(violation => {
                console.log(`   ${violation.file}: ${violation.message}`);
            });
        }

        if (this.errors.length > 0) {
            console.log(`\n❌ Erros (${this.errors.length}):`);
            this.errors.forEach(error => {
                console.log(`   ${error.file}: ${error.message}`);
            });
        }

        if (this.warnings.length > 0) {
            console.log(`\n⚠️ Avisos Médicos (${this.warnings.length}):`);
            this.warnings.forEach(warning => {
                console.log(`   ${warning.file}: ${warning.message}`);
            });
        }

        if (this.violations.length === 0 && this.errors.length === 0) {
            console.log('✅ Validação médica aprovada');
        }

        const totalIssues = this.violations.length + this.errors.length + this.warnings.length;
        console.log(`\n🎯 Score Médico: ${Math.max(0, 100 - totalIssues * 5)}/100`);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    let filePath = process.argv[2];
    if (filePath) {
        const resolved = path.resolve(filePath);
        if (!resolved.startsWith(process.cwd() + path.sep) && resolved !== process.cwd()) {
            console.error('Error: file path must be within the workspace');
            process.exit(1);
        }
        filePath = resolved;
    }
    const validator = new MedicalValidationHook();

    validator.runMedicalValidations(filePath)
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('❌ Falha na validação médica:', error);
            process.exit(1);
        });
}

module.exports = MedicalValidationHook;