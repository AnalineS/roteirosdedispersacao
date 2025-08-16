/**
 * Google Cloud Observability - Free Tier Implementation
 * Mantém uso dentro dos limites gratuitos (150 MB/mês)
 */

interface MetricBuffer {
  metric: string;
  value: number;
  labels: Record<string, string>;
  timestamp: number;
}

interface MetricConfig {
  interval: number;
  labels: string[];
  priority: 'critical' | 'important' | 'nice-to-have';
}

export class FreeGCPObservability {
  private buffer: MetricBuffer[] = [];
  private lastFlush: number = Date.now();
  private monthlyUsage: number = 0; // MB
  private readonly MAX_MONTHLY_MB = 140; // 10 MB margem de segurança
  private readonly BATCH_SIZE = 100;
  private readonly FLUSH_INTERVAL = 30000; // 30 segundos
  
  // Métricas prioritárias configuradas para free tier
  private readonly metrics: Record<string, MetricConfig> = {
    // Críticas - Sempre enviar
    'api_health': {
      interval: 60000,
      labels: ['endpoint', 'status'],
      priority: 'critical'
    },
    'error_rate': {
      interval: 60000,
      labels: ['type', 'severity'],
      priority: 'critical'
    },
    
    // Importantes - Enviar com sampling se necessário
    'persona_response_time': {
      interval: 300000,
      labels: ['persona'],
      priority: 'important'
    },
    'educational_progress': {
      interval: 3600000,
      labels: ['module'],
      priority: 'important'
    },
    
    // Nice-to-have - Cortar se aproximar do limite
    'pwa_stats': {
      interval: 86400000,
      labels: ['action'],
      priority: 'nice-to-have'
    }
  };
  
  constructor(private projectId: string = '') {
    // Auto-flush periodicamente
    if (typeof window !== 'undefined') {
      setInterval(() => this.flush(), this.FLUSH_INTERVAL);
      
      // Flush ao sair da página
      window.addEventListener('beforeunload', () => this.flush());
    }
  }
  
  /**
   * Adiciona métrica ao buffer (não envia imediatamente)
   */
  public track(
    metricType: string,
    value: number,
    labels?: Record<string, string>
  ): void {
    // Verificar se deve coletar baseado em prioridade e uso
    if (!this.shouldCollect(metricType)) {
      return;
    }
    
    const config = this.metrics[metricType];
    if (!config) {
      console.warn(`Métrica não configurada: ${metricType}`);
      return;
    }
    
    // Filtrar labels para economizar espaço
    const filteredLabels = this.filterLabels(labels || {}, config.labels);
    
    this.buffer.push({
      metric: metricType,
      value,
      labels: filteredLabels,
      timestamp: Date.now()
    });
    
    // Flush se buffer muito grande
    if (this.buffer.length >= this.BATCH_SIZE) {
      this.flush();
    }
  }
  
  /**
   * Decide se deve coletar métrica baseado em uso e prioridade
   */
  private shouldCollect(metricType: string): boolean {
    const config = this.metrics[metricType];
    if (!config) return false;
    
    const usagePercentage = (this.monthlyUsage / this.MAX_MONTHLY_MB) * 100;
    
    // Sempre coletar métricas críticas
    if (config.priority === 'critical') {
      return true;
    }
    
    // Se uso > 80%, só críticas
    if (usagePercentage > 80) {
      return false;
    }
    
    // Se uso > 60%, aplicar sampling em importantes
    if (usagePercentage > 60 && config.priority === 'important') {
      return Math.random() < 0.3; // 30% de chance
    }
    
    // Se uso > 40%, não coletar nice-to-have
    if (usagePercentage > 40 && config.priority === 'nice-to-have') {
      return false;
    }
    
    return true;
  }
  
  /**
   * Filtra labels para economizar espaço
   */
  private filterLabels(
    labels: Record<string, string>,
    allowedLabels: string[]
  ): Record<string, string> {
    const filtered: Record<string, string> = {};
    
    for (const key of allowedLabels) {
      if (labels[key]) {
        filtered[key] = labels[key];
      }
    }
    
    return filtered;
  }
  
