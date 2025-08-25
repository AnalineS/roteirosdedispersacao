/**
 * Quality Assurance Dashboard
 * Dashboard em tempo real para monitoramento de qualidade educativa
 * 
 * @author Claude Code QA Specialist
 * @version 1.0.0
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import EducationalMonitoringSystem, { 
  EducationalMetrics, 
  QualityAlert,
  MistakePattern 
} from '@/utils/educationalAnalytics';

interface QualityDashboardProps {
  refreshInterval?: number; // ms, default 30000
  showDetailedMetrics?: boolean;
  allowAlertManagement?: boolean;
}

const QualityDashboard: React.FC<QualityDashboardProps> = ({
  refreshInterval = 30000,
  showDetailedMetrics = false,
  allowAlertManagement = false
}) => {
  const [metrics, setMetrics] = useState<EducationalMetrics | null>(null);
  const [alerts, setAlerts] = useState<QualityAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<string>('overview');
  
  const monitoringSystem = EducationalMonitoringSystem.getInstance();
  
  // ===== EFFECTS =====
  
  useEffect(() => {
    // Iniciar monitoramento
    monitoringSystem.startRealTimeMonitoring();
    
    // Carregar dados iniciais
    loadDashboardData();
    
    // Setup refresh interval
    const interval = setInterval(loadDashboardData, refreshInterval);
    
    return () => {
      clearInterval(interval);
      monitoringSystem.stopRealTimeMonitoring();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshInterval]);
  
  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      const currentMetrics = monitoringSystem.getMetrics();
      const activeAlerts = monitoringSystem.getActiveAlerts();
      
      setMetrics(currentMetrics);
      setAlerts(activeAlerts);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // ===== COMPUTED VALUES =====
  
  const overallHealthScore = useMemo(() => {
    if (!metrics) return 0;
    
    const weights = {
      engagement: 0.25,
      learning: 0.25,
      quality: 0.25,
      performance: 0.25
    };
    
    const scores = {
      engagement: metrics.engagement.completionRate * 100,
      learning: metrics.learning.knowledgeRetention * 100,
      quality: metrics.quality.userSatisfaction * 20, // 5-scale to 100-scale
      performance: 100 - (metrics.performance.errorRates.size * 10)
    };
    
    return Math.round(
      scores.engagement * weights.engagement +
      scores.learning * weights.learning +
      scores.quality * weights.quality +
      scores.performance * weights.performance
    );
  }, [metrics]);
  
  const criticalAlerts = useMemo(() => 
    alerts.filter(alert => alert.severity === 'critical'), [alerts]);
  
  const warningAlerts = useMemo(() => 
    alerts.filter(alert => alert.severity === 'warning'), [alerts]);
  
  // ===== EVENT HANDLERS =====
  
  const handleAcknowledgeAlert = (alertId: string) => {
    if (!allowAlertManagement) return;
    
    monitoringSystem.acknowledgeAlert(alertId);
    loadDashboardData();
  };
  
  const handleResolveAlert = (alertId: string) => {
    if (!allowAlertManagement) return;
    
    monitoringSystem.resolveAlert(alertId);
    loadDashboardData();
  };
  
  // ===== RENDER =====
  
  if (isLoading && !metrics) {
    return (
      <div className="qa-dashboard loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Carregando métricas de qualidade...</p>
        </div>
      </div>
    );
  }
  
  if (!metrics) {
    return (
      <div className="qa-dashboard error">
        <h2>Erro ao carregar dashboard</h2>
        <p>Não foi possível carregar as métricas de qualidade.</p>
        <button onClick={loadDashboardData}>Tentar novamente</button>
      </div>
    );
  }
  
  return (
    <div className="qa-dashboard">
      {/* Header com Score Geral */}
      <div className="dashboard-header">
        <div className="overall-health">
          <div className={`health-score ${getHealthScoreClass(overallHealthScore)}`}>
            <span className="score-value">{overallHealthScore}</span>
            <span className="score-label">Score Geral</span>
          </div>
          <div className="health-status">
            <h2>Quality Assurance Dashboard</h2>
            <p>Monitoramento em tempo real da qualidade educativa</p>
          </div>
        </div>
        
        {/* Alertas Críticos */}
        {criticalAlerts.length > 0 && (
          <div className="critical-alerts">
            <div className="alert-indicator critical">
              <span className="alert-count">{criticalAlerts.length}</span>
              <span className="alert-label">Alertas Críticos</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Navigation Tabs */}
      <div className="dashboard-tabs">
        <button 
          className={selectedTab === 'overview' ? 'active' : ''}
          onClick={() => setSelectedTab('overview')}
        >
          Visão Geral
        </button>
        <button 
          className={selectedTab === 'performance' ? 'active' : ''}
          onClick={() => setSelectedTab('performance')}
        >
          Performance
        </button>
        <button 
          className={selectedTab === 'learning' ? 'active' : ''}
          onClick={() => setSelectedTab('learning')}
        >
          Aprendizagem
        </button>
        <button 
          className={selectedTab === 'alerts' ? 'active' : ''}
          onClick={() => setSelectedTab('alerts')}
        >
          Alertas ({alerts.length})
        </button>
      </div>
      
      {/* Tab Content */}
      <div className="dashboard-content">
        {selectedTab === 'overview' && (
          <OverviewTab metrics={metrics} />
        )}
        
        {selectedTab === 'performance' && (
          <PerformanceTab metrics={metrics} />
        )}
        
        {selectedTab === 'learning' && (
          <LearningTab metrics={metrics} />
        )}
        
        {selectedTab === 'alerts' && (
          <AlertsTab 
            alerts={alerts}
            onAcknowledge={handleAcknowledgeAlert}
            onResolve={handleResolveAlert}
            allowManagement={allowAlertManagement}
          />
        )}
      </div>
    </div>
  );
};

