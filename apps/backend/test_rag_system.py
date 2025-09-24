#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
RAG System Test Script
Tests the complete RAG system functionality
"""

import sys
import os
import json
import logging
from datetime import datetime

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def test_rag_health():
    """Test RAG system health"""
    logger.info("🩺 Testing RAG Health System...")

    try:
        from services.rag.rag_health_checker import get_rag_health, get_rag_simple_status, test_rag_functionality

        # Get simple status
        simple_status = get_rag_simple_status()
        logger.info(f"RAG Simple Status: {simple_status}")

        # Get detailed health
        health = get_rag_health()
        logger.info(f"RAG Overall Status: {health.get('rag_overall', 'UNKNOWN')}")

        # Test functionality
        test_result = test_rag_functionality()
        logger.info(f"RAG Test Query Success: {test_result.get('test_successful', False)}")

        return simple_status in ['OK', 'PARTIAL']

    except Exception as e:
        logger.error(f"❌ RAG health test failed: {e}")
        return False

def test_unified_rag():
    """Test unified RAG system"""
    logger.info("🧠 Testing Unified RAG System...")

    try:
        from services.rag.unified_rag_system import query_unified_rag, get_unified_rag_status

        # Test status
        status = get_unified_rag_status()
        logger.info(f"Unified RAG Available: {status.get('unified_rag_available', False)}")
        logger.info(f"Best System: {status.get('best_system', 'none')}")

        # Test query
        test_queries = [
            "O que é PQT-U?",
            "Quais são as contraindicações da clofazimina?",
            "Como administrar dapsona?",
            "Dosagem para crianças"
        ]

        success_count = 0

        for query in test_queries:
            logger.info(f"Testing query: {query}")
            response = query_unified_rag(query, 'dr_gasnelio', 3)

            if response.success:
                success_count += 1
                logger.info(f"✅ Query successful, system: {response.system_used}, confidence: {response.confidence:.2f}")
            else:
                logger.warning(f"⚠️ Query failed or fallback used")

        success_rate = success_count / len(test_queries)
        logger.info(f"Query Success Rate: {success_rate:.1%}")

        return success_rate > 0.5

    except Exception as e:
        logger.error(f"❌ Unified RAG test failed: {e}")
        return False

def test_complete_medical_rag():
    """Test complete medical RAG system"""
    logger.info("🩺 Testing Complete Medical RAG...")

    try:
        from services.rag.complete_medical_rag import get_medical_rag, get_rag_status

        # Test system status
        status = get_rag_status()
        logger.info(f"Complete RAG Available: {status.get('available', False)}")

        # Test system initialization
        rag_system = get_medical_rag()
        if not rag_system:
            logger.warning("⚠️ Complete RAG system not initialized")
            return False

        if not rag_system.is_available():
            logger.warning("⚠️ Complete RAG system not available - may need API keys")
            return False

        # Test context generation
        test_context = rag_system.get_context_for_persona("O que é hanseníase?", "dr_gasnelio")

        if test_context and "não disponível" not in test_context.lower():
            logger.info("✅ Complete RAG context generation successful")
            return True
        else:
            logger.warning("⚠️ Complete RAG returned limited context")
            return False

    except Exception as e:
        logger.error(f"❌ Complete Medical RAG test failed: {e}")
        return False

def test_chat_integration():
    """Test chat endpoint integration"""
    logger.info("💬 Testing Chat Integration...")

    try:
        # Simulate chat request data
        test_data = {
            'message': 'O que é PQT-U para hanseníase?',
            'persona': 'gasnelio'
        }

        # Test chat function directly
        from blueprints.medical_core_blueprint import medical_core_bp

        # We can't easily test the Flask endpoint directly, so we'll test the underlying logic
        # by importing the RAG query function
        from services.rag.unified_rag_system import query_unified_rag

        response = query_unified_rag(test_data['message'], 'dr_gasnelio', 3)

        if response and (response.success or response.answer):
            logger.info("✅ Chat integration test successful")
            logger.info(f"Response preview: {response.answer[:100]}...")
            return True
        else:
            logger.warning("⚠️ Chat integration returned fallback response")
            return False

    except Exception as e:
        logger.error(f"❌ Chat integration test failed: {e}")
        return False

def test_knowledge_base():
    """Test knowledge base availability"""
    logger.info("📚 Testing Knowledge Base...")

    try:
        import os
        from pathlib import Path

        knowledge_paths = [
            "data/knowledge-base",
            "data/structured",
            "data/knowledge_base"  # Alternative
        ]

        total_files = 0
        found_paths = 0

        for path in knowledge_paths:
            if os.path.exists(path):
                found_paths += 1
                path_obj = Path(path)
                md_files = list(path_obj.rglob("*.md"))
                json_files = list(path_obj.rglob("*.json"))
                files_in_path = len(md_files) + len(json_files)
                total_files += files_in_path
                logger.info(f"Found {files_in_path} files in {path}")

        logger.info(f"Total knowledge base files: {total_files}")
        logger.info(f"Knowledge paths found: {found_paths}/{len(knowledge_paths)}")

        return total_files > 0

    except Exception as e:
        logger.error(f"❌ Knowledge base test failed: {e}")
        return False

def run_comprehensive_test():
    """Run comprehensive RAG system test"""
    logger.info("🎯 Starting Comprehensive RAG System Test")
    logger.info("=" * 60)

    tests = [
        ("Knowledge Base", test_knowledge_base),
        ("RAG Health", test_rag_health),
        ("Complete Medical RAG", test_complete_medical_rag),
        ("Unified RAG", test_unified_rag),
        ("Chat Integration", test_chat_integration)
    ]

    results = {}
    overall_success = True

    for test_name, test_func in tests:
        logger.info(f"\n📋 Running: {test_name}")
        try:
            result = test_func()
            results[test_name] = result

            if result:
                logger.info(f"✅ {test_name}: PASSED")
            else:
                logger.warning(f"⚠️ {test_name}: FAILED")
                overall_success = False

        except Exception as e:
            logger.error(f"❌ {test_name}: ERROR - {e}")
            results[test_name] = False
            overall_success = False

    # Print summary
    logger.info("\n" + "=" * 60)
    logger.info("📊 TEST SUMMARY")
    logger.info("=" * 60)

    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        logger.info(f"{test_name:.<30} {status}")

    pass_count = sum(results.values())
    total_count = len(results)
    pass_rate = pass_count / total_count if total_count > 0 else 0

    logger.info(f"\nOverall Results: {pass_count}/{total_count} tests passed ({pass_rate:.1%})")

    if overall_success:
        logger.info("🎉 RAG System is FULLY FUNCTIONAL!")
        logger.info("The system should show 'RAG: OK' in health endpoints")
    elif pass_rate >= 0.6:
        logger.info("⚠️ RAG System is PARTIALLY FUNCTIONAL")
        logger.info("Some components working, may show 'RAG: PARTIAL'")
    else:
        logger.error("❌ RAG System has MAJOR ISSUES")
        logger.error("System likely to show 'RAG: FAIL'")

    # Recommendations
    logger.info("\n🔧 RECOMMENDATIONS:")

    if not results.get("Knowledge Base", False):
        logger.info("- Add medical documents to data/knowledge-base/ directory")

    if not results.get("Complete Medical RAG", False):
        logger.info("- Set OPENAI_API_KEY environment variable")
        logger.info("- Install missing dependencies: pip install chromadb openai")

    if not results.get("Unified RAG", False):
        logger.info("- Check system dependencies and configuration")
        logger.info("- Verify vector store setup")

    logger.info("- Check application logs for detailed error messages")
    logger.info("- Visit /api/v1/health endpoint to see current status")

    return overall_success

if __name__ == "__main__":
    success = run_comprehensive_test()
    sys.exit(0 if success else 1)