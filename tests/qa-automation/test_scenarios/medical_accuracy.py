# -*- coding: utf-8 -*-
"""
Medical Accuracy Tests - Testes de Precisão Científica
======================================================

Cenário que valida a precisão científica das respostas médicas,
consistência das personas e qualidade do conteúdo educacional.

Migrado de:
- tests/integration/test_scientific_validation.py
- tests/integration/test_persona_coherence.py
- tests/integration/test_medical_protocols.py

Autor: Sistema QA Roteiro de Dispensação
Data: 30/08/2025
"""

import asyncio
import aiohttp
import json
import time
import logging
import re
from datetime import datetime
from typing import Dict, List, Any, Optional

logger = logging.getLogger('medical_accuracy')

class MedicalAccuracyTests:
    """Testes de precisão científica e médica"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.api_base_url = config["api_base_url"]
        self.timeout = config["timeout"]
        
        # Base de conhecimento médico para validação
        self.medical_knowledge_base = {
            "rifampicina_dose": {
                "keywords": ["600mg", "600 mg", "duas cápsulas", "2 x 300mg", "mensal", "adulto"],
                "forbidden": ["400mg", "800mg", "diário", "semanal"]
            },
            "pqt_u_protocol": {
                "keywords": ["pqt-u", "supervisionada", "mensal", "12 doses", "rifampicina", "dapsona"],
                "forbidden": ["pqt-mb", "diário", "6 doses"]
            },
            "clofazimina_effects": {
                "keywords": ["pigmentação", "escura", "pele", "reversível", "gradual"],
                "forbidden": ["permanente", "branca", "rápida"]
            },
            "rifampicina_urine": {
                "keywords": ["laranja", "normal", "esperado", "temporário", "rifampicina"],
                "forbidden": ["perigoso", "anormal", "vermelho", "verde"]
            }
        }
        
        # Resultados
        self.results = {
            "start_time": datetime.utcnow(),
            "passed": 0,
            "total": 0,
            "details": [],
            "status": "pending"
        }
    
    async def run_tests(self) -> Dict[str, Any]:
        """Executa todos os testes de precisão médica"""
        logger.info("🔬 Iniciando testes de precisão médica...")
        
        # Lista de testes médicos
        test_methods = [
            ("scientific_accuracy", self._test_scientific_accuracy),
            ("persona_consistency", self._test_persona_consistency),
            ("medical_terminology", self._test_medical_terminology),
            ("dosage_protocols", self._test_dosage_protocols),
            ("contraindications", self._test_contraindications),
            ("side_effects", self._test_side_effects),
            ("patient_education", self._test_patient_education),
            ("scope_detection", self._test_scope_detection),
            ("citation_accuracy", self._test_citation_accuracy),
            ("empathy_validation", self._test_empathy_validation)
        ]
        
        # Executar testes
        for test_name, test_method in test_methods:
            try:
                logger.info(f"🔬 Executando: {test_name}")
                result = await test_method()
                
                self.results["details"].append({
                    "name": test_name,
                    "passed": result["passed"],
                    "duration": result["duration"],
                    "error": result.get("error"),
                    "details": result.get("details", ""),
                    "scientific_score": result.get("scientific_score", 0)
                })
                
                if result["passed"]:
                    self.results["passed"] += 1
                    logger.info(f"✅ {test_name}: PASSOU ({result['duration']:.2f}s)")
                else:
                    logger.error(f"❌ {test_name}: FALHOU - {result.get('error')}")
                
                self.results["total"] += 1
                
            except Exception as e:
                logger.error(f"💥 Erro crítico em {test_name}: {e}")
                self.results["details"].append({
                    "name": test_name,
                    "passed": False,
                    "duration": 0,
                    "error": str(e),
                    "error_type": "CriticalError"
                })
                self.results["total"] += 1
        
        # Calcular resultado final
        success_rate = (self.results["passed"] / self.results["total"]) * 100 if self.results["total"] > 0 else 0
        self.results["success_rate"] = success_rate
        self.results["status"] = "success" if success_rate >= 85 else "failure"  # Padrão mais alto para medicina
        self.results["end_time"] = datetime.utcnow()
        self.results["execution_time"] = (self.results["end_time"] - self.results["start_time"]).total_seconds()
        
        logger.info(f"🏁 Testes médicos concluídos: {self.results['passed']}/{self.results['total']} ({success_rate:.1f}%)")
        return self.results
    
    async def _test_scientific_accuracy(self) -> Dict[str, Any]:
        """Testa precisão científica das respostas"""
        start_time = time.time()
        
        scientific_questions = [
            {
                "question": "Qual a dose de rifampicina para adultos com mais de 50kg?",
                "persona": "dr_gasnelio",
                "knowledge_key": "rifampicina_dose",
                "min_score": 80
            },
            {
                "question": "Explique o protocolo PQT-U para hanseníase paucibacilar",
                "persona": "dr_gasnelio", 
                "knowledge_key": "pqt_u_protocol",
                "min_score": 85
            },
            {
                "question": "Por que a urina fica laranja com rifampicina?",
                "persona": "ga",
                "knowledge_key": "rifampicina_urine",
                "min_score": 75
            }
        ]
        
        total_score = 0
        passed_questions = 0
        failed_details = []
        
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=self.timeout)) as session:
            for question_data in scientific_questions:
                try:
                    url = f"{self.api_base_url}/api/chat"
                    payload = {
                        "message": question_data["question"],
                        "persona": question_data["persona"],
                        "user_id": "scientific_accuracy_test"
                    }
                    
                    headers = {"Content-Type": "application/json"}
                    async with session.post(url, json=payload, headers=headers) as response:
                        if response.status == 200:
                            data = await response.json()
                            response_text = data.get("response", "")
                            
                            # Avaliar precisão científica
                            score = self._evaluate_scientific_accuracy(
                                response_text, question_data["knowledge_key"]
                            )
                            total_score += score
                            
                            if score >= question_data["min_score"]:
                                passed_questions += 1
                            else:
                                failed_details.append(f"Q: {question_data['question'][:50]}... Score: {score}")
                        else:
                            failed_details.append(f"HTTP {response.status} para pergunta científica")
                
                except Exception as e:
                    failed_details.append(f"Erro: {str(e)}")
                
                await asyncio.sleep(0.5)  # Rate limiting
        
        duration = time.time() - start_time
        avg_score = total_score / len(scientific_questions) if scientific_questions else 0
        success_rate = (passed_questions / len(scientific_questions)) * 100
        
        return {
            "passed": success_rate >= 70 and avg_score >= 75,
            "duration": duration,
            "scientific_score": avg_score,
            "details": f"Questões aprovadas: {passed_questions}/{len(scientific_questions)}, Score médio: {avg_score:.1f}",
            "error": f"Falhas: {', '.join(failed_details)}" if failed_details else None
        }
    
    def _evaluate_scientific_accuracy(self, response: str, knowledge_key: str) -> float:
        """Avalia a precisão científica de uma resposta"""
        if knowledge_key not in self.medical_knowledge_base:
            return 50.0  # Score neutro se não temos base de conhecimento
        
        knowledge = self.medical_knowledge_base[knowledge_key]
        response_lower = response.lower()
        
        # Pontuação por keywords corretas
        keyword_score = 0
        for keyword in knowledge["keywords"]:
            if keyword.lower() in response_lower:
                keyword_score += 10
        
        # Penalização por informações incorretas
        penalty = 0
        for forbidden in knowledge["forbidden"]:
            if forbidden.lower() in response_lower:
                penalty += 15
        
        # Score base para resposta existente e relevante
        base_score = 30 if len(response) > 20 else 0
        
        final_score = min(100, max(0, base_score + keyword_score - penalty))
        return final_score
    
    async def _test_persona_consistency(self) -> Dict[str, Any]:
        """Testa consistência entre personas"""
        start_time = time.time()
        
        consistency_questions = [
            "Explique sobre hanseníase para um paciente",
            "Quais são os medicamentos do tratamento?",
            "Como lidar com os efeitos colaterais?"
        ]
        
        persona_responses = {"dr_gasnelio": [], "ga": []}
        consistency_scores = []
        
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=self.timeout)) as session:
            for question in consistency_questions:
                for persona in ["dr_gasnelio", "ga"]:
                    try:
                        url = f"{self.api_base_url}/api/chat"
                        payload = {
                            "message": question,
                            "persona": persona,
                            "user_id": f"consistency_test_{persona}"
                        }
                        
                        headers = {"Content-Type": "application/json"}
                        async with session.post(url, json=payload, headers=headers) as response:
                            if response.status == 200:
                                data = await response.json()
                                response_text = data.get("response", "")
                                persona_responses[persona].append(response_text)
                            else:
                                persona_responses[persona].append("")
                    
                    except Exception:
                        persona_responses[persona].append("")
                    
                    await asyncio.sleep(0.3)
                
                # Avaliar consistência para esta pergunta
                if persona_responses["dr_gasnelio"][-1] and persona_responses["ga"][-1]:
                    consistency_score = self._evaluate_persona_consistency(
                        persona_responses["dr_gasnelio"][-1],
                        persona_responses["ga"][-1]
                    )
                    consistency_scores.append(consistency_score)
        
        duration = time.time() - start_time
        avg_consistency = sum(consistency_scores) / len(consistency_scores) if consistency_scores else 0
        
        return {
            "passed": avg_consistency >= 70,
            "duration": duration,
            "details": f"Consistência média: {avg_consistency:.1f}%, Perguntas testadas: {len(consistency_scores)}",
            "error": None if avg_consistency >= 70 else "Inconsistência detectada entre personas"
        }
    
    def _evaluate_persona_consistency(self, dr_gasnelio_response: str, ga_response: str) -> float:
        """Avalia consistência entre respostas das personas"""
        # Dr. Gasnelio deve ser mais técnico, Gá mais empático
        
        # Indicators técnicos (esperados em Dr. Gasnelio)
        technical_indicators = ["dose", "mg", "protocolo", "estudo", "pesquisa", "tese", "cientificamente"]
        # Indicators empáticos (esperados em Gá)
        empathy_indicators = ["compreendo", "normal", "não se preocupe", "vou explicar", "tranquilo", "cuidado"]
        
        dr_technical_score = sum(1 for indicator in technical_indicators 
                               if indicator in dr_gasnelio_response.lower()) / len(technical_indicators) * 100
        
        ga_empathy_score = sum(1 for indicator in empathy_indicators 
                             if indicator in ga_response.lower()) / len(empathy_indicators) * 100
        
        # As respostas devem ser diferentes (não idênticas)
        similarity_penalty = 20 if dr_gasnelio_response == ga_response else 0
        
        # Score final baseado na diferenciação adequada
        consistency_score = (dr_technical_score + ga_empathy_score) / 2 - similarity_penalty
        
        return max(0, min(100, consistency_score))
    
    async def _test_medical_terminology(self) -> Dict[str, Any]:
        """Testa uso correto de terminologia médica"""
        start_time = time.time()
        
        terminology_questions = [
            {
                "question": "O que é hanseníase paucibacilar?",
                "expected_terms": ["paucibacilar", "bacilo", "hansen", "mycobacterium"],
                "persona": "dr_gasnelio"
            },
            {
                "question": "Qual a diferença entre PQT-U e PQT-MB?",
                "expected_terms": ["pqt-u", "pqt-mb", "paucibacilar", "multibacilar"],
                "persona": "dr_gasnelio"
            }
        ]
        
        terminology_scores = []
        
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=self.timeout)) as session:
            for question_data in terminology_questions:
                try:
                    url = f"{self.api_base_url}/api/chat"
                    payload = {
                        "message": question_data["question"],
                        "persona": question_data["persona"],
                        "user_id": "terminology_test"
                    }
                    
                    headers = {"Content-Type": "application/json"}
                    async with session.post(url, json=payload, headers=headers) as response:
                        if response.status == 200:
                            data = await response.json()
                            response_text = data.get("response", "").lower()
                            
                            # Calcular score de terminologia
                            terms_found = sum(1 for term in question_data["expected_terms"] 
                                            if term.lower() in response_text)
                            score = (terms_found / len(question_data["expected_terms"])) * 100
                            terminology_scores.append(score)
                        else:
                            terminology_scores.append(0)
                
                except Exception:
                    terminology_scores.append(0)
        
        duration = time.time() - start_time
        avg_terminology_score = sum(terminology_scores) / len(terminology_scores) if terminology_scores else 0
        
        return {
            "passed": avg_terminology_score >= 60,
            "duration": duration,
            "details": f"Score terminologia médica: {avg_terminology_score:.1f}%",
            "error": None if avg_terminology_score >= 60 else "Terminologia médica inadequada"
        }
    
    async def _test_dosage_protocols(self) -> Dict[str, Any]:
        """Testa precisão dos protocolos de dosagem"""
        start_time = time.time()
        
        dosage_questions = [
            {
                "question": "Qual a dose de rifampicina para adultos acima de 50kg?",
                "expected_values": ["600mg", "600 mg", "duas cápsulas de 300mg"],
                "forbidden_values": ["400mg", "800mg", "300mg"]
            },
            {
                "question": "Quantas doses tem o tratamento PQT-U?",
                "expected_values": ["12 doses", "doze doses", "12"],
                "forbidden_values": ["6 doses", "24 doses", "18 doses"]
            }
        ]
        
        dosage_accuracy = []
        
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=self.timeout)) as session:
            for question_data in dosage_questions:
                try:
                    url = f"{self.api_base_url}/api/chat"
                    payload = {
                        "message": question_data["question"],
                        "persona": "dr_gasnelio",
                        "user_id": "dosage_test"
                    }
                    
                    headers = {"Content-Type": "application/json"}
                    async with session.post(url, json=payload, headers=headers) as response:
                        if response.status == 200:
                            data = await response.json()
                            response_text = data.get("response", "").lower()
                            
                            # Verificar valores corretos
                            correct_values = sum(1 for value in question_data["expected_values"] 
                                               if value.lower() in response_text)
                            
                            # Penalizar valores incorretos
                            incorrect_values = sum(1 for value in question_data["forbidden_values"] 
                                                 if value.lower() in response_text)
                            
                            # Score baseado em acertos menos erros
                            score = max(0, (correct_values - incorrect_values * 2) / len(question_data["expected_values"]) * 100)
                            dosage_accuracy.append(score)
                        else:
                            dosage_accuracy.append(0)
                
                except Exception:
                    dosage_accuracy.append(0)
        
        duration = time.time() - start_time
        avg_dosage_accuracy = sum(dosage_accuracy) / len(dosage_accuracy) if dosage_accuracy else 0
        
        return {
            "passed": avg_dosage_accuracy >= 75,
            "duration": duration,
            "details": f"Precisão dosagem: {avg_dosage_accuracy:.1f}%",
            "error": None if avg_dosage_accuracy >= 75 else "Imprecisões em protocolos de dosagem"
        }
    
    async def _test_contraindications(self) -> Dict[str, Any]:
        """Testa conhecimento sobre contraindicações"""
        start_time = time.time()
        
        # Teste simples de contraindicações
        question = "Quais as principais contraindicações para o tratamento da hanseníase?"
        
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=self.timeout)) as session:
            try:
                url = f"{self.api_base_url}/api/chat"
                payload = {
                    "message": question,
                    "persona": "dr_gasnelio",
                    "user_id": "contraindications_test"
                }
                
                headers = {"Content-Type": "application/json"}
                async with session.post(url, json=payload, headers=headers) as response:
                    duration = time.time() - start_time
                    
                    if response.status == 200:
                        data = await response.json()
                        response_text = data.get("response", "").lower()
                        
                        # Verificar menção de conceitos relevantes
                        relevant_terms = ["alergia", "hipersensibilidade", "gravidez", "hepatopatia", "contraindicação"]
                        terms_mentioned = sum(1 for term in relevant_terms if term in response_text)
                        
                        # Verificar se a resposta é substancial
                        substantial_response = len(response_text) > 50
                        
                        return {
                            "passed": terms_mentioned >= 2 and substantial_response,
                            "duration": duration,
                            "details": f"Termos relevantes mencionados: {terms_mentioned}/{len(relevant_terms)}",
                            "error": None if terms_mentioned >= 2 else "Conhecimento insuficiente sobre contraindicações"
                        }
                    else:
                        return {
                            "passed": False,
                            "duration": duration,
                            "error": f"HTTP {response.status}"
                        }
            
            except Exception as e:
                return {
                    "passed": False,
                    "duration": time.time() - start_time,
                    "error": str(e)
                }
    
    async def _test_side_effects(self) -> Dict[str, Any]:
        """Testa conhecimento sobre efeitos colaterais"""
        start_time = time.time()
        
        side_effects_question = "Quais os principais efeitos colaterais da rifampicina?"
        
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=self.timeout)) as session:
            try:
                url = f"{self.api_base_url}/api/chat"
                payload = {
                    "message": side_effects_question,
                    "persona": "dr_gasnelio",
                    "user_id": "side_effects_test"
                }
                
                headers = {"Content-Type": "application/json"}
                async with session.post(url, json=payload, headers=headers) as response:
                    duration = time.time() - start_time
                    
                    if response.status == 200:
                        data = await response.json()
                        response_text = data.get("response", "").lower()
                        
                        # Efeitos colaterais conhecidos da rifampicina
                        known_effects = ["urina laranja", "laranja", "hepatotoxicidade", "náusea", "vômito"]
                        effects_mentioned = sum(1 for effect in known_effects if effect in response_text)
                        
                        return {
                            "passed": effects_mentioned >= 1,
                            "duration": duration,
                            "details": f"Efeitos colaterais mencionados: {effects_mentioned}/{len(known_effects)}",
                            "error": None if effects_mentioned >= 1 else "Efeitos colaterais não mencionados adequadamente"
                        }
                    else:
                        return {
                            "passed": False,
                            "duration": duration,
                            "error": f"HTTP {response.status}"
                        }
            
            except Exception as e:
                return {
                    "passed": False,
                    "duration": time.time() - start_time,
                    "error": str(e)
                }
    
    async def _test_patient_education(self) -> Dict[str, Any]:
        """Testa qualidade da educação do paciente"""
        start_time = time.time()
        
        patient_question = "Como devo tomar os remédios para hanseníase?"
        
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=self.timeout)) as session:
            try:
                url = f"{self.api_base_url}/api/chat"
                payload = {
                    "message": patient_question,
                    "persona": "ga",  # Persona empática
                    "user_id": "patient_education_test"
                }
                
                headers = {"Content-Type": "application/json"}
                async with session.post(url, json=payload, headers=headers) as response:
                    duration = time.time() - start_time
                    
                    if response.status == 200:
                        data = await response.json()
                        response_text = data.get("response", "").lower()
                        
                        # Critérios de boa educação do paciente
                        education_criteria = [
                            "como tomar" in response_text,
                            "importante" in response_text or "necessário" in response_text,
                            len(response_text) > 100,  # Resposta substancial
                            "medicamento" in response_text or "remédio" in response_text,
                            any(word in response_text for word in ["regularmente", "corretamente", "seguir"])
                        ]
                        
                        criteria_met = sum(criteria_met for criteria_met in education_criteria)
                        score = (criteria_met / len(education_criteria)) * 100
                        
                        return {
                            "passed": score >= 60,
                            "duration": duration,
                            "details": f"Critérios educacionais atendidos: {criteria_met}/{len(education_criteria)} ({score:.1f}%)",
                            "error": None if score >= 60 else "Qualidade educacional insuficiente"
                        }
                    else:
                        return {
                            "passed": False,
                            "duration": duration,
                            "error": f"HTTP {response.status}"
                        }
            
            except Exception as e:
                return {
                    "passed": False,
                    "duration": time.time() - start_time,
                    "error": str(e)
                }
    
    async def _test_scope_detection(self) -> Dict[str, Any]:
        """Testa detecção de escopo (perguntas dentro/fora do domínio)"""
        start_time = time.time()
        
        scope_tests = [
            {"question": "Como tratar diabetes?", "expected_scope": False},  # Fora do escopo
            {"question": "Qual o tratamento para hanseníase?", "expected_scope": True},  # Dentro do escopo
            {"question": "Receita de bolo de chocolate", "expected_scope": False}  # Completamente fora
        ]
        
        scope_accuracy = []
        
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=self.timeout)) as session:
            for test_case in scope_tests:
                try:
                    # Usar endpoint de scope se existir
                    url = f"{self.api_base_url}/api/scope"
                    payload = {"question": test_case["question"]}
                    
                    headers = {"Content-Type": "application/json"}
                    async with session.post(url, json=payload, headers=headers) as response:
                        if response.status == 200:
                            data = await response.json()
                            detected_in_scope = data.get("in_scope", True)  # Default true se não detectar
                            
                            # Verificar se a detecção está correta
                            correct_detection = detected_in_scope == test_case["expected_scope"]
                            scope_accuracy.append(1 if correct_detection else 0)
                        else:
                            # Se endpoint não existe, tentar via chat e analisar resposta
                            chat_url = f"{self.api_base_url}/api/chat"
                            chat_payload = {
                                "message": test_case["question"],
                                "persona": "ga",
                                "user_id": "scope_test"
                            }
                            
                            async with session.post(chat_url, json=chat_payload, headers=headers) as chat_response:
                                if chat_response.status == 200:
                                    chat_data = await chat_response.json()
                                    response_text = chat_data.get("response", "").lower()
                                    
                                    # Heurística: respostas fora do escopo geralmente contêm disclaimers
                                    scope_indicators = ["não posso", "fora do", "especializado em", "hanseníase", "roteiro"]
                                    has_scope_indication = any(indicator in response_text for indicator in scope_indicators)
                                    
                                    # Se fora do escopo esperado e tem indicação, ou se dentro do escopo e sem indicação de limitação
                                    if (not test_case["expected_scope"] and "não posso" in response_text) or \
                                       (test_case["expected_scope"] and "hanseníase" in response_text):
                                        scope_accuracy.append(1)
                                    else:
                                        scope_accuracy.append(0)
                                else:
                                    scope_accuracy.append(0)
                
                except Exception:
                    scope_accuracy.append(0)
        
        duration = time.time() - start_time
        avg_scope_accuracy = sum(scope_accuracy) / len(scope_accuracy) if scope_accuracy else 0
        
        return {
            "passed": avg_scope_accuracy >= 0.66,  # 2/3 correto
            "duration": duration,
            "details": f"Precisão detecção de escopo: {avg_scope_accuracy*100:.1f}%",
            "error": None if avg_scope_accuracy >= 0.66 else "Detecção de escopo imprecisa"
        }
    
    async def _test_citation_accuracy(self) -> Dict[str, Any]:
        """Testa se citações e referências são adequadas"""
        start_time = time.time()
        
        citation_question = "Qual a base científica para o protocolo PQT-U?"
        
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=self.timeout)) as session:
            try:
                url = f"{self.api_base_url}/api/chat"
                payload = {
                    "message": citation_question,
                    "persona": "dr_gasnelio",
                    "user_id": "citation_test"
                }
                
                headers = {"Content-Type": "application/json"}
                async with session.post(url, json=payload, headers=headers) as response:
                    duration = time.time() - start_time
                    
                    if response.status == 200:
                        data = await response.json()
                        response_text = data.get("response", "").lower()
                        
                        # Indicadores de citação adequada
                        citation_indicators = [
                            "estudo" in response_text,
                            "pesquisa" in response_text,
                            "tese" in response_text,
                            "baseado" in response_text,
                            "protocolo" in response_text or "diretriz" in response_text
                        ]
                        
                        citations_present = sum(citation_indicators)
                        
                        return {
                            "passed": citations_present >= 2,
                            "duration": duration,
                            "details": f"Indicadores científicos presentes: {citations_present}/{len(citation_indicators)}",
                            "error": None if citations_present >= 2 else "Citações científicas insuficientes"
                        }
                    else:
                        return {
                            "passed": False,
                            "duration": duration,
                            "error": f"HTTP {response.status}"
                        }
            
            except Exception as e:
                return {
                    "passed": False,
                    "duration": time.time() - start_time,
                    "error": str(e)
                }
    
    async def _test_empathy_validation(self) -> Dict[str, Any]:
        """Testa o nível de empatia nas respostas da persona Gá"""
        start_time = time.time()
        
        empathy_question = "Estou com medo de tomar os remédios para hanseníase"
        
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=self.timeout)) as session:
            try:
                url = f"{self.api_base_url}/api/chat"
                payload = {
                    "message": empathy_question,
                    "persona": "ga",
                    "user_id": "empathy_test"
                }
                
                headers = {"Content-Type": "application/json"}
                async with session.post(url, json=payload, headers=headers) as response:
                    duration = time.time() - start_time
                    
                    if response.status == 200:
                        data = await response.json()
                        response_text = data.get("response", "").lower()
                        
                        # Indicadores de empatia
                        empathy_indicators = [
                            "compreendo" in response_text or "entendo" in response_text,
                            "normal" in response_text and "sentir" in response_text,
                            "não precisa" in response_text and "preocupar" in response_text,
                            "vou ajudar" in response_text or "estou aqui" in response_text,
                            "tranquilo" in response_text or "calma" in response_text,
                            len(response_text) > 80  # Resposta substancial para demonstrar cuidado
                        ]
                        
                        empathy_score = sum(empathy_indicators)
                        empathy_percentage = (empathy_score / len(empathy_indicators)) * 100
                        
                        return {
                            "passed": empathy_percentage >= 50,
                            "duration": duration,
                            "details": f"Score de empatia: {empathy_percentage:.1f}%",
                            "error": None if empathy_percentage >= 50 else "Nível de empatia insuficiente"
                        }
                    else:
                        return {
                            "passed": False,
                            "duration": duration,
                            "error": f"HTTP {response.status}"
                        }
            
            except Exception as e:
                return {
                    "passed": False,
                    "duration": time.time() - start_time,
                    "error": str(e)
                }