/**
 * Security Monitoring and Logging System
 * Sistema de Monitoramento e Logging de Segurança
 * 
 * CARACTERÍSTICAS:
 * - Monitoramento em tempo real
 * - Detecção de ameaças
 * - Alertas automáticos
 * - Relatórios de compliance
 * - Análise forense
 * - Dashboard de segurança
 */

import { SecurityAudit, RiskLevel } from './educationalSecurity';
import { FraudAlert } from './certificationSecurity';

// ================== TIPOS DE MONITORAMENTO ==================

export interface SecurityMetrics {
  timestamp: Date;
  totalEvents: number;
  riskDistribution: Record<RiskLevel, number>;
  threatLevel: ThreatLevel;
  activeIncidents: number;
  systemHealth: SystemHealthStatus;
  performanceMetrics: PerformanceMetrics;
}

export interface ThreatIntelligence {
  threatId: string;
  threatType: ThreatType;
  severity: ThreatSeverity;
  description: string;
  indicators: ThreatIndicator[];
  mitigationSteps: string[];
  firstDetected: Date;
  lastSeen: Date;
  isActive: boolean;
  affectedComponents: string[];
}

export interface SecurityIncident {
  incidentId: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  category: IncidentCategory;
  status: IncidentStatus;
  createdAt: Date;
  updatedAt: Date;
  assignedTo?: string;
  evidence: Evidence[];
  timeline: IncidentEvent[];
  mitigationActions: MitigationAction[];
  impact: ImpactAssessment;
}

export interface Evidence {
  type: EvidenceType;
  source: string;
  content: string;
  timestamp: Date;
  hash?: string;
  isProtected: boolean;
}

export interface IncidentEvent {
  timestamp: Date;
  actor: string;
  action: string;
  description: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
}

export interface MitigationAction {
  actionId: string;
  description: string;
  responsible: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  dueDate?: Date;
  completedAt?: Date;
  effectiveness: 'low' | 'medium' | 'high' | 'unknown';
}

export interface ImpactAssessment {
  userImpact: 'none' | 'low' | 'medium' | 'high' | 'critical';
  dataImpact: 'none' | 'low' | 'medium' | 'high' | 'critical';
  serviceImpact: 'none' | 'low' | 'medium' | 'high' | 'critical';
  reputationImpact: 'none' | 'low' | 'medium' | 'high' | 'critical';
  estimatedAffectedUsers: number;
  estimatedCost?: number;
}

export interface ThreatIndicator {
  type: IndicatorType;
  value: string;
  confidence: number; // 0-100
  context: string;
}

export type ThreatType = 
  | 'malware'
  | 'phishing'
  | 'brute_force'
  | 'injection'
  | 'xss'
  | 'csrf'
  | 'data_breach'
  | 'insider_threat'
  | 'fraud'
  | 'tampering';

export type ThreatLevel = 'green' | 'yellow' | 'orange' | 'red';
export type ThreatSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';
export type IncidentSeverity = 'P1' | 'P2' | 'P3' | 'P4'; // Priority levels
export type IncidentCategory = 'security' | 'privacy' | 'compliance' | 'fraud' | 'system';
export type IncidentStatus = 'open' | 'investigating' | 'mitigating' | 'resolved' | 'closed';
export type EvidenceType = 'log' | 'screenshot' | 'network_capture' | 'file' | 'memory_dump' | 'user_report';
export type IndicatorType = 'ip' | 'domain' | 'hash' | 'email' | 'user_agent' | 'pattern';

export interface SystemHealthStatus {
  overall: HealthStatus;
  components: Record<string, ComponentHealth>;
  lastCheck: Date;
}

export interface ComponentHealth {
  status: HealthStatus;
  responseTime?: number;
  errorRate?: number;
  lastError?: string;
  uptime: number; // percentage
}

export interface PerformanceMetrics {
  averageResponseTime: number;
  requestsPerMinute: number;
  errorRate: number;
  memoryUsage?: number;
  cpuUsage?: number;
}

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

// ================== CONFIGURAÇÃO DE MONITORAMENTO ==================

const MONITORING_CONFIG = {
  alertThresholds: {
    criticalEvents: 5,          // 5+ critical events per hour
    highRiskEvents: 20,         // 20+ high risk events per hour  
    failedLogins: 10,           // 10+ failed logins per user per hour
    fraudAttempts: 3,           // 3+ fraud attempts per user
    responseTime: 5000,         // 5 seconds response time
    errorRate: 0.05,            // 5% error rate
    memoryUsage: 0.85,          // 85% memory usage
  },
  
  retentionPeriods: {
    logs: 90,                   // 90 days
    incidents: 365,             // 1 year
    metrics: 30,                // 30 days
    alerts: 180,                // 6 months
    evidence: 2555,             // 7 years (compliance)
  },
  
  alertChannels: {
    email: true,
    sms: false,
    webhook: true,
    dashboard: true,
    syslog: false,
  },
  
  complianceReporting: {
    lgpd: true,
    cfm: true,
    cff: true,
    mec: true,
    anvisa: false,
  }
};

// ================== COLETOR DE MÉTRICAS ==================

class MetricsCollector {
  private metrics: SecurityMetrics[] = [];
  private alerts: SecurityAlert[] = [];
  
  /**
   * Coletar métricas de segurança atuais
   */
  collectCurrentMetrics(): SecurityMetrics {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    // Get recent security events
    const recentEvents = this.getRecentSecurityEvents(oneHourAgo);
    
    const riskDistribution: Record<RiskLevel, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0
    };
    
    recentEvents.forEach(event => {
      riskDistribution[event.riskLevel]++;
    });
    
    const threatLevel = this.calculateThreatLevel(riskDistribution);
    const systemHealth = this.assessSystemHealth();
    const performanceMetrics = this.collectPerformanceMetrics();
    
    const metrics: SecurityMetrics = {
      timestamp: now,
      totalEvents: recentEvents.length,
      riskDistribution,
      threatLevel,
      activeIncidents: this.countActiveIncidents(),
      systemHealth,
      performanceMetrics
    };
    
    this.metrics.push(metrics);
    this.cleanupOldMetrics();
    
    return metrics;
  }
  
  private getRecentSecurityEvents(since: Date): SecurityAudit[] {
    // In production, this would query the actual security log
    const mockEvents: SecurityAudit[] = [];
    
    // Add some sample events for demonstration
    const eventTypes: RiskLevel[] = ['low', 'medium', 'high', 'critical'];
    const eventCount = Math.floor(Math.random() * 50);
    
    for (let i = 0; i < eventCount; i++) {
      const randomIndex = Math.floor(Math.random() * eventTypes.length);
      mockEvents.push({
        timestamp: new Date(since.getTime() + Math.random() * (Date.now() - since.getTime())),
        sessionId: `session_${i}`,
        action: 'dose_calculation',
        component: 'calculator',
        riskLevel: eventTypes[randomIndex],
        data: {},
        metadata: {}
      });
    }
    
    return mockEvents;
  }
  
  private calculateThreatLevel(riskDistribution: Record<RiskLevel, number>): ThreatLevel {
    const { critical, high, medium } = riskDistribution;
    const thresholds = MONITORING_CONFIG.alertThresholds;
    
    if (critical >= thresholds.criticalEvents) return 'red';
    if (high >= thresholds.highRiskEvents || critical > 0) return 'orange';
    if (medium > 50) return 'yellow';
    return 'green';
  }
  
  private assessSystemHealth(): SystemHealthStatus {
    const components = {
      frontend: this.checkComponentHealth('frontend'),
      backend: this.checkComponentHealth('backend'),
      database: this.checkComponentHealth('database'),
      certificates: this.checkComponentHealth('certificates'),
      security: this.checkComponentHealth('security')
    };
    
    const componentStatuses = Object.values(components).map(c => c.status);
    const overall = componentStatuses.includes('unhealthy') ? 'unhealthy' :
                   componentStatuses.includes('degraded') ? 'degraded' : 'healthy';
    
    return {
      overall,
      components,
      lastCheck: new Date()
    };
  }
  
  private checkComponentHealth(component: string): ComponentHealth {
    // Mock health check - in production, implement actual health checks
    const statuses: HealthStatus[] = ['healthy', 'healthy', 'healthy', 'degraded']; // Weighted toward healthy
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    
    return {
      status: randomStatus,
      responseTime: 100 + Math.random() * 400,
      errorRate: Math.random() * 0.1,
      uptime: 95 + Math.random() * 5
    };
  }
  
  private collectPerformanceMetrics(): PerformanceMetrics {
    return {
      averageResponseTime: 200 + Math.random() * 300,
      requestsPerMinute: 10 + Math.random() * 90,
      errorRate: Math.random() * 0.05,
      memoryUsage: 0.3 + Math.random() * 0.4,
      cpuUsage: 0.2 + Math.random() * 0.3
    };
  }
  
  private countActiveIncidents(): number {
    // Mock implementation
    return Math.floor(Math.random() * 5);
  }
  
  private cleanupOldMetrics(): void {
    const cutoff = new Date(Date.now() - MONITORING_CONFIG.retentionPeriods.metrics * 24 * 60 * 60 * 1000);
    this.metrics = this.metrics.filter(m => m.timestamp > cutoff);
  }
}

