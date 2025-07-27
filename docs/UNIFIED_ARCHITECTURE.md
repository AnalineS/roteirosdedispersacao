# 🏗️ ARQUITETURA UNIFICADA - UMA URL NO RENDER

## ✅ **BENEFÍCIOS DA UNIFICAÇÃO**

### 💰 **Custo e Simplicidade**
- **1 serviço** ao invés de 2 no Render
- **1 URL** para gerenciar: `https://roteiro-dispensacao.onrender.com`
- **1 build** e 1 deploy
- **1 conjunto** de logs para monitorar

### 🚀 **Performance**
- **Sem CORS**: Frontend e API no mesmo domínio
- **Latência reduzida**: Sem calls entre serviços externos
- **Menos overhead**: Um processo ao invés de dois

### 🔧 **Manutenção**
- **Configuração única** no render.yaml
- **Variáveis centralizadas** 
- **Deploy atômico**: Tudo sobe junto ou nada sobe

## 🏗️ **ARQUITETURA IMPLEMENTADA**

```
┌─────────────────────────────────────────┐
│         RENDER.COM (1 URL)              │
├─────────────────────────────────────────┤
│  roteiro-dispensacao.onrender.com      │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │      app_unified.py             │    │
│  │                                 │    │
│  │  ┌──────────┐  ┌──────────┐    │    │
│  │  │ Flask    │  │Streamlit │    │    │
│  │  │ API      │  │Frontend  │    │    │
│  │  │:10000    │  │:10001    │    │    │
│  │  └──────────┘  └──────────┘    │    │
│  │         │           │          │    │
│  │         └───────────┘          │    │
│  │      Proxy Reverso             │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

## 🔀 **ROTEAMENTO**

### 📍 **Rotas Principais**
```bash
# Frontend Streamlit (padrão)
GET / → Streamlit Interface

# API Endpoints  
POST /api/chat → Flask API
GET /api/health → Flask API
GET /api/personas → Flask API

# Health Check Unificado
GET /health → Status de ambos serviços
```

### 🔄 **Proxy Reverso Interno**
O `app_unified.py` funciona como proxy:
- **Porta 10000**: Proxy principal (Render)
- **Porta 10001**: Flask API (interno)
- **Porta 10002**: Streamlit (interno)

## 📦 **CONFIGURAÇÃO RENDER.YAML**

```yaml
services:
  - type: web
    name: roteiro-dispensacao        # ← 1 serviço apenas
    buildCommand: pip install -r requirements.txt
    startCommand: python app_unified.py  # ← Script unificado
    healthCheckPath: /health         # ← Health check único
```

## 🔧 **COMO FUNCIONA**

### 1. **Inicialização**
```python
# app_unified.py coordena tudo:
1. Inicia Flask API (porta interna)
2. Inicia Streamlit (porta interna) 
3. Configura proxy reverso
4. Expõe na porta do Render
```

### 2. **Requisições**
```bash
# Usuário acessa streamlit
GET roteiro-dispensacao.onrender.com
→ Proxy redireciona para Streamlit interno

# Frontend faz call para API
POST /api/chat 
→ Proxy redireciona para Flask interno
→ Sem CORS, mesma origem!
```

### 3. **Health Check**
```json
GET /health retorna:
{
  "status": "healthy",
  "services": {
    "flask_api": "healthy",
    "streamlit_frontend": "healthy" 
  },
  "ports": {
    "main": 10000,
    "flask": 10001, 
    "streamlit": 10002
  }
}
```

## 🚦 **MONITORAMENTO**

### ✅ **Vantagens**
- **1 health check** monitora tudo
- **Logs unificados** no Render
- **Métricas centralizadas**

### 📊 **Status dos Serviços**
```bash
# Verificar se tudo está funcionando
curl https://roteiro-dispensacao.onrender.com/health

# Testar API diretamente  
curl https://roteiro-dispensacao.onrender.com/api/health

# Acessar interface
open https://roteiro-dispensacao.onrender.com
```

## 🔄 **MIGRAÇÃO**

### ❌ **Arquitetura Antiga**
```
roteiro-dispensacao-backend.onrender.com  (Flask)
roteiro-dispensacao-frontend.onrender.com (Streamlit)
↓ Problemas: CORS, 2 URLs, 2 deploys
```

### ✅ **Arquitetura Nova**  
```
roteiro-dispensacao.onrender.com (Unificado)
↓ Solução: 1 URL, sem CORS, deploy atômico
```

## 🛠️ **DESENVOLVIMENTO LOCAL**

```bash
# Testar localmente
python app_unified.py

# Verificar saúde
curl http://localhost:10000/health

# Acessar interface
open http://localhost:10000
```

## 🔒 **SEGURANÇA**

- **Comunicação interna**: Flask ↔ Streamlit via localhost
- **Proxy seguro**: Apenas porta principal exposta
- **Headers unificados**: CORS desnecessário
- **Rate limiting**: Centralizado no proxy