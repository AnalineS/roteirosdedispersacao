#!/usr/bin/env node

/**
 * Script de Cleanup para Ambiente de Desenvolvimento
 * Mata processos Node.js órfãos nas portas 3000-3010
 */

const { execSync, spawn } = require('child_process');
const os = require('os');

const PORTS_TO_CHECK = [3000, 3001, 3002, 3003, 3004, 3005, 3006, 3007, 3008, 3009, 3010];
const IS_WINDOWS = os.platform() === 'win32';

console.log('🧹 Iniciando cleanup do ambiente de desenvolvimento...\n');

/**
 * Executa comando e retorna saída
 */
function executeCommand(command) {
  try {
    return execSync(command, { encoding: 'utf8', stdio: 'pipe' });
  } catch (error) {
    return null;
  }
}

/**
 * Obtém processos usando as portas especificadas
 */
function getProcessesOnPorts() {
  const processes = [];
  
  if (IS_WINDOWS) {
    const portsStr = PORTS_TO_CHECK.join(',');
    const output = executeCommand(`powershell "Get-NetTCPConnection -LocalPort ${portsStr} -ErrorAction SilentlyContinue | Select-Object LocalPort,OwningProcess | ConvertTo-Json"`);
    
    if (output) {
      try {
        const connections = JSON.parse(output);
        const connectionsArray = Array.isArray(connections) ? connections : [connections];
        
        connectionsArray.forEach(conn => {
          if (conn && conn.OwningProcess) {
            processes.push({
              port: conn.LocalPort,
              pid: conn.OwningProcess
            });
          }
        });
      } catch (error) {
        console.log('⚠️  Erro ao processar conexões:', error.message);
      }
    }
  } else {
    // Linux/macOS
    PORTS_TO_CHECK.forEach(port => {
      const output = executeCommand(`lsof -ti:${port}`);
      if (output) {
        const pids = output.trim().split('\n').filter(Boolean);
        pids.forEach(pid => {
          processes.push({ port, pid: parseInt(pid) });
        });
      }
    });
  }
  
  return processes;
}

/**
 * Obtém informações detalhadas dos processos
 */
function getProcessDetails(processes) {
  const details = [];
  
  processes.forEach(({ port, pid }) => {
    if (IS_WINDOWS) {
      const output = executeCommand(`powershell "Get-Process -Id ${pid} -ErrorAction SilentlyContinue | Select-Object Id,ProcessName,StartTime,CPU | ConvertTo-Json"`);
      if (output) {
        try {
          const process = JSON.parse(output);
          details.push({
            port,
            pid,
            name: process.ProcessName,
            startTime: process.StartTime,
            cpu: process.CPU
          });
        } catch (error) {
          details.push({ port, pid, name: 'unknown', startTime: null, cpu: 0 });
        }
      }
    } else {
      const output = executeCommand(`ps -p ${pid} -o comm= 2>/dev/null`);
      details.push({
        port,
        pid,
        name: output ? output.trim() : 'unknown',
        startTime: null,
        cpu: 0
      });
    }
  });
  
  return details;
}

/**
 * Mata um processo
 */
