'use client';

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