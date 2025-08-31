#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de Migração Supabase com GitHub CLI Integration
Executa migração usando secrets do GitHub automaticamente
"""

import os
import sys
import subprocess
import json
from pathlib import Path

# Adicionar path do backend
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

def check_gh_cli():
    """Verifica se GitHub CLI está instalado e autenticado"""
    try:
        result = subprocess.run("gh --version", shell=True, capture_output=True, text=True)
        if result.returncode != 0:
            return False, "GitHub CLI não instalado"
        
        result = subprocess.run("gh auth status", shell=True, capture_output=True, text=True)
        if "Logged in" not in result.stdout and "Logged in" not in result.stderr:
            return False, "GitHub CLI não autenticado"
            
        return True, "GitHub CLI pronto"
    except:
        return False, "Erro ao verificar GitHub CLI"

def get_available_secrets():
    """Lista secrets disponíveis no repositório"""
    try:
        cmd = "gh secret list -R AnalineS/siteroteirodedispersacao --json name"
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        
        if result.returncode == 0:
            secrets = json.loads(result.stdout)
            return [s['name'] for s in secrets]
        return []
    except:
        return []

def setup_environment_from_input():
    """Configura ambiente solicitando valores dos secrets"""
    print("🔑 Configurando credenciais Supabase...")
    print("Você pode encontrar estes valores no Supabase Dashboard -> Settings -> API")
    
    # Secrets necessários com mapeamento para variáveis de ambiente
    required_secrets = {
        'SUPABASE_PROJECT_URL': 'SUPABASE_PROJECT_URL',
        'SUPABASE_PUBLISHABLE_KEY': 'SUPABASE_PUBLISHABLE_KEY', 
        'OPENROUTER_API_KEY': 'OPENROUTER_API_KEY'
    }
    
    available_secrets = get_available_secrets()
    print(f"[LIST] Encontrados {len(available_secrets)} secrets no repositório GitHub")
    
    for github_secret, env_var in required_secrets.items():
        if github_secret in available_secrets:
            print(f"[OK] {github_secret} encontrado no GitHub Secrets")
            value = input(f"   Cole o valor de {github_secret}: ").strip()
            if value:
                os.environ[env_var] = value
            else:
                print(f"[ERROR] Valor vazio para {github_secret}")
                return False
        else:
            print(f"[WARNING] {github_secret} não encontrado no GitHub - solicitando manualmente")
            value = input(f"   Forneça {github_secret}: ").strip()
            if value:
                os.environ[env_var] = value
            else:
                return False
    
    # Configurações básicas - usar env var ou gerar aleatório
    if not os.environ.get('SECRET_KEY'):
        import secrets
        os.environ['SECRET_KEY'] = secrets.token_hex(32)
    os.environ['EMBEDDINGS_ENABLED'] = 'true'
    os.environ['RAG_AVAILABLE'] = 'true'
    os.environ['VECTOR_DB_TYPE'] = 'supabase'
    os.environ['CORS_ORIGINS'] = 'http://localhost:3000'
    
    return True

def run_migration():
    """Executa o script de migração"""
    print("[START] Iniciando migração JSON -> Supabase...")
    print("-" * 50)
    
    try:
        # Importar e executar migração
        from migrate_json_to_supabase import main as migrate_main
        
        success = migrate_main()
        
        if success:
            print("\n[OK] MIGRAÇÃO CONCLUÍDA COM SUCESSO!")
            print("\n[LIST] Verificações recomendadas:")
            print("1. Acesse Supabase Dashboard -> Table Editor")
            print("2. Verifique tabela 'medical_embeddings' tem dados")
            print("3. Execute: python scripts/test_supabase_integration.py")
            return True
        else:
            print("\n[ERROR] Migração falhou - verifique logs acima")
            return False
            
    except ImportError as e:
        print(f"[ERROR] Erro ao importar: {e}")
        return False
    except Exception as e:
        print(f"[ERROR] Erro durante migração: {e}")
        return False

def main():
    """Função principal"""
    print("=" * 60)
    print("[FIX] MIGRAÇÃO SUPABASE COM GITHUB CLI")
    print("=" * 60)
    
    # Verificar GitHub CLI
    gh_ok, gh_msg = check_gh_cli()
    print(f"GitHub CLI: {gh_msg}")
    
    if not gh_ok:
        print("\n💡 GitHub CLI não disponível, mas podemos continuar manualmente")
    
    print(f"\n[REPORT] Repositório: AnalineS/siteroteirodedispersacao")
    
    # Configurar ambiente
    if not setup_environment_from_input():
        print("[ERROR] Falha na configuração do ambiente")
        return
    
    print("\n[OK] Ambiente configurado!")
    
    # Executar migração
    success = run_migration()
    
    if success:
        print("\n🎉 Processo concluído com sucesso!")
    else:
        print("\n[WARNING] Processo concluído com erros")

if __name__ == "__main__":
    main()