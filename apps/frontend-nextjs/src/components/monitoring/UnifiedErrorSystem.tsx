'use client';

import React, { Component, ErrorInfo, ReactNode, useEffect, useState, useCallback } from 'react';
import { AlertCircle, AlertTriangle, XCircle, X, TrendingUp, Clock, RefreshCw } from 'lucide-react';
import { theme } from '@/config/theme';
import { ErrorMonitorService } from './ErrorMonitor';

// ============================================
// TIPOS E INTERFACES
// ============================================

type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

interface ErrorEntry {
  id: string;
  message: string;
  stack?: string;
  timestamp: Date;
  severity: ErrorSeverity;
  component?: string;
  userId?: string;
  context?: Record<string, any>;
  count: number;
}

interface Toast {
  id: string;
  severity: ErrorSeverity;
  message: string;
  timestamp: number;
  autoClose?: boolean;
}

interface UnifiedErrorSystemProps {
  children: ReactNode;
  fallback?: ReactNode;
  maxToasts?: number;
  autoCloseDuration?: number;
  toastPosition?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  enableMonitoring?: boolean;
  enableToasts?: boolean;
  onError?: (error: Error, errorInfo?: ErrorInfo) => void;
}

interface UnifiedErrorSystemState {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  toasts: Toast[];
  monitorOpen: boolean;
  errors: ErrorEntry[];
}

// ============================================
// COMPONENTE UNIFICADO
// ============================================

export class UnifiedErrorSystem extends Component<UnifiedErrorSystemProps, UnifiedErrorSystemState> {
  private errorService = ErrorMonitorService.getInstance();
  private toastTimeouts = new Map<string, NodeJS.Timeout>();

  public state: UnifiedErrorSystemState = {
    hasError: false,
    toasts: [],
    monitorOpen: false,
    errors: []
  };

  // ============================================
  // ERROR BOUNDARY FUNCTIONALITY
  // ============================================

  public static getDerivedStateFromError(error: Error): Partial<UnifiedErrorSystemState> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('UnifiedErrorSystem caught an error:', error, errorInfo);
    
    // Log no monitor
    if (this.props.enableMonitoring !== false) {
      this.errorService.logError(error, {
        component: errorInfo.componentStack?.split('\n')[0] || 'Unknown',
        severity: 'critical',
        context: {
          componentStack: errorInfo.componentStack,
          digest: errorInfo.digest
        }
      });
    }

    // Adicionar toast
    if (this.props.enableToasts !== false) {
      this.addToast({
        id: `boundary_${Date.now()}`,
        severity: 'critical',
        message: `Erro crítico: ${error.message}`,
        timestamp: Date.now(),
        autoClose: false
      });
    }

    // Callback customizado
    this.props.onError?.(error, errorInfo);

