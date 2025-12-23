/**
 * Dashboard Unificado de Monitoramento UX
 * Integra todos os sistemas de monitoramento em uma interface única
 * Conecta com o UXMonitoringManager do backend
 * 
 * Data: 09 de Janeiro de 2025
 * Fase: Ativação de Monitoramento UX
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Users, Clock, Target, Heart } from 'lucide-react';

interface UXMetrics {
  avg_response_time_ms: number;
  p95_response_time_ms: number;
  cache_hit_rate: number;
  total_sessions: number;
  avg_session_duration_sec: number;
  bounce_rate: number;
  pages_per_session: number;
  error_rate: number;
  critical_errors: number;
  user_satisfaction: number;
  persona_dr_gasnelio_usage: number;
  persona_ga_usage: number;
  medical_queries_count: number;
  rag_success_rate: number;
  accessibility_score: number;
  wcag_violations: number;
  screen_reader_usage: number;
  lcp_avg: number;
  fid_avg: number;
  cls_avg: number;
  web_vitals_score: number;
}

interface UXAlert {
  id: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  title: string;
  description: string;
  metrics: Record<string, unknown>;
  auto_resolved: boolean;
}

interface DashboardData {
  current_metrics: UXMetrics;
  alerts: {
    active_count: number;
    critical_count: number;
    recent: UXAlert[];
  };
  top_pages: [string, number][];
  hourly_metrics: Array<{
    hour: string;
    avg_response_time: number;
    error_count: number;
    request_count: number;
  }>;
  realtime_stats: Record<string, unknown>;
  system_health: {
    score: number;
    status: string;
    last_updated: string;
  };
  recommendations: string[];
}

interface UXDashboardProps {
  refreshInterval?: number;
  compact?: boolean;
  showAlerts?: boolean;
  showRecommendations?: boolean;
}

const UXDashboard: React.FC<UXDashboardProps> = ({
  refreshInterval = 30000, // 30s
  compact = false,
  showAlerts = true,
  showRecommendations = true
}) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Fetch data from backend
  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/usability/monitor');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setData(result.usability_report || result.data);
        setError(null);
        setLastUpdated(new Date());
      } else {
        setError(result.error || 'Erro ao carregar dados');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro de conexão');

      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'ux_dashboard_fetch_error', {
          event_category: 'medical_system_monitoring',
          event_label: 'dashboard_data_load_failed',
          custom_parameters: {
            medical_context: 'ux_monitoring_dashboard',
            error_type: 'data_fetch_failure',
            error_message: err instanceof Error ? err.message : String(err)
          }
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load and periodic updates
  useEffect(() => {
    fetchDashboardData();
    
    const interval = setInterval(fetchDashboardData, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchDashboardData, refreshInterval]);

  // Helper functions
  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds.toFixed(0)}s`;
    if (seconds < 3600) return `${(seconds / 60).toFixed(1)}m`;
    return `${(seconds / 3600).toFixed(1)}h`;
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-50';
      case 'good': return 'text-blue-600 bg-blue-50';
      case 'fair': return 'text-yellow-600 bg-yellow-50';
      case 'poor': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return 'text-red-700 bg-red-100';
      case 'high': return 'text-orange-700 bg-orange-100';
      case 'medium': return 'text-yellow-700 bg-yellow-100';
      case 'low': return 'text-blue-700 bg-blue-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const getWebVitalsRating = (score: number): { color: string; label: string } => {
    if (score >= 90) return { color: 'text-green-600', label: 'Excelente' };
    if (score >= 75) return { color: 'text-blue-600', label: 'Bom' };
    if (score >= 50) return { color: 'text-yellow-600', label: 'Precisa Melhorar' };
    return { color: 'text-red-600', label: 'Crítico' };
  };

  if (loading) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <div className="text-center py-8">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Erro ao Carregar Dashboard
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {error || 'Não foi possível carregar os dados de monitoramento'}
          </p>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  const { current_metrics, alerts, system_health, recommendations } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Dashboard de Monitoramento UX
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {lastUpdated && `Última atualização: ${lastUpdated.toLocaleTimeString()}`}
          </p>
        </div>
        
        {/* System Health Badge */}
        <div className={`px-4 py-2 rounded-lg ${getStatusColor(system_health.status)}`}>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              system_health.status === 'excellent' ? 'bg-green-500' :
              system_health.status === 'good' ? 'bg-blue-500' :
              system_health.status === 'fair' ? 'bg-yellow-500' : 'bg-red-500'
            }`}></div>
            <span className="font-semibold">
              {system_health.score}/100 - {system_health.status}
            </span>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Response Time */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tempo Resposta</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {current_metrics.avg_response_time_ms?.toFixed(0) || 0}ms
              </p>
            </div>
            <Clock className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        {/* Active Users */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Sessões Ativas</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {current_metrics.total_sessions || 0}
              </p>
            </div>
            <Users className="w-8 h-8 text-green-500" />
          </div>
        </div>

        {/* Error Rate */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Taxa de Erro</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {current_metrics.error_rate?.toFixed(1) || 0}%
              </p>
            </div>
            <AlertTriangle className={`w-8 h-8 ${
              current_metrics.error_rate > 5 ? 'text-red-500' : 
              current_metrics.error_rate > 2 ? 'text-yellow-500' : 'text-green-500'
            }`} />
          </div>
        </div>

        {/* User Satisfaction */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Satisfação</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {current_metrics.user_satisfaction?.toFixed(1) || 'N/A'}
                {current_metrics.user_satisfaction > 0 && '/5'}
              </p>
            </div>
            <Heart className={`w-8 h-8 ${
              current_metrics.user_satisfaction >= 4 ? 'text-red-500' :
              current_metrics.user_satisfaction >= 3 ? 'text-yellow-500' : 'text-gray-400'
            }`} />
          </div>
        </div>
      </div>

      {/* Web Vitals & Performance */}
      {!compact && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Web Vitals */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Core Web Vitals
            </h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Score Geral</span>
                  <span className={`font-semibold ${getWebVitalsRating(current_metrics.web_vitals_score).color}`}>
                    {current_metrics.web_vitals_score?.toFixed(0) || 0}/100
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, current_metrics.web_vitals_score || 0)}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <p className="text-gray-600 dark:text-gray-400">LCP</p>
                  <p className="font-semibold">{(current_metrics.lcp_avg || 0).toFixed(0)}ms</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-600 dark:text-gray-400">FID</p>
                  <p className="font-semibold">{(current_metrics.fid_avg || 0).toFixed(0)}ms</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-600 dark:text-gray-400">CLS</p>
                  <p className="font-semibold">{(current_metrics.cls_avg || 0).toFixed(3)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Medical Usage */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Uso das Personas Médicas
            </h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Dr. Gasnelio</span>
                <span className="font-semibold text-blue-600">
                  {current_metrics.persona_dr_gasnelio_usage || 0} consultas
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Gá</span>
                <span className="font-semibold text-green-600">
                  {current_metrics.persona_ga_usage || 0} consultas
                </span>
              </div>
              
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">Taxa de Sucesso RAG</span>
                  <span className="font-semibold text-purple-600">
                    {current_metrics.rag_success_rate?.toFixed(1) || 95}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alerts Section */}
      {showAlerts && alerts.active_count > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Alertas Ativos ({alerts.active_count})
            </h3>
            {alerts.critical_count > 0 && (
              <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-sm font-semibold">
                {alerts.critical_count} Críticos
              </span>
            )}
          </div>
          
          <div className="space-y-2">
            {alerts.recent.slice(0, 5).map((alert) => (
              <div 
                key={alert.id}
                className={`p-3 rounded-lg border-l-4 ${
                  alert.severity === 'critical' ? 'border-red-500 bg-red-50' :
                  alert.severity === 'high' ? 'border-orange-500 bg-orange-50' :
                  alert.severity === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                  'border-blue-500 bg-blue-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{alert.title}</h4>
                    <p className="text-gray-600 text-sm mt-1">{alert.description}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${getSeverityColor(alert.severity)}`}>
                    {alert.severity.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {showRecommendations && recommendations.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Recomendações de UX
          </h3>
          
          <div className="space-y-3">
            {recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start space-x-3">
                <Target className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <p className="text-gray-600 dark:text-gray-400">{recommendation}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Session Stats */}
      {!compact && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Duração Média</h4>
            <p className="text-2xl font-bold text-blue-600">
              {formatDuration(current_metrics.avg_session_duration_sec || 0)}
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Taxa de Rejeição</h4>
            <p className="text-2xl font-bold text-orange-600">
              {current_metrics.bounce_rate?.toFixed(1) || 0}%
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Páginas/Sessão</h4>
            <p className="text-2xl font-bold text-green-600">
              {current_metrics.pages_per_session?.toFixed(1) || 0}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default UXDashboard;