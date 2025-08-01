# 🚀 GUIA COMPLETO DE DEPLOY - Google Cloud
## roteirosdedispensacao.com

---

## 📋 **PRÉ-REQUISITOS**

### ✅ **O que você precisa ter:**
1. **Conta Google Cloud** (gratuita - $300 créditos)
2. **Domínio roteirosdedispensacao.com** registrado
3. **Google Cloud CLI** instalado
4. **Acesso admin** ao DNS do domínio

---

## 🏗️ **ARQUITETURA FINAL**

```
Internet → Cloud DNS → Load Balancer → Cloud Storage (Frontend)
                    ↓
                Google Apps Script (Backend)
```

**Benefícios:**
- ✅ **Performance**: CDN global automático
- ✅ **Segurança**: SSL automático + Headers segurança
- ✅ **Escalabilidade**: Suporta milhões de usuários
- ✅ **Custo**: ~R$ 5-15/mês para tráfego moderado
- ✅ **Confiabilidade**: 99.9% uptime SLA

---

## 🚀 **PASSO A PASSO COMPLETO**

### **FASE 1: SETUP INICIAL (20 minutos)**

#### 1.1 Instalar Google Cloud CLI
```bash
# Windows (PowerShell como admin)
Invoke-WebRequest -Uri https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/google-cloud-cli-455.0.0-windows-x86_64.msi -OutFile GoogleCloudSDK.msi
Start-Process msiexec.exe -Wait -ArgumentList '/I GoogleCloudSDK.msi /quiet'

# Reiniciar terminal e testar
gcloud --version
```

#### 1.2 Autenticar e Configurar
```bash
# Login no Google Cloud
gcloud auth login

# Criar projeto
gcloud projects create roteiro-dispensacao-hanseniase --name="Roteiros de Dispensação"

# Configurar projeto ativo
gcloud config set project roteiro-dispensacao-hanseniase

# Habilitar APIs necessárias
gcloud services enable compute.googleapis.com
gcloud services enable storage.googleapis.com
gcloud services enable dns.googleapis.com
```

### **FASE 2: DEPLOY DO FRONTEND (15 minutos)**

#### 2.1 Executar Script de Deploy
```bash
# Navegar para a pasta do projeto
cd "C:\Users\Ana\Meu Drive\Site roteiro de dispensação"

# Executar script de deploy
bash deploy-google-cloud.sh
```

#### 2.2 Verificar Deploy
```bash
# Listar arquivos no bucket
gsutil ls gs://roteirosdedispensacao-com

# Testar acesso direto ao bucket
curl -I https://storage.googleapis.com/roteirosdedispensacao-com/index.html
```

### **FASE 3: CONFIGURAÇÃO DO DOMÍNIO (30 minutos)**

#### 3.1 Verificar Propriedade do Domínio
1. **Acesse**: https://search.google.com/search-console
2. **Adicione propriedade**: `roteirosdedispensacao.com`
3. **Método de verificação**: Registro DNS TXT
4. **Adicione o TXT record** fornecido pelo Search Console

#### 3.2 Configurar DNS
Após executar o script, configure no seu provedor de DNS:

```dns
# Registro A (Principal)
Tipo: A
Nome: @
Valor: [IP_DO_LOAD_BALANCER]
TTL: 300

# Registro CNAME (www)
Tipo: CNAME
Nome: www
Valor: roteirosdedispensacao.com
TTL: 300
```

### **FASE 4: VERIFICAÇÃO E TESTES (10 minutos)**

#### 4.1 Verificar SSL
```bash
# Aguardar provisionamento do SSL (10-60 min)
gcloud compute ssl-certificates describe roteirosdedispensacao-com-ssl --global

# Verificar status: ACTIVE = funcionando
```

#### 4.2 Testar Site
```bash
# Testar HTTPS
curl -I https://roteirosdedispensacao.com

# Testar redirect www
curl -I https://www.roteirosdedispensacao.com
```

---

