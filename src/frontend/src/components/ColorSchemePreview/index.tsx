import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  HeartIcon, 
  ShieldCheckIcon,
  SparklesIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

interface ColorScheme {
  id: string
  name: string
  description: string
  personality: string
  colors: {
    primary: string
    secondary: string
    accent: string
  }
  characteristics: string[]
  useCases: string[]
  preview: {
    primary: string
    secondary: string
    accent: string
    gradient: string
  }
}

const colorSchemes: ColorScheme[] = [
  {
    id: 'traditional',
    name: 'Confiável & Tradicional',
    description: 'Azul médico clássico combinado com verde terapêutico. Transmite autoridade médica e confiança profissional.',
    personality: 'Profissional, confiável, estabelecido',
    colors: {
      primary: '#2563eb',
      secondary: '#22c55e',
      accent: '#0ea5e9'
    },
    characteristics: [
      'Autoridade médica',
      'Confiança profissional',
      'Seriedade clínica',
      'Tradição em saúde'
    ],
    useCases: [
      'Hospitais e clínicas',
      'Profissionais conservadores',
      'Documentação oficial',
      'Sistemas corporativos'
    ],
    preview: {
      primary: 'bg-blue-600',
      secondary: 'bg-green-500',
      accent: 'bg-sky-500',
      gradient: 'from-blue-50 via-white to-green-50'
    }
  },
  {
    id: 'modern',
    name: 'Moderno & Tecnológico',
    description: 'Violeta inovação com ciano tecnológico. Representa modernidade, inovação e progresso científico.',
    personality: 'Inovador, tecnológico, progressivo',
    colors: {
      primary: '#8b5cf6',
      secondary: '#06b6d4',
      accent: '#3b82f6'
    },
    characteristics: [
      'Inovação médica',
      'Tecnologia avançada',
      'Pesquisa científica',
      'Futuro da medicina'
    ],
    useCases: [
      'Startups de saúde',
      'Pesquisa médica',
      'Telemedicina',
      'IA em saúde'
    ],
    preview: {
      primary: 'bg-violet-500',
      secondary: 'bg-cyan-500',
      accent: 'bg-blue-500',
      gradient: 'from-violet-50 via-white to-cyan-50'
    }
  },
  {
    id: 'accessible',
    name: 'Acessível & Amigável',
    description: 'Verde-água calmo com azul oceano. Promove tranquilidade, acessibilidade e cuidado humanizado.',
    personality: 'Calmo, acessível, humanizado',
    colors: {
      primary: '#14b8a6',
      secondary: '#0ea5e9',
      accent: '#06b6d4'
    },
    characteristics: [
      'Cuidado humanizado',
      'Acessibilidade total',
      'Tranquilidade',
      'Bem-estar emocional'
    ],
    useCases: [
      'Clínicas comunitárias',
      'Saúde mental',
      'Cuidados paliativos',
      'Atendimento inclusivo'
    ],
    preview: {
      primary: 'bg-teal-500',
      secondary: 'bg-sky-500',
      accent: 'bg-cyan-500',
      gradient: 'from-teal-50 via-white to-sky-50'
    }
  }
]

interface ColorSchemePreviewProps {
  onClose?: () => void
  onSelect?: (schemeId: string) => void
}

