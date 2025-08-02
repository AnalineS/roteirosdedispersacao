import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  QuestionMarkCircleIcon,
  ChevronDownIcon,
  MagnifyingGlassIcon,
  TagIcon,
  LightBulbIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  PlusIcon
} from '@heroicons/react/24/outline'
import { useChat } from '@hooks/useChat'

interface FAQItem {
  id: string
  question: string
  answer: {
    technical: string
    simple: string
  }
  category: string
  tags: string[]
  helpfulCount: number
  notHelpfulCount: number
  relatedQuestions?: string[]
  lastUpdated?: string
}

interface DynamicFAQProps {
  diseaseId: string
  faqs: FAQItem[]
  onQuestionClick?: (faq: FAQItem) => void
  allowUserQuestions?: boolean
}

const DynamicFAQ: React.FC<DynamicFAQProps> = ({
  diseaseId,
  faqs,
  onQuestionClick,
  allowUserQuestions = true
}) => {
  const { selectedPersona } = useChat()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [userFeedback, setUserFeedback] = useState<Record<string, 'helpful' | 'not-helpful' | null>>({})
  const [showAddQuestion, setShowAddQuestion] = useState(false)
  const [newQuestion, setNewQuestion] = useState('')

  // Load user feedback from localStorage
  useEffect(() => {
    const savedFeedback = localStorage.getItem(`faq-feedback-${diseaseId}`)
    if (savedFeedback) {
      setUserFeedback(JSON.parse(savedFeedback))
    }
  }, [diseaseId])

  // Extract unique categories
  const categories = Array.from(new Set(faqs.map(faq => faq.category)))

  // Filter FAQs based on search and category
  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = searchTerm === '' || 
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.simple.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesCategory = !selectedCategory || faq.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  // Group FAQs by category
  const groupedFAQs = filteredFAQs.reduce((acc, faq) => {
    if (!acc[faq.category]) {
      acc[faq.category] = []
    }
    acc[faq.category].push(faq)
    return acc
  }, {} as Record<string, FAQItem[]>)

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
      // Track question view
      if (onQuestionClick) {
        const faq = faqs.find(f => f.id === id)
        if (faq) onQuestionClick(faq)
      }
    }
    setExpandedItems(newExpanded)
  }

  const handleFeedback = (faqId: string, isHelpful: boolean) => {
    const feedback: 'helpful' | 'not-helpful' = isHelpful ? 'helpful' : 'not-helpful'
    setUserFeedback(prev => {
      const updated = { ...prev, [faqId]: feedback }
      localStorage.setItem(`faq-feedback-${diseaseId}`, JSON.stringify(updated))
      return updated
    })

    // In a real app, this would send feedback to the backend
    console.log(`FAQ ${faqId} marked as ${feedback}`)
  }

  const handleSubmitQuestion = () => {
    if (newQuestion.trim()) {
      // In a real app, this would send the question to the backend
      console.log('New question submitted:', newQuestion)
      setNewQuestion('')
      setShowAddQuestion(false)
      // Show success message
      alert('Sua pergunta foi enviada! Responderemos em breve.')
    }
  }

  const isTechnicalPersona = selectedPersona === 'dr_gasnelio'

  return (
    <div className="space-y-6">
      {/* Header and Search */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <QuestionMarkCircleIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Perguntas Frequentes
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Encontre respostas para as dúvidas mais comuns
              </p>
            </div>
          </div>
          {allowUserQuestions && (
            <button
              onClick={() => setShowAddQuestion(true)}
              className="btn-primary flex items-center space-x-2 text-sm"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Fazer pergunta</span>
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar perguntas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              !selectedCategory
                ? 'bg-primary-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Todas ({faqs.length})
          </button>
          {categories.map(category => {
            const count = faqs.filter(f => f.category === category).length
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {category} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {/* Results Summary */}
      {searchTerm && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Mostrando {filteredFAQs.length} resultado{filteredFAQs.length !== 1 ? 's' : ''} 
          {searchTerm && ` para "${searchTerm}"`}
        </div>
      )}

      {/* FAQ Items */}
      {Object.entries(groupedFAQs).map(([category, categoryFAQs]) => (
        <div key={category} className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center">
            <TagIcon className="w-5 h-5 mr-2 text-gray-400" />
            {category}
          </h3>
          
          {categoryFAQs.map((faq, index) => {
            const isExpanded = expandedItems.has(faq.id)
            const userVote = userFeedback[faq.id]
            
            return (
              <motion.div
                key={faq.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                {/* Question */}
                <button
                  onClick={() => toggleExpanded(faq.id)}
                  className="w-full px-6 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
                  aria-expanded={isExpanded}
                  aria-controls={`faq-answer-${faq.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 pr-4">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        {faq.question}
                      </h4>
                      {faq.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {faq.tags.map((tag, tagIndex) => (
                            <span
                              key={tagIndex}
                              className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                    </motion.div>
                  </div>
                </button>

                {/* Answer */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      id={`faq-answer-${faq.id}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 pt-2 border-t border-gray-200 dark:border-gray-700">
                        {/* Answer content */}
                        <div className="prose prose-sm max-w-none dark:prose-invert mb-4">
                          <p>{isTechnicalPersona ? faq.answer.technical : faq.answer.simple}</p>
                        </div>

                        {/* Related Questions */}
                        {faq.relatedQuestions && faq.relatedQuestions.length > 0 && (
                          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4">
                            <div className="flex items-center text-sm text-blue-700 dark:text-blue-300 mb-2">
                              <LightBulbIcon className="w-4 h-4 mr-2" />
                              Perguntas relacionadas:
                            </div>
                            <ul className="text-sm text-blue-600 dark:text-blue-400 space-y-1">
                              {faq.relatedQuestions.map((question, qIndex) => (
                                <li key={qIndex} className="hover:underline cursor-pointer">
                                  • {question}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Feedback */}
                        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                          <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              Esta resposta foi útil?
                            </span>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleFeedback(faq.id, true)}
                                className={`flex items-center space-x-1 px-3 py-1 rounded-lg transition-colors ${
                                  userVote === 'helpful'
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                                aria-label="Marcar como útil"
                              >
                                <HandThumbUpIcon className="w-4 h-4" />
                                <span className="text-xs">{faq.helpfulCount}</span>
                              </button>
                              <button
                                onClick={() => handleFeedback(faq.id, false)}
                                className={`flex items-center space-x-1 px-3 py-1 rounded-lg transition-colors ${
                                  userVote === 'not-helpful'
                                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                                aria-label="Marcar como não útil"
                              >
                                <HandThumbDownIcon className="w-4 h-4" />
                                <span className="text-xs">{faq.notHelpfulCount}</span>
                              </button>
                            </div>
                          </div>
                          {faq.lastUpdated && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Atualizado em {new Date(faq.lastUpdated).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      ))}

      {/* No results */}
      {filteredFAQs.length === 0 && (
        <div className="text-center py-12">
          <QuestionMarkCircleIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Nenhuma pergunta encontrada
            {searchTerm && ` para "${searchTerm}"`}
          </p>
          {allowUserQuestions && (
            <button
              onClick={() => setShowAddQuestion(true)}
              className="mt-4 text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium"
            >
              Fazer uma pergunta
            </button>
          )}
        </div>
      )}

      {/* Add Question Modal */}
      <AnimatePresence>
        {showAddQuestion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddQuestion(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-xl"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Fazer uma pergunta
              </h3>
              <textarea
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="Digite sua pergunta aqui..."
                className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                rows={4}
              />
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={() => setShowAddQuestion(false)}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmitQuestion}
                  disabled={!newQuestion.trim()}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Enviar pergunta
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default DynamicFAQ