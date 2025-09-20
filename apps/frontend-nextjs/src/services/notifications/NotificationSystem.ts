'use client';

/**
 * Advanced PWA Notification System
 * Sistema completo de notificações com push notifications, lembretes e alertas médicos
 */

import { secureLogger } from '@/utils/secureLogger';

export interface NotificationData {
  type?: 'medication' | 'appointment' | 'emergency' | 'educational' | 'reminder';
  reminderId?: string;
  location?: string;
  emergency?: boolean;
  moduleId?: string;
  [key: string]: unknown;
}

export interface NotificationConfig {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  vibrate?: number[];
  data?: NotificationData;
  actions?: NotificationAction[];
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  timestamp?: number;
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface NotificationPreferences {
  enabled: boolean;
  dailyReminders: boolean;
  appointmentReminders: boolean;
  medicationAlerts: boolean;
  emergencyAlerts: boolean;
  educationalTips: boolean;
  sound: boolean;
  vibration: boolean;
  quietHours: {
    enabled: boolean;
    start: string; // "22:00"
    end: string;   // "08:00"
  };
}

export interface MedicationReminder {
  id: string;
  medicationName: string;
  dosage: string;
  time: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  enabled: boolean;
  nextReminder?: Date;
}

export interface AppointmentReminder {
  id: string;
  title: string;
  description: string;
  date: Date;
  location?: string;
  reminderTime: 'on_time' | '15_min' | '30_min' | '1_hour' | '1_day';
  enabled: boolean;
}

class NotificationSystemClass {
  private static instance: NotificationSystemClass;
  private permission: NotificationPermission = 'default';
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private preferences: NotificationPreferences = this.getDefaultPreferences();
  private medicationReminders: Map<string, MedicationReminder> = new Map();
  private appointmentReminders: Map<string, AppointmentReminder> = new Map();
  private scheduledNotifications: Map<string, number> = new Map();

  private constructor() {
    this.initializeSystem();
  }

  static getInstance(): NotificationSystemClass {
    if (!NotificationSystemClass.instance) {
      NotificationSystemClass.instance = new NotificationSystemClass();
    }
    return NotificationSystemClass.instance;
  }

  private getDefaultPreferences(): NotificationPreferences {
    // Usar variável GitHub configurada para controlar notificações
    const notificationsEnabled = process.env.NEXT_PUBLIC_ENABLE_NOTIFICATIONS === 'true' ||
                                  typeof window !== 'undefined';

    return {
      enabled: notificationsEnabled,
      dailyReminders: true,
      appointmentReminders: true,
      medicationAlerts: true,
      emergencyAlerts: true,
      educationalTips: false,
      sound: true,
      vibration: true,
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '08:00'
      }
    };
  }

  private async initializeSystem() {
    // Check if browser supports notifications
    if (!('Notification' in window)) {
      secureLogger.warn('This browser does not support notifications');
      return;
    }

    // Load saved preferences
    this.loadPreferences();

    // Check current permission
    this.permission = Notification.permission;

    // Register service worker for push notifications
    await this.registerServiceWorker();

    // Initialize scheduled notifications
    this.initializeScheduledNotifications();
  }

  private loadPreferences() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('notification_preferences');
      if (saved) {
        try {
          this.preferences = JSON.parse(saved);
        } catch (e) {
          secureLogger.error('Failed to load notification preferences', e instanceof Error ? e : new Error(String(e)));
        }
      }

      // Load medication reminders
      const savedMeds = localStorage.getItem('medication_reminders');
      if (savedMeds) {
        try {
          const meds = JSON.parse(savedMeds);
          this.medicationReminders = new Map(meds);
        } catch (e) {
          secureLogger.error('Failed to load medication reminders', e instanceof Error ? e : new Error(String(e)));
        }
      }

