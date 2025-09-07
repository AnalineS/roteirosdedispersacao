#!/usr/bin/env node

/**
 * Sistema de Tratamento de Erros Robusto - Fase 3
 * 
 * Refinamento dos workflows existentes com:
 * - Tratamento de erros médicos específicos
 * - Recovery automático de falhas
 * - Logging estruturado para auditoria
 * - Notificações inteligentes
 * - Circuit breaker para serviços críticos
 * 
 * @version 3.0.0
 * @author Sistema de Automação Claude
 */

const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');

class MedicalErrorHandler extends EventEmitter {
    constructor() {
        super();
        this.config = {
            errorThresholds: {
                medical_calculation: 3,      // Max erros em calculadoras médicas
                lgpd_violation: 1,          // Max violações LGPD (zero tolerance)
                accessibility_critical: 5,   // Max erros críticos acessibilidade
                performance_degradation: 10  // Max alertas performance
            },
            retryPolicies: {
                medical_validation: { maxRetries: 3, backoff: 1000 },
                api_call: { maxRetries: 5, backoff: 2000 },
                file_operation: { maxRetries: 2, backoff: 500 },
                network_request: { maxRetries: 3, backoff: 1500 }
            },
            circuitBreaker: {
                failureThreshold: 5,
                resetTimeout: 30000,
                monitoringWindow: 60000
            },
            notifications: {
                critical: ['slack', 'email', 'sms'],
                high: ['slack', 'email'],
                medium: ['slack'],
                low: ['log']
            }
        };
        
        this.errorCounts = new Map();
        this.circuitStates = new Map();
        this.recoveryStrategies = new Map();
        
        this.initializeErrorTypes();
        this.setupRecoveryStrategies();
        this.startMonitoring();
    }
    
    initializeErrorTypes() {
        this.errorTypes = {
            // Erros médicos críticos
            MEDICAL_CALCULATION_ERROR: {
                severity: 'CRITICAL',
                category: 'medical',
                requiresImmediate: true,
                affectsPatientSafety: true
            },
            MEDICAL_PROTOCOL_VIOLATION: {
                severity: 'CRITICAL',
                category: 'medical',
                requiresImmediate: true,
                affectsCompliance: true
            },
            CALCULATOR_PRECISION_BELOW_THRESHOLD: {
                severity: 'HIGH',
                category: 'medical',
                requiresImmediate: false,
                affectsQuality: true
            },
            
            // Erros LGPD críticos
            SENSITIVE_DATA_EXPOSURE: {
                severity: 'CRITICAL',
                category: 'lgpd',
                requiresImmediate: true,
                legalImplications: true
            },
            CONSENT_MECHANISM_FAILURE: {
                severity: 'HIGH',
                category: 'lgpd',
                requiresImmediate: true,
                affectsCompliance: true
            },
            DATA_BREACH_DETECTED: {
                severity: 'CRITICAL',
                category: 'lgpd',
                requiresImmediate: true,
                legalImplications: true,
                requiresNotification: true
            },
            
            // Erros de acessibilidade
            WCAG_CRITICAL_VIOLATION: {
                severity: 'HIGH',
                category: 'accessibility',
                requiresImmediate: false,
                affectsInclusion: true
            },
            SCREEN_READER_INCOMPATIBLE: {
                severity: 'MEDIUM',
                category: 'accessibility',
                requiresImmediate: false,
                affectsUsability: true
            },
            
            // Erros de performance
            PERFORMANCE_DEGRADATION: {
                severity: 'MEDIUM',
                category: 'performance',
                requiresImmediate: false,
                affectsUserExperience: true
            },
            SYSTEM_OVERLOAD: {
                severity: 'HIGH',
                category: 'performance',
                requiresImmediate: true,
                affectsAvailability: true
            },
            
            // Erros de sistema
            VALIDATION_PIPELINE_FAILURE: {
                severity: 'HIGH',
                category: 'system',
                requiresImmediate: true,
                affectsQuality: true
            },
            MONITORING_SYSTEM_DOWN: {
                severity: 'HIGH',
                category: 'system',
                requiresImmediate: true,
                affectsVisibility: true
            }
        };
    }
    
