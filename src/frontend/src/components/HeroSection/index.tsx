import React from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { 
  ChatBubbleLeftRightIcon, 
  BookOpenIcon, 
  ArrowRightIcon,
  BeakerIcon,
  UserGroupIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline'

const HeroSection: React.FC = () => {
  const stats = [
    { label: 'Consultas Realizadas', value: '10K+', icon: ChatBubbleLeftRightIcon },
    { label: 'Profissionais Atendidos', value: '2.5K+', icon: UserGroupIcon },
    { label: 'Taxa de Precisão', value: '98%', icon: ShieldCheckIcon },
  ]

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
      {/* Background decorations */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-72 h-72 bg-primary-200 dark:bg-primary-900/20 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 right-0 w-72 h-72 bg-secondary-200 dark:bg-secondary-900/20 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-72 h-72 bg-accent-200 dark:bg-accent-900/20 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center lg:text-left"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center px-4 py-2 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm font-medium mb-6"
            >
              <BeakerIcon className="w-4 h-4 mr-2" aria-hidden="true" />
              Baseado em Pesquisa Científica
            </motion.div>

            {/* Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-gray-100 mb-6 leading-tight"
            >
              Sistema Inteligente de{' '}
              <span className="text-gradient">
                Dispensação PQT-U
              </span>
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-8 leading-relaxed"
            >
              Assistente virtual especializado em poliquimioterapia única para hanseníase. 
              Obtenha orientações precisas e baseadas em evidências científicas para 
              dispensação segura de medicamentos.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 mb-12"
            >
              <Link
                to="/chat"
                className="inline-flex items-center justify-center px-8 py-4 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 focus-visible-ring"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.currentTarget.click();
                  }
                }}
              >
                <ChatBubbleLeftRightIcon className="w-5 h-5 mr-2" aria-hidden="true" />
                Iniciar Conversa
                <ArrowRightIcon className="w-4 h-4 ml-2" aria-hidden="true" />
              </Link>

              <Link
                to="/about"
                className="inline-flex items-center justify-center px-8 py-4 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-semibold rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm hover:shadow-md focus-visible-ring"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.currentTarget.click();
                  }
                }}
              >
                <BookOpenIcon className="w-5 h-5 mr-2" aria-hidden="true" />
                Sobre o Projeto
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-6"
            >
              {stats.map((stat) => {
                const Icon = stat.icon
                return (
                  <div key={stat.label} className="text-center lg:text-left">
                    <div className="flex items-center justify-center lg:justify-start mb-2">
                      <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400 mr-2" aria-hidden="true" />
                      <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {stat.value}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {stat.label}
                    </div>
                  </div>
                )
              })}
            </motion.div>
          </motion.div>

          {/* Illustration */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative">
              {/* Main illustration container */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 glass">
                {/* Chat interface mockup */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">Dr</span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-gray-100">Dr. Gasnelio</div>
                      <div className="text-sm text-green-500 flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                        Online
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="space-y-3">
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl rounded-bl-sm p-4 max-w-xs">
                      <p className="text-sm text-gray-800 dark:text-gray-200">
                        Olá! Como posso ajudar com a dispensação de PQT-U hoje?
                      </p>
                    </div>
                    <div className="bg-primary-600 text-white rounded-2xl rounded-br-sm p-4 max-w-xs ml-auto">
                      <p className="text-sm">
                        Qual a dosagem correta de rifampicina para um paciente de 65kg?
                      </p>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl rounded-bl-sm p-4 max-w-xs">
                      <p className="text-sm text-gray-800 dark:text-gray-200">
                        Para um paciente de 65kg, a dose de rifampicina no PQT-U é de 600mg...
                      </p>
                    </div>
                  </div>

                  {/* Typing indicator */}
                  <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce animation-delay-200"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce animation-delay-400"></div>
                    </div>
                    <span className="text-xs">Digitando...</span>
                  </div>
                </div>
              </div>

              {/* Floating badges */}
              <motion.div
                animate={{ y: [-10, 10, -10] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-4 -right-4 bg-success-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg"
              >
                IA Médica
              </motion.div>

              <motion.div
                animate={{ y: [10, -10, 10] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-4 -left-4 bg-secondary-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg"
              >
                Baseado em Evidências
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection