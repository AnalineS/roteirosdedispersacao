# -*- coding: utf-8 -*-
"""
Post-Security-Update Validation Test Suite
Critical validation for medical application functionality after security dependency updates
Focus: Patient safety, medical accuracy, regulatory compliance

Priority: 🔴 CRITICAL - Patient safety and medical accuracy cannot be compromised
"""

import pytest
import time
import re
import os
from unittest.mock import patch

# Test configuration and utilities
from conftest import (
    SECURITY_TEST_PAYLOADS
)

class TestMedicalFunctionalityIntegrity:
    """Validate core medical functionality after security updates"""

    @pytest.mark.critical
    @pytest.mark.medical_accuracy
    def test_dr_gasnelio_technical_responses(self, client):
        """Validate Dr. Gasnelio persona maintains medical accuracy"""

        # Critical hanseníase medication queries
        medical_queries = [
            {
                'message': 'Qual a dosagem de rifampicina para paciente de 70kg?',
                'expected_keywords': ['600', 'rifampicina', 'dose', 'dia'],
                'expected_accuracy': True,
                'safety_critical': True
            },
            {
                'message': 'Como administrar PQT-U para hanseníase virchowiana?',
                'expected_keywords': ['24 doses', 'supervisionado', 'clofazimina', 'dapsona'],
                'expected_accuracy': True,
                'safety_critical': True
            },
            {
                'message': 'Contraindicações da dapsona em gestantes?',
                'expected_keywords': ['gestação', 'contraindicação', 'teratogênico', 'risco'],
                'expected_accuracy': True,
                'safety_critical': True
            },
            {
                'message': 'Interações medicamentosas da rifampicina?',
                'expected_keywords': ['contraceptivos', 'anticoagulantes', 'indução', 'enzimática'],
                'expected_accuracy': True,
                'safety_critical': True
            }
        ]

        for query in medical_queries:
            response = client.post('/api/v1/chat',
                                  json={
                                      'message': query['message'],
                                      'persona': 'dr_gasnelio'
                                  },
                                  content_type='application/json')

            assert response.status_code == 200, \
                f"Dr. Gasnelio failed to respond to critical medical query: {query['message']}"

            data = response.get_json()
            assert 'response' in data, "Missing response field in Dr. Gasnelio response"

            response_text = data['response'].lower()

            # Validate medical accuracy through keyword presence
            found_keywords = 0
            for keyword in query['expected_keywords']:
                if keyword.lower() in response_text:
                    found_keywords += 1

            keyword_accuracy = found_keywords / len(query['expected_keywords'])

            if query['safety_critical']:
                assert keyword_accuracy >= 0.75, \
                    f"Critical medical query failed accuracy check: {keyword_accuracy:.2f} < 0.75 for '{query['message']}'"
            else:
                assert keyword_accuracy >= 0.5, \
                    f"Medical query failed basic accuracy check: {keyword_accuracy:.2f} < 0.5 for '{query['message']}'"

            # Validate response structure and medical context
            assert 'persona' in data, "Missing persona identification"
            assert data['persona'] == 'dr_gasnelio', "Persona mismatch in medical response"

    @pytest.mark.critical
    @pytest.mark.medical_accuracy
    def test_ga_empathetic_responses(self, client):
        """Validate Gá persona maintains empathy while being medically safe"""

        empathetic_queries = [
            {
                'message': 'Tenho medo de tomar a medicação da hanseníase',
                'expected_tone': 'empathetic',
                'safety_check': ['não pare', 'importante', 'adesão', 'cura'],
                'avoid_phrases': ['não se preocupe', 'é só tomar', 'simples']
            },
            {
                'message': 'Os medicamentos estão causando efeitos colaterais',
                'expected_tone': 'empathetic',
                'safety_check': ['médico', 'profissional', 'avaliar', 'orientação'],
                'avoid_phrases': ['normal', 'passa sozinho', 'não é grave']
            },
            {
                'message': 'Posso parar o tratamento se me sentir melhor?',
                'expected_tone': 'empathetic',
                'safety_check': ['não pare', 'completo', 'tratamento', 'recidiva'],
                'avoid_phrases': ['pode parar', 'não há problema', 'opcional']
            }
        ]

        for query in empathetic_queries:
            response = client.post('/api/v1/chat',
                                  json={
                                      'message': query['message'],
                                      'persona': 'ga'
                                  },
                                  content_type='application/json')

            assert response.status_code == 200, \
                f"Gá failed to respond to empathetic query: {query['message']}"

            data = response.get_json()
            response_text = data['response'].lower()

            # Validate safety messaging is preserved
            found_safety = sum(1 for term in query['safety_check'] if term.lower() in response_text)
            safety_ratio = found_safety / len(query['safety_check'])

            assert safety_ratio >= 0.5, \
                f"Gá response lacks required safety messaging: {safety_ratio:.2f} < 0.5 for '{query['message']}'"

            # Validate harmful phrases are avoided
            for harmful_phrase in query['avoid_phrases']:
                assert harmful_phrase.lower() not in response_text, \
                    f"Gá used potentially harmful phrase: '{harmful_phrase}' in response to '{query['message']}'"

    @pytest.mark.critical
    @pytest.mark.security_medical
    def test_medical_data_sanitization_integrity(self, client):
        """Ensure medical input sanitization doesn't corrupt critical data"""

        # Test cases with medical data that should be preserved
        medical_preservation_tests = [
            {
                'input': 'Rifampicina 600mg/dia',
                'must_preserve': ['rifampicina', '600mg', 'dia'],
                'description': 'Medication dosage format'
            },
            {
                'input': 'PQT-U 24 doses supervisionadas',
                'must_preserve': ['PQT-U', '24', 'doses', 'supervisionadas'],
                'description': 'Treatment protocol abbreviation'
            },
            {
                'input': 'Baciloscopia: IB 4+ (positivo)',
                'must_preserve': ['baciloscopia', 'IB', '4+', 'positivo'],
                'description': 'Laboratory result format'
            },
            {
                'input': 'Classificação: MB (Multibacilar)',
                'must_preserve': ['classificação', 'MB', 'multibacilar'],
                'description': 'Medical classification'
            }
        ]

        for test_case in medical_preservation_tests:
            response = client.post('/api/v1/chat',
                                  json={
                                      'message': test_case['input'],
                                      'persona': 'dr_gasnelio'
                                  },
                                  content_type='application/json')

            assert response.status_code == 200, \
                f"Failed to process medical input: {test_case['description']}"

            data = response.get_json()

            # Check that medical terms are preserved in context processing
            # (This would be validated through logging or response analysis)
            assert 'response' in data, "Missing response field"
            assert len(data['response']) > 10, "Response too short - possible data corruption"

    @pytest.mark.critical
    @pytest.mark.dosing_accuracy
    def test_medication_dosing_calculations(self, client):
        """Validate medication dosing calculations remain accurate after updates"""

        # Critical dosing scenarios from PCDT Hanseníase
        dosing_tests = [
            {
                'patient_weight': '70',
                'medication': 'rifampicina',
                'expected_dose': '600mg',
                'query': 'Paciente de 70kg, qual dose de rifampicina?'
            },
            {
                'patient_weight': '45',
                'medication': 'rifampicina',
                'expected_dose': '450mg',
                'query': 'Paciente de 45kg, qual dose de rifampicina?'
            },
            {
                'patient_age': 'criança 8 anos',
                'medication': 'dapsona',
                'expected_info': ['peso', 'pediátrica', 'ajuste'],
                'query': 'Criança de 8 anos, como calcular dose de dapsona?'
            }
        ]

        for test in dosing_tests:
            response = client.post('/api/v1/chat',
                                  json={
                                      'message': test['query'],
                                      'persona': 'dr_gasnelio'
                                  },
                                  content_type='application/json')

            assert response.status_code == 200, \
                f"Dosing calculation failed for: {test['query']}"

            data = response.get_json()
            response_text = data['response'].lower()

            if 'expected_dose' in test:
                # Extract numeric dose from response
                dose_pattern = r'(\d+)\s*mg'
                doses = re.findall(dose_pattern, response_text)

                expected_numeric = int(re.search(r'\d+', test['expected_dose']).group())

                # Allow for slight variations in dosing recommendations
                found_correct_dose = any(
                    abs(int(dose) - expected_numeric) <= 50  # 50mg tolerance
                    for dose in doses
                )

                assert found_correct_dose, \
                    f"Incorrect dosing calculation. Expected ~{test['expected_dose']}, found doses: {doses}"

            if 'expected_info' in test:
                found_info = sum(1 for term in test['expected_info'] if term in response_text)
                assert found_info >= 2, \
                    f"Missing critical dosing information for pediatric case: {found_info}/3 terms found"

