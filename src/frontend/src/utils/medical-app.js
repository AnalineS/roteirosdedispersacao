// ===== SISTEMA MÉDICO - INTERATIVIDADE =====

class MedicalApp {
  constructor() {
    this.sidebar = null;
    this.sidebarOverlay = null;
    this.menuToggle = null;
    this.init();
  }

  init() {
    this.bindElements();
    this.attachEventListeners();
    this.initializeAnimations();
    this.checkSystemStatus();
  }

  bindElements() {
    this.sidebar = document.querySelector('.medical-sidebar');
    this.sidebarOverlay = document.querySelector('.sidebar-overlay');
    this.menuToggle = document.querySelector('.menu-toggle');
  }

  attachEventListeners() {
    // Menu toggle
    if (this.menuToggle) {
      this.menuToggle.addEventListener('click', () => this.toggleSidebar());
    }

    // Overlay click
    if (this.sidebarOverlay) {
      this.sidebarOverlay.addEventListener('click', () => this.closeSidebar());
    }

    // ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeSidebar();
      }
    });

    // Resize handler
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (window.innerWidth > 1024) {
          this.closeSidebar();
        }
      }, 250);
    });

    // Smooth scroll para links de navegação
    document.querySelectorAll('a[href^="#"]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(link.getAttribute('href'));
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  }

  toggleSidebar() {
    if (!this.sidebar) return;
    
    const isOpen = this.sidebar.classList.contains('active');
    
    if (isOpen) {
      this.closeSidebar();
    } else {
      this.openSidebar();
    }
  }

  openSidebar() {
    if (!this.sidebar || !this.sidebarOverlay) return;
    
    this.sidebar.classList.add('active');
    this.sidebarOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    // Analytics
    this.trackEvent('sidebar_opened');
  }

  closeSidebar() {
    if (!this.sidebar || !this.sidebarOverlay) return;
    
    this.sidebar.classList.remove('active');
    this.sidebarOverlay.classList.remove('active');
    document.body.style.overflow = '';
    
    // Analytics
    this.trackEvent('sidebar_closed');
  }

  initializeAnimations() {
    // Intersection Observer para animações
    if ('IntersectionObserver' in window) {
      const animationObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('fade-in-up');
            animationObserver.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      });

      // Observar cards médicos
      document.querySelectorAll('.medical-card').forEach(card => {
        animationObserver.observe(card);
      });
    }

    // Parallax suave no hero
    const hero = document.querySelector('.medical-hero');
    if (hero) {
      window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const rate = scrolled * -0.5;
        hero.style.transform = `translateY(${rate}px)`;
      });
    }
  }

  checkSystemStatus() {
    // Verificar status do sistema médico
    const statusChecks = {
      pwa: this.checkPWAStatus(),
      serviceWorker: this.checkServiceWorkerStatus(),
      personas: this.checkPersonasStatus(),
      api: this.checkAPIStatus()
    };

    console.log('Status do Sistema Médico:', statusChecks);
    
    // Mostrar notificações se necessário
    this.showStatusNotifications(statusChecks);
  }

  checkPWAStatus() {
    return {
      installable: window.matchMedia('(display-mode: standalone)').matches,
      manifest: !!document.querySelector('link[rel="manifest"]'),
      serviceWorker: 'serviceWorker' in navigator
    };
  }

  checkServiceWorkerStatus() {
    return new Promise((resolve) => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready
          .then(registration => {
            resolve({
              registered: true,
              scope: registration.scope,
              updateAvailable: !!registration.waiting
            });
          })
          .catch(() => {
            resolve({ registered: false });
          });
      } else {
        resolve({ registered: false, reason: 'not_supported' });
      }
    });
  }

  checkPersonasStatus() {
    // Verificar se as personas estão carregadas
    const personaElements = document.querySelectorAll('[data-persona]');
    return {
      count: personaElements.length,
      loaded: personaElements.length > 0
    };
  }

  checkAPIStatus() {
    // Verificar conectividade com API
    return {
      online: navigator.onLine,
      apiUrl: process.env.VITE_API_URL || 'not_configured'
    };
  }

  showStatusNotifications(status) {
    // Notificar sobre problemas críticos
    if (!status.pwa.serviceWorker) {
      this.showNotification('Service Worker não suportado', 'warning');
    }
    
    if (!status.api.online) {
      this.showNotification('Você está offline', 'info');
    }
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `medical-notification medical-notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-icon">${this.getNotificationIcon(type)}</span>
        <span class="notification-message">${message}</span>
        <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;
    
    // Estilos inline
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: var(--medical-white);
      border: 1px solid var(--medical-gray-200);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-elevated);
      padding: var(--space-lg);
      z-index: 9999;
      max-width: 400px;
      animation: slideInRight var(--transition-base) ease-out;
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove após 5 segundos
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 5000);
  }

  getNotificationIcon(type) {
    const icons = {
      info: 'ℹ️',
      warning: '⚠️',
      error: '❌',
      success: '✅'
    };
    return icons[type] || icons.info;
  }

  trackEvent(eventName, data = {}) {
    // Analytics tracking (Google Analytics, Mixpanel, etc.)
    if (typeof gtag !== 'undefined') {
      gtag('event', eventName, {
        custom_parameter: data
      });
    }
    
    console.log('Evento rastreado:', eventName, data);
  }

  // Método para performance monitoring
  measurePerformance() {
    if ('performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0];
      const paintEntries = performance.getEntriesByType('paint');
      
      const metrics = {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: paintEntries.find(entry => entry.name === 'first-paint')?.startTime,
        firstContentfulPaint: paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime
      };
      
      console.log('Performance Médica:', metrics);
      return metrics;
    }
  }

  // Método para debug
  debugSystemHealth() {
    return {
      version: '2.0.0',
      theme: 'medical-professional',
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        mobile: window.innerWidth <= 768
      },
      features: {
        pwa: this.checkPWAStatus(),
        animations: 'IntersectionObserver' in window,
        touch: 'ontouchstart' in window,
        serviceWorker: 'serviceWorker' in navigator
      },
      performance: this.measurePerformance()
    };
  }
}

// Inicializar quando DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.medicalApp = new MedicalApp();
  });
} else {
  window.medicalApp = new MedicalApp();
}

// Expor para debug
window.debugMedicalSystem = () => {
  if (window.medicalApp) {
    console.table(window.medicalApp.debugSystemHealth());
  }
};

// Service Worker registration melhorado
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });
      
      console.log('✅ Service Worker registrado:', registration.scope);
      
      // Verificar atualizações
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            if (window.medicalApp) {
              window.medicalApp.showNotification('Nova versão disponível! Recarregue para atualizar.', 'info');
            }
          }
        });
      });
    } catch (error) {
      console.error('❌ Erro ao registrar Service Worker:', error);
    }
  });
}

export default MedicalApp;