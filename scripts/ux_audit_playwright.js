const { chromium, devices } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

const SITE_URL = 'https://hml-roteiros-de-dispensacao.web.app/';
const SCREENSHOTS_DIR = path.join(__dirname, '..', 'claudedocs', 'audit_screenshots');

// Audit results structure
const auditResults = {
  timestamp: new Date().toISOString(),
  url: SITE_URL,
  overallScore: 0,
  categories: {
    accessibility: { score: 0, issues: [], tests: [] },
    performance: { score: 0, issues: [], metrics: {} },
    mobileUsability: { score: 0, issues: [], viewports: [] },
    interactivity: { score: 0, issues: [], tests: [] },
    navigation: { score: 0, issues: [], tests: [] }
  },
  prioritizedFixes: []
};

// Helper functions
async function ensureDir(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
}

async function takeScreenshot(page, name) {
  await ensureDir(SCREENSHOTS_DIR);
  const filepath = path.join(SCREENSHOTS_DIR, `${name}_${Date.now()}.png`);
  await page.screenshot({ path: filepath, fullPage: true });
  return filepath;
}

function addIssue(category, severity, title, description, suggestion, screenshot = null) {
  auditResults.categories[category].issues.push({
    severity,
    title,
    description,
    suggestion,
    screenshot,
    timestamp: new Date().toISOString()
  });
}

