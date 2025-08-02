import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline'

interface MedicationPhase {
  id: string
  name: string
  duration: string
  medications: {
    name: string
    dosage: string
    frequency: string
    important?: boolean
  }[]
  sideEffects?: string[]
  importantNotes?: string[]
  startWeek: number
  endWeek: number
}

interface MedicationTimelineProps {
  phases: MedicationPhase[]
  currentWeek?: number
  onPhaseClick?: (phase: MedicationPhase) => void
}

const MedicationTimeline: React.FC<MedicationTimelineProps> = ({
  phases,
  currentWeek = 0,
  onPhaseClick
}) => {
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null)
  const [hoveredPhase, setHoveredPhase] = useState<string | null>(null)

  const totalWeeks = Math.max(...phases.map(p => p.endWeek))

  const getPhaseStatus = (phase: MedicationPhase) => {
    if (currentWeek < phase.startWeek) return 'upcoming'
    if (currentWeek >= phase.startWeek && currentWeek <= phase.endWeek) return 'current'
    return 'completed'
  }

  const getPhaseColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 border-green-600'
      case 'current':
        return 'bg-primary-500 border-primary-600 animate-pulse'
      case 'upcoming':
        return 'bg-gray-300 border-gray-400 dark:bg-gray-600 dark:border-gray-500'
      default:
        return 'bg-gray-300 border-gray-400'
    }
  }

  return (
    <div className="space-y-6">
      {/* Timeline Header */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <CalendarIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div>
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                Cronograma de Tratamento
              </h3>
              {currentWeek > 0 && (
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Semana {currentWeek} de {totalWeeks}
                </p>
              )}
            </div>
          </div>
          <div className="text-sm text-blue-700 dark:text-blue-300">
            {Math.round((currentWeek / totalWeeks) * 100)}% concluído
          </div>
        </div>
      </div>

      {/* Timeline Visualization */}
      <div className="relative">
        {/* Progress Bar Background */}
        <div className="absolute top-12 left-0 right-0 h-2 bg-gray-200 dark:bg-gray-700 rounded-full" />
        
        {/* Progress Bar Fill */}
        <div 
          className="absolute top-12 left-0 h-2 bg-primary-500 rounded-full transition-all duration-500"
          style={{ width: `${(currentWeek / totalWeeks) * 100}%` }}
        />

        {/* Phase Markers */}
        <div className="relative pt-8 pb-4">
          <div className="flex justify-between">
            {phases.map((phase, index) => {
              const status = getPhaseStatus(phase)
              const position = ((phase.startWeek + phase.endWeek) / 2 / totalWeeks) * 100

              return (
                <motion.div
                  key={phase.id}
                  className="absolute transform -translate-x-1/2"
                  style={{ left: `${position}%` }}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <button
                    onClick={() => {
                      setSelectedPhase(phase.id)
                      onPhaseClick?.(phase)
                    }}
                    onMouseEnter={() => setHoveredPhase(phase.id)}
                    onMouseLeave={() => setHoveredPhase(null)}
                    className={`w-8 h-8 rounded-full border-2 transition-all duration-300 ${
                      getPhaseColor(status)
                    } ${
                      selectedPhase === phase.id || hoveredPhase === phase.id
                        ? 'scale-125 shadow-lg'
                        : ''
                    }`}
                    aria-label={`${phase.name} - ${status}`}
                  >
                    {status === 'completed' && (
                      <CheckCircleIcon className="w-4 h-4 text-white mx-auto" />
                    )}
                    {status === 'current' && (
                      <div className="w-2 h-2 bg-white rounded-full mx-auto" />
                    )}
                  </button>
                  
                  {/* Phase Label */}
                  <div className="mt-2 text-center">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      {phase.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {phase.duration}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Phase Details */}
      {selectedPhase && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-6"
        >
          {(() => {
            const phase = phases.find(p => p.id === selectedPhase)!
            const status = getPhaseStatus(phase)

            return (
              <>
                {/* Phase Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {phase.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Semanas {phase.startWeek} - {phase.endWeek} ({phase.duration})
                    </p>
                  </div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    status === 'completed' 
                      ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                      : status === 'current'
                      ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                      : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                  }`}>
                    {status === 'completed' ? 'Concluída' : 
                     status === 'current' ? 'Em andamento' : 'Próxima fase'}
                  </span>
                </div>

                {/* Medications */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                    Medicamentos desta fase:
                  </h4>
                  <div className="space-y-2">
                    {phase.medications.map((med, index) => (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-3 rounded-lg ${
                          med.important
                            ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                            : 'bg-gray-50 dark:bg-gray-700/50'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          {med.important && (
                            <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                          )}
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {med.name}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {med.dosage} - {med.frequency}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Side Effects */}
                {phase.sideEffects && phase.sideEffects.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                      <InformationCircleIcon className="w-4 h-4 mr-2" />
                      Possíveis efeitos colaterais:
                    </h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      {phase.sideEffects.map((effect, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-gray-400 mr-2">•</span>
                          {effect}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Important Notes */}
                {phase.importantNotes && phase.importantNotes.length > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      Observações importantes:
                    </h4>
                    <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                      {phase.importantNotes.map((note, index) => (
                        <li key={index} className="flex items-start">
                          <CheckCircleIcon className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                          {note}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Close Button */}
                <button
                  onClick={() => setSelectedPhase(null)}
                  className="mt-4 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Fechar detalhes
                </button>
              </>
            )
          })()}
        </motion.div>
      )}

      {/* Next Steps */}
      {currentWeek > 0 && currentWeek < totalWeeks && (
        <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ClockIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              <div>
                <p className="text-sm font-semibold text-primary-900 dark:text-primary-100">
                  Próxima fase em {phases.find(p => getPhaseStatus(p) === 'upcoming')?.startWeek! - currentWeek} semanas
                </p>
                <p className="text-xs text-primary-700 dark:text-primary-300">
                  Continue seguindo o tratamento conforme prescrito
                </p>
              </div>
            </div>
            <ArrowRightIcon className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
        </div>
      )}
    </div>
  )
}

export default MedicationTimeline