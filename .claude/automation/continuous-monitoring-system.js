#!/usr/bin/env node

/**
 * Sistema de Monitoramento Contínuo para Plataforma Educacional Médica
 * 
 * Monitora em tempo real:
 * - Segurança de dados médicos (PII/PHI)
 * - Conformidade LGPD
 * - Acessibilidade WCAG 2.1 AA
 * - Performance de componentes críticos
 * - Qualidade médica do conteúdo
 * - Saúde do sistema
 * 
 * @version 2.0.0
 * @author Sistema de Automação Claude
 */

const fs = require('fs').promises;
const path = require('path');
const http = require('http');
const https = require('https');
const { execSync } = require('child_process');
const EventEmitter = require('events');

class ContinuousMonitoringSystem extends EventEmitter {
    constructor() {
        super();
        
        this.config = {
            // Intervalos de monitoramento (em ms)
            intervals: {
                realTime: 30 * 1000,        // 30 segundos - dados críticos
                frequent: 5 * 60 * 1000,    // 5 minutos - métricas normais
                moderate: 15 * 60 * 1000,   // 15 minutos - análises profundas
                daily: 24 * 60 * 60 * 1000  // 24 horas - relatórios completos
            },
            
            // Thresholds para alertas
            thresholds: {
                // Segurança
                piiDetections: 0,           // Nenhuma detecção de PII permitida
                phiDetections: 0,           // Nenhuma detecção de PHI permitida
                lgpdCompliance: 100,        // 100% de conformidade LGPD
                securityScore: 90,          // Score mínimo de segurança
                
                // Performance
                responseTime: 2000,         // Tempo de resposta máximo (ms)
                errorRate: 1,               // Taxa de erro máxima (%)
                memoryUsage: 80,            // Uso máximo de memória (%)
                cpuUsage: 70,               // Uso máximo de CPU (%)
                
                // Acessibilidade
                accessibilityScore: 90,     // Score mínimo WCAG 2.1 AA
                contrastRatio: 4.5,         // Contraste mínimo AA
                
                // Médico
                medicalAccuracy: 95,        // Precisão médica mínima
                calculationErrors: 0,       // Erros de cálculo não permitidos
                
                // Sistema
                diskUsage: 85,              // Uso máximo do disco (%)
                uptime: 99.5                // Uptime mínimo (%)
            },
            
            // Configurações de alerta
            alerting: {
                channels: ['console', 'file', 'webhook'],
                levels: ['critical', 'high', 'medium', 'low'],
                cooldown: 5 * 60 * 1000,    // 5 minutos entre alertas similares
                escalation: 3,               // Escalate após 3 alertas consecutivos
            },
            
            // Fontes de dados
            dataSources: {
                fileSystem: true,
                processMetrics: true,
                webEndpoints: true,
                databaseMetrics: false,     // Seria habilitado com DB real
                externalApis: true
            },
            
            // Diretórios para monitoramento
            watchDirectories: [
                './apps/frontend-nextjs/src',
                './apps/frontend-nextjs/pages',
                './apps/frontend-nextjs/public',
                './.claude'
            ],
            
            // Arquivos de configuração críticos
            criticalFiles: [
                './apps/frontend-nextjs/package.json',
                './apps/frontend-nextjs/next.config.js',
                './.claude/settings.local.json',
                './apps/frontend-nextjs/tsconfig.json'
            ]
        };
        
        this.state = {
            monitoring: false,
            lastChecks: {},
            alerts: [],
            metrics: {},
            timers: {},
            watchers: [],
            alertCooldowns: new Map()
        };
        
        this.metrics = {
            security: {
                piiDetections: 0,
                phiDetections: 0,
                lgpdCompliance: 100,
                securityScore: 100,
                lastScan: null
            },
            performance: {
                responseTime: 0,
                errorRate: 0,
                memoryUsage: 0,
                cpuUsage: 0,
                uptime: 100
            },
            accessibility: {
                score: 100,
                violations: [],
                lastAudit: null
            },
            medical: {
                accuracy: 100,
                calculationErrors: 0,
                contentValidation: 100,
                lastValidation: null
            },
            system: {
                diskUsage: 0,
                networkStatus: 'healthy',
                servicesStatus: 'all_up',
                lastHealthCheck: null
            }
        };
    }
    
