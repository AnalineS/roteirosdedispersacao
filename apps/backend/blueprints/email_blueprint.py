# -*- coding: utf-8 -*-
"""
Email Blueprint - Sistema de Email Médico
Endpoints para notificações educativas e comunicação profissional
"""

import logging
from flask import Blueprint, request, jsonify
from typing import Dict, Any, List

# Import do serviço de email
try:
    from services.email.email_service import EmailService, EmailAddress, EmailMessage
    EMAIL_SERVICE_AVAILABLE = True
except ImportError:
    EMAIL_SERVICE_AVAILABLE = False

# Import da configuração
from app_config import config

# Import das funcionalidades de segurança
from core.security.enhanced_security import require_rate_limit

logger = logging.getLogger(__name__)

# Criar blueprint
email_bp = Blueprint('email', __name__, url_prefix='/api/v1/email')

# Verificar se o serviço está habilitado
if not config.EMAIL_ENABLED or not EMAIL_SERVICE_AVAILABLE:
    logger.warning("[WARNING] Serviço de email desabilitado ou não disponível")

# Instância global do serviço de email
email_service = None
if EMAIL_SERVICE_AVAILABLE and config.EMAIL_ENABLED:
    try:
        email_service = EmailService()
        logger.info("[OK] EmailService inicializado com sucesso")
    except Exception as e:
        logger.error(f"[ERROR] Falha ao inicializar EmailService: {e}")
        email_service = None

@email_bp.route('/health', methods=['GET'])
def email_health():
    """Health check do sistema de email"""
    return jsonify({
        "status": "healthy" if email_service else "disabled",
        "email_enabled": config.EMAIL_ENABLED,
        "service_available": EMAIL_SERVICE_AVAILABLE,
        "service_ready": email_service is not None,
        "from_email": config.EMAIL_FROM if config.EMAIL_ENABLED else None,
        "provider": "gmail_smtp"
    })

@email_bp.route('/send/educational', methods=['POST'])
@require_rate_limit('email')
def send_educational_notification():
    """Envia notificação educativa sobre hanseníase"""
    if not email_service:
        return jsonify({
            "error": "Serviço de email não disponível",
            "error_code": "EMAIL_SERVICE_DISABLED"
        }), 503

    try:
        data = request.get_json()

        # Validar dados obrigatórios
        required_fields = ['recipient_email', 'subject', 'content_type']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return jsonify({
                "error": f"Campos obrigatórios ausentes: {', '.join(missing_fields)}",
                "error_code": "MISSING_REQUIRED_FIELDS"
            }), 400

        # Preparar endereços
        recipient = EmailAddress(
            email=data['recipient_email'],
            name=data.get('recipient_name', 'Usuário')
        )

        # Preparar conteúdo baseado no tipo
        content_type = data['content_type']
        subject = data['subject']

        if content_type == 'welcome':
            html_content = _generate_welcome_email_content(data)
            text_content = _generate_welcome_text_content(data)
        elif content_type == 'progress_update':
            html_content = _generate_progress_email_content(data)
            text_content = _generate_progress_text_content(data)
        elif content_type == 'custom':
            html_content = data.get('html_content', '')
            text_content = data.get('text_content', '')
        else:
            return jsonify({
                "error": f"Tipo de conteúdo não suportado: {content_type}",
                "error_code": "UNSUPPORTED_CONTENT_TYPE"
            }), 400

        # Criar mensagem
        message = EmailMessage(
            to=[recipient],
            subject=subject,
            html_content=html_content,
            text_content=text_content
        )

        # Enviar email
        result = email_service.send_email(message)

        logger.info(f"[EMAIL] Notificação educativa enviada para {recipient.email}")

        return jsonify({
            "success": True,
            "message": "Email enviado com sucesso",
            "result": result
        })

    except Exception as e:
        logger.error(f"[ERROR] Falha ao enviar email educativo: {e}")
        return jsonify({
            "error": "Erro interno ao enviar email",
            "error_code": "EMAIL_SEND_ERROR"
        }), 500

