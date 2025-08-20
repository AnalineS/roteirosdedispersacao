# 🧪 Guia do Ambiente de Homologação (HML)

Este documento descreve o ambiente de homologação (HML) implementado para o projeto Roteiro de Dispensação de Hanseníase.

## 📋 Visão Geral

O ambiente HML foi projetado para:
- **Testes automatizados** antes do deploy de produção
- **Validação de qualidade** com gates rigorosos (95% cobertura)
- **Segurança integrada** com Snyk scanning
- **Deploy automático** em commits na branch `hml`
- **Aprovação manual** para produção

## 🏗️ Arquitetura do Ambiente

### Infraestrutura
```
┌─────────────────────────────────────────────────────────────┐
│                    AMBIENTE HML                             │
├─────────────────────────────────────────────────────────────┤
│  Frontend (Firebase)    │    Backend (Cloud Run)            │
│  hml-roteiros-de-       │    hml-roteiro-dispensacao-api     │
│  dispensacao.web.app    │    .run.app                        │
├─────────────────────────────────────────────────────────────┤
│  Firestore (prefixo hml_) │  Logs (Cloud Logging)           │
│  hml_users               │   Monitoramento integrado          │
│  hml_conversations       │                                   │
│  hml_feedback           │                                   │
└─────────────────────────────────────────────────────────────┘
```

### Configurações Específicas

| Componente | HML | Produção |
|------------|-----|----------|
| **Cloud Run** | hml-roteiro-dispensacao-api | roteiro-dispensacao-api |
| **Firebase Site** | hml-roteiros-de-dispensacao | roteiros-de-dispensacao |
| **Firestore** | Prefixo `hml_` | Sem prefixo |
| **Memory** | 1Gi | 2Gi |
| **CPU** | 1 | 2 |
| **Min Instances** | 0 | 1 |
| **Max Instances** | 10 | 100 |

## 🚀 Processo de Deploy

### 1. Deploy Automático HML
```bash
# Trigger automático em commits na branch hml
git checkout hml
git commit -m "feat: nova funcionalidade"
git push origin hml

# GitHub Actions executa automaticamente:
# ✅ Quality Gates (Snyk + Testes)
# ✅ Deploy Backend (Cloud Run)
# ✅ Deploy Frontend (Firebase)
# ✅ Reset de dados + Seed
# ✅ Smoke Tests
# ✅ Notificações
```

### 2. Quality Gates (95% Coverage)
- **Frontend Tests**: Jest + coverage mínima 95%
- **Backend Tests**: Pytest + coverage mínima 95%
- **Security Scan**: Snyk (bloqueia Critical/High/Medium)
- **Code Quality**: ESLint + TypeScript + Flake8 + MyPy
- **Build Test**: Docker build validation

### 3. Aprovação para Produção
```bash
# Deploy manual para produção (após validação HML)
# Acesse GitHub Actions > "Deploy Production"
# Preencha os campos obrigatórios:
# ✅ HML validation completed: true
# ✅ Version tag: v1.2.3
# ✅ Release notes: descrição das mudanças
```

## 🔧 Configuração e Uso

### URLs do Ambiente HML
- **Frontend**: https://hml-roteiros-de-dispensacao.web.app
- **Backend API**: https://hml-roteiro-dispensacao-api-***.run.app
- **Health Check**: `{backend_url}/health`
- **API Docs**: `{backend_url}/api/docs`

### Dados de Teste
O ambiente HML é resetado a cada deploy com dados sintéticos:

#### Usuários de Teste
```json
{
  "medico": "test-medico-01@exemplo.com",
  "enfermeiro": "test-enfermeiro-01@exemplo.com", 
  "farmaceutico": "test-farmaceutico-01@exemplo.com",
  "estudante": "test-estudante-01@exemplo.com",
  "admin": "test-admin-01@exemplo.com"
}
```

#### Cenários de Teste
- **Consulta de dosagem**: Teste com Dr. Gasnelio
- **Educação de paciente**: Teste com Gá
- **Interações medicamentosas**: Validação farmacológica
- **Conteúdo básico**: Material educacional

### Monitoramento

#### Métricas Disponíveis
- **Uptime**: Status dos serviços
- **Performance**: Tempo de resposta
- **Qualidade**: Taxa de sucesso das respostas
- **Uso**: Número de interações
- **Segurança**: Tentativas de acesso indevido

#### Alertas Configurados
- **Downtime** > 1 minuto → Telegram imediato
- **Response time** > 5s → Alerta diário
- **Error rate** > 5% → Telegram imediato
- **Deploy failure** → Telegram + Email

## 🧪 Testes Manuais Recomendados

### Checklist de Validação HML

#### Frontend
- [ ] Carregamento da página inicial
- [ ] Sistema de autenticação
- [ ] Chat com Dr. Gasnelio
- [ ] Chat com Gá
- [ ] Navegação entre módulos
- [ ] Funcionalidade offline
- [ ] Responsividade mobile

