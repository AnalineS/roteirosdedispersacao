import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import HomePageSimple from './HomePageSimple'
import ChatPageSimple from './ChatPageSimple'

// Versão simplificada sem ChatProvider e componentes pesados
function AppSimple() {
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
    setTimeout(removeLoadingScreen, 100)
  }, [])

  return (
    <Routes>
      <Route path="/" element={<HomePageSimple />} />
      <Route path="/chat" element={<ChatPageSimple />} />
      <Route path="*" element={
        <div style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '4rem', marginBottom: '20px' }}>404</h1>
            <p style={{ marginBottom: '20px' }}>Página não encontrada</p>
            <a href="/" style={{ color: 'white' }}>Voltar para Home</a>
          </div>
        </div>
      } />
    </Routes>
  )
}

export default AppSimple