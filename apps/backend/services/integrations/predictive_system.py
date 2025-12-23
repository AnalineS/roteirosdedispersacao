#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Sistema de Análise Preditiva - Hanseníase RAG
Implementação de sugestões contextuais inteligentes
Seguindo FASE 4.1 do PLANO Q2 2025 - IA e Machine Learning
"""

import json
import logging
import hashlib
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from collections import defaultdict, Counter
from dataclasses import dataclass
from pathlib import Path

# Importações locais
from app_config import config

@dataclass
class UserContext:
    """Contexto do usuário para análise preditiva"""
    session_id: str
    persona_preference: str  # 'dr_gasnelio', 'ga_empathetic', 'mixed'
    query_history: List[str]
    interaction_patterns: Dict[str, Any]
    medical_interests: List[str]
    complexity_preference: str  # 'technical', 'simple', 'adaptive'
    last_activity: datetime
    
@dataclass
class PredictionRule:
    """Regra de predição contextual"""
    rule_id: str
    trigger_pattern: str
    suggestion_template: str
    context_requirements: List[str]
    confidence_threshold: float
    persona_specific: Optional[str] = None
    medical_category: Optional[str] = None

@dataclass
class Suggestion:
    """Sugestão preditiva gerada"""
    suggestion_id: str
    text: str
    confidence: float
    category: str
    persona: str
    context_match: List[str]
    created_at: datetime
    expires_at: Optional[datetime] = None

class ContextAnalyzer:
    """Analisador de contexto médico"""
    
    def __init__(self):
        self.medical_terms = self._load_medical_terms()
        self.category_patterns = self._load_category_patterns()
        
    def _load_medical_terms(self) -> Dict[str, List[str]]:
        """Carregar termos médicos por categoria"""
        return {
            'medicamentos': [
                'rifampicina', 'dapsona', 'clofazimina', 'pqt', 'poliquimioterapia',
                'dose', 'dosagem', 'administração', 'posologia'
            ],
            'sintomas': [
                'lesão', 'mancha', 'dormência', 'formigamento', 'perda de sensibilidade',
                'neuropatia', 'reação', 'neurite'
            ],
            'tratamento': [
                'terapia', 'tratamento', 'cura', 'acompanhamento', 'monitoramento',
                'supervisão', 'adesão'
            ],
            'diagnostico': [
                'diagnóstico', 'baciloscopia', 'biópsia', 'teste', 'exame',
                'confirmação', 'suspeita'
            ],
            'prevencao': [
                'prevenção', 'profilaxia', 'contato', 'transmissão', 'contágio',
                'isolamento', 'cuidados'
            ]
        }
    
    def _load_category_patterns(self) -> Dict[str, List[str]]:
        """Padrões regex por categoria"""
        return {
            'dosage_query': [
                r'quanto.*\b(dose|dosagem|quantidade)\b',
                r'qual.*\b(dose|dosagem)\b',
                r'como.*\b(tomar|administrar|dar)\b',
                r'\b(dose|mg|ml|comprimido)\b.*\b(dia|semana|mês)\b'
            ],
            'side_effects': [
                r'efeito.*\b(colateral|adverso)\b',
                r'\b(reação|problema|sintoma)\b.*\b(medicamento|remédio)\b',
                r'pode.*\b(causar|provocar)\b'
            ],
            'duration_query': [
                r'quanto.*tempo.*\b(tratamento|terapia)\b',
                r'duração.*\b(tratamento|medicação)\b',
                r'até.*quando.*\b(tomar|continuar)\b'
            ],
            'emergency': [
                r'\b(urgente|emergência|grave|sério)\b',
                r'preciso.*\b(ajuda|socorro)\b',
                r'\b(dor|problema)\b.*\b(forte|intenso|grave)\b'
            ]
        }
    
    def analyze_query(self, query: str) -> Dict[str, Any]:
        """Analisar query e extrair contexto"""
        query_lower = query.lower()
        
        analysis = {
            'medical_categories': [],
            'query_patterns': [],
            'complexity_indicators': [],
            'urgency_level': 'normal',
            'persona_hints': []
        }
        
        # Detectar categorias médicas - otimizado com list comprehension
        analysis['medical_categories'] = [
            category for category, terms in self.medical_terms.items()
            if any(term in query_lower for term in terms)
        ]
        
        # Detectar padrões de query - otimizado com list comprehension
        analysis['query_patterns'] = [
            pattern_type for pattern_type, patterns in self.category_patterns.items()
            if any(re.search(pattern, query_lower) for pattern in patterns)
        ]
        
        # Detectar complexidade
        technical_indicators = ['mecanismo', 'farmacocinética', 'bioequivalência', 'metabolismo']
        simple_indicators = ['como', 'o que é', 'pode explicar', 'simples']
        
        if any(indicator in query_lower for indicator in technical_indicators):
            analysis['complexity_indicators'].append('technical')
            analysis['persona_hints'].append('dr_gasnelio')
        
        if any(indicator in query_lower for indicator in simple_indicators):
            analysis['complexity_indicators'].append('simple')
            analysis['persona_hints'].append('ga_empathetic')
        
        # Detectar urgência
        if 'emergency' in analysis['query_patterns']:
            analysis['urgency_level'] = 'high'
        
        return analysis

class PredictiveCache:
    """Cache inteligente para sugestões"""
    
    def __init__(self, max_size: int = 1000, ttl_hours: int = 24):
        self.cache: Dict[str, Suggestion] = {}
        self.access_patterns: Dict[str, int] = defaultdict(int)
        self.max_size = max_size
        self.ttl = timedelta(hours=ttl_hours)
        
    def _generate_cache_key(self, context: UserContext, query_context: Dict[str, Any]) -> str:
        """Gerar chave única para cache"""
        key_data = {
            'persona': context.persona_preference,
            'categories': sorted(query_context.get('medical_categories', [])),
            'patterns': sorted(query_context.get('query_patterns', [])),
            'complexity': context.complexity_preference
        }
        
        key_str = json.dumps(key_data, sort_keys=True)
        return hashlib.sha256(key_str.encode()).hexdigest()[:16]
    
    def get(self, cache_key: str) -> Optional[Suggestion]:
        """Recuperar sugestão do cache"""
        if cache_key in self.cache:
            suggestion = self.cache[cache_key]
            
            # Verificar expiração
            if suggestion.expires_at and datetime.now() > suggestion.expires_at:
                del self.cache[cache_key]
                return None
            
            # Registrar acesso
            self.access_patterns[cache_key] += 1
            return suggestion
        
        return None
    
    def put(self, cache_key: str, suggestion: Suggestion):
        """Armazenar sugestão no cache"""
        # Limpeza por LRU se necessário
        if len(self.cache) >= self.max_size:
            self._evict_lru()
        
        # Definir expiração se não definida
        if suggestion.expires_at is None:
            suggestion.expires_at = datetime.now() + self.ttl
        
        self.cache[cache_key] = suggestion
    
    def _evict_lru(self):
        """Remover itens menos utilizados"""
        # Ordenar por padrão de acesso
        sorted_keys = sorted(
            self.cache.keys(),
            key=lambda k: self.access_patterns.get(k, 0)
        )
        
        # Remover 20% dos itens menos acessados - otimizado
        items_to_remove = max(1, len(sorted_keys) // 5)
        keys_to_remove = sorted_keys[:items_to_remove]
        
        # Usar bulk delete para melhor performance
        for key in keys_to_remove:
            self.cache.pop(key, None)
            self.access_patterns.pop(key, None)
    
    def get_cache_stats(self) -> Dict[str, Any]:
        """Estatísticas do cache"""
        return {
            'total_items': len(self.cache),
            'max_size': self.max_size,
            'top_accessed': sorted(
                self.access_patterns.items(),
                key=lambda x: x[1],
                reverse=True
            )[:10]
        }

class InteractionTracker:
    """Rastreamento de interações do usuário"""
    
    def __init__(self, storage_path: str):
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)
        
        self.interactions_file = self.storage_path / "interactions.json"
        self.patterns_file = self.storage_path / "patterns.json"
        
        self.interactions: List[Dict[str, Any]] = self._load_interactions()
        self.user_patterns: Dict[str, Dict[str, Any]] = self._load_patterns()
        
    def _load_interactions(self) -> List[Dict[str, Any]]:
        """Carregar histórico de interações"""
        if self.interactions_file.exists():
            try:
                with open(self.interactions_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                logging.warning(f"Erro ao carregar interações: {e}")
        
        return []
    
    def _load_patterns(self) -> Dict[str, Dict[str, Any]]:
        """Carregar padrões de usuário"""
        if self.patterns_file.exists():
            try:
                with open(self.patterns_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception as e:
                logging.warning(f"Erro ao carregar padrões: {e}")
        
        return {}
    
    def track_interaction(
        self, 
        session_id: str, 
        query: str, 
        suggestions: List[Suggestion],
        selected_suggestion: Optional[str] = None,
        persona_used: str = "mixed",
        satisfaction_score: Optional[float] = None
    ):
        """Registrar interação do usuário"""
        interaction = {
            'timestamp': datetime.now().isoformat(),
            'session_id': session_id,
            'query': query,
            'suggestions_offered': [
                {
                    'id': s.suggestion_id,
                    'text': s.text,
                    'confidence': s.confidence,
                    'category': s.category
                } for s in suggestions
            ],
            'selected_suggestion': selected_suggestion,
            'persona_used': persona_used,
            'satisfaction_score': satisfaction_score
        }
        
        self.interactions.append(interaction)
        
        # Atualizar padrões do usuário
        self._update_user_patterns(session_id, interaction)
        
        # Salvar periodicamente
        if len(self.interactions) % 10 == 0:
            self._save_data()
    
    def _update_user_patterns(self, session_id: str, interaction: Dict[str, Any]):
        """Atualizar padrões do usuário"""
        if session_id not in self.user_patterns:
            self.user_patterns[session_id] = {
                'total_interactions': 0,
                'persona_preferences': defaultdict(int),
                'category_interests': defaultdict(int),
                'satisfaction_average': 0.0,
                'suggestion_click_rate': 0.0,
                'last_active': None
            }
        
        pattern = self.user_patterns[session_id]
        pattern['total_interactions'] += 1
        pattern['persona_preferences'][interaction['persona_used']] += 1
        pattern['last_active'] = interaction['timestamp']
        
        # Calcular taxa de clique em sugestões
        if interaction['selected_suggestion']:
            pattern['suggestion_click_rate'] = (
                pattern.get('suggestion_click_rate', 0) * 0.9 + 0.1
            )  # Moving average
        
        # Atualizar satisfação média
        if interaction.get('satisfaction_score'):
            current_avg = pattern.get('satisfaction_average', 0.0)
            total = pattern['total_interactions']
            pattern['satisfaction_average'] = (
                current_avg * (total - 1) + interaction['satisfaction_score']
            ) / total
    
    def get_user_context(self, session_id: str) -> UserContext:
        """Obter contexto do usuário"""
        patterns = self.user_patterns.get(session_id, {})
        
        # Determinar persona preferida
        persona_prefs = patterns.get('persona_preferences', {})
        preferred_persona = max(persona_prefs, key=persona_prefs.get) if persona_prefs else 'mixed'
        
        # Obter histórico recente de queries
        recent_interactions = [
            i for i in self.interactions[-50:]  # Últimas 50
            if i['session_id'] == session_id
        ]
        
        query_history = [i['query'] for i in recent_interactions]
        
        # Determinar preferência de complexidade
        satisfaction = patterns.get('satisfaction_average', 0.5)
        complexity_pref = 'technical' if satisfaction > 0.7 and preferred_persona == 'dr_gasnelio' else 'simple'
        
        return UserContext(
            session_id=session_id,
            persona_preference=preferred_persona,
            query_history=query_history[-10:],  # Últimas 10 queries
            interaction_patterns=patterns,
            medical_interests=list(patterns.get('category_interests', {}).keys()),
            complexity_preference=complexity_pref,
            last_activity=datetime.now()
        )
    
    def _save_data(self):
        """Salvar dados no disco"""
        try:
            with open(self.interactions_file, 'w', encoding='utf-8') as f:
                json.dump(self.interactions, f, ensure_ascii=False, indent=2, default=str)
            
            # Converter defaultdicts para dicts normais para serialização
            patterns_serializable = {}
            for session_id, pattern in self.user_patterns.items():
                patterns_serializable[session_id] = dict(pattern)
            
            with open(self.patterns_file, 'w', encoding='utf-8') as f:
                json.dump(patterns_serializable, f, ensure_ascii=False, indent=2, default=str)
                
        except Exception as e:
            logging.error(f"Erro ao salvar dados de interação: {e}")
    
    def get_analytics(self) -> Dict[str, Any]:
        """Obter analytics das interações"""
        total_interactions = len(self.interactions)
        
        if total_interactions == 0:
            return {'total_interactions': 0}
        
        # Análise temporal
        recent_interactions = [
            i for i in self.interactions
            if datetime.fromisoformat(i['timestamp']) > datetime.now() - timedelta(days=7)
        ]
        
        # Análise de personas
        persona_usage = Counter(i['persona_used'] for i in self.interactions)
        
        # Taxa de clique em sugestões
        interactions_with_selection = [
            i for i in self.interactions if i.get('selected_suggestion')
        ]
        click_rate = len(interactions_with_selection) / total_interactions
        
        # Satisfação média
        satisfaction_scores = [
            i['satisfaction_score'] for i in self.interactions 
            if i.get('satisfaction_score') is not None
        ]
        avg_satisfaction = sum(satisfaction_scores) / len(satisfaction_scores) if satisfaction_scores else 0.0
        
        return {
            'total_interactions': total_interactions,
            'recent_interactions_7d': len(recent_interactions),
            'persona_usage': dict(persona_usage),
            'suggestion_click_rate': click_rate,
            'average_satisfaction': avg_satisfaction,
            'active_sessions': len(self.user_patterns),
            'top_categories': self._get_top_categories()
        }
    
    def _get_top_categories(self) -> List[Tuple[str, int]]:
        """Obter categorias mais populares"""
        category_counts = defaultdict(int)
        
        for pattern in self.user_patterns.values():
            for category, count in pattern.get('category_interests', {}).items():
                category_counts[category] += count
        
        return sorted(category_counts.items(), key=lambda x: x[1], reverse=True)[:10]

class PredictiveEngine:
    """Motor principal de análise preditiva"""
    
    def __init__(self):
        self.context_analyzer = ContextAnalyzer()
        self.cache = PredictiveCache()
        
        # Configurar storage para tracking
        storage_path = Path(config.VECTOR_DB_PATH).parent / "predictive_analytics"
        self.tracker = InteractionTracker(str(storage_path))
        
        # Carregar regras de predição
        self.rules = self._load_prediction_rules()
        
        logging.info("PredictiveEngine inicializado")
    
    def _load_prediction_rules(self) -> List[PredictionRule]:
        """Carregar regras de predição contextuais"""
        return [
            # Regras para dosagem
            PredictionRule(
                rule_id="dosage_follow_up",
                trigger_pattern="dosage_query",
                suggestion_template="Você gostaria de saber sobre {topic}?",
                context_requirements=["medicamentos"],
                confidence_threshold=0.8,
                persona_specific="dr_gasnelio",
                medical_category="medicamentos"
            ),
            
            # Regras para efeitos colaterais
            PredictionRule(
                rule_id="side_effects_info",
                trigger_pattern="side_effects",
                suggestion_template="Posso explicar mais sobre {topic}",
                context_requirements=["medicamentos"],
                confidence_threshold=0.7,
                persona_specific="ga_empathetic",
                medical_category="tratamento"
            ),
            
            # Regras para emergência
            PredictionRule(
                rule_id="emergency_guidance",
                trigger_pattern="emergency",
                suggestion_template="Em casos urgentes, recomendo {action}",
                context_requirements=[],
                confidence_threshold=0.9,
                persona_specific=None,
                medical_category="prevencao"
            ),
            
            # Regras de follow-up
            PredictionRule(
                rule_id="treatment_follow_up",
                trigger_pattern="duration_query",
                suggestion_template="Também é importante saber sobre {related_topic}",
                context_requirements=["tratamento"],
                confidence_threshold=0.6,
                persona_specific=None,
                medical_category="tratamento"
            )
        ]
    
    def get_suggestions(
        self, 
        session_id: str, 
        current_query: str, 
        persona_context: str = "mixed",
        max_suggestions: int = 3
    ) -> List[Suggestion]:
        """Gerar sugestões preditivas baseadas no contexto"""
        
        # Obter contexto do usuário
        user_context = self.tracker.get_user_context(session_id)
        user_context.persona_preference = persona_context  # Override com contexto atual
        
        # Analisar query atual
        query_analysis = self.context_analyzer.analyze_query(current_query)
        
        # Verificar cache primeiro
        cache_key = self.cache._generate_cache_key(user_context, query_analysis)
        cached_suggestion = self.cache.get(cache_key)
        
        if cached_suggestion:
            return [cached_suggestion]
        
        # Gerar novas sugestões
        suggestions = self._generate_suggestions(user_context, query_analysis, max_suggestions)
        
        # Armazenar no cache
        if suggestions:
            self.cache.put(cache_key, suggestions[0])
        
        return suggestions
    
    def _generate_suggestions(
        self, 
        user_context: UserContext, 
        query_analysis: Dict[str, Any],
        max_suggestions: int
    ) -> List[Suggestion]:
        """Gerar sugestões baseadas em regras e contexto"""
        
        suggestions = []
        
        # Aplicar regras de predição - otimizado com filter + map
        suggestions = [
            suggestion for suggestion in map(
                lambda rule: self._apply_rule(rule, user_context, query_analysis),
                self.rules
            ) if suggestion is not None
        ]
        
        # Adicionar sugestões baseadas em histórico
        history_suggestions = self._generate_history_based_suggestions(user_context, query_analysis)
        suggestions.extend(history_suggestions)
        
        # Ordenar por confiança e relevância
        suggestions.sort(key=lambda s: s.confidence, reverse=True)
        
        return suggestions[:max_suggestions]
    
    def _apply_rule(
        self, 
        rule: PredictionRule, 
        user_context: UserContext,
        query_analysis: Dict[str, Any]
    ) -> Optional[Suggestion]:
        """Aplicar regra específica de predição"""
        
        # Verificar se o padrão se aplica
        if rule.trigger_pattern not in query_analysis.get('query_patterns', []):
            return None
        
        # Verificar requisitos de contexto
        medical_categories = query_analysis.get('medical_categories', [])
        if rule.context_requirements:
            if not any(req in medical_categories for req in rule.context_requirements):
                return None
        
        # Verificar compatibilidade de persona
        if rule.persona_specific:
            if (user_context.persona_preference != rule.persona_specific and 
                user_context.persona_preference != 'mixed'):
                return None
        
        # Calcular confiança baseada no contexto
        confidence = self._calculate_confidence(rule, user_context, query_analysis)
        
        if confidence < rule.confidence_threshold:
            return None
        
        # Gerar texto da sugestão
        suggestion_text = self._generate_suggestion_text(rule, query_analysis)
        
        return Suggestion(
            suggestion_id=f"{rule.rule_id}_{datetime.now().timestamp()}",
            text=suggestion_text,
            confidence=confidence,
            category=rule.medical_category or 'general',
            persona=rule.persona_specific or user_context.persona_preference,
            context_match=[rule.trigger_pattern],
            created_at=datetime.now()
        )
    
    def _calculate_confidence(
        self, 
        rule: PredictionRule,
        user_context: UserContext,
        query_analysis: Dict[str, Any]
    ) -> float:
        """Calcular confiança da predição"""
        base_confidence = 0.5
        
        # Boost por correspondência de categoria
        if rule.medical_category in query_analysis.get('medical_categories', []):
            base_confidence += 0.2
        
        # Boost por preferência de persona
        if rule.persona_specific == user_context.persona_preference:
            base_confidence += 0.15
        
        # Boost por histórico de interações
        interaction_patterns = user_context.interaction_patterns
        if interaction_patterns.get('total_interactions', 0) > 5:
            satisfaction = interaction_patterns.get('satisfaction_average', 0.5)
            base_confidence += (satisfaction - 0.5) * 0.2
        
        # Penalidade por falta de contexto
        if not query_analysis.get('medical_categories'):
            base_confidence -= 0.1
        
        return min(1.0, max(0.0, base_confidence))
    
    def _generate_suggestion_text(
        self, 
        rule: PredictionRule,
        query_analysis: Dict[str, Any]
    ) -> str:
        """Gerar texto da sugestão baseado na regra"""
        
        # Templates específicos por tipo de regra
        templates = {
            'dosage_follow_up': [
                "Gostaria de saber sobre possíveis efeitos colaterais?",
                "Tem dúvidas sobre horários de administração?",
                "Precisa de informações sobre interações medicamentosas?"
            ],
            'side_effects_info': [
                "Posso explicar como minimizar os efeitos colaterais",
                "Você gostaria de saber quando procurar ajuda médica?",
                "Tem interesse em conhecer sinais de alerta?"
            ],
            'emergency_guidance': [
                "Em casos urgentes, procure atendimento médico imediato",
                "Conheça os sinais de emergência relacionados ao tratamento",
                "Tem o contato de emergência do seu médico?"
            ],
            'treatment_follow_up': [
                "Importante manter regularidade no tratamento",
                "Gostaria de dicas para não esquecer a medicação?",
                "Tem dúvidas sobre o acompanhamento médico?"
            ]
        }
        
        rule_templates = templates.get(rule.rule_id, [rule.suggestion_template])
        
        # Selecionar template baseado no contexto
        import random
        return random.choice(rule_templates)
    
    def _generate_history_based_suggestions(
        self, 
        user_context: UserContext,
        query_analysis: Dict[str, Any]
    ) -> List[Suggestion]:
        """Gerar sugestões baseadas no histórico do usuário"""
        
        suggestions = []
        
        # Analisar padrões de queries anteriores - otimizado com functional approach
        if len(user_context.query_history) >= 2:
            # Detectar progressão natural de perguntas com list comprehension otimizada
            recent_categories = [
                category
                for query in user_context.query_history[-3:]
                for category in self.context_analyzer.analyze_query(query).get('medical_categories', [])
            ]
            
            # Sugerir próximo tópico lógico
            category_progression = {
                'medicamentos': ['tratamento', 'prevencao'],
                'sintomas': ['diagnostico', 'medicamentos'],
                'diagnostico': ['tratamento', 'medicamentos'],
                'tratamento': ['prevencao', 'medicamentos'],
                'prevencao': ['sintomas', 'diagnostico']
            }
            
            # Gerar sugestões usando functional programming otimizado
            unique_categories = set(recent_categories)
            suggestions = [
                Suggestion(
                    suggestion_id=f"history_{topic}_{datetime.now().timestamp()}",
                    text=f"Você também pode ter interesse em saber sobre {topic}",
                    confidence=0.6,
                    category=topic,
                    persona=user_context.persona_preference,
                    context_match=['history_pattern'],
                    created_at=datetime.now()
                )
                for category in unique_categories
                for topic in category_progression.get(category, [])
                if topic not in recent_categories
            ]
        
        return suggestions[:2]  # Máximo 2 sugestões baseadas em histórico
    
    def track_suggestion_interaction(
        self,
        session_id: str,
        query: str,
        suggestions: List[Suggestion],
        selected_suggestion_id: Optional[str] = None,
        persona_used: str = "mixed",
        satisfaction_score: Optional[float] = None
    ):
        """Registrar interação com sugestões"""
        self.tracker.track_interaction(
            session_id=session_id,
            query=query,
            suggestions=suggestions,
            selected_suggestion=selected_suggestion_id,
            persona_used=persona_used,
            satisfaction_score=satisfaction_score
        )
    
    def get_analytics_dashboard(self) -> Dict[str, Any]:
        """Obter dados para dashboard de analytics"""
        tracker_analytics = self.tracker.get_analytics()
        cache_stats = self.cache.get_cache_stats()
        
        return {
            'interaction_analytics': tracker_analytics,
            'cache_performance': cache_stats,
            'prediction_rules': len(self.rules),
            'system_health': {
                'cache_hit_rate': len(cache_stats.get('top_accessed', [])) / max(1, cache_stats['total_items']),
                'active_sessions': tracker_analytics.get('active_sessions', 0),
                'avg_suggestions_per_query': 2.5,  # Placeholder - calcular dinamicamente
            }
        }

# Instância global
_predictive_engine: Optional[PredictiveEngine] = None

def get_predictive_engine() -> PredictiveEngine:
    """Obter instância global do motor preditivo"""
    global _predictive_engine
    
    if _predictive_engine is None:
        _predictive_engine = PredictiveEngine()
    
    return _predictive_engine

def is_predictive_system_available() -> bool:
    """Verificar se sistema preditivo está disponível"""
    try:
        engine = get_predictive_engine()
        return engine is not None
    except Exception as e:
        logging.error(f"Erro ao verificar sistema preditivo: {e}")
        return False