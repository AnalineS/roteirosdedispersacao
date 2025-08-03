@echo off
echo 🚀 DEPLOY FIREBASE - Roteiros de Dispensação
echo ==========================================
echo.

echo 📍 Verificando Firebase CLI...
firebase --version
if %errorlevel% neq 0 (
    echo ❌ Firebase CLI não encontrado!
    echo Instale: npm install -g firebase-tools
    pause
    exit /b 1
)

echo.
echo 🔐 Fazendo login no Firebase...
firebase login

echo.
echo 📦 Verificando build...
if not exist "dist\" (
    echo 📦 Build não encontrado, criando...
    npm run build
)

echo.
echo 🚀 Realizando deploy...
firebase use --add
firebase deploy --only hosting

echo.
echo ✅ DEPLOY CONCLUÍDO!
echo ===================
echo.
echo 📍 Seu site estará disponível em:
echo 🌐 URL temporária: https://roteiros-de-dispensacao.web.app
echo 🌐 URL personalizada: https://roteirosdedispensacao.com (após configurar DNS)
echo.
echo 📋 PRÓXIMOS PASSOS:
echo 1. Acesse o Firebase Console: https://console.firebase.google.com
echo 2. Configure domínio personalizado: roteirosdedispensacao.com
echo 3. Adicione registros DNS conforme instruções
echo.
pause