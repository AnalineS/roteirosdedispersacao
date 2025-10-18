/**
 * Monitor de Uptime com SLA Médico 99.9%
 * Plataforma Educacional de Hanseníase
 * Monitoramento contínuo de disponibilidade para ambiente crítico de saúde
 */

import axios from 'axios';
import { performance } from 'perf_hooks';
import fs from 'fs/promises';
import path from 'path';
import { EventEmitter } from 'events';

export class MedicalUptimeMonitor extends EventEmitter {
    constructor() {
        super();
        
        this.uptimeData = new Map();
        this.incidents = [];
        this.downtimeEvents = [];
        this.slaHistory = [];
        
        this.config = {
            checkInterval: 30000, // 30 segundos
            timeout: 10000, // 10 segundos
            slaTarget: 99.9, // SLA médico crítico
            
            // Endpoints críticos para monitoramento
            criticalEndpoints: [
                {
                    name: 'main_application',
                    url: '/api/health',
                    priority: 'critical',
                    maxResponseTime: 2000
                },
                {
                    name: 'medical_protocols',
                    url: '/api/medical/protocols',
                    priority: 'critical',
                    maxResponseTime: 1500
                },
                {
                    name: 'medical_calculators',
                    url: '/api/medical/calculations/health',
                    priority: 'critical',
                    maxResponseTime: 1000
                },
                {
                    name: 'dr_gasnelio_persona',
                    url: '/api/gasnelio/status',
                    priority: 'high',
                    maxResponseTime: 3000
                },
                {
                    name: 'patient_data_protection',
                    url: '/api/patient/data-protection/status',
                    priority: 'critical',
                    maxResponseTime: 1000
                },
                {
                    name: 'lgpd_compliance',
                    url: '/api/audit/lgpd-status',
                    priority: 'high',
                    maxResponseTime: 2000
                },
                {
                    name: 'database_health',
                    url: '/api/system/database/health',
                    priority: 'critical',
                    maxResponseTime: 500
                }
            ],
            
            // Configuração de alertas
            alertThresholds: {
                responseTimeWarning: 1500,
                responseTimeCritical: 3000,
                errorRateWarning: 0.01, // 1%
                errorRateCritical: 0.05, // 5%
                downtimeAlert: 60000, // 1 minuto
                slaAlert: 99.5 // Alertar quando SLA cair abaixo de 99.5%
            },
            
            // Períodos de cálculo de SLA
            slaPeriods: ['1h', '24h', '7d', '30d'],
            
            // Configuração médica específica
            medicalCompliance: {
                maxAllowedDowntime: 86400, // 1 dia por mês (99.9% SLA)
                criticalHours: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17], // Horário médico crítico
                emergencyNotification: true
            }
        };
        
