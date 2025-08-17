# -*- coding: utf-8 -*-
"""
Predictions Blueprint - Sistema de Análise Preditiva
Endpoints para sugestões contextuais e analytics
"""

import logging
from flask import Blueprint, request, jsonify, session
from datetime import datetime
from typing import Dict, Any, List, Optional

# Importações locais
from core.security.enhanced_security import SecurityFramework
from core.performance.cache_manager import CacheManager
from services.predictive_system import get_predictive_engine, is_predictive_system_available

# Configurar blueprint
predictions_bp = Blueprint('predictions', __name__, url_prefix='/api/predictions')
logger = logging.getLogger(__name__)

# Inicializar componentes
security = SecurityFramework()
cache_manager = CacheManager()

@predictions_bp.route('/suggestions', methods=['POST'])
@security.require_rate_limit("predictions", "30/hour")
@security.sanitize_request
def get_suggestions():
    """
    Obter sugestões preditivas baseadas no contexto
    
    Request Body:
    {
        "query": "string",
        "session_id": "string",
        "persona": "dr_gasnelio|ga_empathetic|mixed",
        "max_suggestions": 3
    }
    
    Response:
    {
        "suggestions": [
            {
                "id": "string",
                "text": "string", 
                "confidence": 0.85,
                "category": "string",
                "persona": "string"
            }
        ],
        "context": {
            "analyzed_categories": [],
            "query_patterns": [],
            "urgency_level": "normal"
        },
        "cache_hit": false
    }
    """
    
    try:
        # Validar se sistema está disponível
        if not is_predictive_system_available():
            return jsonify({
                "error": "Sistema preditivo não disponível",
                "suggestions": [],
                "fallback": True
            }), 503
        
        # Validar dados de entrada
        data = request.get_json()
        if not data:
            return jsonify({"error": "Dados JSON requeridos"}), 400
        
        query = data.get('query', '').strip()
        if not query:
            return jsonify({"error": "Query é obrigatória"}), 400
        
        session_id = data.get('session_id') or session.get('session_id', 'anonymous')
        persona = data.get('persona', 'mixed')
        max_suggestions = min(data.get('max_suggestions', 3), 5)  # Máximo 5
        
        # Validar persona
        valid_personas = ['dr_gasnelio', 'ga_empathetic', 'mixed']
        if persona not in valid_personas:
            persona = 'mixed'
        
        # Verificar cache primeiro
        cache_key = f"suggestions:{session_id}:{hash(query)}:{persona}"
        cached_result = cache_manager.get(cache_key)
        
        if cached_result:
            logger.info(f"Cache hit para sugestões: {session_id}")
            return jsonify({
                **cached_result,
                "cache_hit": True,
                "timestamp": datetime.now().isoformat()
            })
        
        # Obter motor preditivo
        engine = get_predictive_engine()
        
        # Gerar sugestões
        suggestions = engine.get_suggestions(
            session_id=session_id,
            current_query=query,
            persona_context=persona,
            max_suggestions=max_suggestions
        )
        
        # Analisar contexto da query
        context_analysis = engine.context_analyzer.analyze_query(query)
        
        # Preparar resposta
        response_data = {
            "suggestions": [
                {
                    "id": s.suggestion_id,
                    "text": s.text,
                    "confidence": round(s.confidence, 3),
                    "category": s.category,
                    "persona": s.persona,
                    "context_match": s.context_match
                } for s in suggestions
            ],
            "context": {
                "analyzed_categories": context_analysis.get('medical_categories', []),
                "query_patterns": context_analysis.get('query_patterns', []),
                "urgency_level": context_analysis.get('urgency_level', 'normal'),
                "complexity_indicators": context_analysis.get('complexity_indicators', [])
            },
            "cache_hit": False,
            "timestamp": datetime.now().isoformat()
        }
        
        # Armazenar no cache por 10 minutos
        cache_manager.set(cache_key, response_data, ttl=600)
        
        logger.info(f"Sugestões geradas para sessão {session_id}: {len(suggestions)} sugestões")
        
        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"Erro ao gerar sugestões: {e}")
        return jsonify({
            "error": "Erro interno do servidor",
            "suggestions": [],
            "fallback": True
        }), 500

