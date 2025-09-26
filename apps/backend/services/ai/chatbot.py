# -*- coding: utf-8 -*-
import os
import json
import logging
import time
from typing import Dict, List, Optional, Tuple
from datetime import datetime
import requests
from pathlib import Path
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from config.personas import get_persona_by_id

# OTIMIZAÇÃO CRÍTICA: Sistema de auditoria médica
from core.security.medical_audit_logger import (
    medical_audit_logger,
    ActionType,
    MedicalDataClassification
)

# Analytics médico interno (SQLite + Google Storage)
try:
    from services.analytics.medical_analytics_service import get_analytics_service
    analytics_service = get_analytics_service()
except ImportError:
    logger.warning("Medical analytics service not available")
    analytics_service = None

logger = logging.getLogger(__name__)


class ChatbotService:
    """Serviço de chatbot com RAG (Retrieval-Augmented Generation)"""
    
    def __init__(self, knowledge_base_path: str = "data/knowledge-base"):
        self.knowledge_base_path = Path(knowledge_base_path)
        self.knowledge_documents = []
        self.vectorizer = TfidfVectorizer(max_features=1000)
        self.document_vectors = None
        
        # Configurações OpenRouter - APIs com redundância
        self.openrouter_api_key = os.getenv("OPENROUTER_API_KEY")
        self.openrouter_url = "https://openrouter.ai/api/v1/chat/completions"
        
        # Modelos com redundância (ordem de prioridade)
        self.models = [
            "meta-llama/llama-3.2-3b-instruct:free",  # Primário
            "kimie-kimie/k2-chat:free"                 # Redundância
        ]
        self.current_model_index = 0
        
        # Carregar base de conhecimento
        self._load_knowledge_base()
    
    def _load_knowledge_base(self):
        """Carrega documentos da base de conhecimento"""
        try:
            if not self.knowledge_base_path.exists():
                logger.warning(f"Base de conhecimento não encontrada em {self.knowledge_base_path}")
                return
            
            # Carregar todos os arquivos .txt, .md e .json da pasta
            for file_path in self.knowledge_base_path.rglob("*"):
                if file_path.suffix in [".txt", ".md", ".json"]:
                    try:
                        if file_path.suffix == ".json":
                            with open(file_path, "r", encoding="utf-8") as f:
                                data = json.load(f)
                                # Converter JSON em texto
                                content = json.dumps(data, ensure_ascii=False, indent=2)
                        else:
                            with open(file_path, "r", encoding="utf-8") as f:
                                content = f.read()
                        
                        self.knowledge_documents.append({
                            "file": str(file_path.relative_to(self.knowledge_base_path)),
                            "content": content
                        })
                    except Exception as e:
                        logger.error(f"Erro ao carregar {file_path}: {e}")
            
            # Vetorizar documentos se houver conteúdo
            if self.knowledge_documents:
                contents = [doc["content"] for doc in self.knowledge_documents]
                self.document_vectors = self.vectorizer.fit_transform(contents)
                logger.info(f"Base de conhecimento carregada: {len(self.knowledge_documents)} documentos")
            
        except Exception as e:
            logger.error(f"Erro ao carregar base de conhecimento: {e}")
    
    def _search_knowledge_base(self, query: str, top_k: int = 3) -> List[Dict]:
        """Busca documentos relevantes na base de conhecimento com cache otimizado"""
        if not self.knowledge_documents or self.document_vectors is None:
            return []
        
        try:
            # OTIMIZAÇÃO CRÍTICA: Cache de vetorização com hash da query
            import hashlib
            from functools import lru_cache
            
            query_normalized = query.lower().strip()
            # SHA-256 for cache keys (not sensitive data, but using secure hash for consistency)
            query_hash = hashlib.sha256(query_normalized.encode()).hexdigest()
            
            # Cache em memória para queries similares
            if not hasattr(self, '_query_cache'):
                self._query_cache = {}
            
            if query_hash in self._query_cache:
                logger.debug(f"Cache hit para query: {query[:50]}...")
                return self._query_cache[query_hash]
            
            # Vetorizar query (única vez por query única)
            query_vector = self.vectorizer.transform([query_normalized])
            
            # OTIMIZAÇÃO: Calcular similaridade de forma mais eficiente
            similarities = cosine_similarity(query_vector, self.document_vectors).flatten()
            
            # OTIMIZAÇÃO: Usar argpartition para top-k mais eficiente O(n) vs O(n log n)
            if len(similarities) > top_k:
                top_indices = np.argpartition(similarities, -top_k)[-top_k:]
                top_indices = top_indices[np.argsort(similarities[top_indices])[::-1]]
            else:
                top_indices = np.argsort(similarities)[::-1]
            
            relevant_docs = []
            for idx in top_indices:
                if similarities[idx] > 0.1:  # Threshold mínimo de similaridade
                    relevant_docs.append({
                        "file": self.knowledge_documents[idx]["file"],
                        "content": self.knowledge_documents[idx]["content"][:500],  # Primeiros 500 chars
                        "similarity": float(similarities[idx])
                    })
            
            # Cache resultado (limite de 100 queries para evitar vazamento de memória)
            if len(self._query_cache) > 100:
                # Remove oldest 25% entries
                oldest_keys = list(self._query_cache.keys())[:25]
                for key in oldest_keys:
                    del self._query_cache[key]
            
            self._query_cache[query_hash] = relevant_docs
            logger.debug(f"Cache miss - processado e armazenado: {query[:50]}...")
            
            return relevant_docs
        
        except Exception as e:
            logger.error(f"Erro na busca: {e}")
            return []
    
    def _call_openrouter_api(self, messages: List[Dict], temperature: float = 0.7) -> Optional[str]:
        """Chama a API do OpenRouter com redundância entre modelos"""
        if not self.openrouter_api_key:
            logger.warning("API key do OpenRouter não configurada")
            return None
        
        headers = {
            "Authorization": f"Bearer {self.openrouter_api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://github.com/roteiro-dispensacao",
            "X-Title": "Roteiro de Dispensação"
        }
        
        # Tentar todos os modelos disponíveis
        for attempt, model in enumerate(self.models):
            try:
                data = {
                    "model": model,
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": 1000
                }
                
                logger.info(f"Tentativa {attempt + 1}: Usando modelo {model}")
                
                response = requests.post(
                    self.openrouter_url,
                    headers=headers,
                    json=data,
                    timeout=30
                )
                
                if response.status_code == 200:
                    result = response.json()
                    content = result["choices"][0]["message"]["content"]
                    
                    # Sucesso - atualizar modelo preferencial
                    if attempt != self.current_model_index:
                        logger.info(f"Modelo {model} funcionou, atualizando preferência")
                        self.current_model_index = attempt
                    
                    logger.info(f"[OK] Resposta obtida do modelo {model}")
                    return content
                    
                else:
                    logger.warning(f"Erro no modelo {model}: {response.status_code} - {response.text}")
                    if attempt < len(self.models) - 1:
                        logger.info(f"Tentando próximo modelo disponível...")
                        continue
                    
            except requests.exceptions.Timeout:
                logger.warning(f"Timeout no modelo {model}")
                if attempt < len(self.models) - 1:
                    logger.info(f"Tentando próximo modelo disponível...")
                    continue
                    
            except Exception as e:
                logger.warning(f"Erro no modelo {model}: {e}")
                if attempt < len(self.models) - 1:
                    logger.info(f"Tentando próximo modelo disponível...")
                    continue
        
        logger.error("[ERROR] Todos os modelos falharam")
        return None
    
    def _generate_fallback_response(self, message: str, persona: Dict, context: List[Dict], persona_id: str = None) -> str:
        """Gera resposta fallback quando API não está disponível - personalizada por persona"""
        message_lower = message.lower()
        persona_name = persona.get('name', 'Assistente')

        # Use the passed persona_id or try to determine from persona dict
        if not persona_id:
            persona_id = 'unknown'

        # Respostas específicas para Gá (empáticas)
        if persona_id == 'ga' or 'gá' in persona_name.lower():
            return self._generate_ga_fallback_response(message, message_lower, context)

        # Respostas específicas para Dr. Gasnelio (técnicas)
        elif persona_id == 'dr_gasnelio' or 'gasnelio' in persona_name.lower():
            return self._generate_gasnelio_fallback_response(message, message_lower, context)

        # Fallback genérico
        return self._generate_generic_fallback_response(message, persona, context)

    def _generate_ga_fallback_response(self, message: str, message_lower: str, context: List[Dict]) -> str:
        """Respostas empáticas específicas do Gá"""

        # Respostas empáticas para medos e preocupações
        if any(word in message_lower for word in ["medo", "preocupa", "assusta", "receio", "nervoso", "ansioso"]):
            return """**Gá**: Compreendo sua preocupação, é completamente normal se sentir assim. Vou te ajudar com muito carinho! 💚

A hanseníase tem cura completa e o tratamento funciona muito bem. Você não está sozinho nessa jornada - estou aqui para apoiar você sempre que precisar.

Que tal conversarmos sobre o que mais te preocupa? Juntos vamos esclarecer tudo!"""

        # Respostas sobre discriminação/preconceito (DEVE VIR ANTES dos termos técnicos)
        if any(word in message_lower for word in ["descobrir", "saber", "pessoas", "família", "trabalho", "preconceito"]):
            return """**Gá**: Sei que essa é uma preocupação muito real e compreendo seus sentimentos. Você tem todo direito de se sentir assim. 🤗

Lembre-se:
• A hanseníase **não é contagiosa** durante o tratamento
• Você tem **direitos protegidos** por lei
• **Muitas pessoas** passaram por isso e vivem normalmente hoje
• O **apoio** de pessoas queridas faz toda diferença

Se quiser, podemos conversar sobre como lidar com essas situações. Estou aqui para te apoiar sempre! 💚"""

        # Respostas para dúvidas sobre medicamento
        if any(word in message_lower for word in ["medicamento", "remédio", "comprimido", "pílula", "tomar"]):
            return """**Gá**: Entendo que você quer saber mais sobre os medicamentos! É muito importante se informar. 😊

Os medicamentos da hanseníase são seguros e eficazes. Vou explicar de forma simples:

• São **gratuitos** pelo SUS
• **Curam completamente** a hanseníase
• Devem ser tomados **exatamente** como orientado
• Qualquer dúvida, **converse com seu médico ou farmacêutico**

Lembre-se: seguindo o tratamento direitinho, você ficará curado! ✨"""

        # Explicações específicas para termos técnicos (tradução para linguagem simples)
        if any(term in message_lower for term in ["poliquimioterapia", "pqt"]):
            return """**Gá**: Ah, você quer saber sobre poliquimioterapia! Vou explicar de forma simples. 😊

**Poliquimioterapia** ou **PQT** é o nome técnico do tratamento da hanseníase.

**Explicando de forma simples**: são vários remédios diferentes trabalhando juntos para curar você completamente. É como se fosse uma equipe de medicamentos lutando contra a hanseníase!

• **"Poli"** = vários
• **"quimio"** = medicamentos
• **"terapia"** = tratamento

Ou seja: **tratamento com vários medicamentos**. É isso que vai te curar! 💪✨"""

        if any(term in message_lower for term in ["bacilo", "hansen", "microorganismo"]):
            return """**Gá**: Vou te explicar o que é o bacilo de Hansen de forma bem simples! 😊

O **bacilo de Hansen** é o nome científico da bactéria que causa a hanseníase.

**Explicando de forma simples**: é como se fosse um microbinho muito pequenino que causa a doença.

• Foi descoberto por um médico chamado **Hansen** (por isso o nome)
• É uma **bactéria** (tipo de germe)
• Os medicamentos matam essa bactéria e te curam

**Para você entender**: é o "vilão" da história, mas os remédios são os "heróis" que vão vencê-lo! 🦸‍♂️💊"""

        if any(term in message_lower for term in ["farmacovigilância", "vigilância"]):
            return """**Gá**: Vou explicar farmacovigilância de forma simples para você! 😊

**Farmacovigilância** é um nome técnico, mas é bem simples na verdade:

**Explicando de forma clara**: é o sistema que cuida da segurança dos medicamentos. É como ter um "guarda" cuidando de você durante o tratamento.

• **"Fármaco"** = medicamento
• **"Vigilância"** = cuidar, observar

**Ou seja**: é o sistema que **vigia e protege** você enquanto toma os remédios, garantindo que tudo está bem!

Se você sentir algo estranho com os medicamentos, é esse sistema que vai te ajudar! 🛡️💚"""

        if any(term in message_lower for term in ["reação adversa", "reações adversas", "efeito colateral"]):
            return """**Gá**: Vou explicar sobre reações adversas de uma forma que você entenda bem! 😊

**Reações adversas** é o nome técnico, mas **na linguagem simples são os "efeitos colaterais"**.

**Para você entender melhor**: às vezes os medicamentos, além de curar, podem causar alguns incômodos pequenos - como enjoo, dor de cabeça, etc.

**Importante saber**:
• A **maioria das pessoas** não tem problemas
• Se acontecer algo, **sempre avise** seu médico
• **Nunca pare** o tratamento por conta própria
• Existem **formas de ajudar** se isso acontecer

Lembre-se: os benefícios do tratamento são muito maiores que qualquer incômodo! 💪💚"""

        if any(term in message_lower for term in ["classificação operacional", "multibacilar", "paucibacilar"]):
            return """**Gá**: Vou explicar classificação operacional de forma bem simples! 😊

**Classificação operacional** é como os médicos "classificam" ou "organizam" os tipos de hanseníase.

**Explicando de forma clara**: é como separar em grupos para saber qual o melhor tratamento para cada pessoa.

**Os dois grupos são**:
• **Paucibacilar** = **"poucos bacilos"** (forma mais leve)
• **Multibacilar** = **"muitos bacilos"** (forma que precisa de mais cuidado)

**Para você entender**: é como ter uma receita diferente para cada tipo - assim o tratamento fica perfeito para você!

O importante é que **os dois tipos têm cura completa**! 🎯💚"""

        # Respostas para perguntas sobre cura
        if any(word in message_lower for word in ["cura", "curar", "sarar", "ficar bom"]):
            return """**Gá**: Que alegria poder te dizer: **SIM, a hanseníase tem cura completa!** 🎉

Não tenha dúvidas sobre isso! Com o tratamento correto:
• A doença **para de transmitir** logo nas primeiras semanas
• Os sintomas **vão melhorando** gradualmente
• Você ficará **totalmente curado** no final do tratamento

É uma jornada que vale muito a pena, e eu acredito em você! Você é mais forte do que imagina! 💪"""


        # Respostas sobre tempo de tratamento
        if any(word in message_lower for word in ["tempo", "quanto", "longo", "durar", "demora"]):
            return """**Gá**: Entendo que o tempo do tratamento pode parecer longo, mas vou te ajudar a ver de forma positiva! 😊

**O tempo varia**, mas geralmente:
• Algumas semanas para **parar de transmitir**
• Poucos meses para **melhorar os sintomas**
• 6 a 12 meses para a **cura completa**

Cada dia de tratamento é um **passo a mais** rumo à sua cura! E lembre-se: eu estou torcendo por você todos os dias! ✨"""

        # Verificar contexto da base de conhecimento
        if context:
            return f"""**Gá**: Que bom que você perguntou sobre isso! Encontrei algumas informações que podem te ajudar. 😊

{context[0]['content'][:200]}...

Se tiver mais dúvidas, estou aqui para explicar tudo com carinho e paciência. Juntos vamos esclarecer todas as suas preocupações! 💚"""

        # Respostas para cumprimentos
        if any(word in message_lower for word in ["olá", "oi", "bom dia", "boa tarde", "boa noite"]):
            return """**Gá**: Olá! Que alegria conversar com você! 😊

Sou o Gá, seu assistente farmacêutico empático. Estou aqui para te ajudar com informações sobre hanseníase de uma forma carinhosa e compreensível.

Como posso apoiar você hoje? Pode me perguntar qualquer coisa - sem vergonha! 💚"""

        # Agradecimentos
        if any(word in message_lower for word in ["obrigad", "valeu", "brigad"]):
            return """**Gá**: Fico muito feliz em poder ajudar você! 💚

Lembre-se: sempre que precisar de apoio ou tiver alguma dúvida, estarei aqui. Você não precisa enfrentar isso sozinho!

Cuide-se bem e lembre-se: você é muito mais forte do que imagina! ✨"""

        # Resposta genérica empática
        return """**Gá**: Recebi sua mensagem e quero muito te ajudar! 😊

No momento estou com algumas dificuldades técnicas, mas isso não me impede de te apoiar. Posso te orientar:

• A **hanseníase tem cura** completa! 💪
• O **tratamento é gratuito** pelo SUS
• É muito importante **seguir as orientações** médicas
• **Nunca desista** - você vai conseguir!

Para informações específicas, converse com seu médico ou farmacêutico. Eles têm todas as informações atualizadas!

Estou torcendo por você! 💚"""

    def _generate_gasnelio_fallback_response(self, message: str, message_lower: str, context: List[Dict]) -> str:
        """Respostas técnicas específicas do Dr. Gasnelio"""

        # Respostas técnicas baseadas em palavras-chave
        gasnelio_keywords = {
            "dosagem": """**Dr. Gasnelio**: Para informações sobre dosagens específicas da PQT-U (Poliquimioterapia Única), consulte:

1. **PCDT Hanseníase 2022** - Protocolo oficial do Ministério da Saúde
2. **Farmacêutico clínico** da sua unidade de saúde
3. **Prescrição médica** individualizada

⚠️ **Importante**: Dosagens devem sempre ser orientadas por profissional habilitado.""",

            "medicamento": """**Dr. Gasnelio**: Os medicamentos da PQT-U são rifampicina, clofazimina e dapsona.

Para informações farmacológicas detalhadas:
• Consulte a **bula dos medicamentos**
• Verifique protocolos da sua **unidade de saúde**
• Contatoque o **farmacêutico clínico** responsável

**Fonte recomendada**: PCDT Hanseníase 2022 - Ministério da Saúde""",

            "efeito": """**Dr. Gasnelio**: Para informações sobre efeitos adversos e farmacovigilância:

1. **Consulte a bula** dos medicamentos da PQT-U
2. **Reporte reações adversas** ao sistema de farmacovigilância
3. **Contate o farmacêutico clínico** para orientações específicas

**Protocolo**: Sempre documente e comunique eventos adversos."""
        }

        # Verificar palavras-chave técnicas
        for keyword, response in gasnelio_keywords.items():
            if keyword in message_lower:
                return response

        # Contexto da base de conhecimento
        if context:
            return f"""**Dr. Gasnelio**: Baseado na consulta à base de conhecimento técnica:

{context[0]['content'][:200]}...

**Recomendação**: Para informações clínicas específicas, consulte sempre os protocolos atualizados e profissionais habilitados."""

        # Resposta genérica técnica
        return """**Dr. Gasnelio**: Recebi sua consulta técnica sobre hanseníase.

No momento, estou com acesso limitado à base de conhecimento específica. Para informações precisas sobre PQT-U, recomendo:

1. **PCDT Hanseníase 2022** - Ministério da Saúde
2. **Protocolos locais** da sua unidade de saúde
3. **Farmacêutico clínico** da sua instituição

**⚠️ Importante**: Para dosagens e orientações clínicas, sempre consulte fontes oficiais atualizadas."""

    def _generate_generic_fallback_response(self, message: str, persona: Dict, context: List[Dict]) -> str:
        """Resposta fallback genérica para outras personas"""
        persona_name = persona.get('name', 'Assistente')

        if context:
            return f"**{persona_name}**: Encontrei algumas informações relevantes na base de conhecimento: {context[0]['content'][:200]}..."

        return f"**{persona_name}**: Desculpe, estou com dificuldades técnicas no momento. Para informações sobre hanseníase, consulte um profissional de saúde qualificado."
    
    def process_message(self, message: str, persona_id: str, user_session_id: str = None, ip_address: str = None) -> Dict:
        """
        Processa mensagem do usuário com persona específica

        Args:
            message: Mensagem do usuário
            persona_id: ID da persona a ser usada
            user_session_id: ID da sessão do usuário (para auditoria)
            ip_address: Endereço IP do usuário (para auditoria)

        Returns:
            Dict com resposta e metadados
        """
        # OTIMIZAÇÃO CRÍTICA: Gerar session ID se não fornecido
        if not user_session_id:
            import uuid
            user_session_id = str(uuid.uuid4())

        # Tracking de tempo de resposta
        start_time = time.time()

        try:
            # AUDITORIA: Log da pergunta recebida
            medical_audit_logger.log_medical_interaction(
                user_session_id=user_session_id,
                action_type=ActionType.QUESTION_ASKED,
                persona_id=persona_id,
                question_text=message,
                response_classification=MedicalDataClassification.EDUCATIONAL,
                data_subjects=["question_content", "persona_preference"],
                metadata={
                    "question_length": len(message),
                    "persona_requested": persona_id
                },
                ip_address=ip_address
            )
            
            # Obter persona
            persona = get_persona_by_id(persona_id)
            if not persona:
                # AUDITORIA: Log de erro
                medical_audit_logger.log_medical_interaction(
                    user_session_id=user_session_id,
                    action_type=ActionType.SYSTEM_ERROR,
                    persona_id=persona_id,
                    response_classification=MedicalDataClassification.AUDIT_TRAIL,
                    data_subjects=["error_log"],
                    metadata={"error_type": "persona_not_found"},
                    ip_address=ip_address
                )
                
                return {
                    "response": "Persona não encontrada",
                    "error": True,
                    "timestamp": datetime.now().isoformat()
                }
            
            # Buscar contexto relevante na base de conhecimento
            relevant_docs = self._search_knowledge_base(message)
            
            # AUDITORIA: Log do acesso à base de conhecimento
            if relevant_docs:
                medical_audit_logger.log_medical_interaction(
                    user_session_id=user_session_id,
                    action_type=ActionType.KNOWLEDGE_ACCESSED,
                    persona_id=persona_id,
                    response_classification=MedicalDataClassification.EDUCATIONAL,
                    data_subjects=["knowledge_base_content"],
                    metadata={
                        "documents_found": len(relevant_docs),
                        "sources": [doc['file'] for doc in relevant_docs],
                        "avg_similarity": sum(doc['similarity'] for doc in relevant_docs) / len(relevant_docs) if relevant_docs else 0
                    },
                    ip_address=ip_address
                )
            
            # Construir contexto para o modelo
            context_text = ""
            if relevant_docs:
                context_text = "\n\nInformações relevantes da base de conhecimento:\n"
                for doc in relevant_docs:
                    context_text += f"- {doc['file']}: {doc['content']}\n"
            
            # Construir prompt com persona
            system_prompt = f"""Você é {persona['name']}, {persona.get('description', 'assistente farmacêutico')}.
Público-alvo: {persona.get('audience', 'público geral')}
Estilo de linguagem: {persona.get('language_style', 'profissional')}

{persona.get('system_prompt', 'Responda de forma profissional e útil.')}
{context_text}"""
            
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message}
            ]
            
            # Tentar chamar API
            response = self._call_openrouter_api(messages)
            
            # Se API falhar, usar fallback
            if response is None:
                response = self._generate_fallback_response(message, persona, relevant_docs, persona_id)
                api_used = False
                
                # AUDITORIA: Log do fallback ativado
                medical_audit_logger.log_medical_interaction(
                    user_session_id=user_session_id,
                    action_type=ActionType.FALLBACK_ACTIVATED,
                    persona_id=persona_id,
                    response_classification=MedicalDataClassification.EDUCATIONAL,
                    data_subjects=["fallback_response"],
                    metadata={
                        "fallback_reason": "api_unavailable",
                        "response_length": len(response) if response else 0
                    },
                    ip_address=ip_address
                )
            else:
                api_used = True
            
            # AUDITORIA: Log da resposta gerada
            response_classification = MedicalDataClassification.EDUCATIONAL
            if any(keyword in message.lower() for keyword in ["dosagem", "medicamento", "efeito", "prescrição"]):
                response_classification = MedicalDataClassification.SENSITIVE_MEDICAL
            
            medical_audit_logger.log_medical_interaction(
                user_session_id=user_session_id,
                action_type=ActionType.RESPONSE_GENERATED,
                persona_id=persona_id,
                response_classification=response_classification,
                data_subjects=["ai_response", "persona_context"],
                metadata={
                    "response_length": len(response) if response else 0,
                    "api_used": api_used,
                    "context_sources": len(relevant_docs),
                    "persona_name": persona['name']
                },
                ip_address=ip_address
            )

            # ANALYTICS MÉDICO: Track evento médico (SQLite + Google Storage)
            response_time = time.time() - start_time

            if analytics_service:
                try:
                    # Determinar urgência com base no conteúdo
                    urgency_level = 'standard'
                    urgent_keywords = ['emergência', 'urgente', 'imediato', 'grave', 'crítico']
                    if any(keyword in message.lower() for keyword in urgent_keywords):
                        urgency_level = 'critical'
                    elif any(keyword in message.lower() for keyword in ['importante', 'atenção', 'cuidado']):
                        urgency_level = 'important'

                    # Track evento médico
                    analytics_service.track_event({
                        'session_id': user_session_id,
                        'event_type': 'medical_interaction',
                        'persona_id': persona_id,
                        'question': message[:500],  # Limitar tamanho para privacidade
                        'response_time': response_time,
                        'fallback_used': not api_used,
                        'urgency_level': urgency_level,
                        'device_type': 'desktop',  # TODO: Detectar do user agent
                        'ip_address': ip_address,
                        'is_anonymous': not ip_address  # Simplificado - melhorar depois
                    })
                except Exception as e:
                    logger.warning(f"Failed to track analytics: {e}")

            return {
                "response": response,
                "persona": persona['name'],
                "persona_id": persona_id,
                "context_used": [{"file": doc["file"], "similarity": doc["similarity"]} for doc in relevant_docs],
                "api_used": api_used,
                "timestamp": datetime.now().isoformat(),
                "audit_compliant": True,  # Indicador de conformidade
                "response_time_ms": int(response_time * 1000)  # Adicionar tempo de resposta
            }
            
        except Exception as e:
            logger.error(f"Erro ao processar mensagem: {e}")
            return {
                "response": "Desculpe, ocorreu um erro ao processar sua mensagem.",
                "error": True,
                "error_message": str(e),
                "timestamp": datetime.now().isoformat()
            }
    
    def get_conversation_history(self, session_id: str) -> List[Dict]:
        """Obtém histórico de conversação (placeholder para implementação futura)"""
        # TODO: Implementar persistência de conversações
        return []
    
    def save_conversation(self, session_id: str, message: str, response: Dict):
        """Salva conversação (placeholder para implementação futura)"""
        # TODO: Implementar persistência de conversações
        pass


# Função auxiliar para uso direto
def create_chatbot_service(knowledge_base_path: Optional[str] = None) -> ChatbotService:
    """Cria instância do serviço de chatbot"""
    if knowledge_base_path:
        return ChatbotService(knowledge_base_path)
    return ChatbotService()