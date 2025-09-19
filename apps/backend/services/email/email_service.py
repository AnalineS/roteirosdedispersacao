"""
Serviço de Email para Sistema PQT-U - PR #175
Implementa notificações por email para conquistas, progresso e funcionalidades sociais
"""

import os
import json
import logging
from typing import Dict, List, Optional, Union, Any
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
import smtplib
import ssl
from jinja2 import Environment, FileSystemLoader, Template
import requests
from pathlib import Path

# Configurar logging
logger = logging.getLogger(__name__)

@dataclass
class EmailAddress:
    """Representa um endereço de email com nome opcional"""
    email: str
    name: Optional[str] = None
    
    def __str__(self):
        if self.name:
            return f"{self.name} <{self.email}>"
        return self.email

@dataclass
class EmailAttachment:
    """Representa um anexo de email"""
    filename: str
    content: bytes
    content_type: str = "application/octet-stream"

@dataclass
class EmailTemplate:
    """Template de email"""
    subject: str
    html_template: str
    text_template: Optional[str] = None
    variables: Dict[str, Any] = None

@dataclass
class EmailMessage:
    """Mensagem de email completa"""
    to: List[EmailAddress]
    subject: str
    html_content: Optional[str] = None
    text_content: Optional[str] = None
    from_address: Optional[EmailAddress] = None
    reply_to: Optional[EmailAddress] = None
    cc: Optional[List[EmailAddress]] = None
    bcc: Optional[List[EmailAddress]] = None
    attachments: Optional[List[EmailAttachment]] = None
    headers: Optional[Dict[str, str]] = None
    template_id: Optional[str] = None
    template_data: Optional[Dict[str, Any]] = None

