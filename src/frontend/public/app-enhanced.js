// Enhanced Healthcare Application v3.0 - Professional Grade
class HealthcareApp {
  constructor() {
    this.state = {
      sidebarCollapsed: this.getSavedSidebarState(),
      darkMode: this.getPreferredTheme(),
      online: navigator.onLine,
      swRegistration: null,
      lastActivity: Date.now(),
      notifications: [],
      accessibility: {
        reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        highContrast: window.matchMedia('(prefers-contrast: high)').matches,
        focusVisible: true
      }
    };
    
    this.init();
  }
  
  async init() {
    console.log('🏥 Initializing Healthcare Application v3.0...');
    
    try {
      // Initialize core features
      await this.initServiceWorker();
      this.initLayout();
      this.initTheme();
      this.initNetworkStatus();
      this.initAccessibility();
      this.initKeyboardNavigation();
      this.initPerformanceMonitoring();
      this.initErrorHandling();
      this.initPWAFeatures();
      
      // Start activity monitoring
      this.startActivityMonitoring();
      
      // Remove loading screen
      this.hideLoader();
      
      console.log('✅ Healthcare application initialized successfully');
      
      // Run initial diagnostics in development
      if (this.isDevelopment()) {
        setTimeout(() => this.runDiagnostics(), 2000);
      }
      
    } catch (error) {
      console.error('❌ Failed to initialize application:', error);
      this.showCriticalError(error);
    }
  }
  
