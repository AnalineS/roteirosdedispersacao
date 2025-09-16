"""
Sistema de Notificações para Alertas LGPD
Envia alertas por Email e Telegram para violações e eventos críticos
"""

import os
import smtplib
import requests
import json
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional, Literal
from dataclasses import dataclass
import asyncio
import aiohttp
from jinja2 import Template
import logging

# Configurar logging interno
logger = logging.getLogger(__name__)

AlertType = Literal['lgpd_violation', 'data_breach', 'retention_expired', 'system_error', 'security_alert']
AlertSeverity = Literal['low', 'medium', 'high', 'critical']

@dataclass
class AlertData:
    """Dados de um alerta"""
    alert_id: str
    alert_type: AlertType
    severity: AlertSeverity
    title: str
    message: str
    details: Dict[str, Any]
    timestamp: datetime
    user_id: Optional[str] = None
    requires_immediate_action: bool = False

class NotificationChannel:
    """Classe base para canais de notificação"""

    def __init__(self, name: str):
        self.name = name
        self.enabled = True
        self.rate_limit = 5  # max 5 alertas por hora
        self.last_alerts = []

    def is_rate_limited(self) -> bool:
        """Verifica se está no limite de rate"""
        now = datetime.utcnow()
        hour_ago = now - timedelta(hours=1)

        # Remove alertas antigos
        self.last_alerts = [alert_time for alert_time in self.last_alerts if alert_time > hour_ago]

        return len(self.last_alerts) >= self.rate_limit

    def record_alert(self):
        """Registra um alerta enviado"""
        self.last_alerts.append(datetime.utcnow())

    async def send(self, alert: AlertData) -> bool:
        """Método abstrato para envio"""
        raise NotImplementedError

class EmailNotificationChannel(NotificationChannel):
    """Canal de notificação por email"""

    def __init__(self):
        super().__init__("email")
        self.smtp_host = os.getenv('ALERT_EMAIL_SMTP_HOST', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('ALERT_EMAIL_SMTP_PORT', '587'))
        self.smtp_user = os.getenv('ALERT_EMAIL_SMTP_USER')
        self.smtp_pass = os.getenv('ALERT_EMAIL_SMTP_PASS')
        self.to_email = os.getenv('ALERT_EMAIL_TO')

        # Verificar configuração
        if not all([self.smtp_user, self.smtp_pass, self.to_email]):
            logger.warning("Email não configurado completamente. Alertas por email desabilitados.")
            self.enabled = False

    def _get_email_template(self, alert: AlertData) -> str:
        """Gera template HTML do email"""

        # Cores por severidade
        color_map = {
            'low': '#4CAF50',
            'medium': '#FF9800',
            'high': '#FF5722',
            'critical': '#F44336'
        }

        # Ícones por tipo
        icon_map = {
            'lgpd_violation': '⚖️',
            'data_breach': '🚨',
            'retention_expired': '⏰',
            'system_error': '🔧',
            'security_alert': '🛡️'
        }

        template = Template("""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header {
            background: linear-gradient(135deg, {{ color }} 0%, {{ color }}dd 100%);
            color: white;
            padding: 20px;
            border-radius: 8px 8px 0 0;
            text-align: center;
        }
        .content {
            background: #f9f9f9;
            padding: 30px;
            border-radius: 0 0 8px 8px;
            border: 1px solid #ddd;
        }
        .severity {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            color: white;
            background: {{ color }};
            font-weight: bold;
            font-size: 12px;
            text-transform: uppercase;
        }
        .details {
            background: white;
            padding: 15px;
            border-radius: 4px;
            margin: 15px 0;
            border-left: 4px solid {{ color }};
        }
        .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 12px;
            color: #666;
        }
        .timestamp { color: #888; font-size: 14px; }
        .action-required {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 10px;
            border-radius: 4px;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{ icon }} Alerta LGPD - Sistema Roteiro de Dispensação</h1>
            <span class="severity">{{ severity }}</span>
        </div>

        <div class="content">
            <h2>{{ title }}</h2>
            <p>{{ message }}</p>

            {% if requires_immediate_action %}
            <div class="action-required">
                <strong>⚠️ AÇÃO IMEDIATA NECESSÁRIA</strong><br>
                Este alerta requer atenção urgente para manter a conformidade LGPD.
            </div>
            {% endif %}

            <div class="details">
                <h3>Detalhes Técnicos:</h3>
                <ul>
                    <li><strong>ID do Alerta:</strong> {{ alert_id }}</li>
                    <li><strong>Tipo:</strong> {{ alert_type }}</li>
                    <li><strong>Timestamp:</strong> {{ timestamp }}</li>
                    {% if user_id %}
                    <li><strong>Usuário:</strong> {{ user_id }}</li>
                    {% endif %}
                </ul>

                {% if details %}
                <h4>Informações Adicionais:</h4>
                <pre style="background: #f4f4f4; padding: 10px; border-radius: 4px; overflow-x: auto;">{{ details_json }}</pre>
                {% endif %}
            </div>

            <div class="timestamp">
                <strong>Enviado em:</strong> {{ current_time }}
            </div>
        </div>

        <div class="footer">
            <p>Este é um alerta automático do Sistema de Roteiros de Dispensação PQT-U</p>
            <p>Para mais informações, acesse o dashboard de compliance ou entre em contato com a equipe técnica.</p>
        </div>
    </div>
</body>
</html>
        """)

        return template.render(
            icon=icon_map.get(alert.alert_type, '🔔'),
            color=color_map.get(alert.severity, '#666'),
            severity=alert.severity.upper(),
            title=alert.title,
            message=alert.message,
            requires_immediate_action=alert.requires_immediate_action,
            alert_id=alert.alert_id,
            alert_type=alert.alert_type,
            timestamp=alert.timestamp.strftime('%Y-%m-%d %H:%M:%S UTC'),
            user_id=alert.user_id,
            details_json=json.dumps(alert.details, indent=2, ensure_ascii=False),
            current_time=datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')
        )

    async def send(self, alert: AlertData) -> bool:
        """Envia alerta por email"""
        if not self.enabled:
            return False

        if self.is_rate_limited():
            logger.warning(f"Rate limit atingido para email. Alerta {alert.alert_id} não enviado.")
            return False

        try:
            # Criar mensagem
            msg = MIMEMultipart('alternative')
            msg['Subject'] = f"[LGPD Alert - {alert.severity.upper()}] {alert.title}"
            msg['From'] = self.smtp_user
            msg['To'] = self.to_email

            # Anexar HTML
            html_content = self._get_email_template(alert)
            html_part = MIMEText(html_content, 'html', 'utf-8')
            msg.attach(html_part)

            # Enviar
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_pass)
                server.send_message(msg)

            self.record_alert()
            logger.info(f"Email enviado com sucesso para {self.to_email}")
            return True

        except Exception as e:
            logger.error(f"Erro ao enviar email: {e}")
            return False