// ===== TAB COMPONENTS =====

const OverviewTab: React.FC<{ metrics: EducationalMetrics }> = ({ metrics }) => (
  <div className="overview-tab">
    <div className="metrics-grid">
      <MetricCard
        title="Taxa de Conclusão"
        value={`${(metrics.engagement.completionRate * 100).toFixed(1)}%`}
        trend="up"
        color="green"
        description="Percentual de usuários que completam os casos clínicos"
      />
      
      <MetricCard
        title="Satisfação do Usuário"
        value={`${metrics.quality.userSatisfaction.toFixed(1)}/5`}
        trend="stable"
        color="blue"
        description="Avaliação média da qualidade educativa"
      />
      
      <MetricCard
        title="Tempo de Resposta"
        value={`${metrics.performance.responseTime}ms`}
        trend={metrics.performance.responseTime > 2000 ? 'down' : 'up'}
        color={metrics.performance.responseTime > 2000 ? 'red' : 'green'}
        description="Tempo médio de resposta dos componentes"
      />
      
      <MetricCard
        title="Retenção de Conhecimento"
        value={`${(metrics.learning.knowledgeRetention * 100).toFixed(1)}%`}
        trend="up"
        color="purple"
        description="Capacidade de retenção das competências adquiridas"
      />
    </div>
    
    <div className="engagement-summary">
      <h3>Resumo de Engajamento</h3>
      <div className="engagement-stats">
        <div className="stat">
          <span className="stat-label">Duração Média da Sessão</span>
          <span className="stat-value">{Math.round(metrics.engagement.sessionDuration)} min</span>
        </div>
        <div className="stat">
          <span className="stat-label">Interações por Sessão</span>
          <span className="stat-value">{metrics.engagement.componentInteractions}</span>
        </div>
        <div className="stat">
          <span className="stat-label">Taxa de Retorno</span>
          <span className="stat-value">{(metrics.engagement.returnRate * 100).toFixed(1)}%</span>
        </div>
      </div>
    </div>
  </div>
);

