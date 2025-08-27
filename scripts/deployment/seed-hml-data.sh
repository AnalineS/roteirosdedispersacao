#!/bin/bash

# Script de Seed para Dados Sintéticos - Ambiente HML
# ====================================================

set -e

# Configurações
PROJECT_ID=${GOOGLE_CLOUD_PROJECT}
SERVICE_URL=${SERVICE_URL:-"https://hml-roteiro-dispensacao-api-run-service-url"}

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[SEED]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Dados sintéticos para testes
create_synthetic_users() {
    log_info "Criando usuários sintéticos..."
    
    # Usuários para testes automatizados
    local users=(
        '{"id":"test-student-001","name":"Maria Silva","email":"maria.test@hml.local","role":"student","created_at":"2024-01-15"}'
        '{"id":"test-pharmacist-001","name":"Dr. João Santos","email":"joao.test@hml.local","role":"pharmacist","created_at":"2024-01-15"}'
        '{"id":"test-admin-001","name":"Admin Teste","email":"admin.test@hml.local","role":"admin","created_at":"2024-01-15"}'
        '{"id":"test-researcher-001","name":"Dra. Ana Costa","email":"ana.test@hml.local","role":"researcher","created_at":"2024-01-15"}'
    )
    
    for user in "${users[@]}"; do
        curl -s -X POST "${SERVICE_URL}/api/internal/seed/user" \
            -H "Content-Type: application/json" \
            -H "X-Seed-Token: ${SEED_TOKEN}" \
            -d "$user" > /dev/null
    done
    
    log_success "Usuários sintéticos criados"
}

create_synthetic_conversations() {
    log_info "Criando conversas sintéticas..."
    
    # Conversas de exemplo para testes
    local conversations=(
        '{"user_id":"test-student-001","persona":"dr_gasnelio","question":"Qual a dose de rifampicina para adultos?","response":"A dose padrão de rifampicina para adultos...","timestamp":"2024-01-15T10:00:00Z"}'
        '{"user_id":"test-pharmacist-001","persona":"ga","question":"Como explicar hanseniase para pacientes?","response":"A hanseníase é uma doença tratável...","timestamp":"2024-01-15T11:00:00Z"}'
        '{"user_id":"test-student-001","persona":"dr_gasnelio","question":"Efeitos colaterais da clofazimina?","response":"Os principais efeitos colaterais da clofazimina...","timestamp":"2024-01-15T12:00:00Z"}'
    )
    
    for conversation in "${conversations[@]}"; do
        curl -s -X POST "${SERVICE_URL}/api/internal/seed/conversation" \
            -H "Content-Type: application/json" \
            -H "X-Seed-Token: ${SEED_TOKEN}" \
            -d "$conversation" > /dev/null
    done
    
    log_success "Conversas sintéticas criadas"
}

create_synthetic_feedback() {
    log_info "Criando feedback sintético..."
    
    # Feedback de exemplo
    local feedbacks=(
        '{"user_id":"test-student-001","rating":5,"comment":"Muito útil para aprender sobre dosagem","category":"educational","timestamp":"2024-01-15T13:00:00Z"}'
        '{"user_id":"test-pharmacist-001","rating":4,"comment":"Ótima ferramenta para consulta rápida","category":"professional","timestamp":"2024-01-15T14:00:00Z"}'
        '{"user_id":"test-researcher-001","rating":5,"comment":"Excelente base científica","category":"research","timestamp":"2024-01-15T15:00:00Z"}'
    )
    
    for feedback in "${feedbacks[@]}"; do
        curl -s -X POST "${SERVICE_URL}/api/internal/seed/feedback" \
            -H "Content-Type: application/json" \
            -H "X-Seed-Token: ${SEED_TOKEN}" \
            -d "$feedback" > /dev/null
    done
    
    log_success "Feedback sintético criado"
}

