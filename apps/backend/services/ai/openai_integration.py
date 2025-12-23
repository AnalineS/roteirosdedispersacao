# -*- coding: utf-8 -*-
"""
INTEGRAÇÃO OPENAI - TESTE 2
Testando se Render aceita cliente OpenAI e HTTPx
"""

import os
import logging

logger = logging.getLogger(__name__)

try:
    import openai
    OPENAI_AVAILABLE = True
    logger.info("[OK] OpenAI client importado com sucesso")
except ImportError as e:
    OPENAI_AVAILABLE = False
    logger.warning(f"[ERROR] OpenAI client indisponível: {e}")

def test_openai_connection():
    """Testa conectividade com OpenAI (sem fazer chamadas pagas)"""
    if not OPENAI_AVAILABLE:
        return {"status": "unavailable", "reason": "libraries_missing"}
    
    try:
        # Configurar cliente
        api_key = os.environ.get('OPENROUTER_API_KEY')
        if not api_key:
            return {"status": "no_api_key", "message": "OPENROUTER_API_KEY não configurada"}
        
        # Testar apenas a configuração, não fazer chamada real
        client = openai.OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=api_key
        )
        
        return {
            "status": "configured", 
            "message": "Cliente OpenAI configurado com sucesso",
            "client_available": True
        }
        
    except Exception as e:
        return {"status": "error", "message": str(e)}

def get_ai_response_mock(question: str, context: str, persona: str = "dr_gasnelio") -> str:
    """Resposta simulada para teste (sem consumir API)"""
    
    if not OPENAI_AVAILABLE:
        return "OpenAI não disponível - usando resposta básica"
    
    # Resposta simulada baseada na persona
    if persona == "dr_gasnelio":
        return f"""Dr. Gasnelio responde:

Com base no contexto fornecido sobre hanseníase, posso orientá-lo sobre: {question}

{context[:200]}...

*Esta é uma resposta simulada para teste. Em produção, utilizaria a API da OpenAI/OpenRouter para gerar respostas personalizadas baseadas na tese de doutorado.*

Para informações detalhadas, consulte sempre um profissional de saúde qualificado."""

    else:  # GA
        return f"""Oi! Sou o Gá! 😊

Sobre sua pergunta: {question}

{context[:200]}...

*Resposta simulada para teste do sistema. Em produção, usaria IA avançada para respostas mais naturais e empáticas.*

Espero ter ajudado! Qualquer dúvida, estou aqui! 💙"""

def get_openrouter_client(config=None):
    """Obtém cliente OpenRouter configurado"""
    if not OPENAI_AVAILABLE:
        return None

    try:
        api_key = os.environ.get('OPENROUTER_API_KEY')
        if not api_key:
            return None

        client = openai.OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=api_key
        )
        return client

    except Exception as e:
        logger.warning(f"Erro ao criar cliente OpenRouter: {e}")
        return None

def is_openrouter_available():
    """Verifica se OpenRouter está disponível"""
    return OPENAI_AVAILABLE and bool(os.environ.get('OPENROUTER_API_KEY'))

# Teste de importação
if __name__ == "__main__":
    result = test_openai_connection()
    print(f"Teste OpenAI: {result}")