'use client';

import React, { useState } from 'react';
import { CalculationResult } from '@/types/medication';
import { modernChatTheme } from '@/config/modernTheme';
import { useHapticFeedback } from '@/utils/hapticFeedback';

interface ExportOptionsProps {
  result: CalculationResult | null;
  isAvailable: boolean;
}

export default function ExportOptions({ result, isAvailable }: ExportOptionsProps): React.JSX.Element {
  const [emailAddress, setEmailAddress] = useState('');
  const [includeEducational, setIncludeEducational] = useState(true);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [exportProgress, setExportProgress] = useState(0);
  const [currentFormat, setCurrentFormat] = useState<'pdf' | 'email' | null>(null);
  const { success, error, info } = useHapticFeedback();

  const handlePDFExport = async (): Promise<void> => {
    if (!result) return;

    info();
    setIsExporting(true);
    setCurrentFormat('pdf');
    setExportProgress(0);

    try {
      setExportProgress(20);
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 15;
      const contentWidth = pageWidth - 2 * margin;
      let y = margin;

      setExportProgress(40);

      // Header
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 102, 51);
      doc.text('ROTEIRO DE DISPENSACAO - HANSENIASE PQT-U', pageWidth / 2, y, { align: 'center' });
      y += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100);
      doc.text('Calculo de Doses - Ferramenta Educacional', pageWidth / 2, y, { align: 'center' });
      y += 5;
      doc.text(`Data: ${new Date().toLocaleString('pt-BR')}`, pageWidth / 2, y, { align: 'center' });
      y += 5;
      doc.text('Baseado na tese: "Roteiro de Dispensacao para Hanseniase PQT-U"', pageWidth / 2, y, { align: 'center' });
      y += 5;
      doc.text('Autor: Prof. Me. Nelio Gomes de Moura Junior', pageWidth / 2, y, { align: 'center' });

      // Separator
      y += 8;
      doc.setDrawColor(0, 102, 51);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageWidth - margin, y);
      y += 10;

      setExportProgress(60);

      // Protocol info
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(51, 51, 51);
      doc.text(`PROTOCOLO: ${result.protocol.population.toUpperCase()}`, margin, y);
      y += 6;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Duracao do tratamento: ${result.treatmentSchedule.totalDoses} meses`, margin, y);
      y += 10;

      // Monthly doses
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('DOSES MENSAIS SUPERVISIONADAS:', margin, y);
      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`  Rifampicina: ${result.monthlyDoses.rifampicina}mg`, margin, y); y += 5;
      doc.text(`  Clofazimina: ${result.monthlyDoses.clofazimina_mensal}mg`, margin, y); y += 5;
      doc.text(`  Dapsona: ${result.monthlyDoses.dapsona_mensal}mg`, margin, y); y += 10;

      // Daily doses
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('DOSES DIARIAS AUTOADMINISTRADAS:', margin, y);
      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`  Clofazimina: ${result.dailyDoses.clofazimina_diaria}mg/dia`, margin, y); y += 5;
      doc.text(`  Dapsona: ${result.dailyDoses.dapsona_diaria}mg/dia`, margin, y); y += 10;

      // Safety alerts
      if (result.safetyAlerts.length > 0) {
        doc.setDrawColor(200, 50, 50);
        doc.setLineWidth(0.3);
        doc.line(margin, y, pageWidth - margin, y);
        y += 6;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(200, 50, 50);
        doc.text('ALERTAS DE SEGURANCA:', margin, y);
        y += 6;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(51, 51, 51);
        result.safetyAlerts.forEach(a => {
          if (y > 260) return;
          const alertLines = doc.splitTextToSize(`[${a.severity.toUpperCase()}] ${a.message} - ${a.recommendation}`, contentWidth - 5);
          doc.text(alertLines, margin + 3, y);
          y += alertLines.length * 4 + 3;
        });
        y += 4;
      }

      setExportProgress(80);

      // Educational notes
      if (includeEducational && result.educationalNotes.length > 0) {
        doc.setDrawColor(0, 102, 51);
        doc.setLineWidth(0.3);
        doc.line(margin, y, pageWidth - margin, y);
        y += 6;
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 102, 51);
        doc.text('NOTAS EDUCACIONAIS:', margin, y);
        y += 6;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(51, 51, 51);
        result.educationalNotes.forEach(note => {
          if (y > 270) return;
          const noteLines = doc.splitTextToSize(`- ${note}`, contentWidth - 5);
          doc.text(noteLines, margin + 3, y);
          y += noteLines.length * 4 + 2;
        });
        y += 4;
      }

      // Additional notes
      if (additionalNotes.trim()) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('OBSERVACOES ADICIONAIS:', margin, y);
        y += 5;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const noteLines = doc.splitTextToSize(additionalNotes, contentWidth);
        doc.text(noteLines, margin, y);
        y += noteLines.length * 4 + 6;
      }

      // Footer disclaimer
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      const footerY = doc.internal.pageSize.getHeight() - 15;
      doc.text('IMPORTANTE: Ferramenta educacional. Consulte medico antes de iniciar ou alterar tratamento.', pageWidth / 2, footerY, { align: 'center' });
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth / 2, footerY + 4, { align: 'center' });

      setExportProgress(100);
      doc.save(`PQT-U_Calculo_${new Date().toISOString().split('T')[0]}.pdf`);

      success();
      setExportStatus('success');
      setTimeout(() => setExportStatus('idle'), 3000);
    } catch (exportError) {
      console.error('Erro ao exportar PDF:', exportError);
      error();
      setExportStatus('error');
      setTimeout(() => setExportStatus('idle'), 3000);
    } finally {
      setIsExporting(false);
      setCurrentFormat(null);
      setExportProgress(0);
    }
  };

  const handleEmailSend = async (): Promise<void> => {
    if (!result || !emailAddress) return;

    info();
    setIsExporting(true);
    setCurrentFormat('email');
    setExportProgress(0);

    try {
      setExportProgress(25);
      const textContent = generatePDFContent(result, includeEducational, additionalNotes);

      // Generate PDF attachment
      setExportProgress(50);
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();
      const lines = doc.splitTextToSize(textContent, 170);
      doc.setFontSize(10);
      doc.text(lines, 20, 20);
      const pdfBase64 = doc.output('datauristring').split(',')[1];

      setExportProgress(75);
      const { apiClient } = await import('@/services/api');
      await apiClient.post('/api/v1/email/send-document', {
        to: emailAddress,
        subject: 'Calculo PQT-U - Roteiro de Dispensacao',
        body: textContent,
        attachment_base64: pdfBase64,
        attachment_filename: `PQT-U_Calculo_${new Date().toISOString().split('T')[0]}.pdf`,
      });

      setExportProgress(100);
      success();
      setExportStatus('success');
      setTimeout(() => setExportStatus('idle'), 3000);
      setEmailAddress('');
    } catch (emailError) {
      console.error('Erro ao enviar email:', emailError);
      error();
      setExportStatus('error');
      setTimeout(() => setExportStatus('idle'), 3000);
    } finally {
      setIsExporting(false);
      setCurrentFormat(null);
      setExportProgress(0);
    }
  };

  if (!isAvailable) {
    return (
      <div style={{
        textAlign: 'center',
        padding: modernChatTheme.spacing.xxl,
        color: modernChatTheme.colors.neutral.textMuted
      }}>
        <div style={{ fontSize: '48px', marginBottom: modernChatTheme.spacing.lg }}>
          📤
        </div>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '600',
          marginBottom: modernChatTheme.spacing.sm,
          color: modernChatTheme.colors.neutral.text
        }}>
          Nenhum cálculo para exportar
        </h3>
        <p style={{ fontSize: modernChatTheme.typography.meta.fontSize }}>
          Faça um cálculo primeiro para poder exportá-lo.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{
        marginBottom: modernChatTheme.spacing.xl,
        textAlign: 'center',
        padding: modernChatTheme.spacing.lg,
        background: modernChatTheme.colors.background.secondary,
        borderRadius: modernChatTheme.borderRadius.md
      }}>
        <h3 style={{
          fontSize: '18px',
          fontWeight: '700',
          color: modernChatTheme.colors.neutral.text,
          marginBottom: modernChatTheme.spacing.sm
        }}>
          📤 Exportar Cálculo PQT-U
        </h3>
        <p style={{
          fontSize: modernChatTheme.typography.meta.fontSize,
          color: modernChatTheme.colors.neutral.textMuted
        }}>
          Baixe em PDF ou envie por email os resultados do cálculo
        </p>
      </div>

      {/* Status Messages */}
      {exportStatus === 'success' && (
        <div style={{
          padding: modernChatTheme.spacing.md,
          background: '#10B981' + '20',
          border: `1px solid ${'#10B981'}30`,
          borderRadius: modernChatTheme.borderRadius.md,
          marginBottom: modernChatTheme.spacing.lg,
          color: '#10B981',
          textAlign: 'center'
        }}>
          ✅ Exportação realizada com sucesso!
        </div>
      )}

      {exportStatus === 'error' && (
        <div style={{
          padding: modernChatTheme.spacing.md,
          background: '#EF4444' + '20',
          border: `1px solid ${'#EF4444'}30`,
          borderRadius: modernChatTheme.borderRadius.md,
          marginBottom: modernChatTheme.spacing.lg,
          color: '#EF4444',
          textAlign: 'center'
        }}>
          ❌ Erro na exportação. Tente novamente.
        </div>
      )}

      {/* Export Options */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: modernChatTheme.spacing.xl
      }}>
        {/* PDF Export */}
        <div style={{
          padding: modernChatTheme.spacing.lg,
          background: 'white',
          border: `1px solid ${modernChatTheme.colors.neutral.border}`,
          borderRadius: modernChatTheme.borderRadius.md,
          boxShadow: modernChatTheme.shadows.subtle
        }}>
          <h4 style={{
            fontSize: modernChatTheme.typography.persona.fontSize,
            fontWeight: '600',
            color: modernChatTheme.colors.personas.gasnelio.primary,
            marginBottom: modernChatTheme.spacing.md,
            display: 'flex',
            alignItems: 'center',
            gap: modernChatTheme.spacing.sm
          }}>
            📄 Exportar PDF
          </h4>

          <div style={{ marginBottom: modernChatTheme.spacing.md }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: modernChatTheme.spacing.sm,
              fontSize: modernChatTheme.typography.meta.fontSize,
              color: modernChatTheme.colors.neutral.text,
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={includeEducational}
                onChange={(e) => setIncludeEducational(e.target.checked)}
              />
              <span>Incluir material educacional</span>
            </label>
            <p style={{
              fontSize: '11px',
              color: modernChatTheme.colors.neutral.textMuted,
              marginTop: modernChatTheme.spacing.xs,
              marginLeft: '24px'
            }}>
              Inclui notas educacionais, alertas e referências da tese
            </p>
          </div>

          <div style={{ marginBottom: modernChatTheme.spacing.lg }}>
            <label style={{
              display: 'block',
              marginBottom: modernChatTheme.spacing.xs,
              fontSize: modernChatTheme.typography.meta.fontSize,
              fontWeight: '600',
              color: modernChatTheme.colors.neutral.text
            }}>
              Notas adicionais (opcional):
            </label>
            <textarea
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value.substring(0, 300))}
              placeholder="Ex: Observações clínicas, contexto do paciente..."
              maxLength={300}
              rows={3}
              style={{
                width: '100%',
                padding: modernChatTheme.spacing.sm,
                border: `1px solid ${modernChatTheme.colors.neutral.border}`,
                borderRadius: modernChatTheme.borderRadius.sm,
                fontSize: modernChatTheme.typography.meta.fontSize,
                resize: 'vertical'
              }}
            />
            <div style={{
              fontSize: '11px',
              color: modernChatTheme.colors.neutral.textMuted,
              textAlign: 'right',
              marginTop: modernChatTheme.spacing.xs
            }}>
              {additionalNotes.length}/300 caracteres
            </div>
          </div>

          <button
            onClick={handlePDFExport}
            disabled={isExporting}
            style={{
              width: '100%',
              padding: modernChatTheme.spacing.md,
              background: modernChatTheme.colors.personas.gasnelio.primary,
              color: 'white',
              border: 'none',
              borderRadius: modernChatTheme.borderRadius.md,
              fontSize: modernChatTheme.typography.meta.fontSize,
              fontWeight: '600',
              cursor: isExporting ? 'wait' : 'pointer',
              opacity: isExporting ? 0.7 : 1
            }}
          >
            {isExporting && currentFormat === 'pdf' ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <span>⏳</span> Gerando PDF... {exportProgress}%
              </div>
            ) : (
              '📄 Baixar PDF'
            )}
          </button>
        </div>

        {/* Email Export */}
        <div style={{
          padding: modernChatTheme.spacing.lg,
          background: 'white',
          border: `1px solid ${modernChatTheme.colors.neutral.border}`,
          borderRadius: modernChatTheme.borderRadius.md,
          boxShadow: modernChatTheme.shadows.subtle
        }}>
          <h4 style={{
            fontSize: modernChatTheme.typography.persona.fontSize,
            fontWeight: '600',
            color: modernChatTheme.colors.personas.ga.primary,
            marginBottom: modernChatTheme.spacing.md,
            display: 'flex',
            alignItems: 'center',
            gap: modernChatTheme.spacing.sm
          }}>
            📧 Enviar por Email
          </h4>

          <div style={{ marginBottom: modernChatTheme.spacing.md }}>
            <label style={{
              display: 'block',
              marginBottom: modernChatTheme.spacing.xs,
              fontSize: modernChatTheme.typography.meta.fontSize,
              fontWeight: '600',
              color: modernChatTheme.colors.neutral.text
            }}>
              Email destinatário *:
            </label>
            <input
              type="email"
              value={emailAddress}
              onChange={(e) => setEmailAddress(e.target.value)}
              placeholder="exemplo@email.com"
              style={{
                width: '100%',
                padding: modernChatTheme.spacing.sm,
                border: `1px solid ${modernChatTheme.colors.neutral.border}`,
                borderRadius: modernChatTheme.borderRadius.sm,
                fontSize: modernChatTheme.typography.meta.fontSize
              }}
            />
          </div>

          <div style={{
            marginBottom: modernChatTheme.spacing.lg,
            padding: modernChatTheme.spacing.sm,
            background: '#3B82F6' + '10',
            border: `1px solid ${'#3B82F6'}20`,
            borderRadius: modernChatTheme.borderRadius.sm
          }}>
            <p style={{
              fontSize: '11px',
              color: '#3B82F6',
              margin: 0
            }}>
              🔒 <strong>Privacidade:</strong> O email será enviado com criptografia e não armazenamos seu endereço de email.
            </p>
          </div>

          <button
            onClick={handleEmailSend}
            disabled={isExporting || !emailAddress.includes('@')}
            style={{
              width: '100%',
              padding: modernChatTheme.spacing.md,
              background: emailAddress.includes('@') 
                ? modernChatTheme.colors.personas.ga.primary
                : modernChatTheme.colors.neutral.textMuted,
              color: 'white',
              border: 'none',
              borderRadius: modernChatTheme.borderRadius.md,
              fontSize: modernChatTheme.typography.meta.fontSize,
              fontWeight: '600',
              cursor: emailAddress.includes('@') && !isExporting ? 'pointer' : 'not-allowed',
              opacity: isExporting ? 0.7 : 1
            }}
          >
            {isExporting && currentFormat === 'email' ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <span>📤</span> Enviando... {exportProgress}%
              </div>
            ) : (
              '📧 Enviar por Email'
            )}
          </button>
        </div>
      </div>

      {/* Legal Notice */}
      <div style={{
        marginTop: modernChatTheme.spacing.xl,
        padding: modernChatTheme.spacing.md,
        background: '#F59E0B' + '10',
        border: `1px solid ${'#F59E0B'}20`,
        borderRadius: modernChatTheme.borderRadius.sm
      }}>
        <p style={{
          fontSize: '11px',
          color: modernChatTheme.colors.neutral.textMuted,
          margin: 0,
          textAlign: 'center'
        }}>
          ⚖️ <strong>Aviso Legal:</strong> Este material é baseado na tese &quot;Roteiro de Dispensação para Hanseníase PQT-U&quot; 
          do Prof. Me. Nélio Gomes de Moura Júnior. É uma ferramenta educacional e não substitui consulta médica profissional.
        </p>
      </div>
    </div>
  );
}

// Helper function to generate PDF content
function generatePDFContent(
  result: CalculationResult, 
  includeEducational: boolean, 
  additionalNotes: string
): string {
  let content = `ROTEIRO DE DISPENSAÇÃO - HANSENÍASE PQT-U
