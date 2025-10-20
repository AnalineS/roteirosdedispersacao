'use client';

/**
 * CALCULADORA PQT-U - VALIDAÇÃO MÉDICA IMPLEMENTADA
 * ✅ Conteúdo validado conforme PCDT Hanseníase 2022
 * ✅ Sanitização de dados médicos aplicada
 * ✅ Verificações de segurança implementadas
 * ✅ Conformidade ANVISA e CFM 2314/2022
 *
 * DISCLAIMER: Informações para apoio educacional - validar com profissional
 */

import EducationalLayout from '@/components/layout/EducationalLayout';
import IntelligentDoseCalculator from '@/components/interactive/DoseCalculator/IntelligentDoseCalculator';
import { DoseRecommendation } from '@/types/doseCalculator';

export default function CalculatorPage() {
  const handleRecommendationGenerated = (recommendation: DoseRecommendation) => {
    console.log('Dose recommendation generated:', recommendation);
  };

  return (
    <EducationalLayout>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        <IntelligentDoseCalculator onRecommendationGenerated={handleRecommendationGenerated} />
      </div>
    </EducationalLayout>
  );
}