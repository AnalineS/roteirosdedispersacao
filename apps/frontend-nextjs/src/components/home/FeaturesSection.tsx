'use client';

import React from 'react';
import { 
  Brain, 
  Shield, 
  Clock, 
  Users, 
  FileText, 
  Zap,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

interface Feature {
  icon: React.ElementType;
  title: string;
  description: string;
  benefits: string[];
  color: string;
}

const features: Feature[] = [
  {
    icon: Brain,
    title: 'Assistentes Inteligentes',
    description: 'Dois especialistas virtuais para diferentes necessidades',
    benefits: [
      'Dr. Gasnelio para questões técnicas',
      'Gá para orientação simplificada',
      'Respostas personalizadas'
    ],
    color: 'primary'
  },
  {
    icon: Shield,
    title: '100% Confiável',
    description: 'Baseado em diretrizes oficiais do Ministério da Saúde',
    benefits: [
      'PCDT Hanseníase 2022',
      'Protocolos atualizados',
      'Validação por especialistas'
    ],
    color: 'secondary'
  },
  {
    icon: Clock,
    title: 'Acesso Imediato',
    description: 'Informações disponíveis 24 horas por dia',
    benefits: [
      'Sem filas de espera',
      'Respostas instantâneas',
      'Disponível offline'
    ],
    color: 'success'
  },
  {
    icon: Users,
    title: 'Para Todos',
    description: 'Interface acessível para profissionais e pacientes',
    benefits: [
      'Linguagem adaptável',
      'Alto contraste disponível',
      'Compatível com leitores de tela'
    ],
    color: 'info'
  },
  {
    icon: FileText,
    title: 'Base Completa',
    description: 'Todo conteúdo necessário em um só lugar',
    benefits: [
      'Dosagens e esquemas',
      'Efeitos adversos',
      'Contraindicações'
    ],
    color: 'warning'
  },
  {
    icon: Zap,
    title: 'Busca Inteligente',
    description: 'Encontre informações rapidamente',
    benefits: [
      'Busca por contexto',
      'Sugestões automáticas',
      'Histórico de consultas'
    ],
    color: 'error'
  }
];

export default function FeaturesSection() {
  return (
    <section className="features-section">
      <div className="container">
        {/* Header da Seção */}
        <div className="features-header">
          <span className="features-label">Recursos</span>
          <h2 className="features-title">
            Tudo que você precisa para
            <span className="title-highlight"> dispensação segura</span>
          </h2>
          <p className="features-subtitle">
            Ferramentas desenvolvidas especialmente para profissionais de saúde
            que trabalham com hanseníase
          </p>
        </div>

        {/* Grid de Features */}
        <div className="features-grid">
          {features.map((feature, index) => (
            <FeatureCard key={index} feature={feature} index={index} />
          ))}
        </div>

        {/* CTA Section */}
        <div className="features-cta">
          <div className="cta-content">
            <h3 className="cta-title">Pronto para começar?</h3>
            <p className="cta-description">
              Acesse agora mesmo e tenha todas as informações na palma da mão
            </p>
          </div>
          <button className="cta-button">
            Experimentar Gratuitamente
            <ArrowRight className="cta-icon" />
          </button>
        </div>
      </div>

      <style jsx>{`
        .features-section {
          padding: var(--spacing-4xl) 0;
          background: linear-gradient(180deg, 
            var(--color-gray-50) 0%, 
            white 50%, 
            var(--color-gray-50) 100%);
        }

        .features-header {
          text-align: center;
          max-width: 800px;
          margin: 0 auto var(--spacing-3xl);
        }

        .features-label {
          display: inline-block;
          padding: var(--spacing-xs) var(--spacing-md);
          background: var(--color-primary-100);
          color: var(--color-primary-700);
          border-radius: var(--radius-full);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-semibold);
          margin-bottom: var(--spacing-md);
        }

        .features-title {
          font-family: var(--font-family-secondary);
          font-size: clamp(2rem, 4vw, 3rem);
          font-weight: var(--font-weight-bold);
          line-height: 1.2;
          color: var(--color-gray-900);
          margin-bottom: var(--spacing-lg);
        }

        .title-highlight {
          color: var(--color-primary-600);
          display: block;
        }

        .features-subtitle {
          font-size: var(--font-size-lg);
          color: var(--color-gray-600);
          line-height: var(--line-height-relaxed);
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: var(--spacing-xl);
          margin-bottom: var(--spacing-3xl);
        }

        @media (min-width: 768px) {
          .features-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1280px) {
          .features-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .features-cta {
          background: linear-gradient(135deg, 
            var(--color-primary-500), 
            var(--color-primary-600));
          border-radius: var(--radius-2xl);
          padding: var(--spacing-2xl);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: var(--spacing-xl);
          box-shadow: 0 20px 40px rgba(76, 175, 80, 0.2);
        }

        @media (min-width: 768px) {
          .features-cta {
            flex-direction: row;
            justify-content: space-between;
            text-align: left;
          }
        }

        .cta-content {
          flex: 1;
        }

        .cta-title {
          font-size: var(--font-size-2xl);
          font-weight: var(--font-weight-bold);
          color: white;
          margin-bottom: var(--spacing-sm);
        }

        .cta-description {
          font-size: var(--font-size-base);
          color: rgba(255, 255, 255, 0.9);
        }

        .cta-button {
          display: inline-flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-md) var(--spacing-xl);
          background: white;
          color: var(--color-primary-600);
          border: none;
          border-radius: var(--radius-lg);
          font-size: var(--font-size-base);
          font-weight: var(--font-weight-semibold);
          cursor: pointer;
          transition: all var(--transition-base);
          box-shadow: var(--shadow-md);
        }

        .cta-button:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-lg);
        }

        .cta-icon {
          width: 20px;
          height: 20px;
        }

        /* Dark Mode */
        [data-theme="dark"] .features-section {
          background: linear-gradient(180deg, 
            var(--color-gray-100) 0%, 
            var(--color-gray-50) 50%, 
            var(--color-gray-100) 100%);
        }

        [data-theme="dark"] .features-title {
          color: var(--color-gray-900);
        }

        [data-theme="dark"] .features-subtitle {
          color: var(--color-gray-600);
        }

        [data-theme="dark"] .features-cta {
          background: linear-gradient(135deg, 
            var(--color-primary-600), 
            var(--color-primary-700));
        }
      `}</style>
    </section>
  );
}

interface FeatureCardProps {
  feature: Feature;
  index: number;
}

function FeatureCard({ feature, index }: FeatureCardProps) {
  const Icon = feature.icon;
  
  return (
    <article className="feature-card" style={{ animationDelay: `${index * 0.1}s` }}>
      <div className={`feature-icon feature-icon-${feature.color}`}>
        <Icon size={28} />
      </div>
      
      <h3 className="feature-title">{feature.title}</h3>
      <p className="feature-description">{feature.description}</p>
      
      <ul className="feature-benefits">
        {feature.benefits.map((benefit, idx) => (
          <li key={idx} className="benefit-item">
            <CheckCircle className="benefit-icon" />
            <span>{benefit}</span>
          </li>
        ))}
      </ul>

      <style jsx>{`
        .feature-card {
          background: white;
          border-radius: var(--radius-xl);
          padding: var(--spacing-xl);
          box-shadow: var(--shadow-sm);
          transition: all var(--transition-base);
          animation: fadeInUp 0.6s ease-out forwards;
          opacity: 0;
          cursor: pointer;
        }

        @keyframes fadeInUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
          from {
            opacity: 0;
            transform: translateY(20px);
          }
        }

        .feature-card:hover {
          box-shadow: var(--shadow-lg);
          transform: translateY(-4px);
        }

        .feature-icon {
          width: 56px;
          height: 56px;
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: var(--spacing-lg);
          color: white;
        }

        .feature-icon-primary {
          background: linear-gradient(135deg, 
            var(--color-primary-400), 
            var(--color-primary-600));
        }

        .feature-icon-secondary {
          background: linear-gradient(135deg, 
            var(--color-secondary-400), 
            var(--color-secondary-600));
        }

        .feature-icon-success {
          background: linear-gradient(135deg, 
            #66bb6a, 
            #4caf50);
        }

        .feature-icon-info {
          background: linear-gradient(135deg, 
            #42a5f5, 
            #2196f3);
        }

        .feature-icon-warning {
          background: linear-gradient(135deg, 
            #ffa726, 
            #ff9800);
        }

        .feature-icon-error {
          background: linear-gradient(135deg, 
            #ef5350, 
            #f44336);
        }

        .feature-title {
          font-size: var(--font-size-xl);
          font-weight: var(--font-weight-semibold);
          color: var(--color-gray-900);
          margin-bottom: var(--spacing-sm);
        }

        .feature-description {
          font-size: var(--font-size-base);
          color: var(--color-gray-600);
          line-height: var(--line-height-relaxed);
          margin-bottom: var(--spacing-lg);
        }

        .feature-benefits {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .benefit-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          margin-bottom: var(--spacing-sm);
          font-size: var(--font-size-sm);
          color: var(--color-gray-700);
        }

        .benefit-icon {
          width: 16px;
          height: 16px;
          color: var(--color-success);
          flex-shrink: 0;
        }

        /* Dark Mode */
        [data-theme="dark"] .feature-card {
          background: var(--color-gray-200);
        }

        [data-theme="dark"] .feature-title {
          color: var(--color-gray-900);
        }

        [data-theme="dark"] .feature-description {
          color: var(--color-gray-600);
        }

        [data-theme="dark"] .benefit-item {
          color: var(--color-gray-700);
        }
      `}</style>
    </article>
  );
}