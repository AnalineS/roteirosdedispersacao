# -*- coding: utf-8 -*-
"""
Sistema de Auditoria Médica para Conformidade LGPD/ANVISA/CFM
Implementa logging seguro e criptografado para interações médicas
"""

import os
import json
import hashlib
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, asdict
from enum import Enum
import logging
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import base64

# Configurar logger específico para auditoria
audit_logger = logging.getLogger('medical_audit')
audit_logger.setLevel(logging.INFO)

# Handler para arquivo de auditoria separado
audit_handler = logging.FileHandler('logs/medical_audit.log')
audit_formatter = logging.Formatter(
    '%(asctime)s - %(levelname)s - [AUDIT] - %(message)s'
)
audit_handler.setFormatter(audit_formatter)
audit_logger.addHandler(audit_handler)

class MedicalDataClassification(Enum):
    """Classificação de dados médicos conforme LGPD/ANVISA"""
    PUBLIC = "public"                    # Informações públicas
    EDUCATIONAL = "educational"          # Conteúdo educacional
    SENSITIVE_MEDICAL = "sensitive"      # Dados médicos sensíveis
    PERSONAL_HEALTH = "personal_health"  # Dados pessoais de saúde
    PRESCRIPTION = "prescription"        # Dados de prescrição
    AUDIT_TRAIL = "audit_trail"         # Trilha de auditoria

class ActionType(Enum):
    """Tipos de ações auditáveis"""
    QUESTION_ASKED = "question_asked"
    RESPONSE_GENERATED = "response_generated"
    PERSONA_SWITCHED = "persona_switched"
    KNOWLEDGE_ACCESSED = "knowledge_accessed"
    FALLBACK_ACTIVATED = "fallback_activated"
    DATA_EXPORT = "data_export"
    SYSTEM_ERROR = "system_error"
    SECURITY_VIOLATION = "security_violation"

@dataclass
class MedicalInteraction:
    """Estrutura de dados para interação médica"""
    interaction_id: str
    timestamp: datetime
    user_session_id: str
    action_type: ActionType
    persona_id: Optional[str]
    question_hash: Optional[str]  # Hash da pergunta (não texto completo)
    response_classification: MedicalDataClassification
    data_subjects: List[str]  # Categorias de dados processados
    legal_basis: str  # Base legal LGPD
    retention_period: int  # Período de retenção em dias
    anonymized_metadata: Dict[str, Any]
    compliance_flags: List[str]
    ip_hash: Optional[str]  # Hash do IP (não IP completo)

class LGPDComplianceChecker:
    """Verificador de conformidade LGPD"""
    
    @staticmethod
    def validate_interaction(interaction: MedicalInteraction) -> List[str]:
        """Valida conformidade da interação com LGPD"""
        flags = []
        
        # Verificar base legal
        valid_legal_bases = [
            "consent",           # Consentimento
            "legitimate_interest", # Interesse legítimo
            "public_interest",   # Interesse público
            "vital_interests"    # Interesses vitais
        ]
        
        if interaction.legal_basis not in valid_legal_bases:
            flags.append("INVALID_LEGAL_BASIS")
        
        # Verificar período de retenção
        max_retention_days = {
            MedicalDataClassification.PUBLIC: 365,
            MedicalDataClassification.EDUCATIONAL: 730,
            MedicalDataClassification.SENSITIVE_MEDICAL: 1095,  # 3 anos
            MedicalDataClassification.PERSONAL_HEALTH: 1825,   # 5 anos
            MedicalDataClassification.PRESCRIPTION: 1825,     # 5 anos
            MedicalDataClassification.AUDIT_TRAIL: 1825       # 5 anos
        }
        
        max_allowed = max_retention_days.get(
            interaction.response_classification, 365
        )
        
        if interaction.retention_period > max_allowed:
            flags.append("EXCESSIVE_RETENTION_PERIOD")
        
        # Verificar anonimização
        if interaction.response_classification in [
            MedicalDataClassification.SENSITIVE_MEDICAL,
            MedicalDataClassification.PERSONAL_HEALTH
        ]:
            if not interaction.anonymized_metadata:
                flags.append("MISSING_ANONYMIZATION")
        
        return flags

