'use client';

import React, { useState, useEffect } from 'react';
import { getCurrentPerformanceData } from './EnhancedCoreWebVitals';

interface PerformanceMetrics {
  [key: string]: {
    current: number;
    average: number;
    trend: 'up' | 'down' | 'stable';
    rating: 'good' | 'needs-improvement' | 'poor';
    samples: number;
  };
}

interface WebVitalsDashboardProps {
  showInDevelopment?: boolean;
  compactMode?: boolean;
}

export default function WebVitalsDashboard({ 
  showInDevelopment = true, 
  compactMode = false 
}: WebVitalsDashboardProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({});
  const [isVisible, setIsVisible] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Only show in development or when explicitly enabled
  useEffect(() => {
    if (process.env.NODE_ENV === 'production' && !showInDevelopment) {
      return;
    }
    const updateMetrics = () => {
      try {
        const performanceData = getCurrentPerformanceData();
        if (performanceData.length === 0) return;

        const metricsMap: PerformanceMetrics = Object.create(null);
        
        performanceData.forEach(entry => {
          entry.metrics.forEach(metric => {
            // Validate metric name to prevent prototype pollution
            const metricName = String(metric.name);
            if (!metricName || typeof metricName !== 'string' || metricName.includes('__proto__') || metricName.includes('constructor') || metricName.includes('prototype')) {
              return; // Skip invalid or dangerous property names
            }
            
            if (!Object.prototype.hasOwnProperty.call(metricsMap, metricName)) {
              metricsMap[metricName] = {
                current: metric.value,
                average: 0,
                trend: 'stable',
                rating: metric.rating,
                samples: 0
              };
            }
            
            const existing = metricsMap[metricName];
            existing.samples += 1;
            existing.average = (existing.average * (existing.samples - 1) + metric.value) / existing.samples;
            existing.current = metric.value;
            existing.rating = metric.rating;
            
            // Determine trend (simplified)
            if (existing.samples > 1) {
              if (metric.value > existing.average * 1.1) {
                existing.trend = metricName === 'CLS' ? 'up' : 'down'; // Higher is worse for most metrics
              } else if (metric.value < existing.average * 0.9) {
                existing.trend = metricName === 'CLS' ? 'down' : 'up'; // Lower is better for most metrics
              } else {
                existing.trend = 'stable';
              }
            }
          });
        });

        setMetrics(metricsMap);
        setLastUpdate(new Date());
      } catch (error) {
        console.warn('Failed to update metrics:', error);
      }
    };

    // Initial load
    updateMetrics();

    // Update every 5 seconds
    const interval = setInterval(updateMetrics, 5000);

    return () => clearInterval(interval);
  }, [showInDevelopment]);

  // Early return for production unless explicitly shown
  if (process.env.NODE_ENV === 'production' && !showInDevelopment) {
    return null;
  }

  // Get metric color based on rating
  const getMetricColor = (rating: string) => {
    switch (rating) {
      case 'good': return '#059669';
      case 'needs-improvement': return '#d97706';
      case 'poor': return '#dc2626';
      default: return '#6b7280';
    }
  };

  // Get trend icon
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      case 'stable': return '➡️';
      default: return '📊';
    }
  };

  // Format metric value
  const formatMetricValue = (name: string, value: number) => {
    switch (name) {
      case 'CLS':
        return value.toFixed(3);
      case 'LCP':
      case 'FCP':
      case 'FID':
      case 'INP':
      case 'TTFB':
        return `${Math.round(value)}ms`;
      default:
        return value.toFixed(1);
    }
  };

  // Get metric description
  const getMetricDescription = (name: string) => {
    const descriptions: { [key: string]: string } = {
      'CLS': 'Cumulative Layout Shift - Estabilidade visual',
      'LCP': 'Largest Contentful Paint - Velocidade de carregamento',
      'FCP': 'First Contentful Paint - Primeira renderização',
      'FID': 'First Input Delay - Interatividade',
      'INP': 'Interaction to Next Paint - Responsividade',
      'TTFB': 'Time to First Byte - Tempo de resposta do servidor'
    };
    return descriptions[name] || name;
  };

  if (Object.keys(metrics).length === 0) {
    return (
      <div className="web-vitals-dashboard placeholder">
        <div className="dashboard-header">
          <h3>📊 Core Web Vitals</h3>
          <button 
            onClick={() => setIsVisible(!isVisible)}
            className="toggle-button"
            aria-label="Toggle dashboard visibility"
          >
            {isVisible ? '▼' : '▶'}
          </button>
        </div>
        {isVisible && (
          <div className="dashboard-content">
            <p>Aguardando dados de performance...</p>
            <small>As métricas aparecerão conforme você navega no site.</small>
          </div>
        )}
        <style jsx>{getDashboardStyles()}</style>
      </div>
    );
  }

  return (
    <div className={`web-vitals-dashboard ${compactMode ? 'compact' : ''}`}>
      <div className="dashboard-header">
        <h3>📊 Core Web Vitals</h3>
        <div className="header-controls">
          {lastUpdate && (
            <span className="last-update">
              {lastUpdate.toLocaleTimeString('pt-BR')}
            </span>
          )}
          <button 
            onClick={() => setIsVisible(!isVisible)}
            className="toggle-button"
            aria-label="Toggle dashboard visibility"
          >
            {isVisible ? '▼' : '▶'}
          </button>
        </div>
      </div>

      {isVisible && (
        <div className="dashboard-content">
          <div className="metrics-grid">
            {Object.entries(metrics).map(([name, data]) => (
              <div key={name} className="metric-card">
                <div className="metric-header">
                  <span className="metric-name">{name}</span>
                  <span className="metric-trend" title={`Tendência: ${data.trend}`}>
                    {getTrendIcon(data.trend)}
                  </span>
                </div>
                
                <div className="metric-value">
                  <span 
                    className="value"
                    style={{ color: getMetricColor(data.rating) }}
                  >
                    {formatMetricValue(name, data.current)}
                  </span>
                  <span className="rating" style={{ color: getMetricColor(data.rating) }}>
                    {data.rating.replace('-', ' ')}
                  </span>
                </div>

                <div className="metric-details">
                  <div className="detail-row">
                    <span className="detail-label">Média:</span>
                    <span className="detail-value">
                      {formatMetricValue(name, data.average)}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Amostras:</span>
                    <span className="detail-value">{data.samples}</span>
                  </div>
                </div>

                <div className="metric-description">
                  {getMetricDescription(name)}
                </div>
              </div>
            ))}
          </div>

          <div className="dashboard-footer">
            <div className="ga4-info">
              <span className="ga-icon">📈</span>
              <span className="ga-text">
                Dados enviados automaticamente para Google Analytics 4
              </span>
            </div>
            <div className="legend">
              <span className="legend-item good">🟢 Bom</span>
              <span className="legend-item warning">🟡 Precisa melhorar</span>
              <span className="legend-item poor">🔴 Ruim</span>
            </div>
          </div>
        </div>
      )}

      <style jsx>{getDashboardStyles()}</style>
    </div>
  );
}

