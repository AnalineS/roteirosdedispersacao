# -*- coding: utf-8 -*-
"""
Input Validator - Sistema de validação de entrada
Validação robusta de dados de entrada para segurança
"""

import re
import html
import bleach
from typing import Dict, List, Any, Optional, Union
import logging

logger = logging.getLogger(__name__)

class InputValidator:
    """Validador de entrada para segurança de dados"""

    def __init__(self):
        # Tags HTML permitidas (mínimas para segurança)
        self.allowed_tags = ['b', 'i', 'em', 'strong', 'p', 'br']
        self.allowed_attributes = {}

        # Padrões de validação
        self.email_pattern = re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$')
        self.password_pattern = re.compile(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$')

    def sanitize_html(self, text: str) -> str:
        """Sanitiza HTML removendo tags maliciosas"""
        if not isinstance(text, str):
            return str(text)

        # Usar bleach para sanitização
        cleaned = bleach.clean(
            text,
            tags=self.allowed_tags,
            attributes=self.allowed_attributes,
            strip=True
        )

        return cleaned

    def validate_email(self, email: str) -> bool:
        """Valida formato de email"""
        if not isinstance(email, str):
            return False
        return bool(self.email_pattern.match(email.strip().lower()))

    def validate_password(self, password: str) -> bool:
        """Valida força da senha"""
        if not isinstance(password, str):
            return False
        return bool(self.password_pattern.match(password))

    def sanitize_string(self, text: str, max_length: int = 1000) -> str:
        """Sanitiza string geral"""
        if not isinstance(text, str):
            text = str(text)

        # Limitar tamanho
        text = text[:max_length]

        # HTML escape
        text = html.escape(text)

        # Remover caracteres de controle
        text = ''.join(char for char in text if ord(char) >= 32 or char in '\n\r\t')

        return text.strip()

    def validate_required_fields(self, data: Dict[str, Any], required_fields: List[str]) -> List[str]:
        """Valida campos obrigatórios"""
        missing_fields = []

        for field in required_fields:
            if field not in data or not data[field]:
                missing_fields.append(field)

        return missing_fields

    def sanitize_json_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Sanitiza dados JSON recursivamente"""
        if isinstance(data, dict):
            return {
                key: self.sanitize_json_data(value)
                for key, value in data.items()
                if isinstance(key, str) and len(key) < 100  # Limitar tamanho das chaves
            }
        elif isinstance(data, list):
            return [self.sanitize_json_data(item) for item in data[:100]]  # Limitar tamanho das listas
        elif isinstance(data, str):
            return self.sanitize_string(data)
        else:
            return data

    def validate_user_input(self, data: Dict[str, Any]) -> Dict[str, Union[bool, List[str]]]:
        """Validação completa de entrada do usuário"""
        result = {
            'valid': True,
            'errors': []
        }

        # Verificar se é um dicionário
        if not isinstance(data, dict):
            result['valid'] = False
            result['errors'].append('Invalid data format')
            return result

        # Sanitizar dados
        try:
            sanitized_data = self.sanitize_json_data(data)

            # Validações específicas
            if 'email' in data:
                if not self.validate_email(data['email']):
                    result['valid'] = False
                    result['errors'].append('Invalid email format')

            if 'password' in data:
                if not self.validate_password(data['password']):
                    result['valid'] = False
                    result['errors'].append('Password must be at least 8 characters with uppercase, lowercase and numbers')

            result['sanitized_data'] = sanitized_data

        except Exception as e:
            logger.error(f"Validation error: {e}")
            result['valid'] = False
            result['errors'].append('Validation processing error')

        return result

# Instância global
_input_validator = None

def get_input_validator() -> InputValidator:
    """Obtém instância global do validador"""
    global _input_validator
    if _input_validator is None:
        _input_validator = InputValidator()
    return _input_validator