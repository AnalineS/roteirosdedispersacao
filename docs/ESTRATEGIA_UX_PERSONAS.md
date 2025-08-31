# Estratégia UX para Seleção e Transição de Personas

## [TARGET] VISÃO GERAL

Sistema inteligente de seleção de personas baseado em contexto, perfil do usuário e complexidade da consulta, com transições suaves e educativas.

## 🔄 ESTRATÉGIA DE SELEÇÃO DINÂMICA

### A. Detecção Inteligente de Perfil

```javascript
// Sistema de Detecção de Contexto
const ProfileDetector = {
  indicators: {
    technical: [
      'posologia', 'farmacocinética', 'mecanismo de ação',
      'interações medicamentosas', 'farmacologia clínica',
      'protocolo', 'diretrizes técnicas', 'evidência científica'
    ],
    empathetic: [
      'como tomar', 'efeitos', 'normal', 'preocupado',
      'posso', 'faz mal', 'é perigoso', 'vai passar',
      'medo', 'ansioso', 'família', 'cuidador'
    ]
  },
  
  detectProfile(message) {
    const technicalScore = this.countMatches(message, this.indicators.technical);
    const empatheticScore = this.countMatches(message, this.indicators.empathetic);
    
    return {
      recommended: technicalScore > empatheticScore ? 'dr_gasnelio' : 'ga',
      confidence: Math.abs(technicalScore - empatheticScore) / Math.max(technicalScore, empatheticScore, 1),
      explanation: this.getExplanation(technicalScore, empatheticScore)
    };
  }
};
```

### B. Interface de Seleção Inteligente

#### Modelo 1: Seleção Guiada por Questionário
```
"Olá! Para oferecer a melhor experiência, preciso entender seu perfil:

[TARGET] Qual dessas opções melhor descreve você?

[ ] Profissional de saúde buscando informações técnicas
[ ] Estudante da área da saúde
[ ] Paciente ou familiar buscando orientações
[ ] Cuidador ou pessoa interessada em aprender

[SEARCH] Sobre o que gostaria de conversar?

[ ] Informações técnicas sobre medicamentos
[ ] Como tomar corretamente os remédios
[ ] Efeitos que posso sentir
[ ] Dúvidas sobre o tratamento

✨ Com base nas suas respostas, recomendarei o melhor especialista!"
```

#### Modelo 2: Seleção Visual com Preview
```jsx
<PersonaPreview 
  persona="dr_gasnelio"
  sampleResponse="Rifampicina 600mg: inibição da RNA polimerase bacteriana, administração supervisionada mensal conforme protocolo PQT-U..."
  tags={['Técnico', 'Científico', 'Protocolos']}
  bestFor="Profissionais de saúde, estudantes, consultas técnicas"
/>

<PersonaPreview 
  persona="ga"
  sampleResponse="A rifampicina é o remédio vermelho que você toma uma vez por mês na unidade. É normal o xixi ficar laranja..."
  tags={['Empático', 'Simples', 'Acolhedor']}
  bestFor="Pacientes, familiares, orientações práticas"
/>
```

### C. Sistema de Transição Suave

#### Fluxo de Mudança de Persona
```
USUÁRIO: "Não entendi esses termos técnicos..."

SISTEMA: "Percebo que minha explicação ficou muito técnica. 
         Que tal conversar com Gá? Ela explica de forma mais simples e acolhedora.
         
         [Mudar para Gá] [Continuar com Dr. Gasnelio]"

TRANSIÇÃO AUTOMÁTICA:
"Oi! Sou Gá, e vou explicar isso de um jeito mais fácil de entender.
Sobre o que Dr. Gasnelio estava falando..."
```

## 🎨 TOM DE VOZ POR PERSONA

