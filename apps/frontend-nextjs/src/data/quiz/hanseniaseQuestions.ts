/**
 * Base de Questões sobre Hanseníase
 * Questões expandidas baseadas na knowledge base com 4 níveis de dificuldade
 * Feedback adaptativo por personas (Gá e Dr. Gasnelio)
 */

import type { EducationalQuiz, QuizQuestion } from '../../types/gamification';
import type { UserLevel } from '../../types/disclosure';

// ============================================================================
// QUESTÕES NÍVEL PACIENTE (10 questões)
// ============================================================================

const pacienteQuestions: QuizQuestion[] = [
  {
    id: 'pac_001',
    type: 'multiple_choice',
    question: 'Qual é a duração do tratamento PQT-U para hanseníase?',
    options: [
      '3 meses',
      '6 meses', 
      '12 meses',
      '24 meses'
    ],
    correctAnswer: '6 meses',
    explanation: {
      correct: 'Isso mesmo! O tratamento PQT-U dura 6 meses, com doses mensais supervisionadas. É importante completar todo o período para garantir a cura.',
      incorrect: 'O tratamento correto é de 6 meses. Não se preocupe, é importante seguir exatamente este período para garantir que a hanseníase seja completamente curada.',
      technical: 'O protocolo PQT-U estabelece 6 doses mensais supervisionadas para hanseníase paucibacilar, conforme diretrizes do Ministério da Saúde.'
    },
    difficulty: 1,
    topics: ['duração_tratamento', 'pqt_u'],
    xpValue: 10,
    userLevel: ['paciente', 'estudante', 'profissional', 'especialista'],
    image: {
      url: '/images/quiz/placeholders/calendar_6months.png',
      alt: 'Calendário mostrando 6 meses de tratamento',
      caption: 'Duração do tratamento PQT-U'
    }
  },

  {
    id: 'pac_002',
    type: 'true_false',
    question: 'É normal a urina ficar com cor alaranjada durante o tratamento?',
    correctAnswer: 'true',
    explanation: {
      correct: 'Exato! A Rifampicina deixa a urina alaranjada e isso é completamente normal. Não pare o tratamento por causa disso.',
      incorrect: 'Na verdade, é sim normal! A cor alaranjada na urina é causada pela Rifampicina e não é perigosa. Continue o tratamento normalmente.',
      technical: 'A rifampicina causa pigmentação alaranjada de fluidos corporais (urina, lágrimas, saliva) devido às suas propriedades farmacológicas.'
    },
    difficulty: 1,
    topics: ['rifampicina', 'efeitos_esperados'],
    xpValue: 10,
    userLevel: ['paciente', 'estudante', 'profissional', 'especialista']
  },

  {
    id: 'pac_003',
    type: 'multiple_choice',
    question: 'Qual o melhor horário para tomar os medicamentos autoadministrados?',
    options: [
      'Em jejum pela manhã',
      'Junto com as refeições',
      'À noite após o jantar',
      'A qualquer horário'
    ],
    correctAnswer: 'À noite após o jantar',
    explanation: {
      correct: 'Perfeito! Tomar os medicamentos à noite após o jantar ajuda na adesão e reduz desconfortos no estômago.',
      incorrect: 'O ideal é tomar à noite após o jantar. Isso reduz os desconfortos gastrointestinais e melhora sua adesão ao tratamento.',
      technical: 'A administração noturna pós-prandial otimiza a tolerabilidade gástrica e a aderência terapêutica conforme o protocolo clínico.'
    },
    difficulty: 1,
    topics: ['administração', 'horários'],
    xpValue: 10,
    userLevel: ['paciente', 'estudante', 'profissional', 'especialista']
  },

  {
    id: 'pac_004',
    type: 'true_false',
    question: 'Posso tomar suco de laranja junto com os medicamentos?',
    correctAnswer: 'false',
    explanation: {
      correct: 'Isso mesmo! O suco de laranja pode diminuir a absorção da clofazimina. É melhor evitar bebidas ácidas.',
      incorrect: 'Na verdade não pode! O suco de laranja e outras bebidas ácidas diminuem a absorção da clofazimina, prejudicando o tratamento.',
      technical: 'Bebidas ácidas como suco de laranja reduzem significativamente a absorção da clofazimina, comprometendo a eficácia terapêutica.'
    },
    difficulty: 1,
    topics: ['interações', 'clofazimina'],
    xpValue: 10,
    userLevel: ['paciente', 'estudante', 'profissional', 'especialista']
  },

  {
    id: 'pac_005',
    type: 'multiple_choice',
    question: 'Se eu esquecer de tomar uma dose, o que devo fazer?',
    options: [
      'Tomar duas doses no dia seguinte',
      'Tomar quando lembrar, exceto se estiver próximo da próxima dose',
      'Parar o tratamento e procurar o médico',
      'Continuar normalmente sem repor'
    ],
    correctAnswer: 'Tomar quando lembrar, exceto se estiver próximo da próxima dose',
    explanation: {
      correct: 'Correto! Se lembrar logo, tome a dose esquecida. Mas se já estiver próximo da próxima dose, pule a esquecida e continue normalmente.',
      incorrect: 'O certo é: tome quando lembrar, mas se estiver muito próximo da próxima dose, pule a esquecida. Nunca tome dose dupla!',
      technical: 'Em casos de dose omitida, administrar quando recordado, exceto se próximo ao horário da dose subsequente para evitar sobredosagem.'
    },
    difficulty: 1,
    topics: ['adesão', 'dose_esquecida'],
    xpValue: 10,
    userLevel: ['paciente', 'estudante', 'profissional', 'especialista']
  },

  {
    id: 'pac_006',
    type: 'true_false',
    question: 'Posso consumir bebidas alcoólicas durante o tratamento?',
    correctAnswer: 'false',
    explanation: {
      correct: 'Correto! Deve evitar bebidas alcoólicas durante todo o tratamento para não prejudicar a eficácia dos medicamentos.',
      incorrect: 'É importante evitar álcool durante o tratamento! O álcool pode interferir nos medicamentos e prejudicar sua recuperação.',
      technical: 'O etanol pode potencializar hepatotoxicidade da rifampicina e interferir na eficácia terapêutica do esquema PQT-U.'
    },
    difficulty: 1,
    topics: ['interações', 'álcool'],
    xpValue: 10,
    userLevel: ['paciente', 'estudante', 'profissional', 'especialista']
  },

  {
    id: 'pac_007',
    type: 'multiple_choice',
    question: 'Onde devo guardar os medicamentos em casa?',
    options: [
      'Na geladeira',
      'No banheiro',
      'Local seco, protegido da luz, temperatura ambiente',
      'Perto da janela para não esquecer'
    ],
    correctAnswer: 'Local seco, protegido da luz, temperatura ambiente',
    explanation: {
      correct: 'Perfeito! Guarde em local seco, longe da luz e em temperatura ambiente (15-30°C) para preservar os medicamentos.',
      incorrect: 'O correto é guardar em local seco, protegido da luz e em temperatura ambiente. Banheiro e geladeira não são adequados!',
      technical: 'O armazenamento deve ser em condições de 15-30°C, protegido da umidade e luz para manter a estabilidade farmacológica.'
    },
    difficulty: 1,
    topics: ['armazenamento', 'conservação'],
    xpValue: 10,
    userLevel: ['paciente', 'estudante', 'profissional', 'especialista']
  },

  {
    id: 'pac_008',
    type: 'true_false',
    question: 'A pele pode ficar mais escura durante o tratamento?',
    correctAnswer: 'true',
    explanation: {
      correct: 'Sim, é normal! A clofazimina pode causar escurecimento da pele, mas isso é reversível após o término do tratamento.',
      incorrect: 'Na verdade pode sim! A clofazimina causa pigmentação da pele que varia de vermelho a castanho, mas volta ao normal depois do tratamento.',
      technical: 'A clofazimina causa hiperpigmentação cutânea dose-dependente e reversível, variando de vermelho a castanho escuro.'
    },
    difficulty: 1,
    topics: ['clofazimina', 'efeitos_esperados'],
    xpValue: 10,
    userLevel: ['paciente', 'estudante', 'profissional', 'especialista']
  },

  {
    id: 'pac_009',
    type: 'multiple_choice',
    question: 'Com que frequência devo ir à unidade de saúde?',
    options: [
      'Apenas quando terminar o tratamento',
      'A cada 28 dias para dose supervisionada',
      'Somente se tiver problemas',
      'A cada 3 meses'
    ],
    correctAnswer: 'A cada 28 dias para dose supervisionada',
    explanation: {
      correct: 'Isso mesmo! Você deve ir mensalmente (a cada 28 dias) para tomar a dose supervisionada e fazer acompanhamento.',
      incorrect: 'É importante ir mensalmente! A cada 28 dias você precisa tomar a dose supervisionada na unidade de saúde e fazer avaliação.',
      technical: 'O protocolo PQT-U preconiza administração supervisionada mensal com intervalos de 28 dias para monitoramento e adesão.'
    },
    difficulty: 1,
    topics: ['acompanhamento', 'dose_supervisionada'],
    xpValue: 10,
    userLevel: ['paciente', 'estudante', 'profissional', 'especialista']
  },

  {
    id: 'pac_010',
    type: 'true_false',
    question: 'No dia da dose supervisionada, devo tomar também os medicamentos de casa?',
    correctAnswer: 'false',
    explanation: {
      correct: 'Correto! No dia da dose supervisionada na unidade, você NÃO deve tomar os medicamentos autoadministrados de casa.',
      incorrect: 'Não deve tomar! No dia que for na unidade para a dose supervisionada, não tome os medicamentos de casa para evitar dose dupla.',
      technical: 'A dose supervisionada mensal substitui a autoadministração do dia, evitando duplicação de doses e potencial toxicidade.'
    },
    difficulty: 1,
    topics: ['dose_supervisionada', 'administração'],
    xpValue: 10,
    userLevel: ['paciente', 'estudante', 'profissional', 'especialista']
  }
];

