'use client';

import EducationalLayout from '@/components/layout/EducationalLayout';
import Link from 'next/link';
import renderMarkdownContent from '@/utils/renderMarkdownContent';

export default function DiagnosticoModulePage() {
  const moduleContent = {
    title: 'Diagnóstico da Hanseníase',
    subtitle: 'Reconhecimento clínico e classificação operacional - baseado no PCDT Hanseníase 2022',
    duration: '25 minutos',
    level: 'Técnico-científico',
    category: 'Diagnóstico Clínico',
    description: 'Módulo técnico-científico para profissionais de saúde e estudantes. Baseado no Protocolo Clínico e Diretrizes Terapêuticas do Ministério da Saúde (2022) e evidências científicas atuais.',
    targetAudience: 'Profissionais de saúde, estudantes de medicina, farmácia e enfermagem',
    references: [
      'Brasil. Ministério da Saúde. Protocolo Clínico e Diretrizes Terapêuticas da Hanseníase (2022)',
      'WHO. Guidelines for the diagnosis, treatment and prevention of leprosy (2018)',
      'Ridley DS, Jopling WH. Classification of leprosy according to immunity. Int J Lepr Other Mycobact Dis. 1966'
    ],
    
    sections: [
      {
        id: 'sinais-cardinais',
        title: '🎯 Sinais Cardinais da Hanseníase',
        content: `
          **Fundamentação científica:** O diagnóstico clínico da hanseníase é estabelecido pela presença de pelo menos UM dos três sinais cardinais, conforme preconizado pelo PCDT 2022 e validado pela OMS.
          
          **1. Lesão(ões) dermatológica(s) com alteração de sensibilidade:**
          • **Fisiopatologia:** Invasão neural precoce pelo M. leprae causa alteração da sensibilidade térmica, dolorosa e/ou tátil
          • **Semiologia:** Hipoestesia progredindo para anestesia completa
          • **Características:** Lesões hipocrômicas, eritematosas ou normocrômicas; bordas definidas (tuberculoide) ou difusas (lepromatosa)
          • **Distribuição:** Assimétrica nas formas tuberculoide/borderline; simétrica na forma lepromatosa
          • **Teste da sensibilidade:** Usar algodão (tátil), tubo com água morna/fria (térmica), agulha (dolorosa)
          
          **2. Espessamento de tronco(s) nervoso(s) periférico(s):**
          • **Base anatômica:** Predileção por nervos superficiais em áreas de menor temperatura corporal
          • **Técnica de palpação:** Bilateral e comparativa, com paciente relaxado
          • **Nervos mais acometidos:**
            - Ulnar (epitróclea) - parestesia/anestesia 4º e 5º dedos
            - Mediano (punho) - parestesia/anestesia 1º, 2º, 3º dedos
            - Radial superficial (punho) - anestesia dorso da mão
            - Fibular comum (cabeça da fíbula) - pé caído
            - Tibial posterior (maléolo medial) - anestesia plantar
            - Facial (região pré-auricular) - lagoftalmo
          • **Sinais associados:** Dor neural, déficit motor, deformidades
          
          **3. Baciloscopia positiva (BAAR):**
          • **Método:** Coloração de Ziehl-Neelsen
          • **Material:** Raspado intradérmico de lóbulo auricular e/ou lesão
          • **Técnica de coleta:** Escarificação superficial após antissepsia, evitar sangramento
          • **Interpretação:** Índice Baciloscópico (IB) de 0 a 6+; Índice Morfológico (IM) 0-100%
          • **Significado clínico:** IB ≥ 1+ confirma hanseníase multibacilar
        `,
        clinicalCases: `
          **💼 Caso Clínico 1:** Paciente masculino, 35 anos, lavrador, procedente de área endêmica. Refere mancha hipocrômica em região dorsal há 8 meses, com perda progressiva da sensibilidade. Ao exame: lesão única de 6 cm, bordas elevadas, anestesia térmica e dolorosa. Espessamento do nervo ulnar direito. Baciloscopia: IB 0. **Diagnóstico:** Hanseníase tuberculoide (PB).
          
          **💼 Caso Clínico 2:** Paciente feminino, 28 anos, doméstica, história de contato intradomiciliar. Apresenta múltiplas lesões eritematosas simétricas em face e membros, sem alteração de sensibilidade evidente. Espessamento bilateral dos nervos ulnares e fibular comum. Baciloscopia: IB 4+. **Diagnóstico:** Hanseníase lepromatosa (MB).
        `,
        keyPoints: [
          'Um único sinal cardinal é suficiente para estabelecer o diagnóstico clínico',
          'Alteração de sensibilidade é o sinal mais precoce e comum (85% dos casos)',
          'Baciloscopia positiva sempre indica forma multibacilar',
          'Avaliação neurológica sistemática é fundamental para detecção de incapacidades'
        ],
        askAssistant: {
          suggestedQuestions: [
            'Dr. Gasnelio, como diferenciar hanseníase de vitiligo na prática clínica?',
            'Qual a técnica correta para palpação dos nervos periféricos?',
            'Como interpretar os resultados da baciloscopia BAAR?'
          ]
        }
      },
      {
        id: 'classificacao',
        title: '📊 Classificação Operacional para Definição Terapêutica',
        content: `
          **Fundamentação:** A classificação operacional da OMS (1981, revisada em 1998) baseia-se na carga bacilar e determina o esquema de Poliquimioterapia Única (PQT-U) apropriado.
          
          **HANSENÍASE PAUCIBACILAR (PB):**
          **Critérios diagnósticos:**
          • Até 5 lesões cutâneas
          • Baciloscopia negativa (IB = 0) em todos os sítios examinados
          • Comprometimento de até 1 tronco nervoso
          • Formas histológicas: tuberculoide (TT) e indeterminada (I)
          
          **Características clínicas:**
          • Lesões hipocrômicas ou eritematosas, bem delimitadas
          • Anestesia térmica, dolorosa e tátil pronunciada
          • Espessamento neural assimétrico
          • Baixa transmissibilidade
          • Prognóstico favorável
          
          **HANSENÍASE MULTIBACILAR (MB):**
          **Critérios diagnósticos:**
          • 6 ou mais lesões cutâneas, OU
          • Baciloscopia positiva (IB ≥ 1+) independentemente do número de lesões, OU
          • Comprometimento de 2 ou mais troncos nervosos
          • Formas histológicas: borderline (BB, BT, BL) e lepromatosa (LL)
          
          **Características clínicas:**
          • Lesões múltiplas, mal delimitadas, simétricas
          • Infiltração difusa da pele (especialmente face)
          • Alteração de sensibilidade variável ou ausente
          • Espessamento neural simétrico
          • Alta transmissibilidade (especialmente LL)
          
          **CASOS ESPECIAIS:**
          
          **Hanseníase Neural Pura:**
          • Espessamento neural sem lesões cutâneas
          • Classificação: PB (1 nervo) ou MB (≥2 nervos)
          • Baciloscopia sempre negativa
          • Diagnóstico diferencial com outras neuropatias
          
          **Hanseníase em Menores de 15 anos:**
          • Sempre classificar como MB independente do número de lesões
          • Indica transmissão ativa na comunidade
          • Requer investigação de contactantes
        `,
        clinicalCases: `
          **💼 Caso Clínico 3:** Estudante universitária, 22 anos, apresenta 3 lesões hipocrômicas em membros inferiores com anestesia completa. Sem espessamento neural palpável. Baciloscopia negativa. **Classificação:** Hanseníase paucibacilar - **Tratamento:** PQT-PB por 6 meses.
          
          **💼 Caso Clínico 4:** Comerciante, 45 anos, com histórico de contato. Apresenta 8 lesões eritematosas simétricas, infiltração facial, madarose bilateral. Espessamento de múltiplos nervos. Baciloscopia IB 3+. **Classificação:** Hanseníase multibacilar - **Tratamento:** PQT-MB por 12 meses.
        `,
        keyPoints: [
          'Classificação operacional define duração e composição do tratamento PQT',
          'Na dúvida entre PB e MB, sempre classificar como MB',
          'Baciloscopia positiva = obrigatoriamente MB, independente do número de lesões',
          'Crianças com hanseníase são sempre classificadas como MB'
        ],
        askAssistant: {
          suggestedQuestions: [
            'Dr. Gasnelio, quando devo classificar um caso como neural pura?',
            'Como proceder quando há discordância entre número de lesões e baciloscopia?',
            'Qual a importância epidemiológica da classificação operacional?'
          ]
        }
      },
      {
        id: 'exames',
        title: '🔬 Propedêutica Complementar em Hanseníase',
        content: `
          **1. BACILOSCOPIA DE RASPADO INTRADÉRMICO (BAAR):**
          
          **Indicações:**
          • Confirmação diagnóstica em casos suspeitos
          • Classificação operacional (PB vs MB)
          • Seguimento terapêutico (opcional)
          
          **Técnica de coleta:**
          • **Sítios:** Lóbulos auriculares bilaterais + 1-2 lesões ativas
          • **Procedimento:** Antissepsia → compressão → escarificação superficial → raspado
          • **Cuidados:** Evitar sangramento, material adequado (10-20 campos por lâmina)
          
          **Interpretação:**
          • **Índice Baciloscópico (IB):** 0 a 6+ (escala logarítmica)
          • **Índice Morfológico (IM):** 0-100% (bacilos íntegros/total)
          • **Significado clínico:** IB ≥ 1+ = hanseníase MB
          
          **2. HISTOPATOLOGIA (BIÓPSIA DE PELE):**
          
          **Indicações específicas:**
          • Casos atípicos sem sinais cardinais evidentes
          • Diagnóstico diferencial complexo
          • Hanseníase neural pura
          • Casos com evolução atípica
          
          **Técnica:**
          • **Método:** Punch 4-6mm em borda ativa da lesão
          • **Colorações:** H&E + Fite-Faraco (pesquisa de BAAR)
          • **Avaliação:** Infiltrado inflamatório, arranjo celular, presença de bacilos
          
          **Classificação de Ridley-Jopling:**
          • **TT (Tuberculoide):** Epitélio organizado, poucos/ausentes bacilos
          • **BT (Borderline-tuberculoide):** Epitélio menos organizado
          • **BB (Borderline-borderline):** Epitélio desorganizado
          • **BL (Borderline-lepromatosa):** Macrófagos espumosos, muitos bacilos
          • **LL (Lepromatosa):** Células de Virchow, bacilos abundantes
          
          **3. AVALIAÇÃO NEUROLÓGICA FUNCIONAL:**
          
          **Testes de sensibilidade:**
          • **Tátil:** Monofilamentos de Semmes-Weinstein (2g, 10g)
          • **Térmica:** Tubos com água (35-40°C vs temperatura ambiente)
          • **Dolorosa:** Agulha descartável ou alfinete
          
          **Avaliação motora:**
          • **Força muscular:** Escala de 0-5 (MRC - Medical Research Council)
          • **Músculos-chave:** Flexores dos dedos, extensores do punho, músculos intrínsecos da mão
          • **Testes funcionais:** Preensão, pinça digital, movimentos finos
          
          **4. EXAMES COMPLEMENTARES ESPECIALIZADOS:**
          
          **Eletroneuromiografia:**
          • Indicação: Neuropatia hansênica vs outras neuropatias
          • Achados: Neuropatia axonal > desmielinizante
          • Padrão: Mononeuropatia múltipla assimétrica
          
          **Ultrassonografia de nervos periféricos:**
          • Avaliação não-invasiva do espessamento neural
          • Seguimento da resposta terapêutica
          • Detecção precoce de neurite
          
          **Testes sorológicos (pesquisa):**
          • Anti-PGL1 (glicolípide fenólico-1): Correlação com carga bacilar
          • Anti-LAM (lipoarabinomanana): Marcador de resposta imune
        `,
        clinicalCases: `
          **💼 Caso Clínico 5:** Paciente com suspeita de hanseníase neural pura. Parestesia e fraqueza progressiva da mão direita. Espessamento do nervo ulnar. Baciloscopia negativa. **Conduta:** Biópsia de nervo + eletroneuromiografia para diagnóstico diferencial.
        `,
        keyPoints: [
          'Baciloscopia é padrão-ouro para classificação operacional',
          'Biópsia indicada apenas em casos atípicos ou duvidosos',
          'Avaliação neurológica sistemática previne incapacidades',
          'Eletroneuromiografia auxilia no diagnóstico diferencial de neuropatias'
        ],
        askAssistant: {
          suggestedQuestions: [
            'Dr. Gasnelio, qual a diferença entre IB e IM na baciloscopia?',
            'Quando está indicada a biópsia de nervo em hanseníase?',
            'Como interpretar os achados da eletroneuromiografia?'
          ]
        }
      },
      {
        id: 'diferencial',
        title: '🔍 Diagnóstico Diferencial Sistematizado',
        content: `
          **ABORDAGEM CLÍNICA ESTRUTURADA:**
          
          O diagnóstico diferencial da hanseníase deve ser sistematizado considerando:
          • **Lesões cutâneas** com ou sem alteração de sensibilidade
          • **Neuropatias periféricas** isoladas ou associadas
          • **Context epidemiológico** e fatores de risco
          
          **1. DERMATOSES HIPOCRÔMICAS:**
          
          **Vitiligo:**
          • **Diferencial-chave:** Despigmentação completa vs hipocrômica
          • **Sensibilidade:** Sempre preservada (teste fundamental)
          • **Distribuição:** Simétrica, áreas de atrito/trauma
          • **Evolução:** Progressão centrífuga, repigmentação folicular
          • **Lâmpada de Wood:** Fluorescência branco-azulada
          
          **Pitiríase versicolor:**
          • **Características:** Descamação furfurácea fina ("raspagem da unha")
          • **Teste do KOH:** Positivo (hifas e esporos - "espaguete e almôndega")
          • **Distribuição:** Tórax, ombros, raramente face/extremidades
          • **Sazonalidade:** Piora no calor e umidade
          
          **Nevo acrômico:**
          • **Características:** Lesão congênita, estável desde nascimento
          • **Histologia:** Diminuição de melanina, melanócitos normais
          • **Diferencial:** História clínica (presente desde nascimento)
          
          **2. DERMATOSES ERITEMATOSAS/INFILTRATIVAS:**
          
          **Lúpus eritematoso cutâneo:**
          • **Morfologia:** Lesões em "borboleta", eritema malar
          • **Histologia:** Interface dermatite, depósitos de mucina
          • **Testes:** FAN, anti-Ro/La, biópsia com imunofluorescência
          
          **Sarcoidose cutânea:**
          • **Características:** Pápulas e placas violáceas
          • **Histologia:** Granulomas epitelioides "nus" (sem necrose)
          • **Sistêmica:** Comprometimento pulmonar, linfonodos, olhos
          
          **3. NEUROPATIAS PERIFÉRICAS:**
          
          **Diabetes mellitus:**
          • **Padrão:** Polineuropatia distal simétrica
          • **Sintomas:** Parestesias simétricas, queimação plantar
          • **Laboratório:** Glicemia, HbA1c, teste oral de tolerância
          
          **Neuropatia alcoólica:**
          • **História:** Etilismo crônico, déficits nutricionais
          • **Padrão:** Polineuropatia sensório-motora distal
          • **Déficits:** Vitamina B1, B6, B12, ácido fólico
          
          **Síndrome do túnel do carpal:**
          • **Distribuição:** Território do nervo mediano
          • **Testes:** Tinel, Phalen, eletroneuromiografia
          • **Fatores:** Profissão, gravidez, hipotireoidismo
          
          **Hanseníase neural pura vs Neuropatia hereditária:**
          • **HNPP** (Neuropatia hereditária com suscetibilidade a paralisias por pressão)
          • **CMT** (Charcot-Marie-Tooth)
          • **História familiar:** Fundamental para diferenciação
          
          **4. ALGORITMO DIAGNÓSTICO:**
          
          **Passo 1:** Lesão cutânea presente?
          • **SIM** → Testar sensibilidade → Alterada = suspeita de hanseníase
          • **NÃO** → Neuropatia isolada → Investigar hanseníase neural pura
          
          **Passo 2:** História epidemiológica
          • **Área endêmica?** **Contato domiciliar?** **Ocupação de risco?**
          
          **Passo 3:** Exame neurológico sistematizado
          • **Padrão:** Mononeuropatia múltipla = suspeita hanseníase
          • **Nervos acometidos:** Predileção por nervos superficiais
          
          **Passo 4:** Propedêutica dirigida
          • **Baciloscopia:** Sempre solicitar se disponível
          • **Biópsia:** Casos atípicos ou duvidosos
        `,
        clinicalCases: `
          **💼 Caso Clínico 6:** Adolescente com lesões hipocrômicas em face, sem alteração de sensibilidade. Mãe refere "nascença". Lâmpada de Wood negativa. **Diagnóstico:** Nevo acrômico - **Conduta:** Seguimento dermatológico, não tratar como hanseníase.
          
          **💼 Caso Clínico 7:** Diabético de 60 anos com parestesias simétricas em pés e mãos. Sem lesões cutâneas. Espessamento neural ausente. HbA1c 10,2%. **Diagnóstico:** Neuropatia diabética - **Conduta:** Controle glicêmico, não confundir com hanseníase neural.
        `,
        keyPoints: [
          'Alteração de sensibilidade é patognomônica de hanseníase em lesões cutâneas',
          'Padrão de mononeuropatia múltipla assimétrica sugere hanseníase',
          'Na dúvida diagnóstica, sempre iniciar tratamento - sequelas neurológicas são irreversíveis',
          'História epidemiológica e exame neurológico direcionam o diagnóstico'
        ],
        askAssistant: {
          suggestedQuestions: [
            'Dr. Gasnelio, como diferenciar hanseníase de neuropatia diabética?',
            'Quando devo suspeitar de hanseníase neural pura?',
            'Qual a importância da lâmpada de Wood no diagnóstico diferencial?'
          ]
        }
      },
      {
        id: 'tese-content',
        title: '📖 Conteúdo da Tese: Roteiro de Dispensação',
        content: `
          **Baseado na tese "Roteiro de Dispensação - Hanseníase.pdf"**
          
          Esta seção apresenta o conteúdo técnico-científico extraído diretamente da tese de doutorado, 
          fornecendo orientações especializadas para farmacêuticos clínicos e profissionais de saúde 
          envolvidos na dispensação de medicamentos para hanseníase.
          
          **📋 PROTOCOLO DE DISPENSAÇÃO PQT-U:**
          
          Conforme descrito na tese, a Poliquimioterapia Única (PQT-U) representa o tratamento 
          padrão-ouro para hanseníase, disponível exclusivamente pelo SUS como medicamento do 
          Componente Estratégico.
          
          **Apresentações disponíveis:**
          • **PQT-U Adulto:** Dose mensal supervisionada + doses diárias autoadministradas
          • **PQT-U Infantil:** Para crianças entre 30-50kg de peso corporal
          
          **Etapas da dispensação farmacêutica:**
          1. **Avaliação inicial:** Verificação de prescrição e classificação operacional
          2. **Orientações técnicas:** Posologia, administração, armazenamento
          3. **Acompanhamento:** Monitorização de adesão e reações adversas
          
          Para acesso ao conteúdo completo da tese, utilize o link de download abaixo.
        `,
        downloadSection: {
          title: '📥 Download da Tese Completa',
          description: 'Acesse o documento completo "Roteiro de Dispensação - Hanseníase.pdf" para consulta offline e referência técnica.',
          fileSize: '988.5KB',
          fileName: 'Roteiro de Dsispensação - Hanseníase.pdf'
        },
        keyPoints: [
          'Tese validada por comissão científica de doutorado',
          'Baseada no PCDT Hanseníase 2022 do Ministério da Saúde',
          'Protocolo específico para farmacêuticos clínicos',
          'Orientações para dispensação segura e eficaz'
        ]
      }
    ],
    
    quiz: [
      {
        question: 'Segundo o PCDT 2022, quantos sinais cardinais são necessários para estabelecer o diagnóstico clínico de hanseníase?',
        options: [
          'Todos os três sinais cardinais devem estar presentes',
          'Pelo menos dois dos três sinais cardinais',
          'Apenas um sinal cardinal é suficiente',
          'Depende da forma clínica (PB ou MB)'
        ],
        correct: 2,
        explanation: 'O diagnóstico clínico de hanseníase é estabelecido pela presença de pelo menos UM dos três sinais cardinais: lesão com alteração de sensibilidade, espessamento neural ou baciloscopia positiva.',
        level: 'técnico'
      },
      {
        question: 'Um paciente apresenta 4 lesões de pele com alteração de sensibilidade e baciloscopia com IB 2+. Qual a classificação operacional?',
        options: [
          'Paucibacilar (PB) - até 5 lesões',
          'Multibacilar (MB) - baciloscopia positiva',
          'Indeterminada - necessita biópsia',
          'Borderline - características intermediárias'
        ],
        correct: 1,
        explanation: 'Baciloscopia positiva (IB ≥ 1+) sempre classifica o caso como Multibacilar (MB), independentemente do número de lesões cutâneas.',
        level: 'técnico'
      },
      {
        question: 'Na avaliação de uma lesão hipocrômica suspeita, qual o teste mais importante para diferenciar hanseníase de vitiligo?',
        options: [
          'Biópsia de pele com coloração especial',
          'Teste de sensibilidade (térmica, dolorosa e tátil)',
          'Baciloscopia de raspado intradérmico',
          'Lâmpada de Wood para detectar fluorescência'
        ],
        correct: 1,
        explanation: 'A alteração de sensibilidade é patognomônica de hanseníase em lesões cutâneas e é o principal diferencial com vitiligo, que sempre preserva a sensibilidade.',
        level: 'técnico'
      },
      {
        question: 'Um profissional de saúde suspeita de hanseníase neural pura em um paciente com espessamento do nervo ulnar bilateral e parestesias. Qual a classificação operacional adequada?',
        options: [
          'Sempre Paucibacilar (PB) - baciloscopia negativa',
          'Sempre Multibacilar (MB) - comprometimento neural',
          'Multibacilar (MB) - dois nervos acometidos',
          'Aguardar resultado da eletroneuromiografia'
        ],
        correct: 2,
        explanation: 'Na hanseníase neural pura, a classificação baseia-se no número de nervos: 1 nervo = PB, 2 ou mais nervos = MB. Neste caso, 2 nervos = MB.',
        level: 'avançado'
      }
    ]
  };

  return (
    <EducationalLayout>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Module Header */}
        <div style={{
          background: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)',
          color: 'white',
          padding: '30px',
          borderRadius: '12px',
          marginBottom: '30px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
            <span style={{ fontSize: '3rem' }}>🩺</span>
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
              color: '#9c27b0',
              marginBottom: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{ 
                background: '#9c27b0',
                color: 'white',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                fontWeight: 'bold'
              }}>
                {index + 1}
              </span>
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
            
            {/* Key Points */}
            <div style={{
              background: '#f3e5f5',
              padding: '15px',
              borderRadius: '8px',
              borderLeft: '4px solid #9c27b0'
            }}>
              <h4 style={{ margin: '0 0 10px', color: '#9c27b0' }}>🎯 Pontos-chave:</h4>
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
            color: '#9c27b0',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            🧠 Teste seus conhecimentos
          </h2>
          
          {moduleContent.quiz.map((question, index) => (
            <div key={index} style={{
              background: '#f3e5f5',
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
                  background: optIndex === question.correct ? '#e8f5e8' : '#fff',
                  border: optIndex === question.correct ? '2px solid #4caf50' : '1px solid #ddd'
                }}>
                  {String.fromCharCode(65 + optIndex)}. {option}
                  {optIndex === question.correct && (
                    <span style={{ color: '#4caf50', marginLeft: '10px', fontWeight: 'bold' }}>
                      ✓ Correto
                    </span>
                  )}
                </div>
              ))}
              
              <div style={{
                marginTop: '10px',
                padding: '10px',
                background: '#fff3cd',
                borderRadius: '6px',
                fontSize: '0.9rem',
                color: '#856404'
              }}>
                <strong>💡 Explicação:</strong> {question.explanation}
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
            href="/modules/hanseniase"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: '#6c757d',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: 'bold'
            }}
          >
            ← Anterior: Sobre a Hanseníase
          </Link>
          
          <Link
            href="/modules/tratamento"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: '#9c27b0',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              fontWeight: 'bold'
            }}
          >
            Próximo: Tratamento PQT-U →
          </Link>
        </div>
      </div>
    </EducationalLayout>
  );
}