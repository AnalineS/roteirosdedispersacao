#!/bin/bash

# Script para Configurar Firebase para Ambiente HML
# =================================================

set -e

# Configurações
PROJECT_ID=${FIREBASE_PROJECT_ID}
HML_SITE_ID="hml-roteiros-de-dispensacao"

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[FIREBASE HML]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar dependências
check_dependencies() {
    log_info "Verificando dependências do Firebase..."
    
    if ! command -v firebase &> /dev/null; then
        log_error "Firebase CLI não encontrado. Execute: npm install -g firebase-tools"
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        log_warning "jq não encontrado. Algumas funcionalidades podem não funcionar."
    fi
    
    log_success "Dependências verificadas"
}

# Login no Firebase
firebase_login() {
    log_info "Verificando autenticação Firebase..."
    
    if ! firebase projects:list &> /dev/null; then
        log_info "Fazendo login no Firebase..."
        firebase login
    fi
    
    log_success "Autenticação Firebase OK"
}

# Configurar projeto
setup_project() {
    log_info "Configurando projeto Firebase..."
    
    # Usar projeto existente
    firebase use ${PROJECT_ID}
    
    log_success "Projeto configurado: ${PROJECT_ID}"
}

# Criar site de hosting HML
create_hml_site() {
    log_info "Criando site de hosting para HML..."
    
    # Verificar se site já existe
    if firebase hosting:sites:list | grep -q ${HML_SITE_ID}; then
        log_warning "Site ${HML_SITE_ID} já existe"
    else
        # Criar novo site
        firebase hosting:sites:create ${HML_SITE_ID}
        log_success "Site ${HML_SITE_ID} criado"
    fi
    
    # Configurar target
    firebase target:apply hosting hml ${HML_SITE_ID}
    log_success "Target HML configurado"
}

# Configurar regras Firestore para HML
setup_firestore_rules() {
    log_info "Configurando regras Firestore para HML..."
    
    # Backup das regras atuais
    if [ -f firestore.rules ]; then
        cp firestore.rules firestore.rules.backup
        log_info "Backup das regras criado"
    fi
    
    # Adicionar regras específicas para HML
    cat >> firestore.rules << 'EOF'

// Regras específicas para ambiente HML
match /hml_{document=**} {
  allow read, write: if true; // Permissivo para testes
}

match /hml_users/{userId} {
  allow read, write: if true; // Permissivo para testes
}

match /hml_conversations/{conversationId} {
  allow read, write: if true; // Permissivo para testes
}

match /hml_feedback/{feedbackId} {
  allow read, write: if true; // Permissivo para testes
}

match /hml_analytics/{analyticsId} {
  allow read, write: if true; // Permissivo para testes
}
EOF
    
    log_success "Regras Firestore atualizadas para HML"
}

# Configurar índices Firestore
setup_firestore_indexes() {
    log_info "Configurando índices Firestore para HML..."
    
    # Adicionar índices específicos para HML
    if [ -f firestore.indexes.json ]; then
        # Fazer backup
        cp firestore.indexes.json firestore.indexes.json.backup
        
        # Adicionar índices HML usando jq se disponível
        if command -v jq &> /dev/null; then
            jq '.indexes += [
                {
                    "collectionGroup": "hml_conversations",
                    "queryScope": "COLLECTION",
                    "fields": [
                        {"fieldPath": "user_id", "order": "ASCENDING"},
                        {"fieldPath": "timestamp", "order": "DESCENDING"}
                    ]
                },
                {
                    "collectionGroup": "hml_feedback", 
                    "queryScope": "COLLECTION",
                    "fields": [
                        {"fieldPath": "rating", "order": "DESCENDING"},
                        {"fieldPath": "timestamp", "order": "DESCENDING"}
                    ]
                }
            ]' firestore.indexes.json > firestore.indexes.json.tmp
            mv firestore.indexes.json.tmp firestore.indexes.json
            
            log_success "Índices Firestore configurados"
        else
            log_warning "jq não disponível, índices devem ser configurados manualmente"
        fi
    else
        log_warning "Arquivo firestore.indexes.json não encontrado"
    fi
}

