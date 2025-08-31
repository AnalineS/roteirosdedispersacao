#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de Migração usando GitHub Secrets
Requer GitHub CLI instalado e autenticado
"""

import os
import sys
import subprocess
import json

# Adicionar path do backend
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

def get_github_secret(secret_name, repo="AnalineS/siteroteirodedispersacao"):
    """
    Obtém um secret do GitHub usando gh CLI
    """
    try:
        # Comando para obter o secret
        cmd = f"gh secret list -R {repo} --json name"
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        
        if result.returncode != 0:
            print(f"[ERROR] Erro ao acessar GitHub Secrets: {result.stderr}")
            return None
            
        # Verificar se o secret existe
        secrets = json.loads(result.stdout)
        secret_names = [s['name'] for s in secrets]
        
        if secret_name in secret_names:
            print(f"[OK] Secret {secret_name} encontrado")
            # Nota: GitHub CLI não permite ler o valor do secret diretamente por segurança
            return True
        else:
            print(f"[ERROR] Secret {secret_name} não encontrado")
            return None
            
    except Exception as e:
        print(f"[ERROR] Erro: {e}")
        return None

def run_migration_with_github_secrets():
    """
    Executa migração usando GitHub Secrets
    """
    print("=" * 60)
    print("MIGRAÇÃO SUPABASE - USANDO GITHUB SECRETS")
    print("=" * 60)
    
    print("\n[SEARCH] Verificando GitHub CLI...")
    
    # Verificar se gh está instalado
    try:
        result = subprocess.run("gh --version", shell=True, capture_output=True, text=True)
        if result.returncode != 0:
            print("[ERROR] GitHub CLI não está instalado")
            print("📥 Instale em: https://cli.github.com/")
            return False
        print("[OK] GitHub CLI detectado")
    except:
        print("[ERROR] GitHub CLI não encontrado")
        return False
    
    # Verificar autenticação
    try:
        result = subprocess.run("gh auth status", shell=True, capture_output=True, text=True)
        if "Logged in" not in result.stdout and "Logged in" not in result.stderr:
            print("[ERROR] GitHub CLI não está autenticado")
            print("💡 Execute: gh auth login")
            return False
        print("[OK] GitHub CLI autenticado")
    except:
        print("[ERROR] Erro ao verificar autenticação")
        return False
    
    print("\n[LIST] Verificando secrets necessários...")
    
    # Verificar secrets
    secrets_needed = [
        "SUPABASE_PROJECT_URL",
        "SUPABASE_API_KEY"
    ]
    
    for secret in secrets_needed:
        if not get_github_secret(secret):
            print(f"\n[WARNING] Secret {secret} não acessível")
            print("Como não podemos ler os valores dos secrets por segurança,")
            print("você precisa fornecê-los manualmente.\n")
            
            # Solicitar manualmente
            if secret == "SUPABASE_PROJECT_URL":
                value = input("Cole sua SUPABASE_PROJECT_URL: ").strip()
                os.environ['SUPABASE_URL'] = value
            elif secret == "SUPABASE_API_KEY":
                value = input("Cole sua SUPABASE_API_KEY: ").strip()
                os.environ['SUPABASE_KEY'] = value
    
    # Configurações adicionais - usar env var ou gerar aleatório
    if not os.environ.get('SECRET_KEY'):
        import secrets
        os.environ['SECRET_KEY'] = secrets.token_hex(32)
    os.environ['EMBEDDINGS_ENABLED'] = 'true'
    os.environ['RAG_AVAILABLE'] = 'true'
    os.environ['VECTOR_DB_TYPE'] = 'supabase'
    
    print("\n[START] Iniciando migração...")
    print("-" * 40)
    
    try:
        from migrate_json_to_supabase import main
        
        print("\n[REPORT] Executando migração dos dados...")
        success = main()
        
        if success:
            print("\n[OK] MIGRAÇÃO CONCLUÍDA COM SUCESSO!")
            return True
        else:
            print("\n[ERROR] Migração falhou.")
            return False
            
    except Exception as e:
        print(f"\n[ERROR] Erro: {e}")
        return False

if __name__ == "__main__":
    print("[FIX] Script de Migração Supabase com GitHub Secrets")
    
    # Oferecer opções
    print("\nEscolha uma opção:")
    print("1. Usar GitHub Secrets (requer gh CLI)")
    print("2. Fornecer credenciais manualmente")
    
    choice = input("\nOpção (1 ou 2): ").strip()
    
    if choice == "1":
        success = run_migration_with_github_secrets()
    else:
        # Usar o script manual
        from run_migration_local import run_migration_with_temp_credentials
        success = run_migration_with_temp_credentials()
    
    if success:
        print("\n🎉 Processo finalizado com sucesso!")
    else:
        print("\n[WARNING] Processo finalizado com erros.")