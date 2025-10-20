# Padrões de Código Médico - Claude Code

## 📋 **Visão Geral**

Este documento estabelece padrões de código específicos para desenvolvimento de sistemas médico-educacionais usando Claude Code, baseado nos princípios do SuperClaude Framework e adaptado para compliance médico brasileiro.

## 🏥 **Padrões Médicos Obrigatórios**

### **1. Nomenclatura Médica**

#### **✅ Correto**
```javascript
// Usar nomenclatura técnica oficial
const hanseniase = {
  classificacao: 'paucibacilar', // ou 'multibacilar'
  esquema: 'PQT-PB', // Poliquimioterapia Paucibacilar
  medicamentos: ['rifampicina', 'dapsona']
};

// Usar CID-10 correto
const diagnostico = {
  cid: 'A30.9', // Hanseníase não especificada
  descricao: 'Hanseníase'
};
```

#### **❌ Incorreto**
```javascript
// Evitar termos estigmatizantes
const lepra = { }; // ❌ Usar "hanseniase"
const leproso = { }; // ❌ Usar "pessoa com hanseníase"

// Evitar grafia incorreta
const hanseniase = { }; // ❌ Falta acento: "hanseníase"
```

### **2. Unidades Farmacológicas**

#### **✅ Correto**
```javascript
const medicamento = {
  nome: 'rifampicina',
  dose: 600, // mg
  unidade: 'mg',
  frequencia: 'mensal',
  via: 'oral'
};

// Cálculo de dose com validação
function calcularDose(peso, doseBase) {
  if (typeof peso !== 'number' || peso <= 0) {
    throw new Error('Peso deve ser um número positivo');
  }

  const dose = peso * doseBase;

  // Validar limites seguros
  if (dose > DOSE_MAXIMA) {
    throw new Error('Dose calculada excede limite máximo');
  }

  return {
    dose,
    unidade: 'mg',
    disclaimer: 'Sempre consulte um profissional de saúde'
  };
}
```

### **3. Disclaimers Obrigatórios**

Todo código que lida com informações médicas DEVE incluir disclaimers:

```javascript
const MEDICAL_DISCLAIMER = `
⚠️ IMPORTANTE: Este conteúdo é apenas educacional.
Sempre consulte um profissional de saúde qualificado
para diagnóstico e tratamento.
`;

// Em componentes React
const MedicalComponent = () => (
  <div>
    {/* Conteúdo médico */}
    <MedicalDisclaimer text={MEDICAL_DISCLAIMER} />
  </div>
);
```

## 🔒 **Padrões de Segurança**

### **1. Sanitização de Dados Médicos**

```javascript
// ✅ Correto - Sanitizar inputs médicos
import { sanitizeForLogging } from '@/utils/security';

function processarDadosMedicos(dadosPaciente) {
  // Nunca fazer log de dados sensíveis
  logger.info(`Processando dados: ${sanitizeForLogging(dadosPaciente.id)}`);

  // Validar entrada
  if (!isValidMedicalData(dadosPaciente)) {
    throw new Error('Dados médicos inválidos');
  }

  return processData(dadosPaciente);
}
```

### **2. Prevenção de Log Injection**

```python
# ✅ Correto - Python
import logging
from core.security.secure_logging import sanitize_for_logging

def processar_medicamento(nome_medicamento):
    # Sanitizar antes de logar
    safe_name = sanitize_for_logging(nome_medicamento)
    logger.info(f"Processando medicamento: {safe_name}")
```

## 🎭 **Padrões de Personas**

### **1. Dr. Gasnelio (Técnico)**

```javascript
const drGasnelioResponse = {
  tone: 'technical',
  includeReferences: true,
  format: 'scientific',

  generateResponse(query) {
    return {
      content: this.getTechnicalExplanation(query),
      references: this.getScientificReferences(query),
      disclaimer: MEDICAL_DISCLAIMER
    };
  }
};
```

### **2. Gá (Empático/Didático)**

