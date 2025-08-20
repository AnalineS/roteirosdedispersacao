# -*- coding: utf-8 -*-
"""
Sistema Avançado de Logging com Rotação Híbrida
Implementa logging estruturado, redação de dados sensíveis e métricas de performance
"""

import logging
import logging.handlers
import os
import json
import re
import time
import threading
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from dataclasses import dataclass, asdict
from pathlib import Path
import gzip
import shutil

# Import configurações
from app_config import config, EnvironmentConfig

@dataclass
class LogMetrics:
    """Métricas de logging do sistema"""
    log_entries_count: int = 0
    error_count: int = 0
    warning_count: int = 0
    info_count: int = 0
    debug_count: int = 0
    sensitive_data_redacted: int = 0
    performance_logs: int = 0
    last_rotation: Optional[str] = None
    total_log_size_mb: float = 0.0
    avg_log_rate_per_minute: float = 0.0

class SensitiveDataRedactor:
    """Redator de dados sensíveis em logs"""
    
    def __init__(self):
        """Inicializa padrões de redação"""
        # Padrões de dados sensíveis
        self.sensitive_patterns = {
            # CPF - formato xxx.xxx.xxx-xx
            'cpf': r'\b\d{3}\.\d{3}\.\d{3}-\d{2}\b',
            # CPF - formato apenas números
            'cpf_numbers': r'\b\d{11}\b',
            # RG
            'rg': r'\b\d{1,2}\.\d{3}\.\d{3}-?\d?\b',
            # Telefone
            'phone': r'\b(?:\+55\s?)?(?:\(\d{2}\)\s?)?\d{4,5}-?\d{4}\b',
            # Email
            'email': r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
            # Cartão de crédito
            'credit_card': r'\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b',
            # API Keys (padrões comuns)
            'api_key': r'\b(?:api[_-]?key|token|secret)[\s=:]["\']?([A-Za-z0-9_-]{20,})["\']?\b',
            # Senhas em logs - pattern to detect but not hardcode password
            'password_pattern': r'\b(?:password|senha|pwd)[\s=:]["\']?([^"\s]{6,})["\']?\b',
            # IPs privados (para logs em produção)
            'private_ip': r'\b(?:10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2[0-9]|3[01])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3})\b'
        }
        
        # Padrões médicos específicos (para logs médicos)
        self.medical_patterns = {
            # Números de prontuário
            'medical_record': r'\b(?:prontuario|registro)[\s#:]*(\d{6,})\b',
            # Dados de nascimento
            'birth_date': r'\b\d{1,2}[/-]\d{1,2}[/-]\d{4}\b',
            # Endereços completos
            'address': r'\b(?:rua|av|avenida|alameda)\s+[^,]{10,50},?\s*\d+\b'
        }
        
        # Compilar padrões para performance
        self.compiled_patterns = {}
        for name, pattern in {**self.sensitive_patterns, **self.medical_patterns}.items():
            self.compiled_patterns[name] = re.compile(pattern, re.IGNORECASE)
    
    def redact_sensitive_data(self, message: str, context: str = "") -> tuple[str, int]:
        """
        Redige dados sensíveis da mensagem de log
        Retorna (mensagem_redacted, quantidade_redacted)
        """
        redacted_message = message
        redaction_count = 0
        
        # Aplicar redação baseada no contexto
        if EnvironmentConfig.is_production():
            # Em produção, rediger mais agressivamente
            patterns_to_use = self.compiled_patterns
        else:
            # Em desenvolvimento, rediger apenas dados críticos
            patterns_to_use = {
                k: v for k, v in self.compiled_patterns.items() 
                if k in ['cpf', 'cpf_numbers', 'credit_card', 'api_key', 'password']
            }
        
        # Aplicar redação
        for pattern_name, pattern in patterns_to_use.items():
            matches = pattern.findall(redacted_message)
            if matches:
                redaction_count += len(matches)
                
                # Estratégias de redação específicas
                if pattern_name in ['cpf', 'cpf_numbers']:
                    redacted_message = pattern.sub('***CPF_REDACTED***', redacted_message)
                elif pattern_name == 'email':
                    redacted_message = pattern.sub('***EMAIL_REDACTED***', redacted_message)
                elif pattern_name in ['api_key', 'password']:
                    redacted_message = pattern.sub('***SENSITIVE_REDACTED***', redacted_message)
                elif pattern_name == 'phone':
                    redacted_message = pattern.sub('***PHONE_REDACTED***', redacted_message)
                elif pattern_name == 'private_ip' and EnvironmentConfig.is_production():
                    redacted_message = pattern.sub('***IP_REDACTED***', redacted_message)
                else:
                    redacted_message = pattern.sub('***REDACTED***', redacted_message)
        
        return redacted_message, redaction_count

