'use client';

import React, { useState, useRef } from 'react';
import { Certificate, CertificateTemplate, DEFAULT_CERTIFICATION_CONFIG } from '@/types/certification';
import { modernChatTheme } from '@/config/modernTheme';
import {
  TrophyIcon,
  CheckCircleIcon,
  FileDownloadIcon,
  MailIcon,
  SearchIcon,
  TargetIcon,
  GraduationIcon,
  LockIcon,
  BookIcon,
  ClockIcon,
  RefreshIcon
} from '@/components/icons/EducationalIcons';
// TODO: Import PersonaEducationalAvatar when available
// import { PersonaEducationalAvatar } from '@/components/educational/PersonaEducationalAvatar';

interface CertificateGeneratorProps {
  certificate: Certificate;
  onDownload?: (format: 'pdf' | 'png') => void;
  onEmail?: (email: string) => void;
  onShare?: () => void;
  isPreview?: boolean;
}

export default function CertificateGenerator({
  certificate,
  onDownload,
  onEmail,
  onShare,
  isPreview = false
}: CertificateGeneratorProps) {
  const [emailAddress, setEmailAddress] = useState(certificate.recipientEmail || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const certificateRef = useRef<HTMLDivElement>(null);

  const handleDownload = async (format: 'pdf' | 'png') => {
    setIsGenerating(true);
    try {
      // Simular geração do certificado
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (format === 'pdf') {
        // TODO: Implementar geração real de PDF
        // Por enquanto, simular download
        const element = document.createElement('a');
        element.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(generatePlainTextCertificate(certificate));
        element.download = `certificado-${certificate.id}.txt`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
      } else {
        // TODO: Implementar captura de imagem
        alert('Funcionalidade de PNG será implementada em breve!');
      }
      
      onDownload?.(format);
    } catch (error) {
      console.error('Erro ao gerar certificado:', error);
      alert('Erro ao gerar certificado. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEmailSend = async () => {
    if (!emailAddress) return;
    
    setIsGenerating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      // TODO: Implementar envio real via EmailJS
      console.log('Enviando certificado para:', emailAddress);
      alert(`Certificado enviado para ${emailAddress} com sucesso!`);
      setShowEmailModal(false);
      onEmail?.(emailAddress);
    } catch (error) {
      console.error('Erro ao enviar certificado:', error);
      alert('Erro ao enviar certificado. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={{
      maxWidth: '900px',
      margin: '0 auto',
      padding: modernChatTheme.spacing.lg
    }}>
      {/* Header */}
      {!isPreview && (
        <div style={{
          textAlign: 'center',
          marginBottom: modernChatTheme.spacing.xl,
          padding: modernChatTheme.spacing.lg,
          background: `linear-gradient(135deg, ${modernChatTheme.colors.personas.gasnelio.primary}15, ${modernChatTheme.colors.personas.ga.primary}15)`,
          borderRadius: modernChatTheme.borderRadius.lg,
          border: `1px solid ${modernChatTheme.colors.neutral.border}`
        }}>
          {/* Header celebrativo com personas */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: modernChatTheme.spacing.lg,
            marginBottom: modernChatTheme.spacing.md
          }}>
            {/* TODO: Adicionar PersonaEducationalAvatar do Dr. Gasnelio */}
            <div style={{ textAlign: 'center' }}>
              <TrophyIcon size={48} color={modernChatTheme.colors.status.success} />
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                gap: modernChatTheme.spacing.xs,
                marginTop: modernChatTheme.spacing.xs
              }}>
                {/* Estrelas de celebração */}
                <TargetIcon size={20} color={modernChatTheme.colors.status.warning} />
                <TargetIcon size={24} color={modernChatTheme.colors.status.warning} />
                <TargetIcon size={20} color={modernChatTheme.colors.status.warning} />
              </div>
            </div>
            {/* TODO: Adicionar PersonaEducationalAvatar da Gá */}
          </div>
          <h1 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: modernChatTheme.colors.neutral.text,
            marginBottom: modernChatTheme.spacing.sm
          }}>
            Parabéns! Certificação Concluída
          </h1>
          <p style={{
            fontSize: modernChatTheme.typography.persona.fontSize,
            color: modernChatTheme.colors.neutral.textMuted,
            marginBottom: modernChatTheme.spacing.md
          }}>
            Você concluiu com sucesso o programa de capacitação em dispensação farmacêutica para hanseníase
          </p>
          
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: modernChatTheme.spacing.sm,
            padding: `${modernChatTheme.spacing.sm} ${modernChatTheme.spacing.lg}`,
            background: modernChatTheme.colors.status.success + '15',
            border: `1px solid ${modernChatTheme.colors.status.success}30`,
            borderRadius: modernChatTheme.borderRadius.md,
            fontSize: '14px',
            fontWeight: '600',
            color: modernChatTheme.colors.status.success
          }}>
            <CheckCircleIcon size={18} color="currentColor" /> <span>CERTIFICADO OFICIAL</span> • ID: {certificate.id}
          </div>
        </div>
      )}

      {/* Certificate Display */}
      <div
        ref={certificateRef}
        style={{
          background: 'white',
          boxShadow: modernChatTheme.shadows.emphasis,
          borderRadius: modernChatTheme.borderRadius.lg,
          overflow: 'hidden',
          marginBottom: modernChatTheme.spacing.xl
        }}
      >
        <CertificateLayout certificate={certificate} />
      </div>

      {/* Action Buttons */}
      {!isPreview && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: modernChatTheme.spacing.lg,
          marginBottom: modernChatTheme.spacing.xl
        }}>
          {/* Download PDF */}
          <div style={{
            padding: modernChatTheme.spacing.lg,
            background: 'white',
            border: `1px solid ${modernChatTheme.colors.neutral.border}`,
            borderRadius: modernChatTheme.borderRadius.md,
            boxShadow: modernChatTheme.shadows.subtle,
            textAlign: 'center'
          }}>
            <div style={{ marginBottom: modernChatTheme.spacing.md, display: 'flex', justifyContent: 'center' }}>
              <FileDownloadIcon size={32} color={modernChatTheme.colors.personas.gasnelio.primary} />
            </div>
            <h3 style={{
              fontSize: modernChatTheme.typography.persona.fontSize,
              fontWeight: '600',
              color: modernChatTheme.colors.neutral.text,
              marginBottom: modernChatTheme.spacing.sm
            }}>
              Download PDF
            </h3>
            <p style={{
              fontSize: '12px',
              color: modernChatTheme.colors.neutral.textMuted,
              marginBottom: modernChatTheme.spacing.md,
              lineHeight: '1.4'
            }}>
              Baixe seu certificado em formato PDF para impressão ou arquivamento digital
            </p>
            <button
              onClick={() => handleDownload('pdf')}
              disabled={isGenerating}
              style={{
                width: '100%',
                padding: modernChatTheme.spacing.md,
                background: modernChatTheme.colors.personas.gasnelio.primary,
                color: 'white',
                border: 'none',
                borderRadius: modernChatTheme.borderRadius.md,
                fontSize: '14px',
                fontWeight: '600',
                cursor: isGenerating ? 'wait' : 'pointer',
                opacity: isGenerating ? 0.7 : 1
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: modernChatTheme.spacing.xs, justifyContent: 'center' }}>
                {isGenerating ? (
                  <>
                    <RefreshIcon size={16} color="currentColor" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <FileDownloadIcon size={16} color="currentColor" />
                    Baixar PDF
                  </>
                )}
              </div>
            </button>
          </div>

          {/* Send Email */}
          <div style={{
            padding: modernChatTheme.spacing.lg,
            background: 'white',
            border: `1px solid ${modernChatTheme.colors.neutral.border}`,
            borderRadius: modernChatTheme.borderRadius.md,
            boxShadow: modernChatTheme.shadows.subtle,
            textAlign: 'center'
          }}>
            <div style={{ marginBottom: modernChatTheme.spacing.md, display: 'flex', justifyContent: 'center' }}>
              <MailIcon size={32} color={modernChatTheme.colors.personas.ga.primary} />
            </div>
            <h3 style={{
              fontSize: modernChatTheme.typography.persona.fontSize,
              fontWeight: '600',
              color: modernChatTheme.colors.neutral.text,
              marginBottom: modernChatTheme.spacing.sm
            }}>
              Enviar por Email
            </h3>
            <p style={{
              fontSize: '12px',
              color: modernChatTheme.colors.neutral.textMuted,
              marginBottom: modernChatTheme.spacing.md,
              lineHeight: '1.4'
            }}>
              Receba o certificado diretamente no seu email ou envie para outra pessoa
            </p>
            <button
              onClick={() => setShowEmailModal(true)}
              style={{
                width: '100%',
                padding: modernChatTheme.spacing.md,
                background: modernChatTheme.colors.personas.ga.primary,
                color: 'white',
                border: 'none',
                borderRadius: modernChatTheme.borderRadius.md,
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: modernChatTheme.spacing.xs, justifyContent: 'center' }}>
                <MailIcon size={16} color="currentColor" />
                Enviar Email
              </div>
            </button>
          </div>

          {/* Share */}
          <div style={{
            padding: modernChatTheme.spacing.lg,
            background: 'white',
            border: `1px solid ${modernChatTheme.colors.neutral.border}`,
            borderRadius: modernChatTheme.borderRadius.md,
            boxShadow: modernChatTheme.shadows.subtle,
            textAlign: 'center'
          }}>
            <div style={{ marginBottom: modernChatTheme.spacing.md, display: 'flex', justifyContent: 'center' }}>
              <TargetIcon size={32} color={modernChatTheme.colors.status.info} />
            </div>
            <h3 style={{
              fontSize: modernChatTheme.typography.persona.fontSize,
              fontWeight: '600',
              color: modernChatTheme.colors.neutral.text,
              marginBottom: modernChatTheme.spacing.sm
            }}>
              Compartilhar
            </h3>
            <p style={{
              fontSize: '12px',
              color: modernChatTheme.colors.neutral.textMuted,
              marginBottom: modernChatTheme.spacing.md,
              lineHeight: '1.4'
            }}>
              Compartilhe sua conquista em redes sociais ou com colegas
            </p>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: 'Certificação em Dispensação Farmacêutica - Hanseníase',
                    text: `Concluí a certificação em Dispensação Farmacêutica para Hanseníase PQT-U com ${certificate.overallScore}% de aproveitamento!`,
                    url: window.location.href
                  });
                } else {
                  const text = `Certificação concluída: ${certificate.programTitle}\nPontuação: ${certificate.overallScore}%\nVerificação: ${DEFAULT_CERTIFICATION_CONFIG.verification.baseUrl}/${certificate.verificationCode}`;
                  navigator.clipboard.writeText(text);
                  alert('Link copiado para área de transferência!');
                }
                onShare?.();
              }}
              style={{
                width: '100%',
                padding: modernChatTheme.spacing.md,
                background: modernChatTheme.colors.status.info,
                color: 'white',
                border: 'none',
                borderRadius: modernChatTheme.borderRadius.md,
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: modernChatTheme.spacing.xs, justifyContent: 'center' }}>
                <TargetIcon size={16} color="currentColor" />
                Compartilhar
              </div>
            </button>
          </div>

          {/* Verification */}
          <div style={{
            padding: modernChatTheme.spacing.lg,
            background: 'white',
            border: `1px solid ${modernChatTheme.colors.neutral.border}`,
            borderRadius: modernChatTheme.borderRadius.md,
            boxShadow: modernChatTheme.shadows.subtle,
            textAlign: 'center'
          }}>
            <div style={{ marginBottom: modernChatTheme.spacing.md, display: 'flex', justifyContent: 'center' }}>
              <SearchIcon size={32} color={modernChatTheme.colors.neutral.text} />
            </div>
            <h3 style={{
              fontSize: modernChatTheme.typography.persona.fontSize,
              fontWeight: '600',
              color: modernChatTheme.colors.neutral.text,
              marginBottom: modernChatTheme.spacing.sm
            }}>
              Verificação
            </h3>
            <p style={{
              fontSize: '12px',
              color: modernChatTheme.colors.neutral.textMuted,
              marginBottom: modernChatTheme.spacing.md,
              lineHeight: '1.4'
            }}>
              Código para verificação da autenticidade do certificado
            </p>
            <div style={{
              padding: modernChatTheme.spacing.sm,
              background: modernChatTheme.colors.background.secondary,
              borderRadius: modernChatTheme.borderRadius.sm,
              fontSize: '14px',
              fontWeight: '600',
              color: modernChatTheme.colors.neutral.text,
              fontFamily: 'monospace',
              marginBottom: modernChatTheme.spacing.sm
            }}>
              {certificate.verificationCode}
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(certificate.verificationCode);
                alert('Código copiado!');
              }}
              style={{
                width: '100%',
                padding: `${modernChatTheme.spacing.sm} ${modernChatTheme.spacing.md}`,
                background: 'transparent',
                color: modernChatTheme.colors.neutral.textMuted,
                border: `1px solid ${modernChatTheme.colors.neutral.border}`,
                borderRadius: modernChatTheme.borderRadius.sm,
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: modernChatTheme.spacing.xs, justifyContent: 'center' }}>
                <BookIcon size={12} color="currentColor" />
                Copiar Código
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Certificate Details */}
      <div style={{
        background: 'white',
        padding: modernChatTheme.spacing.xl,
        borderRadius: modernChatTheme.borderRadius.lg,
        border: `1px solid ${modernChatTheme.colors.neutral.border}`,
        boxShadow: modernChatTheme.shadows.subtle
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: modernChatTheme.colors.neutral.text,
          marginBottom: modernChatTheme.spacing.lg,
          textAlign: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: modernChatTheme.spacing.xs, justifyContent: 'center' }}>
            <BookIcon size={18} color="currentColor" />
            Detalhes da Certificação
          </div>
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: modernChatTheme.spacing.lg
        }}>
          <div>
            <h4 style={{
              fontSize: '14px',
              fontWeight: '600',
              color: modernChatTheme.colors.neutral.text,
              marginBottom: modernChatTheme.spacing.sm
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: modernChatTheme.spacing.xs }}>
                <TargetIcon size={16} color="currentColor" />
                Performance Alcançada
              </div>
            </h4>
            <div style={{ fontSize: '13px', color: modernChatTheme.colors.neutral.textMuted, lineHeight: '1.5' }}>
              <div>• Pontuação final: <strong>{certificate.overallScore}%</strong></div>
              <div>• Casos concluídos: <strong>{certificate.casesCompleted}/{certificate.totalCases}</strong></div>
              <div>• Carga horária: <strong>{certificate.totalHours}h</strong></div>
              <div>• Data de conclusão: <strong>{certificate.issueDate.toLocaleDateString('pt-BR')}</strong></div>
            </div>
          </div>

          <div>
            <h4 style={{
              fontSize: '14px',
              fontWeight: '600',
              color: modernChatTheme.colors.neutral.text,
              marginBottom: modernChatTheme.spacing.sm
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: modernChatTheme.spacing.xs }}>
                <TrophyIcon size={16} color="currentColor" />
                Competências Desenvolvidas
              </div>
            </h4>
            <div style={{ fontSize: '13px', color: modernChatTheme.colors.neutral.textMuted, lineHeight: '1.5' }}>
              {certificate.competenciesAchieved.slice(0, 4).map((competency, index) => (
                <div key={index}>• {competency}</div>
              ))}
              {certificate.competenciesAchieved.length > 4 && (
                <div style={{ fontStyle: 'italic' }}>... e mais {certificate.competenciesAchieved.length - 4} competências</div>
              )}
            </div>
          </div>

          <div>
            <h4 style={{
              fontSize: '14px',
              fontWeight: '600',
              color: modernChatTheme.colors.neutral.text,
              marginBottom: modernChatTheme.spacing.sm
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: modernChatTheme.spacing.xs }}>
                <GraduationIcon size={16} color="currentColor" />
                Supervisão Acadêmica
              </div>
            </h4>
            <div style={{ fontSize: '13px', color: modernChatTheme.colors.neutral.textMuted, lineHeight: '1.5' }}>
              <div>• <strong>{DEFAULT_CERTIFICATION_CONFIG.supervision.supervisorName}</strong></div>
              <div>• {DEFAULT_CERTIFICATION_CONFIG.supervision.supervisorTitle}</div>
              <div>• {DEFAULT_CERTIFICATION_CONFIG.supervision.supervisorInstitution}</div>
            </div>
          </div>

          <div>
            <h4 style={{
              fontSize: '14px',
              fontWeight: '600',
              color: modernChatTheme.colors.neutral.text,
              marginBottom: modernChatTheme.spacing.sm
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: modernChatTheme.spacing.xs }}>
                <LockIcon size={16} color="currentColor" />
                Verificação e Segurança
              </div>
            </h4>
            <div style={{ fontSize: '13px', color: modernChatTheme.colors.neutral.textMuted, lineHeight: '1.5' }}>
              <div>• ID do certificado: <code style={{ background: modernChatTheme.colors.background.secondary, padding: '2px 4px', borderRadius: '2px' }}>{certificate.id}</code></div>
              <div>• Código de verificação: <code style={{ background: modernChatTheme.colors.background.secondary, padding: '2px 4px', borderRadius: '2px' }}>{certificate.verificationCode}</code></div>
              <div>• URL de verificação: <a href={`${DEFAULT_CERTIFICATION_CONFIG.verification.baseUrl}/${certificate.verificationCode}`} target="_blank" style={{ color: modernChatTheme.colors.personas.gasnelio.primary }}>Verificar autenticidade</a></div>
            </div>
          </div>
        </div>
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <EmailModal
          initialEmail={emailAddress}
          onSend={handleEmailSend}
          onClose={() => setShowEmailModal(false)}
          isLoading={isGenerating}
        />
      )}
    </div>
  );
}

