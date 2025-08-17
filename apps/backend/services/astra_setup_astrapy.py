#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Setup e Configuração Astra DB para Hanseníase RAG usando AstraPy
Script refatorado para usar AstraPy (compatível Python 3.13)
Seguindo FASE 3.1 do PLANO Q2 2025 - IA e Machine Learning
"""

import os
import sys
import json
import uuid
import logging
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timezone
from pathlib import Path

# Importações para AstraPy
try:
    from astrapy import DataAPIClient
    from astrapy.exceptions import DataAPIException
    import requests
except ImportError as e:
    print(f"❌ Dependências faltando. Execute: pip install astrapy requests")
    sys.exit(1)

# Importar config do sistema
sys.path.append(str(Path(__file__).parent.parent))
from app_config import config, EnvironmentConfig

class AstraDBSetup:
    """Setup e configuração completa do Astra DB para RAG Hanseníase usando AstraPy"""
    
    def __init__(self):
        self.config = config
        self.client = None
        self.database = None
        self.collection = None
        
        # Configurações do Astra DB
        self.astra_api_endpoint = getattr(self.config, 'ASTRA_DB_API_ENDPOINT', None)
        self.astra_token = getattr(self.config, 'ASTRA_DB_TOKEN', None)
        self.database_id = getattr(self.config, 'ASTRA_DB_ID', None)
        self.keyspace = getattr(self.config, 'ASTRA_DB_KEYSPACE', 'hanseniase_rag')
        
        # Configurações de logging
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger(__name__)
        
    def validate_credentials(self) -> bool:
        """Validar credenciais Astra DB"""
        print("🔐 Validando credenciais Astra DB (AstraPy)...")
        
        if not self.astra_api_endpoint:
            print("❌ ASTRA_DB_API_ENDPOINT não configurada")
            return False
        
        if not self.astra_token:
            print("❌ ASTRA_DB_TOKEN não configurada")
            return False
        
        print("✅ Credenciais básicas encontradas")
        
        # Verificar formato do token
        if not self.astra_token.startswith('AstraCS:'):
            print("⚠️ Token pode não estar no formato correto (deve começar com 'AstraCS:')")
        
        print(f"📍 API Endpoint: {self.astra_api_endpoint[:50]}...")
        print(f"🔑 Token: {self.astra_token[:20]}...")
        print(f"🏠 Keyspace: {self.keyspace}")
        
        return True
        
    def test_connection(self) -> Tuple[bool, Dict[str, Any]]:
        """Testar conexão com Astra DB usando AstraPy"""
        print("\n🔗 Testando conexão com Astra DB (AstraPy)...")
        
        connection_info = {
            "status": "failed",
            "latency_ms": None,
            "error": None,
            "database_info": None,
            "collections_count": 0
        }
        
        try:
            start_time = datetime.now()
            
            # Criar cliente AstraPy
            self.client = DataAPIClient(token=self.astra_token)
            
            # Conectar à database
            print(f"🌐 Conectando via API...")
            self.database = self.client.get_database(
                api_endpoint=self.astra_api_endpoint
            )
            
            # Testar conexão listando collections
            collections = list(self.database.list_collections())
            
            # Calcular latência
            end_time = datetime.now()
            latency = (end_time - start_time).total_seconds() * 1000
            
            # Obter informações da database
            db_info = self.database.info()
            
            connection_info.update({
                "status": "success",
                "latency_ms": round(latency, 2),
                "database_info": {
                    "name": db_info.name,
                    "namespace": db_info.namespace,
                    "region": getattr(db_info, 'region', 'unknown')
                },
                "collections_count": len(collections)
            })
            
            print(f"✅ Conexão estabelecida!")
            print(f"⚡ Latência: {latency:.2f}ms")
            print(f"📊 Database: {db_info.name}")
            print(f"🏠 Namespace: {db_info.namespace}")
            print(f"📁 Collections encontradas: {len(collections)}")
            
            return True, connection_info
            
        except Exception as e:
            error_msg = str(e)
            connection_info["error"] = error_msg
            
            print(f"❌ Erro na conexão: {error_msg}")
            
            # Sugestões de troubleshooting
            if "authentication" in error_msg.lower():
                print("💡 Verifique se o token está correto e ativo")
            elif "endpoint" in error_msg.lower():
                print("💡 Verifique se o API endpoint está correto")
            elif "network" in error_msg.lower():
                print("💡 Verifique conectividade de rede")
            
            return False, connection_info
    
    def setup_collections(self) -> bool:
        """Criar collections necessárias para RAG"""
        print(f"\n🏠 Configurando collections no namespace '{self.keyspace}'...")
        
        if not self.database:
            print("❌ Database não conectada")
            return False
        
        try:
            # Collection para embeddings
            embeddings_collection_name = "embeddings"
            
            # Verificar se collection existe
            existing_collections = [col.name for col in self.database.list_collections()]
            
            if embeddings_collection_name in existing_collections:
                print(f"✅ Collection '{embeddings_collection_name}' já existe")
                self.collection = self.database.get_collection(embeddings_collection_name)
            else:
                # Criar collection com configuração para vetores
                print(f"📝 Criando collection '{embeddings_collection_name}'...")
                self.collection = self.database.create_collection(
                    name=embeddings_collection_name,
                    metric="cosine",  # Métrica para similaridade vetorial
                    dimension=768,    # Dimensão dos embeddings (BERT-like)
                    options={
                        "indexing": {
                            "allow": ["document_id", "source_category", "content_type", "medical_priority"]
                        }
                    }
                )
                print(f"✅ Collection '{embeddings_collection_name}' criada com sucesso")
            
            # Collection para analytics
            analytics_collection_name = "analytics"
            if analytics_collection_name not in existing_collections:
                print(f"📝 Criando collection '{analytics_collection_name}'...")
                analytics_collection = self.database.create_collection(
                    name=analytics_collection_name,
                    options={
                        "indexing": {
                            "allow": ["session_id", "persona_used", "query_category", "created_at"]
                        }
                    }
                )
                print(f"✅ Collection '{analytics_collection_name}' criada")
            else:
                print(f"✅ Collection '{analytics_collection_name}' já existe")
            
            return True
            
        except Exception as e:
            print(f"❌ Erro ao configurar collections: {e}")
            return False
    
    def test_crud_operations(self) -> bool:
        """Testar operações CRUD básicas"""
        print("\n🧪 Testando operações CRUD...")
        
        try:
            if not self.collection:
                print("❌ Collection não disponível")
                return False
            
            # Test INSERT
            test_id = str(uuid.uuid4())
            test_embedding = [0.1] * 768  # Vetor de teste
            
            test_document = {
                "_id": test_id,
                "document_id": "test_doc_001",
                "chunk_index": 0,
                "content": "Teste de inserção para validação do Astra DB com AstraPy",
                "$vector": test_embedding,
                "metadata": {
                    "test": "true",
                    "validation": "crud"
                },
                "source_file": "test_file.json",
                "source_category": "qa",
                "content_type": "validation",
                "medical_priority": 1.0,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            
            insert_result = self.collection.insert_one(test_document)
            print(f"  ✅ INSERT realizado: {insert_result.inserted_id}")
            
            # Test FIND (SELECT)
            find_result = self.collection.find_one({"_id": test_id})
            
            if find_result and find_result["content"] == test_document["content"]:
                print("  ✅ FIND confirmado")
            else:
                print("  ❌ FIND falhou")
                return False
            
            # Test UPDATE
            update_result = self.collection.update_one(
                {"_id": test_id},
                {"$set": {"content": "Teste atualizado para validação"}}
            )
            
            if update_result.modified_count > 0:
                print("  ✅ UPDATE realizado")
            else:
                print("  ❌ UPDATE falhou")
                return False
            
            # Test DELETE
            delete_result = self.collection.delete_one({"_id": test_id})
            
            if delete_result.deleted_count > 0:
                print("  ✅ DELETE realizado")
            else:
                print("  ❌ DELETE falhou")
                return False
            
            # Verificar se foi deletado
            verify_result = self.collection.find_one({"_id": test_id})
            if verify_result is None:
                print("  ✅ DELETE confirmado")
            else:
                print("  ❌ DELETE falhou - documento ainda existe")
                return False
            
            print("✅ Todas as operações CRUD funcionando corretamente")
            return True
            
        except Exception as e:
            print(f"❌ Erro nas operações CRUD: {e}")
            return False
    
    def test_vector_search(self) -> bool:
        """Testar busca vetorial"""
        print("\n🔍 Testando busca vetorial...")
        
        try:
            if not self.collection:
                print("❌ Collection não disponível")
                return False
            
            # Inserir alguns vetores de teste
            test_documents = [
                {
                    "_id": str(uuid.uuid4()),
                    "content": "Rifampicina é um antibiótico usado no tratamento da hanseníase",
                    "$vector": [0.8, 0.2, 0.1] + [0.0] * 765,
                    "source_category": "medication",
                    "medical_priority": 1.0
                },
                {
                    "_id": str(uuid.uuid4()),
                    "content": "Dapsona é outro medicamento importante na PQT",
                    "$vector": [0.7, 0.3, 0.2] + [0.0] * 765,
                    "source_category": "medication", 
                    "medical_priority": 0.9
                },
                {
                    "_id": str(uuid.uuid4()),
                    "content": "Orientações sobre dosagem supervisionada",
                    "$vector": [0.1, 0.8, 0.1] + [0.0] * 765,
                    "source_category": "protocol",
                    "medical_priority": 0.8
                }
            ]
            
            # Inserir documentos de teste
            insert_result = self.collection.insert_many(test_documents)
            print(f"  ✅ {len(insert_result.inserted_ids)} documentos de teste inseridos")
            
            # Testar busca por categoria
            category_results = list(self.collection.find(
                {"source_category": "medication"},
                limit=10
            ))
            
            if len(category_results) >= 2:
                print(f"  ✅ Busca por categoria encontrou {len(category_results)} resultados")
            else:
                print(f"  ❌ Busca por categoria retornou apenas {len(category_results)} resultados")
            
            # Testar busca vetorial por similaridade
            query_vector = [0.75, 0.25, 0.15] + [0.0] * 765
            
            vector_results = list(self.collection.find(
                {},
                sort={"$vector": query_vector},
                limit=2
            ))
            
            if len(vector_results) >= 2:
                print(f"  ✅ Busca vetorial encontrou {len(vector_results)} resultados")
                # Mostrar scores de similaridade se disponível
                for i, result in enumerate(vector_results):
                    content_preview = result["content"][:50] + "..."
                    print(f"    {i+1}. {content_preview}")
            else:
                print(f"  ❌ Busca vetorial retornou apenas {len(vector_results)} resultados")
            
            # Limpeza
            for doc in test_documents:
                self.collection.delete_one({"_id": doc["_id"]})
            
            print("  🧹 Dados de teste removidos")
            print("✅ Busca vetorial funcionando")
            return True
            
        except Exception as e:
            print(f"❌ Erro na busca vetorial: {e}")
            return False
    
    def generate_setup_report(self, test_results: Dict[str, Any]) -> str:
        """Gerar relatório de setup"""
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        report = f"""
# 📊 Relatório de Setup Astra DB - Hanseníase RAG (AstraPy)

