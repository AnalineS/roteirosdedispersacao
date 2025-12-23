# -*- coding: utf-8 -*-
"""
Supabase Vector Store - Sistema de armazenamento vetorial com PostgreSQL + pgvector
Substitui AstraDB por solução cloud-native gratuita para FASE 3 RAG
"""

import logging
import hashlib
from typing import List, Dict, Optional, Tuple, Any
from datetime import datetime, timezone
import numpy as np
from dataclasses import dataclass

logger = logging.getLogger(__name__)

# Import Supabase com fallback seguro
SUPABASE_AVAILABLE = False
try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
    logger.info("[OK] Supabase client disponível")
except ImportError as e:
    logger.warning(f"[WARNING] Supabase não disponível: {e}")
    SUPABASE_AVAILABLE = False

@dataclass
class VectorDocument:
    """Documento com embedding vetorial - compatível com sistema existente"""
    id: str
    text: str
    embedding: Optional[np.ndarray]
    metadata: Dict[str, Any]
    chunk_type: str  # 'dosage', 'protocol', 'general', etc
    priority: float  # 0.0 a 1.0
    source_file: Optional[str] = None
    created_at: Optional[datetime] = None
    
    def to_dict(self) -> Dict:
        """Converte para dicionário (sem embedding para JSON)"""
        data = asdict(self)
        data.pop('embedding', None)  # Remover embedding numpy do dict
        if self.created_at:
            data['created_at'] = self.created_at.isoformat()
        return data

