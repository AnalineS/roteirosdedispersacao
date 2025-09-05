'use client';

import React, { useState, useEffect } from 'react';
import BasicCalculator from './BasicCalculator';
import AdvancedCalculator from './AdvancedCalculator';
import { CalculationResult } from '@/types/medication';

interface DoseCalculatorProps {
  userType?: 'anonymous' | 'authenticated';
  onCalculationComplete?: (result: CalculationResult) => void;
}

export default function DoseCalculator({ 
  userType = 'anonymous',
  onCalculationComplete 
}: DoseCalculatorProps): JSX.Element {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Verificar se usuário está logado
    // Por enquanto, usar localStorage ou props
    const authStatus = userType === 'authenticated';
    setIsAuthenticated(authStatus);
  }, [userType]);

  if (isAuthenticated) {
    return (
      <AdvancedCalculator onCalculationComplete={onCalculationComplete} />
    );
  }

  return (
    <BasicCalculator onCalculationComplete={onCalculationComplete} />
  );
}