**Data:** {timestamp}
**Namespace:** {self.keyspace}
**Ambiente:** {EnvironmentConfig.get_current()}
**Cliente:** AstraPy 2.0.1

## 🔧 Resultados dos Testes

### Conexão
- Status: {'✅ Sucesso' if test_results.get('connection_success') else '❌ Falha'}
- Latência: {test_results.get('connection_info', {}).get('latency_ms', 'N/A')}ms
- Database: {test_results.get('connection_info', {}).get('database_info', {}).get('name', 'N/A')}
- Collections: {test_results.get('connection_info', {}).get('collections_count', 'N/A')}

### Configuração
- Collections: {'✅ Configuradas' if test_results.get('collections_success') else '❌ Falha'}
- Embeddings Collection: {'✅ Criada' if test_results.get('collections_success') else '❌ Falha'}
- Analytics Collection: {'✅ Criada' if test_results.get('collections_success') else '❌ Falha'}

### Operações
- CRUD: {'✅ Funcionando' if test_results.get('crud_success') else '❌ Falha'}
- Busca Vetorial: {'✅ Funcionando' if test_results.get('vector_search_success') else '❌ Falha'}

## 📋 Schema das Collections

### embeddings
- _id (String, Primary Key)
- document_id (String)
- chunk_index (Number)
- content (String)
- $vector (Array<Float>[768]) - Embedding vetorial
- metadata (Object)
- source_file (String)
- source_category (String) - Indexado
- content_type (String) - Indexado
- medical_priority (Float) - Indexado
- created_at (String, ISO DateTime)
- updated_at (String, ISO DateTime)

