/**
 * PWA Validation Utility
 * Validates PWA manifest and service worker installation
 * Provides comprehensive audit for Progressive Web App compliance
 */

interface PWAManifestValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  score: number;
  manifest?: any;
}

interface ServiceWorkerValidation {
  isRegistered: boolean;
  isActive: boolean;
  scope?: string;
  errors: string[];
  warnings: string[];
  cachingStrategy?: string;
}

interface PWAValidationReport {
  manifest: PWAManifestValidation;
  serviceWorker: ServiceWorkerValidation;
  installability: {
    isInstallable: boolean;
    criteria: {
      hasManifest: boolean;
      hasServiceWorker: boolean;
      hasValidIcons: boolean;
      hasStartUrl: boolean;
      isServedOverHttps: boolean;
    };
  };
  performance: {
    cacheStatus: {
      totalCaches: number;
      totalEntries: number;
      estimatedSize: string;
    };
    networkFirst: boolean;
    offlineCapable: boolean;
  };
  overallScore: number;
  recommendations: string[];
}

export class PWAValidator {
  
  /**
   * Validates PWA manifest
   */
  public static async validateManifest(): Promise<PWAManifestValidation> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let manifest: any = null;
    let score = 100;

    try {
      // Check if manifest link exists
      const manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
      if (!manifestLink) {
        errors.push('Manifest link not found in document head');
        return { isValid: false, errors, warnings, score: 0 };
      }

      // Fetch and parse manifest
      const response = await fetch(manifestLink.href);
      if (!response.ok) {
        errors.push(`Failed to fetch manifest: ${response.status} ${response.statusText}`);
        score -= 30;
      } else {
        manifest = await response.json();
      }

      // Validate required fields
      const requiredFields = [
        { field: 'name', message: 'App name is required' },
        { field: 'short_name', message: 'Short name is required' },
        { field: 'start_url', message: 'Start URL is required' },
        { field: 'display', message: 'Display mode is required' },
        { field: 'icons', message: 'Icons array is required' }
      ];

      for (const { field, message } of requiredFields) {
        if (!manifest || !manifest[field]) {
          errors.push(message);
          score -= 15;
        }
      }

      if (manifest) {
        // Validate icons
        if (manifest.icons && Array.isArray(manifest.icons)) {
          const hasRequiredSizes = manifest.icons.some((icon: any) => 
            icon.sizes && (icon.sizes.includes('192x192') || icon.sizes.includes('512x512'))
          );
          
          if (!hasRequiredSizes) {
            warnings.push('Consider adding 192x192 and 512x512 icons for better compatibility');
            score -= 5;
          }

          // Check for maskable icons
          const hasMaskableIcon = manifest.icons.some((icon: any) => 
            icon.purpose && icon.purpose.includes('maskable')
          );
          
          if (!hasMaskableIcon) {
            warnings.push('Consider adding maskable icons for better Android integration');
            score -= 3;
          }
        }

        // Validate display mode
        const validDisplayModes = ['fullscreen', 'standalone', 'minimal-ui', 'browser'];
        if (manifest.display && !validDisplayModes.includes(manifest.display)) {
          warnings.push(`Invalid display mode: ${manifest.display}`);
          score -= 5;
        }

        // Validate orientation
        if (manifest.orientation) {
          const validOrientations = [
            'any', 'natural', 'landscape', 'portrait', 
            'portrait-primary', 'portrait-secondary',
            'landscape-primary', 'landscape-secondary'
          ];
          if (!validOrientations.includes(manifest.orientation)) {
            warnings.push(`Invalid orientation: ${manifest.orientation}`);
            score -= 3;
          }
        }

        // Validate theme colors
        if (manifest.theme_color && !this.isValidColor(manifest.theme_color)) {
          warnings.push('Invalid theme_color format');
          score -= 2;
        }

        if (manifest.background_color && !this.isValidColor(manifest.background_color)) {
          warnings.push('Invalid background_color format');
          score -= 2;
        }

        // Check for optional but recommended fields
        const recommendedFields = [
          'description', 'theme_color', 'background_color', 
          'categories', 'lang', 'screenshots'
        ];
        
        const missingRecommended = recommendedFields.filter(field => !manifest[field]);
        if (missingRecommended.length > 0) {
          warnings.push(`Consider adding: ${missingRecommended.join(', ')}`);
          score -= missingRecommended.length * 2;
        }

        // Validate shortcuts if present
        if (manifest.shortcuts && Array.isArray(manifest.shortcuts)) {
          for (const shortcut of manifest.shortcuts) {
            if (!shortcut.name || !shortcut.url) {
              warnings.push('Shortcuts should have name and url properties');
              score -= 3;
            }
          }
        }
      }

    } catch (error) {
      errors.push(`Error validating manifest: ${error.message}`);
      score = 0;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: Math.max(0, score),
      manifest
    };
  }

  /**
   * Validates Service Worker installation and functionality
   */
  public static async validateServiceWorker(): Promise<ServiceWorkerValidation> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if Service Worker is supported
    if (!('serviceWorker' in navigator)) {
      errors.push('Service Worker not supported in this browser');
      return {
        isRegistered: false,
        isActive: false,
        errors,
        warnings
      };
    }

    try {
      // Get current registration
      const registration = await navigator.serviceWorker.getRegistration();
      
      if (!registration) {
        errors.push('Service Worker not registered');
        return {
          isRegistered: false,
          isActive: false,
          errors,
          warnings
        };
      }

      const isActive = !!registration.active;
      const scope = registration.scope;

      // Check Service Worker state
      if (!isActive) {
        warnings.push('Service Worker registered but not active');
      }

      // Check if Service Worker is controlling the page
      if (!navigator.serviceWorker.controller) {
        warnings.push('Service Worker not controlling this page');
      }

      // Analyze caching strategy by inspecting cache names
      let cachingStrategy = 'unknown';
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        if (cacheNames.length > 0) {
          // Determine strategy based on cache names
          if (cacheNames.some(name => name.includes('runtime') || name.includes('dynamic'))) {
            cachingStrategy = 'runtime-caching';
          } else if (cacheNames.some(name => name.includes('static') || name.includes('precache'))) {
            cachingStrategy = 'precache';
          } else {
            cachingStrategy = 'custom';
          }
        } else {
          warnings.push('No caches found - Service Worker may not be caching resources');
        }
      }

      return {
        isRegistered: true,
        isActive,
        scope,
        errors,
        warnings,
        cachingStrategy
      };

    } catch (error) {
      errors.push(`Error validating Service Worker: ${error.message}`);
      return {
        isRegistered: false,
        isActive: false,
        errors,
        warnings
      };
    }
  }

  /**
   * Checks PWA installability criteria
   */
  private static async checkInstallability() {
    const criteria = {
      hasManifest: false,
      hasServiceWorker: false,
      hasValidIcons: false,
      hasStartUrl: false,
      isServedOverHttps: false
    };

    // Check manifest
    const manifestLink = document.querySelector('link[rel="manifest"]');
    criteria.hasManifest = !!manifestLink;

    if (criteria.hasManifest) {
      try {
        const response = await fetch((manifestLink as HTMLLinkElement).href);
        const manifest = await response.json();
        
        criteria.hasStartUrl = !!manifest.start_url;
        criteria.hasValidIcons = manifest.icons && 
          manifest.icons.some((icon: any) => 
            icon.sizes && icon.sizes.includes('192x192')
          );
      } catch (error) {
        console.warn('Error checking manifest for installability:', error);
      }
    }

    // Check Service Worker
    criteria.hasServiceWorker = 'serviceWorker' in navigator &&
      !!(await navigator.serviceWorker.getRegistration());

    // Check HTTPS (required for PWA)
    criteria.isServedOverHttps = window.location.protocol === 'https:' ||
      window.location.hostname === 'localhost';

    const isInstallable = Object.values(criteria).every(Boolean);

    return { isInstallable, criteria };
  }

  /**
   * Analyzes PWA performance characteristics
   */
  private static async analyzePerformance() {
    const cacheStatus = {
      totalCaches: 0,
      totalEntries: 0,
      estimatedSize: '0 KB'
    };

    let networkFirst = false;
    let offlineCapable = false;

    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        cacheStatus.totalCaches = cacheNames.length;

        let totalEntries = 0;
        for (const cacheName of cacheNames) {
          const cache = await caches.open(cacheName);
          const keys = await cache.keys();
          totalEntries += keys.length;
        }
        
        cacheStatus.totalEntries = totalEntries;
        cacheStatus.estimatedSize = this.formatBytes(totalEntries * 50 * 1024); // Rough estimate
        
        // Check if offline capable
        offlineCapable = totalEntries > 0;
        
        // Simple heuristic for network strategy
        networkFirst = cacheNames.some(name => 
          name.includes('runtime') || name.includes('api')
        );

      } catch (error) {
        console.warn('Error analyzing cache performance:', error);
      }
    }

    return {
      cacheStatus,
      networkFirst,
      offlineCapable
    };
  }

  /**
   * Generates comprehensive PWA validation report
   */
  public static async validatePWA(): Promise<PWAValidationReport> {
    const [manifest, serviceWorker, installability, performance] = await Promise.all([
      this.validateManifest(),
      this.validateServiceWorker(),
      this.checkInstallability(),
      this.analyzePerformance()
    ]);

    // Calculate overall score
    const manifestScore = manifest.score || 0;
    const swScore = serviceWorker.isRegistered && serviceWorker.isActive ? 80 : 
                    serviceWorker.isRegistered ? 40 : 0;
    const installabilityScore = installability.isInstallable ? 20 : 0;

    const overallScore = Math.round((manifestScore + swScore + installabilityScore) / 2);

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      manifest, serviceWorker, installability, performance
    );

    return {
      manifest,
      serviceWorker,
      installability,
      performance,
      overallScore,
      recommendations
    };
  }

  /**
   * Generates specific recommendations based on validation results
   */
  private static generateRecommendations(
    manifest: PWAManifestValidation,
    serviceWorker: ServiceWorkerValidation,
    installability: any,
    performance: any
  ): string[] {
    const recommendations: string[] = [];

    // Manifest recommendations
    if (!manifest.isValid) {
      recommendations.push('Fix manifest.json errors to enable PWA installation');
    }
    if (manifest.warnings.length > 0) {
      recommendations.push('Address manifest.json warnings for better user experience');
    }

    // Service Worker recommendations
    if (!serviceWorker.isRegistered) {
      recommendations.push('Register a Service Worker to enable offline functionality');
    } else if (!serviceWorker.isActive) {
      recommendations.push('Ensure Service Worker is properly activated');
    }

    // Installability recommendations
    if (!installability.isInstallable) {
      if (!installability.criteria.hasManifest) {
        recommendations.push('Add a web app manifest to enable installation');
      }
      if (!installability.criteria.hasServiceWorker) {
        recommendations.push('Add a Service Worker for PWA compliance');
      }
      if (!installability.criteria.hasValidIcons) {
        recommendations.push('Add 192x192 and 512x512 icons for proper installation');
      }
      if (!installability.criteria.isServedOverHttps) {
        recommendations.push('Serve over HTTPS for PWA functionality');
      }
    }

    // Performance recommendations
    if (performance.cacheStatus.totalEntries === 0) {
      recommendations.push('Implement caching strategy for better performance');
    }
    if (!performance.offlineCapable) {
      recommendations.push('Cache critical resources for offline functionality');
    }

    // General recommendations
    if (recommendations.length === 0) {
      recommendations.push('PWA is well configured! Consider periodic audits to maintain compliance');
    }

    return recommendations;
  }

  /**
   * Utility method to validate color format
   */
  private static isValidColor(color: string): boolean {
    // Check hex color
    if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color)) {
      return true;
    }
    
    // Check named colors (basic validation)
    const namedColors = [
      'black', 'white', 'red', 'green', 'blue', 'yellow', 
      'cyan', 'magenta', 'gray', 'grey'
    ];
    
    return namedColors.includes(color.toLowerCase());
  }

  /**
   * Utility method to format bytes
   */
  private static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Test PWA offline functionality
   */
  public static async testOfflineCapability(): Promise<{
    hasOfflinePages: boolean;
    cachedResources: string[];
    offlineScore: number;
  }> {
    let hasOfflinePages = false;
    const cachedResources: string[] = [];
    let offlineScore = 0;

    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        
        for (const cacheName of cacheNames) {
          const cache = await caches.open(cacheName);
          const requests = await cache.keys();
          
          for (const request of requests) {
            cachedResources.push(request.url);
            
            // Check if main pages are cached
            if (request.url.includes(window.location.origin)) {
              hasOfflinePages = true;
            }
          }
        }

        // Calculate offline score
        if (cachedResources.length > 0) {
          offlineScore += 30;
        }
        if (hasOfflinePages) {
          offlineScore += 40;
        }
        if (cachedResources.some(url => url.includes('/api/'))) {
          offlineScore += 20; // API caching
        }
        if (cachedResources.some(url => url.includes('.js') || url.includes('.css'))) {
          offlineScore += 10; // Static assets
        }

      } catch (error) {
        console.warn('Error testing offline capability:', error);
      }
    }

    return {
      hasOfflinePages,
      cachedResources,
      offlineScore: Math.min(100, offlineScore)
    };
  }
}

// Export convenience function
export async function validatePWA(): Promise<PWAValidationReport> {
  return await PWAValidator.validatePWA();
}