Cálculo de Doses - Ferramenta Educacional

Data: ${new Date().toLocaleString('pt-BR')}
Baseado na tese: "Roteiro de Dispensação para Hanseníase PQT-U"
Autor: Prof. Me. Nélio Gomes de Moura Júnior

==========================================

PROTOCOLO APLICADO: ${result.protocol.population.toUpperCase()}
Duração do tratamento: ${result.treatmentSchedule.totalDoses} meses

DOSES MENSAIS SUPERVISIONADAS:
• Rifampicina: ${result.monthlyDoses.rifampicina}mg
• Clofazimina: ${result.monthlyDoses.clofazimina_mensal}mg  
• Dapsona: ${result.monthlyDoses.dapsona_mensal}mg

DOSES DIÁRIAS AUTOADMINISTRADAS:
• Clofazimina: ${result.dailyDoses.clofazimina_diaria}mg/dia
• Dapsona: ${result.dailyDoses.dapsona_diaria}mg/dia

==========================================

ALERTAS DE SEGURANÇA:
${result.safetyAlerts.map(alert => `
• ${alert.type.toUpperCase()} (${alert.severity}): ${alert.message}
  Recomendação: ${alert.recommendation}
`).join('')}

==========================================
`;

  if (includeEducational && result.educationalNotes.length > 0) {
    content += `
NOTAS EDUCACIONAIS:
${result.educationalNotes.map(note => `• ${note}`).join('\n')}

==========================================
`;
  }

  if (additionalNotes.trim()) {
    content += `
OBSERVAÇÕES ADICIONAIS:
${additionalNotes}

==========================================
`;
  }

  content += `
IMPORTANTE:
Esta é uma ferramenta educacional baseada em pesquisa acadêmica.
SEMPRE consulte um médico antes de iniciar ou alterar tratamento.
Prescrição médica é obrigatória para medicamentos PQT-U.

Gerado em: ${new Date().toLocaleString('pt-BR')}
`;

  return content;
}
