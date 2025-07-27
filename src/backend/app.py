from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import os
import re
import logging
from datetime import datetime, timedelta
import requests
import json
from collections import defaultdict
import threading
import time

# Importar sistemas otimizados
from services.dr_gasnelio_enhanced import get_enhanced_dr_gasnelio_prompt, validate_dr_gasnelio_response
from services.ga_enhanced import get_enhanced_ga_prompt, validate_ga_response
from services.scope_detection_system import detect_question_scope, get_limitation_response
from services.personas import get_personas, get_persona_prompt

app = Flask(__name__)
CORS(app)

# Configuração avançada de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('logs/backend.log', mode='a') if os.path.exists('logs') else logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Rate Limiting System
class SimpleRateLimiter:
    """Sistema simples de rate limiting em memória"""
    
    def __init__(self):
        self.requests = defaultdict(list)
        self.lock = threading.Lock()
        
        # Configurações de rate limiting
        self.limits = {
            'chat': {'max_requests': 30, 'window_minutes': 1},      # 30 req/min para chat
            'general': {'max_requests': 100, 'window_minutes': 1},   # 100 req/min para outros endpoints
            'scope': {'max_requests': 60, 'window_minutes': 1}       # 60 req/min para scope
        }
        
        # Thread para limpeza periódica
        self.cleanup_thread = threading.Thread(target=self._cleanup_old_requests, daemon=True)
        self.cleanup_thread.start()
    
    def is_allowed(self, client_ip: str, endpoint_type: str = 'general') -> tuple[bool, dict]:
        """
        Verifica se requisição é permitida
        
        Returns:
            (is_allowed, info_dict)
        """
        with self.lock:
            now = datetime.now()
            endpoint_limit = self.limits.get(endpoint_type, self.limits['general'])
            window_start = now - timedelta(minutes=endpoint_limit['window_minutes'])
            
            # Chave única por IP e tipo de endpoint
            key = f"{client_ip}:{endpoint_type}"
            
            # Remover requisições antigas
            self.requests[key] = [req_time for req_time in self.requests[key] if req_time > window_start]
            
            # Verificar limite
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
    
    def _cleanup_old_requests(self):
        """Limpeza periódica de requisições antigas"""
        while True:
            time.sleep(300)  # Limpeza a cada 5 minutos
            with self.lock:
                now = datetime.now()
                for key in list(self.requests.keys()):
                    # Manter apenas requisições da última hora
                    cutoff = now - timedelta(hours=1)
                    self.requests[key] = [req_time for req_time in self.requests[key] if req_time > cutoff]
                    
                    # Remover chaves vazias
                    if not self.requests[key]:
                        del self.requests[key]

# Instância global do rate limiter
rate_limiter = SimpleRateLimiter()

def check_rate_limit(endpoint_type: str = 'general'):
    """Decorator para verificar rate limiting"""
    def decorator(f):
        def wrapper(*args, **kwargs):
            client_ip = request.remote_addr or 'unknown'
            is_allowed, rate_info = rate_limiter.is_allowed(client_ip, endpoint_type)
            
            if not is_allowed:
                logger.warning(f"Rate limit excedido para {client_ip} no endpoint {endpoint_type}")
                return jsonify({
                    "error": "Rate limit excedido. Tente novamente em alguns instantes.",
                    "error_code": "RATE_LIMIT_EXCEEDED",
                    "rate_limit_info": rate_info,
                    "timestamp": datetime.now().isoformat()
                }), 429
            
            # Adicionar informações de rate limit no header da resposta
            response = f(*args, **kwargs)
            if hasattr(response, 'headers'):
                response.headers['X-RateLimit-Limit'] = str(rate_info['limit'])
                response.headers['X-RateLimit-Remaining'] = str(rate_info['limit'] - rate_info['current_count'])
                response.headers['X-RateLimit-Reset'] = rate_info['reset_time']
            
            return response
        wrapper.__name__ = f.__name__
        return wrapper
    return decorator

# Variáveis globais
MD_PATH = 'PDFs/Roteiro de Dsispensação - Hanseníase.md'
md_text = ""