// ============================================================================
// QUESTÕES NÍVEL ESTUDANTE (10 questões)
// ============================================================================

const estudanteQuestions: QuizQuestion[] = [
  {
    id: 'est_001',
    type: 'multiple_choice',
    question: 'Qual é o agente etiológico da hanseníase?',
    options: [
      'Mycobacterium tuberculosis',
      'Mycobacterium leprae',
      'Mycobacterium avium',
      'Streptococcus pneumoniae'
    ],
    correctAnswer: 'Mycobacterium leprae',
    explanation: {
      correct: 'Correto! O Mycobacterium leprae é uma micobactéria que causa a hanseníase, também conhecida como bacilo de Hansen.',
      incorrect: 'O agente correto é o Mycobacterium leprae. É importante conhecer o agente causador para entender melhor a doença.',
      technical: 'M. leprae é uma micobactéria álcool-ácido resistente, com crescimento intracelular obrigatório e predileção por células de Schwann.'
    },
    difficulty: 2,
    topics: ['etiologia', 'microbiologia'],
    xpValue: 15,
    userLevel: ['estudante', 'profissional', 'especialista']
  },

  {
    id: 'est_002',
    type: 'multiple_choice',
    question: 'Qual medicamento da PQT-U é responsável pela coloração alaranjada da urina?',
    options: [
      'Dapsona',
      'Clofazimina', 
      'Rifampicina',
      'Todos os medicamentos'
    ],
    correctAnswer: 'Rifampicina',
    explanation: {
      correct: 'Exato! A rifampicina causa pigmentação alaranjada da urina, lágrimas e saliva. É um efeito normal e esperado.',
      incorrect: 'É a rifampicina que causa essa coloração alaranjada. É importante orientar os pacientes que isso é normal.',
      technical: 'A rifampicina é eliminada pelos fluidos corporais, causando pigmentação alaranjada característica e transitória.'
    },
    difficulty: 2,
    topics: ['rifampicina', 'farmacologia'],
    xpValue: 15,
    userLevel: ['estudante', 'profissional', 'especialista']
  },

  {
    id: 'est_003',
    type: 'multiple_choice',
    question: 'Qual a diferença entre dose supervisionada e autoadministrada na PQT-U?',
    options: [
      'Supervisionada é diária, autoadministrada é mensal',
      'Supervisionada é mensal na UBS, autoadministrada é diária em casa',
      'Não há diferença, ambas são iguais',
      'Supervisionada é opcional'
    ],
    correctAnswer: 'Supervisionada é mensal na UBS, autoadministrada é diária em casa',
    explanation: {
      correct: 'Correto! A dose supervisionada é tomada mensalmente na unidade de saúde, enquanto a autoadministrada é diária em casa.',
      incorrect: 'A dose supervisionada é mensal na UBS e a autoadministrada é diária em casa. Essa combinação garante adesão e eficácia.',
      technical: 'O esquema PQT-U combina administração supervisionada mensal para controle da adesão com autoadministração diária para manutenção de níveis terapêuticos.'
    },
    difficulty: 2,
    topics: ['administração', 'protocolo'],
    xpValue: 15,
    userLevel: ['estudante', 'profissional', 'especialista']
  },

  {
    id: 'est_004',
    type: 'true_false',
    question: 'A clofazimina pode causar pigmentação da pele que é irreversível?',
    correctAnswer: 'false',
    explanation: {
      correct: 'Correto! A pigmentação da pele causada pela clofazimina é reversível após o término do tratamento.',
      incorrect: 'A pigmentação da clofazimina é reversível! Pode variar de vermelho a castanho escuro, mas retorna ao normal após o tratamento.',
      technical: 'A hiperpigmentação por clofazimina é dose-dependente e reversível, com resolução gradual após descontinuação do medicamento.'
    },
    difficulty: 2,
    topics: ['clofazimina', 'efeitos_adversos'],
    xpValue: 15,
    userLevel: ['estudante', 'profissional', 'especialista']
  },

  {
    id: 'est_005',
    type: 'multiple_choice',
    question: 'Qual interação medicamentosa importante da rifampicina deve ser orientada?',
    options: [
      'Reduz a eficácia de anticoncepcionais orais',
      'Aumenta o risco de sangramento com aspirina',
      'Potencializa o efeito da insulina',
      'Diminui a absorção de vitaminas'
    ],
    correctAnswer: 'Reduz a eficácia de anticoncepcionais orais',
    explanation: {
      correct: 'Correto! A rifampicina induz enzimas hepáticas e reduz a eficácia dos anticoncepcionais orais. Métodos contraceptivos de barreira devem ser orientados.',
      incorrect: 'A rifampicina reduz a eficácia dos anticoncepcionais orais. É fundamental orientar sobre métodos contraceptivos alternativos.',
      technical: 'A rifampicina é potente indutor do sistema citocromo P450, acelerando o metabolismo de estrógenos e progestágenos.'
    },
    difficulty: 2,
    topics: ['rifampicina', 'interações'],
    xpValue: 15,
    userLevel: ['estudante', 'profissional', 'especialista']
  },

  {
    id: 'est_006',
    type: 'true_false',
    question: 'O suco de laranja diminui a absorção da clofazimina?',
    correctAnswer: 'true',
    explanation: {
      correct: 'Correto! Bebidas ácidas como suco de laranja reduzem significativamente a absorção da clofazimina.',
      incorrect: 'Verdade! O suco de laranja e outras bebidas ácidas diminuem a absorção da clofazimina, comprometendo a eficácia.',
      technical: 'O pH ácido interfere na solubilização e absorção da clofazimina no trato gastrointestinal.'
    },
    difficulty: 2,
    topics: ['clofazimina', 'absorção'],
    xpValue: 15,
    userLevel: ['estudante', 'profissional', 'especialista']
  },

  {
    id: 'est_007',
    type: 'multiple_choice',
    question: 'Qual a composição da dose mensal supervisionada PQT-U para adultos?',
    options: [
      'Rifampicina 300mg + Clofazimina 150mg + Dapsona 50mg',
      'Rifampicina 600mg + Clofazimina 300mg + Dapsona 100mg',
      'Rifampicina 450mg + Clofazimina 200mg + Dapsona 75mg',
      'Apenas Rifampicina 600mg'
    ],
    correctAnswer: 'Rifampicina 600mg + Clofazimina 300mg + Dapsona 100mg',
    explanation: {
      correct: 'Exato! A dose supervisionada adulta contém Rifampicina 600mg, Clofazimina 300mg e Dapsona 100mg.',
      incorrect: 'A composição correta é: Rifampicina 600mg, Clofazimina 300mg e Dapsona 100mg na dose supervisionada.',
      technical: 'Dose supervisionada: 2x Rifampicina 300mg + 3x Clofazimina 100mg + 1x Dapsona 100mg.'
    },
    difficulty: 2,
    topics: ['dosagem', 'protocolo'],
    xpValue: 15,
    userLevel: ['estudante', 'profissional', 'especialista']
  },

  {
    id: 'est_008',
    type: 'true_false',
    question: 'O tratamento PQT-U pode ser prescrito por enfermeiros?',
    correctAnswer: 'true',
    explanation: {
      correct: 'Correto! Médicos e enfermeiros podem prescrever PQT-U, exceto para pacientes menores de 30kg (apenas médicos).',
      incorrect: 'Sim, podem! Enfermeiros capacitados podem prescrever PQT-U, exceto para crianças menores de 30kg.',
      technical: 'Conforme protocolo do Ministério da Saúde, enfermeiros podem prescrever PQT-U para pacientes ≥30kg.'
    },
    difficulty: 2,
    topics: ['prescrição', 'legislação'],
    xpValue: 15,
    userLevel: ['estudante', 'profissional', 'especialista']
  },

  {
    id: 'est_009',
    type: 'multiple_choice',
    question: 'Qual medicamento da PQT-U inibe a RNA polimerase bacteriana?',
    options: [
      'Dapsona',
      'Clofazimina',
      'Rifampicina', 
      'Todos os medicamentos'
    ],
    correctAnswer: 'Rifampicina',
    explanation: {
      correct: 'Correto! A rifampicina inibe a RNA polimerase, bloqueando a síntese de RNA bacteriano.',
      incorrect: 'É a rifampicina que inibe a RNA polimerase. Cada medicamento da PQT-U tem um mecanismo de ação específico.',
      technical: 'A rifampicina se liga à subunidade β da RNA polimerase DNA-dependente, inibindo a transcrição bacteriana.'
    },
    difficulty: 3,
    topics: ['farmacologia', 'mecanismo_ação'],
    xpValue: 20,
    userLevel: ['estudante', 'profissional', 'especialista']
  },

  {
    id: 'est_010',
    type: 'multiple_choice',
    question: 'Qual o mecanismo de ação da dapsona?',
    options: [
      'Inibe síntese de folato',
      'Liga-se ao DNA bacteriano',
      'Bloqueia síntese de RNA',
      'Rompe parede celular'
    ],
    correctAnswer: 'Inibe síntese de folato',
    explanation: {
      correct: 'Correto! A dapsona é antagonista do ácido para-aminobenzóico, interferindo na síntese do folato bacteriano.',
      incorrect: 'A dapsona inibe a síntese de folato. É um mecanismo similar aos antibióticos sulfonamidas.',
      technical: 'A dapsona compete com o PABA (ácido para-aminobenzóico) na síntese de ácido dihidrofólico, essencial para síntese de DNA bacteriano.'
    },
    difficulty: 3,
    topics: ['farmacologia', 'dapsona'],
    xpValue: 20,
    userLevel: ['estudante', 'profissional', 'especialista']
  }
];

