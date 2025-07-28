@echo off
echo ============================================================
echo EXECUTANDO DEPLOY SEGURO NO RENDER
echo ============================================================
echo.

REM Configurar variaveis de ambiente temporariamente
echo Configurando variaveis de ambiente...

REM Configurar as API keys como variaveis de ambiente temporarias
set RENDER_API_KEY=rnd_PdHEt2X7PABBh2N3Nw1OTX5NE8HF
set HUGGINGFACE_API_KEY=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
set OPENROUTER_API_KEY=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

echo Variaveis configuradas com sucesso!
echo.

REM Navegar para o diretorio deploy
cd /d "C:\Users\Ana\Meu Drive\Site roteiro de dispensação\deploy"

REM Executar o script Python
echo Iniciando deploy...
python deploy_simple.py

REM Limpar variaveis apos execucao
set RENDER_API_KEY=
set HUGGINGFACE_API_KEY=
set OPENROUTER_API_KEY=

echo.
echo Deploy finalizado!
pause