@echo off
echo ========================================
echo   CONECTANDO DOMINIO PERSONALIZADO
echo ========================================
echo.

cd "C:\Users\Ana\Meu Drive\Site roteiro de dispensação"

echo Passo 1: Adicionando dominio ao Firebase...
firebase hosting:sites:domain:add roteirosdispensacao.com.br --project red-truck-468923-s4

echo.
echo Passo 2: Verificando status...
firebase hosting:sites:list --project red-truck-468923-s4

echo.
echo ========================================
echo   PROCESSO COMPLETO!
echo ========================================
echo.
echo Aguarde 2-24 horas para propagacao DNS
echo Seu site estara disponivel em:
echo - https://roteirosdispensacao.com.br
echo - https://www.roteirosdispensacao.com.br
echo.
pause