'use client';

import React, { useState } from 'react';
import { User, Settings, Mail, Trophy } from 'lucide-react';
import { 
  AvatarUploader, 
  EmailPreferences, 
  SocialProfile, 
  ConnectedAccounts 
} from './index';
import ShareProgress from '../achievements/ShareProgress';

interface ProfileTestProps {
  className?: string;
}

// Dados de teste
const mockUserProfile = {
  uid: 'test-user-123',
  email: 'usuario@exemplo.com',
  displayName: 'Dr. João Silva',
  photoURL: undefined,
  profileType: 'professional' as const,
  isPublic: true,
  bio: 'Médico especializado em hanseníase com 15 anos de experiência',
  institution: 'Hospital das Clínicas',
  specialization: 'Dermatologia',
  experience_years: 15,
  joined_date: '2023-01-15T10:00:00Z',
  last_active: '2024-01-15T14:30:00Z'
};

const mockStats = {
  level: 8,
  xp_total: 2450,
  achievements_count: 12,
  completion_percentage: 75,
  streak_days: 14,
  modules_completed: 8,
  total_study_hours: 45,
  badges_earned: 12
};

const mockAchievements = [
  {
    id: 'ach-1',
    name: 'Primeiro Módulo',
    description: 'Completou o primeiro módulo sobre fundamentos da hanseníase',
    earned_date: '2024-01-10T10:00:00Z',
    xp_gained: 100,
    category: 'learning'
  },
  {
    id: 'ach-2', 
    name: 'Calculadora Expert',
    description: 'Usou a calculadora PQT-U 50 vezes com precisão',
    earned_date: '2024-01-12T15:30:00Z',
    xp_gained: 150,
    category: 'tools'
  }
];

export default function ProfileTest({ className = '' }: ProfileTestProps) {
  const [activeComponent, setActiveComponent] = useState<string>('social-profile');
  const [showShareModal, setShowShareModal] = useState(false);

  const components = [
    { id: 'social-profile', name: 'Perfil Social', icon: User },
    { id: 'avatar-uploader', name: 'Avatar Uploader', icon: User },
    { id: 'email-preferences', name: 'Preferências Email', icon: Mail },
    { id: 'connected-accounts', name: 'Contas Conectadas', icon: Settings },
    { id: 'share-progress', name: 'Compartilhar Progresso', icon: Trophy },
  ];

  const renderActiveComponent = () => {
    switch (activeComponent) {
      case 'social-profile':
        return (
          <SocialProfile
            className="max-w-4xl mx-auto"
          />
        );
      
      case 'avatar-uploader':
        return (
          <div style={{ maxWidth: '400px', margin: '0 auto' }}>
            <AvatarUploader
              currentAvatarUrl={mockUserProfile.photoURL}
              userId={mockUserProfile.uid}
              onUploadComplete={(url) => console.log('Avatar uploaded:', url)}
              onUploadError={(error) => console.error('Upload error:', error)}
            />
          </div>
        );
      
      case 'email-preferences':
        return (
          <EmailPreferences
            userId={mockUserProfile.uid}
            onPreferencesChange={async (prefs) => {
              console.log('Preferences changed:', prefs);
              return true;
            }}
          />
        );
      
      case 'connected-accounts':
        return (
          <ConnectedAccounts
            userId={mockUserProfile.uid}
            onAccountUpdate={(accounts) => console.log('Accounts updated:', accounts)}
          />
        );
      
      case 'share-progress':
        return (
          <div>
            <button 
              onClick={() => setShowShareModal(true)}
              className="test-button"
              style={{
                padding: '12px 24px',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                margin: '0 auto'
              }}
            >
              <Trophy size={20} />
              Testar Modal de Compartilhamento
            </button>
            
            <ShareProgress
              isOpen={showShareModal}
              onClose={() => setShowShareModal(false)}
              progressData={{
                totalPoints: 250,
                achievements_count: 3,
                completedModules: 2,
                streak: 5,
                recent_achievements: [
                  {
                    id: 'first-lesson',
                    name: 'Primeira lição concluída',
                    description: 'Completou a primeira lição sobre hanseníase',
                    badge_url: '',
                    earned_date: new Date().toISOString(),
                    xp_gained: 50,
                    category: 'learning'
                  }
                ],
                level: 3,
                xp_total: 750,
                completion_percentage: 65,
                streak_days: 5,
                modules_completed: 2
              }}
              userProfile={{
                name: 'Usuário Teste',
                avatar_url: '',
                uid: 'test-user-123'
              }}
            />
          </div>
        );
      
      default:
        return <div>Componente não encontrado</div>;
    }
  };

  return (
    <div className={`profile-test ${className}`}>
      <div className="test-header">
        <h1>🧪 Teste das Funcionalidades Sociais - PR #175</h1>
        <p>Teste interativo dos componentes implementados para funcionalidades sociais</p>
      </div>
      
      <div className="test-navigation">
        {components.map(({ id, name, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveComponent(id)}
            className={`nav-button ${activeComponent === id ? 'active' : ''}`}
          >
            <Icon size={18} />
            {name}
          </button>
        ))}
      </div>
      
      <div className="test-content">
        <div className="component-header">
          <h2>{components.find(c => c.id === activeComponent)?.name}</h2>
        </div>
        
        <div className="component-container">
          {renderActiveComponent()}
        </div>
      </div>
      
      <div className="test-info">
        <h3>ℹ️ Informações de Teste</h3>
        <ul>
          <li><strong>Dados simulados:</strong> Todos os dados são mockados para teste</li>
          <li><strong>APIs:</strong> Calls para APIs retornarão erros (esperado)</li>
          <li><strong>Upload:</strong> Funciona apenas com autenticação real Firebase</li>
          <li><strong>Email:</strong> Requer configuração backend para funcionar</li>
          <li><strong>Haptic:</strong> Funciona apenas em dispositivos móveis com suporte</li>
        </ul>
      </div>

      <style jsx>{`
        .profile-test {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .test-header {
          text-align: center;
          margin-bottom: 30px;
          padding: 30px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 12px;
        }

        .test-header h1 {
          margin: 0 0 10px 0;
          font-size: 28px;
        }

        .test-header p {
          margin: 0;
          opacity: 0.9;
          font-size: 16px;
        }

        .test-navigation {
          display: flex;
          gap: 12px;
          margin-bottom: 30px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .nav-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          background: white;
          color: #374151;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .nav-button:hover {
          border-color: #667eea;
          background: #f3f4f6;
        }

        .nav-button.active {
          border-color: #667eea;
          background: #667eea;
          color: white;
        }

        .test-content {
          margin-bottom: 40px;
        }

        .component-header {
          text-align: center;
          margin-bottom: 20px;
        }

        .component-header h2 {
          margin: 0;
          color: #374151;
          font-size: 24px;
        }

        .component-container {
          display: flex;
          justify-content: center;
        }

        .test-info {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
          margin-top: 30px;
        }

        .test-info h3 {
          margin: 0 0 15px 0;
          color: #374151;
        }

        .test-info ul {
          margin: 0;
          padding-left: 20px;
        }

        .test-info li {
          margin-bottom: 8px;
          color: #6b7280;
          line-height: 1.5;
        }

        @media (max-width: 768px) {
          .profile-test {
            padding: 15px;
          }

          .test-navigation {
            flex-direction: column;
          }

          .nav-button {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
}