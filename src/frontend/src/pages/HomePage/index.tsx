import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useChat } from '@hooks/useChat'
import ColorSchemePreview from '@components/ColorSchemePreview'

const HomePage: React.FC = () => {
  const { personas, isPersonasLoading, setSelectedPersona } = useChat()
  const [showColorPreview, setShowColorPreview] = useState(false)

  return (
    <div className="medical-app">
      {/* Header Médico */}
      <header className="medical-header">
        <div className="header-content">
          <div className="header-brand">
            <div className="brand-icon">RD</div>
            <div>
              <div className="brand-title">Roteiro de Dispensação</div>
              <div className="brand-subtitle">Sistema PQT-U Hanseníase</div>
            </div>
          </div>
          <nav className="header-nav">
            <a href="#recursos" className="nav-item">Recursos</a>
            <a href="#sobre" className="nav-item">Sobre</a>
            <Link to="/chat" className="nav-item">Chat</Link>
          </nav>
          <button className="menu-toggle" aria-label="Menu">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
            </svg>
          </button>
        </div>
      </header>

      {/* Sidebar Médico */}
      <aside className="medical-sidebar">
        <div className="sidebar-content">
          <div className="sidebar-section">
            <h3 className="section-title">Sistema</h3>
            <ul className="sidebar-nav">
              <li className="sidebar-nav-item">
                <a href="#" className="sidebar-nav-link active">
                  <span className="nav-icon">🏠</span>
                  <span>Início</span>
                </a>
              </li>
              <li className="sidebar-nav-item">
                <Link to="/chat" className="sidebar-nav-link">
                  <span className="nav-icon">💬</span>
                  <span>Chat</span>
                </Link>
              </li>
              <li className="sidebar-nav-item">
                <a href="#recursos" className="sidebar-nav-link">
                  <span className="nav-icon">📚</span>
                  <span>Recursos</span>
                </a>
              </li>
            </ul>
          </div>
          
          <div className="sidebar-section">
            <h3 className="section-title">Especialistas</h3>
            <ul className="sidebar-nav">
              <li className="sidebar-nav-item">
                <a href="#" className="sidebar-nav-link">
                  <span className="nav-icon">👨‍⚕️</span>
                  <span>Dr. Gasnelio</span>
                  <span className="nav-badge">Online</span>
                </a>
              </li>
              <li className="sidebar-nav-item">
                <a href="#" className="sidebar-nav-link">
                  <span className="nav-icon">👩‍⚕️</span>
                  <span>Gá</span>
                  <span className="nav-badge">Online</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <main className="medical-content">
        <div className="content-container">
          {/* Hero Section */}
          <section className="medical-hero fade-in-up">
            <h1 className="hero-title">Sistema Inteligente de Dispensação PQT-U</h1>
            <p className="hero-subtitle">
              Assistente virtual especializado em poliquimioterapia única para hanseníase. 
              Obtenha orientações precisas e baseadas em evidências científicas para dispensação segura de medicamentos.
            </p>
            <div className="hero-actions">
              <Link to="/chat" className="btn-medical btn-primary">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                </svg>
                Iniciar Conversa
              </Link>
              <button 
                onClick={() => setShowColorPreview(true)}
                className="btn-medical btn-secondary"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8z"/>
                </svg>
                Ver Esquemas de Cores
              </button>
            </div>
          </section>

          {/* Cards de Especialistas e Recursos */}
          <section className="medical-cards slide-in-right">
            {/* Card de Especialistas */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="medical-card"
            >
              <div className="card-icon">👨‍⚕️</div>
              <h3 className="card-title">Especialistas Virtuais</h3>
              <p className="card-description">
                Nossos especialistas virtuais estão prontos para ajudar com diferentes aspectos 
                da dispensação de medicamentos para hanseníase.
              </p>
              <Link to="/chat" className="card-action">
                Conversar agora
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
                </svg>
              </Link>
            </motion.div>

            {/* Cards de Personas Dinâmicos */}
            {isPersonasLoading ? (
              <div className="medical-card">
                <div className="card-icon pulse-animation">⏳</div>
                <h3 className="card-title">Carregando especialistas...</h3>
                <p className="card-description">
                  Aguarde enquanto conectamos você aos nossos especialistas virtuais.
                </p>
              </div>
            ) : (
              personas && Object.entries(personas).map(([id, persona], index) => (
                <motion.div
                  key={id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="medical-card"
                >
                  <div className="card-icon">
                    {persona.avatar === 'Dr' ? '👨‍⚕️' : '👩‍⚕️'}
                  </div>
                  <h3 className="card-title">{persona.name}</h3>
                  <p className="card-description">{persona.description}</p>
                  <div style={{ marginBottom: '1rem' }}>
                    <small style={{ color: 'var(--medical-gray-600)' }}>
                      <strong>Especialidade:</strong> {persona.role}
                    </small>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedPersona(id)
                      window.location.href = '/chat'
                    }}
                    className="btn-medical btn-primary"
                    style={{ width: '100%' }}
                  >
                    Conversar com {persona.name}
                  </button>
                </motion.div>
              ))
            )}

            {/* Card de Base de Conhecimento */}
            <div className="medical-card">
              <div className="card-icon">📚</div>
              <h3 className="card-title">Base de Conhecimento</h3>
              <p className="card-description">
                Acesso a informações técnicas baseadas em pesquisa científica sobre PQT-U 
                e dispensação farmacêutica especializada.
              </p>
              <a href="#recursos" className="card-action">
                Explorar recursos
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
                </svg>
              </a>
            </div>

            {/* Card de Educação Continuada */}
            <div className="medical-card">
              <div className="card-icon">🎯</div>
              <h3 className="card-title">Educação Continuada</h3>
              <p className="card-description">
                Materiais educacionais e recursos para aprimoramento profissional 
                na área de hanseníase e dispensação de medicamentos.
              </p>
              <a href="#sobre" className="card-action">
                Saiba mais
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
                </svg>
              </a>
            </div>
          </section>

          {/* Estatísticas do Sistema */}
          <section className="medical-status">
            <h2 className="status-title">
              <div className="status-icon">📊</div>
              Estatísticas do Sistema
            </h2>
            <div className="medical-cards">
              <div className="medical-card">
                <div className="card-icon">💬</div>
                <h3 className="card-title">10K+</h3>
                <p className="card-description">Consultas Realizadas</p>
              </div>
              <div className="medical-card">
                <div className="card-icon">👥</div>
                <h3 className="card-title">2.5K+</h3>
                <p className="card-description">Profissionais Atendidos</p>
              </div>
              <div className="medical-card">
                <div className="card-icon">✅</div>
                <h3 className="card-title">98%</h3>
                <p className="card-description">Taxa de Precisão</p>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* Overlay para mobile */}
      <div className="sidebar-overlay"></div>

      {/* Color Scheme Preview Modal */}
      {showColorPreview && (
        <ColorSchemePreview
          onClose={() => setShowColorPreview(false)}
          onSelect={(schemeId) => {
            console.log('Esquema selecionado:', schemeId)
          }}
        />
      )}
    </div>
  )
}

export default HomePage