// Accessibility Audit
async function auditAccessibility(page) {
  console.log('🔍 Running Accessibility Audit...');

  const tests = [];

  // Check HTML lang attribute
  const htmlLang = await page.getAttribute('html', 'lang');
  tests.push({
    name: 'HTML lang attribute',
    passed: !!htmlLang,
    value: htmlLang || 'missing'
  });

  if (!htmlLang) {
    addIssue('accessibility', 'high', 'Missing HTML lang attribute',
      'The <html> element does not have a lang attribute',
      'Add lang="pt-BR" to the <html> element');
  }

  // Check for proper heading structure
  const headings = await page.$$eval('h1, h2, h3, h4, h5, h6', elements =>
    elements.map(el => ({ tag: el.tagName, text: el.textContent.trim().substring(0, 50) }))
  );

  const h1Count = headings.filter(h => h.tag === 'H1').length;
  tests.push({
    name: 'H1 heading count',
    passed: h1Count === 1,
    value: h1Count
  });

  if (h1Count === 0) {
    addIssue('accessibility', 'critical', 'No H1 heading found',
      'Page does not have a main H1 heading',
      'Add a descriptive H1 heading to represent the main page content');
  } else if (h1Count > 1) {
    addIssue('accessibility', 'medium', 'Multiple H1 headings',
      `Found ${h1Count} H1 headings on the page`,
      'Use only one H1 heading per page, use H2-H6 for subsections');
  }

  // Check for alt text on images
  const images = await page.$$eval('img', imgs =>
    imgs.map(img => ({
      src: img.src,
      alt: img.alt,
      hasAlt: !!img.alt
    }))
  );

  const imagesWithoutAlt = images.filter(img => !img.hasAlt);
  tests.push({
    name: 'Images with alt text',
    passed: imagesWithoutAlt.length === 0,
    value: `${images.length - imagesWithoutAlt.length}/${images.length}`
  });

  if (imagesWithoutAlt.length > 0) {
    addIssue('accessibility', 'high', 'Images missing alt text',
      `${imagesWithoutAlt.length} images do not have alt text`,
      'Add descriptive alt attributes to all images. For decorative images, use alt=""');
  }

  // Check for ARIA labels on interactive elements
  const buttons = await page.$$eval('button, [role="button"]', btns =>
    btns.map(btn => ({
      text: btn.textContent.trim(),
      ariaLabel: btn.getAttribute('aria-label'),
      hasLabel: !!(btn.textContent.trim() || btn.getAttribute('aria-label'))
    }))
  );

  const buttonsWithoutLabel = buttons.filter(btn => !btn.hasLabel);
  tests.push({
    name: 'Interactive elements with labels',
    passed: buttonsWithoutLabel.length === 0,
    value: `${buttons.length - buttonsWithoutLabel.length}/${buttons.length}`
  });

  if (buttonsWithoutLabel.length > 0) {
    addIssue('accessibility', 'high', 'Buttons without accessible labels',
      `${buttonsWithoutLabel.length} buttons lack accessible text or aria-label`,
      'Add visible text or aria-label to all buttons');
  }

  // Check color contrast (basic check)
  const contrastIssues = await page.evaluate(() => {
    const issues = [];
    const textElements = document.querySelectorAll('p, span, a, h1, h2, h3, h4, h5, h6, button, label');

    function getLuminance(r, g, b) {
      const [rs, gs, bs] = [r, g, b].map(c => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    }

    function getContrast(rgb1, rgb2) {
      const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
      const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
      const lighter = Math.max(l1, l2);
      const darker = Math.min(l1, l2);
      return (lighter + 0.05) / (darker + 0.05);
    }

    function parseRgb(rgbStr) {
      const match = rgbStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (!match) return null;
      return { r: parseInt(match[1]), g: parseInt(match[2]), b: parseInt(match[3]) };
    }

    for (let i = 0; i < Math.min(textElements.length, 50); i++) {
      const el = textElements[i];
      const styles = window.getComputedStyle(el);
      const fontSize = parseFloat(styles.fontSize);
      const fontWeight = parseInt(styles.fontWeight) || 400;

      const color = parseRgb(styles.color);
      const bgColor = parseRgb(styles.backgroundColor);

      if (!color || !bgColor || bgColor.r === undefined) continue;

      const contrast = getContrast(color, bgColor);
      const isLargeText = fontSize >= 18 || (fontSize >= 14 && fontWeight >= 700);
      const requiredContrast = isLargeText ? 3 : 4.5;

      if (contrast < requiredContrast) {
        issues.push({
          element: el.tagName,
          text: el.textContent.trim().substring(0, 30),
          contrast: contrast.toFixed(2),
          required: requiredContrast
        });
      }
    }

    return issues.slice(0, 10);
  });

  tests.push({
    name: 'Color contrast check',
    passed: contrastIssues.length === 0,
    value: `${contrastIssues.length} potential issues`
  });

  if (contrastIssues.length > 0) {
    addIssue('accessibility', 'medium', 'Color contrast issues detected',
      `Found ${contrastIssues.length} elements with potentially insufficient contrast`,
      'Ensure text has at least 4.5:1 contrast ratio (3:1 for large text). Use tools like WebAIM Contrast Checker.');
  }

  // Keyboard navigation test
  await page.keyboard.press('Tab');
  const focusedElement1 = await page.evaluate(() => {
    const el = document.activeElement;
    return {
      tag: el.tagName,
      hasFocusStyle: window.getComputedStyle(el).outline !== 'none'
    };
  });

  tests.push({
    name: 'Keyboard navigation',
    passed: focusedElement1.tag !== 'BODY',
    value: focusedElement1.tag
  });

  if (focusedElement1.tag === 'BODY') {
    addIssue('accessibility', 'critical', 'Keyboard navigation not working',
      'Tab key does not move focus to interactive elements',
      'Ensure all interactive elements are keyboard accessible and have visible focus indicators');
  }

  // Check for form labels
  const formInputs = await page.$$eval('input:not([type="hidden"]), textarea, select', inputs =>
    inputs.map(input => ({
      type: input.type || 'textarea',
      hasLabel: !!input.labels?.length || !!input.getAttribute('aria-label'),
      id: input.id
    }))
  );

  const inputsWithoutLabels = formInputs.filter(input => !input.hasLabel);
  tests.push({
    name: 'Form inputs with labels',
    passed: inputsWithoutLabels.length === 0,
    value: `${formInputs.length - inputsWithoutLabels.length}/${formInputs.length}`
  });

  if (inputsWithoutLabels.length > 0) {
    addIssue('accessibility', 'high', 'Form inputs without labels',
      `${inputsWithoutLabels.length} form inputs lack associated labels`,
      'Add <label> elements or aria-label attributes to all form inputs');
  }

  auditResults.categories.accessibility.tests = tests;
  const passedTests = tests.filter(t => t.passed).length;
  auditResults.categories.accessibility.score = Math.round((passedTests / tests.length) * 100);

  console.log(`✅ Accessibility score: ${auditResults.categories.accessibility.score}/100`);
}

// Performance Audit
async function auditPerformance(page) {
  console.log('⚡ Running Performance Audit...');

  // Capture performance metrics
  const metrics = await page.evaluate(() => {
    const perfData = window.performance.getEntriesByType('navigation')[0];
    const paintEntries = performance.getEntriesByType('paint');

    return {
      domContentLoaded: perfData?.domContentLoadedEventEnd - perfData?.domContentLoadedEventStart,
      loadComplete: perfData?.loadEventEnd - perfData?.loadEventStart,
      firstPaint: paintEntries.find(entry => entry.name === 'first-paint')?.startTime,
      firstContentfulPaint: paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime,
      domInteractive: perfData?.domInteractive,
      resourceCount: performance.getEntriesByType('resource').length
    };
  });

  // Get Core Web Vitals (approximation)
  const webVitals = await page.evaluate(() => {
    return new Promise((resolve) => {
      const vitals = {};

      // LCP - Largest Contentful Paint
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        vitals.lcp = entries[entries.length - 1].startTime;
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // FID approximation using first input
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (entries.length > 0) {
          vitals.fid = entries[0].processingStart - entries[0].startTime;
        }
      }).observe({ entryTypes: ['first-input'] });

      // CLS - Cumulative Layout Shift
      let clsValue = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        vitals.cls = clsValue;
      }).observe({ entryTypes: ['layout-shift'] });

      setTimeout(() => resolve(vitals), 3000);
    });
  });

  auditResults.categories.performance.metrics = {
    ...metrics,
    ...webVitals
  };

  // Evaluate metrics
  const issues = [];

  if (webVitals.lcp > 2500) {
    addIssue('performance', 'high', 'Slow Largest Contentful Paint (LCP)',
      `LCP is ${Math.round(webVitals.lcp)}ms (should be < 2500ms)`,
      'Optimize images, reduce server response time, implement lazy loading, use CDN');
  }

  if (webVitals.fid > 100) {
    addIssue('performance', 'medium', 'High First Input Delay (FID)',
      `FID is ${Math.round(webVitals.fid)}ms (should be < 100ms)`,
      'Reduce JavaScript execution time, split code chunks, defer non-critical JS');
  }

  if (webVitals.cls > 0.1) {
    addIssue('performance', 'high', 'High Cumulative Layout Shift (CLS)',
      `CLS is ${webVitals.cls.toFixed(3)} (should be < 0.1)`,
      'Set dimensions on images/videos, avoid inserting content above existing content, use transform animations');
  }

  if (metrics.firstContentfulPaint > 1800) {
    addIssue('performance', 'medium', 'Slow First Contentful Paint',
      `FCP is ${Math.round(metrics.firstContentfulPaint)}ms (should be < 1800ms)`,
      'Optimize server response, reduce render-blocking resources, use HTTP/2');
  }

  // Check resource sizes
  const resources = await page.evaluate(() => {
    return performance.getEntriesByType('resource').map(r => ({
      name: r.name,
      type: r.initiatorType,
      size: r.transferSize,
      duration: r.duration
    }));
  });

  const largeResources = resources.filter(r => r.size > 500000);
  if (largeResources.length > 0) {
    addIssue('performance', 'medium', 'Large resources detected',
      `Found ${largeResources.length} resources larger than 500KB`,
      'Compress images, use modern formats (WebP, AVIF), implement lazy loading, minify CSS/JS');
  }

  // Check for lazy loading
  const imagesCount = await page.$$eval('img', imgs => imgs.length);
  const lazyImages = await page.$$eval('img[loading="lazy"]', imgs => imgs.length);

  if (imagesCount > 5 && lazyImages === 0) {
    addIssue('performance', 'medium', 'No lazy loading on images',
      `${imagesCount} images without lazy loading`,
      'Add loading="lazy" attribute to below-the-fold images');
  }

  const score = 100 - (auditResults.categories.performance.issues.length * 15);
  auditResults.categories.performance.score = Math.max(0, Math.min(100, score));

  console.log(`✅ Performance score: ${auditResults.categories.performance.score}/100`);
}

