#!/bin/bash
# Script de Deploy para PythonAnywhere
# Usuário: roteirodedispensacao

echo "=== INICIANDO DEPLOY NO PYTHONANYWHERE ==="
echo "Usuário: roteirodedispensacao"
echo "=========================================="

# Configurações
PYTHONANYWHERE_USER="roteirodedispensacao"
HOME_DIR="/home/${PYTHONANYWHERE_USER}"
PROJECT_DIR="${HOME_DIR}/siteroteirodedispersacao"
VENV_DIR="${HOME_DIR}/.virtualenvs/siteroteirodedispersacao"

echo ""
echo "📁 PASSO 1: Clonando/Atualizando Repositório"
echo "============================================"
cd ${HOME_DIR}

if [ -d "${PROJECT_DIR}" ]; then
    echo "Repositório já existe. Atualizando..."
    cd ${PROJECT_DIR}
    git pull origin main
else
    echo "Clonando repositório..."
    git clone https://github.com/AnalineS/siteroteirodedispersacao.git
fi

echo ""
echo "🐍 PASSO 2: Configurando Virtual Environment"
echo "==========================================="
if [ ! -d "${VENV_DIR}" ]; then
    echo "Criando virtual environment..."
    python3.10 -m venv ${VENV_DIR}
else
    echo "Virtual environment já existe."
fi

echo ""
echo "📦 PASSO 3: Instalando Dependências"
echo "==================================="
source ${VENV_DIR}/bin/activate
cd ${PROJECT_DIR}/backend

# Verificar se existe requirements.txt
if [ -f "requirements.txt" ]; then
    echo "Instalando dependências do requirements.txt..."
    pip install --upgrade pip
    pip install -r requirements.txt
else
    echo "requirements.txt não encontrado. Instalando dependências básicas..."
    pip install --upgrade pip
    pip install flask flask-cors gunicorn python-dotenv
fi

echo ""
echo "🔧 PASSO 4: Configurando Arquivo WSGI"
echo "===================================="
WSGI_FILE="${HOME_DIR}/${PYTHONANYWHERE_USER}_pythonanywhere_com_wsgi.py"

cat > ${WSGI_FILE} << 'EOF'
# This file contains the WSGI configuration required to serve up your
# web application at https://roteirodedispensacao.pythonanywhere.com/

import sys
import os
from pathlib import Path

# Adicionar o diretório do projeto ao Python path
project_home = '/home/roteirodedispensacao/siteroteirodedispensacao'
if project_home not in sys.path:
    sys.path.insert(0, project_home)

# Adicionar o diretório backend ao Python path
backend_path = os.path.join(project_home, 'backend')
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

# Configurar variáveis de ambiente
os.environ['FLASK_ENV'] = 'production'

# Importar a aplicação Flask
try:
    from app import app as application
    print("Flask app importado com sucesso!")
except Exception as e:
    print(f"Erro ao importar Flask app: {e}")
    import traceback
    traceback.print_exc()
    
    # Aplicação de fallback para debug
    from flask import Flask
    application = Flask(__name__)
    
    @application.route('/')
    def error():
        return f"<h1>Erro ao carregar aplicação</h1><pre>{str(e)}</pre>", 500

# Configurar o caminho para arquivos estáticos do React
if hasattr(application, 'static_folder'):
    frontend_build_path = os.path.join(project_home, 'frontend', 'build')
    if os.path.exists(frontend_build_path):
        application.static_folder = frontend_build_path
        application.static_url_path = ''
        print(f"Static folder configurado para: {frontend_build_path}")
EOF

echo "WSGI configurado em: ${WSGI_FILE}"

echo ""
echo "🌐 PASSO 5: Configurando Static Files no PythonAnywhere"
echo "====================================================="
echo ""
echo "IMPORTANTE: Configure os static files no painel web do PythonAnywhere:"
echo ""
echo "1. Acesse: https://www.pythonanywhere.com/user/${PYTHONANYWHERE_USER}/webapps/"
echo "2. Na seção 'Static files', adicione:"
echo "   URL: /"
echo "   Directory: /home/${PYTHONANYWHERE_USER}/siteroteirodedispersacao/frontend/build"
echo ""

echo ""
echo "🔐 PASSO 6: Configurando Variáveis de Ambiente"
echo "=============================================="
ENV_FILE="${PROJECT_DIR}/backend/.env"

if [ ! -f "${ENV_FILE}" ]; then
    echo "Criando arquivo .env básico..."
    cat > ${ENV_FILE} << 'EOF'
# Configurações Flask
FLASK_ENV=production
SECRET_KEY=your-secret-key-here-change-in-production

# Configurações de Database (se necessário)
# DATABASE_URL=

# Outras configurações
# API_KEY=
EOF
    echo "IMPORTANTE: Edite ${ENV_FILE} com suas configurações reais!"
else
    echo "Arquivo .env já existe."
fi

echo ""
echo "📋 PASSO 7: Verificando Estrutura do Projeto"
echo "==========================================="
echo "Estrutura do backend:"
ls -la ${PROJECT_DIR}/backend/

echo ""
echo "Estrutura do frontend/build:"
ls -la ${PROJECT_DIR}/frontend/build/ 2>/dev/null || echo "Frontend build não encontrado!"

echo ""
echo "✅ PASSO 8: Próximos Passos"
echo "============================"
echo ""
echo "1. Execute este script no console Bash do PythonAnywhere"
echo "2. Configure os static files no painel web (instruções acima)"
echo "3. Recarregue sua aplicação web no painel"
echo "4. Verifique os logs de erro se houver problemas"
echo ""
echo "Logs de erro disponíveis em:"
echo "- Error log: /var/log/${PYTHONANYWHERE_USER}.pythonanywhere.com.error.log"
echo "- Server log: /var/log/${PYTHONANYWHERE_USER}.pythonanywhere.com.server.log"
echo ""
echo "=== SCRIPT DE DEPLOY FINALIZADO ==="