class StructuredJSONFormatter(logging.Formatter):
    """Formatter para logs estruturados em JSON"""
    
    def __init__(self, redactor: SensitiveDataRedactor):
        super().__init__()
        self.redactor = redactor
        self.hostname = os.getenv('HOSTNAME', 'localhost')
        self.service_name = 'roteiros-dispensacao-backend'
    
    def format(self, record: logging.LogRecord) -> str:
        """Formata log record para JSON estruturado"""
        # Dados básicos
        log_data = {
            'timestamp': datetime.utcnow().isoformat() + 'Z',
            'level': record.levelname,
            'logger': record.name,
            'service': self.service_name,
            'environment': EnvironmentConfig.get_current(),
            'hostname': self.hostname,
            'thread_id': record.thread,
            'process_id': record.process
        }
        
        # Mensagem com redação de dados sensíveis
        original_message = record.getMessage()
        redacted_message, redaction_count = self.redactor.redact_sensitive_data(
            original_message, 
            context=record.name
        )
        log_data['message'] = redacted_message
        
        # Metadados adicionais se houver redação
        if redaction_count > 0:
            log_data['security'] = {
                'sensitive_data_redacted': redaction_count
            }
        
        # Request ID se disponível
        if hasattr(record, 'request_id'):
            log_data['request_id'] = record.request_id
        
        # Performance data se disponível
        if hasattr(record, 'performance'):
            log_data['performance'] = record.performance
        
        # Exception info
        if record.exc_info:
            log_data['exception'] = {
                'type': record.exc_info[0].__name__ if record.exc_info[0] else None,
                'message': str(record.exc_info[1]) if record.exc_info[1] else None,
                'traceback': self.formatException(record.exc_info) if record.exc_info else None
            }
        
        # Contexto adicional personalizado
        extra_data = {}
        for key, value in record.__dict__.items():
            if key not in ['name', 'msg', 'args', 'levelname', 'levelno', 'pathname',
                          'filename', 'module', 'exc_info', 'exc_text', 'stack_info',
                          'lineno', 'funcName', 'created', 'msecs', 'relativeCreated',
                          'thread', 'threadName', 'processName', 'process', 'message',
                          'request_id', 'performance']:
                extra_data[key] = value
        
        if extra_data:
            log_data['extra'] = extra_data
        
        return json.dumps(log_data, ensure_ascii=False, default=str)

class HybridRotatingFileHandler(logging.handlers.RotatingFileHandler):
    """Handler com rotação híbrida: tamanho + tempo"""
    
    def __init__(self, filename, mode='a', maxBytes=50*1024*1024, backupCount=10, 
                 maxAge=7, compressionDelay=1):
        """
        Args:
            filename: Nome do arquivo de log
            mode: Modo de abertura
            maxBytes: Tamanho máximo em bytes (50MB default)
            backupCount: Número de backups
            maxAge: Idade máxima em dias (7 dias default)
            compressionDelay: Dias antes de comprimir (1 dia default)
        """
        super().__init__(filename, mode, maxBytes, backupCount)
        self.maxAge = maxAge
        self.compressionDelay = compressionDelay
        self._compression_thread = None
    
    def shouldRollover(self, record):
        """Determina se deve fazer rollover baseado em tamanho E tempo"""
        # Rollover por tamanho
        size_rollover = super().shouldRollover(record)
        
        # Rollover por tempo (diário)
        time_rollover = False
        if self.stream:
            try:
                stat = os.stat(self.baseFilename)
                file_age = time.time() - stat.st_mtime
                # Rollover se arquivo tem mais de 24h
                time_rollover = file_age > 86400  # 24 horas
            except OSError:
                # Se não conseguir acessar stats do arquivo (arquivo deletado, sem permissão, etc),
                # continuar sem rollover por tempo - o rollover por tamanho ainda funcionará
                time_rollover = False
        
        return size_rollover or time_rollover
    
    def doRollover(self):
        """Executa rollover com compressão assíncrona"""
        super().doRollover()
        
        # Comprimir arquivos antigos em background
        if self._compression_thread is None or not self._compression_thread.is_alive():
            self._compression_thread = threading.Thread(
                target=self._compress_old_files,
                daemon=True
            )
            self._compression_thread.start()
        
        # Limpar arquivos muito antigos
        self._cleanup_old_files()
    
    def _compress_old_files(self):
        """Comprime arquivos antigos para economizar espaço"""
        try:
            for i in range(self.compressionDelay, self.backupCount + 1):
                old_log = f"{self.baseFilename}.{i}"
                compressed_log = f"{old_log}.gz"
                
                if os.path.exists(old_log) and not os.path.exists(compressed_log):
                    with open(old_log, 'rb') as f_in:
                        with gzip.open(compressed_log, 'wb') as f_out:
                            shutil.copyfileobj(f_in, f_out)
                    
                    # Remove arquivo original após compressão
                    os.remove(old_log)
                    
        except Exception as e:
            # Log erro de compressão (mas não falhar)
            print(f"Erro na compressão de logs: {e}")
    
    def _cleanup_old_files(self):
        """Remove arquivos muito antigos"""
        try:
            # Encontrar todos os arquivos de log
            log_dir = os.path.dirname(self.baseFilename)
            base_name = os.path.basename(self.baseFilename)
            
            cutoff_time = time.time() - (self.maxAge * 86400)  # maxAge em segundos
            
            for file in os.listdir(log_dir):
                if file.startswith(base_name) and file != base_name:
                    file_path = os.path.join(log_dir, file)
                    try:
                        if os.path.getmtime(file_path) < cutoff_time:
                            os.remove(file_path)
                    except OSError:
                        # Arquivo pode estar em uso ou sem permissão para deletar
                        # Continuar com próximo arquivo sem interromper a limpeza
                        continue
                        
        except Exception as e:
            print(f"Erro na limpeza de logs antigos: {e}")

