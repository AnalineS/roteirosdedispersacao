# Sistema Robusto de Segurança - Roteiro de Dispensação

## Visão Geral

Este é um sistema completo de segurança desenvolvido especificamente para o projeto Roteiro de Dispensação, mas projetado para ser reutilizável em todos os projetos futuros. O sistema implementa as melhores práticas de segurança modernas e oferece proteção abrangente contra ameaças cibernéticas.

## 🔒 Componentes Principais

### 1. Sistema de Gestão de Secrets (`secrets_manager.py`)
- **Criptografia**: Armazenamento seguro de secrets com criptografia AES
- **Rotação Automática**: Rotação programada de tokens e chaves
- **Auditoria**: Log completo de todos os acessos a secrets
- **Validação**: Verificação de integridade e expiração

**Características:**
- Suporte a diferentes tipos de secrets (API keys, tokens, senhas)
- Rotação automática baseada em políticas
- Criptografia em repouso com chave master
- Sistema de backup e recuperação
- Integração com variáveis de ambiente

### 2. Middleware de Segurança Avançado (`middleware.py`)
- **Rate Limiting Inteligente**: Sistema adaptativo baseado em comportamento
- **Detecção de Ataques**: Identificação automática de padrões maliciosos
- **Validação Robusta**: Sanitização e validação de todas as entradas
- **Headers de Segurança**: Implementação automática de headers seguros

**Funcionalidades:**
- Detecção de SQL Injection, XSS, Path Traversal
- Rate limiting baseado em score de confiança
- Bloqueio automático de IPs maliciosos
- Análise comportamental em tempo real
- Headers CSP, HSTS, X-Frame-Options automáticos

### 3. Arquitetura Zero-Trust (`zero_trust.py`)
- **Verificação Contínua**: Validação constante de identidade e contexto
- **Menor Privilégio**: Acesso mínimo necessário para cada operação
- **Microsegmentação**: Controle granular de recursos
- **Análise Comportamental**: Detecção de anomalias em padrões de uso

**Implementação:**
- Sistema de níveis de acesso hierárquico
- Verificação contínua de sessões
- Políticas baseadas em atributos (ABAC)
- Análise de contexto e risco em tempo real
- Decorators para proteção de endpoints

### 4. Monitoramento e Alertas (`monitoring.py`)
- **Detecção de Anomalias**: Machine Learning para identificar comportamentos suspeitos
- **Alertas Inteligentes**: Sistema hierárquico de notificações
- **Dashboard em Tempo Real**: Visualização completa do status de segurança
- **Integração SIEM**: Compatível com sistemas de monitoramento externos

**Capacidades:**
- Detecção ML com Isolation Forest
- Múltiplos canais de alerta (Email, Slack, Webhook)
- Métricas em tempo real
- Análise de tendências
- Relatórios automáticos

### 5. CI/CD Seguro (`cicd_security.py`)
- **Scan de Vulnerabilidades**: Análise automática de código e dependências
- **Verificação de Secrets**: Detecção de credenciais vazadas
- **Compliance**: Verificação automática de conformidade
- **Gates de Segurança**: Bloqueio automático de deploys inseguros

**Ferramentas:**
- Scanner de secrets com padrões avançados
- Análise de dependências com OSV Database
- Verificações de compliance OWASP
- Relatórios HTML/JSON detalhados
- Pre-commit hooks automáticos

## 🚀 Instalação e Configuração

### 1. Instalar Dependências

```bash
pip install -r requirements_security.txt
```

### 2. Configurar Variáveis de Ambiente

```bash
# Secrets Management
export SECRET_MASTER_KEY="sua-chave-master-segura"
export SECRETS_CONFIG_DIR="./config/secrets"

# Monitoramento
export SECURITY_WEBHOOK_URL="https://seu-webhook.com/alerts"
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/..."
export SMTP_SERVER="smtp.gmail.com"
export SMTP_USERNAME="alerts@yourdomain.com"
export SMTP_PASSWORD="senha-do-email"

# Logging
export SECURITY_LOG_LEVEL="INFO"
export SECURITY_LOG_FORMAT="structured"
```

### 3. Integração Básica

```python
from flask import Flask
from src.backend.core.security import create_secure_app

# Opção 1: Criar nova aplicação segura
app = create_secure_app(__name__)

# Opção 2: Integrar com aplicação existente
from src.backend.core.security import init_security_framework

app = Flask(__name__)
security_framework = init_security_framework(app)
```

## 📝 Exemplos de Uso

### Protegendo Endpoints

```python
from src.backend.core.security import (
    require_public_access,
    require_authenticated_access,
    require_admin_access
)

@app.route('/api/public')
@require_public_access()
def public_endpoint():
    return {'message': 'Público'}

@app.route('/api/chat', methods=['POST'])
@require_authenticated_access()
def chat_endpoint():
    return {'response': 'Chat protegido'}

@app.route('/api/admin/config')
@require_admin_access()
def admin_endpoint():
    return {'config': 'Apenas admin'}
```

