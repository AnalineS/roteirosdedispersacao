@echo off
:: Claude Automations Starter para Windows
:: Sistema de monitoramento médico automatizado

echo.
echo ================================================
echo  Claude Automations - Sistema Médico
echo  Ativando monitoramento e automações...
echo ================================================
echo.

:: Verificar se Node.js está disponível
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERRO] Node.js não encontrado. Instale Node.js 16+ primeiro.
    pause
    exit /b 1
)

:: Verificar se estamos na pasta correta
if not exist ".claude" (
    echo [ERRO] Pasta .claude não encontrada. Execute na raiz do projeto.
    pause
    exit /b 1
)

:: Definir variáveis de ambiente para produção
set NODE_ENV=production
set CLAUDE_AUTOMATION_MODE=windows

:: Criar diretório de logs se não existir
if not exist "logs" mkdir logs
if not exist "logs\claude-automations" mkdir logs\claude-automations

echo [INFO] Iniciando Claude Automations...
echo [INFO] Logs serão gravados em: logs\claude-automations\
echo.

:: Executar o ativador principal
node scripts\activate-claude-automations.js

:: Se chegou aqui, provavelmente houve um erro ou interrupção
echo.
echo [INFO] Claude Automations finalizado.
echo.
pause