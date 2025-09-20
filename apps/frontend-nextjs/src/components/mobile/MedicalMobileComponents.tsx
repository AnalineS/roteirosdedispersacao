/**
 * Medical Mobile Components - ETAPA 4 UX TRANSFORMATION
 * Componentes específicos para contexto médico em dispositivos móveis
 * 
 * Seguindo princípios de claude_code_optimization_prompt.md:
 * - Medical Context: Componentes específicos para profissionais de saúde
 * - Touch-Friendly: Todos os elementos ≥44px, interface single-hand
 * - Quick Access: Informações críticas em primeiro plano
 * - Emergency Ready: Acesso rápido a informações de emergência
 */

'use client';

import React, { useState, useCallback } from 'react';
import { getUnbColors } from '@/config/modernTheme';
import { MobileCard, MobileButton, useMobileDetection } from './MobileFirstFramework';

// Interfaces para componentes médicos mobile
interface DosageInfo {
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes?: string;
  critical?: boolean;
}

interface EmergencyContact {
  type: 'hospital' | 'pharmacy' | 'doctor' | 'emergency';
  name: string;
  phone: string;
  address?: string;
  hours?: string;
}

interface PatientAlert {
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  actionRequired?: boolean;
  timestamp?: Date;
}

// Componente para dosagem mobile-optimized
export const MobileDosageCard: React.FC<{ dosage: DosageInfo }> = ({ dosage }) => {
  const unbColors = getUnbColors();
  const { isMobile } = useMobileDetection();
  
  return (
    <MobileCard
      variant={dosage.critical ? 'emergency' : 'prescription'}
      className={`border-l-6 mb-4 ${dosage.critical ? 'border-l-red-600' : 'border-l-blue-500'}`}
    >
      <div className="mobile-flex-col mobile-gap-sm">
        {/* Header com medicamento */}
        <div className="mobile-flex" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h3 style={{
            fontSize: isMobile ? '1.125rem' : '1.25rem',
            fontWeight: '700',
            color: dosage.critical ? '#991b1b' : '#0369a1',
            margin: 0,
            flex: 1
          }}>
            {dosage.medication}
          </h3>
          
          {dosage.critical && (
            <div style={{
              background: '#dc2626',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '0.75rem',
              fontWeight: 'bold'
            }}>
              CRÍTICO
            </div>
          )}
        </div>
        
        {/* Informações principais */}
        <div className="mobile-grid mobile-grid-2 mobile-gap-sm">
          <div>
            <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '4px' }}>
              Dosagem
            </div>
            <div style={{ 
              fontSize: '1rem', 
              fontWeight: '600',
              color: dosage.critical ? '#991b1b' : '#1e293b'
            }}>
              {dosage.dosage}
            </div>
          </div>
          
          <div>
            <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '4px' }}>
              Frequência
            </div>
            <div style={{ 
              fontSize: '1rem', 
              fontWeight: '600',
              color: dosage.critical ? '#991b1b' : '#1e293b'
            }}>
              {dosage.frequency}
            </div>
          </div>
        </div>
        
        {/* Duração */}
        <div>
          <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '4px' }}>
            Duração do Tratamento
          </div>
          <div style={{ 
            fontSize: '1rem', 
            fontWeight: '600',
            color: dosage.critical ? '#991b1b' : '#1e293b'
          }}>
            {dosage.duration}
          </div>
        </div>
        
        {/* Notas adicionais */}
        {dosage.notes && (
          <div style={{
            background: dosage.critical ? '#fef2f2' : '#f0f9ff',
            border: `1px solid ${dosage.critical ? '#fecaca' : '#bae6fd'}`,
            borderRadius: '8px',
            padding: '12px',
            marginTop: '8px'
          }}>
            <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '4px' }}>
              Observações Importantes
            </div>
            <div style={{ fontSize: '0.875rem', lineHeight: '1.5', color: '#374151' }}>
              {dosage.notes}
            </div>
          </div>
        )}
      </div>
    </MobileCard>
  );
};