// ============================================================================
// QUESTÕES NÍVEL PROFISSIONAL (5 questões)
// ============================================================================

const profissionalQuestions: QuizQuestion[] = [
  {
    id: 'prof_001',
    type: 'multiple_choice',
    question: 'Qual reação adversa grave da rifampicina requer interrupção imediata?',
    options: [
      'Urina alaranjada',
      'Hepatotoxicidade com icterícia',
      'Náusea leve',
      'Sudorese'
    ],
    correctAnswer: 'Hepatotoxicidade com icterícia',
    explanation: {
      correct: 'Correto! Hepatotoxicidade com icterícia é uma reação adversa grave que exige interrupção imediata da rifampicina.',
      incorrect: 'A hepatotoxicidade com icterícia é a reação grave que requer interrupção. Urina alaranjada é normal.',
      technical: 'Hepatotoxicidade grave (AST/ALT >5x normal + icterícia) requer suspensão imediata e avaliação hepatológica.'
    },
    difficulty: 3,
    topics: ['rifampicina', 'reações_graves'],
    xpValue: 25,
    userLevel: ['profissional', 'especialista']
  },

  {
    id: 'prof_002',
    type: 'true_false',
    question: 'A anemia hemolítica é uma reação adversa possível da dapsona?',
    correctAnswer: 'true',
    explanation: {
      correct: 'Correto! A dapsona pode causar anemia hemolítica, especialmente em pacientes com deficiência de G6PD.',
      incorrect: 'Sim! A anemia hemolítica é uma reação adversa importante da dapsona, requerendo monitoramento do hemograma.',
      technical: 'A dapsona causa anemia hemolítica dose-dependente, mais frequente em portadores de deficiência de glicose-6-fosfato desidrogenase.'
    },
    difficulty: 3,
    topics: ['dapsona', 'hematologia'],
    xpValue: 25,
    userLevel: ['profissional', 'especialista']
  },

  {
    id: 'prof_003',
    type: 'multiple_choice',
    question: 'Em gestantes, qual cuidado especial com rifampicina no final da gravidez?',
    options: [
      'Suspender o medicamento',
      'Reduzir a dose pela metade',
      'Orientar uso de vitamina K',
      'Aumentar intervalo entre doses'
    ],
    correctAnswer: 'Orientar uso de vitamina K',
    explanation: {
      correct: 'Correto! A vitamina K deve ser orientada no final da gravidez pois a rifampicina pode causar hemorragia.',
      incorrect: 'O correto é orientar vitamina K no final da gravidez. A rifampicina pode interferir na coagulação.',
      technical: 'A rifampicina induz enzimas hepáticas que aceleram o metabolismo da vitamina K, aumentando risco de hemorragia perinatal.'
    },
    difficulty: 3,
    topics: ['gestação', 'rifampicina'],
    xpValue: 25,
    userLevel: ['profissional', 'especialista']
  },

  {
    id: 'prof_004',
    type: 'multiple_choice',
    question: 'Qual a conduta para paciente < 30kg que precisa PQT-U?',
    options: [
      'Prescrição apenas por médico',
      'Usar esquema adulto reduzido',
      'Contraindicar o tratamento',
      'Aguardar atingir 30kg'
    ],
    correctAnswer: 'Prescrição apenas por médico',
    explanation: {
      correct: 'Correto! Para pacientes < 30kg, apenas médicos podem prescrever, com dosagem baseada em peso corporal.',
      incorrect: 'Para crianças < 30kg, somente médicos podem prescrever. A dosagem é calculada pelo peso (mg/kg).',
      technical: 'Pacientes < 30kg requerem cálculo de dose por peso: Rifampicina 10mg/kg, Clofazimina 6mg/kg, Dapsona 2mg/kg.'
    },
    difficulty: 3,
    topics: ['pediatria', 'prescrição'],
    xpValue: 25,
    userLevel: ['profissional', 'especialista']
  },

  {
    id: 'prof_005',
    type: 'true_false',
    question: 'A clofazimina em lactantes pode causar pigmentação no bebê?',
    correctAnswer: 'true',
    explanation: {
      correct: 'Correto! A clofazimina passa para o leite materno e pode causar pigmentação transitória na pele do bebê.',
      incorrect: 'Sim! A clofazimina pode causar pigmentação temporária no bebê através do aleitamento materno.',
      technical: 'A clofazimina é excretada no leite materno causando hiperpigmentação cutânea transitória no lactente.'
    },
    difficulty: 3,
    topics: ['lactação', 'clofazimina'],
    xpValue: 25,
    userLevel: ['profissional', 'especialista']
  }
];

