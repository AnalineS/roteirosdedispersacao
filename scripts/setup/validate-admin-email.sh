#!/bin/bash

# Script para validar configuração do email admin@roteirosdedispensacao.com
# Execução: bash scripts/validate-admin-email.sh

set -e

DOMAIN="roteirosdedispensacao.com"
ADMIN_EMAIL="admin@${DOMAIN}"

echo "📧 Validando configuração do email administrativo"
echo "Email: $ADMIN_EMAIL"
echo "Domínio: $DOMAIN"
echo "=================================================="

echo ""
echo "1/5 - Verificando registros DNS MX..."

# Verificar registros MX
MX_RECORDS=$(dig +short $DOMAIN MX 2>/dev/null || echo "")
if [ -n "$MX_RECORDS" ]; then
    echo "✅ Registros MX encontrados:"
    echo "$MX_RECORDS" | sed 's/^/  • /'
else
    echo "❌ Nenhum registro MX encontrado"
    echo "   Configure registros MX para receber emails"
fi

echo ""
echo "2/5 - Verificando registros DNS TXT (SPF)..."

# Verificar registros TXT para SPF
TXT_RECORDS=$(dig +short $DOMAIN TXT 2>/dev/null | grep -i "spf\|mail" || echo "")
if [ -n "$TXT_RECORDS" ]; then
    echo "✅ Registros TXT relacionados a email:"
    echo "$TXT_RECORDS" | sed 's/^/  • /'
else
    echo "⚠️ Nenhum registro SPF encontrado"
    echo "   Recomendado configurar SPF para melhor deliverability"
fi

echo ""
echo "3/5 - Testando conectividade SMTP..."

# Tentar conectar no servidor SMTP (se MX disponível)
if [ -n "$MX_RECORDS" ]; then
    MX_SERVER=$(echo "$MX_RECORDS" | head -1 | awk '{print $2}' | sed 's/\.$//')
    if command -v telnet >/dev/null 2>&1; then
        echo "🔍 Testando conectividade com $MX_SERVER..."
        timeout 5 telnet $MX_SERVER 25 2>/dev/null && echo "✅ Servidor SMTP acessível" || echo "⚠️ Não foi possível conectar ao SMTP"
    else
        echo "⚠️ Comando telnet não disponível - pulando teste SMTP"
    fi
else
    echo "⚠️ Sem registros MX - não é possível testar SMTP"
fi

echo ""
echo "4/5 - Verificando configuração de alertas GCP..."

# Verificar se o email está configurado nos canais de notificação
if command -v gcloud >/dev/null 2>&1; then
    echo "🔍 Verificando canais de notificação no GCP..."
    
    # Verificar autenticação
    if gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
        PROJECT_ID=$(gcloud config get-value project 2>/dev/null || echo "red-truck-468923-s4")
        
        # Listar canais de email
        EMAIL_CHANNELS=$(gcloud alpha monitoring channels list --filter="type=email" --format="value(displayName,labels.email_address)" 2>/dev/null || echo "")
        
        if [ -n "$EMAIL_CHANNELS" ]; then
            echo "📧 Canais de email configurados:"
            echo "$EMAIL_CHANNELS" | while read -r line; do
                if echo "$line" | grep -q "$ADMIN_EMAIL"; then
                    echo "  ✅ $line (ADMIN EMAIL ENCONTRADO)"
                else
                    echo "  • $line"
                fi
            done
            
            # Verificar se admin email está configurado
            if echo "$EMAIL_CHANNELS" | grep -q "$ADMIN_EMAIL"; then
                echo "✅ Email admin configurado nos alertas GCP"
            else
                echo "⚠️ Email admin NÃO encontrado nos canais de notificação"
                echo "   Execute: gcloud alpha monitoring channels create --type=email --channel-labels=email_address=$ADMIN_EMAIL"
            fi
        else
            echo "❌ Nenhum canal de email configurado no GCP"
        fi
    else
        echo "⚠️ gcloud não está autenticado - não é possível verificar alertas"
    fi
else
    echo "⚠️ gcloud não está instalado - pulando verificação de alertas"
fi

echo ""
echo "5/5 - Testando envio de email (se possível)..."

# Tentar enviar email de teste se mail command estiver disponível
if command -v mail >/dev/null 2>&1; then
    echo "📤 Enviando email de teste para $ADMIN_EMAIL..."
    
    TEST_MESSAGE="Teste de configuração do email administrativo

Este é um email de teste do sistema de monitoramento.

Timestamp: $(date)
Sistema: Roteiro de Dispensação
Ambiente: Validação

Se você recebeu este email, a configuração está funcionando corretamente.

---
Sistema de Monitoramento Automatizado"

    echo "$TEST_MESSAGE" | mail -s "🧪 Teste - Email Admin Configurado" "$ADMIN_EMAIL" 2>/dev/null && \
        echo "✅ Email de teste enviado com sucesso" || \
        echo "⚠️ Não foi possível enviar email de teste"
else
    echo "⚠️ Comando 'mail' não disponível - não é possível testar envio"
    echo "   Alternativas: usar curl com API SMTP ou ferramenta online"
fi

echo ""
echo "📋 RESUMO DA VALIDAÇÃO"
echo "=================================================="

# Determinar status geral
ISSUES=0

if [ -z "$MX_RECORDS" ]; then
    echo "❌ Registros MX: NÃO CONFIGURADOS"
    ISSUES=$((ISSUES + 1))
else
    echo "✅ Registros MX: CONFIGURADOS"
fi

if [ -z "$TXT_RECORDS" ]; then
    echo "⚠️ Registros SPF: RECOMENDADO CONFIGURAR"
else
    echo "✅ Registros SPF: ENCONTRADOS"
fi

# Status final
if [ $ISSUES -eq 0 ]; then
    echo ""
    echo "🎉 STATUS: CONFIGURAÇÃO PARECE ESTAR CORRETA"
    echo ""
    echo "✅ Próximos passos:"
    echo "  1. Testar recebimento de alertas GCP manualmente"
    echo "  2. Configurar regras de filtro anti-spam"
    echo "  3. Documentar credenciais de acesso"
    echo "  4. Configurar backup/redirecionamento se necessário"
else
    echo ""
    echo "⚠️ STATUS: CONFIGURAÇÃO INCOMPLETA ($ISSUES problemas)"
    echo ""
    echo "🔧 Ações necessárias:"
    echo "  1. Configurar registros MX no DNS"
    echo "  2. Criar conta de email admin@$DOMAIN"
    echo "  3. Testar recebimento de emails"
    echo "  4. Validar configuração nos alertas GCP"
fi

echo ""
echo "📖 Documentação completa: docs/EMAIL_ADMIN_SETUP.md"
echo "🔗 Console GCP Monitoring: https://console.cloud.google.com/monitoring/alerting"
echo ""
echo "💡 Para configuração manual:"
echo "   1. Google Workspace: https://admin.google.com"
echo "   2. Email forwarding: https://improvmx.com"
echo "   3. SMTP testing: telnet <mx_server> 25"