# 🌐 Configuração de Domínio Personalizado

Configuração completa para usar `roteirosdispensacao.com.br` com Google Cloud Run.

## 📋 Arquitetura de Domínios

### 🏭 Produção
- **Frontend**: `https://roteirosdispensacao.com.br`
- **API**: `https://api.roteirosdispensacao.com.br`

### 🧪 Homologação (HML)
- **Frontend**: `https://hml.roteirosdispensacao.com.br`
- **API**: `https://hml-api.roteirosdispensacao.com.br`

## 🚀 Execução do Setup

### 1. Executar Script de Configuração
```bash
# Dar permissão de execução
chmod +x scripts/setup-domain-mapping.sh

# Executar configuração
./scripts/setup-domain-mapping.sh
```

### 2. Configurar DNS no Provedor
O script mostrará os registros CNAME necessários:

```dns
# Registros CNAME para configurar:
roteirosdispensacao.com.br          → ghs.googlehosted.com
api.roteirosdispensacao.com.br      → ghs.googlehosted.com
hml.roteirosdispensacao.com.br      → ghs.googlehosted.com
hml-api.roteirosdispensacao.com.br  → ghs.googlehosted.com
```

### 3. Aguardar Propagação
- **DNS**: 2-48 horas
- **SSL**: Automático após DNS propagado

## 🔧 Variáveis de Ambiente GitHub

Configure no GitHub → Settings → Secrets and variables → Actions:

### Variables (Produção)
```yaml
NEXT_PUBLIC_API_URL_PRODUCTION: "https://api.roteirosdispensacao.com.br"
PRODUCTION_FRONTEND_DOMAIN: "roteirosdispensacao.com.br"
PRODUCTION_API_DOMAIN: "api.roteirosdispensacao.com.br"
```

### Variables (HML)
```yaml
NEXT_PUBLIC_API_URL_STAGING: "https://hml-api.roteirosdispensacao.com.br"
HML_FRONTEND_DOMAIN: "hml.roteirosdispensacao.com.br"
HML_API_DOMAIN: "hml-api.roteirosdispensacao.com.br"
```

## 🔒 Segurança SSL/HTTPS

### Certificados Automáticos
- **Provedor**: Google-managed SSL certificates
- **Renovação**: Automática
- **Validação**: Domain validation via DNS

### Headers de Segurança
Configurados no Cloud Run:
```yaml
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Strict-Transport-Security: max-age=31536000
Referrer-Policy: strict-origin-when-cross-origin
```

## 📊 Monitoramento

### Health Checks
- **Frontend**: `GET /api/health`
- **Backend**: `GET /health`

### URLs de Teste
```bash
# Produção
curl -I https://roteirosdispensacao.com.br/api/health
curl -I https://api.roteirosdispensacao.com.br/health

# HML
curl -I https://hml.roteirosdispensacao.com.br/api/health
curl -I https://hml-api.roteirosdispensacao.com.br/health
```

## 🛠️ Troubleshooting

### Problema: SSL Pendente
```bash
# Verificar status
gcloud run domain-mappings list --region=us-central1

# Forçar renovação SSL
gcloud run domain-mappings update DOMAIN --region=us-central1
```

### Problema: DNS não resolve
```bash
# Verificar propagação DNS
nslookup roteirosdispensacao.com.br
dig roteirosdispensacao.com.br CNAME

# Testar de diferentes locais
curl -I https://dnschecker.org
```

### Problema: 502/503 Errors
```bash
# Verificar logs Cloud Run
gcloud logging read "resource.type=cloud_run_revision" --limit=50

# Verificar status do serviço
gcloud run services describe SERVICE_NAME --region=us-central1
```

## 📝 Próximos Passos

1. ✅ **Script criado**: `scripts/setup-domain-mapping.sh`
2. ⏳ **Execute script**: Configure mapeamentos
3. ⏳ **Configure DNS**: Adicione registros CNAME
4. ⏳ **Atualize workflows**: Use novos domínios
5. ⏳ **Teste endpoints**: Valide funcionamento

## 🔗 Links Úteis

- [Google Cloud Run Custom Domains](https://cloud.google.com/run/docs/mapping-custom-domains)
- [SSL Certificate Management](https://cloud.google.com/run/docs/using-custom-domains#ssl)
- [DNS Configuration Guide](https://cloud.google.com/dns/docs/overview)