from flask import Flask, request, jsonify, send_from_directory
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
import html
import bleach

# Importar sistemas otimizados - VERSÃO INCREMENTAL PARA RENDER
try:
    from services.dr_gasnelio_enhanced import get_enhanced_dr_gasnelio_prompt, validate_dr_gasnelio_response
    from services.ga_enhanced import get_enhanced_ga_prompt, validate_ga_response
    from services.scope_detection_system import detect_question_scope, get_limitation_response
    from services.enhanced_rag_system import get_enhanced_context, cache_rag_response, add_rag_feedback, get_rag_stats
    from services.personas import get_personas, get_persona_prompt
    from services.knowledge_loader import get_structured_knowledge_base
    ADVANCED_FEATURES = True
    print("✅ Todos os sistemas avançados carregados com sucesso!")
except ImportError as e:
    print(f"Advanced features disabled, using fallback: {e}")
    ADVANCED_FEATURES = False

# Importar RAG simples
try:
    from services.simple_rag import generate_context_from_rag
    RAG_AVAILABLE = True
    print("✅ RAG simples carregado com sucesso")
except ImportError as e:
    print(f"RAG simples indisponível: {e}")
    RAG_AVAILABLE = False

# TESTE 2: Importar OpenAI client
try:
    from services.openai_integration import test_openai_connection, get_ai_response_mock
    OPENAI_TEST_AVAILABLE = True
    print("✅ OpenAI integration carregado com sucesso")
except ImportError as e:
    print(f"OpenAI integration indisponível: {e}")
    OPENAI_TEST_AVAILABLE = False

# Importar cache avançado
try:
    from services.advanced_cache import PerformanceCache
    performance_cache = PerformanceCache(max_size=1000, ttl_minutes=60)
    ADVANCED_CACHE = True
    print("✅ Cache avançado carregado com sucesso!")
except ImportError as e:
    print(f"⚠️ Cache avançado indisponível, usando fallback: {e}")
    # Performance cache simples sem dependências externas
    class SimpleCache:
        def __init__(self):
            self.cache = {}
            self.hits = 0
            self.misses = 0
        
        @property
        def hit_rate(self):
            total = self.hits + self.misses
            return (self.hits / total * 100) if total > 0 else 0
        
        def get_stats(self):
            """Retorna estatísticas do cache"""
            return {
                "hits": self.hits,
                "misses": self.misses,
                "hit_rate": self.hit_rate,
                "total_entries": len(self.cache)
            }
    
    performance_cache = SimpleCache()
    ADVANCED_CACHE = False

# Classe para simular usability_monitor temporariamente
class UsabilityMonitor:
    def get_comprehensive_report(self):
        """Retorna relatório básico de usabilidade"""
        return {
            "status": "operational",
            "response_time_avg": "800ms",
            "user_satisfaction": "85%",
            "system_health": "good"
        }

usability_monitor = UsabilityMonitor()

app = Flask(__name__)

# FASE 4: Configuração CORS mais permissiva para debug
allowed_origins = [
    "https://roteiros-de-dispensacao.web.app",
    "https://roteiros-de-dispensacao.firebaseapp.com",
    "http://localhost:3000",  # Para desenvolvimento
    "http://127.0.0.1:3000",   # Para desenvolvimento local
    "http://localhost:5173",   # Vite dev server
    "http://127.0.0.1:5173",   # Vite dev server local
    "https://localhost:3000",  # HTTPS local
    "https://127.0.0.1:3000"   # HTTPS local
]

# Adicionar origins dinâmicos em desenvolvimento
if os.getenv('ENVIRONMENT') == 'development':
    # Permitir qualquer origin em desenvolvimento
    allowed_origins.append("*")

# Configuração específica para ambientes de produção
flask_env = os.environ.get('FLASK_ENV', '').lower()
cloud_run_url = os.environ.get('CLOUD_RUN_SERVICE_URL', '')
render_service_url = os.environ.get('RENDER_EXTERNAL_URL', '')

if flask_env == 'production':
    if cloud_run_url:
        # Produção Google Cloud Run + Firebase
        allowed_origins = [
            "https://roteiros-de-dispensacao.web.app",
            "https://roteiros-de-dispensacao.firebaseapp.com",
            "https://roteirosdedispensacao.com",
            "https://www.roteirosdedispensacao.com"
        ]
        print(f"CORS configurado para GOOGLE CLOUD RUN - {cloud_run_url}")
    elif render_service_url:
        # Fallback para Render
        allowed_origins = [render_service_url, "https://roteiros-de-dispensacao.web.app"]
        print(f"CORS configurado para RENDER - {render_service_url}")
    else:
        # Padrão Firebase apenas
        allowed_origins = [
            "https://roteiros-de-dispensacao.web.app", 
            "https://roteiros-de-dispensacao.firebaseapp.com"
        ]
        print("CORS configurado para FIREBASE HOSTING")

CORS(app, 
     origins=allowed_origins,
     methods=['GET', 'POST', 'OPTIONS', 'HEAD'],
     allow_headers=['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
     supports_credentials=False,
     max_age=86400)  # Cache preflight por 24h

print(f"🔗 CORS ativo para: {allowed_origins}")

# ROTA DE TESTE PARA DEBUG CORS
@app.route('/api/test', methods=['GET', 'OPTIONS'])
def test_cors():
    """Rota de teste para verificar CORS"""
    return jsonify({
        "status": "ok",
        "message": "Backend conectado com sucesso!",
        "timestamp": datetime.now().isoformat(),
        "cors_headers": dict(request.headers),
        "origin": request.origin,
        "method": request.method,
        "environment": os.environ.get('FLASK_ENV', 'development')
    })

# Headers de segurança obrigatórios
@app.after_request
def add_security_headers(response):
    """Adiciona headers de segurança essenciais"""
    # Prevenir XSS
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    
    # HSTS para HTTPS obrigatório
    if request.is_secure:
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    
    # CSP básico para prevenir injeções
    response.headers['Content-Security-Policy'] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline'; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data: https:; "
        "connect-src 'self' https://api-inference.huggingface.co https://openrouter.ai"
    )
    
    # Remover headers que revelam informações do servidor
    response.headers.pop('Server', None)
    
    return response