    setupRecoveryStrategies() {
        // Estratégias de recuperação para diferentes tipos de erro
        
        // Erros médicos
        this.recoveryStrategies.set('MEDICAL_CALCULATION_ERROR', async (error, context) => {
            console.log('🏥 Iniciando recuperação de erro de cálculo médico...');
            
            // 1. Parar calculadora afetada imediatamente
            await this.disableCalculator(context.calculatorName);
            
            // 2. Notificar equipe médica
            await this.notifyMedicalTeam(error, context);
            
            // 3. Tentar recuperação com protocolo de backup
            try {
                await this.loadBackupMedicalProtocol(context.calculatorName);
                await this.validateBackupCalculation(context);
                
                if (context.backupValidation?.accuracy >= 95) {
                    console.log('✅ Recuperação bem-sucedida com protocolo backup');
                    await this.enableCalculator(context.calculatorName);
                    return { success: true, method: 'backup_protocol' };
                }
            } catch (backupError) {
                console.error('❌ Falha na recuperação com backup:', backupError);
            }
            
            // 4. Se backup falhar, manter calculadora offline
            await this.setCalculatorMaintenance(context.calculatorName, error.message);
            return { success: false, method: 'offline_mode' };
        });
        
        // Erros LGPD
        this.recoveryStrategies.set('SENSITIVE_DATA_EXPOSURE', async (error, context) => {
            console.log('🛡️ ALERTA CRÍTICO: Dados sensíveis expostos - Iniciando protocolo de emergência');
            
            // 1. Bloqueio imediato do acesso
            await this.emergencyAccessBlock(context.source);
            
            // 2. Isolar dados expostos
            await this.quarantineExposedData(context.exposedData);
            
            // 3. Notificar DPO e equipe legal
            await this.notifyDPOEmergency(error, context);
            
            // 4. Iniciar investigação automática
            const investigation = await this.startDataBreachInvestigation(context);
            
            // 5. Gerar relatório preliminar
            await this.generateIncidentReport(error, context, investigation);
            
            return { 
                success: true, 
                method: 'emergency_containment',
                investigationId: investigation.id,
                containmentTime: new Date().toISOString()
            };
        });
        
        // Erros de acessibilidade
        this.recoveryStrategies.set('WCAG_CRITICAL_VIOLATION', async (error, context) => {
            console.log('♿ Recuperando violação crítica de acessibilidade...');
            
            // 1. Aplicar correções automáticas conhecidas
            const autoFixes = await this.applyAccessibilityAutoFixes(context);
            
            // 2. Se não conseguir corrigir, ativar modo de alta acessibilidade
            if (!autoFixes.success) {
                await this.activateHighAccessibilityMode(context);
            }
            
            // 3. Notificar equipe de acessibilidade
            await this.notifyAccessibilityTeam(error, context);
            
            return { success: autoFixes.success, method: 'auto_fix', fixes: autoFixes.applied };
        });
        
        // Erros de performance
        this.recoveryStrategies.set('PERFORMANCE_DEGRADATION', async (error, context) => {
            console.log('⚡ Recuperando degradação de performance...');
            
            // 1. Identificar causa da degradação
            const analysis = await this.analyzePerformanceDegradation(context);
            
            // 2. Aplicar otimizações automáticas
            const optimizations = await this.applyPerformanceOptimizations(analysis);
            
            // 3. Se necessário, ativar modo de performance econômica
            if (analysis.severity === 'HIGH') {
                await this.activateEconomicPerformanceMode();
            }
            
            return { 
                success: optimizations.success, 
                method: 'automatic_optimization',
                optimizationsApplied: optimizations.applied
            };
        });
    }
    