// ================== DETECTOR DE AMEAÇAS ==================

class ThreatDetector {
  private threats: ThreatIntelligence[] = [];
  private patterns: Map<string, number> = new Map();
  
  /**
   * Analisar eventos para detectar ameaças
   */
  analyzeForThreats(events: SecurityAudit[]): ThreatIntelligence[] {
    const newThreats: ThreatIntelligence[] = [];
    
    // Pattern-based detection
    newThreats.push(...this.detectPatternBasedThreats(events));
    
    // Anomaly detection
    newThreats.push(...this.detectAnomalies(events));
    
    // Fraud detection
    newThreats.push(...this.detectFraudulent(events));
    
    // Update threat database
    this.updateThreatDatabase(newThreats);
    
    return newThreats;
  }
  
  private detectPatternBasedThreats(events: SecurityAudit[]): ThreatIntelligence[] {
    const threats: ThreatIntelligence[] = [];
    
    // Detect brute force attempts
    const failedAttempts = events.filter(e => 
      e.data.errors && e.data.errors.length > 0
    );
    
    if (failedAttempts.length >= MONITORING_CONFIG.alertThresholds.failedLogins) {
      threats.push(this.createThreat('brute_force', 'high', 'Multiple failed attempts detected', failedAttempts));
    }
    
    // Detect injection attempts
    const injectionAttempts = events.filter(e => 
      e.data.input && typeof e.data.input === 'string' && 
      this.containsInjectionPatterns(e.data.input as string)
    );
    
    if (injectionAttempts.length > 0) {
      threats.push(this.createThreat('injection', 'critical', 'SQL/Script injection attempts detected', injectionAttempts));
    }
    
    return threats;
  }
  
  private detectAnomalies(events: SecurityAudit[]): ThreatIntelligence[] {
    const threats: ThreatIntelligence[] = [];
    
    // Detect unusual activity patterns
    const activityByHour = this.groupEventsByHour(events);
    const avgActivity = Object.values(activityByHour).reduce((a, b) => a + b, 0) / 24;
    
    for (const [hour, count] of Object.entries(activityByHour)) {
      if (count > avgActivity * 3) { // 3x normal activity
        threats.push({
          threatId: `anomaly_${Date.now()}_${hour}`,
          threatType: 'insider_threat',
          severity: 'medium',
          description: `Unusual activity spike detected at hour ${hour}`,
          indicators: [{
            type: 'pattern',
            value: `activity_spike_${hour}`,
            confidence: 75,
            context: `${count} events vs ${avgActivity.toFixed(1)} average`
          }],
          mitigationSteps: [
            'Review user activity logs',
            'Check for automated scripts',
            'Verify legitimate business activity'
          ],
          firstDetected: new Date(),
          lastSeen: new Date(),
          isActive: true,
          affectedComponents: ['frontend', 'backend']
        });
      }
    }
    
    return threats;
  }
  
