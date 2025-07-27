# 🏥 Backend - Sistema PQT-U

## 📁 Estrutura Organizada

### Arquivo Principal
- **`main.py`** - Backend principal para produção e desenvolvimento
  - Usar este arquivo para execução normal
  - Contém todas as funcionalidades integradas

### Pasta Development
- **`development/app_simplified.py`** - Versão simplificada para testes básicos
  - Mock de respostas para testes de integração rápidos
  - Não contém validação científica real
  
- **`development/app_enhanced.py`** - Versão aprimorada para validação científica
  - Sistema completo de detecção de escopo
  - Base de conhecimento científica da tese
  - Usado nos testes científicos rigorosos

## 🚀 Como Usar

### Desenvolvimento Normal
```bash
cd src/backend
python main.py
```

### Testes com Backend Simplificado
```bash
cd src/backend/development
python app_simplified.py
```

### Validação Científica
```bash
cd src/backend/development
python app_enhanced.py
```

## 📊 Endpoints Disponíveis

Todos os backends implementam os mesmos endpoints:
- `GET /api/health` - Status do sistema
- `POST /api/chat` - Chat com personas
- `POST /api/scope` - Verificação de escopo
- `GET /api/personas` - Informações das personas
- `POST /api/feedback` - Sistema de feedback

## ⚠️ Importante

- **Para desenvolvimento:** Use `main.py`
- **Para testes:** Use arquivos em `development/`
- **Para produção:** Sempre usar `main.py`