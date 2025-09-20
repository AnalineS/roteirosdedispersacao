"""
Testes Críticos para Compliance LGPD
Validação completa do sistema de logging, retenção e alertas
"""

import pytest
import asyncio
import os
import json
from datetime import datetime, timedelta
from unittest.mock import Mock, patch, AsyncMock
import tempfile

# Imports do sistema
from core.logging.cloud_logger import CloudLogger, LGPDLogEntry
from core.alerts.notification_system import AlertManager, AlertData

class TestCloudLogger:
    """Testes para o sistema de logging Cloud"""

    @pytest.fixture
    def logger(self):
        """Fixture para CloudLogger com configuração de teste"""
        with patch.dict(os.environ, {
            'GOOGLE_CLOUD_PROJECT_ID': 'test-project',
            'HASH_SALT': 'test-salt-123'
        }):
            logger = CloudLogger()
            # Mock do cliente para evitar chamadas reais
            logger.client = Mock()
            logger.dlp_client = Mock()
            return logger

    def test_hash_user_id(self, logger):
        """Testa mascaramento de user_id"""
        user_id = "user123"
        hashed = logger._hash_user_id(user_id)

        assert hashed is not None
        assert len(hashed) == 16
        assert hashed != user_id

        # Mesmo input deve gerar mesmo hash
        assert logger._hash_user_id(user_id) == hashed

    def test_detect_sensitive_data_cpf(self, logger):
        """Testa detecção de CPF"""
        test_cases = [
            ("123.456.789-10", True),
            ("12345678910", True),
            ("123.456.789-1", False),
            ("nome comum", False)
        ]

        for content, expected in test_cases:
            has_sensitive, types = logger._detect_sensitive_data(content)
            assert has_sensitive == expected
            if expected:
                assert 'cpf' in types

    def test_detect_sensitive_data_email(self, logger):
        """Testa detecção de email"""
        test_cases = [
            ("user@example.com", True),
            ("email: test@domain.org", True),
            ("contato em exemplo.com", False),
            ("não é email @", False)
        ]

        for content, expected in test_cases:
            has_sensitive, types = logger._detect_sensitive_data(content)
            assert has_sensitive == expected
            if expected:
                assert 'email' in types

    def test_detect_sensitive_data_medical(self, logger):
        """Testa detecção de dados médicos"""
        test_cases = [
            ("rifampicina 600mg", True),
            ("paciente com PQT-U", True),
            ("dose de clofazimina", True),
            ("consulta médica geral", False)
        ]

        for content, expected in test_cases:
            has_sensitive, types = logger._detect_sensitive_data(content)
            assert has_sensitive == expected
            if expected:
                assert 'medication' in types

    def test_mask_sensitive_data_email(self, logger):
        """Testa mascaramento de emails"""
        data = {
            "email": "usuario@exemplo.com",
            "normal": "texto normal"
        }

        masked = logger._mask_sensitive_data(data)

        assert masked["email"] == "us*****@exemplo.com"
        assert masked["normal"] == "texto normal"

    def test_mask_sensitive_data_cpf(self, logger):
        """Testa mascaramento de CPF"""
        data = {
            "cpf": "123.456.789-10",
            "outro": "valor"
        }

        masked = logger._mask_sensitive_data(data)

        assert masked["cpf"] == "123.***.**-**"
        assert masked["outro"] == "valor"

    def test_mask_sensitive_data_nested(self, logger):
        """Testa mascaramento em estruturas aninhadas"""
        data = {
            "user": {
                "email": "test@example.com",
                "phone": "(11) 99999-9999"
            },
            "items": [
                {"email": "another@test.com"}
            ]
        }

        masked = logger._mask_sensitive_data(data)

        assert "te**@example.com" in masked["user"]["email"]
        assert "****-****" in masked["user"]["phone"]
        assert "an*****@test.com" in masked["items"][0]["email"]

    def test_create_log_entry_personal_data(self, logger):
        """Testa criação de log com dados pessoais"""
        with patch.object(logger, '_detect_sensitive_data', return_value=(True, ['email'])):
            entry = logger._create_log_entry(
                'INFO',
                'User login',
                {'email': 'user@test.com'},
                'system',
                'user123'
            )

        assert entry.data_category == 'personal_data'  # Deve ser reclassificado
        assert entry.retention_days == 7  # Retenção para dados pessoais
        assert entry.has_sensitive_data == True
        assert entry.user_id_hash is not None

    def test_create_log_entry_analytics(self, logger):
        """Testa criação de log de analytics"""
        with patch.object(logger, '_detect_sensitive_data', return_value=(False, [])):
            entry = logger._create_log_entry(
                'INFO',
                'Page view',
                {'page': '/home', 'duration': 1500},
                'analytics'
            )

        assert entry.data_category == 'analytics'
        assert entry.retention_days == 30  # Retenção para analytics
        assert entry.has_sensitive_data == False

    def test_lgpd_event_logging(self, logger):
        """Testa logging específico LGPD"""
        with patch.object(logger, '_send_to_cloud_logging') as mock_send:
            logger.lgpd_event('consent_given', 'user123', {'consent_type': 'chat'})

            mock_send.assert_called_once()
            entry = mock_send.call_args[0][0]

            assert entry.data_category == 'audit'
            assert entry.retention_days == 365
            assert 'LGPD: consent_given' in entry.message

    def test_medical_interaction_logging(self, logger):
        """Testa logging de interações médicas"""
        with patch.object(logger, '_send_to_cloud_logging') as mock_send:
            logger.medical_interaction(
                'dr_gasnelio',
                'Como tomar rifampicina?',
                'user123',
                1500.0
            )

            mock_send.assert_called_once()
            entry = mock_send.call_args[0][0]

            assert entry.data_category == 'personal_data'
            assert entry.retention_days == 7
            assert entry.context['medical_context'] == True

    @patch('google.cloud.logging.Client')
    def test_send_to_cloud_logging_success(self, mock_client, logger):
        """Testa envio bem-sucedido para Cloud Logging"""
        mock_logger = Mock()
        mock_client.return_value.logger.return_value = mock_logger

        entry = LGPDLogEntry(
            log_id='test-123',
            timestamp=datetime.utcnow(),
            level='INFO',
            message='Test message',
            context={'test': 'data'},
            data_category='system',
            retention_days=7,
            expires_at=datetime.utcnow() + timedelta(days=7),
            has_sensitive_data=False
        )

        logger._send_to_cloud_logging(entry)

        mock_logger.log_struct.assert_called_once()

    def test_security_alert_logging(self, logger):
        """Testa logging de alertas de segurança"""
        with patch.object(logger, '_send_to_cloud_logging') as mock_send:
            logger.security_alert(
                'unauthorized_access',
                {'ip': '192.168.1.1', 'attempts': 5},
                'user123'
            )

            mock_send.assert_called_once()
            entry = mock_send.call_args[0][0]

            assert entry.level == 'CRITICAL'
            assert entry.data_category == 'audit'
            assert 'Security Alert' in entry.message