class EncryptedLogStorage:
    """Armazenamento criptografado de logs de auditoria"""
    
    def __init__(self, encryption_key: Optional[bytes] = None):
        if encryption_key is None:
            # Gerar chave a partir de senha mestre (deve vir de variável de ambiente)
            password = os.getenv('MEDICAL_AUDIT_PASSWORD', 'default_audit_key').encode()
            salt = os.getenv('MEDICAL_AUDIT_SALT', 'default_salt').encode()
            
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=salt,
                iterations=100000,
            )
            key = base64.urlsafe_b64encode(kdf.derive(password))
            self.cipher = Fernet(key)
        else:
            self.cipher = Fernet(encryption_key)
    
    def append(self, audit_record: 'AuditRecord') -> None:
        """Adiciona registro de auditoria criptografado"""
        try:
            # Serializar registro
            record_data = asdict(audit_record)
            record_json = json.dumps(record_data, default=str, ensure_ascii=False)
            
            # Criptografar
            encrypted_data = self.cipher.encrypt(record_json.encode('utf-8'))
            
            # Salvar em arquivo com timestamp
            timestamp = datetime.now(timezone.utc).strftime('%Y%m%d')
            filename = f'logs/medical_audit_encrypted_{timestamp}.log'
            
            os.makedirs('logs', exist_ok=True)
            
            with open(filename, 'ab') as f:
                # Adicionar separador de linha e timestamp
                entry = f"{datetime.now(timezone.utc).isoformat()}|{base64.b64encode(encrypted_data).decode()}\n"
                f.write(entry.encode('utf-8'))
                
            audit_logger.info(f"Audit record appended: {audit_record.audit_id}")
            
        except Exception as e:
            audit_logger.error(f"Failed to append audit record: {e}")
            raise
    
    def read_records(self, date: str) -> List['AuditRecord']:
        """Lê registros de auditoria de uma data específica"""
        filename = f'logs/medical_audit_encrypted_{date}.log'
        records = []
        
        try:
            with open(filename, 'r', encoding='utf-8') as f:
                for line in f:
                    if '|' in line:
                        timestamp_str, encrypted_b64 = line.strip().split('|', 1)
                        encrypted_data = base64.b64decode(encrypted_b64)
                        
                        # Descriptografar
                        decrypted_data = self.cipher.decrypt(encrypted_data)
                        record_data = json.loads(decrypted_data.decode('utf-8'))
                        
                        # Reconstruir AuditRecord
                        record = AuditRecord(**record_data)
                        records.append(record)
                        
        except FileNotFoundError:
            audit_logger.warning(f"Audit file not found: {filename}")
        except Exception as e:
            audit_logger.error(f"Failed to read audit records: {e}")
            
        return records

@dataclass
class AuditRecord:
    """Registro de auditoria criptografado"""
    audit_id: str
    timestamp: datetime
    interaction: MedicalInteraction
    compliance_flags: List[str]
    system_metadata: Dict[str, Any]
    checksum: str

