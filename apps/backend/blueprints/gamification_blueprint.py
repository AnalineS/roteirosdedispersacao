# -*- coding: utf-8 -*-
"""
Gamification Blueprint - Educational gamification endpoints for hanseniase platform.

Provides XP tracking, achievements, leaderboard, quiz scoring, sync,
and certification progress. Backed by gamification_progress table in SQLite.
"""

from flask import Blueprint, jsonify, request, g
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Tuple
import json
import logging
import math

from core.logging.sanitizer import sanitize_error
from utils.auth_utils import require_auth, require_auth_optional

logger = logging.getLogger(__name__)

gamification_bp = Blueprint('gamification', __name__, url_prefix='/api/v1')

# ---------------------------------------------------------------------------
# Database helpers
# ---------------------------------------------------------------------------

_TABLE_INITIALIZED = False


def _get_db():
    """Get DatabaseManager instance."""
    from core.database import get_db_connection
    return get_db_connection()


def _ensure_table() -> None:
    """Create gamification_progress table if it does not exist yet."""
    global _TABLE_INITIALIZED
    if _TABLE_INITIALIZED:
        return

    try:
        db = _get_db()
        db.execute(
            """
            CREATE TABLE IF NOT EXISTS gamification_progress (
                id TEXT PRIMARY KEY,
                user_id TEXT UNIQUE NOT NULL,
                total_xp INTEGER DEFAULT 0,
                level INTEGER DEFAULT 0,
                completed_cases TEXT DEFAULT '[]',
                unlocked_achievements TEXT DEFAULT '[]',
                streak_days INTEGER DEFAULT 0,
                last_activity TIMESTAMP,
                total_time_spent INTEGER DEFAULT 0,
                preferred_persona TEXT DEFAULT 'ga',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
            """
        )
        db.execute(
            "CREATE INDEX IF NOT EXISTS idx_gamification_user "
            "ON gamification_progress(user_id)"
        )
        db.execute(
            "CREATE INDEX IF NOT EXISTS idx_gamification_xp "
            "ON gamification_progress(total_xp DESC)"
        )
        _TABLE_INITIALIZED = True
        logger.info("gamification_progress table ready")
    except Exception as exc:
        logger.error("Failed to initialize gamification table: %s", sanitize_error(exc))


def _validate_user_id(path_user_id: str) -> Optional[Tuple[Dict[str, str], int]]:
    """Return an error response tuple if path user_id does not match the token, else None."""
    if g.current_user['id'] != path_user_id:
        return {'success': False, 'error': 'Acesso negado: usuario invalido'}, 403
    return None


def _safe_json_loads(raw: Optional[str], fallback: List[str]) -> List[str]:
    """Parse a JSON TEXT column safely, returning fallback on failure."""
    if raw is None:
        return fallback
    try:
        parsed = json.loads(raw)
        if isinstance(parsed, list):
            return parsed
        return fallback
    except (json.JSONDecodeError, TypeError):
        return fallback


def _row_to_progress(row: Dict[str, object]) -> Dict[str, object]:
    """Convert a gamification_progress row into the API response shape."""
    return {
        'id': row.get('id', ''),
        'user_id': row.get('user_id', ''),
        'total_xp': row.get('total_xp', 0),
        'level': row.get('level', 0),
        'completed_cases': _safe_json_loads(
            str(row.get('completed_cases', '[]')), []
        ),
        'unlocked_achievements': _safe_json_loads(
            str(row.get('unlocked_achievements', '[]')), []
        ),
        'streak_days': row.get('streak_days', 0),
        'last_activity': row.get('last_activity'),
        'total_time_spent': row.get('total_time_spent', 0),
        'preferred_persona': row.get('preferred_persona', 'ga'),
        'created_at': row.get('created_at'),
        'updated_at': row.get('updated_at'),
    }


def _default_progress(user_id: str) -> Dict[str, object]:
    """Create a default gamification_progress record and return it."""
    db = _get_db()
    now_iso = datetime.now(timezone.utc).isoformat()
    record_id = db.insert('gamification_progress', {
        'user_id': user_id,
        'total_xp': 0,
        'level': 0,
        'completed_cases': '[]',
        'unlocked_achievements': '[]',
        'streak_days': 0,
        'last_activity': now_iso,
        'total_time_spent': 0,
        'preferred_persona': 'ga',
    })
    return {
        'id': record_id,
        'user_id': user_id,
        'total_xp': 0,
        'level': 0,
        'completed_cases': [],
        'unlocked_achievements': [],
        'streak_days': 0,
        'last_activity': now_iso,
        'total_time_spent': 0,
        'preferred_persona': 'ga',
        'created_at': now_iso,
        'updated_at': now_iso,
    }


# Level thresholds (mirrors frontend LEVEL_REQUIREMENTS)
_LEVEL_THRESHOLDS: List[int] = [
    0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 12000, 17000
]


