"""
JWT Manager - Sistema completo de autenticação com tokens
Implementação enterprise com refresh tokens e role-based access
"""

import jwt
import uuid
import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
import logging

from core.database import get_db_connection
from core.database.models import UserRole

logger = logging.getLogger(__name__)

class TokenType(Enum):
    ACCESS = "access"
    REFRESH = "refresh"

@dataclass
class TokenPair:
    access_token: str
    refresh_token: str
    expires_at: datetime
    user_id: str

@dataclass
class UserClaims:
    user_id: str
    email: str
    roles: List[str]
    session_id: str
    issued_at: datetime
    expires_at: datetime

class JWTManager:
    """
    Gerenciador JWT enterprise com refresh tokens e role management
    """

    def __init__(self, secret_key: str = None, algorithm: str = "HS256"):
        self.secret_key = secret_key or self._generate_secret_key()
        self.algorithm = algorithm
        self.access_token_expiry = timedelta(hours=1)  # 1 hora
        self.refresh_token_expiry = timedelta(days=7)  # 7 dias
        self.db = get_db_connection()

        logger.info("JWT Manager initialized with secure configuration")

    def _generate_secret_key(self) -> str:
        """Gera chave secreta segura"""
        return secrets.token_urlsafe(64)

    def _hash_password(self, password: str, salt: str = None) -> Tuple[str, str]:
        """Hash de senha com salt"""
        if salt is None:
            salt = secrets.token_hex(16)

        # PBKDF2 com SHA-256
        password_hash = hashlib.pbkdf2_hmac(
            'sha256',
            password.encode('utf-8'),
            salt.encode('utf-8'),
            100000  # 100k iterations
        )

        return password_hash.hex(), salt

    def _verify_password(self, password: str, password_hash: str, salt: str) -> bool:
        """Verifica senha"""
        computed_hash, _ = self._hash_password(password, salt)
        return secrets.compare_digest(computed_hash, password_hash)

    def create_user(self, email: str, password: str, roles: List[str] = None) -> str:
        """
        Cria novo usuário com senha hash
        """
        if roles is None:
            roles = [UserRole.STUDENT.value]

        # Verificar se email já existe
        existing_user = self.db.fetch_one(
            "SELECT id FROM users WHERE email = ?", (email,)
        )

        if existing_user:
            raise ValueError("Email already registered")

        # Hash da senha
        password_hash, salt = self._hash_password(password)
        full_hash = f"{password_hash}:{salt}"

        # Criar usuário
        user_data = {
            'email': email,
            'password_hash': full_hash,
            'roles': ','.join(roles),  # Armazenar como string separada por vírgula
            'is_active': True
        }

        user_id = self.db.insert('users', user_data)

        # Log de auditoria
        self.db.log_audit_event(
            user_id=user_id,
            action='user_created',
            resource='users',
            data={'email': email, 'roles': roles},
            ip_address='system'
        )

        logger.info(f"User created: {email}")
        return user_id

    def authenticate_user(self, email: str, password: str, ip_address: str = None,
                         user_agent: str = None) -> Optional[TokenPair]:
        """
        Autentica usuário e retorna tokens JWT
        """
        try:
            # Buscar usuário
            user = self.db.fetch_one(
                "SELECT id, email, password_hash, roles, is_active FROM users WHERE email = ?",
                (email,)
            )

            if not user or not user['is_active']:
                logger.warning(f"Authentication failed for {email}: user not found or inactive")
                return None

            # Verificar senha
            password_hash, salt = user['password_hash'].split(':')
            if not self._verify_password(password, password_hash, salt):
                logger.warning(f"Authentication failed for {email}: invalid password")
                return None

            # Atualizar último login
            self.db.update(
                'users',
                {'last_login': datetime.utcnow().isoformat()},
                'id = ?',
                (user['id'],)
            )

            # Gerar tokens
            token_pair = self._generate_token_pair(
                user_id=user['id'],
                email=user['email'],
                roles=user['roles'].split(','),
                ip_address=ip_address,
                user_agent=user_agent
            )

            # Log de auditoria
            self.db.log_audit_event(
                user_id=user['id'],
                action='user_login',
                resource='authentication',
                data={'email': email, 'ip_address': ip_address},
                ip_address=ip_address or 'unknown',
                user_agent=user_agent
            )

            logger.info(f"User authenticated successfully: {email}")
            return token_pair

        except Exception as e:
            logger.error(f"Authentication error for {email}: {e}")
            return None

    def _generate_token_pair(self, user_id: str, email: str, roles: List[str],
                            ip_address: str = None, user_agent: str = None) -> TokenPair:
        """
        Gera par de tokens (access + refresh)
        """
        session_id = str(uuid.uuid4())
        current_time = datetime.utcnow()

        # Claims do access token
        access_claims = {
            'user_id': user_id,
            'email': email,
            'roles': roles,
            'session_id': session_id,
            'type': TokenType.ACCESS.value,
            'iat': current_time,
            'exp': current_time + self.access_token_expiry
        }

        # Claims do refresh token
        refresh_claims = {
            'user_id': user_id,
            'session_id': session_id,
            'type': TokenType.REFRESH.value,
            'iat': current_time,
            'exp': current_time + self.refresh_token_expiry
        }

        # Gerar tokens
        access_token = jwt.encode(access_claims, self.secret_key, algorithm=self.algorithm)
        refresh_token = jwt.encode(refresh_claims, self.secret_key, algorithm=self.algorithm)

        # Salvar sessão no banco
        session_data = {
            'id': session_id,
            'user_id': user_id,
            'jwt_token': access_token,
            'refresh_token': refresh_token,
            'expires_at': (current_time + self.refresh_token_expiry).isoformat(),
            'ip_address': ip_address,
            'user_agent': user_agent
        }

        self.db.insert('sessions', session_data)

        return TokenPair(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_at=current_time + self.access_token_expiry,
            user_id=user_id
        )

    def verify_token(self, token: str, token_type: TokenType = TokenType.ACCESS) -> Optional[UserClaims]:
        """
        Verifica e decodifica token JWT
        """
        try:
            # Decodificar token
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])

            # Verificar tipo do token
            if payload.get('type') != token_type.value:
                logger.warning(f"Invalid token type: expected {token_type.value}, got {payload.get('type')}")
                return None

            # Verificar se sessão ainda é válida
            session = self.db.fetch_one(
                "SELECT is_active, expires_at FROM sessions WHERE id = ?",
                (payload['session_id'],)
            )

            if not session or not session['is_active']:
                logger.warning(f"Session not found or inactive: {payload['session_id']}")
                return None

            # Verificar expiração da sessão
            expires_at = datetime.fromisoformat(session['expires_at'])
            if datetime.utcnow() > expires_at:
                logger.warning(f"Session expired: {payload['session_id']}")
                return None

            # Retornar claims do usuário
            return UserClaims(
                user_id=payload['user_id'],
                email=payload['email'],
                roles=payload.get('roles', []),
                session_id=payload['session_id'],
                issued_at=datetime.fromtimestamp(payload['iat']),
                expires_at=datetime.fromtimestamp(payload['exp'])
            )

        except jwt.ExpiredSignatureError:
            logger.warning("Token expired")
            return None
        except jwt.InvalidTokenError as e:
            logger.warning(f"Invalid token: {e}")
            return None
        except Exception as e:
            logger.error(f"Token verification error: {e}")
            return None

    def refresh_access_token(self, refresh_token: str) -> Optional[str]:
        """
        Renova access token usando refresh token
        """
        # Verificar refresh token
        claims = self.verify_token(refresh_token, TokenType.REFRESH)
        if not claims:
            return None

        # Buscar dados do usuário
        user = self.db.fetch_one(
            "SELECT email, roles FROM users WHERE id = ? AND is_active = 1",
            (claims.user_id,)
        )

        if not user:
            return None

        # Gerar novo access token
        current_time = datetime.utcnow()
        access_claims = {
            'user_id': claims.user_id,
            'email': user['email'],
            'roles': user['roles'].split(','),
            'session_id': claims.session_id,
            'type': TokenType.ACCESS.value,
            'iat': current_time,
            'exp': current_time + self.access_token_expiry
        }

        new_access_token = jwt.encode(access_claims, self.secret_key, algorithm=self.algorithm)

        # Atualizar sessão
        self.db.update(
            'sessions',
            {'jwt_token': new_access_token},
            'id = ?',
            (claims.session_id,)
        )

        logger.info(f"Access token refreshed for user: {claims.user_id}")
        return new_access_token

    def revoke_session(self, session_id: str, user_id: str = None) -> bool:
        """
        Revoga sessão (logout)
        """
        try:
            where_clause = "id = ?"
            params = [session_id]

            if user_id:
                where_clause += " AND user_id = ?"
                params.append(user_id)

            affected = self.db.update(
                'sessions',
                {'is_active': False},
                where_clause,
                tuple(params)
            )

            if affected > 0:
                logger.info(f"Session revoked: {session_id}")
                return True

            return False

        except Exception as e:
            logger.error(f"Error revoking session: {e}")
            return False

    def revoke_all_user_sessions(self, user_id: str) -> int:
        """
        Revoga todas as sessões de um usuário
        """
        try:
            affected = self.db.update(
                'sessions',
                {'is_active': False},
                'user_id = ?',
                (user_id,)
            )

            logger.info(f"Revoked {affected} sessions for user: {user_id}")
            return affected

        except Exception as e:
            logger.error(f"Error revoking user sessions: {e}")
            return 0

    def has_role(self, user_claims: UserClaims, required_role: str) -> bool:
        """
        Verifica se usuário tem role específica
        """
        return required_role in user_claims.roles

    def has_any_role(self, user_claims: UserClaims, required_roles: List[str]) -> bool:
        """
        Verifica se usuário tem qualquer uma das roles
        """
        return any(role in user_claims.roles for role in required_roles)

    def is_admin(self, user_claims: UserClaims) -> bool:
        """
        Verifica se usuário é admin
        """
        return self.has_role(user_claims, UserRole.ADMIN.value)

    def cleanup_expired_sessions(self) -> int:
        """
        Remove sessões expiradas
        """
        current_time = datetime.utcnow().isoformat()
        affected = self.db.delete(
            'sessions',
            'expires_at < ? OR is_active = 0',
            (current_time,)
        )

        if affected > 0:
            logger.info(f"Cleaned up {affected} expired sessions")

        return affected

    def get_user_sessions(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Lista sessões ativas do usuário
        """
        return self.db.fetch_all(
            """
            SELECT id, created_at, expires_at, ip_address, user_agent
            FROM sessions
            WHERE user_id = ? AND is_active = 1
            ORDER BY created_at DESC
            """,
            (user_id,)
        )

    def get_session_stats(self) -> Dict[str, Any]:
        """
        Estatísticas de sessões
        """
        stats = {}

        # Total de sessões ativas
        active_sessions = self.db.fetch_one(
            "SELECT COUNT(*) as count FROM sessions WHERE is_active = 1"
        )
        stats['active_sessions'] = active_sessions['count'] if active_sessions else 0

        # Usuários únicos com sessões ativas
        unique_users = self.db.fetch_one(
            "SELECT COUNT(DISTINCT user_id) as count FROM sessions WHERE is_active = 1"
        )
        stats['active_users'] = unique_users['count'] if unique_users else 0

        # Sessões nas últimas 24h
        yesterday = (datetime.utcnow() - timedelta(days=1)).isoformat()
        recent_sessions = self.db.fetch_one(
            "SELECT COUNT(*) as count FROM sessions WHERE created_at > ?",
            (yesterday,)
        )
        stats['sessions_last_24h'] = recent_sessions['count'] if recent_sessions else 0

        return stats

# Instância global do JWT manager
_jwt_manager = None

def get_jwt_manager() -> JWTManager:
    """Obtém instância global do JWT manager"""
    global _jwt_manager
    if _jwt_manager is None:
        _jwt_manager = JWTManager()
    return _jwt_manager

def initialize_jwt_system(secret_key: str = None):
    """Inicializa sistema JWT"""
    global _jwt_manager
    _jwt_manager = JWTManager(secret_key)
    logger.info("JWT system initialized successfully")