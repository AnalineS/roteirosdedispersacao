from flask import Flask, jsonify, request
from flask_cors import CORS
import re
import html
from datetime import datetime, timedelta
from collections import defaultdict

app = Flask(__name__)

# Configuração CORS para Vercel
CORS(app, 
     origins=["https://siteroteirodedispersacao.vercel.app", "http://localhost:3000"],
     methods=['GET', 'POST', 'OPTIONS'],
     allow_headers=['Content-Type', 'Authorization'])

# Rate limiting simples
rate_limit_storage = defaultdict(list)
RATE_LIMIT_MAX = 30  # 30 requests per minute
RATE_LIMIT_WINDOW = 60  # seconds

def check_rate_limit(client_ip):
    """Verifica rate limiting"""
    now = datetime.now()
    window_start = now - timedelta(seconds=RATE_LIMIT_WINDOW)
    
    # Limpar requests antigos
    rate_limit_storage[client_ip] = [req_time for req_time in rate_limit_storage[client_ip] if req_time > window_start]
    
    # Verificar limite
    if len(rate_limit_storage[client_ip]) >= RATE_LIMIT_MAX:
        return False
    
    # Adicionar nova request
    rate_limit_storage[client_ip].append(now)
    return True

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
            "timestamp": "2025-01-28"
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
                # Rate limiting
                client_ip = request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr) or 'unknown'
                if not check_rate_limit(client_ip):
                    return jsonify({
                        "error": "Rate limit excedido. Tente novamente em 1 minuto.",
                        "error_code": "RATE_LIMIT_EXCEEDED"
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
                
                # Sanitização básica
                question = html.escape(question)
                if len(question) > 500:
                    return jsonify({"error": "Pergunta muito longa (máximo 500 caracteres)"}), 400
                
                # Resposta baseada em regras simples
                response = generate_simple_response(question, personality_id)
                
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
    
    # Drug interactions endpoint
    if request.path.endswith('/interactions') or path == 'interactions':
        if request.method == 'POST':
            try:
                data = request.get_json()
                if not data:
                    return jsonify({"error": "JSON payload required"}), 400
                
                medications = data.get('medications', [])
                if not medications or not isinstance(medications, list):
                    return jsonify({"error": "Lista de medicamentos obrigatória"}), 400
                
                interactions = check_drug_interactions(medications)
                
                return jsonify({
                    "medications_checked": medications,
                    "interactions_found": len(interactions),
                    "interactions": interactions,
                    "timestamp": "2025-01-28",
                    "api_version": "9.0.0"
                })
                
            except Exception as e:
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

def generate_simple_response(question, persona):
    """Gera resposta baseada em regras simples"""
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
        # Resposta padrão
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

# Para Vercel
if __name__ == '__main__':
    app.run()