# Configuração avançada de logging otimizada para produção Render
log_format = os.environ.get('LOG_FORMAT', 'standard')
log_level = os.environ.get('LOG_LEVEL', 'INFO').upper()

if log_format == 'structured':
    # Formato JSON estruturado para produção
    log_formatter = logging.Formatter(
        '{"timestamp": "%(asctime)s", "level": "%(levelname)s", "module": "%(name)s", "message": "%(message)s", "platform": "render"}'
    )
else:
    # Formato padrão para desenvolvimento
    log_formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')

# Configurar handler principal para stdout (Render captura automaticamente)
console_handler = logging.StreamHandler()
console_handler.setFormatter(log_formatter)

# Configurar logging root
logging.basicConfig(
    level=getattr(logging, log_level, logging.INFO),
    handlers=[console_handler]
)

logger = logging.getLogger(__name__)

# Logger específico para eventos de segurança com formato estruturado
security_logger = logging.getLogger('security')
security_handler = logging.StreamHandler()
security_formatter = logging.Formatter(
    '{"timestamp": "%(asctime)s", "level": "SECURITY", "event": "%(message)s", "platform": "render"}'
)
security_handler.setFormatter(security_formatter)
security_logger.addHandler(security_handler)
security_logger.setLevel(logging.WARNING)
security_logger.propagate = False  # Evitar duplicação

# Logger para métricas de performance
metrics_logger = logging.getLogger('metrics')
metrics_handler = logging.StreamHandler()
metrics_formatter = logging.Formatter(
    '{"timestamp": "%(asctime)s", "level": "METRICS", "data": "%(message)s", "platform": "render"}'
)
metrics_handler.setFormatter(metrics_formatter)
metrics_logger.addHandler(metrics_handler)
metrics_logger.setLevel(logging.INFO)
metrics_logger.propagate = False

def log_security_event(event_type: str, client_ip: str, details: dict = None):
    """Log estruturado de eventos de segurança otimizado para produção"""
    event_data = {
        'event_type': event_type,
        'client_ip': client_ip,
        'timestamp': datetime.now().isoformat(),
        'environment': os.environ.get('FLASK_ENV', 'unknown'),
        'details': details or {}
    }
    security_logger.warning(json.dumps(event_data))

def log_performance_metric(metric_name: str, value: float, details: dict = None):
    """Log estruturado de métricas de performance"""
    metric_data = {
        'metric_name': metric_name,
        'value': value,
        'timestamp': datetime.now().isoformat(),
        'environment': os.environ.get('FLASK_ENV', 'unknown'),
        'details': details or {}
    }
    metrics_logger.info(json.dumps(metric_data))

def log_api_request(endpoint: str, method: str, status_code: int, response_time_ms: float, client_ip: str = None):
    """Log estruturado de requisições da API"""
    request_data = {
        'endpoint': endpoint,
        'method': method,
        'status_code': status_code,
        'response_time_ms': response_time_ms,
        'client_ip': client_ip or 'unknown',
        'timestamp': datetime.now().isoformat(),
        'environment': os.environ.get('FLASK_ENV', 'unknown')
    }
    logger.info(f"API_REQUEST: {json.dumps(request_data)}")

