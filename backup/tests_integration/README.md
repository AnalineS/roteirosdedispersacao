# [TEST] Testes de Qualidade Científica

## 📁 Estrutura Organizada

### Arquivo Principal
- **`test_scientific_validation.py`** - Teste principal consolidado
  - Execute este arquivo para validação científica completa
  - Compara diferentes backends e gera relatórios

### Pasta Reports
- **`reports/final_validation_report.md`** - Relatório principal atual
- **`reports/latest_validation_report.md`** - Último relatório gerado
- **`reports/archived/`** - Relatórios históricos arquivados

### Pasta Development
- **`development/test_flexible_criteria.py`** - Testes com critérios flexíveis
  - Para desenvolvimento e testes básicos
  - Critérios de 50-70% de precisão
  
- **`development/test_rigorous_criteria.py`** - Testes com critérios rigorosos
  - Para certificação clínica
  - Critérios de 90-95% de precisão

## [START] Como Usar

### Validação Científica Completa
```bash
cd tests/scientific_quality
python test_scientific_validation.py
```

### Testes de Desenvolvimento
```bash
cd tests/scientific_quality/development
python test_flexible_criteria.py
```

### Testes para Certificação Clínica
```bash
cd tests/scientific_quality/development
python test_rigorous_criteria.py
```

## [REPORT] Tipos de Teste

1. **Precisão Científica** - Validação de dosagens e protocolos médicos
2. **Consistência de Personas** - Dr. Gasnelio (técnico) vs Gá (empático)
3. **Detecção de Escopo** - Identificação de perguntas dentro/fora do escopo
4. **Qualidade das Respostas** - Completude, clareza e precisão

## 📈 Critérios de Aprovação

### Desenvolvimento (Flexível)
- Precisão Científica: ≥ 50%
- Consistência de Personas: ≥ 50%
- Detecção de Escopo: ≥ 70%

### Certificação Clínica (Rigoroso)
- Precisão Científica: ≥ 90%
- Consistência de Personas: ≥ 80%
- Detecção de Escopo: ≥ 85%

## [LIST] Relatórios

Os relatórios são salvos automaticamente em `reports/` com timestamp e classificação do backend testado.