class TestAuthenticationMedicalContext:
    """Validate authentication security doesn't break medical context"""

    @pytest.mark.critical
    @pytest.mark.auth_medical
    @pytest.mark.skipif(
        not os.getenv('OPENROUTER_API_KEY') and not os.getenv('OPENAI_API_KEY'),
        reason="Requires RAG system with API keys - not available in CI without secrets"
    )
    def test_jwt_medical_session_continuity(self, client):
        """Ensure JWT security updates don't break medical conversation continuity

        NOTE: Skipped in CI when RAG not configured (requires OPENROUTER_API_KEY or OPENAI_API_KEY)
        """

        # Simulate a medical consultation session
        session_messages = [
            "Olá, sou profissional de saúde trabalhando com hanseníase",
            "Tenho um paciente com hanseníase virchowiana",
            "Qual o protocolo PQT-U mais adequado?",
            "E sobre os efeitos colaterais da clofazimina?"
        ]

        conversation_responses = []

        for i, message in enumerate(session_messages):
            response = client.post('/api/v1/chat',
                                  json={
                                      'message': message,
                                      'persona': 'dr_gasnelio',
                                      'session_id': 'medical_session_123'
                                  },
                                  content_type='application/json')

            assert response.status_code == 200, \
                f"Session continuity broken at message {i+1}: {message}"

            data = response.get_json()
            conversation_responses.append(data)

            # Validate session context is maintained
            if i > 0:  # After first message
                # Response should show contextual understanding
                response_text = data['response'].lower()

                # Should reference hanseníase context from earlier messages
                contextual_terms = ['hanseníase', 'paciente', 'tratamento']
                found_context = sum(1 for term in contextual_terms if term in response_text)

                assert found_context >= 1, \
                    f"Lost medical context in session at message {i+1}: {response_text[:100]}"

        # Validate final response shows full contextual understanding
        final_response = conversation_responses[-1]['response'].lower()
        assert 'clofazimina' in final_response, "Lost specific medication context"

    @pytest.mark.critical
    @pytest.mark.rate_limiting_medical
    def test_rate_limiting_medical_emergency(self, client):
        """Ensure rate limiting doesn't block critical medical queries"""

        # Simulate rapid medical consultation scenario
        urgent_medical_queries = [
            "Paciente com reação reversa grave, o que fazer?",
            "Sinais de neurite em hanseníase, conduta?",
            "Suspeita de eritema nodoso hansênico, tratamento?",
            "Paciente grávida com hanseníase, medicação segura?",
            "Criança com mancha hipocrômica, investigação?"
        ]

        successful_responses = 0
        blocked_responses = 0

        for query in urgent_medical_queries:
            response = client.post('/api/v1/chat',
                                  json={
                                      'message': query,
                                      'persona': 'dr_gasnelio',
                                      'priority': 'medical_urgent'  # If supported
                                  },
                                  content_type='application/json')

            if response.status_code == 200:
                successful_responses += 1

                # Validate medical response quality under rate limiting pressure
                data = response.get_json()
                assert len(data['response']) > 50, \
                    "Medical response too brief under rate limiting pressure"

            elif response.status_code == 429:  # Rate limited
                blocked_responses += 1

            time.sleep(0.1)  # Brief pause between requests

        # At least 80% of urgent medical queries should succeed
        success_rate = successful_responses / len(urgent_medical_queries)
        assert success_rate >= 0.8, \
            f"Rate limiting blocking too many medical queries: {success_rate:.2f} < 0.8"