// Mobile Usability Audit
async function auditMobileUsability(browser) {
  console.log('📱 Running Mobile Usability Audit...');

  const viewports = [
    { name: 'Mobile Portrait', width: 375, height: 667, device: 'iPhone SE' },
    { name: 'Mobile Landscape', width: 667, height: 375, device: 'iPhone SE Landscape' },
    { name: 'Tablet Portrait', width: 768, height: 1024, device: 'iPad' },
    { name: 'Desktop', width: 1920, height: 1080, device: 'Desktop' }
  ];

  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      userAgent: viewport.width < 768 ? devices['iPhone 12'].userAgent : undefined
    });

    const page = await context.newPage();
    await page.goto(SITE_URL, { waitUntil: 'networkidle' });

    // Check touch target sizes
    const touchTargets = await page.evaluate(() => {
      const interactive = document.querySelectorAll('button, a, input, select, textarea, [role="button"]');
      const results = [];

      for (const el of interactive) {
        const rect = el.getBoundingClientRect();
        const size = Math.min(rect.width, rect.height);
        if (size > 0 && size < 44) {
          results.push({
            tag: el.tagName,
            text: el.textContent?.trim().substring(0, 30) || el.getAttribute('aria-label'),
            width: Math.round(rect.width),
            height: Math.round(rect.height)
          });
        }
      }

      return results.slice(0, 10);
    });

    if (viewport.width < 768 && touchTargets.length > 0) {
      addIssue('mobileUsability', 'high', `Small touch targets on ${viewport.name}`,
        `Found ${touchTargets.length} touch targets smaller than 44x44px`,
        'Increase tap target size to at least 44x44px for better mobile usability');
    }

    // Check horizontal scrolling
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });

    if (hasHorizontalScroll) {
      const screenshot = await takeScreenshot(page, `horizontal_scroll_${viewport.name}`);
      addIssue('mobileUsability', 'critical', `Horizontal scrolling on ${viewport.name}`,
        'Content extends beyond viewport width',
        'Use responsive CSS (max-width: 100%, flexbox, grid) to prevent horizontal scroll',
        screenshot);
    }

    // Check text readability
    const textIssues = await page.evaluate(() => {
      const issues = [];
      const textElements = document.querySelectorAll('p, span, a, li');

      for (const el of textElements) {
        const styles = window.getComputedStyle(el);
        const fontSize = parseFloat(styles.fontSize);

        if (fontSize < 16 && el.textContent.trim().length > 10) {
          issues.push({
            tag: el.tagName,
            fontSize: fontSize,
            text: el.textContent.trim().substring(0, 30)
          });
        }
      }

      return issues.slice(0, 5);
    });

    if (viewport.width < 768 && textIssues.length > 0) {
      addIssue('mobileUsability', 'medium', `Small text on ${viewport.name}`,
        `Found ${textIssues.length} elements with text smaller than 16px`,
        'Use minimum 16px font size for body text on mobile devices');
    }

    auditResults.categories.mobileUsability.viewports.push({
      name: viewport.name,
      width: viewport.width,
      height: viewport.height,
      touchTargetIssues: touchTargets.length,
      hasHorizontalScroll,
      smallTextIssues: textIssues.length
    });

    await context.close();
  }

  const totalIssues = auditResults.categories.mobileUsability.issues.length;
  auditResults.categories.mobileUsability.score = Math.max(0, 100 - (totalIssues * 15));

  console.log(`✅ Mobile Usability score: ${auditResults.categories.mobileUsability.score}/100`);
}

