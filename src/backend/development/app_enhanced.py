#!/usr/bin/env python3
"""
Backend Completo para Validação Científica Rigorosa
Senior Clinical Pharmacist - Backend com funcionalidades completas baseadas na tese
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import re
import logging
from datetime import datetime
import json
from pathlib import Path

app = Flask(__name__)
CORS(app)

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Caminho para a base de conhecimento
MD_PATH = 'data/knowledge_base/Roteiro de Dsispensação - Hanseníase.md'
md_text = ""

# Personas completas
PERSONAS = {
    "dr_gasnelio": {
        "name": "Dr. Gasnelio",
        "style": "technical",
        "description": "Farmacêutico clínico especialista em hanseníase PQT-U",
        "system_prompt": "Você é Dr. Gasnelio, um farmacêutico clínico especialista em hanseníase com doutorado em dispensação farmacêutica. Responda sempre de forma técnica, precisa e científica, citando especificamente a tese e protocolos. Use terminologia médica apropriada e forneça informações detalhadas sobre dosagens, mecanismos de ação e protocolos."
    },
    "ga": {
        "name": "Gá",
        "style": "empathetic", 
        "description": "Farmacêutico empático que explica de forma simples",
        "system_prompt": "Você é Gá, um farmacêutico carinhoso e empático que explica sobre hanseníase de forma simples e acolhedora. Traduza termos técnicos para linguagem cotidiana, use analogias quando apropriado, e demonstre empatia com os pacientes. Mantenha sempre um tom caloroso e encorajador."
    }
}

def extract_md_text(md_path):
    """Extrai texto do arquivo Markdown"""
    try:
        with open(md_path, 'r', encoding='utf-8') as file:
            text = file.read()
        logger.info(f"Base de conhecimento carregada: {len(text)} caracteres")
        return text
    except Exception as e:
        logger.error(f"Erro ao carregar base de conhecimento: {e}")
        return ""

def find_relevant_context(question, full_text, max_length=4000):
    """Encontra contexto relevante na tese para a pergunta"""
    # Divide o texto em seções
    sections = full_text.split('\n## ')
    
    # Palavras-chave da pergunta
    question_words = set(re.findall(r'\w+', question.lower()))
    
    best_sections = []
    
    for section in sections:
        if len(section.strip()) < 100:
            continue
            
        section_words = set(re.findall(r'\w+', section.lower()))
        common_words = question_words.intersection(section_words)
        score = len(common_words) / len(question_words) if question_words else 0
        
        if score > 0.1:
            best_sections.append((section, score))
    
    # Ordena por relevância
    best_sections.sort(key=lambda x: x[1], reverse=True)
    
    context = ""
    for section, score in best_sections[:2]:  # Pega as 2 seções mais relevantes
        context += section + "\n\n"
        if len(context) > max_length:
            break
    
    return context[:max_length] if context else full_text[:max_length]

def detect_question_scope(question):
    """Detecta se a pergunta está no escopo da hanseníase PQT-U"""
    question_lower = question.lower()
    
    # Palavras-chave que indicam escopo da hanseníase
    hanseniase_keywords = [
        'hanseníase', 'hanseniase', 'lepra', 'pqt-u', 'pqt', 'poliquimioterapia',
        'rifampicina', 'clofazimina', 'dapsona', 'mycobacterium leprae',
        'dispensação', 'roteiro', 'medicamento', 'dose', 'tratamento'
    ]
    
    # Palavras que indicam fora do escopo
    out_of_scope_keywords = [
        'diabetes', 'hipertensão', 'covid', 'gripe', 'cancer', 'tuberculose',
        'pneumonia', 'hepatite', 'malaria', 'dengue', 'receita', 'bolo',
        'culinária', 'esporte', 'política', 'economia'
    ]
    
    # Verifica palavras de hanseníase
    hanseniase_score = sum(1 for keyword in hanseniase_keywords if keyword in question_lower)
    
    # Verifica palavras fora do escopo
    out_scope_score = sum(1 for keyword in out_of_scope_keywords if keyword in question_lower)
    
    # Determina se está no escopo
    is_in_scope = hanseniase_score > 0 and out_scope_score == 0
    
    # Determina categoria
    if 'dose' in question_lower or 'dosagem' in question_lower:
        category = 'dosage_inquiry'
    elif any(med in question_lower for med in ['rifampicina', 'clofazimina', 'dapsona']):
        category = 'medication_inquiry'
    elif 'efeito' in question_lower or 'reação' in question_lower:
        category = 'safety_inquiry'
    elif 'dispensação' in question_lower or 'farmácia' in question_lower:
        category = 'dispensing_inquiry'
    else:
        category = 'general_inquiry'
    
    confidence_level = 'high' if hanseniase_score >= 2 else 'medium' if hanseniase_score >= 1 else 'low'
    
    return {
        'is_in_scope': is_in_scope,
        'category': category,
        'confidence_level': confidence_level,
        'scope_score': hanseniase_score,
        'reasoning': f"Encontradas {hanseniase_score} palavras-chave de hanseníase, {out_scope_score} palavras fora do escopo"
    }

def get_limitation_response(persona, question):
    """Gera resposta de limitação quando pergunta está fora do escopo"""
    if persona == "dr_gasnelio":
        return f"""Dr. Gasnelio responde:

