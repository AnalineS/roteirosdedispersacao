'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Search, MessageCircle, BookOpen, Award } from 'lucide-react';

export default function HeroSection() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Redirecionar para a página de chat com a query de busca
      router.push(`/chat?query=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSearchInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(e);
    }
  };

  return (
    <section className="hero-section">
      <div className="hero-background">
        <div className="hero-gradient" />
        <div className="hero-pattern" />
      </div>
      
      <div className="container hero-container">
        <div className="hero-content">
          {/* Badge de Credibilidade */}
          <div className="hero-badge">
            <Award className="badge-icon" />
            <span>Plataforma Educacional</span>
          </div>

          {/* Título Principal */}
          <h1 className="hero-title">
            Orientação Segura para
            <span className="hero-title-highlight"> Dispensação de Medicamentos</span>
          </h1>

          {/* Subtítulo */}
          <p className="hero-subtitle">
            Ferramenta educacional baseada nas diretrizes do Ministério da Saúde
            para apoio ao aprendizado sobre dispensação de medicamentos para hanseníase.
          </p>

          {/* CTAs Principais */}
          <div className="hero-actions">
            <Link href="/chat" className="hero-btn hero-btn-primary">
              <MessageCircle className="btn-icon" />
              Iniciar Consulta
              <span className="btn-badge">Grátis</span>
            </Link>
            <Link href="/modules" className="hero-btn hero-btn-secondary">
              <BookOpen className="btn-icon" />
              Material Educativo
            </Link>
          </div>

          {/* Barra de Busca Rápida */}
          <form className="hero-search" onSubmit={handleSearch}>
            <Search className="search-icon" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleSearchInputKeyPress}
              placeholder="Busque doses, efeitos adversos, contraindicações..."
              className="search-input"
              aria-label="Buscar informações"
            />
            <button 
              type="submit" 
              className="search-btn" 
              aria-label="Realizar busca"
              disabled={!searchQuery.trim()}
            >
              Buscar
            </button>
          </form>

          {/* Estatísticas de Confiança */}
          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-number">100%</span>
              <span className="stat-label">Baseado em PCDT</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-number">Gratuito</span>
              <span className="stat-label">Acesso Livre</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-number">Open Source</span>
              <span className="stat-label">Código Aberto</span>
            </div>
          </div>
        </div>

        {/* Ilustração Lateral */}
        <div className="hero-visual">
          <div className="visual-card">
            <div className="visual-header">
              <div className="assistant-avatar dr-gasnelio" />
              <div className="assistant-info">
                <span className="assistant-name">Dr. Gasnelio</span>
                <span className="assistant-role">Farmacêutico Especialista</span>
              </div>
            </div>
            <div className="visual-message">
              &quot;Posso ajudar com dosagens e protocolos técnicos&quot;
            </div>
          </div>
          <div className="visual-card visual-card-secondary">
            <div className="visual-header">
              <div className="assistant-avatar ga" />
              <div className="assistant-info">
                <span className="assistant-name">Gá</span>
                <span className="assistant-role">Assistente Educadora</span>
              </div>
            </div>
            <div className="visual-message">
              &quot;Explico de forma simples e acolhedora&quot;
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .hero-section {
          position: relative;
          min-height: 90vh;
          display: flex;
          align-items: center;
          overflow: hidden;
          padding: var(--spacing-2xl) 0;
        }

        .hero-background {
          position: absolute;
          inset: 0;
          z-index: -1;
        }

        .hero-gradient {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, 
            var(--color-primary-50) 0%,
            var(--color-secondary-50) 100%);
        }

        .hero-pattern {
          position: absolute;
          inset: 0;
          opacity: 0.05;
          background-image: 
            repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(0,0,0,.05) 35px, rgba(0,0,0,.05) 70px);
        }

        .hero-container {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--spacing-2xl);
          align-items: center;
        }

        @media (min-width: 1024px) {
          .hero-container {
            grid-template-columns: 1.2fr 1fr;
          }
        }

        .hero-content {
          max-width: 600px;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: var(--spacing-xs);
          padding: var(--spacing-xs) var(--spacing-md);
          background: white;
          border-radius: var(--radius-full);
          box-shadow: var(--shadow-sm);
          margin-bottom: var(--spacing-lg);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
          color: var(--color-primary-700);
        }

        .badge-icon {
          width: 16px;
          height: 16px;
          color: var(--color-primary-500);
        }

        .hero-title {
          font-family: var(--font-family-secondary);
          font-size: clamp(2rem, 5vw, 3.5rem);
          font-weight: var(--font-weight-bold);
          line-height: 1.2;
          color: var(--color-gray-900);
          color: #0f172a; /* Fallback: preto/cinza escuro */
          margin-bottom: var(--spacing-lg);
        }

        .hero-title-highlight {
          color: var(--color-primary-600);
          color: #43a047; /* Fallback: verde primário */
          display: block;
        }

        .hero-subtitle {
          font-size: var(--font-size-lg);
          line-height: var(--line-height-relaxed);
          color: var(--color-gray-600);
          color: #374151; /* Fallback: cinza escuro */
          margin-bottom: var(--spacing-xl);
        }

        .hero-actions {
          display: flex;
          flex-wrap: wrap;
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-xl);
        }

        .hero-btn {
          display: inline-flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-md) var(--spacing-xl);
          border-radius: var(--radius-lg);
          font-size: var(--font-size-base);
          font-weight: var(--font-weight-semibold);
          text-decoration: none;
          transition: all var(--transition-base);
          position: relative;
        }

        .hero-btn-primary {
          background: linear-gradient(135deg, var(--color-primary-500), var(--color-primary-600));
          color: white;
          box-shadow: 0 4px 14px rgba(76, 175, 80, 0.4);
        }

        .hero-btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(76, 175, 80, 0.5);
        }

        .hero-btn-secondary {
          background: white;
          color: var(--color-primary-600);
          border: 2px solid var(--color-primary-200);
        }

        .hero-btn-secondary:hover {
          background: var(--color-primary-50);
          border-color: var(--color-primary-300);
        }

        .btn-icon {
          width: 20px;
          height: 20px;
        }

        .btn-badge {
          position: absolute;
          top: -8px;
          right: -8px;
          background: var(--color-warning);
          color: white;
          padding: 2px 8px;
          border-radius: var(--radius-full);
          font-size: var(--font-size-xs);
          font-weight: var(--font-weight-bold);
        }

        .hero-search {
          display: flex;
          align-items: center;
          background: white;
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-lg);
          padding: var(--spacing-xs);
          margin-bottom: var(--spacing-xl);
        }

        .search-icon {
          width: 24px;
          height: 24px;
          color: var(--color-gray-500);
          margin: 0 var(--spacing-md);
        }

        .search-input {
          flex: 1;
          border: none;
          outline: none;
          font-size: var(--font-size-base);
          color: var(--color-gray-800);
          background: transparent;
        }

        .search-btn {
          padding: var(--spacing-sm) var(--spacing-lg);
          background: var(--color-primary-500);
          color: white;
          border: none;
          border-radius: var(--radius-lg);
          font-weight: var(--font-weight-medium);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .search-btn:hover {
          background: var(--color-primary-600);
        }

        .hero-stats {
          display: flex;
          align-items: center;
          gap: var(--spacing-lg);
        }

        .stat-item {
          display: flex;
          flex-direction: column;
        }

        .stat-number {
          font-size: var(--font-size-2xl);
          font-weight: var(--font-weight-bold);
          color: var(--color-primary-600);
          color: #43a047; /* Fallback: verde primário */
        }

        .stat-label {
          font-size: var(--font-size-sm);
          color: var(--color-gray-600);
          color: #374151; /* Fallback: cinza escuro */
        }

        .stat-divider {
          width: 1px;
          height: 40px;
          background: var(--color-gray-300);
        }

        .hero-visual {
          display: none;
        }

        @media (min-width: 1024px) {
          .hero-visual {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-lg);
          }
        }

        .visual-card {
          background: white;
          border-radius: var(--radius-xl);
          padding: var(--spacing-lg);
          box-shadow: var(--shadow-lg);
          transform: translateX(0);
          animation: slideIn 0.6s ease-out;
        }

        .visual-card-secondary {
          margin-left: var(--spacing-xl);
          animation-delay: 0.2s;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        .visual-header {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-md);
        }

        .assistant-avatar {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-full);
          background: linear-gradient(135deg, var(--color-primary-400), var(--color-primary-600));
        }

        .assistant-avatar.ga {
          background: linear-gradient(135deg, var(--color-secondary-400), var(--color-secondary-600));
        }

        .assistant-info {
          display: flex;
          flex-direction: column;
        }

        .assistant-name {
          font-weight: var(--font-weight-semibold);
          color: var(--color-gray-900);
        }

        .assistant-role {
          font-size: var(--font-size-sm);
          color: var(--color-gray-600);
        }

        .visual-message {
          padding: var(--spacing-md);
          background: var(--color-gray-50);
          border-radius: var(--radius-md);
          font-size: var(--font-size-sm);
          color: var(--color-gray-700);
          position: relative;
        }

        .visual-message::before {
          content: '';
          position: absolute;
          top: -8px;
          left: 20px;
          width: 16px;
          height: 16px;
          background: var(--color-gray-50);
          transform: rotate(45deg);
        }

        /* Mobile Responsivo */
        @media (max-width: 768px) {
          .hero-section {
            min-height: auto;
            padding: var(--spacing-xl) 0;
          }

          .hero-title {
            font-size: clamp(1.5rem, 6vw, 2.5rem);
          }

          .hero-subtitle {
            font-size: var(--font-size-base);
          }

          .hero-actions {
            flex-direction: column;
            width: 100%;
          }

          .hero-btn {
            width: 100%;
            justify-content: center;
          }

          .hero-stats {
            flex-wrap: wrap;
            justify-content: space-between;
          }

          .stat-divider {
            display: none;
          }
        }

        /* Dark Mode */
        [data-theme="dark"] .hero-gradient {
          background: linear-gradient(135deg, 
            var(--color-gray-100) 0%,
            var(--color-gray-200) 100%);
        }

        [data-theme="dark"] .hero-title,
        [data-theme="dark"] .assistant-name {
          color: var(--color-gray-900);
        }

        [data-theme="dark"] .hero-subtitle,
        [data-theme="dark"] .assistant-role {
          color: var(--color-gray-600);
        }

        [data-theme="dark"] .hero-badge,
        [data-theme="dark"] .visual-card,
        [data-theme="dark"] .hero-search {
          background: var(--color-gray-200);
        }

        [data-theme="dark"] .visual-message {
          background: var(--color-gray-300);
          color: var(--color-gray-800);
        }
      `}</style>
    </section>
  );
}