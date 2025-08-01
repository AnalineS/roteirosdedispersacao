# 🏗️ ESTRUTURA REORGANIZADA DO PROJETO
## Roteiro de Dispensação - Hanseníase (Google Workspace)

---

## 📁 **NOVA ESTRUTURA LIMPA E FUNCIONAL**

```
roteiro-dispensacao-google/
├── 📂 backend/                          # Google Apps Script Backend
│   ├── 📂 gas-webapp/                   # Web App principal
│   │   ├── Code.gs                      # Código principal do GAS
│   │   ├── appsscript.json             # Configurações do projeto
│   │   └── README_SETUP.md             # Instruções de setup
│   ├── .env.example                    # Exemplo de variáveis ambiente
│   └── MIGRATION_GUIDE.md              # Guia completo de migração
│
├── 📂 frontend/                         # React Application
│   ├── 📂 public/                      # Assets públicos
│   │   ├── manifest.json               # PWA manifest
│   │   └── sw.js                       # Service Worker
│   ├── 📂 src/                         # Código fonte React
│   │   ├── 📂 components/              # Componentes reutilizáveis
│   │   │   ├── ChatInput/
│   │   │   ├── ChatMessage/
│   │   │   ├── PersonaSelector/
│   │   │   └── ...
│   │   ├── 📂 hooks/                   # React hooks customizados
│   │   │   ├── useChat.tsx
│   │   │   └── useTheme.tsx
│   │   ├── 📂 pages/                   # Páginas da aplicação
│   │   │   ├── HomePage/
│   │   │   ├── ChatPage/
│   │   │   └── ...
│   │   ├── 📂 services/                # APIs e integrações
│   │   │   └── api.ts                  # API adaptada para GAS
│   │   ├── 📂 types/                   # TypeScript types
│   │   │   └── index.ts
│   │   └── main.tsx                    # Entry point
│   ├── package.json                    # Dependências React
│   ├── vite.config.ts                  # Configuração Vite
│   ├── tailwind.config.js              # Configuração Tailwind
│   └── .env.example                    # Exemplo env frontend
│
├── 📂 data/                            # Base de conhecimento
│   ├── 📂 structured/                  # Dados estruturados JSON
│   │   ├── clinical_taxonomy.json
│   │   ├── dispensing_workflow.json
│   │   ├── dosing_protocols.json
│   │   ├── hanseniase_catalog.json
│   │   └── ...
│   └── 📂 documents/                   # Documentos fonte
│       ├── Roteiro de Dsispensação - Hanseníase.md
│       ├── Roteiro de Dsispensação - Hanseníase.pdf
│       └── roteiro_hanseniase_basico.md
│
├── 📂 backup_pythonanywhere/           # Backup arquivos antigos
│   ├── app_flask.py
│   ├── wsgi*.py
│   ├── requirements*.txt
│   └── ...
│
├── 📂 docs/                            # Documentação
│   ├── ROADMAP_MIGRACAO.md            # Roadmap do Product Manager
│   ├── API_DOCUMENTATION.md           # Documentação da API
│   └── USER_GUIDE.md                  # Guia do usuário
│
├── README.md                           # Documentação principal
├── CHANGELOG.md                        # Histórico de mudanças
└── .gitignore                         # Arquivos ignorados pelo git
```

---

## 🎯 **ARQUIVOS POR FUNÇÃO**

### **🚀 CORE DO SISTEMA (Alta Prioridade)**
```
backend/gas-webapp/Code.gs              # ⭐ Backend principal
frontend/src/services/api.ts            # ⭐ Cliente API
frontend/src/components/ChatInput/      # ⭐ Interface chat
frontend/src/hooks/useChat.tsx          # ⭐ Lógica do chat
data/structured/                        # ⭐ Base conhecimento
```

### **🔧 CONFIGURAÇÃO E SETUP**
```
backend/gas-webapp/README_SETUP.md      # Instruções Google Apps Script
backend/MIGRATION_GUIDE.md             # Guia migração completa
frontend/.env.example                   # Configuração frontend
backend/.env.example                    # Configuração backend
```