def _xp_to_level(total_xp: int) -> int:
    """Compute level from total XP."""
    level = 0
    for i, threshold in enumerate(_LEVEL_THRESHOLDS):
        if total_xp >= threshold:
            level = i
        else:
            break
    return level


# XP rewards for quiz scoring
_XP_CORRECT_ANSWER = 15
_XP_INCORRECT_ANSWER = 3
_XP_QUIZ_COMPLETION_BONUS = 25


# Achievement definitions (server-side mirror of frontend DEFAULT_ACHIEVEMENTS)
_ACHIEVEMENT_DEFS: List[Dict[str, object]] = [
    {
        'id': 'first_login',
        'title': 'Bem-vindo a Plataforma!',
        'description': 'Fez seu primeiro login e configurou seu perfil',
        'category': 'first_steps',
        'rarity': 'common',
        'xpReward': 50,
        'requirements': [{'type': 'xp_total', 'value': 1, 'operator': '>='}],
    },
    {
        'id': 'qa_enthusiast',
        'title': 'Entusiasta do Conhecimento',
        'description': 'Completou seu primeiro quiz sobre hanseniase',
        'category': 'quiz_master',
        'rarity': 'common',
        'xpReward': 75,
        'requirements': [{'type': 'quiz_score', 'value': 70, 'operator': '>='}],
    },
    {
        'id': 'streak_warrior',
        'title': 'Guerreiro da Constancia',
        'description': 'Manteve 7 dias consecutivos de estudo',
        'category': 'streak_champion',
        'rarity': 'rare',
        'xpReward': 200,
        'requirements': [{'type': 'streak_days', 'value': 7, 'operator': '>='}],
    },
    {
        'id': 'hanseniase_master',
        'title': 'Mestre em Hanseniase',
        'description': 'Dominou todos os modulos fundamentais sobre hanseniase',
        'category': 'knowledge_master',
        'rarity': 'epic',
        'xpReward': 500,
        'requirements': [
            {'type': 'modules_completed', 'value': 5, 'operator': '>='},
        ],
    },
    {
        'id': 'first_case_completed',
        'title': 'Primeiro Caso Clinico',
        'description': 'Completou seu primeiro caso clinico no simulador',
        'category': 'clinical_simulator',
        'rarity': 'common',
        'xpReward': 100,
        'requirements': [{'type': 'cases_completed', 'value': 1, 'operator': '>='}],
    },
    {
        'id': 'diagnostic_accuracy_master',
        'title': 'Mestre do Diagnostico',
        'description': 'Mantem alta precisao diagnostica (>90%) em casos clinicos',
        'category': 'clinical_simulator',
        'rarity': 'epic',
        'xpReward': 400,
        'requirements': [
            {'type': 'case_accuracy', 'value': 90, 'operator': '>='},
            {'type': 'cases_completed', 'value': 5, 'operator': '>='},
        ],
    },
    {
        'id': 'clinical_simulator_champion',
        'title': 'Campeao do Simulador',
        'description': 'Completou todos os tipos de casos clinicos disponiveis',
        'category': 'clinical_simulator',
        'rarity': 'legendary',
        'xpReward': 750,
        'requirements': [
            {'type': 'cases_completed', 'value': 10, 'operator': '>='},
            {'type': 'case_accuracy', 'value': 85, 'operator': '>='},
        ],
    },
]


def _check_requirement(
    req: Dict[str, object],
    progress_data: Dict[str, object],
) -> bool:
    """Evaluate a single achievement requirement against progress data."""
    req_type = str(req.get('type', ''))
    req_value = req.get('value', 0)
    operator = str(req.get('operator', '>='))

    actual: object = None

    if req_type == 'xp_total':
        actual = progress_data.get('total_xp', 0)
    elif req_type == 'streak_days':
        actual = progress_data.get('streak_days', 0)
    elif req_type == 'cases_completed':
        cases = progress_data.get('completed_cases', [])
        actual = len(cases) if isinstance(cases, list) else 0
    elif req_type == 'modules_completed':
        actual = progress_data.get('modules_completed', 0)
    elif req_type == 'quiz_score':
        actual = progress_data.get('best_quiz_score', 0)
    elif req_type == 'case_accuracy':
        actual = progress_data.get('case_accuracy', 0)
    elif req_type == 'time_spent':
        actual = progress_data.get('total_time_spent', 0)
    elif req_type == 'chat_messages':
        actual = progress_data.get('chat_messages', 0)
    else:
        return False

    if actual is None:
        return False

    try:
        num_actual = float(actual)  # type: ignore[arg-type]
        num_req = float(req_value)  # type: ignore[arg-type]
    except (ValueError, TypeError):
        return False

    if operator == '>=':
        return num_actual >= num_req
    if operator == '>':
        return num_actual > num_req
    if operator == '==':
        return num_actual == num_req
    if operator == '<':
        return num_actual < num_req
    if operator == 'includes':
        # string-in-list check
        items = progress_data.get('completed_cases', [])
        if isinstance(items, list):
            return str(req_value) in [str(i) for i in items]
        return False

    return False


