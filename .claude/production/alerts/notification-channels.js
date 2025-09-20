/**
 * Canais de Notificação para Alertas Médicos Críticos
 * Plataforma Educacional de Hanseníase
 * Múltiplos canais de comunicação para garantir entrega de alertas
 */

import nodemailer from 'nodemailer';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

export class MedicalNotificationChannels {
    constructor() {
        this.channels = new Map();
        this.deliveryHistory = [];
        this.failureQueue = [];
        this.templates = new Map();
        
        this.config = {
            // Configuração de canais
            slack: {
                enabled: process.env.SLACK_ENABLED === 'true',
                webhookUrl: process.env.SLACK_WEBHOOK_URL,
                defaultChannel: '#medical-alerts',
                rateLimits: { requests: 1, window: 1000 }, // 1 req/sec
                retryAttempts: 3,
                timeout: 10000
            },
            
            email: {
                enabled: process.env.EMAIL_ENABLED === 'true',
                smtp: {
                    host: process.env.SMTP_HOST,
                    port: process.env.SMTP_PORT || 587,
                    secure: process.env.SMTP_SECURE === 'true',
                    auth: {
                        user: process.env.SMTP_USER,
                        pass: process.env.SMTP_PASS
                    }
                },
                from: process.env.EMAIL_FROM || 'alerts@hanseniase.edu.br',
                rateLimits: { requests: 10, window: 60000 }, // 10 emails/min
                retryAttempts: 3,
                timeout: 30000
            },
            
            sms: {
                enabled: process.env.SMS_ENABLED === 'true',
                provider: process.env.SMS_PROVIDER || 'twilio',
                config: {
                    twilio: {
                        accountSid: process.env.TWILIO_ACCOUNT_SID,
                        authToken: process.env.TWILIO_AUTH_TOKEN,
                        fromNumber: process.env.TWILIO_FROM_NUMBER
                    }
                },
                rateLimits: { requests: 5, window: 60000 }, // 5 SMS/min
                retryAttempts: 2,
                timeout: 15000
            },
            
            webhook: {
                enabled: process.env.WEBHOOK_ENABLED === 'true',
                endpoints: (process.env.WEBHOOK_ENDPOINTS || '').split(',').filter(url => url),
                timeout: 10000,
                retryAttempts: 3,
                rateLimits: { requests: 20, window: 60000 } // 20 webhooks/min
            },
            
            // Configuração de fallback
            fallback: {
                enabled: true,
                channels: ['email', 'slack'], // Canais de fallback em ordem
                maxAttempts: 2
            }
        };
        
        this.rateLimiters = new Map();
        this.initializeChannels();
        this.loadTemplates();
    }

    /**
     * Inicializar canais de notificação
     */
    async initializeChannels() {
        console.log('📡 [CHANNELS] Inicializando canais de notificação médicos...');
        
        // Configurar Slack
        if (this.config.slack.enabled && this.config.slack.webhookUrl) {
            this.channels.set('slack', {
                type: 'slack',
                enabled: true,
                send: (message, options) => this.sendSlack(message, options)
            });
            console.log('   ✅ Slack configurado');
        }
        
        // Configurar Email
        if (this.config.email.enabled && this.config.email.smtp.host) {
            const transporter = nodemailer.createTransporter(this.config.email.smtp);
            
            this.channels.set('email', {
                type: 'email',
                enabled: true,
                transporter,
                send: (message, options) => this.sendEmail(message, options)
            });
            console.log('   ✅ Email configurado');
        }
        
        // Configurar SMS
        if (this.config.sms.enabled) {
            this.channels.set('sms', {
                type: 'sms',
                enabled: true,
                send: (message, options) => this.sendSMS(message, options)
            });
            console.log('   ✅ SMS configurado');
        }
        
        // Configurar Webhooks
        if (this.config.webhook.enabled && this.config.webhook.endpoints.length > 0) {
            this.channels.set('webhook', {
                type: 'webhook',
                enabled: true,
                endpoints: this.config.webhook.endpoints,
                send: (message, options) => this.sendWebhook(message, options)
            });
            console.log('   ✅ Webhooks configurados');
        }
        
        // Inicializar rate limiters
        for (const [channelName] of this.channels) {
            this.rateLimiters.set(channelName, {
                requests: [],
                blocked: false
            });
        }
        
        console.log(`✅ [CHANNELS] ${this.channels.size} canais inicializados`);
    }