# Usar personas do sistema otimizado
PERSONAS = get_personas()

def extract_md_text(md_path):
    """Extrai texto do arquivo Markdown"""
    global md_text
    try:
        with open(md_path, 'r', encoding='utf-8') as file:
            text = file.read()
        logger.info(f"Arquivo Markdown extraído com sucesso. Total de caracteres: {len(text)}")
        return text
    except Exception as e:
        logger.error(f"Erro ao extrair arquivo Markdown: {e}")
        return ""

def find_relevant_context(question, full_text, max_length=3000):
    """Encontra o contexto mais relevante para a pergunta usando busca simples"""
    # Divide o texto em parágrafos
    paragraphs = full_text.split('\n\n')
    
    # Busca por palavras-chave na pergunta
    question_words = set(re.findall(r'\w+', question.lower()))
    
    best_paragraphs = []
    best_score = 0
    
    for paragraph in paragraphs:
        if len(paragraph.strip()) < 50:  # Ignora parágrafos muito pequenos
            continue
            
        paragraph_words = set(re.findall(r'\w+', paragraph.lower()))
        common_words = question_words.intersection(paragraph_words)
        score = len(common_words) / len(question_words) if question_words else 0
        
        if score > 0.1:  # Se há pelo menos 10% de palavras em comum
            best_paragraphs.append((paragraph, score))
    
    # Ordena por relevância e pega os melhores
    best_paragraphs.sort(key=lambda x: x[1], reverse=True)
    
    context = ""
    for paragraph, score in best_paragraphs[:3]:  # Pega os 3 parágrafos mais relevantes
        context += paragraph + "\n\n"
        if len(context) > max_length:
            break
    
    return context[:max_length] if context else full_text[:max_length]

