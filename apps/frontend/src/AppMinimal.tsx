import React from 'react'

// Versão mínima do App para teste
function AppMinimal() {
  console.log('🎯 AppMinimal renderizou!')
  
  React.useEffect(() => {
    console.log('🚀 AppMinimal useEffect executou')
    
    // Remove loading screen
    const loadingScreen = document.getElementById('loading-screen')
    if (loadingScreen) {
      console.log('🔧 Removendo loading screen...')
      loadingScreen.classList.add('fade-out')
      setTimeout(() => {
        loadingScreen.style.display = 'none'
        console.log('✅ Loading screen removido')
      }, 500)
    }
  }, [])

  return (
    <div style={{ 
      minHeight: '100vh', 
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.1)',
        padding: '40px',
        borderRadius: '20px',
        textAlign: 'center',
        backdropFilter: 'blur(10px)',
        maxWidth: '600px'
      }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '20px' }}>
          ✅ React Funcionando!
        </h1>
        
        <p style={{ fontSize: '1.2rem', marginBottom: '30px' }}>
          Se você está vendo esta página, o React está renderizando corretamente.
        </p>
        
        <div style={{ 
          background: 'rgba(255,255,255,0.2)', 
          padding: '20px', 
          borderRadius: '10px',
          marginBottom: '30px'
        }}>
          <h3>🔍 Informações de Debug:</h3>
          <p><strong>Timestamp:</strong> {new Date().toLocaleString('pt-BR')}</p>
          <p><strong>URL:</strong> {window.location.href}</p>
          <p><strong>User Agent:</strong> {navigator.userAgent.substring(0, 50)}...</p>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button 
            onClick={() => window.location.href = '/test.html'}
            style={{
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            🔧 Página de Teste
          </button>
          
          <button 
            onClick={() => window.location.reload()}
            style={{
              background: '#2196F3',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            🔄 Recarregar
          </button>
          
          <button 
            onClick={() => console.log('📊 App minimal está funcionando!')}
            style={{
              background: '#FF9800',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            📊 Teste Console
          </button>
        </div>
        
        <div style={{ marginTop: '30px', fontSize: '0.9rem', opacity: '0.8' }}>
          <p>Esta é uma versão minimal do React para identificar problemas.</p>
          <p>Se esta página funciona, o problema está nos componentes complexos.</p>
        </div>
      </div>
    </div>
  )
}

export default AppMinimal