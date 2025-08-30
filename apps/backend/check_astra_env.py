#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Verificador de Variáveis de Ambiente para Astra DB
Script para validar configuração antes do setup
"""

import os
import sys
from pathlib import Path
from typing import Dict, List, Tuple

def check_astra_environment() -> Tuple[bool, Dict[str, str]]:
    """
    Verificar se todas as variáveis de ambiente necessárias estão configuradas
    
    Returns:
        Tuple[bool, Dict]: (sucesso, dicionário com status de cada variável)
    """
    
    print("[SEARCH] Verificando variáveis de ambiente para Astra DB...")
    print("=" * 60)
    
    # Variáveis obrigatórias
    required_vars = {
        'ASTRA_DB_URL': 'URL de conexão do Astra DB',
        'ASTRA_DB_TOKEN': 'Token de autenticação',
        'ASTRA_DB_KEYSPACE': 'Nome do keyspace (opcional, padrão: hanseniase_rag)'
    }
    
    # Variáveis opcionais mas recomendadas
    optional_vars = {
        'ASTRA_DB_ENABLED': 'Flag para habilitar Astra DB (padrão: false)',
        'SECRET_KEY': 'Chave secreta da aplicação',
        'OPENROUTER_API_KEY': 'API Key para modelos de IA'
    }
    
    status = {}
    all_good = True
    
    print("[LIST] VARIÁVEIS OBRIGATÓRIAS:")
    for var, description in required_vars.items():
        value = os.getenv(var)
        if value:
            # Mascarar valores sensíveis
            if 'TOKEN' in var or 'KEY' in var:
                masked_value = f"{value[:10]}...{value[-5:]}" if len(value) > 15 else f"{value[:5]}..."
                print(f"  [OK] {var}: {masked_value}")
            else:
                print(f"  [OK] {var}: {value[:50]}...")
            status[var] = 'configured'
        else:
            print(f"  [ERROR] {var}: NÃO CONFIGURADA - {description}")
            status[var] = 'missing'
            if var != 'ASTRA_DB_KEYSPACE':  # Keyspace é opcional
                all_good = False
    
    print("\n[LIST] VARIÁVEIS OPCIONAIS:")
    for var, description in optional_vars.items():
        value = os.getenv(var)
        if value:
            if 'TOKEN' in var or 'KEY' in var:
                masked_value = f"{value[:10]}...{value[-5:]}" if len(value) > 15 else f"{value[:5]}..."
                print(f"  [OK] {var}: {masked_value}")
            else:
                print(f"  [OK] {var}: {value}")
            status[var] = 'configured'
        else:
            print(f"  [WARNING] {var}: Não configurada - {description}")
            status[var] = 'optional'
    
    return all_good, status

def suggest_github_secrets_setup():
    """Sugerir como configurar GitHub Secrets"""
    print("\n[FIX] COMO CONFIGURAR GITHUB SECRETS:")
    print("=" * 60)
    print("1. Acesse seu repositório no GitHub")
    print("2. Vá em Settings > Secrets and variables > Actions")
    print("3. Clique em 'New repository secret'")
    print("4. Configure as seguintes secrets:")
    print()
    
    secrets = [
        ("ASTRA_DB_URL", "https://[database-id]-[region].apps.astra.datastax.com"),
        ("ASTRA_DB_TOKEN", "AstraCS:xxxxxxxx... (Generate em Astra DB Console)"),
        ("ASTRA_DB_KEYSPACE", "hanseniase_rag"),
        ("ASTRA_DB_ENABLED", "true"),
        ("SECRET_KEY", "chave-secreta-super-segura-aqui"),
        ("OPENROUTER_API_KEY", "sk-or-v1-xxxxx... (OpenRouter API Key)")
    ]
    
    for secret_name, example_value in secrets:
        print(f"   * {secret_name}")
        print(f"     Valor: {example_value}")
        print()

def suggest_local_development_setup():
    """Sugerir setup para desenvolvimento local"""
    print("\n🏠 CONFIGURAÇÃO PARA DESENVOLVIMENTO LOCAL:")
    print("=" * 60)
    print("Crie um arquivo .env na raiz do projeto backend com:")
    print()
    
    env_content = """# Astra DB Configuration
ASTRA_DB_URL=https://[seu-database-id]-[region].apps.astra.datastax.com
ASTRA_DB_TOKEN=AstraCS:xxxxxxxx...
ASTRA_DB_KEYSPACE=hanseniase_rag
ASTRA_DB_ENABLED=true

# Application Configuration  
SECRET_KEY=sua-chave-secreta-aqui
OPENROUTER_API_KEY=sk-or-v1-xxxxx...
ENVIRONMENT=development

# Optional
FLASK_ENV=development
DEBUG=true
"""
    
    print(env_content)
    print("[WARNING] IMPORTANTE: Nunca commite o arquivo .env!")
    print("[OK] Certifique-se que .env está no .gitignore")

def create_env_template():
    """Criar template de .env"""
    template_path = Path(__file__).parent / '.env.template'
    
    template_content = """# Template de variáveis de ambiente para Astra DB
