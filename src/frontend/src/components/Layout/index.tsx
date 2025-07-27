import React from 'react'
import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import Navigation from '../Navigation'
import Footer from '../Footer'
import SkipNavigation from '../SkipNavigation'

const Layout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <SkipNavigation />
      <Navigation />
      
      <main 
        className="flex-1"
        id="main-content"
        tabIndex={-1}
        role="main"
        aria-label="Conteúdo principal"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Outlet />
        </motion.div>
      </main>
      
      <Footer />
    </div>
  )
}

export default Layout