### **🎨 INTERFACE E UX**
```
frontend/src/components/                # Todos os componentes React
frontend/src/pages/                     # Páginas da aplicação
frontend/src/styles/                    # Estilos globais
frontend/public/                        # Assets e PWA
```

### **📚 DOCUMENTAÇÃO E DADOS**
```
docs/                                   # Documentação técnica
data/                                   # Base de conhecimento
backup_pythonanywhere/                  # Arquivos antigos (backup)
```

---

## 🔄 **MAPEAMENTO: ANTES → DEPOIS**

| **Arquivo Antigo (Flask)** | **Arquivo Novo (Google Workspace)** | **Status** |
|----------------------------|-------------------------------------|------------|
| `app_flask.py` | `backend/gas-webapp/Code.gs` | ✅ Migrado |
| `src/backend/core/personas/` | Integrado no `Code.gs` | ✅ Migrado |
| `src/backend/services/` | Integrado no `Code.gs` | ✅ Migrado |
| `src/frontend/` | `frontend/` (adaptado) | ✅ Migrado |
| `requirements.txt` | `package.json` | ✅ Migrado |
| `wsgi.py` | `appsscript.json` | ✅ Migrado |
| `data/structured/` | `data/structured/` | ✅ Mantido |
| Arquivos deploy PythonAnywhere | `backup_pythonanywhere/` | ✅ Backup |

---

## 🛠 **ARQUIVOS PARA HUMANOS**

### **📖 Para Desenvolvedores**
- `README.md` - Visão geral do projeto
- `backend/gas-webapp/README_SETUP.md` - Como configurar GAS
- `backend/MIGRATION_GUIDE.md` - Guia completo de migração
- `docs/API_DOCUMENTATION.md` - Documentação da API

### **👥 Para Usuários Finais**
- `docs/USER_GUIDE.md` - Como usar o sistema
- Interface React intuitiva e responsiva
- Mensagens de erro amigáveis
- Tooltips e ajuda contextual

### **🤖 Para IA (Claude e outros)**
- Estrutura de diretórios clara e lógica
- Nomes de arquivos descritivos
- Comentários detalhados no código
- Separação clara de responsabilidades
- Tipos TypeScript bem definidos

---

## 🎯 **PONTOS DE ENTRADA**

### **👨‍💻 Para Desenvolvedores**
1. **Inicio**: `README.md`
2. **Setup Backend**: `backend/gas-webapp/README_SETUP.md`
3. **Código Principal**: `backend/gas-webapp/Code.gs`
4. **Frontend**: `frontend/src/main.tsx`

### **🤖 Para IA**
1. **Entender sistema**: `backend/gas-webapp/Code.gs`
2. **Ver tipos**: `frontend/src/types/index.ts`
3. **API client**: `frontend/src/services/api.ts`
4. **Dados estruturados**: `data/structured/`

### **📱 Para Usuários**
1. **Interface principal**: URL do frontend hospedado
2. **Guia de uso**: `docs/USER_GUIDE.md`
3. **FAQ**: Integrado na interface

---

## ✅ **BENEFÍCIOS DA NOVA ESTRUTURA**

### **🎯 Para Desenvolvimento**
- ✅ Separação clara backend/frontend
- ✅ Configuração simplificada
- ✅ Dependências mínimas
- ✅ Deploy automatizado
- ✅ Custo zero

### **🔍 Para Manutenção**
- ✅ Arquivos organizados por função
- ✅ Documentação centralizada
- ✅ Backup preservado
- ✅ Versionamento claro
- ✅ Logs centralizados

### **🚀 Para Escala**
- ✅ Componentes modulares
- ✅ APIs bem definidas
- ✅ Cache inteligente
- ✅ Rate limiting configurável
- ✅ Monitoramento integrado

---

## 🎉 **STATUS FINAL**

✅ **MIGRAÇÃO COMPLETA**
- Backend: Google Apps Script (100% funcional)
- Frontend: React moderno (interface completa)
- Personas: Dr. Gasnelio + Gá (preservadas)
- Dados: Base de conhecimento mantida
- Custo: **R$ 0,00/mês** (era R$ 200/mês)

**🚀 Sistema pronto para produção!**