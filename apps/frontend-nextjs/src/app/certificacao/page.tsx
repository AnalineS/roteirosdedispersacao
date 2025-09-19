'use client';

import { useState, useEffect } from 'react';
import EducationalLayout from '@/components/layout/EducationalLayout';
import CertificateGenerator from '@/components/interactive/Certification/CertificateGenerator';
import { Certificate, CertificationProgress, DEFAULT_CERTIFICATION_CONFIG } from '@/types/certification';
import { getUnbColors } from '@/config/modernTheme';
import {
  GraduationIcon,
  TrophyIcon,
  TargetIcon,
  CheckCircleIcon,
  ClockIcon,
  LockIcon,
  RefreshIcon,
  BookIcon
} from '@/components/icons/EducationalIcons';

export default function CertificacaoPage() {
  const unbColors = getUnbColors();
  const [progress, setProgress] = useState<CertificationProgress | null>(null);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCertificate, setShowCertificate] = useState(false);

  useEffect(() => {
    // Simular carregamento de dados do usuário
    const loadCertificationData = async () => {
      setIsLoading(true);

      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Dados mockados para demonstração
      const mockProgress: CertificationProgress = {
        userId: 'user-demo-001',
        userName: 'Usuário Demonstração',
        email: 'usuario@exemplo.com',
        startDate: new Date('2024-01-15'),
        lastActivity: new Date(),
        casesCompleted: [
          {
            caseId: 'caso-pediatrico-001',
            caseTitle: 'Dispensação PQT-U Pediátrica',
            category: 'pediatrico',
            difficulty: 'intermediario',
            score: 85,
            maxScore: 100,
            percentage: 85,
            timeSpent: 45,
            completionDate: new Date('2024-01-20'),
            attemptNumber: 1,
            stepResults: [
              { stepId: 'step1', stepTitle: 'Identificação do caso', score: 10, maxScore: 10, correct: true },
              { stepId: 'step2', stepTitle: 'Cálculo da dose', score: 8, maxScore: 10, correct: true }
            ],
            competencyScores: [
              { competency: 'Dosagem pediátrica', score: 85, maxScore: 100 }
            ]
          },
          {
            caseId: 'caso-adulto-001',
            caseTitle: 'Caso Clínico Adulto Padrão',
            category: 'adulto',
            difficulty: 'intermediario',
            score: 92,
            maxScore: 100,
            percentage: 92,
            timeSpent: 38,
            completionDate: new Date('2024-01-25'),
            attemptNumber: 1,
            stepResults: [
              { stepId: 'step1', stepTitle: 'Avaliação inicial', score: 10, maxScore: 10, correct: true },
              { stepId: 'step2', stepTitle: 'Orientação farmacêutica', score: 9, maxScore: 10, correct: true }
            ],
            competencyScores: [
              { competency: 'Orientação farmacêutica', score: 92, maxScore: 100 }
            ]
          },
          {
            caseId: 'caso-gravidez-001',
            caseTitle: 'Hanseníase na Gestação',
            category: 'gravidez',
            difficulty: 'avancado',
            score: 88,
            maxScore: 100,
            percentage: 88,
            timeSpent: 52,
            completionDate: new Date('2024-02-01'),
            attemptNumber: 2,
            stepResults: [
              { stepId: 'step1', stepTitle: 'Avaliação de risco', score: 8, maxScore: 10, correct: true },
              { stepId: 'step2', stepTitle: 'Segurança gestacional', score: 9, maxScore: 10, correct: true }
            ],
            competencyScores: [
              { competency: 'Segurança gestacional', score: 88, maxScore: 100 }
            ]
          },
          {
            caseId: 'caso-reacoes-001',
            caseTitle: 'Manejo de Reações Adversas',
            category: 'reacoes',
            difficulty: 'avancado',
            score: 90,
            maxScore: 100,
            percentage: 90,
            timeSpent: 41,
            completionDate: new Date('2024-02-05'),
            attemptNumber: 1,
            stepResults: [
              { stepId: 'step1', stepTitle: 'Identificação de reações', score: 10, maxScore: 10, correct: true },
              { stepId: 'step2', stepTitle: 'Manejo clínico', score: 8, maxScore: 10, correct: true }
            ],
            competencyScores: [
              { competency: 'Manejo de reações adversas', score: 90, maxScore: 100 }
            ]
          }
        ],
        totalScore: 355,
        averageScore: 88.75,
        totalTimeSpent: 176, // minutos
        certificationStatus: 'eligible',
        strengthAreas: [
          'Protocolos de dispensação',
          'Orientação farmacêutica',
          'Identificação de reações adversas'
        ],
        improvementAreas: [
          'Casos complexos',
          'Interações medicamentosas'
        ],
        recommendedCases: [
          'Caso de polifarmácia complexa'
        ]
      };

      setProgress(mockProgress);

      // Se elegível para certificação, gerar certificado
      if (mockProgress.certificationStatus === 'eligible') {
        const mockCertificate: Certificate = {
          id: `cert-${Date.now()}`,
          userId: mockProgress.userId,
          recipientName: mockProgress.userName,
          recipientEmail: mockProgress.email,
          issueDate: new Date(),
          programTitle: DEFAULT_CERTIFICATION_CONFIG.programInfo.title,
          programDescription: DEFAULT_CERTIFICATION_CONFIG.programInfo.description,
          totalHours: DEFAULT_CERTIFICATION_CONFIG.criteria.totalHours,
          supervisorName: DEFAULT_CERTIFICATION_CONFIG.supervision.supervisorName,
          institution: DEFAULT_CERTIFICATION_CONFIG.institution.name,
          researchTitle: 'Tese de Doutorado em Ciências Farmacêuticas - Roteiros de Dispensação',
          overallScore: Math.round(mockProgress.averageScore),
          casesCompleted: mockProgress.casesCompleted.length,
          totalCases: 5,
          competenciesAchieved: [
            'Dispensação farmacêutica especializada em hanseníase',
            'Orientação sobre esquema PQT-U',
            'Identificação e manejo de reações adversas',
            'Protocolos de seguimento farmacoterapêutico',
            'Comunicação farmacêutico-paciente'
          ],
          verificationCode: `VERIFY-${Date.now().toString(36).toUpperCase()}`,
          qrCodeData: `https://roteirosdedispensacao.com/verify/cert-${Date.now()}`,
          template: {
            type: 'completion',
            layout: 'academic',
            backgroundColor: '#ffffff',
            accentColor: unbColors.primary,
            headerText: 'CERTIFICADO DE CONCLUSÃO',
            bodyTemplate: `concluiu com êxito o programa "{programTitle}", com carga horária de {totalHours} horas, obtendo aproveitamento de {overallScore}% na avaliação final.

O programa foi desenvolvido com base na tese de doutorado "{researchTitle}", sob supervisão de {supervisorName}, no {institutionName}.

Durante o programa, o participante demonstrou competência em:
• Dispensação farmacêutica especializada para hanseníase
• Aplicação de protocolos PQT-U (Poliquimioterapia Única)
• Orientação sobre adesão ao tratamento
• Identificação e manejo de reações adversas
• Seguimento farmacoterapêutico especializado

Conclusão realizada em {issueDate}, com {casesCompleted} casos clínicos resolvidos de um total de {totalCases} disponíveis.`,
            footerText: 'Este certificado atesta a conclusão do programa educacional baseado em evidências científicas e protocolos do Ministério da Saúde.',
            includeGrade: true,
            includeHours: true,
            includeCompetencies: true,
            includeVerification: true
          },
          customization: {
            includePhoto: false,
            includeSupervisorSignature: true,
            includeInstitutionSeal: true,
            includeQRCode: true,
            language: 'pt-BR',
            format: 'A4',
            orientation: 'portrait',
            formats: ['pdf', 'png'],
            resolution: 'high'
          }
        };

        setCertificate(mockCertificate);
      }

      setIsLoading(false);
    };

    loadCertificationData();
  }, [unbColors.primary]);

  const criteria = DEFAULT_CERTIFICATION_CONFIG.criteria;

  const handleDownload = (format: 'pdf' | 'png') => {
    // Track certificate download in analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'certificate_download', {
        event_category: 'certification',
        event_label: format,
        value: 1
      });
    }
  };

  const handleEmail = (email: string) => {
    // Track certificate email sending
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'certificate_email_sent', {
        event_category: 'certification',
        event_label: 'email_delivery'
      });
    }
  };

  const handleShare = () => {
    // Track certificate sharing
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'certificate_shared', {
        event_category: 'certification',
        event_label: 'social_share'
      });
    }
  };

  if (isLoading) {
    return (
      <EducationalLayout>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          textAlign: 'center'
        }}>
          <RefreshIcon size={48} color={unbColors.primary} />
          <h2 style={{ marginTop: '1rem', color: unbColors.primary }}>
            Carregando informações de certificação...
          </h2>
          <p style={{ color: '#64748b', maxWidth: '400px', marginTop: '0.5rem' }}>
            Verificando seu progresso e elegibilidade para certificação
          </p>
        </div>
      </EducationalLayout>
    );
  }

  if (showCertificate && certificate) {
    return (
      <EducationalLayout>
        <CertificateGenerator
          certificate={certificate}
          onDownload={handleDownload}
          onEmail={handleEmail}
          onShare={handleShare}
        />
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <button
            onClick={() => setShowCertificate(false)}
            style={{
              padding: '12px 24px',
              background: 'transparent',
              color: unbColors.primary,
              border: `1px solid ${unbColors.primary}`,
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            ← Voltar para Progresso
          </button>
        </div>
      </EducationalLayout>
    );
  }

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
          <h1 style={{
            margin: 0,
            fontSize: '2.5rem',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}>
            <GraduationIcon size={40} color="white" /> Certificação Educacional
          </h1>
          <p style={{ margin: '1rem 0 0', fontSize: '1.2rem', opacity: 0.9 }}>
            {DEFAULT_CERTIFICATION_CONFIG.programInfo.title}
          </p>
        </header>

        {/* Progress Overview */}
        {progress && (
          <section style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            marginBottom: '2rem'
          }}>
            <h2 style={{
              margin: '0 0 1.5rem',
              color: unbColors.primary,
              fontSize: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <TargetIcon size={24} color={unbColors.primary} /> Seu Progresso
            </h2>

            {/* Status Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              <div style={{
                padding: '1.5rem',
                background: progress.certificationStatus === 'eligible' ? '#dcfce7' : '#f3f4f6',
                borderRadius: '12px',
                textAlign: 'center',
                border: `2px solid ${progress.certificationStatus === 'eligible' ? '#16a34a' : '#d1d5db'}`
              }}>
                <div style={{ marginBottom: '0.5rem' }}>
                  {progress.certificationStatus === 'eligible' ? (
                    <CheckCircleIcon size={32} color="#16a34a" />
                  ) : (
                    <ClockIcon size={32} color="#6b7280" />
                  )}
                </div>
                <h3 style={{
                  margin: '0 0 0.5rem',
                  fontSize: '1.1rem',
                  color: progress.certificationStatus === 'eligible' ? '#16a34a' : '#374151'
                }}>
                  {progress.certificationStatus === 'eligible' ? 'Elegível para Certificação!' : 'Em Progresso'}
                </h3>
                <p style={{
                  margin: 0,
                  fontSize: '0.9rem',
                  color: progress.certificationStatus === 'eligible' ? '#15803d' : '#6b7280'
                }}>
                  {progress.certificationStatus === 'eligible'
                    ? 'Você atendeu todos os critérios'
                    : 'Continue completando os casos'}
                </p>
              </div>

              <div style={{
                padding: '1.5rem',
                background: '#f0f9ff',
                borderRadius: '12px',
                textAlign: 'center',
                border: '2px solid #0ea5e9'
              }}>
                <TrophyIcon size={32} color="#0ea5e9" />
                <h3 style={{ margin: '0.5rem 0', fontSize: '1.1rem', color: '#0c4a6e' }}>
                  {Math.round(progress.averageScore)}%
                </h3>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#075985' }}>
                  Pontuação Média
                </p>
              </div>

              <div style={{
                padding: '1.5rem',
                background: '#fefce8',
                borderRadius: '12px',
                textAlign: 'center',
                border: '2px solid #eab308'
              }}>
                <BookIcon size={32} color="#eab308" />
                <h3 style={{ margin: '0.5rem 0', fontSize: '1.1rem', color: '#713f12' }}>
                  {progress.casesCompleted.length}/{criteria.requiredCompletions}
                </h3>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#a16207' }}>
                  Casos Concluídos
                </p>
              </div>

              <div style={{
                padding: '1.5rem',
                background: '#fdf2f8',
                borderRadius: '12px',
                textAlign: 'center',
                border: '2px solid #ec4899'
              }}>
                <ClockIcon size={32} color="#ec4899" />
                <h3 style={{ margin: '0.5rem 0', fontSize: '1.1rem', color: '#831843' }}>
                  {Math.round(progress.totalTimeSpent / 60)}h
                </h3>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#be185d' }}>
                  Tempo Dedicado
                </p>
              </div>
            </div>

            {/* Certification Button */}
            {progress.certificationStatus === 'eligible' && (
              <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                <button
                  onClick={() => setShowCertificate(true)}
                  style={{
                    padding: '16px 32px',
                    background: `linear-gradient(135deg, ${unbColors.primary}, ${unbColors.secondary})`,
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <GraduationIcon size={20} color="white" />
                  Gerar Meu Certificado
                </button>
              </div>
            )}
          </section>
        )}

        {/* Requirements */}
        <section style={{
          background: 'white',
          padding: '2rem',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          marginBottom: '2rem'
        }}>
          <h3 style={{
            margin: '0 0 1.5rem',
            color: unbColors.primary,
            fontSize: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <LockIcon size={20} color={unbColors.primary} /> Critérios de Certificação
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1rem'
          }}>
            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 0.5rem', color: '#1e293b' }}>Pontuação Mínima</h4>
              <p style={{ margin: 0, color: '#64748b' }}>
                Obter pelo menos <strong>{criteria.minimumScore}%</strong> de aproveitamento médio
              </p>
            </div>

            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 0.5rem', color: '#1e293b' }}>Casos Obrigatórios</h4>
              <p style={{ margin: 0, color: '#64748b' }}>
                Completar <strong>{criteria.requiredCompletions} casos</strong> clínicos diferentes
              </p>
            </div>

            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 0.5rem', color: '#1e293b' }}>Carga Horária</h4>
              <p style={{ margin: 0, color: '#64748b' }}>
                Mínimo de <strong>{criteria.totalHours} horas</strong> de dedicação total
              </p>
            </div>

            <div style={{ padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
              <h4 style={{ margin: '0 0 0.5rem', color: '#1e293b' }}>Categorias</h4>
              <p style={{ margin: 0, color: '#64748b' }}>
                Completar casos das categorias: <strong>{criteria.requiredCategories.join(', ')}</strong>
              </p>
            </div>
          </div>
        </section>

        {/* Completed Cases */}
        {progress && progress.casesCompleted.length > 0 && (
          <section style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{
              margin: '0 0 1.5rem',
              color: unbColors.primary,
              fontSize: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <CheckCircleIcon size={20} color={unbColors.primary} /> Casos Concluídos
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {progress.casesCompleted.map((case_) => (
                <div key={case_.caseId} style={{
                  padding: '1rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  display: 'grid',
                  gridTemplateColumns: '1fr auto auto',
                  alignItems: 'center',
                  gap: '1rem'
                }}>
                  <div>
                    <h4 style={{ margin: '0 0 0.25rem', color: '#1e293b' }}>
                      {case_.caseTitle}
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
                      {case_.category.charAt(0).toUpperCase() + case_.category.slice(1)} • {case_.difficulty}
                    </p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      fontSize: '1.125rem',
                      fontWeight: 'bold',
                      color: case_.percentage >= 80 ? '#16a34a' : '#ea580c'
                    }}>
                      {case_.percentage}%
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {case_.timeSpent}min
                    </div>
                  </div>
                  <CheckCircleIcon size={20} color="#16a34a" />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </EducationalLayout>
  );
}