    async handleError(errorType, error, context = {}) {
        const timestamp = new Date().toISOString();
        const errorInfo = this.errorTypes[errorType];
        
        if (!errorInfo) {
            console.error(`❌ Tipo de erro desconhecido: ${errorType}`);
            return { success: false, error: 'Unknown error type' };
        }
        
        console.log(`🚨 [${timestamp}] Erro detectado: ${errorType}`);
        console.log(`📊 Severidade: ${errorInfo.severity}`);
        console.log(`🏷️ Categoria: ${errorInfo.category}`);
        
        try {
            // 1. Log estruturado do erro
            await this.logStructuredError(errorType, error, context, errorInfo);
            
            // 2. Verificar circuit breaker
            if (this.isCircuitOpen(errorInfo.category)) {
                console.log(`⚡ Circuit breaker aberto para ${errorInfo.category} - Rejeitando operação`);
                return { success: false, error: 'Circuit breaker open', category: errorInfo.category };
            }
            
            // 3. Incrementar contador de erros
            this.incrementErrorCount(errorType);
            
            // 4. Verificar se precisa de intervenção imediata
            if (errorInfo.requiresImmediate) {
                await this.handleImmediateAction(errorType, error, context);
            }
            
            // 5. Tentar recuperação automática
            const recoveryResult = await this.attemptRecovery(errorType, error, context);
            
            // 6. Notificar conforme severidade
            await this.sendNotifications(errorType, error, context, errorInfo, recoveryResult);
            
            // 7. Atualizar métricas
            this.updateErrorMetrics(errorType, errorInfo, recoveryResult);
            
            // 8. Emitir evento para monitoramento
            this.emit('error-handled', {
                errorType,
                severity: errorInfo.severity,
                category: errorInfo.category,
                recovered: recoveryResult.success,
                timestamp
            });
            
            return recoveryResult;
            
        } catch (handlingError) {
            console.error(`❌ Erro ao tratar erro ${errorType}:`, handlingError);
            
            // Meta-error: erro ao tratar erro
            await this.handleMetaError(errorType, error, handlingError);
            
            return { success: false, error: 'Error handling failed', originalError: error };
        }
    }
    
