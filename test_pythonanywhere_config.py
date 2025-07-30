#!/usr/bin/env python3
"""
Script de Teste de Configuração para PythonAnywhere
Executa verificações locais antes do deploy
"""

import os
import sys
import subprocess
from pathlib import Path

def check_repository():
    """Verifica se o repositório está acessível"""
    print("🔍 Verificando repositório...")
    try:
        result = subprocess.run(
            ["git", "ls-remote", "https://github.com/AnalineS/siteroteirodedispersacao.git"],
            capture_output=True, text=True
        )
        if result.returncode == 0:
            print("✅ Repositório acessível!")
            return True
        else:
            print("❌ Erro ao acessar repositório:", result.stderr)
            return False
    except Exception as e:
        print("❌ Erro:", str(e))
        return False

def check_project_structure():
    """Verifica a estrutura esperada do projeto"""
    print("\n📁 Verificando estrutura do projeto...")
    
    expected_structure = {
        "backend/app.py": "Arquivo principal Flask",
        "backend/requirements.txt": "Dependências Python",
        "frontend/build/index.html": "Frontend buildado",
        "frontend/build/static": "Assets estáticos"
    }
    
    for path, description in expected_structure.items():
        if Path(path).exists():
            print(f"✅ {path} - {description}")
        else:
            print(f"⚠️  {path} - {description} (não encontrado localmente)")

def generate_requirements():
    """Gera um requirements.txt básico se não existir"""
    print("\n📦 Verificando requirements.txt...")
    
    req_path = Path("backend/requirements.txt")
    if not req_path.exists():
        print("⚠️  requirements.txt não encontrado. Gerando versão básica...")
        
        basic_requirements = """# Dependências básicas para Flask
flask==2.3.3
flask-cors==4.0.0
python-dotenv==1.0.0
gunicorn==21.2.0

# Adicione outras dependências conforme necessário
# requests==2.31.0
# numpy==1.24.3
# pandas==2.0.3
"""
        
        os.makedirs("backend", exist_ok=True)
        with open(req_path, "w") as f:
            f.write(basic_requirements)
        print("✅ requirements.txt básico criado!")

def generate_wsgi_test():
    """Gera arquivo WSGI de teste"""
    print("\n🔧 Gerando arquivo WSGI de teste...")
    
    wsgi_content = '''# Arquivo WSGI para PythonAnywhere - TESTE LOCAL
import sys
import os

# Simular ambiente PythonAnywhere
project_home = os.path.dirname(os.path.abspath(__file__))
backend_path = os.path.join(project_home, 'backend')

sys.path.insert(0, project_home)
sys.path.insert(0, backend_path)

try:
    from backend.app import app as application
    print("✅ Importação do Flask app bem-sucedida!")
except ImportError as e:
    print(f"❌ Erro ao importar Flask app: {e}")
    
    # App de fallback
    from flask import Flask
    application = Flask(__name__)
    
    @application.route('/')
    def error():
        return f"<h1>Erro de Importação</h1><pre>{str(e)}</pre>", 500

if __name__ == "__main__":
    print("🚀 Testando aplicação Flask...")
    application.run(debug=True, port=5000)
'''
    
    with open("test_wsgi.py", "w") as f:
        f.write(wsgi_content)
    print("✅ test_wsgi.py criado!")

def main():
    """Executa todas as verificações"""
    print("=== TESTE DE CONFIGURAÇÃO PYTHONANYWHERE ===\n")
    
    # Verificações
    check_repository()
    check_project_structure()
    generate_requirements()
    generate_wsgi_test()
    
    print("\n=== INSTRUÇÕES DE DEPLOY ===")
    print("\n1. No console Bash do PythonAnywhere, execute:")
    print("   wget https://raw.githubusercontent.com/AnalineS/siteroteirodedispersacao/main/deploy_pythonanywhere.sh")
    print("   bash deploy_pythonanywhere.sh")
    print("\n2. Ou copie e execute o script deploy_pythonanywhere.sh manualmente")
    print("\n3. Configure os static files no painel web:")
    print("   URL: /")
    print("   Directory: /home/roteirodedispensacao/siteroteirodedispersacao/frontend/build")
    print("\n4. Recarregue a aplicação web")
    print("\n=== FIM DO TESTE ===")

if __name__ == "__main__":
    main()