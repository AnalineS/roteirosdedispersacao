# -*- coding: utf-8 -*-
"""
Main Application - Versão Simplificada para Diagnóstico
Sistema Educacional para Dispensação PQT-U - Debug Version
"""

import sys
import os
import logging

# Garantir encoding UTF-8 no Windows
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

from flask import Flask, jsonify
from flask_cors import CORS
from datetime import datetime

# Configurar logging básico
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def create_simple_app():
    """Factory function para criar aplicação Flask simplificada"""
    app = Flask(__name__)
    
    # Configuração mínima
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-key-for-testing')
    app.config['DEBUG'] = False
    
    # CORS simples
    CORS(app, origins=["*"])
    
    @app.route('/')
    def root():
        """Rota raiz - teste básico"""
        return jsonify({
            "status": "OK",
            "message": "Backend simplificado funcionando",
            "version": "debug-1.0",
            "timestamp": datetime.now().isoformat()
        }), 200
    
    @app.route('/api/health')
    def health():
        """Health check simples"""
        return jsonify({
            "status": "healthy",
            "service": "roteiros-dispensacao-debug",
            "port": os.getenv('PORT', '8080'),
            "environment": os.getenv('ENVIRONMENT', 'production'),
            "timestamp": datetime.now().isoformat()
        }), 200
    
    @app.route('/api/test')
    def test():
        """Teste de conectividade"""
        return jsonify({
            "message": "Teste de conectividade OK",
            "environment_vars": {
                "PORT": os.getenv('PORT'),
                "SECRET_KEY": "***" if os.getenv('SECRET_KEY') else None,
                "ENVIRONMENT": os.getenv('ENVIRONMENT'),
                "GCP_PROJECT_ID": os.getenv('GCP_PROJECT_ID'),
                "FIREBASE_PROJECT_ID": os.getenv('FIREBASE_PROJECT_ID')
            }
        }), 200
    
    return app

# Criar aplicação
app = create_simple_app()

# Execução da aplicação
if __name__ == '__main__':
    try:
        port = int(os.environ.get('PORT', 8080))
        host = '0.0.0.0'
        
        logger.info(f"🚀 Iniciando servidor DEBUG em {host}:{port}")
        logger.info(f"🔧 SECRET_KEY: {'✅ Configurada' if os.getenv('SECRET_KEY') else '❌ Não configurada'}")
        logger.info(f"🌍 ENVIRONMENT: {os.getenv('ENVIRONMENT', 'não definido')}")
        
        # Executar aplicação
        app.run(
            host=host,
            port=port,
            debug=False,
            threaded=True,
            use_reloader=False
        )
        
    except KeyboardInterrupt:
        logger.info("⏹️  Servidor interrompido pelo usuário")
    except Exception as e:
        logger.error(f"❌ Erro ao iniciar servidor: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)