      // Load appointment reminders
      const savedAppts = localStorage.getItem('appointment_reminders');
      if (savedAppts) {
        try {
          const appts = JSON.parse(savedAppts);
          this.appointmentReminders = new Map(appts);
        } catch (e) {
          secureLogger.error('Failed to load appointment reminders', e instanceof Error ? e : new Error(String(e)));
        }
      }
    }
  }

  private savePreferences() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('notification_preferences', JSON.stringify(this.preferences));
      localStorage.setItem('medication_reminders', JSON.stringify(Array.from(this.medicationReminders.entries())));
      localStorage.setItem('appointment_reminders', JSON.stringify(Array.from(this.appointmentReminders.entries())));
    }
  }

  private async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        this.serviceWorkerRegistration = registration;
        secureLogger.info('Service Worker ready for notifications');
      } catch (error) {
        secureLogger.error('Service Worker registration failed', error instanceof Error ? error : new Error(String(error)));
      }
    }
  }

  private initializeScheduledNotifications() {
    // Clear existing scheduled notifications
    this.scheduledNotifications.forEach(timeoutId => clearTimeout(timeoutId));
    this.scheduledNotifications.clear();

    // Schedule medication reminders
    this.medicationReminders.forEach(reminder => {
      if (reminder.enabled) {
        this.scheduleMedicationReminder(reminder);
      }
    });

    // Schedule appointment reminders
    this.appointmentReminders.forEach(reminder => {
      if (reminder.enabled) {
        this.scheduleAppointmentReminder(reminder);
      }
    });
  }

  private scheduleMedicationReminder(reminder: MedicationReminder) {
    const now = new Date();
    const [hours, minutes] = reminder.time.split(':').map(Number);
    const scheduledTime = new Date();
    scheduledTime.setHours(hours, minutes, 0, 0);

    // If time has passed today, schedule for tomorrow
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const delay = scheduledTime.getTime() - now.getTime();

    const timeoutId = window.setTimeout(() => {
      this.showMedicationNotification(reminder);

      // Reschedule based on frequency
      if (reminder.frequency === 'daily') {
        this.scheduleMedicationReminder(reminder);
      }
    }, delay);

    this.scheduledNotifications.set(`med_${reminder.id}`, timeoutId);
  }

  private scheduleAppointmentReminder(reminder: AppointmentReminder) {
    const now = new Date();
    const appointmentTime = new Date(reminder.date);
    let reminderTime = new Date(appointmentTime);

    // Calculate reminder time based on preference
    switch (reminder.reminderTime) {
      case '15_min':
        reminderTime.setMinutes(reminderTime.getMinutes() - 15);
        break;
      case '30_min':
        reminderTime.setMinutes(reminderTime.getMinutes() - 30);
        break;
      case '1_hour':
        reminderTime.setHours(reminderTime.getHours() - 1);
        break;
      case '1_day':
        reminderTime.setDate(reminderTime.getDate() - 1);
        break;
    }

    if (reminderTime > now) {
      const delay = reminderTime.getTime() - now.getTime();

      const timeoutId = window.setTimeout(() => {
        this.showAppointmentNotification(reminder);
      }, delay);

      this.scheduledNotifications.set(`appt_${reminder.id}`, timeoutId);
    }
  }

  private isQuietHours(): boolean {
    if (!this.preferences.quietHours.enabled) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const [startHour, startMin] = this.preferences.quietHours.start.split(':').map(Number);
    const [endHour, endMin] = this.preferences.quietHours.end.split(':').map(Number);

    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime < endTime;
    } else {
      // Quiet hours cross midnight
      return currentTime >= startTime || currentTime < endTime;
    }
  }

  // Public API

  async requestPermission(): Promise<NotificationPermission> {
    if (this.permission === 'granted') {
      return 'granted';
    }

    if (this.permission === 'denied') {
      secureLogger.warn('Notifications have been denied by the user');
      return 'denied';
    }

    try {
      this.permission = await Notification.requestPermission();

      if (this.permission === 'granted') {
        this.preferences.enabled = true;
        this.savePreferences();

        // Show welcome notification
        this.show({
          title: '🔔 Notificações Ativadas',
          body: 'Você receberá lembretes importantes sobre seu tratamento',
          icon: '/icons/icon-192x192.png'
        });
      }

      return this.permission;
    } catch (error) {
      secureLogger.error('Error requesting notification permission', error instanceof Error ? error : new Error(String(error)));
      return 'default';
    }
  }

  async show(config: NotificationConfig): Promise<void> {
    // Check if notifications are enabled and permitted
    if (!this.preferences.enabled || this.permission !== 'granted') {
      secureLogger.warn('Notifications not enabled or permitted');
      return;
    }

    // Check quiet hours (except for emergency alerts)
    if (this.isQuietHours() && !config.data?.emergency) {
      secureLogger.info('Notification suppressed during quiet hours');
      return;
    }

    try {
      // Use service worker if available for better reliability
      if (this.serviceWorkerRegistration) {
        await this.serviceWorkerRegistration.showNotification(config.title, {
          body: config.body,
          icon: config.icon || '/icons/icon-192x192.png',
          badge: config.badge || '/icons/badge-72x72.png',
          data: config.data,
          tag: config.tag,
          requireInteraction: config.requireInteraction,
          silent: config.silent || !this.preferences.sound
        });
      } else {
        // Fallback to regular notification
        new Notification(config.title, {
          body: config.body,
          icon: config.icon || '/icons/icon-192x192.png',
          badge: config.badge || '/icons/badge-72x72.png',
          data: config.data,
          tag: config.tag,
          requireInteraction: config.requireInteraction,
          silent: config.silent || !this.preferences.sound
        });
      }
    } catch (error) {
      secureLogger.error('Failed to show notification', error instanceof Error ? error : new Error(String(error)));
    }
  }

  private async showMedicationNotification(reminder: MedicationReminder) {
    if (!this.preferences.medicationAlerts) return;

    await this.show({
      title: '💊 Hora da Medicação',
      body: `${reminder.medicationName} - ${reminder.dosage}`,
      icon: '/icons/medication-icon.png',
      requireInteraction: true,
      actions: [
        { action: 'take', title: '✅ Tomei' },
        { action: 'snooze', title: '⏰ Lembrar em 15min' }
      ],
      data: {
        type: 'medication',
        reminderId: reminder.id
      }
    });
  }

  private async showAppointmentNotification(reminder: AppointmentReminder) {
    if (!this.preferences.appointmentReminders) return;

    const timeUntil = this.getTimeUntilString(new Date(reminder.date));

    await this.show({
      title: '📅 Lembrete de Consulta',
      body: `${reminder.title} - ${timeUntil}`,
      icon: '/icons/appointment-icon.png',
      requireInteraction: true,
      actions: [
        { action: 'confirm', title: '✅ Confirmar' },
        { action: 'details', title: '📋 Ver Detalhes' }
      ],
      data: {
        type: 'appointment',
        reminderId: reminder.id,
        location: reminder.location
      }
    });
  }

  private getTimeUntilString(date: Date): string {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `em ${days} dia${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `em ${hours} hora${hours > 1 ? 's' : ''}`;
    } else if (minutes > 0) {
      return `em ${minutes} minuto${minutes > 1 ? 's' : ''}`;
    } else {
      return 'agora';
    }
  }

  // Medication reminder management

  addMedicationReminder(reminder: MedicationReminder): void {
    this.medicationReminders.set(reminder.id, reminder);
    if (reminder.enabled) {
      this.scheduleMedicationReminder(reminder);
    }
    this.savePreferences();
  }

  removeMedicationReminder(id: string): void {
    this.medicationReminders.delete(id);
    const timeoutId = this.scheduledNotifications.get(`med_${id}`);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.scheduledNotifications.delete(`med_${id}`);
    }
    this.savePreferences();
  }

  getMedicationReminders(): MedicationReminder[] {
    return Array.from(this.medicationReminders.values());
  }

  // Appointment reminder management

  addAppointmentReminder(reminder: AppointmentReminder): void {
    this.appointmentReminders.set(reminder.id, reminder);
    if (reminder.enabled) {
      this.scheduleAppointmentReminder(reminder);
    }
    this.savePreferences();
  }

  removeAppointmentReminder(id: string): void {
    this.appointmentReminders.delete(id);
    const timeoutId = this.scheduledNotifications.get(`appt_${id}`);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.scheduledNotifications.delete(`appt_${id}`);
    }
    this.savePreferences();
  }

  getAppointmentReminders(): AppointmentReminder[] {
    return Array.from(this.appointmentReminders.values());
  }

  // Preference management

  updatePreferences(preferences: Partial<NotificationPreferences>): void {
    this.preferences = { ...this.preferences, ...preferences };
    this.savePreferences();

    // Reinitialize scheduled notifications if needed
    if (preferences.medicationAlerts !== undefined ||
        preferences.appointmentReminders !== undefined ||
        preferences.quietHours !== undefined) {
      this.initializeScheduledNotifications();
    }
  }

  getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }

  getPermissionStatus(): NotificationPermission {
    return this.permission;
  }

  isEnabled(): boolean {
    return this.preferences.enabled && this.permission === 'granted';
  }

  // Test notifications

  async testNotification(): Promise<void> {
    await this.show({
      title: '🧪 Notificação de Teste',
      body: 'Esta é uma notificação de teste do sistema',
      icon: '/icons/icon-192x192.png',
      actions: [
        { action: 'ok', title: 'OK' }
      ]
    });
  }

  async showEducationalTip(tip: string): Promise<void> {
    if (!this.preferences.educationalTips) return;

    await this.show({
      title: '💡 Dica Educacional',
      body: tip,
      icon: '/icons/education-icon.png',
      tag: 'educational-tip'
    });
  }

  async showEmergencyAlert(message: string): Promise<void> {
    // Emergency alerts bypass quiet hours and other restrictions
    await this.show({
      title: '🚨 ALERTA DE EMERGÊNCIA',
      body: message,
      icon: '/icons/emergency-icon.png',
      requireInteraction: true,
      data: { emergency: true }
    });
  }
}

// Export singleton instance
const NotificationSystem = NotificationSystemClass.getInstance();
export default NotificationSystem;