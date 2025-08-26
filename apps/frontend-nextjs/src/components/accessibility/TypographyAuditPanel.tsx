'use client';

import React, { useState, useEffect } from 'react';
import { FluidTypographyAuditor, auditFluidTypography, type FluidTypographyReport, type FluidTypographyViolation, type TypographyScale } from '@/utils/typography/fluidTypographyAuditor';

interface TypographyAuditPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TypographyAuditPanel({ isOpen, onClose }: TypographyAuditPanelProps) {
  const [auditResult, setAuditResult] = useState<FluidTypographyReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedViolation, setSelectedViolation] = useState<number | null>(null);
  const [showScale, setShowScale] = useState(false);

  const runAudit = async () => {
    setIsLoading(true);
    try {
      // Small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 500));
      const result = auditFluidTypography();
      setAuditResult(result);
    } catch (error) {
      console.error('Typography audit failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !auditResult) {
      runAudit();
    }
  }, [isOpen]);

  const getSeverityIcon = (severity: FluidTypographyViolation['severity']) => {
    switch (severity) {
      case 'error': return '🔴';
      case 'warning': return '🟡';
      case 'info': return '🔵';
      default: return '⚪';
    }
  };

  const getSeverityColor = (severity: FluidTypographyViolation['severity']) => {
    switch (severity) {
      case 'error': return '#dc2626';
      case 'warning': return '#d97706';
      case 'info': return '#2563eb';
      default: return '#6b7280';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#059669';
    if (score >= 70) return '#d97706';
    return '#dc2626';
  };

  const generateOptimalScale = () => {
    return FluidTypographyAuditor.generateFluidScale(16, 1.25);
  };

  if (!isOpen) return null;

  return (
    <div className="typography-audit-panel">
      <div className="audit-overlay" onClick={onClose} />
      <div className="audit-content">
        <div className="audit-header">
          <div className="header-content">
            <h2>📝 Auditoria de Tipografia Fluida</h2>
            <p>Análise completa do sistema tipográfico responsivo</p>
          </div>
          <div className="header-actions">
            <button onClick={runAudit} disabled={isLoading} className="refresh-btn">
              {isLoading ? '⟳' : '🔄'} {isLoading ? 'Analisando...' : 'Executar Nova Auditoria'}
            </button>
            <button onClick={onClose} className="close-btn">✕</button>
          </div>
        </div>

        <div className="audit-body">
          {isLoading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Analisando tipografia fluida...</p>
              <small>Verificando clamp(), acessibilidade e consistência</small>
            </div>
          ) : auditResult ? (
            <>
              {/* Summary Cards */}
              <div className="summary-grid">
                <div className="summary-card">
                  <div className="card-icon">📊</div>
                  <div className="card-content">
                    <div className="card-value">{auditResult.fluidElements}</div>
                    <div className="card-label">Elementos Fluidos</div>
                    <div className="card-sublabel">de {auditResult.totalElements} elementos</div>
                  </div>
                </div>

                <div className="summary-card">
                  <div className="card-icon">♿</div>
                  <div className="card-content">
                    <div className="card-value" style={{ color: getScoreColor(auditResult.accessibilityScore) }}>
                      {auditResult.accessibilityScore}%
                    </div>
                    <div className="card-label">Acessibilidade</div>
                    <div className="card-sublabel">WCAG 2.1 AA</div>
                  </div>
                </div>

                <div className="summary-card">
                  <div className="card-icon">⚡</div>
                  <div className="card-content">
                    <div className="card-value" style={{ color: getScoreColor(auditResult.performanceScore) }}>
                      {auditResult.performanceScore}%
                    </div>
                    <div className="card-label">Performance</div>
                    <div className="card-sublabel">Otimização</div>
                  </div>
                </div>

                <div className="summary-card">
                  <div className="card-icon">✅</div>
                  <div className="card-content">
                    <div className="card-value">{auditResult.summary.passed}</div>
                    <div className="card-label">Aprovados</div>
                    <div className="card-sublabel">{auditResult.summary.errors} erros, {auditResult.summary.warnings} avisos</div>
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="audit-tabs">
                <button 
                  className={`tab-btn ${!showScale ? 'active' : ''}`}
                  onClick={() => setShowScale(false)}
                >
                  🔍 Violações ({auditResult.violations.length})
                </button>
                <button 
                  className={`tab-btn ${showScale ? 'active' : ''}`}
                  onClick={() => setShowScale(true)}
                >
                  📏 Escala Tipográfica ({auditResult.typographyScale.length})
                </button>
              </div>

              {!showScale ? (
                /* Violations Tab */
                <div className="violations-section">
                  {auditResult.violations.length === 0 ? (
                    <div className="no-violations">
                      <div className="success-icon">🎉</div>
                      <h3>Tipografia Otimizada!</h3>
                      <p>Nenhuma violação encontrada no sistema tipográfico.</p>
                    </div>
                  ) : (
                    <div className="violations-list">
                      {auditResult.violations.map((violation, index) => (
                        <div 
                          key={index}
                          className={`violation-card ${violation.severity}`}
                          onClick={() => setSelectedViolation(selectedViolation === index ? null : index)}
                        >
                          <div className="violation-header">
                            <div className="violation-title">
                              <span className="severity-icon">
                                {getSeverityIcon(violation.severity)}
                              </span>
                              <span className="element-name">{violation.element}</span>
                            </div>
                            <div className="violation-type">{violation.type}</div>
                          </div>
                          
                          <div className="violation-message">{violation.message}</div>
                          
                          {selectedViolation === index && (
                            <div className="violation-details">
                              <div className="detail-section">
                                <strong>Recomendação:</strong>
                                <p>{violation.recommendation}</p>
                              </div>
                              
                              {violation.currentValue && (
                                <div className="detail-section">
                                  <strong>Valor Atual:</strong>
                                  <code>{violation.currentValue}</code>
                                </div>
                              )}
                              
                              {violation.suggestedValue && (
                                <div className="detail-section">
                                  <strong>Valor Sugerido:</strong>
                                  <code>{violation.suggestedValue}</code>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Typography Scale Tab */
                <div className="scale-section">
                  {auditResult.typographyScale.length === 0 ? (
                    <div className="no-scale">
                      <div className="info-icon">💡</div>
                      <h3>Nenhuma Tipografia Fluida Detectada</h3>
                      <p>Considere implementar tipografia fluida para melhor design responsivo.</p>
                      <div className="suggested-scale">
                        <h4>Escala Sugerida:</h4>
                        <div className="scale-examples">
                          {Object.entries(generateOptimalScale()).map(([size, value]) => (
                            <div key={size} className="scale-example">
                              <code className="size-name">{size}:</code>
                              <code className="size-value">{value}</code>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="scale-list">
                      {auditResult.typographyScale.map((scale, index) => (
                        <div key={index} className={`scale-card ${scale.isAccessible ? 'accessible' : 'not-accessible'}`}>
                          <div className="scale-header">
                            <div className="scale-name">{scale.name}</div>
                            <div className="accessibility-badge">
                              {scale.isAccessible ? '♿ Acessível' : '⚠️ Não Acessível'}
                            </div>
                          </div>
                          
                          <div className="scale-metrics">
                            <div className="metric">
                              <span className="metric-label">Min:</span>
                              <span className="metric-value">{scale.minSize.toFixed(1)}px</span>
                            </div>
                            <div className="metric">
                              <span className="metric-label">Max:</span>
                              <span className="metric-value">{scale.maxSize.toFixed(1)}px</span>
                            </div>
                            <div className="metric">
                              <span className="metric-label">Escala:</span>
                              <span className="metric-value">{scale.scaleFactor.toFixed(2)}x</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Recommendations */}
              {auditResult.recommendations.length > 0 && (
                <div className="recommendations-section">
                  <h3>💡 Recomendações</h3>
                  <div className="recommendations-list">
                    {auditResult.recommendations.map((rec, index) => (
                      <div key={index} className="recommendation-item">
                        <span className="rec-icon">✅</span>
                        <span className="rec-text">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📝</div>
              <p>Clique em "Executar Nova Auditoria" para analisar a tipografia.</p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .typography-audit-panel {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .audit-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
        }

        .audit-content {
          position: relative;
          width: min(95vw, 900px);
          max-height: 90vh;
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          display: flex;
          flex-direction: column;
        }

        .audit-header {
          padding: 24px;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .header-content h2 {
          margin: 0 0 4px 0;
          font-size: 20px;
          font-weight: 700;
          color: #1f2937;
        }

        .header-content p {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
        }

        .header-actions {
          display: flex;
          gap: 12px;
        }

        .refresh-btn, .close-btn {
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

        .refresh-btn:hover:not(:disabled) {
          background: #2563eb;
        }

        .refresh-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .close-btn {
          background: #f3f4f6;
          color: #6b7280;
        }

        .close-btn:hover {
          background: #e5e7eb;
          color: #374151;
        }

        .audit-body {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
        }

        .loading-state {
          text-align: center;
          padding: 60px 20px;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f4f6;
          border-top: 4px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px auto;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .summary-card {
          background: #f8fafc;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .card-icon {
          font-size: 32px;
          line-height: 1;
        }

        .card-value {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 4px;
          color: #1f2937;
        }

        .card-label {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
        }

        .card-sublabel {
          font-size: 12px;
          color: #6b7280;
        }

        .audit-tabs {
          display: flex;
          gap: 4px;
          margin-bottom: 24px;
          background: #f3f4f6;
          padding: 4px;
          border-radius: 8px;
        }

        .tab-btn {
          flex: 1;
          padding: 12px 16px;
          border: none;
          background: transparent;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .tab-btn.active {
          background: white;
          color: #1f2937;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .violations-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .violation-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .violation-card:hover {
          border-color: #d1d5db;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        }

        .violation-card.error {
          border-left: 4px solid #dc2626;
        }

        .violation-card.warning {
          border-left: 4px solid #d97706;
        }

        .violation-card.info {
          border-left: 4px solid #2563eb;
        }

        .violation-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .violation-title {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .element-name {
          font-weight: 600;
          color: #1f2937;
        }

        .violation-type {
          font-size: 12px;
          padding: 4px 8px;
          background: #f3f4f6;
          border-radius: 4px;
          color: #6b7280;
        }

        .violation-message {
          color: #374151;
          font-size: 14px;
          line-height: 1.5;
        }

        .violation-details {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #f3f4f6;
        }

        .detail-section {
          margin-bottom: 12px;
        }

        .detail-section strong {
          display: block;
          margin-bottom: 4px;
          color: #374151;
          font-size: 13px;
        }

        .detail-section p {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
          line-height: 1.4;
        }

        .detail-section code {
          background: #f3f4f6;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 13px;
          color: #1f2937;
          font-family: 'Courier New', monospace;
        }

        .scale-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .scale-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
        }

        .scale-card.accessible {
          border-left: 4px solid #059669;
        }

        .scale-card.not-accessible {
          border-left: 4px solid #dc2626;
        }

        .scale-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .scale-name {
          font-weight: 600;
          color: #1f2937;
        }

        .accessibility-badge {
          font-size: 12px;
          padding: 4px 8px;
          border-radius: 4px;
          background: #f3f4f6;
        }

        .scale-metrics {
          display: flex;
          gap: 24px;
        }

        .metric {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .metric-label {
          font-size: 12px;
          color: #6b7280;
        }

        .metric-value {
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
        }

        .no-violations, .no-scale, .empty-state {
          text-align: center;
          padding: 60px 20px;
        }

        .success-icon, .info-icon, .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .suggested-scale {
          margin-top: 24px;
          text-align: left;
          background: #f8fafc;
          padding: 20px;
          border-radius: 8px;
        }

        .scale-examples {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 8px;
          margin-top: 12px;
        }

        .scale-example {
          display: flex;
          justify-content: space-between;
          padding: 8px 12px;
          background: white;
          border-radius: 4px;
          border: 1px solid #e5e7eb;
        }

        .size-name, .size-value {
          font-family: 'Courier New', monospace;
          font-size: 13px;
        }

        .size-name {
          font-weight: 600;
          color: #3b82f6;
        }

        .recommendations-section {
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #e5e7eb;
        }

        .recommendations-section h3 {
          margin: 0 0 16px 0;
          font-size: 16px;
          color: #1f2937;
        }

        .recommendations-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .recommendation-item {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          padding: 12px;
          background: #f0fdf4;
          border-radius: 8px;
          border: 1px solid #bbf7d0;
        }

        .rec-text {
          color: #166534;
          font-size: 14px;
          line-height: 1.4;
        }

        @media (max-width: 768px) {
          .audit-content {
            width: 95vw;
            height: 90vh;
            margin: 20px;
          }

          .summary-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .card-content {
            font-size: 12px;
          }

          .card-value {
            font-size: 18px;
          }
        }
      `}</style>
    </div>
  );
}