def _evaluate_achievements(
    progress_data: Dict[str, object],
    already_unlocked: List[str],
) -> List[Dict[str, object]]:
    """Return list of newly unlocked achievement dicts."""
    newly_unlocked: List[Dict[str, object]] = []
    for ach in _ACHIEVEMENT_DEFS:
        ach_id = str(ach['id'])
        if ach_id in already_unlocked:
            continue
        requirements = ach.get('requirements', [])
        if not isinstance(requirements, list):
            continue
        all_met = all(
            _check_requirement(req, progress_data)
            for req in requirements
        )
        if all_met:
            newly_unlocked.append({
                'id': ach_id,
                'title': ach.get('title', ''),
                'description': ach.get('description', ''),
                'category': ach.get('category', ''),
                'rarity': ach.get('rarity', 'common'),
                'xpReward': ach.get('xpReward', 0),
                'unlockedAt': datetime.now(timezone.utc).isoformat(),
                'isUnlocked': True,
            })
    return newly_unlocked


# ---------------------------------------------------------------------------
# 1. GET /gamification/progress/<user_id>
# ---------------------------------------------------------------------------

@gamification_bp.route('/gamification/progress/<user_id>', methods=['GET'])
@require_auth
def get_progress(user_id: str):
    """Return gamification progress for a user. Creates default if missing."""
    _ensure_table()

    auth_error = _validate_user_id(user_id)
    if auth_error is not None:
        return jsonify(auth_error[0]), auth_error[1]

    try:
        db = _get_db()
        row = db.fetch_one(
            "SELECT * FROM gamification_progress WHERE user_id = ?",
            (user_id,),
        )

        if row is None:
            data = _default_progress(user_id)
        else:
            data = _row_to_progress(row)

        return jsonify({'success': True, 'data': data}), 200

    except Exception as exc:
        logger.error("get_progress error: %s", sanitize_error(exc))
        return jsonify({'success': False, 'error': 'Erro ao buscar progresso'}), 500


# ---------------------------------------------------------------------------
# 2. POST /gamification/progress/<user_id>
# ---------------------------------------------------------------------------

@gamification_bp.route('/gamification/progress/<user_id>', methods=['POST'])
@require_auth
def save_progress(user_id: str):
    """Save or update gamification progress (upsert)."""
    _ensure_table()

    auth_error = _validate_user_id(user_id)
    if auth_error is not None:
        return jsonify(auth_error[0]), auth_error[1]

    body = request.get_json(silent=True)
    if body is None:
        return jsonify({'success': False, 'error': 'JSON body obrigatorio'}), 400

    # The frontend sends { progress: {...} }
    progress_payload: Dict[str, object] = body.get('progress', body)

    try:
        db = _get_db()
        now_iso = datetime.now(timezone.utc).isoformat()
        existing = db.fetch_one(
            "SELECT id FROM gamification_progress WHERE user_id = ?",
            (user_id,),
        )

        # Build safe update fields from the payload
        allowed_fields: Dict[str, str] = {
            'total_xp': 'total_xp',
            'totalXP': 'total_xp',
            'level': 'level',
            'completed_cases': 'completed_cases',
            'completedCases': 'completed_cases',
            'unlocked_achievements': 'unlocked_achievements',
            'unlockedAchievements': 'unlocked_achievements',
            'streak_days': 'streak_days',
            'streakDays': 'streak_days',
            'total_time_spent': 'total_time_spent',
            'totalTimeSpent': 'total_time_spent',
            'preferred_persona': 'preferred_persona',
            'preferredPersona': 'preferred_persona',
        }

        update_data: Dict[str, object] = {}
        for client_key, db_col in allowed_fields.items():
            if client_key in progress_payload:
                value = progress_payload[client_key]
                # JSON-encode list values for TEXT columns
                if db_col in ('completed_cases', 'unlocked_achievements'):
                    if isinstance(value, list):
                        value = json.dumps(value)
                    elif isinstance(value, str):
                        # Validate it is valid JSON
                        try:
                            json.loads(value)
                        except (json.JSONDecodeError, TypeError):
                            value = '[]'
                    else:
                        value = '[]'
                update_data[db_col] = value

        # Recalculate level from total_xp if provided
        if 'total_xp' in update_data:
            xp_val = update_data['total_xp']
            if isinstance(xp_val, (int, float)):
                update_data['level'] = _xp_to_level(int(xp_val))

        update_data['last_activity'] = now_iso

        if existing:
            db.update(
                'gamification_progress',
                update_data,
                'user_id = ?',
                (user_id,),
            )
        else:
            update_data['user_id'] = user_id
            db.insert('gamification_progress', update_data)

        # Fetch the updated record to return
        row = db.fetch_one(
            "SELECT * FROM gamification_progress WHERE user_id = ?",
            (user_id,),
        )
        data = _row_to_progress(row) if row else update_data

        return jsonify({'success': True, 'data': data, 'message': 'Progresso salvo'}), 200

    except Exception as exc:
        logger.error("save_progress error: %s", sanitize_error(exc))
        return jsonify({'success': False, 'error': 'Erro ao salvar progresso'}), 500


