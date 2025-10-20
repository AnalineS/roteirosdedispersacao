'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { auditHeadingHierarchy, type HeadingAuditResult, type HeadingViolation } from '@/utils/accessibility/headingHierarchyAudit';
import ContrastAuditPanel from './ContrastAuditPanel';
import TypographyAuditPanel from './TypographyAuditPanel';
import PWAValidationPanel from '../pwa/PWAValidationPanel';
import UXInstrumentationPanel from '../dx/UXInstrumentationPanel';
import type { ContrastAuditReport } from '@/utils/accessibility/contrastRatioChecker';

interface AccessibilityAuditPanelProps {
  autoRun?: boolean;
  showPanel?: boolean;
  onToggle?: (show: boolean) => void;
  className?: string;
}

export default function AccessibilityAuditPanel({
  autoRun = false,
  showPanel = false,
  onToggle,
  className = ''
}: AccessibilityAuditPanelProps) {
  const [auditResult, setAuditResult] = useState<HeadingAuditResult | null>(null);
  const [contrastReport, setContrastReport] = useState<ContrastAuditReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(showPanel);
  const [selectedTab, setSelectedTab] = useState<'summary' | 'headings' | 'contrast' | 'typography' | 'pwa' | 'ux-dx' | 'recommendations'>('summary');
  const [showTypographyAudit, setShowTypographyAudit] = useState(false);
  const [showPWAAudit, setShowPWAAudit] = useState(false);
  const [showUXInstrumentation, setShowUXInstrumentation] = useState(false);

  // Run audit
  const runAudit = useCallback(async () => {
    setIsLoading(true);
    try {
      // Small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 500));
      const result = auditHeadingHierarchy(document);
      setAuditResult(result);
    } catch (_error) {
      // Log falha de auditoria de acessibilidade via analytics
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'accessibility_audit_failed', {
          event_category: 'error',
          event_label: 'audit_failure',
          value: 1,
          custom_parameters: {
            transport_type: 'beacon'
          }
        });
      }

      // Definir estado de erro para exibição adequada ao usuário
      setAuditResult({
        isValid: false,
        violations: [],
        summary: {
          totalHeadings: 0,
          h1Count: 0,
          h2Count: 0,
          h3Count: 0,
          h4Count: 0,
          h5Count: 0,
          h6Count: 0,
          errorCount: 1,
          warningCount: 0,
          score: 0
        },
        recommendations: ['Falha na auditoria de acessibilidade - tente recarregar a página']
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-run audit on mount
  useEffect(() => {
    if (autoRun) {
      runAudit();
    }
  }, [autoRun, runAudit]);

  // Handle panel toggle
  const handleToggle = useCallback(() => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    onToggle?.(newState);
  }, [isExpanded, onToggle]);

  // Get severity color
  const getSeverityColor = (severity: HeadingViolation['severity']) => {
    switch (severity) {
      case 'error': return '#dc2626';
      case 'warning': return '#d97706';
      case 'info': return '#2563eb';
      default: return '#6b7280';
    }
  };

  // Get severity icon
  const getSeverityIcon = (severity: HeadingViolation['severity']) => {
    switch (severity) {
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '•';
    }
  };

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 90) return '#059669';
    if (score >= 70) return '#d97706';
    return '#dc2626';
  };

  // Get score label
  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Needs Improvement';
    return 'Poor';
  };

  const summary = auditResult?.summary;
  const violations = auditResult?.violations || [];
  const recommendations = auditResult?.recommendations || [];

  return (
    <div className={`accessibility-audit-panel ${className}`}>
      {/* Toggle Button */}
      <button
        onClick={handleToggle}
        className="audit-toggle-button"
        aria-label={isExpanded ? 'Hide accessibility audit' : 'Show accessibility audit'}
        aria-expanded={isExpanded}
      >
        <span className="toggle-icon">
          {isExpanded ? '▼' : '▶'}
        </span>
        <span className="toggle-text">
          Accessibility Audit
          {summary && (
            <span className="score-badge" style={{ backgroundColor: getScoreColor(summary.score) }}>
              {summary.score}
            </span>
          )}
        </span>
      </button>

      {/* Audit Panel */}
      {isExpanded && (
        <div className="audit-panel" role="complementary" aria-label="Accessibility audit results">
          {/* Header */}
          <div className="audit-header">
            <h2 className="audit-title">
              🔍 Heading Hierarchy Audit
            </h2>
            <div className="audit-actions">
              <button
                onClick={runAudit}
                disabled={isLoading}
                className="run-audit-button"
                aria-label="Run accessibility audit"
              >
                {isLoading ? (
                  <>
                    <span className="loading-spinner" />
                    Running...
                  </>
                ) : (
                  <>
                    🔄 Run Audit
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Content */}
          {auditResult && !isLoading && (
            <>
              {/* Tab Navigation */}
              <div className="tab-navigation" role="tablist">
                <button
                  role="tab"
                  aria-selected={selectedTab === 'summary'}
                  aria-controls="summary-panel"
                  id="summary-tab"
                  className={`tab-button ${selectedTab === 'summary' ? 'active' : ''}`}
                  onClick={() => setSelectedTab('summary')}
                >
                  📊 Summary
                </button>
                <button
                  role="tab"
                  aria-selected={selectedTab === 'headings'}
                  aria-controls="headings-panel"
                  id="headings-tab"
                  className={`tab-button ${selectedTab === 'headings' ? 'active' : ''}`}
                  onClick={() => setSelectedTab('headings')}
                >
                  📝 Headings ({violations.length})
                </button>
                <button
                  role="tab"
                  aria-selected={selectedTab === 'contrast'}
                  aria-controls="contrast-panel"
                  id="contrast-tab"
                  className={`tab-button ${selectedTab === 'contrast' ? 'active' : ''}`}
                  onClick={() => setSelectedTab('contrast')}
                >
                  🎨 Colors ({contrastReport?.failCount || '?'})
                </button>
                <button
                  role="tab"
                  aria-selected={selectedTab === 'typography'}
                  aria-controls="typography-panel"
                  id="typography-tab"
                  className={`tab-button ${selectedTab === 'typography' ? 'active' : ''}`}
                  onClick={() => setSelectedTab('typography')}
                >
                  📝 Typography
                </button>
                <button
                  role="tab"
                  aria-selected={selectedTab === 'pwa'}
                  aria-controls="pwa-panel"
                  id="pwa-tab"
                  className={`tab-button ${selectedTab === 'pwa' ? 'active' : ''}`}
                  onClick={() => setSelectedTab('pwa')}
                >
                  📱 PWA
                </button>
                <button
                  role="tab"
                  aria-selected={selectedTab === 'ux-dx'}
                  aria-controls="ux-dx-panel"
                  id="ux-dx-tab"
                  className={`tab-button ${selectedTab === 'ux-dx' ? 'active' : ''}`}
                  onClick={() => setSelectedTab('ux-dx')}
                >
                  🔧 UX DX
                </button>
                <button
                  role="tab"
                  aria-selected={selectedTab === 'recommendations'}
                  aria-controls="recommendations-panel"
                  id="recommendations-tab"
                  className={`tab-button ${selectedTab === 'recommendations' ? 'active' : ''}`}
                  onClick={() => setSelectedTab('recommendations')}
                >
                  💡 Tips ({recommendations.length})
                </button>
              </div>

              {/* Tab Content */}
              <div className="tab-content">
                {/* Summary Tab */}
                {selectedTab === 'summary' && (
                  <div
                    id="summary-panel"
                    role="tabpanel"
                    aria-labelledby="summary-tab"
                    className="tab-panel"
                  >
                    <div className="summary-grid">
                      {/* Overall Score */}
                      <div className="summary-card score-card">
                        <div className="card-header">
                          <h3>Accessibility Score</h3>
                        </div>
                        <div className="score-display">
                          <div 
                            className="score-number"
                            style={{ color: getScoreColor(summary?.score || 0) }}
                          >
                            {summary?.score || 0}
                          </div>
                          <div className="score-label">
                            {getScoreLabel(summary?.score || 0)}
                          </div>
                        </div>
                      </div>

                      {/* Heading Distribution */}
                      <div className="summary-card">
                        <div className="card-header">
                          <h3>Heading Distribution</h3>
                        </div>
                        <div className="heading-stats">
                          <div className="stat-row">
                            <span className="stat-label">Total Headings:</span>
                            <span className="stat-value">{summary?.totalHeadings || 0}</span>
                          </div>
                          <div className="heading-levels">
                            {[1, 2, 3, 4, 5, 6].map(level => (
                              <div key={level} className="level-stat">
                                <span className="level-label">H{level}:</span>
                                <span className="level-count">
                                  {summary?.[`h${level}Count` as keyof typeof summary] || 0}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Issues Summary */}
                      <div className="summary-card">
                        <div className="card-header">
                          <h3>Issues Summary</h3>
                        </div>
                        <div className="issues-stats">
                          <div className="issue-stat error">
                            <span className="issue-icon">❌</span>
                            <span className="issue-count">{summary?.errorCount || 0}</span>
                            <span className="issue-label">Errors</span>
                          </div>
                          <div className="issue-stat warning">
                            <span className="issue-icon">⚠️</span>
                            <span className="issue-count">{summary?.warningCount || 0}</span>
                            <span className="issue-label">Warnings</span>
                          </div>
                          <div className="issue-stat info">
                            <span className="issue-icon">ℹ️</span>
                            <span className="issue-count">
                              {violations.filter(v => v.severity === 'info').length}
                            </span>
                            <span className="issue-label">Info</span>
                          </div>
                        </div>
                      </div>

                      {/* WCAG Compliance */}
                      <div className="summary-card">
                        <div className="card-header">
                          <h3>WCAG Compliance</h3>
                        </div>
                        <div className="wcag-status">
                          <div className={`compliance-indicator ${auditResult.isValid ? 'valid' : 'invalid'}`}>
                            <span className="compliance-icon">
                              {auditResult.isValid ? '✅' : '❌'}
                            </span>
                            <span className="compliance-text">
                              {auditResult.isValid ? 'Compliant' : 'Non-Compliant'}
                            </span>
                          </div>
                          <div className="compliance-criteria">
                            <div>1.3.1 Info and Relationships</div>
                            <div>2.4.1 Bypass Blocks</div>
                            <div>2.4.6 Headings and Labels</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Headings Tab */}
                {selectedTab === 'headings' && (
                  <div
                    id="violations-panel"
                    role="tabpanel"
                    aria-labelledby="violations-tab"
                    className="tab-panel"
                  >
                    {violations.length > 0 ? (
                      <div className="violations-list">
                        {violations.map((violation) => (
                          <div key={violation.id} className="violation-item">
                            <div className="violation-header">
                              <div className="violation-severity">
                                <span 
                                  className="severity-icon"
                                  style={{ color: getSeverityColor(violation.severity) }}
                                  aria-label={`${violation.severity} severity`}
                                >
                                  {getSeverityIcon(violation.severity)}
                                </span>
                                <span className="severity-text">
                                  {violation.severity.toUpperCase()}
                                </span>
                              </div>
                              <div className="violation-element">
                                {violation.element} {violation.level > 0 && `(Level ${violation.level})`}
                              </div>
                            </div>

                            <h4 className="violation-title">
                              {violation.violation}
                            </h4>

                            {violation.text && (
                              <div className="violation-text">
                                <strong>Text:</strong> &quot;{violation.text}&quot;
                              </div>
                            )}

                            <div className="violation-location">
                              <strong>Location:</strong> {violation.location.selector}
                              {violation.location.parent && (
                                <span> (inside {violation.location.parent})</span>
                              )}
                            </div>

                            <div className="violation-recommendation">
                              <strong>Recommendation:</strong> {violation.recommendation}
                            </div>

                            <div className="violation-wcag">
                              <strong>WCAG:</strong> {violation.wcagCriterion}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="no-violations">
                        <div className="no-violations-icon">🎉</div>
                        <h3>No Issues Found!</h3>
                        <p>Your heading hierarchy follows accessibility best practices.</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Contrast Tab */}
                {selectedTab === 'contrast' && (
                  <div
                    id="contrast-panel"
                    role="tabpanel"
                    aria-labelledby="contrast-tab"
                    className="tab-panel"
                  >
                    <ContrastAuditPanel 
                      onAuditComplete={setContrastReport}
                    />
                  </div>
                )}

                {/* Typography Tab */}
                {selectedTab === 'typography' && (
                  <div
                    id="typography-panel"
                    role="tabpanel"
                    aria-labelledby="typography-tab"
                    className="tab-panel"
                  >
                    <TypographyAuditPanel 
                      isOpen={showTypographyAudit}
                      onClose={() => setShowTypographyAudit(false)}
                    />
                    {!showTypographyAudit && (
                      <div className="typography-launcher">
                        <div className="launcher-content">
                          <h3>📝 Auditoria de Tipografia Fluida</h3>
                          <p>Análise do sistema tipográfico responsivo</p>
                          <button 
                            onClick={() => setShowTypographyAudit(true)}
                            className="launch-typography-btn"
                          >
                            🚀 Iniciar Auditoria de Tipografia
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* PWA Tab */}
                {selectedTab === 'pwa' && (
                  <div
                    id="pwa-panel"
                    role="tabpanel"
                    aria-labelledby="pwa-tab"
                    className="tab-panel"
                  >
                    <PWAValidationPanel 
                      isOpen={showPWAAudit}
                      onClose={() => setShowPWAAudit(false)}
                    />
                    {!showPWAAudit && (
                      <div className="typography-launcher">
                        <div className="launcher-content">
                          <h3>📱 Validação PWA</h3>
                          <p>Análise completa de Progressive Web App</p>
                          <button 
                            onClick={() => setShowPWAAudit(true)}
                            className="launch-typography-btn"
                          >
                            🚀 Iniciar Validação PWA
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* UX DX Tab */}
                {selectedTab === 'ux-dx' && (
                  <div
                    id="ux-dx-panel"
                    role="tabpanel"
                    aria-labelledby="ux-dx-tab"
                    className="tab-panel"
                  >
                    <UXInstrumentationPanel 
                      isOpen={showUXInstrumentation}
                      onClose={() => setShowUXInstrumentation(false)}
                    />
                    {!showUXInstrumentation && (
                      <div className="typography-launcher">
                        <div className="launcher-content">
                          <h3>🔧 UX Instrumentation</h3>
                          <p>Monitoramento de experiência do usuário para desenvolvedores</p>
                          <button 
                            onClick={() => setShowUXInstrumentation(true)}
                            className="launch-typography-btn"
                          >
                            🚀 Iniciar Instrumentação UX
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Recommendations Tab */}
                {selectedTab === 'recommendations' && (
                  <div
                    id="recommendations-panel"
                    role="tabpanel"
                    aria-labelledby="recommendations-tab"
                    className="tab-panel"
                  >
                    <div className="recommendations-list">
                      {recommendations.map((recommendation, index) => (
                        <div key={index} className="recommendation-item">
                          <div className="recommendation-number">
                            {index + 1}
                          </div>
                          <div className="recommendation-content">
                            <p>{recommendation}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="loading-state">
              <div className="loading-spinner large" />
              <p>Analyzing heading structure...</p>
            </div>
          )}

          {/* Initial State */}
          {!auditResult && !isLoading && (
            <div className="initial-state">
              <div className="initial-icon">🔍</div>
              <h3>Ready to Audit</h3>
              <p>Click &quot;Run Audit&quot; to analyze the heading hierarchy of this page.</p>
              <button onClick={runAudit} className="start-audit-button">
                🚀 Start Accessibility Audit
              </button>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .accessibility-audit-panel {
          position: fixed;
          bottom: 20px;
          right: 20px;
          z-index: 1000;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .audit-toggle-button {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #003366;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 12px 16px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          transition: all 0.2s ease;
        }

        .audit-toggle-button:hover {
          background: #004080;
          transform: translateY(-1px);
        }

        .audit-toggle-button:focus {
          outline: 2px solid #0066cc;
          outline-offset: 2px;
        }

        .toggle-icon {
          font-size: 12px;
          transition: transform 0.2s ease;
        }

        .score-badge {
          background: #059669;
          color: white;
          font-size: 11px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 10px;
          margin-left: 8px;
        }

        .audit-panel {
          position: absolute;
          bottom: 100%;
          right: 0;
          width: 500px;
          max-width: 90vw;
          background: white;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
          border: 1px solid #e5e7eb;
          margin-bottom: 8px;
          max-height: 600px;
          overflow: hidden;
        }

        .audit-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: #f8fafc;
          border-bottom: 1px solid #e5e7eb;
        }

        .audit-title {
          margin: 0;
          font-size: 16px;
          font-weight: 700;
          color: #1f2937;
        }

        .run-audit-button {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #059669;
          color: white;
          border: none;
          border-radius: 6px;
          padding: 8px 12px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .run-audit-button:hover:not(:disabled) {
          background: #047857;
        }

        .run-audit-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .loading-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .loading-spinner.large {
          width: 24px;
          height: 24px;
          border-width: 3px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .tab-navigation {
          display: flex;
          background: #f8fafc;
          border-bottom: 1px solid #e5e7eb;
        }

        .tab-button {
          flex: 1;
          background: none;
          border: none;
          padding: 12px 16px;
          font-size: 13px;
          font-weight: 500;
          color: #6b7280;
          cursor: pointer;
          border-bottom: 3px solid transparent;
          transition: all 0.2s ease;
        }

        .tab-button.active {
          color: #003366;
          border-bottom-color: #003366;
          background: white;
        }

        .tab-button:hover:not(.active) {
          color: #374151;
          background: #f3f4f6;
        }

        .tab-content {
          max-height: 400px;
          overflow-y: auto;
        }

        .tab-panel {
          padding: 20px;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .summary-card {
          background: #f8fafc;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          overflow: hidden;
        }

        .card-header {
          padding: 12px 16px;
          background: white;
          border-bottom: 1px solid #e5e7eb;
        }

        .card-header h3 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
        }

        .score-card .score-display {
          padding: 20px;
          text-align: center;
        }

        .score-number {
          font-size: 32px;
          font-weight: 800;
          line-height: 1;
        }

        .score-label {
          font-size: 12px;
          font-weight: 500;
          color: #6b7280;
          margin-top: 4px;
        }

        .heading-stats {
          padding: 16px;
        }

        .stat-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .stat-label {
          font-size: 13px;
          color: #6b7280;
        }

        .stat-value {
          font-size: 13px;
          font-weight: 600;
          color: #1f2937;
        }

        .heading-levels {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .level-stat {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 4px 8px;
          background: white;
          border-radius: 4px;
          font-size: 12px;
        }

        .level-label {
          color: #6b7280;
        }

        .level-count {
          font-weight: 600;
          color: #1f2937;
        }

        .issues-stats {
          padding: 16px;
          display: flex;
          justify-content: space-around;
          gap: 12px;
        }

        .issue-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .issue-icon {
          font-size: 16px;
        }

        .issue-count {
          font-size: 18px;
          font-weight: 700;
        }

        .issue-label {
          font-size: 11px;
          color: #6b7280;
          text-transform: uppercase;
        }

        .wcag-status {
          padding: 16px;
        }

        .compliance-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }

        .compliance-icon {
          font-size: 18px;
        }

        .compliance-text {
          font-weight: 600;
          font-size: 14px;
        }

        .compliance-indicator.valid .compliance-text {
          color: #059669;
        }

        .compliance-indicator.invalid .compliance-text {
          color: #dc2626;
        }

        .compliance-criteria {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .compliance-criteria div {
          font-size: 11px;
          color: #6b7280;
        }

        .violations-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .violation-item {
          background: #f8fafc;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
        }

        .violation-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .violation-severity {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .severity-text {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.5px;
        }

        .violation-element {
          font-size: 11px;
          color: #6b7280;
          font-weight: 500;
          text-transform: uppercase;
        }

        .violation-title {
          margin: 0 0 8px 0;
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
        }

        .violation-text,
        .violation-location,
        .violation-recommendation,
        .violation-wcag {
          font-size: 12px;
          line-height: 1.4;
          margin-bottom: 6px;
          color: #4b5563;
        }

        .no-violations {
          text-align: center;
          padding: 40px 20px;
        }

        .no-violations-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .no-violations h3 {
          margin: 0 0 8px 0;
          color: #059669;
          font-size: 18px;
        }

        .no-violations p {
          margin: 0;
          color: #6b7280;
          font-size: 14px;
        }

        .recommendations-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .recommendation-item {
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }

        .recommendation-number {
          background: #3b82f6;
          color: white;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 600;
          flex-shrink: 0;
        }

        .recommendation-content p {
          margin: 0;
          font-size: 14px;
          line-height: 1.5;
          color: #374151;
        }

        .loading-state,
        .initial-state {
          text-align: center;
          padding: 40px 20px;
        }

        .initial-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .initial-state h3 {
          margin: 0 0 8px 0;
          color: #1f2937;
          font-size: 18px;
        }

        .initial-state p {
          margin: 0 0 20px 0;
          color: #6b7280;
          font-size: 14px;
        }

        .start-audit-button {
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 12px 20px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .start-audit-button:hover {
          background: #2563eb;
          transform: translateY(-1px);
        }

        .typography-launcher {
          text-align: center;
          padding: 40px 20px;
        }

        .launcher-content h3 {
          margin: 0 0 8px 0;
          color: #1f2937;
          font-size: 18px;
        }

        .launcher-content p {
          margin: 0 0 20px 0;
          color: #6b7280;
          font-size: 14px;
        }

        .launch-typography-btn {
          background: #8b5cf6;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 12px 20px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .launch-typography-btn:hover {
          background: #7c3aed;
          transform: translateY(-1px);
        }

        /* Mobile responsiveness */
        @media (max-width: 640px) {
          .accessibility-audit-panel {
            bottom: 10px;
            right: 10px;
            left: 10px;
          }

          .audit-panel {
            width: 100%;
            right: auto;
          }

          .summary-grid {
            grid-template-columns: 1fr;
          }

          .tab-button {
            font-size: 11px;
            padding: 10px 8px;
          }
        }

        /* High contrast mode */
        @media (prefers-contrast: high) {
          .audit-panel,
          .summary-card,
          .violation-item {
            border-width: 2px;
          }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .audit-toggle-button,
          .run-audit-button,
          .start-audit-button,
          .tab-button,
          .loading-spinner {
            transition: none !important;
            animation: none !important;
          }

          .audit-toggle-button:hover,
          .start-audit-button:hover {
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
}