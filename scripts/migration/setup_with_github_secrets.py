#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Setup e Testes usando GitHub CLI Secrets
Abordagem padrão para desenvolvimento sem arquivos .env locais

Desenvolvido por: Claude Code
Data: 2025-01-30
"""

import os
import sys
import subprocess
import json
from typing import Dict, Optional

# Configurar encoding para Windows
if os.name == 'nt':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.detach())
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.detach())

# Adicionar path do backend
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

class GitHubSecretsManager:
    """
    Gerenciador de secrets do GitHub para desenvolvimento local
    """
    
    def __init__(self, repo: str = "AnalineS/siteroteirodedispersacao"):
        self.repo = repo
        self.secrets_cache = {}
        
    def check_gh_cli(self) -> bool:
        """Verifica se GitHub CLI está instalado e autenticado"""
        try:
            # Verificar instalação
            result = subprocess.run("gh --version", shell=True, capture_output=True, text=True)
            if result.returncode != 0:
                print("[ERROR] GitHub CLI não está instalado")
                print("📥 Instale em: https://cli.github.com/")
                return False
            
            # Verificar autenticação
            result = subprocess.run("gh auth status", shell=True, capture_output=True, text=True)
            if "Logged in" not in result.stdout and "Logged in" not in result.stderr:
                print("[ERROR] GitHub CLI não está autenticado")
                print("💡 Execute: gh auth login")
                return False
                
            print("[OK] GitHub CLI pronto")
            return True
            
        except Exception as e:
            print(f"[ERROR] Erro ao verificar GitHub CLI: {e}")
            return False
    
    def list_secrets(self) -> list:
        """Lista todos os secrets disponíveis"""
        try:
            cmd = f"gh secret list -R {self.repo} --json name"
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
            
            if result.returncode == 0:
                secrets = json.loads(result.stdout)
                return [s['name'] for s in secrets]
            return []
            
        except Exception:
            return []
    
    def request_secret_value(self, secret_name: str) -> Optional[str]:
        """
        Solicita o valor do secret ao usuário
        Como o GitHub CLI não permite ler valores por segurança
        """
        if secret_name in self.secrets_cache:
            return self.secrets_cache[secret_name]
        
        print(f"\n🔑 Secret '{secret_name}' necessário")
        print(f"   Encontre em: GitHub -> Settings -> Secrets -> {secret_name}")
        value = input(f"   Cole o valor aqui: ").strip()
        
        if value:
            self.secrets_cache[secret_name] = value
            return value
        return None
    
    def setup_environment(self, required_secrets: Dict[str, str]) -> bool:
        """
        Configura variáveis de ambiente com os secrets necessários
        
        Args:
            required_secrets: Dict com mapping de GITHUB_SECRET_NAME: ENV_VAR_NAME
        """
        print("\n[LIST] Configurando ambiente com GitHub Secrets...")
        
        available_secrets = self.list_secrets()
        print(f"   Encontrados {len(available_secrets)} secrets no repositório")
        
        for github_secret, env_var in required_secrets.items():
            if github_secret in available_secrets:
                print(f"[OK] {github_secret} disponível")
                value = self.request_secret_value(github_secret)
                if value:
                    os.environ[env_var] = value
                else:
                    print(f"[ERROR] Valor não fornecido para {github_secret}")
                    return False
            else:
                print(f"[WARNING]  {github_secret} não encontrado no GitHub")
                value = input(f"   Forneça o valor manualmente: ").strip()
                if value:
                    os.environ[env_var] = value
                else:
                    return False
        
        # Configurações adicionais padrão
        os.environ.setdefault('SECRET_KEY', 'dev-secret-key-2025')
        os.environ.setdefault('EMBEDDINGS_ENABLED', 'true')
        os.environ.setdefault('RAG_AVAILABLE', 'true')
        os.environ.setdefault('VECTOR_DB_TYPE', 'supabase')
        
        print("\n[OK] Ambiente configurado com sucesso!")
        return True


def run_supabase_migration():
    """Executa a migração para Supabase"""
    
    manager = GitHubSecretsManager()
    
    # Verificar GitHub CLI
    if not manager.check_gh_cli():
        print("\n💡 Alternativa: forneça as credenciais manualmente")
    
    # Secrets necessários para Supabase
    required_secrets = {
        'SUPABASE_PROJECT_URL': 'SUPABASE_PROJECT_URL',
        'SUPABASE_API_KEY': 'SUPABASE_PUBLISHABLE_KEY',
        'SUPABASE_PUBLISHABLE_KEY': 'SUPABASE_PUBLISHABLE_KEY',  # Mesmo valor
    }
    
    # Configurar ambiente
    if not manager.setup_environment(required_secrets):
        print("[ERROR] Falha ao configurar ambiente")
        return False
    
    print("\n[START] Iniciando migração Supabase...")
    print("-" * 50)
    
    try:
        # Importar e executar script de migração
        from migrate_json_to_supabase import main as migrate_main
        
        success = migrate_main()
        
        if success:
            print("\n[OK] MIGRAÇÃO CONCLUÍDA COM SUCESSO!")
            print("\n[LIST] Próximos passos:")
            print("1. Verifique as tabelas no Supabase Dashboard")
            print("2. Execute os testes: python scripts/test_supabase_integration.py")
            print("3. Commit e push das mudanças")
            return True
        else:
            print("\n[ERROR] Migração falhou")
            return False
            
    except ImportError as e:
        print(f"[ERROR] Erro ao importar script: {e}")
        return False
    except Exception as e:
        print(f"[ERROR] Erro durante migração: {e}")
        return False


def run_tests_with_secrets():
    """Executa testes usando GitHub Secrets"""
    
    manager = GitHubSecretsManager()
    
    # Verificar GitHub CLI
    if not manager.check_gh_cli():
        print("\n💡 Fornecendo credenciais manualmente...")
    
    # Secrets para testes
    required_secrets = {
        'SUPABASE_PROJECT_URL': 'SUPABASE_PROJECT_URL',
        'SUPABASE_PUBLISHABLE_KEY': 'SUPABASE_PUBLISHABLE_KEY',
        'OPENROUTER_API_KEY': 'OPENROUTER_API_KEY',
    }
    
    # Configurar ambiente
    if not manager.setup_environment(required_secrets):
        print("[ERROR] Falha ao configurar ambiente")
        return False
    
    print("\n[TEST] Executando testes...")
    print("-" * 50)
    
    # Executar diferentes testes
    test_scripts = [
        'test_imports.py',
        'test_openai_system.py', 
        'test_cache_system.py'
    ]
    
    results = []
    for script in test_scripts:
        try:
            print(f"\n[REPORT] Executando {script}...")
            result = subprocess.run(
                f"python scripts/{script}",
                shell=True, 
                capture_output=True, 
                text=True,
                cwd=os.path.dirname(os.path.dirname(__file__))
            )
            
            if result.returncode == 0:
                print(f"[OK] {script} - PASSOU")
                results.append(True)
            else:
                print(f"[ERROR] {script} - FALHOU")
                print(result.stdout)
                results.append(False)
                
        except Exception as e:
            print(f"[ERROR] Erro ao executar {script}: {e}")
            results.append(False)
    
    # Resumo
    passed = sum(results)
    total = len(results)
    print(f"\n[REPORT] RESUMO DOS TESTES: {passed}/{total} passaram")
    
    return all(results)


def main():
    """Função principal com menu de opções"""
    
    print("=" * 60)
    print("[FIX] SETUP COM GITHUB SECRETS")
    print("Abordagem padrão sem arquivos .env locais")
    print("=" * 60)
    
    print("\nEscolha uma opção:")
    print("1. Executar migração Supabase")
    print("2. Executar testes")
    print("3. Ambos (migração + testes)")
    print("4. Listar secrets disponíveis")
    print("0. Sair")
    
    choice = input("\nOpção: ").strip()
    
    if choice == "1":
        success = run_supabase_migration()
    elif choice == "2":
        success = run_tests_with_secrets()
    elif choice == "3":
        success = run_supabase_migration()
        if success:
            print("\n" + "=" * 50)
            success = run_tests_with_secrets()
    elif choice == "4":
        manager = GitHubSecretsManager()
        if manager.check_gh_cli():
            secrets = manager.list_secrets()
            print(f"\n[LIST] {len(secrets)} secrets encontrados:")
            for secret in sorted(secrets):
                print(f"   * {secret}")
        success = True
    elif choice == "0":
        print("👋 Até logo!")
        return
    else:
        print("[ERROR] Opção inválida")
        success = False
    
    if success:
        print("\n🎉 Processo concluído com sucesso!")
    else:
        print("\n[WARNING] Processo concluído com erros")


if __name__ == "__main__":
    main()