    /**
     * Carregar templates de mensagem
     */
    loadTemplates() {
        const templates = {
            slack_alert: {
                critical: {
                    color: 'danger',
                    emoji: '🔥',
                    title: 'ALERTA MÉDICO CRÍTICO'
                },
                high: {
                    color: 'warning',
                    emoji: '🚨',
                    title: 'ALERTA MÉDICO IMPORTANTE'
                },
                medium: {
                    color: 'good',
                    emoji: '⚠️',
                    title: 'Alerta Médico'
                }
            },
            
            email_alert: {
                subject: '🏥 Alerta Médico {priority}: {type}',
                header: 'Sistema de Alertas - Plataforma Educacional de Hanseníase',
                footer: 'Este é um alerta automático do sistema médico. Não responda a este email.'
            },
            
            sms_alert: {
                format: '🚨 ALERTA MED {priority}: {type} - ID:{id} - {timestamp}'
            }
        };
        
        for (const [templateName, template] of Object.entries(templates)) {
            this.templates.set(templateName, template);
        }
        
        console.log('📝 [TEMPLATES] Templates de mensagem carregados');
    }

    /**
     * Enviar notificação para múltiplos canais
     */
    async sendNotification(channels, message, options = {}) {
        if (!Array.isArray(channels)) {
            channels = [channels];
        }
        
        const deliveryResults = [];
        
        console.log(`📨 [NOTIFY] Enviando para ${channels.length} canal(is): ${channels.join(', ')}`);
        
        for (const channelName of channels) {
            try {
                const result = await this.sendToChannel(channelName, message, options);
                deliveryResults.push({
                    channel: channelName,
                    status: 'delivered',
                    result,
                    timestamp: new Date().toISOString()
                });
                
            } catch (error) {
                console.error(`❌ [NOTIFY] Falha no canal ${channelName}:`, error.message);
                
                deliveryResults.push({
                    channel: channelName,
                    status: 'failed',
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
                
                // Tentar canais de fallback
                if (this.config.fallback.enabled) {
                    await this.attemptFallback(channelName, message, options);
                }
            }
        }
        
        // Armazenar histórico
        this.deliveryHistory.push({
            id: `delivery_${Date.now()}`,
            timestamp: new Date().toISOString(),
            channels,
            message: typeof message === 'string' ? message.substring(0, 100) : '[Object]',
            results: deliveryResults
        });
        
        // Manter apenas últimas 1000 entregas
        if (this.deliveryHistory.length > 1000) {
            this.deliveryHistory = this.deliveryHistory.slice(-1000);
        }
        
        return deliveryResults;
    }

    /**
     * Enviar para canal específico
     */
    async sendToChannel(channelName, message, options) {
        const channel = this.channels.get(channelName);
        
        if (!channel || !channel.enabled) {
            throw new Error(`Canal ${channelName} não disponível`);
        }
        
        // Verificar rate limiting
        if (await this.isRateLimited(channelName)) {
            throw new Error(`Canal ${channelName} limitado por rate limit`);
        }
        
        // Aplicar rate limiting
        await this.applyRateLimit(channelName);
        
        // Formatar mensagem para o canal
        const formattedMessage = await this.formatMessageForChannel(channelName, message, options);
        
        // Enviar com retry
        return await this.sendWithRetry(channel, formattedMessage, options, this.getRetryAttempts(channelName));
    }

    /**
     * Enviar com retry automático
     */
    async sendWithRetry(channel, message, options, maxAttempts) {
        let lastError;
        
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                console.log(`   📤 Tentativa ${attempt}/${maxAttempts} - ${channel.type}`);
                
                const result = await Promise.race([
                    channel.send(message, options),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Timeout')), this.getTimeout(channel.type))
                    )
                ]);
                
                console.log(`   ✅ ${channel.type} - Enviado com sucesso`);
                return result;
                
            } catch (error) {
                lastError = error;
                console.log(`   ❌ ${channel.type} - Tentativa ${attempt} falhou: ${error.message}`);
                
                // Aguardar antes da próxima tentativa (backoff exponencial)
                if (attempt < maxAttempts) {
                    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }
        
        throw lastError;
    }

    /**
     * Enviar via Slack
     */
    async sendSlack(message, options) {
        let slackPayload;
        
        if (typeof message === 'object' && message.attachments) {
            // Mensagem já formatada
            slackPayload = message;
        } else {
            // Formatar mensagem simples
            const template = this.templates.get('slack_alert');
            const priorityConfig = template[options.priority?.toLowerCase()] || template.medium;
            
            slackPayload = {
                channel: options.channel || this.config.slack.defaultChannel,
                username: 'Sistema Médico',
                icon_emoji: ':hospital:',
                text: `${priorityConfig.emoji} ${priorityConfig.title}`,
                attachments: [{
                    color: priorityConfig.color,
                    text: typeof message === 'string' ? message : JSON.stringify(message, null, 2),
                    footer: 'Sistema de Alertas Médicos',
                    ts: Math.floor(Date.now() / 1000)
                }]
            };
        }
        
        const response = await axios.post(this.config.slack.webhookUrl, slackPayload, {
            timeout: this.config.slack.timeout,
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.status !== 200) {
            throw new Error(`Slack respondeu com status ${response.status}`);
        }
        
        return { messageId: response.headers['x-slack-req-id'] || 'unknown' };
    }

    /**
     * Enviar via Email
     */
    async sendEmail(message, options) {
        const channel = this.channels.get('email');
        const template = this.templates.get('email_alert');
        
        let emailContent;
        
        if (typeof message === 'object' && message.html) {
            // Email já formatado
            emailContent = message;
        } else {
            // Formatar email simples
            const subject = template.subject
                .replace('{priority}', options.priority || 'MEDIUM')
                .replace('{type}', options.type || 'ALERT');
            
            emailContent = {
                from: this.config.email.from,
                to: options.recipients || options.to,
                subject,
                html: `
                    <h2 style="color: #dc3545;">🏥 ${template.header}</h2>
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
                        <h3>Detalhes do Alerta</h3>
                        <pre style="background: white; padding: 10px; border-radius: 3px; overflow-x: auto;">
${typeof message === 'string' ? message : JSON.stringify(message, null, 2)}
                        </pre>
                    </div>
                    <hr>
                    <p style="color: #6c757d; font-size: 12px;">${template.footer}</p>
                `,
                text: typeof message === 'string' ? message : JSON.stringify(message, null, 2)
            };
        }
        
        const result = await channel.transporter.sendMail(emailContent);
        
        return { messageId: result.messageId, response: result.response };
    }

    /**
     * Enviar via SMS
     */
    async sendSMS(message, options) {
        const provider = this.config.sms.provider;
        
        let smsContent;
        if (typeof message === 'string') {
            smsContent = message.substring(0, 160); // Limite SMS
        } else {
            const template = this.templates.get('sms_alert');
            smsContent = template.format
                .replace('{priority}', options.priority || 'MED')
                .replace('{type}', options.type || 'ALERT')
                .replace('{id}', options.id || 'N/A')
                .replace('{timestamp}', new Date().toLocaleTimeString());
        }
        
        if (provider === 'twilio') {
            return await this.sendTwilioSMS(smsContent, options);
        }
        
        throw new Error(`Provedor SMS não suportado: ${provider}`);
    }

    /**
     * Enviar SMS via Twilio
     */
    async sendTwilioSMS(message, options) {
        const config = this.config.sms.config.twilio;
        const auth = Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64');
        
        const recipients = options.recipients || options.numbers || [];
        const results = [];
        
        for (const number of recipients) {
            try {
                const response = await axios.post(
                    `https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`,
                    new URLSearchParams({
                        From: config.fromNumber,
                        To: number,
                        Body: message
                    }),
                    {
                        headers: {
                            'Authorization': `Basic ${auth}`,
                            'Content-Type': 'application/x-www-form-urlencoded'
                        },
                        timeout: this.config.sms.timeout
                    }
                );
                
                results.push({
                    number,
                    status: 'sent',
                    sid: response.data.sid
                });
                
            } catch (error) {
                results.push({
                    number,
                    status: 'failed',
                    error: error.message
                });
            }
        }
        
        return { results };
    }

    /**
     * Enviar via Webhook
     */
    async sendWebhook(message, options) {
        const channel = this.channels.get('webhook');
        const results = [];
        
        const payload = {
            timestamp: new Date().toISOString(),
            source: 'medical_alerts',
            priority: options.priority,
            type: options.type,
            message: message,
            metadata: options.metadata || {}
        };
        
        for (const endpoint of channel.endpoints) {
            try {
                const response = await axios.post(endpoint, payload, {
                    timeout: this.config.webhook.timeout,
                    headers: {
                        'Content-Type': 'application/json',
                        'User-Agent': 'MedicalAlerts/1.0'
                    }
                });
                
                results.push({
                    endpoint,
                    status: 'delivered',
                    statusCode: response.status
                });
                
            } catch (error) {
                results.push({
                    endpoint,
                    status: 'failed',
                    error: error.message
                });
            }
        }
        
        return { results };
    }

    /**
     * Formatar mensagem para canal específico
     */
    async formatMessageForChannel(channelName, message, options) {
        // Se a mensagem já está formatada, usar como está
        if (typeof message === 'object' && message._formatted) {
            return message;
        }
        
        switch (channelName) {
            case 'slack':
                return await this.formatSlackMessage(message, options);
                
            case 'email':
                return await this.formatEmailMessage(message, options);
                
            case 'sms':
                return await this.formatSMSMessage(message, options);
                
            default:
                return message;
        }
    }

    /**
     * Formatar mensagem Slack
     */
    async formatSlackMessage(message, options) {
        if (typeof message === 'object' && message.attachments) {
            return message; // Já formatado
        }
        
        const template = this.templates.get('slack_alert');
        const priorityConfig = template[options.priority?.toLowerCase()] || template.medium;
        
        return {
            text: `${priorityConfig.emoji} ${priorityConfig.title}`,
            attachments: [{
                color: priorityConfig.color,
                title: options.title || 'Alerta do Sistema',
                text: typeof message === 'string' ? message : JSON.stringify(message, null, 2),
                fields: options.fields || [],
                footer: 'Sistema de Alertas Médicos',
                ts: Math.floor(Date.now() / 1000)
            }],
            _formatted: true
        };
    }

    // Métodos auxiliares para rate limiting
    async isRateLimited(channelName) {
        const limiter = this.rateLimiters.get(channelName);
        const config = this.config[channelName]?.rateLimits;
        
        if (!config || !limiter) return false;
        
        const now = Date.now();
        const windowStart = now - config.window;
        
        // Remover requests antigas
        limiter.requests = limiter.requests.filter(timestamp => timestamp > windowStart);
        
        return limiter.requests.length >= config.requests;
    }

    async applyRateLimit(channelName) {
        const limiter = this.rateLimiters.get(channelName);
        if (limiter) {
            limiter.requests.push(Date.now());
        }
    }

    getRetryAttempts(channelName) {
        return this.config[channelName]?.retryAttempts || 1;
    }

    getTimeout(channelType) {
        return this.config[channelType]?.timeout || 10000;
    }

    /**
     * Tentar canais de fallback
     */
    async attemptFallback(failedChannel, message, options) {
        if (!this.config.fallback.enabled) return;
        
        const fallbackChannels = this.config.fallback.channels.filter(ch => 
            ch !== failedChannel && this.channels.has(ch)
        );
        
        if (fallbackChannels.length === 0) return;
        
        console.log(`🔄 [FALLBACK] Tentando ${fallbackChannels.length} canal(is) de fallback`);
        
        for (const channelName of fallbackChannels) {
            try {
                await this.sendToChannel(channelName, message, {
                    ...options,
                    fallbackFrom: failedChannel
                });
                
                console.log(`✅ [FALLBACK] Sucesso via ${channelName}`);
                break;
                
            } catch (error) {
                console.log(`❌ [FALLBACK] Falha via ${channelName}: ${error.message}`);
                continue;
            }
        }
    }

    /**
     * Gerar relatório de entrega
     */
    generateDeliveryReport(timeRange = '24h') {
        const timeRangeMs = this.parseTimeRange(timeRange);
        const cutoff = Date.now() - timeRangeMs;
        
        const recentDeliveries = this.deliveryHistory.filter(d => 
            new Date(d.timestamp).getTime() > cutoff
        );
        
        const stats = {
            period: timeRange,
            totalDeliveries: recentDeliveries.length,
            channelStats: {},
            successRate: 0,
            failuresByChannel: {},
            recommendations: []
        };
        
        // Analisar por canal
        for (const delivery of recentDeliveries) {
            for (const result of delivery.results) {
                if (!stats.channelStats[result.channel]) {
                    stats.channelStats[result.channel] = {
                        total: 0,
                        delivered: 0,
                        failed: 0,
                        successRate: 0
                    };
                }
                
                const channelStats = stats.channelStats[result.channel];
                channelStats.total++;
                
                if (result.status === 'delivered') {
                    channelStats.delivered++;
                } else {
                    channelStats.failed++;
                    
                    if (!stats.failuresByChannel[result.channel]) {
                        stats.failuresByChannel[result.channel] = [];
                    }
                    stats.failuresByChannel[result.channel].push(result.error);
                }
            }
        }
        
        // Calcular taxas de sucesso
        for (const [channel, channelStats] of Object.entries(stats.channelStats)) {
            channelStats.successRate = channelStats.total > 0 
                ? (channelStats.delivered / channelStats.total) * 100 
                : 0;
        }
        
        // Taxa de sucesso geral
        const totalSent = Object.values(stats.channelStats).reduce((sum, cs) => sum + cs.total, 0);
        const totalDelivered = Object.values(stats.channelStats).reduce((sum, cs) => sum + cs.delivered, 0);
        stats.successRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;
        
        return stats;
    }

    parseTimeRange(timeRange) {
        const ranges = {
            '1h': 3600000,
            '24h': 86400000,
            '7d': 604800000,
            '30d': 2592000000
        };
        
        return ranges[timeRange] || ranges['24h'];
    }
}

export default MedicalNotificationChannels;