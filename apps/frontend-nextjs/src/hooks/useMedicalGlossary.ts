'use client';

import { useState, useMemo } from 'react';

export interface MedicalTerm {
  id: string;
  technical: string;
  simple: string;
  example?: string;
  pronunciation?: string;
  category: 'medication' | 'condition' | 'procedure' | 'anatomy' | 'general';
}

const medicalTerms: MedicalTerm[] = [
  {
    id: 'pqt-u',
    technical: 'Poliquimioterapia Única (PQT-U)',
    simple: 'Tratamento com vários remédios juntos',
    example: 'É como tomar vitaminas diferentes ao mesmo tempo para tratar a hanseníase',
    pronunciation: 'Po-li-qui-mio-te-ra-pia Ú-ni-ca',
    category: 'medication'
  },
  {
    id: 'hanseniase',
    technical: 'Hanseníase',
    simple: 'Doença de pele e nervos que tem cura',
    example: 'Uma doença que pode ser completamente curada com remédios',
    pronunciation: 'Han-se-ní-a-se',
    category: 'condition'
  },
  {
    id: 'mycobacterium-leprae',
    technical: 'Mycobacterium leprae',
    simple: 'Micróbio que causa a hanseníase',
    example: 'É o "bichinho" muito pequeno que causa a doença',
    pronunciation: 'Mai-co-bac-té-ri-um lé-prae',
    category: 'general'
  },
  {
    id: 'dispensacao',
    technical: 'Dispensação farmacêutica',
    simple: 'Entrega do remédio com orientações',
    example: 'Quando o farmacêutico te entrega o remédio e explica como tomar',
    pronunciation: 'Dis-pen-sa-ção far-ma-cêu-ti-ca',
    category: 'procedure'
  },
  {
    id: 'farmacovigilancia',
    technical: 'Farmacovigilância',
    simple: 'Acompanhamento dos efeitos do remédio',
    example: 'Como o médico observa se o remédio está fazendo bem ou mal',
    pronunciation: 'Far-ma-co-vi-gi-lân-cia',
    category: 'procedure'
  },
  {
    id: 'rifampicina',
    technical: 'Rifampicina',
    simple: 'Remédio principal contra hanseníase',
    example: 'O remédio mais importante do tratamento, que deixa a urina vermelha',
    pronunciation: 'Ri-fam-pi-ci-na',
    category: 'medication'
  },
  {
    id: 'clofazimina',
    technical: 'Clofazimina',
    simple: 'Remédio que deixa a pele mais escura',
    example: 'Um dos remédios do tratamento que pode escurecer a pele temporariamente',
    pronunciation: 'Clo-fa-zi-mi-na',
    category: 'medication'
  },
  {
    id: 'dapsona',
    technical: 'Dapsona',
    simple: 'Remédio diário do tratamento',
    example: 'O remédio que você toma todos os dias durante o tratamento',
    pronunciation: 'Dap-so-na',
    category: 'medication'
  },
  {
    id: 'reacao-reversa',
    technical: 'Reação reversa',
    simple: 'Inflamação que pode aparecer durante o tratamento',
    example: 'Quando a pele fica mais vermelha e dolorida, mas é sinal que o tratamento está funcionando',
    pronunciation: 'Re-a-ção re-ver-sa',
    category: 'condition'
  },
  {
    id: 'eritema-nodoso',
    technical: 'Eritema nodoso hansênico',
    simple: 'Caroços doloridos na pele',
    example: 'Quando aparecem "bolinhas" vermelhas e doloridas na pele durante o tratamento',
    pronunciation: 'E-ri-te-ma no-do-so han-sê-ni-co',
    category: 'condition'
  },
  {
    id: 'neurite',
    technical: 'Neurite',
    simple: 'Nervos inflamados',
    example: 'Quando os nervos ficam doloridos e pode haver perda de sensibilidade',
    pronunciation: 'Neu-ri-te',
    category: 'condition'
  },
  {
    id: 'baciloscopia',
    technical: 'Baciloscopia',
    simple: 'Exame para detectar a hanseníase',
    example: 'Exame de laboratório que procura os micróbios da hanseníase',
    pronunciation: 'Ba-ci-los-co-pia',
    category: 'procedure'
  },
  {
    id: 'paucibacilar',
    technical: 'Paucibacilar',
    simple: 'Forma leve da hanseníase',
    example: 'Quando a pessoa tem poucos micróbios da hanseníase no corpo',
    pronunciation: 'Pau-ci-ba-ci-lar',
    category: 'condition'
  },
  {
    id: 'multibacilar',
    technical: 'Multibacilar',
    simple: 'Forma mais forte da hanseníase',
    example: 'Quando a pessoa tem muitos micróbios da hanseníase no corpo',
    pronunciation: 'Mul-ti-ba-ci-lar',
    category: 'condition'
  },
  {
    id: 'incapacidade-fisica',
    technical: 'Incapacidade física',
    simple: 'Dificuldade de movimento',
    example: 'Quando a pessoa tem dificuldade para mexer mãos ou pés',
    pronunciation: 'In-ca-pa-ci-da-de fí-si-ca',
    category: 'condition'
  },
  {
    id: 'prednisona',
    technical: 'Prednisona',
    simple: 'Remédio anti-inflamatório',
    example: 'Remédio usado para reduzir inflamações durante as reações',
    pronunciation: 'Pred-ni-so-na',
    category: 'medication'
  },
  {
    id: 'talidomida',
    technical: 'Talidomida',
    simple: 'Remédio para reações graves',
    example: 'Remédio especial para tratar reações graves da hanseníase',
    pronunciation: 'Ta-li-do-mi-da',
    category: 'medication'
  },
  {
    id: 'autocuidado',
    technical: 'Autocuidado',
    simple: 'Cuidar de si mesmo',
    example: 'Cuidados diários que o paciente faz em casa para prevenir problemas',
    pronunciation: 'Au-to-cui-da-do',
    category: 'procedure'
  },
  {
    id: 'dose-supervisionada',
    technical: 'Dose supervisionada',
    simple: 'Remédio tomado na frente do profissional',
    example: 'Quando você toma o remédio mensal na unidade de saúde',
    pronunciation: 'Do-se su-per-vi-sio-na-da',
    category: 'procedure'
  },
  {
    id: 'autoadministrada',
    technical: 'Dose autoadministrada',
    simple: 'Remédio tomado em casa',
    example: 'Os remédios que você leva para casa e toma sozinho',
    pronunciation: 'Au-to-ad-mi-nis-tra-da',
    category: 'procedure'
  },
  {
    id: 'epidemiologia',
    technical: 'Epidemiologia',
    simple: 'Estudo da doença na população',
    example: 'Como a doença se espalha e quantas pessoas são afetadas',
    pronunciation: 'E-pi-de-mio-lo-gia',
    category: 'general'
  },
  {
    id: 'endemia',
    technical: 'Endemia',
    simple: 'Doença comum em uma região',
    example: 'Quando uma doença é comum em determinado lugar',
    pronunciation: 'En-de-mia',
    category: 'general'
  },
  {
    id: 'cartela-blister',
    technical: 'Cartela blister',
    simple: 'Embalagem do remédio',
    example: 'A cartela com bolhas onde vêm os comprimidos',
    pronunciation: 'Car-te-la blís-ter',
    category: 'general'
  },
  {
    id: 'adesao-tratamento',
    technical: 'Adesão ao tratamento',
    simple: 'Seguir o tratamento corretamente',
    example: 'Tomar todos os remédios no horário certo até o fim',
    pronunciation: 'A-de-são ao tra-ta-men-to',
    category: 'procedure'
  }
];

