import React from 'react'
import { motion } from 'framer-motion'
import { 
  BookOpenIcon,
  BeakerIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'

const AboutPage: React.FC = () => {
  const features = [
    {
      icon: BeakerIcon,
      title: 'Baseado em Pesquisa',
      description: 'Fundamentado em tese de doutorado sobre PQT-U (Poliquimioterapia Única) para hanseníase.'
    },
    {
      icon: SparklesIcon,
      title: 'IA Especializada',
      description: 'Assistentes virtuais treinados especificamente para dispensação farmacêutica.'
    },
    {
      icon: ShieldCheckIcon,
      title: 'Informações Confiáveis',
      description: 'Conteúdo validado por especialistas e baseado em evidências científicas.'
    },
    {
      icon: UserGroupIcon,
      title: 'Para Profissionais',
      description: 'Desenvolvido especificamente para farmacêuticos e profissionais de saúde.'
    }
  ]

  const personas = [
    {
      name: 'Dr. Gasnelio',
      role: 'Especialista Técnico',
      description: 'Fornece informações técnicas precisas sobre dosagens, interações e protocolos de dispensação baseados na pesquisa científica.',
      focus: 'Aspectos técnicos e farmacológicos'
    },
    {
      name: 'Gá',
      role: 'Comunicadora Empática',
      description: 'Traduz informações complexas em linguagem acessível, oferecendo suporte emocional e orientações práticas.',
      focus: 'Comunicação e suporte humano'
    }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              Sobre o <span className="text-gradient">Roteiro de Dispensação</span>
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Um sistema inteligente desenvolvido para apoiar profissionais de saúde 
              na dispensação segura e eficaz de medicamentos para tratamento da hanseníase.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Project Overview */}
      <section className="py-16 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                O Projeto
              </h2>
              <div className="space-y-4 text-gray-600 dark:text-gray-400">
                <p>
                  Este sistema foi desenvolvido com base em uma tese de doutorado sobre 
                  Poliquimioterapia Única (PQT-U) para o tratamento da hanseníase, 
                  representando o estado da arte em conhecimento científico sobre o tema.
                </p>
                <p>
                  A hanseníase é uma doença tropical negligenciada que ainda afeta 
                  milhares de pessoas no Brasil. O tratamento adequado com PQT-U é 
                  fundamental para a cura e prevenção de sequelas.
                </p>
                <p>
                  Nosso sistema utiliza inteligência artificial para disponibilizar 
                  esse conhecimento especializado de forma acessível, apoiando 
                  profissionais de saúde na tomada de decisões informadas.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl p-8 text-white">
                <BookOpenIcon className="w-12 h-12 mb-4" />
                <h3 className="text-xl font-bold mb-2">PQT-U</h3>
                <p className="text-primary-100">
                  Poliquimioterapia Única é um esquema terapêutico inovador que 
                  unifica o tratamento da hanseníase, independentemente da 
                  classificação operacional do paciente.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Características do Sistema
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Conheça as principais características que tornam nosso sistema 
              uma ferramenta confiável e eficaz.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="card p-6"
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Personas */}
      <section className="py-16 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Nossos Assistentes Virtuais
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Conheça os especialistas virtuais desenvolvidos para atender 
              diferentes necessidades de comunicação e informação.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {personas.map((persona, index) => (
              <motion.div
                key={persona.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="card p-8"
              >
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white font-bold text-2xl">
                      {persona.name.charAt(0)}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                    {persona.name}
                  </h3>
                  <span className="badge-primary">
                    {persona.role}
                  </span>
                </div>

                <p className="text-gray-600 dark:text-gray-400 mb-4 text-center">
                  {persona.description}
                </p>

                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                    Área de Foco:
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {persona.focus}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How to Use */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Como Usar o Sistema
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              Siga estes passos simples para obter orientações especializadas 
              sobre dispensação de medicamentos.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Escolha um Assistente',
                description: 'Selecione o assistente virtual mais adequado para sua necessidade específica.'
              },
              {
                step: '2',
                title: 'Faça sua Pergunta',
                description: 'Digite sua pergunta sobre dosagens, protocolos ou orientações de dispensação.'
              },
              {
                step: '3',
                title: 'Receba Orientações',
                description: 'Obtenha respostas baseadas em evidências científicas e melhores práticas.'
              }
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="text-center"
              >
                <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-12 bg-warning-50 dark:bg-warning-900/20 border-t border-warning-200 dark:border-warning-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h3 className="text-lg font-semibold text-warning-800 dark:text-warning-200 mb-3">
              Importante
            </h3>
            <p className="text-warning-700 dark:text-warning-300 max-w-4xl mx-auto">
              Este sistema fornece informações baseadas em pesquisa científica e deve 
              ser usado como ferramenta de apoio à decisão clínica. Sempre consulte 
              diretrizes oficiais, protocolos institucionais e, quando necessário, 
              profissionais especializados para orientações específicas sobre casos 
              particulares.
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default AboutPage