const ColorSchemePreview: React.FC<ColorSchemePreviewProps> = ({ onClose, onSelect }) => {
  const [selectedScheme, setSelectedScheme] = useState<string>('')

  const handleSelect = (schemeId: string) => {
    setSelectedScheme(schemeId)
    onSelect?.(schemeId)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Esquemas de Cores Profissionais
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Escolha o esquema que melhor representa sua prática médica
              </p>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Fechar"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>

        {/* Color Schemes Grid */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {colorSchemes.map((scheme, index) => (
              <motion.div
                key={scheme.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`relative rounded-2xl border-2 transition-all duration-300 cursor-pointer ${
                  selectedScheme === scheme.id
                    ? 'border-blue-500 shadow-lg shadow-blue-500/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
                onClick={() => handleSelect(scheme.id)}
              >
                {/* Color Preview Header */}
                <div className={`h-24 rounded-t-xl bg-gradient-to-r ${scheme.preview.gradient} relative overflow-hidden`}>
                  <div className="absolute inset-0 flex items-center justify-center space-x-2">
                    <div className={`w-8 h-8 rounded-full ${scheme.preview.primary}`} />
                    <div className={`w-8 h-8 rounded-full ${scheme.preview.secondary}`} />
                    <div className={`w-8 h-8 rounded-full ${scheme.preview.accent}`} />
                  </div>
                  
                  {/* Selection Indicator */}
                  <AnimatePresence>
                    {selectedScheme === scheme.id && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="absolute top-2 right-2"
                      >
                        <div className="bg-white rounded-full p-1 shadow-lg">
                          <CheckCircleIcon className="w-5 h-5 text-green-500" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                        {scheme.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                        {scheme.personality}
                      </p>
                    </div>
                    <div className="flex space-x-1">
                      {scheme.id === 'traditional' && <ShieldCheckIcon className="w-5 h-5 text-blue-500" />}
                      {scheme.id === 'modern' && <SparklesIcon className="w-5 h-5 text-violet-500" />}
                      {scheme.id === 'accessible' && <HeartIcon className="w-5 h-5 text-teal-500" />}
                    </div>
                  </div>

                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 leading-relaxed">
                    {scheme.description}
                  </p>

                  {/* Characteristics */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                      Características
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {scheme.characteristics.map((char, i) => (
                        <div key={i} className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                          <div className="w-1.5 h-1.5 bg-current rounded-full mr-2 flex-shrink-0" />
                          {char}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Use Cases */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                      Ideal para
                    </h4>
                    <div className="space-y-1">
                      {scheme.useCases.map((useCase, i) => (
                        <div key={i} className="flex items-center text-xs text-gray-600 dark:text-gray-400">
                          <UserGroupIcon className="w-3 h-3 mr-2 flex-shrink-0" />
                          {useCase}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Color Palette */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                      Paleta de Cores
                    </h4>
                    <div className="flex space-x-3">
                      <div className="text-center">
                        <div 
                          className="w-8 h-8 rounded-lg mb-1 shadow-sm"
                          style={{ backgroundColor: scheme.colors.primary }}
                        />
                        <span className="text-xs text-gray-500">Primária</span>
                      </div>
                      <div className="text-center">
                        <div 
                          className="w-8 h-8 rounded-lg mb-1 shadow-sm"
                          style={{ backgroundColor: scheme.colors.secondary }}
                        />
                        <span className="text-xs text-gray-500">Secundária</span>
                      </div>
                      <div className="text-center">
                        <div 
                          className="w-8 h-8 rounded-lg mb-1 shadow-sm"
                          style={{ backgroundColor: scheme.colors.accent }}
                        />
                        <span className="text-xs text-gray-500">Destaque</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Demo Components */}
                <div className="px-6 pb-6">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <h5 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-3">
                      Prévia de Componentes
                    </h5>
                    <div className="space-y-2">
                      {/* Button Preview */}
                      <button 
                        className="text-xs px-3 py-1.5 rounded-md text-white font-medium"
                        style={{ backgroundColor: scheme.colors.primary }}
                      >
                        Iniciar Chat
                      </button>
                      
                      {/* Badge Preview */}
                      <div className="flex space-x-2">
                        <span 
                          className="text-xs px-2 py-1 rounded-full text-white"
                          style={{ backgroundColor: scheme.colors.secondary }}
                        >
                          Ativo
                        </span>
                        <span 
                          className="text-xs px-2 py-1 rounded-full text-white"
                          style={{ backgroundColor: scheme.colors.accent }}
                        >
                          PQT-U
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center mt-8 space-x-4">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Manter Atual
            </button>
            {selectedScheme && (
              <motion.button
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center"
                onClick={() => {
                  console.log(`Esquema selecionado: ${selectedScheme}`)
                  onClose?.()
                }}
              >
                <ChatBubbleLeftRightIcon className="w-4 h-4 mr-2" />
                Aplicar Esquema
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default ColorSchemePreview