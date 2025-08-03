import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
// import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
// import App from './App'
// import AppMinimal from './AppMinimal'
// import AppStep1 from './AppStep1'
import AppSimple from './AppSimple'

console.log('🚀 main.tsx executando...')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppSimple />
    </BrowserRouter>
  </React.StrictMode>
)

console.log('✅ ReactDOM.render executado')