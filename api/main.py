from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys
import re
import logging
from datetime import datetime, timedelta
import requests
import json
from collections import defaultdict
import threading
import time
import html
import bleach

# Adicionar paths para imports do projeto
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
src_path = os.path.join(project_root, 'src')
backend_path = os.path.join(src_path, 'backend')

sys.path.extend([project_root, src_path, backend_path])

# Configuração simplificada para Vercel - sem dependências complexas
imports_success = False  # Usar apenas funcionalidades básicas para Vercel

# Imports complexos comentados para deploy no Vercel
# try:
#     from src.backend.services.dr_gasnelio_enhanced import get_enhanced_dr_gasnelio_prompt, validate_dr_gasnelio_response
#     from src.backend.services.ga_enhanced import get_enhanced_ga_prompt, validate_ga_response
#     from src.backend.services.scope_detection_system import detect_question_scope, get_limitation_response
#     from src.backend.services.enhanced_rag_system import get_enhanced_context, cache_rag_response, add_rag_feedback, get_rag_stats
#     from src.backend.services.personas import get_personas, get_persona_prompt
#     
#     # Importar otimizações de performance
#     from src.backend.core.performance import performance_cache, response_optimizer, usability_monitor
#     
#     # Importar monitoramento de produção
#     from src.backend.core.monitoring.production_health import production_health, track_request_middleware, get_health_status, get_detailed_health
#     from src.backend.core.monitoring.production_logging import log_request, log_security_event, log_error, log_startup
#     
#     imports_success = True
# except ImportError as e:
#     imports_success = False
#     print(f"Warning: Some imports failed: {e}")

app = Flask(__name__)

# Configuração CORS para Vercel
allowed_origins = [
    "https://roteiro-dispensacao.vercel.app",
    "https://*.vercel.app",
    "http://localhost:3000",
    "http://127.0.0.1:3000"
]

# Detecção automática do ambiente Vercel
vercel_env = os.environ.get('VERCEL_ENV')
if vercel_env == 'production':
    allowed_origins = ["https://roteiro-dispensacao.vercel.app"]
elif vercel_env == 'preview':
    vercel_url = os.environ.get('VERCEL_URL')
    if vercel_url:
        allowed_origins = [f"https://{vercel_url}"]

CORS(app, 
     origins=allowed_origins,
     methods=['GET', 'POST', 'OPTIONS'],
     allow_headers=['Content-Type', 'Authorization'],
     supports_credentials=False,
     max_age=86400)

# Headers de segurança otimizados para Vercel
@app.after_request
def add_security_headers(response):
    """Adiciona headers de segurança para Vercel"""
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    
    if request.is_secure:
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    
    response.headers['Content-Security-Policy'] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline'; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data: https:; "
        "connect-src 'self' https://api-inference.huggingface.co https://openrouter.ai"
    )
    
    response.headers.pop('Server', None)
    return response

# Configuração de logging otimizada para Vercel
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Rate Limiting simplificado para serverless
class VercelRateLimiter:
    """Rate limiter otimizado para ambiente serverless"""
    
    def __init__(self):
        self.requests = defaultdict(list)
        self.limits = {
            'chat': {'max_requests': 30, 'window_minutes': 1},
            'general': {'max_requests': 60, 'window_minutes': 1},
            'scope': {'max_requests': 40, 'window_minutes': 1}
        }
    
    def is_allowed(self, client_ip: str, endpoint_type: str = 'general') -> tuple[bool, dict]:
        """Verificação simplificada de rate limiting"""
        now = datetime.now()
        endpoint_limit = self.limits.get(endpoint_type, self.limits['general'])
        window_start = now - timedelta(minutes=endpoint_limit['window_minutes'])
        
        key = f"{client_ip}:{endpoint_type}"
        
        # Limpar requisições antigas
        self.requests[key] = [req_time for req_time in self.requests[key] if req_time > window_start]
        
        current_count = len(self.requests[key])
        is_allowed = current_count < endpoint_limit['max_requests']
        
        if is_allowed:
            self.requests[key].append(now)
        
        return is_allowed, {
            'current_count': current_count + (1 if is_allowed else 0),
            'limit': endpoint_limit['max_requests'],
            'window_minutes': endpoint_limit['window_minutes'],
            'reset_time': (now + timedelta(minutes=endpoint_limit['window_minutes'])).isoformat()
        }

# Instância global do rate limiter
rate_limiter = VercelRateLimiter()

