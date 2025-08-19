import os
import json
import logging
from typing import Dict, List, Optional, Tuple
from datetime import datetime
import requests
from pathlib import Path
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from ..config.personas import get_persona_by_id

# OTIMIZAÇÃO CRÍTICA: Sistema de auditoria médica
from ..core.security.medical_audit_logger import (
    medical_audit_logger,
    ActionType,
    MedicalDataClassification
)

logger = logging.getLogger(__name__)


class ChatbotService:
    """Serviço de chatbot com RAG (Retrieval-Augmented Generation)"""
    
    def __init__(self, knowledge_base_path: str = "data/knowledge_base"):
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
                    
                    logger.info(f"✅ Resposta obtida do modelo {model}")
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
        
        logger.error("❌ Todos os modelos falharam")
        return None
    
    def _generate_fallback_response(self, message: str, persona: Dict, context: List[Dict]) -> str:
        """Gera resposta fallback quando API não está disponível"""
        # Respostas padrão baseadas em palavras-chave
        keywords_responses = {
            "olá": "Olá! Como posso ajudar você hoje?",
            "oi": "Oi! Em que posso ser útil?",
            "obrigado": "Por nada! Estou aqui para ajudar.",
            "medicamento": "Para informações sobre medicamentos, consulte sempre um profissional de saúde qualificado.",
            "dosagem": "A dosagem de medicamentos deve ser sempre orientada por um profissional de saúde.",
            "efeito": "Para informações sobre efeitos de medicamentos, consulte a bula ou um profissional.",
            "ajuda": "Estou aqui para ajudar! Me diga o que você precisa saber.",
        }
        
        message_lower = message.lower()
        
        # Verificar palavras-chave
        for keyword, response in keywords_responses.items():
            if keyword in message_lower:
                return f"[{persona['name']}] {response}"
        
        # Se houver contexto da base de conhecimento
        if context:
            return f"[{persona['name']}] Encontrei algumas informações relevantes na nossa base de conhecimento. {context[0]['content'][:200]}..."
        
        # Resposta genérica
        return f"[{persona['name']}] Desculpe, estou com dificuldades técnicas no momento. Por favor, tente novamente mais tarde ou consulte um profissional de saúde."
    
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
                response = self._generate_fallback_response(message, persona, relevant_docs)
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
            
            return {
                "response": response,
                "persona": persona['name'],
                "persona_id": persona_id,
                "context_used": [{"file": doc["file"], "similarity": doc["similarity"]} for doc in relevant_docs],
                "api_used": api_used,
                "timestamp": datetime.now().isoformat(),
                "audit_compliant": True  # Indicador de conformidade
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