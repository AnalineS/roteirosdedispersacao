/**
 * 5 Casos Clínicos para Simulador
 * Baseados na tese de doutorado e hanseniase_catalog.json
 * Doutorando: Nélio Gomes de Moura Júnior
 */

import { ClinicalCase } from '@/types/clinicalCases';

export const CLINICAL_CASES: ClinicalCase[] = [
  // CASO 1: Pediatrico Básico - Criança 8 anos, 25kg
  {
    id: 'caso_001_pediatrico_basico',
    title: 'Criança de 8 anos - Primeira dispensação PQT-U',
    difficulty: 'básico',
    estimatedTime: 15,
    category: 'pediatrico',
    tags: ['pediatria', 'primeira-dispensacao', 'calculo-dose', 'orientacao-familia'],
    
    patient: {
      name: 'Ana Júlia Santos',
      age: 8,
      weight: 25,
      gender: 'feminino',
      
      clinicalPresentation: {
        type: 'paucibacilar',
        lesions: ['Mácula hipocrômica em face', 'Placa eritematosa no braço direito'],
        neurologicalSigns: ['Hipoestesia na lesão do braço'],
        bacilloscopy: 'Negativa',
        biopsy: 'Hanseníase tuberculóide'
      },
      
      medicalHistory: {
        allergies: [],
        currentMedications: [],
        comorbidities: [],
        specialConditions: ['g6pd_deficiency'],
        previousTreatments: []
      },
      
      socialContext: {
        livingConditions: 'Mora com pais e irmão mais novo',
        adherenceFactors: ['Apoio familiar forte', 'Escola próxima à UBS'],
        supportSystem: ['Mãe dedicada', 'Avó presente', 'Professora informada'],
        economicStatus: 'baixa',
        educationLevel: 'fundamental'
      }
    },
    
    scenario: {
      presentation: 'Mãe chega à farmácia com prescrição médica de PQT-U para filha de 8 anos, 25kg. É a primeira vez que a família lida com hanseníase. A mãe está ansiosa e com muitas dúvidas sobre o tratamento e possível contágio.',
      
      prescriptionDetails: {
        prescribed: true,
        prescriber: 'medico',
        prescriptionType: 'pediatrico_under_30kg',
        prescriptionDate: new Date(),
        validityPeriod: 30
      },
      
      clinicalNotes: [
        'Diagnóstico recente - família em adaptação',
        'Criança cooperativa, sem medo de medicamentos',
        'Mãe ansiosa sobre contágio para filho menor'
      ],
      
      warningFlags: [
        {
          type: 'special_monitoring',
          description: 'Criança < 30kg - prescrição só por médico, dose calculada por peso',
          severity: 'high'
        },
        {
          type: 'special_monitoring',
          description: 'Verificar deficiência G6PD antes de iniciar dapsona (contraindicação absoluta)',
          severity: 'critical'
        }
      ]
    },
    
    learningObjectives: [
      'Calcular doses pediátricas por peso corporal',
      'Identificar necessidade de prescrição médica para < 30kg',
      'Orientar família sobre administração em criança',
      'Desmistificar conceitos errôneos sobre hanseníase',
      'Estabelecer vínculo terapêutico com criança e família'
    ],
    
    steps: [
      {
        id: 'step_001',
        stepNumber: 1,
        title: 'Verificação da Prescrição Pediátrica',
        type: 'assessment',
        phase: 'avaliacao_inicial',
        description: 'Analise a prescrição para criança de 8 anos, 25kg',
        instruction: 'Verifique os itens obrigatórios para prescrição pediátrica < 30kg',
        
        interaction: {
          type: 'checklist',
          checklistItems: [
            {
              id: 'prescriber_check',
              text: 'Prescritor é médico (obrigatório para < 30kg)',
              required: true,
              category: 'prescricao',
              points: 20
            },
            {
              id: 'weight_confirmation',
              text: 'Peso corporal anotado na prescrição',
              required: true,
              category: 'dosagem',
              points: 15
            },
            {
              id: 'two_copies',
              text: 'Prescrição em duas vias',
              required: true,
              category: 'documentacao',
              points: 10
            },
            {
              id: 'legible',
              text: 'Prescrição legível e completa',
              required: true,
              category: 'qualidade',
              points: 10
            },
            {
              id: 'date_valid',
              text: 'Data da prescrição dentro do prazo',
              required: true,
              category: 'validade',
              points: 10
            },
            {
              id: 'g6pd_screening',
              text: 'Verificou ausência de deficiência G6PD (contraindicação para dapsona)',
              required: true,
              category: 'seguranca',
              points: 15
            }
          ]
        },
        
        validation: {
          correctAnswer: ['prescriber_check', 'weight_confirmation', 'two_copies', 'legible', 'date_valid', 'g6pd_screening'],
          points: 80,
          passingScore: 80,
          
          feedback: {
            correct: {
              message: '✅ Excelente! Verificação da prescrição pediátrica completa.',
              explanation: 'Para crianças < 30kg, a prescrição deve ser exclusivamente médica, com peso documentado para cálculo correto das doses.',
              nextStepGuidance: 'Agora vamos calcular as doses baseadas no peso da criança.'
            },
            incorrect: {
              message: '⚠️ Atenção! Alguns itens importantes não foram verificados.',
              explanation: 'A prescrição pediátrica tem requisitos específicos de segurança.',
              improvementSuggestions: [
                'Sempre confirme que prescritor é médico para < 30kg',
                'Peso deve estar claramente documentado',
                'Documentação deve estar completa'
              ]
            },
            partial: {
              message: '👍 Bom trabalho, mas pode melhorar.',
              explanation: 'Você identificou pontos importantes, mas alguns itens críticos foram perdidos.',
              additionalResources: ['Protocolo PCDT Hanseníase - Seção Pediátrica']
            }
          },
          
          clinicalRationale: 'Crianças < 30kg requerem cálculo individual de dose baseado no peso (mg/kg), sendo obrigatória a prescrição médica devido à complexidade posológica e maior risco de efeitos adversos.',
          safetyConsiderations: [
            'Doses calculadas por peso previnem sub ou superdosagem',
            'Prescrição médica garante avaliação clínica adequada',
            'Documentação completa permite rastreabilidade'
          ]
        },
        
        educationalNotes: [
          'Crianças < 30kg: Rifampicina 10mg/kg, Clofazimina 6mg/kg, Dapsona 2mg/kg',
          'Para 25kg: Rifampicina 250mg, Clofazimina 150mg, Dapsona 50mg (mensal supervisionada)',
          'Doses diárias: Clofazimina 25mg, Dapsona 50mg'
        ],
        references: ['PCDT Hanseníase 2022 - Tabela Pediátrica']
      },
      
      {
        id: 'step_002',
        stepNumber: 2,
        title: 'Cálculo de Doses Pediátricas',
        type: 'calculation',
        phase: 'avaliacao_inicial',
        description: 'Calcule as doses corretas para Ana Júlia (8 anos, 25kg)',
        instruction: 'Utilize as fórmulas: Rifampicina 10mg/kg, Clofazimina 6mg/kg, Dapsona 2mg/kg',
        
        interaction: {
          type: 'calculation',
          calculationParameters: {
            inputFields: [
              {
                name: 'rifampicina_dose',
                label: 'Dose mensal supervisionada de Rifampicina',
                type: 'number',
                unit: 'mg',
                validation: { required: true, min: 200, max: 300 }
              },
              {
                name: 'clofazimina_monthly',
                label: 'Dose mensal supervisionada de Clofazimina',
                type: 'number', 
                unit: 'mg',
                validation: { required: true, min: 100, max: 200 }
              },
              {
                name: 'dapsona_monthly',
                label: 'Dose mensal supervisionada de Dapsona',
                type: 'number',
                unit: 'mg', 
                validation: { required: true, min: 40, max: 60 }
              },
              {
                name: 'clofazimina_daily',
                label: 'Dose diária autoadministrada de Clofazimina',
                type: 'number',
                unit: 'mg',
                validation: { required: true, min: 20, max: 30 }
              },
              {
                name: 'dapsona_daily',
                label: 'Dose diária autoadministrada de Dapsona',
                type: 'number',
                unit: 'mg',
                validation: { required: true, min: 40, max: 60 }
              }
            ],
            expectedResult: {
              rifampicina_dose: 250,
              clofazimina_monthly: 150,
              dapsona_monthly: 50,
              clofazimina_daily: 25,
              dapsona_daily: 50
            },
            tolerance: 10
          }
        },
        
        validation: {
          correctAnswer: {
            rifampicina_dose: 250,
            clofazimina_monthly: 150, 
            dapsona_monthly: 50,
            clofazimina_daily: 25,
            dapsona_daily: 50
          },
          points: 100,
          passingScore: 80,
          
          feedback: {
            correct: {
              message: '🎯 Perfeito! Doses calculadas corretamente.',
              explanation: 'Para 25kg: Rifampicina 250mg (10mg/kg), Clofazimina 150mg mensal + 25mg diária, Dapsona 50mg mensal e diária.',
              nextStepGuidance: 'Agora vamos orientar a família sobre administração.'
            },
            incorrect: {
              message: '❌ Doses incorretas. Revise os cálculos.',
              explanation: 'O cálculo por peso é fundamental para segurança pediátrica.',
              improvementSuggestions: [
                'Rifampicina: peso × 10mg/kg = 25 × 10 = 250mg',
                'Clofazimina mensal: peso × 6mg/kg = 25 × 6 = 150mg',
                'Sempre confira os cálculos duas vezes'
              ]
            },
            partial: {
              message: '⚡ Quase lá! Alguns cálculos precisam de ajuste.',
              explanation: 'Você está no caminho certo, mas revise as fórmulas.',
              additionalResources: ['Tabela de Cálculos Pediátricos PQT-U']
            }
          },
          
          clinicalRationale: 'O cálculo preciso por peso corporal em crianças é essencial para eficácia terapêutica e prevenção de toxicidade, especialmente considerando o desenvolvimento de órgãos e sistemas em crescimento.',
          safetyConsiderations: [
            'Subdosagem pode levar à resistência bacteriana',
            'Superdosagem aumenta risco de hepatotoxicidade e outros efeitos adversos',
            'Monitoramento de crescimento durante tratamento é importante'
          ]
        },
        
        educationalNotes: [
          'Fórmulas pediátricas: RIF 10mg/kg, CLO 6mg/kg mensal + 1mg/kg diária, DAP 2mg/kg',
          'Para facilitar: use apresentações disponíveis próximas ao cálculo',
          'Dose máxima de dapsona: 50mg/dia mesmo se cálculo der mais'
        ],
        references: ['PCDT Hanseníase 2022', 'Tese - Capítulo Pediatria']
      },
      
      {
        id: 'step_003',
        stepNumber: 3,
        title: 'Orientações para a Família',
        type: 'counseling',
        phase: 'orientacoes_cuidado',
        description: 'A mãe está ansiosa e pergunta: "Meu outro filho pode pegar? Como dar o remédio? Ela vai ficar com a pele escura?"',
        instruction: 'Forneça orientações tranquilizadoras e educativas apropriadas para família',
        
        interaction: {
          type: 'multiple_choice',
          options: [
            {
              id: 'option_a',
              text: 'A hanseníase não é contagiosa após iniciar tratamento. Os medicamentos devem ser dados à noite, após jantar. A coloração da pele é temporária.',
              isCorrect: true,
              explanation: 'Resposta completa e tranquilizadora, abordando as principais preocupações.',
              consequences: 'Família fica mais calma e confiante no tratamento.'
            },
            {
              id: 'option_b', 
              text: 'É melhor não falar muito sobre contágio para não assustar. Dê os medicamentos quando lembrar.',
              isCorrect: false,
              explanation: 'Evitar informações importantes gera mais ansiedade e prejudica adesão.',
              consequences: 'Família permanece ansiosa e pode ter problemas de adesão.'
            },
            {
              id: 'option_c',
              text: 'A doença é contagiosa sim, mantenha isolamento. Os medicamentos causam muitos efeitos colaterais.',
              isCorrect: false,
              explanation: 'Informações incorretas que geram estigma e medo desnecessário.',
              consequences: 'Família pode abandonar tratamento por medo.'
            },
            {
              id: 'option_d',
              text: 'Explique sobre transmissão, administração correta e efeitos esperados, mas foque nas informações científicas.',
              isCorrect: false,
              explanation: 'Muito técnico para criança e família ansiosa, falta empatia.',
              consequences: 'Família não compreende completamente as orientações.'
            }
          ]
        },
        
        validation: {
          correctAnswer: 'option_a',
          points: 80,
          passingScore: 70,
          
          feedback: {
            correct: {
              message: '👏 Excelente comunicação terapêutica!',
              explanation: 'Você abordou as preocupações com informações corretas, linguagem acessível e tom tranquilizador.',
              nextStepGuidance: 'Agora vamos revisar as orientações sobre administração prática.'
            },
            incorrect: {
              message: '🤔 A comunicação pode ser melhorada.',
              explanation: 'Famílias ansiosas precisam de informações claras, corretas e tranquilizadoras.',
              improvementSuggestions: [
                'Sempre esclareça que não há contágio após iniciar tratamento',
                'Explique horários e formas de administração',
                'Tranquilize sobre efeitos esperados vs. preocupantes'
              ]
            },
            partial: {
              message: '👍 Boa direção, mas pode aprimorar.',
              explanation: 'Você tocou em pontos importantes, mas a abordagem pode ser mais completa.',
              additionalResources: ['Guia de Comunicação em Saúde - Hanseníase']
            }
          },
          
          clinicalRationale: 'A comunicação efetiva com famílias pediátricas é fundamental para adesão ao tratamento, redução do estigma e bem-estar psicológico da criança e família.',
          safetyConsiderations: [
            'Informações incorretas podem levar ao abandono do tratamento',
            'Estigma pode afetar desenvolvimento social da criança',
            'Família ansiosa pode transmitir medo para criança'
          ]
        },
        
        educationalNotes: [
          'Após iniciar PQT-U, paciente não transmite mais a doença',
          'Coloração da pele pela clofazimina é reversível',
          'Administração noturna reduz desconfortos gastrointestinais'
        ],
        references: ['Manual do Paciente - Hanseníase', 'Tese - Orientação Familiar']
      }
    ],
    
    assessment: {
      totalPoints: 260,
      passingScore: 208, // 80%
      
      categories: [
        {
          name: 'Verificação de Prescrição',
          weight: 0.3,
          maxPoints: 80,
          criteria: [
            'Identificou necessidade de prescrição médica',
            'Verificou documentação completa',
            'Validou aspectos de segurança'
          ]
        },
        {
          name: 'Cálculos Pediátricos',
          weight: 0.4,
          maxPoints: 100,
          criteria: [
            'Aplicou fórmulas corretas por peso',
            'Calculou doses supervisionadas precisamente',
            'Determinou doses diárias adequadas'
          ]
        },
        {
          name: 'Orientação Familiar',
          weight: 0.3,
          maxPoints: 80,
          criteria: [
            'Comunicou informações corretas',
            'Usou linguagem acessível',
            'Demonstrou empatia e acolhimento'
          ]
        }
      ],
      
      timeLimit: 15,
      attemptsAllowed: 3,
      
      certificationCriteria: {
        minimumScore: 208,
        requiredSteps: ['step_001', 'step_002', 'step_003'],
        timeRequirement: 15
      }
    },
    
    references: [
      {
        type: 'protocolo_nacional',
        title: 'Protocolo Clínico e Diretrizes Terapêuticas - Hanseníase',
        source: 'Ministério da Saúde',
        section: 'Esquemas Terapêuticos Pediátricos',
        relevance: 'primary'
      },
      {
        type: 'tese_doutorado',
        title: 'Roteiro de Dispensação PQT-U',
        source: 'Nélio Gomes de Moura Júnior',
        section: 'Casos Pediátricos',
        relevance: 'primary'
      }
    ],
    
    qualityMetrics: {
      educationalValue: 5,
      clinicalRealism: 5,
      difficultyAlignment: 5,
      feedbackQuality: 5
    }
  },

  // CASO 2: Adulto Standard - Trabalhador rural, primeira dispensação
  {
    id: 'caso_002_adulto_standard',
    title: 'Trabalhador rural - Esquema PQT-U Adulto',
    difficulty: 'intermediário',
    estimatedTime: 20,
    category: 'adulto',
    tags: ['adulto', 'primeira-dispensacao', 'trabalhador-rural', 'adesao'],
    
    patient: {
      name: 'João Silva',
      age: 45,
      weight: 70,
      gender: 'masculino',
      
      clinicalPresentation: {
        type: 'multibacilar',
        lesions: ['Múltiplas placas eritematosas infiltradas', 'Nódulos em face'],
        neurologicalSigns: ['Espessamento neural cubital bilateral', 'Perda sensitiva nas mãos'],
        bacilloscopy: 'Positiva - IB 3+',
        biopsy: 'Hanseníase virchowiana'
      },
      
      medicalHistory: {
        allergies: [],
        currentMedications: ['Dipirona ocasional para dores'],
        comorbidities: ['Hipertensão arterial leve'],
        specialConditions: [],
        previousTreatments: []
      },
      
      socialContext: {
        livingConditions: 'Zona rural, casa própria, família grande',
        adherenceFactors: ['Trabalha longe de casa', 'Horários irregulares'],
        supportSystem: ['Esposa', 'Filhos adultos', 'Agente comunitária ativa'],
        economicStatus: 'baixa',
        educationLevel: 'fundamental'
      }
    },
    
    scenario: {
      presentation: 'João, trabalhador rural de 45 anos, chega para primeira dispensação de PQT-U. Diagnóstico recente de hanseníase multibacilar. Demonstra preocupação com trabalho e família. Pergunta se pode continuar trabalhando e se família precisa se tratar.',
      
      prescriptionDetails: {
        prescribed: true,
        prescriber: 'medico',
        prescriptionType: 'pqt_u_adulto',
        prescriptionDate: new Date(),
        validityPeriod: 30
      },
      
      clinicalNotes: [
        'Paciente com carga bacilar alta (IB 3+)',
        'Comprometimento neural moderado',
        'Ansiedade sobre impacto socioeconômico'
      ],
      
      warningFlags: [
        {
          type: 'special_monitoring',
          description: 'Alta carga bacilar - monitorar adesão rigorosamente',
          severity: 'medium'
        }
      ]
    },
    
    learningObjectives: [
      'Aplicar esquema PQT-U padrão para adultos',
      'Orientar sobre cronograma de 12 meses para MB',
      'Abordar questões trabalhistas e sociais',
      'Estabelecer estratégias de adesão para zona rural',
      'Orientar sobre transmissibilidade e cuidados familiares'
    ],
    
    steps: [
      {
        id: 'step_001',
        stepNumber: 1,
        title: 'Verificação e Dispensação PQT-U Adulto',
        type: 'assessment',
        phase: 'avaliacao_inicial',
        description: 'João tem 45 anos, 70kg, diagnóstico de hanseníase multibacilar. Verifique prescrição e dispense medicação.',
        instruction: 'Confirme esquema PQT-U adulto e realize dispensação para primeiro mês',
        
        interaction: {
          type: 'checklist',
          checklistItems: [
            {
              id: 'prescription_valid',
              text: 'Prescrição médica válida e legível',
              required: true,
              category: 'documentacao',
              points: 10
            },
            {
              id: 'adult_scheme',
              text: 'Confirmado esquema PQT-U adulto (>50kg)',
              required: true,
              category: 'dosagem',
              points: 15
            },
            {
              id: 'multibacilar_duration',
              text: 'Orientado sobre duração de 12 meses (multibacilar)',
              required: true,
              category: 'tratamento',
              points: 15
            },
            {
              id: 'monthly_supervised',
              text: 'Dose supervisionada mensal agendada',
              required: true,
              category: 'seguimento',
              points: 15
            },
            {
              id: 'medication_count',
              text: 'Quantidade correta para 1 mês dispensada',
              required: true,
              category: 'dispensacao',
              points: 10
            },
            {
              id: 'storage_orientation',
              text: 'Orientações de armazenamento fornecidas',
              required: true,
              category: 'orientacao',
              points: 10
            }
          ]
        },
        
        validation: {
          correctAnswer: ['prescription_valid', 'adult_scheme', 'multibacilar_duration', 'monthly_supervised', 'medication_count', 'storage_orientation'],
          points: 75,
          passingScore: 60,
          
          feedback: {
            correct: {
              message: '✅ Dispensação realizada corretamente!',
              explanation: 'Você seguiu todos os protocolos para dispensação de PQT-U adulto multibacilar.',
              nextStepGuidance: 'Agora vamos abordar as orientações específicas sobre administração.'
            },
            incorrect: {
              message: '⚠️ Alguns protocolos importantes não foram seguidos.',
              explanation: 'A dispensação de PQT-U requer seguir rigorosamente os protocolos de segurança.',
              improvementSuggestions: [
                'Para MB: sempre orientar sobre 12 meses de tratamento',
                'Dose supervisionada mensal é obrigatória',
                'Confirmar esquema adulto baseado no peso'
              ]
            },
            partial: {
              message: '👍 Bom trabalho, mas pode melhorar.',
              explanation: 'Você cumpriu pontos importantes, mas alguns aspectos críticos foram perdidos.',
              additionalResources: ['Protocolo de Dispensação PQT-U']
            }
          },
          
          clinicalRationale: 'Para hanseníase multibacilar com alta carga bacilar (IB 3+), o tratamento de 12 meses com esquema PQT-U adulto é essencial para evitar resistência e garantir cura bacteriológica.',
          safetyConsiderations: [
            'MB requer 12 meses vs. 6 meses para PB',
            'Dose supervisionada garante adesão em casos de alta carga bacilar',
            'Orientações corretas previnem abandono do tratamento'
          ]
        },
        
        educationalNotes: [
          'PQT-U Adulto: RIF 600mg + CLO 300mg + DAP 100mg (mensal)',
          'Autoadministradas diárias: CLO 50mg + DAP 100mg',
          'Multibacilar = 12 meses; Paucibacilar = 6 meses'
        ],
        references: ['PCDT Hanseníase 2022 - Esquema Adulto']
      }
    ],
    
    assessment: {
      totalPoints: 75,
      passingScore: 60,
      
      categories: [
        {
          name: 'Protocolo de Dispensação',
          weight: 1.0,
          maxPoints: 75,
          criteria: [
            'Seguiu protocolo PQT-U adulto corretamente',
            'Orientou sobre duração MB (12 meses)',
            'Agendou seguimento mensal adequadamente'
          ]
        }
      ],
      
      timeLimit: 20,
      attemptsAllowed: 3,
      
      certificationCriteria: {
        minimumScore: 60,
        requiredSteps: ['step_001'],
        timeRequirement: 20
      }
    },
    
    references: [
      {
        type: 'protocolo_nacional',
        title: 'PCDT Hanseníase - Esquema Adulto',
        source: 'Ministério da Saúde',
        section: 'Poliquimioterapia Única',
        relevance: 'primary'
      }
    ],
    
    qualityMetrics: {
      educationalValue: 4,
      clinicalRealism: 5,
      difficultyAlignment: 4,
      feedbackQuality: 4
    }
  },

  // CASO 3: Gravidez/Lactação - Situação especial
  {
    id: 'caso_003_gravidez_lactacao',
    title: 'Gestante com Hanseníase - Cuidados Especiais',
    difficulty: 'avançado',
    estimatedTime: 25,
    category: 'gravidez',
    tags: ['gestante', 'lactacao', 'teratogenicidade', 'monitoramento-especial'],
    
    patient: {
      name: 'Maria Santos',
      age: 28,
      weight: 65,
      gender: 'feminino',
      
      clinicalPresentation: {
        type: 'multibacilar',
        lesions: ['Placas eritematosas em braços', 'Nódulos faciais discretos'],
        neurologicalSigns: ['Espessamento neural fibular', 'Hipoestesia plantar'],
        bacilloscopy: 'Positiva - IB 2+',
        biopsy: 'Hanseníase borderline'
      },
      
      medicalHistory: {
        allergies: [],
        currentMedications: ['Ácido fólico', 'Sulfato ferroso'],
        comorbidities: [],
        specialConditions: ['gravidez', 'amamentacao'],
        previousTreatments: []
      },
      
      socialContext: {
        livingConditions: 'Cidade, casa própria, marido presente',
        adherenceFactors: ['Preocupação com bebê', 'Náuseas matinais'],
        supportSystem: ['Marido', 'Mãe', 'Cunhada (enfermeira)'],
        economicStatus: 'media',
        educationLevel: 'medio'
      }
    },
    
    scenario: {
      presentation: 'Maria, gestante de 28 anos (20 semanas), diagnóstico recente de hanseníase multibacilar. Muito preocupada com possíveis efeitos no bebê. Pergunta se pode amamentar, se o bebê vai nascer com hanseníase e se os medicamentos são seguros.',
      
      prescriptionDetails: {
        prescribed: true,
        prescriber: 'medico',
        prescriptionType: 'pqt_u_adulto',
        prescriptionDate: new Date(),
        validityPeriod: 30
      },
      
      clinicalNotes: [
        'Gestação de baixo risco - acompanhamento pré-natal regular',
        'Diagnóstico no segundo trimestre - momento adequado para iniciar',
        'Ansiedade materna sobre efeitos fetais'
      ],
      
      warningFlags: [
        {
          type: 'special_monitoring',
          description: 'Gestante - ajustes na medicação e monitoramento intensivo',
          severity: 'high'
        },
        {
          type: 'interaction',
          description: 'Clofazimina atravessa placenta - monitorar coloração fetal',
          severity: 'medium'
        }
      ]
    },
    
    learningObjectives: [
      'Aplicar PQT-U modificada para gestantes',
      'Orientar sobre segurança dos medicamentos na gravidez',
      'Abordar questões sobre transmissão materno-fetal',
      'Planejar acompanhamento conjunto obstetrícia-dermatologia',
      'Orientar sobre amamentação e cuidados com recém-nascido'
    ],
    
    steps: [
      {
        id: 'step_001',
        stepNumber: 1,
        title: 'Avaliação de Risco Gestacional',
        type: 'assessment',
        phase: 'avaliacao_inicial',
        description: 'Maria está na 20ª semana de gestação. Avalie riscos e benefícios do tratamento.',
        instruction: 'Analise os fatores especiais para tratamento de hanseníase na gravidez',
        
        interaction: {
          type: 'multiple_choice',
          options: [
            {
              id: 'option_a',
              text: 'Adiar tratamento até após o parto para evitar riscos ao feto',
              isCorrect: false,
              explanation: 'Adiamento pode levar à progressão da doença e maior risco materno-fetal.',
              consequences: 'Progressão da hanseníase durante gravidez'
            },
            {
              id: 'option_b',
              text: 'Iniciar PQT-U padrão sem modificações pois é segura na gravidez',
              isCorrect: false,
              explanation: 'Clofazimina requer monitoramento especial na gravidez.',
              consequences: 'Falta de monitoramento adequado'
            },
            {
              id: 'option_c',
              text: 'Iniciar tratamento imediatamente com PQT-U, considerando que benefícios superam riscos, mas com monitoramento intensivo',
              isCorrect: true,
              explanation: 'Tratamento precoce previne progressão e complicações materno-fetais.',
              consequences: 'Controle adequado da doença com segurança fetal'
            },
            {
              id: 'option_d',
              text: 'Usar apenas Rifampicina para reduzir riscos ao feto',
              isCorrect: false,
              explanation: 'Monoterapia leva à resistência bacteriana - inadequado para MB.',
              consequences: 'Alto risco de resistência e falha terapêutica'
            }
          ]
        },
        
        validation: {
          correctAnswer: 'option_c',
          points: 80,
          passingScore: 70,
          
          feedback: {
            correct: {
              message: '🎯 Excelente avaliação de risco-benefício!',
              explanation: 'O tratamento da hanseníase na gravidez é essencial, com PQT-U sendo segura sob monitoramento.',
              nextStepGuidance: 'Agora vamos abordar as modificações específicas do esquema.'
            },
            incorrect: {
              message: '⚠️ A abordagem precisa ser revista.',
              explanation: 'Hanseníase na gravidez requer tratamento imediato com precauções específicas.',
              improvementSuggestions: [
                'Hanseníase não tratada pode causar aborto, parto prematuro',
                'PQT-U é considerada segura na gravidez',
                'Monitoramento conjunto é essencial'
              ]
            },
            partial: {
              message: '👍 Direção correta, mas pode aprimorar.',
              explanation: 'Você entende a necessidade de tratamento, mas faltam detalhes específicos.',
              additionalResources: ['Protocolo Hanseníase e Gravidez - MS']
            }
          },
          
          clinicalRationale: 'Hanseníase não tratada na gravidez pode causar aborto espontâneo, parto prematuro e baixo peso ao nascer. A transmissão não é transplacentária, mas o tratamento materno protege o recém-nascido.',
          safetyConsiderations: [
            'Clofazimina atravessa placenta mas não é teratogênica',
            'Coloração fetal é reversível',
            'Monitoramento obstétrico é essencial'
          ]
        },
        
        educationalNotes: [
          'Hanseníase não é transmitida pela placenta ou leite materno',
          'PQT-U é segura na gravidez e amamentação',
          'Clofazimina pode causar coloração temporária no bebê'
        ],
        references: ['PCDT Hanseníase - Situações Especiais']
      },
      
      {
        id: 'step_002',
        stepNumber: 2,
        title: 'Orientações sobre Segurança Materno-Fetal',
        type: 'counseling',
        phase: 'orientacoes_cuidado',
        description: 'Maria pergunta: "Meu bebê vai nascer com hanseníase? Posso amamentar? Os remédios fazem mal?"',
        instruction: 'Forneça orientações científicas e tranquilizadoras sobre hanseníase na gravidez',
        
        interaction: {
          type: 'checklist',
          checklistItems: [
            {
              id: 'transmission_clarification',
              text: 'Esclareceu que hanseníase não é transmitida pela placenta',
              required: true,
              category: 'informacao',
              points: 20
            },
            {
              id: 'breastfeeding_safety',
              text: 'Confirmou segurança da amamentação durante tratamento',
              required: true,
              category: 'amamentacao',
              points: 20
            },
            {
              id: 'medication_safety',
              text: 'Explicou segurança dos medicamentos PQT-U na gravidez',
              required: true,
              category: 'medicamento',
              points: 20
            },
            {
              id: 'skin_discoloration',
              text: 'Orientou sobre coloração temporária pela clofazimina',
              required: true,
              category: 'efeito_esperado',
              points: 15
            },
            {
              id: 'monitoring_plan',
              text: 'Estabeleceu plano de acompanhamento conjunto',
              required: true,
              category: 'seguimento',
              points: 15
            },
            {
              id: 'newborn_care',
              text: 'Orientou sobre cuidados com recém-nascido',
              required: true,
              category: 'cuidado_infantil',
              points: 10
            }
          ]
        },
        
        validation: {
          correctAnswer: ['transmission_clarification', 'breastfeeding_safety', 'medication_safety', 'skin_discoloration', 'monitoring_plan', 'newborn_care'],
          points: 100,
          passingScore: 80,
          
          feedback: {
            correct: {
              message: '👏 Orientação completa e tranquilizadora!',
              explanation: 'Você abordou todas as preocupações maternas com informações científicas corretas.',
              nextStepGuidance: 'Vamos finalizar com o plano de tratamento específico.'
            },
            incorrect: {
              message: '🤔 Algumas orientações importantes foram perdidas.',
              explanation: 'Gestantes precisam de informações completas sobre segurança materno-fetal.',
              improvementSuggestions: [
                'Sempre esclarecer sobre não transmissão transplacentária',
                'Confirmar segurança da amamentação',
                'Explicar efeitos esperados vs preocupantes'
              ]
            },
            partial: {
              message: '👍 Boa abordagem, mas pode ser mais completa.',
              explanation: 'Você tocou em pontos importantes, mas algumas orientações específicas foram perdidas.',
              additionalResources: ['Manual da Gestante - Hanseníase']
            }
          },
          
          clinicalRationale: 'A orientação adequada da gestante reduz ansiedade, melhora adesão ao tratamento e estabelece base para cuidados seguros do recém-nascido.',
          safetyConsiderations: [
            'Informações corretas reduzem abandono do tratamento',
            'Planejamento antecipado dos cuidados neonatais',
            'Acompanhamento multidisciplinar é essencial'
          ]
        },
        
        educationalNotes: [
          'Hanseníase em gestantes deve ser tratada imediatamente',
          'Todos os medicamentos PQT-U são seguros na gravidez',
          'Amamentação é recomendada - não há contraindicação'
        ],
        references: ['Protocolo Materno-Infantil Hanseníase']
      }
    ],
    
    assessment: {
      totalPoints: 180,
      passingScore: 144, // 80%
      
      categories: [
        {
          name: 'Avaliação de Riscos',
          weight: 0.4,
          maxPoints: 80,
          criteria: [
            'Avaliou risco-benefício corretamente',
            'Reconheceu necessidade de tratamento imediato',
            'Identificou precauções específicas'
          ]
        },
        {
          name: 'Orientação Materno-Fetal',
          weight: 0.6,
          maxPoints: 100,
          criteria: [
            'Esclareceu questões sobre transmissão',
            'Orientou sobre segurança dos medicamentos',
            'Planejou cuidados neonatais'
          ]
        }
      ],
      
      timeLimit: 25,
      attemptsAllowed: 3,
      
      certificationCriteria: {
        minimumScore: 144,
        requiredSteps: ['step_001', 'step_002'],
        timeRequirement: 25
      }
    },
    
    references: [
      {
        type: 'protocolo_nacional',
        title: 'PCDT Hanseníase - Situações Especiais',
        source: 'Ministério da Saúde',
        section: 'Gravidez e Lactação',
        relevance: 'primary'
      },
      {
        type: 'tese_doutorado',
        title: 'Dispensação PQT-U em Situações Especiais',
        source: 'Nélio Gomes de Moura Júnior',
        section: 'Casos de Gravidez',
        relevance: 'primary'
      }
    ],
    
    qualityMetrics: {
      educationalValue: 5,
      clinicalRealism: 5,
      difficultyAlignment: 5,
      feedbackQuality: 5
    }
  },

  // CASO 4: Interações Medicamentosas - Paciente polimedicado
  {
    id: 'caso_004_interacoes_medicamentosas',
    title: 'Idoso Polimedicado - Gerenciamento de Interações',
    difficulty: 'avançado',
    estimatedTime: 30,
    category: 'interacoes',
    tags: ['idoso', 'polifarmacia', 'interacoes-medicamentosas', 'ajuste-dose'],
    
    patient: {
      name: 'Antônio Oliveira',
      age: 68,
      weight: 75,
      gender: 'masculino',
      
      clinicalPresentation: {
        type: 'multibacilar',
        lesions: ['Placas infiltradas generalizadas', 'Nódulos em pavilhões auriculares'],
        neurologicalSigns: ['Espessamento neural múltiplo', 'Perda sensitivo-motora mãos'],
        bacilloscopy: 'Positiva - IB 4+',
        biopsy: 'Hanseníase virchowiana'
      },
      
      medicalHistory: {
        allergies: ['Penicilina'],
        currentMedications: [
          'Varfarina 5mg/dia',
          'Metformina 500mg 2x/dia',
          'Enalapril 10mg 2x/dia',
          'Sinvastatina 20mg/noite',
          'Furosemida 40mg/dia',
          'Omeprazol 20mg/dia'
        ],
        comorbidities: [
          'Diabetes mellitus tipo 2',
          'Hipertensão arterial',
          'Insuficiência cardíaca compensada',
          'Fibrilação atrial'
        ],
        specialConditions: ['hepatopatia'],
        previousTreatments: []
      },
      
      socialContext: {
        livingConditions: 'Mora sozinho, filha visita diariamente',
        adherenceFactors: ['Múltiplos medicamentos', 'Esquecimento ocasional'],
        supportSystem: ['Filha enfermeira', 'Cuidadora meio período'],
        economicStatus: 'media',
        educationLevel: 'fundamental'
      }
    },
    
    scenario: {
      presentation: 'Sr. Antônio, 68 anos, diabético, hipertenso, cardiopata, em uso de varfarina. Diagnóstico recente de hanseníase virchowiana. A filha enfermeira está preocupada com interações medicamentosas, especialmente com a varfarina. Questiona se precisa ajustar doses.',
      
      prescriptionDetails: {
        prescribed: true,
        prescriber: 'medico',
        prescriptionType: 'pqt_u_adulto',
        prescriptionDate: new Date(),
        validityPeriod: 30
      },
      
      clinicalNotes: [
        'Polifarmácia complexa - risco de interações',
        'Anticoagulação estável - INR controlado',
        'Função renal e hepática preservadas'
      ],
      
      warningFlags: [
        {
          type: 'interaction',
          description: 'Rifampicina interage com varfarina - risco de trombose',
          severity: 'high'
        },
        {
          type: 'special_monitoring',
          description: 'Monitoramento intensivo de INR necessário',
          severity: 'high'
        },
        {
          type: 'special_monitoring',
          description: 'Polifarmácia aumenta risco de não adesão',
          severity: 'medium'
        }
      ]
    },
    
    learningObjectives: [
      'Identificar interações clinicamente significativas',
      'Planejar monitoramento de INR durante tratamento',
      'Desenvolver estratégia de adesão para polimedicado',
      'Coordenar cuidado multidisciplinar',
      'Orientar paciente e família sobre sinais de alerta'
    ],
    
    steps: [
      {
        id: 'step_001',
        stepNumber: 1,
        title: 'Análise de Interações Medicamentosas',
        type: 'assessment',
        phase: 'avaliacao_inicial',
        description: 'Identifique as principais interações entre PQT-U e medicações atuais do Sr. Antônio',
        instruction: 'Analise o perfil farmacológico e identifique interações clinicamente relevantes',
        
        interaction: {
          type: 'multiple_choice',
          options: [
            {
              id: 'option_a',
              text: 'Rifampicina reduz efeito da varfarina (risco trombótico), pode afetar metformina e sinvastatina',
              isCorrect: true,
              explanation: 'Rifampicina induz CYP450, reduzindo níveis de varfarina e outras medicações.',
              consequences: 'Identificação correta permite planejamento adequado'
            },
            {
              id: 'option_b',
              text: 'Dapsona interage com metformina causando hipoglicemia severa',
              isCorrect: false,
              explanation: 'Não há interação clinicamente significativa entre dapsona e metformina.',
              consequences: 'Preocupação desnecessária com interação inexistente'
            },
            {
              id: 'option_c',
              text: 'Clofazimina potencializa efeito da varfarina (risco hemorrágico)',
              isCorrect: false,
              explanation: 'Clofazimina não possui interação significativa com varfarina.',
              consequences: 'Avaliação incorreta do risco hemorrágico'
            },
            {
              id: 'option_d',
              text: 'Não há interações relevantes, pode iniciar PQT-U sem modificações',
              isCorrect: false,
              explanation: 'Rifampicina tem interação bem documentada com varfarina.',
              consequences: 'Risco de eventos tromboembólicos por falta de monitoramento'
            }
          ]
        },
        
        validation: {
          correctAnswer: 'option_a',
          points: 100,
          passingScore: 80,
          
          feedback: {
            correct: {
              message: '🎯 Excelente análise farmacológica!',
              explanation: 'Você identificou corretamente a principal interação rifampicina-varfarina e outras potenciais.',
              nextStepGuidance: 'Agora vamos planejar o monitoramento específico.'
            },
            incorrect: {
              message: '⚠️ A análise de interações precisa ser revisada.',
              explanation: 'Interações medicamentosas são críticas em pacientes polimedicados.',
              improvementSuggestions: [
                'Rifampicina é potente indutor enzimático',
                'Sempre verificar interações com anticoagulantes',
                'Consultar bases de dados de interações'
              ]
            },
            partial: {
              message: '👍 Você está na direção certa.',
              explanation: 'Reconheceu a importância das interações, mas a análise específica pode melhorar.',
              additionalResources: ['Base de Dados de Interações Medicamentosas']
            }
          },
          
          clinicalRationale: 'Rifampicina induz o sistema CYP450, especialmente CYP2C9, reduzindo significativamente os níveis séricos de varfarina e aumentando o risco tromboembólico.',
          safetyConsiderations: [
            'Redução do INR pode levar a eventos tromboembólicos',
            'Ajuste de dose de varfarina será necessário',
            'Monitoramento frequente é essencial'
          ]
        },
        
        educationalNotes: [
          'Rifampicina reduz eficácia de varfarina em 50-90%',
          'Início da interação: 3-7 dias, pico: 10-14 dias',
          'Reversão gradual após suspensão da rifampicina'
        ],
        references: ['Interações Medicamentosas - PQT-U']
      },
      
      {
        id: 'step_002',
        stepNumber: 2,
        title: 'Planejamento de Monitoramento',
        type: 'assessment',
        phase: 'orientacoes_cuidado',
        description: 'Desenvolva plano de monitoramento para INR e outras interações identificadas',
        instruction: 'Estabeleça cronograma de monitoramento e ajustes necessários',
        
        interaction: {
          type: 'checklist',
          checklistItems: [
            {
              id: 'inr_baseline',
              text: 'Solicitou INR basal antes de iniciar PQT-U',
              required: true,
              category: 'laboratorial',
              points: 15
            },
            {
              id: 'inr_weekly',
              text: 'Programou INR semanal nas primeiras 4 semanas',
              required: true,
              category: 'monitoramento',
              points: 20
            },
            {
              id: 'warfarin_adjustment',
              text: 'Orientou sobre necessidade de ajuste de varfarina',
              required: true,
              category: 'ajuste_medicacao',
              points: 20
            },
            {
              id: 'multidisciplinary_contact',
              text: 'Comunicou cardiologista sobre início do tratamento',
              required: true,
              category: 'comunicacao',
              points: 15
            },
            {
              id: 'emergency_signs',
              text: 'Orientou sinais de alerta para trombose/embolia',
              required: true,
              category: 'educacao',
              points: 15
            },
            {
              id: 'adherence_strategy',
              text: 'Desenvolveu estratégia para adesão em polimedicado',
              required: true,
              category: 'adesao',
              points: 15
            }
          ]
        },
        
        validation: {
          correctAnswer: ['inr_baseline', 'inr_weekly', 'warfarin_adjustment', 'multidisciplinary_contact', 'emergency_signs', 'adherence_strategy'],
          points: 100,
          passingScore: 80,
          
          feedback: {
            correct: {
              message: '✅ Plano de monitoramento completo e seguro!',
              explanation: 'Você estabeleceu monitoramento adequado para gerenciar as interações identificadas.',
              nextStepGuidance: 'Finalizemos com orientações práticas para família.'
            },
            incorrect: {
              message: '⚠️ O plano de monitoramento tem gaps importantes.',
              explanation: 'Pacientes anticoagulados requerem monitoramento intensivo durante PQT-U.',
              improvementSuggestions: [
                'INR deve ser monitorado semanalmente no início',
                'Comunicação com cardiologista é essencial',
                'Família deve conhecer sinais de alerta'
              ]
            },
            partial: {
              message: '👍 Bom planejamento, mas pode ser mais robusto.',
              explanation: 'Você incluiu pontos importantes, mas alguns aspectos críticos foram perdidos.',
              additionalResources: ['Protocolo de Monitoramento Anticoagulação']
            }
          },
          
          clinicalRationale: 'O monitoramento rigoroso previne eventos tromboembólicos graves, mantendo benefícios do tratamento da hanseníase com segurança anticoagulante.',
          safetyConsiderations: [
            'Eventos tromboembólicos podem ser fatais',
            'Ajuste precoce de varfarina é crucial',
            'Família deve estar preparada para emergências'
          ]
        },
        
        educationalNotes: [
          'INR alvo: manter 2-3 (pode necessitar aumento de dose)',
          'Monitoramento: semanal × 4, depois quinzenal × 2',
          'Após suspensão PQT-U: reduzir varfarina gradualmente'
        ],
        references: ['Protocolo Anticoagulação + Hanseníase']
      }
    ],
    
    assessment: {
      totalPoints: 200,
      passingScore: 160, // 80%
      
      categories: [
        {
          name: 'Análise de Interações',
          weight: 0.5,
          maxPoints: 100,
          criteria: [
            'Identificou interações clinicamente relevantes',
            'Priorizou risco tromboembólico adequadamente',
            'Demonstrou conhecimento farmacológico'
          ]
        },
        {
          name: 'Planejamento de Monitoramento',
          weight: 0.5,
          maxPoints: 100,
          criteria: [
            'Estabeleceu cronograma de monitoramento adequado',
            'Planejou comunicação multidisciplinar',
            'Desenvolveu estratégias de segurança'
          ]
        }
      ],
      
      timeLimit: 30,
      attemptsAllowed: 3,
      
      certificationCriteria: {
        minimumScore: 160,
        requiredSteps: ['step_001', 'step_002'],
        timeRequirement: 30
      }
    },
    
    references: [
      {
        type: 'protocolo_nacional',
        title: 'Interações Medicamentosas - PQT-U',
        source: 'Ministério da Saúde',
        section: 'Pacientes Polimedicados',
        relevance: 'primary'
      },
      {
        type: 'tese_doutorado',
        title: 'Farmacovigilância em PQT-U',
        source: 'Nélio Gomes de Moura Júnior',
        section: 'Interações Complexas',
        relevance: 'primary'
      }
    ],
    
    qualityMetrics: {
      educationalValue: 5,
      clinicalRealism: 5,
      difficultyAlignment: 5,
      feedbackQuality: 5
    }
  },

  // CASO 5: Complicações Clínicas - Estados reacionais
  {
    id: 'caso_005_complicacoes_clinicas',
    title: 'Estados Reacionais - Manejo de Complicações',
    difficulty: 'complexo',
    estimatedTime: 35,
    category: 'complicacoes',
    tags: ['estado-reacional', 'emergencia', 'corticoide', 'hospitalizacao'],
    
    patient: {
      name: 'José Carlos Ferreira',
      age: 52,
      weight: 68,
      gender: 'masculino',
      
      clinicalPresentation: {
        type: 'multibacilar',
        lesions: ['Lesões eritematosas dolorosas generalizadas', 'Nódulos inflamados'],
        neurologicalSigns: ['Neurite aguda cubital e fibular', 'Dor neural intensa'],
        bacilloscopy: 'Positiva - IB 3+',
        biopsy: 'Hanseníase virchowiana + estado reacional tipo 2'
      },
      
      medicalHistory: {
        allergies: [],
        currentMedications: ['PQT-U há 3 meses'],
        comorbidities: ['Hipertensão arterial controlada'],
        specialConditions: ['hepatopatia'],
        previousTreatments: ['Episódio reacional prévio há 1 mês']
      },
      
      socialContext: {
        livingConditions: 'Casa própria, esposa e 2 filhos adolescentes',
        adherenceFactors: ['Dor intensa', 'Receio de medicamentos'],
        supportSystem: ['Esposa dedicada', 'Filhos colaborativos'],
        economicStatus: 'baixa',
        educationLevel: 'fundamental'
      }
    },
    
    scenario: {
      presentation: 'Sr. José Carlos retorna à farmácia após 3 meses de PQT-U. Apresenta lesões muito dolorosas, febre, mal-estar e dor neural intensa. Esposa relata que ele não quer mais tomar a medicação porque "está piorando". Médico prescreveu prednisona 1mg/kg/dia.',
      
      prescriptionDetails: {
        prescribed: true,
        prescriber: 'medico',
        prescriptionType: 'pqt_u_adulto',
        prescriptionDate: new Date(),
        validityPeriod: 15
      },
      
      clinicalNotes: [
        'Estado reacional tipo 2 (eritema nodoso hansênico)',
        'Neurite aguda com risco de sequelas',
        'Receio de continuar PQT-U por confundir reação com piora'
      ],
      
      warningFlags: [
        {
          type: 'special_monitoring',
          description: 'Neurite aguda - risco de incapacidade permanente',
          severity: 'critical'
        },
        {
          type: 'special_monitoring',
          description: 'Paciente quer interromper PQT-U por confundir reação com piora',
          severity: 'high'
        },
        {
          type: 'dose_adjustment',
          description: 'Prednisona em alta dose - monitoramento de efeitos adversos',
          severity: 'medium'
        }
      ]
    },
    
    learningObjectives: [
      'Reconhecer estado reacional como complicação do tratamento',
      'Diferenciar reação hansênica de falha terapêutica',
      'Orientar continuidade da PQT-U durante estado reacional',
      'Gerenciar corticoterapia de forma segura',
      'Estabelecer plano de emergência para complicações'
    ],
    
    steps: [
      {
        id: 'step_001',
        stepNumber: 1,
        title: 'Reconhecimento de Estado Reacional',
        type: 'assessment',
        phase: 'avaliacao_inicial',
        description: 'Sr. José Carlos apresenta lesões dolorosas, febre e dor neural após 3 meses de PQT-U',
        instruction: 'Avalie se é estado reacional e qual a conduta imediata necessária',
        
        interaction: {
          type: 'multiple_choice',
          options: [
            {
              id: 'option_a',
              text: 'Estado reacional tipo 2 - manter PQT-U, iniciar prednisona, encaminhar para avaliação urgente',
              isCorrect: true,
              explanation: 'Conduta correta: estado reacional não interrompe PQT-U, requer corticoide e acompanhamento.',
              consequences: 'Manejo adequado previne sequelas e mantém eficácia do tratamento'
            },
            {
              id: 'option_b',
              text: 'Falha terapêutica - suspender PQT-U imediatamente e investigar resistência',
              isCorrect: false,
              explanation: 'Estado reacional não é falha terapêutica - suspensão da PQT-U é prejudicial.',
              consequences: 'Interrupção desnecessária pode levar à resistência bacteriana'
            },
            {
              id: 'option_c',
              text: 'Efeito adverso dos medicamentos - reduzir doses da PQT-U pela metade',
              isCorrect: false,
              explanation: 'Estados reacionais não são efeitos adversos diretos da PQT-U.',
              consequences: 'Subdosagem pode comprometer eficácia do tratamento'
            },
            {
              id: 'option_d',
              text: 'Reação alérgica grave - suspender tudo e prescrever anti-histamínicos',
              isCorrect: false,
              explanation: 'Não se trata de reação alérgica, mas sim de resposta imunológica à morte bacilar.',
              consequences: 'Conduta inadequada pode resultar em sequelas neurais permanentes'
            }
          ]
        },
        
        validation: {
          correctAnswer: 'option_a',
          points: 120,
          passingScore: 90,
          
          feedback: {
            correct: {
              message: '🚨 Excelente reconhecimento de emergência!',
              explanation: 'Você identificou corretamente o estado reacional e a necessidade de manter PQT-U com corticoterapia.',
              nextStepGuidance: 'Agora vamos abordar a educação do paciente sobre este processo.'
            },
            incorrect: {
              message: '⚠️ ATENÇÃO: Conduta inadequada para emergência reacional.',
              explanation: 'Estados reacionais são complicações graves que requerem manejo específico urgente.',
              improvementSuggestions: [
                'Estado reacional tipo 2 = eritema nodoso hansênico',
                'PQT-U deve ser MANTIDA durante reações',
                'Corticoide é essencial para prevenir sequelas'
              ]
            },
            partial: {
              message: '🤔 Reconheceu a gravidade, mas conduta precisa ajustes.',
              explanation: 'Você entendeu que é situação grave, mas o manejo específico pode melhorar.',
              additionalResources: ['Protocolo Estados Reacionais - MS']
            }
          },
          
          clinicalRationale: 'Estados reacionais são reações imunológicas à morte dos bacilos durante o tratamento. Tipo 2 (ENH) requer corticoterapia urgente para prevenir lesão neural permanente.',
          safetyConsiderations: [
            'Neurite aguda pode causar incapacidade permanente em 24-48h',
            'Interrupção da PQT-U favorece resistência bacteriana',
            'Corticoide precoce é essencial para neuroproteção'
          ]
        },
        
        educationalNotes: [
          'Estado reacional ≠ falha terapêutica',
          'Tipo 2 (ENH): lesões dolorosas + sintomas sistêmicos',
          'PQT-U é SEMPRE mantida durante reações'
        ],
        references: ['Protocolo Estados Reacionais - Hanseníase']
      },
      
      {
        id: 'step_002',
        stepNumber: 2,
        title: 'Educação sobre Estados Reacionais',
        type: 'counseling',
        phase: 'orientacoes_cuidado',
        description: 'Paciente e esposa estão assustados, querem parar medicação porque "está ficando pior"',
        instruction: 'Eduque sobre natureza dos estados reacionais e importância de continuar tratamento',
        
        interaction: {
          type: 'scenario_simulation',
          scenarioText: 'José Carlos: "O remédio está me fazendo mal! Estou pior que antes!" Esposa: "Doutor, será que não era melhor parar um tempo?"',
          responseOptions: [
            {
              id: 'response_a',
              text: 'Entendo sua preocupação. Isso que está acontecendo é uma reação do seu corpo matando as bactérias. É sinal que o remédio está funcionando. Vamos tratar essa reação, mas nunca parar o tratamento principal.',
              isCorrect: true,
              empathyScore: 5,
              clarityScore: 5,
              safetyScore: 5
            },
            {
              id: 'response_b',
              text: 'Você precisa continuar tomando porque o médico mandou. Essa dor vai passar.',
              isCorrect: false,
              empathyScore: 2,
              clarityScore: 2,
              safetyScore: 3
            },
            {
              id: 'response_c',
              text: 'É uma reação hansênica tipo 2, eritema nodoso, causada por imunocomplexos circulantes que ativam complemento...',
              isCorrect: false,
              empathyScore: 2,
              clarityScore: 1,
              safetyScore: 4
            },
            {
              id: 'response_d',
              text: 'Vamos reduzir um pouco a dose até você melhorar, aí aumentamos de novo.',
              isCorrect: false,
              empathyScore: 4,
              clarityScore: 3,
              safetyScore: 1
            }
          ]
        },
        
        validation: {
          correctAnswer: 'response_a',
          points: 100,
          passingScore: 80,
          
          feedback: {
            correct: {
              message: '👏 Comunicação terapêutica excelente!',
              explanation: 'Você demonstrou empatia, explicou em linguagem acessível e garantiu adesão ao tratamento.',
              nextStepGuidance: 'Vamos finalizar com orientações sobre corticoterapia.'
            },
            incorrect: {
              message: '🤔 A comunicação pode ser mais efetiva.',
              explanation: 'Pacientes em estado reacional precisam de explicações claras e tranquilizadoras.',
              improvementSuggestions: [
                'Validar sentimentos e preocupações',
                'Explicar que reação = tratamento funcionando',
                'Usar linguagem simples e acessível'
              ]
            },
            partial: {
              message: '👍 Boa direção, mas pode aprimorar.',
              explanation: 'Você tocou em pontos importantes, mas a abordagem pode ser mais completa.',
              additionalResources: ['Comunicação em Emergências - Hanseníase']
            }
          },
          
          clinicalRationale: 'A educação adequada durante estado reacional é crucial para manter adesão ao tratamento e reduzir ansiedade, prevenindo abandono em momento crítico.',
          safetyConsiderations: [
            'Abandono durante reação pode ser fatal',
            'Família deve entender que reação ≠ piora',
            'Explicação adequada melhora adesão à corticoterapia'
          ]
        },
        
        educationalNotes: [
          'Estado reacional = resposta imune à morte dos bacilos',
          'Sinal de que PQT-U está funcionando',
          'Corticoide trata a reação, PQT-U trata a doença'
        ],
        references: ['Manual do Paciente - Estados Reacionais']
      },
      
      {
        id: 'step_003',
        stepNumber: 3,
        title: 'Manejo da Corticoterapia',
        type: 'assessment',
        phase: 'pos_dispensacao',
        description: 'Prednisona 1mg/kg/dia foi prescrita. Oriente sobre uso correto e monitoramento',
        instruction: 'Estabeleça plano de corticoterapia segura e monitoramento de efeitos adversos',
        
        interaction: {
          type: 'checklist',
          checklistItems: [
            {
              id: 'dosage_calculation',
              text: 'Calculou dose correta: 68mg/dia (1mg/kg) em dose única matinal',
              required: true,
              category: 'posologia',
              points: 15
            },
            {
              id: 'administration_timing',
              text: 'Orientou administração pela manhã com alimentos',
              required: true,
              category: 'administracao',
              points: 10
            },
            {
              id: 'monitoring_plan',
              text: 'Estabeleceu monitoramento: glicemia, PA, peso, sinais de infecção',
              required: true,
              category: 'monitoramento',
              points: 20
            },
            {
              id: 'tapering_education',
              text: 'Explicou importância da redução gradual (não suspender abruptamente)',
              required: true,
              category: 'educacao',
              points: 15
            },
            {
              id: 'side_effects_warning',
              text: 'Alertou sobre efeitos adversos: hiperglicemia, hipertensão, infecções',
              required: true,
              category: 'seguranca',
              points: 15
            },
            {
              id: 'emergency_plan',
              text: 'Estabeleceu plano para situações de emergência (quando procurar ajuda)',
              required: true,
              category: 'emergencia',
              points: 15
            },
            {
              id: 'follow_up_schedule',
              text: 'Agendou retorno em 48-72h para reavaliação',
              required: true,
              category: 'seguimento',
              points: 10
            }
          ]
        },
        
        validation: {
          correctAnswer: ['dosage_calculation', 'administration_timing', 'monitoring_plan', 'tapering_education', 'side_effects_warning', 'emergency_plan', 'follow_up_schedule'],
          points: 100,
          passingScore: 80,
          
          feedback: {
            correct: {
              message: '✅ Manejo completo e seguro da corticoterapia!',
              explanation: 'Você estabeleceu plano abrangente para uso seguro de corticoide em alta dose.',
              nextStepGuidance: 'Caso completado com excelência no manejo de complicações.'
            },
            incorrect: {
              message: '⚠️ O plano de corticoterapia tem gaps importantes.',
              explanation: 'Corticoides em alta dose requerem monitoramento rigoroso para prevenir complicações graves.',
              improvementSuggestions: [
                'Dose = 1mg/kg/dia em dose única matinal',
                'Monitorar glicemia, PA e sinais de infecção',
                'Redução gradual é obrigatória'
              ]
            },
            partial: {
              message: '👍 Bom planejamento, mas pode ser mais robusto.',
              explanation: 'Você incluiu aspectos importantes, mas alguns pontos críticos foram perdidos.',
              additionalResources: ['Protocolo Corticoterapia - Estados Reacionais']
            }
          },
          
          clinicalRationale: 'Corticoterapia em estados reacionais tipo 2 previne sequelas neurais permanentes, mas requer monitoramento rigoroso devido aos efeitos adversos em altas doses.',
          safetyConsiderations: [
            'Hiperglicemia pode descompensar diabetes',
            'Hipertensão pode causar crises',
            'Imunossupressão aumenta risco de infecções graves'
          ]
        },
        
        educationalNotes: [
          'Prednisona: 1mg/kg/dia por 4 semanas, depois redução gradual',
          'Monitoramento semanal nas primeiras 4 semanas',
          'Suspensão abrupta pode causar insuficiência adrenal'
        ],
        references: ['Protocolo Corticoterapia - Hanseníase']
      }
    ],
    
    assessment: {
      totalPoints: 320,
      passingScore: 256, // 80%
      
      categories: [
        {
          name: 'Reconhecimento de Emergência',
          weight: 0.4,
          maxPoints: 120,
          criteria: [
            'Identificou estado reacional tipo 2',
            'Reconheceu necessidade de manter PQT-U',
            'Priorizou neuroproteção adequadamente'
          ]
        },
        {
          name: 'Educação em Crise',
          weight: 0.3,
          maxPoints: 100,
          criteria: [
            'Comunicou efetivamente sobre reações',
            'Tranquilizou sem minimizar gravidade',
            'Garantiu adesão ao tratamento'
          ]
        },
        {
          name: 'Manejo de Corticoterapia',
          weight: 0.3,
          maxPoints: 100,
          criteria: [
            'Estabeleceu dosagem e administração corretas',
            'Planejou monitoramento adequado',
            'Identificou sinais de alerta'
          ]
        }
      ],
      
      timeLimit: 35,
      attemptsAllowed: 2,
      
      certificationCriteria: {
        minimumScore: 256,
        requiredSteps: ['step_001', 'step_002', 'step_003'],
        timeRequirement: 35
      }
    },
    
    references: [
      {
        type: 'protocolo_nacional',
        title: 'Estados Reacionais na Hanseníase',
        source: 'Ministério da Saúde',
        section: 'Manejo de Emergências',
        relevance: 'primary'
      },
      {
        type: 'tese_doutorado',
        title: 'Complicações da PQT-U',
        source: 'Nélio Gomes de Moura Júnior',
        section: 'Estados Reacionais Complexos',
        relevance: 'primary'
      }
    ],
    
    qualityMetrics: {
      educationalValue: 5,
      clinicalRealism: 5,
      difficultyAlignment: 5,
      feedbackQuality: 5
    }
  }
];

export default CLINICAL_CASES;