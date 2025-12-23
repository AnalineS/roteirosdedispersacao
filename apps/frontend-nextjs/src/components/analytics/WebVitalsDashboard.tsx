'use client';

import React, { useState, useEffect } from 'react';
import { getCurrentPerformanceData } from './EnhancedCoreWebVitals';
import styles from './WebVitalsDashboard.module.css';

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
      <div
        className={`${styles.webVitalsDashboard} ${styles.placeholder}`}
        data-web-vitals-dashboard
      >
        <div className={styles.dashboardHeader}>
          <h3>📊 Core Web Vitals</h3>
          <button
            onClick={() => setIsVisible(!isVisible)}
            className={styles.toggleButton}
            data-toggle-button
            aria-label="Toggle dashboard visibility"
          >
            {isVisible ? '▼' : '▶'}
          </button>
        </div>
        {isVisible && (
          <div className={styles.dashboardContent} data-dashboard-content>
            <p>Aguardando dados de performance...</p>
            <small>As métricas aparecerão conforme você navega no site.</small>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`${styles.webVitalsDashboard} ${compactMode ? styles.compact : ''}`}
      data-web-vitals-dashboard
    >
      <div className={styles.dashboardHeader}>
        <h3>📊 Core Web Vitals</h3>
        <div className={styles.headerControls}>
          {lastUpdate && (
            <span className={styles.lastUpdate}>
              {lastUpdate.toLocaleTimeString('pt-BR')}
            </span>
          )}
          <button
            onClick={() => setIsVisible(!isVisible)}
            className={styles.toggleButton}
            data-toggle-button
            aria-label="Toggle dashboard visibility"
          >
            {isVisible ? '▼' : '▶'}
          </button>
        </div>
      </div>

      {isVisible && (
        <div className={styles.dashboardContent} data-dashboard-content>
          <div className={styles.metricsGrid}>
            {Object.entries(metrics).map(([name, data]) => (
              <div key={name} className={styles.metricCard}>
                <div className={styles.metricHeader}>
                  <span className={styles.metricName}>{name}</span>
                  <span className={styles.metricTrend} title={`Tendência: ${data.trend}`}>
                    {getTrendIcon(data.trend)}
                  </span>
                </div>

                <div className={styles.metricValue}>
                  <span
                    className={styles.value}
                    style={{ color: getMetricColor(data.rating) }}
                  >
                    {formatMetricValue(name, data.current)}
                  </span>
                  <span className={styles.rating} style={{ color: getMetricColor(data.rating) }}>
                    {data.rating.replace('-', ' ')}
                  </span>
                </div>

                <div className={styles.metricDetails}>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Média:</span>
                    <span className={styles.detailValue}>
                      {formatMetricValue(name, data.average)}
                    </span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Amostras:</span>
                    <span className={styles.detailValue}>{data.samples}</span>
                  </div>
                </div>

                <div className={styles.metricDescription}>
                  {getMetricDescription(name)}
                </div>
              </div>
            ))}
          </div>

          <div className={styles.dashboardFooter}>
            <div className={styles.ga4Info}>
              <span className={styles.gaIcon}>📈</span>
              <span className={styles.gaText}>
                Dados enviados automaticamente para Google Analytics 4
              </span>
            </div>
            <div className={styles.legend}>
              <span className={styles.legendItem}>🟢 Bom</span>
              <span className={styles.legendItem}>🟡 Precisa melhorar</span>
              <span className={styles.legendItem}>🔴 Ruim</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Export function to programmatically show/hide dashboard
 * Uses data attributes for selection (compatible with CSS Modules)
 */
export function toggleWebVitalsDashboard(show?: boolean) {
  const dashboards = document.querySelectorAll('[data-web-vitals-dashboard]');
  dashboards.forEach(dashboard => {
    const button = dashboard.querySelector('[data-toggle-button]') as HTMLButtonElement;
    const content = dashboard.querySelector('[data-dashboard-content]') as HTMLElement;
    const isVisible = content && content.style.display !== 'none';

    if (button && (show === undefined || show !== isVisible)) {
      button.click();
    }
  });
}