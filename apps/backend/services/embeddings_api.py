# -*- coding: utf-8 -*-
"""
Sistema de Embeddings via API Hugging Face
Alternativa leve ao sentence-transformers local
Usa apenas variáveis de ambiente do GitHub Secrets
"""

import os
import requests
import logging
from typing import List, Optional
from cachetools import TTLCache

logger = logging.getLogger(__name__)

class HuggingFaceEmbeddings:
    """Embeddings usando API do Hugging Face ao invés de modelo local"""
    
    def __init__(self):
        # Usa variável de ambiente injetada pelo GitHub Secrets
        self.api_key = os.environ.get('HUGGINGFACE_API_KEY')
        self.model_id = "sentence-transformers/all-MiniLM-L6-v2"
        self.api_url = f"https://api-inference.huggingface.co/models/{self.model_id}"
        
        # Cache de embeddings para economizar requisições
        self.cache = TTLCache(maxsize=1000, ttl=3600)  # 1 hora
        
        if not self.api_key:
            logger.warning("HUGGINGFACE_API_KEY não configurada - embeddings desabilitados")
    
    def get_embeddings(self, texts: List[str]) -> Optional[List[List[float]]]:
        """
        Obtém embeddings para uma lista de textos
        
        Args:
            texts: Lista de textos para gerar embeddings
            
        Returns:
            Lista de vetores de embeddings ou None se falhar
        """
        if not self.api_key:
            logger.error("API key não configurada")
            return None
        
        try:
            # Verificar cache
            cache_key = str(hash(tuple(texts)))
            if cache_key in self.cache:
                logger.info("Embeddings encontrados no cache")
                return self.cache[cache_key]
            
            # Fazer requisição para API
            headers = {"Authorization": f"Bearer {self.api_key}"}
            
            response = requests.post(
                self.api_url,
                headers=headers,
                json={"inputs": texts, "options": {"wait_for_model": True}}
            )
            
            if response.status_code == 200:
                embeddings = response.json()
                
                # Cachear resultado
                self.cache[cache_key] = embeddings
                
                logger.info(f"Embeddings gerados com sucesso para {len(texts)} textos")
                return embeddings
            else:
                logger.error(f"Erro na API: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            logger.error(f"Erro ao obter embeddings: {e}")
            return None
    
    def get_single_embedding(self, text: str) -> Optional[List[float]]:
        """
        Obtém embedding para um único texto
        
        Args:
            text: Texto para gerar embedding
            
        Returns:
            Vetor de embedding ou None se falhar
        """
        result = self.get_embeddings([text])
        return result[0] if result else None

# Instância global
embeddings_api = HuggingFaceEmbeddings()

def get_text_embedding(text: str) -> Optional[List[float]]:
    """Função de conveniência para obter embedding de um texto"""
    return embeddings_api.get_single_embedding(text)

def get_batch_embeddings(texts: List[str]) -> Optional[List[List[float]]]:
    """Função de conveniência para obter embeddings em batch"""
    return embeddings_api.get_embeddings(texts)