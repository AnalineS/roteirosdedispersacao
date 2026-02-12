'use client';

import EducationalLayout from '@/components/layout/EducationalLayout';
import Link from 'next/link';
import { IndexIndicator } from '@/components/ui/IndexIndicator';
import renderMarkdownContent from '@/utils/renderMarkdownContent';

export default function VidaComDoencaModulePage() {
  const moduleContent = {
    title: 'Vida com a Hanseníase',
    subtitle: 'Qualidade de vida, reintegração social e cuidados integrais',
    duration: '25 minutos',
    level: 'Didático-empático',
    category: 'Cuidado Integral',
    description: 'Módulo dedicado ao apoio psicossocial, qualidade de vida e reintegração de pessoas afetadas pela hanseníase. Abordagem humanizada baseada em evidências científicas e experiências práticas.',
    targetAudience: 'Pacientes, familiares, profissionais de saúde e comunidade em geral',
    references: [
      'Brasil. Ministério da Saúde. Diretrizes para vigilância, atenção e eliminação da Hanseníase (2016)',
      'OMS. Estratégia Global de Hanseníase 2016-2020: Acelerar a ação para um mundo livre de hanseníase',
      'International Association for Integration, Dignity and Economic Advancement (IDEA) Guidelines'
    ],
    
    sections: [
      {
        id: 'qualidade-vida',
        title: '🌟 Qualidade de Vida e Bem-Estar',
        content: `
          **CONCEITO DE VIDA PLENA COM HANSENÍASE:**
          
          A hanseníase, quando diagnosticada precocemente e tratada adequadamente, não impede uma vida plena, produtiva e feliz. Milhões de pessoas ao redor do mundo vivem normalmente após o tratamento completo.
          
          **1. ASPECTOS FÍSICOS DA QUALIDADE DE VIDA:**
          
          **Cuidados com a Pele:**
          • **Hidratação diária:** Cremes e óleos para pele ressecada
          • **Proteção solar:** FPS 30+ para áreas com alteração de sensibilidade
          • **Limpeza suave:** Sabonetes neutros, evitar produtos agressivos
          • **Massagem terapêutica:** Melhora circulação e mantém flexibilidade
          
          **Prevenção de Incapacidades:**
          • **Exercícios específicos:** Fortalecimento muscular e amplitude articular
          • **Cuidados com olhos:** Lubrificação, proteção, piscar voluntário
          • **Cuidados com mãos:** Inspeção diária, evitar traumas, uso de luvas
          • **Cuidados com pés:** Calçados adequados, inspeção, hidratação
          
          **Atividade Física Regular:**
          • **Benefícios:** Melhora circulação, fortalece músculos, reduz dor
          • **Modalidades:** Caminhada, natação, alongamento, fisioterapia
          • **Adaptações:** Exercícios específicos para limitações individuais
          • **Orientação profissional:** Fisioterapeuta especializado
          
          **2. ASPECTOS EMOCIONAIS E PSICOLÓGICOS:**
          
          **Enfrentamento do Diagnóstico:**
          • **Fase inicial:** Negação, medo, ansiedade são reações normais
          • **Processamento:** Tempo necessário para adaptação psicológica
          • **Recursos internos:** Fortalecimento da autoestima e autoconfiança
          • **Rede de apoio:** Família, amigos, grupos de apoio, profissionais
          
          **Estratégias de Enfrentamento:**
          • **Informação científica:** Conhecimento reduz medo e ansiedade
          • **Foco no tratamento:** Concentrar energia na cura
          • **Atividades prazerosas:** Hobbies, lazer, socialização
          • **Mindfulness:** Técnicas de relaxamento e meditação
          
          **Autoestima e Autoimagem:**
          • **Aceitação:** Processo gradual de adaptação às mudanças
          • **Recursos estéticos:** Maquiagem, vestuário, cuidados pessoais
          • **Conquistas pessoais:** Valorizar sucessos e progressos
          • **Identidade:** Pessoa integral, não apenas "doente"
          
          **3. RELACIONAMENTOS E VIDA SOCIAL:**
          
          **Relações Familiares:**
          • **Comunicação aberta:** Educação familiar sobre hanseníase
          • **Suporte emocional:** Compreensão e apoio incondicional
          • **Adaptações práticas:** Ajustes na rotina doméstica
          • **Proteção:** Defesa contra discriminação externa
          
          **Relacionamentos Íntimos:**
          • **Transparência:** Diálogo honesto com parceiro(a)
          • **Educação:** Informações científicas sobre transmissão
          • **Intimidade:** Hanseníase não impede vida sexual normal
          • **Planejamento familiar:** Orientações sobre gravidez e amamentação
          
          **Vida Social e Comunitária:**
          • **Participação ativa:** Manutenção de atividades sociais
          • **Educação da comunidade:** Combate ao preconceito através de informação
          • **Grupos de apoio:** Contato com outros pacientes
          • **Ativismo:** Advocacia pelos direitos das pessoas afetadas
          
          **4. VIDA PROFISSIONAL E PRODUTIVA:**
          
          **Direitos Trabalhistas:**
          • **Estabilidade:** Proteção contra discriminação no trabalho
          • **Adaptações:** Direito a adequações ergonômicas
          • **Licenças médicas:** Para tratamento e episódios reacionais
          • **Aposentadoria:** Por invalidez apenas em casos excepcionais
          
          **Reabilitação Profissional:**
          • **Avaliação funcional:** Capacidades preservadas e limitações
          • **Requalificação:** Novos treinamentos quando necessário
          • **Adaptações:** Equipamentos e métodos de trabalho
          • **Empreendedorismo:** Estímulo ao trabalho autônomo
          
          **5. ESPIRITUALIDADE E PROPÓSITO DE VIDA:**
          
          **Busca de Significado:**
          • **Ressignificação:** Encontrar sentido na experiência vivida
          • **Crescimento pessoal:** Desenvolvimento de valores e prioridades
          • **Solidariedade:** Ajudar outros em situação similar
          • **Gratidão:** Valorização das conquistas e superações
          
          **Práticas Espirituais:**
          • **Religiosidade:** Apoio da comunidade religiosa
          • **Meditação:** Técnicas de autoconhecimento e paz interior
          • **Serviço:** Voluntariado e ajuda ao próximo
          • **Conexão:** Senso de pertencimento e propósito
        `,
        clinicalCases: `
          **💝 História de Vida 1:** Maria, 45 anos, completou tratamento há 2 anos. Inicialmente deprimida pela hiperpigmentação, hoje é líder de grupo de apoio e trabalha como consultora em empresa multinacional. "A hanseníase me ensinou que sou mais forte do que imaginava."
          
          **💝 História de Vida 2:** João, 38 anos, desenvolveu limitação na mão direita. Com fisioterapia e adaptações, manteve carreira de designer gráfico. Casou-se após o diagnóstico e hoje tem dois filhos saudáveis. "Minha vida não parou, apenas se adaptou."
        `,
        keyPoints: [
          'Hanseníase tratada não impede vida plena e feliz',
          'Cuidados físicos preventivos são fundamentais para qualidade de vida',
          'Apoio psicológico e social facilita adaptação e enfrentamento',
          'Direitos trabalhistas e sociais devem ser conhecidos e exercidos'
        ],
        askAssistant: {
          suggestedQuestions: [
            'Gá, como lidar com a tristeza após o diagnóstico?',
            'Como explicar para família que hanseníase não é contagiosa após tratamento?',
            'Quais atividades físicas são recomendadas durante o tratamento?'
          ]
        }
      },
      {
        id: 'direitos-beneficios',
        title: '⚖️ Direitos, Benefícios e Proteção Legal',
        content: `
          **MARCO LEGAL DE PROTEÇÃO:**
          
          As pessoas afetadas pela hanseníase têm direitos constitucionais e legais específicos que garantem dignidade, tratamento adequado e proteção contra discriminação.
          
          **1. DIREITOS FUNDAMENTAIS:**
          
          **Direito à Saúde (CF Art. 196):**
          • **Tratamento gratuito:** PQT-U fornecida pelo SUS sem custo
          • **Assistência integral:** Diagnóstico, tratamento, reabilitação
          • **Acesso universal:** Independente de condição socioeconômica
          • **Continuidade:** Seguimento pós-alta por 5 anos
          
          **Direito à Dignidade (CF Art. 1º, III):**
          • **Não discriminação:** Proteção contra preconceito e estigma
          • **Privacidade:** Sigilo sobre diagnóstico e tratamento
          • **Autonomia:** Decisões sobre vida pessoal e profissional
          • **Respeito:** Tratamento igualitário em todas as esferas
          
          **2. LEGISLAÇÃO ESPECÍFICA:**
          
          **Lei nº 9.010/1995 (Reintegração Social):**
          • **Pensão especial:** Para ex-portadores de hanseníase
          • **Critérios:** Idade, sequelas, necessidade socioeconômica
          • **Valor:** Um salário mínimo mensal vitalício
          • **Acumulação:** Pode ser somada a outros benefícios
          
          **Decreto nº 1.744/1995 (Regulamentação):**
          • **Procedimentos:** Para concessão da pensão especial
          • **Documentação:** Atestado médico, comprovação de sequelas
          • **Órgão responsável:** INSS para análise e concessão
          
          **3. BENEFÍCIOS PREVIDENCIÁRIOS:**
          
          **Auxílio-Doença (B31):**
          • **Critério:** Incapacidade temporária para trabalho
          • **Duração:** Durante estados reacionais, internações
          • **Valor:** 91% do salário de benefício
          • **Carência:** Dispensada para hanseníase (CID A30)
          
          **Aposentadoria por Invalidez (B32):**
          • **Critério:** Incapacidade total e permanente
          • **Avaliação:** Perícia médica especializada
          • **Valor:** 100% do salário de benefício
          • **Casos:** Sequelas graves e irreversíveis (raros)
          
          **Benefício de Prestação Continuada (BPC):**
          • **Critério:** Pessoa com deficiência, baixa renda familiar
          • **Valor:** Um salário mínimo mensal
          • **Renda:** Familiar per capita inferior a 1/4 do salário mínimo
          • **Avaliação:** Social (CRAS) e médica (INSS)
          
          **4. DIREITOS TRABALHISTAS:**
          
          **Estabilidade no Emprego:**
          • **Período:** 12 meses após retorno do auxílio-doença
          • **Proteção:** Dispensa apenas por justa causa ou acordo
          • **Objetivo:** Reintegração profissional sem discriminação
          
          **Adaptações Laborais:**
          • **Ergonomia:** Adequação do posto de trabalho
          • **Instrumentos:** Ferramentas adaptadas para limitações
          • **Horários:** Flexibilização para consultas médicas
          • **Tarefas:** Redistribuição conforme capacidade funcional
          
          **FGTS (Fundo de Garantia):**
          • **Saque:** Disponível nos casos de hanseníase (Lei 8.036/90)
          • **Documentação:** Atestado médico comprobatório
          • **Finalidade:** Tratamento, reabilitação, necessidades especiais
          
          **5. DIREITOS EDUCACIONAIS:**
          
          **Educação Inclusiva:**
          • **Acesso:** Garantido em todos os níveis de ensino
          • **Adaptações:** Curriculares e metodológicas quando necessário
          • **Apoio:** Transporte, alimentação, material adaptado
          • **Permanência:** Medidas para evitar evasão escolar
          
          **6. COMBATE À DISCRIMINAÇÃO:**
          
          **Lei nº 7.716/1989 (Crimes de Preconceito):**
          • **Proteção:** Discriminação por doença constitui crime
          • **Sanções:** Reclusão de 1 a 3 anos e multa
          • **Modalidades:** Trabalho, educação, serviços públicos
          
          **Órgãos de Denúncia:**
          • **Ministério Público:** Promotoria de Direitos Humanos
          • **Defensoria Pública:** Assistência jurídica gratuita
          • **Ouvidoria SUS:** Denúncias de discriminação em saúde
          • **Comissões de Direitos Humanos:** Câmaras e Assembleias
          
          **7. PROCEDIMENTOS PARA EXERCER DIREITOS:**
          
          **Documentação Necessária:**
          • **Atestado médico:** Diagnóstico e evolução
          • **Exames complementares:** Baciloscopia, biópsia quando disponível
          • **Cartão de tratamento:** Comprovação do acompanhamento
          • **Documentos pessoais:** RG, CPF, comprovante residência
          
          **Onde Buscar Orientação:**
          • **Unidades de Saúde:** Assistente social, médico responsável
          • **CRAS/CREAS:** Orientação sobre benefícios sociais
          • **INSS:** Benefícios previdenciários
          • **Defensoria Pública:** Assistência jurídica gratuita
          • **Movimentos sociais:** Organizações de pessoas afetadas
          
          **8. ORGANIZAÇÕES DE APOIO:**
          
          **MORHAN (Movimento de Reintegração das Pessoas Atingidas pela Hanseníase):**
          • **Atividades:** Advocacia, educação, apoio social
          • **Serviços:** Orientação jurídica, grupos de apoio
          • **Contato:** Núcleos em vários estados brasileiros
          
          **IDEA Brasil:**
          • **Foco:** Integração, dignidade e desenvolvimento econômico
          • **Projetos:** Geração de renda, capacitação profissional
          • **Abrangência:** Nacional com parceiros locais
        `,
        clinicalCases: `
          **⚖️ Caso Jurídico 1:** Pedro foi demitido após empregador descobrir diagnóstico. **Ação:** Processo trabalhista por discriminação, reintegração + indenização por danos morais. **Resultado:** Vitória judicial, empresa obrigada a promover campanha educativa.
          
          **⚖️ Caso Social 2:** Ana, 52 anos, sequelas em mãos, solicitou BPC. **Avaliação:** Deficiência reconhecida, renda familiar adequada. **Resultado:** Benefício concedido, possibilitou continuidade do tratamento e melhoria da qualidade de vida familiar.
        `,
        keyPoints: [
          'Pessoas afetadas por hanseníase têm direitos constitucionais específicos',
          'Discriminação por hanseníase é crime previsto em lei',
          'Benefícios previdenciários e assistenciais estão disponíveis conforme critérios',
          'Organizações especializadas oferecem apoio jurídico e social'
        ],
        askAssistant: {
          suggestedQuestions: [
            'Gá, como solicitar auxílio-doença por causa da hanseníase?',
            'Tenho direito ao FGTS por conta do tratamento?',
            'O que fazer se sofrer discriminação no trabalho?'
          ]
        }
      },
      {
        id: 'cuidados-familia',
        title: '👨‍👩‍👧‍👦 Cuidados Familiares e Prevenção',
        content: `
          **ENVOLVIMENTO FAMILIAR NO CUIDADO INTEGRAL:**
          
          A família desempenha papel fundamental no sucesso do tratamento, na prevenção da transmissão e na reintegração social da pessoa afetada pela hanseníase.
          
          **1. EDUCAÇÃO FAMILIAR:**
          
          **Informações Científicas Básicas:**
          • **O que é hanseníase:** Doença bacteriana curável, baixa transmissibilidade
          • **Transmissão:** Vias respiratórias, contato íntimo prolongado
          • **Tratamento:** PQT-U torna pessoa não transmissora em poucos dias
          • **Prognóstico:** Cura completa com tratamento adequado
          
          **Desmistificação de Crenças:**
          • **Não é hereditária:** Genes não determinam desenvolvimento da doença
          • **Não transmite por objetos:** Roupas, utensílios, abraços são seguros
          • **Não é castigo divino:** Doença como qualquer outra, sem conotação moral
          • **Não é altamente contagiosa:** Maioria dos contactantes não desenvolve doença
          
          **2. VIGILÂNCIA DE CONTACTANTES:**
          
          **Definição de Contactantes:**
          • **Intradomiciliares:** Pessoas que moram/moraram na mesma casa
          • **Sociais:** Convivência próxima (>8 horas/dia) por >6 meses
          • **Período de risco:** Até 5 anos antes do diagnóstico do caso índice
          
          **Protocolo de Exame:**
          • **Frequência:** Anual por 5 anos após diagnóstico do caso índice
          • **Exame:** Dermatoneurológico completo
          • **Sinais de alerta:** Manchas, dormências, espessamento neural
          • **Educação:** Orientação sobre sinais e importância do exame
          
          **Imunização:**
          • **BCG:** Recomendada para contactantes (esquema conforme situação vacinal)
          • **Proteção:** Reduz risco de desenvolvimento da doença
          • **Contraindicações:** Imunossupressão, gravidez
          
          **3. CUIDADOS DOMICILIARES:**
          
          **Ambiente Físico:**
          • **Ventilação:** Manter ambientes arejados e bem ventilados
          • **Iluminação:** Boa iluminação para inspeção de pele
          • **Segurança:** Evitar objetos cortantes ou contundentes
          • **Adaptações:** Barras de apoio, pisos antiderrapantes
          
          **Cuidados Específicos:**
          • **Pele:** Hidratação diária, proteção solar, inspeção regular
          • **Olhos:** Colírios lubrificantes, proteção contra vento/poeira
          • **Mãos e pés:** Inspeção diária, cuidados com ferimentos
          • **Medicação:** Organização, lembretes, supervisão da tomada
          
          **4. APOIO EMOCIONAL FAMILIAR:**
          
          **Estratégias de Apoio:**
          • **Escuta ativa:** Dar espaço para expressão de sentimentos
          • **Normalização:** Manter rotinas e relacionamentos familiares
          • **Encorajamento:** Reforçar capacidades e conquistas
          • **Paciência:** Compreender momentos de tristeza ou revolta
          
          **Comunicação Efetiva:**
          • **Transparência:** Informações adequadas à idade dos filhos
          • **Linguagem positiva:** Focar na cura e no futuro
          • **Perguntas:** Espaço para dúvidas e curiosidades
          • **Reasseguramento:** Confirmar que a família permanece unida
          
          **5. EDUCAÇÃO DOS FILHOS:**
          
          **Por Faixa Etária:**
          
          **Crianças (5-10 anos):**
          • **Linguagem simples:** "Papai/mamãe tem uma doença que tem remédio"
          • **Reasseguramento:** "Você não vai ficar doente"
          • **Normalidade:** Manter rotina escolar e brincadeiras
          • **Sinais de alerta:** Manchas na pele para mostrar ao médico
          
          **Pré-adolescentes (11-14 anos):**
          • **Informações científicas:** Explicações sobre a doença
          • **Participação:** Ajuda nos cuidados domiciliares
          • **Escola:** Orientação sobre como explicar para colegas
          • **Exames:** Importância dos exames anuais
          
          **Adolescentes (15-18 anos):**
          • **Conhecimento completo:** Todas as informações científicas
          • **Responsabilidade:** Participação ativa nos cuidados
          • **Futuro:** Discussão sobre relacionamentos e família
          • **Advocacia:** Combate ao preconceito no meio social
          
          **6. REDE DE APOIO SOCIAL:**
          
          **Família Estendida:**
          • **Educação:** Orientação para avós, tios, primos
          • **Apoio:** Suporte emocional e prático
          • **Proteção:** Defesa contra comentários discriminatórios
          
          **Vizinhança e Comunidade:**
          • **Educação gradual:** Informações corretas sobre a doença
          • **Lideranças:** Envolvimento de líderes comunitários/religiosos
          • **Eventos:** Participação normal em atividades sociais
          
          **7. PLANEJAMENTO FAMILIAR:**
          
          **Gravidez e Hanseníase:**
          • **Planejamento:** Orientação contraceptiva durante tratamento
          • **Gestação:** PQT-U é segura durante gravidez e lactação
          • **Monitorização:** Acompanhamento pré-natal especializado
          • **Bebê:** Não há risco de transmissão intrauterina
          
          **8. INSTRUMENTOS DE APOIO FAMILIAR:**
          
          **Cartilha da Família:**
          • **Conteúdo:** Informações práticas sobre cuidados
          • **Linguagem:** Acessível a diferentes níveis educacionais
          • **Ilustrações:** Figuras explicativas dos cuidados
          
          **Agenda Familiar:**
          • **Consultas:** Cronograma de retornos médicos
          • **Medicação:** Controle das doses diárias
          • **Exames:** Agendamento para contactantes
          
          **Rede de Contatos:**
          • **Equipe de saúde:** Telefones e horários de atendimento
          • **Emergência:** Onde buscar ajuda em situações urgentes
          • **Apoio:** Grupos familiares, organizações especializadas
        `,
        clinicalCases: `
          **👨‍👩‍👧‍👦 História Familiar 1:** Família Silva: quando Carlos foi diagnosticado, toda família passou por exames. Filha de 12 anos apresentou mancha suspeita, diagnosticada precocemente. **Resultado:** Dois casos tratados com sucesso, família fortalecida pelo enfrentamento conjunto.
          
          **👨‍👩‍👧‍👦 História Familiar 2:** Dona Rosa, 60 anos, escondia diagnóstico da família. Após orientação, revelou para filhos. **Transformação:** Família se uniu no cuidado, netos aprenderam sobre prevenção, hoje são multiplicadores de informação na escola.
        `,
        keyPoints: [
          'Família educada é fundamental para sucesso do tratamento',
          'Vigilância de contactantes previne novos casos',
          'Apoio emocional familiar acelera recuperação e reintegração',
          'Crianças devem receber informações adequadas à idade'
        ],
        askAssistant: {
          suggestedQuestions: [
            'Gá, como explicar hanseníase para crianças pequenas?',
            'Meus familiares precisam fazer exames? Com que frequência?',
            'Como manter a família unida durante o tratamento?'
          ]
        }
      },
      {
        id: 'reintegracao-social',
        title: '🤝 Reintegração Social e Combate ao Estigma',
        content: `
          **ESTRATÉGIAS PARA REINTEGRAÇÃO PLENA:**
          
          A reintegração social é processo gradual que requer estratégias individuais, familiares e comunitárias para superar barreiras históricas do estigma associado à hanseníase.
          
          **1. COMPREENDENDO O ESTIGMA:**
          
          **Raízes Históricas:**
          • **Bíblicas:** Associação errônea com "lepra bíblica"
          • **Isolamento compulsório:** Leprosários como política pública até 1986
          • **Linguagem:** Termos pejorativos ainda utilizados
          • **Medo ancestral:** Transmitido através de gerações
          
          **Manifestações Atuais:**
          • **Discriminação social:** Evitação, isolamento, comentários
          • **Laboral:** Dificuldades de emprego ou manutenção
          • **Serviços:** Resistência em atendimentos (erroneamente)
          • **Familiar:** Rejeição ou superproteção excessiva
          
          **2. ESTRATÉGIAS INDIVIDUAIS:**
          
          **Fortalecimento Pessoal:**
          • **Autoconhecimento:** Reconhecer próprias forças e capacidades
          • **Educação continuada:** Manter-se informado cientificamente
          • **Habilidades sociais:** Desenvolver comunicação assertiva
          • **Resiliência:** Capacidade de adaptação a adversidades
          
          **Manejo de Situações Difíceis:**
          • **Disclosure controlado:** Decidir quando e para quem revelar
          • **Educação pontual:** Fornecer informações corretas quando necessário
          • **Limite de tolerância:** Saber quando se afastar de situações tóxicas
          • **Busca de apoio:** Não hesitar em procurar ajuda profissional
          
          **3. INSERÇÃO NO MERCADO DE TRABALHO:**
          
          **Preparação Profissional:**
          • **Capacitação:** Cursos técnicos, superiores, especializações
          • **Atualização:** Manter competências profissionais atualizadas
          • **Networking:** Construir rede de contatos profissionais
          • **Empreendedorismo:** Considerar trabalho autônomo
          
          **Estratégias de Busca:**
          • **Currículo:** Focar competências, não mencionar diagnóstico
          • **Entrevistas:** Preparar-se para possíveis questionamentos
          • **Referências:** Pessoas que possam atestar capacidade profissional
          • **Organizações inclusivas:** Empresas com políticas de diversidade
          
          **4. EDUCAÇÃO COMUNITÁRIA:**
          
          **Multiplicação de Conhecimento:**
          • **Testemunho pessoal:** Compartilhar experiência de superação
          • **Palestras educativas:** Escolas, empresas, organizações
          • **Mídias sociais:** Uso responsável para educação
          • **Material educativo:** Distribuição de informações corretas
          
          **Parcerias Estratégicas:**
          • **Profissionais de saúde:** Educação continuada das equipes
          • **Líderes comunitários:** Pastores, líderes associativos
          • **Educadores:** Inclusão do tema em currículos escolares
          • **Mídia:** Jornalistas para reportagens educativas
          
          **5. MOVIMENTO SOCIAL ORGANIZADO:**
          
          **Participação em Organizações:**
          • **MORHAN:** Movimento nacional de reintegração
          • **Grupos locais:** Associações estaduais e municipais
          • **Conselhos:** Participação em instâncias de controle social
          • **Eventos:** Congressos, seminários, campanhas
          
          **Advocacia e Direitos:**
          • **Legislativa:** Apoio a projetos de lei favoráveis
          • **Judicial:** Denúncia de casos de discriminação
          • **Executiva:** Cobrança de políticas públicas adequadas
          • **Social:** Mobilização da opinião pública
          
          **6. TECNOLOGIA COMO FERRAMENTA:**
          
          **Redes Sociais:**
          • **Grupos de apoio:** WhatsApp, Facebook, Telegram
          • **Educação online:** Lives, webinars, podcasts
          • **Campanhas:** Hashtags educativas, desafios positivos
          • **Depoimentos:** Vídeos de superação e esperança
          
          **Aplicativos e Plataformas:**
          • **Telemedicina:** Consultas remotas quando necessário
          • **Educação:** Cursos online gratuitos sobre hanseníase
          • **Networking:** Plataformas profissionais inclusivas
          • **Suporte:** Apps de meditação, bem-estar mental
          
          **7. INDICADORES DE REINTEGRAÇÃO BEM-SUCEDIDA:**
          
          **Pessoais:**
          • **Autoestima:** Sentimento positivo sobre si mesmo
          • **Autonomia:** Capacidade de tomar decisões independentes
          • **Relacionamentos:** Vínculos afetivos saudáveis
          • **Propósito:** Senso de significado na vida
          
          **Sociais:**
          • **Participação:** Engajamento em atividades comunitárias
          • **Trabalho:** Inserção produtiva na sociedade
          • **Educação:** Acesso a oportunidades de aprendizagem
          • **Cidadania:** Exercício pleno de direitos e deveres
          
          **8. CASOS DE SUCESSO E INSPIRAÇÃO:**
          
          **Lideranças Nacionais:**
          • **Artur Custódio:** Advogado, ex-presidente do MORHAN
          • **Alice Cruz:** Relatora Especial da ONU sobre Hanseníase
          • **Múltiplos testemunhos:** Pessoas em diversas profissões
          
          **Conquistas Coletivas:**
          • **Lei Federal:** Proteção legal contra discriminação
          • **Campanhas nacionais:** "Hanseníase tem cura"
          • **Janeiro Roxo:** Mês nacional de combate à hanseníase
          • **Prêmio Sasakawa:** Reconhecimento internacional
          
          **9. CONSTRUINDO O FUTURO:**
          
          **Visão de Sociedade Inclusiva:**
          • **Educação:** Hanseníase como tema transversal
          • **Mídia:** Representação positiva e realística
          • **Políticas públicas:** Integração efetiva de direitos
          • **Cultura:** Mudança de narrativas sociais
          
          **Papel das Novas Gerações:**
          • **Desnaturalização:** Questionar preconceitos herdados
          • **Inclusão:** Praticar acolhimento e respeito
          • **Conhecimento:** Buscar informações científicas
          • **Multiplicação:** Compartilhar aprendizados
        `,
        clinicalCases: `
          **🤝 História de Superação 1:** Marcos, professor universitário, foi afastado informalmente após diagnóstico. **Estratégia:** Educou colegas e direção, processou universidade, obteve reintegração + indenização. Hoje coordena projeto de extensão sobre direitos humanos.
          
          **🤝 História de Superação 2:** Comunidade rural rejeitou família após diagnóstico de Maria. **Ação:** Parceria com agentes de saúde, palestras educativas, testemunho de superação. **Resultado:** Comunidade se tornou referência em acolhimento e prevenção.
        `,
        keyPoints: [
          'Reintegração social é processo gradual que requer estratégias múltiplas',
          'Educação comunitária é ferramenta poderosa contra estigma',
          'Movimento social organizado fortalece conquistas individuais e coletivas',
          'Tecnologia potencializa alcance das ações educativas e de apoio'
        ],
        askAssistant: {
          suggestedQuestions: [
            'Gá, como lidar com discriminação no trabalho?',
            'Devo contar sobre hanseníase em entrevistas de emprego?',
            'Como participar do movimento de reintegração social?'
          ]
        }
      },
      {
        id: 'recursos-apoio',
        title: '📞 Recursos de Apoio e Contatos Úteis',
        content: `
          **REDE DE APOIO INTEGRAL:**
          
          Uma ampla rede de apoio está disponível para pessoas afetadas pela hanseníase e suas famílias, oferecendo suporte médico, psicológico, social e jurídico.
          
          **1. SERVIÇOS DE SAÚDE ESPECIALIZADOS:**
          
          **Centros de Referência Nacional:**
          • **Instituto Lauro de Souza Lima (Bauru/SP):** (14) 3103-6000
          • **Hospital Fiocruz (Rio de Janeiro/RJ):** (21) 2598-2626
          • **FUAM (Manaus/AM):** (92) 2127-3400
          • **Hospital Universitário (Brasília/DF):** (61) 3448-5000
          
          **Ambulatórios Estaduais:**
          • **Contato:** Secretarias Estaduais de Saúde
          • **Função:** Atendimento especializado, segunda opinião
          • **Serviços:** Diagnóstico, tratamento, reabilitação
          • **Acesso:** Regulação via SUS
          
          **2. ORGANIZAÇÕES DE APOIO SOCIAL:**
          
          **MORHAN (Movimento de Reintegração das Pessoas Atingidas pela Hanseníase):**
          • **Site:** www.morhan.org.br
          • **E-mail:** morhan@morhan.org.br
          • **Telefone:** (11) 3848-8221
          • **Serviços:** Orientação jurídica, grupos de apoio, advocacia
          
          **IDEA Brasil:**
          • **Site:** www.idea.org.br
          • **Foco:** Integração, dignidade, desenvolvimento econômico
          • **Projetos:** Geração de renda, capacitação
          
          **Sociedade Brasileira de Hansenologia:**
          • **Site:** www.sbhansenologia.org.br
          • **Público:** Profissionais de saúde
          • **Atividades:** Educação continuada, pesquisa
          
          **3. SERVIÇOS GOVERNAMENTAIS:**
          
          **Disque Saúde (136):**
          • **Funcionamento:** 24 horas, todos os dias
          • **Serviços:** Informações sobre SUS, orientações gerais
          • **Gratuito:** De qualquer telefone fixo ou celular
          
          **INSS (135):**
          • **Horário:** Segunda a sábado, 7h às 22h
          • **Serviços:** Benefícios previdenciários, agendamentos
          • **Online:** www.gov.br/inss
          
          **Ministério da Saúde:**
          • **Site:** www.gov.br/saude
          • **E-mail:** cghde@saude.gov.br (Hanseníase)
          • **Materiais:** Cartilhas, protocolos, campanhas
          
          **4. APOIO JURÍDICO:**
          
          **Defensoria Pública da União:**
          • **Telefone:** (61) 2027-3100
          • **Serviços:** Assistência jurídica gratuita
          • **Áreas:** Previdenciário, trabalhista, cível
          
          **Defensorias Estaduais:**
          • **Contato:** Cada estado tem sua defensoria
          • **Acesso:** Gratuito para baixa renda
          • **Áreas:** Direitos humanos, discriminação
          
          **Ministério Público Federal:**
          • **Site:** www.mpf.mp.br
          • **E-mail:** Procuradorias locais
          • **Função:** Defesa de direitos coletivos
          
          **5. APOIO PSICOLÓGICO:**
          
          **Centro de Valorização da Vida (CVV):**
          • **Telefone:** 188
          • **Funcionamento:** 24 horas, gratuito
          • **Serviços:** Apoio emocional, prevenção suicídio
          • **Online:** www.cvv.org.br
          
          **CAPS (Centros de Atenção Psicossocial):**
          • **Localização:** Municípios brasileiros
          • **Serviços:** Atendimento psicológico gratuito
          • **Acesso:** Via Unidade Básica de Saúde
          
          **6. GRUPOS DE APOIO ONLINE:**
          
          **WhatsApp Groups:**
          • **MORHAN Nacional:** Contato via site oficial
          • **Estados/Regiões:** Grupos locais específicos
          • **Familiares:** Suporte para famílias
          
          **Facebook Groups:**
          • **Hanseníase Tem Cura:** Grupo educativo
          • **Vencendo a Hanseníase:** Relatos de superação
          • **Famílias Unidas:** Apoio familiar
          
          **7. APLICATIVOS E RECURSOS DIGITAIS:**
          
          **SUS Digital:**
          • **Função:** Agendamentos, resultados exames
          • **Download:** Google Play/App Store
          • **Gratuito:** Para todos os usuários SUS
          
          **Conecte SUS:**
          • **Carteira digital:** Vacinas, exames, medicamentos
          • **Histórico:** Acompanhamento médico completo
          
          **8. RECURSOS EDUCACIONAIS:**
          
          **Ministério da Saúde:**
          • **Cartilhas:** Download gratuito no site
          • **Vídeos:** Canal YouTube oficial
          • **Cursos:** Plataforma AVASUS (profissionais)
          
          **Organizações Internacionais:**
          • **OMS:** Materiais em português
          • **ILEP:** International Federation of Anti-Leprosy Associations
          • **Sasakawa Foundation:** Recursos educacionais
          
          **9. EMERGÊNCIAS E SITUAÇÕES URGENTES:**
          
          **Estados Reacionais Graves:**
          • **Pronto-socorro:** Qualquer hospital público
          • **Centro de referência:** Se disponível na região
          • **Medicação:** Não interromper PQT-U
          
          **Discriminação/Violação de Direitos:**
          • **Disque 100:** Direitos humanos
          • **Polícia Civil:** Boletim de ocorrência
          • **MP:** Ministério Público local
          
          **10. COMO BUSCAR AJUDA:**
          
          **Passo a Passo:**
          • **1º** Identificar tipo de necessidade (saúde, jurídica, social)
          • **2º** Buscar recurso mais próximo geograficamente
          • **3º** Reunir documentação necessária
          • **4º** Fazer contato inicial (telefone/site)
          • **5º** Agendar atendimento presencial se necessário
          
          **Documentos Importantes:**
          • **RG e CPF:** Identificação básica
          • **Cartão SUS:** Atendimento médico
          • **Comprovante residência:** Serviços locais
          • **Cartão tratamento:** Histórico médico
          • **Laudos médicos:** Benefícios/aposentadoria
          
          **11. CONSTRUINDO SUA REDE PESSOAL:**
          
          **Mapeamento de Apoio:**
          • **Família:** Identificar pessoas de confiança
          • **Amigos:** Círculo social próximo
          • **Profissionais:** Médicos, assistentes sociais, psicólogos
          • **Comunidade:** Líderes, organizações locais
          
          **Manutenção da Rede:**
          • **Comunicação regular:** Manter contatos ativos
          • **Reciprocidade:** Oferecer apoio quando possível
          • **Gratidão:** Reconhecer ajuda recebida
          • **Expansão:** Incluir novas pessoas gradualmente
        `,
        keyPoints: [
          'Ampla rede de apoio está disponível gratuitamente',
          'Organizações especializadas oferecem suporte integral',
          'Recursos digitais facilitam acesso a informações e serviços',
          'Construir rede pessoal de apoio fortalece enfrentamento'
        ],
        askAssistant: {
          suggestedQuestions: [
            'Gá, onde posso encontrar grupo de apoio na minha cidade?',
            'Como entrar em contato com o MORHAN?',
            'Preciso de ajuda jurídica, onde procurar?'
          ]
        }
      }
    ],
    
    quiz: [
      {
        question: 'Qual é o principal fator para uma vida plena após o diagnóstico de hanseníase?',
        options: [
          'Evitar contato social durante todo o tratamento',
          'Tratamento adequado e apoio psicossocial integral',
          'Mudança completa de estilo de vida',
          'Isolamento para proteger outras pessoas'
        ],
        correct: 1,
        explanation: 'O tratamento adequado (PQT-U) garante a cura, enquanto o apoio psicossocial facilita o enfrentamento e a reintegração. A hanseníase não impede vida plena e produtiva.',
        level: 'didático'
      },
      {
        question: 'Sobre os direitos das pessoas afetadas por hanseníase, é correto afirmar:',
        options: [
          'Têm direito apenas ao tratamento gratuito pelo SUS',
          'Discriminação por hanseníase não é considerada crime',
          'Podem ter direito a benefícios previdenciários e proteção legal específica',
          'Devem aceitar limitações profissionais como consequência natural'
        ],
        correct: 2,
        explanation: 'Pessoas afetadas por hanseníase têm direitos constitucionais específicos, incluindo proteção contra discriminação (que é crime), acesso a benefícios previdenciários e assistenciais quando aplicável.',
        level: 'técnico'
      },
      {
        question: 'Em relação aos contactantes familiares, qual orientação está correta?',
        options: [
          'Devem evitar contato físico com a pessoa em tratamento',
          'Precisam fazer exame anual por 5 anos e podem receber vacina BCG',
          'Só precisam de acompanhamento se morarem na mesma casa',
          'Devem usar medicação preventiva durante o tratamento do familiar'
        ],
        correct: 1,
        explanation: 'Contactantes devem fazer exame dermatoneurológico anual por 5 anos. A vacinação BCG é recomendada como medida preventiva. Não há necessidade de evitar contato ou usar medicação preventiva.',
        level: 'técnico'
      },
      {
        question: 'Como deve ser abordado o estigma relacionado à hanseníase?',
        options: [
          'Aceitar como realidade inevitável da sociedade',
          'Esconder o diagnóstico de todas as pessoas',
          'Combater através de educação, informação científica e movimento social organizado',
          'Esperar que desapareça naturalmente com o tempo'
        ],
        correct: 2,
        explanation: 'O estigma deve ser combatido ativamente através de educação baseada em evidências científicas, participação em movimentos sociais organizados e estratégias individuais e coletivas de enfrentamento.',
        level: 'didático'
      },
      {
        question: 'Qual recurso deve ser procurado primeiro em caso de discriminação no trabalho?',
        options: [
          'Resignar-se e procurar outro emprego',
          'Defensoria Pública ou advogado trabalhista para orientação jurídica',
          'Contar para todos os colegas sobre o diagnóstico',
          'Pedir transferência para outro setor'
        ],
        correct: 1,
        explanation: 'Discriminação por hanseníase é crime. A pessoa deve buscar orientação jurídica na Defensoria Pública (gratuita) ou advogado trabalhista para conhecer seus direitos e tomar as medidas legais cabíveis.',
        level: 'técnico'
      }
    ]
  };

  return (
    <EducationalLayout>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Module Header */}
        <div style={{
          background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
          color: 'white',
          padding: '30px',
          borderRadius: '12px',
          marginBottom: '30px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
            <span style={{ fontSize: '3rem' }}>🌟</span>
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

        {/* Module Content */}
        {moduleContent.sections.map((section, index) => (
          <div key={section.id} style={{
            background: 'white',
            borderRadius: '12px',
            padding: '25px',
            marginBottom: '20px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              color: '#7c3aed',
              marginBottom: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <IndexIndicator
                index={index + 1}
                color="#7c3aed"
                variant="step"
                size="medium"
              />
              {section.title}
            </h2>
            
            <div style={{
              fontSize: '1rem',
              lineHeight: '1.6',
              color: '#444',
              marginBottom: '20px'
            }}>
              {renderMarkdownContent(section.content)}
            </div>
            
            {/* Clinical Cases / Life Stories */}
            {section.clinicalCases && (
              <div style={{
                background: '#f0f9ff',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '15px',
                borderLeft: '4px solid #0ea5e9'
              }}>
                <h4 style={{ margin: '0 0 10px', color: '#0ea5e9' }}>
                  {section.id === 'qualidade-vida' ? '💝 Histórias de Vida:' : 
                   section.id === 'direitos-beneficios' ? '⚖️ Casos Jurídicos/Sociais:' :
                   section.id === 'cuidados-familia' ? '👨‍👩‍👧‍👦 Histórias Familiares:' :
                   section.id === 'reintegracao-social' ? '🤝 Histórias de Superação:' :
                   '📋 Casos Práticos:'}
                </h4>
                <div style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>
                  {renderMarkdownContent(section.clinicalCases)}
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
                <h4 style={{ margin: '0 0 10px', color: '#d97706' }}>🤖 Pergunte à Gá:</h4>
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
            
            {/* Key Points */}
            <div style={{
              background: '#f3f4f6',
              padding: '15px',
              borderRadius: '8px',
              borderLeft: '4px solid #7c3aed'
            }}>
              <h4 style={{ margin: '0 0 10px', color: '#7c3aed' }}>🎯 Pontos-chave:</h4>
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {section.keyPoints.map((point, idx) => (
                  <li key={idx} style={{ marginBottom: '5px', color: '#555' }}>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}

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
            color: '#7c3aed',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            🧠 Teste seus conhecimentos
          </h2>
          
          {moduleContent.quiz.map((question, index) => (
            <div key={index} style={{
              background: '#f3f4f6',
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
                  background: optIndex === question.correct ? '#e0e7ff' : '#fff',
                  border: optIndex === question.correct ? '2px solid #7c3aed' : '1px solid #ddd'
                }}>
                  {String.fromCharCode(65 + optIndex)}. {option}
                  {optIndex === question.correct && (
                    <span style={{ color: '#7c3aed', marginLeft: '10px', fontWeight: 'bold' }}>
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
            href="/modules/roteiro-dispensacao"
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
            ← Anterior: Roteiro de Dispensação
          </Link>
          
          <Link
            href="/modules"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: '#7c3aed',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: 'bold'
            }}
          >
            Concluir Módulos →
          </Link>
        </div>
      </div>
    </EducationalLayout>
  );
}