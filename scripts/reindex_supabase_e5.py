# -*- coding: utf-8 -*-
"""
Script de Re-indexação Supabase com multilingual-e5-small
Substitui embeddings de 279D (modelo desconhecido) por 384D (e5-small)
"""

import os
import sys
import logging
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any, Optional
import time

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / 'apps' / 'backend'))

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def load_environment():
    """Load environment variables from backend .env file"""
    try:
        from dotenv import load_dotenv
        # Use backend .env file as directed by user
        env_file = Path(__file__).parent.parent / 'apps' / 'backend' / '.env'
        if env_file.exists():
            load_dotenv(env_file)
            logger.info(f"[INFO] Loaded environment from {env_file}")
            logger.info(f"[INFO] SUPABASE_URL: {os.getenv('SUPABASE_URL')}")
        else:
            logger.warning(f"[WARNING] Backend .env not found at {env_file}, using system environment")
    except ImportError:
        logger.info("[INFO] Using system environment variables")

def verify_dependencies():
    """Verify all required dependencies"""
    logger.info("🔍 Verificando dependências...")

    missing = []

    try:
        from sentence_transformers import SentenceTransformer
        logger.info("✅ sentence-transformers disponível")
    except ImportError:
        missing.append("sentence-transformers")

    try:
        from supabase import create_client
        logger.info("✅ supabase disponível")
    except ImportError:
        missing.append("supabase")

    try:
        import numpy as np
        logger.info("✅ numpy disponível")
    except ImportError:
        missing.append("numpy")

    try:
        from tqdm import tqdm
        logger.info("✅ tqdm disponível")
    except ImportError:
        missing.append("tqdm")

    if missing:
        logger.error(f"❌ Dependências faltando: {', '.join(missing)}")
        logger.error(f"Instale com: pip install {' '.join(missing)}")
        return False

    return True

def get_supabase_client():
    """Get Supabase client"""
    from supabase import create_client

    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_KEY') or os.getenv('SUPABASE_ANON_KEY')

    if not supabase_url or not supabase_key:
        raise ValueError(
            "Configuração Supabase incompleta. Necessário:\n"
            "  - SUPABASE_URL\n"
            "  - SUPABASE_SERVICE_KEY ou SUPABASE_ANON_KEY"
        )

    logger.info(f"📡 Conectando ao Supabase: {supabase_url}")
    return create_client(supabase_url, supabase_key)

def load_embedding_model():
    """Load multilingual-e5-small model"""
    from sentence_transformers import SentenceTransformer

    model_name = 'intfloat/multilingual-e5-small'
    logger.info(f"🧠 Carregando modelo: {model_name}")

    start_time = time.time()
    model = SentenceTransformer(model_name)
    load_time = time.time() - start_time

    dimension = model.get_sentence_embedding_dimension()
    logger.info(f"✅ Modelo carregado em {load_time:.2f}s - Dimensão: {dimension}")

    if dimension != 384:
        raise ValueError(f"Dimensão incorreta: esperado 384, obtido {dimension}")

    return model

def fetch_documents(supabase) -> List[Dict[str, Any]]:
    """Fetch all documents from Supabase"""
    logger.info("📥 Buscando documentos do Supabase...")

    try:
        response = supabase.table('medical_embeddings').select('*').execute()
        documents = response.data

        if not documents:
            logger.warning("⚠️ Nenhum documento encontrado na tabela")
            return []

        logger.info(f"✅ Encontrados {len(documents)} documentos")

        # Analyze current embeddings
        if documents:
            first_doc = documents[0]
            if 'embedding' in first_doc and first_doc['embedding']:
                current_dim = len(first_doc['embedding'])
                logger.info(f"📊 Dimensão atual dos embeddings: {current_dim}D")
                logger.info(f"🎯 Nova dimensão: 384D (multilingual-e5-small)")

        return documents

    except Exception as e:
        logger.error(f"❌ Erro ao buscar documentos: {e}")
        raise