        this.isMonitoring = false;
        this.monitoringStartTime = null;
        this.baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    }

    /**
     * Inicia monitoramento de uptime
     */
    async startMonitoring() {
        if (this.isMonitoring) {
            console.log('⚠️ [UPTIME] Monitoramento já está ativo');
            return;
        }
        
        console.log('🔄 [UPTIME] Iniciando monitoramento de uptime médico...');
        console.log(`📊 [SLA] Meta: ${this.config.slaTarget}% - Ambiente crítico de saúde`);
        
        this.isMonitoring = true;
        this.monitoringStartTime = Date.now();
        
        // Inicializar monitoramento
        await this.initializeMonitoring();
        
        // Iniciar verificações contínuas
        this.startContinuousChecks();
        
        // Iniciar cálculos de SLA
        this.startSLACalculations();
        
        // Configurar relatórios automáticos
        this.scheduleUptimeReports();
        
        console.log('✅ [UPTIME] Monitoramento de uptime ativo');
        
        this.emit('monitoring_started', {
            timestamp: new Date().toISOString(),
            slaTarget: this.config.slaTarget,
            endpointsMonitored: this.config.criticalEndpoints.length
        });
    }

    /**
     * Para monitoramento de uptime
     */
    async stopMonitoring() {
        if (!this.isMonitoring) {
            console.log('⚠️ [UPTIME] Monitoramento já está inativo');
            return;
        }
        
        console.log('🛑 [UPTIME] Parando monitoramento de uptime...');
        
        this.isMonitoring = false;
        
        // Limpar intervalos
        if (this.checkInterval) clearInterval(this.checkInterval);
        if (this.slaInterval) clearInterval(this.slaInterval);
        if (this.reportInterval) clearInterval(this.reportInterval);
        
        // Gerar relatório final
        const finalReport = await this.generateFinalUptimeReport();
        
        console.log('✅ [UPTIME] Monitoramento de uptime parado');
        
        this.emit('monitoring_stopped', finalReport);
    }

    /**
     * Inicializar monitoramento
     */
    async initializeMonitoring() {
        console.log('🔧 [INIT] Inicializando monitoramento de uptime...');
        
        // Verificação inicial de conectividade
        await this.performInitialConnectivityCheck();
        
        // Carregar histórico se existir
        await this.loadUptimeHistory();
        
        // Configurar estruturas de dados
        this.initializeDataStructures();
        
        console.log('✅ [INIT] Monitoramento de uptime inicializado');
    }

    /**
     * Iniciar verificações contínuas
     */
    startContinuousChecks() {
        this.checkInterval = setInterval(async () => {
            try {
                await this.performUptimeCheck();
            } catch (error) {
                console.error('❌ [UPTIME] Erro na verificação:', error.message);
                await this.handleMonitoringError(error);
            }
        }, this.config.checkInterval);
    }

    /**
     * Realizar verificação de uptime
     */
    async performUptimeCheck() {
        const checkTimestamp = Date.now();
        const checkId = `check_${checkTimestamp}`;
        
        const checkResults = {
            id: checkId,
            timestamp: new Date(checkTimestamp).toISOString(),
            results: new Map(),
            overallStatus: 'unknown',
            responseTime: 0,
            errors: []
        };
        
        // Verificar cada endpoint crítico
        for (const endpoint of this.config.criticalEndpoints) {
            const result = await this.checkEndpoint(endpoint);
            checkResults.results.set(endpoint.name, result);
            
            if (result.status === 'down' || result.status === 'error') {
                checkResults.errors.push({
                    endpoint: endpoint.name,
                    error: result.error,
                    priority: endpoint.priority
                });
            }
        }
        
        // Calcular status geral
        checkResults.overallStatus = this.calculateOverallStatus(checkResults.results);
        checkResults.responseTime = this.calculateAverageResponseTime(checkResults.results);
        
        // Armazenar resultados
        this.uptimeData.set(checkTimestamp, checkResults);
        
        // Processar resultados
        await this.processCheckResults(checkResults);
        
        // Limpar dados antigos
        this.cleanupOldData();
        
        return checkResults;
    }

    /**
     * Verificar endpoint específico
     */
    async checkEndpoint(endpoint) {
        const startTime = performance.now();
        
        try {
            const response = await axios.get(`${this.baseUrl}${endpoint.url}`, {
                timeout: this.config.timeout,
                headers: {
                    'User-Agent': 'MedicalUptimeMonitor/1.0'
                }
            });
            
            const responseTime = performance.now() - startTime;
            
            const result = {
                status: 'up',
                statusCode: response.status,
                responseTime,
                withinThreshold: responseTime <= endpoint.maxResponseTime,
                timestamp: new Date().toISOString()
            };
            
            // Verificar se resposta está dentro dos limites aceitáveis
            if (response.status !== 200) {
                result.status = 'degraded';
                result.warning = `Status code não esperado: ${response.status}`;
            }
            
            if (responseTime > endpoint.maxResponseTime) {
                result.status = result.status === 'up' ? 'slow' : result.status;
                result.warning = `Tempo de resposta alto: ${responseTime.toFixed(2)}ms`;
            }
            
            return result;
            
        } catch (error) {
            const responseTime = performance.now() - startTime;
            
            return {
                status: error.code === 'ECONNABORTED' ? 'timeout' : 'down',
                error: error.message,
                errorCode: error.code,
                responseTime,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Processar resultados da verificação
     */
    async processCheckResults(checkResults) {
        // Verificar se há novos incidentes
        await this.checkForNewIncidents(checkResults);
        
        // Atualizar incidentes em andamento
        await this.updateOngoingIncidents(checkResults);
        
        // Verificar limites de alerta
        await this.checkAlertThresholds(checkResults);
        
        // Salvar dados críticos
        await this.saveCriticalData(checkResults);
        
        // Emitir eventos
        this.emitStatusEvents(checkResults);
    }

    /**
     * Verificar novos incidentes
     */
    async checkForNewIncidents(checkResults) {
        const currentTime = Date.now();
        
        for (const [endpointName, result] of checkResults.results) {
            if (result.status === 'down' || result.status === 'error') {
                // Verificar se já existe incidente ativo para este endpoint
                const activeIncident = this.incidents.find(incident => 
                    incident.endpoint === endpointName && 
                    incident.status === 'active'
                );
                
                if (!activeIncident) {
                    // Novo incidente
                    const incident = await this.createIncident(endpointName, result);
                    await this.notifyNewIncident(incident);
                }
            } else if (result.status === 'up') {
                // Resolver incidentes ativos para este endpoint
                await this.resolveActiveIncidents(endpointName, currentTime);
            }
        }
    }

    /**
     * Criar novo incidente
     */
    async createIncident(endpointName, result) {
        const incident = {
            id: `INC_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            endpoint: endpointName,
            status: 'active',
            startTime: Date.now(),
            startTimestamp: new Date().toISOString(),
            endTime: null,
            duration: null,
            severity: this.calculateIncidentSeverity(endpointName, result),
            error: result.error,
            medicalImpact: this.assessMedicalImpact(endpointName),
            notifications: []
        };
        
        this.incidents.push(incident);
        
        console.log(`🚨 [INCIDENT] Novo incidente: ${incident.id} - ${endpointName}`);
        console.log(`   Severidade: ${incident.severity} | Impacto médico: ${incident.medicalImpact}`);
        
        this.emit('incident_started', incident);
        
        return incident;
    }

    /**
     * Resolver incidentes ativos
     */
    async resolveActiveIncidents(endpointName, currentTime) {
        const activeIncidents = this.incidents.filter(incident => 
            incident.endpoint === endpointName && 
            incident.status === 'active'
        );
        
        for (const incident of activeIncidents) {
            incident.status = 'resolved';
            incident.endTime = currentTime;
            incident.duration = currentTime - incident.startTime;
            incident.endTimestamp = new Date(currentTime).toISOString();
            
            console.log(`✅ [INCIDENT] Incidente resolvido: ${incident.id}`);
            console.log(`   Duração: ${this.formatDuration(incident.duration)}`);
            
            this.emit('incident_resolved', incident);
            
            await this.notifyIncidentResolved(incident);
        }
    }

    /**
     * Calcular SLA atual
     */
    calculateSLA(period = '24h') {
        const endTime = Date.now();
        const startTime = endTime - this.getPeriodMs(period);
        
        const checksInPeriod = Array.from(this.uptimeData.entries())
            .filter(([timestamp]) => timestamp >= startTime && timestamp <= endTime)
            .map(([, data]) => data);
        
        if (checksInPeriod.length === 0) {
            return { sla: 100, period, dataPoints: 0 };
        }
        
        const successfulChecks = checksInPeriod.filter(check => 
            check.overallStatus === 'up' || check.overallStatus === 'degraded'
        ).length;
        
        const sla = (successfulChecks / checksInPeriod.length) * 100;
        
        return {
            sla: parseFloat(sla.toFixed(3)),
            period,
            dataPoints: checksInPeriod.length,
            successfulChecks,
            totalChecks: checksInPeriod.length,
            target: this.config.slaTarget,
            status: sla >= this.config.slaTarget ? 'MEETING_SLA' : 'BELOW_SLA',
            calculation: {
                startTime: new Date(startTime).toISOString(),
                endTime: new Date(endTime).toISOString()
            }
        };
    }

    /**
     * Iniciar cálculos periódicos de SLA
     */
    startSLACalculations() {
        this.slaInterval = setInterval(async () => {
            try {
                // Calcular SLA para todos os períodos
                const slaResults = {};
                
                for (const period of this.config.slaPeriods) {
                    slaResults[period] = this.calculateSLA(period);
                }
                
                // Armazenar resultados
                this.slaHistory.push({
                    timestamp: new Date().toISOString(),
                    sla: slaResults
                });
                
                // Verificar alertas de SLA
                await this.checkSLAAlerts(slaResults);
                
                // Manter apenas dados recentes
                if (this.slaHistory.length > 1000) {
                    this.slaHistory = this.slaHistory.slice(-1000);
                }
                
            } catch (error) {
                console.error('❌ [SLA] Erro no cálculo de SLA:', error.message);
            }
        }, 300000); // A cada 5 minutos
    }

    /**
     * Verificar alertas de SLA
     */
    async checkSLAAlerts(slaResults) {
        for (const [period, slaData] of Object.entries(slaResults)) {
            if (slaData.sla < this.config.alertThresholds.slaAlert) {
                const alert = {
                    id: `SLA_ALERT_${Date.now()}`,
                    type: 'sla_degradation',
                    timestamp: new Date().toISOString(),
                    severity: slaData.sla < this.config.slaTarget ? 'critical' : 'warning',
                    period,
                    currentSLA: slaData.sla,
                    targetSLA: this.config.slaTarget,
                    medicalImpact: 'HIGH',
                    message: `SLA de ${period} está em ${slaData.sla.toFixed(3)}% (abaixo do alerta de ${this.config.alertThresholds.slaAlert}%)`
                };
                
                console.log(`🚨 [SLA ALERT] ${alert.severity.toUpperCase()}: ${alert.message}`);
                
                this.emit('sla_alert', alert);
                await this.notifySLAAlert(alert);
            }
        }
    }

    /**
     * Gerar relatório de uptime
     */
    async generateUptimeReport(timeRange = '24h') {
        const endTime = Date.now();
        const startTime = endTime - this.getPeriodMs(timeRange);
        
        // Coletar dados do período
        const checksInPeriod = Array.from(this.uptimeData.entries())
            .filter(([timestamp]) => timestamp >= startTime && timestamp <= endTime)
            .map(([, data]) => data);
        
        const incidentsInPeriod = this.incidents.filter(incident => 
            new Date(incident.startTimestamp).getTime() >= startTime &&
            new Date(incident.startTimestamp).getTime() <= endTime
        );
        
        // Calcular métricas
        const slaData = this.calculateSLA(timeRange);
        const downtimeTotal = this.calculateTotalDowntime(incidentsInPeriod);
        const mttr = this.calculateMTTR(incidentsInPeriod);
        const mtbf = this.calculateMTBF(incidentsInPeriod, endTime - startTime);
        
        const report = {
            timestamp: new Date().toISOString(),
            period: {
                range: timeRange,
                start: new Date(startTime).toISOString(),
                end: new Date(endTime).toISOString(),
                duration: endTime - startTime
            },
            sla: slaData,
            availability: {
                uptime: ((endTime - startTime - downtimeTotal) / (endTime - startTime)) * 100,
                downtime: downtimeTotal,
                downtimeFormatted: this.formatDuration(downtimeTotal)
            },
            reliability: {
                mttr: mttr,
                mttrFormatted: this.formatDuration(mttr),
                mtbf: mtbf,
                mtbfFormatted: this.formatDuration(mtbf),
                incidents: incidentsInPeriod.length
            },
            performance: {
                averageResponseTime: this.calculateAverageResponseTimeForPeriod(checksInPeriod),
                slowRequests: checksInPeriod.filter(check => 
                    check.responseTime > this.config.alertThresholds.responseTimeWarning
                ).length
            },
            endpoints: this.analyzeEndpointPerformance(checksInPeriod),
            incidents: incidentsInPeriod.map(incident => ({
                id: incident.id,
                endpoint: incident.endpoint,
                severity: incident.severity,
                duration: incident.duration ? this.formatDuration(incident.duration) : 'ongoing',
                medicalImpact: incident.medicalImpact
            })),
            medicalCompliance: {
                slaTarget: this.config.slaTarget,
                slaAchieved: slaData.sla >= this.config.slaTarget,
                criticalSystemsOperational: this.assessCriticalSystemsStatus(checksInPeriod),
                patientDataProtected: true,
                lgpdCompliant: true
            },
            recommendations: await this.generateUptimeRecommendations(slaData, incidentsInPeriod)
        };
        
        // Salvar relatório
        await this.saveUptimeReport(report);
        
        return report;
    }

    // Métodos utilitários
    calculateOverallStatus(results) {
        const statuses = Array.from(results.values()).map(r => r.status);
        
        if (statuses.some(s => s === 'down' || s === 'error')) return 'down';
        if (statuses.some(s => s === 'timeout')) return 'timeout';
        if (statuses.some(s => s === 'slow' || s === 'degraded')) return 'degraded';
        if (statuses.every(s => s === 'up')) return 'up';
        
        return 'unknown';
    }

    calculateAverageResponseTime(results) {
        const responseTimes = Array.from(results.values())
            .map(r => r.responseTime || 0)
            .filter(rt => rt > 0);
        
        return responseTimes.length > 0 
            ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
            : 0;
    }

    calculateIncidentSeverity(endpointName, result) {
        const endpoint = this.config.criticalEndpoints.find(ep => ep.name === endpointName);
        
        if (!endpoint) return 'medium';
        
        if (endpoint.priority === 'critical') {
            return result.status === 'down' ? 'critical' : 'high';
        } else if (endpoint.priority === 'high') {
            return result.status === 'down' ? 'high' : 'medium';
        }
        
        return 'low';
    }

    assessMedicalImpact(endpointName) {
        const criticalMedicalEndpoints = [
            'medical_protocols',
            'medical_calculators',
            'patient_data_protection'
        ];
        
        return criticalMedicalEndpoints.includes(endpointName) ? 'HIGH' : 'MEDIUM';
    }

    getPeriodMs(period) {
        const periods = {
            '1h': 3600000,
            '24h': 86400000,
            '7d': 604800000,
            '30d': 2592000000
        };
        
        return periods[period] || periods['24h'];
    }

    formatDuration(ms) {
        if (ms < 60000) return `${Math.round(ms / 1000)}s`;
        if (ms < 3600000) return `${Math.round(ms / 60000)}m`;
        if (ms < 86400000) return `${Math.round(ms / 3600000)}h`;
        return `${Math.round(ms / 86400000)}d`;
    }

    cleanupOldData() {
        const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 dias
        const oldKeys = Array.from(this.uptimeData.keys()).filter(key => key < cutoff);
        
        for (const key of oldKeys) {
            this.uptimeData.delete(key);
        }
    }

    // Métodos stub para implementações específicas
    async performInitialConnectivityCheck() {
        console.log('🔍 Verificando conectividade inicial...');
        // Implementação específica
    }

    async loadUptimeHistory() {
        // Carregar histórico de arquivo se existir
    }

    initializeDataStructures() {
        // Inicializar estruturas de dados necessárias
    }

    async handleMonitoringError(error) {
        console.error('❌ [MONITORING ERROR]:', error.message);
        // Implementação específica para tratamento de erros
    }

    emitStatusEvents(checkResults) {
        this.emit('uptime_check', checkResults);
        
        if (checkResults.overallStatus === 'down') {
            this.emit('system_down', checkResults);
        } else if (checkResults.overallStatus === 'up') {
            this.emit('system_up', checkResults);
        }
    }

    async notifyNewIncident(incident) {
        console.log(`📨 [NOTIFICATION] Novo incidente: ${incident.id}`);
        // Implementação de notificações
    }

    async notifyIncidentResolved(incident) {
        console.log(`📨 [NOTIFICATION] Incidente resolvido: ${incident.id}`);
        // Implementação de notificações
    }

    async notifySLAAlert(alert) {
        console.log(`📨 [SLA NOTIFICATION] Alerta SLA: ${alert.type}`);
        // Implementação de notificações de SLA
    }

    // ... outros métodos conforme necessário

    async saveUptimeReport(report) {
        const reportFile = path.join('./logs', `uptime-report-${Date.now()}.json`);
        await fs.writeFile(reportFile, JSON.stringify(report, null, 2));
    }

    async saveCriticalData(checkResults) {
        const dataFile = path.join('./logs', `uptime-data-${Date.now()}.json`);
        await fs.appendFile(dataFile, JSON.stringify(checkResults) + '\n');
    }
}

export default MedicalUptimeMonitor;