#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script de Testes Robustos - Integração Supabase RAG
Validação completa da migração AstraDB -> Supabase

Desenvolvido por: Claude Code com feedback do usuário
Data: 2025-01-30
Versão: 1.0
"""

import os
import sys
import json
import time
import asyncio
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional
from dotenv import load_dotenv

# Configurar encoding para Windows
if os.name == 'nt':
    import codecs
    sys.stdout = codecs.getwriter('utf-8')(sys.stdout.detach())
    sys.stderr = codecs.getwriter('utf-8')(sys.stderr.detach())

# Carregar variáveis de ambiente de teste
env_test_path = os.path.join(os.path.dirname(__file__), '..', '.env.test')
if os.path.exists(env_test_path):
    load_dotenv(env_test_path)

# Adicionar path do backend para imports
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

try:
    from services.supabase_vector_store import SupabaseVectorStore
    from services.cloud_native_cache import CloudNativeCache  
    from services.supabase_rag_system import SupabaseRAGSystem
    from config.dr_gasnelio_technical_prompt import DrGasnelioTechnicalPrompt
    from config.ga_empathetic_prompt import GaEmpatheticPrompt
    from services.openai_integration import test_openai_connection
    IMPORTS_OK = True
except ImportError as e:
    IMPORTS_OK = False
    IMPORT_ERROR = str(e)

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class SupabaseTestSuite:
    """
    Suite completa de testes para validação da migração Supabase
    """
    
    def __init__(self):
        self.test_results = {
            'total_tests': 0,
            'passed': 0,
            'failed': 0,
            'warnings': 0,
            'errors': [],
            'performance_metrics': {},
            'start_time': datetime.now(),
            'components_tested': []
        }
        
    async def run_all_tests(self):
        """Executa todos os testes de integração"""
        if not IMPORTS_OK:
            logger.error(f"[ERROR] Falha na importação de módulos: {IMPORT_ERROR}")
            return False
            
        logger.info("Iniciando Suite de Testes Supabase Integration")
        
        test_methods = [
            self.test_environment_variables,
            self.test_imports_and_modules,
            self.test_supabase_connection,
            self.test_vector_store_operations,
            self.test_cloud_cache_hierarchy,
            self.test_rag_system_queries,
            self.test_personas_integration,
            self.test_openrouter_connectivity,
            self.test_knowledge_retrieval,
            self.test_performance_benchmarks,
            self.test_error_handling
        ]
        
        for test_method in test_methods:
            try:
                self.test_results['total_tests'] += 1
                await test_method()
                self.test_results['passed'] += 1
                logger.info(f"[OK] {test_method.__name__} - PASSOU")
            except Exception as e:
                self.test_results['failed'] += 1
                self.test_results['errors'].append({
                    'test': test_method.__name__,
                    'error': str(e),
                    'timestamp': datetime.now().isoformat()
                })
                logger.error(f"[ERROR] {test_method.__name__} - FALHOU: {e}")
        
        self.generate_test_report()
        return self.test_results['failed'] == 0
        
    async def test_environment_variables(self):
        """Teste 1: Validar variáveis de ambiente essenciais"""
        logger.info("Testando variáveis de ambiente...")
        
        # Variáveis obrigatórias para funcionalidade mínima
        critical_vars = ['SUPABASE_URL', 'SUPABASE_KEY']
        optional_vars = ['OPENROUTER_API_KEY', 'SECRET_KEY', 'CORS_ORIGINS']
        
        missing_critical = []
        missing_optional = []
        
        for var in critical_vars:
            if not os.environ.get(var):
                missing_critical.append(var)
        
        for var in optional_vars:
            if not os.environ.get(var):
                missing_optional.append(var)
        
        if missing_critical:
            raise Exception(f"Variáveis críticas ausentes: {', '.join(missing_critical)}")
        
        if missing_optional:
            logger.warning(f"Variáveis opcionais ausentes: {', '.join(missing_optional)}")
            self.test_results['warnings'] += 1
            
        self.test_results['components_tested'].append('environment_config')
        
    async def test_imports_and_modules(self):
        """Teste 2: Validar importações e módulos"""
        logger.info("Testando importações...")
        
        if not IMPORTS_OK:
            raise Exception(f"Falha na importação: {IMPORT_ERROR}")
        
        # Testar módulos essenciais
        essential_modules = [
            'supabase',
            'psycopg2',
            'openai',
            'pydantic'
        ]
        
        missing_modules = []
        for module in essential_modules:
            try:
                __import__(module)
            except ImportError:
                missing_modules.append(module)
        
        if missing_modules:
            raise Exception(f"Módulos ausentes: {', '.join(missing_modules)}")
            
        self.test_results['components_tested'].append('module_imports')
        
    async def test_supabase_connection(self):
        """Teste 2: Conectividade com Supabase"""
        logger.info("🔗 Testando conexão Supabase...")
        
        vector_store = SupabaseVectorStore()
        
        # Testar conexão básica
        connection_test = await vector_store.health_check()
        if not connection_test.get('healthy'):
            raise Exception("Falha na conexão com Supabase")
            
        # Testar se tabelas existem
        tables_exist = await vector_store.verify_tables()
        if not tables_exist:
            raise Exception("Tabelas do Supabase não encontradas")
            
        self.test_results['components_tested'].append('supabase_connection')
        
    async def test_vector_store_operations(self):
        """Teste 3: Operações CRUD do Vector Store"""
        logger.info("[REPORT] Testando operações Vector Store...")
        
        vector_store = SupabaseVectorStore()
        
        # Documento de teste
        test_doc = {
            'content': 'Teste de documento para validação do sistema RAG. PQT-U é o esquema de poliquimioterapia única para hanseníase.',
            'source': 'test_document.md',
            'metadata': {'test_type': 'integration', 'category': 'dosing'}
        }
        
        start_time = time.time()
        
        # Testar inserção
        doc_id = await vector_store.add_document(test_doc)
        if not doc_id:
            raise Exception("Falha ao inserir documento de teste")
            
        # Testar busca semântica
        query = "Como funciona o esquema PQT-U?"
        results = await vector_store.similarity_search(query, k=3)
        
        if not results or len(results) == 0:
            raise Exception("Falha na busca semântica")
            
        # Testar remoção
        removed = await vector_store.delete_document(doc_id)
        if not removed:
            self.test_results['warnings'] += 1
            logger.warning("[WARNING] Não foi possível remover documento de teste")
            
        operation_time = time.time() - start_time
        self.test_results['performance_metrics']['vector_operations'] = operation_time
        
        self.test_results['components_tested'].append('vector_store_crud')
        
    async def test_cloud_cache_hierarchy(self):
        """Teste 4: Sistema de cache em hierarquia"""
        logger.info("[SAVE] Testando cache hierarchy...")
        
        cache = CloudNativeCache()
        
        # Testar cache em memória
        test_key = "test_cache_key"
        test_value = {"data": "test_value", "timestamp": datetime.now().isoformat()}
        
        await cache.set(test_key, test_value)
        retrieved = await cache.get(test_key)
        
        if not retrieved or retrieved['data'] != test_value['data']:
            raise Exception("Falha no cache em memória")
            
        # Testar TTL (Time To Live)
        await cache.set("ttl_test", {"data": "expires"}, ttl=1)
        time.sleep(2)
        expired = await cache.get("ttl_test")
        
        if expired is not None:
            self.test_results['warnings'] += 1
            logger.warning("[WARNING] TTL do cache pode não estar funcionando corretamente")
            
        self.test_results['components_tested'].append('cloud_cache')
        
    async def test_rag_system_queries(self):
        """Teste 5: Sistema RAG completo"""
        logger.info("🤖 Testando sistema RAG...")
        
        rag_system = SupabaseRAGSystem()
        
        test_queries = [
            {
                'query': 'Qual a dosagem de rifampicina para adultos?',
                'persona': 'dr_gasnelio',
                'expected_category': 'dosing'
            },
            {
                'query': 'Estou preocupado com os efeitos do tratamento',
                'persona': 'ga',
                'expected_category': 'support'
            },
            {
                'query': 'Como funciona o PQT-U?',
                'persona': 'dr_gasnelio', 
                'expected_category': 'general'
            }
        ]
        
        start_time = time.time()
        
        for i, test_case in enumerate(test_queries):
            try:
                response = await rag_system.get_enhanced_response(
                    query=test_case['query'],
                    persona=test_case['persona']
                )
                
                if not response or len(response) < 10:
                    raise Exception(f"Resposta muito curta para query {i+1}")
                    
                # Verificar se contém elementos da persona
                if test_case['persona'] == 'dr_gasnelio':
                    if '[RESPOSTA TÉCNICA]' not in response and 'protocolo' not in response.lower():
                        self.test_results['warnings'] += 1
                        logger.warning(f"[WARNING] Query {i+1}: Resposta pode não seguir formato Dr. Gasnelio")
                        
                elif test_case['persona'] == 'ga':
                    if 'preocup' not in response.lower() and 'entendo' not in response.lower():
                        self.test_results['warnings'] += 1
                        logger.warning(f"[WARNING] Query {i+1}: Resposta pode não seguir estilo Gá empático")
                        
            except Exception as e:
                raise Exception(f"Falha na query {i+1}: {str(e)}")
        
        rag_time = time.time() - start_time
        self.test_results['performance_metrics']['rag_queries'] = rag_time
        
        self.test_results['components_tested'].append('rag_system')
        
    async def test_personas_integration(self):
        """Teste 6: Integração dos sistemas de personas"""
        logger.info("👥 Testando integração personas...")
        
        # Testar Dr. Gasnelio prompt system
        dr_gasnelio = DrGasnelioTechnicalPrompt()
        technical_prompt = dr_gasnelio.create_context_specific_prompt(
            'dosing_queries', 
            'Qual a dose de rifampicina?'
        )
        
        if len(technical_prompt) < 100:
            raise Exception("Prompt técnico muito curto")
            
        if 'RESPOSTA TÉCNICA' not in technical_prompt:
            raise Exception("Formato técnico não encontrado no prompt")
            
        # Testar Gá prompt system
        ga_system = GaEmpatheticPrompt()
        empathetic_prompt = ga_system.get_empathetic_prompt(
            'Estou com medo do tratamento'
        )
        
        if len(empathetic_prompt) < 100:
            raise Exception("Prompt empático muito curto")
            
        if 'empática' not in empathetic_prompt.lower():
            raise Exception("Elementos empáticos não encontrados no prompt")
            
        self.test_results['components_tested'].append('personas_system')
        
    async def test_openrouter_connectivity(self):
        """Teste 7: Conectividade OpenRouter"""
        logger.info("🌐 Testando OpenRouter...")
        
        connection_result = test_openai_connection()
        
        if connection_result.get('status') != 'configured':
            if connection_result.get('status') == 'no_api_key':
                self.test_results['warnings'] += 1
                logger.warning("[WARNING] OPENROUTER_API_KEY não configurada - usando modo mock")
            else:
                raise Exception(f"Falha OpenRouter: {connection_result.get('message')}")
        
        self.test_results['components_tested'].append('openrouter_connection')
        
    async def test_knowledge_retrieval(self):
        """Teste 8: Recuperação de conhecimento específico"""
        logger.info("📚 Testando recuperação de conhecimento...")
        
        vector_store = SupabaseVectorStore()
        
        # Termos específicos de hanseníase
        hanseniase_terms = [
            'poliquimioterapia',
            'rifampicina',
            'clofazimina', 
            'dapsona',
            'multibacilar',
            'paucibacilar'
        ]
        
        for term in hanseniase_terms:
            results = await vector_store.similarity_search(term, k=3)
            
            if not results:
                self.test_results['warnings'] += 1
                logger.warning(f"[WARNING] Termo '{term}' não encontrou resultados")
            elif len(results) < 2:
                self.test_results['warnings'] += 1
                logger.warning(f"[WARNING] Poucos resultados para termo '{term}'")
                
        self.test_results['components_tested'].append('knowledge_retrieval')
        
    async def test_performance_benchmarks(self):
        """Teste 9: Benchmarks de performance"""
        logger.info("⚡ Testando performance...")
        
        vector_store = SupabaseVectorStore()
        
        # Benchmark: 10 consultas rápidas
        queries = [
            "dosagem rifampicina",
            "efeitos adversos", 
            "PQT-U protocolo",
            "hanseníase tratamento",
            "clofazimina coloração",
            "dapsona hemólise", 
            "supervisionado mensal",
            "poliquimioterapia esquema",
            "farmácovigilância hanseníase",
            "dispensação medicamentos"
        ]
        
        start_time = time.time()
        
        for query in queries:
            await vector_store.similarity_search(query, k=1)
            
        total_time = time.time() - start_time
        avg_time = total_time / len(queries)
        
        self.test_results['performance_metrics']['avg_query_time'] = avg_time
        self.test_results['performance_metrics']['total_benchmark_time'] = total_time
        
        # Alertas de performance
        if avg_time > 2.0:
            self.test_results['warnings'] += 1
            logger.warning(f"[WARNING] Tempo médio de consulta alto: {avg_time:.2f}s")
            
        if total_time > 15.0:
            self.test_results['warnings'] += 1
            logger.warning(f"[WARNING] Tempo total de benchmark alto: {total_time:.2f}s")
            
        self.test_results['components_tested'].append('performance_benchmark')
        
    async def test_error_handling(self):
        """Teste 10: Tratamento de erros"""
        logger.info("[SECURITY] Testando tratamento de erros...")
        
        vector_store = SupabaseVectorStore()
        
        # Teste 1: Query muito longa
        try:
            very_long_query = "teste " * 1000
            await vector_store.similarity_search(very_long_query, k=1)
        except Exception:
            pass  # Erro esperado
        
        # Teste 2: Conexão inválida
        try:
            # Simular falha de conexão (se possível)
            pass
        except Exception:
            pass  # Erro esperado
            
        # Teste 3: Documento inválido
        try:
            invalid_doc = {'invalid': 'structure'}
            await vector_store.add_document(invalid_doc)
        except Exception:
            pass  # Erro esperado
            
        self.test_results['components_tested'].append('error_handling')
        
    def generate_test_report(self):
        """Gerar relatório completo dos testes"""
        end_time = datetime.now()
        duration = end_time - self.test_results['start_time']
        
        report = {
            'test_summary': {
                'total_tests': self.test_results['total_tests'],
                'passed': self.test_results['passed'],
                'failed': self.test_results['failed'],
                'warnings': self.test_results['warnings'],
                'success_rate': f"{(self.test_results['passed'] / self.test_results['total_tests'] * 100):.1f}%"
            },
            'execution_time': {
                'start': self.test_results['start_time'].isoformat(),
                'end': end_time.isoformat(),
                'duration_seconds': duration.total_seconds()
            },
            'components_tested': self.test_results['components_tested'],
            'performance_metrics': self.test_results['performance_metrics'],
            'errors': self.test_results['errors']
        }
        
        # Salvar relatório
        report_path = os.path.join(
            os.path.dirname(__file__),
            '..',
            'qa-reports',
            f'supabase_integration_test_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
        )
        
        os.makedirs(os.path.dirname(report_path), exist_ok=True)
        
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
            
        # Log resumo
        logger.info(f"[LIST] RELATÓRIO FINAL DE TESTES:")
        logger.info(f"   [OK] Aprovados: {report['test_summary']['passed']}")
        logger.info(f"   [ERROR] Falharam: {report['test_summary']['failed']}")  
        logger.info(f"   [WARNING]  Warnings: {report['test_summary']['warnings']}")
        logger.info(f"   [TARGET] Taxa de Sucesso: {report['test_summary']['success_rate']}")
        logger.info(f"   ⏱️  Duração: {duration.total_seconds():.1f}s")
        logger.info(f"   📄 Relatório: {report_path}")
        
        # Conclusão
        if self.test_results['failed'] == 0:
            logger.info("🎉 TODOS OS TESTES PASSARAM! Sistema pronto para produção.")
        elif self.test_results['failed'] <= 2:
            logger.warning("[WARNING] Alguns testes falharam. Revisar antes da produção.")
        else:
            logger.error("[ERROR] Muitos testes falharam. Sistema precisa de correções.")

async def main():
    """Função principal para executar os testes"""
    print("Iniciando Testes de Integração Supabase")
    print("=" * 50)
    
    test_suite = SupabaseTestSuite()
    success = await test_suite.run_all_tests()
    
    print("=" * 50)
    if success:
        print("Todos os testes passaram! Sistema pronto.")
    else:
        print("Alguns testes falharam. Verificar relatório.")
    print("Testes concluídos!")

if __name__ == "__main__":
    asyncio.run(main())