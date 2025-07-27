import React from 'react'
import { motion } from 'framer-motion'
import { useTheme } from '@hooks/useTheme'
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@heroicons/react/24/outline'

const ThemeToggle: React.FC = () => {
  const { theme, setTheme } = useTheme()

  const themes = [
    { key: 'light' as const, icon: SunIcon, label: 'Claro' },
    { key: 'dark' as const, icon: MoonIcon, label: 'Escuro' },
    { key: 'system' as const, icon: ComputerDesktopIcon, label: 'Sistema' },
  ]

  return (
    <div className="relative">
      <div 
        className="flex rounded-lg bg-gray-100 dark:bg-gray-800 p-1"
        role="radiogroup"
        aria-label="Seleção de tema"
      >
        {themes.map((themeOption) => {
          const Icon = themeOption.icon
          const isActive = theme === themeOption.key

          return (
            <motion.button
              key={themeOption.key}
              onClick={() => setTheme(themeOption.key)}
              className={`relative p-2 rounded-md transition-colors ${
                isActive
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label={`Trocar para tema ${themeOption.label}`}
              aria-pressed={isActive}
              role="radio"
              aria-checked={isActive}
            >
              {isActive && (
                <motion.div
                  layoutId="theme-indicator"
                  className="absolute inset-0 bg-white dark:bg-gray-700 rounded-md shadow-sm"
                  initial={false}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                />
              )}
              <Icon className="w-4 h-4 relative z-10" aria-hidden="true" />
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

export default ThemeToggle