def check_rate_limit(endpoint_type: str = 'general'):
    """Decorator para verificar rate limiting"""
    def decorator(f):
        def wrapper(*args, **kwargs):
            client_ip = request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr) or 'unknown'
            is_allowed, rate_info = rate_limiter.is_allowed(client_ip, endpoint_type)
            
            if not is_allowed:
                logger.warning(f"Rate limit excedido para {client_ip} no endpoint {endpoint_type}")
                return jsonify({
                    "error": "Rate limit excedido. Tente novamente em alguns instantes.",
                    "error_code": "RATE_LIMIT_EXCEEDED",
                    "rate_limit_info": rate_info,
                    "timestamp": datetime.now().isoformat()
                }), 429
            
            response = f(*args, **kwargs)
            if hasattr(response, 'headers'):
                response.headers['X-RateLimit-Limit'] = str(rate_info['limit'])
                response.headers['X-RateLimit-Remaining'] = str(rate_info['limit'] - rate_info['current_count'])
                response.headers['X-RateLimit-Reset'] = rate_info['reset_time']
            
            return response
        wrapper.__name__ = f.__name__
        return wrapper
    return decorator

def validate_and_sanitize_input(user_input):
    """Validação e sanitização robusta de entrada do usuário"""
    if not user_input or not isinstance(user_input, str):
        raise ValueError("Input inválido")
    
    if len(user_input) > 2000:
        raise ValueError("Pergunta muito longa (máximo 2000 caracteres)")
    
    # Detectar tentativas de injeção
    dangerous_patterns = [
        r'<script[^>]*>.*?</script>',
        r'javascript:',
        r'on\w+\s*=',
        r'<iframe[^>]*>',
        r'<object[^>]*>',
        r'<embed[^>]*>',
        r'expression\s*\(',
        r'@import',
        r'data:.*base64',
    ]
    
    for pattern in dangerous_patterns:
        if re.search(pattern, user_input, re.IGNORECASE):
            raise ValueError("Input contém conteúdo potencialmente perigoso")
    
    cleaned_input = bleach.clean(user_input, tags=[], strip=True)
    cleaned_input = html.escape(cleaned_input)
    cleaned_input = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', cleaned_input)
    cleaned_input = re.sub(r'\s+', ' ', cleaned_input).strip()
    
    if not cleaned_input:
        raise ValueError("Input vazio após sanitização")
    
    return cleaned_input

# Carregar base de conhecimento
MD_PATH = os.path.join(project_root, 'data', 'knowledge_base', 'Roteiro de Dsispensação - Hanseníase.md')
md_text = ""

def extract_md_text(md_path):
    """Extrai texto do arquivo Markdown"""
    try:
        with open(md_path, 'r', encoding='utf-8') as file:
            text = file.read()
        logger.info(f"Arquivo Markdown extraído com sucesso. Total de caracteres: {len(text)}")
        return text
    except Exception as e:
        logger.error(f"Erro ao extrair arquivo Markdown: {e}")
        return ""

# Fallback para personas se importação falhar
FALLBACK_PERSONAS = {
    "dr_gasnelio": {
        "name": "Dr. Gasnelio",
        "description": "Farmacêutico clínico especialista em hanseníase",
        "avatar": "👨‍⚕️"
    },
    "ga": {
        "name": "Gá",
        "description": "Farmacêutico empático e acessível",
        "avatar": "😊"
    }
}

def get_personas_safe():
    """Obtém personas com fallback seguro"""
    if imports_success:
        try:
            return get_personas()
        except:
            pass
    return FALLBACK_PERSONAS

def find_relevant_context(question, full_text, max_length=3000):
    """Encontra contexto relevante para a pergunta"""
    paragraphs = full_text.split('\n\n')
    question_words = set(re.findall(r'\w+', question.lower()))
    
    best_paragraphs = []
    for paragraph in paragraphs:
        if len(paragraph.strip()) < 50:
            continue
            
        paragraph_words = set(re.findall(r'\w+', paragraph.lower()))
        common_words = question_words.intersection(paragraph_words)
        score = len(common_words) / len(question_words) if question_words else 0
        
        if score > 0.1:
            best_paragraphs.append((paragraph, score))
    
    best_paragraphs.sort(key=lambda x: x[1], reverse=True)
    
    context = ""
    for paragraph, score in best_paragraphs[:3]:
        context += paragraph + "\n\n"
        if len(context) > max_length:
            break
    
    return context[:max_length] if context else full_text[:max_length]