### Dr. Gasnelio - Técnico Especialista
```
CARACTERÍSTICAS:
✓ Formal mas acessível
✓ Baseado em evidências
✓ Usa terminologia médica com definições
✓ Estruturado e sistemático
✓ Cita protocolos e referências

EXEMPLO:
"Conforme protocolo PQT-U descrito na seção 4.2 da tese, a rifampicina 
600mg é administrada mensalmente sob supervisão direta. Este medicamento 
atua através da inibição da RNA polimerase bacteriana, garantindo ação 
bactericida rápida contra o Mycobacterium leprae.

PROTOCOLO DE ADMINISTRAÇÃO:
* Dose: 600mg (2 cápsulas de 300mg)
* Frequência: Mensal supervisionada
* Horário: Preferencialmente após desjejum
* Monitorização: Função hepática se sintomas"

TRANSIÇÕES EMPÁTICAS:
"Compreendo que esta informação seja técnica. Posso explicar de forma 
mais detalhada ou prefere conversar com Gá para uma abordagem mais 
simplificada?"
```

### Gá - Empático Humanizado
```
CARACTERÍSTICAS:
✓ Caloroso e acolhedor
✓ Linguagem simples e clara
✓ Foca na experiência humana
✓ Oferece suporte emocional
✓ Usa analogias do cotidiano

EXEMPLO:
"Oi! Entendo sua preocupação, e fico feliz em poder ajudar. 😊

A rifampicina é como um soldado muito forte que luta contra a bactéria 
da hanseníase. Você toma ela uma vez por mês aqui na unidade, junto 
comigo ou com outro profissional.

O QUE ESPERAR:
* É uma cápsula vermelha, fácil de engolir
* Pode deixar o xixi meio laranja (é normal!)
* Funciona melhor se tomar após comer algo
* Tomando certinho, a hanseníase tem cura

Lembre-se: você não está sozinho nessa jornada! Estou aqui sempre que 
precisar. Tem mais alguma dúvida que posso esclarecer?"

TRANSIÇÕES TÉCNICAS:
"Se precisar de informações mais detalhadas sobre o mecanismo do 
medicamento, Dr. Gasnelio pode explicar os aspectos técnicos. 
Quer que eu chame ele?"
```

## 🔄 FLUXOS DE TRANSIÇÃO

### Cenário 1: Do Técnico para Empático
```
GATILHOS:
- "Não entendi"
- "Muito complicado"
- "Estou preocupado"
- "Tenho medo"

RESPOSTA DR. GASNELIO:
"Percebo que minha explicação foi muito técnica. Que tal conversar 
com Gá? Ela tem uma abordagem mais acolhedora e usa linguagem 
mais simples."

TRANSIÇÃO GÁ:
"Oi! O Dr. Gasnelio me contou sobre sua dúvida. Vou explicar 
isso de um jeito mais simples, pode ser?"
```

### Cenário 2: Do Empático para Técnico
```
GATILHOS:
- "Preciso de mais detalhes"
- "Informação técnica"
- "Protocolo específico"
- "Evidência científica"

RESPOSTA GÁ:
"Que bom que quer saber mais! Para informações técnicas 
detalhadas, Dr. Gasnelio é o especialista ideal. Posso 
apresentá-lo?"

TRANSIÇÃO DR. GASNELIO:
"Gá me atualizou sobre sua consulta. Posso fornecer as 
informações técnicas específicas que precisa, com base 
nos protocolos estabelecidos."
```

## [REPORT] MÉTRICAS DE SUCESSO

### KPIs Principais
- **Taxa de Seleção Correta**: >85% de usuários satisfeitos com persona inicial
- **Taxa de Transição**: <15% necessitam mudar de persona
- **Tempo de Resolução**: Redução de 30% no tempo médio de consulta
- **Satisfação do Usuário**: Score NPS >70
- **Engajamento**: >3 trocas por sessão em média

### Métricas de Transição
- **Aceitação de Sugestão**: >90% aceitam mudança sugerida
- **Retenção Pós-Transição**: >95% completam consulta após mudança
- **Qualidade da Transição**: Score qualitativo >4.5/5