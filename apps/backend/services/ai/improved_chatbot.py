# -*- coding: utf-8 -*-
"""
Improved Chatbot Service - Clean Architecture
Replaces chatbot.py with better separation of concerns and error handling
"""

import os
import json
import logging
import hashlib
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime
from pathlib import Path
from dataclasses import dataclass
from abc import ABC, abstractmethod

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from .improved_personas import get_persona_registry, BasePersona


logger = logging.getLogger(__name__)


@dataclass
class ChatRequest:
    """Chat request data structure"""
    message: str
    persona_id: str
    user_session_id: Optional[str] = None
    ip_address: Optional[str] = None
    context: Optional[Dict[str, Any]] = None

    def validate(self) -> List[str]:
        """Validate chat request"""
        errors = []

        if not self.message or len(self.message.strip()) < 1:
            errors.append("Message cannot be empty")

        if not self.persona_id:
            errors.append("Persona ID is required")

        if len(self.message) > 5000:
            errors.append("Message too long (max 5000 characters)")

        return errors


@dataclass
class ChatResponse:
    """Chat response data structure"""
    response: str
    persona_name: str
    persona_id: str
    context_used: List[Dict[str, Any]]
    api_used: bool
    confidence_score: float
    timestamp: str
    error: bool = False
    error_message: Optional[str] = None

    @classmethod
    def create_error_response(cls, error_message: str, persona_id: str = "unknown") -> 'ChatResponse':
        """Create error response"""
        return cls(
            response="I'm sorry, I encountered an error processing your request.",
            persona_name="System",
            persona_id=persona_id,
            context_used=[],
            api_used=False,
            confidence_score=0.0,
            timestamp=datetime.now().isoformat(),
            error=True,
            error_message=error_message
        )


class KnowledgeDocument:
    """Represents a knowledge base document"""

    def __init__(self, file_path: Path, content: str):
        self.file_path = file_path
        self.content = content
        self.content_hash = self._calculate_hash()
        self.metadata = self._extract_metadata()

    def _calculate_hash(self) -> str:
        """Calculate content hash for caching"""
        return hashlib.sha256(self.content.encode('utf-8')).hexdigest()

    def _extract_metadata(self) -> Dict[str, Any]:
        """Extract metadata from document"""
        return {
            "file_name": self.file_path.name,
            "file_type": self.file_path.suffix,
            "content_length": len(self.content),
            "word_count": len(self.content.split()),
        }

    def get_snippet(self, max_length: int = 500) -> str:
        """Get content snippet"""
        if len(self.content) <= max_length:
            return self.content
        return self.content[:max_length] + "..."


