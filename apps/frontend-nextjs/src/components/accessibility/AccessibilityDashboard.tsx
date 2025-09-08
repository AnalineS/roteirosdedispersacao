/**
 * Accessibility Dashboard - Dashboard Integrado de Acessibilidade
 * Sistema completo de monitoramento WCAG 2.1 AA para aplicações médicas
 * 
 * Seguindo princípios de claude_code_optimization_prompt.md:
 * - WCAG 2.1 AA: Compliance completo e monitoramento contínuo
 * - Medical Context: Dashboard específico para interfaces médicas críticas
 * - Real-time Monitoring: Monitoramento em tempo real de acessibilidade
 * - Comprehensive Reports: Relatórios completos e acionáveis
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  useAccessibilityValidator, 
  AccessibilityReport 
} from './AccessibilityValidator';
import { 
  useScreenReaderTester, 
  ScreenReaderTestReport 
} from './ScreenReaderTester';
import { 
  useKeyboardNavigationValidator, 
  KeyboardNavigationReport 
} from './KeyboardNavigationValidator';
import { 
  useColorContrastValidator, 
  ColorContrastReport 
} from './ColorContrastValidator';

// Interfaces para o dashboard
interface AccessibilityScore {
  overall: number;
  wcagCompliance: number;
  screenReader: number;
  keyboardNavigation: number;
  colorContrast: number;
  timestamp: Date;
}

interface CombinedAccessibilityReport {
  score: AccessibilityScore;
  passesWCAG21AA: boolean;
  criticalIssues: string[];
  totalIssues: number;
  recommendations: string[];
  lastUpdated: Date;
}

// Hook principal do dashboard
export const useAccessibilityDashboard = () => {
  const [isRunningFullScan, setIsRunningFullScan] = useState(false);
  const [combinedReport, setCombinedReport] = useState<CombinedAccessibilityReport | null>(null);
  
  const wcagValidator = useAccessibilityValidator();
  const screenReaderTester = useScreenReaderTester();
  const keyboardValidator = useKeyboardNavigationValidator();
  const colorContrastValidator = useColorContrastValidator();

  const runCompleteScan = useCallback(async () => {
    setIsRunningFullScan(true);

    try {
      // Executar todas as validações em paralelo
      const [wcagReport, screenReaderReport, keyboardReport, contrastReport] = await Promise.all([
        wcagValidator.runFullValidation(),
        screenReaderTester.runFullTest(),
        keyboardValidator.runFullValidation(),
        colorContrastValidator.runFullValidation()
      ]);

      // Calcular scores combinados
      const scores: AccessibilityScore = {
        overall: Math.round(
          (wcagReport.score + 
           screenReaderReport.score + 
           keyboardReport.score + 
           contrastReport.analysis.score) / 4
        ),
        wcagCompliance: wcagReport.score,
        screenReader: screenReaderReport.score,
        keyboardNavigation: keyboardReport.score,
        colorContrast: contrastReport.analysis.score,
        timestamp: new Date()
      };

      // Combinar issues críticos
      const criticalIssues: string[] = [
        ...wcagReport.issues.filter(issue => issue.impact === 'critical').map(issue => `WCAG: ${issue.description}`),
        ...screenReaderReport.criticalIssues.map(issue => `Screen Reader: ${issue}`),
        ...keyboardReport.criticalIssues.map(issue => `Keyboard: ${issue}`),
        ...(contrastReport.analysis.criticalFailures.length > 0 ? [`Contraste: ${contrastReport.analysis.criticalFailures.length} falhas críticas`] : [])
      ];

      // Combinar recomendações
      const recommendations: string[] = [
        ...contrastReport.recommendations,
        ...(screenReaderReport.criticalIssues.length > 0 ? ['🔊 Corrigir issues críticos de screen reader'] : []),
        ...(keyboardReport.criticalIssues.length > 0 ? ['⌨️ Melhorar navegação por teclado'] : []),
        ...(wcagReport.issues.length > 0 ? ['📋 Resolver problemas de compliance WCAG'] : [])
      ];

      // Verificar compliance geral
      const passesWCAG21AA = wcagReport.passesWCAG21AA && 
                            screenReaderReport.criticalIssues.length === 0 &&
                            keyboardReport.passesWCAG &&
                            contrastReport.passesWCAG21AA;

      const combined: CombinedAccessibilityReport = {
        score: scores,
        passesWCAG21AA,
        criticalIssues,
        totalIssues: wcagReport.issues.length + 
                    screenReaderReport.criticalIssues.length + 
                    keyboardReport.criticalIssues.length + 
                    contrastReport.analysis.failedPairs.length,
        recommendations: [...new Set(recommendations)], // Remove duplicatas
        lastUpdated: new Date()
      };

      setCombinedReport(combined);
    } catch (error) {
      console.error('Erro ao executar scan completo de acessibilidade:', error);
    } finally {
      setIsRunningFullScan(false);
    }
  }, [wcagValidator, screenReaderTester, keyboardValidator, colorContrastValidator]);

  return {
    isRunningFullScan,
    combinedReport,
    runCompleteScan,
    wcagValidator,
    screenReaderTester,
    keyboardValidator,
    colorContrastValidator
  };
};

// Componente principal do dashboard
export const AccessibilityDashboard: React.FC<{
  autoStart?: boolean;
}> = ({ autoStart = false }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'wcag' | 'screen-reader' | 'keyboard' | 'contrast'>('overview');
  
  const {
    isRunningFullScan,
    combinedReport,
    runCompleteScan,
    wcagValidator,
    screenReaderTester,
    keyboardValidator,
    colorContrastValidator
  } = useAccessibilityDashboard();

  useEffect(() => {
    if (autoStart) {
      runCompleteScan();
    }
  }, [autoStart, runCompleteScan]);

  const getScoreColor = (score: number): string => {
    if (score >= 90) return '#22c55e';
    if (score >= 70) return '#f59e0b';
    return '#dc2626';
  };

  const getScoreGrade = (score: number): string => {
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };

  const tabs = [
    { id: 'overview', label: '📊 Visão Geral', icon: '📊' },
    { id: 'wcag', label: '📋 WCAG 2.1', icon: '📋' },
    { id: 'screen-reader', label: '🔊 Screen Reader', icon: '🔊' },
    { id: 'keyboard', label: '⌨️ Teclado', icon: '⌨️' },
    { id: 'contrast', label: '🎨 Contraste', icon: '🎨' }
  ];

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e2e8f0',
      maxWidth: '1400px',
      margin: '20px auto',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '24px',
        textAlign: 'center'
      }}>
        <h1 style={{
          fontSize: '2rem',
          fontWeight: '700',
          margin: '0 0 8px 0'
        }}>
          ♿ Dashboard de Acessibilidade WCAG 2.1 AA
        </h1>
        <p style={{
          fontSize: '1rem',
          margin: '0 0 16px 0',
          opacity: 0.9
        }}>
          Monitoramento completo de acessibilidade para aplicações médicas
        </p>
        
        <button
          onClick={runCompleteScan}
          disabled={isRunningFullScan}
          style={{
            background: isRunningFullScan ? '#94a3b8' : '#22c55e',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: isRunningFullScan ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          {isRunningFullScan ? '🔄 Executando Scan...' : '🚀 Executar Scan Completo'}
        </button>
      </div>

      {/* Overview Score */}
      {combinedReport && (
        <div style={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          padding: '24px',
          borderBottom: '1px solid #e2e8f0'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '16px',
            marginBottom: '20px'
          }}>
            {/* Score Geral */}
            <div style={{
              background: 'white',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center',
              border: '1px solid #e2e8f0',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{
                fontSize: '3rem',
                fontWeight: '700',
                color: getScoreColor(combinedReport.score.overall),
                marginBottom: '8px'
              }}>
                {combinedReport.score.overall}
              </div>
              <div style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: getScoreColor(combinedReport.score.overall),
                marginBottom: '4px'
              }}>
                Nota {getScoreGrade(combinedReport.score.overall)}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                Score Geral
              </div>
            </div>

            {/* WCAG Compliance */}
            <div style={{
              background: combinedReport.passesWCAG21AA ? '#f0fdf4' : '#fee2e2',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center',
              border: `1px solid ${combinedReport.passesWCAG21AA ? '#22c55e' : '#dc2626'}`
            }}>
              <div style={{
                fontSize: '2rem',
                marginBottom: '8px'
              }}>
                {combinedReport.passesWCAG21AA ? '✅' : '❌'}
              </div>
              <div style={{
                fontSize: '1rem',
                fontWeight: '600',
                color: combinedReport.passesWCAG21AA ? '#166534' : '#991b1b'
              }}>
                WCAG 2.1 AA
              </div>
            </div>

            {/* Issues Críticos */}
            <div style={{
              background: combinedReport.criticalIssues.length === 0 ? '#f0fdf4' : '#fee2e2',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center',
              border: `1px solid ${combinedReport.criticalIssues.length === 0 ? '#22c55e' : '#dc2626'}`
            }}>
              <div style={{
                fontSize: '2rem',
                fontWeight: '700',
                color: combinedReport.criticalIssues.length === 0 ? '#166534' : '#991b1b',
                marginBottom: '8px'
              }}>
                {combinedReport.criticalIssues.length}
              </div>
              <div style={{
                fontSize: '0.875rem',
                color: combinedReport.criticalIssues.length === 0 ? '#166534' : '#991b1b'
              }}>
                Issues Críticos
              </div>
            </div>

            {/* Total Issues */}
            <div style={{
              background: '#f0f9ff',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center',
              border: '1px solid #0ea5e9'
            }}>
              <div style={{
                fontSize: '2rem',
                fontWeight: '700',
                color: '#0284c7',
                marginBottom: '8px'
              }}>
                {combinedReport.totalIssues}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#0369a1' }}>
                Total de Issues
              </div>
            </div>
          </div>

          {/* Scores Detalhados */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px'
          }}>
            {[
              { label: 'WCAG Compliance', score: combinedReport.score.wcagCompliance, icon: '📋' },
              { label: 'Screen Reader', score: combinedReport.score.screenReader, icon: '🔊' },
              { label: 'Navegação Teclado', score: combinedReport.score.keyboardNavigation, icon: '⌨️' },
              { label: 'Contraste Cores', score: combinedReport.score.colorContrast, icon: '🎨' }
            ].map((item, index) => (
              <div
                key={index}
                style={{
                  background: 'white',
                  borderRadius: '6px',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  border: '1px solid #e2e8f0'
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>{item.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: getScoreColor(item.score)
                  }}>
                    {item.score}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {item.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div style={{
        background: '#f8fafc',
        borderBottom: '1px solid #e2e8f0',
        padding: '0 24px'
      }}>
        <div style={{
          display: 'flex',
          gap: '4px',
          overflowX: 'auto'
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'overview' | 'wcag' | 'screen-reader' | 'keyboard' | 'contrast')}
              style={{
                background: activeTab === tab.id ? 'white' : 'transparent',
                border: activeTab === tab.id ? '1px solid #e2e8f0' : '1px solid transparent',
                borderBottom: activeTab === tab.id ? '1px solid white' : '1px solid transparent',
                borderRadius: '8px 8px 0 0',
                padding: '12px 16px',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: activeTab === tab.id ? '#1e293b' : '#64748b',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
                marginBottom: '-1px'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '24px' }}>
        {activeTab === 'overview' && combinedReport && (
          <div>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '600',
              color: '#1e293b',
              marginBottom: '16px'
            }}>
              📊 Resumo Executivo
            </h2>

            {/* Issues Críticos */}
            {combinedReport.criticalIssues.length > 0 && (
              <div style={{
                background: '#fee2e2',
                border: '1px solid #dc2626',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '20px'
              }}>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '600',
                  color: '#991b1b',
                  marginBottom: '12px'
                }}>
                  🚨 Issues Críticos que Requerem Atenção Imediata
                </h3>
                <ul style={{
                  margin: 0,
                  paddingLeft: '20px',
                  fontSize: '0.875rem',
                  color: '#991b1b'
                }}>
                  {combinedReport.criticalIssues.slice(0, 10).map((issue, index) => (
                    <li key={index} style={{ marginBottom: '4px' }}>
                      {issue}
                    </li>
                  ))}
                  {combinedReport.criticalIssues.length > 10 && (
                    <li style={{ fontStyle: 'italic' }}>
                      ... e mais {combinedReport.criticalIssues.length - 10} issues críticos
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* Recomendações */}
            <div style={{
              background: '#fef3c7',
              border: '1px solid #f59e0b',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: '#92400e',
                marginBottom: '12px'
              }}>
                💡 Recomendações Priorizadas
              </h3>
              <ol style={{
                margin: 0,
                paddingLeft: '20px',
                fontSize: '0.875rem',
                color: '#92400e',
                lineHeight: '1.6'
              }}>
                {combinedReport.recommendations.slice(0, 8).map((recommendation, index) => (
                  <li key={index} style={{ marginBottom: '4px' }}>
                    {recommendation}
                  </li>
                ))}
              </ol>
            </div>

            {/* Status Summary */}
            <div style={{
              background: combinedReport.passesWCAG21AA ? '#f0fdf4' : '#f0f9ff',
              border: `1px solid ${combinedReport.passesWCAG21AA ? '#22c55e' : '#3b82f6'}`,
              borderRadius: '8px',
              padding: '16px'
            }}>
              <h3 style={{
                fontSize: '1.125rem',
                fontWeight: '600',
                color: combinedReport.passesWCAG21AA ? '#166534' : '#1d4ed8',
                marginBottom: '8px'
              }}>
                {combinedReport.passesWCAG21AA ? '✅ Parabéns!' : '📋 Próximos Passos'}
              </h3>
              <p style={{
                fontSize: '0.875rem',
                color: combinedReport.passesWCAG21AA ? '#166534' : '#1d4ed8',
                margin: 0,
                lineHeight: '1.6'
              }}>
                {combinedReport.passesWCAG21AA 
                  ? 'Sua aplicação atende aos critérios WCAG 2.1 AA! Continue monitorando para manter a excelência em acessibilidade.'
                  : `Sua aplicação tem ${combinedReport.totalIssues} issues de acessibilidade. Foque primeiro nos ${combinedReport.criticalIssues.length} issues críticos para melhorar rapidamente o score.`
                }
              </p>
            </div>
          </div>
        )}

        {activeTab === 'wcag' && wcagValidator.report && (
          <AccessibilityReport 
            report={wcagValidator.report} 
            onRevalidate={wcagValidator.runFullValidation}
          />
        )}

        {activeTab === 'screen-reader' && screenReaderTester.testResult && (
          <ScreenReaderTestReport 
            result={screenReaderTester.testResult} 
            onRetest={screenReaderTester.runFullTest}
          />
        )}

        {activeTab === 'keyboard' && keyboardValidator.result && (
          <KeyboardNavigationReport 
            result={keyboardValidator.result} 
            onRevalidate={keyboardValidator.runFullValidation}
            onTestNavigation={keyboardValidator.testTabNavigation}
            currentFocusIndex={keyboardValidator.currentFocusIndex}
          />
        )}

        {activeTab === 'contrast' && colorContrastValidator.result && (
          <ColorContrastReport 
            result={colorContrastValidator.result} 
            onRevalidate={colorContrastValidator.runFullValidation}
          />
        )}

        {!combinedReport && !isRunningFullScan && (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: '#64748b'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🚀</div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>
              Pronto para Começar
            </h3>
            <p style={{ fontSize: '0.875rem', marginBottom: '20px' }}>
              Execute um scan completo para avaliar a acessibilidade da sua aplicação
            </p>
            <button
              onClick={runCompleteScan}
              style={{
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              🔍 Iniciar Análise
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      {combinedReport && (
        <div style={{
          background: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
          padding: '16px 24px',
          fontSize: '0.75rem',
          color: '#64748b',
          textAlign: 'center'
        }}>
          Última atualização: {combinedReport.lastUpdated.toLocaleString('pt-BR')} • 
          WCAG 2.1 AA Compliance Dashboard • 
          Desenvolvido para aplicações médicas críticas
        </div>
      )}
    </div>
  );
};