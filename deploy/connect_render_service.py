#!/usr/bin/env python3
"""
CONECTAR SERVIÇO RENDER COM ENV GROUP
Conecta repositório GitHub e configura env group
"""

import os
import sys
import requests
import json
from datetime import datetime

def print_status(message):
    """Print com timestamp"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"[{timestamp}] {message}")

def connect_github_repo():
    """Conecta repositório GitHub ao Render"""
    print_status("Conectando repositório GitHub ao Render...")
    
    # Configurar variáveis de ambiente
    os.environ['RENDER_API_KEY'] = 'rnd_PdHEt2X7PABBh2N3Nw1OTX5NE8HF'
    
    api_key = os.environ.get('RENDER_API_KEY')
    if not api_key:
        print_status("ERRO: RENDER_API_KEY não configurada")
        return False
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Accept": "application/json",
        "Content-Type": "application/json"
    }
    
    # Obter owner ID
    response = requests.get("https://api.render.com/v1/owners", headers=headers)
    if response.status_code != 200:
        print_status(f"ERRO ao obter owner ID: {response.status_code}")
        return False
    
    owners = response.json()
    owner_id = owners[0]["owner"]["id"]
    print_status(f"Owner ID: {owner_id}")
    
    # Configuração do serviço conectado ao env group
    service_config = {
        "type": "web_service",
        "name": "roteiro-dispensacao",
        "ownerID": owner_id,
        "repo": "https://github.com/AnalineS/siteroteirodedispersacao",
        "branch": "render-deploy",
        "autoDeploy": "yes",
        "serviceDetails": {
            "env": "python",
            "envSpecificDetails": {
                "buildCommand": "pip install -r requirements.txt",
                "startCommand": "cd src/backend && python main.py"
            }
        }
    }
    
    # Criar serviço
    print_status("Criando serviço no Render...")
    response = requests.post(
        "https://api.render.com/v1/services",
        headers=headers,
        json=service_config
    )
    
    if response.status_code in [200, 201]:
        service = response.json()
        service_id = service["service"]["id"]
        print_status(f"Serviço criado com sucesso! ID: {service_id}")
        
        # Conectar env group
        env_group_id = "evg-d23er5vgi27c73fslcv0"
        print_status(f"Conectando env group {env_group_id}...")
        
        env_group_config = {
            "envGroupId": env_group_id
        }
        
        response = requests.post(
            f"https://api.render.com/v1/services/{service_id}/env-groups",
            headers=headers,
            json=env_group_config
        )
        
        if response.status_code in [200, 201]:
            print_status("Env group conectado com sucesso!")
            print_status(f"URL do serviço: https://roteiro-dispensacao.onrender.com")
            print_status(f"Dashboard: https://dashboard.render.com/web/{service_id}")
            return True
        else:
            print_status(f"ERRO ao conectar env group: {response.status_code}")
            print(response.text)
            return False
    else:
        print_status(f"ERRO ao criar serviço: {response.status_code}")
        print(response.text)
        return False

def main():
    """Função principal"""
    print("=" * 60)
    print("CONECTAR RENDER SERVICE COM ENV GROUP")
    print("=" * 60)
    
    success = connect_github_repo()
    
    if success:
        print("\n" + "=" * 60)
        print("SUCESSO! Serviço conectado e configurado")
        print("Próximos passos:")
        print("1. Verifique o dashboard do Render")
        print("2. Aguarde o deploy automático")
        print("3. Teste a aplicação")
        print("=" * 60)
    else:
        print("\n" + "=" * 60)
        print("ERRO! Verifique as configurações")
        print("=" * 60)

if __name__ == "__main__":
    main()