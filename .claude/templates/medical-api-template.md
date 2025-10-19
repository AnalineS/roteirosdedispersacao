# API Template: {API_NAME}

**Contexto Médico:** Plataforma educacional sobre hanseníase  
**Público-alvo:** Farmacêuticos e profissionais de saúde  
**Data de criação:** {DATE}  
**Versão:** {VERSION}

## Visão Geral

### Propósito
{DESCRIPTION}

### Relevância Médica
- **Área de aplicação:** {MEDICAL_AREA}
- **Nível de criticidade:** {CRITICALITY_LEVEL}
- **Dados sensíveis:** {HANDLES_SENSITIVE_DATA}
- **Conformidade LGPD:** {LGPD_COMPLIANCE}

## Especificação Técnica

### Endpoint
```
{HTTP_METHOD} {ENDPOINT_PATH}
```

### Autenticação
- **Tipo:** {AUTH_TYPE}
- **Obrigatória:** {AUTH_REQUIRED}
- **Scopes necessários:** {REQUIRED_SCOPES}

### Headers Obrigatórios
```http
Content-Type: application/json
Authorization: Bearer {token}
X-Medical-Context: hanseniase
X-User-Role: {user_role}
```

### Parâmetros de Entrada

#### Path Parameters
{PATH_PARAMS_TABLE}

#### Query Parameters  
{QUERY_PARAMS_TABLE}

#### Request Body
```typescript
{REQUEST_BODY_SCHEMA}
```

### Respostas

#### 200 - Sucesso
```typescript
{SUCCESS_RESPONSE_SCHEMA}
```

#### 400 - Erro de Validação
```typescript
{
  "error": "VALIDATION_ERROR",
  "message": "Dados inválidos fornecidos",
  "details": [
    {
      "field": "campo_invalido",
      "message": "Descrição do erro específico",
      "code": "INVALID_FIELD_VALUE"
    }
  ],
  "medical_context": {
    "severity": "medium",
    "impact": "Cálculo médico pode estar incorreto"
  }
}
```

#### 401 - Não Autorizado
```typescript
{
  "error": "UNAUTHORIZED",
  "message": "Token de acesso inválido ou expirado",
  "medical_context": {
    "severity": "high",
    "impact": "Acesso a dados médicos negado"
  }
}
```

#### 403 - Forbidden
```typescript
{
  "error": "FORBIDDEN", 
  "message": "Permissão insuficiente para esta operação médica",
  "required_role": "medical_professional",
  "medical_context": {
    "severity": "high",
    "impact": "Operação médica crítica bloqueada"
  }
}
```

#### 422 - Erro Médico
```typescript
{
  "error": "MEDICAL_VALIDATION_ERROR",
  "message": "Dados médicos inconsistentes ou perigosos",
  "medical_issues": [
    {
      "field": "dosage",
      "issue": "Dosagem acima do limite seguro",
      "recommendation": "Verificar peso e idade do paciente",
      "severity": "critical"
    }
  ]
}
```

#### 500 - Erro Interno
```typescript
{
  "error": "INTERNAL_SERVER_ERROR",
  "message": "Erro interno do servidor",
  "medical_context": {
    "impact": "Serviço médico temporariamente indisponível",
    "fallback": "Consultar protocolos manuais"
  }
}
```

## Validações Médicas

### Validações de Entrada
{MEDICAL_INPUT_VALIDATIONS}

### Validações de Negócio
{MEDICAL_BUSINESS_VALIDATIONS}

### Validações de Segurança
{MEDICAL_SECURITY_VALIDATIONS}

## Casos de Uso Médicos

### Cenário 1: {USE_CASE_1_NAME}
**Contexto:** {USE_CASE_1_CONTEXT}  
**Ator:** {USE_CASE_1_ACTOR}  
**Objetivo:** {USE_CASE_1_OBJECTIVE}

**Fluxo:**
1. {USE_CASE_1_STEP_1}
2. {USE_CASE_1_STEP_2}
3. {USE_CASE_1_STEP_3}

**Exemplo de Request:**
```json
{USE_CASE_1_REQUEST_EXAMPLE}
```

**Exemplo de Response:**
```json
{USE_CASE_1_RESPONSE_EXAMPLE}
```

### Cenário 2: {USE_CASE_2_NAME}
**Contexto:** {USE_CASE_2_CONTEXT}  
**Ator:** {USE_CASE_2_ACTOR}  
**Objetivo:** {USE_CASE_2_OBJECTIVE}

**Fluxo:**
1. {USE_CASE_2_STEP_1}
2. {USE_CASE_2_STEP_2}
3. {USE_CASE_2_STEP_3}

## Considerações Específicas para Hanseníase

### Classificação da Doença
- **Forma paucibacilar (PB):** {PB_SPECIFIC_CONSIDERATIONS}
- **Forma multibacilar (MB):** {MB_SPECIFIC_CONSIDERATIONS}

### Medicamentos Relacionados
- **Rifampicina:** {RIFAMPICIN_CONSIDERATIONS}
- **Dapsona:** {DAPSONE_CONSIDERATIONS}  
- **Clofazimina:** {CLOFAZIMINE_CONSIDERATIONS}

### Cálculos de Dose Específicos
{DOSAGE_CALCULATION_NOTES}

## Conformidade e Regulamentações

### LGPD (Lei Geral de Proteção de Dados)
- **Dados coletados:** {COLLECTED_DATA}
- **Finalidade:** {DATA_PURPOSE}
- **Base legal:** {LEGAL_BASIS}
- **Tempo de retenção:** {RETENTION_PERIOD}
- **Direitos do titular:** {USER_RIGHTS}