class TelegramNotificationChannel(NotificationChannel):
    """Canal de notificação por Telegram"""

    def __init__(self):
        super().__init__("telegram")
        self.bot_token = os.getenv('TELEGRAM_BOT_TOKEN')
        self.chat_id = os.getenv('TELEGRAM_CHAT_ID')
        self.api_url = f"https://api.telegram.org/bot{self.bot_token}"

        # Verificar configuração
        if not all([self.bot_token, self.chat_id]):
            logger.warning("Telegram não configurado completamente. Alertas por Telegram desabilitados.")
            self.enabled = False

    def _get_telegram_message(self, alert: AlertData) -> str:
        """Formata mensagem para Telegram"""

        # Emojis por severidade
        severity_emoji = {
            'low': '🟢',
            'medium': '🟡',
            'high': '🟠',
            'critical': '🔴'
        }

        # Emojis por tipo
        type_emoji = {
            'lgpd_violation': '⚖️',
            'data_breach': '🚨',
            'retention_expired': '⏰',
            'system_error': '🔧',
            'security_alert': '🛡️'
        }

        emoji = type_emoji.get(alert.alert_type, '🔔')
        severity_icon = severity_emoji.get(alert.severity, '⚪')

        message = f"""
{emoji} *ALERTA LGPD - Sistema Roteiro de Dispensação*

{severity_icon} *Severidade:* {alert.severity.upper()}
📋 *Tipo:* {alert.alert_type}
🕐 *Timestamp:* {alert.timestamp.strftime('%Y-%m-%d %H:%M:%S UTC')}

*{alert.title}*

{alert.message}
"""

        if alert.requires_immediate_action:
            message += "\n⚠️ *AÇÃO IMEDIATA NECESSÁRIA*"

        if alert.user_id:
            message += f"\n👤 *Usuário:* {alert.user_id[:8]}***"

        if alert.details:
            message += f"\n📊 *Detalhes:* {len(alert.details)} campos"

        message += f"\n🆔 *ID:* `{alert.alert_id}`"

        return message

    async def send(self, alert: AlertData) -> bool:
        """Envia alerta por Telegram"""
        if not self.enabled:
            return False

        if self.is_rate_limited():
            logger.warning(f"Rate limit atingido para Telegram. Alerta {alert.alert_id} não enviado.")
            return False

        try:
            message = self._get_telegram_message(alert)

            payload = {
                'chat_id': self.chat_id,
                'text': message,
                'parse_mode': 'Markdown',
                'disable_web_page_preview': True
            }

            async with aiohttp.ClientSession() as session:
                async with session.post(f"{self.api_url}/sendMessage", json=payload) as response:
                    if response.status == 200:
                        self.record_alert()
                        logger.info(f"Telegram enviado com sucesso para chat {self.chat_id}")
                        return True
                    else:
                        logger.error(f"Erro Telegram: {response.status} - {await response.text()}")
                        return False

        except Exception as e:
            logger.error(f"Erro ao enviar Telegram: {e}")
            return False

