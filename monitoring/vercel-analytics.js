// 📊 Configuração de Analytics Avançado para Vercel
// Sistema de monitoramento customizado integrado ao Vercel Analytics

class VercelMonitoring {
    constructor() {
        this.isVercel = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app');
        this.metricsEndpoint = '/api/metrics';
        this.batchSize = 10;
        this.metricsQueue = [];
        this.sessionId = this.generateSessionId();
        
        if (this.isVercel) {
            this.initializeMonitoring();
        }
    }

    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    initializeMonitoring() {
        console.log('🔍 Vercel Analytics iniciado');
        
        // Web Vitals
        this.trackWebVitals();
        
        // Performance
        this.trackPerformance();
        
        // Error tracking
        this.trackErrors();
        
        // User interactions
        this.trackInteractions();
        
        // API calls
        this.trackApiCalls();
        
        // Batch sender
        this.startBatchSender();
    }

    trackWebVitals() {
        // Core Web Vitals tracking
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (entry.entryType === 'navigation') {
                    this.sendMetric('web_vital', {
                        name: 'navigation',
                        value: entry.duration,
                        loadEventEnd: entry.loadEventEnd,
                        domContentLoaded: entry.domContentLoadedEventEnd,
                        timestamp: Date.now()
                    });
                }
                
                if (entry.entryType === 'largest-contentful-paint') {
                    this.sendMetric('web_vital', {
                        name: 'LCP',
                        value: entry.startTime,
                        timestamp: Date.now()
                    });
                }
                
                if (entry.entryType === 'first-input') {
                    this.sendMetric('web_vital', {
                        name: 'FID',
                        value: entry.processingStart - entry.startTime,
                        timestamp: Date.now()
                    });
                }
            }
        });

        try {
            observer.observe({ entryTypes: ['navigation', 'largest-contentful-paint', 'first-input'] });
        } catch (e) {
            console.warn('Performance Observer não suportado:', e);
        }

        // CLS tracking
        let clsValue = 0;
        const observer2 = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                }
            }
        });

        try {
            observer2.observe({ entryTypes: ['layout-shift'] });
            
            // Send CLS periodically
            setInterval(() => {
                if (clsValue > 0) {
                    this.sendMetric('web_vital', {
                        name: 'CLS',
                        value: clsValue,
                        timestamp: Date.now()
                    });
                    clsValue = 0;
                }
            }, 5000);
        } catch (e) {
            console.warn('Layout Shift Observer não suportado:', e);
        }
    }

    trackPerformance() {
        // Resource timing
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (entry.name.includes('api/')) {
                    this.sendMetric('api_performance', {
                        endpoint: entry.name,
                        duration: entry.duration,
                        size: entry.transferSize || 0,
                        status: 'completed',
                        timestamp: Date.now()
                    });
                }
            }
        });

        try {
            observer.observe({ entryTypes: ['resource'] });
        } catch (e) {
            console.warn('Resource Observer não suportado:', e);
        }

        // Memory usage (se disponível)
        if ('memory' in performance) {
            setInterval(() => {
                this.sendMetric('memory_usage', {
                    used: performance.memory.usedJSHeapSize,
                    total: performance.memory.totalJSHeapSize,
                    limit: performance.memory.jsHeapSizeLimit,
                    timestamp: Date.now()
                });
            }, 30000); // A cada 30 segundos
        }
    }

    trackErrors() {
        // JavaScript errors
        window.addEventListener('error', (event) => {
            this.sendMetric('javascript_error', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error?.stack,
                timestamp: Date.now(),
                userAgent: navigator.userAgent
            });
        });

        // Unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.sendMetric('promise_rejection', {
                reason: event.reason?.toString(),
                stack: event.reason?.stack,
                timestamp: Date.now()
            });
        });
    }

    trackInteractions() {
        // Button clicks
        document.addEventListener('click', (event) => {
            if (event.target.tagName === 'BUTTON' || event.target.closest('button')) {
                const button = event.target.closest('button') || event.target;
                this.sendMetric('user_interaction', {
                    type: 'button_click',
                    element: button.id || button.className || 'unknown',
                    text: button.textContent?.substring(0, 50),
                    timestamp: Date.now()
                });
            }
        });

        // Form submissions
        document.addEventListener('submit', (event) => {
            this.sendMetric('user_interaction', {
                type: 'form_submit',
                form: event.target.id || event.target.className || 'unknown',
                timestamp: Date.now()
            });
        });

        // Page visibility
        document.addEventListener('visibilitychange', () => {
            this.sendMetric('page_visibility', {
                state: document.hidden ? 'hidden' : 'visible',
                timestamp: Date.now()
            });
        });
    }

    trackApiCalls() {
        // Intercept fetch calls
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const startTime = performance.now();
            const url = args[0];
            
            try {
                const response = await originalFetch(...args);
                const endTime = performance.now();
                
                if (url.includes('/api/')) {
                    this.sendMetric('api_call', {
                        url: url,
                        method: args[1]?.method || 'GET',
                        status: response.status,
                        duration: endTime - startTime,
                        success: response.ok,
                        timestamp: Date.now()
                    });
                }
                
                return response;
            } catch (error) {
                const endTime = performance.now();
                
                if (url.includes('/api/')) {
                    this.sendMetric('api_call', {
                        url: url,
                        method: args[1]?.method || 'GET',
                        status: 0,
                        duration: endTime - startTime,
                        success: false,
                        error: error.message,
                        timestamp: Date.now()
                    });
                }
                
                throw error;
            }
        };
    }

    sendMetric(type, data) {
        const metric = {
            type,
            data,
            sessionId: this.sessionId,
            url: window.location.href,
            userAgent: navigator.userAgent,
            timestamp: data.timestamp || Date.now()
        };

        this.metricsQueue.push(metric);

        // Send immediately for critical errors
        if (type === 'javascript_error' || type === 'promise_rejection') {
            this.flushMetrics();
        }
    }

    startBatchSender() {
        // Send metrics every 30 seconds
        setInterval(() => {
            if (this.metricsQueue.length > 0) {
                this.flushMetrics();
            }
        }, 30000);

        // Send on page unload
        window.addEventListener('beforeunload', () => {
            this.flushMetrics();
        });
    }

    async flushMetrics() {
        if (this.metricsQueue.length === 0) return;

        const batch = this.metricsQueue.splice(0, this.batchSize);
        
        try {
            // Use sendBeacon for reliability on page unload
            if (navigator.sendBeacon) {
                navigator.sendBeacon(
                    this.metricsEndpoint,
                    JSON.stringify({ metrics: batch })
                );
            } else {
                // Fallback to fetch
                await fetch(this.metricsEndpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ metrics: batch }),
                    keepalive: true
                });
            }
        } catch (error) {
            console.warn('Erro ao enviar métricas:', error);
            // Re-add failed metrics to queue
            this.metricsQueue.unshift(...batch);
        }
    }

    // Manual tracking methods
    trackCustomEvent(eventName, properties = {}) {
        this.sendMetric('custom_event', {
            event: eventName,
            properties,
            timestamp: Date.now()
        });
    }

    trackPageView(page) {
        this.sendMetric('page_view', {
            page: page || window.location.pathname,
            referrer: document.referrer,
            timestamp: Date.now()
        });
    }

    trackUserAction(action, context = {}) {
        this.sendMetric('user_action', {
            action,
            context,
            timestamp: Date.now()
        });
    }
}

// Initialize monitoring
const monitoring = new VercelMonitoring();

// Export for manual usage
window.monitoring = monitoring;

// Auto-track initial page view
if (typeof window !== 'undefined') {
    monitoring.trackPageView();
}

export default monitoring;