    this.setState({
      error,
      errorInfo
    });
  }

  // ============================================
  // TOAST FUNCTIONALITY
  // ============================================

  private addToast = (toast: Toast) => {
    const { maxToasts = 5, autoCloseDuration = 5000 } = this.props;

    this.setState(prevState => {
      const newToasts = [toast, ...prevState.toasts].slice(0, maxToasts);
      return { toasts: newToasts };
    });

    // Auto-close se configurado
    if (toast.autoClose !== false && autoCloseDuration > 0) {
      const timeout = setTimeout(() => {
        this.removeToast(toast.id);
      }, autoCloseDuration);
      
      this.toastTimeouts.set(toast.id, timeout);
    }
  };

  private removeToast = (toastId: string) => {
    // Limpar timeout se existir
    const timeout = this.toastTimeouts.get(toastId);
    if (timeout) {
      clearTimeout(timeout);
      this.toastTimeouts.delete(toastId);
    }

    this.setState(prevState => ({
      toasts: prevState.toasts.filter(t => t.id !== toastId)
    }));
  };

  // ============================================
  // MONITOR FUNCTIONALITY
  // ============================================

  public componentDidMount() {
    // Subscrever ao serviço de erros
    const unsubscribe = this.errorService.subscribe((errors) => {
      this.setState({ errors });
    });

    // Event listeners para sistema de toast externo
    window.addEventListener('show-error-toast', this.handleShowToast as EventListener);
    window.addEventListener('clear-error-toast', this.handleClearToast as EventListener);
    
    // Error handlers globais
    window.addEventListener('error', this.handleWindowError);
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);

    // Cleanup
    (this as any).cleanup = () => {
      unsubscribe();
      window.removeEventListener('show-error-toast', this.handleShowToast as EventListener);
      window.removeEventListener('clear-error-toast', this.handleClearToast as EventListener);
      window.removeEventListener('error', this.handleWindowError);
      window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
      
      // Limpar timeouts
      this.toastTimeouts.forEach(timeout => clearTimeout(timeout));
      this.toastTimeouts.clear();
    };
  }

  public componentWillUnmount() {
    (this as any).cleanup?.();
  }

  private handleShowToast = (event: CustomEvent) => {
    this.addToast({
      id: event.detail.errorId || `toast_${Date.now()}`,
      severity: event.detail.severity || 'medium',
      message: event.detail.message,
      timestamp: Date.now(),
      autoClose: event.detail.autoClose !== false
    });
  };

  private handleClearToast = (event: CustomEvent) => {
    this.removeToast(event.detail.errorId);
  };

  private handleWindowError = (event: ErrorEvent) => {
    if (this.props.enableMonitoring !== false) {
      this.errorService.logError(event.error, {
        component: 'window',
        severity: 'high',
        context: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      });
    }

    if (this.props.enableToasts !== false) {
      this.addToast({
        id: `window_${Date.now()}`,
        severity: 'high',
        message: event.error?.message || 'Erro desconhecido',
        timestamp: Date.now()
      });
    }
  };

  private handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    const error = new Error(`Promise rejeitada: ${event.reason}`);
    
    if (this.props.enableMonitoring !== false) {
      this.errorService.logError(error, {
        component: 'promise',
        severity: 'high',
        context: { reason: event.reason }
      });
    }

    if (this.props.enableToasts !== false) {
      this.addToast({
        id: `promise_${Date.now()}`,
        severity: 'high',
        message: error.message,
        timestamp: Date.now()
      });
    }
  };

  // ============================================
  // UTILITY METHODS
  // ============================================

  private handleRetry = () => {
    this.setState({ 
      hasError: false, 
      error: undefined, 
      errorInfo: undefined 
    });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private getSeverityColor = (severity: ErrorSeverity) => {
    switch (severity) {
      case 'critical': return '#dc2626';
      case 'high': return '#ea580c';
      case 'medium': return '#f59e0b';
      case 'low': return '#84cc16';
      default: return '#6b7280';
    }
  };

  private getToastIcon = (severity: ErrorSeverity) => {
    switch (severity) {
      case 'critical': return <XCircle size={20} />;
      case 'high': return <AlertTriangle size={20} />;
      default: return <AlertCircle size={20} />;
    }
  };

  // ============================================
  // RENDER METHODS
  // ============================================

  private renderErrorBoundaryFallback() {
    const { fallback } = this.props;
    const { error, errorInfo } = this.state;

    if (fallback) {
      return fallback;
    }

    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: theme.gradients.primary,
        color: 'white',
        padding: '20px',
        textAlign: 'center'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '40px',
          maxWidth: '600px',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>⚠️</div>
          
          <h1 style={{ 
            fontSize: '2rem', 
            marginBottom: '20px',
            fontWeight: 'bold'
          }}>
            Ops! Algo deu errado
          </h1>
          
          <p style={{ 
            fontSize: '1.1rem', 
            marginBottom: '30px',
            opacity: 0.9,
            lineHeight: '1.6'
          }}>
            Ocorreu um erro inesperado. O sistema de monitoramento foi notificado.
          </p>

          {process.env.NODE_ENV === 'development' && error && (
            <details style={{
              marginBottom: '30px',
              padding: '15px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              textAlign: 'left',
              fontSize: '0.9rem'
            }}>
              <summary style={{ cursor: 'pointer', marginBottom: '10px' }}>
                Detalhes do Erro (Dev)
              </summary>
              <pre style={{ 
                whiteSpace: 'pre-wrap', 
                wordBreak: 'break-word',
                fontFamily: 'monospace'
              }}>
                {error.stack}
              </pre>
            </details>
          )}

          <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
            <button
              onClick={this.handleRetry}
              style={{
                padding: '12px 24px',
                background: 'white',
                color: theme.colors.primary[600],
                border: 'none',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <RefreshCw size={18} />
              Tentar Novamente
            </button>
            
            <button
              onClick={this.handleGoHome}
              style={{
                padding: '12px 24px',
                background: 'transparent',
                color: 'white',
                border: '2px solid white',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Ir para Início
            </button>
          </div>
        </div>
      </div>
    );
  }

  private renderToasts() {
    const { toastPosition = 'top-right' } = this.props;
    const { toasts } = this.state;

    if (!toasts.length) return null;

    const positionStyles = {
      'top-right': { top: 20, right: 20 },
      'top-left': { top: 20, left: 20 },
      'bottom-right': { bottom: 20, right: 20 },
      'bottom-left': { bottom: 20, left: 20 }
    };

    return (
      <div style={{
        position: 'fixed',
        ...positionStyles[toastPosition],
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        maxWidth: '400px'
      }}>
        {toasts.map(toast => (
          <div
            key={toast.id}
            style={{
              background: 'white',
              borderRadius: '8px',
              padding: '12px 16px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              borderLeft: `4px solid ${this.getSeverityColor(toast.severity)}`,
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              animation: 'slideIn 0.3s ease-out'
            }}
          >
            <div style={{ color: this.getSeverityColor(toast.severity) }}>
              {this.getToastIcon(toast.severity)}
            </div>
            
            <div style={{ flex: 1 }}>
              <div style={{ 
                fontSize: '14px',
                color: '#1f2937',
                wordBreak: 'break-word'
              }}>
                {toast.message}
              </div>
              <div style={{
                fontSize: '12px',
                color: '#6b7280',
                marginTop: '4px'
              }}>
                {new Date(toast.timestamp).toLocaleTimeString()}
              </div>
            </div>
            
            <button
              onClick={() => this.removeToast(toast.id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                color: '#6b7280'
              }}
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    );
  }

  private renderMonitorBadge() {
    const { errors, monitorOpen } = this.state;
    const { enableMonitoring } = this.props;

    if (enableMonitoring === false || monitorOpen || errors.length === 0) {
      return null;
    }

    const hasCritical = errors.some(e => e.severity === 'critical');

    return (
      <button
        onClick={() => this.setState({ monitorOpen: true })}
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          background: hasCritical ? '#dc2626' : '#f59e0b',
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
          zIndex: 9998
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <AlertTriangle size={24} />
          <div style={{ fontSize: '12px', fontWeight: 'bold' }}>
            {errors.reduce((sum, e) => sum + e.count, 0)}
          </div>
        </div>
      </button>
    );
  }

  public render() {
    const { hasError, monitorOpen } = this.state;
    const { children } = this.props;

    // Se error boundary foi acionado
    if (hasError) {
      return this.renderErrorBoundaryFallback();
    }

    // Renderização normal
    return (
      <>
        {children}
        {this.renderToasts()}
        {this.renderMonitorBadge()}
        
        {/* Monitor Panel seria importado separadamente para não duplicar */}
      </>
    );
  }
}

// ============================================
// HOOK PARA USO FUNCIONAL
// ============================================

export const useUnifiedError = () => {
  const errorService = ErrorMonitorService.getInstance();

  const logError = useCallback((
    error: Error | string,
    severity: ErrorSeverity = 'medium',
    context?: Record<string, any>
  ) => {
    errorService.logError(error, {
      severity,
      context,
      component: context?.component
    });

    // Disparar evento para toast
    window.dispatchEvent(new CustomEvent('show-error-toast', {
      detail: {
        errorId: `error_${Date.now()}`,
        severity,
        message: typeof error === 'string' ? error : error.message
      }
    }));
  }, [errorService]);

  const clearError = useCallback((errorId: string) => {
    window.dispatchEvent(new CustomEvent('clear-error-toast', {
      detail: { errorId }
    }));
  }, []);

  return {
    logError,
    clearError,
    logWarning: (message: string) => logError(message, 'low'),
    logCritical: (message: string) => logError(message, 'critical')
  };
};

export default UnifiedErrorSystem;