class SupabaseVectorStore:
    """
    Vector Store usando Supabase PostgreSQL com pgvector extension
    Substitui AstraDB com solução gratuita e cloud-native
    """
    
    def __init__(self, config):
        self.config = config
        self.client: Optional[Client] = None
        self.table_name = "medical_embeddings"
        self.metadata_table = "embeddings_metadata"
        self.search_cache_table = "search_cache"
        
        # Fallback local se Supabase não disponível
        from services.vector_store import LocalVectorStore
        self.local_store = LocalVectorStore(config.VECTOR_DB_PATH)
        self.use_local = not self._connect_supabase()
        
        if not self.use_local:
            self._ensure_tables_exist()
    
    def _connect_supabase(self) -> bool:
        """Conecta ao Supabase usando credenciais do GitHub Secrets"""
        if not SUPABASE_AVAILABLE:
            logger.warning("[WARNING] Supabase client não instalado - usando store local")
            return False

        # Check for Supabase URL and either service key or regular key
        api_key = self.config.SUPABASE_SERVICE_KEY or self.config.SUPABASE_KEY
        if not self.config.SUPABASE_URL or not api_key:
            logger.info("📁 Supabase não configurado - usando store local para desenvolvimento")
            return False

        try:
            # Usar service role key para operações de administração
            
            self.client = create_client(
                supabase_url=self.config.SUPABASE_URL,
                supabase_key=api_key
            )
            
            # Testar conexão com a tabela correta
            result = self.client.table(self.table_name).select("id").limit(1).execute()

            logger.info(f"[OK] Conectado ao Supabase - Projeto: {self.config.SUPABASE_URL}")
            return True
            
        except Exception as e:
            logger.warning(f"[WARNING] Falha ao conectar Supabase: {e} - usando store local")
            return False
    
    def _ensure_tables_exist(self):
        """Garante que tabelas necessárias existem no Supabase"""
        try:
            # Verificar se extensão pgvector está habilitada
            # Nota: Esta operação deve ser feita via SQL editor do Supabase Dashboard
            logger.info("[WARNING] Certifique-se que pgvector extension está habilitada no Supabase Dashboard")
            logger.info("SQL: CREATE EXTENSION IF NOT EXISTS vector;")
            
            # Tentar criar tabelas se não existirem
            # Nota: CREATE TABLE deve ser executado via SQL editor ou RLS desabilitado
            logger.info("[WARNING] Execute as seguintes queries no SQL Editor do Supabase:")
            
            table_sql = f"""
-- Tabela principal de embeddings
CREATE TABLE IF NOT EXISTS {self.table_name} (
    id TEXT PRIMARY KEY,
    text TEXT NOT NULL,
    embedding VECTOR({self.config.PGVECTOR_DIMENSIONS}),
    chunk_type TEXT NOT NULL DEFAULT 'general',
    priority REAL NOT NULL DEFAULT 0.5,
    source_file TEXT,
    metadata JSONB DEFAULT '{{}}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para busca vetorial (ivfflat para performance)
CREATE INDEX IF NOT EXISTS medical_embeddings_vector_idx 
ON {self.table_name} 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Índices auxiliares
CREATE INDEX IF NOT EXISTS medical_embeddings_chunk_type_idx ON {self.table_name}(chunk_type);
CREATE INDEX IF NOT EXISTS medical_embeddings_priority_idx ON {self.table_name}(priority);
CREATE INDEX IF NOT EXISTS medical_embeddings_source_idx ON {self.table_name}(source_file);

-- Tabela de cache de buscas
CREATE TABLE IF NOT EXISTS {self.search_cache_table} (
    query_hash TEXT PRIMARY KEY,
    query TEXT NOT NULL,
    results JSONB NOT NULL,
    similarity_threshold REAL NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

-- Tabela de metadados para analytics
CREATE TABLE IF NOT EXISTS {self.metadata_table} (
    id SERIAL PRIMARY KEY,
    operation TEXT NOT NULL,
    document_count INTEGER DEFAULT 0,
    avg_similarity REAL DEFAULT 0.0,
    processing_time_ms INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
"""
            
            logger.info(f"SQL Tables: \\n{table_sql}")
            logger.info("[OK] Execute o SQL acima no Supabase Dashboard > SQL Editor")
            
        except Exception as e:
            logger.error(f"Erro ao configurar tabelas Supabase: {e}")
            self.use_local = True
    
    def add_document(self, document: VectorDocument) -> bool:
        """Adiciona documento ao vector store"""
        if self.use_local:
            return self.local_store.add_document(document)
        
        try:
            # Preparar dados para inserção
            embedding_list = document.embedding.tolist() if document.embedding is not None else None
            
            data = {
                'id': document.id,
                'text': document.text,
                'embedding': embedding_list,
                'chunk_type': document.chunk_type,
                'priority': document.priority,
                'source_file': document.source_file,
                'metadata': document.metadata,
                'created_at': (document.created_at or datetime.now(timezone.utc)).isoformat(),
                'updated_at': datetime.now(timezone.utc).isoformat()
            }
            
            # Inserir no Supabase usando upsert para evitar conflitos
            result = self.client.table(self.table_name).upsert(data).execute()
            
            if result.data:
                logger.debug(f"Documento inserido no Supabase: {document.id}")
                
                # Também salvar localmente para cache rápido
                self.local_store.add_document(document)
                
                return True
            else:
                logger.error(f"Falha ao inserir documento: {result}")
                return False
            
        except Exception as e:
            logger.error(f"Erro ao adicionar no Supabase: {e}")
            # Fallback para local
            return self.local_store.add_document(document)
    
    def search_similar(
        self,
        query_embedding: np.ndarray,
        top_k: int = 5,
        min_score: float = 0.0
    ) -> List[Tuple[VectorDocument, float]]:
        """Busca documentos similares usando pgvector cosine similarity via RPC function"""
        if self.use_local:
            return self.local_store.search_similar(query_embedding, top_k, min_score)

        try:
            # Cache key para evitar queries repetidas
            embedding_hash = hashlib.sha256(query_embedding.tobytes()).hexdigest()[:16]
            cache_key = f"{embedding_hash}_{top_k}_{min_score}"

            # Verificar cache primeiro
            cached_result = self._get_cached_search(cache_key)
            if cached_result:
                logger.debug(f"Cache hit - retornando {len(cached_result)} resultados")
                return cached_result

            # Converter numpy array para lista Python para JSON serialization
            embedding_list = query_embedding.tolist()

            # Chamar função RPC match_medical_embeddings definida no SQL schema
            # Parâmetros conforme assinatura da função (setup_supabase_rpc.sql)
            result = self.client.rpc(
                'match_medical_embeddings',
                {
                    'query_embedding': embedding_list,
                    'match_threshold': min_score,
                    'match_count': top_k
                }
            ).execute()

            logger.info(f"RPC match_medical_embeddings executado - recebidos {len(result.data) if result.data else 0} resultados")

            if result.data and len(result.data) > 0:
                documents = []

                # Parsing conforme esquema de retorno da função RPC match_medical_embeddings
                for row in result.data:
                    doc = VectorDocument(
                        id=row['id'],  # RPC match_medical_embeddings retorna 'id'
                        text=row['text'],  # RPC match_medical_embeddings retorna 'text'
                        embedding=None,  # Não retornar embedding para economizar banda
                        metadata=row.get('metadata', {}),
                        chunk_type=row.get('chunk_type'),
                        priority=row.get('priority'),
                        source_file=row.get('source_file')
                    )

                    similarity_score = float(row['similarity'])
                    documents.append((doc, similarity_score))

                    logger.debug(f"Documento encontrado: {doc.id[:30]}... (similarity: {similarity_score:.3f})")

                # Cachear resultado
                self._cache_search_result(cache_key, documents)

                logger.info(f"Busca bem-sucedida: {len(documents)} documentos com similarity >= {min_score}")
                return documents
            else:
                logger.warning(f"Nenhum resultado encontrado na busca vetorial (threshold: {min_score}, max: {top_k})")
                return []

        except Exception as e:
            error_msg = str(e)
            logger.error(f"Erro na busca Supabase RPC: {error_msg}", exc_info=True)

            # Detectar se é erro de função RPC não existente
            if 'function' in error_msg.lower() and 'does not exist' in error_msg.lower():
                logger.error("CRÍTICO: Função RPC 'match_medical_embeddings' não existe no Supabase!")
                logger.error("Execute o SQL em scripts/setup_supabase_rpc.sql para criar a função")
                logger.error("Ou rode: python scripts/index_knowledge_base.py --force (cria automaticamente)")

            # Fallback para busca local
            logger.warning(f"Usando fallback para busca local (40 docs) - threshold: {min_score}")
            return self.local_store.search_similar(query_embedding, top_k, min_score)
    
    def get_document(self, doc_id: str) -> Optional[VectorDocument]:
        """Obtém documento por ID"""
        if self.use_local:
            return self.local_store.get_document(doc_id)
        
        try:
            result = self.client.table(self.table_name).select("*").eq('id', doc_id).execute()
            
            if result.data and len(result.data) > 0:
                row = result.data[0]
                
                return VectorDocument(
                    id=row['id'],
                    text=row['text'],
                    embedding=np.array(row['embedding']) if row.get('embedding') else None,
                    metadata=row.get('metadata', {}),
                    chunk_type=row['chunk_type'],
                    priority=row['priority'],
                    source_file=row.get('source_file'),
                    created_at=datetime.fromisoformat(row['created_at']) if row.get('created_at') else None
                )
            
            return None
            
        except Exception as e:
            logger.error(f"Erro ao buscar documento: {e}")
            return self.local_store.get_document(doc_id)
    
    def delete_document(self, doc_id: str) -> bool:
        """Remove documento"""
        if self.use_local:
            return self.local_store.delete_document(doc_id)
        
        try:
            result = self.client.table(self.table_name).delete().eq('id', doc_id).execute()
            
            # Também remover do cache local
            self.local_store.delete_document(doc_id)
            
            return len(result.data) > 0
            
        except Exception as e:
            logger.error(f"Erro ao deletar do Supabase: {e}")
            return False
    
    def clear(self):
        """Limpa store local (não Supabase por segurança)"""
        self.local_store.clear()
        
        if not self.use_local:
            logger.warning("[WARNING] Clear não executado no Supabase por segurança - apenas cache local limpo")
    
    def _get_cached_search(self, cache_key: str) -> Optional[List[Tuple[VectorDocument, float]]]:
        """Obtém resultado de busca do cache"""
        try:
            result = self.client.table(self.search_cache_table).select("*").eq('query_hash', cache_key).execute()
            
            if result.data and len(result.data) > 0:
                cache_entry = result.data[0]
                
                # Verificar se não expirou
                expires_at = datetime.fromisoformat(cache_entry['expires_at'])
                if datetime.now(timezone.utc) < expires_at:
                    # Deserializar resultados
                    cached_results = []
                    for item in cache_entry['results']:
                        doc = VectorDocument(
                            id=item['document']['id'],
                            text=item['document']['text'],
                            embedding=None,
                            metadata=item['document']['metadata'],
                            chunk_type=item['document']['chunk_type'],
                            priority=item['document']['priority'],
                            source_file=item['document'].get('source_file')
                        )
                        cached_results.append((doc, item['similarity']))
                    
                    logger.debug(f"Cache hit para busca: {cache_key}")
                    return cached_results
                else:
                    # Cache expirado - remover
                    self.client.table(self.search_cache_table).delete().eq('query_hash', cache_key).execute()
            
            return None
            
        except Exception as e:
            logger.debug(f"Erro ao acessar cache: {e}")
            return None
    
    def _cache_search_result(self, cache_key: str, results: List[Tuple[VectorDocument, float]]):
        """Salva resultado de busca no cache"""
        try:
            # Serializar resultados
            serialized_results = []
            for doc, similarity in results:
                serialized_results.append({
                    'document': doc.to_dict(),
                    'similarity': similarity
                })
            
            expires_at = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)  # Cache por 1 hora
            expires_at = expires_at.replace(hour=expires_at.hour + 1)
            
            cache_data = {
                'query_hash': cache_key,
                'query': f"Embedding search - {len(results)} results",
                'results': serialized_results,
                'similarity_threshold': min([r[1] for r in results]) if results else 0.0,
                'expires_at': expires_at.isoformat()
            }
            
            self.client.table(self.search_cache_table).upsert(cache_data).execute()
            logger.debug(f"Resultado cacheado: {cache_key}")
            
        except Exception as e:
            logger.debug(f"Erro ao cachear resultado: {e}")
    
    def get_stats(self) -> Dict[str, Any]:
        """Estatísticas do store"""
        base_stats = self.local_store.get_stats()
        
        base_stats.update({
            'backend': 'local' if self.use_local else 'supabase',
            'supabase_connected': not self.use_local,
            'table_name': self.table_name if not self.use_local else None,
            'pgvector_dimensions': self.config.PGVECTOR_DIMENSIONS
        })
        
        if not self.use_local:
            try:
                # Contar documentos no Supabase
                result = self.client.table(self.table_name).select("id", count="exact").execute()
                base_stats['supabase_documents'] = result.count if result.count else 0
                
                # Cache statistics
                cache_result = self.client.table(self.search_cache_table).select("id", count="exact").execute()
                base_stats['cache_entries'] = cache_result.count if cache_result.count else 0
                
            except Exception as e:
                logger.debug(f"Erro ao obter stats do Supabase: {e}")
        
        return base_stats
    
    def close(self):
        """Fecha conexões e salva dados"""
        # Salvar store local
        self.local_store._save_store()
        
        # Supabase client não precisa de close explícito
        logger.info("Supabase vector store fechado")

# Instância global
_vector_store: Optional[SupabaseVectorStore] = None

def get_vector_store() -> Optional[SupabaseVectorStore]:
    """Obtém instância global do vector store"""
    global _vector_store
    
    if _vector_store is None:
        try:
            from app_config import config
            _vector_store = SupabaseVectorStore(config)
        except Exception as e:
            logger.error(f"Erro ao inicializar Supabase vector store: {e}")
            return None
    
    return _vector_store

def is_vector_store_available() -> bool:
    """Verifica se vector store está disponível"""
    store = get_vector_store()
    return store is not None