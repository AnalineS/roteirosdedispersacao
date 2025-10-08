/**
 * Google Analytics Configuration
 * Configurações centralizadas para compliance LGPD e projeto educacional
 */

export interface GAConfig {
  measurementId: string;
  anonymizeIp: boolean;
  allowGoogleSignals: boolean;
  allowAdPersonalizationSignals: boolean;
  cookieExpires: number;
  forceSsl: boolean;
  customParameters: {
    project_type: string;
    content_category: string;
    target_audience: string;
    thesis_project: boolean;
    data_protection_compliant: boolean;
    lgpd_compliant: boolean;
  };
}

/**
 * Configuração padrão LGPD-compliant para projeto educacional
 */
export const getGAConfig = (measurementId?: string): GAConfig => {
  return {
    measurementId: measurementId || process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-XXXXXXXXXX',
    // Configurações LGPD-compliant
    anonymizeIp: true,
    allowGoogleSignals: false,
    allowAdPersonalizationSignals: false,
    cookieExpires: 63072000, // 2 anos (padrão educacional)
    forceSsl: true,
    // Parâmetros personalizados do projeto
    customParameters: {
      project_type: 'educational',
      content_category: 'health_education',
      target_audience: 'healthcare_professionals',
      thesis_project: true,
      data_protection_compliant: true,
      lgpd_compliant: true,
    },
  };
};

/**
 * Verifica se Google Analytics deve estar ativo
 */
export const isGAEnabled = (): boolean => {
  const config = getGAConfig();
  return (
    process.env.NODE_ENV === 'production' &&
    config.measurementId !== 'G-XXXXXXXXXX' &&
    !!config.measurementId
  );
};

/**
 * Configuração para @next/third-parties/google
 */
export const getGAThirdPartyConfig = () => {
  const config = getGAConfig();

  return {
    gaId: config.measurementId,
    dataLayerName: 'dataLayer',
  };
};
