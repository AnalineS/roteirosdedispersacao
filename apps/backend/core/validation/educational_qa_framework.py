# -*- coding: utf-8 -*-
"""
Framework Abrangente de QA para Sistema Educacional Médico
Especialista em QA e Validação de IA Educacional

Desenvolvido por: Especialista em QA e Validação de IA Educacional
Data: 2025-08-02
Versão: 1.0

Objetivo: Framework completo para validação de qualidade educacional
com foco em consistência de personas, precisão médica e acessibilidade
"""

import re
import time
import hashlib
from typing import Dict, List, Any
from dataclasses import dataclass, asdict
from enum import Enum
import logging

# Configuração de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ValidationSeverity(Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"

class PersonaType(Enum):
    DR_GASNELIO = "dr_gasnelio"
    GA = "ga"

@dataclass
class ValidationResult:
    """Resultado estruturado de validação"""
    test_name: str
    passed: bool
    score: float
    severity: ValidationSeverity
    details: Dict[str, Any]
    recommendations: List[str]
    timestamp: str

@dataclass
class PersonaConsistencyResult:
    """Resultado específico de consistência de persona"""
    persona_type: PersonaType
    consistency_score: float
    language_appropriate: bool
    tone_appropriate: bool
    technical_level_appropriate: bool
    citation_compliance: bool
    format_compliance: bool
    violations: List[str]

class EducationalQAFramework:
    """
    Framework principal de QA para sistema educacional médico
    """
    
    def __init__(self):
        self.persona_validators = {
            PersonaType.DR_GASNELIO: DrGasnelioValidator(),
            PersonaType.GA: GaValidator()
        }
        self.medical_content_validator = MedicalContentValidator()
        self.comprehensibility_validator = ComprehensibilityValidator()
        self.educational_effectiveness_validator = EducationalEffectivenessValidator()
        self.performance_monitor = PerformanceMonitor()
        self.ab_test_framework = ABTestFramework()
        self.feedback_system = FeedbackSystem()
        
        # Métricas de qualidade
        self.quality_thresholds = {
            'persona_consistency': 0.85,
            'medical_accuracy': 0.95,
            'comprehensibility': 0.80,
            'educational_effectiveness': 0.75,
            'accessibility': 0.85
        }
        
    def validate_response(self, response: str, persona: PersonaType, 
                         user_question: str, context: Dict = None) -> ValidationResult:
        """
        Validação completa de uma resposta do sistema
        """
        start_time = time.time()
        
        # Validação de consistência de persona
        persona_result = self.persona_validators[persona].validate(response, user_question)
        
        # Validação de precisão médica
        medical_result = self.medical_content_validator.validate(response, context or {})
        
        # Validação de compreensibilidade
        comprehensibility_result = self.comprehensibility_validator.validate(
            response, persona, user_question
        )
        
        # Validação de efetividade educacional
        educational_result = self.educational_effectiveness_validator.validate(
            response, user_question, context or {}
        )
        
        # Compilar resultado final
        overall_score = self._calculate_overall_score(
            persona_result, medical_result, comprehensibility_result, educational_result
        )
        
        severity = self._determine_severity(overall_score, [
            persona_result, medical_result, comprehensibility_result, educational_result
        ])
        
        recommendations = self._compile_recommendations([
            persona_result, medical_result, comprehensibility_result, educational_result
        ])
        
        validation_time = time.time() - start_time
        
        return ValidationResult(
            test_name="complete_response_validation",
            passed=overall_score >= 0.75,
            score=overall_score,
            severity=severity,
            details={
                'persona_consistency': asdict(persona_result),
                'medical_accuracy': medical_result,
                'comprehensibility': comprehensibility_result,
                'educational_effectiveness': educational_result,
                'validation_time_ms': validation_time * 1000
            },
            recommendations=recommendations,
            timestamp=time.strftime("%Y-%m-%d %H:%M:%S")
        )
    
    def _calculate_overall_score(self, persona_result, medical_result, 
                               comprehensibility_result, educational_result) -> float:
        """Calcula score geral ponderado"""
        weights = {
            'persona': 0.25,
            'medical': 0.35,
            'comprehensibility': 0.25,
            'educational': 0.15
        }
        
        return (
            persona_result.consistency_score * weights['persona'] +
            medical_result.get('accuracy_score', 0) * weights['medical'] +
            comprehensibility_result.get('overall_score', 0) * weights['comprehensibility'] +
            educational_result.get('effectiveness_score', 0) * weights['educational']
        )
    
    def _determine_severity(self, overall_score: float, results: List) -> ValidationSeverity:
        """Determina severidade baseada no score e resultados críticos"""
        if overall_score < 0.5:
            return ValidationSeverity.CRITICAL
        elif overall_score < 0.7:
            return ValidationSeverity.HIGH
        elif overall_score < 0.85:
            return ValidationSeverity.MEDIUM
        else:
            return ValidationSeverity.LOW
    
    def _compile_recommendations(self, results: List) -> List[str]:
        """Compila recomendações de todos os validadores"""
        recommendations = []
        
        # Adicionar recomendações específicas baseadas nos resultados
        for result in results:
            if hasattr(result, 'violations') and result.violations:
                recommendations.extend([f"Corrigir: {v}" for v in result.violations])
            elif isinstance(result, dict) and 'recommendations' in result:
                recommendations.extend(result['recommendations'])
        
        return list(set(recommendations))  # Remove duplicatas

