# -*- coding: utf-8 -*-
"""
Gamification Blueprint - Sistema completo de gamificação e leaderboard
Integrado com sistema existente de cache e feedback
"""

from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
import logging
import uuid
from typing import Dict, List, Any, Optional
import json
from dataclasses import dataclass, asdict

# Import dependências
from core.dependencies import get_cache, get_config

# Configurar logger
logger = logging.getLogger(__name__)

# Criar blueprint
gamification_bp = Blueprint('gamification', __name__, url_prefix='/api/v1')

@dataclass
class UserProgress:
    """Estrutura de progresso do usuário"""
    user_id: str
    display_name: str
    total_points: int = 0
    level: int = 1
    xp: int = 0
    streak_days: int = 0
    last_activity: str = ""
    modules_completed: int = 0
    quiz_scores: List[int] = None
    achievements: List[str] = None
    created_at: str = ""
    updated_at: str = ""

    def __post_init__(self):
        if self.quiz_scores is None:
            self.quiz_scores = []
        if self.achievements is None:
            self.achievements = []
        if not self.created_at:
            self.created_at = datetime.now().isoformat()
        if not self.last_activity:
            self.last_activity = datetime.now().isoformat()
        self.updated_at = datetime.now().isoformat()

def calculate_level_from_xp(xp: int) -> int:
    """Calcula nível baseado na XP (progressão exponencial)"""
    if xp < 100:
        return 1
    elif xp < 300:
        return 2
    elif xp < 600:
        return 3
    elif xp < 1000:
        return 4
    elif xp < 1500:
        return 5
    elif xp < 2100:
        return 6
    elif xp < 2800:
        return 7
    elif xp < 3600:
        return 8
    elif xp < 4500:
        return 9
    else:
        return min(10, 9 + (xp - 4500) // 1000)

def get_achievement_list() -> List[Dict[str, Any]]:
    """Lista de achievements disponíveis"""
    return [
        {
            "id": "first_chat",
            "name": "Primeira Conversa",
            "description": "Complete sua primeira conversa com um dos assistentes",
            "points": 50,
            "icon": "💬"
        },
        {
            "id": "streak_3",
            "name": "Aprendizado Consistente",
            "description": "Use o sistema por 3 dias consecutivos",
            "points": 100,
            "icon": "🔥"
        },
        {
            "id": "streak_7",
            "name": "Dedicação Semanal",
            "description": "Use o sistema por 7 dias consecutivos",
            "points": 250,
            "icon": "⭐"
        },
        {
            "id": "module_master",
            "name": "Mestre do Módulo",
            "description": "Complete 5 módulos educacionais",
            "points": 200,
            "icon": "🎓"
        },
        {
            "id": "quiz_ace",
            "name": "Especialista em Avaliações",
            "description": "Obtenha 90%+ em 3 quizzes consecutivos",
            "points": 300,
            "icon": "🏆"
        },
        {
            "id": "feedback_contributor",
            "name": "Contribuidor Ativo",
            "description": "Forneça 10 feedbacks construtivos",
            "points": 150,
            "icon": "💡"
        }
    ]

def check_achievements(progress: UserProgress, activity_data: Dict[str, Any]) -> List[str]:
    """Verifica e retorna novos achievements desbloqueados"""
    new_achievements = []
    cache = get_cache()

    # Verificar first_chat
    if "first_chat" not in progress.achievements and activity_data.get('type') == 'chat_completion':
        new_achievements.append("first_chat")

    # Verificar streaks
    if progress.streak_days >= 3 and "streak_3" not in progress.achievements:
        new_achievements.append("streak_3")

    if progress.streak_days >= 7 and "streak_7" not in progress.achievements:
        new_achievements.append("streak_7")

    # Verificar módulos completos
    if progress.modules_completed >= 5 and "module_master" not in progress.achievements:
        new_achievements.append("module_master")

    # Verificar quiz scores (últimos 3)
    if len(progress.quiz_scores) >= 3:
        last_three = progress.quiz_scores[-3:]
        if all(score >= 90 for score in last_three) and "quiz_ace" not in progress.achievements:
            new_achievements.append("quiz_ace")

    # Verificar feedbacks (usando cache de feedback)
    if cache and "feedback_contributor" not in progress.achievements:
        feedback_list = cache.get("feedback:list") or []
        user_feedbacks = [f for f in feedback_list if f.get('user_id') == progress.user_id]
        if len(user_feedbacks) >= 10:
            new_achievements.append("feedback_contributor")

    return new_achievements

def calculate_points_for_activity(activity_type: str, data: Dict[str, Any]) -> int:
    """Calcula pontos baseado na atividade"""
    points_map = {
        'chat_completion': 10,
        'module_complete': 50,
        'quiz_complete': lambda score: max(20, score // 5),  # 20-100 pontos baseado na nota
        'daily_login': 5,
        'feedback_provided': 15,
        'achievement_unlocked': lambda points: points  # Pontos do achievement
    }

    base_points = points_map.get(activity_type, 0)

    if callable(base_points):
        if activity_type == 'quiz_complete':
            return base_points(data.get('score', 0))
        elif activity_type == 'achievement_unlocked':
            return base_points(data.get('points', 0))

    return base_points

def update_user_progress(user_id: str, display_name: str, activity_data: Dict[str, Any]) -> UserProgress:
    """Atualiza progresso do usuário e retorna dados atualizados"""
    cache = get_cache()
    if not cache:
        # Fallback para sistema sem cache
        return UserProgress(user_id=user_id, display_name=display_name)

    # Obter progresso atual
    cached_data = cache.get(f"progress:{user_id}")
    if cached_data:
        progress = UserProgress(**cached_data)
        progress.display_name = display_name  # Atualizar nome se mudou
    else:
        progress = UserProgress(user_id=user_id, display_name=display_name)

    # Calcular pontos da atividade
    activity_points = calculate_points_for_activity(activity_data.get('type', ''), activity_data)
    progress.xp += activity_points
    progress.total_points += activity_points

    # Atualizar nível
    progress.level = calculate_level_from_xp(progress.xp)

    # Atualizar streak
    now = datetime.now()
    last_activity = datetime.fromisoformat(progress.last_activity.replace('Z', '+00:00').replace('+00:00', ''))
    days_diff = (now - last_activity).days

    if days_diff == 1:
        progress.streak_days += 1
    elif days_diff > 1:
        progress.streak_days = 1  # Reset streak
    # Se days_diff == 0, mantém streak atual (mesmo dia)

    progress.last_activity = now.isoformat()

    # Atualizar módulos completos
    if activity_data.get('type') == 'module_complete':
        progress.modules_completed += 1

    # Atualizar quiz scores
    if activity_data.get('type') == 'quiz_complete':
        progress.quiz_scores.append(activity_data.get('score', 0))
        # Manter apenas os últimos 10 scores
        progress.quiz_scores = progress.quiz_scores[-10:]

    # Verificar achievements
    new_achievements = check_achievements(progress, activity_data)
    for achievement in new_achievements:
        if achievement not in progress.achievements:
            progress.achievements.append(achievement)
            # Adicionar pontos do achievement
            achievement_data = next((a for a in get_achievement_list() if a['id'] == achievement), None)
            if achievement_data:
                progress.total_points += achievement_data['points']
                progress.xp += achievement_data['points']
                progress.level = calculate_level_from_xp(progress.xp)

    # Salvar no cache
    cache.set(f"progress:{user_id}", asdict(progress), ttl=86400 * 30)  # 30 dias

    # Atualizar leaderboard
    update_leaderboard_cache(progress)

    return progress

def update_leaderboard_cache(progress: UserProgress):
    """Atualiza o cache do leaderboard"""
    cache = get_cache()
    if not cache:
        return

    # Obter leaderboard atual
    leaderboard = cache.get("leaderboard:global") or []

    # Remover entrada anterior do usuário
    leaderboard = [entry for entry in leaderboard if entry['user_id'] != progress.user_id]

    # Adicionar nova entrada
    leaderboard.append({
        'user_id': progress.user_id,
        'display_name': progress.display_name,
        'total_points': progress.total_points,
        'level': progress.level,
        'xp': progress.xp,
        'streak_days': progress.streak_days,
        'updated_at': progress.updated_at
    })

    # Ordenar por pontos (descending)
    leaderboard.sort(key=lambda x: x['total_points'], reverse=True)

    # Manter apenas top 100
    leaderboard = leaderboard[:100]

    # Salvar
    cache.set("leaderboard:global", leaderboard, ttl=86400)  # 24 horas

def check_rate_limit(endpoint_type: str = 'default'):
    """Rate limiting para endpoints de gamificação"""
    from services.security.sqlite_rate_limiter import rate_limit

    limits = {
        'gamification': (30, 300),  # 30 req por 5 minutos
        'leaderboard': (20, 60),    # 20 req por minuto
        'progress': (50, 300),      # 50 req por 5 minutos
        'default': (40, 300)
    }

    max_requests, window_seconds = limits.get(endpoint_type, limits['default'])
    return rate_limit(f"gamification_{endpoint_type}", max_requests, window_seconds)

@gamification_bp.route('/gamification/progress', methods=['POST'])
@check_rate_limit('progress')
def update_progress():
    """Atualizar progresso do usuário"""
    start_time = datetime.now()
    request_id = f"progress_{int(start_time.timestamp() * 1000)}"

    try:
        if not request.is_json:
            return jsonify({
                "error": "Content-Type deve ser application/json",
                "error_code": "INVALID_CONTENT_TYPE",
                "request_id": request_id
            }), 400

        data = request.get_json()
        if not data:
            return jsonify({
                "error": "Payload não pode estar vazio",
                "error_code": "EMPTY_PAYLOAD",
                "request_id": request_id
            }), 400

        # Validar campos obrigatórios
        required_fields = ['user_id', 'display_name', 'activity']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    "error": f"Campo '{field}' é obrigatório",
                    "error_code": "MISSING_FIELD",
                    "request_id": request_id
                }), 400

        user_id = str(data['user_id']).strip()
        display_name = str(data['display_name']).strip()
        activity_data = data['activity']

        if not user_id or not display_name:
            return jsonify({
                "error": "user_id e display_name não podem estar vazios",
                "error_code": "EMPTY_VALUES",
                "request_id": request_id
            }), 400

        # Atualizar progresso
        progress = update_user_progress(user_id, display_name, activity_data)

        response = {
            "message": "Progresso atualizado com sucesso",
            "request_id": request_id,
            "progress": asdict(progress),
            "activity_processed": activity_data,
            "timestamp": start_time.isoformat(),
            "processing_time_ms": int((datetime.now() - start_time).total_seconds() * 1000)
        }

        logger.info(f"[{request_id}] Progresso atualizado para usuário {user_id}")
        return jsonify(response), 200

    except Exception as e:
        logger.error(f"[{request_id}] Erro ao atualizar progresso: {e}")
        return jsonify({
            "error": "Erro interno do servidor",
            "error_code": "INTERNAL_ERROR",
            "request_id": request_id,
            "processing_time_ms": int((datetime.now() - start_time).total_seconds() * 1000)
        }), 500

