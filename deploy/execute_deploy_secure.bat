@echo off
REM Script seguro para executar deploy no Render
REM As API keys devem ser configuradas como variáveis de ambiente

echo ============================================================
echo EXECUTANDO DEPLOY SEGURO NO RENDER
echo ============================================================
echo.

REM Configurar variáveis de ambiente temporariamente (apenas para esta sessão)
echo Configurando variaveis de ambiente...

REM IMPORTANTE: Substitua os valores abaixo pelas suas API keys reais
REM Estas variáveis existem apenas durante a execução deste script

set RENDER_API_KEY=SEU_RENDER_API_KEY_AQUI
set HUGGINGFACE_API_KEY=SEU_HUGGINGFACE_API_KEY_AQUI
set OPENROUTER_API_KEY=SEU_OPENROUTER_API_KEY_AQUI

REM Verificar se as variáveis foram configuradas
if "%RENDER_API_KEY%"=="SEU_RENDER_API_KEY_AQUI" (
    echo ERRO: Configure a RENDER_API_KEY neste arquivo antes de executar!
    echo Edite este arquivo e substitua SEU_RENDER_API_KEY_AQUI pela sua API key real
    pause
    exit /b 1
)

echo Variaveis configuradas com sucesso!
echo.

REM Executar o script Python
echo Iniciando deploy...
python deploy_simple.py

REM Limpar variáveis após execução
set RENDER_API_KEY=
set HUGGINGFACE_API_KEY=
set OPENROUTER_API_KEY=

echo.
echo Deploy finalizado!
pause