export interface UseMedicalGlossaryReturn {
  terms: MedicalTerm[];
  searchTerms: (query: string) => MedicalTerm[];
  getTerm: (technical: string) => MedicalTerm | undefined;
  getTermById: (id: string) => MedicalTerm | undefined;
  translateText: (text: string, useSimple: boolean) => string;
  getCategories: () => string[];
}

export function useMedicalGlossary(): UseMedicalGlossaryReturn {
  const searchTerms = (query: string): MedicalTerm[] => {
    if (!query) return medicalTerms;
    
    const lowercaseQuery = query.toLowerCase();
    return medicalTerms.filter(term => 
      term.technical.toLowerCase().includes(lowercaseQuery) ||
      term.simple.toLowerCase().includes(lowercaseQuery) ||
      term.example?.toLowerCase().includes(lowercaseQuery)
    );
  };

  const getTerm = (technical: string): MedicalTerm | undefined => {
    return medicalTerms.find(term => 
      term.technical.toLowerCase() === technical.toLowerCase()
    );
  };

  const getTermById = (id: string): MedicalTerm | undefined => {
    return medicalTerms.find(term => term.id === id);
  };

  const translateText = (text: string, useSimple: boolean = true): string => {
    if (!useSimple) return text;

    let translatedText = text;
    
    medicalTerms.forEach(term => {
      const regex = new RegExp(`\\b${term.technical}\\b`, 'gi');
      translatedText = translatedText.replace(regex, term.simple);
    });

    return translatedText;
  };

  const getCategories = (): string[] => {
    const categories = new Set(medicalTerms.map(term => term.category));
    return Array.from(categories).sort();
  };

  return {
    terms: medicalTerms,
    searchTerms,
    getTerm,
    getTermById,
    translateText,
    getCategories
  };
}

// Hook para simplificação automática de texto
export function useTextSimplification() {
  const { translateText } = useMedicalGlossary();
  const [isSimpleMode, setIsSimpleMode] = useState(false);

  const simplifyText = useMemo(() => {
    return (text: string) => {
      return isSimpleMode ? translateText(text, true) : text;
    };
  }, [isSimpleMode, translateText]);

  return {
    isSimpleMode,
    setIsSimpleMode,
    simplifyText
  };
}

// Função utilitária para detectar termos médicos em um texto
export function detectMedicalTerms(text: string): { term: MedicalTerm; position: number }[] {
  const detectedTerms: { term: MedicalTerm; position: number }[] = [];
  
  medicalTerms.forEach(term => {
    const regex = new RegExp(`\\b${term.technical}\\b`, 'gi');
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      detectedTerms.push({
        term,
        position: match.index
      });
    }
  });

  return detectedTerms.sort((a, b) => a.position - b.position);
}