#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
QA Test Runner com GitHub Secrets
==================================

Executa os testes QA usando variáveis de ambiente obtidas via GitHub CLI.
Seguindo princípios ITSM para gestão segura de configurações.

Autor: Sistema QA Roteiro de Dispensação
Data: 30/08/2025
"""

import subprocess
import os
import sys
import json
from datetime import datetime

# Configurar encoding UTF-8 para Windows
if sys.platform == "win32":
    import codecs
    sys.stdout = codecs.getwriter("utf-8")(sys.stdout.detach())
    sys.stderr = codecs.getwriter("utf-8")(sys.stderr.detach())

def get_github_secret(secret_name):
    """Obtém secret do GitHub usando CLI"""
    try:
        result = subprocess.run(
            ['gh', 'secret', 'get', secret_name],
            capture_output=True,
            text=True,
            check=True
        )
        return result.stdout.strip()
    except subprocess.CalledProcessError as e:
        print(f"⚠️  Erro ao obter secret {secret_name}: {e}")
        return None

def setup_environment():
    """Configura variáveis de ambiente necessárias"""
    print("🔧 Configurando variáveis de ambiente via GitHub CLI...")
    
    # Mapeamento de secrets necessários
    required_secrets = {
        'SECRET_KEY': 'SECRET_KEY',
        'OPENROUTER_API_KEY': 'OPENROUTER_API_KEY', 
        'FIREBASE_PROJECT_ID': 'FIREBASE_PROJECT_ID',
        'FIREBASE_API_KEY': 'FIREBASE_API_KEY',
        'FIREBASE_AUTH_DOMAIN': 'FIREBASE_AUTH_DOMAIN',
        'FIREBASE_STORAGE_BUCKET': 'FIREBASE_STORAGE_BUCKET',
        'FIREBASE_MESSAGING_SENDER_ID': 'FIREBASE_MESSAGING_SENDER_ID',
        'FIREBASE_APP_ID': 'FIREBASE_APP_ID',
        'GCP_PROJECT_ID': 'GCP_PROJECT_ID',
        'GCP_REGION': 'GCP_REGION',
        'SUPABASE_PROJECT_URL': 'SUPABASE_PROJECT_URL',
        'SUPABASE_API_KEY': 'SUPABASE_API_KEY'
    }
    
    # Configurar variáveis obtidas via GitHub CLI
    secrets_configured = 0
    for env_var, secret_name in required_secrets.items():
        secret_value = get_github_secret(secret_name)
        if secret_value:
            os.environ[env_var] = secret_value
            secrets_configured += 1
            print(f"✅ {env_var} configurado")
        else:
            print(f"⚠️  {env_var} não disponível")
    
    # Configurar variáveis adicionais para desenvolvimento
    os.environ['ENVIRONMENT'] = 'development'
    os.environ['CORS_ORIGINS'] = 'http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173'
    os.environ['FIRESTORE_CACHE_ENABLED'] = 'true'
    os.environ['HYBRID_CACHE_STRATEGY'] = 'firestore_first'
    
    # Configurar GitHub Token para criação de issues (via environment)
    # os.environ['GITHUB_TOKEN'] = 'SET_VIA_ENVIRONMENT_OR_GITHUB_SECRETS'
    os.environ['GITHUB_REPOSITORY_OWNER'] = 'AnalineS'
    os.environ['GITHUB_REPOSITORY_NAME'] = 'roteirosdedispersacao'
    
    print(f"🎯 {secrets_configured}/{len(required_secrets)} secrets configurados")
    print("✅ Variáveis adicionais configuradas")
    
    return secrets_configured > 0

def restart_backend():
    """Reinicia o backend com as novas variáveis de ambiente"""
    print("🔄 Reiniciando backend com configurações completas...")
    
    # Parar backend existente se houver
    try:
        # Matar processos Python na porta 8080
        subprocess.run(['taskkill', '/F', '/IM', 'python.exe'], 
                      capture_output=True, check=False)
    except:
        pass
    
    # Aguardar um pouco
    import time
    time.sleep(2)
    
    # Iniciar backend com as variáveis configuradas
    backend_path = os.path.join("..", "..", "apps", "backend")
    backend_cmd = [sys.executable, "main.py"]
    
    print(f"🚀 Iniciando backend em: {backend_path}")
    
    process = subprocess.Popen(
        backend_cmd,
        cwd=backend_path,
        env=os.environ.copy(),
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    
    # Aguardar inicialização
    time.sleep(5)
    
    # Verificar se está rodando
    try:
        import requests
        response = requests.get('http://localhost:8080/api/health', timeout=5)
        print(f"✅ Backend iniciado - Status: {response.status_code}")
        return process
    except Exception as e:
        print(f"❌ Erro ao conectar no backend: {e}")
        return None

def run_qa_tests():
    """Executa a suite QA completa"""
    print("🧪 Executando suite QA completa...")
    
    # Executar testes com configuração completa
    test_cmd = [
        sys.executable, 
        "main_test_runner.py", 
        "--env=local", 
        "--extensive"
    ]
    
    try:
        result = subprocess.run(
            test_cmd,
            capture_output=False,
            text=True,
            timeout=600  # 10 minutos timeout
        )
        
        return result.returncode == 0
    
    except subprocess.TimeoutExpired:
        print("⏰ Timeout nos testes - execução muito longa")
        return False
    except Exception as e:
        print(f"❌ Erro na execução dos testes: {e}")
        return False

def main():
    """Função principal"""
    print("=" * 80)
    print("🚀 QA TEST RUNNER COM GITHUB SECRETS")
    print("=" * 80)
    print(f"📅 Data/Hora: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
    print(f"🖥️  Sistema: {sys.platform}")
    print(f"🐍 Python: {sys.version.split()[0]}")
    print()
    
    # 1. Configurar ambiente
    if not setup_environment():
        print("❌ Falha na configuração de variáveis de ambiente")
        return 1
    
    # 2. Reiniciar backend
    backend_process = restart_backend()
    if not backend_process:
        print("❌ Falha ao iniciar backend")
        return 1
    
    try:
        # 3. Executar testes
        success = run_qa_tests()
        
        if success:
            print("🎉 TESTES COMPLETADOS COM SUCESSO!")
            return 0
        else:
            print("❌ TESTES FALHARAM")
            return 1
            
    finally:
        # 4. Cleanup - parar backend
        if backend_process:
            print("🧹 Finalizando backend...")
            backend_process.terminate()
            try:
                backend_process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                backend_process.kill()

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)