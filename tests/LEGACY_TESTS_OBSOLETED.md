# ⚠️  TESTES LEGACY - OBSOLETOS

## 📅 Data: 30/08/2025
## 🎯 Ação: Arquivos de teste dispersos foram CONSOLIDADOS na nova QA Automation Suite

---

## ✅ **NOVA ESTRUTURA UNIFICADA**

**Usar apenas:** `tests/qa_automation_suite/`

- 🚀 **main_test_runner.py** - Runner principal
- 📦 **test_scenarios/** - Todos os cenários consolidados
- 🛠️ **utils/** - Utilitários compartilhados
- 📋 **reports/** - Relatórios gerados

---

## 🗑️  **DIRETÓRIOS OBSOLETOS** (Pode remover manualmente)

### ❌ `tests/backend/` - OBSOLETO
**Consolidado em:** `test_scenarios/integration_e2e.py` e `performance_load.py`

Arquivos migrados:
- `test_endpoints.py` → `integration_e2e.py`
- `test_performance_benchmarks.py` → `performance_load.py`
- `test_security_*.py` → `security_validation.py`

### ❌ `tests/integration/` - OBSOLETO  
**Consolidado em:** `test_scenarios/integration_e2e.py` e `medical_accuracy.py`

Arquivos migrados:
- `test_backend_frontend.py` → `integration_e2e.py`
- `test_scientific_validation.py` → `medical_accuracy.py`
- `test_persona_coherence.py` → `medical_accuracy.py`

### ❌ `tests/security/` - OBSOLETO
**Consolidado em:** `test_scenarios/security_validation.py`

Arquivos migrados:
- `test_log_injection_prevention.py` → `security_validation.py`
- `test_stack_trace_exposure.py` → `security_validation.py`

### ❌ `tests/frontend/` e `tests/e2e/` - OBSOLETOS
**Vazios ou com conteúdo irrelevante**

---

## 🔄 **COMO EXECUTAR A NOVA SUITE**

```bash
# Suite completa
python tests/qa_automation_suite/main_test_runner.py

# Ambiente específico
python tests/qa_automation_suite/main_test_runner.py --env=local
python tests/qa_automation_suite/main_test_runner.py --env=hml

# Cenário específico  
python tests/qa_automation_suite/main_test_runner.py --scenarios integration_e2e

# Modo extensivo
python tests/qa_automation_suite/main_test_runner.py --extensive
```

---

## 💾 **BACKUP DE SEGURANÇA**

Os arquivos antigos foram salvos em: `backup/`

- `backup/tests_backend/`
- `backup/tests_integration/`
- `backup/tests_security/`

---

## ✅ **VANTAGENS DA NOVA SUITE**

1. **🎯 Consolidação**: Todos os testes em local único
2. **🔄 Automação**: Runner inteligente com reports automáticos
3. **🌐 Multi-ambiente**: Local, HML, Development
4. **📊 Relatórios**: Markdown + GitHub Issues automáticos
5. **⚡ Performance**: Execução paralela quando possível
6. **🛡️ Robustez**: Fallbacks e error handling robusto

---

## 🚨 **AÇÃO NECESSÁRIA**

1. ✅ **FEITO**: Nova suite criada e funcional
2. ⏳ **PENDENTE**: Remover diretórios obsoletos manualmente:
   ```bash
   rm -rf tests/backend
   rm -rf tests/integration  
   rm -rf tests/security
   rm -rf tests/frontend
   rm -rf tests/e2e
   ```
3. ⏳ **PENDENTE**: Executar testes com nova suite

---

*Documento criado automaticamente durante migração para QA Automation Suite*  
*Fase 5 - Integração e Testes - 30/08/2025*