@gamification_bp.route('/gamification/progress/<user_id>', methods=['GET'])
@check_rate_limit('progress')
def get_user_progress(user_id: str):
    """Obter progresso específico do usuário"""
    try:
        request_id = f"get_progress_{int(datetime.now().timestamp() * 1000)}"

        cache = get_cache()
        if not cache:
            return jsonify({
                "error": "Serviço de progresso não disponível",
                "error_code": "SERVICE_UNAVAILABLE",
                "request_id": request_id
            }), 503

        cached_data = cache.get(f"progress:{user_id}")
        if not cached_data:
            return jsonify({
                "error": "Usuário não encontrado",
                "error_code": "USER_NOT_FOUND",
                "request_id": request_id
            }), 404

        progress = UserProgress(**cached_data)

        response = {
            "progress": asdict(progress),
            "achievements_available": get_achievement_list(),
            "next_level_xp": (progress.level * 100) + ((progress.level - 1) * 50),
            "request_id": request_id,
            "timestamp": datetime.now().isoformat()
        }

        return jsonify(response), 200

    except Exception as e:
        logger.error(f"[{request_id}] Erro ao obter progresso: {e}")
        return jsonify({
            "error": "Erro interno do servidor",
            "error_code": "INTERNAL_ERROR",
            "request_id": request_id
        }), 500

