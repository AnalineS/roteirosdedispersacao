# Critical: Playwright Test Failures - Network Idle Timeout on Staging

## Problem Summary

All 8 Playwright tests for staging medical chat validation are failing with timeout errors. Tests cannot proceed beyond initial page load due to `networkidle` state never being reached within 30-second timeout.

**Status**: CRITICAL - Blocks production sync from staging environment
**Date Identified**: 2025-10-04
**Environment**: Staging (Google Cloud Run)
**Test Framework**: Playwright (Node.js)

## Test Failure Evidence

### Error Pattern
```
Test timeout of 30000ms exceeded while running beforeEach hook
Error at: page.waitForLoadState('networkidle')
```

### Test Execution Results
- Total tests: 8
- Failed: 8 (100%)
- Passed: 0 (0%)
- Timeout location: Line 390 and 784 in ux_audit_playwright.js

### Site Response Verification
```bash
# Site IS responding correctly
curl -I https://hml-frontend-4f2gjf6cua-uc.a.run.app/
HTTP/1.1 200 OK
Content-Length: 104127
Time: 0.599s

# Site loads successfully in browser
# Manual verification: PASSED
```

## Root Cause Analysis

### Primary Issue: Next.js Streaming Architecture
The staging environment runs **Next.js 15.5.4 with App Router**, which uses:
1. **React Server Components (RSC)** with streaming responses
2. **Incremental hydration** for client-side interactivity
3. **Continuous background requests** for:
   - RSC payload updates (`vary: rsc, next-router-state-tree`)
   - Prefetch operations (`next-router-prefetch`)
   - Cache revalidation (`x-nextjs-stale-time: 300`)

**Result**: Network never enters "idle" state due to:
- Prefetch requests for route segments
- Background cache validation pings
- WebSocket connections for hot reload (if dev mode)
- Analytics/monitoring beacons

### Secondary Issues

1. **Cloud Run Cold Starts**: Initial container spin-up can take 5-15 seconds
2. **Cache Headers**: `x-nextjs-cache: HIT` indicates caching working, but prefetch continues
3. **Prerender Flag**: `x-nextjs-prerender: 1` shows static generation, but client hydration runs after
4. **Test Script URL Mismatch**: Script hardcodes wrong URL at line 5

### Framework-Specific Behavior

Next.js 15 App Router maintains persistent network activity for:
```
vary: rsc, next-router-state-tree, next-router-prefetch,
      next-router-segment-prefetch
```

This architecture **intentionally prevents** `networkidle` state to enable instant navigation.

## Recommended Fixes (Priority Ordered)

### Option 1: Change Load Detection Strategy (RECOMMENDED)
**Impact**: Immediate fix, aligns with Next.js architecture
**Effort**: Low (15 minutes)
**Reliability**: High

```javascript
// Replace:
await page.goto(SITE_URL, { waitUntil: 'networkidle' });

// With:
await page.goto(SITE_URL, { waitUntil: 'domcontentloaded' });
// Then wait for hydration markers
await page.waitForLoadState('load');
await page.waitForSelector('body.hydrated', { timeout: 10000 }).catch(() => {});
```

**Rationale**:
- `domcontentloaded`: DOM ready for interaction (appropriate for SSR/SSG)
- `load`: All synchronous resources loaded
- Hydration check: Optional verification that React is interactive

### Option 2: Increase Timeout with Hybrid Strategy
**Impact**: Medium fix, handles Cloud Run cold starts
**Effort**: Low (10 minutes)
**Reliability**: Medium

```javascript
await page.goto(SITE_URL, {
  waitUntil: 'load',  // Not networkidle
  timeout: 60000      // 60s for cold starts
});

// Add explicit ready checks
await page.waitForFunction(() => {
  return document.readyState === 'complete' &&
         window.__NEXT_DATA__ !== undefined;
}, { timeout: 15000 });
```

**Rationale**:
- Accommodates Cloud Run scaling delays
- Verifies Next.js client-side payload loaded
- Fails fast if fundamental issue exists

### Option 3: Smart Wait with Network Quieting
**Impact**: Advanced solution, most accurate
**Effort**: Medium (30 minutes)
**Reliability**: High

```javascript
await page.goto(SITE_URL, {
  waitUntil: 'commit',  // Navigation committed
  timeout: 60000
});

// Wait for "mostly idle" (2 concurrent requests or fewer)
await page.waitForLoadState('load');

// Custom network quieting
let networkRequests = 0;
page.on('request', () => networkRequests++);
page.on('response', () => networkRequests--);
page.on('requestfailed', () => networkRequests--);

await page.waitForFunction(() => networkRequests <= 2, {
  timeout: 20000,
  polling: 500
});
```

**Rationale**:
- Allows background prefetch (2-3 concurrent requests normal)
- Detects pathological network loops
- Balances speed with stability

