from flask import Flask, jsonify, request
from flask_cors import CORS
import re
import html
import logging
import os
from datetime import datetime, timedelta
from collections import defaultdict
import bleach

app = Flask(__name__)

# Configuração CORS otimizada para Vercel
allowed_origins = [
    "https://siteroteirodedispersacao.vercel.app",
    "https://*.vercel.app", 
    "http://localhost:3000",
    "http://127.0.0.1:3000"
]

# Detecção automática do ambiente Vercel
vercel_env = os.environ.get('VERCEL_ENV')
if vercel_env == 'production':
    allowed_origins = ["https://siteroteirodedispersacao.vercel.app"]
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
        "connect-src 'self' https://api-inference.huggingface.co"
    )
    
    response.headers.pop('Server', None)
    return response

# Configuração de logging otimizada para Vercel
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Rate Limiting otimizado para serverless
class VercelRateLimiter:
    """Rate limiter otimizado para ambiente serverless"""
    
    def __init__(self):
        self.requests = defaultdict(list)
        self.limits = {
            'chat': {'max_requests': 30, 'window_minutes': 1},
            'general': {'max_requests': 60, 'window_minutes': 1},
            'interactions': {'max_requests': 20, 'window_minutes': 1}
        }
    
    def is_allowed(self, client_ip: str, endpoint_type: str = 'general') -> tuple[bool, dict]:
        """Verificação avançada de rate limiting"""
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

# Configuração de paths para base de conhecimento
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
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

def check_rate_limit_advanced(endpoint_type: str = 'general'):
    """Decorator avançado para verificar rate limiting"""
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

