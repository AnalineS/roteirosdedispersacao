import React from 'react'
import { motion } from 'framer-motion'
import { 
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  WifiIcon
} from '@heroicons/react/24/outline'

// Loading State Component
interface LoadingStateProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'spinner' | 'dots' | 'pulse'
  className?: string
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Carregando...',
  size = 'md',
  variant = 'spinner',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  const Spinner = () => (
    <motion.div
      className={`border-2 border-primary-200 border-t-primary-600 rounded-full ${sizeClasses[size]}`}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      aria-hidden="true"
    />
  )

  const Dots = () => (
    <div className="flex space-x-1" aria-hidden="true">
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className={`bg-primary-600 rounded-full ${size === 'sm' ? 'w-1 h-1' : size === 'md' ? 'w-2 h-2' : 'w-3 h-3'}`}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: index * 0.2
          }}
        />
      ))}
    </div>
  )

  const Pulse = () => (
    <motion.div
      className={`bg-primary-600 rounded-full ${sizeClasses[size]}`}
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.5, 1, 0.5]
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity
      }}
      aria-hidden="true"
    />
  )

  const renderAnimation = () => {
    switch (variant) {
      case 'dots':
        return <Dots />
      case 'pulse':
        return <Pulse />
      default:
        return <Spinner />
    }
  }

  return (
    <div className={`flex flex-col items-center justify-center space-y-3 ${className}`}>
      {renderAnimation()}
      <p className="text-sm text-gray-600 dark:text-gray-400" aria-live="polite">
        {message}
      </p>
    </div>
  )
}

// Error State Component
interface ErrorStateProps {
  title?: string
  message: string
  action?: {
    label: string
    onClick: () => void
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  variant?: 'error' | 'warning' | 'network'
  className?: string
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title,
  message,
  action,
  secondaryAction,
  variant = 'error',
  className = ''
}) => {
  const getIcon = () => {
    switch (variant) {
      case 'warning':
        return <ExclamationTriangleIcon className="w-12 h-12 text-warning-500" />
      case 'network':
        return <WifiIcon className="w-12 h-12 text-error-500" />
      default:
        return <XCircleIcon className="w-12 h-12 text-error-500" />
    }
  }

  const getColors = () => {
    switch (variant) {
      case 'warning':
        return {
          bg: 'bg-warning-50 dark:bg-warning-900/10',
          border: 'border-warning-200 dark:border-warning-800',
          title: 'text-warning-800 dark:text-warning-200',
          message: 'text-warning-600 dark:text-warning-300'
        }
      default:
        return {
          bg: 'bg-error-50 dark:bg-error-900/10',
          border: 'border-error-200 dark:border-error-800',
          title: 'text-error-800 dark:text-error-200',
          message: 'text-error-600 dark:text-error-300'
        }
    }
  }

  const colors = getColors()

  return (
    <div className={`rounded-lg border p-6 text-center ${colors.bg} ${colors.border} ${className}`}>
      <div className="flex justify-center mb-4">
        {getIcon()}
      </div>
      
      {title && (
        <h3 className={`text-lg font-semibold mb-2 ${colors.title}`}>
          {title}
        </h3>
      )}
      
      <p className={`text-sm mb-6 ${colors.message}`}>
        {message}
      </p>
      
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {action && (
          <button
            onClick={action.onClick}
            className="btn-primary btn-md flex items-center justify-center space-x-2"
          >
            <ArrowPathIcon className="w-4 h-4" />
            <span>{action.label}</span>
          </button>
        )}
        
        {secondaryAction && (
          <button
            onClick={secondaryAction.onClick}
            className="btn-secondary btn-md"
          >
            {secondaryAction.label}
          </button>
        )}
      </div>
    </div>
  )
}

// Success State Component
interface SuccessStateProps {
  title?: string
  message: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export const SuccessState: React.FC<SuccessStateProps> = ({
  title,
  message,
  action,
  className = ''
}) => {
  return (
    <div className={`bg-success-50 dark:bg-success-900/10 border border-success-200 dark:border-success-800 rounded-lg p-6 text-center ${className}`}>
      <div className="flex justify-center mb-4">
        <CheckCircleIcon className="w-12 h-12 text-success-500" />
      </div>
      
      {title && (
        <h3 className="text-lg font-semibold text-success-800 dark:text-success-200 mb-2">
          {title}
        </h3>
      )}
      
      <p className="text-sm text-success-600 dark:text-success-300 mb-6">
        {message}
      </p>
      
      {action && (
        <button
          onClick={action.onClick}
          className="btn-success btn-md"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

// Empty State Component
interface EmptyStateProps {
  title: string
  message: string
  action?: {
    label: string
    onClick: () => void
  }
  icon?: React.ReactNode
  className?: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
  action,
  icon,
  className = ''
}) => {
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="flex justify-center mb-4">
        {icon || <InformationCircleIcon className="w-12 h-12 text-gray-400" />}
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h3>
      
      <p className="text-sm text-gray-600 dark:text-gray-400 max-w-sm mx-auto mb-6">
        {message}
      </p>
      
      {action && (
        <button
          onClick={action.onClick}
          className="btn-primary btn-md"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

// Combined Feedback Component
interface FeedbackProps {
  state: 'loading' | 'error' | 'success' | 'empty'
  loading?: LoadingStateProps
  error?: ErrorStateProps
  success?: SuccessStateProps
  empty?: EmptyStateProps
  className?: string
}

export const Feedback: React.FC<FeedbackProps> = ({
  state,
  loading,
  error,
  success,
  empty,
  className = ''
}) => {
  const renderState = () => {
    switch (state) {
      case 'loading':
        return <LoadingState {...loading} />
      case 'error':
        return <ErrorState {...(error as ErrorStateProps)} />
      case 'success':
        return <SuccessState {...(success as SuccessStateProps)} />
      case 'empty':
        return <EmptyState {...(empty as EmptyStateProps)} />
      default:
        return null
    }
  }

  return (
    <div className={`flex items-center justify-center p-6 ${className}`}>
      {renderState()}
    </div>
  )
}

export default Feedback