Como especialista em hanseníase PQT-U, devo informar que sua pergunta '{question}' está fora do meu escopo de conhecimento específico.

Minha expertise concentra-se exclusivamente em:
- Protocolos de dispensação para hanseníase PQT-U
- Dosagens de rifampicina, clofazimina e dapsona
- Farmácovigilância específica para estes medicamentos
- Procedimentos de dispensação farmacêutica para hanseníase

RECOMENDAÇÃO PROFISSIONAL: Para esta questão, consulte um profissional de saúde especializado na área específica de sua pergunta.

*Baseado na tese sobre roteiro de dispensação para hanseníase - Dr. Gasnelio*"""
    else:  # ga
        return f"""Oi! Aqui é o Gá! 😊

Olha, sua pergunta sobre '{question}' é muito interessante, mas eu sou especialista só em hanseníase e nos remédios PQT-U (rifampicina, clofazimina e dapsona)!

Eu sei tudinho sobre:
- Como tomar os remédios da hanseníase do jeito certo
- O que esperar durante o tratamento
- Como a farmácia deve explicar tudo direitinho
- Cuidados especiais com esses medicamentos

Para sua pergunta, o melhor é conversar com um profissional que entende dessa área específica, tá? Assim você vai ter a resposta mais certinha! 💙

*Gá - Especialista em hanseníase com muito carinho*"""

def generate_dr_gasnelio_response(question, context):
    """Gera resposta técnica para Dr. Gasnelio baseada na tese"""
    question_lower = question.lower()
    
    # Banco de respostas técnicas baseadas na tese
    technical_responses = {
        # Dosagens adultas
        'rifampicina adulto': """Dr. Gasnelio responde:

PROTOCOLO PQT-U ADULTO - RIFAMPICINA:

**DOSE SUPERVISIONADA MENSAL:**
- 2 x 300mg = 600mg total
- Administração: uma vez por mês, supervisionada

**DOSE MÁXIMA:** 600mg/dia
**POPULAÇÃO:** Adultos > 50kg
**DURAÇÃO:** 12 meses para hanseníase multibacilar

**MECANISMO DE AÇÃO:** 
Inibição da RNA polimerase bacteriana do Mycobacterium leprae, bloqueando a síntese de RNA.

**FARMÁCOVIGILÂNCIA:**
- Monitorar função hepática
- Observar coloração alaranjada da urina (normal)
- Atenção para hepatotoxicidade

