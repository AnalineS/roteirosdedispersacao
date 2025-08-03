import React, { useState, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useChat } from '@hooks/useChat'
// import { AnimationOptimizer } from '@utils/performanceOptimizer' // Temporariamente removido
// import { SkeletonPersonaCard } from '@components/SkeletonLoader' // Removed - not used anymore
import EnhancedPersonaSelector from '@components/PersonaSelector/EnhancedPersonaSelector'
import DiagnosticPanel from '@components/DiagnosticPanel'
import { HomePageSEO } from '@components/SEOHead'
import { 
  ChatBubbleLeftRightIcon,
  AcademicCapIcon,
  UserGroupIcon,
  HeartIcon
} from '@heroicons/react/24/outline'

// Lazy load heavy components
const ColorSchemePreview = React.lazy(() => import('@components/ColorSchemePreview'))

const HomePage: React.FC = () => {
  const { personas, isPersonasLoading, selectedPersona } = useChat()
  const [showColorPreview, setShowColorPreview] = useState(false)
  const [showPersonaSelector, setShowPersonaSelector] = useState(false)
  
  // Get optimized animation variants - Temporariamente removido
  // const animationVariants = AnimationOptimizer.createOptimizedVariants()
  
  // Usar animações simples por enquanto
  const animationVariants = {
    fadeIn: {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.3 }
    },
    slideUp: {
      initial: { opacity: 0, y: 30 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.4 }
    },
    scale: {
      initial: { opacity: 0, scale: 0.9 },
      animate: { opacity: 1, scale: 1 },
      transition: { duration: 0.3 }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      <HomePageSEO />
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
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-2xl mx-auto">
              <button 
                onClick={() => setShowPersonaSelector(true)}
                className="w-full sm:w-auto btn-primary btn-lg flex items-center justify-center space-x-3 touch-target-large px-8 py-4"
              >
                <ChatBubbleLeftRightIcon className="w-5 h-5" />
                <span>Escolher Assistente Virtual</span>
              </button>
              <Link 
                to="/chat" 
                className={`w-full sm:w-auto btn-lg flex items-center justify-center space-x-3 touch-target-large px-8 py-4 ${
                  selectedPersona ? 'btn-success' : 'btn-secondary'
                }`}
              >
                <ChatBubbleLeftRightIcon className="w-5 h-5" />
                <span>{selectedPersona ? 'Continuar Conversa' : 'Ir para Chat'}</span>
              </Link>
            </div>

            {/* Indicador de Persona Selecionada */}
            {selectedPersona && personas && personas[selectedPersona] && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 max-w-md mx-auto"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <span className="text-green-600 dark:text-green-400">✓</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-green-800 dark:text-green-200">
                      Assistente Selecionado
                    </h4>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      {personas[selectedPersona].name} - {personas[selectedPersona].role}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowPersonaSelector(true)}
                    className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 text-xs"
                  >
                    Trocar
                  </button>
                </div>
              </motion.div>
            )}
          </motion.section>

          {/* Grid de Recursos Educacionais */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {/* Card de Assistentes Inteligentes */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="card-medical p-6 text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserGroupIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Assistentes Especializados</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                Dr. Gasnelio (técnico) e Gá (amigável) - cada um adaptado ao seu nível de conhecimento e necessidades.
              </p>
              <button 
                onClick={() => setShowPersonaSelector(true)}
                className="btn-primary btn-md w-full flex items-center justify-center space-x-2 touch-target"
              >
                <span>Escolher Assistente</span>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
                </svg>
              </button>
            </motion.div>

            {/* Card de Aprendizagem Adaptativa */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="card-medical p-6 text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <AcademicCapIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Aprendizagem Adaptativa</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                Sistema inteligente que se adapta ao seu nível de conhecimento, oferecendo explicações personalizadas.
              </p>
              <Link to="/chat" className="btn-secondary btn-md w-full flex items-center justify-center space-x-2 touch-target">
                <span>Explorar Sistema</span>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
                </svg>
              </Link>
            </motion.div>

            {/* Card de Suporte Emocional */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="card-medical p-6 text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <HeartIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Suporte Humanizado</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                Abordagem empática e acolhedora, especialmente para pacientes e familiares que buscam orientação.
              </p>
              <button 
                onClick={() => setShowPersonaSelector(true)}
                className="btn-secondary btn-md w-full flex items-center justify-center space-x-2 touch-target"
              >
                <span>Conhecer Gá</span>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
                </svg>
              </button>
            </motion.div>

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
              <Link to="/resources" className="btn-secondary btn-md w-full flex items-center justify-center space-x-2 touch-target">
                <span>Explorar recursos</span>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
                </svg>
              </Link>
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
              <Link to="/about" className="btn-secondary btn-md w-full flex items-center justify-center space-x-2 touch-target">
                <span>Saiba mais</span>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
                </svg>
              </Link>
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
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
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

      {/* Enhanced Persona Selector Modal */}
      {showPersonaSelector && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="persona-modal-title"
          aria-describedby="persona-modal-description"
        >
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
              <h2 
                id="persona-modal-title"
                className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100"
              >
                Escolha seu Assistente Virtual
              </h2>
              <button
                onClick={() => setShowPersonaSelector(false)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900"
                aria-label="Fechar modal"
              >
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <EnhancedPersonaSelector
                personas={personas}
                isLoading={isPersonasLoading}
                selectedPersona={selectedPersona}
              />
            </div>
            <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowPersonaSelector(false)}
                  className="btn-secondary"
                >
                  Fechar
                </button>
                {selectedPersona && (
                  <Link
                    to="/chat"
                    onClick={() => setShowPersonaSelector(false)}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <ChatBubbleLeftRightIcon className="w-4 h-4" />
                    <span>Ir para Chat</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* Diagnostic Panel for debugging */}
      <DiagnosticPanel />
    </div>
  )
}

export default HomePage