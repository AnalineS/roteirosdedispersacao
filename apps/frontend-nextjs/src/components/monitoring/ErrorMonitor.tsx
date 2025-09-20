'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle, X, TrendingUp, Clock, AlertTriangle } from 'lucide-react';

interface ErrorEntry {
  id: string;
  message: string;
  stack?: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  component?: string;
  userId?: string;
  context?: Record<string, any>;
  count: number;
}

interface ErrorMetrics {
  total: number;
  byComponent: Record<string, number>;
  bySeverity: Record<string, number>;
  errorRate: number;
  recentErrors: ErrorEntry[];
}

export class ErrorMonitorService {
  private static instance: ErrorMonitorService;
  private errors: Map<string, ErrorEntry> = new Map();
  private listeners: Set<(errors: ErrorEntry[]) => void> = new Set();
  
  static getInstance(): ErrorMonitorService {
    if (!ErrorMonitorService.instance) {
      ErrorMonitorService.instance = new ErrorMonitorService();
    }
    return ErrorMonitorService.instance;
  }
  
  logError(error: Error | string, context?: Partial<ErrorEntry>): void {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorKey = `${errorMessage}-${context?.component || 'unknown'}`;
    
    const existing = this.errors.get(errorKey);
    
    if (existing) {
      existing.count++;
      existing.timestamp = new Date();
    } else {
      const newError: ErrorEntry = {
        id: Date.now().toString(),
        message: errorMessage,
        stack: typeof error === 'object' ? error.stack : undefined,
        timestamp: new Date(),
        severity: context?.severity || 'medium',
        component: context?.component,
        userId: context?.userId,
        context: context?.context,
        count: 1
      };
      
      this.errors.set(errorKey, newError);
    }
    
    this.notifyListeners();
  }
  
  subscribe(listener: (errors: ErrorEntry[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  
  private notifyListeners(): void {
    const errorArray = Array.from(this.errors.values());
    this.listeners.forEach(listener => listener(errorArray));
  }
  
  getMetrics(): ErrorMetrics {
    const errorArray = Array.from(this.errors.values());
    
    const metrics: ErrorMetrics = {
      total: errorArray.reduce((sum, e) => sum + e.count, 0),
      byComponent: {},
      bySeverity: {},
      errorRate: 0,
      recentErrors: errorArray.slice(-5)
    };
    
    errorArray.forEach(error => {
      // Por componente
      const component = error.component || 'unknown';
      metrics.byComponent[component] = (metrics.byComponent[component] || 0) + error.count;
      
      // Por severidade
      metrics.bySeverity[error.severity] = (metrics.bySeverity[error.severity] || 0) + error.count;
    });
    
    // Calcular taxa de erro (últimos 5 minutos)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentErrors = errorArray.filter(e => e.timestamp > fiveMinutesAgo);
    metrics.errorRate = recentErrors.reduce((sum, e) => sum + e.count, 0) / 5;
    
    return metrics;
  }
  
  clearErrors(): void {
    this.errors.clear();
    this.notifyListeners();
  }
}

const ErrorMonitorDashboard: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [errors, setErrors] = useState<ErrorEntry[]>([]);
  const [metrics, setMetrics] = useState<ErrorMetrics | null>(null);
  const errorService = ErrorMonitorService.getInstance();
  
  useEffect(() => {
    const unsubscribe = errorService.subscribe((newErrors) => {
      setErrors(newErrors);
      setMetrics(errorService.getMetrics());
    });
    
    // Configurar error boundary global
    const handleError = (event: ErrorEvent) => {
      errorService.logError(event.error, {
        component: 'window',
        severity: 'high',
        context: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      });
    };
    
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      errorService.logError(new Error(`Unhandled Promise Rejection: ${event.reason}`), {
        component: 'promise',
        severity: 'high'
      });
    };
    
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      unsubscribe();
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [errorService]);
  
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#dc2626';
      case 'high': return '#ea580c';
      case 'medium': return '#f59e0b';
      case 'low': return '#84cc16';
      default: return '#6b7280';
    }
  };
  
  if (!isOpen && errors.length > 0) {
    // Mostrar badge flutuante quando há erros
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          background: errors.some(e => e.severity === 'critical') ? '#dc2626' : '#f59e0b',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '60px',
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          zIndex: 9999
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <AlertTriangle size={24} />
          <div style={{ fontSize: '12px', fontWeight: 'bold' }}>{errors.length}</div>
        </div>
      </button>
    );
  }
  
  if (!isOpen) return null;
  
  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '400px',
      maxHeight: '600px',
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
          Monitor de Erros
        </h3>
        <button
          onClick={() => setIsOpen(false)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px'
          }}
        >
          <X size={20} />
        </button>
      </div>
      
      {/* Metrics */}
      {metrics && (
        <div style={{
          padding: '16px',
          borderBottom: '1px solid #e5e7eb',
          background: '#f9fafb'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Total de Erros</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{metrics.total}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Taxa/min</div>
              <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                {metrics.errorRate.toFixed(1)}
              </div>
            </div>
          </div>
          
          {/* Severity breakdown */}
          <div style={{ marginTop: '12px' }}>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
              Por Severidade
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {Object.entries(metrics.bySeverity).map(([severity, count]) => (
                <span
                  key={severity}
                  style={{
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    background: getSeverityColor(severity),
                    color: 'white'
                  }}
                >
                  {severity}: {count}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Error List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px'
      }}>
        {errors.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '32px',
            color: '#6b7280'
          }}>
            <AlertCircle size={48} style={{ marginBottom: '8px', opacity: 0.5 }} />
            <p>Nenhum erro detectado</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {errors.map((error) => (
              <div
                key={error.id}
                style={{
                  padding: '12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  borderLeft: `4px solid ${getSeverityColor(error.severity)}`
                }}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '4px'
                }}>
                  <span style={{
                    fontSize: '12px',
                    color: getSeverityColor(error.severity),
                    fontWeight: '600'
                  }}>
                    {error.severity.toUpperCase()}
                  </span>
                  {error.count > 1 && (
                    <span style={{
                      fontSize: '12px',
                      background: '#ef4444',
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: '10px'
                    }}>
                      {error.count}x
                    </span>
                  )}
                </div>
                
                <div style={{
                  fontSize: '14px',
                  marginBottom: '4px',
                  wordBreak: 'break-word'
                }}>
                  {error.message}
                </div>
                
                <div style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'center'
                }}>
                  {error.component && (
                    <span>📦 {error.component}</span>
                  )}
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={12} />
                    {new Date(error.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Footer */}
      {errors.length > 0 && (
        <div style={{
          padding: '12px 16px',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <button
            onClick={() => errorService.clearErrors()}
            style={{
              padding: '6px 12px',
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Limpar Erros
          </button>
          <button
            onClick={() => {
              // Exportar logs
              const blob = new Blob([JSON.stringify(errors, null, 2)], {
                type: 'application/json'
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `error-log-${Date.now()}.json`;
              a.click();
            }}
            style={{
              padding: '6px 12px',
              background: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Exportar Logs
          </button>
        </div>
      )}
    </div>
  );
};

export default ErrorMonitorDashboard;