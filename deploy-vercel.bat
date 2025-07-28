@echo off
echo ========================================
echo 🚀 DEPLOY AUTOMATICO PARA VERCEL
echo ========================================
echo.

echo ✅ Verificando arquivos de migração...
if not exist "vercel.json" (
    echo ❌ Erro: vercel.json não encontrado
    pause
    exit /b 1
)

if not exist "api\main.py" (
    echo ❌ Erro: api/main.py não encontrado
    pause
    exit /b 1
)

echo ✅ Arquivos de configuração encontrados

echo.
echo 📋 INSTRUÇÕES PARA DEPLOY NO VERCEL:
echo.
echo 1. Acesse: https://vercel.com
echo 2. Faça login com sua conta GitHub
echo 3. Clique em "New Project"
echo 4. Selecione o repositório: siteroteirodedispersacao
echo 5. Configure:
echo    - Framework Preset: Other
echo    - Build Command: echo "Build completed"
echo    - Output Directory: public
echo    - Install Command: pip install -r requirements.txt
echo.
echo 6. Adicione as variáveis de ambiente:
echo    OPENROUTER_API_KEY=sua_chave_openrouter
echo    HUGGINGFACE_API_KEY=sua_chave_huggingface
echo    MONITORING_ENABLED=true
echo    CACHE_ENABLED=true
echo    VERCEL_ENV=production
echo.
echo 7. Clique em "Deploy"
echo.
echo 🔗 Após o deploy, sua URL será:
echo    https://siteroteirodedispersacao.vercel.app
echo.
echo 🧪 Para testar:
echo    https://sua-url.vercel.app/api/health
echo    https://sua-url.vercel.app/api/personas
echo.
echo ========================================
echo 📖 Consulte DEPLOY_INSTRUCTIONS.md para detalhes
echo ========================================

pause