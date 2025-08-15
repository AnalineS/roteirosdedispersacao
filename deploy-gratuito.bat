@echo off
echo ========================================
echo DEPLOY GRATUITO - ROTEIROS DE DISPENSACAO
echo ========================================
echo.
echo Este script vai fazer o deploy GRATUITO do seu projeto
echo.
echo OPCAO 1: Deploy no Render.com (Backend)
echo ----------------------------------------
echo 1. Acesse: https://render.com
echo 2. Clique em "New +" e escolha "Web Service"
echo 3. Conecte seu GitHub: AnalineS/roteirosdedispersacao
echo 4. O Render detectara automaticamente o render.yaml
echo 5. Adicione as API keys:
echo    - OPENROUTER_API_KEY
echo    - HUGGINGFACE_API_KEY (opcional)
echo 6. Clique em "Create Web Service"
echo 7. Aguarde o deploy (10-15 minutos primeira vez)
echo 8. Copie a URL gerada (ex: https://roteiro-dispensacao-api.onrender.com)
echo.
pause
echo.
echo OPCAO 2: Deploy no Vercel (Frontend)
echo -------------------------------------
echo Instalando Vercel CLI...
call npm i -g vercel
echo.
echo Fazendo deploy do frontend...
cd apps\frontend-nextjs
echo.
echo Configurando para export estatico...
call npm run build
echo.
echo Iniciando deploy no Vercel...
call vercel --prod
echo.
echo IMPORTANTE: No dashboard do Vercel, adicione:
echo NEXT_PUBLIC_API_URL = https://roteiro-dispensacao-api.onrender.com
echo.
pause
echo.
echo OPCAO 3: Deploy Local para Teste
echo ---------------------------------
echo Iniciando backend localmente...
start cmd /k "cd apps\backend && python main.py"
echo.
echo Aguardando backend iniciar...
timeout /t 5
echo.
echo Iniciando frontend localmente...
start cmd /k "cd apps\frontend-nextjs && npm run dev"
echo.
echo Acesse: http://localhost:3000
echo.
echo ========================================
echo DEPLOY CONCLUIDO!
echo ========================================
echo.
echo URLs de Producao (apos deploy):
echo Backend: https://roteiro-dispensacao-api.onrender.com
echo Frontend: https://roteiro-dispensacao.vercel.app
echo.
echo Para verificar status:
echo Backend Health: https://roteiro-dispensacao-api.onrender.com/api/v1/health
echo.
pause