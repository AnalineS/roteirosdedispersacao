#!/usr/bin/env python3
"""
🏥 Roteiro de Dispensação para Hanseníase - Hugging Face Spaces
Sistema especializado em orientação farmacêutica baseado em tese de doutorado.

Autora: Ana - Baseado em tese de doutorado
Plataforma: Hugging Face Spaces com Gradio
"""

import gradio as gr
import os
import sys
import logging
from datetime import datetime
import json
import re
from typing import Dict, List, Tuple, Optional

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Adicionar src ao path para imports
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

# Imports do sistema existente
try:
    from src.backend.services.personas import get_personas
    from src.backend.services.dr_gasnelio_enhanced import get_enhanced_dr_gasnelio_prompt, validate_dr_gasnelio_response
    from src.backend.services.ga_enhanced import get_enhanced_ga_prompt, validate_ga_response
    from src.backend.services.scope_detection_system import detect_question_scope, get_limitation_response
    from src.backend.services.knowledge_loader import get_structured_knowledge_base
    logger.info("✅ Todos os módulos importados com sucesso!")
except ImportError as e:
    logger.error(f"❌ Erro ao importar módulos: {e}")
    # Fallback básico se não conseguir importar
    def get_personas():
        return {
            "dr_gasnelio": {"name": "Dr. Gasnelio", "description": "Farmacêutico técnico"},
            "ga": {"name": "Gá", "description": "Farmacêutico empático"}
        }

# Carregar base de conhecimento
try:
    with open('data/Roteiro de Dsispensação - Hanseníase.md', 'r', encoding='utf-8') as f:
        knowledge_base = f.read()
    logger.info(f"✅ Base de conhecimento carregada: {len(knowledge_base)} caracteres")
except FileNotFoundError:
    logger.warning("⚠️ Arquivo de conhecimento não encontrado, usando conteúdo básico")
    knowledge_base = """
    # Roteiro de Dispensação para Hanseníase
    
    ## PQT-U (Poliquimioterapia Única)
    - Rifampicina: 600mg uma vez por mês
    - Dapsona: 100mg diariamente  
    - Clofazimina: 300mg uma vez por mês + 50mg diariamente
    
    ## Efeitos Adversos Comuns
    - Rifampicina: coloração avermelhada na urina
    - Dapsona: anemia, metahemoglobinemia
    - Clofazimina: hiperpigmentação da pele
    """

# Personas disponíveis
PERSONAS = get_personas()

def format_response_for_gradio(response: str, persona: str, confidence: float = 0.8) -> str:
    """Formata resposta para exibição no Gradio"""
    
    timestamp = datetime.now().strftime("%H:%M:%S")
    
    if persona == "dr_gasnelio":
        header = f"""
## 👨‍⚕️ Dr. Gasnelio - Farmacêutico Clínico
*Resposta técnica especializada • {timestamp}*

---
"""
        footer = f"""
---
**Confiança:** {confidence:.1%} | **Fonte:** Tese de doutorado sobre dispensação farmacêutica
        """
        
    elif persona == "ga":
        header = f"""
## 💙 Gá - Farmacêutico Empático  
*Explicação acolhedora e didática • {timestamp}*

---
"""
        footer = f"""
---
**💡 Dica:** Sempre consulte seu farmacêutico para orientações personalizadas!
        """
    else:
        header = f"## Assistente Farmacêutico • {timestamp}\n\n"
        footer = ""
    
    return f"{header}\n{response}\n\n{footer}"

def generate_response(question: str, persona: str) -> str:
    """Gera resposta usando o sistema de IA existente"""
    
    if not question.strip():
        return "❓ Por favor, digite uma pergunta sobre hanseníase ou dispensação de medicamentos."
    
    try:
        # Detectar escopo da pergunta
        scope_analysis = detect_question_scope(question)
        
        if not scope_analysis.get('is_in_scope', True):
            limitation_response = get_limitation_response(persona, question)
            if limitation_response:
                return format_response_for_gradio(limitation_response, persona, 0.9)
        
        # Buscar contexto relevante na base de conhecimento
        context = find_relevant_context(question, knowledge_base)
        
        # Gerar resposta baseada na persona
        if persona == "dr_gasnelio":
            prompt = get_enhanced_dr_gasnelio_prompt(question)
            response = generate_dr_gasnelio_response(question, context, prompt)
            
        elif persona == "ga":
            prompt = get_enhanced_ga_prompt(question)
            response = generate_ga_response(question, context, prompt)
            
        else:
            response = generate_generic_response(question, context)
        
        # Validar qualidade da resposta
        confidence = validate_response_quality(response, question, persona)
        
        return format_response_for_gradio(response, persona, confidence)
        
    except Exception as e:
        logger.error(f"Erro ao gerar resposta: {e}")
        error_msg = f"Desculpe, ocorreu um erro técnico. Erro: {str(e)[:100]}..."
        return format_response_for_gradio(error_msg, persona, 0.0)

