import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LightBulbIcon,
  ArrowRightIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

// Importar tipos de detecção
type ProfileDetection = {
  recommended: 'dr_gasnelio' | 'ga'
  confidence: number
  explanation: string
}

interface ProfileDetectorProps {
  onComplete: (personaId: string) => void
  onSkip?: () => void
  // Receber função de detecção como prop
  detectProfile?: (text: string) => ProfileDetection
}

// Função de detecção padrão (standalone)
const defaultDetectProfile = (text: string): ProfileDetection => {
  const technicalKeywords = [
    'posologia', 'farmacocinética', 'mecanismo de ação',
    'interações medicamentosas', 'farmacologia clínica',
    'protocolo', 'diretrizes técnicas', 'evidência científica',
    'PQT-U', 'baciloscopia', 'multibacilar', 'paucibacilar',
    'rifampicina', 'dapsona', 'clofazimina', 'esquema terapêutico'
  ]
  
  const empatheticKeywords = [
    'como tomar', 'efeitos', 'normal', 'preocupado',
    'posso', 'faz mal', 'é perigoso', 'vai passar',
    'medo', 'ansioso', 'família', 'cuidador',
    'dói', 'sinto', 'ajuda', 'entender', 'explicar'
  ]
  
  const lowerText = text.toLowerCase()
  const technicalScore = technicalKeywords.reduce((count, keyword) => 
    count + (lowerText.includes(keyword) ? 1 : 0), 0
  )
  const empatheticScore = empatheticKeywords.reduce((count, keyword) => 
    count + (lowerText.includes(keyword) ? 1 : 0), 0
  )
  
  const totalScore = Math.max(technicalScore + empatheticScore, 1)
  const confidence = Math.abs(technicalScore - empatheticScore) / totalScore
  
  let explanation = ''
  let recommended: 'dr_gasnelio' | 'ga' = 'ga'
  
  if (technicalScore > empatheticScore) {
    recommended = 'dr_gasnelio'
    explanation = 'Detectamos termos técnicos em sua mensagem. Dr. Gasnelio pode fornecer informações mais detalhadas.'
  } else if (empatheticScore > technicalScore) {
    recommended = 'ga'
    explanation = 'Percebemos que você busca orientações práticas. Gá pode explicar de forma mais simples e acolhedora.'
  } else {
    recommended = 'ga'
    explanation = 'Para uma primeira conversa, Gá pode ser mais adequada para entender suas necessidades.'
  }
  
  return { recommended, confidence, explanation }
}

const ProfileDetector: React.FC<ProfileDetectorProps> = ({ 
  onComplete, 
  onSkip, 
  detectProfile = defaultDetectProfile 
}) => {
  const [userInput, setUserInput] = useState('')
  const [detection, setDetection] = useState<ReturnType<typeof detectProfile> | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleAnalyze = async () => {
    if (!userInput.trim()) return

    setIsAnalyzing(true)
    
    // Simular análise com delay para melhor UX
    await new Promise(resolve => setTimeout(resolve, 800))
    
    const result = detectProfile(userInput)
    setDetection(result)
    setIsAnalyzing(false)
  }

  const handleConfirmDetection = () => {
    if (detection) {
      onComplete(detection.recommended)
    }
  }

  const handleTryAgain = () => {
    setDetection(null)
    setUserInput('')
  }

  return (
    <div className="max-w-2xl mx-auto">
      <AnimatePresence mode="wait">
        {!detection ? (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <LightBulbIcon className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Detecção Inteligente de Perfil
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Conte-me sobre o que você precisa saber e vou encontrar o melhor assistente para você
              </p>
            </div>

            {/* Input Area */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Descreva sua dúvida ou necessidade:
              </label>
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Ex: Preciso entender como funciona o tratamento da hanseníase..."
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-800 dark:text-gray-100 resize-none"
                rows={4}
              />
              
              <div className="flex items-center justify-between">
                <button
                  onClick={onSkip}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm"
                >
                  Pular este passo
                </button>
                
                <button
                  onClick={handleAnalyze}
                  disabled={!userInput.trim() || isAnalyzing}
                  className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      <span>Analisando...</span>
                    </>
                  ) : (
                    <>
                      <span>Analisar</span>
                      <ArrowRightIcon className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Examples */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
                Exemplos de perguntas:
              </h3>
              <ul className="space-y-1 text-sm text-blue-700 dark:text-blue-300">
                <li>• "Quais são os efeitos colaterais da rifampicina?"</li>
                <li>• "Estou preocupado com as manchas na pele"</li>
                <li>• "Preciso do protocolo técnico de dispensação PQT-U"</li>
                <li>• "Como posso ajudar meu familiar com o tratamento?"</li>
              </ul>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            {/* Detection Result */}
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircleIcon className="w-10 h-10 text-green-600 dark:text-green-400" />
              </motion.div>
              
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Assistente Ideal Encontrado!
              </h2>
              
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {detection.explanation}
              </p>
            </div>

            {/* Recommended Persona Card */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-xl p-6 border border-primary-200 dark:border-primary-700"
            >
              <div className="flex items-center space-x-4">
                <div className="text-4xl">
                  {detection.recommended === 'dr_gasnelio' ? '👨‍⚕️' : '🤝'}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {detection.recommended === 'dr_gasnelio' ? 'Dr. Gasnelio' : 'Gá'}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {detection.recommended === 'dr_gasnelio' 
                      ? 'Especialista técnico em hanseníase'
                      : 'Assistente educacional empática'}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500 dark:text-gray-400">Confiança</div>
                  <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                    {Math.round(detection.confidence * 100)}%
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Confidence Indicator */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Nível de confiança da recomendação</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {Math.round(detection.confidence * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${detection.confidence * 100}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 rounded-full"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-3">
              <button
                onClick={handleTryAgain}
                className="flex-1 btn-secondary"
              >
                Tentar Novamente
              </button>
              <button
                onClick={handleConfirmDetection}
                className="flex-1 btn-primary flex items-center justify-center space-x-2"
              >
                <span>Confirmar e Continuar</span>
                <ArrowRightIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Additional Info */}
            <div className="text-center text-sm text-gray-500 dark:text-gray-400">
              <p>Você pode trocar de assistente a qualquer momento durante a conversa</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ProfileDetector