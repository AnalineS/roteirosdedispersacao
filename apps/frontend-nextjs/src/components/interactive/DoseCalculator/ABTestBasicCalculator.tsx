/**
 * A/B Test Enhanced Basic Calculator - ETAPA 5.1
 * Demonstração do uso do framework A/B testing na calculadora
 * 
 * EXPERIMENTO: Otimização da interface da calculadora
 * - Variant A (controle): Layout padrão
 * - Variant B: Layout aprimorado com botões maiores e visual melhorado
 */

'use client';

import React from 'react';
import { useABTest } from '@/hooks/useABTest';
import BasicCalculator from './BasicCalculator';
import { CalculationResult } from '@/types/medication';

interface ABTestBasicCalculatorProps {
  onCalculationComplete?: (result: CalculationResult) => void;
}

interface CalculatorLayoutConfig {
  buttonSize: 'standard' | 'large';
  showVisualAids: boolean;
  colorScheme: 'default' | 'enhanced';
  spacing: 'compact' | 'comfortable';
}

const ABTestBasicCalculator: React.FC<ABTestBasicCalculatorProps> = ({
  onCalculationComplete
}) => {
  const { variant, loading, trackConversion, isVariant, config } = useABTest(
    'calculator_optimization_v1'
  );

  // Configurações baseadas no variant
  const layoutConfig = variant === 'enhanced' ? {
    buttonSize: 'large',
    showVisualAids: true,
    colorScheme: 'enhanced',
    spacing: 'comfortable'
  } : {
    buttonSize: 'standard',
    showVisualAids: false,
    colorScheme: 'default',
    spacing: 'compact'
  };

  // Handler para quando cálculo é completado - trackear conversão
  const handleCalculationComplete = (result: CalculationResult): void => {
    // Trackear conversão no A/B test
    trackConversion('calculation_completed', 1.0, {
      isValid: result.isValid,
      hasAlerts: result.safetyAlerts.length > 0,
      calculationType: result.regimen || 'unknown'
    });
    
    // Chamar callback original
    if (onCalculationComplete) {
      onCalculationComplete(result);
    }
  };

  // Handler para interações - trackear engagement
  const handleInteraction = (interactionType: string, data?: Record<string, unknown>): void => {
    trackConversion(interactionType, 1.0, {
      variant,
      ...data
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Se não há experimento ativo, usar versão padrão
  if (!variant || !layoutConfig) {
    return <BasicCalculator onCalculationComplete={onCalculationComplete} />;
  }

  // CSS classes baseadas na configuração do variant
  const containerClasses = [
    'basic-calculator-container',
    `spacing-${layoutConfig.spacing}`,
    `color-${layoutConfig.colorScheme}`,
    variant === 'enhanced' ? 'enhanced-variant' : 'control-variant'
  ].join(' ');

  const buttonClasses = [
    'calculator-button',
    `size-${layoutConfig.buttonSize}`,
    layoutConfig.colorScheme === 'enhanced' ? 'enhanced-button' : 'standard-button'
  ].join(' ');

  return (
    <div 
      className={containerClasses}
      onFocus={() => handleInteraction('focus')}
      onBlur={() => handleInteraction('blur')}
    >
      {/* Header do experimento (apenas para desenvolvimento) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          <div className="flex items-center">
            <span className="text-sm font-medium mr-2">🧪 A/B Test Ativo:</span>
            <span className="text-sm">
              Variant: {variant} | Experimento: calculator_optimization_v1
            </span>
          </div>
        </div>
      )}

      {/* Visual aids (apenas no variant enhanced) */}
      {layoutConfig.showVisualAids && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center mb-2">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-3">
              <span className="text-white text-sm">💊</span>
            </div>
            <h3 className="text-lg font-semibold text-blue-900">
              Calculadora de Doses PQT-U
            </h3>
          </div>
          <p className="text-sm text-blue-700">
            Calcule doses personalizadas de Poliquimioterapia Única para tratamento de hanseníase
          </p>
        </div>
      )}

      {/* Wrapper com estilos personalizados */}
      <div className={layoutConfig.spacing === 'comfortable' ? 'space-y-6' : 'space-y-4'}>
        <BasicCalculator 
          onCalculationComplete={handleCalculationComplete}
        />
      </div>

      {/* Feedback adicional para variant enhanced */}
      {layoutConfig.showVisualAids && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <span className="text-green-600 mr-2">✅</span>
            <span className="text-sm text-green-700 font-medium">
              Interface otimizada para melhor usabilidade
            </span>
          </div>
        </div>
      )}

      {/* CSS personalizado baseado no variant */}
      <style jsx>{`
        .basic-calculator-container.enhanced-variant {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }
        
        .basic-calculator-container.control-variant {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
        }
        
        .spacing-comfortable > * {
          margin-bottom: 24px !important;
        }
        
        .spacing-compact > * {
          margin-bottom: 16px !important;
        }
        
        .color-enhanced input,
        .color-enhanced select,
        .color-enhanced button {
          border-radius: 8px !important;
          transition: all 0.2s ease-in-out !important;
        }
        
        .color-enhanced input:focus,
        .color-enhanced select:focus {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1) !important;
        }
        
        .color-enhanced button {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%) !important;
          border: none !important;
          color: white !important;
          font-weight: 600 !important;
          padding: 12px 24px !important;
        }
        
        .color-enhanced button:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3) !important;
        }
        
        .size-large input,
        .size-large select,
        .size-large button {
          font-size: 16px !important;
          padding: 12px 16px !important;
          min-height: 48px !important;
        }
        
        .size-standard input,
        .size-standard select,
        .size-standard button {
          font-size: 14px !important;
          padding: 8px 12px !important;
          min-height: 40px !important;
        }
        
        /* Animações para variant enhanced */
        .enhanced-variant * {
          transition: all 0.2s ease-in-out;
        }
        
        .enhanced-variant .calculator-input:focus {
          transform: scale(1.02);
        }
        
        /* Feedback visual melhorado */
        .enhanced-variant .success-message {
          animation: slideIn 0.3s ease-out;
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default ABTestBasicCalculator;