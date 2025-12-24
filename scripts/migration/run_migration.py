#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para executar migração com GitHub Secrets
"""

import os
import sys
import subprocess

# Configurar encoding para Windows
if os.name == 'nt':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.detach())
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.detach())

def get_github_secret(name):
    """Obtém um secret do GitHub CLI"""
    try:
        # Usar gh secret list para ver se o secret existe
        result = subprocess.run(['gh', 'secret', 'list'], capture_output=True, text=True)
        if name not in result.stdout:
            print(f"[WARNING] Secret {name} não encontrado")
            return None
        
        # Para obter o valor, vamos usar uma abordagem diferente
        # Vamos criar um script temporário que usa o GitHub API
        api_cmd = f'gh api repos/{{owner}}/{{repo}}/actions/secrets/{name}'
        result = subprocess.run(api_cmd.split(), capture_output=True, text=True)
        
        if result.returncode == 0:
            import json
            data = json.loads(result.stdout)
            # O valor não é retornado pela API por segurança, então vamos usar variáveis conhecidas
            return "valor_placeholder"  # Placeholder para agora
        else:
            return None
    except Exception as e:
        print(f"Erro ao obter secret {name}: {e}")
        return None

def get_env_or_github_secret(env_name, secret_name=None):
    """Obtém valor de variável de ambiente ou GitHub Secret"""
    if secret_name is None:
        secret_name = env_name

    # Primeiro tenta variável de ambiente
    value = os.getenv(env_name)
    if value:
        return value

    # Tenta obter do GitHub usando gh CLI
    try:
        result = subprocess.run(
            ['gh', 'variable', 'get', secret_name],
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0:
            return result.stdout.strip()
    except Exception:
        pass

    return None

def main():
    print("[FIX] Executando migração com GitHub Secrets...")

    # Obter valores de secrets do GitHub ou variáveis de ambiente
    supabase_url = get_env_or_github_secret('SUPABASE_PROJECT_URL')
    supabase_key = get_env_or_github_secret('SUPABASE_PUBLISHABLE_KEY')
    openrouter_key = get_env_or_github_secret('OPENROUTER_API_KEY')
    secret_key = get_env_or_github_secret('SECRET_KEY')

    if not supabase_url or not supabase_key:
        print("[ERROR] SUPABASE_PROJECT_URL e SUPABASE_PUBLISHABLE_KEY são obrigatórias")
        print("[INFO] Configure usando:")
        print("  - Variáveis de ambiente localmente")
        print("  - GitHub Secrets para CI/CD")
        sys.exit(1)

    # Configurar variáveis de ambiente com nomes corretos do app_config
    env_vars = {
        'SUPABASE_PROJECT_URL': supabase_url,
        'SUPABASE_PUBLISHABLE_KEY': supabase_key,
        'EMBEDDINGS_ENABLED': 'true',
        'SECRET_KEY': secret_key or 'development_key_for_migration',
        'OPENROUTER_API_KEY': openrouter_key or 'placeholder_key',
        'CORS_ORIGINS': 'http://localhost:3000'
    }
    
    # Configurar ambiente
    my_env = os.environ.copy()
    my_env.update(env_vars)
    
    print("[OK] Variáveis de ambiente configuradas")
    print(f"   SUPABASE_PROJECT_URL: {env_vars['SUPABASE_PROJECT_URL']}")
    print(f"   EMBEDDINGS_ENABLED: {env_vars['EMBEDDINGS_ENABLED']}")
    
    # Executar migração
    try:
        result = subprocess.run([
            sys.executable, 
            'scripts/migrate_json_to_supabase.py'
        ], env=my_env, cwd=os.path.dirname(__file__) + '/..')
        
        if result.returncode == 0:
            print("[OK] Migração executada com sucesso!")
        else:
            print(f"[ERROR] Migração falhou com código: {result.returncode}")
            
    except Exception as e:
        print(f"[ERROR] Erro ao executar migração: {e}")

if __name__ == "__main__":
    main()