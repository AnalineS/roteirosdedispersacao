/**
 * Performance Optimizer Utilities
 * Optimizes animations, lazy loading, and performance monitoring
 */

import type { ComponentType } from 'react'

// Performance monitoring
export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: Map<string, number> = new Map()

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  init() {
    this.initCoreWebVitals()
    this.initAnimationMonitoring()
    return this
  }

  private initCoreWebVitals() {
    // Monitor Core Web Vitals
    if ('web-vital' in window) {
      // LCP - Largest Contentful Paint
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          this.metrics.set('LCP', entry.startTime)
          console.log('📊 LCP:', entry.startTime)
        }
      }).observe({ entryTypes: ['largest-contentful-paint'] })

      // FID - First Input Delay (via event timing)
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          const fid = (entry as any).processingStart - entry.startTime
          this.metrics.set('FID', fid)
          console.log('📊 FID:', fid)
        }
      }).observe({ entryTypes: ['first-input'] })

      // CLS - Cumulative Layout Shift
      let clsScore = 0
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsScore += (entry as any).value
          }
        }
        this.metrics.set('CLS', clsScore)
        console.log('📊 CLS:', clsScore)
      }).observe({ entryTypes: ['layout-shift'] })
    }
  }

  private initAnimationMonitoring() {
    // Monitor animation performance
    let animationFrameCount = 0
    let lastTime = performance.now()

    const measureFPS = () => {
      const currentTime = performance.now()
      animationFrameCount++
      
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((animationFrameCount * 1000) / (currentTime - lastTime))
        this.metrics.set('FPS', fps)
        
        if (fps < 50) {
          console.warn('⚠️ Low FPS detected:', fps)
        }
        
        animationFrameCount = 0
        lastTime = currentTime
      }
      
      requestAnimationFrame(measureFPS)
    }
    
    requestAnimationFrame(measureFPS)
  }

  getMetrics() {
    return Object.fromEntries(this.metrics)
  }

  reportPerformance() {
    const metrics = this.getMetrics()
    console.group('📊 Performance Report')
    console.table(metrics)
    console.groupEnd()
    return metrics
  }
}

// Animation optimization utilities
export const AnimationOptimizer = {
  // Check if user prefers reduced motion
  prefersReducedMotion(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  },

  // Check device performance capability
  isLowEndDevice(): boolean {
    // Check various indicators of device performance
    const connection = (navigator as any).connection
    const hardwareConcurrency = navigator.hardwareConcurrency || 1
    const deviceMemory = (navigator as any).deviceMemory || 1

    // Low-end indicators
    if (hardwareConcurrency <= 2) return true
    if (deviceMemory <= 2) return true
    if (connection?.effectiveType === 'slow-2g' || connection?.effectiveType === '2g') return true
    
    return false
  },

  // Get optimized animation config based on device
  getOptimizedConfig() {
    const isLowEnd = this.isLowEndDevice()
    const reducedMotion = this.prefersReducedMotion()

    return {
      enableAnimations: !reducedMotion,
      enableComplexAnimations: !isLowEnd && !reducedMotion,
      enableParallax: !isLowEnd && !reducedMotion,
      animationDuration: isLowEnd ? 0.2 : 0.3,
      staggerDelay: isLowEnd ? 0.05 : 0.1,
      easing: isLowEnd ? 'linear' : 'ease-out'
    }
  },

  // Optimized framer motion variants
  createOptimizedVariants() {
    const config = this.getOptimizedConfig()
    
    return {
      // Fade animations with GPU acceleration
      fade: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: {
          duration: config.animationDuration,
          ease: config.easing
        }
      },

      // Slide animations using transform (GPU accelerated)
      slideUp: {
        initial: { 
          opacity: 0, 
          y: config.enableComplexAnimations ? 20 : 0,
          transform: 'translateZ(0)' // Force GPU layer
        },
        animate: { 
          opacity: 1, 
          y: 0,
          transform: 'translateZ(0)'
        },
        exit: { 
          opacity: 0, 
          y: config.enableComplexAnimations ? -20 : 0 
        },
        transition: {
          duration: config.animationDuration,
          ease: config.easing
        }
      },

      // Scale animations for cards
      scale: {
        initial: { 
          opacity: 0, 
          scale: config.enableComplexAnimations ? 0.95 : 1,
          transform: 'translateZ(0)'
        },
        animate: { 
          opacity: 1, 
          scale: 1,
          transform: 'translateZ(0)'
        },
        exit: { 
          opacity: 0, 
          scale: config.enableComplexAnimations ? 0.95 : 1 
        },
        transition: {
          duration: config.animationDuration,
          ease: config.easing
        }
      },

      // Stagger container
      staggerContainer: {
        animate: {
          transition: {
            staggerChildren: config.staggerDelay
          }
        }
      }
    }
  }
}