  private detectFraudulent(events: SecurityAudit[]): ThreatIntelligence[] {
    const threats: ThreatIntelligence[] = [];
    
    // Detect certificate fraud attempts
    const certEvents = events.filter(e => e.component === 'certification');
    const suspiciousCertEvents = certEvents.filter(e => e.riskLevel === 'high' || e.riskLevel === 'critical');
    
    if (suspiciousCertEvents.length >= MONITORING_CONFIG.alertThresholds.fraudAttempts) {
      threats.push(this.createThreat('fraud', 'critical', 'Certificate fraud attempts detected', suspiciousCertEvents));
    }
    
    return threats;
  }
  
  private createThreat(type: ThreatType, severity: ThreatSeverity, description: string, events: SecurityAudit[]): ThreatIntelligence {
    const indicators: ThreatIndicator[] = [];
    
    // Extract indicators from events
    events.forEach(event => {
      if (event.metadata.ip) {
        indicators.push({
          type: 'ip',
          value: event.metadata.ip,
          confidence: 80,
          context: `Associated with ${event.action}`
        });
      }
      
      if (event.metadata.userAgent) {
        indicators.push({
          type: 'user_agent',
          value: event.metadata.userAgent,
          confidence: 60,
          context: 'Suspicious user agent pattern'
        });
      }
    });
    
    return {
      threatId: `${type}_${Date.now()}`,
      threatType: type,
      severity,
      description,
      indicators,
      mitigationSteps: this.getMitigationSteps(type),
      firstDetected: new Date(),
      lastSeen: new Date(),
      isActive: true,
      affectedComponents: [...new Set(events.map(e => e.component))]
    };
  }
  
  private containsInjectionPatterns(input: string): boolean {
    const injectionPatterns = [
      /union\s+select/i,
      /'.*or.*'/i,
      /script.*>/i,
      /javascript:/i,
      /vbscript:/i,
      /onload\s*=/i,
      /onerror\s*=/i
    ];
    
    return injectionPatterns.some(pattern => pattern.test(input));
  }
  
  private groupEventsByHour(events: SecurityAudit[]): Record<string, number> {
    const byHour: Record<string, number> = {};
    
    for (let h = 0; h < 24; h++) {
      byHour[h.toString()] = 0;
    }
    
    events.forEach(event => {
      const hour = event.timestamp.getHours().toString();
      byHour[hour] = (byHour[hour] || 0) + 1;
    });
    
    return byHour;
  }
  
  private getMitigationSteps(type: ThreatType): string[] {
    const mitigations: Record<ThreatType, string[]> = {
      malware: ['Scan infected systems', 'Quarantine affected files', 'Update antivirus signatures'],
      phishing: ['Block malicious domains', 'Educate users', 'Review email filters'],
      brute_force: ['Implement account lockout', 'Add CAPTCHA', 'Review failed login attempts'],
      injection: ['Validate and sanitize inputs', 'Use parameterized queries', 'Review application code'],
      xss: ['Implement CSP headers', 'Sanitize user inputs', 'Review client-side code'],
      csrf: ['Implement CSRF tokens', 'Validate referrer headers', 'Use SameSite cookies'],
      data_breach: ['Contain breach', 'Assess impact', 'Notify authorities and users'],
      insider_threat: ['Review user access', 'Monitor privileged accounts', 'Investigate activity'],
      fraud: ['Block suspicious accounts', 'Review certificates', 'Investigate patterns'],
      tampering: ['Check data integrity', 'Review access logs', 'Verify digital signatures']
    };
    
    return mitigations[type] || ['Investigate thoroughly', 'Apply appropriate controls'];
  }
  
