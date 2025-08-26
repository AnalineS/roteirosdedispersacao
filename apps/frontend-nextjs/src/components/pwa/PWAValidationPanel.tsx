'use client';

import React, { useState, useEffect } from 'react';
import { validatePWA, type PWAValidationReport } from '@/utils/pwa/pwaValidator';

interface PWAValidationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PWAValidationPanel({ isOpen, onClose }: PWAValidationPanelProps) {
  const [validationResult, setValidationResult] = useState<PWAValidationReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'summary' | 'manifest' | 'service-worker' | 'performance'>('summary');

  const runValidation = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800)); // Show loading
      const result = await validatePWA();
      setValidationResult(result);
    } catch (error) {
      console.error('PWA validation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !validationResult) {
      runValidation();
    }
  }, [isOpen]);

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#059669';
    if (score >= 70) return '#d97706';
    return '#dc2626';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excelente';
    if (score >= 70) return 'Bom';
    if (score >= 50) return 'Precisa Melhorar';
    return 'Crítico';
  };

  if (!isOpen) return null;

  return (
    <div className="pwa-validation-panel">
      <div className="validation-overlay" onClick={onClose} />
      <div className="validation-content">
        <div className="validation-header">
          <div className="header-content">
            <h2>📱 Validação PWA</h2>
            <p>Análise completa de Progressive Web App</p>
          </div>
          <div className="header-actions">
            <button onClick={runValidation} disabled={isLoading} className="refresh-btn">
              {isLoading ? '⟳' : '🔄'} {isLoading ? 'Validando...' : 'Nova Validação'}
            </button>
            <button onClick={onClose} className="close-btn">✕</button>
          </div>
        </div>

        <div className="validation-body">
          {isLoading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Analisando configuração PWA...</p>
              <small>Verificando manifest, service worker e instalabilidade</small>
            </div>
          ) : validationResult ? (
            <>
              {/* Overall Score */}
              <div className="overall-score">
                <div className="score-circle" style={{ borderColor: getScoreColor(validationResult.overallScore) }}>
                  <span className="score-number" style={{ color: getScoreColor(validationResult.overallScore) }}>
                    {validationResult.overallScore}
                  </span>
                  <span className="score-label">
                    {getScoreLabel(validationResult.overallScore)}
                  </span>
                </div>
                <div className="score-details">
                  <h3>Score PWA</h3>
                  <p>Baseado em manifest, service worker e instalabilidade</p>
                  <div className="installability-status">
                    {validationResult.installability.isInstallable ? (
                      <span className="status-badge installable">✅ Instalável</span>
                    ) : (
                      <span className="status-badge not-installable">❌ Não Instalável</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="validation-tabs">
                <button 
                  className={`tab-btn ${selectedTab === 'summary' ? 'active' : ''}`}
                  onClick={() => setSelectedTab('summary')}
                >
                  📊 Resumo
                </button>
                <button 
                  className={`tab-btn ${selectedTab === 'manifest' ? 'active' : ''}`}
                  onClick={() => setSelectedTab('manifest')}
                >
                  📄 Manifest ({validationResult.manifest.errors.length + validationResult.manifest.warnings.length})
                </button>
                <button 
                  className={`tab-btn ${selectedTab === 'service-worker' ? 'active' : ''}`}
                  onClick={() => setSelectedTab('service-worker')}
                >
                  ⚙️ Service Worker ({validationResult.serviceWorker.errors.length + validationResult.serviceWorker.warnings.length})
                </button>
                <button 
                  className={`tab-btn ${selectedTab === 'performance' ? 'active' : ''}`}
                  onClick={() => setSelectedTab('performance')}
                >
                  ⚡ Performance
                </button>
              </div>

              {/* Tab Content */}
              <div className="tab-content">
                {selectedTab === 'summary' && (
                  <div className="summary-tab">
                    <div className="criteria-grid">
                      <div className={`criteria-card ${validationResult.installability.criteria.hasManifest ? 'valid' : 'invalid'}`}>
                        <div className="criteria-icon">
                          {validationResult.installability.criteria.hasManifest ? '✅' : '❌'}
                        </div>
                        <div className="criteria-content">
                          <h4>Web App Manifest</h4>
                          <p>Arquivo manifest.json válido</p>
                        </div>
                      </div>

                      <div className={`criteria-card ${validationResult.installability.criteria.hasServiceWorker ? 'valid' : 'invalid'}`}>
                        <div className="criteria-icon">
                          {validationResult.installability.criteria.hasServiceWorker ? '✅' : '❌'}
                        </div>
                        <div className="criteria-content">
                          <h4>Service Worker</h4>
                          <p>Funcionalidade offline</p>
                        </div>
                      </div>

                      <div className={`criteria-card ${validationResult.installability.criteria.hasValidIcons ? 'valid' : 'invalid'}`}>
                        <div className="criteria-icon">
                          {validationResult.installability.criteria.hasValidIcons ? '✅' : '❌'}
                        </div>
                        <div className="criteria-content">
                          <h4>Ícones Válidos</h4>
                          <p>Ícones 192x192 e 512x512</p>
                        </div>
                      </div>

                      <div className={`criteria-card ${validationResult.installability.criteria.isServedOverHttps ? 'valid' : 'invalid'}`}>
                        <div className="criteria-icon">
                          {validationResult.installability.criteria.isServedOverHttps ? '✅' : '❌'}
                        </div>
                        <div className="criteria-content">
                          <h4>HTTPS</h4>
                          <p>Servido com segurança</p>
                        </div>
                      </div>
                    </div>

                    {validationResult.recommendations.length > 0 && (
                      <div className="recommendations-section">
                        <h3>💡 Recomendações</h3>
                        <div className="recommendations-list">
                          {validationResult.recommendations.map((rec: string, index: number) => (
                            <div key={index} className="recommendation-item">
                              <span className="rec-icon">✅</span>
                              <span className="rec-text">{rec}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {selectedTab === 'manifest' && (
                  <div className="manifest-tab">
                    <div className="validation-section">
                      <div className="section-header">
                        <h3>Manifest Score: {validationResult.manifest.score}/100</h3>
                        <span className={`status-badge ${validationResult.manifest.isValid ? 'valid' : 'invalid'}`}>
                          {validationResult.manifest.isValid ? '✅ Válido' : '❌ Inválido'}
                        </span>
                      </div>

                      {validationResult.manifest.errors.length > 0 && (
                        <div className="issues-section errors">
                          <h4>🔴 Erros ({validationResult.manifest.errors.length})</h4>
                          <ul>
                            {validationResult.manifest.errors.map((error: string, index: number) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {validationResult.manifest.warnings.length > 0 && (
                        <div className="issues-section warnings">
                          <h4>🟡 Avisos ({validationResult.manifest.warnings.length})</h4>
                          <ul>
                            {validationResult.manifest.warnings.map((warning: string, index: number) => (
                              <li key={index}>{warning}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {validationResult.manifest.manifest && (
                        <div className="manifest-preview">
                          <h4>📄 Preview do Manifest</h4>
                          <div className="manifest-info">
                            <div className="info-row">
                              <span className="info-label">Nome:</span>
                              <span className="info-value">{validationResult.manifest.manifest.name || 'N/A'}</span>
                            </div>
                            <div className="info-row">
                              <span className="info-label">Nome Curto:</span>
                              <span className="info-value">{validationResult.manifest.manifest.short_name || 'N/A'}</span>
                            </div>
                            <div className="info-row">
                              <span className="info-label">Display:</span>
                              <span className="info-value">{validationResult.manifest.manifest.display || 'N/A'}</span>
                            </div>
                            <div className="info-row">
                              <span className="info-label">Ícones:</span>
                              <span className="info-value">
                                {validationResult.manifest.manifest.icons?.length || 0} ícones
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedTab === 'service-worker' && (
                  <div className="service-worker-tab">
                    <div className="validation-section">
                      <div className="section-header">
                        <h3>Status do Service Worker</h3>
                        <span className={`status-badge ${validationResult.serviceWorker.isActive ? 'valid' : 'invalid'}`}>
                          {validationResult.serviceWorker.isRegistered ? 
                            (validationResult.serviceWorker.isActive ? '✅ Ativo' : '⚠️ Registrado') : 
                            '❌ Não Registrado'
                          }
                        </span>
                      </div>

                      <div className="sw-details">
                        <div className="detail-row">
                          <span className="detail-label">Registrado:</span>
                          <span className="detail-value">
                            {validationResult.serviceWorker.isRegistered ? 'Sim' : 'Não'}
                          </span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Ativo:</span>
                          <span className="detail-value">
                            {validationResult.serviceWorker.isActive ? 'Sim' : 'Não'}
                          </span>
                        </div>
                        {validationResult.serviceWorker.scope && (
                          <div className="detail-row">
                            <span className="detail-label">Escopo:</span>
                            <span className="detail-value">{validationResult.serviceWorker.scope}</span>
                          </div>
                        )}
                        {validationResult.serviceWorker.cachingStrategy && (
                          <div className="detail-row">
                            <span className="detail-label">Estratégia:</span>
                            <span className="detail-value">{validationResult.serviceWorker.cachingStrategy}</span>
                          </div>
                        )}
                      </div>

                      {validationResult.serviceWorker.errors.length > 0 && (
                        <div className="issues-section errors">
                          <h4>🔴 Erros ({validationResult.serviceWorker.errors.length})</h4>
                          <ul>
                            {validationResult.serviceWorker.errors.map((error: string, index: number) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {validationResult.serviceWorker.warnings.length > 0 && (
                        <div className="issues-section warnings">
                          <h4>🟡 Avisos ({validationResult.serviceWorker.warnings.length})</h4>
                          <ul>
                            {validationResult.serviceWorker.warnings.map((warning: string, index: number) => (
                              <li key={index}>{warning}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedTab === 'performance' && (
                  <div className="performance-tab">
                    <div className="performance-metrics">
                      <div className="metric-card">
                        <div className="metric-icon">📦</div>
                        <div className="metric-content">
                          <div className="metric-value">{validationResult.performance.cacheStatus.totalCaches}</div>
                          <div className="metric-label">Caches</div>
                        </div>
                      </div>

                      <div className="metric-card">
                        <div className="metric-icon">📄</div>
                        <div className="metric-content">
                          <div className="metric-value">{validationResult.performance.cacheStatus.totalEntries}</div>
                          <div className="metric-label">Recursos</div>
                        </div>
                      </div>

                      <div className="metric-card">
                        <div className="metric-icon">💾</div>
                        <div className="metric-content">
                          <div className="metric-value">{validationResult.performance.cacheStatus.estimatedSize}</div>
                          <div className="metric-label">Tamanho</div>
                        </div>
                      </div>

                      <div className="metric-card">
                        <div className="metric-icon">📶</div>
                        <div className="metric-content">
                          <div className="metric-value">
                            {validationResult.performance.offlineCapable ? 'Sim' : 'Não'}
                          </div>
                          <div className="metric-label">Offline</div>
                        </div>
                      </div>
                    </div>

                    <div className="performance-features">
                      <div className={`feature-item ${validationResult.performance.offlineCapable ? 'enabled' : 'disabled'}`}>
                        <span className="feature-icon">
                          {validationResult.performance.offlineCapable ? '✅' : '❌'}
                        </span>
                        <span className="feature-text">Funcionalidade Offline</span>
                      </div>

                      <div className={`feature-item ${validationResult.performance.networkFirst ? 'enabled' : 'disabled'}`}>
                        <span className="feature-icon">
                          {validationResult.performance.networkFirst ? '✅' : '❌'}
                        </span>
                        <span className="feature-text">Cache Runtime Dinâmico</span>
                      </div>

                      <div className={`feature-item ${validationResult.performance.cacheStatus.totalEntries > 0 ? 'enabled' : 'disabled'}`}>
                        <span className="feature-icon">
                          {validationResult.performance.cacheStatus.totalEntries > 0 ? '✅' : '❌'}
                        </span>
                        <span className="feature-text">Recursos em Cache</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📱</div>
              <p>Clique em "Nova Validação" para analisar a configuração PWA.</p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .pwa-validation-panel {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .validation-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
        }

        .validation-content {
          position: relative;
          width: min(95vw, 1000px);
          max-height: 90vh;
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
          display: flex;
          flex-direction: column;
        }

        .validation-header {
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
          background: #8b5cf6;
          color: white;
        }

        .refresh-btn:hover:not(:disabled) {
          background: #7c3aed;
        }

        .close-btn {
          background: #f3f4f6;
          color: #6b7280;
        }

        .close-btn:hover {
          background: #e5e7eb;
          color: #374151;
        }

        .validation-body {
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
          border-top: 4px solid #8b5cf6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 16px auto;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .overall-score {
          display: flex;
          align-items: center;
          gap: 24px;
          margin-bottom: 24px;
          padding: 20px;
          background: #f8fafc;
          border-radius: 12px;
        }

        .score-circle {
          width: 120px;
          height: 120px;
          border: 8px solid;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
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
        }

        .score-details h3 {
          margin: 0 0 8px 0;
          font-size: 20px;
          color: #1f2937;
        }

        .score-details p {
          margin: 0 0 16px 0;
          color: #6b7280;
          font-size: 14px;
        }

        .installability-status {
          display: flex;
          gap: 8px;
        }

        .status-badge {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }

        .status-badge.installable {
          background: #dcfce7;
          color: #166534;
        }

        .status-badge.not-installable {
          background: #fecaca;
          color: #991b1b;
        }

        .status-badge.valid {
          background: #dcfce7;
          color: #166534;
        }

        .status-badge.invalid {
          background: #fecaca;
          color: #991b1b;
        }

        .validation-tabs {
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

        .criteria-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .criteria-card {
          background: white;
          border: 2px solid;
          border-radius: 12px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .criteria-card.valid {
          border-color: #22c55e;
          background: #f0fdf4;
        }

        .criteria-card.invalid {
          border-color: #ef4444;
          background: #fef2f2;
        }

        .criteria-icon {
          font-size: 24px;
          line-height: 1;
        }

        .criteria-content h4 {
          margin: 0 0 4px 0;
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
        }

        .criteria-content p {
          margin: 0;
          font-size: 12px;
          color: #6b7280;
        }

        .recommendations-section {
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

        .validation-section {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .section-header h3 {
          margin: 0;
          font-size: 18px;
          color: #1f2937;
        }

        .issues-section {
          margin: 16px 0;
          padding: 16px;
          border-radius: 8px;
        }

        .issues-section.errors {
          background: #fef2f2;
          border: 1px solid #fecaca;
        }

        .issues-section.warnings {
          background: #fffbeb;
          border: 1px solid #fed7aa;
        }

        .issues-section h4 {
          margin: 0 0 12px 0;
          font-size: 14px;
          font-weight: 600;
        }

        .issues-section ul {
          margin: 0;
          padding-left: 20px;
        }

        .issues-section li {
          margin-bottom: 4px;
          font-size: 13px;
          line-height: 1.4;
        }

        .manifest-preview {
          margin-top: 20px;
          padding: 16px;
          background: #f8fafc;
          border-radius: 8px;
        }

        .manifest-preview h4 {
          margin: 0 0 12px 0;
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
        }

        .info-row, .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          padding-bottom: 8px;
          border-bottom: 1px solid #f3f4f6;
        }

        .info-label, .detail-label {
          font-size: 13px;
          color: #6b7280;
          font-weight: 500;
        }

        .info-value, .detail-value {
          font-size: 13px;
          color: #1f2937;
          font-weight: 600;
        }

        .performance-metrics {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .metric-card {
          background: #f8fafc;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .metric-icon {
          font-size: 32px;
          line-height: 1;
        }

        .metric-value {
          font-size: 20px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 4px;
        }

        .metric-label {
          font-size: 12px;
          color: #6b7280;
        }

        .performance-features {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 8px;
        }

        .feature-item.enabled {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
        }

        .feature-item.disabled {
          background: #fef2f2;
          border: 1px solid #fecaca;
        }

        .feature-text {
          font-size: 14px;
          font-weight: 500;
        }

        .feature-item.enabled .feature-text {
          color: #166534;
        }

        .feature-item.disabled .feature-text {
          color: #991b1b;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
        }

        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        @media (max-width: 768px) {
          .validation-content {
            width: 95vw;
            height: 90vh;
            margin: 20px;
          }

          .overall-score {
            flex-direction: column;
            text-align: center;
          }

          .criteria-grid {
            grid-template-columns: 1fr;
          }

          .performance-metrics {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
}