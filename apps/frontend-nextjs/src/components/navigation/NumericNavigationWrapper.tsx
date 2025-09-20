'use client';

import React from 'react';
import { useNumericNavigation } from '@/hooks/useNumericNavigation';
import NumericNavigationHint from '@/components/navigation/NumericNavigationHint';

interface NumericNavigationWrapperProps {
  enabled?: boolean;
  showHint?: boolean;
  hintPosition?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
}

export default function NumericNavigationWrapper({
  enabled = true,
  showHint = true,
  hintPosition = 'bottom-right'
}: NumericNavigationWrapperProps): React.JSX.Element | null {
  
  // Initialize numeric navigation hook
  useNumericNavigation({ 
    enabled: enabled, 
    showNotifications: true 
  });

  if (!showHint) {
    return null;
  }

  return (
    <NumericNavigationHint 
      visible={enabled}
      position={hintPosition}
      autoHide={true}
      autoHideDelay={8000}
      showOnlyWhenActive={true}
    />
  );
}