  /**
   * Envia métricas em batch para GCP
   */
  public async flush(): Promise<void> {
    if (this.buffer.length === 0) {
      return;
    }
    
    try {
      // Agrupar por tipo de métrica
      const grouped = this.groupByMetric();
      
      // Enviar cada grupo
      for (const [metricType, items] of Object.entries(grouped)) {
        await this.sendBatch(metricType, items);
      }
      
      // Estimar uso (aproximado: 100 bytes por métrica)
      const bytesUsed = this.buffer.length * 100;
      this.monthlyUsage += bytesUsed / (1024 * 1024); // Converter para MB
      
      // Limpar buffer
      this.buffer = [];
      this.lastFlush = Date.now();
      
      // Log de uso
      if (this.monthlyUsage > this.MAX_MONTHLY_MB * 0.8) {
        console.warn(
          `⚠️ Observability: Uso próximo do limite (${this.monthlyUsage.toFixed(2)} MB de ${this.MAX_MONTHLY_MB} MB)`
        );
      }
      
    } catch (error) {
      console.error('Erro ao enviar métricas:', error);
      // Manter buffer para retry
    }
  }
  
  /**
   * Agrupa métricas por tipo
   */
  private groupByMetric(): Record<string, MetricBuffer[]> {
    const grouped: Record<string, MetricBuffer[]> = {};
    
    for (const item of this.buffer) {
      if (!grouped[item.metric]) {
        grouped[item.metric] = [];
      }
      grouped[item.metric].push(item);
    }
    
    return grouped;
  }
  
  /**
   * Envia batch de métricas para GCP
   */
  private async sendBatch(
    metricType: string,
    items: MetricBuffer[]
  ): Promise<void> {
    // Em produção, isso seria uma chamada real para GCP
    // Por enquanto, apenas simular
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 [GCP Metrics] Enviando ${items.length} métricas do tipo ${metricType}`);
      return;
    }
    
    // TODO: Implementar envio real quando configurar service account
    // const timeSeries = this.createTimeSeries(metricType, items);
    // await this.client.createTimeSeries({ name: this.projectPath, timeSeries });
  }
  
  /**
   * Obtém estatísticas de uso
   */
  public getUsageStats() {
    return {
      monthlyUsageMB: this.monthlyUsage,
      limitMB: this.MAX_MONTHLY_MB,
      usagePercentage: (this.monthlyUsage / this.MAX_MONTHLY_MB) * 100,
      bufferSize: this.buffer.length,
      lastFlush: new Date(this.lastFlush).toISOString()
    };
  }
  
  /**
   * Reset mensal do contador (chamar via cron)
   */
  public resetMonthlyUsage(): void {
    this.monthlyUsage = 0;
    console.log('📊 [GCP Metrics] Contador mensal resetado');
  }
}

// Singleton instance
let instance: FreeGCPObservability | null = null;

export function getObservability(): FreeGCPObservability {
  if (!instance) {
    instance = new FreeGCPObservability(
      process.env.NEXT_PUBLIC_GCP_PROJECT_ID || ''
    );
  }
  return instance;
}

// Helper functions para facilitar uso
export const ObservabilityHelpers = {
  trackAPIHealth: (endpoint: string, status: number) => {
    getObservability().track('api_health', status, {
      endpoint,
      status: status.toString()
    });
  },
  
  trackError: (type: string, severity: 'low' | 'medium' | 'high' | 'critical') => {
    getObservability().track('error_rate', 1, {
      type,
      severity
    });
  },
  
  trackPersonaResponse: (persona: string, responseTime: number) => {
    getObservability().track('persona_response_time', responseTime, {
      persona
    });
  },
  
  trackEducationalProgress: (module: string, progress: number) => {
    getObservability().track('educational_progress', progress, {
      module
    });
  },
  
  trackPWAAction: (action: 'install' | 'update' | 'offline') => {
    getObservability().track('pwa_stats', 1, {
      action
    });
  }
};