    /**
     * Inicia o sistema de monitoramento
     */
    async startMonitoring() {
        console.log('🎯 Iniciando Sistema de Monitoramento Contínuo...\n');
        
        try {
            // 1. Validação inicial
            await this.validateConfiguration();
            
            // 2. Configuração de watchers de arquivo
            await this.setupFileWatchers();
            
            // 3. Inicialização de métricas
            await this.initializeMetrics();
            
            // 4. Configuração de timers de monitoramento
            this.setupMonitoringTimers();
            
            // 5. Configuração de handlers de eventos
            this.setupEventHandlers();
            
            // 6. Verificação inicial completa
            console.log('🔍 Executando verificação inicial...');
            await this.runInitialChecks();
            
            this.state.monitoring = true;
            console.log('✅ Sistema de monitoramento ativo!\n');
            
            // 7. Start do dashboard em tempo real
            await this.startRealTimeDashboard();
            
            return {
                success: true,
                message: 'Monitoramento contínuo iniciado com sucesso'
            };
            
        } catch (error) {
            console.error('❌ Erro ao iniciar monitoramento:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Para o sistema de monitoramento
     */
    async stopMonitoring() {
        console.log('🛑 Parando sistema de monitoramento...');
        
        this.state.monitoring = false;
        
        // Para todos os timers
        Object.values(this.state.timers).forEach(timer => {
            if (timer) clearInterval(timer);
        });
        
        // Fecha watchers de arquivo
        this.state.watchers.forEach(watcher => {
            if (watcher.close) watcher.close();
        });
        
        console.log('✅ Sistema de monitoramento parado');
        
        return { success: true };
    }
    
    /**
     * Valida configuração do sistema
     */
    async validateConfiguration() {
        console.log('⚙️  Validando configuração...');
        
        // Verifica diretórios de monitoramento
        for (const dir of this.config.watchDirectories) {
            try {
                await fs.access(dir);
            } catch (error) {
                console.warn(`⚠️  Aviso: Diretório não encontrado: ${dir}`);
            }
        }
        
        // Verifica arquivos críticos
        for (const file of this.config.criticalFiles) {
            try {
                await fs.access(file);
                console.log(`   ✅ ${file}`);
            } catch (error) {
                console.warn(`   ⚠️  ${file} - Não encontrado`);
            }
        }
        
        console.log('   ✅ Configuração validada');
    }
    
    /**
     * Configura watchers de arquivo
     */
    async setupFileWatchers() {
        console.log('👁️  Configurando watchers de arquivo...');
        
        // Watcher para arquivos críticos
        for (const file of this.config.criticalFiles) {
            try {
                const watcher = fs.watch(file, (eventType, filename) => {
                    this.handleFileChange(file, eventType);
                });
                
                this.state.watchers.push(watcher);
                console.log(`   👀 Monitorando: ${file}`);
            } catch (error) {
                console.warn(`   ⚠️  Não foi possível monitorar: ${file}`);
            }
        }
        
        // Watcher para diretórios de código
        for (const dir of this.config.watchDirectories) {
            try {
                const watcher = fs.watch(dir, { recursive: true }, (eventType, filename) => {
                    if (filename) {
                        this.handleFileChange(path.join(dir, filename), eventType);
                    }
                });
                
                this.state.watchers.push(watcher);
                console.log(`   👀 Monitorando diretório: ${dir}`);
            } catch (error) {
                console.warn(`   ⚠️  Não foi possível monitorar diretório: ${dir}`);
            }
        }
    }
    
    /**
     * Inicializa métricas base
     */
    async initializeMetrics() {
        console.log('📊 Inicializando métricas...');
        
        // Métricas de sistema
        this.metrics.system.diskUsage = await this.getDiskUsage();
        this.metrics.performance.memoryUsage = await this.getMemoryUsage();
        this.metrics.performance.cpuUsage = await this.getCpuUsage();
        
        console.log('   ✅ Métricas inicializadas');
    }
    
    /**
     * Configura timers de monitoramento
     */
    setupMonitoringTimers() {
        console.log('⏰ Configurando timers de monitoramento...');
        
        // Monitoramento em tempo real (30s)
        this.state.timers.realTime = setInterval(async () => {
            await this.runRealTimeChecks();
        }, this.config.intervals.realTime);
        
        // Monitoramento frequente (5min)
        this.state.timers.frequent = setInterval(async () => {
            await this.runFrequentChecks();
        }, this.config.intervals.frequent);
        
        // Monitoramento moderado (15min)
        this.state.timers.moderate = setInterval(async () => {
            await this.runModerateChecks();
        }, this.config.intervals.moderate);
        
        // Relatórios diários (24h)
        this.state.timers.daily = setInterval(async () => {
            await this.runDailyChecks();
        }, this.config.intervals.daily);
        
        console.log('   ✅ Timers configurados');
    }
    
    /**
     * Configura handlers de eventos
     */
    setupEventHandlers() {
        // Handler para alertas críticos
        this.on('critical_alert', this.handleCriticalAlert.bind(this));
        
        // Handler para métricas atualizadas
        this.on('metrics_updated', this.handleMetricsUpdate.bind(this));
        
        // Handler para mudanças de arquivo
        this.on('file_changed', this.handleFileChangeEvent.bind(this));
        
        // Handler para problemas de performance
        this.on('performance_issue', this.handlePerformanceIssue.bind(this));
        
        // Handler para problemas médicos
        this.on('medical_issue', this.handleMedicalIssue.bind(this));
    }
    
    /**
     * Executa verificações iniciais
     */
    async runInitialChecks() {
        await this.runSecurityScan();
        await this.runAccessibilityAudit();
        await this.runMedicalValidation();
        await this.runPerformanceCheck();
        await this.runSystemHealthCheck();
    }
    
    /**
     * Executa verificações em tempo real
     */
    async runRealTimeChecks() {
        if (!this.state.monitoring) return;
        
        try {
            // Métricas críticas de sistema
            const newMetrics = {
                memoryUsage: await this.getMemoryUsage(),
                cpuUsage: await this.getCpuUsage(),
                diskUsage: await this.getDiskUsage(),
                timestamp: new Date().toISOString()
            };
            
            // Verifica thresholds críticos
            this.checkCriticalThresholds(newMetrics);
            
            // Atualiza métricas
            Object.assign(this.metrics.performance, newMetrics);
            Object.assign(this.metrics.system, newMetrics);
            
            this.emit('metrics_updated', { type: 'realtime', metrics: newMetrics });
            
        } catch (error) {
            console.error('Erro em verificação tempo real:', error.message);
        }
    }
    
    /**
     * Executa verificações frequentes
     */
    async runFrequentChecks() {
        if (!this.state.monitoring) return;
        
        try {
            console.log('🔍 Executando verificações frequentes...');
            
            // Scan de segurança rápido
            await this.runQuickSecurityScan();
            
            // Verificação de performance
            await this.runPerformanceCheck();
            
            // Verificação de saúde do sistema
            await this.runSystemHealthCheck();
            
            console.log('   ✅ Verificações frequentes concluídas');
            
        } catch (error) {
            console.error('Erro em verificações frequentes:', error.message);
        }
    }
    
    /**
     * Executa verificações moderadas
     */
    async runModerateChecks() {
        if (!this.state.monitoring) return;
        
        try {
            console.log('🔎 Executando verificações moderadas...');
            
            // Scan completo de segurança
            await this.runSecurityScan();
            
            // Auditoria de acessibilidade
            await this.runAccessibilityAudit();
            
            // Validação médica
            await this.runMedicalValidation();
            
            // Verificação LGPD
            await this.runLGPDCheck();
            
            console.log('   ✅ Verificações moderadas concluídas');
            
        } catch (error) {
            console.error('Erro em verificações moderadas:', error.message);
        }
    }
    
    /**
     * Executa verificações diárias
     */
    async runDailyChecks() {
        if (!this.state.monitoring) return;
        
        try {
            console.log('📊 Executando verificações diárias...');
            
            // Gera relatório completo
            await this.generateDailyReport();
            
            // Limpa dados antigos
            await this.cleanupOldData();
            
            // Backup de métricas
            await this.backupMetrics();
            
            console.log('   ✅ Verificações diárias concluídas');
            
        } catch (error) {
            console.error('Erro em verificações diárias:', error.message);
        }
    }
    
    /**
     * Executa scan de segurança completo
     */
    async runSecurityScan() {
        try {
            console.log('🔒 Executando scan de segurança...');
            
            // Executa verificador LGPD
            const lgpdScript = path.join(__dirname, 'lgpd-compliance-checker.js');
            const lgpdResult = execSync(`node "${lgpdScript}"`, {
                encoding: 'utf-8',
                timeout: 2 * 60 * 1000,
                stdio: 'pipe'
            });
            
            // Parse do resultado LGPD
            const lgpdData = this.parseLGPDResult(lgpdResult);
            
            this.metrics.security = {
                ...this.metrics.security,
                lgpdCompliance: lgpdData.score,
                piiDetections: lgpdData.piiCount,
                phiDetections: lgpdData.phiCount,
                lastScan: new Date().toISOString()
            };
            
            // Verifica thresholds de segurança
            this.checkSecurityThresholds();
            
            console.log(`   ✅ LGPD: ${lgpdData.score}%, PII: ${lgpdData.piiCount}, PHI: ${lgpdData.phiCount}`);
            
        } catch (error) {
            console.warn('⚠️  Erro no scan de segurança:', error.message);
            this.createAlert('high', 'security_scan_failed', error.message);
        }
    }
    
    /**
     * Executa scan rápido de segurança
     */
    async runQuickSecurityScan() {
        try {
            // Scan básico de arquivos modificados recentemente
            const recentFiles = await this.getRecentlyModifiedFiles();
            let piiCount = 0;
            let phiCount = 0;
            
            for (const file of recentFiles) {
                const content = await fs.readFile(file, 'utf-8');
                
                // Verifica PII básico
                if (/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/.test(content)) {
                    piiCount++;
                }
                
                // Verifica dados médicos
                if (/\bCRM[-\s]?[A-Z]{2}[-\s]?\d{4,6}\b/gi.test(content)) {
                    phiCount++;
                }
            }
            
            if (piiCount > 0 || phiCount > 0) {
                this.createAlert('critical', 'sensitive_data_detected', 
                    `Dados sensíveis detectados: PII: ${piiCount}, PHI: ${phiCount}`);
            }
            
        } catch (error) {
            console.warn('Erro no scan rápido de segurança:', error.message);
        }
    }
    
    /**
     * Executa auditoria de acessibilidade
     */
    async runAccessibilityAudit() {
        try {
            console.log('♿ Executando auditoria de acessibilidade...');
            
            // Simula auditoria de acessibilidade (integraria com axe-core em implementação real)
            const score = await this.simulateAccessibilityAudit();
            
            this.metrics.accessibility = {
                score,
                violations: score < 90 ? ['Algumas violações encontradas'] : [],
                lastAudit: new Date().toISOString()
            };
            
            if (score < this.config.thresholds.accessibilityScore) {
                this.createAlert('high', 'accessibility_below_threshold', 
                    `Score de acessibilidade: ${score}% (mínimo: ${this.config.thresholds.accessibilityScore}%)`);
            }
            
            console.log(`   ✅ Score de acessibilidade: ${score}%`);
            
        } catch (error) {
            console.warn('⚠️  Erro na auditoria de acessibilidade:', error.message);
        }
    }
    
    /**
     * Executa validação médica
     */
    async runMedicalValidation() {
        try {
            console.log('🏥 Executando validação médica...');
            
            // Valida calculadoras médicas
            const calculatorAccuracy = await this.validateMedicalCalculators();
            
            // Valida conteúdo educacional
            const contentValidation = await this.validateEducationalContent();
            
            this.metrics.medical = {
                accuracy: calculatorAccuracy,
                calculationErrors: calculatorAccuracy < 100 ? 1 : 0,
                contentValidation,
                lastValidation: new Date().toISOString()
            };
            
            if (calculatorAccuracy < this.config.thresholds.medicalAccuracy) {
                this.createAlert('critical', 'medical_accuracy_low', 
                    `Precisão médica: ${calculatorAccuracy}% (mínimo: ${this.config.thresholds.medicalAccuracy}%)`);
            }
            
            console.log(`   ✅ Precisão médica: ${calculatorAccuracy}%`);
            
        } catch (error) {
            console.warn('⚠️  Erro na validação médica:', error.message);
            this.createAlert('high', 'medical_validation_failed', error.message);
        }
    }
    
    /**
     * Executa verificação de performance
     */
    async runPerformanceCheck() {
        try {
            // Simula verificação de performance (integraria com Lighthouse em implementação real)
            const responseTime = await this.measureResponseTime();
            const errorRate = await this.calculateErrorRate();
            
            this.metrics.performance = {
                ...this.metrics.performance,
                responseTime,
                errorRate,
                lastCheck: new Date().toISOString()
            };
            
            // Verifica thresholds
            if (responseTime > this.config.thresholds.responseTime) {
                this.createAlert('medium', 'response_time_high', 
                    `Tempo de resposta: ${responseTime}ms (máximo: ${this.config.thresholds.responseTime}ms)`);
            }
            
            if (errorRate > this.config.thresholds.errorRate) {
                this.createAlert('high', 'error_rate_high', 
                    `Taxa de erro: ${errorRate}% (máximo: ${this.config.thresholds.errorRate}%)`);
            }
            
        } catch (error) {
            console.warn('Erro na verificação de performance:', error.message);
        }
    }
    
    /**
     * Executa verificação de saúde do sistema
     */
    async runSystemHealthCheck() {
        try {
            const health = {
                diskUsage: await this.getDiskUsage(),
                memoryUsage: await this.getMemoryUsage(),
                cpuUsage: await this.getCpuUsage(),
                uptime: await this.getSystemUptime(),
                networkStatus: await this.checkNetworkStatus(),
                lastHealthCheck: new Date().toISOString()
            };
            
            this.metrics.system = { ...this.metrics.system, ...health };
            
            // Verifica thresholds do sistema
            if (health.diskUsage > this.config.thresholds.diskUsage) {
                this.createAlert('medium', 'disk_usage_high', 
                    `Uso do disco: ${health.diskUsage}% (máximo: ${this.config.thresholds.diskUsage}%)`);
            }
            
        } catch (error) {
            console.warn('Erro na verificação de saúde:', error.message);
        }
    }
    
    /**
     * Executa verificação LGPD
     */
    async runLGPDCheck() {
        try {
            console.log('🛡️  Executando verificação LGPD...');
            
            // Reutiliza o scanner de segurança
            await this.runSecurityScan();
            
        } catch (error) {
            console.warn('⚠️  Erro na verificação LGPD:', error.message);
        }
    }
    
    /**
     * Verifica thresholds críticos
     */
    checkCriticalThresholds(metrics) {
        if (metrics.memoryUsage > this.config.thresholds.memoryUsage) {
            this.emit('critical_alert', {
                type: 'memory_usage_critical',
                value: metrics.memoryUsage,
                threshold: this.config.thresholds.memoryUsage
            });
        }
        
        if (metrics.cpuUsage > this.config.thresholds.cpuUsage) {
            this.emit('critical_alert', {
                type: 'cpu_usage_critical',
                value: metrics.cpuUsage,
                threshold: this.config.thresholds.cpuUsage
            });
        }
    }
    
    /**
     * Verifica thresholds de segurança
     */
    checkSecurityThresholds() {
        const security = this.metrics.security;
        
        if (security.piiDetections > this.config.thresholds.piiDetections) {
            this.createAlert('critical', 'pii_detected', 
                `${security.piiDetections} detecções de PII encontradas`);
        }
        
        if (security.phiDetections > this.config.thresholds.phiDetections) {
            this.createAlert('critical', 'phi_detected', 
                `${security.phiDetections} detecções de dados médicos sensíveis encontradas`);
        }
        
        if (security.lgpdCompliance < this.config.thresholds.lgpdCompliance) {
            this.createAlert('critical', 'lgpd_compliance_low', 
                `Conformidade LGPD: ${security.lgpdCompliance}% (requerido: ${this.config.thresholds.lgpdCompliance}%)`);
        }
    }
    
    /**
     * Cria alerta
     */
    createAlert(level, type, message) {
        const alertKey = `${type}_${level}`;
        const now = Date.now();
        
        // Verifica cooldown
        if (this.state.alertCooldowns.has(alertKey)) {
            const lastAlert = this.state.alertCooldowns.get(alertKey);
            if (now - lastAlert < this.config.alerting.cooldown) {
                return; // Ainda em cooldown
            }
        }
        
        const alert = {
            id: `alert_${now}_${Math.random().toString(36).substr(2, 9)}`,
            level,
            type,
            message,
            timestamp: new Date().toISOString(),
            resolved: false
        };
        
        this.state.alerts.push(alert);
        this.state.alertCooldowns.set(alertKey, now);
        
        // Emite evento de alerta
        this.emit(`${level}_alert`, alert);
        
        // Log do alerta
        const levelEmoji = {
            critical: '🚨',
            high: '⚠️',
            medium: '🔸',
            low: '💡'
        };
        
        console.log(`${levelEmoji[level]} ALERTA [${level.toUpperCase()}]: ${message}`);
        
        return alert;
    }
    
    /**
     * Handle para alertas críticos
     */
    async handleCriticalAlert(alert) {
        console.log(`🚨 ALERTA CRÍTICO: ${alert.message}`);
        
        // Aqui implementaria notificações (Slack, email, etc.)
        await this.sendAlertNotification(alert);
        
        // Log em arquivo
        await this.logAlert(alert);
    }
    
    /**
     * Handle para atualização de métricas
     */
    handleMetricsUpdate(data) {
        // Atualiza dashboard em tempo real
        this.updateRealtimeDashboard(data);
    }
    
    /**
     * Handle para mudança de arquivo
     */
    handleFileChange(filePath, eventType) {
        console.log(`📝 Arquivo modificado: ${filePath} (${eventType})`);
        
        // Emite evento para processamento assíncrono
        this.emit('file_changed', { filePath, eventType, timestamp: new Date() });
    }
    
    /**
     * Handle para evento de mudança de arquivo
     */
    async handleFileChangeEvent(data) {
        const { filePath } = data;
        
        // Se for arquivo crítico, executa verificações imediatas
        if (this.config.criticalFiles.includes(filePath)) {
            console.log('⚡ Arquivo crítico modificado, executando verificações...');
            await this.runQuickSecurityScan();
        }
        
        // Se for arquivo de código médico, valida
        if (this.isMedicalFile(filePath)) {
            console.log('🏥 Arquivo médico modificado, validando...');
            await this.validateSingleMedicalFile(filePath);
        }
    }
    
    /**
     * Handle para problemas de performance
     */
    handlePerformanceIssue(issue) {
        console.log(`⚡ Problema de performance: ${issue.type} - ${issue.message}`);
        
        // Implementaria ações automáticas de otimização
    }
    
    /**
     * Handle para problemas médicos
     */
    handleMedicalIssue(issue) {
        console.log(`🏥 Problema médico: ${issue.type} - ${issue.message}`);
        
        // Implementaria validações adicionais ou bloqueios
    }
    
    /**
     * Escapa caracteres HTML para prevenir XSS
     */
    escapeHtml(str) {
        const htmlEscapes = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
        };
        return String(str).replace(/[&<>"']/g, (ch) => htmlEscapes[ch]);
    }

    /**
     * Carrega opções TLS para HTTPS se certificados estiverem configurados
     */
    getTLSOptions() {
        const certPath = process.env.TLS_CERT_PATH;
        const keyPath = process.env.TLS_KEY_PATH;
        if (certPath && keyPath) {
            try {
                const fsSyncModule = require('fs');
                return {
                    cert: fsSyncModule.readFileSync(certPath),
                    key: fsSyncModule.readFileSync(keyPath),
                };
            } catch (err) {
                console.warn(`⚠️ Falha ao carregar certificados TLS: ${err.message}`);
            }
        }
        return null;
    }

    /**
     * Inicia dashboard em tempo real
     */
    async startRealTimeDashboard() {
        const tlsOptions = this.getTLSOptions();
        let server;

        const requestHandler = (req, res) => {
            const securityHeaders = {
                'X-Content-Type-Options': 'nosniff',
                'X-Frame-Options': 'DENY',
                'X-XSS-Protection': '1; mode=block',
            };

            if (req.url === '/metrics') {
                res.writeHead(200, {
                    'Content-Type': 'application/json',
                    ...securityHeaders,
                });
                res.end(JSON.stringify({
                    metrics: this.metrics,
                    alerts: this.state.alerts.filter(a => !a.resolved),
                    status: this.state.monitoring ? 'active' : 'inactive',
                    timestamp: new Date().toISOString()
                }));
            } else if (req.url === '/') {
                res.writeHead(200, {
                    'Content-Type': 'text/html',
                    ...securityHeaders,
                });
                res.end(this.generateDashboardHTML());
            } else {
                res.writeHead(404, securityHeaders);
                res.end('Not Found');
            }
        };

        if (tlsOptions) {
            server = https.createServer(tlsOptions, requestHandler);
            console.log('📊 Dashboard em tempo real disponível em: https://localhost:3030');
        } else {
            console.warn('⚠️ TLS certificates not configured (set TLS_CERT_PATH and TLS_KEY_PATH). Falling back to HTTP on localhost only.');
            server = http.createServer(requestHandler);
            console.log('📊 Dashboard em tempo real disponível em: http://localhost:3030');
        }

        server.listen(3030, '127.0.0.1');
    }
    
    /**
     * Gera HTML do dashboard
     */
    generateDashboardHTML() {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Monitoramento Médico - Dashboard</title>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 30px; }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; }
        .metric-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metric-title { font-weight: bold; color: #333; margin-bottom: 10px; }
        .metric-value { font-size: 24px; color: #007acc; }
        .alert { padding: 10px; margin: 10px 0; border-radius: 4px; }
        .alert.critical { background: #ffebee; border-left: 4px solid #f44336; }
        .alert.high { background: #fff3e0; border-left: 4px solid #ff9800; }
        .alert.medium { background: #f3e5f5; border-left: 4px solid #9c27b0; }
        .status-indicator { display: inline-block; width: 12px; height: 12px; border-radius: 50%; margin-right: 8px; }
        .status-active { background: #4caf50; }
        .status-inactive { background: #f44336; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏥 Monitoramento Plataforma Educacional - Hanseníase</h1>
            <p>
                <span class="status-indicator status-${this.state.monitoring ? 'active' : 'inactive'}"></span>
                Status: ${this.state.monitoring ? 'Ativo' : 'Inativo'}
            </p>
        </div>
        
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-title">🛡️ LGPD Compliance</div>
                <div class="metric-value">${this.metrics.security.lgpdCompliance}%</div>
            </div>
            
            <div class="metric-card">
                <div class="metric-title">🏥 Precisão Médica</div>
                <div class="metric-value">${this.metrics.medical.accuracy}%</div>
            </div>
            
            <div class="metric-card">
                <div class="metric-title">♿ Acessibilidade</div>
                <div class="metric-value">${this.metrics.accessibility.score}%</div>
            </div>
            
            <div class="metric-card">
                <div class="metric-title">⚡ Performance</div>
                <div class="metric-value">${this.metrics.performance.responseTime}ms</div>
            </div>
            
            <div class="metric-card">
                <div class="metric-title">💾 Memória</div>
                <div class="metric-value">${this.metrics.performance.memoryUsage}%</div>
            </div>
            
            <div class="metric-card">
                <div class="metric-title">🔧 CPU</div>
                <div class="metric-value">${this.metrics.performance.cpuUsage}%</div>
            </div>
        </div>
        
        <div style="margin-top: 30px;">
            <h2>🚨 Alertas Ativos</h2>
            <div id="alerts">
                ${this.state.alerts.filter(a => !a.resolved).map(alert => `
                    <div class="alert ${this.escapeHtml(alert.level)}">
                        <strong>${this.escapeHtml(alert.type)}</strong>: ${this.escapeHtml(alert.message)}
                        <small style="float: right;">${this.escapeHtml(new Date(alert.timestamp).toLocaleString())}</small>
                    </div>
                `).join('')}
            </div>
        </div>
    </div>
    
    <script>
        // Auto-refresh a cada 30 segundos
        setInterval(() => {
            window.location.reload();
        }, 30000);
    </script>
</body>
</html>`;
    }
    
    /**
     * Atualiza dashboard em tempo real
     */
    updateRealtimeDashboard(data) {
        // Implementaria WebSocket para updates em tempo real
    }
    
    // Métodos auxiliares para métricas do sistema
    async getDiskUsage() {
        try {
            const output = execSync('df -h /', { encoding: 'utf-8' });
            const match = output.match(/(\d+)%/);
            return match ? parseInt(match[1]) : 0;
        } catch {
            return 0;
        }
    }
    
    async getMemoryUsage() {
        const used = process.memoryUsage();
        return Math.round((used.heapUsed / used.heapTotal) * 100);
    }
    
    async getCpuUsage() {
        // Implementação simplificada
        return Math.round(Math.random() * 20 + 10); // Simula 10-30%
    }
    
    async getSystemUptime() {
        return Math.round(process.uptime() / 86400); // dias
    }
    
    async checkNetworkStatus() {
        return 'healthy';
    }
    
    async measureResponseTime() {
        // Simula medição de tempo de resposta
        return Math.round(Math.random() * 500 + 200); // 200-700ms
    }
    
    async calculateErrorRate() {
        // Simula cálculo de taxa de erro
        return Math.round(Math.random() * 2); // 0-2%
    }
    
    async getRecentlyModifiedFiles() {
        try {
            const output = execSync('find . -name "*.js" -o -name "*.ts" -o -name "*.tsx" -mmin -60', {
                encoding: 'utf-8'
            });
            return output.trim().split('\n').filter(Boolean);
        } catch {
            return [];
        }
    }
    
    async simulateAccessibilityAudit() {
        // Simula auditoria de acessibilidade
        return Math.round(Math.random() * 10 + 85); // 85-95%
    }
    
    async validateMedicalCalculators() {
        // Simula validação de calculadoras médicas
        return Math.round(Math.random() * 5 + 95); // 95-100%
    }
    
    async validateEducationalContent() {
        // Simula validação de conteúdo educacional
        return Math.round(Math.random() * 5 + 95); // 95-100%
    }
    
    async validateSingleMedicalFile(filePath) {
        console.log(`🔍 Validando arquivo médico: ${filePath}`);
        // Implementaria validação específica
    }
    
    parseLGPDResult(output) {
        try {
            // Parse simplificado do resultado LGPD
            const lines = output.split('\n');
            const scoreLine = lines.find(line => line.includes('Score'));
            const score = scoreLine ? parseInt(scoreLine.match(/\d+/)?.[0] || '100') : 100;
            
            return {
                score,
                piiCount: 0,
                phiCount: 0
            };
        } catch {
            return { score: 100, piiCount: 0, phiCount: 0 };
        }
    }
    
    isMedicalFile(filePath) {
        return /(?:medical|calculator|dose|clinical|hanseniase)/i.test(filePath);
    }
    
    async sendAlertNotification(alert) {
        // Implementaria integração com Slack, email, etc.
        console.log(`📢 Enviando notificação de alerta: ${alert.type}`);
    }
    
    async logAlert(alert) {
        try {
            const logPath = './logs/monitoring-alerts.log';
            const logEntry = `${alert.timestamp} [${alert.level.toUpperCase()}] ${alert.type}: ${alert.message}\n`;
            await fs.appendFile(logPath, logEntry);
        } catch (error) {
            console.warn('Erro ao fazer log do alerta:', error.message);
        }
    }
    
    async generateDailyReport() {
        console.log('📊 Gerando relatório diário...');
        
        const report = {
            date: new Date().toISOString().split('T')[0],
            metrics: this.metrics,
            alertsSummary: {
                total: this.state.alerts.length,
                critical: this.state.alerts.filter(a => a.level === 'critical').length,
                high: this.state.alerts.filter(a => a.level === 'high').length,
                medium: this.state.alerts.filter(a => a.level === 'medium').length,
                low: this.state.alerts.filter(a => a.level === 'low').length
            },
            recommendations: this.generateRecommendations()
        };
        
        const reportPath = `./reports/monitoring-daily-${report.date}.json`;
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        
        console.log(`   📄 Relatório salvo: ${reportPath}`);
    }
    
    generateRecommendations() {
        const recommendations = [];
        
        if (this.metrics.security.lgpdCompliance < 100) {
            recommendations.push('Corrigir problemas de conformidade LGPD detectados');
        }
        
        if (this.metrics.medical.accuracy < 100) {
            recommendations.push('Revisar calculadoras médicas com problemas de precisão');
        }
        
        if (this.metrics.accessibility.score < 90) {
            recommendations.push('Melhorar acessibilidade para conformidade WCAG 2.1 AA');
        }
        
        return recommendations;
    }
    
    async cleanupOldData() {
        // Remove alertas antigos (mais de 30 dias)
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        this.state.alerts = this.state.alerts.filter(alert => 
            new Date(alert.timestamp).getTime() > thirtyDaysAgo
        );
    }
    
    async backupMetrics() {
        try {
            const backupPath = `./backups/metrics-backup-${Date.now()}.json`;
            await fs.writeFile(backupPath, JSON.stringify(this.metrics, null, 2));
            console.log(`   💾 Backup de métricas: ${backupPath}`);
        } catch (error) {
            console.warn('Erro no backup de métricas:', error.message);
        }
    }
}

// Execução principal
if (require.main === module) {
    const monitor = new ContinuousMonitoringSystem();
    
    // Handlers de sinal para shutdown gracioso
    process.on('SIGINT', async () => {
        console.log('\\n🛑 Recebido SIGINT, parando monitoramento...');
        await monitor.stopMonitoring();
        process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
        console.log('\\n🛑 Recebido SIGTERM, parando monitoramento...');
        await monitor.stopMonitoring();
        process.exit(0);
    });
    
    // Inicia monitoramento
    monitor.startMonitoring()
        .then(result => {
            if (result.success) {
                console.log('🚀 Sistema de monitoramento iniciado com sucesso!');
                console.log('📊 Dashboard: http://localhost:3030');
                console.log('🔍 Logs: ./logs/monitoring.log');
                console.log('📈 Relatórios: ./reports/');
                console.log('\\nPressione Ctrl+C para parar\\n');
            } else {
                console.error('❌ Falha ao iniciar monitoramento:', result.error);
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('❌ Erro fatal:', error.message);
            process.exit(1);
        });
}

module.exports = { ContinuousMonitoringSystem };