# 🏥 Roteiro de Dispensação - Hanseníase

Sistema moderno de apoio à dispensação farmacêutica para hanseníase, desenvolvido com tecnologias de ponta e IA.

## 🚀 Tecnologias

### Frontend
- **React 18** + **TypeScript**
- **Vite** para build otimizado
- **TailwindCSS** para estilização
- **PWA** com Service Worker
- **React Query** para gerenciamento de estado

### Backend
- **Flask 3.0** + **Python**
- **OpenAI API** para IA conversacional
- **Sistema RAG** avançado
- **Redis** para cache
- **Pydantic** para validação

## 📁 Estrutura do Projeto

```
├── src/
│   ├── frontend/          # React App moderna
│   │   ├── src/
│   │   │   ├── components/    # Componentes React
│   │   │   ├── pages/         # Páginas da aplicação
│   │   │   ├── hooks/         # Hooks customizados
│   │   │   ├── services/      # APIs e serviços
│   │   │   └── styles/        # Estilos CSS
│   │   └── public/        # Assets estáticos
│   └── backend/           # API Flask avançada
│       ├── core/          # Funcionalidades principais
│       ├── services/      # Serviços de negócio
│       └── config/        # Configurações
├── data/                  # Base de conhecimento
├── docs/                  # Documentação
└── firebase.json          # Configuração de deploy
```

## 🛠️ Desenvolvimento

### Frontend
```bash
cd src/frontend
npm install
npm run dev          # Desenvolvimento
npm run build        # Build para produção
npm run type-check   # Verificação de tipos
npm run lint         # Linting
```

### Backend
```bash
cd src/backend
pip install -r requirements.txt
python main.py       # Servidor desenvolvimento
```

## 🚀 Deploy

### Firebase Hosting (Frontend)
```bash
cd src/frontend
npm run build
firebase deploy
```

### Cloud Run (Backend)
```bash
cd src/backend
docker build -t roteiro-backend .
# Deploy via Google Cloud Console
```

## 🔒 Segurança

- **CSP Headers** configurados
- **Rate Limiting** implementado
- **Input Validation** com Pydantic
- **CORS** configurado adequadamente
- Ver `POLITICAS_SEGURANCA_GLOBAL.md` para detalhes

## 📋 Features

- ✅ Chat IA com personas especializadas
- ✅ Sistema educacional interativo
- ✅ Timeline de medicamentos
- ✅ Componentes acessíveis
- ✅ PWA completo
- ✅ Sistema RAG avançado
- ✅ Cache inteligente
- ✅ Monitoramento de performance

## 👥 Personas Disponíveis

- **Dr. Gasnelio** - Farmacêutico técnico especialista
- **Gá** - Assistente empático e acolhedor

## 🌐 URLs

- **Produção**: https://roteirosdedispensacao.com/
- **API**: Configurável via variáveis de ambiente

## 📚 Baseado em Pesquisa Científica

Sistema desenvolvido com base em tese de doutorado sobre roteiro de dispensação farmacêutica para hanseníase, seguindo protocolos do PCDT Hanseníase 2022 do Ministério da Saúde.

## 📝 Licença

Projeto educacional para apoio à dispensação farmacêutica.