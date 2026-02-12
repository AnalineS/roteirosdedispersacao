"use client";

import EducationalLayout from "@/components/layout/EducationalLayout";
import Link from "next/link";
import { IndexIndicator } from "@/components/ui/IndexIndicator";
import renderMarkdownContent from "@/utils/renderMarkdownContent";

// Force dynamic rendering for Cloud Run SSR
export const dynamic = "force-dynamic";

export default function RoteiroDispensacaoModulePage() {
  const moduleContent = {
    title: "Roteiro de Dispensação Farmacêutica",
    subtitle: "Protocolo técnico-científico para dispensação segura de PQT-U",
    duration: "35 minutos",
    level: "Técnico-científico",
    category: "Farmácia Clínica",
    description:
      "Módulo especializado para farmacêuticos clínicos sobre dispensação farmacêutica de PQT-U. Baseado na tese de doutorado e protocolos do Ministério da Saúde.",
    targetAudience:
      "Farmacêuticos clínicos, residentes em farmácia hospitalar e estudantes de farmácia",
    references: [
      "Roteiro de Dispensação - Hanseníase.pdf (Tese de Doutorado)",
      "Brasil. Ministério da Saúde. Protocolo Clínico e Diretrizes Terapêuticas da Hanseníase (2022)",
      "Conselho Federal de Farmácia. Serviços farmacêuticos diretamente destinados ao paciente (2016)",
    ],

    sections: [
      {
        id: "fundamentos-dispensacao",
        title: "🎯 Fundamentos da Dispensação de PQT-U",
        content: `
          **CONCEITUAÇÃO TÉCNICA:**
          
          A dispensação de PQT-U constitui ato farmacêutico de alta complexidade que transcende a simples entrega de medicamentos, englobando orientação farmacoterapêutica, monitorização clínica e educação em saúde.
          
          **1. BASES LEGAIS E NORMATIVAS:**
          
          **Lei Federal 13.021/2014:**
          • **Art. 4º:** Dispensação como ato privativo do farmacêutico
          • **Responsabilidade técnica:** Análise da prescrição e orientação ao paciente
          • **Documentação:** Registro obrigatório de todas as dispensações
          
          **Portaria SCTIE/MS Nº 84/2022 (PCDT Hanseníase):**
          • **Dispensação mensal supervisionada:** Obrigatória para dose mensal
          • **Medicamento de Componente Estratégico:** Fornecimento gratuito pelo SUS
          • **Notificação compulsória:** SINAN para todos os casos
          
          **Resolução CFF Nº 585/2013 (Atribuições Clínicas):**
          • **Acompanhamento farmacoterapêutico:** Identificação de PRM/RAM
          • **Educação em saúde:** Orientações sobre uso correto e adesão
          • **Interface multiprofissional:** Comunicação com equipe de saúde
          
          **2. CARACTERÍSTICAS ESPECÍFICAS DA PQT-U:**
          
          **Apresentação Farmacêutica:**
          • **Blister padronizado:** Dose mensal (4 comprimidos/cápsulas)
          • **Dose supervisionada:** Rifampicina 600mg + Clofazimina 300mg + Dapsona 100mg
          • **Doses diárias:** Clofazimina 50mg + Dapsona 100mg (cartela de 28 dias)
          • **Identificação:** Código de barras, lote, validade, fabricante
          
          **Classificação Farmacológica:**
          • **Rifampicina:** Antibiótico bactericida (Classe A - OMS)
          • **Clofazimina:** Antimicobacteriano bactericida (Classe B - OMS)
          • **Dapsona:** Sulfona bacteriostática (Classe C - OMS)
          
          **3. DIFERENCIAL DA DISPENSAÇÃO EM HANSENÍASE:**
          
          **Aspectos Epidemiológicos:**
          • **Doença negligenciada:** Necessita atenção farmacêutica especializada
          • **Estigma social:** Impacta adesão e continuidade terapêutica
          • **Contactantes:** Vigilância e orientação familiar obrigatória
          
          **Aspectos Clínicos:**
          • **Estados reacionais:** Podem ser confundidos com RAM
          • **Incapacidades físicas:** Adaptação da posologia para limitações
          • **Longa duração:** 6 meses de acompanhamento contínuo
          
          **Aspectos Farmacotécnicos:**
          • **Estabilidade:** Medicamentos termolábeis e fotossensíveis
          • **Incompatibilidades:** Múltiplas interações medicamentosas
          • **Adesão:** Estratégias específicas para manutenção
        `,
        clinicalCases: `
          **💼 Caso Clínico 1:** Farmacêutico identifica prescrição de PQT-U para criança de 8 anos (25kg). **Análise:** Peso abaixo do mínimo recomendado (30kg). **Conduta:** Contato com prescriber para ajuste posológico ou encaminhamento para centro de referência.
          
          **💼 Caso Clínico 2:** Durante dispensação, paciente relata "manchas ficando mais escuras". **Avaliação farmacêutica:** Hiperpigmentação por clofazimina (normal). **Intervenção:** Orientação sobre reversibilidade, suporte psicológico, manutenção da adesão.
        `,
        keyPoints: [
          "Dispensação de PQT-U é ato privativo do farmacêutico com responsabilidade técnica integral",
          "Dose mensal supervisionada é obrigatória - nunca dispensar para casa",
          "Medicamento do Componente Estratégico - fornecimento gratuito pelo SUS",
          "Documentação rigorosa obrigatória: SINAN, cartão controle, evolução farmacológica",
        ],
        askAssistant: {
          suggestedQuestions: [
            "Dr. Gasnelio, qual a diferença entre dispensação comum e dispensação supervisionada?",
            "Como proceder quando a prescrição está incompleta ou ilegível?",
            "Quais as responsabilidades legais do farmacêutico na dispensação de PQT-U?",
          ],
        },
      },
      {
        id: "protocolo-dispensacao",
        title: "📋 Protocolo Técnico de Dispensação",
        content: `
          **FLUXOGRAMA DE DISPENSAÇÃO FARMACÊUTICA:**
          
          **ETAPA 1: ANÁLISE DA PRESCRIÇÃO**
          
          **Verificações Obrigatórias:**
          • **Identificação do prescriber:** CRM, especialidade, carimbo, assinatura
          • **Identificação do paciente:** Nome completo, idade, peso, endereço
          • **Diagnóstico:** CID-10 (A30), classificação operacional (PB/MB)
          • **Prescrição:** Medicamentos, doses, via, frequência, duração
          • **Data da prescrição:** Validade máxima de 30 dias
          
          **Análise Farmacológica:**
          • **Indicação:** Concordância com diagnóstico e classificação
          • **Dose:** Adequação ao peso e idade (adulto/pediátrico)
          • **Interações:** Levantamento de medicamentos concomitantes
          • **Contraindicações:** Gestação, alergias, disfunções orgânicas
          
          **ETAPA 2: ANAMNESE FARMACÊUTICA**
          
          **História Medicamentosa:**
          • **Medicamentos atuais:** Prescritos e automedicação
          • **Alergias e reações adversas:** Prévias a antimicrobianos
          • **Adesão prévia:** Experiência com tratamentos prolongados
          • **Comorbidades:** Diabetes, hipertensão, hepatopatias, nefropatias
          
          **História Social:**
          • **Escolaridade:** Adequação das orientações ao nível educacional
          • **Atividade profissional:** Exposição solar, impacto das reações adversas
          • **Suporte familiar:** Rede de apoio para manutenção da adesão
          • **Aspectos econômicos:** Transporte para doses supervisionadas
          
          **ETAPA 3: ORIENTAÇÃO FARMACOTERAPÊUTICA**
          
          **Informações Essenciais:**
          • **Mecanismo de ação:** Como os medicamentos atuam contra a hanseníase
          • **Posologia detalhada:** Horários, jejum, administração com alimentos
          • **Duração do tratamento:** 6 doses mensais, importância da regularidade
          • **Resultados esperados:** Tempo para melhora, indicadores de eficácia
          
          **Reações Adversas:**
          • **Esperadas e normais:** Hiperpigmentação, urina avermelhada
          • **Sinais de alerta:** Icterícia, anemia, dispneia, dor abdominal
          • **Condutas:** Quando retornar, quando procurar emergência
          • **Diferenciação:** Estados reacionais vs reações medicamentosas
          
          **ETAPA 4: DISPENSAÇÃO SUPERVISIONADA**
          
          **Protocolo da Dose Mensal:**
          • **Agendamento:** 1º dia útil do mês, tolerância máxima ±3 dias
          • **Identificação:** Confirmar paciente (documento com foto)
          • **Jejum:** Verificar se rifampicina será tomada em jejum adequado
          • **Administração:** Supervisão direta da deglutição
          • **Observação:** 30 minutos para reações imediatas
          
          **Registro e Documentação:**
          • **Livro de dispensação:** Data, medicamentos, lote, validade
          • **Cartão do paciente:** Carimbo da unidade, assinatura do farmacêutico
          • **Sistema informatizado:** Lançamento imediato no SISLOG/SINAN
          
          **ETAPA 5: MONITORIZAÇÃO TERAPÊUTICA**
          
          **Avaliação Mensal:**
          • **Adesão às doses diárias:** Contagem de comprimidos restantes
          • **Reações adversas:** Questionário padronizado + exame físico básico
          • **Eficácia terapêutica:** Evolução clínica relatada pelo paciente
          • **Dificuldades:** Identificação de barreiras à continuidade
          
          **Intervenções Farmacêuticas:**
          • **Educação continuada:** Reforço de orientações a cada consulta
          • **Manejo de RAM:** Orientações para redução de desconfortos
          • **Suporte psicológico:** Apoio para enfrentamento do estigma
          • **Interface médica:** Comunicação de intercorrências significativas
          
          **ETAPA 6: BUSCA ATIVA (FALTOSOS)**
          
          **Critério:** Falta à dose mensal supervisionada (>3 dias de atraso)
          
          **Ações Obrigatórias:**
          • **Contato telefônico:** Primeiro contato em 24 horas
          • **Visita domiciliar:** Se contato telefônico falhar (48h)
          • **Investigação:** Causas do abandono, problemas sociais/econômicos
          • **Reagendamento:** Nova data para retomada do tratamento
          • **Orientação:** Reforço da importância da continuidade
          
          **Documentação da Busca:**
          • **Registro:** Data, tipo de contato, resultado obtido
          • **SINAN:** Atualização do acompanhamento
          • **Equipe multiprofissional:** Comunicação com assistente social/enfermeiro
        `,
        clinicalCases: `
          **💼 Caso Clínico 3:** Paciente apresenta prescrição com dose de rifampicina 300mg para adulto de 70kg. **Análise farmacêutica:** Dose subdimensionada (correto: 600mg). **Intervenção:** Contato com prescriber, correção da prescrição antes da dispensação.
          
          **💼 Caso Clínico 4:** Durante anamnese, paciente relata uso de warfarina 5mg/dia. **Identificação:** Interação grave (rifampicina induz metabolismo da warfarina). **Conduta:** Comunicação médica urgente para ajuste posológico e monitorização do INR.
        `,
        keyPoints: [
          "Análise farmacêutica completa obrigatória antes de qualquer dispensação",
          "Anamnese deve identificar medicamentos concomitantes e fatores de risco",
          "Dose mensal supervisionada requer protocolo rigoroso de administração",
          "Busca ativa de faltosos é obrigação legal do serviço de saúde",
        ],
        askAssistant: {
          suggestedQuestions: [
            "Dr. Gasnelio, como proceder quando identifico interação medicamentosa grave?",
            "Qual o protocolo correto para busca ativa de pacientes faltosos?",
            "Como diferenciar estado reacional de reação adversa na prática?",
          ],
        },
      },
      {
        id: "documentacao-controle",
        title: "📊 Documentação e Controle Farmacêutico",
        content: `
          **SISTEMA DE DOCUMENTAÇÃO FARMACÊUTICA:**
          
          **1. DOCUMENTAÇÃO OBRIGATÓRIA:**
          
          **Livro de Registro de Dispensação:**
          • **Campos obrigatórios:** Data, nome paciente, CPF, medicamento, lote, validade
          • **Assinatura:** Paciente e farmacêutico responsável
          • **Observações:** Reações adversas, intercorrências, orientações especiais
          • **Conservação:** Manter por 5 anos após última anotação
          
          **Cartão de Controle do Paciente:**
          • **Identificação completa:** Nome, data nascimento, endereço, telefone
          • **Cronograma:** Datas das 6 doses mensais supervisionadas
          • **Evolução clínica:** Melhora/piora, reações adversas, adesão
          • **Carimbos:** Unidade de saúde e farmacêutico a cada dispensação
          
          **Ficha de Acompanhamento Farmacoterapêutico:**
          • **História medicamentosa:** Medicamentos atuais, alergias, RAM prévias
          • **Parâmetros clínicos:** Peso, sinais vitais, exames laboratoriais
          • **Intervenções farmacêuticas:** Orientações, ajustes, comunicação médica
          • **Resultados:** Eficácia, segurança, adesão, qualidade de vida
          
          **2. SISTEMAS INFORMATIZADOS:**
          
          **SINAN (Sistema de Informação de Agravos de Notificação):**
          • **Notificação inicial:** Dentro de 7 dias do diagnóstico
          • **Acompanhamento mensal:** Evolução clínica e terapêutica
          • **Encerramento:** Alta por cura, abandono, óbito, transferência
          • **Dados farmacológicos:** Doses administradas, reações adversas
          
          **SISLOG (Sistema de Logística de Medicamentos):**
          • **Controle de estoque:** Entrada, saída, perdas, validade
          • **Dispensação:** Registro de todas as doses mensais
          • **Relatórios:** Consumo, demanda, programação anual
          • **Rastreabilidade:** Lote do medicamento dispensado por paciente
          
          **Hórus (Sistema Nacional de Gestão da Assistência Farmacêutica):**
          • **Programação:** Demanda anual de PQT-U por unidade
          • **Dispensação:** Registro individual por paciente
          • **Monitorização:** Acompanhamento da utilização
          • **Indicadores:** Taxa de adesão, abandono, RAM
          
          **3. CONTROLE DE QUALIDADE:**
          
          **Inspeção Visual dos Medicamentos:**
          • **Integridade:** Cápsulas/comprimidos íntegros, sem rachaduras
          • **Coloração:** Alterações que indiquem degradação
          • **Prazo de validade:** Verificação rigorosa antes da dispensação
          • **Armazenamento:** Condições adequadas de temperatura e umidade
          
          **Controle de Estoque:**
          • **FIFO/FEFO:** Primeiro a vencer, primeiro a dispensar
          • **Temperatura:** Monitorização contínua (15-30°C)
          • **Umidade:** Máximo 65% (controle em regiões de alta umidade)
          • **Inventário:** Conferência mensal, reconciliação trimestral
          
          **4. INDICADORES FARMACÊUTICOS:**
          
          **Indicadores de Processo:**
          • **Taxa de dispensação supervisionada:** (Doses supervisionadas/Total de doses) × 100
          • **Tempo médio de atendimento:** Tempo por dispensação (meta: <30 min)
          • **Taxa de intervenções farmacêuticas:** (Intervenções/Dispensações) × 100
          • **Adesão às doses diárias:** (Comprimidos tomados/Prescritos) × 100
          
          **Indicadores de Resultado:**
          • **Taxa de conclusão do tratamento:** (Pacientes 6 doses/Iniciados) × 100
          • **Taxa de abandono:** (Abandonos/Iniciados) × 100 (Meta: <5%)
          • **Taxa de RAM:** (Pacientes com RAM/Total) × 100
          • **Taxa de busca ativa efetiva:** (Retornos pós-busca/Buscas realizadas) × 100
          
          **Indicadores de Qualidade:**
          • **Satisfação do usuário:** Questionário semestral (Meta: >80% satisfeito)
          • **Tempo para primeiro atendimento:** <7 dias após prescrição
          • **Disponibilidade do medicamento:** (Dias com estoque/Dias totais) × 100
          • **Capacitação da equipe:** Horas de treinamento/profissional/ano
          
          **5. AUDITORIA E VIGILÂNCIA:**
          
          **Auditoria Interna (Mensal):**
          • **Conformidade documental:** Preenchimento adequado dos registros
          • **Aderência aos protocolos:** Seguimento das diretrizes técnicas
          • **Controle de estoque:** Reconciliação física vs sistema
          • **Indicadores:** Análise de tendências e desvios
          
          **Vigilância Farmacológica:**
          • **Notificação de RAM:** NOTIVISA para eventos graves/inesperados
          • **Análise de causalidade:** Algoritmo de Naranjo para RAM
          • **Comunicação:** Rede Nacional de Farmacovigilância
          • **Intervenções:** Modificações protocolares baseadas em evidências
          
          **6. COMUNICAÇÃO MULTIPROFISSIONAL:**
          
          **Interface com Equipe Médica:**
          • **Relatórios mensais:** Evolução farmacoterapêutica dos pacientes
          • **Intercorrências:** Comunicação imediata de RAM graves
          • **Sugestões:** Otimização terapêutica baseada em monitorização
          • **Casos complexos:** Discussão em reuniões clínicas
          
          **Interface com Enfermagem:**
          • **Dose supervisionada:** Coordenação para administração
          • **Busca ativa:** Ações conjuntas para pacientes faltosos
          • **Educação:** Orientações complementares durante consultas
          • **Monitorização:** Compartilhamento de achados clínicos
          
          **Interface com Assistência Social:**
          • **Vulnerabilidades:** Identificação de fatores socioeconômicos
          • **Apoio social:** Estratégias para manutenção do tratamento
          • **Benefícios:** Orientação sobre auxílios disponíveis
          • **Visitas domiciliares:** Planejamento conjunto
        `,
        clinicalCases: `
          **💼 Caso Clínico 5:** Auditoria identifica discrepância no estoque: sistema mostra 50 blisters, físico tem 45. **Investigação:** Análise dos registros de dispensação dos últimos 30 dias. **Achado:** 5 dispensações não lançadas no sistema. **Correção:** Regularização dos registros e reforço do protocolo.
          
          **💼 Caso Clínico 6:** Paciente apresenta RAM grave (hepatotoxicidade) após 4ª dose. **Documentação:** Notificação NOTIVISA, comunicação médica imediata, registro detalhado na ficha. **Acompanhamento:** Suspensão da rifampicina, esquema alternativo, monitorização hepática.
        `,
        keyPoints: [
          "Documentação completa é obrigação legal e instrumento de qualidade",
          "Sistemas informatizados devem ser alimentados em tempo real",
          "Indicadores farmacêuticos orientam melhorias na assistência",
          "Comunicação multiprofissional é essencial para resultados clínicos",
        ],
        askAssistant: {
          suggestedQuestions: [
            "Dr. Gasnelio, quais documentos são obrigatórios na dispensação de PQT-U?",
            "Como calcular e interpretar os indicadores de adesão?",
            "Quando devo notificar uma reação adversa no NOTIVISA?",
          ],
        },
      },
      {
        id: "educacao-orientacao",
        title: "👥 Educação em Saúde e Orientação ao Paciente",
        content: `
          **ESTRATÉGIAS EDUCACIONAIS EM FARMÁCIA CLÍNICA:**
          
          **1. PRINCÍPIOS DA EDUCAÇÃO FARMACÊUTICA:**
          
          **Abordagem Centrada no Paciente:**
          • **Avaliação inicial:** Nível educacional, crenças, medos, expectativas
          • **Linguagem adequada:** Adaptação técnica para compreensão leiga
          • **Escuta ativa:** Identificação de barreiras e resistências
          • **Empoderamento:** Capacitação para autogerenciamento do tratamento
          
          **Princípios Andragógicos (Educação de Adultos):**
          • **Relevância:** Conectar informações com experiências pessoais
          • **Prática:** Demonstração de técnicas de administração
          • **Resolução de problemas:** Situações práticas do cotidiano
          • **Retroalimentação:** Confirmação de compreensão e retenção
          
          **2. CONTEÚDO EDUCACIONAL ESTRUTURADO:**
          
          **Módulo 1: Conhecimento sobre a Doença**
          • **O que é hanseníase:** Doença bacteriana curável, não hereditária
          • **Transmissão:** Vias respiratórias, contato prolongado, baixa transmissibilidade
          • **Sinais e sintomas:** Lesões de pele, perda de sensibilidade, espessamento neural
          • **Prognóstico:** Cura completa com tratamento adequado, prevenção de sequelas
          
          **Módulo 2: Tratamento e Medicamentos**
          • **PQT-U explicada:** Combinação de 3 medicamentos, ação sinérgica
          • **Importância da regularidade:** Prevenção de resistência e garantia de cura
          • **Duração:** 6 meses de tratamento, supervisão mensal obrigatória
          • **Eficácia:** Taxa de cura >99% quando tratamento é completado
          
          **Módulo 3: Uso Correto dos Medicamentos**
          • **Rifampicina:** Jejum obrigatório, urina avermelhada (normal)
          • **Clofazimina:** Com alimentos, coloração da pele (reversível)
          • **Dapsona:** Qualquer horário, preferencialmente com alimentos
          • **Armazenamento:** Local seco, temperatura ambiente, longe de crianças
          
          **Módulo 4: Reações Esperadas vs Sinais de Alerta**
          • **Normais:** Hiperpigmentação, urina colorida, náuseas leves
          • **Atenção:** Icterícia, anemia, dispneia, dor abdominal intensa
          • **Estados reacionais:** Não são reações aos medicamentos, não suspender
          • **Quando retornar:** Sintomas que requerem avaliação médica urgente
          
          **3. TÉCNICAS EDUCACIONAIS ESPECÍFICAS:**
          
          **Material Educativo Visual:**
          • **Folder ilustrado:** Esquema posológico, reações esperadas
          • **Cronograma visual:** Calendário das doses mensais
          • **Cartilha de orientações:** Linguagem simples, ilustrações didáticas
          • **Vídeos educativos:** Depoimentos de pacientes curados
          
          **Técnicas Interativas:**
          • **Demonstração prática:** Como tomar cada medicamento
          • **Roleplay:** Simulação de situações do cotidiano
          • **Questionário validado:** Avaliação de conhecimento
          • **Grupo de apoio:** Troca de experiências entre pacientes
          
          **4. ABORDAGEM DE BARREIRAS ESPECÍFICAS:**
          
          **Estigma e Discriminação:**
          • **Desmistificação:** Hanseníase não é "lepra bíblica"
          • **Empoderamento:** Informações científicas atuais
          • **Direitos:** Legislação de proteção, benefícios sociais
          • **Rede de apoio:** Grupos de pacientes, associações
          
          **Reações Adversas Cosméticas:**
          • **Hiperpigmentação:** Explicação científica, reversibilidade
          • **Apoio psicológico:** Estratégias de enfrentamento
          • **Alternativas cosméticas:** Maquiagem, proteção solar
          • **Tempo de reversão:** Expectativas realísticas (6-12 meses)
          
          **Aspectos Socioeconômicos:**
          • **Transporte:** Estratégias para doses supervisionadas
          • **Trabalho:** Orientações sobre direitos trabalhistas
          • **Família:** Envolvimento no apoio ao tratamento
          • **Benefícios sociais:** BPC, auxílio-doença quando indicado
          
          **5. MONITORIZAÇÃO DA EDUCAÇÃO:**
          
          **Avaliação de Conhecimento:**
          • **Questionário inicial:** Baseline de conhecimentos
          • **Avaliação mensal:** Retenção e compreensão
          • **Feedback qualitativo:** Percepção sobre orientações
          • **Avaliação final:** Conhecimento adquirido após 6 meses
          
          **Indicadores Educacionais:**
          • **Taxa de compreensão:** (Pacientes que demonstram conhecimento/Total) × 100
          • **Satisfação educacional:** Questionário de satisfação (Meta: >85%)
          • **Adesão pós-educação:** Correlação entre conhecimento e adesão
          • **Solicitação de esclarecimentos:** Número de dúvidas por consulta
          
          **6. EDUCAÇÃO PARA FAMILIARES/CONTACTANTES:**
          
          **Prevenção e Detecção:**
          • **Sinais de alerta:** Como identificar sintomas suspeitos
          • **Exame de contactantes:** Importância e cronograma
          • **Medidas preventivas:** Higiene, ventilação, imunização BCG
          • **Desmistificação:** Transmissão não ocorre por objetos
          
          **Apoio ao Tratamento:**
          • **Suporte familiar:** Como auxiliar na adesão
          • **Reconhecimento de RAM:** Quando procurar ajuda médica
          • **Aspectos emocionais:** Apoio psicológico e social
          • **Reintegração:** Combate ao estigma familiar
          
          **7. TECNOLOGIAS EDUCACIONAIS:**
          
          **Ferramentas Digitais:**
          • **Aplicativo móvel:** Lembretes, orientações, evolução
          • **WhatsApp educativo:** Mensagens programadas, suporte
          • **Telemedicina:** Consultas de seguimento farmacêutico
          • **Plataforma web:** Acesso a materiais educativos
          
          **Gamificação:**
          • **Sistema de pontos:** Recompensas por adesão
          • **Quiz educativo:** Conhecimento de forma lúdica
          • **Metas pessoais:** Cronograma de conquistas
          • **Ranking:** Comparação saudável entre pacientes (opcional)
        `,
        clinicalCases: `
          **💼 Caso Clínico 7:** Paciente analfabeto com dificuldade de compreender orientações. **Estratégia educacional:** Material visual com pictogramas, envolvimento de familiar alfabetizado, demonstração prática repetida, grupo de apoio com pacientes similares.
          
          **💼 Caso Clínico 8:** Adolescente de 16 anos com hanseníase, constrangida pela hiperpigmentação. **Abordagem:** Educação específica sobre reversibilidade, apoio psicológico, grupo de jovens, estratégias cosméticas, empoderamento através de conhecimento científico.
        `,
        keyPoints: [
          "Educação farmacêutica deve ser personalizada ao perfil do paciente",
          "Material educativo visual e linguagem adequada são fundamentais",
          "Abordagem de barreiras específicas (estigma, reações adversas) é essencial",
          "Monitorização educacional orienta ajustes nas estratégias",
        ],
        askAssistant: {
          suggestedQuestions: [
            "Dr. Gasnelio, como abordar paciente com baixo nível educacional?",
            "Quais estratégias para lidar com o estigma da hanseníase?",
            "Como educar sobre diferença entre estado reacional e reação adversa?",
          ],
        },
      },
      {
        id: "tese-dispensacao-content",
        title: "📖 Conteúdo da Tese: Roteiro Completo",
        content: `
          **Baseado na tese "Roteiro de Dispensação - Hanseníase.pdf"**
          
          Esta seção apresenta o conteúdo integral do roteiro de dispensação desenvolvido 
          na tese de doutorado, validado cientificamente para aplicação em farmácias 
          clínicas do Sistema Único de Saúde.
          
          **📋 ROTEIRO TÉCNICO COMPLETO:**
          
          **1. Protocolo de Dispensação Farmacêutica PQT-U**
          O roteiro desenvolvido estabelece 6 etapas fundamentais:
          • Análise farmacêutica da prescrição
          • Anamnese farmacêutica estruturada  
          • Orientação farmacoterapêutica personalizada
          • Dispensação supervisionada protocolada
          • Monitorização terapêutica sistemática
          • Documentação e controle de qualidade
          
          **2. Instrumentos Validados**
          • Checklist de verificação da prescrição
          • Questionário de anamnese farmacêutica
          • Protocolo de orientação ao paciente
          • Ficha de acompanhamento farmacoterapêutico
          • Indicadores de qualidade da assistência
          
          **3. Resultados da Validação Científica**
          O protocolo foi testado em 150 pacientes, demonstrando:
          • Melhoria na adesão terapêutica (85% vs 92%)
          • Redução de reações adversas evitáveis (15% vs 8%)
          • Aumento na satisfação do usuário (78% vs 94%)
          • Otimização do tempo de dispensação (45min vs 28min)
          
          **4. Manual de Implementação**
          • Treinamento da equipe farmacêutica
          • Adaptação à realidade local
          • Monitorização de indicadores
          • Melhoria contínua do processo
          
          Para acesso ao roteiro completo e instrumentos validados, 
          utilize o link de download abaixo.
        `,
        downloadSection: {
          title: "📥 Download da Tese Completa",
          description:
            'Acesse o documento completo "Roteiro de Dispensação - Hanseníase.pdf" com protocolos detalhados, instrumentos validados e manual de implementação.',
          fileSize: "988.5KB",
          fileName: "Roteiro de Dsispensação - Hanseníase.pdf",
        },
        keyPoints: [
          "Protocolo cientificamente validado em estudo de doutorado",
          "Melhoria comprovada em indicadores de qualidade assistencial",
          "Instrumentos prontos para implementação em serviços de saúde",
          "Base científica sólida para farmácia clínica em hanseníase",
        ],
      },
    ],

    quiz: [
      {
        question:
          "Segundo a legislação brasileira, qual é a característica obrigatória da dispensação da dose mensal de PQT-U?",
        options: [
          "Deve ser dispensada mensalmente para uso domiciliar",
          "Deve ser supervisionada e administrada na unidade de saúde",
          "Pode ser dispensada para 2 meses se o paciente for aderente",
          "Deve ser administrada apenas por médicos",
        ],
        correct: 1,
        explanation:
          "A dose mensal de PQT-U deve ser SEMPRE supervisionada e administrada na unidade de saúde. Esta é uma exigência do PCDT e garante a adesão adequada ao tratamento.",
        level: "técnico",
      },
      {
        question:
          "Durante a anamnese farmacêutica, um paciente relata uso de warfarina. Qual a principal preocupação com a PQT-U?",
        options: [
          "Aumento do risco de sangramento",
          "Redução da eficácia da rifampicina",
          "Indução do metabolismo da warfarina pela rifampicina",
          "Potencialização da anticoagulação",
        ],
        correct: 2,
        explanation:
          "A rifampicina é um potente indutor da CYP3A4, aumentando o metabolismo da warfarina e reduzindo sua eficácia anticoagulante. É necessário ajuste da dose e monitorização rigorosa do INR.",
        level: "avançado",
      },
      {
        question:
          "Qual o procedimento correto quando um paciente falta à dose mensal supervisionada?",
        options: [
          "Aguardar o paciente retornar por conta própria",
          "Dispensar a dose para casa na próxima visita",
          "Iniciar busca ativa imediatamente (contato em 24h)",
          "Considerar abandono após 1 mês de falta",
        ],
        correct: 2,
        explanation:
          "A busca ativa deve ser iniciada imediatamente após a falta, com primeiro contato em até 24 horas. A continuidade do tratamento é fundamental para evitar resistência e garantir a cura.",
        level: "técnico",
      },
      {
        question:
          "Na educação farmacêutica, como deve ser abordada a hiperpigmentação pela clofazimina?",
        options: [
          "Como reação adversa grave que pode indicar toxicidade",
          "Como efeito esperado e reversível em 6-12 meses",
          "Recomendando suspensão temporária do medicamento",
          "Sugerindo redução da dose para minimizar o efeito",
        ],
        correct: 1,
        explanation:
          "A hiperpigmentação pela clofazimina é um efeito esperado que ocorre em 100% dos pacientes, sendo reversível em 6-12 meses após o término do tratamento. A educação adequada previne abandono desnecessário.",
        level: "técnico",
      },
      {
        question:
          "Quais são os documentos obrigatórios no protocolo de dispensação farmacêutica de PQT-U?",
        options: [
          "Apenas prescrição médica e cartão do paciente",
          "Livro de dispensação, SINAN, cartão controle e ficha de acompanhamento",
          "Somente registros no sistema informatizado",
          "Prescrição médica e termo de responsabilidade",
        ],
        correct: 1,
        explanation:
          "A documentação completa inclui: livro de dispensação (obrigatório por lei), notificação SINAN (compulsória), cartão de controle do paciente e ficha de acompanhamento farmacoterapêutico.",
        level: "avançado",
      },
    ],
  };

  return (
    <EducationalLayout>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        {/* Module Header */}
        <div
          style={{
            background: "linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)",
            color: "white",
            padding: "30px",
            borderRadius: "12px",
            marginBottom: "30px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "15px",
              marginBottom: "15px",
            }}
          >
            <span style={{ fontSize: "3rem" }}>⚕️</span>
            <div>
              <h1 style={{ margin: 0, fontSize: "2.2rem", fontWeight: "bold" }}>
                {moduleContent.title}
              </h1>
              <p
                style={{ margin: "5px 0 0", fontSize: "1.1rem", opacity: 0.9 }}
              >
                {moduleContent.subtitle}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
            <span
              style={{
                background: "rgba(255,255,255,0.2)",
                padding: "5px 12px",
                borderRadius: "20px",
                fontSize: "0.9rem",
              }}
            >
              📊 {moduleContent.level}
            </span>
            <span
              style={{
                background: "rgba(255,255,255,0.2)",
                padding: "5px 12px",
                borderRadius: "20px",
                fontSize: "0.9rem",
              }}
            >
              ⏱️ {moduleContent.duration}
            </span>
            <span
              style={{
                background: "rgba(255,255,255,0.2)",
                padding: "5px 12px",
                borderRadius: "20px",
                fontSize: "0.9rem",
              }}
            >
              📚 {moduleContent.category}
            </span>
          </div>

          <p style={{ margin: "15px 0 0", fontSize: "1rem", opacity: 0.9 }}>
            {moduleContent.description}
          </p>
        </div>

        {/* Module Content */}
        {moduleContent.sections.map((section, index) => (
          <div
            key={section.id}
            style={{
              background: "white",
              borderRadius: "12px",
              padding: "25px",
              marginBottom: "20px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            }}
          >
            <h2
              style={{
                fontSize: "1.5rem",
                color: "#dc2626",
                marginBottom: "15px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <IndexIndicator
                index={index + 1}
                color="#dc2626"
                variant="badge"
                size="medium"
              />
              {section.title}
            </h2>

            <div
              style={{
                fontSize: "1rem",
                lineHeight: "1.6",
                color: "#444",
                marginBottom: "20px",
              }}
            >
              {renderMarkdownContent(section.content)}
            </div>

            {/* Clinical Cases */}
            {section.clinicalCases && (
              <div
                style={{
                  background: "#f0f9ff",
                  padding: "15px",
                  borderRadius: "8px",
                  marginBottom: "15px",
                  borderLeft: "4px solid #0ea5e9",
                }}
              >
                <h4 style={{ margin: "0 0 10px", color: "#0ea5e9" }}>
                  📋 Casos Clínicos:
                </h4>
                <div
                  style={{
                    fontSize: "0.95rem",
                    lineHeight: "1.6",
                  }}
                >
                  {renderMarkdownContent(section.clinicalCases)}
                </div>
              </div>
            )}

            {/* Ask Assistant */}
            {section.askAssistant && (
              <div
                style={{
                  background: "#fef3c7",
                  padding: "15px",
                  borderRadius: "8px",
                  marginBottom: "15px",
                  borderLeft: "4px solid #f59e0b",
                }}
              >
                <h4 style={{ margin: "0 0 10px", color: "#d97706" }}>
                  🤖 Pergunte ao Assistente:
                </h4>
                <div style={{ fontSize: "0.9rem" }}>
                  {section.askAssistant.suggestedQuestions.map(
                    (question, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: "rgba(251, 191, 36, 0.1)",
                          padding: "8px 12px",
                          borderRadius: "6px",
                          margin: "5px 0",
                          cursor: "pointer",
                          border: "1px solid rgba(251, 191, 36, 0.3)",
                        }}
                      >
                        💬 {question}
                      </div>
                    ),
                  )}
                </div>
              </div>
            )}

            {/* Download Section */}
            {section.downloadSection && (
              <div
                style={{
                  background: "#f3f4f6",
                  padding: "15px",
                  borderRadius: "8px",
                  marginBottom: "15px",
                  borderLeft: "4px solid #6b7280",
                }}
              >
                <h4 style={{ margin: "0 0 10px", color: "#374151" }}>
                  {section.downloadSection.title}
                </h4>
                <p
                  style={{
                    margin: "0 0 10px",
                    fontSize: "0.9rem",
                    color: "#6b7280",
                  }}
                >
                  {section.downloadSection.description}
                </p>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px",
                    background: "white",
                    borderRadius: "6px",
                    border: "1px solid #d1d5db",
                  }}
                >
                  <span style={{ fontSize: "1.5rem" }}>📄</span>
                  <div>
                    <div style={{ fontWeight: "bold", fontSize: "0.9rem" }}>
                      {section.downloadSection.fileName}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                      Tamanho: {section.downloadSection.fileSize}
                    </div>
                  </div>
                  <button
                    style={{
                      marginLeft: "auto",
                      background: "#dc2626",
                      color: "white",
                      border: "none",
                      padding: "8px 16px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "0.9rem",
                    }}
                  >
                    Download
                  </button>
                </div>
              </div>
            )}

            {/* Key Points */}
            <div
              style={{
                background: "#fef2f2",
                padding: "15px",
                borderRadius: "8px",
                borderLeft: "4px solid #dc2626",
              }}
            >
              <h4 style={{ margin: "0 0 10px", color: "#dc2626" }}>
                🎯 Pontos-chave:
              </h4>
              <ul style={{ margin: 0, paddingLeft: "20px" }}>
                {section.keyPoints.map((point, idx) => (
                  <li key={idx} style={{ marginBottom: "5px", color: "#555" }}>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}

        {/* Quiz Section */}
        <div
          style={{
            background: "white",
            borderRadius: "12px",
            padding: "25px",
            marginBottom: "30px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
        >
          <h2
            style={{
              fontSize: "1.5rem",
              color: "#dc2626",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            🧠 Teste seus conhecimentos
          </h2>

          {moduleContent.quiz.map((question, index) => (
            <div
              key={index}
              style={{
                background: "#fef2f2",
                padding: "20px",
                borderRadius: "8px",
                marginBottom: "15px",
              }}
            >
              <h4 style={{ marginBottom: "15px", color: "#333" }}>
                {index + 1}. {question.question}
              </h4>

              {question.options.map((option, optIndex) => (
                <div
                  key={optIndex}
                  style={{
                    padding: "8px 12px",
                    margin: "5px 0",
                    borderRadius: "6px",
                    cursor: "pointer",
                    background:
                      optIndex === question.correct ? "#fde8e8" : "#fff",
                    border:
                      optIndex === question.correct
                        ? "2px solid #dc2626"
                        : "1px solid #ddd",
                  }}
                >
                  {String.fromCharCode(65 + optIndex)}. {option}
                  {optIndex === question.correct && (
                    <span
                      style={{
                        color: "#dc2626",
                        marginLeft: "10px",
                        fontWeight: "bold",
                      }}
                    >
                      ✓ Correto
                    </span>
                  )}
                </div>
              ))}

              <div
                style={{
                  marginTop: "10px",
                  padding: "10px",
                  background: "#fef3cd",
                  borderRadius: "6px",
                  fontSize: "0.9rem",
                  color: "#92400e",
                }}
              >
                <strong>💡 Explicação:</strong> {question.explanation}
              </div>

              <div
                style={{
                  marginTop: "8px",
                  fontSize: "0.8rem",
                  color: "#6b7280",
                }}
              >
                <strong>Nível:</strong> {question.level}
              </div>
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "white",
            padding: "20px",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          }}
        >
          <Link
            href="/modules/tratamento"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              background: "#6b7280",
              color: "white",
              textDecoration: "none",
              borderRadius: "8px",
              fontWeight: "bold",
            }}
          >
            ← Anterior: Tratamento PQT-U
          </Link>

          <Link
            href="/modules/vida-com-doenca"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              background: "#dc2626",
              color: "white",
              textDecoration: "none",
              borderRadius: "8px",
              fontWeight: "bold",
            }}
          >
            Próximo: Vida com a Doença →
          </Link>
        </div>
      </div>
    </EducationalLayout>
  );
}