// Certificate Layout Component
function CertificateLayout({ certificate }: { certificate: Certificate }) {
  const template = certificate.template;
  const config = DEFAULT_CERTIFICATION_CONFIG;

  const replaceTemplateVariables = (text: string): string => {
    return text
      .replace(/{recipientName}/g, certificate.recipientName)
      .replace(/{supervisorName}/g, config.supervision.supervisorName)
      .replace(/{totalHours}/g, certificate.totalHours.toString())
      .replace(/{overallScore}/g, certificate.overallScore.toString())
      .replace(/{casesCompleted}/g, certificate.casesCompleted.toString())
      .replace(/{totalCases}/g, certificate.totalCases.toString())
      .replace(/{issueDate}/g, certificate.issueDate.toLocaleDateString('pt-BR'))
      .replace(/{programTitle}/g, certificate.programTitle)
      .replace(/{institutionName}/g, config.institution.name);
  };

  return (
    <div style={{
      width: '210mm', // A4 width
      minHeight: '297mm', // A4 height
      margin: '0 auto',
      padding: '20mm',
      background: template.backgroundColor,
      color: '#333333',
      fontFamily: 'serif',
      lineHeight: '1.6',
      position: 'relative',
      boxSizing: 'border-box'
    }}>
      {/* Decorative Border */}
      <div style={{
        position: 'absolute',
        top: '15mm',
        left: '15mm',
        right: '15mm',
        bottom: '15mm',
        border: `3px solid ${template.accentColor}`,
        borderRadius: '8px'
      }}>
        <div style={{
          position: 'absolute',
          top: '5mm',
          left: '5mm',
          right: '5mm',
          bottom: '5mm',
          border: `1px solid ${template.accentColor}`,
          borderRadius: '4px'
        }} />
      </div>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '30mm' }}>
        {template.logoUrl && (
          <div style={{ marginBottom: '20mm' }}>
            <div style={{
              width: '80px',
              height: '80px',
              background: template.accentColor + '20',
              borderRadius: '50%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '10mm'
            }}>
              <GraduationIcon size={48} color={modernChatTheme.colors.personas.gasnelio.primary} />
            </div>
          </div>
        )}
        
        <h1 style={{
          fontSize: '28pt',
          fontWeight: 'bold',
          color: template.accentColor,
          marginBottom: '5mm',
          textTransform: 'uppercase',
          letterSpacing: '2px'
        }}>
          {template.headerText}
        </h1>
        
        <div style={{
          fontSize: '14pt',
          color: '#666',
          marginBottom: '15mm'
        }}>
          {config.institution.name}<br/>
          {config.institution.department}
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        fontSize: '14pt',
        textAlign: 'center',
        marginBottom: '20mm',
        lineHeight: '1.8'
      }}>
        <div style={{
          fontSize: '16pt',
          marginBottom: '10mm',
          color: '#333'
        }}>
          Certificamos que
        </div>
        
        <div style={{
          fontSize: '22pt',
          fontWeight: 'bold',
          color: template.accentColor,
          marginBottom: '15mm',
          borderBottom: `2px solid ${template.accentColor}`,
          paddingBottom: '5mm',
          display: 'inline-block',
          minWidth: '60%'
        }}>
          {certificate.recipientName.toUpperCase()}
        </div>
        
        <div style={{
          fontSize: '13pt',
          textAlign: 'justify',
          marginBottom: '15mm',
          maxWidth: '160mm',
          margin: '0 auto 15mm auto'
        }}>
          {replaceTemplateVariables(template.bodyTemplate).split('\n').map((paragraph, index) => (
            <p key={index} style={{ marginBottom: '8mm' }}>
              {paragraph.startsWith('•') ? (
                <span style={{ display: 'block', marginLeft: '10mm', textIndent: '-10mm' }}>
                  {paragraph}
                </span>
              ) : (
                paragraph
              )}
            </p>
          ))}
        </div>
      </div>

      {/* Performance Summary */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        marginBottom: '20mm',
        fontSize: '12pt'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 'bold', color: template.accentColor, fontSize: '16pt' }}>
            {certificate.overallScore}%
          </div>
          <div style={{ color: '#666' }}>Aproveitamento</div>
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 'bold', color: template.accentColor, fontSize: '16pt' }}>
            {certificate.totalHours}h
          </div>
          <div style={{ color: '#666' }}>Carga Horária</div>
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontWeight: 'bold', color: template.accentColor, fontSize: '16pt' }}>
            {certificate.casesCompleted}
          </div>
          <div style={{ color: '#666' }}>Casos Concluídos</div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        position: 'absolute',
        bottom: '30mm',
        left: '30mm',
        right: '30mm'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginBottom: '15mm'
        }}>
          <div style={{ textAlign: 'center', minWidth: '60mm' }}>
            <div style={{
              borderTop: `1px solid ${template.accentColor}`,
              marginBottom: '3mm',
              paddingTop: '3mm'
            }}>
              <strong>{config.supervision.supervisorName}</strong><br/>
              <span style={{ fontSize: '11pt', color: '#666' }}>
                {config.supervision.supervisorTitle}
              </span>
            </div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '40mm',
              height: '40mm',
              border: `1px solid ${template.accentColor}`,
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '8pt',
              color: '#666'
            }}>
              {/* QR Code Placeholder */}
              <div style={{ textAlign: 'center' }}>
                <div style={{ marginBottom: '2mm', display: 'flex', justifyContent: 'center' }}>
                  <SearchIcon size={24} color={modernChatTheme.colors.neutral.textMuted} />
                </div>
                <div>Verificar<br/>autenticidade</div>
              </div>
            </div>
          </div>
        </div>
        
        <div style={{
          textAlign: 'center',
          fontSize: '11pt',
          color: '#666',
          borderTop: `1px solid ${template.accentColor}`,
          paddingTop: '5mm'
        }}>
          {template.footerText}<br/>
          <span style={{ fontSize: '10pt' }}>
            Certificado emitido em {certificate.issueDate.toLocaleDateString('pt-BR')} | 
            Código de verificação: {certificate.verificationCode}
          </span>
        </div>
      </div>
    </div>
  );
}

