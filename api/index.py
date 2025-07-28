from flask import Flask, jsonify, request
from flask_cors import CORS
import re
import html

app = Flask(__name__)

# Configuração CORS para Vercel
CORS(app, 
     origins=["https://siteroteirodedispersacao.vercel.app", "http://localhost:3000"],
     methods=['GET', 'POST', 'OPTIONS'],
     allow_headers=['Content-Type', 'Authorization'])

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
    
    # Default response
    return jsonify({
        "message": "Roteiro de Dispensação API - Vercel",
        "version": "9.0.0", 
        "status": "online",
        "endpoints": {
            "health": "/api/health",
            "personas": "/api/personas",
            "chat": "/api/chat (POST)"
        },
        "path_requested": request.path
    })

def generate_simple_response(question, persona):
    """Gera resposta baseada em regras simples"""
    question_lower = question.lower()
    
    # Respostas baseadas em palavras-chave
    keyword_responses = {
        "hanseníase": {
            "dr_gasnelio": "A hanseníase é uma doença infecciosa crônica causada pelo Mycobacterium leprae. O tratamento segue protocolos específicos da OMS com poliquimioterapia (PQT).",
            "ga": "A hanseníase é uma doença que tem cura! O importante é seguir o tratamento direitinho. Vou te explicar de forma simples como funciona! 😊"
        },
        "dispensação": {
            "dr_gasnelio": "A dispensação farmacêutica deve seguir as boas práticas, incluindo orientação sobre posologia, interações medicamentosas e adesão ao tratamento.",
            "ga": "Na dispensação, a gente explica como tomar o remédio, os horários certinhos e tira todas as suas dúvidas. É super importante! 👍"
        },
        "medicamento": {
            "dr_gasnelio": "Os medicamentos para hanseníase incluem rifampicina, dapsona e clofazimina, combinados conforme o esquema terapêutico indicado.",
            "ga": "Os remédios para hanseníase são bem específicos. Cada um tem sua função especial para curar a doença. Vou te explicar cada um! 💊"
        },
        "efeito": {
            "dr_gasnelio": "Os efeitos adversos mais comuns incluem alterações gastrointestinais, reações cutâneas e possível hepatotoxicidade. Monitore sempre.",
            "ga": "Alguns remédios podem dar uns efeitos chatos, como enjoo ou mudança na cor da pele. Mas não se preocupe, é normal e passa! 😌"
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

# Para Vercel
if __name__ == '__main__':
    app.run()