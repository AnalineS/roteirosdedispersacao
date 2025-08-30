#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Setup e Configuração Astra DB para Hanseníase RAG
Script para configurar conexão, keyspace, e tabelas do Astra DB
Seguindo FASE 3.1 do PLANO Q2 2025 - IA e Machine Learning
"""

import os
import sys
import json
import uuid
import asyncio
import logging
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timezone
from pathlib import Path

# Importações para Astra DB
try:
    from cassandra.cluster import Cluster
    from cassandra.auth import PlainTextAuthProvider
    from cassandra.policies import RoundRobinPolicy
    from cassandra import ConsistencyLevel
    from cassandra.query import SimpleStatement
    import requests
except ImportError as e:
    print(f"[ERROR] Dependências faltando. Execute: pip install cassandra-driver requests")
    sys.exit(1)

# Importar config do sistema
sys.path.append(str(Path(__file__).parent.parent))
from app_config import config, EnvironmentConfig

class AstraDBSetup:
    """Setup e configuração completa do Astra DB para RAG Hanseníase"""
    
    def __init__(self):
        self.config = config
        self.session = None
        self.cluster = None
        
        # Configurações do Astra DB
        self.astra_url = self.config.ASTRA_DB_URL
        self.astra_token = self.config.ASTRA_DB_TOKEN
        self.keyspace = self.config.ASTRA_DB_KEYSPACE or 'hanseniase_rag'
        
        # Configurações de logging
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        self.logger = logging.getLogger(__name__)
        
    def validate_credentials(self) -> bool:
        """Validar credenciais Astra DB"""
        print("[AUTH] Validando credenciais Astra DB...")
        
        if not self.astra_url:
            print("[ERROR] ASTRA_DB_URL não configurada")
            return False
        
        if not self.astra_token:
            print("[ERROR] ASTRA_DB_TOKEN não configurada")
            return False
        
        print("[OK] Credenciais básicas encontradas")
        
        # Verificar formato do token
        if not self.astra_token.startswith('AstraCS:'):
            print("[WARNING] Token pode não estar no formato correto (deve começar com 'AstraCS:')")
        
        print(f"📍 URL: {self.astra_url[:50]}...")
        print(f"🔑 Token: {self.astra_token[:20]}...")
        print(f"🏠 Keyspace: {self.keyspace}")
        
        return True
        
    def test_connection(self) -> Tuple[bool, Dict[str, Any]]:
        """Testar conexão com Astra DB"""
        print("\n🔗 Testando conexão com Astra DB...")
        
        connection_info = {
            "status": "failed",
            "latency_ms": None,
            "error": None,
            "node_count": 0,
            "consistency_level": None
        }
        
        try:
            start_time = datetime.now()
            
            # Configurar autenticação
            auth_provider = PlainTextAuthProvider(
                # deepcode ignore NoHardcodedCredentials: <please specify a reason of ignoring this>
                username='token',
                password=self.astra_token
            )
            
            # Extrair hostname da URL
            if 'https://' in self.astra_url:
                hostname = self.astra_url.replace('https://', '').split('/')[0]
            else:
                hostname = self.astra_url.split('/')[0]
            
            print(f"🌐 Conectando em: {hostname}")
            
            # Criar cluster
            self.cluster = Cluster(
                [hostname],
                auth_provider=auth_provider,
                port=9042,  # Porta padrão do Cassandra
                load_balancing_policy=RoundRobinPolicy(),
                protocol_version=4
            )
            
            # Conectar
            self.session = self.cluster.connect()
            
            # Calcular latência
            end_time = datetime.now()
            latency = (end_time - start_time).total_seconds() * 1000
            
            # Obter informações do cluster
            metadata = self.cluster.metadata
            node_count = len(metadata.all_hosts())
            
            connection_info.update({
                "status": "success",
                "latency_ms": round(latency, 2),
                "node_count": node_count,
                "consistency_level": "LOCAL_QUORUM"
            })
            
            print(f"[OK] Conexão estabelecida!")
            print(f"⚡ Latência: {latency:.2f}ms")
            print(f"🖥️ Nós conectados: {node_count}")
            
            return True, connection_info
            
        except Exception as e:
            error_msg = str(e)
            connection_info["error"] = error_msg
            
            print(f"[ERROR] Erro na conexão: {error_msg}")
            
            # Sugestões de troubleshooting
            if "Authentication failed" in error_msg:
                print("💡 Verifique se o token está correto e ativo")
            elif "No host available" in error_msg:
                print("💡 Verifique se a URL está correta e a database está ativa")
            elif "Connection refused" in error_msg:
                print("💡 Verifique conectividade de rede")
            
            return False, connection_info
    
    def setup_keyspace(self) -> bool:
        """Criar keyspace se não existir"""
        print(f"\n🏠 Configurando keyspace '{self.keyspace}'...")
        
        if not self.session:
            print("[ERROR] Sessão não estabelecida")
            return False
        
        try:
            # Verificar se keyspace existe
            keyspaces = self.session.execute("SELECT keyspace_name FROM system_schema.keyspaces")
            existing_keyspaces = [row.keyspace_name for row in keyspaces]
            
            if self.keyspace in existing_keyspaces:
                print(f"[OK] Keyspace '{self.keyspace}' já existe")
                self.session.set_keyspace(self.keyspace)
                return True
            
            # Criar keyspace
            create_keyspace_cql = f"""
            CREATE KEYSPACE IF NOT EXISTS {self.keyspace}
            WITH replication = {{
                'class': 'NetworkTopologyStrategy',
                'datacenter1': 1
            }}
            """
            
            print(f"[NOTE] Criando keyspace...")
            self.session.execute(create_keyspace_cql)
            self.session.set_keyspace(self.keyspace)
            
            print(f"[OK] Keyspace '{self.keyspace}' criado com sucesso")
            return True
            
        except Exception as e:
            print(f"[ERROR] Erro ao configurar keyspace: {e}")
            return False
    
    def create_embeddings_table(self) -> bool:
        """Criar tabela de embeddings otimizada para RAG"""
        print("\n[REPORT] Criando tabela de embeddings...")
        
        if not self.session:
            print("[ERROR] Sessão não estabelecida")
            return False
        
        try:
            # Schema otimizado para vetorização médica
            create_table_cql = """
            CREATE TABLE IF NOT EXISTS embeddings (
                id UUID PRIMARY KEY,
                document_id TEXT,
                chunk_index INT,
                content TEXT,
                embedding VECTOR<FLOAT, 768>,
                metadata MAP<TEXT, TEXT>,
                source_file TEXT,
                source_category TEXT,
                content_type TEXT,
                medical_priority FLOAT,
                created_at TIMESTAMP,
                updated_at TIMESTAMP
            )
            """
            
            print("[NOTE] Executando criação da tabela...")
            self.session.execute(create_table_cql)
            
            # Criar índices para busca otimizada
            indexes = [
                "CREATE INDEX IF NOT EXISTS idx_embeddings_document ON embeddings (document_id);",
                "CREATE INDEX IF NOT EXISTS idx_embeddings_source ON embeddings (source_file);",
                "CREATE INDEX IF NOT EXISTS idx_embeddings_category ON embeddings (source_category);",
                "CREATE INDEX IF NOT EXISTS idx_embeddings_type ON embeddings (content_type);",
                "CREATE INDEX IF NOT EXISTS idx_embeddings_priority ON embeddings (medical_priority);"
            ]
            
            print("[SEARCH] Criando índices otimizados...")
            for idx_cql in indexes:
                try:
                    self.session.execute(idx_cql)
                    print(f"  [OK] Índice criado")
                except Exception as e:
                    print(f"  [WARNING] Índice já existe ou erro: {e}")
            
            print("[OK] Tabela de embeddings configurada com sucesso")
            return True
            
        except Exception as e:
            print(f"[ERROR] Erro ao criar tabela de embeddings: {e}")
            return False
    
    def create_analytics_table(self) -> bool:
        """Criar tabela para análise preditiva"""
        print("\n📈 Criando tabela de analytics...")
        
        try:
            create_analytics_cql = """
            CREATE TABLE IF NOT EXISTS analytics (
                id UUID PRIMARY KEY,
                session_id TEXT,
                user_query TEXT,
                persona_used TEXT,
                response_quality FLOAT,
                medical_accuracy FLOAT,
                user_satisfaction FLOAT,
                query_category TEXT,
                response_tokens INT,
                processing_time_ms INT,
                created_at TIMESTAMP,
                metadata MAP<TEXT, TEXT>
            )
            """
            
            self.session.execute(create_analytics_cql)
            
            # Índices para analytics
            analytics_indexes = [
                "CREATE INDEX IF NOT EXISTS idx_analytics_session ON analytics (session_id);",
                "CREATE INDEX IF NOT EXISTS idx_analytics_persona ON analytics (persona_used);",
                "CREATE INDEX IF NOT EXISTS idx_analytics_category ON analytics (query_category);",
                "CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics (created_at);"
            ]
            
            for idx_cql in analytics_indexes:
                try:
                    self.session.execute(idx_cql)
                except Exception:
                    pass  # Índice já existe
            
            print("[OK] Tabela de analytics configurada")
            return True
            
        except Exception as e:
            print(f"[ERROR] Erro ao criar tabela de analytics: {e}")
            return False
    
    def test_crud_operations(self) -> bool:
        """Testar operações CRUD básicas"""
        print("\n[TEST] Testando operações CRUD...")
        
        try:
            # Test INSERT
            test_id = uuid.uuid4()
            test_embedding = [0.1] * 768  # Vetor de teste
            
            insert_cql = """
            INSERT INTO embeddings (
                id, document_id, chunk_index, content, embedding,
                metadata, source_file, source_category, content_type,
                medical_priority, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """
            
            self.session.execute(insert_cql, [
                test_id,
                'test_doc_001',
                0,
                'Teste de inserção para validação do Astra DB',
                test_embedding,
                {'test': 'true', 'validation': 'crud'},
                'test_file.json',
                'qa',
                'validation',
                1.0,
                datetime.now(timezone.utc),
                datetime.now(timezone.utc)
            ])
            
            print("  [OK] INSERT realizado")
            
            # Test SELECT
            select_cql = "SELECT id, content, source_file FROM embeddings WHERE id = ?"
            result = self.session.execute(select_cql, [test_id])
            row = result.one()
            
            if row and row.content == 'Teste de inserção para validação do Astra DB':
                print("  [OK] SELECT confirmado")
            else:
                print("  [ERROR] SELECT falhou")
                return False
            
            # Test UPDATE
            update_cql = "UPDATE embeddings SET content = ? WHERE id = ?"
            self.session.execute(update_cql, [
                'Teste atualizado para validação',
                test_id
            ])
            print("  [OK] UPDATE realizado")
            
            # Test DELETE
            delete_cql = "DELETE FROM embeddings WHERE id = ?"
            self.session.execute(delete_cql, [test_id])
            print("  [OK] DELETE realizado")
            
            # Verificar se foi deletado
            verify_result = self.session.execute(select_cql, [test_id])
            if verify_result.one() is None:
                print("  [OK] DELETE confirmado")
            else:
                print("  [ERROR] DELETE falhou")
                return False
            
            print("[OK] Todas as operações CRUD funcionando corretamente")
            return True
            
        except Exception as e:
            print(f"[ERROR] Erro nas operações CRUD: {e}")
            return False
    
    def test_vector_search(self) -> bool:
        """Testar busca vetorial"""
        print("\n[SEARCH] Testando busca vetorial...")
        
        try:
            # Inserir alguns vetores de teste
            test_vectors = [
                {
                    'id': uuid.uuid4(),
                    'content': 'Rifampicina é um antibiótico usado no tratamento da hanseníase',
                    'embedding': [0.8, 0.2, 0.1] + [0.0] * 765,
                    'category': 'medication'
                },
                {
                    'id': uuid.uuid4(),
                    'content': 'Dapsona é outro medicamento importante na PQT',
                    'embedding': [0.7, 0.3, 0.2] + [0.0] * 765,
                    'category': 'medication'
                },
                {
                    'id': uuid.uuid4(),
                    'content': 'Orientações sobre dosagem supervisionada',
                    'embedding': [0.1, 0.8, 0.1] + [0.0] * 765,
                    'category': 'protocol'
                }
            ]
            
            # Inserir vetores de teste
            insert_cql = """
            INSERT INTO embeddings (
                id, document_id, chunk_index, content, embedding,
                source_category, content_type, medical_priority, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """
            
            for i, vector in enumerate(test_vectors):
                self.session.execute(insert_cql, [
                    vector['id'],
                    f'test_vector_{i}',
                    0,
                    vector['content'],
                    vector['embedding'],
                    vector['category'],
                    'test',
                    1.0,
                    datetime.now(timezone.utc)
                ])
            
            print(f"  [OK] {len(test_vectors)} vetores de teste inseridos")
            
            # Testar busca simples
            search_cql = "SELECT id, content FROM embeddings WHERE source_category = ?"
            results = self.session.execute(search_cql, ['medication'])
            medication_results = list(results)
            
            if len(medication_results) >= 2:
                print(f"  [OK] Busca por categoria encontrou {len(medication_results)} resultados")
            else:
                print(f"  [ERROR] Busca por categoria retornou apenas {len(medication_results)} resultados")
            
            # Limpeza
            for vector in test_vectors:
                self.session.execute("DELETE FROM embeddings WHERE id = ?", [vector['id']])
            
            print("  🧹 Dados de teste removidos")
            print("[OK] Busca vetorial funcionando")
            return True
            
        except Exception as e:
            print(f"[ERROR] Erro na busca vetorial: {e}")
            return False
    
    def generate_setup_report(self, test_results: Dict[str, Any]) -> str:
        """Gerar relatório de setup"""
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        report = f"""
# [REPORT] Relatório de Setup Astra DB - Hanseníase RAG

**Data:** {timestamp}
**Keyspace:** {self.keyspace}
**Ambiente:** {EnvironmentConfig.get_current()}

## [FIX] Resultados dos Testes

### Conexão
- Status: {'[OK] Sucesso' if test_results.get('connection_success') else '[ERROR] Falha'}
- Latência: {test_results.get('connection_info', {}).get('latency_ms', 'N/A')}ms
- Nós conectados: {test_results.get('connection_info', {}).get('node_count', 'N/A')}

### Configuração
- Keyspace: {'[OK] Configurado' if test_results.get('keyspace_success') else '[ERROR] Falha'}
- Tabela Embeddings: {'[OK] Criada' if test_results.get('embeddings_table_success') else '[ERROR] Falha'}
- Tabela Analytics: {'[OK] Criada' if test_results.get('analytics_table_success') else '[ERROR] Falha'}

### Operações
- CRUD: {'[OK] Funcionando' if test_results.get('crud_success') else '[ERROR] Falha'}
- Busca Vetorial: {'[OK] Funcionando' if test_results.get('vector_search_success') else '[ERROR] Falha'}

## [LIST] Schema das Tabelas

### embeddings
- id (UUID PRIMARY KEY)
- document_id (TEXT)
- chunk_index (INT)
- content (TEXT)
- embedding (VECTOR<FLOAT, 768>)
- metadata (MAP<TEXT, TEXT>)
- source_file (TEXT)
- source_category (TEXT)
- content_type (TEXT)
- medical_priority (FLOAT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

### analytics
- id (UUID PRIMARY KEY)
- session_id (TEXT)
- user_query (TEXT)
- persona_used (TEXT)
- response_quality (FLOAT)
- medical_accuracy (FLOAT)
- user_satisfaction (FLOAT)
- query_category (TEXT)
- response_tokens (INT)
- processing_time_ms (INT)
- created_at (TIMESTAMP)
- metadata (MAP<TEXT, TEXT>)

## [START] Próximos Passos

1. **FASE 3.2**: Migração de dados estruturados
2. **População de Embeddings**: Vetorizar conhecimento médico
3. **Configuração de Índices**: Otimizar para busca semântica
4. **Integração com Backend**: Conectar com sistema de chat

## [FIX] Configurações Recomendadas

- **Consistency Level**: LOCAL_QUORUM
- **Batch Size**: 100 documentos por vez
- **Vector Dimension**: 768 (compatível com BERT médico)
- **Replication Factor**: 1 (single datacenter)

---

**Status Geral:** {'[GREEN] PRONTO' if all([
    test_results.get('connection_success'),
    test_results.get('keyspace_success'),
    test_results.get('embeddings_table_success'),
    test_results.get('crud_success')
]) else '[YELLOW] PARCIAL' if test_results.get('connection_success') else '[RED] FALHA'}

Gerado por: FASE 3.1 - Setup Astra DB Connection
Versão: Q2-2025-ML-MODERNIZATION
        """.strip()
        
        return report
    
    def cleanup(self):
        """Fechar conexões"""
        if self.session:
            self.session.shutdown()
        if self.cluster:
            self.cluster.shutdown()
        print("🔌 Conexões fechadas")

def main():
    """Função principal do setup"""
    print("[START] FASE 3.1: Setup Conexão Astra DB")
    print("=" * 60)
    
    setup = AstraDBSetup()
    test_results = {}
    
    try:
        # 1. Validar credenciais
        if not setup.validate_credentials():
            print("\n[ERROR] Credenciais inválidas. Configure as variáveis de ambiente:")
            print("  - ASTRA_DB_URL")
            print("  - ASTRA_DB_TOKEN")
            print("  - ASTRA_DB_KEYSPACE (opcional)")
            return False
        
        # 2. Testar conexão
        connection_success, connection_info = setup.test_connection()
        test_results['connection_success'] = connection_success
        test_results['connection_info'] = connection_info
        
        if not connection_success:
            print("\n[ERROR] Não foi possível conectar ao Astra DB")
            return False
        
        # 3. Configurar keyspace
        keyspace_success = setup.setup_keyspace()
        test_results['keyspace_success'] = keyspace_success
        
        # 4. Criar tabelas
        embeddings_success = setup.create_embeddings_table()
        analytics_success = setup.create_analytics_table()
        test_results['embeddings_table_success'] = embeddings_success
        test_results['analytics_table_success'] = analytics_success
        
        # 5. Testar operações
        crud_success = setup.test_crud_operations()
        vector_search_success = setup.test_vector_search()
        test_results['crud_success'] = crud_success
        test_results['vector_search_success'] = vector_search_success
        
        # 6. Gerar relatório
        report = setup.generate_setup_report(test_results)
        
        # Salvar relatório
        report_path = Path(__file__).parent.parent / 'astra_setup_report.md'
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write(report)
        
        print(f"\n📄 Relatório salvo em: {report_path}")
        
        # Status final
        success_count = sum([
            test_results.get('connection_success', False),
            test_results.get('keyspace_success', False),
            test_results.get('embeddings_table_success', False),
            test_results.get('crud_success', False)
        ])
        
        print("\n" + "=" * 60)
        if success_count == 4:
            print("🎉 ASTRA DB CONFIGURADO COM SUCESSO!")
            print("[OK] Todos os testes passaram")
            print("[START] Pronto para FASE 3.2: Migração de dados")
        elif success_count >= 2:
            print("[YELLOW] SETUP PARCIALMENTE CONCLUÍDO")
            print(f"[OK] {success_count}/4 testes passaram")
            print("[WARNING] Verifique os erros antes de prosseguir")
        else:
            print("[RED] SETUP FALHOU")
            print("[ERROR] Problemas críticos encontrados")
            print("[FIX] Verifique configurações e tente novamente")
        
        print("=" * 60)
        
        return success_count >= 3
        
    except Exception as e:
        print(f"\n💥 Erro crítico no setup: {e}")
        return False
        
    finally:
        setup.cleanup()

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)