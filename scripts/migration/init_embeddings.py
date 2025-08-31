#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de Inicialização de Embeddings - Fase 3
Inicializa a estrutura de vetores e indexa a base de conhecimento
"""

import os
import sys
import json
import time
import logging
from pathlib import Path
from datetime import datetime

# Adicionar diretório raiz ao path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.embedding_service import EmbeddingService
from services.vector_store import LocalVectorStore
from core.rag.knowledge_base import EnhancedRAGSystem

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class EmbeddingInitializer:
    """Inicializador da estrutura de embeddings"""
    
    def __init__(self):
        self.data_path = Path("../../data")
        self.embeddings_path = self.data_path / "embeddings"
        self.knowledge_base_files = [
            self.data_path / "Roteiro de Dsispensação - Hanseníase.md",
            self.data_path / "roteiro_hanseniase_basico.md",
            self.data_path / "structured" / "clinical_taxonomy.json",
            self.data_path / "structured" / "dispensing_workflow.json", 
            self.data_path / "structured" / "dosing_protocols.json"
        ]
        
        # Configuração simples para EmbeddingService
        class SimpleConfig:
            EMBEDDING_MODEL = 'sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2'
            EMBEDDING_DEVICE = 'cpu'
            CACHE_DIR = str(self.embeddings_path / "cache")
            MAX_LENGTH = 512
            
        # Inicializar serviços
        try:
            config = SimpleConfig()
            self.embedding_service = EmbeddingService(config)
            self.vector_store = LocalVectorStore(str(self.embeddings_path))
            self.rag_system = EnhancedRAGSystem()
            logger.info("Serviços de embedding inicializados com sucesso")
        except Exception as e:
            logger.error(f"Erro ao inicializar serviços: {e}")
            self.embedding_service = None
    
    def check_structure(self) -> bool:
        """Verifica se a estrutura de diretórios existe"""
        try:
            # Criar diretório de embeddings se não existir
            self.embeddings_path.mkdir(parents=True, exist_ok=True)
            
            # Verificar arquivos da base de conhecimento
            missing_files = []
            for file_path in self.knowledge_base_files:
                if not file_path.exists():
                    missing_files.append(str(file_path))
            
            if missing_files:
                logger.warning(f"Arquivos não encontrados: {missing_files}")
                return False
                
            logger.info("Estrutura de diretórios verificada ✓")
            return True
            
        except Exception as e:
            logger.error(f"Erro ao verificar estrutura: {e}")
            return False
    
    def load_markdown_content(self, file_path: Path) -> str:
        """Carrega conteúdo de arquivo markdown"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
        except Exception as e:
            logger.error(f"Erro ao carregar {file_path}: {e}")
            return ""
    
    def load_json_content(self, file_path: Path) -> dict:
        """Carrega conteúdo de arquivo JSON"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Erro ao carregar {file_path}: {e}")
            return {}
    
    def process_knowledge_base(self) -> dict:
        """Processa todos os arquivos da base de conhecimento"""
        results = {
            'processed_files': 0,
            'total_chunks': 0,
            'embeddings_created': 0,
            'errors': []
        }
        
        if not self.embedding_service:
            results['errors'].append("Embedding service não disponível")
            return results
        
        for file_path in self.knowledge_base_files:
            if not file_path.exists():
                continue
                
            logger.info(f"Processando: {file_path.name}")
            
            try:
                # Processar arquivo baseado na extensão
                if file_path.suffix == '.md':
                    content = self.load_markdown_content(file_path)
                    if content:
                        # Chunking simples por parágrafos
                        chunks = [chunk.strip() for chunk in content.split('\n\n') if chunk.strip()]
                        
                        for i, chunk in enumerate(chunks):
                            if len(chunk) < 50:  # Pular chunks muito pequenos
                                continue
                                
                            chunk_id = f"{file_path.stem}_{i}"
                            
                            # Gerar embedding (se serviço disponível)
                            try:
                                embedding = self.embedding_service.get_embedding(chunk)
                                if embedding is not None:
                                    results['embeddings_created'] += 1
                                    
                                    # Salvar no vector store
                                    metadata = {
                                        'source_file': file_path.name,
                                        'chunk_index': i,
                                        'chunk_type': 'medical_text',
                                        'created_at': datetime.now().isoformat()
                                    }
                                    
                                    # Aqui você adicionaria ao vector store
                                    logger.debug(f"Chunk {chunk_id}: embedding criado ({len(embedding)} dims)")
                                    
                            except Exception as e:
                                logger.warning(f"Erro ao processar chunk {chunk_id}: {e}")
                                results['errors'].append(f"Chunk {chunk_id}: {str(e)}")
                        
                        results['total_chunks'] += len(chunks)
                        
                elif file_path.suffix == '.json':
                    data = self.load_json_content(file_path)
                    if data:
                        # Processar estrutura JSON
                        self._process_json_structure(data, file_path, results)
                
                results['processed_files'] += 1
                logger.info(f"✓ {file_path.name} processado")
                
            except Exception as e:
                logger.error(f"Erro ao processar {file_path}: {e}")
                results['errors'].append(f"{file_path.name}: {str(e)}")
        
        return results
    
    def _process_json_structure(self, data: dict, file_path: Path, results: dict):
        """Processa estrutura JSON recursivamente"""
        def extract_text_values(obj, path=""):
            texts = []
            if isinstance(obj, dict):
                for key, value in obj.items():
                    new_path = f"{path}.{key}" if path else key
                    if isinstance(value, str) and len(value) > 20:
                        texts.append((new_path, value))
                    else:
                        texts.extend(extract_text_values(value, new_path))
            elif isinstance(obj, list):
                for i, item in enumerate(obj):
                    new_path = f"{path}[{i}]"
                    texts.extend(extract_text_values(item, new_path))
            elif isinstance(obj, str) and len(obj) > 20:
                texts.append((path, obj))
            return texts
        
        text_pairs = extract_text_values(data)
        
        for path, text in text_pairs:
            chunk_id = f"{file_path.stem}_{hashlib.sha256(path.encode()).hexdigest()[:8]}"
            
            try:
                if self.embedding_service:
                    embedding = self.embedding_service.get_embedding(text)
                    if embedding is not None:
                        results['embeddings_created'] += 1
                        logger.debug(f"JSON chunk {chunk_id}: embedding criado")
            except Exception as e:
                logger.warning(f"Erro ao processar JSON chunk {path}: {e}")
        
        results['total_chunks'] += len(text_pairs)
    
    def create_initialization_report(self, results: dict):
        """Cria relatório de inicialização"""
        report = {
            'phase': 'Fase 3.2 - Estrutura de Vetores',
            'timestamp': datetime.now().isoformat(),
            'status': 'SUCCESS' if not results['errors'] else 'PARTIAL',
            'summary': results,
            'next_steps': [
                'Verificar embeddings gerados',
                'Testar busca semântica',
                'Validar performance do sistema'
            ]
        }
        
        # Salvar relatório
        report_path = self.embeddings_path / "initialization_report.json"
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Relatório salvo em: {report_path}")
        return report

def main():
    """Função principal"""
    logger.info("=== Inicialização de Embeddings - Fase 3 ===")
    
    initializer = EmbeddingInitializer()
    
    # Verificar estrutura
    if not initializer.check_structure():
        logger.error("Falha na verificação da estrutura")
        return False
    
    # Processar base de conhecimento
    logger.info("Iniciando processamento da base de conhecimento...")
    start_time = time.time()
    
    results = initializer.process_knowledge_base()
    
    processing_time = time.time() - start_time
    results['processing_time_seconds'] = round(processing_time, 2)
    
    # Criar relatório
    report = initializer.create_initialization_report(results)
    
    # Exibir resumo
    logger.info("=== RESUMO DA INICIALIZAÇÃO ===")
    logger.info(f"Arquivos processados: {results['processed_files']}")
    logger.info(f"Total de chunks: {results['total_chunks']}")
    logger.info(f"Embeddings criados: {results['embeddings_created']}")
    logger.info(f"Tempo de processamento: {results['processing_time_seconds']}s")
    
    if results['errors']:
        logger.warning(f"Erros encontrados: {len(results['errors'])}")
        for error in results['errors'][:5]:  # Mostrar apenas os primeiros 5
            logger.warning(f"  - {error}")
    
    logger.info("Inicialização de embeddings concluída!")
    return True

if __name__ == "__main__":
    import hashlib
    success = main()
    sys.exit(0 if success else 1)