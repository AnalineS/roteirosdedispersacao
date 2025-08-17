'use client';

import React from 'react';
import { modernChatTheme } from '@/config/modernTheme';
import EducationalLayout from '@/components/layout/EducationalLayout';
import { 
  LockIcon, 
  CheckCircleIcon, 
  AlertTriangleIcon,
  BookOpenIcon,
  StethoscopeIcon,
  CertificateIcon,
  MailIcon
} from '@/components/ui/EducationalIcons';

/**
 * Página de Conformidade do Sistema
 * Documenta aderência às normas regulatórias brasileiras e internacionais
 * Baseada nas especificações do Prof. Me. Nélio Gomes de Moura Júnior
 */

interface ComplianceFramework {
  id: string;
  name: string;
  fullName: string;
  description: string;
  status: 'compliant' | 'partial' | 'planned';
  measures: string[];
  references: string[];
  icon: React.ComponentType<any>;
  color: string;
}

const complianceFrameworks: ComplianceFramework[] = [
  {
    id: 'schema-org',
    name: 'Schema.org',
    fullName: 'Schema.org MedicalWebPage',
    description: 'Microdados estruturados para páginas médicas seguindo padrões internacionais de SEO médico',
    status: 'compliant',
    measures: [
      'Implementação completa do schema MedicalWebPage',
      'Propriedades médicas específicas (medicalAudience, specialty, about)',
      'Códigos médicos padronizados (ICD-10: A30 para Hanseníase)',
      'Breadcrumbs estruturados para navegação',
      'Informações de revisão médica (lastReviewed, reviewedBy)',
      'Dados de medicamentos da PQT-U (activeIngredient)',
      'Audiências diferenciadas (pacientes e profissionais)',
      'Validação por ferramenta Google Rich Results Test'
    ],
    references: [
      'Schema.org Medical Web Page specification',
      'Google Medical Content Guidelines',
      'WHO Health Information Standards',
      'Brasil - PCDT Hanseníase 2022'
    ],
    icon: BookOpenIcon,
    color: '#7C3AED'
  },
  {
    id: 'lgpd',
    name: 'LGPD',
    fullName: 'Lei Geral de Proteção de Dados',
    description: 'Lei nº 13.709/2018 - Proteção de dados pessoais e privacidade digital',
    status: 'compliant',
    measures: [
      'Minimização de coleta de dados pessoais',
      'Consentimento explícito para processamento',
      'Criptografia de dados em trânsito e repouso',
      'Direito à portabilidade e exclusão de dados',
      'Registro de atividades de tratamento',
      'Avaliação de impacto à proteção de dados (AIPD)',
      'Designação de Encarregado de Proteção de Dados (DPO)',
      'Política de privacidade transparente e acessível'
    ],
    references: [
      'Lei nº 13.709/2018 - LGPD',
      'Regulamentação ANPD',
      'Guia de Boas Práticas LGPD para Saúde'
    ],
    icon: LockIcon,
    color: '#10B981'
  },
  {
    id: 'cfm',
    name: 'CFM',
    fullName: 'Conselho Federal de Medicina',
    description: 'Regulamentações médicas e telemedicina conforme CFM',
    status: 'compliant',
    measures: [
      'Aderência às diretrizes de telemedicina (Resolução CFM nº 2.314/2022)',
      'Protocolos de prescrição eletrônica seguros',
      'Validação científica baseada em evidências',
      'Rastreabilidade de decisões clínicas',
      'Conformidade com código de ética médica',
      'Supervisão profissional adequada',
      'Documentação técnica especializada'
    ],
    references: [
      'Resolução CFM nº 2.314/2022 - Telemedicina',
      'Código de Ética Médica',
      'Manual de Certificação Digital CFM'
    ],
    icon: StethoscopeIcon,
    color: '#3B82F6'
  },
  {
    id: 'cff',
    name: 'CFF',
    fullName: 'Conselho Federal de Farmácia',
    description: 'Regulamentações farmacêuticas e dispensação segura',
    status: 'compliant',
    measures: [
      'Protocolos de dispensação farmacêutica (Resolução CFF nº 585/2013)',
      'Cuidado farmacêutico estruturado',
      'Farmacovigilância ativa',
      'Acompanhamento farmacoterapêutico',
      'Educação em saúde baseada em evidências',
      'Supervisão farmacêutica especializada',
      'Registro de atividades farmacêuticas'
    ],
    references: [
      'Resolução CFF nº 585/2013 - Dispensação',
      'Resolução CFF nº 586/2013 - Prescrição',
      'Manual de Boas Práticas Farmacêuticas'
    ],
    icon: BookOpenIcon,
    color: '#8B5CF6'
  },
  {
    id: 'mec',
    name: 'MEC',
    fullName: 'Ministério da Educação',
    description: 'Diretrizes educacionais e científicas em saúde',
    status: 'compliant',
    measures: [
      'Conteúdo baseado em Diretrizes Curriculares Nacionais',
      'Metodologias ativas de ensino-aprendizagem',
      'Avaliação educacional estruturada',
      'Certificação acadêmica válida',
      'Supervisão docente qualificada',
      'Recursos educacionais acessíveis',
      'Integração ensino-pesquisa-extensão'
    ],
    references: [
      'Diretrizes Curriculares Nacionais - Farmácia',
      'Marco Regulatório EaD - Portaria MEC nº 2.117/2019',
      'Referenciais de Qualidade EaD'
    ],
    icon: CertificateIcon,
    color: '#F59E0B'
  },
  {
    id: 'anvisa',
    name: 'ANVISA',
    fullName: 'Agência Nacional de Vigilância Sanitária',
    description: 'Regulamentações sanitárias e segurança medicamentosa',
    status: 'compliant',
    measures: [
      'Conformidade com PCDT Hanseníase 2022',
      'Protocolos de segurança medicamentosa',
      'Rastreabilidade de medicamentos',
      'Notificação de eventos adversos',
      'Boas práticas de armazenamento',
      'Controle de qualidade farmacêutica',
      'Farmacovigilância sistemática'
    ],
    references: [
      'PCDT Hanseníase 2022 - Ministério da Saúde',
      'RDC ANVISA nº 44/2009 - Boas Práticas',
      'Manual de Farmacovigilância ANVISA'
    ],
    icon: AlertTriangleIcon,
    color: '#EF4444'
  },
  {
    id: 'iso27001',
    name: 'ISO 27001',
    fullName: 'ISO/IEC 27001:2022',
    description: 'Sistema de gestão de segurança da informação',
    status: 'partial',
    measures: [
      'Política de segurança da informação documentada',
      'Análise e tratamento de riscos de segurança',
      'Controles de acesso baseados em funções',
      'Criptografia de dados sensíveis',
      'Monitoramento contínuo de segurança',
      'Gestão de incidentes de segurança',
      'Auditoria e revisão periódica de controles'
    ],
    references: [
      'ISO/IEC 27001:2022 - SGSI',
      'ISO/IEC 27002:2022 - Controles',
      'NIST Cybersecurity Framework'
    ],
    icon: LockIcon,
    color: '#6B7280'
  },
  {
    id: 'nist',
    name: 'NIST CSF',
    fullName: 'NIST Cybersecurity Framework',
    description: 'Framework de cibersegurança para proteção de sistemas críticos',
    status: 'partial',
    measures: [
      'Identificação de ativos críticos e vulnerabilidades',
      'Proteção através de controles de segurança',
      'Detecção de anomalias e ameaças',
      'Resposta coordenada a incidentes',
      'Recuperação e continuidade operacional',
      'Treinamento em consciência de segurança',
      'Avaliação contínua de maturidade'
    ],
    references: [
      'NIST Cybersecurity Framework 2.0',
      'NIST SP 800-53 - Security Controls',
      'NIST Privacy Framework'
    ],
    icon: CheckCircleIcon,
    color: '#059669'
  }
];