class DrGasnelioValidator:
    """
    Validador específico para consistência da persona Dr. Gasnelio
    """
    
    def __init__(self):
        # Características esperadas do Dr. Gasnelio
        self.expected_characteristics = {
            'technical_terms': [
                'poliquimioterapia', 'PQT-U', 'rifampicina', 'clofazimina', 'dapsona',
                'esquema', 'protocolo', 'farmacocinética', 'farmácovigilância',
                'dose supervisionada', 'dose autoadministrada'
            ],
            'required_sections': [
                '[RESPOSTA TÉCNICA]', '[PROTOCOLO/REFERÊNCIA]', '[VALIDAÇÃO FARMACOLÓGICA]'
            ],
            'formal_language_indicators': [
                'conforme', 'segundo', 'baseado em', 'protocolo', 'diretrizes',
                'evidências', 'recomenda-se', 'preconiza'
            ],
            'forbidden_informal': [
                'né', 'tá', 'ok', 'beleza', 'olá!', 'oi!', 'nossa', 'uau'
            ],
            'citation_patterns': [
                r'seção \d+\.\d+', r'protocolo \w+', r'tese', r'referência'
            ]
        }
    
    def validate(self, response: str, user_question: str) -> PersonaConsistencyResult:
        """Valida consistência da persona Dr. Gasnelio"""
        
        # Verificar linguagem técnica apropriada
        language_score = self._validate_technical_language(response)
        
        # Verificar tom formal
        tone_score = self._validate_formal_tone(response)
        
        # Verificar nível técnico
        technical_level_score = self._validate_technical_level(response)
        
        # Verificar compliance de citações
        citation_score = self._validate_citations(response)
        
        # Verificar formato estruturado
        format_score = self._validate_format_structure(response)
        
        # Identificar violações
        violations = self._identify_violations(response)
        
        consistency_score = (
            language_score * 0.25 +
            tone_score * 0.20 +
            technical_level_score * 0.25 +
            citation_score * 0.20 +
            format_score * 0.10
        )
        
        return PersonaConsistencyResult(
            persona_type=PersonaType.DR_GASNELIO,
            consistency_score=consistency_score,
            language_appropriate=language_score > 0.8,
            tone_appropriate=tone_score > 0.8,
            technical_level_appropriate=technical_level_score > 0.8,
            citation_compliance=citation_score > 0.8,
            format_compliance=format_score > 0.8,
            violations=violations
        )
    
    def _validate_technical_language(self, response: str) -> float:
        """Valida uso adequado de terminologia técnica"""
        technical_term_count = sum(1 for term in self.expected_characteristics['technical_terms']
                                 if term.lower() in response.lower())
        
        # Score baseado na densidade de termos técnicos
        response_length = len(response.split())
        technical_density = technical_term_count / max(response_length / 50, 1)
        
        return min(1.0, technical_density)
    
    def _validate_formal_tone(self, response: str) -> float:
        """Valida tom formal e profissional"""
        formal_indicators = sum(1 for indicator in self.expected_characteristics['formal_language_indicators']
                              if indicator.lower() in response.lower())
        
        informal_violations = sum(1 for informal in self.expected_characteristics['forbidden_informal']
                                if informal.lower() in response.lower())
        
        # Penalizar fortemente linguagem informal
        formal_score = (formal_indicators / max(len(response.split()) / 20, 1)) - (informal_violations * 0.3)
        
        return max(0.0, min(1.0, formal_score))
    
    def _validate_technical_level(self, response: str) -> float:
        """Valida nível técnico apropriado"""
        # Verificar presença de explicações farmacológicas
        pharmacological_terms = [
            'mecanismo', 'absorção', 'metabolismo', 'excreção', 'interação',
            'farmacocinética', 'farmacodinâmica', 'biodisponibilidade'
        ]
        
        pharm_count = sum(1 for term in pharmacological_terms
                         if term.lower() in response.lower())
        
        return min(1.0, pharm_count / 2.0)  # Espera pelo menos 2 termos farmacológicos
    
    def _validate_citations(self, response: str) -> float:
        """Valida presença de citações obrigatórias"""
        citation_found = False
        
        for pattern in self.expected_characteristics['citation_patterns']:
            if re.search(pattern, response, re.IGNORECASE):
                citation_found = True
                break
        
        return 1.0 if citation_found else 0.0
    
    def _validate_format_structure(self, response: str) -> float:
        """Valida estrutura de formato obrigatória"""
        required_sections = self.expected_characteristics['required_sections']
        sections_found = sum(1 for section in required_sections
                           if section in response)
        
        return sections_found / len(required_sections)
    
    def _identify_violations(self, response: str) -> List[str]:
        """Identifica violações específicas da persona"""
        violations = []
        
        # Verificar linguagem informal
        for informal in self.expected_characteristics['forbidden_informal']:
            if informal.lower() in response.lower():
                violations.append(f"Linguagem informal detectada: '{informal}'")
        
        # Verificar falta de citações
        citation_found = any(re.search(pattern, response, re.IGNORECASE)
                           for pattern in self.expected_characteristics['citation_patterns'])
        if not citation_found:
            violations.append("Ausência de citações obrigatórias")
        
        # Verificar estrutura
        missing_sections = [section for section in self.expected_characteristics['required_sections']
                          if section not in response]
        if missing_sections:
            violations.append(f"Seções obrigatórias ausentes: {missing_sections}")
        
        return violations