class EmailServiceConfig:
    """Configuração do serviço de email"""
    
    def __init__(self):
        self.provider = os.getenv('EMAIL_PROVIDER', 'smtp')  # Priorizar SMTP/Gmail
        self.from_email = os.getenv('EMAIL_FROM', 'roteirosdedispensacaounb@gmail.com')
        self.from_name = os.getenv('EMAIL_FROM_NAME', 'Roteiro de Dispensação PQT-U')
        self.reply_to = os.getenv('EMAIL_REPLY_TO', 'roteirosdedispensacaounb@gmail.com')
        
        # SendGrid Config
        self.sendgrid_api_key = os.getenv('SENDGRID_API_KEY')
        
        # Gmail SMTP Config (OTIMIZADO)
        self.smtp_host = os.getenv('SMTP_HOST', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', '587'))
        self.smtp_username = os.getenv('SMTP_USERNAME', self.from_email)  # Usar from_email como fallback
        self.smtp_password = os.getenv('SMTP_PASSWORD')  # Gmail App Password
        self.smtp_use_tls = os.getenv('SMTP_USE_TLS', 'true').lower() == 'true'
        self.smtp_use_ssl = os.getenv('SMTP_USE_SSL', 'false').lower() == 'true'
        
        # Template Config
        self.template_dir = Path(__file__).parent / 'templates'
        self.template_dir.mkdir(exist_ok=True)
        
        # Rate limiting
        self.rate_limit_per_minute = int(os.getenv('EMAIL_RATE_LIMIT', '100'))
        self.rate_limit_per_hour = int(os.getenv('EMAIL_RATE_LIMIT_HOUR', '1000'))

class BaseEmailProvider:
    """Classe base para provedores de email"""
    
    def __init__(self, config: EmailServiceConfig):
        self.config = config
        
    async def send(self, message: EmailMessage) -> Dict[str, Any]:
        """Envia email - deve ser implementado por cada provider"""
        raise NotImplementedError
        
    def validate_config(self) -> bool:
        """Valida configuração do provider"""
        raise NotImplementedError

class SendGridProvider(BaseEmailProvider):
    """Provider para SendGrid"""
    
    def __init__(self, config: EmailServiceConfig):
        super().__init__(config)
        self.api_url = "https://api.sendgrid.com/v3/mail/send"
        
    def validate_config(self) -> bool:
        """Valida configuração do SendGrid"""
        return bool(self.config.sendgrid_api_key)
    
    async def send(self, message: EmailMessage) -> Dict[str, Any]:
        """Envia email via SendGrid API"""
        if not self.validate_config():
            raise ValueError("SendGrid API key não configurada")
            
        # Construir payload do SendGrid
        payload = {
            "from": {
                "email": message.from_address.email if message.from_address else self.config.from_email,
                "name": message.from_address.name if message.from_address else self.config.from_name
            },
            "personalizations": [{
                "to": [{"email": addr.email, "name": addr.name} for addr in message.to],
                "subject": message.subject
            }],
            "content": []
        }
        
        # Adicionar conteúdo
        if message.text_content:
            payload["content"].append({
                "type": "text/plain",
                "value": message.text_content
            })
            
        if message.html_content:
            payload["content"].append({
                "type": "text/html", 
                "value": message.html_content
            })
            
        # CC e BCC
        personalization = payload["personalizations"][0]
        if message.cc:
            personalization["cc"] = [{"email": addr.email, "name": addr.name} for addr in message.cc]
        if message.bcc:
            personalization["bcc"] = [{"email": addr.email, "name": addr.name} for addr in message.bcc]
            
        # Reply-to
        if message.reply_to:
            payload["reply_to"] = {
                "email": message.reply_to.email,
                "name": message.reply_to.name
            }
            
        # Headers customizados
        if message.headers:
            payload["headers"] = message.headers
            
        # Anexos - otimizado com list comprehension
        if message.attachments:
            import base64
            payload["attachments"] = [
                {
                    "content": base64.b64encode(attachment.content).decode(),
                    "filename": attachment.filename,
                    "type": attachment.content_type,
                    "disposition": "attachment"
                }
                for attachment in message.attachments
            ]
        
        # Fazer requisição
        headers = {
            "Authorization": f"Bearer {self.config.sendgrid_api_key}",
            "Content-Type": "application/json"
        }
        
        try:
            response = requests.post(self.api_url, headers=headers, json=payload, timeout=30)
            response.raise_for_status()
            
            return {
                "success": True,
                "provider": "sendgrid",
                "message_id": response.headers.get("X-Message-Id"),
                "status_code": response.status_code
            }
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Erro ao enviar email via SendGrid: {e}")
            return {
                "success": False,
                "provider": "sendgrid",
                "error": str(e),
                "status_code": getattr(e.response, 'status_code', None) if hasattr(e, 'response') else None
            }

class SMTPProvider(BaseEmailProvider):
    """Provider para SMTP padrão"""
    
    def validate_config(self) -> bool:
        """Valida configuração SMTP"""
        return bool(self.config.smtp_host and self.config.smtp_username and self.config.smtp_password)
    
    async def send(self, message: EmailMessage) -> Dict[str, Any]:
        """Envia email via SMTP"""
        if not self.validate_config():
            raise ValueError("Configuração SMTP incompleta")
            
        try:
            # Criar mensagem MIME
            msg = MIMEMultipart('alternative')
            msg['Subject'] = message.subject
            msg['From'] = str(message.from_address or EmailAddress(self.config.from_email, self.config.from_name))
            msg['To'] = ', '.join(str(addr) for addr in message.to)
            
            if message.cc:
                msg['Cc'] = ', '.join(str(addr) for addr in message.cc)
            if message.reply_to:
                msg['Reply-To'] = str(message.reply_to)
                
            # Adicionar headers customizados - otimizado
            if message.headers:
                msg.update(message.headers)
            
            # Adicionar conteúdo
            if message.text_content:
                text_part = MIMEText(message.text_content, 'plain', 'utf-8')
                msg.attach(text_part)
                
            if message.html_content:
                html_part = MIMEText(message.html_content, 'html', 'utf-8')
                msg.attach(html_part)
                
            # Adicionar anexos - otimizado com função auxiliar
            if message.attachments:
                def create_attachment(attachment):
                    part = MIMEBase('application', 'octet-stream')
                    part.set_payload(attachment.content)
                    encoders.encode_base64(part)
                    part.add_header(
                        'Content-Disposition',
                        f'attachment; filename= {attachment.filename}'
                    )
                    return part
                
                # Usar map para criar anexos de forma funcional
                for part in map(create_attachment, message.attachments):
                    msg.attach(part)
            
            # Conectar e enviar
            context = ssl.create_default_context()
            
            with smtplib.SMTP(self.config.smtp_host, self.config.smtp_port) as server:
                if self.config.smtp_use_tls:
                    server.starttls(context=context)
                server.login(self.config.smtp_username, self.config.smtp_password)
                
                # Lista de todos os destinatários - otimizado com functional approach
                recipients = [
                    addr.email
                    for addr_list in [message.to, message.cc or [], message.bcc or []]
                    for addr in addr_list
                ]
                
                server.send_message(msg, to_addrs=recipients)
                
            return {
                "success": True,
                "provider": "smtp",
                "recipients": len(recipients)
            }
            
        except Exception as e:
            logger.error(f"Erro ao enviar email via SMTP: {e}")
            return {
                "success": False,
                "provider": "smtp", 
                "error": str(e)
            }

class EmailTemplateManager:
    """Gerenciador de templates de email"""
    
    def __init__(self, config: EmailServiceConfig):
        self.config = config
        self.jinja_env = Environment(
            loader=FileSystemLoader(str(config.template_dir)),
            autoescape=True
        )
        self.templates = {}
        self._load_templates()
        
    def _load_templates(self):
        """Carrega templates do diretório - otimizado com functional approach"""
        def load_template(template_file):
            try:
                with open(template_file, 'r', encoding='utf-8') as f:
                    template_data = json.load(f)
                    return template_file.stem, EmailTemplate(**template_data)
            except Exception as e:
                logger.error(f"Erro ao carregar template {template_file}: {e}")
                return None, None
        
        # Usar map e dict comprehension para carregar todos os templates
        template_files = list(self.config.template_dir.glob('*.json'))
        template_results = map(load_template, template_files)
        self.templates = {
            template_id: template 
            for template_id, template in template_results 
            if template_id is not None and template is not None
        }
    
    def render_template(self, template_id: str, variables: Dict[str, Any]) -> EmailMessage:
        """Renderiza template com variáveis"""
        if template_id not in self.templates:
            raise ValueError(f"Template '{template_id}' não encontrado")
            
        template = self.templates[template_id]
        
        # Renderizar subject
        subject_template = Template(template.subject)
        subject = subject_template.render(**variables)
        
        # Renderizar HTML
        html_template = self.jinja_env.get_template(template.html_template)
        html_content = html_template.render(**variables)
        
        # Renderizar texto se disponível
        text_content = None
        if template.text_template:
            text_template = self.jinja_env.get_template(template.text_template)
            text_content = text_template.render(**variables)
            
        return EmailMessage(
            to=[],  # Será preenchido posteriormente
            subject=subject,
            html_content=html_content,
            text_content=text_content,
            template_id=template_id,
            template_data=variables
        )

class EmailService:
    """Serviço principal de email"""
    
    def __init__(self):
        self.config = EmailServiceConfig()
        self.template_manager = EmailTemplateManager(self.config)
        
        # Inicializar provider
        if self.config.provider == 'sendgrid':
            self.provider = SendGridProvider(self.config)
        else:
            self.provider = SMTPProvider(self.config)
            
        # Rate limiting simples
        self.sent_count_minute = 0
        self.sent_count_hour = 0
        self.last_minute_reset = datetime.now()
        self.last_hour_reset = datetime.now()
        
    def _check_rate_limit(self) -> bool:
        """Verifica limite de rate"""
        now = datetime.now()
        
        # Reset contadores se necessário
        if (now - self.last_minute_reset).seconds >= 60:
            self.sent_count_minute = 0
            self.last_minute_reset = now
            
        if (now - self.last_hour_reset).seconds >= 3600:
            self.sent_count_hour = 0
            self.last_hour_reset = now
        
        # Verificar limites
        return (self.sent_count_minute < self.config.rate_limit_per_minute and 
                self.sent_count_hour < self.config.rate_limit_per_hour)
    
    async def send_email(self, message: EmailMessage) -> Dict[str, Any]:
        """Envia email individual"""
        if not self._check_rate_limit():
            return {
                "success": False,
                "error": "Rate limit excedido",
                "rate_limit": True
            }
        
        try:
            result = await self.provider.send(message)
            
            if result.get("success"):
                self.sent_count_minute += 1
                self.sent_count_hour += 1
                
            return result
            
        except Exception as e:
            logger.error(f"Erro ao enviar email: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def send_template_email(self, template_id: str, to_addresses: List[EmailAddress], 
                                  variables: Dict[str, Any]) -> Dict[str, Any]:
        """Envia email usando template"""
        try:
            message = self.template_manager.render_template(template_id, variables)
            message.to = to_addresses
            
            return await self.send_email(message)
            
        except Exception as e:
            logger.error(f"Erro ao enviar template email: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    # Métodos específicos para o sistema PQT-U
    
    async def send_achievement_notification(self, user_email: str, user_name: str, 
                                           achievement_name: str, achievement_description: str,
                                           badge_url: Optional[str] = None) -> Dict[str, Any]:
        """Envia notificação de conquista"""
        variables = {
            "user_name": user_name,
            "achievement_name": achievement_name, 
            "achievement_description": achievement_description,
            "badge_url": badge_url,
            "date": datetime.now().strftime("%d/%m/%Y"),
            "site_url": "https://roteirodispensacao.com.br"
        }
        
        to_addresses = [EmailAddress(user_email, user_name)]
        return await self.send_template_email("achievement_notification", to_addresses, variables)
    
    async def send_progress_update(self, user_email: str, user_name: str,
                                   progress_percentage: int, completed_modules: List[str],
                                   next_recommendations: List[str]) -> Dict[str, Any]:
        """Envia atualização de progresso"""
        variables = {
            "user_name": user_name,
            "progress_percentage": progress_percentage,
            "completed_modules": completed_modules,
            "next_recommendations": next_recommendations,
            "date": datetime.now().strftime("%d/%m/%Y"),
            "site_url": "https://roteirodispensacao.com.br"
        }
        
        to_addresses = [EmailAddress(user_email, user_name)]
        return await self.send_template_email("progress_update", to_addresses, variables)
    
    async def send_welcome_email(self, user_email: str, user_name: str,
                                profile_type: str) -> Dict[str, Any]:
        """Envia email de boas-vindas"""
        variables = {
            "user_name": user_name,
            "profile_type": profile_type,
            "date": datetime.now().strftime("%d/%m/%Y"),
            "site_url": "https://roteirodispensacao.com.br",
            "getting_started_url": "https://roteirodispensacao.com.br/getting-started"
        }
        
        to_addresses = [EmailAddress(user_email, user_name)]
        return await self.send_template_email("welcome", to_addresses, variables)
    
    async def send_password_reset(self, user_email: str, user_name: str,
                                 reset_token: str) -> Dict[str, Any]:
        """Envia email de reset de senha"""
        variables = {
            "user_name": user_name,
            "reset_url": f"https://roteirodispensacao.com.br/reset-password?token={reset_token}",
            "expiry_hours": 24,
            "date": datetime.now().strftime("%d/%m/%Y"),
            "site_url": "https://roteirodispensacao.com.br"
        }
        
        to_addresses = [EmailAddress(user_email, user_name)]
        return await self.send_template_email("password_reset", to_addresses, variables)

# Singleton instance
email_service = EmailService()

# Funções de conveniência
async def send_achievement_email(user_email: str, user_name: str, achievement_name: str, 
                               achievement_description: str, badge_url: Optional[str] = None):
    """Função de conveniência para enviar notificação de conquista"""
    return await email_service.send_achievement_notification(
        user_email, user_name, achievement_name, achievement_description, badge_url
    )

async def send_progress_email(user_email: str, user_name: str, progress_percentage: int,
                            completed_modules: List[str], next_recommendations: List[str]):
    """Função de conveniência para enviar atualização de progresso"""
    return await email_service.send_progress_update(
        user_email, user_name, progress_percentage, completed_modules, next_recommendations
    )

async def send_welcome_user_email(user_email: str, user_name: str, profile_type: str):
    """Função de conveniência para enviar boas-vindas"""
    return await email_service.send_welcome_email(user_email, user_name, profile_type)

async def send_password_reset_email(user_email: str, user_name: str, reset_token: str):
    """Função de conveniência para enviar reset de senha"""
    return await email_service.send_password_reset(user_email, user_name, reset_token)