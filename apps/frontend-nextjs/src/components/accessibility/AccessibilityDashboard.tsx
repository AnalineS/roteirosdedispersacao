/**
 * Accessibility Dashboard - Dashboard Integrado de Acessibilidade
 * Sistema completo de monitoramento WCAG 2.1 AA para aplicações médicas
 *
 * DEPRECATED: This component has been superseded by the new AccessibilityValidator system
 * which provides comprehensive WCAG 2.1 AA validation with real-time monitoring.
 *
 * The new system is activated globally in layout.tsx and provides:
 * - Real-time WCAG 2.1 AA validation
 * - Integration with UXAnalyticsProvider
 * - 14 comprehensive accessibility tests
 * - Educational mode for medical interfaces
 *
 * This component is now a stub to avoid TypeScript conflicts.
 */

'use client';

import React from 'react';

// Stub component - functionality moved to AccessibilityValidator
export default function AccessibilityDashboard() {
  return (
    <div style={{
      padding: '2rem',
      textAlign: 'center',
      background: '#f8fafc',
      border: '1px solid #e2e8f0',
      borderRadius: '8px',
      color: '#64748b'
    }}>
      <h3 style={{ margin: '0 0 1rem 0', color: '#374151' }}>
        Accessibility Dashboard
      </h3>
      <p style={{ margin: 0 }}>
        Este dashboard foi migrado para o novo sistema AccessibilityValidator.
        <br />
        Verificação de acessibilidade ativa globalmente via layout.tsx
      </p>
    </div>
  );
}