@email_bp.route('/send/medical_alert', methods=['POST'])
@require_rate_limit('medical_data')
def send_medical_alert():
    """Envia alerta médico importante"""
    if not email_service:
        return jsonify({
            "error": "Serviço de email não disponível",
            "error_code": "EMAIL_SERVICE_DISABLED"
        }), 503

    try:
        data = request.get_json()

        # Validação específica para alertas médicos
        required_fields = ['recipient_email', 'alert_type', 'message']
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return jsonify({
                "error": f"Campos obrigatórios ausentes: {', '.join(missing_fields)}",
                "error_code": "MISSING_REQUIRED_FIELDS"
            }), 400

        alert_type = data['alert_type']

        # Validar tipos de alerta permitidos
        allowed_alert_types = ['dosage_reminder', 'side_effects', 'medication_interaction', 'general_alert']
        if alert_type not in allowed_alert_types:
            return jsonify({
                "error": f"Tipo de alerta não permitido: {alert_type}",
                "error_code": "INVALID_ALERT_TYPE"
            }), 400

        # Preparar endereços
        recipient = EmailAddress(
            email=data['recipient_email'],
            name=data.get('recipient_name', 'Usuário')
        )

        # Preparar conteúdo do alerta médico
        subject = f"[IMPORTANTE] Alerta Médico - {alert_type.replace('_', ' ').title()}"
        html_content = _generate_medical_alert_content(alert_type, data)
        text_content = _generate_medical_alert_text(alert_type, data)

        # Criar mensagem com prioridade alta
        message = EmailMessage(
            to=[recipient],
            subject=subject,
            html_content=html_content,
            text_content=text_content,
            headers={
                'X-Priority': '1',
                'X-MSMail-Priority': 'High',
                'Importance': 'high'
            }
        )

        # Enviar email
        result = email_service.send_email(message)

        logger.info(f"[EMAIL] Alerta médico {alert_type} enviado para {recipient.email}")

        return jsonify({
            "success": True,
            "message": "Alerta médico enviado com sucesso",
            "alert_type": alert_type,
            "result": result
        })

    except Exception as e:
        logger.error(f"[ERROR] Falha ao enviar alerta médico: {e}")
        return jsonify({
            "error": "Erro interno ao enviar alerta médico",
            "error_code": "MEDICAL_ALERT_ERROR"
        }), 500

@email_bp.route('/templates/medical', methods=['GET'])
def get_medical_templates():
    """Lista templates médicos disponíveis"""
    templates = {
        "educational": [
            {"id": "welcome", "name": "Bem-vindo ao Sistema", "description": "Email de boas-vindas"},
            {"id": "progress_update", "name": "Atualização de Progresso", "description": "Progresso educativo"},
        ],
        "medical_alerts": [
            {"id": "dosage_reminder", "name": "Lembrete de Dosagem", "description": "Lembrete para tomar medicação"},
            {"id": "side_effects", "name": "Efeitos Colaterais", "description": "Informações sobre efeitos colaterais"},
            {"id": "medication_interaction", "name": "Interação Medicamentosa", "description": "Alerta de interação"},
            {"id": "general_alert", "name": "Alerta Geral", "description": "Alerta médico geral"},
        ]
    }

    return jsonify({
        "templates": templates,
        "total_templates": sum(len(category) for category in templates.values())
    })

# Funções auxiliares para geração de conteúdo
def _generate_welcome_email_content(data: Dict[str, Any]) -> str:
    """Gera conteúdo HTML para email de boas-vindas"""
    user_name = data.get('recipient_name', 'Usuário')
    return f"""
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #2c5aa0;">Bem-vindo ao Roteiro de Dispensação PQT-U</h2>
            <p>Olá, {user_name}!</p>
            <p>É um prazer tê-lo(a) em nossa plataforma educativa especializada em hanseníase.</p>
            <p>Aqui você encontrará:</p>
            <ul>
                <li>Informações atualizadas sobre PQT-U</li>
                <li>Assistentes especializados (Dr. Gasnelio e Gá)</li>
                <li>Recursos educativos interativos</li>
                <li>Calculadoras de dosagem</li>
            </ul>
            <p>Desenvolvido com base nas diretrizes do Ministério da Saúde - PCDT Hanseníase 2022.</p>
            <hr style="margin: 20px 0; border: 1px solid #ddd;">
            <p style="font-size: 12px; color: #666;">
                Este é um sistema educativo para profissionais de saúde. Sempre consulte um especialista para casos específicos.
            </p>
        </div>
    </body>
    </html>
    """

