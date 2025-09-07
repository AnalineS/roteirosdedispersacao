# Guia de Deploy - Fase 3
## Plataforma Educacional Médica sobre Hanseníase

**Versão:** 3.0.0  
**Data:** 07/09/2025  
**Objetivo:** Deploy seguro e eficiente em ambiente de produção médica

---

## 🎯 Visão Geral do Deploy

Este guia fornece instruções completas para deploy da plataforma educacional médica sobre hanseníase em ambiente de produção, com foco em:

- **Conformidade LGPD** para dados médicos sensíveis
- **Acessibilidade WCAG 2.1 AA** obrigatória
- **Precisão médica** com validações rigorosas
- **Monitoramento contínuo** da qualidade
- **Otimização por persona** (Dr. Gasnelio, GA)

---

## 📋 Pré-requisitos de Deploy

### 1. Requisitos de Sistema

#### Hardware Mínimo (Produção)
```bash
# Servidor Principal
CPU: 8 cores / 16 threads
RAM: 32GB
Storage: 500GB SSD
Network: 1Gbps

# Servidor de Banco (se separado)
CPU: 4 cores / 8 threads  
RAM: 16GB
Storage: 200GB SSD (com backup)
```

#### Software Requerido
```bash
# Sistema Operacional
Ubuntu 22.04 LTS ou CentOS Stream 9

# Runtime
Node.js: v18.17.0+
npm: v9.6.7+
PM2: v5.3.0+ (gerenciamento de processos)

# Banco de Dados
PostgreSQL: v14+ (dados estruturados)
Redis: v7.0+ (cache e sessões)

# Proxy Reverso
Nginx: v1.22+ (balanceamento e SSL)

# Monitoramento
Docker: v24.0+ (containers de monitoramento)
```

### 2. Certificações e Conformidades

#### Certificado SSL/TLS
```bash
# Certificado válido para domínio de produção
# Recomendado: Let's Encrypt ou certificado comercial
# Configuração: TLS 1.3 mínimo
```

#### Conformidade LGPD
```bash
# Verificar antes do deploy:
✅ Termo de Consentimento implementado
✅ Política de Privacidade atualizada
✅ Mecanismo de exclusão de dados
✅ Log de auditoria configurado
✅ Criptografia de dados sensíveis
```

#### Acessibilidade WCAG 2.1 AA
```bash
# Validação obrigatória:
✅ Contraste mínimo 4.5:1
✅ Navegação por teclado 100%
✅ Suporte a leitores de tela
✅ Textos alternativos para imagens
✅ Estrutura semântica HTML
```

---

## 🚀 Processo de Deploy

### Etapa 1: Preparação do Ambiente

#### 1.1 Configuração do Servidor
```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependências
sudo apt install -y curl wget git build-essential

# Instalar Node.js via NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PM2 globalmente
sudo npm install -g pm2

# Configurar firewall
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

#### 1.2 Configuração de Banco de Dados
```bash
# Instalar PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Configurar banco
sudo -u postgres psql -c "CREATE DATABASE hanseniase_prod;"
sudo -u postgres psql -c "CREATE USER hanseniase_user WITH ENCRYPTED PASSWORD 'sua_senha_segura';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE hanseniase_prod TO hanseniase_user;"

# Configurar Redis
sudo apt install -y redis-server
sudo systemctl enable redis-server
```

#### 1.3 Configuração do Nginx
```bash
# Instalar Nginx
sudo apt install -y nginx