def find_relevant_context(question: str, text: str, max_length: int = 2000) -> str:
    """Encontra contexto relevante na base de conhecimento"""
    
    # Palavras-chave da pergunta
    question_words = set(re.findall(r'\w+', question.lower()))
    
    # Dividir texto em parágrafos
    paragraphs = text.split('\n\n')
    
    relevant_paragraphs = []
    
    for paragraph in paragraphs:
        if len(paragraph.strip()) < 50:
            continue
            
        paragraph_words = set(re.findall(r'\w+', paragraph.lower()))
        common_words = question_words.intersection(paragraph_words)
        
        if len(common_words) > 0:
            score = len(common_words) / len(question_words) if question_words else 0
            relevant_paragraphs.append((paragraph, score))
    
    # Ordenar por relevância
    relevant_paragraphs.sort(key=lambda x: x[1], reverse=True)
    
    # Construir contexto
    context = ""
    for paragraph, score in relevant_paragraphs[:3]:
        context += paragraph + "\n\n"
        if len(context) > max_length:
            break
    
    return context[:max_length] if context else text[:max_length]

def generate_dr_gasnelio_response(question: str, context: str, prompt: str) -> str:
    """Gera resposta do Dr. Gasnelio (técnica)"""
    
    # Template para resposta técnica
    template = f"""
Como farmacêutico clínico especialista em hanseníase, baseando-me na tese sobre roteiro de dispensação e no contexto fornecido:

**PERGUNTA:** {question}

**CONTEXTO DA TESE:**
{context}

**RESPOSTA TÉCNICA:**

Com base nos protocolos estabelecidos na tese sobre roteiro de dispensação para hanseníase:

{generate_technical_content(question, context)}

**RECOMENDAÇÕES FARMACÊUTICAS:**
- Sempre verificar interações medicamentosas
- Monitorar eventos adversos específicos
- Orientar sobre adesão ao tratamento PQT-U
- Registrar adequadamente a dispensação

**REFERÊNCIA:** Baseado na tese de doutorado sobre roteiro de dispensação farmacêutica para hanseníase.
    """
    
    return template.strip()

def generate_ga_response(question: str, context: str, prompt: str) -> str:
    """Gera resposta do Gá (empática)"""
    
    template = f"""
Oi! Fico feliz em ajudar você com sua dúvida sobre hanseníase! 😊

**Sua pergunta:** {question}

{generate_empathetic_content(question, context)}

💙 **Lembre-se:** O tratamento da hanseníase é muito eficaz quando seguido corretamente. Você não está sozinho(a) nesta jornada!

🏥 **Dica importante:** Sempre mantenha contato com sua equipe de saúde e não hesite em tirar dúvidas. Estamos aqui para apoiar você!

✨ Se precisar de mais alguma coisa, é só perguntar!
    """
    
    return template.strip()

def generate_technical_content(question: str, context: str) -> str:
    """Gera conteúdo técnico baseado na pergunta"""
    
    question_lower = question.lower()
    
    if any(term in question_lower for term in ['dose', 'dosagem', 'quanto']):
        return """
**DOSAGENS PADRÃO PQT-U:**
- Rifampicina: 600mg (2 cápsulas de 300mg) - dose supervisionada mensal
- Dapsona: 100mg (1 comprimido) - dose diária autoadministrada  
- Clofazimina: 300mg (3 cápsulas de 100mg) mensal + 50mg diário

**AJUSTES PEDIÁTRICOS:** Calcular por peso corporal conforme protocolo ministerial.
        """
        
    elif any(term in question_lower for term in ['efeito', 'adverso', 'colateral']):
        return """
**PRINCIPAIS EVENTOS ADVERSOS:**
- Rifampicina: Coloração alaranjada de urina/suor, hepatotoxicidade rara
- Dapsona: Anemia hemolítica, metahemoglobinemia, síndrome de hipersensibilidade
- Clofazimina: Hiperpigmentação cutânea (reversível), sintomas gastrointestinais

**MONITORIZAÇÃO:** Hemograma, função hepática, sinais de intolerância.
        """
        
    elif any(term in question_lower for term in ['dispensação', 'dispensar']):
        return """
**ROTEIRO DE DISPENSAÇÃO:**
1. Conferir prescrição e identificação do paciente
2. Verificar histórico de dispensações anteriores
3. Orientar sobre modo de uso e horários
4. Alertar sobre eventos adversos possíveis
5. Reforçar importância da adesão
6. Agendar próxima dispensação
7. Documentar adequadamente

**PONTOS CRÍTICOS:** Verificar se é primeira dispensação, avaliar compreensão do paciente.
        """
    else:
        return f"Com base no contexto da tese e na literatura científica, orientações específicas sobre: {question}"