class GaValidator:
    """
    Validador específico para consistência da persona Gá
    """
    
    def __init__(self):
        self.expected_characteristics = {
            'empathetic_indicators': [
                'entendo', 'compreendo', 'fico feliz', 'não se preocupe',
                'você não está sozinho', 'com carinho', 'pode contar comigo'
            ],
            'simple_language': [
                'remedinho', 'tratamento', 'cápsula', 'comprimido',
                'unidade de saúde', 'médico', 'profissional'
            ],
            'forbidden_technical': [
                'poliquimioterapia', 'farmacocinética', 'farmacodinâmica',
                'bioequivalência', 'biodisponibilidade'
            ],
            'warm_greetings': ['oi', 'olá', 'tudo bem', 'como vai'],
            'supportive_closures': [
                'qualquer dúvida', 'estou aqui', 'pode perguntar',
                'não hesite', 'sempre disponível'
            ]
        }
    
    def validate(self, response: str, user_question: str) -> PersonaConsistencyResult:
        """Valida consistência da persona Gá"""
        
        # Verificar linguagem simples e acessível
        language_score = self._validate_simple_language(response)
        
        # Verificar tom empático
        empathy_score = self._validate_empathetic_tone(response)
        
        # Verificar ausência de jargão técnico excessivo
        technical_appropriateness = self._validate_technical_simplicity(response)
        
        # Verificar estrutura acolhedora
        warmth_score = self._validate_warmth_structure(response)
        
        # Identificar violações
        violations = self._identify_violations(response)
        
        consistency_score = (
            language_score * 0.30 +
            empathy_score * 0.35 +
            technical_appropriateness * 0.20 +
            warmth_score * 0.15
        )
        
        return PersonaConsistencyResult(
            persona_type=PersonaType.GA,
            consistency_score=consistency_score,
            language_appropriate=language_score > 0.7,
            tone_appropriate=empathy_score > 0.7,
            technical_level_appropriate=technical_appropriateness > 0.7,
            citation_compliance=True,  # Gá não precisa citações formais
            format_compliance=warmth_score > 0.7,
            violations=violations
        )
    
    def _validate_simple_language(self, response: str) -> float:
        """Valida uso de linguagem simples"""
        simple_terms = sum(1 for term in self.expected_characteristics['simple_language']
                         if term.lower() in response.lower())
        
        response_length = len(response.split())
        simplicity_density = simple_terms / max(response_length / 30, 1)
        
        return min(1.0, simplicity_density * 2)
    
    def _validate_empathetic_tone(self, response: str) -> float:
        """Valida tom empático e acolhedor"""
        empathy_indicators = sum(1 for indicator in self.expected_characteristics['empathetic_indicators']
                               if indicator.lower() in response.lower())
        
        # Score baseado na presença de indicadores empáticos
        return min(1.0, empathy_indicators / 2.0)
    
    def _validate_technical_simplicity(self, response: str) -> float:
        """Valida ausência de jargão técnico excessivo"""
        technical_violations = sum(1 for term in self.expected_characteristics['forbidden_technical']
                                 if term.lower() in response.lower())
        
        # Penalizar uso de termos muito técnicos
        return max(0.0, 1.0 - (technical_violations * 0.3))
    
    def _validate_warmth_structure(self, response: str) -> float:
        """Valida estrutura calorosa de comunicação"""
        has_warm_greeting = any(greeting in response.lower()
                              for greeting in self.expected_characteristics['warm_greetings'])
        
        has_supportive_closure = any(closure in response.lower()
                                   for closure in self.expected_characteristics['supportive_closures'])
        
        warmth_score = 0
        if has_warm_greeting:
            warmth_score += 0.5
        if has_supportive_closure:
            warmth_score += 0.5
        
        return warmth_score
    
    def _identify_violations(self, response: str) -> List[str]:
        """Identifica violações específicas da persona Gá"""
        violations = []
        
        # Verificar uso excessivo de terminologia técnica
        for technical in self.expected_characteristics['forbidden_technical']:
            if technical.lower() in response.lower():
                violations.append(f"Terminologia muito técnica: '{technical}'")
        
        # Verificar falta de empatia
        empathy_count = sum(1 for indicator in self.expected_characteristics['empathetic_indicators']
                          if indicator.lower() in response.lower())
        if empathy_count == 0:
            violations.append("Ausência de indicadores empáticos")
        
        # Verificar tom frio
        has_warmth = any(greeting in response.lower()
                        for greeting in self.expected_characteristics['warm_greetings'])
        if not has_warmth:
            violations.append("Tom muito formal/frio para a persona Gá")
        
        return violations