### Gerenciando Secrets

```python
from src.backend.core.security import SecretsManager

secrets = SecretsManager()

# Definir secret
secrets.set_secret(
    name='api_key',
    value='minha-chave-secreta',
    secret_type='api_keys',
    encrypt=True,
    is_critical=True
)

# Obter secret
api_key = secrets.get_secret('api_key')

# Listar secrets que precisam rotação
expired = secrets.get_secrets_requiring_rotation()
```

### Monitoramento Personalizado

```python
from src.backend.core.security import record_security_metric, MetricType

# Registrar métricas customizadas
record_security_metric(
    MetricType.REQUEST_RATE, 
    1.0, 
    {'endpoint': '/api/chat', 'user_type': 'premium'}
)

# Obter dashboard
from src.backend.core.security import get_security_dashboard
dashboard_data = get_security_dashboard()
```

### Executando Scans de Segurança

```python
from src.backend.core.security import run_security_scan, DeploymentStage

# Scan completo
results = run_security_scan('.', DeploymentStage.PRODUCTION)

if not results['passed']:
    print("Falhas de segurança encontradas!")
    for rec in results['recommendations']:
        print(f"- {rec}")
```

## 🔧 Configuração Avançada

### Configuração Completa

```python
security_config = {
    'enable_monitoring': True,
    'security_log_level': 'INFO',
    'security_log_format': 'structured',
    'secrets_config_dir': './config/secrets',
    
    'alerts': {
        'email': {
            'smtp_server': 'smtp.gmail.com',
            'smtp_port': 587,
            'smtp_username': 'alerts@domain.com',
            'smtp_password': 'password',
            'from_email': 'security@domain.com',
            'to_emails': ['admin@domain.com']
        },
        'slack': {
            'webhook_url': 'https://hooks.slack.com/...'
        },
        'webhook': {
            'url': 'https://api.domain.com/alerts',
            'headers': {'Authorization': 'Bearer token'}
        }
    },
    
    'alert_rules': [
        {
            'name': 'high_error_rate',
            'metric_type': 'ERROR_RATE',
            'condition': lambda x: x > 5.0,
            'severity': 'HIGH',
            'message': 'Taxa de erro alta: {value}%'
        }
    ],
    
    'rate_limiting': {
        'normal': {'requests_per_minute': 60, 'burst': 10},
        'suspicious': {'requests_per_minute': 20, 'burst': 3},
        'high_risk': {'requests_per_minute': 5, 'burst': 1}
    }
}

app = create_secure_app(__name__, security_config)
```

## 📊 Dashboard e Monitoramento

### Endpoints de Segurança

- `GET /api/security/dashboard` - Dashboard completo
- `POST /api/security/scan` - Executar scan de segurança
- `GET /api/security/alerts` - Listar alertas ativos
- `POST /api/security/alerts/{id}/acknowledge` - Reconhecer alerta
- `GET /api/security/secrets/health` - Status dos secrets

### Métricas Disponíveis

- **REQUEST_RATE**: Taxa de requisições por minuto
- **ERROR_RATE**: Percentual de erros
- **RESPONSE_TIME**: Tempo médio de resposta
- **SECURITY_EVENTS**: Eventos de segurança detectados
- **ANOMALY_SCORE**: Score de anomalias
- **TRUST_SCORE**: Score de confiança do usuário
- **BLOCKED_REQUESTS**: Requisições bloqueadas
- **ACTIVE_SESSIONS**: Sessões ativas

## 🛡️ Níveis de Segurança

### Deployment Stages

1. **PRE_COMMIT** - Verificações básicas antes do commit
2. **BUILD** - Scans completos durante build
3. **TEST** - Validação em ambiente de teste
4. **STAGING** - Verificação rigorosa em staging
5. **PRODUCTION** - Máxima segurança para produção

### Access Levels

1. **NONE** - Sem acesso
2. **READ_BASIC** - Leitura básica
3. **READ_EXTENDED** - Leitura estendida
4. **API_BASIC** - API básica
5. **API_EXTENDED** - API completa
6. **ADMIN_READ** - Administração (leitura)
7. **ADMIN_WRITE** - Administração (escrita)
8. **SYSTEM_ADMIN** - Administração sistema
9. **ROOT** - Acesso total

## 🚨 Tipos de Ameaças Detectadas

### Ataques Automaticamente Detectados

- **SQL Injection**: Tentativas de injeção SQL
- **XSS**: Cross-Site Scripting
- **Path Traversal**: Tentativas de acesso a arquivos
- **Command Injection**: Injeção de comandos
- **Secrets Leakage**: Vazamento de credenciais
- **Rate Limit Abuse**: Abuso de taxa de requisições
- **Behavioral Anomalies**: Anomalias comportamentais
- **Suspicious User Agents**: Agentes suspeitos

### Alertas e Severidades

