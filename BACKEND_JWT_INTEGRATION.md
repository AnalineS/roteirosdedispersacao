# Backend JWT Integration Guide

## 🔐 Guia de Integração JWT no Backend Flask

Este documento explica a implementação completa do sistema de validação JWT Firebase no backend Flask, mantendo total compatibilidade com o sistema atual.

## 📋 Componentes Implementados

### 1. Validador JWT (`jwt_validator.py`)
- ✅ **FirebaseJWTValidator**: Classe principal para validação de tokens
- ✅ **Decorators**: `@require_auth`, `@require_admin`, `@require_role`
- ✅ **Permission System**: Controle granular de permissões
- ✅ **Fallback Support**: Sistema funciona sem autenticação
- ✅ **Error Handling**: Tratamento robusto de erros

### 2. User Blueprint (`user_blueprint.py`)
- ✅ **Profile Management**: APIs de perfil do usuário
- ✅ **Preferences**: Gerenciamento de preferências
- ✅ **Admin Routes**: Rotas administrativas protegidas
- ✅ **Session Info**: Informações de sessão autenticada/anônima
- ✅ **Activity Logging**: Registro de atividades para analytics

### 3. Integração Principal (`main.py`)
- ✅ **Auto-Detection**: Detecta automaticamente se JWT está disponível
- ✅ **Middleware**: Middleware automático para todas as rotas
- ✅ **Graceful Fallback**: Funciona normalmente sem autenticação

## 🚀 Configuração e Deployment

### Variáveis de Ambiente

```bash
# Firebase Project ID (obrigatório para JWT)
FIREBASE_PROJECT_ID=seu-projeto-firebase
# ou
GOOGLE_CLOUD_PROJECT=seu-projeto-firebase

# Outras configurações mantidas
FLASK_ENV=production
PORT=8080
```

### Dependências Adicionadas

```txt
# requirements_production.txt
PyJWT==2.8.0  # Para validação de tokens Firebase JWT
```

### Deploy no Google Cloud Run

```yaml
# deploy.yml - adicionar environment variable
env:
  - name: FIREBASE_PROJECT_ID
    value: "roteiro-dispensacao"  # Seu projeto Firebase
```

## 📊 Endpoints Implementados

### Rotas Públicas (sem autenticação)
```
GET  /api/v1/user/auth/status     # Status do sistema de auth
```

### Rotas Autenticadas (token obrigatório)
```
GET  /api/v1/user/profile         # Perfil do usuário
GET  /api/v1/user/profile/{id}    # Perfil específico (próprio ou admin)
GET  /api/v1/user/preferences     # Obter preferências
POST /api/v1/user/preferences     # Atualizar preferências
```

### Rotas Administrativas (admin role)
```
GET  /api/v1/user/admin/users     # Listar usuários
GET  /api/v1/user/admin/stats     # Estatísticas de usuários
```

### Rotas com Autenticação Opcional
```
GET  /api/v1/user/session         # Info da sessão (auth ou anônima)
POST /api/v1/user/activity        # Log de atividade (tracking)
```

## 🔧 Como Usar os Decorators

### Autenticação Obrigatória
```python
from core.auth.jwt_validator import require_auth, get_current_user_id

@app.route('/api/protected')
@require_auth(optional=False)
def protected_endpoint():
    user_id = get_current_user_id()
    return jsonify({'user_id': user_id})
```

### Autenticação Opcional
```python
@app.route('/api/flexible')
@require_auth(optional=True)
def flexible_endpoint():
    if is_authenticated():
        return jsonify({'message': 'Usuário autenticado'})
    else:
        return jsonify({'message': 'Usuário anônimo'})
```

### Controle de Permissões
```python
from core.auth.jwt_validator import PermissionChecker

@app.route('/api/user/<user_id>/data')
@require_auth()
def get_user_data(user_id):
    if not PermissionChecker.can_access_user_data(user_id):
        return jsonify({'error': 'Sem permissão'}), 403
    
    # Retornar dados do usuário
```

## 🔄 Sistema de Fallback

O sistema é projetado para **NUNCA QUEBRAR** a funcionalidade existente:

### Cenário 1: JWT Não Configurado
```python
# Sistema funciona normalmente
# Todos os decorators são no-op
# Endpoints retornam dados como antes
```

### Cenário 2: JWT Configurado, Token Inválido
```python
# Rotas com @require_auth(optional=True) funcionam
# Rotas protegidas retornam 401
# Sistema gracefully degrada funcionalidades
```

### Cenário 3: JWT Totalmente Funcional
```python
# Todas as funcionalidades disponíveis
# Controle granular de permissões
# Analytics e tracking completos
```

## 📱 Integração com Frontend

