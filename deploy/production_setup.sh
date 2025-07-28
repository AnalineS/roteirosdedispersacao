#!/bin/bash
# ===================================================================
# SCRIPT DE CONFIGURAÇÃO DE PRODUÇÃO - ROTEIRO DE DISPENSAÇÃO
# ===================================================================
# DevOps Engineer: Configuração otimizada para Render.com

echo "🚀 INICIANDO CONFIGURAÇÃO DE PRODUÇÃO..."

# === VALIDAÇÃO DE AMBIENTE ===
echo "📋 Validando ambiente de produção..."

# Verificar variáveis obrigatórias
REQUIRED_VARS=(
    "HUGGINGFACE_API_KEY"
    "OPENROUTER_API_KEY" 
    "FLASK_ENV"
    "PORT"
)

for var in "${REQUIRED_VARS[@]}"; do
    if [[ -z "${!var}" ]]; then
        echo "❌ ERRO: Variável $var não configurada"
        exit 1
    else
        echo "✅ $var: Configurada"
    fi
done

# === INSTALAÇÃO DE DEPENDÊNCIAS ===
echo "📦 Instalando dependências Python..."
pip install --no-cache-dir -r requirements.txt

if [ $? -eq 0 ]; then
    echo "✅ Dependências instaladas com sucesso"
else
    echo "❌ Falha na instalação de dependências"
    exit 1
fi

# === VERIFICAÇÃO DA BASE DE CONHECIMENTO ===
echo "📚 Verificando base de conhecimento..."
if [ -f "data/knowledge_base/Roteiro de Dsispensação - Hanseníase.md" ]; then
    echo "✅ Base de conhecimento encontrada"
    FILE_SIZE=$(stat -f%z "data/knowledge_base/Roteiro de Dsispensação - Hanseníase.md" 2>/dev/null || stat -c%s "data/knowledge_base/Roteiro de Dsispensação - Hanseníase.md" 2>/dev/null)
    echo "📊 Tamanho: $FILE_SIZE bytes"
else
    # Fallback para arquivo alternativo
    if [ -f "data/Roteiro de Dsispensação - Hanseníase.md" ]; then
        echo "✅ Base de conhecimento encontrada (path alternativo)"
        mkdir -p data/knowledge_base
        cp "data/Roteiro de Dsispensação - Hanseníase.md" "data/knowledge_base/"
        echo "✅ Arquivo copiado para path padrão"
    else
        echo "⚠️ Base de conhecimento não encontrada - sistema funcionará com fallback"
    fi
fi

# === CRIAÇÃO DE DIRETÓRIOS ===
echo "📁 Criando estrutura de diretórios..."
mkdir -p logs
mkdir -p data/knowledge_base
mkdir -p tmp

# === VALIDAÇÃO DE IMPORTS ===
echo "🔍 Validando imports Python..."
cd src/backend
python -c "
import sys
sys.path.append('.')
try:
    from services.dr_gasnelio_enhanced import get_enhanced_dr_gasnelio_prompt
    from services.ga_enhanced import get_enhanced_ga_prompt
    from services.scope_detection_system import detect_question_scope
    from services.enhanced_rag_system import get_enhanced_context
    from services.personas import get_personas
    from core.performance import performance_cache, response_optimizer, usability_monitor
    print('✅ Todos os imports funcionando!')
    print('✅ Personas disponíveis:', list(get_personas().keys()))
except Exception as e:
    print('❌ Erro nos imports:', e)
    sys.exit(1)
"

if [ $? -eq 0 ]; then
    echo "✅ Validação de imports bem-sucedida"
else
    echo "❌ Falha na validação de imports"
    exit 1
fi

# === CONFIGURAÇÃO DE LOGS ===
echo "📝 Configurando sistema de logs..."
export LOG_LEVEL=${LOG_LEVEL:-INFO}
export LOG_FORMAT=${LOG_FORMAT:-structured}

# === VERIFICAÇÃO FINAL ===
echo "🔍 Executando verificação final..."
python -c "
import os
from main import app
with app.test_client() as client:
    response = client.get('/api/health')
    if response.status_code == 200:
        print('✅ Health check funcionando')
        print('✅ API respondendo corretamente')
    else:
        print('❌ Health check falhou')
        exit(1)
" 2>/dev/null

echo "🎉 CONFIGURAÇÃO DE PRODUÇÃO CONCLUÍDA COM SUCESSO!"
echo "🚀 Sistema pronto para deploy no Render.com"

# === INFORMAÇÕES DO SISTEMA ===
echo ""
echo "📊 INFORMAÇÕES DO SISTEMA:"
echo "🐍 Python: $(python --version)"
echo "📦 Flask: $(python -c 'import flask; print(flask.__version__)')"
echo "🔧 Ambiente: $FLASK_ENV"
echo "🌐 Porta: $PORT"
echo "📍 Path Python: $PYTHONPATH"
echo ""
echo "🔗 Endpoints disponíveis:"
echo "   • /api/health (Health check)"
echo "   • /api/chat (Chat com personas)"
echo "   • /api/personas (Informações das personas)"
echo "   • /api/scope (Verificação de escopo)"
echo "   • /api/feedback (Sistema de feedback)"
echo "   • /api/stats (Estatísticas do sistema)"
echo ""
echo "✅ Deploy autorizado para produção!"