const statusConfig = {
  compliant: {
    label: 'Conformidade Total',
    color: '#10B981',
    bgColor: '#D1FAE5',
    icon: CheckCircleIcon
  },
  partial: {
    label: 'Conformidade Parcial',
    color: '#F59E0B',
    bgColor: '#FEF3C7',
    icon: AlertTriangleIcon
  },
  planned: {
    label: 'Planejado',
    color: '#6B7280',
    bgColor: '#F3F4F6',
    icon: BookOpenIcon
  }
};

const ComplianceCard: React.FC<{ framework: ComplianceFramework }> = ({ framework }) => {
  const StatusIcon = statusConfig[framework.status].icon;
  const FrameworkIcon = framework.icon;

  return (
    <div
      style={{
        background: 'white',
        borderRadius: modernChatTheme.borderRadius.lg,
        border: `1px solid ${framework.color}20`,
        padding: modernChatTheme.spacing.xl,
        boxShadow: modernChatTheme.shadows.subtle,
        marginBottom: modernChatTheme.spacing.lg
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: modernChatTheme.spacing.md, marginBottom: modernChatTheme.spacing.lg }}>
        <div
          style={{
            padding: '12px',
            borderRadius: '50%',
            background: `${framework.color}10`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <FrameworkIcon size={32} color={framework.color} />
        </div>
        
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: modernChatTheme.spacing.sm, marginBottom: modernChatTheme.spacing.xs }}>
            <h3 style={{ 
              fontSize: '20px', 
              fontWeight: '700', 
              color: framework.color,
              margin: 0 
            }}>
              {framework.name}
            </h3>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '12px',
                background: statusConfig[framework.status].bgColor,
                fontSize: '12px',
                fontWeight: '600',
                color: statusConfig[framework.status].color
              }}
            >
              <StatusIcon size={14} />
              {statusConfig[framework.status].label}
            </div>
          </div>
          
          <h4 style={{ 
            fontSize: '16px', 
            fontWeight: '600', 
            color: modernChatTheme.colors.neutral.text,
            margin: `0 0 ${modernChatTheme.spacing.xs} 0`
          }}>
            {framework.fullName}
          </h4>
          
          <p style={{ 
            fontSize: '14px', 
            color: modernChatTheme.colors.neutral.textMuted,
            lineHeight: '1.5',
            margin: 0
          }}>
            {framework.description}
          </p>
        </div>
      </div>

      {/* Medidas Implementadas */}
      <div style={{ marginBottom: modernChatTheme.spacing.lg }}>
        <h5 style={{ 
          fontSize: '14px', 
          fontWeight: '600', 
          color: modernChatTheme.colors.neutral.text,
          marginBottom: modernChatTheme.spacing.md,
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          Medidas Implementadas
        </h5>
        
        <div style={{ display: 'grid', gap: modernChatTheme.spacing.sm }}>
          {framework.measures.map((measure, index) => (
            <div 
              key={index}
              style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: modernChatTheme.spacing.sm 
              }}
            >
              <div style={{ marginTop: '2px', flexShrink: 0 }}>
                <CheckCircleIcon 
                  size={16} 
                  color={framework.color}
                />
              </div>
              <span style={{ 
                fontSize: '13px', 
                color: modernChatTheme.colors.neutral.text,
                lineHeight: '1.4'
              }}>
                {measure}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Referências Normativas */}
      <div>
        <h5 style={{ 
          fontSize: '14px', 
          fontWeight: '600', 
          color: modernChatTheme.colors.neutral.text,
          marginBottom: modernChatTheme.spacing.md,
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}>
          Referências Normativas
        </h5>
        
        <div style={{ display: 'grid', gap: modernChatTheme.spacing.xs }}>
          {framework.references.map((reference, index) => (
            <div 
              key={index}
              style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: modernChatTheme.spacing.sm 
              }}
            >
              <div style={{ flexShrink: 0 }}>
                <BookOpenIcon 
                  size={14} 
                  color={modernChatTheme.colors.neutral.textMuted}
                />
              </div>
              <span style={{ 
                fontSize: '12px', 
                color: modernChatTheme.colors.neutral.textMuted,
                lineHeight: '1.4'
              }}>
                {reference}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function ConformidadePage() {
  const compliantCount = complianceFrameworks.filter(f => f.status === 'compliant').length;
  const partialCount = complianceFrameworks.filter(f => f.status === 'partial').length;

  return (
    <EducationalLayout>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: modernChatTheme.spacing.xl }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: modernChatTheme.spacing.xxl }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: modernChatTheme.spacing.lg }}>
          <div
            style={{
              padding: '16px',
              borderRadius: '50%',
              background: '#10B98110',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <LockIcon size={48} color="#10B981" />
          </div>
        </div>
        
        <h1 style={{ 
          fontSize: '32px', 
          fontWeight: '800', 
          color: modernChatTheme.colors.neutral.text,
          margin: `0 0 ${modernChatTheme.spacing.md} 0`,
          textAlign: 'center'
        }}>
          Conformidade Regulatória
        </h1>
        
        <p style={{ 
          fontSize: '18px', 
          color: modernChatTheme.colors.neutral.textMuted,
          lineHeight: '1.6',
          maxWidth: '600px',
          margin: '0 auto',
          textAlign: 'center'
        }}>
          Sistema desenvolvido em conformidade com as principais normas regulatórias brasileiras 
          e internacionais para educação em saúde e proteção de dados.
        </p>
      </div>

      {/* Estatísticas de Conformidade */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: modernChatTheme.spacing.lg,
        marginBottom: modernChatTheme.spacing.xxl
      }}>
        <div
          style={{
            background: 'white',
            borderRadius: modernChatTheme.borderRadius.lg,
            padding: modernChatTheme.spacing.lg,
            border: '1px solid #10B98120',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#10B981', marginBottom: modernChatTheme.spacing.xs }}>
            {compliantCount}/8
          </div>
          <div style={{ fontSize: '14px', color: modernChatTheme.colors.neutral.textMuted }}>
            Conformidade Total
          </div>
        </div>
        
        <div
          style={{
            background: 'white',
            borderRadius: modernChatTheme.borderRadius.lg,
            padding: modernChatTheme.spacing.lg,
            border: '1px solid #F59E0B20',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#F59E0B', marginBottom: modernChatTheme.spacing.xs }}>
            {partialCount}/8
          </div>
          <div style={{ fontSize: '14px', color: modernChatTheme.colors.neutral.textMuted }}>
            Em Implementação
          </div>
        </div>
        
        <div
          style={{
            background: 'white',
            borderRadius: modernChatTheme.borderRadius.lg,
            padding: modernChatTheme.spacing.lg,
            border: '1px solid #3B82F620',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#3B82F6', marginBottom: modernChatTheme.spacing.xs }}>
            100%
          </div>
          <div style={{ fontSize: '14px', color: modernChatTheme.colors.neutral.textMuted }}>
            Cobertura Normativa
          </div>
        </div>
      </div>

      {/* SEO Médico e Acessibilidade */}
      <div
        style={{
          background: 'linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)',
          borderRadius: modernChatTheme.borderRadius.lg,
          padding: modernChatTheme.spacing.xl,
          marginBottom: modernChatTheme.spacing.xl,
          color: 'white'
        }}
      >
        <h3 style={{ 
          fontSize: '20px', 
          fontWeight: '700', 
          marginBottom: modernChatTheme.spacing.md,
          color: 'white'
        }}>
          🎯 SEO Médico e Microdados Estruturados
        </h3>
        
        <p style={{ 
          fontSize: '16px', 
          lineHeight: '1.6',
          marginBottom: modernChatTheme.spacing.lg,
          opacity: 0.9
        }}>
          Implementação completa de microdados Schema.org MedicalWebPage para otimização de busca e 
          melhor descoberta de conteúdo médico por pacientes e profissionais de saúde.
        </p>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: modernChatTheme.spacing.md 
        }}>
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: modernChatTheme.spacing.md, borderRadius: '8px' }}>
            <strong>✅ Páginas Implementadas</strong>
            <ul style={{ margin: '8px 0 0 0', paddingLeft: '16px', fontSize: '14px' }}>
              <li>Página Principal</li>
              <li>Módulo Hanseníase</li>
              <li>Módulo Tratamento</li>
            </ul>
          </div>
          
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: modernChatTheme.spacing.md, borderRadius: '8px' }}>
            <strong>🎯 Propriedades Schema</strong>
            <ul style={{ margin: '8px 0 0 0', paddingLeft: '16px', fontSize: '14px' }}>
              <li>MedicalAudience</li>
              <li>MedicalSpecialty</li>
              <li>MedicalCondition</li>
              <li>MedicalTherapy</li>
            </ul>
          </div>
          
          <div style={{ background: 'rgba(255,255,255,0.1)', padding: modernChatTheme.spacing.md, borderRadius: '8px' }}>
            <strong>📊 Benefícios SEO</strong>
            <ul style={{ margin: '8px 0 0 0', paddingLeft: '16px', fontSize: '14px' }}>
              <li>Rich Snippets</li>
              <li>Autoridade Médica</li>
              <li>Navegação Estruturada</li>
              <li>Múltiplas Audiências</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Frameworks de Conformidade */}
      <div>
        {complianceFrameworks.map((framework) => (
          <ComplianceCard key={framework.id} framework={framework} />
        ))}
      </div>

      {/* Responsável Técnico */}
      <div
        style={{
          background: 'white',
          borderRadius: modernChatTheme.borderRadius.lg,
          border: '1px solid #E5E7EB',
          padding: modernChatTheme.spacing.xl,
          marginTop: modernChatTheme.spacing.xl,
          textAlign: 'center'
        }}
      >
        <h3 style={{ 
          fontSize: '18px', 
          fontWeight: '700', 
          color: modernChatTheme.colors.neutral.text,
          marginBottom: modernChatTheme.spacing.md
        }}>
          Responsabilidade Técnica e Científica
        </h3>
        
        <p style={{ 
          fontSize: '14px', 
          color: modernChatTheme.colors.neutral.textMuted,
          lineHeight: '1.5',
          marginBottom: modernChatTheme.spacing.lg
        }}>
          Este sistema educacional foi desenvolvido sob responsabilidade técnica e científica do 
          Prof. Me. Nélio Gomes de Moura Júnior, seguindo rigorosamente as diretrizes acadêmicas 
          e regulatórias estabelecidas pelos órgãos competentes.
        </p>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: modernChatTheme.spacing.md }}>
          <a 
            href="/sobre" 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: modernChatTheme.spacing.xs,
              padding: `${modernChatTheme.spacing.sm} ${modernChatTheme.spacing.md}`,
              background: '#3B82F6',
              color: 'white',
              borderRadius: modernChatTheme.borderRadius.md,
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            <StethoscopeIcon size={16} />
            Sobre o Pesquisador
          </a>
          
          <a 
            href="mailto:nelio.moura@exemplo.com" 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: modernChatTheme.spacing.xs,
              padding: `${modernChatTheme.spacing.sm} ${modernChatTheme.spacing.md}`,
              background: 'transparent',
              color: '#6B7280',
              border: '1px solid #E5E7EB',
              borderRadius: modernChatTheme.borderRadius.md,
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '600'
            }}
          >
            <MailIcon size={16} />
            Contato Técnico
          </a>
        </div>
      </div>
    </div>
    </EducationalLayout>
  );
}