def get_free_ai_response(question, persona, context):
    """Obtém resposta de IA com fallback"""
    # Comentado para deploy no Vercel - usar apenas respostas baseadas em regras
    return generate_rule_based_response(question, persona, context)
    
    # try:
    #     hf_token = os.environ.get('HUGGINGFACE_API_KEY')
    #     if not hf_token:
    #         return generate_rule_based_response(question, persona, context)
    #         
    #     api_url = "https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium"
    #     
    #     headers = {
    #         "Authorization": f"Bearer {hf_token}",
    #         "Content-Type": "application/json"
    #     }
    #     
    #     prompt = f"Contexto: {context}\n\nPergunta: {question}\n\nResposta:"
    #     
    #     payload = {
    #         "inputs": prompt,
    #         "parameters": {
    #             "max_length": 500,
    #             "temperature": 0.7,
    #             "do_sample": True
    #         }
    #     }
    #     
    #     response = requests.post(api_url, headers=headers, json=payload, timeout=15)
    #     
    #     if response.status_code == 200:
    #         result = response.json()
    #         if isinstance(result, list) and len(result) > 0:
    #             ai_response = result[0].get('generated_text', '').replace(prompt, '').strip()
    #             return ai_response if ai_response else generate_rule_based_response(question, persona, context)
    #     
    #     return generate_rule_based_response(question, persona, context)
    #     
    # except Exception as e:
    #     logger.error(f"Erro ao obter resposta da API: {e}")
    #     return generate_rule_based_response(question, persona, context)

def generate_rule_based_response(question, persona, context):
    """Gera resposta baseada em regras"""
    question_lower = question.lower()
    
    keyword_responses = {
        "hanseníase": {
            "dr_gasnelio": "A hanseníase é uma doença infecciosa crônica causada pelo Mycobacterium leprae. O roteiro de dispensação padroniza o processo de entrega de medicamentos.",
            "ga": "A hanseníase é uma doença que precisa de tratamento especial. Nosso roteiro ajuda a farmácia a explicar tudo direitinho! 😊"
        },
        "dispensação": {
            "dr_gasnelio": "A dispensação é o processo estruturado de entrega de medicamentos com orientações farmacêuticas adequadas.",
            "ga": "Dispensação é quando a farmácia entrega o remédio e explica como tomar. Nosso roteiro garante que você saiba tudo! 👍"
        }
    }
    
    for keyword, responses in keyword_responses.items():
        if keyword in question_lower:
            return responses.get(persona, responses["ga"])
    
    if persona == "dr_gasnelio":
        return f"Baseado na pesquisa sobre roteiro de dispensação para hanseníase, posso fornecer informações técnicas sobre '{question}'."
    else:
        return f"Oi! Sobre sua pergunta sobre '{question}', posso te ajudar com informações sobre o roteiro de dispensação! 😊"

def format_persona_answer(answer, persona, confidence=0.8):
    """Formata resposta de acordo com a personalidade"""
    personas = get_personas_safe()
    persona_config = personas.get(persona, {"name": "Assistente"})
    
    if persona == "dr_gasnelio":
        return {
            "answer": f"Dr. Gasnelio responde:\n\n{answer}\n\n*Baseado na tese sobre roteiro de dispensação para hanseníase.*",
            "persona": "dr_gasnelio",
            "confidence": confidence,
            "name": persona_config["name"]
        }
    elif persona == "ga":
        return {
            "answer": f"Oi! Aqui é o Gá! 😊\n\n{answer}\n\n*Explicação baseada na tese, mas falada do meu jeito pra facilitar!*",
            "persona": "ga", 
            "confidence": confidence,
            "name": persona_config["name"]
        }
    else:
        return {
            "answer": answer,
            "persona": "default",
            "confidence": confidence,
            "name": "Assistente"
        }

def answer_question(question, persona):
    """Responde à pergunta do usuário"""
    global md_text
    
    if not md_text:
        return format_persona_answer(
            "Desculpe, a base de conhecimento não está disponível no momento.", 
            persona, 
            0.0
        )
    
    try:
        context = find_relevant_context(question, md_text)
        ai_response = get_free_ai_response(question, persona, context)
        
        if not ai_response:
            ai_response = generate_rule_based_response(question, persona, context)
        
        return format_persona_answer(ai_response, persona, 0.8)
        
    except Exception as e:
        logger.error(f"Erro ao processar pergunta: {e}")
        return format_persona_answer(
            "Desculpe, ocorreu um erro técnico. Tente novamente.", 
            persona, 
            0.0
        )

# ROUTES

