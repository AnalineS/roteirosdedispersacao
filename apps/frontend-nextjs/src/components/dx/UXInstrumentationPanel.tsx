'use client';

import React, { useState, useEffect } from 'react';
import { getUXInstrumentation, initializeUXInstrumentation, type UXEvent, type PerformanceMetric, type AccessibilityViolation } from '@/utils/dx/uxInstrumentation';

interface UXInstrumentationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UXInstrumentationPanel({ isOpen, onClose }: UXInstrumentationPanelProps) {
  const [instrumentationData, setInstrumentationData] = useState<any>(null);
  const [selectedTab, setSelectedTab] = useState<'summary' | 'events' | 'metrics' | 'violations' | 'export'>('summary');
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize instrumentation and load data
  useEffect(() => {
    if (isOpen) {
      let instrumentation = getUXInstrumentation();
      if (!instrumentation) {
        instrumentation = initializeUXInstrumentation({
          enableConsoleLogging: process.env.NODE_ENV === 'development',
          sampleRate: 1.0
        });
        setIsInitialized(true);
      }
      loadData();
    }
  }, [isOpen]);

  const loadData = () => {
    const instrumentation = getUXInstrumentation();
    if (instrumentation) {
      const summary = instrumentation.getSummary();
      const events = instrumentation.getEvents();
      const metrics = instrumentation.getMetrics();
      const violations = instrumentation.getViolations();

      setInstrumentationData({
        summary,
        events: events.slice(-50), // Show last 50 events
        metrics: metrics.slice(-50),
        violations: violations.slice(-20)
      });
    }
  };

  const handleClearData = () => {
    const instrumentation = getUXInstrumentation();
    if (instrumentation) {
      instrumentation.clearData();
      loadData();
    }
  };

