-- ============================================================================
-- SOCIAL FEATURES DATABASE SCHEMA - PR #175
-- Schema para funcionalidades sociais: perfil, notificações e contas conectadas
-- ============================================================================

-- Tabela para preferências de email dos usuários
CREATE TABLE IF NOT EXISTS user_email_preferences (
  user_id VARCHAR(255) PRIMARY KEY,
  email_notifications BOOLEAN DEFAULT TRUE,
  achievement_emails BOOLEAN DEFAULT TRUE,
  progress_emails BOOLEAN DEFAULT TRUE,
  social_emails BOOLEAN DEFAULT TRUE,
  marketing_emails BOOLEAN DEFAULT FALSE,
  frequency ENUM('immediate', 'daily', 'weekly', 'never') DEFAULT 'immediate',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_user_id (user_id),
  INDEX idx_frequency (frequency),
  INDEX idx_updated_at (updated_at)
);

-- Tabela para log de notificações enviadas
CREATE TABLE IF NOT EXISTS notification_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  notification_type VARCHAR(50) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  recipient_email VARCHAR(255) NOT NULL,
  template_used VARCHAR(100),
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  success BOOLEAN DEFAULT FALSE,
  error_message TEXT NULL,
  provider_used ENUM('sendgrid', 'smtp', 'fallback') DEFAULT 'sendgrid',
  
  INDEX idx_user_id (user_id),
  INDEX idx_sent_at (sent_at),
  INDEX idx_success (success),
  INDEX idx_notification_type (notification_type),
  INDEX idx_recipient_email (recipient_email)
);

-- Tabela para contas sociais conectadas
CREATE TABLE IF NOT EXISTS connected_accounts (
  user_id VARCHAR(255) NOT NULL,
  provider VARCHAR(50) NOT NULL,
  provider_id VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  display_name VARCHAR(255),
  photo_url TEXT,
  connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_used TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  is_verified BOOLEAN DEFAULT FALSE,
  is_primary BOOLEAN DEFAULT FALSE,
  permissions JSON,
  access_token_hash VARCHAR(255), -- Hash do token, não o token real
  
  PRIMARY KEY (user_id, provider),
  UNIQUE KEY unique_provider_id (provider, provider_id),
  INDEX idx_provider_id (provider_id),
  INDEX idx_email (email),
  INDEX idx_connected_at (connected_at),
  INDEX idx_last_used (last_used)
);

-- Tabela para dados de perfil social estendido
CREATE TABLE IF NOT EXISTS user_social_profiles (
  user_id VARCHAR(255) PRIMARY KEY,
  bio TEXT,
  institution VARCHAR(255),
  specialization VARCHAR(255),
  location VARCHAR(255),
  website VARCHAR(255),
  is_public BOOLEAN DEFAULT FALSE,
  show_achievements BOOLEAN DEFAULT TRUE,
  show_progress BOOLEAN DEFAULT TRUE,
  show_email BOOLEAN DEFAULT FALSE,
  privacy_level ENUM('public', 'restricted', 'private') DEFAULT 'restricted',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_is_public (is_public),
  INDEX idx_privacy_level (privacy_level),
  INDEX idx_institution (institution),
  INDEX idx_specialization (specialization)
);

-- Tabela para compartilhamentos sociais (tracking)
CREATE TABLE IF NOT EXISTS social_shares (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  share_type ENUM('achievement', 'progress', 'profile', 'content') NOT NULL,
  platform VARCHAR(50) NOT NULL,
  content_data JSON,
  shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  success BOOLEAN DEFAULT TRUE,
  
  INDEX idx_user_id (user_id),
  INDEX idx_share_type (share_type),
  INDEX idx_platform (platform),
  INDEX idx_shared_at (shared_at)
);

-- Tabela para rate limiting de emails
CREATE TABLE IF NOT EXISTS email_rate_limits (
  user_id VARCHAR(255) NOT NULL,
  email_type VARCHAR(50) NOT NULL,
  sent_count INT DEFAULT 0,
  window_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_sent TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (user_id, email_type),
  INDEX idx_window_start (window_start),
  INDEX idx_last_sent (last_sent)
);

