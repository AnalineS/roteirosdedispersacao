# Guia de Onboarding - Fase 3
## Plataforma Educacional Médica sobre Hanseníase

**Versão:** 3.0.0  
**Data:** 06/09/2025  
**Objetivo:** Integração rápida e eficiente de novos desenvolvedores

---

## 🎯 Bem-vindo à Equipe!

Este guia foi projetado para integrar novos desenvolvedores ao projeto de plataforma educacional médica sobre hanseníase, garantindo compreensão completa dos workflows, ferramentas e padrões médicos específicos.

### 🏥 Contexto do Projeto

**O que estamos construindo:**
- Plataforma educacional para profissionais de saúde sobre hanseníase
- Foco em farmacêuticos e médicos
- Conformidade total com LGPD para dados médicos
- Acessibilidade WCAG 2.1 AA obrigatória

**Personas Educacionais:**
- **Dr. Gasnelio:** Médico experiente, precisa de informações avançadas e atualizadas
- **GA:** Farmacêutico jovem, necessita de aprendizado guiado e explicações detalhadas

### 📋 Checklist de Onboarding (Complete em ordem)

#### Fase 1: Configuração do Ambiente (Dia 1)
- [ ] Clonar repositório e configurar ambiente local
- [ ] Instalar dependências: `npm install`
- [ ] Executar verificação LGPD: `node .claude/automation/lgpd-compliance-checker.js`
- [ ] Configurar hooks do Git (ver seção específica)
- [ ] Executar suite de testes: `npm test`
- [ ] Revisar documentação de arquitetura: `docs/ARQUITETURA_ATUAL_2025.md`

#### Fase 2: Compreensão do Domínio Médico (Dia 2)
- [ ] Estudar características da hanseníase (PB/MB)
- [ ] Compreender calculadoras médicas implementadas
- [ ] Revisar casos clínicos das personas
- [ ] Entender protocolos do Ministério da Saúde
- [ ] Familiarizar-se com terminologia médica usada

#### Fase 3: Ferramentas e Workflows (Dia 3)
- [ ] Praticar slash commands (`/commit`, `/check`, `/create-docs`)
- [ ] Usar sistema de automação avançada
- [ ] Executar verificações de conformidade
- [ ] Testar sistema de monitoramento
- [ ] Revisar templates de documentação

#### Fase 4: Primeira Contribuição (Dia 4-5)
- [ ] Escolher issue de bom primeiro contribution
- [ ] Implementar solução seguindo padrões médicos
- [ ] Executar todas as verificações automáticas
- [ ] Criar PR usando ferramentas do projeto
- [ ] Passar por review com mentor designado

---

## 🚀 Configuração Inicial

### 1. Ambiente de Desenvolvimento

```bash
# Clone do repositório
git clone [URL_DO_REPOSITORIO]
cd [NOME_DO_PROJETO]

# Configuração de ambiente
cp .env.example .env.local
# Edite .env.local com suas configurações

# Instalação de dependências
npm install

# Verificação inicial
npm run lint
npm test
npm run build
```

### 2. Configuração dos Hooks do Git

```bash
# Copiar hooks especializados
cp .claude/hooks/pre-commit-medical-validation.js .git/hooks/pre-commit
cp .claude/hooks/pre-push-compliance-check.js .git/hooks/pre-push
cp .claude/hooks/post-merge-doc-update.js .git/hooks/post-merge

# Tornar executáveis (Linux/Mac)
chmod +x .git/hooks/pre-commit
chmod +x .git/hooks/pre-push
chmod +x .git/hooks/post-merge

# Teste dos hooks
git add .
git commit -m "test: verificando hooks médicos"
```

### 3. Verificação de Conformidade

```bash
# Executar verificação LGPD completa
node .claude/automation/lgpd-compliance-checker.js

# Gerar documentação automática
node .claude/automation/auto-documentation.js

# Iniciar monitoramento (em outro terminal)
node .claude/automation/continuous-monitoring-system.js
```

---

## 🏥 Contexto Médico Essencial

