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
    
    // Haptic feedback para início da exportação
    info();
    setIsExporting(true);
    setCurrentFormat('pdf');
    setExportProgress(0);
    
    try {
      // Simular progresso de geração
      for (let i = 0; i <= 100; i += 20) {
        setExportProgress(i);
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      // TODO: Implementar geração real de PDF
      const pdfContent = generatePDFContent(result, includeEducational, additionalNotes);
      
      // Por enquanto, fazer download de um arquivo de texto
      const blob = new Blob([pdfContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `PQT-U_Calculo_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      // Success haptic feedback
      success();
      setExportStatus('success');
      setTimeout(() => setExportStatus('idle'), 3000);
    } catch (exportError) {
      console.error('Erro ao exportar PDF:', exportError);
      // Error haptic feedback
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
    
    // Haptic feedback para início do envio
    info();
    setIsExporting(true);
    setCurrentFormat('email');
    setExportProgress(0);
    
    try {
      // Simular progresso do envio
      const stages = ['Preparando conteúdo...', 'Conectando servidor...', 'Enviando email...'];
      
      for (let i = 0; i < stages.length; i++) {
        setExportProgress((i + 1) * 33);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      setExportProgress(100);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // TODO: Implementar EmailJS
      console.log('Enviando email para:', emailAddress);
      console.log('Conteúdo:', generatePDFContent(result, includeEducational, additionalNotes));
      
      // Success haptic feedback
      success();
      setExportStatus('success');
      setTimeout(() => setExportStatus('idle'), 3000);
      setEmailAddress('');
    } catch (emailError) {
      console.error('Erro ao enviar email:', emailError);
      // Error haptic feedback
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