  private updateThreatDatabase(newThreats: ThreatIntelligence[]): void {
    this.threats.push(...newThreats);
    
    // Update existing threats
    newThreats.forEach(newThreat => {
      const existing = this.threats.find(t => 
        t.threatType === newThreat.threatType && 
        t.isActive
      );
      
      if (existing) {
        existing.lastSeen = new Date();
        existing.indicators.push(...newThreat.indicators);
      }
    });
    
    // Cleanup old threats
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days
    this.threats = this.threats.filter(t => t.lastSeen > cutoff);
  }
}

// ================== GERENCIADOR DE ALERTAS ==================

interface SecurityAlertMetadata {
  threat?: ThreatIntelligence;
  indicators?: ThreatIndicator[];
  metrics?: Record<RiskLevel, number>;
  responseTime?: number;
  errorRate?: number;
  error?: string;
  [key: string]: unknown;
}

interface SecurityDashboard {
  timestamp: Date;
  systemStatus: {
    threatLevel: ThreatLevel;
    systemHealth: HealthStatus;
    activeIncidents: number;
    activeAlerts: number;
  };
  metrics: SecurityMetrics;
  alerts: {
    active: SecurityAlert[];
    bySeverity: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
  };
  recommendations: string[];
}

interface SecurityAlert {
  alertId: string;
  title: string;
  description: string;
  severity: ThreatSeverity;
  category: 'security' | 'performance' | 'compliance' | 'fraud';
  timestamp: Date;
  source: string;
  isAcknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  metadata: SecurityAlertMetadata;
}

class AlertManager {
  private alerts: SecurityAlert[] = [];
  private subscribers: ((alert: SecurityAlert) => void)[] = [];
  
