/**
 * Sistema de Alertas Críticos para Ambiente de Saúde
 * Plataforma Educacional de Hanseníase
 * Alertas inteligentes específicos para operações médicas críticas
 */

import { EventEmitter } from 'events';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export class MedicalCriticalAlerts extends EventEmitter {
    constructor() {
        super();
        
        this.alerts = new Map();
        this.alertHistory = [];
        this.escalationQueue = [];
        this.suppressions = new Map();
        this.notificationChannels = new Map();
        
        this.config = {
            // Configurações críticas médicas
            medicalPriorities: {
                PATIENT_DATA_BREACH: 'CRITICAL',
                MEDICAL_CALCULATION_ERROR: 'CRITICAL',
                PROTOCOL_UNAVAILABLE: 'CRITICAL',
                GASNELIO_PERSONA_DOWN: 'HIGH',
                LGPD_COMPLIANCE_VIOLATION: 'CRITICAL',
                DATABASE_CONNECTION_LOST: 'CRITICAL',
                SYSTEM_DOWN: 'CRITICAL',
                SLA_BREACH: 'CRITICAL',
                AUDIT_LOG_FAILURE: 'HIGH',
                BACKUP_FAILURE: 'HIGH',
                SECURITY_INCIDENT: 'CRITICAL'
            },
            
            // Limites de alerta médico
            alertThresholds: {
                responseTime: 2000, // ms
                errorRate: 0.01, // 1%
                memoryUsage: 85, // %
                cpuUsage: 80, // %
                diskUsage: 90, // %
                activeUsers: 1000,
                databaseConnections: 90, // %
                patientDataAccessTime: 1000, // ms
                medicalCalculationTime: 1500, // ms
                protocolLookupTime: 800, // ms
                gasnelioResponseTime: 3000, // ms
                auditLogLatency: 500 // ms
            },
            
            // Configuração de escalação médica
            escalation: {
                CRITICAL: {
                    immediate: ['sms', 'phone', 'slack'],
                    delay: 0,
                    retryInterval: 60000, // 1 minuto
                    maxRetries: 5
                },
                HIGH: {
                    immediate: ['slack', 'email'],
                    delay: 300000, // 5 minutos
                    retryInterval: 300000, // 5 minutos
                    maxRetries: 3
                },
                MEDIUM: {
                    immediate: ['email'],
                    delay: 900000, // 15 minutos
                    retryInterval: 1800000, // 30 minutos
                    maxRetries: 2
                }
            },
            
            // Supressão inteligente
            suppression: {
                duplicateWindow: 300000, // 5 minutos
                maintenanceMode: false,
                quietHours: { start: 23, end: 6 }, // 23:00 às 06:00
                weekendSuppress: false // Nunca suprimir em ambiente médico
            },
            
            // Canais de notificação médica
            channels: {
                slack: {
                    enabled: true,
                    webhook: process.env.SLACK_WEBHOOK_URL,
                    channel: '#medical-alerts',
                    priority: ['CRITICAL', 'HIGH']
                },
                email: {
                    enabled: true,
                    smtp: process.env.SMTP_SERVER,
                    recipients: process.env.MEDICAL_ALERT_EMAILS?.split(',') || [],
                    priority: ['CRITICAL', 'HIGH', 'MEDIUM']
                },
                sms: {
                    enabled: true,
                    provider: process.env.SMS_PROVIDER,
                    numbers: process.env.EMERGENCY_PHONE_NUMBERS?.split(',') || [],
                    priority: ['CRITICAL']
                },
                phone: {
                    enabled: false, // Configurar conforme necessário
                    numbers: process.env.EMERGENCY_PHONE_NUMBERS?.split(',') || [],
                    priority: ['CRITICAL']
                }
            }
        };
        
        this.isActive = false;
        this.setupEventListeners();
    }

    /**
     * Ativar sistema de alertas médicos
     */
    async activate() {
        if (this.isActive) {
            console.log('⚠️ [ALERTS] Sistema de alertas já está ativo');
            return;
        }
        
        console.log('🚨 [ALERTS] Ativando sistema de alertas médicos críticos...');
        
        this.isActive = true;
        
        // Inicializar sistema
        await this.initializeAlertSystem();
        
        // Configurar canais de notificação
        await this.setupNotificationChannels();
        
        // Iniciar monitoramento de escalação
        this.startEscalationMonitoring();
        
        // Configurar limpeza automática
        this.setupAutomaticCleanup();
        
        console.log('✅ [ALERTS] Sistema de alertas médicos ativo');
        
        this.emit('system_activated', {
            timestamp: new Date().toISOString(),
            medicalMode: true,
            criticalChannels: Object.keys(this.config.channels).filter(ch => this.config.channels[ch].enabled)
        });
    }

    /**
     * Desativar sistema de alertas
     */
    async deactivate() {
        if (!this.isActive) {
            console.log('⚠️ [ALERTS] Sistema de alertas já está inativo');
            return;
        }
        
        console.log('🛑 [ALERTS] Desativando sistema de alertas médicos...');
        
        this.isActive = false;
        
        // Parar monitoramento
        if (this.escalationInterval) clearInterval(this.escalationInterval);
        if (this.cleanupInterval) clearInterval(this.cleanupInterval);
        
        // Resolver alertas pendentes
        await this.resolveAllPendingAlerts();
        
        console.log('✅ [ALERTS] Sistema de alertas médicos desativado');
        
        this.emit('system_deactivated', {
            timestamp: new Date().toISOString(),
            alertsProcessed: this.alertHistory.length
        });
    }

    /**
     * Criar alerta médico crítico
     */
    async createAlert(type, data, priority = null) {
        if (!this.isActive) {
            console.log('⚠️ [ALERTS] Sistema inativo - alerta não processado');
            return null;
        }
        
        const alertId = this.generateAlertId();
        const alertPriority = priority || this.config.medicalPriorities[type] || 'MEDIUM';
        
        const alert = {
            id: alertId,
            type,
            priority: alertPriority,
            timestamp: new Date().toISOString(),
            timestampMs: Date.now(),
            data,
            status: 'ACTIVE',
            
            // Contexto médico
            medicalContext: {
                patientDataAffected: this.assessPatientDataImpact(type, data),
                clinicalOperationsAffected: this.assessClinicalImpact(type, data),
                lgpdComplianceRisk: this.assessLGPDRisk(type, data),
                regulatoryImpact: this.assessRegulatoryImpact(type, data)
            },
            
            // Escalação e notificações
            escalation: {
                level: 0,
                attempts: 0,
                nextEscalation: null,
                notificationsSent: []
            },
            
            // Metadata
            source: 'MedicalCriticalAlerts',
            environment: process.env.NODE_ENV || 'production',
            resolved: false,
            resolvedAt: null,
            resolvedBy: null,
            acknowledgments: []
        };
        
        // Verificar supressão
        if (await this.shouldSuppressAlert(alert)) {
            console.log(`🔇 [SUPPRESS] Alerta ${alertId} suprimido: ${type}`);
            return null;
        }
        
        // Armazenar alerta
        this.alerts.set(alertId, alert);
        this.alertHistory.push({ ...alert });
        
        console.log(`🚨 [ALERT] Novo alerta ${alertPriority}: ${type} (${alertId})`);
        
        // Processar alerta imediatamente
        await this.processAlert(alert);
        
        // Adicionar à fila de escalação se necessário
        if (alertPriority === 'CRITICAL' || alertPriority === 'HIGH') {
            this.escalationQueue.push(alertId);
        }
        
        this.emit('alert_created', alert);
        
        return alert;
    }

    /**
     * Processar alerta médico
     */
    async processAlert(alert) {
        try {
            // Log de auditoria para compliance
            await this.logAlertForAudit(alert);
            
            // Determinar canais de notificação
            const channels = this.getNotificationChannels(alert.priority);
            
            // Enviar notificações imediatas
            for (const channel of channels) {
                try {
                    await this.sendNotification(channel, alert);
                    alert.escalation.notificationsSent.push({
                        channel,
                        timestamp: new Date().toISOString(),
                        status: 'sent'
                    });
                } catch (error) {
                    console.error(`❌ [NOTIFICATION] Falha no canal ${channel}:`, error.message);
                    alert.escalation.notificationsSent.push({
                        channel,
                        timestamp: new Date().toISOString(),
                        status: 'failed',
                        error: error.message
                    });
                }
            }
            
            // Configurar próxima escalação
            this.scheduleNextEscalation(alert);
            
        } catch (error) {
            console.error(`❌ [ALERT PROCESSING] Erro ao processar alerta ${alert.id}:`, error.message);
        }
    }

    /**
     * Enviar notificação por canal específico
     */
    async sendNotification(channel, alert) {
        const channelConfig = this.config.channels[channel];
        
        if (!channelConfig || !channelConfig.enabled) {
            throw new Error(`Canal ${channel} não configurado ou desabilitado`);
        }
        
        const message = await this.formatAlertMessage(alert, channel);
        
        switch (channel) {
            case 'slack':
                await this.sendSlackNotification(message, alert);
                break;
                
            case 'email':
                await this.sendEmailNotification(message, alert);
                break;
                
            case 'sms':
                await this.sendSMSNotification(message, alert);
                break;
                
            case 'phone':
                await this.makePhoneCall(message, alert);
                break;
                
            default:
                throw new Error(`Canal de notificação não suportado: ${channel}`);
        }
        
        console.log(`📨 [${channel.toUpperCase()}] Notificação enviada para alerta ${alert.id}`);
    }

    /**
     * Formatar mensagem de alerta para canal específico
     */
    async formatAlertMessage(alert, channel) {
        const baseMessage = {
            alertId: alert.id,
            type: alert.type,
            priority: alert.priority,
            timestamp: alert.timestamp,
            medicalContext: alert.medicalContext
        };
        
        switch (channel) {
            case 'slack':
                return this.formatSlackMessage(alert, baseMessage);
                
            case 'email':
                return this.formatEmailMessage(alert, baseMessage);
                
            case 'sms':
                return this.formatSMSMessage(alert, baseMessage);
                
            case 'phone':
                return this.formatPhoneMessage(alert, baseMessage);
                
            default:
                return baseMessage;
        }
    }

    /**
     * Formatar mensagem Slack
     */
    formatSlackMessage(alert, baseMessage) {
        const emoji = this.getPriorityEmoji(alert.priority);
        const color = this.getPriorityColor(alert.priority);
        
        return {
            text: `${emoji} ALERTA MÉDICO ${alert.priority}`,
            attachments: [
                {
                    color,
                    title: `${alert.type} (${alert.id})`,
                    text: this.getAlertDescription(alert),
                    fields: [
                        {
                            title: 'Impacto nos Dados de Pacientes',
                            value: alert.medicalContext.patientDataAffected ? '🔴 SIM' : '🟢 NÃO',
                            short: true
                        },
                        {
                            title: 'Operações Clínicas',
                            value: alert.medicalContext.clinicalOperationsAffected ? '🔴 AFETADAS' : '🟢 NORMAIS',
                            short: true
                        },
                        {
                            title: 'Compliance LGPD',
                            value: alert.medicalContext.lgpdComplianceRisk ? '🔴 RISCO' : '🟢 OK',
                            short: true
                        },
                        {
                            title: 'Impacto Regulatório',
                            value: alert.medicalContext.regulatoryImpact || 'Baixo',
                            short: true
                        },
                        {
                            title: 'Timestamp',
                            value: alert.timestamp,
                            short: false
                        }
                    ],
                    footer: 'Sistema de Alertas Médicos',
                    ts: Math.floor(alert.timestampMs / 1000)
                }
            ]
        };
    }

    /**
     * Formatar mensagem de email
     */
    formatEmailMessage(alert, baseMessage) {
        return {
            subject: `🚨 ALERTA MÉDICO ${alert.priority}: ${alert.type}`,
            html: `
                <h2 style="color: ${this.getPriorityColor(alert.priority)};">
                    🏥 ALERTA MÉDICO ${alert.priority}
                </h2>
                
                <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0;">
                    <h3>${alert.type}</h3>
                    <p><strong>ID do Alerta:</strong> ${alert.id}</p>
                    <p><strong>Timestamp:</strong> ${alert.timestamp}</p>
                    <p><strong>Descrição:</strong> ${this.getAlertDescription(alert)}</p>
                </div>
                
                <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 10px 0;">
                    <h4>🏥 Contexto Médico</h4>
                    <ul>
                        <li><strong>Dados de Pacientes Afetados:</strong> ${alert.medicalContext.patientDataAffected ? '🔴 SIM' : '🟢 NÃO'}</li>
                        <li><strong>Operações Clínicas:</strong> ${alert.medicalContext.clinicalOperationsAffected ? '🔴 AFETADAS' : '🟢 NORMAIS'}</li>
                        <li><strong>Risco LGPD:</strong> ${alert.medicalContext.lgpdComplianceRisk ? '🔴 ALTO' : '🟢 BAIXO'}</li>
                        <li><strong>Impacto Regulatório:</strong> ${alert.medicalContext.regulatoryImpact || 'Baixo'}</li>
                    </ul>
                </div>
                
                <div style="background: #d1ecf1; padding: 15px; border-radius: 5px; margin: 10px 0;">
                    <h4>📊 Dados Técnicos</h4>
                    <pre style="background: #f8f9fa; padding: 10px; border-radius: 3px;">
${JSON.stringify(alert.data, null, 2)}
                    </pre>
                </div>
                
                <hr style="margin: 20px 0;">
                <p style="color: #666; font-size: 12px;">
                    Sistema de Alertas Médicos - Plataforma Educacional de Hanseníase<br>
                    Este é um alerta automático. Não responda a este email.
                </p>
            `,
            text: `
ALERTA MÉDICO ${alert.priority}: ${alert.type}

ID: ${alert.id}
Timestamp: ${alert.timestamp}
Descrição: ${this.getAlertDescription(alert)}

Contexto Médico:
- Dados de Pacientes: ${alert.medicalContext.patientDataAffected ? 'AFETADOS' : 'OK'}
- Operações Clínicas: ${alert.medicalContext.clinicalOperationsAffected ? 'AFETADAS' : 'NORMAIS'}
- LGPD: ${alert.medicalContext.lgpdComplianceRisk ? 'RISCO' : 'OK'}
- Regulatório: ${alert.medicalContext.regulatoryImpact || 'Baixo'}

Dados Técnicos:
${JSON.stringify(alert.data, null, 2)}
            `
        };
    }

    /**
     * Formatar mensagem SMS
     */
    formatSMSMessage(alert, baseMessage) {
        return `🚨 ALERTA MÉDICO ${alert.priority}: ${alert.type}
ID: ${alert.id}
${this.getAlertDescription(alert)}
Pacientes: ${alert.medicalContext.patientDataAffected ? 'AFETADOS' : 'OK'}
LGPD: ${alert.medicalContext.lgpdComplianceRisk ? 'RISCO' : 'OK'}
${alert.timestamp}`;
    }

    /**
     * Resolver alerta
     */
    async resolveAlert(alertId, resolvedBy = 'system', reason = null) {
        const alert = this.alerts.get(alertId);
        
        if (!alert) {
            throw new Error(`Alerta não encontrado: ${alertId}`);
        }
        
        if (alert.resolved) {
            console.log(`⚠️ [RESOLVE] Alerta ${alertId} já foi resolvido`);
            return alert;
        }
        
        // Marcar como resolvido
        alert.resolved = true;
        alert.resolvedAt = new Date().toISOString();
        alert.resolvedBy = resolvedBy;
        alert.status = 'RESOLVED';
        
        if (reason) {
            alert.resolutionReason = reason;
        }
        
        // Remover da fila de escalação
        const queueIndex = this.escalationQueue.indexOf(alertId);
        if (queueIndex > -1) {
            this.escalationQueue.splice(queueIndex, 1);
        }
        
        console.log(`✅ [RESOLVE] Alerta ${alertId} resolvido por ${resolvedBy}`);
        
        // Log de auditoria
        await this.logAlertResolution(alert);
        
        // Notificar resolução se crítico
        if (alert.priority === 'CRITICAL') {
            await this.notifyAlertResolution(alert);
        }
        
        this.emit('alert_resolved', alert);
        
        return alert;
    }

    /**
     * Reconhecer alerta
     */
    async acknowledgeAlert(alertId, acknowledgedBy, message = null) {
        const alert = this.alerts.get(alertId);
        
        if (!alert) {
            throw new Error(`Alerta não encontrado: ${alertId}`);
        }
        
        const acknowledgment = {
            acknowledgedBy,
            timestamp: new Date().toISOString(),
            message
        };
        
        alert.acknowledgments.push(acknowledgment);
        
        console.log(`👍 [ACK] Alerta ${alertId} reconhecido por ${acknowledgedBy}`);
        
        this.emit('alert_acknowledged', { alert, acknowledgment });
        
        return acknowledgment;
    }

    // Métodos de avaliação de impacto médico
    assessPatientDataImpact(type, data) {
        const patientDataTypes = [
            'PATIENT_DATA_BREACH',
            'DATABASE_CONNECTION_LOST',
            'LGPD_COMPLIANCE_VIOLATION',
            'SECURITY_INCIDENT'
        ];
        
        return patientDataTypes.includes(type);
    }

    assessClinicalImpact(type, data) {
        const clinicalTypes = [
            'MEDICAL_CALCULATION_ERROR',
            'PROTOCOL_UNAVAILABLE',
            'GASNELIO_PERSONA_DOWN',
            'SYSTEM_DOWN'
        ];
        
        return clinicalTypes.includes(type);
    }

    assessLGPDRisk(type, data) {
        const lgpdRiskTypes = [
            'PATIENT_DATA_BREACH',
            'LGPD_COMPLIANCE_VIOLATION',
            'AUDIT_LOG_FAILURE',
            'SECURITY_INCIDENT'
        ];
        
        return lgpdRiskTypes.includes(type);
    }

    assessRegulatoryImpact(type, data) {
        const highImpactTypes = [
            'PATIENT_DATA_BREACH',
            'MEDICAL_CALCULATION_ERROR',
            'LGPD_COMPLIANCE_VIOLATION'
        ];
        
        if (highImpactTypes.includes(type)) return 'Alto';
        
        const mediumImpactTypes = [
            'PROTOCOL_UNAVAILABLE',
            'AUDIT_LOG_FAILURE',
            'BACKUP_FAILURE'
        ];
        
        if (mediumImpactTypes.includes(type)) return 'Médio';
        
        return 'Baixo';
    }

    // Métodos utilitários
    generateAlertId() {
        const timestamp = Date.now();
        const random = crypto.randomBytes(4).toString('hex');
        return `MED-${timestamp}-${random.toUpperCase()}`;
    }

    getPriorityEmoji(priority) {
        const emojis = {
            CRITICAL: '🔥',
            HIGH: '🚨',
            MEDIUM: '⚠️',
            LOW: 'ℹ️'
        };
        return emojis[priority] || '❓';
    }

    getPriorityColor(priority) {
        const colors = {
            CRITICAL: '#dc3545',
            HIGH: '#fd7e14',
            MEDIUM: '#ffc107',
            LOW: '#17a2b8'
        };
        return colors[priority] || '#6c757d';
    }

    getAlertDescription(alert) {
        const descriptions = {
            PATIENT_DATA_BREACH: 'Possível violação de dados de pacientes detectada',
            MEDICAL_CALCULATION_ERROR: 'Erro nas calculadoras médicas críticas',
            PROTOCOL_UNAVAILABLE: 'Protocolos médicos indisponíveis',
            GASNELIO_PERSONA_DOWN: 'Dr. Gasnelio não está respondendo',
            LGPD_COMPLIANCE_VIOLATION: 'Violação de compliance LGPD detectada',
            DATABASE_CONNECTION_LOST: 'Conexão com banco de dados perdida',
            SYSTEM_DOWN: 'Sistema principal indisponível',
            SLA_BREACH: 'SLA médico violado',
            AUDIT_LOG_FAILURE: 'Falha na criação de logs de auditoria',
            BACKUP_FAILURE: 'Falha no sistema de backup',
            SECURITY_INCIDENT: 'Incidente de segurança detectado'
        };
        
        return descriptions[alert.type] || `Alerta: ${alert.type}`;
    }

    getNotificationChannels(priority) {
        const channels = [];
        
        for (const [channel, config] of Object.entries(this.config.channels)) {
            if (config.enabled && config.priority.includes(priority)) {
                channels.push(channel);
            }
        }
        
        return channels;
    }

    // Métodos stub para implementações específicas
    async initializeAlertSystem() {
        console.log('🔧 Inicializando sistema de alertas médicos...');
    }

    async setupNotificationChannels() {
        console.log('📱 Configurando canais de notificação...');
    }

    startEscalationMonitoring() {
        this.escalationInterval = setInterval(async () => {
            await this.processEscalationQueue();
        }, 60000); // A cada minuto
    }

    setupAutomaticCleanup() {
        this.cleanupInterval = setInterval(async () => {
            await this.cleanupResolvedAlerts();
        }, 3600000); // A cada hora
    }

    async shouldSuppressAlert(alert) {
        // Lógica de supressão inteligente
        return false; // Nunca suprimir em ambiente médico crítico
    }

    scheduleNextEscalation(alert) {
        const escalationConfig = this.config.escalation[alert.priority];
        if (escalationConfig && alert.escalation.attempts < escalationConfig.maxRetries) {
            alert.escalation.nextEscalation = Date.now() + escalationConfig.retryInterval;
        }
    }

    async processEscalationQueue() {
        // Processar fila de escalação
    }

    async logAlertForAudit(alert) {
        const auditEntry = {
            timestamp: new Date().toISOString(),
            type: 'MEDICAL_ALERT_CREATED',
            alertId: alert.id,
            alertType: alert.type,
            priority: alert.priority,
            medicalContext: alert.medicalContext,
            lgpdCompliant: true
        };
        
        const auditFile = path.join('./logs', 'medical-alerts-audit.json');
        await fs.appendFile(auditFile, JSON.stringify(auditEntry) + '\n');
    }

    // Métodos de notificação específicos (implementar conforme necessário)
    async sendSlackNotification(message, alert) {
        console.log(`📨 [SLACK] Enviando notificação para alerta ${alert.id}`);
        // Implementação Slack específica
    }

    async sendEmailNotification(message, alert) {
        console.log(`📧 [EMAIL] Enviando email para alerta ${alert.id}`);
        // Implementação email específica
    }

    async sendSMSNotification(message, alert) {
        console.log(`📱 [SMS] Enviando SMS para alerta ${alert.id}`);
        // Implementação SMS específica
    }

    async makePhoneCall(message, alert) {
        console.log(`📞 [PHONE] Fazendo ligação para alerta ${alert.id}`);
        // Implementação chamada telefônica
    }

    setupEventListeners() {
        this.on('alert_created', (alert) => {
            console.log(`🆕 [EVENT] Alerta criado: ${alert.type}`);
        });
        
        this.on('alert_resolved', (alert) => {
            console.log(`✅ [EVENT] Alerta resolvido: ${alert.id}`);
        });
        
        this.on('alert_acknowledged', ({ alert, acknowledgment }) => {
            console.log(`👍 [EVENT] Alerta reconhecido: ${alert.id} por ${acknowledgment.acknowledgedBy}`);
        });
    }
    
    // ... outros métodos conforme necessário
}

export default MedicalCriticalAlerts;