**REFERÊNCIA:** Protocolo Clínico e Diretrizes Terapêuticas da Hanseníase (PCDT 2022) - Ministério da Saúde

*Resposta técnica baseada na tese sobre roteiro de dispensação para hanseníase.*""",

        'clofazimina adulto': """Dr. Gasnelio responde:

PROTOCOLO PQT-U ADULTO - CLOFAZIMINA:

**DOSE SUPERVISIONADA MENSAL:**
- 3 x 100mg = 300mg total
- Administração: uma vez por mês, supervisionada

**DOSE AUTOADMINISTRADA DIÁRIA:**
- 1 x 50mg/dia
- Administração: diariamente pelo próprio paciente

**DOSE MÁXIMA:** 300mg/dia
**POPULAÇÃO:** Adultos > 50kg

**MECANISMO DE AÇÃO:**
Liga-se ao DNA bacteriano, inibindo crescimento do Mycobacterium leprae.

**EFEITO ADVERSO CARACTERÍSTICO:**
Hiperpigmentação da pele (vermelho a castanho escuro) - reversível após descontinuação.

**ORIENTAÇÃO FARMACÊUTICA:**
- Tomar com alimentos
- Evitar suco de laranja (reduz absorção)
- Informar sobre pigmentação esperada

**REFERÊNCIA:** PCDT Hanseníase 2022 - Seção específica sobre clofazimina

*Resposta técnica Dr. Gasnelio baseada na tese de dispensação.*""",

        'dapsona adulto': """Dr. Gasnelio responde:

PROTOCOLO PQT-U ADULTO - DAPSONA:

**DOSE SUPERVISIONADA MENSAL:**
- 1 x 100mg
- Administração: uma vez por mês, supervisionada

**DOSE AUTOADMINISTRADA DIÁRIA:**
- 1 x 100mg/dia
- Administração: diariamente pelo próprio paciente

**DOSE MÁXIMA:** 100mg/dia
**POPULAÇÃO:** Adultos > 50kg

**MECANISMO DE AÇÃO:**
Antagonista do ácido para-aminobenzóico (PABA), interferindo na síntese do folato bacteriano.

**CONTRAINDICAÇÃO IMPORTANTE:**
Deficiência de G6PD (risco de anemia hemolítica grave)

**FARMÁCOVIGILÂNCIA:**
- Monitorar sinais de anemia hemolítica
- Observar icterícia, palidez, fadiga
- Atenção especial em populações de risco

**REFERÊNCIA:** PCDT Hanseníase 2022 - Protocolo específico dapsona

*Resposta técnica Dr. Gasnelio baseada na tese sobre roteiro de dispensação.*"""
    }
    
    # Busca resposta específica
    for key, response in technical_responses.items():
        if all(word in question_lower for word in key.split()):
            return response
    
    # Resposta genérica técnica
    return f"""Dr. Gasnelio responde:

Baseado na tese sobre roteiro de dispensação para hanseníase PQT-U, posso fornecer orientação técnica especializada sobre sua pergunta: '{question}'.

**CONTEXTO DA TESE:**
{context[:800]}...

**ANÁLISE FARMACOLÓGICA:**
Esta consulta requer análise específica dos protocolos estabelecidos no PCDT Hanseníase 2022. Para informações mais detalhadas sobre dosagens, interações e farmácovigilância, recomendo consultar a seção completa da pesquisa.

**RECOMENDAÇÃO PROFISSIONAL:**
Sempre seguir protocolos estabelecidos pelo Ministério da Saúde e realizar dispensação farmacêutica conforme roteiro padronizado.

*Resposta técnica baseada na tese - Dr. Gasnelio, especialista em hanseníase PQT-U*"""

def generate_ga_response(question, context):
    """Gera resposta empática para Gá"""
    question_lower = question.lower()
    
    # Banco de respostas empáticas
    empathetic_responses = {
        'urina laranja': """Oi! Aqui é o Gá! 😊

