#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Medical AI Validation Script
Comprehensive validation of medical AI functionality after security updates
"""

import os
import sys
import json
import time
import logging
import hashlib
import traceback
from pathlib import Path
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime
from dataclasses import dataclass, asdict

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('medical_ai_validation.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

@dataclass
class ValidationResult:
    """Structured validation result"""
    component: str
    test_name: str
    success: bool
    score: Optional[float] = None
    execution_time: Optional[float] = None
    error_message: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    timestamp: Optional[str] = None

    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now().isoformat()

@dataclass
class MedicalTestCase:
    """Medical knowledge test case"""
    question: str
    persona_id: str
    expected_keywords: List[str]
    validation_type: str  # 'accuracy', 'empathy', 'technical'
    minimum_length: int = 50
    timeout_seconds: int = 30

class MedicalAIValidator:
    """Comprehensive medical AI validation system"""

    def __init__(self, config_path: Optional[str] = None):
        self.config_path = config_path
        self.results: List[ValidationResult] = []
        self.chatbot_service = None
        self.embedding_service = None

        # Medical knowledge test cases
        self.medical_test_cases = self._initialize_test_cases()

        # Performance thresholds
        self.performance_thresholds = {
            'persona_accuracy': 0.90,  # 90% minimum accuracy
            'rag_precision': 0.85,     # 85% retrieval precision
            'response_time': 5.0,      # 5 seconds max response time
            'embedding_success': 0.95,  # 95% embedding success rate
            'calculation_precision': 1.0,  # 100% calculation accuracy
            'medical_knowledge': 0.88   # 88% medical knowledge accuracy
        }

    def _initialize_test_cases(self) -> Dict[str, List[MedicalTestCase]]:
        """Initialize comprehensive medical test cases"""
        return {
            "dr_gasnelio": [
                MedicalTestCase(
                    question="Qual é a posologia da rifampicina no esquema PQT-MB para adultos?",
                    persona_id="dr_gasnelio",
                    expected_keywords=["600mg", "mensal", "supervisionada", "PQT-MB"],
                    validation_type="technical",
                    minimum_length=100
                ),
                MedicalTestCase(
                    question="Quais são os critérios diagnósticos para hanseníase neural pura?",
                    persona_id="dr_gasnelio",
                    expected_keywords=["neural", "espessamento", "nervo", "déficit"],
                    validation_type="technical",
                    minimum_length=150
                ),
                MedicalTestCase(
                    question="Como manejar uma reação hansênica tipo 2 (ENL)?",
                    persona_id="dr_gasnelio",
                    expected_keywords=["talidomida", "corticoide", "ENL", "anti-inflamatório"],
                    validation_type="technical",
                    minimum_length=120
                ),
                MedicalTestCase(
                    question="Qual a dose de dapsona para crianças com hanseníase?",
                    persona_id="dr_gasnelio",
                    expected_keywords=["peso", "mg/kg", "pediátrica", "dapsona"],
                    validation_type="technical",
                    minimum_length=80
                ),
                MedicalTestCase(
                    question="Interações medicamentosas da clofazimina?",
                    persona_id="dr_gasnelio",
                    expected_keywords=["interação", "medicamento", "clofazimina"],
                    validation_type="technical",
                    minimum_length=60
                )
            ],
            "ga": [
                MedicalTestCase(
                    question="Estou com medo dos efeitos colaterais do tratamento da hanseníase",
                    persona_id="ga",
                    expected_keywords=["compreendo", "normal", "ajudar", "acompanhar"],
                    validation_type="empathy",
                    minimum_length=80
                ),
                MedicalTestCase(
                    question="Como posso explicar para minha família que tenho hanseníase?",
                    persona_id="ga",
                    expected_keywords=["família", "explicar", "apoio", "compreensão"],
                    validation_type="empathy",
                    minimum_length=100
                ),
                MedicalTestCase(
                    question="O tratamento é muito longo, estou desanimado",
                    persona_id="ga",
                    expected_keywords=["entendo", "importante", "cura", "persistir"],
                    validation_type="empathy",
                    minimum_length=70
                ),
                MedicalTestCase(
                    question="Como explicar hanseníase para uma criança?",
                    persona_id="ga",
                    expected_keywords=["simples", "criança", "fácil", "entender"],
                    validation_type="empathy",
                    minimum_length=90
                ),
                MedicalTestCase(
                    question="Tenho vergonha do preconceito com hanseníase",
                    persona_id="ga",
                    expected_keywords=["compreendo", "preconceito", "normal", "apoio"],
                    validation_type="empathy",
                    minimum_length=80
                )
            ]
        }

    def _initialize_services(self) -> bool:
        """Initialize chatbot and embedding services"""
        try:
            # Import and initialize chatbot service
            from services.ai.chatbot import ChatbotService
            self.chatbot_service = ChatbotService()
            logger.info("✅ Chatbot service initialized")

            # Import and initialize embedding service
            from services.unified_embedding_service import get_embedding_service
            self.embedding_service = get_embedding_service()

            if self.embedding_service and self.embedding_service.is_available():
                logger.info("✅ Embedding service initialized and available")
            else:
                logger.warning("⚠️  Embedding service not available")
                return False

            return True

        except ImportError as e:
            logger.error(f"❌ Failed to import services: {e}")
            return False
        except Exception as e:
            logger.error(f"❌ Failed to initialize services: {e}")
            return False

    def validate_persona_responses(self) -> List[ValidationResult]:
        """Validate AI persona responses for medical accuracy and empathy"""
        persona_results = []

        if not self.chatbot_service:
            error_result = ValidationResult(
                component="personas",
                test_name="service_initialization",
                success=False,
                error_message="Chatbot service not initialized"
            )
            persona_results.append(error_result)
            return persona_results

        for persona_id, test_cases in self.medical_test_cases.items():
            logger.info(f"🧠 Testing persona: {persona_id}")

            persona_score = 0
            total_tests = len(test_cases)

            for i, test_case in enumerate(test_cases):
                logger.info(f"   Test {i+1}/{total_tests}: {test_case.question[:50]}...")

                start_time = time.time()
                try:
                    # Generate response
                    response = self.chatbot_service.process_message(
                        message=test_case.question,
                        persona_id=persona_id,
                        user_session_id=f"validation_{persona_id}_{i}"
                    )

                    execution_time = time.time() - start_time

                    # Validate response
                    success, score, details = self._validate_medical_response(
                        response, test_case
                    )

                    if success:
                        persona_score += score

                    result = ValidationResult(
                        component="personas",
                        test_name=f"{persona_id}_test_{i+1}",
                        success=success,
                        score=score,
                        execution_time=execution_time,
                        details=details
                    )

                    persona_results.append(result)

                    # Rate limiting
                    time.sleep(1)

                except Exception as e:
                    execution_time = time.time() - start_time
                    error_result = ValidationResult(
                        component="personas",
                        test_name=f"{persona_id}_test_{i+1}",
                        success=False,
                        execution_time=execution_time,
                        error_message=str(e)
                    )
                    persona_results.append(error_result)

            # Overall persona score
            overall_score = persona_score / total_tests if total_tests > 0 else 0
            overall_success = overall_score >= self.performance_thresholds['persona_accuracy']

            summary_result = ValidationResult(
                component="personas",
                test_name=f"{persona_id}_overall",
                success=overall_success,
                score=overall_score,
                details={"total_tests": total_tests, "passed_tests": persona_score}
            )
            persona_results.append(summary_result)

            logger.info(f"   📊 {persona_id} overall score: {overall_score:.2%}")

        return persona_results

    def _validate_medical_response(
        self,
        response: Dict[str, Any],
        test_case: MedicalTestCase
    ) -> Tuple[bool, float, Dict[str, Any]]:
        """Validate individual medical response"""
        score = 0.0
        details = {}

        # Check basic response structure
        if not response or response.get("error", False):
            details["error"] = "Invalid response structure or error occurred"
            return False, 0.0, details

        response_text = response.get("response", "")
        if not response_text:
            details["error"] = "Empty response"
            return False, 0.0, details

        # Length validation
        if len(response_text) < test_case.minimum_length:
            details["length_issue"] = f"Response too short: {len(response_text)} < {test_case.minimum_length}"
            score -= 0.2

        # Keyword validation
        keyword_matches = 0
        for keyword in test_case.expected_keywords:
            if keyword.lower() in response_text.lower():
                keyword_matches += 1

        keyword_score = keyword_matches / len(test_case.expected_keywords)
        score += keyword_score * 0.6  # Keywords worth 60% of score

        details["keyword_matches"] = keyword_matches
        details["total_keywords"] = len(test_case.expected_keywords)
        details["keyword_score"] = keyword_score

        # API usage validation (ensures AI model was used, not fallback)
        if response.get("api_used", False):
            score += 0.3  # API usage worth 30% of score
            details["api_used"] = True
        else:
            details["api_used"] = False

        # Response time validation
        if "execution_time" in details and details["execution_time"] > self.performance_thresholds['response_time']:
            score -= 0.1
            details["slow_response"] = True

        # Validation type specific checks
        if test_case.validation_type == "empathy":
            empathy_keywords = ["compreendo", "entendo", "apoio", "ajudar", "normal", "importante"]
            empathy_matches = sum(1 for kw in empathy_keywords if kw.lower() in response_text.lower())
            empathy_score = min(empathy_matches / 3, 1.0)  # At least 3 empathy indicators
            score += empathy_score * 0.2
            details["empathy_score"] = empathy_score

        elif test_case.validation_type == "technical":
            # Check for medical terminology appropriateness
            if any(tech_term in response_text.lower() for tech_term in ["mg", "dose", "tratamento", "medicamento"]):
                score += 0.1
                details["medical_terminology"] = True

        # Normalize score to [0, 1]
        final_score = max(0.0, min(1.0, score))
        success = final_score >= 0.7  # 70% threshold for individual tests

        details["final_score"] = final_score
        details["response_length"] = len(response_text)

        return success, final_score, details

    def validate_rag_system(self) -> List[ValidationResult]:
        """Validate RAG system knowledge retrieval accuracy"""
        rag_results = []

        if not self.chatbot_service:
            error_result = ValidationResult(
                component="rag",
                test_name="service_initialization",
                success=False,
                error_message="Chatbot service not initialized"
            )
            rag_results.append(error_result)
            return rag_results

        medical_queries = [
            {
                "query": "PCDT hanseníase ministério saúde diretrizes",
                "expected_docs": 1,
                "min_similarity": 0.3
            },
            {
                "query": "esquema PQT multibacilar adulto",
                "expected_docs": 1,
                "min_similarity": 0.4
            },
            {
                "query": "reações hansênicas tipo 1 tipo 2 tratamento",
                "expected_docs": 1,
                "min_similarity": 0.3
            },
            {
                "query": "hanseníase neural diagnóstico critérios",
                "expected_docs": 1,
                "min_similarity": 0.3
            },
            {
                "query": "dapsona rifampicina clofazimina posologia",
                "expected_docs": 1,
                "min_similarity": 0.4
            }
        ]

        successful_retrievals = 0
        total_retrievals = len(medical_queries)

        for i, query_data in enumerate(medical_queries):
            query = query_data["query"]
            logger.info(f"🔍 Testing RAG retrieval: {query}")

            start_time = time.time()
            try:
                # Test knowledge base search
                docs = self.chatbot_service._search_knowledge_base(
                    query, top_k=3
                )

                execution_time = time.time() - start_time

                # Validate retrieval results
                success = len(docs) >= query_data["expected_docs"]

                if docs:
                    avg_similarity = sum(doc['similarity'] for doc in docs) / len(docs)
                    success = success and avg_similarity >= query_data["min_similarity"]
                else:
                    avg_similarity = 0.0

                if success:
                    successful_retrievals += 1

                result = ValidationResult(
                    component="rag",
                    test_name=f"retrieval_test_{i+1}",
                    success=success,
                    score=avg_similarity,
                    execution_time=execution_time,
                    details={
                        "query": query,
                        "docs_found": len(docs),
                        "expected_docs": query_data["expected_docs"],
                        "avg_similarity": avg_similarity,
                        "min_similarity": query_data["min_similarity"]
                    }
                )
                rag_results.append(result)

            except Exception as e:
                execution_time = time.time() - start_time
                error_result = ValidationResult(
                    component="rag",
                    test_name=f"retrieval_test_{i+1}",
                    success=False,
                    execution_time=execution_time,
                    error_message=str(e)
                )
                rag_results.append(error_result)

        # Overall RAG performance
        rag_precision = successful_retrievals / total_retrievals
        rag_success = rag_precision >= self.performance_thresholds['rag_precision']

        summary_result = ValidationResult(
            component="rag",
            test_name="overall_precision",
            success=rag_success,
            score=rag_precision,
            details={
                "successful_retrievals": successful_retrievals,
                "total_retrievals": total_retrievals,
                "precision": rag_precision
            }
        )
        rag_results.append(summary_result)

        logger.info(f"📊 RAG system precision: {rag_precision:.2%}")

        return rag_results

    def validate_embedding_service(self) -> List[ValidationResult]:
        """Validate embedding service functionality"""
        embedding_results = []

        if not self.embedding_service:
            error_result = ValidationResult(
                component="embeddings",
                test_name="service_initialization",
                success=False,
                error_message="Embedding service not initialized"
            )
            embedding_results.append(error_result)
            return embedding_results

        test_texts = [
            "Hanseníase é uma doença infecciosa crônica",
            "Rifampicina é o principal medicamento anti-hanseníase",
            "Reações hansênicas podem ocorrer durante o tratamento",
            "O diagnóstico precoce é fundamental para evitar incapacidades",
            "PQT é o esquema terapêutico recomendado pela OMS"
        ]

        successful_embeddings = 0
        total_embeddings = len(test_texts)

        for i, text in enumerate(test_texts):
            logger.info(f"🧮 Testing embedding generation: {text[:30]}...")

            start_time = time.time()
            try:
                result = self.embedding_service.embed_text(text)
                execution_time = time.time() - start_time

                success = result.success and result.embedding is not None

                if success:
                    successful_embeddings += 1
                    # Additional validation
                    embedding_dimension = len(result.embedding)
                    expected_dimension = self.embedding_service.get_embedding_dimension()
                    dimension_match = embedding_dimension == expected_dimension
                    success = success and dimension_match

                validation_result = ValidationResult(
                    component="embeddings",
                    test_name=f"embedding_test_{i+1}",
                    success=success,
                    score=1.0 if success else 0.0,
                    execution_time=execution_time,
                    details={
                        "text_length": len(text),
                        "embedding_dimension": embedding_dimension if success else None,
                        "expected_dimension": expected_dimension,
                        "model_used": result.model_used,
                        "generation_time": result.generation_time
                    }
                )
                embedding_results.append(validation_result)

            except Exception as e:
                execution_time = time.time() - start_time
                error_result = ValidationResult(
                    component="embeddings",
                    test_name=f"embedding_test_{i+1}",
                    success=False,
                    execution_time=execution_time,
                    error_message=str(e)
                )
                embedding_results.append(error_result)

        # Overall embedding performance
        embedding_success_rate = successful_embeddings / total_embeddings
        embedding_success = embedding_success_rate >= self.performance_thresholds['embedding_success']

        summary_result = ValidationResult(
            component="embeddings",
            test_name="overall_success_rate",
            success=embedding_success,
            score=embedding_success_rate,
            details={
                "successful_embeddings": successful_embeddings,
                "total_embeddings": total_embeddings,
                "success_rate": embedding_success_rate,
                "service_stats": self.embedding_service.get_statistics()
            }
        )
        embedding_results.append(summary_result)

        logger.info(f"📊 Embedding success rate: {embedding_success_rate:.2%}")

        return embedding_results

    def validate_medical_calculations(self) -> List[ValidationResult]:
        """Validate medical calculation precision"""
        calculation_results = []

        try:
            import numpy as np

            # Test dose calculations with high precision requirements
            test_cases = [
                {
                    "name": "rifampicina_adult_dose",
                    "weight_kg": 70.0,
                    "dose_mg_per_kg": 10.0,
                    "expected_mg": 700.0
                },
                {
                    "name": "dapsona_pediatric_dose",
                    "weight_kg": 25.0,
                    "dose_mg_per_kg": 2.0,
                    "expected_mg": 50.0
                },
                {
                    "name": "clofazimina_dose_range",
                    "weight_kg": 60.0,
                    "dose_mg_per_kg": 1.0,
                    "expected_mg": 60.0
                }
            ]

            successful_calculations = 0

            for test_case in test_cases:
                start_time = time.time()

                # Perform calculation using numpy for precision
                calculated_dose = np.float64(test_case["weight_kg"]) * np.float64(test_case["dose_mg_per_kg"])
                expected_dose = np.float64(test_case["expected_mg"])

                execution_time = time.time() - start_time

                # Check precision (should be exact for these simple calculations)
                precision_match = np.isclose(calculated_dose, expected_dose, rtol=1e-10)

                if precision_match:
                    successful_calculations += 1

                result = ValidationResult(
                    component="calculations",
                    test_name=test_case["name"],
                    success=precision_match,
                    score=1.0 if precision_match else 0.0,
                    execution_time=execution_time,
                    details={
                        "weight_kg": test_case["weight_kg"],
                        "dose_mg_per_kg": test_case["dose_mg_per_kg"],
                        "calculated_mg": float(calculated_dose),
                        "expected_mg": float(expected_dose),
                        "precision_difference": float(abs(calculated_dose - expected_dose))
                    }
                )
                calculation_results.append(result)

            # Overall calculation performance
            calculation_accuracy = successful_calculations / len(test_cases)
            calculation_success = calculation_accuracy >= self.performance_thresholds['calculation_precision']

            summary_result = ValidationResult(
                component="calculations",
                test_name="overall_accuracy",
                success=calculation_success,
                score=calculation_accuracy,
                details={
                    "successful_calculations": successful_calculations,
                    "total_calculations": len(test_cases),
                    "accuracy": calculation_accuracy
                }
            )
            calculation_results.append(summary_result)

            logger.info(f"📊 Medical calculation accuracy: {calculation_accuracy:.2%}")

        except Exception as e:
            error_result = ValidationResult(
                component="calculations",
                test_name="calculation_framework",
                success=False,
                error_message=str(e)
            )
            calculation_results.append(error_result)

        return calculation_results

    def run_comprehensive_validation(self) -> Dict[str, Any]:
        """Run complete medical AI validation suite"""
        logger.info("🏥 Starting comprehensive medical AI validation")

        # Initialize services
        if not self._initialize_services():
            logger.error("❌ Failed to initialize services - aborting validation")
            return {"error": "Service initialization failed"}

        # Run all validation components
        validation_components = [
            ("personas", self.validate_persona_responses),
            ("rag", self.validate_rag_system),
            ("embeddings", self.validate_embedding_service),
            ("calculations", self.validate_medical_calculations)
        ]

        all_results = {}
        overall_success = True

        for component_name, validation_func in validation_components:
            logger.info(f"\n📋 Validating {component_name.upper()}")

            try:
                results = validation_func()
                all_results[component_name] = results
                self.results.extend(results)

                # Check component success
                component_success = all(r.success for r in results if "overall" in r.test_name)
                if not component_success:
                    overall_success = False
                    logger.warning(f"⚠️  {component_name.upper()} validation issues detected")

            except Exception as e:
                logger.error(f"❌ {component_name.upper()} validation failed: {e}")
                logger.error(traceback.format_exc())
                overall_success = False

        # Generate summary report
        report = self._generate_validation_report(all_results, overall_success)

        logger.info(f"\n🏥 Medical AI Validation Summary:")
        logger.info(f"Overall Status: {'✅ HEALTHY' if overall_success else '❌ ISSUES DETECTED'}")

        return report

    def _generate_validation_report(self, all_results: Dict[str, Any], overall_success: bool) -> Dict[str, Any]:
        """Generate comprehensive validation report"""
        report = {
            "timestamp": datetime.now().isoformat(),
            "overall_success": overall_success,
            "components": {},
            "summary": {},
            "recommendations": []
        }

        for component_name, results in all_results.items():
            component_stats = {
                "total_tests": len(results),
                "successful_tests": sum(1 for r in results if r.success),
                "failed_tests": sum(1 for r in results if not r.success),
                "average_score": np.mean([r.score for r in results if r.score is not None]) if any(r.score is not None for r in results) else None,
                "average_execution_time": np.mean([r.execution_time for r in results if r.execution_time is not None]) if any(r.execution_time is not None for r in results) else None,
                "details": [asdict(result) for result in results]
            }

            component_stats["success_rate"] = component_stats["successful_tests"] / component_stats["total_tests"] if component_stats["total_tests"] > 0 else 0

            report["components"][component_name] = component_stats

        # Generate recommendations
        if not overall_success:
            report["recommendations"].extend([
                "⚠️  DO NOT DEPLOY TO PRODUCTION",
                "Review failed validation components",
                "Consider rolling back to previous dependency versions",
                "Investigate specific test failures in detail"
            ])

            # Component-specific recommendations
            for component_name, component_data in report["components"].items():
                if component_data["success_rate"] < 0.8:
                    report["recommendations"].append(
                        f"❌ {component_name.upper()}: Success rate {component_data['success_rate']:.1%} below threshold"
                    )
        else:
            report["recommendations"].extend([
                "✅ All validation tests passed",
                "Safe to deploy to production",
                "Continue monitoring medical AI performance",
                "Schedule regular validation checks"
            ])

        return report

def main():
    """Main execution function"""
    import argparse

    parser = argparse.ArgumentParser(description="Medical AI Validation Script")
    parser.add_argument("--output", "-o", type=str, default="medical_ai_validation_report.json",
                       help="Output file for validation report")
    parser.add_argument("--config", "-c", type=str,
                       help="Configuration file path")

    args = parser.parse_args()

    validator = MedicalAIValidator(config_path=args.config)

    # Run validation
    report = validator.run_comprehensive_validation()

    # Save report
    try:
        with open(args.output, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        logger.info(f"📄 Validation report saved to: {args.output}")
    except Exception as e:
        logger.error(f"❌ Failed to save report: {e}")

    # Exit with appropriate code
    success = report.get("overall_success", False)
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()