  /**
   * Criar e enviar alerta
   */
  createAlert(
    title: string,
    description: string,
    severity: ThreatSeverity,
    category: SecurityAlert['category'],
    source: string,
    metadata: SecurityAlertMetadata = {}
  ): SecurityAlert {
    const alert: SecurityAlert = {
      alertId: `alert_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      title,
      description,
      severity,
      category,
      timestamp: new Date(),
      source,
      isAcknowledged: false,
      metadata
    };
    
    this.alerts.push(alert);
    this.notifySubscribers(alert);
    this.processAlert(alert);
    
    return alert;
  }
  
  private processAlert(alert: SecurityAlert): void {
    // Auto-escalate critical alerts
    if (alert.severity === 'critical') {
      this.escalateAlert(alert);
    }
    
    // Send notifications based on configuration
    if (MONITORING_CONFIG.alertChannels.email) {
      this.sendEmailAlert(alert);
    }
    
    if (MONITORING_CONFIG.alertChannels.webhook) {
      this.sendWebhookAlert(alert);
    }
    
    // Log the alert
    console.warn('SECURITY ALERT:', alert.severity.toUpperCase(), alert.title, alert);
  }
  
  private escalateAlert(alert: SecurityAlert): void {
    // Create high-priority incident for critical alerts
    const incident: SecurityIncident = {
      incidentId: `INC_${Date.now()}`,
      title: `CRITICAL: ${alert.title}`,
      description: alert.description,
      severity: 'P1',
      category: 'security',
      status: 'open',
      createdAt: new Date(),
      updatedAt: new Date(),
      evidence: [{
        type: 'log',
        source: alert.source,
        content: JSON.stringify(alert.metadata),
        timestamp: alert.timestamp,
        isProtected: false
      }],
      timeline: [{
        timestamp: new Date(),
        actor: 'system',
        action: 'incident_created',
        description: 'Incident auto-created from critical alert',
        severity: 'critical'
      }],
      mitigationActions: [],
      impact: {
        userImpact: 'high',
        dataImpact: 'medium',
        serviceImpact: 'medium',
        reputationImpact: 'high',
        estimatedAffectedUsers: 0
      }
    };
    
    console.error('CRITICAL INCIDENT CREATED:', incident);
  }
  
  private sendEmailAlert(alert: SecurityAlert): void {
    // Placeholder for email notification
    console.log('EMAIL ALERT:', alert.title, '-', alert.description);
  }
  
  private sendWebhookAlert(alert: SecurityAlert): void {
    // Placeholder for webhook notification
    console.log('WEBHOOK ALERT:', alert.alertId);
  }
  
  private notifySubscribers(alert: SecurityAlert): void {
    this.subscribers.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        console.error('Error notifying alert subscriber:', error);
      }
    });
  }
  
  /**
   * Subscrever para receber alertas
   */
  subscribe(callback: (alert: SecurityAlert) => void): () => void {
    this.subscribers.push(callback);
    return () => {
      const index = this.subscribers.indexOf(callback);
      if (index > -1) {
        this.subscribers.splice(index, 1);
      }
    };
  }
  
  /**
   * Confirmar alerta
   */
  acknowledgeAlert(alertId: string, acknowledgedBy: string): boolean {
    const alert = this.alerts.find(a => a.alertId === alertId);
    if (alert && !alert.isAcknowledged) {
      alert.isAcknowledged = true;
      alert.acknowledgedBy = acknowledgedBy;
      alert.acknowledgedAt = new Date();
      return true;
    }
    return false;
  }
  
  /**
   * Obter alertas ativos
   */
  getActiveAlerts(): SecurityAlert[] {
    return this.alerts.filter(a => !a.isAcknowledged);
  }
  
  /**
   * Obter alertas por severidade
   */
  getAlertsBySeverity(severity: ThreatSeverity): SecurityAlert[] {
    return this.alerts.filter(a => a.severity === severity);
  }
}

// ================== SISTEMA PRINCIPAL DE MONITORAMENTO ==================

class SecurityMonitoringSystem {
  private metricsCollector = new MetricsCollector();
  private threatDetector = new ThreatDetector();
  private alertManager = new AlertManager();
  private isRunning = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  
  /**
   * Iniciar monitoramento
   */
  startMonitoring(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('Security monitoring started');
    
    // Start monitoring loop
    this.monitoringInterval = setInterval(() => {
      this.performMonitoringCycle();
    }, 60000); // Every minute
    
    // Initial monitoring cycle
    this.performMonitoringCycle();
  }
  
  /**
   * Parar monitoramento
   */
  stopMonitoring(): void {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    console.log('Security monitoring stopped');
  }
  
  private async performMonitoringCycle(): Promise<void> {
    try {
      // Collect metrics
      const metrics = this.metricsCollector.collectCurrentMetrics();
      
      // Check for threshold violations
      this.checkThresholds(metrics);
      
      // Detect threats
      const events = this.getRecentEvents();
      const threats = this.threatDetector.analyzeForThreats(events);
      
      // Process threats
      threats.forEach(threat => {
        if (threat.isActive) {
          this.alertManager.createAlert(
            `Threat Detected: ${threat.threatType}`,
            threat.description,
            threat.severity,
            'security',
            'threat_detector',
            { threat, indicators: threat.indicators }
          );
        }
      });
      
    } catch (error) {
      console.error('Error in monitoring cycle:', error);
      
      this.alertManager.createAlert(
        'Monitoring System Error',
        `Error in monitoring cycle: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'high',
        'security',
        'monitoring_system',
        { error: error instanceof Error ? error.message : 'Unknown error' }
      );
    }
  }
  
  private checkThresholds(metrics: SecurityMetrics): void {
    const thresholds = MONITORING_CONFIG.alertThresholds;
    
    // Check critical events threshold
    if (metrics.riskDistribution.critical >= thresholds.criticalEvents) {
      this.alertManager.createAlert(
        'Critical Events Threshold Exceeded',
        `${metrics.riskDistribution.critical} critical events detected in the last hour`,
        'critical',
        'security',
        'metrics_collector',
        { metrics: metrics.riskDistribution }
      );
    }
    
    // Check high risk events threshold
    if (metrics.riskDistribution.high >= thresholds.highRiskEvents) {
      this.alertManager.createAlert(
        'High Risk Events Threshold Exceeded',
        `${metrics.riskDistribution.high} high risk events detected in the last hour`,
        'high',
        'security',
        'metrics_collector',
        { metrics: metrics.riskDistribution }
      );
    }
    
    // Check performance thresholds
    if (metrics.performanceMetrics.averageResponseTime > thresholds.responseTime) {
      this.alertManager.createAlert(
        'Response Time Threshold Exceeded',
        `Average response time is ${metrics.performanceMetrics.averageResponseTime}ms`,
        'medium',
        'performance',
        'metrics_collector',
        { responseTime: metrics.performanceMetrics.averageResponseTime }
      );
    }
    
    if (metrics.performanceMetrics.errorRate > thresholds.errorRate) {
      this.alertManager.createAlert(
        'Error Rate Threshold Exceeded',
        `Error rate is ${(metrics.performanceMetrics.errorRate * 100).toFixed(2)}%`,
        'high',
        'performance',
        'metrics_collector',
        { errorRate: metrics.performanceMetrics.errorRate }
      );
    }
  }
  
  private getRecentEvents(): SecurityAudit[] {
    // In production, this would query the actual security log
    // For now, return empty array
    return [];
  }
  
  /**
   * Obter dashboard de segurança
   */
  getSecurityDashboard(): SecurityDashboard {
    const metrics = this.metricsCollector.collectCurrentMetrics();
    const activeAlerts = this.alertManager.getActiveAlerts();
    
    return {
      timestamp: new Date(),
      systemStatus: {
        threatLevel: metrics.threatLevel,
        systemHealth: metrics.systemHealth.overall,
        activeIncidents: metrics.activeIncidents,
        activeAlerts: activeAlerts.length
      },
      metrics,
      alerts: {
        active: activeAlerts,
        bySeverity: {
          critical: this.alertManager.getAlertsBySeverity('critical').length,
          high: this.alertManager.getAlertsBySeverity('high').length,
          medium: this.alertManager.getAlertsBySeverity('medium').length,
          low: this.alertManager.getAlertsBySeverity('low').length
        }
      },
      recommendations: this.generateRecommendations(metrics, activeAlerts)
    };
  }
  
  private generateRecommendations(metrics: SecurityMetrics, alerts: SecurityAlert[]): string[] {
    const recommendations: string[] = [];
    
    if (metrics.threatLevel === 'red') {
      recommendations.push('URGENT: Investigate critical security threats immediately');
    }
    
    if (metrics.systemHealth.overall === 'unhealthy') {
      recommendations.push('System health is compromised - check component status');
    }
    
    if (alerts.filter(a => a.severity === 'critical').length > 0) {
      recommendations.push('Review and address critical security alerts');
    }
    
    if (metrics.performanceMetrics.errorRate > 0.02) {
      recommendations.push('High error rate detected - investigate system issues');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('System is operating normally - continue monitoring');
    }
    
    return recommendations;
  }
}