class AdvancedLoggingSystem:
    """Sistema avançado de logging com métricas"""
    
    def __init__(self):
        self.metrics = LogMetrics()
        self.redactor = SensitiveDataRedactor()
        self.start_time = time.time()
        self._metrics_lock = threading.Lock()
        
        # Configurar estrutura de logs
        self.log_dir = Path("logs")
        self.log_dir.mkdir(exist_ok=True)
        
        # Configurar loggers
        self._setup_loggers()
        
        # Iniciar coleta de métricas
        self._start_metrics_collection()
    
    def _setup_loggers(self):
        """Configura todos os loggers do sistema"""
        # Formatter estruturado
        json_formatter = StructuredJSONFormatter(self.redactor)
        
        # Console handler (desenvolvimento)
        console_handler = logging.StreamHandler()
        if EnvironmentConfig.is_development():
            console_formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            console_handler.setFormatter(console_formatter)
        else:
            console_handler.setFormatter(json_formatter)
        
        # File handler principal
        main_log_handler = HybridRotatingFileHandler(
            filename=self.log_dir / "application.log",
            maxBytes=50*1024*1024,  # 50MB
            backupCount=10,
            maxAge=7,
            compressionDelay=1
        )
        main_log_handler.setFormatter(json_formatter)
        
        # Error log handler
        error_log_handler = HybridRotatingFileHandler(
            filename=self.log_dir / "errors.log",
            maxBytes=10*1024*1024,  # 10MB
            backupCount=5,
            maxAge=30,
            compressionDelay=1
        )
        error_log_handler.setLevel(logging.ERROR)
        error_log_handler.setFormatter(json_formatter)
        
        # Performance log handler
        performance_log_handler = HybridRotatingFileHandler(
            filename=self.log_dir / "performance.log",
            maxBytes=25*1024*1024,  # 25MB
            backupCount=7,
            maxAge=7,
            compressionDelay=1
        )
        performance_log_handler.setFormatter(json_formatter)
        
        # Security log handler
        security_log_handler = HybridRotatingFileHandler(
            filename=self.log_dir / "security.log",
            maxBytes=10*1024*1024,  # 10MB
            backupCount=12,
            maxAge=90,  # 90 dias para logs de segurança
            compressionDelay=7
        )
        security_log_handler.setFormatter(json_formatter)
        
        # Configurar logger raiz
        root_logger = logging.getLogger()
        root_logger.setLevel(getattr(logging, config.LOG_LEVEL))
        root_logger.handlers.clear()  # Limpar handlers existentes
        
        # Adicionar handlers
        root_logger.addHandler(console_handler)
        root_logger.addHandler(main_log_handler)
        root_logger.addHandler(error_log_handler)
        
        # Logger de performance
        perf_logger = logging.getLogger('performance')
        perf_logger.addHandler(performance_log_handler)
        perf_logger.propagate = False
        
        # Logger de segurança
        security_logger = logging.getLogger('security')
        security_logger.addHandler(security_log_handler)
        security_logger.propagate = False
        
        # Custom filter para métricas
        class MetricsFilter(logging.Filter):
            def __init__(self, metrics_system):
                super().__init__()
                self.metrics = metrics_system
            
            def filter(self, record):
                self.metrics._update_metrics(record)
                return True
        
        # Aplicar filter de métricas
        metrics_filter = MetricsFilter(self)
        for handler in root_logger.handlers:
            handler.addFilter(metrics_filter)
    
    def _update_metrics(self, record: logging.LogRecord):
        """Atualiza métricas de logging"""
        with self._metrics_lock:
            self.metrics.log_entries_count += 1
            
            if record.levelno >= logging.ERROR:
                self.metrics.error_count += 1
            elif record.levelno >= logging.WARNING:
                self.metrics.warning_count += 1
            elif record.levelno >= logging.INFO:
                self.metrics.info_count += 1
            else:
                self.metrics.debug_count += 1
            
            # Detectar logs de performance
            if hasattr(record, 'performance') or 'performance' in record.name:
                self.metrics.performance_logs += 1
    
    def _start_metrics_collection(self):
        """Inicia coleta periódica de métricas"""
        def collect_metrics():
            while True:
                time.sleep(300)  # A cada 5 minutos
                self._calculate_metrics()
        
        metrics_thread = threading.Thread(target=collect_metrics, daemon=True)
        metrics_thread.start()
    
    def _calculate_metrics(self):
        """Calcula métricas avançadas"""
        with self._metrics_lock:
            # Calcular taxa de logs por minuto
            elapsed_minutes = (time.time() - self.start_time) / 60
            if elapsed_minutes > 0:
                self.metrics.avg_log_rate_per_minute = self.metrics.log_entries_count / elapsed_minutes
            
            # Calcular tamanho total dos logs
            total_size = 0
            try:
                for log_file in self.log_dir.glob("*.log*"):
                    total_size += log_file.stat().st_size
                self.metrics.total_log_size_mb = total_size / (1024 * 1024)
            except Exception:
                # Falha ao calcular tamanho dos logs não é crítica
                # Manter o valor anterior de total_log_size_mb
                self.metrics.total_log_size_mb = 0
    
    def get_metrics(self) -> Dict[str, Any]:
        """Retorna métricas atuais do sistema de logging"""
        with self._metrics_lock:
            return asdict(self.metrics)
    
    def log_performance(self, operation: str, duration_ms: float, 
                       request_id: str = None, **kwargs):
        """Log estruturado de performance"""
        perf_logger = logging.getLogger('performance')
        
        perf_data = {
            'operation': operation,
            'duration_ms': duration_ms,
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        }
        perf_data.update(kwargs)
        
        # Criar record customizado
        record = perf_logger.makeRecord(
            perf_logger.name,
            logging.INFO,
            __file__,
            0,
            f"Performance: {operation} completed in {duration_ms:.2f}ms",
            (),
            None
        )
        record.performance = perf_data
        if request_id:
            record.request_id = request_id
        
        perf_logger.handle(record)
    
    def log_security_event(self, event_type: str, details: Dict[str, Any], 
                          severity: str = 'INFO', request_id: str = None):
        """Log estruturado de eventos de segurança"""
        security_logger = logging.getLogger('security')
        
        security_data = {
            'event_type': event_type,
            'severity': severity,
            'details': details,
            'timestamp': datetime.utcnow().isoformat() + 'Z'
        }
        
        record = security_logger.makeRecord(
            security_logger.name,
            getattr(logging, severity),
            __file__,
            0,
            f"Security Event: {event_type}",
            (),
            None
        )
        record.security = security_data
        if request_id:
            record.request_id = request_id
        
        security_logger.handle(record)

# Instância global
advanced_logging_system = AdvancedLoggingSystem()

# Funções de conveniência
def get_logging_metrics() -> Dict[str, Any]:
    """Retorna métricas de logging"""
    return advanced_logging_system.get_metrics()

def log_performance(operation: str, duration_ms: float, request_id: str = None, **kwargs):
    """Log de performance"""
    advanced_logging_system.log_performance(operation, duration_ms, request_id, **kwargs)

def log_security_event(event_type: str, details: Dict[str, Any], 
                      severity: str = 'INFO', request_id: str = None):
    """Log de evento de segurança"""
    advanced_logging_system.log_security_event(event_type, details, severity, request_id)

__all__ = [
    'AdvancedLoggingSystem',
    'advanced_logging_system',
    'get_logging_metrics',
    'log_performance',
    'log_security_event'
]