@predictions_bp.route('/interaction', methods=['POST'])
@security.require_rate_limit("predictions", "100/hour")
@security.sanitize_request
def track_interaction():
    """
    Registrar interação do usuário com sugestões
    
    Request Body:
    {
        "session_id": "string",
        "query": "string",
        "suggestions_shown": ["suggestion_id_1", "suggestion_id_2"],
        "selected_suggestion": "suggestion_id_1",
        "persona_used": "dr_gasnelio",
        "satisfaction_score": 0.8
    }
    
    Response:
    {
        "success": true,
        "tracked": true,
        "updated_patterns": true
    }
    """
    
    try:
        if not is_predictive_system_available():
            return jsonify({"success": False, "error": "Sistema não disponível"}), 503
        
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "error": "Dados JSON requeridos"}), 400
        
        session_id = data.get('session_id') or session.get('session_id', 'anonymous')
        query = data.get('query', '').strip()
        suggestions_shown = data.get('suggestions_shown', [])
        selected_suggestion = data.get('selected_suggestion')
        persona_used = data.get('persona_used', 'mixed')
        satisfaction_score = data.get('satisfaction_score')
        
        # Validar satisfaction_score
        if satisfaction_score is not None:
            try:
                satisfaction_score = float(satisfaction_score)
                if not 0.0 <= satisfaction_score <= 1.0:
                    satisfaction_score = None
            except (ValueError, TypeError):
                satisfaction_score = None
        
        # Obter motor preditivo
        engine = get_predictive_engine()
        
        # Reconstruir objetos de sugestão (simplificado para tracking)
        from services.predictive_system import Suggestion
        
        suggestion_objects = []
        for suggestion_id in suggestions_shown:
            # Criar objeto placeholder para tracking
            suggestion_objects.append(Suggestion(
                suggestion_id=suggestion_id,
                text="[tracked]",
                confidence=0.5,
                category="unknown",
                persona=persona_used,
                context_match=[],
                created_at=datetime.now()
            ))
        
        # Registrar interação
        engine.track_suggestion_interaction(
            session_id=session_id,
            query=query,
            suggestions=suggestion_objects,
            selected_suggestion_id=selected_suggestion,
            persona_used=persona_used,
            satisfaction_score=satisfaction_score
        )
        
        logger.info(f"Interação registrada: {session_id}, seleção: {selected_suggestion}")
        
        return jsonify({
            "success": True,
            "tracked": True,
            "updated_patterns": True,
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Erro ao registrar interação: {e}")
        return jsonify({
            "success": False,
            "error": "Erro interno do servidor"
        }), 500

@predictions_bp.route('/context/<session_id>', methods=['GET'])
@security.require_rate_limit("predictions", "60/hour")
def get_user_context(session_id: str):
    """
    Obter contexto do usuário para personalização
    
    Response:
    {
        "context": {
            "persona_preference": "dr_gasnelio",
            "complexity_preference": "technical", 
            "medical_interests": ["medicamentos", "tratamento"],
            "interaction_stats": {
                "total_interactions": 15,
                "satisfaction_average": 0.85,
                "suggestion_click_rate": 0.6
            }
        },
        "recommendations": {
            "suggested_persona": "dr_gasnelio",
            "complexity_level": "technical"
        }
    }
    """
    
    try:
        if not is_predictive_system_available():
            return jsonify({"error": "Sistema não disponível"}), 503
        
        # Verificar cache
        cache_key = f"user_context:{session_id}"
        cached_context = cache_manager.get(cache_key)
        
        if cached_context:
            return jsonify({
                **cached_context,
                "cache_hit": True
            })
        
        # Obter motor preditivo
        engine = get_predictive_engine()
        
        # Obter contexto do usuário
        user_context = engine.tracker.get_user_context(session_id)
        
        # Preparar resposta
        response_data = {
            "context": {
                "persona_preference": user_context.persona_preference,
                "complexity_preference": user_context.complexity_preference,
                "medical_interests": user_context.medical_interests[:5],  # Top 5
                "interaction_stats": {
                    "total_interactions": user_context.interaction_patterns.get('total_interactions', 0),
                    "satisfaction_average": round(user_context.interaction_patterns.get('satisfaction_average', 0.0), 3),
                    "suggestion_click_rate": round(user_context.interaction_patterns.get('suggestion_click_rate', 0.0), 3)
                },
                "last_activity": user_context.last_activity.isoformat() if user_context.last_activity else None
            },
            "recommendations": {
                "suggested_persona": user_context.persona_preference,
                "complexity_level": user_context.complexity_preference
            },
            "cache_hit": False,
            "timestamp": datetime.now().isoformat()
        }
        
        # Cache por 5 minutos
        cache_manager.set(cache_key, response_data, ttl=300)
        
        return jsonify(response_data)
        
    except Exception as e:
        logger.error(f"Erro ao obter contexto do usuário: {e}")
        return jsonify({"error": "Erro interno do servidor"}), 500

@predictions_bp.route('/analytics', methods=['GET'])
@security.require_rate_limit("analytics", "10/hour")
def get_analytics():
    """
    Obter analytics do sistema preditivo (admin)
    
    Response:
    {
        "interaction_analytics": {
            "total_interactions": 1250,
            "recent_interactions_7d": 89,
            "persona_usage": {...},
            "suggestion_click_rate": 0.65
        },
        "cache_performance": {
            "total_items": 156,
            "hit_rate": 0.78
        },
        "system_health": {
            "active_sessions": 25,
            "avg_suggestions_per_query": 2.3
        }
    }
    """
    
    try:
        if not is_predictive_system_available():
            return jsonify({"error": "Sistema não disponível"}), 503
        
        # Verificar permissões de admin (simplificado)
        # Em produção, implementar autenticação adequada
        
        # Obter motor preditivo
        engine = get_predictive_engine()
        
        # Obter analytics completos
        analytics_data = engine.get_analytics_dashboard()
        
        return jsonify({
            **analytics_data,
            "timestamp": datetime.now().isoformat(),
            "system_status": "healthy"
        })
        
    except Exception as e:
        logger.error(f"Erro ao obter analytics: {e}")
        return jsonify({"error": "Erro interno do servidor"}), 500

@predictions_bp.route('/health', methods=['GET'])
def health_check():
    """
    Verificar saúde do sistema preditivo
    
    Response:
    {
        "status": "healthy",
        "predictive_system": true,
        "cache_status": "operational",
        "components": {
            "context_analyzer": true,
            "interaction_tracker": true,
            "prediction_rules": 4
        }
    }
    """
    
    try:
        system_available = is_predictive_system_available()
        
        if not system_available:
            return jsonify({
                "status": "degraded",
                "predictive_system": False,
                "error": "Sistema preditivo não disponível"
            }), 503
        
        # Testar componentes
        engine = get_predictive_engine()
        
        components_status = {
            "context_analyzer": hasattr(engine, 'context_analyzer'),
            "interaction_tracker": hasattr(engine, 'tracker'),
            "prediction_cache": hasattr(engine, 'cache'),
            "prediction_rules": len(engine.rules)
        }
        
        all_healthy = all(components_status.values())
        
        return jsonify({
            "status": "healthy" if all_healthy else "degraded",
            "predictive_system": True,
            "cache_status": "operational",
            "components": components_status,
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Erro no health check: {e}")
        return jsonify({
            "status": "unhealthy",
            "predictive_system": False,
            "error": str(e)
        }), 500

# Registrar blueprint no app principal
def register_predictions_blueprint(app):
    """Registrar blueprint de predições"""
    app.register_blueprint(predictions_bp)
    logger.info("Predictions blueprint registrado")

# Error handlers específicos
@predictions_bp.errorhandler(429)
def rate_limit_handler(error):
    """Handler para rate limiting"""
    return jsonify({
        "error": "Rate limit excedido",
        "retry_after": 3600,
        "suggestions": []
    }), 429

@predictions_bp.errorhandler(404)
def not_found_handler(error):
    """Handler para recursos não encontrados"""
    return jsonify({
        "error": "Endpoint não encontrado",
        "available_endpoints": [
            "/api/predictions/suggestions",
            "/api/predictions/interaction", 
            "/api/predictions/context/<session_id>",
            "/api/predictions/analytics",
            "/api/predictions/health"
        ]
    }), 404