// Lazy loading utilities
export const LazyLoadManager = {
  // Create intersection observer for lazy loading
  createObserver(callback: (entries: IntersectionObserverEntry[]) => void, options?: object) {
    return new IntersectionObserver(callback, {
      rootMargin: '50px',
      threshold: 0.1,
      ...options
    })
  },

  // Lazy load images with fade-in effect
  lazyLoadImage(img: HTMLImageElement, src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const tempImg = new Image()
      
      tempImg.onload = () => {
        img.src = src
        img.style.opacity = '0'
        img.style.transition = 'opacity 0.3s ease'
        
        // Fade in after load
        requestAnimationFrame(() => {
          img.style.opacity = '1'
          resolve()
        })
      }
      
      tempImg.onerror = reject
      tempImg.src = src
    })
  },

  // Lazy load component with intersection observer
  createLazyComponent<T>(
    importFn: () => Promise<{ default: ComponentType<T> }>
  ) {
    // Note: React.lazy needs to be used in component context
    // This is a utility for creating lazy components
    return importFn
  }
}

// Bundle optimization utilities
export const BundleOptimizer = {
  // Preload critical resources
  preloadCriticalResources() {
    const criticalResources = [
      '/fonts/Inter-Regular.woff2',
      '/icons/icon-192.png'
    ]

    criticalResources.forEach(resource => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.href = resource
      link.as = resource.includes('.woff') ? 'font' : 'image'
      if (resource.includes('.woff')) {
        link.crossOrigin = 'anonymous'
      }
      document.head.appendChild(link)
    })
  },

  // Dynamic import with retry
  async dynamicImportWithRetry<T>(
    importFn: () => Promise<T>,
    retries = 3
  ): Promise<T> {
    for (let i = 0; i < retries; i++) {
      try {
        return await importFn()
      } catch (error) {
        if (i === retries - 1) throw error
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)))
      }
    }
    throw new Error('Dynamic import failed after retries')
  },

  // Check if module is already loaded
  isModuleLoaded(moduleName: string): boolean {
    return document.querySelector(`script[src*="${moduleName}"]`) !== null
  }
}

// Memory optimization
export const MemoryOptimizer = {
  // Clean up event listeners and observers
  cleanup(element: Element) {
    // Remove all event listeners
    const newElement = element.cloneNode(true)
    element.parentNode?.replaceChild(newElement, element)
  },

  // Monitor memory usage
  monitorMemory() {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      console.log('📊 Memory Usage:', {
        used: Math.round(memory.usedJSHeapSize / 1024 / 1024) + ' MB',
        total: Math.round(memory.totalJSHeapSize / 1024 / 1024) + ' MB',
        limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024) + ' MB'
      })
    }
  },

  // Debounce function for performance
  debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number,
    immediate?: boolean
  ): (...args: Parameters<T>) => void {
    let timeout: number | null = null
    
    return (...args: Parameters<T>) => {
      const callNow = immediate && !timeout
      
      if (timeout) window.clearTimeout(timeout)
      
      timeout = window.setTimeout(() => {
        timeout = null
        if (!immediate) func.apply(null, args)
      }, wait)
      
      if (callNow) func.apply(null, args)
    }
  },

  // Throttle function for performance
  throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func.apply(null, args)
        inThrottle = true
        window.setTimeout(() => inThrottle = false, limit)
      }
    }
  }
}

// Initialize performance monitoring
export const performanceMonitor = PerformanceMonitor.getInstance().init()

// Export default performance config
export default {
  AnimationOptimizer,
  LazyLoadManager,
  BundleOptimizer,
  MemoryOptimizer,
  performanceMonitor
}