# ---------------------------------------------------------------------------
# 3. GET /gamification/achievements/<user_id>
# ---------------------------------------------------------------------------

@gamification_bp.route('/gamification/achievements/<user_id>', methods=['GET'])
@require_auth
def get_achievements(user_id: str):
    """Return user's unlocked achievements."""
    _ensure_table()

    auth_error = _validate_user_id(user_id)
    if auth_error is not None:
        return jsonify(auth_error[0]), auth_error[1]

    try:
        db = _get_db()
        row = db.fetch_one(
            "SELECT unlocked_achievements FROM gamification_progress WHERE user_id = ?",
            (user_id,),
        )

        unlocked_ids: List[str] = []
        if row:
            unlocked_ids = _safe_json_loads(
                str(row.get('unlocked_achievements', '[]')), []
            )

        # Build full achievement objects for the unlocked ones
        achievements: List[Dict[str, object]] = []
        for ach in _ACHIEVEMENT_DEFS:
            ach_id = str(ach['id'])
            is_unlocked = ach_id in unlocked_ids
            achievements.append({
                'id': ach_id,
                'title': ach.get('title', ''),
                'description': ach.get('description', ''),
                'category': ach.get('category', ''),
                'rarity': ach.get('rarity', 'common'),
                'xpReward': ach.get('xpReward', 0),
                'isUnlocked': is_unlocked,
                'unlockedAt': None,
            })

        return jsonify({'success': True, 'data': achievements}), 200

    except Exception as exc:
        logger.error("get_achievements error: %s", sanitize_error(exc))
        return jsonify({'success': False, 'error': 'Erro ao buscar conquistas'}), 500


# ---------------------------------------------------------------------------
# 4. POST /gamification/achievements/<user_id>/check
# ---------------------------------------------------------------------------

@gamification_bp.route('/gamification/achievements/<user_id>/check', methods=['POST'])
@require_auth
def check_achievements(user_id: str):
    """Check progress against achievement requirements, unlock new ones, return results."""
    _ensure_table()

    auth_error = _validate_user_id(user_id)
    if auth_error is not None:
        return jsonify(auth_error[0]), auth_error[1]

    body = request.get_json(silent=True)
    if body is None:
        return jsonify({'success': False, 'error': 'JSON body obrigatorio'}), 400

    progress_input: Dict[str, object] = body.get('progress', body)

    try:
        db = _get_db()
        row = db.fetch_one(
            "SELECT * FROM gamification_progress WHERE user_id = ?",
            (user_id,),
        )

        if row is None:
            _default_progress(user_id)
            row = db.fetch_one(
                "SELECT * FROM gamification_progress WHERE user_id = ?",
                (user_id,),
            )

        current = _row_to_progress(row) if row else {}
        already_unlocked: List[str] = current.get('unlocked_achievements', [])  # type: ignore[assignment]
        if not isinstance(already_unlocked, list):
            already_unlocked = []

        # Merge server-side data with client-provided progress for evaluation
        eval_data: Dict[str, object] = {
            'total_xp': current.get('total_xp', 0),
            'streak_days': current.get('streak_days', 0),
            'completed_cases': current.get('completed_cases', []),
            'total_time_spent': current.get('total_time_spent', 0),
        }

        # Allow client to provide additional context the server cannot know
        for key in ('modules_completed', 'best_quiz_score', 'case_accuracy',
                     'chat_messages'):
            if key in progress_input:
                eval_data[key] = progress_input[key]

        newly_unlocked = _evaluate_achievements(eval_data, already_unlocked)

        # Persist new achievements
        if newly_unlocked:
            new_ids = [str(a['id']) for a in newly_unlocked]
            merged_ids = already_unlocked + new_ids
            total_bonus_xp = sum(
                int(a.get('xpReward', 0)) for a in newly_unlocked
            )

            current_xp = int(current.get('total_xp', 0))
            new_xp = current_xp + total_bonus_xp

            db.update(
                'gamification_progress',
                {
                    'unlocked_achievements': json.dumps(merged_ids),
                    'total_xp': new_xp,
                    'level': _xp_to_level(new_xp),
                },
                'user_id = ?',
                (user_id,),
            )

        # Build notifications for newly unlocked
        notifications: List[Dict[str, object]] = []
        for ach in newly_unlocked:
            notifications.append({
                'id': f"notif_{ach['id']}_{datetime.now(timezone.utc).timestamp():.0f}",
                'type': 'achievement_unlocked',
                'title': f"Conquista desbloqueada: {ach['title']}",
                'message': str(ach.get('description', '')),
                'celebrationType': 'visual',
                'data': {
                    'achievementId': ach['id'],
                    'xpGained': ach.get('xpReward', 0),
                },
                'isRead': False,
                'createdAt': datetime.now(timezone.utc).isoformat(),
            })

        return jsonify({
            'success': True,
            'data': {
                'newAchievements': newly_unlocked,
                'notifications': notifications,
            },
        }), 200

    except Exception as exc:
        logger.error("check_achievements error: %s", sanitize_error(exc))
        return jsonify({'success': False, 'error': 'Erro ao verificar conquistas'}), 500


