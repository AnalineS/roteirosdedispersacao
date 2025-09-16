# -*- coding: utf-8 -*-
"""
Vector Store - Sistema de armazenamento de vetores com Supabase e fallback local
Suporta busca semântica eficiente para RAG médico - migração completa do AstraDB
"""

import os
import json
import logging
import hashlib
from typing import List, Dict, Optional, Tuple, Any
from datetime import datetime
from pathlib import Path
import numpy as np
from dataclasses import dataclass, asdict

logger = logging.getLogger(__name__)

# Import da nova SupabaseVectorStore - FASE 3 RAG
SUPABASE_VECTOR_AVAILABLE = False
try:
    from services.supabase_vector_store import SupabaseVectorStore, SUPABASE_AVAILABLE
    SUPABASE_VECTOR_AVAILABLE = True
    logger.info("[OK] SupabaseVectorStore disponível - FASE 3 RAG")
except ImportError as e:
    logger.warning(f"[WARNING] SupabaseVectorStore não disponível: {e}")
    SUPABASE_VECTOR_AVAILABLE = False

# AstraDB - REMOVIDO - migração completa para Supabase
# ASTRADB_AVAILABLE = False  # Deprecated - using Supabase only
logger.info("[INFO] Sistema migrado completamente para Supabase - AstraDB removido")

@dataclass
class VectorDocument:
    """Documento com embedding vetorial"""
    id: str
    text: str
    embedding: Optional[np.ndarray]
    metadata: Dict[str, Any]
    chunk_type: str  # 'dosage', 'protocol', 'general', etc
    priority: float  # 0.0 a 1.0
    source_file: Optional[str] = None
    created_at: Optional[datetime] = None
    
    def to_dict(self) -> Dict:
        """Converte para dicionário (sem embedding)"""
        data = asdict(self)
        data.pop('embedding', None)  # Remover embedding do dict
        return data

