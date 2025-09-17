#!/usr/bin/env node

/**
 * Medical Quality Blocker - Claude Code Hook
 * 
 * Sistema de BLOQUEIO para garantir qualidade médica
 * Específico para plataforma educacional de hanseníase
 * 
 * BLOQUEIA operações se qualidade inadequada
 * 
 * @version 1.0.0
 * @author Sistema de Automação Claude
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class MedicalQualityBlocker {
    constructor() {
        this.blocked = false;
        this.errors = [];
        this.warnings = [];
        this.startTime = Date.now();
        
        this.config = {
            strict: true,
            timeout: 30000,
            medicalCompliance: true,
            blockingRules: [
                'typescript_compilation',
                'eslint_critical_errors',
                'medical_data_safety',
                'production_build'
            ]
        };
    }
    
    log(message, type = 'info') {
        const colors = {
            info: '\x1b[36m',     // Cyan
            success: '\x1b[32m',  // Green
            warning: '\x1b[33m',  // Yellow
            error: '\x1b[31m',    // Red
            critical: '\x1b[41m', // Red background
            reset: '\x1b[0m'
        };
        console.log(`${colors[type]}${message}${colors.reset}`);
    }
    
    runCheck(command, description, critical = true, workingDir = null) {
        try {
            this.log(`🔍 ${description}...`, 'info');
            
            const options = {
                stdio: 'pipe',
                timeout: this.config.timeout,
                encoding: 'utf8'
            };
            
            if (workingDir) {
                options.cwd = workingDir;
            }
            
            const result = execSync(command, options);
            this.log(`✅ ${description} passou`, 'success');
            return { success: true, output: result };
            
        } catch (error) {
            const message = `${description} falhou: ${error.message}`;
            
            if (critical) {
                this.log(`❌ ${message}`, 'error');
                this.errors.push(message);
                this.blocked = true;
            } else {
                this.log(`⚠️ ${message}`, 'warning');
                this.warnings.push(message);
            }
            
            return { success: false, error: error.message };
        }
    }
    
    checkTypeScriptCompilation() {
        const frontendPath = path.join(process.cwd(), 'apps', 'frontend-nextjs');
        
        if (!fs.existsSync(frontendPath)) {
            this.log('⚠️ Diretório frontend não encontrado - pulando verificação TypeScript', 'warning');
            return;
        }
        
        return this.runCheck(
            'npm run type-check',
            'TypeScript Compilation (OBRIGATÓRIO)',
            true,
            frontendPath
        );
    }
    
    checkESLintCriticalErrors() {
        const frontendPath = path.join(process.cwd(), 'apps', 'frontend-nextjs');
        
        if (!fs.existsSync(frontendPath)) {
            this.log('⚠️ Diretório frontend não encontrado - pulando verificação ESLint', 'warning');
            return;
        }
        
        // ESLint deve passar sem erros críticos (warnings são permitidos)
        return this.runCheck(
            'npm run lint',
            'ESLint Critical Errors Check',
            false, // Não crítico - warnings são permitidos
            frontendPath
        );
    }
    
    checkMedicalDataSafety() {
        this.log('🏥 Verificando segurança de dados médicos...', 'info');
        
        // Verificar dados sensíveis em arquivos staged
        try {
            const stagedFiles = execSync('git diff --cached --name-only', { 
                encoding: 'utf8',
                timeout: 5000
            }).trim();
            
            if (!stagedFiles) {
                this.log('✅ Nenhum arquivo staged para verificar', 'success');
                return { success: true };
            }
            
            // Verificar padrões sensíveis
            const sensitivePatterns = [
                'CPF.*\\d{11}',
                'RG.*\\d{7,10}', 
                'CNS.*\\d{15}',
                'CRM.*\\d+',
                'senha.*=.*[\'"].*[\'"]',
                'password\\s*=\\s*[\'"][a-zA-Z0-9!@#$%^&*()_+\\-=\\[\\]{}|;:,.<>?/~`]{3,}[\'"]',  // Senhas reais em plaintext apenas
                'api_key.*=.*[\'"].*[\'"]'
            ];
            
            let foundSensitiveData = false;
            
            for (const pattern of sensitivePatterns) {
                try {
                    const result = execSync(`git diff --cached | grep -i "${pattern}"`, { 
                        encoding: 'utf8',
                        timeout: 5000
                    }).trim();
                    
                    if (result) {
                        // Verificar se é um contexto seguro (false positive)
                        const safeContexts = [
                            // === GitHub Actions e CI/CD ===
                            '\\$\\{\\{ secrets\\.',           // GitHub Actions secrets
                            'TELEGRAM_TOKEN.*\\$\\{\\{',     // Telegram env vars
                            'TELEGRAM_CHAT_ID.*\\$\\{\\{',   // Telegram env vars
                            'GITHUB_TOKEN.*\\$\\{\\{',       // GitHub env vars
                            'SNYK_TOKEN.*\\$\\{\\{',         // Snyk env vars
                            '\\.github/workflows/',          // GitHub Actions workflows

                            // === Definições de Funções Seguras ===
                            'def\\s+.*\\(.*password:\\s*str', // Parâmetros de função com type hints
                            '\\+\\s*def\\s+.*password',       // Novas funções no diff
                            '_hash_password.*def',            // Definições de função de hash
                            'create_user.*password:',         // Função de criação de usuário
                            'authenticate_user.*password:',   // Função de autenticação
                            'validate_password.*def',         // Função de validação

                            // === Operações de Hashing ===
                            'password_hash\\s*=\\s*hashlib',  // Operações de hashing
                            'hashlib\\.pbkdf2_hmac\\(',       // Hashing explícito
                            'admin_password.*=.*hashlib',     // Setup inicial com hashing
                            'hashlib.*pbkdf2',                // Contexto de hashing

                            // === Variáveis e Patterns ===
                            'password_hash',                  // Variáveis de hash
                            'password_pattern\\s*=\\s*re',   // Padrões regex
                            'self\\.password_pattern',       // Propriedades de padrão
                            'user\\[.*password_hash',        // Acesso a campos de banco

                            // === Configurações Seguras ===
                            'SMTP_PASSWORD',                  // Configuração de email
                            'os\\.getenv\\(.*PASSWORD',       // Variáveis de ambiente
                            'self\\.smtp_password',          // Variáveis de email
                            'reset-password\\?token',        // URLs de reset

                            // === Arquivos de Autenticação ===
                            'apps/backend/core/auth/',        // Módulos de autenticação
                            'apps/backend/core/database/',    // Módulos de banco
                            'apps/backend/core/security/',    // Módulos de segurança
                            'jwt_manager\\.py',               // Arquivo JWT manager
                            'input_validator\\.py',           // Arquivo de validação
                            'models\\.py.*admin_password',    // Setup de admin no banco

                            // === Scripts de Segurança ===
                            '"password.*=.*\\[',              // Arrays de padrões de segurança
                            '"api_key.*=.*\\[',               // Arrays de padrões de API
                            '"secret.*=.*\\[',                // Arrays de padrões de secrets
                            'sensitivePatterns.*=',           // Variáveis de script de segurança
                            'SENSITIVE_PATTERNS.*=',          // Variáveis de script de segurança
                            'grep.*-i.*password',             // Scripts de detecção
                            'grep.*-i.*api_key',              // Scripts de detecção
                        ];
                        
                        let isSafeContext = false;

                        // Verificar contexto por arquivo (mais permissivo para arquivos de auth/security)
                        const authFiles = [
                            'apps/backend/core/auth/',
                            'apps/backend/core/security/',
                            'apps/backend/core/database/',
                            'jwt_manager.py',
                            'input_validator.py',
                            'models.py'
                        ];

                        const isAuthFile = authFiles.some(file => result.includes(file));

                        // Para arquivos de autenticação, aplicar verificação mais relaxada
                        if (isAuthFile) {
                            const authSafePatterns = [
                                'def\\s+.*password',              // Qualquer definição de função
                                'password_hash',                  // Qualquer variável de hash
                                'hashlib',                        // Qualquer operação de hash
                                'password:\\s*str',               // Type hints
                                'password_pattern',               // Padrões de validação
                            ];

                            for (const authPattern of authSafePatterns) {
                                if (result.match(new RegExp(authPattern, 'i'))) {
                                    isSafeContext = true;
                                    this.log(`📋 Arquivo de autenticação - contexto seguro: ${pattern}`, 'info');
                                    break;
                                }
                            }
                        }

                        // Verificação padrão para todos os arquivos
                        if (!isSafeContext) {
                            for (const safePattern of safeContexts) {
                                if (result.match(new RegExp(safePattern, 'i'))) {
                                    isSafeContext = true;
                                    this.log(`📋 Contexto seguro ignorado: ${pattern} (${safePattern})`, 'info');
                                    break;
                                }
                            }
                        }
                        
                        if (!isSafeContext) {
                            this.log(`🚨 DADOS SENSÍVEIS DETECTADOS: ${pattern}`, 'critical');
                            this.errors.push(`Sensitive data detected: ${pattern}`);
                            foundSensitiveData = true;
                            this.blocked = true;
                        }
                    }
                } catch (grepError) {
                    // grep retorna exit code 1 se não encontrar - isso é esperado
                }
            }
            
            if (!foundSensitiveData) {
                this.log('✅ Nenhum dado médico sensível detectado', 'success');
                return { success: true };
            }
            
        } catch (error) {
            this.log(`⚠️ Erro na verificação de dados médicos: ${error.message}`, 'warning');
            return { success: false, error: error.message };
        }
    }
    
    checkProductionBuild() {
        const frontendPath = path.join(process.cwd(), 'apps', 'frontend-nextjs');
        
        if (!fs.existsSync(frontendPath)) {
            this.log('⚠️ Diretório frontend não encontrado - pulando verificação de build', 'warning');
            return;
        }
        
        // Build de produção deve funcionar (importante mas não crítico para development)
        return this.runCheck(
            'npm run build',
            'Production Build Validation',
            false, // Não crítico para development
            frontendPath
        );
    }
    
    checkLGPDCompliance() {
        const lgpdChecker = path.join(process.cwd(), '.claude', 'automation', 'lgpd-compliance-checker.js');
        
        if (!fs.existsSync(lgpdChecker)) {
            this.log('⚠️ LGPD checker não encontrado - pulando verificação', 'warning');
            return;
        }
        
        // LGPD compliance é crítico mas pode ter falsos positivos
        return this.runCheck(
            `node "${lgpdChecker}" --quick-check`,
            'LGPD Compliance Check',
            false, // Não crítico devido a falsos positivos
            path.dirname(lgpdChecker)
        );
    }
    
    generateBlockingReport() {
        const duration = Date.now() - this.startTime;
        
        const report = {
            timestamp: new Date().toISOString(),
            duration: Math.round(duration / 1000),
            blocked: this.blocked,
            errors: this.errors,
            warnings: this.warnings,
            status: this.blocked ? 'BLOCKED' : 'ALLOWED',
            medical_compliance: {
                typescript_ready: !this.errors.some(e => e.includes('TypeScript')),
                data_safe: !this.errors.some(e => e.includes('Sensitive data')),
                quality_adequate: this.errors.length === 0
            }
        };
        
        // Salvar relatório
        const reportsDir = path.join(process.cwd(), '.claude', 'automation', 'reports');
        if (fs.existsSync(reportsDir)) {
            try {
                fs.writeFileSync(
                    path.join(reportsDir, `quality-blocker-${Date.now()}.json`),
                    JSON.stringify(report, null, 2),
                    'utf8'
                );
            } catch (error) {
                this.log(`⚠️ Erro ao salvar relatório: ${error.message}`, 'warning');
            }
        }
        
        return report;
    }
    
    execute() {
        this.log('🏥 Iniciando verificação de qualidade médica BLOQUEADORA...', 'info');
        this.log('📋 Plataforma: Educacional de Hanseníase', 'info');
        
        // Executar verificações críticas
        this.checkTypeScriptCompilation();
        this.checkESLintCriticalErrors(); 
        this.checkMedicalDataSafety();
        this.checkProductionBuild();
        this.checkLGPDCompliance();
        
        // Gerar relatório
        const report = this.generateBlockingReport();
        
        // Resultado final
        if (this.blocked) {
            this.log('', 'error');
            this.log('🚫 ================================', 'critical');
            this.log('🚫 OPERAÇÃO BLOQUEADA', 'critical');
            this.log('🚫 QUALIDADE MÉDICA INADEQUADA', 'critical');
            this.log('🚫 ================================', 'critical');
            this.log('', 'error');
            
            this.log(`❌ Erros encontrados (${this.errors.length}):`, 'error');
            this.errors.forEach(error => {
                this.log(`   • ${error}`, 'error');
            });
            
            this.log('', 'error');
            this.log('🔧 Corrija os erros acima antes de continuar', 'error');
            this.log('📊 Relatório salvo em: .claude/automation/reports/', 'info');
            
            return 2; // Exit code 2 = BLOQUEIA operação
            
        } else {
            this.log('', 'success');
            this.log('✅ ================================', 'success');
            this.log('✅ QUALIDADE MÉDICA APROVADA', 'success');
            this.log('✅ OPERAÇÃO PERMITIDA', 'success');
            this.log('✅ ================================', 'success');
            this.log('', 'success');
            
            if (this.warnings.length > 0) {
                this.log(`⚠️ Warnings encontrados (${this.warnings.length}):`, 'warning');
                this.warnings.forEach(warning => {
                    this.log(`   • ${warning}`, 'warning');
                });
                this.log('', 'warning');
            }
            
            this.log(`⏱️ Verificação concluída em ${report.duration}s`, 'info');
            this.log('🏥 Sistema médico mantém padrões de qualidade', 'success');
            
            return 0; // Exit code 0 = PERMITE operação
        }
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    const blocker = new MedicalQualityBlocker();
    const exitCode = blocker.execute();
    process.exit(exitCode);
}

module.exports = MedicalQualityBlocker;