import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import HomePageSimple from './HomePageSimple'

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
      <Route path="/chat" element={
        <div style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '40px',
            textAlign: 'center',
            maxWidth: '500px'
          }}>
            <h1 style={{ marginBottom: '20px' }}>Chat em Desenvolvimento</h1>
            <p style={{ marginBottom: '30px' }}>
              O sistema de chat está sendo otimizado para melhor performance.
            </p>
            <a 
              href="/" 
              style={{
                display: 'inline-block',
                background: 'white',
                color: '#1976d2',
                padding: '12px 30px',
                borderRadius: '25px',
                textDecoration: 'none',
                fontWeight: 'bold'
              }}
            >
              Voltar para Home
            </a>
          </div>
        </div>
      } />
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