class KnowledgeBase:
    """Manages knowledge base documents and search"""

    def __init__(self, knowledge_base_path: Path):
        self.knowledge_base_path = knowledge_base_path
        self.documents: List[KnowledgeDocument] = []
        self.vectorizer = TfidfVectorizer(
            max_features=1000,
            stop_words=None,  # Keep Portuguese stop words
            ngram_range=(1, 2)  # Include bigrams for better context
        )
        self.document_vectors = None
        self._search_cache: Dict[str, List[Dict]] = {}
        self._load_documents()

    def _load_documents(self) -> None:
        """Load all documents from knowledge base"""
        if not self.knowledge_base_path.exists():
            logger.warning(f"Knowledge base path not found: {self.knowledge_base_path}")
            return

        try:
            document_count = 0
            supported_extensions = {".txt", ".md", ".json"}

            for file_path in self.knowledge_base_path.rglob("*"):
                if file_path.suffix.lower() in supported_extensions:
                    try:
                        content = self._read_file(file_path)
                        if content:
                            document = KnowledgeDocument(file_path, content)
                            self.documents.append(document)
                            document_count += 1
                    except Exception as e:
                        logger.error(f"Failed to load document {file_path}: {e}")

            if self.documents:
                self._build_vectors()
                logger.info(f"Knowledge base loaded: {document_count} documents")
            else:
                logger.warning("No documents loaded from knowledge base")

        except Exception as e:
            logger.error(f"Failed to load knowledge base: {e}")

    def _read_file(self, file_path: Path) -> Optional[str]:
        """Read file content with proper encoding handling"""
        try:
            if file_path.suffix.lower() == ".json":
                with open(file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    return json.dumps(data, ensure_ascii=False, indent=2)
            else:
                with open(file_path, "r", encoding="utf-8") as f:
                    return f.read()
        except Exception as e:
            logger.error(f"Failed to read file {file_path}: {e}")
            return None

    def _build_vectors(self) -> None:
        """Build document vectors for search"""
        try:
            contents = [doc.content for doc in self.documents]
            self.document_vectors = self.vectorizer.fit_transform(contents)
            logger.debug(f"Document vectors built for {len(contents)} documents")
        except Exception as e:
            logger.error(f"Failed to build document vectors: {e}")
            self.document_vectors = None

    def search(self, query: str, top_k: int = 3, min_similarity: float = 0.1) -> List[Dict[str, Any]]:
        """
        Search for relevant documents

        Args:
            query: Search query
            top_k: Maximum number of results
            min_similarity: Minimum similarity threshold

        Returns:
            List of relevant documents with metadata
        """
        if not self.documents or self.document_vectors is None:
            return []

        # Check cache first
        query_hash = hashlib.sha256(query.lower().encode('utf-8')).hexdigest()
        cache_key = f"{query_hash}_{top_k}_{min_similarity}"

        if cache_key in self._search_cache:
            logger.debug("Search cache hit")
            return self._search_cache[cache_key]

        try:
            # Vectorize query
            query_vector = self.vectorizer.transform([query.lower()])

            # Calculate similarities
            similarities = cosine_similarity(query_vector, self.document_vectors).flatten()

            # Get top results efficiently
            if len(similarities) > top_k:
                top_indices = np.argpartition(similarities, -top_k)[-top_k:]
                top_indices = top_indices[np.argsort(similarities[top_indices])[::-1]]
            else:
                top_indices = np.argsort(similarities)[::-1]

            # Build results
            results = []
            for idx in top_indices:
                similarity_score = float(similarities[idx])
                if similarity_score >= min_similarity:
                    document = self.documents[idx]
                    results.append({
                        "file": str(document.file_path.relative_to(self.knowledge_base_path)),
                        "content": document.get_snippet(),
                        "similarity": similarity_score,
                        "metadata": document.metadata
                    })

            # Cache results (limit cache size)
            if len(self._search_cache) > 100:
                # Remove oldest 25% entries
                oldest_keys = list(self._search_cache.keys())[:25]
                for key in oldest_keys:
                    del self._search_cache[key]

            self._search_cache[cache_key] = results
            logger.debug(f"Search completed: {len(results)} results")

            return results

        except Exception as e:
            logger.error(f"Knowledge base search failed: {e}")
            return []

    def get_stats(self) -> Dict[str, Any]:
        """Get knowledge base statistics"""
        total_content_length = sum(len(doc.content) for doc in self.documents)
        file_types = {}

        for doc in self.documents:
            file_type = doc.file_path.suffix or "no_extension"
            file_types[file_type] = file_types.get(file_type, 0) + 1

        return {
            "total_documents": len(self.documents),
            "total_content_length": total_content_length,
            "file_types": file_types,
            "cache_entries": len(self._search_cache),
            "vectors_built": self.document_vectors is not None
        }


class APIClient(ABC):
    """Abstract base class for AI API clients"""

    @abstractmethod
    def generate_response(self, messages: List[Dict[str, str]], **kwargs) -> Optional[str]:
        """Generate response from AI model"""
        pass

    @abstractmethod
    def is_available(self) -> bool:
        """Check if API is available"""
        pass


class OpenRouterClient(APIClient):
    """OpenRouter API client with model fallback"""

    def __init__(self):
        self.api_key = os.getenv("OPENROUTER_API_KEY")
        self.base_url = "https://openrouter.ai/api/v1/chat/completions"
        self.models = [
            "meta-llama/llama-3.2-3b-instruct:free",
            "kimie-kimie/k2-chat:free"
        ]
        self.current_model_index = 0

    def is_available(self) -> bool:
        """Check if OpenRouter API is available"""
        return bool(self.api_key)

    def generate_response(self, messages: List[Dict[str, str]], **kwargs) -> Optional[str]:
        """Generate response using OpenRouter API with model fallback"""
        if not self.is_available():
            logger.warning("OpenRouter API key not configured")
            return None

        import requests

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://github.com/roteiro-dispensacao",
            "X-Title": "Roteiro de Dispensação"
        }

        # Try each model
        for attempt, model in enumerate(self.models):
            try:
                data = {
                    "model": model,
                    "messages": messages,
                    "temperature": kwargs.get("temperature", 0.7),
                    "max_tokens": kwargs.get("max_tokens", 1000)
                }

                response = requests.post(
                    self.base_url,
                    headers=headers,
                    json=data,
                    timeout=30
                )

                if response.status_code == 200:
                    result = response.json()
                    content = result["choices"][0]["message"]["content"]

                    # Update preferred model on success
                    if attempt != self.current_model_index:
                        logger.info(f"Model {model} succeeded, updating preference")
                        self.current_model_index = attempt

                    logger.info(f"Response generated using model {model}")
                    return content
                else:
                    logger.warning(f"Model {model} failed: {response.status_code}")
                    if attempt < len(self.models) - 1:
                        continue

            except requests.exceptions.Timeout:
                logger.warning(f"Model {model} timed out")
                if attempt < len(self.models) - 1:
                    continue
            except Exception as e:
                logger.warning(f"Model {model} error: {e}")
                if attempt < len(self.models) - 1:
                    continue

        logger.error("All OpenRouter models failed")
        return None


