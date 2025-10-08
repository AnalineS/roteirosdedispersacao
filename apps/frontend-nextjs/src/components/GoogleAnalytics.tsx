/**
 * Google Analytics Component - Hybrid Approach
 *
 * Combina @next/third-parties/google para performance otimizada
 * com hooks personalizados para tracking educacional e LGPD compliance
 *
 * @see Especificação: PR #222 - Abordagem Híbrida
 */

'use client';

import { GoogleAnalytics as NextGoogleAnalytics } from '@next/third-parties/google';
import { useEffect } from 'react';
import { getGAConfig, isGAEnabled } from '@/lib/analytics/googleAnalyticsConfig';
import { useGALGPDConfig } from '@/lib/analytics/useGoogleAnalyticsTracking';

interface GoogleAnalyticsProps {
  GA_MEASUREMENT_ID?: string;
}

export default function GoogleAnalytics({
  GA_MEASUREMENT_ID
}: GoogleAnalyticsProps) {
  const config = getGAConfig(GA_MEASUREMENT_ID);
  const { applyLGPDConfig } = useGALGPDConfig();

  useEffect(() => {
    // Aplicar configurações LGPD após o script carregar
    if (isGAEnabled()) {
      // Aguardar script do @next/third-parties carregar
      const checkAndApplyConfig = () => {
        if (typeof window !== 'undefined' && window.gtag) {
          applyLGPDConfig();
        } else {
          // Retry após 100ms se script ainda não carregou
          setTimeout(checkAndApplyConfig, 100);
        }
      };

      checkAndApplyConfig();
    }
  }, [applyLGPDConfig]);

  // Não carregar em desenvolvimento ou sem ID configurado
  if (!isGAEnabled()) {
    if (process.env.NODE_ENV === 'development') {
      console.log('ℹ️ Google Analytics desabilitado:', {
        env: process.env.NODE_ENV,
        hasId: config.measurementId !== 'G-XXXXXXXXXX'
      });
    }
    return null;
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Google Analytics habilitado:', config.measurementId);
  }

  return (
    <NextGoogleAnalytics
      gaId={config.measurementId}
      dataLayerName="dataLayer"
    />
  );
}

/**
 * Re-export do hook de tracking para manter compatibilidade com código existente
 * @deprecated Use useGoogleAnalyticsTracking from '@/lib/analytics/useGoogleAnalyticsTracking'
 */
export { useGoogleAnalyticsTracking as useGoogleAnalytics } from '@/lib/analytics/useGoogleAnalyticsTracking';
