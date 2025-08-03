import React, { useEffect, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { ChatProvider } from '@hooks/useChat'

// Lazy loading para reduzir bundle inicial
const HomePage = React.lazy(() => import('@pages/HomePage'))
const ChatPage = React.lazy(() => import('@pages/ChatPage'))
const NotFoundPage = React.lazy(() => import('@pages/NotFoundPage'))

// Loading component otimizado
const PageLoader = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
    color: 'white'
  }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '4px solid rgba(255,255,255,0.3)',
        borderTop: '4px solid white',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        margin: '0 auto 20px'
      }} />
      <p>Carregando página...</p>
    </div>
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
)

// Componente simples da Homepage foi removido - agora usando o da pasta pages

function App() {
  // Remove loading screen when React app is ready
  useEffect(() => {
    console.log('🚀 App.tsx useEffect executado!')
    
    const removeLoadingScreen = () => {
      const loadingScreen = document.getElementById('loading-screen')
      if (loadingScreen) {
        console.log('🎯 React App renderizou! Removendo loading screen...')
        loadingScreen.classList.add('fade-out')
        setTimeout(() => {
          loadingScreen.style.display = 'none'
          console.log('✅ Loading screen removido completamente')
        }, 500)
      } else {
        console.log('⚠️ Loading screen não encontrado no DOM')
      }
    }

    // Remove loading screen immediately when App component mounts
    const timer = setTimeout(removeLoadingScreen, 100)
    
    return () => clearTimeout(timer)
  }, [])

  console.log('🎯 App renderizando...', { 
    location: window.location.href,
    timestamp: new Date().toISOString()
  })

  return (
    <ChatProvider>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </ChatProvider>
  )
}

export default App