### Headers de Requisição
```javascript
// Frontend Next.js
const token = await user.getIdToken();

fetch('/api/v1/user/profile', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

### Tratamento de Erros
```javascript
// Frontend - tratamento de respostas
if (response.status === 401) {
  // Token inválido ou expirado
  await auth.signOut();
  redirectToLogin();
} else if (response.status === 403) {
  // Sem permissão
  showPermissionError();
}
```

## 🧪 Testes da Integração

### Teste 1: Sistema Sem JWT
```bash
# Não configurar FIREBASE_PROJECT_ID
curl http://localhost:8080/api/v1/user/auth/status
# Deve retornar: jwt_validation_available: false
```

### Teste 2: Sistema Com JWT
```bash
# Configurar FIREBASE_PROJECT_ID
export FIREBASE_PROJECT_ID=seu-projeto
curl http://localhost:8080/api/v1/user/auth/status
# Deve retornar: jwt_validation_available: true
```

### Teste 3: Endpoints Protegidos
```bash
# Sem token (deve retornar 401)
curl http://localhost:8080/api/v1/user/profile

# Com token válido (deve retornar dados)
curl -H "Authorization: Bearer ${FIREBASE_TOKEN}" \
     http://localhost:8080/api/v1/user/profile
```

### Teste 4: Endpoints Opcionais
```bash
# Funciona sem token
curl http://localhost:8080/api/v1/user/session
# Retorna: session_type: "anonymous"

# Funciona com token
curl -H "Authorization: Bearer ${FIREBASE_TOKEN}" \
     http://localhost:8080/api/v1/user/session
# Retorna: session_type: "authenticated"
```

## 🔍 Monitoramento e Logs

### Logs de Inicialização
```
INFO: 🔐 JWT Authentication configurado (Firebase)
INFO: 🔐 User Blueprint carregado com autenticação JWT
```

### Logs de Uso
```
INFO: Token validado para usuário: uid123
WARNING: Token inválido recebido: expired
ERROR: Erro ao buscar chaves públicas do Firebase
```

### Métricas Disponíveis
- Tokens validados vs rejeitados
- Usuários únicos autenticados
- Endpoints mais acessados por tipo de usuário
- Erros de autenticação por tipo

## 🛡️ Segurança Implementada

### Validação Rigorosa de Tokens
- ✅ Verificação de assinatura RSA256
- ✅ Validação de audience e issuer
- ✅ Verificação de expiração
- ✅ Validação de auth_time
- ✅ Cache inteligente de chaves públicas

### Proteção de Dados
- ✅ Usuários só acessam próprios dados
- ✅ Admins têm acesso controlado
- ✅ Logs não expõem tokens
- ✅ Headers de segurança mantidos

### Rate Limiting
- ✅ Integra com sistema existente
- ✅ Limites específicos por tipo de usuário
- ✅ Proteção contra ataques de força bruta

## 📊 Performance

### Cache de Chaves Públicas
- Atualização automática baseada em cache-control
- Fallback para cache local em caso de erro
- Reduz latência de validação

### Lazy Loading
- JWT só é inicializado se configurado
- Dependências opcionais não quebram sistema
- Impacto zero quando desabilitado

## 🔄 Roadmap de Funcionalidades

### Próximas Implementações
- [ ] Custom Claims para roles avançados
- [ ] Refresh token handling
- [ ] Multi-tenant support
- [ ] Rate limiting por usuário
- [ ] Audit logs detalhados

### Integrações Futuras
- [ ] Firestore para persistência de sessões
- [ ] Analytics avançados de usuário
- [ ] Webhooks de eventos de auth
- [ ] SSO com Google Workspace

## 🐛 Troubleshooting

### Problema: JWT não inicializa
```bash
# Verificar logs
docker logs container-name | grep JWT

# Verificar variável de ambiente
echo $FIREBASE_PROJECT_ID

# Testar conectividade com Firebase
curl https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com
```

### Problema: Tokens sempre inválidos
```bash
# Verificar project ID
curl /api/v1/user/auth/status

# Verificar formato do token
echo $TOKEN | cut -d. -f2 | base64 -d | jq .

# Verificar logs detalhados
export LOG_LEVEL=DEBUG
```

### Problema: Performance lenta
```bash
# Verificar cache de chaves
grep "chaves públicas" logs/app.log

# Monitorar latência de validação
grep "Token validado" logs/app.log | tail -n 100
```

## 📞 Suporte

Para dúvidas sobre a implementação JWT:

1. **Verificar logs**: Sempre começar pelos logs do aplicativo
2. **Testar status**: Usar `/api/v1/user/auth/status` para diagnóstico
3. **Validar configuração**: Verificar variáveis de ambiente
4. **Consultar documentação**: Este guia e documentação do Firebase

## 🎯 Benefícios da Implementação

### Para Desenvolvedores
- Sistema não-intrusivo e compatível
- Decorators simples e intuitivos
- Fallback automático e robusto
- Logs e debug detalhados

### Para Usuários
- Experiência sem interrupções
- Funcionalidades avançadas opcionais
- Segurança robusta quando autenticado
- Performance otimizada

### Para Administradores
- Controle granular de permissões
- Monitoramento detalhado de uso
- Escalabilidade automática
- Integração com Firebase Console