  const handleExportData = () => {
    const instrumentation = getUXInstrumentation();
    if (instrumentation) {
      const data = instrumentation.exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ux-instrumentation-${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR');
  };

  const getEventIcon = (type: string) => {
    const icons = {
      click: '👆',
      scroll: '📜',
      focus: '🎯',
      blur: '😶‍🌫️',
      input: '⌨️',
      error: '🚨',
      render: '🎨',
      navigation: '🧭'
    };
    return icons[type as keyof typeof icons] || '📊';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#dc2626';
      case 'high': return '#ea580c';
      case 'medium': return '#d97706';
      case 'low': return '#65a30d';
      default: return '#6b7280';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="ux-instrumentation-panel">
      <div className="instrumentation-overlay" onClick={onClose} />
      <div className="instrumentation-content">
        <div className="instrumentation-header">
          <div className="header-content">
            <h2>🔧 UX Instrumentation</h2>
            <p>Developer Experience - Monitoramento UX em tempo real</p>
            {isInitialized && (
              <small className="init-badge">✅ Instrumentação ativada nesta sessão</small>
            )}
          </div>
          <div className="header-actions">
            <button onClick={loadData} className="refresh-btn">
              🔄 Atualizar
            </button>
            <button onClick={handleClearData} className="clear-btn">
              🗑️ Limpar
            </button>
            <button onClick={onClose} className="close-btn">✕</button>
          </div>
        </div>

        <div className="instrumentation-body">
          {instrumentationData ? (
            <>
              {/* Navigation Tabs */}
              <div className="instrumentation-tabs">
                <button 
                  className={`tab-btn ${selectedTab === 'summary' ? 'active' : ''}`}
                  onClick={() => setSelectedTab('summary')}
                >
                  📊 Resumo
                </button>
                <button 
                  className={`tab-btn ${selectedTab === 'events' ? 'active' : ''}`}
                  onClick={() => setSelectedTab('events')}
                >
                  🎯 Eventos ({instrumentationData.events.length})
                </button>
                <button 
                  className={`tab-btn ${selectedTab === 'metrics' ? 'active' : ''}`}
                  onClick={() => setSelectedTab('metrics')}
                >
                  ⚡ Métricas ({instrumentationData.metrics.length})
                </button>
                <button 
                  className={`tab-btn ${selectedTab === 'violations' ? 'active' : ''}`}
                  onClick={() => setSelectedTab('violations')}
                >
                  ♿ A11y ({instrumentationData.violations.length})
                </button>
                <button 
                  className={`tab-btn ${selectedTab === 'export' ? 'active' : ''}`}
                  onClick={() => setSelectedTab('export')}
                >
                  📤 Exportar
                </button>
              </div>

              {/* Tab Content */}
              <div className="tab-content">
                {selectedTab === 'summary' && (
                  <div className="summary-tab">
                    <div className="metrics-overview">
                      <div className="metric-card">
                        <div className="metric-icon">🎯</div>
                        <div className="metric-content">
                          <div className="metric-value">{instrumentationData.summary.totalEvents}</div>
                          <div className="metric-label">Eventos UX</div>
                        </div>
                      </div>

                      <div className="metric-card">
                        <div className="metric-icon">⚡</div>
                        <div className="metric-content">
                          <div className="metric-value">{instrumentationData.summary.performanceIssues}</div>
                          <div className="metric-label">Issues Performance</div>
                        </div>
                      </div>

                      <div className="metric-card">
                        <div className="metric-icon">♿</div>
                        <div className="metric-content">
                          <div className="metric-value">{instrumentationData.summary.accessibilityScore}</div>
                          <div className="metric-label">Score A11y</div>
                        </div>
                      </div>

                      <div className="metric-card">
                        <div className="metric-icon">⏱️</div>
                        <div className="metric-content">
                          <div className="metric-value">{Math.round(instrumentationData.summary.averageSessionTime / 1000)}s</div>
                          <div className="metric-label">Tempo Sessão</div>
                        </div>
                      </div>
                    </div>

                    <div className="top-events-section">
                      <h3>📈 Top Eventos da Sessão</h3>
                      <div className="events-chart">
                        {instrumentationData.summary.topEvents.map((event: { type: string; count: number; [key: string]: unknown }, index: number) => (
                          <div key={event.type} className="event-bar">
                            <div className="event-info">
                              <span className="event-icon">{getEventIcon(event.type)}</span>
                              <span className="event-type">{event.type}</span>
                            </div>
                            <div className="event-bar-container">
                              <div 
                                className="event-bar-fill"
                                style={{ 
                                  width: `${(event.count / instrumentationData.summary.topEvents[0].count) * 100}%`,
                                  backgroundColor: `hsl(${index * 45}, 70%, 60%)`
                                }}
                              />
                              <span className="event-count">{event.count}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {instrumentationData.summary.performanceIssues > 0 && (
                      <div className="performance-alerts">
                        <h3>⚠️ Alertas de Performance</h3>
                        <div className="alert-card warning">
                          <div className="alert-icon">🐌</div>
                          <div className="alert-content">
                            <div className="alert-title">Tasks Lentas Detectadas</div>
                            <div className="alert-description">
                              {instrumentationData.summary.performanceIssues} tasks &gt; 50ms detectadas
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {selectedTab === 'events' && (
                  <div className="events-tab">
                    <div className="events-list">
                      {instrumentationData.events.length === 0 ? (
                        <div className="empty-state">
                          <div className="empty-icon">🎯</div>
                          <p>Nenhum evento UX capturado ainda</p>
                          <small>Interaja com a página para ver eventos aqui</small>
                        </div>
                      ) : (
                        instrumentationData.events.map((event: UXEvent, index: number) => (
                          <div key={index} className="event-item">
                            <div className="event-header">
                              <div className="event-type-info">
                                <span className="event-icon">{getEventIcon(event.type)}</span>
                                <span className="event-type">{event.type}</span>
                                {event.element && (
                                  <span className="event-element">{event.element}</span>
                                )}
                              </div>
                              <span className="event-time">{formatTimestamp(event.timestamp)}</span>
                            </div>
                            {event.data && (
                              <div className="event-data">
                                <pre>{JSON.stringify(event.data, null, 2)}</pre>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {selectedTab === 'metrics' && (
                  <div className="metrics-tab">
                    <div className="metrics-list">
                      {instrumentationData.metrics.length === 0 ? (
                        <div className="empty-state">
                          <div className="empty-icon">⚡</div>
                          <p>Nenhuma métrica de performance capturada</p>
                        </div>
                      ) : (
                        instrumentationData.metrics.map((metric: PerformanceMetric, index: number) => (
                          <div key={index} className="metric-item">
                            <div className="metric-header">
                              <div className="metric-name">{metric.name}</div>
                              <div className="metric-value-display">
                                {metric.value.toFixed(metric.unit === 'bytes' ? 0 : 2)} {metric.unit}
                              </div>
                            </div>
                            <div className="metric-time">{formatTimestamp(metric.timestamp)}</div>
                            {metric.context && (
                              <div className="metric-context">
                                <small>{JSON.stringify(metric.context)}</small>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {selectedTab === 'violations' && (
                  <div className="violations-tab">
                    <div className="violations-list">
                      {instrumentationData.violations.length === 0 ? (
                        <div className="empty-state">
                          <div className="empty-icon">♿</div>
                          <p>Nenhuma violação de acessibilidade detectada</p>
                          <small>Excelente! A página está seguindo boas práticas de A11y</small>
                        </div>
                      ) : (
                        instrumentationData.violations.map((violation: AccessibilityViolation, index: number) => (
                          <div key={index} className="violation-item">
                            <div className="violation-header">
                              <div className="violation-type-info">
                                <span 
                                  className="violation-severity"
                                  style={{ backgroundColor: getSeverityColor(violation.severity) }}
                                >
                                  {violation.severity.toUpperCase()}
                                </span>
                                <span className="violation-type">{violation.type}</span>
                                <span className="violation-element">{violation.element}</span>
                              </div>
                              <span className="violation-time">{formatTimestamp(violation.timestamp)}</span>
                            </div>
                            <div className="violation-description">
                              {violation.description}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {selectedTab === 'export' && (
                  <div className="export-tab">
                    <div className="export-section">
                      <h3>📤 Exportar Dados de Instrumentação</h3>
                      <p>Exporte todos os dados coletados para análise offline</p>
                      
                      <div className="export-stats">
                        <div className="stat-item">
                          <span className="stat-label">Eventos:</span>
                          <span className="stat-value">{instrumentationData.summary.totalEvents}</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">Métricas:</span>
                          <span className="stat-value">{instrumentationData.summary.totalMetrics}</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">Violações:</span>
                          <span className="stat-value">{instrumentationData.summary.totalViolations}</span>
                        </div>
                      </div>

                      <div className="export-actions">
                        <button onClick={handleExportData} className="export-btn">
                          📁 Exportar JSON
                        </button>
                        <p className="export-note">
                          O arquivo incluirá todos os dados da sessão atual com timestamps e contexto completo.
                        </p>
                      </div>

                      <div className="developer-notes">
                        <h4>🔧 Para Desenvolvedores</h4>
                        <p>Esta instrumentação coleta:</p>
                        <ul>
                          <li>Interações do usuário (clicks, scroll, focus)</li>
                          <li>Métricas de performance (long tasks, memory)</li>
                          <li>Violações de acessibilidade automáticas</li>
                          <li>Erros JavaScript e Promise rejections</li>
                          <li>Dados de renderização React</li>
                        </ul>
                        <p>Use estes dados para identificar padrões de uso e otimizar a UX.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="loading-state">
              <div className="loading-icon">🔧</div>
              <p>Inicializando instrumentação UX...</p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .ux-instrumentation-panel {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .instrumentation-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
        }

        .instrumentation-content {
          position: relative;
          width: min(95vw, 1200px);
          max-height: 90vh;
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
          display: flex;
          flex-direction: column;
        }

        .instrumentation-header {
          padding: 24px;
          background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
          color: white;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .header-content h2 {
          margin: 0 0 4px 0;
          font-size: 20px;
          font-weight: 700;
        }

        .header-content p {
          margin: 0 0 8px 0;
          color: #d1d5db;
          font-size: 14px;
        }

        .init-badge {
          background: #10b981;
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
        }

        .header-actions {
          display: flex;
          gap: 12px;
        }

        .refresh-btn, .clear-btn, .close-btn {
          padding: 8px 16px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .refresh-btn {
          background: #3b82f6;
          color: white;
        }

        .clear-btn {
          background: #ef4444;
          color: white;
        }

        .close-btn {
          background: rgba(255, 255, 255, 0.2);
          color: white;
        }

        .instrumentation-body {
          flex: 1;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .instrumentation-tabs {
          display: flex;
          background: #f3f4f6;
          border-bottom: 1px solid #e5e7eb;
        }

        .tab-btn {
          flex: 1;
          padding: 12px 16px;
          border: none;
          background: transparent;
          font-size: 14px;
          font-weight: 500;
          color: #6b7280;
          cursor: pointer;
          border-bottom: 3px solid transparent;
          transition: all 0.2s ease;
        }

        .tab-btn.active {
          color: #1f2937;
          background: white;
          border-bottom-color: #3b82f6;
        }

        .tab-content {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
        }

        .metrics-overview {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .metric-card {
          background: #f8fafc;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .metric-icon {
          font-size: 32px;
          line-height: 1;
        }

        .metric-value {
          font-size: 24px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 4px;
        }

        .metric-label {
          font-size: 12px;
          color: #6b7280;
        }

        .top-events-section {
          margin-bottom: 24px;
        }

        .top-events-section h3 {
          margin: 0 0 16px 0;
          font-size: 16px;
          color: #1f2937;
        }

        .events-chart {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .event-bar {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .event-info {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 120px;
        }

        .event-type {
          font-size: 14px;
          font-weight: 500;
          color: #374151;
        }

        .event-bar-container {
          flex: 1;
          position: relative;
          height: 24px;
          background: #f3f4f6;
          border-radius: 12px;
          display: flex;
          align-items: center;
        }

        .event-bar-fill {
          height: 100%;
          border-radius: 12px;
          transition: width 0.3s ease;
        }

        .event-count {
          position: absolute;
          right: 8px;
          font-size: 12px;
          font-weight: 600;
          color: #1f2937;
        }

        .performance-alerts {
          padding: 16px;
          background: #fffbeb;
          border: 1px solid #fbbf24;
          border-radius: 8px;
        }

        .performance-alerts h3 {
          margin: 0 0 12px 0;
          color: #92400e;
        }

        .alert-card {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .alert-icon {
          font-size: 24px;
        }

        .alert-title {
          font-weight: 600;
          color: #92400e;
          margin-bottom: 2px;
        }

        .alert-description {
          font-size: 14px;
          color: #a16207;
        }

        .events-list, .metrics-list, .violations-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .event-item, .metric-item, .violation-item {
          background: #f8fafc;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
        }

        .event-header, .metric-header, .violation-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .event-type-info {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .event-element {
          font-size: 12px;
          background: #e5e7eb;
          color: #374151;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .event-time {
          font-size: 12px;
          color: #6b7280;
        }

        .event-data {
          background: #f1f5f9;
          border-radius: 4px;
          padding: 8px;
          margin-top: 8px;
        }

        .event-data pre {
          font-size: 11px;
          margin: 0;
          white-space: pre-wrap;
          color: #334155;
        }

        .violation-type-info {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .violation-severity {
          font-size: 10px;
          font-weight: 700;
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .violation-description {
          color: #374151;
          font-size: 14px;
          line-height: 1.4;
        }

        .export-section {
          max-width: 600px;
          margin: 0 auto;
          text-align: center;
        }

        .export-section h3 {
          margin: 0 0 8px 0;
          font-size: 18px;
          color: #1f2937;
        }

        .export-section p {
          color: #6b7280;
          margin-bottom: 24px;
        }

        .export-stats {
          display: flex;
          justify-content: space-around;
          background: #f8fafc;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .stat-label {
          font-size: 12px;
          color: #6b7280;
        }

        .stat-value {
          font-size: 18px;
          font-weight: 700;
          color: #1f2937;
        }

        .export-actions {
          margin-bottom: 32px;
        }

        .export-btn {
          background: #10b981;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .export-btn:hover {
          background: #059669;
        }

        .export-note {
          margin-top: 12px;
          font-size: 14px;
          color: #6b7280;
        }

        .developer-notes {
          text-align: left;
          background: #f1f5f9;
          padding: 20px;
          border-radius: 8px;
        }

        .developer-notes h4 {
          margin: 0 0 12px 0;
          color: #1e40af;
        }

        .developer-notes ul {
          margin: 12px 0;
          padding-left: 20px;
        }

        .developer-notes li {
          margin-bottom: 4px;
          font-size: 14px;
          color: #374151;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #6b7280;
        }

        .empty-icon, .loading-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .loading-state {
          text-align: center;
          padding: 60px 20px;
        }

        @media (max-width: 768px) {
          .instrumentation-content {
            width: 95vw;
            height: 90vh;
            margin: 20px;
          }

          .metrics-overview {
            grid-template-columns: repeat(2, 1fr);
          }

          .tab-btn {
            font-size: 12px;
            padding: 10px 8px;
          }
        }
      `}</style>
    </div>
  );
}