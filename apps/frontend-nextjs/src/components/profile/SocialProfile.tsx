'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  User, Settings, Trophy, TrendingUp, Calendar,
  Mail, Shield, Globe, Eye, EyeOff, 
  Award, Target, BookOpen, Clock,
  Share2, Edit, Camera, Check, X
} from 'lucide-react';
import Image from 'next/image';
import AvatarUploader from './AvatarUploader';
import EmailPreferences from './EmailPreferences';
import ShareProgress from '../achievements/ShareProgress';
import { useHapticFeedback } from '@/utils/hapticFeedback';
import { useSocialProfile, type ExtendedSocialProfile } from '@/hooks/useSocialProfile';
import { useSafeAuth as useAuth } from '@/hooks/useSafeAuth';

interface Achievement {
  id: string;
  name: string;
  description: string;
  badge_url?: string;
  earned_date: string;
  xp_gained: number;
  category: string;
}

interface SocialProfileProps {
  className?: string;
}

export default function SocialProfile({
  className = ''
}: SocialProfileProps) {
  const { user } = useAuth();
  const { profile, loading, error: profileError, updateProfile, updateAvatar, updateEmailPreferences, updatePrivacySettings } = useSocialProfile();
  const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'settings'>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [showAvatarUploader, setShowAvatarUploader] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: '',
    bio: '',
    location: '',
    website: '',
    socialLinks: { twitter: '', linkedin: '', github: '' }
  });

  const { success, info, error: hapticError } = useHapticFeedback();

  // Sincronizar form com dados do perfil
  useEffect(() => {
    if (profile) {
      setEditForm({
        displayName: profile.displayName || '',
        bio: profile.bio || '',
        location: profile.location || '',
        website: profile.website || '',
        socialLinks: {
          twitter: profile.socialLinks?.twitter || '',
          linkedin: profile.socialLinks?.linkedin || '',
          github: profile.socialLinks?.github || ''
        }
      });
    }
  }, [profile]);

  // Alterar aba
  const switchTab = useCallback((tab: typeof activeTab) => {
    setActiveTab(tab);
    info();
  }, [info]);

  // Toggle edição
  const toggleEdit = useCallback(() => {
    setIsEditing(prev => !prev);
    info();
  }, [info]);

  // Salvar alterações
  const saveProfile = useCallback(async () => {
    try {
      const updateResult = await updateProfile(editForm);
      if (updateResult) {
        setIsEditing(false);
        success();
      } else {
        hapticError();
      }
    } catch (err) {
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'social_profile_save_error', {
          event_category: 'medical_user_profile',
          event_label: 'profile_save_failed',
          custom_parameters: {
            medical_context: 'social_profile_management',
            error_type: 'profile_save_failure',
            error_message: err instanceof Error ? err.message : String(err)
          }
        });
      }
      hapticError();
    }
  }, [editForm, updateProfile, success, hapticError]);

  // Cancelar edição
  const cancelEdit = useCallback(() => {
    if (profile) {
      setEditForm({
        displayName: profile.displayName || '',
        bio: profile.bio || '',
        location: profile.location || '',
        website: profile.website || '',
        socialLinks: {
          twitter: profile.socialLinks?.twitter || '',
          linkedin: profile.socialLinks?.linkedin || '',
          github: profile.socialLinks?.github || ''
        }
      });
    }
    setIsEditing(false);
    info();
  }, [profile, info]);

  // Upload de avatar
  const handleAvatarUpload = useCallback(async (url: string) => {
    const uploadResult = await updateAvatar(url);
    if (uploadResult) {
      setShowAvatarUploader(false);
      success();
    }
  }, [updateAvatar, success]);

  // Compartilhar progresso
  const handleShareProgress = useCallback(() => {
    setShowShareModal(true);
    info();
  }, [info]);

  if (loading) {
    return (
      <div className={`social-profile loading ${className}`}>
        <div className="loading-content">
          <div className="loading-spinner" />
          <p>Carregando perfil...</p>
        </div>
      </div>
    );
  }

  if (!profile || !user) {
    return (
      <div className={`social-profile error ${className}`}>
        <div className="error-content">
          <User size={48} />
          <h2>Perfil não encontrado</h2>
          <p>{profileError || 'O perfil não pôde ser carregado.'}</p>
        </div>
      </div>
    );
  }

  const getProfileTypeLabel = (email?: string | null) => {
    if (!email) return 'Usuário';
    if (email.includes('admin')) return 'Administrador';
    if (email.includes('dr.') || email.includes('prof.')) return 'Profissional';
    return 'Usuário';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className={`social-profile ${className}`}>
      {/* Header do perfil */}
      <div className="profile-header">
        <div className="profile-banner">
          <div className="avatar-section">
            <div className="avatar-container">
              {profile.photoURL ? (
                <Image 
                  src={profile.photoURL} 
                  alt={profile.displayName || 'Foto do perfil'}
                  className="profile-avatar"
                  width={96}
                  height={96}
                  style={{ objectFit: 'cover' }}
                />
              ) : (
                <div className="avatar-placeholder">
                  <User size={48} />
                </div>
              )}
              
              {user?.uid === profile.uid && (
                <button
                  onClick={() => setShowAvatarUploader(true)}
                  className="avatar-edit-button"
                  aria-label="Alterar avatar"
                >
                  <Camera size={16} />
                </button>
              )}
            </div>
            
            <div className="profile-info">
              {isEditing ? (
                <div className="edit-form">
                  <input
                    type="text"
                    value={editForm.displayName}
                    onChange={(e) => setEditForm(prev => ({ ...prev, displayName: e.target.value }))}
                    placeholder="Nome de exibição"
                    className="edit-input"
                  />
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Biografia (opcional)"
                    className="edit-textarea"
                    rows={3}
                  />
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Localização (opcional)"
                    className="edit-input"
                  />
                  <input
                    type="url"
                    value={editForm.website}
                    onChange={(e) => setEditForm(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="Website (opcional)"
                    className="edit-input"
                  />
                </div>
              ) : (
                <>
                  <h1 className="profile-name">{profile.displayName}</h1>
                  <p className="profile-type">{getProfileTypeLabel(profile.email)}</p>
                  {profile.bio && <p className="profile-bio">{profile.bio}</p>}
                  
                  <div className="profile-meta">
                    {profile.location && (
                      <span className="meta-item">
                        <Globe size={14} />
                        {profile.location}
                      </span>
                    )}
                    {profile.website && (
                      <span className="meta-item">
                        <Award size={14} />
                        <a href={profile.website} target="_blank" rel="noopener noreferrer">{profile.website}</a>
                      </span>
                    )}
                    <span className="meta-item">
                      <Calendar size={14} />
                      Desde {formatDate(profile.createdAt || profile.stats.joinedAt)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
          
          <div className="profile-actions">
            {isEditing ? (
              <div className="edit-actions">
                <button onClick={cancelEdit} className="action-button cancel">
                  <X size={16} />
                  Cancelar
                </button>
                <button onClick={saveProfile} className="action-button save">
                  <Check size={16} />
                  Salvar
                </button>
              </div>
            ) : (
              <>
                <button onClick={toggleEdit} className="action-button edit">
                  <Edit size={16} />
                  Editar
                </button>
                <button onClick={handleShareProgress} className="action-button share">
                  <Share2 size={16} />
                  Compartilhar
                </button>
              </>
            )}
          </div>
        </div>
        
        {/* Stats rápidas */}
        {profile.stats && (
          <div className="profile-stats">
            <div className="stat-item">
              <div className="stat-number">{profile.stats.totalPoints || 0}</div>
              <div className="stat-label">Pontos</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{profile.achievements?.length || 0}</div>
              <div className="stat-label">Conquistas</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{profile.stats.completedModules || 0}</div>
              <div className="stat-label">Módulos</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">{profile.stats.streak || profile.stats.streakDays}</div>
              <div className="stat-label">Sequência</div>
            </div>
          </div>
        )}
      </div>
      
      {/* Tabs de navegação */}
      <div className="profile-tabs">
        <button
          onClick={() => switchTab('overview')}
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
        >
          <TrendingUp size={18} />
          Visão Geral
        </button>
        
        <button
          onClick={() => switchTab('achievements')}
          className={`tab-button ${activeTab === 'achievements' ? 'active' : ''}`}
        >
          <Trophy size={18} />
          Conquistas ({profile.achievements?.length || 0})
        </button>
        
        <button
          onClick={() => switchTab('settings')}
          className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
        >
          <Settings size={18} />
          Configurações
        </button>
      </div>
      
      {/* Conteúdo das tabs */}
      <div className="profile-content">
        {activeTab === 'overview' && (
          <div className="overview-content">
            <div className="stats-grid">
              <div className="stats-card">
                <div className="card-header">
                  <Target size={20} />
                  <h3>Progresso de Aprendizado</h3>
                </div>
                <div className="card-content">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${((profile.stats?.completedModules || 0) / 10 * 100)}%` }}
                    />
                  </div>
                  <p>{((profile.stats?.completedModules || 0) / 10 * 100).toFixed(0)}% dos módulos concluídos</p>
                  
                  <div className="progress-details">
                    <div className="detail-item">
                      <BookOpen size={16} />
                      <span>{profile.stats?.completedModules || 0} módulos concluídos</span>
                    </div>
                    <div className="detail-item">
                      <Clock size={16} />
                      <span>Membro desde {formatDate(profile.createdAt || profile.stats.joinedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="stats-card">
                <div className="card-header">
                  <Award size={20} />
                  <h3>Conquistas & XP</h3>
                </div>
                <div className="card-content">
                  <div className="xp-display">
                    <div className="xp-number">{profile.stats?.totalPoints || 0}</div>
                    <div className="xp-label">Pontos Total</div>
                  </div>
                  
                  <div className="achievement-summary">
                    <div className="summary-item">
                      <Trophy size={16} />
                      <span>{profile.achievements?.length || 0} conquistas</span>
                    </div>
                    <div className="summary-item">
                      <TrendingUp size={16} />
                      <span>Sequência de {profile.stats?.streak || profile.stats?.streakDays || 0} dias</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Conquistas recentes */}
            <div className="recent-achievements">
              <h3>Conquistas Recentes</h3>
              <div className="achievements-list">
                {profile.achievements?.slice(0, 5).map((achievement, index) => (
                  <div key={index} className="achievement-item">
                    <div className="achievement-badge">
                      <Trophy size={24} />
                    </div>
                    <div className="achievement-info">
                      <h4>{achievement}</h4>
                      <p>Conquista desbloqueada</p>
                      <span className="achievement-date">
                        Recente
                      </span>
                    </div>
                  </div>
                )) || []}
                
                {(!profile.achievements || profile.achievements.length === 0) && (
                  <div className="no-achievements">
                    <Trophy size={48} />
                    <p>Nenhuma conquista ainda</p>
                    <span>Continue estudando para desbloquear suas primeiras conquistas!</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'achievements' && (
          <div className="achievements-content">
            <div className="achievements-grid">
              {profile.achievements?.map((achievement, index) => (
                <div key={index} className="achievement-card">
                  <div className="achievement-badge large">
                    <Trophy size={32} />
                  </div>
                  <div className="achievement-details">
                    <h3>{achievement}</h3>
                    <p>Conquista desbloqueada com sucesso</p>
                    <div className="achievement-meta">
                      <span className="xp-gained">+100 Pontos</span>
                      <span className="earned-date">
                        Recente
                      </span>
                    </div>
                  </div>
                </div>
              )) || []}
              
              {(!profile.achievements || profile.achievements.length === 0) && (
                <div className="empty-achievements">
                  <Trophy size={64} />
                  <h3>Sem conquistas ainda</h3>
                  <p>Complete módulos e atividades para ganhar suas primeiras conquistas!</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'settings' && (
          <div className="settings-content">
            <div className="settings-section">
              <div className="section-header">
                <Shield size={20} />
                <h3>Privacidade</h3>
              </div>
              
              <label className="privacy-toggle">
                <input
                  type="checkbox"
                  checked={profile.privacy?.profileVisible ?? true}
                  onChange={async (e: React.ChangeEvent<HTMLInputElement>) => {
                    await updatePrivacySettings({
                      profileVisible: e.target.checked,
                      progressVisible: e.target.checked,
                      achievementsVisible: e.target.checked,
                      emailVisible: e.target.checked
                    });
                  }}
                />
                <span className="toggle-slider"></span>
                <div className="toggle-content">
                  <strong>Perfil Público</strong>
                  <p>Permitir que outros usuários vejam seu perfil e conquistas</p>
                </div>
              </label>
            </div>
            
            <EmailPreferences
              userId={user.uid}
              preferences={profile.emailPreferences || {}}
              onPreferencesChange={updateEmailPreferences}
            />
          </div>
        )}
      </div>
      
      {/* Modais */}
      {showAvatarUploader && (
        <div className="modal-overlay">
          <div className="modal-container">
            <AvatarUploader
              currentAvatarUrl={profile.photoURL}
              userId={profile.uid}
              onUploadComplete={handleAvatarUpload}
              onUploadError={(error) => {
                if (typeof window !== 'undefined' && window.gtag) {
                  window.gtag('event', 'social_profile_avatar_upload_error', {
                    event_category: 'medical_user_profile',
                    event_label: 'avatar_upload_failed',
                    custom_parameters: {
                      medical_context: 'social_profile_avatar',
                      error_type: 'avatar_upload_failure',
                      error_message: error instanceof Error ? error.message : String(error)
                    }
                  });
                }
              }}
            />
            <button
              onClick={() => setShowAvatarUploader(false)}
              className="modal-close"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
      
      <ShareProgress
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        progressData={{
          totalPoints: profile.stats?.totalPoints || 0,
          achievements_count: profile.achievements?.length || 0,
          completedModules: profile.stats?.completedModules || 0,
          streak: profile.stats?.streak || profile.stats?.streakDays || 0,
          recent_achievements: (profile.achievements || []).slice(0, 3).map((achievement: string) => ({
            id: `ach-${Math.random().toString(36).substr(2, 9)}`,
            name: achievement,
            description: 'Conquista desbloqueada',
            badge_url: '',
            earned_date: new Date().toISOString(),
            xp_gained: 100,
            category: 'learning'
          }))
        }}
        userProfile={{
          name: profile.displayName || '',
          avatar_url: profile.photoURL,
          uid: profile.uid
        }}
      />

      <style jsx>{`
        .social-profile {
          width: 100%;
          background: white;
          border-radius: var(--radius-lg);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .profile-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: var(--spacing-xl);
        }

        .profile-banner {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: var(--spacing-lg);
        }

        .avatar-section {
          display: flex;
          gap: var(--spacing-lg);
          align-items: flex-start;
        }

        .avatar-container {
          position: relative;
        }

        .profile-avatar,
        .avatar-placeholder {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          border: 4px solid rgba(255, 255, 255, 0.2);
        }

        .avatar-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.1);
          color: rgba(255, 255, 255, 0.7);
        }

        .avatar-edit-button {
          position: absolute;
          bottom: 8px;
          right: 8px;
          width: 36px;
          height: 36px;
          background: var(--color-primary-600);
          border: 2px solid white;
          border-radius: 50%;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background var(--transition-fast);
        }

        .avatar-edit-button:hover {
          background: var(--color-primary-700);
        }

        .profile-info {
          flex: 1;
        }

        .profile-name {
          margin: 0 0 var(--spacing-xs) 0;
          font-size: var(--font-size-2xl);
          font-weight: var(--font-weight-bold);
        }

        .profile-type {
          margin: 0 0 var(--spacing-md) 0;
          font-size: var(--font-size-lg);
          opacity: 0.9;
          font-weight: var(--font-weight-medium);
        }

        .profile-bio {
          margin: 0 0 var(--spacing-md) 0;
          font-size: var(--font-size-base);
          line-height: var(--line-height-relaxed);
          opacity: 0.95;
        }

        .profile-meta {
          display: flex;
          flex-wrap: wrap;
          gap: var(--spacing-md);
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          font-size: var(--font-size-sm);
          opacity: 0.9;
        }

        .edit-form {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
          max-width: 400px;
        }

        .edit-input,
        .edit-textarea {
          padding: var(--spacing-sm);
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: var(--radius-md);
          background: rgba(255, 255, 255, 0.1);
          color: white;
          font-size: var(--font-size-base);
        }

        .edit-input::placeholder,
        .edit-textarea::placeholder {
          color: rgba(255, 255, 255, 0.7);
        }

        .edit-textarea {
          resize: vertical;
          min-height: 80px;
        }

        .profile-actions {
          display: flex;
          gap: var(--spacing-sm);
          align-items: flex-start;
        }

        .action-button {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          padding: var(--spacing-sm) var(--spacing-md);
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: var(--radius-md);
          background: rgba(255, 255, 255, 0.1);
          color: white;
          font-weight: var(--font-weight-medium);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .action-button:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(255, 255, 255, 0.4);
        }

        .action-button.save {
          background: var(--color-success-600);
          border-color: var(--color-success-500);
        }

        .action-button.cancel {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.3);
        }

        .edit-actions {
          display: flex;
          gap: var(--spacing-sm);
        }

        .status-badge {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          padding: var(--spacing-xs) var(--spacing-sm);
          border-radius: var(--radius-md);
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-medium);
        }

        .status-badge.public {
          background: rgba(34, 197, 94, 0.2);
          color: rgb(34, 197, 94);
          border: 1px solid rgba(34, 197, 94, 0.3);
        }

        .status-badge.private {
          background: rgba(156, 163, 175, 0.2);
          color: rgb(156, 163, 175);
          border: 1px solid rgba(156, 163, 175, 0.3);
        }

        .profile-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--spacing-lg);
          padding: var(--spacing-lg) 0 0;
          border-top: 1px solid rgba(255, 255, 255, 0.2);
        }

        .stat-item {
          text-align: center;
        }

        .stat-number {
          font-size: var(--font-size-2xl);
          font-weight: var(--font-weight-bold);
          margin-bottom: var(--spacing-xs);
        }

        .stat-label {
          font-size: var(--font-size-sm);
          opacity: 0.9;
        }

        .profile-tabs {
          display: flex;
          background: var(--color-gray-100);
          border-bottom: 1px solid var(--color-gray-200);
        }

        .tab-button {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-md);
          border: none;
          background: transparent;
          color: var(--color-gray-600);
          font-weight: var(--font-weight-medium);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .tab-button:hover {
          background: var(--color-gray-200);
          color: var(--color-gray-800);
        }

        .tab-button.active {
          background: white;
          color: var(--color-primary-600);
          border-bottom: 2px solid var(--color-primary-600);
        }

        .profile-content {
          padding: var(--spacing-xl);
        }

        .overview-content {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xl);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: var(--spacing-lg);
        }

        .stats-card {
          background: var(--color-gray-50);
          border-radius: var(--radius-lg);
          padding: var(--spacing-lg);
          border: 1px solid var(--color-gray-200);
        }

        .card-header {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          margin-bottom: var(--spacing-lg);
        }

        .card-header h3 {
          margin: 0;
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-semibold);
          color: var(--color-gray-800);
        }

        .progress-bar {
          height: 12px;
          background: var(--color-gray-200);
          border-radius: var(--radius-full);
          overflow: hidden;
          margin-bottom: var(--spacing-md);
        }

        .progress-fill {
          height: 100%;
          background: var(--color-primary-600);
          transition: width var(--transition-slow);
        }

        .progress-details,
        .achievement-summary {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
          margin-top: var(--spacing-md);
        }

        .detail-item,
        .summary-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          font-size: var(--font-size-sm);
          color: var(--color-gray-600);
        }

        .xp-display {
          text-align: center;
          margin-bottom: var(--spacing-md);
        }

        .xp-number {
          font-size: var(--font-size-3xl);
          font-weight: var(--font-weight-bold);
          color: var(--color-primary-600);
        }

        .xp-label {
          font-size: var(--font-size-sm);
          color: var(--color-gray-600);
          margin-top: var(--spacing-xs);
        }

        .recent-achievements {
          margin-top: var(--spacing-xl);
        }

        .recent-achievements h3 {
          margin: 0 0 var(--spacing-lg) 0;
          font-size: var(--font-size-xl);
          font-weight: var(--font-weight-semibold);
          color: var(--color-gray-800);
        }

        .achievements-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }

        .achievement-item {
          display: flex;
          gap: var(--spacing-md);
          padding: var(--spacing-md);
          background: var(--color-gray-50);
          border-radius: var(--radius-md);
          border: 1px solid var(--color-gray-200);
        }

        .achievement-badge {
          width: 48px;
          height: 48px;
          background: var(--color-primary-600);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }

        .achievement-badge img {
          width: 36px;
          height: 36px;
          border-radius: 50%;
        }

        .achievement-badge.large {
          width: 64px;
          height: 64px;
          font-size: 24px;
        }

        .achievement-badge.large img {
          width: 48px;
          height: 48px;
        }

        .achievement-info {
          flex: 1;
        }

        .achievement-info h4 {
          margin: 0 0 var(--spacing-xs) 0;
          font-size: var(--font-size-base);
          font-weight: var(--font-weight-semibold);
          color: var(--color-gray-800);
        }

        .achievement-info p {
          margin: 0 0 var(--spacing-sm) 0;
          font-size: var(--font-size-sm);
          color: var(--color-gray-600);
          line-height: var(--line-height-relaxed);
        }

        .achievement-date {
          font-size: var(--font-size-xs);
          color: var(--color-gray-500);
        }

        .achievements-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: var(--spacing-lg);
        }

        .achievement-card {
          background: var(--color-gray-50);
          border-radius: var(--radius-lg);
          padding: var(--spacing-lg);
          border: 1px solid var(--color-gray-200);
          text-align: center;
        }

        .achievement-details {
          margin-top: var(--spacing-md);
        }

        .achievement-details h3 {
          margin: 0 0 var(--spacing-sm) 0;
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-semibold);
          color: var(--color-gray-800);
        }

        .achievement-meta {
          display: flex;
          justify-content: space-between;
          margin-top: var(--spacing-md);
          padding-top: var(--spacing-sm);
          border-top: 1px solid var(--color-gray-200);
        }

        .xp-gained {
          font-weight: var(--font-weight-semibold);
          color: var(--color-primary-600);
        }

        .earned-date {
          font-size: var(--font-size-xs);
          color: var(--color-gray-500);
        }

        .no-achievements,
        .empty-achievements {
          text-align: center;
          padding: var(--spacing-xl);
          color: var(--color-gray-500);
        }

        .no-achievements p,
        .empty-achievements h3 {
          margin: var(--spacing-md) 0;
          font-size: var(--font-size-lg);
        }

        .no-achievements span {
          font-size: var(--font-size-sm);
        }

        .settings-content {
          max-width: 800px;
        }

        .settings-section {
          margin-bottom: var(--spacing-xl);
          padding: var(--spacing-lg);
          background: var(--color-gray-50);
          border-radius: var(--radius-lg);
          border: 1px solid var(--color-gray-200);
        }

        .section-header {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          margin-bottom: var(--spacing-lg);
        }

        .section-header h3 {
          margin: 0;
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-semibold);
          color: var(--color-gray-800);
        }

        .privacy-toggle {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          cursor: pointer;
        }

        .toggle-slider {
          width: 48px;
          height: 28px;
          background: var(--color-gray-300);
          border-radius: 28px;
          position: relative;
          transition: background var(--transition-fast);
        }

        .toggle-slider::before {
          content: '';
          position: absolute;
          width: 20px;
          height: 20px;
          background: white;
          border-radius: 50%;
          top: 4px;
          left: 4px;
          transition: transform var(--transition-fast);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .privacy-toggle input:checked + .toggle-slider {
          background: var(--color-primary-600);
        }

        .privacy-toggle input:checked + .toggle-slider::before {
          transform: translateX(20px);
        }

        .privacy-toggle input {
          display: none;
        }

        .toggle-content strong {
          color: var(--color-gray-800);
        }

        .toggle-content p {
          margin: var(--spacing-xs) 0 0 0;
          font-size: var(--font-size-sm);
          color: var(--color-gray-600);
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--spacing-lg);
        }

        .modal-container {
          position: relative;
          max-width: 500px;
          width: 100%;
        }

        .modal-close {
          position: absolute;
          top: -60px;
          right: 0;
          background: rgba(255, 255, 255, 0.9);
          border: none;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background var(--transition-fast);
        }

        .modal-close:hover {
          background: white;
        }

        .loading-content,
        .error-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--spacing-xl);
          text-align: center;
          min-height: 400px;
        }

        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid var(--color-primary-200);
          border-top-color: var(--color-primary-600);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: var(--spacing-lg);
        }

        .error-content h2 {
          margin: var(--spacing-lg) 0 var(--spacing-md) 0;
          font-size: var(--font-size-xl);
          color: var(--color-gray-800);
        }

        .error-content p {
          color: var(--color-gray-600);
          margin: 0;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        /* Responsive */
        @media (max-width: 768px) {
          .profile-banner {
            flex-direction: column;
            gap: var(--spacing-lg);
          }

          .avatar-section {
            flex-direction: column;
            align-items: center;
            text-align: center;
          }

          .profile-stats {
            grid-template-columns: repeat(2, 1fr);
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .achievements-grid {
            grid-template-columns: 1fr;
          }

          .profile-meta {
            justify-content: center;
          }

          .edit-actions {
            flex-direction: column;
            width: 100%;
          }
        }

        /* Dark mode */
        [data-theme="dark"] .social-profile {
          background: var(--color-gray-800);
          color: var(--color-gray-100);
        }

        [data-theme="dark"] .profile-tabs {
          background: var(--color-gray-700);
          border-color: var(--color-gray-600);
        }

        [data-theme="dark"] .tab-button {
          color: var(--color-gray-300);
        }

        [data-theme="dark"] .tab-button.active {
          background: var(--color-gray-800);
          color: var(--color-primary-400);
        }

        [data-theme="dark"] .stats-card,
        [data-theme="dark"] .achievement-item,
        [data-theme="dark"] .achievement-card,
        [data-theme="dark"] .settings-section {
          background: var(--color-gray-700);
          border-color: var(--color-gray-600);
        }

        [data-theme="dark"] .modal-overlay {
          background: rgba(0, 0, 0, 0.7);
        }

        /* High contrast mode */
        @media (prefers-contrast: high) {
          .stats-card,
          .achievement-item,
          .achievement-card {
            border-width: 2px;
          }

          .action-button {
            border-width: 3px;
          }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .loading-spinner {
            animation: none;
          }

          .progress-fill,
          .toggle-slider::before,
          .action-button,
          .tab-button {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}