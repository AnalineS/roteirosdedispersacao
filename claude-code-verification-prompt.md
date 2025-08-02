# PROMPT CLAUDE CODE - VERIFICAÇÃO E CORREÇÃO PÓS-DEPLOY

## SITUAÇÃO ATUAL
Backend está funcionando no Cloud Run, mas o frontend no Firebase Hosting ainda não está mostrando a aplicação React correta. É necessário verificar e corrigir o deploy do frontend.

## CHECKLIST DE VERIFICAÇÃO IMEDIATA

### 1. VERIFICAR ESTRUTURA DE ARQUIVOS
```bash
# Na raiz do projeto
ls -la
find . -name "index.html" -type f | head -20
find . -name "build" -type d
find . -name "dist" -type d
find . -name "public" -type d

# Verificar se existe alguma pasta public na raiz que pode estar sobrescrevendo
ls -la public/
ls -la src/frontend/build/
```

### 2. VERIFICAR FIREBASE.JSON
```bash
cat firebase.json

# O firebase.json DEVE apontar para src/frontend/build
# Se estiver apontando para "public" ou outra pasta, está errado
```

### 3. VERIFICAR BUILD DO REACT

#### 3.1 Confirmar que o build foi feito corretamente
```bash
cd src/frontend

# Verificar se node_modules existe
ls -la node_modules/ | head -5

# Se não existir, instalar dependências
npm install

# Verificar variáveis de ambiente
cat .env.production
# Deve conter:
# REACT_APP_API_URL=https://api.roteirosdedispensacao.com ou URL do Cloud Run

# Fazer build limpo
rm -rf build/
npm run build

# Verificar se build foi criado
ls -la build/
cat build/index.html | head -20
# Deve mostrar HTML do React com <div id="root"></div>
```

#### 3.2 Verificar se é realmente uma aplicação React
```bash
# O build deve conter arquivos JS grandes
ls -lh build/static/js/
# Deve ter main.[hash].js com tamanho > 100KB

# Verificar se tem componentes React
grep -r "ChatInterface" build/ || echo "ERRO: Componentes React não encontrados"
grep -r "Dr. Gasnelio" build/ || echo "ERRO: Personas não encontradas"
```

### 4. LIMPAR E RECONFIGURAR FIREBASE

#### 4.1 Remover configurações antigas
```bash
# Na raiz do projeto
rm -rf .firebase/
rm -rf public/  # SE existir uma pasta public na raiz

# Criar firebase.json correto
cat > firebase.json << 'EOF'
{
  "hosting": {
    "public": "src/frontend/build",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "/static/**",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=31536000, immutable"
          }
        ]
      },
      {
        "source": "/**",
        "headers": [
          {
            "key": "X-Frame-Options",
            "value": "SAMEORIGIN"
          },
          {
            "key": "X-Content-Type-Options", 
            "value": "nosniff"
          },
          {
            "key": "Referrer-Policy",
            "value": "strict-origin-when-cross-origin"
          },
          {
            "key": "Permissions-Policy",
            "value": "geolocation=(), microphone=(), camera=()"
          }
        ]
      }
    ]
  }
}
EOF
```

### 5. VERIFICAR E CORRIGIR PATHS DO REACT

#### 5.1 Verificar App.tsx/App.js principal
```bash
# Encontrar arquivo App principal
find src/frontend/src -name "App.*" -type f

# Verificar conteúdo
cat src/frontend/src/App.tsx  # ou App.js

# Deve importar e renderizar componentes como:
# - ChatInterface
# - PersonaSelector
# - Ou similar
```

#### 5.2 Verificar index.tsx/index.js
```bash
cat src/frontend/src/index.tsx  # ou index.js

# Deve conter algo como:
# ReactDOM.render(<App />, document.getElementById('root'))
# ou 
# ReactDOM.createRoot(document.getElementById('root')).render(<App />)
```

### 6. DEPLOY CORRETO PASSO A PASSO

