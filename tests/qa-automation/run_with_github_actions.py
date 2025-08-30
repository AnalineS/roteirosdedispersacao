#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
QA Test Runner - GitHub Actions Integration
===========================================

Executa os testes QA de forma compatível com GitHub Actions,
mas pode ser usado também localmente.

Autor: Sistema QA Roteiro de Dispensação
Data: 30/08/2025
"""

import subprocess
import os
import sys
import json
import time
import requests
from datetime import datetime
from pathlib import Path

# Configurar encoding UTF-8 para Windows
if sys.platform == "win32":
    import codecs
    sys.stdout = codecs.getwriter("utf-8")(sys.stdout.detach())
    sys.stderr = codecs.getwriter("utf-8")(sys.stderr.detach())

class GitHubActionsTestRunner:
    """Runner QA compatível com GitHub Actions"""
    
    def __init__(self):
        self.project_root = Path(__file__).parent.parent.parent
        self.backend_path = self.project_root / "apps" / "backend"
        self.frontend_path = self.project_root / "apps" / "frontend-nextjs"
        self.reports_dir = Path(__file__).parent / "reports"
        self.logs_dir = Path(__file__).parent / "logs"
        
        # Criar diretórios necessários
        self.reports_dir.mkdir(exist_ok=True)
        self.logs_dir.mkdir(exist_ok=True)
    
    def setup_environment(self):
        """Configura variáveis de ambiente necessárias"""
        print("🔧 Configurando ambiente QA...")
        
        # Variáveis necessárias (algumas podem vir do GitHub Actions)
        required_vars = [
            'SECRET_KEY',
            'OPENROUTER_API_KEY',
            'FIREBASE_PROJECT_ID',
            'FIREBASE_API_KEY',
            'FIREBASE_AUTH_DOMAIN',
            'FIREBASE_STORAGE_BUCKET',
            'FIREBASE_MESSAGING_SENDER_ID', 
            'FIREBASE_APP_ID',
            'GCP_PROJECT_ID',
            'GCP_REGION',
            'SUPABASE_PROJECT_URL',
            'SUPABASE_API_KEY'
        ]
        
        missing_vars = []
        for var in required_vars:
            if not os.getenv(var):
                missing_vars.append(var)
        
        if missing_vars:
            print(f"⚠️  Variáveis ausentes: {', '.join(missing_vars)}")
            print("🔍 Tentando executar em modo degradado...")
        else:
            print("✅ Todas as variáveis de ambiente configuradas")
        
        # Configurar variáveis adicionais
        os.environ['ENVIRONMENT'] = os.getenv('ENVIRONMENT', 'local')
        os.environ['CORS_ORIGINS'] = os.getenv('CORS_ORIGINS', 'http://localhost:3000,http://127.0.0.1:3000')
        os.environ['FIRESTORE_CACHE_ENABLED'] = 'true'
        os.environ['HYBRID_CACHE_STRATEGY'] = 'firestore_first'
        
        return len(missing_vars) == 0
    
    def start_backend_service(self):
        """Inicia o serviço backend"""
        print("🚀 Iniciando backend...")
        
        # Verificar se backend já está rodando
        try:
            response = requests.get('http://localhost:8080/api/health', timeout=2)
            if response.status_code == 200:
                print("✅ Backend já está rodando")
                return True
        except:
            pass
        
        # Parar processos existentes
        try:
            if sys.platform == "win32":
                subprocess.run(['taskkill', '/F', '/FI', 'IMAGENAME eq python.exe'], 
                              capture_output=True, check=False)
            else:
                subprocess.run(['pkill', '-f', 'python.*main.py'], 
                              capture_output=True, check=False)
            time.sleep(2)
        except:
            pass
        
        # Iniciar novo processo
        try:
            cmd = [sys.executable, "main.py"]
            
            process = subprocess.Popen(
                cmd,
                cwd=self.backend_path,
                env=os.environ.copy(),
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            
            # Aguardar inicialização
            print("⏳ Aguardando inicialização do backend...")
            for attempt in range(15):  # 15 segundos max
                try:
                    response = requests.get('http://localhost:8080/api/health', timeout=2)
                    if response.status_code == 200:
                        print("✅ Backend iniciado com sucesso")
                        return process
                except:
                    pass
                
                time.sleep(1)
            
            print("❌ Timeout na inicialização do backend")
            process.terminate()
            return None
            
        except Exception as e:
            print(f"❌ Erro ao iniciar backend: {e}")
            return None
    
    def run_qa_tests(self, environment='local', test_depth='extensive'):
        """Executa a suite QA completa"""
        print(f"🧪 Executando testes QA - {environment} ({test_depth})...")
        
        # Preparar comando
        test_cmd = [
            sys.executable, 
            "main_test_runner.py",
            f"--env={environment}",
            f"--{test_depth}",
            "--report-format=json",
            "--output-dir=reports",
            "--create-issues=false"  # Issues serão criadas separadamente
        ]
        
        # Executar testes
        try:
            print(f"🔧 Comando: {' '.join(test_cmd)}")
            
            result = subprocess.run(
                test_cmd,
                cwd=Path(__file__).parent,
                capture_output=True,
                text=True,
                timeout=900  # 15 minutos
            )
            
            # Log da saída
            print("📋 Saída dos testes:")
            print(result.stdout)
            
            if result.stderr:
                print("⚠️  Erros/Warnings:")
                print(result.stderr)
            
            return result.returncode == 0, result
            
        except subprocess.TimeoutExpired:
            print("⏰ Timeout nos testes (15 minutos)")
            return False, None
        except Exception as e:
            print(f"❌ Erro na execução dos testes: {e}")
            return False, None
    
    def create_github_issues(self, results_file, environment='local'):
        """Cria issues GitHub para falhas"""
        print("🐛 Processando resultados para criação de issues...")
        
        if not os.path.exists(results_file):
            print(f"⚠️  Arquivo de resultados não encontrado: {results_file}")
            return False
        
        # Verificar se GitHub token está disponível
        if not os.getenv('GITHUB_TOKEN'):
            print("⚠️  GITHUB_TOKEN não disponível - pulando criação de issues")
            return True
        
        try:
            cmd = [
                sys.executable,
                "utils/github_issues.py",
                f"--results-file={results_file}",
                f"--environment={environment}",
                "--create-on-failure=true",
                "--create-on-warning=true",
                "--verbose"
            ]
            
            # Adicionar informações do repositório se disponíveis
            repo_owner = os.getenv('GITHUB_REPOSITORY_OWNER')
            repo_name = os.getenv('GITHUB_REPOSITORY_NAME')
            if repo_owner and repo_name:
                cmd.append(f"--repository={repo_owner}/{repo_name}")
            
            result = subprocess.run(
                cmd,
                cwd=Path(__file__).parent,
                capture_output=True,
                text=True,
                timeout=300  # 5 minutos
            )
            
            print("📋 Saída da criação de issues:")
            print(result.stdout)
            
            if result.stderr:
                print("⚠️  Erros na criação de issues:")
                print(result.stderr)
            
            return result.returncode == 0
            
        except Exception as e:
            print(f"❌ Erro ao criar issues: {e}")
            return False
    
    def generate_summary(self, results_file):
        """Gera resumo dos resultados"""
        if not os.path.exists(results_file):
            return
        
        try:
            with open(results_file, 'r', encoding='utf-8') as f:
                results = json.load(f)
            
            summary = results.get('summary', {})
            
            print("\n" + "="*60)
            print("📊 RESUMO DOS TESTES QA")
            print("="*60)
            print(f"⏱️  Data/Hora: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
            print(f"🌍 Ambiente: {results.get('environment', 'Unknown')}")
            print(f"📈 Taxa de Sucesso: {summary.get('success_rate', 0):.1f}%")
            print(f"🧪 Total de Testes: {summary.get('total_tests', 0)}")
            print(f"✅ Aprovados: {summary.get('passed_tests', 0)}")
            print(f"❌ Falhados: {summary.get('failed_tests', 0)}")
            print(f"⚠️  Warnings: {summary.get('warnings', 0)}")
            print("="*60)
            
            # Detalhes por cenário
            scenarios = results.get('scenarios', {})
            if scenarios:
                print("\n📋 RESULTADOS POR CENÁRIO:")
                for scenario_name, scenario_data in scenarios.items():
                    passed = scenario_data.get('passed', 0)
                    total = scenario_data.get('total', 0)
                    rate = (passed / total * 100) if total > 0 else 0
                    
                    status = "✅" if rate == 100 else "⚠️" if rate >= 80 else "❌"
                    print(f"  {status} {scenario_name}: {passed}/{total} ({rate:.1f}%)")
            
        except Exception as e:
            print(f"❌ Erro ao gerar resumo: {e}")
    
    def cleanup(self, backend_process=None):
        """Limpeza final"""
        print("🧹 Executando limpeza...")
        
        if backend_process:
            try:
                backend_process.terminate()
                backend_process.wait(timeout=5)
            except:
                if hasattr(backend_process, 'kill'):
                    backend_process.kill()
        
        # Parar processos Python restantes
        try:
            if sys.platform == "win32":
                subprocess.run(['taskkill', '/F', '/FI', 'IMAGENAME eq python.exe'], 
                              capture_output=True, check=False)
            else:
                subprocess.run(['pkill', '-f', 'python.*main.py'], 
                              capture_output=True, check=False)
        except:
            pass
        
        print("✅ Limpeza concluída")

def main():
    """Função principal"""
    import argparse
    
    parser = argparse.ArgumentParser(description='QA Test Runner para GitHub Actions')
    parser.add_argument('--environment', default='local', choices=['local', 'hml', 'development'],
                       help='Ambiente de execução')
    parser.add_argument('--test-depth', default='extensive', choices=['basic', 'extensive'],
                       help='Profundidade dos testes')
    parser.add_argument('--create-issues', default='true', choices=['true', 'false'],
                       help='Criar issues GitHub para falhas')
    parser.add_argument('--skip-backend', action='store_true',
                       help='Pular inicialização do backend (assumir que já está rodando)')
    
    args = parser.parse_args()
    
    print("="*80)
    print("🚀 QA AUTOMATION SUITE - GITHUB ACTIONS INTEGRATION")
    print("="*80)
    print(f"📅 Data/Hora: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
    print(f"🖥️  Sistema: {sys.platform}")
    print(f"🐍 Python: {sys.version.split()[0]}")
    print(f"🌍 Ambiente: {args.environment}")
    print(f"🧪 Profundidade: {args.test_depth}")
    print()
    
    runner = GitHubActionsTestRunner()
    backend_process = None
    
    try:
        # 1. Configurar ambiente
        env_success = runner.setup_environment()
        if not env_success:
            print("⚠️  Algumas variáveis ausentes - continuando em modo degradado")
        
        # 2. Iniciar backend (se necessário)
        if not args.skip_backend:
            backend_process = runner.start_backend_service()
            if not backend_process:
                print("❌ Falha ao iniciar backend")
                return 1
        else:
            print("⏭️  Pulando inicialização do backend")
        
        # 3. Executar testes
        success, test_result = runner.run_qa_tests(
            environment=args.environment,
            test_depth=args.test_depth
        )
        
        # 4. Gerar resumo
        results_file = runner.reports_dir / "qa_results.json"
        runner.generate_summary(results_file)
        
        # 5. Criar issues GitHub (se habilitado)
        if args.create_issues.lower() == 'true':
            issues_success = runner.create_github_issues(
                results_file=str(results_file),
                environment=args.environment
            )
            
            if issues_success:
                print("✅ Issues GitHub processadas com sucesso")
            else:
                print("⚠️  Problemas na criação de issues GitHub")
        
        # 6. Resultado final
        if success:
            print("\n🎉 TESTES COMPLETADOS COM SUCESSO!")
            return 0
        else:
            print("\n❌ TESTES FALHARAM")
            return 1
    
    except KeyboardInterrupt:
        print("\n⏹️  Execução interrompida pelo usuário")
        return 130
    
    except Exception as e:
        print(f"\n💥 Erro inesperado: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    finally:
        runner.cleanup(backend_process)

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)