// Interactivity Audit
async function auditInteractivity(page) {
  console.log('🎯 Running Interactivity Audit...');

  const tests = [];

  // Check for loading states
  const hasLoadingStates = await page.evaluate(() => {
    const loadingElements = document.querySelectorAll('[aria-busy="true"], .loading, .spinner, [role="status"]');
    return loadingElements.length > 0;
  });

  tests.push({
    name: 'Loading states present',
    passed: hasLoadingStates,
    value: hasLoadingStates ? 'Yes' : 'No'
  });

  if (!hasLoadingStates) {
    addIssue('interactivity', 'medium', 'No loading states detected',
      'No visual loading indicators found on the page',
      'Add loading spinners or skeleton screens for async operations');
  }

  // Check hover states on interactive elements
  const hoverStates = await page.evaluate(() => {
    const buttons = document.querySelectorAll('button, a');
    let withHover = 0;

    for (const btn of buttons) {
      btn.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
      const styles = window.getComputedStyle(btn);

      if (styles.cursor === 'pointer' || styles.opacity !== '1') {
        withHover++;
      }
    }

    return {
      total: buttons.length,
      withHover
    };
  });

  tests.push({
    name: 'Interactive elements with hover states',
    passed: hoverStates.withHover > 0,
    value: `${hoverStates.withHover}/${hoverStates.total}`
  });

  // Check for error handling in forms
  const forms = await page.$$('form');
  if (forms.length > 0) {
    const formValidation = await page.evaluate(() => {
      const forms = document.querySelectorAll('form');
      const results = [];

      for (const form of forms) {
        const requiredInputs = form.querySelectorAll('[required]');
        const errorMessages = form.querySelectorAll('[role="alert"], .error, .invalid');

        results.push({
          hasRequiredFields: requiredInputs.length > 0,
          hasErrorMessages: errorMessages.length > 0
        });
      }

      return results;
    });

    const formsWithValidation = formValidation.filter(f => f.hasRequiredFields).length;
    tests.push({
      name: 'Form validation present',
      passed: formsWithValidation > 0,
      value: `${formsWithValidation}/${forms.length}`
    });

    if (formsWithValidation === 0 && forms.length > 0) {
      addIssue('interactivity', 'medium', 'Forms without validation',
        'Forms do not have visible validation or error messages',
        'Add required attributes and error message elements with role="alert"');
    }
  }

  // Check focus styles
  await page.keyboard.press('Tab');
  const focusStyle = await page.evaluate(() => {
    const el = document.activeElement;
    const styles = window.getComputedStyle(el);
    return {
      outline: styles.outline,
      boxShadow: styles.boxShadow,
      border: styles.border
    };
  });

  const hasFocusStyle = focusStyle.outline !== 'none' || focusStyle.boxShadow !== 'none';
  tests.push({
    name: 'Visible focus indicators',
    passed: hasFocusStyle,
    value: hasFocusStyle ? 'Yes' : 'No'
  });

  if (!hasFocusStyle) {
    addIssue('interactivity', 'high', 'No visible focus indicators',
      'Focused elements do not have visible focus styles',
      'Add :focus styles with outline or box-shadow to all interactive elements');
  }

  auditResults.categories.interactivity.tests = tests;
  const passedTests = tests.filter(t => t.passed).length;
  auditResults.categories.interactivity.score = Math.round((passedTests / tests.length) * 100);

  console.log(`✅ Interactivity score: ${auditResults.categories.interactivity.score}/100`);
}

