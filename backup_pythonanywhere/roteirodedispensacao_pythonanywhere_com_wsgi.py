import sys
import os

# Configurar diretório do projeto
project_home = '/home/roteirodedispensacao'
if project_home not in sys.path:
    sys.path.insert(0, project_home)

# Tentar carregar variáveis do arquivo .env
try:
    # Primeiro tenta usando python-dotenv se disponível
    from dotenv import load_dotenv
    load_dotenv(os.path.join(project_home, '.env'))
except ImportError:
    # Se python-dotenv não estiver disponível, carrega manualmente
    env_path = os.path.join(project_home, '.env')
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                if line.strip() and not line.startswith('#'):
                    key, value = line.strip().split('=', 1)
                    os.environ[key] = value

# Importar aplicação Flask
from app_flask import app as application