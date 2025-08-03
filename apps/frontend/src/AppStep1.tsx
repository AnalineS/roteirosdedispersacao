import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { ChatProvider } from '@hooks/useChat'
import HomePage from '@pages/HomePage'

// Versão intermediária - Step 1: Apenas HomePage sem lazy loading
function AppStep1() {
  console.log('🎯 AppStep1 renderizando...', { 
    location: window.location.href,
    timestamp: new Date().toISOString()
  })
  
  useEffect(() => {
    console.log('🚀 AppStep1 useEffect executado!')
    
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

  return (
    <ChatProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="*" element={
          <div style={{ 
            minHeight: '100vh', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            padding: '20px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>404 - Página não encontrada</h1>
              <a href="/" style={{ color: '#1976d2' }}>Voltar para Home</a>
            </div>
          </div>
        } />
      </Routes>
    </ChatProvider>
  )
}

export default AppStep1