### Hanseníase - Informações Básicas

**Definição:**
- Doença infecciosa crônica causada pelo Mycobacterium leprae
- Afeta principalmente pele, nervos periféricos, mucosa e olhos
- Doença negligenciada com alto potencial educacional

**Classificações Principais:**
1. **Paucibacilar (PB):** Até 5 lesões, baciloscopia negativa
2. **Multibacilar (MB):** Mais de 5 lesões, baciloscopia positiva

**Tratamento (PQT - Poliquimioterapia):**
- **PB:** Rifampicina + Dapsona (6 meses)
- **MB:** Rifampicina + Dapsona + Clofazimina (12 meses)

### Calculadoras Implementadas

1. **Calculadora de Dosagem de Rifampicina**
   - Input: peso, idade, classificação (PB/MB)
   - Output: dose exata com alertas de segurança
   - Validação: limites mínimos e máximos por protocolo MS

2. **Calculadora de Esquema PQT**
   - Input: classificação, peso, comorbidades
   - Output: esquema completo de tratamento
   - Alertas: interações medicamentosas

3. **Interpretador de Baciloscopia**
   - Input: índices baciloscopicos
   - Output: interpretação padronizada OMS
   - Correlação: classificação clínica automatizada

### Personas Educacionais

#### Dr. Gasnelio (Médico Experiente)
**Características:**
- 15+ anos de experiência
- Precisa de informações avançadas rapidamente
- Foco em casos complexos e atualizações científicas
- Interface analítica com métricas detalhadas

**Necessidades técnicas:**
- Performance otimizada (< 2s LCP)
- Calculadoras avançadas com múltiplas variáveis
- Acesso rápido a literatura científica
- Dashboard com métricas de pacientes

#### GA (Farmacêutico Jovem)
**Características:**
- Recém-formado ou com pouca experiência
- Aprendizado guiado com explicações detalhadas
- Necessita de glossário médico integrado
- Interface didática com progressão clara

**Necessidades técnicas:**
- Tutoriais interativos passo-a-passo
- Explicações contextuais em tempo real
- Casos clínicos progressivos
- Feedback constante sobre aprendizado

---

## 🛠️ Ferramentas e Comandos

### Slash Commands Disponíveis

#### `/commit` - Commit Inteligente
```bash
# Executa verificações automáticas e cria commit
/commit "feat: adiciona calculadora de dapsona"

# Verificações incluídas:
# - Dados médicos sensíveis
# - Precisão de cálculos
# - Conformidade LGPD
# - Acessibilidade
```

#### `/check` - Verificação Completa
```bash
# Executa todas as verificações de qualidade
/check

# Inclui:
# - Lint médico especializado
# - Testes de precisão clínica
# - Conformidade regulatória
# - Performance por persona
```

#### `/create-docs` - Documentação Automática
```bash
# Gera documentação médica especializada
/create-docs api/calculadoras/rifampicina

# Produz:
# - Documentação de API médica
# - Casos de uso por persona
# - Validações farmacológicas
# - Referências científicas
```

#### `/context-prime` - Contexto Médico
```bash
# Prepara contexto para assistente IA
/context-prime hanseniase

# Carrega:
# - Protocolos médicos atuais
# - Casos clínicos relevantes
# - Personas educacionais
# - Padrões de qualidade
```

#### `/tdd` - Desenvolvimento Orientado por Testes
```bash
# Cria testes médicos especializados
/tdd calculadora-dosagem

# Gera:
# - Testes de precisão médica
# - Casos limite por protocolo
# - Validação de segurança
# - Cenários por persona
```

### Scripts de Automação

#### Sistema LGPD
```bash
# Verificação completa de conformidade
node .claude/automation/lgpd-compliance-checker.js

# Gera relatório com:
# - Score de conformidade (0-100)
# - Violações críticas
# - Dados sensíveis detectados
# - Recomendações específicas
```

