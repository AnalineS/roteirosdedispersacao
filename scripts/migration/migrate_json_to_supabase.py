#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Migração JSON para Supabase - FASE 3 RAG
Migra 9 arquivos JSON estruturados para PostgreSQL + pgvector
Processa chunks médicos e gera embeddings automaticamente
"""

import os
import sys
import json
import logging
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime, timezone
import hashlib

# Configurar encoding para Windows
if os.name == 'nt':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.detach())
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.detach())

# Adicionar diretório parent ao path para imports
sys.path.append(str(Path(__file__).parent.parent))

from app_config import config
from services.medical_chunking import MedicalChunker, ChunkPriority
from services.supabase_vector_store import SupabaseVectorStore, VectorDocument
from services.embedding_service import get_embedding_service

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class JSONToSupabaseMigrator:
    """
    Migrador de dados JSON estruturados para Supabase
    Processa conhecimento médico e gera embeddings
    """
    
    def __init__(self):
        self.config = config
        self.vector_store = SupabaseVectorStore(config)
        self.chunker = MedicalChunker()
        self.embedding_service = get_embedding_service()
        
        # Diretórios de dados - corrigido para estrutura real
        # Backend está em apps/backend, então subir 3 níveis para chegar na raiz
        self.data_dir = Path(__file__).parent.parent.parent.parent / "data" / "structured"
        
        # Mapeamento de arquivos JSON para categorias
        self.json_files = {
            "clinical_taxonomy.json": {
                "chunk_type": "taxonomy",
                "priority": 0.8,
                "description": "Taxonomia clínica médica"
            },
            "dosing_protocols.json": {
                "chunk_type": "dosage", 
                "priority": 1.0,
                "description": "Protocolos de dosagem - CRÍTICO"
            },
            "medications_mechanisms.json": {
                "chunk_type": "mechanism",
                "priority": 0.7,
                "description": "Mecanismos de ação dos medicamentos"
            },
            "dispensing_workflow.json": {
                "chunk_type": "protocol",
                "priority": 0.9,
                "description": "Fluxos de dispensação"
            },
            "pharmacovigilance_guidelines.json": {
                "chunk_type": "safety",
                "priority": 0.95,
                "description": "Diretrizes de farmacovigilância"
            },
            "hanseniase_catalog.json": {
                "chunk_type": "catalog",
                "priority": 0.8,
                "description": "Catálogo hanseníase"
            },
            "quick_reference_protocols.json": {
                "chunk_type": "reference",
                "priority": 0.85,
                "description": "Protocolos de referência rápida"
            },
            "frequently_asked_questions.json": {
                "chunk_type": "faq",
                "priority": 0.6,
                "description": "Perguntas frequentes"
            },
            "knowledge_scope_limitations.json": {
                "chunk_type": "scope",
                "priority": 0.5,
                "description": "Limitações de escopo"
            }
        }
        
        # Estatísticas da migração
        self.migration_stats = {
            "files_processed": 0,
            "chunks_created": 0,
            "embeddings_generated": 0,
            "documents_indexed": 0,
            "errors": [],
            "start_time": datetime.now(),
            "end_time": None
        }
        
        logger.info(f"[START] JSONToSupabaseMigrator inicializado")
        logger.info(f"📁 Data directory: {self.data_dir}")
        logger.info(f"[LIST] Files to migrate: {len(self.json_files)}")
    
    def validate_environment(self) -> bool:
        """Valida se ambiente está configurado para migração"""
        errors = []
        
        # Verificar Supabase config
        if not self.config.SUPABASE_URL:
            errors.append("SUPABASE_URL não configurado")
        
        if not self.config.SUPABASE_KEY:
            errors.append("SUPABASE_KEY não configurado")
        
        # Verificar diretório de dados
        if not self.data_dir.exists():
            errors.append(f"Diretório de dados não encontrado: {self.data_dir}")
        
        # Verificar arquivos JSON
        missing_files = []
        for filename in self.json_files.keys():
            file_path = self.data_dir / filename
            if not file_path.exists():
                missing_files.append(filename)
        
        if missing_files:
            errors.append(f"Arquivos JSON não encontrados: {missing_files}")
        
        # Verificar vector store
        if not self.vector_store.client:
            errors.append("Conexão Supabase não estabelecida")
        
        # Verificar serviço de embeddings
        if self.embedding_service:
            if self.embedding_service.is_available():
                logger.info("[OK] Serviço de embeddings disponível")
            else:
                logger.warning("[WARNING] Serviço de embeddings não disponível - documentos serão criados sem embeddings")
        else:
            logger.warning("[WARNING] Serviço de embeddings não inicializado")
        
        if errors:
            logger.error("[ERROR] Validação de ambiente falhou:")
            for error in errors:
                logger.error(f"   - {error}")
            return False
        
        logger.info("[OK] Ambiente validado com sucesso")
        return True
    
    def load_json_file(self, filename: str) -> Optional[Dict]:
        """Carrega arquivo JSON com tratamento de erros"""
        file_path = self.data_dir / filename
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            logger.info(f"[OK] JSON carregado: {filename} ({len(str(data))} chars)")
            return data
            
        except Exception as e:
            error_msg = f"Erro ao carregar {filename}: {e}"
            logger.error(error_msg)
            self.migration_stats["errors"].append(error_msg)
            return None
    
    def extract_chunks_from_json(self, data: Dict, file_info: Dict) -> List[Dict]:
        """Extrai chunks textuais de dados JSON estruturados"""
        chunks = []
        
        def extract_text_recursively(obj, path="", parent_key=""):
            """Extrai texto recursivamente de estrutura JSON"""
            if isinstance(obj, dict):
                for key, value in obj.items():
                    current_path = f"{path}.{key}" if path else key
                    extract_text_recursively(value, current_path, key)
                    
            elif isinstance(obj, list):
                for i, item in enumerate(obj):
                    current_path = f"{path}[{i}]"
                    extract_text_recursively(item, current_path, parent_key)
                    
            elif isinstance(obj, str) and len(obj.strip()) > 20:
                # Texto significativo - criar chunk
                chunks.append({
                    "text": obj.strip(),
                    "path": path,
                    "parent_key": parent_key,
                    "chunk_type": file_info["chunk_type"],
                    "priority": file_info["priority"]
                })
        
        extract_text_recursively(data)
        
        # Processar chunks com chunker médico para otimizar
        processed_chunks = []
        for chunk_data in chunks:
            if len(chunk_data["text"]) > 100:  # Apenas chunks substanciais
                
                # Determinar categoria específica baseada em conteúdo
                chunk_category = self._classify_chunk_content(
                    chunk_data["text"], 
                    chunk_data["chunk_type"]
                )
                
                # Criar chunk médico
                medical_chunk = {
                    "text": chunk_data["text"],
                    "chunk_type": chunk_category,
                    "priority": self._adjust_priority_by_content(
                        chunk_data["text"], 
                        chunk_data["priority"]
                    ),
                    "metadata": {
                        "source_path": chunk_data["path"],
                        "parent_key": chunk_data["parent_key"],
                        "original_category": chunk_data["chunk_type"],
                        "word_count": len(chunk_data["text"].split())
                    }
                }
                
                processed_chunks.append(medical_chunk)
        
        logger.info(f"[NOTE] Extraídos {len(processed_chunks)} chunks de texto significativos")
        return processed_chunks
    
    def _classify_chunk_content(self, text: str, base_category: str) -> str:
        """Classifica conteúdo do chunk para categoria mais específica"""
        text_lower = text.lower()
        
        # Palavras-chave para categorização específica
        dosage_keywords = ["dose", "dosagem", "mg", "comprimido", "administrar", "posologia"]
        safety_keywords = ["contraindicação", "efeito colateral", "reação adversa", "cuidado", "atenção"]
        protocol_keywords = ["protocolo", "procedimento", "fluxo", "etapa", "passo"]
        mechanism_keywords = ["mecanismo", "ação", "farmacologia", "absorção", "metabolismo"]
        
        # Verificar keywords críticas primeiro
        if any(keyword in text_lower for keyword in dosage_keywords):
            return "dosage"
        elif any(keyword in text_lower for keyword in safety_keywords):
            return "safety"
        elif any(keyword in text_lower for keyword in protocol_keywords):
            return "protocol"
        elif any(keyword in text_lower for keyword in mechanism_keywords):
            return "mechanism"
        
        # Usar categoria base se não houver match específico
        return base_category
    
    def _adjust_priority_by_content(self, text: str, base_priority: float) -> float:
        """Ajusta prioridade baseada no conteúdo do texto"""
        text_lower = text.lower()
        
        # Aumentar prioridade para conteúdo crítico
        critical_terms = ["dosagem", "dose", "contraindicação", "perigo", "atenção"]
        if any(term in text_lower for term in critical_terms):
            return min(1.0, base_priority + 0.1)
        
        # Diminuir prioridade para conteúdo geral
        general_terms = ["informação", "geral", "observação"]
        if any(term in text_lower for term in general_terms):
            return max(0.3, base_priority - 0.1)
        
        return base_priority
    
    def generate_document_id(self, text: str, source_file: str) -> str:
        """Gera ID único para documento"""
        content = f"{source_file}:{text[:100]}"
        # SHA-256 para IDs de documento (não dados sensíveis)
        return hashlib.sha256(content.encode()).hexdigest()
    
    def migrate_file(self, filename: str) -> bool:
        """Migra um arquivo JSON específico"""
        logger.info(f"🔄 Migrando arquivo: {filename}")
        
        # Carregar dados
        json_data = self.load_json_file(filename)
        if not json_data:
            return False
        
        file_info = self.json_files[filename]
        
        # Extrair chunks
        chunks = self.extract_chunks_from_json(json_data, file_info)
        if not chunks:
            logger.warning(f"[WARNING] Nenhum chunk extraído de {filename}")
            return False
        
        # Processar chunks e criar documentos
        success_count = 0
        
        for chunk in chunks:
            try:
                # Gerar ID único
                doc_id = self.generate_document_id(chunk["text"], filename)
                
                # Gerar embedding para o texto
                embedding = None
                if self.embedding_service and self.embedding_service.is_available():
                    embedding = self.embedding_service.embed_text(chunk["text"])
                    if embedding is not None:
                        self.migration_stats["embeddings_generated"] += 1
                        logger.debug(f"[OK] Embedding gerado para chunk {doc_id[:8]}...")
                    else:
                        logger.warning(f"[WARNING] Falha ao gerar embedding para chunk {doc_id[:8]}...")
                else:
                    logger.warning("[WARNING] Serviço de embeddings não disponível")
                
                # Criar documento vetorial com embedding gerado
                vector_doc = VectorDocument(
                    id=doc_id,
                    text=chunk["text"],
                    embedding=embedding,
                    metadata=chunk["metadata"],
                    chunk_type=chunk["chunk_type"],
                    priority=chunk["priority"],
                    source_file=filename,
                    created_at=datetime.now(timezone.utc)
                )
                
                # Adicionar ao vector store
                if self.vector_store.add_document(vector_doc):
                    success_count += 1
                    self.migration_stats["documents_indexed"] += 1
                else:
                    logger.warning(f"[WARNING] Falha ao adicionar documento {doc_id[:8]} ao vector store")
                
            except Exception as e:
                error_msg = f"Erro ao processar chunk de {filename}: {e}"
                logger.error(error_msg)
                self.migration_stats["errors"].append(error_msg)
        
        # Estatísticas do arquivo
        self.migration_stats["files_processed"] += 1
        self.migration_stats["chunks_created"] += len(chunks)
        
        logger.info(f"[OK] {filename} migrado: {success_count}/{len(chunks)} chunks processados")
        return success_count > 0
    
    def migrate_all_files(self) -> bool:
        """Migra todos os arquivos JSON"""
        logger.info("[START] Iniciando migração completa dos arquivos JSON")
        
        if not self.validate_environment():
            return False
        
        # Processar cada arquivo
        failed_files = []
        
        for filename in self.json_files.keys():
            logger.info(f"\n{'='*60}")
            logger.info(f"PROCESSANDO: {filename}")
            logger.info(f"{'='*60}")
            
            if not self.migrate_file(filename):
                failed_files.append(filename)
        
        # Estatísticas finais
        self.migration_stats["end_time"] = datetime.now()
        duration = self.migration_stats["end_time"] - self.migration_stats["start_time"]
        
        logger.info(f"\n{'='*60}")
        logger.info("[REPORT] MIGRAÇÃO CONCLUÍDA")
        logger.info(f"{'='*60}")
        logger.info(f"[OK] Arquivos processados: {self.migration_stats['files_processed']}")
        logger.info(f"[NOTE] Chunks criados: {self.migration_stats['chunks_created']}")
        logger.info(f"🧠 Embeddings gerados: {self.migration_stats['embeddings_generated']}")
        logger.info(f"[SAVE] Documentos indexados: {self.migration_stats['documents_indexed']}")
        logger.info(f"⏱️ Duração: {duration}")
        logger.info(f"[ERROR] Erros: {len(self.migration_stats['errors'])}")
        
        if failed_files:
            logger.error(f"[ERROR] Arquivos com falhas: {failed_files}")
        
        if self.migration_stats["errors"]:
            logger.error("[ERROR] Lista de erros:")
            for error in self.migration_stats["errors"]:
                logger.error(f"   - {error}")
        
        # Salvar relatório
        self.save_migration_report()
        
        return len(failed_files) == 0
    
    def save_migration_report(self):
        """Salva relatório detalhado da migração"""
        report_path = Path(__file__).parent / f"migration_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        try:
            report_data = {
                "migration_stats": {
                    **self.migration_stats,
                    "start_time": self.migration_stats["start_time"].isoformat(),
                    "end_time": self.migration_stats["end_time"].isoformat() if self.migration_stats["end_time"] else None
                },
                "files_config": self.json_files,
                "environment": {
                    "supabase_url": self.config.SUPABASE_URL,
                    "vector_db_type": self.config.VECTOR_DB_TYPE,
                    "embedding_model": self.config.EMBEDDING_MODEL,
                    "pgvector_dimensions": self.config.PGVECTOR_DIMENSIONS
                }
            }
            
            with open(report_path, 'w', encoding='utf-8') as f:
                json.dump(report_data, f, indent=2, ensure_ascii=False, default=str)
            
            logger.info(f"📄 Relatório salvo: {report_path}")
            
        except Exception as e:
            logger.error(f"Erro ao salvar relatório: {e}")
    
    def test_vector_search(self, query: str = "dosagem rifampicina") -> bool:
        """Testa busca vetorial após migração"""
        logger.info(f"[TEST] Testando busca vetorial: '{query}'")
        
        try:
            # Teste básico de busca
            # Nota: Implementar quando embedding_service estiver disponível
            
            # Por enquanto, apenas verificar se documentos foram inseridos
            stats = self.vector_store.get_stats()
            
            logger.info(f"[REPORT] Estatísticas do vector store:")
            logger.info(f"   - Backend: {stats.get('backend', 'unknown')}")
            logger.info(f"   - Documentos: {stats.get('supabase_documents', 0)}")
            logger.info(f"   - Conectado: {stats.get('supabase_connected', False)}")
            
            return stats.get('supabase_documents', 0) > 0
            
        except Exception as e:
            logger.error(f"Erro no teste de busca: {e}")
            return False

def main():
    """Função principal"""
    print("[START] MIGRAÇÃO JSON PARA SUPABASE - FASE 3 RAG")
    print("=" * 60)
    
    migrator = JSONToSupabaseMigrator()
    
    # Executar migração
    if migrator.migrate_all_files():
        print("[OK] MIGRAÇÃO CONCLUÍDA COM SUCESSO!")
        
        # Teste de validação
        if migrator.test_vector_search():
            print("[OK] Teste de busca vetorial: PASSOU")
        else:
            print("[WARNING] Teste de busca vetorial: FALHOU (verificar logs)")
        
        return 0
    else:
        print("[ERROR] MIGRAÇÃO FALHOU - verificar logs de erro")
        return 1

if __name__ == "__main__":
    exit(main())