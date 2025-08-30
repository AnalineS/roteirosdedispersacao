1# [START] GUIA COMPLETO DE DEPLOY - Firebase Hosting
## roteirosdedispensacao.com

---

## [OK] **STATUS ATUAL**

### **[OK] CONCLUÍDO:**
- [OK] Frontend React com esquema médico profissional
- [OK] Backend Google Apps Script funcionando
- [OK] Build de produção otimizado (523.57 KiB)
- [OK] PWA configurado com Service Worker
- [OK] Firebase CLI instalado e configurado
- [OK] Commits e push para Git realizados

### **📍 PRÓXIMO PASSO: Deploy Firebase**

---

## 🏗️ **ARQUITETURA FINAL**

```
roteirosdedispensacao.com
         v
   Firebase Hosting (CDN)
         v
    Frontend React <--> Google Apps Script
         v
   Service Worker (PWA)
```

**Benefícios:**
- [OK] **Gratuito**: 10GB storage + 10GB transfer/mês
- [OK] **CDN Global**: 200+ pontos de presença mundial
- [OK] **SSL Automático**: HTTPS sem configuração
- [OK] **Deploy Instantâneo**: 30 segundos para produção
- [OK] **Domínio Personalizado**: Fácil configuração
- [OK] **Rollback**: Voltar versões anteriores com 1 clique

---

## [START] **DEPLOY PASSO A PASSO**

### **PASSO 1: Autenticação Firebase (2 min)**

```bash
# Navegar para pasta do frontend
cd "C:\Users\Ana\Meu Drive\Site roteiro de dispensação\src\frontend"

# Login no Firebase
firebase login
```

**O que acontece:**
- Abre navegador para autenticação Google
- Selecione a conta Google desejada
- Autorize o Firebase CLI

### **PASSO 2: Configurar Projeto Firebase (3 min)**

```bash
# Listar projetos disponíveis
firebase projects:list

# Se não existir, criar projeto
firebase projects:create roteiros-de-dispensacao --display-name "Roteiros de Dispensação"

# Usar projeto
firebase use roteiros-de-dispensacao
```

### **PASSO 3: Deploy Inicial (1 min)**

```bash
# Deploy para Firebase Hosting
firebase deploy --only hosting
```

**Output esperado:**
```
✔ Deploy complete!

Project Console: https://console.firebase.google.com/project/roteiros-de-dispensacao/overview
Hosting URL: https://roteiros-de-dispensacao.web.app
```

### **PASSO 4: Configurar Domínio Personalizado (10 min)**

#### 4.1 Adicionar Domínio no Firebase Console
1. **Acesse**: https://console.firebase.google.com/project/roteiros-de-dispensacao/hosting
2. **Clique**: "Add custom domain"
3. **Digite**: `roteirosdedispensacao.com`
4. **Clique**: "Continue"

#### 4.2 Verificar Propriedade do Domínio
Firebase fornecerá um **TXT record** para adicionar no DNS:
```
Tipo: TXT
Nome: @
Valor: firebase-domain-verification=XXXXXXXXXXXXXXX
TTL: 300
```

#### 4.3 Configurar DNS
Adicione estes registros no seu provedor de DNS:

```dns
# Registro A (Principal) - IPs do Firebase
Tipo: A
Nome: @
Valor: 151.101.1.195
TTL: 300

Tipo: A  
Nome: @
Valor: 151.101.65.195
TTL: 300

# Registro CNAME (www)
Tipo: CNAME
Nome: www
Valor: roteiros-de-dispensacao.web.app
TTL: 300
```

### **PASSO 5: Verificar Deploy (2 min)**

```bash
# Testar site local
firebase serve --only hosting

# Testar site em produção
curl -I https://roteiros-de-dispensacao.web.app

# Verificar SSL
curl -I https://roteirosdedispensacao.com
```

---

## [FIX] **COMANDOS ÚTEIS**

### Deploy e Desenvolvimento
```bash
# Preview antes do deploy
firebase hosting:channel:deploy preview

# Deploy completo
firebase deploy

# Deploy apenas hosting
firebase deploy --only hosting

# Servidor local para testes
firebase serve --only hosting --port 5000

# Ver logs
firebase functions:log
```

### Gerenciamento de Versões
```bash
# Listar versões anteriores
firebase hosting:clone SOURCE_VERSION DESTINATION_SITE_ID

# Rollback para versão anterior
firebase hosting:rollback

# Ver histórico de deploys
firebase hosting:deployments
```

### Domínio e SSL
```bash
# Listar domínios configurados
firebase hosting:sites:list

# Verificar status do domínio
firebase hosting:sites:get roteirosdedispensacao.com
```

