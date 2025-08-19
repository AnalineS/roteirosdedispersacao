# -*- coding: utf-8 -*-
"""
Sistema de Cross-Validation entre Personas
==========================================

Implementa validação cruzada entre Dr. Gasnelio (técnico) e Gá (empático)
para detectar inconsistências médicas críticas e garantir coerência nas respostas.

Características:
- Detecção de inconsistências médicas críticas
- Validação de dosagens e protocolos
- Análise de contradições entre personas
- Score de consistência médica
- Alertas para revisão humana

Autor: Sistema de Segurança Roteiro de Dispensação
Data: 2025-08-12
Baseado: Framework QA existente + PCDT Hanseníase 2022
"""

import logging
import re
import json
from datetime import datetime
from typing import Dict, Any, Optional, List, Tuple, Set
from dataclasses import dataclass, asdict
from enum import Enum
import difflib
import math

# Import configurações e sistema QA existente
from app_config import config
try:
    from core.validation.educational_qa_framework import EducationalQAFramework
    QA_FRAMEWORK_AVAILABLE = True
except ImportError:
    QA_FRAMEWORK_AVAILABLE = False

logger = logging.getLogger(__name__)

class InconsistencyType(Enum):
    """Tipos de inconsistência entre personas"""
    DOSAGE_CONTRADICTION = "dosage_contradiction"
    PROTOCOL_MISMATCH = "protocol_mismatch"
    CONTRAINDICATION_CONFLICT = "contraindication_conflict"
    TIMELINE_INCONSISTENCY = "timeline_inconsistency"
    SEVERITY_MISMATCH = "severity_mismatch"
    TERMINOLOGY_CONFUSION = "terminology_confusion"
    FACTUAL_CONTRADICTION = "factual_contradiction"

class ValidationSeverity(Enum):
    """Severidade da inconsistência"""
    CRITICAL = "critical"    # Pode causar dano ao paciente
    HIGH = "high"           # Informação médica incorreta
    MEDIUM = "medium"       # Confusão educacional
    LOW = "low"            # Diferença de estilo apenas

@dataclass
class InconsistencyDetection:
    """Detecção de inconsistência entre personas"""
    inconsistency_type: InconsistencyType
    severity: ValidationSeverity
    dr_gasnelio_content: str
    ga_content: str
    conflicting_elements: List[str]
    description: str
    confidence_score: float  # 0-1
    medical_risk_level: str
    suggested_resolution: str

@dataclass
class CrossValidationResult:
    """Resultado da validação cruzada"""
    consistency_score: float  # 0-100
    inconsistencies: List[InconsistencyDetection]
    validation_passed: bool
    requires_human_review: bool
    persona_agreement_level: str
    medical_accuracy_score: float
    educational_coherence_score: float
    timestamp: str

class MedicalTermExtractor:
    """Extrator de termos médicos para comparação"""
    
    def __init__(self):
        # Termos médicos críticos para hanseníase
        self.critical_terms = {
            'dosages': [
                r'(\d+(?:\.\d+)?)\s*mg(?:/kg)?',
                r'rifampicina\s+(\d+(?:\.\d+)?)\s*mg',
                r'dapsona\s+(\d+(?:\.\d+)?)\s*mg',
                r'clofazimina\s+(\d+(?:\.\d+)?)\s*mg',
                r'(\d+)\s*comprimidos?',
                r'(\d+(?:\.\d+)?)\s*mg/kg'
            ],
            'schedules': [
                r'(\d+)\s*vezes?\s+(?:ao\s+)?dia',
                r'diariamente?',
                r'semanal(?:mente)?',
                r'mensal(?:mente)?',
                r'(\d+)\s*meses?',
                r'(\d+)\s*semanas?',
                r'PQT[- ]?(?:PB|MB)'
            ],
            'contraindications': [
                r'contraindicad[ao]',
                r'não\s+(?:deve|pode)',
                r'evit[ae]r',
                r'cuidado\s+com',
                r'alergia',
                r'hipersensibilidade',
                r'gravidez',
                r'lactação',
                r'hepatopatia',
                r'insuficiência\s+(?:hepática|renal)'
            ],
            'adverse_effects': [
                r'efeitos?\s+(?:adversos?|colaterais?)',
                r'reação\s+adversa',
                r'hepatotoxicidade',
                r'neuropatia',
                r'alteração\s+(?:da\s+)?cor',
                r'urina\s+(?:vermelha|avermelhada)',
                r'Stevens[-\s]Johnson'
            ]
        }
        
        # Compilar padrões regex
        self.compiled_patterns = {}
        for category, patterns in self.critical_terms.items():
            self.compiled_patterns[category] = [re.compile(p, re.IGNORECASE) for p in patterns]
    
    def extract_medical_entities(self, text: str) -> Dict[str, List[str]]:
        """Extrai entidades médicas do texto"""
        entities = {category: [] for category in self.critical_terms.keys()}
        
        for category, patterns in self.compiled_patterns.items():
            for pattern in patterns:
                matches = pattern.findall(text)
                if matches:
                    entities[category].extend([str(m) if isinstance(m, (int, float)) else m for m in matches])
        
        return entities