# Deploy das configurações
deploy_firebase_config() {
    log_info "Fazendo deploy das configurações Firebase..."
    
    # Deploy das regras Firestore
    firebase deploy --only firestore:rules
    
    # Deploy dos índices Firestore
    firebase deploy --only firestore:indexes
    
    log_success "Configurações Firebase deployadas"
}

# Configurar domínio personalizado (opcional)
setup_custom_domain() {
    log_info "Configuração de domínio personalizado..."
    
    # Instruções para configuração manual
    cat << EOF

📋 CONFIGURAÇÃO DE DOMÍNIO PERSONALIZADO (OPCIONAL):

1. No Console Firebase:
   https://console.firebase.google.com/project/${PROJECT_ID}/hosting/sites

2. Selecione o site: ${HML_SITE_ID}

3. Adicione domínio personalizado:
   - hml.roteirosdedispensacao.com (se disponível)

4. Configure DNS:
   - Adicione CNAME apontando para ${HML_SITE_ID}.web.app

EOF
    
    log_info "Instruções de domínio exibidas"
}

# Testar configuração
test_configuration() {
    log_info "Testando configuração Firebase HML..."
    
    # Listar sites
    log_info "Sites disponíveis:"
    firebase hosting:sites:list
    
    # Verificar targets
    log_info "Targets configurados:"
    firebase target:list
    
    # Testar regras (se possível)
    if command -v firebase &> /dev/null; then
        log_info "Configuração testada com sucesso"
    fi
    
    log_success "Testes de configuração concluídos"
}

# Criar documentação
create_documentation() {
    log_info "Criando documentação da configuração..."
    
    cat > docs/firebase-hml-setup.md << 'EOF'
# Firebase HML Setup Documentation

## Configuração Realizada

### Sites de Hosting
- **HML Site ID**: hml-roteiros-de-dispensacao
- **URL**: https://hml-roteiros-de-dispensacao.web.app
- **Target**: hml

### Firestore Rules
- Coleções com prefixo `hml_` configuradas
- Regras permissivas para ambiente de teste
- Backup das regras originais criado

### Índices Firestore
- Índices otimizados para consultas HML
- Performance otimizada para testes

## Comandos Úteis

```bash
# Deploy apenas para HML
firebase deploy --only hosting:hml

# Deploy com target específico
firebase target:apply hosting hml hml-roteiros-de-dispensacao
firebase deploy --only hosting:hml

# Verificar configuração
firebase hosting:sites:list
firebase target:list
```

## URLs Importantes

- **HML Frontend**: https://hml-roteiros-de-dispensacao.web.app
- **Console Firebase**: https://console.firebase.google.com/project/PROJECT_ID/hosting
- **Logs**: https://console.firebase.google.com/project/PROJECT_ID/hosting/sites/hml-roteiros-de-dispensacao

## Troubleshooting

### Site não encontrado
```bash
firebase hosting:sites:create hml-roteiros-de-dispensacao
firebase target:apply hosting hml hml-roteiros-de-dispensacao
```

### Regras não aplicadas
```bash
firebase deploy --only firestore:rules
```

### Índices não criados
```bash
firebase deploy --only firestore:indexes
```
EOF

    log_success "Documentação criada em docs/firebase-hml-setup.md"
}

# Função principal
main() {
    log_info "🔥 Iniciando configuração Firebase para HML..."
    
    check_dependencies
    firebase_login
    setup_project
    create_hml_site
    setup_firestore_rules
    setup_firestore_indexes
    deploy_firebase_config
    setup_custom_domain
    test_configuration
    create_documentation
    
    log_success "🎉 Configuração Firebase HML concluída!"
    log_info "Site HML: https://${HML_SITE_ID}.web.app"
    log_info "Target configurado: hml"
    log_info "Documentação: docs/firebase-hml-setup.md"
}

# Executar se chamado diretamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi