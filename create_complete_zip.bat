@echo off
REM 📦 Criar ZIP COMPLETO para PythonAnywhere
REM Mantém TODAS as funcionalidades: RAG, Frontend, Sistema Complexo

echo.
echo ==========================================
echo 📦 CRIANDO ZIP COMPLETO PARA PYTHONANYWHERE
echo ==========================================
echo.

REM Criar pasta temporária
if exist "complete_deploy" rmdir /s /q "complete_deploy"
mkdir complete_deploy

echo 📋 Copiando PROJETO COMPLETO...

REM Arquivo WSGI otimizado
copy "wsgi.py" "complete_deploy\" >nul
echo ✅ wsgi.py (configuração completa)

REM Requirements completo
copy "requirements_complete.txt" "complete_deploy\requirements.txt" >nul
echo ✅ requirements.txt (todas dependências)

REM Estrutura src COMPLETA
xcopy "src" "complete_deploy\src" /E /I /Q /EXCLUDE:exclusions.txt >nul 2>&1
if not exist exclusions.txt (
    xcopy "src" "complete_deploy\src" /E /I /Q >nul
)
echo ✅ src/ COMPLETO copiado

REM Base de conhecimento COMPLETA
xcopy "data" "complete_deploy\data" /E /I /Q >nul
echo ✅ data/ COMPLETO copiado

REM Arquivos de configuração
if exist ".env" copy ".env" "complete_deploy\" >nul
if exist "README.md" copy "README.md" "complete_deploy\" >nul
echo ✅ Configurações copiadas

echo.
echo 🏗️ EXCLUINDO apenas arquivos desnecessários...

REM Remover caches e temporários
if exist "complete_deploy\src\**\__pycache__" rmdir /s /q "complete_deploy\src\**\__pycache__" 2>nul
if exist "complete_deploy\src\frontend\node_modules" rmdir /s /q "complete_deploy\src\frontend\node_modules" 2>nul
echo ✅ Caches removidos

echo.
echo 🗜️ Comprimindo PROJETO COMPLETO...

powershell -command "Compress-Archive -Path 'complete_deploy\*' -DestinationPath 'roteiro_completo.zip' -Force"

if exist "roteiro_completo.zip" (
    echo.
    echo ===============================================
    echo ✅ ZIP COMPLETO CRIADO COM SUCESSO!
    echo ===============================================
    echo.
    echo 📦 Arquivo: roteiro_completo.zip
    
    REM Mostrar tamanho
    for %%A in ("roteiro_completo.zip") do (
        set /a size_mb=%%~zA/1024/1024
        echo 📏 Tamanho: %%~zA bytes (~!size_mb!MB)
    )
    
    echo.
    echo 🚀 FUNCIONALIDADES INCLUÍDAS:
    echo    ✅ Sistema RAG avançado completo
    echo    ✅ Módulos de IA e processamento
    echo    ✅ Frontend React (build estático)
    echo    ✅ Personas Dr. Gasnelio + Gá
    echo    ✅ Base de conhecimento estruturada
    echo    ✅ Sistema de cache e performance
    echo    ✅ Monitoramento e logs
    echo    ✅ Validações e segurança
    echo.
    echo 📋 PRÓXIMO PASSO: Upload no PythonAnywhere
    echo.
) else (
    echo ❌ Erro ao criar ZIP!
)

REM Limpar
rmdir /s /q "complete_deploy"

echo 🎉 ZIP COMPLETO pronto para deploy!
pause