def reindex_documents(supabase, model, documents: List[Dict[str, Any]], batch_size: int = 10):
    """Re-index all documents with new embeddings"""
    from tqdm import tqdm
    import numpy as np

    total = len(documents)
    logger.info(f"🔄 Iniciando re-indexação de {total} documentos (batch_size={batch_size})")

    success_count = 0
    error_count = 0
    errors = []

    # Process in batches
    for i in tqdm(range(0, total, batch_size), desc="Re-indexando"):
        batch = documents[i:i + batch_size]

        try:
            # Extract texts
            texts = []
            for doc in batch:
                content = doc.get('content') or doc.get('text') or ''
                if not content:
                    logger.warning(f"⚠️ Documento {doc.get('id')} sem conteúdo")
                    error_count += 1
                    continue
                texts.append(content)

            if not texts:
                continue

            # Generate new embeddings
            embeddings = model.encode(texts, convert_to_numpy=True, normalize_embeddings=True)

            # Update Supabase
            for j, (doc, embedding) in enumerate(zip(batch, embeddings)):
                doc_id = doc.get('id')

                if doc_id is None:
                    logger.warning(f"⚠️ Documento sem ID: {doc}")
                    error_count += 1
                    continue

                try:
                    # Convert numpy array to list for JSON
                    embedding_list = embedding.tolist() if isinstance(embedding, np.ndarray) else embedding

                    # Update document
                    supabase.table('medical_embeddings').update({
                        'embedding': embedding_list,
                        'updated_at': datetime.now().isoformat()
                    }).eq('id', doc_id).execute()

                    success_count += 1

                except Exception as update_error:
                    error_msg = f"Erro ao atualizar doc {doc_id}: {update_error}"
                    logger.error(f"❌ {error_msg}")
                    errors.append(error_msg)
                    error_count += 1

            # Rate limiting (avoid overwhelming Supabase)
            time.sleep(0.1)

        except Exception as batch_error:
            error_msg = f"Erro no batch {i//batch_size + 1}: {batch_error}"
            logger.error(f"❌ {error_msg}")
            errors.append(error_msg)
            error_count += len(batch)

    logger.info("=" * 80)
    logger.info(f"✅ Re-indexação concluída!")
    logger.info(f"📊 Sucesso: {success_count}/{total}")
    logger.info(f"❌ Erros: {error_count}/{total}")

    if errors:
        logger.warning(f"⚠️ {len(errors)} erros encontrados:")
        for error in errors[:10]:  # Show first 10 errors
            logger.warning(f"  - {error}")

    return success_count, error_count

def verify_reindex(supabase, sample_size: int = 5):
    """Verify reindexing by checking sample documents"""
    logger.info(f"🔍 Verificando re-indexação (amostra de {sample_size} docs)...")

    try:
        response = supabase.table('medical_embeddings').select('*').limit(sample_size).execute()
        documents = response.data

        if not documents:
            logger.warning("⚠️ Nenhum documento encontrado para verificação")
            return False

        all_correct = True
        for doc in documents:
            embedding = doc.get('embedding')
            if not embedding:
                logger.error(f"❌ Doc {doc.get('id')} sem embedding")
                all_correct = False
                continue

            dim = len(embedding)
            if dim != 384:
                logger.error(f"❌ Doc {doc.get('id')}: dimensão incorreta {dim}D (esperado 384D)")
                all_correct = False
            else:
                logger.info(f"✅ Doc {doc.get('id')}: 384D correto")

        return all_correct

    except Exception as e:
        logger.error(f"❌ Erro na verificação: {e}")
        return False

def main():
    """Main execution"""
    logger.info("=" * 80)
    logger.info("🚀 SCRIPT DE RE-INDEXAÇÃO SUPABASE")
    logger.info("📋 Modelo: intfloat/multilingual-e5-small (384D)")
    logger.info("=" * 80)

    # Step 1: Load environment
    load_environment()

    # Step 2: Verify dependencies
    if not verify_dependencies():
        logger.error("❌ Dependências faltando. Abortando.")
        return 1

    # Step 3: Get Supabase client
    try:
        supabase = get_supabase_client()
    except Exception as e:
        logger.error(f"❌ Erro ao conectar Supabase: {e}")
        return 1

    # Step 4: Load embedding model
    try:
        model = load_embedding_model()
    except Exception as e:
        logger.error(f"❌ Erro ao carregar modelo: {e}")
        return 1

    # Step 5: Fetch documents
    try:
        documents = fetch_documents(supabase)
        if not documents:
            logger.warning("⚠️ Nenhum documento para re-indexar")
            return 0
    except Exception as e:
        logger.error(f"❌ Erro ao buscar documentos: {e}")
        return 1

    # Step 6: Confirm before proceeding (skip if --force)
    import sys
    force_mode = '--force' in sys.argv

    if not force_mode:
        logger.warning(f"[WARNING] You are about to re-index {len(documents)} documents")
        logger.info(f"[INFO] Old model: unknown (4646D)")
        logger.info(f"[INFO] New model: intfloat/multilingual-e5-small (384D)")
        response = input("\nContinue? (yes/no): ").strip().lower()

        if response not in ['sim', 's', 'yes', 'y']:
            logger.info("[INFO] Re-indexing canceled by user")
            return 0
    else:
        logger.info(f"[INFO] FORCE MODE: Re-indexing {len(documents)} documents without confirmation")

    # Step 7: Reindex documents
    try:
        success, errors = reindex_documents(supabase, model, documents)

        if errors > 0:
            logger.warning(f"⚠️ Re-indexação completada com {errors} erros")
    except Exception as e:
        logger.error(f"❌ Erro durante re-indexação: {e}")
        return 1

    # Step 8: Verify reindex
    if verify_reindex(supabase):
        logger.info("✅ Verificação bem-sucedida!")
    else:
        logger.warning("⚠️ Verificação encontrou problemas")

    logger.info("=" * 80)
    logger.info("🎉 RE-INDEXAÇÃO CONCLUÍDA!")
    logger.info("=" * 80)

    return 0

if __name__ == '__main__':
    exit_code = main()
    sys.exit(exit_code)
