'use client';

import React, { useState, useCallback } from 'react';
import { auditContrast, type ContrastAuditReport, type ContrastResult } from '@/utils/accessibility/contrastRatioChecker';

interface ContrastAuditPanelProps {
  onAuditComplete?: (report: ContrastAuditReport) => void;
  className?: string;
}

export default function ContrastAuditPanel({
  onAuditComplete,
  className = ''
}: ContrastAuditPanelProps) {
  const [auditReport, setAuditReport] = useState<ContrastAuditReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'summary' | 'failing' | 'passing' | 'recommendations'>('summary');

  // Run contrast audit
  const runContrastAudit = useCallback(async () => {
    setIsLoading(true);
    try {
      // Small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 300));
      const report = auditContrast(document);
      setAuditReport(report);
      onAuditComplete?.(report);
    } catch (error) {
      console.error('Contrast audit failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [onAuditComplete]);

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 90) return '#059669';
    if (score >= 70) return '#d97706';
    return '#dc2626';
  };

  // Get WCAG level color
  const getWcagColor = (level: ContrastResult['wcagLevel']) => {
    switch (level) {
      case 'AAA': return '#059669';
      case 'AA': return '#0ea5e9';
      case 'A': return '#d97706';
      case 'Fail': return '#dc2626';
      default: return '#6b7280';
    }
  };

  // Get WCAG level icon
  const getWcagIcon = (level: ContrastResult['wcagLevel']) => {
    switch (level) {
      case 'AAA': return '🏆';
      case 'AA': return '✅';
      case 'A': return '⚠️';
      case 'Fail': return '❌';
      default: return '•';
    }
  };

  // Format contrast ratio
  const formatRatio = (ratio: number) => `${ratio}:1`;

  // Filter results by WCAG compliance
  const failingResults = auditReport?.results.filter(r => r.wcagLevel === 'Fail') || [];
  const passingResults = auditReport?.results.filter(r => r.wcagLevel !== 'Fail') || [];

  return (
    <div className={`contrast-audit-panel ${className}`}>
      {/* Header */}
      <div className="audit-header">
        <h2 className="audit-title">
          🎨 Color Contrast Audit
        </h2>
        <button
          onClick={runContrastAudit}
          disabled={isLoading}
          className="run-audit-button"
          aria-label="Run color contrast audit"
        >
          {isLoading ? (
            <>
              <span className="loading-spinner" />
              Analyzing...
            </>
          ) : (
            <>
              🔍 Run Audit
            </>
          )}
        </button>
      </div>

      {/* Content */}
      {auditReport && !isLoading && (
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
              aria-selected={selectedTab === 'failing'}
              aria-controls="failing-panel"
              id="failing-tab"
              className={`tab-button ${selectedTab === 'failing' ? 'active' : ''} ${failingResults.length > 0 ? 'has-issues' : ''}`}
              onClick={() => setSelectedTab('failing')}
            >
              ❌ Failing ({failingResults.length})
            </button>
            <button
              role="tab"
              aria-selected={selectedTab === 'passing'}
              aria-controls="passing-panel"
              id="passing-tab"
              className={`tab-button ${selectedTab === 'passing' ? 'active' : ''}`}
              onClick={() => setSelectedTab('passing')}
            >
              ✅ Passing ({passingResults.length})
            </button>
            <button
              role="tab"
              aria-selected={selectedTab === 'recommendations'}
              aria-controls="recommendations-panel"
              id="recommendations-tab"
              className={`tab-button ${selectedTab === 'recommendations' ? 'active' : ''}`}
              onClick={() => setSelectedTab('recommendations')}
            >
              💡 Tips ({auditReport.recommendations.length})
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
                    <h3>Overall Score</h3>
                    <div className="score-display">
                      <div 
                        className="score-number"
                        style={{ color: getScoreColor(auditReport.overallScore) }}
                      >
                        {auditReport.overallScore}%
                      </div>
                      <div className="score-subtitle">
                        {auditReport.passCount} of {auditReport.totalCombinations} passing
                      </div>
                    </div>
                  </div>

                  {/* WCAG Compliance Breakdown */}
                  <div className="summary-card">
                    <h3>WCAG Compliance</h3>
                    <div className="compliance-stats">
                      <div className="compliance-item aaa">
                        <span className="compliance-icon">🏆</span>
                        <div className="compliance-info">
                          <div className="compliance-count">{auditReport.summary.aaaCompliant}</div>
                          <div className="compliance-label">AAA</div>
                        </div>
                      </div>
                      <div className="compliance-item aa">
                        <span className="compliance-icon">✅</span>
                        <div className="compliance-info">
                          <div className="compliance-count">{auditReport.summary.aaCompliant}</div>
                          <div className="compliance-label">AA</div>
                        </div>
                      </div>
                      <div className="compliance-item a">
                        <span className="compliance-icon">⚠️</span>
                        <div className="compliance-info">
                          <div className="compliance-count">{auditReport.summary.aCompliant}</div>
                          <div className="compliance-label">A</div>
                        </div>
                      </div>
                      <div className="compliance-item fail">
                        <span className="compliance-icon">❌</span>
                        <div className="compliance-info">
                          <div className="compliance-count">{auditReport.summary.failing}</div>
                          <div className="compliance-label">Fail</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="summary-card">
                    <h3>Quick Stats</h3>
                    <div className="quick-stats">
                      <div className="stat-item">
                        <span className="stat-label">Total Combinations:</span>
                        <span className="stat-value">{auditReport.totalCombinations}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Passing:</span>
                        <span className="stat-value success">{auditReport.passCount}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Failing:</span>
                        <span className="stat-value error">{auditReport.failCount}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Success Rate:</span>
                        <span className="stat-value">{auditReport.overallScore}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Failing Results Tab */}
            {selectedTab === 'failing' && (
              <div
                id="failing-panel"
                role="tabpanel"
                aria-labelledby="failing-tab"
                className="tab-panel"
              >
                {failingResults.length > 0 ? (
                  <div className="results-list">
                    {failingResults.map((result, index) => (
                      <ContrastResultCard 
                        key={`failing-${index}`} 
                        result={result} 
                        priority="high"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="no-issues">
                    <div className="no-issues-icon">🎉</div>
                    <h3>No Failing Combinations!</h3>
                    <p>All text colors meet WCAG minimum contrast requirements.</p>
                  </div>
                )}
              </div>
            )}

            {/* Passing Results Tab */}
            {selectedTab === 'passing' && (
              <div
                id="passing-panel"
                role="tabpanel"
                aria-labelledby="passing-tab"
                className="tab-panel"
              >
                <div className="results-list">
                  {passingResults.map((result, index) => (
                    <ContrastResultCard 
                      key={`passing-${index}`} 
                      result={result} 
                      priority="normal"
                    />
                  ))}
                </div>
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
                  {auditReport.recommendations.map((recommendation, index) => (
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
          <p>Analyzing color contrast ratios...</p>
        </div>
      )}

      {/* Initial State */}
      {!auditReport && !isLoading && (
        <div className="initial-state">
          <div className="initial-icon">🎨</div>
          <h3>Ready to Check Colors</h3>
          <p>Analyze all text colors on this page for WCAG compliance.</p>
          <button onClick={runContrastAudit} className="start-audit-button">
            🚀 Start Color Audit
          </button>
        </div>
      )}

      <style jsx>{`
        .contrast-audit-panel {
          background: white;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .audit-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          background: #f8fafc;
          border-bottom: 1px solid #e5e7eb;
        }

        .audit-title {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
          color: #1f2937;
        }

        .run-audit-button {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #8b5cf6;
          color: white;
          border: none;
          border-radius: 8px;
          padding: 10px 16px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .run-audit-button:hover:not(:disabled) {
          background: #7c3aed;
          transform: translateY(-1px);
        }

        .run-audit-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .loading-spinner {
          width: 16px;
          height: 16px;
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
          color: #8b5cf6;
          border-bottom-color: #8b5cf6;
          background: white;
        }

        .tab-button.has-issues {
          background: #fef2f2;
        }

        .tab-button:hover:not(.active) {
          color: #374151;
          background: #f3f4f6;
        }

        .tab-content {
          max-height: 600px;
          overflow-y: auto;
        }

        .tab-panel {
          padding: 20px;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }

        .summary-card {
          background: #f8fafc;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 20px;
        }

        .summary-card h3 {
          margin: 0 0 16px 0;
          font-size: 16px;
          font-weight: 600;
          color: #374151;
        }

        .score-display {
          text-align: center;
        }

        .score-number {
          font-size: 36px;
          font-weight: 800;
          line-height: 1;
        }

        .score-subtitle {
          font-size: 14px;
          color: #6b7280;
          margin-top: 8px;
        }

        .compliance-stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        .compliance-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: white;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
        }

        .compliance-icon {
          font-size: 20px;
          flex-shrink: 0;
        }

        .compliance-info {
          flex: 1;
        }

        .compliance-count {
          font-size: 20px;
          font-weight: 700;
          line-height: 1;
        }

        .compliance-label {
          font-size: 12px;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .quick-stats {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .stat-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #f3f4f6;
        }

        .stat-item:last-child {
          border-bottom: none;
        }

        .stat-label {
          font-size: 14px;
          color: #6b7280;
        }

        .stat-value {
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
        }

        .stat-value.success {
          color: #059669;
        }

        .stat-value.error {
          color: #dc2626;
        }

        .results-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .no-issues {
          text-align: center;
          padding: 40px 20px;
        }

        .no-issues-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .no-issues h3 {
          margin: 0 0 8px 0;
          color: #059669;
          font-size: 20px;
        }

        .no-issues p {
          margin: 0;
          color: #6b7280;
          font-size: 16px;
        }

        .recommendations-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .recommendation-item {
          display: flex;
          gap: 16px;
          align-items: flex-start;
        }

        .recommendation-number {
          background: #8b5cf6;
          color: white;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 600;
          flex-shrink: 0;
        }

        .recommendation-content p {
          margin: 0;
          font-size: 15px;
          line-height: 1.6;
          color: #374151;
        }

        .loading-state,
        .initial-state {
          text-align: center;
          padding: 60px 20px;
        }

        .initial-icon {
          font-size: 64px;
          margin-bottom: 20px;
        }

        .initial-state h3 {
          margin: 0 0 12px 0;
          color: #1f2937;
          font-size: 22px;
        }

        .initial-state p {
          margin: 0 0 24px 0;
          color: #6b7280;
          font-size: 16px;
        }

        .start-audit-button {
          background: #8b5cf6;
          color: white;
          border: none;
          border-radius: 10px;
          padding: 16px 24px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .start-audit-button:hover {
          background: #7c3aed;
          transform: translateY(-2px);
        }

        /* Mobile responsiveness */
        @media (max-width: 640px) {
          .summary-grid {
            grid-template-columns: 1fr;
          }

          .compliance-stats {
            grid-template-columns: 1fr;
          }

          .tab-button {
            font-size: 11px;
            padding: 10px 8px;
          }
        }
      `}</style>
    </div>
  );
}

// Individual contrast result card component
function ContrastResultCard({ result, priority }: { result: ContrastResult; priority: 'high' | 'normal' }) {
  const getWcagColor = (level: ContrastResult['wcagLevel']) => {
    switch (level) {
      case 'AAA': return '#059669';
      case 'AA': return '#0ea5e9';
      case 'A': return '#d97706';
      case 'Fail': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const getWcagIcon = (level: ContrastResult['wcagLevel']) => {
    switch (level) {
      case 'AAA': return '🏆';
      case 'AA': return '✅';
      case 'A': return '⚠️';
      case 'Fail': return '❌';
      default: return '•';
    }
  };

  return (
    <div className={`contrast-result-card ${priority}`}>
      <div className="result-header">
        <div className="result-badge">
          <span 
            className="wcag-icon"
            style={{ color: getWcagColor(result.wcagLevel) }}
          >
            {getWcagIcon(result.wcagLevel)}
          </span>
          <span className="wcag-level">
            {result.wcagLevel}
          </span>
        </div>
        <div className="contrast-ratio">
          {result.contrastRatio.toFixed(1)}:1
        </div>
      </div>

      <div className="color-sample">
        <div className="color-preview">
          <div 
            className="color-swatch"
            style={{
              backgroundColor: result.combination.background,
              color: result.combination.foreground,
              padding: '8px 12px',
              borderRadius: '4px',
              fontSize: result.isTextLarge ? '18px' : '14px',
              fontWeight: result.isTextLarge ? '700' : '400'
            }}
          >
            Sample Text
          </div>
        </div>
        <div className="color-details">
          <div className="color-info">
            <span className="color-label">Text:</span>
            <span className="color-value">{result.combination.foreground}</span>
          </div>
          <div className="color-info">
            <span className="color-label">Background:</span>
            <span className="color-value">{result.combination.background}</span>
          </div>
        </div>
      </div>

      <div className="result-context">
        <div className="context-info">
          <strong>Element:</strong> {result.combination.element}
          {result.isTextLarge && <span className="text-size-badge">Large Text</span>}
        </div>
        <div className="context-text">
          <strong>Content:</strong> "{result.combination.context}"
        </div>
        {result.combination.location && (
          <div className="context-location">
            <strong>Location:</strong> {result.combination.location}
          </div>
        )}
      </div>

      {result.recommendation && (
        <div className="result-recommendation">
          <strong>Recommendation:</strong> {result.recommendation}
        </div>
      )}

      <style jsx>{`
        .contrast-result-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 20px;
          transition: all 0.2s ease;
        }

        .contrast-result-card.high {
          border-left: 4px solid #dc2626;
          background: #fefefe;
        }

        .contrast-result-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transform: translateY(-1px);
        }

        .result-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .result-badge {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .wcag-icon {
          font-size: 18px;
        }

        .wcag-level {
          font-weight: 700;
          font-size: 14px;
          color: #374151;
        }

        .contrast-ratio {
          font-size: 16px;
          font-weight: 600;
          color: #1f2937;
          background: #f3f4f6;
          padding: 4px 8px;
          border-radius: 6px;
        }

        .color-sample {
          margin-bottom: 16px;
        }

        .color-preview {
          margin-bottom: 12px;
          display: flex;
          justify-content: center;
        }

        .color-swatch {
          border: 1px solid #e5e7eb;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .color-details {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .color-info {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
        }

        .color-label {
          color: #6b7280;
          font-weight: 500;
        }

        .color-value {
          font-family: 'Monaco', 'Consolas', monospace;
          background: #f3f4f6;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 12px;
        }

        .result-context {
          margin-bottom: 16px;
          font-size: 14px;
          line-height: 1.5;
        }

        .context-info,
        .context-text,
        .context-location {
          margin-bottom: 8px;
          color: #4b5563;
        }

        .text-size-badge {
          background: #dbeafe;
          color: #1e40af;
          font-size: 11px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 12px;
          margin-left: 8px;
        }

        .result-recommendation {
          font-size: 14px;
          color: #374151;
          background: #f0f9ff;
          padding: 12px;
          border-radius: 8px;
          border-left: 3px solid #0ea5e9;
        }

        /* Mobile responsiveness */
        @media (max-width: 640px) {
          .result-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .color-details {
            gap: 8px;
          }

          .color-info {
            flex-direction: column;
            gap: 4px;
          }
        }
      `}</style>
    </div>
  );
}