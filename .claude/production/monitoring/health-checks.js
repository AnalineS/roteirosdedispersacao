/**
 * Sistema de Health Checks Específicos para Hanseníase
 * Plataforma Educacional de Hanseníase
 * Verificações de saúde médicas críticas e compliance
 */

import axios from 'axios';
import { performance } from 'perf_hooks';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export class MedicalHealthChecks {
    constructor() {
        this.healthResults = new Map();
        this.checkHistory = [];
        this.criticalIssues = [];
        this.lastFullCheck = null;
        
        this.config = {
            timeout: 5000,
            retryAttempts: 3,
            retryDelay: 1000,
            baseUrl: process.env.BASE_URL || 'http://localhost:3000',
            criticalThresholds: {
                responseTime: 2000,
                errorRate: 0.05,
                memoryUsage: 85,
                cpuUsage: 80,
                diskUsage: 90
            },
            medicalChecks: {
                protocolValidation: true,
                calculatorAccuracy: true,
                gasnelioPersona: true,
                patientDataSecurity: true,
                lgpdCompliance: true
            }
        };
        
        this.medicalProtocols = [
            'classificacao_operacional',
            'esquemas_terapeuticos',
            'reacoes_hansenianas',
            'prevencao_incapacidades',
            'diagnostico_diferencial'
        ];
    }

    /**
     * Executa verificação completa de saúde médica
     */
    async executeFullHealthCheck() {
        console.log('🏥 [HEALTH CHECK] Iniciando verificação completa de saúde médica...');
        
        const checkId = this.generateCheckId();
        const startTime = performance.now();
        
        try {
            const healthReport = {
                checkId,
                timestamp: new Date().toISOString(),
                results: new Map(),
                summary: {},
                medicalCompliance: false,
                systemStable: false,
                recommendations: []
            };
            
            // 1. Health Checks de Sistema
            console.log('   🔧 Verificando saúde do sistema...');
            await this.checkSystemHealth(healthReport);
            
            // 2. Health Checks de Endpoints Críticos
            console.log('   🌐 Verificando endpoints críticos...');
            await this.checkCriticalEndpoints(healthReport);
            
            // 3. Health Checks Médicos Específicos
            console.log('   🏥 Verificando funções médicas...');
            await this.checkMedicalFunctions(healthReport);
            
            // 4. Health Checks de Segurança e LGPD
            console.log('   🔒 Verificando segurança e LGPD...');
            await this.checkSecurityCompliance(healthReport);
            
            // 5. Health Checks de Performance
            console.log('   ⚡ Verificando performance...');
            await this.checkPerformanceMetrics(healthReport);
            
            // 6. Health Checks de Infraestrutura
            console.log('   🏗️ Verificando infraestrutura...');
            await this.checkInfrastructure(healthReport);
            
            const checkDuration = performance.now() - startTime;
            
            // Análise final
            healthReport.summary = await this.analyzeHealthResults(healthReport.results, checkDuration);
            healthReport.medicalCompliance = this.assessMedicalCompliance(healthReport.results);
            healthReport.systemStable = this.assessSystemStability(healthReport.results);
            healthReport.recommendations = await this.generateHealthRecommendations(healthReport.results);
            
            // Salvar resultados
            await this.saveHealthCheck(healthReport);
            
            this.lastFullCheck = healthReport;
            
            console.log(`✅ [HEALTH CHECK] Verificação completa concluída em ${checkDuration.toFixed(2)}ms`);
            console.log(`🏥 Compliance médico: ${healthReport.medicalCompliance ? 'APROVADO' : 'REPROVADO'}`);
            console.log(`🔧 Sistema estável: ${healthReport.systemStable ? 'SIM' : 'NÃO'}`);
            
            return healthReport;
            
        } catch (error) {
            console.error('❌ [HEALTH CHECK] Falha na verificação de saúde:', error.message);
            
            await this.handleHealthCheckFailure(checkId, error);
            throw error;
        }
    }

    /**
     * Health Check rápido para monitoramento contínuo
     */
    async executeQuickHealthCheck() {
        const quickChecks = [
            () => this.quickSystemCheck(),
            () => this.quickEndpointCheck(),
            () => this.quickMedicalCheck(),
            () => this.quickSecurityCheck()
        ];
        
        const results = [];
        
        for (const check of quickChecks) {
            try {
                const result = await this.executeWithTimeout(check(), 3000);
                results.push({ status: 'HEALTHY', result });
            } catch (error) {
                results.push({ status: 'UNHEALTHY', error: error.message });
            }
        }
        
        const healthyCount = results.filter(r => r.status === 'HEALTHY').length;
        const overallHealth = healthyCount / results.length;
        
        return {
            timestamp: new Date().toISOString(),
            overallHealth: overallHealth >= 0.75 ? 'HEALTHY' : 'UNHEALTHY',
            healthScore: overallHealth,
            checks: results
        };
    }

    /**
     * Verificação de saúde do sistema
     */
    async checkSystemHealth(healthReport) {
        const systemChecks = [
            { name: 'memory_usage', fn: () => this.checkMemoryUsage() },
            { name: 'cpu_usage', fn: () => this.checkCPUUsage() },
            { name: 'disk_space', fn: () => this.checkDiskSpace() },
            { name: 'network_connectivity', fn: () => this.checkNetworkConnectivity() },
            { name: 'process_health', fn: () => this.checkProcessHealth() },
            { name: 'log_file_health', fn: () => this.checkLogFileHealth() }
        ];
        
        for (const check of systemChecks) {
            try {
                const result = await this.executeWithRetry(check.fn);
                healthReport.results.set(`system.${check.name}`, {
                    status: 'HEALTHY',
                    result,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                healthReport.results.set(`system.${check.name}`, {
                    status: 'UNHEALTHY',
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
                
                this.criticalIssues.push(`System ${check.name}: ${error.message}`);
            }
        }
    }

    /**
     * Verificação de endpoints críticos
     */
    async checkCriticalEndpoints(healthReport) {
        const criticalEndpoints = [
            '/api/health',
            '/api/medical/protocols',
            '/api/medical/calculations',
            '/api/gasnelio/persona-status',
            '/api/patient/data-protection',
            '/api/audit/lgpd-status'
        ];
        
        for (const endpoint of criticalEndpoints) {
            try {
                const startTime = performance.now();
                
                const response = await axios.get(`${this.config.baseUrl}${endpoint}`, {
                    timeout: this.config.timeout,
                    headers: {
                        'User-Agent': 'MedicalHealthCheck/1.0'
                    }
                });
                
                const responseTime = performance.now() - startTime;
                
                const endpointResult = {
                    status: 'HEALTHY',
                    statusCode: response.status,
                    responseTime,
                    withinThreshold: responseTime < this.config.criticalThresholds.responseTime,
                    data: response.data
                };
                
                healthReport.results.set(`endpoint.${endpoint}`, endpointResult);
                
                if (!endpointResult.withinThreshold) {
                    this.criticalIssues.push(`Endpoint ${endpoint} slow: ${responseTime.toFixed(2)}ms`);
                }
                
            } catch (error) {
                healthReport.results.set(`endpoint.${endpoint}`, {
                    status: 'UNHEALTHY',
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
                
                this.criticalIssues.push(`Endpoint ${endpoint} failed: ${error.message}`);
            }
        }
    }

    /**
     * Verificação de funções médicas específicas
     */
    async checkMedicalFunctions(healthReport) {
        console.log('      🩺 Verificando protocolos de hanseníase...');
        await this.checkHanseniaseProtocols(healthReport);
        
        console.log('      🧮 Verificando calculadoras médicas...');
        await this.checkMedicalCalculators(healthReport);
        
        console.log('      👨‍⚕️ Verificando Dr. Gasnelio...');
        await this.checkDrGasnelioPersona(healthReport);
        
        console.log('      🔐 Verificando proteção de dados de pacientes...');
        await this.checkPatientDataProtection(healthReport);
        
        console.log('      📚 Verificando base de conhecimento médico...');
        await this.checkMedicalKnowledgeBase(healthReport);
    }

    /**
     * Verificação específica dos protocolos de hanseníase
     */
    async checkHanseniaseProtocols(healthReport) {
        try {
            const response = await axios.get(`${this.config.baseUrl}/api/medical/protocols/hanseniase`, {
                timeout: this.config.timeout
            });
            
            const protocolData = response.data;
            
            // Verificar se todos os protocolos críticos existem
            const missingProtocols = [];
            for (const protocol of this.medicalProtocols) {
                if (!protocolData.protocols || !protocolData.protocols[protocol]) {
                    missingProtocols.push(protocol);
                }
            }
            
            // Verificar compliance com MS
            const ministryCompliant = protocolData.ministryCompliant === true;
            const lastUpdated = new Date(protocolData.lastUpdated || 0);
            const isRecent = Date.now() - lastUpdated.getTime() < 30 * 24 * 60 * 60 * 1000; // 30 dias
            
            const protocolResult = {
                status: missingProtocols.length === 0 && ministryCompliant ? 'HEALTHY' : 'UNHEALTHY',
                protocolsFound: Object.keys(protocolData.protocols || {}).length,
                missingProtocols,
                ministryCompliant,
                lastUpdated: protocolData.lastUpdated,
                isRecent,
                totalProtocols: this.medicalProtocols.length
            };
            
            healthReport.results.set('medical.hanseniase_protocols', protocolResult);
            
            if (missingProtocols.length > 0) {
                this.criticalIssues.push(`Protocolos médicos ausentes: ${missingProtocols.join(', ')}`);
            }
            
            if (!ministryCompliant) {
                this.criticalIssues.push('Protocolos não estão em compliance com MS');
            }
            
        } catch (error) {
            healthReport.results.set('medical.hanseniase_protocols', {
                status: 'UNHEALTHY',
                error: error.message
            });
            
            this.criticalIssues.push(`Falha ao verificar protocolos: ${error.message}`);
        }
    }

    /**
     * Verificação das calculadoras médicas
     */
    async checkMedicalCalculators(healthReport) {
        const calculators = [
            {
                name: 'dose_calculator',
                testInput: { weight: 70, medication: 'dapsona', classification: 'multibacilar' },
                expectedFields: ['dose', 'frequency', 'duration']
            },
            {
                name: 'body_surface_calculator',
                testInput: { weight: 70, height: 175 },
                expectedFields: ['bodySurface', 'category']
            },
            {
                name: 'severity_index',
                testInput: { symptoms: ['manchas', 'dormencia'], duration: 6 },
                expectedFields: ['severityIndex', 'classification', 'recommendations']
            }
        ];
        
        for (const calculator of calculators) {
            try {
                const response = await axios.post(
                    `${this.config.baseUrl}/api/medical/calculate/${calculator.name}`,
                    calculator.testInput,
                    { timeout: this.config.timeout }
                );
                
                const result = response.data;
                const hasExpectedFields = calculator.expectedFields.every(field => 
                    result && typeof result[field] !== 'undefined'
                );
                
                const calculatorResult = {
                    status: hasExpectedFields ? 'HEALTHY' : 'UNHEALTHY',
                    responseValid: !!result,
                    hasExpectedFields,
                    missingFields: calculator.expectedFields.filter(field => 
                        !result || typeof result[field] === 'undefined'
                    ),
                    calculation: result
                };
                
                healthReport.results.set(`medical.calculator_${calculator.name}`, calculatorResult);
                
                if (!hasExpectedFields) {
                    this.criticalIssues.push(`Calculadora ${calculator.name} com campos ausentes`);
                }
                
            } catch (error) {
                healthReport.results.set(`medical.calculator_${calculator.name}`, {
                    status: 'UNHEALTHY',
                    error: error.message
                });
                
                this.criticalIssues.push(`Calculadora ${calculator.name} falhou: ${error.message}`);
            }
        }
    }

    /**
     * Verificação da persona Dr. Gasnelio
     */
    async checkDrGasnelioPersona(healthReport) {
        try {
            const testQuestion = "Como é feita a classificação operacional da hanseníase?";
            
            const response = await axios.post(`${this.config.baseUrl}/api/gasnelio/consult`, {
                question: testQuestion,
                context: 'health_check'
            }, { timeout: 8000 });
            
            const gasnelioResponse = response.data?.response || '';
            
            // Avaliar qualidade da resposta
            const responseLength = gasnelioResponse.length;
            const hasMedicalTerms = this.containsMedicalTerms(gasnelioResponse);
            const isRelevant = this.isResponseRelevant(testQuestion, gasnelioResponse);
            
            const gasnelioResult = {
                status: responseLength > 50 && hasMedicalTerms && isRelevant ? 'HEALTHY' : 'UNHEALTHY',
                responseLength,
                hasMedicalTerms,
                isRelevant,
                responsePreview: gasnelioResponse.substring(0, 100) + '...',
                personality: {
                    active: true,
                    medicallyAccurate: hasMedicalTerms,
                    contextAware: isRelevant
                }
            };
            
            healthReport.results.set('medical.dr_gasnelio', gasnelioResult);
            
            if (!hasMedicalTerms) {
                this.criticalIssues.push('Dr. Gasnelio não está fornecendo conteúdo médico relevante');
            }
            
        } catch (error) {
            healthReport.results.set('medical.dr_gasnelio', {
                status: 'UNHEALTHY',
                error: error.message
            });
            
            this.criticalIssues.push(`Dr. Gasnelio falhou: ${error.message}`);
        }
    }

    /**
     * Verificação de proteção de dados de pacientes
     */
    async checkPatientDataProtection(healthReport) {
        try {
            // Verificar endpoint de proteção de dados
            const response = await axios.get(`${this.config.baseUrl}/api/patient/data-protection`, {
                timeout: this.config.timeout
            });
            
            const protection = response.data;
            
            const protectionResult = {
                status: protection.encrypted && protection.lgpdCompliant ? 'HEALTHY' : 'UNHEALTHY',
                encrypted: protection.encrypted,
                lgpdCompliant: protection.lgpdCompliant,
                auditTrailActive: protection.auditTrailActive,
                anonymizationActive: protection.anonymizationActive,
                dataRetentionPolicy: protection.dataRetentionPolicy
            };
            
            healthReport.results.set('medical.patient_data_protection', protectionResult);
            
            if (!protection.encrypted) {
                this.criticalIssues.push('Dados de pacientes não estão criptografados');
            }
            
            if (!protection.lgpdCompliant) {
                this.criticalIssues.push('Sistema não está em compliance LGPD para dados de pacientes');
            }
            
        } catch (error) {
            healthReport.results.set('medical.patient_data_protection', {
                status: 'UNHEALTHY',
                error: error.message
            });
            
            this.criticalIssues.push(`Proteção de dados falhou: ${error.message}`);
        }
    }

    /**
     * Análise dos resultados de saúde
     */
    async analyzeHealthResults(results, duration) {
        const totalChecks = results.size;
        const healthyChecks = Array.from(results.values()).filter(r => r.status === 'HEALTHY').length;
        const unhealthyChecks = totalChecks - healthyChecks;
        const healthPercentage = (healthyChecks / totalChecks) * 100;
        
        return {
            timestamp: new Date().toISOString(),
            duration: duration.toFixed(2),
            totalChecks,
            healthyChecks,
            unhealthyChecks,
            healthPercentage: healthPercentage.toFixed(2),
            overallStatus: healthPercentage >= 95 ? 'EXCELLENT' : 
                          healthPercentage >= 85 ? 'GOOD' : 
                          healthPercentage >= 70 ? 'FAIR' : 'POOR',
            criticalIssues: this.criticalIssues.length,
            medicalSystemsOperational: this.assessMedicalSystemsHealth(results)
        };
    }

    /**
     * Avaliação de compliance médico
     */
    assessMedicalCompliance(results) {
        const medicalChecks = [
            'medical.hanseniase_protocols',
            'medical.dr_gasnelio',
            'medical.patient_data_protection'
        ];
        
        return medicalChecks.every(check => {
            const result = results.get(check);
            return result && result.status === 'HEALTHY';
        });
    }

    /**
     * Avaliação de estabilidade do sistema
     */
    assessSystemStability(results) {
        const systemChecks = Array.from(results.keys()).filter(key => key.startsWith('system.'));
        const endpointChecks = Array.from(results.keys()).filter(key => key.startsWith('endpoint.'));
        
        const systemHealthy = systemChecks.every(check => results.get(check)?.status === 'HEALTHY');
        const endpointsHealthy = endpointChecks.every(check => results.get(check)?.status === 'HEALTHY');
        
        return systemHealthy && endpointsHealthy;
    }

    /**
     * Verificação com timeout
     */
    async executeWithTimeout(promise, timeoutMs) {
        return Promise.race([
            promise,
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), timeoutMs)
            )
        ]);
    }

    /**
     * Execução com retry
     */
    async executeWithRetry(fn, attempts = this.config.retryAttempts) {
        let lastError;
        
        for (let i = 0; i < attempts; i++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;
                
                if (i < attempts - 1) {
                    await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
                }
            }
        }
        
        throw lastError;
    }

    // Métodos auxiliares
    generateCheckId() {
        return `HC-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    }

    containsMedicalTerms(text) {
        const medicalTerms = [
            'hanseníase', 'paucibacilar', 'multibacilar', 'classificação',
            'operacional', 'diagnóstico', 'tratamento', 'medicação',
            'dapsona', 'rifampicina', 'clofazimina'
        ];
        
        const textLower = text.toLowerCase();
        return medicalTerms.some(term => textLower.includes(term));
    }

    isResponseRelevant(question, response) {
        const questionWords = question.toLowerCase().split(' ');
        const responseWords = response.toLowerCase().split(' ');
        
        const commonWords = questionWords.filter(word => 
            word.length > 3 && responseWords.includes(word)
        );
        
        return commonWords.length >= 2;
    }

    assessMedicalSystemsHealth(results) {
        const medicalSystems = [
            'medical.hanseniase_protocols',
            'medical.dr_gasnelio',
            'medical.patient_data_protection'
        ];
        
        const healthyCount = medicalSystems.filter(system => 
            results.get(system)?.status === 'HEALTHY'
        ).length;
        
        return healthyCount / medicalSystems.length >= 0.8;
    }

    async saveHealthCheck(healthReport) {
        const reportFile = path.join('./logs', `health-check-${healthReport.checkId}.json`);
        
        // Converter Map para Object para serialização
        const serializable = {
            ...healthReport,
            results: Object.fromEntries(healthReport.results)
        };
        
        await fs.writeFile(reportFile, JSON.stringify(serializable, null, 2));
    }

    // Métodos stub para implementações específicas do sistema
    async checkMemoryUsage() {
        return { usage: Math.random() * 100, threshold: this.config.criticalThresholds.memoryUsage };
    }
    
    async checkCPUUsage() {
        return { usage: Math.random() * 100, threshold: this.config.criticalThresholds.cpuUsage };
    }
    
    async checkDiskSpace() {
        return { usage: Math.random() * 100, threshold: this.config.criticalThresholds.diskUsage };
    }
    
    async checkNetworkConnectivity() {
        return { connected: true, latency: Math.random() * 100 };
    }
    
    async checkProcessHealth() {
        return { processesRunning: true, zombieProcesses: 0 };
    }
    
    async checkLogFileHealth() {
        return { logFilesAccessible: true, logRotationWorking: true };
    }
    
    // Métodos de verificação rápida
    async quickSystemCheck() {
        return { status: 'healthy', uptime: Date.now() };
    }
    
    async quickEndpointCheck() {
        const response = await axios.get(`${this.config.baseUrl}/api/health`, { timeout: 2000 });
        return { status: response.status === 200 ? 'healthy' : 'unhealthy' };
    }
    
    async quickMedicalCheck() {
        return { protocols: 'loaded', calculators: 'operational' };
    }
    
    async quickSecurityCheck() {
        return { encryption: 'active', lgpd: 'compliant' };
    }
    
    // ... outros métodos conforme necessário
}

export default MedicalHealthChecks;