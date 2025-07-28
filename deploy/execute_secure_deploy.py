#!/usr/bin/env python3
"""
EXECUTOR SEGURO DE DEPLOY RENDER
Configura variaveis de ambiente e executa deploy
"""

import os
import sys
import importlib.util

def main():
    """Executa deploy com variaveis de ambiente configuradas"""
    
    # Configurar variaveis de ambiente temporariamente
    os.environ['RENDER_API_KEY'] = 'rnd_PdHEt2X7PABBh2N3Nw1OTX5NE8HF'
    os.environ['HUGGINGFACE_API_KEY'] = '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'
    os.environ['OPENROUTER_API_KEY'] = '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'
    
    print(">>> Variaveis de ambiente configuradas")
    print(">>> Iniciando deploy...")
    
    # Carregar e executar o modulo deploy_simple
    script_dir = os.path.dirname(os.path.abspath(__file__))
    deploy_script = os.path.join(script_dir, 'deploy_simple.py')
    
    if not os.path.exists(deploy_script):
        print(f"ERRO: {deploy_script} nao encontrado")
        return
    
    # Importar e executar deploy_simple
    spec = importlib.util.spec_from_file_location("deploy_simple", deploy_script)
    deploy_module = importlib.util.module_from_spec(spec)
    
    try:
        spec.loader.exec_module(deploy_module)
        # Executar funcao main do deploy_simple
        if hasattr(deploy_module, 'main'):
            deploy_module.main()
        else:
            print("ERRO: Funcao main nao encontrada em deploy_simple.py")
    except Exception as e:
        print(f"ERRO durante execucao: {e}")
    finally:
        # Limpar variaveis de ambiente
        for key in ['RENDER_API_KEY', 'HUGGINGFACE_API_KEY', 'OPENROUTER_API_KEY']:
            if key in os.environ:
                del os.environ[key]
        print(">>> Variaveis de ambiente limpas")

if __name__ == "__main__":
    main()