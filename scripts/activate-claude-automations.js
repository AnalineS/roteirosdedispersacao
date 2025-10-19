#!/usr/bin/env node

/**
 * Claude Automations Activator - Central Control System
 *
 * Ativa todas as automações Claude para o sistema médico:
 * - Monitoring contínuo
 * - Verificação LGPD
 * - Auto documentação
 * - Quality blocking
 * - Performance tracking
 *
 * @version 1.0.0
 * @author Sistema de Ativação Claude
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

class ClaudeAutomationActivator {
    constructor() {
        this.processes = new Map();
        this.config = {
            automationPath: '.claude/automation',
            hooksPath: '.claude/hooks',
            logPath: './logs/claude-automations',
            maxRestarts: 3,
            restartDelay: 5000
        };

        this.automations = [
            {
                name: 'continuous-monitoring',
                script: '.claude/automation/continuous-monitoring-system.js',
                description: 'Sistema de monitoramento contínuo',
                persistent: true,
                critical: true
            },
            {
                name: 'lgpd-compliance',
                script: '.claude/automation/lgpd-robust.js',
                description: 'Verificação de conformidade LGPD',
                persistent: false,
                interval: 1800000, // 30 minutos
                critical: true
            },
            {
                name: 'auto-documentation',
                script: '.claude/automation/auto-documentation.js',
                description: 'Sistema de documentação automática',
                persistent: false,
                interval: 3600000, // 1 hora
                critical: false
            },
            {
                name: 'medical-quality-blocker',
                script: '.claude/hooks/medical-quality-blocker.js',
                description: 'Bloqueador de qualidade médica',
                persistent: false,
                trigger: 'on-demand',
                critical: true
            },
            {
                name: 'performance-tracker',
                script: '.claude/production/monitoring/performance-tracker.js',
                description: 'Rastreador de performance',
                persistent: true,
                critical: false
            },
            {
                name: 'health-checks',
                script: '.claude/production/monitoring/health-checks.js',
                description: 'Verificações de saúde do sistema',
                persistent: true,
                critical: true
            }
        ];

        this.log('Sistema de Ativação Claude iniciado', 'info');
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

        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${message}`;
        console.log(`${colors[type]}${logMessage}${colors.reset}`);

        // Gravar em arquivo de log
        this.writeLog(logMessage, type);
    }

    writeLog(message, type) {
        try {
            const logDir = this.config.logPath;
            if (!fs.existsSync(logDir)) {
                fs.mkdirSync(logDir, { recursive: true });
            }

            const logFile = path.join(logDir, `activator-${new Date().toISOString().split('T')[0]}.log`);
            const logEntry = `[${type.toUpperCase()}] ${message}\n`;

            fs.appendFileSync(logFile, logEntry);
        } catch (error) {
            // Silenciar erros de log para não interromper processo principal
        }
    }

    checkPrerequisites() {
        this.log('🔍 Verificando pré-requisitos...', 'info');

        const checks = [
            {
                name: 'Node.js version',
                check: () => {
                    const version = process.version;
                    const majorVersion = parseInt(version.slice(1).split('.')[0]);
                    return majorVersion >= 16;
                },
                error: 'Node.js 16+ é necessário'
            },
            {
                name: 'Estrutura de diretórios',
                check: () => {
                    return fs.existsSync('.claude') &&
                           fs.existsSync('.claude/automation') &&
                           fs.existsSync('.claude/hooks');
                },
                error: 'Estrutura .claude não encontrada'
            },
            {
                name: 'Scripts de automação',
                check: () => {
                    return this.automations.filter(auto =>
                        fs.existsSync(auto.script)
                    ).length >= 3; // Pelo menos 3 scripts críticos
                },
                error: 'Scripts de automação insuficientes'
            }
        ];

        for (const check of checks) {
            if (check.check()) {
                this.log(`✅ ${check.name}`, 'success');
            } else {
                this.log(`❌ ${check.name}: ${check.error}`, 'error');
                return false;
            }
        }

        return true;
    }

    startAutomation(automation) {
        if (!fs.existsSync(automation.script)) {
            this.log(`⚠️ Script não encontrado: ${automation.script}`, 'warning');
            return false;
        }

        this.log(`🚀 Iniciando: ${automation.description}`, 'info');

        try {
            if (automation.persistent) {
                // Processo persistente
                const process = spawn('node', [automation.script], {
                    stdio: ['ignore', 'pipe', 'pipe'],
                    detached: false
                });

                process.stdout.on('data', (data) => {
                    this.log(`[${automation.name}] ${data.toString().trim()}`, 'info');
                });

                process.stderr.on('data', (data) => {
                    this.log(`[${automation.name}] ERROR: ${data.toString().trim()}`, 'error');
                });

                process.on('close', (code) => {
                    this.log(`[${automation.name}] Processo finalizado com código: ${code}`,
                             code === 0 ? 'info' : 'warning');

                    // Restart automático se necessário
                    if (automation.critical && code !== 0) {
                        this.scheduleRestart(automation);
                    }
                });

                this.processes.set(automation.name, { process, automation, restarts: 0 });

            } else if (automation.interval) {
                // Processo com intervalo
                const runInterval = () => {
                    try {
                        execSync(`node ${automation.script}`, {
                            stdio: 'pipe',
                            timeout: 60000 // 1 minuto timeout
                        });
                        this.log(`[${automation.name}] Execução concluída`, 'success');
                    } catch (error) {
                        this.log(`[${automation.name}] Erro na execução: ${error.message}`, 'error');
                    }
                };

                // Executar imediatamente
                runInterval();

                // Agendar execuções
                const intervalId = setInterval(runInterval, automation.interval);
                this.processes.set(automation.name, { intervalId, automation });

            } else {
                // Execução única
                execSync(`node ${automation.script}`, { stdio: 'inherit' });
                this.log(`[${automation.name}] Execução única concluída`, 'success');
            }

            return true;

        } catch (error) {
            this.log(`❌ Falha ao iniciar ${automation.name}: ${error.message}`, 'error');
            return false;
        }
    }

    scheduleRestart(automation) {
        const processInfo = this.processes.get(automation.name);
        if (!processInfo) return;

        processInfo.restarts = (processInfo.restarts || 0) + 1;

        if (processInfo.restarts <= this.config.maxRestarts) {
            this.log(`🔄 Agendando restart de ${automation.name} em ${this.config.restartDelay}ms (tentativa ${processInfo.restarts})`, 'warning');

            setTimeout(() => {
                this.startAutomation(automation);
            }, this.config.restartDelay);
        } else {
            this.log(`🚫 Máximo de restarts atingido para ${automation.name}`, 'error');
        }
    }

    stopAll() {
        this.log('🛑 Parando todas as automações...', 'warning');

        for (const [name, processInfo] of this.processes) {
            try {
                if (processInfo.process) {
                    processInfo.process.kill('SIGTERM');
                    this.log(`✅ Processo ${name} finalizado`, 'success');
                } else if (processInfo.intervalId) {
                    clearInterval(processInfo.intervalId);
                    this.log(`✅ Intervalo ${name} cancelado`, 'success');
                }
            } catch (error) {
                this.log(`⚠️ Erro ao parar ${name}: ${error.message}`, 'warning');
            }
        }

        this.processes.clear();
        this.log('🔴 Todas as automações foram paradas', 'info');
    }

    getStatus() {
        const status = {
            total: this.automations.length,
            running: this.processes.size,
            critical_running: 0,
            processes: []
        };

        for (const [name, processInfo] of this.processes) {
            const isRunning = processInfo.process ? !processInfo.process.killed : true;
            if (isRunning && processInfo.automation.critical) {
                status.critical_running++;
            }

            status.processes.push({
                name,
                running: isRunning,
                critical: processInfo.automation.critical,
                restarts: processInfo.restarts || 0
            });
        }

        return status;
    }

    activateAll() {
        this.log('🎯 Ativando todas as automações Claude...', 'info');

        if (!this.checkPrerequisites()) {
            this.log('❌ Pré-requisitos não atendidos. Abortando ativação.', 'error');
            return false;
        }

        let successCount = 0;
        let criticalFailures = 0;

        for (const automation of this.automations) {
            const success = this.startAutomation(automation);

            if (success) {
                successCount++;
            } else if (automation.critical) {
                criticalFailures++;
            }
        }

        // Relatório final
        this.log('📊 Relatório de Ativação:', 'info');
        this.log(`✅ Sucessos: ${successCount}/${this.automations.length}`, 'success');
        this.log(`❌ Falhas críticas: ${criticalFailures}`, criticalFailures > 0 ? 'error' : 'success');

        if (criticalFailures === 0) {
            this.log('🎉 Todas as automações críticas foram ativadas com sucesso!', 'success');

            // Configurar handlers de sinal
            process.on('SIGINT', () => {
                this.log('🔄 Recebido SIGINT, parando automações...', 'warning');
                this.stopAll();
                process.exit(0);
            });

            process.on('SIGTERM', () => {
                this.log('🔄 Recebido SIGTERM, parando automações...', 'warning');
                this.stopAll();
                process.exit(0);
            });

            return true;
        } else {
            this.log('🚨 Falhas críticas detectadas. Sistema pode não funcionar corretamente.', 'critical');
            return false;
        }
    }

    runHealthCheck() {
        this.log('🏥 Executando verificação de saúde...', 'info');

        const status = this.getStatus();

        this.log(`📈 Status: ${status.running}/${status.total} automações ativas`, 'info');
        this.log(`🔥 Críticas ativas: ${status.critical_running}`, 'info');

        if (status.critical_running < this.automations.filter(a => a.critical).length) {
            this.log('⚠️ Algumas automações críticas não estão rodando!', 'warning');
            return false;
        }

        this.log('✅ Sistema de automação saudável', 'success');
        return true;
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    const activator = new ClaudeAutomationActivator();

    const args = process.argv.slice(2);

    if (args.includes('--health')) {
        activator.runHealthCheck();
    } else if (args.includes('--stop')) {
        activator.stopAll();
    } else if (args.includes('--status')) {
        console.log(JSON.stringify(activator.getStatus(), null, 2));
    } else {
        const success = activator.activateAll();

        if (success) {
            // Manter processo vivo para automações persistentes
            setInterval(() => {
                activator.runHealthCheck();
            }, 300000); // Verificar saúde a cada 5 minutos

            activator.log('🔄 Sistema de automação ativo. Use Ctrl+C para parar.', 'info');
        } else {
            process.exit(1);
        }
    }
}

module.exports = ClaudeAutomationActivator;