- **INFO**: Informações gerais
- **LOW**: Ameaças de baixo risco
- **MEDIUM**: Ameaças moderadas
- **HIGH**: Ameaças sérias
- **CRITICAL**: Ameaças críticas (bloqueio imediato)

## 🔄 Rotação de Secrets

### Políticas de Rotação

```python
{
    'api_keys': {'interval_days': 30, 'auto_rotate': True},
    'tokens': {'interval_days': 7, 'auto_rotate': True},
    'passwords': {'interval_days': 90, 'auto_rotate': False},
    'certificates': {'interval_days': 365, 'auto_rotate': False}
}
```

### Rotação Manual

```python
# Rotacionar secret específico
success = secrets_manager.rotate_secret('api_key', 'novo-valor')

# Verificar secrets que precisam rotação
secrets_to_rotate = secrets_manager.get_secrets_requiring_rotation()
```

## 📋 Compliance e Auditoria

### Verificações de Compliance

- **SEC001**: Ausência de secrets hardcoded
- **SEC002**: Uso exclusivo de HTTPS
- **SEC003**: Implementação de headers de segurança
- **SEC004**: Validação de entrada
- **SEC005**: Tratamento seguro de erros

### Logs de Auditoria

Todos os eventos são logados em formato estruturado:

```json
{
    "timestamp": "2025-01-27T10:30:00Z",
    "event_type": "secret_access",
    "client_ip": "192.168.1.100",
    "secret_name": "api_key",
    "operation": "GET",
    "success": true,
    "details": {...}
}
```

## 🎯 Reutilização em Novos Projetos

### Template de Projeto Seguro

```python
# main.py para novo projeto
from src.backend.core.security import create_secure_app

# Configuração específica do projeto
config = {
    'enable_monitoring': True,
    'project_name': 'MeuNovoProjeto',
    'alerts': {
        'email': {'to_emails': ['admin@projeto.com']}
    }
}

app = create_secure_app(__name__, config)

@app.route('/api/data')
@require_authenticated_access()
def get_data():
    return {'data': 'protegida'}

if __name__ == '__main__':
    app.run()
```

### Personalização

1. **Secrets**: Adicionar secrets específicos do projeto
2. **Métricas**: Definir métricas customizadas
3. **Alertas**: Configurar regras específicas
4. **Access Control**: Definir níveis de acesso personalizados
5. **Compliance**: Adicionar verificações específicas

## 🛠️ Desenvolvimento e Testes

### Executar Testes de Segurança

```bash
# Scan completo do projeto
python -c "
from src.backend.core.security import run_security_scan
results = run_security_scan('.')
print('Passed:', results['passed'])
"

# Configurar pre-commit hooks
python -c "
from src.backend.core.security import setup_security_hooks
setup_security_hooks('.')
"
```

### Ambiente de Desenvolvimento

```bash
# Variáveis para desenvolvimento
export FLASK_ENV=development
export SECURITY_LOG_LEVEL=DEBUG
export SECRET_MASTER_KEY=dev-key-not-for-production
```

## 📚 Documentação Adicional

### Arquivos de Configuração

- `requirements_security.txt` - Dependências do sistema
- `integration_example.py` - Exemplo completo de integração
- `security_framework.py` - Interface principal

### Logs e Monitoramento

- Logs estruturados em JSON para produção
- Integração com ELK Stack, Splunk, ou similar
- Métricas compatíveis com Prometheus/Grafana
- Alertas via Email, Slack, Teams, PagerDuty

## 🆘 Suporte e Troubleshooting

### Problemas Comuns

1. **Secrets não encontrados**: Verificar configuração de variáveis de ambiente
2. **Rate limiting muito restritivo**: Ajustar configurações de rate limiting
3. **Alertas excessivos**: Refinar regras de alertas
4. **Performance impactada**: Otimizar configurações de monitoramento

### Debug

```python
# Habilitar debug detalhado
import logging
logging.getLogger('security').setLevel(logging.DEBUG)

# Verificar status completo
from src.backend.core.security import global_security_framework
status = global_security_framework.get_security_status()
print(json.dumps(status, indent=2))
```

## 🔮 Roadmap Futuro

### Funcionalidades Planejadas

- [ ] Integração com AWS KMS/HashiCorp Vault
- [ ] Suporte a OAuth 2.0/OpenID Connect
- [ ] Machine Learning avançado para detecção de fraude
- [ ] Integração com threat intelligence feeds
- [ ] Dashboard web interativo
- [ ] Mobile app para alertas
- [ ] API GraphQL para métricas
- [ ] Suporte a containers/Kubernetes

### Melhorias Contínuas

- Otimização de performance
- Novos padrões de ataque
- Compliance com regulamentações
- Integração com mais ferramentas
- UX/UI do dashboard

---

## 📞 Contato

Para dúvidas, sugestões ou contribuições relacionadas ao sistema de segurança, entre em contato através dos canais oficiais do projeto Roteiro de Dispensação.

**Desenvolvido com 🔒 para máxima segurança e 💡 para fácil reutilização.**