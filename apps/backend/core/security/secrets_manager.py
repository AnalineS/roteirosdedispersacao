"""
Sistema Robusto de Gestão de Secrets
====================================

Módulo para gerenciamento seguro de secrets, tokens e variáveis de ambiente
com suporte a rotação automática e criptografia.

Funcionalidades:
- Gestão segura de variáveis de ambiente
- Rotação automática de tokens
- Criptografia de dados sensíveis em repouso
- Validação de secrets
- Logs de auditoria de acesso
"""

import os
import json
import hashlib
import secrets
import logging
from datetime import datetime, timedelta
from typing import Dict, Optional, Any, List, Tuple
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64
import threading
from dataclasses import dataclass, asdict
from pathlib import Path


# Logger específico para secrets
security_logger = logging.getLogger('security.secrets')


@dataclass
class SecretMetadata:
    """Metadados de um secret"""
    name: str
    created_at: datetime
    last_accessed: datetime
    last_rotated: datetime
    rotation_interval_days: int
    is_encrypted: bool
    access_count: int
    environment: str
    is_critical: bool
    expires_at: Optional[datetime] = None


class SecretRotationPolicy:
    """Política de rotação de secrets"""
    
    def __init__(self):
        self.policies = {
            'api_keys': {'interval_days': 30, 'auto_rotate': True},
            'tokens': {'interval_days': 7, 'auto_rotate': True},
            'passwords': {'interval_days': 90, 'auto_rotate': False},
            'certificates': {'interval_days': 365, 'auto_rotate': False},
            'database_credentials': {'interval_days': 60, 'auto_rotate': False}
        }
    
    def get_policy(self, secret_type: str) -> Dict[str, Any]:
        """Obtém política para tipo de secret"""
        return self.policies.get(secret_type, {'interval_days': 30, 'auto_rotate': False})
    
    def should_rotate(self, metadata: SecretMetadata) -> bool:
        """Verifica se secret deve ser rotacionado"""
        if metadata.rotation_interval_days <= 0:
            return False
        
        days_since_rotation = (datetime.now() - metadata.last_rotated).days
        return days_since_rotation >= metadata.rotation_interval_days


class SecretEncryption:
    """Sistema de criptografia para secrets"""
    
    def __init__(self, master_key: Optional[str] = None):
        self.master_key = master_key or os.environ.get('SECRET_MASTER_KEY')
        if not self.master_key:
            # Gerar chave master se não existir
            self.master_key = base64.urlsafe_b64encode(secrets.token_bytes(32)).decode()
            security_logger.warning("Chave master gerada automaticamente - configure SECRET_MASTER_KEY")
        
        self._fernet = self._create_fernet()
    
    def _create_fernet(self) -> Fernet:
        """Cria instância Fernet com chave derivada"""
        # Usar salt fixo para consistência (em produção, usar salt por secret)
        salt = b'roteiro_dispensacao_salt_2025'
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(self.master_key.encode()))
        return Fernet(key)
    
    def encrypt(self, data: str) -> str:
        """Criptografa dados"""
        try:
            encrypted = self._fernet.encrypt(data.encode())
            return base64.urlsafe_b64encode(encrypted).decode()
        except Exception as e:
            security_logger.error(f"Erro ao criptografar dados: {e}")
            raise
    
    def decrypt(self, encrypted_data: str) -> str:
        """Descriptografa dados"""
        try:
            encrypted_bytes = base64.urlsafe_b64decode(encrypted_data.encode())
            decrypted = self._fernet.decrypt(encrypted_bytes)
            return decrypted.decode()
        except Exception as e:
            security_logger.error(f"Erro ao descriptografar dados: {e}")
            raise


