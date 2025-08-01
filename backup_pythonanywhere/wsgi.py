#!/usr/bin/env python3
"""
WSGI Configuration for PythonAnywhere - PROJETO COMPLETO
Roteiro de Dispensação - Hanseníase
Suporte a todas as funcionalidades: RAG, Frontend React, Sistema Complexo
"""

import sys
import os

# CONFIGURAR VARIÁVEIS DE AMBIENTE
os.environ['OPENAI_API_KEY'] = 'SUA_CHAVE_AQUI'  # SUBSTITUA pela sua chave
os.environ['FLASK_ENV'] = 'production'
os.environ['PYTHONPATH'] = '/home/analines/roteiro-de-dispensacao'

# Adicionar TODOS os diretórios necessários
project_home = '/home/analines/roteiro-de-dispensacao'
paths_to_add = [
    project_home,
    os.path.join(project_home, 'src'),
    os.path.join(project_home, 'src', 'backend'),
    os.path.join(project_home, 'src', 'backend', 'services'),
    os.path.join(project_home, 'src', 'backend', 'core'),
    os.path.join(project_home, 'src', 'backend', 'config'),
    os.path.join(project_home, 'src', 'backend', 'utils'),
]

for path in paths_to_add:
    if path not in sys.path:
        sys.path.insert(0, path)

# Log para debug
print(f"Python path configurado: {sys.path[:5]}")
print(f"Diretório de trabalho: {os.getcwd()}")

# Importar aplicação Flask COMPLETA
try:
    from src.backend.main import app as application
    print("✅ Aplicação Flask importada com sucesso!")
except ImportError as e:
    print(f"❌ Erro ao importar aplicação: {e}")
    # Fallback simples
    from flask import Flask
    application = Flask(__name__)
    
    @application.route('/')
    def hello():
        return f"<h1>Erro de Import</h1><p>Detalhes: {str(e)}</p>"

if __name__ == "__main__":
    application.run(debug=False)