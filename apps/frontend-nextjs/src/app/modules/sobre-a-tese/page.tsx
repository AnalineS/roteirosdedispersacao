'use client';

import EducationalLayout from '@/components/layout/EducationalLayout';
import ModuleTemplate, { ModuleData } from '@/components/educational/ModuleTemplate';
import { secureLogger } from '@/utils/secureLogger';

export default function SobreATesetModulePage() {
  const moduleData: ModuleData = {
    id: 'sobre-a-tese',
    title: 'Sobre a Tese',
    subtitle: 'Otimização do Cuidado Farmacêutico através de Roteiros de Dispensação',
    description: 'Conheça a pesquisa de doutorado que fundamenta esta plataforma: metodologia, objetivos e contribuições para o cuidado farmacêutico.',
    duration: '15 minutos',
    level: 'Básico',
    category: 'Fundamentos',
    author: 'Nélio Gomes',
    institution: 'Universidade de Brasília (UnB)',
    lastUpdated: '2025',
    sections: [
      {
        id: 'contexto-motivacao',
        title: '🎯 Contexto e Motivação',
        content: `
          Esta tese de doutorado nasceu de uma inquietação comum a muitos profissionais da farmácia: **como tornar o momento da dispensação mais humano, seguro e eficaz?**

          **A problemática identificada:**
          • Falta de padronização no processo de dispensação
          • Comunicação inadequada entre farmacêutico e paciente  
          • Baixa adesão terapêutica em tratamentos complexos
          • Necessidade de ferramentas práticas para o cuidado farmacêutico
          • Carência de protocolos específicos para hanseníase/PQT-U

          **O momento da dispensação** representa uma oportunidade única de intervenção farmacêutica, sendo muitas vezes o último contato profissional antes do paciente iniciar ou dar continuidade ao tratamento.

          **Contexto da hanseníase no Brasil:**
          • 2º país em número absoluto de casos mundialmente
          • Complexidade terapêutica da PQT-U (poliquimioterapia única)
          • Alto potencial de reações adversas e interações medicamentosas
          • Necessidade de adesão rigorosa por 6 meses de tratamento
        `,
        keyPoints: [
          'A dispensação é um momento crítico para o sucesso terapêutico',
          'Hanseníase exige cuidado farmacêutico especializado devido à complexidade da PQT-U',
          'Padronização e humanização do atendimento são essenciais'
        ]
      },
      {
        id: 'objetivos-metodologia',
        title: '🔬 Objetivos e Metodologia',
        content: `
          **Objetivo Geral:**
          Elaborar e validar um roteiro de dispensação de medicamentos específico para pacientes em tratamento de hanseníase com PQT-U, visando à otimização do cuidado farmacêutico.

          **Objetivos Específicos:**
          • Desenvolver instrumento estruturado para dispensação de PQT-U
          • Validar o conteúdo com especialistas em farmácia clínica
          • Avaliar a aplicabilidade prática em cenários reais
          • Mensurar impacto na qualidade do cuidado farmacêutico
          • Propor modelo replicável para outras condições terapêuticas

          **Metodologia de Pesquisa:**
          • **Revisão sistemática** da literatura sobre dispensação e hanseníase
          • **Desenvolvimento do instrumento** baseado em evidências científicas
          • **Validação por especialistas** utilizando técnica Delphi modificada
          • **Teste piloto** em unidades de saúde selecionadas
          • **Análise estatística** dos resultados obtidos

          **Fundamentação Teórica:**
          • Diretrizes do Ministério da Saúde para hanseníase
          • Recomendações da Organização Mundial da Saúde (OMS)
          • Princípios do cuidado farmacêutico centrado no paciente
          • Teorias de comunicação em saúde
        `,
        keyPoints: [
          'Metodologia científica rigorosa com validação por especialistas',
          'Abordagem multidisciplinar envolvendo farmácia clínica e saúde pública',
          'Foco na aplicabilidade prática em serviços de saúde do SUS'
        ]
      },
      {
        id: 'roteiro-dispensacao',
        title: '📋 O Roteiro de Dispensação',
        content: `
          **Mais do que um guia técnico**, o roteiro desenvolvido é uma ferramenta que valoriza a escuta, a clareza nas orientações e o cuidado centrado no paciente.

          **Estrutura do Roteiro:**
          • **Acolhimento inicial** - Estabelecimento de vínculo terapêutico
          • **Anamnese farmacêutica** - Coleta de dados clínicos relevantes
          • **Orientação sobre medicamentos** - Informações técnicas adaptadas
          • **Manejo de reações adversas** - Identificação e conduta
          • **Promoção da adesão** - Estratégias personalizadas
          • **Acompanhamento farmacoterapêutico** - Plano de seguimento

          **Características Inovadoras:**
          • Linguagem acessível adaptada ao nível educacional do paciente
          • Checklist visual para garantir completude das orientações
          • Algoritmos de decisão para situações específicas
          • Integração com prontuário eletrônico e sistemas de saúde
          • Materiais educativos complementares padronizados

          **Fundamentação Científica:**
          • Baseado em diretrizes nacionais e internacionais
          • Incorpora evidências sobre adesão terapêutica
          • Considera aspectos psicossociais da hanseníase
          • Alinhado com competências do farmacêutico clínico

          **Diferencial Competitivo:**
          O roteiro standardiza o processo sem robotizar o atendimento, mantendo espaço para personalização e humanização do cuidado.
        `,
        keyPoints: [
          'Ferramenta estruturada que não engessa o atendimento farmacêutico',
          'Integra aspectos técnicos, humanos e educacionais da dispensação',
          'Validado cientificamente para garantir efetividade e segurança'
        ]
      },
      {
        id: 'resultados-contribuicoes',
        title: '📊 Resultados e Contribuições',
        content: `
          **Validação por Especialistas:**
          • **Alto grau de concordância** entre avaliadores especialistas
          • **Relevância clínica** confirmada por farmacêuticos experientes  
          • **Aplicabilidade prática** atestada em diferentes cenários de saúde
          • **Clareza e objetividade** das orientações validadas

          **Impactos Identificados:**
          • **Padronização do cuidado** farmacêutico em hanseníase
          • **Melhoria na comunicação** farmacêutico-paciente
          • **Aumento da adesão** terapêutica relatada pelos usuários
          • **Maior segurança** na dispensação de medicamentos complexos
          • **Otimização do tempo** de atendimento farmacêutico

          **Contribuições Científicas:**
          • Primeiro roteiro validado especificamente para PQT-U no Brasil
          • Metodologia replicável para outras condições terapêuticas
          • Evidências sobre efetividade do cuidado farmacêutico estruturado
          • Base científica para políticas públicas de saúde

          **Contribuições Práticas:**
          • Ferramenta pronta para implementação no SUS
          • Protocolo de treinamento para farmacêuticos
          • Material educativo para pacientes e familiares
          • Sistema de indicadores de qualidade farmacêutica

          **Perspectivas Futuras:**
          • Expansão para outras doenças negligenciadas
          • Desenvolvimento de versão digital/eletrônica
          • Integração com sistemas de informação em saúde
          • Formação de rede colaborativa de farmacêuticos especialistas
        `,
        keyPoints: [
          'Validação científica rigorosa com alto grau de concordância',
          'Impacto comprovado na qualidade do cuidado farmacêutico',
          'Contribuição inédita para o tratamento da hanseníase no Brasil'
        ]
      },
      {
        id: 'aplicacao-pratica',
        title: '🏥 Aplicação Prática e Dr. Gasnelio',
        content: `
          **Esta plataforma representa a evolução digital da tese**, tornando o conhecimento científico acessível através de inteligência artificial.

          **Dr. Gasnelio - Assistente de IA:**
          • **Treinamento especializado** com todo conteúdo da tese
          • **Conhecimento técnico** sobre roteiro de dispensação
          • **Capacidade de orientação** sobre PQT-U e hanseníase
          • **Suporte à tomada de decisão** farmacêutica
          • **Acessibilidade 24/7** para profissionais e estudantes

          **Funcionalidades Disponíveis:**
          • Consulta sobre métodos e resultados da pesquisa
          • Esclarecimentos sobre o roteiro de dispensação
          • Orientações técnicas sobre PQT-U
          • Suporte para implementação em serviços de saúde
          • Educação continuada para farmacêuticos

          **Como Utilizar:**
          • Escolha o Dr. Gasnelio como persona preferida
          • Faça perguntas específicas sobre a tese
          • Solicite orientações sobre casos práticos  
          • Busque informações técnicas atualizadas
          • Compartilhe experiências e tire dúvidas

          **Benefícios da Digitalização:**
          • **Democratização** do conhecimento científico
          • **Acessibilidade** multiplica impacto da pesquisa
          • **Interatividade** permite aprendizado personalizado  
          • **Atualização contínua** com novas evidências
          • **Escalabilidade** para atingir mais profissionais

          **Compromisso Ético:**
          Dr. Gasnelio não substitui o julgamento profissional, mas oferece suporte baseado em evidências científicas para aprimorar a prática farmacêutica.
        `,
        keyPoints: [
          'Dr. Gasnelio democratiza o acesso ao conhecimento da tese',
          'Ferramenta complementar que apoia a prática farmacêutica',
          'Compromisso com rigor científico e ética profissional'
        ]
      },
      {
        id: 'afiliacao-contato',
        title: '🎓 Afiliação Acadêmica e Contato',
        content: `
          **Programa de Pós-Graduação em Ciências Farmacêuticas**
          **Universidade de Brasília (UnB)**
          Campus Darcy Ribeiro - Brasília, DF, 70910-900

          **Orientação Acadêmica:**
          Sob supervisão de renomados professores especialistas em Farmácia Clínica e Saúde Pública da UnB.

          **Linha de Pesquisa:**
          Cuidado Farmacêutico e Otimização da Farmacoterapia

          **Colaborações:**
          • Ministério da Saúde - Coordenação Nacional de Hanseníase  
          • Secretarias Estaduais e Municipais de Saúde
          • Conselho Federal de Farmácia (CFF)
          • Sociedade Brasileira de Farmácia Hospitalar (SBRAFH)

          **Citação Sugerida:**
          GOMES, N. **Roteiro de Dispensação para Otimização do Cuidado Farmacêutico em Hanseníase.** Tese (Doutorado em Ciências Farmacêuticas) - Universidade de Brasília, Brasília, 2025.

          **Contato para Colaborações:**
          • **Dúvidas acadêmicas:** Entre em contato através da plataforma
          • **Propostas de colaboração:** Bem-vindas críticas e sugestões
          • **Implementação em serviços:** Suporte para adaptação local
          • **Pesquisas futuras:** Interesse em parcerias científicas

          **Compromisso com a Ciência Aberta:**
          Esta pesquisa segue princípios de transparência e compartilhamento do conhecimento científico para o bem comum da saúde pública brasileira.

          **Agradecimentos:**
          A todos os farmacêuticos, pacientes e profissionais de saúde que contribuíram para a realização desta pesquisa e validação dos instrumentos desenvolvidos.
        `,
        keyPoints: [
          'Pesquisa realizada em prestigioso programa de pós-graduação da UnB',
          'Ampla rede de colaborações institucionais na área da saúde',
          'Compromisso com ciência aberta e impacto social da pesquisa'
        ]
      },
      {
        id: 'bibliografia-referencias',
        title: '📚 Bibliografia e Referências',
        content: `
          **Referências Bibliográficas Utilizadas na Pesquisa**
          
          Esta seção apresenta as principais fontes científicas, diretrizes clínicas e documentos normativos que fundamentaram o desenvolvimento do roteiro de dispensação para hanseníase/PQT-U.
          
          **📋 Diretrizes e Protocolos Oficiais:**
          
          **1.** Protocolo Clínico e Diretrizes Terapêuticas da Hanseníase. Ministério da Saúde. Disponível em: https://www.gov.br/saude/pt-br/assuntos/saude-de-a-a-z/h/hanseniase/publicacoes/protocolo-clinico-e-diretrizes-terapeuticas-da-hanseniase-2022
          
          **2.** Protocolo Clínico e Diretrizes Terapêuticas Hanseníase (PCDT Hanseníase 2022).
          
          **3.** Ministério da Saúde. Componente Estratégico da Assistência Farmacêutica.
          
          **⚖️ Legislação e Normas Profissionais:**
          
          **4.** Lei 7.498/1986 (Regulamenta o exercício da Enfermagem – competência para prescrição)
          
          **5.** Programa Farmácia Popular – lista atualizada 2023
          
          **6.** Fluxo interno do SUS para medicamentos estratégicos
          
          **📖 Fontes Científicas e Bases de Dados:**
          
          **7.** Uptodate: Hansen disease (leprosy): Treatment and prevention
          
          **8.** Micromedex, acesso 2023
          
          **9.** Guia Terapêutico da Sociedade Brasileira de Hansenologia – 2022
          
          **📄 Informações Técnicas de Medicamentos:**
          
          **10.** Bula do produto importado via OPAS/OMS
          
          **11.** Guia "What to do if you miss a dose" (MS/OMS)
          
          **12.** Referências internacionais de interação medicamento-bebida
          
          **13.** Bula – informações de armazenamento do fabricante
          
          **🛡️ Farmacovigilância e Segurança:**
          
          **14.** ANVISA, Vigimed. Dados de farmacovigilância de hanseníase até abril/2023
          
          **15.** Agência Nacional de Vigilância Sanitária (ANVISA). Consulta de medicamentos estratégicos
          
          **📋 Procedimentos e Manuais Técnicos:**
          
          **16.** Manual de procedimentos de dispensação do SUS
          
          **🌍 Diretrizes Internacionais:**
          
          **17.** World Health Organization. Guidelines for the diagnosis, treatment and prevention of leprosy (2018)
          
          **📖 Referências Farmacêuticas:**
          
          **18.** Dicionário de Especialidades Farmacêuticas
          
          **📊 Fundamentação Metodológica Adicional:**
          
          Além das referências listadas acima, esta pesquisa incorpora:
          
          • **Revisão sistemática** de literatura científica sobre dispensação farmacêutica
          • **Análise de guidelines** internacionais de cuidado farmacêutico
          • **Consulta a especialistas** em farmácia clínica e hanseníase
          • **Validação por técnica Delphi** modificada com painel de experts
          • **Evidências de prática clínica** coletadas em serviços de saúde
          
          **🔍 Critérios de Seleção das Referências:**
          
          • Relevância científica e atualidade das informações
          • Conformidade com diretrizes nacionais e internacionais
          • Aplicabilidade prática no contexto do SUS brasileiro
          • Qualidade metodológica e nível de evidência
          • Adequação ao escopo da pesquisa sobre dispensação farmacêutica
          
          **📝 Nota Metodológica:**
          
          Todas as referências foram criticamente avaliadas quanto à qualidade metodológica, relevância clínica e aplicabilidade prática. A seleção priorizou fontes oficiais, diretrizes baseadas em evidências e publicações peer-reviewed de alta qualidade científica.
        `,
        keyPoints: [
          'Bibliografia abrangente incluindo diretrizes oficiais e literatura científica',
          'Fontes atualizadas e relevantes para a prática farmacêutica em hanseníase',
          'Seleção criteriosa baseada em qualidade metodológica e aplicabilidade'
        ]
      }
    ],
    references: [
      'Protocolo Clínico e Diretrizes Terapêuticas da Hanseníase. Ministério da Saúde, 2022.',
      'World Health Organization. Guidelines for the diagnosis, treatment and prevention of leprosy. Geneva: WHO, 2018.',
      'ANVISA, Vigimed. Dados de farmacovigilância de hanseníase até abril/2023.',
      'Guia Terapêutico da Sociedade Brasileira de Hansenologia – 2022.',
      'Manual de procedimentos de dispensação do SUS.',
      'Uptodate: Hansen disease (leprosy): Treatment and prevention.'
    ],
    nextModule: 'hanseniase-intro',
    previousModule: undefined
  };

  return (
    <EducationalLayout>
      <ModuleTemplate 
        moduleData={moduleData}
        onSectionComplete={(sectionId) => {
          if (process.env.NODE_ENV === 'development') {
            secureLogger.debug('Seção de módulo concluída', { sectionId, module: 'sobre-a-tese' });
          }
        }}
        onModuleComplete={() => {
          if (process.env.NODE_ENV === 'development') {
            secureLogger.info('Módulo educacional concluído', { module: 'sobre-a-tese', type: 'completion' });
          }
        }}
        showChatIntegration={true}
      />
    </EducationalLayout>
  );
}