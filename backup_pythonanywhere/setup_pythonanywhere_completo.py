#!/usr/bin/env python3
"""
Script completo para configurar o site no PythonAnywhere
Execute este script no Console Python do PythonAnywhere
"""

import os
import shutil
import subprocess
import sys

def setup_pythonanywhere():
    """Configura o ambiente PythonAnywhere"""
    
    print("🚀 Configurando PythonAnywhere...")
    
    # 1. Criar estrutura básica de diretórios
    home_dir = "/home/roteirodedispensacao"
    
    # 2. Criar app.py principal (versão simples que funciona)
    app_content = '''#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from flask import Flask, render_template, request, jsonify
import os
from datetime import datetime

# Configuração da aplicação
app = Flask(__name__)

# Configurações básicas
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['DEBUG'] = os.environ.get('FLASK_DEBUG', 'False').lower() == 'true'

@app.route('/')
def index():
    """Página principal"""
    return """
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Site Roteiro de Dispensação</title>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                margin: 40px; 
                line-height: 1.6;
                background: #f4f4f4;
            }
            .container {
                max-width: 800px;
                margin: 0 auto;
                background: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 0 10px rgba(0,0,0,0.1);
            }
            h1 { color: #333; text-align: center; }
            .status { 
                background: #d4edda; 
                color: #155724; 
                padding: 15px; 
                border-radius: 5px; 
                margin: 20px 0;
            }
            .info {
                background: #cce6ff;
                padding: 15px;
                border-radius: 5px;
                margin: 20px 0;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🎯 Site Roteiro de Dispensação</h1>
            
            <div class="status">
                ✅ <strong>Status:</strong> Aplicação funcionando corretamente no PythonAnywhere!
            </div>
            
            <div class="info">
                <h3>📋 Informações do Sistema:</h3>
                <ul>
                    <li><strong>Data/Hora:</strong> {datetime}</li>
                    <li><strong>Ambiente:</strong> PythonAnywhere</li>
                    <li><strong>Flask:</strong> Ativo</li>
                    <li><strong>Status:</strong> Funcionando</li>
                </ul>
            </div>
            
            <div class="info">
                <h3>🔧 Próximos Passos:</h3>
                <ol>
                    <li>Configurar funcionalidades específicas</li>
                    <li>Adicionar conteúdo personalizado</li>
                    <li>Implementar recursos avançados</li>
                </ol>
            </div>
        </div>
    </body>
    </html>
    """.format(datetime=datetime.now().strftime("%d/%m/%Y %H:%M:%S"))

@app.route('/health')
def health():
    """Endpoint de verificação de saúde"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'message': 'Aplicação funcionando corretamente'
    })

@app.route('/test')
def test():
    """Página de teste"""
    return jsonify({
        'message': 'Teste bem-sucedido!',
        'timestamp': datetime.now().isoformat(),
        'python_version': sys.version,
        'working_directory': os.getcwd()
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=app.config['DEBUG'])
'''

    # 3. Criar WSGI configuration
    wsgi_content = '''#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import os

# Adicionar o diretório do projeto ao Python path
path = '/home/roteirodedispensacao'
if path not in sys.path:
    sys.path.insert(0, path)

# Configurar variáveis de ambiente
os.environ.setdefault('FLASK_ENV', 'production')
os.environ.setdefault('SECRET_KEY', 'production-secret-key-change-me')

# Importar a aplicação
try:
    from app import app as application
    print("✅ Aplicação importada com sucesso!")
except Exception as e:
    print(f"❌ Erro ao importar aplicação: {e}")
    # Aplicação de fallback em caso de erro
    from flask import Flask
    application = Flask(__name__)
    
    @application.route('/')
    def fallback():
        return f"<h1>Erro na aplicação</h1><p>Detalhes: {str(e)}</p>"

if __name__ == "__main__":
    application.run()
'''

    # 4. Criar requirements.txt
    requirements_content = '''Flask==2.3.3
Werkzeug==2.3.7
'''

    # 5. Criar arquivo .env
    env_content = '''FLASK_ENV=production
SECRET_KEY=production-secret-key-change-me-in-production
FLASK_DEBUG=False
'''

    try:
        # Criar arquivos necessários
        print("📁 Criando arquivos necessários...")
        
        # Criar app.py
        with open(os.path.join(home_dir, 'app.py'), 'w', encoding='utf-8') as f:
            f.write(app_content)
        print("✅ app.py criado")
        
        # Criar wsgi.py  
        with open(os.path.join(home_dir, 'wsgi.py'), 'w', encoding='utf-8') as f:
            f.write(wsgi_content)
        print("✅ wsgi.py criado")
        
        # Criar requirements.txt
        with open(os.path.join(home_dir, 'requirements.txt'), 'w', encoding='utf-8') as f:
            f.write(requirements_content)
        print("✅ requirements.txt criado")
        
        # Criar .env
        with open(os.path.join(home_dir, '.env'), 'w', encoding='utf-8') as f:
            f.write(env_content)
        print("✅ .env criado")
        
        # Instalar dependências
        print("📦 Instalando dependências...")
        result = subprocess.run([sys.executable, '-m', 'pip', 'install', '-r', 
                               os.path.join(home_dir, 'requirements.txt')], 
                              capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ Dependências instaladas com sucesso")
        else:
            print(f"⚠️ Aviso na instalação: {result.stderr}")
        
        print("\n🎉 CONFIGURAÇÃO CONCLUÍDA!")
        print("\n📋 PRÓXIMOS PASSOS:")
        print("1. Vá para a aba 'Web' no painel do PythonAnywhere")
        print("2. Configure o arquivo WSGI para apontar para: /home/roteirodedispensacao/wsgi.py")
        print("3. Clique em 'Reload' na aplicação web")
        print("4. Teste em: https://roteirodedispensacao.pythonanywhere.com")
        
        return True
        
    except Exception as e:
        print(f"❌ Erro durante configuração: {e}")
        return False

if __name__ == "__main__":
    setup_pythonanywhere()