#### Auto-documentação
```bash
# Geração automática de docs médicas
node .claude/automation/auto-documentation.js

# Produz:
# - API docs com validações médicas
# - Casos de uso por persona
# - Glossário de hanseníase
# - Referências científicas
```

#### Monitoramento Contínuo
```bash
# Iniciar dashboard de qualidade médica
node .claude/automation/continuous-monitoring-system.js

# Monitora em tempo real:
# - Segurança de dados médicos
# - Performance por persona
# - Acessibilidade WCAG 2.1 AA
# - Precisão de calculadoras
```

---

## 🎓 Padrões de Desenvolvimento

### Estrutura de Arquivos

```
src/
├── components/
│   ├── medical/              # Componentes médicos específicos
│   │   ├── calculators/      # Calculadoras validadas
│   │   ├── cases/            # Casos clínicos
│   │   └── personas/         # Interfaces por persona
│   ├── common/               # Componentes comuns
│   └── accessibility/        # Componentes de acessibilidade
├── pages/
│   ├── dr-gasnelio/          # Interface para médico experiente
│   ├── ga-learning/          # Interface para farmacêutico jovem
│   └── api/
│       └── medical/          # APIs médicas com validação
├── utils/
│   ├── medical/              # Utilitários médicos
│   ├── lgpd/                 # Funções de conformidade
│   └── accessibility/        # Helpers de acessibilidade
└── tests/
    ├── medical/              # Testes de precisão médica
    ├── personas/             # Testes por persona
    └── compliance/           # Testes de conformidade
```

### Convenções de Nomenclatura

#### Componentes Médicos
```typescript
// Calculadoras médicas
CalculadoraRifampicina.tsx
CalculadoraEsquemaPQT.tsx
InterpretadorBaciloscopia.tsx

// Casos clínicos
CasoClinicoBasico.tsx
CasoClinicoAvancado.tsx
CenarioEducacional.tsx

// Por persona
DrGasnelioInterface.tsx
GALearningPath.tsx
```

#### APIs Médicas
```typescript
// Endpoints médicos
/api/medical/calculators/rifampicina
/api/medical/cases/paucibacilar
/api/medical/validation/dosagem

// Padrão de resposta
{
  "data": {...},
  "medical_validation": {
    "accuracy": 99.5,
    "protocol_compliance": true,
    "safety_alerts": []
  },
  "lgpd_compliance": {
    "personal_data": false,
    "consent_required": false
  }
}
```

#### Testes Médicos
```typescript
// Testes de calculadoras
rifampicina.accuracy.test.ts
esquema-pqt.safety.test.ts
baciloscopia.interpretation.test.ts

// Testes por persona
dr-gasnelio.performance.test.ts
ga.learning-flow.test.ts
```

### Padrões de Código Médico

#### Validação de Calculadoras
```typescript
interface MedicalCalculation {
  input: {
    weight: number;
    age: number;
    classification: 'PB' | 'MB';
  };
  output: {
    dosage: number;
    frequency: string;
    duration: number;
    safetyAlerts: string[];
  };
  validation: {
    accuracy: number;
    protocolCompliance: boolean;
    ministerioSaudeApproved: boolean;
  };
}

// Exemplo de implementação
const calculateRifampicinaDosage = (input: MedicalInput): MedicalCalculation => {
  // 1. Validar entrada conforme protocolo MS
  validateProtocolCompliance(input);
  
  // 2. Calcular dosagem com precisão médica
  const dosage = calculateAccurateDosage(input);
  
  // 3. Verificar limites de segurança
  const safetyAlerts = checkSafetyLimits(dosage, input);
  
  // 4. Validar resultado final
  const validation = validateResult(dosage, input);
  
  return { input, output: { dosage, ... }, validation };
};
```

#### Conformidade LGPD
```typescript
// Verificação automática de dados sensíveis
const checkMedicalDataCompliance = (data: any) => {
  const sensitiveFields = ['cpf', 'rg', 'cns', 'crm', 'crf'];
  const violations = [];
  
  for (const field of sensitiveFields) {
    if (containsSensitiveData(data, field)) {
      violations.push({
        field,
        severity: 'CRITICAL',
        action: 'ANONYMIZE_OR_REMOVE'
      });
    }
  }
  
  return { compliant: violations.length === 0, violations };
};
```

