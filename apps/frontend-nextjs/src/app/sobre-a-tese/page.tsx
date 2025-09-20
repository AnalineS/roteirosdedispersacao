'use client';

import NavigationHeader from '@/components/navigation/NavigationHeader';
import EducationalFooter from '@/components/navigation/EducationalFooter';
import { useState } from 'react';

// Ícones SVG
const MedIcon = () => (
  <svg className="inline w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
  </svg>
);

const SearchIcon = () => (
  <svg className="inline w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const BookIcon = () => (
  <svg className="inline w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const CheckIcon = () => (
  <svg className="inline w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const WarningIcon = () => (
  <svg className="inline w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
);

const UsersIcon = () => (
  <svg className="inline w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
  </svg>
);

const ClipboardIcon = () => (
  <svg className="inline w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

const PillIcon = () => (
  <svg className="inline w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
  </svg>
);

const DoctorIcon = () => (
  <svg className="inline w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const ClockIcon = () => (
  <svg className="inline w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const TargetIcon = () => (
  <svg className="inline w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="inline w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const HomeIcon = () => (
  <svg className="inline w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const FoodIcon = () => (
  <svg className="inline w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 002-2v-3a2 2 0 00-2-2H4a2 2 0 00-2 2v3a2 2 0 002 2h2z" />
  </svg>
);

const RefreshIcon = () => (
  <svg className="inline w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const LightningIcon = () => (
  <svg className="inline w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
  </svg>
);

const ShieldIcon = () => (
  <svg className="inline w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const BabyIcon = () => (
  <svg className="inline w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const PregnantIcon = () => (
  <svg className="inline w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
  </svg>
);

const ElderIcon = () => (
  <svg className="inline w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const HospitalIcon = () => (
  <svg className="inline w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const MicroscopeIcon = () => (
  <svg className="inline w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2z" />
  </svg>
);

const BookmarkIcon = () => (
  <svg className="inline w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
  </svg>
);

const ChatIcon = () => (
  <svg className="inline w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const HeartIcon = () => (
  <svg className="inline w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
  </svg>
);

const CrossIcon = () => (
  <svg className="inline w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const XIcon = () => (
  <svg className="inline w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const QuestionIcon = () => (
  <svg className="inline w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const StethoscopeIcon = () => (
  <svg className="inline w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const VaccineIcon = () => (
  <svg className="inline w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
  </svg>
);

const NoteIcon = () => (
  <svg className="inline w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const RunningIcon = () => (
  <svg className="inline w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const SOSIcon = () => (
  <svg className="inline w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
  </svg>
);

const PackageIcon = () => (
  <svg className="inline w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const ArchiveIcon = () => (
  <svg className="inline w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
  </svg>
);

const BuildingIcon = () => (
  <svg className="inline w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const PrintIcon = () => (
  <svg className="inline w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
  </svg>
);

const MoneyIcon = () => (
  <svg className="inline w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default function SobreATestePage() {
  const [activeTab, setActiveTab] = useState('apresentacao');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
      {/* Header público */}
      <header role="banner">
        <NavigationHeader />
      </header>
      
      {/* Conteúdo principal */}
      <main id="main-content" style={{ flex: 1 }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
          
          {/* Cabeçalho da Página */}
          <div style={{
            background: 'white',
            padding: '3rem',
            borderRadius: '16px',
            marginBottom: '2rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h1 style={{ 
              fontSize: '2.5rem', 
              fontWeight: 'bold', 
              marginBottom: '1rem',
              color: '#1e293b'
            }}>
              ROTEIRO PARA DISPENSAÇÃO – HANSENÍASE (PQT-U)
            </h1>
            <div style={{ color: '#64748b', fontSize: '1.1rem', lineHeight: '1.8' }}>
              <p style={{ marginBottom: '1rem' }}>
                <strong>Documento técnico-científico</strong> desenvolvido como parte de pesquisa de doutorado
              </p>
              <div style={{ 
                padding: '1rem', 
                background: '#f1f5f9', 
                borderRadius: '8px',
                marginBottom: '1rem' 
              }}>
                <strong>Autores:</strong> Sâmara Caroline Franco Akkati, Sabrina Oliveira Campos de França, 
                Laura Beatriz Gomes Brandão, Barbara Manuela Cardoso Sodré, Rafael Santos Santana
              </div>
              <div style={{
                padding: '1rem',
                background: '#fef3c7',
                borderRadius: '8px',
                border: '1px solid #fcd34d'
              }}>
                <strong><WarningIcon /> Nota:</strong> Este documento é de natureza técnica e destinado a profissionais de saúde. 
                Para informações gerais, consulte os assistentes virtuais.
              </div>
            </div>
          </div>

          {/* Navegação por Tabs */}
          <div style={{
            background: 'white',
            borderRadius: '16px 16px 0 0',
            padding: '0',
            marginBottom: '0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              display: 'flex',
              borderBottom: '2px solid #e2e8f0',
              overflowX: 'auto'
            }}>
              {[
                { id: 'apresentacao', label: 'Apresentações', icon: <ClipboardIcon /> },
                { id: 'etapa1', label: 'Etapa 1: Avaliação', icon: <SearchIcon /> },
                { id: 'etapa2', label: 'Etapa 2: Orientações', icon: <BookIcon /> },
                { id: 'etapa3', label: 'Etapa 3: Pós-Dispensação', icon: <CheckIcon /> },
                { id: 'seguranca', label: 'Segurança', icon: <WarningIcon /> },
                { id: 'especiais', label: 'Populações Especiais', icon: <UsersIcon /> }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '1rem 1.5rem',
                    background: activeTab === tab.id ? '#3b82f6' : 'transparent',
                    color: activeTab === tab.id ? 'white' : '#64748b',
                    border: 'none',
                    borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : 'none',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: activeTab === tab.id ? '600' : '400',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s'
                  }}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Conteúdo das Tabs */}
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '0 0 16px 16px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            minHeight: '500px'
          }}>
            {/* Tab: Apresentações */}
            {activeTab === 'apresentacao' && (
              <div>
                <h2 style={{ fontSize: '2rem', marginBottom: '2rem', color: '#1e293b' }}>
                  <PillIcon /> APRESENTAÇÕES DISPONÍVEIS NO SUS
                </h2>
                
                <div style={{ marginBottom: '3rem' }}>
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#3b82f6' }}>
                    Poliquimioterapia Única Adulto – PQT-U Adulto
                  </h3>
                  
                  <div style={{
                    background: '#f8fafc',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    marginBottom: '1.5rem'
                  }}>
                    <h4 style={{ color: '#475569', marginBottom: '1rem' }}>Dose Mensal Supervisionada:</h4>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#e2e8f0' }}>
                          <th style={{ padding: '0.75rem', textAlign: 'left', borderRadius: '8px 0 0 0' }}>Medicamento</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left' }}>Dose</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left', borderRadius: '0 8px 0 0' }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>Rifampicina</td>
                          <td style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>300 mg + 300 mg</td>
                          <td style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}><strong>600 mg</strong></td>
                        </tr>
                        <tr>
                          <td style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>Clofazimina</td>
                          <td style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>100 mg + 100 mg + 100 mg</td>
                          <td style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}><strong>300 mg</strong></td>
                        </tr>
                        <tr>
                          <td style={{ padding: '0.75rem' }}>Dapsona</td>
                          <td style={{ padding: '0.75rem' }}>100 mg</td>
                          <td style={{ padding: '0.75rem' }}><strong>100 mg</strong></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div style={{
                    background: '#fef3c7',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    border: '1px solid #fcd34d'
                  }}>
                    <h4 style={{ color: '#92400e', marginBottom: '1rem' }}>Dose Diária Autoadministrada:</h4>
                    <ul style={{ paddingLeft: '1.5rem', lineHeight: '1.8' }}>
                      <li>Clofazimina 50 mg - <strong>1x ao dia</strong></li>
                      <li>Dapsona 100 mg - <strong>1x ao dia</strong></li>
                    </ul>
                  </div>
                </div>

                <div>
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#3b82f6' }}>
                    Poliquimioterapia Única Infantil – PQT-U Infantil
                  </h3>
                  
                  <div style={{
                    background: '#f8fafc',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    marginBottom: '1.5rem'
                  }}>
                    <h4 style={{ color: '#475569', marginBottom: '1rem' }}>Dose Mensal Supervisionada:</h4>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#e2e8f0' }}>
                          <th style={{ padding: '0.75rem', textAlign: 'left', borderRadius: '8px 0 0 0' }}>Medicamento</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left' }}>Dose</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left', borderRadius: '0 8px 0 0' }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>Rifampicina</td>
                          <td style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>300 mg + 150 mg</td>
                          <td style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}><strong>450 mg</strong></td>
                        </tr>
                        <tr>
                          <td style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>Clofazimina</td>
                          <td style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>150 mg</td>
                          <td style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}><strong>150 mg</strong></td>
                        </tr>
                        <tr>
                          <td style={{ padding: '0.75rem' }}>Dapsona</td>
                          <td style={{ padding: '0.75rem' }}>50 mg</td>
                          <td style={{ padding: '0.75rem' }}><strong>50 mg</strong></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div style={{
                    background: '#fef3c7',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    border: '1px solid #fcd34d'
                  }}>
                    <h4 style={{ color: '#92400e', marginBottom: '1rem' }}>Dose Diária Autoadministrada:</h4>
                    <ul style={{ paddingLeft: '1.5rem', lineHeight: '1.8' }}>
                      <li>Clofazimina 50 mg - <strong>em dias alternados</strong></li>
                      <li>Dapsona 50 mg - <strong>1x ao dia</strong></li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Etapa 1 - Avaliação Inicial */}
            {activeTab === 'etapa1' && (
              <div>
                <h2 style={{ fontSize: '2rem', marginBottom: '2rem', color: '#1e293b' }}>
                  <SearchIcon /> ETAPA 01 – AVALIAÇÃO INICIAL
                </h2>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                  gap: '1.5rem',
                  marginBottom: '2rem'
                }}>
                  <div style={{
                    padding: '1.5rem',
                    background: '#f8fafc',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#3b82f6' }}>
                      <PillIcon /> Disponibilidade
                    </h3>
                    <ul style={{ paddingLeft: '1.5rem', lineHeight: '1.8', color: '#475569' }}>
                      <li>Não possui similares ou genéricos</li>
                      <li>Medicamento importado via OPAS</li>
                      <li>Disponível exclusivamente pelo SUS</li>
                      <li>Dispensado em UBS e unidades de referência</li>
                    </ul>
                  </div>

                  <div style={{
                    padding: '1.5rem',
                    background: '#fef3c7',
                    borderRadius: '12px',
                    border: '1px solid #fcd34d'
                  }}>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#92400e' }}>
                      <DoctorIcon /> Prescrição
                    </h3>
                    <ul style={{ paddingLeft: '1.5rem', lineHeight: '1.8', color: '#78350f' }}>
                      <li>Médico e enfermeiro podem prescrever</li>
                      <li>Para pacientes &lt; 30 kg: apenas médicos</li>
                      <li>Prescrição em duas vias obrigatória</li>
                      <li>Uma via retida, outra carimbada</li>
                    </ul>
                  </div>

                  <div style={{
                    padding: '1.5rem',
                    background: '#dcfce7',
                    borderRadius: '12px',
                    border: '1px solid #86efac'
                  }}>
                    <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#15803d' }}>
                      <ClockIcon /> Duração do Tratamento
                    </h3>
                    <ul style={{ paddingLeft: '1.5rem', lineHeight: '1.8', color: '#14532d' }}>
                      <li><strong>Paucibacilar:</strong> 6 meses</li>
                      <li><strong>Multibacilar:</strong> 12 meses</li>
                      <li>Dispensação mensal obrigatória</li>
                      <li>Manter estoque extra na farmácia</li>
                    </ul>
                  </div>
                </div>

                <div style={{
                  background: '#fee2e2',
                  padding: '1.5rem',
                  borderRadius: '12px',
                  border: '1px solid #fca5a5'
                }}>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: '#dc2626' }}>
                    <WarningIcon /> Informações Importantes
                  </h3>
                  <ul style={{ paddingLeft: '1.5rem', lineHeight: '1.8', color: '#7f1d1d' }}>
                    <li><XIcon /> Não disponível no Farmácia Popular</li>
                    <li><PackageIcon /> Farmácia solicita tratamento mensalmente ao Núcleo de Logística</li>
                    <li><ClipboardIcon /> Farmacêutico entrega apenas quantidade para 1 mês</li>
                    <li><HospitalIcon /> Tratamento 100% gratuito pelo SUS</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Tab: Etapa 2 - Orientações e Plano de Cuidado */}
            {activeTab === 'etapa2' && (
              <div>
                <h2 style={{ fontSize: '2rem', marginBottom: '2rem', color: '#1e293b' }}>
                  <BookIcon /> ETAPA 02 – ORIENTAÇÕES E PLANO DE CUIDADO
                </h2>

                <div style={{ marginBottom: '3rem' }}>
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: '#3b82f6' }}>
                    <TargetIcon /> INDICAÇÕES
                  </h3>
                  
                  <div style={{
                    background: '#f8fafc',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    marginBottom: '1.5rem'
                  }}>
                    <h4 style={{ marginBottom: '1rem', color: '#475569' }}>Esquema de primeira linha para Hanseníase:</h4>
                    <div style={{ display: 'grid', gap: '1rem' }}>
                      <div style={{ padding: '1rem', background: 'white', borderRadius: '8px' }}>
                        <strong style={{ color: '#dc2626' }}>Rifampicina:</strong> Inibe RNA polimerase, bloqueando síntese de RNA bacteriano (sempre usada em associação)
                      </div>
                      <div style={{ padding: '1rem', background: 'white', borderRadius: '8px' }}>
                        <strong style={{ color: '#059669' }}>Clofazimina:</strong> Inibe crescimento bacteriano ao ligar-se ao DNA
                      </div>
                      <div style={{ padding: '1rem', background: 'white', borderRadius: '8px' }}>
                        <strong style={{ color: '#3b82f6' }}>Dapsona:</strong> Antagonista do ácido para-aminobenzóico, interferindo na síntese do folato
                      </div>
                    </div>
                  </div>

                  <div style={{
                    background: '#fef3c7',
                    padding: '1rem',
                    borderRadius: '8px',
                    border: '1px solid #fcd34d',
                    marginBottom: '1.5rem'
                  }}>
                    <strong><BookmarkIcon /> Diretriz Nacional:</strong> Protocolo Clínico e Diretrizes Terapêuticas Hanseníase (2022), Ministério da Saúde
                  </div>
                </div>

                <div style={{ marginBottom: '3rem' }}>
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: '#3b82f6' }}>
                    💊 MODO DE USO - ADULTOS (&gt; 50 kg)
                  </h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    <div style={{
                      padding: '1.5rem',
                      background: '#dcfce7',
                      borderRadius: '12px',
                      border: '1px solid #86efac'
                    }}>
                      <h4 style={{ marginBottom: '1rem', color: '#15803d' }}><CalendarIcon /> Mensal Supervisionada</h4>
                      <ul style={{ paddingLeft: '1.5rem', lineHeight: '1.8' }}>
                        <li>2x Rifampicina 300 mg (total 600 mg)</li>
                        <li>3x Clofazimina 100 mg (total 300 mg)</li>
                        <li>1x Dapsona 100 mg</li>
                      </ul>
                    </div>

                    <div style={{
                      padding: '1.5rem',
                      background: '#dbeafe',
                      borderRadius: '12px',
                      border: '1px solid #93c5fd'
                    }}>
                      <h4 style={{ marginBottom: '1rem', color: '#1e40af' }}><HomeIcon /> Diária Autoadministrada</h4>
                      <ul style={{ paddingLeft: '1.5rem', lineHeight: '1.8' }}>
                        <li>1x Clofazimina 50 mg</li>
                        <li>1x Dapsona 100 mg</li>
                        <li>Tomar após o jantar/deitar</li>
                      </ul>
                    </div>
                  </div>

                  <div style={{
                    marginTop: '1.5rem',
                    padding: '1rem',
                    background: '#fee2e2',
                    borderRadius: '8px',
                    border: '1px solid #fca5a5'
                  }}>
                    <strong><WarningIcon /> Doses Máximas:</strong> Rifampicina 600 mg/dia | Clofazimina 300 mg/dia | Dapsona 100 mg/dia
                  </div>
                </div>

                <div style={{ marginBottom: '3rem' }}>
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: '#3b82f6' }}>
                    <FoodIcon /> ORIENTAÇÕES GERAIS
                  </h3>
                  
                  <div style={{
                    background: '#f8fafc',
                    padding: '1.5rem',
                    borderRadius: '12px'
                  }}>
                    <ul style={{ paddingLeft: '1.5rem', lineHeight: '2', fontSize: '1.1rem' }}>
                      <li><CheckIcon /> Clofazimina e dapsona devem ser tomadas junto das refeições</li>
                      <li><XIcon /> NÃO ingerir com suco de laranja (diminui absorção)</li>
                      <li><CrossIcon /> Evitar bebidas alcoólicas durante o tratamento</li>
                      <li><ClockIcon /> Em caso de esquecimento: tome ao lembrar (se não estiver próximo da próxima dose)</li>
                      <li><VaccineIcon /> Checar status vacinal/BCG</li>
                      <li><CalendarIcon /> Não tomar dose autoadministrada no dia da supervisionada</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Etapa 3 - Pós-Dispensação */}
            {activeTab === 'etapa3' && (
              <div>
                <h2 style={{ fontSize: '2rem', marginBottom: '2rem', color: '#1e293b' }}>
                  <CheckIcon /> ETAPA 03 – PÓS-DISPENSAÇÃO E AVALIAÇÃO
                </h2>

                <div style={{ marginBottom: '3rem' }}>
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: '#3b82f6' }}>
                    <ClipboardIcon /> ORIENTAÇÕES/INTERVENÇÕES ESSENCIAIS
                  </h3>
                  
                  <div style={{
                    background: '#f8fafc',
                    padding: '1.5rem',
                    borderRadius: '12px'
                  }}>
                    <ul style={{ paddingLeft: '1.5rem', lineHeight: '2', fontSize: '1.05rem' }}>
                      <li><CheckIcon /> Confirmar nome dos medicamentos, indicações e esquema</li>
                      <li><ArchiveIcon /> Ensinar armazenamento (15-30°C, local seco, protegido da luz)</li>
                      <li><WarningIcon /> Alertar sobre interações (anticoncepcional + rifampicina)</li>
                      <li><HospitalIcon /> Estimular comparecimento para avaliação dermato-neurológica regular</li>
                      <li><BabyIcon /> Orientar métodos contraceptivos de barreira para mulheres</li>
                      <li><CalendarIcon /> Agendar consulta a cada 28 dias para nova dose supervisionada</li>
                      <li><NoteIcon /> Checar uso da Caderneta do Paciente com Hanseníase</li>
                      <li><RunningIcon /> Estimular prática regular de atividade física</li>
                      <li><SOSIcon /> Orientar relato imediato de reações adversas</li>
                    </ul>
                  </div>
                </div>

                <div style={{ marginBottom: '3rem' }}>
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: '#dc2626' }}>
                    <WarningIcon /> EVENTOS ADVERSOS MAIS COMUNS (ANVISA)
                  </h3>
                  
                  <div style={{
                    background: '#fee2e2',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    border: '1px solid #fca5a5'
                  }}>
                    <p style={{ marginBottom: '1rem', color: '#7f1d1d' }}>
                      <strong>Relatos no Vigimed (até abril/2023, n = 98):</strong>
                    </p>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#fca5a5' }}>
                          <th style={{ padding: '0.75rem', textAlign: 'left', color: 'white' }}>Evento Adverso</th>
                          <th style={{ padding: '0.75rem', textAlign: 'right', color: 'white' }}>Frequência</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ padding: '0.75rem', borderBottom: '1px solid #fca5a5' }}>Erupção cutânea</td>
                          <td style={{ padding: '0.75rem', borderBottom: '1px solid #fca5a5', textAlign: 'right', fontWeight: 'bold' }}>14,29%</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '0.75rem', borderBottom: '1px solid #fca5a5' }}>Prurido</td>
                          <td style={{ padding: '0.75rem', borderBottom: '1px solid #fca5a5', textAlign: 'right', fontWeight: 'bold' }}>11,22%</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '0.75rem', borderBottom: '1px solid #fca5a5' }}>Náusea</td>
                          <td style={{ padding: '0.75rem', borderBottom: '1px solid #fca5a5', textAlign: 'right', fontWeight: 'bold' }}>7,14%</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '0.75rem', borderBottom: '1px solid #fca5a5' }}>Vômito</td>
                          <td style={{ padding: '0.75rem', borderBottom: '1px solid #fca5a5', textAlign: 'right', fontWeight: 'bold' }}>6,12%</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '0.75rem' }}>Hepatotoxicidade + Hiperpigmentação</td>
                          <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 'bold' }}>5,10%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: '#059669' }}>
                    <RefreshIcon /> EM CADA DISPENSAÇÃO
                  </h3>
                  
                  <div style={{
                    background: '#dcfce7',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    border: '1px solid #86efac'
                  }}>
                    <ul style={{ paddingLeft: '1.5rem', lineHeight: '2', fontSize: '1.05rem' }}>
                      <li><QuestionIcon /> Perguntar sobre a última dose autoadministrada</li>
                      <li><PregnantIcon /> Para gestantes: orientar uso de vitamina K no final da gravidez</li>
                      <li><BabyIcon /> Lactantes: alertar sobre hiperpigmentação transitória no bebê</li>
                      <li><StethoscopeIcon /> Reforçar a presença nas consultas/exames</li>
                      <li><LightningIcon /> Reforçar importância da adesão total ao tratamento</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Segurança */}
            {activeTab === 'seguranca' && (
              <div>
                <h2 style={{ fontSize: '2rem', marginBottom: '2rem', color: '#1e293b' }}>
                  <ShieldIcon /> SEGURANÇA
                </h2>

                <div style={{ marginBottom: '3rem' }}>
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: '#dc2626' }}>
                    <CrossIcon /> CONTRAINDICAÇÕES
                  </h3>
                  
                  <div style={{
                    background: '#fee2e2',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    border: '1px solid #fca5a5'
                  }}>
                    <ul style={{ paddingLeft: '1.5rem', lineHeight: '2', fontSize: '1.05rem', color: '#7f1d1d' }}>
                      <li><XIcon /> Reações alérgicas a rifampicina, sulfa, dapsona ou clofazimina</li>
                      <li><XIcon /> Pacientes &lt; 30kg (avaliação médica obrigatória)</li>
                      <li><WarningIcon /> Suspeita de gravidez (informar o médico)</li>
                      <li><WarningIcon /> Planejamento de gravidez: aguardar término do tratamento</li>
                    </ul>
                  </div>
                </div>

                <div style={{ marginBottom: '3rem' }}>
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: '#ea580c' }}>
                    <PillIcon /> REAÇÕES ADVERSAS POR MEDICAMENTO
                  </h3>
                  
                  <div style={{ display: 'grid', gap: '1.5rem' }}>
                    <div style={{
                      padding: '1.5rem',
                      background: '#fff7ed',
                      borderRadius: '12px',
                      border: '1px solid #fed7aa'
                    }}>
                      <h4 style={{ marginBottom: '1rem', color: '#dc2626' }}>Rifampicina</h4>
                      <ul style={{ paddingLeft: '1.5rem', lineHeight: '1.8' }}>
                        <li>Dor abdominal, náusea, vômito, diarreia</li>
                        <li>Icterícia, disfunção hepática</li>
                        <li>Trombocitopenia</li>
                        <li>Síndrome de Stevens-Johnson</li>
                      </ul>
                    </div>

                    <div style={{
                      padding: '1.5rem',
                      background: '#eff6ff',
                      borderRadius: '12px',
                      border: '1px solid #bfdbfe'
                    }}>
                      <h4 style={{ marginBottom: '1rem', color: '#3b82f6' }}>Dapsona</h4>
                      <ul style={{ paddingLeft: '1.5rem', lineHeight: '1.8' }}>
                        <li>Dermatose bolhosa</li>
                        <li>Eritema multiforme/nodoso</li>
                        <li>Hepatite tóxica, icterícia colestática</li>
                        <li>Anemia hemolítica</li>
                      </ul>
                    </div>

                    <div style={{
                      padding: '1.5rem',
                      background: '#f0fdf4',
                      borderRadius: '12px',
                      border: '1px solid #bbf7d0'
                    }}>
                      <h4 style={{ marginBottom: '1rem', color: '#059669' }}>Clofazimina</h4>
                      <ul style={{ paddingLeft: '1.5rem', lineHeight: '1.8' }}>
                        <li>Descoloração da pele (vermelho a castanho escuro)</li>
                        <li>Ictiose</li>
                        <li>Urina/expectoração/suor rosados</li>
                        <li>Diarreia, cólicas leves</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: '#7c3aed' }}>
                    <LightningIcon /> INTERAÇÕES MEDICAMENTOSAS
                  </h3>
                  
                  <div style={{
                    background: '#faf5ff',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    border: '1px solid #d8b4fe'
                  }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#e9d5ff' }}>
                          <th style={{ padding: '0.75rem', textAlign: 'left' }}>Interação</th>
                          <th style={{ padding: '0.75rem', textAlign: 'left' }}>Efeito</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ padding: '0.75rem', borderBottom: '1px solid #e9d5ff' }}>
                            Suco de laranja/antiácidos + Clofazimina
                          </td>
                          <td style={{ padding: '0.75rem', borderBottom: '1px solid #e9d5ff' }}>
                            ↓ Absorção da clofazimina
                          </td>
                        </tr>
                        <tr>
                          <td style={{ padding: '0.75rem', borderBottom: '1px solid #e9d5ff' }}>
                            Anticoncepcionais orais + Rifampicina
                          </td>
                          <td style={{ padding: '0.75rem', borderBottom: '1px solid #e9d5ff' }}>
                            ↓ Eficácia contraceptiva
                          </td>
                        </tr>
                        <tr>
                          <td style={{ padding: '0.75rem', borderBottom: '1px solid #e9d5ff' }}>
                            Antimaláricos + Dapsona
                          </td>
                          <td style={{ padding: '0.75rem', borderBottom: '1px solid #e9d5ff' }}>
                            ↑ Risco de hemólise
                          </td>
                        </tr>
                        <tr>
                          <td style={{ padding: '0.75rem' }}>
                            Cefazolina + Rifampicina
                          </td>
                          <td style={{ padding: '0.75rem' }}>
                            Distúrbio grave de coagulação
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Populações Especiais */}
            {activeTab === 'especiais' && (
              <div>
                <h2 style={{ fontSize: '2rem', marginBottom: '2rem', color: '#1e293b' }}>
                  <UsersIcon /> POPULAÇÕES ESPECIAIS
                </h2>

                <div style={{ display: 'grid', gap: '2rem' }}>
                  <div style={{
                    padding: '1.5rem',
                    background: '#fef3c7',
                    borderRadius: '12px',
                    border: '1px solid #fcd34d'
                  }}>
                    <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: '#92400e' }}>
                      <BabyIcon /> Crianças
                    </h3>
                    <ul style={{ paddingLeft: '1.5rem', lineHeight: '1.8' }}>
                      <li>Esquema conforme peso corporal</li>
                      <li>&lt;30kg: dividir dose mensal em 2-3 tomadas</li>
                      <li>Avaliação médica obrigatória para &lt;30kg</li>
                      <li>Monitoramento rigoroso de adesão</li>
                    </ul>
                  </div>

                  <div style={{
                    padding: '1.5rem',
                    background: '#fce7f3',
                    borderRadius: '12px',
                    border: '1px solid #fbcfe8'
                  }}>
                    <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: '#be185d' }}>
                      <PregnantIcon /> Gestação/Lactação
                    </h3>
                    <ul style={{ paddingLeft: '1.5rem', lineHeight: '1.8' }}>
                      <li>Tratamento padrão não contraindicado</li>
                      <li><WarningIcon /> Maior risco de prematuridade e baixo peso</li>
                      <li>Pele do RN pode pigmentar (clofazimina) - reversível</li>
                      <li>Vitamina K no final da gestação (rifampicina)</li>
                    </ul>
                  </div>

                  <div style={{
                    padding: '1.5rem',
                    background: '#f3f4f6',
                    borderRadius: '12px',
                    border: '1px solid #d1d5db'
                  }}>
                    <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: '#4b5563' }}>
                      <ElderIcon /> Idosos
                    </h3>
                    <ul style={{ paddingLeft: '1.5rem', lineHeight: '1.8' }}>
                      <li>Cautela por risco de efeitos graves</li>
                      <li>Rifampicina: hepatotoxicidade, agranulocitose</li>
                      <li>Dapsona: anemia hemolítica</li>
                      <li>Clofazimina: obstrução intestinal, QT longo</li>
                    </ul>
                  </div>

                  <div style={{
                    padding: '1.5rem',
                    background: '#fee2e2',
                    borderRadius: '12px',
                    border: '1px solid #fca5a5'
                  }}>
                    <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: '#dc2626' }}>
                      <HospitalIcon /> Nefropatias
                    </h3>
                    <ul style={{ paddingLeft: '1.5rem', lineHeight: '1.8' }}>
                      <li>Clofazimina: sem ajuste leve/moderado; grave: cautela</li>
                      <li>Rifampicina: sem ajuste necessário</li>
                      <li>Dapsona: usar com cautela (possível toxicidade)</li>
                    </ul>
                  </div>

                  <div style={{
                    padding: '1.5rem',
                    background: '#fff7ed',
                    borderRadius: '12px',
                    border: '1px solid #fed7aa'
                  }}>
                    <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: '#ea580c' }}>
                      <MicroscopeIcon /> Hepatopatias
                    </h3>
                    <ul style={{ paddingLeft: '1.5rem', lineHeight: '1.8' }}>
                      <li>Rifampicina: interromper em hepatotoxicidade</li>
                      <li>Clofazimina: evitar, salvo benefício relevante</li>
                      <li>Dapsona: sem ajuste necessário</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Referências */}
          {/* Recursos Médicos Especializados - Ícones Médicos Ativados */}
          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '16px',
            marginTop: '2rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: '#1e293b' }}>
              <MedIcon /> Recursos Médicos Especializados
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1.5rem'
            }}>
              {/* Instituições de Saúde */}
              <div style={{
                padding: '1.5rem',
                background: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #e2e8f0'
              }}>
                <h4 style={{
                  fontSize: '1.2rem',
                  marginBottom: '1rem',
                  color: '#3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <BuildingIcon /> Instituições Parceiras
                </h4>
                <ul style={{ paddingLeft: '1rem', lineHeight: '1.8', color: '#64748b' }}>
                  <li>Universidade de Brasília (UnB)</li>
                  <li>Ministério da Saúde</li>
                  <li>ANVISA - Agência Nacional</li>
                  <li>Conselho Federal de Farmácia</li>
                </ul>
              </div>

              {/* Materiais para Download */}
              <div style={{
                padding: '1.5rem',
                background: '#f0fdf4',
                borderRadius: '12px',
                border: '1px solid #bbf7d0'
              }}>
                <h4 style={{
                  fontSize: '1.2rem',
                  marginBottom: '1rem',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <PrintIcon /> Materiais Técnicos
                </h4>
                <ul style={{ paddingLeft: '1rem', lineHeight: '1.8', color: '#065f46' }}>
                  <li>Protocolo PCDT Hanseníase</li>
                  <li>Roteiro de Dispensação</li>
                  <li>Fichas de Acompanhamento</li>
                  <li>Cartilhas Educacionais</li>
                </ul>
              </div>

              {/* Aspectos Econômicos */}
              <div style={{
                padding: '1.5rem',
                background: '#fefbf3',
                borderRadius: '12px',
                border: '1px solid #fed7aa'
              }}>
                <h4 style={{
                  fontSize: '1.2rem',
                  marginBottom: '1rem',
                  color: '#d97706',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <MoneyIcon /> Aspectos Econômicos
                </h4>
                <ul style={{ paddingLeft: '1rem', lineHeight: '1.8', color: '#92400e' }}>
                  <li>Tratamento 100% gratuito no SUS</li>
                  <li>Medicamentos fornecidos pelo MS</li>
                  <li>Acompanhamento sem custos</li>
                  <li>Custo-efetividade comprovada</li>
                </ul>
              </div>

              {/* Suporte Científico */}
              <div style={{
                padding: '1.5rem',
                background: '#faf5ff',
                borderRadius: '12px',
                border: '1px solid #e9d5ff'
              }}>
                <h4 style={{
                  fontSize: '1.2rem',
                  marginBottom: '1rem',
                  color: '#9333ea',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <MedIcon /> Evidências Científicas
                </h4>
                <ul style={{ paddingLeft: '1rem', lineHeight: '1.8', color: '#7c3aed' }}>
                  <li>Pesquisa de Doutorado</li>
                  <li>Revisão Sistemática</li>
                  <li>Padrões Internacionais OMS</li>
                  <li>Validação Clínica Nacional</li>
                </ul>
              </div>
            </div>

            <div style={{
              marginTop: '1.5rem',
              padding: '1rem',
              background: '#f1f5f9',
              borderRadius: '8px',
              fontSize: '0.9rem',
              color: '#475569',
              textAlign: 'center'
            }}>
              ⚕️ Sistema desenvolvido seguindo as diretrizes do Ministério da Saúde e validado por especialistas
            </div>
          </div>

          <div style={{
            background: 'white',
            padding: '2rem',
            borderRadius: '16px',
            marginTop: '2rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#1e293b' }}>
              <BookIcon /> Referências
            </h3>
            <div style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: '1.8' }}>
              <p>1. Ministério da Saúde. Protocolo Clínico e Diretrizes Terapêuticas Hanseníase. 2022.</p>
              <p>2. WHO. Guidelines for the diagnosis, treatment and prevention of leprosy. 2018.</p>
              <p>3. ANVISA. Vigimed - Sistema de Notificação em Vigilância Sanitária. 2023.</p>
              <p>4. Conselho Federal de Farmácia. Resolução CFF nº 586/2013.</p>
              <p>Documento completo disponível para download em formato PDF mediante solicitação.</p>
            </div>
          </div>

          {/* Call to Action */}
          <div style={{
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            padding: '2rem',
            borderRadius: '16px',
            marginTop: '2rem',
            textAlign: 'center',
            color: 'white'
          }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
              <ChatIcon /> Precisa de Orientação Personalizada?
            </h3>
            <p style={{ marginBottom: '1.5rem', opacity: 0.9 }}>
              Nossos assistentes virtuais estão disponíveis para esclarecer dúvidas específicas
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a
                href="/chat"
                style={{
                  padding: '0.75rem 2rem',
                  background: 'white',
                  color: '#3b82f6',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: '600'
                }}
              >
                <DoctorIcon /> Falar com Dr. Gasnelio
              </a>
              <a
                href="/chat"
                style={{
                  padding: '0.75rem 2rem',
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: '600',
                  border: '2px solid white'
                }}
              >
                <HeartIcon /> Falar com Gá
              </a>
            </div>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer role="contentinfo">
        <EducationalFooter variant="full" showNavigation={true} />
      </footer>
    </div>
  );
}