class TestAlertManager:
    """Testes para o sistema de alertas"""

    @pytest.fixture
    def alert_manager(self):
        """Fixture para AlertManager"""
        manager = AlertManager()
        # Mock dos canais para evitar envios reais
        for channel in manager.channels:
            channel.enabled = False
        return manager

    @pytest.mark.asyncio
    async def test_send_alert_basic(self, alert_manager):
        """Testa envio básico de alerta"""
        with patch.object(alert_manager.channels[0], 'send', return_value=True) as mock_send:
            alert_manager.channels[0].enabled = True

            results = await alert_manager.send_alert(
                alert_type='system_error',
                severity='medium',
                title='Test Alert',
                message='This is a test alert'
            )

            mock_send.assert_called_once()
            assert 'email' in results

    @pytest.mark.asyncio
    async def test_lgpd_violation_alert(self, alert_manager):
        """Testa alerta específico de violação LGPD"""
        with patch.object(alert_manager, 'send_alert') as mock_send:
            await alert_manager.lgpd_violation(
                'unauthorized_data_access',
                {'affected_records': 10},
                'user123'
            )

            mock_send.assert_called_once()
            call_args = mock_send.call_args

            assert call_args[1]['alert_type'] == 'lgpd_violation'
            assert call_args[1]['severity'] == 'critical'
            assert call_args[1]['requires_immediate_action'] == True

    @pytest.mark.asyncio
    async def test_data_retention_expired_alert(self, alert_manager):
        """Testa alerta de dados expirados"""
        with patch.object(alert_manager, 'send_alert') as mock_send:
            await alert_manager.data_retention_expired('personal_data', 25)

            mock_send.assert_called_once()
            call_args = mock_send.call_args

            assert call_args[1]['alert_type'] == 'retention_expired'
            assert call_args[1]['severity'] == 'medium'
            assert '25 registros' in call_args[1]['message']

    @pytest.mark.asyncio
    async def test_security_breach_alert(self, alert_manager):
        """Testa alerta de violação de segurança"""
        with patch.object(alert_manager, 'send_alert') as mock_send:
            await alert_manager.security_breach(
                'data_breach',
                100,
                {'attack_vector': 'sql_injection'}
            )

            mock_send.assert_called_once()
            call_args = mock_send.call_args

            assert call_args[1]['alert_type'] == 'data_breach'
            assert call_args[1]['severity'] == 'critical'
            assert call_args[1]['requires_immediate_action'] == True

    def test_alert_history_management(self, alert_manager):
        """Testa gerenciamento do histórico de alertas"""
        # Adicionar alertas ao histórico
        for i in range(150):  # Mais que o limite de 100
            alert = AlertData(
                alert_id=f'test-{i}',
                alert_type='system_error',
                severity='low',
                title=f'Test {i}',
                message=f'Message {i}',
                details={},
                timestamp=datetime.utcnow()
            )
            alert_manager.alert_history.append(alert)

        # Simular limpeza chamando send_alert
        asyncio.run(alert_manager.send_alert(
            'system_error',
            'low',
            'Final alert',
            'Final message'
        ))

        # Deve manter apenas 100 alertas
        assert len(alert_manager.alert_history) <= 101  # 100 + novo alerta

    def test_get_alert_stats_empty(self, alert_manager):
        """Testa estatísticas com histórico vazio"""
        stats = alert_manager.get_alert_stats()

        assert stats['total_alerts'] == 0
        assert stats['last_24h'] == 0
        assert stats['by_severity'] == {}
        assert stats['by_type'] == {}

    def test_get_alert_stats_with_data(self, alert_manager):
        """Testa estatísticas com dados"""
        # Adicionar alertas de teste
        now = datetime.utcnow()
        old_alert = AlertData(
            alert_id='old',
            alert_type='system_error',
            severity='low',
            title='Old',
            message='Old',
            details={},
            timestamp=now - timedelta(hours=25)  # Mais de 24h
        )

        recent_alert = AlertData(
            alert_id='recent',
            alert_type='lgpd_violation',
            severity='critical',
            title='Recent',
            message='Recent',
            details={},
            timestamp=now - timedelta(hours=1)  # Menos de 24h
        )

        alert_manager.alert_history = [old_alert, recent_alert]

        stats = alert_manager.get_alert_stats()

        assert stats['total_alerts'] == 2
        assert stats['last_24h'] == 1
        assert stats['by_severity']['low'] == 1
        assert stats['by_severity']['critical'] == 1
        assert stats['by_type']['system_error'] == 1
        assert stats['by_type']['lgpd_violation'] == 1