#### Acessibilidade Médica
```typescript
// Componente acessível para leitores de tela médicos
const AccessibleMedicalCalculator = () => {
  return (
    <div role="region" aria-label="Calculadora de Dosagem de Rifampicina">
      <h2 id="calc-title">Calculadora de Rifampicina</h2>
      
      <form aria-describedby="calc-description">
        <p id="calc-description">
          Esta calculadora determina a dosagem correta de rifampicina
          baseada no peso, idade e classificação da hanseníase.
        </p>
        
        <div className="input-group">
          <label htmlFor="weight">Peso do paciente (kg):</label>
          <input
            id="weight"
            type="number"
            min="1"
            max="200"
            aria-describedby="weight-help"
            required
          />
          <div id="weight-help" className="help-text">
            Insira o peso em quilogramas (1-200 kg)
          </div>
        </div>
        
        <button type="submit" aria-describedby="calc-result">
          Calcular Dosagem
        </button>
      </form>
      
      <div id="calc-result" aria-live="polite" role="status">
        {/* Resultado será anunciado automaticamente */}
      </div>
    </div>
  );
};
```

---

## 🎯 Objetivos de Qualidade

### Métricas Obrigatórias

#### Precisão Médica
- **Calculadoras:** 99%+ de precisão
- **Casos clínicos:** 100% validados por especialista
- **Protocolos:** Conformidade total com MS/ANVISA/OMS

#### Performance por Persona
- **Dr. Gasnelio:** LCP < 2s, FID < 100ms
- **GA:** LCP < 3s com explicações detalhadas
- **Geral:** 95%+ PWA scores

#### Conformidade
- **LGPD:** 100% conformidade para dados médicos
- **WCAG 2.1 AA:** 90%+ compliance score
- **Segurança:** Zero violações críticas

#### Cobertura de Testes
- **Calculadoras médicas:** 95%+ cobertura
- **APIs críticas:** 90%+ cobertura
- **Cenários por persona:** 80%+ cobertura

### Thresholds de Bloqueio

**Bloqueiam deploy:**
- Precisão de calculadora < 95%
- Dados médicos sensíveis expostos
- Violações críticas de LGPD
- Acessibilidade < 80%

**Bloqueiam merge:**
- Testes médicos falhando
- Lint médico com erros
- Performance degradada > 20%
- Documentação médica faltante

---

## 📚 Recursos de Aprendizado

### Documentação Médica
- [Protocolo MS - Hanseníase 2024](interno)
- [Diretrizes OMS - Eliminação da Hanseníase](interno)
- [RDC ANVISA - Nomenclatura de Medicamentos](interno)

### Tutoriais Específicos
- [Como criar calculadora médica validada](./tutorials/medical-calculator.md)
- [Implementando casos clínicos educacionais](./tutorials/clinical-cases.md)
- [Guia de acessibilidade médica](./tutorials/medical-accessibility.md)
- [Conformidade LGPD para dados de saúde](./tutorials/health-data-lgpd.md)

### Exemplos de Código
```typescript
// Localização dos exemplos
src/examples/
├── calculators/          # Calculadoras médicas exemplo
├── personas/             # Implementação de personas
├── accessibility/        # Padrões de acessibilidade
└── compliance/           # Exemplos de conformidade
```

### Material de Referência
- Glossário médico de hanseníase
- Tabelas de dosagem por protocolo
- Casos clínicos validados
- Padrões de interface por persona

---

## 🤝 Mentoria e Suporte

### Sistema de Buddy

**Cada novo desenvolvedor recebe:**
- Mentor técnico (desenvolvimento)
- Mentor médico (domínio específico)
- Mentor de qualidade (conformidade/acessibilidade)

### Canais de Comunicação