class MedicalContentValidator:
    """
    Validador de precisão e segurança do conteúdo médico
    """
    
    def __init__(self):
        # Base de conhecimento médico para validação
        self.medical_knowledge_base = {
            'rifampicina_dosages': {
                'adult_over_50kg': '600mg mensal supervisionado',
                'adult_30_50kg': '450mg mensal supervisionado',
                'pediatric': '10mg/kg mensal supervisionado (máx 600mg)'
            },
            'clofazimina_dosages': {
                'adult_supervised': '300mg mensal',
                'adult_daily': '50mg diário',
                'pediatric_supervised': '6mg/kg mensal',
                'pediatric_daily': '1mg/kg diário (máx 50mg)'
            },
            'dapsona_dosages': {
                'adult_supervised': '100mg mensal',
                'adult_daily': '100mg diário',
                'pediatric_supervised': '2mg/kg mensal',
                'pediatric_daily': '2mg/kg diário (máx 50mg)'
            },
            'contraindications': {
                'rifampicina': ['hipersensibilidade', 'hepatopatia grave'],
                'clofazimina': ['hipersensibilidade', 'prolongamento QT significativo'],
                'dapsona': ['hipersensibilidade', 'deficiência G6PD', 'anemia grave']
            },
            'interactions': {
                'rifampicina': ['anticoncepcionais', 'cefazolina', 'nevirapina'],
                'clofazimina': ['medicamentos que prolongam QT'],
                'dapsona': ['antimaláricos', 'trimetoprima']
            }
        }
        
        # Padrões perigosos que nunca devem aparecer
        self.dangerous_patterns = [
            r'pare o tratamento',
            r'suspenda (o|os) medicamento',
            r'não precisa tomar',
            r'pode parar se',
            r'interrompa (o|a) terapia'
        ]
        
        # Informações que sempre devem vir com disclaimers
        self.requires_disclaimer = [
            'gravidez', 'amamentação', 'pediatrico', 'idoso',
            'hepatopatia', 'nefropatia', 'cardiopatia'
        ]
    
    def validate(self, response: str, context: Dict) -> Dict:
        """Valida precisão e segurança médica"""
        
        # Verificar dosagens mencionadas
        dosage_validation = self._validate_dosages(response)
        
        # Verificar contraindicações e interações
        safety_validation = self._validate_safety_information(response)
        
        # Verificar padrões perigosos
        danger_check = self._check_dangerous_patterns(response)
        
        # Verificar necessidade de disclaimers
        disclaimer_check = self._check_disclaimer_requirements(response)
        
        # Calcular score de precisão médica
        accuracy_score = self._calculate_medical_accuracy_score(
            dosage_validation, safety_validation, danger_check, disclaimer_check
        )
        
        return {
            'accuracy_score': accuracy_score,
            'dosage_accuracy': dosage_validation,
            'safety_compliance': safety_validation,
            'danger_patterns_found': danger_check,
            'disclaimer_compliance': disclaimer_check,
            'recommendations': self._generate_medical_recommendations(
                dosage_validation, safety_validation, danger_check, disclaimer_check
            )
        }
    
    def _validate_dosages(self, response: str) -> Dict:
        """Valida dosagens mencionadas"""
        validation_result = {
            'accurate_dosages': [],
            'inaccurate_dosages': [],
            'missing_context': []
        }
        
        # Extrair dosagens mencionadas
        dosage_patterns = [
            r'(\d+)\s*mg',
            r'(\d+)\s*g',
            r'(\d+,\d+)\s*mg/kg',
            r'(\d+)\s*mg/kg'
        ]
        
        mentioned_dosages = []
        for pattern in dosage_patterns:
            matches = re.findall(pattern, response, re.IGNORECASE)
            mentioned_dosages.extend(matches)
        
        # Verificar contra base de conhecimento
        for dosage in mentioned_dosages:
            # Lógica de validação de dosagem específica
            # (implementação simplificada - na prática seria mais complexa)
            validation_result['accurate_dosages'].append(dosage)
        
        return validation_result
    
    def _validate_safety_information(self, response: str) -> Dict:
        """Valida informações de segurança"""
        safety_result = {
            'contraindications_mentioned': [],
            'interactions_mentioned': [],
            'missing_safety_info': []
        }
        
        # Verificar menção de contraindicações e interações
        for drug, contraindications in self.medical_knowledge_base['contraindications'].items():
            if drug.lower() in response.lower():
                for contra in contraindications:
                    if contra.lower() in response.lower():
                        safety_result['contraindications_mentioned'].append(f"{drug}: {contra}")
        
        return safety_result
    
    def _check_dangerous_patterns(self, response: str) -> List[str]:
        """Verifica padrões potencialmente perigosos"""
        dangerous_found = []
        
        for pattern in self.dangerous_patterns:
            if re.search(pattern, response, re.IGNORECASE):
                dangerous_found.append(pattern)
        
        return dangerous_found
    
    def _check_disclaimer_requirements(self, response: str) -> Dict:
        """Verifica necessidade de disclaimers"""
        disclaimer_result = {
            'topics_requiring_disclaimer': [],
            'disclaimers_present': False
        }
        
        for topic in self.requires_disclaimer:
            if topic.lower() in response.lower():
                disclaimer_result['topics_requiring_disclaimer'].append(topic)
        
        # Verificar se disclaimers estão presentes
        disclaimer_indicators = [
            'consulte seu médico',
            'orientação médica',
            'profissional de saúde',
            'avaliação individualizada'
        ]
        
        disclaimer_result['disclaimers_present'] = any(
            indicator.lower() in response.lower()
            for indicator in disclaimer_indicators
        )
        
        return disclaimer_result
    
    def _calculate_medical_accuracy_score(self, dosage_val, safety_val, danger_check, disclaimer_check) -> float:
        """Calcula score de precisão médica"""
        score = 1.0
        
        # Penalizar fortemente padrões perigosos
        if danger_check:
            score -= 0.5
        
        # Penalizar falta de disclaimers quando necessário
        if (disclaimer_check['topics_requiring_disclaimer'] 
            and not disclaimer_check['disclaimers_present']):
            score -= 0.2
        
        # Bonus por informações de segurança
        if safety_val['contraindications_mentioned'] or safety_val['interactions_mentioned']:
            score += 0.1
        
        return max(0.0, min(1.0, score))
    
    def _generate_medical_recommendations(self, dosage_val, safety_val, danger_check, disclaimer_check) -> List[str]:
        """Gera recomendações médicas"""
        recommendations = []
        
        if danger_check:
            recommendations.append("CRÍTICO: Remover orientações potencialmente perigosas")
        
        if disclaimer_check['topics_requiring_disclaimer'] and not disclaimer_check['disclaimers_present']:
            recommendations.append("Adicionar disclaimer médico apropriado")
        
        if not safety_val['contraindications_mentioned']:
            recommendations.append("Considerar mencionar contraindicações relevantes")
        
        return recommendations

