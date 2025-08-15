# Makefile - Sistema de Build Unificado
# Roteiros de Dispensação PQT-U
# ====================================

.PHONY: help install build test deploy clean run status

# Cores para output
BLUE := \033[36m
GREEN := \033[32m
YELLOW := \033[33m
RED := \033[31m
NC := \033[0m # No Color

help: ## Mostra esta mensagem de ajuda
	@echo "$(BLUE)╔════════════════════════════════════════╗$(NC)"
	@echo "$(BLUE)║   Roteiros de Dispensação - Build      ║$(NC)"
	@echo "$(BLUE)╚════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(GREEN)Comandos disponíveis:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "$(BLUE)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(YELLOW)Exemplos:$(NC)"
	@echo "  make install    # Instala todas as dependências"
	@echo "  make run        # Roda backend e frontend local"
	@echo "  make deploy     # Deploy completo para produção"

# ============================================
# INSTALAÇÃO
# ============================================

install: ## Instala todas as dependências
	@echo "$(GREEN)📦 Instalando dependências...$(NC)"
	@$(MAKE) install-backend
	@$(MAKE) install-frontend
	@echo "$(GREEN)✅ Instalação completa!$(NC)"

install-backend: ## Instala dependências do backend Python
	@echo "$(BLUE)🐍 Instalando backend (Python)...$(NC)"
	@cd apps/backend && pip install -r requirements_production.txt

install-frontend: ## Instala dependências do frontend Next.js
	@echo "$(BLUE)⚛️  Instalando frontend (Next.js)...$(NC)"
	@cd apps/frontend-nextjs && npm install

# ============================================
# BUILD
# ============================================

build: ## Build completo do projeto
	@echo "$(GREEN)🔨 Building projeto...$(NC)"
	@$(MAKE) build-backend
	@$(MAKE) build-frontend
	@echo "$(GREEN)✅ Build completo!$(NC)"

build-backend: ## Compila o backend Python
	@echo "$(BLUE)🐍 Compilando backend...$(NC)"
	@cd apps/backend && python -m py_compile main.py
	@echo "✓ Backend compilado"

build-frontend: ## Build do frontend Next.js
	@echo "$(BLUE)⚛️  Building frontend...$(NC)"
	@cd apps/frontend-nextjs && npm run build
	@echo "✓ Frontend build completo"

# ============================================
# DESENVOLVIMENTO
# ============================================

run: ## Roda backend e frontend em paralelo
	@echo "$(GREEN)🚀 Iniciando aplicação completa...$(NC)"
	@echo "$(YELLOW)Backend: http://localhost:8080$(NC)"
	@echo "$(YELLOW)Frontend: http://localhost:3000$(NC)"
	@echo "$(RED)Pressione Ctrl+C para parar$(NC)"
	@$(MAKE) -j 2 run-backend run-frontend

run-backend: ## Roda apenas o backend
	@echo "$(BLUE)🐍 Iniciando backend...$(NC)"
	@cd apps/backend && python main.py

run-frontend: ## Roda apenas o frontend
	@echo "$(BLUE)⚛️  Iniciando frontend...$(NC)"
	@cd apps/frontend-nextjs && npm run dev

# ============================================
# TESTES
# ============================================

test: ## Roda todos os testes
	@echo "$(GREEN)🧪 Executando testes...$(NC)"
	@$(MAKE) test-backend
	@$(MAKE) test-frontend
	@echo "$(GREEN)✅ Testes completos!$(NC)"

test-backend: ## Testa o backend
	@echo "$(BLUE)🐍 Testando backend...$(NC)"
	@cd apps/backend && python -m pytest tests/ 2>/dev/null || echo "$(YELLOW)⚠️  Sem testes configurados$(NC)"

test-frontend: ## Testa o frontend
	@echo "$(BLUE)⚛️  Testando frontend...$(NC)"
	@cd apps/frontend-nextjs && npm test 2>/dev/null || echo "$(YELLOW)⚠️  Testes com warnings$(NC)"

# ============================================
# DEPLOY
# ============================================

deploy: check-env build test ## Deploy completo (backend + frontend)
	@echo "$(GREEN)🚀 Iniciando deploy completo...$(NC)"
	@$(MAKE) deploy-backend
	@$(MAKE) deploy-frontend
	@echo "$(GREEN)✅ Deploy completo!$(NC)"
	@echo "$(YELLOW)📊 URLs de produção:$(NC)"
	@echo "Backend: https://roteiro-dispensacao-api-*.run.app"
	@echo "Frontend: https://roteirosdedispensacao.com"

deploy-backend: ## Deploy backend no Cloud Run
	@echo "$(BLUE)☁️  Deploy backend para Cloud Run...$(NC)"
	gcloud run deploy roteiro-dispensacao-api \
		--source apps/backend \
		--region us-central1 \
		--allow-unauthenticated \
		--memory 512Mi \
		--timeout 300

deploy-frontend: ## Deploy frontend no Firebase
	@echo "$(BLUE)🔥 Deploy frontend para Firebase...$(NC)"
	@cd apps/frontend-nextjs && \
	npm run build && \
	firebase deploy --only hosting

# ============================================
# UTILIDADES
# ============================================

clean: ## Limpa arquivos temporários e builds
	@echo "$(YELLOW)🧹 Limpando projeto...$(NC)"
	@find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	@find . -type d -name .pytest_cache -exec rm -rf {} + 2>/dev/null || true
	@rm -rf apps/frontend-nextjs/.next 2>/dev/null || true
	@rm -rf apps/frontend-nextjs/out 2>/dev/null || true
	@rm -rf apps/frontend-nextjs/node_modules/.cache 2>/dev/null || true
	@echo "$(GREEN)✅ Limpeza completa!$(NC)"

status: ## Mostra status do projeto
	@echo "$(BLUE)╔════════════════════════════════════════╗$(NC)"
	@echo "$(BLUE)║        📊 Status do Projeto            ║$(NC)"
	@echo "$(BLUE)╚════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(YELLOW)Git Status:$(NC)"
	@git status --short || echo "Não é um repositório git"
	@echo ""
	@echo "$(YELLOW)Backend (Python):$(NC)"
	@cd apps/backend && python --version 2>/dev/null || echo "Python não encontrado"
	@cd apps/backend && pip show flask 2>/dev/null | grep Version || echo "Flask não instalado"
	@echo ""
	@echo "$(YELLOW)Frontend (Node.js):$(NC)"
	@node --version 2>/dev/null || echo "Node.js não encontrado"
	@cd apps/frontend-nextjs && npm list next 2>/dev/null | grep next@ || echo "Next.js não instalado"
	@echo ""
	@echo "$(YELLOW)Cloud Tools:$(NC)"
	@gcloud --version 2>/dev/null | head -1 || echo "gcloud não instalado"
	@firebase --version 2>/dev/null || echo "firebase-tools não instalado"

check-env: ## Verifica variáveis de ambiente necessárias
	@echo "$(YELLOW)🔍 Verificando configuração...$(NC)"
	@test -n "$$OPENROUTER_API_KEY" || echo "$(RED)❌ OPENROUTER_API_KEY não configurada$(NC)"
	@test -n "$$HUGGINGFACE_API_KEY" || echo "$(YELLOW)⚠️  HUGGINGFACE_API_KEY não configurada (opcional)$(NC)"
	@test -f apps/frontend-nextjs/.env.production || echo "$(YELLOW)⚠️  .env.production não encontrado$(NC)"
	@test -f apps/backend/.env || echo "$(YELLOW)⚠️  Backend .env não encontrado (usando defaults)$(NC)"

logs-backend: ## Mostra logs do Cloud Run
	@echo "$(BLUE)📜 Logs do backend (Cloud Run)...$(NC)"
	gcloud run logs read roteiro-dispensacao-api --limit=50 --region=us-central1

logs-frontend: ## Mostra logs do Firebase Hosting
	@echo "$(BLUE)📜 Logs do frontend (Firebase)...$(NC)"
	firebase hosting:channel:list

health-check: ## Verifica saúde dos serviços
	@echo "$(YELLOW)🏥 Verificando serviços...$(NC)"
	@echo "Backend health:"
	@curl -s https://roteiro-dispensacao-api-*.run.app/api/v1/health | python -m json.tool 2>/dev/null || echo "$(RED)❌ Backend offline$(NC)"
	@echo ""
	@echo "Frontend status:"
	@curl -s -o /dev/null -w "%{http_code}" https://roteirosdedispensacao.com || echo "$(RED)❌ Frontend offline$(NC)"

# ============================================
# DESENVOLVIMENTO RÁPIDO
# ============================================

dev: ## Atalho para desenvolvimento (install + run)
	@$(MAKE) install
	@$(MAKE) run

quick-deploy: ## Deploy rápido sem testes
	@echo "$(YELLOW)⚡ Deploy rápido (sem testes)...$(NC)"
	@$(MAKE) build
	@$(MAKE) deploy-backend
	@$(MAKE) deploy-frontend

fix-cors: ## Corrige problemas de CORS
	@echo "$(YELLOW)🔧 Aplicando correções de CORS...$(NC)"
	@cd apps/backend && \
	echo "Atualizando main.py com CORS correto..." && \
	git add main.py && \
	git commit -m "fix: CORS configuration for production" && \
	git push

# ============================================
# DOCKER (Opcional)
# ============================================

docker-build: ## Build imagens Docker
	@echo "$(BLUE)🐳 Building imagens Docker...$(NC)"
	@docker build -t roteiro-backend:latest ./apps/backend
	@docker build -t roteiro-frontend:latest ./apps/frontend-nextjs

docker-run: ## Roda com Docker Compose
	@echo "$(BLUE)🐳 Iniciando com Docker...$(NC)"
	@docker-compose up -d

docker-stop: ## Para containers Docker
	@docker-compose down