# Configurar proxy reverso
sudo tee /etc/nginx/sites-available/hanseniase > /dev/null <<EOF
server {
    listen 80;
    server_name seu-dominio.com.br;
    
    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name seu-dominio.com.br;
    
    # SSL Configuration
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    ssl_protocols TLSv1.3 TLSv1.2;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    
    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';";
    
    # Proxy para aplicação
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Proxy para dashboard de monitoramento
    location /dashboard {
        proxy_pass http://localhost:3030;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
    }
    
    # Cache para assets estáticos
    location /static {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Ativar site
sudo ln -s /etc/nginx/sites-available/hanseniase /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Etapa 2: Deploy da Aplicação

#### 2.1 Clone e Build
```bash
# Criar usuário para aplicação
sudo adduser --system --group hanseniase
sudo mkdir -p /opt/hanseniase
sudo chown hanseniase:hanseniase /opt/hanseniase

# Trocar para usuário da aplicação
sudo -u hanseniase -i

# Clone do repositório
cd /opt/hanseniase
git clone https://github.com/seu-usuario/hanseniase-platform.git .
git checkout production  # ou tag de versão específica

# Instalar dependências
npm ci --production

# Build da aplicação
npm run build
```

#### 2.2 Configuração de Variáveis de Ambiente
```bash
# Criar arquivo de configuração de produção
sudo -u hanseniase tee /opt/hanseniase/.env.production > /dev/null <<EOF
# Configurações Gerais
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Banco de Dados
DATABASE_URL=postgresql://hanseniase_user:sua_senha_segura@localhost:5432/hanseniase_prod
REDIS_URL=redis://localhost:6379

# Segurança
JWT_SECRET=sua_chave_jwt_muito_segura_aqui
ENCRYPTION_KEY=sua_chave_criptografia_256_bits
SESSION_SECRET=sua_chave_sessao_muito_segura

# LGPD e Compliance
LGPD_ENABLED=true
AUDIT_LOG_ENABLED=true
DATA_RETENTION_DAYS=2555  # 7 anos para dados médicos
CONSENT_REQUIRED=true

# Acessibilidade
ACCESSIBILITY_MODE=strict
WCAG_LEVEL=AA
CONTRAST_MINIMUM=4.5

# Monitoramento
MONITORING_ENABLED=true
DASHBOARD_PORT=3030
METRICS_COLLECTION=true
ERROR_REPORTING_URL=https://seu-sentry.io/api/projeto

# Personas
PERSONA_OPTIMIZATION=true
DR_GASNELIO_CACHE_TTL=3600
GA_LEARNING_MODE=true

# APIs Externas
ANVISA_API_URL=https://api.anvisa.gov.br
MS_PROTOCOLS_API=https://api.ms.gov.br
EOF

# Proteger arquivo de configuração
sudo chmod 600 /opt/hanseniase/.env.production
```

#### 2.3 Configuração do PM2
```bash
# Criar configuração do PM2
sudo -u hanseniase tee /opt/hanseniase/ecosystem.config.js > /dev/null <<EOF
module.exports = {
  apps: [
    {
      name: 'hanseniase-app',
      script: './apps/frontend-nextjs/server.js',
      instances: 4,
      exec_mode: 'cluster',
      env_file: '.env.production',
      log_file: '/var/log/hanseniase/app.log',
      error_file: '/var/log/hanseniase/error.log',
      out_file: '/var/log/hanseniase/out.log',
      merge_logs: true,
      max_memory_restart: '1G',
      watch: false,
      ignore_watch: ['node_modules', 'logs', '.git'],
      
      // Configurações médicas específicas
      min_uptime: '10s',
      max_restarts: 3,
      restart_delay: 4000,
      
      // Monitoramento de saúde
      health_check_url: 'http://localhost:3000/api/health',
      health_check_grace_period: 30000
    },
    
    {
      name: 'hanseniase-dashboard',
      script: './.claude/dashboard/dashboard-server.js',
      instances: 1,
      env_file: '.env.production',
      log_file: '/var/log/hanseniase/dashboard.log',
      max_memory_restart: '512M'
    },
    
    {
      name: 'hanseniase-monitoring',
      script: './.claude/automation/continuous-monitoring-system.js',
      instances: 1,
      env_file: '.env.production',
      log_file: '/var/log/hanseniase/monitoring.log',
      max_memory_restart: '256M',
      
      // Execução contínua obrigatória para compliance
      autorestart: true,
      restart_delay: 1000
    }
  ]
};
EOF

# Criar diretórios de log
sudo mkdir -p /var/log/hanseniase
sudo chown hanseniase:hanseniase /var/log/hanseniase
```

### Etapa 3: Inicialização e Validação

#### 3.1 Executar Migrações de Banco
```bash
# Como usuário hanseniase
cd /opt/hanseniase

# Executar migrações
npm run migrate:prod

# Popular dados iniciais (protocolos médicos)
npm run seed:medical-protocols

# Validar integridade dos dados
npm run validate:database
```

#### 3.2 Executar Validação Pré-Deploy
```bash
# Executar suite completa de testes
npm run test:production

# Validação específica médica
node .claude/tests/comprehensive-test-suite.js

# Validação end-to-end
node .claude/tests/end-to-end-validation-suite.js

# Verificação de conformidade LGPD
node .claude/automation/lgpd-compliance-checker.js --environment=production

# Validação de acessibilidade
npm run test:accessibility -- --level=AA
```

#### 3.3 Iniciar Aplicação
```bash
# Iniciar com PM2
pm2 start ecosystem.config.js --env production

# Verificar status
pm2 status

# Configurar inicialização automática
pm2 save
pm2 startup

# Verificar logs iniciais
pm2 logs hanseniase-app --lines 50
```

#### 3.4 Validação Pós-Deploy
```bash
# Verificar saúde da aplicação
curl -f http://localhost:3000/api/health

# Testar endpoints críticos
curl -f https://seu-dominio.com.br/api/medical/calculator/rifampicina
curl -f https://seu-dominio.com.br/api/lgpd/consent-status

# Verificar dashboard de monitoramento
curl -f http://localhost:3030/api/status

# Validar métricas iniciais
curl -s http://localhost:3030/api/metrics/medical | jq '.accuracy'
```

---

## 🔍 Monitoramento e Observabilidade

### 1. Dashboard de Produção

#### Acessar Dashboard
```bash
# URL: https://seu-dominio.com.br/dashboard
# Credenciais: Configuradas via variáveis de ambiente

# Métricas Principais Monitoradas:
- Precisão médica dos cálculos (>95%)
- Conformidade LGPD (100%)
- Score de acessibilidade WCAG (>90%)
- Performance por persona
- Uptime do sistema
- Alertas críticos
```

#### Configurar Alertas
```bash
# Editar configuração de alertas
sudo -u hanseniase nano /opt/hanseniase/.claude/automation/intelligent-notification-system.js

# Configurar webhooks para Slack/Teams/Email
ALERT_WEBHOOK_URL=https://hooks.slack.com/services/seu/webhook/aqui
CRITICAL_ALERTS_EMAIL=admin@seu-dominio.com.br
```

### 2. Logs e Auditoria

#### Configurar Rotação de Logs
```bash
# Configurar logrotate
sudo tee /etc/logrotate.d/hanseniase > /dev/null <<EOF
/var/log/hanseniase/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 644 hanseniase hanseniase
    postrotate
        pm2 reload ecosystem.config.js
    endscript
}
EOF
```

#### Monitoramento de Compliance
```bash
# Verificar logs de auditoria LGPD
tail -f /var/log/hanseniase/lgpd-audit.log

# Verificar alertas de acessibilidade
tail -f /var/log/hanseniase/accessibility-violations.log

# Verificar precisão médica
tail -f /var/log/hanseniase/medical-validation.log
```

---

## 🛠️ Manutenção e Atualizações

### 1. Processo de Atualização

#### Atualização Sem Downtime (Blue-Green)
```bash
# 1. Preparar nova versão
git fetch origin
git checkout v3.1.0  # Nova versão

# 2. Build em ambiente isolado
npm ci --production
npm run build
npm run test:production

# 3. Deploy gradual
pm2 gracefulReload hanseniase-app

# 4. Validar nova versão
npm run validate:post-deploy

# 5. Rollback se necessário
pm2 gracefulReload hanseniase-app --rollback
```

### 2. Backup e Recuperação

#### Backup Automático
```bash
# Configurar backup diário
sudo tee /etc/cron.daily/hanseniase-backup > /dev/null <<'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backup/hanseniase"

# Criar diretório de backup
mkdir -p $BACKUP_DIR

# Backup do banco de dados
pg_dump hanseniase_prod | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Backup dos uploads/arquivos
tar -czf $BACKUP_DIR/files_$DATE.tar.gz /opt/hanseniase/uploads/

# Manter apenas últimos 30 dias
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

# Verificar integridade do backup
gunzip -t $BACKUP_DIR/db_$DATE.sql.gz
tar -tzf $BACKUP_DIR/files_$DATE.tar.gz > /dev/null
EOF

sudo chmod +x /etc/cron.daily/hanseniase-backup
```

### 3. Monitoramento de Performance

#### Métricas Críticas
```bash
# CPU e Memória
pm2 monit

# Banco de dados
sudo -u postgres psql hanseniase_prod -c "
SELECT 
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes
FROM pg_stat_user_tables 
ORDER BY n_tup_ins + n_tup_upd + n_tup_del DESC;
"

# Redis (cache)
redis-cli info memory
redis-cli info stats
```

---

## 🚨 Troubleshooting

### Problemas Comuns

#### 1. Aplicação não Inicia
```bash
# Verificar logs
pm2 logs hanseniase-app --lines 100

# Verificar configuração
node -e "console.log(require('./config/production.js'))"

# Verificar dependências
npm audit
npm run validate:dependencies
```

#### 2. Erro de Conectividade com Banco
```bash
# Testar conexão
sudo -u postgres psql hanseniase_prod -c "SELECT version();"

# Verificar configurações
sudo nano /etc/postgresql/*/main/postgresql.conf
sudo nano /etc/postgresql/*/main/pg_hba.conf

# Reiniciar PostgreSQL
sudo systemctl restart postgresql
```

#### 3. Falhas de Conformidade LGPD
```bash
# Executar diagnóstico completo
node .claude/automation/lgpd-compliance-checker.js --diagnose

# Verificar consentimentos
curl -s http://localhost:3000/api/lgpd/consent-report | jq

# Corrigir violações automaticamente
node .claude/automation/lgpd-compliance-checker.js --auto-fix
```

#### 4. Problemas de Acessibilidade
```bash
# Executar auditoria completa
npm run test:accessibility -- --fix

# Verificar contraste
node .claude/automation/accessibility-validator.js --contrast-check

# Testar navegação por teclado
npm run test:keyboard-navigation
```

---

## 📞 Suporte e Contatos

### Equipe de Suporte Técnico
- **Deploy e Infraestrutura:** infra@seu-dominio.com.br
- **Conformidade LGPD:** lgpd@seu-dominio.com.br  
- **Acessibilidade:** accessibility@seu-dominio.com.br
- **Questões Médicas:** medical@seu-dominio.com.br

### Documentação Adicional
- [Guia de Monitoramento](./MONITORING_SETUP.md)
- [Manual de Troubleshooting](./TROUBLESHOOTING.md)
- [Guia de Onboarding da Equipe](./TEAM_ONBOARDING.md)

### Repositórios e Recursos
- **Repositório Principal:** https://github.com/seu-usuario/hanseniase-platform
- **Documentação Técnica:** https://docs.seu-dominio.com.br
- **Status da Aplicação:** https://status.seu-dominio.com.br

---

**Última atualização:** 07/09/2025  
**Versão do Guia:** 3.0.0  
**Compatibilidade:** Plataforma v3.0.0+

> ⚠️ **Importante:** Este é um sistema médico. Qualquer deploy deve ser precedido de validação completa e aprovação da equipe médica responsável.