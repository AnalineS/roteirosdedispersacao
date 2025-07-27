import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useChat } from '@hooks/useChat'
import PersonaCard from '@components/PersonaCard'
import HeroSection from '@components/HeroSection'
import FeatureSection from '@components/FeatureSection'
import StatsSection from '@components/StatsSection'
import { 
  ChatBubbleLeftRightIcon,
  BookOpenIcon,
  AcademicCapIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'

const HomePage: React.FC = () => {
  const { personas, isPersonasLoading, setSelectedPersona } = useChat()

  const features = [
    {
      icon: ChatBubbleLeftRightIcon,
      title: 'Chat Inteligente',
      description: 'Converse com especialistas virtuais sobre dispensação de medicamentos para hanseníase.',
    },
    {
      icon: BookOpenIcon,
      title: 'Base de Conhecimento',
      description: 'Acesso a informações técnicas baseadas em pesquisa científica sobre PQT-U.',
    },
    {
      icon: AcademicCapIcon,
      title: 'Educação Continuada',
      description: 'Materiais educacionais e recursos para aprimoramento profissional.',
    },
    {
      icon: ShieldCheckIcon,
      title: 'Informações Confiáveis',
      description: 'Conteúdo validado e baseado em evidências científicas atualizadas.',
    },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <HeroSection />

      {/* Personas Section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Escolha seu Assistente Virtual
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Nossos especialistas virtuais estão prontos para ajudar com diferentes aspectos 
              da dispensação de medicamentos para hanseníase.
            </p>
          </motion.div>

          {isPersonasLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="card p-6">
                  <div className="animate-pulse">
                    <div className="w-16 h-16 bg-gray-300 dark:bg-gray-700 rounded-full mb-4"></div>
                    <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>
                    <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded mb-4"></div>
                    <div className="h-10 bg-gray-300 dark:bg-gray-700 rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {personas && Object.entries(personas).map(([id, persona], index) => (
                <motion.div
                  key={id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <PersonaCard
                    persona={persona}
                    onSelect={() => {
                      setSelectedPersona(id)
                      // Navigate to chat page
                      window.location.href = '/chat'
                    }}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <FeatureSection features={features} />

      {/* Stats Section */}
      <StatsSection />

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary-600 to-secondary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Pronto para Começar?
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Inicie uma conversa com nossos especialistas virtuais e obtenha 
              orientações precisas sobre dispensação de medicamentos.
            </p>
            <Link
              to="/chat"
              className="inline-flex items-center px-8 py-4 bg-white text-primary-600 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <ChatBubbleLeftRightIcon className="w-5 h-5 mr-2" />
              Iniciar Chat
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default HomePage