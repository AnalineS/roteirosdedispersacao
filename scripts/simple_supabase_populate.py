#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script simplificado para popular Supabase com dados médicos
Sem dependências complexas, apenas os dados básicos para ativar o serviço
"""

import os
import sys
import json
import logging
from pathlib import Path
from datetime import datetime, timezone
import hashlib

# Configurar encoding para Windows
if os.name == 'nt':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.detach())
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.detach())

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def load_json_file(file_path: Path) -> dict:
    """Carrega arquivo JSON"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"Erro ao carregar {file_path}: {e}")
        return {}

def generate_document_id(text: str) -> str:
    """Gera ID único para documento"""
    return hashlib.sha256(text.encode()).hexdigest()[:16]

def process_json_file(file_path: Path, chunk_type: str, priority: float):
    """Processa um arquivo JSON e extrai conteúdo"""
    logger.info(f"Processando: {file_path.name}")
    
    data = load_json_file(file_path)
    if not data:
        return []
    
    documents = []
    
    # Processar diferentes estruturas de JSON
    if isinstance(data, list):
        # Lista de itens
        for i, item in enumerate(data):
            if isinstance(item, dict):
                text = json.dumps(item, ensure_ascii=False, indent=2)
                doc = {
                    'id': generate_document_id(f"{file_path.stem}_{i}"),
                    'content': text,
                    'metadata': {
                        'source': file_path.name,
                        'chunk_index': i,
                        'chunk_type': chunk_type,
                        'priority': priority,
                        'original_type': 'list_item'
                    },
                    'created_at': datetime.now(timezone.utc).isoformat()
                }
                documents.append(doc)
    
    elif isinstance(data, dict):
        # Objeto único ou coleção de objetos
        if any(key in data for key in ['questions', 'protocols', 'medications', 'guidelines']):
            # Estrutura com chaves conhecidas
            for key, value in data.items():
                if isinstance(value, (list, dict)):
                    text = json.dumps({key: value}, ensure_ascii=False, indent=2)
                    doc = {
                        'id': generate_document_id(f"{file_path.stem}_{key}"),
                        'content': text,
                        'metadata': {
                            'source': file_path.name,
                            'section': key,
                            'chunk_type': chunk_type,
                            'priority': priority,
                            'original_type': 'section'
                        },
                        'created_at': datetime.now(timezone.utc).isoformat()
                    }
                    documents.append(doc)
        else:
            # Objeto simples
            text = json.dumps(data, ensure_ascii=False, indent=2)
            doc = {
                'id': generate_document_id(file_path.stem),
                'content': text,
                'metadata': {
                    'source': file_path.name,
                    'chunk_type': chunk_type,
                    'priority': priority,
                    'original_type': 'document'
                },
                'created_at': datetime.now(timezone.utc).isoformat()
            }
            documents.append(doc)
    
    logger.info(f"✅ {file_path.name}: {len(documents)} documentos extraídos")
    return documents

def main():
    """Função principal"""
    logger.info("🚀 Iniciando população simplificada do Supabase")
    
    # Diretório de dados
    script_dir = Path(__file__).parent
    data_dir = script_dir.parent / "data" / "structured"
    
    if not data_dir.exists():
        logger.error(f"❌ Diretório de dados não encontrado: {data_dir}")
        return False
    
    # Mapeamento de arquivos
    json_files = {
        "clinical_taxonomy.json": {"chunk_type": "taxonomy", "priority": 0.8},
        "dosing_protocols.json": {"chunk_type": "dosage", "priority": 1.0},
        "medications_mechanisms.json": {"chunk_type": "mechanism", "priority": 0.7},
        "dispensing_workflow.json": {"chunk_type": "protocol", "priority": 0.9},
        "pharmacovigilance_guidelines.json": {"chunk_type": "safety", "priority": 0.95},
        "hanseniase_catalog.json": {"chunk_type": "catalog", "priority": 0.8},
        "quick_reference_protocols.json": {"chunk_type": "reference", "priority": 0.85},
        "frequently_asked_questions.json": {"chunk_type": "faq", "priority": 0.6},
        "knowledge_scope_limitations.json": {"chunk_type": "scope", "priority": 0.5}
    }
    
    all_documents = []
    
    # Processar cada arquivo
    for filename, config in json_files.items():
        file_path = data_dir / filename
        if file_path.exists():
            docs = process_json_file(file_path, config["chunk_type"], config["priority"])
            all_documents.extend(docs)
        else:
            logger.warning(f"⚠️ Arquivo não encontrado: {filename}")
    
    # Salvar resultado
    output_file = script_dir / f"supabase_documents_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_documents, f, ensure_ascii=False, indent=2)
    
    logger.info(f"📊 Resumo da Migração:")
    logger.info(f"   • Total de documentos: {len(all_documents)}")
    logger.info(f"   • Arquivo de saída: {output_file.name}")
    
    # Agrupamento por tipo
    types_count = {}
    for doc in all_documents:
        chunk_type = doc['metadata']['chunk_type']
        types_count[chunk_type] = types_count.get(chunk_type, 0) + 1
    
    logger.info(f"   • Distribuição por tipo:")
    for chunk_type, count in sorted(types_count.items()):
        logger.info(f"     - {chunk_type}: {count} documentos")
    
    logger.info("✅ População do Supabase preparada com sucesso!")
    logger.info("")
    logger.info("📝 Próximos passos:")
    logger.info("1. Configure as credenciais do Supabase no GitHub Secrets")
    logger.info("2. Execute o deploy para HML para testar a integração")
    logger.info("3. Monitore os logs para validar a indexação")
    logger.info("")
    logger.info("💡 Os documentos foram processados e estão prontos para indexação automática")
    logger.info(f"   durante a inicialização do serviço quando SUPABASE_ENABLED=true")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)