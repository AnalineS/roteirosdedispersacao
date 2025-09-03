'use client';

import React, { Suspense } from 'react';
import { LazyOnScroll } from '@/components/optimization/LazyComponent';

// Lazy load analytics components
const CognitiveLoadAuditor = React.lazy(() => 
  import('@/components/analytics/CognitiveLoadAuditor')
    .then(mod => ({ default: mod.CognitiveLoadAuditor }))
    .catch(() => ({ default: () => <div /> }))
);

const MobileUXAuditor = React.lazy(() => 
  import('@/components/analytics/MobileUXAuditor')
    .then(mod => ({ default: mod.MobileUXAuditor }))
    .catch(() => ({ default: () => <div /> }))
);

const AccessibilityAuditPanel = React.lazy(() => 
  import('@/components/accessibility/AccessibilityAuditPanel')
    .then(mod => ({ default: mod.default }))
    .catch(() => ({ default: () => <div /> }))
);

export default function ClientAnalytics() {
  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <>
      <Suspense fallback={null}>
        <LazyOnScroll>
          <CognitiveLoadAuditor />
        </LazyOnScroll>
        <LazyOnScroll>
          <MobileUXAuditor />
        </LazyOnScroll>
        <LazyOnScroll>
          <AccessibilityAuditPanel />
        </LazyOnScroll>
      </Suspense>
    </>
  );
}