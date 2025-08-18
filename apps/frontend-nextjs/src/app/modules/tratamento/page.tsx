'use client';

import EducationalLayout from '@/components/layout/EducationalLayout';
import Link from 'next/link';
import { HanseníaseModuleStructuredData } from '@/components/seo/MedicalStructuredData';
import { ContentSegment, AudienceSelector, useAudiencePreference } from '@/components/content/ContentSegmentation';
import { GlossaryWrapper } from '@/components/glossary/AutoGlossary';
import LastUpdated from '@/components/content/LastUpdated';

export default function TratamentoModulePage() {
  const { selectedAudience, updateAudience } = useAudiencePreference();
  const moduleContent = {
    title: 'Tratamento da Hanseníase',
    subtitle: 'Poliquimioterapia Única (PQT-U) - Protocolo PCDT Hanseníase 2022',
    duration: '30 minutos',
    level: 'Técnico-científico',
    category: 'Farmacoterapia',
    description: 'Módulo técnico-científico para profissionais de saúde sobre a Poliquimioterapia Única. Baseado no PCDT Hanseníase 2022 do Ministério da Saúde e evidências científicas atuais.',
    targetAudience: 'Farmacêuticos, médicos, enfermeiros e estudantes da área da saúde',
    references: [
      'Brasil. Ministério da Saúde. Protocolo Clínico e Diretrizes Terapêuticas da Hanseníase (2022)',
      'WHO. Guidelines for the diagnosis, treatment and prevention of leprosy (2018)',
      'WHO Expert Committee on Leprosy. Eighth Report. Geneva: WHO; 2012'
    ],
    
    sections: [
      {
        id: 'fundamentos-pqt',
        title: '🎯 Fundamentos da Poliquimioterapia Única (PQT-U)',
        content: `
          **Base Científica:** A PQT-U foi desenvolvida pela OMS em 1981 e implementada no Brasil como estratégia única para eliminar a hanseníase como problema de saúde pública, superando a monoterapia e prevenindo resistência bacteriana.
          
          **PRINCÍPIOS FUNDAMENTAIS:**
          
          **1. Combinação Terapêutica Sinérgica:**
          • **Rifampicina:** Bactericida potente, elimina 99,9% dos bacilos em dose única
          • **Clofazimina:** Bactericida de ação lenta, anti-inflamatória, previne resistência
          • **Dapsona:** Bacteriostática, custo-efetiva, boa penetração tecidual
          
          **2. Esquema Unificado (PQT-U desde 2000):**
          • **Dose única mensal supervisionada:** Máxima absorção e adesão
          • **Doses diárias autoadministradas:** Manutenção dos níveis terapêuticos
          • **6 doses mensais:** Independente da classificação operacional (PB/MB)
          
          **3. Mecanismos de Ação Complementares:**
          • **Rifampicina:** Inibição da RNA polimerase bacteriana
          • **Clofazimina:** Ligação ao DNA, geração de radicais livres
          • **Dapsona:** Inibição da síntese de folato via competição com PABA
          
          **4. Vantagens da PQT-U:**
          • **Simplificação operacional:** Um único esquema para todos os casos
          • **Redução de abandono:** Tratamento mais curto (6 vs 12-24 meses)
          • **Prevenção de resistência:** Combinação de múltiplos mecanismos
          • **Custo-efetividade:** Redução de custos operacionais em 40%
          • **Eliminação de recidivas:** Taxa < 1% após PQT-U completa
        `,
        clinicalCases: `
          **💼 Caso Clínico 1:** Paciente com hanseníase multibacilar (8 lesões, IB 3+). Iniciado PQT-U: após 2ª dose mensal, redução significativa das lesões e negativação progressiva da baciloscopia. **Evolução:** Cura clínica e bacteriológica após 6 doses.
          
          **💼 Caso Clínico 2:** Paciente paucibacilar com 3 lesões anestésicas. Mesmo sendo PB pelo número de lesões, optou-se por PQT-U devido à facilidade operacional. **Resultado:** Excelente resposta terapêutica, sem diferença em relação ao PQT-PB tradicional.
        `,
        keyPoints: [
          'PQT-U é eficaz para todos os casos de hanseníase, independente da classificação',
          'Rifampicina é o componente mais importante: bactericida potente',
          'Combinação previne desenvolvimento de resistência bacteriana',
          '6 doses mensais supervisionadas garantem cura em >99% dos casos'
        ],
        askAssistant: {
          suggestedQuestions: [
            'Dr. Gasnelio, qual a diferença entre PQT-U e os esquemas antigos?',
            'Como a rifampicina atua contra o M. leprae?',
            'Por que 6 doses são suficientes na PQT-U?'
          ]
        }
      },
      {
        id: 'composicao-posologia',
        title: '💊 Composição e Posologia da PQT-U',
        content: `
          **APRESENTAÇÃO PADRONIZADA (Blister Mensal):**
          
          **DOSE MENSAL SUPERVISIONADA (1º dia do mês):**
          • **Rifampicina:** 600mg (2 cápsulas de 300mg) - VO, jejum
          • **Clofazimina:** 300mg (3 cápsulas de 100mg) - VO, com alimento
          • **Dapsona:** 100mg (2 comprimidos de 50mg) - VO, qualquer horário
          
          **DOSES DIÁRIAS AUTOADMINISTRADAS (27-28 dias):**
          • **Clofazimina:** 50mg (1 cápsula) - VO, diário, com alimento
          • **Dapsona:** 100mg (2 comprimidos de 50mg) - VO, diário
          
          **POSOLOGIA PEDIÁTRICA (Crianças 30-50kg):**
          **Dose mensal supervisionada:**
          • **Rifampicina:** 450mg (ajustada por peso)
          • **Clofazimina:** 150mg (1-2 cápsulas)
          • **Dapsona:** 50mg (1 comprimido)
          
          **Doses diárias:**
          • **Clofazimina:** 50mg em dias alternados
          • **Dapsona:** 50mg diário
          
          **ASPECTOS FARMACOLÓGICOS CRÍTICOS:**
          
          **1. Rifampicina (Bactericida):**
          • **Absorção:** Máxima em jejum (redução 30% com alimentos)
          • **Distribuição:** Excelente penetração tecidual e intracelular
          • **Metabolismo:** Hepático (CYP3A4), indutor enzimático potente
          • **Eliminação:** Biliar (60%) + renal (40%)
          • **Meia-vida:** 2-3 horas (dose única), 1-2 horas (doses repetidas)
          
          **2. Clofazimina (Bactericida lenta):**
          • **Absorção:** Melhorada com alimentos (aumento 70%)
          • **Distribuição:** Lipofílica, acúmulo em tecido adiposo e reticuloendotelial
          • **Eliminação:** Extremamente lenta (meia-vida 70 dias)
          • **Coloração:** Deposição em pele e mucosas (reversível em 6-12 meses)
          
          **3. Dapsona (Bacteriostática):**
          • **Absorção:** Rápida e completa (>95%)
          • **Distribuição:** Boa penetração tecidual, ligação proteica 50-80%
          • **Metabolismo:** Hepático (acetilação, hidroxilação)
          • **Eliminação:** Renal (85%), meia-vida 24-30 horas
          
          **INTERAÇÕES MEDICAMENTOSAS IMPORTANTES:**
          
          **Rifampicina (Indutor CYP3A4):**
          • **Reduz eficácia:** Contraceptivos orais, warfarina, corticoides
          • **Ajuste necessário:** Anticoagulantes, antidiabéticos, antirretrovirais
          • **Orientação:** Métodos contraceptivos alternativos durante tratamento
          
          **Dapsona:**
          • **Antagonismo:** Trimetoprima (competição por sítio ativo)
          • **Potencialização:** Probenecida (reduz eliminação renal)
          • **Toxicidade:** Primaquina (hemólise aditiva)
        `,
        clinicalCases: `
          **💼 Caso Clínico 3:** Mulher em idade fértil usando contraceptivo oral. Iniciada PQT-U - orientada sobre redução da eficácia contraceptiva pela rifampicina. **Conduta:** Método contraceptivo alternativo durante tratamento + 1 mês após término.
          
          **💼 Caso Clínico 4:** Paciente diabético em uso de glibenclamida. Após início da PQT-U, episódios de hiperglicemia. **Causa:** Indução enzimática pela rifampicina. **Ajuste:** Aumento da dose do hipoglicemiante com monitorização glicêmica.
        `,
        keyPoints: [
          'Dose mensal supervisionada OBRIGATÓRIA - garante adesão e eficácia',
          'Rifampicina em jejum para máxima absorção',
          'Clofazimina com alimentos para melhor absorção',
          'Interações da rifampicina requerem ajustes terapêuticos'
        ],
        askAssistant: {
          suggestedQuestions: [
            'Dr. Gasnelio, por que a rifampicina deve ser tomada em jejum?',
            'Como orientar paciente sobre coloração da clofazimina?',
            'Quais medicamentos interagem com a rifampicina?'
          ]
        }
      },
      {
        id: 'administracao-dispensacao',
        title: '📋 Administração e Dispensação Farmacêutica',
        content: `
          **PROTOCOLO DE DISPENSAÇÃO FARMACÊUTICA:**
          
          **1. PRIMEIRA DISPENSAÇÃO (Dose Inicial):**
          
          **Verificações Obrigatórias:**
          • **Prescrição médica:** Diagnóstico confirmado, classificação operacional
          • **Identificação completa:** Nome, CPF, cartão SUS, endereço
          • **Anamnese farmacêutica:** Alergias, medicamentos em uso, comorbidades
          • **Orientações iniciais:** Posologia, administração, reações adversas
          
          **Documentação Necessária:**
          • **Livro de Registro:** SINAN, notificação compulsória
          • **Cartão de Controle:** Datas das doses mensais, evolução clínica
          • **Termo de Esclarecimento:** Assinatura do paciente/responsável
          
          **2. DOSES MENSAIS SUPERVISIONADAS:**
          
          **Protocolo de Administração:**
          • **Agendamento:** 1º dia útil de cada mês (tolerância ±3 dias)
          • **Jejum:** Rifampicina administrada com estômago vazio
          • **Supervisão direta:** Observar deglutição de todos os comprimidos
          • **Tempo de observação:** 30 minutos (reações imediatas)
          
          **Avaliação Mensal:**
          • **Adesão:** Conferir cartelas de doses diárias (contagem de comprimidos)
          • **Reações adversas:** Questionário estruturado, exame físico
          • **Evolução clínica:** Regressão de lesões, melhora neurológica
          • **Orientações:** Reforçar importância da continuidade
          
          **3. ORIENTAÇÕES TÉCNICAS ESPECÍFICAS:**
          
          **Armazenamento:**
          • **Temperatura:** 15-30°C, proteger da luz e umidade
          • **Local:** Armário fechado, longe de crianças
          • **Prazo:** Utilizar dentro do prazo de validade (não fracionar blisters)
          
          **Administração:**
          • **Rifampicina:** Jejum de 1 hora antes e 2 horas após
          • **Clofazimina:** Junto ou após refeições (melhor tolerância)
          • **Dapsona:** Qualquer horário, preferencialmente com alimentos
          • **Água:** Volume adequado (200ml) para facilitar deglutição
          
          **4. MONITORIZAÇÃO TERAPÊUTICA:**
          
          **Parâmetros de Eficácia:**
          • **Clínico:** Regressão de lesões (50% em 3 meses)
          • **Bacteriológico:** Redução do IB (1 log/ano)
          • **Neurológico:** Estabilização/melhora funcional
          • **Qualidade de vida:** Questionário padronizado
          
          **Sinais de Alerta:**
          • **Piora clínica:** Novas lesões, aumento de espessamento neural
          • **Reações severas:** Hepatotoxicidade, hemólise, neuropatia
          • **Não adesão:** Faltas >2 doses mensais ou irregularidade diária
          
          **5. DISPENSAÇÃO PARA CASOS ESPECIAIS:**
          
          **Gestantes:**
          • **Segurança:** PQT-U segura durante gestação e lactação
          • **Monitorização:** Hemograma mensal (risco de anemia)
          • **Parto:** Não interromper tratamento
          
          **Idosos:**
          • **Função renal:** Creatinina basal e durante tratamento
          • **Função hepática:** TGO, TGP mensais se >65 anos
          • **Polifarmácia:** Revisão de interações medicamentosas
          
          **Crianças:**
          • **Peso:** Ajuste posológico rigoroso (10mg/kg rifampicina)
          • **Adesão:** Envolvimento familiar, formas farmacêuticas adequadas
          • **Desenvolvimento:** Monitorização do crescimento
        `,
        clinicalCases: `
          **💼 Caso Clínico 5:** Paciente faltou às doses mensais de março e abril. Na consulta de maio, apresentava nova lesão. **Conduta:** Investigação de causas de abandono, busca ativa, reforço de orientações e reinício supervisionado rigoroso.
          
          **💼 Caso Clínico 6:** Gestante no 2º trimestre com hanseníase MB. **Conduta:** Manutenção da PQT-U, monitorização mensal com hemograma, orientação sobre segurança na gestação/lactação.
        `,
        keyPoints: [
          'Dose mensal SEMPRE supervisionada - nunca dispensar para casa',
          'Documentação rigorosa: SINAN, cartão controle, evolução clínica',
          'Monitorização ativa de adesão através de contagem de comprimidos',
          'Busca ativa obrigatória para faltosos (>1 dose mensal)'
        ],
        askAssistant: {
          suggestedQuestions: [
            'Dr. Gasnelio, como proceder quando paciente falta à dose mensal?',
            'Qual o protocolo para gestantes em PQT-U?',
            'Como avaliar a adesão às doses diárias?'
          ]
        }
      },
      {
        id: 'reacoes-adversas',
        title: '⚠️ Reações Adversas e Manejo Clínico',
        content: `
          **CLASSIFICAÇÃO E MANEJO DAS REAÇÕES ADVERSAS:**
          
          **1. REAÇÕES RELACIONADAS À RIFAMPICINA:**
          
          **Reações Gastrointestinais (20-30%):**
          • **Sintomas:** Náuseas, vômitos, dor epigástrica, diarreia
          • **Mecanismo:** Irritação gástrica direta
          • **Manejo:** Administrar com pequena quantidade de alimento (contradiz jejum ideal)
          • **Evolução:** Melhora após 2-4 semanas (tolerância)
          
          **Síndrome Pseudogripal (5-10%):**
          • **Sintomas:** Febre, cefaleia, mialgias, artralgias
          • **Ocorrência:** Doses intermitentes ou irregulares
          • **Prevenção:** Regularidade rigorosa das doses mensais
          • **Tratamento:** Sintomáticos, não suspender medicação
          
          **Hepatotoxicidade (<1%, mas grave):**
          • **Manifestações:** Icterícia, colúria, acolia, TGO/TGP >3x VN
          • **Fatores de risco:** Idade >50 anos, etilismo, hepatopatias
          • **Monitorização:** TGO/TGP basal e mensal em pacientes de risco
          • **Conduta:** Suspensão imediata se TGO/TGP >5x VN
          
          **2. REAÇÕES RELACIONADAS À CLOFAZIMINA:**
          
          **Hiperpigmentação (100% dos casos):**
          • **Localização:** Pele, conjuntivas, mucosas
          • **Coloração:** Negra, vermelho-amarronzada, azul-acinzentada
          • **Intensidade:** Dose e tempo-dependente
          • **Reversibilidade:** 6-12 meses após término (pode persistir até 4 anos)
          • **Orientação:** Tranquilizar paciente, explicar reversibilidade
          
          **Distúrbios Gastrointestinais (10-15%):**
          • **Sintomas:** Dor abdominal, diarreia, náuseas
          • **Manejo:** Administrar sempre com alimentos
          • **Casos graves:** Enterite eosinofílica (rara, mas grave)
          
          **Fotossensibilidade:**
          • **Mecanismo:** Depósito de clofazimina + exposição UV
          • **Prevenção:** Protetor solar FPS >30, roupas adequadas
          • **Orientação:** Evitar exposição solar intensa
          
          **3. REAÇÕES RELACIONADAS À DAPSONA:**
          
          **Anemia Hemolítica (5-15%):**
          • **Fatores de risco:** Deficiência G6PD, doses altas
          • **Manifestações:** Palidez, icterícia, urina escura
          • **Monitorização:** Hemograma mensal nos primeiros 3 meses
          • **Manejo:** Redução de dose ou suspensão conforme gravidade
          
          **Metemoglobinemia (1-5%):**
          • **Sintomas:** Cianose, dispneia, cefaleia
          • **Diagnóstico:** Dosagem de metemoglobina (>15% patológico)
          • **Tratamento:** Azul de metileno 1-2mg/kg IV (se >30%)
          
          **Síndrome de Hipersensibilidade (Rara):**
          • **Manifestações:** Febre, rash, eosinofilia, hepatite
          • **Tempo:** 2-6 semanas após início
          • **Conduta:** Suspensão imediata, corticoterapia
          
          **4. REAÇÕES ADVERSAS TIPO 1 E 2 (Estados Reacionais):**
          
          **Distinção Crucial:**
          • **Estados reacionais:** Exacerbação da resposta imune (não suspender PQT)
          • **Reações medicamentosas:** Toxicidade direta (avaliar suspensão)
          
          **Tipo 1 (Reação Reversa):**
          • **Patogenia:** Aumento da imunidade celular durante tratamento
          • **Manifestações:** Eritema e edema de lesões, neurite aguda
          • **Tratamento:** Prednisona 1mg/kg/dia, manter PQT-U
          
          **Tipo 2 (Eritema Nodoso Hansênico):**
          • **Patogenia:** Deposição de imunocomplexos
          • **Manifestações:** Nódulos subcutâneos dolorosos, febre, mal-estar
          • **Tratamento:** Talidomida 400mg/dia (homens) ou prednisona
          
          **5. ALGORITMO DE DECISÃO TERAPÊUTICA:**
          
          **Reação Leve-Moderada:**
          • **Conduta:** Manter tratamento + medidas sintomáticas
          • **Monitorização:** Semanal até estabilização
          
          **Reação Grave:**
          • **Hepatotoxicidade severa:** Suspender rifampicina temporariamente
          • **Anemia grave (Hb <8g/dL):** Suspender dapsona, transfusão se necessário
          • **Síndrome de hipersensibilidade:** Suspender medicamento causal
          
          **Esquemas Alternativos (Raros):**
          • **Sem rifampicina:** Ofloxacina + clofazimina + dapsona
          • **Sem dapsona:** Rifampicina + clofazimina + ofloxacina
          • **Sem clofazimina:** Rifampicina + dapsona + ofloxacina
        `,
        clinicalCases: `
          **💼 Caso Clínico 7:** Paciente desenvolveu icterícia após 3ª dose mensal. TGO: 280 U/L (VN: <40). **Conduta:** Suspensão imediata da rifampicina, investigação hepatológica, substituição por ofloxacina. **Evolução:** Normalização das enzimas em 4 semanas.
          
          **💼 Caso Clínico 8:** Paciente queixando-se de coloração escura da pele. **Avaliação:** Relacionada à clofazimina (normal e esperada). **Conduta:** Orientação sobre reversibilidade, suporte psicológico, continuidade do tratamento.
        `,
        keyPoints: [
          'Distinguir estados reacionais (manter PQT) de reações medicamentosas (avaliar suspensão)',
          'Hiperpigmentação pela clofazimina é esperada e reversível',
          'Monitorização hepática obrigatória em pacientes de risco para hepatotoxicidade',
          'Anemia hemolítica requer monitorização laboratorial regular'
        ],
        askAssistant: {
          suggestedQuestions: [
            'Dr. Gasnelio, como diferenciar estado reacional de reação medicamentosa?',
            'Quando devo suspender a PQT-U por reação adversa?',
            'Como orientar paciente sobre hiperpigmentação da clofazimina?'
          ]
        }
      },
      {
        id: 'seguimento-alta',
        title: '📊 Seguimento Terapêutico e Critérios de Alta',
        content: `
          **PROTOCOLO DE SEGUIMENTO TERAPÊUTICO:**
          
          **1. CRONOGRAMA DE AVALIAÇÕES:**
          
          **Avaliação Mensal (Durante PQT-U):**
          • **Clínica:** Regressão de lesões, função neural, incapacidades
          • **Laboratorial:** Baciloscopia (opcional), hemograma se indicado
          • **Adesão:** Contagem de comprimidos, comparecimento supervisionado
          • **Reações adversas:** Questionário padronizado, exame físico
          • **Educação:** Reforço de orientações, esclarecimento de dúvidas
          
          **Marco da 3ª Dose (Meio do Tratamento):**
          • **Avaliação de eficácia:** Redução ≥50% das lesões ativas
          • **Baciloscopia:** Redução do IB (se positiva inicialmente)
          • **Função neural:** Testes de sensibilidade e força muscular
          • **Adesão:** Análise de regularidade e causas de faltas
          
          **6ª Dose (Completar PQT-U):**
          • **Avaliação final:** Regressão completa/quase completa das lesões
          • **Função neurológica:** Estabilização ou melhora
          • **Orientação de alta:** Critérios cumpridos, seguimento pós-alta
          
          **2. CRITÉRIOS DE ALTA POR CURA:**
          
          **Critérios Obrigatórios (TODOS devem ser atendidos):**
          • **✅ Administração completa:** 6 doses mensais supervisionadas
          • **✅ Regularidade:** Máximo 9 meses para completar 6 doses
          • **✅ Melhora clínica:** Regressão significativa das lesões ativas
          • **✅ Estabilidade neurológica:** Ausência de neurite ativa
          • **✅ Ausência de reações:** Sem episódios reacionais não controlados
          
          **Critérios Complementares (Desejáveis):**
          • **Baciloscopia:** Negativação ou redução significativa do IB
          • **Função neural:** Melhora ou estabilização das incapacidades
          • **Qualidade de vida:** Retorno às atividades normais
          
          **3. SITUAÇÕES ESPECIAIS - EXTENSÃO DO TRATAMENTO:**
          
          **Casos Excepcionais (Raros):**
          • **Piora clínica:** Novas lesões ativas durante tratamento
          • **Baciloscopia persistente:** IB alto sem redução após 6 doses
          • **Estados reacionais graves:** Episódios recorrentes não controlados
          
          **Conduta:**
          • **Avaliação especializada:** Referência para centro de referência
          • **Investigação:** Resistência bacteriana, adesão, diagnóstico diferencial
          • **Consideração:** Extensão para 12 doses mensais (casos selecionados)
          
          **4. SEGUIMENTO PÓS-ALTA:**
          
          **Cronograma de Retornos:**
          • **1º retorno:** 6 meses após alta
          • **2º retorno:** 12 meses após alta
          • **Retornos anuais:** Até 5 anos para detecção de recidiva
          
          **Avaliação Pós-Alta:**
          • **Pesquisa de recidiva:** Novas lesões com sinais cardinais
          • **Função neurológica:** Progressão de incapacidades
          • **Estados reacionais tardios:** Podem ocorrer até 2 anos pós-alta
          • **Qualidade de vida:** Reintegração social e profissional
          
          **5. INDICADORES DE QUALIDADE DO TRATAMENTO:**
          
          **Taxa de Cura (Meta: >95%):**
          • **Numerador:** Pacientes que completaram 6 doses regulares
          • **Denominador:** Total de casos iniciados no período
          
          **Taxa de Abandono (Meta: <5%):**
          • **Definição:** >12 meses sem comparecimento
          • **Causas:** Reações adversas, falta de informação, estigma
          • **Prevenção:** Busca ativa, orientação adequada, suporte social
          
          **Taxa de Recidiva (Meta: <1%):**
          • **Definição:** Reaparecimento de sinais/sintomas após alta por cura
          • **Tempo:** Geralmente 2-5 anos após alta
          • **Fatores:** Adesão inadequada, resistência, reinfecção
          
          **6. DOCUMENTAÇÃO E NOTIFICAÇÃO:**
          
          **Alta por Cura:**
          • **SINAN:** Alteração de situação para "cura"
          • **Cartão do paciente:** Carimbo e data da alta
          • **Relatório:** Resumo da evolução clínica e terapêutica
          
          **Transferência:**
          • **Comunicação formal:** Entre unidades de saúde
          • **Documentos:** Cartão controle, evolução, exames
          • **Continuidade:** Garantir não interrupção do tratamento
          
          **Óbito:**
          • **SINAN:** Notificação com causa básica da morte
          • **Investigação:** Relação com hanseníase ou tratamento
          • **Família:** Orientação sobre vigilância de contactantes
        `,
        clinicalCases: `
          **💼 Caso Clínico 9:** Paciente completou 6 doses de PQT-U com excelente evolução clínica. Lesões completamente regredidas, função neural estável. **Conduta:** Alta por cura, agendamento para seguimento em 6 meses.
          
          **💼 Caso Clínico 10:** Após 6 doses, paciente ainda apresenta lesões ativas e IB elevado. **Investigação:** Avaliação de adesão (adequada) e resistência. **Conduta:** Referência para centro especializado, consideração de extensão terapêutica.
        `,
        keyPoints: [
          'Alta por cura após 6 doses regulares, independente de baciloscopia',
          'Seguimento pós-alta obrigatório por 5 anos para detecção de recidiva',
          'Extensão do tratamento apenas em casos excepcionais com avaliação especializada',
          'Documentação rigorosa no SINAN para vigilância epidemiológica'
        ],
        askAssistant: {
          suggestedQuestions: [
            'Dr. Gasnelio, quando devo considerar estender o tratamento além de 6 doses?',
            'Qual a diferença entre recidiva e estado reacional tardio?',
            'Como fazer o seguimento pós-alta adequado?'
          ]
        }
      },
      {
        id: 'tese-pqt-content',
        title: '📖 Conteúdo da Tese: Protocolo de Dispensação PQT-U',
        content: `
          **Baseado na tese "Roteiro de Dispensação - Hanseníase.pdf"**
          
          Esta seção apresenta os protocolos técnico-científicos de dispensação farmacêutica 
          desenvolvidos especificamente para a PQT-U, baseados na tese de doutorado e 
          nas diretrizes do PCDT Hanseníase 2022.
          
          **📋 ROTEIRO DE DISPENSAÇÃO FARMACÊUTICA:**
          
          **1. Avaliação Inicial do Paciente:**
          • Verificação da prescrição médica e diagnóstico
          • Anamnese farmacêutica completa (alergias, medicamentos, comorbidades)
          • Orientações sobre posologia e administração
          • Esclarecimentos sobre reações adversas esperadas
          
          **2. Protocolo de Dose Mensal Supervisionada:**
          • Administração supervisionada obrigatória no 1º dia útil do mês
          • Observação da deglutição de todos os medicamentos
          • Monitorização por 30 minutos (reações imediatas)
          • Avaliação de adesão às doses diárias
          
          **3. Acompanhamento Farmacoterapêutico:**
          • Identificação precoce de reações adversas
          • Orientações sobre interações medicamentosas
          • Suporte para manutenção da adesão terapêutica
          • Interface com equipe médica e de enfermagem
          
          **4. Educação em Saúde:**
          • Informações sobre a doença e seu tratamento
          • Orientações sobre prevenção de incapacidades
          • Esclarecimentos sobre estigma e discriminação
          • Apoio à reintegração social
          
          Para acesso ao protocolo completo de dispensação, utilize o link de download abaixo.
        `,
        downloadSection: {
          title: '📥 Download da Tese Completa',
          description: 'Acesse o documento completo "Roteiro de Dispensação - Hanseníase.pdf" para consulta offline e protocolos detalhados.',
          fileSize: '988.5KB',
          fileName: 'Roteiro de Dsispensação - Hanseníase.pdf'
        },
        keyPoints: [
          'Protocolo validado cientificamente para farmacêuticos clínicos',
          'Baseado nas diretrizes mais atuais do Ministério da Saúde',
          'Foco na dispensação segura e acompanhamento farmacoterapêutico',
          'Orientações específicas para manejo de reações adversas'
        ]
      }
    ],
    
    quiz: [
      {
        question: 'Qual é o princípio fundamental da Poliquimioterapia Única (PQT-U) implementada desde 2000?',
        options: [
          'Esquema personalizado baseado na classificação operacional (PB/MB)',
          'Dose única mensal para todos os medicamentos',
          'Esquema único de 6 doses mensais independente da classificação',
          'Tratamento diferenciado para crianças e adultos'
        ],
        correct: 2,
        explanation: 'A PQT-U estabelece um esquema único de 6 doses mensais supervisionadas para TODOS os casos de hanseníase, independentemente da classificação operacional, simplificando o tratamento e melhorando a adesão.',
        level: 'técnico'
      },
      {
        question: 'Por que a rifampicina deve ser administrada em jejum na dose mensal supervisionada?',
        options: [
          'Para reduzir reações gastrointestinais',
          'Para melhorar a absorção em até 30%',
          'Para evitar interações com outros medicamentos',
          'Para facilitar a deglutição'
        ],
        correct: 1,
        explanation: 'A rifampicina tem absorção reduzida em até 30% quando administrada com alimentos. O jejum de 1 hora antes e 2 horas após garante absorção máxima e eficácia terapêutica.',
        level: 'técnico'
      },
      {
        question: 'Uma paciente em PQT-U apresenta coloração azul-acinzentada na pele. Qual a conduta adequada?',
        options: [
          'Suspender imediatamente a clofazimina',
          'Reduzir a dose da clofazimina pela metade',
          'Orientar sobre normalidade e reversibilidade da hiperpigmentação',
          'Trocar clofazimina por ofloxacina'
        ],
        correct: 2,
        explanation: 'A hiperpigmentação pela clofazimina ocorre em 100% dos casos, é dose-dependente e reversível em 6-12 meses após o término. A orientação adequada e suporte psicológico são fundamentais para manter a adesão.',
        level: 'técnico'
      },
      {
        question: 'Quais são os critérios obrigatórios para alta por cura na PQT-U?',
        options: [
          'Baciloscopia negativa e ausência total de lesões',
          '6 doses mensais completas + melhora clínica + estabilidade neurológica',
          'Redução de 90% das lesões iniciais',
          '12 meses de tratamento regular sem faltas'
        ],
        correct: 1,
        explanation: 'Os critérios para alta incluem: 6 doses mensais supervisionadas completas, melhora clínica significativa, estabilidade neurológica e ausência de estados reacionais não controlados. A baciloscopia não é critério obrigatório.',
        level: 'avançado'
      },
      {
        question: 'Um paciente desenvolveu TGO: 280 U/L (VN <40) após a 3ª dose de PQT-U. Qual a conduta imediata?',
        options: [
          'Reduzir dose da rifampicina pela metade',
          'Manter tratamento e monitorizar semanalmente',
          'Suspender rifampicina e substituir por ofloxacina',
          'Suspender toda a PQT-U por 30 dias'
        ],
        correct: 2,
        explanation: 'TGO >5x o valor normal indica hepatotoxicidade grave pela rifampicina. Deve-se suspender imediatamente a rifampicina e substituí-la por ofloxacina, mantendo clofazimina e dapsona.',
        level: 'avançado'
      }
    ]
  };

  return (
    <>
      <HanseníaseModuleStructuredData
        moduleTitle={moduleContent.title}
        moduleDescription={moduleContent.description}
        moduleType="treatment"
        duration={moduleContent.duration}
        level={moduleContent.level}
        category={moduleContent.category}
      />
      <EducationalLayout>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Module Header */}
        <div style={{
          background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
          color: 'white',
          padding: '30px',
          borderRadius: '12px',
          marginBottom: '30px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
            <span style={{ fontSize: '3rem' }}>💊</span>
            <div>
              <h1 style={{ margin: 0, fontSize: '2.2rem', fontWeight: 'bold' }}>
                {moduleContent.title}
              </h1>
              <p style={{ margin: '5px 0 0', fontSize: '1.1rem', opacity: 0.9 }}>
                {moduleContent.subtitle}
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            <span style={{
              background: 'rgba(255,255,255,0.2)',
              padding: '5px 12px',
              borderRadius: '20px',
              fontSize: '0.9rem'
            }}>
              📊 {moduleContent.level}
            </span>
            <span style={{
              background: 'rgba(255,255,255,0.2)',
              padding: '5px 12px',
              borderRadius: '20px',
              fontSize: '0.9rem'
            }}>
              ⏱️ {moduleContent.duration}
            </span>
            <span style={{
              background: 'rgba(255,255,255,0.2)',
              padding: '5px 12px',
              borderRadius: '20px',
              fontSize: '0.9rem'
            }}>
              📚 {moduleContent.category}
            </span>
          </div>
          
          <p style={{ margin: '15px 0 0', fontSize: '1rem', opacity: 0.9 }}>
            {moduleContent.description}
          </p>
        </div>

        {/* Medical Content Validation */}
        <LastUpdated 
          date="2024-12-01"
          content="Módulo de Tratamento PQT-U"
          version="1.2"
          reviewer="Dr. Ana Paula - Farmacêutica Clínica"
          source="PCDT Hanseníase 2022 - Ministério da Saúde"
          variant="medical"
        />

        {/* Audience Selector */}
        <AudienceSelector 
          selectedAudience={selectedAudience}
          onAudienceChange={updateAudience}
        />

        {/* Module Content */}
        {moduleContent.sections.map((section, index) => {
          // Define audience and complexity based on section content
          let audience: ('professional' | 'patient' | 'student' | 'general')[] = ['professional'];
          let complexity: 'basic' | 'intermediate' | 'advanced' | 'technical' = 'technical';
          
          // Adjust based on section content
          if (section.id === 'fundamentos-pqt') {
            audience = ['professional', 'student'];
            complexity = 'intermediate';
          } else if (section.id === 'composicao-posologia') {
            audience = ['professional'];
            complexity = 'technical';
          } else if (section.id === 'administracao-dispensacao') {
            audience = ['professional'];
            complexity = 'advanced';
          } else if (section.id === 'reacoes-adversas') {
            audience = ['professional', 'student'];
            complexity = 'advanced';
          } else if (section.id === 'seguimento-alta') {
            audience = ['professional'];
            complexity = 'advanced';
          } else if (section.id === 'tese-pqt-content') {
            audience = ['professional', 'student'];
            complexity = 'technical';
          }

          return (
            <ContentSegment
              key={section.id}
              audience={audience}
              complexity={complexity}
              title={section.title}
              showAudienceTag={true}
              allowToggle={true}
              defaultVisible={true}
            >
              <GlossaryWrapper enabled={true}>
                <div style={{
                  fontSize: '1rem',
                  lineHeight: '1.6',
                  color: '#444',
                  marginBottom: '20px',
                  whiteSpace: 'pre-line'
                }}>
                  {section.content}
                </div>
              </GlossaryWrapper>
            
            {/* Clinical Cases */}
            {section.clinicalCases && (
              <div style={{
                background: '#f0f9ff',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '15px',
                borderLeft: '4px solid #0ea5e9'
              }}>
                <h4 style={{ margin: '0 0 10px', color: '#0ea5e9' }}>📋 Casos Clínicos:</h4>
                <div style={{ fontSize: '0.95rem', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
                  {section.clinicalCases}
                </div>
              </div>
            )}
            
            {/* Ask Assistant */}
            {section.askAssistant && (
              <div style={{
                background: '#fef3c7',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '15px',
                borderLeft: '4px solid #f59e0b'
              }}>
                <h4 style={{ margin: '0 0 10px', color: '#d97706' }}>🤖 Pergunte ao Assistente:</h4>
                <div style={{ fontSize: '0.9rem' }}>
                  {section.askAssistant.suggestedQuestions.map((question, idx) => (
                    <div key={idx} style={{
                      background: 'rgba(251, 191, 36, 0.1)',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      margin: '5px 0',
                      cursor: 'pointer',
                      border: '1px solid rgba(251, 191, 36, 0.3)'
                    }}>
                      💬 {question}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Download Section */}
            {section.downloadSection && (
              <div style={{
                background: '#f3f4f6',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '15px',
                borderLeft: '4px solid #6b7280'
              }}>
                <h4 style={{ margin: '0 0 10px', color: '#374151' }}>{section.downloadSection.title}</h4>
                <p style={{ margin: '0 0 10px', fontSize: '0.9rem', color: '#6b7280' }}>
                  {section.downloadSection.description}
                </p>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px',
                  background: 'white',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db'
                }}>
                  <span style={{ fontSize: '1.5rem' }}>📄</span>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                      {section.downloadSection.fileName}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                      Tamanho: {section.downloadSection.fileSize}
                    </div>
                  </div>
                  <button style={{
                    marginLeft: 'auto',
                    background: '#059669',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.9rem'
                  }}>
                    Download
                  </button>
                </div>
              </div>
            )}
            
            {/* Key Points */}
            <div style={{
              background: '#f0fdf4',
              padding: '15px',
              borderRadius: '8px',
              borderLeft: '4px solid #059669'
            }}>
              <h4 style={{ margin: '0 0 10px', color: '#059669' }}>🎯 Pontos-chave:</h4>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {section.keyPoints.map((point, idx) => (
                  <li key={idx} style={{ marginBottom: '5px', color: '#555' }}>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </ContentSegment>
        );
        })}

        {/* Quiz Section */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '25px',
          marginBottom: '30px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            color: '#059669',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            🧠 Teste seus conhecimentos
          </h2>
          
          {moduleContent.quiz.map((question, index) => (
            <div key={index} style={{
              background: '#f0fdf4',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '15px'
            }}>
              <h4 style={{ marginBottom: '15px', color: '#333' }}>
                {index + 1}. {question.question}
              </h4>
              
              {question.options.map((option, optIndex) => (
                <div key={optIndex} style={{
                  padding: '8px 12px',
                  margin: '5px 0',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  background: optIndex === question.correct ? '#dcfce7' : '#fff',
                  border: optIndex === question.correct ? '2px solid #16a34a' : '1px solid #ddd'
                }}>
                  {String.fromCharCode(65 + optIndex)}. {option}
                  {optIndex === question.correct && (
                    <span style={{ color: '#16a34a', marginLeft: '10px', fontWeight: 'bold' }}>
                      ✓ Correto
                    </span>
                  )}
                </div>
              ))}
              
              <div style={{
                marginTop: '10px',
                padding: '10px',
                background: '#fef3cd',
                borderRadius: '6px',
                fontSize: '0.9rem',
                color: '#92400e'
              }}>
                <strong>💡 Explicação:</strong> {question.explanation}
              </div>
              
              <div style={{
                marginTop: '8px',
                fontSize: '0.8rem',
                color: '#6b7280'
              }}>
                <strong>Nível:</strong> {question.level}
              </div>
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          <Link
            href="/modules/diagnostico"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: '#6b7280',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: 'bold'
            }}
          >
            ← Anterior: Diagnóstico
          </Link>
          
          <Link
            href="/modules/roteiro-dispensacao"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: '#059669',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: 'bold'
            }}
          >
            Próximo: Roteiro de Dispensação →
          </Link>
        </div>
        </div>
      </EducationalLayout>
    </>
  );
}