def get_free_ai_response(question, persona, context):
    """Obtém resposta de modelo AI gratuito via API pública com sistema otimizado"""
    try:
        # Para Dr. Gasnelio, usar sistema otimizado
        if persona == "dr_gasnelio":
            # Obter prompt otimizado
            optimized_prompt = get_enhanced_dr_gasnelio_prompt(question)
            full_prompt = f"""{optimized_prompt}

Contexto da tese sobre roteiro de dispensação para hanseníase:
{context}

Pergunta do usuário: {question}

Responda seguindo RIGOROSAMENTE o formato técnico estruturado:"""
        elif persona == "ga":
            # Para Gá, usar sistema otimizado empático
            optimized_prompt = get_enhanced_ga_prompt(question)
            full_prompt = f"""{optimized_prompt}

Contexto da tese sobre roteiro de dispensação para hanseníase:
{context}

Responda seguindo seu jeito carinhoso e acessível, sempre lembrando que você está falando com uma pessoa que pode estar preocupada ou confusa sobre o tratamento:"""
        else:
            # Fallback para outras personas
            persona_config = PERSONAS[persona]
            system_prompt = persona_config.get("system_prompt", "")
            full_prompt = f"""Contexto da tese sobre roteiro de dispensação para hanseníase:
{context}

{system_prompt}

Pergunta do usuário: {question}

Responda de acordo com o estilo da persona {persona_config['name']}:"""

        # Usando API gratuita do Hugging Face (exemplo com modelo de texto)
        api_url = "https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium"
        
        headers = {
            "Authorization": "Bearer hf_xxx",  # Token gratuito do Hugging Face
            "Content-Type": "application/json"
        }
        
        payload = {
            "inputs": full_prompt,
            "parameters": {
                "max_length": 500,
                "temperature": 0.7,
                "do_sample": True
            }
        }
        
        response = requests.post(api_url, headers=headers, json=payload, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            if isinstance(result, list) and len(result) > 0:
                ai_response = result[0].get('generated_text', '').replace(full_prompt, '').strip()
            elif isinstance(result, dict):
                ai_response = result.get('generated_text', '').replace(full_prompt, '').strip()
            else:
                ai_response = ""
            
            # Validar qualidade das respostas otimizadas
            if persona == "dr_gasnelio" and ai_response:
                validation_result = validate_dr_gasnelio_response(ai_response, question)
                logger.info(f"Qualidade da resposta Dr. Gasnelio: {validation_result['quality_score']:.1f}%")
                
                # Se qualidade muito baixa, usar fallback
                if validation_result['quality_score'] < 50:
                    logger.warning("Qualidade baixa detectada, usando fallback")
                    return generate_rule_based_response(question, persona, context)
            
            elif persona == "ga" and ai_response:
                validation_result = validate_ga_response(ai_response, question)
                logger.info(f"Score de empatia do Gá: {validation_result['empathy_score']:.1f}%")
                
                # Se empatia muito baixa, usar fallback
                if validation_result['empathy_score'] < 60:
                    logger.warning("Empatia baixa detectada, usando fallback")
                    return generate_rule_based_response(question, persona, context)
            
            return ai_response if ai_response else generate_rule_based_response(question, persona, context)
        
        # Fallback: resposta baseada em regras
        return generate_rule_based_response(question, persona, context)
        
    except Exception as e:
        logger.error(f"Erro ao obter resposta da API: {e}")
        return generate_rule_based_response(question, persona, context)

def generate_rule_based_response(question, persona, context):
    """Gera resposta baseada em regras quando a API não está disponível"""
    persona_config = PERSONAS[persona]
    
    # Busca por palavras-chave na pergunta
    question_lower = question.lower()
    
    # Mapeamento de palavras-chave para respostas
    keyword_responses = {
        "hanseníase": {
            "dr_gasnelio": "A hanseníase é uma doença infecciosa crônica causada pelo Mycobacterium leprae. O roteiro de dispensação para hanseníase visa padronizar o processo de entrega de medicamentos, garantindo segurança e adesão ao tratamento.",
            "ga": "A hanseníase é uma doença de pele que precisa de tratamento especial. O roteiro que criamos ajuda a farmácia a entregar os remédios do jeito certo, explicando tudo direitinho para a pessoa que está tratando! 😊"
        },
        "dispensação": {
            "dr_gasnelio": "A dispensação é o processo de entrega de medicamentos ao paciente, acompanhada de orientações farmacêuticas. O roteiro proposto estrutura este processo de forma sistemática, garantindo que todas as informações essenciais sejam transmitidas.",
            "ga": "Dispensação é quando a farmácia entrega o remédio para você e explica como tomar. Nosso roteiro é tipo um checklist que garante que você saia da farmácia sabendo tudo que precisa! 👍"
        },
        "medicamento": {
            "dr_gasnelio": "Os medicamentos para hanseníase incluem principalmente a poliquimioterapia (PQT), que combina diferentes fármacos para tratamento eficaz. O roteiro de dispensação orienta sobre posologia, efeitos adversos e interações.",
            "ga": "Os remédios para hanseníase são especiais e precisam ser tomados do jeito certo. O roteiro ajuda a farmácia a explicar como tomar, quando tomar e o que fazer se der algum efeito colateral! 💊"
        },
        "tratamento": {
            "dr_gasnelio": "O tratamento da hanseníase segue protocolos estabelecidos pelo Ministério da Saúde, utilizando poliquimioterapia. A adesão ao tratamento é crucial para o sucesso terapêutico e prevenção de resistência.",
            "ga": "O tratamento da hanseníase é importante seguir direitinho! O roteiro ajuda a pessoa a entender por que precisa tomar os remédios, por quanto tempo e o que esperar durante o tratamento! 🌟"
        }
    }
    
    # Procura por palavras-chave na pergunta
    for keyword, responses in keyword_responses.items():
        if keyword in question_lower:
            return responses[persona]
    
    # Se não encontrou palavra-chave específica, retorna resposta genérica
    if persona == "dr_gasnelio":
        return f"Baseado na minha pesquisa sobre roteiro de dispensação para hanseníase, posso fornecer informações técnicas sobre o processo de entrega de medicamentos e orientação farmacêutica. Sua pergunta sobre '{question}' pode ser respondida consultando a tese completa."
    else:
        return f"Oi! Sobre sua pergunta sobre '{question}', posso te ajudar com informações sobre o roteiro de dispensação! É um guia que ajuda a farmácia a explicar tudo direitinho sobre os remédios. 😊"

def format_persona_answer(answer, persona, confidence=0.8):
    """Formata a resposta de acordo com a personalidade"""
    persona_config = PERSONAS[persona]
    
    if persona == "dr_gasnelio":
        return {
            "answer": (
                f"Dr. Gasnelio responde:\n\n"
                f"{answer}\n\n"
                f"*Baseado na tese sobre roteiro de dispensação para hanseníase. "
                f"Para informações mais detalhadas, recomendo consultar a seção completa da pesquisa.*"
            ),
            "persona": "dr_gasnelio",
            "confidence": confidence,
            "name": persona_config["name"]
        }
    elif persona == "ga":
        return {
            "answer": (
                f"Oi! Aqui é o Gá! 😊\n\n"
                f"{answer}\n\n"
                f"*Essa explicação veio direto da tese, mas falei do meu jeito pra facilitar! "
                f"Se quiser saber mais alguma coisa, é só perguntar!*"
            ),
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
    """Responde à pergunta usando o sistema de IA com detecção de escopo"""
    global md_text
    
    if not md_text:
        return format_persona_answer(
            "Desculpe, a base de conhecimento não está disponível no momento.", 
            persona, 
            0.0
        )
    
    try:
        # NOVA FUNCIONALIDADE: Detectar escopo da pergunta
        scope_analysis = detect_question_scope(question)
        logger.info(f"Análise de escopo - No escopo: {scope_analysis['is_in_scope']}, Categoria: {scope_analysis['category']}")
        
        # Se pergunta está fora do escopo, retornar resposta de limitação
        if not scope_analysis['is_in_scope']:
            limitation_response = get_limitation_response(persona, question)
            if limitation_response:
                return format_persona_answer(limitation_response, persona, 0.9)
        
        # Se está no escopo, continuar processamento normal
        # Encontra contexto relevante
        context = find_relevant_context(question, md_text)
        
        # Obtém resposta da IA
        ai_response = get_free_ai_response(question, persona, context)
        
        if not ai_response:
            # Fallback para resposta baseada em regras
            ai_response = generate_rule_based_response(question, persona, context)
        
        # Adicionar informação de confiança baseada na análise de escopo
        confidence = 0.8
        if scope_analysis['confidence_level'] == 'high':
            confidence = 0.9
        elif scope_analysis['confidence_level'] == 'low':
            confidence = 0.6
        
        return format_persona_answer(ai_response, persona, confidence)
        
    except Exception as e:
        logger.error(f"Erro ao processar pergunta: {e}")
        return format_persona_answer(
            "Desculpe, ocorreu um erro técnico ao processar sua pergunta. Tente novamente.", 
            persona, 
            0.0
        )

@app.route('/')
def index():
    """Página principal"""
    return render_template('index.html')

@app.route('/tese')
def tese():
    return render_template('tese.html')

@app.route('/script.js')
def serve_script():
    """Serve o arquivo script.js"""
    return app.send_static_file('script.js')

@app.route('/tese.js')
def serve_tese_script():
    """Serve o arquivo tese.js"""
    return app.send_static_file('tese.js')

@app.route('/api/chat', methods=['POST'])
@check_rate_limit('chat')
def chat_api():
    """Endpoint principal para interação com chatbot - Otimizado com validações robustas"""
    start_time = datetime.now()
    request_id = f"req_{int(start_time.timestamp() * 1000)}"
    
    try:
        # Log da requisição
        logger.info(f"[{request_id}] Nova requisição de chat recebida de {request.remote_addr}")
        
        # Validação de Content-Type
        if not request.is_json:
            logger.warning(f"[{request_id}] Content-Type inválido: {request.content_type}")
            return jsonify({
                "error": "Content-Type deve ser application/json",
                "error_code": "INVALID_CONTENT_TYPE",
                "request_id": request_id
            }), 400

        # Validação de JSON
        try:
            data = request.get_json(force=True)
        except Exception as json_error:
            logger.warning(f"[{request_id}] JSON mal formado: {json_error}")
            return jsonify({
                "error": "JSON mal formado ou inválido",
                "error_code": "INVALID_JSON",
                "request_id": request_id
            }), 400

        if not data or not isinstance(data, dict):
            logger.warning(f"[{request_id}] Payload vazio ou tipo incorreto")
            return jsonify({
                "error": "Payload deve ser um objeto JSON não vazio",
                "error_code": "EMPTY_PAYLOAD",
                "request_id": request_id
            }), 400

        # Validação e sanitização da pergunta
        question = data.get('question', '').strip()
        if not question:
            logger.warning(f"[{request_id}] Pergunta vazia")
            return jsonify({
                "error": "Campo 'question' é obrigatório e não pode estar vazio",
                "error_code": "MISSING_QUESTION",
                "request_id": request_id
            }), 400
        
        # Validação de tamanho da pergunta
        if len(question) > 1000:
            logger.warning(f"[{request_id}] Pergunta muito longa: {len(question)} caracteres")
            return jsonify({
                "error": "Pergunta muito longa (máximo 1000 caracteres)",
                "error_code": "QUESTION_TOO_LONG",
                "request_id": request_id,
                "max_length": 1000,
                "current_length": len(question)
            }), 400

        # Validação da persona
        personality_id = data.get('personality_id', '').strip().lower()
        valid_personas = ['dr_gasnelio', 'ga']
        if not personality_id or personality_id not in valid_personas:
            logger.warning(f"[{request_id}] Persona inválida: {personality_id}")
            return jsonify({
                "error": "Campo 'personality_id' deve ser um dos valores válidos",
                "error_code": "INVALID_PERSONA",
                "request_id": request_id,
                "valid_personas": valid_personas,
                "received": personality_id
            }), 400

        # Sanitização adicional - remover caracteres potencialmente perigosos
        question = re.sub(r'[<>"\']', '', question)
        
        # Log dos parâmetros validados
        logger.info(f"[{request_id}] Parâmetros válidos - Persona: {personality_id}, Pergunta: {len(question)} chars")
        
        # Processar pergunta
        logger.info(f"[{request_id}] Iniciando processamento da pergunta")
        response = answer_question(question, personality_id)
        
        # Adicionar metadados da resposta
        response.update({
            "request_id": request_id,
            "processing_time_ms": int((datetime.now() - start_time).total_seconds() * 1000),
            "timestamp": datetime.now().isoformat(),
            "api_version": "8.0.0"
        })
        
        # Log de sucesso
        processing_time = (datetime.now() - start_time).total_seconds() * 1000
        logger.info(f"[{request_id}] Resposta gerada com sucesso - Tempo: {processing_time:.1f}ms, Confiança: {response.get('confidence', 'N/A')}")
        
        return jsonify(response), 200

    except Exception as e:
        # Log detalhado do erro
        processing_time = (datetime.now() - start_time).total_seconds() * 1000
        logger.error(f"[{request_id}] Erro crítico na API de chat: {str(e)}, Tempo: {processing_time:.1f}ms", exc_info=True)
        
        return jsonify({
            "error": "Erro interno do servidor. Tente novamente em alguns instantes.",
            "error_code": "INTERNAL_SERVER_ERROR",
            "request_id": request_id,
            "timestamp": datetime.now().isoformat()
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Verificação de saúde da API"""
    return jsonify({
        "status": "healthy",
        "pdf_loaded": len(md_text) > 0,
        "timestamp": datetime.now().isoformat(),
        "personas": list(PERSONAS.keys())
    })

@app.route('/api/info', methods=['GET'])
def api_info():
    """Informações sobre a API"""
    return jsonify({
        "name": "Chatbot Tese Hanseníase API v8 - Sistema Completo com Detecção de Escopo",
        "version": "8.0.0",
        "description": "API para chatbot baseado na tese sobre roteiro de dispensação para hanseníase com personas otimizadas e sistema inteligente de detecção de limitações",
        "personas": {
            "dr_gasnelio": "Farmacêutico clínico especialista em hanseníase PQT-U com validação técnica e respostas de limitação profissionais",
            "ga": "Farmacêutico empático que explica de forma simples com respostas carinhosas para limitações"
        },
        "model": "Enhanced Personas + Scope Detection + Rule-based + Free AI API",
        "pdf_source": "Roteiro de Dispensação para Hanseníase",
        "enhancements": {
            "dr_gasnelio": {
                "technical_validation": True,
                "citation_system": True,
                "scope_detection": True,
                "quality_scoring": True,
                "limitation_responses": True
            },
            "ga": {
                "empathy_validation": True,
                "technical_translation": True,
                "analogies_system": True,
                "scope_detection": True,
                "limitation_responses": True
            },
            "system": {
                "automatic_scope_detection": True,
                "intelligent_redirection": True,
                "confidence_scoring": True,
                "category_classification": True
            }
        }
    })

@app.route('/api/personas', methods=['GET'])
@check_rate_limit('general')
def get_personas_api():
    """Endpoint otimizado para informações completas das personas"""
    try:
        request_id = f"personas_{int(datetime.now().timestamp() * 1000)}"
        logger.info(f"[{request_id}] Solicitação de informações das personas")
        
        # Obter personas com informações completas
        personas_data = get_personas()
        
        # Enriquecer com metadados adicionais
        enriched_personas = {}
        for persona_id, persona_info in personas_data.items():
            enriched_personas[persona_id] = {
                **persona_info,
                "capabilities": get_persona_capabilities(persona_id),
                "example_questions": get_persona_examples(persona_id),
                "limitations": get_persona_limitations(persona_id),
                "response_format": get_persona_response_format(persona_id)
            }
        
        response = {
            "personas": enriched_personas,
            "metadata": {
                "total_personas": len(enriched_personas),
                "available_persona_ids": list(enriched_personas.keys()),
                "api_version": "8.0.0",
                "last_updated": "2025-01-27",
                "request_id": request_id,
                "timestamp": datetime.now().isoformat()
            },
            "usage_guide": {
                "endpoint": "/api/chat",
                "required_fields": ["question", "personality_id"],
                "example_request": {
                    "question": "Qual a dose de rifampicina para adultos?",
                    "personality_id": "dr_gasnelio"
                }
            }
        }
        
        logger.info(f"[{request_id}] Informações das personas retornadas com sucesso")
        return jsonify(response), 200
        
    except Exception as e:
        logger.error(f"Erro ao obter informações das personas: {e}", exc_info=True)
        return jsonify({
            "error": "Erro ao carregar informações das personas",
            "error_code": "PERSONAS_LOAD_ERROR",
            "timestamp": datetime.now().isoformat()
        }), 500

def get_persona_capabilities(persona_id: str) -> list:
    """Retorna capacidades específicas de cada persona"""
    capabilities = {
        "dr_gasnelio": [
            "Respostas técnicas com citações da tese",
            "Validação farmacológica de dosagens",
            "Detecção automática de limitações de escopo",
            "Orientações profissionais especializadas",
            "Referências científicas obrigatórias",
            "Formatação estruturada de respostas técnicas"
        ],
        "ga": [
            "Tradução automática de termos técnicos",
            "Comunicação empática e acolhedora",
            "Analogias e exemplos cotidianos",
            "Suporte emocional apropriado",
            "Linguagem simplificada sem perda de precisão",
            "Detecção de necessidades de apoio psicológico"
        ]
    }
    return capabilities.get(persona_id, [])

def get_persona_examples(persona_id: str) -> list:
    """Retorna exemplos de perguntas apropriadas para cada persona"""
    examples = {
        "dr_gasnelio": [
            "Qual a dose supervisionada de rifampicina para pacientes entre 30-50kg?",
            "Quais são as contraindicações da clofazimina durante a gravidez?",
            "Como proceder no caso de hepatotoxicidade pela rifampicina?",
            "Qual o protocolo de monitorização para dapsona em pacientes com deficiência G6PD?"
        ],
        "ga": [
            "Por que meu xixi ficou laranja depois de tomar o remédio?",
            "É normal a pele escurecer com a clofazimina?",
            "Posso tomar os remédios junto com a comida?",
            "O que fazer se esquecer de tomar uma dose?"
        ]
    }
    return examples.get(persona_id, [])

def get_persona_limitations(persona_id: str) -> dict:
    """Retorna limitações conhecidas de cada persona"""
    return {
        "scope": "Exclusivamente hanseníase PQT-U conforme tese de referência",
        "not_covered": [
            "Diagnóstico de hanseníase",
            "Outras doenças ou medicamentos",
            "Questões legais ou administrativas",
            "Emergências médicas",
            "Esquemas alternativos de tratamento"
        ],
        "redirects_to": {
            "diagnosis": "médico especialista em hanseníase",
            "emergencies": "atendimento médico imediato",
            "legal_issues": "assistente social ou órgão competente",
            "other_diseases": "médico especialista na condição específica"
        }
    }

def get_persona_response_format(persona_id: str) -> dict:
    """Retorna formato esperado de resposta de cada persona"""
    formats = {
        "dr_gasnelio": {
            "structure": [
                "[RESPOSTA TÉCNICA] - Informação científica precisa",
                "[PROTOCOLO/REFERÊNCIA] - Citação da tese e protocolo",
                "[VALIDAÇÃO FARMACOLÓGICA] - Mecanismo e monitorização"
            ],
            "tone": "Técnico, científico, objetivo",
            "citations": "Obrigatórias com seção específica da tese",
            "terminology": "Terminologia técnica precisa"
        },
        "ga": {
            "structure": [
                "[ACOLHIMENTO] - Cumprimento caloroso",
                "[EXPLICAÇÃO SIMPLES] - Tradução para linguagem cotidiana",
                "[APOIO PRÁTICO] - Orientações práticas",
                "[ENCORAJAMENTO] - Palavras de apoio"
            ],
            "tone": "Empático, acolhedor, simples",
            "translations": "Termos técnicos sempre traduzidos",
            "support": "Elementos de apoio emocional incluídos"
        }
    }
    return formats.get(persona_id, {})

@app.route('/api/scope', methods=['GET', 'POST'])
@check_rate_limit('scope')
def scope_verification_api():
    """Endpoint para verificação de escopo e tópicos cobertos"""
    try:
        request_id = f"scope_{int(datetime.now().timestamp() * 1000)}"
        
        if request.method == 'GET':
            # Retorna informações sobre o escopo completo
            logger.info(f"[{request_id}] Solicitação de informações do escopo")
            
            scope_info = {
                "knowledge_scope": {
                    "primary_focus": "Hanseníase PQT-U (Poliquimioterapia Única)",
                    "source": "Tese de doutorado - Roteiro de Dispensação para Hanseníase",
                    "covered_topics": {
                        "medications": [
                            "Rifampicina (doses, administração, efeitos adversos)",
                            "Clofazimina (doses, administração, hiperpigmentação)",
                            "Dapsona (doses, administração, deficiência G6PD)"
                        ],
                        "protocols": [
                            "Esquema PQT-U para todas as populações",
                            "Doses supervisionadas e autoadministradas",
                            "Cálculo de doses pediátricas",
                            "Duração de tratamento (12 meses)"
                        ],
                        "dispensing": [
                            "Roteiro de dispensação farmacêutica",
                            "Verificação de prescrições",
                            "Orientações ao paciente",
                            "Monitoramento pós-dispensação"
                        ],
                        "safety": [
                            "Farmácovigilância específica PQT-U",
                            "Eventos adversos documentados",
                            "Contraindicações e precauções",
                            "Populações especiais (gravidez, pediatria)"
                        ]
                    },
                    "explicitly_not_covered": [
                        "Diagnóstico de hanseníase",
                        "Outras doenças ou tratamentos",
                        "Aspectos legais ou administrativos",
                        "Esquemas alternativos (PQT-MB, PQT-PB)",
                        "Estados reacionais e seu tratamento"
                    ]
                },
                "confidence_levels": {
                    "high": "Protocolos PQT-U padrão, doses, efeitos adversos comuns",
                    "medium": "Variações populacionais, casos especiais documentados",
                    "low": "Situações não explicitamente abordadas na tese"
                },
                "metadata": {
                    "api_version": "8.0.0",
                    "last_updated": "2025-01-27",
                    "request_id": request_id,
                    "timestamp": datetime.now().isoformat()
                }
            }
            
            logger.info(f"[{request_id}] Informações do escopo retornadas")
            return jsonify(scope_info), 200
            
        elif request.method == 'POST':
            # Verifica se uma pergunta específica está no escopo
            logger.info(f"[{request_id}] Verificação de escopo para pergunta específica")
            
            # Validações de entrada
            if not request.is_json:
                return jsonify({
                    "error": "Content-Type deve ser application/json",
                    "error_code": "INVALID_CONTENT_TYPE",
                    "request_id": request_id
                }), 400
            
            data = request.get_json()
            if not data or 'question' not in data:
                return jsonify({
                    "error": "Campo 'question' é obrigatório",
                    "error_code": "MISSING_QUESTION",
                    "request_id": request_id
                }), 400
            
            question = data['question'].strip()
            if not question:
                return jsonify({
                    "error": "Pergunta não pode estar vazia",
                    "error_code": "EMPTY_QUESTION", 
                    "request_id": request_id
                }), 400
            
            # Analisar escopo da pergunta
            scope_analysis = detect_question_scope(question)
            
            response = {
                "question": question,
                "analysis": {
                    "is_in_scope": scope_analysis["is_in_scope"],
                    "confidence_level": scope_analysis["confidence_level"],
                    "category": scope_analysis["category"],
                    "scope_score": scope_analysis["scope_score"],
                    "reasoning": scope_analysis["reasoning"]
                },
                "recommendation": {
                    "can_answer": scope_analysis["is_in_scope"],
                    "suggested_persona": "dr_gasnelio" if scope_analysis["category"] in ["medication_inquiry", "safety_inquiry"] else "ga",
                    "redirect_suggestion": scope_analysis.get("redirect_suggestion"),
                    "confidence_explanation": get_confidence_explanation(scope_analysis["confidence_level"])
                },
                "metadata": {
                    "request_id": request_id,
                    "timestamp": datetime.now().isoformat(),
                    "api_version": "8.0.0"
                }
            }
            
            logger.info(f"[{request_id}] Análise de escopo concluída - No escopo: {scope_analysis['is_in_scope']}")
            return jsonify(response), 200
            
    except Exception as e:
        logger.error(f"[{request_id}] Erro na verificação de escopo: {e}", exc_info=True)
        return jsonify({
            "error": "Erro interno na verificação de escopo",
            "error_code": "SCOPE_VERIFICATION_ERROR",
            "request_id": request_id,
            "timestamp": datetime.now().isoformat()
        }), 500

def get_confidence_explanation(confidence_level: str) -> str:
    """Retorna explicação dos níveis de confiança"""
    explanations = {
        "high": "Tópico amplamente coberto na tese com informações detalhadas e precisas",
        "medium": "Tópico parcialmente coberto, pode requerer orientações adicionais",
        "low": "Tópico com cobertura limitada ou situação não explicitamente abordada"
    }
    return explanations.get(confidence_level, "Nível de confiança não determinado")

if __name__ == '__main__':
    # Inicialização
    logger.info("Iniciando aplicação v6...")
    
    # Carrega o PDF
    if os.path.exists(MD_PATH):
        md_text = extract_md_text(MD_PATH)
    else:
        logger.warning(f"Arquivo Markdown não encontrado: {MD_PATH}")
        md_text = "Arquivo Markdown não disponível"
    
    # Inicia o servidor
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    
    logger.info(f"Servidor iniciado na porta {port}")
    logger.info(f"Personas disponíveis: {list(PERSONAS.keys())}")
    app.run(host='0.0.0.0', port=port, debug=debug) 