// Componente para contatos de emergência
export const MobileEmergencyContacts: React.FC<{ contacts: EmergencyContact[] }> = ({ contacts }) => {
  const { isMobile } = useMobileDetection();
  
  const getContactIcon = (type: EmergencyContact['type']) => {
    switch (type) {
      case 'emergency': return '🚨';
      case 'hospital': return '🏥';
      case 'pharmacy': return '💊';
      case 'doctor': return '👨‍⚕️';
      default: return '📞';
    }
  };
  
  const handleCall = useCallback((phone: string) => {
    if (typeof window !== 'undefined') {
      window.location.href = `tel:${phone}`;
    }
  }, []);
  
  return (
    <MobileCard variant="emergency" className="bg-red-100 border-red-600">
      <div className="mobile-flex-col mobile-gap-sm">
        <h3 style={{
          fontSize: isMobile ? '1.125rem' : '1.25rem',
          fontWeight: '700',
          color: '#991b1b',
          margin: 0,
          textAlign: 'center'
        }}>
          🚨 Contatos de Emergência
        </h3>
        
        <div className="mobile-flex-col mobile-gap-sm">
          {contacts.map((contact, index) => (
            <div key={index} style={{
              background: 'white',
              borderRadius: '8px',
              padding: '12px',
              border: '1px solid #fecaca'
            }}>
              <div className="mobile-flex" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="mobile-flex" style={{ flex: 1 }}>
                  <span style={{ fontSize: '1.5rem', marginRight: '8px' }}>
                    {getContactIcon(contact.type)}
                  </span>
                  <div>
                    <div style={{ fontWeight: '600', color: '#991b1b', fontSize: '0.9rem' }}>
                      {contact.name}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      {contact.phone}
                    </div>
                    {contact.hours && (
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {contact.hours}
                      </div>
                    )}
                  </div>
                </div>
                
                <button
                  className="mobile-button mobile-emergency min-w-[60px] px-3 py-2 text-sm"
                  onClick={() => handleCall(contact.phone)}
                >
                  📞 Ligar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MobileCard>
  );
};

// Componente para alertas médicos
export const MobilePatientAlert: React.FC<{ alert: PatientAlert }> = ({ alert }) => {
  const [dismissed, setDismissed] = useState(false);
  
  if (dismissed) return null;
  
  const getSeverityConfig = (severity: PatientAlert['severity']) => {
    switch (severity) {
      case 'critical':
        return {
          bg: '#fee2e2',
          border: '#dc2626',
          text: '#991b1b',
          icon: '🚨'
        };
      case 'high':
        return {
          bg: '#fef3c7',
          border: '#f59e0b',
          text: '#92400e',
          icon: '⚠️'
        };
      case 'medium':
        return {
          bg: '#dbeafe',
          border: '#3b82f6',
          text: '#1d4ed8',
          icon: 'ℹ️'
        };
      case 'low':
        return {
          bg: '#f0fdf4',
          border: '#22c55e',
          text: '#166534',
          icon: '✅'
        };
    }
  };
  
  const config = getSeverityConfig(alert.severity);
  
  return (
    <div style={{
      background: config.bg,
      border: `2px solid ${config.border}`,
      borderRadius: '12px',
      padding: '16px',
      margin: '12px 0',
      position: 'relative'
    }}>
      <div className="mobile-flex" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div className="mobile-flex" style={{ flex: 1, alignItems: 'flex-start' }}>
          <span style={{ fontSize: '1.5rem', marginRight: '12px' }}>
            {config.icon}
          </span>
          
          <div style={{ flex: 1 }}>
            <h4 style={{
              fontSize: '1rem',
              fontWeight: '700',
              color: config.text,
              margin: '0 0 8px 0'
            }}>
              {alert.title}
            </h4>
            
            <p style={{
              fontSize: '0.875rem',
              color: config.text,
              margin: '0 0 8px 0',
              lineHeight: '1.5'
            }}>
              {alert.message}
            </p>
            
            {alert.timestamp && (
              <div style={{
                fontSize: '0.75rem',
                color: '#64748b',
                marginTop: '8px'
              }}>
                {alert.timestamp.toLocaleString('pt-BR')}
              </div>
            )}
            
            {alert.actionRequired && (
              <div style={{
                marginTop: '12px',
                padding: '8px 12px',
                background: 'rgba(255, 255, 255, 0.8)',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: '600',
                color: config.text
              }}>
                👆 Ação necessária do profissional
              </div>
            )}
          </div>
        </div>
        
        <button
          onClick={() => setDismissed(true)}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: '1.25rem',
            color: '#64748b',
            cursor: 'pointer',
            padding: '4px',
            minWidth: '32px',
            minHeight: '32px'
          }}
          aria-label="Dispensar alerta"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

// Componente para checklist mobile
export const MobileChecklist: React.FC<{
  items: { id: string; label: string; completed: boolean; critical?: boolean }[];
  onToggle: (id: string) => void;
  title: string;
}> = ({ items, onToggle, title }) => {
  const { isMobile } = useMobileDetection();
  
  const completedCount = items.filter(item => item.completed).length;
  const progressPercentage = (completedCount / items.length) * 100;
  
  return (
    <MobileCard variant="default">
      <div className="mobile-flex-col mobile-gap-sm">
        {/* Header com progresso */}
        <div>
          <h3 style={{
            fontSize: isMobile ? '1.125rem' : '1.25rem',
            fontWeight: '700',
            color: '#1e293b',
            margin: '0 0 8px 0'
          }}>
            {title}
          </h3>
          
          <div style={{
            background: '#f1f5f9',
            borderRadius: '8px',
            height: '8px',
            overflow: 'hidden',
            marginBottom: '8px'
          }}>
            <div style={{
              background: progressPercentage === 100 ? '#22c55e' : '#3b82f6',
              height: '100%',
              width: `${progressPercentage}%`,
              transition: 'width 0.3s ease'
            }} />
          </div>
          
          <div style={{
            fontSize: '0.875rem',
            color: '#64748b',
            textAlign: 'center'
          }}>
            {completedCount} de {items.length} itens concluídos ({Math.round(progressPercentage)}%)
          </div>
        </div>
        
        {/* Lista de itens */}
        <div className="mobile-flex-col mobile-gap-xs">
          {items.map((item) => (
            <div
              key={item.id}
              style={{
                background: item.completed ? '#f0fdf4' : 'white',
                border: `2px solid ${item.critical ? '#dc2626' : item.completed ? '#22c55e' : '#e2e8f0'}`,
                borderRadius: '8px',
                padding: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => onToggle(item.id)}
            >
              <div className="mobile-flex" style={{ alignItems: 'center' }}>
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '4px',
                  border: `2px solid ${item.completed ? '#22c55e' : '#d1d5db'}`,
                  background: item.completed ? '#22c55e' : 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '12px',
                  fontSize: '14px',
                  color: 'white'
                }}>
                  {item.completed && '✓'}
                </div>
                
                <div style={{
                  flex: 1,
                  fontSize: '0.9rem',
                  color: item.completed ? '#166534' : '#374151',
                  textDecoration: item.completed ? 'line-through' : 'none'
                }}>
                  {item.label}
                  {item.critical && (
                    <span style={{
                      marginLeft: '8px',
                      background: '#dc2626',
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 'bold'
                    }}>
                      CRÍTICO
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MobileCard>
  );
};

// Componente para quick actions médicas
export const MobileQuickActions: React.FC<{
  actions: { 
    id: string; 
    label: string; 
    icon: string; 
    action: () => void;
    variant?: 'default' | 'emergency';
  }[];
}> = ({ actions }) => {
  return (
    <div className="mobile-grid mobile-grid-2 mobile-gap-sm" style={{ marginBottom: '1rem' }}>
      {actions.map((action) => (
        <button
          key={action.id}
          className={`mobile-button ${action.variant === 'emergency' ? 'mobile-emergency' : 'mobile-primary'} h-20 flex-col gap-2 text-sm font-semibold`}
          onClick={action.action}
        >
          <span style={{ fontSize: '1.5rem' }}>{action.icon}</span>
          {action.label}
        </button>
      ))}
    </div>
  );
};

// Component de resumo médico mobile
export const MobileMedicalSummary: React.FC<{
  patient?: string;
  condition: string;
  lastUpdate: Date;
  keyPoints: string[];
}> = ({ patient, condition, lastUpdate, keyPoints }) => {
  const { isMobile } = useMobileDetection();
  
  return (
    <MobileCard variant="medical">
      <div className="mobile-flex-col mobile-gap-sm">
        <div className="mobile-flex" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{
              fontSize: isMobile ? '1.125rem' : '1.25rem',
              fontWeight: '700',
              color: '#1d4ed8',
              margin: 0
            }}>
              📋 Resumo Médico
            </h3>
            
            {patient && (
              <div style={{
                fontSize: '0.875rem',
                color: '#64748b',
                marginTop: '4px'
              }}>
                Paciente: {patient}
              </div>
            )}
          </div>
          
          <div style={{
            fontSize: '0.75rem',
            color: '#64748b',
            textAlign: 'right'
          }}>
            Atualizado em<br/>
            {lastUpdate.toLocaleString('pt-BR')}
          </div>
        </div>
        
        <div>
          <div style={{
            fontSize: '0.875rem',
            color: '#64748b',
            marginBottom: '4px'
          }}>
            Condição
          </div>
          <div style={{
            fontSize: '1rem',
            fontWeight: '600',
            color: '#1e293b',
            padding: '8px 12px',
            background: '#f0f9ff',
            borderRadius: '6px',
            border: '1px solid #bae6fd'
          }}>
            {condition}
          </div>
        </div>
        
        {keyPoints.length > 0 && (
          <div>
            <div style={{
              fontSize: '0.875rem',
              color: '#64748b',
              marginBottom: '8px'
            }}>
              Pontos Principais
            </div>
            <ul style={{
              margin: 0,
              paddingLeft: '1.5rem',
              fontSize: '0.875rem',
              lineHeight: '1.6'
            }}>
              {keyPoints.map((point, index) => (
                <li key={index} style={{ marginBottom: '4px' }}>
                  {point}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </MobileCard>
  );
};

// Components exports - removido duplicatas