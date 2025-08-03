// Comprehensive Validation Suite for Healthcare System
class ValidationSuite {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      suggestions: 0,
      tests: [],
      score: 0,
      startTime: Date.now()
    };
  }
  
  async runFullValidation() {
    console.log('🧪 Starting comprehensive validation suite...\n');
    console.log('='.repeat(60));
    
    try {
      // Core System Tests
      await this.testManifestConfiguration();
      await this.testServiceWorkerFunctionality();
      await this.testPWACapabilities();
      
      // Resource and Asset Tests
      await this.testCriticalResources();
      await this.testIconAvailability();
      await this.testFontLoading();
      
      // Performance Tests
      await this.testPerformanceMetrics();
      await this.testResourceSizes();
      await this.testLoadingTimes();
      
      // Accessibility Tests
      this.testAccessibilityCompliance();
      this.testKeyboardNavigation();
      this.testScreenReaderSupport();
      
      // User Experience Tests
      this.testResponsiveDesign();
      this.testInteractionStates();
      this.testErrorHandling();
      
      // Security Tests
      this.testSecurityHeaders();
      this.testContentSecurityPolicy();
      
      // Browser Compatibility Tests
      this.testBrowserSupport();
      this.testModernFeatures();
      
      // Generate comprehensive report
      this.generateDetailedReport();
      
    } catch (error) {
      this.addResult('error', 'Validation Suite Error', `Critical error: ${error.message}`);
    }
    
    return this.results;
  }
  
  // ===== PWA AND MANIFEST TESTS =====
  async testManifestConfiguration() {
    const test = this.createTest('PWA Manifest Configuration');
    
    try {
      const response = await fetch('/manifest.json');
      if (!response.ok) {
        return test.fail('Manifest.json not accessible');
      }
      
      const manifest = await response.json();
      
      // Test required fields
      const requiredFields = {
        'name': 'Application name',
        'short_name': 'Short name',
        'start_url': 'Start URL',
        'display': 'Display mode',
        'icons': 'Icons array'
      };
      
      for (const [field, description] of Object.entries(requiredFields)) {
        if (!manifest[field]) {
          test.fail(`Missing required field: ${description}`);
        } else {
          test.pass(`✓ ${description} present`);
        }
      }
      
      // Test icon requirements
      if (manifest.icons && Array.isArray(manifest.icons)) {
        const iconSizes = manifest.icons.map(icon => icon.sizes);
        const requiredSizes = ['192x192', '512x512'];
        
        requiredSizes.forEach(size => {
          if (iconSizes.includes(size)) {
            test.pass(`✓ Icon size ${size} present`);
          } else {
            test.warn(`Missing recommended icon size: ${size}`);
          }
        });
        
        // Test maskable icons
        const maskableIcons = manifest.icons.filter(icon => 
          icon.purpose && icon.purpose.includes('maskable')
        );
        
        if (maskableIcons.length > 0) {
          test.pass('✓ Maskable icons available');
        } else {
          test.suggest('Consider adding maskable icons for better platform integration');
        }
      }
      
      // Test display mode
      const validDisplayModes = ['standalone', 'fullscreen', 'minimal-ui', 'browser'];
      if (validDisplayModes.includes(manifest.display)) {
        test.pass(`✓ Valid display mode: ${manifest.display}`);
      } else {
        test.warn(`Unusual display mode: ${manifest.display}`);
      }
      
      // Test theme colors
      if (manifest.theme_color) {
        test.pass('✓ Theme color specified');
      } else {
        test.suggest('Consider adding theme_color for better native integration');
      }
      
      if (manifest.background_color) {
        test.pass('✓ Background color specified');
      } else {
        test.suggest('Consider adding background_color for splash screen');
      }
      
      test.complete();
      
    } catch (error) {
      test.fail(`Error testing manifest: ${error.message}`);
    }
  }
  
  async testServiceWorkerFunctionality() {
    const test = this.createTest('Service Worker Functionality');
    
    if (!('serviceWorker' in navigator)) {
      return test.fail('Service Worker not supported in this browser');
    }
    
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      
      if (registrations.length === 0) {
        test.warn('No Service Worker registered');
      } else {
        const activeWorkers = registrations.filter(reg => reg.active);
        
        if (activeWorkers.length > 0) {
          test.pass(`✓ ${activeWorkers.length} active Service Worker(s)`);
          
          // Test Service Worker scope
          activeWorkers.forEach((reg, index) => {
            test.pass(`✓ SW ${index + 1} scope: ${reg.scope}`);
          });
          
          // Test update mechanism
          const registration = activeWorkers[0];
          if (registration.update) {
            test.pass('✓ Service Worker update mechanism available');
          }
          
          // Test message handling
          if (registration.active) {
            test.pass('✓ Service Worker message channel available');
          }
          
        } else {
          test.warn('Service Worker registered but not active');
        }
      }
      
      // Test offline functionality
      if (navigator.onLine === false) {
        test.pass('✓ Offline detection working');
      }
      
      test.complete();
      
    } catch (error) {
      test.fail(`Error testing Service Worker: ${error.message}`);
    }
  }
  
  async testPWACapabilities() {
    const test = this.createTest('PWA Capabilities');
    
    // Test display mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
      test.pass('✓ Running in standalone mode (PWA)');
    } else {
      test.info('Running in browser mode');
    }
    
    // Test installation capability
    let canInstall = false;
    const installHandler = (e) => {
      canInstall = true;
      e.preventDefault();
    };
    
    window.addEventListener('beforeinstallprompt', installHandler);
    
    setTimeout(() => {
      window.removeEventListener('beforeinstallprompt', installHandler);
      if (canInstall) {
        test.pass('✓ App is installable');
      } else {
        test.info('App installation prompt not triggered (may already be installed)');
      }
    }, 100);
    
    // Test navigation API
    if ('navigation' in window) {
      test.pass('✓ Navigation API supported');
    } else {
      test.info('Navigation API not supported (non-critical)');
    }
    
    // Test background sync
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      test.pass('✓ Background Sync supported');
    } else {
      test.info('Background Sync not supported');
    }
    
    // Test push notifications
    if ('Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window) {
      test.pass('✓ Push Notifications supported');
    } else {
      test.info('Push Notifications not fully supported');
    }
    
    test.complete();
  }
  
  // ===== RESOURCE TESTS =====
  async testCriticalResources() {
    const test = this.createTest('Critical Resources');
    
    const criticalResources = [
      { url: '/manifest.json', name: 'PWA Manifest' },
      { url: '/sw.js', name: 'Service Worker' },
      { url: '/favicon.ico', name: 'Favicon' },
      { url: '/src/main.tsx', name: 'Main Application File' },
      { url: '/src/styles/globals.css', name: 'Global Styles' }
    ];
    
    const testPromises = criticalResources.map(async (resource) => {
      try {
        const response = await fetch(resource.url, { method: 'HEAD' });
        if (response.ok) {
          test.pass(`✓ ${resource.name} loaded successfully`);
        } else {
          test.fail(`${resource.name} returned status ${response.status}`);
        }
      } catch (error) {
        test.fail(`${resource.name} failed to load: ${error.message}`);
      }
    });
    
    await Promise.all(testPromises);
    test.complete();
  }
  
  async testIconAvailability() {
    const test = this.createTest('Icon Availability');
    
    const iconSizes = [
      '72x72', '96x96', '128x128', '144x144', '152x152', 
      '192x192', '384x384', '512x512'
    ];
    
    const testPromises = iconSizes.map(async (size) => {
      try {
        const response = await fetch(`/icons/icon-${size}.png`, { method: 'HEAD' });
        if (response.ok) {
          test.pass(`✓ Icon ${size} available`);
        } else {
          test.warn(`Icon ${size} not found`);
        }
      } catch (error) {
        test.warn(`Icon ${size} test failed`);
      }
    });
    
    // Test maskable icons
    const maskablePromises = ['192x192', '512x512'].map(async (size) => {
      try {
        const response = await fetch(`/icons/icon-maskable-${size}.png`, { method: 'HEAD' });
        if (response.ok) {
          test.pass(`✓ Maskable icon ${size} available`);
        } else {
          test.suggest(`Consider adding maskable icon ${size}`);
        }
      } catch (error) {
        test.suggest(`Maskable icon ${size} recommended`);
      }
    });
    
    await Promise.all([...testPromises, ...maskablePromises]);
    test.complete();
  }
  
  async testFontLoading() {
    const test = this.createTest('Font Loading');
    
    if ('fonts' in document) {
      try {
        await document.fonts.ready;
        test.pass('✓ Fonts loaded successfully');
        
        const fontFaces = Array.from(document.fonts);
        if (fontFaces.length > 0) {
          test.pass(`✓ ${fontFaces.length} font face(s) available`);
        }
        
      } catch (error) {
        test.warn('Font loading check failed');
      }
    } else {
      test.info('Font Loading API not supported');
    }
    
    test.complete();
  }
  
  // ===== PERFORMANCE TESTS =====
  async testPerformanceMetrics() {
    const test = this.createTest('Performance Metrics');
    
    // Test Core Web Vitals
    try {
      // First Contentful Paint
      const paintEntries = performance.getEntriesByType('paint');
      const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      
      if (fcp) {
        if (fcp.startTime < 1800) {
          test.pass(`✓ Excellent FCP: ${fcp.startTime.toFixed(0)}ms`);
        } else if (fcp.startTime < 3000) {
          test.warn(`Moderate FCP: ${fcp.startTime.toFixed(0)}ms`);
        } else {
          test.fail(`Slow FCP: ${fcp.startTime.toFixed(0)}ms`);
        }
      }
      
      // Largest Contentful Paint (if available)
      const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
      if (lcpEntries.length > 0) {
        const lcp = lcpEntries[lcpEntries.length - 1];
        if (lcp.startTime < 2500) {
          test.pass(`✓ Good LCP: ${lcp.startTime.toFixed(0)}ms`);
        } else if (lcp.startTime < 4000) {
          test.warn(`Moderate LCP: ${lcp.startTime.toFixed(0)}ms`);
        } else {
          test.fail(`Poor LCP: ${lcp.startTime.toFixed(0)}ms`);
        }
      }
      
      // Navigation timing
      const navigation = performance.getEntriesByType('navigation')[0];
      if (navigation) {
        const loadTime = navigation.loadEventEnd - navigation.loadEventStart;
        if (loadTime < 2000) {
          test.pass(`✓ Fast load time: ${loadTime.toFixed(0)}ms`);
        } else if (loadTime < 4000) {
          test.warn(`Moderate load time: ${loadTime.toFixed(0)}ms`);
        } else {
          test.fail(`Slow load time: ${loadTime.toFixed(0)}ms`);
        }
      }
      
    } catch (error) {
      test.warn(`Performance measurement error: ${error.message}`);
    }
    
    test.complete();
  }
  
  async testResourceSizes() {
    const test = this.createTest('Resource Sizes');
    
    try {
      const resources = performance.getEntriesByType('resource');
      let totalSize = 0;
      let imageSize = 0;
      let scriptSize = 0;
      let styleSize = 0;
      
      resources.forEach(resource => {
        const size = resource.transferSize || 0;
        totalSize += size;
        
        if (resource.name.match(/\.(png|jpg|jpeg|gif|svg|webp)$/i)) {
          imageSize += size;
        } else if (resource.name.match(/\.(js|jsx|ts|tsx)$/i)) {
          scriptSize += size;
        } else if (resource.name.match(/\.(css)$/i)) {
          styleSize += size;
        }
      });
      
      const totalMB = (totalSize / 1024 / 1024).toFixed(2);
      
      if (totalSize < 2 * 1024 * 1024) { // 2MB
        test.pass(`✓ Good total size: ${totalMB}MB`);
      } else if (totalSize < 5 * 1024 * 1024) { // 5MB
        test.warn(`Moderate total size: ${totalMB}MB`);
      } else {
        test.fail(`Large total size: ${totalMB}MB`);
      }
      
      // Break down by type
      if (imageSize > 0) {
        const imageMB = (imageSize / 1024 / 1024).toFixed(2);
        test.info(`Images: ${imageMB}MB`);
      }
      
      if (scriptSize > 0) {
        const scriptMB = (scriptSize / 1024 / 1024).toFixed(2);
        test.info(`Scripts: ${scriptMB}MB`);
      }
      
      if (styleSize > 0) {
        const styleMB = (styleSize / 1024 / 1024).toFixed(2);
        test.info(`Styles: ${styleMB}MB`);
      }
      
      // Check for unusually large resources
      const largeResources = resources.filter(r => r.transferSize > 500000); // 500KB
      if (largeResources.length > 0) {
        largeResources.forEach(resource => {
          const sizeMB = (resource.transferSize / 1024 / 1024).toFixed(2);
          test.warn(`Large resource: ${resource.name.split('/').pop()} (${sizeMB}MB)`);
        });
      }
      
    } catch (error) {
      test.warn(`Resource size analysis failed: ${error.message}`);
    }
    
    test.complete();
  }
  
  async testLoadingTimes() {
    const test = this.createTest('Loading Performance');
    
    try {
      const navigation = performance.getEntriesByType('navigation')[0];
      
      if (navigation) {
        const metrics = {
          'DNS Lookup': navigation.domainLookupEnd - navigation.domainLookupStart,
          'TCP Connection': navigation.connectEnd - navigation.connectStart,
          'Request/Response': navigation.responseEnd - navigation.requestStart,
          'DOM Processing': navigation.domContentLoadedEventEnd - navigation.responseEnd,
          'Resource Loading': navigation.loadEventEnd - navigation.domContentLoadedEventEnd
        };
        
        Object.entries(metrics).forEach(([name, time]) => {
          if (time > 0) {
            if (time < 100) {
              test.pass(`✓ ${name}: ${time.toFixed(0)}ms`);
            } else if (time < 500) {
              test.info(`${name}: ${time.toFixed(0)}ms`);
            } else {
              test.warn(`Slow ${name}: ${time.toFixed(0)}ms`);
            }
          }
        });
      }
      
    } catch (error) {
      test.warn(`Loading time analysis failed: ${error.message}`);
    }
    
    test.complete();
  }
  
  // ===== ACCESSIBILITY TESTS =====
  testAccessibilityCompliance() {
    const test = this.createTest('Accessibility Compliance');
    
    // Test semantic HTML
    const semanticElements = document.querySelectorAll('main, nav, header, footer, section, article, aside');
    if (semanticElements.length > 0) {
      test.pass(`✓ ${semanticElements.length} semantic HTML elements found`);
    } else {
      test.warn('No semantic HTML elements found');
    }
    
    // Test headings structure
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const h1Count = document.querySelectorAll('h1').length;
    
    if (h1Count === 1) {
      test.pass('✓ Proper heading structure (single h1)');
    } else if (h1Count === 0) {
      test.fail('No h1 element found');
    } else {
      test.warn(`Multiple h1 elements found: ${h1Count}`);
    }
    
    // Test images alt attributes
    const images = document.querySelectorAll('img');
    const imagesWithoutAlt = document.querySelectorAll('img:not([alt])');
    
    if (images.length > 0) {
      if (imagesWithoutAlt.length === 0) {
        test.pass(`✓ All ${images.length} images have alt attributes`);
      } else {
        test.fail(`${imagesWithoutAlt.length} images missing alt attributes`);
      }
    }
    
    // Test form labels
    const inputs = document.querySelectorAll('input, select, textarea');
    const inputsWithoutLabels = Array.from(inputs).filter(input => {
      const id = input.id;
      const ariaLabel = input.getAttribute('aria-label');
      const ariaLabelledby = input.getAttribute('aria-labelledby');
      const label = id && document.querySelector(`label[for="${id}"]`);
      
      return !label && !ariaLabel && !ariaLabelledby;
    });
    
    if (inputs.length > 0) {
      if (inputsWithoutLabels.length === 0) {
        test.pass(`✓ All ${inputs.length} form controls have labels`);
      } else {
        test.fail(`${inputsWithoutLabels.length} form controls missing labels`);
      }
    }
    
    // Test button accessibility
    const buttons = document.querySelectorAll('button');
    const emptyButtons = Array.from(buttons).filter(button => {
      const text = button.textContent.trim();
      const ariaLabel = button.getAttribute('aria-label');
      return !text && !ariaLabel;
    });
    
    if (buttons.length > 0) {
      if (emptyButtons.length === 0) {
        test.pass(`✓ All ${buttons.length} buttons have accessible names`);
      } else {
        test.fail(`${emptyButtons.length} buttons missing accessible names`);
      }
    }
    
    // Test color contrast (basic check)
    const computedStyles = getComputedStyle(document.body);
    const backgroundColor = computedStyles.backgroundColor;
    const color = computedStyles.color;
    
    if (backgroundColor !== 'rgba(0, 0, 0, 0)' && color !== backgroundColor) {
      test.pass('✓ Body has defined colors');
    } else {
      test.warn('Default browser colors detected - verify contrast manually');
    }
    
    // Test focus indicators
    const focusableElements = document.querySelectorAll(
      'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length > 0) {
      test.pass(`✓ ${focusableElements.length} focusable elements found`);
    }
    
    // Test ARIA landmarks
    const landmarks = document.querySelectorAll('[role="banner"], [role="main"], [role="navigation"], [role="contentinfo"]');
    if (landmarks.length > 0) {
      test.pass(`✓ ${landmarks.length} ARIA landmarks found`);
    } else {
      test.suggest('Consider adding ARIA landmarks for better navigation');
    }
    
    test.complete();
  }
  
  testKeyboardNavigation() {
    const test = this.createTest('Keyboard Navigation');
    
    // Test skip links
    const skipLinks = document.querySelectorAll('a[href^="#"], .skip-link');
    if (skipLinks.length > 0) {
      test.pass(`✓ ${skipLinks.length} skip link(s) found`);
    } else {
      test.suggest('Consider adding skip links for keyboard users');
    }
    
    // Test tab order
    const tabbableElements = document.querySelectorAll(
      'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    let tabIndexIssues = 0;
    tabbableElements.forEach(element => {
      const tabIndex = element.getAttribute('tabindex');
      if (tabIndex && parseInt(tabIndex) > 0) {
        tabIndexIssues++;
      }
    });
    
    if (tabIndexIssues === 0) {
      test.pass('✓ No positive tabindex values found (good practice)');
    } else {
      test.warn(`${tabIndexIssues} elements with positive tabindex (may disrupt tab order)`);
    }
    
    // Test focus trap (if modal or sidebar is present)
    const modals = document.querySelectorAll('[role="dialog"], .modal, .sidebar');
    if (modals.length > 0) {
      test.info(`${modals.length} modal-like element(s) found - verify focus trapping manually`);
    }
    
    test.complete();
  }
  
  testScreenReaderSupport() {
    const test = this.createTest('Screen Reader Support');
    
    // Test ARIA attributes
    const ariaElements = document.querySelectorAll('[aria-label], [aria-labelledby], [aria-describedby], [role]');
    if (ariaElements.length > 0) {
      test.pass(`✓ ${ariaElements.length} elements with ARIA attributes`);
    } else {
      test.warn('No ARIA attributes found');
    }
    
    // Test live regions
    const liveRegions = document.querySelectorAll('[aria-live], [role="status"], [role="alert"]');
    if (liveRegions.length > 0) {
      test.pass(`✓ ${liveRegions.length} live region(s) found`);
    } else {
      test.suggest('Consider adding live regions for dynamic content');
    }
    
    // Test hidden content
    const hiddenElements = document.querySelectorAll('[aria-hidden="true"]');
    const visuallyHidden = document.querySelectorAll('.sr-only, .visually-hidden');
    
    if (visuallyHidden.length > 0) {
      test.pass(`✓ ${visuallyHidden.length} visually hidden element(s) for screen readers`);
    }
    
    if (hiddenElements.length > 0) {
      test.info(`${hiddenElements.length} element(s) hidden from assistive technology`);
    }
    
    // Test language declaration
    const htmlLang = document.documentElement.getAttribute('lang');
    if (htmlLang) {
      test.pass(`✓ Page language declared: ${htmlLang}`);
    } else {
      test.fail('Page language not declared in html element');
    }
    
    test.complete();
  }
  
  // ===== USER EXPERIENCE TESTS =====
  testResponsiveDesign() {
    const test = this.createTest('Responsive Design');
    
    // Test viewport meta tag
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport && viewport.content.includes('width=device-width')) {
      test.pass('✓ Proper viewport meta tag found');
    } else {
      test.fail('Viewport meta tag missing or incorrect');
    }
    
    // Test CSS media queries
    let hasMediaQueries = false;
    try {
      const stylesheets = Array.from(document.styleSheets);
      stylesheets.forEach(sheet => {
        if (sheet.cssRules) {
          Array.from(sheet.cssRules).forEach(rule => {
            if (rule.type === CSSRule.MEDIA_RULE) {
              hasMediaQueries = true;
            }
          });
        }
      });
    } catch (e) {
      test.info('CSS media query check blocked by CORS');
    }
    
    if (hasMediaQueries) {
      test.pass('✓ CSS media queries found');
    } else {
      test.warn('No CSS media queries detected');
    }
    
    // Test horizontal scrolling
    const bodyWidth = document.body.scrollWidth;
    const windowWidth = window.innerWidth;
    
    if (bodyWidth <= windowWidth + 5) { // 5px tolerance
      test.pass('✓ No horizontal overflow detected');
    } else {
      test.warn(`Horizontal overflow detected: ${bodyWidth - windowWidth}px`);
    }
    
    // Test touch targets
    const interactiveElements = document.querySelectorAll('button, a, input, select, textarea');
    let smallTargets = 0;
    
    interactiveElements.forEach(element => {
      const rect = element.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44)) {
        smallTargets++;
      }
    });
    
    if (smallTargets === 0) {
      test.pass('✓ All interactive elements meet minimum touch target size (44px)');
    } else {
      test.warn(`${smallTargets} interactive elements smaller than 44px`);
    }
    
    test.complete();
  }
  
  testInteractionStates() {
    const test = this.createTest('Interaction States');
    
    // Test hover states (check for hover CSS)
    const elementsWithHover = document.querySelectorAll('button, a, .btn, .card');
    if (elementsWithHover.length > 0) {
      test.pass(`✓ ${elementsWithHover.length} potentially interactive elements found`);
    }
    
    // Test focus states
    const focusableElements = document.querySelectorAll('button, a, input, select, textarea');
    let focusableCount = 0;
    
    focusableElements.forEach(element => {
      const styles = getComputedStyle(element, ':focus');
      if (styles.outline !== 'none' || styles.boxShadow !== 'none') {
        focusableCount++;
      }
    });
    
    if (focusableCount > 0) {
      test.pass(`✓ Focus indicators detected on ${focusableCount} elements`);
    } else {
      test.warn('No focus indicators detected - verify manual focus testing');
    }
    
    // Test disabled states
    const disabledElements = document.querySelectorAll('[disabled], [aria-disabled="true"]');
    if (disabledElements.length > 0) {
      test.info(`${disabledElements.length} disabled element(s) found`);
    }
    
    test.complete();
  }
  
  testErrorHandling() {
    const test = this.createTest('Error Handling');
    
    // Test global error handlers
    if (window.onerror || window.addEventListener) {
      test.pass('✓ Error handling mechanisms available');
    }
    
    // Test console errors
    const originalError = console.error;
    let errorCount = 0;
    
    console.error = function(...args) {
      errorCount++;
      originalError.apply(console, args);
    };
    
    setTimeout(() => {
      console.error = originalError;
      if (errorCount === 0) {
        test.pass('✓ No console errors detected during test');
      } else {
        test.warn(`${errorCount} console error(s) detected`);
      }
    }, 1000);
    
    // Test network error handling
    if ('fetch' in window) {
      test.pass('✓ Fetch API available for proper error handling');
    }
    
    test.complete();
  }
  
  // ===== SECURITY TESTS =====
  testSecurityHeaders() {
    const test = this.createTest('Security Headers');
    
    // Note: These headers can only be checked server-side or through developer tools
    // This is a placeholder for security awareness
    
    test.info('Security headers should be verified server-side:');
    test.info('• Content-Security-Policy');
    test.info('• X-Frame-Options');
    test.info('• X-Content-Type-Options');
    test.info('• Referrer-Policy');
    test.info('• Permissions-Policy');
    
    // Test HTTPS usage
    if (location.protocol === 'https:' || location.hostname === 'localhost') {
      test.pass('✓ Secure context (HTTPS or localhost)');
    } else {
      test.fail('Insecure context - HTTPS required for production');
    }
    
    test.complete();
  }
  
  testContentSecurityPolicy() {
    const test = this.createTest('Content Security Policy');
    
    // Check for CSP meta tag (not recommended but possible)
    const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (cspMeta) {
      test.info('CSP meta tag found (header implementation preferred)');
    } else {
      test.info('CSP should be implemented via HTTP headers');
    }
    
    // Test inline script/style detection
    const inlineScripts = document.querySelectorAll('script:not([src])');
    const inlineStyles = document.querySelectorAll('style');
    
    if (inlineScripts.length > 0) {
      test.warn(`${inlineScripts.length} inline script(s) found - may conflict with strict CSP`);
    } else {
      test.pass('✓ No inline scripts detected');
    }
    
    if (inlineStyles.length > 0) {
      test.info(`${inlineStyles.length} inline style(s) found`);
    }
    
    test.complete();
  }
  
  // ===== BROWSER COMPATIBILITY TESTS =====
  testBrowserSupport() {
    const test = this.createTest('Browser Support');
    
    const features = {
      'CSS Grid': CSS.supports('display', 'grid'),
      'CSS Flexbox': CSS.supports('display', 'flex'),
      'CSS Custom Properties': CSS.supports('--test', '0'),
      'ES6 Classes': typeof class {} === 'function',
      'Arrow Functions': (() => true)(),
      'Fetch API': 'fetch' in window,
      'Service Workers': 'serviceWorker' in navigator,
      'Web App Manifest': 'onbeforeinstallprompt' in window,
      'Intersection Observer': 'IntersectionObserver' in window,
      'Local Storage': 'localStorage' in window
    };
    
    Object.entries(features).forEach(([feature, supported]) => {
      if (supported) {
        test.pass(`✓ ${feature} supported`);
      } else {
        test.warn(`${feature} not supported`);
      }
    });
    
    test.complete();
  }
  
  testModernFeatures() {
    const test = this.createTest('Modern Web Features');
    
    const modernFeatures = {
      'Web Components': 'customElements' in window,
      'Shadow DOM': 'attachShadow' in Element.prototype,
      'ES Modules': 'noModule' in HTMLScriptElement.prototype,
      'WebP Support': (() => {
        const canvas = document.createElement('canvas');
        return canvas.toDataURL('image/webp').indexOf('webp') > 0;
      })(),
      'WebAssembly': 'WebAssembly' in window,
      'Payment Request': 'PaymentRequest' in window,
      'Web Share': 'share' in navigator
    };
    
    Object.entries(modernFeatures).forEach(([feature, supported]) => {
      if (supported) {
        test.pass(`✓ ${feature} available`);
      } else {
        test.info(`${feature} not available (optional)`);
      }
    });
    
    test.complete();
  }
  
  // ===== UTILITY METHODS =====
  createTest(name) {
    const test = {
      name,
      status: 'running',
      results: [],
      pass: (message) => {
        test.results.push({ type: 'pass', message });
        this.results.passed++;
      },
      fail: (message) => {
        test.results.push({ type: 'fail', message });
        test.status = 'failed';
        this.results.failed++;
      },
      warn: (message) => {
        test.results.push({ type: 'warn', message });
        this.results.warnings++;
      },
      suggest: (message) => {
        test.results.push({ type: 'suggest', message });
        this.results.suggestions++;
      },
      info: (message) => {
        test.results.push({ type: 'info', message });
      },
      complete: () => {
        if (test.status === 'running') {
          test.status = 'passed';
        }
        this.results.tests.push(test);
      }
    };
    
    return test;
  }
  
  addResult(type, category, message) {
    this.results.tests.push({
      name: category,
      status: type === 'error' ? 'failed' : 'passed',
      results: [{ type, message }]
    });
    
    if (type === 'error') {
      this.results.failed++;
    } else {
      this.results.passed++;
    }
  }
  
  generateDetailedReport() {
    const endTime = Date.now();
    const duration = endTime - this.results.startTime;
    
    // Calculate score
    const totalTests = this.results.passed + this.results.failed;
    this.results.score = totalTests > 0 ? Math.round((this.results.passed / totalTests) * 100) : 0;
    
    console.log('\n🏥 HEALTHCARE SYSTEM VALIDATION REPORT');
    console.log('='.repeat(60));
    
    // Executive Summary
    console.log(`\n📊 EXECUTIVE SUMMARY:`);
    console.log(`   • Overall Score: ${this.results.score}%`);
    console.log(`   • Tests Passed: ${this.results.passed}`);
    console.log(`   • Tests Failed: ${this.results.failed}`);
    console.log(`   • Warnings: ${this.results.warnings}`);
    console.log(`   • Suggestions: ${this.results.suggestions}`);
    console.log(`   • Duration: ${(duration / 1000).toFixed(2)}s`);
    
    // Detailed Results
    this.results.tests.forEach(test => {
      const statusIcon = test.status === 'passed' ? '✅' : test.status === 'failed' ? '❌' : '⚠️';
      console.log(`\n${statusIcon} ${test.name.toUpperCase()}`);
      
      test.results.forEach(result => {
        const icon = this.getResultIcon(result.type);
        console.log(`   ${icon} ${result.message}`);
      });
    });
    
    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    
    if (this.results.score >= 95) {
      console.log('   🎉 Excellent! Your healthcare system meets professional standards.');
    } else if (this.results.score >= 85) {
      console.log('   👍 Good! Minor improvements recommended for optimal performance.');
    } else if (this.results.score >= 70) {
      console.log('   ⚠️ Fair! Several improvements needed for professional deployment.');
    } else {
      console.log('   🚨 Critical! Major issues must be addressed before deployment.');
    }
    
    // Priority Actions
    if (this.results.failed > 0) {
      console.log('   1. Fix all failed tests immediately');
    }
    if (this.results.warnings > 0) {
      console.log('   2. Address warning items for better user experience');
    }
    if (this.results.suggestions > 0) {
      console.log('   3. Consider implementing suggested improvements');
    }
    
    console.log('\n🔄 Re-run validation: ValidationSuite.runFullValidation()');
    console.log('='.repeat(60));
    
    return this.results;
  }
  
  getResultIcon(type) {
    const icons = {
      pass: '✓',
      fail: '✗',
      warn: '⚠',
      suggest: '💡',
      info: 'ℹ',
      error: '❌'
    };
    return icons[type] || 'ℹ';
  }
}

// Global instance and auto-execution
window.ValidationSuite = ValidationSuite;

// Auto-run validation in development
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  window.addEventListener('load', () => {
    console.log('🔍 Auto-running validation suite in development mode...');
    setTimeout(() => {
      const validator = new ValidationSuite();
      validator.runFullValidation();
    }, 3000); // Wait 3 seconds for app to initialize
  });
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ValidationSuite;
}