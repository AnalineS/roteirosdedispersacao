'use client';

import React from 'react';
import { useToast, ToastContainer } from '@/components/ui/MicroInteractions';

export default function ClientToastContainer() {
  const { toasts } = useToast();
  
  return <ToastContainer toasts={toasts} />;
}