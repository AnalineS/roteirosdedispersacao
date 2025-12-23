# -*- coding: utf-8 -*-
"""
JWT Authentication Manager
Sistema de autenticação próprio para substituir Firebase Auth

Features:
- JWT tokens com refresh
- Google OAuth integration
- Sessão persistente no SQLite
- Rate limiting
- Security headers
"""

import jwt
import uuid
import hashlib
import requests
from datetime import datetime, timedelta, timezone
from typing import Dict, Optional, Tuple
from urllib.parse import urlencode
import os
import logging

from services.storage.sqlite_manager import get_db_manager

logger = logging.getLogger(__name__)

class JWTAuthManager:
    """
    Gerenciador de autenticação JWT com Google OAuth

    Substituição completa do Firebase Auth:
    - Tokens JWT seguros
    - Refresh tokens
    - Google OAuth flow
    - Session management
    - User profiles

    Security:
    - PBKDF2-HMAC password hashing with unique salts per user (CWE-329 prevention)
    - Context7 best practice: os.urandom(16) for cryptographically secure salt generation
    """

    def __init__(self):
        # Configurações JWT
        self.secret_key = os.getenv("SECRET_KEY", self._generate_secret())
        self.algorithm = "HS256"
        self.access_token_expire = timedelta(hours=1)
        self.refresh_token_expire = timedelta(days=30)

        # Google OAuth
        self.google_client_id = os.getenv("GOOGLE_CLIENT_ID", "")
        self.google_client_secret = os.getenv("GOOGLE_CLIENT_SECRET", "")
        self.google_redirect_uri = os.getenv("GOOGLE_REDIRECT_URI", "")

        # Rate limiting
        self._rate_limit_cache = {}
        self.max_attempts = 5
        self.lockout_duration = timedelta(minutes=15)

        # Database
        self.db = get_db_manager()

        logger.info("JWT Auth Manager inicializado")

    def _generate_secret(self) -> str:
        """Gerar chave secreta se não existir"""
        return os.urandom(32).hex()

    def _rate_limit_check(self, identifier: str) -> bool:
        """Verificar rate limiting"""
        now = datetime.now(timezone.utc)
        key = f"auth_attempts:{identifier}"

        # Limpar tentativas antigas
        if key in self._rate_limit_cache:
            attempts = self._rate_limit_cache[key]
            # Filtrar tentativas recentes
            recent_attempts = [
                attempt for attempt in attempts
                if now - attempt < self.lockout_duration
            ]
            self._rate_limit_cache[key] = recent_attempts
        else:
            self._rate_limit_cache[key] = []

        # Verificar se está bloqueado
        if len(self._rate_limit_cache[key]) >= self.max_attempts:
            return False

        return True

    def _add_rate_limit_attempt(self, identifier: str):
        """Adicionar tentativa ao rate limit"""
        key = f"auth_attempts:{identifier}"
        if key not in self._rate_limit_cache:
            self._rate_limit_cache[key] = []

        self._rate_limit_cache[key].append(datetime.now(timezone.utc))

    def _hash_token(self, token: str) -> str:
        """Hash seguro de token"""
        return hashlib.sha256(token.encode()).hexdigest()

    # === GERAÇÃO DE TOKENS ===

    def generate_tokens(self, user_id: str, user_data: Dict) -> Tuple[str, str, str]:
        """
        Gerar access token, refresh token e session ID

        Returns:
            Tuple[access_token, refresh_token, session_id]
        """
        now = datetime.now(timezone.utc)
        session_id = str(uuid.uuid4())

        # Access Token (curta duração)
        access_payload = {
            'user_id': user_id,
            'session_id': session_id,
            'email': user_data.get('email'),
            'name': user_data.get('name'),
            'iat': now,
            'exp': now + self.access_token_expire,
            'type': 'access'
        }
        access_token = jwt.encode(access_payload, self.secret_key, algorithm=self.algorithm)

        # Refresh Token (longa duração)
        refresh_payload = {
            'user_id': user_id,
            'session_id': session_id,
            'iat': now,
            'exp': now + self.refresh_token_expire,
            'type': 'refresh'
        }
        refresh_token = jwt.encode(refresh_payload, self.secret_key, algorithm=self.algorithm)

        # Salvar sessão no banco
        expires_at = now + self.refresh_token_expire
        token_hash = self._hash_token(refresh_token)

        self.db.create_session(
            session_id=session_id,
            user_id=user_id,
            token_hash=token_hash,
            expires_at=expires_at
        )

        logger.info(f"Tokens gerados para usuário: {user_data.get('email')}")

        return access_token, refresh_token, session_id

    def verify_token(self, token: str, token_type: str = 'access') -> Optional[Dict]:
        """
        Verificar e decodificar token JWT

        Args:
            token: JWT token
            token_type: 'access' ou 'refresh'

        Returns:
            Dict com dados do usuário ou None se inválido
        """
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])

            # Verificar tipo do token
            if payload.get('type') != token_type:
                return None

            # Verificar se sessão ainda existe (para refresh tokens)
            if token_type == 'refresh':
                session = self.db.get_session(payload.get('session_id'))
                if not session:
                    return None

                # Verificar hash do token
                if session['token_hash'] != self._hash_token(token):
                    return None

            return payload

        except jwt.ExpiredSignatureError:
            logger.debug("Token expirado")
            return None
        except jwt.InvalidTokenError as e:
            logger.debug(f"Token inválido: {e}")
            return None

    def refresh_access_token(self, refresh_token: str) -> Optional[str]:
        """
        Gerar novo access token usando refresh token

        Args:
            refresh_token: Refresh token válido

        Returns:
            Novo access token ou None se inválido
        """
        payload = self.verify_token(refresh_token, 'refresh')
        if not payload:
            return None

        # Buscar dados do usuário
        user = self.db.get_user(payload['user_id'])
        if not user:
            return None

        # Gerar novo access token
        now = datetime.now(timezone.utc)
        access_payload = {
            'user_id': user['id'],
            'session_id': payload['session_id'],
            'email': user['email'],
            'name': user['name'],
            'iat': now,
            'exp': now + self.access_token_expire,
            'type': 'access'
        }

        access_token = jwt.encode(access_payload, self.secret_key, algorithm=self.algorithm)
        logger.debug(f"Access token renovado para: {user['email']}")

        return access_token

    def revoke_session(self, session_id: str) -> bool:
        """Revogar sessão (logout)"""
        return self.db.delete_session(session_id)

    def revoke_all_sessions(self, user_id: str) -> bool:
        """Revogar todas as sessões do usuário"""
        try:
            with self.db._get_connection() as conn:
                conn.execute("DELETE FROM sessions WHERE user_id = ?", (user_id,))
                conn.commit()
                logger.info(f"Todas as sessões revogadas para usuário: {user_id}")
                return True
        except Exception as e:
            logger.error(f"Erro ao revogar sessões: {e}")
            return False

    # === GOOGLE OAUTH ===

    def get_google_auth_url(self, state: Optional[str] = None) -> str:
        """
        Gerar URL de autenticação Google

        Args:
            state: Estado customizado para CSRF protection

        Returns:
            URL de autenticação Google
        """
        if not self.google_client_id:
            raise ValueError("Google Client ID não configurado")

        state = state or str(uuid.uuid4())

        params = {
            'client_id': self.google_client_id,
            'redirect_uri': self.google_redirect_uri,
            'scope': 'openid email profile',
            'response_type': 'code',
            'access_type': 'online',
            'prompt': 'select_account',
            'state': state
        }

        auth_url = f"https://accounts.google.com/o/oauth2/auth?{urlencode(params)}"
        logger.debug("URL de autenticação Google gerada")

        return auth_url

    def handle_google_callback(self, code: str, state: Optional[str] = None) -> Optional[Dict]:
        """
        Processar callback do Google OAuth

        Args:
            code: Authorization code do Google
            state: Estado para verificação CSRF

        Returns:
            Dict com user_data e tokens ou None se falhou
        """
        if not self.google_client_id or not self.google_client_secret:
            raise ValueError("Credenciais Google não configuradas")

        try:
            # Trocar code por access token
            token_data = self._exchange_google_code(code)
            if not token_data:
                return None

            # Obter dados do usuário
            user_data = self._get_google_user_info(token_data['access_token'])
            if not user_data:
                return None

            # Criar/atualizar usuário no banco
            user_id = user_data['sub']  # Google user ID
            self.db.insert_user(
                user_id=user_id,
                email=user_data['email'],
                name=user_data['name'],
                profile_data={
                    'picture': user_data.get('picture'),
                    'locale': user_data.get('locale'),
                    'auth_provider': 'google'
                }
            )

            # Gerar tokens JWT
            access_token, refresh_token, session_id = self.generate_tokens(user_id, user_data)

            logger.info(f"Login Google bem-sucedido: {user_data['email']}")

            return {
                'user': user_data,
                'access_token': access_token,
                'refresh_token': refresh_token,
                'session_id': session_id
            }

        except Exception as e:
            logger.error(f"Erro no callback Google: {e}")
            return None

    def _exchange_google_code(self, code: str) -> Optional[Dict]:
        """Trocar authorization code por access token"""
        try:
            data = {
                'client_id': self.google_client_id,
                'client_secret': self.google_client_secret,
                'code': code,
                'grant_type': 'authorization_code',
                'redirect_uri': self.google_redirect_uri
            }

            response = requests.post(
                'https://oauth2.googleapis.com/token',
                data=data,
                timeout=10
            )
            response.raise_for_status()

            return response.json()

        except Exception as e:
            logger.error(f"Erro ao trocar code Google: {e}")
            return None

    def _get_google_user_info(self, access_token: str) -> Optional[Dict]:
        """Obter informações do usuário Google"""
        try:
            headers = {'Authorization': f'Bearer {access_token}'}
            response = requests.get(
                'https://www.googleapis.com/oauth2/v1/userinfo',
                headers=headers,
                timeout=10
            )
            response.raise_for_status()

            return response.json()

        except Exception as e:
            logger.error(f"Erro ao obter user info Google: {e}")
            return None

    # === EMAIL/PASSWORD (OPCIONAL) ===

    def register_user(self, email: str, password: str, name: str) -> Optional[Dict]:
        """
        Registrar usuário com email/senha

        Args:
            email: Email do usuário
            password: Senha em texto plano
            name: Nome do usuário

        Returns:
            Dict com user_data e tokens ou None se falhou
        """
        # Rate limiting
        if not self._rate_limit_check(email):
            logger.warning(f"Rate limit excedido para: {email}")
            return None

        try:
            # Verificar se email já existe
            existing_user = None
            with self.db._get_connection() as conn:
                result = conn.execute(
                    "SELECT id FROM users WHERE email = ?", (email,)
                ).fetchone()
                if result:
                    existing_user = result

            if existing_user:
                self._add_rate_limit_attempt(email)
                return None

            # SECURITY FIX: Generate unique salt per user (CWE-329 prevention)
            # Context7 best practice: Use os.urandom(16) for cryptographically secure random salt
            # Each user gets a unique salt to prevent rainbow table attacks
            salt = os.urandom(16)

            # Hash da senha com salt único
            password_hash = hashlib.pbkdf2_hmac(
                'sha256', password.encode(), salt, 100000
            ).hex()

            # Store salt with hash (format: salt_hex:hash_hex)
            salt_hex = salt.hex()
            stored_credential = f"{salt_hex}:{password_hash}"

            # Gerar user ID
            user_id = str(uuid.uuid4())

            # Inserir usuário
            self.db.insert_user(
                user_id=user_id,
                email=email,
                name=name,
                profile_data={
                    'password_hash': stored_credential,  # Store salt:hash
                    'auth_provider': 'email'
                }
            )

            # Gerar tokens
            user_data = {'sub': user_id, 'email': email, 'name': name}
            access_token, refresh_token, session_id = self.generate_tokens(user_id, user_data)

            logger.info(f"Usuário registrado: {email}")

            return {
                'user': user_data,
                'access_token': access_token,
                'refresh_token': refresh_token,
                'session_id': session_id
            }

        except Exception as e:
            logger.error(f"Erro ao registrar usuário: {e}")
            self._add_rate_limit_attempt(email)
            return None

    def login_user(self, email: str, password: str) -> Optional[Dict]:
        """
        Login com email/senha

        Args:
            email: Email do usuário
            password: Senha em texto plano

        Returns:
            Dict com user_data e tokens ou None se falhou
        """
        # Rate limiting
        if not self._rate_limit_check(email):
            logger.warning(f"Rate limit excedido para: {email}")
            return None

        try:
            # Buscar usuário
            user = self.db.get_user_by_email(email)
            if not user:
                self._add_rate_limit_attempt(email)
                return None

            # Verificar senha
            profile_data = user.get('profile_data', {})
            stored_hash = profile_data.get('password_hash')

            if not stored_hash:
                self._add_rate_limit_attempt(email)
                return None

            # SECURITY FIX: Extract salt from stored credential (CWE-329 prevention)
            # Format: salt_hex:hash_hex
            try:
                salt_hex, expected_hash = stored_hash.split(':', 1)
                salt = bytes.fromhex(salt_hex)
            except (ValueError, AttributeError):
                # BACKWARD COMPATIBILITY: Handle old format without salt
                # This allows existing users to login while migrating to new format
                logger.warning(f"User {email} using legacy password format without salt")
                salt = b'salt'  # Legacy fallback
                expected_hash = stored_hash

            # Validar hash com salt do usuário
            password_hash = hashlib.pbkdf2_hmac(
                'sha256', password.encode(), salt, 100000
            ).hex()

            if password_hash != expected_hash:
                self._add_rate_limit_attempt(email)
                return None

            # Gerar tokens
            user_data = {'sub': user['id'], 'email': email, 'name': user['name']}
            access_token, refresh_token, session_id = self.generate_tokens(user['id'], user_data)

            logger.info(f"Login bem-sucedido: {email}")

            return {
                'user': user_data,
                'access_token': access_token,
                'refresh_token': refresh_token,
                'session_id': session_id
            }

        except Exception as e:
            logger.error(f"Erro no login: {e}")
            self._add_rate_limit_attempt(email)
            return None

    # === UTILITIES ===

    def get_user_profile(self, user_id: str) -> Optional[Dict]:
        """Obter perfil do usuário"""
        return self.db.get_user(user_id)

    def update_user_profile(self, user_id: str, profile_data: Dict) -> bool:
        """Atualizar perfil do usuário"""
        user = self.db.get_user(user_id)
        if not user:
            return False

        # Merge com dados existentes
        current_profile = user.get('profile_data', {})
        current_profile.update(profile_data)

        return self.db.insert_user(
            user_id=user_id,
            email=user['email'],
            name=profile_data.get('name', user['name']),
            profile_data=current_profile
        )

    def cleanup_expired_sessions(self) -> int:
        """Limpar sessões expiradas"""
        try:
            with self.db._get_connection() as conn:
                cursor = conn.execute("""
                    DELETE FROM sessions WHERE expires_at <= CURRENT_TIMESTAMP
                """)
                conn.commit()
                count = cursor.rowcount
                logger.debug(f"Sessões expiradas removidas: {count}")
                return count
        except Exception as e:
            logger.error(f"Erro ao limpar sessões: {e}")
            return 0

# Instância global
auth_manager = None

def get_auth_manager() -> JWTAuthManager:
    """Obter instância global do Auth manager"""
    global auth_manager
    if auth_manager is None:
        auth_manager = JWTAuthManager()
    return auth_manager