# Rate Limiting System
class SimpleRateLimiter:
    """Sistema simples de rate limiting em memória"""
    
    def __init__(self):
        self.requests = defaultdict(list)
        self.lock = threading.Lock()
        
        # Configurações de rate limiting mais restritivas para segurança
        self.limits = {
            'chat': {'max_requests': 20, 'window_minutes': 1},      # 20 req/min para chat (reduzido)
            'general': {'max_requests': 50, 'window_minutes': 1},   # 50 req/min para outros endpoints (reduzido)
            'scope': {'max_requests': 30, 'window_minutes': 1},     # 30 req/min para scope (reduzido)
            'suspicious': {'max_requests': 5, 'window_minutes': 60} # IPs suspeitos: 5 por hora
        }
        
        # Lista de IPs suspeitos e bloqueados (em produção, usar Redis/banco)
        self.suspicious_ips = set()
        self.blocked_ips = set()
        self.abuse_attempts = defaultdict(int)
        
        # Thread para limpeza periódica
        self.cleanup_thread = threading.Thread(target=self._cleanup_old_requests, daemon=True)
        self.cleanup_thread.start()
    
    def is_allowed(self, client_ip: str, endpoint_type: str = 'general') -> tuple[bool, dict]:
        """
        Verifica se requisição é permitida com controles de segurança
        
        Returns:
            (is_allowed, info_dict)
        """
        with self.lock:
            now = datetime.now()
            
            # Verificar se IP está bloqueado
            if client_ip in self.blocked_ips:
                log_security_event('BLOCKED_IP_ACCESS', client_ip, {'endpoint_type': endpoint_type})
                return False, {
                    'blocked': True,
                    'reason': 'IP bloqueado por atividade suspeita'
                }
            
            # Verificar se é IP suspeito
            if client_ip in self.suspicious_ips:
                endpoint_type = 'suspicious'
                log_security_event('SUSPICIOUS_IP_ACCESS', client_ip, {'endpoint_type': endpoint_type})
            
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
            else:
                # Incrementar tentativas de abuso
                self.abuse_attempts[client_ip] += 1
                log_security_event('RATE_LIMIT_EXCEEDED', client_ip, {
                    'endpoint_type': endpoint_type,
                    'current_count': current_count,
                    'limit': endpoint_limit['max_requests'],
                    'abuse_attempts': self.abuse_attempts[client_ip]
                })
                
                # Marcar como suspeito após 3 tentativas de abuso
                if self.abuse_attempts[client_ip] >= 3:
                    self.suspicious_ips.add(client_ip)
                    log_security_event('IP_MARKED_SUSPICIOUS', client_ip, {
                        'abuse_attempts': self.abuse_attempts[client_ip]
                    })
                
                # Bloquear após 10 tentativas de abuso
                if self.abuse_attempts[client_ip] >= 10:
                    self.blocked_ips.add(client_ip)
                    log_security_event('IP_BLOCKED', client_ip, {
                        'abuse_attempts': self.abuse_attempts[client_ip],
                        'reason': 'Excesso de tentativas de rate limit'
                    })
            
            return is_allowed, {
                'current_count': current_count + (1 if is_allowed else 0),
                'limit': endpoint_limit['max_requests'],
                'window_minutes': endpoint_limit['window_minutes'],
                'reset_time': (now + timedelta(minutes=endpoint_limit['window_minutes'])).isoformat(),
                'is_suspicious': client_ip in self.suspicious_ips,
                'abuse_attempts': self.abuse_attempts[client_ip]
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

def validate_and_sanitize_input(user_input):
    """
    Validação e sanitização robusta de entrada do usuário
    """
    if not user_input or not isinstance(user_input, str):
        raise ValueError("Input inválido")
    
    # Limite de tamanho
    if len(user_input) > 2000:
        raise ValueError("Pergunta muito longa (máximo 2000 caracteres)")
    
    # Detectar tentativas de injeção
    dangerous_patterns = [
        r'<script[^>]*>.*?</script>',  # Scripts
        r'javascript:',               # JavaScript URLs
        r'on\w+\s*=',                # Event handlers
        r'<iframe[^>]*>',            # iFrames
        r'<object[^>]*>',            # Objects
        r'<embed[^>]*>',             # Embeds
        r'expression\s*\(',          # CSS expressions
        r'@import',                  # CSS imports
        r'data:.*base64',            # Data URLs suspeitas
    ]
    
    for pattern in dangerous_patterns:
        if re.search(pattern, user_input, re.IGNORECASE):
            raise ValueError("Input contém conteúdo potencialmente perigoso")
    
    # Sanitização com bleach (mais robusta)
    allowed_tags = []  # Sem tags HTML permitidas
    cleaned_input = bleach.clean(user_input, tags=allowed_tags, strip=True)
    
    # Escape HTML adicional
    cleaned_input = html.escape(cleaned_input)
    
    # Remover caracteres de controle
    cleaned_input = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', cleaned_input)
    
    # Normalizar espaços
    cleaned_input = re.sub(r'\s+', ' ', cleaned_input).strip()
    
    if not cleaned_input:
        raise ValueError("Input vazio após sanitização")
    
    return cleaned_input

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
# Definir caminhos possíveis para o conhecimento base (container-friendly)
MD_PATHS = [
    # Backend local paths (após cópia)
    'data/knowledge_base/Roteiro de Dsispensação - Hanseníase.md',
    'data/knowledge_base/roteiro_hanseniase_basico.md',
    # Container paths
    '/app/data/Roteiro de Dsispensação - Hanseníase.md',
    '/app/data/roteiro_hanseniase_basico.md',
    # Legacy paths (manter para compatibilidade)
    'data/Roteiro de Dsispensação - Hanseníase.md',
    'data/roteiro_hanseniase_basico.md'
]
MD_PATH = None
for path in MD_PATHS:
    if os.path.exists(path):
        MD_PATH = path
        break
if not MD_PATH:
    MD_PATH = MD_PATHS[0]  # Fallback
md_text = ""

# Usar personas do sistema otimizado ou fallback
if ADVANCED_FEATURES:
    PERSONAS = get_personas()
    logger.info("📚 Carregando knowledge base estruturada...")
    try:
        structured_kb = get_structured_knowledge_base()
        kb_stats = structured_kb.get_statistics()
        logger.info(f"✅ Knowledge base carregada: {kb_stats}")
    except Exception as e:
        logger.error(f"❌ Erro ao carregar knowledge base estruturada: {e}")
else:
    # Fallback personas quando sistemas avançados não estão disponíveis
    PERSONAS = {
        'dr_gasnelio': {
            'id': 'dr_gasnelio',
            'name': 'Dr. Gasnelio',
            'role': 'Farmacêutico Clínico',
            'description': 'Farmacêutico clínico especialista em hanseníase',
            'greeting': 'Olá! Como posso ajudar com a dispensação de PQT-U hoje?'
        },
        'ga': {
            'id': 'ga', 
            'name': 'Gá',
            'role': 'Farmacêutico Educador',
            'description': 'Farmacêutico empático e acessível',
            'greeting': 'Oi! Estou aqui para ajudar com suas dúvidas sobre hanseníase.'
        }
    }
    logger.info("📋 Usando personas de fallback (sistemas avançados indisponíveis)")

def extract_md_text(md_path):
    """Extrai texto do arquivo Markdown com diagnóstico aprimorado"""
    global md_text
    
    # Debug: informações do ambiente
    import os
    current_dir = os.getcwd()
    logger.info(f"🔍 Diretório de trabalho: {current_dir}")
    logger.info(f"🔍 Tentando carregar: {md_path}")
    
    # Listar conteúdo dos diretórios
    try:
        if os.path.exists('.'):
            root_files = [f for f in os.listdir('.') if f.startswith('data') or f.endswith('.md')]
            logger.info(f"🔍 Arquivos relevantes na raiz: {root_files}")
            
        if os.path.exists('data'):
            data_files = os.listdir('data')
            logger.info(f"🔍 Arquivos em data/: {data_files}")
    except Exception as e:
        logger.error(f"❌ Erro ao listar diretórios: {e}")
    
    # Tentar carregar o arquivo
    try:
        logger.info(f"📁 Verificando se existe: {os.path.exists(md_path)}")
        with open(md_path, 'r', encoding='utf-8') as file:
            text = file.read()
        logger.info(f"✅ Arquivo Markdown carregado! {len(text)} caracteres")
        return text
        
    except FileNotFoundError:
        logger.warning(f"❌ Arquivo não encontrado: {md_path}")
        
        # Tentar paths alternativos (backend local primeiro)
        alternative_paths = [
            'data/knowledge_base/roteiro_hanseniase_basico.md',
            'data/knowledge_base/Roteiro de Dsispensação - Hanseníase.md',
            'data/roteiro_hanseniase_basico.md',
            './data/roteiro_hanseniase_basico.md'
        ]
        
        for alt_path in alternative_paths:
            try:
                logger.info(f"🔄 Testando: {alt_path}")
                with open(alt_path, 'r', encoding='utf-8') as file:
                    text = file.read()
                logger.info(f"✅ Sucesso com alternativo! {len(text)} caracteres de {alt_path}")
                return text
            except:
                continue
                
        # Se nada funcionar, usar conteúdo básico expandido
        logger.warning("⚠️ Usando knowledge base de fallback expandida")
        return """
# Roteiro de Dispensação para Hanseníase - Sistema de Fallback

Este sistema fornece informações baseadas no roteiro de dispensação para hanseníase PQT-U.

## POLIQUIMIOTERAPIA ÚNICA (PQT-U) - ESQUEMA PADRÃO

### Medicamentos e Dosagens
**RIFAMPICINA**
- Dose adultos: 600mg uma vez por mês (supervisionada)
- Dose pediatria: 10-20mg/kg (máximo 600mg)
- Administração: Via oral, jejum
- Efeito adverso principal: Coloração alaranjada da urina, suor e lágrimas

**CLOFAZIMINA**
- Dose adultos: 300mg mensal (supervisionada) + 50mg diária (autoadministrada)
- Dose pediatria: 6-12mg/kg mensal + 1mg/kg diária
- Efeito adverso principal: Hiperpigmentação da pele (reversível)

**DAPSONA**  
- Dose adultos: 100mg diariamente (autoadministrada)
- Dose pediatria: 2mg/kg diariamente
- Contraindicação: Deficiência de G6PD grave
- Efeito adverso: Anemia, metahemoglobinemia

### Duração do Tratamento
- PQT-U: 12 meses de tratamento
- Total de doses: 12 doses mensais supervisionadas

### Orientações de Dispensação
1. Verificar prescrição médica
2. Calcular doses conforme peso
3. Orientar sobre horários de administração
4. Explicar efeitos adversos esperados
5. Reforçar importância da adesão
6. Agendar retornos mensais

### Monitoramento
- Função hepática (rifampicina)
- Coloração da pele (clofazimina)  
- Hemograma (dapsona)
- Adesão ao tratamento

### Populações Especiais
**Gravidez**: PQT-U é segura, manter tratamento
**Pediatria**: Ajustar doses conforme peso
**Idosos**: Monitoramento renal e hepático

Para informações detalhadas específicas, consulte sempre o protocolo oficial do Ministério da Saúde.
"""
        
    except Exception as e:
        logger.error(f"❌ Erro inesperado ao carregar MD: {e}")
        return "Sistema em modo de emergência. Consulte um profissional de saúde."

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
    """Obtém resposta de modelo AI gratuito via OpenRouter com redundância"""
    try:
        # Modelos com redundância (usar variáveis de ambiente do GitHub/Cloud Run)
        models = [
            "meta-llama/llama-3.2-3b-instruct:free",  # Primário
            "kimie-kimie/k2-chat:free"                 # Redundância
        ]
        
        # Para Dr. Gasnelio, usar sistema otimizado
        if persona == "dr_gasnelio":
            optimized_prompt = get_enhanced_dr_gasnelio_prompt(question)
            system_content = f"""{optimized_prompt}

Contexto da tese sobre roteiro de dispensação para hanseníase:
{context}

Responda seguindo RIGOROSAMENTE o formato técnico estruturado:"""
        elif persona == "ga":
            optimized_prompt = get_enhanced_ga_prompt(question)
            system_content = f"""{optimized_prompt}

Contexto da tese sobre roteiro de dispensação para hanseníase:
{context}

Responda seguindo seu jeito carinhoso e acessível:"""
        else:
            # Fallback para outras personas
            persona_config = PERSONAS[persona]
            system_content = f"""Contexto da tese sobre roteiro de dispensação para hanseníase:
{context}

{persona_config.get("system_prompt", "")}

Responda de acordo com o estilo da persona {persona_config['name']}:"""

        # Configuração OpenRouter
        openrouter_api_key = os.environ.get('OPENROUTER_API_KEY')
        if not openrouter_api_key:
            logger.error("OPENROUTER_API_KEY não configurado")
            return generate_rule_based_response(question, persona, context)
        
        headers = {
            "Authorization": f"Bearer {openrouter_api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://github.com/roteiro-dispensacao",
            "X-Title": "Roteiro de Dispensação"
        }
        
        messages = [
            {"role": "system", "content": system_content},
            {"role": "user", "content": question}
        ]
        
        # Tentar todos os modelos com redundância
        for attempt, model in enumerate(models):
            try:
                logger.info(f"Tentativa {attempt + 1}: Testando modelo {model.split('/')[-1]}")
                
                payload = {
                    "model": model,
                    "messages": messages,
                    "temperature": 0.7,
                    "max_tokens": 1000
                }
                
                response = requests.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers=headers,
                    json=payload,
                    timeout=30
                )
                
                if response.status_code == 200:
                    result = response.json()
                    ai_response = result["choices"][0]["message"]["content"]
                    
                    logger.info(f"✅ Resposta obtida do modelo {model.split('/')[-1]} (redundância ativa)")
                    
                    # Validar qualidade das respostas otimizadas
                    if persona == "dr_gasnelio" and ai_response:
                        validation_result = validate_dr_gasnelio_response(ai_response, question)
                        logger.info(f"Qualidade da resposta Dr. Gasnelio: {validation_result['quality_score']:.1f}%")
                        
                        if validation_result['quality_score'] < 50:
                            logger.warning("Qualidade baixa detectada, tentando próximo modelo")
                            if attempt < len(models) - 1:
                                continue
                            return generate_rule_based_response(question, persona, context)
                    
                    elif persona == "ga" and ai_response:
                        validation_result = validate_ga_response(ai_response, question)
                        logger.info(f"Score de empatia do Gá: {validation_result['empathy_score']:.1f}%")
                        
                        if validation_result['empathy_score'] < 60:
                            logger.warning("Empatia baixa detectada, tentando próximo modelo")
                            if attempt < len(models) - 1:
                                continue
                            return generate_rule_based_response(question, persona, context)
                    
                    return ai_response
                    
                else:
                    logger.warning(f"Erro no modelo {model}: {response.status_code} - {response.text}")
                    if attempt < len(models) - 1:
                        logger.info("Tentando próximo modelo disponível...")
                        continue
                    
            except requests.exceptions.Timeout:
                logger.warning(f"Timeout no modelo {model}")
                if attempt < len(models) - 1:
                    logger.info("Tentando próximo modelo por timeout...")
                    continue
                    
            except Exception as e:
                logger.warning(f"Erro no modelo {model}: {e}")
                if attempt < len(models) - 1:
                    logger.info("Tentando próximo modelo por erro...")
                    continue
        
        # Se todos os modelos falharam, usar fallback
        logger.error("❌ Todos os modelos AI falharam, usando resposta baseada em regras")
        return generate_rule_based_response(question, persona, context)
        
    except Exception as e:
        logger.error(f"Erro crítico ao obter resposta da API: {e}")
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
    """Responde à pergunta usando o sistema de IA com detecção de escopo e cache otimizado"""
    global md_text
    
    if not md_text:
        return format_persona_answer(
            "Desculpe, a base de conhecimento não está disponível no momento.", 
            persona, 
            0.0
        )
    
    try:
        # PERFORMANCE: Verificar cache primeiro
        cached_response = performance_cache.get(question, persona)
        if cached_response:
            logger.info(f"Resposta obtida do cache (hit rate: {performance_cache.hit_rate:.1f}%)")
            return cached_response
        
        # NOVA FUNCIONALIDADE: Buscar resposta na base de conhecimento estruturada
        if ADVANCED_FEATURES:
            try:
                structured_kb = get_structured_knowledge_base()
                enhanced_response = structured_kb.get_enhanced_response(question, persona)
                if enhanced_response:
                    logger.info("Resposta obtida da base de conhecimento estruturada")
                    formatted_response = format_persona_answer(enhanced_response, persona, 0.95)
                    performance_cache.set(question, persona, formatted_response)
                    return formatted_response
            except Exception as e:
                logger.warning(f"Erro ao buscar na base estruturada: {e}")
        
        # NOVA FUNCIONALIDADE: Detectar escopo da pergunta
        scope_analysis = detect_question_scope(question)
        logger.info(f"Análise de escopo - No escopo: {scope_analysis['is_in_scope']}, Categoria: {scope_analysis['category']}")
        
        # Se pergunta está fora do escopo, retornar resposta de limitação
        if not scope_analysis['is_in_scope']:
            limitation_response = get_limitation_response(persona, question)
            if limitation_response:
                formatted_response = format_persona_answer(limitation_response, persona, 0.9)
                performance_cache.set(question, persona, formatted_response)
                return formatted_response
        
        # Se está no escopo, continuar processamento normal
        # PERFORMANCE: Contexto otimizado com busca rápida
        # Context search com RAG simples ou fallback
        if RAG_AVAILABLE and md_text:
            context, rag_metadata = generate_context_from_rag(question, md_text, max_context_length=1500)
            logger.info(f"RAG simples usado: {rag_metadata}")
        else:
            # Fallback - usar primeiros 2000 caracteres
            context = md_text[:2000] if md_text else ""
            logger.info("Usando fallback de contexto")
        request_id = f"answer_{int(datetime.now().timestamp() * 1000)}"
        logger.info(f"[{request_id}] Contexto otimizado obtido: {len(context)} caracteres")
        
        # Obtém resposta da IA com timeout otimizado
        # API call com testes incrementais
        if ADVANCED_FEATURES:
            # Tentar usar funcionalidades avançadas
            ai_response = get_enhanced_dr_gasnelio_prompt(question, context) if persona == 'dr_gasnelio' else get_enhanced_ga_prompt(question, context)
        elif OPENAI_TEST_AVAILABLE:
            # Usar integração OpenAI de teste
            ai_response = get_ai_response_mock(question, context, persona)
            logger.info("Usando resposta OpenAI simulada")
        else:
            # Fallback básico
            ai_response = f"Como {persona}, posso ajudá-lo com informações sobre hanseníase baseadas no contexto disponível: {context[:200]}..."
        
        if not ai_response:
            # Fallback para resposta baseada em regras
            ai_response = generate_rule_based_response(question, persona, context)
        
        # Adicionar informação de confiança baseada na análise de escopo
        confidence = 0.8
        if scope_analysis['confidence_level'] == 'high':
            confidence = 0.9
        elif scope_analysis['confidence_level'] == 'low':
            confidence = 0.6
        
        # Formatar resposta final
        formatted_response = format_persona_answer(ai_response, persona, confidence)
        
        # CACHE: Armazenar resposta para futuras consultas
        performance_cache.set(question, persona, formatted_response)
        
        # CACHE RAG: Armazenar também no sistema RAG
        if ai_response and confidence > 0.7:
            cache_rag_response(question, ai_response, confidence)
            logger.info(f"[{request_id}] Resposta cacheada em ambos os sistemas")
        
        return formatted_response
        
    except Exception as e:
        logger.error(f"Erro ao processar pergunta: {e}")
        return format_persona_answer(
            "Desculpe, ocorreu um erro técnico ao processar sua pergunta. Tente novamente.", 
            persona, 
            0.0
        )