#### Backend
- [ ] Health check (`/health`)
- [ ] API de personas (`/api/v1/personas`)
- [ ] Chat endpoint (`/api/v1/chat`)
- [ ] Feedback endpoint (`/api/v1/feedback`)
- [ ] Rate limiting funcionando
- [ ] CORS configurado corretamente
- [ ] Logs estruturados

#### Integração
- [ ] Comunicação Frontend ↔ Backend
- [ ] Persistência no Firestore
- [ ] Analytics funcionando
- [ ] Notificações configuradas
- [ ] Performance aceitável (< 3s)

### Cenários de Teste Específicos

#### Teste de Carga Básica
```bash
# Usar Apache Bench ou similar
ab -n 100 -c 10 https://hml-roteiro-dispensacao-api-***.run.app/health
```

#### Teste de Segurança
```bash
# Verificar headers de segurança
curl -I https://hml-roteiros-de-dispensacao.web.app

# Headers esperados:
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
# X-XSS-Protection: 1; mode=block
# Content-Security-Policy: [política restritiva]
```

## 🛠️ Troubleshooting

### Problemas Comuns

#### Deploy Failed
```bash
# 1. Verificar logs do GitHub Actions
# 2. Checar quality gates
# 3. Validar configuração de secrets
# 4. Testar build local

# Build local para debug
cd apps/backend
docker build -f Dockerfile.hml -t test-hml .
docker run -p 8080:8080 test-hml
```

#### Serviço Indisponível
```bash
# Verificar status do Cloud Run
gcloud run services describe hml-roteiro-dispensacao-api \
  --region=us-central1 \
  --format="value(status.conditions[0].type,status.conditions[0].status)"

# Verificar logs
gcloud logs read "resource.type=cloud_run_revision" \
  --filter="resource.labels.service_name=hml-roteiro-dispensacao-api" \
  --limit=50
```

#### Dados Não Seedados
```bash
# Re-executar seed manualmente
bash scripts/seed-hml-data.sh

# Verificar endpoint interno
curl -H "Authorization: Bearer $HML_SEED_TOKEN" \
  https://hml-roteiro-dispensacao-api-***.run.app/internal/hml-stats
```

#### Frontend Não Carrega
```bash
# Verificar deploy no Firebase
firebase hosting:sites:list

# Verificar configuração
firebase target:list

# Re-deploy manual se necessário
cd apps/frontend-nextjs
npm run build
firebase deploy --only hosting:hml
```

### Logs e Debug

#### Cloud Run Logs
```bash
# Logs em tempo real
gcloud logs tail "resource.type=cloud_run_revision" \
  --filter="resource.labels.service_name=hml-roteiro-dispensacao-api"
```

#### Firebase Logs
```bash
# Verificar logs de hosting
firebase functions:log --only hosting
```

#### GitHub Actions Debug
```bash
# Habilitar debug nos workflows adicionando secrets:
# ACTIONS_STEP_DEBUG=true
# ACTIONS_RUNNER_DEBUG=true
```

## 📊 Métricas e SLAs

### SLA do Ambiente HML
- **Uptime**: > 95% (exceto durante deploys)
- **Response Time**: < 3s para 95% das requests
- **Deploy Time**: < 15 minutos do commit ao funcionamento
- **Recovery Time**: < 5 minutos em caso de falha

### Métricas de Qualidade
- **Code Coverage**: 95% obrigatório
- **Security Score**: 0 Critical + 0 High vulnerabilities
- **Performance**: Core Web Vitals > 75
- **Accessibility**: WCAG 2.1 AA compliance

## 🔒 Segurança

### Controles Implementados
- **Snyk scanning** em todo código e dependências
- **Custom security rules** para contexto médico
- **Rate limiting** para prevenir abuso
- **CORS restrictivo** apenas para domínios válidos
- **CSP headers** para prevenir XSS
- **Firestore rules** permissivas apenas para dados HML

### Dados Sensíveis
- **Dados sintéticos** apenas - sem informações reais
- **Reset automático** a cada deploy
- **Logs anonimizados** sem informações pessoais
- **Backup não requerido** por ser ambiente de teste

## 📞 Contatos e Suporte

### Equipe Responsável
- **DevOps**: Configuração e manutenção da infraestrutura
- **QA**: Validação de qualidade e testes
- **Security**: Revisão de segurança e compliance
- **Product**: Aprovação de funcionalidades

### Canais de Comunicação
- **Telegram**: Notificações automáticas de deploy
- **GitHub**: Issues para bugs e melhorias
- **Email**: Alertas críticos apenas

### Escalação
1. **Nível 1**: Auto-recovery automático
2. **Nível 2**: Alertas para equipe de desenvolvimento
3. **Nível 3**: Escalação para DevOps/SRE
4. **Nível 4**: Incidente crítico - equipe completa

---

📝 **Documentação mantida pela equipe de desenvolvimento**  
🔄 **Última atualização**: Janeiro 2024  
📍 **Localização**: `/docs/HML-ENVIRONMENT-GUIDE.md`