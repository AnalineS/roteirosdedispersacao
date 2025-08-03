import { Suspense, lazy, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'

import Layout from '@components/Layout'
import ErrorBoundary from '@components/ErrorBoundary'
import { SkeletonPage } from '@components/SkeletonLoader'
import { ThemeProvider } from '@components/ThemeProvider'
import { ChatProvider } from '@hooks/useChat'
import { DebugPanel } from '@components/DebugPanel'
import { performanceMonitor, BundleOptimizer } from '@utils/performanceOptimizer'

// Lazy load pages
const HomePage = lazy(() => import('@pages/HomePage'))
const ChatPage = lazy(() => import('@pages/ChatPage'))
const AboutPage = lazy(() => import('@pages/AboutPage'))
const ResourcesPage = lazy(() => import('@pages/ResourcesPage'))
const NotFoundPage = lazy(() => import('@pages/NotFoundPage'))

function App() {
  // Remove loading screen when React app is ready
  useEffect(() => {
    const removeLoadingScreen = () => {
      const loadingScreen = document.getElementById('loading-screen')
      if (loadingScreen) {
        loadingScreen.classList.add('fade-out')
        setTimeout(() => {
          loadingScreen.style.display = 'none'
        }, 500)
      }
    }

    // Remove loading screen immediately when App component mounts
    const timer = setTimeout(removeLoadingScreen, 100)
    
    return () => clearTimeout(timer)
  }, [])

  // Initialize performance monitoring
  useEffect(() => {
    // Preload critical resources
    BundleOptimizer.preloadCriticalResources()
    
    // Report performance after page load
    const reportPerformance = () => {
      setTimeout(() => {
        performanceMonitor.reportPerformance()
      }, 3000)
    }
    
    if (document.readyState === 'complete') {
      reportPerformance()
    } else {
      window.addEventListener('load', reportPerformance)
      return () => window.removeEventListener('load', reportPerformance)
    }
  }, [])

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Log critical app-level errors
        console.error('🚨 Critical App Error:', error, errorInfo)
        
        // Send to monitoring service in production
        if (import.meta.env.PROD) {
          // Example: Sentry.captureException(error, { extra: errorInfo })
        }
      }}
    >
      <ThemeProvider>
        <ErrorBoundary>
          <ChatProvider>
            <ErrorBoundary>
              <AnimatePresence mode="wait">
                <Routes>
                  <Route path="/" element={<Layout />}>
                    <Route
                      index
                      element={
                        <ErrorBoundary>
                          <Suspense fallback={<SkeletonPage type="home" />}>
                            <HomePage />
                          </Suspense>
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path="chat"
                      element={
                        <ErrorBoundary>
                          <Suspense fallback={<SkeletonPage type="chat" />}>
                            <ChatPage />
                          </Suspense>
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path="about"
                      element={
                        <ErrorBoundary>
                          <Suspense fallback={<SkeletonPage type="about" />}>
                            <AboutPage />
                          </Suspense>
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path="resources"
                      element={
                        <ErrorBoundary>
                          <Suspense fallback={<SkeletonPage type="resources" />}>
                            <ResourcesPage />
                          </Suspense>
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path="*"
                      element={
                        <ErrorBoundary>
                          <Suspense fallback={<SkeletonPage type="notfound" />}>
                            <NotFoundPage />
                          </Suspense>
                        </ErrorBoundary>
                      }
                    />
                  </Route>
                </Routes>
              </AnimatePresence>
            </ErrorBoundary>
          </ChatProvider>
        </ErrorBoundary>
        
        {/* FASE 3: Debug Panel para diagnóstico */}
        {(import.meta.env.DEV || import.meta.env.VITE_DEBUG === 'true') && <DebugPanel />}
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App