    async logStructuredError(errorType, error, context, errorInfo) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            errorType,
            severity: errorInfo.severity,
            category: errorInfo.category,
            message: error.message || error.toString(),
            stack: error.stack,
            context: this.sanitizeContext(context),
            systemInfo: {
                nodeVersion: process.version,
                platform: process.platform,
                memory: process.memoryUsage(),
                uptime: process.uptime()
            },
            medicalContext: this.extractMedicalContext(context),
            complianceImpact: this.assessComplianceImpact(errorInfo),
            recoveryRequired: errorInfo.requiresImmediate
        };
        
        // Log para arquivo estruturado
        await this.writeToErrorLog(logEntry);
        
        // Log para sistema de auditoria LGPD se necessário
        if (errorInfo.category === 'lgpd' || errorInfo.legalImplications) {
            await this.writeToComplianceLog(logEntry);
        }
        
        // Log para sistema médico se afetar segurança do paciente
        if (errorInfo.affectsPatientSafety) {
            await this.writeToMedicalSafetyLog(logEntry);
        }
    }
    
    async attemptRecovery(errorType, error, context) {
        const strategy = this.recoveryStrategies.get(errorType);
        
        if (!strategy) {
            console.log(`⚠️ Nenhuma estratégia de recuperação definida para ${errorType}`);
            return { success: false, error: 'No recovery strategy' };
        }
        
        const maxRetries = this.config.retryPolicies[errorType]?.maxRetries || 1;
        let attempt = 1;
        
        while (attempt <= maxRetries) {
            try {
                console.log(`🔄 Tentativa de recuperação ${attempt}/${maxRetries} para ${errorType}`);
                
                const result = await strategy(error, context);
                
                if (result.success) {
                    console.log(`✅ Recuperação bem-sucedida em ${attempt} tentativa(s)`);
                    return { ...result, attempts: attempt };
                }
                
                console.log(`❌ Tentativa ${attempt} falhou:`, result.error);
                
            } catch (recoveryError) {
                console.error(`❌ Erro durante recuperação (tentativa ${attempt}):`, recoveryError);
            }
            
            if (attempt < maxRetries) {
                const backoff = this.calculateBackoff(attempt, errorType);
                console.log(`⏱️ Aguardando ${backoff}ms antes da próxima tentativa...`);
                await this.sleep(backoff);
            }
            
            attempt++;
        }
        
        console.log(`❌ Recuperação falhou após ${maxRetries} tentativas`);
        return { success: false, error: 'Recovery failed after retries', attempts: maxRetries };
    }
    
    async handleImmediateAction(errorType, error, context) {
        console.log(`🚨 Ação imediata requerida para ${errorType}`);
        
        const actions = {
            SENSITIVE_DATA_EXPOSURE: async () => {
                await this.emergencyDataLockdown();
                await this.notifySecurityTeam(error, context);
            },
            MEDICAL_CALCULATION_ERROR: async () => {
                await this.disableAffectedCalculators(context);
                await this.notifyMedicalTeam(error, context);
            },
            DATA_BREACH_DETECTED: async () => {
                await this.initiateDataBreachProtocol(error, context);
                await this.notifyAuthorities(error, context);
            },
            SYSTEM_OVERLOAD: async () => {
                await this.activateLoadShedding();
                await this.scaleSystemResources();
            }
        };
        
        const action = actions[errorType];
        if (action) {
            try {
                await action();
                console.log(`✅ Ação imediata executada com sucesso para ${errorType}`);
            } catch (actionError) {
                console.error(`❌ Falha na ação imediata para ${errorType}:`, actionError);
                throw actionError;
            }
        }
    }
    
    async sendNotifications(errorType, error, context, errorInfo, recoveryResult) {
        const channels = this.config.notifications[errorInfo.severity.toLowerCase()] || ['log'];
        
        const notification = {
            timestamp: new Date().toISOString(),
            errorType,
            severity: errorInfo.severity,
            category: errorInfo.category,
            message: this.formatErrorMessage(errorType, error, context),
            recovered: recoveryResult.success,
            recoveryMethod: recoveryResult.method,
            context: this.sanitizeContext(context),
            actionRequired: this.determineActionRequired(errorInfo, recoveryResult)
        };
        
        for (const channel of channels) {
            try {
                await this.sendNotification(channel, notification);
            } catch (notificationError) {
                console.error(`❌ Falha ao enviar notificação via ${channel}:`, notificationError);
            }
        }
    }
    
    async sendNotification(channel, notification) {
        switch (channel) {
            case 'slack':
                await this.sendSlackNotification(notification);
                break;
            case 'email':
                await this.sendEmailNotification(notification);
                break;
            case 'sms':
                await this.sendSMSNotification(notification);
                break;
            case 'log':
                console.log(`📬 NOTIFICAÇÃO [${notification.severity}]:`, notification.message);
                break;
            default:
                console.warn(`⚠️ Canal de notificação desconhecido: ${channel}`);
        }
    }
    
    // Circuit breaker implementation
    isCircuitOpen(category) {
        const state = this.circuitStates.get(category);
        if (!state) return false;
        
        if (state.state === 'OPEN') {
            const now = Date.now();
            if (now - state.lastFailure > this.config.circuitBreaker.resetTimeout) {
                // Try to reset circuit
                state.state = 'HALF_OPEN';
                state.consecutiveFailures = 0;
                console.log(`🔄 Circuit breaker para ${category} mudou para HALF_OPEN`);
            }
            return state.state === 'OPEN';
        }
        
        return false;
    }
    
    updateCircuitBreaker(category, success) {
        let state = this.circuitStates.get(category) || {
            state: 'CLOSED',
            consecutiveFailures: 0,
            lastFailure: null
        };
        
        if (success) {
            if (state.state === 'HALF_OPEN') {
                state.state = 'CLOSED';
                state.consecutiveFailures = 0;
                console.log(`✅ Circuit breaker para ${category} resetado para CLOSED`);
            }
        } else {
            state.consecutiveFailures++;
            state.lastFailure = Date.now();
            
            if (state.consecutiveFailures >= this.config.circuitBreaker.failureThreshold) {
                state.state = 'OPEN';
                console.log(`⚡ Circuit breaker para ${category} ABERTO após ${state.consecutiveFailures} falhas`);
            }
        }
        
        this.circuitStates.set(category, state);
    }
    
    // Helper methods for specific error types
    async disableCalculator(calculatorName) {
        console.log(`🚫 Desabilitando calculadora: ${calculatorName}`);
        // Implementation would disable specific calculator
    }
    
    async notifyMedicalTeam(error, context) {
        const notification = {
            type: 'medical_error',
            urgency: 'high',
            message: `Erro médico detectado: ${error.message}`,
            calculator: context.calculatorName,
            timestamp: new Date().toISOString(),
            actionRequired: 'Revisão médica urgente necessária'
        };
        
        await this.sendNotification('slack', notification);
        await this.sendNotification('email', notification);
    }
    
    async emergencyDataLockdown() {
        console.log('🔒 LOCKDOWN EMERGENCIAL: Bloqueando acesso a dados sensíveis');
        // Implementation would:
        // 1. Disable API endpoints with sensitive data
        // 2. Block database access to sensitive tables
        // 3. Activate emergency access controls
        // 4. Log all access attempts
    }
    
    async notifyDPOEmergency(error, context) {
        const notification = {
            type: 'data_breach_alert',
            urgency: 'critical',
            message: `ALERTA CRÍTICO LGPD: ${error.message}`,
            exposedData: context.exposedData,
            timestamp: new Date().toISOString(),
            legalDeadline: '72 horas para notificação ANPD',
            actionRequired: 'Investigação imediata e contenção'
        };
        
        // Send via all critical channels
        await this.sendNotification('sms', notification);
        await this.sendNotification('email', notification);
        await this.sendNotification('slack', notification);
    }
    
    // Utility methods
    sanitizeContext(context) {
        const sanitized = { ...context };
        
        // Remove sensitive information
        const sensitiveFields = ['password', 'token', 'cpf', 'rg', 'email', 'phone'];
        sensitiveFields.forEach(field => {
            if (sanitized[field]) {
                sanitized[field] = '[REDACTED]';
            }
        });
        
        return sanitized;
    }
    
    extractMedicalContext(context) {
        return {
            calculatorName: context.calculatorName,
            protocolVersion: context.protocolVersion,
            patientAgeGroup: context.patientAgeGroup, // anonymized
            calculationType: context.calculationType,
            medicalValidation: context.medicalValidation
        };
    }
    
    assessComplianceImpact(errorInfo) {
        return {
            lgpdImpact: errorInfo.legalImplications ? 'HIGH' : 'LOW',
            medicalSafetyImpact: errorInfo.affectsPatientSafety ? 'CRITICAL' : 'LOW',
            accessibilityImpact: errorInfo.affectsInclusion ? 'MEDIUM' : 'LOW',
            regulatoryNotificationRequired: errorInfo.requiresNotification || false
        };
    }
    
    formatErrorMessage(errorType, error, context) {
        const templates = {
            MEDICAL_CALCULATION_ERROR: `🏥 Erro na calculadora ${context.calculatorName}: ${error.message}`,
            SENSITIVE_DATA_EXPOSURE: `🛡️ CRÍTICO: Dados sensíveis expostos em ${context.source}`,
            WCAG_CRITICAL_VIOLATION: `♿ Violação crítica WCAG detectada: ${error.message}`,
            PERFORMANCE_DEGRADATION: `⚡ Performance degradada: ${error.message}`
        };
        
        return templates[errorType] || `❌ ${errorType}: ${error.message}`;
    }
    
    determineActionRequired(errorInfo, recoveryResult) {
        if (!recoveryResult.success) {
            if (errorInfo.severity === 'CRITICAL') {
                return 'Intervenção manual urgente necessária';
            } else if (errorInfo.severity === 'HIGH') {
                return 'Revisão e correção necessária em 2 horas';
            } else {
                return 'Correção necessária no próximo ciclo de manutenção';
            }
        } else {
            return 'Recuperação automática bem-sucedida - monitoramento continuado';
        }
    }
    
    calculateBackoff(attempt, errorType) {
        const baseBackoff = this.config.retryPolicies[errorType]?.backoff || 1000;
        return baseBackoff * Math.pow(2, attempt - 1); // Exponential backoff
    }
    
    incrementErrorCount(errorType) {
        const current = this.errorCounts.get(errorType) || 0;
        this.errorCounts.set(errorType, current + 1);
    }
    
    updateErrorMetrics(errorType, errorInfo, recoveryResult) {
        // Update internal metrics for dashboard
        this.emit('metrics-update', {
            errorType,
            category: errorInfo.category,
            severity: errorInfo.severity,
            recovered: recoveryResult.success,
            timestamp: new Date().toISOString()
        });
    }
    
    async writeToErrorLog(logEntry) {
        const logDir = path.join(__dirname, '..', '..', 'logs', 'errors');
        await fs.mkdir(logDir, { recursive: true });
        
        const logFile = path.join(logDir, `errors-${new Date().toISOString().split('T')[0]}.log`);
        const logLine = JSON.stringify(logEntry) + '\n';
        
        await fs.appendFile(logFile, logLine, 'utf8');
    }
    
    async writeToComplianceLog(logEntry) {
        const logDir = path.join(__dirname, '..', '..', 'logs', 'compliance');
        await fs.mkdir(logDir, { recursive: true });
        
        const logFile = path.join(logDir, `lgpd-incidents-${new Date().toISOString().split('T')[0]}.log`);
        const logLine = JSON.stringify({
            ...logEntry,
            complianceType: 'LGPD',
            requiresNotification: true,
            legalDeadline: '72 hours'
        }) + '\n';
        
        await fs.appendFile(logFile, logLine, 'utf8');
    }
    
    async writeToMedicalSafetyLog(logEntry) {
        const logDir = path.join(__dirname, '..', '..', 'logs', 'medical-safety');
        await fs.mkdir(logDir, { recursive: true });
        
        const logFile = path.join(logDir, `medical-safety-${new Date().toISOString().split('T')[0]}.log`);
        const logLine = JSON.stringify({
            ...logEntry,
            safetyImpact: 'PATIENT_SAFETY',
            requiresMedicalReview: true,
            escalationRequired: true
        }) + '\n';
        
        await fs.appendFile(logFile, logLine, 'utf8');
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    startMonitoring() {
        console.log('🔄 Iniciando monitoramento de erros...');
        
        // Monitor error rates
        setInterval(() => {
            this.checkErrorRates();
        }, 60000); // Every minute
        
        // Reset error counts daily
        setInterval(() => {
            this.resetDailyCounters();
        }, 24 * 60 * 60 * 1000); // Every 24 hours
        
        // Health check for circuit breakers
        setInterval(() => {
            this.healthCheckCircuitBreakers();
        }, 30000); // Every 30 seconds
    }
    
    checkErrorRates() {
        for (const [errorType, count] of this.errorCounts.entries()) {
            const errorInfo = this.errorTypes[errorType];
            const threshold = this.config.errorThresholds[errorInfo?.category] || 10;
            
            if (count >= threshold) {
                console.warn(`⚠️ Threshold excedido para ${errorType}: ${count}/${threshold}`);
                this.emit('threshold-exceeded', { errorType, count, threshold });
            }
        }
    }
    
    resetDailyCounters() {
        console.log('🔄 Resetando contadores diários de erro...');
        this.errorCounts.clear();
    }
    
    healthCheckCircuitBreakers() {
        for (const [category, state] of this.circuitStates.entries()) {
            if (state.state === 'OPEN') {
                const openTime = Date.now() - state.lastFailure;
                if (openTime > this.config.circuitBreaker.resetTimeout * 2) {
                    console.log(`🔧 Circuit breaker ${category} em estado OPEN por ${openTime}ms - investigação necessária`);
                }
            }
        }
    }
    
    async handleMetaError(originalErrorType, originalError, handlingError) {
        console.error(`🔥 META-ERROR: Falha ao tratar ${originalErrorType}:`, handlingError);
        
        // Log meta-error para investigação
        const metaLogEntry = {
            timestamp: new Date().toISOString(),
            type: 'META_ERROR',
            severity: 'CRITICAL',
            originalErrorType,
            originalError: originalError.message,
            handlingError: handlingError.message,
            stack: handlingError.stack,
            systemState: {
                memory: process.memoryUsage(),
                uptime: process.uptime(),
                errorCounts: Object.fromEntries(this.errorCounts),
                circuitStates: Object.fromEntries(this.circuitStates)
            }
        };
        
        await this.writeToErrorLog(metaLogEntry);
        
        // Notify development team immediately
        await this.sendNotification('slack', {
            type: 'meta_error',
            urgency: 'critical',
            message: `🔥 Sistema de tratamento de erros falhou: ${handlingError.message}`,
            originalError: originalErrorType,
            actionRequired: 'Investigação imediata do sistema de error handling'
        });
    }
}

// Export for use in other modules
module.exports = { MedicalErrorHandler };

// CLI usage if run directly
if (require.main === module) {
    const errorHandler = new MedicalErrorHandler();
    
    // Example usage
    console.log('🧪 Testando sistema de tratamento de erros...');
    
    // Test medical calculation error
    errorHandler.handleError('MEDICAL_CALCULATION_ERROR', 
        new Error('Precisão da calculadora rifampicina abaixo de 95%'), 
        { calculatorName: 'rifampicina', currentPrecision: 92.3, threshold: 95 }
    );
    
    // Test LGPD violation
    setTimeout(() => {
        errorHandler.handleError('SENSITIVE_DATA_EXPOSURE', 
            new Error('CPF encontrado em logs não criptografados'), 
            { source: 'application.log', exposedData: ['CPF'], severity: 'HIGH' }
        );
    }, 2000);
    
    // Test accessibility issue
    setTimeout(() => {
        errorHandler.handleError('WCAG_CRITICAL_VIOLATION', 
            new Error('Contraste insuficiente detectado em formulário médico'), 
            { component: 'CalculadoraRifampicina', contrastRatio: 3.2, minimumRequired: 4.5 }
        );
    }, 4000);
}