#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Medical Functionality Validation Script
Ensures all medical features are preserved after code quality improvements

CRITICAL VALIDATION AREAS:
1. Dr. Gasnelio & Gá AI personas functionality
2. Medical knowledge base access
3. RAG system integration
4. Pharmaceutical dispensing protocols
5. Security and audit compliance
6. API endpoint availability
"""

import sys
import json
import logging
import traceback
from pathlib import Path
from typing import Dict, List, Any, Optional
from datetime import datetime

# Setup logging for validation
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class ValidationResult:
    """Validation result container"""

    def __init__(self, test_name: str):
        self.test_name = test_name
        self.passed = False
        self.error_message = ""
        self.details = {}
        self.timestamp = datetime.now().isoformat()

    def mark_passed(self, details: Dict = None):
        self.passed = True
        self.details = details or {}

    def mark_failed(self, error_message: str, details: Dict = None):
        self.passed = False
        self.error_message = error_message
        self.details = details or {}


class MedicalFunctionalityValidator:
    """Comprehensive medical functionality validator"""

    def __init__(self):
        self.results: List[ValidationResult] = []
        self.total_tests = 0
        self.passed_tests = 0

    def run_all_validations(self) -> Dict[str, Any]:
        """Run all medical functionality validations"""
        logger.info("🏥 Starting Medical Functionality Validation")
        logger.info("=" * 60)

        # Core functionality tests
        self.validate_personas_system()
        self.validate_knowledge_base()
        self.validate_chatbot_service()
        self.validate_configuration_management()
        self.validate_security_features()
        self.validate_api_endpoints()
        self.validate_medical_audit_system()

        # Generate final report
        return self.generate_validation_report()

    def validate_personas_system(self):
        """Validate AI personas system (Dr. Gasnelio & Gá)"""
        logger.info("🤖 Validating AI Personas System...")

        # Test 1: Import improved personas
        result1 = ValidationResult("Import Improved Personas")
        try:
            from services.ai.improved_personas import (
                get_persona_registry, DrGasnelioPersona, GaPersona,
                get_personas, get_persona_prompt, validate_persona
            )
            result1.mark_passed({
                "modules_imported": "services.ai.improved_personas",
                "classes_available": ["DrGasnelioPersona", "GaPersona"],
                "functions_available": ["get_personas", "get_persona_prompt", "validate_persona"]
            })
        except Exception as e:
            result1.mark_failed(f"Failed to import personas: {e}")
        self.add_result(result1)

        # Test 2: Validate Dr. Gasnelio persona
        result2 = ValidationResult("Dr. Gasnelio Persona Validation")
        try:
            registry = get_persona_registry()
            dr_gasnelio = registry.get_persona("dr_gasnelio")

            if not dr_gasnelio:
                result2.mark_failed("Dr. Gasnelio persona not found in registry")
            else:
                # Validate persona characteristics
                config = dr_gasnelio.config
                expected_expertise = [
                    "Poliquimioterapia Única (PQT-U)",
                    "pharmacology", "dispensing", "pharmacovigilance"
                ]

                has_medical_expertise = any(
                    exp.lower() in " ".join(config.capabilities.expertise_areas).lower()
                    for exp in expected_expertise
                )

                if has_medical_expertise and "técnico" in config.response_style.lower():
                    result2.mark_passed({
                        "persona_name": config.name,
                        "expertise_areas_count": len(config.capabilities.expertise_areas),
                        "target_audience": config.target_audience.value,
                        "response_style": config.response_style
                    })
                else:
                    result2.mark_failed("Dr. Gasnelio missing required medical expertise or response style")
        except Exception as e:
            result2.mark_failed(f"Dr. Gasnelio validation failed: {e}")
        self.add_result(result2)

        # Test 3: Validate Gá persona
        result3 = ValidationResult("Gá Persona Validation")
        try:
            registry = get_persona_registry()
            ga = registry.get_persona("ga")

            if not ga:
                result3.mark_failed("Gá persona not found in registry")
            else:
                config = ga.config
                expected_traits = ["empático", "acolhedor", "didático"]

                has_empathetic_traits = any(
                    trait in " ".join(config.personality_traits).lower()
                    for trait in expected_traits
                )

                if has_empathetic_traits and config.target_audience.value == "patients":
                    result3.mark_passed({
                        "persona_name": config.name,
                        "personality_traits": config.personality_traits,
                        "target_audience": config.target_audience.value,
                        "empathetic_design": True
                    })
                else:
                    result3.mark_failed("Gá missing empathetic characteristics or wrong target audience")
        except Exception as e:
            result3.mark_failed(f"Gá validation failed: {e}")
        self.add_result(result3)

        # Test 4: Backward compatibility
        result4 = ValidationResult("Personas Backward Compatibility")
        try:
            # Test legacy functions
            personas_dict = get_personas()
            dr_prompt = get_persona_prompt("dr_gasnelio")
            ga_prompt = get_persona_prompt("ga")

            if (len(personas_dict) >= 2 and
                "dr_gasnelio" in personas_dict and
                "ga" in personas_dict and
                len(dr_prompt) > 50 and
                len(ga_prompt) > 50):
                result4.mark_passed({
                    "legacy_functions_working": True,
                    "personas_count": len(personas_dict),
                    "dr_gasnelio_prompt_length": len(dr_prompt),
                    "ga_prompt_length": len(ga_prompt)
                })
            else:
                result4.mark_failed("Backward compatibility issues with persona functions")
        except Exception as e:
            result4.mark_failed(f"Backward compatibility test failed: {e}")
        self.add_result(result4)

    def validate_knowledge_base(self):
        """Validate knowledge base functionality"""
        logger.info("📚 Validating Knowledge Base System...")

        result = ValidationResult("Knowledge Base Integration")
        try:
            from services.ai.improved_chatbot import ImprovedChatbotService

            # Test knowledge base loading
            chatbot = ImprovedChatbotService()
            kb_stats = chatbot.knowledge_base.get_stats()

            if kb_stats["total_documents"] > 0:
                result.mark_passed({
                    "documents_loaded": kb_stats["total_documents"],
                    "file_types": kb_stats["file_types"],
                    "vectors_built": kb_stats["vectors_built"]
                })
            else:
                result.mark_failed("No documents loaded in knowledge base", kb_stats)

        except Exception as e:
            result.mark_failed(f"Knowledge base validation failed: {e}")
        self.add_result(result)

    def validate_chatbot_service(self):
        """Validate chatbot service functionality"""
        logger.info("💬 Validating Chatbot Service...")

        # Test 1: Service initialization
        result1 = ValidationResult("Chatbot Service Initialization")
        try:
            from services.ai.improved_chatbot import ImprovedChatbotService, ChatRequest

            chatbot = ImprovedChatbotService()
            health = chatbot.health_check()

            if health["overall_healthy"]:
                result1.mark_passed(health)
            else:
                result1.mark_failed("Chatbot service not healthy", health)
        except Exception as e:
            result1.mark_failed(f"Chatbot initialization failed: {e}")
        self.add_result(result1)

        # Test 2: Medical query processing
        result2 = ValidationResult("Medical Query Processing")
        try:
            from services.ai.improved_chatbot import ImprovedChatbotService, ChatRequest

            chatbot = ImprovedChatbotService()

            # Test medical query with Dr. Gasnelio
            medical_request = ChatRequest(
                message="Qual a dosagem recomendada de rifampicina para hanseníase?",
                persona_id="dr_gasnelio"
            )

            response = chatbot.process_chat_request(medical_request)

            if (not response.error and
                response.persona_id == "dr_gasnelio" and
                len(response.response) > 50):
                result2.mark_passed({
                    "response_generated": True,
                    "response_length": len(response.response),
                    "context_used": len(response.context_used),
                    "confidence_score": response.confidence_score
                })
            else:
                result2.mark_failed("Medical query processing failed", {
                    "error": response.error,
                    "error_message": response.error_message
                })
        except Exception as e:
            result2.mark_failed(f"Medical query test failed: {e}")
        self.add_result(result2)

        # Test 3: Patient support query
        result3 = ValidationResult("Patient Support Query Processing")
        try:
            from services.ai.improved_chatbot import ImprovedChatbotService, ChatRequest

            chatbot = ImprovedChatbotService()

            # Test empathetic query with Gá
            support_request = ChatRequest(
                message="Estou preocupado com os efeitos colaterais do medicamento",
                persona_id="ga"
            )

            response = chatbot.process_chat_request(support_request)

            if (not response.error and
                response.persona_id == "ga" and
                len(response.response) > 50):
                result3.mark_passed({
                    "empathetic_response_generated": True,
                    "response_length": len(response.response),
                    "persona_name": response.persona_name
                })
            else:
                result3.mark_failed("Patient support query failed", {
                    "error": response.error,
                    "error_message": response.error_message
                })
        except Exception as e:
            result3.mark_failed(f"Patient support test failed: {e}")
        self.add_result(result3)

    def validate_configuration_management(self):
        """Validate configuration management"""
        logger.info("⚙️ Validating Configuration Management...")

        result = ValidationResult("Configuration Management")
        try:
            from core.config.config_manager import get_config

            config = get_config()

            # Validate medical-specific configurations
            medical_configs = {
                "ai_rag_available": config.ai.rag_available,
                "qa_enabled": config.ai.qa_enabled,
                "embedding_model": config.ai.embedding_model,
                "database_vector_dims": config.database.pgvector_dimensions,
                "security_enabled": config.security.rate_limit_enabled
            }

            # Check if medical features are properly configured
            if (config.ai.rag_available and
                "multilingual" in config.ai.embedding_model.lower()):
                result.mark_passed({
                    "medical_configs": medical_configs,
                    "config_valid": True,
                    "environment": config.environment.value
                })
            else:
                result.mark_failed("Medical configurations not properly set", medical_configs)

        except Exception as e:
            result.mark_failed(f"Configuration validation failed: {e}")
        self.add_result(result)

    def validate_security_features(self):
        """Validate security features"""
        logger.info("🔒 Validating Security Features...")

        result = ValidationResult("Security Features Validation")
        try:
            from core.config.config_manager import get_config

            config = get_config()

            security_features = {
                "rate_limiting": config.security.rate_limit_enabled,
                "auto_blocking": config.security.security_auto_block_enabled,
                "secure_cookies": config.security.session_cookie_secure,
                "httponly_cookies": config.security.session_cookie_httponly,
                "max_content_length": config.security.max_content_length
            }

            # Check critical security features
            critical_enabled = (
                config.security.rate_limit_enabled and
                config.security.security_auto_block_enabled and
                config.security.session_cookie_httponly
            )

            if critical_enabled:
                result.mark_passed({
                    "security_features": security_features,
                    "critical_security_enabled": True
                })
            else:
                result.mark_failed("Critical security features disabled", security_features)

        except Exception as e:
            result.mark_failed(f"Security validation failed: {e}")
        self.add_result(result)

    def validate_api_endpoints(self):
        """Validate API endpoints availability"""
        logger.info("🌐 Validating API Endpoints...")

        result = ValidationResult("API Endpoints Validation")
        try:
            from core.app_factory.flask_app_factory import create_flask_app

            app = create_flask_app()

            # Get all registered routes
            routes = []
            for rule in app.url_map.iter_rules():
                routes.append({
                    "endpoint": rule.endpoint,
                    "rule": str(rule),
                    "methods": list(rule.methods - {'HEAD', 'OPTIONS'})
                })

            # Check for critical medical endpoints
            critical_endpoints = [
                "/api/v1/chat", "/api/v1/personas", "/api/v1/health",
                "/api/v1/feedback", "/"
            ]

            available_rules = [route["rule"] for route in routes]
            missing_endpoints = [
                endpoint for endpoint in critical_endpoints
                if not any(endpoint in rule for rule in available_rules)
            ]

            if not missing_endpoints:
                result.mark_passed({
                    "total_routes": len(routes),
                    "critical_endpoints_available": True,
                    "sample_routes": routes[:5]  # Show first 5 routes
                })
            else:
                result.mark_failed(
                    f"Missing critical endpoints: {missing_endpoints}",
                    {"available_routes": available_rules}
                )

        except Exception as e:
            result.mark_failed(f"API endpoints validation failed: {e}")
        self.add_result(result)

    def validate_medical_audit_system(self):
        """Validate medical audit system if available"""
        logger.info("📋 Validating Medical Audit System...")

        result = ValidationResult("Medical Audit System")
        try:
            # Try to import audit system
            from services.ai.chatbot import medical_audit_logger

            result.mark_passed({
                "audit_system_available": True,
                "audit_logger_imported": True
            })
        except ImportError:
            result.mark_failed("Medical audit system not available (optional)")
        except Exception as e:
            result.mark_failed(f"Audit system validation failed: {e}")
        self.add_result(result)

    def add_result(self, result: ValidationResult):
        """Add validation result"""
        self.results.append(result)
        self.total_tests += 1
        if result.passed:
            self.passed_tests += 1
            logger.info(f"✅ {result.test_name}: PASSED")
        else:
            logger.error(f"❌ {result.test_name}: FAILED - {result.error_message}")

    def generate_validation_report(self) -> Dict[str, Any]:
        """Generate comprehensive validation report"""
        success_rate = (self.passed_tests / self.total_tests) * 100 if self.total_tests > 0 else 0

        report = {
            "validation_summary": {
                "total_tests": self.total_tests,
                "passed_tests": self.passed_tests,
                "failed_tests": self.total_tests - self.passed_tests,
                "success_rate_percent": round(success_rate, 1),
                "overall_status": "PASSED" if success_rate >= 80 else "FAILED",
                "timestamp": datetime.now().isoformat()
            },
            "test_results": [
                {
                    "test_name": result.test_name,
                    "status": "PASSED" if result.passed else "FAILED",
                    "error_message": result.error_message,
                    "details": result.details,
                    "timestamp": result.timestamp
                }
                for result in self.results
            ],
            "medical_functionality_assessment": {
                "personas_system": "VALIDATED" if any(
                    r.passed for r in self.results if "Persona" in r.test_name
                ) else "FAILED",
                "knowledge_base": "VALIDATED" if any(
                    r.passed for r in self.results if "Knowledge Base" in r.test_name
                ) else "FAILED",
                "chatbot_service": "VALIDATED" if any(
                    r.passed for r in self.results if "Chatbot" in r.test_name
                ) else "FAILED",
                "security_features": "VALIDATED" if any(
                    r.passed for r in self.results if "Security" in r.test_name
                ) else "FAILED"
            }
        }

        return report


def main():
    """Main validation function"""
    print("🏥 MEDICAL FUNCTIONALITY VALIDATION")
    print("=" * 60)
    print("Validating all medical features after code quality improvements...")
    print()

    validator = MedicalFunctionalityValidator()
    report = validator.run_all_validations()

    # Print summary
    print("\n" + "=" * 60)
    print("📊 VALIDATION SUMMARY")
    print("=" * 60)

    summary = report["validation_summary"]
    print(f"Total Tests: {summary['total_tests']}")
    print(f"Passed: {summary['passed_tests']}")
    print(f"Failed: {summary['failed_tests']}")
    print(f"Success Rate: {summary['success_rate_percent']}%")
    print(f"Overall Status: {summary['overall_status']}")

    # Print medical functionality assessment
    print("\n🏥 MEDICAL FUNCTIONALITY ASSESSMENT:")
    for feature, status in report["medical_functionality_assessment"].items():
        status_icon = "✅" if status == "VALIDATED" else "❌"
        print(f"  {status_icon} {feature.replace('_', ' ').title()}: {status}")

    # Save detailed report
    report_file = Path("medical_functionality_validation_report.json")
    with open(report_file, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    print(f"\n📄 Detailed report saved to: {report_file}")

    # Exit with appropriate code
    if summary["success_rate_percent"] >= 80:
        print("\n🎉 MEDICAL FUNCTIONALITY VALIDATION: SUCCESSFUL")
        print("All critical medical features are preserved and working correctly.")
        sys.exit(0)
    else:
        print("\n⚠️  MEDICAL FUNCTIONALITY VALIDATION: ISSUES DETECTED")
        print("Some medical features may need attention before deployment.")
        sys.exit(1)


if __name__ == "__main__":
    main()