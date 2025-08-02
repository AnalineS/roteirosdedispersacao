import React, { useState, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useChat } from '@hooks/useChat'
import { AnimationOptimizer } from '@utils/performanceOptimizer'
import { SkeletonPersonaCard } from '@components/SkeletonLoader'
import { 
  ChatBubbleLeftRightIcon,
  BookOpenIcon,
  InformationCircleIcon,
  Bars3Icon
} from '@heroicons/react/24/outline'

// Lazy load heavy components
const ColorSchemePreview = React.lazy(() => import('@components/ColorSchemePreview'))

const HomePage: React.FC = () => {
  const { personas, isPersonasLoading, setSelectedPersona } = useChat()
  const [showColorPreview, setShowColorPreview] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  // Get optimized animation variants
  const animationVariants = AnimationOptimizer.createOptimizedVariants()
  const animationConfig = AnimationOptimizer.getOptimizedConfig()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Header Responsivo */}
      <header className="glass sticky top-0 z-50 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo Responsivo */}
            <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm sm:text-base">RD</span>
              </div>
              <div className="hidden sm:block">
                <div className="font-bold text-lg lg:text-xl text-gradient">Roteiro de Dispensação</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Sistema PQT-U Hanseníase</div>
              </div>
              <div className="sm:hidden">
                <div className="font-bold text-sm text-gradient">Roteiro PQT-U</div>
              </div>
            </Link>

            {/* Navigation Desktop */}
            <nav className="hidden md:flex items-center space-x-6">
              <a href="#recursos" className="flex items-center space-x-1 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                <BookOpenIcon className="w-4 h-4" />
                <span>Recursos</span>
              </a>
              <a href="#sobre" className="flex items-center space-x-1 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                <InformationCircleIcon className="w-4 h-4" />
                <span>Sobre</span>
              </a>
              <Link to="/chat" className="flex items-center space-x-1 btn-primary btn-sm">
                <ChatBubbleLeftRightIcon className="w-4 h-4" />
                <span>Chat</span>
              </Link>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors touch-target"
              aria-label={isMobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={isMobileMenuOpen}
            >
              <Bars3Icon className="w-6 h-6" />
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-gray-200 dark:border-gray-700 py-4"
            >
              <div className="space-y-2">
                <a href="#recursos" className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors touch-target">
                  <BookOpenIcon className="w-5 h-5" />
                  <span>Recursos</span>
                </a>
                <a href="#sobre" className="flex items-center space-x-2 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors touch-target">
                  <InformationCircleIcon className="w-5 h-5" />
                  <span>Sobre</span>
                </a>
                <Link to="/chat" className="flex items-center space-x-2 p-3 rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors touch-target">
                  <ChatBubbleLeftRightIcon className="w-5 h-5" />
                  <span>Iniciar Chat</span>
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      </header>


      {/* Conteúdo Principal */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          {/* Hero Section Responsivo */}
          <motion.section 
            variants={animationVariants.slideUp}
            initial="initial"
            animate="animate"
            className="text-center mb-12 lg:mb-16"
          >
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 dark:text-white mb-4 lg:mb-6">
              <span className="text-gradient">Sistema Inteligente</span>
              <br className="hidden sm:block" />
              <span className="block sm:inline"> de Dispensação PQT-U</span>
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-8 lg:mb-10 leading-relaxed">
              Assistente virtual especializado em poliquimioterapia única para hanseníase. 
              Obtenha orientações precisas e baseadas em evidências científicas para dispensação segura de medicamentos.
            </p>
            
            {/* CTA Buttons Responsivos */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link 
                to="/chat" 
                className="w-full sm:w-auto btn-primary btn-lg flex items-center justify-center space-x-2 touch-target-large"
              >
                <ChatBubbleLeftRightIcon className="w-5 h-5" />
                <span>Iniciar Conversa</span>
              </Link>
              <button 
                onClick={() => setShowColorPreview(true)}
                className="w-full sm:w-auto btn-secondary btn-lg flex items-center justify-center space-x-2 touch-target-large"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8z"/>
                </svg>
                <span className="hidden sm:inline">Ver Esquemas de Cores</span>
                <span className="sm:hidden">Esquemas</span>
              </button>
            </div>
          </motion.section>

          {/* Grid de Cards Responsivo */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 mb-12 lg:mb-16">
            {/* Card de Especialistas */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="card-medical p-6 text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">👨‍⚕️</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Especialistas Virtuais</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                Nossos especialistas virtuais estão prontos para ajudar com diferentes aspectos 
                da dispensação de medicamentos para hanseníase.
              </p>
              <Link to="/chat" className="btn-primary btn-md w-full flex items-center justify-center space-x-2 touch-target">
                <span>Conversar agora</span>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
                </svg>
              </Link>
            </motion.div>

            {/* Cards de Personas Dinâmicos */}
            {isPersonasLoading ? (
              <motion.div
                variants={animationVariants.fade}
                initial="initial"
                animate="animate"
                className="md:col-span-2 lg:col-span-1"
              >
                <SkeletonPersonaCard />
              </motion.div>
            ) : (
              personas && Object.entries(personas).map(([id, persona], index) => (
                <motion.div
                  key={id}
                  variants={animationVariants.scale}
                  initial="initial"
                  whileInView="animate"
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ 
                    duration: animationConfig.animationDuration,
                    delay: index * animationConfig.staggerDelay 
                  }}
                  className="card-medical p-6 text-center"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">
                      {persona.avatar === 'Dr' ? '👨‍⚕️' : '👩‍⚕️'}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{persona.name}</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-3 leading-relaxed">{persona.description}</p>
                  <div className="mb-4">
                    <span className="badge-primary text-xs">
                      {persona.role}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedPersona(id)
                      window.location.href = '/chat'
                    }}
                    className="btn-primary btn-md w-full touch-target"
                  >
                    Conversar com {persona.name}
                  </button>
                </motion.div>
              ))
            )}

            {/* Card de Base de Conhecimento */}
            <motion.div
              variants={animationVariants.scale}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: 0.2 }}
              className="card-medical p-6 text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-accent-500 to-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📚</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Base de Conhecimento</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                Acesso a informações técnicas baseadas em pesquisa científica sobre PQT-U 
                e dispensação farmacêutica especializada.
              </p>
              <a href="#recursos" className="btn-secondary btn-md w-full flex items-center justify-center space-x-2 touch-target">
                <span>Explorar recursos</span>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
                </svg>
              </a>
            </motion.div>

            {/* Card de Educação Continuada */}
            <motion.div
              variants={animationVariants.scale}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, margin: '-50px' }}
              transition={{ delay: 0.3 }}
              className="card-medical p-6 text-center md:col-span-2 lg:col-span-1"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-secondary-500 to-accent-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Educação Continuada</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                Materiais educacionais e recursos para aprimoramento profissional 
                na área de hanseníase e dispensação de medicamentos.
              </p>
              <a href="#sobre" className="btn-secondary btn-md w-full flex items-center justify-center space-x-2 touch-target">
                <span>Saiba mais</span>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
                </svg>
              </a>
            </motion.div>
          </section>

          {/* Estatísticas do Sistema */}
          <section className="text-center mb-12">
            <motion.h2 
              variants={animationVariants.slideUp}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, margin: '-50px' }}
              className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-8 flex items-center justify-center space-x-2"
            >
              <span className="text-2xl">📊</span>
              <span>Estatísticas do Sistema</span>
            </motion.h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 lg:gap-8">
              <motion.div
                variants={animationVariants.scale}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true, margin: '-50px' }}
                transition={{ delay: 0.1 }}
                className="card-medical p-6 text-center"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl">💬</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-primary-600 dark:text-primary-400 mb-1">10K+</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">Consultas Realizadas</p>
              </motion.div>
              
              <motion.div
                variants={animationVariants.scale}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true, margin: '-50px' }}
                transition={{ delay: 0.2 }}
                className="card-medical p-6 text-center"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl">👥</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-secondary-600 dark:text-secondary-400 mb-1">2.5K+</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">Profissionais Atendidos</p>
              </motion.div>
              
              <motion.div
                variants={animationVariants.scale}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true, margin: '-50px' }}
                transition={{ delay: 0.3 }}
                className="card-medical p-6 text-center sm:col-span-3 lg:col-span-1"
              >
                <div className="w-12 h-12 bg-gradient-to-br from-success-500 to-success-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-xl">✅</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-success-600 dark:text-success-400 mb-1">98%</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">Taxa de Precisão</p>
              </motion.div>
            </div>
          </section>
        </div>
      </main>

      {/* Color Scheme Preview Modal */}
      {showColorPreview && (
        <Suspense fallback={
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
                <div className="grid grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        }>
          <ColorSchemePreview
            onClose={() => setShowColorPreview(false)}
            onSelect={(schemeId) => {
              console.log('Esquema selecionado:', schemeId)
            }}
          />
        </Suspense>
      )}
    </div>
  )
}

export default HomePage