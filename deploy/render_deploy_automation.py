#!/usr/bin/env python3
"""
🚀 SCRIPT DE AUTOMAÇÃO DE DEPLOY RENDER.COM
DevOps Engineer: Automação completa do deploy
Requer: requests, pyyaml (pip install requests pyyaml)
"""

import os
import sys
import json
import time
import requests
import subprocess
from datetime import datetime

class RenderDeployAutomation:
    """Automação completa do deploy no Render"""
    
    def __init__(self):
        self.render_api_key = None
        self.github_token = None
        self.service_id = None
        self.base_url = "https://api.render.com/v1"
        
    def print_status(self, message, status="INFO"):
        """Print formatado com timestamp"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        symbols = {
            "INFO": "ℹ️",
            "SUCCESS": "✅",
            "ERROR": "❌",
            "WARNING": "⚠️",
            "WORKING": "🔧"
        }
        print(f"[{timestamp}] {symbols.get(status, '•')} {message}")
        
    def check_requirements(self):
        """Verifica requisitos do sistema"""
        self.print_status("Verificando requisitos...", "WORKING")
        
        # Verificar Git
        try:
            subprocess.run(["git", "--version"], check=True, capture_output=True)
            self.print_status("Git instalado", "SUCCESS")
        except:
            self.print_status("Git não encontrado. Instale o Git primeiro.", "ERROR")
            return False
            
        # Verificar se estamos no repositório correto
        try:
            remote = subprocess.run(
                ["git", "remote", "get-url", "origin"],
                capture_output=True, text=True
            ).stdout.strip()
            
            if "siteroteirodedispersacao" not in remote:
                self.print_status("Não está no repositório correto", "ERROR")
                return False
            self.print_status(f"Repositório: {remote}", "SUCCESS")
        except:
            self.print_status("Erro ao verificar repositório", "ERROR")
            return False
            
        return True
        
    def load_credentials(self):
        """Carrega credenciais do ambiente ou solicita ao usuário"""
        self.print_status("Configurando credenciais...", "WORKING")
        
        # Render API Key
        self.render_api_key = os.environ.get('RENDER_API_KEY')
        if not self.render_api_key:
            print("\n📌 Para obter sua API Key do Render:")
            print("1. Acesse https://dashboard.render.com/account/api-keys")
            print("2. Clique em 'Create API Key'")
            print("3. Copie a chave gerada\n")
            self.render_api_key = input("Cole sua Render API Key: ").strip()
            
        # GitHub Token (opcional para repos privados)
        self.github_token = os.environ.get('GITHUB_TOKEN')
        if not self.github_token:
            print("\n📌 GitHub Token é opcional (apenas para repos privados)")
            print("Pressione ENTER para pular ou cole seu token:")
            self.github_token = input("GitHub Token (opcional): ").strip() or None
            
        return bool(self.render_api_key)
        
    def test_render_connection(self):
        """Testa conexão com a API do Render"""
        self.print_status("Testando conexão com Render...", "WORKING")
        
        headers = {
            "Authorization": f"Bearer {self.render_api_key}",
            "Accept": "application/json"
        }
        
        try:
            response = requests.get(f"{self.base_url}/services", headers=headers)
            if response.status_code == 200:
                self.print_status("Conexão com Render estabelecida", "SUCCESS")
                return True
            else:
                self.print_status(f"Erro de autenticação: {response.status_code}", "ERROR")
                return False
        except Exception as e:
            self.print_status(f"Erro de conexão: {e}", "ERROR")
            return False
            
    def create_or_update_service(self):
        """Cria ou atualiza o serviço no Render"""
        self.print_status("Verificando serviços existentes...", "WORKING")
        
        headers = {
            "Authorization": f"Bearer {self.render_api_key}",
            "Accept": "application/json",
            "Content-Type": "application/json"
        }
        
        # Buscar serviços existentes
        response = requests.get(f"{self.base_url}/services", headers=headers)
        if response.status_code != 200:
            self.print_status("Erro ao buscar serviços", "ERROR")
            return False
            
        services = response.json()
        
        # Procurar pelo nosso serviço
        for service in services:
            if service.get("name") == "roteiro-dispensacao":
                self.service_id = service["id"]
                self.print_status(f"Serviço encontrado: {self.service_id}", "SUCCESS")
                return self.update_service()
                
        # Se não encontrou, criar novo
        self.print_status("Serviço não encontrado. Criando novo...", "INFO")
        return self.create_new_service()
        
    def create_new_service(self):
        """Cria novo serviço no Render"""
        self.print_status("Criando novo serviço no Render...", "WORKING")
        
        headers = {
            "Authorization": f"Bearer {self.render_api_key}",
            "Accept": "application/json",
            "Content-Type": "application/json"
        }
        
        # Configuração do serviço baseada no render.yaml
        service_config = {
            "type": "web",
            "name": "roteiro-dispensacao",
            "ownerId": None,  # Será preenchido automaticamente
            "repo": "https://github.com/AnalineS/siteroteirodedispersacao",
            "branch": "render-deploy",
            "autoDeploy": True,
            "envVars": [
                {"key": "FLASK_ENV", "value": "production"},
                {"key": "FLASK_DEBUG", "value": "false"},
                {"key": "PORT", "value": "10000"},
                {"key": "PYTHONPATH", "value": "/opt/render/project/src:/opt/render/project/src/backend"},
                {"key": "PYTHONUNBUFFERED", "value": "1"},
                {"key": "HUGGINGFACE_API_KEY", "value": "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"},
                {"key": "OPENROUTER_API_KEY", "value": "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"},
                {"key": "LOG_LEVEL", "value": "INFO"},
                {"key": "LOG_FORMAT", "value": "structured"},
                {"key": "CACHE_ENABLED", "value": "true"},
                {"key": "TIMEOUT_SECONDS", "value": "30"},
                {"key": "HEALTH_CHECK_ENABLED", "value": "true"},
                {"key": "METRICS_ENABLED", "value": "true"}
            ],
            "buildCommand": "pip install --no-cache-dir --upgrade pip && pip install --no-cache-dir -r requirements.txt",
            "startCommand": "cd src/backend && python main.py",
            "healthCheckPath": "/api/health",
            "plan": "free",
            "region": "oregon"
        }
        
        # Se tiver GitHub token, adicionar
        if self.github_token:
            service_config["envVars"].append({
                "key": "GITHUB_TOKEN",
                "value": self.github_token
            })
        
        response = requests.post(
            f"{self.base_url}/services",
            headers=headers,
            json=service_config
        )
        
        if response.status_code in [200, 201]:
            service = response.json()
            self.service_id = service["service"]["id"]
            self.print_status(f"Serviço criado com sucesso! ID: {self.service_id}", "SUCCESS")
            return True
        else:
            self.print_status(f"Erro ao criar serviço: {response.text}", "ERROR")
            return False
            
    def update_service(self):
        """Atualiza serviço existente"""
        self.print_status(f"Atualizando serviço {self.service_id}...", "WORKING")
        
        headers = {
            "Authorization": f"Bearer {self.render_api_key}",
            "Accept": "application/json",
            "Content-Type": "application/json"
        }
        
        # Atualizar configurações
        update_config = {
            "branch": "render-deploy",
            "autoDeploy": True,
            "envVars": [
                {"key": "FLASK_ENV", "value": "production"},
                {"key": "FLASK_DEBUG", "value": "false"},
                {"key": "LOG_LEVEL", "value": "INFO"},
                {"key": "LOG_FORMAT", "value": "structured"},
                {"key": "HUGGINGFACE_API_KEY", "value": "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"},
                {"key": "OPENROUTER_API_KEY", "value": "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"}
            ]
        }
        
        response = requests.patch(
            f"{self.base_url}/services/{self.service_id}",
            headers=headers,
            json=update_config
        )
        
        if response.status_code == 200:
            self.print_status("Serviço atualizado com sucesso!", "SUCCESS")
            return True
        else:
            self.print_status(f"Erro ao atualizar: {response.text}", "ERROR")
            return False
            
    def trigger_deploy(self):
        """Dispara um novo deploy"""
        self.print_status("Iniciando deploy...", "WORKING")
        
        headers = {
            "Authorization": f"Bearer {self.render_api_key}",
            "Accept": "application/json"
        }
        
        response = requests.post(
            f"{self.base_url}/services/{self.service_id}/deploys",
            headers=headers
        )
        
        if response.status_code in [201, 202]:
            deploy = response.json()
            deploy_id = deploy["id"]
            self.print_status(f"Deploy iniciado! ID: {deploy_id}", "SUCCESS")
            return self.monitor_deploy(deploy_id)
        else:
            self.print_status(f"Erro ao iniciar deploy: {response.text}", "ERROR")
            return False
            
    def monitor_deploy(self, deploy_id):
        """Monitora o progresso do deploy"""
        self.print_status("Monitorando deploy...", "WORKING")
        
        headers = {
            "Authorization": f"Bearer {self.render_api_key}",
            "Accept": "application/json"
        }
        
        while True:
            response = requests.get(
                f"{self.base_url}/deploys/{deploy_id}",
                headers=headers
            )
            
            if response.status_code != 200:
                self.print_status("Erro ao monitorar deploy", "ERROR")
                return False
                
            deploy = response.json()
            status = deploy["status"]
            
            if status == "live":
                self.print_status("Deploy concluído com sucesso! 🎉", "SUCCESS")
                self.print_status(f"URL: https://{self.service_id}.onrender.com", "INFO")
                return True
            elif status in ["failed", "canceled"]:
                self.print_status(f"Deploy falhou: {status}", "ERROR")
                return False
            else:
                self.print_status(f"Status: {status}...", "INFO")
                time.sleep(10)
                
    def cleanup_render_services(self):
        """Remove serviços desnecessários do Render"""
        self.print_status("Verificando serviços para limpeza...", "WORKING")
        
        headers = {
            "Authorization": f"Bearer {self.render_api_key}",
            "Accept": "application/json"
        }
        
        response = requests.get(f"{self.base_url}/services", headers=headers)
        if response.status_code != 200:
            self.print_status("Erro ao listar serviços", "ERROR")
            return
            
        services = response.json()
        services_to_keep = ["roteiro-dispensacao"]
        
        for service in services:
            if service["name"] not in services_to_keep:
                self.print_status(f"Encontrado serviço extra: {service['name']}", "WARNING")
                confirm = input(f"Deseja excluir '{service['name']}'? (s/N): ")
                
                if confirm.lower() == 's':
                    delete_response = requests.delete(
                        f"{self.base_url}/services/{service['id']}",
                        headers=headers
                    )
                    if delete_response.status_code == 204:
                        self.print_status(f"Serviço '{service['name']}' excluído", "SUCCESS")
                    else:
                        self.print_status(f"Erro ao excluir '{service['name']}'", "ERROR")
                        
    def run(self):
        """Executa o processo completo de deploy"""
        print("=" * 60)
        print("🚀 AUTOMAÇÃO DE DEPLOY RENDER - ROTEIRO DE DISPENSAÇÃO")
        print("=" * 60)
        print()
        
        # Verificar requisitos
        if not self.check_requirements():
            return False
            
        # Carregar credenciais
        if not self.load_credentials():
            self.print_status("Credenciais não configuradas", "ERROR")
            return False
            
        # Testar conexão
        if not self.test_render_connection():
            return False
            
        # Criar ou atualizar serviço
        if not self.create_or_update_service():
            return False
            
        # Disparar deploy
        if not self.trigger_deploy():
            return False
            
        # Limpar serviços extras
        print("\n" + "=" * 60)
        self.print_status("Deploy concluído! Verificando limpeza...", "INFO")
        cleanup = input("\nDeseja limpar serviços extras no Render? (s/N): ")
        if cleanup.lower() == 's':
            self.cleanup_render_services()
            
        print("\n" + "=" * 60)
        self.print_status("PROCESSO COMPLETO! 🎉", "SUCCESS")
        print(f"\n🔗 Acesse sua aplicação em: https://roteiro-dispensacao.onrender.com")
        print(f"📊 Dashboard: https://dashboard.render.com/web/{self.service_id}")
        print("=" * 60)
        
        return True


if __name__ == "__main__":
    automation = RenderDeployAutomation()
    success = automation.run()
    sys.exit(0 if success else 1)