# ---------------------------------------------------------------------------
# 5. GET /gamification/leaderboard
# ---------------------------------------------------------------------------

@gamification_bp.route('/gamification/leaderboard', methods=['GET'])
@require_auth_optional
def get_leaderboard():
    """Return leaderboard ranked by total_xp."""
    _ensure_table()

    board_type = request.args.get('type', 'all_time')
    raw_limit = request.args.get('limit', '50')
    try:
        limit = min(max(int(raw_limit), 1), 100)
    except (ValueError, TypeError):
        limit = 50

    try:
        db = _get_db()

        # Build time filter
        time_filter = ''
        time_params: Tuple[object, ...] = ()
        if board_type == 'weekly':
            cutoff = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
            time_filter = 'WHERE gp.last_activity >= ?'
            time_params = (cutoff,)
        elif board_type == 'monthly':
            cutoff = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
            time_filter = 'WHERE gp.last_activity >= ?'
            time_params = (cutoff,)
        # all_time = no filter

        query = f"""
            SELECT
                gp.user_id,
                gp.total_xp,
                gp.level,
                gp.unlocked_achievements,
                gp.streak_days,
                gp.preferred_persona,
                u.email,
                u.profile_data
            FROM gamification_progress gp
            LEFT JOIN users u ON gp.user_id = u.id
            {time_filter}
            ORDER BY gp.total_xp DESC
            LIMIT ?
        """
        params = time_params + (limit,)
        rows = db.fetch_all(query, params)

        entries: List[Dict[str, object]] = []
        for rank_idx, row in enumerate(rows, start=1):
            achievements_list = _safe_json_loads(
                str(row.get('unlocked_achievements', '[]')), []
            )

            # Extract display name from profile_data or fall back to masked email
            display_name = 'Estudante'
            profile_raw = row.get('profile_data')
            if profile_raw:
                try:
                    profile = json.loads(str(profile_raw)) if isinstance(profile_raw, str) else profile_raw
                    if isinstance(profile, dict):
                        display_name = str(profile.get('name', display_name))
                except (json.JSONDecodeError, TypeError):
                    pass

            email = row.get('email', '')
            if display_name == 'Estudante' and email:
                # Mask email: first 2 chars + ***
                email_str = str(email)
                at_pos = email_str.find('@')
                if at_pos > 2:
                    display_name = email_str[:2] + '***'
                elif at_pos > 0:
                    display_name = email_str[:1] + '***'

            entries.append({
                'userId': row.get('user_id', ''),
                'displayName': display_name,
                'totalXP': row.get('total_xp', 0),
                'level': row.get('level', 0),
                'achievementCount': len(achievements_list),
                'currentStreak': row.get('streak_days', 0),
                'rank': rank_idx,
            })

        return jsonify({'success': True, 'data': entries}), 200

    except Exception as exc:
        logger.error("get_leaderboard error: %s", sanitize_error(exc))
        return jsonify({'success': False, 'error': 'Erro ao buscar leaderboard'}), 500


# ---------------------------------------------------------------------------
# 6. GET /gamification/leaderboard/rank/<user_id>
# ---------------------------------------------------------------------------

@gamification_bp.route('/gamification/leaderboard/rank/<user_id>', methods=['GET'])
@require_auth
def get_user_rank(user_id: str):
    """Return the user's rank, total users count, and percentile."""
    _ensure_table()

    auth_error = _validate_user_id(user_id)
    if auth_error is not None:
        return jsonify(auth_error[0]), auth_error[1]

    try:
        db = _get_db()

        # Get user's XP
        user_row = db.fetch_one(
            "SELECT total_xp FROM gamification_progress WHERE user_id = ?",
            (user_id,),
        )
        if user_row is None:
            _default_progress(user_id)
            user_xp = 0
        else:
            user_xp = int(user_row.get('total_xp', 0))

        # Count users with more XP (rank = that count + 1)
        rank_row = db.fetch_one(
            "SELECT COUNT(*) as cnt FROM gamification_progress WHERE total_xp > ?",
            (user_xp,),
        )
        rank = int(rank_row['cnt']) + 1 if rank_row else 1

        # Total users
        total_row = db.fetch_one(
            "SELECT COUNT(*) as cnt FROM gamification_progress"
        )
        total_users = int(total_row['cnt']) if total_row else 1

        if total_users <= 1:
            percentile = 100.0
        else:
            percentile = round(((total_users - rank) / (total_users - 1)) * 100, 1)

        return jsonify({
            'success': True,
            'data': {
                'rank': rank,
                'totalUsers': total_users,
                'percentile': percentile,
            },
        }), 200

    except Exception as exc:
        logger.error("get_user_rank error: %s", sanitize_error(exc))
        return jsonify({'success': False, 'error': 'Erro ao buscar ranking'}), 500


