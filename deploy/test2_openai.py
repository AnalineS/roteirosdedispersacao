"""
TESTE 2: ADICIONAR OPENAI CLIENT
Para testar se Render.com aceita clientes de API externa
"""

REQUIREMENTS_ADDITION = """
# === TESTE 2: API EXTERNA CLIENT ===
openai==1.12.0
httpx==0.25.2
"""

MAIN_PY_ADDITION = """
# Teste OpenAI integration
try:
    import openai
    OPENAI_AVAILABLE = True
    print("✅ OpenAI client carregado com sucesso")
except ImportError:
    OPENAI_AVAILABLE = False
    print("❌ OpenAI client indisponível")

def get_openai_response(question: str, context: str) -> str:
    '''Resposta usando OpenAI API'''
    if not OPENAI_AVAILABLE:
        return "OpenAI não disponível"
    
    try:
        # Simulação - não fazer chamada real para economizar API
        return f"Resposta OpenAI simulada para: {question[:50]}"
    except Exception as e:
        return f"Erro OpenAI: {str(e)}"
"""

print("Script de teste 2 preparado")
print("Adicionar ao requirements.txt:")
print(REQUIREMENTS_ADDITION)
print("\nAdicionar ao main.py:")
print(MAIN_PY_ADDITION)