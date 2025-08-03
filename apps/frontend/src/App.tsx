import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'

// Componente simples da Homepage
const HomePage = () => (
  <div style={{ 
    minHeight: '100vh', 
    padding: '2rem',
    fontFamily: 'system-ui, sans-serif',
    background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
    color: 'white',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  }}>
    <h1 style={{ fontSize: '3rem', marginBottom: '1rem', textAlign: 'center' }}>
      🏥 Roteiros de Dispensação
    </h1>
    <p style={{ fontSize: '1.5rem', marginBottom: '2rem', textAlign: 'center' }}>
      Assistentes Educacionais para PQT-U
    </p>
    <div style={{ 
      background: 'rgba(255,255,255,0.1)', 
      padding: '2rem', 
      borderRadius: '15px',
      textAlign: 'center',
      maxWidth: '600px'
    }}>
      <h2 style={{ marginBottom: '1rem' }}>👨‍⚕️ Dr. Gasnelio & 🤝 Gá</h2>
      <p style={{ marginBottom: '1rem', lineHeight: '1.6' }}>
        Assistentes virtuais especializados em orientação sobre poliquimioterapia de hanseníase
      </p>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        gap: '1rem',
        flexWrap: 'wrap',
        marginTop: '2rem'
      }}>
        <button style={{ 
          background: '#16a34a', 
          color: 'white', 
          border: 'none', 
          padding: '1rem 2rem', 
          borderRadius: '8px',
          fontSize: '1.1rem',
          cursor: 'pointer'
        }}>
          💬 Iniciar Chat
        </button>
        <button style={{ 
          background: 'rgba(255,255,255,0.2)', 
          color: 'white', 
          border: '2px solid white', 
          padding: '1rem 2rem', 
          borderRadius: '8px',
          fontSize: '1.1rem',
          cursor: 'pointer'
        }}>
          📖 Sobre o Projeto
        </button>
      </div>
    </div>
  </div>
)

function App() {
  // Remove loading screen when React app is ready
  useEffect(() => {
    const removeLoadingScreen = () => {
      const loadingScreen = document.getElementById('loading-screen')
      if (loadingScreen) {
        console.log('🎯 React App renderizou! Removendo loading screen...')
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

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="*" element={<HomePage />} />
    </Routes>
  )
}

export default App