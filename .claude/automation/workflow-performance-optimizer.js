#!/usr/bin/env node

/**
 * Otimizador de Performance de Workflows - Fase 3
 * 
 * Sistema avançado de otimização para workflows existentes:
 * - Cache inteligente para operações médicas repetitivas
 * - Paralelização de verificações não-dependentes
 * - Otimização por persona (Dr. Gasnelio vs GA)
 * - Circuit breaker para serviços críticos
 * - Recuperação automática de falhas
 * 
 * @version 3.0.0
 * @author Sistema de Automação Claude - Fase 3
 */

const fs = require('fs').promises;
const path = require('path');
const { Worker } = require('worker_threads');
const { spawn, exec } = require('child_process');
const EventEmitter = require('events');

class WorkflowPerformanceOptimizer extends EventEmitter {
    constructor() {
        super();
        
        this.config = {
            // Cache inteligente
            cache: {
                enabled: true,
                medicalCalculations: {
                    ttl: 24 * 60 * 60 * 1000, // 24 horas
                    maxSize: 1000
                },
                lgpdValidations: {
                    ttl: 60 * 60 * 1000, // 1 hora
                    maxSize: 500
                },
                accessibilityChecks: {
                    ttl: 30 * 60 * 1000, // 30 minutos
                    maxSize: 200
                }
            },

            // Paralelização
            concurrency: {
                maxWorkers: 4,
                medicalValidation: 2,
                lgpdChecks: 3,
                accessibilityTests: 2,
                performanceTests: 1
            },

            // Circuit breaker
            circuitBreaker: {
                failureThreshold: 5,
                resetTimeout: 30000,
                monitoringPeriod: 60000
            },

            // Otimização por persona
            personaOptimization: {
                'Dr. Gasnelio': {
                    priority: 'precision',
                    cacheStrategy: 'aggressive',
                    parallelism: 'high',
                    timeout: 10000
                },
                'GA': {
                    priority: 'learning',
                    cacheStrategy: 'educational',
                    parallelism: 'medium',
                    timeout: 15000
                }
            },

            // Performance targets
            targets: {
                medicalCalculation: 500, // ms
                lgpdValidation: 200,     // ms
                accessibilityCheck: 1000, // ms
                fullWorkflow: 5000       // ms
            }
        };

        this.cache = new Map();
        this.circuitBreakers = new Map();
        this.workerPool = [];
        this.metrics = {
            cacheHits: 0,
            cacheMisses: 0,
            optimizationsSaved: 0,
            averageExecutionTime: 0,
            failureRecoveries: 0
        };

        this.initializeWorkerPool();
        this.setupCircuitBreakers();
    }

    /**
     * Inicializa pool de workers para processamento paralelo
     */
    initializeWorkerPool() {
        const workerScript = path.join(__dirname, 'workflow-worker.js');
        
        for (let i = 0; i < this.config.concurrency.maxWorkers; i++) {
            try {
                const worker = new Worker(workerScript);
                worker.on('error', (error) => {
                    console.error(`Worker ${i} erro:`, error);
                    this.replaceWorker(i);
                });
                
                this.workerPool.push({
                    worker,
                    busy: false,
                    id: i
                });
            } catch (error) {
                console.warn(`Não foi possível criar worker ${i}, usando processamento síncrono`);
            }
        }
    }

    /**
     * Configura circuit breakers para serviços críticos
     */
    setupCircuitBreakers() {
        const services = ['medical-validation', 'lgpd-compliance', 'accessibility-check'];
        
        services.forEach(service => {
            this.circuitBreakers.set(service, {
                state: 'closed', // closed, open, half-open
                failures: 0,
                lastFailure: null,
                successCount: 0
            });
        });
    }

    /**
     * Otimiza workflow completo com inteligência contextual
     */
    async optimizeWorkflow(workflowType, data, options = {}) {
        const startTime = Date.now();
        
        try {
            // Análise contextual
            const context = await this.analyzeWorkflowContext(workflowType, data, options);
            
            // Estratégia de otimização
            const strategy = this.selectOptimizationStrategy(context);
            
            // Execução otimizada
            const result = await this.executeOptimizedWorkflow(workflowType, data, strategy);
            
            // Métricas e aprendizado
            const executionTime = Date.now() - startTime;
            await this.updateMetrics(workflowType, executionTime, result);
            
            return {
                success: true,
                result,
                executionTime,
                optimizations: strategy.optimizations,
                metrics: this.getRelevantMetrics(workflowType)
            };

        } catch (error) {
            const executionTime = Date.now() - startTime;
            
            // Tentativa de recuperação
            const recovery = await this.attemptRecovery(workflowType, data, error);
            
            if (recovery.success) {
                this.metrics.failureRecoveries++;
                return recovery;
            }

            throw new Error(`Falha na otimização do workflow ${workflowType}: ${error.message}`);
        }
    }