  // ===== SERVICE WORKER MANAGEMENT =====
  async initServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported');
      return;
    }
    
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });
      
      this.state.swRegistration = registration;
      console.log('✅ Service Worker registered');
      
      // Handle updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            this.showUpdatePrompt();
          }
        });
      });
      
      // Check for updates every hour
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000);
      
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
  
  // ===== LAYOUT MANAGEMENT =====
  initLayout() {
    // Sidebar toggle functionality
    const sidebarToggle = document.querySelector('.sidebar-toggle');
    const sidebar = document.querySelector('.app-sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    
    if (sidebarToggle && sidebar) {
      sidebarToggle.addEventListener('click', () => this.toggleSidebar());
    }
    
    if (overlay) {
      overlay.addEventListener('click', () => this.closeSidebar());
    }
    
    // Apply saved sidebar state
    this.applySidebarState();
    
    // Handle window resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => this.handleResize(), 250);
    });
    
    // Initialize navigation
    this.initNavigation();
  }
  
  toggleSidebar() {
    const container = document.querySelector('.app-container');
    const sidebar = document.querySelector('.app-sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    
    if (window.innerWidth <= 1024) {
      // Mobile/tablet behavior
      sidebar?.classList.toggle('active');
      overlay?.classList.toggle('active');
      document.body.style.overflow = sidebar?.classList.contains('active') ? 'hidden' : '';
    } else {
      // Desktop behavior
      this.state.sidebarCollapsed = !this.state.sidebarCollapsed;
      container?.classList.toggle('sidebar-collapsed', this.state.sidebarCollapsed);
      sidebar?.classList.toggle('collapsed', this.state.sidebarCollapsed);
      this.saveSidebarState();
    }
    
    // Announce change for screen readers
    this.announce(
      this.state.sidebarCollapsed ? 'Sidebar collapsed' : 'Sidebar expanded'
    );
  }
  
  closeSidebar() {
    const sidebar = document.querySelector('.app-sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    
    sidebar?.classList.remove('active');
    overlay?.classList.remove('active');
    document.body.style.overflow = '';
  }
  
  applySidebarState() {
    if (window.innerWidth > 1024) {
      const container = document.querySelector('.app-container');
      const sidebar = document.querySelector('.app-sidebar');
      
      container?.classList.toggle('sidebar-collapsed', this.state.sidebarCollapsed);
      sidebar?.classList.toggle('collapsed', this.state.sidebarCollapsed);
    }
  }
  
  handleResize() {
    if (window.innerWidth > 1024) {
      // Desktop: close mobile sidebar and restore desktop state
      this.closeSidebar();
      this.applySidebarState();
    } else {
      // Mobile/tablet: ensure proper mobile layout
      const container = document.querySelector('.app-container');
      container?.classList.remove('sidebar-collapsed');
    }
  }
  
  initNavigation() {
    // Add active states to navigation links
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href === currentPath || (href === '/' && currentPath === '/')) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      }
      
      // Add click handler
      link.addEventListener('click', (e) => {
        if (window.innerWidth <= 1024) {
          this.closeSidebar();
        }
      });
    });
  }
  
  // ===== THEME MANAGEMENT =====
  initTheme() {
    const stored = localStorage.getItem('theme');
    const theme = stored || this.getPreferredTheme();
    
    this.setTheme(theme);
    this.initThemeToggle();
    
    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('theme')) {
        this.setTheme(e.matches ? 'dark' : 'light');
      }
    });
  }
  
  getPreferredTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  
  setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
    this.state.darkMode = theme === 'dark';
    localStorage.setItem('theme', theme);
    
    // Update theme-color meta tag
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.content = theme === 'dark' ? '#1f2937' : '#1976d2';
    }
  }
  
  initThemeToggle() {
    const toggle = document.querySelector('.theme-toggle');
    if (toggle) {
      toggle.addEventListener('click', () => {
        const newTheme = this.state.darkMode ? 'light' : 'dark';
        this.setTheme(newTheme);
        this.announce(`Switched to ${newTheme} theme`);
      });
    }
  }
  
  // ===== NETWORK STATUS =====
  initNetworkStatus() {
    this.updateNetworkStatus();
    
    window.addEventListener('online', () => {
      this.state.online = true;
      this.updateNetworkStatus();
      this.showNotification('Connection restored', 'success');
    });
    
    window.addEventListener('offline', () => {
      this.state.online = false;
      this.updateNetworkStatus();
      this.showNotification('You are offline. Some features may be limited.', 'warning');
    });
  }
  
  updateNetworkStatus() {
    const indicator = document.querySelector('.network-indicator');
    if (indicator) {
      indicator.classList.toggle('online', this.state.online);
      indicator.classList.toggle('offline', !this.state.online);
      indicator.setAttribute('title', this.state.online ? 'Online' : 'Offline');
    }
  }
  
  // ===== ACCESSIBILITY =====
  initAccessibility() {
    // Create screen reader live region
    this.createLiveRegion();
    
    // Initialize skip links
    this.initSkipLinks();
    
    // Handle focus management
    this.initFocusManagement();
    
    // Listen for accessibility preference changes
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      this.state.accessibility.reducedMotion = e.matches;
      document.documentElement.classList.toggle('reduce-motion', e.matches);
    });
    
    window.matchMedia('(prefers-contrast: high)').addEventListener('change', (e) => {
      this.state.accessibility.highContrast = e.matches;
      document.documentElement.classList.toggle('high-contrast', e.matches);
    });
  }
  
  createLiveRegion() {
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('role', 'status');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    liveRegion.id = 'live-region';
    document.body.appendChild(liveRegion);
  }
  
  announce(message) {
    const liveRegion = document.getElementById('live-region');
    if (liveRegion) {
      liveRegion.textContent = message;
      setTimeout(() => {
        liveRegion.textContent = '';
      }, 1000);
    }
  }
  
  initSkipLinks() {
    const skipLinks = document.querySelectorAll('.skip-to-content');
    skipLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(link.getAttribute('href'));
        if (target) {
          target.focus();
          target.scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  }
  
  initFocusManagement() {
    // Trap focus in modals/sidebars when open
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        const sidebar = document.querySelector('.app-sidebar');
        const isSidebarOpen = sidebar?.classList.contains('active');
        
        if (isSidebarOpen) {
          this.trapFocus(e, sidebar);
        }
      }
      
      // Close sidebar with Escape
      if (e.key === 'Escape') {
        this.closeSidebar();
      }
    });
  }
  
  trapFocus(event, container) {
    const focusableElements = container.querySelectorAll(
      'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  }
  
  // ===== KEYBOARD NAVIGATION =====
  initKeyboardNavigation() {
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Alt + M: Toggle sidebar
      if (e.altKey && e.key === 'm') {
        e.preventDefault();
        this.toggleSidebar();
      }
      
      // Alt + T: Toggle theme
      if (e.altKey && e.key === 't') {
        e.preventDefault();
        const newTheme = this.state.darkMode ? 'light' : 'dark';
        this.setTheme(newTheme);
      }
      
      // Alt + H: Go to home
      if (e.altKey && e.key === 'h') {
        e.preventDefault();
        window.location.href = '/';
      }
    });
    
    // Add visual focus indicators
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        document.body.classList.add('using-keyboard');
      }
    });
    
    document.addEventListener('mousedown', () => {
      document.body.classList.remove('using-keyboard');
    });
  }
  
  // ===== PERFORMANCE MONITORING =====
  initPerformanceMonitoring() {
    // Monitor Core Web Vitals
    if ('web-vital' in window) {
      this.measureWebVitals();
    }
    
    // Monitor memory usage
    if ('memory' in performance) {
      setInterval(() => this.checkMemoryUsage(), 30000);
    }
    
    // Monitor long tasks
    if ('PerformanceObserver' in window) {
      this.observePerformance();
    }
  }
  
  measureWebVitals() {
    // Measure First Contentful Paint
    const paintEntries = performance.getEntriesByType('paint');
    const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
    
    if (fcp && fcp.startTime > 2500) {
      console.warn(`Slow FCP: ${fcp.startTime.toFixed(0)}ms`);
    }
    
    // Measure Cumulative Layout Shift
    let cumulativeLayoutShift = 0;
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          cumulativeLayoutShift += entry.value;
        }
      }
      
      if (cumulativeLayoutShift > 0.1) {
        console.warn(`High CLS: ${cumulativeLayoutShift.toFixed(3)}`);
      }
    });
    
    observer.observe({ entryTypes: ['layout-shift'] });
  }
  
  checkMemoryUsage() {
    const memory = performance.memory;
    const usedPercentage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
    
    if (usedPercentage > 90) {
      console.warn(`High memory usage: ${usedPercentage.toFixed(1)}%`);
    }
  }
  
  observePerformance() {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 50) {
          console.warn(`Long task detected: ${entry.duration.toFixed(0)}ms`);
        }
      }
    });
    
    observer.observe({ entryTypes: ['longtask'] });
  }
  
  // ===== ERROR HANDLING =====
  initErrorHandling() {
    // Global error handler
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
      this.logError(event.error, 'Global Error');
    });
    
    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      this.logError(event.reason, 'Unhandled Promise Rejection');
    });
    
    // Resource loading errors
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        console.error('Resource loading error:', event.target.src || event.target.href);
      }
    }, true);
  }
  
  logError(error, context) {
    const errorInfo = {
      message: error.message || error,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    // In production, send to error tracking service
    if (this.isProduction()) {
      this.sendErrorToService(errorInfo);
    }
  }
  
  showCriticalError(error) {
    const errorContainer = document.createElement('div');
    errorContainer.className = 'critical-error';
    errorContainer.innerHTML = `
      <div class="error-content">
        <h2>Application Error</h2>
        <p>Sorry, something went wrong. Please refresh the page or contact support if the problem persists.</p>
        <details>
          <summary>Technical Details</summary>
          <pre>${error.message}\n${error.stack}</pre>
        </details>
        <button onclick="window.location.reload()">Refresh Page</button>
      </div>
    `;
    
    document.body.appendChild(errorContainer);
  }
  
  // ===== PWA FEATURES =====
  initPWAFeatures() {
    let deferredPrompt;
    
    // Handle install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      deferredPrompt = e;
      this.showInstallPrompt(deferredPrompt);
    });
    
    // Handle successful installation
    window.addEventListener('appinstalled', () => {
      console.log('PWA installed');
      this.hideInstallPrompt();
      this.showNotification('App installed successfully!', 'success');
    });
    
    // Check if running as PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('Running as PWA');
      document.body.classList.add('pwa-mode');
    }
  }
  
  showInstallPrompt(deferredPrompt) {
    // Create install button if it doesn't exist
    let installButton = document.querySelector('.install-app-btn');
    if (!installButton) {
      installButton = document.createElement('button');
      installButton.className = 'install-app-btn btn btn-secondary';
      installButton.textContent = 'Install App';
      
      const headerActions = document.querySelector('.header-actions');
      if (headerActions) {
        headerActions.appendChild(installButton);
      }
    }
    
    installButton.style.display = 'block';
    installButton.addEventListener('click', async () => {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted installation');
      } else {
        console.log('User dismissed installation');
      }
      
      deferredPrompt = null;
    });
  }
  
  hideInstallPrompt() {
    const installButton = document.querySelector('.install-app-btn');
    if (installButton) {
      installButton.style.display = 'none';
    }
  }
  
  // ===== ACTIVITY MONITORING =====
  startActivityMonitoring() {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    events.forEach(event => {
      document.addEventListener(event, () => {
        this.state.lastActivity = Date.now();
      }, { passive: true });
    });
    
    // Check for inactivity every minute
    setInterval(() => {
      const inactiveTime = Date.now() - this.state.lastActivity;
      const inactiveMinutes = inactiveTime / (1000 * 60);
      
      if (inactiveMinutes > 30) { // 30 minutes of inactivity
        console.log('User inactive for 30 minutes');
        // Could implement auto-save, session warning, etc.
      }
    }, 60000);
  }
  
  // ===== NOTIFICATIONS =====
  showNotification(message, type = 'info', duration = 5000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-icon">${this.getNotificationIcon(type)}</span>
        <span class="notification-message">${message}</span>
      </div>
      <button class="notification-close" aria-label="Close notification">×</button>
    `;
    
    // Add to container
    let container = document.querySelector('.notifications-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'notifications-container';
      document.body.appendChild(container);
    }
    
    container.appendChild(notification);
    
    // Auto remove
    const timeout = setTimeout(() => {
      this.removeNotification(notification);
    }, duration);
    
    // Manual close
    notification.querySelector('.notification-close').addEventListener('click', () => {
      clearTimeout(timeout);
      this.removeNotification(notification);
    });
    
    // Announce to screen readers
    this.announce(message);
    
    return notification;
  }
  
  removeNotification(notification) {
    notification.style.animation = 'slideOut 0.3s ease-in-out';
    setTimeout(() => {
      notification.remove();
    }, 300);
  }
  
  getNotificationIcon(type) {
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ'
    };
    return icons[type] || icons.info;
  }
  
  // ===== UPDATE MANAGEMENT =====
  showUpdatePrompt() {
    const updateBanner = document.createElement('div');
    updateBanner.className = 'update-banner';
    updateBanner.innerHTML = `
      <div class="update-content">
        <span>A new version is available!</span>
        <div class="update-actions">
          <button class="btn-ghost" onclick="app.dismissUpdate()">Later</button>
          <button class="btn-primary" onclick="app.applyUpdate()">Update Now</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(updateBanner);
  }
  
  dismissUpdate() {
    const banner = document.querySelector('.update-banner');
    if (banner) {
      banner.remove();
    }
  }
  
  async applyUpdate() {
    if (this.state.swRegistration?.waiting) {
      this.state.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }
  
  // ===== UTILITY METHODS =====
  hideLoader() {
    const loader = document.querySelector('.loading-screen, .app-loader');
    if (loader) {
      loader.style.animation = 'fadeOut 0.5s ease-in-out';
      setTimeout(() => loader.remove(), 500);
    }
  }
  
  getSavedSidebarState() {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved ? JSON.parse(saved) : false;
  }
  
  saveSidebarState() {
    localStorage.setItem('sidebar-collapsed', JSON.stringify(this.state.sidebarCollapsed));
  }
  
  isDevelopment() {
    return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  }
  
  isProduction() {
    return !this.isDevelopment();
  }
  
  async runDiagnostics() {
    if (window.DebugTool) {
      console.log('Running development diagnostics...');
      await window.DebugTool.runFullDiagnostics();
    }
  }
  
  sendErrorToService(errorInfo) {
    // Implement error tracking service integration
    // e.g., Sentry, LogRocket, etc.
    console.log('Would send error to service:', errorInfo);
  }
  
  // ===== PUBLIC API =====
  static formatDate(date) {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  }
  
  static formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }
  
  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
  
  static throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
}

// Initialize application when DOM is ready
function initHealthcareApp() {
  if (window.app) {
    console.warn('Healthcare app already initialized');
    return;
  }
  
  window.app = new HealthcareApp();
  
  // Export utilities globally
  window.HealthcareUtils = {
    formatDate: HealthcareApp.formatDate,
    formatCurrency: HealthcareApp.formatCurrency,
    debounce: HealthcareApp.debounce,
    throttle: HealthcareApp.throttle
  };
}

// Auto-initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHealthcareApp);
} else {
  initHealthcareApp();
}

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && window.app) {
    // Page became visible, check for updates
    if (window.app.state.swRegistration) {
      window.app.state.swRegistration.update();
    }
  }
});

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HealthcareApp;
}