function killProcess(pid) {
  try {
    if (IS_WINDOWS) {
      executeCommand(`powershell "Stop-Process -Id ${pid} -Force -ErrorAction SilentlyContinue"`);
    } else {
      executeCommand(`kill -9 ${pid}`);
    }
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Verifica se um processo é Node.js relacionado ao desenvolvimento
 */
function isDevProcess(processName, port) {
  const devProcessNames = ['node', 'node.exe', 'npm', 'yarn', 'next'];
  return devProcessNames.some(name => 
    processName && processName.toLowerCase().includes(name.toLowerCase())
  ) && PORTS_TO_CHECK.includes(port);
}

/**
 * Função principal
 */
async function main() {
  console.log('🔍 Verificando processos nas portas:', PORTS_TO_CHECK.join(', '));
  
  const processes = getProcessesOnPorts();
  
  if (processes.length === 0) {
    console.log('✅ Nenhum processo encontrado nas portas especificadas.');
    console.log('🎉 Ambiente limpo!\n');
    return;
  }
  
  console.log(`\n📋 Encontrados ${processes.length} processo(s):\n`);
  
  const processDetails = getProcessDetails(processes);
  
  // Mostrar tabela de processos
  console.log('Port  PID     Process     Start Time           CPU');
  console.log('----  ------  ----------  -------------------  -----');
  
  const devProcesses = [];
  const otherProcesses = [];
  
  processDetails.forEach(proc => {
    const startTime = proc.startTime ? new Date(proc.startTime).toLocaleString() : 'unknown';
    const cpu = proc.cpu ? proc.cpu.toFixed(2) : '0.00';
    
    console.log(`${proc.port.toString().padEnd(4)}  ${proc.pid.toString().padEnd(6)}  ${proc.name.padEnd(10)}  ${startTime.padEnd(19)}  ${cpu}`);
    
    if (isDevProcess(proc.name, proc.port)) {
      devProcesses.push(proc);
    } else {
      otherProcesses.push(proc);
    }
  });
  
  console.log('\n');
  
  if (devProcesses.length === 0) {
    console.log('⚠️  Nenhum processo de desenvolvimento encontrado.');
    console.log('   Os processos encontrados podem ser importantes do sistema.');
    console.log('   Cleanup cancelado por segurança.\n');
    return;
  }
  
  // Perguntar confirmação para processos de desenvolvimento
  if (process.argv.includes('--force') || process.argv.includes('-f')) {
    console.log('🔥 Modo força ativado. Matando processos de desenvolvimento...\n');
  } else {
    console.log(`⚠️  Encontrados ${devProcesses.length} processo(s) de desenvolvimento.`);
    console.log('   Execute com --force para matar automaticamente, ou Ctrl+C para cancelar.\n');
    
    // Aguardar 5 segundos para cancelamento
    await new Promise(resolve => {
      let countdown = 5;
      const interval = setInterval(() => {
        process.stdout.write(`\rMatando em ${countdown}s... `);
        countdown--;
        if (countdown < 0) {
          clearInterval(interval);
          console.log('\n');
          resolve();
        }
      }, 1000);
      
      // Permitir cancelamento
      process.on('SIGINT', () => {
        clearInterval(interval);
        console.log('\n\n❌ Cleanup cancelado pelo usuário.');
        process.exit(0);
      });
    });
  }
  
  // Matar processos de desenvolvimento
  let killedCount = 0;
  
  for (const proc of devProcesses) {
    process.stdout.write(`Matando processo ${proc.pid} (${proc.name}) na porta ${proc.port}... `);
    
    if (killProcess(proc.pid)) {
      console.log('✅');
      killedCount++;
    } else {
      console.log('❌');
    }
  }
  
  console.log(`\n🎯 Resultado: ${killedCount}/${devProcesses.length} processos mortos.`);
  
  if (otherProcesses.length > 0) {
    console.log(`⚠️  ${otherProcesses.length} processo(s) não relacionados ao desenvolvimento foram preservados.`);
  }
  
  // Verificar se portas foram liberadas
  setTimeout(() => {
    const remainingProcesses = getProcessesOnPorts();
    if (remainingProcesses.length === 0) {
      console.log('✅ Todas as portas foram liberadas!');
      console.log('🚀 Ambiente pronto para desenvolvimento.\n');
    } else {
      console.log(`⚠️  Ainda há ${remainingProcesses.length} processo(s) nas portas.`);
      console.log('   Alguns processos podem demorar para finalizar.\n');
    }
  }, 2000);
}

// Tratamento de erros
process.on('uncaughtException', (error) => {
  console.log('\n❌ Erro inesperado:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.log('\n❌ Erro de promise:', error);
  process.exit(1);
});

// Executar
if (require.main === module) {
  main().catch(console.error);
}