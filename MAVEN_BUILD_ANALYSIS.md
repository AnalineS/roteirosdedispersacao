# 🔨 ANÁLISE: Maven para seu Projeto Python/JavaScript

## 📊 Sua Stack Atual

```
Backend:  Python (Flask)  → pip/requirements.txt
Frontend: JavaScript (Next.js) → npm/package.json
```

## ❌ Maven NÃO é Adequado

**Maven é para Java/JVM**, não para Python/JavaScript. Seria como usar uma chave de fenda para pregar um prego.

---

## 🎯 FERRAMENTAS CORRETAS PARA SUA STACK

### Para Python (Backend) - O que você JÁ TEM ✅

#### 1. **pip + requirements.txt** (ATUAL)
```bash
# Simples e funcional
pip install -r requirements.txt
python main.py
```

#### 2. **Poetry** (Upgrade Opcional)
```toml
# pyproject.toml - Gerenciamento moderno
[tool.poetry]
name = "roteiro-dispensacao"
version = "1.0.0"

[tool.poetry.dependencies]
python = "^3.9"
flask = "^3.0.0"
gunicorn = "^21.2.0"

[tool.poetry.scripts]
start = "python main.py"
deploy = "gunicorn main:app"
```

**Vantagens do Poetry:**
- Lock file para versões exatas
- Ambientes virtuais automáticos
- Publicação em PyPI simplificada

```bash
# Comandos Poetry
poetry install
poetry run start
poetry build
```

#### 3. **Make** (Automação Simples)
```makefile
# Makefile - Automatiza tarefas comuns
.PHONY: install run test deploy

install:
	pip install -r requirements.txt

run:
	python main.py

test:
	pytest tests/

deploy:
	gcloud run deploy roteiro-api --source .

clean:
	find . -type d -name __pycache__ -rm -rf
```

Uso:
```bash
make install
make run
make deploy
```

### Para JavaScript (Frontend) - O que você JÁ TEM ✅

#### 1. **npm/yarn** (ATUAL)
```json
// package.json - Já configurado
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "deploy": "npm run build && firebase deploy"
  }
}
```

#### 2. **pnpm** (Mais Eficiente)
```bash
# 3x mais rápido que npm
pnpm install
pnpm build
pnpm deploy
```

#### 3. **Turborepo** (Para Monorepo)
```json
// turbo.json - Build pipeline otimizado
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "test": {
      "dependsOn": ["build"]
    },
    "deploy": {
      "dependsOn": ["test"]
    }
  }
}
```

---

## 🚀 SOLUÇÃO UNIFICADA: Build System para Todo o Projeto

### OPÇÃO 1: Makefile Global (RECOMENDADO) ✅

Crie um `Makefile` na raiz:

```makefile
# Makefile - Sistema de build unificado
.PHONY: help install build test deploy clean

help: ## Mostra ajuda
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Instala todas as dependências
	@echo "📦 Instalando dependências do backend..."
	cd apps/backend && pip install -r requirements_production.txt
	@echo "📦 Instalando dependências do frontend..."
	cd apps/frontend-nextjs && npm install

build: ## Build completo do projeto
	@echo "🔨 Building backend..."
	cd apps/backend && python -m py_compile main.py
	@echo "🔨 Building frontend..."
	cd apps/frontend-nextjs && npm run build

test: ## Roda todos os testes
	@echo "🧪 Testando backend..."
	cd apps/backend && python -m pytest tests/ || true
	@echo "🧪 Testando frontend..."
	cd apps/frontend-nextjs && npm test || true

run-backend: ## Roda o backend local
	cd apps/backend && python main.py

run-frontend: ## Roda o frontend local
	cd apps/frontend-nextjs && npm run dev

run: ## Roda backend e frontend
	@echo "🚀 Iniciando aplicação completa..."
	make -j 2 run-backend run-frontend

deploy-backend: ## Deploy backend no Cloud Run
	@echo "☁️ Deploy backend para Cloud Run..."
	gcloud run deploy roteiro-dispensacao-api \
		--source apps/backend \
		--region us-central1 \
		--allow-unauthenticated

deploy-frontend: ## Deploy frontend no Firebase
	@echo "🔥 Deploy frontend para Firebase..."
	cd apps/frontend-nextjs && \
	npm run build && \
	firebase deploy --only hosting

deploy: build test ## Deploy completo
	@echo "🚀 Deploy completo iniciando..."
	make deploy-backend
	make deploy-frontend
	@echo "✅ Deploy concluído!"

clean: ## Limpa arquivos temporários
	@echo "🧹 Limpando projeto..."
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name node_modules -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .next -exec rm -rf {} + 2>/dev/null || true
	rm -rf apps/frontend-nextjs/out

docker-build: ## Build containers Docker
	@echo "🐳 Building Docker images..."
	docker build -t roteiro-backend ./apps/backend
	docker build -t roteiro-frontend ./apps/frontend-nextjs

docker-run: ## Roda com Docker Compose
	docker-compose up -d

check-env: ## Verifica variáveis de ambiente
	@echo "🔍 Verificando configuração..."
	@test -n "$$OPENROUTER_API_KEY" || echo "⚠️  OPENROUTER_API_KEY não configurada"
	@test -n "$$HUGGINGFACE_API_KEY" || echo "⚠️  HUGGINGFACE_API_KEY não configurada"
	@test -f apps/frontend-nextjs/.env.production || echo "⚠️  .env.production não encontrado"

status: ## Mostra status do projeto
	@echo "📊 Status do Projeto"
	@echo "===================="
	@git status --short
	@echo ""
	@echo "📦 Backend Dependencies:"
	@cd apps/backend && pip list | grep -E "Flask|gunicorn" || echo "Não instalado"
	@echo ""
	@echo "📦 Frontend Dependencies:"
	@cd apps/frontend-nextjs && npm list --depth=0 2>/dev/null | grep -E "next|react" || echo "Não instalado"
```

