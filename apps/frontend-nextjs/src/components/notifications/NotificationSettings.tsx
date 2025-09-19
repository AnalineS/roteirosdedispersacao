'use client';

import React, { useState, useEffect } from 'react';
import NotificationSystem, { NotificationPreferences, MedicationReminder, AppointmentReminder } from '@/services/notifications/NotificationSystem';
import { getUnbColors } from '@/config/modernTheme';
import { BellIcon, CheckCircleIcon, XCircleIcon, ClockIcon, AlertCircleIcon } from '@/components/icons/EducationalIcons';

export default function NotificationSettings() {
  const unbColors = getUnbColors();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [preferences, setPreferences] = useState<NotificationPreferences>(NotificationSystem.getPreferences());
  const [medicationReminders, setMedicationReminders] = useState<MedicationReminder[]>([]);
  const [appointmentReminders, setAppointmentReminders] = useState<AppointmentReminder[]>([]);
  const [showAddMedication, setShowAddMedication] = useState(false);
  const [showAddAppointment, setShowAddAppointment] = useState(false);

  useEffect(() => {
    // Load current status
    setPermission(NotificationSystem.getPermissionStatus());
    setPreferences(NotificationSystem.getPreferences());
    setMedicationReminders(NotificationSystem.getMedicationReminders());
    setAppointmentReminders(NotificationSystem.getAppointmentReminders());
  }, []);

  const handleRequestPermission = async () => {
    const newPermission = await NotificationSystem.requestPermission();
    setPermission(newPermission);

    if (newPermission === 'granted') {
      setPreferences(NotificationSystem.getPreferences());
    }
  };

  const handlePreferenceChange = (key: keyof NotificationPreferences, value: boolean | string | number) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    NotificationSystem.updatePreferences({ [key]: value });
  };

  const handleQuietHoursChange = (field: 'enabled' | 'start' | 'end', value: boolean | string) => {
    const newQuietHours = { ...preferences.quietHours, [field]: value };
    const newPreferences = { ...preferences, quietHours: newQuietHours };
    setPreferences(newPreferences);
    NotificationSystem.updatePreferences({ quietHours: newQuietHours });
  };

  const handleTestNotification = () => {
    NotificationSystem.testNotification();
  };

  const handleAddMedication = (reminder: MedicationReminder) => {
    NotificationSystem.addMedicationReminder(reminder);
    setMedicationReminders(NotificationSystem.getMedicationReminders());
    setShowAddMedication(false);
  };

  const handleRemoveMedication = (id: string) => {
    NotificationSystem.removeMedicationReminder(id);
    setMedicationReminders(NotificationSystem.getMedicationReminders());
  };

  const handleAddAppointment = (reminder: AppointmentReminder) => {
    NotificationSystem.addAppointmentReminder(reminder);
    setAppointmentReminders(NotificationSystem.getAppointmentReminders());
    setShowAddAppointment(false);
  };

  const handleRemoveAppointment = (id: string) => {
    NotificationSystem.removeAppointmentReminder(id);
    setAppointmentReminders(NotificationSystem.getAppointmentReminders());
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${unbColors.primary}15, ${unbColors.secondary}15)`,
        padding: '2rem',
        borderRadius: '16px',
        marginBottom: '2rem',
        border: `1px solid ${unbColors.primary}20`
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1rem'
        }}>
          <BellIcon size={32} color={unbColors.primary} />
          <h2 style={{
            margin: 0,
            fontSize: '1.75rem',
            fontWeight: 'bold',
            color: unbColors.primary
          }}>
            Configurações de Notificações
          </h2>
        </div>

        {/* Permission Status */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          padding: '1rem',
          background: 'white',
          borderRadius: '12px',
          border: `1px solid ${
            permission === 'granted' ? '#10B981' :
            permission === 'denied' ? '#EF4444' : '#F59E0B'
          }`
        }}>
          {permission === 'granted' ? (
            <CheckCircleIcon size={24} color="#10B981" />
          ) : permission === 'denied' ? (
            <XCircleIcon size={24} color="#EF4444" />
          ) : (
            <AlertCircleIcon size={24} color="#F59E0B" />
          )}

          <div style={{ flex: 1 }}>
            <h3 style={{
              margin: 0,
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#1e293b'
            }}>
              Status das Notificações
            </h3>
            <p style={{
              margin: '0.25rem 0 0',
              fontSize: '0.875rem',
              color: '#64748b'
            }}>
              {permission === 'granted' && 'Notificações ativadas e funcionando'}
              {permission === 'denied' && 'Notificações bloqueadas pelo navegador'}
              {permission === 'default' && 'Permissão para notificações não concedida'}
            </p>
          </div>

          {permission !== 'granted' && (
            <button
              onClick={handleRequestPermission}
              style={{
                padding: '0.75rem 1.5rem',
                background: unbColors.primary,
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.95rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Ativar Notificações
            </button>
          )}

          {permission === 'granted' && (
            <button
              onClick={handleTestNotification}
              style={{
                padding: '0.75rem 1.5rem',
                background: unbColors.secondary,
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.95rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Testar Notificação
            </button>
          )}
        </div>
      </div>

      {permission === 'granted' && (
        <>
          {/* Notification Preferences */}
          <div style={{
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '2rem',
            marginBottom: '2rem'
          }}>
            <h3 style={{
              margin: '0 0 1.5rem 0',
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: '#1e293b'
            }}>
              Preferências de Notificação
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <PreferenceToggle
                label="Lembretes Diários"
                description="Receber lembretes diários sobre o tratamento"
                checked={preferences.dailyReminders}
                onChange={(v) => handlePreferenceChange('dailyReminders', v)}
              />

              <PreferenceToggle
                label="Lembretes de Consultas"
                description="Notificações antes das consultas agendadas"
                checked={preferences.appointmentReminders}
                onChange={(v) => handlePreferenceChange('appointmentReminders', v)}
              />

              <PreferenceToggle
                label="Alertas de Medicação"
                description="Lembretes para tomar medicamentos"
                checked={preferences.medicationAlerts}
                onChange={(v) => handlePreferenceChange('medicationAlerts', v)}
              />

              <PreferenceToggle
                label="Alertas de Emergência"
                description="Notificações urgentes e críticas"
                checked={preferences.emergencyAlerts}
                onChange={(v) => handlePreferenceChange('emergencyAlerts', v)}
              />

              <PreferenceToggle
                label="Dicas Educacionais"
                description="Receber dicas sobre o tratamento"
                checked={preferences.educationalTips}
                onChange={(v) => handlePreferenceChange('educationalTips', v)}
              />

              <PreferenceToggle
                label="Som"
                description="Tocar som nas notificações"
                checked={preferences.sound}
                onChange={(v) => handlePreferenceChange('sound', v)}
              />

              <PreferenceToggle
                label="Vibração"
                description="Vibrar dispositivo nas notificações"
                checked={preferences.vibration}
                onChange={(v) => handlePreferenceChange('vibration', v)}
              />
            </div>

            {/* Quiet Hours */}
            <div style={{
              marginTop: '2rem',
              padding: '1.5rem',
              background: '#f8fafc',
              borderRadius: '12px'
            }}>
              <PreferenceToggle
                label="Horário de Silêncio"
                description="Pausar notificações durante período específico"
                checked={preferences.quietHours.enabled}
                onChange={(v) => handleQuietHoursChange('enabled', v)}
              />

              {preferences.quietHours.enabled && (
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  marginTop: '1rem',
                  alignItems: 'center'
                }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#64748b',
                      marginBottom: '0.25rem'
                    }}>
                      Início
                    </label>
                    <input
                      type="time"
                      value={preferences.quietHours.start}
                      onChange={(e) => handleQuietHoursChange('start', e.target.value)}
                      style={{
                        padding: '0.5rem',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        fontSize: '0.95rem'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      color: '#64748b',
                      marginBottom: '0.25rem'
                    }}>
                      Fim
                    </label>
                    <input
                      type="time"
                      value={preferences.quietHours.end}
                      onChange={(e) => handleQuietHoursChange('end', e.target.value)}
                      style={{
                        padding: '0.5rem',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        fontSize: '0.95rem'
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Medication Reminders */}
          <div style={{
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '2rem',
            marginBottom: '2rem'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: '#1e293b'
              }}>
                💊 Lembretes de Medicação
              </h3>

              <button
                onClick={() => setShowAddMedication(true)}
                style={{
                  padding: '0.5rem 1rem',
                  background: unbColors.primary,
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                + Adicionar Lembrete
              </button>
            </div>

            {medicationReminders.length === 0 ? (
              <p style={{
                textAlign: 'center',
                color: '#64748b',
                padding: '2rem'
              }}>
                Nenhum lembrete de medicação configurado
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {medicationReminders.map(reminder => (
                  <ReminderCard
                    key={reminder.id}
                    title={reminder.medicationName}
                    subtitle={`${reminder.dosage} - ${reminder.time} (${reminder.frequency})`}
                    enabled={reminder.enabled}
                    onRemove={() => handleRemoveMedication(reminder.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Appointment Reminders */}
          <div style={{
            background: 'white',
            border: '1px solid #e2e8f0',
            borderRadius: '16px',
            padding: '2rem'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{
                margin: 0,
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: '#1e293b'
              }}>
                📅 Lembretes de Consultas
              </h3>

              <button
                onClick={() => setShowAddAppointment(true)}
                style={{
                  padding: '0.5rem 1rem',
                  background: unbColors.primary,
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                + Adicionar Consulta
              </button>
            </div>

            {appointmentReminders.length === 0 ? (
              <p style={{
                textAlign: 'center',
                color: '#64748b',
                padding: '2rem'
              }}>
                Nenhuma consulta agendada
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {appointmentReminders.map(reminder => (
                  <ReminderCard
                    key={reminder.id}
                    title={reminder.title}
                    subtitle={`${new Date(reminder.date).toLocaleString('pt-BR')} - Lembrete: ${reminder.reminderTime}`}
                    enabled={reminder.enabled}
                    onRemove={() => handleRemoveAppointment(reminder.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Add Medication Modal */}
      {showAddMedication && (
        <AddMedicationModal
          onAdd={handleAddMedication}
          onClose={() => setShowAddMedication(false)}
        />
      )}

      {/* Add Appointment Modal */}
      {showAddAppointment && (
        <AddAppointmentModal
          onAdd={handleAddAppointment}
          onClose={() => setShowAddAppointment(false)}
        />
      )}
    </div>
  );
}

// Preference Toggle Component
function PreferenceToggle({
  label,
  description,
  checked,
  onChange
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.75rem 0',
      borderBottom: '1px solid #f1f5f9'
    }}>
      <div>
        <h4 style={{
          margin: 0,
          fontSize: '0.95rem',
          fontWeight: '600',
          color: '#1e293b'
        }}>
          {label}
        </h4>
        <p style={{
          margin: '0.25rem 0 0',
          fontSize: '0.875rem',
          color: '#64748b'
        }}>
          {description}
        </p>
      </div>

      <label style={{
        position: 'relative',
        display: 'inline-block',
        width: '48px',
        height: '24px'
      }}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          style={{
            opacity: 0,
            width: 0,
            height: 0
          }}
        />
        <span style={{
          position: 'absolute',
          cursor: 'pointer',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: checked ? '#10B981' : '#cbd5e1',
          transition: '0.2s',
          borderRadius: '24px'
        }}>
          <span style={{
            position: 'absolute',
            content: '',
            height: '18px',
            width: '18px',
            left: checked ? '26px' : '3px',
            bottom: '3px',
            background: 'white',
            transition: '0.2s',
            borderRadius: '50%'
          }} />
        </span>
      </label>
    </div>
  );
}

// Reminder Card Component
function ReminderCard({
  title,
  subtitle,
  enabled,
  onRemove
}: {
  title: string;
  subtitle: string;
  enabled: boolean;
  onRemove: () => void;
}) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '1rem',
      background: '#f8fafc',
      borderRadius: '8px',
      border: '1px solid #e2e8f0'
    }}>
      <div style={{ flex: 1 }}>
        <h4 style={{
          margin: 0,
          fontSize: '0.95rem',
          fontWeight: '600',
          color: '#1e293b'
        }}>
          {title}
        </h4>
        <p style={{
          margin: '0.25rem 0 0',
          fontSize: '0.875rem',
          color: '#64748b'
        }}>
          {subtitle}
        </p>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        {enabled && (
          <span style={{
            padding: '0.25rem 0.5rem',
            background: '#10B981',
            color: 'white',
            borderRadius: '4px',
            fontSize: '0.75rem',
            fontWeight: '600'
          }}>
            Ativo
          </span>
        )}

        <button
          onClick={onRemove}
          style={{
            padding: '0.5rem',
            background: '#EF4444',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          <XCircleIcon size={16} color="white" />
        </button>
      </div>
    </div>
  );
}

// Add Medication Modal
function AddMedicationModal({
  onAdd,
  onClose
}: {
  onAdd: (reminder: MedicationReminder) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    medicationName: '',
    dosage: '',
    time: '',
    frequency: 'daily' as const
  });

  const handleSubmit = () => {
    if (!formData.medicationName || !formData.dosage || !formData.time) {
      alert('Por favor, preencha todos os campos');
      return;
    }

    onAdd({
      id: `med_${Date.now()}`,
      medicationName: formData.medicationName,
      dosage: formData.dosage,
      time: formData.time,
      frequency: formData.frequency,
      enabled: true
    });
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '16px',
        maxWidth: '400px',
        width: '90%'
      }}>
        <h3 style={{
          margin: '0 0 1.5rem 0',
          fontSize: '1.25rem',
          fontWeight: 'bold',
          color: '#1e293b'
        }}>
          Adicionar Lembrete de Medicação
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#64748b',
              marginBottom: '0.25rem'
            }}>
              Nome do Medicamento
            </label>
            <input
              type="text"
              value={formData.medicationName}
              onChange={(e) => setFormData({ ...formData, medicationName: e.target.value })}
              placeholder="Ex: Rifampicina"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '0.95rem'
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#64748b',
              marginBottom: '0.25rem'
            }}>
              Dosagem
            </label>
            <input
              type="text"
              value={formData.dosage}
              onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
              placeholder="Ex: 600mg"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '0.95rem'
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#64748b',
              marginBottom: '0.25rem'
            }}>
              Horário
            </label>
            <input
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '0.95rem'
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#64748b',
              marginBottom: '0.25rem'
            }}>
              Frequência
            </label>
            <select
              value={formData.frequency}
              onChange={(e) => setFormData({ ...formData, frequency: e.target.value as 'daily' | 'weekly' | 'monthly' })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '0.95rem'
              }}
            >
              <option value="daily">Diariamente</option>
              <option value="weekly">Semanalmente</option>
              <option value="monthly">Mensalmente</option>
            </select>
          </div>
        </div>

        <div style={{
          display: 'flex',
          gap: '1rem',
          marginTop: '2rem'
        }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: '#f1f5f9',
              color: '#64748b',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.95rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Cancelar
          </button>

          <button
            onClick={handleSubmit}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: '#10B981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.95rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Adicionar
          </button>
        </div>
      </div>
    </div>
  );
}

// Add Appointment Modal
function AddAppointmentModal({
  onAdd,
  onClose
}: {
  onAdd: (reminder: AppointmentReminder) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    reminderTime: '1_hour' as const
  });

  const handleSubmit = () => {
    if (!formData.title || !formData.date || !formData.time) {
      alert('Por favor, preencha os campos obrigatórios');
      return;
    }

    const appointmentDate = new Date(`${formData.date}T${formData.time}`);

    onAdd({
      id: `appt_${Date.now()}`,
      title: formData.title,
      description: formData.description,
      date: appointmentDate,
      location: formData.location,
      reminderTime: formData.reminderTime as 'on_time' | '15_min' | '30_min' | '1_hour' | '1_day',
      enabled: true
    });
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        padding: '2rem',
        borderRadius: '16px',
        maxWidth: '400px',
        width: '90%',
        maxHeight: '80vh',
        overflowY: 'auto'
      }}>
        <h3 style={{
          margin: '0 0 1.5rem 0',
          fontSize: '1.25rem',
          fontWeight: 'bold',
          color: '#1e293b'
        }}>
          Adicionar Lembrete de Consulta
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#64748b',
              marginBottom: '0.25rem'
            }}>
              Título *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ex: Consulta de Retorno"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '0.95rem'
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#64748b',
              marginBottom: '0.25rem'
            }}>
              Descrição
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detalhes da consulta..."
              rows={3}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '0.95rem',
                resize: 'vertical'
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#64748b',
              marginBottom: '0.25rem'
            }}>
              Data *
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '0.95rem'
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#64748b',
              marginBottom: '0.25rem'
            }}>
              Horário *
            </label>
            <input
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '0.95rem'
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#64748b',
              marginBottom: '0.25rem'
            }}>
              Local
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Ex: UBS Centro"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '0.95rem'
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#64748b',
              marginBottom: '0.25rem'
            }}>
              Lembrar-me
            </label>
            <select
              value={formData.reminderTime}
              onChange={(e) => setFormData({ ...formData, reminderTime: e.target.value as 'on_time' | '15_min' | '30_min' | '1_hour' | '1_day' })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '0.95rem'
              }}
            >
              <option value="on_time">Na hora</option>
              <option value="15_min">15 minutos antes</option>
              <option value="30_min">30 minutos antes</option>
              <option value="1_hour">1 hora antes</option>
              <option value="1_day">1 dia antes</option>
            </select>
          </div>
        </div>

        <div style={{
          display: 'flex',
          gap: '1rem',
          marginTop: '2rem'
        }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: '#f1f5f9',
              color: '#64748b',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.95rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Cancelar
          </button>

          <button
            onClick={handleSubmit}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: '#10B981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.95rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Adicionar
          </button>
        </div>
      </div>
    </div>
  );
}