class CrossPersonaValidator:
    """Validador de consistência entre personas"""
    
    def __init__(self):
        self.term_extractor = MedicalTermExtractor()
        self.qa_framework = None
        
        if QA_FRAMEWORK_AVAILABLE:
            try:
                self.qa_framework = EducationalQAFramework()
            except Exception as e:
                logger.warning(f"Erro ao inicializar QA Framework: {e}")
        
        # Thresholds de validação
        self.validation_thresholds = {
            'consistency_minimum': 70.0,  # Score mínimo para passar
            'critical_inconsistency_limit': 0,  # Nenhuma inconsistência crítica
            'high_inconsistency_limit': 1,     # Máximo 1 inconsistência alta
            'human_review_threshold': 60.0,    # Abaixo disso, revisão humana
            'medical_accuracy_minimum': 80.0   # Score mínimo de precisão médica
        }
        
        # Cache para evitar revalidações
        self.validation_cache = {}
        
        # Estatísticas
        self.validation_stats = {
            'total_validations': 0,
            'passed_validations': 0,
            'critical_inconsistencies': 0,
            'human_reviews_required': 0
        }
    
    def validate_persona_responses(self, 
                                  question: str,
                                  dr_gasnelio_response: str, 
                                  ga_response: str,
                                  context: Dict[str, Any] = None) -> CrossValidationResult:
        """Valida consistência entre respostas das personas"""
        
        start_time = datetime.now()
        self.validation_stats['total_validations'] += 1
        
        try:
            # Gerar hash para cache
            cache_key = self._generate_cache_key(question, dr_gasnelio_response, ga_response)
            if cache_key in self.validation_cache:
                cached_result = self.validation_cache[cache_key]
                logger.debug(f"Usando resultado cached para validação cross-persona")
                return cached_result
            
            # Extrair entidades médicas de ambas as respostas
            dr_gasnelio_entities = self.term_extractor.extract_medical_entities(dr_gasnelio_response)
            ga_entities = self.term_extractor.extract_medical_entities(ga_response)
            
            # Detectar inconsistências
            inconsistencies = []
            
            # 1. Validar dosagens
            dosage_inconsistencies = self._validate_dosages(
                dr_gasnelio_entities['dosages'], 
                ga_entities['dosages'],
                dr_gasnelio_response,
                ga_response
            )
            inconsistencies.extend(dosage_inconsistencies)
            
            # 2. Validar protocolos
            protocol_inconsistencies = self._validate_protocols(
                dr_gasnelio_entities['schedules'],
                ga_entities['schedules'],
                dr_gasnelio_response,
                ga_response
            )
            inconsistencies.extend(protocol_inconsistencies)
            
            # 3. Validar contraindicações
            contraindication_inconsistencies = self._validate_contraindications(
                dr_gasnelio_entities['contraindications'],
                ga_entities['contraindications'],
                dr_gasnelio_response,
                ga_response
            )
            inconsistencies.extend(contraindication_inconsistencies)
            
            # 4. Validar terminologia médica
            terminology_inconsistencies = self._validate_terminology(
                dr_gasnelio_response, ga_response
            )
            inconsistencies.extend(terminology_inconsistencies)
            
            # 5. Validar coerência factual
            factual_inconsistencies = self._validate_factual_consistency(
                dr_gasnelio_response, ga_response, question
            )
            inconsistencies.extend(factual_inconsistencies)
            
            # Calcular scores
            consistency_score = self._calculate_consistency_score(inconsistencies)
            medical_accuracy_score = self._calculate_medical_accuracy_score(
                dr_gasnelio_response, ga_response, inconsistencies
            )
            educational_coherence_score = self._calculate_educational_coherence_score(
                dr_gasnelio_response, ga_response
            )
            
            # Determinar se passou na validação
            validation_passed = self._determine_validation_pass(inconsistencies, consistency_score)
            
            # Determinar se requer revisão humana
            requires_human_review = self._requires_human_review(
                inconsistencies, consistency_score, medical_accuracy_score
            )
            
            # Determinar nível de concordância
            agreement_level = self._determine_agreement_level(consistency_score)
            
            # Atualizar estatísticas
            if validation_passed:
                self.validation_stats['passed_validations'] += 1
            
            critical_count = sum(1 for inc in inconsistencies if inc.severity == ValidationSeverity.CRITICAL)
            self.validation_stats['critical_inconsistencies'] += critical_count
            
            if requires_human_review:
                self.validation_stats['human_reviews_required'] += 1
            
            # Criar resultado
            result = CrossValidationResult(
                consistency_score=consistency_score,
                inconsistencies=inconsistencies,
                validation_passed=validation_passed,
                requires_human_review=requires_human_review,
                persona_agreement_level=agreement_level,
                medical_accuracy_score=medical_accuracy_score,
                educational_coherence_score=educational_coherence_score,
                timestamp=start_time.isoformat()
            )
            
            # Cache do resultado
            self.validation_cache[cache_key] = result
            
            # Log do resultado
            processing_time = (datetime.now() - start_time).total_seconds() * 1000
            logger.info(f"Cross-validation completa: score={consistency_score:.1f}, "
                       f"inconsistencies={len(inconsistencies)}, time={processing_time:.1f}ms")
            
            return result
            
        except Exception as e:
            logger.error(f"Erro na validação cross-persona: {e}")
            # Retornar resultado de fallback
            return CrossValidationResult(
                consistency_score=50.0,  # Score neutro
                inconsistencies=[],
                validation_passed=False,
                requires_human_review=True,
                persona_agreement_level="unknown",
                medical_accuracy_score=50.0,
                educational_coherence_score=50.0,
                timestamp=start_time.isoformat()
            )
    
    def _validate_dosages(self, dr_dosages: List[str], ga_dosages: List[str],
                         dr_response: str, ga_response: str) -> List[InconsistencyDetection]:
        """Valida consistência de dosagens entre personas"""
        inconsistencies = []
        
        # Normalizar dosagens para comparação
        dr_normalized = self._normalize_dosages(dr_dosages)
        ga_normalized = self._normalize_dosages(ga_dosages)
        
        # Comparar dosagens numéricas
        for dr_dose in dr_normalized:
            found_match = False
            for ga_dose in ga_normalized:
                if self._dosages_are_equivalent(dr_dose, ga_dose):
                    found_match = True
                    break
            
            if not found_match and dr_dose and ga_normalized:
                # Dosagem sem correspondência - potencial inconsistência
                inconsistencies.append(InconsistencyDetection(
                    inconsistency_type=InconsistencyType.DOSAGE_CONTRADICTION,
                    severity=ValidationSeverity.CRITICAL,
                    dr_gasnelio_content=dr_response,
                    ga_content=ga_response,
                    conflicting_elements=[f"Dr. Gasnelio: {dr_dose}", f"Gá: {ga_normalized}"],
                    description=f"Dosagem mencionada por Dr. Gasnelio ({dr_dose}) não encontrada na resposta de Gá",
                    confidence_score=0.8,
                    medical_risk_level="alto",
                    suggested_resolution="Revisar protocolos de dosagem e padronizar informações"
                ))
        
        return inconsistencies
    
    def _validate_protocols(self, dr_schedules: List[str], ga_schedules: List[str],
                          dr_response: str, ga_response: str) -> List[InconsistencyDetection]:
        """Valida consistência de protocolos entre personas"""
        inconsistencies = []
        
        # Procurar por menções de PQT-PB vs PQT-MB
        dr_pqt_type = self._extract_pqt_type(dr_response)
        ga_pqt_type = self._extract_pqt_type(ga_response)
        
        if dr_pqt_type and ga_pqt_type and dr_pqt_type != ga_pqt_type:
            inconsistencies.append(InconsistencyDetection(
                inconsistency_type=InconsistencyType.PROTOCOL_MISMATCH,
                severity=ValidationSeverity.CRITICAL,
                dr_gasnelio_content=dr_response,
                ga_content=ga_response,
                conflicting_elements=[f"Dr. Gasnelio: {dr_pqt_type}", f"Gá: {ga_pqt_type}"],
                description=f"Discordância sobre tipo de PQT: Dr. Gasnelio menciona {dr_pqt_type}, Gá menciona {ga_pqt_type}",
                confidence_score=0.9,
                medical_risk_level="crítico",
                suggested_resolution="Verificar classificação da hanseníase e protocolo apropriado"
            ))
        
        return inconsistencies
    
    def _validate_contraindications(self, dr_contraind: List[str], ga_contraind: List[str],
                                  dr_response: str, ga_response: str) -> List[InconsistencyDetection]:
        """Valida consistência de contraindicações"""
        inconsistencies = []
        
        # Detectar menções de gravidez e lactação
        dr_mentions_pregnancy = bool(re.search(r'\b(?:grávidas?|gestantes?|gravidez)\b', dr_response, re.IGNORECASE))
        ga_mentions_pregnancy = bool(re.search(r'\b(?:grávidas?|gestantes?|gravidez)\b', ga_response, re.IGNORECASE))
        
        # Se um menciona gravidez e outro não, pode ser inconsistência
        if dr_mentions_pregnancy and not ga_mentions_pregnancy:
            inconsistencies.append(InconsistencyDetection(
                inconsistency_type=InconsistencyType.CONTRAINDICATION_CONFLICT,
                severity=ValidationSeverity.HIGH,
                dr_gasnelio_content=dr_response,
                ga_content=ga_response,
                conflicting_elements=["Menção de gravidez"],
                description="Dr. Gasnelio menciona aspectos relacionados à gravidez, mas Gá não aborda",
                confidence_score=0.7,
                medical_risk_level="médio",
                suggested_resolution="Padronizar informações sobre uso em gravidez e lactação"
            ))
        
        return inconsistencies
    
    def _validate_terminology(self, dr_response: str, ga_response: str) -> List[InconsistencyDetection]:
        """Valida uso de terminologia médica"""
        inconsistencies = []
        
        # Termos que devem ser consistentes
        critical_terms = [
            ('hanseníase', 'lepra'),
            ('PQT-U', 'poliquimioterapia única'),
            ('rifampicina', 'RMP'),
            ('dapsona', 'DDS'),
            ('clofazimina', 'CFZ')
        ]
        
        for term1, term2 in critical_terms:
            dr_uses_term1 = bool(re.search(rf'\b{re.escape(term1)}\b', dr_response, re.IGNORECASE))
            dr_uses_term2 = bool(re.search(rf'\b{re.escape(term2)}\b', dr_response, re.IGNORECASE))
            ga_uses_term1 = bool(re.search(rf'\b{re.escape(term1)}\b', ga_response, re.IGNORECASE))
            ga_uses_term2 = bool(re.search(rf'\b{re.escape(term2)}\b', ga_response, re.IGNORECASE))
            
            # Verificar se há uso de termos conflitantes
            if (dr_uses_term1 and ga_uses_term2 and not ga_uses_term1) or \
               (dr_uses_term2 and ga_uses_term1 and not ga_uses_term2):
                inconsistencies.append(InconsistencyDetection(
                    inconsistency_type=InconsistencyType.TERMINOLOGY_CONFUSION,
                    severity=ValidationSeverity.MEDIUM,
                    dr_gasnelio_content=dr_response,
                    ga_content=ga_response,
                    conflicting_elements=[term1, term2],
                    description=f"Uso inconsistente de terminologia: {term1} vs {term2}",
                    confidence_score=0.6,
                    medical_risk_level="baixo",
                    suggested_resolution="Padronizar terminologia entre personas"
                ))
        
        return inconsistencies
    
    def _validate_factual_consistency(self, dr_response: str, ga_response: str, 
                                    question: str) -> List[InconsistencyDetection]:
        """Valida consistência factual geral"""
        inconsistencies = []
        
        # Usar similarity para detectar contradições diretas
        similarity_score = self._calculate_semantic_similarity(dr_response, ga_response)
        
        if similarity_score < 0.3:  # Muito diferentes
            inconsistencies.append(InconsistencyDetection(
                inconsistency_type=InconsistencyType.FACTUAL_CONTRADICTION,
                severity=ValidationSeverity.MEDIUM,
                dr_gasnelio_content=dr_response,
                ga_content=ga_response,
                conflicting_elements=["Conteúdo semanticamente divergente"],
                description=f"Baixa similaridade semântica entre respostas (score: {similarity_score:.2f})",
                confidence_score=0.5,
                medical_risk_level="médio",
                suggested_resolution="Revisar coerência das informações fornecidas"
            ))
        
        return inconsistencies
    
    def _calculate_consistency_score(self, inconsistencies: List[InconsistencyDetection]) -> float:
        """Calcula score de consistência baseado nas inconsistências"""
        if not inconsistencies:
            return 100.0
        
        # Pesos por severidade
        severity_weights = {
            ValidationSeverity.CRITICAL: 30,
            ValidationSeverity.HIGH: 20,
            ValidationSeverity.MEDIUM: 10,
            ValidationSeverity.LOW: 5
        }
        
        total_penalty = sum(severity_weights.get(inc.severity, 0) * inc.confidence_score 
                           for inc in inconsistencies)
        
        # Score final (max 100, min 0)
        consistency_score = max(0, min(100, 100 - total_penalty))
        
        return consistency_score
    
    def _calculate_medical_accuracy_score(self, dr_response: str, ga_response: str,
                                        inconsistencies: List[InconsistencyDetection]) -> float:
        """Calcula score de precisão médica"""
        base_score = 100.0
        
        # Penalizar inconsistências médicas críticas
        medical_penalties = {
            InconsistencyType.DOSAGE_CONTRADICTION: 25,
            InconsistencyType.PROTOCOL_MISMATCH: 20,
            InconsistencyType.CONTRAINDICATION_CONFLICT: 15
        }
        
        for inconsistency in inconsistencies:
            penalty = medical_penalties.get(inconsistency.inconsistency_type, 5)
            base_score -= penalty * inconsistency.confidence_score
        
        return max(0, min(100, base_score))
    
    def _calculate_educational_coherence_score(self, dr_response: str, ga_response: str) -> float:
        """Calcula score de coerência educacional"""
        # Score baseado em similaridade semântica e estrutural
        semantic_sim = self._calculate_semantic_similarity(dr_response, ga_response)
        
        # Bonus se ambos mencionam conceitos educacionais importantes
        educational_keywords = ['tratamento', 'medicação', 'hanseníase', 'cuidado', 'importante']
        dr_keywords = sum(1 for kw in educational_keywords if kw.lower() in dr_response.lower())
        ga_keywords = sum(1 for kw in educational_keywords if kw.lower() in ga_response.lower())
        
        keyword_coherence = min(dr_keywords, ga_keywords) / len(educational_keywords)
        
        # Score combinado
        coherence_score = (semantic_sim * 0.7 + keyword_coherence * 0.3) * 100
        
        return max(0, min(100, coherence_score))
    
    def _determine_validation_pass(self, inconsistencies: List[InconsistencyDetection], 
                                 consistency_score: float) -> bool:
        """Determina se a validação passou"""
        # Falha imediata se houver inconsistências críticas
        critical_count = sum(1 for inc in inconsistencies 
                           if inc.severity == ValidationSeverity.CRITICAL)
        
        if critical_count > self.validation_thresholds['critical_inconsistency_limit']:
            return False
        
        # Falha se score muito baixo
        if consistency_score < self.validation_thresholds['consistency_minimum']:
            return False
        
        # Falha se muitas inconsistências de alta severidade
        high_count = sum(1 for inc in inconsistencies 
                        if inc.severity == ValidationSeverity.HIGH)
        
        if high_count > self.validation_thresholds['high_inconsistency_limit']:
            return False
        
        return True
    
    def _requires_human_review(self, inconsistencies: List[InconsistencyDetection],
                             consistency_score: float, medical_accuracy_score: float) -> bool:
        """Determina se requer revisão humana"""
        # Sempre requer se há inconsistências críticas
        if any(inc.severity == ValidationSeverity.CRITICAL for inc in inconsistencies):
            return True
        
        # Requer se scores muito baixos
        if consistency_score < self.validation_thresholds['human_review_threshold']:
            return True
        
        if medical_accuracy_score < self.validation_thresholds['medical_accuracy_minimum']:
            return True
        
        # Requer se há muitas inconsistências de qualquer tipo
        if len(inconsistencies) > 3:
            return True
        
        return False
    
    def _determine_agreement_level(self, consistency_score: float) -> str:
        """Determina nível de concordância entre personas"""
        if consistency_score >= 90:
            return "excellent"
        elif consistency_score >= 80:
            return "good"
        elif consistency_score >= 70:
            return "acceptable"
        elif consistency_score >= 50:
            return "poor"
        else:
            return "unacceptable"
    
    # Helper methods
    def _generate_cache_key(self, question: str, dr_response: str, ga_response: str) -> str:
        """Gera chave de cache para validação"""
        import hashlib
        # SHA-256 truncado para chave de cache (não é dado sensível, apenas texto de resposta)
        content = f"{question[:100]}{dr_response[:200]}{ga_response[:200]}"
        return hashlib.sha256(content.encode()).hexdigest()[:16]
    
    def _normalize_dosages(self, dosages: List[str]) -> List[float]:
        """Normaliza dosagens para comparação numérica"""
        normalized = []
        for dosage in dosages:
            try:
                # Extrair números da string
                numbers = re.findall(r'\d+(?:\.\d+)?', str(dosage))
                if numbers:
                    normalized.append(float(numbers[0]))
            except (ValueError, IndexError):
                continue
        return normalized
    
    def _dosages_are_equivalent(self, dose1: float, dose2: float, tolerance: float = 0.1) -> bool:
        """Verifica se duas dosagens são equivalentes dentro de uma tolerância"""
        if not dose1 or not dose2:
            return False
        return abs(dose1 - dose2) / max(dose1, dose2) <= tolerance
    
    def _extract_pqt_type(self, text: str) -> Optional[str]:
        """Extrai tipo de PQT mencionado no texto"""
        if re.search(r'PQT[- ]?PB|paucibacilar', text, re.IGNORECASE):
            return "PQT-PB"
        elif re.search(r'PQT[- ]?MB|multibacilar', text, re.IGNORECASE):
            return "PQT-MB"
        return None
    
    def _calculate_semantic_similarity(self, text1: str, text2: str) -> float:
        """Calcula similaridade semântica simples entre dois textos"""
        # Implementação simplificada usando difflib
        similarity = difflib.SequenceMatcher(None, text1.lower(), text2.lower()).ratio()
        return similarity
    
    def get_validation_stats(self) -> Dict[str, Any]:
        """Retorna estatísticas de validação"""
        total = max(1, self.validation_stats['total_validations'])
        
        return {
            **self.validation_stats,
            'pass_rate': (self.validation_stats['passed_validations'] / total) * 100,
            'human_review_rate': (self.validation_stats['human_reviews_required'] / total) * 100,
            'critical_inconsistency_rate': (self.validation_stats['critical_inconsistencies'] / total) * 100,
            'cache_size': len(self.validation_cache)
        }

# Instância global
cross_persona_validator = CrossPersonaValidator()

# Funções de conveniência
def validate_personas_consistency(question: str, dr_gasnelio_response: str, 
                                ga_response: str, context: Dict[str, Any] = None) -> CrossValidationResult:
    """Valida consistência entre respostas das personas"""
    return cross_persona_validator.validate_persona_responses(
        question, dr_gasnelio_response, ga_response, context
    )

def get_cross_validation_stats() -> Dict[str, Any]:
    """Retorna estatísticas de validação cruzada"""
    return cross_persona_validator.get_validation_stats()

__all__ = [
    'CrossPersonaValidator',
    'CrossValidationResult',
    'InconsistencyDetection',
    'InconsistencyType',
    'ValidationSeverity',
    'cross_persona_validator',
    'validate_personas_consistency',
    'get_cross_validation_stats'
]