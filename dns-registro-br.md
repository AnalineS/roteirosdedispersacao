# 🌐 Configuração DNS - Registro.br

## 📋 GUIA COMPLETO PARA REGISTRO.BR

### **1️⃣ COMPRAR DOMÍNIO NO REGISTRO.BR**

1. Acesse: https://registro.br
2. Pesquise: `roteirosdispensacao.com.br`
3. Faça login/cadastro com CPF
4. Complete o pagamento (R$ 40/ano)
5. Aguarde aprovação (alguns minutos)

---

### **2️⃣ CONFIGURAR DNS NO REGISTRO.BR**

#### **Passo 1: Acessar Painel DNS**
1. Login em: https://registro.br
2. Menu → "Domínios" → Selecione seu domínio
3. Clique em "Editar DNS"

#### **Passo 2: Adicionar Registros DNS**

**COPIE E COLE EXATAMENTE ESTES VALORES:**

```
Tipo    Nome/Host    Valor/Destino                           TTL
----    ---------    ------------------------------------    -----
A       @            151.101.1.195                          3600
A       @            151.101.65.195                         3600
CNAME   www          roteirosdispensacao.web.app            3600
```

#### **Passo 3: Para Backend API (Opcional)**
Se quiser subdomínio para API:

```
Tipo    Nome/Host    Valor/Destino                           TTL
----    ---------    ------------------------------------    -----
CNAME   api          roteiro-dispensacao-api-93670097797-uc.a.run.app    3600
```

---

### **3️⃣ CONECTAR DOMÍNIO NO FIREBASE**

Execute estes comandos após configurar DNS:

```bash
# 1. Navegue para o projeto
cd "C:\Users\Ana\Meu Drive\Site roteiro de dispensação"

# 2. Adicione o domínio personalizado
firebase hosting:sites:create roteirosdispensacao --project red-truck-468923-s4

# 3. Conecte o domínio comprado
firebase hosting:channel:domain:create roteirosdispensacao.com.br --project red-truck-468923-s4

# 4. Verifique o status
firebase hosting:channel:domain:status roteirosdispensacao.com.br --project red-truck-468923-s4
```

---

### **4️⃣ VERIFICAÇÃO E SSL**

#### **Timeline:**
- **DNS Propagation:** 1-24 horas (geralmente 2-4 horas)
- **Verificação Firebase:** Automática após DNS
- **SSL Certificate:** Automático após verificação
- **Site funcionando:** 2-24 horas total

#### **Como verificar se DNS propagou:**
```bash
# Windows PowerShell
nslookup roteirosdispensacao.com.br

# Deve retornar:
# 151.101.1.195
# 151.101.65.195
```

---

### **5️⃣ TROUBLESHOOTING**

#### **Problema: "Domain not verified"**
**Solução:** Aguarde propagação DNS (até 24h)

#### **Problema: "SSL Certificate pending"**
**Solução:** Normal, aguarde 1-2 horas após verificação

#### **Problema: Site não carrega**
**Solução:** 
1. Verifique DNS: `nslookup roteirosdispensacao.com.br`
2. Limpe cache navegador: Ctrl+F5
3. Teste modo incógnito

---

### **6️⃣ RESULTADO FINAL**

Após configuração completa:

✅ **URLs Funcionando:**
- https://roteirosdispensacao.com.br → Seu site principal
- https://www.roteirosdispensacao.com.br → Redirect automático
- https://api.roteirosdispensacao.com.br → Backend API (se configurado)

✅ **Recursos Automáticos:**
- SSL Certificate gratuito
- CDN Global Firebase
- HTTPS forçado
- Redirect www → apex

---

### **7️⃣ CONFIGURAÇÃO NO REGISTRO.BR (INTERFACE)**

**Visual do Painel DNS:**

```
┌─────────────────────────────────────────────────┐
│           DNS do domínio roteirosdispensacao.com.br         │
├─────────────────────────────────────────────────┤
│                                                 │
│  Tipo: [A    ▼]                               │
│  Nome: [@        ]                            │
│  Valor: [151.101.1.195    ]                   │
│  TTL: [3600    ]                              │
│  [+ Adicionar]                                 │
│                                                │
│  Tipo: [A    ▼]                               │
│  Nome: [@        ]                            │
│  Valor: [151.101.65.195   ]                   │
│  TTL: [3600    ]                              │
│  [+ Adicionar]                                 │
│                                                │
│  Tipo: [CNAME ▼]                              │
│  Nome: [www      ]                            │
│  Valor: [roteirosdispensacao.web.app]         │
│  TTL: [3600    ]                              │
│  [+ Adicionar]                                 │
│                                                │
│         [Salvar Alterações]                    │
└─────────────────────────────────────────────────┘
```

---

### **8️⃣ COMANDOS FIREBASE APÓS DNS**

```bash
# Deploy para o novo site customizado
firebase deploy --only hosting:custom --project red-truck-468923-s4

# Verificar sites ativos
firebase hosting:sites:list --project red-truck-468923-s4

# Ver status do domínio
firebase hosting:channel:list --project red-truck-468923-s4
```

---

## 💰 **RESUMO DE CUSTOS**

```
Domínio Registro.br: R$ 40/ano
Firebase Hosting: GRATUITO
SSL Certificate: GRATUITO
CDN: GRATUITO
APIs: GRATUITO (seus limites)
─────────────────────────
TOTAL: R$ 40/ano (R$ 3,33/mês)
```

---

## ⏰ **CHECKLIST RÁPIDO**

- [ ] Comprar domínio no Registro.br
- [ ] Configurar DNS (A records + CNAME)
- [ ] Executar comandos Firebase
- [ ] Aguardar propagação DNS (2-24h)
- [ ] Verificar SSL certificate
- [ ] Testar site funcionando

---

**📞 Suporte Registro.br:** suporte@registro.br | (11) 5509-3511