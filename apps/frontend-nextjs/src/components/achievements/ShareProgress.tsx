'use client';

import React, { useState, useCallback, useRef } from 'react';
import { 
  Share2, Trophy, X, Download, Link2, 
  Facebook, Twitter, Linkedin, Mail,
  Copy, Check, Image as ImageIcon,
  Calendar, Award, TrendingUp
} from 'lucide-react';
import { useHapticFeedback } from '@/utils/hapticFeedback';
import { SocialService, ShareData } from '@/services/socialService';
import { useSocialProfile } from '@/hooks/useSocialProfile';

interface Achievement {
  id: string;
  name: string;
  description: string;
  badge_url?: string;
  earned_date: string;
  xp_gained: number;
  category: string;
}

interface ProgressData {
  totalPoints: number;
  achievements_count: number;
  completedModules: number;
  streak: number;
  recent_achievements: Achievement[];
  level?: number;
  xp_total?: number;
  completion_percentage?: number;
  streak_days?: number;
  modules_completed?: number;
}

interface ShareProgressProps {
  isOpen: boolean;
  onClose: () => void;
  progressData?: ProgressData;
  userProfile?: {
    name: string;
    avatar_url?: string;
    uid: string;
  };
  className?: string;
}

export default function ShareProgress({
  isOpen,
  onClose,
  progressData,
  userProfile,
  className = ''
}: ShareProgressProps) {
  const { profile } = useSocialProfile();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeTab, setActiveTab] = useState<'achievement' | 'progress'>('progress');
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [savedShareData, setSavedShareData] = useState<ShareData | null>(null);

  const { success, info, error } = useHapticFeedback();

  // Fechar modal
  const handleClose = useCallback(() => {
    info();
    onClose();
  }, [onClose, info]);

  // Trocar aba
  const switchTab = useCallback((tab: 'achievement' | 'progress') => {
    setActiveTab(tab);
    info();
  }, [info]);

  // Gerar imagem de compartilhamento
  const generateShareImage = useCallback(async (): Promise<string> => {
    if (!canvasRef.current) return '';

    setIsGeneratingImage(true);
    
    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context não disponível');

      // Configurar canvas
      canvas.width = 1200;
      canvas.height = 630;

      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#667eea');
      gradient.addColorStop(1, '#764ba2');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Configurar fonte
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      
      if (activeTab === 'achievement' && selectedAchievement) {
        // Layout para conquista
        ctx.font = 'bold 48px system-ui';
        ctx.fillText('🏆 Nova Conquista!', canvas.width / 2, 150);
        
        ctx.font = 'bold 36px system-ui';
        ctx.fillText(selectedAchievement?.name || 'Conquista', canvas.width / 2, 220);
        
        ctx.font = '24px system-ui';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        
        // Quebrar descrição em linhas
        const words = (selectedAchievement?.description || '').split(' ');
        let line = '';
        let y = 280;
        
        for (const word of words) {
          const testLine = line + word + ' ';
          const metrics = ctx.measureText(testLine);
          
          if (metrics.width > 800 && line !== '') {
            ctx.fillText(line.trim(), canvas.width / 2, y);
            line = word + ' ';
            y += 35;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line.trim(), canvas.width / 2, y);
        
        // Badge/emoji
        ctx.font = '120px system-ui';
        ctx.fillStyle = 'white';
        ctx.fillText('🏆', canvas.width / 2, 450);
        
        // Data
        ctx.font = '18px system-ui';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        const date = selectedAchievement ? new Date(selectedAchievement.earned_date).toLocaleDateString('pt-BR') : '';
        ctx.fillText(`Conquistado em ${date}`, canvas.width / 2, 550);
        
      } else if (activeTab === 'progress' && progressData) {
        // Layout para progresso
        ctx.font = 'bold 48px system-ui';
        ctx.fillText('📊 Meu Progresso', canvas.width / 2, 120);
        
        // Stats em grid
        ctx.font = 'bold 32px system-ui';
        ctx.fillStyle = 'white';
        
        // Nível
        ctx.fillText(`Nível ${progressData.level}`, 300, 220);
        ctx.font = '18px system-ui';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillText(`${progressData.xp_total} XP`, 300, 250);
        
        // Conquistas
        ctx.font = 'bold 32px system-ui';
        ctx.fillStyle = 'white';
        ctx.fillText(`${progressData.achievements_count} 🏆`, 900, 220);
        ctx.font = '18px system-ui';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillText('Conquistas', 900, 250);
        
        // Progresso
        ctx.font = 'bold 32px system-ui';
        ctx.fillStyle = 'white';
        ctx.fillText(`${progressData.completion_percentage}%`, 300, 340);
        ctx.font = '18px system-ui';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillText('Completo', 300, 370);
        
        // Sequência
        ctx.font = 'bold 32px system-ui';
        ctx.fillStyle = 'white';
        ctx.fillText(`${progressData.streak_days} dias`, 900, 340);
        ctx.font = '18px system-ui';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillText('Sequência', 900, 370);
        
        // Módulos
        ctx.font = 'bold 28px system-ui';
        ctx.fillStyle = 'white';
        ctx.fillText(`${progressData.modules_completed} módulos concluídos`, canvas.width / 2, 450);
      }
      
      // Footer
      ctx.font = '20px system-ui';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillText('Roteiro de Dispensação PQT-U', canvas.width / 2, 590);
      
      // Converter para blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Falha ao gerar imagem'));
          }
        }, 'image/png', 0.9);
      });
      
      return URL.createObjectURL(blob);
      
    } catch (err) {
      console.error('Erro ao gerar imagem:', err);
      throw err;
    } finally {
      setIsGeneratingImage(false);
    }
  }, [activeTab, selectedAchievement, progressData]);

  // Download da imagem
  const downloadImage = useCallback(async () => {
    try {
      info();
      const imageUrl = await generateShareImage();
      
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `${activeTab === 'achievement' ? 'conquista' : 'progresso'}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(imageUrl);
      success();
      
    } catch (err) {
      console.error('Erro ao baixar imagem:', err);
      error();
    }
  }, [generateShareImage, activeTab, info, success, error]);

  // Copiar link
  const copyLink = useCallback(async () => {
    try {
      const currentUrl = window.location.href;
      await navigator.clipboard.writeText(currentUrl);
      setCopySuccess(true);
      success();
      
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar link:', err);
      error();
    }
  }, [success, error]);

  // Compartilhamento social
  const shareToSocial = useCallback((platform: string) => {
    info();
    
    let shareText = '';
    let shareUrl = window.location.origin;
    
    if (activeTab === 'achievement' && selectedAchievement) {
      shareText = `🏆 Acabei de conquistar: "${selectedAchievement.name}" no Roteiro de Dispensação PQT-U! ${selectedAchievement.description}`;
    } else if (activeTab === 'progress' && progressData) {
      shareText = `📊 Meu progresso no aprendizado de hanseníase: Nível ${progressData.level}, ${progressData.achievements_count} conquistas, ${progressData.completion_percentage}% completo!`;
    }
    
    const encodedText = encodeURIComponent(shareText);
    const encodedUrl = encodeURIComponent(shareUrl);
    
    let platformUrl = '';
    
    switch (platform) {
      case 'twitter':
        platformUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
        break;
      case 'facebook':
        platformUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
        break;
      case 'linkedin':
        platformUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&title=${encodeURIComponent('Roteiro PQT-U')}&summary=${encodedText}`;
        break;
      case 'whatsapp':
        platformUrl = `https://wa.me/?text=${encodedText} ${encodedUrl}`;
        break;
      case 'email':
        platformUrl = `mailto:?subject=${encodeURIComponent('Meu progresso no Roteiro PQT-U')}&body=${encodedText}%0A%0A${encodedUrl}`;
        break;
    }
    
    if (platformUrl) {
      window.open(platformUrl, '_blank', 'noopener,noreferrer');
    }
  }, [activeTab, selectedAchievement, progressData, info]);

  if (!isOpen) return null;

  return (
    <div className={`share-progress-modal ${className}`}>
      <div className="modal-overlay" onClick={handleClose} />
      
      <div className="modal-content">
        {/* Header */}
        <div className="modal-header">
          <div className="header-content">
            <Share2 size={24} />
            <div>
              <h2>Compartilhar Progresso</h2>
              <p>Mostre suas conquistas no aprendizado de hanseníase</p>
            </div>
          </div>
          <button onClick={handleClose} className="close-button">
            <X size={20} />
          </button>
        </div>
        
        {/* Tabs */}
        <div className="modal-tabs">
          {selectedAchievement && (
            <button
              onClick={() => switchTab('achievement')}
              className={`tab-button ${activeTab === 'achievement' ? 'active' : ''}`}
            >
              <Trophy size={18} />
              Conquista
            </button>
          )}
          {progressData && (
            <button
              onClick={() => switchTab('progress')}
              className={`tab-button ${activeTab === 'progress' ? 'active' : ''}`}
            >
              <TrendingUp size={18} />
              Progresso Geral
            </button>
          )}
        </div>
        
        {/* Content */}
        <div className="modal-body">
          {/* Preview */}
          <div className="share-preview">
            {activeTab === 'achievement' && selectedAchievement && (
              <div className="achievement-preview">
                <div className="preview-header">
                  <div className="achievement-badge">
                    {selectedAchievement?.badge_url ? (
                      <img src={selectedAchievement.badge_url} alt={selectedAchievement.name} />
                    ) : (
                      <Trophy size={48} />
                    )}
                  </div>
                  <div className="achievement-info">
                    <h3>{selectedAchievement?.name || 'Selecione uma conquista'}</h3>
                    <p>{selectedAchievement?.description || ''}</p>
                    <div className="achievement-meta">
                      <span>
                        <Calendar size={14} />
                        {selectedAchievement ? new Date(selectedAchievement.earned_date).toLocaleDateString('pt-BR') : ''}
                      </span>
                      <span>
                        <Award size={14} />
                        +{selectedAchievement?.xp_gained || 0} XP
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'progress' && progressData && (
              <div className="progress-preview">
                <div className="progress-stats">
                  <div className="stat-card">
                    <div className="stat-number">{progressData.level}</div>
                    <div className="stat-label">Nível</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">{progressData.achievements_count}</div>
                    <div className="stat-label">Conquistas</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">{progressData.completion_percentage}%</div>
                    <div className="stat-label">Completo</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-number">{progressData.streak_days}</div>
                    <div className="stat-label">Dias Seguidos</div>
                  </div>
                </div>
                
                <div className="progress-summary">
                  <p>
                    <strong>{progressData.modules_completed} módulos concluídos</strong> no 
                    aprendizado sobre hanseníase e protocolo PQT-U
                  </p>
                  
                  {progressData.recent_achievements.length > 0 && (
                    <div className="recent-achievements">
                      <h4>Conquistas Recentes:</h4>
                      <div className="achievement-list">
                        {progressData.recent_achievements.slice(0, 3).map((ach) => (
                          <div key={ach.id} className="mini-achievement">
                            <Trophy size={16} />
                            <span>{ach.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Actions */}
          <div className="share-actions">
            <div className="action-section">
              <h4>Baixar Imagem</h4>
              <button
                onClick={downloadImage}
                disabled={isGeneratingImage}
                className="action-button download-button"
              >
                {isGeneratingImage ? (
                  <>
                    <div className="loading-spinner" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <ImageIcon size={18} />
                    Download PNG
                  </>
                )}
              </button>
            </div>
            
            <div className="action-section">
              <h4>Copiar Link</h4>
              <button
                onClick={copyLink}
                className="action-button copy-button"
              >
                {copySuccess ? (
                  <>
                    <Check size={18} />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy size={18} />
                    Copiar URL
                  </>
                )}
              </button>
            </div>
            
            <div className="action-section">
              <h4>Redes Sociais</h4>
              <div className="social-buttons">
                <button
                  onClick={() => shareToSocial('twitter')}
                  className="social-button twitter"
                  aria-label="Compartilhar no Twitter"
                >
                  <Twitter size={18} />
                </button>
                
                <button
                  onClick={() => shareToSocial('facebook')}
                  className="social-button facebook"
                  aria-label="Compartilhar no Facebook"
                >
                  <Facebook size={18} />
                </button>
                
                <button
                  onClick={() => shareToSocial('linkedin')}
                  className="social-button linkedin"
                  aria-label="Compartilhar no LinkedIn"
                >
                  <Linkedin size={18} />
                </button>
                
                <button
                  onClick={() => shareToSocial('whatsapp')}
                  className="social-button whatsapp"
                  aria-label="Compartilhar no WhatsApp"
                >
                  <span style={{ fontSize: '18px' }}>💬</span>
                </button>
                
                <button
                  onClick={() => shareToSocial('email')}
                  className="social-button email"
                  aria-label="Compartilhar por Email"
                >
                  <Mail size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Canvas oculto para geração de imagem */}
      <canvas
        ref={canvasRef}
        style={{ display: 'none' }}
        aria-hidden="true"
      />
      
      <style jsx>{`
        .share-progress-modal {
          position: fixed;
          inset: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--spacing-lg);
        }
        
        .modal-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
        }
        
        .modal-content {
          position: relative;
          width: 100%;
          max-width: 600px;
          max-height: 90vh;
          background: white;
          border-radius: var(--radius-xl);
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        
        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--spacing-lg);
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        
        .header-content {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }
        
        .header-content h2 {
          margin: 0;
          font-size: var(--font-size-xl);
          font-weight: var(--font-weight-semibold);
        }
        
        .header-content p {
          margin: var(--spacing-xs) 0 0 0;
          opacity: 0.9;
          font-size: var(--font-size-sm);
        }
        
        .close-button {
          background: rgba(255, 255, 255, 0.2);
          border: none;
          border-radius: var(--radius-md);
          color: white;
          padding: var(--spacing-sm);
          cursor: pointer;
          transition: background var(--transition-fast);
        }
        
        .close-button:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        
        .modal-tabs {
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
        
        .modal-body {
          flex: 1;
          overflow-y: auto;
          padding: var(--spacing-lg);
        }
        
        .share-preview {
          margin-bottom: var(--spacing-xl);
        }
        
        .achievement-preview {
          border: 2px solid var(--color-primary-200);
          border-radius: var(--radius-lg);
          padding: var(--spacing-lg);
          background: var(--color-primary-50);
        }
        
        .preview-header {
          display: flex;
          gap: var(--spacing-lg);
          align-items: flex-start;
        }
        
        .achievement-badge {
          width: 80px;
          height: 80px;
          background: var(--color-primary-600);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 32px;
          flex-shrink: 0;
        }
        
        .achievement-badge img {
          width: 60px;
          height: 60px;
          border-radius: 50%;
        }
        
        .achievement-info {
          flex: 1;
        }
        
        .achievement-info h3 {
          margin: 0 0 var(--spacing-sm) 0;
          font-size: var(--font-size-lg);
          font-weight: var(--font-weight-semibold);
          color: var(--color-primary-800);
        }
        
        .achievement-info p {
          margin: 0 0 var(--spacing-md) 0;
          color: var(--color-primary-700);
          line-height: var(--line-height-relaxed);
        }
        
        .achievement-meta {
          display: flex;
          gap: var(--spacing-md);
          font-size: var(--font-size-sm);
          color: var(--color-primary-600);
        }
        
        .achievement-meta span {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
        }
        
        .progress-preview {
          border: 2px solid var(--color-success-200);
          border-radius: var(--radius-lg);
          padding: var(--spacing-lg);
          background: var(--color-success-50);
        }
        
        .progress-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-lg);
        }
        
        .stat-card {
          text-align: center;
          padding: var(--spacing-md);
          background: white;
          border-radius: var(--radius-md);
          border: 1px solid var(--color-success-200);
        }
        
        .stat-number {
          font-size: var(--font-size-2xl);
          font-weight: var(--font-weight-bold);
          color: var(--color-success-700);
        }
        
        .stat-label {
          font-size: var(--font-size-sm);
          color: var(--color-success-600);
          margin-top: var(--spacing-xs);
        }
        
        .progress-summary {
          color: var(--color-success-800);
        }
        
        .progress-summary p {
          margin: 0 0 var(--spacing-md) 0;
          font-size: var(--font-size-base);
          line-height: var(--line-height-relaxed);
        }
        
        .recent-achievements h4 {
          margin: 0 0 var(--spacing-sm) 0;
          font-size: var(--font-size-sm);
          font-weight: var(--font-weight-semibold);
          color: var(--color-success-700);
        }
        
        .achievement-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
        }
        
        .mini-achievement {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          font-size: var(--font-size-sm);
          color: var(--color-success-700);
        }
        
        .share-actions {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: var(--spacing-lg);
        }
        
        .action-section h4 {
          margin: 0 0 var(--spacing-md) 0;
          font-size: var(--font-size-base);
          font-weight: var(--font-weight-semibold);
          color: var(--color-gray-800);
        }
        
        .action-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--spacing-sm);
          width: 100%;
          padding: var(--spacing-md);
          border: 2px solid var(--color-gray-300);
          border-radius: var(--radius-md);
          background: white;
          color: var(--color-gray-700);
          font-weight: var(--font-weight-medium);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        
        .action-button:hover:not(:disabled) {
          border-color: var(--color-primary-500);
          background: var(--color-primary-50);
          color: var(--color-primary-700);
        }
        
        .action-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .download-button:hover:not(:disabled) {
          border-color: var(--color-success-500);
          background: var(--color-success-50);
          color: var(--color-success-700);
        }
        
        .copy-button:hover:not(:disabled) {
          border-color: var(--color-info-500);
          background: var(--color-info-50);
          color: var(--color-info-700);
        }
        
        .social-buttons {
          display: flex;
          gap: var(--spacing-sm);
          flex-wrap: wrap;
        }
        
        .social-button {
          width: 48px;
          height: 48px;
          border: 2px solid var(--color-gray-300);
          border-radius: var(--radius-md);
          background: white;
          color: var(--color-gray-600);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        
        .social-button.twitter:hover {
          border-color: #1da1f2;
          background: #1da1f2;
          color: white;
        }
        
        .social-button.facebook:hover {
          border-color: #4267b2;
          background: #4267b2;
          color: white;
        }
        
        .social-button.linkedin:hover {
          border-color: #0077b5;
          background: #0077b5;
          color: white;
        }
        
        .social-button.whatsapp:hover {
          border-color: #25d366;
          background: #25d366;
          color: white;
        }
        
        .social-button.email:hover {
          border-color: var(--color-gray-600);
          background: var(--color-gray-600);
          color: white;
        }
        
        .loading-spinner {
          width: 18px;
          height: 18px;
          border: 2px solid var(--color-gray-300);
          border-top-color: var(--color-primary-600);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        
        /* Responsive */
        @media (max-width: 640px) {
          .share-progress-modal {
            padding: var(--spacing-md);
          }
          
          .modal-content {
            max-height: 95vh;
          }
          
          .preview-header {
            flex-direction: column;
            text-align: center;
          }
          
          .progress-stats {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .share-actions {
            grid-template-columns: 1fr;
          }
          
          .social-buttons {
            justify-content: center;
          }
        }
        
        /* Dark mode */
        [data-theme="dark"] .modal-content {
          background: var(--color-gray-800);
          color: var(--color-gray-100);
        }
        
        [data-theme="dark"] .modal-tabs {
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
        
        [data-theme="dark"] .achievement-preview {
          background: var(--color-primary-900);
          border-color: var(--color-primary-700);
        }
        
        [data-theme="dark"] .progress-preview {
          background: var(--color-success-900);
          border-color: var(--color-success-700);
        }
        
        [data-theme="dark"] .stat-card {
          background: var(--color-gray-700);
          border-color: var(--color-gray-600);
        }
        
        [data-theme="dark"] .action-button {
          background: var(--color-gray-700);
          border-color: var(--color-gray-600);
          color: var(--color-gray-200);
        }
        
        [data-theme="dark"] .social-button {
          background: var(--color-gray-700);
          border-color: var(--color-gray-600);
          color: var(--color-gray-200);
        }
        
        /* High contrast mode */
        @media (prefers-contrast: high) {
          .achievement-preview,
          .progress-preview {
            border-width: 3px;
          }
          
          .action-button,
          .social-button {
            border-width: 3px;
          }
        }
        
        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .loading-spinner {
            animation: none;
          }
          
          .modal-overlay {
            backdrop-filter: none;
          }
          
          .action-button,
          .social-button,
          .tab-button {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}