// ============================================================================
// QUIZ ARRAYS E EXPORTS
// ============================================================================

export const hanseniaseQuizzes: EducationalQuiz[] = [
  {
    id: 'hanseniase_paciente',
    title: 'Conhecimentos Básicos sobre Hanseníase',
    description: 'Quiz fundamental para pacientes sobre tratamento PQT-U',
    difficulty: 'paciente',
    timeLimit: 600, // 10 minutos
    questions: pacienteQuestions,
    moduleId: 'hanseniase_fundamentals',
    topics: ['duração_tratamento', 'medicamentos', 'administração', 'efeitos_normais']
  },
  {
    id: 'hanseniase_estudante', 
    title: 'Farmacologia e Protocolos da Hanseníase',
    description: 'Quiz sobre mecanismos de ação e protocolos terapêuticos',
    difficulty: 'estudante',
    timeLimit: 900, // 15 minutos
    questions: estudanteQuestions,
    moduleId: 'pqtu_protocols',
    topics: ['farmacologia', 'protocolos', 'interações', 'mecanismos']
  },
  {
    id: 'hanseniase_profissional',
    title: 'Manejo Clínico Avançado da Hanseníase', 
    description: 'Quiz sobre reações adversas e populações especiais',
    difficulty: 'profissional',
    timeLimit: 1200, // 20 minutos
    questions: profissionalQuestions,
    moduleId: 'adverse_effects',
    topics: ['reações_adversas', 'populações_especiais', 'monitoramento']
  }
];

/**
 * Busca quiz por nível do usuário
 */
export function getQuizByUserLevel(userLevel: UserLevel): EducationalQuiz | null {
  return hanseniaseQuizzes.find(quiz => quiz.difficulty === userLevel) || null;
}

/**
 * Busca quiz por ID
 */
export function getQuizById(quizId: string): EducationalQuiz | null {
  return hanseniaseQuizzes.find(quiz => quiz.id === quizId) || null;
}