# ---------------------------------------------------------------------------
# 7. POST /gamification/quiz/attempt
# ---------------------------------------------------------------------------

@gamification_bp.route('/gamification/quiz/attempt', methods=['POST'])
@require_auth
def submit_quiz_attempt():
    """Score a quiz attempt, award XP, update gamification_progress."""
    _ensure_table()

    body = request.get_json(silent=True)
    if body is None:
        return jsonify({'success': False, 'error': 'JSON body obrigatorio'}), 400

    attempt: Dict[str, object] = body.get('attempt', body)

    quiz_id = attempt.get('quizId', attempt.get('quiz_id', ''))
    attempt_user_id = str(attempt.get('userId', attempt.get('user_id', '')))
    answers = attempt.get('answers', [])
    score = attempt.get('score')  # pre-calculated by frontend, or we recalculate

    if not attempt_user_id:
        return jsonify({'success': False, 'error': 'userId obrigatorio'}), 400

    # Validate user
    auth_error = _validate_user_id(attempt_user_id)
    if auth_error is not None:
        return jsonify(auth_error[0]), auth_error[1]

    try:
        db = _get_db()

        # Calculate score if not provided
        if score is None and isinstance(answers, list) and len(answers) > 0:
            correct_count = sum(
                1 for a in answers
                if isinstance(a, dict) and a.get('isCorrect', False)
            )
            total_questions = len(answers)
            score = round((correct_count / total_questions) * 100) if total_questions > 0 else 0
        elif score is None:
            score = 0

        score = int(score)

        # Calculate XP earned
        xp_earned = 0
        if isinstance(answers, list):
            for answer in answers:
                if isinstance(answer, dict):
                    if answer.get('isCorrect', False):
                        xp_earned += _XP_CORRECT_ANSWER
                    else:
                        xp_earned += _XP_INCORRECT_ANSWER
        xp_earned += _XP_QUIZ_COMPLETION_BONUS

        # Update gamification_progress
        row = db.fetch_one(
            "SELECT * FROM gamification_progress WHERE user_id = ?",
            (attempt_user_id,),
        )

        if row is None:
            _default_progress(attempt_user_id)
            row = db.fetch_one(
                "SELECT * FROM gamification_progress WHERE user_id = ?",
                (attempt_user_id,),
            )

        current_xp = int(row.get('total_xp', 0)) if row else 0
        new_xp = current_xp + xp_earned
        new_level = _xp_to_level(new_xp)

        # Also store quiz score in learning_progress if the table exists
        try:
            lp_row = db.fetch_one(
                "SELECT id, quiz_scores FROM learning_progress WHERE user_id = ?",
                (attempt_user_id,),
            )
            if lp_row:
                existing_scores = _safe_json_loads(
                    str(lp_row.get('quiz_scores', '[]')), []
                )
                existing_scores.append({
                    'quizId': str(quiz_id),
                    'score': score,
                    'xpEarned': xp_earned,
                    'timestamp': datetime.now(timezone.utc).isoformat(),
                })
                db.update(
                    'learning_progress',
                    {'quiz_scores': json.dumps(existing_scores)},
                    'user_id = ?',
                    (attempt_user_id,),
                )
        except Exception as lp_exc:
            # learning_progress update is optional, do not fail the request
            logger.warning("learning_progress update skipped: %s", sanitize_error(lp_exc))

        # Update gamification_progress XP
        db.update(
            'gamification_progress',
            {
                'total_xp': new_xp,
                'level': new_level,
                'last_activity': datetime.now(timezone.utc).isoformat(),
            },
            'user_id = ?',
            (attempt_user_id,),
        )

        return jsonify({
            'success': True,
            'data': {
                'isValid': True,
                'score': score,
                'xpEarned': xp_earned,
                'achievements': [],  # Achievements checked separately via /check
            },
        }), 200

    except Exception as exc:
        logger.error("submit_quiz_attempt error: %s", sanitize_error(exc))
        return jsonify({'success': False, 'error': 'Erro ao processar quiz'}), 500


# ---------------------------------------------------------------------------
# 8. GET /gamification/notifications/<user_id>
# ---------------------------------------------------------------------------

