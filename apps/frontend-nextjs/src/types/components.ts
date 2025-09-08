// ============================================
// COMPONENT TYPES - Substituição de any em props
// ============================================

import { ReactNode, CSSProperties, RefObject } from 'react';
import { User, Module, ChatMessage } from './api';
import { ClickHandler, ChangeHandler, SubmitHandler } from './events';

// Base component types
export interface BaseComponentProps {
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  id?: string;
  'data-testid'?: string;
}

export interface ComponentWithRef<T = HTMLElement> extends BaseComponentProps {
  ref?: RefObject<T>;
}

// Layout components
export interface LayoutProps extends BaseComponentProps {
  header?: ReactNode;
  sidebar?: ReactNode;
  footer?: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: ReactNode;
  active?: boolean;
}

export interface ContainerProps extends BaseComponentProps {
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  padding?: boolean | 'sm' | 'md' | 'lg';
  centered?: boolean;
}

// Navigation components
export interface NavigationItem {
  label: string;
  href: string;
  icon?: ReactNode;
  badge?: string | number;
  children?: NavigationItem[];
  external?: boolean;
  disabled?: boolean;
}

export interface NavigationProps extends BaseComponentProps {
  items: NavigationItem[];
  activeItem?: string;
  onItemClick?: (item: NavigationItem) => void;
  collapsed?: boolean;
  variant?: 'horizontal' | 'vertical' | 'drawer';
}

// Form components
export interface InputProps extends BaseComponentProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
  name?: string;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;
  autoComplete?: string;
  autoFocus?: boolean;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'outlined' | 'filled' | 'standard';
  error?: boolean;
  helperText?: string;
  startAdornment?: ReactNode;
  endAdornment?: ReactNode;
  onChange?: ChangeHandler<HTMLInputElement>;
  onBlur?: ChangeHandler<HTMLInputElement>;
  onFocus?: ChangeHandler<HTMLInputElement>;
}

export interface SelectProps extends BaseComponentProps {
  name?: string;
  value?: string | string[];
  defaultValue?: string | string[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  multiple?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'outlined' | 'filled' | 'standard';
  error?: boolean;
  helperText?: string;
  options: SelectOption[];
  loading?: boolean;
  searchable?: boolean;
  creatable?: boolean;
  onChange?: (value: string | string[]) => void;
  onSearch?: (query: string) => void;
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  group?: string;
  icon?: ReactNode;
}

export interface TextareaProps extends BaseComponentProps {
  name?: string;
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;
  rows?: number;
  cols?: number;
  resize?: 'none' | 'both' | 'horizontal' | 'vertical';
  maxLength?: number;
  minLength?: number;
  variant?: 'outlined' | 'filled' | 'standard';
  error?: boolean;
  helperText?: string;
  onChange?: ChangeHandler<HTMLTextAreaElement>;
  onBlur?: ChangeHandler<HTMLTextAreaElement>;
}

export interface CheckboxProps extends BaseComponentProps {
  name?: string;
  value?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  required?: boolean;
  indeterminate?: boolean;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning';
  onChange?: (checked: boolean) => void;
}

export interface RadioProps extends BaseComponentProps {
  name?: string;
  value: string;
  checked?: boolean;
  disabled?: boolean;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning';
  onChange?: (value: string) => void;
}

// Button components
export interface ButtonProps extends BaseComponentProps {
  type?: 'button' | 'submit' | 'reset';
  variant?: 'contained' | 'outlined' | 'text' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning';
  disabled?: boolean;
  loading?: boolean;
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  fullWidth?: boolean;
  href?: string;
  target?: '_blank' | '_self' | '_parent' | '_top';
  download?: boolean | string;
  onClick?: ClickHandler<HTMLButtonElement>;
}

export interface IconButtonProps extends Omit<ButtonProps, 'startIcon' | 'endIcon'> {
  icon: ReactNode;
  'aria-label': string;
  tooltip?: string;
}

// Display components
export interface ModalProps extends BaseComponentProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  centered?: boolean;
  closable?: boolean;
  maskClosable?: boolean;
  footer?: ReactNode;
  loading?: boolean;
  scrollable?: boolean;
}

export interface DrawerProps extends BaseComponentProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  placement?: 'top' | 'right' | 'bottom' | 'left';
  size?: number | string;
  closable?: boolean;
  maskClosable?: boolean;
  footer?: ReactNode;
}

export interface TooltipProps extends BaseComponentProps {
  title: string;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
  trigger?: 'hover' | 'click' | 'focus' | 'contextMenu';
  visible?: boolean;
  onVisibleChange?: (visible: boolean) => void;
  delay?: number;
  mouseEnterDelay?: number;
  mouseLeaveDelay?: number;
}

