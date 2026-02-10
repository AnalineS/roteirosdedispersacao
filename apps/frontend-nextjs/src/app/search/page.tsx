'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ChatAccessibilityProvider } from '@/components/chat/accessibility/ChatAccessibilityProvider';
import { PCDTSearchSystem } from '@/components/search';
import { HeartIcon, PillIcon, BulbIcon } from '@/components/icons/FlatOutlineIcons';

// Carregamento dinâmico para evitar problemas de SSR
const EducationalLayout = dynamic(() => import('@/components/layout/EducationalLayout'), { ssr: false });

export default function SearchPage() {
  const router = useRouter();

  return (
    <ChatAccessibilityProvider>
      <EducationalLayout 
        showBreadcrumbs={true}
        footerVariant="simple"
      >
        <div className="search-page-container">
          {/* Page Header */}
          <header className="search-header">
            <h1 className="search-title">
              🔍 Busca Inteligente
            </h1>
            <p className="search-subtitle">
              Encontre rapidamente informações sobre hanseníase, tratamentos, medicamentos e muito mais
            </p>
          </header>

          {/* Main Search Interface - PCDT Search System */}
          <main className="search-main">
            <section className="search-section" aria-label="Interface de busca principal PCDT">
              <PCDTSearchSystem
                variant="page"
                enableFilterChips={true}
                enableVoiceSearch={true}
                placeholder="Buscar dosagem, contraindicações, efeitos, interações..."
                maxSuggestions={8}
                maxResults={20}
                className="main-search"
              />
            </section>

            {/* Quick Links Section */}
            <section className="quick-links" aria-label="Links rápidos para conteúdo popular">
              <h2 className="quick-links-title">🚀 Acesso Rápido</h2>
              <div className="quick-links-grid">
                {/* Patient Quick Links */}
                <div className="quick-link-category">
                  <h3 className="category-title">👥 Para Pacientes</h3>
                  <div className="category-links">
                    <a href="/vida-com-hanseniase" className="quick-link">
                      <span className="link-icon"><HeartIcon size={20} color="#ef4444" /></span>
                      <span className="link-text">Como Viver Bem</span>
                    </a>
                    <a href="/vida-com-hanseniase#medicamentos" className="quick-link">
                      <span className="link-icon"><PillIcon size={20} color="#8b5cf6" /></span>
                      <span className="link-text">Como Tomar Remédios</span>
                    </a>
                    <a href="/vida-com-hanseniase#direitos" className="quick-link">
                      <span className="link-icon">⚖️</span>
                      <span className="link-text">Seus Direitos</span>
                    </a>
                    <a href="/faq" className="quick-link">
                      <span className="link-icon">❓</span>
                      <span className="link-text">Dúvidas Frequentes</span>
                    </a>
                  </div>
                </div>

                {/* Professional Quick Links */}
                <div className="quick-link-category">
                  <h3 className="category-title">👨‍⚕️ Para Profissionais</h3>
                  <div className="category-links">
                    <a href="/modules/tratamento" className="quick-link">
                      <span className="link-icon">🏥</span>
                      <span className="link-text">Protocolos PQT-U</span>
                    </a>
                    <a href="/resources" className="quick-link">
                      <span className="link-icon">⚠️</span>
                      <span className="link-text">Interações Medicamentosas</span>
                    </a>
                    <a href="/resources/calculator" className="quick-link">
                      <span className="link-icon">🧮</span>
                      <span className="link-text">Calculadora de Doses</span>
                    </a>
                    <a href="/modules/diagnostico" className="quick-link">
                      <span className="link-icon">🔬</span>
                      <span className="link-text">Diagnóstico Clínico</span>
                    </a>
                  </div>
                </div>

                {/* Student Quick Links */}
                <div className="quick-link-category">
                  <h3 className="category-title">🎓 Para Estudantes</h3>
                  <div className="category-links">
                    <a href="/modules/classificacao" className="quick-link">
                      <span className="link-icon">📚</span>
                      <span className="link-text">Classificação MB/PB</span>
                    </a>
                    <a href="/glossario" className="quick-link">
                      <span className="link-icon">📖</span>
                      <span className="link-text">Glossário Médico</span>
                    </a>
                    <a href="/modules/microbiologia" className="quick-link">
                      <span className="link-icon">🦠</span>
                      <span className="link-text">Mycobacterium leprae</span>
                    </a>
                    <a href="/modules/epidemiologia" className="quick-link">
                      <span className="link-icon">🌍</span>
                      <span className="link-text">Epidemiologia</span>
                    </a>
                  </div>
                </div>

                {/* Tools Quick Links */}
                <div className="quick-link-category">
                  <h3 className="category-title">🛠️ Ferramentas</h3>
                  <div className="category-links">
                    <a href="/chat" className="quick-link">
                      <span className="link-icon">🤖</span>
                      <span className="link-text">Assistentes Virtuais</span>
                    </a>
                    <a href="/resources/treatment-card" className="quick-link">
                      <span className="link-icon">📱</span>
                      <span className="link-text">Cartão Digital</span>
                    </a>
                    <a href="/resources/calendar" className="quick-link">
                      <span className="link-icon">📅</span>
                      <span className="link-text">Calendário Médico</span>
                    </a>
                    <a href="/resources/export" className="quick-link">
                      <span className="link-icon">📄</span>
                      <span className="link-text">Exportar Dados</span>
                    </a>
                  </div>
                </div>
              </div>
            </section>

            {/* Search Tips */}
            <section className="search-tips" aria-label="Dicas de busca">
              <h2 className="tips-title"><BulbIcon size={24} color="#00aa44" /> Dicas para uma Busca Melhor</h2>
              <div className="tips-grid">
                <div className="tip-card">
                  <h3 className="tip-title">🎯 Seja Específico</h3>
                  <p className="tip-description">
                    Use termos específicos como &quot;dosagem rifampicina&quot; ao invés de apenas &quot;medicamento&quot;
                  </p>
                  <div className="tip-example">
                    <strong>Exemplo:</strong> &quot;Como tomar PQT-U pela manhã&quot;
                  </div>
                </div>

                <div className="tip-card">
                  <h3 className="tip-title">👥 Escolha seu Público</h3>
                  <p className="tip-description">
                    Selecione o tipo de público (Paciente, Profissional, Estudante) para resultados mais relevantes
                  </p>
                  <div className="tip-example">
                    <strong>Dica:</strong> Mude o filtro no início da busca
                  </div>
                </div>

                <div className="tip-card">
                  <h3 className="tip-title">🎤 Use sua Voz</h3>
                  <p className="tip-description">
                    Ative a busca por voz clicando no ícone do microfone para fazer perguntas falando
                  </p>
                  <div className="tip-example">
                    <strong>Experimente:</strong> &quot;Posso parar o tratamento se me sentir bem?&quot;
                  </div>
                </div>

                <div className="tip-card">
                  <h3 className="tip-title">⌨️ Navegue pelo Teclado</h3>
                  <p className="tip-description">
                    Use as setas ↑↓ para navegar, Enter para selecionar, Escape para fechar
                  </p>
                  <div className="tip-example">
                    <strong>Acessibilidade:</strong> Compatível com leitores de tela
                  </div>
                </div>
              </div>
            </section>

            {/* Popular Searches */}
            <section className="popular-searches" aria-label="Buscas populares">
              <h2 className="popular-title">🔥 Buscas Mais Populares</h2>
              <div className="popular-tags">
                <button className="popular-tag" onClick={() => router.push('/search?q=como+tomar+PQT-U')}>
                  Como tomar PQT-U
                </button>
                <button className="popular-tag" onClick={() => router.push('/search?q=efeitos+colaterais')}>
                  Efeitos colaterais
                </button>
                <button className="popular-tag" onClick={() => router.push('/search?q=hanseniase+tem+cura')}>
                  Hanseníase tem cura?
                </button>
                <button className="popular-tag" onClick={() => router.push('/search?q=posso+trabalhar')}>
                  Posso trabalhar?
                </button>
                <button className="popular-tag" onClick={() => router.push('/search?q=direitos+paciente')}>
                  Direitos do paciente
                </button>
                <button className="popular-tag" onClick={() => router.push('/search?q=dosagem+rifampicina')}>
                  Dosagem rifampicina
                </button>
                <button className="popular-tag" onClick={() => router.push('/search?q=interacoes+medicamentosas')}>
                  Interações medicamentosas
                </button>
                <button className="popular-tag" onClick={() => router.push('/search?q=diagnostico+hanseniase')}>
                  Diagnóstico clínico
                </button>
              </div>
            </section>
          </main>
        </div>

        <style jsx>{`
          .search-page-container {
            min-height: 100vh;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            padding: 2rem 1rem;
          }

          .search-header {
            text-align: center;
            margin-bottom: 3rem;
            max-width: 800px;
            margin-left: auto;
            margin-right: auto;
          }

          .search-title {
            font-size: clamp(2rem, 5vw, 3rem);
            color: #003366;
            margin-bottom: 1rem;
            font-weight: 800;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          }

          .search-subtitle {
            font-size: clamp(1rem, 2.5vw, 1.2rem);
            color: #4a5568;
            margin: 0;
            line-height: 1.6;
          }

          .search-main {
            max-width: 1200px;
            margin: 0 auto;
            display: flex;
            flex-direction: column;
            gap: 3rem;
          }

          .search-section {
            display: flex;
            justify-content: center;
          }

          .main-search {
            width: 100%;
            max-width: 600px;
          }

          .quick-links {
            background: white;
            border-radius: 16px;
            padding: 2rem;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            border: 1px solid rgba(0, 51, 102, 0.1);
          }

          .quick-links-title {
            font-size: 1.5rem;
            color: #003366;
            margin-bottom: 2rem;
            text-align: center;
            font-weight: 700;
          }

          .quick-links-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 2rem;
          }

          .quick-link-category {
            background: rgba(0, 51, 102, 0.02);
            border-radius: 12px;
            padding: 1.5rem;
            border: 1px solid rgba(0, 51, 102, 0.1);
          }

          .category-title {
            font-size: 1.1rem;
            color: #003366;
            margin-bottom: 1rem;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .category-links {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }

          .quick-link {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem;
            text-decoration: none;
            color: #4a5568;
            border-radius: 8px;
            transition: all 0.2s ease;
            border: 1px solid transparent;
          }

          .quick-link:hover {
            background: rgba(0, 51, 102, 0.05);
            color: #003366;
            border-color: rgba(0, 51, 102, 0.1);
            transform: translateX(4px);
          }

          .quick-link:focus {
            outline: 2px solid #003366;
            outline-offset: 2px;
          }

          .link-icon {
            font-size: 1.2rem;
            flex-shrink: 0;
          }

          .link-text {
            font-weight: 500;
          }

          .search-tips {
            background: white;
            border-radius: 16px;
            padding: 2rem;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            border: 1px solid rgba(0, 170, 68, 0.1);
          }

          .tips-title {
            font-size: 1.5rem;
            color: #00aa44;
            margin-bottom: 2rem;
            text-align: center;
            font-weight: 700;
          }

          .tips-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
          }

          .tip-card {
            background: rgba(0, 170, 68, 0.02);
            border: 1px solid rgba(0, 170, 68, 0.1);
            border-radius: 12px;
            padding: 1.5rem;
            transition: all 0.2s ease;
          }

          .tip-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0, 170, 68, 0.1);
            border-color: rgba(0, 170, 68, 0.2);
          }

          .tip-title {
            font-size: 1.1rem;
            color: #00aa44;
            margin-bottom: 0.75rem;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .tip-description {
            font-size: 0.9rem;
            color: #4a5568;
            line-height: 1.5;
            margin-bottom: 0.75rem;
          }

          .tip-example {
            font-size: 0.8rem;
            color: #00aa44;
            background: rgba(0, 170, 68, 0.1);
            padding: 0.5rem;
            border-radius: 6px;
            border-left: 3px solid #00aa44;
          }

          .popular-searches {
            background: white;
            border-radius: 16px;
            padding: 2rem;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            border: 1px solid rgba(239, 68, 68, 0.1);
          }

          .popular-title {
            font-size: 1.5rem;
            color: #ef4444;
            margin-bottom: 2rem;
            text-align: center;
            font-weight: 700;
          }

          .popular-tags {
            display: flex;
            flex-wrap: wrap;
            gap: 0.75rem;
            justify-content: center;
          }

          .popular-tag {
            background: rgba(239, 68, 68, 0.05);
            border: 1px solid rgba(239, 68, 68, 0.2);
            color: #ef4444;
            padding: 0.5rem 1rem;
            border-radius: 20px;
            font-size: 0.9rem;
            cursor: pointer;
            transition: all 0.2s ease;
            font-weight: 500;
          }

          .popular-tag:hover {
            background: rgba(239, 68, 68, 0.1);
            border-color: rgba(239, 68, 68, 0.3);
            transform: translateY(-1px);
          }

          .popular-tag:focus {
            outline: 2px solid #ef4444;
            outline-offset: 2px;
          }

          .popular-tag:active {
            transform: translateY(0);
          }

          /* High contrast mode */
          @media (prefers-contrast: high) {
            .quick-link,
            .tip-card,
            .popular-tag {
              border-width: 2px !important;
            }

            .quick-link:hover,
            .tip-card:hover,
            .popular-tag:hover {
              border-width: 3px !important;
            }
          }

          /* Reduced motion */
          @media (prefers-reduced-motion: reduce) {
            .quick-link,
            .tip-card,
            .popular-tag {
              transition: none !important;
            }

            .quick-link:hover,
            .tip-card:hover,
            .popular-tag:hover {
              transform: none !important;
            }
          }

          /* Mobile optimizations */
          @media (max-width: 768px) {
            .search-page-container {
              padding: 1rem 0.5rem;
            }

            .quick-links-grid {
              grid-template-columns: 1fr;
              gap: 1rem;
            }

            .tips-grid {
              grid-template-columns: 1fr;
              gap: 1rem;
            }

            .popular-tags {
              gap: 0.5rem;
            }

            .popular-tag {
              font-size: 0.8rem;
              padding: 0.4rem 0.8rem;
            }
          }

          /* Print styles */
          @media print {
            .search-page-container {
              background: white !important;
            }

            .popular-tags,
            .main-search {
              display: none !important;
            }

            .quick-links,
            .search-tips {
              box-shadow: none !important;
              border: 2px solid #000 !important;
            }
          }
        `}</style>
      </EducationalLayout>
    </ChatAccessibilityProvider>
  );
}