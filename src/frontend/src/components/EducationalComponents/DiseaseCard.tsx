import React from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { 
  ChevronRightIcon,
  ClockIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline'

interface DiseaseInfo {
  id: string
  name: string
  shortDescription: string
  prevalence: string
  treatmentDuration: string
  complexity: 'low' | 'medium' | 'high'
  status: 'available' | 'coming-soon' | 'under-development'
  icon?: string
  primaryColor: string
  statistics?: {
    patientsHelped?: number
    questionsAnswered?: number
    satisfactionRate?: number
  }
}

interface DiseaseCardProps {
  disease: DiseaseInfo
  isSelected?: boolean
  onSelect?: () => void
}

const DiseaseCard: React.FC<DiseaseCardProps> = ({ 
  disease, 
  isSelected = false,
  onSelect 
}) => {
  const complexityColors = {
    low: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    high: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
  }

  const complexityLabels = {
    low: 'Tratamento Simples',
    medium: 'Complexidade Média',
    high: 'Tratamento Complexo'
  }

  const statusIcons = {
    'available': <CheckCircleIcon className="w-5 h-5 text-green-500" />,
    'coming-soon': <ClockIcon className="w-5 h-5 text-yellow-500" />,
    'under-development': <ExclamationCircleIcon className="w-5 h-5 text-gray-400" />
  }

  const isClickable = disease.status === 'available'

  const CardContent = () => (
    <motion.div
      className={`relative overflow-hidden rounded-xl border-2 transition-all duration-300 ${
        isSelected 
          ? 'border-primary-500 shadow-xl' 
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      } ${
        isClickable 
          ? 'cursor-pointer hover:shadow-lg' 
          : 'cursor-not-allowed opacity-75'
      }`}
      whileHover={isClickable ? { y: -4 } : {}}
      whileTap={isClickable ? { scale: 0.98 } : {}}
      onClick={isClickable ? onSelect : undefined}
      style={{
        background: `linear-gradient(135deg, ${disease.primaryColor}10 0%, transparent 100%)`
      }}
    >
      {/* Status Badge */}
      <div className="absolute top-4 right-4 z-10">
        <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 rounded-full px-3 py-1 shadow-md">
          {statusIcons[disease.status]}
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {disease.status === 'available' ? 'Disponível' : 
             disease.status === 'coming-soon' ? 'Em breve' : 'Em desenvolvimento'}
          </span>
        </div>
      </div>

      {/* Card Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start space-x-4">
          {/* Disease Icon */}
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl shadow-lg"
            style={{ backgroundColor: disease.primaryColor + '20' }}
          >
            {disease.icon || disease.name.charAt(0)}
          </div>

          {/* Disease Info */}
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
              {disease.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {disease.shortDescription}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800/50">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <UserGroupIcon className="w-4 h-4 mx-auto text-gray-400 mb-1" />
            <div className="text-xs text-gray-500 dark:text-gray-400">Prevalência</div>
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {disease.prevalence}
            </div>
          </div>
          <div>
            <ClockIcon className="w-4 h-4 mx-auto text-gray-400 mb-1" />
            <div className="text-xs text-gray-500 dark:text-gray-400">Duração</div>
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              {disease.treatmentDuration}
            </div>
          </div>
          <div>
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${complexityColors[disease.complexity]}`}>
              {complexityLabels[disease.complexity]}
            </div>
          </div>
        </div>
      </div>

      {/* Statistics (if available) */}
      {disease.statistics && disease.status === 'available' && (
        <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500 dark:text-gray-400">
              {disease.statistics.patientsHelped?.toLocaleString()} pessoas ajudadas
            </span>
            <span className="text-green-600 dark:text-green-400 font-medium">
              {disease.statistics.satisfactionRate}% satisfação
            </span>
          </div>
        </div>
      )}

      {/* Action Area */}
      {isClickable && (
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
              Acessar informações
            </span>
            <ChevronRightIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
        </div>
      )}

      {/* Coming Soon Overlay */}
      {disease.status !== 'available' && (
        <div className="absolute inset-0 bg-gray-900/10 dark:bg-gray-900/30 backdrop-blur-[1px] rounded-xl" />
      )}
    </motion.div>
  )

  if (disease.status === 'available' && onSelect) {
    return <CardContent />
  }

  return (
    <Link 
      to={disease.status === 'available' ? `/diseases/${disease.id}` : '#'}
      className="block"
      onClick={e => {
        if (disease.status !== 'available') {
          e.preventDefault()
        }
      }}
    >
      <CardContent />
    </Link>
  )
}

export default DiseaseCard