- **Dúvidas técnicas:** Slack #dev-hanseniase
- **Questões médicas:** Slack #medical-review
- **Conformidade LGPD:** Slack #compliance
- **Acessibilidade:** Slack #accessibility

### Sessões de Aprendizado

**Semanais:**
- Code review coletivo
- Discussão de casos clínicos
- Atualizações de protocolos médicos

**Mensais:**
- Workshops de acessibilidade
- Treinamento LGPD
- Apresentação de novas features

---

## ✅ Verificação de Progresso

### Semana 1: Fundações
- [ ] Ambiente configurado e funcionando
- [ ] Hooks do Git operacionais
- [ ] Primeira verificação LGPD executada
- [ ] Contexto médico básico compreendido
- [ ] Personas educacionais estudadas

### Semana 2: Implementação
- [ ] Primeira feature médica implementada
- [ ] Testes de precisão criados e passando
- [ ] Documentação automática gerada
- [ ] PR criado seguindo padrões do projeto
- [ ] Review aprovado por mentor

### Semana 3: Autonomia
- [ ] Issue complexo resolvido independentemente
- [ ] Contribuição para melhoria de processo
- [ ] Mentoria de novo desenvolvedor iniciada
- [ ] Apresentação para equipe realizada

### Mês 1: Proficiência
- [ ] Expert em ferramentas do projeto
- [ ] Contribuições regulares para base de código
- [ ] Participação ativa em decisões técnicas
- [ ] Conhecimento médico especializado demonstrado

---

## 🚨 Troubleshooting Comum

### Problemas de Setup

**Erro: Hook do Git não executa**
```bash
# Verificar permissões
ls -la .git/hooks/
# Corrigir permissões se necessário
chmod +x .git/hooks/*
```

**Erro: LGPD checker falha**
```bash
# Verificar Node.js version (>= 16)
node --version
# Reinstalar dependências
rm -rf node_modules && npm install
```

### Problemas de Desenvolvimento

**Erro: Calculadora médica imprecisa**
- Verificar protocolo MS atual
- Validar fórmulas matemáticas
- Testar casos limite
- Consultar mentor médico

**Erro: Falha de acessibilidade**
- Executar: `npm run accessibility-test`
- Verificar estrutura semântica
- Testar com leitor de tela
- Consultar guia de acessibilidade médica

**Erro: Violação LGPD**
- Executar: `node .claude/automation/lgpd-compliance-checker.js`
- Remover/anonimizar dados identificados
- Verificar consentimento para coleta
- Consultar DPO se necessário

---

## 🎉 Próximos Passos

Após completar este onboarding:

1. **Escolha sua primeira issue** (marcadas com `good-first-issue`)
2. **Participe da daily médica** (discussão de casos e atualizações)
3. **Contribua para documentação** conforme aprende
4. **Torne-se mentor** de próximos desenvolvedores
5. **Proponha melhorias** no processo de onboarding

---

## 📞 Contatos Importantes

**Equipe Técnica:**
- Tech Lead: [Nome] - [Email/Slack]
- Mentor de Código: [Nome] - [Email/Slack]

**Equipe Médica:**
- Coordenador Médico: [Nome] - [Email/Slack]
- Especialista Hanseníase: [Nome] - [Email/Slack]

**Conformidade:**
- DPO (Data Protection Officer): [Nome] - [Email/Slack]
- Compliance Officer: [Nome] - [Email/Slack]

**Emergências:**
- Violação LGPD: [Contato Urgente]
- Problema de Precisão Médica: [Contato Urgente]
- Incident Response: [Contato Urgente]

---

**Bem-vindo à equipe! 🏥 Juntos vamos construir uma plataforma educacional médica que faz a diferença na luta contra a hanseníase.**

> 💡 **Dica:** Mantenha este guia como referência e contribua com melhorias conforme sua experiência cresce no projeto.

> 🏥 **Nota Médica:** Lembre-se sempre que estamos lidando com informações médicas sensíveis. Cada linha de código pode impactar a educação de profissionais de saúde e, indiretamente, o cuidado de pacientes com hanseníase.