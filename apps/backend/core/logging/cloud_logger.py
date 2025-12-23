"""
Google Cloud Logging System com Compliance LGPD
Sistema de logging robusto com retenção automática e mascaramento de dados sensíveis
"""

import json
import re
import os
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List, Literal
import hashlib
import uuid
from dataclasses import dataclass, asdict

# Tentar importar Google Cloud, usar fallback se não disponível
try:
    from google.cloud import logging as cloud_logging
    from google.cloud import dlp_v2
    from google.cloud.logging import Resource
    GOOGLE_CLOUD_AVAILABLE = True
except ImportError:
    GOOGLE_CLOUD_AVAILABLE = False
    # Importar fallback
    from .fallback_logger import fallback_cloud_logger

LogLevel = Literal['DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL']

@dataclass
class LGPDLogEntry:
    """Entrada de log com metadados LGPD"""
    log_id: str
    timestamp: datetime
    level: LogLevel
    message: str
    context: Dict[str, Any]
    data_category: Literal['personal_data', 'analytics', 'system', 'audit']
    retention_days: int
    expires_at: datetime
    user_id_hash: Optional[str] = None
    session_id: Optional[str] = None
    has_sensitive_data: bool = False

class CloudLogger:
    """
    Sistema de logging Google Cloud com compliance LGPD
    """

    def __init__(self):
        self.project_id = os.getenv('GOOGLE_CLOUD_PROJECT_ID')
        self.client = cloud_logging.Client(project=self.project_id)
        self.dlp_client = dlp_v2.DlpServiceClient()

        # Configurações de retenção LGPD
        self.retention_config = {
            'personal_data': 7,    # 7 dias - dados pessoais
            'analytics': 30,       # 30 dias - analytics anônimos
            'system': 90,          # 90 dias - logs de sistema
            'audit': 365           # 1 ano - logs de auditoria (obrigatório)
        }

        # Padrões de dados sensíveis
        self.sensitive_patterns = {
            'cpf': r'\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b',
            'email': r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
            'phone': r'\b\(?(?:\d{2})\)?\s*\d{4,5}-?\d{4}\b',
            'cns': r'\b\d{3}\s?\d{4}\s?\d{4}\s?\d{4}\b',  # Cartão Nacional de Saúde
            'crm': r'\bCRM[-\s]?[A-Z]{2}[-\s]?\d{4,6}\b',
            'medication': r'\b(?:rifampicina|clofazimina|dapsona|PQT-U|poliquimioterapia)\b'
        }

    def _hash_user_id(self, user_id: str) -> str:
        """Gera hash do user_id para anonimização"""
        if not user_id:
            return None
        return hashlib.sha256(f"{user_id}{os.getenv('HASH_SALT', 'default')}".encode()).hexdigest()[:16]

    def _detect_sensitive_data(self, content: str) -> tuple[bool, List[str]]:
        """Detecta dados sensíveis no conteúdo usando DLP API e regex"""
        found_types = []

        # Verificação por regex (rápida)
        for data_type, pattern in self.sensitive_patterns.items():
            if re.search(pattern, content, re.IGNORECASE):
                found_types.append(data_type)

        # DLP API para verificação avançada (opcional - se configurado)
        try:
            if os.getenv('ENABLE_DLP_API', 'false').lower() == 'true':
                parent = f"projects/{self.project_id}/locations/global"
                inspect_config = {
                    "info_types": [
                        {"name": "EMAIL_ADDRESS"},
                        {"name": "PHONE_NUMBER"},
                        {"name": "PERSON_NAME"}
                    ]
                }

                response = self.dlp_client.inspect_content(
                    request={
                        "parent": parent,
                        "inspect_config": inspect_config,
                        "item": {"value": content}
                    }
                )

                for finding in response.result.findings:
                    found_types.append(finding.info_type.name.lower())

        except Exception as e:
            # DLP API opcional - continua sem ela
            pass

        return len(found_types) > 0, found_types

    def _mask_sensitive_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Mascara dados sensíveis em estruturas complexas"""
        if isinstance(data, dict):
            masked = {}
            for key, value in data.items():
                if isinstance(value, str):
                    # Mascarar emails
                    if '@' in value:
                        parts = value.split('@')
                        if len(parts) == 2:
                            masked_user = parts[0][:2] + '*' * (len(parts[0]) - 2)
                            masked[key] = f"{masked_user}@{parts[1]}"
                        else:
                            masked[key] = value
                    # Mascarar CPF
                    elif re.match(r'\d{3}\.?\d{3}\.?\d{3}-?\d{2}', value):
                        masked[key] = f"{value[:4]}***.**-**"
                    # Mascarar telefones
                    elif re.match(r'\(?\d{2}\)?\s*\d{4,5}-?\d{4}', value):
                        masked[key] = f"{value[:5]}****-****"
                    else:
                        masked[key] = value
                elif isinstance(value, (dict, list)):
                    masked[key] = self._mask_sensitive_data(value)
                else:
                    masked[key] = value
            return masked
        elif isinstance(data, list):
            return [self._mask_sensitive_data(item) for item in data]
        else:
            return data

    def _create_log_entry(
        self,
        level: LogLevel,
        message: str,
        context: Dict[str, Any],
        data_category: str = 'system',
        user_id: Optional[str] = None,
        session_id: Optional[str] = None
    ) -> LGPDLogEntry:
        """Cria entrada de log com metadados LGPD"""

        # Detectar dados sensíveis
        full_content = f"{message} {json.dumps(context)}"
        has_sensitive, sensitive_types = self._detect_sensitive_data(full_content)

        # Ajustar categoria baseado na presença de dados sensíveis
        if has_sensitive and data_category not in ['audit']:
            data_category = 'personal_data'

        # Calcular retenção
        retention_days = self.retention_config.get(data_category, 7)
        expires_at = datetime.now(timezone.utc) + timedelta(days=retention_days)

        # Mascarar contexto se necessário
        masked_context = self._mask_sensitive_data(context) if has_sensitive else context

        return LGPDLogEntry(
            log_id=str(uuid.uuid4()),
            timestamp=datetime.now(timezone.utc),
            level=level,
            message=message,
            context=masked_context,
            data_category=data_category,
            retention_days=retention_days,
            expires_at=expires_at,
            user_id_hash=self._hash_user_id(user_id) if user_id else None,
            session_id=session_id,
            has_sensitive_data=has_sensitive
        )

    def _send_to_cloud_logging(self, entry: LGPDLogEntry):
        """Envia log para Google Cloud Logging"""
        try:
            # Configurar resource
            resource = Resource(
                type="gce_instance",
                labels={
                    "instance_id": os.getenv('INSTANCE_ID', 'local'),
                    "zone": os.getenv('ZONE', 'us-central1-a')
                }
            )

            # Criar logger específico por categoria
            logger_name = f"roteiro-dispensacao-{entry.data_category}"
            logger = self.client.logger(logger_name)

            # Estrutura do log
            log_data = {
                "log_id": entry.log_id,
                "timestamp": entry.timestamp.isoformat(),
                "message": entry.message,
                "context": entry.context,
                "lgpd_metadata": {
                    "data_category": entry.data_category,
                    "retention_days": entry.retention_days,
                    "expires_at": entry.expires_at.isoformat(),
                    "has_sensitive_data": entry.has_sensitive_data,
                    "user_id_hash": entry.user_id_hash,
                    "session_id": entry.session_id
                }
            }

            # Enviar com severity apropriada
            severity_map = {
                'DEBUG': 'DEBUG',
                'INFO': 'INFO',
                'WARNING': 'WARNING',
                'ERROR': 'ERROR',
                'CRITICAL': 'CRITICAL'
            }

            logger.log_struct(
                log_data,
                resource=resource,
                severity=severity_map.get(entry.level, 'INFO')
            )

        except Exception as e:
            # Fallback para logging local em caso de falha
            print(f"Erro ao enviar log para Cloud Logging: {e}")
            print(f"Log local: {entry.level} - {entry.message}")

    # Métodos públicos de logging
    def debug(self, message: str, context: Dict[str, Any] = None, user_id: str = None):
        """Log de debug"""
        entry = self._create_log_entry('DEBUG', message, context or {}, 'system', user_id)
        self._send_to_cloud_logging(entry)

    def info(self, message: str, context: Dict[str, Any] = None, user_id: str = None):
        """Log de informação"""
        entry = self._create_log_entry('INFO', message, context or {}, 'system', user_id)
        self._send_to_cloud_logging(entry)

    def warning(self, message: str, context: Dict[str, Any] = None, user_id: str = None):
        """Log de aviso"""
        entry = self._create_log_entry('WARNING', message, context or {}, 'system', user_id)
        self._send_to_cloud_logging(entry)

    def error(self, message: str, context: Dict[str, Any] = None, user_id: str = None):
        """Log de erro"""
        entry = self._create_log_entry('ERROR', message, context or {}, 'system', user_id)
        self._send_to_cloud_logging(entry)

    def critical(self, message: str, context: Dict[str, Any] = None, user_id: str = None):
        """Log crítico"""
        entry = self._create_log_entry('CRITICAL', message, context or {}, 'audit', user_id)
        self._send_to_cloud_logging(entry)

    def audit(self, message: str, context: Dict[str, Any] = None, user_id: str = None):
        """Log de auditoria LGPD com retenção estendida"""
        entry = self._create_log_entry('INFO', message, context or {}, 'audit', user_id)
        self._send_to_cloud_logging(entry)

    # Métodos especializados LGPD
    def lgpd_event(self, action: str, user_id: str, details: Dict[str, Any] = None):
        """Log específico para eventos LGPD"""
        context = {
            "action": action,
            "details": details or {},
            "compliance": "LGPD"
        }
        entry = self._create_log_entry('INFO', f"LGPD: {action}", context, 'audit', user_id)
        self._send_to_cloud_logging(entry)

    def medical_interaction(self, persona: str, query: str, user_id: str, response_time: float):
        """Log para interações médicas (dados sensíveis)"""
        context = {
            "persona": persona,
            "query_length": len(query),
            "query_hash": hashlib.md5(query.encode()).hexdigest()[:8],
            "response_time_ms": response_time,
            "medical_context": True
        }
        entry = self._create_log_entry('INFO', "Medical interaction", context, 'personal_data', user_id)
        self._send_to_cloud_logging(entry)

    def analytics_event(self, event_type: str, properties: Dict[str, Any]):
        """Log para analytics (dados anônimos)"""
        context = {
            "event_type": event_type,
            "properties": properties,
            "anonymous": True
        }
        entry = self._create_log_entry('INFO', f"Analytics: {event_type}", context, 'analytics')
        self._send_to_cloud_logging(entry)

    def security_alert(self, alert_type: str, details: Dict[str, Any], user_id: str = None):
        """Log para alertas de segurança"""
        context = {
            "alert_type": alert_type,
            "details": details,
            "security_level": "HIGH"
        }
        entry = self._create_log_entry('CRITICAL', f"Security Alert: {alert_type}", context, 'audit', user_id)
        self._send_to_cloud_logging(entry)

# Instância singleton com fallback
if GOOGLE_CLOUD_AVAILABLE:
    cloud_logger = CloudLogger()
    print("Google Cloud Logging ativado")
else:
    cloud_logger = fallback_cloud_logger
    print("Usando Fallback Logger (Google Cloud indisponivel)")

# Export para uso em outros módulos
__all__ = ['cloud_logger', 'CloudLogger', 'LGPDLogEntry']