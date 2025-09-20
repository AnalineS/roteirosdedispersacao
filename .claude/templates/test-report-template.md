# Relatório de Testes - {TEST_SUITE_NAME}

**Plataforma:** Sistema educacional sobre hanseníase  
**Data de execução:** {EXECUTION_DATE}  
**Versão do sistema:** {SYSTEM_VERSION}  
**Ambiente:** {ENVIRONMENT}

## Resumo Executivo

### Estatísticas Gerais
| Métrica | Valor | Status |
|---------|-------|--------|
| **Total de testes** | {TOTAL_TESTS} | {TOTAL_STATUS} |
| **Testes passou** | {PASSED_TESTS} | ✅ |
| **Testes falharam** | {FAILED_TESTS} | {FAILED_STATUS} |
| **Testes ignorados** | {SKIPPED_TESTS} | ⏭️ |
| **Taxa de sucesso** | {SUCCESS_RATE}% | {SUCCESS_STATUS} |
| **Cobertura de código** | {CODE_COVERAGE}% | {COVERAGE_STATUS} |
| **Tempo total** | {TOTAL_EXECUTION_TIME} | ⏱️ |

### Qualidade Médica
| Aspecto | Score | Status |
|---------|-------|--------|
| **Precisão de cálculos médicos** | {MEDICAL_CALCULATION_ACCURACY}% | {MEDICAL_CALC_STATUS} |
| **Validação de dados clínicos** | {CLINICAL_DATA_VALIDATION}% | {CLINICAL_STATUS} |
| **Conformidade LGPD** | {LGPD_COMPLIANCE}% | {LGPD_STATUS} |
| **Acessibilidade (WCAG 2.1)** | {ACCESSIBILITY_SCORE}% | {A11Y_STATUS} |
| **Performance médica** | {MEDICAL_PERFORMANCE}% | {PERF_STATUS} |

## Detalhamento por Categoria

### 🧪 Testes Unitários
- **Executados:** {UNIT_TESTS_RUN}
- **Passou:** {UNIT_TESTS_PASSED}
- **Falhou:** {UNIT_TESTS_FAILED}
- **Cobertura:** {UNIT_COVERAGE}%
- **Tempo:** {UNIT_EXECUTION_TIME}

#### Componentes Testados
{UNIT_TESTED_COMPONENTS}

#### Falhas em Testes Unitários
{UNIT_TEST_FAILURES}

### 🔗 Testes de Integração  
- **Executados:** {INTEGRATION_TESTS_RUN}
- **Passou:** {INTEGRATION_TESTS_PASSED}
- **Falhou:** {INTEGRATION_TESTS_FAILED}
- **Tempo:** {INTEGRATION_EXECUTION_TIME}

#### APIs Testadas
{INTEGRATION_TESTED_APIS}

#### Falhas em Integração
{INTEGRATION_TEST_FAILURES}

### 🏥 Testes Médicos Específicos
- **Executados:** {MEDICAL_TESTS_RUN}
- **Passou:** {MEDICAL_TESTS_PASSED}
- **Falhou:** {MEDICAL_TESTS_FAILED}
- **Precisão:** {MEDICAL_ACCURACY}%

#### Calculadoras de Dose Testadas
{DOSE_CALCULATORS_TESTED}

#### Casos Clínicos Validados
{CLINICAL_CASES_VALIDATED}

#### Falhas Médicas Críticas
{MEDICAL_CRITICAL_FAILURES}

### ♿ Testes de Acessibilidade
- **Executados:** {A11Y_TESTS_RUN}
- **Passou:** {A11Y_TESTS_PASSED}
- **Falhou:** {A11Y_TESTS_FAILED}
- **Score WCAG:** {WCAG_SCORE}%

#### Componentes Acessíveis
{A11Y_COMPLIANT_COMPONENTS}

#### Problemas de Acessibilidade
{A11Y_ISSUES}

### ⚡ Testes de Performance
- **Executados:** {PERFORMANCE_TESTS_RUN}
- **Passou:** {PERFORMANCE_TESTS_PASSED}
- **Falhou:** {PERFORMANCE_TESTS_FAILED}
- **Score médio:** {PERFORMANCE_AVERAGE_SCORE}

#### Métricas Core Web Vitals
- **LCP (Largest Contentful Paint):** {LCP_SCORE}ms
- **FID (First Input Delay):** {FID_SCORE}ms  
- **CLS (Cumulative Layout Shift):** {CLS_SCORE}

#### Performance por Tipo de Usuário
- **Dr. Gasnelio (conexão rápida):** {GASNELIO_PERFORMANCE}
- **GA (conexão móvel):** {GA_PERFORMANCE}

## Análise de Falhas

### 🚨 Falhas Críticas (Bloqueiam Release)
{CRITICAL_FAILURES_ANALYSIS}

