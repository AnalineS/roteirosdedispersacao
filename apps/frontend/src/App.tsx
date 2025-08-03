import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { ChatProvider } from '@hooks/useChat'
import HomePage from '@pages/HomePage'
import ChatPage from '@pages/ChatPage'
import NotFoundPage from '@pages/NotFoundPage'

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
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ChatProvider>
  )
}

export default App