@gamification_bp.route('/gamification/notifications/<user_id>', methods=['GET'])
@require_auth
def get_notifications(user_id: str):
    """Return notifications for user. Returns empty list (notifications table does not exist yet)."""
    auth_error = _validate_user_id(user_id)
    if auth_error is not None:
        return jsonify(auth_error[0]), auth_error[1]

    # Honest: notifications table does not exist yet, return empty list
    return jsonify({
        'success': True,
        'data': [],
        'message': 'Notificacoes nao implementadas ainda - tabela pendente',
    }), 200


# ---------------------------------------------------------------------------
# 9. POST /gamification/sync/<user_id>
# ---------------------------------------------------------------------------

@gamification_bp.route('/gamification/sync/<user_id>', methods=['POST'])
@require_auth
def sync_offline_data(user_id: str):
    """Merge offline progress with server data. Server wins on conflicts."""
    _ensure_table()

    auth_error = _validate_user_id(user_id)
    if auth_error is not None:
        return jsonify(auth_error[0]), auth_error[1]

    body = request.get_json(silent=True)
    if body is None:
        return jsonify({'success': False, 'error': 'JSON body obrigatorio'}), 400

    offline_progress: Dict[str, object] = body.get('progress', body)
    offline_timestamp_str = str(body.get('timestamp', ''))

    try:
        db = _get_db()
        row = db.fetch_one(
            "SELECT * FROM gamification_progress WHERE user_id = ?",
            (user_id,),
        )

        if row is None:
            _default_progress(user_id)
            row = db.fetch_one(
                "SELECT * FROM gamification_progress WHERE user_id = ?",
                (user_id,),
            )

        server_data = _row_to_progress(row) if row else {}
        conflicts: List[Dict[str, object]] = []
        now_iso = datetime.now(timezone.utc).isoformat()

        # Merge strategy: server wins, but take max for additive fields
        merge_fields = {
            'total_xp': 'total_xp',
            'totalXP': 'total_xp',
            'streak_days': 'streak_days',
            'streakDays': 'streak_days',
            'total_time_spent': 'total_time_spent',
            'totalTimeSpent': 'total_time_spent',
        }

        merged_values: Dict[str, object] = {}
        for client_key, db_col in merge_fields.items():
            if client_key in offline_progress:
                local_val = offline_progress[client_key]
                server_val = server_data.get(db_col, 0)
                try:
                    local_num = int(local_val)  # type: ignore[arg-type]
                    server_num = int(server_val)  # type: ignore[arg-type]
                except (ValueError, TypeError):
                    continue

                resolved = max(local_num, server_num)
                resolution = 'server' if resolved == server_num else 'local'

                if local_num != server_num:
                    conflicts.append({
                        'field': db_col,
                        'localValue': local_num,
                        'serverValue': server_num,
                        'resolvedValue': resolved,
                        'resolution': resolution,
                        'timestamp': now_iso,
                    })

                merged_values[db_col] = resolved

        # Merge completed_cases as union
        server_cases: List[str] = server_data.get('completed_cases', [])  # type: ignore[assignment]
        if not isinstance(server_cases, list):
            server_cases = []

        offline_cases_raw = offline_progress.get(
            'completed_cases',
            offline_progress.get('completedCases', []),
        )
        offline_cases: List[str] = []
        if isinstance(offline_cases_raw, list):
            offline_cases = [str(c) for c in offline_cases_raw]

        merged_cases = list(set(server_cases + offline_cases))
        merged_values['completed_cases'] = json.dumps(merged_cases)

        # Merge unlocked_achievements as union
        server_achs: List[str] = server_data.get('unlocked_achievements', [])  # type: ignore[assignment]
        if not isinstance(server_achs, list):
            server_achs = []

        offline_achs_raw = offline_progress.get(
            'unlocked_achievements',
            offline_progress.get('unlockedAchievements', []),
        )
        offline_achs: List[str] = []
        if isinstance(offline_achs_raw, list):
            offline_achs = [str(a) for a in offline_achs_raw]

        merged_achs = list(set(server_achs + offline_achs))
        merged_values['unlocked_achievements'] = json.dumps(merged_achs)

        # Recalculate level
        if 'total_xp' in merged_values:
            merged_values['level'] = _xp_to_level(int(merged_values['total_xp']))

        merged_values['last_activity'] = now_iso

        # Persist
        db.update(
            'gamification_progress',
            merged_values,
            'user_id = ?',
            (user_id,),
        )

        # Fetch merged result
        updated_row = db.fetch_one(
            "SELECT * FROM gamification_progress WHERE user_id = ?",
            (user_id,),
        )
        merged_progress = _row_to_progress(updated_row) if updated_row else merged_values

        return jsonify({
            'success': True,
            'data': {
                'conflicts': conflicts,
                'mergedProgress': merged_progress,
                'mergedNotifications': [],  # No notifications table yet
            },
        }), 200

    except Exception as exc:
        logger.error("sync_offline_data error: %s", sanitize_error(exc))
        return jsonify({'success': False, 'error': 'Erro ao sincronizar dados'}), 500


