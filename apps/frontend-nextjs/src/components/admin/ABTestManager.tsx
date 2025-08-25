/**
 * A/B Test Manager - ETAPA 5.1
 * Interface administrativa para gestão de experimentos A/B
 * 
 * FUNCIONALIDADES:
 * - Visualizar experimentos ativos
 * - Analisar resultados estatísticos
 * - Controlar status dos experimentos
 * - Exportar relatórios
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import ABTestingFramework, { ABExperiment, ABVariant } from '@/utils/abTesting';

interface ABTestManagerProps {
  allowManagement?: boolean; // Permitir controles administrativos
  showDetailedStats?: boolean; // Mostrar estatísticas detalhadas
}

const ABTestManager: React.FC<ABTestManagerProps> = ({
  allowManagement = true,
  showDetailedStats = true
}) => {
  const [experiments, setExperiments] = useState<ABExperiment[]>([]);
  const [selectedExperiment, setSelectedExperiment] = useState<ABExperiment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const framework = ABTestingFramework.getInstance();
  
  useEffect(() => {
    loadExperiments();
  }, [loadExperiments]);
  
  const loadExperiments = useCallback(() => {
    setIsLoading(true);
    try {
      const activeExperiments = framework.getAllActiveExperiments();
      setExperiments(activeExperiments);
      
      if (activeExperiments.length > 0 && !selectedExperiment) {
        setSelectedExperiment(activeExperiments[0]);
      }
    } catch (error) {
      console.error('Error loading experiments:', error);
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const generateReport = (experimentId: string) => {
    const report = framework.generateExperimentReport(experimentId);
    if (report) {
      // Criar download do relatório
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `experiment-${experimentId}-report.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };
  
  const getStatusColor = (status: ABExperiment['status']) => {
    switch (status) {
      case 'running': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getSignificanceColor = (isSignificant: boolean, uplift?: number) => {
    if (!isSignificant) return 'text-gray-600';
    return uplift && uplift > 0 ? 'text-green-600' : 'text-red-600';
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Gerenciador de Testes A/B
        </h2>
        <p className="text-gray-600">
          Visualize e gerencie experimentos de otimização da plataforma educacional
        </p>
      </div>
      
      {experiments.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🧪</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Nenhum experimento ativo
          </h3>
          <p className="text-gray-600">
            Não há experimentos A/B em execução no momento
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de Experimentos */}
          <div className="lg:col-span-1">
            <h3 className="text-lg font-semibold mb-4">Experimentos Ativos</h3>
            <div className="space-y-3">
              {experiments.map(experiment => (
                <div
                  key={experiment.id}
                  onClick={() => setSelectedExperiment(experiment)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${ 
                    selectedExperiment?.id === experiment.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{experiment.name}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(experiment.status)}`}>
                      {experiment.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {experiment.description}
                  </p>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{experiment.variants.length} variants</span>
                    <span>{experiment.trafficAllocation}% tráfego</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Detalhes do Experimento Selecionado */}
          {selectedExperiment && (
            <div className="lg:col-span-2">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">{selectedExperiment.name}</h3>
                <button
                  onClick={() => generateReport(selectedExperiment.id)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  📊 Exportar Relatório
                </button>
              </div>
              
              {/* Informações Gerais */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-600 mb-1">Métrica Principal</h4>
                  <p className="text-lg font-semibold text-gray-900">{selectedExperiment.primaryMetric}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-600 mb-1">Duração</h4>
                  <p className="text-lg font-semibold text-gray-900">{selectedExperiment.duration} dias</p>
                </div>
              </div>
              
              {/* Variants */}
              <div className="space-y-4">
                <h4 className="text-md font-semibold text-gray-900">Resultados por Variant</h4>
                {selectedExperiment.variants.map(variant => (
                  <div key={variant.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <h5 className="font-medium text-gray-900">{variant.name}</h5>
                        {variant.isControl && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                            Controle
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600">
                        {variant.allocation}% do tráfego
                      </div>
                    </div>
                    
                    {/* Métricas do Variant */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                      <div>
                        <div className="text-2xl font-bold text-gray-900">
                          {variant.metrics.impressions.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600">Impressões</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-900">
                          {variant.metrics.conversions.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-600">Conversões</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-900">
                          {(variant.metrics.conversionRate * 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-600">Taxa de Conversão</div>
                      </div>
                      <div>
                        <div className={`text-2xl font-bold ${getSignificanceColor(
                          variant.metrics.statistical.isSignificant,
                          variant.metrics.statistical.uplift
                        )}`}>
                          {variant.metrics.statistical.uplift 
                            ? (variant.metrics.statistical.uplift > 0 ? '+' : '') + variant.metrics.statistical.uplift.toFixed(1) + '%'
                            : 'N/A'
                          }
                        </div>
                        <div className="text-sm text-gray-600">Uplift</div>
                      </div>
                    </div>
                    
                    {/* Significância Estatística */}
                    {variant.metrics.statistical.pValue && (
                      <div className="bg-gray-50 p-3 rounded">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">
                            Significância Estatística:
                          </span>
                          <div className="flex items-center space-x-2">
                            <span className={`text-sm font-medium ${
                              variant.metrics.statistical.isSignificant 
                                ? 'text-green-600' 
                                : 'text-gray-600'
                            }`}>
                              {variant.metrics.statistical.isSignificant ? '✅ Significante' : '⏳ Não significante'}
                            </span>
                            <span className="text-sm text-gray-600">
                              (p = {variant.metrics.statistical.pValue.toFixed(4)})
                            </span>
                          </div>
                        </div>
                        
                        {variant.metrics.statistical.confidenceInterval && (
                          <div className="mt-2 text-sm text-gray-600">
                            IC 95%: [{variant.metrics.statistical.confidenceInterval[0].toFixed(3)}, {variant.metrics.statistical.confidenceInterval[1].toFixed(3)}]
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Métricas Educacionais (se disponíveis) */}
                    {showDetailedStats && (
                      <details className="mt-3">
                        <summary className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-700">
                          Ver métricas educacionais detalhadas
                        </summary>
                        <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="font-medium text-gray-900">
                              {variant.metrics.educationalMetrics.completionRate.toFixed(1)}%
                            </div>
                            <div className="text-gray-600">Taxa de Conclusão</div>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {variant.metrics.educationalMetrics.averageScore.toFixed(1)}
                            </div>
                            <div className="text-gray-600">Score Médio</div>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {variant.metrics.educationalMetrics.timeToCompletion.toFixed(0)}min
                            </div>
                            <div className="text-gray-600">Tempo Médio</div>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {variant.metrics.educationalMetrics.satisfactionScore.toFixed(1)}/5
                            </div>
                            <div className="text-gray-600">Satisfação</div>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {(variant.metrics.educationalMetrics.errorRate * 100).toFixed(1)}%
                            </div>
                            <div className="text-gray-600">Taxa de Erro</div>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">
                              {variant.metrics.engagement.interactions}
                            </div>
                            <div className="text-gray-600">Interações</div>
                          </div>
                        </div>
                      </details>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Recomendações */}
              <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-2">💡 Recomendações</h4>
                {(() => {
                  const report = framework.generateExperimentReport(selectedExperiment.id);
                  return report?.recommendations.map((recommendation, index) => (
                    <p key={index} className="text-sm text-yellow-700 mb-1">
                      • {recommendation}
                    </p>
                  )) || <p className="text-sm text-yellow-700">Sem recomendações disponíveis</p>;
                })()}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ABTestManager;