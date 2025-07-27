# 📋 PLANO DE REORGANIZAÇÃO DO REPOSITÓRIO

## 🎯 Objetivo
Reorganizar a estrutura do repositório para evitar confusão de desenvolvedores e facilitar manutenção.

## 🚨 PROBLEMAS IDENTIFICADOS

### 1. Backend Confuso
- ❌ `src/backend/app.py` (principal)
- ❌ `src/backend/app_simple.py` (teste)
- ❌ `src/backend/app_complete.py` (teste)
- ❌ `src/frontend/app.py` (arquivo perdido)

### 2. Relatórios de Teste Excessivos
- ❌ 9 relatórios em `tests/scientific_quality/`
- ❌ Testes duplicados (flexible vs rigorous)

### 3. Estrutura Não Clara
- ❌ Arquivos de configuração misturados
- ❌ Falta de documentação clara sobre qual arquivo usar

## ✅ SOLUÇÃO PROPOSTA

### 1. Backend Reorganizado
```
src/backend/
├── main.py                    (app principal - renomeado de app.py)
├── development/
│   ├── app_simplified.py      (renomeado de app_simple.py)
│   └── app_enhanced.py        (renomeado de app_complete.py)
└── services/ (mantido)
```

### 2. Testes Científicos Limpos
```
tests/scientific_quality/
├── reports/
│   ├── final_validation_report.md    (consolidado principal)
│   └── archived/                      (relatórios antigos)
├── test_scientific_validation.py     (consolidado)
└── development/
    ├── test_flexible_criteria.py
    └── test_rigorous_criteria.py
```

### 3. Documentação Clara
- README atualizado com estrutura
- Guia de desenvolvimento
- Instruções claras sobre qual arquivo usar

## 🔄 AÇÕES A EXECUTAR
1. Renomear arquivos backend
2. Mover relatórios para subpastas
3. Consolidar testes científicos
4. Remover arquivo frontend/app.py incorreto
5. Atualizar todas as referências
6. Criar documentação clara