Entendo sua preocupação sobre a urina ficar laranja! É super normal ficar assustado quando isso acontece, mas pode ficar tranquilo(a)! 

**O que está acontecendo:**
A rifampicina (um dos seus remédios da hanseníase) deixa a urina numa cor laranja bem característica. É como se fosse um "sinal" de que o remédio está fazendo efeito!

**É normal mesmo?**
Sim! É completamente normal e esperado. Não é perigoso nem prejudicial. Muitas pessoas ficam assustadas no começo, mas é só o remédio saindo do organismo.

**Vai passar?**
Enquanto você estiver tomando o tratamento, a urina vai continuar assim. Quando terminar o tratamento, volta ao normal rapidinho!

**Dica importante:** Se você notar que a cor ficou muito diferente (tipo marrom escuro) ou se tiver dor, aí sim vale conversar com seu médico, tá?

Espero ter ajudado! Qualquer outra dúvida, estou aqui! 💙

*Gá - Explicando com carinho sobre hanseníase*""",

        'pele escura': """Oi! Sou o Gá! 😊

Sei que deve estar preocupado(a) com a pele ficando mais escura, né? Entendo perfeitamente essa preocupação!

**O que está acontecendo:**
É a clofazimina (um dos remédios do seu tratamento) que causa esse escurecimento. É tipo uma "marca temporária" que o remédio deixa.

**Por que isso acontece?**
A clofazimina se acumula na pele e deixa ela com uma cor mais avermelhada ou amarronzada. É assim mesmo que funciona!

**Vai melhorar?**
Sim! Depois que você terminar o tratamento, a cor vai clareando aos pouquinhos. Pode demorar alguns meses, mas volta ao normal!

**É em todo mundo?**
Não! Algumas pessoas escurecem mais, outras menos. Depende de cada organismo.

**Importante:** Continue o tratamento direitinho! A hanseníase precisa ser tratada completamente, e esse escurecimento é só temporário.

Você está cuidando da sua saúde, e isso é o mais importante! 💪

*Gá - Sempre aqui para te apoiar no tratamento*""",

        'medo remédio': """Oi! Aqui é o Gá! 😊

Primeiro, quero te dizer que é super normal sentir medo dos remédios. Muita gente fica preocupada no começo, e você não está sozinho(a) nisso!

**Vamos conversar sobre isso:**
Os remédios da hanseníase (rifampicina, clofazimina e dapsona) são seguros quando tomados do jeito certo. Milhares de pessoas já se curaram usando esses mesmos medicamentos!

**Por que não precisa ter medo:**
- São remédios estudados há muitos anos
- Os médicos sabem exatamente como usá-los
- Os efeitos colaterais são conhecidos e na maioria são leves
- O tratamento é acompanhado de pertinho

**O que você pode fazer:**
- Converse com seu médico sobre todas as suas preocupações
- Pergunte tudo que quiser saber
- Lembre-se: tratar a hanseníase é muito importante para sua saúde!

**Lembre-se:** Você é corajoso(a) por estar cuidando da sua saúde! Cada comprimido que você toma é um passo para ficar completamente curado(a)! 🌟

Estou aqui sempre que precisar de uma conversa! 💙

*Gá - Te apoiando com muito carinho*"""
    }
    
    # Busca resposta específica
    for key, response in empathetic_responses.items():
        if any(word in question_lower for word in key.split()):
            return response
    
    # Resposta genérica empática
    return f"""Oi! Aqui é o Gá! 😊

Que bom que você perguntou sobre '{question}'! Adoro poder ajudar com as dúvidas sobre hanseníase!

**Sobre sua pergunta:**
{context[:600]}...

**Explicando de forma simples:**
A hanseníase tem tratamento sim, e é muito eficaz! Os remédios (rifampicina, clofazimina e dapsona) trabalham juntos para curar completamente a doença.