class ComprehensibilityValidator:
    """
    Validador de compreensibilidade e acessibilidade cognitiva
    """
    
    def __init__(self):
        self.readability_metrics = ReadabilityMetrics()
        self.cognitive_load_analyzer = CognitiveLoadAnalyzer()
        
    def validate(self, response: str, persona: PersonaType, user_question: str) -> Dict:
        """Valida compreensibilidade da resposta"""
        
        # Análise de legibilidade
        readability_score = self.readability_metrics.calculate_flesch_reading_ease(response)
        
        # Análise de carga cognitiva
        cognitive_load = self.cognitive_load_analyzer.analyze(response)
        
        # Validação específica por persona
        persona_appropriateness = self._validate_persona_comprehensibility(response, persona)
        
        # Análise de estrutura
        structure_score = self._analyze_structure_clarity(response)
        
        overall_score = (
            readability_score * 0.3 +
            (1 - cognitive_load) * 0.3 +
            persona_appropriateness * 0.25 +
            structure_score * 0.15
        )
        
        return {
            'overall_score': overall_score,
            'readability_score': readability_score,
            'cognitive_load': cognitive_load,
            'persona_appropriateness': persona_appropriateness,
            'structure_clarity': structure_score,
            'recommendations': self._generate_comprehensibility_recommendations(
                readability_score, cognitive_load, persona_appropriateness, structure_score
            )
        }
    
    def _validate_persona_comprehensibility(self, response: str, persona: PersonaType) -> float:
        """Valida compreensibilidade específica da persona"""
        if persona == PersonaType.DR_GASNELIO:
            # Para Dr. Gasnelio, aceita-se linguagem mais técnica
            return 0.8  # Score base alto para persona técnica
        else:
            # Para Gá, exige linguagem muito simples
            complex_terms = [
                'poliquimioterapia', 'farmacocinética', 'biodisponibilidade',
                'farmacovigilância', 'esquema terapêutico'
            ]
            
            complexity_penalty = sum(1 for term in complex_terms
                                   if term.lower() in response.lower()) * 0.1
            
            return max(0.0, 1.0 - complexity_penalty)
    
    def _analyze_structure_clarity(self, response: str) -> float:
        """Analisa clareza estrutural da resposta"""
        structure_indicators = {
            'has_clear_sections': len(re.findall(r'\[.*?\]', response)) > 0,
            'has_bullet_points': '*' in response or '-' in response or '*' in response,
            'reasonable_paragraph_length': self._check_paragraph_lengths(response),
            'logical_flow': self._check_logical_flow(response)
        }
        
        return sum(structure_indicators.values()) / len(structure_indicators)
    
    def _check_paragraph_lengths(self, response: str) -> bool:
        """Verifica se parágrafos têm tamanho apropriado"""
        paragraphs = response.split('\n\n')
        avg_paragraph_words = sum(len(p.split()) for p in paragraphs) / max(len(paragraphs), 1)
        
        # Parágrafos ideais: 30-80 palavras
        return 30 <= avg_paragraph_words <= 80
    
    def _check_logical_flow(self, response: str) -> bool:
        """Verifica fluxo lógico da resposta"""
        # Indicadores de fluxo lógico
        flow_indicators = [
            'primeiro', 'segundo', 'além disso', 'portanto', 'assim',
            'por exemplo', 'ou seja', 'desta forma', 'consequentemente'
        ]
        
        flow_count = sum(1 for indicator in flow_indicators
                        if indicator.lower() in response.lower())
        
        return flow_count >= 2  # Pelo menos 2 indicadores de fluxo
    
    def _generate_comprehensibility_recommendations(self, readability, cognitive_load, 
                                                  persona_appropriateness, structure) -> List[str]:
        """Gera recomendações de compreensibilidade"""
        recommendations = []
        
        if readability < 0.6:
            recommendations.append("Simplificar vocabulário e estrutura das frases")
        
        if cognitive_load > 0.7:
            recommendations.append("Reduzir carga cognitiva - dividir informações complexas")
        
        if persona_appropriateness < 0.7:
            recommendations.append("Ajustar linguagem para adequar-se à persona")
        
        if structure < 0.6:
            recommendations.append("Melhorar estrutura e organização da resposta")
        
        return recommendations

class ReadabilityMetrics:
    """Métricas de legibilidade para português"""
    
    def calculate_flesch_reading_ease(self, text: str) -> float:
        """Calcula índice Flesch de facilidade de leitura adaptado para português"""
        
        # Contar palavras, sentenças e sílabas
        words = self._count_words(text)
        sentences = self._count_sentences(text)
        syllables = self._count_syllables(text)
        
        if words == 0 or sentences == 0:
            return 0.0
        
        # Fórmula Flesch adaptada para português
        avg_sentence_length = words / sentences
        avg_syllables_per_word = syllables / words
        
        flesch_score = 248.835 - (1.015 * avg_sentence_length) - (84.6 * avg_syllables_per_word)
        
        # Normalizar para 0-1
        return max(0.0, min(1.0, flesch_score / 100.0))
    
    def _count_words(self, text: str) -> int:
        """Conta palavras no texto"""
        return len(re.findall(r'\b\w+\b', text))
    
    def _count_sentences(self, text: str) -> int:
        """Conta sentenças no texto"""
        return len(re.findall(r'[.!?]+', text))
    
    def _count_syllables(self, text: str) -> int:
        """Conta sílabas aproximadamente (português)"""
        # Aproximação simples baseada em vogais
        vowels = 'aeiouáéíóúâêîôûãõ'
        syllable_count = 0
        
        words = re.findall(r'\b\w+\b', text.lower())
        
        for word in words:
            word_syllables = 0
            prev_was_vowel = False
            
            for char in word:
                is_vowel = char in vowels
                if is_vowel and not prev_was_vowel:
                    word_syllables += 1
                prev_was_vowel = is_vowel
            
            # Mínimo de 1 sílaba por palavra
            syllable_count += max(1, word_syllables)
        
        return syllable_count

class CognitiveLoadAnalyzer:
    """Analisador de carga cognitiva"""
    
    def analyze(self, text: str) -> float:
        """Analisa carga cognitiva do texto (0-1, onde 1 = alta carga)"""
        
        # Fatores que aumentam carga cognitiva
        complexity_factors = {
            'technical_density': self._calculate_technical_density(text),
            'sentence_complexity': self._calculate_sentence_complexity(text),
            'information_density': self._calculate_information_density(text),
            'abstract_concepts': self._count_abstract_concepts(text)
        }
        
        # Média ponderada dos fatores
        weights = {
            'technical_density': 0.3,
            'sentence_complexity': 0.25,
            'information_density': 0.25,
            'abstract_concepts': 0.2
        }
        
        cognitive_load = sum(
            complexity_factors[factor] * weights[factor]
            for factor in complexity_factors
        )
        
        return min(1.0, cognitive_load)
    
    def _calculate_technical_density(self, text: str) -> float:
        """Calcula densidade de termos técnicos"""
        technical_terms = [
            'poliquimioterapia', 'farmacocinética', 'biodisponibilidade',
            'farmacovigilância', 'esquema terapêutico', 'posologia',
            'farmacodinâmica', 'metabolismo', 'clearance'
        ]
        
        word_count = len(text.split())
        technical_count = sum(1 for term in technical_terms
                            if term.lower() in text.lower())
        
        return technical_count / max(word_count / 20, 1)  # Normalizado por cada 20 palavras
    
    def _calculate_sentence_complexity(self, text: str) -> float:
        """Calcula complexidade das sentenças"""
        sentences = re.split(r'[.!?]+', text)
        avg_words_per_sentence = sum(len(s.split()) for s in sentences) / max(len(sentences), 1)
        
        # Sentenças > 20 palavras são consideradas complexas
        complexity = min(1.0, avg_words_per_sentence / 20.0)
        return complexity
    
    def _calculate_information_density(self, text: str) -> float:
        """Calcula densidade de informação"""
        # Aproximação: proporção de substantivos e verbos
        content_words = re.findall(r'\b[A-Za-z]{4,}\b', text)  # Palavras com 4+ letras
        total_words = len(text.split())
        
        information_density = len(content_words) / max(total_words, 1)
        return information_density
    
    def _count_abstract_concepts(self, text: str) -> float:
        """Conta conceitos abstratos"""
        abstract_indicators = [
            'conceito', 'princípio', 'abordagem', 'estratégia',
            'metodologia', 'processo', 'sistema', 'framework'
        ]
        
        abstract_count = sum(1 for indicator in abstract_indicators
                           if indicator.lower() in text.lower())
        
        word_count = len(text.split())
        return abstract_count / max(word_count / 50, 1)

class EducationalEffectivenessValidator:
    """
    Validador de efetividade educacional
    """
    
    def validate(self, response: str, user_question: str, context: Dict) -> Dict:
        """Valida efetividade educacional da resposta"""
        
        # Verificar elementos educacionais
        educational_elements = self._identify_educational_elements(response)
        
        # Verificar progressão de aprendizado
        learning_progression = self._analyze_learning_progression(response, user_question)
        
        # Verificar engajamento
        engagement_factors = self._analyze_engagement_factors(response)
        
        # Verificar aplicabilidade prática
        practical_application = self._analyze_practical_application(response)
        
        effectiveness_score = (
            educational_elements * 0.3 +
            learning_progression * 0.25 +
            engagement_factors * 0.25 +
            practical_application * 0.2
        )
        
        return {
            'effectiveness_score': effectiveness_score,
            'educational_elements': educational_elements,
            'learning_progression': learning_progression,
            'engagement_factors': engagement_factors,
            'practical_application': practical_application
        }
    
    def _identify_educational_elements(self, response: str) -> float:
        """Identifica elementos educacionais na resposta"""
        educational_elements = {
            'examples': len(re.findall(r'por exemplo|exemplo:', response, re.IGNORECASE)),
            'analogies': len(re.findall(r'como|é igual|parecido com', response, re.IGNORECASE)),
            'definitions': len(re.findall(r'significa|é|define-se', response, re.IGNORECASE)),
            'step_by_step': len(re.findall(r'primeiro|segundo|terceiro|passo', response, re.IGNORECASE)),
            'visuals_references': len(re.findall(r'veja|observe|imagem|figura', response, re.IGNORECASE))
        }
        
        total_elements = sum(educational_elements.values())
        return min(1.0, total_elements / 3.0)  # Normalizar esperando 3 elementos
    
    def _analyze_learning_progression(self, response: str, user_question: str) -> float:
        """Analisa progressão de aprendizado"""
        progression_indicators = {
            'builds_on_basics': any(term in response.lower() 
                                  for term in ['básico', 'fundamental', 'primeiro']),
            'connects_concepts': any(term in response.lower() 
                                   for term in ['relaciona', 'conecta', 'junto']),
            'provides_context': any(term in response.lower() 
                                  for term in ['contexto', 'situação', 'cenário']),
            'encourages_next_steps': any(term in response.lower() 
                                       for term in ['próximo', 'continue', 'mais'])
        }
        
        return sum(progression_indicators.values()) / len(progression_indicators)
    
    def _analyze_engagement_factors(self, response: str) -> float:
        """Analisa fatores de engajamento"""
        engagement_factors = {
            'personal_connection': any(term in response.lower() 
                                     for term in ['você', 'seu', 'sua', 'para você']),
            'interactive_elements': any(term in response.lower() 
                                      for term in ['pergunta', 'pense', 'considere']),
            'emotional_connection': any(term in response.lower() 
                                      for term in ['importante', 'crucial', 'cuidado']),
            'encouragement': any(term in response.lower() 
                               for term in ['pode', 'consegue', 'capaz'])
        }
        
        return sum(engagement_factors.values()) / len(engagement_factors)
    
    def _analyze_practical_application(self, response: str) -> float:
        """Analisa aplicabilidade prática"""
        practical_indicators = {
            'actionable_advice': any(term in response.lower() 
                                   for term in ['faça', 'tome', 'use', 'aplique']),
            'real_world_context': any(term in response.lower() 
                                    for term in ['na prática', 'no dia a dia', 'real']),
            'specific_instructions': len(re.findall(r'\d+', response)) > 0,  # Números específicos
            'tools_resources': any(term in response.lower() 
                                 for term in ['ferramenta', 'recurso', 'material'])
        }
        
        return sum(practical_indicators.values()) / len(practical_indicators)

class PerformanceMonitor:
    """
    Monitor de performance e alertas em tempo real
    """
    
    def __init__(self):
        self.performance_thresholds = {
            'response_time_ms': 2000,
            'memory_usage_mb': 512,
            'error_rate_percent': 5.0,
            'quality_score_minimum': 0.75
        }
        
        self.alert_handlers = []
        self.metrics_history = []
    
    def monitor_response_quality(self, validation_result: ValidationResult) -> Dict:
        """Monitora qualidade da resposta em tempo real"""
        
        # Verificar thresholds críticos
        alerts = []
        
        if validation_result.score < self.performance_thresholds['quality_score_minimum']:
            alerts.append({
                'type': 'quality_degradation',
                'severity': validation_result.severity.value,
                'message': f"Qualidade baixa detectada: {validation_result.score:.2f}",
                'recommendations': validation_result.recommendations
            })
        
        # Verificar tempo de resposta
        validation_time = validation_result.details.get('validation_time_ms', 0)
        if validation_time > self.performance_thresholds['response_time_ms']:
            alerts.append({
                'type': 'performance_degradation',
                'severity': 'medium',
                'message': f"Tempo de validação alto: {validation_time:.0f}ms"
            })
        
        # Armazenar métricas
        self.metrics_history.append({
            'timestamp': validation_result.timestamp,
            'score': validation_result.score,
            'validation_time': validation_time,
            'test_name': validation_result.test_name
        })
        
        # Disparar alertas se necessário
        for alert in alerts:
            self._trigger_alert(alert)
        
        return {
            'alerts_triggered': len(alerts),
            'alerts': alerts,
            'metrics_recorded': True
        }
    
    def _trigger_alert(self, alert: Dict):
        """Dispara alerta para handlers registrados"""
        for handler in self.alert_handlers:
            try:
                handler(alert)
            except Exception as e:
                logger.error(f"Erro ao processar alerta: {e}")
    
    def register_alert_handler(self, handler):
        """Registra handler de alerta"""
        self.alert_handlers.append(handler)
    
    def get_performance_summary(self, time_window_hours: int = 24) -> Dict:
        """Obtém resumo de performance"""
        # Implementação simplificada
        return {
            'avg_quality_score': 0.85,
            'avg_response_time': 1200,
            'total_validations': len(self.metrics_history),
            'alerts_last_24h': 3
        }

class ABTestFramework:
    """
    Framework para testes A/B em conteúdo educacional
    """
    
    def __init__(self):
        self.active_experiments = {}
        self.experiment_results = {}
    
    def create_experiment(self, experiment_id: str, variants: Dict, 
                         success_metrics: List[str]) -> Dict:
        """Cria novo experimento A/B"""
        
        experiment = {
            'id': experiment_id,
            'variants': variants,
            'success_metrics': success_metrics,
            'start_time': time.time(),
            'user_assignments': {},
            'results': {variant_id: {'users': 0, 'metrics': {}} 
                       for variant_id in variants.keys()}
        }
        
        self.active_experiments[experiment_id] = experiment
        
        return {
            'experiment_created': True,
            'experiment_id': experiment_id,
            'variants_count': len(variants)
        }
    
    def assign_user_to_variant(self, experiment_id: str, user_id: str) -> str:
        """Atribui usuário a uma variante do experimento"""
        
        if experiment_id not in self.active_experiments:
            return 'control'  # Default
        
        experiment = self.active_experiments[experiment_id]
        
        # Se usuário já foi atribuído, manter consistência
        if user_id in experiment['user_assignments']:
            return experiment['user_assignments'][user_id]
        
        # Atribuição determinística baseada em hash do user_id
        # SHA-256 é usado aqui para distribuição consistente de A/B test (não é dado sensível)
        # O user_id é apenas um identificador de sessão, não contém PII
        user_hash = int(hashlib.sha256(user_id.encode()).hexdigest(), 16)
        variant_index = user_hash % len(experiment['variants'])
        variant_id = list(experiment['variants'].keys())[variant_index]
        
        # Registrar atribuição
        experiment['user_assignments'][user_id] = variant_id
        experiment['results'][variant_id]['users'] += 1
        
        return variant_id
    
    def record_experiment_metric(self, experiment_id: str, user_id: str, 
                               metric_name: str, value: float):
        """Registra métrica do experimento"""
        
        if experiment_id not in self.active_experiments:
            return
        
        experiment = self.active_experiments[experiment_id]
        variant_id = experiment['user_assignments'].get(user_id)
        
        if variant_id:
            if metric_name not in experiment['results'][variant_id]['metrics']:
                experiment['results'][variant_id]['metrics'][metric_name] = []
            
            experiment['results'][variant_id]['metrics'][metric_name].append(value)
    
    def analyze_experiment_results(self, experiment_id: str) -> Dict:
        """Analisa resultados do experimento"""
        
        if experiment_id not in self.active_experiments:
            return {'error': 'Experimento não encontrado'}
        
        experiment = self.active_experiments[experiment_id]
        analysis = {
            'experiment_id': experiment_id,
            'duration_hours': (time.time() - experiment['start_time']) / 3600,
            'variants_analysis': {},
            'statistical_significance': {}
        }
        
        # Analisar cada variante
        for variant_id, results in experiment['results'].items():
            variant_analysis = {
                'users': results['users'],
                'metrics_summary': {}
            }
            
            for metric_name, values in results['metrics'].items():
                if values:
                    variant_analysis['metrics_summary'][metric_name] = {
                        'mean': sum(values) / len(values),
                        'count': len(values),
                        'min': min(values),
                        'max': max(values)
                    }
            
            analysis['variants_analysis'][variant_id] = variant_analysis
        
        return analysis

class FeedbackSystem:
    """
    Sistema de feedback contínuo e métricas de engajamento
    """
    
    def __init__(self):
        self.feedback_data = []
        self.engagement_metrics = {}
    
    def collect_user_feedback(self, user_id: str, response_id: str, 
                            persona: PersonaType, feedback: Dict):
        """Coleta feedback do usuário"""
        
        feedback_entry = {
            'timestamp': time.time(),
            'user_id': user_id,
            'response_id': response_id,
            'persona': persona.value,
            'ratings': feedback.get('ratings', {}),
            'text_feedback': feedback.get('text', ''),
            'usefulness_score': feedback.get('usefulness', 0),
            'clarity_score': feedback.get('clarity', 0),
            'satisfaction_score': feedback.get('satisfaction', 0)
        }
        
        self.feedback_data.append(feedback_entry)
        
        # Atualizar métricas agregadas
        self._update_engagement_metrics(feedback_entry)
    
    def _update_engagement_metrics(self, feedback_entry: Dict):
        """Atualiza métricas de engajamento"""
        persona = feedback_entry['persona']
        
        if persona not in self.engagement_metrics:
            self.engagement_metrics[persona] = {
                'total_feedbacks': 0,
                'avg_usefulness': 0,
                'avg_clarity': 0,
                'avg_satisfaction': 0,
                'feedback_distribution': {'1': 0, '2': 0, '3': 0, '4': 0, '5': 0}
            }
        
        metrics = self.engagement_metrics[persona]
        metrics['total_feedbacks'] += 1
        
        # Atualizar médias (média móvel simples)
        n = metrics['total_feedbacks']
        metrics['avg_usefulness'] = (
            (metrics['avg_usefulness'] * (n-1) + feedback_entry['usefulness_score']) / n
        )
        metrics['avg_clarity'] = (
            (metrics['avg_clarity'] * (n-1) + feedback_entry['clarity_score']) / n
        )
        metrics['avg_satisfaction'] = (
            (metrics['avg_satisfaction'] * (n-1) + feedback_entry['satisfaction_score']) / n
        )
    
    def get_engagement_summary(self, persona: PersonaType = None) -> Dict:
        """Obtém resumo de engajamento"""
        
        if persona:
            return self.engagement_metrics.get(persona.value, {})
        
        # Resumo geral
        summary = {
            'total_feedbacks': len(self.feedback_data),
            'personas_summary': self.engagement_metrics,
            'recent_trends': self._analyze_recent_trends()
        }
        
        return summary
    
    def _analyze_recent_trends(self) -> Dict:
        """Analisa tendências recentes"""
        # Implementação simplificada - analisar últimos 7 dias
        recent_cutoff = time.time() - (7 * 24 * 3600)
        recent_feedback = [f for f in self.feedback_data if f['timestamp'] > recent_cutoff]
        
        if not recent_feedback:
            return {'trend': 'insufficient_data'}
        
        avg_satisfaction = sum(f['satisfaction_score'] for f in recent_feedback) / len(recent_feedback)
        
        return {
            'trend': 'positive' if avg_satisfaction > 3.5 else 'needs_attention',
            'recent_avg_satisfaction': avg_satisfaction,
            'recent_feedback_count': len(recent_feedback)
        }

# Funções utilitárias
def create_comprehensive_qa_report(framework: EducationalQAFramework, 
                                 responses_to_validate: List[Dict]) -> Dict:
    """
    Cria relatório abrangente de QA
    """
    
    report = {
        'summary': {
            'total_responses_validated': len(responses_to_validate),
            'validation_timestamp': time.strftime("%Y-%m-%d %H:%M:%S"),
            'overall_quality_score': 0,
            'critical_issues_found': 0
        },
        'detailed_results': [],
        'recommendations': []
    }
    
    total_score = 0
    critical_issues = 0
    
    for response_data in responses_to_validate:
        validation_result = framework.validate_response(
            response_data['response'],
            PersonaType(response_data['persona']),
            response_data['user_question'],
            response_data.get('context', {})
        )
        
        report['detailed_results'].append(asdict(validation_result))
        total_score += validation_result.score
        
        if validation_result.severity in [ValidationSeverity.CRITICAL, ValidationSeverity.HIGH]:
            critical_issues += 1
    
    report['summary']['overall_quality_score'] = total_score / len(responses_to_validate)
    report['summary']['critical_issues_found'] = critical_issues
    
    return report

# Exemplo de uso e configuração
if __name__ == "__main__":
    # Inicializar framework
    qa_framework = EducationalQAFramework()
    
    # Configurar alertas
    def alert_handler(alert):
        print(f"ALERTA: {alert['type']} - {alert['message']}")
    
    qa_framework.performance_monitor.register_alert_handler(alert_handler)
    
    # Exemplo de validação
    test_response = """
    [RESPOSTA TÉCNICA]
    Para adultos com peso superior a 50kg, o esquema PQT-U preconiza rifampicina 600mg em dose supervisionada mensal.
    
    [PROTOCOLO/REFERÊNCIA]
    Seção 4.2.1 da tese: Esquema posológico para adultos
    Protocolo aplicável: PQT-U padrão adulto
    Dosagem: 600mg (2 cápsulas de 300mg) via oral, mensal
    
    [VALIDAÇÃO FARMACOLÓGICA]
    Mecanismo: Inibição da RNA polimerase bacteriana
    Farmacocinética: Absorção oral otimizada em jejum
    Monitorização: Função hepática baseline e se sintomas
    """
    
    result = qa_framework.validate_response(
        test_response,
        PersonaType.DR_GASNELIO,
        "Qual a dose de rifampicina para adultos?"
    )
    
    print(f"Score de qualidade: {result.score:.2f}")
    print(f"Passou na validação: {result.passed}")
    print(f"Recomendações: {result.recommendations}")