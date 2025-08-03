import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
// import App from './App'
// import AppMinimal from './AppMinimal'
import AppStep1 from './AppStep1'

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000,   // 10 minutes (formerly cacheTime)
    },
  },
})

console.log('🚀 main.tsx executando...')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppStep1 />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
)

console.log('✅ ReactDOM.render executado')