class FallbackResponseGenerator:
    """Generates fallback responses when AI APIs are unavailable"""

    def __init__(self):
        self.keyword_responses = {
            "olá": "Olá! Como posso ajudar você hoje?",
            "oi": "Oi! Em que posso ser útil?",
            "obrigado": "Por nada! Estou aqui para ajudar.",
            "medicamento": "Para informações sobre medicamentos, consulte sempre um profissional de saúde qualificado.",
            "dosagem": "A dosagem de medicamentos deve ser sempre orientada por um profissional de saúde.",
            "efeito": "Para informações sobre efeitos de medicamentos, consulte a bula ou um profissional.",
            "ajuda": "Estou aqui para ajudar! Me diga o que você precisa saber.",
        }

    def generate_response(self, message: str, persona: BasePersona, context: List[Dict]) -> Tuple[str, float]:
        """
        Generate fallback response

        Returns:
            Tuple of (response, confidence_score)
        """
        message_lower = message.lower()

        # Check for keyword matches
        for keyword, response in self.keyword_responses.items():
            if keyword in message_lower:
                formatted_response = f"[{persona.config.name}] {response}"
                return formatted_response, 0.6

        # Use context if available
        if context:
            context_response = f"[{persona.config.name}] Encontrei algumas informações relevantes na nossa base de conhecimento. {context[0]['content'][:200]}..."
            return context_response, 0.4

        # Generic fallback
        generic_response = f"[{persona.config.name}] Desculpe, estou com dificuldades técnicas no momento. Por favor, tente novamente mais tarde ou consulte um profissional de saúde."
        return generic_response, 0.2