// Navigation Audit
async function auditNavigation(page) {
  console.log('🧭 Running Navigation Audit...');

  const tests = [];

  // Check for main navigation
  const navigation = await page.evaluate(() => {
    const nav = document.querySelector('nav, [role="navigation"]');
    const menuItems = nav ? nav.querySelectorAll('a, button') : [];

    return {
      hasNav: !!nav,
      itemCount: menuItems.length,
      hasLogo: !!document.querySelector('nav img, [role="navigation"] img, header img'),
      hasSearch: !!document.querySelector('input[type="search"], [role="search"]')
    };
  });

  tests.push({
    name: 'Main navigation present',
    passed: navigation.hasNav,
    value: navigation.hasNav ? `${navigation.itemCount} items` : 'No'
  });

  if (!navigation.hasNav) {
    addIssue('navigation', 'critical', 'No main navigation found',
      'Page does not have a <nav> or [role="navigation"] element',
      'Add a <nav> element with main navigation links');
  }

  tests.push({
    name: 'Logo/branding present',
    passed: navigation.hasLogo,
    value: navigation.hasLogo ? 'Yes' : 'No'
  });

  // Check for breadcrumbs
  const breadcrumbs = await page.evaluate(() => {
    const bc = document.querySelector('[aria-label*="breadcrumb"], .breadcrumb, nav[aria-label="Breadcrumb"]');
    return !!bc;
  });

  tests.push({
    name: 'Breadcrumb navigation',
    passed: breadcrumbs,
    value: breadcrumbs ? 'Yes' : 'No'
  });

  // Check links
  const links = await page.evaluate(() => {
    const allLinks = document.querySelectorAll('a[href]');
    const results = {
      total: allLinks.length,
      external: 0,
      withoutText: 0,
      broken: []
    };

    for (const link of allLinks) {
      const href = link.href;
      const text = link.textContent.trim();
      const ariaLabel = link.getAttribute('aria-label');

      if (href.startsWith('http') && !href.includes(window.location.hostname)) {
        results.external++;
      }

      if (!text && !ariaLabel) {
        results.withoutText++;
      }
    }

    return results;
  });

  tests.push({
    name: 'Links with accessible text',
    passed: links.withoutText === 0,
    value: `${links.total - links.withoutText}/${links.total}`
  });

  if (links.withoutText > 0) {
    addIssue('navigation', 'high', 'Links without accessible text',
      `${links.withoutText} links have no visible text or aria-label`,
      'Add descriptive text or aria-label to all links');
  }

  // Check for skip link
  const skipLink = await page.evaluate(() => {
    const skip = document.querySelector('a[href^="#main"], a[href^="#content"]');
    return !!skip;
  });

  tests.push({
    name: 'Skip to main content link',
    passed: skipLink,
    value: skipLink ? 'Yes' : 'No'
  });

  if (!skipLink) {
    addIssue('navigation', 'medium', 'No skip link found',
      'Page lacks a "skip to main content" link for keyboard users',
      'Add a skip link as the first focusable element: <a href="#main">Skip to main content</a>');
  }

  auditResults.categories.navigation.tests = tests;
  const passedTests = tests.filter(t => t.passed).length;
  auditResults.categories.navigation.score = Math.round((passedTests / tests.length) * 100);

  console.log(`✅ Navigation score: ${auditResults.categories.navigation.score}/100`);
}

