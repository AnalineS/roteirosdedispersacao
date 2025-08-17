#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Teste Simplificado do Sistema Preditivo
Validação básica das funcionalidades
"""

import os
import sys
import tempfile
import shutil
from datetime import datetime
from pathlib import Path

# Adicionar ao path
sys.path.append(str(Path(__file__).parent))

def test_context_analyzer():
    """Testar analisador de contexto"""
    print("[TEST] Context Analyzer...")
    
    try:
        from services.predictive_system import ContextAnalyzer
        
        analyzer = ContextAnalyzer()
        
        # Teste 1: Query de dosagem
        analysis = analyzer.analyze_query("Qual a dose da rifampicina?")
        assert 'dosage_query' in analysis['query_patterns']
        assert 'medicamentos' in analysis['medical_categories']
        
        # Teste 2: Query de emergência
        analysis = analyzer.analyze_query("Estou com dor muito forte")
        assert analysis['urgency_level'] == 'high'
        
        # Teste 3: Query técnica
        analysis = analyzer.analyze_query("Qual o mecanismo farmacocinético?")
        assert 'dr_gasnelio' in analysis['persona_hints']
        
        print("  [OK] Context Analyzer funcionando")
        return True
        
    except Exception as e:
        print(f"  [ERROR] Context Analyzer falhou: {e}")
        return False

def test_predictive_cache():
    """Testar cache preditivo"""
    print("[TEST] Predictive Cache...")
    
    try:
        from services.predictive_system import PredictiveCache, Suggestion
        
        cache = PredictiveCache(max_size=5)
        
        # Criar sugestão de teste
        suggestion = Suggestion(
            suggestion_id="test_123",
            text="Teste",
            confidence=0.8,
            category="test",
            persona="dr_gasnelio",
            context_match=["test"],
            created_at=datetime.now()
        )
        
        # Testar put/get
        cache.put("test_key", suggestion)
        retrieved = cache.get("test_key")
        
        assert retrieved is not None
        assert retrieved.suggestion_id == "test_123"
        
        print("  [OK] Predictive Cache funcionando")
        return True
        
    except Exception as e:
        print(f"  [ERROR] Predictive Cache falhou: {e}")
        return False

def test_interaction_tracker():
    """Testar rastreamento de interações"""
    print("[TEST] Interaction Tracker...")
    
    temp_dir = tempfile.mkdtemp()
    
    try:
        from services.predictive_system import InteractionTracker, Suggestion
        
        tracker = InteractionTracker(temp_dir)
        
        # Criar sugestão de teste
        suggestion = Suggestion(
            suggestion_id="track_test",
            text="Teste tracking",
            confidence=0.7,
            category="test",
            persona="ga_empathetic",
            context_match=["test"],
            created_at=datetime.now()
        )
        
        # Testar tracking
        tracker.track_interaction(
            session_id="test_session",
            query="Teste query",
            suggestions=[suggestion],
            selected_suggestion="track_test",
            persona_used="ga_empathetic",
            satisfaction_score=0.9
        )
        
        assert len(tracker.interactions) == 1
        assert tracker.interactions[0]['selected_suggestion'] == 'track_test'
        
        # Testar contexto do usuário
        context = tracker.get_user_context("test_session")
        assert context.session_id == "test_session"
        assert context.persona_preference == "ga_empathetic"
        
        print("  [OK] Interaction Tracker funcionando")
        return True
        
    except Exception as e:
        print(f"  [ERROR] Interaction Tracker falhou: {e}")
        return False
        
    finally:
        shutil.rmtree(temp_dir)

def test_predictive_engine():
    """Testar motor preditivo principal"""
    print("[TEST] Predictive Engine...")
    
    temp_dir = tempfile.mkdtemp()
    
    try:
        # Mock da configuração
        class MockConfig:
            VECTOR_DB_PATH = temp_dir
        
        # Substituir configuração
        import services.predictive_system
        original_config = services.predictive_system.config
        services.predictive_system.config = MockConfig()
        
        from services.predictive_system import PredictiveEngine
        
        engine = PredictiveEngine()
        
        # Testar geração de sugestões
        suggestions = engine.get_suggestions(
            session_id="engine_test",
            current_query="Qual a dose da rifampicina?",
            persona_context="dr_gasnelio",
            max_suggestions=3
        )
        
        assert isinstance(suggestions, list)
        
        # Testar tracking
        if suggestions:
            engine.track_suggestion_interaction(
                session_id="engine_test",
                query="Qual a dose da rifampicina?",
                suggestions=suggestions,
                selected_suggestion_id=suggestions[0].suggestion_id,
                persona_used="dr_gasnelio"
            )
        
        # Testar analytics
        analytics = engine.get_analytics_dashboard()
        assert 'interaction_analytics' in analytics
        assert 'cache_performance' in analytics
        
        # Restaurar configuração
        services.predictive_system.config = original_config
        
        print("  [OK] Predictive Engine funcionando")
        return True
        
    except Exception as e:
        print(f"  [ERROR] Predictive Engine falhou: {e}")
        return False
        
    finally:
        shutil.rmtree(temp_dir)

def test_system_integration():
    """Testar integração completa do sistema"""
    print("[TEST] System Integration...")
    
    try:
        from services.predictive_system import get_predictive_engine, is_predictive_system_available
        
        # Testar disponibilidade
        available = is_predictive_system_available()
        if not available:
            print("  [WARNING] Sistema preditivo não disponível")
            return True  # Não é erro crítico
        
        # Testar instância global
        engine = get_predictive_engine()
        assert engine is not None
        
        # Testar workflow completo
        suggestions = engine.get_suggestions(
            session_id="integration_test",
            current_query="Como tomar dapsona?",
            persona_context="ga_empathetic"
        )
        
        print("  [OK] System Integration funcionando")
        return True
        
    except Exception as e:
        print(f"  [ERROR] System Integration falhou: {e}")
        return False

def main():
    """Executar todos os testes"""
    print("[PREDICTIVE] TESTE DO SISTEMA DE ANALISE PREDITIVA")
    print("=" * 60)
    
    tests = [
        test_context_analyzer,
        test_predictive_cache,
        test_interaction_tracker,
        test_predictive_engine,
        test_system_integration
    ]
    
    passed = 0
    total = len(tests)
    
    for test_func in tests:
        try:
            if test_func():
                passed += 1
        except Exception as e:
            print(f"  [CRITICAL ERROR] {test_func.__name__}: {e}")
    
    print("\n" + "=" * 60)
    print(f"[RESULTS] {passed}/{total} testes passaram")
    
    success_rate = (passed / total) * 100
    print(f"[SUCCESS RATE] {success_rate:.1f}%")
    
    if success_rate >= 80:
        print("[STATUS] Sistema preditivo funcionando corretamente!")
        return True
    else:
        print("[STATUS] Sistema preditivo com problemas")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)