create_synthetic_analytics() {
    log_info "Criando dados analíticos sintéticos..."
    
    # Dados de analytics para testes de dashboard
    local analytics=(
        '{"metric":"page_views","value":1250,"date":"2024-01-15","category":"usage"}'
        '{"metric":"chat_interactions","value":89,"date":"2024-01-15","category":"engagement"}'
        '{"metric":"user_registrations","value":12,"date":"2024-01-15","category":"growth"}'
        '{"metric":"feedback_submissions","value":25,"date":"2024-01-15","category":"quality"}'
    )
    
    for analytic in "${analytics[@]}"; do
        curl -s -X POST "${SERVICE_URL}/api/internal/seed/analytics" \
            -H "Content-Type: application/json" \
            -H "X-Seed-Token: ${SEED_TOKEN}" \
            -d "$analytic" > /dev/null
    done
    
    log_success "Dados analíticos sintéticos criados"
}

create_test_scenarios() {
    log_info "Criando cenários de teste específicos..."
    
    # Cenários para testes automatizados
    local scenarios=(
        '{"name":"dose_calculation_test","data":{"patient_weight":70,"medication":"rifampicina","expected_dose":"600mg"}}'
        '{"name":"interaction_check_test","data":{"medications":["rifampicina","isoniazida"],"expected_interaction":"none"}}'
        '{"name":"contraindication_test","data":{"condition":"gravidez","medication":"clofazimina","expected_warning":"cautela"}}'
    )
    
    for scenario in "${scenarios[@]}"; do
        curl -s -X POST "${SERVICE_URL}/api/internal/seed/test-scenario" \
            -H "Content-Type: application/json" \
            -H "X-Seed-Token: ${SEED_TOKEN}" \
            -d "$scenario" > /dev/null
    done
    
    log_success "Cenários de teste criados"
}

clear_existing_data() {
    log_info "Limpando dados existentes do HML..."
    
    # Limpar coleções com prefixo hml_
    curl -s -X DELETE "${SERVICE_URL}/api/internal/clear/hml-data" \
        -H "X-Seed-Token: ${SEED_TOKEN}" > /dev/null
    
    log_success "Dados HML limpos"
}

validate_seed_data() {
    log_info "Validando dados seedados..."
    
    # Verificar se os dados foram criados corretamente
    local response=$(curl -s "${SERVICE_URL}/api/internal/validate/seed-data" \
        -H "X-Seed-Token: ${SEED_TOKEN}")
    
    local user_count=$(echo $response | jq -r '.users // 0')
    local conversation_count=$(echo $response | jq -r '.conversations // 0')
    local feedback_count=$(echo $response | jq -r '.feedback // 0')
    
    if [ "$user_count" -gt 0 ] && [ "$conversation_count" -gt 0 ] && [ "$feedback_count" -gt 0 ]; then
        log_success "Validação passou: $user_count usuários, $conversation_count conversas, $feedback_count feedbacks"
    else
        log_warning "Validação parcial: alguns dados podem não ter sido criados"
        echo "Response: $response"
    fi
}

# Função principal
main() {
    log_info "🌱 Iniciando seed de dados sintéticos para HML..."
    
    # Verificar se o serviço está acessível
    if ! curl -f "${SERVICE_URL}/health" > /dev/null 2>&1; then
        log_warning "Serviço não acessível, tentando com URL padrão..."
        SERVICE_URL="http://localhost:8080"
        
        if ! curl -f "${SERVICE_URL}/health" > /dev/null 2>&1; then
            log_warning "Serviço não disponível, pulando seed"
            exit 0
        fi
    fi
    
    # Gerar token de seed seguro (para ambientes HML)
    SEED_TOKEN=${SEED_TOKEN:-"hml-seed-$(date +%s)"}
    
    clear_existing_data
    create_synthetic_users
    create_synthetic_conversations
    create_synthetic_feedback
    create_synthetic_analytics
    create_test_scenarios
    validate_seed_data
    
    log_success "🎉 Seed de dados HML concluído!"
    log_info "Token usado: ${SEED_TOKEN}"
    log_info "Service URL: ${SERVICE_URL}"
}

# Executar se chamado diretamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi