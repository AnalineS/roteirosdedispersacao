import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  BookOpenIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  QuestionMarkCircleIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  LinkIcon
} from '@heroicons/react/24/outline'

const ResourcesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('glossario')
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

  const tabs = [
    { id: 'glossario', label: 'Glossário', icon: BookOpenIcon },
    { id: 'referencias', label: 'Referências', icon: DocumentTextIcon },
    { id: 'materiais', label: 'Materiais', icon: AcademicCapIcon },
    { id: 'faq', label: 'FAQ', icon: QuestionMarkCircleIcon },
  ]

  const glossaryTerms = [
    {
      term: 'PQT-U',
      definition: 'Poliquimioterapia Única - esquema terapêutico unificado para tratamento da hanseníase, independente da classificação operacional.',
      category: 'Tratamento'
    },
    {
      term: 'Hanseníase',
      definition: 'Doença infecciosa crônica causada pelo Mycobacterium leprae, que afeta principalmente a pele e os nervos periféricos.',
      category: 'Doença'
    },
    {
      term: 'Rifampicina',
      definition: 'Antibiótico bactericida de primeira linha no tratamento da hanseníase, com dose de 600mg para adultos.',
      category: 'Medicamento'
    },
    {
      term: 'Clofazimina',
      definition: 'Antimicobacteriano com propriedades anti-inflamatórias, dose de 300mg no primeiro dia e 50mg nos demais.',
      category: 'Medicamento'
    },
    {
      term: 'Dapsona',
      definition: 'Sulfona com ação bacteriostática contra o M. leprae, dose de 100mg diária para adultos.',
      category: 'Medicamento'
    },
    {
      term: 'Dispensação',
      definition: 'Ato farmacêutico de entrega do medicamento ao paciente, acompanhado de orientações sobre uso correto.',
      category: 'Farmácia'
    }
  ]

  const references = [
    {
      title: 'Diretrizes para vigilância, atenção e eliminação da hanseníase como problema de saúde pública',
      author: 'Ministério da Saúde do Brasil',
      year: '2016',
      type: 'Manual Técnico',
      link: '#'
    },
    {
      title: 'Enhanced global strategy for further reducing the disease burden due to leprosy',
      author: 'WHO',
      year: '2019',
      type: 'Estratégia Global',
      link: '#'
    },
    {
      title: 'Poliquimioterapia única no tratamento da hanseníase: estudo clínico randomizado',
      author: 'Tese de Doutorado - Base do Sistema',
      year: '2023',
      type: 'Pesquisa Científica',
      link: '#'
    }
  ]

  const materials = [
    {
      title: 'Guia de Dispensação PQT-U',
      description: 'Manual prático para farmacêuticos sobre dispensação de poliquimioterapia única.',
      type: 'PDF',
      size: '2.1 MB',
      link: '#'
    },
    {
      title: 'Cartilha para Pacientes',
      description: 'Material educativo sobre o tratamento da hanseníase com PQT-U.',
      type: 'PDF',
      size: '1.5 MB',
      link: '#'
    },
    {
      title: 'Protocolo de Segurança',
      description: 'Diretrizes para manuseio seguro e dispensação de medicamentos.',
      type: 'DOCX',
      size: '850 KB',
      link: '#'
    }
  ]

  const faqs = [
    {
      question: 'O que é PQT-U e como difere do esquema tradicional?',
      answer: 'PQT-U (Poliquimioterapia Única) é um esquema terapêutico inovador que unifica o tratamento da hanseníase. Diferente dos esquemas tradicionais que variam conforme a classificação (paucibacilar ou multibacilar), o PQT-U utiliza a mesma combinação de medicamentos para todos os pacientes, simplificando o tratamento e reduzindo erros.'
    },
    {
      question: 'Qual a composição e dosagem do PQT-U?',
      answer: 'O PQT-U é composto por: Rifampicina 600mg (mensal), Clofazimina 300mg no primeiro dia e 50mg diariamente, e Dapsona 100mg diariamente. O tratamento tem duração de 6 meses para todos os pacientes, independente da classificação operacional.'
    },
    {
      question: 'Como orientar o paciente sobre os efeitos colaterais?',
      answer: 'Os principais efeitos incluem: coloração alaranjada da urina (rifampicina), escurecimento da pele (clofazimina) e possível anemia hemolítica (dapsona). É importante explicar que a coloração da pele pela clofazimina é reversível, mas pode durar anos. Oriente sobre sinais de alerta e quando procurar atendimento médico.'
    },
    {
      question: 'Quais são as principais interações medicamentosas?',
      answer: 'Rifampicina pode reduzir a eficácia de contraceptivos orais, anticoagulantes e alguns antirretrovirais. Dapsona pode interagir com trimetoprima. Sempre verificar a lista completa de medicamentos do paciente e consultar o médico quando necessário.'
    },
    {
      question: 'Como proceder em caso de efeitos adversos graves?',
      answer: 'Suspender imediatamente o medicamento suspeito, encaminhar para avaliação médica urgente e notificar o evento adverso. Principais sinais de alerta: icterícia, anemia severa, neuropatia periférica aguda, reações cutâneas graves.'
    }
  ]

  const filteredGlossary = glossaryTerms.filter(item =>
    item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.definition.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <section className="py-16 bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              Recursos <span className="text-gradient">Educacionais</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Acesse materiais educacionais, referências científicas e recursos 
              para aprimorar seu conhecimento sobre dispensação de PQT-U.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Tabs */}
          <div className="flex flex-wrap justify-center mb-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-6 py-3 mx-1 mb-2 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-primary-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-primary-100 dark:hover:bg-primary-900/20'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>

          {/* Search */}
          {activeTab === 'glossario' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-md mx-auto mb-8"
            >
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar no glossário..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </motion.div>
          )}

          {/* Content Tabs */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'glossario' && (
              <div className="space-y-4">
                {filteredGlossary.map((item, index) => (
                  <motion.div
                    key={item.term}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="card p-6"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                            {item.term}
                          </h3>
                          <span className="badge-primary">
                            {item.category}
                          </span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400">
                          {item.definition}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {activeTab === 'referencias' && (
              <div className="space-y-4">
                {references.map((ref, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="card p-6"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {ref.title}
                          </h3>
                          <span className="badge-secondary">
                            {ref.type}
                          </span>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400 mb-1">
                          {ref.author} • {ref.year}
                        </p>
                      </div>
                      <button className="btn-ghost p-2">
                        <LinkIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {activeTab === 'materiais' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {materials.map((material, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="card p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="text-center">
                      <DocumentTextIcon className="w-12 h-12 text-primary-600 dark:text-primary-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        {material.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                        {material.description}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4">
                        <span>{material.type}</span>
                        <span>{material.size}</span>
                      </div>
                      <button className="btn-primary w-full">
                        Download
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {activeTab === 'faq' && (
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="card"
                  >
                    <button
                      onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                      className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 pr-4">
                        {faq.question}
                      </h3>
                      {expandedFaq === index ? (
                        <ChevronDownIcon className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronRightIcon className="w-5 h-5 text-gray-500" />
                      )}
                    </button>
                    
                    {expandedFaq === index && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="px-6 pb-6"
                      >
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                          {faq.answer}
                        </p>
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default ResourcesPage