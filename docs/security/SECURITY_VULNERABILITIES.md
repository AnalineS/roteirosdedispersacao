# [SECURITY] Registro de Vulnerabilidades de Segurança

## [LIST] Status Atual

**Última Atualização**: 2024-08-24  
**Próxima Revisão**: 2024-09-24  
**Responsável**: Equipe de Segurança

## [OK] Vulnerabilidades Corrigidas (Agosto 2024)

| Pacote | Versão Anterior | Versão Atual | CVE/ID | Severidade | Data Correção |
|--------|----------------|--------------|---------|------------|---------------|
| Flask-CORS | 4.0.0 | 6.0.0 | CVE-2024-6221, CVE-2024-6839, CVE-2024-6844, CVE-2024-6866 | High/Medium | 2024-08-24 |
| cryptography | 43.0.3 | 44.0.1 | CVE-2024-26130 | Medium | 2024-08-24 |
| requests | 2.31.0 | 2.32.4 | CVE-2023-32681 | Medium | 2024-08-24 |
| gunicorn | 21.2.0 | 23.0.0 | CVE-2024-6827 | Medium | 2024-08-24 |
| sentence-transformers | 2.7.0 | 3.1.0 | Multiple CVEs | High | 2024-08-24 |

## [WARNING] Vulnerabilidades Aceitas (Risco Gerenciado)

### PyTorch (via easyocr)

| ID Vulnerabilidade | Severidade | Descrição | Mitigação | Prazo Revisão |
|-------------------|------------|-----------|-----------|---------------|
| SNYK-PYTHON-TORCH-10332643 | Medium | Improper Resource Shutdown | Monitoramento de recursos | 2025-02-28 |
| SNYK-PYTHON-TORCH-10332644 | High | Buffer Overflow | Input validation reforçada | 2025-02-28 |
| SNYK-PYTHON-TORCH-10332645 | Medium | Buffer Overflow | Limite de tamanho de arquivo | 2025-02-28 |
| SNYK-PYTHON-TORCH-10337825 | Medium | Memory Management | Garbage collection otimizado | 2025-02-28 |
| SNYK-PYTHON-TORCH-10337826 | Medium | Out-of-bounds Write | Validação de índices | 2025-02-28 |
| SNYK-PYTHON-TORCH-10337828 | Medium | Out-of-bounds Write | Sanitização de entrada | 2025-02-28 |
| SNYK-PYTHON-TORCH-10337834 | Medium | Out-of-bounds Write | Limite de processamento | 2025-02-28 |

### Justificativa para Aceitação
- **Dependência Indireta**: torch é dependência do easyocr, usado para OCR em documentos médicos
- **Sem Patch Disponível**: PyTorch team está ciente mas ainda não liberou correção
- **Ambiente Controlado**: HML com acesso restrito, sem dados sensíveis de produção
- **Mitigações Implementadas**: Validação de entrada, limites de arquivo, monitoramento

## [REPORT] Métricas de Segurança

```yaml
Total de Vulnerabilidades Identificadas: 16
Corrigidas: 9 (56%)
Aceitas com Mitigação: 7 (44%)
Críticas Pendentes: 0
Alta Severidade Pendentes: 2 (com mitigação)
```

## 🔄 Processo de Revisão

### Histórico de Decisões

| Data | Decisão | Responsável | Motivo |
|------|---------|-------------|--------|
| 2024-08-24 | Flask-CORS security upgrade | Ana | 4 CVEs críticos corrigidos |
| 2024-08-24 | Requirements consolidation | Ana | Eliminar conflitos de versão |
| 2024-08-24 | Aceitar torch vulnerabilities | Ana | Sem patch, risco baixo em HML |
| **2025-08-24** | **Fechar Snyk PR #5** | **Ana** | **Atualização já implementada manualmente** |

### Revisão Mensal (Dia 21)
1. Verificar atualizações do PyTorch
2. Executar Snyk scan completo
3. Revisar novas vulnerabilidades
4. Atualizar este documento
5. **Validar consistência de dependências**

### Critérios para Aceitação de Risco
- [ ] Sem patch disponível do upstream
- [ ] Impacto limitado ao ambiente HML
- [ ] Mitigações implementadas e documentadas
- [ ] Prazo máximo de 3 meses para revisão
- [ ] Aprovação do responsável técnico

## 📢 Alertas e Notificações

### GitHub Actions Workflow
- **Arquivo**: `.github/workflows/security-check.yml`
- **Frequência**: Semanal (Segundas 09:00)
- **Ações**: Scan automático e notificação se patches disponíveis

### Configuração Snyk
- **Monitor Contínuo**: Habilitado
- **Alertas**: Email para equipe quando patches disponíveis
- **Auto-PR**: Habilitado para patches de segurança

## [NOTE] Histórico de Decisões

| Data | Decisão | Responsável | Motivo |
|------|---------|-------------|--------|
| 2024-08-24 | Flask-CORS security upgrade | Ana | 4 CVEs críticos corrigidos |
| 2024-08-24 | Requirements consolidation | Ana | Eliminar conflitos de versão |
| 2024-08-24 | Aceitar torch vulnerabilities | Ana | Sem patch, risco baixo em HML |

## [ALERT] Ações Requeridas

### Imediatas (Próximos 7 dias)
- [x] Configurar workflow de verificação semanal
- [x] Adicionar .snyk policy para ignorar temporariamente
- [ ] Implementar testes de segurança adicionais

### Médio Prazo (Próximo mês)
- [ ] Avaliar alternativas ao easyocr se patches não disponíveis
- [ ] Implementar WAF adicional para mitigar buffer overflow
- [ ] Revisar política de upload de arquivos

### Longo Prazo (Próximos 3 meses)
- [ ] Migrar para alternativa se PyTorch não corrigir
- [ ] Implementar scanning de container images
- [ ] Auditoria completa de segurança

## 📧 Contatos

- **Segurança**: security@roteirosdedispensacao.com
- **DevOps**: devops@roteirosdedispensacao.com
- **Snyk Dashboard**: https://app.snyk.io/org/sousa.analine

---

*Este documento é atualizado automaticamente pelo workflow de segurança e revisado manualmente mensalmente.*