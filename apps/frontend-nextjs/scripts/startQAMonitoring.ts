#!/usr/bin/env ts-node

/**
 * Script de monitoramento QA
 * Monitora qualidade em tempo real durante desenvolvimento
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface MonitoringConfig {
  interval: number; // ms
  watchFiles: string[];
  notifications: boolean;
}

const defaultConfig: MonitoringConfig = {
  interval: 30000, // 30 segundos
  watchFiles: [
    'src/**/*.ts',
    'src/**/*.tsx',
    'src/**/*.js',
    'src/**/*.jsx'
  ],
  notifications: true
};

class QAMonitor {
  private config: MonitoringConfig;
  private lastCheck: number = 0;
  private running: boolean = false;

  constructor(config: MonitoringConfig = defaultConfig) {
    this.config = config;
  }

  private log(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
    const timestamp = new Date().toLocaleTimeString();
    const icons = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    };
    
    console.log(`[${timestamp}] ${icons[type]} ${message}`);
  }

  private async runCheck(): Promise<void> {
    this.log('Iniciando verificação QA...');

    try {
      // Quick lint check
      const lintResult = execSync('npm run lint', { encoding: 'utf8', stdio: 'pipe' });
      
      // Quick type check
      const typeResult = execSync('npm run type-check', { encoding: 'utf8', stdio: 'pipe' });
      
      this.log('Verificação QA concluída com sucesso', 'success');
      
    } catch (error: any) {
      this.log(`Problemas detectados: ${error.message}`, 'warning');
      
      if (this.config.notifications) {
        // Simulated notification (would integrate with system notifications)
        console.log('\n🔔 NOTIFICAÇÃO: Problemas de qualidade detectados!');
      }
    }
  }

  private async watchLoop(): Promise<void> {
    while (this.running) {
      const now = Date.now();
      
      if (now - this.lastCheck >= this.config.interval) {
        await this.runCheck();
        this.lastCheck = now;
      }
      
      // Wait 1 second before next iteration
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  public start(): void {
    if (this.running) {
      this.log('Monitor já está rodando', 'warning');
      return;
    }

    this.running = true;
    this.log('🚀 Iniciando monitor QA...');
    this.log(`Intervalo: ${this.config.interval / 1000}s`);
    this.log(`Notificações: ${this.config.notifications ? 'Ativadas' : 'Desativadas'}`);
    
    this.watchLoop().catch(error => {
      this.log(`Erro no monitor: ${error.message}`, 'error');
    });
  }

  public stop(): void {
    if (!this.running) {
      this.log('Monitor não está rodando', 'warning');
      return;
    }

    this.running = false;
    this.log('🛑 Monitor QA parado');
  }
}

function parseArgs(): Partial<MonitoringConfig> {
  const args = process.argv.slice(2);
  const config: Partial<MonitoringConfig> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg.startsWith('--interval=')) {
      config.interval = parseInt(arg.split('=')[1]) * 1000;
    } else if (arg === '--no-notifications') {
      config.notifications = false;
    }
  }

  return config;
}

function startMonitoring(): void {
  console.log('🔍 Monitor QA - Sistema Educacional Hanseníase\n');
  
  const customConfig = parseArgs();
  const config = { ...defaultConfig, ...customConfig };
  
  const monitor = new QAMonitor(config);
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n');
    monitor.stop();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    monitor.stop();
    process.exit(0);
  });
  
  monitor.start();
  
  // Keep process alive
  setInterval(() => {
    // This keeps the process running
  }, 1000);
}

if (require.main === module) {
  startMonitoring();
}

export { QAMonitor };