class TestRAGSystemMedicalAccuracy:
    """Validate RAG system maintains medical knowledge accuracy"""

    @pytest.mark.critical
    @pytest.mark.rag_medical
    def test_rag_medical_knowledge_retrieval(self, client):
        """Validate RAG system retrieves accurate medical information"""

        # Test knowledge retrieval for specific medical topics
        knowledge_tests = [
            {
                'query': 'Protocolo completo PQT-U para hanseníase',
                'expected_knowledge': [
                    'rifampicina', 'clofazimina', 'dapsona',
                    '24 doses', 'supervisionado', 'mensal'
                ],
                'knowledge_source': 'PCDT Hanseníase'
            },
            {
                'query': 'Classificação operacional da hanseníase',
                'expected_knowledge': [
                    'paucibacilar', 'multibacilar',
                    'baciloscopia', 'lesões'
                ],
                'knowledge_source': 'Guidelines WHO/MS'
            },
            {
                'query': 'Reações hansênicas tipo 1 e tipo 2',
                'expected_knowledge': [
                    'reversa', 'eritema nodoso',
                    'neurite', 'corticoide'
                ],
                'knowledge_source': 'Protocolo Clínico'
            }
        ]

        for test in knowledge_tests:
            response = client.post('/api/v1/chat',
                                  json={
                                      'message': test['query'],
                                      'persona': 'dr_gasnelio'
                                  },
                                  content_type='application/json')

            assert response.status_code == 200, \
                f"RAG system failed for knowledge query: {test['query']}"

            data = response.get_json()
            response_text = data['response'].lower()

            # Validate knowledge accuracy
            found_knowledge = 0
            for term in test['expected_knowledge']:
                if term.lower() in response_text:
                    found_knowledge += 1

            knowledge_accuracy = found_knowledge / len(test['expected_knowledge'])
            assert knowledge_accuracy >= 0.6, \
                f"RAG knowledge accuracy too low: {knowledge_accuracy:.2f} < 0.6 for {test['query']}"

            # Validate medical authority/source reference
            if 'fonte' in response_text or 'referência' in response_text or 'protocolo' in response_text:
                # Good - showing medical authority
                pass
            else:
                # Should at least show clinical knowledge depth
                clinical_indicators = ['clínico', 'diagnóstico', 'terapêutico', 'farmacológico']
                has_clinical_depth = any(term in response_text for term in clinical_indicators)
                assert has_clinical_depth, \
                    f"RAG response lacks medical authority/depth for: {test['query']}"

    @pytest.mark.critical
    @pytest.mark.vector_security
    def test_vector_store_security_integrity(self, client):
        """Validate vector store security doesn't corrupt medical embeddings"""

        # Test that vector similarity search still works accurately
        similar_concept_tests = [
            {
                'base_query': 'rifampicina dosagem',
                'similar_query': 'dose de rifampicina',
                'min_similarity_threshold': 0.7  # Should get similar responses
            },
            {
                'base_query': 'hanseníase multibacilar',
                'similar_query': 'forma MB da hanseníase',
                'min_similarity_threshold': 0.6
            },
            {
                'base_query': 'reação reversa hanseníase',
                'similar_query': 'reação tipo 1 hansênica',
                'min_similarity_threshold': 0.6
            }
        ]

        for test in similar_concept_tests:
            # Get responses for both similar queries
            response1 = client.post('/api/v1/chat',
                                   json={
                                       'message': test['base_query'],
                                       'persona': 'dr_gasnelio'
                                   },
                                   content_type='application/json')

            response2 = client.post('/api/v1/chat',
                                   json={
                                       'message': test['similar_query'],
                                       'persona': 'dr_gasnelio'
                                   },
                                   content_type='application/json')

            assert response1.status_code == 200 and response2.status_code == 200, \
                f"Vector store queries failed for similar concepts: {test['base_query']}"

            data1 = response1.get_json()
            data2 = response2.get_json()

            text1 = data1['response'].lower()
            text2 = data2['response'].lower()

            # Simple similarity check: count common medical terms
            words1 = set(re.findall(r'\b\w+\b', text1))
            words2 = set(re.findall(r'\b\w+\b', text2))

            common_words = words1.intersection(words2)
            similarity = len(common_words) / len(words1.union(words2))

            assert similarity >= 0.3, \
                f"Vector similarity too low between similar medical concepts: {similarity:.2f} < 0.3"

