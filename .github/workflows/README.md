# Security Workflows - Roteiros de Dispensação

Este diretório contém os workflows de CI/CD focados em segurança para a plataforma educacional médica de dispensação PQT-U.

## 🔒 Workflows de Segurança

### 1. `security-scan.yml` - SAST Pipeline Completo
Pipeline principal que executa análise estática de segurança (SAST) usando múltiplas ferramentas:

**Ferramentas Incluídas:**
- **CodeQL** (GitHub Advanced Security) - Python e JavaScript/TypeScript
- **Bandit** - SAST específico para Python com foco em vulnerabilidades médicas
- **ESLint Security** - Análise de segurança para frontend React/Next.js
- **Safety** - Análise de vulnerabilidades em dependências Python
- **Semgrep** - SAST multi-linguagem
- **TruffleHog** - Detecção de secrets e credenciais

**Execução:**
- [OK] Push para `main`, `develop`, `feature/*`, `security/*`
- [OK] Pull Requests para `main`
- [OK] Agendamento diário (2:00 AM UTC)
- [OK] Execução manual via workflow_dispatch

### 2. `codeql-analysis.yml` - Análise CodeQL Detalhada
Análise específica e aprofundada usando CodeQL com:

**Características:**
- Queries personalizadas para contexto médico-educacional
- Análise de vulnerabilidades específicas para dados médicos
- Detecção de padrões inseguros em cálculos médicos
- Verificação de conformidade com LGPD

**Execução:**
- [OK] Push para `main`, `develop`
- [OK] Pull Requests para `main`
- [OK] Agendamento semanal (Domingos, 3:00 AM UTC)
- [OK] Execução manual

## [TARGET] Configurações de Segurança

### Backend (Python)
- **`.bandit`** - Configuração Bandit específica para plataforma médica
- **`.safety-policy.yml`** - Política de segurança para dependências

### Frontend (Next.js)
- **`.eslintrc.security.js`** - Regras ESLint focadas em segurança médica

### CodeQL
- **`codeql-config.yml`** - Configuração personalizada do CodeQL
- **`queries/`** - Queries customizadas para análise médica:
  - `medical-validation.ql` - Validação de dados médicos
  - `input-sanitization.ql` - Sanitização de entrada

## [ALERT] Severidade e Critérios de Falha

### Critérios de Falha do Pipeline
- [ERROR] **CRITICAL**: Vulnerabilidades que podem afetar segurança do paciente
- [ERROR] **HIGH**: Vulnerabilidades de segurança severas
- [WARNING] **MEDIUM**: Vulnerabilidades que requerem review (não falham o build)
- ℹ️ **LOW**: Informativo apenas

### Contexto Médico-Educacional
O sistema implementa verificações específicas para:

[OK] **Validação de Dados Médicos:**
- Cálculos de dosagem PQT-U
- Validação de entrada de dados clínicos
- Sanitização de dados de pacientes

[OK] **Conformidade Legal:**
- LGPD (Lei Geral de Proteção de Dados)
- CFM Resolução 2.314/2022 (Telemedicina)
- ANVISA RDC 4/2009 (Farmacovigilância)

[OK] **Segurança de Dados Sensíveis:**
- Detecção de hardcoded secrets
- Validação de entrada médica
- Proteção contra injection attacks

## [REPORT] Relatórios de Segurança

### Artifacts Gerados
Cada execução gera relatórios específicos disponíveis por 30-90 dias:

- `python-sast-reports/` - Relatórios Bandit e Safety
- `js-sast-reports/` - Relatórios ESLint e npm audit
- `semgrep-results/` - Análise Semgrep multi-linguagem
- `security-summary-report/` - Relatório consolidado
- `codeql-medical-report-*/` - Relatórios CodeQL específicos

### Pull Request Comments
Em PRs, o sistema automaticamente comenta com:
- [OK] Status de cada ferramenta de SAST
- [WARNING] Contagem de vulnerabilidades encontradas
- [LIST] Recomendações específicas para plataforma médica
- 🔗 Links para relatórios detalhados

## [FIX] Execução Local

### Bandit (Python SAST)
```bash
cd apps/backend
bandit -r . --configfile .bandit
```

### Safety (Python Dependencies)
```bash
cd apps/backend
safety check --policy-file .safety-policy.yml -r requirements.txt
```

### ESLint Security (Frontend)
```bash
cd apps/frontend-nextjs
npx eslint --config .eslintrc.security.js src/
```

### CodeQL (Requires GitHub CLI)
```bash
# Instalar CodeQL CLI
gh extension install github/gh-codeql

# Executar análise
codeql database create --language=python --source-root=apps/backend python-db
codeql database analyze python-db --format=table --output=results.txt
```

## [START] Customização

### Adicionando Novas Verificações
1. **Python**: Edite `apps/backend/.bandit` ou `.safety-policy.yml`
2. **JavaScript**: Edite `apps/frontend-nextjs/.eslintrc.security.js`
3. **CodeQL**: Adicione queries em `.github/queries/`

### Configurando Notificações
O sistema suporta:
- 📧 Email notifications (configurar em `.safety-policy.yml`)
- 💬 Slack alerts (configurar webhook)
- 🔗 Webhook integration para sistemas externos

## 📚 Referências

- [GitHub CodeQL](https://codeql.github.com/)
- [Bandit Documentation](https://bandit.readthedocs.io/)
- [Safety Documentation](https://pyup.io/safety/)
- [ESLint Security Plugin](https://github.com/nodesecurity/eslint-plugin-security)
- [Semgrep Rules](https://semgrep.dev/explore)

---

**⚕️ Nota Médica:** Este sistema de segurança foi desenvolvido especificamente para uma plataforma educacional médica, com foco em proteção de dados de saúde e conformidade com regulamentações brasileiras de telemedicina e farmacovigilância.

---
**Status Atual:** [OK] GitHub Secrets configurados - Sistema pronto para deploy