### OPÇÃO 2: Task (Moderno, em Go)

Instale: https://taskfile.dev

`Taskfile.yml`:
```yaml
version: '3'

tasks:
  install:
    desc: Instala todas as dependências
    cmds:
      - task: install:backend
      - task: install:frontend

  install:backend:
    dir: apps/backend
    cmds:
      - pip install -r requirements_production.txt

  install:frontend:
    dir: apps/frontend-nextjs
    cmds:
      - npm install

  build:
    desc: Build completo
    deps: [install]
    cmds:
      - task: build:backend
      - task: build:frontend

  build:backend:
    dir: apps/backend
    cmds:
      - python -m py_compile main.py

  build:frontend:
    dir: apps/frontend-nextjs
    cmds:
      - npm run build
    env:
      NEXT_PUBLIC_API_URL: "{{.API_URL}}"

  deploy:
    desc: Deploy completo
    deps: [build, test]
    cmds:
      - task: deploy:backend
      - task: deploy:frontend

  deploy:backend:
    cmds:
      - gcloud run deploy roteiro-dispensacao-api --source apps/backend

  deploy:frontend:
    dir: apps/frontend-nextjs
    cmds:
      - firebase deploy --only hosting
```

Uso:
```bash
task install
task build
task deploy
```

### OPÇÃO 3: npm Scripts Global (package.json na raiz)

`package.json` (raiz):
```json
{
  "name": "roteiro-dispensacao-monorepo",
  "scripts": {
    "install:all": "npm run install:backend && npm run install:frontend",
    "install:backend": "cd apps/backend && pip install -r requirements_production.txt",
    "install:frontend": "cd apps/frontend-nextjs && npm install",
    
    "build": "npm run build:backend && npm run build:frontend",
    "build:backend": "cd apps/backend && python -m py_compile main.py",
    "build:frontend": "cd apps/frontend-nextjs && npm run build",
    
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:backend": "cd apps/backend && python main.py",
    "dev:frontend": "cd apps/frontend-nextjs && npm run dev",
    
    "test": "npm run test:backend && npm run test:frontend",
    "test:backend": "cd apps/backend && pytest",
    "test:frontend": "cd apps/frontend-nextjs && npm test",
    
    "deploy": "npm run deploy:backend && npm run deploy:frontend",
    "deploy:backend": "gcloud run deploy roteiro-dispensacao-api --source apps/backend",
    "deploy:frontend": "cd apps/frontend-nextjs && firebase deploy",
    
    "clean": "rm -rf apps/frontend-nextjs/node_modules apps/frontend-nextjs/.next"
  },
  "devDependencies": {
    "concurrently": "^7.6.0"
  }
}
```

Uso:
```bash
npm run install:all
npm run dev
npm run deploy
```

---

## ✅ RECOMENDAÇÃO FINAL

### Para seu projeto, use:

1. **Makefile** (MELHOR OPÇÃO)
   - ✅ Simples e universal
   - ✅ Funciona em qualquer Linux/Mac/WSL
   - ✅ Não adiciona dependências
   - ✅ Documenta comandos

2. **Continue com npm/pip** (já funciona)
   - ✅ Você já tem configurado
   - ✅ Simples de manter
   - ✅ Padrão da indústria

### NÃO use:
- ❌ Maven (é para Java)
- ❌ Gradle (é para Java/Kotlin)
- ❌ Bazel (muito complexo)
- ❌ Ant (obsoleto)

---

## 🚀 IMPLEMENTAÇÃO RÁPIDA

Copie o Makefile acima para a raiz do projeto:

```bash
# Criar Makefile
notepad Makefile

# Colar conteúdo e salvar

# Usar
make help        # Ver comandos
make install     # Instalar deps
make run        # Rodar local
make deploy     # Deploy produção
```

Pronto! Sistema de build unificado sem complexidade desnecessária. 🎯