import React from 'react'

const SkipNavigation: React.FC = () => {
  return (
    <>
      <a
        href="#main-content"
        className="skip-link"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            const target = document.getElementById('main-content')
            if (target) {
              target.focus()
              target.scrollIntoView()
            }
          }
        }}
      >
        Pular para o conteúdo principal
      </a>
      <a
        href="#chat-section"
        className="skip-link"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            const target = document.getElementById('chat-section')
            if (target) {
              target.focus()
              target.scrollIntoView()
            }
          }
        }}
      >
        Pular para o chat
      </a>
      <a
        href="#navigation"
        className="skip-link"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            const target = document.getElementById('navigation')
            if (target) {
              target.focus()
              target.scrollIntoView()
            }
          }
        }}
      >
        Pular para a navegação
      </a>
    </>
  )
}

export default SkipNavigation