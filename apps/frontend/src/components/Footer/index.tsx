import React from 'react'
import { Link } from 'react-router-dom'
import { HeartIcon } from '@heroicons/react/24/solid'

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear()

  const footerLinks = [
    {
      title: 'Navegação',
      links: [
        { name: 'Início', href: '/' },
        { name: 'Chat', href: '/chat' },
        { name: 'Sobre', href: '/about' },
        { name: 'Recursos', href: '/resources' },
      ],
    },
    {
      title: 'Informações',
      links: [
        { name: 'Sobre o PQT-U', href: '/about#pqt-u' },
        { name: 'Hanseníase', href: '/about#hanseniase' },
        { name: 'Como usar', href: '/about#como-usar' },
        { name: 'FAQ', href: '/resources#faq' },
      ],
    },
    {
      title: 'Recursos',
      links: [
        { name: 'Glossário', href: '/resources#glossario' },
        { name: 'Referências', href: '/resources#referencias' },
        { name: 'Materiais', href: '/resources#materiais' },
        { name: 'Tutorial', href: '/resources#tutorial' },
      ],
    },
  ]

  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">PQT</span>
              </div>
              <span className="font-bold text-lg text-gradient">
                Roteiro Dispensação
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
              Sistema inteligente de apoio à dispensação de medicamentos para tratamento da hanseníase.
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Baseado na tese de doutorado sobre PQT-U (Poliquimioterapia Única).
            </p>
          </div>

          {/* Links */}
          {footerLinks.map((section) => (
            <div key={section.title} className="col-span-1">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
                {section.title}
              </h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-200 dark:border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              © {currentYear} Roteiro de Dispensação. Todos os direitos reservados.
            </p>
            <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400 text-sm mt-2 md:mt-0">
              <span>Feito com</span>
              <HeartIcon className="w-4 h-4 text-red-500" />
              <span>para profissionais de saúde</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer