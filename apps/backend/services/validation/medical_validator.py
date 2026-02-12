# -*- coding: utf-8 -*-
"""
Medical Response Validator - Rule-based validation for medical responses
Validates accuracy, citations, and safety of AI-generated medical content
about hanseniase (leprosy) PQT-U treatment.
"""

import json
import re
import logging
from pathlib import Path
from typing import Optional

logger = logging.getLogger(__name__)

# Resolve data directory relative to project root
_BACKEND_ROOT = Path(__file__).parent.parent.parent
_DATA_DIR = _BACKEND_ROOT.parent / 'data' / 'structured'


def _load_json(filename: str) -> dict:
    """Load a JSON file from the structured data directory."""
    filepath = _DATA_DIR / filename
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        logger.warning("Data file not found: %s", filepath)
        return {}
    except json.JSONDecodeError as e:
        logger.error("Invalid JSON in %s: %s", filepath, e)
        return {}


class MedicalResponseValidator:
    """Rule-based validator for medical responses about hanseniase PQT-U."""

    # Core PQT-U medications
    VALID_MEDICATIONS = ['rifampicina', 'clofazimina', 'dapsona']

    # Known valid dose ranges (mg) per medication
    VALID_DOSE_RANGES = {
        'rifampicina': {'min': 150, 'max': 600},
        'clofazimina': {'min': 50, 'max': 300},
        'dapsona': {'min': 25, 'max': 100},
    }

    # Trusted source patterns
    TRUSTED_SOURCES = [
        r'pcdt',
        r'minist[eé]rio\s+da\s+sa[uú]de',
        r'protocolo\s+cl[ií]nico',
        r'diretrizes\s+terap[eê]uticas',
        r'anvisa',
        r'oms',
        r'who',
        r'sus',
    ]

    # Safety keywords that should be present
    SAFETY_INDICATORS = [
        r'profissional\s+de\s+sa[uú]de',
        r'consulte\s+(seu\s+)?m[eé]dico',
        r'farmac[eê]utico',
        r'acompanhamento',
        r'supervis[aã]o',
        r'orienta[cç][aã]o',
        r'prescri[cç][aã]o',
    ]

    # Dangerous patterns that should NOT be present
    DANGEROUS_PATTERNS = [
        r'pode\s+tomar\s+sem\s+prescri[cç][aã]o',
        r'automedica[cç][aã]o',
        r'n[aã]o\s+precisa\s+(de\s+)?m[eé]dico',
        r'tome\s+por\s+conta\s+pr[oó]pria',
    ]

    def __init__(self):
        self._protocols = _load_json('dosing_protocols.json')
        self._taxonomy = _load_json('clinical_taxonomy.json')
        self._pharma = _load_json('pharmacovigilance_guidelines.json')

    def validate_medical_accuracy(self, response_text: str) -> float:
        """
        Validate medical accuracy of the response.
        Checks medication names, dose ranges, and protocol adherence.
        Returns score 0.0 to 1.0.
        """
        if not response_text:
            return 0.0

        text_lower = response_text.lower()
        score_components = []

        # Check 1: Are valid PQT-U medications mentioned?
        meds_mentioned = [m for m in self.VALID_MEDICATIONS if m in text_lower]
        if meds_mentioned:
            score_components.append(min(len(meds_mentioned) / 2.0, 1.0))
        else:
            # If discussing hanseniase but no medications mentioned, lower score
            if 'hansen' in text_lower or 'pqt' in text_lower:
                score_components.append(0.3)
            else:
                score_components.append(0.5)

        # Check 2: Validate mentioned doses against protocol
        dose_pattern = re.compile(r'(\d+)\s*mg')
        mentioned_doses = [int(d) for d in dose_pattern.findall(text_lower)]

        if mentioned_doses:
            valid_doses = 0
            for dose in mentioned_doses:
                for med, ranges in self.VALID_DOSE_RANGES.items():
                    if med in text_lower and ranges['min'] <= dose <= ranges['max']:
                        valid_doses += 1
                        break
            if mentioned_doses:
                score_components.append(min(valid_doses / len(mentioned_doses), 1.0))
        else:
            score_components.append(0.7)

        # Check 3: No dangerous misinformation
        has_dangerous = any(
            re.search(p, text_lower) for p in self.DANGEROUS_PATTERNS
        )
        score_components.append(0.0 if has_dangerous else 1.0)

        # Check 4: Treatment duration mentioned correctly
        duration_patterns = [
            r'6\s*meses.*paucibacilar',
            r'12\s*meses.*multibacilar',
            r'paucibacilar.*6\s*meses',
            r'multibacilar.*12\s*meses',
        ]
        duration_correct = any(
            re.search(p, text_lower) for p in duration_patterns
        )
        if duration_correct:
            score_components.append(1.0)
        elif any(d in text_lower for d in ['meses', 'mês', 'mes']):
            score_components.append(0.6)

        if not score_components:
            return 0.5

        return round(sum(score_components) / len(score_components), 2)

    def validate_citation_quality(self, response_text: str, sources: Optional[list] = None) -> float:
        """
        Validate citation quality of the response.
        Returns score 0.0 to 1.0.
        """
        if not response_text:
            return 0.0

        text_lower = response_text.lower()
        score_components = []

        # Check 1: Are trusted sources referenced in text?
        trusted_refs = sum(
            1 for p in self.TRUSTED_SOURCES if re.search(p, text_lower)
        )
        score_components.append(min(trusted_refs / 2.0, 1.0))

        # Check 2: External sources list provided?
        if sources:
            valid_sources = 0
            for src in sources:
                src_lower = str(src).lower() if src else ''
                if any(re.search(p, src_lower) for p in self.TRUSTED_SOURCES):
                    valid_sources += 1
                elif 'gov.br' in src_lower or 'saude' in src_lower:
                    valid_sources += 1
            score_components.append(min(valid_sources / max(len(sources), 1), 1.0))
        else:
            score_components.append(0.3)

        # Check 3: Year/date references (indicates currency)
        year_pattern = re.compile(r'20[12]\d')
        has_recent_year = bool(year_pattern.search(response_text))
        score_components.append(0.8 if has_recent_year else 0.4)

        if not score_components:
            return 0.3

        return round(sum(score_components) / len(score_components), 2)

    def validate_safety(self, response_text: str) -> float:
        """
        Validate safety aspects of the response.
        Returns score 0.0 to 1.0.
        """
        if not response_text:
            return 0.0

        text_lower = response_text.lower()
        score_components = []

        # Check 1: Safety indicators present
        safety_found = sum(
            1 for p in self.SAFETY_INDICATORS if re.search(p, text_lower)
        )
        score_components.append(min(safety_found / 2.0, 1.0))

        # Check 2: No dangerous self-medication recommendations
        has_dangerous = any(
            re.search(p, text_lower) for p in self.DANGEROUS_PATTERNS
        )
        score_components.append(0.0 if has_dangerous else 1.0)

        # Check 3: Adverse effects awareness
        adverse_keywords = [
            'efeito', 'adverso', 'colateral', 'rea[cç][aã]o',
            'alergia', 'hepato', 'coloração', 'alaranjad',
        ]
        mentions_adverse = any(
            re.search(k, text_lower) for k in adverse_keywords
        )
        if mentions_adverse:
            score_components.append(0.9)

        # Check 4: Not overly alarming
        alarm_patterns = [
            r'vai\s+morrer',
            r'risco\s+de\s+morte\s+iminente',
            r'pare\s+imediatamente\s+o\s+tratamento',
        ]
        is_alarming = any(re.search(p, text_lower) for p in alarm_patterns)
        score_components.append(0.2 if is_alarming else 1.0)

        if not score_components:
            return 0.5

        return round(sum(score_components) / len(score_components), 2)

    def validate_response(self, response_text: str, sources: Optional[list] = None) -> dict:
        """
        Run all validators and return comprehensive validation result.
        """
        medical_accuracy = self.validate_medical_accuracy(response_text)
        citation_quality = self.validate_citation_quality(response_text, sources)
        safety_score = self.validate_safety(response_text)

        overall = round((medical_accuracy + citation_quality + safety_score) / 3, 2)

        # Determine compliance level
        if overall >= 0.8:
            compliance_level = 'high'
        elif overall >= 0.6:
            compliance_level = 'medium'
        else:
            compliance_level = 'low'

        # Generate recommendations
        recommendations = []
        if medical_accuracy < 0.7:
            recommendations.append('Incluir medicamentos PQT-U especificos (rifampicina, clofazimina, dapsona)')
        if citation_quality < 0.7:
            recommendations.append('Adicionar referencias ao PCDT Hanseniase 2022 do Ministerio da Saude')
        if safety_score < 0.7:
            recommendations.append('Incluir orientacao para consultar profissional de saude')

        return {
            'medical_accuracy': medical_accuracy,
            'citation_quality': citation_quality,
            'safety_score': safety_score,
            'overall_score': overall,
            'compliance_level': compliance_level,
            'recommendations': recommendations,
            'validated': overall >= 0.6,
        }