### ⚠️ Falhas de Alta Prioridade  
{HIGH_PRIORITY_FAILURES}

### 🔸 Falhas de Média Prioridade
{MEDIUM_PRIORITY_FAILURES}

### 📝 Falhas de Baixa Prioridade
{LOW_PRIORITY_FAILURES}

## Cobertura de Código

### Cobertura Geral
```
{OVERALL_COVERAGE_CHART}
```

### Cobertura por Diretório
| Diretório | Linhas | Funções | Branches | Statements |
|-----------|--------|---------|----------|------------|
{COVERAGE_BY_DIRECTORY_TABLE}

### Arquivos com Baixa Cobertura
{LOW_COVERAGE_FILES}

### Arquivos Não Testados
{UNTESTED_FILES}

## Validações Médicas

### Cálculos de Dosagem
#### Rifampicina (Hanseníase)
- **Testes de dosagem padrão:** {RIFAMPICIN_STANDARD_TESTS}
- **Testes de ajuste por peso:** {RIFAMPICIN_WEIGHT_TESTS}
- **Testes de limites máximos:** {RIFAMPICIN_MAX_TESTS}
- **Validação de interações:** {RIFAMPICIN_INTERACTION_TESTS}

#### Dapsona (Hanseníase)
- **Testes de dosagem padrão:** {DAPSONE_STANDARD_TESTS}
- **Testes pediátricos:** {DAPSONE_PEDIATRIC_TESTS}
- **Validação de contraindicações:** {DAPSONE_CONTRAINDICATION_TESTS}

#### Clofazimina (Hanseníase MB)
- **Testes multibacilar:** {CLOFAZIMINE_MB_TESTS}
- **Testes de duração:** {CLOFAZIMINE_DURATION_TESTS}
- **Validação de efeitos adversos:** {CLOFAZIMINE_ADVERSE_TESTS}

### Classificações Clínicas
- **Teste PB vs MB:** {PB_MB_CLASSIFICATION_TESTS}
- **Validação de critérios:** {CLASSIFICATION_CRITERIA_TESTS}
- **Casos limítrofes:** {BORDERLINE_CASES_TESTS}

### Protocolos de Tratamento
- **Esquemas terapêuticos:** {THERAPEUTIC_SCHEMES_TESTS}
- **Duração do tratamento:** {TREATMENT_DURATION_TESTS}
- **Monitoramento:** {MONITORING_TESTS}

## Conformidade LGPD

### Dados Pessoais
- **Detecção de PII:** {PII_DETECTION_TESTS}
- **Anonimização:** {ANONYMIZATION_TESTS}
- **Consentimento:** {CONSENT_TESTS}

### Dados Médicos Sensíveis
- **Proteção PHI:** {PHI_PROTECTION_TESTS}
- **Criptografia:** {ENCRYPTION_TESTS}
- **Auditoria:** {AUDIT_TESTS}

### Direitos do Titular
- **Acesso aos dados:** {DATA_ACCESS_TESTS}
- **Exclusão de dados:** {DATA_DELETION_TESTS}
- **Portabilidade:** {DATA_PORTABILITY_TESTS}

## Casos de Uso Educacionais

### Cenários do Dr. Gasnelio
- **Consulta de protocolos:** {GASNELIO_PROTOCOL_TESTS}
- **Cálculos avançados:** {GASNELIO_ADVANCED_TESTS}
- **Casos complexos:** {GASNELIO_COMPLEX_TESTS}

### Cenários da GA
- **Aprendizado básico:** {GA_BASIC_LEARNING_TESTS}
- **Simulações práticas:** {GA_SIMULATION_TESTS}
- **Avaliações:** {GA_ASSESSMENT_TESTS}

### Interação entre Personas
- **Mentoria virtual:** {MENTORSHIP_TESTS}
- **Discussão de casos:** {CASE_DISCUSSION_TESTS}

## Performance e Recursos

### Tempo de Carregamento
- **Primeira pintura:** {FIRST_PAINT_TIME}ms
- **Conteúdo principal:** {MAIN_CONTENT_TIME}ms
- **Interatividade:** {INTERACTIVITY_TIME}ms

### Uso de Recursos
- **Memória média:** {AVERAGE_MEMORY_USAGE}MB
- **CPU utilizada:** {CPU_USAGE}%
- **Largura de banda:** {BANDWIDTH_USAGE}MB

### Caching e Otimização
- **Cache hits:** {CACHE_HIT_RATE}%
- **Compressão:** {COMPRESSION_RATIO}
- **Bundle size:** {BUNDLE_SIZE}MB

## Dispositivos e Browsers

### Compatibilidade Testada
| Browser | Versão | Desktop | Mobile | Tablet | Status |
|---------|--------|---------|--------|--------|--------|
{BROWSER_COMPATIBILITY_TABLE}