const PerformanceTab: React.FC<{ metrics: EducationalMetrics }> = ({ metrics }) => (
  <div className="performance-tab">
    <div className="performance-metrics">
      <div className="metric-section">
        <h3>Tempos de Carregamento</h3>
        <div className="load-times">
          {metrics.performance.loadTimes.slice(-10).map((time, index) => (
            <div key={index} className="load-time-bar">
              <span className="time-label">Componente {index + 1}</span>
              <div className="time-bar">
                <div 
                  className="time-fill"
                  style={{ 
                    width: `${Math.min(time / 3000 * 100, 100)}%`,
                    backgroundColor: time > 2000 ? '#ef4444' : time > 1000 ? '#f59e0b' : '#10b981'
                  }}
                />
              </div>
              <span className="time-value">{Math.round(time)}ms</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="metric-section">
        <h3>Uso de Recursos</h3>
        <div className="resource-usage">
          <div className="resource-item">
            <span className="resource-label">Memória Peak</span>
            <span className="resource-value">
              {metrics.performance.resourceUsage.memoryPeak.toFixed(1)} MB
            </span>
          </div>
          <div className="resource-item">
            <span className="resource-label">Requisições de Rede</span>
            <span className="resource-value">
              {metrics.performance.resourceUsage.networkRequests}
            </span>
          </div>
          <div className="resource-item">
            <span className="resource-label">Armazenamento</span>
            <span className="resource-value">
              {(metrics.performance.resourceUsage.storageUsed / 1024).toFixed(1)} MB
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const LearningTab: React.FC<{ metrics: EducationalMetrics }> = ({ metrics }) => (
  <div className="learning-tab">
    <div className="learning-metrics">
      <div className="mistake-patterns">
        <h3>Padrões de Erro Comuns</h3>
        {metrics.learning.mistakePatterns.slice(0, 5).map((pattern, index) => (
          <div key={pattern.stepId} className="mistake-pattern">
            <div className="pattern-header">
              <span className="pattern-type">{pattern.mistakeType}</span>
              <span className={`pattern-severity ${pattern.severity}`}>
                {pattern.severity.toUpperCase()}
              </span>
            </div>
            <div className="pattern-stats">
              <span className="frequency">Frequência: {pattern.frequency}</span>
              <span className="step-id">Step: {pattern.stepId}</span>
            </div>
            <div className="pattern-improvements">
              {pattern.suggestedImprovements.map((improvement, idx) => (
                <span key={idx} className="improvement-tag">{improvement}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      <div className="concept-mastery">
        <h3>Domínio de Conceitos</h3>
        <div className="mastery-chart">
          {Array.from(metrics.learning.conceptMastery.entries()).map(([concept, score]) => (
            <div key={concept} className="concept-bar">
              <span className="concept-label">{concept}</span>
              <div className="mastery-bar">
                <div 
                  className="mastery-fill"
                  style={{ 
                    width: `${score * 100}%`,
                    backgroundColor: score > 0.8 ? '#10b981' : score > 0.6 ? '#f59e0b' : '#ef4444'
                  }}
                />
              </div>
              <span className="mastery-score">{(score * 100).toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

const AlertsTab: React.FC<{
  alerts: QualityAlert[];
  onAcknowledge: (id: string) => void;
  onResolve: (id: string) => void;
  allowManagement: boolean;
}> = ({ alerts, onAcknowledge, onResolve, allowManagement }) => (
  <div className="alerts-tab">
    {alerts.length === 0 ? (
      <div className="no-alerts">
        <h3>Nenhum alerta ativo</h3>
        <p>Todas as métricas estão dentro dos parâmetros esperados.</p>
      </div>
    ) : (
      <div className="alerts-list">
        {alerts.map(alert => (
          <AlertCard
            key={alert.id}
            alert={alert}
            onAcknowledge={() => onAcknowledge(alert.id)}
            onResolve={() => onResolve(alert.id)}
            allowActions={allowManagement}
          />
        ))}
      </div>
    )}
  </div>
);

// ===== UTILITY COMPONENTS =====

const MetricCard: React.FC<{
  title: string;
  value: string;
  trend: 'up' | 'down' | 'stable';
  color: string;
  description: string;
}> = ({ title, value, trend, color, description }) => (
  <div className={`metric-card ${color}`}>
    <div className="metric-header">
      <h4>{title}</h4>
      <span className={`trend-indicator ${trend}`}>
        {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'}
      </span>
    </div>
    <div className="metric-value">{value}</div>
    <div className="metric-description">{description}</div>
  </div>
);

const AlertCard: React.FC<{
  alert: QualityAlert;
  onAcknowledge: () => void;
  onResolve: () => void;
  allowActions: boolean;
}> = ({ alert, onAcknowledge, onResolve, allowActions }) => (
  <div className={`alert-card ${alert.severity}`}>
    <div className="alert-header">
      <div className="alert-info">
        <h4>{alert.title}</h4>
        <span className="alert-category">{alert.category}</span>
        <span className="alert-time">
          {alert.timestamp.toLocaleTimeString()}
        </span>
      </div>
      <div className={`alert-severity ${alert.severity}`}>
        {alert.severity.toUpperCase()}
      </div>
    </div>
    
    <div className="alert-description">
      {alert.description}
    </div>
    
    {alert.actions.immediate.length > 0 && (
      <div className="alert-actions-list">
        <strong>Ações Imediatas:</strong>
        <ul>
          {alert.actions.immediate.map((action, index) => (
            <li key={index}>{action}</li>
          ))}
        </ul>
      </div>
    )}
    
    {allowActions && (
      <div className="alert-actions">
        <button 
          className="btn-acknowledge"
          onClick={onAcknowledge}
          disabled={alert.status !== 'active'}
        >
          Reconhecer
        </button>
        <button 
          className="btn-resolve"
          onClick={onResolve}
          disabled={alert.status === 'resolved'}
        >
          Resolver
        </button>
      </div>
    )}
  </div>
);

// ===== UTILITY FUNCTIONS =====

const getHealthScoreClass = (score: number): string => {
  if (score >= 90) return 'excellent';
  if (score >= 80) return 'good';
  if (score >= 70) return 'fair';
  if (score >= 60) return 'poor';
  return 'critical';
};

export default QualityDashboard;