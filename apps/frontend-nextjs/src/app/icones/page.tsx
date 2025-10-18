'use client';

import EducationalLayout from '@/components/layout/EducationalLayout';
import { getUnbColors } from '@/config/modernTheme';
import {
  PillIcon,
  StethoscopeIcon,
  HeartIcon,
  ShieldIcon,
  UserMedicalIcon,
  BookMedicalIcon,
  HospitalIcon,
  SyringeIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  InfoIcon,
  HomeIcon,
  BookOpenIcon,
  MessageCircleIcon,
  SettingsIcon,
  GraduationCapIcon,
  AwardIcon,
  CalculatorIcon,
  StarIcon,
  ChatBotMedicalIcon
} from '@/components/icons/MedicalIcons';
import { TargetIcon } from '@/components/icons/EducationalIcons';

export default function IconesPage() {
  const unbColors = getUnbColors();

  const medicalIcons = [
    { name: 'PillIcon', component: PillIcon, description: 'Medicamentos e pílulas' },
    { name: 'StethoscopeIcon', component: StethoscopeIcon, description: 'Exame médico e auscultação' },
    { name: 'HeartIcon', component: HeartIcon, description: 'Saúde cardiovascular' },
    { name: 'ShieldIcon', component: ShieldIcon, description: 'Proteção e segurança médica' },
    { name: 'UserMedicalIcon', component: UserMedicalIcon, description: 'Profissional de saúde' },
    { name: 'BookMedicalIcon', component: BookMedicalIcon, description: 'Documentação médica' },
    { name: 'HospitalIcon', component: HospitalIcon, description: 'Instituição hospitalar' },
    { name: 'SyringeIcon', component: SyringeIcon, description: 'Aplicação e vacinas' },
    { name: 'AlertTriangleIcon', component: AlertTriangleIcon, description: 'Alertas médicos' },
    { name: 'CheckCircleIcon', component: CheckCircleIcon, description: 'Confirmação e sucesso' },
    { name: 'ClockIcon', component: ClockIcon, description: 'Cronograma de tratamento' },
    { name: 'InfoIcon', component: InfoIcon, description: 'Informações gerais' },
    { name: 'HomeIcon', component: HomeIcon, description: 'Página inicial' },
    { name: 'BookOpenIcon', component: BookOpenIcon, description: 'Conteúdo educacional' },
    { name: 'MessageCircleIcon', component: MessageCircleIcon, description: 'Chat e comunicação' },
    { name: 'SettingsIcon', component: SettingsIcon, description: 'Configurações' },
    { name: 'GraduationCapIcon', component: GraduationCapIcon, description: 'Educação e capacitação' },
    { name: 'AwardIcon', component: AwardIcon, description: 'Conquistas e certificações' },
    { name: 'CalculatorIcon', component: CalculatorIcon, description: 'Cálculos médicos' },
    { name: 'StarIcon', component: StarIcon, description: 'Favoritos e destaque' },
    { name: 'ChatBotMedicalIcon', component: ChatBotMedicalIcon, description: 'Assistente virtual médico' }
  ];

  const categorizedIcons = {
    'Medicina e Tratamento': [
      'PillIcon', 'StethoscopeIcon', 'HeartIcon', 'SyringeIcon', 'HospitalIcon'
    ],
    'Segurança e Alertas': [
      'ShieldIcon', 'AlertTriangleIcon', 'CheckCircleIcon', 'InfoIcon'
    ],
    'Educação e Documentação': [
      'BookMedicalIcon', 'BookOpenIcon', 'GraduationCapIcon', 'AwardIcon'
    ],
    'Interface e Navegação': [
      'HomeIcon', 'SettingsIcon', 'ClockIcon', 'StarIcon', 'CalculatorIcon'
    ],
    'Comunicação e Suporte': [
      'UserMedicalIcon', 'MessageCircleIcon', 'ChatBotMedicalIcon'
    ]
  };

  return (
    <EducationalLayout>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        {/* Header */}
        <header style={{
          textAlign: 'center',
          marginBottom: '2rem',
          padding: '2rem',
          background: `linear-gradient(135deg, ${unbColors.primary} 0%, ${unbColors.secondary} 100%)`,
          borderRadius: '16px',
          color: 'white'
        }}>
          <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <TargetIcon size={40} color="white" /> Ícones Médicos
          </h1>
          <p style={{ margin: '1rem 0 0', fontSize: '1.2rem', opacity: 0.9 }}>
            Biblioteca SVG de ícones para interfaces médicas e educacionais
          </p>
        </header>

        {/* Showcase completo */}
        <section style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          marginBottom: '2rem'
        }}>
          <h2 style={{ margin: '0 0 1.5rem', color: unbColors.primary, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TargetIcon size={24} color={unbColors.primary} /> Showcase Completo
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '1.5rem'
          }}>
            {medicalIcons.map((icon) => {
              const IconComponent = icon.component;
              return (
                <div key={icon.name} style={{
                  padding: '1.5rem',
                  background: '#f8fafc',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f1f5f9';
                  e.currentTarget.style.borderColor = unbColors.primary;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f8fafc';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}>
                  <div style={{ marginBottom: '1rem' }}>
                    <IconComponent size={48} color={unbColors.primary} />
                  </div>
                  <h3 style={{
                    margin: '0 0 0.5rem',
                    fontSize: '1rem',
                    fontWeight: '600',
                    color: unbColors.primary
                  }}>
                    {icon.name}
                  </h3>
                  <p style={{
                    margin: 0,
                    fontSize: '0.85rem',
                    color: '#64748b',
                    lineHeight: '1.4'
                  }}>
                    {icon.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Ícones por categoria */}
        <section style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          marginBottom: '2rem'
        }}>
          <h2 style={{ margin: '0 0 1.5rem', color: unbColors.primary, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpenIcon size={24} color={unbColors.primary} /> Ícones por Categoria
          </h2>

          {Object.entries(categorizedIcons).map(([category, iconNames]) => (
            <div key={category} style={{ marginBottom: '2rem' }}>
              <h3 style={{
                margin: '0 0 1rem',
                color: unbColors.secondary,
                fontSize: '1.2rem',
                borderBottom: `2px solid ${unbColors.secondary}`,
                paddingBottom: '0.5rem'
              }}>
                {category}
              </h3>

              <div style={{
                display: 'flex',
                gap: '1rem',
                flexWrap: 'wrap',
                alignItems: 'center'
              }}>
                {iconNames.map((iconName) => {
                  const iconData = medicalIcons.find(icon => icon.name === iconName);
                  if (!iconData) return null;

                  const IconComponent = iconData.component;
                  return (
                    <div key={iconName} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.75rem 1rem',
                      background: '#f8fafc',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <IconComponent size={24} color={unbColors.primary} />
                      <span style={{ fontSize: '0.9rem', color: '#374151' }}>
                        {iconData.description}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </section>

        {/* Demonstração de tamanhos */}
        <section style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ margin: '0 0 1.5rem', color: unbColors.primary, fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CalculatorIcon size={24} color={unbColors.primary} /> Demonstração de Tamanhos
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem'
          }}>
            {[16, 24, 32, 48, 64].map((size) => (
              <div key={size} style={{
                padding: '1.5rem',
                background: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                textAlign: 'center'
              }}>
                <h3 style={{ margin: '0 0 1rem', color: unbColors.secondary }}>
                  {size}px
                </h3>
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '1rem',
                  flexWrap: 'wrap'
                }}>
                  <PillIcon size={size} color={unbColors.primary} />
                  <StethoscopeIcon size={size} color={unbColors.secondary} />
                  <HeartIcon size={size} color="#dc2626" />
                  <ShieldIcon size={size} color="#059669" />
                </div>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: '2rem',
            padding: '1rem',
            background: '#f0f9ff',
            borderRadius: '8px',
            border: '1px solid #bae6fd'
          }}>
            <p style={{ margin: 0, color: '#0c4a6e', fontSize: '0.9rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <InfoIcon size={16} color="#0c4a6e" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
              <span><strong>Dica:</strong> Todos os ícones são SVG escaláveis e responsivos.
              Eles suportam propriedades customizadas de tamanho, cor, className e style.</span>
            </p>
          </div>
        </section>
      </div>
    </EducationalLayout>
  );
}