```javascript
const gaResponse = {
  tone: 'empathetic',
  language: 'simple',
  format: 'didactic',

  generateResponse(query) {
    return {
      content: this.getSimpleExplanation(query),
      examples: this.getRelatableExamples(query),
      encouragement: this.getEncouragingMessage(),
      disclaimer: MEDICAL_DISCLAIMER
    };
  }
};
```

## 📱 **Padrões de Acessibilidade**

### **1. Componentes Acessíveis**

```tsx
// ✅ Componente médico acessível
const MedicalForm: React.FC = () => (
  <form role="form" aria-labelledby="medical-form-title">
    <h2 id="medical-form-title">Informações Médicas</h2>

    <label htmlFor="peso">
      Peso (kg) <span aria-label="obrigatório">*</span>
    </label>
    <input
      id="peso"
      type="number"
      required
      aria-describedby="peso-help"
      min="1"
      max="300"
    />
    <div id="peso-help">Informe o peso em quilogramas</div>

    <button type="submit" aria-describedby="submit-disclaimer">
      Calcular Dose
    </button>
    <div id="submit-disclaimer" className="sr-only">
      {MEDICAL_DISCLAIMER}
    </div>
  </form>
);
```

### **2. Indicadores Visuais**

```css
/* Indicadores de severidade médica */
.medical-alert {
  &.critical {
    background: #fee2e2;
    border-left: 4px solid #dc2626;
    color: #dc2626;
  }

  &.warning {
    background: #fef3c7;
    border-left: 4px solid #d97706;
    color: #d97706;
  }

  &.info {
    background: #dbeafe;
    border-left: 4px solid #2563eb;
    color: #2563eb;
  }
}
```

## 📊 **Padrões de Dados Clínicos**

### **1. Estrutura de Dados**

```typescript
// Tipos TypeScript para dados médicos
interface MedicationData {
  id: string;
  name: string;
  dosage: {
    amount: number;
    unit: 'mg' | 'ml' | 'g';
    frequency: 'daily' | 'weekly' | 'monthly';
  };
  contraindications: string[];
  interactions: string[];
  disclaimer: string;
}

interface PatientData {
  id: string; // Anonimizado
  weight?: number; // kg
  age?: number; // anos
  allergies: string[];
  // Nunca armazenar dados identificáveis diretamente
}
```

### **2. Validação de Dados**

```javascript
// Validador de dados médicos
class MedicalDataValidator {
  static validateWeight(weight) {
    if (typeof weight !== 'number') {
      throw new ValidationError('Peso deve ser numérico');
    }

    if (weight <= 0 || weight > 300) {
      throw new ValidationError('Peso deve estar entre 1 e 300 kg');
    }

    return true;
  }

  static validateDosage(dosage) {
    const { amount, unit } = dosage;

    if (!amount || amount <= 0) {
      throw new ValidationError('Dosagem deve ser positiva');
    }

    if (!['mg', 'ml', 'g'].includes(unit)) {
      throw new ValidationError('Unidade inválida');
    }

    return true;
  }
}
```

## 🛡️ **Compliance LGPD**

### **1. Coleta de Dados**

```javascript
// ✅ Coleta com consentimento
const collectEducationalData = (userData, consent) => {
  if (!consent.analytics) {
    throw new Error('Consentimento necessário para analytics');
  }

  if (!consent.educational) {
    throw new Error('Consentimento necessário para dados educacionais');
  }

  // Anonimizar dados
  const anonymizedData = {
    id: hashUserId(userData.id),
    progress: userData.progress,
    // Não armazenar dados pessoais
  };

  return anonymizedData;
};
```

### **2. Direitos do Usuário**

```javascript
// Implementar direitos LGPD
class LGPDService {
  async exportUserData(userId) {
    const data = await this.getUserData(userId);
    return {
      data: sanitizePersonalData(data),
      format: 'JSON',
      timestamp: new Date().toISOString()
    };
  }

  async deleteUserData(userId) {
    await this.anonymizeUserData(userId);
    logger.info(`User data anonymized: ${sanitizeForLogging(userId)}`);
  }
}
```