// ================== INSTÂNCIAS EXPORTADAS ==================

export const securityMonitoring = new SecurityMonitoringSystem();
export const alertManager = new AlertManager();
export const metricsCollector = new MetricsCollector();
export const threatDetector = new ThreatDetector();

// ================== HOOK PARA COMPONENTES ==================

export function useSecurityMonitoring() {
  return {
    // Monitoring
    startMonitoring: securityMonitoring.startMonitoring.bind(securityMonitoring),
    stopMonitoring: securityMonitoring.stopMonitoring.bind(securityMonitoring),
    getDashboard: securityMonitoring.getSecurityDashboard.bind(securityMonitoring),
    
    // Alerts
    subscribeToAlerts: alertManager.subscribe.bind(alertManager),
    acknowledgeAlert: alertManager.acknowledgeAlert.bind(alertManager),
    getActiveAlerts: alertManager.getActiveAlerts.bind(alertManager),
    
    // Metrics
    collectMetrics: metricsCollector.collectCurrentMetrics.bind(metricsCollector),
    
    // Configuration
    config: MONITORING_CONFIG
  };
}

const SecurityMonitoringModule = {
  securityMonitoring,
  alertManager,
  useSecurityMonitoring,
  MONITORING_CONFIG
};

export default SecurityMonitoringModule;