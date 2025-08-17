'use client';

import Script from 'next/script';

interface MedicalStructuredDataProps {
  pageType: 'educational' | 'treatment' | 'diagnosis' | 'general';
  title: string;
  description: string;
  url?: string;
  lastReviewed?: string;
  medicalCondition?: string;
  medicalSpecialty?: string;
  targetAudience?: 'Patient' | 'MedicalAudience' | 'Both';
  aboutCondition?: {
    name: string;
    alternateName?: string;
    description: string;
  };
  mainEntity?: {
    type: string;
    name: string;
    description: string;
  };
  breadcrumb?: Array<{
    position: number;
    name: string;
    item: string;
  }>;
}

export default function MedicalStructuredData({
  pageType,
  title,
  description,
  url = '',
  lastReviewed = '2024-12-01',
  medicalCondition = 'Hanseníase',
  medicalSpecialty = 'Farmácia Clínica',
  targetAudience = 'Both',
  aboutCondition,
  mainEntity,
  breadcrumb
}: MedicalStructuredDataProps) {
  
  const getAudience = () => {
    switch (targetAudience) {
      case 'Patient':
        return [
          {
            "@type": "MedicalAudience",
            "audienceType": "https://schema.org/Patient"
          }
        ];
      case 'MedicalAudience':
        return [
          {
            "@type": "MedicalAudience",
            "audienceType": "https://schema.org/MedicalAudience",
            "requiredGender": "unisex",
            "requiredMinAge": 18
          }
        ];
      default:
        return [
          {
            "@type": "MedicalAudience",
            "audienceType": "https://schema.org/Patient"
          },
          {
            "@type": "MedicalAudience", 
            "audienceType": "https://schema.org/MedicalAudience",
            "requiredGender": "unisex",
            "requiredMinAge": 18
          }
        ];
    }
  };

  const getSpecialtyData = () => {
    const specialties: Record<string, { "@type": string; name: string; alternateName: string }> = {
      'Farmácia Clínica': {
        "@type": "MedicalSpecialty",
        "name": "Farmácia Clínica",
        "alternateName": "Clinical Pharmacy"
      },
      'Dermatologia': {
        "@type": "MedicalSpecialty", 
        "name": "Dermatologia",
        "alternateName": "Dermatology"
      },
      'Medicina Tropical': {
        "@type": "MedicalSpecialty",
        "name": "Medicina Tropical",
        "alternateName": "Tropical Medicine"
      }
    };
    return specialties[medicalSpecialty] || specialties['Farmácia Clínica'];
  };

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "MedicalWebPage",
    "name": title,
    "description": description,
    "url": url || `https://roteirosdedispensacao.com${typeof window !== 'undefined' ? window.location.pathname : ''}`,
    "medicalAudience": getAudience(),
    "specialty": getSpecialtyData(),
    "about": aboutCondition || {
      "@type": "MedicalCondition",
      "name": medicalCondition,
      "alternateName": medicalCondition === 'Hanseníase' ? 'Lepra' : undefined,
      "description": medicalCondition === 'Hanseníase' 
        ? "Doença infecciosa crônica causada pelo Mycobacterium leprae"
        : `Condição médica relacionada a ${medicalCondition}`
    },
    "lastReviewed": lastReviewed,
    "reviewedBy": {
      "@type": "Organization",
      "name": "Universidade de Brasília",
      "alternateName": "UnB",
      "department": "Programa de Pós-Graduação em Ciências Farmacêuticas"
    },
    "author": {
      "@type": "Organization",
      "name": "Universidade de Brasília",
      "url": "https://www.unb.br"
    },
    "publisher": {
      "@type": "Organization",
      "name": "UnB - Programa de Pós-Graduação em Ciências Farmacêuticas"
    },
    "mainEntity": mainEntity,
    "significantLink": [
      "https://roteirosdedispensacao.com/chat",
      "https://roteirosdedispensacao.com/modules",
      "https://roteirosdedispensacao.com/vida-com-hanseniase"
    ],
    "breadcrumb": breadcrumb && {
      "@type": "BreadcrumbList",
      "itemListElement": breadcrumb.map(item => ({
        "@type": "ListItem",
        "position": item.position,
        "name": item.name,
        "item": item.item
      }))
    },
    // Propriedades específicas por tipo de página
    ...(pageType === 'treatment' && {
      "treatmentApproach": {
        "@type": "MedicalTherapy",
        "name": "Poliquimioterapia Única (PQT-U)",
        "description": "Tratamento medicamentoso padronizado para hanseníase com rifampicina, clofazimina e dapsona"
      }
    }),
    ...(pageType === 'diagnosis' && {
      "medicalCode": {
        "@type": "MedicalCode",
        "code": "A30",
        "codingSystem": "ICD-10"
      }
    }),
    ...(pageType === 'educational' && {
      "educationalUse": "Educação médica continuada e orientação ao paciente",
      "educationalLevel": "Técnico-científico e educacional"
    })
  };

  return (
    <Script
      id={`medical-structured-data-${pageType}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData, null, 2)
      }}
    />
  );
}

// Componente helper para módulos educacionais específicos
export function HanseníaseModuleStructuredData({
  moduleTitle,
  moduleDescription,
  moduleType = 'educational',
  duration,
  level,
  category
}: {
  moduleTitle: string;
  moduleDescription: string;
  moduleType?: 'educational' | 'treatment' | 'diagnosis';
  duration?: string;
  level?: string;
  category?: string;
}) {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  
  return (
    <MedicalStructuredData
      pageType={moduleType}
      title={`${moduleTitle} - Módulo Educacional Hanseníase`}
      description={moduleDescription}
      url={`https://roteirosdedispensacao.com${pathname}`}
      targetAudience={level === 'Técnico-científico' ? 'MedicalAudience' : 'Both'}
      medicalSpecialty={category === 'Farmacoterapia' ? 'Farmácia Clínica' : 'Medicina Tropical'}
      mainEntity={{
        type: "EducationalModule",
        name: moduleTitle,
        description: moduleDescription
      }}
      breadcrumb={[
        {
          position: 1,
          name: "Início",
          item: "https://roteirosdedispensacao.com"
        },
        {
          position: 2,
          name: "Módulos Educacionais",
          item: "https://roteirosdedispensacao.com/modules"
        },
        {
          position: 3,
          name: moduleTitle,
          item: `https://roteirosdedispensacao.com${pathname}`
        }
      ]}
    />
  );
}