// Generate prioritized fixes
function generatePrioritizedFixes() {
  console.log('📋 Generating prioritized fixes...');

  const allIssues = [];

  for (const [category, data] of Object.entries(auditResults.categories)) {
    for (const issue of data.issues) {
      allIssues.push({
        ...issue,
        category
      });
    }
  }

  // Priority scoring
  const severityScore = { critical: 4, high: 3, medium: 2, low: 1 };
  const categoryImpact = {
    accessibility: 1.5,
    performance: 1.3,
    mobileUsability: 1.2,
    interactivity: 1.1,
    navigation: 1.0
  };

  allIssues.forEach(issue => {
    issue.impactScore = severityScore[issue.severity] * categoryImpact[issue.category];
    issue.effort = issue.severity === 'critical' ? 'high' :
                   issue.severity === 'high' ? 'medium' : 'low';
  });

  // Sort by impact score
  allIssues.sort((a, b) => b.impactScore - a.impactScore);

  auditResults.prioritizedFixes = allIssues.map(issue => ({
    priority: issue.impactScore,
    category: issue.category,
    severity: issue.severity,
    title: issue.title,
    description: issue.description,
    suggestion: issue.suggestion,
    effort: issue.effort,
    userImpact: issue.severity === 'critical' || issue.severity === 'high' ? 'high' :
                issue.severity === 'medium' ? 'medium' : 'low'
  }));
}

// Calculate overall score
function calculateOverallScore() {
  const weights = {
    accessibility: 0.30,
    performance: 0.25,
    mobileUsability: 0.20,
    interactivity: 0.15,
    navigation: 0.10
  };

  let totalScore = 0;
  for (const [category, weight] of Object.entries(weights)) {
    totalScore += auditResults.categories[category].score * weight;
  }

  auditResults.overallScore = Math.round(totalScore);
  console.log(`\n🎯 Overall UX Score: ${auditResults.overallScore}/100\n`);
}