@app.route('/', methods=['GET', 'POST', 'OPTIONS'])
@app.route('/health', methods=['GET', 'POST', 'OPTIONS'])
@app.route('/<path:path>', methods=['GET', 'POST', 'OPTIONS'])
def handle_all(path=None):
    """Handle all routes"""
    
    # Handle CORS preflight
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    
    # Health check
    if request.path.endswith('/health') or path == 'health':
        return jsonify({
            "status": "healthy",
            "platform": "vercel",
            "version": "9.0.0",
            "knowledge_base_loaded": len(md_text) > 100,
            "knowledge_base_size": len(md_text),
            "timestamp": datetime.now().isoformat(),
            "features": {
                "advanced_rate_limiting": True,
                "input_validation": True,
                "drug_interactions": True,
                "context_aware_responses": True,
                "security_headers": True
            }
        })
    
    # Personas endpoint
    if request.path.endswith('/personas') or path == 'personas':
        return jsonify({
            "personas": {
                "dr_gasnelio": {
                    "name": "Dr. Gasnelio",
                    "description": "Farmacêutico clínico especialista em hanseníase",
                    "avatar": "👨‍⚕️",
                    "personality": "técnico e preciso"
                },
                "ga": {
                    "name": "Gá", 
                    "description": "Farmacêutico empático e acessível",
                    "avatar": "😊",
                    "personality": "empático e didático"
                }
            },
            "metadata": {
                "total_personas": 2,
                "available_persona_ids": ["dr_gasnelio", "ga"],
                "api_version": "9.0.0",
                "platform": "vercel",
                "timestamp": "2025-01-28"
            }
        })
    
    # Chat endpoint
    if request.path.endswith('/chat') or path == 'chat':
        if request.method == 'POST':
            try:
                # Rate limiting avançado
                client_ip = request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr) or 'unknown'
                is_allowed, rate_info = rate_limiter.is_allowed(client_ip, 'chat')
                
                if not is_allowed:
                    logger.warning(f"Rate limit excedido para {client_ip} no endpoint chat")
                    return jsonify({
                        "error": "Rate limit excedido. Tente novamente em alguns instantes.",
                        "error_code": "RATE_LIMIT_EXCEEDED",
                        "rate_limit_info": rate_info,
                        "timestamp": datetime.now().isoformat()
                    }), 429
                
                data = request.get_json()
                if not data:
                    return jsonify({"error": "JSON payload required"}), 400
                
                question = data.get('question', '').strip()
                personality_id = data.get('personality_id', '').strip().lower()
                
                # Validação básica
                if not question:
                    return jsonify({"error": "Campo 'question' é obrigatório"}), 400
                
                if personality_id not in ['dr_gasnelio', 'ga']:
                    return jsonify({"error": "personality_id deve ser 'dr_gasnelio' ou 'ga'"}), 400
                
                # Validação e sanitização avançada
                try:
                    question = validate_and_sanitize_input(question)
                except ValueError as e:
                    return jsonify({
                        "error": f"Input inválido: {str(e)}",
                        "error_code": "INVALID_INPUT",
                        "timestamp": datetime.now().isoformat()
                    }), 400
                
                if len(question) > 1000:
                    return jsonify({"error": "Pergunta muito longa (máximo 1000 caracteres)"}), 400
                
                # Resposta baseada em regras e contexto
                response = generate_enhanced_response(question, personality_id)
                
                return jsonify({
                    "answer": response["answer"],
                    "persona": personality_id,
                    "confidence": 0.8,
                    "name": response["name"],
                    "timestamp": "2025-01-28",
                    "api_version": "9.0.0"
                })
                
            except Exception as e:
                return jsonify({"error": "Erro interno do servidor"}), 500
        else:
            return jsonify({"error": "Método POST requerido"}), 405
    
    # Drug interactions endpoint with advanced rate limiting
    if request.path.endswith('/interactions') or path == 'interactions':
        if request.method == 'POST':
            try:
                # Rate limiting avançado
                client_ip = request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr) or 'unknown'
                is_allowed, rate_info = rate_limiter.is_allowed(client_ip, 'interactions')
                
                if not is_allowed:
                    logger.warning(f"Rate limit excedido para {client_ip} no endpoint interactions")
                    return jsonify({
                        "error": "Rate limit excedido. Tente novamente em alguns instantes.",
                        "error_code": "RATE_LIMIT_EXCEEDED",
                        "rate_limit_info": rate_info,
                        "timestamp": datetime.now().isoformat()
                    }), 429
                
                data = request.get_json()
                if not data:
                    return jsonify({"error": "JSON payload required"}), 400
                
                medications = data.get('medications', [])
                if not medications or not isinstance(medications, list):
                    return jsonify({"error": "Lista de medicamentos obrigatória"}), 400
                
                # Validar e sanitizar medicamentos
                sanitized_medications = []
                for med in medications:
                    if isinstance(med, str) and med.strip():
                        try:
                            sanitized_med = validate_and_sanitize_input(med.strip())
                            sanitized_medications.append(sanitized_med)
                        except ValueError:
                            continue
                
                if not sanitized_medications:
                    return jsonify({"error": "Nenhum medicamento válido fornecido"}), 400
                
                interactions = check_drug_interactions(sanitized_medications)
                
                response = jsonify({
                    "medications_checked": sanitized_medications,
                    "interactions_found": len(interactions),
                    "interactions": interactions,
                    "timestamp": datetime.now().isoformat(),
                    "api_version": "9.0.0"
                })
                
                # Adicionar headers de rate limiting
                response.headers['X-RateLimit-Limit'] = str(rate_info['limit'])
                response.headers['X-RateLimit-Remaining'] = str(rate_info['limit'] - rate_info['current_count'])
                response.headers['X-RateLimit-Reset'] = rate_info['reset_time']
                
                return response
                
            except Exception as e:
                logger.error(f"Erro no endpoint interactions: {e}")
                return jsonify({"error": "Erro interno do servidor"}), 500
        else:
            return jsonify({"error": "Método POST requerido"}), 405
    
    # Default response
    return jsonify({
        "message": "Roteiro de Dispensação API - Vercel",
        "version": "9.0.0", 
        "status": "online",
        "endpoints": {
            "health": "/api/health",
            "personas": "/api/personas",
            "chat": "/api/chat (POST)",
            "interactions": "/api/interactions (POST)"
        },
        "path_requested": request.path
    })

