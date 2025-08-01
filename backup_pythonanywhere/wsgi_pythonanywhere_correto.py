#!/usr/bin/env python3
"""
WSGI Configuration CORRIGIDO para PythonAnywhere
Roteiro de Dispensação - Hanseníase
VERSÃO SIMPLIFICADA E FUNCIONAL
"""

import sys
import os

# IMPORTANTE: Configurar o caminho correto
project_home = '/home/roteirodedispensacao'

# Adicionar o diretório do projeto ao Python path
if project_home not in sys.path:
    sys.path.insert(0, project_home)

# Configurar variáveis de ambiente essenciais
os.environ.setdefault('FLASK_ENV', 'production')

# Carregar variáveis do arquivo .env
def load_env_file():
    """Carrega variáveis do arquivo .env manualmente"""
    env_path = os.path.join(project_home, '.env')
    if os.path.exists(env_path):
        try:
            with open(env_path, 'r', encoding='utf-8') as f:
                for line_num, line in enumerate(f, 1):
                    line = line.strip()
                    if line and not line.startswith('#'):
                        if '=' in line:
                            key, value = line.split('=', 1)
                            os.environ[key.strip()] = value.strip()
                            print(f"Variável carregada: {key.strip()}")
                        else:
                            print(f"Linha {line_num} ignorada (formato inválido): {line}")
            print(f"✅ Arquivo .env carregado com sucesso de {env_path}")
        except Exception as e:
            print(f"❌ Erro ao carregar .env: {e}")
    else:
        print(f"⚠️ Arquivo .env não encontrado em {env_path}")

# Carregar variáveis de ambiente
load_env_file()

# Log de debug
print(f"📁 Diretório do projeto: {project_home}")
print(f"🐍 Python path: {sys.path[:3]}")
print(f"📂 Arquivos no diretório:")
try:
    files = os.listdir(project_home)
    for f in files:
        if f.endswith('.py') or f.startswith('.env'):
            print(f"  - {f}")
except Exception as e:
    print(f"❌ Erro ao listar arquivos: {e}")

# Importar a aplicação Flask
try:
    print("🔄 Tentando importar app_flask...")
    from app_flask import app as application
    print("✅ Aplicação Flask importada com sucesso!")
    
    # Verificar se a aplicação está configurada
    if hasattr(application, 'config'):
        print(f"🔧 Flask app configurado: {application.name}")
    
except ImportError as e:
    print(f"❌ ERRO DE IMPORTAÇÃO: {e}")
    
    # Fallback: criar aplicação mínima
    print("🔄 Criando aplicação Flask de emergência...")
    from flask import Flask
    application = Flask(__name__)
    
    @application.route('/')
    def emergency_response():
        return f"""
        <h1>🚨 Erro de Configuração</h1>
        <p><strong>Erro de importação:</strong> {str(e)}</p>
        <p><strong>Diretório atual:</strong> {os.getcwd()}</p>
        <p><strong>Arquivos disponíveis:</strong></p>
        <ul>
        {"".join([f"<li>{f}</li>" for f in os.listdir(project_home) if f.endswith('.py')])}
        </ul>
        <p><strong>Python path:</strong></p>
        <ul>
        {"".join([f"<li>{p}</li>" for p in sys.path[:5]])}
        </ul>
        <p>Verifique se o arquivo 'app_flask.py' está em {project_home}</p>
        """
    
    print("⚠️ Aplicação de emergência criada")

except Exception as e:
    print(f"❌ ERRO CRÍTICO: {e}")
    from flask import Flask
    application = Flask(__name__)
    
    @application.route('/')
    def critical_error():
        return f"<h1>Erro Crítico</h1><p>{str(e)}</p>"

# Verificação final
if __name__ == "__main__":
    print("🚀 WSGI configurado e pronto!")
    print(f"📱 Aplicação: {application}")
    # Test run para desenvolvimento
    application.run(debug=False, host='0.0.0.0', port=5000)