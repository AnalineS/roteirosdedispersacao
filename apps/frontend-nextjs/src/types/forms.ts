// ============================================
// FORM TYPES - Substituição de any em forms
// ============================================

import { ChangeEvent, FormEvent } from './events';

// Base form types
export interface BaseFormData {
  [key: string]: FormDataValue;
}

export type FormDataValue = string | number | boolean | File | File[] | null | undefined;

// Specific form types
export interface LoginFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptTerms: boolean;
}

export interface ProfileFormData {
  name: string;
  email: string;
  phone?: string;
  avatar?: File;
  bio?: string;
  preferences: {
    notifications: boolean;
    theme: 'light' | 'dark' | 'auto';
    language: string;
  };
}

export interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
  attachments?: File[];
}

export interface FeedbackFormData {
  rating: number;
  category: 'bug' | 'feature' | 'improvement' | 'other';
  title: string;
  description: string;
  screenshots?: File[];
  userInfo?: {
    browser: string;
    os: string;
    url: string;
  };
}

export interface SearchFormData {
  query: string;
  filters?: {
    category?: string;
    dateRange?: {
      start: Date;
      end: Date;
    };
    tags?: string[];
  };
  sortBy?: 'relevance' | 'date' | 'popularity';
  limit?: number;
}

// Medical/Health specific forms
export interface PatientFormData {
  personalInfo: {
    name: string;
    birthDate: string;
    gender: 'male' | 'female' | 'other';
    cpf: string;
    phone: string;
    email?: string;
  };
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  medicalInfo: {
    allergies?: string[];
    medications?: string[];
    conditions?: string[];
    emergencyContact?: {
      name: string;
      phone: string;
      relationship: string;
    };
  };
}

export interface MedicationFormData {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  sideEffects?: string[];
  contraindications?: string[];
}

// Form validation types
export interface ValidationRule<T = FormDataValue> {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  validator?: (value: T) => boolean | string;
  message?: string;
}

export type FormValidation<T extends BaseFormData = BaseFormData> = {
  [K in keyof T]?: ValidationRule<T[K]>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  warnings: Record<string, string>;
}

// Form state management
export interface FormState<T extends BaseFormData = BaseFormData> {
  data: T;
  errors: Record<keyof T, string>;
  touched: Record<keyof T, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
}

export interface FormConfig<T extends BaseFormData = BaseFormData> {
  initialData: T;
  validation?: FormValidation<T>;
  onSubmit: (data: T) => Promise<void> | void;
  onValidate?: (data: T) => ValidationResult;
  onChange?: (field: keyof T, value: FormDataValue) => void;
  resetOnSubmit?: boolean;
  validateOnChange?: boolean;
}

// Form field types
export interface FormFieldProps<T = FormDataValue> {
  name: string;
  value: T;
  onChange: (value: T) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
}

export interface FormSelectOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
  group?: string;
}

export interface FileUploadConfig {
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in bytes
  maxFiles?: number;
  onProgress?: (progress: number) => void;
  onError?: (error: string) => void;
}

// Form submission types
export interface FormSubmissionResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  validationErrors?: Record<string, string>;
}

export interface FormSubmissionContext {
  formData: BaseFormData;
  timestamp: number;
  userAgent: string;
  url: string;
  referrer?: string;
}

// Form events
export type FormChangeEvent<T extends BaseFormData = BaseFormData> = {
  field: keyof T;
  value: FormDataValue;
  previousValue: FormDataValue;
  formData: T;
};

export type TypedFormSubmitEvent<T extends BaseFormData = BaseFormData> = FormEvent<HTMLFormElement> & {
  formData: T;
  isValid: boolean;
};

// Utility types
export type FormDataKeys<T extends BaseFormData> = keyof T;
export type FormDataValues<T extends BaseFormData> = T[keyof T];
export type PartialFormData<T extends BaseFormData> = Partial<T>;
export type RequiredFormData<T extends BaseFormData> = Required<T>;

// Form builder types
export interface FormField {
  name: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea' | 'checkbox' | 'radio' | 'file' | 'date';
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: FormSelectOption[];
  validation?: ValidationRule;
  grid?: {
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
  };
}

export interface FormSection {
  title: string;
  description?: string;
  fields: FormField[];
}

export interface DynamicFormConfig {
  title: string;
  description?: string;
  sections: FormSection[];
  submitLabel?: string;
  resetLabel?: string;
}