#!/bin/bash
# Script de correção para PythonAnywhere
# Roteiro de Dispensação - Hanseníase
# Execute este script no Console Bash do PythonAnywhere

echo "🔧 INICIANDO CORREÇÃO DO PYTHONANYWHERE..."
echo "================================================"

# 1. Verificar diretório atual
echo "📁 Verificando diretório atual..."
cd /home/roteirodedispensacao
pwd
echo "✅ Diretório: $(pwd)"

# 2. Listar arquivos atuais
echo ""
echo "📋 Arquivos atuais:"
ls -la

# 3. Remover diretório incorreto se existir
echo ""
echo "🗑️ Removendo diretório incorreto (se existir)..."
if [ -d "siteroteirodedispersacao" ]; then
    echo "❌ Encontrado diretório incorreto: siteroteirodedispersacao"
    rm -rf siteroteirodedispersacao
    echo "✅ Diretório removido"
else
    echo "✅ Diretório incorreto não encontrado"
fi

# 4. Verificar arquivos essenciais
echo ""
echo "🔍 Verificando arquivos essenciais..."

if [ -f "app_flask.py" ]; then
    echo "✅ app_flask.py encontrado"
    head -5 app_flask.py
else
    echo "❌ app_flask.py NÃO encontrado"
    echo "   AÇÃO NECESSÁRIA: Faça upload do app_flask.py"
fi

if [ -f ".env" ]; then
    echo "✅ .env encontrado"
    echo "   Conteúdo (sem valores sensíveis):"
    grep -E "^[A-Z_]+" .env | head -5
else
    echo "❌ .env NÃO encontrado"
    echo "   AÇÃO NECESSÁRIA: Faça upload do .env"
fi

# 5. Verificar dependências
echo ""
echo "📦 Verificando dependências instaladas..."
python3.10 -c "
try:
    import flask
    print('✅ Flask:', flask.__version__)
except ImportError:
    print('❌ Flask não instalado')

try:
    import flask_cors
    print('✅ Flask-CORS instalado')
except ImportError:
    print('❌ Flask-CORS não instalado')

try:
    import dotenv
    print('✅ python-dotenv instalado')
except ImportError:
    print('❌ python-dotenv não instalado')

try:
    import requests
    print('✅ requests instalado')
except ImportError:
    print('❌ requests não instalado')
"

# 6. Instalar dependências se necessário
echo ""
echo "📦 Instalando dependências necessárias..."
pip3.10 install --user Flask==2.3.3
pip3.10 install --user Flask-CORS==4.0.0
pip3.10 install --user python-dotenv==1.0.0
pip3.10 install --user requests==2.31.0

# 7. Teste rápido da aplicação
echo ""
echo "🧪 Testando importação da aplicação..."
python3.10 -c "
import sys
sys.path.insert(0, '/home/roteirodedispensacao')

try:
    from app_flask import app
    print('✅ Aplicação Flask importada com sucesso!')
    print(f'   Nome da app: {app.name}')
    print(f'   Rotas disponíveis: {[rule.rule for rule in app.url_map.iter_rules()]}')
except Exception as e:
    print(f'❌ Erro ao importar aplicação: {e}')
"

# 8. Verificar configuração Web
echo ""
echo "🌐 Próximos passos:"
echo "1. Vá para a aba 'Web' no PythonAnywhere"
echo "2. Verifique se 'Source code' está: /home/roteirodedispensacao"
echo "3. Configure 'WSGI configuration file' para apontar para o arquivo WSGI correto"
echo "4. Clique em 'Reload' para reiniciar a aplicação"
echo "5. Teste em: https://roteirodedispensacao.pythonanywhere.com"

echo ""
echo "✅ CORREÇÃO CONCLUÍDA!"
echo "================================================"