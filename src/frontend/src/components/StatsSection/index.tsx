import React from 'react'
import { motion } from 'framer-motion'
import { useQuery } from 'react-query'
import { statsApi } from '@services/api'
import { 
  ChartBarIcon, 
  UserGroupIcon, 
  ClockIcon, 
  StarIcon 
} from '@heroicons/react/24/outline'

const StatsSection: React.FC = () => {
  const { data: statsData, isLoading } = useQuery(
    'system-stats',
    statsApi.getStats,
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    }
  )

  const stats = React.useMemo(() => {
    if (!statsData?.system_stats) {
      return [
        { label: 'Consultas Realizadas', value: '10K+', icon: ChartBarIcon },
        { label: 'Profissionais Atendidos', value: '2.5K+', icon: UserGroupIcon },
        { label: 'Disponibilidade', value: '99.9%', icon: ClockIcon },
        { label: 'Avaliação Média', value: '4.9/5', icon: StarIcon },
      ]
    }

    const systemStats = statsData.system_stats
    return [
      {
        label: 'Total de Feedbacks',
        value: systemStats.rag_system.total_feedback.toLocaleString(),
        icon: ChartBarIcon,
      },
      {
        label: 'Avaliação Média',
        value: `${systemStats.rag_system.average_rating.toFixed(1)}/5`,
        icon: StarIcon,
      },
      {
        label: 'IPs Ativos',
        value: systemStats.rate_limiter.active_ips.toLocaleString(),
        icon: UserGroupIcon,
      },
      {
        label: 'Respostas em Cache',
        value: systemStats.rag_system.cache_stats.cached_responses.toLocaleString(),
        icon: ClockIcon,
      },
    ]
  }, [statsData])

  return (
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
            Nossa Performance
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Números que demonstram a qualidade e confiabilidade do nosso sistema 
            de apoio à dispensação farmacêutica.
          </p>
        </motion.div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card p-8 text-center">
                <div className="animate-pulse">
                  <div className="w-12 h-12 bg-gray-300 dark:bg-gray-700 rounded-full mx-auto mb-4"></div>
                  <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>
                  <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="card p-8 text-center hover:shadow-lg transition-all duration-300"
                >
                  {/* Icon */}
                  <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>

                  {/* Value */}
                  <motion.div
                    className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2"
                    initial={{ scale: 0.5 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ 
                      duration: 0.8, 
                      delay: index * 0.1 + 0.3,
                      type: "spring",
                      bounce: 0.4
                    }}
                  >
                    {stat.value}
                  </motion.div>

                  {/* Label */}
                  <div className="text-gray-600 dark:text-gray-400 font-medium">
                    {stat.label}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Additional Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center px-6 py-3 bg-success-100 dark:bg-success-900/20 text-success-800 dark:text-success-200 rounded-full">
            <div className="w-2 h-2 bg-success-500 rounded-full mr-3 animate-pulse"></div>
            <span className="text-sm font-medium">
              Sistema operacional e em constante aprimoramento
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default StatsSection