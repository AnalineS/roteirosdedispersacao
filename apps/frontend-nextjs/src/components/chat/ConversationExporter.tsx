'use client';

import { useState, useRef, useEffect } from 'react';
import { Persona } from '@/services/api';
import { theme } from '@/config/theme';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  personaId?: string;
}

interface ConversationExporterProps {
  messages: Message[];
  currentPersona: Persona | null;
  isMobile?: boolean;
}

export default function ConversationExporter({ 
  messages, 
  currentPersona,
  isMobile = false 
}: ConversationExporterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [emailData, setEmailData] = useState({
    recipient: '',
    subject: 'Conversa com Assistente Virtual - Roteiros de Dispensação',
    showEmailModal: false
  });
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasMessages = messages.length > 0;

  // Gerar conteúdo da conversa formatado
  const generateConversationText = () => {
    const header = `CONVERSA COM ASSISTENTE VIRTUAL
Sistema: Roteiros de Dispensação PQT-U
Assistente: ${currentPersona?.name || 'N/A'}
Data: ${new Date().toLocaleDateString('pt-BR')}
Horário: ${new Date().toLocaleTimeString('pt-BR')}

${'='.repeat(50)}

`;

    const conversation = messages.map((message, index) => {
      const timestamp = new Date(message.timestamp).toLocaleTimeString('pt-BR');
      const sender = message.role === 'user' ? 'USUÁRIO' : (currentPersona?.name || 'ASSISTENTE');
      
      return `${index + 1}. [${timestamp}] ${sender}:
${message.content}

`;
    }).join('');

    const footer = `${'='.repeat(50)}

Esta conversa foi gerada pelo Sistema Educacional de Roteiros de Dispensação PQT-U
Programa de Pós-Graduação em Ciências Farmacêuticas - Universidade de Brasília (UnB)

Para mais informações, visite nosso sistema educacional.
`;

    return header + conversation + footer;
  };

  // Exportar para PDF usando jsPDF
  const exportToPDF = async () => {
    if (!hasMessages) return;
    
    setIsExporting(true);
    
    try {
      // Importar jsPDF dinamicamente para evitar problemas de SSR
      const { default: jsPDF } = await import('jspdf');
      
      const doc = new jsPDF();
      const conversationText = generateConversationText();
      
      // Configurações de layout
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 20;
      const lineHeight = 7;
      const maxWidth = pageWidth - (margin * 2);
      
      // Título
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Conversa com Assistente Virtual', margin, margin);
      
      // Subtítulo
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Sistema Educacional - Roteiros de Dispensação PQT-U', margin, margin + 10);
      
      // Informações da sessão
      doc.setFontSize(10);
      doc.text(`Assistente: ${currentPersona?.name || 'N/A'}`, margin, margin + 20);
      doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')} - ${new Date().toLocaleTimeString('pt-BR')}`, margin, margin + 27);
      
      let yPosition = margin + 40;
      
      // Adicionar mensagens
      messages.forEach((message, index) => {
        // Verificar se precisa de nova página
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          yPosition = margin;
        }
        
        // Cabeçalho da mensagem
        const timestamp = new Date(message.timestamp).toLocaleTimeString('pt-BR');
        const sender = message.role === 'user' ? 'USUÁRIO' : (currentPersona?.name || 'ASSISTENTE');
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`${index + 1}. [${timestamp}] ${sender}:`, margin, yPosition);
        yPosition += lineHeight + 2;
        
        // Conteúdo da mensagem
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(message.content, maxWidth);
        
        lines.forEach((line: string) => {
          if (yPosition > pageHeight - 20) {
            doc.addPage();
            yPosition = margin;
          }
          doc.text(line, margin, yPosition);
          yPosition += lineHeight;
        });
        
        yPosition += 5; // Espaço entre mensagens
      });
      
      // Footer
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = margin;
      }
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      const footerText = 'Gerado pelo Sistema Educacional de Roteiros de Dispensação PQT-U - PPGCF/UnB';
      doc.text(footerText, margin, pageHeight - 15);
      
      // Salvar arquivo
      const filename = `conversa-${currentPersona?.name || 'assistente'}-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(filename);
      
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      alert('Erro ao exportar PDF. Tente novamente.');
    } finally {
      setIsExporting(false);
      setIsOpen(false);
    }
  };

  // Preparar dados para e-mail
  const prepareEmailData = () => {
    const conversationText = generateConversationText();
    const subject = encodeURIComponent(emailData.subject);
    const body = encodeURIComponent(conversationText);
    
    return {
      subject,
      body,
      text: conversationText
    };
  };

  // Abrir cliente de e-mail
  const openEmailClient = () => {
    if (!hasMessages) return;
    
    const { subject, body } = prepareEmailData();
    const recipient = emailData.recipient ? encodeURIComponent(emailData.recipient) : '';
    const mailtoUrl = `mailto:${recipient}?subject=${subject}&body=${body}`;
    
    window.open(mailtoUrl, '_self');
    setIsOpen(false);
    setEmailData(prev => ({ ...prev, showEmailModal: false }));
  };

  // Copiar texto para área de transferência
  const copyToClipboard = async () => {
    if (!hasMessages) return;
    
    try {
      const conversationText = generateConversationText();
      await navigator.clipboard.writeText(conversationText);
      alert('Conversa copiada para a área de transferência!');
      setIsOpen(false);
    } catch (error) {
      console.error('Erro ao copiar texto:', error);
      alert('Erro ao copiar texto. Tente novamente.');
    }
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative', zIndex: 1000 }}>
      {/* Export Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={!hasMessages}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: isMobile ? '40px' : '44px',
          height: isMobile ? '40px' : '44px',
          background: hasMessages ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.3)',
          borderRadius: '10px',
          color: hasMessages ? 'white' : 'rgba(255,255,255,0.5)',
          cursor: hasMessages ? 'pointer' : 'not-allowed',
          fontSize: isMobile ? '1.1rem' : '1.2rem',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          if (hasMessages) {
            e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
          }
        }}
        onMouseLeave={(e) => {
          if (hasMessages) {
            e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
          }
        }}
        title="Exportar conversa"
      >
        📤
      </button>

      {/* Dropdown Menu */}
      {isOpen && hasMessages && (
        <>
          {/* Backdrop for mobile */}
          {isMobile && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.3)',
                zIndex: 998
              }}
              onClick={() => setIsOpen(false)}
            />
          )}

          <div
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '8px',
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
              border: '1px solid rgba(0,0,0,0.1)',
              minWidth: '240px',
              zIndex: 999,
              overflow: 'hidden'
            }}
          >
            {/* Header */}
            <div style={{
              padding: '16px 20px',
              background: `linear-gradient(135deg, ${theme.colors.primary[50]} 0%, ${theme.colors.secondary[50]} 100%)`,
              borderBottom: '1px solid #f0f0f0'
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '0.9rem',
                fontWeight: 'bold',
                color: theme.colors.primary[700]
              }}>
                Exportar Conversa
              </h3>
              <p style={{
                margin: '4px 0 0',
                fontSize: '0.75rem',
                color: theme.colors.neutral[600]
              }}>
                {messages.length} mensagem{messages.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Export Options */}
            <div style={{ padding: '8px 0' }}>
              {/* PDF Export */}
              <button
                onClick={exportToPDF}
                disabled={isExporting}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 20px',
                  border: 'none',
                  background: 'transparent',
                  cursor: isExporting ? 'wait' : 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isExporting) {
                    e.currentTarget.style.background = theme.colors.neutral[50];
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>📄</span>
                <div>
                  <div style={{
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    color: theme.colors.neutral[800]
                  }}>
                    {isExporting ? 'Gerando PDF...' : 'Exportar como PDF'}
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: theme.colors.neutral[600]
                  }}>
                    Salvar arquivo PDF no computador
                  </div>
                </div>
              </button>

              {/* Email Export */}
              <button
                onClick={() => setEmailData(prev => ({ ...prev, showEmailModal: true }))}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 20px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = theme.colors.neutral[50];
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>📧</span>
                <div>
                  <div style={{
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    color: theme.colors.neutral[800]
                  }}>
                    Enviar por E-mail
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: theme.colors.neutral[600]
                  }}>
                    Abrir cliente de e-mail
                  </div>
                </div>
              </button>

              {/* Copy to Clipboard */}
              <button
                onClick={copyToClipboard}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 20px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = theme.colors.neutral[50];
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>📋</span>
                <div>
                  <div style={{
                    fontSize: '0.9rem',
                    fontWeight: '600',
                    color: theme.colors.neutral[800]
                  }}>
                    Copiar Texto
                  </div>
                  <div style={{
                    fontSize: '0.75rem',
                    color: theme.colors.neutral[600]
                  }}>
                    Copiar para área de transferência
                  </div>
                </div>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Email Modal */}
      {emailData.showEmailModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setEmailData(prev => ({ ...prev, showEmailModal: false }));
            }
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '24px',
              width: '100%',
              maxWidth: '400px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
            }}
          >
            <h3 style={{
              margin: '0 0 16px',
              fontSize: '1.1rem',
              fontWeight: 'bold',
              color: theme.colors.primary[700]
            }}>
              Enviar por E-mail
            </h3>

            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '0.9rem',
                fontWeight: '600',
                color: theme.colors.neutral[700],
                marginBottom: '6px'
              }}>
                E-mail do destinatário (opcional):
              </label>
              <input
                type="email"
                value={emailData.recipient}
                onChange={(e) => setEmailData(prev => ({ ...prev, recipient: e.target.value }))}
                placeholder="exemplo@email.com"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '0.9rem',
                fontWeight: '600',
                color: theme.colors.neutral[700],
                marginBottom: '6px'
              }}>
                Assunto:
              </label>
              <input
                type="text"
                value={emailData.subject}
                onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setEmailData(prev => ({ ...prev, showEmailModal: false }))}
                style={{
                  padding: '10px 20px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  background: 'white',
                  color: theme.colors.neutral[700],
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={openEmailClient}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '8px',
                  background: theme.colors.primary[500],
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '600'
                }}
              >
                Abrir E-mail
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}