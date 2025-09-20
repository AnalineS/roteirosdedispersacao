'use client';

import { useState } from 'react';
import { type ChatMessage } from '@/types/api';
import { type Persona } from '@/services/api';
import { modernChatTheme } from '@/config/modernTheme';

interface ExportChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  currentPersona?: Persona | null;
  isMobile?: boolean;
}

// Utility functions for export
const formatMessagesForExport = (messages: ChatMessage[], persona?: Persona | null) => {
  const header = `# Conversa Educacional - Roteiros de Dispensação PQT-U\n\n`;
  const personaInfo = persona ? `**Assistente:** ${persona.name} (${persona.personality})\n` : '';
  const dateInfo = `**Data:** ${new Date().toLocaleDateString('pt-BR', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}\n\n---\n\n`;

  const conversation = messages.map((msg) => {
    const sender = msg.role === 'user' ? '**Usuário**' : `**${persona?.name || 'Assistente'}**`;
    const timestamp = new Date(msg.timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    let content = `${sender} _(${timestamp})_:\n${msg.content}\n`;
    
    // Adicionar informações de fallback se existirem
    if (msg.metadata?.isFallback) {
      content += `\n> ⚠️ _Resposta de fallback (${msg.metadata.fallbackSource})_\n`;
    }
    
    return content;
  }).join('\n');

  return header + personaInfo + dateInfo + conversation + '\n\n---\n\n_Gerado pelo Sistema Educacional Roteiros de Dispensação - UnB/PPGCF_';
};

const copyToClipboard = async (text: string) => {
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(text);
  } else {
    // Fallback para browsers mais antigos
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    document.execCommand('copy');
    textArea.remove();
  }
};

const generatePDF = async (content: string, filename: string) => {
  // Usando jsPDF para gerar PDF
  const { jsPDF } = await import('jspdf');
  
  const doc = new jsPDF();
  const margin = 20;
  const lineHeight = 7;
  const pageWidth = doc.internal.pageSize.getWidth();
  const maxWidth = pageWidth - (margin * 2);
  
  // Header
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Conversa Educacional - Roteiros de Dispensação', margin, margin);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, margin, margin + 10);
  
  // Conteúdo
  doc.setFontSize(11);
  const lines = doc.splitTextToSize(content, maxWidth);
  let y = margin + 25;
  
  lines.forEach((line: string) => {
    if (y > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
    }
    doc.text(line, margin, y);
    y += lineHeight;
  });
  
  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Sistema Educacional - UnB/PPGCF - Página ${i} de ${totalPages}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }
  
  doc.save(filename);
};

const sendByEmail = (content: string, subject: string) => {
  const body = encodeURIComponent(content);
  const emailSubject = encodeURIComponent(subject);
  const mailto = `mailto:?subject=${emailSubject}&body=${body}`;
  window.open(mailto);
};

