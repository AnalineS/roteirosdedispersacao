# Prompt para Otimização e Refatoramento de Código - Claude Code

## Objetivo
Analise e otimize o código do projeto atual, focando em performance, manutenibilidade, legibilidade e boas práticas de desenvolvimento.

## Escopo de Análise

### 1. **Análise de Performance**
- Identifique gargalos de performance e complexidade algorítmica
- Analise uso de estruturas de dados inadequadas
- Detecte consultas N+1 ou queries ineficientes
- Identifique oportunidades de cache e memoização
- Revise loops aninhados e operações custosas

### 2. **Refatoração de Código**
- Elimine código duplicado (DRY - Don't Repeat Yourself)
- Simplifique condicionais complexas usando early return
- Refatore métodos longos em funções menores e específicas
- Aplique design patterns apropriados (Strategy, Builder, Factory, etc.)
- Melhore nomenclatura de variáveis, métodos e classes

### 3. **Otimização de Estruturas**
- Substitua collections inadequadas por mais eficientes
- Implemente lazy loading onde apropriado
- Otimize imports e dependências desnecessárias
- Revise configurações de pools de conexão
- Analise uso de recursos (memória, CPU, I/O)

### 4. **Boas Práticas e Clean Code**
- Aplique princípios SOLID
- Melhore tratamento de erros e exceções
- Adicione validações fail-fast
- Revise logs e monitoramento
- Garanta thread-safety onde necessário

### 5. **Segurança e Confiabilidade**
- Identifique vulnerabilidades potenciais
- Revise validação de inputs
- Analise gerenciamento de transações
- Verifique tratamento de dados sensíveis
- Garanta auditoria adequada (especialmente para sistemas médicos/financeiros)

## Instruções Específicas

### **Para Cada Arquivo Analisado:**
1. **Documente o problema encontrado** com explicação clara
2. **Proponha a solução** com código refatorado
3. **Explique o benefício** da mudança (performance, manutenibilidade, etc.)
4. **Estime o impacto** (baixo/médio/alto) da otimização

### **Priorize por:**
1. **Crítico:** Bugs, vulnerabilidades de segurança, vazamentos de memória
2. **Alto:** Gargalos de performance, código duplicado extenso
3. **Médio:** Melhorias de legibilidade, aplicação de patterns
4. **Baixo:** Otimizações menores, nomenclatura

### **Formato de Output:**
Para cada otimização, forneça:
```
## [PRIORIDADE] - Arquivo: caminho/do/arquivo.linguagem
**Problema:** Descrição do issue encontrado
**Solução:** Explicação da otimização proposta
**Benefício:** Melhoria esperada (performance/manutenibilidade/segurança)
**Impacto:** Estimativa de tempo/esforço para implementar

### Código Atual:
```java
// código problemático
```

### Código Otimizado:
```java
// código refatorado
```

### Justificativa:
Explicação técnica detalhada da melhoria
```

## Contextos Específicos

### **Se for Sistema Médico/Hospitalar:**
- Priorize confiabilidade e auditoria sobre performance extrema
- Foque em validação rigorosa de dados médicos
- Garanta conformidade com LGPD, HIPAA, CFM 2.314/2022, ANVISA RDC 4/2009, PCDT Hanseníase 2022: Validação de protocolos
- Otimize cálculos médicos frequentes (IMC, dosagens, etc.)

### **Se for E-commerce/Financeiro:**
- Priorize segurança de transações
- Otimize queries de produtos/catálogos
- Implemente cache inteligente para consultas frequentes
- Garanta atomicidade em operações financeiras

### **Se for Sistema de Alta Escala:**
- Foque em otimizações de concorrência
- Implemente padrões assíncronos onde apropriado
- Otimize uso de memória e garbage collection
- Considere padrões de microservices

## Checklist de Verificação

### **Performance:**
- [ ] Algoritmos com complexidade adequada (evitar O(n²) desnecessário)
- [ ] Estruturas de dados eficientes (HashMap vs ArrayList para buscas)
- [ ] Cache implementado em operações custosas
- [ ] Queries otimizadas com índices apropriados
- [ ] Lazy loading em relacionamentos pesados

### **Código Limpo:**
- [ ] Métodos com responsabilidade única
- [ ] Nomenclatura clara e descritiva
- [ ] Eliminação de código morto
- [ ] Constantes extraídas de números mágicos
- [ ] Comentários apenas onde necessário

### **Arquitetura:**
- [ ] Separação adequada de responsabilidades
- [ ] Baixo acoplamento entre módulos
- [ ] Inversão de dependências onde apropriado
- [ ] Tratamento consistente de erros
- [ ] Logs estruturados e informativos

### **Segurança:**
- [ ] Validação de todos os inputs
- [ ] Sanitização de dados de saída
- [ ] Uso adequado de transações
- [ ] Não exposição de informações sensíveis em logs
- [ ] Criptografia de dados sensíveis

## Comandos Sugeridos

Execute estas análises em sequência:

1. **Análise geral do projeto:**
   ```bash
   find . -name "*.java" -exec wc -l {} + | sort -n
   ```

2. **Identifique arquivos grandes (>500 linhas):**
   ```bash
   find . -name "*.java" -exec sh -c 'wc -l "$1" | grep -E "^[5-9][0-9][0-9]|^[0-9]{4,}"' _ {} \;
   ```

3. **Procure por code smells comuns:**
   - Métodos longos (>50 linhas)
   - Classes com muitas responsabilidades (>20 métodos)
   - Aninhamento excessivo (>4 níveis)
   - Uso de instanceof excessivo

## Entregáveis Esperados

1. **Relatório de Análise** com problemas priorizados
2. **Código Refatorado** para issues críticos e altos
3. **Guia de Implementação** com passos para aplicar as mudanças
4. **Testes** para validar que as otimizações não quebraram funcionalidades
5. **Documentação** de padrões e convenções estabelecidas

## Considerações Finais

- **Teste sempre** após cada refatoração
- **Meça o impacto** das otimizações com benchmarks
- **Documente** as decisões arquiteturais tomadas
- **Mantenha** compatibilidade com versões existentes
- **Priorize** mudanças que trazem maior valor com menor risco