function getDashboardStyles() {
  return `
    .web-vitals-dashboard {
      position: fixed;
      top: 20px;
      right: 20px;
      width: 400px;
      max-width: calc(100vw - 40px);
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      z-index: 9999;
      transition: all 0.3s ease;
    }

    .web-vitals-dashboard.compact {
      width: 300px;
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid #f3f4f6;
      background: #f8fafc;
      border-radius: 12px 12px 0 0;
    }

    .dashboard-header h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
    }

    .header-controls {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .last-update {
      font-size: 12px;
      color: #6b7280;
      font-weight: 500;
    }

    .toggle-button {
      background: none;
      border: none;
      font-size: 14px;
      color: #6b7280;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      transition: all 0.2s ease;
    }

    .toggle-button:hover {
      background: #f3f4f6;
      color: #374151;
    }

    .dashboard-content {
      padding: 20px;
      max-height: 600px;
      overflow-y: auto;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 16px;
      margin-bottom: 20px;
    }

    .compact .metrics-grid {
      grid-template-columns: 1fr;
      gap: 12px;
    }

    .metric-card {
      background: #f8fafc;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
      transition: all 0.2s ease;
    }

    .metric-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .metric-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .metric-name {
      font-weight: 700;
      font-size: 13px;
      color: #374151;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .metric-trend {
      font-size: 16px;
    }

    .metric-value {
      margin-bottom: 12px;
    }

    .value {
      display: block;
      font-size: 24px;
      font-weight: 800;
      line-height: 1;
      margin-bottom: 4px;
    }

    .rating {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .metric-details {
      margin-bottom: 12px;
      font-size: 12px;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
    }

    .detail-label {
      color: #6b7280;
    }

    .detail-value {
      color: #374151;
      font-weight: 500;
    }

    .metric-description {
      font-size: 11px;
      color: #6b7280;
      line-height: 1.4;
      border-top: 1px solid #e5e7eb;
      padding-top: 8px;
    }

    .dashboard-footer {
      border-top: 1px solid #f3f4f6;
      padding-top: 16px;
    }

    .ga4-info {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      padding: 8px 12px;
      background: #dbeafe;
      border-radius: 6px;
      border-left: 3px solid #3b82f6;
    }

    .ga-icon {
      font-size: 16px;
    }

    .ga-text {
      font-size: 12px;
      color: #1e40af;
      font-weight: 500;
    }

    .legend {
      display: flex;
      gap: 16px;
      justify-content: center;
      flex-wrap: wrap;
    }

    .legend-item {
      font-size: 11px;
      font-weight: 500;
    }

    .placeholder {
      width: 300px;
    }

    .placeholder .dashboard-content {
      text-align: center;
      color: #6b7280;
    }

    .placeholder .dashboard-content p {
      margin: 0 0 8px 0;
      font-weight: 500;
    }

    .placeholder .dashboard-content small {
      font-size: 12px;
    }

    /* Mobile responsiveness */
    @media (max-width: 768px) {
      .web-vitals-dashboard {
        position: fixed;
        top: auto;
        bottom: 20px;
        right: 20px;
        left: 20px;
        width: auto;
        max-width: none;
      }

      .metrics-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }

      .metric-card {
        padding: 12px;
      }

      .value {
        font-size: 20px;
      }
    }

    /* High contrast mode */
    @media (prefers-contrast: high) {
      .web-vitals-dashboard {
        border-width: 2px;
        backdrop-filter: none;
        background: white;
      }

      .metric-card {
        border-width: 2px;
      }
    }

    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      .web-vitals-dashboard,
      .metric-card,
      .toggle-button {
        transition: none !important;
      }

      .metric-card:hover {
        transform: none !important;
      }
    }
  `;
}

// Export function to programmatically show/hide dashboard
export function toggleWebVitalsDashboard(show?: boolean) {
  const dashboards = document.querySelectorAll('.web-vitals-dashboard');
  dashboards.forEach(dashboard => {
    const button = dashboard.querySelector('.toggle-button') as HTMLButtonElement;
    const content = dashboard.querySelector('.dashboard-content') as HTMLElement;
    const isVisible = content && content.style.display !== 'none';
    
    if (button && (show === undefined || show !== isVisible)) {
      button.click();
    }
  });
}