class TestEmailNotificationChannel:
    """Testes específicos para canal de email"""

    @pytest.fixture
    def email_channel(self):
        """Fixture para canal de email"""
        from core.alerts.notification_system import EmailNotificationChannel

        with patch.dict(os.environ, {
            'ALERT_EMAIL_SMTP_HOST': 'smtp.test.com',
            'ALERT_EMAIL_SMTP_PORT': '587',
            'ALERT_EMAIL_SMTP_USER': 'test@example.com',
            'ALERT_EMAIL_SMTP_PASS': 'password',
            'ALERT_EMAIL_TO': 'admin@example.com'
        }):
            channel = EmailNotificationChannel()
            channel.rate_limit = 10  # Aumentar para testes
            return channel

    def test_email_template_generation(self, email_channel):
        """Testa geração de template HTML"""
        alert = AlertData(
            alert_id='test-123',
            alert_type='lgpd_violation',
            severity='critical',
            title='Test Violation',
            message='Test message',
            details={'test': 'data'},
            timestamp=datetime.utcnow(),
            requires_immediate_action=True
        )

        html = email_channel._get_email_template(alert)

        assert 'Test Violation' in html
        assert 'critical' in html.lower()
        assert 'AÇÃO IMEDIATA NECESSÁRIA' in html
        assert 'test-123' in html

    @pytest.mark.asyncio
    async def test_email_send_success(self, email_channel):
        """Testa envio bem-sucedido de email"""
        alert = AlertData(
            alert_id='test-123',
            alert_type='system_error',
            severity='medium',
            title='Test Alert',
            message='Test message',
            details={},
            timestamp=datetime.utcnow()
        )

        with patch('smtplib.SMTP') as mock_smtp:
            mock_server = Mock()
            mock_smtp.return_value.__enter__.return_value = mock_server

            result = await email_channel.send(alert)

            assert result == True
            mock_server.starttls.assert_called_once()
            mock_server.login.assert_called_once()
            mock_server.send_message.assert_called_once()

    def test_rate_limiting(self, email_channel):
        """Testa rate limiting"""
        # Simular múltiplos alertas recentes
        now = datetime.utcnow()
        email_channel.last_alerts = [now - timedelta(minutes=i) for i in range(15)]

        assert email_channel.is_rate_limited() == True

        # Limpar alertas antigos
        email_channel.last_alerts = [now - timedelta(hours=2)]
        assert email_channel.is_rate_limited() == False

