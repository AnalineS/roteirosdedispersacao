"""
Fallback Logger - Sistema local compatível com CloudLogger
Sistema de logging compatível sem dependências do Google Cloud
"""

import json
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, Literal
from dataclasses import dataclass, asdict

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
    user_id: Optional[str] = None

class FallbackCloudLogger:
    """Logger local que simula a interface do CloudLogger"""

    def __init__(self):
        self.logger = logging.getLogger('fallback_cloud_logger')
        self.enabled = True

    def _mask_sensitive_data(self, data: Any) -> Any:
        """Mascarar dados sensíveis básico"""
        if isinstance(data, dict):
            masked = {}
            for key, value in data.items():
                if any(sensitive in key.lower() for sensitive in ['password', 'email', 'cpf', 'rg']):
                    masked[key] = "***MASKED***"
                else:
                    masked[key] = self._mask_sensitive_data(value)
            return masked
        elif isinstance(data, str) and len(data) > 10:
            return data[:3] + "***" + data[-3:]
        return data

    def _create_log_entry(self, level: LogLevel, message: str, context: Dict[str, Any],
                         data_category: str, user_id: str = None) -> LGPDLogEntry:
        """Criar entrada de log"""
        import uuid

        retention_map = {
            'personal_data': 7,    # 7 dias para dados pessoais
            'analytics': 30,       # 30 dias para analytics
            'system': 90,          # 90 dias para logs de sistema
            'audit': 365           # 1 ano para auditoria
        }

        retention_days = retention_map.get(data_category, 7)

        return LGPDLogEntry(
            log_id=f"fallback_{uuid.uuid4().hex[:8]}",
            timestamp=datetime.utcnow(),
            level=level,
            message=message,
            context=self._mask_sensitive_data(context),
            data_category=data_category,
            retention_days=retention_days,
            expires_at=datetime.utcnow() + timedelta(days=retention_days),
            user_id=user_id[:8] + "***" if user_id else None  # Mascarar user_id
        )

    def _send_to_fallback_logging(self, entry: LGPDLogEntry):
        """Enviar para logging local"""
        log_data = {
            "id": entry.log_id,
            "timestamp": entry.timestamp.isoformat(),
            "level": entry.level,
            "message": entry.message,
            "context": entry.context,
            "category": entry.data_category,
            "user_id": entry.user_id,
            "expires_at": entry.expires_at.isoformat()
        }

        log_message = f"[{entry.level}] {entry.message} | Context: {json.dumps(entry.context)}"

        if entry.level == 'DEBUG':
            self.logger.debug(log_message)
        elif entry.level == 'INFO':
            self.logger.info(log_message)
        elif entry.level == 'WARNING':
            self.logger.warning(log_message)
        elif entry.level == 'ERROR':
            self.logger.error(log_message)
        elif entry.level == 'CRITICAL':
            self.logger.critical(log_message)

    # Métodos públicos compatíveis com CloudLogger
    def debug(self, message: str, context: Dict[str, Any] = None, user_id: str = None):
        """Log debug"""
        entry = self._create_log_entry('DEBUG', message, context or {}, 'system', user_id)
        self._send_to_fallback_logging(entry)

    def info(self, message: str, context: Dict[str, Any] = None, user_id: str = None):
        """Log info"""
        entry = self._create_log_entry('INFO', message, context or {}, 'system', user_id)
        self._send_to_fallback_logging(entry)

    def warning(self, message: str, context: Dict[str, Any] = None, user_id: str = None):
        """Log warning"""
        entry = self._create_log_entry('WARNING', message, context or {}, 'system', user_id)
        self._send_to_fallback_logging(entry)

    def error(self, message: str, error: Exception = None, context: Dict[str, Any] = None, user_id: str = None):
        """Log error"""
        error_context = context or {}
        if error:
            error_context.update({
                "error_type": type(error).__name__,
                "error_message": str(error)[:200]  # Limitar tamanho
            })
        entry = self._create_log_entry('ERROR', message, error_context, 'system', user_id)
        self._send_to_fallback_logging(entry)

    def critical(self, message: str, context: Dict[str, Any] = None, user_id: str = None):
        """Log crítico"""
        entry = self._create_log_entry('CRITICAL', message, context or {}, 'audit', user_id)
        self._send_to_fallback_logging(entry)

    def audit(self, message: str, context: Dict[str, Any] = None, user_id: str = None):
        """Log de auditoria LGPD com retenção estendida"""
        entry = self._create_log_entry('INFO', message, context or {}, 'audit', user_id)
        self._send_to_fallback_logging(entry)

    # Métodos especializados LGPD
    def lgpd_event(self, action: str, user_id: str, details: Dict[str, Any] = None):
        """Log específico para eventos LGPD"""
        context = {
            "action": action,
            "details": details or {},
            "compliance": "LGPD"
        }
        entry = self._create_log_entry('INFO', f"LGPD: {action}", context, 'audit', user_id)
        self._send_to_fallback_logging(entry)

    def medical_interaction(self, persona: str, query_hash: str, user_id: str, response_time: float):
        """Log para interações médicas (dados sensíveis)"""
        context = {
            "persona": persona,
            "query_hash": query_hash,  # Apenas hash, não conteúdo
            "response_time_ms": response_time,
            "medical_interaction": True
        }
        entry = self._create_log_entry('INFO', "Medical interaction", context, 'personal_data', user_id)
        self._send_to_fallback_logging(entry)

    def analytics_event(self, event_type: str, properties: Dict[str, Any] = None):
        """Log para analytics anônimos"""
        context = {
            "event_type": event_type,
            "properties": properties or {},
            "anonymous": True
        }
        entry = self._create_log_entry('INFO', f"Analytics: {event_type}", context, 'analytics')
        self._send_to_fallback_logging(entry)

# Instância singleton
fallback_cloud_logger = FallbackCloudLogger()