class LocalVectorStore:
    """
    Fallback local para desenvolvimento quando AstraDB não está disponível
    Usa numpy arrays e busca por força bruta (adequado para <10k documentos)
    """
    
    def __init__(self, storage_path: str):
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)
        
        self.embeddings_file = self.storage_path / "embeddings.npy"
        self.metadata_file = self.storage_path / "metadata.json"
        self.index_file = self.storage_path / "index.pkl"
        
        self.documents: Dict[str, VectorDocument] = {}
        self.embeddings_matrix: Optional[np.ndarray] = None
        self.doc_ids: List[str] = []
        
        self._load_store()
    
    def _load_store(self):
        """Carrega store do disco"""
        try:
            if self.embeddings_file.exists():
                self.embeddings_matrix = np.load(self.embeddings_file)
                
            if self.metadata_file.exists():
                with open(self.metadata_file, 'r', encoding='utf-8') as f:
                    metadata = json.load(f)
                    for doc_id, doc_data in metadata.items():
                        self.documents[doc_id] = VectorDocument(
                            id=doc_id,
                            text=doc_data['text'],
                            embedding=None,  # Carregado sob demanda
                            metadata=doc_data.get('metadata', {}),
                            chunk_type=doc_data.get('chunk_type', 'general'),
                            priority=doc_data.get('priority', 0.5),
                            source_file=doc_data.get('source_file')
                        )
                        
            if self.index_file.exists():
                with open(self.index_file, 'r', encoding='utf-8') as f:
                    self.doc_ids = json.load(f)
                    
            logger.info(f"LocalVectorStore carregado: {len(self.documents)} documentos")
            
        except Exception as e:
            logger.warning(f"Erro ao carregar LocalVectorStore: {e}")
            self.documents = {}
            self.embeddings_matrix = None
            self.doc_ids = []
    
    def _save_store(self):
        """Salva store no disco"""
        try:
            # Salvar embeddings
            if self.embeddings_matrix is not None:
                np.save(self.embeddings_file, self.embeddings_matrix)
            
            # Salvar metadata
            metadata = {}
            for doc_id, doc in self.documents.items():
                metadata[doc_id] = doc.to_dict()
            
            with open(self.metadata_file, 'w', encoding='utf-8') as f:
                json.dump(metadata, f, ensure_ascii=False, indent=2, default=str)
            
            # Salvar índice de forma segura
            with open(self.index_file, 'w', encoding='utf-8') as f:
                json.dump(self.doc_ids, f, ensure_ascii=False, indent=2)
                
        except Exception as e:
            logger.error(f"Erro ao salvar LocalVectorStore: {e}")
    
    def add_document(self, document: VectorDocument) -> bool:
        """Adiciona documento ao store"""
        try:
            if document.embedding is None:
                logger.warning(f"Documento {document.id} sem embedding")
                return False
            
            self.documents[document.id] = document
            
            # Adicionar embedding à matriz
            if self.embeddings_matrix is None:
                self.embeddings_matrix = document.embedding.reshape(1, -1)
                self.doc_ids = [document.id]
            else:
                self.embeddings_matrix = np.vstack([
                    self.embeddings_matrix, 
                    document.embedding.reshape(1, -1)
                ])
                self.doc_ids.append(document.id)
            
            # Salvar periodicamente
            if len(self.documents) % 10 == 0:
                self._save_store()
            
            return True
            
        except Exception as e:
            logger.error(f"Erro ao adicionar documento: {e}")
            return False
    
    def search_similar(
        self, 
        query_embedding: np.ndarray, 
        top_k: int = 5,
        min_score: float = 0.0
    ) -> List[Tuple[VectorDocument, float]]:
        """Busca documentos similares"""
        if self.embeddings_matrix is None or len(self.doc_ids) == 0:
            return []
        
        try:
            # Calcular similaridades (produto escalar com embeddings normalizados)
            similarities = np.dot(self.embeddings_matrix, query_embedding)
            
            # Obter top-k índices
            top_indices = np.argsort(similarities)[::-1][:top_k]
            
            results = []
            for idx in top_indices:
                score = float(similarities[idx])
                if score >= min_score:
                    doc_id = self.doc_ids[idx]
                    if doc_id in self.documents:
                        doc = self.documents[doc_id]
                        # Adicionar embedding ao documento
                        doc.embedding = self.embeddings_matrix[idx]
                        results.append((doc, score))
            
            return results
            
        except Exception as e:
            logger.error(f"Erro na busca: {e}")
            return []
    
    def get_document(self, doc_id: str) -> Optional[VectorDocument]:
        """Obtém documento por ID"""
        return self.documents.get(doc_id)
    
    def delete_document(self, doc_id: str) -> bool:
        """Remove documento do store"""
        if doc_id not in self.documents:
            return False
        
        try:
            # Remover da matriz de embeddings
            if doc_id in self.doc_ids:
                idx = self.doc_ids.index(doc_id)
                self.embeddings_matrix = np.delete(self.embeddings_matrix, idx, axis=0)
                self.doc_ids.pop(idx)
            
            # Remover documento
            del self.documents[doc_id]
            
            self._save_store()
            return True
            
        except Exception as e:
            logger.error(f"Erro ao deletar documento: {e}")
            return False
    
    def clear(self):
        """Limpa todo o store"""
        self.documents.clear()
        self.embeddings_matrix = None
        self.doc_ids = []
        self._save_store()
    
    def get_stats(self) -> Dict[str, Any]:
        """Estatísticas do store"""
        return {
            'total_documents': len(self.documents),
            'embedding_dimensions': self.embeddings_matrix.shape[1] if self.embeddings_matrix is not None else 0,
            'storage_size_mb': (
                (self.embeddings_file.stat().st_size if self.embeddings_file.exists() else 0) +
                (self.metadata_file.stat().st_size if self.metadata_file.exists() else 0)
            ) / (1024 * 1024),
            'chunk_types': self._get_chunk_type_distribution()
        }
    
    def _get_chunk_type_distribution(self) -> Dict[str, int]:
        """Distribuição de tipos de chunks"""
        distribution = {}
        for doc in self.documents.values():
            chunk_type = doc.chunk_type
            distribution[chunk_type] = distribution.get(chunk_type, 0) + 1
        return distribution