@gamification_bp.route('/gamification/leaderboard', methods=['GET'])
@check_rate_limit('leaderboard')
def get_leaderboard():
    """Obter leaderboard global"""
    try:
        request_id = f"leaderboard_{int(datetime.now().timestamp() * 1000)}"

        # Parâmetros de consulta
        limit = min(int(request.args.get('limit', 20)), 100)
        timeframe = request.args.get('timeframe', 'all_time')  # all_time, weekly, monthly

        cache = get_cache()
        if not cache:
            return jsonify({
                "error": "Serviço de leaderboard não disponível",
                "error_code": "SERVICE_UNAVAILABLE",
                "request_id": request_id
            }), 503

        # Para esta versão inicial, usar leaderboard global
        # Futuras versões podem implementar filtros por período
        leaderboard = cache.get("leaderboard:global") or []

        # Aplicar limite
        limited_leaderboard = leaderboard[:limit]

        # Adicionar rankings
        for i, entry in enumerate(limited_leaderboard):
            entry['rank'] = i + 1

        response = {
            "leaderboard": limited_leaderboard,
            "metadata": {
                "total_entries": len(leaderboard),
                "showing": len(limited_leaderboard),
                "timeframe": timeframe,
                "last_updated": datetime.now().isoformat(),
                "request_id": request_id
            }
        }

        logger.info(f"[{request_id}] Leaderboard retornado com {len(limited_leaderboard)} entradas")
        return jsonify(response), 200

    except Exception as e:
        logger.error(f"[{request_id}] Erro ao obter leaderboard: {e}")
        return jsonify({
            "error": "Erro interno do servidor",
            "error_code": "INTERNAL_ERROR",
            "request_id": request_id
        }), 500

