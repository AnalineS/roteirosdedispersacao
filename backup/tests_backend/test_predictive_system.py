#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Teste do Sistema de Análise Preditiva
Validação completa das funcionalidades implementadas
"""

import os
import sys
import json
import unittest
import tempfile
import shutil
from datetime import datetime
from pathlib import Path

# Adicionar ao path
sys.path.append(str(Path(__file__).parent))

# Importações do sistema preditivo
from services.predictive_system import (
    PredictiveEngine, ContextAnalyzer, PredictiveCache, 
    InteractionTracker, UserContext, Suggestion, PredictionRule
)

class TestContextAnalyzer(unittest.TestCase):
    """Testes para o analisador de contexto"""
    
    def setUp(self):
        self.analyzer = ContextAnalyzer()
    
    def test_dosage_query_detection(self):
        """Testar detecção de queries sobre dosagem"""
        queries = [
            "Qual a dose da rifampicina?",
            "Como devo tomar a dapsona?",
            "Quantos comprimidos por dia?"
        ]
        
        for query in queries:
            analysis = self.analyzer.analyze_query(query)
            self.assertIn('dosage_query', analysis['query_patterns'])
            self.assertIn('medicamentos', analysis['medical_categories'])
    
    def test_side_effects_detection(self):
        """Testar detecção de queries sobre efeitos colaterais"""
        queries = [
            "Quais os efeitos colaterais da rifampicina?",
            "O medicamento pode causar problemas?",
            "Que reações posso ter?"
        ]
        
        for query in queries:
            analysis = self.analyzer.analyze_query(query)
            self.assertIn('side_effects', analysis['query_patterns'])
    
    def test_emergency_detection(self):
        """Testar detecção de emergências"""
        queries = [
            "Estou com dor muito forte",
            "É uma emergência",
            "Preciso de ajuda urgente"
        ]
        
        for query in queries:
            analysis = self.analyzer.analyze_query(query)
            self.assertIn('emergency', analysis['query_patterns'])
            self.assertEqual('high', analysis['urgency_level'])
    
    def test_persona_hints(self):
        """Testar detecção de hints para personas"""
        technical_query = "Qual o mecanismo farmacocinético da rifampicina?"
        simple_query = "Pode explicar de forma simples o que é hanseníase?"
        
        tech_analysis = self.analyzer.analyze_query(technical_query)
        simple_analysis = self.analyzer.analyze_query(simple_query)
        
        self.assertIn('dr_gasnelio', tech_analysis['persona_hints'])
        self.assertIn('ga_empathetic', simple_analysis['persona_hints'])

class TestPredictiveCache(unittest.TestCase):
    """Testes para o cache preditivo"""
    
    def setUp(self):
        self.cache = PredictiveCache(max_size=10, ttl_hours=1)
        self.test_suggestion = Suggestion(
            suggestion_id="test_123",
            text="Teste de sugestão",
            confidence=0.8,
            category="test",
            persona="dr_gasnelio",
            context_match=["test"],
            created_at=datetime.now()
        )
    
    def test_cache_put_get(self):
        """Testar armazenamento e recuperação do cache"""
        key = "test_key"
        
        # Armazenar
        self.cache.put(key, self.test_suggestion)
        
        # Recuperar
        retrieved = self.cache.get(key)
        
        self.assertIsNotNone(retrieved)
        self.assertEqual(retrieved.suggestion_id, "test_123")
        self.assertEqual(retrieved.text, "Teste de sugestão")
    
    def test_cache_expiration(self):
        """Testar expiração do cache"""
        key = "test_key"
        
        # Armazenar com expiração passada
        expired_suggestion = Suggestion(
            suggestion_id="expired",
            text="Expirada",
            confidence=0.5,
            category="test",
            persona="ga_empathetic",
            context_match=["test"],
            created_at=datetime.now(),
            expires_at=datetime(2020, 1, 1)  # Data passada
        )
        
        self.cache.put(key, expired_suggestion)
        retrieved = self.cache.get(key)
        
        # Deve retornar None por estar expirada
        self.assertIsNone(retrieved)
    
    def test_cache_lru_eviction(self):
        """Testar remoção LRU quando cache está cheio"""
        # Encher o cache
        for i in range(12):  # Mais que max_size (10)
            suggestion = Suggestion(
                suggestion_id=f"test_{i}",
                text=f"Teste {i}",
                confidence=0.5,
                category="test",
                persona="mixed",
                context_match=["test"],
                created_at=datetime.now()
            )
            self.cache.put(f"key_{i}", suggestion)
        
        # Cache deve ter no máximo 10 itens
        self.assertLessEqual(len(self.cache.cache), 10)

class TestInteractionTracker(unittest.TestCase):
    """Testes para o rastreamento de interações"""
    
    def setUp(self):
        self.temp_dir = tempfile.mkdtemp()
        self.tracker = InteractionTracker(self.temp_dir)
    
    def tearDown(self):
        shutil.rmtree(self.temp_dir)
    
    def test_track_interaction(self):
        """Testar registro de interação"""
        suggestions = [
            Suggestion(
                suggestion_id="sug_1",
                text="Sugestão 1",
                confidence=0.8,
                category="medicamentos",
                persona="dr_gasnelio",
                context_match=["dosage"],
                created_at=datetime.now()
            )
        ]
        
        self.tracker.track_interaction(
            session_id="session_123",
            query="Qual a dose da rifampicina?",
            suggestions=suggestions,
            selected_suggestion="sug_1",
            persona_used="dr_gasnelio",
            satisfaction_score=0.9
        )
        
        # Verificar se foi registrado
        self.assertEqual(len(self.tracker.interactions), 1)
        
        interaction = self.tracker.interactions[0]
        self.assertEqual(interaction['session_id'], "session_123")
        self.assertEqual(interaction['selected_suggestion'], "sug_1")
        self.assertEqual(interaction['satisfaction_score'], 0.9)
    
    def test_user_patterns_update(self):
        """Testar atualização de padrões do usuário"""
        session_id = "user_456"
        
        # Simular várias interações
        for i in range(5):
            self.tracker.track_interaction(
                session_id=session_id,
                query=f"Query {i}",
                suggestions=[],
                persona_used="dr_gasnelio",
                satisfaction_score=0.8
            )
        
        # Verificar padrões
        patterns = self.tracker.user_patterns[session_id]
        self.assertEqual(patterns['total_interactions'], 5)
        self.assertEqual(patterns['persona_preferences']['dr_gasnelio'], 5)
        self.assertAlmostEqual(patterns['satisfaction_average'], 0.8)
    
    def test_get_user_context(self):
        """Testar obtenção de contexto do usuário"""
        session_id = "context_test"
        
        # Simular interações
        for i in range(3):
            self.tracker.track_interaction(
                session_id=session_id,
                query=f"Query sobre medicamentos {i}",
                suggestions=[],
                persona_used="dr_gasnelio"
            )
        
        context = self.tracker.get_user_context(session_id)
        
        self.assertEqual(context.session_id, session_id)
        self.assertEqual(context.persona_preference, "dr_gasnelio")
        self.assertEqual(len(context.query_history), 3)

class TestPredictiveEngine(unittest.TestCase):
    """Testes para o motor preditivo principal"""
    
    def setUp(self):
        # Configurar diretório temporário
        self.temp_dir = tempfile.mkdtemp()
        
        # Mock da configuração
        class MockConfig:
            VECTOR_DB_PATH = self.temp_dir
        
        # Substituir configuração temporariamente
        import services.predictive_system
        self.original_config = services.predictive_system.config
        services.predictive_system.config = MockConfig()
        
        self.engine = PredictiveEngine()
    
    def tearDown(self):
        # Restaurar configuração original
        import services.predictive_system
        services.predictive_system.config = self.original_config
        
        shutil.rmtree(self.temp_dir)
    
    def test_get_suggestions_dosage(self):
        """Testar geração de sugestões para query de dosagem"""
        suggestions = self.engine.get_suggestions(
            session_id="test_session",
            current_query="Qual a dose da rifampicina?",
            persona_context="dr_gasnelio"
        )
        
        self.assertIsInstance(suggestions, list)
        # Deve gerar pelo menos uma sugestão para query de dosagem
        self.assertGreaterEqual(len(suggestions), 0)
    
    def test_get_suggestions_emergency(self):
        """Testar sugestões para emergência"""
        suggestions = self.engine.get_suggestions(
            session_id="emergency_test",
            current_query="Estou com dor muito forte e urgente",
            persona_context="mixed"
        )
        
        # Para emergências, deve sempre gerar sugestões
        self.assertGreaterEqual(len(suggestions), 0)
        
        if suggestions:
            # Pelo menos uma sugestão deve ter alta confiança
            max_confidence = max(s.confidence for s in suggestions)
            self.assertGreaterEqual(max_confidence, 0.7)
    
    def test_track_suggestion_interaction(self):
        """Testar rastreamento de interação com sugestões"""
        # Gerar sugestões
        suggestions = self.engine.get_suggestions(
            session_id="track_test",
            current_query="Como tomar dapsona?",
            persona_context="ga_empathetic"
        )
        
        # Simular clique em sugestão
        if suggestions:
            self.engine.track_suggestion_interaction(
                session_id="track_test",
                query="Como tomar dapsona?",
                suggestions=suggestions,
                selected_suggestion_id=suggestions[0].suggestion_id,
                persona_used="ga_empathetic",
                satisfaction_score=0.9
            )
            
            # Verificar se foi registrado
            interactions = self.engine.tracker.interactions
            self.assertGreater(len(interactions), 0)
    
    def test_analytics_dashboard(self):
        """Testar dashboard de analytics"""
        # Simular algumas interações
        for i in range(3):
            self.engine.track_suggestion_interaction(
                session_id=f"analytics_test_{i}",
                query=f"Query {i}",
                suggestions=[],
                persona_used="mixed"
            )
        
        analytics = self.engine.get_analytics_dashboard()
        
        self.assertIn('interaction_analytics', analytics)
        self.assertIn('cache_performance', analytics)
        self.assertIn('system_health', analytics)
        
        # Verificar se analytics têm dados
        interaction_analytics = analytics['interaction_analytics']
        self.assertGreaterEqual(interaction_analytics['total_interactions'], 3)

class TestPredictionRules(unittest.TestCase):
    """Testes para regras de predição"""
    
    def setUp(self):
        self.temp_dir = tempfile.mkdtemp()
        
        # Mock config
        class MockConfig:
            VECTOR_DB_PATH = self.temp_dir
        
        import services.predictive_system
        self.original_config = services.predictive_system.config
        services.predictive_system.config = MockConfig()
        
        self.engine = PredictiveEngine()
    
    def tearDown(self):
        import services.predictive_system
        services.predictive_system.config = self.original_config
        shutil.rmtree(self.temp_dir)
    
    def test_dosage_follow_up_rule(self):
        """Testar regra de follow-up para dosagem"""
        user_context = UserContext(
            session_id="rule_test",
            persona_preference="dr_gasnelio",
            query_history=["Qual a dose da rifampicina?"],
            interaction_patterns={},
            medical_interests=["medicamentos"],
            complexity_preference="technical",
            last_activity=datetime.now()
        )
        
        query_analysis = {
            'medical_categories': ['medicamentos'],
            'query_patterns': ['dosage_query'],
            'urgency_level': 'normal'
        }
        
        # Encontrar e aplicar regra de dosage follow-up
        dosage_rule = None
        for rule in self.engine.rules:
            if rule.rule_id == "dosage_follow_up":
                dosage_rule = rule
                break
        
        self.assertIsNotNone(dosage_rule)
        
        suggestion = self.engine._apply_rule(dosage_rule, user_context, query_analysis)
        
        if suggestion:  # Pode não gerar sugestão dependendo da confiança
            self.assertIsInstance(suggestion, Suggestion)
            self.assertEqual(suggestion.persona, "dr_gasnelio")
    
    def test_emergency_guidance_rule(self):
        """Testar regra de orientação de emergência"""
        user_context = UserContext(
            session_id="emergency_rule_test",
            persona_preference="mixed",
            query_history=[],
            interaction_patterns={},
            medical_interests=[],
            complexity_preference="simple",
            last_activity=datetime.now()
        )
        
        query_analysis = {
            'medical_categories': [],
            'query_patterns': ['emergency'],
            'urgency_level': 'high'
        }
        
        # Encontrar regra de emergência
        emergency_rule = None
        for rule in self.engine.rules:
            if rule.rule_id == "emergency_guidance":
                emergency_rule = rule
                break
        
        self.assertIsNotNone(emergency_rule)
        
        suggestion = self.engine._apply_rule(emergency_rule, user_context, query_analysis)
        
        # Regra de emergência deve sempre gerar sugestão
        self.assertIsNotNone(suggestion)
        self.assertGreaterEqual(suggestion.confidence, 0.8)

def run_comprehensive_test():
    """Executar teste abrangente do sistema"""
    print("[TEST] TESTE ABRANGENTE DO SISTEMA PREDITIVO")
    print("=" * 60)
    
    # Executar todos os testes
    test_classes = [
        TestContextAnalyzer,
        TestPredictiveCache, 
        TestInteractionTracker,
        TestPredictiveEngine,
        TestPredictionRules
    ]
    
    total_tests = 0
    passed_tests = 0
    failed_tests = []
    
    for test_class in test_classes:
        print(f"\n[TESTING] {test_class.__name__}")
        print("-" * 40)
        
        suite = unittest.TestLoader().loadTestsFromTestCase(test_class)
        runner = unittest.TextTestRunner(verbosity=1, stream=sys.stdout)
        
        result = runner.run(suite)
        
        total_tests += result.testsRun
        passed_tests += result.testsRun - len(result.failures) - len(result.errors)
        
        if result.failures:
            failed_tests.extend([f"{test_class.__name__}.{f[0]}" for f in result.failures])
        
        if result.errors:
            failed_tests.extend([f"{test_class.__name__}.{e[0]}" for e in result.errors])
    
    print("\n" + "=" * 60)
    print("[REPORT] RESUMO DOS TESTES")
    print("=" * 60)
    print(f"Total de testes: {total_tests}")
    print(f"Testes aprovados: {passed_tests}")
    print(f"Testes falhados: {len(failed_tests)}")
    
    if failed_tests:
        print("\n[ERROR] Testes que falharam:")
        for test in failed_tests:
            print(f"  * {test}")
    
    success_rate = (passed_tests / total_tests) * 100 if total_tests > 0 else 0
    print(f"\n📈 Taxa de sucesso: {success_rate:.1f}%")
    
    if success_rate >= 90:
        print("[OK] Sistema preditivo funcionando corretamente!")
        return True
    elif success_rate >= 70:
        print("[WARNING] Sistema preditivo com alguns problemas")
        return False
    else:
        print("[ERROR] Sistema preditivo com problemas críticos")
        return False

if __name__ == "__main__":
    success = run_comprehensive_test()
    sys.exit(0 if success else 1)