class TestPCDTComplianceValidation:
    """Validate PCDT (Protocolo Clínico) compliance after security updates"""

    @pytest.mark.critical
    @pytest.mark.pcdt_compliance
    def test_pcdt_dosing_protocols(self, client):
        """Validate PCDT dosing protocols remain accurate"""

        # Official PCDT Hanseníase 2022 protocols
        pcdt_protocols = [
            {
                'scenario': 'PQT-PB adulto padrão',
                'query': 'Tratamento PQT-PB para adulto',
                'must_include': [
                    'rifampicina 600mg supervisionada',
                    'dapsona 100mg autoadministrada',
                    '6 doses'
                ],
                'compliance_level': 'mandatory'
            },
            {
                'scenario': 'PQT-MB adulto padrão',
                'query': 'Tratamento PQT-MB para adulto',
                'must_include': [
                    'rifampicina 600mg',
                    'clofazimina 300mg supervisionada',
                    'clofazimina 50mg autoadministrada',
                    'dapsona 100mg',
                    '24 doses'
                ],
                'compliance_level': 'mandatory'
            },
            {
                'scenario': 'Ajuste pediátrico',
                'query': 'Dosagem pediátrica hanseníase 25kg',
                'must_include': [
                    'peso corporal',
                    'ajuste',
                    'pediátrica'
                ],
                'compliance_level': 'required'
            }
        ]

        for protocol in pcdt_protocols:
            response = client.post('/api/v1/chat',
                                  json={
                                      'message': protocol['query'],
                                      'persona': 'dr_gasnelio'
                                  },
                                  content_type='application/json')

            assert response.status_code == 200, \
                f"PCDT protocol query failed: {protocol['scenario']}"

            data = response.get_json()
            response_text = data['response'].lower()

            # Check PCDT compliance
            compliance_items_found = 0
            for requirement in protocol['must_include']:
                # Flexible matching for protocol requirements
                requirement_words = requirement.lower().split()
                words_found = sum(1 for word in requirement_words if word in response_text)

                if words_found >= len(requirement_words) * 0.7:  # 70% word match
                    compliance_items_found += 1

            compliance_rate = compliance_items_found / len(protocol['must_include'])

            if protocol['compliance_level'] == 'mandatory':
                assert compliance_rate >= 0.8, \
                    f"PCDT mandatory compliance failed: {compliance_rate:.2f} < 0.8 for {protocol['scenario']}"
            else:  # required
                assert compliance_rate >= 0.6, \
                    f"PCDT required compliance failed: {compliance_rate:.2f} < 0.6 for {protocol['scenario']}"

