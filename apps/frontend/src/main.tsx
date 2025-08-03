import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { HelmetProvider } from 'react-helmet-async'

import App from './App'
import './styles/globals.css'
import './styles/layout-fixes.css'
import './styles/redesign.css'
import './styles/desktop-optimized.css'
import './styles/mobile-optimizations.css'
import './styles/critical-fixes.css'
// Removido: import './utils/medical-app.js' - funcionalidade integrada nos componentes React

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(
      (registration) => {
        console.log('ServiceWorker registration successful:', registration)
      },
      (err) => {
        console.log('ServiceWorker registration failed:', err)
      }
    )
  })
}

// Enhanced render with loading screen management
const rootElement = document.getElementById('root')!
const root = ReactDOM.createRoot(rootElement)

// Remove loading screen after React starts rendering
const removeLoadingOnMount = () => {
  const event = new CustomEvent('reactMounted')
  window.dispatchEvent(event)
}

root.render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <div onLoad={removeLoadingOnMount}>
            <App />
          </div>
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                style: {
                  background: '#16a34a',
                },
              },
              error: {
                style: {
                  background: '#dc2626',
                },
              },
            }}
          />
        </QueryClientProvider>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
)

// Ensure loading screen is removed when React is ready
setTimeout(() => {
  const event = new CustomEvent('reactReady')
  window.dispatchEvent(event)
}, 100)