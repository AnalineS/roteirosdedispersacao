// Configuração dinâmica de domínios para o site
export const SITE_CONFIG = {
  // Domínios suportados
  DOMAINS: {
    PRODUCTION: 'roteirosdedispensacao.com',
    FIREBASE_WEB: 'roteiros-de-dispensacao.web.app',
    FIREBASE_APP: 'roteiros-de-dispensacao.firebaseapp.com'
  },
  
  // Detecta o domínio atual
  getCurrentDomain(): string {
    if (typeof window !== 'undefined') {
      return window.location.hostname;
    }
    
    // Para SSR/SSG, usar fallback para domínio principal
    return 'roteirosdedispensacao.com';
  },
  
  // Retorna a URL base completa
  getBaseUrl(): string {
    const domain = this.getCurrentDomain();
    const protocol = typeof window !== 'undefined' && window.location.protocol === 'http:' ? 'http' : 'https';
    return `${protocol}://${domain}`;
  },
  
  // Verifica se é um domínio válido
  isValidDomain(domain: string): boolean {
    return Object.values(this.DOMAINS).includes(domain);
  },
  
  // Metadados por domínio
  getMetadata() {
    const baseUrl = this.getBaseUrl();
    
    return {
      metadataBase: new URL(baseUrl),
      title: 'Roteiros de Dispensação – Assistentes Educacionais',
      description: 'Plataforma educacional com assistentes virtuais Dr. Gasnelio e Gá para orientação sobre poliquimioterapia de hanseníase (PQT-U)',
      keywords: 'hanseníase, PQT-U, educação médica, assistente educacional, Dr. Gasnelio, Gá, poliquimioterapia, aprendizagem adaptativa',
      authors: [{ name: 'Roteiro de Dispensação - Assistentes Educacionais' }],
      openGraph: {
        type: 'website' as const,
        url: baseUrl,
        title: 'Roteiros de Dispensação - Assistentes Educacionais',
        description: 'Plataforma educacional com Dr. Gasnelio e Gá - assistentes virtuais especializados em PQT-U para hanseníase',
        images: [`${baseUrl}/og-image.png`]
      },
      twitter: {
        card: 'summary_large_image' as const,
        title: 'Roteiros de Dispensação - Assistentes Educacionais',
        description: 'Plataforma educacional com Dr. Gasnelio e Gá - assistentes virtuais especializados em PQT-U para hanseníase',
        images: [`${baseUrl}/og-image.png`]
      },
      manifest: '/manifest.webmanifest',
      alternates: {
        canonical: baseUrl
      }
    };
  }
};

export default SITE_CONFIG;