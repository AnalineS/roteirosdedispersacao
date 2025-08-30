# -*- coding: utf-8 -*-
"""
Windows-Safe Logger Module

Resolve problemas de encoding de emojis no Windows console
"""

import sys
import logging
from typing import Dict, Any

# Mapeamento de emojis para texto no Windows
EMOJI_MAP = {
    '🔒': '[SECURITY]',
    '[ALERT]': '[ALERT]', 
    '[WARNING]': '[WARNING]',
    '[OK]': '[SUCCESS]',
    '[ERROR]': '[ERROR]',
    '🤖': '[AI]',
    '[REPORT]': '[METRICS]',
    '[LIST]': '[INFO]',
    '[GREEN]': '[OK]',
    '[SEARCH]': '[SEARCH]',
    '💥': '[FAIL]',
    '🎉': '[CELEBRATION]',
    'ℹ️': '[INFO]',
    '⚙️': '[CONFIG]',
    '[START]': '[START]',
    '📄': '[DOCS]',
    '🔄': '[RETRY]',
    '🛑': '[STOP]',
    '🌐': '[WEB]',
    '[SAVE]': '[DATA]',
    '[FIX]': '[TOOL]',
    '📈': '[GROWTH]',
    '[TARGET]': '[TARGET]',
    '💡': '[IDEA]',
    '[AUTH]': '[SECURE]',
    '⏰': '[TIME]',
    '[STAR]': '[STAR]',
    '🎨': '[DESIGN]',
    '🏗️': '[BUILD]',
    '[TEST]': '[TEST]',
    '🔗': '[LINK]',
    '📦': '[PACKAGE]',
    '🎪': '[EVENT]',
    '🎭': '[THEATER]',
    '🎬': '[ACTION]',
    '🌈': '[RAINBOW]',
    '[STAR]': '[STAR]',
    '🏆': '[TROPHY]',
    '🔥': '[FIRE]',
    '❤️': '[HEART]',
    '💚': '[GREEN_HEART]',
    '💙': '[BLUE_HEART]',
    '💜': '[PURPLE_HEART]',
    '🧡': '[ORANGE_HEART]',
    '💛': '[YELLOW_HEART]',
}

def sanitize_emoji_for_windows(message: str) -> str:
    """
    Remove ou substitui emojis por texto compatível com Windows console
    
    Args:
        message: Mensagem que pode conter emojis
        
    Returns:
        Mensagem com emojis substituídos por texto
    """
    if sys.platform != "win32":
        return message
    
    # Substituir emojis conhecidos por texto
    for emoji, text in EMOJI_MAP.items():
        message = message.replace(emoji, text)
    
    # Remover qualquer caractere unicode restante que possa causar problemas
    try:
        # Tentar encode/decode para detectar problemas
        message.encode('cp1252')
        return message
    except UnicodeEncodeError:
        # Se falhar, usar apenas ASCII + caracteres básicos
        safe_message = ""
        for char in message:
            try:
                char.encode('cp1252')
                safe_message += char
            except UnicodeEncodeError:
                safe_message += '?'
        return safe_message

class WindowsSafeLoggerAdapter(logging.LoggerAdapter):
    """
    Adapter que sanitiza mensagens para Windows
    """
    
    def process(self, msg, kwargs):
        """Processa mensagem removendo emojis se necessário"""
        safe_msg = sanitize_emoji_for_windows(str(msg))
        return safe_msg, kwargs

def get_windows_safe_logger(name: str) -> WindowsSafeLoggerAdapter:
    """
    Retorna um logger que é compatível com Windows console
    
    Args:
        name: Nome do logger
        
    Returns:
        Logger adapter compatível com Windows
    """
    base_logger = logging.getLogger(name)
    return WindowsSafeLoggerAdapter(base_logger, {})

# Funções de conveniência
def safe_log_info(logger, message: str, *args, **kwargs):
    """Log info compatível com Windows"""
    safe_message = sanitize_emoji_for_windows(message)
    logger.info(safe_message, *args, **kwargs)

def safe_log_warning(logger, message: str, *args, **kwargs):
    """Log warning compatível com Windows"""
    safe_message = sanitize_emoji_for_windows(message)
    logger.warning(safe_message, *args, **kwargs)

def safe_log_error(logger, message: str, *args, **kwargs):
    """Log error compatível com Windows"""
    safe_message = sanitize_emoji_for_windows(message)
    logger.error(safe_message, *args, **kwargs)

def safe_log_debug(logger, message: str, *args, **kwargs):
    """Log debug compatível com Windows"""
    safe_message = sanitize_emoji_for_windows(message)
    logger.debug(safe_message, *args, **kwargs)

# Monkey patch para corrigir logging existente
def patch_logger_methods():
    """
    Aplica patch nos métodos de logging para Windows compatibility
    """
    if sys.platform != "win32":
        return
    
    original_info = logging.Logger.info
    original_warning = logging.Logger.warning  
    original_error = logging.Logger.error
    original_debug = logging.Logger.debug
    
    def safe_info(self, message, *args, **kwargs):
        safe_message = sanitize_emoji_for_windows(str(message))
        original_info(self, safe_message, *args, **kwargs)
    
    def safe_warning(self, message, *args, **kwargs):
        safe_message = sanitize_emoji_for_windows(str(message))
        original_warning(self, safe_message, *args, **kwargs)
    
    def safe_error(self, message, *args, **kwargs):
        safe_message = sanitize_emoji_for_windows(str(message))
        original_error(self, safe_message, *args, **kwargs)
    
    def safe_debug(self, message, *args, **kwargs):
        safe_message = sanitize_emoji_for_windows(str(message))
        original_debug(self, safe_message, *args, **kwargs)
    
    # Aplicar patches
    logging.Logger.info = safe_info
    logging.Logger.warning = safe_warning
    logging.Logger.error = safe_error
    logging.Logger.debug = safe_debug

# Auto-patch se for Windows
if sys.platform == "win32":
    patch_logger_methods()