**O que é importante você saber:**
- O tratamento dura 12 meses (1 aninho)
- Você vai tomar alguns remédios na farmácia (supervisionado) e outros em casa
- É super importante não parar o tratamento
- Qualquer dúvida, sempre converse com seu médico ou farmacêutico!

Lembre-se: você está no caminho certo para a cura! 🌟

*Gá - Sempre aqui para te apoiar!*"""

def answer_question(question, persona):
    """Responde à pergunta usando o sistema completo"""
    global md_text
    
    if not md_text:
        if persona == "dr_gasnelio":
            return {
                "answer": "Dr. Gasnelio informa: Base de conhecimento não disponível no momento. Favor verificar conectividade do sistema.",
                "persona": "dr_gasnelio",
                "confidence": 0.0,
                "name": "Dr. Gasnelio"
            }
        else:
            return {
                "answer": "Oi! Infelizmente não consigo acessar as informações no momento. Tente novamente em alguns instantes! 😊",
                "persona": "ga", 
                "confidence": 0.0,
                "name": "Gá"
            }
    
    try:
        # Detectar escopo
        scope_analysis = detect_question_scope(question)
        logger.info(f"Análise de escopo - No escopo: {scope_analysis['is_in_scope']}")
        
        # Se fora do escopo, resposta de limitação
        if not scope_analysis['is_in_scope']:
            limitation_response = get_limitation_response(persona, question)
            return {
                "answer": limitation_response,
                "persona": persona,
                "confidence": 0.9,
                "name": PERSONAS[persona]["name"],
                "scope_analysis": scope_analysis
            }
        
        # Encontrar contexto relevante
        context = find_relevant_context(question, md_text)
        
        # Gerar resposta baseada na persona
        if persona == "dr_gasnelio":
            response_text = generate_dr_gasnelio_response(question, context)
        else:  # ga
            response_text = generate_ga_response(question, context)
        
        # Determinar confiança
        confidence = 0.9 if scope_analysis['confidence_level'] == 'high' else 0.8 if scope_analysis['confidence_level'] == 'medium' else 0.7
        
        return {
            "answer": response_text,
            "persona": persona,
            "confidence": confidence,
            "name": PERSONAS[persona]["name"],
            "scope_analysis": scope_analysis
        }
        
    except Exception as e:
        logger.error(f"Erro ao processar pergunta: {e}")
        if persona == "dr_gasnelio":
            error_response = "Dr. Gasnelio informa: Erro técnico no processamento. Favor tentar novamente."
        else:
            error_response = "Oi! Deu um probleminha técnico aqui. Pode tentar perguntar de novo? 😊"
            
        return {
            "answer": error_response,
            "persona": persona,
            "confidence": 0.0,
            "name": PERSONAS[persona]["name"]
        }

# ENDPOINTS DA API

@app.route('/api/health', methods=['GET'])
def health_check():
    """Verificação de saúde da API"""
    return jsonify({
        "status": "healthy",
        "knowledge_base_loaded": len(md_text) > 0,
        "timestamp": datetime.now().isoformat(),
        "personas": list(PERSONAS.keys()),
        "api_version": "complete_1.0.0"
    })

@app.route('/api/chat', methods=['POST'])
def chat_api():
    """Endpoint principal para chat"""
    start_time = datetime.now()
    request_id = f"req_{int(start_time.timestamp() * 1000)}"
    
    try:
        # Validações
        if not request.is_json:
            return jsonify({
                "error": "Content-Type deve ser application/json",
                "error_code": "INVALID_CONTENT_TYPE",
                "request_id": request_id
            }), 400

        data = request.get_json()
        if not data:
            return jsonify({
                "error": "Payload vazio",
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

        personality_id = data.get('personality_id', '').strip().lower()
        if personality_id not in PERSONAS:
            return jsonify({
                "error": "Campo 'personality_id' deve ser 'dr_gasnelio' ou 'ga'",
                "error_code": "INVALID_PERSONA",
                "request_id": request_id
            }), 400

        # Processar pergunta
        response = answer_question(question, personality_id)
        
        # Adicionar metadados
        response.update({
            "request_id": request_id,
            "processing_time_ms": int((datetime.now() - start_time).total_seconds() * 1000),
            "timestamp": datetime.now().isoformat(),
            "api_version": "complete_1.0.0"
        })
        
        return jsonify(response), 200

    except Exception as e:
        logger.error(f"Erro crítico na API: {e}")
        return jsonify({
            "error": "Erro interno do servidor",
            "error_code": "INTERNAL_SERVER_ERROR",
            "request_id": request_id,
            "timestamp": datetime.now().isoformat()
        }), 500

@app.route('/api/personas', methods=['GET'])
def get_personas_api():
    """Endpoint para informações das personas"""
    return jsonify({
        "personas": PERSONAS,
        "metadata": {
            "total_personas": len(PERSONAS),
            "api_version": "complete_1.0.0",
            "timestamp": datetime.now().isoformat()
        }
    })

@app.route('/api/scope', methods=['POST'])
def scope_verification_api():
    """Endpoint para verificação de escopo"""
    try:
        if not request.is_json:
            return jsonify({"error": "Content-Type deve ser application/json"}), 400
        
        data = request.get_json()
        if not data or 'question' not in data:
            return jsonify({"error": "Campo 'question' é obrigatório"}), 400
        
        question = data['question'].strip()
        scope_analysis = detect_question_scope(question)
        
        return jsonify({
            "question": question,
            "in_scope": scope_analysis["is_in_scope"],
            "confidence": scope_analysis["confidence_level"],
            "category": scope_analysis["category"],
            "scope_score": scope_analysis["scope_score"],
            "reasoning": scope_analysis["reasoning"],
            "timestamp": datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Erro na verificação de escopo: {e}")
        return jsonify({"error": "Erro interno"}), 500

@app.route('/api/feedback', methods=['POST'])
def feedback_api():
    """Endpoint para feedback"""
    try:
        if not request.is_json:
            return jsonify({"error": "Content-Type deve ser application/json"}), 400
        
        data = request.get_json()
        required_fields = ['question', 'response', 'rating']
        
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Campo '{field}' é obrigatório"}), 400
        
        rating = data['rating']
        if not isinstance(rating, int) or rating < 1 or rating > 5:
            return jsonify({"error": "Rating deve ser entre 1 e 5"}), 400
        
        logger.info(f"Feedback recebido - Rating: {rating}")
        
        return jsonify({
            "message": "Feedback recebido com sucesso",
            "timestamp": datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Erro ao processar feedback: {e}")
        return jsonify({"error": "Erro interno"}), 500

@app.route('/api/stats', methods=['GET'])
def stats_api():
    """Endpoint para estatísticas"""
    return jsonify({
        "system_stats": {
            "api_version": "complete_1.0.0",
            "knowledge_base_loaded": len(md_text) > 0,
            "available_personas": list(PERSONAS.keys()),
            "uptime": "Desde o início da sessão"
        },
        "timestamp": datetime.now().isoformat()
    })

if __name__ == '__main__':
    # Inicialização
    logger.info("Iniciando Backend Completo para Validação Científica...")
    
    # Carregar base de conhecimento
    if os.path.exists(MD_PATH):
        md_text = extract_md_text(MD_PATH)
        logger.info("Base de conhecimento carregada com sucesso")
    else:
        logger.warning(f"Arquivo não encontrado: {MD_PATH}")
        md_text = ""
    
    # Iniciar servidor
    port = int(os.environ.get('PORT', 5001))  # Changed to port 5001 to avoid conflict
    logger.info(f"Backend completo iniciado na porta {port}")
    logger.info(f"Personas disponíveis: {list(PERSONAS.keys())}")
    app.run(host='0.0.0.0', port=port, debug=False)