```bash
# 1. Garantir que estamos na raiz do projeto
pwd  # Deve mostrar o diretório raiz do projeto

# 2. Limpar tudo
rm -rf .firebase/
rm -rf src/frontend/build/

# 3. Instalar dependências do frontend
cd src/frontend
npm install

# 4. Criar arquivo de ambiente se não existir
echo "REACT_APP_API_URL=https://api.roteirosdedispensacao.com" > .env.production
echo "REACT_APP_ENVIRONMENT=production" >> .env.production

# 5. Build limpo
npm run build

# 6. Verificar build
ls -la build/
ls -la build/static/js/
cat build/index.html | grep -E "(root|React|chunk)"

# 7. Voltar para raiz
cd ../..

# 8. Deploy para Firebase
firebase deploy --only hosting --debug

# 9. Se falhar, tentar com projeto específico
firebase use seu-projeto-id
firebase deploy --only hosting --project seu-projeto-id
```

### 7. TESTE LOCAL ANTES DO DEPLOY

```bash
# Testar o build localmente
cd src/frontend
npx serve -s build -l 3000

# Abrir http://localhost:3000
# DEVE mostrar a interface React com chat

# Se funcionar localmente mas não em produção, 
# o problema é no deploy do Firebase
```

### 8. VERIFICAR CONSOLE DO NAVEGADOR

Após deploy, abrir https://roteiros-de-dispensacao.web.app e verificar:

```javascript
// No console do navegador (F12)

// 1. Verificar se React está carregado
window.React

// 2. Verificar erros
// Procurar por:
// - 404 em arquivos JS/CSS
// - CORS errors
// - "Failed to fetch"

// 3. Verificar se API está configurada
console.log(window.REACT_APP_API_URL)
```

### 9. SOLUÇÃO ALTERNATIVA - DEPLOY DIRETO

Se continuar com problemas, fazer deploy direto da pasta build:

```bash
# 1. Copiar build para uma pasta temporária
cp -r src/frontend/build /tmp/roteiro-build

# 2. Inicializar Firebase nessa pasta
cd /tmp/roteiro-build
firebase init hosting

# Respostas:
# Public directory: . (ponto - diretório atual)
# Single-page app: Yes
# Overwrite index.html: No

# 3. Deploy
firebase deploy --only hosting
```

### 10. VERIFICAÇÃO FINAL

Após deploy bem-sucedido, verificar:

1. **Interface Visual**
   - [ ] Chat interface visível
   - [ ] Botões para selecionar personas
   - [ ] Design moderno (não o antigo)

2. **Funcionalidades**
   - [ ] Clicar em persona funciona
   - [ ] Enviar mensagem no chat funciona
   - [ ] Respostas da IA aparecem

3. **Console**
   - [ ] Zero erros 404
   - [ ] Zero erros de CORS
   - [ ] Mensagens de sucesso da API

### 11. SE NADA FUNCIONAR - DIAGNÓSTICO PROFUNDO

```bash
# 1. Verificar qual projeto Firebase está sendo usado
firebase projects:list
firebase use

# 2. Verificar sites do Firebase
firebase hosting:sites:list

# 3. Verificar canais de hosting
firebase hosting:channel:list

# 4. Logs do Firebase
firebase hosting:clone SOURCE_SITE_ID:TARGET_SITE_ID

# 5. Verificar se há múltiplos sites
# Pode ser que esteja deployando para o site errado
```

## RESULTADO ESPERADO

Após seguir todos os passos:
1. Site deve mostrar interface React moderna
2. Chat com IA deve estar funcional
3. Duas personas (Dr. Gasnelio e Gá) disponíveis
4. Zero erros no console
5. Comunicação com backend funcionando

## IMPORTANTE

- O problema está no FRONTEND, não no backend
- O backend já está funcionando corretamente
- Foco deve ser em garantir que o React build está sendo servido
- Verificar CADA passo, não pular etapas