export interface PopoverProps extends BaseComponentProps {
  content: ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  trigger?: 'hover' | 'click' | 'focus';
  visible?: boolean;
  onVisibleChange?: (visible: boolean) => void;
}

// Feedback components
export interface AlertProps extends BaseComponentProps {
  type?: 'success' | 'info' | 'warning' | 'error';
  title?: string;
  description?: string;
  closable?: boolean;
  showIcon?: boolean;
  icon?: ReactNode;
  action?: ReactNode;
  onClose?: () => void;
}

export interface NotificationProps {
  key: string;
  type?: 'success' | 'info' | 'warning' | 'error';
  title: string;
  description?: string;
  duration?: number;
  placement?: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';
  closable?: boolean;
  onClose?: () => void;
  onClick?: () => void;
  action?: ReactNode;
  icon?: ReactNode;
}

export interface LoadingProps extends BaseComponentProps {
  spinning?: boolean;
  size?: 'sm' | 'md' | 'lg';
  tip?: string;
  delay?: number;
  indicator?: ReactNode;
}

// Data display components
export interface TableColumn<T = unknown> {
  key: string;
  title: string;
  dataIndex?: keyof T;
  width?: number | string;
  fixed?: 'left' | 'right';
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: unknown, record: T, index: number) => ReactNode;
  align?: 'left' | 'center' | 'right';
}

export interface TableProps<T = unknown> extends BaseComponentProps {
  columns: TableColumn<T>[];
  data: T[];
  rowKey?: string | ((record: T) => string);
  loading?: boolean;
  pagination?: TablePagination | false;
  sortable?: boolean;
  filterable?: boolean;
  selectable?: boolean;
  selectedRowKeys?: string[];
  onSelectionChange?: (selectedKeys: string[], selectedRows: T[]) => void;
  onRowClick?: (record: T, index: number) => void;
  onSort?: (field: string, direction: 'asc' | 'desc') => void;
  onFilter?: (filters: Record<string, unknown>) => void;
  expandable?: {
    expandedRowRender: (record: T) => ReactNode;
    expandedRowKeys?: string[];
    onExpandedRowsChange?: (expandedKeys: string[]) => void;
  };
}

export interface TablePagination {
  current: number;
  pageSize: number;
  total: number;
  showSizeChanger?: boolean;
  showQuickJumper?: boolean;
  showTotal?: (total: number, range: [number, number]) => ReactNode;
  onChange?: (page: number, pageSize: number) => void;
}

export interface CardProps extends BaseComponentProps {
  title?: ReactNode;
  extra?: ReactNode;
  cover?: ReactNode;
  actions?: ReactNode[];
  loading?: boolean;
  hoverable?: boolean;
  bordered?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export interface ListProps<T = unknown> extends BaseComponentProps {
  data: T[];
  renderItem: (item: T, index: number) => ReactNode;
  loading?: boolean;
  empty?: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  pagination?: TablePagination | false;
  grid?: {
    gutter?: number;
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    xxl?: number;
  };
}

// Specialized components
export interface UserAvatarProps extends BaseComponentProps {
  user: User;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  shape?: 'circle' | 'square';
  showName?: boolean;
  showStatus?: boolean;
  clickable?: boolean;
  onClick?: (user: User) => void;
}

export interface ModuleCardProps extends BaseComponentProps {
  module: Module;
  progress?: number;
  variant?: 'default' | 'compact' | 'detailed';
  actions?: ReactNode;
  onClick?: (module: Module) => void;
}

export interface ChatBubbleProps extends BaseComponentProps {
  message: ChatMessage;
  variant?: 'user' | 'assistant';
  showAvatar?: boolean;
  showTimestamp?: boolean;
  actions?: ReactNode;
}

export interface ProgressBarProps extends BaseComponentProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'warning';
  showLabel?: boolean;
  label?: string;
  animated?: boolean;
  striped?: boolean;
}

export interface BreadcrumbsProps extends BaseComponentProps {
  items: BreadcrumbItem[];
  separator?: ReactNode;
  maxItems?: number;
  itemRender?: (item: BreadcrumbItem, index: number) => ReactNode;
}

// Generic component props
export interface WithLoadingProps {
  loading?: boolean;
  loadingComponent?: ReactNode;
}

export interface WithErrorProps {
  error?: Error | string;
  errorComponent?: ReactNode;
  onRetry?: () => void;
}

export interface WithEmptyProps<T = unknown> {
  data: T[];
  emptyComponent?: ReactNode;
  emptyText?: string;
}

// Higher-order component types
export type WithProps<P, W> = P & W;
export type ComponentWithProps<C, P> = C extends React.ComponentType<infer CP> 
  ? React.ComponentType<WithProps<CP, P>> 
  : never;

// Utility types
export type PropsOf<C> = C extends React.ComponentType<infer P> ? P : never;
export type RefOf<C> = C extends React.ComponentType<{ ref?: infer R }> ? R : never;