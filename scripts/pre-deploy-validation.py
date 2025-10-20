#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Pre-Deploy Validation Script
Valida se o deploy seria bem-sucedido sem executar deploy real
"""

import os
import sys
import json
import subprocess
import requests
from pathlib import Path

class PreDeployValidator:
    def __init__(self):
        self.root_path = Path(__file__).parent.parent
        self.errors = []
        self.warnings = []

    def log_error(self, message):
        print(f"[ERROR] {message}")
        self.errors.append(message)

    def log_warning(self, message):
        print(f"[WARN] {message}")
        self.warnings.append(message)

    def log_success(self, message):
        print(f"[OK] {message}")

    def validate_secrets_vars(self):
        """Valida se as principais secrets/vars estão definidas via environment ou .env"""
        print("\n=== VALIDANDO SECRETS E VARIABLES ===")

        # Secrets críticas
        required_secrets = [
            "SECRET_KEY",
            "OPENROUTER_API_KEY",
            "SUPABASE_PROJECT_URL",
            "SUPABASE_PUBLISHABLE_KEY",
            "GOOGLE_CLIENT_ID"
        ]

        # Variables críticas
        required_vars = [
            "GCP_PROJECT_ID",
            "GCP_REGION",
            "NEXT_PUBLIC_API_URL_STAGING",
            "GCS_BUCKET_NAME"
        ]

        # Verificar secrets
        for secret in required_secrets:
            if os.getenv(secret):
                self.log_success(f"Secret {secret} definida")
            else:
                self.log_warning(f"Secret {secret} não encontrada no ambiente")

        # Verificar vars
        for var in required_vars:
            if os.getenv(var):
                self.log_success(f"Variable {var} definida")
            else:
                self.log_warning(f"Variable {var} não encontrada no ambiente")

    def validate_dependencies(self):
        """Valida se as dependências podem ser instaladas"""
        print("\n=== VALIDANDO DEPENDÊNCIAS ===")

        # Backend dependencies
        backend_requirements = self.root_path / "apps/backend/requirements.txt"
        if backend_requirements.exists():
            try:
                with open(backend_requirements) as f:
                    deps = [line.strip() for line in f if line.strip() and not line.startswith('#')]
                self.log_success(f"Backend: {len(deps)} dependências encontradas")

                # Testar algumas críticas
                critical_deps = ['flask', 'openai', 'supabase', 'google-cloud-storage']
                missing_critical = []
                for dep in critical_deps:
                    if not any(dep.lower() in line.lower() for line in deps):
                        missing_critical.append(dep)

                if missing_critical:
                    self.log_warning(f"Dependências críticas possivelmente ausentes: {missing_critical}")
                else:
                    self.log_success("Dependências críticas presentes")

            except Exception as e:
                self.log_error(f"Erro ao ler requirements.txt: {e}")
        else:
            self.log_error("requirements.txt não encontrado")

        # Frontend dependencies
        frontend_package = self.root_path / "apps/frontend-nextjs/package.json"
        if frontend_package.exists():
            try:
                with open(frontend_package) as f:
                    package_data = json.load(f)

                deps = package_data.get('dependencies', {})
                dev_deps = package_data.get('devDependencies', {})
                total_deps = len(deps) + len(dev_deps)

                self.log_success(f"Frontend: {total_deps} dependências encontradas")

                # Verificar deps críticas
                critical_frontend = ['next', 'react', 'typescript']
                for dep in critical_frontend:
                    if dep in deps:
                        self.log_success(f"Dependência crítica {dep}: {deps[dep]}")
                    else:
                        self.log_error(f"Dependência crítica {dep} ausente")

            except Exception as e:
                self.log_error(f"Erro ao ler package.json: {e}")
        else:
            self.log_error("package.json não encontrado")

    def validate_build_commands(self):
        """Simula os comandos de build principais"""
        print("\n=== VALIDANDO COMANDOS DE BUILD ===")

        # Frontend build simulation
        frontend_path = self.root_path / "apps/frontend-nextjs"
        if frontend_path.exists():
            try:
                os.chdir(frontend_path)

                # Verificar se npm está disponível
                result = subprocess.run(['npm', '--version'], capture_output=True, text=True)
                if result.returncode == 0:
                    self.log_success(f"NPM disponível: {result.stdout.strip()}")

                    # Verificar scripts do package.json
                    with open('package.json') as f:
                        package_data = json.load(f)

                    scripts = package_data.get('scripts', {})
                    critical_scripts = ['build', 'lint', 'type-check']

                    for script in critical_scripts:
                        if script in scripts:
                            self.log_success(f"Script {script} definido: {scripts[script]}")
                        else:
                            self.log_warning(f"Script {script} não encontrado")
                else:
                    self.log_error("NPM não disponível")

            except Exception as e:
                self.log_error(f"Erro na validação frontend: {e}")

        # Backend validation
        backend_path = self.root_path / "apps/backend"
        if backend_path.exists():
            try:
                os.chdir(backend_path)

                # Verificar se python funciona
                result = subprocess.run([sys.executable, '--version'], capture_output=True, text=True)
                if result.returncode == 0:
                    self.log_success(f"Python disponível: {result.stdout.strip()}")

                    # Verificar se main.py existe
                    if (backend_path / "main.py").exists():
                        self.log_success("main.py encontrado")
                    else:
                        self.log_error("main.py não encontrado")

                else:
                    self.log_error("Python não disponível")

            except Exception as e:
                self.log_error(f"Erro na validação backend: {e}")

    def test_external_connectivity(self):
        """Testa conectividade com serviços externos sem fazer deploy"""
        print("\n=== TESTANDO CONECTIVIDADE EXTERNA ===")

        # Testar OpenRouter API
        openrouter_key = os.getenv('OPENROUTER_API_KEY')
        if openrouter_key and openrouter_key != 'test-key':
            try:
                headers = {
                    'Authorization': f'Bearer {openrouter_key}',
                    'Content-Type': 'application/json'
                }
                # Apenas testar autenticação, não fazer request real
                response = requests.get('https://openrouter.ai/api/v1/models',
                                     headers=headers, timeout=10)
                if response.status_code in [200, 401]:  # 401 = key inválida, mas API responde
                    self.log_success("OpenRouter API acessível")
                else:
                    self.log_warning(f"OpenRouter API status: {response.status_code}")
            except Exception as e:
                self.log_warning(f"Erro ao testar OpenRouter: {e}")
        else:
            self.log_warning("OpenRouter API key não configurada")

        # Testar Supabase connectivity
        supabase_url = os.getenv('SUPABASE_PROJECT_URL')
        if supabase_url:
            try:
                # Apenas ping na URL base
                response = requests.get(f"{supabase_url}/rest/v1/", timeout=10)
                if response.status_code in [200, 401, 403]:  # Qualquer resposta válida
                    self.log_success("Supabase acessível")
                else:
                    self.log_warning(f"Supabase status: {response.status_code}")
            except Exception as e:
                self.log_warning(f"Erro ao testar Supabase: {e}")
        else:
            self.log_warning("Supabase URL não configurada")

    def validate_workflow_structure(self):
        """Valida estrutura do workflow"""
        print("\n=== VALIDANDO ESTRUTURA DO WORKFLOW ===")

        workflow_path = self.root_path / ".github/workflows/deploy-unified.yml"
        if workflow_path.exists():
            self.log_success("deploy-unified.yml encontrado")

            try:
                import yaml
                with open(workflow_path, 'r', encoding='utf-8') as f:
                    content = yaml.safe_load(f)

                jobs = content.get('jobs', {})
                self.log_success(f"Workflow tem {len(jobs)} jobs")

                # Verificar jobs críticos
                critical_jobs = [
                    'environment-preparation',
                    'comprehensive-backend-tests',
                    'frontend-deploy',
                    'backend-deploy'
                ]

                for job in critical_jobs:
                    if job in jobs:
                        self.log_success(f"Job crítico {job} presente")
                    else:
                        self.log_error(f"Job crítico {job} ausente")

            except Exception as e:
                self.log_error(f"Erro ao validar workflow: {e}")
        else:
            self.log_error("deploy-unified.yml não encontrado")

    def run_validation(self):
        """Executa todas as validações"""
        print("=== INICIANDO VALIDAÇÃO PRÉ-DEPLOY ===")
        print("=" * 50)

        self.validate_secrets_vars()
        self.validate_dependencies()
        self.validate_build_commands()
        self.test_external_connectivity()
        self.validate_workflow_structure()

        print("\n" + "=" * 50)
        print("=== RESUMO DA VALIDAÇÃO ===")

        if self.errors:
            print(f"\n[ERRORS] ({len(self.errors)}):")
            for error in self.errors:
                print(f"  • {error}")

        if self.warnings:
            print(f"\n[WARNINGS] ({len(self.warnings)}):")
            for warning in self.warnings:
                print(f"  • {warning}")

        if not self.errors:
            print(f"\n[SUCCESS] VALIDAÇÃO APROVADA!")
            print("O deploy provavelmente será bem-sucedido.")
            return 0
        else:
            print(f"\n[FAILED] VALIDAÇÃO REPROVADA!")
            print(f"Corrija os {len(self.errors)} erro(s) antes do deploy.")
            return 1

if __name__ == "__main__":
    validator = PreDeployValidator()
    sys.exit(validator.run_validation())