# ---------------------------------------------------------------------------
# 10. GET /gamification/certification-progress
# ---------------------------------------------------------------------------

@gamification_bp.route('/gamification/certification-progress', methods=['GET'])
@require_auth
def get_certification_progress():
    """Return certification progress matching frontend CertificationProgress type.

    Response shape aligns with apps/frontend-nextjs/src/types/certification.ts
    so the page at /certificacao can consume it directly.
    """
    _ensure_table()
    user_id: str = g.current_user['id']
    user_name: str = g.current_user.get('name') or 'Usuario'
    user_email: str = g.current_user.get('email') or ''

    try:
        db = _get_db()

        # Fetch gamification progress
        gp_row = db.fetch_one(
            "SELECT * FROM gamification_progress WHERE user_id = ?",
            (user_id,),
        )
        gp = _row_to_progress(gp_row) if gp_row else _default_progress(user_id)

        # Fetch learning progress records
        lp_rows = db.fetch_all(
            "SELECT * FROM learning_progress WHERE user_id = ?",
            (user_id,),
        )

        # Build casesCompleted from learning_progress rows that are 100%
        cases_completed: List[Dict[str, object]] = []
        total_score: int = 0
        total_time: int = int(gp.get('total_time_spent', 0))

        for lp in lp_rows:
            pct = lp.get('progress_percentage', 0)
            pct_float = float(pct) if pct is not None else 0.0

            if pct_float >= 100:
                module_id: str = str(lp.get('module_id', ''))
                module_name: str = str(lp.get('module_name', module_id))

                # Extract best quiz score for this module
                quiz_raw = lp.get('quiz_scores')
                best_score: float = 0.0
                if quiz_raw:
                    scores = _safe_json_loads(str(quiz_raw), [])
                    for entry in scores:
                        if isinstance(entry, dict):
                            s = entry.get('score', 0)
                            if isinstance(s, (int, float)) and s > best_score:
                                best_score = float(s)
                        elif isinstance(entry, (int, float)) and float(entry) > best_score:
                            best_score = float(entry)

                case_time = int(lp.get('time_spent', 0))
                completed_at = lp.get('completed_at') or lp.get('updated_at') or ''

                cases_completed.append({
                    'caseId': module_id,
                    'caseTitle': module_name,
                    'category': str(lp.get('category', 'geral')),
                    'difficulty': str(lp.get('difficulty', 'intermediario')),
                    'score': int(best_score),
                    'maxScore': 100,
                    'percentage': int(best_score) if best_score > 0 else 100,
                    'timeSpent': case_time,
                    'attemptNumber': 1,
                    'completionDate': str(completed_at),
                    'stepResults': [],
                    'competencyScores': [],
                })
                total_score += int(best_score) if best_score > 0 else 100

        # Determine certification status
        n_cases = len(cases_completed)
        avg_score = (total_score / n_cases) if n_cases > 0 else 0.0
        min_cases = 4  # matches DEFAULT_CERTIFICATION_CONFIG.criteria.requiredCompletions
        min_score = 80  # matches DEFAULT_CERTIFICATION_CONFIG.criteria.minimumScore

        if n_cases == 0:
            cert_status = 'not_started'
        elif n_cases >= min_cases and avg_score >= min_score:
            cert_status = 'eligible'
        else:
            cert_status = 'in_progress'

        # Determine start date and last activity
        created_at = str(gp.get('created_at', ''))
        last_activity = str(gp.get('last_activity', ''))

        # Strength / improvement areas from quiz performance
        strength_areas: List[str] = []
        improvement_areas: List[str] = []
        for case in cases_completed:
            pct_val = int(case.get('percentage', 0))
            title = str(case.get('caseTitle', ''))
            if pct_val >= 80:
                strength_areas.append(title)
            elif pct_val < 70:
                improvement_areas.append(title)

        return jsonify({
            'success': True,
            'data': {
                'userId': user_id,
                'userName': user_name,
                'email': user_email,
                'startDate': created_at,
                'lastActivity': last_activity,
                'casesCompleted': cases_completed,
                'totalScore': total_score,
                'averageScore': round(avg_score, 1),
                'totalTimeSpent': total_time,
                'certificationStatus': cert_status,
                'strengthAreas': strength_areas,
                'improvementAreas': improvement_areas,
                'recommendedCases': [],
            },
        }), 200

    except Exception as exc:
        logger.error("certification_progress error: %s", sanitize_error(exc))
        return jsonify({'success': False, 'error': 'Erro ao verificar certificacao'}), 500


__all__ = ['gamification_bp']