def generate_enhanced_response(question, persona):
    """Gera resposta baseada em regras avançadas e contexto da base de conhecimento"""
    global md_text
    question_lower = question.lower()
    
    # Base de conhecimento expandida
    keyword_responses = {
        "hanseniase": {
            "dr_gasnelio": "A hanseníase é uma doença infecciosa crônica causada pelo Mycobacterium leprae. Classificada em paucibacilar (PB) e multibacilar (MB), requer poliquimioterapia (PQT) conforme protocolo OMS.",
            "ga": "A hanseníase é uma doença que tem cura! É causada por uma bactéria e se pega pelo ar, mas é bem difícil de transmitir. O mais importante é seguir o tratamento certinho! 😊"
        },
        "hansen": {
            "dr_gasnelio": "Hansen é outro nome para hanseníase, em homenagem ao médico Gerhard Hansen que descobriu a bactéria em 1873. É a denominação científica preferencial para reduzir estigma.",
            "ga": "Hansen é só outro nome para hanseníase! Usamos esse nome para diminuir o preconceito. É a mesma doença, mas com um nome mais respeitoso! 👍"
        },
        "dispensacao": {
            "dr_gasnelio": "A dispensação farmacêutica na hanseníase deve incluir: verificação da prescrição, orientação posológica, explicação sobre RAM, importância da adesão e orientações sobre transmissão.",
            "ga": "Na dispensação, eu explico tudo sobre o remédio: como tomar, horários, o que pode acontecer de efeito, e principalmente que o tratamento funciona! 💊"
        },
        "rifampicina": {
            "dr_gasnelio": "Rifampicina 600mg: bactericida, administração mensal supervisionada. Principais RAM: coloração alaranjada de secreções, hepatotoxicidade, interações com anticoncepcionais.",
            "ga": "A rifampicina é um remédio super importante! Ela deixa a urina e o suor meio laranjinha, mas é normal. Toma uma vez por mês aqui na farmácia comigo! 🧡"
        },
        "dapsona": {
            "dr_gasnelio": "Dapsona 100mg: bacteriostática, uso diário. RAM: anemia hemolítica, metahemoglobinemia, agranulocitose. Monitoramento hematológico necessário.",
            "ga": "A dapsona é tomada todo dia em casa. Às vezes pode dar uma anemia leve, por isso fazemos exames para acompanhar. Mas é controlável! 💙"
        },
        "clofazimina": {
            "dr_gasnelio": "Clofazimina 300mg mensal + 50mg diário: bactericida para MB. RAM: hiperpigmentação cutânea reversível, distúrbios GI. A coloração escura regride após tratamento.",
            "ga": "A clofazimina deixa a pele mais escurinha durante o tratamento, mas depois volta ao normal! É um efeito conhecido e esperado. Funciona muito bem! 🖤"
        },
        "pqt": {
            "dr_gasnelio": "PQT (Poliquimioterapia): PB = rifampicina + dapsona por 6 meses. MB = rifampicina + dapsona + clofazimina por 12 meses. Esquema padronizado OMS.",
            "ga": "PQT é o nome do tratamento completo! São vários remédios juntos que garantem a cura. Para casos mais leves são 6 meses, para mais graves são 12! 📅"
        },
        "efeito": {
            "dr_gasnelio": "RAM principais: rifampicina (coloração alaranjada, hepatotoxicidade), dapsona (anemia hemolítica), clofazimina (hiperpigmentação). Monitoramento essencial.",
            "ga": "Os efeitos mais comuns são mudanças na cor da urina, pele ou suor. Pode dar enjoo ou anemia leve. Sempre me avise se sentir algo diferente! 🩺"
        },
        "transmissao": {
            "dr_gasnelio": "Transmissão: gotículas respiratórias de casos MB sem tratamento. Após 15 dias de PQT, o paciente não transmite mais. Contato íntimo necessário.",
            "ga": "A hanseníase se pega pelo ar, mas só de pessoas que não estão se tratando. Depois que começa o remédio, em 15 dias já não passa mais! 🌬️"
        },
        "cura": {
            "dr_gasnelio": "A cura bacteriológica ocorre com a PQT completa. Critério de alta: término do esquema terapêutico independente do resultado baciloscópico.",
            "ga": "A cura é garantida quando você completa todo o tratamento! Mesmo que ainda sinta alguma coisa, a bactéria já foi eliminada. É uma vitória! 🎉"
        },
        "dosagem": {
            "dr_gasnelio": "Dosagens padrão OMS: Rifampicina 600mg (mensal), Dapsona 100mg (diária), Clofazimina 300mg (mensal) + 50mg (diária para MB). Ajustes em pediatria.",
            "ga": "As doses são bem estudadas e seguras! Alguns remédios você toma todo dia, outros uma vez por mês aqui comigo. Vou sempre te lembrar! ⏰"
        }
    }
    
    # Procura por palavras-chave
    for keyword, responses in keyword_responses.items():
        if keyword in question_lower:
            answer = responses.get(persona, responses["ga"])
            break
    else:
        # Se não encontrar palavra-chave, usar contexto da base de conhecimento
        if md_text and len(md_text) > 100:
            try:
                context = find_relevant_context(question, md_text)
                if context and len(context) > 50:
                    if persona == "dr_gasnelio":
                        answer = f"Baseado na literatura científica: {context[:300]}... Para mais detalhes específicos sobre '{question}', posso fornecer informações técnicas adicionais."
                    else:
                        answer = f"Oi! Baseado no que estudei: {context[:200]}... Posso explicar melhor sobre '{question}' de um jeito mais fácil! 😊"
                else:
                    # Resposta padrão se contexto não for relevante
                    if persona == "dr_gasnelio":
                        answer = f"Baseado na literatura científica sobre hanseníase, posso fornecer informações técnicas sobre sua pergunta: '{question}'. Precisa de dados específicos sobre protocolos terapêuticos?"
                    else:
                        answer = f"Oi! Sobre sua pergunta '{question}', posso te ajudar com informações sobre hanseníase e dispensação farmacêutica! O que você gostaria de saber mais especificamente? 😊"
            except Exception as e:
                logger.error(f"Erro ao processar contexto: {e}")
                # Fallback para resposta padrão
                if persona == "dr_gasnelio":
                    answer = f"Baseado na literatura científica sobre hanseníase, posso fornecer informações técnicas sobre sua pergunta: '{question}'. Precisa de dados específicos sobre protocolos terapêuticos?"
                else:
                    answer = f"Oi! Sobre sua pergunta '{question}', posso te ajudar com informações sobre hanseníase e dispensação farmacêutica! O que você gostaria de saber mais especificamente? 😊"
        else:
            # Resposta padrão se base de conhecimento não estiver disponível
            if persona == "dr_gasnelio":
                answer = f"Baseado na literatura científica sobre hanseníase, posso fornecer informações técnicas sobre sua pergunta: '{question}'. Precisa de dados específicos sobre protocolos terapêuticos?"
            else:
                answer = f"Oi! Sobre sua pergunta '{question}', posso te ajudar com informações sobre hanseníase e dispensação farmacêutica! O que você gostaria de saber mais especificamente? 😊"
    
    # Nome da persona
    persona_names = {
        "dr_gasnelio": "Dr. Gasnelio",
        "ga": "Gá"
    }
    
    return {
        "answer": answer,
        "name": persona_names.get(persona, "Assistente")
    }