## 🧪 **Padrões de Testes**

### **1. Testes Médicos**

```javascript
// Teste de cálculo farmacológico
describe('Cálculo de Dose PQT', () => {
  test('deve calcular dose correta para adulto', () => {
    const peso = 70; // kg
    const dose = calcularDosePQT(peso, 'rifampicina');

    expect(dose.amount).toBe(600);
    expect(dose.unit).toBe('mg');
    expect(dose.disclaimer).toContain('consulte um profissional');
  });

  test('deve rejeitar peso inválido', () => {
    expect(() => calcularDosePQT(-10, 'rifampicina'))
      .toThrow('Peso deve ser positivo');
  });
});
```

### **2. Testes de Segurança**

```javascript
// Teste de sanitização
describe('Sanitização Médica', () => {
  test('deve remover dados sensíveis dos logs', () => {
    const dadosSensiveis = 'João Silva CPF: 123.456.789-00';
    const sanitizado = sanitizeForLogging(dadosSensiveis);

    expect(sanitizado).not.toContain('CPF');
    expect(sanitizado).not.toContain('123.456.789-00');
  });
});
```

## 📚 **Padrões Educacionais**

### **1. Objetivos de Aprendizagem**

```javascript
// Estrutura de conteúdo educacional
const educationalContent = {
  title: 'Esquemas PQT para Hanseníase',
  objectives: [
    'Identificar os esquemas PQT-PB e PQT-MB',
    'Explicar as indicações de cada esquema',
    'Demonstrar o cálculo de doses'
  ],
  prerequisites: [
    'Conhecimento básico de farmacologia',
    'Compreensão dos tipos de hanseníase'
  ],
  level: 'intermediate',
  personas: {
    'dr-gasnelio': {
      approach: 'technical',
      includePharmacology: true,
      references: true
    },
    'ga': {
      approach: 'didactic',
      useAnalogies: true,
      simplifyTerms: true
    }
  }
};
```

### **2. Avaliação de Aprendizagem**

```javascript
// Sistema de avaliação educacional
class EducationalAssessment {
  static validateAnswer(question, answer) {
    const result = {
      correct: false,
      feedback: '',
      persona_specific: {}
    };

    // Validação básica
    result.correct = this.checkAnswer(question, answer);

    // Feedback específico por persona
    result.persona_specific = {
      'dr-gasnelio': this.getTechnicalFeedback(question, answer),
      'ga': this.getEncouragingFeedback(question, answer)
    };

    return result;
  }
}
```

## 🔧 **Configurações de Projeto**

### **1. ESLint para Código Médico**

```json
// .eslintrc.js - Regras específicas
{
  "rules": {
    "medical/require-disclaimer": "error",
    "medical/no-sensitive-logging": "error",
    "medical/validate-medical-calculations": "warn",
    "medical/require-persona-consistency": "warn"
  }
}
```

### **2. TypeScript Config Médico**

```json
// tsconfig.json - Configuração específica
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "exactOptionalPropertyTypes": true
  },
  "include": [
    "src/medical/**/*",
    "src/personas/**/*",
    "src/educational/**/*"
  ]
}
```

## 📖 **Referências e Compliance**

### **Padrões Seguidos**
- **LGPD** (Lei Geral de Proteção de Dados)
- **CFM-2314/2022** (Telemedicina)
- **ANVISA RDC-4/2009** (Farmacovigilância)
- **WCAG 2.1 AA** (Acessibilidade)

### **Frameworks Base**
- **SuperClaude Framework** (Arquitetura de agentes)
- **Claude Code Templates** (Padrões de desenvolvimento)

### **Validação Contínua**
- Hooks de qualidade automáticos
- Testes de compliance
- Validação de personas
- Verificação de disclaimers

---

**Última atualização:** Janeiro 2025
**Versão:** 1.0.0
**Maintainer:** Claude Code Medical Team