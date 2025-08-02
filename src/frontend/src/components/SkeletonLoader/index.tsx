import React from 'react'
import { motion } from 'framer-motion'

interface SkeletonLoaderProps {
  width?: string | number
  height?: string | number
  className?: string
  variant?: 'text' | 'circular' | 'rectangular' | 'card' | 'avatar' | 'button'
  lines?: number
  animated?: boolean
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = '1rem',
  className = '',
  variant = 'rectangular',
  lines = 1,
  animated = true
}) => {
  const baseClasses = 'bg-gray-200 dark:bg-gray-700'
  const animationClasses = animated ? 'animate-pulse' : ''

  const getVariantClasses = () => {
    switch (variant) {
      case 'text':
        return 'rounded-sm h-4'
      case 'circular':
        return 'rounded-full'
      case 'rectangular':
        return 'rounded'
      case 'card':
        return 'rounded-lg'
      case 'avatar':
        return 'rounded-full w-10 h-10'
      case 'button':
        return 'rounded-lg h-10'
      default:
        return 'rounded'
    }
  }

  const getSize = () => {
    if (variant === 'avatar') {
      return { width: '2.5rem', height: '2.5rem' }
    }
    if (variant === 'button') {
      return { width: width || '120px', height: '2.5rem' }
    }
    return { width, height }
  }

  if (variant === 'text' && lines > 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`${baseClasses} ${animationClasses} ${getVariantClasses()}`}
            style={{
              width: index === lines - 1 ? '75%' : '100%',
              height: '1rem'
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <div
      className={`${baseClasses} ${animationClasses} ${getVariantClasses()} ${className}`}
      style={getSize()}
    />
  )
}

// Specialized skeleton components
export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`card p-6 space-y-4 ${className}`}>
    <div className="flex items-center space-x-3">
      <SkeletonLoader variant="avatar" />
      <div className="flex-1 space-y-2">
        <SkeletonLoader variant="text" width="40%" />
        <SkeletonLoader variant="text" width="60%" />
      </div>
    </div>
    <SkeletonLoader variant="text" lines={3} />
    <SkeletonLoader variant="button" width="120px" />
  </div>
)

export const SkeletonPersonaCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`card-medical p-6 text-center space-y-4 ${className}`}>
    <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto animate-pulse" />
    <div className="space-y-2">
      <SkeletonLoader variant="text" width="60%" className="mx-auto" />
      <SkeletonLoader variant="text" lines={2} />
    </div>
    <SkeletonLoader variant="text" width="40%" className="mx-auto" />
    <SkeletonLoader variant="button" width="100%" />
  </div>
)

export const SkeletonMessage: React.FC<{ 
  isUser?: boolean
  className?: string 
}> = ({ isUser = false, className = '' }) => (
  <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} ${className}`}>
    <div className={`max-w-xs sm:max-w-sm p-3 sm:p-4 rounded-2xl space-y-2 ${
      isUser 
        ? 'bg-primary-100 dark:bg-primary-900/20 rounded-br-sm' 
        : 'bg-gray-100 dark:bg-gray-800 rounded-bl-sm'
    }`}>
      <SkeletonLoader variant="text" lines={Math.floor(Math.random() * 3) + 1} />
    </div>
  </div>
)

export const SkeletonNavigation: React.FC<{ className?: string }> = ({ className = '' }) => (
  <nav className={`glass sticky top-0 z-50 border-b ${className}`}>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center h-16">
        <div className="flex items-center space-x-2">
          <SkeletonLoader variant="rectangular" width="32px" height="32px" />
          <SkeletonLoader variant="text" width="200px" />
        </div>
        <div className="hidden md:flex items-center space-x-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonLoader key={index} variant="text" width="80px" />
          ))}
        </div>
        <div className="md:hidden">
          <SkeletonLoader variant="rectangular" width="40px" height="40px" />
        </div>
      </div>
    </div>
  </nav>
)

export const SkeletonStats: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`grid grid-cols-1 sm:grid-cols-3 gap-6 lg:gap-8 ${className}`}>
    {Array.from({ length: 3 }).map((_, index) => (
      <div key={index} className="card-medical p-6 text-center space-y-3">
        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto animate-pulse" />
        <SkeletonLoader variant="text" width="60px" className="mx-auto" />
        <SkeletonLoader variant="text" width="120px" className="mx-auto" />
      </div>
    ))}
  </div>
)

export const SkeletonChatHeader: React.FC<{ className?: string }> = ({ className = '' }) => (
  <header className={`bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-4 ${className}`}>
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
        <SkeletonLoader variant="rectangular" width="40px" height="40px" className="lg:hidden" />
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          <SkeletonLoader variant="avatar" />
          <div className="min-w-0 flex-1 space-y-1">
            <SkeletonLoader variant="text" width="120px" />
            <SkeletonLoader variant="text" width="60px" />
          </div>
        </div>
      </div>
      <SkeletonLoader variant="rectangular" width="40px" height="40px" />
    </div>
  </header>
)

// Advanced skeleton with shimmer effect
export const SkeletonShimmer: React.FC<SkeletonLoaderProps> = (props) => (
  <motion.div
    className="relative overflow-hidden"
    animate={{
      backgroundPosition: ['200% 0', '-200% 0'],
    }}
    transition={{
      duration: 1.5,
      ease: 'linear',
      repeat: Infinity,
    }}
    style={{
      background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
      backgroundSize: '200% 100%',
    }}
  >
    <SkeletonLoader {...props} animated={false} />
  </motion.div>
)

// Loading page skeleton
export const SkeletonPage: React.FC<{ type?: 'home' | 'chat' | 'about' }> = ({ type = 'home' }) => {
  switch (type) {
    case 'home':
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
          <SkeletonNavigation />
          <main className="flex-1">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
              {/* Hero section */}
              <div className="text-center mb-12 lg:mb-16 space-y-6">
                <SkeletonLoader variant="text" width="80%" height="3rem" className="mx-auto" />
                <SkeletonLoader variant="text" lines={2} className="max-w-3xl mx-auto" />
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <SkeletonLoader variant="button" width="180px" />
                  <SkeletonLoader variant="button" width="160px" />
                </div>
              </div>
              
              {/* Cards grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-12">
                {Array.from({ length: 6 }).map((_, index) => (
                  <SkeletonPersonaCard key={index} />
                ))}
              </div>
              
              {/* Stats */}
              <SkeletonStats />
            </div>
          </main>
        </div>
      )
    
    case 'chat':
      return (
        <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
          <div className="flex-1 flex flex-col min-w-0">
            <SkeletonChatHeader />
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
              <div className="max-w-3xl sm:max-w-4xl mx-auto space-y-3 sm:space-y-4">
                {Array.from({ length: 6 }).map((_, index) => (
                  <SkeletonMessage 
                    key={index} 
                    isUser={index % 2 === 0}
                  />
                ))}
              </div>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 sm:p-4">
              <div className="max-w-3xl sm:max-w-4xl mx-auto">
                <SkeletonLoader variant="rectangular" height="48px" />
              </div>
            </div>
          </div>
        </div>
      )
    
    default:
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <SkeletonNavigation />
          <main className="flex-1 p-8">
            <div className="max-w-4xl mx-auto space-y-8">
              <SkeletonLoader variant="text" width="60%" height="2rem" />
              <SkeletonLoader variant="text" lines={8} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SkeletonCard />
                <SkeletonCard />
              </div>
            </div>
          </main>
        </div>
      )
  }
}

export default SkeletonLoader