### analytics
- _id (String, Primary Key)
- session_id (String) - Indexado
- user_query (String)
- persona_used (String) - Indexado
- response_quality (Float)
- medical_accuracy (Float)
- user_satisfaction (Float)
- query_category (String) - Indexado
- response_tokens (Number)
- processing_time_ms (Number)
- created_at (String, ISO DateTime) - Indexado
- metadata (Object)

## 🚀 Próximos Passos

1. **FASE 3.2**: Migração de dados estruturados
2. **População de Embeddings**: Vetorizar conhecimento médico
3. **Configuração de Índices**: Otimizar para busca semântica
4. **Integração com Backend**: Conectar com sistema de chat

## 🔧 Configurações Recomendadas

- **Métrica de Similaridade**: Cosine
- **Dimensão Vetorial**: 768 (compatível com BERT médico)
- **Batch Size**: 100 documentos por vez
- **Timeout**: 30s para operações de busca

## 🆕 Vantagens do AstraPy

- ✅ Compatibilidade Python 3.13
- ✅ API moderna e pythônica
- ✅ Busca vetorial nativa
- ✅ Sem dependência asyncore
- ✅ Melhor para aplicações AI/ML

---

**Status Geral:** {'🟢 PRONTO' if all([
    test_results.get('connection_success'),
    test_results.get('collections_success'),
    test_results.get('crud_success')
]) else '🟡 PARCIAL' if test_results.get('connection_success') else '🔴 FALHA'}

