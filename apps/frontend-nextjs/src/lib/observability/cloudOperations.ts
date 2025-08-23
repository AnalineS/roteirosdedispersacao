/**
 * Google Cloud Operations Suite - Frontend Integration
 * Envia métricas e logs para o backend que forwarda para GCP
 */

interface LogEntry {
  severity: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  message: string;
  timestamp: string;
  component: string;
  userId?: string;
  metadata?: Record<string, any>;
}

interface Metric {
  name: string;
  value: number;
  labels: Record<string, string>;
  timestamp: number;
}

class CloudOperationsClient {
  private apiUrl: string;
  private buffer: LogEntry[] = [];
  private metricsBuffer: Metric[] = [];
  private flushInterval: number = 5000; // 5 segundos
  private maxBufferSize: number = 50;
  
  constructor() {
    this.apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    this.startFlushTimer();
  }
  
  /**
   * Log estruturado
   */
  log(severity: LogEntry['severity'], message: string, metadata?: Record<string, any>) {
    const entry: LogEntry = {
      severity,
      message,
      timestamp: new Date().toISOString(),
      component: 'frontend',
      metadata: {
        ...metadata,
        userAgent: navigator.userAgent,
        url: window.location.href,
      }
    };
    
    this.buffer.push(entry);
    
    // Console log para desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${severity}] ${message}`, metadata);
    }
    
    // Flush se buffer estiver cheio
    if (this.buffer.length >= this.maxBufferSize) {
      this.flush();
    }
  }
  
  /**
   * Helpers para diferentes níveis de log
   */
  debug(message: string, metadata?: Record<string, any>) {
    this.log('DEBUG', message, metadata);
  }
  
  info(message: string, metadata?: Record<string, any>) {
    this.log('INFO', message, metadata);
  }
  
  warning(message: string, metadata?: Record<string, any>) {
    this.log('WARNING', message, metadata);
  }
  
  error(message: string, metadata?: Record<string, any>) {
    this.log('ERROR', message, metadata);
  }
  
  critical(message: string, metadata?: Record<string, any>) {
    this.log('CRITICAL', message, metadata);
  }
  
  /**
   * Rastreia métrica customizada
   */
  trackMetric(name: string, value: number, labels: Record<string, string> = {}) {
    const metric: Metric = {
      name,
      value,
      labels: {
        ...labels,
        component: 'frontend',
        environment: process.env.NEXT_PUBLIC_ENVIRONMENT || 'production'
      },
      timestamp: Date.now()
    };
    
    this.metricsBuffer.push(metric);
    
    if (this.metricsBuffer.length >= this.maxBufferSize) {
      this.flushMetrics();
    }
  }
  
  /**
   * Rastreia performance de página
   */
  trackPagePerformance() {
    if (typeof window !== 'undefined' && window.performance) {
      const perfData = window.performance.timing;
      const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
      const domReadyTime = perfData.domContentLoadedEventEnd - perfData.navigationStart;
      const firstPaintTime = perfData.responseStart - perfData.navigationStart;
      
      this.trackMetric('page_load_time', pageLoadTime, {
        page: window.location.pathname
      });
      
      this.trackMetric('dom_ready_time', domReadyTime, {
        page: window.location.pathname
      });
      
      this.trackMetric('first_paint_time', firstPaintTime, {
        page: window.location.pathname
      });
      
      this.info('Page performance tracked', {
        pageLoadTime,
        domReadyTime,
        firstPaintTime,
        url: window.location.href
      });
    }
  }
  
  /**
   * Rastreia interação com persona
   */
  trackPersonaInteraction(persona: 'gasnelio' | 'ga', responseTime: number, success: boolean) {
    this.trackMetric('persona_interaction', responseTime, {
      persona,
      success: success.toString()
    });
    
    this.info(`Persona interaction: ${persona}`, {
      persona,
      responseTime,
      success
    });
  }
  
  /**
   * Rastreia progresso educacional
   */
  trackEducationalProgress(module: string, progress: number, completed: boolean) {
    this.trackMetric('educational_progress', progress, {
      module,
      completed: completed.toString()
    });
    
    this.info(`Educational progress: ${module}`, {
      module,
      progress,
      completed
    });
  }
  
  /**
   * Rastreia erros
   */
  trackError(error: Error, context?: Record<string, any>) {
    this.error(`Error: ${error.message}`, {
      stack: error.stack,
      name: error.name,
      ...context
    });
    
    // Enviar imediatamente erros críticos
    this.flush();
  }
  
  /**
   * Envia logs para o backend
   */
  private async flush() {
    if (this.buffer.length === 0) return;
    
    const logs = [...this.buffer];
    this.buffer = [];
    
    try {
      await fetch(`${this.apiUrl}/api/v1/observability/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ logs })
      });
    } catch (error) {
      console.error('Failed to send logs:', error);
      // Re-adicionar logs ao buffer se falhar
      this.buffer = [...logs, ...this.buffer].slice(0, this.maxBufferSize * 2);
    }
  }
  
  /**
   * Envia métricas para o backend
   */
  private async flushMetrics() {
    if (this.metricsBuffer.length === 0) return;
    
    const metrics = [...this.metricsBuffer];
    this.metricsBuffer = [];
    
    try {
      await fetch(`${this.apiUrl}/api/v1/observability/metrics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ metrics })
      });
    } catch (error) {
      console.error('Failed to send metrics:', error);
      // Re-adicionar métricas ao buffer se falhar
      this.metricsBuffer = [...metrics, ...this.metricsBuffer].slice(0, this.maxBufferSize * 2);
    }
  }
  
  /**
   * Timer para flush automático
   */
  private startFlushTimer() {
    if (typeof window !== 'undefined') {
      setInterval(() => {
        this.flush();
        this.flushMetrics();
      }, this.flushInterval);
      
      // Flush ao sair da página
      window.addEventListener('beforeunload', () => {
        this.flush();
        this.flushMetrics();
      });
    }
  }
}

// Singleton instance
const cloudOps = new CloudOperationsClient();

// Error boundary integration
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    cloudOps.trackError(new Error(event.message), {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    cloudOps.trackError(new Error(event.reason), {
      type: 'unhandledRejection'
    });
  });
}

export default cloudOps;