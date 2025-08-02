import { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'

import Layout from '@components/Layout'
import LoadingScreen from '@components/LoadingScreen'
import ErrorBoundary from '@components/ErrorBoundary'
import { ThemeProvider } from '@hooks/useTheme'
import { ChatProvider } from '@hooks/useChat'

// Lazy load pages
const HomePage = lazy(() => import('@pages/HomePage'))
const ChatPage = lazy(() => import('@pages/ChatPage'))
const AboutPage = lazy(() => import('@pages/AboutPage'))
const ResourcesPage = lazy(() => import('@pages/ResourcesPage'))
const NotFoundPage = lazy(() => import('@pages/NotFoundPage'))

function App() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // Log critical app-level errors
        console.error('🚨 Critical App Error:', error, errorInfo)
        
        // Send to monitoring service in production
        if (process.env.NODE_ENV === 'production') {
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
                          <Suspense fallback={<LoadingScreen />}>
                            <HomePage />
                          </Suspense>
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path="chat"
                      element={
                        <ErrorBoundary>
                          <Suspense fallback={<LoadingScreen />}>
                            <ChatPage />
                          </Suspense>
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path="about"
                      element={
                        <ErrorBoundary>
                          <Suspense fallback={<LoadingScreen />}>
                            <AboutPage />
                          </Suspense>
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path="resources"
                      element={
                        <ErrorBoundary>
                          <Suspense fallback={<LoadingScreen />}>
                            <ResourcesPage />
                          </Suspense>
                        </ErrorBoundary>
                      }
                    />
                    <Route
                      path="*"
                      element={
                        <ErrorBoundary>
                          <Suspense fallback={<LoadingScreen />}>
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
      </ThemeProvider>
    </ErrorBoundary>
  )
}

export default App