## ⚡ **DEPLOY RÁPIDO (ALTERNATIVO)**

Se preferir deploy mais simples via **Firebase Hosting**:

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Inicializar projeto
firebase init hosting

# Deploy
firebase deploy
```

**Vantagens Firebase:**
- ✅ Setup em 5 minutos
- ✅ SSL automático
- ✅ CDN global
- ✅ Domínio personalizado fácil
- ✅ Custo quase zero

---

## 🔧 **CONFIGURAÇÕES AVANÇADAS**

### Headers de Segurança
```bash
# CSP para integração com Apps Script
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://script.google.com; connect-src 'self' https://script.google.com https://script.googleusercontent.com

# Outros headers importantes
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```

### Cache Otimizado
```bash
# Assets estáticos (1 ano)
gsutil -m setmeta -h "Cache-Control:public, max-age=31536000, immutable" gs://roteirosdedispensacao-com/assets/**

# HTML (sem cache)
gsutil -m setmeta -h "Cache-Control:no-cache, must-revalidate" gs://roteirosdedispensacao-com/*.html

# Service Worker (sem cache)
gsutil -m setmeta -h "Cache-Control:no-cache" gs://roteirosdedispensacao-com/sw.js
```

---

## 📊 **MONITORAMENTO**

### Google Analytics 4
Adicionar no `index.html`:
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### Google Search Console
- Verificar indexação
- Monitorar Core Web Vitals
- Acompanhar erros 404
- Otimizar SEO

---

## 💰 **CUSTOS ESTIMADOS**

| Componente | Uso Mensal | Custo/Mês |
|------------|------------|-----------|
| **Cloud Storage** | 1GB | R$ 0,50 |
| **Cloud CDN** | 10GB transfer | R$ 2,00 |
| **Load Balancer** | 1 instância | R$ 8,00 |
| **DNS Queries** | 1M queries | R$ 1,00 |
| **SSL Certificate** | Managed | R$ 0,00 |
| **Total** | | **R$ 11,50/mês** |

**Para tráfego baixo (<1000 visitas/dia): ~R$ 5/mês**

---

## 🆘 **TROUBLESHOOTING**

### Problema: SSL não funcionando
```bash
# Verificar status do certificado
gcloud compute ssl-certificates describe roteirosdedispensacao-com-ssl --global

# Se status = PROVISIONING, aguardar 10-60 minutos
# Se status = FAILED, verificar se domínio aponta para IP correto
```

### Problema: Site não carrega
```bash
# Verificar IP do load balancer
gcloud compute addresses describe roteirosdedispensacao-com-ip --global

# Verificar DNS
nslookup roteirosdedispensacao.com

# Testar bucket diretamente
curl https://storage.googleapis.com/roteirosdedispensacao-com/index.html
```

### Problema: CORS Error
Configurar CORS no bucket:
```bash
# Criar cors.json
echo '[{"origin": ["*"], "method": ["GET", "POST"], "responseHeader": ["Content-Type"], "maxAgeSeconds": 3600}]' > cors.json

# Aplicar CORS
gsutil cors set cors.json gs://roteirosdedispensacao-com
```

---

## 🎉 **RESULTADO FINAL**

Após completar todos os passos:

✅ **Site funcionando**: https://roteirosdedispensacao.com  
✅ **SSL ativo**: Certificado automático do Google  
✅ **CDN global**: Performance otimizada mundialmente  
✅ **Backend integrado**: Google Apps Script funcionando  
✅ **PWA**: Funciona offline  
✅ **SEO otimizado**: Meta tags e sitemap  

**Arquitetura 100% Google, escalável e profissional!**

---

## 📞 **SUPORTE**

**Documentação:**
- [Google Cloud Storage](https://cloud.google.com/storage/docs)
- [Load Balancer](https://cloud.google.com/load-balancing/docs)
- [Cloud DNS](https://cloud.google.com/dns/docs)

**Contato:**
- Para dúvidas técnicas: Consultar documentação oficial
- Para problemas de billing: Google Cloud Support