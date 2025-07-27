import { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'

import Layout from '@components/Layout'
import LoadingScreen from '@components/LoadingScreen'
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
    <ThemeProvider>
      <ChatProvider>
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route
                index
                element={
                  <Suspense fallback={<LoadingScreen />}>
                    <HomePage />
                  </Suspense>
                }
              />
              <Route
                path="chat"
                element={
                  <Suspense fallback={<LoadingScreen />}>
                    <ChatPage />
                  </Suspense>
                }
              />
              <Route
                path="about"
                element={
                  <Suspense fallback={<LoadingScreen />}>
                    <AboutPage />
                  </Suspense>
                }
              />
              <Route
                path="resources"
                element={
                  <Suspense fallback={<LoadingScreen />}>
                    <ResourcesPage />
                  </Suspense>
                }
              />
              <Route
                path="*"
                element={
                  <Suspense fallback={<LoadingScreen />}>
                    <NotFoundPage />
                  </Suspense>
                }
              />
            </Route>
          </Routes>
        </AnimatePresence>
      </ChatProvider>
    </ThemeProvider>
  )
}

export default App