class ImprovedChatbotService:
    """Improved chatbot service with clean architecture"""

    def __init__(self, knowledge_base_path: Optional[str] = None):
        self.knowledge_base_path = Path(knowledge_base_path or "data/knowledge-base")
        self.knowledge_base = KnowledgeBase(self.knowledge_base_path)
        self.persona_registry = get_persona_registry()
        self.api_client = OpenRouterClient()
        self.fallback_generator = FallbackResponseGenerator()

        logger.info("Improved chatbot service initialized")

    def process_chat_request(self, request: ChatRequest) -> ChatResponse:
        """
        Process chat request with comprehensive error handling

        Args:
            request: Chat request with validation

        Returns:
            Chat response with metadata
        """
        # Validate request
        validation_errors = request.validate()
        if validation_errors:
            error_msg = f"Invalid request: {', '.join(validation_errors)}"
            logger.error(error_msg)
            return ChatResponse.create_error_response(error_msg, request.persona_id)

        # Generate session ID if not provided
        if not request.user_session_id:
            import uuid
            request.user_session_id = str(uuid.uuid4())

        try:
            # Get persona
            persona = self.persona_registry.get_persona(request.persona_id)
            if not persona:
                error_msg = f"Persona not found: {request.persona_id}"
                logger.error(error_msg)
                return ChatResponse.create_error_response(error_msg, request.persona_id)

            # Validate input for persona
            if not persona.validate_input(request.message):
                error_msg = "Input not appropriate for selected persona"
                logger.warning(error_msg)
                return ChatResponse.create_error_response(error_msg, request.persona_id)

            # Search knowledge base
            relevant_docs = self.knowledge_base.search(request.message)

            # Build context for AI model
            context_text = self._build_context_text(relevant_docs)

            # Get system prompt with context
            system_prompt = persona.get_system_prompt(request.context)
            if context_text:
                system_prompt += f"\n\nRelevant information from knowledge base:\n{context_text}"

            # Build messages for AI model
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": request.message}
            ]

            # Try to get AI response
            ai_response = None
            api_used = False

            if self.api_client.is_available():
                ai_response = self.api_client.generate_response(messages)
                if ai_response:
                    api_used = True

            # Use fallback if AI failed
            if not ai_response:
                ai_response, confidence_score = self.fallback_generator.generate_response(
                    request.message, persona, relevant_docs
                )
            else:
                confidence_score = 0.9 if api_used else 0.4

            # Customize response with persona
            if api_used:
                final_response = persona.customize_response(ai_response, request.context or {})
            else:
                final_response = ai_response

            # Build response
            response = ChatResponse(
                response=final_response,
                persona_name=persona.config.name,
                persona_id=request.persona_id,
                context_used=[{
                    "file": doc["file"],
                    "similarity": doc["similarity"]
                } for doc in relevant_docs],
                api_used=api_used,
                confidence_score=confidence_score,
                timestamp=datetime.now().isoformat()
            )

            logger.info(f"Chat processed: persona={request.persona_id}, api_used={api_used}")
            return response

        except Exception as e:
            error_msg = f"Chat processing failed: {str(e)}"
            logger.error(error_msg, exc_info=True)
            return ChatResponse.create_error_response(error_msg, request.persona_id)

    def _build_context_text(self, relevant_docs: List[Dict]) -> str:
        """Build context text from relevant documents"""
        if not relevant_docs:
            return ""

        context_parts = []
        for doc in relevant_docs[:3]:  # Limit to top 3 documents
            context_parts.append(f"- {doc['file']}: {doc['content']}")

        return "\n".join(context_parts)

    def get_service_stats(self) -> Dict[str, Any]:
        """Get service statistics"""
        return {
            "knowledge_base": self.knowledge_base.get_stats(),
            "personas": self.persona_registry.get_registry_stats(),
            "api_available": self.api_client.is_available(),
            "service_status": "operational"
        }

    def health_check(self) -> Dict[str, Any]:
        """Perform service health check"""
        health_status = {
            "service": "operational",
            "knowledge_base": len(self.knowledge_base.documents) > 0,
            "personas": len(self.persona_registry.get_all_personas()) > 0,
            "api_client": self.api_client.is_available(),
            "timestamp": datetime.now().isoformat()
        }

        overall_healthy = all([
            health_status["knowledge_base"],
            health_status["personas"]
            # API client is optional - fallback available
        ])

        health_status["overall_healthy"] = overall_healthy
        return health_status


# Factory function for backward compatibility
def create_chatbot_service(knowledge_base_path: Optional[str] = None) -> ImprovedChatbotService:
    """Create improved chatbot service instance"""
    return ImprovedChatbotService(knowledge_base_path)