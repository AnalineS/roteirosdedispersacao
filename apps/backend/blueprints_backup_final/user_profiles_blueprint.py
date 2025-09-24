# -*- coding: utf-8 -*-
"""
Blueprint para gerenciamento de perfis de usuário
Sistema real sem Firebase - armazenamento no banco de dados
"""

from flask import Blueprint, request, jsonify, current_app
import json
import os
import sqlite3
from datetime import datetime
import logging
from typing import Optional, Dict, Any
import hashlib
from dataclasses import dataclass, asdict

logger = logging.getLogger(__name__)

# Criar o blueprint
user_profiles_blueprint = Blueprint('user_profiles', __name__, url_prefix='/api/user-profiles')

# Configuração do banco de dados SQLite
DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'user_profiles.db')

@dataclass
class UserProfileData:
    """Estrutura de dados para perfis de usuário"""
    uid: str
    email: Optional[str] = None
    displayName: Optional[str] = None
    type: str = 'patient'
    focus: str = 'general'
    confidence: float = 0.5
    explanation: str = ''
    selectedPersona: Optional[str] = None
    isAdmin: bool = False
    adminLevel: Optional[str] = None
    preferences: Dict[str, Any] = None
    history: Dict[str, Any] = None
    stats: Dict[str, Any] = None
    createdAt: str = None
    updatedAt: str = None
    version: str = '2.0'
    isAnonymous: bool = True
    institutionId: Optional[str] = None

    def __post_init__(self):
        if self.preferences is None:
            self.preferences = {
                'language': 'simple',
                'notifications': True,
                'theme': 'auto'
            }
        if self.history is None:
            self.history = {
                'lastPersona': self.selectedPersona or 'ga',
                'conversationCount': 0,
                'lastAccess': datetime.utcnow().isoformat(),
                'preferredTopics': [],
                'totalSessions': 0,
                'totalTimeSpent': 0,
                'completedModules': [],
                'achievements': []
            }
        if self.stats is None:
            self.stats = {
                'totalQuestions': 0,
                'averageConfidence': self.confidence,
                'preferredPersona': self.selectedPersona or 'ga',
                'lastActivity': datetime.utcnow().isoformat()
            }
        if self.createdAt is None:
            self.createdAt = datetime.utcnow().isoformat()
        if self.updatedAt is None:
            self.updatedAt = datetime.utcnow().isoformat()

def init_user_profiles_db():
    """Inicializa o banco de dados de perfis de usuário"""
    try:
        # Criar diretório se não existir
        os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        # Criar tabela de perfis
        cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_profiles (
            uid TEXT PRIMARY KEY,
            email TEXT,
            display_name TEXT,
            type TEXT NOT NULL DEFAULT 'patient',
            focus TEXT NOT NULL DEFAULT 'general',
            confidence REAL NOT NULL DEFAULT 0.5,
            explanation TEXT DEFAULT '',
            selected_persona TEXT,
            is_admin BOOLEAN DEFAULT FALSE,
            admin_level TEXT,
            preferences TEXT,
            history TEXT,
            stats TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            version TEXT DEFAULT '2.0',
            is_anonymous BOOLEAN DEFAULT TRUE,
            institution_id TEXT
        )
        ''')

        conn.commit()
        conn.close()

        logger.info("Banco de dados de perfis de usuário inicializado com sucesso")
        return True

    except Exception as e:
        logger.error(f"Erro ao inicializar banco de perfis: {e}")
        return False

def get_user_profile_from_db(uid: str) -> Optional[Dict[str, Any]]:
    """Buscar perfil do usuário no banco"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        cursor.execute('''
        SELECT * FROM user_profiles WHERE uid = ?
        ''', (uid,))

        row = cursor.fetchone()
        conn.close()

        if row:
            # Converter para dicionário
            columns = [description[0] for description in cursor.description]
            profile_dict = dict(zip(columns, row))

            # Converter campos JSON
            if profile_dict['preferences']:
                profile_dict['preferences'] = json.loads(profile_dict['preferences'])
            if profile_dict['history']:
                profile_dict['history'] = json.loads(profile_dict['history'])
            if profile_dict['stats']:
                profile_dict['stats'] = json.loads(profile_dict['stats'])

            return profile_dict

        return None

    except Exception as e:
        logger.error(f"Erro ao buscar perfil {uid}: {e}")
        return None

def save_user_profile_to_db(profile_data: UserProfileData) -> bool:
    """Salvar perfil do usuário no banco"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        # Atualizar timestamp
        profile_data.updatedAt = datetime.utcnow().isoformat()

        # Verificar se perfil existe
        cursor.execute('SELECT uid FROM user_profiles WHERE uid = ?', (profile_data.uid,))
        exists = cursor.fetchone() is not None

        if exists:
            # Atualizar perfil existente
            cursor.execute('''
            UPDATE user_profiles SET
                email = ?, display_name = ?, type = ?, focus = ?, confidence = ?,
                explanation = ?, selected_persona = ?, is_admin = ?, admin_level = ?,
                preferences = ?, history = ?, stats = ?, updated_at = ?,
                version = ?, is_anonymous = ?, institution_id = ?
            WHERE uid = ?
            ''', (
                profile_data.email, profile_data.displayName, profile_data.type,
                profile_data.focus, profile_data.confidence, profile_data.explanation,
                profile_data.selectedPersona, profile_data.isAdmin, profile_data.adminLevel,
                json.dumps(profile_data.preferences), json.dumps(profile_data.history),
                json.dumps(profile_data.stats), profile_data.updatedAt,
                profile_data.version, profile_data.isAnonymous, profile_data.institutionId,
                profile_data.uid
            ))
        else:
            # Inserir novo perfil
            cursor.execute('''
            INSERT INTO user_profiles (
                uid, email, display_name, type, focus, confidence,
                explanation, selected_persona, is_admin, admin_level,
                preferences, history, stats, created_at, updated_at,
                version, is_anonymous, institution_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                profile_data.uid, profile_data.email, profile_data.displayName,
                profile_data.type, profile_data.focus, profile_data.confidence,
                profile_data.explanation, profile_data.selectedPersona, profile_data.isAdmin,
                profile_data.adminLevel, json.dumps(profile_data.preferences),
                json.dumps(profile_data.history), json.dumps(profile_data.stats),
                profile_data.createdAt, profile_data.updatedAt, profile_data.version,
                profile_data.isAnonymous, profile_data.institutionId
            ))

        conn.commit()
        conn.close()

        return True

    except Exception as e:
        logger.error(f"Erro ao salvar perfil {profile_data.uid}: {e}")
        return False