class AlertManager:
    """Gerenciador central de alertas"""

    def __init__(self):
        self.channels = [
            EmailNotificationChannel(),
            TelegramNotificationChannel()
        ]
        self.alert_history = []

    async def send_alert(
        self,
        alert_type: AlertType,
        severity: AlertSeverity,
        title: str,
        message: str,
        details: Dict[str, Any] = None,
        user_id: str = None,
        requires_immediate_action: bool = False
    ) -> Dict[str, bool]:
        """Envia alerta através de todos os canais"""

        # Criar dados do alerta
        alert = AlertData(
            alert_id=f"alert_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{hash(message) % 10000:04d}",
            alert_type=alert_type,
            severity=severity,
            title=title,
            message=message,
            details=details or {},
            timestamp=datetime.utcnow(),
            user_id=user_id,
            requires_immediate_action=requires_immediate_action
        )

        # Armazenar no histórico
        self.alert_history.append(alert)

        # Manter apenas últimos 100 alertas
        if len(self.alert_history) > 100:
            self.alert_history = self.alert_history[-100:]

        # Enviar através de todos os canais
        results = {}

        for channel in self.channels:
            if channel.enabled:
                try:
                    success = await channel.send(alert)
                    results[channel.name] = success
                    logger.info(f"Canal {channel.name}: {'✅' if success else '❌'}")
                except Exception as e:
                    logger.error(f"Erro no canal {channel.name}: {e}")
                    results[channel.name] = False
            else:
                results[channel.name] = False

        return results

    # Métodos específicos para tipos de alerta
    async def lgpd_violation(self, violation_type: str, details: Dict[str, Any], user_id: str = None):
        """Alerta para violação LGPD"""
        return await self.send_alert(
            alert_type='lgpd_violation',
            severity='critical',
            title=f'Violação LGPD Detectada: {violation_type}',
            message=f'Uma violação de LGPD foi detectada no sistema: {violation_type}. Ação imediata necessária.',
            details=details,
            user_id=user_id,
            requires_immediate_action=True
        )

    async def data_retention_expired(self, data_category: str, count: int):
        """Alerta para dados expirados"""
        return await self.send_alert(
            alert_type='retention_expired',
            severity='medium',
            title='Dados Expirados Detectados',
            message=f'{count} registros de {data_category} ultrapassaram o período de retenção e devem ser removidos.',
            details={
                'data_category': data_category,
                'expired_count': count,
                'action_required': 'Executar limpeza automática'
            }
        )

    async def security_breach(self, breach_type: str, affected_users: int, details: Dict[str, Any]):
        """Alerta para violação de segurança"""
        return await self.send_alert(
            alert_type='data_breach',
            severity='critical',
            title=f'Violação de Segurança: {breach_type}',
            message=f'Violação de segurança detectada afetando {affected_users} usuários. Investigação imediata necessária.',
            details={
                'breach_type': breach_type,
                'affected_users': affected_users,
                **details
            },
            requires_immediate_action=True
        )

    def get_alert_stats(self) -> Dict[str, Any]:
        """Retorna estatísticas dos alertas"""
        if not self.alert_history:
            return {
                'total_alerts': 0,
                'last_24h': 0,
                'by_severity': {},
                'by_type': {}
            }

        now = datetime.utcnow()
        last_24h = now - timedelta(hours=24)

        recent_alerts = [a for a in self.alert_history if a.timestamp > last_24h]

        severity_counts = {}
        type_counts = {}

        for alert in self.alert_history:
            severity_counts[alert.severity] = severity_counts.get(alert.severity, 0) + 1
            type_counts[alert.alert_type] = type_counts.get(alert.alert_type, 0) + 1

        return {
            'total_alerts': len(self.alert_history),
            'last_24h': len(recent_alerts),
            'by_severity': severity_counts,
            'by_type': type_counts,
            'last_alert': self.alert_history[-1].timestamp.isoformat() if self.alert_history else None
        }

# Instância singleton
alert_manager = AlertManager()

# Export para uso em outros módulos
__all__ = ['alert_manager', 'AlertManager', 'AlertData', 'AlertType', 'AlertSeverity']