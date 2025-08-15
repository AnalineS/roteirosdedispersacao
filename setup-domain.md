# 🌐 Setup Domínio Personalizado - Roteiros de Dispensação

## 📋 GUIA PASSO A PASSO

### **1. COMPRAR DOMÍNIO**

#### 🥇 **Opção Recomendada: Registro.br**
1. Acesse: https://registro.br
2. Busque: `roteirosdispensacao.com.br`
3. Complete cadastro CPF/CNPJ
4. Pague: ~R$ 40/ano

#### 🥈 **Alternativa: Cloudflare**
1. Acesse: https://www.cloudflare.com/products/registrar/
2. Busque: `roteirosdispensacao.com` 
3. Complete cadastro
4. Pague: ~R$ 45/ano

---

### **2. CONFIGURAR NO FIREBASE**

```bash
# Adicionar domínio ao Firebase (execute após comprar)
firebase hosting:sites:create roteirosdispensacao --project red-truck-468923-s4

# Conectar domínio personalizado
firebase hosting:channel:deploy live --project red-truck-468923-s4 --site roteirosdispensacao
```

---

### **3. CONFIGURAR DNS**

#### **Se comprou no Registro.br:**
```
Tipo    Nome                    Valor
A       @                       151.101.1.195
A       @                       151.101.65.195  
CNAME   www                     red-truck-468923-s4.web.app
```

#### **Se comprou no Cloudflare:**
```
Tipo    Nome                    Valor
A       @                       151.101.1.195
A       @                       151.101.65.195
CNAME   www                     red-truck-468923-s4.web.app
```

---

### **4. COMANDOS FIREBASE (EXECUTAR APÓS DNS)**

```bash
# Navegar para projeto
cd "C:\Users\Ana\Meu Drive\Site roteiro de dispensação"

# Conectar domínio personalizado
firebase hosting:sites:domain:add roteirosdispensacao.com.br --site red-truck-468923-s4

# Verificar status
firebase hosting:sites:list --project red-truck-468923-s4
```

---

### **5. RESULTADO FINAL**

✅ **URLs Finais:**
- https://roteirosdispensacao.com.br → Seu site
- https://www.roteirosdispensacao.com.br → Redirect automático
- https://red-truck-468923-s4.web.app → Backup (continuará funcionando)

✅ **Recursos Automáticos:**
- SSL Certificate (gratuito)
- CDN Global (gratuito) 
- Redirect www → apex (automático)
- HTTPS enforced (automático)

---

### **6. BACKEND API (OPCIONAL)**

Se quiser domínio para backend também:

```bash
# Mapear API para subdomínio
gcloud run domain-mappings create \
  --service roteiro-dispensacao-api \
  --domain api.roteirosdispensacao.com.br \
  --region us-central1 \
  --project red-truck-468923-s4
```

**Resultado:** 
- Frontend: https://roteirosdispensacao.com.br
- Backend: https://api.roteirosdispensacao.com.br

---

## ⏱️ **TIMELINE**

- **Compra domínio:** 5-10 minutos
- **DNS propagation:** 1-24 horas  
- **SSL certificate:** Automático após DNS
- **Site funcionando:** 1-24 horas após DNS

---

## 💰 **CUSTO TOTAL**

```
Domínio: R$ 40-45/ano
Firebase Hosting: GRATUITO
SSL Certificate: GRATUITO  
CDN Global: GRATUITO
Setup: GRATUITO

TOTAL: R$ 40-45/ano (R$ 3-4/mês)
```

---

**🎯 Qual domínio você quer comprar?**
1. roteirosdispensacao.com.br (recomendado)
2. roteirosdispensacao.com  
3. Outro nome?