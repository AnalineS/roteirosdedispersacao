#!/usr/bin/env python3
"""
Script Manual de Deploy para PythonAnywhere
Execute este script diretamente no console Python do PythonAnywhere
"""

import os
import sys
import subprocess

def run_command(cmd, description):
    """Executa um comando e mostra o resultado"""
    print(f"\n{'='*50}")
    print(f"📌 {description}")
    print(f"Comando: {cmd}")
    print('='*50)
    
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        if result.stdout:
            print("Saída:", result.stdout)
        if result.stderr:
            print("Erros:", result.stderr)
        return result.returncode == 0
    except Exception as e:
        print(f"Erro ao executar: {e}")
        return False

def main():
    print("🚀 INICIANDO DEPLOY MANUAL NO PYTHONANYWHERE")
    print("="*60)
    
    # Configurações
    user = "roteirodedispensacao"
    home = f"/home/{user}"
    project_dir = f"{home}/siteroteirodedispersacao"
    venv_dir = f"{home}/.virtualenvs/siteroteirodedispersacao"
    
    # 1. Clone/Update do repositório
    os.chdir(home)
    if os.path.exists(project_dir):
        os.chdir(project_dir)
        run_command("git pull origin main", "Atualizando repositório")
    else:
        run_command(
            "git clone https://github.com/AnalineS/siteroteirodedispersacao.git",
            "Clonando repositório"
        )
    
    # 2. Criar virtualenv se não existir
    if not os.path.exists(venv_dir):
        run_command(
            f"python3.10 -m venv {venv_dir}",
            "Criando virtual environment"
        )
    
    # 3. Instalar dependências
    run_command(
        f"source {venv_dir}/bin/activate && pip install --upgrade pip",
        "Atualizando pip"
    )
    
    req_file = f"{project_dir}/backend/requirements.txt"
    if os.path.exists(req_file):
        run_command(
            f"source {venv_dir}/bin/activate && pip install -r {req_file}",
            "Instalando dependências do requirements.txt"
        )
    else:
        run_command(
            f"source {venv_dir}/bin/activate && pip install flask flask-cors gunicorn python-dotenv",
            "Instalando dependências básicas"
        )
    
    # 4. Criar arquivo WSGI
    wsgi_file = f"{home}/{user}_pythonanywhere_com_wsgi.py"
    print(f"\n📝 Criando arquivo WSGI em: {wsgi_file}")
    
    wsgi_content = f'''# WSGI configuration for PythonAnywhere
import sys
import os

# Add project to Python path
project_home = '{project_dir}'
if project_home not in sys.path:
    sys.path.insert(0, project_home)

# Add backend to Python path
backend_path = os.path.join(project_home, 'backend')
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

# Set environment
os.environ['FLASK_ENV'] = 'production'

# Import Flask app
try:
    from app import app as application
    print("Flask app loaded successfully!")
except Exception as e:
    print(f"Error loading Flask app: {{e}}")
    import traceback
    traceback.print_exc()
    
    from flask import Flask
    application = Flask(__name__)
    
    @application.route('/')
    def error():
        return f"<h1>Application Error</h1><pre>{{str(e)}}</pre>", 500
'''
    
    with open(wsgi_file, 'w') as f:
        f.write(wsgi_content)
    print("✅ Arquivo WSGI criado!")
    
    # 5. Instruções finais
    print("\n" + "="*60)
    print("✅ DEPLOY MANUAL CONCLUÍDO!")
    print("="*60)
    print("\n📋 PRÓXIMOS PASSOS:")
    print("\n1. Configure os Static Files no painel Web:")
    print(f"   URL: /")
    print(f"   Directory: {project_dir}/frontend/build")
    print("\n2. Configure o Virtualenv no painel Web:")
    print(f"   Path: {venv_dir}")
    print("\n3. Clique em 'Reload' para reiniciar a aplicação")
    print("\n4. Verifique os logs se houver erros:")
    print(f"   tail -f /var/log/{user}.pythonanywhere.com.error.log")
    print("="*60)

if __name__ == "__main__":
    main()