-- ============================================================================
-- VIEWS ÚTEIS
-- ============================================================================

-- View para estatísticas de notificações por usuário
CREATE OR REPLACE VIEW user_notification_stats AS
SELECT 
  user_id,
  COUNT(*) as total_notifications,
  SUM(CASE WHEN success = TRUE THEN 1 ELSE 0 END) as successful_notifications,
  SUM(CASE WHEN success = FALSE THEN 1 ELSE 0 END) as failed_notifications,
  COUNT(DISTINCT notification_type) as types_used,
  MAX(sent_at) as last_notification_sent,
  MIN(sent_at) as first_notification_sent
FROM notification_log 
GROUP BY user_id;

-- View para usuários com perfil social público
CREATE OR REPLACE VIEW public_social_profiles AS
SELECT 
  usp.user_id,
  usp.bio,
  usp.institution,
  usp.specialization,
  usp.location,
  usp.website,
  usp.show_achievements,
  usp.show_progress,
  usp.created_at as profile_created_at,
  COUNT(ca.provider) as connected_accounts_count
FROM user_social_profiles usp
LEFT JOIN connected_accounts ca ON usp.user_id = ca.user_id
WHERE usp.is_public = TRUE
GROUP BY usp.user_id;

-- ============================================================================
-- TRIGGERS PARA MANUTENÇÃO AUTOMÁTICA
-- ============================================================================

-- Trigger para limpar logs antigos (manter apenas 90 dias)
DELIMITER //
CREATE OR REPLACE EVENT cleanup_old_notifications
ON SCHEDULE EVERY 1 DAY
STARTS CURRENT_TIMESTAMP
DO
BEGIN
  DELETE FROM notification_log 
  WHERE sent_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
  
  DELETE FROM email_rate_limits 
  WHERE window_start < DATE_SUB(NOW(), INTERVAL 7 DAY);
END//
DELIMITER ;

-- ============================================================================
-- DADOS INICIAIS E CONFIGURAÇÕES
-- ============================================================================

-- Inserir configurações padrão para tipos de notificação
INSERT IGNORE INTO user_email_preferences (user_id, email_notifications, achievement_emails, progress_emails, social_emails, marketing_emails, frequency)
SELECT DISTINCT user_id, TRUE, TRUE, TRUE, FALSE, FALSE, 'immediate'
FROM connected_accounts
WHERE user_id NOT IN (SELECT user_id FROM user_email_preferences);

-- ============================================================================
-- ÍNDICES COMPOSTOS PARA PERFORMANCE
-- ============================================================================

-- Índice composto para busca de logs por usuário e período
ALTER TABLE notification_log 
ADD INDEX idx_user_date_success (user_id, sent_at, success);

-- Índice composto para rate limiting
ALTER TABLE email_rate_limits 
ADD INDEX idx_rate_limit_check (user_id, email_type, window_start);

-- ============================================================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================================================

ALTER TABLE user_email_preferences 
COMMENT = 'Preferências de email por usuário - PR #175';

ALTER TABLE notification_log 
COMMENT = 'Log de todas as notificações enviadas - PR #175';

ALTER TABLE connected_accounts 
COMMENT = 'Contas sociais conectadas (Google OAuth) - PR #175';

ALTER TABLE user_social_profiles 
COMMENT = 'Perfis sociais estendidos dos usuários - PR #175';

ALTER TABLE social_shares 
COMMENT = 'Tracking de compartilhamentos sociais - PR #175';

ALTER TABLE email_rate_limits 
COMMENT = 'Rate limiting para envio de emails - PR #175';

-- ============================================================================
-- VERIFICAÇÃO DE INTEGRIDADE
-- ============================================================================

-- Verificar se todas as tabelas foram criadas
SELECT 
  TABLE_NAME,
  TABLE_ROWS,
  TABLE_COMMENT
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME IN (
    'user_email_preferences',
    'notification_log', 
    'connected_accounts',
    'user_social_profiles',
    'social_shares',
    'email_rate_limits'
  );

-- ============================================================================