// Main audit function
async function runAudit() {
  console.log('🚀 Starting comprehensive UX audit...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  try {
    await page.goto(SITE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    console.log(`✅ Loaded ${SITE_URL}\n`);

    // Run all audits
    await auditAccessibility(page);
    await auditPerformance(page);
    await auditInteractivity(page);
    await auditNavigation(page);
    await context.close();

    await auditMobileUsability(browser);

    // Generate reports
    generatePrioritizedFixes();
    calculateOverallScore();

    // Save JSON report
    const jsonPath = path.join(__dirname, '..', 'claudedocs', 'ux_audit_report_playwright.json');
    await fs.writeFile(jsonPath, JSON.stringify(auditResults, null, 2));
    console.log(`✅ JSON report saved to: ${jsonPath}`);

    // Generate markdown report
    const mdReport = generateMarkdownReport();
    const mdPath = path.join(__dirname, '..', 'claudedocs', 'ux_audit_report_playwright.md');
    await fs.writeFile(mdPath, mdReport);
    console.log(`✅ Markdown report saved to: ${mdPath}`);

  } catch (error) {
    console.error('❌ Audit failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

// Generate markdown report
function generateMarkdownReport() {
  const { overallScore, categories, prioritizedFixes } = auditResults;

  let md = `# UX Audit Report - Roteiros de Dispensação\n\n`;
  md += `**Site**: ${SITE_URL}\n`;
  md += `**Audit Date**: ${new Date(auditResults.timestamp).toLocaleString('pt-BR')}\n`;
  md += `**Overall Score**: ${overallScore}/100\n\n`;

  // Score breakdown
  md += `## Score Breakdown\n\n`;
  md += `| Category | Score | Status |\n`;
  md += `|----------|-------|--------|\n`;

  for (const [category, data] of Object.entries(categories)) {
    const emoji = data.score >= 80 ? '✅' : data.score >= 60 ? '⚠️' : '❌';
    const label = category.replace(/([A-Z])/g, ' $1').trim();
    md += `| ${label} | ${data.score}/100 | ${emoji} |\n`;
  }

  md += `\n## Category Details\n\n`;

  // Accessibility
  md += `### 🔍 Accessibility (WCAG 2.1 AA)\n\n`;
  md += `**Score**: ${categories.accessibility.score}/100\n\n`;
  if (categories.accessibility.issues.length > 0) {
    md += `**Issues Found**:\n\n`;
    categories.accessibility.issues.forEach(issue => {
      md += `- **[${issue.severity.toUpperCase()}]** ${issue.title}\n`;
      md += `  - ${issue.description}\n`;
      md += `  - *Suggestion*: ${issue.suggestion}\n\n`;
    });
  }

  // Performance
  md += `### ⚡ Performance\n\n`;
  md += `**Score**: ${categories.performance.score}/100\n\n`;
  md += `**Core Web Vitals**:\n`;
  md += `- LCP: ${categories.performance.metrics.lcp ? Math.round(categories.performance.metrics.lcp) + 'ms' : 'N/A'}\n`;
  md += `- FID: ${categories.performance.metrics.fid ? Math.round(categories.performance.metrics.fid) + 'ms' : 'N/A'}\n`;
  md += `- CLS: ${categories.performance.metrics.cls ? categories.performance.metrics.cls.toFixed(3) : 'N/A'}\n\n`;

  if (categories.performance.issues.length > 0) {
    md += `**Issues Found**:\n\n`;
    categories.performance.issues.forEach(issue => {
      md += `- **[${issue.severity.toUpperCase()}]** ${issue.title}\n`;
      md += `  - ${issue.description}\n`;
      md += `  - *Suggestion*: ${issue.suggestion}\n\n`;
    });
  }

  // Mobile Usability
  md += `### 📱 Mobile Usability\n\n`;
  md += `**Score**: ${categories.mobileUsability.score}/100\n\n`;

  if (categories.mobileUsability.viewports.length > 0) {
    md += `**Viewport Testing**:\n\n`;
    categories.mobileUsability.viewports.forEach(vp => {
      md += `- **${vp.name}** (${vp.width}x${vp.height})\n`;
      md += `  - Touch target issues: ${vp.touchTargetIssues}\n`;
      md += `  - Horizontal scroll: ${vp.hasHorizontalScroll ? '❌ Yes' : '✅ No'}\n`;
      md += `  - Small text issues: ${vp.smallTextIssues}\n\n`;
    });
  }

  if (categories.mobileUsability.issues.length > 0) {
    md += `**Issues Found**:\n\n`;
    categories.mobileUsability.issues.forEach(issue => {
      md += `- **[${issue.severity.toUpperCase()}]** ${issue.title}\n`;
      md += `  - ${issue.description}\n`;
      md += `  - *Suggestion*: ${issue.suggestion}\n\n`;
    });
  }

  // Interactivity
  md += `### 🎯 Interactivity\n\n`;
  md += `**Score**: ${categories.interactivity.score}/100\n\n`;

  if (categories.interactivity.issues.length > 0) {
    md += `**Issues Found**:\n\n`;
    categories.interactivity.issues.forEach(issue => {
      md += `- **[${issue.severity.toUpperCase()}]** ${issue.title}\n`;
      md += `  - ${issue.description}\n`;
      md += `  - *Suggestion*: ${issue.suggestion}\n\n`;
    });
  }

  // Navigation
  md += `### 🧭 Navigation\n\n`;
  md += `**Score**: ${categories.navigation.score}/100\n\n`;

  if (categories.navigation.issues.length > 0) {
    md += `**Issues Found**:\n\n`;
    categories.navigation.issues.forEach(issue => {
      md += `- **[${issue.severity.toUpperCase()}]** ${issue.title}\n`;
      md += `  - ${issue.description}\n`;
      md += `  - *Suggestion*: ${issue.suggestion}\n\n`;
    });
  }

  // Prioritized Fixes
  md += `## 📋 Prioritized Action Items\n\n`;
  md += `Total issues found: ${prioritizedFixes.length}\n\n`;

  if (prioritizedFixes.length > 0) {
    md += `| Priority | Category | Severity | Issue | User Impact | Effort |\n`;
    md += `|----------|----------|----------|-------|-------------|--------|\n`;

    prioritizedFixes.slice(0, 20).forEach((fix, index) => {
      const categoryLabel = fix.category.replace(/([A-Z])/g, ' $1').trim();
      md += `| ${index + 1} | ${categoryLabel} | ${fix.severity} | ${fix.title} | ${fix.userImpact} | ${fix.effort} |\n`;
    });

    md += `\n### Top 5 Critical Fixes\n\n`;

    prioritizedFixes.slice(0, 5).forEach((fix, index) => {
      md += `#### ${index + 1}. ${fix.title}\n\n`;
      md += `- **Category**: ${fix.category}\n`;
      md += `- **Severity**: ${fix.severity}\n`;
      md += `- **User Impact**: ${fix.userImpact}\n`;
      md += `- **Implementation Effort**: ${fix.effort}\n`;
      md += `- **Description**: ${fix.description}\n`;
      md += `- **Suggested Fix**: ${fix.suggestion}\n\n`;
    });
  }

  // Best Practices Comparison
  md += `## 🎯 Best Practices Comparison\n\n`;
  md += `### Accessibility\n`;
  md += `- ✅ Should have: Semantic HTML, ARIA labels, keyboard navigation\n`;
  md += `- ✅ Should have: 4.5:1 contrast ratio for text\n`;
  md += `- ✅ Should have: Alt text for all images\n`;
  md += `- ✅ Should have: Form labels and error messages\n\n`;

  md += `### Performance\n`;
  md += `- ✅ Should have: LCP < 2.5s, FID < 100ms, CLS < 0.1\n`;
  md += `- ✅ Should have: Image optimization and lazy loading\n`;
  md += `- ✅ Should have: Minified CSS/JS, code splitting\n`;
  md += `- ✅ Should have: CDN usage for static assets\n\n`;

  md += `### Mobile\n`;
  md += `- ✅ Should have: Touch targets ≥ 44x44px\n`;
  md += `- ✅ Should have: No horizontal scrolling\n`;
  md += `- ✅ Should have: Minimum 16px font size\n`;
  md += `- ✅ Should have: Responsive design for all viewports\n\n`;

  md += `### Interactivity\n`;
  md += `- ✅ Should have: Visible focus indicators\n`;
  md += `- ✅ Should have: Loading states for async operations\n`;
  md += `- ✅ Should have: Hover and active states on interactive elements\n`;
  md += `- ✅ Should have: Form validation and error handling\n\n`;

  md += `---\n\n`;
  md += `*Generated by Playwright UX Audit Tool*\n`;

  return md;
}

// Run the audit
runAudit().catch(console.error);