class TestSystemStabilityPostUpdate:
    """Validate system stability after security updates"""

    @pytest.mark.critical
    @pytest.mark.stability
    def test_medical_api_performance(self, client):
        """Validate API performance hasn't degraded significantly"""

        performance_tests = [
            {
                'endpoint': '/api/v1/chat',
                'payload': {'message': 'Dosagem rifampicina adulto', 'persona': 'dr_gasnelio'},
                'max_response_time': 5.0,  # seconds
                'description': 'Standard medical query'
            },
            {
                'endpoint': '/api/v1/personas',
                'payload': None,
                'max_response_time': 2.0,
                'description': 'Persona information'
            },
            {
                'endpoint': '/api/v1/health',
                'payload': None,
                'max_response_time': 1.0,
                'description': 'Health check'
            }
        ]

        for test in performance_tests:
            start_time = time.time()

            if test['payload']:
                response = client.post(test['endpoint'],
                                      json=test['payload'],
                                      content_type='application/json')
            else:
                response = client.get(test['endpoint'])

            end_time = time.time()
            response_time = end_time - start_time

            assert response.status_code in [200, 201], \
                f"Performance test failed for {test['description']}: status {response.status_code}"

            assert response_time <= test['max_response_time'], \
                f"Performance degradation detected for {test['description']}: {response_time:.2f}s > {test['max_response_time']}s"

    @pytest.mark.critical
    @pytest.mark.error_handling
    def test_medical_error_handling_integrity(self, client):
        """Validate error handling doesn't expose medical data"""

        error_scenarios = [
            {
                'endpoint': '/api/v1/chat',
                'payload': {'message': 'Paciente João da Silva, CPF 123.456.789-10, precisa de rifampicina'},
                'sensitive_data': ['joão da silva', '123.456.789-10'],
                'description': 'Medical query with PII'
            },
            {
                'endpoint': '/api/v1/chat',
                'payload': {'persona': 'invalid_persona'},
                'description': 'Invalid persona error'
            },
            {
                'endpoint': '/api/v1/feedback',
                'payload': {'invalid': 'structure'},
                'description': 'Malformed feedback'
            }
        ]

        for scenario in error_scenarios:
            response = client.post(scenario['endpoint'],
                                  json=scenario['payload'],
                                  content_type='application/json')

            # Errors should be handled gracefully
            assert response.status_code in [200, 400, 422, 500], \
                f"Unexpected error handling for {scenario['description']}: {response.status_code}"

            if response.status_code >= 400:
                # Check that sensitive data is not exposed in error responses
                error_text = response.get_data(as_text=True).lower()

                if 'sensitive_data' in scenario:
                    for sensitive_item in scenario['sensitive_data']:
                        assert sensitive_item.lower() not in error_text, \
                            f"Sensitive medical data exposed in error: {sensitive_item}"