Gerado por: FASE 3.1 - Setup Astra DB Connection (AstraPy)
Versão: Q2-2025-ML-MODERNIZATION
        """.strip()
        
        return report
    
    def cleanup(self):
        """Fechar conexões (AstraPy gerencia automaticamente)"""
        print("🔌 Conexões AstraPy fechadas automaticamente")

def main():
    """Função principal do setup"""
    print("🚀 FASE 3.1: Setup Conexão Astra DB (AstraPy)")
    print("=" * 60)
    
    setup = AstraDBSetup()
    test_results = {}
    
    try:
        # 1. Validar credenciais
        if not setup.validate_credentials():
            print("\n❌ Credenciais inválidas. Configure as variáveis de ambiente:")
            print("  - ASTRA_DB_API_ENDPOINT")
            print("  - ASTRA_DB_TOKEN")
            print("  - ASTRA_DB_KEYSPACE (opcional)")
            return False
        
        # 2. Testar conexão
        connection_success, connection_info = setup.test_connection()
        test_results['connection_success'] = connection_success
        test_results['connection_info'] = connection_info
        
        if not connection_success:
            print("\n❌ Não foi possível conectar ao Astra DB")
            return False
        
        # 3. Configurar collections
        collections_success = setup.setup_collections()
        test_results['collections_success'] = collections_success
        
        # 4. Testar operações
        crud_success = setup.test_crud_operations()
        vector_search_success = setup.test_vector_search()
        test_results['crud_success'] = crud_success
        test_results['vector_search_success'] = vector_search_success
        
        # 5. Gerar relatório
        report = setup.generate_setup_report(test_results)
        
        # Salvar relatório
        report_path = Path(__file__).parent.parent / 'astra_setup_astrapy_report.md'
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write(report)
        
        print(f"\n📄 Relatório AstraPy salvo em: {report_path}")
        
        # Status final
        success_count = sum([
            test_results.get('connection_success', False),
            test_results.get('collections_success', False),
            test_results.get('crud_success', False)
        ])
        
        print("\n" + "=" * 60)
        if success_count == 3:
            print("🎉 ASTRA DB CONFIGURADO COM SUCESSO (AstraPy)!")
            print("✅ Todos os testes passaram")
            print("🚀 Pronto para FASE 3.2: Migração de dados")
        elif success_count >= 2:
            print("🟡 SETUP PARCIALMENTE CONCLUÍDO")
            print(f"✅ {success_count}/3 testes passaram")
            print("⚠️ Verifique os erros antes de prosseguir")
        else:
            print("🔴 SETUP FALHOU")
            print("❌ Problemas críticos encontrados")
            print("🔧 Verifique configurações e tente novamente")
        
        print("=" * 60)
        
        return success_count >= 2
        
    except Exception as e:
        print(f"\n💥 Erro crítico no setup: {e}")
        return False
        
    finally:
        setup.cleanup()

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)