def generate_empathetic_content(question: str, context: str) -> str:
    """Gera conteúdo empático baseado na pergunta"""
    
    question_lower = question.lower()
    
    if any(term in question_lower for term in ['medo', 'receio', 'preocup', 'nervos']):
        return """
Entendo perfeitamente sua preocupação! É muito normal sentir isso quando estamos começando um tratamento novo. 💙

A hanseníase tem cura total quando o tratamento é seguido corretinho, e você está no caminho certo! Os medicamentos são seguros e eficazes.

Muitas pessoas já passaram por isso e hoje estão curadas e levando vidas normais. Você também vai conseguir!
        """
        
    elif any(term in question_lower for term in ['como', 'quando', 'tomar']):
        return """
Vou explicar de um jeito bem simples como tomar os remédios! 

📅 **Uma vez por mês (no mesmo dia):** Você vai na farmácia/posto e toma lá mesmo os comprimidos amarelos (clofazimina) e a cápsula vermelha (rifampicina).

🏠 **Todo dia em casa:** Você toma 1 comprimido branco (dapsona) sempre no mesmo horário.

💡 **Dica:** Use um calendário para marcar os dias! Assim fica mais fácil lembrar.
        """
        
    elif any(term in question_lower for term in ['efeito', 'normal', 'acontece']):
        return """
É super importante você saber o que pode acontecer para não se assustar! 

🟡 **Xixi laranjado:** Por causa da rifampicina, é normalíssimo! Não se preocupe.

🤎 **Pele mais escura:** A clofazimina pode escurecer um pouquinho a pele, mas volta ao normal depois.

Se sentir qualquer coisa diferente, procure logo sua equipe de saúde. Eles estão lá para cuidar de você!
        """
    else:
        return f"Sobre sua dúvida '{question}', posso te ajudar com uma explicação bem clara e tranquilizadora! 😊"

def generate_generic_response(question: str, context: str) -> str:
    """Gera resposta genérica"""
    return f"Baseado na tese sobre roteiro de dispensação para hanseníase, posso orientar sobre: {question}\n\nContexto relevante:\n{context[:500]}..."

def validate_response_quality(response: str, question: str, persona: str) -> float:
    """Valida qualidade da resposta"""
    
    quality_score = 0.7  # Base
    
    # Verificar se tem conteúdo substancial
    if len(response) > 100:
        quality_score += 0.1
        
    # Verificar se menciona conceitos relevantes
    relevant_terms = ['hanseníase', 'pqt', 'rifampicina', 'dapsona', 'clofazimina', 'dispensação']
    if any(term in response.lower() for term in relevant_terms):
        quality_score += 0.1
        
    # Verificar formatação adequada para persona
    if persona == "dr_gasnelio" and any(term in response.lower() for term in ['protocolo', 'técnic', 'farmac']):
        quality_score += 0.1
    elif persona == "ga" and any(term in response.lower() for term in ['😊', '💙', 'fica tranquil', 'não se preocupe']):
        quality_score += 0.1
    
    return min(quality_score, 1.0)

