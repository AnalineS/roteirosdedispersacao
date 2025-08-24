'use client';

import React from 'react';
import { 
  BookOpen, 
  Shield, 
  Award, 
  Users, 
  FileText, 
  Eye,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

interface Badge {
  icon: React.ElementType;
  title: string;
  description: string;
  type: 'academic' | 'quality' | 'transparency' | 'disclaimer';
}

const badges: Badge[] = [
  {
    icon: BookOpen,
    title: 'Baseado em PCDT 2022',
    description: 'Conteúdo fundamentado no Protocolo Clínico oficial do Ministério da Saúde',
    type: 'academic'
  },
  {
    icon: Award,
    title: 'Pesquisa de Doutorado',
    description: 'Desenvolvido como parte de tese acadêmica com rigor científico',
    type: 'academic'
  },
  {
    icon: Shield,
    title: 'Código Aberto',
    description: 'Transparência total com código-fonte disponível publicamente',
    type: 'transparency'
  },
  {
    icon: Users,
    title: 'Peer Review',
    description: 'Conteúdo revisado por profissionais especialistas da área',
    type: 'quality'
  },
  {
    icon: FileText,
    title: 'Fontes Citadas',
    description: 'Todas as informações possuem referências científicas verificáveis',
    type: 'transparency'
  },
  {
    icon: Eye,
    title: 'Sem Fins Lucrativos',
    description: 'Plataforma educacional gratuita sem interesses comerciais',
    type: 'quality'
  }
];

export default function TrustBadges() {
  return (
    <section className="trust-section">
      <div className="container">
        {/* Header */}
        <div className="trust-header">
          <h2 className="trust-title">Credibilidade e Transparência</h2>
          <p className="trust-subtitle">
            Nossa plataforma educacional é construída com base em evidências científicas
            e transparência total
          </p>
        </div>

        {/* Badges Grid */}
        <div className="badges-grid">
          {badges.map((badge, index) => (
            <BadgeCard key={index} badge={badge} index={index} />
          ))}
        </div>

        {/* Disclaimer Important */}
        <div className="disclaimer-section">
          <div className="disclaimer-header">
            <AlertTriangle className="disclaimer-icon" />
            <h3 className="disclaimer-title">Importante</h3>
          </div>
          <div className="disclaimer-content">
            <p className="disclaimer-text">
              <strong>Esta é uma ferramenta educacional</strong> desenvolvida para apoio ao aprendizado 
              sobre dispensação de medicamentos para hanseníase. Não substitui consulta médica, 
              orientação farmacêutica profissional ou diretrizes oficiais das instituições de saúde.
            </p>
            <ul className="disclaimer-list">
              <li>• Sempre consulte fontes oficiais para decisões clínicas</li>
              <li>• Use como complemento ao conhecimento profissional</li>
              <li>• Verifique informações com literatura científica atualizada</li>
              <li>• Em caso de dúvidas, procure orientação especializada</li>
            </ul>
          </div>
        </div>

        {/* Academic Footer */}
        <div className="academic-footer">
          <div className="academic-info">
            <h4 className="academic-title">Contexto Acadêmico</h4>
            <p className="academic-description">
              Desenvolvido como parte de pesquisa doutoral em Ciências Farmacêuticas, 
              com foco na melhoria de processos educacionais em dispensação de medicamentos 
              para hanseníase no sistema público de saúde brasileiro.
            </p>
          </div>
          <div className="academic-links">
            <a href="#metodologia" className="academic-link">
              Ver Metodologia
            </a>
            <a href="#referencias" className="academic-link">
              Referências Bibliográficas
            </a>
            <a href="#codigo-fonte" className="academic-link">
              Código Fonte
            </a>
          </div>
        </div>
      </div>

      <style jsx>{`
        .trust-section {
          padding: var(--spacing-4xl) 0;
          background: linear-gradient(180deg, 
            #ffffff 0%, 
            #f9fafb 100%);
        }

        .trust-header {
          text-align: center;
          max-width: 800px;
          margin: 0 auto var(--spacing-3xl);
        }

        .trust-title {
          font-family: var(--font-family-secondary);
          font-size: clamp(2rem, 4vw, 2.5rem);
          font-weight: var(--font-weight-bold);
          color: var(--color-gray-900);
          margin-bottom: var(--spacing-md);
        }

        .trust-subtitle {
          font-size: var(--font-size-lg);
          color: var(--color-gray-600);
          line-height: var(--line-height-relaxed);
        }

        .badges-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: var(--spacing-lg);
          margin-bottom: var(--spacing-3xl);
        }

        @media (min-width: 768px) {
          .badges-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (min-width: 1200px) {
          .badges-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }

        .disclaimer-section {
          background: linear-gradient(135deg, 
            #fff3cd 0%, 
            #ffeaa7 100%);
          border: 2px solid #ffc107;
          border-radius: var(--radius-xl);
          padding: var(--spacing-xl);
          margin-bottom: var(--spacing-3xl);
          box-shadow: var(--shadow-md);
        }

        .disclaimer-header {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-lg);
        }

        .disclaimer-icon {
          width: 32px;
          height: 32px;
          color: #f39c12;
        }

        .disclaimer-title {
          font-size: var(--font-size-xl);
          font-weight: var(--font-weight-bold);
          color: #8b4513;
          margin: 0;
        }

        .disclaimer-text {
          font-size: var(--font-size-base);
          color: #7d4e00;
          line-height: var(--line-height-relaxed);
          margin-bottom: var(--spacing-md);
        }

        .disclaimer-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .disclaimer-list li {
          font-size: var(--font-size-sm);
          color: #7d4e00;
          margin-bottom: var(--spacing-xs);
          padding-left: var(--spacing-md);
        }

        .academic-footer {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: var(--radius-xl);
          padding: var(--spacing-xl);
          box-shadow: var(--shadow-sm);
          display: grid;
          gap: var(--spacing-xl);
        }

        @media (min-width: 768px) {
          .academic-footer {
            grid-template-columns: 2fr 1fr;
            align-items: center;
          }
        }

        .academic-title {
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-semibold);
          color: var(--color-gray-900);
          margin-bottom: var(--spacing-sm);
        }

        .academic-description {
          font-size: var(--font-size-base);
          color: var(--color-gray-600);
          line-height: var(--line-height-relaxed);
          margin: 0;
        }

        .academic-links {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }

        @media (min-width: 768px) {
          .academic-links {
            align-items: flex-end;
          }
        }

        .academic-link {
          color: var(--color-primary-600);
          text-decoration: none;
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          padding: var(--spacing-xs) 0;
          border-bottom: 1px solid transparent;
          transition: all var(--transition-fast);
        }

        .academic-link:hover {
          border-bottom-color: var(--color-primary-600);
        }

        /* Dark Mode */
        [data-theme="dark"] .trust-section {
          background: linear-gradient(180deg, 
            var(--color-gray-50) 0%, 
            var(--color-gray-100) 100%);
        }

        [data-theme="dark"] .trust-title {
          color: var(--color-gray-900);
        }

        [data-theme="dark"] .trust-subtitle {
          color: var(--color-gray-600);
        }

        [data-theme="dark"] .disclaimer-section {
          background: linear-gradient(135deg, 
            #4a4a4a 0%, 
            #5a5a5a 100%);
          border-color: #6c757d;
        }

        [data-theme="dark"] .disclaimer-title {
          color: #ffc107;
        }

        [data-theme="dark"] .disclaimer-text,
        [data-theme="dark"] .disclaimer-list li {
          color: #e9ecef;
        }

        [data-theme="dark"] .academic-footer {
          background: var(--color-gray-200);
        }

        [data-theme="dark"] .academic-title {
          color: var(--color-gray-900);
        }

        [data-theme="dark"] .academic-description {
          color: var(--color-gray-600);
        }
      `}</style>
    </section>
  );
}

interface BadgeCardProps {
  badge: Badge;
  index: number;
}

function BadgeCard({ badge, index }: BadgeCardProps) {
  const Icon = badge.icon;
  
  const getTypeColor = (type: Badge['type']) => {
    switch (type) {
      case 'academic':
        return 'academic';
      case 'quality':
        return 'quality';
      case 'transparency':
        return 'transparency';
      default:
        return 'academic';
    }
  };

  return (
    <div 
      className={`badge-card badge-${getTypeColor(badge.type)}`}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="badge-icon">
        <Icon size={28} />
      </div>
      
      <h3 className="badge-title">{badge.title}</h3>
      <p className="badge-description">{badge.description}</p>
      
      <div className="badge-verified">
        <CheckCircle className="verified-icon" />
        <span>Verificado</span>
      </div>

      <style jsx>{`
        .badge-card {
          background: #ffffff;
          border: 1px solid #e5e7eb;
          border-radius: var(--radius-xl);
          padding: var(--spacing-2xl);
          text-align: center;
          box-shadow: var(--shadow-sm);
          transition: all var(--transition-base);
          animation: fadeInUp 0.6s ease-out forwards;
          opacity: 0;
          position: relative;
          overflow: hidden;
        }

        .badge-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: var(--accent-color);
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

        .badge-card:hover {
          box-shadow: var(--shadow-lg);
          transform: translateY(-4px);
        }

        .badge-academic {
          --accent-color: linear-gradient(90deg, #3498db, #2980b9);
        }

        .badge-quality {
          --accent-color: linear-gradient(90deg, #2ecc71, #27ae60);
        }

        .badge-transparency {
          --accent-color: linear-gradient(90deg, #9b59b6, #8e44ad);
        }

        .badge-icon {
          width: 64px;
          height: 64px;
          border-radius: var(--radius-xl);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto var(--spacing-xl);
          background: var(--accent-color);
          color: #ffffff;
        }

        .badge-title {
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-semibold);
          color: var(--color-gray-900);
          margin-bottom: var(--spacing-md);
          padding: 0 var(--spacing-sm);
        }

        .badge-description {
          font-size: var(--font-size-base);
          color: var(--color-gray-600);
          line-height: var(--line-height-relaxed);
          margin-bottom: var(--spacing-xl);
          padding: 0 var(--spacing-md);
        }

        .badge-verified {
          display: inline-flex;
          align-items: center;
          gap: var(--spacing-xs);
          padding: var(--spacing-xs) var(--spacing-sm);
          background: #10b981;
          color: #ffffff;
          border-radius: var(--radius-full);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
        }

        .verified-icon {
          width: 16px;
          height: 16px;
        }

        /* Dark Mode */
        [data-theme="dark"] .badge-card {
          background: var(--color-gray-200);
        }

        [data-theme="dark"] .badge-title {
          color: var(--color-gray-900);
        }

        [data-theme="dark"] .badge-description {
          color: var(--color-gray-600);
        }
      `}</style>
    </div>
  );
}