@app.route('/')
def index():
    """Informações da API"""
    return jsonify({
        "message": "Roteiro de Dispensação API - Vercel",
        "version": "9.0.0",
        "status": "online",
        "platform": "Vercel Serverless",
        "endpoints": {
            "health": "/api/health",
            "chat": "/api/chat",
            "personas": "/api/personas"
        }
    })

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check para Vercel"""
    try:
        return jsonify({
            "status": "healthy",
            "platform": "vercel",
            "version": "9.0.0",
            "knowledge_base_loaded": len(md_text) > 0,
            "timestamp": datetime.now().isoformat(),
            "personas": list(get_personas_safe().keys())
        }), 200
    except Exception as e:
        return jsonify({
            "status": "error", 
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }), 500

@app.route('/api/chat', methods=['POST'])
@check_rate_limit('chat')
def chat_api():
    """Endpoint principal do chatbot"""
    start_time = datetime.now()
    request_id = f"req_{int(start_time.timestamp() * 1000)}"
    
    try:
        if not request.is_json:
            return jsonify({
                "error": "Content-Type deve ser application/json",
                "error_code": "INVALID_CONTENT_TYPE",
                "request_id": request_id
            }), 400

        data = request.get_json()
        if not data or not isinstance(data, dict):
            return jsonify({
                "error": "Payload deve ser um objeto JSON não vazio",
                "error_code": "EMPTY_PAYLOAD",
                "request_id": request_id
            }), 400

        question = data.get('question', '').strip()
        if not question:
            return jsonify({
                "error": "Campo 'question' é obrigatório",
                "error_code": "MISSING_QUESTION",
                "request_id": request_id
            }), 400
        
        if len(question) > 1000:
            return jsonify({
                "error": "Pergunta muito longa (máximo 1000 caracteres)",
                "error_code": "QUESTION_TOO_LONG",
                "request_id": request_id
            }), 400

        personality_id = data.get('personality_id', '').strip().lower()
        valid_personas = ['dr_gasnelio', 'ga']
        if not personality_id or personality_id not in valid_personas:
            return jsonify({
                "error": "Campo 'personality_id' deve ser um dos valores válidos",
                "error_code": "INVALID_PERSONA",
                "request_id": request_id,
                "valid_personas": valid_personas
            }), 400

        try:
            question = validate_and_sanitize_input(question)
        except ValueError as e:
            return jsonify({
                "error": f"Input inválido: {str(e)}",
                "error_code": "INVALID_INPUT",
                "request_id": request_id
            }), 400
        
        response = answer_question(question, personality_id)
        
        response.update({
            "request_id": request_id,
            "processing_time_ms": int((datetime.now() - start_time).total_seconds() * 1000),
            "timestamp": datetime.now().isoformat(),
            "api_version": "9.0.0",
            "platform": "vercel"
        })
        
        return jsonify(response), 200

    except Exception as e:
        logger.error(f"Erro crítico na API: {str(e)}")
        return jsonify({
            "error": "Erro interno do servidor",
            "error_code": "INTERNAL_SERVER_ERROR", 
            "request_id": request_id,
            "timestamp": datetime.now().isoformat()
        }), 500

@app.route('/api/personas', methods=['GET'])
@check_rate_limit('general')
def get_personas_api():
    """Endpoint para informações das personas"""
    try:
        personas_data = get_personas_safe()
        return jsonify({
            "personas": personas_data,
            "metadata": {
                "total_personas": len(personas_data),
                "available_persona_ids": list(personas_data.keys()),
                "api_version": "9.0.0",
                "platform": "vercel",
                "timestamp": datetime.now().isoformat()
            }
        }), 200
    except Exception as e:
        logger.error(f"Erro ao obter personas: {e}")
        return jsonify({
            "error": "Erro ao carregar informações das personas",
            "error_code": "PERSONAS_LOAD_ERROR",
            "timestamp": datetime.now().isoformat()
        }), 500

# Inicialização para Vercel
def init_app():
    """Inicialização da aplicação para Vercel"""
    global md_text
    
    # Tentar carregar arquivo de conhecimento
    try:
        if os.path.exists(MD_PATH):
            md_text = extract_md_text(MD_PATH)
        else:
            # Tentar path alternativo
            alt_path = os.path.join(project_root, 'data', 'Roteiro de Dsispensação - Hanseníase.md')
            if os.path.exists(alt_path):
                md_text = extract_md_text(alt_path)
            else:
                logger.warning("Arquivo de conhecimento não encontrado")
                md_text = "Base de conhecimento não disponível"
    except Exception as e:
        logger.error(f"Erro ao carregar base de conhecimento: {e}")
        md_text = "Erro ao carregar base de conhecimento"
    
    logger.info("Aplicação inicializada para Vercel")

# Inicializar na importação
init_app()

# Para desenvolvimento local
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)

# Exportar app para Vercel
# O Vercel procura por uma variável chamada 'app' ou função handler
handler = app