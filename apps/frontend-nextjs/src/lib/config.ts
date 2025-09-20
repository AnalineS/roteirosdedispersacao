// Configuração dinâmica de domínios para o site
export const SITE_CONFIG = {
  // Domínios suportados
  DOMAINS: {
    PRODUCTION: 'roteirosdedispensacao.com',
    CLOUD_RUN_WEB: 'roteiro-dispensacao-frontend-339202208157.us-central1.run.app',
    CLOUD_RUN_APP: 'roteiro-dispensacao-frontend-339202208157.us-central1.run.app'
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
      title: 'Roteiros de Dispensação Hanseníase – Assistentes educacionais com IA',
      description: 'Plataforma gratuita validada pela UnB para orientar pacientes e profissionais na dispensação da PQT-U para hanseníase.',
      keywords: 'hanseníase, PQT-U, educação médica, assistente educacional, Dr. Gasnelio, Gá, poliquimioterapia, aprendizagem adaptativa, SUS, farmácia clínica',
      authors: [{ name: 'Roteiro de Dispensação - Assistentes Educacionais' }],
      creator: 'Universidade de Brasília - Programa de Pós-Graduação em Ciências Farmacêuticas',
      publisher: 'UnB - Universidade de Brasília',
      category: 'Educação em Saúde',
      classification: 'Medical Education Platform',
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large' as const,
          'max-snippet': -1,
        },
      },
      openGraph: {
        type: 'website' as const,
        url: baseUrl,
        title: 'Roteiros de Dispensação - Assistentes Educacionais',
        description: 'Plataforma educacional com Dr. Gasnelio e Gá - assistentes virtuais especializados em PQT-U para hanseníase',
        images: [
          {
            url: `${baseUrl}/og-image.png`,
            width: 1200,
            height: 630,
            alt: 'Roteiros de Dispensação - Assistentes Educacionais para PQT-U'
          }
        ],
        locale: 'pt_BR',
        siteName: 'Roteiros de Dispensação'
      },
      twitter: {
        card: 'summary_large_image' as const,
        site: '@UnBoficial',
        creator: '@UnBoficial',
        title: 'Roteiros de Dispensação - Assistentes Educacionais',
        description: 'Plataforma educacional com Dr. Gasnelio e Gá - assistentes virtuais especializados em PQT-U para hanseníase',
        images: [
          {
            url: `${baseUrl}/og-image.png`,
            alt: 'Roteiros de Dispensação - Assistentes Educacionais'
          }
        ]
      },
      manifest: '/manifest.webmanifest',
      alternates: {
        canonical: baseUrl,
        languages: {
          'pt-BR': baseUrl
        }
      },
      other: {
        'format-detection': 'telephone=no, address=no, email=no',
        'mobile-web-app-capable': 'yes',
        'apple-mobile-web-app-capable': 'yes',
        'apple-mobile-web-app-status-bar-style': 'default',
        'apple-mobile-web-app-title': 'Roteiros PQT-U',
        'theme-color': '#0284c7',
        'msapplication-TileColor': '#0284c7',
        'msapplication-config': '/browserconfig.xml'
      }
    };
  }
};

export default SITE_CONFIG;