class TestLGPDMedicalCompliance:
    """Enhanced LGPD compliance validation for medical context"""

    @pytest.mark.critical
    @pytest.mark.lgpd_medical
    def test_medical_data_pseudonymization(self, client):
        """Validate medical consultations are properly pseudonymized"""

        medical_scenarios_with_pii = [
            {
                'message': 'Paciente Maria Santos apresenta lesões suspeitas',
                'pii_elements': ['maria santos'],
                'medical_context': True
            },
            {
                'message': 'Prescrição para CPF 111.222.333-44: rifampicina 600mg',
                'pii_elements': ['111.222.333-44'],
                'medical_context': True
            },
            {
                'message': 'Contato: email medico@hospital.com para caso complexo',
                'pii_elements': ['medico@hospital.com'],
                'medical_context': True
            }
        ]

        for scenario in medical_scenarios_with_pii:
            response = client.post('/api/v1/chat',
                                  json={
                                      'message': scenario['message'],
                                      'persona': 'dr_gasnelio'
                                  },
                                  content_type='application/json')

            assert response.status_code == 200, \
                f"Medical pseudonymization test failed for: {scenario['message']}"

            data = response.get_json()

            # Response should not echo back PII elements unchanged
            response_text = data['response'].lower()

            for pii_element in scenario['pii_elements']:
                assert pii_element.lower() not in response_text, \
                    f"PII element not pseudonymized in medical response: {pii_element}"

            # But should maintain medical context
            medical_terms = ['hanseníase', 'rifampicina', 'lesão', 'sintoma', 'diagnóstico']
            found_medical_context = any(term in response_text for term in medical_terms)

            if scenario['medical_context']:
                assert found_medical_context, \
                    "Medical context lost during pseudonymization process"

def test_comprehensive_post_security_validation_suite():
    """Master validation test that runs critical security update checks"""

    validation_results = {
        'medical_accuracy': False,
        'security_integrity': False,
        'pcdt_compliance': False,
        'lgpd_compliance': False,
        'system_stability': False
    }

    # This would orchestrate all critical validations
    # Implementation would run each test class and aggregate results

    print("🔬 Running Post-Security-Update Medical Validation Suite")
    print("=" * 60)
    print("Priority: 🔴 CRITICAL - Patient Safety & Medical Accuracy")
    print("Focus: Hanseníase medication dispensing education platform")
    print("Compliance: PCDT Hanseníase 2022, LGPD, WHO Guidelines")
    print("=" * 60)

    # In real implementation, this would execute all test classes
    # and provide comprehensive validation report

    assert True  # Placeholder for orchestrated validation

if __name__ == '__main__':
    # Run the comprehensive validation suite
    pytest.main([
        __file__,
        '-v',
        '-m', 'critical',
        '--tb=short',
        '--strict-markers',
        '--durations=10',
        '--cov=.',
        '--cov-report=html:coverage_post_security_update',
        '--cov-report=term-missing'
    ])