    /**
     * Analisa contexto do workflow
     */
    async analyzeWorkflowContext(workflowType, data, options) {
        return {
            workflowType,
            dataComplexity: this.assessDataComplexity(data),
            personaContext: this.extractPersonaContext(options),
            historicalPerformance: await this.getHistoricalPerformance(workflowType),
            systemLoad: await this.getCurrentSystemLoad(),
            cacheability: this.assessCacheability(workflowType, data),
            parallelizability: this.assessParallelizability(workflowType, data)
        };
    }

    /**
     * Seleciona estratégia de otimização
     */
    selectOptimizationStrategy(context) {
        const strategy = {
            caching: false,
            parallelization: false,
            circuitBreaker: false,
            personaOptimization: false,
            optimizations: []
        };

        // Cache inteligente
        if (context.cacheability.score > 0.7) {
            strategy.caching = true;
            strategy.optimizations.push('intelligent_caching');
        }

        // Paralelização
        if (context.parallelizability.score > 0.6 && context.systemLoad < 0.8) {
            strategy.parallelization = true;
            strategy.optimizations.push('smart_parallelization');
        }

        // Circuit breaker para serviços críticos
        if (context.workflowType.includes('medical') || context.workflowType.includes('lgpd')) {
            strategy.circuitBreaker = true;
            strategy.optimizations.push('circuit_breaker_protection');
        }

        // Otimização por persona
        if (context.personaContext.identified) {
            strategy.personaOptimization = true;
            strategy.optimizations.push(`persona_optimization_${context.personaContext.persona}`);
        }

        return strategy;
    }

    /**
     * Executa workflow otimizado
     */
    async executeOptimizedWorkflow(workflowType, data, strategy) {
        const tasks = this.decomposeTasks(workflowType, data);
        const results = [];

        // Cache check primeiro
        if (strategy.caching) {
            const cached = await this.checkCache(workflowType, data);
            if (cached) {
                this.metrics.cacheHits++;
                return cached;
            }
            this.metrics.cacheMisses++;
        }

        // Execução com estratégias aplicadas
        if (strategy.parallelization && tasks.length > 1) {
            // Execução paralela
            results.push(...await this.executeParallel(tasks, strategy));
        } else {
            // Execução sequencial otimizada
            for (const task of tasks) {
                const result = await this.executeTask(task, strategy);
                results.push(result);
            }
        }

        // Agregação e cache dos resultados
        const finalResult = this.aggregateResults(results, workflowType);
        
        if (strategy.caching) {
            await this.cacheResult(workflowType, data, finalResult);
        }

        return finalResult;
    }

    /**
     * Executa tarefas em paralelo com worker pool
     */
    async executeParallel(tasks, strategy) {
        const promises = tasks.map(task => this.executeTaskWithWorker(task, strategy));
        return await Promise.all(promises);
    }

