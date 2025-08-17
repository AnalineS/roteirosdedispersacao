'use client';

import React from 'react';
import Link from 'next/link';
// Ícone de seta customizado
const ArrowLeftIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

// Ícones SVG simples
const HomeIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
  </svg>
);

const ChatIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
  </svg>
);

const BookIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V4.804z" />
  </svg>
);

const ToolIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
  </svg>
);

const ShieldIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

const GraduationIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
  </svg>
);

interface SiteMapSection {
  title: string;
  icon: React.ComponentType;
  color: string;
  pages: {
    title: string;
    href: string;
    description: string;
    isPublic?: boolean;
  }[];
}

export default function SiteMapPage() {
  const sections: SiteMapSection[] = [
    {
      title: 'Área Principal',
      icon: HomeIcon,
      color: 'bg-blue-50 border-blue-200 text-blue-800',
      pages: [
        {
          title: 'Página Inicial',
          href: '/',
          description: 'Portal de entrada e seleção de assistentes especializados'
        },
        {
          title: 'Chat com IA',
          href: '/chat',
          description: 'Interação com Dr. Gasnelio e Gá - Assistentes especializados'
        },
        {
          title: 'Dashboard Pessoal',
          href: '/dashboard',
          description: 'Acompanhamento do progresso educacional'
        },
        {
          title: 'Progresso',
          href: '/progress',
          description: 'Métricas detalhadas de aprendizagem'
        }
      ]
    },
    {
      title: 'Conteúdo Educacional',
      icon: BookIcon,
      color: 'bg-green-50 border-green-200 text-green-800',
      pages: [
        {
          title: 'Módulos de Aprendizagem',
          href: '/modules',
          description: 'Conteúdo educacional estruturado sobre hanseníase'
        },
        {
          title: 'Sobre a Hanseníase',
          href: '/modules/hanseniase',
          description: 'Conceitos fundamentais e introdução'
        },
        {
          title: 'Diagnóstico',
          href: '/modules/diagnostico',
          description: 'Sinais clínicos, sintomas e exames diagnósticos'
        },
        {
          title: 'Tratamento PQT-U',
          href: '/modules/tratamento',
          description: 'Poliquimioterapia única - protocolo oficial'
        },
        {
          title: 'Roteiro de Dispensação',
          href: '/modules/roteiro-dispensacao',
          description: 'Protocolo completo para farmacêuticos'
        },
        {
          title: 'Vida com Hanseníase',
          href: '/vida-com-hanseniase',
          description: 'Qualidade de vida e direitos (acesso público)',
          isPublic: true
        }
      ]
    },
    {
      title: 'Ferramentas e Recursos',
      icon: ToolIcon,
      color: 'bg-purple-50 border-purple-200 text-purple-800',
      pages: [
        {
          title: 'Recursos Práticos',
          href: '/resources',
          description: 'Central de ferramentas e calculadoras'
        },
        {
          title: 'Calculadora de Doses PQT-U',
          href: '/resources/calculator',
          description: 'Cálculo automático de doses medicamentosas'
        },
        {
          title: 'Verificador de Interações',
          href: '/resources/interactions',
          description: 'Análise de incompatibilidades medicamentosas'
        },
        {
          title: 'Checklist de Dispensação',
          href: '/resources/checklist',
          description: 'Lista de verificação procedural'
        },
        {
          title: 'Glossário Médico',
          href: '/glossario',
          description: 'Terminologia técnica de hanseníase explicada'
        },
        {
          title: 'Downloads',
          href: '/downloads',
          description: 'Materiais complementares e documentação'
        }
      ]
    },
    {
      title: 'Informações Institucionais',
      icon: GraduationIcon,
      color: 'bg-indigo-50 border-indigo-200 text-indigo-800',
      pages: [
        {
          title: 'Sobre a Tese',
          href: '/sobre-a-tese',
          description: 'Pesquisa de doutorado em Ciências Farmacêuticas'
        },
        {
          title: 'Sobre o Sistema',
          href: '/sobre',
          description: 'Informações sobre a plataforma educacional'
        },
        {
          title: 'Metodologia',
          href: '/metodologia',
          description: 'Métodos científicos e fundamentação teórica'
        }
      ]
    },
    {
      title: 'Legal e Privacidade',
      icon: ShieldIcon,
      color: 'bg-gray-50 border-gray-200 text-gray-800',
      pages: [
        {
          title: 'Política de Privacidade',
          href: '/privacidade',
          description: 'Como protegemos seus dados pessoais (LGPD)'
        },
        {
          title: 'Conformidade LGPD',
          href: '/conformidade',
          description: 'Adequação à Lei Geral de Proteção de Dados'
        },
        {
          title: 'Termos de Uso',
          href: '/termos',
          description: 'Condições para uso da plataforma'
        },
        {
          title: 'Código de Ética',
          href: '/etica',
          description: 'Princípios éticos em pesquisa médica'
        },
        {
          title: 'Responsabilidade Médica',
          href: '/responsabilidade',
          description: 'Limitações e orientações de uso clínico'
        },
        {
          title: 'Transparência',
          href: '/transparencia',
          description: 'Metodologia aberta e reprodutibilidade científica'
        }
      ]
    },
    {
      title: 'Área Administrativa',
      icon: ToolIcon,
      color: 'bg-orange-50 border-orange-200 text-orange-800',
      pages: [
        {
          title: 'Configurações',
          href: '/settings',
          description: 'Preferências pessoais e personalização'
        },
        {
          title: 'Feedback',
          href: '/feedback',
          description: 'Envio de sugestões e relatórios de problemas'
        },
        {
          title: 'Painel Admin',
          href: '/admin/features',
          description: 'Gerenciamento de feature flags (acesso restrito)'
        },
        {
          title: 'Monitoramento',
          href: '/admin/monitoring',
          description: 'Métricas e analytics do sistema (acesso restrito)'
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8">
            <div className="flex items-center gap-4 mb-6">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5" />
                Voltar ao Início
              </Link>
            </div>
            
            <div className="text-center">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Mapa do Site
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Navegação completa de todas as páginas e recursos da plataforma educacional
                <br />
                <span className="text-sm text-gray-500 mt-2 block">
                  Sistema de Aprendizagem Inteligente para Dispensação de Medicamentos - Hanseníase
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-8 lg:gap-12">
          {sections.map((section, index) => {
            const IconComponent = section.icon;
            return (
              <div key={index} className="space-y-6">
                {/* Section Header */}
                <div className={`${section.color} rounded-xl p-6 border`}>
                  <div className="flex items-center gap-3">
                    <IconComponent />
                    <h2 className="text-2xl font-bold">{section.title}</h2>
                  </div>
                </div>

                {/* Pages Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {section.pages.map((page, pageIndex) => (
                    <Link
                      key={pageIndex}
                      href={page.href}
                      className="group bg-white rounded-lg p-6 border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {page.title}
                          </h3>
                          {page.isPublic && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full shrink-0 ml-2">
                              Público
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {page.description}
                        </p>
                        <div className="flex items-center text-blue-600 text-sm font-medium">
                          <span>Acessar página</span>
                          <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Info */}
        <div className="mt-16 text-center">
          <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-center gap-3 mb-4">
              <GraduationIcon />
              <h3 className="text-xl font-semibold text-gray-900">
                Sistema Educacional - Roteiros de Dispensação
              </h3>
            </div>
            <p className="text-gray-600 mb-4">
              Plataforma desenvolvida como parte da pesquisa de doutorado em Ciências Farmacêuticas
            </p>
            <div className="text-sm text-gray-500">
              <p>Universidade de Brasília (UnB) • Programa de Pós-Graduação em Ciências Farmacêuticas</p>
              <p className="mt-1">Total de {sections.reduce((acc, section) => acc + section.pages.length, 0)} páginas organizadas em {sections.length} seções</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}