def _generate_welcome_text_content(data: Dict[str, Any]) -> str:
    """Gera conteúdo texto para email de boas-vindas"""
    user_name = data.get('recipient_name', 'Usuário')
    return f"""
Bem-vindo ao Roteiro de Dispensação PQT-U

Olá, {user_name}!

É um prazer tê-lo(a) em nossa plataforma educativa especializada em hanseníase.

Aqui você encontrará:
- Informações atualizadas sobre PQT-U
- Assistentes especializados (Dr. Gasnelio e Gá)
- Recursos educativos interativos
- Calculadoras de dosagem

Desenvolvido com base nas diretrizes do Ministério da Saúde - PCDT Hanseníase 2022.

Este é um sistema educativo para profissionais de saúde. Sempre consulte um especialista para casos específicos.
    """

def _generate_progress_email_content(data: Dict[str, Any]) -> str:
    """Gera conteúdo HTML para email de progresso"""
    user_name = data.get('recipient_name', 'Usuário')
    progress = data.get('progress_percentage', 0)
    module = data.get('module_name', 'Módulo Educativo')

    return f"""
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #28a745;">Parabéns pelo seu progresso!</h2>
            <p>Olá, {user_name}!</p>
            <p>Você atingiu <strong>{progress}%</strong> de conclusão no módulo: <strong>{module}</strong></p>
            <div style="background: #f8f9fa; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0;">
                <p style="margin: 0;">Continue seus estudos para se tornar um especialista em dispensação PQT-U!</p>
            </div>
            <p>Sistema educativo baseado em evidências científicas do PCDT Hanseníase 2022.</p>
        </div>
    </body>
    </html>
    """

def _generate_progress_text_content(data: Dict[str, Any]) -> str:
    """Gera conteúdo texto para email de progresso"""
    user_name = data.get('recipient_name', 'Usuário')
    progress = data.get('progress_percentage', 0)
    module = data.get('module_name', 'Módulo Educativo')

    return f"""
Parabéns pelo seu progresso!

Olá, {user_name}!

Você atingiu {progress}% de conclusão no módulo: {module}

Continue seus estudos para se tornar um especialista em dispensação PQT-U!

Sistema educativo baseado em evidências científicas do PCDT Hanseníase 2022.
    """

def _generate_medical_alert_content(alert_type: str, data: Dict[str, Any]) -> str:
    """Gera conteúdo HTML para alerta médico"""
    user_name = data.get('recipient_name', 'Usuário')
    message = data.get('message', '')

    alert_titles = {
        'dosage_reminder': 'Lembrete de Dosagem PQT-U',
        'side_effects': 'Informações sobre Efeitos Colaterais',
        'medication_interaction': 'Alerta de Interação Medicamentosa',
        'general_alert': 'Alerta Médico Importante'
    }

    title = alert_titles.get(alert_type, 'Alerta Médico')

    return f"""
    <html>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #dc3545; color: white; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                <h2 style="margin: 0; color: white;">⚠️ {title}</h2>
            </div>
            <p>Caro(a) {user_name},</p>
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0;">
                <p style="margin: 0;"><strong>Mensagem:</strong> {message}</p>
            </div>
            <p><strong>Importante:</strong> Este é um alerta automático do sistema. Para qualquer dúvida, consulte um profissional de saúde qualificado.</p>
            <hr style="margin: 20px 0; border: 1px solid #ddd;">
            <p style="font-size: 12px; color: #666;">
                Sistema baseado no PCDT Hanseníase 2022 - Ministério da Saúde
            </p>
        </div>
    </body>
    </html>
    """

def _generate_medical_alert_text(alert_type: str, data: Dict[str, Any]) -> str:
    """Gera conteúdo texto para alerta médico"""
    user_name = data.get('recipient_name', 'Usuário')
    message = data.get('message', '')

    alert_titles = {
        'dosage_reminder': 'Lembrete de Dosagem PQT-U',
        'side_effects': 'Informações sobre Efeitos Colaterais',
        'medication_interaction': 'Alerta de Interação Medicamentosa',
        'general_alert': 'Alerta Médico Importante'
    }

    title = alert_titles.get(alert_type, 'Alerta Médico')

    return f"""
⚠️ {title}

Caro(a) {user_name},

Mensagem: {message}

Importante: Este é um alerta automático do sistema. Para qualquer dúvida, consulte um profissional de saúde qualificado.

Sistema baseado no PCDT Hanseníase 2022 - Ministério da Saúde
    """

# Exportar blueprint
__all__ = ['email_bp']