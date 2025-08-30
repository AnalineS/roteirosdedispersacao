#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de Inicialização do Ambiente de Desenvolvimento Integrado
Engenheiro de Integração Full-Stack Sênior especializado em Sistemas Médicos

Este script configura e inicia o ambiente completo de desenvolvimento
incluindo backend Flask e frontend React para testes de integração.
"""

import os
import sys
import subprocess
import time
import signal
import threading
import requests
from pathlib import Path

# Configurações
BACKEND_PORT = 5000
FRONTEND_PORT = 3000
BACKEND_DIR = "src/backend"
FRONTEND_DIR = "src/frontend"
WAIT_TIMEOUT = 60  # segundos

class DevEnvironment:
    """Gerenciador do ambiente de desenvolvimento"""
    
    def __init__(self):
        self.backend_process = None
        self.frontend_process = None
        self.root_dir = Path(__file__).parent.parent
        self.backend_path = self.root_dir / BACKEND_DIR
        self.frontend_path = self.root_dir / FRONTEND_DIR
        
    def log(self, message: str, service: str = "MAIN"):
        """Log formatado"""
        timestamp = time.strftime("%H:%M:%S")
        print(f"[{timestamp}] [{service}] {message}")
    
    def check_prerequisites(self) -> bool:
        """Verifica se os pré-requisitos estão instalados"""
        self.log("[SEARCH] Verificando pré-requisitos...")
        
        # Verificar Python
        try:
            python_version = sys.version.split()[0]
            self.log(f"[OK] Python {python_version} encontrado")
        except Exception as e:
            self.log(f"[ERROR] Erro ao verificar Python: {e}")
            return False
        
        # Verificar Node.js
        try:
            result = subprocess.run(['node', '--version'], 
                                  capture_output=True, text=True, timeout=10)
            if result.returncode == 0:
                node_version = result.stdout.strip()
                self.log(f"[OK] Node.js {node_version} encontrado")
            else:
                self.log("[ERROR] Node.js não encontrado")
                return False
        except Exception as e:
            self.log(f"[ERROR] Erro ao verificar Node.js: {e}")
            return False
        
        # Verificar diretórios
        if not self.backend_path.exists():
            self.log(f"[ERROR] Diretório backend não encontrado: {self.backend_path}")
            return False
        
        if not self.frontend_path.exists():
            self.log(f"[ERROR] Diretório frontend não encontrado: {self.frontend_path}")
            return False
        
        # Verificar arquivos principais
        backend_main = self.backend_path / "main.py"
        if not backend_main.exists():
            self.log(f"[ERROR] Arquivo principal do backend não encontrado: {backend_main}")
            return False
        
        frontend_package = self.frontend_path / "package.json"
        if not frontend_package.exists():
            self.log(f"[ERROR] package.json do frontend não encontrado: {frontend_package}")
            return False
        
        self.log("[OK] Todos os pré-requisitos verificados")
        return True
    
    def install_backend_dependencies(self) -> bool:
        """Instala dependências do backend"""
        self.log("📦 Instalando dependências do backend...")
        
        try:
            # Verificar se requirements.txt existe
            requirements_file = self.root_dir / "requirements.txt"
            if not requirements_file.exists():
                self.log("[WARNING]  requirements.txt não encontrado, pulando instalação")
                return True
            
            # Instalar dependências
            result = subprocess.run([
                sys.executable, '-m', 'pip', 'install', '-r', str(requirements_file)
            ], cwd=self.root_dir, capture_output=True, text=True, timeout=300)
            
            if result.returncode == 0:
                self.log("[OK] Dependências do backend instaladas")
                return True
            else:
                self.log(f"[ERROR] Erro ao instalar dependências do backend: {result.stderr}")
                return False
                
        except Exception as e:
            self.log(f"[ERROR] Erro ao instalar dependências do backend: {e}")
            return False
    
    def install_frontend_dependencies(self) -> bool:
        """Instala dependências do frontend"""
        self.log("📦 Instalando dependências do frontend...")
        
        try:
            # Verificar se node_modules existe
            node_modules = self.frontend_path / "node_modules"
            if node_modules.exists():
                self.log("[OK] node_modules já existe, pulando instalação")
                return True
            
            # Instalar dependências
            result = subprocess.run(['npm', 'install'], 
                                  cwd=self.frontend_path, 
                                  capture_output=True, text=True, timeout=300)
            
            if result.returncode == 0:
                self.log("[OK] Dependências do frontend instaladas")
                return True
            else:
                self.log(f"[ERROR] Erro ao instalar dependências do frontend: {result.stderr}")
                return False
                
        except Exception as e:
            self.log(f"[ERROR] Erro ao instalar dependências do frontend: {e}")
            return False
    
    def start_backend(self) -> bool:
        """Inicia o servidor backend"""
        self.log("[START] Iniciando servidor backend...")
        
        try:
            # Configurar variáveis de ambiente
            env = os.environ.copy()
            env['FLASK_ENV'] = 'development'
            env['FLASK_DEBUG'] = '1'
            env['PORT'] = str(BACKEND_PORT)
            
            # Iniciar processo do backend
            self.backend_process = subprocess.Popen([
                sys.executable, 'main.py'
            ], cwd=self.backend_path, env=env,
               stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
               universal_newlines=True, bufsize=1)
            
            # Thread para monitorar output do backend
            def monitor_backend():
                for line in iter(self.backend_process.stdout.readline, ''):
                    if line:
                        self.log(line.strip(), "BACKEND")
            
            backend_thread = threading.Thread(target=monitor_backend, daemon=True)
            backend_thread.start()
            
            # Aguardar backend estar disponível
            self.log(f"⏳ Aguardando backend na porta {BACKEND_PORT}...")
            
            for attempt in range(WAIT_TIMEOUT):
                try:
                    response = requests.get(f"http://localhost:{BACKEND_PORT}/api/health", timeout=5)
                    if response.status_code == 200:
                        self.log("[OK] Backend está respondendo")
                        return True
                except:
                    pass
                
                time.sleep(1)
            
            self.log("[ERROR] Timeout aguardando backend")
            return False
            
        except Exception as e:
            self.log(f"[ERROR] Erro ao iniciar backend: {e}")
            return False
    
    def start_frontend(self) -> bool:
        """Inicia o servidor frontend"""
        self.log("[START] Iniciando servidor frontend...")
        
        try:
            # Configurar variáveis de ambiente
            env = os.environ.copy()
            env['PORT'] = str(FRONTEND_PORT)
            env['VITE_API_URL'] = f'http://localhost:{BACKEND_PORT}/api'
            
            # Verificar se tem script dev
            try:
                result = subprocess.run(['npm', 'run', 'dev', '--', '--help'], 
                                      cwd=self.frontend_path, 
                                      capture_output=True, text=True, timeout=10)
                dev_command = ['npm', 'run', 'dev']
            except:
                # Fallback para Vite padrão
                dev_command = ['npx', 'vite', '--port', str(FRONTEND_PORT)]
            
            # Iniciar processo do frontend
            self.frontend_process = subprocess.Popen(
                dev_command,
                cwd=self.frontend_path, env=env,
                stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                universal_newlines=True, bufsize=1
            )
            
            # Thread para monitorar output do frontend
            def monitor_frontend():
                for line in iter(self.frontend_process.stdout.readline, ''):
                    if line:
                        self.log(line.strip(), "FRONTEND")
            
            frontend_thread = threading.Thread(target=monitor_frontend, daemon=True)
            frontend_thread.start()
            
            # Aguardar frontend estar disponível
            self.log(f"⏳ Aguardando frontend na porta {FRONTEND_PORT}...")
            
            for attempt in range(WAIT_TIMEOUT):
                try:
                    response = requests.get(f"http://localhost:{FRONTEND_PORT}", timeout=5)
                    if response.status_code == 200:
                        self.log("[OK] Frontend está respondendo")
                        return True
                except:
                    pass
                
                time.sleep(1)
            
            self.log("[ERROR] Timeout aguardando frontend")
            return False
            
        except Exception as e:
            self.log(f"[ERROR] Erro ao iniciar frontend: {e}")
            return False
    
    def run_integration_tests(self) -> bool:
        """Executa testes de integração"""
        self.log("[TEST] Executando testes de integração...")
        
        try:
            test_script = self.root_dir / "tests" / "integration" / "test_backend_frontend.py"
            
            if not test_script.exists():
                self.log("[WARNING]  Script de testes não encontrado, pulando testes")
                return True
            
            result = subprocess.run([
                sys.executable, str(test_script), f"http://localhost:{BACKEND_PORT}"
            ], cwd=self.root_dir, capture_output=True, text=True, timeout=120)
            
            # Mostrar output dos testes
            if result.stdout:
                for line in result.stdout.split('\n'):
                    if line.strip():
                        self.log(line, "TESTS")
            
            if result.returncode == 0:
                self.log("[OK] Todos os testes de integração passaram")
                return True
            else:
                self.log(f"[ERROR] Alguns testes falharam (exit code: {result.returncode})")
                return False
                
        except Exception as e:
            self.log(f"[ERROR] Erro ao executar testes: {e}")
            return False
    
    def cleanup(self):
        """Limpa processos iniciados"""
        self.log("🧹 Limpando processos...")
        
        if self.backend_process:
            try:
                self.backend_process.terminate()
                self.backend_process.wait(timeout=10)
                self.log("[OK] Processo backend terminado")
            except:
                try:
                    self.backend_process.kill()
                    self.log("[WARNING]  Processo backend forçadamente terminado")
                except:
                    self.log("[ERROR] Erro ao terminar processo backend")
        
        if self.frontend_process:
            try:
                self.frontend_process.terminate()
                self.frontend_process.wait(timeout=10)
                self.log("[OK] Processo frontend terminado")
            except:
                try:
                    self.frontend_process.kill()
                    self.log("[WARNING]  Processo frontend forçadamente terminado")
                except:
                    self.log("[ERROR] Erro ao terminar processo frontend")
    
    def start_development_environment(self) -> bool:
        """Inicia ambiente completo de desenvolvimento"""
        self.log("[START] Iniciando Ambiente de Desenvolvimento Integrado")
        self.log("=" * 60)
        
        # Verificar pré-requisitos
        if not self.check_prerequisites():
            return False
        
        # Instalar dependências
        if not self.install_backend_dependencies():
            return False
        
        if not self.install_frontend_dependencies():
            return False
        
        # Iniciar serviços
        if not self.start_backend():
            return False
        
        if not self.start_frontend():
            return False
        
        # Executar testes de integração
        tests_passed = self.run_integration_tests()
        
        # Mostrar informações finais
        self.log("=" * 60)
        self.log("🎉 AMBIENTE DE DESENVOLVIMENTO INICIADO!")
        self.log("=" * 60)
        self.log(f"🌐 Backend: http://localhost:{BACKEND_PORT}")
        self.log(f"🌐 Frontend: http://localhost:{FRONTEND_PORT}")
        self.log(f"[REPORT] API Health: http://localhost:{BACKEND_PORT}/api/health")
        self.log(f"[TEST] Testes integração: {'[OK] PASSOU' if tests_passed else '[ERROR] FALHOU'}")
        self.log("=" * 60)
        self.log("💡 Para parar os serviços, pressione Ctrl+C")
        
        return True
    
    def run(self):
        """Executa o ambiente com tratamento de sinais"""
        # Configurar handler para Ctrl+C
        def signal_handler(sig, frame):
            self.log("\n🛑 Interrupção recebida, parando serviços...")
            self.cleanup()
            sys.exit(0)
        
        signal.signal(signal.SIGINT, signal_handler)
        
        try:
            if self.start_development_environment():
                # Manter rodando até interrupção
                while True:
                    time.sleep(1)
            else:
                self.log("[ERROR] Falha ao iniciar ambiente de desenvolvimento")
                self.cleanup()
                sys.exit(1)
                
        except Exception as e:
            self.log(f"[ERROR] Erro crítico: {e}")
            self.cleanup()
            sys.exit(1)

def main():
    """Função principal"""
    print("[FIX] Sistema de Desenvolvimento Integrado")
    print("Engenheiro de Integração Full-Stack Sênior - Sistemas Médicos")
    print("Backend Flask + Frontend React + Testes de Integração")
    print("=" * 70)
    
    env = DevEnvironment()
    env.run()

if __name__ == "__main__":
    main()