# Copie para .env e preencha com seus valores

# === ASTRA DB CONFIGURATION ===
ASTRA_DB_URL=https://[database-id]-[region].apps.astra.datastax.com
ASTRA_DB_TOKEN=AstraCS:xxxxxxxx...
ASTRA_DB_KEYSPACE=hanseniase_rag
ASTRA_DB_ENABLED=true

# === APPLICATION CONFIGURATION ===
SECRET_KEY=sua-chave-secreta-muito-segura
ENVIRONMENT=development
FLASK_ENV=development
DEBUG=true

# === AI API KEYS ===
OPENROUTER_API_KEY=sk-or-v1-xxxxx...
HUGGINGFACE_API_KEY=hf_xxxxx...

# === CORS CONFIGURATION ===
CORS_ORIGINS=http://localhost:3000,https://roteiros-de-dispensacao.web.app

# === OPTIONAL FEATURES ===
EMBEDDINGS_ENABLED=true
RAG_AVAILABLE=true
ADVANCED_FEATURES=true

# === RATE LIMITING ===
RATE_LIMIT_ENABLED=true
RATE_LIMIT_DEFAULT=200/hour
RATE_LIMIT_CHAT=50/hour

# === LOGGING ===
LOG_LEVEL=INFO
LOG_STRUCTURED_FORMAT=true

# Instruções:
# 1. Copie este arquivo para .env
# 2. Preencha com seus valores reais
# 3. Nunca commite .env ao git
# 4. Execute o script astra_setup.py para testar
"""
    
    try:
        with open(template_path, 'w', encoding='utf-8') as f:
            f.write(template_content)
        print(f"\n📄 Template criado em: {template_path}")
        print("[OK] Use este template para configurar suas variáveis")
        return True
    except Exception as e:
        print(f"\n[ERROR] Erro ao criar template: {e}")
        return False

def check_astra_db_availability():
    """Verificar se o Astra DB está disponível (ping básico)"""
    print("\n🌐 Verificando disponibilidade do Astra DB...")
    
    astra_url = os.getenv('ASTRA_DB_URL')
    if not astra_url:
        print("[ERROR] ASTRA_DB_URL não configurada")
        return False
    
    try:
        import requests
        
        # Extrair base URL para ping
        if 'https://' in astra_url:
            base_url = astra_url.split('/')[0] + '//' + astra_url.split('/')[2]
        else:
            base_url = 'https://' + astra_url.split('/')[0]
        
        print(f"[SEARCH] Testando conectividade com: {base_url}")
        
        # Timeout curto para teste rápido
        response = requests.get(base_url, timeout=5)
        
        if response.status_code < 500:
            print("[OK] Astra DB está acessível")
            return True
        else:
            print(f"[WARNING] Astra DB retornou status {response.status_code}")
            return False
            
    except ImportError:
        print("[WARNING] requests não instalado - pulando teste de conectividade")
        return True
    except Exception as e:
        print(f"[ERROR] Erro ao testar conectividade: {e}")
        return False

def main():
    """Função principal"""
    print("[CONFIG] VERIFICADOR DE AMBIENTE ASTRA DB")
    print("Parte da FASE 3.1: Setup Conexao Astra DB")
    print("=" * 60)
    
    # 1. Verificar variáveis de ambiente
    env_ok, status = check_astra_environment()
    
    # 2. Testar conectividade básica
    connectivity_ok = check_astra_db_availability()
    
    # 3. Análise e recomendações
    print("\n[REPORT] RESUMO DA ANÁLISE:")
    print("=" * 60)
    
    if env_ok and connectivity_ok:
        print("🎉 CONFIGURAÇÃO COMPLETA!")
        print("[OK] Todas as variáveis obrigatórias configuradas")
        print("[OK] Astra DB está acessível")
        print("[START] Pronto para executar astra_setup.py")
    elif env_ok:
        print("[YELLOW] CONFIGURAÇÃO PARCIAL")
        print("[OK] Variáveis configuradas")
        print("[WARNING] Problemas de conectividade")
        print("[FIX] Verifique URL e credenciais")
    else:
        print("[RED] CONFIGURAÇÃO INCOMPLETA")
        print("[ERROR] Variáveis de ambiente faltando")
        
        # Sugestões de configuração
        suggest_github_secrets_setup()
        suggest_local_development_setup()
        
        # Criar template
        create_env_template()
    
    print("\n[START] PRÓXIMOS PASSOS:")
    if env_ok:
        print("1. Execute: python apps/backend/services/astra_setup.py")
        print("2. Verifique o relatório de setup gerado")
        print("3. Prossiga para FASE 3.2: Migração de dados")
    else:
        print("1. Configure as variáveis de ambiente necessárias")
        print("2. Execute este script novamente para verificar")
        print("3. Execute astra_setup.py quando tudo estiver configurado")
    
    return env_ok

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)