@echo off
REM Script para configurar encoding UTF-8 no Windows
REM Execute como Administrador para configuracao global

echo Configurando encoding UTF-8 para Python...

REM Configurar variaveis de ambiente do sistema
setx PYTHONIOENCODING utf-8 /M
setx PYTHONUTF8 1 /M

REM Configurar console para UTF-8
chcp 65001 > nul

REM Configurar Git para UTF-8
git config --global core.quotePath false
git config --global i18n.commitEncoding utf-8
git config --global i18n.logOutputEncoding utf-8

echo UTF-8 configurado com sucesso!
echo Reinicie o terminal para aplicar as mudancas.
pause