    /**
     * Executa tarefa com worker disponível
     */
    async executeTaskWithWorker(task, strategy) {
        const worker = await this.getAvailableWorker();
        
        if (!worker) {
            // Fallback para execução síncrona
            return await this.executeTask(task, strategy);
        }

        try {
            worker.busy = true;
            
            return await new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error(`Task timeout: ${task.type}`));
                }, strategy.timeout || 10000);

                worker.worker.postMessage({ task, strategy });
                
                worker.worker.once('message', (result) => {
                    clearTimeout(timeout);
                    worker.busy = false;
                    
                    if (result.error) {
                        reject(new Error(result.error));
                    } else {
                        resolve(result.data);
                    }
                });
            });

        } catch (error) {
            worker.busy = false;
            throw error;
        }
    }

    /**
     * Executa tarefa individual
     */
    async executeTask(task, strategy) {
        // Circuit breaker check
        if (strategy.circuitBreaker) {
            const canExecute = await this.checkCircuitBreaker(task.service);
            if (!canExecute) {
                throw new Error(`Circuit breaker open for service: ${task.service}`);
            }
        }

        try {
            let result;

            switch (task.type) {
                case 'medical_validation':
                    result = await this.executeMedicalValidation(task.data, strategy);
                    break;
                
                case 'lgpd_check':
                    result = await this.executeLGPDCheck(task.data, strategy);
                    break;
                
                case 'accessibility_test':
                    result = await this.executeAccessibilityTest(task.data, strategy);
                    break;
                
                case 'performance_test':
                    result = await this.executePerformanceTest(task.data, strategy);
                    break;
                
                default:
                    result = await this.executeGenericTask(task, strategy);
            }

            // Sucesso - reset circuit breaker
            if (strategy.circuitBreaker) {
                await this.recordCircuitBreakerSuccess(task.service);
            }

            return result;

        } catch (error) {
            // Falha - update circuit breaker
            if (strategy.circuitBreaker) {
                await this.recordCircuitBreakerFailure(task.service, error);
            }
            
            throw error;
        }
    }

    /**
     * Otimizações específicas para validação médica
     */
    async executeMedicalValidation(data, strategy) {
        const cacheKey = `medical_${this.generateCacheKey(data)}`;
        
        // Cache check específico para cálculos médicos
        if (strategy.caching) {
            const cached = this.cache.get(cacheKey);
            if (cached && !this.isMedicalDataExpired(cached)) {
                return cached.result;
            }
        }

        // Otimização por persona
        let validationLevel = 'standard';
        if (strategy.personaOptimization) {
            const persona = data.persona || 'GA';
            validationLevel = this.config.personaOptimization[persona]?.priority === 'precision' 
                ? 'advanced' : 'educational';
        }

        const result = await this.performMedicalValidation(data, validationLevel);

        // Cache com TTL específico para dados médicos
        if (strategy.caching) {
            this.cache.set(cacheKey, {
                result,
                timestamp: Date.now(),
                ttl: this.config.cache.medicalCalculations.ttl
            });
        }

        return result;
    }

    /**
     * Otimizações específicas para LGPD
     */
    async executeLGPDCheck(data, strategy) {
        const cacheKey = `lgpd_${this.generateCacheKey(data)}`;
        
        // LGPD tem cache mais conservador
        if (strategy.caching) {
            const cached = this.cache.get(cacheKey);
            if (cached && (Date.now() - cached.timestamp) < this.config.cache.lgpdValidations.ttl) {
                return cached.result;
            }
        }

        // LGPD sempre tem prioridade máxima
        const result = await this.performLGPDValidation(data, 'strict');

        if (strategy.caching && result.compliant) {
            this.cache.set(cacheKey, {
                result,
                timestamp: Date.now(),
                ttl: this.config.cache.lgpdValidations.ttl
            });
        }

        return result;
    }

    /**
     * Otimizações específicas para acessibilidade
     */
    async executeAccessibilityTest(data, strategy) {
        const cacheKey = `a11y_${this.generateCacheKey(data)}`;
        
        if (strategy.caching) {
            const cached = this.cache.get(cacheKey);
            if (cached && (Date.now() - cached.timestamp) < this.config.cache.accessibilityChecks.ttl) {
                return cached.result;
            }
        }

        // Teste adaptativo baseado na persona
        const testLevel = strategy.personaOptimization && data.persona === 'Dr. Gasnelio' 
            ? 'comprehensive' : 'standard';

        const result = await this.performAccessibilityTest(data, testLevel);

        if (strategy.caching) {
            this.cache.set(cacheKey, {
                result,
                timestamp: Date.now(),
                ttl: this.config.cache.accessibilityChecks.ttl
            });
        }

        return result;
    }

    /**
     * Sistema de recuperação automática
     */
    async attemptRecovery(workflowType, data, error) {
        console.log(`Tentando recuperação para workflow ${workflowType}:`, error.message);

        try {
            // Estratégias de recuperação progressiva
            
            // 1. Retry com backoff exponencial
            await this.sleep(Math.pow(2, 1) * 1000);
            let result = await this.executeSimplifiedWorkflow(workflowType, data);
            if (result) {
                return { success: true, result, recovered: true, method: 'retry' };
            }

            // 2. Fallback para cache antigo se disponível
            const staleCache = await this.getStaleCache(workflowType, data);
            if (staleCache) {
                return { 
                    success: true, 
                    result: staleCache, 
                    recovered: true, 
                    method: 'stale_cache',
                    warning: 'Using stale cached data'
                };
            }

            // 3. Modo degradado
            result = await this.executeDegradedMode(workflowType, data);
            if (result) {
                return { 
                    success: true, 
                    result, 
                    recovered: true, 
                    method: 'degraded_mode',
                    warning: 'Operating in degraded mode'
                };
            }

        } catch (recoveryError) {
            console.error('Falha na recuperação:', recoveryError);
        }

        return { success: false, error: error.message };
    }

    /**
     * Gerenciamento de circuit breaker
     */
    async checkCircuitBreaker(service) {
        const breaker = this.circuitBreakers.get(service);
        if (!breaker) return true;

        const now = Date.now();

        switch (breaker.state) {
            case 'closed':
                return true;

            case 'open':
                if (now - breaker.lastFailure > this.config.circuitBreaker.resetTimeout) {
                    breaker.state = 'half-open';
                    breaker.successCount = 0;
                    return true;
                }
                return false;

            case 'half-open':
                return true;

            default:
                return true;
        }
    }

    async recordCircuitBreakerFailure(service, error) {
        const breaker = this.circuitBreakers.get(service);
        if (!breaker) return;

        breaker.failures++;
        breaker.lastFailure = Date.now();

        if (breaker.failures >= this.config.circuitBreaker.failureThreshold) {
            breaker.state = 'open';
            console.warn(`Circuit breaker opened for service: ${service}`);
        }
    }

    async recordCircuitBreakerSuccess(service) {
        const breaker = this.circuitBreakers.get(service);
        if (!breaker) return;

        if (breaker.state === 'half-open') {
            breaker.successCount++;
            if (breaker.successCount >= 3) {
                breaker.state = 'closed';
                breaker.failures = 0;
                console.log(`Circuit breaker closed for service: ${service}`);
            }
        }
    }

    /**
     * Utilitários e helpers
     */
    
    generateCacheKey(data) {
        return require('crypto')
            .createHash('md5')
            .update(JSON.stringify(data))
            .digest('hex');
    }

    async getAvailableWorker() {
        return this.workerPool.find(w => !w.busy) || null;
    }

    decomposeTasks(workflowType, data) {
        // Decompõe workflow em tarefas paralelas
        const tasks = [];

        switch (workflowType) {
            case 'full_quality_check':
                tasks.push(
                    { type: 'medical_validation', data, service: 'medical-validation' },
                    { type: 'lgpd_check', data, service: 'lgpd-compliance' },
                    { type: 'accessibility_test', data, service: 'accessibility-check' }
                );
                break;

            case 'medical_workflow':
                tasks.push(
                    { type: 'medical_validation', data, service: 'medical-validation' },
                    { type: 'performance_test', data: { ...data, focus: 'medical' }, service: 'performance' }
                );
                break;

            default:
                tasks.push({ type: 'generic', data, service: 'generic' });
        }

        return tasks;
    }

    aggregateResults(results, workflowType) {
        // Agrega resultados baseado no tipo de workflow
        const aggregated = {
            overall_status: 'success',
            details: results,
            summary: {},
            optimizations_applied: []
        };

        // Lógica específica de agregação por tipo
        switch (workflowType) {
            case 'full_quality_check':
                aggregated.summary = {
                    medical_validation: results.find(r => r.type === 'medical_validation'),
                    lgpd_compliance: results.find(r => r.type === 'lgpd_check'),
                    accessibility: results.find(r => r.type === 'accessibility_test')
                };
                
                // Status geral é falha se qualquer verificação crítica falhar
                if (results.some(r => r.critical && !r.passed)) {
                    aggregated.overall_status = 'failure';
                }
                break;

            default:
                aggregated.summary = { results };
        }

        return aggregated;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * API pública
     */
    
    // Otimizar workflow médico específico
    async optimizeMedicalWorkflow(data, persona = 'GA') {
        return await this.optimizeWorkflow('medical_workflow', { ...data, persona });
    }

    // Otimizar verificação de qualidade completa
    async optimizeQualityCheck(data, options = {}) {
        return await this.optimizeWorkflow('full_quality_check', data, options);
    }

    // Otimizar validação LGPD
    async optimizeLGPDValidation(data) {
        return await this.optimizeWorkflow('lgpd_validation', data);
    }

    // Métricas de performance
    getPerformanceMetrics() {
        const cacheHitRate = this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses) || 0;
        
        return {
            cacheHitRate: Math.round(cacheHitRate * 100) / 100,
            totalOptimizations: this.metrics.optimizationsSaved,
            averageExecutionTime: this.metrics.averageExecutionTime,
            successfulRecoveries: this.metrics.failureRecoveries,
            circuitBreakerStatus: this.getCircuitBreakerStatus(),
            workerPoolUtilization: this.getWorkerPoolUtilization()
        };
    }

    getCircuitBreakerStatus() {
        const status = {};
        for (const [service, breaker] of this.circuitBreakers) {
            status[service] = breaker.state;
        }
        return status;
    }

    getWorkerPoolUtilization() {
        const busyWorkers = this.workerPool.filter(w => w.busy).length;
        return busyWorkers / this.workerPool.length;
    }

    // Limpar cache
    clearCache() {
        this.cache.clear();
        this.metrics.cacheHits = 0;
        this.metrics.cacheMisses = 0;
    }

    // Configuração dinâmica
    updateConfiguration(newConfig) {
        this.config = { ...this.config, ...newConfig };
    }
}

module.exports = { WorkflowPerformanceOptimizer };

// Singleton para uso global
const optimizer = new WorkflowPerformanceOptimizer();

// CLI para uso direto
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.length < 2) {
        console.log('Uso: node workflow-performance-optimizer.js <workflow_type> <data_json>');
        process.exit(1);
    }

    const workflowType = args[0];
    const data = JSON.parse(args[1]);

    optimizer.optimizeWorkflow(workflowType, data)
        .then(result => {
            console.log('Workflow otimizado com sucesso:');
            console.log(JSON.stringify(result, null, 2));
        })
        .catch(error => {
            console.error('Erro na otimização:', error);
            process.exit(1);
        });
}