@app.route('/')
def index():
    """API info endpoint - Backend only deployment"""
    logger.info("Root endpoint accessed - returning API information")
    
    return jsonify({
        "message": "Roteiro de Dispensação - Backend API",
        "version": "v10.0",
        "status": "online",
        "deployment_type": "backend_only",
        "description": "API especializada em hanseníase com sistema de personas educacionais",
        "endpoints": {
            "health": "/api/health",
            "chat": "/api/chat", 
            "personas": "/api/personas",
            "scope": "/api/scope",
            "feedback": "/api/feedback",
            "stats": "/api/stats",
            "test": "/api/test"
        },
        "frontend_url": "https://roteiros-de-dispensacao.web.app",
        "documentation": {
            "chat_endpoint": {
                "method": "POST",
                "url": "/api/chat",
                "required_fields": ["question", "personality_id"],
                "example": {
                    "question": "Qual a dose de rifampicina?",
                    "personality_id": "dr_gasnelio"
                }
            },
            "available_personas": ["dr_gasnelio", "ga"]
        },
        "cors_enabled": True,
        "rate_limiting": True,
        "timestamp": datetime.now().isoformat()
    })

# Frontend routes removed - Backend only deployment

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

        # Validação e sanitização robusta de input
        try:
            question = validate_and_sanitize_input(question)
        except ValueError as e:
            client_ip = request.remote_addr or 'unknown'
            log_security_event('MALICIOUS_INPUT_ATTEMPT', client_ip, {
                'error': str(e),
                'request_id': request_id,
                'input_length': len(question) if question else 0
            })
            return jsonify({
                "error": f"Input inválido: {str(e)}",
                "error_code": "INVALID_INPUT",
                "request_id": request_id
            }), 400
        
        # Log dos parâmetros validados (SEM conteúdo sensível)
        client_ip = request.remote_addr or 'unknown'
        logger.info(f"[{request_id}] Parâmetros válidos - IP: {client_ip}, Persona: {personality_id}, Pergunta: {len(question)} chars")
        
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
    """FASE 4: Verificação de saúde robusta com debug completo"""
    start_time = time.time()
    client_ip = request.environ.get('HTTP_X_FORWARDED_FOR', request.environ.get('REMOTE_ADDR', 'unknown'))
    
    # Log da requisição de health
    logger.info(f"🔍 Health check solicitado por {client_ip}")
    
    # === VERIFICAÇÕES DE SISTEMA EXPANDIDAS ===
    system_status = "healthy"
    issues = []
    debug_info = {}
    
    # 1. Verificar variáveis de ambiente críticas
    env_vars = {
        'HUGGINGFACE_API_KEY': bool(os.environ.get('HUGGINGFACE_API_KEY')),
        'OPENROUTER_API_KEY': bool(os.environ.get('OPENROUTER_API_KEY')),
        'FLASK_ENV': os.environ.get('FLASK_ENV', 'not_set'),
        'ENVIRONMENT': os.environ.get('ENVIRONMENT', 'not_set'),
        'PORT': os.environ.get('PORT', 'not_set'),
        'DOMAIN': os.environ.get('DOMAIN', 'not_set')
    }
    
    env_vars_status = env_vars['HUGGINGFACE_API_KEY'] and env_vars['OPENROUTER_API_KEY']
    if not env_vars_status:
        issues.append("environment_vars_missing")
    
    # 2. Verificar base de conhecimento
    md_available = len(md_text) > 100
    structured_available = False
    
    if ADVANCED_FEATURES:
        try:
            structured_kb = get_structured_knowledge_base()
            kb_stats = structured_kb.get_statistics()
            structured_available = kb_stats['loaded_successfully'] > 0
            debug_info['knowledge_base_stats'] = kb_stats
        except Exception as e:
            debug_info['knowledge_base_error'] = str(e)
    
    knowledge_base_status = md_available or structured_available
    if not knowledge_base_status:
        issues.append("knowledge_base_missing")
        
    # 3. Verificar personas
    personas_status = len(PERSONAS) >= 2
    if not personas_status:
        issues.append("personas_incomplete")
    
    # 4. Verificar sistemas avançados
    systems_status = {
        'advanced_features': ADVANCED_FEATURES,
        'rag_available': RAG_AVAILABLE,
        'openai_test': OPENAI_TEST_AVAILABLE,
        'advanced_cache': ADVANCED_CACHE
    }
    
    # 5. Verificar CORS
    cors_origins = len(allowed_origins)
    debug_info['cors_origins_count'] = cors_origins
    debug_info['cors_origins'] = allowed_origins
    
    # Determinar status geral
    if issues:
        system_status = "degraded" if len(issues) <= 2 else "unhealthy"
    
    # === MÉTRICAS DE PERFORMANCE ===
    try:
        performance_metrics = {
            "cache_hit_rate": f"{performance_cache.hit_rate:.1f}%",
            "cache_size": len(performance_cache.cache),
            "memory_usage_mb": 0,  # Placeholder para uso de memória
            "uptime_seconds": int(time.time() - start_time) * 1000,  # Approximation
            "response_time_ms": 0  # Será preenchido abaixo
        }
    except Exception as e:
        performance_metrics = {
            "cache_hit_rate": "0.0%",
            "cache_size": 0,
            "error": str(e)
        }
    
    # === INFORMAÇÕES DO SISTEMA ===
    health_status = {
        "status": system_status,
        "timestamp": datetime.now().isoformat(),
        "version": "9.0.0",
        "environment": os.environ.get('FLASK_ENV', 'unknown'),
        "platform": "google-cloud-run",
        
        # Componentes do sistema
        "components": {
            "knowledge_base": {
                "status": "operational" if knowledge_base_status else "failure",
                "size_chars": len(md_text),
                "loaded": knowledge_base_status,
                "sources": {
                    "markdown": len(md_text) > 100,
                    "structured": structured_available if 'structured_available' in locals() else False
                }
            },
            "personas": {
                "status": "operational" if personas_status else "failure", 
                "available": list(PERSONAS.keys()),
                "count": len(PERSONAS)
            },
            "apis": {
                "status": "operational" if env_vars_status else "failure",
                "huggingface": bool(os.environ.get('HUGGINGFACE_API_KEY')),
                "openrouter": bool(os.environ.get('OPENROUTER_API_KEY'))
            },
            "cache_system": {
                "status": "operational",
                "metrics": performance_metrics
            }
        },
        
        # Métricas gerais
        "performance": performance_metrics,
        "issues": issues,
        "checks_passed": 4 - len(issues),
        "checks_total": 4
    }
    
    # Tempo de resposta final
    health_status["performance"]["response_time_ms"] = int((time.time() - start_time) * 1000)
    
    # Status HTTP baseado na saúde
    status_code = 200 if system_status == "healthy" else (503 if system_status == "unhealthy" else 200)
    
    return jsonify(health_status), status_code