---

## [REPORT] **MONITORAMENTO E ANALYTICS**

### Google Analytics 4
Adicionar no `index.html` (já configurado):
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

### Performance Monitoring
```bash
# Instalar SDK de performance
npm install firebase

# Adicionar no app
import { getPerformance } from 'firebase/performance';
const perf = getPerformance(app);
```

---

## 💰 **CUSTOS FIREBASE**

### Plano Gratuito (Spark)
| Recurso | Limite Gratuito | Suficiente para |
|---------|-----------------|-----------------|
| **Storage** | 1 GB | 10.000+ páginas |
| **Transfer** | 10 GB/mês | 100.000 visitantes/mês |
| **SSL** | Gratuito | Ilimitado |
| **CDN** | Gratuito | Global |
| **Domínio personalizado** | Gratuito | 1 domínio |

### Plano Pago (Blaze) - Pay as you go
- **Storage**: $0.026/GB adicional
- **Transfer**: $0.15/GB adicional  
- **Custo típico**: R$ 0-20/mês para sites médios

---

## [AUTH] **SEGURANÇA E CONFIGURAÇÕES**

### Headers de Segurança (já configurados)
```json
{
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff", 
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline' https://script.google.com..."
}
```

### Cache Otimizado
```json
{
  "Assets (JS/CSS)": "1 ano (immutable)",
  "Service Worker": "no-cache",
  "HTML": "5 minutos",
  "Imagens": "1 ano"
}
```

### Redirects e Rewrites
```json
{
  "rewrites": [
    {
      "source": "**",
      "destination": "/index.html"
    }
  ]
}
```

---

## 🆘 **TROUBLESHOOTING**

### Problema: Deploy falha
```bash
# Verificar login
firebase login --reauth

# Verificar projeto
firebase use --add

# Build local primeiro
npm run build

# Deploy com debug
firebase deploy --debug
```

### Problema: Domínio não funciona
```bash
# Verificar DNS
nslookup roteirosdedispensacao.com

# Verificar configuração Firebase
firebase hosting:sites:get roteirosdedispensacao.com

# Aguardar propagação DNS (até 48h)
```

### Problema: SSL não ativa
```bash
# Verificar certificado
curl -I https://roteirosdedispensacao.com

# Forçar renovação SSL (automático no Firebase)
# Aguardar 24-48h para provisioning automático
```

---

## [TARGET] **PIPELINE DE DEPLOY AUTOMATIZADO**

### GitHub Actions (Opcional)
```yaml
# .github/workflows/firebase.yml
name: Deploy to Firebase
on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps: 
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          projectId: roteiros-de-dispensacao
```

---

## [OK] **CHECKLIST FINAL**

### Antes do Deploy
- [ ] Build local funciona (`npm run build`)
- [ ] Testes passando (`npm test`)
- [ ] Firebase CLI instalado
- [ ] Projeto Firebase criado
- [ ] Domínio registrado

### Durante o Deploy  
- [ ] `firebase login` realizado
- [ ] `firebase use roteiros-de-dispensacao`
- [ ] `firebase deploy --only hosting`
- [ ] URL temporária funcionando

### Após o Deploy
- [ ] Domínio personalizado configurado
- [ ] DNS apontando corretamente  
- [ ] SSL funcionando (HTTPS)
- [ ] Google Analytics configurado
- [ ] Performance testada
- [ ] PWA funcionando offline

---

## 🎉 **RESULTADO FINAL**

Após completar todos os passos:

[OK] **Site funcionando**: https://roteirosdedispensacao.com  
[OK] **SSL ativo**: Certificado automático do Firebase  
[OK] **CDN global**: Performance otimizada mundialmente  
[OK] **Backend integrado**: Google Apps Script funcionando  
[OK] **PWA**: Funciona offline  
[OK] **SEO otimizado**: Meta tags e sitemap  
[OK] **Custo**: R$ 0/mês (plano gratuito)  
[OK] **Deploy**: 30 segundos para atualizações  

**Sistema completo de dispensação farmacêutica em produção!**

---

## 📞 **SUPORTE**

**Documentação:**
- [Firebase Hosting](https://firebase.google.com/docs/hosting)
- [Custom Domain Setup](https://firebase.google.com/docs/hosting/custom-domain)
- [Performance Monitoring](https://firebase.google.com/docs/perf-mon)

**Comandos de Emergência:**
```bash
# Rollback imediato
firebase hosting:rollback

# Desligar site temporariamente
firebase hosting:disable

# Ver logs de erro
firebase hosting:debug
```