// Email Modal Component
function EmailModal({ 
  initialEmail, 
  onSend, 
  onClose, 
  isLoading 
}: { 
  initialEmail: string; 
  onSend: (email: string) => void; 
  onClose: () => void; 
  isLoading: boolean; 
}) {
  const [email, setEmail] = useState(initialEmail);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: modernChatTheme.zIndex.modal
    }}>
      <div style={{
        background: 'white',
        padding: modernChatTheme.spacing.xl,
        borderRadius: modernChatTheme.borderRadius.lg,
        maxWidth: '400px',
        width: '90%'
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          color: modernChatTheme.colors.neutral.text,
          marginBottom: modernChatTheme.spacing.lg,
          textAlign: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: modernChatTheme.spacing.xs, justifyContent: 'center' }}>
            <MailIcon size={18} color="currentColor" />
            Enviar Certificado por Email
          </div>
        </h3>
        
        <div style={{ marginBottom: modernChatTheme.spacing.lg }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: modernChatTheme.colors.neutral.text,
            marginBottom: modernChatTheme.spacing.sm
          }}>
            Endereço de email:
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="exemplo@email.com"
            style={{
              width: '100%',
              padding: modernChatTheme.spacing.md,
              border: `1px solid ${modernChatTheme.colors.neutral.border}`,
              borderRadius: modernChatTheme.borderRadius.md,
              fontSize: modernChatTheme.typography.persona.fontSize
            }}
          />
        </div>
        
        <div style={{
          display: 'flex',
          gap: modernChatTheme.spacing.md,
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            disabled={isLoading}
            style={{
              padding: `${modernChatTheme.spacing.md} ${modernChatTheme.spacing.lg}`,
              background: 'transparent',
              color: modernChatTheme.colors.neutral.textMuted,
              border: `1px solid ${modernChatTheme.colors.neutral.border}`,
              borderRadius: modernChatTheme.borderRadius.md,
              fontSize: '14px',
              cursor: isLoading ? 'wait' : 'pointer',
              opacity: isLoading ? 0.7 : 1
            }}
          >
            Cancelar
          </button>
          <button
            onClick={() => onSend(email)}
            disabled={!email.includes('@') || isLoading}
            style={{
              padding: `${modernChatTheme.spacing.md} ${modernChatTheme.spacing.lg}`,
              background: email.includes('@') && !isLoading
                ? modernChatTheme.colors.personas.ga.primary
                : modernChatTheme.colors.neutral.textMuted,
              color: 'white',
              border: 'none',
              borderRadius: modernChatTheme.borderRadius.md,
              fontSize: '14px',
              fontWeight: '600',
              cursor: email.includes('@') && !isLoading ? 'pointer' : 'not-allowed'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: modernChatTheme.spacing.xs, justifyContent: 'center' }}>
              {isLoading ? (
                <>
                  <RefreshIcon size={16} color="currentColor" />
                  Enviando...
                </>
              ) : (
                <>
                  <MailIcon size={16} color="currentColor" />
                  Enviar
                </>
              )}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper function to generate plain text certificate
function generatePlainTextCertificate(certificate: Certificate): string {
  const config = DEFAULT_CERTIFICATION_CONFIG;
  
  return `
CERTIFICADO DE CONCLUSÃO
${config.institution.name}
${config.institution.department}

Certificamos que ${certificate.recipientName} concluiu com aproveitamento o programa de capacitação em "${certificate.programTitle}", desenvolvido com base na tese de doutorado de ${config.supervision.supervisorName}.

DADOS DA CERTIFICAÇÃO:
- Pontuação obtida: ${certificate.overallScore}%
- Casos concluídos: ${certificate.casesCompleted}/${certificate.totalCases}
- Carga horária: ${certificate.totalHours} horas
- Data de conclusão: ${certificate.issueDate.toLocaleDateString('pt-BR')}

COMPETÊNCIAS DESENVOLVIDAS:
${certificate.competenciesAchieved.map(comp => `• ${comp}`).join('\n')}

VERIFICAÇÃO:
- ID do certificado: ${certificate.id}
- Código de verificação: ${certificate.verificationCode}
- URL de verificação: ${config.verification.baseUrl}/${certificate.verificationCode}

Supervisão acadêmica: ${config.supervision.supervisorName}
${config.supervision.supervisorTitle}

Programa fundamentado em evidências científicas e protocolos do Ministério da Saúde.
Certificado emitido em ${certificate.issueDate.toLocaleDateString('pt-BR')}.
  `.trim();
}