export default function ExportChatModal({
  isOpen,
  onClose,
  messages,
  currentPersona,
  isMobile = false
}: ExportChatModalProps) {
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const conversationText = formatMessagesForExport(messages, currentPersona);
  const filename = `conversa-${currentPersona?.name || 'chat'}-${new Date().toISOString().split('T')[0]}.pdf`;
  const emailSubject = `Conversa Educacional - ${currentPersona?.name || 'Assistente'} - ${new Date().toLocaleDateString('pt-BR')}`;

  const handleExport = async (type: 'copy' | 'pdf' | 'email') => {
    setIsExporting(type);
    setExportSuccess(null);

    try {
      switch (type) {
        case 'copy':
          await copyToClipboard(conversationText);
          setExportSuccess('Conversa copiada para a área de transferência!');
          break;
          
        case 'pdf':
          await generatePDF(conversationText, filename);
          setExportSuccess('PDF gerado e baixado com sucesso!');
          break;
          
        case 'email':
          sendByEmail(conversationText, emailSubject);
          setExportSuccess('Cliente de email aberto com a conversa!');
          break;
      }
    } catch (error) {
      // Log erro de exportação via analytics
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'chat_export_failed', {
          event_category: 'error',
          event_label: 'export_failure',
          value: 1,
          custom_parameters: {
            transport_type: 'beacon'
          }
        });
      }

      setExportSuccess('Erro ao exportar. Tente novamente.');
    } finally {
      setIsExporting(null);
      setTimeout(() => setExportSuccess(null), 3000);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          zIndex: modernChatTheme.zIndex.modal,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: modernChatTheme.spacing.lg,
          backdropFilter: 'blur(4px)'
        }}
        onClick={onClose}
      >
        {/* Modal */}
        <div
          style={{
            background: 'white',
            borderRadius: modernChatTheme.borderRadius.lg,
            boxShadow: modernChatTheme.shadows.floating,
            padding: modernChatTheme.spacing.xl,
            width: '100%',
            maxWidth: isMobile ? '100%' : '480px',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: modernChatTheme.spacing.lg,
              paddingBottom: modernChatTheme.spacing.md,
              borderBottom: `1px solid ${modernChatTheme.colors.neutral.divider}`
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: '1.25rem',
                fontWeight: '600',
                color: modernChatTheme.colors.neutral.text
              }}
            >
              📤 Exportar Conversa
            </h2>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: modernChatTheme.colors.neutral.textMuted,
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: modernChatTheme.transitions.fast
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = modernChatTheme.colors.neutral.surface;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'none';
              }}
            >
              ✕
            </button>
          </div>

          {/* Info */}
          <div
            style={{
              background: modernChatTheme.colors.background.accent,
              padding: modernChatTheme.spacing.md,
              borderRadius: modernChatTheme.borderRadius.md,
              marginBottom: modernChatTheme.spacing.lg,
              border: `1px solid ${modernChatTheme.colors.neutral.border}`
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: modernChatTheme.typography.meta.fontSize,
                color: modernChatTheme.colors.neutral.textMuted,
                lineHeight: '1.5'
              }}
            >
              <strong>Conversa com:</strong> {currentPersona?.name || 'Assistente'}<br />
              <strong>Total de mensagens:</strong> {messages.length}<br />
              <strong>Data:</strong> {new Date().toLocaleString('pt-BR')}
            </p>
          </div>

          {/* Export Options */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: modernChatTheme.spacing.md
            }}
          >
            {/* Copy to Clipboard */}
            <button
              onClick={() => handleExport('copy')}
              disabled={isExporting !== null}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: modernChatTheme.spacing.md,
                padding: modernChatTheme.spacing.lg,
                background: modernChatTheme.colors.background.secondary,
                border: `1px solid ${modernChatTheme.colors.neutral.border}`,
                borderRadius: modernChatTheme.borderRadius.md,
                cursor: isExporting ? 'wait' : 'pointer',
                transition: modernChatTheme.transitions.normal,
                opacity: isExporting && isExporting !== 'copy' ? 0.5 : 1
              }}
              onMouseEnter={(e) => {
                if (!isExporting) {
                  e.currentTarget.style.background = modernChatTheme.colors.neutral.surface;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isExporting) {
                  e.currentTarget.style.background = modernChatTheme.colors.background.secondary;
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              <div style={{ fontSize: '1.5rem' }}>📋</div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                  Copiar para Área de Transferência
                </div>
                <div
                  style={{
                    fontSize: modernChatTheme.typography.meta.fontSize,
                    color: modernChatTheme.colors.neutral.textMuted
                  }}
                >
                  Copie o texto da conversa para colar em outros aplicativos
                </div>
              </div>
              {isExporting === 'copy' && (
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    border: '2px solid #ccc',
                    borderTop: `2px solid ${'#3B82F6'}`,
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}
                />
              )}
            </button>

            {/* Download PDF */}
            <button
              onClick={() => handleExport('pdf')}
              disabled={isExporting !== null}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: modernChatTheme.spacing.md,
                padding: modernChatTheme.spacing.lg,
                background: modernChatTheme.colors.background.secondary,
                border: `1px solid ${modernChatTheme.colors.neutral.border}`,
                borderRadius: modernChatTheme.borderRadius.md,
                cursor: isExporting ? 'wait' : 'pointer',
                transition: modernChatTheme.transitions.normal,
                opacity: isExporting && isExporting !== 'pdf' ? 0.5 : 1
              }}
              onMouseEnter={(e) => {
                if (!isExporting) {
                  e.currentTarget.style.background = modernChatTheme.colors.neutral.surface;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isExporting) {
                  e.currentTarget.style.background = modernChatTheme.colors.background.secondary;
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              <div style={{ fontSize: '1.5rem' }}>📄</div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                  Baixar como PDF
                </div>
                <div
                  style={{
                    fontSize: modernChatTheme.typography.meta.fontSize,
                    color: modernChatTheme.colors.neutral.textMuted
                  }}
                >
                  Gere um documento PDF formatado da conversa
                </div>
              </div>
              {isExporting === 'pdf' && (
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    border: '2px solid #ccc',
                    borderTop: `2px solid ${'#3B82F6'}`,
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}
                />
              )}
            </button>

            {/* Send by Email */}
            <button
              onClick={() => handleExport('email')}
              disabled={isExporting !== null}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: modernChatTheme.spacing.md,
                padding: modernChatTheme.spacing.lg,
                background: modernChatTheme.colors.background.secondary,
                border: `1px solid ${modernChatTheme.colors.neutral.border}`,
                borderRadius: modernChatTheme.borderRadius.md,
                cursor: isExporting ? 'wait' : 'pointer',
                transition: modernChatTheme.transitions.normal,
                opacity: isExporting && isExporting !== 'email' ? 0.5 : 1
              }}
              onMouseEnter={(e) => {
                if (!isExporting) {
                  e.currentTarget.style.background = modernChatTheme.colors.neutral.surface;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isExporting) {
                  e.currentTarget.style.background = modernChatTheme.colors.background.secondary;
                  e.currentTarget.style.transform = 'translateY(0)';
                }
              }}
            >
              <div style={{ fontSize: '1.5rem' }}>📧</div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                  Enviar por Email
                </div>
                <div
                  style={{
                    fontSize: modernChatTheme.typography.meta.fontSize,
                    color: modernChatTheme.colors.neutral.textMuted
                  }}
                >
                  Abra seu cliente de email com a conversa anexada
                </div>
              </div>
              {isExporting === 'email' && (
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    border: '2px solid #ccc',
                    borderTop: `2px solid ${'#3B82F6'}`,
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }}
                />
              )}
            </button>
          </div>

          {/* Success Message */}
          {exportSuccess && (
            <div
              style={{
                marginTop: modernChatTheme.spacing.lg,
                padding: modernChatTheme.spacing.md,
                background: '#10B981' + '20',
                border: `1px solid ${'#10B981'}40`,
                borderRadius: modernChatTheme.borderRadius.md,
                color: '#10B981',
                fontSize: modernChatTheme.typography.meta.fontSize,
                textAlign: 'center',
                animation: 'slideUp 300ms ease'
              }}
            >
              ✅ {exportSuccess}
            </div>
          )}

          {/* Footer */}
          <div
            style={{
              marginTop: modernChatTheme.spacing.xl,
              paddingTop: modernChatTheme.spacing.md,
              borderTop: `1px solid ${modernChatTheme.colors.neutral.divider}`,
              textAlign: 'center'
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: modernChatTheme.typography.meta.fontSize,
                color: modernChatTheme.colors.neutral.textMuted
              }}
            >
              Sistema Educacional - UnB/PPGCF
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}
