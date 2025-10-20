const { chromium, devices } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

// CORRECTED STAGING URL
const SITE_URL = 'https://hml-frontend-4f2gjf6cua-uc.a.run.app/';
const SCREENSHOTS_DIR = path.join(__dirname, '..', 'claudedocs', 'audit_screenshots');

// Audit results structure
const auditResults = {
  timestamp: new Date().toISOString(),
  url: SITE_URL,
  overallScore: 0,
  loadStrategy: 'domcontentloaded-with-hydration-check',
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

// IMPROVED PAGE LOAD FUNCTION FOR NEXT.JS 15
async function loadPageWithNextJSSupport(page, url) {
  console.log(`Loading ${url}...`);

  try {
    // Strategy 1: Use domcontentloaded instead of networkidle
    // This works with Next.js streaming and prefetch behavior
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 60000 // Increased for Cloud Run cold starts
    });

    console.log('✓ DOM content loaded');

    // Strategy 2: Wait for Next.js hydration markers
    await page.waitForLoadState('load', { timeout: 15000 }).catch(() => {
      console.warn('⚠ Load state timeout - continuing (expected for streaming SSR)');
    });

    console.log('✓ Initial resources loaded');

    // Strategy 3: Verify page is interactive
    await page.waitForFunction(() => {
      return document.readyState === 'complete' &&
             document.body !== null &&
             (window.__NEXT_DATA__ !== undefined || document.querySelector('[data-nextjs-container]'));
    }, { timeout: 10000 }).catch(() => {
      console.warn('⚠ Next.js hydration check timeout - continuing');
    });

    console.log('✓ Page interactive and hydrated');

    // Strategy 4: Wait for network to "mostly quiet" (allows 2-3 concurrent requests)
    // This accommodates Next.js prefetch behavior
    await page.waitForTimeout(1000); // Brief settle period

    console.log('✓ Page fully loaded\n');

  } catch (error) {
    console.error(`❌ Failed to load ${url}:`, error.message);
    throw error;
  }
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

  auditResults.categories.performance.metrics = metrics;

  // Performance scoring based on metrics
  let score = 100;

  if (metrics.firstContentfulPaint > 1800) {
    score -= 15;
    addIssue('performance', 'medium', 'Slow First Contentful Paint',
      `FCP is ${Math.round(metrics.firstContentfulPaint)}ms (should be < 1800ms)`,
      'Optimize server response, reduce render-blocking resources, use HTTP/2');
  }

  // Check for lazy loading
  const imagesCount = await page.$$eval('img', imgs => imgs.length);
  const lazyImages = await page.$$eval('img[loading="lazy"]', imgs => imgs.length);

  if (imagesCount > 5 && lazyImages === 0) {
    score -= 10;
    addIssue('performance', 'medium', 'No lazy loading on images',
      `${imagesCount} images without lazy loading`,
      'Add loading="lazy" attribute to below-the-fold images');
  }

  auditResults.categories.performance.score = Math.max(0, score);
  console.log(`✅ Performance score: ${auditResults.categories.performance.score}/100`);
}

// Mobile Usability Audit
async function auditMobileUsability(browser) {
  console.log('📱 Running Mobile Usability Audit...');

  const viewports = [
    { name: 'Mobile Portrait', width: 375, height: 667, device: 'iPhone SE' },
    { name: 'Tablet Portrait', width: 768, height: 1024, device: 'iPad' }
  ];

  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      userAgent: viewport.width < 768 ? devices['iPhone 12'].userAgent : undefined
    });

    const page = await context.newPage();
    await loadPageWithNextJSSupport(page, SITE_URL);

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

    auditResults.categories.mobileUsability.viewports.push({
      name: viewport.name,
      width: viewport.width,
      height: viewport.height,
      touchTargetIssues: touchTargets.length,
      hasHorizontalScroll
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
      hasLogo: !!document.querySelector('nav img, [role="navigation"] img, header img')
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

  // Check links
  const links = await page.evaluate(() => {
    const allLinks = document.querySelectorAll('a[href]');
    const results = {
      total: allLinks.length,
      withoutText: 0
    };

    for (const link of allLinks) {
      const text = link.textContent.trim();
      const ariaLabel = link.getAttribute('aria-label');

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
  console.log('🚀 Starting UX audit with Next.js 15 compatible load strategy...\n');
  console.log(`Target: ${SITE_URL}\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  try {
    await loadPageWithNextJSSupport(page, SITE_URL);

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
    const jsonPath = path.join(__dirname, '..', 'claudedocs', 'ux_audit_staging_fixed.json');
    await fs.writeFile(jsonPath, JSON.stringify(auditResults, null, 2));
    console.log(`✅ JSON report saved to: ${jsonPath}`);

    // Success summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ AUDIT COMPLETED SUCCESSFULLY');
    console.log('='.repeat(60));
    console.log(`Load Strategy: ${auditResults.loadStrategy}`);
    console.log(`Overall Score: ${auditResults.overallScore}/100`);
    console.log(`Issues Found: ${auditResults.prioritizedFixes.length}`);
    console.log('='.repeat(60) + '\n');

  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ AUDIT FAILED');
    console.error('='.repeat(60));
    console.error('Error:', error.message);
    console.error('='.repeat(60) + '\n');
    throw error;
  } finally {
    await browser.close();
  }
}

// Run the audit
runAudit().catch(console.error);