class MedicalAuditLogger:
    """Logger principal para auditoria médica"""
    
    def __init__(self):
        self.encrypted_storage = EncryptedLogStorage()
        self.compliance_checker = LGPDComplianceChecker()
        
        # Configurar diretório de logs
        os.makedirs('logs', exist_ok=True)
    
    def log_medical_interaction(
        self,
        user_session_id: str,
        action_type: ActionType,
        persona_id: Optional[str] = None,
        question_text: Optional[str] = None,
        response_classification: MedicalDataClassification = MedicalDataClassification.EDUCATIONAL,
        data_subjects: Optional[List[str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None
    ) -> str:
        """
        Registra interação médica com conformidade LGPD/ANVISA
        
        Returns:
            str: ID do registro de auditoria
        """
        
        # Gerar IDs únicos
        interaction_id = str(uuid.uuid4())
        audit_id = str(uuid.uuid4())
        
        # Hash da pergunta (não armazenar texto completo)
        question_hash = None
        if question_text:
            question_hash = hashlib.sha256(
                question_text.encode('utf-8')
            ).hexdigest()[:16]  # Primeiros 16 caracteres
        
        # Hash do IP (não armazenar IP completo)
        ip_hash = None
        if ip_address:
            ip_hash = hashlib.sha256(
                ip_address.encode('utf-8')
            ).hexdigest()[:12]  # Primeiros 12 caracteres
        
        # Anonimizar metadados
        anonymized_metadata = {}
        if metadata:
            # Remover dados pessoais sensíveis
            safe_keys = [
                'sentiment_category', 'confidence_score', 'response_time',
                'knowledge_sources', 'fallback_reason', 'error_type'
            ]
            anonymized_metadata = {
                k: v for k, v in metadata.items() if k in safe_keys
            }
        
        # Determinar base legal LGPD
        legal_basis = self._determine_legal_basis(action_type, response_classification)
        
        # Determinar período de retenção
        retention_period = self._determine_retention_period(response_classification)
        
        # Criar interação
        interaction = MedicalInteraction(
            interaction_id=interaction_id,
            timestamp=datetime.now(timezone.utc),
            user_session_id=user_session_id,
            action_type=action_type,
            persona_id=persona_id,
            question_hash=question_hash,
            response_classification=response_classification,
            data_subjects=data_subjects or [],
            legal_basis=legal_basis,
            retention_period=retention_period,
            anonymized_metadata=anonymized_metadata,
            compliance_flags=[],
            ip_hash=ip_hash
        )
        
        # Verificar conformidade
        compliance_flags = self.compliance_checker.validate_interaction(interaction)
        interaction.compliance_flags = compliance_flags
        
        # Metadados do sistema
        system_metadata = {
            'python_version': os.sys.version,
            'environment': os.getenv('FLASK_ENV', 'production'),
            'server_time': datetime.now(timezone.utc).isoformat(),
            'audit_version': '1.0.0'
        }
        
        # Calcular checksum para integridade
        record_data = {
            'interaction': asdict(interaction),
            'system_metadata': system_metadata
        }
        checksum = hashlib.sha256(
            json.dumps(record_data, sort_keys=True, default=str).encode()
        ).hexdigest()
        
        # Criar registro de auditoria
        audit_record = AuditRecord(
            audit_id=audit_id,
            timestamp=datetime.now(timezone.utc),
            interaction=interaction,
            compliance_flags=compliance_flags,
            system_metadata=system_metadata,
            checksum=checksum
        )
        
        # Armazenar de forma criptografada
        self.encrypted_storage.append(audit_record)
        
        # Log adicional para monitoramento
        audit_logger.info(
            f"Medical interaction logged: {action_type.value} | "
            f"Classification: {response_classification.value} | "
            f"Compliance: {len(compliance_flags)} flags | "
            f"Audit ID: {audit_id}"
        )
        
        # Alertar sobre violações de conformidade
        if compliance_flags:
            audit_logger.warning(
                f"Compliance issues detected: {compliance_flags} | "
                f"Audit ID: {audit_id}"
            )
        
        return audit_id
    
    def _determine_legal_basis(
        self, 
        action_type: ActionType, 
        classification: MedicalDataClassification
    ) -> str:
        """Determina base legal LGPD para o processamento"""
        
        if classification in [
            MedicalDataClassification.PUBLIC,
            MedicalDataClassification.EDUCATIONAL
        ]:
            return "legitimate_interest"
        elif action_type in [
            ActionType.QUESTION_ASKED,
            ActionType.RESPONSE_GENERATED
        ]:
            return "consent"  # Usuário consentiu ao usar o sistema
        else:
            return "public_interest"  # Interesse público em saúde
    
    def _determine_retention_period(
        self, 
        classification: MedicalDataClassification
    ) -> int:
        """Determina período de retenção em dias"""
        
        retention_periods = {
            MedicalDataClassification.PUBLIC: 365,           # 1 ano
            MedicalDataClassification.EDUCATIONAL: 730,      # 2 anos
            MedicalDataClassification.SENSITIVE_MEDICAL: 1095, # 3 anos
            MedicalDataClassification.PERSONAL_HEALTH: 1825,  # 5 anos
            MedicalDataClassification.PRESCRIPTION: 1825,    # 5 anos
            MedicalDataClassification.AUDIT_TRAIL: 1825      # 5 anos
        }
        
        return retention_periods.get(classification, 365)
    
    def get_audit_statistics(self, days: int = 30) -> Dict[str, Any]:
        """Obtém estatísticas de auditoria dos últimos N dias"""
        
        stats = {
            'total_interactions': 0,
            'compliance_violations': 0,
            'action_types': {},
            'data_classifications': {},
            'legal_bases': {},
            'period_days': days
        }
        
        # Implementar leitura de registros dos últimos N dias
        # (simplificado para exemplo)
        
        return stats

# Instância global do logger de auditoria
medical_audit_logger = MedicalAuditLogger()

# Função de conveniência para uso rápido
def log_medical_interaction(
    user_session_id: str,
    action: str,
    **kwargs
) -> str:
    """Função de conveniência para logging rápido"""
    
    action_type = ActionType(action) if action in [e.value for e in ActionType] else ActionType.QUESTION_ASKED
    
    return medical_audit_logger.log_medical_interaction(
        user_session_id=user_session_id,
        action_type=action_type,
        **kwargs
    )