# DEPRECATED: AstraDB migrado para Supabase - classe mantida apenas para compatibilidade
class AstraDBVectorStore:
    """
    Vector store usando DataStax AstraDB (Cassandra)
    Suporta busca vetorial nativa e escalabilidade
    """
    
    def __init__(self, config):
        self.config = config
        self.cluster = None
        self.session = None
        self.keyspace = config.ASTRA_DB_KEYSPACE or "roteiros_dispensacao"
        self.table_name = "medical_embeddings"
        
        # Fallback local se AstraDB não disponível
        self.local_store = LocalVectorStore(config.VECTOR_DB_PATH)
        self.use_local = not self._connect_astradb()
        
        if not self.use_local:
            self._setup_schema()
    
    def _connect_astradb(self) -> bool:
        """DEPRECATED: AstraDB removido - migração completa para Supabase"""
        logger.info("📦 AstraDB foi migrado para Supabase - usando fallback local se necessário")
        return False
    
    def _setup_schema(self):
        """Cria schema no AstraDB se não existir"""
        try:
            # Criar keyspace se não existir
            self.session.execute(f"""
                CREATE KEYSPACE IF NOT EXISTS {self.keyspace}
                WITH REPLICATION = {{
                    'class': 'NetworkTopologyStrategy',
                    'replication_factor': 3
                }}
            """)
            
            self.session.set_keyspace(self.keyspace)
            
            # Criar tabela com suporte a vector search
            self.session.execute(f"""
                CREATE TABLE IF NOT EXISTS {self.table_name} (
                    id TEXT PRIMARY KEY,
                    text TEXT,
                    embedding VECTOR<FLOAT, 384>,  -- Dimensão do modelo MiniLM
                    chunk_type TEXT,
                    priority FLOAT,
                    source_file TEXT,
                    metadata MAP<TEXT, TEXT>,
                    created_at TIMESTAMP,
                    updated_at TIMESTAMP
                )
            """)
            
            # Criar índice para vector search
            self.session.execute(f"""
                CREATE CUSTOM INDEX IF NOT EXISTS medical_ann_index 
                ON {self.table_name}(embedding) 
                USING 'org.apache.cassandra.index.sai.StorageAttachedIndex'
            """)
            
            logger.info(f"[OK] Schema AstraDB configurado: {self.keyspace}.{self.table_name}")
            
        except Exception as e:
            logger.error(f"Erro ao criar schema AstraDB: {e}")
            self.use_local = True
    
    def add_document(self, document: VectorDocument) -> bool:
        """Adiciona documento ao store"""
        if self.use_local:
            return self.local_store.add_document(document)
        
        try:
            # Preparar metadata como JSON string
            metadata_json = json.dumps(document.metadata, ensure_ascii=False)
            
            # Inserir no AstraDB
            query = f"""
                INSERT INTO {self.table_name} (
                    id, text, embedding, chunk_type, priority, 
                    source_file, metadata, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """
            
            self.session.execute(query, (
                document.id,
                document.text,
                document.embedding.tolist() if document.embedding is not None else None,
                document.chunk_type,
                document.priority,
                document.source_file,
                {k: str(v) for k, v in document.metadata.items()},  # MAP format
                document.created_at or datetime.now(),
                datetime.now()
            ))
            
            # Também salvar localmente para cache
            self.local_store.add_document(document)
            
            return True
            
        except Exception as e:
            logger.error(f"Erro ao adicionar no AstraDB: {e}")
            # Fallback para local
            return self.local_store.add_document(document)
    
    def search_similar(
        self, 
        query_embedding: np.ndarray,
        top_k: int = 5,
        min_score: float = 0.0
    ) -> List[Tuple[VectorDocument, float]]:
        """Busca documentos similares"""
        if self.use_local:
            return self.local_store.search_similar(query_embedding, top_k, min_score)
        
        try:
            # AstraDB vector search
            query = f"""
                SELECT id, text, chunk_type, priority, source_file, metadata,
                       similarity_cosine(embedding, ?) as score
                FROM {self.table_name}
                ORDER BY embedding ANN OF ?
                LIMIT ?
            """
            
            embedding_list = query_embedding.tolist()
            
            rows = self.session.execute(query, (
                embedding_list,  # Para similarity_cosine
                embedding_list,  # Para ANN search
                top_k
            ))
            
            results = []
            for row in rows:
                if row.score >= min_score:
                    doc = VectorDocument(
                        id=row.id,
                        text=row.text,
                        embedding=None,  # Não retornar embedding para economizar banda
                        metadata=dict(row.metadata) if row.metadata else {},
                        chunk_type=row.chunk_type,
                        priority=row.priority,
                        source_file=row.source_file
                    )
                    results.append((doc, row.score))
            
            return results
            
        except Exception as e:
            logger.error(f"Erro na busca AstraDB: {e}")
            # Fallback para local
            return self.local_store.search_similar(query_embedding, top_k, min_score)
    
    def get_document(self, doc_id: str) -> Optional[VectorDocument]:
        """Obtém documento por ID"""
        if self.use_local:
            return self.local_store.get_document(doc_id)
        
        try:
            query = f"""
                SELECT * FROM {self.table_name}
                WHERE id = ?
            """
            
            row = self.session.execute(query, (doc_id,)).one()
            
            if row:
                return VectorDocument(
                    id=row.id,
                    text=row.text,
                    embedding=np.array(row.embedding) if row.embedding else None,
                    metadata=dict(row.metadata) if row.metadata else {},
                    chunk_type=row.chunk_type,
                    priority=row.priority,
                    source_file=row.source_file,
                    created_at=row.created_at
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
            query = f"DELETE FROM {self.table_name} WHERE id = ?"
            self.session.execute(query, (doc_id,))
            
            # Também remover do cache local
            self.local_store.delete_document(doc_id)
            
            return True
            
        except Exception as e:
            logger.error(f"Erro ao deletar do AstraDB: {e}")
            return False
    
    def clear(self):
        """Limpa store (apenas local, não AstraDB)"""
        self.local_store.clear()
        
        if not self.use_local:
            logger.warning("[WARNING] Clear não executado no AstraDB por segurança")
    
    def get_stats(self) -> Dict[str, Any]:
        """Estatísticas do store"""
        base_stats = self.local_store.get_stats()
        
        base_stats.update({
            'backend': 'local' if self.use_local else 'astradb',
            'astradb_connected': not self.use_local,
            'keyspace': self.keyspace if not self.use_local else None
        })
        
        if not self.use_local:
            try:
                # Contar documentos no AstraDB
                count_query = f"SELECT COUNT(*) FROM {self.table_name}"
                result = self.session.execute(count_query).one()
                base_stats['astradb_documents'] = result[0]
            except:
                pass
        
        return base_stats
    
    def close(self):
        """Fecha conexões"""
        if self.cluster:
            self.cluster.shutdown()
        
        # Salvar store local
        self.local_store._save_store()

# Instância global - MIGRADO para Supabase em FASE 3
_vector_store = None

def get_vector_store():
    """
    Obtém instância global do vector store
    FASE 3: Prioriza SupabaseVectorStore > AstraDB > Local
    """
    global _vector_store
    
    if _vector_store is None:
        try:
            from app_config import config
            
            # FASE 3: Priorizar Supabase Vector Store
            if SUPABASE_VECTOR_AVAILABLE and config.VECTOR_DB_TYPE == 'supabase':
                _vector_store = SupabaseVectorStore(config)
                logger.info("[OK] Usando SupabaseVectorStore - FASE 3 RAG")
            
            # Fallback para AstraDB (deprecated mas mantido)
            elif ASTRADB_AVAILABLE and config.VECTOR_DB_TYPE == 'astradb':
                _vector_store = AstraDBVectorStore(config)
                logger.warning("[WARNING] Usando AstraDBVectorStore (DEPRECATED) - migrar para Supabase")
            
            # Fallback final para Local
            else:
                _vector_store = AstraDBVectorStore(config)  # Usa LocalVectorStore internamente
                logger.info("📁 Usando LocalVectorStore como fallback")
                
        except Exception as e:
            logger.error(f"Erro ao inicializar vector store: {e}")
            return None
    
    return _vector_store

def is_vector_store_available() -> bool:
    """Verifica se vector store está disponível"""
    store = get_vector_store()
    return store is not None

# Função helper para migração FASE 3
def get_supabase_vector_store():
    """Obtém especificamente SupabaseVectorStore para FASE 3"""
    if SUPABASE_VECTOR_AVAILABLE:
        try:
            from app_config import config
            return SupabaseVectorStore(config)
        except Exception as e:
            logger.error(f"Erro ao inicializar SupabaseVectorStore: {e}")
            return None
    return None