### Regulamentações Médicas
- **ANVISA:** {ANVISA_COMPLIANCE}
- **CFM:** {CFM_COMPLIANCE}  
- **CFF:** {CFF_COMPLIANCE}
- **Protocolos MS:** {MS_PROTOCOLS}

### Auditoria e Logs
- **Eventos logados:** {LOGGED_EVENTS}
- **Nível de detalhe:** {LOG_DETAIL_LEVEL}
- **Retenção de logs:** {LOG_RETENTION}
- **Acesso aos logs:** {LOG_ACCESS_CONTROL}

## Testes e Qualidade

### Cenários de Teste Médico
1. **Teste de dosagem segura:**
   - Entrada: {SAFE_DOSAGE_INPUT}
   - Saída esperada: {SAFE_DOSAGE_OUTPUT}

2. **Teste de dosagem limite:**
   - Entrada: {LIMIT_DOSAGE_INPUT}
   - Saída esperada: {LIMIT_DOSAGE_OUTPUT}

3. **Teste de dosagem perigosa:**
   - Entrada: {DANGEROUS_DOSAGE_INPUT}
   - Saída esperada: {DANGEROUS_DOSAGE_OUTPUT}

### Testes de Integração
- **Sistemas externos:** {EXTERNAL_SYSTEMS}
- **APIs dependentes:** {DEPENDENT_APIS}
- **Banco de dados médicos:** {MEDICAL_DATABASES}

### Testes de Performance
- **Tempo de resposta máximo:** {MAX_RESPONSE_TIME}
- **Throughput esperado:** {EXPECTED_THROUGHPUT}
- **Carga máxima:** {MAX_LOAD}

## Monitoramento

### Métricas Médicas
- **Taxa de erro em cálculos:** {CALCULATION_ERROR_RATE}
- **Tempo médio de resposta:** {AVG_RESPONSE_TIME}
- **Uso por tipo de profissional:** {USAGE_BY_PROFESSIONAL_TYPE}

### Alertas Configurados
- **Erro crítico médico:** {CRITICAL_MEDICAL_ERROR_ALERT}
- **Alta taxa de erro:** {HIGH_ERROR_RATE_ALERT}
- **Performance degradada:** {PERFORMANCE_ALERT}

### Dashboard de Saúde
- **URL do dashboard:** {DASHBOARD_URL}
- **Métricas principais:** {KEY_METRICS}
- **Frequência de atualização:** {UPDATE_FREQUENCY}

## Segurança

### Controles de Acesso
- **Autenticação obrigatória:** {AUTHENTICATION_REQUIRED}
- **Roles autorizadas:** {AUTHORIZED_ROLES}
- **Permissões específicas:** {SPECIFIC_PERMISSIONS}

### Proteção de Dados
- **Criptografia em trânsito:** {ENCRYPTION_IN_TRANSIT}
- **Criptografia em repouso:** {ENCRYPTION_AT_REST}
- **Sanitização de dados:** {DATA_SANITIZATION}

### Rate Limiting
- **Limite por minuto:** {RATE_LIMIT_PER_MINUTE}
- **Limite por hora:** {RATE_LIMIT_PER_HOUR}
- **Limite por usuário:** {RATE_LIMIT_PER_USER}

## Personas de Usuário

### Dr. Gasnelio (Médico Experiente)
**Uso típico:** {GASNELIO_TYPICAL_USAGE}  
**Necessidades específicas:** {GASNELIO_NEEDS}  
**Exemplo de interação:** {GASNELIO_INTERACTION_EXAMPLE}

### GA (Farmacêutico Jovem)
**Uso típico:** {GA_TYPICAL_USAGE}  
**Necessidades específicas:** {GA_NEEDS}  
**Exemplo de interação:** {GA_INTERACTION_EXAMPLE}

## Documentação Adicional

### Links Relacionados
- **Documentação técnica completa:** {FULL_TECH_DOCS_URL}
- **Guias do usuário:** {USER_GUIDES_URL}
- **Protocolos médicos:** {MEDICAL_PROTOCOLS_URL}
- **Código fonte:** {SOURCE_CODE_URL}

### Referências Médicas
- **Diretrizes MS:** {MS_GUIDELINES}
- **Protocolos OMS:** {WHO_PROTOCOLS}
- **Literatura científica:** {SCIENTIFIC_LITERATURE}

### Contatos
- **Equipe de desenvolvimento:** {DEV_TEAM_CONTACT}
- **Equipe médica:** {MEDICAL_TEAM_CONTACT}
- **Suporte técnico:** {TECH_SUPPORT_CONTACT}

## Versionamento

### Histórico de Versões
{VERSION_HISTORY}

### Mudanças Planejadas
{PLANNED_CHANGES}

### Deprecação
{DEPRECATION_NOTICE}

---

**Template gerado em:** {GENERATION_DATE}  
**Última atualização:** {LAST_UPDATE}  
**Próxima revisão:** {NEXT_REVIEW}

> ⚠️ **Aviso Médico:** Esta API manipula informações médicas críticas. Sempre valide os resultados com protocolos clínicos estabelecidos e supervisionamento médico adequado.

> 🛡️ **LGPD:** Esta documentação está em conformidade com a Lei Geral de Proteção de Dados. Para questões sobre privacidade, consulte nossa política de dados médicos.