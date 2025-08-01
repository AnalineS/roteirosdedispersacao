# 🎯 Roteiro de Dispensação - Google Workspace Setup

## 📋 Arquitetura Proposta

### **Frontend: Google Sites**
- Interface visual moderna e responsiva
- Formulários integrados
- Componentes HTML customizados
- CSS/JavaScript embarcado

### **Backend: Google Apps Script**
- Processamento de dados
- APIs para chatbot
- Integração com Google Sheets
- Webhooks e triggers

### **Banco de Dados: Google Sheets**
- Armazenamento estruturado
- Controle de versão automático
- Fácil manutenção dos dados
- APIs nativas de acesso

## 🗂️ Nova Estrutura de Arquivos

```
google-workspace/
├── sites/
│   ├── index.html              # Página principal
│   ├── chat.html              # Interface do chatbot
│   ├── sobre.html             # Página sobre
│   └── assets/
│       ├── style.css          # Estilos customizados
│       ├── script.js          # JavaScript principal
│       └── chatbot.js         # Lógica do chatbot
├── apps-script/
│   ├── Code.gs               # Código principal
│   ├── ChatBot.gs            # Sistema de chatbot
│   ├── Database.gs           # Acesso ao Google Sheets
│   ├── Utils.gs              # Funções utilitárias
│   └── Config.gs             # Configurações
├── data/
│   ├── conhecimento-base.json # Base de conhecimento estruturada
│   ├── personas.json         # Definição das personas
│   └── faqs.json            # Perguntas frequentes
└── sheets/
    ├── template-conversas.xlsx # Template para Google Sheets
    └── template-dados.xlsx    # Template para dados estruturados
```

## 🚀 Passos de Implementação

### 1. **Preparar Google Workspace**
- [ ] Criar conta Google Workspace (ou usar Gmail)
- [ ] Ativar Google Sites
- [ ] Ativar Google Apps Script
- [ ] Criar Google Sheets para dados

### 2. **Desenvolver Backend (Apps Script)**
- [ ] Sistema de chatbot com personas
- [ ] Integração com base de conhecimento
- [ ] APIs REST para frontend
- [ ] Sistema de logs e analytics

### 3. **Criar Frontend (Google Sites)**
- [ ] Design responsivo moderno
- [ ] Interface de chat interativa
- [ ] Páginas informativas
- [ ] Integração com Apps Script

### 4. **Configurar Dados**
- [ ] Migrar base de conhecimento para Sheets
- [ ] Configurar personas no sistema
- [ ] Implementar sistema de cache

### 5. **Deploy e Testes**
- [ ] Publicar Apps Script como Web App
- [ ] Configurar Google Sites
- [ ] Testes de integração
- [ ] Otimização de performance

## 💡 Funcionalidades Disponíveis

### **Chatbot Inteligente**
- ✅ Duas personas (Dr. Gasnelio e Gá)
- ✅ Processamento de linguagem natural
- ✅ Base de conhecimento sobre hanseníase
- ✅ Respostas contextualizadas

### **Interface Moderna**
- ✅ Design responsivo
- ✅ Chat em tempo real
- ✅ Histórico de conversas
- ✅ Feedback de usuários

### **Administração**
- ✅ Painel de controle no Google Sheets
- ✅ Analytics de uso
- ✅ Logs de conversas
- ✅ Atualizações da base de conhecimento

## 🔧 Tecnologias Utilizadas

- **Frontend:** HTML5, CSS3, JavaScript ES6+
- **Backend:** Google Apps Script (JavaScript)
- **Database:** Google Sheets API
- **Hosting:** Google Sites
- **APIs:** Google Workspace APIs

## 📈 Vantagens desta Abordagem

1. **Custo Zero:** Hospedagem gratuita completa
2. **Escalabilidade:** Suporta milhares de usuários
3. **Manutenção:** Interface visual para updates
4. **Segurança:** Infraestrutura do Google
5. **Integração:** Ecosystem Google completo
6. **Backup:** Versionamento automático