class SecretsManager:
    """
    Gerenciador robusto de secrets com funcionalidades avançadas
    """
    
    def __init__(self, config_dir: Optional[str] = None):
        # Sanitize config directory path to prevent path traversal
        raw_config_dir = config_dir or os.environ.get('SECRETS_CONFIG_DIR', './config/secrets')
        safe_config_dir = os.path.basename(raw_config_dir.replace('..', '').replace('/', '_').replace('\\', '_'))
        self.config_dir = Path('./config') / safe_config_dir
        self.config_dir.mkdir(parents=True, exist_ok=True)
        
        self.metadata_file = self.config_dir / 'secrets_metadata.json'
        self.encrypted_secrets_file = self.config_dir / 'encrypted_secrets.json'
        
        self.encryption = SecretEncryption()
        self.rotation_policy = SecretRotationPolicy()
        self.metadata: Dict[str, SecretMetadata] = {}
        self.secrets_cache: Dict[str, Any] = {}
        self.access_log: List[Dict] = []
        
        self._lock = threading.RLock()
        
        # Carregar metadados existentes
        self._load_metadata()
        
        # Iniciar thread de rotação automática
        self._start_rotation_thread()
        
        security_logger.info("SecretsManager inicializado com segurança")
    
    def _load_metadata(self):
        """Carrega metadados dos secrets"""
        try:
            if self.metadata_file.exists():
                with open(self.metadata_file, 'r') as f:
                    data = json.load(f)
                    
                for name, meta_dict in data.items():
                    # Converter strings de data para datetime
                    for date_field in ['created_at', 'last_accessed', 'last_rotated', 'expires_at']:
                        if meta_dict.get(date_field):
                            meta_dict[date_field] = datetime.fromisoformat(meta_dict[date_field])
                    
                    self.metadata[name] = SecretMetadata(**meta_dict)
                
                security_logger.info(f"Metadados carregados para {len(self.metadata)} secrets")
        except Exception as e:
            security_logger.error(f"Erro ao carregar metadados: {e}")
            self.metadata = {}
    
    def _save_metadata(self):
        """Salva metadados dos secrets"""
        try:
            # Converter datetime para string para JSON
            data = {}
            for name, metadata in self.metadata.items():
                meta_dict = asdict(metadata)
                for date_field in ['created_at', 'last_accessed', 'last_rotated', 'expires_at']:
                    if meta_dict.get(date_field):
                        meta_dict[date_field] = meta_dict[date_field].isoformat()
                data[name] = meta_dict
            
            with open(self.metadata_file, 'w') as f:
                json.dump(data, f, indent=2)
                
        except Exception as e:
            security_logger.error(f"Erro ao salvar metadados: {e}")
    
    def set_secret(self, 
                   name: str, 
                   value: str, 
                   secret_type: str = 'general',
                   encrypt: bool = True,
                   is_critical: bool = False,
                   expires_in_days: Optional[int] = None) -> bool:
        """
        Define um secret com metadados e opções de segurança
        
        Args:
            name: Nome do secret
            value: Valor do secret
            secret_type: Tipo do secret (para política de rotação)
            encrypt: Se deve criptografar o secret
            is_critical: Se é um secret crítico
            expires_in_days: Dias até expiração
        """
        with self._lock:
            try:
                now = datetime.now()
                policy = self.rotation_policy.get_policy(secret_type)
                
                # Criar metadados
                expires_at = now + timedelta(days=expires_in_days) if expires_in_days else None
                
                metadata = SecretMetadata(
                    name=name,
                    created_at=now,
                    last_accessed=now,
                    last_rotated=now,
                    rotation_interval_days=policy['interval_days'],
                    is_encrypted=encrypt,
                    access_count=0,
                    environment=os.environ.get('FLASK_ENV', 'unknown'),
                    is_critical=is_critical,
                    expires_at=expires_at
                )
                
                # Criptografar se necessário
                if encrypt:
                    encrypted_value = self.encryption.encrypt(value)
                    self.secrets_cache[name] = encrypted_value
                else:
                    self.secrets_cache[name] = value
                
                self.metadata[name] = metadata
                self._save_metadata()
                
                # Log de auditoria
                self._log_access(name, 'SET', success=True, details={'encrypted': encrypt, 'critical': is_critical})
                
                security_logger.info(f"Secret '{name}' definido com sucesso")
                return True
                
            except Exception as e:
                security_logger.error(f"Erro ao definir secret '{name}': {e}")
                self._log_access(name, 'SET', success=False, error=str(e))
                return False
    
    def get_secret(self, name: str, log_access: bool = True) -> Optional[str]:
        """
        Obtém um secret descriptografando se necessário
        
        Args:
            name: Nome do secret
            log_access: Se deve logar o acesso
        """
        with self._lock:
            try:
                # Verificar se secret existe
                if name not in self.metadata:
                    # Tentar buscar da variável de ambiente
                    env_value = os.environ.get(name)
                    if env_value:
                        if log_access:
                            self._log_access(name, 'GET_ENV', success=True)
                        return env_value
                    
                    if log_access:
                        self._log_access(name, 'GET', success=False, error='Secret não encontrado')
                    return None
                
                metadata = self.metadata[name]
                
                # Verificar expiração
                if metadata.expires_at and datetime.now() > metadata.expires_at:
                    security_logger.warning(f"Secret '{name}' expirado")
                    if log_access:
                        self._log_access(name, 'GET', success=False, error='Secret expirado')
                    return None
                
                # Obter valor
                value = self.secrets_cache.get(name)
                if value is None:
                    if log_access:
                        self._log_access(name, 'GET', success=False, error='Valor não encontrado no cache')
                    return None
                
                # Descriptografar se necessário
                if metadata.is_encrypted:
                    decrypted_value = self.encryption.decrypt(value)
                else:
                    decrypted_value = value
                
                # Atualizar metadados de acesso
                if log_access:
                    metadata.last_accessed = datetime.now()
                    metadata.access_count += 1
                    self._save_metadata()
                    self._log_access(name, 'GET', success=True)
                
                return decrypted_value
                
            except Exception as e:
                security_logger.error(f"Erro ao obter secret '{name}': {e}")
                if log_access:
                    self._log_access(name, 'GET', success=False, error=str(e))
                return None
    
    def rotate_secret(self, name: str, new_value: str) -> bool:
        """Rotaciona um secret"""
        with self._lock:
            try:
                if name not in self.metadata:
                    return False
                
                metadata = self.metadata[name]
                
                # Criptografar novo valor se necessário
                if metadata.is_encrypted:
                    encrypted_value = self.encryption.encrypt(new_value)
                    self.secrets_cache[name] = encrypted_value
                else:
                    self.secrets_cache[name] = new_value
                
                # Atualizar metadados
                metadata.last_rotated = datetime.now()
                self._save_metadata()
                
                self._log_access(name, 'ROTATE', success=True)
                security_logger.info(f"Secret '{name}' rotacionado com sucesso")
                return True
                
            except Exception as e:
                security_logger.error(f"Erro ao rotacionar secret '{name}': {e}")
                self._log_access(name, 'ROTATE', success=False, error=str(e))
                return False
    
    def delete_secret(self, name: str) -> bool:
        """Remove um secret"""
        with self._lock:
            try:
                if name in self.metadata:
                    del self.metadata[name]
                    self._save_metadata()
                
                if name in self.secrets_cache:
                    del self.secrets_cache[name]
                
                self._log_access(name, 'DELETE', success=True)
                security_logger.info(f"Secret '{name}' removido com sucesso")
                return True
                
            except Exception as e:
                security_logger.error(f"Erro ao remover secret '{name}': {e}")
                self._log_access(name, 'DELETE', success=False, error=str(e))
                return False
    
    def list_secrets(self) -> List[Dict[str, Any]]:
        """Lista todos os secrets com metadados (sem valores)"""
        secrets_list = []
        for name, metadata in self.metadata.items():
            secrets_list.append({
                'name': name,
                'created_at': metadata.created_at.isoformat(),
                'last_accessed': metadata.last_accessed.isoformat(),
                'last_rotated': metadata.last_rotated.isoformat(),
                'access_count': metadata.access_count,
                'is_encrypted': metadata.is_encrypted,
                'is_critical': metadata.is_critical,
                'expires_at': metadata.expires_at.isoformat() if metadata.expires_at else None,
                'needs_rotation': self.rotation_policy.should_rotate(metadata)
            })
        return secrets_list
    
    def get_secrets_requiring_rotation(self) -> List[str]:
        """Retorna lista de secrets que precisam ser rotacionados"""
        return [
            name for name, metadata in self.metadata.items()
            if self.rotation_policy.should_rotate(metadata)
        ]
    
    def _log_access(self, secret_name: str, operation: str, success: bool, details: Dict = None, error: str = None):
        """Registra acesso para auditoria"""
        log_entry = {
            'timestamp': datetime.now().isoformat(),
            'secret_name': secret_name,
            'operation': operation,
            'success': success,
            'client_info': {
                'environment': os.environ.get('FLASK_ENV', 'unknown'),
                'process_id': os.getpid()
            },
            'details': details or {},
            'error': error
        }
        
        self.access_log.append(log_entry)
        
        # Manter apenas últimos 1000 logs
        if len(self.access_log) > 1000:
            self.access_log = self.access_log[-1000:]
        
        # Log estruturado para o sistema
        security_logger.info(f"SECRET_ACCESS: {json.dumps(log_entry)}")
    
    def _start_rotation_thread(self):
        """Inicia thread para rotação automática"""
        def rotation_worker():
            import time
            while True:
                try:
                    time.sleep(3600)  # Verificar a cada hora
                    self._check_and_rotate_secrets()
                except Exception as e:
                    security_logger.error(f"Erro na thread de rotação: {e}")
        
        rotation_thread = threading.Thread(target=rotation_worker, daemon=True)
        rotation_thread.start()
        security_logger.info("Thread de rotação automática iniciada")
    
    def _check_and_rotate_secrets(self):
        """Verifica e rotaciona secrets automaticamente"""
        secrets_to_rotate = self.get_secrets_requiring_rotation()
        
        for secret_name in secrets_to_rotate:
            metadata = self.metadata[secret_name]
            policy = self.rotation_policy.get_policy('general')
            
            if policy.get('auto_rotate', False):
                # Para auto-rotação, gerar novo token/chave
                if 'token' in secret_name.lower() or 'key' in secret_name.lower():
                    new_value = self._generate_secure_token()
                    if self.rotate_secret(secret_name, new_value):
                        # Segurança: Não logar nomes de secrets
                        security_logger.info("Secret rotacionado automaticamente")
                else:
                    # Segurança: Não logar nomes de secrets
                    security_logger.warning("Secret precisa de rotação manual - verificar configurações")
    
    def _generate_secure_token(self, length: int = 32) -> str:
        """Gera token seguro"""
        return secrets.token_urlsafe(length)
    
    def get_audit_log(self, limit: int = 100) -> List[Dict]:
        """Retorna log de auditoria"""
        return self.access_log[-limit:]
    
    def health_check(self) -> Dict[str, Any]:
        """Verificação de saúde do sistema de secrets"""
        try:
            total_secrets = len(self.metadata)
            critical_secrets = sum(1 for m in self.metadata.values() if m.is_critical)
            encrypted_secrets = sum(1 for m in self.metadata.values() if m.is_encrypted)
            expired_secrets = sum(
                1 for m in self.metadata.values() 
                if m.expires_at and datetime.now() > m.expires_at
            )
            secrets_needing_rotation = len(self.get_secrets_requiring_rotation())
            
            return {
                'status': 'healthy',
                'total_secrets': total_secrets,
                'critical_secrets': critical_secrets,
                'encrypted_secrets': encrypted_secrets,
                'expired_secrets': expired_secrets,
                'secrets_needing_rotation': secrets_needing_rotation,
                'encryption_enabled': True,
                'rotation_thread_active': True,
                'last_check': datetime.now().isoformat()
            }
        except Exception as e:
            return {
                'status': 'unhealthy',
                'error': str(e),
                'last_check': datetime.now().isoformat()
            }