def check_drug_interactions(medications):
    """Verifica interações medicamentosas para hanseníase"""
    
    # Base de dados de interações conhecidas
    known_interactions = {
        ("rifampicina", "anticoncepcional"): {
            "severity": "major",
            "description": "Rifampicina reduz significativamente a eficácia de anticoncepcionais orais",
            "recommendation": "Usar métodos contraceptivos alternativos durante o tratamento"
        },
        ("rifampicina", "varfarina"): {
            "severity": "major", 
            "description": "Rifampicina aumenta o metabolismo da varfarina, reduzindo seu efeito",
            "recommendation": "Monitorar INR e ajustar dose de varfarina conforme necessário"
        },
        ("rifampicina", "corticoide"): {
            "severity": "moderate",
            "description": "Rifampicina pode reduzir os níveis de corticosteroides",
            "recommendation": "Monitorar resposta clínica e considerar ajuste de dose"
        },
        ("dapsona", "probenecida"): {
            "severity": "moderate",
            "description": "Probenecida pode aumentar os níveis de dapsona",
            "recommendation": "Monitorar sinais de toxicidade da dapsona"
        },
        ("dapsona", "trimetoprim"): {
            "severity": "moderate",
            "description": "Combinação pode aumentar risco de metahemoglobinemia",
            "recommendation": "Monitorar saturação de oxigênio e sinais de cianose"
        },
        ("clofazimina", "antiarritmico"): {
            "severity": "major",
            "description": "Clofazimina pode prolongar intervalo QT",
            "recommendation": "Realizar ECG antes e durante o tratamento"
        }
    }
    
    interactions_found = []
    medications_lower = [med.lower() for med in medications]
    
    # Verificar interações diretas
    for (drug1, drug2), interaction in known_interactions.items():
        if drug1 in medications_lower and drug2 in medications_lower:
            interactions_found.append({
                "drugs": [drug1, drug2],
                "severity": interaction["severity"],
                "description": interaction["description"],
                "recommendation": interaction["recommendation"]
            })
    
    # Verificar interações específicas com medicamentos de hanseníase
    hanseniase_drugs = ["rifampicina", "dapsona", "clofazimina"]
    for hansen_drug in hanseniase_drugs:
        if hansen_drug in medications_lower:
            for med in medications_lower:
                if med != hansen_drug:
                    interaction_key = (hansen_drug, med)
                    if interaction_key in known_interactions:
                        interaction = known_interactions[interaction_key]
                        interactions_found.append({
                            "drugs": [hansen_drug, med],
                            "severity": interaction["severity"],
                            "description": interaction["description"],
                            "recommendation": interaction["recommendation"]
                        })
    
    return interactions_found

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

# Para Vercel
if __name__ == '__main__':
    app.run()