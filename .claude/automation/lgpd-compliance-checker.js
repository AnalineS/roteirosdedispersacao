#!/usr/bin/env node

/**
 * LGPD Compliance Checker para Plataforma Educacional Médica
 * 
 * Sistema avançado de verificação de conformidade com a LGPD
 * Específico para dados médicos e educacionais sobre hanseníase
 * 
 * @version 2.0.0
 * @author Sistema de Automação Claude
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class LGPDComplianceChecker {
    constructor() {
        this.config = {
            // Níveis de sensibilidade de dados
            sensitivityLevels: {
                PUBLIC: 0,
                INTERNAL: 1,
                CONFIDENTIAL: 2,
                RESTRICTED: 3,
                MEDICAL: 4
            },
            
            // Padrões de dados sensíveis médicos
            medicalDataPatterns: {
                // Informações pessoais identificáveis
                cpf: /\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g,
                rg: /\b\d{1,2}\.?\d{3}\.?\d{3}-?[0-9xX]\b/g,
                cns: /\b\d{3}\s?\d{4}\s?\d{4}\s?\d{4}\b/g, // Cartão Nacional de Saúde
                
                // Dados médicos específicos
                crm: /\bCRM[-\s]?[A-Z]{2}[-\s]?\d{4,6}\b/gi,
                crf: /\bCRF[-\s]?[A-Z]{2}[-\s]?\d{4,6}\b/gi,
                
                // Dados de pacientes (para casos clínicos)
                patientNames: /\b(?:paciente|cliente|sr\.?|sra\.?|dr\.?|dra\.?)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/gi,
                medicalRecords: /\b(?:prontuário|registro médico)[\s:]*\d+\b/gi,
                
                // Informações de contato
                email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
                phone: /\b(?:\(?0?[1-9]{2}\)?[-.\s]?)?[1-9]\d{3,4}[-.\s]?\d{4}\b/g,
                
                // Dados específicos de hanseníase
                baciloscopia: /\bbaciloscopia[\s:]*[\d+\-\/]+\b/gi,
                classificacao: /\b(?:paucibacilar|multibacilar|pb|mb)[\s:]*[+-]?\b/gi,
                lesoes: /\b(?:mancha|nódulo|placa|infiltração)[\s\w]*\b/gi
            },
            
            // Campos que devem ter consentimento explícito
            consentRequiredFields: [
                'nome', 'email', 'telefone', 'cpf', 'endereco',
                'dados_medicos', 'historico_clinico', 'medicamentos',
                'analytics', 'cookies', 'marketing'
            ],
            
            // Padrões de URLs e rotas sensíveis
            sensitiveRoutes: [
                /\/api\/.*\/paciente/gi,
                /\/api\/.*\/historico/gi,
                /\/api\/.*\/prontuario/gi,
                /\/admin\/.*\/dados/gi,
                /\/relatorio\/.*\/individual/gi
            ]
        };
        
        this.violations = [];
        this.warnings = [];
        this.complianceScore = 100;
    }
    
    /**
     * Executa verificação completa de conformidade LGPD
     */
    async runComplianceCheck(projectPath = '.') {
        console.log('🔍 Iniciando verificação de conformidade LGPD...\n');
        
        try {
            // 1. Verificação de código-fonte
            await this.scanSourceCode(projectPath);
            
            // 2. Verificação de configurações
            await this.checkConfiguration(projectPath);
            
            // 3. Verificação de documentação
            await this.checkDocumentation(projectPath);
            
            // 4. Verificação de APIs
            await this.checkApiEndpoints(projectPath);
            
            // 5. Verificação de cookies e analytics
            await this.checkCookiesAndAnalytics(projectPath);
            
            // 6. Verificação de políticas de privacidade
            await this.checkPrivacyPolicies(projectPath);
            
            // Gera relatório final
            return this.generateComplianceReport();
            
        } catch (error) {
            this.addViolation('SYSTEM_ERROR', `Erro durante verificação: ${error.message}`, 'CRITICAL');
            return this.generateComplianceReport();
        }
    }
    
    /**
     * Escaneia código-fonte em busca de dados sensíveis
     */
    async scanSourceCode(projectPath) {
        console.log('📁 Escaneando código-fonte...');
        
        const sourceFiles = await this.findSourceFiles(projectPath);
        
        for (const file of sourceFiles) {
            try {
                const content = await fs.readFile(file, 'utf-8');
                await this.analyzeFileContent(file, content);
            } catch (error) {
                this.addWarning('FILE_READ_ERROR', `Erro ao ler arquivo ${file}: ${error.message}`);
            }
        }
    }
    
    /**
     * Encontra arquivos de código-fonte relevantes
     */
    async findSourceFiles(projectPath) {
        const extensions = ['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.yml', '.yaml'];
        const excludeDirs = ['node_modules', '.next', 'dist', 'build', '.git'];
        
        const files = [];
        
        async function scanDir(dir) {
            try {
                const entries = await fs.readdir(dir, { withFileTypes: true });
                
                for (const entry of entries) {
                    const fullPath = path.join(dir, entry.name);
                    
                    if (entry.isDirectory() && !excludeDirs.includes(entry.name)) {
                        await scanDir(fullPath);
                    } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
                        files.push(fullPath);
                    }
                }
            } catch (error) {
                // Ignore permission errors
            }
        }
        
        await scanDir(projectPath);
        return files;
    }
    
    /**
     * Analisa conteúdo de arquivo em busca de violações LGPD
     */
    async analyzeFileContent(filePath, content) {
        const relativePath = path.relative(process.cwd(), filePath);
        
        // Verifica dados pessoais identificáveis
        this.checkPIIData(relativePath, content);
        
        // Verifica dados médicos específicos
        this.checkMedicalData(relativePath, content);
        
        // Verifica consentimento para coleta de dados
        this.checkConsentMechanisms(relativePath, content);
        
        // Verifica logs e tracking
        this.checkLoggingAndTracking(relativePath, content);
        
        // Verifica APIs sensíveis
        this.checkSensitiveApis(relativePath, content);
        
        // Verifica cookies e localStorage
        this.checkDataStorage(relativePath, content);
    }
    
    /**
     * Verifica dados pessoais identificáveis
     */
    checkPIIData(filePath, content) {
        const { medicalDataPatterns } = this.config;
        
        // CPF
        const cpfMatches = content.match(medicalDataPatterns.cpf);
        if (cpfMatches) {
            this.addViolation(
                'PII_CPF_DETECTED',
                `CPF encontrado em ${filePath}: ${cpfMatches.length} ocorrência(s)`,
                'HIGH'
            );
        }
        
        // RG
        const rgMatches = content.match(medicalDataPatterns.rg);
        if (rgMatches) {
            this.addViolation(
                'PII_RG_DETECTED',
                `RG encontrado em ${filePath}: ${rgMatches.length} ocorrência(s)`,
                'HIGH'
            );
        }
        
        // CNS (Cartão Nacional de Saúde)
        const cnsMatches = content.match(medicalDataPatterns.cns);
        if (cnsMatches) {
            this.addViolation(
                'MEDICAL_CNS_DETECTED',
                `Cartão Nacional de Saúde encontrado em ${filePath}: ${cnsMatches.length} ocorrência(s)`,
                'CRITICAL'
            );
        }
        
        // Email
        const emailMatches = content.match(medicalDataPatterns.email);
        if (emailMatches && !this.isTestOrConfigFile(filePath)) {
            this.addWarning(
                'PII_EMAIL_DETECTED',
                `Email encontrado em ${filePath}: ${emailMatches.length} ocorrência(s) - Verificar se há consentimento`
            );
        }
        
        // Telefone
        const phoneMatches = content.match(medicalDataPatterns.phone);
        if (phoneMatches && !this.isTestOrConfigFile(filePath)) {
            this.addWarning(
                'PII_PHONE_DETECTED',
                `Telefone encontrado em ${filePath}: ${phoneMatches.length} ocorrência(s) - Verificar se há consentimento`
            );
        }
    }
    
    /**
     * Verifica dados médicos específicos
     */
    checkMedicalData(filePath, content) {
        const { medicalDataPatterns } = this.config;
        
        // CRM/CRF
        const crmMatches = content.match(medicalDataPatterns.crm);
        const crfMatches = content.match(medicalDataPatterns.crf);
        
        if (crmMatches || crfMatches) {
            this.addViolation(
                'MEDICAL_PROFESSIONAL_ID_DETECTED',
                `Identificação de profissional médico em ${filePath}`,
                'HIGH'
            );
        }
        
        // Nomes de pacientes
        const patientMatches = content.match(medicalDataPatterns.patientNames);
        if (patientMatches && !this.isTestOrExampleFile(filePath)) {
            this.addViolation(
                'PATIENT_NAME_DETECTED',
                `Possível nome de paciente em ${filePath}: ${patientMatches.length} ocorrência(s)`,
                'CRITICAL'
            );
        }
        
        // Registros médicos
        const recordMatches = content.match(medicalDataPatterns.medicalRecords);
        if (recordMatches) {
            this.addViolation(
                'MEDICAL_RECORD_DETECTED',
                `Registro médico encontrado em ${filePath}`,
                'CRITICAL'
            );
        }
        
        // Dados específicos de hanseníase
        const baciloscopiaMatches = content.match(medicalDataPatterns.baciloscopia);
        if (baciloscopiaMatches && !this.isTestOrExampleFile(filePath)) {
            this.addWarning(
                'CLINICAL_DATA_BACILOSCOPIA',
                `Dados de baciloscopia em ${filePath} - Verificar anonimização`
            );
        }
    }
    
    /**
     * Verifica mecanismos de consentimento
     */
    checkConsentMechanisms(filePath, content) {
        const hasConsentCheck = /consent|consentimento|aceito|concordo|autorizo/gi.test(content);
        const hasDataCollection = /collect|coleta|dados|informações|armazena/gi.test(content);
        
        if (hasDataCollection && !hasConsentCheck && !this.isConfigFile(filePath)) {
            this.addWarning(
                'MISSING_CONSENT_MECHANISM',
                `Possível coleta de dados sem mecanismo de consentimento em ${filePath}`
            );
        }
        
        // Verifica campos que requerem consentimento explícito
        const { consentRequiredFields } = this.config;
        for (const field of consentRequiredFields) {
            const fieldRegex = new RegExp(`['"\\w]*${field}['"\\w]*\\s*:`, 'gi');
            if (fieldRegex.test(content) && !hasConsentCheck) {
                this.addWarning(
                    'FIELD_REQUIRES_CONSENT',
                    `Campo '${field}' em ${filePath} pode requerer consentimento explícito`
                );
            }
        }
    }
    
    /**
     * Verifica logs e tracking
     */
    checkLoggingAndTracking(filePath, content) {
        // Logs com dados pessoais
        const logPatterns = [
            /console\.log.*(?:cpf|rg|email|phone|nome|paciente)/gi,
            /logger?\.(?:info|debug|error).*(?:cpf|rg|email|phone|nome|paciente)/gi,
            /log.*(?:user|usuario|paciente)/gi
        ];
        
        for (const pattern of logPatterns) {
            if (pattern.test(content)) {
                this.addViolation(
                    'SENSITIVE_DATA_LOGGING',
                    `Possível log de dados sensíveis em ${filePath}`,
                    'MEDIUM'
                );
                break;
            }
        }
        
        // Tracking de terceiros
        const trackingPatterns = [
            /gtag|ga\(/gi,
            /facebook.*pixel/gi,
            /analytics/gi
        ];
        
        for (const pattern of trackingPatterns) {
            if (pattern.test(content)) {
                this.addWarning(
                    'THIRD_PARTY_TRACKING',
                    `Tracking de terceiros detectado em ${filePath} - Verificar consentimento para cookies`
                );
                break;
            }
        }
    }
    
    /**
     * Verifica APIs sensíveis
     */
    checkSensitiveApis(filePath, content) {
        const { sensitiveRoutes } = this.config;
        
        for (const routePattern of sensitiveRoutes) {
            if (routePattern.test(content)) {
                this.addWarning(
                    'SENSITIVE_API_ROUTE',
                    `Rota sensível detectada em ${filePath} - Verificar autenticação e autorização`
                );
            }
        }
        
        // Verifica endpoints de dados pessoais
        const apiPatterns = [
            /\/api\/.*\/(?:user|usuario|paciente|cliente)/gi,
            /(?:get|post|put|delete).*(?:personal|pessoal|privado)/gi
        ];
        
        for (const pattern of apiPatterns) {
            if (pattern.test(content)) {
                this.addWarning(
                    'PERSONAL_DATA_API',
                    `API com dados pessoais em ${filePath} - Verificar proteções LGPD`
                );
                break;
            }
        }
    }
    
    /**
     * Verifica armazenamento de dados
     */
    checkDataStorage(filePath, content) {
        // localStorage com dados sensíveis
        const storagePatterns = [
            /localStorage\.setItem.*(?:cpf|rg|email|phone|token|auth)/gi,
            /sessionStorage\.setItem.*(?:cpf|rg|email|phone|token|auth)/gi,
            /document\.cookie.*(?:cpf|rg|email|phone|auth)/gi
        ];
        
        for (const pattern of storagePatterns) {
            if (pattern.test(content)) {
                this.addViolation(
                    'SENSITIVE_LOCAL_STORAGE',
                    `Armazenamento local de dados sensíveis em ${filePath}`,
                    'HIGH'
                );
                break;
            }
        }
        
        // Cookies sem configurações de segurança
        if (/document\.cookie/gi.test(content) && !/secure|samesite|httponly/gi.test(content)) {
            this.addWarning(
                'INSECURE_COOKIE',
                `Cookie sem configurações de segurança em ${filePath}`
            );
        }
    }
    
    /**
     * Verifica configurações do projeto
     */
    async checkConfiguration(projectPath) {
        console.log('⚙️ Verificando configurações...');
        
        // Verifica next.config.js
        const nextConfigPath = path.join(projectPath, 'apps/frontend-nextjs/next.config.js');
        try {
            const nextConfig = await fs.readFile(nextConfigPath, 'utf-8');
            this.checkNextJsConfig(nextConfig);
        } catch (error) {
            // Arquivo não existe
        }
        
        // Verifica package.json
        const packageJsonPath = path.join(projectPath, 'apps/frontend-nextjs/package.json');
        try {
            const packageJson = await fs.readFile(packageJsonPath, 'utf-8');
            this.checkDependencies(JSON.parse(packageJson));
        } catch (error) {
            this.addWarning('CONFIG_READ_ERROR', `Erro ao ler package.json: ${error.message}`);
        }
        
        // Verifica variáveis de ambiente
        await this.checkEnvironmentVariables(projectPath);
    }
    
    /**
     * Verifica configuração do Next.js
     */
    checkNextJsConfig(configContent) {
        // Verifica headers de segurança
        const hasSecurityHeaders = /headers|security/gi.test(configContent);
        if (!hasSecurityHeaders) {
            this.addWarning(
                'MISSING_SECURITY_HEADERS',
                'Configuração de headers de segurança não encontrada em next.config.js'
            );
        }
        
        // Verifica HTTPS redirect
        const hasHttpsRedirect = /redirect.*https/gi.test(configContent);
        if (!hasHttpsRedirect) {
            this.addWarning(
                'MISSING_HTTPS_REDIRECT',
                'Redirecionamento HTTPS não configurado'
            );
        }
    }
    
    /**
     * Verifica dependências
     */
    checkDependencies(packageJson) {
        const sensitivePackages = ['analytics', 'tracking', 'facebook-pixel'];
        const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
        
        for (const pkg of Object.keys(allDeps)) {
            for (const sensitive of sensitivePackages) {
                if (pkg.includes(sensitive)) {
                    this.addWarning(
                        'SENSITIVE_DEPENDENCY',
                        `Dependência sensível detectada: ${pkg} - Verificar conformidade LGPD`
                    );
                }
            }
        }
    }
    
    /**
     * Verifica variáveis de ambiente
     */
    async checkEnvironmentVariables(projectPath) {
        const envFiles = ['.env', '.env.local', '.env.production', '.env.development'];
        
        for (const envFile of envFiles) {
            try {
                const envPath = path.join(projectPath, 'apps/frontend-nextjs', envFile);
                const envContent = await fs.readFile(envPath, 'utf-8');
                
                // Verifica chaves de API de tracking
                const trackingKeys = [
                    /GOOGLE_ANALYTICS/gi,
                    /FACEBOOK.*PIXEL/gi,
                    /HOTJAR/gi,
                    /MIXPANEL/gi
                ];
                
                for (const pattern of trackingKeys) {
                    if (pattern.test(envContent)) {
                        this.addWarning(
                            'TRACKING_API_KEY',
                            `Chave de API de tracking encontrada em ${envFile} - Verificar consentimento para cookies`
                        );
                    }
                }
                
            } catch (error) {
                // Arquivo não existe
            }
        }
    }
    
    /**
     * Verifica documentação
     */
    async checkDocumentation(projectPath) {
        console.log('📋 Verificando documentação...');
        
        // Verifica política de privacidade
        const privacyFiles = ['privacy.md', 'privacidade.md', 'politica-privacidade.md'];
        let hasPrivacyPolicy = false;
        
        for (const file of privacyFiles) {
            try {
                await fs.access(path.join(projectPath, file));
                hasPrivacyPolicy = true;
                break;
            } catch (error) {
                // Arquivo não existe
            }
        }
        
        if (!hasPrivacyPolicy) {
            this.addViolation(
                'MISSING_PRIVACY_POLICY',
                'Política de privacidade não encontrada',
                'HIGH'
            );
        }
        
        // Verifica termos de uso
        const termsFiles = ['terms.md', 'termos.md', 'termos-uso.md'];
        let hasTermsOfUse = false;
        
        for (const file of termsFiles) {
            try {
                await fs.access(path.join(projectPath, file));
                hasTermsOfUse = true;
                break;
            } catch (error) {
                // Arquivo não existe
            }
        }
        
        if (!hasTermsOfUse) {
            this.addWarning(
                'MISSING_TERMS_OF_USE',
                'Termos de uso não encontrados'
            );
        }
    }
    
    /**
     * Verifica endpoints de API
     */
    async checkApiEndpoints(projectPath) {
        console.log('🔗 Verificando endpoints de API...');
        
        const apiDir = path.join(projectPath, 'apps/frontend-nextjs/src/pages/api');
        
        try {
            await fs.access(apiDir);
            const apiFiles = await this.findSourceFiles(apiDir);
            
            for (const file of apiFiles) {
                const content = await fs.readFile(file, 'utf-8');
                this.checkApiSecurity(file, content);
            }
        } catch (error) {
            // Diretório de API não existe
        }
    }
    
    /**
     * Verifica segurança de APIs
     */
    checkApiSecurity(filePath, content) {
        const relativePath = path.relative(process.cwd(), filePath);
        
        // Verifica autenticação
        const hasAuth = /auth|authentication|token|jwt|session/gi.test(content);
        const handlesPersonalData = /user|usuario|paciente|cliente|cpf|email/gi.test(content);
        
        if (handlesPersonalData && !hasAuth) {
            this.addViolation(
                'API_MISSING_AUTHENTICATION',
                `API manipula dados pessoais sem autenticação em ${relativePath}`,
                'HIGH'
            );
        }
        
        // Verifica validação de entrada
        const hasValidation = /validate|validation|schema|zod|joi/gi.test(content);
        if (!hasValidation && /req\.body|req\.query/gi.test(content)) {
            this.addWarning(
                'API_MISSING_VALIDATION',
                `API sem validação de entrada em ${relativePath}`
            );
        }
        
        // Verifica rate limiting
        const hasRateLimit = /rate.?limit|throttle/gi.test(content);
        if (!hasRateLimit) {
            this.addWarning(
                'API_MISSING_RATE_LIMIT',
                `API sem rate limiting em ${relativePath}`
            );
        }
        
        // Verifica logs de auditoria
        const hasAuditLog = /audit|log.*user|log.*action/gi.test(content);
        if (handlesPersonalData && !hasAuditLog) {
            this.addWarning(
                'API_MISSING_AUDIT_LOG',
                `API manipula dados pessoais sem log de auditoria em ${relativePath}`
            );
        }
    }
    
    /**
     * Verifica cookies e analytics
     */
    async checkCookiesAndAnalytics(projectPath) {
        console.log('🍪 Verificando cookies e analytics...');
        
        const sourceFiles = await this.findSourceFiles(projectPath);
        let hasCookieConsent = false;
        let hasAnalytics = false;
        
        for (const file of sourceFiles) {
            try {
                const content = await fs.readFile(file, 'utf-8');
                
                if (/cookie.*consent|consent.*cookie/gi.test(content)) {
                    hasCookieConsent = true;
                }
                
                if (/analytics|gtag|ga\(/gi.test(content)) {
                    hasAnalytics = true;
                }
            } catch (error) {
                // Ignore
            }
        }
        
        if (hasAnalytics && !hasCookieConsent) {
            this.addViolation(
                'ANALYTICS_WITHOUT_CONSENT',
                'Analytics detectado sem consentimento de cookies',
                'HIGH'
            );
        }
    }
    
    /**
     * Verifica políticas de privacidade
     */
    async checkPrivacyPolicies(projectPath) {
        console.log('🛡️ Verificando políticas de privacidade...');
        
        // Esta verificação já foi feita em checkDocumentation
        // Aqui podemos adicionar verificações mais específicas
    }
    
    /**
     * Adiciona violação à lista
     */
    addViolation(code, message, severity = 'MEDIUM') {
        this.violations.push({
            code,
            message,
            severity,
            timestamp: new Date().toISOString()
        });
        
        // Reduz score baseado na severidade
        const penalties = { LOW: 2, MEDIUM: 5, HIGH: 10, CRITICAL: 20 };
        this.complianceScore -= penalties[severity] || 5;
    }
    
    /**
     * Adiciona aviso à lista
     */
    addWarning(code, message) {
        this.warnings.push({
            code,
            message,
            timestamp: new Date().toISOString()
        });
        
        // Reduz score levemente para avisos
        this.complianceScore -= 1;
    }
    
    /**
     * Verifica se é arquivo de teste
     */
    isTestOrExampleFile(filePath) {
        return /test|spec|example|sample|mock|fixture/gi.test(filePath);
    }
    
    /**
     * Verifica se é arquivo de configuração
     */
    isConfigFile(filePath) {
        return /config|env|setting/gi.test(filePath);
    }
    
    /**
     * Verifica se é arquivo de teste ou configuração
     */
    isTestOrConfigFile(filePath) {
        return this.isTestOrExampleFile(filePath) || this.isConfigFile(filePath);
    }
    
    /**
     * Gera relatório de conformidade
     */
    generateComplianceReport() {
        const score = Math.max(0, this.complianceScore);
        const status = score >= 95 ? 'COMPLIANT' : score >= 80 ? 'PARTIAL' : 'NON_COMPLIANT';
        
        const report = {
            timestamp: new Date().toISOString(),
            version: '2.0.0',
            compliance: {
                score,
                status,
                level: score >= 95 ? 'HIGH' : score >= 80 ? 'MEDIUM' : 'LOW'
            },
            summary: {
                totalViolations: this.violations.length,
                totalWarnings: this.warnings.length,
                criticalViolations: this.violations.filter(v => v.severity === 'CRITICAL').length,
                highViolations: this.violations.filter(v => v.severity === 'HIGH').length,
                mediumViolations: this.violations.filter(v => v.severity === 'MEDIUM').length,
                lowViolations: this.violations.filter(v => v.severity === 'LOW').length
            },
            violations: this.violations,
            warnings: this.warnings,
            recommendations: this.generateRecommendations(),
            nextSteps: this.generateNextSteps()
        };
        
        return report;
    }
    
    /**
     * Gera recomendações baseadas nas violações
     */
    generateRecommendations() {
        const recommendations = [];
        
        if (this.violations.some(v => v.code === 'MISSING_PRIVACY_POLICY')) {
            recommendations.push({
                priority: 'HIGH',
                action: 'Criar política de privacidade',
                description: 'Elaborar política de privacidade específica para plataforma médica educacional, incluindo tratamento de dados sobre hanseníase'
            });
        }
        
        if (this.violations.some(v => v.code.includes('PII'))) {
            recommendations.push({
                priority: 'CRITICAL',
                action: 'Remover ou anonimizar dados pessoais',
                description: 'Identificar e remover/anonimizar todos os dados pessoais encontrados no código-fonte'
            });
        }
        
        if (this.violations.some(v => v.code.includes('MEDICAL'))) {
            recommendations.push({
                priority: 'CRITICAL',
                action: 'Proteger dados médicos',
                description: 'Implementar proteções especiais para dados médicos e de saúde (PHI/PII médicos)'
            });
        }
        
        if (this.violations.some(v => v.code === 'ANALYTICS_WITHOUT_CONSENT')) {
            recommendations.push({
                priority: 'HIGH',
                action: 'Implementar consentimento de cookies',
                description: 'Adicionar banner de consentimento de cookies antes de carregar analytics'
            });
        }
        
        if (this.violations.some(v => v.code.includes('API'))) {
            recommendations.push({
                priority: 'HIGH',
                action: 'Reforçar segurança de APIs',
                description: 'Implementar autenticação, validação e logs de auditoria em APIs que manipulam dados pessoais'
            });
        }
        
        return recommendations;
    }
    
    /**
     * Gera próximos passos
     */
    generateNextSteps() {
        const steps = [];
        
        if (this.complianceScore < 95) {
            steps.push('1. Corrigir todas as violações críticas e de alta prioridade');
            steps.push('2. Implementar mecanismos de consentimento explícito');
            steps.push('3. Criar documentação de privacidade completa');
            steps.push('4. Implementar logs de auditoria para dados médicos');
            steps.push('5. Configurar proteções adicionais para dados de hanseníase');
            steps.push('6. Realizar nova verificação de conformidade');
        } else {
            steps.push('1. Manter monitoramento contínuo de conformidade');
            steps.push('2. Revisar políticas periodicamente');
            steps.push('3. Treinar equipe sobre LGPD e dados médicos');
        }
        
        return steps;
    }
}

// Execução principal
if (require.main === module) {
    const checker = new LGPDComplianceChecker();
    
    checker.runComplianceCheck()
        .then(report => {
            console.log('\\n📊 Relatório de Conformidade LGPD');
            console.log('=====================================\\n');
            console.log(`📈 Score de Conformidade: ${report.compliance.score}%`);
            console.log(`📋 Status: ${report.compliance.status}`);
            console.log(`⚠️  Violações: ${report.summary.totalViolations}`);
            console.log(`🔔 Avisos: ${report.summary.totalWarnings}\\n`);
            
            if (report.violations.length > 0) {
                console.log('🚨 VIOLAÇÕES CRÍTICAS:');
                report.violations
                    .filter(v => v.severity === 'CRITICAL')
                    .forEach(v => console.log(`   - ${v.message}`));
                console.log();
            }
            
            if (report.recommendations.length > 0) {
                console.log('💡 RECOMENDAÇÕES:');
                report.recommendations.forEach((rec, i) => {
                    console.log(`   ${i + 1}. [${rec.priority}] ${rec.action}`);
                    console.log(`      ${rec.description}`);
                });
                console.log();
            }
            
            // Salva relatório em arquivo
            const reportPath = `./reports/lgpd-compliance-${Date.now()}.json`;
            require('fs').writeFileSync(reportPath, JSON.stringify(report, null, 2));
            console.log(`📄 Relatório salvo em: ${reportPath}\\n`);
            
            // Exit code baseado no score
            process.exit(report.compliance.score >= 95 ? 0 : 1);
        })
        .catch(error => {
            console.error('❌ Erro durante verificação:', error.message);
            process.exit(1);
        });
}

module.exports = { LGPDComplianceChecker };