### Option 4: Environment-Specific Configuration
**Impact**: Production-grade solution
**Effort**: Medium (45 minutes)
**Reliability**: Very High

```javascript
const STAGING_URL = 'https://hml-frontend-4f2gjf6cua-uc.a.run.app/';
const FIREBASE_URL = 'https://hml-roteiros-de-dispensacao.web.app/';

const config = {
  cloudRun: {
    waitUntil: 'load',
    timeout: 60000,
    waitForNetworkIdle: false
  },
  firebase: {
    waitUntil: 'networkidle',
    timeout: 30000,
    waitForNetworkIdle: true
  }
};

const envConfig = SITE_URL.includes('run.app')
  ? config.cloudRun
  : config.firebase;

await page.goto(SITE_URL, envConfig);
```

**Rationale**:
- Accounts for deployment platform differences
- Maintains stricter checks for static hosts
- Configurable per environment

## Implementation Priority

**Immediate (Today)**:
1. Fix URL at line 5: Update to staging URL
2. Implement Option 1 (domcontentloaded strategy)
3. Run validation tests

**Short-term (This Week)**:
1. Implement Option 3 (network quieting logic)
2. Add environment detection (Option 4)
3. Document expected network behavior per platform

**Long-term (Next Sprint)**:
1. Create separate test profiles for Cloud Run vs Firebase
2. Add performance regression detection
3. Implement custom Playwright fixtures for Next.js 15

## Workaround Test Script

Create `scripts/ux_audit_staging_workaround.js`:

```javascript
const { chromium } = require('playwright');

const STAGING_URL = 'https://hml-frontend-4f2gjf6cua-uc.a.run.app/';

async function quickValidation() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('Loading staging site...');

    // Use domcontentloaded instead of networkidle
    await page.goto(STAGING_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    console.log('✓ Page loaded');

    // Wait for Next.js hydration
    await page.waitForLoadState('load');
    console.log('✓ Resources loaded');

    // Verify interactive
    await page.waitForFunction(() => {
      return document.readyState === 'complete';
    }, { timeout: 10000 });

    console.log('✓ Page interactive');

    // Quick accessibility check
    const title = await page.title();
    const h1 = await page.textContent('h1').catch(() => 'NOT FOUND');

    console.log(`\nTitle: ${title}`);
    console.log(`H1: ${h1}`);

    console.log('\n✅ VALIDATION PASSED');

  } catch (error) {
    console.error('❌ VALIDATION FAILED:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

quickValidation().catch(console.error);
```

**Run**: `node scripts/ux_audit_staging_workaround.js`

## Technical Context

### Staging Environment
- Platform: Google Cloud Run (serverless containers)
- Framework: Next.js 15.5.4 + React 19
- Architecture: App Router with RSC streaming
- Recent PR: #217 (dompurify 3.2.7, jspdf 3.0.3, sharp 0.34.4)

### Network Behavior Analysis
```http
HTTP Headers Indicating Continuous Activity:
- vary: rsc, next-router-state-tree, next-router-prefetch
  → Signals ongoing prefetch operations

- x-nextjs-stale-time: 300
  → Cache revalidation every 5 minutes

- x-nextjs-prerender: 1
  → Static shell served, but client-side hydration follows
```

### Why 'networkidle' Fails

Playwright's `networkidle` definition:
> "No more than 2 network connections for at least 500ms"

Next.js 15 App Router behavior:
1. Initial HTML served (prerendered)
2. RSC payload streamed for dynamic content
3. Client-side hydration initializes
4. Router prefetches all visible links (3-5 concurrent)
5. Background revalidation checks (every 5 minutes)

**Conflict**: Step 4 maintains 3-5 persistent connections, exceeding Playwright's threshold.

## Success Metrics

Tests pass when:
1. Page loads within timeout (60s for cold start)
2. DOM is interactive (user can click/type)
3. Critical content visible (H1, navigation, chat interface)
4. No JavaScript errors in console

Tests **do NOT need**:
- Zero network activity (impossible with Next.js 15)
- All prefetch completed (ongoing by design)
- Service worker ready (optional)

## References

- Playwright Load States: https://playwright.dev/docs/navigations#hydration
- Next.js App Router Prefetching: https://nextjs.org/docs/app/building-your-application/routing/linking-and-navigating#2-prefetching
- Cloud Run Cold Starts: https://cloud.google.com/run/docs/tips/general#optimize_cold_starts

## Next Steps

1. Create GitHub issue from this document
2. Implement Option 1 fix immediately
3. Validate fix with 10 test runs
4. Update test documentation with Next.js-specific guidance
5. Add CI/CD check for timeout configuration

---

**Document Status**: Ready for GitHub Issue Creation
**Priority**: HIGH
**Labels**: bug, qa-validation, staging, playwright, timeout, nextjs
**Assignee**: QA Engineering Team
**Milestone**: Production Sync Unblocking
