#!/usr/bin/env python3
"""
Backend Flask Simplificado para Testes de Integração
Engenheiro de Integração Full-Stack Sênior especializado em Sistemas Médicos

Versão simplificada do backend para testar integração com frontend.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import logging
from datetime import datetime
import json

app = Flask(__name__)
CORS(app)

# Configuração de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Personas simplificadas para teste
PERSONAS = {
    "dr_gasnelio": {
        "name": "Dr. Gasnelio",
        "description": "Farmacêutico clínico especialista em hanseníase PQT-U",
        "avatar": "Dr",
        "greeting": "Olá! Sou o Dr. Gasnelio, especialista em PQT-U. Como posso ajudar com questões técnicas sobre dispensação?",
        "system_prompt": "Você é um farmacêutico especialista em hanseníase PQT-U.",
        "role": "Especialista Técnico",
        "capabilities": [
            "Respostas técnicas precisas",
            "Validação farmacológica",
            "Citações científicas",
            "Protocolos especializados"
        ],
        "example_questions": [
            "Qual a dose de rifampicina para adultos?",
            "Como proceder em caso de hepatotoxicidade?",
            "Quais são as contraindicações da clofazimina?"
        ],
        "limitations": {
            "scope": "Exclusivamente hanseníase PQT-U",
            "not_covered": ["Diagnóstico", "Outras doenças", "Emergências médicas"],
            "redirects_to": {
                "diagnosis": "médico especialista",
                "emergencies": "atendimento médico imediato"
            }
        }
    },
    "ga": {
        "name": "Gá",
        "description": "Assistente empático que traduz informações técnicas em linguagem acessível",
        "avatar": "Gá",
        "greeting": "Oi! Sou a Gá! 😊 Estou aqui para explicar tudo sobre os remédios de uma forma mais fácil de entender!",
        "system_prompt": "Você é uma assistente empática que explica conceitos médicos de forma simples.",
        "role": "Comunicadora Empática",
        "capabilities": [
            "Linguagem simples e acessível",
            "Tradução de termos técnicos",
            "Suporte emocional",
            "Analogias práticas"
        ],
        "example_questions": [
            "Por que o xixi fica laranja?",
            "É normal a pele escurecer?",
            "Como tomar os remédios corretamente?"
        ],
        "limitations": {
            "scope": "Informações sobre hanseníase PQT-U de forma simples",
            "not_covered": ["Diagnóstico", "Outras doenças", "Emergências médicas"],
            "redirects_to": {
                "diagnosis": "médico especialista",
                "emergencies": "atendimento médico imediato"
            }
        }
    }
}

def generate_mock_response(question: str, persona: str) -> dict:
    """Gera resposta mock baseada na persona"""
    
    if persona == "dr_gasnelio":
        return {
            "answer": f"Dr. Gasnelio responde:\n\nBased em protocolos técnicos da tese sobre PQT-U, posso informar que sua pergunta '{question}' requer análise farmacológica específica. Para dosagens de rifampicina em adultos, o protocolo estabelece 600mg mensais supervisionadas. Esta informação é baseada na seção específica da tese de referência.\n\n*Resposta técnica baseada em evidências científicas da pesquisa sobre roteiro de dispensação para hanseníase.*",
            "persona": "dr_gasnelio",
            "confidence": 0.85,
            "name": "Dr. Gasnelio"
        }
    else:  # ga
        return {
            "answer": f"Oi! Aqui é a Gá! 😊\n\nSobre sua pergunta '{question}', posso te explicar de um jeito mais fácil! Os remédios para hanseníase são especiais e cada um tem sua função. A rifampicina, por exemplo, pode deixar o xixi laranjinha - isso é normal e mostra que o remédio está funcionando! O importante é tomar tudo direitinho como o médico explicou.\n\n*Essa explicação veio da pesquisa científica, mas falei do meu jeito pra ficar mais claro! Se quiser saber mais alguma coisa, é só perguntar! 💊*",
            "persona": "ga", 
            "confidence": 0.90,
            "name": "Gá"
        }

@app.route('/api/health', methods=['GET'])
def health_check():
    """Verificação de saúde da API"""
    return jsonify({
        "status": "healthy",
        "pdf_loaded": True,
        "timestamp": datetime.now().isoformat(),
        "personas": list(PERSONAS.keys()),
        "version": "integration-test-1.0"
    })

@app.route('/api/personas', methods=['GET'])
def get_personas_api():
    """Endpoint para informações das personas"""
    try:
        request_id = f"personas_{int(datetime.now().timestamp() * 1000)}"
        logger.info(f"[{request_id}] Solicitação de informações das personas")
        
        response = {
            "personas": PERSONAS,
            "metadata": {
                "total_personas": len(PERSONAS),
                "available_persona_ids": list(PERSONAS.keys()),
                "api_version": "integration-test-1.0",
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
        logger.error(f"Erro ao obter informações das personas: {e}")
        return jsonify({
            "error": "Erro ao carregar informações das personas",
            "error_code": "PERSONAS_LOAD_ERROR",
            "timestamp": datetime.now().isoformat()
        }), 500

@app.route('/api/chat', methods=['POST'])
def chat_api():
    """Endpoint principal para interação com chatbot"""
    start_time = datetime.now()
    request_id = f"req_{int(start_time.timestamp() * 1000)}"
    
    try:
        logger.info(f"[{request_id}] Nova requisição de chat recebida")
        
        # Validação de Content-Type
        if not request.is_json:
            logger.warning(f"[{request_id}] Content-Type inválido")
            return jsonify({
                "error": "Content-Type deve ser application/json",
                "error_code": "INVALID_CONTENT_TYPE",
                "request_id": request_id
            }), 400

        data = request.get_json()
        if not data:
            return jsonify({
                "error": "Payload deve ser um objeto JSON não vazio",
                "error_code": "EMPTY_PAYLOAD",
                "request_id": request_id
            }), 400

        # Validação da pergunta
        question = data.get('question', '').strip()
        if not question:
            return jsonify({
                "error": "Campo 'question' é obrigatório e não pode estar vazio",
                "error_code": "MISSING_QUESTION",
                "request_id": request_id
            }), 400
        
        # Validação da persona
        personality_id = data.get('personality_id', '').strip().lower()
        if personality_id not in PERSONAS:
            return jsonify({
                "error": "Campo 'personality_id' deve ser um dos valores válidos",
                "error_code": "INVALID_PERSONA",
                "request_id": request_id,
                "valid_personas": list(PERSONAS.keys()),
                "received": personality_id
            }), 400

        logger.info(f"[{request_id}] Processando - Persona: {personality_id}, Pergunta: {len(question)} chars")
        
        # Gerar resposta mock
        response = generate_mock_response(question, personality_id)
        
        # Adicionar metadados
        response.update({
            "request_id": request_id,
            "processing_time_ms": int((datetime.now() - start_time).total_seconds() * 1000),
            "timestamp": datetime.now().isoformat(),
            "api_version": "integration-test-1.0"
        })
        
        processing_time = (datetime.now() - start_time).total_seconds() * 1000
        logger.info(f"[{request_id}] Resposta gerada - Tempo: {processing_time:.1f}ms")
        
        return jsonify(response), 200

    except Exception as e:
        processing_time = (datetime.now() - start_time).total_seconds() * 1000
        logger.error(f"[{request_id}] Erro na API de chat: {str(e)}, Tempo: {processing_time:.1f}ms")
        
        return jsonify({
            "error": "Erro interno do servidor",
            "error_code": "INTERNAL_SERVER_ERROR",
            "request_id": request_id,
            "timestamp": datetime.now().isoformat()
        }), 500

@app.route('/api/scope', methods=['GET', 'POST'])
def scope_verification_api():
    """Endpoint para verificação de escopo"""
    try:
        request_id = f"scope_{int(datetime.now().timestamp() * 1000)}"
        
        if request.method == 'GET':
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
                            "Doses supervisionadas e autoadministradas"
                        ]
                    },
                    "explicitly_not_covered": [
                        "Diagnóstico de hanseníase",
                        "Outras doenças ou tratamentos"
                    ]
                },
                "confidence_levels": {
                    "high": "Protocolos PQT-U padrão, doses, efeitos adversos comuns",
                    "medium": "Variações populacionais, casos especiais",
                    "low": "Situações não explicitamente abordadas"
                },
                "metadata": {
                    "api_version": "integration-test-1.0",
                    "request_id": request_id,
                    "timestamp": datetime.now().isoformat()
                }
            }
            return jsonify(scope_info), 200
            
        else:  # POST
            data = request.get_json()
            if not data or 'question' not in data:
                return jsonify({
                    "error": "Campo 'question' é obrigatório",
                    "error_code": "MISSING_QUESTION",
                    "request_id": request_id
                }), 400
            
            question = data['question'].strip().lower()
            
            # Análise mock de escopo
            is_in_scope = any(keyword in question for keyword in [
                'rifampicina', 'clofazimina', 'dapsona', 'pqt', 'hanseníase', 
                'dose', 'medicamento', 'tratamento', 'dispensação'
            ])
            
            response = {
                "question": data['question'],
                "analysis": {
                    "is_in_scope": is_in_scope,
                    "confidence_level": "high" if is_in_scope else "low",
                    "category": "medication_inquiry" if is_in_scope else "out_of_scope",
                    "scope_score": 0.9 if is_in_scope else 0.1,
                    "reasoning": "Pergunta relacionada aos medicamentos PQT-U" if is_in_scope else "Pergunta fora do escopo de hanseníase"
                },
                "recommendation": {
                    "can_answer": is_in_scope,
                    "suggested_persona": "dr_gasnelio" if is_in_scope else None
                },
                "metadata": {
                    "request_id": request_id,
                    "timestamp": datetime.now().isoformat(),
                    "api_version": "integration-test-1.0"
                }
            }
            
            return jsonify(response), 200
            
    except Exception as e:
        logger.error(f"Erro na verificação de escopo: {e}")
        return jsonify({
            "error": "Erro interno na verificação de escopo",
            "error_code": "SCOPE_VERIFICATION_ERROR",
            "timestamp": datetime.now().isoformat()
        }), 500

@app.route('/api/feedback', methods=['POST'])
def feedback_api():
    """Endpoint para receber feedback"""
    try:
        request_id = f"feedback_{int(datetime.now().timestamp() * 1000)}"
        
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
        
        rating = data['rating']
        if not isinstance(rating, int) or rating < 1 or rating > 5:
            return jsonify({
                "error": "Rating deve ser um número inteiro entre 1 e 5",
                "error_code": "INVALID_RATING",
                "request_id": request_id
            }), 400
        
        logger.info(f"[{request_id}] Feedback processado - Rating: {rating}")
        
        return jsonify({
            "message": "Feedback recebido com sucesso",
            "request_id": request_id,
            "timestamp": datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Erro ao processar feedback: {e}")
        return jsonify({
            "error": "Erro interno ao processar feedback",
            "error_code": "FEEDBACK_PROCESSING_ERROR",
            "timestamp": datetime.now().isoformat()
        }), 500

@app.route('/api/stats', methods=['GET'])
def stats_api():
    """Endpoint para estatísticas do sistema"""
    try:
        request_id = f"stats_{int(datetime.now().timestamp() * 1000)}"
        
        response = {
            "system_stats": {
                "rag_system": {
                    "total_feedback": 42,
                    "average_rating": 4.2,
                    "rating_distribution": {1: 1, 2: 2, 3: 5, 4: 15, 5: 19},
                    "cache_stats": {
                        "cached_responses": 125,
                        "max_cache_size": 1000
                    }
                },
                "rate_limiter": {
                    "active_ips": 3,
                    "total_endpoints": 6,
                    "limits_configured": {
                        "chat": {"max_requests": 30, "window_minutes": 1},
                        "general": {"max_requests": 100, "window_minutes": 1}
                    }
                },
                "application": {
                    "api_version": "integration-test-1.0",
                    "uptime_info": "Disponível desde o início da sessão",
                    "available_personas": list(PERSONAS.keys()),
                    "knowledge_base_loaded": True
                }
            },
            "metadata": {
                "request_id": request_id,
                "timestamp": datetime.now().isoformat()
            }
        }
        
        return jsonify(response), 200
        
    except Exception as e:
        logger.error(f"Erro ao gerar estatísticas: {e}")
        return jsonify({
            "error": "Erro interno ao gerar estatísticas",
            "error_code": "STATS_GENERATION_ERROR",
            "timestamp": datetime.now().isoformat()
        }), 500

if __name__ == '__main__':
    logger.info("Iniciando servidor backend simplificado para testes de integração...")
    
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    
    logger.info(f"Servidor iniciado na porta {port}")
    logger.info(f"Personas disponíveis: {list(PERSONAS.keys())}")
    
    app.run(host='0.0.0.0', port=port, debug=debug)