### Dispositivos Móveis
- **iOS:** {IOS_TEST_RESULTS}
- **Android:** {ANDROID_TEST_RESULTS}
- **Tablets:** {TABLET_TEST_RESULTS}

### Acessibilidade por Dispositivo
- **Leitores de tela:** {SCREEN_READER_TESTS}
- **Navegação por teclado:** {KEYBOARD_NAVIGATION_TESTS}
- **Zoom e contraste:** {ZOOM_CONTRAST_TESTS}

## Segurança

### Testes de Segurança
- **Injection attacks:** {INJECTION_TESTS}
- **XSS prevention:** {XSS_TESTS}
- **CSRF protection:** {CSRF_TESTS}
- **Authentication:** {AUTH_TESTS}

### Vulnerabilidades
- **Críticas:** {CRITICAL_VULNERABILITIES}
- **Altas:** {HIGH_VULNERABILITIES}  
- **Médias:** {MEDIUM_VULNERABILITIES}
- **Baixas:** {LOW_VULNERABILITIES}

### Audit de Dependências
- **Packages seguros:** {SECURE_PACKAGES}
- **Packages vulneráveis:** {VULNERABLE_PACKAGES}
- **Atualizações necessárias:** {UPDATES_NEEDED}

## Comparativo Histórico

### Tendência de Qualidade
```
{QUALITY_TREND_CHART}
```

### Métricas vs Versão Anterior
| Métrica | Anterior | Atual | Variação |
|---------|----------|-------|----------|
| Taxa de sucesso | {PREV_SUCCESS_RATE}% | {CURRENT_SUCCESS_RATE}% | {SUCCESS_TREND} |
| Cobertura | {PREV_COVERAGE}% | {CURRENT_COVERAGE}% | {COVERAGE_TREND} |
| Performance | {PREV_PERFORMANCE} | {CURRENT_PERFORMANCE} | {PERFORMANCE_TREND} |
| Acessibilidade | {PREV_A11Y}% | {CURRENT_A11Y}% | {A11Y_TREND} |

### Regressões Identificadas
{REGRESSIONS_IDENTIFIED}

### Melhorias Conquistadas
{IMPROVEMENTS_ACHIEVED}

## Recomendações

### 🔴 Ações Urgentes (Críticas)
{CRITICAL_RECOMMENDATIONS}

### 🟡 Melhorias Importantes
{IMPORTANT_IMPROVEMENTS}

### 🟢 Otimizações Sugeridas
{SUGGESTED_OPTIMIZATIONS}

### 📚 Melhorias Educacionais
{EDUCATIONAL_IMPROVEMENTS}

## Próximos Passos

### Correções Planejadas
- **Sprint atual:** {CURRENT_SPRINT_FIXES}
- **Próxima sprint:** {NEXT_SPRINT_FIXES}
- **Backlog:** {BACKLOG_FIXES}

### Melhorias de Teste
- **Novos cenários:** {NEW_TEST_SCENARIOS}
- **Automação adicional:** {ADDITIONAL_AUTOMATION}
- **Ferramentas:** {NEW_TESTING_TOOLS}

### Monitoramento Contínuo
- **Alertas configurados:** {CONFIGURED_ALERTS}
- **Dashboard de qualidade:** {QUALITY_DASHBOARD_URL}
- **Relatórios automáticos:** {AUTOMATED_REPORTS}

## Apêndices

### A. Log Completo de Execução
```
{FULL_EXECUTION_LOG}
```

### B. Configuração dos Testes
```yaml
{TEST_CONFIGURATION}
```

### C. Ambiente de Teste
```
{TEST_ENVIRONMENT_DETAILS}
```

### D. Dados de Teste Médico
```json
{MEDICAL_TEST_DATA}
```

### E. Screenshots de Falhas
{FAILURE_SCREENSHOTS}

### F. Relatórios de Performance
{PERFORMANCE_REPORTS}

---

**Relatório gerado em:** {REPORT_GENERATION_DATE}  
**Ferramenta de testes:** {TESTING_TOOL}  
**Versão do runner:** {RUNNER_VERSION}  
**Gerado por:** {GENERATED_BY}

> 🏥 **Nota Médica:** Este relatório inclui validações específicas para conteúdo educacional sobre hanseníase. Todas as validações médicas seguem protocolos do Ministério da Saúde e diretrizes da OMS.

> 📊 **Qualidade:** Taxa de sucesso mínima exigida: 95%. Cobertura mínima: 80%. Performance: LCP < 2.5s, FID < 100ms.

> ♿ **Acessibilidade:** Conformidade obrigatória com WCAG 2.1 AA para garantir acesso universal ao conhecimento médico sobre hanseníase.

> 🛡️ **LGPD:** Todos os testes incluem verificações de conformidade com a Lei Geral de Proteção de Dados, especialmente para dados médicos sensíveis.