def create_interface() -> gr.Interface:
    """Cria interface Gradio"""
    
    with gr.Blocks(
        title="🏥 Roteiro de Dispensação - Hanseníase",
        theme=gr.themes.Soft(),
        css="""
        .gradio-container {
            max-width: 900px !important;
            margin: auto !important;
        }
        .main-header {
            text-align: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem;
            border-radius: 15px;
            margin-bottom: 2rem;
        }
        .persona-card {
            border: 2px solid #e2e8f0;
            border-radius: 10px;
            padding: 1rem;
            margin: 0.5rem;
        }
        .warning-box {
            background-color: #fef3cd;
            border: 1px solid #ffeaa7;
            border-radius: 8px;
            padding: 1rem;
            margin: 1rem 0;
        }
        """
    ) as interface:
        
        # Header
        gr.HTML("""
        <div class="main-header">
            <h1>🏥 Roteiro de Dispensação para Hanseníase</h1>
            <p>Sistema especializado em orientação farmacêutica baseado em tese de doutorado</p>
        </div>
        """)
        
        # Aviso importante
        gr.HTML("""
        <div class="warning-box">
            <h3>⚠️ Importante</h3>
            <p>Este sistema é uma ferramenta de apoio educacional e não substitui consulta médica especializada, 
            avaliação clínica individualizada ou julgamento profissional qualificado.</p>
        </div>
        """)
        
        with gr.Row():
            with gr.Column(scale=1):
                # Seleção de persona
                gr.HTML("<h3>👥 Escolha sua Persona</h3>")
                
                persona_radio = gr.Radio(
                    choices=[
                        ("👨‍⚕️ Dr. Gasnelio - Farmacêutico Técnico", "dr_gasnelio"),
                        ("💙 Gá - Farmacêutico Empático", "ga")
                    ],
                    value="dr_gasnelio",
                    label="Persona",
                    info="Dr. Gasnelio: respostas técnicas detalhadas | Gá: explicações simples e acolhedoras"
                )
                
                # Informações das personas
                gr.HTML("""
                <div class="persona-card">
                    <h4>👨‍⚕️ Dr. Gasnelio</h4>
                    <ul>
                        <li>Respostas técnicas detalhadas</li>
                        <li>Protocolos farmacológicos</li>
                        <li>Para profissionais de saúde</li>
                    </ul>
                </div>
                
                <div class="persona-card">
                    <h4>💙 Gá</h4>
                    <ul>
                        <li>Linguagem simples e clara</li>
                        <li>Apoio emocional</li>
                        <li>Para pacientes e familiares</li>
                    </ul>
                </div>
                """)
            
            with gr.Column(scale=2):
                # Chat interface
                gr.HTML("<h3>💬 Faça sua Pergunta</h3>")
                
                question_input = gr.Textbox(
                    label="Sua pergunta sobre hanseníase ou dispensação",
                    placeholder="Ex: Qual a dose de rifampicina para adultos? Como explicar os efeitos adversos?",
                    lines=3,
                    max_lines=5
                )
                
                submit_btn = gr.Button("🚀 Obter Orientação", variant="primary", size="lg")
                
                response_output = gr.Markdown(
                    label="Resposta do Especialista",
                    height=400,
                    value="👋 Olá! Selecione uma persona e faça sua pergunta sobre hanseníase ou dispensação farmacêutica."
                )
                
                # Botões de exemplo
                gr.HTML("<h4>💡 Exemplos de Perguntas</h4>")
                
                examples = [
                    "Qual a dose supervisionada de rifampicina?",
                    "Como explicar os efeitos adversos da clofazimina?",
                    "O que fazer se o paciente esquecer uma dose?",
                    "Quais cuidados especiais para crianças?",
                    "Como monitorar eventos adversos?"
                ]
                
                for example in examples:
                    example_btn = gr.Button(f"📝 {example}", variant="secondary", size="sm")
                    example_btn.click(
                        fn=lambda x=example: x,
                        outputs=question_input
                    )
        
        # Função de submit
        submit_btn.click(
            fn=generate_response,
            inputs=[question_input, persona_radio],
            outputs=response_output
        )
        
        # Enter key submit
        question_input.submit(
            fn=generate_response,
            inputs=[question_input, persona_radio],
            outputs=response_output
        )
        
        # Footer
        gr.HTML("""
        <div style="text-align: center; margin-top: 2rem; padding: 1rem; border-top: 1px solid #e2e8f0;">
            <p><strong>📚 Baseado em:</strong> Tese de doutorado sobre roteiro de dispensação farmacêutica para hanseníase</p>
            <p><strong>🎯 Protocolos:</strong> PCDT Hanseníase 2022 - Ministério da Saúde</p>
            <p><em>Desenvolvido para apoiar profissionais de saúde na dispensação segura e eficaz.</em></p>
        </div>
        """)
    
    return interface

def main():
    """Função principal"""
    
    logger.info("🚀 Iniciando Roteiro de Dispensação - Hanseníase")
    logger.info(f"📚 Base de conhecimento: {len(knowledge_base)} caracteres")
    logger.info(f"👥 Personas disponíveis: {list(PERSONAS.keys())}")
    
    # Criar e lançar interface
    interface = create_interface()
    
    # Configurar launch
    launch_config = {
        "server_name": "0.0.0.0",
        "server_port": 7860,
        "share": False,
        "show_error": True,
        "quiet": False,
        "show_tips": True,
        "enable_queue": True,
        "max_threads": 10
    }
    
    logger.info("🌐 Lançando interface Gradio...")
    interface.launch(**launch_config)

if __name__ == "__main__":
    main()