class TestTelegramNotificationChannel:
    """Testes específicos para canal Telegram"""

    @pytest.fixture
    def telegram_channel(self):
        """Fixture para canal Telegram"""
        from core.alerts.notification_system import TelegramNotificationChannel

        with patch.dict(os.environ, {
            'TELEGRAM_BOT_TOKEN': '123456:ABC-DEF',
            'TELEGRAM_CHAT_ID': '-1001234567890'
        }):
            channel = TelegramNotificationChannel()
            channel.rate_limit = 10  # Aumentar para testes
            return channel

    def test_telegram_message_formatting(self, telegram_channel):
        """Testa formatação de mensagem Telegram"""
        alert = AlertData(
            alert_id='test-123',
            alert_type='data_breach',
            severity='critical',
            title='Security Breach',
            message='Unauthorized access detected',
            details={'affected_users': 50},
            timestamp=datetime.utcnow(),
            user_id='user123',
            requires_immediate_action=True
        )

        message = telegram_channel._get_telegram_message(alert)

        assert 'Security Breach' in message
        assert '🔴' in message  # Critical severity
        assert '🚨' in message  # Breach type
        assert 'user123***' in message  # Masked user ID
        assert 'AÇÃO IMEDIATA NECESSÁRIA' in message
        assert 'test-123' in message

    @pytest.mark.asyncio
    async def test_telegram_send_success(self, telegram_channel):
        """Testa envio bem-sucedido Telegram"""
        alert = AlertData(
            alert_id='test-123',
            alert_type='system_error',
            severity='medium',
            title='Test Alert',
            message='Test message',
            details={},
            timestamp=datetime.utcnow()
        )

        with patch('aiohttp.ClientSession') as mock_session:
            mock_response = Mock()
            mock_response.status = 200
            mock_session.return_value.__aenter__.return_value.post.return_value.__aenter__.return_value = mock_response

            result = await telegram_channel.send(alert)

            assert result == True

class TestIntegrationCompliance:
    """Testes de integração para compliance LGPD"""

    @pytest.mark.asyncio
    async def test_end_to_end_lgpd_flow(self):
        """Teste completo do fluxo LGPD"""
        # Configurar ambiente de teste
        with patch.dict(os.environ, {
            'GOOGLE_CLOUD_PROJECT_ID': 'test-project',
            'HASH_SALT': 'test-salt'
        }):
            logger = CloudLogger()
            logger.client = Mock()

            alert_manager = AlertManager()
            for channel in alert_manager.channels:
                channel.enabled = False

            # Simular evento com dados sensíveis
            with patch.object(logger, '_detect_sensitive_data', return_value=(True, ['email'])):
                with patch.object(logger, '_send_to_cloud_logging'):
                    logger.medical_interaction(
                        'dr_gasnelio',
                        'Meu email é user@test.com',
                        'user123',
                        1000.0
                    )

            # Simular violação LGPD
            with patch.object(alert_manager, 'send_alert') as mock_send:
                await alert_manager.lgpd_violation(
                    'data_exposure',
                    {'exposed_emails': 5},
                    'user123'
                )

                assert mock_send.called

    def test_retention_calculation(self):
        """Testa cálculo correto de retenção"""
        with patch.dict(os.environ, {'GOOGLE_CLOUD_PROJECT_ID': 'test'}):
            logger = CloudLogger()

            # Dados pessoais: 7 dias
            with patch.object(logger, '_detect_sensitive_data', return_value=(True, ['cpf'])):
                entry = logger._create_log_entry('INFO', 'Personal data', {})
                assert entry.retention_days == 7
                assert entry.data_category == 'personal_data'

            # Analytics: 30 dias
            with patch.object(logger, '_detect_sensitive_data', return_value=(False, [])):
                entry = logger._create_log_entry('INFO', 'Analytics', {}, 'analytics')
                assert entry.retention_days == 30
                assert entry.data_category == 'analytics'

            # Auditoria: 365 dias
            entry = logger._create_log_entry('INFO', 'Audit', {}, 'audit')
            assert entry.retention_days == 365
            assert entry.data_category == 'audit'

if __name__ == '__main__':
    # Executar testes
    pytest.main([
        __file__,
        '-v',
        '--tb=short',
        '--cov=core.logging',
        '--cov=core.alerts',
        '--cov-report=html',
        '--cov-report=term-missing'
    ])