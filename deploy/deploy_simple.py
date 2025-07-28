#!/usr/bin/env python3
"""
SCRIPT SIMPLIFICADO DE DEPLOY RENDER
Versão sem emojis para Windows
"""

import os
import sys
import json
import time
import requests
from datetime import datetime

# Configurações
GITHUB_REPO = "https://github.com/AnalineS/siteroteirodedispersacao"
BRANCH = "render-deploy"

def print_status(message):
    """Print com timestamp"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"[{timestamp}] {message}")

def get_render_api_key():
    """Retorna API key do Render"""
    # API Key deve ser fornecida via variável de ambiente
    api_key = os.environ.get('RENDER_API_KEY')
    if not api_key:
        print_status("ERRO: Configure a variavel RENDER_API_KEY")
        return None
    print_status("API Key do Render configurada via ambiente")
    return api_key

def get_owner_id(api_key):
    """Obtém o ownerID necessário para criar serviços"""
    print_status("Obtendo informacoes da conta...")
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Accept": "application/json"
    }
    
    response = requests.get("https://api.render.com/v1/owners", headers=headers)
    
    if response.status_code == 200:
        owners = response.json()
        if owners and len(owners) > 0:
            owner_id = owners[0]["owner"]["id"]
            print_status(f"Owner ID obtido: {owner_id}")
            return owner_id
    
    print_status(f"ERRO ao obter owner ID: {response.status_code}")
    return None

def create_render_service(api_key):
    """Cria serviço no Render via API"""
    print_status("Criando servico no Render...")
    
    # Obter owner ID
    owner_id = get_owner_id(api_key)
    if not owner_id:
        return None
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Accept": "application/json",
        "Content-Type": "application/json"
    }
    
    # Configuração do serviço usando formato simplificado para plano gratuito
    service_config = {
        "type": "web_service",
        "name": "roteiro-dispensacao",
        "ownerID": owner_id,
        "repo": GITHUB_REPO,
        "branch": BRANCH,
        "autoDeploy": "yes",
        "serviceDetails": {
            "env": "python",
            "envSpecificDetails": {
                "buildCommand": "pip install -r requirements.txt",
                "startCommand": "cd src/backend && python main.py"
            },
            "envVars": [
                {"key": "FLASK_ENV", "value": "production"},
                {"key": "PORT", "value": "10000"},
                {"key": "PYTHONPATH", "value": "/opt/render/project/src:/opt/render/project/src/backend"},
                {"key": "HUGGINGFACE_API_KEY", "value": os.environ.get('HUGGINGFACE_API_KEY', '')},
                {"key": "OPENROUTER_API_KEY", "value": os.environ.get('OPENROUTER_API_KEY', '')}
            ]
        }
    }
    
    # Verificar se serviço já existe
    print_status("Verificando servicos existentes...")
    response = requests.get(
        "https://api.render.com/v1/services",
        headers=headers
    )
    
    if response.status_code == 200:
        services = response.json()
        for service in services:
            if service.get("name") == "roteiro-dispensacao":
                print_status(f"Servico ja existe: {service['id']}")
                return service['id']
    
    # Criar novo serviço
    print_status("Criando novo servico...")
    response = requests.post(
        "https://api.render.com/v1/services",
        headers=headers,
        json=service_config
    )
    
    if response.status_code in [200, 201]:
        service = response.json()
        service_id = service["service"]["id"]
        print_status(f"Servico criado com sucesso! ID: {service_id}")
        return service_id
    else:
        print_status(f"ERRO ao criar servico: {response.status_code}")
        print(response.text)
        return None

def trigger_deploy(api_key, service_id):
    """Dispara deploy no Render"""
    print_status(f"Iniciando deploy para servico {service_id}...")
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Accept": "application/json"
    }
    
    response = requests.post(
        f"https://api.render.com/v1/services/{service_id}/deploys",
        headers=headers
    )
    
    if response.status_code in [201, 202]:
        deploy = response.json()
        deploy_id = deploy["id"]
        print_status(f"Deploy iniciado! ID: {deploy_id}")
        return deploy_id
    else:
        print_status(f"ERRO ao iniciar deploy: {response.status_code}")
        return None

def monitor_deploy(api_key, deploy_id):
    """Monitora progresso do deploy"""
    print_status("Monitorando deploy...")
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Accept": "application/json"
    }
    
    while True:
        response = requests.get(
            f"https://api.render.com/v1/deploys/{deploy_id}",
            headers=headers
        )
        
        if response.status_code == 200:
            deploy = response.json()
            status = deploy["status"]
            
            print_status(f"Status: {status}")
            
            if status == "live":
                print_status("Deploy concluido com sucesso!")
                return True
            elif status in ["failed", "canceled"]:
                print_status(f"Deploy falhou: {status}")
                return False
        
        time.sleep(10)

def main():
    """Funcao principal"""
    print("\n" + "="*60)
    print("DEPLOY AUTOMATICO RENDER - ROTEIRO DE DISPENSACAO")
    print("="*60)
    
    # Obter API key
    api_key = get_render_api_key()
    if not api_key:
        print_status("ERRO: API key nao fornecida")
        return
    
    # Criar ou obter serviço
    service_id = create_render_service(api_key)
    if not service_id:
        print_status("ERRO: Nao foi possivel criar/obter servico")
        return
    
    # Disparar deploy
    deploy_id = trigger_deploy(api_key, service_id)
    if not deploy_id:
        print_status("ERRO: Nao foi possivel iniciar deploy")
        return
    
    # Monitorar deploy
    success = monitor_deploy(api_key, deploy_id)
    
    if success:
        print("\n" + "="*60)
        print("DEPLOY CONCLUIDO COM SUCESSO!")
        print(f"URL: https://roteiro-dispensacao.onrender.com")
        print(f"Dashboard: https://dashboard.render.com/web/{service_id}")
        print("="*60)
    else:
        print("\n" + "="*60)
        print("DEPLOY FALHOU!")
        print("Verifique os logs no dashboard do Render")
        print("="*60)

if __name__ == "__main__":
    main()