def delete_user_profile_from_db(uid: str) -> bool:
    """Deletar perfil do usuário do banco"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        cursor.execute('DELETE FROM user_profiles WHERE uid = ?', (uid,))

        conn.commit()
        conn.close()

        return True

    except Exception as e:
        logger.error(f"Erro ao deletar perfil {uid}: {e}")
        return False

@user_profiles_blueprint.route('/health', methods=['GET'])
def health_check():
    """Health check do sistema de perfis"""
    try:
        # Testar conexão com banco
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute('SELECT COUNT(*) FROM user_profiles')
        profile_count = cursor.fetchone()[0]
        conn.close()

        return jsonify({
            "status": "healthy",
            "database": "connected",
            "total_profiles": profile_count,
            "timestamp": datetime.utcnow().isoformat()
        })

    except Exception as e:
        logger.error(f"Health check falhou: {e}")
        return jsonify({"status": "unhealthy", "error": str(e)}), 500

@user_profiles_blueprint.route('/<uid>', methods=['GET'])
def get_profile(uid: str):
    """Buscar perfil do usuário"""
    try:
        profile = get_user_profile_from_db(uid)

        if profile:
            return jsonify({
                "success": True,
                "data": profile
            })
        else:
            return jsonify({
                "success": False,
                "error": "Perfil não encontrado",
                "data": None
            }), 404

    except Exception as e:
        logger.error(f"Erro ao buscar perfil {uid}: {e}")
        return jsonify({
            "success": False,
            "error": str(e),
            "data": None
        }), 500

@user_profiles_blueprint.route('/<uid>', methods=['POST', 'PUT'])
def save_profile(uid: str):
    """Salvar perfil do usuário"""
    try:
        data = request.get_json()

        if not data:
            return jsonify({
                "success": False,
                "error": "Dados do perfil são obrigatórios"
            }), 400

        # Garantir que o UID bate
        data['uid'] = uid

        # Criar objeto de perfil
        profile_data = UserProfileData(**data)

        # Salvar no banco
        success = save_user_profile_to_db(profile_data)

        if success:
            return jsonify({
                "success": True,
                "message": "Perfil salvo com sucesso"
            })
        else:
            return jsonify({
                "success": False,
                "error": "Erro ao salvar perfil no banco"
            }), 500

    except Exception as e:
        logger.error(f"Erro ao salvar perfil {uid}: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@user_profiles_blueprint.route('/<uid>', methods=['DELETE'])
def delete_profile(uid: str):
    """Deletar perfil do usuário"""
    try:
        success = delete_user_profile_from_db(uid)

        if success:
            return jsonify({
                "success": True,
                "message": "Perfil deletado com sucesso"
            })
        else:
            return jsonify({
                "success": False,
                "error": "Erro ao deletar perfil"
            }), 500

    except Exception as e:
        logger.error(f"Erro ao deletar perfil {uid}: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@user_profiles_blueprint.route('/bulk/export', methods=['GET'])
def export_profiles():
    """Exportar todos os perfis para backup"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        cursor.execute('SELECT * FROM user_profiles')
        rows = cursor.fetchall()

        columns = [description[0] for description in cursor.description]
        profiles = []

        for row in rows:
            profile_dict = dict(zip(columns, row))

            # Converter campos JSON
            if profile_dict['preferences']:
                profile_dict['preferences'] = json.loads(profile_dict['preferences'])
            if profile_dict['history']:
                profile_dict['history'] = json.loads(profile_dict['history'])
            if profile_dict['stats']:
                profile_dict['stats'] = json.loads(profile_dict['stats'])

            profiles.append(profile_dict)

        conn.close()

        return jsonify({
            "success": True,
            "count": len(profiles),
            "profiles": profiles,
            "exported_at": datetime.utcnow().isoformat()
        })

    except Exception as e:
        logger.error(f"Erro ao exportar perfis: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# Inicializar banco na importação do módulo
init_user_profiles_db()