@gamification_bp.route('/gamification/achievements', methods=['GET'])
@check_rate_limit('gamification')
def get_achievements():
    """Listar todos os achievements disponíveis"""
    try:
        request_id = f"achievements_{int(datetime.now().timestamp() * 1000)}"

        achievements = get_achievement_list()

        response = {
            "achievements": achievements,
            "total": len(achievements),
            "request_id": request_id,
            "timestamp": datetime.now().isoformat()
        }

        return jsonify(response), 200

    except Exception as e:
        logger.error(f"[{request_id}] Erro ao obter achievements: {e}")
        return jsonify({
            "error": "Erro interno do servidor",
            "error_code": "INTERNAL_ERROR",
            "request_id": request_id
        }), 500

@gamification_bp.route('/gamification/health', methods=['GET'])
def gamification_health():
    """Health check do serviço de gamificação"""
    cache = get_cache()

    # Estatísticas básicas
    total_users = 0
    total_points = 0
    if cache:
        leaderboard = cache.get("leaderboard:global") or []
        total_users = len(leaderboard)
        total_points = sum(entry['total_points'] for entry in leaderboard)

    status = {
        "service": "gamification",
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "components": {
            "cache": "available" if cache else "unavailable",
            "achievements": "available",
            "leaderboard": "available"
        },
        "stats": {
            "total_users": total_users,
            "total_points_distributed": total_points,
            "available_achievements": len(get_achievement_list())
        }
    }

    return jsonify(status), 200