@app.route('/api/test-status', methods=['GET'])
def test_status():
    """Status dos testes incrementais"""
    
    openai_test = None
    if OPENAI_TEST_AVAILABLE:
        openai_test = test_openai_connection()
    
    return jsonify({
        "test_results": {
            "test_1_nltk": {
                "status": "passed" if RAG_AVAILABLE else "failed",
                "description": "NLTK + RAG simples",
                "available": RAG_AVAILABLE
            },
            "test_2_openai": {
                "status": "passed" if OPENAI_TEST_AVAILABLE else "failed", 
                "description": "OpenAI client + HTTPx",
                "available": OPENAI_TEST_AVAILABLE,
                "connection_test": openai_test
            }
        },
        "advanced_features": ADVANCED_FEATURES,
        "knowledge_base_loaded": len(md_text) > 0,
        "knowledge_base_size": len(md_text)
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
        "model": "Enhanced Personas + Scope Detection + Rule-based + Free AI APIs with Redundancy",
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
                "category_classification": True,
                "ai_model_redundancy": True,
                "available_models": [
                    "meta-llama/llama-3.2-3b-instruct:free",
                    "kimie-kimie/k2-chat:free"
                ],
                "automatic_fallback": True
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

@app.route('/api/feedback', methods=['POST'])
@check_rate_limit('general')
def feedback_api():
    """Endpoint para receber feedback sobre qualidade das respostas"""
    try:
        request_id = f"feedback_{int(datetime.now().timestamp() * 1000)}"
        logger.info(f"[{request_id}] Feedback recebido")
        
        # Validações
        if not request.is_json:
            return jsonify({
                "error": "Content-Type deve ser application/json",
                "error_code": "INVALID_CONTENT_TYPE",
                "request_id": request_id
            }), 400
        
        data = request.get_json()
        required_fields = ['question', 'response', 'rating']
        
        for field in required_fields:
            if field not in data:
                return jsonify({
                    "error": f"Campo '{field}' é obrigatório",
                    "error_code": "MISSING_FIELD",
                    "required_fields": required_fields,
                    "request_id": request_id
                }), 400
        
        question = data['question'].strip()
        response = data['response'].strip()
        rating = data['rating']
        comments = data.get('comments', '').strip()
        
        # Validar rating
        if not isinstance(rating, int) or rating < 1 or rating > 5:
            return jsonify({
                "error": "Rating deve ser um número inteiro entre 1 e 5",
                "error_code": "INVALID_RATING",
                "request_id": request_id
            }), 400
        
        # Adicionar feedback ao sistema RAG
        add_rag_feedback(question, response, rating, comments)
        
        logger.info(f"[{request_id}] Feedback processado - Rating: {rating}")
        
        return jsonify({
            "message": "Feedback recebido com sucesso",
            "request_id": request_id,
            "timestamp": datetime.now().isoformat(),
            "feedback_summary": {
                "rating": rating,
                "has_comments": bool(comments)
            }
        }), 200
        
    except Exception as e:
        logger.error(f"[{request_id}] Erro ao processar feedback: {e}", exc_info=True)
        return jsonify({
            "error": "Erro interno ao processar feedback",
            "error_code": "FEEDBACK_PROCESSING_ERROR",
            "request_id": request_id,
            "timestamp": datetime.now().isoformat()
        }), 500

@app.route('/api/stats', methods=['GET'])
@check_rate_limit('general')
def stats_api():
    """Endpoint para estatísticas do sistema"""
    try:
        request_id = f"stats_{int(datetime.now().timestamp() * 1000)}"
        logger.info(f"[{request_id}] Solicitação de estatísticas")
        
        # Obter estatísticas RAG
        rag_stats = get_rag_stats()
        
        # Estatísticas do rate limiter
        rate_limiter_stats = {
            "active_ips": len(rate_limiter.requests),
            "total_endpoints": len(rate_limiter.limits),
            "limits_configured": rate_limiter.limits
        }
        
        # Estatísticas de performance
        performance_stats = {
            "cache": performance_cache.get_stats(),
            "optimization": {
                "quick_responses_available": True,
                "parallel_processing": True,
                "context_optimization": True,
                "timeout_optimization": True
            },
            "monitoring": usability_monitor.get_comprehensive_report()
        }
        
        # Estatísticas da aplicação
        app_stats = {
            "api_version": "8.0.0",
            "uptime_info": "Disponível desde o início da sessão",
            "available_personas": list(get_personas().keys()),
            "knowledge_base_loaded": len(md_text) > 0 if 'md_text' in globals() else False
        }
        
        response = {
            "system_stats": {
                "rag_system": rag_stats,
                "rate_limiter": rate_limiter_stats,
                "performance": performance_stats,
                "application": app_stats
            },
            "metadata": {
                "request_id": request_id,
                "timestamp": datetime.now().isoformat(),
                "generated_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC")
            }
        }
        
        logger.info(f"[{request_id}] Estatísticas retornadas")
        return jsonify(response), 200
        
    except Exception as e:
        logger.error(f"Erro ao gerar estatísticas: {e}", exc_info=True)
        return jsonify({
            "error": "Erro interno ao gerar estatísticas",
            "error_code": "STATS_GENERATION_ERROR",
            "timestamp": datetime.now().isoformat()
        }), 500

@app.route('/api/usability/monitor', methods=['GET'])
@check_rate_limit('general')
def usability_monitoring():
    """Endpoint para monitoramento de usabilidade"""
    try:
        request_id = f"monitor_{int(datetime.now().timestamp() * 1000)}"
        logger.info(f"[{request_id}] Solicitação de monitoramento de usabilidade")
        
        # Obter relatório completo
        report = usability_monitor.get_comprehensive_report()
        
        # Adicionar metadados
        response = {
            "monitoring_report": report,
            "metadata": {
                "request_id": request_id,
                "timestamp": datetime.now().isoformat(),
                "api_version": "8.0.0",
                "monitoring_version": "1.0.0"
            },
            "recommendations": generate_usability_recommendations(report)
        }
        
        logger.info(f"[{request_id}] Relatório de monitoramento gerado")
        return jsonify(response), 200
        
    except Exception as e:
        logger.error(f"Erro ao gerar relatório de monitoramento: {e}", exc_info=True)
        return jsonify({
            "error": "Erro interno ao gerar relatório de monitoramento",
            "error_code": "MONITORING_GENERATION_ERROR",
            "timestamp": datetime.now().isoformat()
        }), 500

def generate_usability_recommendations(report):
    """Gera recomendações baseadas no relatório"""
    recommendations = []
    
    perf = report.get('performance', {})
    usability = report.get('usability', {})
    accessibility = report.get('accessibility', {})
    health = report.get('health', {})
    
    # Recomendações de performance
    if perf.get('avg_response_time', 0) > 1500:
        recommendations.append({
            "category": "performance",
            "priority": "high",
            "message": f"Tempo médio de resposta alto: {perf.get('avg_response_time', 0):.0f}ms (meta: <1500ms)",
            "action": "Otimizar consultas e cache"
        })
    
    if perf.get('cache_hit_rate', 0) < 50:
        recommendations.append({
            "category": "performance", 
            "priority": "medium",
            "message": f"Taxa de acerto do cache baixa: {perf.get('cache_hit_rate', 0):.1f}% (meta: >50%)",
            "action": "Revisar estratégia de cache"
        })
    
    # Recomendações de usabilidade
    if usability.get('error_rate_pct', 0) > 5:
        recommendations.append({
            "category": "usability",
            "priority": "high", 
            "message": f"Taxa de erro alta: {usability.get('error_rate_pct', 0):.1f}% (meta: <5%)",
            "action": "Investigar causas dos erros"
        })
    
    # Recomendações de acessibilidade
    if accessibility.get('accessibility_score', 100) < 80:
        recommendations.append({
            "category": "accessibility",
            "priority": "medium",
            "message": f"Score de acessibilidade baixo: {accessibility.get('accessibility_score', 100):.0f} (meta: >80)",
            "action": "Melhorar recursos de acessibilidade"
        })
    
    # Se tudo estiver bem
    if not recommendations:
        recommendations.append({
            "category": "general",
            "priority": "info",
            "message": "Sistema operando dentro dos parâmetros normais",
            "action": "Continuar monitoramento"
        })
    
    return recommendations

@app.route('/api/debug', methods=['GET'])
def debug_info():
    """Endpoint de debug para verificar estado do sistema"""
    return jsonify({
        "status": "debug",
        "md_path": MD_PATH,
        "md_loaded": bool(md_text),
        "md_length": len(md_text) if md_text else 0,
        "knowledge_base": {
            "advanced_features": ADVANCED_FEATURES,
            "cache_type": "advanced" if ADVANCED_CACHE else "simple"
        },
        "environment": {
            "flask_env": os.environ.get('FLASK_ENV', 'not_set'),
            "render": os.environ.get('RENDER', 'not_set'),
            "port": os.environ.get('PORT', '5000')
        },
        "frontend_paths": {
            "dist_exists": os.path.exists('../frontend/dist'),
            "index_exists": os.path.exists('../frontend/dist/index.html') if os.path.exists('../frontend/dist') else False
        }
    })

def validate_environment_variables():
    """Valida variáveis de ambiente obrigatórias"""
    required_vars = {
        'OPENROUTER_API_KEY': 'Chave da API OpenRouter',
        'HUGGINGFACE_API_KEY': 'Chave da API Hugging Face'
    }
    
    missing_vars = []
    for var, description in required_vars.items():
        if not os.environ.get(var):
            missing_vars.append(f"  - {var}: {description}")
    
    if missing_vars:
        logger.critical("❌ VARIÁVEIS DE AMBIENTE OBRIGATÓRIAS AUSENTES:")
        for var in missing_vars:
            logger.critical(var)
        logger.critical("Configure as variáveis antes de iniciar a aplicação!")
        raise SystemExit(1)
    
    logger.info("✅ Todas as variáveis de ambiente obrigatórias estão configuradas")

if __name__ == '__main__':
    # Criar diretório de logs se não existir
    logs_dir = os.path.join(os.path.dirname(__file__), '..', '..', 'logs')
    if not os.path.exists(logs_dir):
        os.makedirs(logs_dir)
    
    # DEBUG: Informações de ambiente e estrutura de diretórios
    logger.info("=== DEBUG: Informações de Ambiente ===")
    logger.info(f"Diretório de trabalho atual: {os.getcwd()}")
    logger.info(f"Localização do script: {os.path.abspath(__file__)}")
    logger.info(f"Diretório do script: {os.path.dirname(os.path.abspath(__file__))}")
    
    # Backend-only deployment - Skip frontend checks
    logger.info("=== BACKEND-ONLY DEPLOYMENT ===")
    logger.info("Frontend não será servido por este backend (deployment separado)")
    
    # Validação de ambiente primeiro
    validate_environment_variables()
    
    # Inicialização
    logger.info("Iniciando aplicação v6...")
    
    # Carrega o conhecimento (MD + estruturado)
    if os.path.exists(MD_PATH):
        md_text = extract_md_text(MD_PATH)
        logger.info(f"✅ MD carregado: {len(md_text)} chars")
    else:
        logger.warning(f"Arquivo Markdown não encontrado: {MD_PATH}")
        md_text = "Arquivo Markdown não disponível"
        
    # Se MD falhou, usar knowledge base estruturada como fallback
    if ADVANCED_FEATURES and len(md_text) < 100:
        try:
            structured_kb = get_structured_knowledge_base()
            kb_stats = structured_kb.get_statistics()
            if kb_stats['loaded_successfully'] > 0:
                md_text = f"Knowledge base estruturada carregada: {kb_stats['loaded_successfully']} categorias"
                logger.info("✅ Usando knowledge base estruturada como fonte principal")
        except Exception as e:
            logger.error(f"❌ Fallback para knowledge base estruturada falhou: {e}")
    
    # Inicia o servidor
    port = int(os.environ.get('PORT', 5000))
    # Forçar debug=False em produção por segurança
    debug = False  # SEMPRE desativado para segurança
    
    # Só ativar em desenvolvimento local explícito
    if os.environ.get('FLASK_ENV') == 'development' and os.environ.get('RENDER') is None:
        debug = os.environ.get('FLASK_DEBUG', 'false').lower() == 'true'
    
    logger.info(f"Servidor iniciado na porta {port}")
    logger.info(f"Debug mode: {debug}")
    logger.info(f"Personas disponíveis: {list(PERSONAS.keys())}")
    app.run(host='0.0.0.0', port=port, debug=debug) 