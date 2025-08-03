import React from 'react'
import { Helmet } from 'react-helmet-async'

interface SEOHeadProps {
  title?: string
  description?: string
  keywords?: string[]
  canonicalUrl?: string
  ogImage?: string
  ogType?: 'website' | 'article' | 'profile'
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player'
  structuredData?: object
  noIndex?: boolean
  noFollow?: boolean
}

const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description = 'Sistema inteligente de apoio à dispensação de medicamentos para tratamento da hanseníase com poliquimioterapia única (PQT-U). Assistentes virtuais especializados Dr. Gasnelio e Gá.',
  keywords = [
    'hanseníase',
    'PQT-U', 
    'poliquimioterapia única',
    'dispensação farmacêutica',
    'assistente virtual médico',
    'Dr. Gasnelio',
    'Gá',
    'medicamentos hanseníase',
    'rifampicina',
    'clofazimina',
    'dapsona',
    'orientação farmacêutica',
    'educação médica',
    'sistema especialista'
  ],
  canonicalUrl,
  ogImage = '/icon-512.png',
  ogType = 'website',
  twitterCard = 'summary_large_image',
  structuredData,
  noIndex = false,
  noFollow = false
}) => {
  const siteTitle = 'Roteiros de Dispensação – PQT-U'
  const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle
  const siteUrl = 'https://roteirosdedispensacao.com'
  const fullCanonicalUrl = canonicalUrl || `${siteUrl}${window.location.pathname}`

  const robotsContent = [
    noIndex ? 'noindex' : 'index',
    noFollow ? 'nofollow' : 'follow'
  ].join(', ')

  // Default structured data for the organization
  const defaultStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    name: siteTitle,
    description,
    url: siteUrl,
    publisher: {
      '@type': 'Organization',
      name: 'Roteiros de Dispensação',
      url: siteUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/icon-512.png`
      }
    },
    mainEntity: {
      '@type': 'SoftwareApplication',
      name: siteTitle,
      applicationCategory: 'MedicalApplication',
      operatingSystem: 'Web Browser',
      description,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'BRL'
      },
      featureList: [
        'Assistente virtual especializado em hanseníase',
        'Orientações sobre PQT-U',
        'Dispensação farmacêutica especializada',
        'Educação médica continuada',
        'Interface acessível e responsiva'
      ]
    },
    about: {
      '@type': 'MedicalCondition',
      name: 'Hanseníase',
      alternateName: 'Lepra',
      description: 'Doença infectocontagiosa causada pelo Mycobacterium leprae'
    },
    audience: {
      '@type': 'MedicalAudience',
      audienceType: [
        'Farmacêuticos',
        'Médicos',
        'Profissionais de saúde',
        'Estudantes de medicina',
        'Estudantes de farmácia'
      ]
    }
  }

  const finalStructuredData = structuredData || defaultStructuredData

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(', ')} />
      <meta name="robots" content={robotsContent} />
      <link rel="canonical" href={fullCanonicalUrl} />

      {/* Language and Locale */}
      <html lang="pt-BR" />
      <meta property="og:locale" content="pt_BR" />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={`${siteUrl}${ogImage}`} />
      <meta property="og:image:alt" content={`Logo do ${siteTitle}`} />
      <meta property="og:url" content={fullCanonicalUrl} />
      <meta property="og:site_name" content={siteTitle} />

      {/* Twitter */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`${siteUrl}${ogImage}`} />
      <meta name="twitter:image:alt" content={`Logo do ${siteTitle}`} />

      {/* Additional Meta Tags for Medical Content */}
      <meta name="author" content="Roteiros de Dispensação" />
      <meta name="category" content="Medical Education" />
      <meta name="coverage" content="Brazil" />
      <meta name="distribution" content="global" />
      <meta name="rating" content="general" />
      <meta name="subject" content="Hanseníase, PQT-U, Dispensação Farmacêutica" />

      {/* Mobile Optimization */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content={siteTitle} />

      {/* Theme Colors */}
      <meta name="theme-color" content="#1976d2" />
      <meta name="msapplication-TileColor" content="#1976d2" />
      <meta name="msapplication-navbutton-color" content="#1976d2" />

      {/* Icons and Manifest */}
      <link rel="manifest" href="/manifest.json" />
      <link rel="icon" type="image/x-icon" href="/favicon.ico" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon.png" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

      {/* Preconnect for Performance */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

      {/* DNS Prefetch for External Resources */}
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      <link rel="dns-prefetch" href="//fonts.gstatic.com" />

      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(finalStructuredData)}
      </script>

      {/* Additional Security Headers */}
      <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
      <meta httpEquiv="X-Frame-Options" content="DENY" />
      <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
      <meta httpEquiv="Referrer-Policy" content="strict-origin-when-cross-origin" />

      {/* Cache Control for Static Assets */}
      <meta httpEquiv="Cache-Control" content="public, max-age=31536000" />
    </Helmet>
  )
}

// Pre-configured SEO components for different pages
export const HomePageSEO: React.FC = () => (
  <SEOHead
    title="Assistente Virtual para Dispensação de PQT-U"
    description="Sistema inteligente com assistentes virtuais Dr. Gasnelio e Gá para orientação sobre poliquimioterapia única no tratamento da hanseníase. Plataforma educacional para profissionais de saúde."
    keywords={[
      'hanseníase', 'PQT-U', 'poliquimioterapia única', 'Dr. Gasnelio', 'Gá',
      'dispensação farmacêutica', 'assistente virtual médico', 'educação médica',
      'rifampicina', 'clofazimina', 'dapsona', 'orientação farmacêutica'
    ]}
  />
)

export const ChatPageSEO: React.FC = () => (
  <SEOHead
    title="Chat com Assistente Virtual"
    description="Converse com Dr. Gasnelio ou Gá, assistentes virtuais especializados em hanseníase e PQT-U. Obtenha orientações precisas sobre dispensação de medicamentos."
    keywords={[
      'chat médico', 'assistente virtual hanseníase', 'Dr. Gasnelio chat',
      'Gá assistente', 'orientação PQT-U', 'consulta virtual farmácia'
    ]}
    ogType="article"
  />
)

export const AboutPageSEO: React.FC = () => (
  <SEOHead
    title="Sobre o Sistema PQT-U"
    description="Conheça o sistema de roteiros de dispensação para hanseníase, baseado em tese de doutorado. Saiba mais sobre Dr. Gasnelio, Gá e a metodologia PQT-U."
    keywords={[
      'sobre PQT-U', 'metodologia hanseníase', 'tese doutorado',
      'Dr. Gasnelio sobre', 'sistema dispensação', 'educação farmacêutica'
    ]}
    ogType="article"
  />
)

export const ResourcesPageSEO: React.FC = () => (
  <SEOHead
    title="Recursos e Materiais Educacionais"
    description="Acesse materiais educacionais, referências científicas, glossário e recursos sobre hanseníase e PQT-U. Conteúdo para profissionais de saúde e estudantes."
    keywords={[
      'recursos hanseníase', 'materiais educacionais PQT-U', 'referências científicas',
      'glossário médico', 'educação continuada', 'materiais farmácia'
    ]}
    ogType="article"
  />
)

export default SEOHead